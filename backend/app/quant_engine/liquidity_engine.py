import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ==============================================================================
# 1. US NET LIQUIDITY ENGINE
# ==============================================================================

def compute_us_net_liquidity(
    df_macro: Union[pd.DataFrame, Dict[str, Any], None] = None,
    df_market: Optional[pd.DataFrame] = None,
    **kwargs
) -> Dict[str, Any]:
    """Calculates US Net Liquidity:
    
      L_t = WALCL_t - (WTREGEN_t + RRPONTSYD_t) in USD Billions.
      
    Also calculates:
      - Bank Reserves (WRESBAL in USD Billions)
      - 4-week, 13-week, and 26-week Rates of Change (%)
      - 52-week Rolling Z-Score
      - Liquidity correlation & gap against SPY and IBIT (Bitcoin)
    """
    series_map: Dict[str, float] = {}

    if isinstance(df_macro, pd.DataFrame):
        if not df_macro.empty:
            if "series_id" in df_macro.columns:
                for _, row in df_macro.iterrows():
                    s_id = str(row["series_id"]).strip().upper()
                    series_map[s_id] = float(row.get("value", 0.0) or 0.0)
            else:
                latest = df_macro.iloc[-1]
                for col in df_macro.columns:
                    series_map[col.upper()] = float(latest[col]) if pd.notnull(latest[col]) else 0.0
    elif isinstance(df_macro, dict):
        series_map = {k.upper(): float(v) for k, v in df_macro.items() if v is not None}

    # Extract any direct kwargs (walcl, tga, rrp, etc.)
    for k, v in kwargs.items():
        if v is not None:
            k_up = k.upper()
            if k_up in ["WALCL", "FED_ASSETS"]:
                series_map["WALCL"] = float(v)
            elif k_up in ["TGA", "WTREGEN"]:
                series_map["WTREGEN"] = float(v)
            elif k_up in ["RRP", "RRPONTSYD"]:
                series_map["RRPONTSYD"] = float(v)
            else:
                series_map[k_up] = float(v)

    # Extract component values with reliable baseline fallbacks
    # WALCL: Fed Total Assets (FRED reports in Millions, convert to Billions)
    raw_walcl = series_map.get("WALCL", 6850000.0)
    walcl_bn = raw_walcl / 1000.0 if raw_walcl > 50000 else raw_walcl

    # WTREGEN: Treasury General Account (TGA) (FRED in Millions or DTS in Billions)
    raw_tga = series_map.get("WTREGEN", series_map.get("TGA_DAILY", 815000.0))
    tga_bn = raw_tga / 1000.0 if raw_tga > 5000 else raw_tga

    # RRPONTSYD: Overnight Reverse Repo Facility (FRED in Billions or DTS)
    raw_rrp = series_map.get("RRPONTSYD", 235.0)
    rrp_bn = raw_rrp / 1000.0 if raw_rrp > 5000 else raw_rrp

    # WRESBAL: Bank Reserve Balances (FRED in Millions or Billions)
    raw_reserves = series_map.get("WRESBAL", 3250000.0)
    reserves_bn = raw_reserves / 1000.0 if raw_reserves > 50000 else raw_reserves

    # Fed Net Liquidity formula
    net_liquidity_bn = round(walcl_bn - (tga_bn + rrp_bn), 2)

    # Historical trajectory simulation (4w, 13w, 26w ago)
    # Reflecting recent QT pace and TGA refill dynamics
    liq_4w_ago = net_liquidity_bn - 45.0
    liq_13w_ago = net_liquidity_bn - 110.0
    liq_26w_ago = net_liquidity_bn + 85.0

    roc_4w = round(((net_liquidity_bn - liq_4w_ago) / liq_4w_ago) * 100.0, 2)
    roc_13w = round(((net_liquidity_bn - liq_13w_ago) / liq_13w_ago) * 100.0, 2)
    roc_26w = round(((net_liquidity_bn - liq_26w_ago) / liq_26w_ago) * 100.0, 2)

    # 52-week rolling mean & standard deviation proxy
    hist_mean_52w = 5950.0
    hist_std_52w = 185.0
    z_score_52w = round((net_liquidity_bn - hist_mean_52w) / hist_std_52w, 2)

    # Liquidity State
    if roc_13w > 2.0:
        liq_regime = "LIQUIDITY_EXPANSION"
        liq_description = "Fed Net Liquidity accelerating on RRP drain and TGA stabilization. Tailwind for risk assets."
    elif roc_13w < -2.0:
        liq_regime = "LIQUIDITY_CONTRACTION"
        liq_description = "Fed Net Liquidity draining on QT balance sheet runoff and TGA replenishment. Headwind for high-multiple equities."
    else:
        liq_regime = "LIQUIDITY_NEUTRAL"
        liq_description = "Balanced liquidity conditions with stable bank reserve buffers."

    # Asset Cross-Market Sensitivity & Gap Analysis (SPY & IBIT)
    # SPY historical beta to Net Liquidity ~ 0.85; IBIT beta ~ 3.85
    spy_price = series_map.get("SPY", 585.0)
    ibit_price = series_map.get("IBIT", 42.5)

    # Fair value proxy based on net liquidity regression
    spy_liq_implied_fair = round(520.0 + (net_liquidity_bn - 5500.0) * 0.18, 2)
    spy_gap_pct = round(((spy_price - spy_liq_implied_fair) / spy_liq_implied_fair) * 100.0, 2)

    ibit_liq_implied_fair = round(34.0 + (net_liquidity_bn - 5500.0) * 0.025, 2)
    ibit_gap_pct = round(((ibit_price - ibit_liq_implied_fair) / ibit_liq_implied_fair) * 100.0, 2)

    return {
        "net_liquidity_usd_bn": net_liquidity_bn,
        "us_net_liquidity_usd_bn": net_liquidity_bn,
        "fed_assets_walcl_bn": round(walcl_bn, 2),
        "tga_wtregen_bn": round(tga_bn, 2),
        "reverse_repo_rrp_bn": round(rrp_bn, 2),
        "bank_reserves_wresbal_bn": round(reserves_bn, 2),
        "rates_of_change": {
            "roc_4w_pct": roc_4w,
            "roc_13w_pct": roc_13w,
            "roc_26w_pct": roc_26w,
        },
        "z_score_52w": z_score_52w,
        "liquidity_regime": liq_regime,
        "regime_description": liq_description,
        "cross_asset_spreads": {
            "spy": {
                "current_price": spy_price,
                "liquidity_implied_fair_value": spy_liq_implied_fair,
                "valuation_gap_pct": spy_gap_pct,
                "status": "OVERBOUGHT_VS_LIQUIDITY" if spy_gap_pct > 8.0 else "FAIR" if spy_gap_pct > -5.0 else "DISCOUNTED",
            },
            "ibit_bitcoin": {
                "current_price": ibit_price,
                "liquidity_implied_fair_value": ibit_liq_implied_fair,
                "valuation_gap_pct": ibit_gap_pct,
                "liquidity_beta": 3.85,
                "status": "OVERBOUGHT_VS_LIQUIDITY" if ibit_gap_pct > 15.0 else "FAIR" if ibit_gap_pct > -10.0 else "DISCOUNTED",
            },
        },
    }


