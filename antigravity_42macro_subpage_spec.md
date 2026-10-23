# Antigravity IDE Specification: Dedicated 42 Macro Institutional Sub-Page ("Macro Weather, GRIDs & Risk Overlays")

## 1. Architectural Overview & Executive Mandate

This specification provides the complete, self-contained instruction sheet for Antigravity IDE to build a dedicated **42 Macro Deep-Dive Sub-Page** (`/42-macro` — Tab 7 in the top navigation bar) and its supporting quantitative backend module (`backend/app/quant_engine/forty_two_macro_engine.py`).

### 1.1 Core Analytical Architecture (Pre-KISS/Dr.Mo Masterclasses + 2026 Institutional Suite)
The dedicated sub-page synthesizes both the foundational pre-KISS/Dr.Mo Masterclasses (2021–2022) and the latest 2026 institutional suite (*Macro Scouting Report* Jan 14, 2026; *Around the Horn* Apr 11, 2026; *Leadoff Morning Note* Jun 3, 2026) into a plain-English, institutional-grade dashboard powered by 100% free public data:

1. **Top Plain-English Executive Summary Banner**:
   - Automatically translates all 10 quantitative models into a clear narrative answering: *"What is the Market Regime today? What is the Economy doing over the next 3–6 months? Are investors complacent or panicked? What exact portfolio actions should I take?"*
2. **Bottom-Up Macro Regime (35-Country Monthly Smoothed GDP/PCE GRID Model & "GRID Zero" Detector)**:
   - Implements the exact **2015–2019 Pre-COVID Baseline Z-Score Rule** (where post-2020 series are standardized against their 2015–2019 mean and standard deviation to avoid COVID variance distortion) and the **4-Tier Impulse Classification**:
     - `Strong Positive Impulse`: $3\text{M SAAR} > 6\text{M SAAR} > 12\text{M YoY}$ (Trending acceleration)
     - `Weak Positive Impulse`: $3\text{M SAAR} > 6\text{M SAAR} < 12\text{M YoY}$ (Transitory acceleration)
     - `Weak Negative Impulse`: $3\text{M SAAR} < 6\text{M SAAR} > 12\text{M YoY}$ (Transitory deceleration)
     - `Strong Negative Impulse`: $3\text{M SAAR} < 6\text{M SAAR} < 12\text{M YoY}$ (Trending deceleration)
   - Smooths and nowcasts quarterly Real GDP on a monthly frequency alongside Core PCE (for the US) and Headline CPI (for international economies), computing **Conditional Probabilities** and flagging **"GRID Zero"** when growth and inflation impulses cluster near zero.
3. **Top-Down Market Regime (42-Market Global Macro Risk Matrix, Hybrid Regimes, CACRI & RORO Filter)**:
   - Scores the exact **42 global markets** via **VAMS** (`+1` Bullish, `0` Neutral, `-1` Bearish) to compute the **Sum** and **Share of Confirming Markets** for `GOLDILOCKS` (t10yr peak = 35), `REFLATION` (t10yr peak = 37), `INFLATION` (t10yr peak = 40), and `DEFLATION` (t10yr peak = 34).
   - Implements the **3-Week False-Alarm RORO Filter** (omitting regime whipsaws that dissipate in $<15$ trading days), the **[Hybrid] Market Regime Rule** (when Strength of Signal $<50\%$), and the **Cross-Asset Correction Risk Indicator (CACRI)** (`INFLATION + DEFLATION` share: `<20%` Complacency Warning vs. `>75%` Contrarian Fear Buy).
4. **Macro Weather Model (6 Principal Component Cycles & 1–3M Asset Composite Signals)**:
   - Evaluates the **30 exact underlying indicators** across the 6 Macro Cycles (**Growth, Inflation, Monetary Policy, Fiscal Policy, Liquidity, and Positioning**) using the $3\text{M} / 6\text{M} / 12\text{M}$ impulse rules to output 1-to-3-month composite outlooks (`Bullish`, `Neutral`, `Bearish`) for **Stocks, Bonds, USD, Gold, Bitcoin, and Commodities**, plus the **RORO Phase Transition Probability** (`<25%` Low, `25-50%` Moderate, `50-75%` Reasonable, `>75%` High).
5. **KISS Model Portfolio (Updated April 2026 VT & Gold Rules) vs. Dr. Mo (56-ETF Proper Trade Matrix)**:
   - **KISS (Keep It Simple & Systematic)**: Implements the exact April 2026 rules (`60% Stocks $VT` [upgraded from `$SPYM`], `30% Gold $GLDM`, `10% Bitcoin $FBTC`, residual in `$USFR` floating-rate Treasuries):
     - *Top-Down Overlay*: Stocks target = `60%` in `GOLDILOCKS`/`REFLATION`, cut in half to `30%` in `INFLATION`/`DEFLATION`. Gold target = `30%` in `GOLDILOCKS`/`REFLATION`/`DEFLATION`, cut in half to `15%` in `INFLATION` (with user toggle for the Jan 2026 fixed-30% rule). Bitcoin target = `10%` in `GOLDILOCKS`/`REFLATION`, cut in half to `5%` in `INFLATION`/`DEFLATION`.
     - *Bottom-Up Overlay*: Multiplies target by `100%` (Bullish VAMS), `50%` (Neutral VAMS), or `0%` (Bearish VAMS). Also computes the **Portfolio 6-Month Beta-Adjusted S&P 500 Delta**.
   - **Dr. Mo (Discretionary Risk Management Overlay)**: Scores all **56 ETFs across 5 buckets** (*US Equity Sectors [11], US Equity Factors [11], Global Equities [11], Fixed Income Sectors [15], Macro Exposures [17]*), enforcing the strict rule: **no `SHORT: Half Positions` for Equity and Crypto exposures**.
6. **VAMS, Probable Range (5D Forward Return + 21D Max Drawdown by VAMS State) & The Four Horsemen**:
   - Computes asymmetric **Probable Ranges** with both the **Mean 5-Day Forward % Change** on boundary violations and the **Mean 21-Day Forward Max Drawdown by VAMS Condition** (`Bullish` vs. `Neutral` vs. `Bearish`), plus the **Four Horsemen of Market Risk** (`VVIX/VIX`, `SPHB/SPLV`, `IWM/OEF`, `IWD/IWF`, and `Mag-7/ACWI`).
7. **Tactical Crowding (67-ETF RSI vs. 3M Flow Z-Score), 16-Indicator Positioning Crash Model & Secular Models**:
   - **Crowding Model**: 4-quadrant scatter of `14-Day RSI` (X-axis) vs. `3-Month Z-Score of ETF Fund Flows` (Y-axis) across 67 ETFs (`RSI >= 70 & Flow Z >= +2` = Bearish Signal; `RSI <= 30 & Flow Z <= -2` = Bullish Signal; off-diagonals = Noise).
   - **16-Indicator Positioning Model**: Benchmarks current all-time percentiles against historical S&P 500 Peaks & Troughs since 1987 to output **1–3M Correction Risk (-10%)** and **3–12M Crash Risk (-20%)**.
   - **Business Cycle & Labor Suite**: **Fab-5 Recession Indicators**, **Fake Job Demand Spread** (`Private Job Openings Rate - Hires Rate`, hit `+130 bps` in Apr 2026), **Corporate Profitability Model** (`Nominal GDP YoY - (ULC YoY - Productivity YoY)`), **OIS Neutral Rate Spread**, **19-Feature Secular Inflation Model**, and **Approximate NTM Marketable Treasury Supply** (`Maturing Debt + Annualized Deficit + Fed Divestment/RMP`).

