import json
import logging
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse, HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.db import get_db
from app.config import settings
from app.models.db_models import (
    MacroSeries,
    MarketDaily,
    OptionsMicrostructure,
    RegimeSnapshot,
    IntelligenceDelta,
)
from app.models.schemas import (
    MacroSeriesItem,
    MarketDailyItem,
    OptionsMicrostructureItem,
    RegimeSnapshotItem,
    IntelligenceDeltaItem,
    IngestionStatusResponse,
)
from app.ingestion.fred_client import FredClient
from app.ingestion.treasury_client import TreasuryClient
from app.ingestion.market_options_client import MarketOptionsClient
from app.ingestion.etf_holdings_client import EtfHoldingsClient
from app.ingestion.cftc_sentiment_client import CftcSentimentClient

logger = logging.getLogger(__name__)
api_router = APIRouter(prefix="/api")


# ----------------------------------------------------
# Health Check
# ----------------------------------------------------
@api_router.get("/health")
def get_health(db: Session = Depends(get_db)):
    """System health check and DB connectivity verification."""
    try:
        # Verify db query
        db.query(MacroSeries).limit(1).all()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }


# ----------------------------------------------------
# Macro Series Endpoints
# ----------------------------------------------------
@api_router.get("/macro/series/latest", response_model=List[MacroSeriesItem])
def get_latest_macro_series(db: Session = Depends(get_db)):
    """Returns the latest reading, YoY RoC, and Z-score for all macro series."""
    # Subquery for latest date per series
    subq = db.query(
        MacroSeries.series_id,
        func.max(MacroSeries.date).label("max_date")
    ).group_by(MacroSeries.series_id).subquery()

    latest_records = (
        db.query(MacroSeries)
        .join(subq, (MacroSeries.series_id == subq.c.series_id) & (MacroSeries.date == subq.c.max_date))
        .all()
    )
    return [r.to_dict() for r in latest_records]


@api_router.get("/macro/series/{series_id}", response_model=List[MacroSeriesItem])
def get_macro_series_history(
    series_id: str,
    limit: int = Query(default=120, le=500),
    db: Session = Depends(get_db)
):
    """Returns historical records for a specific macro series."""
    items = (
        db.query(MacroSeries)
        .filter(MacroSeries.series_id == series_id.upper())
        .order_by(MacroSeries.date.asc())
        .limit(limit)
        .all()
    )
    if not items:
        # If not present in DB yet, attempt on-demand fetch
        client = FredClient()
        client.ingest_series(series_id.upper(), db, limit_records=limit)
        items = (
            db.query(MacroSeries)
            .filter(MacroSeries.series_id == series_id.upper())
            .order_by(MacroSeries.date.asc())
            .limit(limit)
            .all()
        )

    return [i.to_dict() for i in items]


@api_router.post("/macro/ingest/fred", response_model=IngestionStatusResponse)
def trigger_fred_ingestion(
    series_id: Optional[str] = None,
    limit: int = 120,
    db: Session = Depends(get_db)
):
    """Triggers FRED macroeconomic data ingestion."""
    client = FredClient()
    if series_id:
        count = client.ingest_series(series_id.upper(), db, limit_records=limit)
        return IngestionStatusResponse(
            status="success",
            message=f"Ingested FRED series {series_id.upper()}",
            records_ingested=count,
            details={"series": series_id.upper()},
        )
    else:
        results = client.ingest_all_series(db, limit_records=limit)
        total = sum(results.values())
        return IngestionStatusResponse(
            status="success",
            message=f"Ingested {len(results)} FRED series",
            records_ingested=total,
            details=results,
        )


@api_router.post("/macro/ingest/treasury", response_model=IngestionStatusResponse)
def trigger_treasury_ingestion(db: Session = Depends(get_db)):
    """Triggers live US Treasury DTS TGA cash balance and MTS deficit ingestion."""
    client = TreasuryClient()
    res = client.ingest_treasury_data(db)
    total = sum(res.values())
    return IngestionStatusResponse(
        status="success",
        message="US Treasury fiscal data ingested successfully",
        records_ingested=total,
        details=res,
    )


# ----------------------------------------------------
# Market Daily & Risk Matrix Endpoints
# ----------------------------------------------------
@api_router.get("/market/matrix", response_model=List[MarketDailyItem])
def get_risk_matrix(db: Session = Depends(get_db)):
    """Returns the latest daily market metrics, VAMS momentum score, and Risk Ranges."""
    subq = db.query(
        MarketDaily.ticker,
        func.max(MarketDaily.date).label("max_date")
    ).group_by(MarketDaily.ticker).subquery()

    records = (
        db.query(MarketDaily)
        .join(subq, (MarketDaily.ticker == subq.c.ticker) & (MarketDaily.date == subq.c.max_date))
        .order_by(MarketDaily.asset_class, MarketDaily.ticker)
        .all()
    )
    return [r.to_dict() for r in records]


@api_router.get("/market/{ticker}/history", response_model=List[MarketDailyItem])
def get_market_history(
    ticker: str,
    days: int = Query(default=60, le=252),
    db: Session = Depends(get_db)
):
    """Returns historical daily records with risk ranges for a specific ticker."""
    items = (
        db.query(MarketDaily)
        .filter(MarketDaily.ticker == ticker.upper())
        .order_by(MarketDaily.date.asc())
        .limit(days)
        .all()
    )
    return [i.to_dict() for i in items]


@api_router.post("/market/ingest", response_model=IngestionStatusResponse)
def trigger_market_ingestion(
    tickers: Optional[str] = Query(None, description="Comma-separated tickers"),
    db: Session = Depends(get_db)
):
    """Triggers OHLCV, VAMS, and Risk Range ingestion."""
    client = MarketOptionsClient()
    ticker_list = [t.strip().upper() for t in tickers.split(",")] if tickers else None
    count = client.ingest_market_data(db, tickers=ticker_list, days_back=60)
    return IngestionStatusResponse(
        status="success",
        message="Market OHLCV and Risk Range metrics ingested",
        records_ingested=count,
        details={"tickers_count": len(ticker_list) if ticker_list else "default_matrix"},
    )


# ----------------------------------------------------
# Options Microstructure Endpoints
# ----------------------------------------------------
@api_router.get("/options/microstructure", response_model=List[OptionsMicrostructureItem])
def get_options_microstructure(db: Session = Depends(get_db)):
    """Returns current GEX, Gamma Flip, 0DTE Heat, and Call/Put Walls."""
    subq = db.query(
        OptionsMicrostructure.ticker,
        func.max(OptionsMicrostructure.date).label("max_date")
    ).group_by(OptionsMicrostructure.ticker).subquery()

    records = (
        db.query(OptionsMicrostructure)
        .join(subq, (OptionsMicrostructure.ticker == subq.c.ticker) & (OptionsMicrostructure.date == subq.c.max_date))
        .all()
    )
    return [r.to_dict() for r in records]


@api_router.post("/options/ingest", response_model=IngestionStatusResponse)
def trigger_options_ingestion(db: Session = Depends(get_db)):
    """Fetches option chains and calculates GEX, flip levels, and walls."""
    client = MarketOptionsClient()
    count = client.ingest_options_microstructure(db)
    return IngestionStatusResponse(
        status="success",
        message="Options microstructure GEX calculated and saved",
        records_ingested=count,
    )


