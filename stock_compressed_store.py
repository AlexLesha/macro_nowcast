"""
backend/app/db/stock_compressed_store.py

Production Technique 4:
Compressed 12-Quarter XBRL and Fundamental Cache Store using JSONB/Text Blobs.
Allows full 12-quarter statements and peer scorecards to be read in a single primary key lookup (<10ms).
"""

import os
import json
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./macro_pulse.db")


class StockCompressedStore:
    """High-speed storage engine for compressed 12-quarter XBRL walks and fundamentals."""

    @classmethod
    def init_tables(cls):
        """Initializes tables for single-key compressed lookups."""
        if DB_URL.startswith("postgres"):
            try:
                import psycopg2
                conn = psycopg2.connect(DB_URL)
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
            except Exception as e:
                print(f"[StockCompressedStore] Postgres init note: {e}")
        else:
            db_path = DB_URL.replace("sqlite:///", "")
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

    @classmethod
    def get_stock_payload(cls, ticker: str) -> Optional[Dict[str, Any]]:
        """Returns the pre-computed full dossier in <10ms."""
        clean_t = ticker.strip().upper()
        if DB_URL.startswith("postgres"):
            try:
                import psycopg2
                conn = psycopg2.connect(DB_URL)
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT header_strip_json, solvency_matrix_json, hedgeye_pods_json,
                           historical_12q_json, options_surface_json, forensic_dossier_json,
                           is_earnings_season, updated_at, gics_industry
                    FROM stock_payload_cache WHERE ticker = %s;
                """, (clean_t,))
                row = cursor.fetchone()
                cursor.close()
                conn.close()
                if row:
                    return cls._format_payload(row, clean_t)
            except Exception as e:
                print(f"[StockCompressedStore] Postgres read error for {clean_t}: {e}")
        else:
            db_path = DB_URL.replace("sqlite:///", "")
            if not os.path.exists(db_path):
                return None
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT header_strip_json, solvency_matrix_json, hedgeye_pods_json,
                               historical_12q_json, options_surface_json, forensic_dossier_json,
                               is_earnings_season, updated_at, gics_industry
                        FROM stock_payload_cache WHERE ticker = ?;
                    """, (clean_t,))
                    row = cursor.fetchone()
                    if row:
                        return cls._format_payload(row, clean_t)
            except Exception as e:
                print(f"[StockCompressedStore] SQLite read error for {clean_t}: {e}")
        return None

    @classmethod
    def save_stock_payload(cls, ticker: str, gics_industry: str, payload: Dict[str, Any], is_earnings_season: bool = False):
        """Stores the full analysis into the compressed cache."""
        clean_t = ticker.strip().upper()
        now_str = datetime.now(timezone.utc).isoformat()

        h_json = json.dumps(payload.get("header_strip", {}))
        s_json = json.dumps(payload.get("solvency_matrix", {}))
        p_json = json.dumps(payload.get("hedgeye_3_pods", {}))
        hist_json = json.dumps(payload.get("historical_12q", []))
        opt_json = json.dumps(payload.get("options_surface", {}))
        dos_json = json.dumps(payload.get("forensic_dossier", {}))

        if DB_URL.startswith("postgres"):
            try:
                import psycopg2
                conn = psycopg2.connect(DB_URL)
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO stock_payload_cache (
                        ticker, gics_industry, header_strip_json, solvency_matrix_json,
                        hedgeye_pods_json, historical_12q_json, options_surface_json,
                        forensic_dossier_json, is_earnings_season, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ticker) DO UPDATE SET
                        gics_industry = EXCLUDED.gics_industry,
                        header_strip_json = EXCLUDED.header_strip_json,
                        solvency_matrix_json = EXCLUDED.solvency_matrix_json,
                        hedgeye_pods_json = EXCLUDED.hedgeye_pods_json,
                        historical_12q_json = EXCLUDED.historical_12q_json,
                        options_surface_json = EXCLUDED.options_surface_json,
                        forensic_dossier_json = EXCLUDED.forensic_dossier_json,
                        is_earnings_season = EXCLUDED.is_earnings_season,
                        updated_at = EXCLUDED.updated_at;
                """, (clean_t, gics_industry, h_json, s_json, p_json, hist_json, opt_json, dos_json, is_earnings_season, now_str))
                conn.commit()
                cursor.close()
                conn.close()
            except Exception as e:
                print(f"[StockCompressedStore] Postgres write error for {clean_t}: {e}")
        else:
            db_path = DB_URL.replace("sqlite:///", "")
            try:
                with sqlite3.connect(db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO stock_payload_cache (
                            ticker, gics_industry, header_strip_json, solvency_matrix_json,
                            hedgeye_pods_json, historical_12q_json, options_surface_json,
                            forensic_dossier_json, is_earnings_season, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(ticker) DO UPDATE SET
                            gics_industry = excluded.gics_industry,
                            header_strip_json = excluded.header_strip_json,
                            solvency_matrix_json = excluded.solvency_matrix_json,
                            hedgeye_pods_json = excluded.hedgeye_pods_json,
                            historical_12q_json = excluded.historical_12q_json,
                            options_surface_json = excluded.options_surface_json,
                            forensic_dossier_json = excluded.forensic_dossier_json,
                            is_earnings_season = excluded.is_earnings_season,
                            updated_at = excluded.updated_at;
                    """, (clean_t, gics_industry, h_json, s_json, p_json, hist_json, opt_json, dos_json, int(is_earnings_season), now_str))
                    conn.commit()
            except Exception as e:
                print(f"[StockCompressedStore] SQLite write error for {clean_t}: {e}")

    @staticmethod
    def _format_payload(row: tuple, ticker: str) -> Dict[str, Any]:
        h_json, s_json, p_json, hist_json, opt_json, dos_json, is_earn, updated_str, ind = row
        return {
            "status": "ok",
            "ticker": ticker,
            "gics_industry": ind,
            "cache_hit": True,
            "cached_at_utc": str(updated_str),
            "is_earnings_season": bool(is_earn),
            "header_strip": json.loads(h_json),
            "solvency_matrix": json.loads(s_json),
            "hedgeye_3_pods": json.loads(p_json),
            "historical_12q": json.loads(hist_json),
            "options_surface": json.loads(opt_json),
            "forensic_dossier": json.loads(dos_json),
        }