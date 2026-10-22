from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime


class MacroSeriesItem(BaseModel):
    series_id: str
    source: str
    date: str
    value: Optional[float] = None
    yoy_roc: Optional[float] = None
    mom_roc: Optional[float] = None
    z_score_3y: Optional[float] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class MarketDailyItem(BaseModel):
    ticker: str
    asset_class: str
    date: str
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[float] = None
    rv_21d: Optional[float] = None
    iv_30d: Optional[float] = None
    vams_score: Optional[float] = None
    vams_state: Optional[str] = None
    rr_trade_low: Optional[float] = None
    rr_trade_high: Optional[float] = None
    rr_trend_pivot: Optional[float] = None
    rr_trend_state: Optional[str] = None
    rr_tail_pivot: Optional[float] = None

    class Config:
        from_attributes = True


class OptionsMicrostructureItem(BaseModel):
    ticker: str
    date: str
    total_gex: Optional[float] = None
    zero_dte_heat_ratio: Optional[float] = None
    gamma_flip_level: Optional[float] = None
    call_wall: Optional[float] = None
    put_wall: Optional[float] = None
    skew_25d: Optional[float] = None
    put_call_vol_ratio: Optional[float] = None
    crowding_z: Optional[float] = None

    class Config:
        from_attributes = True


class RegimeSnapshotItem(BaseModel):
    date: str
    us_monthly_quad: Optional[str] = None
    us_quarterly_quad: Optional[str] = None
    quad_1_prob: Optional[float] = None
    quad_2_prob: Optional[float] = None
    quad_3_prob: Optional[float] = None
    quad_4_prob: Optional[float] = None
    grid_regime: Optional[str] = None
    grid_scores_json: Optional[str] = None
    prometheus_similarity_json: Optional[str] = None
    net_liquidity_usd_bn: Optional[float] = None
    global_liquidity_usd_tn: Optional[float] = None
    debt_to_liquidity_pct: Optional[float] = None
    kiss_weights_json: Optional[str] = None

    class Config:
        from_attributes = True


class IntelligenceDeltaItem(BaseModel):
    id: str
    timestamp_utc: Optional[str] = None
    framework_author: str
    source_type: str
    source_title: str
    source_url: Optional[str] = None
    published_at: Optional[str] = None
    summary_markdown: str
    extracted_json: Optional[str] = None
    affected_tickers: Optional[str] = None

    class Config:
        from_attributes = True


class IngestionStatusResponse(BaseModel):
    status: str
    message: str
    records_ingested: int
    details: Optional[Dict[str, Any]] = None
