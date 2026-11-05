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
                conn.commit()
                cursor.close()
                conn.close()
                logger.info("[StockCompressedStore] Postgres tables verified on Neon.")
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
                conn.commit()
                logger.info("[StockCompressedStore] SQLite tables verified.")

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

