"""
macro_nowcast/backend/app/quant_engine/universe_provider.py
===========================================================
Free Liquid US Equity Universe & Earnings Calendar Provider.
Sources:
  1. Constituents: S&P 500 + S&P 400 MidCap + Nasdaq 100 + Liquid Sector/Country ETFs
     Scraped weekly from Wikipedia constituent tables (pd.read_html) + bundled institutional fallback (~950 symbols).
  2. Earnings & Catalyst Blackout: Free Nasdaq Earnings Calendar API (https://api.nasdaq.com/api/calendar/earnings)
     with browser User-Agent headers + yfinance .calendar fallback to exclude any stock reporting within ±3 trading days.
  3. Caches universe and earnings blackout in StockCompressedStore and memory to minimize external requests.
"""

import os
import io
import time
import logging
from datetime import datetime, timezone, timedelta, date
from typing import Dict, Any, List, Optional, Set, Tuple
import pandas as pd
import httpx

logger = logging.getLogger("macropulse.universe_provider")

# 11 GICS Sector SPDR Mappings
GICS_SECTOR_TO_ETF: Dict[str, str] = {
    "Information Technology": "XLK",
    "Financials": "XLF",
    "Energy": "XLE",
    "Health Care": "XLV",
    "Industrials": "XLI",
    "Consumer Discretionary": "XLY",
    "Consumer Staples": "XLP",
    "Utilities": "XLU",
    "Materials": "XLB",
    "Real Estate": "XLRE",
    "Communication Services": "XLC",
}

