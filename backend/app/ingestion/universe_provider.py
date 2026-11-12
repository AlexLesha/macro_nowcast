"""
backend/app/ingestion/universe_provider.py
==========================================
Free Liquid US Equity Universe & Nasdaq Earnings Calendar Blackout Provider.

Features:
1. Constituents: S&P 500, S&P 400 MidCap, and Nasdaq 100 constituent tables scraped via Wikipedia
   (pd.read_html) + bundled institutional fallback (~950 symbols total).
2. Maps each ticker's GICS Sector to its representative SPDR Sector ETF
   (XLK, XLF, XLE, XLV, XLI, XLY, XLP, XLU, XLB, XLRE, XLC).
3. Local Caching: SQLite / StockCompressedStore table with 7-day TTL.
4. Earnings Blackout: Free Nasdaq Earnings Calendar endpoint
   (https://api.nasdaq.com/api/calendar/earnings?date=YYYY-MM-DD) across [today - 3d, today + 4d].
"""

import os
import io
import time
import logging
from datetime import datetime, timezone, timedelta, date
from typing import Dict, Any, List, Optional, Set
import pandas as pd
import httpx

logger = logging.getLogger("macropulse.universe_provider")

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

HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Fast In-Memory Cache
_UNIVERSE_CACHE: Dict[str, Any] = {
    "tickers": [],
    "ticker_map": {},
    "timestamp": 0.0,
    "ttl_sec": 7 * 86400,  # 7 Days
}

_EARNINGS_BLACKOUT_CACHE: Dict[str, Any] = {
    "blackout_tickers": set(),
    "events": [],
    "timestamp": 0.0,
    "ttl_sec": 14400,  # 4 Hours
}


