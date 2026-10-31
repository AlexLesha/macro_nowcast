"""
backend/app/config.py
Centralized API Key Registry & Multi-Provider Data Failover Hub for MacroPulse Alpha.
Includes registered institutional keys for FRED, Finnhub, Tiingo, Polygon, Groq (Llama 3.3 70B), Gemini, CoinGecko, and EIA.
"""

import os
import io
import time
from pathlib import Path
from dotenv import load_dotenv
import httpx
import numpy as np
import pandas as pd
import yfinance as yf
from typing import Dict, Any, List, Optional, Tuple

# Automatically discover and load .env file from backend/ or parent repo root
BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
_env_path = BASE_DIR / ".env"
if not _env_path.exists():
    _env_path = BASE_DIR.parent / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)

_default_sqlite = f"sqlite:///{(BASE_DIR / 'macro_pulse.db').as_posix()}"
_raw_db_url = os.getenv("DATABASE_URL", _default_sqlite)
if _raw_db_url.startswith("sqlite:///."):
    _db_filename = _raw_db_url.split("/")[-1]
    if "macro_nowcast.db" in _db_filename:
        _db_filename = "macro_pulse.db"
    _resolved_db_url = f"sqlite:///{(BASE_DIR / _db_filename).as_posix()}"
else:
    _resolved_db_url = _raw_db_url


class Settings:
    PROJECT_NAME: str = "MacroPulse Alpha"
    VERSION: str = "3.0.0"
    APP_NAME: str = "MacroPulse Alpha Engine"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = True
    PORT: int = int(os.getenv("PORT", "8000"))

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://macro-nowcast.pages.dev",
        "https://macro-nowcast-wdw2.onrender.com",
    ]

    # 1. Registered Institutional & Cloud API Keys (Loaded from .env / Environment)
    FRED_API_KEY: str = (os.getenv("FRED_API_KEY") or "").strip()
    FINNHUB_API_KEY: str = (os.getenv("FINNHUB_API_KEY") or "").strip()
    TIINGO_API_KEY: str = (os.getenv("TIINGO_API_KEY") or "").strip()
    POLYGON_API_KEY: str = (os.getenv("POLYGON_API_KEY") or "").strip()
    MASSIVE_API_KEY: str = (
        os.getenv("MASSIVE_API_KEY")
        or os.getenv("POLYGON_API_KEY")
        or ""
    ).strip()
    GROQ_API_KEY: str = (os.getenv("GROQ_API_KEY") or "").strip()
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    GEMINI_API_KEY: str = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("OPENAI_OR_GEMINI_API_KEY")
        or ""
    ).strip()
    LLM_API_KEY: str = GROQ_API_KEY or GEMINI_API_KEY
    COINGECKO_API_KEY: str = (os.getenv("COINGECKO_API_KEY") or "").strip()
    EIA_API_KEY: str = (os.getenv("EIA_API_KEY") or "").strip()

    DATABASE_URL: str = _resolved_db_url
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Key FRED series list
    FRED_SERIES: List[str] = [
        "GDPC1", "GDP", "PCEC96", "CPIAUCSL", "CPILFESL", "CUSR0000SAH1",
        "CORESTICKM159SFRBATL", "CES2023610001", "UNDCONTSA", "ICSA", "JTSJOL",
        "WALCL", "WTREGEN", "RRPONTSYD", "WRESBAL", "M2SL", "GFDEBTN", "IIPUSNETIQ",
        "DGS2", "DGS10", "DFII10", "BAMLC0A0CM", "BAMLH0A0HYM2", "BAMLH0A3HYC", "DCOILBRENTEU"
    ]

    CORE_TICKERS: List[str] = [
        "SPY", "QQQ", "IWM", "TLT", "IEF", "SHY", "HYG", "LQD",
        "GLD", "SLV", "USO", "UUP", "FXE", "VIXY", "XLE", "XLF",
        "XLK", "XLV", "XLI", "XLP", "XLU", "XLY", "XLC", "XLB", "VNQ"
    ]

    OPTIONS_TICKERS: List[str] = ["SPY", "QQQ", "IWM", "AAPL", "NVDA", "MSFT", "TSLA"]


