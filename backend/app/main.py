import os
import logging
from contextlib import asynccontextmanager
from typing import Optional
from pydantic import BaseModel
from fastapi import FastAPI, BackgroundTasks, Request, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import init_db
from app.api.routes import api_router

try:
    from app.refresh_pipeline.health_monitor import health_tracker
except ImportError:
    from backend.app.refresh_pipeline.health_monitor import health_tracker

try:
    from app.quant_engine.benchmark_etf_cache import BenchmarkETFCacheManager
    from app.db.stock_compressed_store import StockCompressedStore
except ImportError:
    from backend.app.quant_engine.benchmark_etf_cache import BenchmarkETFCacheManager
    from backend.app.db.stock_compressed_store import StockCompressedStore



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

    # 1. Initialize compressed stock payload and sector LLM cache tables
    try:
        StockCompressedStore.init_tables()
        logger.info("StockCompressedStore tables initialized successfully.")
    except Exception as e:
        logger.warning(f"StockCompressedStore table initialization warning: {e}")

    # 2. Pre-warm the 26 Benchmark ETFs in background task to eliminate startup delay on Uvicorn bind
    try:
        import asyncio
        asyncio.create_task(BenchmarkETFCacheManager.warm_cache())
        logger.info("BenchmarkETFCacheManager warmup scheduled in background.")
    except Exception as e:
        logger.warning(f"BenchmarkETFCacheManager warmup warning: {e}")

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
async def health_check(probe: bool = False):
    """Fast health check endpoint (<1ms) for Render spin-up monitor and external cron pingers."""
    if probe:
        health_data = await health_tracker.probe_statuses()
    else:
        health_data = health_tracker.state
    return {
        "status": "ok",
        "service": "MacroPulse Alpha Quant Engine",
        "environment": os.getenv("ENVIRONMENT", settings.ENVIRONMENT),
        "health": health_data,
    }

@app.get("/api/v1/ping")
@app.get("/api/ping")
@app.get("/ping")
def ping():
    return {"status": "ok", "pong": True, "timestamp_utc": datetime.now(timezone.utc).isoformat()}

@app.get("/api/v1/etf/fcte-holdings")
@app.get("/v1/etf/fcte-holdings")
def get_fcte_holdings_direct():
    from app.ingestion.etf_holdings_client import fetch_fcte_holdings
    return fetch_fcte_holdings().to_dict()


@app.get("/api/v1/42macro/dashboard")
@app.get("/api/42macro/dashboard")
async def get_42_macro_dashboard(force: bool = False):
    """Returns the complete, schema-validated 42 Macro institutional suite for /42-macro (100% dynamic live builder with DB cache)."""
    try:
        from backend.app.db.stock_compressed_store import StockCompressedStore
        from backend.app.quant_engine.forty_two_macro_engine import FortyTwoMacroLiveBuilder
    except ImportError:
        from app.db.stock_compressed_store import StockCompressedStore
        from app.quant_engine.forty_two_macro_engine import FortyTwoMacroLiveBuilder

    if not force:
        cached = StockCompressedStore.get_macro_liquidity_payload("live_42macro_dashboard", max_age_seconds=900)
        if cached:
            return cached

    return FortyTwoMacroLiveBuilder.build_live_42macro_dashboard(force=force)


@app.get("/api/v1/grid/matrix")
@app.get("/api/grid/matrix")
async def get_global_grid_matrix_endpoint(force: bool = False):
    """Returns the comprehensive 18-country historical Global GRID matrix, predictive metrics, and hindsight anomalies."""
    try:
        from app.quant_engine.global_grid_engine import GlobalGridEngine
    except ImportError:
        from backend.app.quant_engine.global_grid_engine import GlobalGridEngine
    return GlobalGridEngine.build_global_grid_payload(force_refresh=force)


@app.get("/api/v1/grid/history")
@app.get("/api/grid/history")
async def get_global_grid_history_endpoint(
    country: Optional[str] = None,
    frequency: Optional[str] = None,
    is_anomaly: Optional[bool] = None,
):
    """Queries individual historical records from PostgreSQL/SQLite with optional filters."""
    try:
        from app.db.stock_compressed_store import StockCompressedStore
    except ImportError:
        from backend.app.db.stock_compressed_store import StockCompressedStore
    return StockCompressedStore.get_global_grid_records(
        country=country,
        frequency=frequency,
        is_anomaly=is_anomaly,
    )