class UniverseProvider:
    """Manages free universe constituents and earnings blackout calendar."""

    @classmethod
    def scrape_sp500_wikipedia(cls) -> List[Dict[str, str]]:
        """Scrapes S&P 500 constituents and GICS sectors from Wikipedia."""
        url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        res: List[Dict[str, str]] = []
        try:
            with httpx.Client(headers=HTTP_HEADERS, timeout=8.0, follow_redirects=True) as client:
                r = client.get(url)
                if r.status_code == 200:
                    tables = pd.read_html(io.StringIO(r.text))
                    if tables:
                        df = tables[0]
                        sym_col = "Symbol" if "Symbol" in df.columns else df.columns[0]
                        sec_col = "GICS Sector" if "GICS Sector" in df.columns else (
                            "GICS\xa0Sector" if "GICS\xa0Sector" in df.columns else None
                        )
                        name_col = "Security" if "Security" in df.columns else (
                            "Company" if "Company" in df.columns else sym_col
                        )
                        for _, row in df.iterrows():
                            raw_sym = str(row[sym_col]).strip().replace(".", "-").upper()
                            sec = str(row[sec_col]).strip() if sec_col and pd.notnull(row[sec_col]) else "Information Technology"
                            nm = str(row[name_col]).strip() if pd.notnull(row[name_col]) else raw_sym
                            if raw_sym and len(raw_sym) <= 6:
                                res.append({
                                    "ticker": raw_sym,
                                    "name": nm,
                                    "sector": sec,
                                    "sector_etf": GICS_SECTOR_TO_ETF.get(sec, "XLK"),
                                })
        except Exception as e:
            logger.debug(f"[UniverseProvider] S&P 500 Wikipedia scrape notice: {e}")
        return res

    @classmethod
    def scrape_sp400_wikipedia(cls) -> List[Dict[str, str]]:
        """Scrapes S&P 400 MidCap constituents and GICS sectors from Wikipedia."""
        url = "https://en.wikipedia.org/wiki/List_of_S%26P_400_companies"
        res: List[Dict[str, str]] = []
        try:
            with httpx.Client(headers=HTTP_HEADERS, timeout=8.0, follow_redirects=True) as client:
                r = client.get(url)
                if r.status_code == 200:
                    tables = pd.read_html(io.StringIO(r.text))
                    if tables:
                        df = tables[0]
                        sym_col = "Ticker symbol" if "Ticker symbol" in df.columns else (
                            "Symbol" if "Symbol" in df.columns else df.columns[0]
                        )
                        sec_col = "GICS Sector" if "GICS Sector" in df.columns else None
                        name_col = "Security" if "Security" in df.columns else (
                            "Company" if "Company" in df.columns else sym_col
                        )
                        for _, row in df.iterrows():
                            raw_sym = str(row[sym_col]).strip().replace(".", "-").upper()
                            sec = str(row[sec_col]).strip() if sec_col and pd.notnull(row[sec_col]) else "Industrials"
                            nm = str(row[name_col]).strip() if pd.notnull(row[name_col]) else raw_sym
                            if raw_sym and len(raw_sym) <= 6:
                                res.append({
                                    "ticker": raw_sym,
                                    "name": nm,
                                    "sector": sec,
                                    "sector_etf": GICS_SECTOR_TO_ETF.get(sec, "XLI"),
                                })
        except Exception as e:
            logger.debug(f"[UniverseProvider] S&P 400 Wikipedia scrape notice: {e}")
        return res

    @classmethod
    def scrape_nasdaq100_wikipedia(cls) -> List[Dict[str, str]]:
        """Scrapes Nasdaq 100 constituents from Wikipedia."""
        url = "https://en.wikipedia.org/wiki/Nasdaq-100"
        res: List[Dict[str, str]] = []
        try:
            with httpx.Client(headers=HTTP_HEADERS, timeout=8.0, follow_redirects=True) as client:
                r = client.get(url)
                if r.status_code == 200:
                    tables = pd.read_html(io.StringIO(r.text))
                    for t in tables:
                        if "Ticker" in t.columns or "Symbol" in t.columns:
                            sym_col = "Ticker" if "Ticker" in t.columns else "Symbol"
                            sec_col = "GICS Sector" if "GICS Sector" in t.columns else None
                            name_col = "Company" if "Company" in t.columns else sym_col
                            for _, row in t.iterrows():
                                raw_sym = str(row[sym_col]).strip().replace(".", "-").upper()
                                sec = str(row[sec_col]).strip() if sec_col and pd.notnull(row[sec_col]) else "Information Technology"
                                nm = str(row[name_col]).strip() if pd.notnull(row[name_col]) else raw_sym
                                if raw_sym and len(raw_sym) <= 6:
                                    res.append({
                                        "ticker": raw_sym,
                                        "name": nm,
                                        "sector": sec,
                                        "sector_etf": GICS_SECTOR_TO_ETF.get(sec, "XLK"),
                                    })
                            break
        except Exception as e:
            logger.debug(f"[UniverseProvider] Nasdaq 100 Wikipedia scrape notice: {e}")
        return res

    @classmethod
    def get_liquid_universe(cls, force_refresh: bool = False) -> List[Dict[str, str]]:
        """
        Retrieves canonical liquid universe (~950 US stocks + ETFs).
        Checks:
          1. Memory cache (7-day TTL)
          2. SQLite / StockCompressedStore DB cache
          3. Live Wikipedia scrape aggregation (SP500 + SP400 + NDX100)
        """
        now = time.time()
        if not force_refresh and _UNIVERSE_CACHE["tickers"] and (now - _UNIVERSE_CACHE["timestamp"]) < _UNIVERSE_CACHE["ttl_sec"]:
            return _UNIVERSE_CACHE["tickers"]

        # Check DB Cache
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

        combined: Dict[str, Dict[str, str]] = {}

        # Add S&P 500
        sp500 = cls.scrape_sp500_wikipedia()
        for item in sp500:
            combined[item["ticker"]] = item

        # Add S&P 400
        sp400 = cls.scrape_sp400_wikipedia()
        for item in sp400:
            if item["ticker"] not in combined:
                combined[item["ticker"]] = item

        # Add Nasdaq 100
        ndx = cls.scrape_nasdaq100_wikipedia()
        for item in ndx:
            if item["ticker"] not in combined:
                combined[item["ticker"]] = item

        # If scrapes returned fewer than 50 (e.g. rate limit), pull bundled fallback
        if len(combined) < 50:
            try:
                try:
                    from backend.app.quant_engine.universe_provider import CORE_REPRESENTATIVE_UNIVERSE
                except ImportError:
                    from app.quant_engine.universe_provider import CORE_REPRESENTATIVE_UNIVERSE
                for item in CORE_REPRESENTATIVE_UNIVERSE:
                    combined[item["ticker"]] = item
            except Exception:
                pass

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
            logger.info(f"[UniverseProvider] Persisted {len(universe_list)} symbols to DB cache.")
        except Exception as e:
            logger.debug(f"[UniverseProvider] DB save notice: {e}")

        return universe_list

    @classmethod
    def fetch_nasdaq_earnings_calendar(cls, target_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """Fetches earnings calendar events from the free Nasdaq JSON API."""
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
                            })
        except Exception as e:
            logger.debug(f"[UniverseProvider] Nasdaq earnings fetch notice for {date_str}: {e}")
        return events

    @classmethod
    def get_earnings_blackout_tickers(cls, days_buffer: int = 3, force_refresh: bool = False) -> Set[str]:
        """
        Returns all tickers reporting earnings across [today - 3d, today + 4d].
        Candidates reporting within this window are strictly BLACKLISTED.
        """
        now = time.time()
        if not force_refresh and _EARNINGS_BLACKOUT_CACHE["blackout_tickers"] and (now - _EARNINGS_BLACKOUT_CACHE["timestamp"]) < _EARNINGS_BLACKOUT_CACHE["ttl_sec"]:
            return set(_EARNINGS_BLACKOUT_CACHE["blackout_tickers"])

        today = datetime.now(timezone.utc).date()
        blackout_set: Set[str] = set()

        # Query across [today - 3d, today + 4d]
        for offset in range(-3, days_buffer + 2):
            scan_date = today + timedelta(days=offset)
            if scan_date.weekday() >= 5:  # Skip weekends
                continue
            evs = cls.fetch_nasdaq_earnings_calendar(scan_date)
            for ev in evs:
                blackout_set.add(ev["ticker"])

        _EARNINGS_BLACKOUT_CACHE["blackout_tickers"] = blackout_set
        _EARNINGS_BLACKOUT_CACHE["timestamp"] = now
        logger.info(f"[UniverseProvider] Compiled earnings blackout filter: {len(blackout_set)} tickers excluded.")
        return blackout_set

    # Backward-compatible alias
    @classmethod
    def get_blackout_tickers(cls, days_window: int = 3, force_refresh: bool = False) -> Set[str]:
        return cls.get_earnings_blackout_tickers(days_buffer=days_window, force_refresh=force_refresh)