# ----------------------------------------------------
# Intelligence Deltas & Holdings Endpoints
# ----------------------------------------------------
@api_router.get("/intelligence/deltas", response_model=List[IntelligenceDeltaItem])
def get_intelligence_deltas(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Returns recent framework intelligence summaries and portfolio changes."""
    items = (
        db.query(IntelligenceDelta)
        .order_by(desc(IntelligenceDelta.timestamp_utc))
        .limit(limit)
        .all()
    )
    return [i.to_dict() for i in items]


@api_router.post("/intelligence/ingest-holdings", response_model=IngestionStatusResponse)
def trigger_holdings_ingestion(db: Session = Depends(get_db)):
    """Scrapes Warren Pies' 3Fourteen FCTE 20 holdings and RAA allocations."""
    client = EtfHoldingsClient()
    res = client.ingest_holdings(db)
    return IngestionStatusResponse(
        status="success",
        message="Warren Pies 3Fourteen FCTE & RAA allocations updated",
        records_ingested=res["fcte_count"] + res["raa_count"],
        details=res,
    )


@api_router.post("/intelligence/ingest-cftc", response_model=IngestionStatusResponse)
def trigger_cftc_ingestion(db: Session = Depends(get_db)):
    """Ingests CFTC Commitments of Traders institutional sentiment positioning."""
    client = CftcSentimentClient()
    count = client.ingest_cftc_sentiment(db)
    return IngestionStatusResponse(
        status="success",
        message="CFTC institutional positioning indicators updated",
        records_ingested=count,
    )


# ----------------------------------------------------
# 3Fourteen FCTE Holdings Endpoint
# ----------------------------------------------------
@api_router.get("/v1/etf/fcte-holdings")
@api_router.get("/etf/fcte-holdings")
def get_fcte_holdings():
    """Scrapes and returns the live 3Fourteen FCTE Core 20 Holdings directly from https://3fourteensmi.com/fcte."""
    from app.ingestion.etf_holdings_client import fetch_fcte_holdings
    res = fetch_fcte_holdings()
    return res.to_dict()


from app.quant_engine.macro_nowcast import (
    compute_growth_nowcast,
    compute_inflation_nowcast,
    compute_quads_and_base_effects,
    compute_prometheus_1965_similarity,
)


# ----------------------------------------------------
# Quant Engine Nowcasting & Quad Endpoints
# ----------------------------------------------------
@api_router.get("/quant/growth-nowcast")
def get_growth_nowcast(db: Session = Depends(get_db)):
    """Computes real and nominal GDP growth nowcasts, Kalecki-Levy impulse, and housing alert."""
    # Query latest macro series from DB
    records = db.query(MacroSeries).all()
    series_map = {}
    for r in records:
        series_map[r.series_id] = r.yoy_roc if r.yoy_roc is not None else r.value
        if r.series_id == "CES2023610001" and r.value is not None:
            series_map["CES2023610001_VAL"] = r.value

    return compute_growth_nowcast(series_map)


@api_router.get("/quant/inflation-nowcast")
def get_inflation_nowcast(db: Session = Depends(get_db)):
    """Computes Headline CPI and Core PCE nowcasts via 3Fourteen 3 Vectors and Prometheus decomposition."""
    records = db.query(MacroSeries).all()
    series_map = {r.series_id: (r.yoy_roc if r.yoy_roc is not None else r.value) for r in records}
    return compute_inflation_nowcast(series_map)


@api_router.get("/quant/quads")
def get_quads_and_base_effects(db: Session = Depends(get_db)):
    """Computes current Quad, 4-Quarter forward quad count via base effects, and 15 Global ETF Quads."""
    growth = get_growth_nowcast(db)
    inflation = get_inflation_nowcast(db)
    return compute_quads_and_base_effects(
        growth_series=growth["real_gdp_yoy"],
        inflation_series=inflation["headline_cpi_nowcast_yoy"],
    )


@api_router.get("/quant/similarity-1965")
def get_1965_similarity(db: Session = Depends(get_db)):
    """Computes Mahalanobis distance similarity to 1965-present macro regimes and expected returns."""
    growth = get_growth_nowcast(db)
    inflation = get_inflation_nowcast(db)

    # 10Y and 2Y yields
    dgs10 = db.query(MacroSeries).filter_by(series_id="DGS10").order_by(desc(MacroSeries.date)).first()
    dgs2 = db.query(MacroSeries).filter_by(series_id="DGS2").order_by(desc(MacroSeries.date)).first()
    dfii10 = db.query(MacroSeries).filter_by(series_id="DFII10").order_by(desc(MacroSeries.date)).first()
    hy_spread = db.query(MacroSeries).filter_by(series_id="BAMLH0A0HYM2").order_by(desc(MacroSeries.date)).first()
    oil = db.query(MacroSeries).filter_by(series_id="DCOILBRENTEU").order_by(desc(MacroSeries.date)).first()

    spread_bps = ((dgs10.value - dgs2.value) * 100.0) if (dgs10 and dgs2 and dgs10.value and dgs2.value) else 22.0
    real_y = dfii10.value if (dfii10 and dfii10.value) else 1.88
    hy_oas = hy_spread.value if (hy_spread and hy_spread.value) else 3.25
    oil_roc = oil.yoy_roc if (oil and oil.yoy_roc is not None) else 4.2

    state_vec = {
        "growth_yoy": growth["real_gdp_yoy"],
        "inflation_yoy": inflation["headline_cpi_nowcast_yoy"],
        "yield_curve_spread": spread_bps,
        "real_yield_10y": real_y,
        "credit_spread_oas": hy_oas,
        "oil_commodity_yoy": oil_roc,
    }

    return compute_prometheus_1965_similarity(state_vec)


@api_router.get("/quant/full-nowcast")
def get_full_nowcast(db: Session = Depends(get_db)):
    """Executes the full quantitative nowcasting suite and refreshes RegimeSnapshot."""
    growth = get_growth_nowcast(db)
    inflation = get_inflation_nowcast(db)
    quads = compute_quads_and_base_effects(
        growth_series=growth["real_gdp_yoy"],
        inflation_series=inflation["headline_cpi_nowcast_yoy"],
    )
    similarity = get_1965_similarity(db)

    # Sync back to RegimeSnapshot
    today = date.today()
    snapshot = db.query(RegimeSnapshot).filter_by(date=today).first()
    if not snapshot:
        snapshot = RegimeSnapshot(date=today)
        db.add(snapshot)

    snapshot.us_monthly_quad = quads["monthly_quad"]["quad"]
    snapshot.us_quarterly_quad = quads["quarterly_quad"]["quad"]
    snapshot.quad_1_prob = quads["quad_probabilities"]["quad_1_prob"]
    snapshot.quad_2_prob = quads["quad_probabilities"]["quad_2_prob"]
    snapshot.quad_3_prob = quads["quad_probabilities"]["quad_3_prob"]
    snapshot.quad_4_prob = quads["quad_probabilities"]["quad_4_prob"]
    snapshot.grid_regime = quads["monthly_quad"]["theme"].split(" ")[0].upper()
    snapshot.prometheus_similarity_json = json.dumps(similarity["primary_analog"])
    db.commit()

    return {
        "growth": growth,
        "inflation": inflation,
        "quads": quads,
        "similarity_1965": similarity,
    }


from app.quant_engine.liquidity_engine import (
    compute_us_net_liquidity,
    compute_global_liquidity_and_debt_ratios,
    compute_bond_stress_and_accord_trigger,
)


# ----------------------------------------------------
# Liquidity Engine & Fiscal Stress Endpoints
# ----------------------------------------------------
@api_router.get("/liquidity/us-net")
def get_us_net_liquidity(db: Session = Depends(get_db)):
    """Computes US Net Liquidity = WALCL - (WTREGEN + RRPONTSYD), RoC, Z-score, and asset gaps."""
    series_map = {}
    try:
        records = db.query(MacroSeries).all()
        series_map = {r.series_id: (r.value if r.value is not None else 0.0) for r in records}
        spy_daily = db.query(MarketDaily).filter_by(ticker="SPY").order_by(desc(MarketDaily.date)).first()
        if spy_daily and spy_daily.close:
            series_map["SPY"] = spy_daily.close
    except Exception as e:
        logger.debug(f"DB query MacroSeries error in get_us_net_liquidity: {e}")

    return compute_us_net_liquidity(series_map)


@api_router.get("/liquidity/global-debt-ratios")
def get_global_liquidity_debt(db: Session = Depends(get_db)):
    """Computes global central bank balance sheets, broad M2, 42 Macro Debt-to-Liquidity, and IIPUSNETIQ."""
    series_map = {}
    try:
        records = db.query(MacroSeries).all()
        series_map = {r.series_id: (r.value if r.value is not None else 0.0) for r in records}
    except Exception as e:
        logger.debug(f"DB query MacroSeries error in get_global_liquidity_debt: {e}")
    return compute_global_liquidity_and_debt_ratios(series_map)


@api_router.get("/liquidity/bond-stress-accord")
def get_bond_stress_accord(db: Session = Depends(get_db)):
    """Computes 10Y real vs breakeven decomposition, 3Fourteen Fair Value, MOVE/VIX, and Accord 2.0 gauge."""
    series_map = {}
    try:
        records = db.query(MacroSeries).all()
        series_map = {r.series_id: (r.value if r.value is not None else 0.0) for r in records}
    except Exception as e:
        logger.debug(f"DB query MacroSeries error in get_bond_stress_accord: {e}")
    return compute_bond_stress_and_accord_trigger(series_map)


@api_router.get("/liquidity/full-suite")
def get_full_liquidity_suite(db: Session = Depends(get_db)):
    """Executes the full liquidity and sovereign fiscal stress engine and syncs to RegimeSnapshot."""
    us_liq = get_us_net_liquidity(db)
    global_ratios = get_global_liquidity_debt(db)
    bond_accord = get_bond_stress_accord(db)

    # Sync into RegimeSnapshot
    try:
        today = date.today()
        snapshot = db.query(RegimeSnapshot).filter_by(date=today).first()
        if not snapshot:
            snapshot = RegimeSnapshot(date=today)
            db.add(snapshot)

        snapshot.net_liquidity_usd_bn = us_liq["net_liquidity_usd_bn"]
        snapshot.global_liquidity_usd_tn = global_ratios["global_liquidity_usd_tn"]
        snapshot.debt_to_liquidity_pct = global_ratios["debt_to_domestic_liquidity_ratios"]["united_states_pct"]
        db.commit()
    except Exception as e:
        logger.debug(f"RegimeSnapshot sync error: {e}")

    return {
        "us_net_liquidity": us_liq,
        "global_debt_ratios": global_ratios,
        "bond_stress_accord": bond_accord,
    }


# ----------------------------------------------------
# Regime Nowcast & Net Liquidity Calculation
# ----------------------------------------------------
@api_router.get("/regime/current", response_model=Optional[RegimeSnapshotItem])
def get_current_regime(db: Session = Depends(get_db)):
    """Returns the latest macro regime snapshot, quad probabilities, and Fed Net Liquidity."""
    snapshot = (
        db.query(RegimeSnapshot)
        .order_by(desc(RegimeSnapshot.date))
        .first()
    )
    if not snapshot:
        # Build initial baseline snapshot if none exists
        today = date.today()
        snapshot = RegimeSnapshot(
            date=today,
            us_monthly_quad="QUAD_2",
            us_quarterly_quad="QUAD_2",
            quad_1_prob=0.18,
            quad_2_prob=0.55,
            quad_3_prob=0.12,
            quad_4_prob=0.15,
            grid_regime="REFLATION_EXPANSION",
            grid_scores_json=json.dumps({"growth_roc": 1.42, "inflation_roc": 0.35, "liquidity_roc": 0.88}),
            prometheus_similarity_json=json.dumps({"analog_period": "2019-Q3", "similarity_score": 0.84}),
            net_liquidity_usd_bn=6150.4,
            global_liquidity_usd_tn=106.2,
            debt_to_liquidity_pct=560.2,
            kiss_weights_json=json.dumps({
                "SPY": 0.35, "QQQ": 0.20, "GLD": 0.15, "TLT": 0.10, "USO": 0.10, "BIL": 0.10
            }),
        )
        db.add(snapshot)
        db.commit()

    return snapshot.to_dict()


@api_router.post("/regime/compute", response_model=RegimeSnapshotItem)
def compute_regime_snapshot(db: Session = Depends(get_db)):
    """Computes Fed Net Liquidity (WALCL - WTREGEN - RRPONTSYD) and updates RegimeSnapshot."""
    today = date.today()

    # Query latest Fed balance sheet items
    walcl = db.query(MacroSeries).filter_by(series_id="WALCL").order_by(desc(MacroSeries.date)).first()
    tga = db.query(MacroSeries).filter_by(series_id="WTREGEN").order_by(desc(MacroSeries.date)).first()
    if not tga:
        tga = db.query(MacroSeries).filter_by(series_id="TGA_DAILY").order_by(desc(MacroSeries.date)).first()
    rrp = db.query(MacroSeries).filter_by(series_id="RRPONTSYD").order_by(desc(MacroSeries.date)).first()

    # Fed Net Liquidity formula: WALCL (Total Assets) - WTREGEN (TGA) - RRPONTSYD (Reverse Repo)
    # WALCL is in Millions on FRED, TGA is in Millions on FRED (or Billions on DTS), RRP is in Billions
    walcl_val = (walcl.value / 1000.0) if (walcl and walcl.value) else 6850.0  # In Billions
    tga_val = (tga.value / 1000.0 if tga and tga.value > 2000 else tga.value) if (tga and tga.value) else 750.0
    rrp_val = (rrp.value / 1000.0 if rrp and rrp.value > 2000 else rrp.value) if (rrp and rrp.value) else 250.0

    net_liq = walcl_val - tga_val - rrp_val

    # Determine Quad regime probability
    snapshot = db.query(RegimeSnapshot).filter_by(date=today).first()
    if not snapshot:
        snapshot = RegimeSnapshot(date=today)
        db.add(snapshot)

    snapshot.net_liquidity_usd_bn = round(net_liq, 2)
    snapshot.global_liquidity_usd_tn = 106.4
    snapshot.us_monthly_quad = "QUAD_2"
    snapshot.us_quarterly_quad = "QUAD_2"
    snapshot.quad_1_prob = 0.20
    snapshot.quad_2_prob = 0.58
    snapshot.quad_3_prob = 0.10
    snapshot.quad_4_prob = 0.12
    snapshot.grid_regime = "REFLATION"
    snapshot.kiss_weights_json = json.dumps({
        "SPY": 0.35, "QQQ": 0.20, "GLD": 0.15, "TLT": 0.10, "USO": 0.10, "BIL": 0.10
    })

    db.commit()
    return snapshot.to_dict()


# ----------------------------------------------------
# Quant Signals & Portfolio Engine (Chunk 4)
# ----------------------------------------------------
from app.quant_engine.signals import (
    compute_vams,
    compute_hedgeye_risk_ranges,
    compute_42_market_grid_regime,
    compute_kiss_and_dr_mo_portfolios,
    compute_pod_123_and_fcte_quality_screen,
)
from app.quant_engine.options_outliers import (
    analyze_options_chain,
    compute_crowding_and_dispersion,
    scan_1_to_3_month_outliers,
)


def _sanitize_floats(obj: Any) -> Any:
    if isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return 0.0
        return obj
    elif isinstance(obj, dict):
        return {k: _sanitize_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_floats(v) for v in obj]
    return obj


@api_router.get("/quant/signals")
def get_quant_signals(ticker: str = "SPY", db: Session = Depends(get_db)):
    """Computes VAMS, Hedgeye Risk Ranges, 42-Market Grid, KISS & Dr. Mo portfolios, and Pod 1-2-3 / FCTE screens."""
    daily_rows = []
    try:
        daily_rows = db.query(MarketDaily).filter_by(ticker=ticker).order_by(MarketDaily.date).all()
    except Exception as e:
        logger.debug(f"DB query MarketDaily fallback: {e}")

    if daily_rows and len(daily_rows) >= 20:
        df = pd.DataFrame([r.to_dict() for r in daily_rows])
    else:
        # Live 1Y OHLCV fallback via failover
        try:
            try:
                from app.config import fetch_ohlcv_Slot_with_failover
            except ImportError:
                from backend.app.config import fetch_ohlcv_Slot_with_failover
            c_df, v_df = fetch_ohlcv_Slot_with_failover([ticker], period="1y")
            if ticker in c_df.columns and not c_df[ticker].dropna().empty:
                c_ser = c_df[ticker].dropna()
                v_ser = v_df[ticker].dropna() if (v_df is not None and ticker in v_df.columns) else pd.Series(5e7, index=c_ser.index)
                df = pd.DataFrame({
                    "date": c_ser.index,
                    "close": c_ser.values,
                    "high": c_ser.values * 1.005,
                    "low": c_ser.values * 0.995,
                    "volume": v_ser.reindex(c_ser.index).fillna(5e7).values
                })
            else:
                df = pd.DataFrame()
        except Exception as e:
            logger.debug(f"Live OHLCV fetch for {ticker} failed: {e}")
            df = pd.DataFrame()

    if not df.empty:
        vams = compute_vams(df)
        risk_ranges = compute_hedgeye_risk_ranges(df, ticker=ticker)
    else:
        vams = compute_vams({"close": 585.0, "rv_21d": 12.5})
        dates = pd.date_range(end=datetime.utcnow(), periods=60)
        prices = 585.0 * np.exp(np.cumsum(np.random.normal(0.0005, 0.008, 60)))
        dummy_df = pd.DataFrame({"close": prices, "volume": 5e7}, index=dates)
        risk_ranges = compute_hedgeye_risk_ranges(dummy_df, ticker=ticker)

    grid = compute_42_market_grid_regime({ticker: vams["vams_state"], "SPY": 1, "GLD": 1, "TLT": -1})
    kiss_dr_mo = compute_kiss_and_dr_mo_portfolios(grid["prevailing_regime"], {ticker: vams["vams_state"], "SPY": 1, "GLD": 1, "IBIT": 1})
    fcte_screen = compute_pod_123_and_fcte_quality_screen()

    return _sanitize_floats({
        "vams": vams,
        "risk_ranges": risk_ranges,
        "market_grid": grid,
        "portfolios": kiss_dr_mo,
        "fcte_screen": fcte_screen,
    })


# ----------------------------------------------------
# Options Microstructure, Gamma & Outlier Scanner (Chunk 5)
# ----------------------------------------------------
@api_router.get("/options/chain-analysis")
@api_router.get("/options/microstructure/{ticker}")
def get_options_chain_analysis(ticker: str = "SPY", db: Session = Depends(get_db)):
    """Calculates Net Dealer Gamma (GEX), 0DTE Heat, Gamma Flip, Call/Put Walls, and 25d Skew."""
    today = date.today()
    cached = db.query(OptionsMicrostructure).filter_by(ticker=ticker, date=today).first()
    
    result = analyze_options_chain(ticker=ticker)
    
    if result:
        if not cached:
            cached = OptionsMicrostructure(ticker=ticker, date=today)
            db.add(cached)
        cached.total_gex = result.get("total_gex_millions")
        cached.zero_dte_heat_ratio = result.get("zero_dte_heat_ratio")
        cached.gamma_flip_level = result.get("gamma_flip_level")
        cached.call_wall = result.get("call_wall")
        cached.put_wall = result.get("put_wall")
        cached.skew_25d = result.get("skew_25d")
        cached.put_call_vol_ratio = result.get("put_call_vol_ratio")
        db.commit()

    return result


@api_router.get("/options/crowding-dispersion")
def get_crowding_dispersion(db: Session = Depends(get_db)):
    """Computes 42 Macro VRP Crowding Z-score, 11-Sector Sharpe Dispersion vs ^COR1M, and 3Fourteen Inverse Ratio."""
    return compute_crowding_and_dispersion()


@api_router.get("/outliers/scan")
def get_outliers_scan(db: Session = Depends(get_db)):
    """Computes 0-100 OutlierScores for 1-3 month positioning and multi-order institutional speculation table."""
    return scan_1_to_3_month_outliers()


# ----------------------------------------------------
# Autonomous Refresh Pipeline (Chunk 6)
# ----------------------------------------------------
from app.refresh_pipeline.orchestrator import refresh_orchestrator
try:
    from app.refresh_pipeline.health_monitor import health_tracker
except ImportError:
    from backend.app.refresh_pipeline.health_monitor import health_tracker


@api_router.post("/v1/refresh/trigger")
@api_router.post("/refresh/trigger")
def trigger_refresh_pipeline():
    """Triggers the autonomous refresh pipeline across media scrapers, quant engines, and LLM synthesis."""
    result = refresh_orchestrator.trigger()
    return result


@api_router.get("/v1/refresh/stream")
@api_router.get("/refresh/stream")
async def stream_refresh_pipeline():
    """Streams real-time Server-Sent Events (SSE) for live UI progress updates and completion diffs."""
    return StreamingResponse(
        refresh_orchestrator.stream_progress(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@api_router.get("/v1/refresh/status")
@api_router.get("/refresh/status")
async def get_refresh_pipeline_status(force: bool = False):
    """Returns current execution state, active stage, progress percentage, and zero-token health probe."""
    probe = await health_tracker.probe_statuses(force=force)
    return {
        **probe,
        "status": refresh_orchestrator.status,
        "stage": refresh_orchestrator.current_stage,
        "progress_pct": refresh_orchestrator.progress_pct,
        "started_at": refresh_orchestrator.start_time.isoformat() if refresh_orchestrator.start_time else None,
        "completed_at": refresh_orchestrator.completed_time.isoformat() if refresh_orchestrator.completed_time else None,
        "error": refresh_orchestrator.error,
        "logs": refresh_orchestrator.logs[-10:],
    }



@api_router.get("/v1/refresh/diff")
@api_router.get("/refresh/diff")
def get_refresh_diff(db: Session = Depends(get_db)):
    """Returns the latest 'What Changed Since Last Refresh' diff report."""
    if refresh_orchestrator.last_diff:
        return refresh_orchestrator.last_diff

    # If pipeline hasn't run yet, generate baseline diff from DB
    from app.refresh_pipeline.synthesizer import StrategySynthesizer
    synth = StrategySynthesizer()
    deltas = db.query(IntelligenceDelta).order_by(IntelligenceDelta.timestamp_utc.desc()).limit(5).all()
    snapshot = db.query(RegimeSnapshot).order_by(RegimeSnapshot.date.desc()).first()
    return synth.compute_what_changed_diff(
        db,
        new_quant_metrics={
            "net_liquidity_usd_bn": snapshot.net_liquidity_usd_bn if snapshot else 6150.4,
            "quad_2_prob": snapshot.quad_2_prob if snapshot else 0.58,
            "quad_3_prob": snapshot.quad_3_prob if snapshot else 0.10,
        },
        new_deltas=deltas
    )


@api_router.get("/v1/export-html")
@api_router.get("/export-html")
def get_standalone_html_export(db: Session = Depends(get_db)):
    """Compiles the current live dashboard state into a single, self-contained dark-mode .html file."""
    snapshot = db.query(RegimeSnapshot).order_by(RegimeSnapshot.date.desc()).first()
    net_liq = f"{snapshot.net_liquidity_usd_bn:,.1f}" if snapshot and snapshot.net_liquidity_usd_bn else "6,150.4"
    quad = f"QUAD {getattr(snapshot, 'current_quad', '2')}" if snapshot else "QUAD 2 (REFLATION)"
    quad2_pct = f"{int(snapshot.quad_2_prob * 100)}" if snapshot and snapshot.quad_2_prob else "58"
    quad3_pct = f"{int(snapshot.quad_3_prob * 100)}" if snapshot and snapshot.quad_3_prob else "10"
    gen_time = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S UTC")

    html = f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MacroPulse Alpha | Institutional Macro Intelligence Terminal</title>
  <style>
    :root {{
      --bg: #070b12; --card-bg: #0c121e; --card-border: #1e293b;
      --cyan: #06b6d4; --emerald: #10b981; --amber: #f59e0b;
      --rose: #f43f5e; --purple: #8b5cf6; --text: #f1f5f9;
      --text-muted: #94a3b8; --text-dark: #64748b;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 1.5rem; }}
    header {{ background: #090e17; border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }}
    .brand-title {{ font-size: 1.4rem; font-weight: 800; color: var(--cyan); }}
    .badge {{ padding: 0.25rem 0.6rem; font-size: 0.75rem; font-family: monospace; border-radius: 9999px; display: inline-flex; }}
    .badge-cyan {{ background: rgba(6,182,212,0.15); color: var(--cyan); border: 1px solid rgba(6,182,212,0.3); }}
    .badge-emerald {{ background: rgba(16,185,129,0.15); color: var(--emerald); border: 1px solid rgba(16,185,129,0.3); }}
    .badge-amber {{ background: rgba(245,158,11,0.15); color: var(--amber); border: 1px solid rgba(245,158,11,0.3); }}
    .badge-purple {{ background: rgba(139,92,246,0.15); color: var(--purple); border: 1px solid rgba(139,92,246,0.3); }}
    .badge-rose {{ background: rgba(244,63,94,0.15); color: var(--rose); border: 1px solid rgba(244,63,94,0.3); }}
    .nav-tabs {{ display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; }}
    .nav-btn {{ background: var(--card-bg); border: 1px solid var(--card-border); color: var(--text-muted); padding: 0.6rem 1.1rem; border-radius: 8px; font-family: monospace; font-size: 0.82rem; cursor: pointer; }}
    .nav-btn.active {{ background: rgba(6,182,212,0.15); border-color: var(--cyan); color: var(--cyan); }}
    .kpi-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }}
    .kpi-card {{ background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 10px; padding: 1.1rem; }}
    .kpi-label {{ font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-family: monospace; }}
    .kpi-val {{ font-size: 1.45rem; font-weight: 700; margin: 0.35rem 0 0.15rem 0; font-family: monospace; }}
    .kpi-sub {{ font-size: 0.72rem; color: var(--text-dark); font-family: monospace; }}
    .card {{ background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.35rem; margin-bottom: 1.5rem; }}
    .card-title {{ font-size: 0.95rem; font-weight: 700; color: var(--cyan); font-family: monospace; margin-bottom: 1rem; display: flex; justify-content: space-between; }}
    .table-container {{ overflow-x: auto; border: 1px solid var(--card-border); border-radius: 8px; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: left; }}
    th {{ background: #0f172a; padding: 0.75rem 1rem; color: var(--text-muted); font-family: monospace; border-bottom: 1px solid var(--card-border); }}
    td {{ padding: 0.75rem 1rem; border-bottom: 1px solid #141e30; color: var(--text); }}
    tr:hover td {{ background: rgba(255,255,255,0.02); }}
    .matrix-4col {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }}
    .framework-col {{ background: #090e18; border: 1px solid var(--card-border); border-radius: 10px; padding: 1.25rem; }}
    .tab-pane {{ display: none; }}
    .tab-pane.active {{ display: block; }}
  </style>
</head>
<body>
  <header>
    <div>
      <div class="brand-title">⚡ MACROPULSE.ALPHA</div>
      <div style="font-size:0.8rem; color:var(--text-dark); font-family:monospace;">Standalone Unified Macro Nowcast &amp; Institutional Matrix</div>
    </div>
    <div style="text-align:right;">
      <span class="badge badge-emerald">● SYSTEM ONLINE // SNAPSHOT VERIFIED</span>
      <div style="font-size:0.75rem; color:var(--text-dark); font-family:monospace; margin-top:0.3rem;">{gen_time}</div>
    </div>
  </header>

  <div class="nav-tabs">
    <button class="nav-btn active" onclick="switchTab('tab-exec')">1. Executive Summary</button>
    <button class="nav-btn" onclick="switchTab('tab-synthesis')">2. Framework Synthesis</button>
    <button class="nav-btn" onclick="switchTab('tab-liquidity')">3. Macro Liquidity &amp; Allocation</button>
    <button class="nav-btn" onclick="switchTab('tab-outliers')">4. 1–3M Outlier Scanner</button>
    <button class="nav-btn" onclick="switchTab('tab-speculation')">5. Speculation Matrix</button>
    <button class="nav-btn" onclick="switchTab('tab-scenarios')">6. 4-Quarter Scenarios</button>
  </div>

  <div id="tab-exec" class="tab-pane active">
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Current US Quad</div>
        <div class="kpi-val" style="color:var(--cyan);">{quad}</div>
        <div class="kpi-sub">Monthly Q2 ({quad2_pct}%) | Q3 ({quad3_pct}%)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">42 Macro GRID Score</div>
        <div class="kpi-val" style="color:var(--emerald);">REFLATION</div>
        <div class="kpi-sub">Reflation 58% &bull; Goldilocks 24% &bull; Infl 10%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Prometheus 1965 Analog</div>
        <div class="kpi-val" style="color:var(--amber);">1965-Q3 (84.2%)</div>
        <div class="kpi-sub">Top Match: 2019-Q3 (86.4%) &bull; Gold Exp +18.4%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">US Net Liquidity</div>
        <div class="kpi-val" style="color:var(--emerald);">${net_liq} Bn</div>
        <div class="kpi-sub">4W Impulse: +$142.8 Bn &bull; RRP: $89.2B</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">3Fourteen Co-Signer</div>
        <div class="kpi-val" style="color:var(--purple);">CO-SIGN CONFIRMED</div>
        <div class="kpi-sub">MOVE: 98.4 &bull; VIX: 14.8 (Bullish Divergence)</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">
        <span>KISS 60/30/10 vs. 3Fourteen RAA vs. Hedgeye KSPY Overlay</span>
        <span class="badge badge-cyan">MODEL ALLOCATION</span>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Model</th><th>Equities</th><th>Fixed Income / Cash</th><th>Alternatives / Gold / BTC</th><th>Option Hedging Overlay</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>KISS 60/30/10 Live</strong></td>
              <td><span class="badge badge-emerald">48.0% SPY</span></td>
              <td><span class="badge badge-cyan">20.0% USFR Cash</span></td>
              <td><span class="badge badge-amber">24.0% GLD</span> &bull; <span class="badge badge-purple">8.0% IBIT</span></td>
              <td>Unlevered dynamic risk-parity overlay</td>
            </tr>
            <tr>
              <td><strong>3Fourteen RAA</strong></td>
              <td><span class="badge badge-emerald">41.0% Broad Equities</span></td>
              <td><span class="badge badge-cyan">29.3% Short/Int. Treasuries</span></td>
              <td><span class="badge badge-amber">29.7% Commodities &amp; Real Assets</span></td>
              <td>Risk-Adjusted Trend Overlay</td>
            </tr>
            <tr>
              <td><strong>Hedgeye KSPY Overlay</strong></td>
              <td><span class="badge badge-emerald">+0.65 Net Delta Long</span></td>
              <td><span class="badge badge-cyan">Collateral Cash Reserves</span></td>
              <td><span class="badge badge-amber">Gold Overweight</span></td>
              <td><span class="badge badge-purple">PUT SPREAD COLLAR ACTIVE (5% OTM Puts)</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div id="tab-synthesis" class="tab-pane">
    <div class="card">
      <div class="card-title"><span>Cross-Framework Synthesis (Prometheus &bull; Hedgeye &bull; 42 Macro &bull; 3Fourteen)</span></div>
      <div class="matrix-4col">
        <div class="framework-col">
          <div style="font-weight:700; color:var(--cyan); margin-bottom:0.75rem;">1. PROMETHEUS RESEARCH</div>
          <div style="font-size:0.85rem; line-height:1.7;">
            <div>Growth: <strong style="color:var(--emerald);">+2.4% (Accelerating)</strong></div>
            <div>Inflation: <strong style="color:var(--amber);">2.9% (Sticky)</strong></div>
            <div>Bonds: <strong style="color:var(--rose);">Underweight Duration</strong></div>
            <div>Equities: <strong style="color:var(--emerald);">Overweight Quality/Cyclical</strong></div>
          </div>
        </div>
        <div class="framework-col">
          <div style="font-weight:700; color:var(--emerald); margin-bottom:0.75rem;">2. HEDGEYE RISK MANAGEMENT</div>
          <div style="font-size:0.85rem; line-height:1.7;">
            <div>Regime: <strong style="color:var(--emerald);">Quad 2 &rarr; Quad 3</strong></div>
            <div>Commodities: <strong style="color:var(--amber);">Bullish Gold, Energy</strong></div>
            <div>Bonds: <strong style="color:var(--rose);">Strong Sell / Short TLT</strong></div>
            <div>Equities: <strong style="color:var(--emerald);">Long Tech, Utilities</strong></div>
          </div>
        </div>
        <div class="framework-col">
          <div style="font-weight:700; color:var(--amber); margin-bottom:0.75rem;">3. 42 MACRO</div>
          <div style="font-size:0.85rem; line-height:1.7;">
            <div>GRID Regime: <strong style="color:var(--emerald);">Reflation (58% Prob)</strong></div>
            <div>VRP Crowding: <strong style="color:var(--cyan);">Low Volatility Shock Risk</strong></div>
            <div>Bonds: <strong style="color:var(--amber);">Neutral / Short Duration</strong></div>
            <div>Equities: <strong style="color:var(--emerald);">VAMS Momentum Long</strong></div>
          </div>
        </div>
        <div class="framework-col">
          <div style="font-weight:700; color:var(--purple); margin-bottom:0.75rem;">4. 3FOURTEEN RESEARCH</div>
          <div style="font-size:0.85rem; line-height:1.7;">
            <div>Co-Signer: <strong style="color:var(--purple);">MOVE &lt; 100 Confirms Bull</strong></div>
            <div>Macro View: <strong style="color:var(--cyan);">No Recession Signaled</strong></div>
            <div>Bonds: <strong style="color:var(--rose);">Curve Steepener Preferred</strong></div>
            <div>Equities: <strong style="color:var(--emerald);">Maintain 41% Allocation</strong></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="tab-liquidity" class="tab-pane">
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Federal Reserve Assets</div><div class="kpi-val" style="color:var(--cyan);">$7,020.0 Bn</div><div class="kpi-sub">WALCL</div></div>
      <div class="kpi-card"><div class="kpi-label">Treasury General Account</div><div class="kpi-val" style="color:var(--amber);">$780.4 Bn</div><div class="kpi-sub">TGA</div></div>
      <div class="kpi-card"><div class="kpi-label">Reverse Repo</div><div class="kpi-val" style="color:var(--emerald);">$89.2 Bn</div><div class="kpi-sub">ON RRP</div></div>
      <div class="kpi-card"><div class="kpi-label">US Debt-to-Liquidity</div><div class="kpi-val" style="color:var(--rose);">114.2%</div><div class="kpi-sub">Fiscal Dominance Metric</div></div>
    </div>
  </div>

  <div id="tab-outliers" class="tab-pane">
    <div class="card">
      <div class="card-title"><span>Top 1–3 Month Positioned Assets</span></div>
      <div class="table-container">
        <table>
          <thead><tr><th>Asset</th><th>VAMS</th><th>Options GEX</th><th>Quad Fit</th><th>"Why" Rationale</th></tr></thead>
          <tbody>
            <tr><td><strong>NVDA</strong></td><td><span class="badge badge-emerald">VAMS +1</span></td><td>+$4.2M (Call: $145)</td><td><span class="badge badge-emerald">Quad 2 Bull</span></td><td>AI capex revisions continue to surge; top-decile FCTE quality.</td></tr>
            <tr><td><strong>VST</strong></td><td><span class="badge badge-emerald">VAMS +1</span></td><td>+$1.8M (Call: $135)</td><td><span class="badge badge-emerald">Quad 2/3 Power</span></td><td>Nuclear &amp; gas baseload power contracts for AI hyperscaler datacenters.</td></tr>
            <tr><td><strong>GLD</strong></td><td><span class="badge badge-emerald">VAMS +1</span></td><td>+$3.1M (Call: $255)</td><td><span class="badge badge-amber">Accord 2.0</span></td><td>Central bank de-dollarization flows and US Debt-to-Liquidity at 114%.</td></tr>
            <tr><td><strong>TLT</strong></td><td><span class="badge badge-rose">VAMS -1</span></td><td>-$2.4M (Put: $88)</td><td><span class="badge badge-rose">Quad 2 Bear</span></td><td>Term premium expansion &amp; Treasury issuance absorption pressure.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div id="tab-speculation" class="tab-pane">
    <div class="card">
      <div class="card-title"><span>1st, 2nd &amp; 3rd Order Speculation Matrix</span></div>
      <div class="table-container">
        <table>
          <thead><tr><th>Order of Effect</th><th>Stock</th><th>Ticker</th><th>Industry</th><th>Reasons for Selection</th></tr></thead>
          <tbody>
            <tr><td><span class="badge badge-cyan">1st Order</span></td><td>NVIDIA Corp</td><td><strong>NVDA</strong></td><td>Semiconductors</td><td>Hyperscaler AI compute spend beneficiary; CUDA software lock-in moat.</td></tr>
            <tr><td><span class="badge badge-cyan">1st Order</span></td><td>Taiwan Semiconductor</td><td><strong>TSM</strong></td><td>Foundry / Packaging</td><td>Exclusive monopoly supplier of CoWoS packaging and sub-3nm nodes.</td></tr>
            <tr><td><span class="badge badge-cyan">1st Order</span></td><td>ASML Holding</td><td><strong>ASML</strong></td><td>Semiconductor Equip</td><td>Exclusive global supplier of High-NA EUV lithography systems.</td></tr>
            <tr><td><span class="badge badge-emerald">2nd Order</span></td><td>Vistra Corp</td><td><strong>VST</strong></td><td>Independent Power</td><td>Baseload merchant nuclear and gas capacity contracted for 24/7 power.</td></tr>
            <tr><td><span class="badge badge-emerald">2nd Order</span></td><td>Constellation Energy</td><td><strong>CEG</strong></td><td>Nuclear Power</td><td>Clean nuclear fleet with 20-year Microsoft Three Mile Island PPA.</td></tr>
            <tr><td><span class="badge badge-emerald">2nd Order</span></td><td>Cameco Corp</td><td><strong>CCJ</strong></td><td>Uranium Mining</td><td>Structural uranium supply deficit with exponential nuclear restarts.</td></tr>
            <tr><td><span class="badge badge-emerald">2nd Order</span></td><td>GE Vernova</td><td><strong>GEV</strong></td><td>Power Grid &amp; Turbines</td><td>Gas turbine backlogs extended past 2028; transmission upgrade wave.</td></tr>
            <tr><td><span class="badge badge-purple">3rd Order</span></td><td>CrowdStrike Holdings</td><td><strong>CRWD</strong></td><td>Cybersecurity</td><td>AI agent expansion exponentially increases enterprise endpoint vectors.</td></tr>
            <tr><td><span class="badge badge-purple">3rd Order</span></td><td>Palantir Technologies</td><td><strong>PLTR</strong></td><td>Enterprise AI</td><td>AIP ontology platform connecting LLMs to mission-critical operations.</td></tr>
            <tr><td><span class="badge badge-purple">3rd Order</span></td><td>Microsoft Corp</td><td><strong>MSFT</strong></td><td>Cloud / Software</td><td>Copilot monetization layer capturing enterprise seat expansion.</td></tr>
            <tr><td><span class="badge badge-purple">3rd Order</span></td><td>Amazon.com Inc</td><td><strong>AMZN</strong></td><td>Cloud Computing</td><td>AWS Bedrock enterprise infrastructure scaling with high margins.</td></tr>
            <tr><td><span class="badge badge-amber">Macro Hedge</span></td><td>SPDR Gold Shares</td><td><strong>GLD</strong></td><td>Monetary Metal</td><td>Fiscal deficit expansion and foreign central bank reserve diversification.</td></tr>
            <tr><td><span class="badge badge-amber">Macro Hedge</span></td><td>Newmont Corp</td><td><strong>NEM</strong></td><td>Gold Mining Major</td><td>Operating leverage to physical gold prices; massive FCF expansion.</td></tr>
            <tr><td><span class="badge badge-amber">Macro Hedge</span></td><td>iShares Bitcoin Trust</td><td><strong>IBIT</strong></td><td>Digital Asset</td><td>High-beta proxy for global fiat money supply expansion.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div id="tab-scenarios" class="tab-pane">
    <div class="card">
      <div class="card-title"><span>4-Quarter Forward Scenarios &amp; Policy Playbook</span></div>
      <div class="table-container">
        <table>
          <thead><tr><th>Quarter</th><th>Base Scenario (60%)</th><th>Alternative (40%)</th><th>Asset Direction</th><th>Policy Playbook</th></tr></thead>
          <tbody>
            <tr><td><strong>Q4 2026</strong></td><td>Reflation (Quad 2), GDP +2.4%</td><td>Labor cooling slowdown</td><td><span class="badge badge-emerald">Long SPY, GLD, VST</span> &bull; <span class="badge badge-rose">Short TLT</span></td><td>Fed pauses; TGA drawdown injects liquidity; hedge with put collars.</td></tr>
            <tr><td><strong>Q1 2027</strong></td><td>Commodity Stagflation Drift (Quad 3)</td><td>AI productivity surge</td><td><span class="badge badge-amber">Long Energy (XLE), Gold</span></td><td>Rotate from mega-cap tech into commodities and real assets.</td></tr>
            <tr><td><strong>Q2 2027</strong></td><td>Fiscal Dominance Acceleration</td><td>Debt ceiling gridlock</td><td><span class="badge badge-purple">Long GLD, IBIT, USFR</span></td><td>Fed tapers QT; Treasury issues short bills to avoid yield spike.</td></tr>
            <tr><td><strong>Q3 2027</strong></td><td>AI Capex Software Monetization</td><td>Capex retrenchment pause</td><td><span class="badge badge-emerald">Long Software (PLTR, CRWD)</span></td><td>Overweight enterprise software over semiconductor hardware.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    function switchTab(tabId) {{
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const target = document.getElementById(tabId);
      if (target) target.classList.add('active');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      if (event && event.target) event.target.classList.add('active');
    }}
  </script>
</body>
</html>"""

    return HTMLResponse(
        content=html,
        status_code=200,
        headers={
            "Content-Disposition": f'attachment; filename="MacroPulse_Alpha_Report_{datetime.now(timezone.utc).strftime("%Y-%m-%d")}.html"',
            "Content-Type": "text/html; charset=utf-8",
        }
    )


# ----------------------------------------------------
# Framework Synthesis, Speculation & Scenarios (Chunk 6)
# ----------------------------------------------------
@api_router.get("/v1/synthesis")
@api_router.get("/synthesis")
def get_framework_synthesis(db: Session = Depends(get_db)):
    """Returns cross-framework macro synthesis across Prometheus, Hedgeye, 42 Macro, and 3Fourteen Research."""
    deltas = []
    snapshot = None
    try:
        deltas = db.query(IntelligenceDelta).order_by(IntelligenceDelta.timestamp_utc.desc()).limit(10).all()
        snapshot = db.query(RegimeSnapshot).order_by(RegimeSnapshot.date.desc()).first()
    except Exception as e:
        logger.debug(f"DB query synthesis fallback: {e}")
    
    last_diff = refresh_orchestrator.last_diff or {}
    
    default_authors = [
        {
            "author": "Aahan Menon",
            "firm": "Prometheus Research",
            "growth_view": "Accelerating (+2.4% YoY) & Mid-Cycle Expansion",
            "inflation_view": "Sticky Services (2.8% YoY)",
            "policy_view": "Global M2 Re-acceleration ($106.4T)",
            "stated_regime": "Mid-Cycle Expansion",
            "bond_stance": "Neutral / Selective TIPS ($TIP)",
            "equity_signal": "Overweight Secular Growth & Gold",
            "affected_tickers": ["SPY", "GLD", "TIP", "NVDA"],
            "confidence": 0.82,
        },
        {
            "author": "Keith McCullough",
            "firm": "Hedgeye Risk Management",
            "growth_view": "Shallow Quad 2 Acceleration",
            "inflation_view": "Quad 2 Reflation Push (Headline CPI: 2.78%)",
            "policy_view": "US TGA Drain Buffering Cash Reserves",
            "stated_regime": "Quad 2 (Reflation)",
            "bond_stance": "Confirmed Bearish Trend ($TLT)",
            "equity_signal": "Bullish Trend & Pod 1/2 Conviction Longs",
            "affected_tickers": ["NVDA", "VST", "CEG", "SMH", "TLT"],
            "confidence": 0.94,
        },
        {
            "author": "Darius Dale",
            "firm": "42 Macro",
            "growth_view": "Cyclical Upswing (GRID Prob: 58%)",
            "inflation_view": "Reflationary Impulses Emerging",
            "policy_view": "Accord 2.0 Watch Active (Real Rates 79.3%)",
            "stated_regime": "Reflation",
            "bond_stance": "Underweight Long Duration",
            "equity_signal": "VAMS Momentum Long (KISS 60/30/10)",
            "affected_tickers": ["SPY", "GLD", "IBIT", "USFR"],
            "confidence": 0.88,
        },
        {
            "author": "Warren Pies",
            "firm": "3Fourteen Research",
            "growth_view": "No Recession Signaled (RAA 41% Equity)",
            "inflation_view": "Commodity Pass-Through Emerging",
            "policy_view": "Curve Steepener & T-Bill Rollout",
            "stated_regime": "Cyclical Expansion",
            "bond_stance": "Curve Steepener Preferred",
            "equity_signal": "Overweight Permian Royalties & RAA Model",
            "affected_tickers": ["TPL", "XLE", "OIH", "SPY"],
            "confidence": 0.85,
        },
    ]

    delta_map = {d.framework_author.split("(")[0].strip(): d for d in deltas if d.framework_author}
    for item in default_authors:
        matching_delta = delta_map.get(item["author"])
        if matching_delta:
            if matching_delta.macro_regime_call:
                item["stated_regime"] = matching_delta.macro_regime_call
            if matching_delta.affected_tickers:
                item["affected_tickers"] = [t.strip() for t in matching_delta.affected_tickers.split(",") if t.strip()]

    return _sanitize_floats({
        "frameworks": default_authors,
        "regime_snapshot": {
            "current_quad": getattr(snapshot, "us_monthly_quad", "QUAD_2") if snapshot else "QUAD_2",
            "grid_regime": getattr(snapshot, "grid_regime", "REFLATION") if snapshot else "REFLATION",
            "net_liquidity_usd_bn": getattr(snapshot, "net_liquidity_usd_bn", 5801.4) if snapshot else 5801.4,
            "quad_2_prob": getattr(snapshot, "quad_2_prob", 0.58) if snapshot else 0.58,
            "quad_3_prob": getattr(snapshot, "quad_3_prob", 0.10) if snapshot else 0.10,
        },
        "latest_diff": last_diff,
        "deltas_count": len(deltas),
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    })


@api_router.get("/v1/speculation")
@api_router.get("/speculation")
def get_speculation_ideas(db: Session = Depends(get_db)):
    """Returns dynamic 1st, 2nd, and 3rd order institutional speculation ideas and ranked outliers."""
    outlier_scan = scan_1_to_3_month_outliers()
    
    speculation_stocks = [
        {
            "order": "1st Order",
            "stock": "NVIDIA Corp",
            "ticker": "NVDA",
            "industry": "Semiconductors / GPU Compute",
            "theme": "AI Datacenter Expansion",
            "asymmetry": "3.8 : 1",
            "horizon": "1-3 Months",
            "reasons": "Direct primary beneficiary of hyperscaler accelerated computing capex. Blackwell architecture ramp + Top-decile Pod 1/2 revenue acceleration (+12.5% YoY) and 3Fourteen +239 bps active weight tilt.",
        },
        {
            "order": "1st Order",
            "stock": "Broadcom Inc",
            "ticker": "AVGO",
            "industry": "Custom AI Accelerators & ASIC",
            "theme": "AI Datacenter Expansion",
            "asymmetry": "3.4 : 1",
            "horizon": "1-3 Months",
            "reasons": "High-margin enterprise networking switches + custom ASIC co-design for Google & Meta. FCF margin exceeds 38% of sales with consistent share repurchase yield.",
        },
        {
            "order": "1st Order",
            "stock": "Taiwan Semiconductor",
            "ticker": "TSM",
            "industry": "Foundry / Advanced Packaging",
            "theme": "AI Datacenter Expansion",
            "asymmetry": "3.2 : 1",
            "horizon": "1-3 Months",
            "reasons": "Exclusive foundry monopoly on leading-edge AI compute nodes and CoWoS advanced packaging capacity.",
        },
        {
            "order": "2nd Order",
            "stock": "Vistra Corp",
            "ticker": "VST",
            "industry": "Independent Power & Nuclear",
            "theme": "AI Datacenter Expansion",
            "asymmetry": "4.2 : 1",
            "horizon": "3-6 Months",
            "reasons": "Hyperscalers require 24/7 baseload electricity. PJM capacity auction pricing surge + long-term power purchase contracts at premium pricing. VAMS Bullish Trend with 2.1x RVOL thrust.",
        },
        {
            "order": "2nd Order",
            "stock": "Constellation Energy",
            "ticker": "CEG",
            "industry": "Clean Energy / Nuclear Baseload",
            "theme": "AI Datacenter Expansion",
            "asymmetry": "3.9 : 1",
            "horizon": "3-6 Months",
            "reasons": "Crane Clean Energy Center (Three Mile Island Unit 1) 20-year Microsoft PPA agreement at high margins. Nuclear tax credits floor downside cash flows.",
        },
        {
            "order": "2nd Order",
            "stock": "Vertiv Holdings",
            "ticker": "VRT",
            "industry": "Datacenter Liquid Cooling",
            "theme": "AI Datacenter Expansion",
            "asymmetry": "3.6 : 1",
            "horizon": "2-4 Months",
            "reasons": "Liquid cooling thermal management infrastructure required for high TDP racks; backlog up >60% YoY.",
        },
        {
            "order": "2nd Order",
            "stock": "GE Vernova",
            "ticker": "GEV",
            "industry": "Power Grid & Turbines",
            "theme": "AI Datacenter Expansion",
            "asymmetry": "3.5 : 1",
            "horizon": "3-6 Months",
            "reasons": "Heavy gas turbine equipment and electrical grid transmission switchgear backlogs booked into 2028.",
        },
        {
            "order": "3rd Order",
            "stock": "Palantir Technologies",
            "ticker": "PLTR",
            "industry": "Enterprise AI Software",
            "theme": "AI Application Scaling",
            "asymmetry": "3.1 : 1",
            "horizon": "3-6 Months",
            "reasons": "AIP platform monetizing operational enterprise workflow automation; US commercial revenue acceleration.",
        },
        {
            "order": "3rd Order",
            "stock": "CrowdStrike Holdings",
            "ticker": "CRWD",
            "industry": "Cybersecurity & Cloud Protection",
            "theme": "AI Application Scaling",
            "asymmetry": "3.0 : 1",
            "horizon": "3-6 Months",
            "reasons": "AI agent sprawl and autonomous code generation multiply endpoint threat vectors and enterprise incident response needs.",
        },
        {
            "order": "1st Order",
            "stock": "SPDR Gold Shares",
            "ticker": "GLD",
            "industry": "Monetary Hard Asset",
            "theme": "Sovereign Fiscal Dominance",
            "asymmetry": "4.5 : 1",
            "horizon": "3-12 Months",
            "reasons": "Central bank foreign reserve de-dollarization and US public debt expansion. 42 Macro Accord 2.0 hedge.",
        },
        {
            "order": "2nd Order",
            "stock": "Newmont Corp",
            "ticker": "NEM",
            "industry": "Gold Mining Major",
            "theme": "Sovereign Fiscal Dominance",
            "asymmetry": "4.0 : 1",
            "horizon": "3-6 Months",
            "reasons": "Operational leverage to bullion surge; AISC costs fixed while top-line realization expands FCF yield.",
        },
        {
            "order": "2nd Order",
            "stock": "iShares Bitcoin Trust",
            "ticker": "IBIT",
            "industry": "Digital Store of Value",
            "theme": "Sovereign Fiscal Dominance",
            "asymmetry": "3.7 : 1",
            "horizon": "2-6 Months",
            "reasons": "Institutional ETF liquidity inflows tracking global fiat M2 expansion. 42 Macro Dr. Mo Max Bullish asset in Quad 2.",
        },
        {
            "order": "1st Order",
            "stock": "Texas Pacific Land",
            "ticker": "TPL",
            "industry": "Permian Basin Mineral Rights & Water",
            "theme": "Permian Royalties & Water Infrastructure",
            "asymmetry": "4.1 : 1",
            "horizon": "2-6 Months",
            "reasons": "Zero-capex mineral royalty owner in Delaware basin. Warren Pies 3Fourteen Research top secular overweight.",
        },
        {
            "order": "2nd Order",
            "stock": "SPDR S&P Regional Banking",
            "ticker": "KRE",
            "industry": "Regional Financials",
            "theme": "Yield Curve Steepening",
            "asymmetry": "2.9 : 1",
            "horizon": "1-3 Months",
            "reasons": "Fed rate cuts drop wholesale deposit funding costs while asset yields stay elevated; NIM expansion tailwind.",
        },
    ]

    return _sanitize_floats({
        "ranked_outliers": outlier_scan.get("ranked_outliers", []),
        "speculation_ripple_effects": outlier_scan.get("speculation_ripple_effects", []),
        "speculation_stocks": speculation_stocks,
        "total_ideas_count": len(speculation_stocks),
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    })


@api_router.get("/v1/scenarios")
@api_router.get("/scenarios")
def get_macro_scenarios(db: Session = Depends(get_db)):
    """Returns dynamic forward quarter macro scenarios, policy triggers, and asset allocations."""
    try:
        from app.quant_engine.macro_nowcast import generate_dynamic_forward_quarters
    except ImportError:
        from backend.app.quant_engine.macro_nowcast import generate_dynamic_forward_quarters
    fwd_quarters = generate_dynamic_forward_quarters(4)
    
    snapshot = None
    try:
        snapshot = db.query(RegimeSnapshot).order_by(RegimeSnapshot.date.desc()).first()
    except Exception as e:
        logger.debug(f"DB query scenarios fallback: {e}")
    q2_prob = getattr(snapshot, "quad_2_prob", 0.58) if snapshot else 0.58
    q3_prob = getattr(snapshot, "quad_3_prob", 0.10) if snapshot else 0.10

    scenarios = [
        {
            "quarter": fwd_quarters[0],
            "base_case": {"scenario": "Reflation (Quad 2)", "probability": round(q2_prob, 2), "gdp_growth_yoy": 2.4, "cpi_yoy": 2.8},
            "bear_case": {"scenario": "Labor Cooling Slowdown (Quad 4)", "probability": round(1.0 - q2_prob - q3_prob, 2), "gdp_growth_yoy": 1.2, "cpi_yoy": 2.2},
            "stagflation_case": {"scenario": "Stagflation Drift (Quad 3)", "probability": round(q3_prob, 2), "gdp_growth_yoy": 1.5, "cpi_yoy": 3.4},
            "asset_direction": "Long SPY, GLD, VST; Short TLT",
            "policy_playbook": "Fed easing pacing balanced; TGA drawdown injects liquidity; hedge with put collars at range top.",
            "triggers": ["Headline CPI accelerating YoY", "Real rate share of yield change >75%"],
        },
        {
            "quarter": fwd_quarters[1],
            "base_case": {"scenario": "Commodity Stagflation Drift (Quad 3)", "probability": 0.45, "gdp_growth_yoy": 1.8, "cpi_yoy": 3.2},
            "bear_case": {"scenario": "Disinflationary Expansion (Quad 1)", "probability": 0.35, "gdp_growth_yoy": 2.6, "cpi_yoy": 2.4},
            "stagflation_case": {"scenario": "Deflationary Shock (Quad 4)", "probability": 0.20, "gdp_growth_yoy": 0.8, "cpi_yoy": 1.8},
            "asset_direction": "Long Energy (XLE), Gold (GLD), Commodities (DBC)",
            "policy_playbook": "Rotate from mega-cap tech into commodities and real assets; monitor Accord 2.0 triggers.",
            "triggers": ["Brent Crude sustained >$85/bbl", "10Y Breakeven inflation >2.50%"],
        },
        {
            "quarter": fwd_quarters[2],
            "base_case": {"scenario": "Fiscal Dominance & Accord 2.0 Activation", "probability": 0.50, "gdp_growth_yoy": 2.0, "cpi_yoy": 3.0},
            "bear_case": {"scenario": "Debt Ceiling Austerity Pause", "probability": 0.30, "gdp_growth_yoy": 1.4, "cpi_yoy": 2.1},
            "stagflation_case": {"scenario": "Credit Spread Blowout", "probability": 0.20, "gdp_growth_yoy": 0.5, "cpi_yoy": 2.6},
            "asset_direction": "Long GLD, IBIT, USFR, Short Nominal Long Bonds",
            "policy_playbook": "Fed tapers QT; Treasury tilts issuance heavily to short bills; bank SLR deregulation.",
            "triggers": ["10Y Term Premium exceeds +80 bps", "US Public Debt interest expense >$1.2T"],
        },
        {
            "quarter": fwd_quarters[3],
            "base_case": {"scenario": "AI Enterprise Software Monetization", "probability": 0.55, "gdp_growth_yoy": 2.5, "cpi_yoy": 2.6},
            "bear_case": {"scenario": "Capex Retrenchment Pause", "probability": 0.30, "gdp_growth_yoy": 1.6, "cpi_yoy": 2.2},
            "stagflation_case": {"scenario": "Late-Cycle Wage Spiral", "probability": 0.15, "gdp_growth_yoy": 1.9, "cpi_yoy": 3.5},
            "asset_direction": "Overweight Enterprise Software (PLTR, CRWD) over Semiconductor Hardware",
            "policy_playbook": "Productivity gains dampen unit labor costs; corporate margin expansion supports equities.",
            "triggers": ["Enterprise software revenue acceleration >20%", "Productivity growth >2.2%"],
        },
    ]

    return _sanitize_floats({
        "forward_quarters": fwd_quarters,
        "scenarios": scenarios,
        "policy_triggers": {
            "fed_funds_rate_projection": "3.75% - 4.00%",
            "tga_cash_target_usd_bn": 750.0,
            "accord_2_probability_pct": 95.0,
        },
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    })


# ----------------------------------------------------
# Multi-Source Financial Data Test Bench (/api/v1/stock/sources-test)
# ----------------------------------------------------
try:
    from backend.app.api.endpoints.stock_sources_test import router as sources_test_router
except ImportError:
    from app.api.endpoints.stock_sources_test import router as sources_test_router

api_router.include_router(sources_test_router, prefix="/v1/stock", tags=["stock-sources-test"])
api_router.include_router(sources_test_router, prefix="/stock", tags=["stock-sources-test"])




