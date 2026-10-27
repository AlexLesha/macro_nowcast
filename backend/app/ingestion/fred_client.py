import io
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import httpx
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from app.config import settings
from app.models.db_models import MacroSeries

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

FRED_CSV_BASE_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}"
FRED_API_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"


class FredClient:
    """Client for fetching and computing macroeconomic transformations from FRED.
    
    Includes automatic fallback to FRED's public CSV endpoint so the application
    functions immediately out-of-the-box without requiring an API key.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.FRED_API_KEY
        self.client = httpx.Client(
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MacroPulseAlpha/1.0"
            },
            timeout=30.0,
            follow_redirects=True,
        )

    def fetch_series_df(self, series_id: str) -> pd.DataFrame:
        """Fetches raw series data and returns a cleaned DataFrame indexed by Date."""
        # 1. Try official API if key is present
        if self.api_key:
            try:
                params = {
                    "series_id": series_id,
                    "api_key": self.api_key,
                    "file_type": "json",
                }
                res = self.client.get(FRED_API_BASE_URL, params=params)
                if res.status_code == 200:
                    data = res.json()
                    observations = data.get("observations", [])
                    if observations:
                        df = pd.DataFrame(observations)[["date", "value"]]
                        df["date"] = pd.to_datetime(df["date"])
                        df["value"] = pd.to_numeric(df["value"], errors="coerce")
                        df = df.dropna(subset=["value"]).sort_values("date")
                        df.set_index("date", inplace=True)
                        return df
            except Exception as e:
                logger.warning(f"FRED API fetch failed for {series_id}, falling back to CSV: {e}")

        # 2. Fallback to public FRED CSV endpoint
        url = FRED_CSV_BASE_URL.format(series_id=series_id)
        try:
            res = self.client.get(url)
            res.raise_for_status()
            df = pd.read_csv(io.StringIO(res.text))
            
            # The columns in fredgraph.csv are typically ['DATE', series_id] or ['observation_date', series_id]
            date_col = [col for col in df.columns if "date" in col.lower()][0]
            val_col = [col for col in df.columns if col != date_col][0]

            df["date"] = pd.to_datetime(df[date_col], errors="coerce")
            df["value"] = pd.to_numeric(df[val_col], errors="coerce")
            df = df.dropna(subset=["date", "value"]).sort_values("date")
            df.set_index("date", inplace=True)
            return df[["value"]]
        except Exception as e:
            logger.error(f"Failed to fetch public CSV for FRED series {series_id}: {e}")
            return pd.DataFrame(columns=["value"])

    def compute_transformations(self, df: pd.DataFrame) -> pd.DataFrame:
        """Computes YoY Rate of Change, MoM Rate of Change, and 3-Year Rolling Z-Score."""
        if df.empty:
            return df

        res = df.copy()
        
        # Infer cadence (Quarterly, Monthly, Weekly, Daily) based on average days between records
        if len(res) > 2:
            avg_step_days = (res.index[-1] - res.index[0]).days / (len(res) - 1)
        else:
            avg_step_days = 30.0

        if avg_step_days > 70:
            # Quarterly (~90 days)
            yoy_shift = 4
            mom_shift = 1
            rolling_window = 12  # 3 years = 12 quarters
        elif avg_step_days > 20:
            # Monthly (~30 days)
            yoy_shift = 12
            mom_shift = 1
            rolling_window = 36  # 3 years = 36 months
        elif avg_step_days > 5:
            # Weekly (~7 days)
            yoy_shift = 52
            mom_shift = 4
            rolling_window = 156 # 3 years = 156 weeks
        else:
            # Daily (~252 trading days/year)
            yoy_shift = 252
            mom_shift = 21
            rolling_window = 756 # 3 years = 756 trading days

        # YoY Rate of Change (%)
        res["yoy_roc"] = ((res["value"] - res["value"].shift(yoy_shift)) / res["value"].shift(yoy_shift).abs()) * 100.0

        # MoM Rate of Change (%)
        res["mom_roc"] = ((res["value"] - res["value"].shift(mom_shift)) / res["value"].shift(mom_shift).abs()) * 100.0

        # 3-Year Rolling Z-Score
        min_p = max(5, int(rolling_window * 0.3))
        rolling_mean = res["value"].rolling(window=rolling_window, min_periods=min_p).mean()
        rolling_std = res["value"].rolling(window=rolling_window, min_periods=min_p).std()
        res["z_score_3y"] = (res["value"] - rolling_mean) / rolling_std.replace(0, np.nan)

        return res

    def ingest_series(self, series_id: str, db: Session, limit_records: Optional[int] = None) -> int:
        """Fetches, computes, and stores a specific FRED series into the database."""
        logger.info(f"Ingesting FRED series: {series_id}")
        raw_df = self.fetch_series_df(series_id)
        if raw_df.empty:
            logger.warning(f"No records found for FRED series: {series_id}")
            return 0

        transformed_df = self.compute_transformations(raw_df)
        if limit_records:
            transformed_df = transformed_df.tail(limit_records)

        inserted_count = 0
        now = datetime.now(timezone.utc)

        for idx_date, row in transformed_df.iterrows():
            record_date = idx_date.date()
            val = float(row["value"]) if pd.notnull(row["value"]) else None
            yoy = float(row["yoy_roc"]) if pd.notnull(row["yoy_roc"]) else None
            mom = float(row["mom_roc"]) if pd.notnull(row["mom_roc"]) else None
            z_score = float(row["z_score_3y"]) if pd.notnull(row["z_score_3y"]) else None

            # Merge / upsert into DB
            db_item = db.query(MacroSeries).filter_by(series_id=series_id, date=record_date).first()
            if db_item:
                db_item.value = val
                db_item.yoy_roc = yoy
                db_item.mom_roc = mom
                db_item.z_score_3y = z_score
                db_item.updated_at = now
            else:
                db_item = MacroSeries(
                    series_id=series_id,
                    source="FRED",
                    date=record_date,
                    value=val,
                    yoy_roc=yoy,
                    mom_roc=mom,
                    z_score_3y=z_score,
                    updated_at=now,
                )
                db.add(db_item)
            inserted_count += 1

        db.commit()
        logger.info(f"Successfully ingested {inserted_count} records for FRED series {series_id}")
        return inserted_count

    def ingest_all_series(self, db: Session, series_list: Optional[List[str]] = None, limit_records: int = 120) -> Dict[str, int]:
        """Ingests all configured FRED macro series."""
        targets = series_list or settings.FRED_SERIES
        results = {}
        for s_id in targets:
            try:
                cnt = self.ingest_series(s_id, db, limit_records=limit_records)
                results[s_id] = cnt
            except Exception as e:
                logger.error(f"Error ingesting {s_id}: {e}")
                results[s_id] = 0
        return results
