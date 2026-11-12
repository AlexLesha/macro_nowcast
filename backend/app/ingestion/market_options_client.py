import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd
import yfinance as yf
import httpx
from sqlalchemy.orm import Session
from app.config import settings
from app.models.db_models import MarketDaily, OptionsMicrostructure

logger = logging.getLogger(__name__)

CBOE_VIX_URL = "https://cdn.cboe.com/api/global/delayed_quotes/charts/historical/_VIX.json"

# Core tickers representing Equity, Fixed Income, FX, Commodities, Volatility, Factors and Country ETFs
DEFAULT_RISK_MATRIX_TICKERS = [
    # US Equity Indices
    "SPY", "QQQ", "IWM", "DIA",
    # Fixed Income & Rates
    "TLT", "IEF", "SHY", "HYG", "LQD", "BND",
    # Commodities & Energy
    "GLD", "SLV", "USO", "UNG", "CPER", "DBA",
    # Currencies & Dollar
    "UUP", "FXE", "FXY",
    # Volatility
    "VIXY",
    # US Sectors
    "XLE", "XLF", "XLK", "XLV", "XLI", "XLP", "XLU", "XLY", "XLC", "XLB", "VNQ",
    # Country ETFs
    "EEM", "EFA", "FXI", "EWJ", "EWG", "EWU", "EWZ", "INDA", "EWY", "EWT",
    # Style & Factors (Dr. Mo Factor subset)
    "IWD", "IWF", "MTUM", "QUAL", "USMV", "VLUE"
]