settings = Settings()

# In-memory TTL caches to prevent redundant external calls within the same 10-15 minute window
_FRED_SERIES_CACHE: Dict[str, Dict[str, Any]] = {}
_OHLCV_BATCH_CACHE: Dict[str, Dict[str, Any]] = {}


def fetch_fred_series_live(series_id: str, limit: int = 400, ttl_sec: int = 900) -> pd.Series:
    """
    Fetches a FRED time series using the registered FRED_API_KEY JSON endpoint first,
    with automatic fallback to the keyless fredgraph.csv endpoint.
    Returns a clean pd.Series indexed by pd.DatetimeIndex.
    """
    now = time.time()
    cached = _FRED_SERIES_CACHE.get(series_id)
    if cached and (now - cached["ts"]) < ttl_sec:
        return cached["series"]

    # Primary: Official FRED JSON API (120 req/min with FRED_API_KEY)
    if settings.FRED_API_KEY:
        url = (
            "https://api.stlouisfed.org/fred/series/observations"
            f"?series_id={series_id}&api_key={settings.FRED_API_KEY}&file_type=json"
            f"&sort_order=desc&limit={limit}"
        )
        try:
            with httpx.Client(timeout=6.0) as client:
                r = client.get(url)
                if r.status_code == 200:
                    obs = r.json().get("observations", [])
                    records = []
                    for item in obs:
                        val_str = item.get("value", ".")
                        if val_str not in (".", "", None):
                            try:
                                records.append((pd.to_datetime(item["date"]), float(val_str)))
                            except Exception:
                                continue
                    if records:
                        records.sort(key=lambda x: x[0])
                        s = pd.Series(
                            [x[1] for x in records],
                            index=pd.DatetimeIndex([x[0] for x in records]),
                            name=series_id,
                        )
                        _FRED_SERIES_CACHE[series_id] = {"ts": now, "series": s}
                        return s
        except Exception:
            pass

    # Fallback: Public FRED CSV
    csv_url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}"
    try:
        with httpx.Client(timeout=6.0) as client:
            r = client.get(csv_url)
            if r.status_code == 200:
                df = pd.read_csv(io.StringIO(r.text))
                date_col = "DATE" if "DATE" in df.columns else df.columns[0]
                val_col = series_id if series_id in df.columns else df.columns[1]
                df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
                df[val_col] = pd.to_numeric(df[val_col], errors="coerce")
                df = df.dropna(subset=[date_col, val_col]).sort_values(date_col).tail(limit)
                s = pd.Series(df[val_col].values, index=pd.DatetimeIndex(df[date_col]), name=series_id)
                _FRED_SERIES_CACHE[series_id] = {"ts": now, "series": s}
                return s
    except Exception:
        pass

    return pd.Series(dtype=float, name=series_id)


def fetch_massive_stock_financials(ticker: str) -> List[Dict[str, Any]]:
    """
    Unified individual stock financial details fetcher:
      Data Scope: https://api.massive.com/stocks/financials/v1/income-statements
      (revenue, operating_income, cost_of_revenue, diluted_earnings_per_share)
      with automatic SEC EDGAR XBRL fallback (`SingleStockXRayEngine.fetch_sec_edgar_xbrl_facts`).
    Replaces legacy Finnhub, Polygon, and Tiingo single-stock financial calls.
    """
    try:
        try:
            from backend.app.quant_engine.stock_analyzer import SingleStockXRayEngine
        except ImportError:
            from app.quant_engine.stock_analyzer import SingleStockXRayEngine
        return SingleStockXRayEngine.fetch_massive_income_statements(ticker, limit=12)
    except Exception:
        return []


def fetch_tiingo_single_ticker(ticker: str, start_date: str = "2024-01-01") -> pd.DataFrame:
    """Routes single-ticker failover through Massive REST (`https://api.massive.com/v2/aggs/...`) instead of legacy Tiingo."""
    return fetch_polygon_single_ticker(ticker, start_date=start_date)


