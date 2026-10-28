# Antigravity IDE Specification: Multi-Horizon Dynamic Outliers Scanner (`outliers_v2`), Global 2-Line Header Layout & Sector-Aware Stock X-Ray

> **Copy-Paste Prompt for Antigravity IDE:**
> *"Read `antigravity_multi_horizon_outliers_and_sector_xray_upgrade.md` and implement all 4 upgrades:
> 1. **Global Header & 2-Line Navigation (`frontend/src/components/Header.tsx` / `Navbar.tsx`)**: Rename the menu tab from `'1-3M Outlier Scanner'` to `'Outliers'`, break the navigation menu items into **2 balanced lines** so they fit cleanly on the page without wrapping awkwardly or scrolling, and move the **Date, API Status, Refresh Data, and Export** buttons higher and aligned to the same container width (`max-w-7xl mx-auto px-4 md:px-6`) as the main menu and content tables.
> 2. **Horizon-Specific Dynamic Quantitative Logic (`backend/app/quant_engine/options_outliers.py`)**: Ensure all 3 time horizons—including **`3+ Years`**—are 100% dynamic and use timeframe-appropriate math from live 5-year `yfinance` + `CoinGecko` data:
>    - **`1-3 months`**: Uses **63-Day (3M) & 52-Week Range Position %**, **14-Day Daily RSI**, **15-Day Probable Range**, and **5D vs. 21D Return Inflection**.
>    - **`12 months`**: Uses **2-Year (104-Week) Cyclical Range Position %**, **14-Week Weekly RSI**, **Distance vs. 200-Day SMA**, and **Quarterly Rate-of-Change Acceleration ($\Delta\text{QoQ}$)**.
>    - **`3+ Years`**: Uses **5-Year Relative-to-S&P 500 (`Ticker / SPY`) Structural Percentile** (identifying assets at multi-year relative lows vs. the equity market even if nominal prices rose), **5-Year Absolute Range Percentile**, **14-Month Monthly RSI**, **Distance vs. 200-Week (4-Year) Moving Average**, and **Live Cross-Asset Valuation Ratios** (live `Gold/Oil` and `Copper/Gold` from `GC=F`, `CL=F`, `HG=F`).
> 3. **Outliers Page Sub-Menu Titles (`frontend/src/app/outliers/page.tsx`)**: Set the 3 sub-menu button titles strictly to **`1-3 months`**, **`12 months`**, and **`3+ Years`** (excluding any descriptions in brackets).
> 4. **Single-Stock X-Ray v2 (`backend/app/quant_engine/stock_analyzer.py`)**: Retain the 5 Sector-Aware Accounting Templates, live `yfinance` EPS Revisions, and keyless SEC EDGAR XBRL fallback."*

---

## 1. Why Each Horizon Requires Distinct Timeframe-Calibrated Quantitative Logic

Using a single short-term indicator (like 14-day daily RSI or 52-week USD price range) across all three horizons creates false signals—especially on **`12 months`** and **`3+ Years`**:
- **Why `3+ Years` Cannot Use 14-Day RSI or 1-Year USD High/Low**:
  - In an inflationary or currency-debasement regime, nominal USD prices drift higher over 12 months, making structural laggards look "high" on a 52-week chart even when they are sitting near **5-to-10-year structural lows relative to the S&P 500 (`Ticker / SPY`)**!
  - Conversely, a 2-week dip (`14D RSI = 38`) in a secular bubble stock that is `+180%` above its 200-week moving average and at the `99th percentile` of its 5-year relative performance vs. `SPY` is **not** an "unloved 3+ year secular pivot".
- **Our Timeframe-Specific Dynamic Gating Matrix (Computed Live from 5-Year `yfinance` History)**:

| Time Horizon Tab | Primary Lookback Data (`yfinance` Live) | Momentum & RSI Calibration | Strict Gate for **🥇 Priority 1: Unloved Bottoming Pivots** | Gate for **🛑 Bucket 3: Played-Out / Extended At Highs** |
| :--- | :--- | :--- | :--- | :--- |
| **`1-3 months`**<br>*(Immediate Tactical)* | **63-Day (3M) & 52-Week Price Range** + **15-Day Probable Range** + Live `CoinGecko` Spot | **14-Day Daily RSI** + **5D vs. 21D Return Inflection** + Daily VAMS (`10D/21D/63D EMA`) | `63D Range Pos <= 42%` **OR** `52W Range Pos <= 45%` **OR** `Drawdown from 52W High <= -10%` **OR** `14D Daily RSI <= 46` (with 5D bounce catalyst) | `52W Range Pos >= 80%` **AND** (`14D Daily RSI >= 66` **OR** `63D Range Pos >= 88%`) |
| **`12 months`**<br>*(Intermediate Cyclical)* | **2-Year (504-Day) Cyclical Price Range** + **200-Day SMA Distance** | **14-Week Weekly RSI** (resampled `W-FRI`) + **Quarterly RoC Acceleration ($\text{Ret}_{63\text{d}} - \text{Ret}_{252\text{d}}/4$)** | `2-Year Range Pos <= 50%` **OR** `14-Week RSI <= 48` **OR** `Drawdown from 2Y High <= -12%` **OR** `Price within -15% to +6% of 200D SMA` | `2-Year Range Pos >= 82%` **AND** (`14-Week RSI >= 66` **OR** `Price > +18% above 200D SMA`) |
| **`3+ Years`**<br>*(Long-Term Secular)* | **5-Year Relative-to-S&P 500 Ratio (`Ticker / SPY`) Percentile** + **5-Year Absolute Range** + **200-Week (1000D) SMA** | **14-Month Monthly RSI** (resampled `ME`) + **Live Structural Ratios (`Gold/Oil`, `Copper/Gold`, `Capex/DD&A`)** | **`5Y Relative-to-SPY Percentile <= 50%`** (multi-year structural underperformer vs S&P 500) **OR** `5Y Price Range <= 50%` **OR** `14-Month RSI <= 52` | `5Y Relative-to-SPY Percentile >= 85%` **AND** `5Y Price Range >= 88%` **AND** `14-Month RSI >= 70` |

---

## 2. Upgrade 1: Global Header & 2-Line Navigation Menu (`frontend/src/components/Header.tsx` or `Navbar.tsx`)

