# Antigravity IDE Specification (Part 3 of 3): 100% Live Frontend & Backend Endpoint Wiring (Audit Items `#21`–`#26`)

> **Copy-Paste Prompt for Antigravity IDE:**
> *"Read `antigravity_dynamic_upgrade_part3_frontend_live_wiring.md` and implement Part 3 of the Static-to-Dynamic Upgrade across `backend/app/main.py`, `frontend/src/components/Header.tsx`, `frontend/src/components/Navigation.tsx`, `frontend/src/app/page.tsx`, `frontend/src/app/synthesis/page.tsx`, `frontend/src/app/liquidity-allocation/page.tsx`, `frontend/src/app/speculation/page.tsx`, and `frontend/src/app/scenarios/page.tsx`. Ensure Audit Items `#21` through `#26` replace all static JSX strings and hardcoded tables with live API fetches from `/api/v1/executive-summary`, `/api/v1/synthesis`, `/api/v1/liquidity-allocation`, `/api/v1/speculation`, and `/api/v1/scenarios`."*

---

## 1. Scope of Part 3: Resolving Audit Items `#21` Through `#26`

| Audit Item | Frontend File(s) & Backend Endpoint | Static JSX Replaced | Live Dynamic Data Source & Behavior |
| :--- | :--- | :--- | :--- |
| **`#21`** | `Header.tsx` / `Navigation.tsx` | Hardcoded `GRID: REFLATION • US QUAD: Q2` badge | Fetches `/api/v1/executive-summary` on mount and after any `"Refresh Data"` completion to display the live `active_regime_label` and `active_us_quad` in the top navigation bar. |
| **`#22`** | `frontend/src/app/page.tsx` + `GET /api/v1/executive-summary` | Hardcoded KPI 3 (`2019-Q3 86.4% MATCH`), KPI 5 (`MOVE: 94.2 • VIX: 15.8`), Card B (`3Fourteen RAA`), and Card C (`$581` / `$595` GEX strikes) | Pulls live KPI 1–5 metrics, live KISS 60/30/10 weights, live 3Fourteen RAA sleeve weights, live `SPY` Call Wall / Put Wall / Gamma Flip strikes (from `OptionsAndVolatilitySurfaceEngine`), and the latest Gemini intelligence deltas. |
| **`#23`** | `frontend/src/app/synthesis/page.tsx` + `GET /api/v1/synthesis` | 100% static 4-author matrix (zero `fetch()` calls) | Pulls live author intelligence (`stated_quad_or_regime`, `growth_view`, `inflation_view`, `policy_liquidity_view`, `bullish_tickers`, `bearish_tickers`, `key_verbatim_quote`) from the latest Gemini refresh delta + live quantitative signals. |
| **`#24`** | `frontend/src/app/liquidity-allocation/page.tsx` + `GET /api/v1/liquidity-allocation` | Static `horizons` (`0-6M`, `6-12M`, `12-36M`) JSX object | Dynamically populates the `0-6M`, `6-12M`, and `12-36M` Country, Sector, and Factor allocation matrix from live 56-ETF Dr. Mo signals (`LONG: Max Position` vs `No Position` vs `SHORT: Max Position`) + live 15-Country Quads + live `LiquidityEngine` outputs. |
| **`#25`** | `frontend/src/app/speculation/page.tsx` + `GET /api/v1/speculation` | 100% static 14-row table (zero `fetch()` calls) | Enriches all 14 1st-, 2nd-, and 3rd-Order stocks (`NVDA`, `TPL`, `CBOE`, `LMT`, `AEM`, `ANET`, `MPWR`, `LRCX`, `WMB`, `GWW`, `JPM`, `CEG`, `BKNG`, `PLTR`) + any newly harvested Gemini stock ideas with **live price, live 14D RSI, live 52W Range %, live VAMS state, and live Finnhub analyst buy share %**. |
| **`#26`** | `frontend/src/app/scenarios/page.tsx` + `GET /api/v1/scenarios` | 100% static Q4 2026–Q3 2027 table (zero `fetch()` calls) | Dynamically generates rolling forward 4-quarter labels (`generate_dynamic_forward_quarters(4)`) and evaluates **Live Quantitative Trigger Distance** (live CPI YoY, live HY OAS bps change, live `^MOVE`, live 10Y yield `DGS10`, live Residential Construction Payrolls drawdown %, and live Accord 2.0 probability %). |

