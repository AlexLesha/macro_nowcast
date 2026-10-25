"""MacroPulse Alpha Quantitative Engine Package"""

from app.quant_engine.macro_nowcast import (
    compute_growth_nowcast,
    compute_inflation_nowcast,
    compute_quads_and_base_effects,
    compute_prometheus_1965_similarity,
    compute_ism_recession_probability,
    compute_2015_2019_baseline_zscore,
    classify_4tier_macro_impulse,
)
from app.quant_engine.liquidity_engine import (
    compute_us_net_liquidity,
    compute_global_liquidity_and_debt_ratios,
    compute_bond_stress_and_accord_trigger,
    compute_42m_liquidity_and_treasury_supply,
)
from app.quant_engine.signals import (
    compute_vams,
    compute_hedgeye_risk_ranges,
    compute_42_market_grid_regime,
    compute_kiss_and_dr_mo_portfolios,
    compute_pod_123_and_fcte_quality_screen,
    compute_dr_mo_proper_trade,
    compute_dr_mo_2026_proper_trade,
    compute_kiss_2026_portfolio,
    compute_empirical_quad_alignment_score,
)
from app.quant_engine.options_outliers import (
    analyze_options_chain,
    compute_crowding_and_dispersion,
    scan_1_to_3_month_outliers,
    compute_gen2_crowding_and_vams_dd_modifier,
    compute_pivot_vs_continuation_scores,
    get_multi_horizon_actionable_ideas,
)
from app.quant_engine.hedgeye_quad_matrix import (
    HEDGEYE_EMPIRICAL_BACKTEST,
    HEDGEYE_PORTFOLIO_MODELS,
)
from app.quant_engine.forty_two_macro_engine import (
    FortyTwoMacroEngine,
    GLOBAL_MACRO_RISK_MATRIX_42,
    DR_MO_56_UNIVERSE,
)
try:
    from app.quant_engine.commodities_engine import CommoditiesAndAlternativesEngine
except ImportError:
    from backend.app.quant_engine.commodities_engine import CommoditiesAndAlternativesEngine

__all__ = [
    "compute_growth_nowcast",
    "compute_inflation_nowcast",
    "compute_quads_and_base_effects",
    "compute_prometheus_1965_similarity",
    "compute_ism_recession_probability",
    "compute_2015_2019_baseline_zscore",
    "classify_4tier_macro_impulse",
    "compute_us_net_liquidity",
    "compute_global_liquidity_and_debt_ratios",
    "compute_bond_stress_and_accord_trigger",
    "compute_42m_liquidity_and_treasury_supply",
    "compute_vams",
    "compute_hedgeye_risk_ranges",
    "compute_42_market_grid_regime",
    "compute_kiss_and_dr_mo_portfolios",
    "compute_pod_123_and_fcte_quality_screen",
    "compute_dr_mo_proper_trade",
    "compute_dr_mo_2026_proper_trade",
    "compute_kiss_2026_portfolio",
    "compute_empirical_quad_alignment_score",
    "analyze_options_chain",
    "compute_crowding_and_dispersion",
    "scan_1_to_3_month_outliers",
    "compute_gen2_crowding_and_vams_dd_modifier",
    "HEDGEYE_EMPIRICAL_BACKTEST",
    "HEDGEYE_PORTFOLIO_MODELS",
    "FortyTwoMacroEngine",
    "GLOBAL_MACRO_RISK_MATRIX_42",
    "DR_MO_56_UNIVERSE",
    "CommoditiesAndAlternativesEngine",
    "compute_pivot_vs_continuation_scores",
    "get_multi_horizon_actionable_ideas",
]
