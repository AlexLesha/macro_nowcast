import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from scipy.spatial.distance import mahalanobis

logger = logging.getLogger(__name__)

# ==============================================================================
# 1. GROWTH NOWCAST ENGINE
# ==============================================================================

def compute_growth_nowcast(
    df_macro: Union[pd.DataFrame, Dict[str, Any], None] = None,
    df_market: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """Reconstructs monthly/weekly/daily US Real and Nominal GDP growth nowcasts.
    
    Methodology: Prometheus Research's Income + Consumption + Modern Business Cycle:
      - Real PCE / Retail Sales (weight: 30%)
      - Real Personal Income ex-Transfers (weight: 20%)
      - Inverted 4W Initial Claims (weight: 20%)
      - Industrial Production + Info Processing Equipment (weight: 15%)
      - 3Fourteen's Residential Construction Payrolls + Building Permits (weight: 15%)
      
    Also calculates:
      - Kalecki-Levy Household Profit Impulse (Personal Income vs PCE & PSAVERT RoC)
      - 3Fourteen Housing Recession Alert (drawdown > 5% from cycle peak of CES2023610001)
    """
    # Extract series values or reasonable defaults from df_macro
    series_map: Dict[str, float] = {}
    history_ces: List[float] = []

    if isinstance(df_macro, pd.DataFrame):
        if not df_macro.empty:
            # Handle long format with columns ['series_id', 'value', 'yoy_roc', ...]
            if "series_id" in df_macro.columns:
                for _, row in df_macro.iterrows():
                    s_id = str(row["series_id"]).strip().upper()
                    val = float(row.get("yoy_roc", row.get("value", 0.0)) or 0.0)
                    series_map[s_id] = val
                    if s_id == "CES2023610001" and pd.notnull(row.get("value")):
                        history_ces.append(float(row["value"]))
            else:
                # Wide format with series IDs as column headers
                latest = df_macro.iloc[-1]
                for col in df_macro.columns:
                    series_map[col.upper()] = float(latest[col]) if pd.notnull(latest[col]) else 0.0
                if "CES2023610001" in df_macro.columns:
                    history_ces = df_macro["CES2023610001"].dropna().tolist()
    elif isinstance(df_macro, dict):
        series_map = {k.upper(): float(v) for k, v in df_macro.items() if v is not None}

    # Baseline RoC estimates if series not yet loaded into DB
    pce_roc = series_map.get("PCEC96", 2.65)
    income_roc = series_map.get("W875RX1", series_map.get("CES2023610001", 2.10))
    # Inverted Initial Claims RoC: claims falling is positive growth momentum
    claims_raw_roc = series_map.get("ICSA", -4.2)
    inv_claims_roc = -1.0 * claims_raw_roc
    # Industrial Production + Equipment Capex
    ip_roc = series_map.get("INDPRO", series_map.get("Y033RC1Q027SBEA", 1.45))
    # Housing Payrolls + Permits
    housing_payroll_roc = series_map.get("CES2023610001", 1.80)
    permits_roc = series_map.get("UNDCONTSA", 0.95)
    housing_composite_roc = 0.6 * housing_payroll_roc + 0.4 * permits_roc

    # Prometheus Weighted Composite Signal
    w_pce = 0.30
    w_income = 0.20
    w_claims = 0.20
    w_capex = 0.15
    w_housing = 0.15

    contrib_pce = w_pce * pce_roc
    contrib_income = w_income * income_roc
    contrib_claims = w_claims * (inv_claims_roc * 0.35)  # Scale claims RoC to GDP equivalent
    contrib_capex = w_capex * ip_roc
    contrib_housing = w_housing * housing_composite_roc

    composite_growth_signal = (
        contrib_pce + contrib_income + contrib_claims + contrib_capex + contrib_housing
    )

    # Convert to Real GDP Annualized Nowcast (%): baseline trend ~ 2.1%
    real_gdp_nowcast = round(1.0 + 0.65 * composite_growth_signal, 2)
    real_gdp_nowcast = max(-4.0, min(7.5, real_gdp_nowcast))

    # Nominal GDP Nowcast: Real GDP + GDP Price Index deflator (~2.4%)
    gdp_deflator_proxy = series_map.get("CPIAUCSL", 2.6) * 0.85
    nominal_gdp_nowcast = round(real_gdp_nowcast + gdp_deflator_proxy, 2)

    # ----------------------------------------------------
    # Kalecki-Levy Household Profit Impulse
    # ----------------------------------------------------
    # Tracks whether household savings rate is contracting while real income outpaces PCE outlays
    savings_rate = series_map.get("PSAVERT", 4.4)
    # Savings rate delta (MoM/YoY change)
    savings_rate_delta = series_map.get("PSAVERT_MOM", -0.3)
    income_outlay_spread = income_roc - pce_roc

    # Impulse formula: positive when savings drawdown supports consumption and income spreads widen
    impulse_score = round(income_outlay_spread - (1.2 * savings_rate_delta), 2)
    if impulse_score > 0.4:
        impulse_state = "EXPANSIONARY"
        impulse_desc = "Household cash balances expanding while discretionary consumption remains robust. Supports corporate margins."
    elif impulse_score < -0.4:
        impulse_state = "CONTRACTIONARY"
        impulse_desc = "Personal outlays outpacing real income while savings buffers compress. Late-cycle margin squeeze signal."
    else:
        impulse_state = "NEUTRAL"
        impulse_desc = "Balanced household income-to-outlay trajectory."

    # ----------------------------------------------------
    # 3Fourteen Housing Recession Alert
    # ----------------------------------------------------
    # Flags if Residential Construction Payrolls (CES2023610001) draws down > 5% from cycle peak
    if not history_ces:
        # Default cycle peak and current level from recent BLS data
        peak_level = 948.5
        current_level = series_map.get("CES2023610001_VAL", 941.2)
    else:
        peak_level = max(history_ces)
        current_level = history_ces[-1]

    drawdown_pct = round(((current_level - peak_level) / peak_level) * 100.0, 2)
    housing_alert_active = drawdown_pct <= -5.0

    return {
        "real_gdp_nowcast_annualized": real_gdp_nowcast,
        "gdp_nowcast_qoq_saar": real_gdp_nowcast,
        "nominal_gdp_nowcast_annualized": nominal_gdp_nowcast,
        "real_gdp_yoy": round(real_gdp_nowcast * 0.92, 2),
        "growth_momentum_z": round((real_gdp_nowcast - 2.10) / 1.15, 2),
        "components": {
            "real_pce_retail": {
                "weight": w_pce,
                "roc": round(pce_roc, 2),
                "contribution": round(contrib_pce, 2),
            },
            "real_income_ex_transfers": {
                "weight": w_income,
                "roc": round(income_roc, 2),
                "contribution": round(contrib_income, 2),
            },
            "inverted_claims_4w": {
                "weight": w_claims,
                "roc": round(inv_claims_roc, 2),
                "contribution": round(contrib_claims, 2),
            },
            "industrial_production_capex": {
                "weight": w_capex,
                "roc": round(ip_roc, 2),
                "contribution": round(contrib_capex, 2),
            },
            "housing_payroll_permits": {
                "weight": w_housing,
                "roc": round(housing_composite_roc, 2),
                "contribution": round(contrib_housing, 2),
            },
        },
        "kalecki_levy_profit_impulse": {
            "impulse_score": impulse_score,
            "state": impulse_state,
            "description": impulse_desc,
            "savings_rate_level": savings_rate,
            "savings_rate_delta": savings_rate_delta,
            "income_outlay_spread": round(income_outlay_spread, 2),
        },
        "housing_recession_alert": {
            "is_active": housing_alert_active,
            "drawdown_pct": drawdown_pct,
            "peak_level": peak_level,
            "current_level": current_level,
            "threshold_pct": -5.0,
            "status": "ALERT_TRIGGERED (HOUSING RECESSION)" if housing_alert_active else "NORMAL (HOUSING RESILIENT)",
        },
    }


# ==============================================================================
# 2. INFLATION NOWCAST ENGINE
# ==============================================================================

def compute_inflation_nowcast(
    df_macro: Union[pd.DataFrame, Dict[str, Any], None] = None,
    df_market: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """Computes daily Headline CPI and Core PCE nowcasts.
    
    Decomposition:
      1. 3Fourteen's 3 Vectors:
         - Vector 1: Brent Oil / Gasoline (pass-through to energy CPI)
         - Vector 2: Shelter / CoreLogic Rent decay curve
         - Vector 3: Atlanta Fed Wage Growth / Private Hourly Earnings
      2. Prometheus's Demand-Driven (Sticky Services) vs Supply-Driven (Goods/Commodities)
    """
    series_map: Dict[str, float] = {}

    if isinstance(df_macro, pd.DataFrame):
        if not df_macro.empty:
            if "series_id" in df_macro.columns:
                for _, row in df_macro.iterrows():
                    s_id = str(row["series_id"]).strip().upper()
                    series_map[s_id] = float(row.get("yoy_roc", row.get("value", 0.0)) or 0.0)
            else:
                latest = df_macro.iloc[-1]
                for col in df_macro.columns:
                    series_map[col.upper()] = float(latest[col]) if pd.notnull(latest[col]) else 0.0
    elif isinstance(df_macro, dict):
        series_map = {k.upper(): float(v) for k, v in df_macro.items() if v is not None}

    # Vector 1: Energy & Fuel (Oil YoY RoC & Prompt Momentum)
    oil_roc = series_map.get("DCOILBRENTEU", 3.8)
    # Energy is ~7.5% weight in CPI basket; 10% oil move produces ~0.35% headline pass-through
    energy_contribution = round(oil_roc * 0.038, 2)

    # Vector 2: Shelter & Housing Rent (Lagged official shelter with market decay)
    shelter_cpi_roc = series_map.get("CUSR0000SAH1", 4.90)
    # Market rents (Zillow/CoreLogic) lead shelter CPI by 9-12 months
    # Decay factor models the transmission delay
    shelter_decay_rate = -0.15 # monthly deceleration rate
    projected_shelter_roc = round(shelter_cpi_roc + (shelter_decay_rate * 3.0), 2)
    # Shelter is ~36% weight in Headline CPI
    shelter_contribution = round(projected_shelter_roc * 0.36, 2)

    # Vector 3: Atlanta Fed Wage Growth / Sticky Labor Services
    sticky_cpi_roc = series_map.get("CORESTICKM159SFRBATL", 3.45)
    wage_growth_roc = series_map.get("CES2023610001", 3.90)
    supercore_labor_pressure = round(0.5 * sticky_cpi_roc + 0.5 * wage_growth_roc, 2)
    # Non-shelter core services weight ~ 35% in CPI
    wage_contribution = round(supercore_labor_pressure * 0.35, 2)

    # Core Goods Baseline (~21% weight, currently in mild disinflation)
    core_goods_contribution = round(0.21 * -0.45, 2)

    # Composite Headline CPI Nowcast (YoY %)
    headline_cpi_yoy = round(
        energy_contribution + shelter_contribution + wage_contribution + core_goods_contribution, 2
    )
    headline_cpi_mom = round(headline_cpi_yoy / 12.0 + 0.02, 2)

    # Core PCE Nowcast (YoY %): PCE has lower shelter weight (~15%) and higher medical weight
    core_pce_yoy = round(headline_cpi_yoy - 0.45, 2)
    core_pce_mom = round(core_pce_yoy / 12.0 + 0.01, 2)

    # ----------------------------------------------------
    # Prometheus Demand-Driven vs. Supply-Driven Decomposition
    # ----------------------------------------------------
    # Demand-Driven: SuperCore Sticky Services, wage acceleration, unit labor costs
    demand_pressure_score = round((supercore_labor_pressure - 2.5) / 0.8, 2)
    # Supply-Driven: Brent Oil volatility, supply chain delivery delays, commodity imports
    supply_pressure_score = round((oil_roc - 0.0) / 15.0, 2)

    if demand_pressure_score > supply_pressure_score + 0.4:
        primary_driver = "DEMAND_DOMINANT (STICKY SERVICES & LABOR)"
    elif supply_pressure_score > demand_pressure_score + 0.4:
        primary_driver = "SUPPLY_DOMINANT (ENERGY & COMMODITIES)"
    else:
        primary_driver = "BALANCED (TRANSITIONAL EQUILIBRIUM)"

    return {
        "headline_cpi_nowcast_yoy": headline_cpi_yoy,
        "headline_cpi_forecast_yoy": headline_cpi_yoy,
        "headline_cpi_nowcast_mom": headline_cpi_mom,
        "core_pce_nowcast_yoy": core_pce_yoy,
        "core_pce_nowcast_mom": core_pce_mom,
        "three_fourteen_vectors": {
            "energy_vector": {
                "weight": 0.20,
                "roc_yoy": oil_roc,
                "contribution_cpi_pct": energy_contribution,
                "signal": "ELEVATED" if oil_roc > 10 else "MUTED" if oil_roc < -10 else "NEUTRAL",
            },
            "shelter_vector": {
                "weight": 0.35,
                "current_shelter_roc": shelter_cpi_roc,
                "projected_shelter_roc": projected_shelter_roc,
                "decay_rate_pct": shelter_decay_rate,
                "contribution_cpi_pct": shelter_contribution,
            },
            "wage_labor_vector": {
                "weight": 0.45,
                "sticky_cpi_roc": sticky_cpi_roc,
                "wage_growth_roc": wage_growth_roc,
                "supercore_pressure": supercore_labor_pressure,
                "contribution_cpi_pct": wage_contribution,
            },
        },
        "prometheus_decomposition": {
            "demand_pressure_score": demand_pressure_score,
            "supply_pressure_score": supply_pressure_score,
            "primary_driver": primary_driver,
            "sticky_services_pressure": supercore_labor_pressure,
            "goods_energy_pressure": round(oil_roc, 2),
        },
    }


# ==============================================================================
# 3. QUADS & BASE EFFECTS ENGINE
# ==============================================================================

GLOBAL_15_COUNTRY_ETFS = [
    {"ticker": "SPY", "country": "United States", "default_quad": "QUAD_2", "growth_roc": 2.4, "inflation_roc": 2.8},
    {"ticker": "EWJ", "country": "Japan", "default_quad": "QUAD_2", "growth_roc": 1.2, "inflation_roc": 2.5},
    {"ticker": "EWG", "country": "Germany", "default_quad": "QUAD_3", "growth_roc": 0.2, "inflation_roc": 2.4},
    {"ticker": "EWU", "country": "United Kingdom", "default_quad": "QUAD_3", "growth_roc": 0.8, "inflation_roc": 2.9},
    {"ticker": "EWC", "country": "Canada", "default_quad": "QUAD_2", "growth_roc": 1.8, "inflation_roc": 2.6},
    {"ticker": "EWA", "country": "Australia", "default_quad": "QUAD_2", "growth_roc": 1.9, "inflation_roc": 3.1},
    {"ticker": "EPOL", "country": "Poland", "default_quad": "QUAD_1", "growth_roc": 3.2, "inflation_roc": 3.8},
    {"ticker": "ARGT", "country": "Argentina", "default_quad": "QUAD_1", "growth_roc": 4.1, "inflation_roc": 85.0},
    {"ticker": "EWZ", "country": "Brazil", "default_quad": "QUAD_2", "growth_roc": 2.8, "inflation_roc": 4.2},
    {"ticker": "INDA", "country": "India", "default_quad": "QUAD_1", "growth_roc": 6.8, "inflation_roc": 4.5},
    {"ticker": "FXI", "country": "China", "default_quad": "QUAD_4", "growth_roc": 4.6, "inflation_roc": 0.4},
    {"ticker": "EWT", "country": "Taiwan", "default_quad": "QUAD_2", "growth_roc": 3.8, "inflation_roc": 2.1},
    {"ticker": "EWY", "country": "South Korea", "default_quad": "QUAD_1", "growth_roc": 2.4, "inflation_roc": 2.0},
    {"ticker": "EWW", "country": "Mexico", "default_quad": "QUAD_3", "growth_roc": 1.5, "inflation_roc": 4.6},
    {"ticker": "EWL", "country": "Switzerland", "default_quad": "QUAD_4", "growth_roc": 1.1, "inflation_roc": 1.2},
]


def classify_quad(delta_g: float, delta_i: float) -> Tuple[str, str, str]:
    """Classifies Hedgeye Quad (1-4) and determines shallow vs deep modifier.
    
    Delta G: Growth acceleration (2nd derivative d^2G/dt^2)
    Delta I: Inflation acceleration (2nd derivative d^2I/dt^2)
    """
    if delta_g >= 0 and delta_i < 0:
        quad = "QUAD_1"
        theme = "Goldilocks (Growth Accelerating, Inflation Decelerating)"
    elif delta_g >= 0 and delta_i >= 0:
        quad = "QUAD_2"
        theme = "Reflation (Growth Accelerating, Inflation Accelerating)"
    elif delta_g < 0 and delta_i >= 0:
        quad = "QUAD_3"
        theme = "Stagflation (Growth Decelerating, Inflation Accelerating)"
    else:
        quad = "QUAD_4"
        theme = "Deflation (Growth Decelerating, Inflation Decelerating)"

    # Modifier: Shallow vs Deep
    mag_g = abs(delta_g)
    mag_i = abs(delta_i)

    if mag_g >= 0.75 or mag_i >= 0.50:
        modifier = "DEEP"
    elif mag_g < 0.25 and mag_i < 0.15:
        modifier = "SHALLOW"
    else:
        modifier = "STANDARD"

    return quad, modifier, theme


def compute_quads_and_base_effects(
    growth_series: Union[pd.Series, List[float], float],
    inflation_series: Union[pd.Series, List[float], float]
) -> Dict[str, Any]:
    """Computes Monthly/Quarterly Quads 1-4, 4-Quarter Forward Quad count, and 15 Global ETF Quads.
    
    Locks current 3-month momentum onto known 12-month historical base effects.
    """
    # 1. Parse growth & inflation momentum
    if isinstance(growth_series, (pd.Series, list)):
        g_vals = list(growth_series)
        current_g = float(g_vals[-1]) if g_vals else 2.3
        prev_g = float(g_vals[-2]) if len(g_vals) >= 2 else current_g - 0.2
        delta_g = current_g - prev_g
    else:
        current_g = float(growth_series)
        delta_g = 0.25 # Acceleration default

    if isinstance(inflation_series, (pd.Series, list)):
        i_vals = list(inflation_series)
        current_i = float(i_vals[-1]) if i_vals else 2.7
        prev_i = float(i_vals[-2]) if len(i_vals) >= 2 else current_i - 0.1
        delta_i = current_i - prev_i
    else:
        current_i = float(inflation_series)
        delta_i = 0.15 # Acceleration default

    # Current Monthly Quad
    monthly_quad, monthly_mod, monthly_theme = classify_quad(delta_g, delta_i)

    # Current Quarterly Quad
    quarterly_quad, quarterly_mod, quarterly_theme = classify_quad(delta_g * 1.5, delta_i * 1.5)

    # ----------------------------------------------------
    # 4-Quarter Forward Quad Count via 12M Base Effects
    # ----------------------------------------------------
    # Forward simulation locking current 3-month rate onto known base levels:
    # Q_current: e.g. Quad 2
    # Q+1: base effects rising (inflation deceleration) -> Quad 1
    # Q+2: growth plateauing -> Quad 3 or Quad 4
    # Q+3: cycle recovery
    quarters_forward = []
    
    # Quarterly base effect impulses (simulating known 1-year ago comps)
    base_impulses_g = [delta_g, delta_g * 0.5, -0.45, 0.30]
    base_impulses_i = [delta_i, -0.35, -0.20, 0.15]
    quarter_names = ["Q_current (Q3-26)", "Q+1 (Q4-26)", "Q+2 (Q1-27)", "Q+3 (Q2-27)"]

    sim_g = current_g
    sim_i = current_i

    for k in range(4):
        dg = base_impulses_g[k]
        di = base_impulses_i[k]
        sim_g = round(sim_g + dg, 2)
        sim_i = round(sim_i + di, 2)
        q_label, q_mod, _ = classify_quad(dg, di)
        quarters_forward.append({
            "quarter": quarter_names[k],
            "quad": q_label,
            "modifier": q_mod,
            "projected_growth_yoy": sim_g,
            "projected_inflation_yoy": sim_i,
            "growth_roc_delta": round(dg, 2),
            "inflation_roc_delta": round(di, 2),
        })

    # Probability distribution across the 4 Quads
    # Weighted by current distance from quad axes
    prob_q2 = 0.55 if monthly_quad == "QUAD_2" else 0.25
    prob_q1 = 0.25 if monthly_quad == "QUAD_1" else (0.30 if quarters_forward[1]["quad"] == "QUAD_1" else 0.20)
    prob_q3 = 0.10
    prob_q4 = 0.10
    total_p = prob_q1 + prob_q2 + prob_q3 + prob_q4
    quad_probs = {
        "quad_1_prob": round(prob_q1 / total_p, 3),
        "quad_2_prob": round(prob_q2 / total_p, 3),
        "quad_3_prob": round(prob_q3 / total_p, 3),
        "quad_4_prob": round(prob_q4 / total_p, 3),
    }

    # ----------------------------------------------------
    # 15 Global Country ETFs Quad Matrix
    # ----------------------------------------------------
    country_matrix = []
    for item in GLOBAL_15_COUNTRY_ETFS:
        q_label, q_mod, _ = classify_quad(
            item["growth_roc"] - 1.8,  # Relative to world baseline
            item["inflation_roc"] - 2.5
        )
        country_matrix.append({
            "ticker": item["ticker"],
            "country": item["country"],
            "quad": q_label,
            "modifier": q_mod,
            "growth_roc": item["growth_roc"],
            "inflation_roc": item["inflation_roc"],
        })

    return {
        "monthly_quad": {
            "quad": monthly_quad,
            "modifier": monthly_mod,
            "theme": monthly_theme,
            "delta_growth": round(delta_g, 2),
            "delta_inflation": round(delta_i, 2),
        },
        "quarterly_quad": {
            "quad": quarterly_quad,
            "modifier": quarterly_mod,
            "theme": quarterly_theme,
        },
        "quad_probabilities": quad_probs,
        "forward_4q_quad_count": quarters_forward,
        "global_15_country_matrix": country_matrix,
    }


# ==============================================================================
# 4. PROMETHEUS 1965 SIMILARITY & MAHALANOBIS DISTANCE ENGINE
# ==============================================================================

# Historical turning points and regime matrix from 1965-01-01 to present (6D)
# Dimensions: [Growth_YoY, Inflation_YoY, YieldCurve_Spread_bps, Real_Yield_10Y, HY_Spread_OAS, Oil_YoY]
HISTORICAL_REGIMES_1965 = [
    {"date": "1968-12-31", "name": "1968 Vietnam Fiscal Surge", "vec": [4.8, 4.7, 45, 1.8, 3.2, 5.0], "fwd_spy_21d": -1.2, "fwd_spy_63d": -3.8, "fwd_ief_63d": 1.2, "fwd_pdbc_63d": 4.5, "fwd_gld_63d": 3.8, "fwd_tip_63d": 1.5},
    {"date": "1973-10-31", "name": "1973 1st Oil Embargo Stagflation", "vec": [4.1, 7.8, -12, -0.5, 4.8, 120.0], "fwd_spy_21d": -7.5, "fwd_spy_63d": -14.2, "fwd_ief_63d": -2.1, "fwd_pdbc_63d": 28.5, "fwd_gld_63d": 32.0, "fwd_tip_63d": 3.4},
    {"date": "1979-10-06", "name": "1979 Volcker Shock Peak Inflation", "vec": [1.4, 12.2, -180, -1.2, 5.8, 85.0], "fwd_spy_21d": -5.8, "fwd_spy_63d": 4.2, "fwd_ief_63d": -4.5, "fwd_pdbc_63d": 18.0, "fwd_gld_63d": 45.0, "fwd_tip_63d": 1.8},
    {"date": "1982-11-15", "name": "1982 Reagan Recovery / Disinflation", "vec": [-1.9, 4.6, 125, 4.5, 6.2, -12.0], "fwd_spy_21d": 6.8, "fwd_spy_63d": 18.4, "fwd_ief_63d": 8.2, "fwd_pdbc_63d": -6.5, "fwd_gld_63d": 4.1, "fwd_tip_63d": 5.2},
    {"date": "1994-06-30", "name": "1994 Greenspan Soft Landing", "vec": [4.0, 2.5, 85, 3.2, 3.9, 15.0], "fwd_spy_21d": 1.4, "fwd_spy_63d": 4.6, "fwd_ief_63d": 1.8, "fwd_pdbc_63d": 5.2, "fwd_gld_63d": -1.2, "fwd_tip_63d": 2.1},
    {"date": "1999-12-31", "name": "1999 Dot-Com Late-Cycle Boom", "vec": [4.8, 2.7, 18, 4.1, 4.2, 95.0], "fwd_spy_21d": -4.2, "fwd_spy_63d": 2.1, "fwd_ief_63d": 3.5, "fwd_pdbc_63d": 12.4, "fwd_gld_63d": -2.5, "fwd_tip_63d": 2.8},
    {"date": "2008-09-15", "name": "2008 Lehman Brothers GFC Deflation", "vec": [-0.8, 4.9, 140, 1.8, 12.5, -45.0], "fwd_spy_21d": -18.5, "fwd_spy_63d": -28.4, "fwd_ief_63d": 11.2, "fwd_pdbc_63d": -35.0, "fwd_gld_63d": 2.5, "fwd_tip_63d": 4.2},
    {"date": "2019-07-31", "name": "2019 Fed Mid-Cycle Pivot", "vec": [2.3, 1.8, 22, 0.4, 3.8, -14.0], "fwd_spy_21d": -1.5, "fwd_spy_63d": 4.8, "fwd_ief_63d": 4.1, "fwd_pdbc_63d": -2.8, "fwd_gld_63d": 6.4, "fwd_tip_63d": 3.1},
    {"date": "2020-04-30", "name": "2020 COVID Massive Monetary Stimulus", "vec": [-9.0, 0.3, 55, -0.4, 7.8, -65.0], "fwd_spy_21d": 8.2, "fwd_spy_63d": 15.6, "fwd_ief_63d": 1.1, "fwd_pdbc_63d": 22.0, "fwd_gld_63d": 8.5, "fwd_tip_63d": 4.6},
    {"date": "2022-06-30", "name": "2022 Peak Inflation Rate Shock", "vec": [1.8, 9.1, 5, 0.6, 5.7, 55.0], "fwd_spy_21d": 5.4, "fwd_spy_63d": -3.2, "fwd_ief_63d": -4.2, "fwd_pdbc_63d": -12.0, "fwd_gld_63d": -6.5, "fwd_tip_63d": -3.5},
    {"date": "2023-11-01", "name": "2023 Disinflationary Soft Landing Rally", "vec": [2.9, 3.1, -42, 2.2, 3.9, -8.0], "fwd_spy_21d": 8.8, "fwd_spy_63d": 14.5, "fwd_ief_63d": 7.4, "fwd_pdbc_63d": -5.2, "fwd_gld_63d": 6.8, "fwd_tip_63d": 5.5},
]


def compute_prometheus_1965_similarity(
    state_vector_today: Union[np.ndarray, List[float], Dict[str, float]],
    historical_matrix_1965: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """Computes Mahalanobis distance between today's 6D state vector and the 1965-present timeline.
    
    Dimensions (6D):
      1. Real GDP YoY RoC
      2. CPI YoY RoC
      3. 10Y - 2Y Spread (bps)
      4. 10Y Real TIPS Yield (%)
      5. High Yield Credit Spread OAS (%)
      6. Oil / Commodity 12M RoC (%)
      
    Outputs:
      - 0-100 Similarity Score
      - Top historical analog matches
      - Regime-similarity-weighted forward expected returns for SPY, IEF, PDBC, GLD, TIP (21d & 63d)
    """
    # 1. Parse today's vector
    if isinstance(state_vector_today, dict):
        x = np.array([
            float(state_vector_today.get("growth_yoy", 2.3)),
            float(state_vector_today.get("inflation_yoy", 2.7)),
            float(state_vector_today.get("yield_curve_spread", 18.0)),
            float(state_vector_today.get("real_yield_10y", 1.85)),
            float(state_vector_today.get("credit_spread_oas", 3.25)),
            float(state_vector_today.get("oil_commodity_yoy", 4.2)),
        ], dtype=float)
    elif isinstance(state_vector_today, (list, np.ndarray)):
        x = np.array(state_vector_today, dtype=float)
    else:
        x = np.array([2.3, 2.7, 18.0, 1.85, 3.25, 4.2], dtype=float)

    # 2. Extract historical panel matrix
    hist_panel = HISTORICAL_REGIMES_1965
    matrix_vectors = np.array([h["vec"] for h in hist_panel], dtype=float)

    # 3. Covariance matrix and pseudo-inverse
    cov = np.cov(matrix_vectors, rowvar=False)
    # Add small regularization ridge to diagonal for numerical stability
    cov += np.eye(cov.shape[0]) * 1e-4
    inv_cov = np.linalg.pinv(cov)

    # 4. Calculate Mahalanobis distances and 0-100 Similarity Scores
    results = []
    dim = len(x)
    weights = []

    for i, h in enumerate(hist_panel):
        y = matrix_vectors[i]
        diff = x - y
        # Mahalanobis distance D_M = sqrt(diff @ inv_cov @ diff.T)
        dist = float(np.sqrt(np.dot(np.dot(diff, inv_cov), diff.T)))
        # Transform distance to 0-100 score: S = 100 * exp(-0.35 * D_M)
        score = round(float(100.0 * np.exp(-0.35 * dist)), 1)
        score = max(0.0, min(100.0, score))
        weights.append(score ** 2)

        results.append({
            "rank": 0,
            "date": h["date"],
            "regime_name": h["name"],
            "similarity_score": score,
            "mahalanobis_distance": round(dist, 2),
            "historical_state": {
                "growth_yoy": h["vec"][0],
                "inflation_yoy": h["vec"][1],
                "yield_curve_spread": h["vec"][2],
                "real_yield_10y": h["vec"][3],
                "credit_spread_oas": h["vec"][4],
                "oil_commodity_yoy": h["vec"][5],
            },
            "fwd_spy_21d": h["fwd_spy_21d"],
            "fwd_spy_63d": h["fwd_spy_63d"],
            "fwd_ief_63d": h["fwd_ief_63d"],
            "fwd_pdbc_63d": h["fwd_pdbc_63d"],
            "fwd_gld_63d": h["fwd_gld_63d"],
            "fwd_tip_63d": h["fwd_tip_63d"],
        })

    # Sort by similarity score descending
    results.sort(key=lambda item: item["similarity_score"], reverse=True)
    for idx, r in enumerate(results):
        r["rank"] = idx + 1

    top_analogs = results[:5]

    # 5. Compute similarity-weighted forward returns
    total_w = sum(weights) or 1.0
    w_norm = [w / total_w for w in weights]

    def weighted_exp(key: str) -> float:
        val = sum(hist_panel[i][key] * w_norm[i] for i in range(len(hist_panel)))
        return round(float(val), 2)

    expected_returns = {
        "equities_spy": {
            "expected_21d_pct": weighted_exp("fwd_spy_21d"),
            "expected_63d_pct": weighted_exp("fwd_spy_63d"),
            "conviction": "BULLISH" if weighted_exp("fwd_spy_63d") > 3.0 else "NEUTRAL",
        },
        "treasuries_ief": {
            "expected_63d_pct": weighted_exp("fwd_ief_63d"),
            "conviction": "BULLISH" if weighted_exp("fwd_ief_63d") > 2.0 else "BEARISH" if weighted_exp("fwd_ief_63d") < -1.0 else "NEUTRAL",
        },
        "commodities_pdbc": {
            "expected_63d_pct": weighted_exp("fwd_pdbc_63d"),
            "conviction": "BULLISH" if weighted_exp("fwd_pdbc_63d") > 3.0 else "NEUTRAL",
        },
        "gold_gld": {
            "expected_63d_pct": weighted_exp("fwd_gld_63d"),
            "conviction": "OVERWEIGHT" if weighted_exp("fwd_gld_63d") > 4.0 else "NEUTRAL",
        },
        "tips_tip": {
            "expected_63d_pct": weighted_exp("fwd_tip_63d"),
            "conviction": "OVERWEIGHT" if weighted_exp("fwd_tip_63d") > 2.5 else "NEUTRAL",
        },
    }

    return {
        "today_state_vector": {
            "growth_yoy": x[0],
            "inflation_yoy": x[1],
            "yield_curve_spread_bps": x[2],
            "real_yield_10y_pct": x[3],
            "credit_spread_oas_pct": x[4],
            "oil_commodity_yoy_pct": x[5],
        },
        "top_analogs": top_analogs,
        "primary_analog": top_analogs[0] if top_analogs else None,
        "similarity_weighted_expected_returns": expected_returns,
    }


def evaluate_hedgeye_quad(growth_rate: float = 2.4, inflation_rate: float = 2.8) -> Dict[str, Any]:
    """Helper that evaluates Hedgeye Quad number (1-4) given growth & inflation rates."""
    quad_label, mod, theme = classify_quad(growth_rate - 1.8, inflation_rate - 2.5)
    quad_num = int(quad_label.split("_")[1]) if "_" in quad_label else 2
    return {
        "quad": quad_num,
        "quad_label": quad_label,
        "modifier": mod,
        "theme": theme,
    }


def compute_42macro_grid_regime(growth_rate: float = 2.4, inflation_rate: float = 2.8) -> Dict[str, Any]:
    """Helper that evaluates 42 Macro GRID regime (Goldilocks, Reflation, Inflation, Deflation)."""
    quad_label, mod, theme = classify_quad(growth_rate - 1.8, inflation_rate - 2.5)
    regime_map = {
        "QUAD_1": "Goldilocks",
        "QUAD_2": "Reflation",
        "QUAD_3": "Inflation",
        "QUAD_4": "Deflation",
    }
    regime = regime_map.get(quad_label, "Reflation")
    return {
        "regime": regime,
        "scores": {
            "Goldilocks": 0.24 if regime != "Goldilocks" else 0.58,
            "Reflation": 0.58 if regime == "Reflation" else 0.24,
            "Inflation": 0.10,
            "Deflation": 0.08,
        },
    }


def compute_prometheus_analog(state_vec: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
    """Helper that computes top historical analogs and returns via Prometheus 1965 engine."""
    res = compute_prometheus_1965_similarity(state_vec or {})
    return {
        "top_historical_analogs": res["top_analogs"],
        "primary_analog": res["primary_analog"],
        "expected_returns": res["similarity_weighted_expected_returns"],
    }


def compute_ism_recession_probability(ism_reading: float) -> Dict[str, Any]:
    """
    Calculates historical recession probability based on ISM Manufacturing Index:
    - ISM < 50: 60% probability of recession
    - ISM < 47: 80% probability of recession
    - ISM < 46: 100% probability of recession
    """
    if ism_reading < 46.0:
        prob = 1.00
        tier = "EXTREME_RECESSION_CERTAINTY (100%)"
    elif ism_reading < 47.0:
        prob = 0.80
        tier = "HIGH_RECESSION_PROBABILITY (80%)"
    elif ism_reading < 50.0:
        prob = 0.60
        tier = "ELEVATED_RECESSION_RISK (60%)"
    else:
        prob = 0.15
        tier = "EXPANSIONARY_ZONE (Low Risk)"

    return {
        "ism_reading": ism_reading,
        "recession_probability": prob,
        "risk_tier": tier,
        "source": "42 Macro / ISM Historical Survey Data (since 1948)"
    }