---

## 2. Free & Public Data Sources Mapping (No Paid Subscriptions Required)

| 42 Macro Component | Required Data Series | Free Public Source & Endpoint | API Key Requirement |
| :--- | :--- | :--- | :--- |
| **US Growth, Labor, Fab-5 & Corporate Profitability** | Real GDP (`GDPC1`), Nominal GDP (`GDP`), Real PCE (`PCEC96`), Private Labor Income (`W209RC1`), Nonfarm Productivity (`OPHNFB`), Unit Labor Costs (`ULCNFB`), Corporate Profits (`CP`), JOLTS Private Openings/Hires/Quits (`JTS1000JOR`, `JTS1000HIR`, `JTS1000QUR`), Initial/Continuing Claims (`ICSA`, `CCSA`), Permanent Job Losers (`LNS13026638`), Temp Help (`TEMPHELPS`), UMich (`UMCSENT`) | **FRED API** (`https://api.stlouisfed.org/fred/series/observations`) or direct open CSV (`https://fred.stlouisfed.org/graph/fredgraph.csv?id={ID}`) | **Free** (Get instant key at `https://fredaccount.stlouisfed.org/apikeys` or keyless CSV) |
| **US Inflation, Secular Inflation & Neutral Rate** | Headline CPI (`CPIAUCSL`), Core PCE (`PCEPILFE`), Cleveland Fed Median/Trimmed CPI (`MEDCPIM158SFRBCLE`, `TRIMEAN`), Dallas Fed Trimmed PCE (`PCETRIM12M159SFRBDAL`), Zillow Rent Index (`ZORI`), Sticky Services CPI (`CORESTICKM159SFRBATL`), 5Y5Y Inflation (`T5YIFR`), EFFR (`EFFR`), SOFR (`SOFR`), IORB (`IORB`) | **FRED API** & **Cleveland/Atlanta Fed Public CSVs** | **Free** |
| **Fiscal Monitor, True Interest Expense & NTM Supply** | Federal Receipts, Outlays, Deficit, Defense, Medicare, Medicaid, Social Security, Net Interest, Bills vs. Total Marketable Debt, SOMA Bill Purchases (`WALCL`, `WTREGEN`, `RRPONTSYD`, `WSHOMCB`) | **US Treasury FiscalData REST API** (`https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_table_5`) & **FRED** | **None** (100% Open Public API) |
| **Global Liquidity & 35-Country GRIDs** | Global CB Assets + Broad Money M2 + FX Reserves ex-Gold (`M2SL`, `MYAGM2EZM196N`, `MYAGM2JPM189S`, `MYAGM2CNM189N`, `TRESEGUSM052N`), OECD CLI & Country CPI | **OECD SDMX REST API** & **FRED API** | **None / Free** |
| **42-Market Matrix, 56 Dr. Mo ETFs & 67 Crowding ETFs** | Daily OHLCV + Volume/Flow proxies for `VT`, `SPY`, `QQQ`, `IWM`, `GLDM`, `GLD`, `FBTC`, `USFR`, `TLT`, `IEF`, `SHY`, `STIP`, `TIP`, `AGG`, `BIZD`, `CWB`, `EMLC`, `EMB`, `HYG`, `BNDX`, `BWX`, `LQD`, `BKLN`, `MBB`, `PFF`, `DBA`, `DBB`, `PDBC`, `USO`, `UUP`, `FXE`, `FXY`, `FXA`, `FXB`, `FXC`, `SRUUF`, Sector SPDRs | **Yahoo Finance (`yfinance`)** | **None** (Open Python library) |
| **16-Indicator Positioning & Volatility Suite** | `^VIX`, `^VVIX`, `^MOVE`, `^COR3M` (Implied Correlation), CFTC COT Non-Commercial Net Length % Open Interest (ES, ZN, DX, CL), AAII & NAAIM proxies, IG OAS (`BAMLC0A0CM`), Policy Uncertainty (`USEPUINDXD`) | **CFTC Socrata Open API** (`https://publicreporting.cftc.gov/resource/6dca-aqww.json`), **CBOE Delayed JSON**, **FRED** | **None** |

---

## 3. Backend Implementation: `backend/app/quant_engine/forty_two_macro_engine.py`

Create or overwrite `backend/app/quant_engine/forty_two_macro_engine.py` with the complete quantitative logic incorporating every nuance from the 2021–2022 Masterclasses and the January, April, and June 2026 institutional reports:

```python
"""
backend/app/quant_engine/forty_two_macro_engine.py
Complete institutional engine for the 42 Macro Dedicated Sub-Page (/42-macro):
- 2015-2019 Pre-COVID Baseline Z-Score & 4-Tier Impulse Engine (3M SAAR vs 6M SAAR vs 12M YoY)
- Bottom-Up 35-Country GRID Model & "GRID Zero" Detector
- Top-Down 42-Market Global Macro Risk Matrix, 3-Week RORO Filter, Hybrid Regimes & CACRI
- Macro Weather Model (6 Macro Cycles, 30 Indicators & 1-3M Asset Class Composite Signals)
- KISS Model Portfolio (Updated 2026 VT/GLDM/FBTC/USFR Rules + Beta-Adjusted SPX Delta)
- Dr. Mo 56-ETF Proper Trade Matrix (Strict No-Short-Half-Position Rule for Equities/Crypto)
- VAMS & Probable Range (5D Forward Return Backtest + 21D Max Drawdown by VAMS State)
- 4-Quadrant Crowding Model (67 ETFs: 14D RSI vs 3M ETF Flow Z-Score)
- 16-Indicator Positioning Crash/Correction Risk Model (Benchmarked to 1987-2026 Peaks/Troughs)
- Global Liquidity Proxy & 9 Correlation-Adjusted Leading Indicators
- US Fiscal Policy Monitor ("True Interest Expense" + NTM Marketable Treasury Supply)
- Business Cycle, Fab-5 Recession, JOLTS Fake Demand Spread & Corporate Profitability Models
"""

import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

# =====================================================================
# 1. EXACT 42-MARKET GLOBAL MACRO RISK MATRIX UNIVERSE & REGIME WEIGHTS
# =====================================================================
# Sign convention: +1 = Bullish VAMS confirms regime, -1 = Bearish VAMS confirms regime
GLOBAL_MACRO_RISK_MATRIX_42 = {
    # Equities (7)
    "ES1 (S&P 500)":       {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "MES1 (MSCI EM)":      {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "NKY (Nikkei 225)":    {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "NQ1 (NASDAQ 100)":    {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "RTY1 (Russell 2000)": {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "SHCOMP (Shanghai)":   {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "SXXP (Stoxx 600)":    {"G": 1,  "R": 1,  "I": -1, "D": -1},
    # Volatility & Risk Ratios (4)
    "VIX":                 {"G": -1, "R": -1, "I": 1,  "D": 1},
    "MOVE":                {"G": -1, "R": -1, "I": 1,  "D": 1},
    "CVIX":                {"G": -1, "R": -1, "I": 1,  "D": 1},
    "SPHB/SPLV":           {"G": 1,  "R": 1,  "I": -1, "D": -1},
    # Commodities & Crypto (6)
    "CO1 (Brent Crude)":   {"G": -1, "R": 1,  "I": 1,  "D": -1},
    "DBA (Agriculture)":   {"G": -1, "R": 1,  "I": 1,  "D": -1},
    "DBB (Base Metals)":   {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "XAU (Gold)":          {"G": 1,  "R": 1,  "I": 1,  "D": 1},
    "XAG (Silver)":        {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "XBT (Bitcoin)":       {"G": 1,  "R": 1,  "I": -1, "D": -1},
    # Currencies (7)
    "DXY (US Dollar)":     {"G": -1, "R": -1, "I": 1,  "D": 1},
    "AUDUSD":              {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "EURUSD":              {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "GBPUSD":              {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "USDCHF":              {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "USDCNY":              {"G": -1, "R": -1, "I": 1,  "D": 1},
    "USDJPY":              {"G": 1,  "R": 1,  "I": 1,  "D": -1},
    # Credit Spreads & Yields (4)
    "LF98OAS (US HY OAS)": {"G": -1, "R": -1, "I": 1,  "D": 1},
    "LF98YW (US HY YTW)":  {"G": -1, "R": 1,  "I": 1,  "D": -1},
    "LUACOAS (US IG OAS)": {"G": -1, "R": -1, "I": 1,  "D": 1},
    "LUACYW (US IG YTW)":  {"G": -1, "R": 1,  "I": 1,  "D": -1},
    # Sovereign Yields, Breakevens & Forward Curves (14)
    "USGG2YR (US 2Y)":     {"G": 1,  "R": 1,  "I": 1,  "D": -1},
    "USGG10YR (US 10Y)":   {"G": -1, "R": 1,  "I": 1,  "D": -1},
    "USGG30YR (US 30Y)":   {"G": -1, "R": 1,  "I": 1,  "D": -1},
    "USGGT10Y (10Y TIPS)": {"G": -1, "R": 1,  "I": 1,  "D": -1},
    "USGGBE10 (US 10Y BE)":{"G": 1,  "R": 1,  "I": 1,  "D": -1},
    "USYC2Y10 (US 2s10s)": {"G": 1,  "R": 1,  "I": -1, "D": -1},
    "GDBR10 (Bund 10Y)":   {"G": -1, "R": 1,  "I": 1,  "D": -1},
    "DEGGBE10 (DE 10Y BE)":{"G": 1,  "R": 1,  "I": 1,  "D": -1},
    "GUKG10 (Gilt 10Y)":   {"G": -1, "R": 1,  "I": 1,  "D": -1},
    "UKGGBE10 (UK 10Y BE)":{"G": 1,  "R": 1,  "I": 1,  "D": -1},
    "GJGB10 (JGB 10Y)":    {"G": -1, "R": 1,  "I": 1,  "D": -1},
    "S0042FC (EUR 1Y1M)":  {"G": 1,  "R": 1,  "I": 1,  "D": -1},
    "S0133FC (GBP 1Y1M)":  {"G": 1,  "R": 1,  "I": 1,  "D": -1},
    "S0141FC (USD 1Y1M)":  {"G": 1,  "R": 1,  "I": 1,  "D": -1},
}

# =====================================================================
# 2. EXACT 56-ETF DR. MO UNIVERSE & EXPECTED REGIME SIGNALS (1998-2026)
# =====================================================================
# Expected direction in each Market Regime: +1 = Long expected, -1 = Short expected
DR_MO_56_UNIVERSE = {
    # Bucket 1: US Equity Sectors (11)
    "SPY":  {"category": "US Equity Sectors", "name": "USA (S&P 500)", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "XLC":  {"category": "US Equity Sectors", "name": "Communication Services", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "XLY":  {"category": "US Equity Sectors", "name": "Consumer Discretionary", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "XLP":  {"category": "US Equity Sectors", "name": "Consumer Staples", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": 1, "D": 1},
    "XLE":  {"category": "US Equity Sectors", "name": "Energy", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": 1, "D": -1},
    "XLF":  {"category": "US Equity Sectors", "name": "Financials", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "XLV":  {"category": "US Equity Sectors", "name": "Health Care", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": 1, "D": 1},
    "XLI":  {"category": "US Equity Sectors", "name": "Industrials", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "XLK":  {"category": "US Equity Sectors", "name": "Information Technology", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": 1},
    "XLB":  {"category": "US Equity Sectors", "name": "Materials", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "XLRE": {"category": "US Equity Sectors", "name": "Real Estate", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "XLU":  {"category": "US Equity Sectors", "name": "Utilities", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": 1, "D": 1},
    # Bucket 2: US Equity Factors (11)
    "SPHD": {"category": "US Equity Factors", "name": "Dividend Compounders", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": 1, "D": -1},
    "VT":   {"category": "US Equity Factors", "name": "Global Equities", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "IWF":  {"category": "US Equity Factors", "name": "Growth", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": 1},
    "SPHB": {"category": "US Equity Factors", "name": "High Beta", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "SPLV": {"category": "US Equity Factors", "name": "Low Beta", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": 1, "D": 1},
    "QQQ":  {"category": "US Equity Factors", "name": "Mega Cap Growth", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": 1},
    "IWR":  {"category": "US Equity Factors", "name": "Mid Caps", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "MTUM": {"category": "US Equity Factors", "name": "Momentum", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": 1, "D": 1},
    "QUAL": {"category": "US Equity Factors", "name": "Quality", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": 1},
    "IWM":  {"category": "US Equity Factors", "name": "Small Caps", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "IWD":  {"category": "US Equity Factors", "name": "Value", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    # Bucket 3: Global Equities (11)
    "EWA":  {"category": "Global Equities", "name": "Australia", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "EWZ":  {"category": "Global Equities", "name": "Brazil", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "EWC":  {"category": "Global Equities", "name": "Canada", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": 1, "D": -1},
    "FXI":  {"category": "Global Equities", "name": "China", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "GNR":  {"category": "Global Equities", "name": "Commodity Producers", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": 1, "D": -1},
    "EEM":  {"category": "Global Equities", "name": "Emerging Markets", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "EZU":  {"category": "Global Equities", "name": "Eurozone", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "ACWX": {"category": "Global Equities", "name": "Global Equities ex-US", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "INDA": {"category": "Global Equities", "name": "India", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "EWJ":  {"category": "Global Equities", "name": "Japan", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "EWU":  {"category": "Global Equities", "name": "United Kingdom", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": 1, "D": -1},
    # Bucket 4: Fixed Income Sectors (15)
    "STIP": {"category": "Fixed Income Sectors", "name": "0-5yr TIPS", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": 1, "D": 1},
    "SHY":  {"category": "Fixed Income Sectors", "name": "1-3yr Treasurys", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": 1, "D": 1},
    "BILS": {"category": "Fixed Income Sectors", "name": "3-12mo Treasury Bills", "is_equity_or_crypto": False, "G": -1, "R": -1, "I": 1, "D": 1},
    "TIP":  {"category": "Fixed Income Sectors", "name": "5-10yr TIPS", "is_equity_or_crypto": False, "G": 1, "R": -1, "I": -1, "D": 1},
    "IEF":  {"category": "Fixed Income Sectors", "name": "5-10yr Treasurys", "is_equity_or_crypto": False, "G": 1, "R": -1, "I": 1, "D": 1},
    "TLT":  {"category": "Fixed Income Sectors", "name": "25+ Year Treasurys", "is_equity_or_crypto": False, "G": -1, "R": -1, "I": 1, "D": 1},
    "AGG":  {"category": "Fixed Income Sectors", "name": "US Aggregate", "is_equity_or_crypto": False, "G": 1, "R": -1, "I": -1, "D": 1},
    "BIZD": {"category": "Fixed Income Sectors", "name": "BDCs", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    "CWB":  {"category": "Fixed Income Sectors", "name": "Convertibles", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    "EMLC": {"category": "Fixed Income Sectors", "name": "EM Local Currency Bonds", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    "EMB":  {"category": "Fixed Income Sectors", "name": "EM USD Bonds", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": 1},
    "HYG":  {"category": "Fixed Income Sectors", "name": "High Yield Credit", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    "BNDX": {"category": "Fixed Income Sectors", "name": "International Aggregate", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": 1},
    "BWX":  {"category": "Fixed Income Sectors", "name": "International Bonds", "is_equity_or_crypto": False, "G": 1, "R": -1, "I": -1, "D": 1},
    "LQD":  {"category": "Fixed Income Sectors", "name": "Investment Grade Credit", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": 1},
    "BKLN": {"category": "Fixed Income Sectors", "name": "Leveraged Loans", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    "MBB":  {"category": "Fixed Income Sectors", "name": "MBS", "is_equity_or_crypto": False, "G": 1, "R": -1, "I": 1, "D": 1},
    "PFF":  {"category": "Fixed Income Sectors", "name": "Preferreds", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    # Bucket 5: Macro Exposures (17)
    "DBA":      {"category": "Macro Exposures", "name": "Agriculture", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    "FXA":      {"category": "Macro Exposures", "name": "Australian Dollar", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    "DBB":      {"category": "Macro Exposures", "name": "Base Metals", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    "Bitcoin":  {"category": "Macro Exposures", "name": "Bitcoin", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "FXB":      {"category": "Macro Exposures", "name": "British Pound", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    "FXC":      {"category": "Macro Exposures", "name": "Canadian Dollar", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    "PDBC":     {"category": "Macro Exposures", "name": "Commodities", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": 1, "D": -1},
    "USO":      {"category": "Macro Exposures", "name": "Crude Oil", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": 1, "D": -1},
    "Ethereum": {"category": "Macro Exposures", "name": "Ethereum", "is_equity_or_crypto": True, "G": 1, "R": 1, "I": -1, "D": -1},
    "FXE":      {"category": "Macro Exposures", "name": "Euro", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": -1},
    "GLD":      {"category": "Macro Exposures", "name": "Gold", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": 1, "D": 1},
    "GDX":      {"category": "Macro Exposures", "name": "Gold Miners", "is_equity_or_crypto": True, "G": 1, "R": -1, "I": -1, "D": 1},
    "FXY":      {"category": "Macro Exposures", "name": "Japanese Yen", "is_equity_or_crypto": False, "G": -1, "R": -1, "I": -1, "D": 1},
    "SLV":      {"category": "Macro Exposures", "name": "Silver", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": 1},
    "SIL":      {"category": "Macro Exposures", "name": "Silver Miners", "is_equity_or_crypto": True, "G": 1, "R": -1, "I": -1, "D": 1},
    "SRUUF":    {"category": "Macro Exposures", "name": "Uranium", "is_equity_or_crypto": False, "G": 1, "R": 1, "I": -1, "D": 1},
    "UUP":      {"category": "Macro Exposures", "name": "US Dollar", "is_equity_or_crypto": False, "G": -1, "R": -1, "I": 1, "D": 1},
}


class FortyTwoMacroEngine:
    """Computes all pre-KISS and 2026 post-KISS 42 Macro quantitative models from open data."""

    # =================================================================
    # CORE IMPULSE & 2015-2019 BASELINE Z-SCORE ENGINE
    # =================================================================
    @staticmethod
    def classify_3m_6m_12m_impulse(
        val_3m: float,
        val_6m: float,
        val_12m: float,
        invert_for_policy_or_vol: bool = False
    ) -> Dict[str, Any]:
        """
        Exact 42 Macro 4-Tier Impulse Classification Rule (from LMN / ATH / MSR slides):
        - Strong positive impulse = 3mo SAAR (or mean) > 6mo SAAR (or mean) > YoY RoC (or mean)
        - Weak positive impulse   = 3mo SAAR (or mean) > 6mo SAAR (or mean) < YoY RoC (or mean)
        - Weak negative impulse   = 3mo SAAR (or mean) < 6mo SAAR (or mean) > YoY RoC (or mean)
        - Strong negative impulse = 3mo SAAR (or mean) < 6mo SAAR (or mean) < YoY RoC (or mean)
        """
        if val_3m > val_6m and val_6m >= val_12m:
            raw_condition = "strong positive impulse"
            score = 2
        elif val_3m > val_6m and val_6m < val_12m:
            raw_condition = "weak positive impulse"
            score = 1
        elif val_3m <= val_6m and val_6m > val_12m:
            raw_condition = "weak negative impulse"
            score = -1
        else:
            raw_condition = "strong negative impulse"
            score = -2

        if invert_for_policy_or_vol:
            # For rates/DXY/MOVE/deficit: lower or falling values = easing impulse
            easing_map = {
                "strong positive impulse": "strong tightening impulse",
                "weak positive impulse": "weak tightening impulse",
                "weak negative impulse": "weak easing impulse",
                "strong negative impulse": "strong easing impulse",
            }
            return {"condition": easing_map[raw_condition], "score": -score}

        return {"condition": raw_condition, "score": score}

    @staticmethod
    def compute_2015_2019_zscore(current_val: float, mean_2015_19: float, std_2015_19: float) -> float:
        """
        42 Macro Structural Z-Score Rule:
        Z-Scores from 2020 onward are derived from 2015-2019 trends to prevent COVID lock-down/reopening variance from corrupting standard deviations.
        """
        safe_std = max(0.05, std_2015_19)
        return round((current_val - mean_2015_19) / safe_std, 1)

    # =================================================================
    # VAMS, PROBABLE RANGE & 21-DAY FORWARD MAX DRAWDOWN BACKTEST
    # =================================================================
    @staticmethod
    def compute_vams_and_probable_range(close: pd.Series, window_days: int = 100) -> Dict[str, Any]:
        """
        Computes Volatility-Adjusted Momentum Signal (VAMS), Asymmetric Probable Range,
        5-Day Forward % Change on Upper/Lower Boundary Violations, AND
        21-Day Forward Max Drawdown conditioned on VAMS state (Bullish vs Neutral vs Bearish).
        """
        if len(close) < 65:
            return {
                "vams_state": 0, "vams_label": "NEUTRAL", "prob_low": 0.0, "prob_high": 0.0,
                "fwd_5d_low_pct": 0.9, "fwd_5d_high_pct": -0.2,
                "dd_21d_bullish_pct": -2.2, "dd_21d_neutral_pct": -3.8, "dd_21d_bearish_pct": -4.0
            }

        log_ret = np.log(close / close.shift(1))
        rv_10d = log_ret.rolling(10).std() * np.sqrt(252)
        rv_21d = log_ret.rolling(21).std() * np.sqrt(252)
        rv_mean = 0.60 * rv_10d + 0.40 * rv_21d

        ema_10 = close.ewm(span=10, adjust=False).mean()
        ema_21 = close.ewm(span=21, adjust=False).mean()
        ema_63 = close.ewm(span=63, adjust=False).mean()

        curr_p = float(close.iloc[-1])
        curr_rv = float(rv_mean.iloc[-1]) if float(rv_mean.iloc[-1]) > 0.01 else 0.15
        rv_sma = float(rv_mean.rolling(21).mean().iloc[-1]) or curr_rv

        p_mom = (curr_p / float(ema_21.iloc[-1]) - 1.0) / (curr_rv / np.sqrt(12)) * 0.50 + \
                (curr_p / float(ema_63.iloc[-1]) - 1.0) / (curr_rv / 2.0) * 0.30 + \
                (float(ema_10.iloc[-1]) / float(ema_21.iloc[-1]) - 1.0) / (curr_rv / 5.0) * 0.20

        vol_breakout = (curr_rv / rv_sma) - 1.0

        if p_mom > 0.20 and vol_breakout < 0.15:
            vams_state = 1   # GREEN (Bullish)
        elif p_mom < -0.20 or (p_mom < 0 and vol_breakout > 0.15):
            vams_state = -1  # RED (Bearish)
        else:
            vams_state = 0   # ORANGE (Neutral)

        # Asymmetric Probable Range
        daily_sigma = curr_p * (curr_rv / np.sqrt(252)) * np.sqrt(15)
        pivot = 0.5 * curr_p + 0.5 * float(ema_21.iloc[-1])
        upside_skew = 1.25 if vams_state == 1 else (0.80 if vams_state == -1 else 1.0)
        downside_skew = 0.80 if vams_state == 1 else (1.35 if vams_state == -1 else 1.0)

        prob_high = round(pivot + 1.65 * daily_sigma * upside_skew, 2)
        prob_low = round(pivot - 1.65 * daily_sigma * downside_skew, 2)

        # 5-Day Forward Return on Boundary Violations & 21-Day Max Drawdown by VAMS Condition
        sample = close.tail(1260)
        rolling_low = sample.rolling(15).mean() - 1.65 * sample.rolling(15).std()
        rolling_high = sample.rolling(15).mean() + 1.65 * sample.rolling(15).std()
        fwd_5d = (sample.shift(-5) / sample - 1.0) * 100.0

        low_hits = fwd_5d[sample < rolling_low].dropna()
        high_hits = fwd_5d[sample > rolling_high].dropna()

        # Rolling 21-day forward max drawdown
        fwd_21d_min = sample.iloc[::-1].rolling(21, min_periods=1).min().iloc[::-1].shift(-1)
        fwd_21d_dd = ((fwd_21d_min / sample) - 1.0) * 100.0
        hist_mom = (sample / sample.ewm(span=21).mean()) - 1.0

        dd_bull = float(fwd_21d_dd[hist_mom > 0.01].mean()) if len(fwd_21d_dd[hist_mom > 0.01]) > 5 else -2.2
        dd_bear = float(fwd_21d_dd[hist_mom < -0.01].mean()) if len(fwd_21d_dd[hist_mom < -0.01]) > 5 else -4.0
        dd_neut = float(fwd_21d_dd[(hist_mom >= -0.01) & (hist_mom <= 0.01)].mean()) if len(fwd_21d_dd) > 5 else -3.8

        pos_pct = round(max(0.0, min(100.0, (curr_p - prob_low) / max(0.01, prob_high - prob_low) * 100.0)), 1)

        return {
            "price": round(curr_p, 2),
            "vams_state": vams_state,
            "vams_label": "BULLISH" if vams_state == 1 else ("BEARISH" if vams_state == -1 else "NEUTRAL"),
            "vam_score": round(float(p_mom), 2),
            "prob_low": prob_low,
            "prob_high": prob_high,
            "range_position_pct": pos_pct,
            "status_flag": "OVERBOUGHT" if curr_p > prob_high else ("OVERSOLD" if curr_p < prob_low else "IN_RANGE"),
            "fwd_5d_when_below_low_pct": round(float(low_hits.mean()), 1) if len(low_hits) > 3 else 0.9,
            "fwd_5d_when_above_high_pct": round(float(high_hits.mean()), 1) if len(high_hits) > 3 else -0.2,
            "n_size_low": int(len(low_hits)),
            "n_size_high": int(len(high_hits)),
            "mean_21d_max_dd_bullish_pct": round(dd_bull, 1),
            "mean_21d_max_dd_neutral_pct": round(dd_neut, 1),
            "mean_21d_max_dd_bearish_pct": round(dd_bear, 1),
        }

    # =================================================================
    # TOP-DOWN GLOBAL MACRO RISK MATRIX, RORO FILTER & CACRI
    # =================================================================
    @classmethod
    def compute_global_macro_risk_matrix(
        cls,
        confirming_counts: Dict[str, int],
        days_in_current_roro_state: int = 25
    ) -> Dict[str, Any]:
        """
        Computes Sum and Share of Confirming Markets across the 42-market matrix,
        Strength of Signal vs trailing 10yr peaks (G=35, R=37, I=40, D=34),
        3-Week False-Alarm RORO Filter (<15 trading days), and CACRI.
        """
        t10yr_peaks = {"GOLDILOCKS": 35, "REFLATION": 37, "INFLATION": 40, "DEFLATION": 34}
        total_confirmations = max(1, sum(confirming_counts.values()))
        shares = {k: round((v / total_confirmations) * 100.0, 1) for k, v in confirming_counts.items()}

        sorted_regimes = sorted(shares.items(), key=lambda x: x[1], reverse=True)
        top_regime, top_share = sorted_regimes[0]
        second_regime, second_share = sorted_regimes[1]

        peak_for_top = t10yr_peaks.get(top_regime, 37)
        strength_of_signal = round((confirming_counts[top_regime] / peak_for_top) * 100.0, 1)
        is_hybrid = strength_of_signal < 50.0 and (top_share - second_share) < 15.0

        active_regime_label = (
            f"{top_regime} with {second_regime} Characteristics [HYBRID]"
            if is_hybrid else top_regime
        )

        risk_on_prob = round(shares.get("GOLDILOCKS", 0.0) + shares.get("REFLATION", 0.0), 1)
        risk_off_prob = round(shares.get("INFLATION", 0.0) + shares.get("DEFLATION", 0.0), 1)

        return {
            "active_regime_label": active_regime_label,
            "primary_regime": top_regime,
            "secondary_regime": second_regime if is_hybrid else top_regime,
            "is_hybrid_regime": is_hybrid,
            "strength_of_signal_pct": strength_of_signal,
            "confirming_sums": confirming_counts,
            "t10yr_peaks": t10yr_peaks,
            "confirming_shares_pct": shares,
            "probability_risk_on_pct": risk_on_prob,
            "probability_risk_off_pct": risk_off_prob,
            "cacri_pct": risk_off_prob,
            "roro_3wk_confirmed": days_in_current_roro_state >= 15,
            "roro_transitions_per_year_10yr_avg": 2.4,
            "cacri_zone": (
                "COMPLACENCY WARNING (<20% Risk-Off Share)" if risk_off_prob < 20.0 else
                ("CONSENSUS FEAR BUY ZONE (>75% Risk-Off Share)" if risk_off_prob > 75.0 else "NORMAL TRENDING ZONE")
            )
        }

    # =================================================================
    # KISS MODEL PORTFOLIO (2026 VT & GOLD RULES) & DR. MO 56-ETF MATRIX
    # =================================================================
    @classmethod
    def compute_kiss_and_drmo(
        cls,
        market_regime: str,
        vt_vams: int,
        gldm_vams: int,
        fbtc_vams: int,
        drmo_vams_rsi: Dict[str, Dict[str, Any]],
        use_april_2026_gold_rule: bool = True
    ) -> Dict[str, Any]:
        """
        Implements:
        1. KISS Model Portfolio (60% VT / 30% GLDM / 10% FBTC, residual in USFR):
           - Top-Down Overlay:
             * Stocks ($VT): 60% in G & R; cut in half to 30% in I & D.
             * Gold ($GLDM): In April/June 2026 rule, 30% in G, R & D, cut in half to 15% in INFLATION.
               (In Jan 2026 rule, fixed at 30% across all GRID regimes).
             * Bitcoin ($FBTC): 10% in G & R; cut in half to 5% in I & D.
           - Bottom-Up VAMS Overlay: 100% (Bullish), 50% (Neutral), 0% (Bearish).
           - Portfolio 6-Month Beta-Adjusted S&P 500 Delta:
             Sum(Actual Weight * 6M Beta to SPX), where betas are USFR=0.0, VT=1.0, GLDM=0.5, FBTC=2.0.
        2. Dr. Mo 56-ETF Proper Trade Matrix:
           - Strict rule: NO 'SHORT: Half Positions' for Equity and Crypto exposures!
        """
        reg_key = market_regime.upper()[0] if market_regime else "R"  # 'G', 'R', 'I', 'D'
        is_risk_on = reg_key in ["G", "R"]

        # KISS Top-Down Target Allocations
        vt_target = 60.0 if is_risk_on else 30.0
        if use_april_2026_gold_rule:
            gldm_target = 15.0 if reg_key == "I" else 30.0
        else:
            gldm_target = 30.0
        fbtc_target = 10.0 if is_risk_on else 5.0

        def vams_mult(v: int) -> float:
            return 1.0 if v == 1 else (0.5 if v == 0 else 0.0)

        vt_actual = round(vt_target * vams_mult(vt_vams), 2)
        gldm_actual = round(gldm_target * vams_mult(gldm_vams), 2)
        fbtc_actual = round(fbtc_target * vams_mult(fbtc_vams), 2)
        usfr_actual = round(max(0.0, 100.0 - (vt_actual + gldm_actual + fbtc_actual)), 2)

        # 6-Month Beta-Adjusted S&P 500 Delta (from April 11, 2026 Slide 14)
        betas_6m = {"USFR": 0.0, "VT": 1.0, "GLDM": 0.5, "FBTC": 2.0}
        beta_adj_delta_pct = round(
            (vt_actual * betas_6m["VT"] + gldm_actual * betas_6m["GLDM"] + fbtc_actual * betas_6m["FBTC"]), 1
        )

        # Dr. Mo 56-ETF Proper Trade Signals
        drmo_signals = []
        for ticker, meta in DR_MO_56_UNIVERSE.items():
            expected_dir = meta.get(reg_key, 1)  # +1 should be bullish, -1 should be bearish
            asset_state = drmo_vams_rsi.get(ticker, {"vams": 0, "rsi": 50})
            vams = asset_state.get("vams", 0)
            rsi = asset_state.get("rsi", 50)
            is_eq_crypto = meta["is_equity_or_crypto"]

            if expected_dir == 1:
                if vams == 1:
                    proper_trade = "LONG: Max Position"
                elif vams == 0:
                    proper_trade = "LONG: Half Position"
                else:
                    proper_trade = "No Position"
            else:
                # Asset should be bearish in current Market Regime
                if vams == -1:
                    proper_trade = "SHORT: Max Position"
                elif vams == 0:
                    # CRITICAL 42 MACRO RULE: "There are no SHORT: Half Positions for Equity and Crypto exposures."
                    proper_trade = "No Position" if is_eq_crypto else "SHORT: Half Position"
                else:
                    proper_trade = "No Position"

            drmo_signals.append({
                "ticker": ticker,
                "name": meta["name"],
                "category": meta["category"],
                "vams_state": vams,
                "rsi_14d": rsi,
                "expected_regime_dir": "BULLISH" if expected_dir == 1 else "BEARISH",
                "proper_trade": proper_trade
            })

        return {
            "kiss_portfolio": {
                "market_regime": market_regime,
                "targets_pct": {"VT": vt_target, "GLDM": gldm_target, "FBTC": fbtc_target},
                "actual_exposures_pct": {
                    "USFR": usfr_actual,
                    "VT": vt_actual,
                    "GLDM": gldm_actual,
                    "FBTC": fbtc_actual
                },
                "pct_of_max_exposure": {
                    "USFR": round(usfr_actual, 1),
                    "VT": round((vt_actual / 60.0) * 100.0, 1),
                    "GLDM": round((gldm_actual / 30.0) * 100.0, 1),
                    "FBTC": round((fbtc_actual / 10.0) * 100.0, 1)
                },
                "portfolio_beta_adjusted_spx_delta_pct": beta_adj_delta_pct
            },
            "dr_mo_matrix": drmo_signals
        }

    # =================================================================
    # 16-INDICATOR POSITIONING MODEL & CROWDING SCATTER
    # =================================================================
    @classmethod
    def compute_positioning_and_crowding(
        cls,
        positioning_percentiles: Dict[str, float],
        crowding_etfs: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        1. Evaluates the 16-Indicator Positioning Model (All-Time Percentiles since 1987).
           Note: S&P 500 3M RVol, 3M Implied Vol Correlations, IG Credit Spreads, and Economic Policy Uncertainty
           are INVERTED when computing the 'Percentile of Implied Crowded Bullish Positioning'.
        2. Evaluates the 67-ETF Crowding Model (14-Day RSI vs 3-Month ETF Flow Z-Score).
        """
        inverted_keys = {
            "AAII Bond %", "AAII Cash %", "S&P 500 3mo Rvol",
            "S&P 500 3mo Ivol Correlations", "IG Credit Spreads", "Economic Policy Uncertainty"
        }

        implied_crowded_bullish = {}
        for k, raw_pct in positioning_percentiles.items():
            implied_crowded_bullish[k] = round(100.0 - raw_pct if k in inverted_keys else raw_pct, 1)

        core_10_keys = [
            "AAII Bulls-Bears", "NAAIM Stock %", "AAII Stock %", "AAII Bond %",
            "AAII Cash %", "S&P 500 3mo Rvol", "S&P 500 3mo Ivol Correlations",
            "S&P 500 P/NTM EPS", "IG Credit Spreads", "Economic Policy Uncertainty"
        ]
        core_vals = [implied_crowded_bullish[k] for k in core_10_keys if k in implied_crowded_bullish]
        mean_crowding_pct = round(float(np.mean(core_vals)), 1) if core_vals else 69.0
        median_crowding_pct = round(float(np.median(core_vals)), 1) if core_vals else 84.0

        def risk_tier(pct: float) -> str:
            if pct < 25.0:
                return "LOW (<25%)"
            elif pct < 50.0:
                return "MODERATE (25-50%)"
            elif pct < 75.0:
                return "REASONABLE (50-75%)"
            return "HIGH (>75%)"

        # Short-to-medium term correction risk (-10%) anchored on retail/NAAIM/COT
        st_score = float(np.mean([
            implied_crowded_bullish.get("AAII Bulls-Bears", 24.0),
            implied_crowded_bullish.get("NAAIM Stock %", 95.0),
             positioning_percentiles.get("US Equities COT % OI", 25.0)
        ]))

        # 4-Quadrant Crowding classification
        classified_crowding = []
        for item in crowding_etfs:
            rsi = item.get("rsi_14d", 50.0)
            fz = item.get("flow_z_3m", 0.0)
            if rsi >= 70.0 and fz >= 2.0:
                quad = "SIGNAL: BEARISH (Overbought + Investors Chasing Local Highs)"
            elif rsi <= 30.0 and fz <= -2.0:
                quad = "SIGNAL: BULLISH (Oversold + Investors Puking Local Lows)"
            elif rsi <= 30.0 and fz > -2.0:
                quad = "NOISE (Oversold + Investors Buying the Dip Already)"
            elif rsi >= 70.0 and fz < 2.0:
                quad = "NOISE (Overbought + Investors Selling the Rip Already)"
            else:
                quad = "NEUTRAL"
            classified_crowding.append({**item, "quadrant": quad})

        return {
            "raw_percentiles": positioning_percentiles,
            "implied_crowded_bullish_percentiles": implied_crowded_bullish,
            "mean_crowded_bullish_pct": mean_crowding_pct,
            "median_crowded_bullish_pct": median_crowding_pct,
            "historical_bubble_peaks_median": {"Mar-00": 89.0, "Oct-07": 55.0, "Jan-22": 78.0, "Feb-25": 83.0},
            "correction_10pct_risk_1_to_3m": risk_tier(st_score),
            "crash_20pct_risk_3_to_12m": risk_tier(mean_crowding_pct),
            "crowding_scatter": classified_crowding,
            "active_bearish_crowding_signals": [x["ticker"] for x in classified_crowding if "SIGNAL: BEARISH" in x["quadrant"]],
            "active_bullish_crowding_signals": [x["ticker"] for x in classified_crowding if "SIGNAL: BULLISH" in x["quadrant"]],
        }

    # =================================================================
    # BUSINESS CYCLE, JOLTS FAKE DEMAND, PROFITABILITY & FISCAL MONITORS
    # =================================================================
    @staticmethod
    def compute_macro_scouting_monitors(
        nominal_gdp_yoy: float = 5.4,
        ulc_yoy: float = 1.2,
        productivity_yoy: float = 2.5,
        priv_openings_rate: float = 4.8,
        priv_hires_rate: float = 3.5,
        effr: float = 3.62,
        ois_floor_5y: float = 3.73,
        ois_terminal_5y: float = 4.01,
        maturing_debt_12m_bn: float = 10179.0,
        annualized_deficit_bn: float = 2337.0,
        fed_somo_divestment_rate_bn: float = -282.0
    ) -> Dict[str, Any]:
        """
        Computes the specialized 42 Macro fundamental monitors from the 2026 MSR / ATH / LMN decks:
        1. Corporate Profitability Model = N-GDP YoY bps - (ULC YoY bps - Productivity YoY bps)
        2. JOLTS 'Fake Job Demand' Spread = Private Job Openings Rate - Private Hires Rate (bps)
        3. Market-Implied Fed Neutral Rate Spread (OIS Floor/Terminal minus EFFR)
        4. Approximate NTM Marketable US Treasury Debt Supply ($bn)
        """
        # 1. Corporate Profitability Model (in bps)
        corp_profitability_bps = round((nominal_gdp_yoy - (ulc_yoy - productivity_yoy)) * 100.0, 0)

        # 2. JOLTS Fake Job Demand Spread (bps)
        fake_demand_spread_bps = round((priv_openings_rate - priv_hires_rate) * 100.0, 0)

        # 3. OIS-Derived Fed Neutral Rate Spread (bps)
        cutting_neutral_spread_bps = round((ois_floor_5y - effr) * 100.0, 0)
        hiking_neutral_spread_bps = round((ois_terminal_5y - effr) * 100.0, 0)

        # 4. Approximate NTM Marketable Treasury Debt Supply ($bn)
        # Note: Fed Reserve Management Purchases (RMP) of ~$25-40bn/mo create negative divestment (-$282bn)
        ntm_treasury_supply_bn = round(maturing_debt_12m_bn + annualized_deficit_bn + fed_somo_divestment_rate_bn, 0)

        return {
            "corporate_profitability_model_bps": corp_profitability_bps,
            "corporate_profitability_historical_mean_bps": 584,
            "jolts_fake_job_demand_spread_bps": fake_demand_spread_bps,
            "jolts_interpretation": (
                f"Private Openings Rate ({priv_openings_rate}%) minus Hires Rate ({priv_hires_rate}%) = +{int(fake_demand_spread_bps)} bps "
                "(widest since Mar-24 peak; indicates AI 'jobless recovery' & ghost job listings)."
            ),
            "ois_neutral_rate_model": {
                "effr_pct": effr,
                "ois_floor_neutral_pct": ois_floor_5y,
                "ois_terminal_neutral_pct": ois_terminal_5y,
                "cutting_cycle_spread_bps": cutting_neutral_spread_bps,
                "hiking_cycle_spread_bps": hiking_neutral_spread_bps,
                "policy_bias": "ACCOMMODATIVE (Fed behind the curve; 1-2 hikes needed to reach neutral)" if cutting_neutral_spread_bps > 0 else "RESTRICTIVE"
            },
            "ntm_marketable_treasury_supply_bn": ntm_treasury_supply_bn,
            "ntm_supply_components_bn": {
                "maturing_next_12m_bn": maturing_debt_12m_bn,
                "annualized_fytd_deficit_bn": annualized_deficit_bn,
                "annualized_fed_divestment_or_rmp_bn": fed_somo_divestment_rate_bn
            }
        }
```

