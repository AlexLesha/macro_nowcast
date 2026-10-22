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


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)