def fetch_polygon_single_ticker(ticker: str, start_date: str = "2024-01-01") -> pd.DataFrame:
    """Fetches daily aggregate bars from Massive REST API (`https://api.massive.com/v2/aggs/...`) with Bearer authentication."""
    bearer_key = (settings.MASSIVE_API_KEY or settings.POLYGON_API_KEY or "").strip()
    if not bearer_key or ticker.startswith("^") or "=" in ticker:
        return pd.DataFrame()
    end_date = pd.Timestamp.utcnow().strftime("%Y-%m-%d")
    url = (
        f"https://api.massive.com/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"
        f"?adjusted=true&sort=asc&limit=500"
    )
    headers = {"Authorization": f"Bearer {bearer_key}", "Accept": "application/json"}
    try:
        with httpx.Client(headers=headers, timeout=5.0) as client:
            r = client.get(url)
            if r.status_code == 200:
                results = r.json().get("results", [])
                if results:
                    df = pd.DataFrame(results)
                    df["date"] = pd.to_datetime(df["t"], unit="ms")
                    df = df.set_index("date").sort_index()
                    df["Close"] = df["c"]
                    df["Volume"] = df.get("v", 0)
                    return df[["Close", "Volume"]]
    except Exception:
        pass
    return pd.DataFrame()


def fetch_ohlcv_Slot_with_failover(
    tickers: List[str], period: str = "1y", ttl_sec: int = 600
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Downloads Close and Volume DataFrames for a list of tickers using yfinance batch first,
    and automatically fills any missing/rate-limited equity/ETF columns via Tiingo -> Polygon.
    """
    key = f"{','.join(sorted(set(tickers)))}_{period}"
    now = time.time()
    cached = _OHLCV_BATCH_CACHE.get(key)
    if cached and (now - cached["ts"]) < ttl_sec:
        return cached["close"], cached["volume"]

    close_df = pd.DataFrame()
    vol_df = pd.DataFrame()
    unique_tks = list(dict.fromkeys(tickers))

    try:
        raw = yf.download(unique_tks, period=period, interval="1d", progress=False, auto_adjust=True)
        if isinstance(raw.columns, pd.MultiIndex):
            if "Close" in raw.columns.levels[0]:
                close_df = raw["Close"].copy()
            elif "Adj Close" in raw.columns.levels[0]:
                close_df = raw["Adj Close"].copy()
            if "Volume" in raw.columns.levels[0]:
                vol_df = raw["Volume"].copy()
        elif not raw.empty:
            tk0 = unique_tks[0]
            close_df = pd.DataFrame({tk0: raw["Close"]})
            vol_df = pd.DataFrame({tk0: raw.get("Volume", pd.Series(dtype=float))})
    except Exception:
        pass

    # Failover check: fill any missing equity/ETF tickers via Tiingo or Polygon
    for tk in unique_tks:
        if tk not in close_df.columns or close_df[tk].dropna().empty:
            t_df = fetch_tiingo_single_ticker(tk)
            if t_df.empty:
                t_df = fetch_polygon_single_ticker(tk)
            if not t_df.empty:
                close_df[tk] = t_df["Close"]
                vol_df[tk] = t_df["Volume"]

    _OHLCV_BATCH_CACHE[key] = {"ts": now, "close": close_df, "volume": vol_df}
    return close_df, vol_df


# Convenient alias for fetch_ohlcv_Slot_with_failover
fetch_ohlcv_with_failover = fetch_ohlcv_Slot_with_failover


def fetch_live_coingecko_prices() -> Dict[str, float]:
    """Fetches live Bitcoin and Ethereum USD spot prices from CoinGecko with keyless fallback."""
    headers = (
        {"x-cg-demo-api-key": settings.COINGECKO_API_KEY, "Accept": "application/json"}
        if settings.COINGECKO_API_KEY
        else {"Accept": "application/json"}
    )
    url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
    out = {"btc": 0.0, "eth": 0.0}
    try:
        with httpx.Client(timeout=4.5) as client:
            r = client.get(url, headers=headers)
            if r.status_code != 200:
                r = client.get(url)
            if r.status_code == 200:
                js = r.json()
                out["btc"] = float(js.get("bitcoin", {}).get("usd", 0.0) or 0.0)
                out["eth"] = float(js.get("ethereum", {}).get("usd", 0.0) or 0.0)
    except Exception:
        pass
    return out