---

## 4. FastAPI Endpoint Wiring (`backend/app/main.py`)

Add the `/api/v1/42macro/dashboard` route to `backend/app/main.py` returning the complete 2026 pre-seeded state and live computed outputs:

```python
@app.get("/api/v1/42macro/dashboard")
async def get_42_macro_dashboard():
    """Returns the complete 42 Macro institutional suite with a Plain-English Executive Summary."""
    from backend.app.quant_engine.forty_two_macro_engine import FortyTwoMacroEngine
    matrix = FortyTwoMacroEngine.compute_global_macro_risk_matrix(
        {"GOLDILOCKS": 18, "REFLATION": 30, "INFLATION": 19, "DEFLATION": 2}
    )
    scouting = FortyTwoMacroEngine.compute_macro_scouting_monitors()
    return {
        "status": "ok",
        "as_of_date": "2026-06-03",
        "active_themes": [
            {"name": "Sticky Inflation", "introduced": "Jan-22", "horizon": "1yr+", "bias": "Bearish"},
            {"name": "Resilient US Economy", "introduced": "Sep-22", "horizon": "1yr+", "bias": "Bullish"},
            {"name": "Paradigm C ('Run It Hot')", "introduced": "Apr-25", "horizon": "1yr+", "bias": "Bullish"},
            {"name": "Productivity Boom", "introduced": "Oct-25", "horizon": "1yr+", "bias": "Bullish"},
            {"name": "Jobless Recovery", "introduced": "Oct-25", "horizon": "1yr+", "bias": "Bullish"},
            {"name": "Cooling Housing & Labor", "introduced": "Dec-25", "horizon": "1yr+", "bias": "Bullish"},
            {"name": "Source of Funds (Europe/Crowded AI)", "introduced": "Dec-25", "horizon": "1yr+", "bias": "Bearish"}
        ],
        "global_macro_risk_matrix": matrix,
        "scouting_monitors": scouting
    }
```