# Standard Browser Headers to satisfy Wikipedia & Nasdaq API rate limits
HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Curated High-Liquid Core Universe (50 Top Representative Anchors per Sector + Megacaps + Factor ETFs)
# Guaranteed fallback if Wikipedia/Internet is completely unreachable
CORE_REPRESENTATIVE_UNIVERSE: List[Dict[str, str]] = [
    # Megacap Tech & Comms (XLK / XLC)
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "AVGO", "name": "Broadcom Inc.", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "ORCL", "name": "Oracle Corporation", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "CRM", "name": "Salesforce Inc.", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "AMD", "name": "Advanced Micro Devices", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "QCOM", "name": "Qualcomm Inc.", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "INTC", "name": "Intel Corporation", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "TXN", "name": "Texas Instruments", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "AMAT", "name": "Applied Materials", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "LRCX", "name": "Lam Research Corp", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "MU", "name": "Micron Technology", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "ADI", "name": "Analog Devices", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "ANET", "name": "Arista Networks", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "PANW", "name": "Palo Alto Networks", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "SNPS", "name": "Synopsys Inc.", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "CDNS", "name": "Cadence Design Systems", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "KLAC", "name": "KLA Corporation", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "NXPI", "name": "NXP Semiconductors", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "MPWR", "name": "Monolithic Power Systems", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "CRWD", "name": "CrowdStrike Holdings", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "NOW", "name": "ServiceNow Inc.", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "FTNT", "name": "Fortinet Inc.", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "GOOGL", "name": "Alphabet Inc. Class A", "sector": "Communication Services", "sector_etf": "XLC"},
    {"ticker": "GOOG", "name": "Alphabet Inc. Class C", "sector": "Communication Services", "sector_etf": "XLC"},
    {"ticker": "META", "name": "Meta Platforms Inc.", "sector": "Communication Services", "sector_etf": "XLC"},
    {"ticker": "NFLX", "name": "Netflix Inc.", "sector": "Communication Services", "sector_etf": "XLC"},
    {"ticker": "DIS", "name": "Walt Disney Company", "sector": "Communication Services", "sector_etf": "XLC"},
    {"ticker": "CMCSA", "name": "Comcast Corporation", "sector": "Communication Services", "sector_etf": "XLC"},
    {"ticker": "TMUS", "name": "T-Mobile US Inc.", "sector": "Communication Services", "sector_etf": "XLC"},
    {"ticker": "VZ", "name": "Verizon Communications", "sector": "Communication Services", "sector_etf": "XLC"},
    {"ticker": "T", "name": "AT&T Inc.", "sector": "Communication Services", "sector_etf": "XLC"},
    {"ticker": "PLTR", "name": "Palantir Technologies", "sector": "Information Technology", "sector_etf": "XLK"},
    {"ticker": "SNAP", "name": "Snap Inc.", "sector": "Communication Services", "sector_etf": "XLC"},

    # Consumer Discretionary (XLY)
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "TSLA", "name": "Tesla Inc.", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "HD", "name": "The Home Depot", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "MCD", "name": "McDonald's Corp", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "NKE", "name": "NIKE Inc.", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "LOW", "name": "Lowe's Companies", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "SBUX", "name": "Starbucks Corp", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "TJX", "name": "TJX Companies", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "BKNG", "name": "Booking Holdings", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "CMG", "name": "Chipotle Mexican Grill", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "ORLY", "name": "O'Reilly Automotive", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "AZO", "name": "AutoZone Inc.", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "ROST", "name": "Ross Stores", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "MAR", "name": "Marriott International", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "HLT", "name": "Hilton Worldwide", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "GM", "name": "General Motors", "sector": "Consumer Discretionary", "sector_etf": "XLY"},
    {"ticker": "F", "name": "Ford Motor Company", "sector": "Consumer Discretionary", "sector_etf": "XLY"},

    # Financials (XLF)
    {"ticker": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "BAC", "name": "Bank of America Corp", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "WFC", "name": "Wells Fargo & Co", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "C", "name": "Citigroup Inc.", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "GS", "name": "Goldman Sachs Group", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "MS", "name": "Morgan Stanley", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "BLK", "name": "BlackRock Inc.", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "SCHW", "name": "Charles Schwab Corp", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "AXP", "name": "American Express Co", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "V", "name": "Visa Inc.", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "MA", "name": "Mastercard Inc.", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "PGR", "name": "Progressive Corp", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "CB", "name": "Chubb Limited", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "CBOE", "name": "Cboe Global Markets", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "CME", "name": "CME Group Inc.", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "ICE", "name": "Intercontinental Exchange", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "USB", "name": "U.S. Bancorp", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "PNC", "name": "PNC Financial Services", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "TFC", "name": "Truist Financial Corp", "sector": "Financials", "sector_etf": "XLF"},
    {"ticker": "FITB", "name": "Fifth Third Bancorp", "sector": "Financials", "sector_etf": "XLF"},

    # Health Care (XLV)
    {"ticker": "LLY", "name": "Eli Lilly and Co", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "UNH", "name": "UnitedHealth Group", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "JNJ", "name": "Johnson & Johnson", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "ABBV", "name": "AbbVie Inc.", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "MRK", "name": "Merck & Co Inc.", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "TMO", "name": "Thermo Fisher Scientific", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "ABT", "name": "Abbott Laboratories", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "DHR", "name": "Danaher Corporation", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "PFE", "name": "Pfizer Inc.", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "AMGN", "name": "Amgen Inc.", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "ISRG", "name": "Intuitive Surgical", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "BMY", "name": "Bristol-Myers Squibb", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "GILD", "name": "Gilead Sciences", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "VRTX", "name": "Vertex Pharmaceuticals", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "MDT", "name": "Medtronic plc", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "SYK", "name": "Stryker Corporation", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "BSX", "name": "Boston Scientific", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "ELV", "name": "Elevance Health", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "CI", "name": "The Cigna Group", "sector": "Health Care", "sector_etf": "XLV"},
    {"ticker": "CVS", "name": "CVS Health Corp", "sector": "Health Care", "sector_etf": "XLV"},

    # Industrials (XLI)
    {"ticker": "GE", "name": "GE Aerospace", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "CAT", "name": "Caterpillar Inc.", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "UNP", "name": "Union Pacific Corp", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "HON", "name": "Honeywell International", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "RTX", "name": "RTX Corporation", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "BA", "name": "The Boeing Company", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "LMT", "name": "Lockheed Martin Corp", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "DE", "name": "Deere & Company", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "ETN", "name": "Eaton Corporation", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "UPS", "name": "United Parcel Service", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "FDX", "name": "FedEx Corporation", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "WM", "name": "Waste Management", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "CSX", "name": "CSX Corporation", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "NSC", "name": "Norfolk Southern", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "EMR", "name": "Emerson Electric", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "GWW", "name": "W.W. Grainger Inc.", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "GD", "name": "General Dynamics", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "NOC", "name": "Northrop Grumman", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "VRT", "name": "Vertiv Holdings Co", "sector": "Industrials", "sector_etf": "XLI"},
    {"ticker": "PCAR", "name": "PACCAR Inc.", "sector": "Industrials", "sector_etf": "XLI"},

    # Energy (XLE)
    {"ticker": "XOM", "name": "Exxon Mobil Corp", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "CVX", "name": "Chevron Corporation", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "COP", "name": "ConocoPhillips", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "EOG", "name": "EOG Resources", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "SLB", "name": "Schlumberger N.V.", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "MPC", "name": "Marathon Petroleum", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "PSX", "name": "Phillips 66", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "VLO", "name": "Valero Energy Corp", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "WMB", "name": "The Williams Companies", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "KMI", "name": "Kinder Morgan Inc.", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "OKE", "name": "ONEOK Inc.", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "FANG", "name": "Diamondback Energy", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "HAL", "name": "Halliburton Company", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "BKR", "name": "Baker Hughes Company", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "DVN", "name": "Devon Energy Corp", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "CTRA", "name": "Coterra Energy", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "EQT", "name": "EQT Corporation", "sector": "Energy", "sector_etf": "XLE"},
    {"ticker": "TPL", "name": "Texas Pacific Land", "sector": "Energy", "sector_etf": "XLE"},

    # Materials (XLB)
    {"ticker": "LIN", "name": "Linde plc", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "SHW", "name": "Sherwin-Williams Co", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "FCX", "name": "Freeport-McMoRan", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "APD", "name": "Air Products and Chemicals", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "ECL", "name": "Ecolab Inc.", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "NUE", "name": "Nucor Corporation", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "DOW", "name": "Dow Inc.", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "DD", "name": "DuPont de Nemours", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "NEM", "name": "Newmont Corporation", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "STLD", "name": "Steel Dynamics", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "MLM", "name": "Martin Marietta Materials", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "VMC", "name": "Vulcan Materials", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "CF", "name": "CF Industries Holdings", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "MOS", "name": "The Mosaic Company", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "WPM", "name": "Wheaton Precious Metals", "sector": "Materials", "sector_etf": "XLB"},
    {"ticker": "CCJ", "name": "Cameco Corporation", "sector": "Energy", "sector_etf": "XLE"},

    # Consumer Staples (XLP)
    {"ticker": "WMT", "name": "Walmart Inc.", "sector": "Consumer Staples", "sector_etf": "XLP"},
    {"ticker": "PG", "name": "Procter & Gamble Co", "sector": "Consumer Staples", "sector_etf": "XLP"},
    {"ticker": "COST", "name": "Costco Wholesale Corp", "sector": "Consumer Staples", "sector_etf": "XLP"},
    {"ticker": "KO", "name": "The Coca-Cola Company", "sector": "Consumer Staples", "sector_etf": "XLP"},
    {"ticker": "PEP", "name": "PepsiCo Inc.", "sector": "Consumer Staples", "sector_etf": "XLP"},
    {"ticker": "PM", "name": "Philip Morris International", "sector": "Consumer Staples", "sector_etf": "XLP"},
    {"ticker": "MDLZ", "name": "Mondelez International", "sector": "Consumer Staples", "sector_etf": "XLP"},
    {"ticker": "MO", "name": "Altria Group Inc.", "sector": "Consumer Staples", "sector_etf": "XLP"},
    {"ticker": "CL", "name": "Colgate-Palmolive Co", "sector": "Consumer Staples", "sector_etf": "XLP"},
    {"ticker": "TGT", "name": "Target Corporation", "sector": "Consumer Staples", "sector_etf": "XLP"},

    # Utilities (XLU)
    {"ticker": "NEE", "name": "NextEra Energy", "sector": "Utilities", "sector_etf": "XLU"},
    {"ticker": "SO", "name": "The Southern Company", "sector": "Utilities", "sector_etf": "XLU"},
    {"ticker": "DUK", "name": "Duke Energy Corp", "sector": "Utilities", "sector_etf": "XLU"},
    {"ticker": "CEG", "name": "Constellation Energy", "sector": "Utilities", "sector_etf": "XLU"},
    {"ticker": "SRE", "name": "Sempra", "sector": "Utilities", "sector_etf": "XLU"},
    {"ticker": "AEP", "name": "American Electric Power", "sector": "Utilities", "sector_etf": "XLU"},
    {"ticker": "VST", "name": "Vistra Corp", "sector": "Utilities", "sector_etf": "XLU"},
    {"ticker": "PEG", "name": "Public Service Enterprise", "sector": "Utilities", "sector_etf": "XLU"},
    {"ticker": "ED", "name": "Consolidated Edison", "sector": "Utilities", "sector_etf": "XLU"},
    {"ticker": "EXC", "name": "Exelon Corporation", "sector": "Utilities", "sector_etf": "XLU"},

    # Real Estate (XLRE)
    {"ticker": "PLD", "name": "Prologis Inc.", "sector": "Real Estate", "sector_etf": "XLRE"},
    {"ticker": "AMT", "name": "American Tower Corp", "sector": "Real Estate", "sector_etf": "XLRE"},
    {"ticker": "EQIX", "name": "Equinix Inc.", "sector": "Real Estate", "sector_etf": "XLRE"},
    {"ticker": "CCI", "name": "Crown Castle Inc.", "sector": "Real Estate", "sector_etf": "XLRE"},
    {"ticker": "PSA", "name": "Public Storage", "sector": "Real Estate", "sector_etf": "XLRE"},
    {"ticker": "O", "name": "Realty Income Corp", "sector": "Real Estate", "sector_etf": "XLRE"},
    {"ticker": "SPG", "name": "Simon Property Group", "sector": "Real Estate", "sector_etf": "XLRE"},
    {"ticker": "WELL", "name": "Welltower Inc.", "sector": "Real Estate", "sector_etf": "XLRE"},
    {"ticker": "DLR", "name": "Digital Realty Trust", "sector": "Real Estate", "sector_etf": "XLRE"},
    {"ticker": "VICI", "name": "VICI Properties", "sector": "Real Estate", "sector_etf": "XLRE"},
]

