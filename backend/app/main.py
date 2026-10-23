import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import init_db
from app.api.routes import api_router

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
def health_check():
    """Health check endpoint for Render spin-up monitor and load balancers."""
    return {
        "status": "ok",
        "service": "MacroPulse Alpha Quant Engine",
        "environment": os.getenv("ENVIRONMENT", settings.ENVIRONMENT),
    }


@app.get("/api/v1/etf/fcte-holdings")
@app.get("/v1/etf/fcte-holdings")
def get_fcte_holdings_direct():
    from app.ingestion.etf_holdings_client import fetch_fcte_holdings
    return fetch_fcte_holdings().to_dict()


@app.get("/api/v1/42macro/dashboard")
@app.get("/api/42macro/dashboard")
def get_42_macro_dashboard():
    """Returns the complete 42 Macro institutional suite with a Plain-English Executive Summary."""
    try:
        from backend.app.quant_engine.forty_two_macro_engine import FortyTwoMacroEngine
    except ImportError:
        from app.quant_engine.forty_two_macro_engine import FortyTwoMacroEngine
    return FortyTwoMacroEngine.get_complete_dashboard_payload()


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
def get_refresh_status():
    """Returns current status and stage of the refresh pipeline."""
    return refresh_orchestrator.get_status()


@app.get("/api/v1/refresh/diff")
@app.get("/api/refresh/diff")
def get_refresh_diff():
    """Returns the latest 'What Changed Since Last Refresh' diff report."""
    return refresh_orchestrator.get_diff()


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)