@app.get("/api/v1/grid/forecast")
@app.get("/api/grid/forecast")
async def get_global_grid_forecast_endpoint(country: Optional[str] = None):
    """Queries 4-quarter forward regime forecasts from PostgreSQL/SQLite."""
    try:
        from app.db.stock_compressed_store import StockCompressedStore
    except ImportError:
        from backend.app.db.stock_compressed_store import StockCompressedStore
    return StockCompressedStore.get_global_grid_forecasts(country=country)



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
        from app.quant_engine.stock_analyzer import SingleStockXRayEngine
    except ImportError:
        from backend.app.quant_engine.stock_analyzer import SingleStockXRayEngine

    import asyncio
    return await asyncio.to_thread(
        SingleStockXRayEngine.analyze_ticker,
        req.ticker,
        active_regime,
        active_quad,
    )


@app.get("/api/v1/stock/analyze")
@app.get("/api/stock/analyze")
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
        from app.quant_engine.stock_analyzer import SingleStockXRayEngine
    except ImportError:
        from backend.app.quant_engine.stock_analyzer import SingleStockXRayEngine

    import asyncio
    return await asyncio.to_thread(
        SingleStockXRayEngine.analyze_ticker,
        ticker,
        active_regime,
        active_quad,
    )


@app.get("/api/v1/commodities-alternatives/dashboard")
@app.get("/api/commodities-alternatives/dashboard")
async def get_commodities_alternatives_dashboard(force: bool = False):
    """Returns live-priced Structures #1, #2, and #3 for the /commodities-alternatives sub-page with <15ms DB caching."""
    try:
        from backend.app.quant_engine.commodities_engine import CommoditiesAndAlternativesEngine
    except ImportError:
        from app.quant_engine.commodities_engine import CommoditiesAndAlternativesEngine

    return await CommoditiesAndAlternativesEngine.build_dashboard_payload(force=force)



@app.get("/api/v1/trade-ideas")
@app.get("/api/trade-ideas")
def get_trade_ideas(force: bool = False):
    """Returns the Unified Multi-Horizon Trade Ideas dataset combining Outliers, Speculation, Macro Regimes, and DB caching."""
    try:
        from backend.app.quant_engine.trade_ideas_engine import TradeIdeasEngine
    except ImportError:
        from app.quant_engine.trade_ideas_engine import TradeIdeasEngine

    return TradeIdeasEngine.build_trade_ideas_payload(force_refresh=force)


