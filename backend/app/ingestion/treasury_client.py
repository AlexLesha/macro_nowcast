import logging
from datetime import datetime, date, timezone
from typing import Dict, Any, List, Optional
import httpx
from sqlalchemy.orm import Session
from app.models.db_models import MacroSeries

logger = logging.getLogger(__name__)

FISCAL_DATA_BASE_URL = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service"


class TreasuryClient:
    """Client for fetching live TGA and Treasury deficit outlays from US Fiscal Data API."""

    def __init__(self):
        self.client = httpx.Client(
            headers={"User-Agent": "MacroPulseAlpha/1.0"},
            timeout=30.0,
        )

    def fetch_tga_cash_balance(self, page_size: int = 100) -> List[Dict[str, Any]]:
        """Fetches daily Treasury General Account (TGA) cash balances from operating_cash_balance.
        
        API: /v1/accounting/dts/operating_cash_balance
        """
        url = f"{FISCAL_DATA_BASE_URL}/v1/accounting/dts/operating_cash_balance"
        params = {
            "sort": "-record_date",
            "page[size]": page_size,
        }
        try:
            res = self.client.get(url, params=params)
            res.raise_for_status()
            data = res.json()
            records = data.get("data", [])
            
            by_date: Dict[date, float] = {}
            for item in records:
                acc_type = str(item.get("account_type", "")).lower()
                # Focus on TGA closing or opening balance
                if "treasury general account" in acc_type or "federal reserve account" in acc_type or "closing balance" in acc_type:
                    c_bal = item.get("close_today_bal")
                    o_bal = item.get("open_today_bal")
                    bal_str = c_bal if (c_bal and str(c_bal).lower() != "null") else o_bal
                    if bal_str and str(bal_str).lower() != "null":
                        try:
                            val_millions = float(str(bal_str).replace(",", ""))
                            val_billions = val_millions / 1000.0  # Convert to USD Billions
                            rec_date = datetime.strptime(item["record_date"], "%Y-%m-%d").date()
                            if rec_date not in by_date:
                                by_date[rec_date] = val_billions
                        except (ValueError, TypeError):
                            continue
            return [{"date": d, "value": v, "source": "US_TREASURY_DTS"} for d, v in by_date.items()]
        except Exception as e:
            logger.error(f"Error fetching TGA cash balance from Treasury API: {e}")
            return []

    def fetch_mts_deficits(self, page_size: int = 60) -> List[Dict[str, Any]]:
        """Fetches Monthly Treasury Statement (MTS) receipts, outlays, and deficit outlays.
        
        API: /v1/accounting/mts/mts_table_1
        """
        url = f"{FISCAL_DATA_BASE_URL}/v1/accounting/mts/mts_table_1"
        params = {
            "sort": "-record_date",
            "page[size]": page_size,
        }
        try:
            res = self.client.get(url, params=params)
            res.raise_for_status()
            data = res.json()
            records = data.get("data", [])

            by_date: Dict[date, float] = {}
            for item in records:
                rec_date_str = item.get("record_date")
                outlay_str = item.get("current_month_gross_outly_amt") or item.get("current_month_dfct_sur_amt")
                if rec_date_str and outlay_str and str(outlay_str).lower() != "null":
                    try:
                        val_amt = float(str(outlay_str).replace(",", "")) / 1e9  # Convert to billions
                        rec_date = datetime.strptime(rec_date_str, "%Y-%m-%d").date()
                        if rec_date not in by_date:
                            by_date[rec_date] = val_amt
                    except (ValueError, TypeError):
                        continue
            return [{"date": d, "value": v, "source": "US_TREASURY_MTS"} for d, v in by_date.items()]
        except Exception as e:
            logger.error(f"Error fetching MTS deficits from Treasury API: {e}")
            return []

    def ingest_treasury_data(self, db: Session) -> Dict[str, int]:
        """Ingests live TGA balances and MTS deficit outlays into MacroSeries table."""
        tga_data = self.fetch_tga_cash_balance(page_size=120)
        mts_data = self.fetch_mts_deficits(page_size=60)
        
        counts = {"TGA_DAILY": 0, "MTS_NET_OUTLAYS": 0}
        now = datetime.now(timezone.utc)

        # Ingest TGA
        for item in tga_data:
            rec_date = item["date"]
            val = item["value"]
            existing = db.query(MacroSeries).filter_by(series_id="TGA_DAILY", date=rec_date).first()
            if existing:
                existing.value = val
                existing.updated_at = now
            else:
                db.add(MacroSeries(
                    series_id="TGA_DAILY",
                    source="US_TREASURY_DTS",
                    date=rec_date,
                    value=val,
                    updated_at=now,
                ))
            counts["TGA_DAILY"] += 1

        # Ingest MTS
        for item in mts_data:
            rec_date = item["date"]
            val = item["value"]
            existing = db.query(MacroSeries).filter_by(series_id="MTS_NET_OUTLAYS", date=rec_date).first()
            if existing:
                existing.value = val
                existing.updated_at = now
            else:
                db.add(MacroSeries(
                    series_id="MTS_NET_OUTLAYS",
                    source="US_TREASURY_MTS",
                    date=rec_date,
                    value=val,
                    updated_at=now,
                ))
            counts["MTS_NET_OUTLAYS"] += 1

        db.commit()
        logger.info(f"Ingested Treasury metrics: {counts}")
        return counts