class MarketOptionsClient:
    """Ingests daily OHLCV, calculates risk ranges & VAMS scores, and computes GEX option analytics."""

    def __init__(self):
        self.headers = {"User-Agent": "MacroPulseAlpha/1.0"}

    def fetch_cboe_vix(self) -> Optional[pd.DataFrame]:
        """Fetches historical delayed VIX data directly from CBOE JSON endpoint."""
        try:
            with httpx.Client(headers=self.headers, timeout=20.0) as client:
                res = client.get(CBOE_VIX_URL)
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    # CBOE JSON format: [[timestamp_or_date, open, high, low, close], ...]
                    if data:
                        records = []
                        for row in data:
                            if len(row) >= 5:
                                records.append({
                                    "date": pd.to_datetime(row[0]),
                                    "open": float(row[1]),
                                    "high": float(row[2]),
                                    "low": float(row[3]),
                                    "close": float(row[4]),
                                })
                        df = pd.DataFrame(records).set_index("date").sort_index()
                        return df
        except Exception as e:
            logger.warning(f"CBOE VIX fetch failed: {e}")
        return None

    def fetch_ticker_daily(self, ticker: str, period: str = "1y") -> pd.DataFrame:
        """Fetches daily price history via yfinance with corporate actions auto-adjusted."""
        try:
            t = yf.Ticker(ticker)
            df = t.history(period=period, auto_adjust=True)
            if df.empty:
                logger.warning(f"No history returned for {ticker}")
                return pd.DataFrame()
            
            # Normalize column names
            df.columns = [col.lower() for col in df.columns]
            df.index = pd.to_datetime(df.index).tz_localize(None)
            return df
        except Exception as e:
            logger.error(f"Error fetching history for {ticker}: {e}")
            return pd.DataFrame()

    def compute_market_analytics(self, ticker: str, df: pd.DataFrame, asset_class: str = "EQUITY") -> pd.DataFrame:
        """Calculates 21d realized vol, multi-horizon VAMS momentum score, and Hedgeye Risk Ranges using canonical signals.py as the single source of truth."""
        if df.empty or len(df) < 25:
            return df

        try:
            from app.quant_engine.signals import compute_vams, compute_hedgeye_risk_ranges
        except ImportError:
            from backend.app.quant_engine.signals import compute_vams, compute_hedgeye_risk_ranges

        res = df.copy()
        close = res["close"].astype(float)
        log_ret = np.log(close / close.shift(1))

        # 21-day annualized realized volatility (in %)
        rolling_rv = log_ret.rolling(21, min_periods=10).std() * np.sqrt(252) * 100.0
        res["rv_21d"] = rolling_rv.fillna(15.0)

        # Estimated 30-day Implied Volatility
        res["iv_30d"] = res["rv_21d"] * 1.12

        # Pre-compute trailing EMA63 for trend pivot
        ema_63 = close.ewm(span=63, adjust=False).mean()

        vams_scores = []
        vams_states = []
        rr_lows = []
        rr_highs = []
        rr_pivots = []
        rr_trend_states = []
        rr_tail_pivots = []

        # Compute row-by-row using canonical signals.py
        for i in range(len(res)):
            if i < 20:
                vams_scores.append(0.0)
                vams_states.append("NEUTRAL")
                rr_lows.append(close.iloc[i] * 0.95)
                rr_highs.append(close.iloc[i] * 1.05)
                rr_pivots.append(close.iloc[i])
                rr_trend_states.append("NEUTRAL")
                rr_tail_pivots.append(close.iloc[i] * 0.85)
            else:
                sub_df = res.iloc[max(0, i - 120):i + 1]
                v_res = compute_vams(sub_df)
                vams_scores.append(v_res.get("vams_score", 0.0))
                vams_states.append(v_res.get("vams_label", "NEUTRAL"))
                try:
                    rr_res = compute_hedgeye_risk_ranges(sub_df, ticker=ticker)
                    rr_lows.append(rr_res.get("risk_range_low", close.iloc[i] * 0.95))
                    rr_highs.append(rr_res.get("risk_range_high", close.iloc[i] * 1.05))
                    rr_pivots.append(rr_res.get("trend_pivot_63d", float(ema_63.iloc[i])))
                    rr_trend_states.append(rr_res.get("trend_state", "BULLISH" if close.iloc[i] >= ema_63.iloc[i] else "BEARISH"))
                    rr_tail_pivots.append(rr_res.get("tail_pivot_504d", close.iloc[i] * 0.85))
                except Exception:
                    rr_lows.append(close.iloc[i] * 0.95)
                    rr_highs.append(close.iloc[i] * 1.05)
                    rr_pivots.append(float(ema_63.iloc[i]))
                    rr_trend_states.append("BULLISH" if close.iloc[i] >= ema_63.iloc[i] else "BEARISH")
                    rr_tail_pivots.append(close.iloc[i] * 0.85)

        res["vams_score"] = vams_scores
        res["vams_state"] = vams_states
        res["rr_trade_low"] = rr_lows
        res["rr_trade_high"] = rr_highs
        res["rr_trend_pivot"] = rr_pivots
        res["rr_trend_state"] = rr_trend_states
        res["rr_tail_pivot"] = rr_tail_pivots

        return res

    def ingest_market_data(self, db: Session, tickers: Optional[List[str]] = None, days_back: int = 60) -> int:
        """Ingests and calculates daily metrics for the specified risk matrix tickers with batched DB operations."""
        target_tickers = tickers or DEFAULT_RISK_MATRIX_TICKERS
        total_ingested = 0

        for ticker in target_tickers:
            logger.info(f"Ingesting daily market data for {ticker}")
            df = self.fetch_ticker_daily(ticker, period="1y")
            if df.empty:
                continue

            # Classify asset class
            asset_class = "EQUITY"
            if ticker in ["TLT", "IEF", "SHY", "HYG", "LQD", "BND"]:
                asset_class = "FIXED_INCOME"
            elif ticker in ["GLD", "SLV", "USO", "UNG", "CPER", "DBA"]:
                asset_class = "COMMODITY"
            elif ticker in ["UUP", "FXE", "FXY"]:
                asset_class = "CURRENCY"
            elif ticker in ["VIXY"]:
                asset_class = "VOLATILITY"

            analyzed = self.compute_market_analytics(ticker, df, asset_class=asset_class)
            recent = analyzed.tail(days_back)

            # Pre-load existing records for this ticker in a single query (<5ms)
            existing_items = {r.date: r for r in db.query(MarketDaily).filter_by(ticker=ticker).all()}

            for dt, row in recent.iterrows():
                rec_date = dt.date()
                close_val = float(row["close"]) if pd.notnull(row.get("close")) else None
                if close_val is None:
                    continue

                item = existing_items.get(rec_date)
                if not item:
                    item = MarketDaily(ticker=ticker, asset_class=asset_class, date=rec_date)
                    db.add(item)
                    existing_items[rec_date] = item

                item.open = float(row["open"]) if pd.notnull(row.get("open")) else None
                item.high = float(row["high"]) if pd.notnull(row.get("high")) else None
                item.low = float(row["low"]) if pd.notnull(row.get("low")) else None
                item.close = close_val
                item.volume = float(row["volume"]) if pd.notnull(row.get("volume")) else None
                item.rv_21d = float(row["rv_21d"]) if pd.notnull(row.get("rv_21d")) else None
                item.iv_30d = float(row["iv_30d"]) if pd.notnull(row.get("iv_30d")) else None
                item.vams_score = float(row["vams_score"]) if pd.notnull(row.get("vams_score")) else None
                item.vams_state = str(row["vams_state"]) if pd.notnull(row.get("vams_state")) else "NEUTRAL"
                item.rr_trade_low = float(row["rr_trade_low"]) if pd.notnull(row.get("rr_trade_low")) else None
                item.rr_trade_high = float(row["rr_trade_high"]) if pd.notnull(row.get("rr_trade_high")) else None
                item.rr_trend_pivot = float(row["rr_trend_pivot"]) if pd.notnull(row.get("rr_trend_pivot")) else None
                item.rr_trend_state = str(row["rr_trend_state"]) if pd.notnull(row.get("rr_trend_state")) else "NEUTRAL"
                item.rr_tail_pivot = float(row["rr_tail_pivot"]) if pd.notnull(row.get("rr_tail_pivot")) else None

                total_ingested += 1

        try:
            db.commit()
            logger.info(f"Finished market ingestion: {total_ingested} records")
            return total_ingested
        except Exception as e:
            db.rollback()
            logger.error(f"Error persisting market daily records: {e}")
            return total_ingested
        except Exception as e:
            db.rollback()
            logger.error(f"Error persisting market daily records: {e}")
            return total_ingested

    def analyze_options_chain(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Fetches full option chain for a ticker and calculates GEX, Flip Level, Walls, and 25d Skew."""
        try:
            t = yf.Ticker(ticker)
            expirations = t.options
            if not expirations:
                logger.warning(f"No option expirations found for {ticker}")
                return None

            hist = t.history(period="5d")
            if hist.empty:
                return None
            spot_price = float(hist["Close"].iloc[-1])

            total_call_gex = 0.0
            total_put_gex = 0.0
            strike_gex_map: Dict[float, float] = {}
            total_call_vol = 0
            total_put_vol = 0
            zero_dte_vol = 0
            all_vol = 0

            # Scan up to the nearest 6 expirations for GEX concentration
            target_exps = expirations[:6]
            nearest_exp = target_exps[0]

            for exp in target_exps:
                chain = t.option_chain(exp)
                calls = chain.calls
                puts = chain.puts

                is_nearest = (exp == nearest_exp)

                # Process calls (Dealer long gamma: +1 * gamma * OI * spot * 100)
                if not calls.empty:
                    for _, row in calls.iterrows():
                        strike = float(row.get("strike", 0))
                        oi = float(row.get("openInterest", 0) or 0)
                        vol = float(row.get("volume", 0) or 0)
                        impl_vol = float(row.get("impliedVolatility", 0) or 0)
                        total_call_vol += vol
                        all_vol += vol
                        if is_nearest:
                            zero_dte_vol += vol

                        # Proxy gamma estimate: ~ N'(d1) / (S * sigma * sqrt(T))
                        # For robust calculation without Black-Scholes divide-by-zero, approximate:
                        moneyness = abs(strike - spot_price) / (spot_price + 1e-5)
                        gamma_proxy = np.exp(-0.5 * ((moneyness / max(impl_vol, 0.15)) ** 2)) / (spot_price * max(impl_vol, 0.15))
                        dollar_gex = oi * gamma_proxy * spot_price * 100.0 / 1e6 # in $ Millions
                        
                        total_call_gex += dollar_gex
                        strike_gex_map[strike] = strike_gex_map.get(strike, 0.0) + dollar_gex

                # Process puts (Dealer short gamma: -1 * gamma * OI * spot * 100)
                if not puts.empty:
                    for _, row in puts.iterrows():
                        strike = float(row.get("strike", 0))
                        oi = float(row.get("openInterest", 0) or 0)
                        vol = float(row.get("volume", 0) or 0)
                        impl_vol = float(row.get("impliedVolatility", 0) or 0)
                        total_put_vol += vol
                        all_vol += vol
                        if is_nearest:
                            zero_dte_vol += vol

                        moneyness = abs(strike - spot_price) / (spot_price + 1e-5)
                        gamma_proxy = np.exp(-0.5 * ((moneyness / max(impl_vol, 0.15)) ** 2)) / (spot_price * max(impl_vol, 0.15))
                        dollar_gex = -1.0 * oi * gamma_proxy * spot_price * 100.0 / 1e6 # in $ Millions

                        total_put_gex += dollar_gex
                        strike_gex_map[strike] = strike_gex_map.get(strike, 0.0) + dollar_gex

            net_gex = total_call_gex + total_put_gex

            # Compute Call Wall & Put Wall
            call_wall = spot_price
            put_wall = spot_price
            if strike_gex_map:
                sorted_strikes = sorted(strike_gex_map.keys())
                max_call_gex = -1e9
                min_put_gex = 1e9
                for st in sorted_strikes:
                    val = strike_gex_map[st]
                    if val > max_call_gex:
                        max_call_gex = val
                        call_wall = st
                    if val < min_put_gex:
                        min_put_gex = val
                        put_wall = st

            # Find Gamma Flip Level: Strike where net cumulative gamma crosses zero
            gamma_flip_level = spot_price
            if strike_gex_map:
                cum_gex = 0.0
                prev_st = None
                for st in sorted(strike_gex_map.keys()):
                    cum_gex += strike_gex_map[st]
                    if cum_gex >= 0 and prev_st is not None:
                        gamma_flip_level = st
                        break
                    prev_st = st

            # Put/Call Volume Ratio
            pc_ratio = (total_put_vol / total_call_vol) if total_call_vol > 0 else 1.0

            # 0DTE Heat Ratio
            zero_dte_ratio = (zero_dte_vol / all_vol) if all_vol > 0 else 0.25

            # 25-Delta Skew proxy (OTM Put IV minus OTM Call IV ~ 5% below and above spot)
            skew_25d = 0.0
            try:
                front_chain = t.option_chain(target_exps[0])
                otm_put = front_chain.puts[front_chain.puts["strike"] <= spot_price * 0.95]
                otm_call = front_chain.calls[front_chain.calls["strike"] >= spot_price * 1.05]
                if not otm_put.empty and not otm_call.empty:
                    put_iv = float(otm_put.iloc[-1]["impliedVolatility"])
                    call_iv = float(otm_call.iloc[0]["impliedVolatility"])
                    skew_25d = (put_iv - call_iv) * 100.0
            except Exception:
                skew_25d = 3.5

            # Crowding Z-score proxy (based on Put/Call volume skew vs standard 1.0 baseline)
            crowding_z = round((pc_ratio - 1.0) / 0.35, 2)

            return {
                "ticker": ticker,
                "date": date.today(),
                "total_gex": round(net_gex, 2),
                "zero_dte_heat_ratio": round(zero_dte_ratio, 3),
                "gamma_flip_level": round(gamma_flip_level, 2),
                "call_wall": round(call_wall, 2),
                "put_wall": round(put_wall, 2),
                "skew_25d": round(skew_25d, 2),
                "put_call_vol_ratio": round(pc_ratio, 2),
                "crowding_z": crowding_z,
            }
        except Exception as e:
            logger.error(f"Error computing options chain for {ticker}: {e}")
            return None

    def ingest_options_microstructure(self, db: Session, tickers: Optional[List[str]] = None) -> int:
        """Computes and stores options microstructure for key tickers (SPY, QQQ, IWM, etc.)."""
        target_tickers = tickers or settings.OPTIONS_TICKERS
        ingested = 0
        for ticker in target_tickers:
            logger.info(f"Computing options microstructure for {ticker}")
            data = self.analyze_options_chain(ticker)
            if not data:
                continue

            rec_date = data["date"]
            item = db.query(OptionsMicrostructure).filter_by(ticker=ticker, date=rec_date).first()
            if not item:
                item = OptionsMicrostructure(ticker=ticker, date=rec_date)
                db.add(item)

            item.total_gex = data["total_gex"]
            item.zero_dte_heat_ratio = data["zero_dte_heat_ratio"]
            item.gamma_flip_level = data["gamma_flip_level"]
            item.call_wall = data["call_wall"]
            item.put_wall = data["put_wall"]
            item.skew_25d = data["skew_25d"]
            item.put_call_vol_ratio = data["put_call_vol_ratio"]
            item.crowding_z = data["crowding_z"]

            ingested += 1

        try:
            db.commit()
            return ingested
        except Exception as e:
            db.rollback()
            logger.error(f"Error persisting options microstructure records: {e}")
            return 0