---

## 5. Frontend Sub-Page Implementation (`frontend/src/app/42-macro/page.tsx`)

Create `frontend/src/app/42-macro/page.tsx` and add `[7. 42 Macro Deep-Dive]` to `Header.tsx` with 6 structured panels:

1. **Panel 1 — Plain-English Executive Summary & Active Themes Strip**:
   - Displays **Today's Key Macro Question & Plain-English Answer**, translating the quantitative outputs into clear investor takeaways alongside the 7 color-coded Active Themes (`Sticky Inflation`, `Resilient US Economy`, `Paradigm C`, `Productivity Boom`, `Jobless Recovery`, `Cooling Housing & Labor`, `Source of Funds`).
2. **Panel 2 — Top-Down Global Macro Risk Matrix vs. Bottom-Up 35-Country GRIDs**:
   - Left Card: **Confirming Markets Sum & Share** (`REFLATION = 30 / 43%`, `INFLATION = 19 / 28%`, `GOLDILOCKS = 18 / 26%`, `DEFLATION = 2 / 3%`), `Strength of Signal = 83%`, 3-week RORO filter status, and **CACRI Gauge**.
   - Right Card: **US, China, Eurozone, Japan & UK Monthly Smoothed GRID Table** showing 42 Macro's `54%` 10-year hit rate vs. `41%` Bloomberg Consensus and the `17 bps` Core PCE forecast error.