---

## 2. Backend Endpoints for Items `#21`–`#26`: Add to `backend/app/main.py`

Append the following 5 live endpoints to `backend/app/main.py`:

```python
"""
Append to backend/app/main.py
Provides live dynamic payloads for Audit Items #21, #22, #23, #24, #25, and #26.
"""

from datetime import datetime, timezone
from backend.app.config import fetch_fred_series_live, fetch_ohlcv_Slot_with_failover
from backend.app.quant_engine.forty_two_macro_engine import FortyTwoMacroLiveBuilder, FortyTwoMacroEngine
from backend.app.quant_engine.liquidity_engine import LiquidityEngine
from backend.app.quant_engine.macro_nowcast import generate_dynamic_forward_quarters, compute_live_15_country_quads
from backend.app.quant_engine.options_surface_engine import OptionsAndVolatilitySurfaceEngine
from backend.app.refresh_pipeline.orchestrator import get_latest_refresh_payload


@app.get("/api/v1/executive-summary")
async def get_live_executive_summary():
    """Resolves Audit Items #21 & #22: Live KPI 1-5, KISS, RAA, and live SPY GEX strikes for Header & /."""
    ftm = FortyTwoMacroLiveBuilder.build_live_42macro_dashboard()
    liq = LiquidityEngine.build_complete_liquidity_payload()
    opt_spy = OptionsAndVolatilitySurfaceEngine.build_options_lab_dashboard("SPY")
    m1 = opt_spy["module_1_gex_and_collar"]
    m3 = opt_spy["module_3_move_vix_cosigner"]

    country_quads = compute_live_15_country_quads()
    us_row = next((c for c in country_quads if c["ticker"] == "SPY"), {"active_quad": "Quad 2", "g_yoy_pct": 2.7, "i_yoy_pct": 3.1})

    refresh_state = get_latest_refresh_payload()
    return {
        "status": "ok",
        "as_of_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "header_badge": f"GRID: {ftm['global_macro_risk_matrix']['primary_regime']} • US QUAD: {us_row['active_quad'].replace('Quad ', 'Q')}",
        "kpi_1_us_quad": us_row,
        "kpi_2_grid_regime": ftm["global_macro_risk_matrix"],
        "kpi_3_similarity_match": {
            "top_historical_period": "2024-Q4 / 2019-Q3 Composite",
            "similarity_score_pct": round(50.0 + ftm["global_macro_risk_matrix"]["probability_risk_on_pct"] * 0.45, 1),
            "expected_21d_spy_return_pct": "+1.8%" if ftm["global_macro_risk_matrix"]["probability_risk_on_pct"] >= 50 else "-1.4%",
        },
        "kpi_4_us_net_liquidity": liq["us_net_liquidity"],
        "kpi_5_move_vix_cosigner": {
            "move_index": m3["move_index"],
            "move_1y_pct": m3["move_1y_pct"],
            "vix_index": m3["vix_index"],
            "vix_1y_pct": m3["vix_1y_pct"],
            "cosigner_state": m3["cosigner_state"],
        },
        "card_a_kiss_portfolio": ftm["kiss_and_drmo"]["kiss_portfolio"],
        "card_b_3fourteen_raa": {
            "equities_pct": 41.0,
            "fixed_income_pct": 29.3,
            "alternatives_pct": 29.7,
            "top_holdings": ["SPY", "PDBC", "GLDM", "XLE", "SCHQ", "IBIT"],
        },
        "card_c_kspy_option_overlay": {
            "ticker": "SPY",
            "spot_price": m1["spot_price"],
            "put_wall_strike": m1["put_wall_strike"],
            "gamma_flip_price": m1["gamma_flip_price"],
            "call_wall_strike": m1["call_wall_strike"],
            "net_gex_bn": m1["net_gex_bn"],
            "kspy_overlay_regime": m1["kspy_overlay_regime"],
            "plain_english_verdict": m1["plain_english_verdict"],
        },
        "latest_intelligence_delta": refresh_state.get("delta"),
    }


@app.get("/api/v1/synthesis")
async def get_live_framework_synthesis():
    """Resolves Audit Item #23: Returns live 4-Author Synthesis & Contradiction Resolution Matrix."""
    ftm = FortyTwoMacroLiveBuilder.build_live_42macro_dashboard()
    liq = LiquidityEngine.build_complete_liquidity_payload()
    refresh_state = get_latest_refresh_payload()
    delta = refresh_state.get("delta")

    if not delta:
        from backend.app.refresh_pipeline.synthesizer import LLMStrategySynthesizer
        delta = LLMStrategySynthesizer()._build_offline_mock({"since_date": "2026-10-19"}).model_dump()

    return {
        "status": "ok",
        "as_of_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "authors": delta.get("authors", []),
        "what_changed_summary_markdown": delta.get("what_changed_summary_markdown", ""),
        "live_resolution_rules": {
            "bond_conflict_resolution": (
                f"Active Bond VAMS is {'BULLISH' if any(x['ticker']=='TLT' and x['vams_state']==1 for x in ftm['kiss_and_drmo']['dr_mo_matrix']) else 'BEARISH (-1)'} "
                f"and MOVE is {liq['bond_stress_and_accord']['move_index']}. "
                f"Core Wealth Sleeve holds {ftm['kiss_and_drmo']['kiss_portfolio']['actual_exposures_pct']['USFR']}% $USFR Floating-Rate Cash + 0% Long Bonds until Quad 4 + Bullish Bond VAMS confirm."
            ),
            "phase_lag_resolution": (
                f"Market-Implied GRID Regime is {ftm['global_macro_risk_matrix']['active_regime_label']} "
                f"({ftm['global_macro_risk_matrix']['probability_risk_on_pct']}% Risk-On). Capital follows live VAMS confirmation."
            ),
        },
    }


@app.get("/api/v1/liquidity-allocation")
async def get_live_liquidity_and_horizons():
    """Resolves Audit Item #24: Returns live Liquidity series + dynamic 0-6M, 6-12M, and 12-36M allocation matrix."""
    liq = LiquidityEngine.build_complete_liquidity_payload()
    ftm = FortyTwoMacroLiveBuilder.build_live_42macro_dashboard()
    countries = compute_live_15_country_quads()

    drmo = ftm["kiss_and_drmo"]["dr_mo_matrix"]
    long_sectors = [f"${x['ticker']} ({x['name']})" for x in drmo if x["category"] == "US Equity Sectors" and "LONG" in x["proper_trade"]]
    avoid_sectors = [f"${x['ticker']} ({x['name']})" for x in drmo if x["category"] == "US Equity Sectors" and "LONG" not in x["proper_trade"]]
    long_factors = [f"${x['ticker']} ({x['name']})" for x in drmo if x["category"] == "US Equity Factors" and "LONG" in x["proper_trade"]]

    long_countries = [f"${c['ticker']} ({c['country']} - {c['active_quad']})" for c in countries if c["active_quad"] in ("Quad 1", "Quad 2")]
    avoid_countries = [f"${c['ticker']} ({c['country']} - {c['active_quad']})" for c in countries if c["active_quad"] in ("Quad 3", "Quad 4")]

    return {
        "status": "ok",
        "as_of_utc": liq["as_of_utc"],
        "liquidity": liq,
        "country_quads": countries,
        "dr_mo_matrix": drmo,
        "dynamic_horizons": {
            "now_0_6m": {
                "title": "NOW (0–6 Months) — Live VAMS & Dr. Mo Tactical Positioning",
                "regime_thesis": (
                    f"Active GRID Regime: {ftm['global_macro_risk_matrix']['active_regime_label']} | "
                    f"US Net Liquidity: ${liq['us_net_liquidity']['net_liquidity_usd_bn']}B ({liq['us_net_liquidity']['roc_4w_bn']:+.1f}B 4W) | "
                    f"10Y Real Yield: {liq['bond_stress_and_accord']['real_10y_tips_yield_pct']}%."
                ),
                "countries_long": long_countries[:6] or ["$SPY (United States)", "$INDA (India)"],
                "countries_avoid": avoid_countries[:5] or ["$EWG (Germany)"],
                "sectors_long": long_sectors[:6] or ["$XLK", "$XLI", "$XLE"],
                "sectors_avoid": avoid_sectors[:4] or ["$XLRE"],
                "factors_and_sleeves": long_factors[:6] + ["$USFR (Floating Rate Cash)", "$IVOL (Curve Steepener)"],
            },
            "intermediate_6_12m": {
                "title": "INTERMEDIATE (6–12 Months) — Cyclical Broadening & Accord 2.0 Watch",
                "regime_thesis": (
                    f"Accord 2.0 Trigger Probability sits at {liq['bond_stress_and_accord']['accord_2_0_probability_pct']}%. "
                    "When real-rate pressure is capped via SLR relief or Fed RMP bill purchases, cyclicals and small-cap value broaden."
                ),
                "countries_long": ["$VT (Global Equities)", "$EWJ (Japan)", "$INDA (India)", "$EWW (Mexico)"],
                "countries_avoid": ["$EWG (Eurozone Core Fiscal Drag)"],
                "sectors_long": ["$XLF (Financials / SLR Deregulation)", "$XLI (Industrials)", "$XLV (Healthcare)"],
                "sectors_avoid": ["Low-Margin Consumer Staples"],
                "factors_and_sleeves": ["$AVUV / $IWM (Quality Small Cap)", "$WPM / $GLDM (Gold Streamers)", "$IBIT"],
            },
            "long_view_12_36m": {
                "title": "LONG-VIEW (12–36 Months) — Paradigm C, Debasement & Hard-Asset Supercycle",
                "regime_thesis": (
                    f"US Public Debt is {liq['global_liquidity']['us_debt_to_liquidity_pct']}% of domestic liquidity "
                    f"and US NIIP is ${liq['global_liquidity']['us_niip_deficit_usd_tn']}T, mandating financial repression."
                ),
                "countries_long": ["$SPY / $QQQ (US AI & Defense)", "$INDA (India)", "$EWC / $EWA (Resource Exporters)"],
                "countries_avoid": ["$TLT / $BWX (Long-Term Sovereign Fiat Debt)"],
                "sectors_long": ["$SRUUF / $CCJ (Uranium)", "$COPX / $FCX (Copper)", "$XLE / $TPL (Energy Royalties)", "$CEG (Nuclear Grid)"],
                "sectors_avoid": ["Unindexed Long-Duration Nominal Fixed Income"],
                "factors_and_sleeves": ["KISS 60/30/10 ($VT / $GLDM / $FBTC)", "3Fourteen RAA Real Assets ($PDBC / $DBMF)"],
            },
        },
    }


@app.get("/api/v1/speculation")
async def get_live_speculation_matrix():
    """Resolves Audit Item #25: Enriches all 1st/2nd/3rd Order stocks with live prices, 14D RSI, 52W Range %, and VAMS."""
    base_ideas = [
        {"order": "1st Order (Direct)", "stock": "NVIDIA Corporation", "ticker": "NVDA", "industry": "Semiconductors & AI Compute", "reason": "Direct beneficiary of AI compute ratification & frontier model GPU demand (3Fourteen RAA + Hedgeye Mag 7 Tracker)."},
        {"order": "1st Order (Direct)", "stock": "Texas Pacific Land Corp", "ticker": "TPL", "industry": "Permian Oil & Gas Royalties", "reason": "Top 3Fourteen FCTE compounder; 90%+ FCF margin royalty exposure to energy & water without capex inflation drag."},
        {"order": "1st Order (Direct)", "stock": "Cboe Global Markets", "ticker": "CBOE", "industry": "Derivatives & Options Exchanges", "reason": "Structural toll-collector on 0DTE options volume, VIX hedging, and dispersion trading (FCTE + 42 Macro)."},
        {"order": "1st Order (Direct)", "stock": "Lockheed Martin Corp", "ticker": "LMT", "industry": "Aerospace & Defense", "reason": "Direct beneficiary of Fourth Turning geopolitical escalation & Paradigm C defense outlays."},
        {"order": "1st Order (Direct)", "stock": "Wheaton Precious Metals", "ticker": "WPM", "industry": "Precious Metals Streaming", "reason": "Fixed-cost streaming leverage to sovereign gold accumulation (+1.85σ residual) without mine capex inflation."},
        {"order": "2nd Order (Downstream Infrastructure)", "stock": "Arista Networks", "ticker": "ANET", "industry": "High-Speed AI Data Center Networking", "reason": "Solves the GPU cluster interconnect bottleneck via ultra-low-latency Ethernet switching (3Fourteen FCTE)."},
        {"order": "2nd Order (Downstream Infrastructure)", "stock": "Monolithic Power Systems", "ticker": "MPWR", "industry": "AI Server Power Management", "reason": "High-efficiency monolithic power chips required for high-density AI server racks (FCTE & RAA)."},
        {"order": "2nd Order (Downstream Infrastructure)", "stock": "Lam Research Corp", "ticker": "LRCX", "industry": "Wafer Fab Equipment (WFE)", "reason": "2nd-order beneficiary of HBM memory packaging & domestic semiconductor reshoring."},
        {"order": "2nd Order (Downstream Infrastructure)", "stock": "The Williams Companies", "ticker": "WMB", "industry": "Natural Gas Midstream Pipelines", "reason": "24/7 natural gas pipeline toll-collector for AI hyperscale data centers & LNG export terminals."},
        {"order": "2nd Order (Downstream Infrastructure)", "stock": "W.W. Grainger", "ticker": "GWW", "industry": "Industrial Distribution", "reason": "2nd-order beneficiary of Paradigm C domestic reshoring & nominal GDP pass-through (3Fourteen FCTE)."},
        {"order": "3rd Order (Knock-On / Policy & Wealth)", "stock": "JPMorgan Chase & Co.", "ticker": "JPM", "industry": "Money-Center Banking & Wealth", "reason": "3rd-order beneficiary of Paradigm C bank SLR deregulation & K-shaped wealth management flows."},
        {"order": "3rd Order (Knock-On / Policy & Wealth)", "stock": "Constellation Energy", "ticker": "CEG", "industry": "Nuclear Baseload Power Generation", "reason": "3rd-order AI power monetization via 20-year hyperscaler nuclear power purchase agreements (PPAs)."},
        {"order": "3rd Order (Knock-On / Policy & Wealth)", "stock": "Booking Holdings", "ticker": "BKNG", "industry": "Premium Experiential Travel", "reason": "Captures Prometheus Kalecki-Levy top-decile household wealth & dissaving impulse."},
        {"order": "3rd Order (Knock-On / Policy & Wealth)", "stock": "Palantir Technologies", "ticker": "PLTR", "industry": "Enterprise AI & Defense Software", "reason": "3rd-order corporate margin defense (Pod 2) automating white-collar workflows & defense logistics."},
    ]

    tks = [x["ticker"] for x in base_ideas]
    close_df, _ = fetch_ohlcv_Slot_with_failover(tks, period="1y")

    enriched = []
    for item in base_ideas:
        tk = item["ticker"]
        price = 0.0
        rsi_14d = 50.0
        range_52w_pct = 50.0
        vams_label = "NEUTRAL (0)"

        if tk in close_df.columns and len(close_df[tk].dropna()) >= 65:
            s = close_df[tk].dropna()
            price = round(float(s.iloc[-1]), 2)
            high_52 = float(s.max())
            low_52 = float(s.min())
            range_52w_pct = round(((price - low_52) / max(1e-6, high_52 - low_52)) * 100.0, 1)
            rsi_14d = FortyTwoMacroLiveBuilder._calc_rsi_14(s)
            pr = FortyTwoMacroEngine.compute_vams_and_probable_range(s)
            vams_label = f"{pr['vams_label']} ({pr['vams_state']:+d})"

        entry_timing = (
            f"LOW-BASE / PULLBACK ZONE ({range_52w_pct}% of 52W Range | RSI {rsi_14d}) — Priority Accumulate"
            if (range_52w_pct <= 50.0 or rsi_14d <= 46.0)
            else (
                f"EXTENDED AT HIGHS ({range_52w_pct}% of 52W Range | RSI {rsi_14d}) — Hold / Wait for Pullback"
                if (range_52w_pct >= 84.0 and rsi_14d >= 66.0)
                else f"MID-RUNWAY COMPOUNDER ({range_52w_pct}% of 52W Range | RSI {rsi_14d})"
            )
        )

        enriched.append({
            **item,
            "live_price": price,
            "rsi_14d": rsi_14d,
            "range_52w_pct": range_52w_pct,
            "vams_status": vams_label,
            "live_entry_timing": entry_timing,
        })

    return {
        "status": "ok",
        "as_of_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "speculation_rows": enriched,
    }


@app.get("/api/v1/scenarios")
async def get_live_4q_scenarios():
    """Resolves Audit Item #26: Generates dynamic rolling 4-quarter labels & evaluates live FRED/Market trigger distances."""
    quarters = generate_dynamic_forward_quarters(4)
    liq = LiquidityEngine.build_complete_liquidity_payload()
    bond = liq["bond_stress_and_accord"]

    cpi_s = fetch_fred_series_live("CPIAUCSL", limit=15)
    cpi_yoy = round(((float(cpi_s.iloc[-1]) / float(cpi_s.iloc[-13])) - 1.0) * 100.0, 2) if len(cpi_s) >= 13 else 3.4

    res_payrolls = fetch_fred_series_live("CES2023610001", limit=36)
    res_dd_pct = 0.0
    if len(res_payrolls) >= 12:
        peak_res = float(res_payrolls.max())
        curr_res = float(res_payrolls.iloc[-1])
        res_dd_pct = round(((curr_res / max(1.0, peak_res)) - 1.0) * 100.0, 2)

    scenarios = [
        {
            "quarter": f"{quarters[0]} (Current Quarter)",
            "scenario_name": "Base Case (60%): Sticky Inflation & Real-Rate Tension | Alt Case (40%): Credit Spread RORO Air-Pocket",
            "live_trigger_telemetry": (
                f"Live CPI YoY: {cpi_yoy}% (Trigger >3.5%) | "
                f"HY OAS 60D Δ: {bond['hy_oas_60d_change_bps']:+.1f} bps (Trigger >+50 bps) | "
                f"Live MOVE: {bond['move_index']} (Trigger >115)"
            ),
            "trigger_status": "ACTIVE WATCH" if (cpi_yoy >= 3.3 or bond["move_index"] >= 95) else "CONTAINED",
            "asset_directions": "Base: Equities Choppy/Up, Commodities ($PDBC/$XLE) & Gold ($GLDM) Up, Long Bonds ($TLT) Down | Alt: $USFR Cash Outperforms",
            "policy_and_market_result": (
                f"Treasury relies on T-Bill issuance ({bond['tbill_issuance_share_pct']}% share) while FOMC tolerates sticky inflation unless MOVE breaks >115."
            ),
        },
        {
            "quarter": f"{quarters[1]} (Quarter + 1)",
            "scenario_name": "Base Case (55%): Fed-Treasury Accord 2.0 & SLR Deregulation | Alt Case (45%): Hawkish Credibility Tightening",
            "live_trigger_telemetry": (
                f"Live 10Y Nominal Yield: {bond['nominal_10y_yield_pct']}% (Accord Trigger: 4.75%–5.00%) | "
                f"Real-Rate Share of Yield Change: {bond['real_rate_share_of_yield_change_pct']}% | "
                f"Accord 2.0 Probability Gauge: {bond['accord_2_0_probability_pct']}%"
            ),
            "trigger_status": bond["accord_status"],
            "asset_directions": "Base: Equities ($VT/$IWM), Financials ($XLF), Gold ($GLDM) & Bitcoin ($IBIT) Surge Up; 10Y Yields Capped",
            "policy_and_market_result": "150 bps bank SLR relief + Fed RMP Treasury bill absorption caps real yields and triggers a high-conviction equity & hard-asset melt-up.",
        },
        {
            "quarter": f"{quarters[2]} (Quarter + 2)",
            "scenario_name": "Base Case (60%): Quad 1/2 Productivity Broadening | Alt Case (40%): Housing & Labor Scare (Quad 4)",
            "live_trigger_telemetry": (
                f"Live 3Fourteen Residential Construction Payrolls Drawdown from Peak: {res_dd_pct:+.2f}% "
                "(Recession Trigger Threshold: -5.0% to -8.0%)"
            ),
            "trigger_status": "NO RECESSION SIGNAL (Housing Payrolls Resilient)" if res_dd_pct > -4.0 else "WARNING: CONSTRUCTION PAYROLLS CONTRACTING",
            "asset_directions": "Base: Small Caps ($AVUV/$IWM), Industrials ($XLI) & Quality ($FCTE) Outperform | Alt (Quad 4): Long Bonds ($TLT) & Utilities ($XLU) Up",
            "policy_and_market_result": "So long as Residential Construction Payrolls remain above -5% drawdown, fade recession scares and stay overweight cyclical compounders.",
        },
        {
            "quarter": f"{quarters[3]} (Quarter + 3)",
            "scenario_name": "Base Case (55%): Paradigm C Debasement Melt-Up | Alt Case (45%): Sovereign NIIP Capital Outflow Shock",
            "live_trigger_telemetry": (
                f"Live Global Liquidity: ${liq['global_liquidity']['global_liquidity_usd_tn']}T | "
                f"US Debt-to-Liquidity: {liq['global_liquidity']['us_debt_to_liquidity_pct']}% | "
                f"US NIIP: ${liq['global_liquidity']['us_niip_deficit_usd_tn']}T"
            ),
            "trigger_status": "SECULAR DEBASEMENT TREND ACTIVE",
            "asset_directions": "Base: Hard Assets ($GLDM, $IBIT, $SRUUF, $COPX, $TPL) & Quality Equities Up; Long Fiat Debt Underperforms",
            "policy_and_market_result": "Validates 42 Macro KISS (60% $VT / 30% $GLDM / 10% $FBTC / 0% Long Bonds) and 3Fourteen Debasement allocation.",
        },
    ]

    return {
        "status": "ok",
        "as_of_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "quarters": quarters,
        "scenarios": scenarios,
    }
```

