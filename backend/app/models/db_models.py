from datetime import datetime, date
from typing import Optional, Dict, Any
from sqlalchemy import (
    Column,
    String,
    Float,
    Date,
    DateTime,
    Text,
    Index,
    PrimaryKeyConstraint,
)
from app.db import Base


class MacroSeries(Base):
    """Stores macroeconomic time series data from FRED, Treasury, and other agencies."""
    __tablename__ = "macro_series"

    series_id = Column(String(64), nullable=False, index=True)
    source = Column(String(64), nullable=False, default="FRED")
    date = Column(Date, nullable=False, index=True)
    value = Column(Float, nullable=True)
    yoy_roc = Column(Float, nullable=True, comment="Year-over-Year Rate of Change in %")
    mom_roc = Column(Float, nullable=True, comment="Month-over-Month Rate of Change in %")
    z_score_3y = Column(Float, nullable=True, comment="3-Year Rolling Z-Score")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        PrimaryKeyConstraint("series_id", "date", name="pk_macro_series"),
        Index("idx_macro_series_lookup", "series_id", "date"),
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "series_id": self.series_id,
            "source": self.source,
            "date": self.date.isoformat() if self.date else None,
            "value": self.value,
            "yoy_roc": self.yoy_roc,
            "mom_roc": self.mom_roc,
            "z_score_3y": self.z_score_3y,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class MarketDaily(Base):
    """Daily OHLCV, realized/implied volatility, VAMS and risk ranges for markets and factors."""
    __tablename__ = "market_daily"

    ticker = Column(String(32), nullable=False, index=True)
    asset_class = Column(String(64), nullable=False, default="EQUITY")
    date = Column(Date, nullable=False, index=True)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    close = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    rv_21d = Column(Float, nullable=True, comment="21-day annualized realized volatility")
    iv_30d = Column(Float, nullable=True, comment="30-day implied volatility")
    vams_score = Column(Float, nullable=True, comment="Volatility-Adjusted Momentum Score")
    vams_state = Column(String(32), nullable=True, comment="BULLISH_TREND, NEUTRAL, BEARISH_TREND")
    rr_trade_low = Column(Float, nullable=True, comment="Risk Range Trade Low")
    rr_trade_high = Column(Float, nullable=True, comment="Risk Range Trade High")
    rr_trend_pivot = Column(Float, nullable=True, comment="Risk Range Trend Pivot")
    rr_trend_state = Column(String(32), nullable=True, comment="BULLISH, BEARISH, NEUTRAL")
    rr_tail_pivot = Column(Float, nullable=True, comment="Risk Range Tail Risk Pivot")

    __table_args__ = (
        PrimaryKeyConstraint("ticker", "date", name="pk_market_daily"),
        Index("idx_market_daily_lookup", "ticker", "date"),
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ticker": self.ticker,
            "asset_class": self.asset_class,
            "date": self.date.isoformat() if self.date else None,
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "volume": self.volume,
            "rv_21d": self.rv_21d,
            "iv_30d": self.iv_30d,
            "vams_score": self.vams_score,
            "vams_state": self.vams_state,
            "rr_trade_low": self.rr_trade_low,
            "rr_trade_high": self.rr_trade_high,
            "rr_trend_pivot": self.rr_trend_pivot,
            "rr_trend_state": self.rr_trend_state,
            "rr_tail_pivot": self.rr_tail_pivot,
        }