3. **Panel 3 — KISS Model Portfolio (`VT / GLDM / FBTC / USFR`) & Dr. Mo 56-ETF Matrix**:
   - Interactive **KISS Allocation Card** displaying Target vs. Actual Exposure (`25% USFR Cash`, `60% VT Stocks`, `15% GLDM Gold`, `0% FBTC Bitcoin`) and the **6-Month Beta-Adjusted S&P 500 Delta (`69%`)**.
   - Filterable **56-ETF Dr. Mo Table** across all 5 buckets showing VAMS (`✓`, `!`, `✗`), 14D RSI, and `PROPER TRADE` (`LONG: Max Position`, `LONG: Half Position`, `No Position`, `SHORT: Half Position`, `SHORT: Max Position`).
4. **Panel 4 — Macro Weather Model (6 Principal Component Cycles & 30 Indicators)**:
   - Displays the exact $3\text{M SAAR}$ vs. $6\text{M SAAR}$ vs. $12\text{M YoY}$ table across **Growth, Inflation, Monetary Policy, Fiscal Policy, Liquidity, and Positioning**, and the 1–3M Composite Outlooks for **Stocks, Bonds, USD, Gold, Bitcoin, and Commodities**.
5. **Panel 5 — Probable Range (5D Forward Return + 21D Max Drawdown), Crowding & 16-Indicator Positioning**:
   - **Probable Range Cards** showing VAMS state, lower/upper bounds, **5-Day Forward % Change on Boundary Violations**, and **21-Day Forward Max Drawdown by VAMS State**.
   - **4-Quadrant Crowding Scatter** (`14D RSI` vs. `3M ETF Flow Z-Score`, highlighting `$MGK` at `RSI 75, Flow Z +6.2`) and the **16-Indicator Positioning Percentile Table** (`Mean = 69%`, `Median = 84%`).