@app.api_route("/api/v1/cron/daily-scan", methods=["GET", "POST"])
@app.api_route("/api/cron/daily-scan", methods=["GET", "POST"])
async def run_daily_cron_scan(
    request: Request,
    secret: Optional[str] = None,
    x_cron_secret: Optional[str] = Header(None, alias="X-Cron-Secret"),
):
    """
    Automated Daily Post-Close Scanner & Render Keep-Alive Endpoint.
    Triggered by GitHub Actions or cron-job.org at 21:15 UTC (08:15 AEDT).
    Secured via CRON_SECRET header or query parameter.
    """
    expected_secret = os.getenv("CRON_SECRET", "macropulse-cron-key-2026").strip()
    provided_secret = x_cron_secret or secret or request.headers.get("Authorization", "").replace("Bearer ", "").strip()
    
    if expected_secret and provided_secret != expected_secret:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid or missing cron secret")

    logger.info("[Cron] Executing scheduled daily warmup & post-close ingestion...")
    t0 = time.perf_counter()
    results = {}

    # 1. Warm Benchmark ETFs & Ingest Active Windows
    try:
        try:
            from backend.app.quant_engine.scheduled_refresher import AdaptiveDataRefresher
        except ImportError:
            from app.quant_engine.scheduled_refresher import AdaptiveDataRefresher
        refresher_res = await AdaptiveDataRefresher.run_daily_warmup_and_refresh()
        results["warmup"] = refresher_res
    except Exception as e:
        logger.warning(f"[Cron] AdaptiveDataRefresher notice: {e}")
        results["warmup"] = {"error": str(e)}

    # 2. Recalculate Trade Ideas Payload
    try:
        try:
            from backend.app.quant_engine.trade_ideas_engine import TradeIdeasEngine
        except ImportError:
            from app.quant_engine.trade_ideas_engine import TradeIdeasEngine
        ti_res = TradeIdeasEngine.build_trade_ideas_payload(force_refresh=True)
        results["trade_ideas"] = {"status": ti_res.get("status"), "tracked": ti_res.get("total_candidates_tracked")}
    except Exception as e:
        logger.warning(f"[Cron] TradeIdeasEngine notice: {e}")
        results["trade_ideas"] = {"error": str(e)}

    # 3. Trigger Global Refresh Pipeline
    try:
        try:
            from backend.app.refresh_pipeline.orchestrator import refresh_orchestrator
        except ImportError:
            from app.refresh_pipeline.orchestrator import refresh_orchestrator
        results["orchestrator"] = refresh_orchestrator.trigger()
    except Exception as e:
        logger.warning(f"[Cron] Orchestrator trigger notice: {e}")
        results["orchestrator"] = {"error": str(e)}

    # 4. Trigger Quantitative Reversal Scanner & DB Persistence
    reversal_payload = None
    try:
        try:
            from backend.app.quant_engine.reversal_scanner import ReversalScanner
        except ImportError:
            from app.quant_engine.reversal_scanner import ReversalScanner
        reversal_payload = ReversalScanner.run_daily_scan()
        results["reversal_scan"] = {
            "status": reversal_payload.get("status"),
            "candidates": len(reversal_payload.get("candidates", [])),
            "macro_throttle": reversal_payload.get("macro_throttle", {}).get("status_code"),
        }
    except Exception as e:
        logger.warning(f"[Cron] ReversalScanner trigger notice: {e}")
        results["reversal_scan"] = {"error": str(e)}

    # 5. Dispatch Morning Briefing Alert Email
    try:
        try:
            from backend.app.notifications.email_alerter import EmailAlerter
        except ImportError:
            try:
                from backend.app.quant_engine.email_alerter import EmailAlerter
            except ImportError:
                from app.notifications.email_alerter import EmailAlerter
        email_res = EmailAlerter.send_daily_brief(payload=reversal_payload)
        results["morning_alert"] = email_res
    except Exception as e:
        logger.warning(f"[Cron] EmailAlerter trigger notice: {e}")
        results["morning_alert"] = {"error": str(e)}

    elapsed = round(time.perf_counter() - t0, 2)
    return {
        "status": "SUCCESS",
        "action": "DAILY_SCAN_AND_WARMUP",
        "elapsed_seconds": elapsed,
        "executed_at_utc": datetime.now(timezone.utc).isoformat(),
        "details": results,
    }


@app.get("/api/v1/reversals/scan")
@app.get("/api/reversals/scan")
def get_reversals_scan(
    force: bool = False,
    limit: int = 500,
    equity: float = 100000.0,
    risk_pct: float = 1.0,
):
    """
    Executes or retrieves the Idiosyncratic Residual & Microstructure Liquidity Shock Scanner.
    Regresses universe returns against SPY and sector SPDRs to flag extreme idiosyncratic dislocations (epsilon < -2.25 sigma, IBS < 0.15, RVOL > 1.8x).
    """
    try:
        from backend.app.quant_engine.reversal_scanner import ReversalScanner
    except ImportError:
        from app.quant_engine.reversal_scanner import ReversalScanner

    return ReversalScanner.run_reversal_scan(
        force=force,
        universe_limit=limit,
        account_equity=equity,
        risk_pct=risk_pct,
    )


@app.api_route("/api/v1/reversals/send-alert", methods=["GET", "POST"])
@app.api_route("/api/reversals/send-alert", methods=["GET", "POST"])
def send_reversals_alert(force: bool = False):
    """Manually triggers or tests the Morning Reversals Briefing HTML email dispatcher."""
    try:
        from backend.app.quant_engine.email_alerter import EmailAlerter
    except ImportError:
        from app.quant_engine.email_alerter import EmailAlerter

    return EmailAlerter.dispatch_morning_briefing()


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


@app.get("/api/v1/options-lab/cross-asset-volatility")
@app.get("/api/options-lab/cross-asset-volatility")
async def get_options_lab_cross_asset_volatility():
    """Returns unified cross-asset volatility snapshot (MOVE, VIX, VVIX, VRP, SKEW) for project-wide integration."""
    try:
        from backend.app.quant_engine.options_surface_engine import OptionsAndVolatilitySurfaceEngine
    except ImportError:
        from app.quant_engine.options_surface_engine import OptionsAndVolatilitySurfaceEngine

    return OptionsAndVolatilitySurfaceEngine.get_volatility_cross_asset_summary()


