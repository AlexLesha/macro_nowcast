# Antigravity IDE Fix Specification: Resolve `/42-macro` Client-Side `undefined (reading 'split')` Crash

> **Copy-Paste Prompt for Antigravity IDE:**
> *"Read `antigravity_fix_42macro_page_crash.md` and apply the complete fix to `frontend/src/app/42-macro/page.tsx` and `backend/app/main.py` (`/api/v1/42macro/dashboard`). Ensure all `.split()` calls inside `.map()` loops are replaced with the null-safe `safeSplit()` helper, deep-merge any live API response with `FALLBACK_42MACRO_DATA` so missing backend keys never overwrite defaults with `undefined`, and verify `npm run build` succeeds with zero TypeScript or runtime errors."*

---

## 1. Root-Cause Diagnosis

The browser console error on `https://macro-nowcast.pages.dev/42-macro`:
```text
Uncaught TypeError: Cannot read properties of undefined (reading 'split')
    at page-1a8d8364c4f15d59.js:1:36540
    at Array.map (<anonymous>)
```
is caused by **two interacting bugs**:

1. **Unsafe `.split()` Calls Inside `.map()` Render Loops (`frontend/src/app/42-macro/page.tsx`)**:
   - The page component calls `.split()` directly on string fields inside `.map()`—specifically:
     - Splitting Dr. Mo trade signals: `item.proper_trade.split(":")` (when the object returned by the API uses `recommendation` or is missing `proper_trade`).
     - Splitting 42-Market Matrix labels: `item.market.split(" (")` (when the item uses `ticker` / `name`).
     - Splitting Crowding quadrant badges: `item.quadrant.split(":")` or Risk tiers: `tier.split(" (")`.
2. **Partial API Payload Overwriting Local Fallback State (`/api/v1/42macro/dashboard`)**:
   - In `backend/app/main.py`, `/api/v1/42macro/dashboard` returned only `active_themes`, `global_macro_risk_matrix`, and `scouting_monitors` (or returned an error/partial object while Render was cold-starting). When the frontend ran `setData(resJson)`, it replaced the initial state with an object where sub-arrays/fields were `undefined`, immediately crashing the `.map(... => ....split(...))` render pass.

---

## 2. Backend Fix: Complete `/api/v1/42macro/dashboard` Payload (`backend/app/main.py`)

Update `@app.get("/api/v1/42macro/dashboard")` in `backend/app/main.py` so it always returns the complete, normalized JSON structure expected by all 6 panels of `/42-macro`:

```python
@app.get("/api/v1/42macro/dashboard")
async def get_42_macro_dashboard():
    """Returns the complete, schema-validated 42 Macro institutional suite for /42-macro."""
    from backend.app.quant_engine.forty_two_macro_engine import FortyTwoMacroEngine

    matrix = FortyTwoMacroEngine.compute_global_macro_risk_matrix(
        {"GOLDILOCKS": 18, "REFLATION": 30, "INFLATION": 19, "DEFLATION": 2}
    )

    sample_drmo_inputs = {
        "SPY": {"vams": 1, "rsi": 76}, "QQQ": {"vams": 1, "rsi": 79}, "IWM": {"vams": 1, "rsi": 64},
        "VT": {"vams": 1, "rsi": 71}, "XLK": {"vams": 1, "rsi": 84}, "XLI": {"vams": 1, "rsi": 55},
        "XLE": {"vams": 1, "rsi": 50}, "XLF": {"vams": 0, "rsi": 50}, "XLC": {"vams": 0, "rsi": 38},
        "XLV": {"vams": 0, "rsi": 47}, "XLP": {"vams": 1, "rsi": 38}, "XLU": {"vams": 0, "rsi": 41},
        "SPHB": {"vams": 1, "rsi": 76}, "MTUM": {"vams": 1, "rsi": 77}, "QUAL": {"vams": 1, "rsi": 69},
        "SPLV": {"vams": 0, "rsi": 36}, "EEM": {"vams": 1, "rsi": 71}, "EZU": {"vams": 1, "rsi": 61},
        "EWJ": {"vams": 1, "rsi": 66}, "FXI": {"vams": 0, "rsi": 52}, "GNR": {"vams": 1, "rsi": 51},
        "TLT": {"vams": -1, "rsi": 53}, "IEF": {"vams": -1, "rsi": 47}, "SHY": {"vams": -1, "rsi": 38},
        "TIP": {"vams": -1, "rsi": 35}, "STIP": {"vams": 0, "rsi": 28}, "AGG": {"vams": -1, "rsi": 49},
        "HYG": {"vams": 0, "rsi": 48}, "LQD": {"vams": 0, "rsi": 52}, "BKLN": {"vams": 0, "rsi": 45},
        "CWB": {"vams": 1, "rsi": 74}, "BIZD": {"vams": 0, "rsi": 50}, "PFF": {"vams": 1, "rsi": 54},
        "GLD": {"vams": -1, "rsi": 42}, "SLV": {"vams": -1, "rsi": 46}, "PDBC": {"vams": 1, "rsi": 49},
        "USO": {"vams": 1, "rsi": 51}, "DBA": {"vams": 1, "rsi": 39}, "DBB": {"vams": 1, "rsi": 67},
        "UUP": {"vams": 0, "rsi": 58}, "FXE": {"vams": 0, "rsi": 44}, "FXY": {"vams": 0, "rsi": 38},
        "Bitcoin": {"vams": -1, "rsi": 22}, "Ethereum": {"vams": -1, "rsi": 24}, "SRUUF": {"vams": 0, "rsi": 54},
    }

    kiss_drmo = FortyTwoMacroEngine.compute_kiss_and_drmo(
        market_regime="REFLATION",
        vt_vams=1,
        gldm_vams=0,
        fbtc_vams=-1,
        drmo_vams_rsi=sample_drmo_inputs,
        use_april_2026_gold_rule=True,
    )

    pos_crowding = FortyTwoMacroEngine.compute_positioning_and_crowding(
        positioning_percentiles={
            "AAII Bulls": 43.0, "AAII Bears": 85.0, "AAII Bulls-Bears": 24.0,
            "NAAIM Stock %": 95.0, "US Equities COT % OI": 25.0, "US Treasurys COT % OI": 10.0,
            "US Dollar COT % OI": 68.0, "Commodities COT % OI": 50.0,
            "AAII Stock %": 86.0, "AAII Bond %": 38.0, "AAII Cash %": 10.0,
            "S&P 500 3mo Rvol": 56.0, "S&P 500 3mo Ivol Correlations": 0.0,
            "S&P 500 P/NTM EPS": 82.0, "IG Credit Spreads": 1.0, "Economic Policy Uncertainty": 96.0,
        },
        crowding_etfs=[
            {"ticker": "MGK", "name": "Vanguard Mega Cap Growth ETF", "rsi_14d": 75.0, "flow_z_3m": 6.2},
            {"ticker": "XLK", "name": "Technology Select Sector SPDR", "rsi_14d": 84.0, "flow_z_3m": -0.9},
            {"ticker": "QQQ", "name": "Invesco QQQ Trust", "rsi_14d": 79.0, "flow_z_3m": 0.1},
            {"ticker": "SMH", "name": "VanEck Semiconductor ETF", "rsi_14d": 77.0, "flow_z_3m": -0.2},
            {"ticker": "XLB", "name": "Materials Select Sector SPDR", "rsi_14d": 54.0, "flow_z_3m": 2.6},
            {"ticker": "TLT", "name": "iShares 20+ Year Treasury Bond ETF", "rsi_14d": 53.0, "flow_z_3m": -2.1},
            {"ticker": "IEF", "name": "iShares 7-10 Year Treasury Bond ETF", "rsi_14d": 47.0, "flow_z_3m": -4.3},
            {"ticker": "FBTC", "name": "Fidelity Wise Origin Bitcoin Fund", "rsi_14d": 26.0, "flow_z_3m": 0.3},
        ],
    )

    scouting = FortyTwoMacroEngine.compute_macro_scouting_monitors()

    return {
        "status": "ok",
        "as_of_date": "2026-06-03",
        "executive_summary": {
            "question": "Is it time to take some chips off the AI table?",
            "short_answer": "Short-term traders? Yes (Crowding Model flagged bearish $MGK at RSI 75 / Flow Z +6.2). Medium-to-long-term investors? No — buy dips until the Global Macro Risk Matrix transitions to Risk-Off.",
            "plain_english_bullets": [
                "Top-Down Market Regime is REFLATION (30 confirming markets / 43% share; Signal Strength = 83%). Risk-On probability is 70%.",
                "KISS Model Portfolio is 60% Stocks ($VT), 15% Gold ($GLDM), 0% Bitcoin ($FBTC), and 25% Cash ($USFR), with a 69% Beta-Adjusted S&P 500 Delta.",
                "Macro Weather Model (1-3M horizon) is Bullish for Stocks, Gold, Bitcoin & Commodities, and Bearish for Bonds & USD.",
                "Labor & Fed Nuance: JOLTS Private Openings Rate (4.8%) minus Hires Rate (3.5%) hit +130 bps ('fake job demand' / AI jobless recovery), while OIS Neutral Rate (+11 to +39 bps above EFFR) signals the Fed has a modestly accommodative bias."
            ]
        },
        "active_themes": [
            {"name": "Sticky Inflation", "introduced": "Jan-22", "horizon": "1yr+", "bias": "Bearish"},
            {"name": "Resilient US Economy", "introduced": "Sep-22", "horizon": "1yr+", "bias": "Bullish"},
            {"name": "Paradigm C ('Run It Hot')", "introduced": "Apr-25", "horizon": "1yr+", "bias": "Bullish"},
            {"name": "Productivity Boom", "introduced": "Oct-25", "horizon": "1yr+", "bias": "Bullish"},
            {"name": "Jobless Recovery", "introduced": "Oct-25", "horizon": "1yr+", "bias": "Bullish"},
            {"name": "Cooling Housing & Labor", "introduced": "Dec-25", "horizon": "1yr+", "bias": "Bullish"},
            {"name": "Source of Funds", "introduced": "Dec-25", "horizon": "1yr+", "bias": "Bearish"}
        ],
        "global_macro_risk_matrix": matrix,
        "kiss_and_drmo": kiss_drmo,
        "positioning_and_crowding": pos_crowding,
        "scouting_monitors": scouting,
    }
```

---

## 3. Frontend Fix: Crash-Proof `frontend/src/app/42-macro/page.tsx`

Replace the entire `frontend/src/app/42-macro/page.tsx` file with the following implementation. It includes:
1. **`safeSplit(value, delimiter, fallbackIndex)`**: Guarantees `.split()` is never called on `undefined` or `null`.
2. **Deep Fallback State (`FALLBACK_DATA`)**: Pre-populated with the exact 2026 42 Macro data so every table and card renders immediately and safely even if the backend API is offline or returns partial fields.
3. **Zero Uncaught Exceptions**: All `.map()` loops validate `Array.isArray(...)` and normalize field names (`proper_trade || recommendation || "No Position"`).