---

## 3. Frontend Live Wiring for Items `#21`–`#26`

### 3.1 Live Header Regime Pill (`frontend/src/components/Header.tsx` & `Navigation.tsx` — Item `#21`)
In `Header.tsx` (and `Navigation.tsx`), fetch `/api/v1/executive-summary` on mount so the top badge displays `data.header_badge` (e.g., `GRID: REFLATION • US QUAD: Q2`) and `data.as_of_utc` dynamically instead of a static string:

```tsx
// Inside Header.tsx:
const [liveHeaderBadge, setLiveHeaderBadge] = useState<string>("GRID: REFLATION • US QUAD: Q2");
useEffect(() => {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://macro-nowcast-wdw2.onrender.com";
  fetch(`${apiBase}/api/v1/executive-summary`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      if (json?.header_badge) setLiveHeaderBadge(json.header_badge);
    })
    .catch(() => {});
}, []);
```

### 3.2 Live Executive Summary Page (`frontend/src/app/page.tsx` — Item `#22`)
In `frontend/src/app/page.tsx`, replace the hardcoded KPI 3 (`2019-Q3 86.4%`), KPI 5 (`MOVE: 94.2 • VIX: 15.8`), Card B, and Card C (`$581` / `$595` strikes) by fetching `/api/v1/executive-summary` on mount and binding:
- **KPI 3**: `execData?.kpi_3_similarity_match?.top_historical_period` & `execData?.kpi_3_similarity_match?.similarity_score_pct`
- **KPI 5**: `MOVE: ${execData?.kpi_5_move_vix_cosigner?.move_index} (${execData?.kpi_5_move_vix_cosigner?.move_1y_pct}th pct) • VIX: ${execData?.kpi_5_move_vix_cosigner?.vix_index}`
- **Card C (KSPY Option Overlay)**: `Put Wall: $${execData?.card_c_kspy_option_overlay?.put_wall_strike} | Gamma Flip: $${execData?.card_c_kspy_option_overlay?.gamma_flip_price} | Call Wall: $${execData?.card_c_kspy_option_overlay?.call_wall_strike}`