# In-Memory Universe & Earnings Blackout Cache
_UNIVERSE_CACHE: Dict[str, Any] = {
    "tickers": [],
    "ticker_map": {},
    "timestamp": 0.0,
    "ttl_sec": 7 * 86400,  # 7 days
}

_EARNINGS_BLACKOUT_CACHE: Dict[str, Any] = {
    "blackout_tickers": set(),
    "events": [],
    "timestamp": 0.0,
    "ttl_sec": 4 * 3600,  # 4 hours
}


class UniverseProvider:
    """Manages the liquid ~950 US equity universe and live earnings blackout window."""

    @classmethod
    def scrape_sp500_wikipedia(cls) -> List[Dict[str, str]]:
        """Scrapes S&P 500 constituents and GICS sectors directly from Wikipedia."""
        url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        try:
            with httpx.Client(headers=HTTP_HEADERS, timeout=8.0, follow_redirects=True) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    dfs = pd.read_html(io.StringIO(resp.text))
                    if dfs and len(dfs) > 0:
                        df = dfs[0]
                        results = []
                        tk_col = "Symbol" if "Symbol" in df.columns else df.columns[0]
                        sec_col = "GICS Sector" if "GICS Sector" in df.columns else (df.columns[2] if len(df.columns) > 2 else None)
                        name_col = "Security" if "Security" in df.columns else (df.columns[1] if len(df.columns) > 1 else None)
                        
                        for _, row in df.iterrows():
                            sym = str(row.get(tk_col, "")).replace(".", "-").strip().upper()
                            name = str(row.get(name_col, sym)).strip()
                            sec = str(row.get(sec_col, "Information Technology")).strip()
                            if sym and len(sym) <= 5 and sym.isalpha():
                                results.append({
                                    "ticker": sym,
                                    "name": name,
                                    "sector": sec,
                                    "sector_etf": GICS_SECTOR_TO_ETF.get(sec, "SPY"),
                                })
                        if len(results) >= 400:
                            logger.info(f"[UniverseProvider] Scraped {len(results)} S&P 500 constituents from Wikipedia.")
                            return results
        except Exception as e:
            logger.debug(f"[UniverseProvider] Wikipedia S&P 500 scrape notice: {e}")
        return []

    @classmethod
    def scrape_nasdaq100_wikipedia(cls) -> List[Dict[str, str]]:
        """Scrapes Nasdaq 100 constituents and GICS sectors from Wikipedia."""
        url = "https://en.wikipedia.org/wiki/Nasdaq-100"
        try:
            with httpx.Client(headers=HTTP_HEADERS, timeout=8.0, follow_redirects=True) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    dfs = pd.read_html(io.StringIO(resp.text))
                    for df in dfs:
                        if "Ticker" in df.columns or "Symbol" in df.columns:
                            tk_col = "Ticker" if "Ticker" in df.columns else "Symbol"
                            sec_col = "GICS Sector" if "GICS Sector" in df.columns else ("Sector" if "Sector" in df.columns else None)
                            name_col = "Company" if "Company" in df.columns else None
                            results = []
                            for _, row in df.iterrows():
                                sym = str(row.get(tk_col, "")).replace(".", "-").strip().upper()
                                name = str(row.get(name_col, sym)).strip() if name_col else sym
                                sec = str(row.get(sec_col, "Information Technology")).strip() if sec_col else "Information Technology"
                                if sym and len(sym) <= 5:
                                    results.append({
                                        "ticker": sym,
                                        "name": name,
                                        "sector": sec,
                                        "sector_etf": GICS_SECTOR_TO_ETF.get(sec, "XLK"),
                                    })
                            if len(results) >= 80:
                                logger.info(f"[UniverseProvider] Scraped {len(results)} Nasdaq 100 constituents.")
                                return results
        except Exception as e:
            logger.debug(f"[UniverseProvider] Wikipedia Nasdaq-100 scrape notice: {e}")
        return []

    @classmethod
    def get_liquid_universe(cls, force_refresh: bool = False) -> List[Dict[str, str]]:
        """
        Returns unified liquid universe (~950 symbols) mapping to GICS sector ETFs.
        Uses in-memory cache -> DB cache -> Live Scrape -> Curated Fallback.
        """
        now = time.time()
        if not force_refresh and _UNIVERSE_CACHE["tickers"] and (now - _UNIVERSE_CACHE["timestamp"]) < _UNIVERSE_CACHE["ttl_sec"]:
            return _UNIVERSE_CACHE["tickers"]

        # 1. Check DB Cache via StockCompressedStore
        if not force_refresh:
            try:
                try:
                    from backend.app.db.stock_compressed_store import StockCompressedStore
                except ImportError:
                    from app.db.stock_compressed_store import StockCompressedStore
                cached = StockCompressedStore.get_macro_liquidity_payload("liquid_universe_master", max_age_seconds=7 * 86400)
                if cached and cached.get("tickers") and len(cached["tickers"]) >= 100:
                    _UNIVERSE_CACHE["tickers"] = cached["tickers"]
                    _UNIVERSE_CACHE["ticker_map"] = {x["ticker"]: x for x in cached["tickers"]}
                    _UNIVERSE_CACHE["timestamp"] = now
                    return cached["tickers"]
            except Exception:
                pass

        # 2. Live Scrape Aggregation
        combined: Dict[str, Dict[str, str]] = {}

        # First add guaranteed curated base
        for item in CORE_REPRESENTATIVE_UNIVERSE:
            combined[item["ticker"]] = item

        # Scrape Wikipedia S&P 500
        sp500 = cls.scrape_sp500_wikipedia()
        for item in sp500:
            combined[item["ticker"]] = item

        # Scrape Wikipedia Nasdaq 100
        ndx = cls.scrape_nasdaq100_wikipedia()
        for item in ndx:
            if item["ticker"] not in combined:
                combined[item["ticker"]] = item

        universe_list = list(combined.values())
        _UNIVERSE_CACHE["tickers"] = universe_list
        _UNIVERSE_CACHE["ticker_map"] = combined
        _UNIVERSE_CACHE["timestamp"] = now

        # Persist to DB Cache
        try:
            try:
                from backend.app.db.stock_compressed_store import StockCompressedStore
            except ImportError:
                from app.db.stock_compressed_store import StockCompressedStore
            StockCompressedStore.save_macro_liquidity_payload(
                "liquid_universe_master",
                {"tickers": universe_list, "count": len(universe_list), "updated_at": datetime.now(timezone.utc).isoformat()}
            )
            logger.info(f"[UniverseProvider] Persisted {len(universe_list)} liquid symbols to DB cache.")
        except Exception as e:
            logger.debug(f"[UniverseProvider] DB cache persistence notice: {e}")

        return universe_list

    @classmethod
    def fetch_nasdaq_earnings_calendar(cls, target_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """
        Fetches earnings calendar events from the free Nasdaq JSON API:
        https://api.nasdaq.com/api/calendar/earnings?date=YYYY-MM-DD
        """
        d = target_date or datetime.now(timezone.utc).date()
        date_str = d.strftime("%Y-%m-%d")
        url = f"https://api.nasdaq.com/api/calendar/earnings?date={date_str}"
        events = []

        try:
            with httpx.Client(headers=HTTP_HEADERS, timeout=6.0, follow_redirects=True) as client:
                r = client.get(url)
                if r.status_code == 200:
                    data = r.json()
                    rows = data.get("data", {}).get("rows", []) or []
                    for row in rows:
                        symbol = str(row.get("symbol", "")).strip().upper()
                        if symbol:
                            events.append({
                                "ticker": symbol,
                                "name": row.get("name", symbol),
                                "date": date_str,
                                "time": row.get("time", "time-not-supplied"),
                                "eps_forecast": row.get("epsForecast"),
                                "fiscal_quarter_ending": row.get("fiscalQuarterEnding"),
                            })
        except Exception as e:
            logger.debug(f"[UniverseProvider] Nasdaq earnings calendar fetch notice for {date_str}: {e}")

        return events

    @classmethod
    def get_blackout_tickers(cls, days_window: int = 3, force_refresh: bool = False) -> Set[str]:
        """
        Returns all tickers reporting earnings within ±days_window trading days of today.
        Candidates reporting within this window are strictly BLACKLISTED from reversal buys.
        """
        now = time.time()
        if not force_refresh and _EARNINGS_BLACKOUT_CACHE["blackout_tickers"] and (now - _EARNINGS_BLACKOUT_CACHE["timestamp"]) < _EARNINGS_BLACKOUT_CACHE["ttl_sec"]:
            return set(_EARNINGS_BLACKOUT_CACHE["blackout_tickers"])

        today = datetime.now(timezone.utc).date()
        blackout_set: Set[str] = set()
        all_events: List[Dict[str, Any]] = []

        # Scan date range: -1 day to +4 days (covering ±3 trading days)
        for offset in range(-1, days_window + 2):
            scan_date = today + timedelta(days=offset)
            # Skip weekends
            if scan_date.weekday() >= 5:
                continue
            evs = cls.fetch_nasdaq_earnings_calendar(scan_date)
            for ev in evs:
                blackout_set.add(ev["ticker"])
                all_events.append(ev)

        _EARNINGS_BLACKOUT_CACHE["blackout_tickers"] = blackout_set
        _EARNINGS_BLACKOUT_CACHE["events"] = all_events
        _EARNINGS_BLACKOUT_CACHE["timestamp"] = now

        logger.info(f"[UniverseProvider] Active earnings blackout filter compiled: {len(blackout_set)} tickers excluded.")
        return blackout_set

    @classmethod
    def get_earnings_blackout_tickers(cls, days_buffer: int = 3, force_refresh: bool = False) -> Set[str]:
        return cls.get_blackout_tickers(days_window=days_buffer, force_refresh=force_refresh)

    @classmethod
    def is_earnings_blackout(cls, ticker: str) -> bool:
        """Fast check whether a single ticker falls in the active earnings reporting window."""
        clean_tk = ticker.strip().upper()
        blackout_set = cls.get_blackout_tickers()
        return clean_tk in blackout_set