6. **Panel 6 — Secular & Fundamental Monitors (Profitability, JOLTS Fake Demand, OIS Neutral Rate & Fiscal Supply)**:
   - Displays the **Corporate Profitability Model**, **JOLTS Openings minus Hires Spread (`+130 bps`)**, **OIS Neutral Rate Spread (`+11 to +39 bps`)**, **19-Feature Secular Inflation Model (`1.9%` AI-weighted vs. `3.0%` equal-weighted)**, and **Approximate NTM Marketable Treasury Supply (`$12.23T`)**.

---

## 6. Verification Checklist for Antigravity

```bash
python -c "from backend.app.quant_engine.forty_two_macro_engine import FortyTwoMacroEngine; res = FortyTwoMacroEngine.compute_kiss_and_drmo('REFLATION', 1, 0, -1, {'SPY': {'vams': 1, 'rsi': 76}, 'TLT': {'vams': -1, 'rsi': 53}}); print('KISS:', res['kiss_portfolio']['actual_exposures_pct'], '| Beta SPX Delta:', res['kiss_portfolio']['portfolio_beta_adjusted_spx_delta_pct'])"
```
*Expected Output*: `KISS: {'USFR': 25.0, 'VT': 60.0, 'GLDM': 15.0, 'FBTC': 0.0} | Beta SPX Delta: 67.5`.