class OptionsMicrostructure(Base):
    """Options microstructure analytics including GEX, walls, skew, and zero-DTE heat."""
    __tablename__ = "options_microstructure"

    ticker = Column(String(32), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    total_gex = Column(Float, nullable=True, comment="Total Gamma Exposure ($M per 1% move)")
    zero_dte_heat_ratio = Column(Float, nullable=True, comment="0DTE volume/OI concentration ratio")
    gamma_flip_level = Column(Float, nullable=True, comment="Dealer gamma flip strike price")
    call_wall = Column(Float, nullable=True, comment="Strike with highest positive gamma/open interest")
    put_wall = Column(Float, nullable=True, comment="Strike with highest negative gamma/open interest")
    skew_25d = Column(Float, nullable=True, comment="25-Delta Put IV minus 25-Delta Call IV")
    put_call_vol_ratio = Column(Float, nullable=True, comment="Put / Call volume ratio")
    crowding_z = Column(Float, nullable=True, comment="Options crowding Z-Score")

    __table_args__ = (
        PrimaryKeyConstraint("ticker", "date", name="pk_options_microstructure"),
        Index("idx_options_microstructure_lookup", "ticker", "date"),
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ticker": self.ticker,
            "date": self.date.isoformat() if self.date else None,
            "total_gex": self.total_gex,
            "zero_dte_heat_ratio": self.zero_dte_heat_ratio,
            "gamma_flip_level": self.gamma_flip_level,
            "call_wall": self.call_wall,
            "put_wall": self.put_wall,
            "skew_25d": self.skew_25d,
            "put_call_vol_ratio": self.put_call_vol_ratio,
            "crowding_z": self.crowding_z,
        }


class RegimeSnapshot(Base):
    """Daily macro regime nowcasts, quad probabilities, liquidity metrics, and portfolio weights."""
    __tablename__ = "regime_snapshots"

    date = Column(Date, primary_key=True, nullable=False, index=True)
    us_monthly_quad = Column(String(32), nullable=True, comment="Hedgeye monthly quad e.g. QUAD_1")
    us_quarterly_quad = Column(String(32), nullable=True, comment="Hedgeye quarterly quad e.g. QUAD_2")
    quad_1_prob = Column(Float, nullable=True, comment="Probability of Quad 1 (Growth+, Inflation-)")
    quad_2_prob = Column(Float, nullable=True, comment="Probability of Quad 2 (Growth+, Inflation+)")
    quad_3_prob = Column(Float, nullable=True, comment="Probability of Quad 3 (Growth-, Inflation+)")
    quad_4_prob = Column(Float, nullable=True, comment="Probability of Quad 4 (Growth-, Inflation-)")
    grid_regime = Column(String(64), nullable=True, comment="42 Macro Grid Regime label")
    grid_scores_json = Column(Text, nullable=True, comment="JSON string of Dr. Mo 70-factor Grid scores")
    prometheus_similarity_json = Column(Text, nullable=True, comment="JSON string of Prometheus historical match")
    net_liquidity_usd_bn = Column(Float, nullable=True, comment="Fed Net Liquidity in USD Billions (WALCL - WTREGEN - RRPONTSYD)")
    global_liquidity_usd_tn = Column(Float, nullable=True, comment="Global M2 / Central Bank Liquidity in USD Trillions")
    debt_to_liquidity_pct = Column(Float, nullable=True, comment="US Debt to Net Liquidity percentage")
    kiss_weights_json = Column(Text, nullable=True, comment="JSON string of optimal KISS portfolio allocations")

    @property
    def current_quad(self) -> str:
        if self.us_monthly_quad:
            return self.us_monthly_quad.replace("QUAD_", "")
        return "2"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "date": self.date.isoformat() if self.date else None,
            "us_monthly_quad": self.us_monthly_quad,
            "us_quarterly_quad": self.us_quarterly_quad,
            "quad_1_prob": self.quad_1_prob,
            "quad_2_prob": self.quad_2_prob,
            "quad_3_prob": self.quad_3_prob,
            "quad_4_prob": self.quad_4_prob,
            "grid_regime": self.grid_regime,
            "grid_scores_json": self.grid_scores_json,
            "prometheus_similarity_json": self.prometheus_similarity_json,
            "net_liquidity_usd_bn": self.net_liquidity_usd_bn,
            "global_liquidity_usd_tn": self.global_liquidity_usd_tn,
            "debt_to_liquidity_pct": self.debt_to_liquidity_pct,
            "kiss_weights_json": self.kiss_weights_json,
        }


class IntelligenceDelta(Base):
    """Extracted synthesis from expert podcasts, research reports, and interviews."""
    __tablename__ = "intelligence_deltas"

    id = Column(String(64), primary_key=True, nullable=False)
    timestamp_utc = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    framework_author = Column(String(128), nullable=False, index=True)  # Hedgeye, 42 Macro, Prometheus, etc.
    source_type = Column(String(64), nullable=False)                    # PODCAST, RESEARCH_NOTE, INTERVIEW
    source_title = Column(String(256), nullable=False)
    source_url = Column(String(512), nullable=True)
    published_at = Column(DateTime, nullable=True)
    summary_markdown = Column(Text, nullable=False)
    extracted_json = Column(Text, nullable=True)                         # Machine-parsed assertions and macro calls
    affected_tickers = Column(Text, nullable=True)                       # Comma-separated or JSON list of tickers

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "timestamp_utc": self.timestamp_utc.isoformat() if self.timestamp_utc else None,
            "framework_author": self.framework_author,
            "source_type": self.source_type,
            "source_title": self.source_title,
            "source_url": self.source_url,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "summary_markdown": self.summary_markdown,
            "extracted_json": self.extracted_json,
            "affected_tickers": self.affected_tickers,
        }
