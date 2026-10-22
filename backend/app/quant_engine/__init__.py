"""MacroPulse Alpha Quantitative Engine Package"""

from app.quant_engine.macro_nowcast import (
    compute_growth_nowcast,
    compute_inflation_nowcast,
    compute_quads_and_base_effects,
    compute_prometheus_1965_similarity,
)
from app.quant_engine.liquidity_engine import (
    compute_us_net_liquidity,
    compute_global_liquidity_and_debt_ratios,
    compute_bond_stress_and_accord_trigger,
)
from app.quant_engine.signals import (
    compute_vams,
    compute_hedgeye_risk_ranges,
    compute_42_market_grid_regime,
    compute_kiss_and_dr_mo_portfolios,
    compute_pod_123_and_fcte_quality_screen,
)
from app.quant_engine.options_outliers import (
    analyze_options_chain,
    compute_crowding_and_dispersion,
    scan_1_to_3_month_outliers,
)

__all__ = [
    "compute_growth_nowcast",
    "compute_inflation_nowcast",
    "compute_quads_and_base_effects",
    "compute_prometheus_1965_similarity",
    "compute_us_net_liquidity",
    "compute_global_liquidity_and_debt_ratios",
    "compute_bond_stress_and_accord_trigger",
    "compute_vams",
    "compute_hedgeye_risk_ranges",
    "compute_42_market_grid_regime",
    "compute_kiss_and_dr_mo_portfolios",
    "compute_pod_123_and_fcte_quality_screen",
    "analyze_options_chain",
    "compute_crowding_and_dispersion",
    "scan_1_to_3_month_outliers",
]

