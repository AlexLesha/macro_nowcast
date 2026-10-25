import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
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

# Register API router
app.include_router(api_router)


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
    """Returns the complete, schema-validated 42 Macro institutional suite for /42-macro."""
    try:
        from backend.app.quant_engine.forty_two_macro_engine import FortyTwoMacroEngine
    except ImportError:
        from app.quant_engine.forty_two_macro_engine import FortyTwoMacroEngine

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


@app.get("/api/v1/stock/xray/{ticker}")
@app.get("/api/stock/xray/{ticker}")
async def get_single_stock_xray(
    ticker: str,
    regime: str = "REFLATION",
    quad: str = "Quad 2"
):
    """Runs the 5-Pillar Single-Stock Macro-Fundamental X-Ray for any stock ticker."""
    try:
        from backend.app.quant_engine.stock_analyzer import SingleStockXRayEngine
    except ImportError:
        from app.quant_engine.stock_analyzer import SingleStockXRayEngine
    try:
        return SingleStockXRayEngine.analyze_ticker(
            ticker=ticker,
            active_market_regime=regime,
            active_economic_quad=quad
        )
    except Exception as e:
        return {"status": "error", "ticker": ticker.upper(), "message": str(e)}


@app.get("/api/v1/commodities-alternatives/dashboard")
@app.get("/api/commodities-alternatives/dashboard")
async def get_commodities_alternatives_dashboard():
    """Returns Structures #1, #2, and #3 for the /commodities-alternatives sub-page."""
    try:
        from backend.app.quant_engine.commodities_engine import CommoditiesAndAlternativesEngine
    except ImportError:
        from app.quant_engine.commodities_engine import CommoditiesAndAlternativesEngine

    s1 = CommoditiesAndAlternativesEngine.compute_structure_1_term_structure(sofr_rate_pct=3.62)
    s2 = await CommoditiesAndAlternativesEngine.compute_structure_2_shadow_plumbing()
    s3 = CommoditiesAndAlternativesEngine.compute_structure_3_capex_depletion_clock()

    return {
        "status": "ok",
        "as_of_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "executive_summary": {
            "headline": "Physical Scarcity + Shadow Liquidity Expansion Favor Backwardated Energy ($USO/$TPL), Copper ($COPX), and Prime-Coin/Gold Dip Accumulation",
            "top_actionable_calls": [
                "IMMEDIATE (1-3M): Long Backwardated Energy ($USO, $PDBC, $TPL) harvesting +11.1% rate-adjusted convenience yield; avoid $UNG contango bleed and express NatGas via $EQT/$WMB.",
                "SHADOW PLUMBING (1-3M to 12M): Cayman Basis Trade repo stress is calm (SOFR - IORB = -3 bps, MOVE = 73), supporting Risk-On carry ($CLOZ, $SPHB). Watch $FBTC/$IBIT at its $64.2k STH Realized Price floor with washed-out 22 RSI for a VAMS pivot.",
                "STRUCTURAL CAPEX CLOCK (12M to 3Y+): Gold/Oil ratio at 56.9x (vs 16.5x historical norm) and Capex/DD&A < 0.85x in Uranium ($CCJ/$SRUUF) and Copper ($COPX/$FCX) signal a generational catch-up in physical resource producers.",
            ],
        },
        "structure_1_term_structure": s1,
        "structure_2_shadow_plumbing": s2,
        "structure_3_capex_clock": s3,
    }


@app.get("/api/v1/outliers/multi-horizon")
@app.get("/api/outliers/multi-horizon")
def get_multi_horizon_outliers():
    """Returns the Multi-Horizon Actionable Idea Scanner dataset across 1-3M, 12M, and 3Y+ horizons."""
    try:
        from backend.app.quant_engine.options_outliers import get_multi_horizon_actionable_ideas
    except ImportError:
        from app.quant_engine.options_outliers import get_multi_horizon_actionable_ideas

    return get_multi_horizon_actionable_ideas()


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
async def trigger_refresh():
    """Triggers the refresh pipeline in background and returns immediate status."""
    return refresh_orchestrator.trigger()


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


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)