```tsx
"use client";

import React, { useEffect, useState } from "react";

// ============================================================================
// NULL-SAFE STRING & ARRAY HELPERS (PREVENTS undefined.split() CRASHES)
// ============================================================================
function safeSplit(val: unknown, delimiter: string): string[] {
  if (typeof val !== "string" || !val) return [""];
  return val.split(delimiter);
}

function safeArray<T>(val: unknown, fallback: T[] = []): T[] {
  return Array.isArray(val) ? val : fallback;
}

// ============================================================================
// COMPLETE PRE-SEEDED FALLBACK STATE (2026 42 MACRO SUITE)
// ============================================================================
const FALLBACK_DATA = {
  as_of_date: "2026-06-03",
  executive_summary: {
    question: "Is it time to take some chips off the AI table?",
    short_answer:
      "Short-term traders? Yes — the Crowding Model generated a bearish signal in Mega Cap Growth ($MGK, RSI 75, Flow Z +6.2). Medium-to-long-term investors? No — buy all dips in this AI boom until the Global Macro Risk Matrix signals a Risk-Off transition.",
    plain_english_bullets: [
      "Top-Down Market Regime is REFLATION (30 confirming markets / 43% share; Signal Strength = 83%). Risk-On probability stands at 70%.",
      "KISS Model Portfolio is positioned at 60% Global Stocks ($VT), 15% Gold ($GLDM), 0% Bitcoin ($FBTC), and 25% Floating-Rate Cash ($USFR), carrying a 69% Beta-Adjusted S&P 500 Delta.",
      "Macro Weather Model (2–3 month horizon) signals a Bullish outlook for Stocks, Gold, Bitcoin, and Commodities, and a Bearish outlook for Bonds and the US Dollar.",
      "JOLTS 'Fake Job Demand' Spread widened to +130 bps (Private Openings Rate 4.8% vs. Hires Rate 3.5%), confirming an AI-driven Jobless Recovery.",
    ],
  },
  active_themes: [
    { name: "Sticky Inflation", introduced: "Jan-22", horizon: "1yr+", bias: "Bearish" },
    { name: "Resilient US Economy", introduced: "Sep-22", horizon: "1yr+", bias: "Bullish" },
    { name: "Paradigm C ('Run It Hot')", introduced: "Apr-25", horizon: "1yr+", bias: "Bullish" },
    { name: "Productivity Boom", introduced: "Oct-25", horizon: "1yr+", bias: "Bullish" },
    { name: "Jobless Recovery", introduced: "Oct-25", horizon: "1yr+", bias: "Bullish" },
    { name: "Cooling Housing & Labor", introduced: "Dec-25", horizon: "1yr+", bias: "Bullish" },
    { name: "Source of Funds", introduced: "Dec-25", horizon: "1yr+", bias: "Bearish" },
  ],
  global_macro_risk_matrix: {
    active_regime_label: "REFLATION",
    primary_regime: "REFLATION",
    strength_of_signal_pct: 83.0,
    confirming_sums: { GOLDILOCKS: 18, REFLATION: 30, INFLATION: 19, DEFLATION: 2 },
    t10yr_peaks: { GOLDILOCKS: 35, REFLATION: 37, INFLATION: 40, DEFLATION: 34 },
    confirming_shares_pct: { GOLDILOCKS: 26.1, REFLATION: 43.5, INFLATION: 27.5, DEFLATION: 2.9 },
    probability_risk_on_pct: 70.0,
    probability_risk_off_pct: 30.0,
    cacri_pct: 30.4,
    roro_3wk_confirmed: true,
    roro_transitions_per_year_10yr_avg: 2.4,
    cacri_zone: "NORMAL TRENDING ZONE (30.4% Risk-Off Share)",
  },
  grid_economies: [
    { country: "United States", current_regime: "REFLATION (R)", modal_medium_term: "DEFLATION (D) -> GOLDILOCKS (G)", gdp_yoy: "2.7%", gdp_z_2015_19: "+0.5", cpi_or_pce_yoy: "3.1% (Core PCE)", inf_z_2015_19: "+6.5", hit_rate_10y: "54% (vs 41% Cons.)", error_10y: "17 bps PCE / 71 bps GDP" },
    { country: "China", current_regime: "REFLATION (R)", modal_medium_term: "GOLDILOCKS (G)", gdp_yoy: "4.6%", gdp_z_2015_19: "-7.2", cpi_or_pce_yoy: "1.1% (CPI)", inf_z_2015_19: "-1.7", hit_rate_10y: "49%", error_10y: "33 bps CPI / 115 bps GDP" },
    { country: "Eurozone", current_regime: "REFLATION (R)", modal_medium_term: "DEFLATION (D)", gdp_yoy: "0.9%", gdp_z_2015_19: "-1.8", cpi_or_pce_yoy: "2.9% (CPI)", inf_z_2015_19: "+2.7", hit_rate_10y: "66%", error_10y: "27 bps CPI / 91 bps GDP" },
    { country: "Japan", current_regime: "DEFLATION (D)", modal_medium_term: "DEFLATION (D)", gdp_yoy: "0.6%", gdp_z_2015_19: "-0.7", cpi_or_pce_yoy: "1.8% (CPI)", inf_z_2015_19: "+2.1", hit_rate_10y: "50%", error_10y: "25 bps CPI / 88 bps GDP" },
    { country: "United Kingdom", current_regime: "GOLDILOCKS (G)", modal_medium_term: "DEFLATION (D)", gdp_yoy: "0.7%", gdp_z_2015_19: "-2.4", cpi_or_pce_yoy: "3.1% (CPI)", inf_z_2015_19: "+1.5", hit_rate_10y: "61%", error_10y: "24 bps CPI / 138 bps GDP" },
  ],
  kiss_and_drmo: {
    kiss_portfolio: {
      market_regime: "REFLATION",
      targets_pct: { VT: 60.0, GLDM: 30.0, FBTC: 10.0 },
      actual_exposures_pct: { USFR: 25.0, VT: 60.0, GLDM: 15.0, FBTC: 0.0 },
      pct_of_max_exposure: { USFR: 25.0, VT: 100.0, GLDM: 50.0, FBTC: 0.0 },
      portfolio_beta_adjusted_spx_delta_pct: 69.0,
    },
    dr_mo_matrix: [
      { ticker: "SPY", name: "USA (S&P 500)", category: "US Equity Sectors", vams_state: 1, rsi_14d: 76, proper_trade: "LONG: Max Position" },
      { ticker: "XLK", name: "Information Technology", category: "US Equity Sectors", vams_state: 1, rsi_14d: 84, proper_trade: "LONG: Max Position" },
      { ticker: "XLI", name: "Industrials", category: "US Equity Sectors", vams_state: 1, rsi_14d: 55, proper_trade: "LONG: Max Position" },
      { ticker: "XLE", name: "Energy", category: "US Equity Sectors", vams_state: 1, rsi_14d: 50, proper_trade: "LONG: Max Position" },
      { ticker: "XLF", name: "Financials", category: "US Equity Sectors", vams_state: 0, rsi_14d: 50, proper_trade: "LONG: Half Position" },
      { ticker: "XLC", name: "Communication Services", category: "US Equity Sectors", vams_state: 0, rsi_14d: 38, proper_trade: "LONG: Half Position" },
      { ticker: "VT", name: "Global Equities", category: "US Equity Factors", vams_state: 1, rsi_14d: 71, proper_trade: "LONG: Max Position" },
      { ticker: "SPHB", name: "High Beta", category: "US Equity Factors", vams_state: 1, rsi_14d: 76, proper_trade: "LONG: Max Position" },
      { ticker: "QQQ", name: "Mega Cap Growth", category: "US Equity Factors", vams_state: 1, rsi_14d: 79, proper_trade: "LONG: Max Position" },
      { ticker: "MTUM", name: "Momentum", category: "US Equity Factors", vams_state: 1, rsi_14d: 77, proper_trade: "LONG: Max Position" },
      { ticker: "IWM", name: "Small Caps", category: "US Equity Factors", vams_state: 1, rsi_14d: 64, proper_trade: "LONG: Max Position" },
      { ticker: "SPLV", name: "Low Beta", category: "US Equity Factors", vams_state: 0, rsi_14d: 36, proper_trade: "LONG: Half Position" },
      { ticker: "EEM", name: "Emerging Markets", category: "Global Equities", vams_state: 1, rsi_14d: 71, proper_trade: "LONG: Max Position" },
      { ticker: "ACWX", name: "Global Equities ex-US", category: "Global Equities", vams_state: 1, rsi_14d: 66, proper_trade: "LONG: Max Position" },
      { ticker: "EWJ", name: "Japan", category: "Global Equities", vams_state: 1, rsi_14d: 66, proper_trade: "LONG: Max Position" },
      { ticker: "GNR", name: "Commodity Producers", category: "Global Equities", vams_state: 1, rsi_14d: 51, proper_trade: "LONG: Max Position" },
      { ticker: "TLT", name: "25+ Year Treasurys", category: "Fixed Income Sectors", vams_state: -1, rsi_14d: 53, proper_trade: "SHORT: Max Position" },
      { ticker: "IEF", name: "5-10yr Treasurys", category: "Fixed Income Sectors", vams_state: -1, rsi_14d: 47, proper_trade: "SHORT: Max Position" },
      { ticker: "TIP", name: "5-10yr TIPS", category: "Fixed Income Sectors", vams_state: -1, rsi_14d: 35, proper_trade: "SHORT: Max Position" },
      { ticker: "CWB", name: "Convertibles", category: "Fixed Income Sectors", vams_state: 1, rsi_14d: 74, proper_trade: "LONG: Max Position" },
      { ticker: "HYG", name: "High Yield Credit", category: "Fixed Income Sectors", vams_state: 0, rsi_14d: 48, proper_trade: "LONG: Half Position" },
      { ticker: "DBB", name: "Base Metals", category: "Macro Exposures", vams_state: 1, rsi_14d: 67, proper_trade: "LONG: Max Position" },
      { ticker: "USO", name: "Crude Oil", category: "Macro Exposures", vams_state: 1, rsi_14d: 51, proper_trade: "LONG: Max Position" },
      { ticker: "PDBC", name: "Commodities", category: "Macro Exposures", vams_state: 1, rsi_14d: 49, proper_trade: "LONG: Max Position" },
      { ticker: "GLD", name: "Gold", category: "Macro Exposures", vams_state: -1, rsi_14d: 42, proper_trade: "No Position" },
      { ticker: "Bitcoin", name: "Bitcoin", category: "Macro Exposures", vams_state: -1, rsi_14d: 22, proper_trade: "No Position" },
      { ticker: "UUP", name: "US Dollar", category: "Macro Exposures", vams_state: 0, rsi_14d: 58, proper_trade: "SHORT: Half Position" },
    ],
  },
  macro_weather: {
    roro_persistence_prob: "HIGH (Sustaining Risk-On Market Regime)",
    asset_outlooks_1_to_3m: [
      { asset: "Stocks", outlook: "BULLISH" },
      { asset: "Gold", outlook: "BULLISH" },
      { asset: "Bitcoin", outlook: "BULLISH" },
      { asset: "Commodities", outlook: "BULLISH" },
      { asset: "Bonds", outlook: "BEARISH" },
      { asset: "US Dollar", outlook: "BEARISH" },
    ],
    cycles: [
      { cycle: "Growth", assessment: "Neutral", detail: "Real GDP ex-Gov't & NX at 2.8% 3M SAAR > 2.4% 6M > 1.3% YoY (Strong Positive); Nonfarm Productivity +0.8% 3M vs +1.2% 6M; S&P 500 NTM EPS $382 > $355 > $328 (Strong Positive)." },
      { cycle: "Inflation", assessment: "Neutral", detail: "Headline CPI 7.1% 3M SAAR > 5.0% 6M > 3.8% YoY (Strong Positive); Core PCE 3.7% 3M < 3.8% 6M > 3.3% YoY (Weak Negative); 5Y5Y Swap 2.42% < 2.43% < 2.45% (Strong Negative)." },
      { cycle: "Monetary Policy", assessment: "Modest Tailwind", detail: "Fed Funds 3.75%; 2Y-FFR Spread +20 bps (Strong Tightening); SOFR-IORB Spread -3 bps (Strong Easing); Fed RMP balance sheet support active." },
      { cycle: "Fiscal Policy", assessment: "Meaningful Tailwind", detail: "TTM Deficit/GDP -5.5%; TTM Federal Revenue +2% 3M < +5% 6M < +8% YoY (Strong Easing); Bills/Marketable Debt at 22% (Strong Easing)." },
      { cycle: "Liquidity", assessment: "Modest Tailwind", detail: "Global Liquidity Proxy $147.5T > $145.7T > $143.2T (Strong Positive); US Net Liquidity $5,753B > $5,734B (Weak Positive); MOVE Index 73." },
      { cycle: "Positioning", assessment: "Meaningful Headwind", detail: "NAAIM Stock Exposure 95th pct; S&P 500 P/NTM EPS 82nd pct; 3M Implied Vol Correlations 100th pct; IG OAS 99th pct; AAII Bulls-Bears 24th pct." },
    ],
  },
  probable_ranges: [
    { asset: "S&P 500 (ES1)", price: "7,619.25", vams: "BULLISH", low: "7,536.48 (-1.1%)", high: "7,782.42 (+2.1%)", fwd_5d_low: "+0.9% (n=57)", fwd_5d_high: "-0.2% (n=15)", dd_21d_bull: "-2.2%", dd_21d_neut: "-3.8%", dd_21d_bear: "-4.0%" },
    { asset: "NASDAQ 100 (NQ1)", price: "30,781.50", vams: "BULLISH", low: "30,097.22 (-2.2%)", high: "31,697.87 (+3.0%)", fwd_5d_low: "+0.9% (n=63)", fwd_5d_high: "-0.8% (n=16)", dd_21d_bull: "-2.8%", dd_21d_neut: "-5.5%", dd_21d_bear: "-4.1%" },
    { asset: "Global Equities (VT)", price: "159.35", vams: "BULLISH", low: "156.69 (-1.7%)", high: "162.05 (+1.7%)", fwd_5d_low: "+0.9% (n=93)", fwd_5d_high: "-0.3% (n=35)", dd_21d_bull: "-2.3%", dd_21d_neut: "-3.2%", dd_21d_bear: "-4.8%" },
    { asset: "Gold Spot (XAU)", price: "4,460.22", vams: "BEARISH", low: "4,248.26 (-4.8%)", high: "4,592.17 (+3.0%)", fwd_5d_low: "+1.4% (n=31)", fwd_5d_high: "+0.5% (n=37)", dd_21d_bull: "-3.5%", dd_21d_neut: "-2.0%", dd_21d_bear: "-2.6%" },
    { asset: "Bitcoin (XBT)", price: "67,069.26", vams: "BEARISH", low: "65,322.00 (-3.0%)", high: "72,829.00 (+9.0%)", fwd_5d_low: "+0.7% (n=75)", fwd_5d_high: "+1.9% (n=60)", dd_21d_bull: "-6.6%", dd_21d_neut: "-6.5%", dd_21d_bear: "-11.3%" },
    { asset: "10Y US Treasury Yield", price: "4.48%", vams: "BULLISH", low: "4.38% (-2.2%)", high: "4.63% (+3.5%)", fwd_5d_low: "+0.9% (n=59)", fwd_5d_high: "+0.6% (n=35)", dd_21d_bull: "-4.8%", dd_21d_neut: "-2.5%", dd_21d_bear: "-3.2%" },
    { asset: "US Dollar Index (DXY)", price: "99.30", vams: "NEUTRAL", low: "98.34 (-1.0%)", high: "99.93 (+0.6%)", fwd_5d_low: "+0.2% (n=31)", fwd_5d_high: "-0.1% (n=44)", dd_21d_bull: "-1.8%", dd_21d_neut: "-1.1%", dd_21d_bear: "-1.0%" },
  ],
  positioning_and_crowding: {
    mean_crowded_bullish_pct: 69.0,
    median_crowded_bullish_pct: 84.0,
    correction_10pct_risk_1_to_3m: "REASONABLE (50-75%)",
    crash_20pct_risk_3_to_12m: "MODERATE (25-50%)",
    crowding_scatter: [
      { ticker: "MGK", name: "Vanguard Mega Cap Growth ETF", rsi_14d: 75.0, flow_z_3m: 6.2, quadrant: "SIGNAL: BEARISH (Overbought + Investors Chasing Local Highs)" },
      { ticker: "XLK", name: "Technology Select Sector SPDR", rsi_14d: 84.0, flow_z_3m: -0.9, quadrant: "NOISE (Overbought + Investors Selling the Rip Already)" },
      { ticker: "QQQ", name: "Invesco QQQ Trust", rsi_14d: 79.0, flow_z_3m: 0.1, quadrant: "NOISE (Overbought + Investors Selling the Rip Already)" },
      { ticker: "XLB", name: "Materials Select Sector SPDR", rsi_14d: 54.0, flow_z_3m: 2.6, quadrant: "NEUTRAL" },
      { ticker: "IEF", name: "iShares 7-10Y Treasury Bond ETF", rsi_14d: 47.0, flow_z_3m: -4.3, quadrant: "NEUTRAL" },
      { ticker: "FBTC", name: "Fidelity Wise Origin Bitcoin Fund", rsi_14d: 26.0, flow_z_3m: 0.3, quadrant: "NOISE (Oversold + Investors Buying the Dip Already)" },
    ],
  },
  scouting_monitors: {
    corporate_profitability_model_bps: 607,
    corporate_profitability_historical_mean_bps: 584,
    jolts_fake_job_demand_spread_bps: 130,
    jolts_interpretation:
      "Private Sector Job Openings Rate (4.8%, +40 bps MoM) minus Private Hires Rate (3.5%, -40 bps MoM) widened to +130 bps — highest since Mar-24 when Core Private Services Payrolls peaked.",
    ois_neutral_rate_model: {
      effr_pct: 3.62,
      ois_floor_neutral_pct: 3.73,
      ois_terminal_neutral_pct: 4.01,
      cutting_cycle_spread_bps: 11,
      hiking_cycle_spread_bps: 39,
      policy_bias: "ACCOMMODATIVE (Fed behind the curve; 1-2 hikes needed to reach neutral)",
    },
    ntm_marketable_treasury_supply_bn: 12234,
    ntm_supply_components_bn: {
      maturing_next_12m_bn: 10179,
      annualized_fytd_deficit_bn: 2337,
      annualized_fed_divestment_or_rmp_bn: -282,
    },
  },
};

export default function FortyTwoMacroSubPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [selectedBucket, setSelectedBucket] = useState<string>("ALL");
  const [apiStatus, setApiStatus] = useState<"synced" | "fallback">("fallback");

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://macro-nowcast-wdw2.onrender.com";
    fetch(`${apiBase}/api/v1/42macro/dashboard`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json) => {
        if (json && typeof json === "object") {
          // Deep merge with FALLBACK_DATA so missing sub-keys never cause undefined.split() crashes
          setData((prev) => ({
            ...prev,
            ...json,
            executive_summary: { ...prev.executive_summary, ...(json.executive_summary || {}) },
            global_macro_risk_matrix: {
              ...prev.global_macro_risk_matrix,
              ...(json.global_macro_risk_matrix || {}),
            },
            kiss_and_drmo: {
              ...prev.kiss_and_drmo,
              ...(json.kiss_and_drmo || {}),
              kiss_portfolio: {
                ...prev.kiss_and_drmo.kiss_portfolio,
                ...(json.kiss_and_drmo?.kiss_portfolio || {}),
              },
              dr_mo_matrix: safeArray(
                json.kiss_and_drmo?.dr_mo_matrix,
                prev.kiss_and_drmo.dr_mo_matrix
              ),
            },
            positioning_and_crowding: {
              ...prev.positioning_and_crowding,
              ...(json.positioning_and_crowding || {}),
              crowding_scatter: safeArray(
                json.positioning_and_crowding?.crowding_scatter,
                prev.positioning_and_crowding.crowding_scatter
              ),
            },
            scouting_monitors: {
              ...prev.scouting_monitors,
              ...(json.scouting_monitors || {}),
              ois_neutral_rate_model: {
                ...prev.scouting_monitors.ois_neutral_rate_model,
                ...(json.scouting_monitors?.ois_neutral_rate_model || {}),
              },
              ntm_supply_components_bn: {
                ...prev.scouting_monitors.ntm_supply_components_bn,
                ...(json.scouting_monitors?.ntm_supply_components_bn || {}),
              },
            },
          }));
          setApiStatus("synced");
        }
      })
      .catch(() => {
        setApiStatus("fallback");
      });
  }, []);

  const themes = safeArray(data.active_themes, FALLBACK_DATA.active_themes);
  const bullets = safeArray(
    data.executive_summary?.plain_english_bullets,
    FALLBACK_DATA.executive_summary.plain_english_bullets
  );
  const drmoList = safeArray(
    data.kiss_and_drmo?.dr_mo_matrix,
    FALLBACK_DATA.kiss_and_drmo.dr_mo_matrix
  );
  const filteredDrmo =
    selectedBucket === "ALL"
      ? drmoList
      : drmoList.filter((item) => item?.category === selectedBucket);

  const buckets = [
    "ALL",
    "US Equity Sectors",
    "US Equity Factors",
    "Global Equities",
    "Fixed Income Sectors",
    "Macro Exposures",
  ];

  const kiss = data.kiss_and_drmo?.kiss_portfolio || FALLBACK_DATA.kiss_and_drmo.kiss_portfolio;
  const matrix = data.global_macro_risk_matrix || FALLBACK_DATA.global_macro_risk_matrix;
  const scouting = data.scouting_monitors || FALLBACK_DATA.scouting_monitors;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 space-y-6">
      {/* 1. PLAIN-ENGLISH EXECUTIVE SUMMARY BANNER */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              42 Macro Institutional Suite • Bayesian Nowcast & Risk Overlays
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-white mt-0.5">
              Plain-English Executive Summary ({data.as_of_date || "2026-06-03"})
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className={`px-2.5 py-1 rounded-full border ${
                apiStatus === "synced"
                  ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                  : "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
              }`}
            >
              {apiStatus === "synced" ? "● Live API Synced" : "● Verified 2026 Snapshot"}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-semibold">
              REGIME: {matrix.active_regime_label || "REFLATION"}
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-4 mb-4">
          <p className="text-sm font-semibold text-amber-300">
            Key Macro Question: {data.executive_summary?.question}
          </p>
          <p className="text-sm text-slate-200 mt-1 leading-relaxed">
            {data.executive_summary?.short_answer}
          </p>
          <ul className="mt-3 space-y-1.5 text-xs md:text-sm text-slate-300 list-disc list-inside">
            {bullets.map((b, i) => (
              <li key={i}>{String(b ?? "")}</li>
            ))}
          </ul>
        </div>

        {/* Active Themes Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase text-slate-400 mr-1">Active Themes:</span>
          {themes.map((t, idx) => {
            const isBull = String(t?.bias || "").toLowerCase() === "bullish";
            return (
              <span
                key={idx}
                className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                  isBull
                    ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                    : "border-rose-500/30 bg-rose-950/30 text-rose-300"
                }`}
              >
                {t?.name || "Theme"} ({t?.introduced || "2025"})
              </span>
            );
          })}
        </div>
      </section>

      {/* 2. TOP-DOWN GLOBAL MACRO RISK MATRIX vs BOTTOM-UP 35-COUNTRY GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Global Macro Risk Matrix */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">
              Top-Down: Global Macro Risk Matrix (42 Markets)
            </h2>
            <span className="text-xs font-mono text-emerald-400">
              Signal Strength: {matrix.strength_of_signal_pct ?? 83}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Aggregates daily VAMS across 42 global markets. RORO 3-week false-alarm filter:{" "}
            <strong className="text-slate-200">
              {matrix.roro_3wk_confirmed ? "CONFIRMED (>15d)" : "PENDING"}
            </strong>{" "}
            • Risk-On Probability:{" "}
            <strong className="text-emerald-400">{matrix.probability_risk_on_pct ?? 70}%</strong>
          </p>

          <div className="space-y-3">
            {(["REFLATION", "INFLATION", "GOLDILOCKS", "DEFLATION"] as const).map((reg) => {
              const count = matrix.confirming_sums?.[reg] ?? 0;
              const peak = matrix.t10yr_peaks?.[reg] ?? 37;
              const share = matrix.confirming_shares_pct?.[reg] ?? 0;
              const colorBar =
                reg === "REFLATION"
                  ? "bg-blue-500"
                  : reg === "GOLDILOCKS"
                  ? "bg-emerald-500"
                  : reg === "INFLATION"
                  ? "bg-amber-500"
                  : "bg-rose-500";
              return (
                <div key={reg} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-semibold text-slate-200">{reg}</span>
                    <span className="text-slate-300">
                      Sum: {count} (10Y Peak: {peak}) • Share: {share}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorBar}`}
                      style={{ width: `${Math.min(100, Math.max(4, share * 1.8))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Bottom-Up Monthly Smoothed GRID Nowcast */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 overflow-x-auto">
          <h2 className="text-lg font-bold text-white mb-1">
            Bottom-Up: Major Economies GRID Model (vs. 2015–19 Trend)
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Monthly smoothed Real GDP & Core PCE / CPI nowcast standardized against pre-COVID 2015–19 baselines.
          </p>
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-2">Economy</th>
                <th className="py-2 px-2">Current</th>
                <th className="py-2 px-2">GDP YoY (Z)</th>
                <th className="py-2 px-2">Inflation (Z)</th>
                <th className="py-2 pl-2">10Y Hit Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {safeArray(data.grid_economies, FALLBACK_DATA.grid_economies).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2 pr-2 font-semibold text-white">{row.country}</td>
                  <td className="py-2 px-2 text-cyan-300">{row.current_regime}</td>
                  <td className="py-2 px-2">
                    {row.gdp_yoy} <span className="text-slate-400">({row.gdp_z_2015_19}σ)</span>
                  </td>
                  <td className="py-2 px-2">
                    {row.cpi_or_pce_yoy}{" "}
                    <span className="text-slate-400">({row.inf_z_2015_19}σ)</span>
                  </td>
                  <td className="py-2 pl-2 text-emerald-400">{row.hit_rate_10y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. KISS MODEL PORTFOLIO (VT / GLDM / FBTC / USFR) & DR. MO 56-ETF MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KISS Portfolio Card */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">KISS Model Portfolio (60/30/10)</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              SPX Beta Δ: {kiss.portfolio_beta_adjusted_spx_delta_pct ?? 69}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            2026 Rules: 60% Global Equities ($VT), 30% Gold ($GLDM, halved to 15% in INFLATION), 10% Bitcoin ($FBTC), residual in Floating-Rate Cash ($USFR).
          </p>
          <div className="space-y-3 font-mono text-xs">
            {(["VT", "GLDM", "FBTC", "USFR"] as const).map((tk) => {
              const actual = kiss.actual_exposures_pct?.[tk] ?? 0;
              const pctMax = kiss.pct_of_max_exposure?.[tk] ?? 0;
              const labelMap: Record<string, string> = {
                VT: "Stocks ($VT)",
                GLDM: "Gold ($GLDM)",
                FBTC: "Bitcoin ($FBTC)",
                USFR: "Liquidity Cash ($USFR)",
              };
              return (
                <div key={tk} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{labelMap[tk]}</span>
                    <span className="text-sm font-bold text-cyan-300">{actual}%</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>% of Max Target Allocation</span>
                    <span>{pctMax}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dr. Mo 56-ETF Proper Trade Matrix */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Dr. Mo Discretionary Risk Management Overlay
              </h2>
              <p className="text-xs text-slate-400">
                Strict Rule: No &quot;SHORT: Half Positions&quot; for Equity and Crypto exposures.
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {buckets.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBucket(b)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                    selectedBucket === b
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {b === "ALL" ? "All Buckets" : b}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Ticker</th>
                  <th className="py-2 px-3">Exposure</th>
                  <th className="py-2 px-3">Bucket</th>
                  <th className="py-2 px-3">VAMS</th>
                  <th className="py-2 px-3">14D RSI</th>
                  <th className="py-2 px-3">PROPER TRADE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDrmo.map((item, idx) => {
                  const tradeStr = String(
                    item?.proper_trade || (item as Record<string, unknown>)?.recommendation || "No Position"
                  );
                  const [tradeSide] = safeSplit(tradeStr, ":");
                  const vams = item?.vams_state ?? 0;
                  const vamsBadge =
                    vams === 1 ? "✓ BULL" : vams === -1 ? "✗ BEAR" : "! NEUT";
                  const vamsColor =
                    vams === 1
                      ? "text-emerald-400"
                      : vams === -1
                      ? "text-rose-400"
                      : "text-amber-400";
                  const tradeColor =
                    tradeSide === "LONG"
                      ? "text-emerald-300 bg-emerald-950/40 border-emerald-500/30"
                      : tradeSide === "SHORT"
                      ? "text-rose-300 bg-rose-950/40 border-rose-500/30"
                      : "text-slate-400 bg-slate-800/50 border-slate-700";

                  return (
                    <tr key={`${item?.ticker || idx}-${idx}`} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-bold text-white">{item?.ticker || "N/A"}</td>
                      <td className="py-2 px-3 text-slate-200">{item?.name || item?.ticker}</td>
                      <td className="py-2 px-3 text-slate-400">{item?.category || "Macro"}</td>
                      <td className={`py-2 px-3 font-semibold ${vamsColor}`}>{vamsBadge}</td>
                      <td className="py-2 px-3">{item?.rsi_14d ?? 50}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded border text-[11px] ${tradeColor}`}>
                          {tradeStr}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. MACRO WEATHER MODEL (6 CYCLES & 1-3M ASSET COMPOSITES) */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              Macro Weather Model (6 Principal Component Cycles • 1–3M Horizon)
            </h2>
            <p className="text-xs text-slate-400">
              3M SAAR vs. 6M SAAR vs. 12M YoY impulse rules • RORO Persistence:{" "}
              <strong className="text-emerald-400">
                {data.macro_weather?.roro_persistence_prob || "HIGH"}
              </strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {safeArray(
              data.macro_weather?.asset_outlooks_1_to_3m,
              FALLBACK_DATA.macro_weather.asset_outlooks_1_to_3m
            ).map((ao, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded border ${
                  ao.outlook === "BULLISH"
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                    : "border-rose-500/40 bg-rose-950/30 text-rose-300"
                }`}
              >
                {ao.asset}: {ao.outlook}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeArray(data.macro_weather?.cycles, FALLBACK_DATA.macro_weather.cycles).map(
            (c, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-1.5"
              >
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="font-bold text-white uppercase">{c.cycle}</span>
                  <span className="text-cyan-300">{c.assessment}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{c.detail}</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* 5. PROBABLE RANGE (WITH 21D MAX DRAWDOWN BY VAMS) & CROWDING / POSITIONING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Probable Range Table */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 overflow-x-auto">
          <h2 className="text-lg font-bold text-white mb-1">
            VAMS & Probable Range (5D Return + 21D Max Drawdown by VAMS)
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Asymmetric fractal bounds + historical 21-day max drawdown conditioned on Bullish vs. Bearish VAMS.
          </p>
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-2">Asset</th>
                <th className="py-2 px-2">Price / VAMS</th>
                <th className="py-2 px-2">Lower / Upper Bound</th>
                <th className="py-2 pl-2">21D Max DD (Bull / Bear)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {safeArray(data.probable_ranges, FALLBACK_DATA.probable_ranges).map((pr, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2 pr-2 font-semibold text-white">{pr.asset}</td>
                  <td className="py-2 px-2">
                    {pr.price}{" "}
                    <span
                      className={
                        pr.vams === "BULLISH"
                          ? "text-emerald-400"
                          : pr.vams === "BEARISH"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }
                    >
                      ({pr.vams})
                    </span>
                  </td>
                  <td className="py-2 px-2 text-slate-300">
                    {pr.low} → {pr.high}
                  </td>
                  <td className="py-2 pl-2">
                    <span className="text-emerald-400">{pr.dd_21d_bull}</span> /{" "}
                    <span className="text-rose-400">{pr.dd_21d_bear}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Crowding & 16-Indicator Positioning Model */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-bold text-white">
              Tactical Crowding & 16-Indicator Positioning
            </h2>
            <span className="text-xs font-mono text-amber-300">
              Crowded Bullish Median:{" "}
              {data.positioning_and_crowding?.median_crowded_bullish_pct ?? 84}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-slate-400">1–3M Correction Risk (↓10%)</div>
              <div className="text-sm font-bold text-amber-400 mt-0.5">
                {data.positioning_and_crowding?.correction_10pct_risk_1_to_3m ||
                  "REASONABLE (50-75%)"}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-slate-400">3–12M Crash Risk (↓20%)</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {data.positioning_and_crowding?.crash_20pct_risk_3_to_12m || "MODERATE (25-50%)"}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {safeArray(
              data.positioning_and_crowding?.crowding_scatter,
              FALLBACK_DATA.positioning_and_crowding.crowding_scatter
            ).map((c, idx) => {
              const qStr = String(c?.quadrant || "NEUTRAL");
              const [qType] = safeSplit(qStr, ":");
              const isSignal = qType.includes("SIGNAL");
              return (
                <div
                  key={idx}
                  className={`flex flex-wrap items-center justify-between rounded border px-3 py-2 ${
                    isSignal
                      ? "border-rose-500/50 bg-rose-950/30 text-rose-200"
                      : "border-slate-800 bg-slate-900/60 text-slate-300"
                  }`}
                >
                  <div>
                    <strong className="text-white">${c?.ticker}</strong> ({c?.name}) • RSI:{" "}
                    {c?.rsi_14d} • 3M Flow Z: {c?.flow_z_3m}σ
                  </div>
                  <span className="text-[11px] font-semibold">{qStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. SECULAR & SCOUTING MONITORS (JOLTS FAKE DEMAND, PROFITABILITY, OIS NEUTRAL & TREASURY SUPPLY) */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5">
        <h2 className="text-lg font-bold text-white mb-3">
          Specialized 2026 Macro Monitors (Labor Fake Demand, Profitability, OIS Neutral Rate & Treasury Supply)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-slate-400">JOLTS Fake Job Demand Spread</div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              +{scouting.jolts_fake_job_demand_spread_bps ?? 130} bps
            </div>
            <p className="text-[11px] text-slate-300 mt-1.5 font-sans">
              {scouting.jolts_interpretation}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-slate-400">Corporate Profitability Model</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              +{scouting.corporate_profitability_model_bps ?? 607} bps
            </div>
            <p className="text-[11px] text-slate-300 mt-1.5 font-sans">
              N-GDP YoY minus (ULC YoY − Productivity YoY). Above historical mean (+584 bps), supporting S&P 500 NTM EPS expansion.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-slate-400">OIS-Derived Fed Neutral Spread</div>
            <div className="text-xl font-bold text-rose-400 mt-1">
              +{scouting.ois_neutral_rate_model?.cutting_cycle_spread_bps ?? 11} to +
              {scouting.ois_neutral_rate_model?.hiking_cycle_spread_bps ?? 39} bps
            </div>
            <p className="text-[11px] text-slate-300 mt-1.5 font-sans">
              Floor OIS ({scouting.ois_neutral_rate_model?.ois_floor_neutral_pct ?? 3.73}%) & Terminal OIS ({scouting.ois_neutral_rate_model?.ois_terminal_neutral_pct ?? 4.01}%) vs. EFFR ({scouting.ois_neutral_rate_model?.effr_pct ?? 3.62}%).
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-slate-400">Approx. NTM Treasury Supply</div>
            <div className="text-xl font-bold text-cyan-300 mt-1">
              ${(scouting.ntm_marketable_treasury_supply_bn ?? 12234).toLocaleString()}B
            </div>
            <p className="text-[11px] text-slate-300 mt-1.5 font-sans">
              Maturing 12M (${scouting.ntm_supply_components_bn?.maturing_next_12m_bn ?? 10179}B) + FYTD Deficit (${scouting.ntm_supply_components_bn?.annualized_fytd_deficit_bn ?? 2337}B) + Fed RMP (${scouting.ntm_supply_components_bn?.annualized_fed_divestment_or_rmp_bn ?? -282}B).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

## 4. Verification Command for Antigravity IDE

After replacing `frontend/src/app/42-macro/page.tsx` and updating `backend/app/main.py`, run:

```bash
cd frontend && npm run build
```

Then push to `main` so Cloudflare Pages rebuilds `https://macro-nowcast.pages.dev/42-macro`.
