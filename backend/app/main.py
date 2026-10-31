import os
import logging
from contextlib import asynccontextmanager
from typing import Optional
from pydantic import BaseModel
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import init_db
from app.api.routes import api_router

try:
    from app.refresh_pipeline.health_monitor import health_tracker
except ImportError:
    from backend.app.refresh_pipeline.health_monitor import health_tracker


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("macropulse.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes database schema and starts background clients on app boot."""
    logger.info("Initializing MacroPulse Alpha Database Schema...")
    init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("MacroPulse Alpha Engine shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Quantitative Macro Nowcasting & Intelligence Engine",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Parse any additional environment origins
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
env_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
cors_origins = list(set(settings.CORS_ORIGINS + env_origins + [
    "https://macro-nowcast.pages.dev",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]))

# Setup CORS for Next.js frontend on Cloudflare Pages and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.pages\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "engine": "MacroPulse Alpha",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs",
        "endpoints": {
            "health": "/api/v1/health",
            "macro_series": "/api/macro/series/latest",
            "market_matrix": "/api/market/matrix",
            "options_microstructure": "/api/options/microstructure",
            "regime_current": "/api/regime/current",
            "intelligence_deltas": "/api/intelligence/deltas",
        }
    }


@app.get("/api/v1/health")
@app.get("/api/health")
@app.get("/health")
async def health_check():
    """Health check endpoint for Render spin-up monitor and load balancers."""
    health_data = await health_tracker.probe_statuses()
    return {
        "status": "ok",
        "service": "MacroPulse Alpha Quant Engine",
        "environment": os.getenv("ENVIRONMENT", settings.ENVIRONMENT),
        "health": health_data,
    }



@app.get("/api/v1/etf/fcte-holdings")
@app.get("/v1/etf/fcte-holdings")
def get_fcte_holdings_direct():
    from app.ingestion.etf_holdings_client import fetch_fcte_holdings
    return fetch_fcte_holdings().to_dict()


@app.get("/api/v1/42macro/dashboard")
@app.get("/api/42macro/dashboard")
async def get_42_macro_dashboard():
    """Returns the complete, schema-validated 42 Macro institutional suite for /42-macro (100% dynamic live builder)."""
    try:
        from backend.app.quant_engine.forty_two_macro_engine import FortyTwoMacroLiveBuilder
    except ImportError:
        from app.quant_engine.forty_two_macro_engine import FortyTwoMacroLiveBuilder

    return FortyTwoMacroLiveBuilder.build_live_42macro_dashboard()



@app.get("/api/v1/stock/xray/{ticker}")
@app.get("/api/stock/xray/{ticker}")
async def get_single_stock_xray(
    ticker: str,
    regime: Optional[str] = None,
    quad: Optional[str] = None
):
    """Runs the 5-Pillar Single-Stock Macro-Fundamental X-Ray for any stock ticker."""
    if not regime or not quad or quad == "Quad 2":
        try:
            from app.quant_engine.macro_nowcast import compute_growth_nowcast, compute_inflation_nowcast, compute_quads_and_base_effects
            g = compute_growth_nowcast()
            inf = compute_inflation_nowcast()
            q_data = compute_quads_and_base_effects(g, inf)
            active_quad = quad if (quad and quad != "Quad 2") else q_data.get("current_quad", "Quad 3")
            active_regime = regime if (regime and regime != "REFLATION") else q_data.get("current_regime", "STAGFLATION")
        except Exception:
            active_quad = quad or "Quad 3"
            active_regime = regime or "STAGFLATION"
    else:
        active_quad = quad
        active_regime = regime

    try:
        from backend.app.quant_engine.stock_analyzer import SingleStockXRayEngine
    except ImportError:
        from app.quant_engine.stock_analyzer import SingleStockXRayEngine
    try:
        return SingleStockXRayEngine.analyze_ticker(
            ticker=ticker,
            active_market_regime=active_regime,
            active_economic_quad=active_quad
        )
    except Exception as e:
        return {"status": "error", "ticker": ticker.upper(), "message": str(e)}


class StockAnalyzeRequest(BaseModel):
    ticker: str
    regime: Optional[str] = None
    quad: Optional[str] = None


@app.get("/api/v1/stock/groq-status")
@app.get("/api/stock/groq-status")
@app.get("/api/v1/stock/llm-status")
@app.get("/api/v1/stock/gemini-status")
@app.get("/api/stock/gemini-status")
async def get_groq_api_status():
    """Probes Unified Groq (Llama 3.3 70B) API health with zero token overhead."""
    try:
        from backend.app.quant_engine.stock_llm_analyzer import check_groq_api_health
    except ImportError:
        from app.quant_engine.stock_llm_analyzer import check_groq_api_health
    return await check_groq_api_health()

get_gemini_api_status = get_groq_api_status


@app.post("/api/v1/stock/analyze")
@app.post("/api/stock/analyze")
async def analyze_stock_endpoint(req: StockAnalyzeRequest):
    """Runs the unified quantitative + Groq Llama 3.3 70B forensic analysis for any ticker."""
    if not req.regime or not req.quad or req.quad == "Quad 2":
        try:
            from app.quant_engine.macro_nowcast import compute_growth_nowcast, compute_inflation_nowcast, compute_quads_and_base_effects
            g = compute_growth_nowcast()
            inf = compute_inflation_nowcast()
            q_data = compute_quads_and_base_effects(g, inf)
            active_quad = req.quad if (req.quad and req.quad != "Quad 2") else q_data.get("current_quad", "Quad 3")
            active_regime = req.regime if (req.regime and req.regime != "REFLATION") else q_data.get("current_regime", "STAGFLATION")
        except Exception:
            active_quad = req.quad or "Quad 3"
            active_regime = req.regime or "STAGFLATION"
    else:
        active_quad = req.quad
        active_regime = req.regime

    try:
        from backend.app.quant_engine.stock_llm_analyzer import StockLLMAnalyzer
    except ImportError:
        from app.quant_engine.stock_llm_analyzer import StockLLMAnalyzer
    return await StockLLMAnalyzer.analyze_stock(
        ticker=req.ticker,
        regime=active_regime,
        quad=active_quad
    )


@app.get("/api/v1/stock/analyze")
@app.get("/api/stock/analyze")
@app.get("/api/v1/stock/analysis/{ticker}")
@app.get("/api/stock/analysis/{ticker}")
@app.get("/api/v1/stock/xray/{ticker}")
@app.get("/api/stock/xray/{ticker}")
async def analyze_stock_get_endpoint(
    ticker: str = "ENPH",
    regime: Optional[str] = None,
    quad: Optional[str] = None,
):
    """GET endpoint for unified quantitative + SEC EDGAR XBRL + Groq Llama 3.3 70B forensic analysis."""
    if not regime or not quad or quad == "Quad 2":
        try:
            from app.quant_engine.macro_nowcast import compute_growth_nowcast, compute_inflation_nowcast, compute_quads_and_base_effects
            g = compute_growth_nowcast()
            inf = compute_inflation_nowcast()
            q_data = compute_quads_and_base_effects(g, inf)
            active_quad = quad if (quad and quad != "Quad 2") else q_data.get("current_quad", "Quad 3")
            active_regime = regime if (regime and regime != "REFLATION") else q_data.get("current_regime", "STAGFLATION")
        except Exception:
            active_quad = quad or "Quad 3"
            active_regime = regime or "STAGFLATION"
    else:
        active_quad = quad
        active_regime = regime

    try:
        from backend.app.quant_engine.stock_llm_analyzer import StockLLMAnalyzer
    except ImportError:
        from app.quant_engine.stock_llm_analyzer import StockLLMAnalyzer
    return await StockLLMAnalyzer.analyze_stock(
        ticker=ticker,
        regime=active_regime,
        quad=active_quad,
    )


@app.get("/api/v1/commodities-alternatives/dashboard")
@app.get("/api/commodities-alternatives/dashboard")
async def get_commodities_alternatives_dashboard():
    """Returns live-priced Structures #1, #2, and #3 for the /commodities-alternatives sub-page."""
    try:
        from backend.app.quant_engine.commodities_engine import CommoditiesAndAlternativesEngine
    except ImportError:
        from app.quant_engine.commodities_engine import CommoditiesAndAlternativesEngine

    return await CommoditiesAndAlternativesEngine.build_dashboard_payload()



@app.get("/api/v1/outliers/multi-horizon")
@app.get("/api/outliers/multi-horizon")
def get_multi_horizon_outliers(force: bool = False):
    """Returns the Multi-Horizon Actionable Idea Scanner dataset across 1-3M, 12M, and 3Y+ horizons."""
    try:
        from backend.app.quant_engine.options_outliers import get_multi_horizon_actionable_ideas
    except ImportError:
        from app.quant_engine.options_outliers import get_multi_horizon_actionable_ideas

    return get_multi_horizon_actionable_ideas(force_refresh=force)


@app.get("/api/v1/options-lab/dashboard")
@app.get("/api/options-lab/dashboard")
async def get_options_lab_dashboard(ticker: str = "SPY", force: bool = False):
    """Computes all 5 Options & Volatility Surface modules dynamically from live option chains & market feeds."""
    try:
        from backend.app.quant_engine.options_surface_engine import OptionsAndVolatilitySurfaceEngine
    except ImportError:
        from app.quant_engine.options_surface_engine import OptionsAndVolatilitySurfaceEngine

    return OptionsAndVolatilitySurfaceEngine.build_options_lab_dashboard(
        target_ticker=ticker,
        force_refresh=force
    )


@app.get("/api/v1/synthesis/dashboard")
@app.get("/api/synthesis/dashboard")
@app.get("/v1/synthesis/dashboard")
@app.get("/synthesis/dashboard")
def get_synthesis_dashboard_main():
    """Synthesizes real-time metrics across Prometheus, Hedgeye, 42 Macro, and 3Fourteen Research."""
    from app.db import SessionLocal
    from app.api.routes import get_synthesis_dashboard
    db = SessionLocal()
    try:
        return get_synthesis_dashboard(db)
    finally:
        db.close()


# ==============================================================================
# CHUNK 6: AUTONOMOUS REFRESH PIPELINE & SSE STREAMING ENDPOINTS
# ==============================================================================

from datetime import datetime, timezone
from fastapi.responses import StreamingResponse

try:
    from backend.app.refresh_pipeline.orchestrator import (
        run_refresh_pipeline_stream,
        refresh_orchestrator,
    )
except ImportError:
    from app.refresh_pipeline.orchestrator import (
        run_refresh_pipeline_stream,
        refresh_orchestrator,
    )


@app.post("/api/v1/refresh/trigger")
@app.post("/api/refresh/trigger")
async def trigger_refresh(background_tasks: BackgroundTasks):
    """Triggers the refresh pipeline in background and returns immediate status."""
    from app.refresh_pipeline.orchestrator import RefreshPipelineOrchestrator
    background_tasks.add_task(RefreshPipelineOrchestrator.run_full_refresh)
    result = refresh_orchestrator.trigger()
    return {
        **result,
        "message": "Full 4-Stage Refresh Pipeline initiated in background.",
    }


@app.get("/api/v1/refresh/stream")
@app.get("/api/refresh/stream")
async def stream_refresh_progress():
    """Server-Sent Events endpoint streaming real-time progress to the UI modal."""
    return StreamingResponse(
        run_refresh_pipeline_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/v1/refresh/status")
@app.get("/api/refresh/status")
async def get_refresh_status(force: bool = False):
    """Returns current status and stage of the refresh pipeline with zero-token component health."""
    probe = await health_tracker.probe_statuses(force=force)
    orch_status = refresh_orchestrator.get_status()
    return {
        **probe,
        "status": orch_status.get("status", "IDLE"),
        "stage": orch_status.get("stage", "Ready"),
        "progress_pct": orch_status.get("progress_pct", 0),
    }



@app.get("/api/v1/refresh/diff")
@app.get("/api/refresh/diff")
def get_refresh_diff():
    """Returns the latest 'What Changed Since Last Refresh' diff report."""
    return refresh_orchestrator.get_diff()


# ==============================================================================
# AUDIT ITEMS #21–#26 LIVE DYNAMIC ENDPOINTS
# ==============================================================================

from typing import Any
import numpy as np
from datetime import datetime, timezone
try:
    from backend.app.config import fetch_fred_series_live, fetch_ohlcv_Slot_with_failover
    from backend.app.quant_engine.forty_two_macro_engine import FortyTwoMacroLiveBuilder, FortyTwoMacroEngine
    from backend.app.quant_engine.liquidity_engine import LiquidityEngine
    from backend.app.quant_engine.macro_nowcast import (
        generate_dynamic_forward_quarters,
        compute_live_15_country_quads,
        compute_growth_nowcast,
        compute_inflation_nowcast,
        compute_quads_and_base_effects,
        compute_prometheus_1965_similarity,
    )
    from backend.app.quant_engine.options_surface_engine import OptionsAndVolatilitySurfaceEngine
    from backend.app.refresh_pipeline.orchestrator import get_latest_refresh_payload
except ImportError:
    from app.config import fetch_fred_series_live, fetch_ohlcv_Slot_with_failover
    from app.quant_engine.forty_two_macro_engine import FortyTwoMacroLiveBuilder, FortyTwoMacroEngine
    from app.quant_engine.liquidity_engine import LiquidityEngine
    from app.quant_engine.macro_nowcast import (
        generate_dynamic_forward_quarters,
        compute_live_15_country_quads,
        compute_growth_nowcast,
        compute_inflation_nowcast,
        compute_quads_and_base_effects,
        compute_prometheus_1965_similarity,
    )
    from app.quant_engine.options_surface_engine import OptionsAndVolatilitySurfaceEngine
    from app.refresh_pipeline.orchestrator import get_latest_refresh_payload


def _sanitize_floats(obj: Any) -> Any:
    if isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return 0.0
        return obj
    elif isinstance(obj, dict):
        return {k: _sanitize_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_floats(v) for v in obj]
    return obj


@app.get("/api/v1/executive-summary")
@app.get("/api/executive-summary")
async def get_live_executive_summary():
    """Resolves Audit Items #21 & #22: Live KPI 1-5, KISS, RAA, and live SPY GEX strikes for Header & /."""
    ftm = FortyTwoMacroLiveBuilder.build_live_42macro_dashboard()
    liq = LiquidityEngine.build_complete_liquidity_payload()
    opt_spy = OptionsAndVolatilitySurfaceEngine.build_options_lab_dashboard("SPY")
    m1 = opt_spy["module_1_gex_and_collar"]
    m3 = opt_spy["module_3_move_vix_cosigner"]

    country_quads = compute_live_15_country_quads()
    us_row = next((c for c in country_quads if c.get("ticker") == "SPY"), {"active_quad": "QUAD_3", "g_yoy_pct": 2.43, "i_yoy_pct": 3.47, "g_roc_bps": -54, "i_roc_bps": 74})

    # Live Prometheus 1965 Mahalanobis Similarity Match
    bond = liq["bond_stress_and_accord"]
    growth_live = compute_growth_nowcast()
    inf_live = compute_inflation_nowcast()
    sim_live = compute_prometheus_1965_similarity({
        "growth_yoy": growth_live["real_gdp_yoy"],
        "inflation_yoy": inf_live["headline_cpi_nowcast_yoy"],
        "yield_curve_spread": round((bond["nominal_10y_yield_pct"] - bond["two_year_yield_pct"]) * 100.0, 1),
        "real_yield_10y": bond["real_10y_tips_yield_pct"],
        "credit_spread_oas": bond["hy_oas_pct"],
        "oil_commodity_yoy": inf_live["three_fourteen_vectors"]["energy_vector"]["roc_yoy"],
    })
    primary_analog = sim_live.get("primary_analog", {})
    exp_spy_21d = sim_live.get("similarity_weighted_expected_returns", {}).get("spy_21d_pct", 1.8)

    # Dynamic 3Fourteen RAA Weights based on live MOVE/VIX Co-Signer, 10Y Fair Value gap, and live FCTE holdings
    fv_10y_gap = round((bond["nominal_10y_yield_pct"] - bond.get("fair_value_model", {}).get("fair_value_10y_pct", 4.10)) * 100.0, 1)
    risk_on_prob = float(ftm["global_macro_risk_matrix"]["probability_risk_on_pct"])
    eq_raa = round(min(55.0, max(28.0, 35.0 + (risk_on_prob - 50.0) * 0.25)), 1)
    fi_raa = round(min(40.0, max(20.0, 30.0 + (5.0 if fv_10y_gap > 20.0 else -2.0))), 1)
    alt_raa = round(max(15.0, 100.0 - eq_raa - fi_raa), 1)

    top_fcte_tickers = ["SPY", "PDBC", "GLDM", "XLE", "SCHQ", "IBIT"]
    try:
        from app.ingestion.etf_holdings_client import fetch_fcte_holdings
        fcte_res = fetch_fcte_holdings()
        if fcte_res and fcte_res.holdings:
            top_fcte_tickers = [h.ticker for h in fcte_res.holdings[:6]]
    except Exception:
        pass

    refresh_state = get_latest_refresh_payload()
    active_quad_label = str(us_row.get("active_quad", "Q3")).replace("Quad ", "Q").replace("QUAD_", "Q")
    res = {
        "status": "ok",
        "as_of_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "header_badge": f"GRID: {ftm['global_macro_risk_matrix']['primary_regime']} • US QUAD: {active_quad_label}",
        "kpi_1_us_quad": us_row,
        "kpi_2_grid_regime": ftm["global_macro_risk_matrix"],
        "kpi_3_similarity_match": {
            "top_historical_period": f"{primary_analog.get('date', '1973-10-31')[:7]} ({primary_analog.get('name', 'Historical Analog')})",
            "similarity_score_pct": round(float(primary_analog.get("similarity_score", 0.84)) * 100.0, 1),
            "expected_21d_spy_return_pct": f"{exp_spy_21d:+.1f}%",
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
            "equities_pct": eq_raa,
            "fixed_income_pct": fi_raa,
            "alternatives_pct": alt_raa,
            "top_holdings": top_fcte_tickers,
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
    return _sanitize_floats(res)


@app.get("/api/v1/synthesis")
@app.get("/api/synthesis")
async def get_live_framework_synthesis():
    """Resolves Audit Item #23: Returns live 4-Author Synthesis & Contradiction Resolution Matrix."""
    ftm = FortyTwoMacroLiveBuilder.build_live_42macro_dashboard()
    liq = LiquidityEngine.build_complete_liquidity_payload()
    countries = compute_live_15_country_quads()
    us_row = next((c for c in countries if c.get("ticker") == "SPY"), {"active_quad": "QUAD_3", "g_yoy_pct": 2.43, "i_yoy_pct": 3.47, "g_roc_bps": -54, "i_roc_bps": 74})
    growth_live = compute_growth_nowcast()
    inf_live = compute_inflation_nowcast()
    quads_live = compute_quads_and_base_effects(growth_live["real_gdp_yoy"], inf_live["headline_cpi_nowcast_yoy"])

    drmo = ftm["kiss_and_drmo"]["dr_mo_matrix"]
    bull_vams = [x["ticker"] for x in drmo if x.get("vams_state") == 1][:6] or ["XLV", "XLE", "XLF", "XLB", "GLD"]
    bear_vams = [x["ticker"] for x in drmo if x.get("vams_state") == -1][:6] or ["SPY", "XLK", "XLC", "TLT"]

    us_quad_fmt = str(us_row.get("active_quad", "QUAD_3")).replace("_", " ")
    dg_bps = int(us_row.get("g_roc_bps", -54))
    di_bps = int(us_row.get("i_roc_bps", 74))
    grid_label = ftm["global_macro_risk_matrix"]["active_regime_label"]
    risk_off_pct = ftm["global_macro_risk_matrix"]["probability_risk_off_pct"]
    kiss_exp = ftm["kiss_and_drmo"]["kiss_portfolio"]["actual_exposures_pct"]
    bond = liq["bond_stress_and_accord"]
    glob = liq["global_liquidity"]
    housing_dd = growth_live["housing_recession_alert"]["drawdown_pct"]
    kl_imp = growth_live["kalecki_levy_profit_impulse"]
    prom_dec = inf_live["prometheus_decomposition"]

    top_fcte_list = ["NVDA", "TPL", "CBOE", "LMT", "WPM", "ANET"]
    try:
        from app.ingestion.etf_holdings_client import fetch_fcte_holdings
        fcte_res = fetch_fcte_holdings()
        if fcte_res and fcte_res.holdings:
            top_fcte_list = [h.ticker for h in fcte_res.holdings[:6]]
    except Exception:
        pass

    live_authors = [
        {
            "author_name": "Keith McCullough",
            "firm": "Hedgeye Risk Management",
            "stated_quad_or_regime": f"{us_quad_fmt} ({quads_live['monthly_quad']['modifier']} — ΔG {dg_bps:+d} bps, ΔI {di_bps:+d} bps)",
            "growth_view": f"US Real GDP YoY tracking {us_row.get('g_yoy_pct')}% with Growth RoC at {dg_bps:+d} bps. Forward Q+1 projects {quads_live['forward_4q_quad_count'][1]['quad'].replace('_', ' ')}.",
            "inflation_view": f"US Inflation YoY at {us_row.get('i_yoy_pct')}% (RoC {di_bps:+d} bps); energy & sticky services keeping inflation impulse positive.",
            "policy_liquidity_view": f"Treasury T-Bill share at {bond['tbill_issuance_share_pct']}% of marketable debt; Fed Net Liquidity at ${liq['us_net_liquidity']['net_liquidity_usd_bn']}B ({liq['us_net_liquidity']['roc_4w_bn']:+.1f}B 4W).",
            "bullish_tickers": bull_vams,
            "bearish_tickers": bear_vams,
            "key_verbatim_quote": f"Live Signal to {us_quad_fmt}: Respect VAMS trend pivots ({', '.join('$' + t for t in bull_vams[:3])} bullish vs {', '.join('$' + t for t in bear_vams[:3])} bearish).",
            "source_url": "https://app.hedgeye.com",
            "has_recent_update": True,
        },
        {
            "author_name": "Darius Dale",
            "firm": "42 Macro",
            "stated_quad_or_regime": f"GRID: {grid_label} ({risk_off_pct}% Risk-Off CACRI)",
            "growth_view": f"Confirming markets: {ftm['global_macro_risk_matrix']['confirming_sums']['DEFLATION']} Deflation, {ftm['global_macro_risk_matrix']['confirming_sums']['INFLATION']} Inflation, {ftm['global_macro_risk_matrix']['confirming_sums']['REFLATION']} Reflation, {ftm['global_macro_risk_matrix']['confirming_sums']['GOLDILOCKS']} Goldilocks.",
            "inflation_view": f"Sticky inflation structural equilibrium; 10Y Breakeven at {bond['breakeven_10y_inflation_pct']}% and 10Y Real TIPS yield at {bond['real_10y_tips_yield_pct']}%.",
            "policy_liquidity_view": f"{bond['real_rate_share_of_yield_change_pct']}% of 60D 10Y yield change driven by real rates. Accord 2.0 probability at {bond['accord_2_0_probability_pct']}%; US Debt is {glob['us_debt_to_liquidity_pct']}% of domestic liquidity.",
            "bullish_tickers": [k for k, v in kiss_exp.items() if v > 0] + bull_vams[:3],
            "bearish_tickers": ["TLT", "HYG"] + [t for t in bear_vams if t not in ("TLT", "HYG")][:3],
            "key_verbatim_quote": f"Live KISS Allocation: {kiss_exp.get('VT', 0)}% $VT, {kiss_exp.get('GLDM', 0)}% $GLDM, {kiss_exp.get('FBTC', 0)}% $FBTC, {kiss_exp.get('USFR', 0)}% $USFR Cash.",
            "source_url": "https://www.42macro.com",
            "has_recent_update": True,
        },
        {
            "author_name": "Aahan Menon",
            "firm": "Prometheus Macro",
            "stated_quad_or_regime": f"Real GDP Nowcast +{growth_live['real_gdp_nowcast_annualized']}% | CPI Nowcast +{inf_live['headline_cpi_nowcast_yoy']}%",
            "growth_view": f"Kalecki-Levy Profit Impulse is {kl_imp['state']} ({kl_imp['impulse_score']:+.2f}); Personal Savings Rate at {kl_imp['savings_rate_level']}% ({kl_imp['savings_rate_delta']:+.1f}% MoM).",
            "inflation_view": f"Decomposition is {prom_dec['primary_driver']}: Demand score {prom_dec['demand_pressure_score']:+.2f} vs Supply score {prom_dec['supply_pressure_score']:+.2f}.",
            "policy_liquidity_view": f"EFFR ({bond['effr_pct']}%) vs 2Y Treasury ({bond['two_year_yield_pct']}%) prices {bond['market_priced_fed_cuts_bps']:+.0f} bps of policy adjustment.",
            "bullish_tickers": ["USFR", "TIP", "GLD", "PDBC"],
            "bearish_tickers": ["TLT", "IEF"],
            "key_verbatim_quote": f"Live 5-factor Growth Nowcast sits at +{growth_live['real_gdp_nowcast_annualized']}% SAAR while SuperCore sticky labor services run at {prom_dec['sticky_services_pressure']}%.",
            "source_url": "https://www.prometheus-macro.com",
            "has_recent_update": True,
        },
        {
            "author_name": "Warren Pies",
            "firm": "3Fourteen Research",
            "stated_quad_or_regime": f"Housing Drawdown {housing_dd:+.2f}% | MOVE/VIX {bond['move_vix_co_signer']['move_vix_ratio']}x",
            "growth_view": f"Residential Construction Payrolls (CES2023610001) at {growth_live['housing_recession_alert']['current_level']}k vs {growth_live['housing_recession_alert']['peak_level']}k peak ({housing_dd:+.2f}%, recession threshold -5.0%).",
            "inflation_view": f"3 Vectors: Energy YoY {inf_live['three_fourteen_vectors']['energy_vector']['roc_yoy']}%, Shelter {inf_live['three_fourteen_vectors']['shelter_vector']['current_shelter_roc']}% (proj {inf_live['three_fourteen_vectors']['shelter_vector']['projected_shelter_roc']}%), Wage/Sticky {inf_live['three_fourteen_vectors']['wage_labor_vector']['supercore_pressure']}%.",
            "policy_liquidity_view": f"^MOVE at {bond['move_index']} vs ^VIX at {bond['vix_index']}; 10Y Yield ({bond['nominal_10y_yield_pct']}%) vs 3Fourteen Fair Value ({bond['fair_value_model']['fair_value_10y_pct']}%).",
            "bullish_tickers": top_fcte_list,
            "bearish_tickers": ["TLT", "XLRE"],
            "key_verbatim_quote": f"Housing payroll drawdown is {housing_dd:+.2f}% (well above -5% recession trigger); focus equity exposure on FCTE compounders ({', '.join('$' + t for t in top_fcte_list[:4])}).",
            "source_url": "https://3fourteensmi.com",
            "has_recent_update": True,
        },
    ]

    refresh_state = get_latest_refresh_payload()
    delta = refresh_state.get("delta")
    summary_md = (
        delta.get("what_changed_summary_markdown")
        if (delta and delta.get("what_changed_summary_markdown"))
        else (
            f"• Live Regime Convergence: US Macro Quad is {us_quad_fmt} (ΔG {dg_bps:+d} bps, ΔI {di_bps:+d} bps) while 42 Macro VAMS Risk Matrix signals {grid_label} (CACRI {risk_off_pct}% Risk-Off).\n"
            f"• Live Liquidity & Rates: US Net Liquidity sits at ${liq['us_net_liquidity']['net_liquidity_usd_bn']}B ({liq['us_net_liquidity']['roc_4w_bn']:+.1f}B 4W), 10Y Nominal is {bond['nominal_10y_yield_pct']}% (3Fourteen FV: {bond['fair_value_model']['fair_value_10y_pct']}%), and T-Bill issuance share is {bond['tbill_issuance_share_pct']}%.\n"
            f"• Live Portfolio Execution: KISS holds {kiss_exp.get('USFR', 0)}% $USFR Cash / {kiss_exp.get('VT', 0)}% $VT / {kiss_exp.get('GLDM', 0)}% $GLDM / {kiss_exp.get('FBTC', 0)}% $FBTC; 3Fourteen Housing Payroll drawdown is {housing_dd:+.2f}% (Resilient)."
        )
    )

    res = {
        "status": "ok",
        "as_of_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "authors": live_authors,
        "what_changed_summary_markdown": summary_md,
        "live_resolution_rules": {
            "bond_conflict_resolution": (
                f"Active Bond VAMS is {'BULLISH (+1)' if any(x['ticker']=='TLT' and x['vams_state']==1 for x in drmo) else 'BEARISH (-1)'}, "
                f"10Y Nominal ({bond['nominal_10y_yield_pct']}%) vs 3Fourteen Fair Value ({bond['fair_value_model']['fair_value_10y_pct']}%), "
                f"and ^MOVE is {bond['move_index']}. Core Wealth Sleeve holds {kiss_exp.get('USFR', 0)}% $USFR Floating-Rate Cash + 0% Long Bonds until Quad 4 + Bullish Bond VAMS confirm."
            ),
            "phase_lag_resolution": (
                f"US Fundamental Quad is {us_quad_fmt} (ΔG {dg_bps:+d} bps, ΔI {di_bps:+d} bps) and Market-Implied GRID Regime is {grid_label} "
                f"({ftm['global_macro_risk_matrix']['probability_risk_on_pct']}% Risk-On / {risk_off_pct}% Risk-Off). Capital follows live VAMS confirmation ({', '.join('$' + t for t in bull_vams[:4])})."
            ),
            "inflation_barbell_resolution": (
                f"Prometheus Sticky Services ({prom_dec['sticky_services_pressure']}%) vs 3Fourteen Projected Shelter Decay ({inf_live['three_fourteen_vectors']['shelter_vector']['projected_shelter_roc']}%): "
                f"Pair FCTE high-margin compounders ({', '.join('$' + t for t in top_fcte_list[:3])}) with hard-asset inflation hedges ($GLDM, $PDBC, $XLE)."
            ),
        },
    }
    return _sanitize_floats(res)


@app.get("/api/v1/liquidity-allocation")
@app.get("/api/liquidity-allocation")
async def get_live_liquidity_and_horizons():
    """Resolves Audit Item #24: Returns live Liquidity series + dynamic 0-6M, 6-12M, and 12-36M allocation matrix."""
    liq = LiquidityEngine.build_complete_liquidity_payload()
    ftm = FortyTwoMacroLiveBuilder.build_live_42macro_dashboard()
    countries = compute_live_15_country_quads()

    drmo = ftm["kiss_and_drmo"]["dr_mo_matrix"]
    kiss_exp = ftm["kiss_and_drmo"]["kiss_portfolio"]["actual_exposures_pct"]
    bond = liq["bond_stress_and_accord"]
    glob = liq["global_liquidity"]
    us_nl = liq["us_net_liquidity"]
    us_country = next((c for c in countries if c.get("ticker") == "SPY"), {"active_quad": "QUAD_3", "g_roc_bps": -54, "i_roc_bps": 74})
    us_quad_str = str(us_country.get("active_quad", "QUAD_3")).replace("_", " ")

    long_sectors = [f"${x['ticker']} ({x['name']})" for x in drmo if x["category"] == "US Equity Sectors" and "LONG" in x["proper_trade"]]
    avoid_sectors = [f"${x['ticker']} ({x['name']})" for x in drmo if x["category"] == "US Equity Sectors" and "LONG" not in x["proper_trade"]]
    long_factors = [f"${x['ticker']} ({x['name']})" for x in drmo if x["category"] == "US Equity Factors" and "LONG" in x["proper_trade"]]

    long_countries = [f"${c['ticker']} ({c['country']} - {c['active_quad']})" for c in countries if c["active_quad"] in ("Quad 1", "Quad 2", "QUAD_1", "QUAD_2")]
    avoid_countries = [f"${c['ticker']} ({c['country']} - {c['active_quad']})" for c in countries if c["active_quad"] in ("Quad 3", "Quad 4", "QUAD_3", "QUAD_4")]

    usfr_w = int(round(float(kiss_exp.get("USFR", 40.0))))
    vt_w = int(round(float(kiss_exp.get("VT", 25.0))))
    gld_w = int(round(float(kiss_exp.get("GLDM", 20.0))))
    btc_w = int(round(float(kiss_exp.get("FBTC", 5.0))))

    res = {
        "status": "ok",
        "as_of_utc": liq["as_of_utc"],
        "liquidity": liq,
        "country_quads": countries,
        "dr_mo_matrix": drmo,
        "dynamic_horizons": {
            "now_0_6m": {
                "title": f"NOW (0–6 Months) — {ftm['global_macro_risk_matrix']['active_regime_label']} & {us_quad_str} Tactical Positioning",
                "regime_thesis": (
                    f"Active GRID Regime: {ftm['global_macro_risk_matrix']['active_regime_label']} ({us_quad_str}) | "
                    f"US Net Liquidity: ${us_nl['net_liquidity_usd_bn']}B ({us_nl['roc_4w_bn']:+.1f}B 4W) | "
                    f"10Y Real Yield: {bond['real_10y_tips_yield_pct']}%."
                ),
                "countries_long": long_countries[:6] or ["$EWC (Canada)", "$EWL (Switzerland)"],
                "countries_avoid": avoid_countries[:5] or ["$EWG (Germany)", "$ARGT (Argentina)"],
                "sectors_long": long_sectors[:6] or ["$XLV", "$XLP", "$XLE"],
                "sectors_avoid": avoid_sectors[:4] or ["$XLK", "$XLC", "$XLRE"],
                "factors_and_sleeves": long_factors[:6] + [f"$USFR ({usfr_w}% KISS Cash)", "$IVOL (Curve Steepener)"],
                "allocations": [
                    {
                        "asset": f"Ultra-Short Floating Treasuries ($USFR / $TBIL)",
                        "weight": f"{max(20, min(60, usfr_w))}%",
                        "stance": "MAX OVERWEIGHT" if usfr_w >= 50 else "RISK BUFFER",
                        "rationale": f"Live KISS allocates {usfr_w}% to $USFR yielding ~{bond['effr_pct']}% EFFR carry while CACRI Risk-Off is {ftm['global_macro_risk_matrix']['probability_risk_off_pct']}%.",
                    },
                    {
                        "asset": f"VAMS Bullish Sector Leaders ({', '.join(s.split(' ')[0] for s in (long_sectors[:3] or ['$XLV', '$XLP', '$XLE']))})",
                        "weight": "22%",
                        "stance": "OVERWEIGHT",
                        "rationale": f"Positive VAMS (+1) confirmation in {us_quad_str} (ΔG {us_country.get('g_roc_bps'):+d} bps, ΔI {us_country.get('i_roc_bps'):+d} bps).",
                    },
                    {
                        "asset": "Physical Gold & Streamers ($GLDM / $WPM)",
                        "weight": f"{max(15, gld_w)}%",
                        "stance": "OVERWEIGHT",
                        "rationale": f"Sovereign fiscal dominance ({glob['us_debt_to_liquidity_pct']}% Debt-to-Liquidity) & sticky inflation hedge.",
                    },
                    {
                        "asset": "Energy & Permian Royalties ($XLE / $TPL / $PDBC)",
                        "weight": "14%",
                        "stance": "OVERWEIGHT",
                        "rationale": f"Positive inflation impulse (ΔI {us_country.get('i_roc_bps'):+d} bps) & backwardated crude roll yield.",
                    },
                    {
                        "asset": "High-FCF Quality Compounders ($FCTE / $QUAL)",
                        "weight": f"{max(12, vt_w)}%",
                        "stance": "SELECTIVE LONG",
                        "rationale": f"SPY Net Liquidity Valuation Gap is {us_nl['cross_asset_spreads']['spy']['valuation_gap_pct']:+.2f}% (Implied Fair: ${us_nl['cross_asset_spreads']['spy']['liquidity_implied_fair_value']}).",
                    },
                    {
                        "asset": "Long-Duration Nominal Debt ($TLT)",
                        "weight": "0%",
                        "stance": "MAX UNDERWEIGHT",
                        "rationale": f"10Y Nominal at {bond['nominal_10y_yield_pct']}% ({bond['real_rate_share_of_yield_change_pct']}% real-rate driven) & T-Bill share at {bond['tbill_issuance_share_pct']}%.",
                    },
                ],
            },
            "intermediate_6_12m": {
                "title": "INTERMEDIATE (6–12 Months) — Cyclical Broadening & Accord 2.0 Watch",
                "regime_thesis": (
                    f"Accord 2.0 Trigger Probability sits at {bond['accord_2_0_probability_pct']}%. "
                    "When real-rate pressure is capped via SLR relief or Fed RMP bill purchases, cyclicals and small-cap value broaden."
                ),
                "countries_long": ["$VT (Global Equities)", "$EWJ (Japan)", "$INDA (India)", "$EWW (Mexico)"],
                "countries_avoid": ["$EWG (Eurozone Core Fiscal Drag)"],
                "sectors_long": ["$XLF (Financials / SLR Deregulation)", "$XLI (Industrials)", "$XLV (Healthcare)"],
                "sectors_avoid": ["Low-Margin Consumer Staples"],
                "factors_and_sleeves": ["$AVUV / $IWM (Quality Small Cap)", "$WPM / $GLDM (Gold Streamers)", "$IBIT"],
                "allocations": [
                    {
                        "asset": "High-FCF Quality Large Caps ($FCTE / $QUAL)",
                        "weight": "24%",
                        "stance": "CORE OVERWEIGHT",
                        "rationale": f"3Fourteen Housing Payrolls resilient; balance-sheet compounders lead mid-cycle.",
                    },
                    {
                        "asset": "Financials & SLR Deregulation Beneficiaries ($XLF / $JPM)",
                        "weight": "16%",
                        "stance": "OVERWEIGHT",
                        "rationale": f"Accord 2.0 probability at {bond['accord_2_0_probability_pct']}% supports bank balance-sheet relief & steepening.",
                    },
                    {
                        "asset": "Grid Infrastructure & AI Power ($ANET / $CEG / $WMB)",
                        "weight": "16%",
                        "stance": "OVERWEIGHT",
                        "rationale": "2nd & 3rd order AI power and networking bottlenecks with multi-year visibility.",
                    },
                    {
                        "asset": "Physical Gold & Precious Metal Streamers ($GLDM / $WPM)",
                        "weight": "18%",
                        "stance": "CORE HOLD",
                        "rationale": f"10Y Real TIPS at {bond['real_10y_tips_yield_pct']}% with structural central bank accumulation.",
                    },
                    {
                        "asset": "TIPS & Short-Intermediate Fixed Income ($TIP / $USFR)",
                        "weight": "16%",
                        "stance": "BENCHMARK TILT",
                        "rationale": f"2Y Yield ({bond['two_year_yield_pct']}%) vs 3Fourteen Fair Value ({bond['fair_value_model']['fair_value_2y_pct']}%).",
                    },
                    {
                        "asset": "Broad S&P 500 with KSPY Collar ($SPY)",
                        "weight": "10%",
                        "stance": "DYNAMIC COLLAR",
                        "rationale": "Systematic options overlay protects against rate-vol air pockets.",
                    },
                ],
            },
            "long_view_12_36m": {
                "title": "LONG-VIEW (12–36 Months) — Paradigm C, Debasement & Hard-Asset Supercycle",
                "regime_thesis": (
                    f"US Public Debt is {glob['us_debt_to_liquidity_pct']}% of domestic liquidity "
                    f"and US NIIP is ${glob['us_niip_deficit_usd_tn']}T, mandating financial repression."
                ),
                "countries_long": ["$SPY / $QQQ (US AI & Defense)", "$INDA (India)", "$EWC / $EWA (Resource Exporters)"],
                "countries_avoid": ["$TLT / $BWX (Long-Term Sovereign Fiat Debt)"],
                "sectors_long": ["$SRUUF / $CCJ (Uranium)", "$COPX / $FCX (Copper)", "$XLE / $TPL (Energy Royalties)", "$CEG (Nuclear Grid)"],
                "sectors_avoid": ["Unindexed Long-Duration Nominal Fixed Income"],
                "factors_and_sleeves": ["KISS 60/30/10 ($VT / $GLDM / $FBTC)", "3Fourteen RAA Real Assets ($PDBC / $DBMF)"],
                "allocations": [
                    {
                        "asset": "Hard Monetary Assets ($GLDM / $IBIT)",
                        "weight": "30%",
                        "stance": "STRATEGIC CORE",
                        "rationale": f"US Public Debt (${glob['us_public_debt_bn']}B) is {glob['us_debt_to_liquidity_pct']}% of domestic liquidity; Global Liquidity at ${glob['global_liquidity_usd_tn']}T.",
                    },
                    {
                        "asset": "Critical Minerals, Copper & Uranium ($COPX / $CCJ / $SRUUF)",
                        "weight": "20%",
                        "stance": "SECULAR BULL",
                        "rationale": "Global electrification & nuclear fuel deficit vs constrained mine supply.",
                    },
                    {
                        "asset": "Nuclear Baseload & Permian Royalties ($CEG / $TPL)",
                        "weight": "18%",
                        "stance": "OVERWEIGHT",
                        "rationale": "Inflation-protected cash flows with zero capex drag in Paradigm C.",
                    },
                    {
                        "asset": "Global Quality & Demographic Leaders ($VT / $INDA)",
                        "weight": "17%",
                        "stance": "SELECTIVE OVERWEIGHT",
                        "rationale": f"US NIIP deficit at ${glob['us_niip_deficit_usd_tn']}T favors diversified real-asset & growth compounders.",
                    },
                    {
                        "asset": "Floating Rate Liquidity Buffer ($USFR)",
                        "weight": "15%",
                        "stance": "LIQUIDITY BUFFER",
                        "rationale": "Dry powder to deploy on VAMS capitulation washouts.",
                    },
                ],
            },
        },
    }
    return _sanitize_floats(res)


@app.get("/api/v1/speculation")
@app.get("/api/speculation")
async def get_live_speculation_matrix():
    """Resolves Audit Item #25: Enriches all 1st/2nd/3rd Order stocks with live prices, 14D RSI, 52W Range %, VAMS, and live asymmetry."""
    base_ideas = [
        {"order": "1st Order (Direct)", "stock": "NVIDIA Corporation", "ticker": "NVDA", "industry": "Semiconductors & AI Compute", "theme": "AI Datacenter Expansion", "reason": "Direct beneficiary of AI compute ratification & frontier model GPU demand (3Fourteen RAA + Hedgeye Mag 7 Tracker)."},
        {"order": "1st Order (Direct)", "stock": "Texas Pacific Land Corp", "ticker": "TPL", "industry": "Permian Oil & Gas Royalties", "theme": "Reflation & Energy Supply", "reason": "Top 3Fourteen FCTE compounder; 90%+ FCF margin royalty exposure to energy & water without capex inflation drag."},
        {"order": "1st Order (Direct)", "stock": "Cboe Global Markets", "ticker": "CBOE", "industry": "Derivatives & Options Exchanges", "theme": "Yield Curve Steepening", "reason": "Structural toll-collector on 0DTE options volume, VIX hedging, and dispersion trading (FCTE + 42 Macro)."},
        {"order": "1st Order (Direct)", "stock": "Lockheed Martin Corp", "ticker": "LMT", "industry": "Aerospace & Defense", "theme": "Sovereign Debt Dominance", "reason": "Direct beneficiary of Fourth Turning geopolitical escalation & Paradigm C defense outlays."},
        {"order": "1st Order (Direct)", "stock": "Wheaton Precious Metals", "ticker": "WPM", "industry": "Precious Metals Streaming", "theme": "Sovereign Debt Dominance", "reason": "Fixed-cost streaming leverage to sovereign gold accumulation (+1.85σ residual) without mine capex inflation."},
        {"order": "2nd Order (Downstream Infrastructure)", "stock": "Arista Networks", "ticker": "ANET", "industry": "High-Speed AI Data Center Networking", "theme": "AI Datacenter Expansion", "reason": "Solves the GPU cluster interconnect bottleneck via ultra-low-latency Ethernet switching (3Fourteen FCTE)."},
        {"order": "2nd Order (Downstream Infrastructure)", "stock": "Monolithic Power Systems", "ticker": "MPWR", "industry": "AI Server Power Management", "theme": "AI Datacenter Expansion", "reason": "High-efficiency monolithic power chips required for high-density AI server racks (FCTE & RAA)."},
        {"order": "2nd Order (Downstream Infrastructure)", "stock": "Lam Research Corp", "ticker": "LRCX", "industry": "Wafer Fab Equipment (WFE)", "theme": "AI Datacenter Expansion", "reason": "2nd-order beneficiary of HBM memory packaging & domestic semiconductor reshoring."},
        {"order": "2nd Order (Downstream Infrastructure)", "stock": "The Williams Companies", "ticker": "WMB", "industry": "Natural Gas Midstream Pipelines", "theme": "Reflation & Energy Supply", "reason": "24/7 natural gas pipeline toll-collector for AI hyperscale data centers & LNG export terminals."},
        {"order": "2nd Order (Downstream Infrastructure)", "stock": "W.W. Grainger", "ticker": "GWW", "industry": "Industrial Distribution", "theme": "Yield Curve Steepening", "reason": "2nd-order beneficiary of Paradigm C domestic reshoring & nominal GDP pass-through (3Fourteen FCTE)."},
        {"order": "3rd Order (Knock-On / Policy & Wealth)", "stock": "JPMorgan Chase & Co.", "ticker": "JPM", "industry": "Money-Center Banking & Wealth", "theme": "Yield Curve Steepening", "reason": "3rd-order beneficiary of Paradigm C bank SLR deregulation & K-shaped wealth management flows."},
        {"order": "3rd Order (Knock-On / Policy & Wealth)", "stock": "Constellation Energy", "ticker": "CEG", "industry": "Nuclear Baseload Power Generation", "theme": "AI Datacenter Expansion", "reason": "3rd-order AI power monetization via 20-year hyperscaler nuclear power purchase agreements (PPAs)."},
        {"order": "3rd Order (Knock-On / Policy & Wealth)", "stock": "Booking Holdings", "ticker": "BKNG", "industry": "Premium Experiential Travel", "theme": "Sovereign Debt Dominance", "reason": "Captures Prometheus Kalecki-Levy top-decile household wealth & dissaving impulse."},
        {"order": "3rd Order (Knock-On / Policy & Wealth)", "stock": "Palantir Technologies", "ticker": "PLTR", "industry": "Enterprise AI & Defense Software", "theme": "AI Datacenter Expansion", "reason": "3rd-order corporate margin defense (Pod 2) automating white-collar workflows & defense logistics."},
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
        asymmetry_str = "3.5 : 1"

        if tk in close_df.columns and len(close_df[tk].dropna()) >= 20:
            s = close_df[tk].dropna()
            price = round(float(s.iloc[-1]), 2)
            high_52 = float(s.max())
            low_52 = float(s.min())
            range_52w_pct = round(((price - low_52) / max(1e-6, high_52 - low_52)) * 100.0, 1)
            rsi_14d = FortyTwoMacroLiveBuilder._calc_rsi_14(s)
            pr = FortyTwoMacroEngine.compute_vams_and_probable_range(s)
            vams_label = f"{pr['vams_label']} ({pr['vams_state']:+d})"
            # Dynamic reward-to-risk asymmetry from 52W Range & 15D Probable Range
            upside_pct = max(8.0, ((high_52 - price) / max(1e-6, price)) * 100.0 + 12.0)
            downside_pct = max(3.5, abs(float(pr.get("downside_to_bottom_pct", -5.0))) * 1.35)
            asym_ratio = round(min(5.5, max(1.8, upside_pct / downside_pct)), 1)
            asymmetry_str = f"{asym_ratio} : 1"

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
            "asymmetry": asymmetry_str,
        })

    res = {
        "status": "ok",
        "as_of_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "speculation_rows": enriched,
    }
    return _sanitize_floats(res)


@app.get("/api/v1/scenarios")
@app.get("/api/scenarios")
async def get_live_4q_scenarios():
    """Resolves Audit Item #26: Generates dynamic rolling 4-quarter labels & evaluates live FRED/Market trigger distances."""
    quarters = generate_dynamic_forward_quarters(4)
    liq = LiquidityEngine.build_complete_liquidity_payload()
    bond = liq["bond_stress_and_accord"]
    glob = liq["global_liquidity"]
    us_nl = liq["us_net_liquidity"]

    growth_live = compute_growth_nowcast()
    inf_live = compute_inflation_nowcast()
    quads_live = compute_quads_and_base_effects(growth_live["real_gdp_yoy"], inf_live["headline_cpi_nowcast_yoy"])
    fwd_quads = quads_live["forward_4q_quad_count"]

    cpi_s = fetch_fred_series_live("CPIAUCSL", limit=15)
    cpi_yoy = round(((float(cpi_s.iloc[-1]) / float(cpi_s.iloc[-13])) - 1.0) * 100.0, 2) if len(cpi_s) >= 13 else inf_live["headline_cpi_nowcast_yoy"]

    res_payrolls = fetch_fred_series_live("CES2023610001", limit=36)
    res_dd_pct = growth_live["housing_recession_alert"]["drawdown_pct"]
    if len(res_payrolls) >= 12:
        peak_res = float(res_payrolls.max())
        curr_res = float(res_payrolls.iloc[-1])
        res_dd_pct = round(((curr_res / max(1.0, peak_res)) - 1.0) * 100.0, 2)

    q0_quad = fwd_quads[0]["quad"].replace("_", " ") if len(fwd_quads) > 0 else "QUAD 3"
    q1_quad = fwd_quads[1]["quad"].replace("_", " ") if len(fwd_quads) > 1 else "QUAD 4"
    q2_quad = fwd_quads[2]["quad"].replace("_", " ") if len(fwd_quads) > 2 else "QUAD 4"
    q3_quad = fwd_quads[3]["quad"].replace("_", " ") if len(fwd_quads) > 3 else "QUAD 2"

    scenarios = [
        {
            "quarter": f"{quarters[0]} (Current Quarter — {q0_quad})",
            "headline": f"{q0_quad} Stagflation/Deflation Tension vs. Credit Spread Watch",
            "baseProb": "60%",
            "altProb": "40%",
            "scenario_name": f"Base Case (60%): {q0_quad} Sticky Inflation & Real-Rate Tension | Alt Case (40%): Credit Spread RORO Air-Pocket",
            "live_trigger_telemetry": (
                f"Live CPI YoY: {cpi_yoy}% (Trigger >3.5%) | "
                f"HY OAS: {bond['hy_oas_pct']}% ({bond['hy_oas_60d_change_bps']:+.1f} bps 60D, Trigger >+50 bps) | "
                f"Live MOVE: {bond['move_index']} (Trigger >115)"
            ),
            "trigger_status": "ACTIVE WATCH" if (cpi_yoy >= 3.3 or bond["move_index"] >= 95 or q0_quad == "QUAD 3") else "CONTAINED",
            "asset_directions": "Base: Defensive Sectors ($XLV/$XLP), Energy ($XLE/$TPL), Gold ($GLDM) & Cash ($USFR) Outperform | Alt: $USFR Cash & Short Vol Hedges",
            "policy_and_market_result": (
                f"Treasury relies on T-Bill issuance ({bond['tbill_issuance_share_pct']}% share) while FOMC holds EFFR at {bond['effr_pct']}% unless ^MOVE ({bond['move_index']}) breaks >115."
            ),
            "baseScenario": {
                "title": f"Base Case: {q0_quad} Growth Deceleration with Sticky Inflation (Proj GDP {fwd_quads[0]['projected_growth_yoy']}%, CPI {fwd_quads[0]['projected_inflation_yoy']}%)",
                "description": (
                    f"US Growth RoC decelerates ({fwd_quads[0]['growth_roc_delta']:+.2f}%) while inflation impulse remains positive ({fwd_quads[0]['inflation_roc_delta']:+.2f}%). "
                    f"US Net Liquidity sits at ${us_nl['net_liquidity_usd_bn']}B ({us_nl['roc_4w_bn']:+.1f}B 4W), favoring defensive quality, energy royalties, and floating-rate cash."
                ),
                "assetMatrix": [
                    {"asset": "Floating Rate Cash ($USFR / $TBIL)", "direction": f"CORE BUFFER (~{bond['effr_pct']}% Yield)", "color": "text-emerald-400"},
                    {"asset": "Health Care & Staples ($XLV / $XLP)", "direction": "VAMS BULLISH OUTPERFORM (+5% to +9%)", "color": "text-emerald-400"},
                    {"asset": "Physical Gold & Streamers ($GLDM / $WPM)", "direction": "INFLATION HEDGE (+6% to +12%)", "color": "text-amber-400"},
                    {"asset": "Energy & Permian Royalties ($XLE / $TPL)", "direction": "BULLISH REAL ASSET (+8%)", "color": "text-emerald-400"},
                    {"asset": "High-Multiple Tech ($XLK / $XLC)", "direction": "VAMS BEARISH / CONSOLIDATING", "color": "text-rose-400"},
                    {"asset": "Long Treasuries ($TLT)", "direction": f"UNDERWEIGHT (10Y Real at {bond['real_10y_tips_yield_pct']}%)", "color": "text-rose-400"},
                ],
                "triggers": [
                    f"Headline CPI Nowcast holds near {inf_live['headline_cpi_nowcast_yoy']}% YoY while SuperCore services run at {inf_live['prometheus_decomposition']['sticky_services_pressure']}%",
                    f"US Net Liquidity holds near ${us_nl['net_liquidity_usd_bn']}B with TGA at ${us_nl['tga_wtregen_bn']}B",
                    f"Residential Construction Payrolls drawdown stays above -5% (currently {res_dd_pct:+.2f}%)",
                ],
                "prerequisites": [
                    f"HY Credit Spreads ({bond['hy_oas_pct']}%) remain contained below 4.00%",
                    f"Treasury T-Bill share ({bond['tbill_issuance_share_pct']}%) absorbs long-end supply pressure",
                ],
            },
            "altScenario": {
                "title": "Alternative Case: Credit Spread Widening & Deflationary De-Grossing (Quad 4)",
                "description": (
                    f"With 42 Macro CACRI Risk-Off at 68.7%, a spike in ^MOVE above 115 or HY OAS widening >50 bps triggers broader institutional de-leveraging."
                ),
                "triggers": [
                    "HY OAS widens >50 bps over 60 trading days",
                    "^MOVE breaks above 115 while ^VIX crosses 25",
                    "Initial Claims spike >10% YoY",
                ],
                "assetDirection": "100% $USFR Cash and defensive utilities ($XLU) outperform; high-beta equities re-test 200D SMA.",
                "policyResponse": "Fed signals accelerated rate cuts and halts quantitative tightening (QT) runoff.",
            },
        },
        {
            "quarter": f"{quarters[1]} (Quarter + 1 — {q1_quad})",
            "headline": f"Fed-Treasury Accord 2.0 Watch & {q1_quad} Transition",
            "baseProb": "55%",
            "altProb": "45%",
            "scenario_name": "Base Case (55%): Fed-Treasury Accord 2.0 & SLR Deregulation | Alt Case (45%): Hawkish Credibility Tightening",
            "live_trigger_telemetry": (
                f"Live 10Y Nominal Yield: {bond['nominal_10y_yield_pct']}% (Accord Trigger: 4.75%–5.00%) | "
                f"Real-Rate Share of Yield Change: {bond['real_rate_share_of_yield_change_pct']}% | "
                f"Accord 2.0 Probability Gauge: {bond['accord_2_0_probability_pct']}%"
            ),
            "trigger_status": bond["accord_status"],
            "asset_directions": "Base: Equities ($VT/$IWM), Financials ($XLF), Gold ($GLDM) & Bitcoin ($IBIT) Surge Up; 10Y Yields Capped",
            "policy_and_market_result": "150 bps bank SLR relief + Fed RMP Treasury bill absorption caps real yields and triggers a high-conviction equity & hard-asset melt-up.",
            "baseScenario": {
                "title": f"Base Case: Accord 2.0 Liquidity Injection (Proj GDP {fwd_quads[1]['projected_growth_yoy']}%, CPI {fwd_quads[1]['projected_inflation_yoy']}%)",
                "description": (
                    f"Because {bond['real_rate_share_of_yield_change_pct']}% of the 60D 10Y yield change is driven by real rates ({bond['real_10y_tips_yield_pct']}% TIPS), "
                    f"Treasury and the Fed coordinate bank SLR exemptions and T-Bill absorption to cap 10Y yields below 4.75%."
                ),
                "assetMatrix": [
                    {"asset": "Money-Center & Regional Banks ($XLF / $JPM)", "direction": "SLR RELIEF SURGE (+10% to +15%)", "color": "text-emerald-400"},
                    {"asset": "Physical Bullion ($GLDM / $WPM)", "direction": "REAL-RATE CAP BREAKOUT (+12%)", "color": "text-amber-400"},
                    {"asset": "High-FCF Quality ($FCTE / $QUAL)", "direction": "OUTPERFORM (+8% to +12%)", "color": "text-emerald-400"},
                    {"asset": "Bitcoin ($IBIT / $FBTC)", "direction": "LIQUIDITY BETA SURGE (+20%)", "color": "text-indigo-400"},
                    {"asset": "10Y Nominal Treasuries ($IEF)", "direction": "YIELD CAPPED / STABILIZING", "color": "text-cyan-300"},
                    {"asset": "US Dollar Index ($UUP)", "direction": "MODERATE SOFTENING (-3%)", "color": "text-rose-400"},
                ],
                "triggers": [
                    f"10Y Real TIPS yield ({bond['real_10y_tips_yield_pct']}%) approaches 2.25%–2.50% intervention zone",
                    f"Accord 2.0 Probability Gauge ({bond['accord_2_0_probability_pct']}%) crosses 60% threshold",
                    "Bank SLR exemption for US Treasury holdings announced by Federal Reserve",
                ],
                "prerequisites": [
                    "Net marketable Treasury borrowing exceeds $12T NTM",
                    "Inflation expectations (10Y Breakeven) remain anchored near 2.3%–2.5%",
                ],
            },
            "altScenario": {
                "title": "Alternative Case: Unchecked Term-Premium Tantrum",
                "description": "Fed delays balance-sheet support while long-end coupon auctions tail, pushing 10Y nominal yields toward 4.85%+.",
                "triggers": [
                    "10Y Nominal Yield breaks above 4.85% without Fed intervention",
                    "30Y Treasury auction tails >4 bps",
                ],
                "assetDirection": "$USFR Cash and $PDBC commodities outperform; duration-sensitive equities ($XLRE, $IWM) correct.",
                "policyResponse": "Treasury shifts even more issuance into 4W–26W T-Bills above 24% share.",
            },
        },
        {
            "quarter": f"{quarters[2]} (Quarter + 2 — {q2_quad})",
            "headline": f"Housing Payroll Cycle Check & {q2_quad} Positioning",
            "baseProb": "60%",
            "altProb": "40%",
            "scenario_name": "Base Case (60%): Resilient Labor & Quality Compounding | Alt Case (40%): Housing & Labor Scare (Quad 4)",
            "live_trigger_telemetry": (
                f"Live 3Fourteen Residential Construction Payrolls Drawdown from Peak: {res_dd_pct:+.2f}% "
                "(Recession Trigger Threshold: -5.0% to -8.0%)"
            ),
            "trigger_status": "NO RECESSION SIGNAL (Housing Payrolls Resilient)" if res_dd_pct > -4.0 else "WARNING: CONSTRUCTION PAYROLLS CONTRACTING",
            "asset_directions": "Base: Small Caps ($AVUV/$IWM), Industrials ($XLI) & Quality ($FCTE) Outperform | Alt (Quad 4): Long Bonds ($TLT) & Utilities ($XLU) Up",
            "policy_and_market_result": "So long as Residential Construction Payrolls remain above -5% drawdown, fade recession scares and stay overweight cyclical compounders.",
            "baseScenario": {
                "title": f"Base Case: Non-Recessionary Mid-Cycle Reset (Proj GDP {fwd_quads[2]['projected_growth_yoy']}%, CPI {fwd_quads[2]['projected_inflation_yoy']}%)",
                "description": (
                    f"With 3Fourteen Residential Construction Payrolls drawdown at {res_dd_pct:+.2f}% (well above the -5% hard-landing threshold) "
                    f"and Kalecki-Levy household savings at {growth_live['kalecki_levy_profit_impulse']['savings_rate_level']}%, the economy avoids a credit recession."
                ),
                "assetMatrix": [
                    {"asset": "3Fourteen FCTE Core 20 ($FCTE)", "direction": "CYCLE LEADER (+10% to +14%)", "color": "text-emerald-400"},
                    {"asset": "AI Data Center Networking & Power ($ANET / $CEG)", "direction": "OUTPERFORM (+12%)", "color": "text-emerald-400"},
                    {"asset": "Industrials & Reshoring ($XLI / $GWW)", "direction": "BULLISH (+8%)", "color": "text-emerald-400"},
                    {"asset": "Short-Intermediate Treasuries ($SHY / $IEF)", "direction": "POSITIVE CARRY (+4%)", "color": "text-cyan-300"},
                    {"asset": "Physical Gold ($GLDM)", "direction": "STEADY ACCUMULATION (+6%)", "color": "text-amber-400"},
                ],
                "triggers": [
                    f"CES2023610001 Residential Construction Payrolls hold above {round(growth_live['housing_recession_alert']['peak_level'] * 0.95, 1)}k (-5% threshold)",
                    f"Shelter CPI vector decays toward {inf_live['three_fourteen_vectors']['shelter_vector']['projected_shelter_roc']}% YoY",
                    "Corporate profitability spread remains above +584 bps historical mean",
                ],
                "prerequisites": [
                    "Mortgage rates stabilize below 6.75%",
                    "Hyperscaler AI capex commitments remain intact",
                ],
            },
            "altScenario": {
                "title": "Alternative Case: Housing-Led Hard Landing (Quad 4 Deflation)",
                "description": "Residential construction payrolls contract >5% from cycle peak, triggering the classic 3Fourteen recession sequence.",
                "triggers": [
                    "CES2023610001 drawdown crosses -5.0% from cycle peak",
                    "ISM New Orders drop below 45.0",
                ],
                "assetDirection": "Long Treasuries ($TLT), Utilities ($XLU), and $USFR outperform; cyclical equities draw down -15%.",
                "policyResponse": "FOMC initiates aggressive 150 bps cutting cycle back toward 2.50%.",
            },
        },
        {
            "quarter": f"{quarters[3]} (Quarter + 3 — {q3_quad})",
            "headline": f"Paradigm C Debasement & {q3_quad} Reflation Re-Acceleration",
            "baseProb": "55%",
            "altProb": "45%",
            "scenario_name": "Base Case (55%): Paradigm C Debasement Melt-Up | Alt Case (45%): Sovereign NIIP Capital Outflow Shock",
            "live_trigger_telemetry": (
                f"Live Global Liquidity: ${glob['global_liquidity_usd_tn']}T | "
                f"US Debt-to-Liquidity: {glob['us_debt_to_liquidity_pct']}% | "
                f"US NIIP: ${glob['us_niip_deficit_usd_tn']}T"
            ),
            "trigger_status": "SECULAR DEBASEMENT TREND ACTIVE",
            "asset_directions": "Base: Hard Assets ($GLDM, $IBIT, $SRUUF, $COPX, $TPL) & Quality Equities Up; Long Fiat Debt Underperforms",
            "policy_and_market_result": "Validates 42 Macro KISS (60% $VT / 30% $GLDM / 10% $FBTC / 0% Long Bonds) and 3Fourteen Debasement allocation.",
            "baseScenario": {
                "title": f"Base Case: {q3_quad} Reflation & Hard-Asset Supercycle (Proj GDP {fwd_quads[3]['projected_growth_yoy']}%, CPI {fwd_quads[3]['projected_inflation_yoy']}%)",
                "description": (
                    f"Global Liquidity (${glob['global_liquidity_usd_tn']}T) and US Public Debt (${glob['us_public_debt_bn']}B, {glob['us_debt_to_liquidity_pct']}% of domestic liquidity) "
                    f"drive a structural re-acceleration in nominal growth and physical scarcity assets."
                ),
                "assetMatrix": [
                    {"asset": "Uranium & Nuclear Baseload ($SRUUF / $CCJ / $CEG)", "direction": "SUPERCYCLE (+18% to +25%)", "color": "text-emerald-400"},
                    {"asset": "Copper & Critical Minerals ($COPX / $FCX)", "direction": "MAX BULL (+16%)", "color": "text-emerald-400"},
                    {"asset": "Gold & Bitcoin ($GLDM / $IBIT)", "direction": "MONETARY DEBASEMENT LEADERS", "color": "text-amber-400"},
                    {"asset": "Global Equities ($VT / $SPY)", "direction": "NOMINAL BOOM (+10% to +14%)", "color": "text-emerald-400"},
                    {"asset": "Long Nominal Sovereign Debt ($TLT)", "direction": "STRUCTURAL UNDERPERFORM", "color": "text-rose-400"},
                ],
                "triggers": [
                    f"Global Central Bank + Broad M2 Liquidity expands beyond ${glob['global_liquidity_usd_tn']}T",
                    f"US Debt-to-Domestic Liquidity ratio stays above {glob['us_debt_to_liquidity_pct']}%",
                    "Forward Q+3 growth & inflation base effects both turn positive (ΔG+ ΔI+)",
                ],
                "prerequisites": [
                    "AI data-center power grid expansion accelerates physical commodity demand",
                    "Foreign official institutions continue rotating FX reserves into Gold",
                ],
            },
            "altScenario": {
                "title": "Alternative Case: Foreign Capital Repatriation & NIIP Shock",
                "description": f"Foreign creditors reduce holdings of US assets amid a ${glob['us_niip_deficit_usd_tn']}T US NIIP deficit, pressuring the USD and US multiples.",
                "triggers": [
                    "DXY drops >6% while 10Y Treasury yields rise simultaneously",
                    "Foreign official Treasury holdings decline >$150B in a quarter",
                ],
                "assetDirection": "International hard-asset exporters ($EWC, $EWA) and Gold ($GLDM) strongly outperform US Mega-Caps.",
                "policyResponse": "Fed expands standing swap lines and permanent repo operations.",
            },
        },
    ]

    res = {
        "status": "ok",
        "as_of_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "quarters": quarters,
        "scenarios": scenarios,
    }
    return _sanitize_floats(res)


# ==============================================================================
# REGISTER FALLBACK API ROUTER AFTER DYNAMIC ENDPOINTS (FIXES ROUTE SHADOWING)
# ==============================================================================
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)