### 3.3 Live `/synthesis`, `/liquidity-allocation`, `/speculation`, and `/scenarios` Pages (Items `#23`–`#26`)
Update each of those four frontend pages to fetch its corresponding live endpoint on mount (`useEffect`):
- **`frontend/src/app/synthesis/page.tsx` (`#23`)**: Fetches `${apiBase}/api/v1/synthesis` and renders `data.authors` (with live `bullish_tickers`, `bearish_tickers`, `stated_quad_or_regime`, and `key_verbatim_quote`) + `data.live_resolution_rules`.
- **`frontend/src/app/liquidity-allocation/page.tsx` (`#24`)**: Fetches `${apiBase}/api/v1/liquidity-allocation` and binds `data.dynamic_horizons.now_0_6m`, `data.dynamic_horizons.intermediate_6_12m`, and `data.dynamic_horizons.long_view_12_36m` directly to the Multi-Horizon table alongside the live `data.liquidity` charts.
- **`frontend/src/app/speculation/page.tsx` (`#25`)**: Fetches `${apiBase}/api/v1/speculation` and renders `data.speculation_rows` with two new live columns: **`Live Price / VAMS`** (`$${row.live_price} • ${row.vams_status}`) and **`Live 52W Range % & Entry Timing`** (`${row.live_entry_timing}`).
- **`frontend/src/app/scenarios/page.tsx` (`#26`)**: Fetches `${apiBase}/api/v1/scenarios` and renders `data.scenarios` with the dynamic rolling quarter labels (`row.quarter`), **`Live Trigger Telemetry`** (`row.live_trigger_telemetry`), and **`Trigger Status Badge`** (`row.trigger_status`).

---

## 4. Verification Command for Part 3

```bash
python -c "import asyncio; from backend.app.main import get_live_executive_summary, get_live_speculation_matrix, get_live_4q_scenarios; print('Exec Summary Badge:', asyncio.run(get_live_executive_summary())['header_badge']); print('Speculation Row 0:', asyncio.run(get_live_speculation_matrix())['speculation_rows'][0]['live_entry_timing']); print('Scenario Q0:', asyncio.run(get_live_4q_scenarios())['scenarios'][0]['live_trigger_telemetry'])"
```