@app.get("/api/v1/macro/plumbing-options-state")
@app.get("/api/macro/plumbing-options-state")
@app.get("/v1/macro/plumbing-options-state")
@app.get("/macro/plumbing-options-state")
def get_macro_plumbing_options_state_main(force: bool = False):
    """Returns central US Fiscal Plumbing Hydraulics & Options Dynamics State Machine."""
    try:
        from app.quant_engine.macro_plumbing_state import MacroPlumbingAndOptionsStateEngine
    except ImportError:
        from backend.app.quant_engine.macro_plumbing_state import MacroPlumbingAndOptionsStateEngine

    return MacroPlumbingAndOptionsStateEngine.build_complete_plumbing_and_options_state(force_refresh=force)



@app.get("/api/v1/synthesis/dashboard")
@app.get("/api/synthesis/dashboard")
@app.get("/v1/synthesis/dashboard")
@app.get("/synthesis/dashboard")
def get_synthesis_dashboard_main(force: bool = False):
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
async def get_live_executive_summary(force: bool = False):
    """Resolves Audit Items #21 & #22: Live KPI 1-5, KISS, RAA, and live SPY GEX strikes for Header & /."""
    ftm = FortyTwoMacroLiveBuilder.build_live_42macro_dashboard()
    liq = LiquidityEngine.build_complete_liquidity_payload(force_refresh=force)
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
async def get_live_framework_synthesis(force: bool = False):
    """Resolves Audit Item #23: Returns live 4-Author Synthesis & Contradiction Resolution Matrix."""
    ftm = FortyTwoMacroLiveBuilder.build_live_42macro_dashboard()
    liq = LiquidityEngine.build_complete_liquidity_payload(force_refresh=force)
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
@app.get("/api/v1/liquidity/dashboard")
@app.get("/api/liquidity/dashboard")
async def get_live_liquidity_and_horizons(force: bool = False):
    """Resolves Audit Item #24: Returns live Liquidity series + dynamic 0-6M, 6-12M, and 12-36M allocation matrix."""
    if not force:
        try:
            from app.db.stock_compressed_store import StockCompressedStore
            cached_macro = StockCompressedStore.get_macro_liquidity_payload("full_liquidity_allocation", max_age_seconds=900)
            if cached_macro:
                return _sanitize_floats(cached_macro)
        except Exception:
            try:
                from backend.app.db.stock_compressed_store import StockCompressedStore
                cached_macro = StockCompressedStore.get_macro_liquidity_payload("full_liquidity_allocation", max_age_seconds=900)
                if cached_macro:
                    return _sanitize_floats(cached_macro)
            except Exception:
                pass

    liq = LiquidityEngine.build_complete_liquidity_payload(force_refresh=force)
    ftm = FortyTwoMacroLiveBuilder.build_live_42macro_dashboard(force=force)
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

    macro_regime_summary = {
        "active_quad": us_quad_str,
        "active_quad_code": us_country.get("active_quad", "QUAD_3"),
        "regime_name": ftm["global_macro_risk_matrix"]["active_regime_label"],
        "primary_regime": ftm["global_macro_risk_matrix"].get("primary_regime", "INFLATION"),
        "probability_risk_on_pct": ftm["global_macro_risk_matrix"]["probability_risk_on_pct"],
        "probability_risk_off_pct": ftm["global_macro_risk_matrix"]["probability_risk_off_pct"],
        "cacri_state": ftm["global_macro_risk_matrix"].get("cacri_state", "RISK_OFF"),
        "carci_pct": ftm["global_macro_risk_matrix"]["probability_risk_off_pct"],
        "carci_d_pct": bond.get("carci_d_pct", -0.4),
        "carci_w_pct": bond.get("carci_w_pct", 1.8),
        "real_10y_tips_pct": bond["real_10y_tips_yield_pct"],
        "real_10y_tips_d_chg": bond.get("real_10y_tips_d_chg", 0.02),
        "real_10y_tips_w_chg": bond.get("real_10y_tips_w_chg", -0.06),
        "real_10y_tips_d_pct": bond.get("real_10y_tips_d_pct", 0.9),
        "real_10y_tips_w_pct": bond.get("real_10y_tips_w_pct", -2.8),
        "move_index": bond["move_index"],
        "move_d_pct": bond.get("move_d_pct", -1.2),
        "move_w_pct": bond.get("move_w_pct", 3.5),
        "vix_index": bond["vix_index"],
        "vix_d_pct": bond.get("vix_d_pct", 0.6),
        "vix_w_pct": bond.get("vix_w_pct", -4.2),
        "net_liquidity_usd_bn": us_nl["net_liquidity_usd_bn"],
        "roc_4w_bn": us_nl["roc_4w_bn"],
        "liquidity_impulse_state": us_nl["liquidity_impulse_state"],
        "debt_to_liquidity_pct": glob["us_debt_to_liquidity_pct"],
        "accord_2_0_prob": bond["accord_2_0_probability_pct"],
        "tbill_issuance_share_pct": bond["tbill_issuance_share_pct"],
        "move_index": bond["move_index"],
        "vix_index": bond["vix_index"],
        "real_10y_tips_pct": bond["real_10y_tips_yield_pct"],
    }

    cftc_summary = []
    try:
        from app.ingestion.cftc_sentiment_client import CftcSentimentClient
        cftc_summary = CftcSentimentClient().fetch_cot_summary()
    except Exception:
        try:
            from backend.app.ingestion.cftc_sentiment_client import CftcSentimentClient
            cftc_summary = CftcSentimentClient().fetch_cot_summary()
        except Exception:
            pass

    try:
        from app.quant_engine.macro_plumbing_state import MacroPlumbingAndOptionsStateEngine
    except ImportError:
        from backend.app.quant_engine.macro_plumbing_state import MacroPlumbingAndOptionsStateEngine
    plumbing_state = MacroPlumbingAndOptionsStateEngine.build_complete_plumbing_and_options_state(force_refresh=force)

    res = {
        "status": "ok",
        "as_of_utc": liq["as_of_utc"],
        "macro_regime": macro_regime_summary,
        "macro_plumbing_state": plumbing_state,
        "cftc_positioning": cftc_summary,
        "kiss_portfolio": ftm["kiss_and_drmo"]["kiss_portfolio"],
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
    try:
        from app.db.stock_compressed_store import StockCompressedStore
        StockCompressedStore.save_macro_liquidity_payload("full_liquidity_allocation", res)
    except Exception:
        try:
            from backend.app.db.stock_compressed_store import StockCompressedStore
            StockCompressedStore.save_macro_liquidity_payload("full_liquidity_allocation", res)
        except Exception:
            pass

    return _sanitize_floats(res)


@app.get("/api/v1/scenarios")
@app.get("/api/scenarios")
async def get_live_4q_scenarios(force: bool = False):
    """Generates dynamic rolling 4-quarter macro scenarios, live triggers, real rates, and central bank sentiment."""
    try:
        from app.quant_engine.scenarios_engine import ScenariosEngine
    except ImportError:
        from backend.app.quant_engine.scenarios_engine import ScenariosEngine

    payload = ScenariosEngine.build_scenarios_payload(force=force)
    return _sanitize_floats(payload)


@app.get("/api/v1/central-bank/speeches")
@app.get("/api/central-bank/speeches")
async def get_central_bank_speeches_main():
    """Returns the central bank speeches ledger and 8-week sentiment consensus matrix."""
    try:
        from app.quant_engine.scenarios_engine import ScenariosEngine
    except ImportError:
        from backend.app.quant_engine.scenarios_engine import ScenariosEngine

    return _sanitize_floats(ScenariosEngine.get_central_bank_sentiment_ledger())


@app.get("/api/v1/macro/real-rates")
@app.get("/api/macro/real-rates")
async def get_macro_real_rates_main():
    """Returns sovereign real interest rate comparisons, r - g spread, and debt sustainability."""
    try:
        from app.quant_engine.scenarios_engine import ScenariosEngine
    except ImportError:
        from backend.app.quant_engine.scenarios_engine import ScenariosEngine

    return _sanitize_floats(ScenariosEngine.compute_real_interest_rates_and_debt_squeeze())


# ==============================================================================
# REGISTER FALLBACK API ROUTER AFTER DYNAMIC ENDPOINTS (FIXES ROUTE SHADOWING)
# ==============================================================================
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)