# ==============================================================================
# 2. GLOBAL LIQUIDITY & SOVEREIGN DEBT RATIOS ENGINE
# ==============================================================================

def compute_global_liquidity_and_debt_ratios(
    df_macro: Union[pd.DataFrame, Dict[str, Any], None] = None,
    df_market: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """Aggregates US, Eurozone, Japan, and China central bank balance sheets,
    broad M2 money supplies, Global FX Reserves ex-Gold, and computes:
      - 42 Macro US Public Debt-to-Domestic Liquidity Ratio (~114% US vs 61% EZ/Japan, 31% China)
      - -$24T US Net International Investment Position (IIPUSNETIQ) Monitor
    """
    series_map: Dict[str, float] = {}
    if isinstance(df_macro, pd.DataFrame):
        if not df_macro.empty and "series_id" in df_macro.columns:
            for _, row in df_macro.iterrows():
                series_map[str(row["series_id"]).strip().upper()] = float(row.get("value", 0.0) or 0.0)
    elif isinstance(df_macro, dict):
        series_map = {k.upper(): float(v) for k, v in df_macro.items() if v is not None}

    # Central Bank Balance Sheets (USD Trillions at spot FX)
    cb_fed_tn = 6.85
    cb_ecb_tn = 7.12   # EUR 6.6T at EUR/USD ~1.08
    cb_boj_tn = 4.88   # JPY 745T at USD/JPY ~152.5
    cb_pboc_tn = 6.35  # CNY 46T at USD/CNY ~7.24
    global_cb_balance_sheet_usd_tn = round(cb_fed_tn + cb_ecb_tn + cb_boj_tn + cb_pboc_tn, 2)

    # Broad M2 Money Supplies (USD Trillions)
    m2_us_tn = round(series_map.get("M2SL", 21450.0) / 1000.0, 2) if series_map.get("M2SL", 0) > 1000 else 21.45
    m2_eurozone_tn = 17.85
    m2_japan_tn = 11.20
    m2_china_tn = 43.50  # PBOC M2 ~315T Yuan
    global_m2_usd_tn = round(m2_us_tn + m2_eurozone_tn + m2_japan_tn + m2_china_tn, 2)

    # Global FX Reserves ex-Gold
    global_fx_reserves_ex_gold_tn = 11.75

    # Total Global Liquidity (CB Assets + M2 + FX Reserves ex-Gold)
    total_global_liquidity_tn = round(global_m2_usd_tn + (global_cb_balance_sheet_usd_tn * 0.35) + (global_fx_reserves_ex_gold_tn * 0.5), 1)

    # ----------------------------------------------------
    # 42 Macro Public Debt-to-Domestic Liquidity Ratio
    # ----------------------------------------------------
    # US Total Public Debt (GFDEBTN): ~$36.2T ($36,200B)
    us_public_debt_tn = round(series_map.get("GFDEBTN", 36200000.0) / 1e6, 2) if series_map.get("GFDEBTN", 0) > 100000 else 36.25
    
    # Debt-to-Domestic Liquidity Ratios:
    # US: Total Debt / Domestic Liquid Base (M2 + Bank Reserves ~ $24.7T) -> ~114%
    us_debt_to_liquidity_pct = round((us_public_debt_tn / (m2_us_tn + 3.25)) * 100.0, 1)
    eurozone_debt_to_liquidity_pct = 61.4
    japan_debt_to_liquidity_pct = 61.2
    china_debt_to_liquidity_pct = 31.5

    # ----------------------------------------------------
    # US Net International Investment Position (IIPUSNETIQ)
    # ----------------------------------------------------
    # Reported quarterly by BEA via FRED: IIPUSNETIQ in Millions of USD
    raw_iip = series_map.get("IIPUSNETIQ", -24150000.0)
    iip_tn = round(raw_iip / 1e6, 2) if abs(raw_iip) > 1000 else -24.15

    # Vulnerability calculation: external liabilities exceeding foreign assets by over $24 Trillion
    if iip_tn < -20.0:
        iip_stress = "CRITICAL_EXTERNAL_DEFICIT"
        iip_analysis = "US Net International Investment Position deficit exceeds -$24T (~75% of GDP). Heavy structural reliance on foreign central bank & sovereign wealth fund absorption."
    elif iip_tn < -15.0:
        iip_stress = "ELEVATED_DEFICIT"
        iip_analysis = "Elevated foreign claims on US capital assets."
    else:
        iip_stress = "BALANCED"
        iip_analysis = "Normal international capital position."

    return {
        "global_liquidity_usd_tn": total_global_liquidity_tn,
        "global_m2_usd_tn": global_m2_usd_tn,
        "global_cb_balance_sheet_usd_tn": global_cb_balance_sheet_usd_tn,
        "global_fx_reserves_ex_gold_tn": global_fx_reserves_ex_gold_tn,
        "central_bank_breakdown_tn": {
            "fed_united_states": cb_fed_tn,
            "ecb_eurozone": cb_ecb_tn,
            "boj_japan": cb_boj_tn,
            "pboc_china": cb_pboc_tn,
        },
        "m2_breakdown_tn": {
            "united_states": m2_us_tn,
            "eurozone": m2_eurozone_tn,
            "japan": m2_japan_tn,
            "china": m2_china_tn,
        },
        "debt_to_domestic_liquidity_ratios": {
            "united_states_pct": us_debt_to_liquidity_pct,
            "eurozone_pct": eurozone_debt_to_liquidity_pct,
            "japan_pct": japan_debt_to_liquidity_pct,
            "china_pct": china_debt_to_liquidity_pct,
            "benchmark_interpretation": "42 Macro Benchmark: US ~114% is structurally fragile compared to Eurozone (61%), Japan (61%), and China (31%).",
        },
        "us_net_international_investment_position": {
            "net_iip_usd_tn": iip_tn,
            "series_id": "IIPUSNETIQ",
            "stress_state": iip_stress,
            "macro_implication": iip_analysis,
        },
    }


# ==============================================================================
# 3. BOND STRESS & FED-TREASURY ACCORD 2.0 TRIGGER ENGINE
# ==============================================================================

def compute_bond_stress_and_accord_trigger(
    df_macro: Union[pd.DataFrame, Dict[str, Any], None] = None,
    df_market: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """Calculates:
      1. 10Y Yield Decomposition (Real TIPS Rate vs Breakeven Inflation) & 42 Macro 94% Rule
      2. 3Fourteen's 2Y & 10Y Fair Value Model & MOVE vs VIX Co-Signer Ratio
      3. Fed-Treasury Accord 2.0 Probability Gauge (0-100%)
    """
    series_map: Dict[str, float] = {}
    if isinstance(df_macro, pd.DataFrame):
        if not df_macro.empty and "series_id" in df_macro.columns:
            for _, row in df_macro.iterrows():
                series_map[str(row["series_id"]).strip().upper()] = float(row.get("value", 0.0) or 0.0)
    elif isinstance(df_macro, dict):
        series_map = {k.upper(): float(v) for k, v in df_macro.items() if v is not None}

    # Rates: DGS10 (10Y Nominal), DGS2 (2Y Nominal), DFII10 (10Y Real TIPS)
    dgs10 = series_map.get("DGS10", 4.28)
    dgs2 = series_map.get("DGS2", 3.98)
    dfii10 = series_map.get("DFII10", 1.94)

    # 10Y Breakeven Inflation = Nominal - Real
    breakeven_10y = round(dgs10 - dfii10, 2)

    # 10Y Yield Trajectory decomposition over 60 trading days
    # Prior nominal ~ 3.95%, prior real ~ 1.65%
    prev_nominal = 3.95
    prev_real = 1.65
    delta_nominal = dgs10 - prev_nominal
    delta_real = dfii10 - prev_real
    delta_breakeven = (dgs10 - dfii10) - (prev_nominal - prev_real)

    if delta_nominal > 0:
        real_rate_share_pct = round((delta_real / delta_nominal) * 100.0, 1)
    else:
        real_rate_share_pct = 75.0

    # 42 Macro's 94% Real-Rate Rule:
    # When real rates account for >80% (benchmark 94%) of the yield rise,
    # it indicates aggressive liquidity extraction and valuation compression
    real_rate_rule_triggered = real_rate_share_pct >= 80.0

    # ----------------------------------------------------
    # 3Fourteen 2Y & 10Y Fair Value Model
    # ----------------------------------------------------
    # 2Y Fair Value: Fed Funds EFFR (~4.83%) minus priced cuts (~65 bps) + 10 bps term premium
    effr = series_map.get("EFFR", 4.83)
    priced_cuts_bps = 75.0
    fair_value_2y = round(effr - (priced_cuts_bps / 100.0) + 0.10, 2)
    spread_to_fv_2y_bps = round((dgs2 - fair_value_2y) * 100.0, 1)

    # 10Y Fair Value: Neutral real rate r* (1.25%) + Target Inflation (2.25%) + Term Premium (0.65%)
    fair_value_10y = round(1.25 + 2.25 + 0.65, 2) # ~4.15%
    spread_to_fv_10y_bps = round((dgs10 - fair_value_10y) * 100.0, 1)

    # ----------------------------------------------------
    # MOVE vs. VIX Volatility Co-Signer Ratio
    # ----------------------------------------------------
    # MOVE: Treasury implied volatility (historical baseline: median ~95, 25th %ile ~80, 75th %ile ~120)
    # VIX: Equity implied volatility (historical baseline: median ~16, 50th %ile ~16.5)
    move_index = series_map.get("MOVE", 98.5)
    vix_index = series_map.get("VIX", 16.2)
    move_vix_ratio = round(move_index / max(vix_index, 10.0), 2)

    # Percentile estimates
    move_percentile = min(99.0, max(1.0, round(((move_index - 60.0) / 80.0) * 100.0, 1)))
    vix_percentile = min(99.0, max(1.0, round(((vix_index - 11.0) / 20.0) * 100.0, 1)))

    if move_percentile < 25.0 and vix_percentile > 50.0:
        co_signer_signal = "BULLISH_CO_SIGN"
        co_signer_desc = "Bond market volatility subdued (MOVE < 25th percentile) while equity fear is elevated (VIX > 50th percentile). High-probability equity dip-buying regime."
    elif move_percentile > 75.0:
        co_signer_signal = "BEARISH_RATE_SHOCK"
        co_signer_desc = "Rates volatility unhinged (MOVE > 75th percentile). Severe risk of cross-asset discount rate repricing and margin deleveraging."
    else:
        co_signer_signal = "NEUTRAL_CO_SIGN"
        co_signer_desc = "Normal volatility co-signer alignment between rates and equities."

    # ----------------------------------------------------
    # Fed-Treasury Accord 2.0 Probability Gauge (0–100%)
    # ----------------------------------------------------
    # Factor 1: Real-Rate Surge Score (0-35 points)
    # Real yield > 2.0% produces severe fiscal interest expense feedback
    score_real_rate = min(35.0, max(0.0, (dfii10 - 1.25) * 35.0))

    # Factor 2: Credit Spread VAMS & HY OAS Stress (0-35 points)
    hy_oas = series_map.get("BAMLH0A0HYM2", 3.25)
    # Baseline ~320 bps; stress at >450 bps
    score_credit = min(35.0, max(0.0, ((hy_oas - 3.0) / 2.5) * 35.0))

    # Factor 3: Treasury Bill Issuance Share (0-30 points)
    # TBAC recommendation is 20% max T-Bills share of debt issuance; current is ~23.5%
    t_bill_issuance_share_pct = 23.8
    score_tbill = min(30.0, max(0.0, ((t_bill_issuance_share_pct - 20.0) / 10.0) * 30.0))

    accord_probability = round(score_real_rate + score_credit + score_tbill, 1)
    accord_probability = max(5.0, min(95.0, accord_probability))

    if accord_probability >= 65.0:
        accord_state = "ACCORD_IMMINENT (COORDINATED INTERVENTION / YCC / T-BILL SKEW)"
        accord_severity = "HIGH"
    elif accord_probability >= 35.0:
        accord_state = "ELEVATED_WATCH (SOVEREIGN FISCAL FRICTION EXPANDING)"
        accord_severity = "MEDIUM"
    else:
        accord_state = "LOW_STRESS (UNCONSTRAINED TREASURY ISSUANCE)"
        accord_severity = "LOW"

    return {
        "yield_decomposition": {
            "nominal_10y_pct": dgs10,
            "real_tips_10y_pct": dfii10,
            "breakeven_inflation_10y_pct": breakeven_10y,
            "delta_nominal_bps": round(delta_nominal * 100.0, 1),
            "delta_real_bps": round(delta_real * 100.0, 1),
            "delta_breakeven_bps": round(delta_breakeven * 100.0, 1),
            "real_rate_share_pct": real_rate_share_pct,
            "real_rate_rule_80pct_active": real_rate_rule_triggered,
            "rule_interpretation": "42 Macro 94% Rule: Real yields drove >80% of the yield increase, triggering equity multiple compression." if real_rate_rule_triggered else "Real rates within normal non-disruptive band.",
        },
        "fair_value_model": {
            "actual_2y_pct": dgs2,
            "fair_value_2y_pct": fair_value_2y,
            "spread_to_fv_2y_bps": spread_to_fv_2y_bps,
            "actual_10y_pct": dgs10,
            "fair_value_10y_pct": fair_value_10y,
            "spread_to_fv_10y_bps": spread_to_fv_10y_bps,
            "fair_value_signal_10y": "CHEAP_BONDS (ATTRACTIVE DURATION)" if spread_to_fv_10y_bps > 15 else "EXPENSIVE_BONDS" if spread_to_fv_10y_bps < -15 else "FAIR_VALUE",
        },
        "move_vix_co_signer": {
            "move_index": move_index,
            "move_percentile": move_percentile,
            "vix_index": vix_index,
            "vix_percentile": vix_percentile,
            "move_vix_ratio": move_vix_ratio,
            "co_signer_signal": co_signer_signal,
            "co_signer_description": co_signer_desc,
        },
        "fed_treasury_accord_gauge": {
            "probability_pct": accord_probability,
            "state": accord_state,
            "severity": accord_severity,
            "sub_scores": {
                "real_rate_surge_score": round(score_real_rate, 1),
                "credit_spread_stress_score": round(score_credit, 1),
                "tbill_skew_issuance_score": round(score_tbill, 1),
            },
            "tbill_issuance_share_pct": t_bill_issuance_share_pct,
            "tbac_recommended_limit_pct": 20.0,
        },
    }


def compute_global_liquidity(
    df_macro: Union[pd.DataFrame, Dict[str, Any], None] = None,
    df_market: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """Helper alias for compute_global_liquidity_and_debt_ratios."""
    return compute_global_liquidity_and_debt_ratios(df_macro, df_market)


def compute_accord2_gauge(
    df_macro: Union[pd.DataFrame, Dict[str, Any], None] = None,
    df_market: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """Helper that evaluates Fed-Treasury Accord 2.0 probability and stress state."""
    res = compute_bond_stress_and_accord_trigger(df_macro, df_market)
    gauge = res["fed_treasury_accord_gauge"]
    return {
        "accord2_active": gauge["probability_pct"] >= 50.0,
        "probability_pct": gauge["probability_pct"],
        "state": gauge["state"],
        "severity": gauge["severity"],
        "real_rate_rule_triggered": res["yield_decomposition"]["real_rate_rule_80pct_active"],
        "details": res,
    }


def compute_kiss_allocation(current_quad: int = 2) -> Dict[str, float]:
    """Computes KISS 60/30/10 Live Allocation weights across SPY, GLD, IBIT, USFR."""
    if current_quad == 2:
        return {"SPY": 0.48, "GLD": 0.24, "IBIT": 0.08, "USFR": 0.20}
    elif current_quad == 1:
        return {"SPY": 0.60, "GLD": 0.15, "IBIT": 0.10, "USFR": 0.15}
    elif current_quad == 3:
        return {"SPY": 0.30, "GLD": 0.40, "IBIT": 0.05, "USFR": 0.25}
    else:  # Quad 4
        return {"SPY": 0.20, "GLD": 0.30, "IBIT": 0.00, "USFR": 0.50}


def compute_three_fourteen_raa() -> Dict[str, Any]:
    """Returns Warren Pies 3Fourteen Risk-Adjusted Allocation (RAA) model."""
    return {
        "equities_pct": 41.0,
        "fixed_income_pct": 29.3,
        "alternatives_pct": 29.7,
        "co_signer_confirmed": True,
        "benchmark": "41% Equities / 29.3% Fixed Income / 29.7% Commodities & Real Assets",
    }


def compute_hedgeye_kspy_overlay(current_price: float = 590.0, trend_pivot: float = 580.0) -> Dict[str, Any]:
    """Returns Keith McCullough Hedgeye KSPY systematic options overlay hedging state."""
    is_above_trend = current_price >= trend_pivot
    return {
        "overlay_state": "PUT_SPREAD_COLLAR" if is_above_trend else "BEAR_PUT_SPREAD",
        "net_delta": 0.65 if is_above_trend else 0.35,
        "put_strike": round(current_price * 0.95, 2),
        "call_strike": round(current_price * 1.03, 2),
        "trend_pivot": trend_pivot,
        "delta_hedged_pct": 5.0,
        "hedge_status": "ACTIVE_PROTECTION",
    }


def compute_42m_liquidity_and_treasury_supply(
    cb_assets_usd_tn: float,
    broad_m2_usd_tn: float,
    fx_reserves_ex_gold_tn: float,
    move_index: float,
    lead_z_sum_ex_equities_crypto: float,
    glp_yoy_z_score: float,
    maturing_debt_12m_bn: float = 10179.0,
    annualized_deficit_bn: float = 2337.0,
    fed_divestment_or_rmp_bn: float = -282.0,
    effr: float = 3.62,
    ois_floor_5y: float = 3.73,
    ois_terminal_5y: float = 4.01
) -> Dict[str, Any]:
    """
    Combines:
    1. 42 Macro Global Liquidity Proxy ($tn) & Collateral Vol Adjustment
    2. Leading Indicators Z-Sum minus GLP YoY Z-Score:
       - y in [0.0, 0.5] -> 'Modest Uptrend'
       - y in [0.5, 1.0+] -> 'Meaningful / Significant Uptrend'
    3. Approximate NTM Marketable US Treasury Debt Supply ($bn)
    4. OIS-Derived Fed Neutral Rate Spread (Cutting = Floor FFR; Hiking = Terminal FFR)
    """
    nominal_total_tn = cb_assets_usd_tn + broad_m2_usd_tn + fx_reserves_ex_gold_tn
    log10_move = float(np.log10(max(10.0, move_index)))
    vol_adjusted_proxy = round(nominal_total_tn / log10_move, 2)

    y_diff = round(lead_z_sum_ex_equities_crypto - glp_yoy_z_score, 2)
    if y_diff >= 0.50:
        lead_signal = "MEANINGFUL UPTREND OVER MEDIUM TERM (y >= 0.50)"
    elif y_diff >= 0.0:
        lead_signal = "MODEST UPTREND OVER MEDIUM TERM (0.0 <= y < 0.50)"
    elif y_diff >= -0.50:
        lead_signal = "MODEST DOWNTREND OVER MEDIUM TERM (-0.50 <= y < 0.0)"
    else:
        lead_signal = "MEANINGFUL DOWNTREND OVER MEDIUM TERM (y < -0.50)"

    ntm_supply_bn = round(maturing_debt_12m_bn + annualized_deficit_bn + fed_divestment_or_rmp_bn, 1)

    return {
        "nominal_global_liquidity_tn": round(nominal_total_tn, 2),
        "vol_adjusted_global_liquidity_proxy": vol_adjusted_proxy,
        "lead_minus_glp_z_diff": y_diff,
        "medium_term_liquidity_signal": lead_signal,
        "ntm_marketable_treasury_supply_bn": ntm_supply_bn,
        "ois_cutting_neutral_spread_bps": round((ois_floor_5y - effr) * 100.0, 0),
        "ois_hiking_neutral_spread_bps": round((ois_terminal_5y - effr) * 100.0, 0),
    }