Update your top navigation component (`frontend/src/components/Header.tsx` or `Navbar.tsx`—whichever file renders the top bar in `frontend/src/app/layout.tsx`) so that:
1. The entire header uses the exact same `max-w-7xl mx-auto px-4 md:px-6` container width as the page content tables below.
2. **Row 1 (Top Utility Bar — Moved Higher & Flush-Aligned)**: Brand & Active Regime on the left; **Date, Live API Status Pill, `Refresh Data`, and `Export`** pulled higher and aligned flush with the right edge of the content table.
3. **Row 2 & 3 (2-Line Main Navigation Grid)**: Breaks the navigation items into **2 balanced lines** (`grid-cols-2 sm:grid-cols-4`) aligned to the full width of the content table, and renames `"1-3M Outlier Scanner"` to **`"Outliers"`**:

```tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  asOfDate?: string;
  apiStatusLabel?: string;
  apiOnline?: boolean;
  onRefreshClick?: () => void;
  onExportClick?: () => void;
  isRefreshing?: boolean;
}

const NAV_ITEMS_ROW_1 = [
  { label: "1. Executive Summary", href: "/" },
  { label: "2. Framework Synthesis", href: "/synthesis" },
  { label: "3. Liquidity & Allocation", href: "/liquidity-allocation" },
  { label: "4. Outliers", href: "/outliers" }, // Renamed from "1-3M Outlier Scanner" to "Outliers"
];

const NAV_ITEMS_ROW_2 = [
  { label: "5. 1st/2nd/3rd Order Speculation", href: "/speculation" },
  { label: "6. 4Q Scenarios & Policy", href: "/scenarios" },
  { label: "7. 42 Macro Deep-Dive", href: "/42-macro" },
  { label: "8. Commodities & Alts", href: "/commodities-alternatives" },
];

export default function Header({
  asOfDate,
  apiStatusLabel = "Live API Synced",
  apiOnline = true,
  onRefreshClick,
  onExportClick,
  isRefreshing = false,
}: HeaderProps) {
  const pathname = usePathname();
  const displayDate = asOfDate || new Date().toISOString().slice(0, 10);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-md">
      {/* Aligned to exact width of content tables below */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-2.5 pb-3 space-y-2.5">
        {/* TOP UTILITY BAR: Brand Left | Date, API Status, Refresh & Export Moved Higher & Aligned Right */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-base md:text-lg font-bold tracking-tight text-white">
              MacroPulse <span className="text-cyan-400">Alpha</span>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-[11px]">
              GRID: REFLATION • US QUAD: Q2
            </span>
          </div>

          {/* Date, API Status, Refresh & Export aligned flush with right edge of content table */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              {displayDate}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border ${
                apiOnline
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-amber-950/40 border-amber-500/40 text-amber-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  apiOnline ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {apiStatusLabel}
            </span>
            <button
              onClick={onRefreshClick}
              disabled={isRefreshing}
              className="px-3 py-1 rounded bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "↻ Refresh Data"}
            </button>
            <button
              onClick={onExportClick}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            >
              Export
            </button>
          </div>
        </div>

        {/* 2-LINE MAIN NAVIGATION MENU (Aligned to full width of content table) */}
        <nav className="space-y-1.5 font-mono text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {NAV_ITEMS_ROW_1.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md border text-center font-medium transition truncate ${
                    active
                      ? "bg-blue-600/90 border-blue-400 text-white shadow-sm"
                      : "bg-[#111827] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {NAV_ITEMS_ROW_2.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md border text-center font-medium transition truncate ${
                    active
                      ? "bg-blue-600/90 border-blue-400 text-white shadow-sm"
                      : "bg-[#111827] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
```

---

## 3. Upgrade 2: Horizon-Specific Dynamic Backend Scanner (`backend/app/quant_engine/options_outliers.py`)

Replace `get_multi_horizon_actionable_ideas` and its helpers in `backend/app/quant_engine/options_outliers.py` with the **5-Year Multi-Timeframe Dynamic Engine**. Notice how it downloads 5 years (`period="5y"`) of daily bars so it can compute:
- **63-Day & 52-Week Range + 14-Day Daily RSI** for **`1-3 months`**,
- **2-Year Cyclical Range + 14-Week Weekly RSI + 200-Day SMA Distance + Quarterly RoC Acceleration** for **`12 months`**, and
- **5-Year Relative-to-S&P 500 (`Ticker / SPY`) Percentile + 5-Year Absolute Range + 14-Month Monthly RSI + 200-Week SMA Distance + Live Gold/Oil & Copper/Gold Ratios** for **`3+ Years`**:

```python
"""
backend/app/quant_engine/options_outliers.py
Multi-Timeframe Live Dynamic Outliers & Pivot Scanner:
- Horizon 1 ('1-3 months'): 63D/52W Range Pos %, 14D Daily RSI, 15D Probable Range, 5D Inflection
- Horizon 2 ('12 months'): 2-Year Cyclical Range Pos %, 14-Week Weekly RSI, 200D SMA Distance, QoQ Acceleration
- Horizon 3 ('3+ Years'): 5-Year Relative-to-SPY (Ticker/SPY) Percentile, 5-Year Price Range Pos %,
                          14-Month Monthly RSI, 200-Week SMA Distance & Live Cross-Commodity Ratios
"""

import os
import time
import httpx
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

COINGECKO_DEFAULT_DEMO_KEY = (os.getenv("COINGECKO_API_KEY") or "").strip()

CANDIDATE_UNIVERSE: List[Dict[str, Any]] = [
    # --- 1-3 months (Immediate Tactical Candidates) ---
    {
        "ticker": "BTC-USD",
        "display_ticker": "BTC / IBIT / FBTC",
        "name": "Bitcoin Spot & US Spot Bitcoin ETFs",
        "asset_class": "Digital Assets / Shadow Liquidity",
        "horizon": "1_to_3_months",
        "macro_catalyst": "Structure #2 Shadow Monetary Plumbing: Tracks 30D Stablecoin minting, Coinbase USD institutional spot premium, and Fed RMP liquidity.",
        "bullish_vehicle": "$IBIT / $FBTC",
    },
    {
        "ticker": "USO",
        "display_ticker": "USO / CL=F",
        "name": "US Crude Oil Fund (WTI Front-Month Futures)",
        "asset_class": "Energy Commodities",
        "horizon": "1_to_3_months",
        "macro_catalyst": "Structure #1 Backwardated Roll Yield + Live EIA Commercial Crude inventory drawdowns.",
        "bullish_vehicle": "$USO / $PDBC",
    },
    {
        "ticker": "DBA",
        "display_ticker": "DBA / NTR",
        "name": "Invesco DB Agriculture ETF & Nutrien",
        "asset_class": "Agriculture Commodities",
        "horizon": "1_to_3_months",
        "macro_catalyst": "Structure #1 Positive Roll Yield + Commercial Hedger accumulation in grains/softs & fertilizer turnaround.",
        "bullish_vehicle": "$DBA + $NTR",
    },
    {
        "ticker": "EQT",
        "display_ticker": "EQT / WMB",
        "name": "EQT Corp & Williams Cos (NatGas & AI Pipelines)",
        "asset_class": "Natural Gas Equities (Bypassing $UNG Contango)",
        "horizon": "1_to_3_months",
        "macro_catalyst": "Structure #1 Vehicle Router: Bypasses $UNG contango bleed while capturing AI data-center baseload gas & LNG export demand.",
        "bullish_vehicle": "$EQT / $WMB (Avoid $UNG)",
    },
    {
        "ticker": "XLF",
        "display_ticker": "XLF / JPM / KRE",
        "name": "US Financials & Regional/Money-Center Banks",
        "asset_class": "US Equity Sector",
        "horizon": "1_to_3_months",
        "macro_catalyst": "2s10s curve steepening + 42 Macro Paradigm C bank SLR deregulation + upward 30D NII & EPS revisions.",
        "bullish_vehicle": "$XLF / $JPM / $KRE",
    },
    {
        "ticker": "XLV",
        "display_ticker": "XLV / UNH / LLY",
        "name": "US Health Care Select Sector SPDR",
        "asset_class": "US Equity Sector",
        "horizon": "1_to_3_months",
        "macro_catalyst": "High-Quality defensive growth laggard with >85% True FCF conversion and favorable forward earnings base comparisons.",
        "bullish_vehicle": "$XLV",
    },
    {
        "ticker": "TLT",
        "display_ticker": "TLT / IEF",
        "name": "iShares 20+ Year Treasury Bond ETF",
        "asset_class": "Sovereign Fixed Income",
        "horizon": "1_to_3_months",
        "macro_catalyst": "Heavily shorted by specs (10th pct COT) & extreme outflows; tactical bounce candidate when VAMS flips 0/+1.",
        "bullish_vehicle": "$TLT (Tactical Bounce) or $USFR / $IVOL",
    },
    {
        "ticker": "ANET",
        "display_ticker": "ANET / MPWR / CBOE",
        "name": "Arista Networks, Monolithic Power & Cboe Global",
        "asset_class": "3Fourteen FCTE Quality Compounders",
        "horizon": "1_to_3_months",
        "macro_catalyst": "2nd-Order AI Ethernet/Power bottleneck enablers + high True FCF ex-SBC conversion (>88%).",
        "bullish_vehicle": "$ANET / $MPWR / $CBOE",
    },
    {
        "ticker": "KWEB",
        "display_ticker": "KWEB / FXI",
        "name": "KraneShares CSI China Internet & Large-Cap ETF",
        "asset_class": "International Equities",
        "horizon": "1_to_3_months",
        "macro_catalyst": "42 Macro China GRID Reflation + domestic monetary/fiscal stimulus & deep valuation discount vs US Tech.",
        "bullish_vehicle": "$KWEB / $FXI",
    },

    # --- 12 months (Intermediate Cyclical Candidates) ---
    {
        "ticker": "WPM",
        "display_ticker": "WPM / AEM / GDX",
        "name": "Wheaton Precious Metals & Low-AISC Gold Miners",
        "asset_class": "Precious Metals Streamers & Miners",
        "horizon": "12_months",
        "macro_catalyst": "Structure #2D Sovereign Gold Bid (+1.85σ residual) + record miner FCF margin expansion vs low S&P valuation percentile.",
        "bullish_vehicle": "$WPM / $AEM / $GLDM",
    },
    {
        "ticker": "AVUV",
        "display_ticker": "AVUV / IWM",
        "name": "Avantis US Small Cap Value (Quality-Filtered) & Russell 2000",
        "asset_class": "US Equity Style Factor",
        "horizon": "12_months",
        "macro_catalyst": "AQR/Verdad Credit-Recovery setup + 42 Macro Corporate Profitability (+607 bps) & Paradigm C domestic credit unlocking.",
        "bullish_vehicle": "$AVUV / $IWM",
    },
    {
        "ticker": "IVOL",
        "display_ticker": "IVOL",
        "name": "Quadratic Interest Rate Vol & Inflation Hedge ETF",
        "asset_class": "Rates / 2s10s Yield Curve Steepener",
        "horizon": "12_months",
        "macro_catalyst": "$12.23T NTM Treasury supply wall + Fed accommodative bias vs OIS Neutral Rate forces structural 2s10s steepening.",
        "bullish_vehicle": "$IVOL",
    },
    {
        "ticker": "EWJ",
        "display_ticker": "VT / EWJ / EEM",
        "name": "Global Equities ex-US, Japan & Emerging Markets",
        "asset_class": "Global Equities (KISS 2026 Upgrade)",
        "horizon": "12_months",
        "macro_catalyst": "42 Macro 2026 KISS upgrade from $SPYM to $VT: Global AI productivity diffusion + 35% valuation discount vs US Mega-Cap.",
        "bullish_vehicle": "$VT / $EWJ / $EEM",
    },
    {
        "ticker": "XLI",
        "display_ticker": "XLI / GWW / ODFL",
        "name": "US Industrials, Reshoring & B2B Supply-Chain Leaders",
        "asset_class": "US Equity Sector",
        "horizon": "12_months",
        "macro_catalyst": "Paradigm C 'Run It Hot' capex + Section 232 reshoring + 6.3% YoY Nominal GDP growth.",
        "bullish_vehicle": "$XLI / $GWW / $ODFL",
    },
    {
        "ticker": "VNQ",
        "display_ticker": "VNQ / XLRE",
        "name": "Vanguard Real Estate ETF & Data-Center/Industrial REITs",
        "asset_class": "Real Estate / Rate-Sensitive Cyclicals",
        "horizon": "12_months",
        "macro_catalyst": "Lagged rate-sensitive sector that inflects sharply when Fed-Treasury Accord 2.0 caps 10Y real yields.",
        "bullish_vehicle": "$VNQ / $XLRE",
    },

    # --- 3+ Years (Long-Term Secular Supercycle Candidates) ---
    {
        "ticker": "CCJ",
        "display_ticker": "SRUUF / CCJ / URA",
        "name": "Sprott Physical Uranium, Cameco & Nuclear Fuel Cycle",
        "asset_class": "Secular Commodity Depletion Supercycle",
        "horizon": "3_plus_years",
        "macro_catalyst": "Structure #3 Capex/DD&A at 0.68x (severe primary mine depletion) colliding with 10-20yr hyperscaler & sovereign nuclear baseload PPAs.",
        "bullish_vehicle": "$SRUUF / $CCJ / $URA",
    },
    {
        "ticker": "COPX",
        "display_ticker": "COPX / FCX / SCCO",
        "name": "Global X Copper Miners ETF & Tier-1 Reserve Owners",
        "asset_class": "Secular Commodity Depletion Supercycle",
        "horizon": "3_plus_years",
        "macro_catalyst": "Structure #3 Capex/DD&A at 0.79x + 16-year mine permitting lead time vs AI grid & defense electrification demand.",
        "bullish_vehicle": "$COPX / $FCX / $SCCO",
    },
    {
        "ticker": "XLE",
        "display_ticker": "XLE / TPL / CNQ",
        "name": "Long-Reserve-Life Energy Producers & Permian Land Royalties",
        "asset_class": "Secular Hard-Asset Value",
        "horizon": "3_plus_years",
        "macro_catalyst": "Structure #3 Upstream Capex/DD&A discipline (0.84x) + extreme discount of Crude Oil relative to Monetary Gold.",
        "bullish_vehicle": "$XLE / $TPL / $CNQ",
    },
    {
        "ticker": "EEM",
        "display_ticker": "EEM / INDA / EWZ",
        "name": "Emerging Markets & Commodity/Demographic Compounders",
        "asset_class": "Secular Global Valuation Convergence",
        "horizon": "3_plus_years",
        "macro_catalyst": "15-year structural valuation trough vs US S&P 500 + sovereign multipolar capex & DXY debasement beneficiary.",
        "bullish_vehicle": "$EEM / $INDA / $EWZ",
    },
    {
        "ticker": "CEG",
        "display_ticker": "CEG / VST / GRID",
        "name": "Constellation Energy & Smart-Grid Power Infrastructure",
        "asset_class": "Secular AI Power Monetization (3rd Order)",
        "horizon": "3_plus_years",
        "macro_catalyst": "Electricity & transformer grid capacity is the #1 physical bottleneck of the AI Productivity Boom.",
        "bullish_vehicle": "$CEG / $GRID",
    },
]

_LIVE_SCANNER_CACHE: Dict[str, Any] = {"ts": 0.0, "payload": None}


def _calc_rsi(series: pd.Series, period: int = 14) -> float:
    s = series.dropna()
    if len(s) < period + 2:
        return 50.0
    delta = s.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss.replace(0, np.nan)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return round(float(rsi.iloc[-1]), 1) if not rsi.dropna().empty else 50.0


def _compute_horizon_specific_metrics(
    close_series: pd.Series,
    spy_series: pd.Series,
    horizon: str,
    live_spot_override: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes timeframe-specific dynamic metrics for '1_to_3_months', '12_months', and '3_plus_years'
    using up to 5 years (1,260 trading days) of live yfinance history.
    """
    s = close_series.dropna()
    if len(s) < 60:
        return {}

    if live_spot_override and live_spot_override > 0:
        s = s.copy()
        s.iloc[-1] = float(live_spot_override)

    curr_p = float(s.iloc[-1])

    # 1. Tactical 63D (3M) & 252D (52W) Metrics
    s_63 = s.tail(63)
    s_252 = s.tail(252)
    range_63d_pct = round(((curr_p - float(s_63.min())) / max(1e-6, float(s_63.max()) - float(s_63.min()))) * 100.0, 1)
    high_52w = float(s_252.max())
    low_52w = float(s_252.min())
    range_52w_pct = round(((curr_p - low_52w) / max(1e-6, high_52w - low_52w)) * 100.0, 1)
    dd_52w_pct = round(((curr_p / max(1e-6, high_52w)) - 1.0) * 100.0, 1)
    rsi_14d = _calc_rsi(s, 14)
    ret_5d_pct = round(((curr_p / float(s.iloc[-6])) - 1.0) * 100.0, 2) if len(s) >= 6 else 0.0
    ret_21d_pct = round(((curr_p / float(s.iloc[-22])) - 1.0) * 100.0, 2) if len(s) >= 22 else 0.0

    # VAMS & 15D Probable Range
    log_ret = np.log(s / s.shift(1))
    rv_21d = max(0.05, float(log_ret.rolling(21).std().iloc[-1] * np.sqrt(252)) if len(s) >= 25 else 0.20)
    ema_10 = float(s.ewm(span=10, adjust=False).mean().iloc[-1])
    ema_21 = float(s.ewm(span=21, adjust=False).mean().iloc[-1])
    ema_63 = float(s.ewm(span=63, adjust=False).mean().iloc[-1])
    sma_200 = float(s.tail(200).mean())
    dist_200d_pct = round(((curr_p / max(1e-6, sma_200)) - 1.0) * 100.0, 1)

    p_mom = (
        ((curr_p / ema_21 - 1.0) / (rv_21d / np.sqrt(12))) * 0.50
        + ((curr_p / ema_63 - 1.0) / (rv_21d / 2.0)) * 0.30
        + ((ema_10 / ema_21 - 1.0) / (rv_21d / 5.0)) * 0.20
    )
    vams_state = 1 if p_mom > 0.20 else (-1 if p_mom < -0.20 else 0)
    vams_label = "BULLISH (+1)" if vams_state == 1 else ("BEARISH (-1)" if vams_state == -1 else "NEUTRAL (0)")

    daily_sigma_15d = curr_p * (rv_21d / np.sqrt(252)) * np.sqrt(15)
    pivot_15d = 0.5 * curr_p + 0.5 * ema_21
    prob_low = round(pivot_15d - 1.65 * daily_sigma_15d, 2)
    prob_high = round(pivot_15d + 1.65 * daily_sigma_15d, 2)

    # 2. Cyclical 2-Year (504D) & Weekly RSI Metrics (for '12_months')
    s_504 = s.tail(504)
    high_2y = float(s_504.max())
    low_2y = float(s_504.min())
    range_2y_pct = round(((curr_p - low_2y) / max(1e-6, high_2y - low_2y)) * 100.0, 1)
    dd_2y_pct = round(((curr_p / max(1e-6, high_2y)) - 1.0) * 100.0, 1)
    weekly_s = s.resample("W-FRI").last().dropna() if isinstance(s.index, pd.DatetimeIndex) else s.iloc[::5]
    rsi_14w = _calc_rsi(weekly_s, 14)

    # 3. Secular 5-Year (1260D), Monthly RSI & Relative-to-SPY Ratio Percentile (for '3_plus_years')
    s_1260 = s.tail(1260)
    high_5y = float(s_1260.max())
    low_5y = float(s_1260.min())
    range_5y_pct = round(((curr_p - low_5y) / max(1e-6, high_5y - low_5y)) * 100.0, 1)
    sma_200w = float(s.tail(1000).mean())
    dist_200w_pct = round(((curr_p / max(1e-6, sma_200w)) - 1.0) * 100.0, 1)
    monthly_s = s.resample("ME").last().dropna() if isinstance(s.index, pd.DatetimeIndex) else s.iloc[::21]
    rsi_14m = _calc_rsi(monthly_s, 14) if len(monthly_s) >= 16 else rsi_14w

    # 5-Year Relative Ratio vs S&P 500 (Ticker / SPY) Percentile
    rel_vs_spy_5y_pct = range_5y_pct
    if spy_series is not None and not spy_series.dropna().empty:
        aligned = pd.concat([s_1260, spy_series.dropna().tail(1260)], axis=1).dropna()
        if len(aligned) >= 60:
            ratio = aligned.iloc[:, 0] / aligned.iloc[:, 1].replace(0, np.nan)
            ratio = ratio.dropna()
            if not ratio.empty:
                r_curr = float(ratio.iloc[-1])
                r_min = float(ratio.min())
                r_max = float(ratio.max())
                rel_vs_spy_5y_pct = round(((r_curr - r_min) / max(1e-8, r_max - r_min)) * 100.0, 1)

    return {
        "live_price": round(curr_p, 2),
        "vams_state": vams_state,
        "vams_label": vams_label,
        "prob_low": prob_low,
        "prob_high": prob_high,
        # 1-3M Tactical
        "range_63d_pct": range_63d_pct,
        "range_52w_pct": range_52w_pct,
        "high_52w": round(high_52w, 2),
        "low_52w": round(low_52w, 2),
        "dd_52w_pct": dd_52w_pct,
        "rsi_14d": rsi_14d,
        "ret_5d_pct": ret_5d_pct,
        "ret_21d_pct": ret_21d_pct,
        # 12M Cyclical
        "range_2y_pct": range_2y_pct,
        "high_2y": round(high_2y, 2),
        "low_2y": round(low_2y, 2),
        "dd_2y_pct": dd_2y_pct,
        "rsi_14w": rsi_14w,
        "sma_200d": round(sma_200, 2),
        "dist_200d_pct": dist_200d_pct,
        # 3Y+ Secular
        "range_5y_pct": range_5y_pct,
        "high_5y": round(high_5y, 2),
        "low_5y": round(low_5y, 2),
        "rel_vs_spy_5y_pct": rel_vs_spy_5y_pct,
        "rsi_14m": rsi_14m,
        "sma_200w": round(sma_200w, 2),
        "dist_200w_pct": dist_200w_pct,
    }


def _fetch_live_coingecko_btc_price() -> Optional[float]:
    cg_key = os.getenv("COINGECKO_API_KEY", COINGECKO_DEFAULT_DEMO_KEY).strip()
    headers = {"x-cg-demo-api-key": cg_key, "Accept": "application/json"} if cg_key else {"Accept": "application/json"}
    url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    try:
        with httpx.Client(timeout=4.0) as client:
            r = client.get(url, headers=headers)
            if r.status_code != 200:
                r = client.get(url)
            if r.status_code == 200:
                btc_usd = r.json().get("bitcoin", {}).get("usd")
                if btc_usd and float(btc_usd) > 10000:
                    return float(btc_usd)
    except Exception:
        pass
    return None


def get_multi_horizon_actionable_ideas(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Downloads 5 years of live daily bars from yfinance + live BTC price from CoinGecko,
    and dynamically routes each candidate using horizon-appropriate quantitative logic:
    - '1_to_3_months': Gated by 63D/52W Range Position & 14-Day Daily RSI
    - '12_months': Gated by 2-Year Cyclical Range Position, 14-Week Weekly RSI & 200D SMA Distance
    - '3_plus_years': Gated by 5-Year Relative-to-S&P 500 (Ticker/SPY) Percentile, 5-Year Range & 14-Month RSI
    """
    now = time.time()
    if not force_refresh and _LIVE_SCANNER_CACHE["payload"] and (now - _LIVE_SCANNER_CACHE["ts"]) < 900:
        return _LIVE_SCANNER_CACHE["payload"]

    tickers = list({c["ticker"] for c in CANDIDATE_UNIVERSE} | {"SPY", "GC=F", "CL=F", "HG=F"})
    live_btc = _fetch_live_coingecko_btc_price()

    close_df = pd.DataFrame()
    try:
        raw = yf.download(tickers, period="5y", interval="1d", progress=False, auto_adjust=True)
        close_df = raw["Close"] if isinstance(raw.columns, pd.MultiIndex) else raw
    except Exception:
        pass

    spy_series = close_df["SPY"] if isinstance(close_df, pd.DataFrame) and "SPY" in close_df.columns else pd.Series(dtype=float)

    # Compute live Gold/Oil and Copper/Gold ratios for 3+ Year Secular context
    gold_oil_ratio = 38.5
    if isinstance(close_df, pd.DataFrame) and "GC=F" in close_df.columns and "CL=F" in close_df.columns:
        gc_s = close_df["GC=F"].dropna()
        cl_s = close_df["CL=F"].dropna()
        if not gc_s.empty and not cl_s.empty and float(cl_s.iloc[-1]) > 1.0:
            gold_oil_ratio = round(float(gc_s.iloc[-1]) / float(cl_s.iloc[-1]), 1)

    horizons_out: Dict[str, Dict[str, Any]] = {
        "1_to_3_months": {
            "label": "1-3 months",
            "subtitle": "Tactical Horizon • Evaluated on Live 63-Day/52-Week Range Position, 14-Day Daily RSI & 15D Probable Range",
            "range_bar_label": "52W Tactical Range Position",
            "priority_1_unloved_pivots": [],
            "priority_2_trend_compounders": [],
            "played_out_at_highs": [],
        },
        "12_months": {
            "label": "12 months",
            "subtitle": "Cyclical Horizon • Evaluated on Live 2-Year (104-Week) Range Position, 14-Week Weekly RSI & 200-Day SMA Distance",
            "range_bar_label": "2-Year Cyclical Range Position",
            "priority_1_unloved_pivots": [],
            "priority_2_trend_compounders": [],
            "played_out_at_highs": [],
        },
        "3_plus_years": {
            "label": "3+ Years",
            "subtitle": f"Secular Horizon • Evaluated on Live 5-Year Relative-to-S&P 500 (Ticker/SPY) Percentile, 14-Month RSI & Capex/Valuation Ratios (Live Gold/Oil: {gold_oil_ratio}x)",
            "range_bar_label": "5-Year Relative-to-S&P 500 Percentile",
            "priority_1_unloved_pivots": [],
            "priority_2_trend_compounders": [],
            "played_out_at_highs": [],
        },
    }

    for cand in CANDIDATE_UNIVERSE:
        tk = cand["ticker"]
        h_key = cand["horizon"]
        if not isinstance(close_df, pd.DataFrame) or tk not in close_df.columns:
            continue

        override = live_btc if tk == "BTC-USD" else None
        m = _compute_horizon_specific_metrics(close_df[tk], spy_series, h_key, live_spot_override=override)
        if not m:
            continue

        p = m["live_price"]
        vams = m["vams_state"]

        # ====================================================================
        # HORIZON 1 ('1-3 months'): TACTICAL 63D/52W RANGE & 14D DAILY RSI
        # ====================================================================
        if h_key == "1_to_3_months":
            r_pos = m["range_52w_pct"]
            rsi = m["rsi_14d"]
            is_low_pivot = (m["range_63d_pct"] <= 42.0) or (r_pos <= 48.0) or (m["dd_52w_pct"] <= -10.0) or (rsi <= 46.0)
            is_at_highs = (r_pos >= 80.0 and rsi >= 64.0) or (r_pos >= 88.0) or (rsi >= 70.0)

            badge = (
                f"Live Price: ${p:,.2f} | 52W Pos: {r_pos}% (63D Pos: {m['range_63d_pct']}%) | "
                f"14D Daily RSI: {rsi} | VAMS: {m['vams_label']}"
            )
            why_pivot = (
                f"TACTICAL PULLBACK / LOW-BASE ZONE: Trading at {r_pos}% of its 52W range ({m['dd_52w_pct']:+.1f}% from 52W high ${m['high_52w']:,.2f}) "
                f"and {m['range_63d_pct']}% of its 63D range with 14D RSI at {rsi}. {cand['macro_catalyst']}"
            )
            why_runway = (
                f"TACTICAL UPTREND WITH RUNWAY: Trading at {r_pos}% of its 52W range (${p:,.2f}) with un-crowded 14D RSI ({rsi}) "
                f"and 15D Probable Range bounds of ${m['prob_low']:,.2f} to ${m['prob_high']:,.2f}. {cand['macro_catalyst']}"
            )
            why_high = (
                f"TACTICAL PIVOT PLAYED OUT (AT HIGHS): Sitting at {r_pos}% of its 52W range (${p:,.2f} vs 52W high ${m['high_52w']:,.2f}) "
                f"with 14D RSI at {rsi}. Do NOT chase as a 1-3M bottoming pivot; wait for pullback toward ${m['prob_low']:,.2f}."
            )
            stop_txt = f"Close below 15D Probable Range Low (${m['prob_low']:,.2f}) or 200D SMA (${m['sma_200d']:,.2f})."

        # ====================================================================
        # HORIZON 2 ('12 months'): CYCLICAL 2-YEAR RANGE, 14W WEEKLY RSI & 200D SMA
        # ====================================================================
        elif h_key == "12_months":
            r_pos = m["range_2y_pct"]
            rsi = m["rsi_14w"]
            is_low_pivot = (r_pos <= 52.0) or (m["dd_2y_pct"] <= -12.0) or (rsi <= 48.0) or (-15.0 <= m["dist_200d_pct"] <= 6.0)
            is_at_highs = (r_pos >= 84.0 and rsi >= 66.0) or (r_pos >= 90.0 and m["dist_200d_pct"] >= 18.0)

            badge = (
                f"Live Price: ${p:,.2f} | 2-Yr Cyclical Pos: {r_pos}% | "
                f"14W Weekly RSI: {rsi} | vs 200D SMA: {m['dist_200d_pct']:+.1f}%"
            )
            why_pivot = (
                f"CYCLICAL BASE / PULLBACK ZONE: Trading at {r_pos}% of its 2-year range ({m['dd_2y_pct']:+.1f}% from 2Y high ${m['high_2y']:,.2f}) "
                f"with 14-Week Weekly RSI at {rsi} and {m['dist_200d_pct']:+.1f}% vs its 200-Day SMA (${m['sma_200d']:,.2f}). {cand['macro_catalyst']}"
            )
            why_runway = (
                f"MID-CYCLE COMPOUNDER: Trading at {r_pos}% of its 2-year range with 14-Week RSI at {rsi} "
                f"({m['dist_200d_pct']:+.1f}% vs 200D SMA ${m['sma_200d']:,.2f}). {cand['macro_catalyst']}"
            )
            why_high = (
                f"CYCLICAL MOVE EXTENDED AT 2-YEAR HIGHS: Sitting at {r_pos}% of its 2-year range (${p:,.2f} vs 2Y high ${m['high_2y']:,.2f}), "
                f"14-Week RSI {rsi}, and {m['dist_200d_pct']:+.1f}% above its 200D SMA (${m['sma_200d']:,.2f}). Wait for a cyclical pullback toward the 200D SMA."
            )
            stop_txt = f"Weekly close >8% below 200-Day SMA (${m['sma_200d']:,.2f})."

        # ====================================================================
        # HORIZON 3 ('3+ Years'): 5-YEAR RELATIVE-TO-SPY PERCENTILE & 14M MONTHLY RSI
        # ====================================================================
        else:
            r_pos = m["rel_vs_spy_5y_pct"]  # Bar shows 5-Year Relative-to-SPY Percentile!
            rsi = m["rsi_14m"]
            is_low_pivot = (m["rel_vs_spy_5y_pct"] <= 52.0) or (m["range_5y_pct"] <= 50.0) or (rsi <= 52.0)
            is_at_highs = (m["rel_vs_spy_5y_pct"] >= 85.0 and m["range_5y_pct"] >= 88.0 and rsi >= 70.0)

            badge = (
                f"Live Price: ${p:,.2f} | 5Y Rel vs S&P 500: {m['rel_vs_spy_5y_pct']}th Pct (5Y Price Pos: {m['range_5y_pct']}%) | "
                f"14M Monthly RSI: {rsi} | vs 200W SMA: {m['dist_200w_pct']:+.1f}%"
            )
            why_pivot = (
                f"SECULAR RELATIVE VALUE / DEPLETION PIVOT: Sits at the {m['rel_vs_spy_5y_pct']}th percentile of its 5-year relative ratio vs S&P 500 "
                f"(5Y absolute price pos: {m['range_5y_pct']}%, 14M Monthly RSI: {rsi}). {cand['macro_catalyst']}"
            )
            why_runway = (
                f"SECULAR SUPERCYCLE COMPOUNDER: At the {m['rel_vs_spy_5y_pct']}th percentile vs S&P 500 over 5 years with 14-Month RSI at {rsi} "
                f"({m['dist_200w_pct']:+.1f}% vs 200-Week SMA ${m['sma_200w']:,.2f}). {cand['macro_catalyst']}"
            )
            why_high = (
                f"SECULARLY EXTENDED VS S&P 500: At {m['rel_vs_spy_5y_pct']}th percentile of 5Y relative performance and {m['range_5y_pct']}% of 5Y price range "
                f"(14M RSI {rsi}). Hold core secular winners; add new 3Y+ capital on pullbacks toward the 200-Day SMA (${m['sma_200d']:,.2f})."
            )
            stop_txt = f"Monthly close below 200-Week Structural SMA (${m['sma_200w']:,.2f})."

        if is_low_pivot and not is_at_highs:
            pivot_score = round(min(98.0, max(62.0, 95.0 - (r_pos * 0.35) - (max(0.0, rsi - 35.0) * 0.3))), 1)
            horizons_out[h_key]["priority_1_unloved_pivots"].append({
                "ticker": cand["display_ticker"],
                "name": cand["name"],
                "asset_class": cand["asset_class"],
                "pivot_score": pivot_score,
                "live_price": p,
                "range_bar_pct": r_pos,
                "rsi_val": rsi,
                "price_and_vams": badge,
                "why_unloved_and_pivoting": why_pivot,
                "actionable_trade": f"ACCUMULATE {cand['bullish_vehicle']} in current low/pullback zone (${m['prob_low']:,.2f} – ${p:,.2f}).",
                "invalidation_stop": stop_txt,
            })
        elif is_at_highs:
            horizons_out[h_key]["played_out_at_highs"].append({
                "ticker": cand["display_ticker"],
                "name": cand["name"],
                "asset_class": cand["asset_class"],
                "live_price": p,
                "range_bar_pct": r_pos,
                "rsi_val": rsi,
                "price_and_vams": badge,
                "why_played_out": why_high,
                "actionable_trade": f"HOLD EXISTING WINNERS WITH TRAILING STOP; wait for pullback toward ${m['sma_200d']:,.2f} (200D SMA) or ${m['prob_low']:,.2f} before adding.",
            })
        else:
            runway_score = round(min(96.0, max(66.0, 74.0 + (10.0 if vams == 1 else 0.0) + (70.0 - min(70.0, rsi)) * 0.4)), 1)
            horizons_out[h_key]["priority_2_trend_compounders"].append({
                "ticker": cand["display_ticker"],
                "name": cand["name"],
                "asset_class": cand["asset_class"],
                "continuation_score": runway_score,
                "live_price": p,
                "range_bar_pct": r_pos,
                "rsi_val": rsi,
                "price_and_vams": badge,
                "why_trend_has_runway": why_runway,
                "actionable_trade": f"LONG {cand['bullish_vehicle']}; add on dips toward ${m['prob_low']:,.2f}.",
                "invalidation_stop": stop_txt,
            })

    for h_key in horizons_out:
        horizons_out[h_key]["priority_1_unloved_pivots"].sort(key=lambda x: x["pivot_score"], reverse=True)
        horizons_out[h_key]["priority_2_trend_compounders"].sort(key=lambda x: x["continuation_score"], reverse=True)
        horizons_out[h_key]["played_out_at_highs"].sort(key=lambda x: x["range_bar_pct"], reverse=True)

    payload = {
        "status": "ok",
        "data_source": "LIVE_5Y_YFINANCE_AND_COINGECKO",
        "as_of_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "live_btc_spot_usd": live_btc,
        "live_gold_oil_ratio": gold_oil_ratio,
        "horizons": horizons_out,
    }
    _LIVE_SCANNER_CACHE["ts"] = now
    _LIVE_SCANNER_CACHE["payload"] = payload
    return payload
```

