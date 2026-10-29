"""
Stock Fundamentals & 77 GICS Peer Scorecard Cache Manager (SQLite / Cloudflare D1 Ready)
========================================================================================
Implements a 7-Day Time-To-Live (TTL) cache for:
  1. Single-Stock Fundamental & Solvency Metrics (Cash, Debt, FCF, Margins, ROE, Multiples)
  2. 77 GICS Industry Peer Valuation Scorecards (5 benchmark peers per industry)
  3. 12-Quarter Historical Financial Walks (SEC EDGAR / Polygon Financial Time Series)

Why 7-Day TTL?
--------------
Quarterly 10-Q/10-K balance sheet and income statement items change once every 90 days,
and valuation multiples shift slowly over weekly horizons. Caching for 7 days (604,800s)
eliminates external API latency (<15ms response time) and prevents Finnhub/Polygon rate-limit
exhaustion when evaluating dozens of industry peers.
"""

import json
import os
import sqlite3
import time
from typing import Any, Dict, List, Optional

CACHE_TTL_DAYS = 7
CACHE_TTL_SECONDS = CACHE_TTL_DAYS * 86400  # 604,800 seconds

DEFAULT_DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "stock_fundamentals_cache.db"
)


class StockFundamentalsCacheManager:
    """
    SQLite-backed (and Cloudflare D1 schema-compatible) persistence layer for
    single-stock fundamentals and 77 GICS industry peer scorecards.
    """

    def __init__(self, db_path: str = DEFAULT_DB_PATH):
        self.db_path = db_path
        self.init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self) -> None:
        """Creates the 3 caching tables if they do not already exist."""
        with self._get_conn() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS stock_fundamentals_cache (
                    ticker TEXT PRIMARY KEY,
                    gics_industry TEXT NOT NULL,
                    company_name TEXT,
                    price REAL,
                    market_cap_bn REAL,
                    enterprise_value_bn REAL,
                    pe_ratio REAL,
                    ev_ebitda REAL,
                    fcf_yield_pct REAL,
                    cash_m REAL,
                    debt_m REAL,
                    net_cash_m REAL,
                    net_debt_to_ebitda REAL,
                    interest_coverage_x REAL,
                    rev_growth_yoy_pct REAL,
                    gross_margin_pct REAL,
                    operating_margin_pct REAL,
                    roe_pct REAL,
                    roic_pct REAL,
                    beta REAL,
                    raw_payload_json TEXT,
                    updated_at INTEGER NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_stock_fund_industry
                ON stock_fundamentals_cache(gics_industry);

                CREATE INDEX IF NOT EXISTS idx_stock_fund_updated
                ON stock_fundamentals_cache(updated_at);

                CREATE TABLE IF NOT EXISTS industry_peer_scorecard_cache (
                    gics_industry TEXT PRIMARY KEY,
                    peer_tickers_json TEXT NOT NULL,
                    scorecard_payload_json TEXT NOT NULL,
                    updated_at INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS stock_12q_walk_cache (
                    ticker TEXT PRIMARY KEY,
                    quarters_payload_json TEXT NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                """
            )
            conn.commit()

    def is_fresh(self, updated_at: int, ttl_seconds: int = CACHE_TTL_SECONDS) -> bool:
        """Returns True if the cached record is younger than 7 days."""
        return (int(time.time()) - int(updated_at)) < ttl_seconds

    # ------------------------------------------------------------------
    # 1. Single-Stock Fundamental & Solvency Cache
    # ------------------------------------------------------------------
    def get_fundamentals(
        self, ticker: str, allow_stale: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Fetches a stock's cached fundamentals if fresh (< 7 days old).
        If allow_stale=True, returns expired data as a fallback if live APIs fail.
        """
        ticker = ticker.upper().strip()
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT * FROM stock_fundamentals_cache WHERE ticker = ?", (ticker,)
            ).fetchone()
            if not row:
                return None
            if not allow_stale and not self.is_fresh(row["updated_at"]):
                return None
            try:
                payload = json.loads(row["raw_payload_json"] or "{}")
                payload["_cached_at"] = row["updated_at"]
                payload["_cache_age_hours"] = round(
                    (time.time() - row["updated_at"]) / 3600.0, 1
                )
                return payload
            except Exception:
                return None

    def save_fundamentals(
        self, ticker: str, gics_industry: str, data: Dict[str, Any]
    ) -> None:
        """Upserts a stock's fundamental & solvency snapshot with current epoch timestamp."""
        ticker = ticker.upper().strip()
        now = int(time.time())
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT INTO stock_fundamentals_cache (
                    ticker, gics_industry, company_name, price, market_cap_bn,
                    enterprise_value_bn, pe_ratio, ev_ebitda, fcf_yield_pct,
                    cash_m, debt_m, net_cash_m, net_debt_to_ebitda, interest_coverage_x,
                    rev_growth_yoy_pct, gross_margin_pct, operating_margin_pct,
                    roe_pct, roic_pct, beta, raw_payload_json, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
                ON CONFLICT(ticker) DO UPDATE SET
                    gics_industry = excluded.gics_industry,
                    company_name = excluded.company_name,
                    price = excluded.price,
                    market_cap_bn = excluded.market_cap_bn,
                    enterprise_value_bn = excluded.enterprise_value_bn,
                    pe_ratio = excluded.pe_ratio,
                    ev_ebitda = excluded.ev_ebitda,
                    fcf_yield_pct = excluded.fcf_yield_pct,
                    cash_m = excluded.cash_m,
                    debt_m = excluded.debt_m,
                    net_cash_m = excluded.net_cash_m,
                    net_debt_to_ebitda = excluded.net_debt_to_ebitda,
                    interest_coverage_x = excluded.interest_coverage_x,
                    rev_growth_yoy_pct = excluded.rev_growth_yoy_pct,
                    gross_margin_pct = excluded.gross_margin_pct,
                    operating_margin_pct = excluded.operating_margin_pct,
                    roe_pct = excluded.roe_pct,
                    roic_pct = excluded.roic_pct,
                    beta = excluded.beta,
                    raw_payload_json = excluded.raw_payload_json,
                    updated_at = excluded.updated_at
                """,
                (
                    ticker,
                    gics_industry,
                    data.get("name", ticker),
                    float(data.get("price", 0.0)),
                    float(data.get("market_cap_bn", 0.0)),
                    float(data.get("enterprise_value_bn", 0.0)),
                    float(data.get("pe", 0.0)),
                    float(data.get("ev_ebitda", 0.0)),
                    float(data.get("fcf_yield", 0.0)),
                    float(data.get("cash_m", 0.0)),
                    float(data.get("debt_m", 0.0)),
                    float(data.get("net_cash_m", 0.0)),
                    float(data.get("net_debt_ebitda", 0.0)),
                    float(data.get("interest_coverage", 0.0)),
                    float(data.get("rev_growth_yoy", 0.0)),
                    float(data.get("gross_margin", 0.0)),
                    float(data.get("operating_margin", 0.0)),
                    float(data.get("roe", 0.0)),
                    float(data.get("roic", 0.0)),
                    float(data.get("beta", 1.0)),
                    json.dumps(data),
                    now,
                ),
            )
            conn.commit()

    # ------------------------------------------------------------------
    # 2. 77 GICS Industry Peer Scorecard Cache
    # ------------------------------------------------------------------
    def get_peer_scorecard(
        self, gics_industry: str, allow_stale: bool = False
    ) -> Optional[List[Dict[str, Any]]]:
        """Returns the cached 5-peer valuation table for a GICS industry if < 7 days old."""
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT * FROM industry_peer_scorecard_cache WHERE gics_industry = ?",
                (gics_industry,),
            ).fetchone()
            if not row:
                return None
            if not allow_stale and not self.is_fresh(row["updated_at"]):
                return None
            try:
                return json.loads(row["scorecard_payload_json"])
            except Exception:
                return None

    def save_peer_scorecard(
        self, gics_industry: str, peers: List[Dict[str, Any]]
    ) -> None:
        """Caches the 5-peer valuation scorecard for a GICS industry for 7 days."""
        now = int(time.time())
        peer_tickers = [p.get("ticker", "") for p in peers]
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT INTO industry_peer_scorecard_cache (
                    gics_industry, peer_tickers_json, scorecard_payload_json, updated_at
                ) VALUES (?, ?, ?, ?)
                ON CONFLICT(gics_industry) DO UPDATE SET
                    peer_tickers_json = excluded.peer_tickers_json,
                    scorecard_payload_json = excluded.scorecard_payload_json,
                    updated_at = excluded.updated_at
                """,
                (
                    gics_industry,
                    json.dumps(peer_tickers),
                    json.dumps(peers),
                    now,
                ),
            )
            conn.commit()

    # ------------------------------------------------------------------
    # 3. 12-Quarter Historical Financial Walk Cache
    # ------------------------------------------------------------------
    def get_12q_walk(
        self, ticker: str, allow_stale: bool = False
    ) -> Optional[List[Dict[str, Any]]]:
        """Returns the cached 12-quarter financial walk for a ticker if < 7 days old."""
        ticker = ticker.upper().strip()
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT * FROM stock_12q_walk_cache WHERE ticker = ?",
                (ticker,),
            ).fetchone()
            if not row:
                return None
            if not allow_stale and not self.is_fresh(row["updated_at"]):
                return None
            try:
                return json.loads(row["quarters_payload_json"])
            except Exception:
                return None

    def save_12q_walk(
        self, ticker: str, quarters: List[Dict[str, Any]]
    ) -> None:
        """Caches the 12-quarter financial walk for a ticker for 7 days."""
        ticker = ticker.upper().strip()
        now = int(time.time())
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT INTO stock_12q_walk_cache (
                    ticker, quarters_payload_json, updated_at
                ) VALUES (?, ?, ?)
                ON CONFLICT(ticker) DO UPDATE SET
                    quarters_payload_json = excluded.quarters_payload_json,
                    updated_at = excluded.updated_at
                """,
                (
                    ticker,
                    json.dumps(quarters),
                    now,
                ),
            )
            conn.commit()

    # ------------------------------------------------------------------
    # 4. Weekly Stale Scan Helper (for Cron / Background Refresh)
    # ------------------------------------------------------------------
    def get_stale_tickers(self) -> List[str]:
        """Returns a list of all cached tickers whose data is older than 7 days."""
        cutoff = int(time.time()) - CACHE_TTL_SECONDS
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT ticker FROM stock_fundamentals_cache WHERE updated_at < ?",
                (cutoff,),
            ).fetchall()
            return [r["ticker"] for r in rows]

