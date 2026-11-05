"""
backend/app/db/stock_compressed_store.py
=========================================
Production Technique 4:
Compressed 12-Quarter XBRL and Fundamental Cache Store using JSONB/Text Blobs.
Allows full 12-quarter statements and peer scorecards to be read in a single primary key lookup (<10ms).
Supports PostgreSQL (Neon) and SQLite with automatic DSN normalization.
"""

import os
import json
import time
import sqlite3
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

try:
    from app.config import settings
    _DB_URL = settings.DATABASE_URL
except ImportError:
    _DB_URL = os.getenv("DATABASE_URL", "sqlite:///./macro_pulse.db")

logger = logging.getLogger("macropulse.stock_compressed_store")


def _get_pg_dsn(url: str) -> str:
    """Normalizes SQLAlchemy connection URL for native psycopg2.connect()."""
    dsn = url
    if dsn.startswith("postgresql+psycopg2://"):
        dsn = dsn.replace("postgresql+psycopg2://", "postgresql://", 1)
    elif dsn.startswith("postgres://"):
        dsn = dsn.replace("postgres://", "postgresql://", 1)
    return dsn


class StockCompressedStore:
    """High-speed storage engine for compressed 12-quarter XBRL walks and fundamentals."""

    @classmethod
    def get_db_url(cls) -> str:
        try:
            from app.config import settings
            return settings.DATABASE_URL
        except Exception:
            return _DB_URL

    @classmethod
    def init_tables(cls):
        """Initializes tables for single-key compressed lookups in Postgres or SQLite."""
        db_url = cls.get_db_url()
        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                conn = psycopg2.connect(dsn)
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS stock_payload_cache (
                        ticker VARCHAR(20) PRIMARY KEY,
                        gics_industry VARCHAR(150),
                        header_strip_json TEXT NOT NULL,
                        solvency_matrix_json TEXT NOT NULL,
                        hedgeye_pods_json TEXT NOT NULL,
                        historical_12q_json TEXT NOT NULL,
                        options_surface_json TEXT NOT NULL,
                        forensic_dossier_json TEXT NOT NULL,
                        full_payload_json TEXT,
                        is_earnings_season BOOLEAN DEFAULT FALSE,
                        last_earnings_date VARCHAR(30),
                        next_earnings_date VARCHAR(30),
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS sector_llm_cache (
                        gics_industry VARCHAR(150) PRIMARY KEY,
                        moat_analysis_json TEXT NOT NULL,
                        regulatory_trends_json TEXT NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS stock_12q_walk_cache (
                        ticker VARCHAR(32) PRIMARY KEY,
                        quarters_payload_json TEXT NOT NULL,
                        updated_at BIGINT NOT NULL
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS stock_daily_news_cache (
                        ticker VARCHAR(32) NOT NULL,
                        date DATE NOT NULL,
                        day_name VARCHAR(16),
                        price_action_json TEXT,
                        bullet_points_json TEXT,
                        tags_json TEXT,
                        catalyst_type VARCHAR(32),
                        sentiment VARCHAR(16),
                        articles_count INTEGER DEFAULT 0,
                        source VARCHAR(64),
                        updated_at BIGINT NOT NULL,
                        PRIMARY KEY (ticker, date)
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS sec_company_metadata (
                        ticker VARCHAR(32) PRIMARY KEY,
                        cik10 VARCHAR(10) NOT NULL,
                        entity_name VARCHAR(256),
                        sic_code VARCHAR(16),
                        sic_description VARCHAR(256),
                        gics_sector VARCHAR(128),
                        gics_industry VARCHAR(128),
                        updated_at BIGINT NOT NULL
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS options_microstructure (
                        ticker VARCHAR(32) NOT NULL,
                        date DATE NOT NULL,
                        total_gex DOUBLE PRECISION,
                        zero_dte_heat_ratio DOUBLE PRECISION,
                        gamma_flip_level DOUBLE PRECISION,
                        call_wall DOUBLE PRECISION,
                        put_wall DOUBLE PRECISION,
                        skew_25d DOUBLE PRECISION,
                        put_call_vol_ratio DOUBLE PRECISION,
                        crowding_z DOUBLE PRECISION,
                        PRIMARY KEY (ticker, date)
                    );
                    CREATE TABLE IF NOT EXISTS macro_liquidity_cache (
                        cache_key VARCHAR(64) PRIMARY KEY,
                        payload_json TEXT NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
                    );
                """)
                conn.commit()
                cursor.close()
                conn.close()
                logger.info("[StockCompressedStore] Postgres tables verified on Neon (OPT-1 through OPT-5).")
            except Exception as e:
                logger.warning(f"[StockCompressedStore] Postgres init note: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else ".", exist_ok=True)
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS stock_payload_cache (
                        ticker TEXT PRIMARY KEY,
                        gics_industry TEXT,
                        header_strip_json TEXT NOT NULL,
                        solvency_matrix_json TEXT NOT NULL,
                        hedgeye_pods_json TEXT NOT NULL,
                        historical_12q_json TEXT NOT NULL,
                        options_surface_json TEXT NOT NULL,
                        forensic_dossier_json TEXT NOT NULL,
                        full_payload_json TEXT,
                        is_earnings_season INTEGER DEFAULT 0,
                        last_earnings_date TEXT,
                        next_earnings_date TEXT,
                        updated_at TEXT NOT NULL
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS sector_llm_cache (
                        gics_industry TEXT PRIMARY KEY,
                        moat_analysis_json TEXT NOT NULL,
                        regulatory_trends_json TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS stock_12q_walk_cache (
                        ticker TEXT PRIMARY KEY,
                        quarters_payload_json TEXT NOT NULL,
                        updated_at INTEGER NOT NULL
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS stock_daily_news_cache (
                        ticker TEXT NOT NULL,
                        date TEXT NOT NULL,
                        day_name TEXT,
                        price_action_json TEXT,
                        bullet_points_json TEXT,
                        tags_json TEXT,
                        catalyst_type TEXT,
                        sentiment TEXT,
                        articles_count INTEGER DEFAULT 0,
                        source TEXT,
                        updated_at INTEGER NOT NULL,
                        PRIMARY KEY (ticker, date)
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS sec_company_metadata (
                        ticker TEXT PRIMARY KEY,
                        cik10 TEXT NOT NULL,
                        entity_name TEXT,
                        sic_code TEXT,
                        sic_description TEXT,
                        gics_sector TEXT,
                        gics_industry TEXT,
                        updated_at INTEGER NOT NULL
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS options_microstructure (
                        ticker TEXT NOT NULL,
                        date TEXT NOT NULL,
                        total_gex REAL,
                        zero_dte_heat_ratio REAL,
                        gamma_flip_level REAL,
                        call_wall REAL,
                        put_wall REAL,
                        skew_25d REAL,
                        put_call_vol_ratio REAL,
                        crowding_z REAL,
                        PRIMARY KEY (ticker, date)
                    );
                    CREATE TABLE IF NOT EXISTS macro_liquidity_cache (
                        cache_key TEXT PRIMARY KEY,
                        payload_json TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                """)
                conn.commit()
                logger.info("[StockCompressedStore] SQLite tables verified (OPT-1 through OPT-5).")

    @classmethod
    def get_stock_payload(cls, ticker: str, max_age_days: int = 7) -> Optional[Dict[str, Any]]:
        """Returns the pre-computed full dossier in <10ms."""
        clean_t = ticker.strip().upper()
        db_url = cls.get_db_url()

        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                conn = psycopg2.connect(dsn)
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT header_strip_json, solvency_matrix_json, hedgeye_pods_json,
                           historical_12q_json, options_surface_json, forensic_dossier_json,
                           full_payload_json, is_earnings_season, updated_at, gics_industry
                    FROM stock_payload_cache WHERE ticker = %s;
                """, (clean_t,))
                row = cursor.fetchone()
                cursor.close()
                conn.close()
                if row:
                    return cls._format_payload(row, clean_t, max_age_days)
            except Exception as e:
                logger.debug(f"[StockCompressedStore] Postgres read error for {clean_t}: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            if not os.path.exists(db_path):
                return None
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT header_strip_json, solvency_matrix_json, hedgeye_pods_json,
                               historical_12q_json, options_surface_json, forensic_dossier_json,
                               full_payload_json, is_earnings_season, updated_at, gics_industry
                        FROM stock_payload_cache WHERE ticker = ?;
                    """, (clean_t,))
                    row = cursor.fetchone()
                    if row:
                        return cls._format_payload(row, clean_t, max_age_days)
            except Exception as e:
                logger.debug(f"[StockCompressedStore] SQLite read error for {clean_t}: {e}")
        return None

    @classmethod
    def save_stock_payload(
        cls,
        ticker: str,
        gics_industry: str,
        payload: Dict[str, Any],
        is_earnings_season: bool = False,
    ):
        """Stores the full analysis into the compressed cache."""
        clean_t = ticker.strip().upper()
        now_dt = datetime.now(timezone.utc)
        now_str = now_dt.isoformat()

        h_json = json.dumps(payload.get("header_strip") or payload.get("header_metrics") or {})
        s_json = json.dumps(payload.get("solvency_matrix") or {})
        p_json = json.dumps(payload.get("hedgeye_3_pods") or payload.get("hedgeye_pods") or {})
        hist_json = json.dumps(payload.get("historical_12q") or payload.get("financial_walk_12q") or [])
        opt_json = json.dumps(payload.get("options_surface") or {})
        dos_json = json.dumps(payload.get("forensic_dossier") or payload.get("groq_dossier") or {})
        full_json = json.dumps(payload)

        db_url = cls.get_db_url()
        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                conn = psycopg2.connect(dsn)
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO stock_payload_cache (
                        ticker, gics_industry, header_strip_json, solvency_matrix_json,
                        hedgeye_pods_json, historical_12q_json, options_surface_json,
                        forensic_dossier_json, full_payload_json, is_earnings_season, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ticker) DO UPDATE SET
                        gics_industry = EXCLUDED.gics_industry,
                        header_strip_json = EXCLUDED.header_strip_json,
                        solvency_matrix_json = EXCLUDED.solvency_matrix_json,
                        hedgeye_pods_json = EXCLUDED.hedgeye_pods_json,
                        historical_12q_json = EXCLUDED.historical_12q_json,
                        options_surface_json = EXCLUDED.options_surface_json,
                        forensic_dossier_json = EXCLUDED.forensic_dossier_json,
                        full_payload_json = EXCLUDED.full_payload_json,
                        is_earnings_season = EXCLUDED.is_earnings_season,
                        updated_at = EXCLUDED.updated_at;
                """, (clean_t, gics_industry, h_json, s_json, p_json, hist_json, opt_json, dos_json, full_json, is_earnings_season, now_dt))
                conn.commit()
                cursor.close()
                conn.close()
                logger.info(f"[StockCompressedStore] Successfully saved compressed snapshot for {clean_t} into Postgres.")
            except Exception as e:
                logger.warning(f"[StockCompressedStore] Postgres write error for {clean_t}: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO stock_payload_cache (
                            ticker, gics_industry, header_strip_json, solvency_matrix_json,
                            hedgeye_pods_json, historical_12q_json, options_surface_json,
                            forensic_dossier_json, full_payload_json, is_earnings_season, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(ticker) DO UPDATE SET
                            gics_industry = excluded.gics_industry,
                            header_strip_json = excluded.header_strip_json,
                            solvency_matrix_json = excluded.solvency_matrix_json,
                            hedgeye_pods_json = excluded.hedgeye_pods_json,
                            historical_12q_json = excluded.historical_12q_json,
                            options_surface_json = excluded.options_surface_json,
                            forensic_dossier_json = excluded.forensic_dossier_json,
                            full_payload_json = excluded.full_payload_json,
                            is_earnings_season = excluded.is_earnings_season,
                            updated_at = excluded.updated_at;
                    """, (clean_t, gics_industry, h_json, s_json, p_json, hist_json, opt_json, dos_json, full_json, int(is_earnings_season), now_str))
                    conn.commit()
                    logger.info(f"[StockCompressedStore] Successfully saved compressed snapshot for {clean_t} into SQLite.")
            except Exception as e:
                logger.warning(f"[StockCompressedStore] SQLite write error for {clean_t}: {e}")

    @staticmethod
    def _format_payload(row: tuple, ticker: str, max_age_days: int = 7) -> Dict[str, Any]:
        h_json, s_json, p_json, hist_json, opt_json, dos_json, full_json, is_earn, updated_raw, ind = row
        
        # Check staleness
        is_stale = False
        try:
            if isinstance(updated_raw, datetime):
                age_seconds = (datetime.now(timezone.utc) - updated_raw).total_seconds()
            else:
                updated_dt = datetime.fromisoformat(str(updated_raw).replace("Z", "+00:00"))
                age_seconds = (datetime.now(timezone.utc) - updated_dt).total_seconds()
            is_stale = age_seconds > (max_age_days * 86400)
        except Exception:
            is_stale = False

        # If full payload json was saved, return full dictionary with metadata flags
        if full_json:
            try:
                full_obj = json.loads(full_json)
                if isinstance(full_obj, dict):
                    full_obj["cache_hit"] = True
                    full_obj["is_stale"] = is_stale
                    full_obj["cached_at_utc"] = str(updated_raw)
                    full_obj["is_earnings_season"] = bool(is_earn)
                    return full_obj
            except Exception:
                pass

        return {
            "status": "ok",
            "ticker": ticker,
            "gics_industry": ind,
            "cache_hit": True,
            "is_stale": is_stale,
            "cached_at_utc": str(updated_raw),
            "is_earnings_season": bool(is_earn),
            "header_strip": json.loads(h_json) if h_json else {},
            "solvency_matrix": json.loads(s_json) if s_json else {},
            "hedgeye_3_pods": json.loads(p_json) if p_json else {},
            "historical_12q": json.loads(hist_json) if hist_json else [],
            "financial_walk_12q": json.loads(hist_json) if hist_json else [],
            "options_surface": json.loads(opt_json) if opt_json else {},
            "forensic_dossier": json.loads(dos_json) if dos_json else {},
        }

    # =========================================================================
    # OPT-1: 12-Quarter Historical Statements DB Store (stock_12q_walk_cache)
    # =========================================================================
    @classmethod
    def get_12q_walk(cls, ticker: str, max_age_days: int = 90) -> Optional[List[Dict[str, Any]]]:
        """Returns parsed 12Q financial statement walk from database in <10ms."""
        clean_t = ticker.strip().upper()
        now_epoch = int(time.time())
        max_age_sec = max_age_days * 86400
        db_url = cls.get_db_url()

        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                with psycopg2.connect(dsn) as conn:
                    with conn.cursor() as cursor:
                        cursor.execute("SELECT quarters_payload_json, updated_at FROM stock_12q_walk_cache WHERE ticker = %s;", (clean_t,))
                        row = cursor.fetchone()
                        if row:
                            q_json, upd = row
                            if now_epoch - int(upd) < max_age_sec:
                                return json.loads(q_json)
            except Exception as e:
                logger.warning(f"[StockCompressedStore] Postgres 12Q read error for {clean_t}: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT quarters_payload_json, updated_at FROM stock_12q_walk_cache WHERE ticker = ?;", (clean_t,))
                    row = cursor.fetchone()
                    if row:
                        q_json, upd = row
                        if now_epoch - int(upd) < max_age_sec:
                            return json.loads(q_json)
            except Exception as e:
                logger.warning(f"[StockCompressedStore] SQLite 12Q read error for {clean_t}: {e}")
        return None

    @classmethod
    def save_12q_walk(cls, ticker: str, quarters: List[Dict[str, Any]]) -> None:
        """Persists parsed 12Q financial statements into database."""
        clean_t = ticker.strip().upper()
        if not quarters:
            return
        now_epoch = int(time.time())
        q_json = json.dumps(quarters)
        db_url = cls.get_db_url()

        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                with psycopg2.connect(dsn) as conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO stock_12q_walk_cache (ticker, quarters_payload_json, updated_at)
                            VALUES (%s, %s, %s)
                            ON CONFLICT (ticker) DO UPDATE SET
                                quarters_payload_json = EXCLUDED.quarters_payload_json,
                                updated_at = EXCLUDED.updated_at;
                        """, (clean_t, q_json, now_epoch))
                        conn.commit()
                        logger.info(f"[StockCompressedStore] Persisted 12Q walk for {clean_t} into Postgres.")
            except Exception as e:
                logger.warning(f"[StockCompressedStore] Postgres 12Q write error for {clean_t}: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO stock_12q_walk_cache (ticker, quarters_payload_json, updated_at)
                        VALUES (?, ?, ?)
                        ON CONFLICT (ticker) DO UPDATE SET
                            quarters_payload_json = excluded.quarters_payload_json,
                            updated_at = excluded.updated_at;
                    """, (clean_t, q_json, now_epoch))
                    conn.commit()
                    logger.info(f"[StockCompressedStore] Persisted 12Q walk for {clean_t} into SQLite.")
            except Exception as e:
                logger.warning(f"[StockCompressedStore] SQLite 12Q write error for {clean_t}: {e}")

    # =========================================================================
    # OPT-2: Historical Daily News DB Store (stock_daily_news_cache)
    # =========================================================================
    @classmethod
    def get_daily_news_days(cls, ticker: str, dates: List[str]) -> Dict[str, Dict[str, Any]]:
        """Returns static cached daily news breakdowns for completed past trading days."""
        clean_t = ticker.strip().upper()
        results: Dict[str, Dict[str, Any]] = {}
        if not dates:
            return results
        db_url = cls.get_db_url()

        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                with psycopg2.connect(dsn) as conn:
                    with conn.cursor() as cursor:
                        placeholders = ",".join(["%s"] * len(dates))
                        sql = f"""
                            SELECT date, day_name, price_action_json, bullet_points_json, tags_json,
                                   catalyst_type, sentiment, articles_count, source
                            FROM stock_daily_news_cache
                            WHERE ticker = %s AND date IN ({placeholders});
                        """
                        cursor.execute(sql, [clean_t] + dates)
                        for r in cursor.fetchall():
                            d_str = str(r[0])
                            results[d_str] = {
                                "date": d_str,
                                "day_name": r[1],
                                "price_action": json.loads(r[2]) if r[2] else {},
                                "bullet_points": json.loads(r[3]) if r[3] else ["No events"],
                                "tags": json.loads(r[4]) if r[4] else [r[5] or "TRADING_SESSION"],
                                "catalyst_type": r[5] or "TRADING_SESSION",
                                "sentiment": r[6] or "NEUTRAL",
                                "articles_count": r[7] or 0,
                                "source": r[8] or "DB_CACHE",
                            }
            except Exception as e:
                logger.warning(f"[StockCompressedStore] Postgres news read error for {clean_t}: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    placeholders = ",".join(["?"] * len(dates))
                    sql = f"""
                        SELECT date, day_name, price_action_json, bullet_points_json, tags_json,
                               catalyst_type, sentiment, articles_count, source
                        FROM stock_daily_news_cache
                        WHERE ticker = ? AND date IN ({placeholders});
                    """
                    cursor.execute(sql, [clean_t] + dates)
                    for r in cursor.fetchall():
                        d_str = str(r[0])
                        results[d_str] = {
                            "date": d_str,
                            "day_name": r[1],
                            "price_action": json.loads(r[2]) if r[2] else {},
                            "bullet_points": json.loads(r[3]) if r[3] else ["No events"],
                            "tags": json.loads(r[4]) if r[4] else [r[5] or "TRADING_SESSION"],
                            "catalyst_type": r[5] or "TRADING_SESSION",
                            "sentiment": r[6] or "NEUTRAL",
                            "articles_count": r[7] or 0,
                            "source": r[8] or "DB_CACHE",
                        }
            except Exception as e:
                logger.warning(f"[StockCompressedStore] SQLite news read error for {clean_t}: {e}")

        return results

    @classmethod
    def save_daily_news_day(cls, ticker: str, day_dict: Dict[str, Any]) -> None:
        """Persists a completed trading day's news & price action summary into DB."""
        clean_t = ticker.strip().upper()
        d_str = day_dict.get("date")
        if not d_str:
            return
        now_epoch = int(time.time())
        db_url = cls.get_db_url()

        day_name = day_dict.get("day_name", "")
        pa_json = json.dumps(day_dict.get("price_action", {}))
        bullets_json = json.dumps(day_dict.get("bullet_points", ["No events"]))
        tags_json = json.dumps(day_dict.get("tags", []))
        cat = day_dict.get("catalyst_type", "TRADING_SESSION")
        sent = day_dict.get("sentiment", "NEUTRAL")
        art_count = day_dict.get("articles_count", 0)
        source = day_dict.get("source", "SYNTHESIS")

        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                with psycopg2.connect(dsn) as conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO stock_daily_news_cache (
                                ticker, date, day_name, price_action_json, bullet_points_json,
                                tags_json, catalyst_type, sentiment, articles_count, source, updated_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (ticker, date) DO UPDATE SET
                                day_name = EXCLUDED.day_name,
                                price_action_json = EXCLUDED.price_action_json,
                                bullet_points_json = EXCLUDED.bullet_points_json,
                                tags_json = EXCLUDED.tags_json,
                                catalyst_type = EXCLUDED.catalyst_type,
                                sentiment = EXCLUDED.sentiment,
                                articles_count = EXCLUDED.articles_count,
                                source = EXCLUDED.source,
                                updated_at = EXCLUDED.updated_at;
                        """, (clean_t, d_str, day_name, pa_json, bullets_json, tags_json, cat, sent, art_count, source, now_epoch))
                        conn.commit()
            except Exception as e:
                logger.warning(f"[StockCompressedStore] Postgres news write error for {clean_t} {d_str}: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO stock_daily_news_cache (
                            ticker, date, day_name, price_action_json, bullet_points_json,
                            tags_json, catalyst_type, sentiment, articles_count, source, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (ticker, date) DO UPDATE SET
                            day_name = excluded.day_name,
                            price_action_json = excluded.price_action_json,
                            bullet_points_json = excluded.bullet_points_json,
                            tags_json = excluded.tags_json,
                            catalyst_type = excluded.catalyst_type,
                            sentiment = excluded.sentiment,
                            articles_count = excluded.articles_count,
                            source = excluded.source,
                            updated_at = excluded.updated_at;
                    """, (clean_t, d_str, day_name, pa_json, bullets_json, tags_json, cat, sent, art_count, source, now_epoch))
                    conn.commit()
            except Exception as e:
                logger.warning(f"[StockCompressedStore] SQLite news write error for {clean_t} {d_str}: {e}")

    # =========================================================================
    # OPT-3: SEC Company Metadata & CIK DB Store (sec_company_metadata)
    # =========================================================================
    @classmethod
    def get_sec_metadata(cls, ticker: str) -> Optional[Dict[str, Any]]:
        """Returns cached SEC entity name, 10-digit CIK, and SIC code/desc in 0ms."""
        clean_t = ticker.strip().upper()
        db_url = cls.get_db_url()

        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                with psycopg2.connect(dsn) as conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            SELECT cik10, entity_name, sic_code, sic_description, gics_sector, gics_industry
                            FROM sec_company_metadata WHERE ticker = %s;
                        """, (clean_t,))
                        row = cursor.fetchone()
                        if row:
                            return {
                                "cik10": row[0],
                                "entity_name": row[1],
                                "sic_code": row[2],
                                "sic_description": row[3],
                                "gics_sector": row[4],
                                "gics_industry": row[5],
                            }
            except Exception as e:
                logger.warning(f"[StockCompressedStore] Postgres SEC meta read error for {clean_t}: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT cik10, entity_name, sic_code, sic_description, gics_sector, gics_industry
                        FROM sec_company_metadata WHERE ticker = ?;
                    """, (clean_t,))
                    row = cursor.fetchone()
                    if row:
                        return {
                            "cik10": row[0],
                            "entity_name": row[1],
                            "sic_code": row[2],
                            "sic_description": row[3],
                            "gics_sector": row[4],
                            "gics_industry": row[5],
                        }
            except Exception as e:
                logger.warning(f"[StockCompressedStore] SQLite SEC meta read error for {clean_t}: {e}")

        return None

    @classmethod
    def save_sec_metadata(
        cls,
        ticker: str,
        cik10: str,
        entity_name: str,
        sic_code: str = "",
        sic_description: str = "",
        gics_sector: str = "",
        gics_industry: str = "",
    ) -> None:
        """Persists verified SEC EDGAR CIK and classification metadata."""
        clean_t = ticker.strip().upper()
        if not cik10:
            return
        now_epoch = int(time.time())
        db_url = cls.get_db_url()

        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                with psycopg2.connect(dsn) as conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO sec_company_metadata (
                                ticker, cik10, entity_name, sic_code, sic_description, gics_sector, gics_industry, updated_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (ticker) DO UPDATE SET
                                cik10 = EXCLUDED.cik10,
                                entity_name = COALESCE(EXCLUDED.entity_name, sec_company_metadata.entity_name),
                                sic_code = COALESCE(EXCLUDED.sic_code, sec_company_metadata.sic_code),
                                sic_description = COALESCE(EXCLUDED.sic_description, sec_company_metadata.sic_description),
                                gics_sector = COALESCE(EXCLUDED.gics_sector, sec_company_metadata.gics_sector),
                                gics_industry = COALESCE(EXCLUDED.gics_industry, sec_company_metadata.gics_industry),
                                updated_at = EXCLUDED.updated_at;
                        """, (clean_t, cik10, entity_name, sic_code, sic_description, gics_sector, gics_industry, now_epoch))
                        conn.commit()
            except Exception as e:
                logger.warning(f"[StockCompressedStore] Postgres SEC meta write error for {clean_t}: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO sec_company_metadata (
                            ticker, cik10, entity_name, sic_code, sic_description, gics_sector, gics_industry, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (ticker) DO UPDATE SET
                            cik10 = excluded.cik10,
                            entity_name = coalesce(excluded.entity_name, sec_company_metadata.entity_name),
                            sic_code = coalesce(excluded.sic_code, sec_company_metadata.sic_code),
                            sic_description = coalesce(excluded.sic_description, sec_company_metadata.sic_description),
                            gics_sector = coalesce(excluded.gics_sector, sec_company_metadata.gics_sector),
                            gics_industry = coalesce(excluded.gics_industry, sec_company_metadata.gics_industry),
                            updated_at = excluded.updated_at;
                    """, (clean_t, cik10, entity_name, sic_code, sic_description, gics_sector, gics_industry, now_epoch))
                    conn.commit()
            except Exception as e:
                logger.warning(f"[StockCompressedStore] SQLite SEC meta write error for {clean_t}: {e}")

    # =========================================================================
    # OPT-5: Options Microstructure Snapshot DB Store (options_microstructure)
    # =========================================================================
    @classmethod
    def save_options_microstructure(cls, ticker: str, date_str: str, data: Dict[str, Any]) -> None:
        """Stores daily options microstructure snapshot (GEX, walls, skew) into database."""
        clean_t = ticker.strip().upper()
        if not date_str:
            return
        db_url = cls.get_db_url()

        total_gex = data.get("total_gex") or data.get("net_gamma_usd_m")
        call_wall = data.get("call_wall")
        put_wall = data.get("put_wall")
        flip_level = data.get("gamma_flip_level") or data.get("vol_trigger")
        skew = data.get("skew_25d")
        pc_ratio = data.get("put_call_vol_ratio") or data.get("p_c_ratio")
        zero_dte = data.get("zero_dte_heat_ratio")
        crowding = data.get("crowding_z")

        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                with psycopg2.connect(dsn) as conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO options_microstructure (
                                ticker, date, total_gex, zero_dte_heat_ratio, gamma_flip_level,
                                call_wall, put_wall, skew_25d, put_call_vol_ratio, crowding_z
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (ticker, date) DO UPDATE SET
                                total_gex = COALESCE(EXCLUDED.total_gex, options_microstructure.total_gex),
                                zero_dte_heat_ratio = COALESCE(EXCLUDED.zero_dte_heat_ratio, options_microstructure.zero_dte_heat_ratio),
                                gamma_flip_level = COALESCE(EXCLUDED.gamma_flip_level, options_microstructure.gamma_flip_level),
                                call_wall = COALESCE(EXCLUDED.call_wall, options_microstructure.call_wall),
                                put_wall = COALESCE(EXCLUDED.put_wall, options_microstructure.put_wall),
                                skew_25d = COALESCE(EXCLUDED.skew_25d, options_microstructure.skew_25d),
                                put_call_vol_ratio = COALESCE(EXCLUDED.put_call_vol_ratio, options_microstructure.put_call_vol_ratio),
                                crowding_z = COALESCE(EXCLUDED.crowding_z, options_microstructure.crowding_z);
                        """, (clean_t, date_str, total_gex, zero_dte, flip_level, call_wall, put_wall, skew, pc_ratio, crowding))
                        conn.commit()
            except Exception as e:
                logger.warning(f"[StockCompressedStore] Postgres options microstructure write error for {clean_t}: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO options_microstructure (
                            ticker, date, total_gex, zero_dte_heat_ratio, gamma_flip_level,
                            call_wall, put_wall, skew_25d, put_call_vol_ratio, crowding_z
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (ticker, date) DO UPDATE SET
                            total_gex = coalesce(excluded.total_gex, options_microstructure.total_gex),
                            zero_dte_heat_ratio = coalesce(excluded.zero_dte_heat_ratio, options_microstructure.zero_dte_heat_ratio),
                            gamma_flip_level = coalesce(excluded.gamma_flip_level, options_microstructure.gamma_flip_level),
                            call_wall = coalesce(excluded.call_wall, options_microstructure.call_wall),
                            put_wall = coalesce(excluded.put_wall, options_microstructure.put_wall),
                            skew_25d = coalesce(excluded.skew_25d, options_microstructure.skew_25d),
                            put_call_vol_ratio = coalesce(excluded.put_call_vol_ratio, options_microstructure.put_call_vol_ratio),
                            crowding_z = coalesce(excluded.crowding_z, options_microstructure.crowding_z);
                    """, (clean_t, date_str, total_gex, zero_dte, flip_level, call_wall, put_wall, skew, pc_ratio, crowding))
                    conn.commit()
            except Exception as e:
                logger.warning(f"[StockCompressedStore] SQLite options microstructure write error for {clean_t}: {e}")

    @classmethod
    def get_latest_options_microstructure(cls, ticker: str) -> Optional[Dict[str, Any]]:
        """Retrieves most recent options snapshot from database."""
        clean_t = ticker.strip().upper()
        db_url = cls.get_db_url()

        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                with psycopg2.connect(dsn) as conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            SELECT date, total_gex, zero_dte_heat_ratio, gamma_flip_level,
                                   call_wall, put_wall, skew_25d, put_call_vol_ratio, crowding_z
                            FROM options_microstructure WHERE ticker = %s ORDER BY date DESC LIMIT 1;
                        """, (clean_t,))
                        row = cursor.fetchone()
                        if row:
                            return {
                                "date": str(row[0]),
                                "total_gex": row[1],
                                "zero_dte_heat_ratio": row[2],
                                "gamma_flip_level": row[3],
                                "call_wall": row[4],
                                "put_wall": row[5],
                                "skew_25d": row[6],
                                "put_call_vol_ratio": row[7],
                                "crowding_z": row[8],
                            }
            except Exception as e:
                logger.warning(f"[StockCompressedStore] Postgres options read error for {clean_t}: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT date, total_gex, zero_dte_heat_ratio, gamma_flip_level,
                               call_wall, put_wall, skew_25d, put_call_vol_ratio, crowding_z
                        FROM options_microstructure WHERE ticker = ? ORDER BY date DESC LIMIT 1;
                    """, (clean_t,))
                    row = cursor.fetchone()
                    if row:
                        return {
                            "date": str(row[0]),
                            "total_gex": row[1],
                            "zero_dte_heat_ratio": row[2],
                            "gamma_flip_level": row[3],
                            "call_wall": row[4],
                            "put_wall": row[5],
                            "skew_25d": row[6],
                            "put_call_vol_ratio": row[7],
                            "crowding_z": row[8],
                        }
            except Exception as e:
                logger.warning(f"[StockCompressedStore] SQLite options read error for {clean_t}: {e}")

        return None

    # =========================================================================
    # OPT-6: Macro Liquidity & Multi-Horizon Allocation DB Cache (macro_liquidity_cache)
    # =========================================================================
    @classmethod
    def get_macro_liquidity_payload(cls, cache_key: str = "full_liquidity_allocation", max_age_seconds: int = 900) -> Optional[Dict[str, Any]]:
        """Returns pre-computed synthesized macro liquidity & asset allocation payload in <10ms."""
        db_url = cls.get_db_url()
        now_dt = datetime.now(timezone.utc)

        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                with psycopg2.connect(dsn) as conn:
                    with conn.cursor() as cursor:
                        cursor.execute("SELECT payload_json, updated_at FROM macro_liquidity_cache WHERE cache_key = %s;", (cache_key,))
                        row = cursor.fetchone()
                        if row:
                            payload_json, updated_at = row
                            age_sec = (now_dt - updated_at).total_seconds()
                            if age_sec < max_age_seconds:
                                data = json.loads(payload_json)
                                data["_cache_hit"] = True
                                data["_cached_age_seconds"] = round(age_sec, 1)
                                return data
            except Exception as e:
                logger.debug(f"[StockCompressedStore] Postgres macro liquidity cache read note: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT payload_json, updated_at FROM macro_liquidity_cache WHERE cache_key = ?;", (cache_key,))
                    row = cursor.fetchone()
                    if row:
                        payload_json, updated_at_str = row
                        upd_dt = datetime.fromisoformat(str(updated_at_str).replace("Z", "+00:00"))
                        age_sec = (now_dt - upd_dt).total_seconds()
                        if age_sec < max_age_seconds:
                            data = json.loads(payload_json)
                            data["_cache_hit"] = True
                            data["_cached_age_seconds"] = round(age_sec, 1)
                            return data
            except Exception as e:
                logger.debug(f"[StockCompressedStore] SQLite macro liquidity cache read note: {e}")

        return None

    @classmethod
    def save_macro_liquidity_payload(cls, cache_key: str, payload: Dict[str, Any]) -> None:
        """Persists synthesized macro liquidity payload into database."""
        db_url = cls.get_db_url()
        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.isoformat()
        payload_copy = dict(payload)
        payload_copy.pop("_cache_hit", None)
        payload_copy.pop("_cached_age_seconds", None)
        p_json = json.dumps(payload_copy)

        if "postgres" in db_url:
            try:
                import psycopg2
                dsn = _get_pg_dsn(db_url)
                with psycopg2.connect(dsn) as conn:
                    with conn.cursor() as cursor:
                        cursor.execute("""
                            CREATE TABLE IF NOT EXISTS macro_liquidity_cache (
                                cache_key VARCHAR(64) PRIMARY KEY,
                                payload_json TEXT NOT NULL,
                                updated_at TIMESTAMP WITH TIME ZONE NOT NULL
                            );
                            INSERT INTO macro_liquidity_cache (cache_key, payload_json, updated_at)
                            VALUES (%s, %s, %s)
                            ON CONFLICT (cache_key) DO UPDATE SET
                                payload_json = EXCLUDED.payload_json,
                                updated_at = EXCLUDED.updated_at;
                        """, (cache_key, p_json, now_dt))
                        conn.commit()
                        logger.info(f"[StockCompressedStore] Successfully saved macro liquidity snapshot ({cache_key}) into Postgres.")
            except Exception as e:
                logger.warning(f"[StockCompressedStore] Postgres macro liquidity write error: {e}")
        else:
            db_path = db_url.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS macro_liquidity_cache (
                            cache_key TEXT PRIMARY KEY,
                            payload_json TEXT NOT NULL,
                            updated_at TEXT NOT NULL
                        );
                        INSERT INTO macro_liquidity_cache (cache_key, payload_json, updated_at)
                        VALUES (?, ?, ?)
                        ON CONFLICT (cache_key) DO UPDATE SET
                            payload_json = excluded.payload_json,
                            updated_at = excluded.updated_at;
                    """, (cache_key, p_json, now_iso))
                    conn.commit()
                    logger.info(f"[StockCompressedStore] Successfully saved macro liquidity snapshot ({cache_key}) into SQLite.")
            except Exception as e:
                logger.warning(f"[StockCompressedStore] SQLite macro liquidity write error: {e}")