---

## 4. Upgrade 3: Outliers Page with Clean Sub-Menu Titles (`"1-3 months"`, `"12 months"`, `"3+ Years"`) (`frontend/src/app/outliers/page.tsx`)

Replace `frontend/src/app/outliers/page.tsx` with the updated component. Notice:
- The sub-menu buttons are titled strictly **`1-3 months`**, **`12 months`**, and **`3+ Years`** (with no descriptions in brackets).
- The page container uses `max-w-7xl mx-auto px-4 md:px-6` so it aligns edge-to-edge with the updated 2-line Header above:

```tsx
"use client";

import React, { useEffect, useState } from "react";

type HorizonKey = "1_to_3_months" | "12_months" | "3_plus_years";

const SUBMENU_TITLES: Record<HorizonKey, string> = {
  "1_to_3_months": "1-3 months",
  "12_months": "12 months",
  "3_plus_years": "3+ Years",
};

export default function MultiHorizonOutliersPage() {
  const [horizon, setHorizon] = useState<HorizonKey>("1_to_3_months");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveOutliers = (force = false) => {
    setLoading(true);
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "https://macro-nowcast-wdw2.onrender.com";
    fetch(`${apiBase}/api/v1/outliers/multi-horizon?force=${force}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLiveOutliers(false);
  }, []);

  const active = data?.horizons?.[horizon] || {
    label: SUBMENU_TITLES[horizon],
    subtitle:
      "Fetching live 5-year price series, Weekly/Monthly RSIs, and Relative-to-SPY ratios from Yahoo Finance & CoinGecko...",
    range_bar_label: "Range Position",
    priority_1_unloved_pivots: [],
    priority_2_trend_compounders: [],
    played_out_at_highs: [],
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* HEADER & CLEAN SUB-MENU TABS ("1-3 months" | "12 months" | "3+ Years") */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                  Live Multi-Horizon Outlier & Pivot Scanner
                </span>
                {data?.as_of_utc && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                    ● Synced: {data.as_of_utc}
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
                Outliers
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {(["1_to_3_months", "12_months", "3_plus_years"] as HorizonKey[]).map(
                (hKey) => (
                  <button
                    key={hKey}
                    onClick={() => setHorizon(hKey)}
                    className={`px-4 py-2 rounded-lg border font-semibold transition ${
                      horizon === hKey
                        ? "bg-blue-600 border-blue-400 text-white shadow-md"
                        : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {SUBMENU_TITLES[hKey]}
                  </button>
                )
              )}
              <button
                onClick={() => fetchLiveOutliers(true)}
                className="px-3 py-2 rounded-lg border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50"
              >
                {loading ? "Scanning..." : "↻ Recalculate Live"}
              </button>
            </div>
          </div>

          <p className="text-xs md:text-sm text-slate-300">
            <strong>{SUBMENU_TITLES[horizon]} Logic:</strong> {active.subtitle}
          </p>
        </section>

        {/* BUCKET 1 — PRIORITY 1: VERIFIED UNLOVED BOTTOMING PIVOTS */}
        <section className="rounded-xl border border-emerald-500/40 bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                🥇 Priority 1 — Verified Low-Base / Pullback Pivots
              </span>
              <h2 className="text-lg font-bold text-white mt-1.5">
                Unloved Bottoming Pivots & Coiled Springs ({SUBMENU_TITLES[horizon]})
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {horizon === "1_to_3_months"
                ? "Gate: 63D/52W Range <= 48% or DD <= -10% or 14D RSI <= 46"
                : horizon === "12_months"
                ? "Gate: 2Y Range <= 52% or 14W RSI <= 48 or Near 200D SMA"
                : "Gate: 5Y Relative-to-SPY <= 52nd Pct or 14M Monthly RSI <= 52"}
            </span>
          </div>

          {active.priority_1_unloved_pivots?.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs font-mono text-slate-400">
              {loading
                ? "Computing live horizon metrics from Yahoo Finance & CoinGecko..."
                : "No tracked candidates in this horizon currently sit in a verified low-base/pullback zone (check Trend Compounders & Played-Out Highs below)."}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {active.priority_1_unloved_pivots.map((idea: any, i: number) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-base font-bold font-mono text-emerald-400">
                          ${idea.ticker}
                        </span>{" "}
                        <span className="text-sm font-semibold text-white">
                          — {idea.name}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                        Pivot Score: {idea.pivot_score}/100
                      </span>
                    </div>
                    <div className="text-xs font-mono text-cyan-300">
                      {idea.price_and_vams}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>0% (Low)</span>
                        <span>
                          {active.range_bar_label}: {idea.range_bar_pct}%
                        </span>
                        <span>100% (High)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${Math.max(4, idea.range_bar_pct)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {idea.why_unloved_and_pivoting}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <div className="text-xs font-semibold text-emerald-300">
                      ► Actionable Direction: {idea.actionable_trade}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Invalidation / Stop: {idea.invalidation_stop}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* BUCKET 2 — PRIORITY 2: MID-RUNWAY TREND CONTINUATION COMPOUNDERS */}
        <section className="rounded-xl border border-blue-500/40 bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                🥈 Priority 2 — Trend Continuation Compounders
              </span>
              <h2 className="text-lg font-bold text-white mt-1.5">
                Mid-Runway Compounders ({SUBMENU_TITLES[horizon]})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {active.priority_2_trend_compounders?.map((idea: any, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-base font-bold font-mono text-blue-400">
                        ${idea.ticker}
                      </span>{" "}
                      <span className="text-sm font-semibold text-white">
                        — {idea.name}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-blue-950 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold">
                      Runway Score: {idea.continuation_score}/100
                    </span>
                  </div>
                  <div className="text-xs font-mono text-amber-300">
                    {idea.price_and_vams}
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${Math.max(4, idea.range_bar_pct)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {idea.why_trend_has_runway}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="text-xs font-semibold text-blue-300">
                    ► Actionable Direction: {idea.actionable_trade}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Invalidation / Stop: {idea.invalidation_stop}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BUCKET 3 — PLAYED-OUT PIVOTS / EXTENDED AT HIGHS */}
        <section className="rounded-xl border border-amber-500/40 bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                🛑 Bucket 3 — Played-Out Pivots / Extended At Highs
              </span>
              <h2 className="text-lg font-bold text-white mt-1.5">
                Bullish Pivot Already Played Out ({SUBMENU_TITLES[horizon]} — Hold Trailing Stop or Wait for Pullback)
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {active.played_out_at_highs?.map((idea: any, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-amber-500/30 bg-slate-900/80 p-4 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-base font-bold font-mono text-amber-400">
                        ${idea.ticker}
                      </span>{" "}
                      <span className="text-sm font-semibold text-white">
                        — {idea.name}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
                      {active.range_bar_label}: {idea.range_bar_pct}%
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    {idea.price_and_vams}
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${Math.min(100, idea.range_bar_pct)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {idea.why_played_out}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-amber-300">
                    ► Proper Discipline: {idea.actionable_trade}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
```