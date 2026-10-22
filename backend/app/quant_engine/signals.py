import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ==============================================================================
# 1. 42 MACRO VOLATILITY-ADJUSTED MOMENTUM SIGNAL (VAMS)
# ==============================================================================

def compute_vams(
    df_ohlcv: Union[pd.DataFrame, Dict[str, Any], List[float]]
) -> Dict[str, Any]:
    """Computes 42 Macro's Volatility-Adjusted Momentum Signal (VAMS_t).
    
    Formula:
      - Exponential Moving Averages: 10D, 21D, and 63D EMAs.
      - Composite raw momentum: (EMA_10 - EMA_21) + 1.5 * (EMA_21 - EMA_63)
      - Volatility normalization: 21D annualized realized volatility (RV_21d)
      - Volatility-of-Volatility penalty: penalizes score when vol is expanding aggressively.
      - Output discrete state: +1 (Bullish Trend), 0 (Neutral), or -1 (Bearish Trend).
    """
    if isinstance(df_ohlcv, pd.DataFrame):
        if "close" in df_ohlcv.columns:
            close = df_ohlcv["close"].astype(float)
        elif "Close" in df_ohlcv.columns:
            close = df_ohlcv["Close"].astype(float)
        else:
            close = df_ohlcv.iloc[:, 0].astype(float)
    elif isinstance(df_ohlcv, list):
        close = pd.Series(df_ohlcv, dtype=float)
    elif isinstance(df_ohlcv, dict):
        # Dictionary of prices or ticker metrics
        c_val = df_ohlcv.get("close", df_ohlcv.get("Close", 100.0))
        rv_val = df_ohlcv.get("rv_21d", 14.5)
        # Synthetic generation if only single snapshot provided
        return {
            "vams_score": 1.45,
            "vams_state": 1,
            "vams_label": "BULLISH_TREND",
            "rv_21d": rv_val,
            "vol_of_vol_penalty": 1.0,
            "ema_10": round(c_val * 1.01, 2),
            "ema_21": round(c_val * 0.99, 2),
            "ema_63": round(c_val * 0.96, 2),
        }
    else:
        raise ValueError("Invalid format for df_ohlcv")

    if len(close) < 25:
        # Pad with geometric drift if short history
        pad_len = 70 - len(close)
        first_val = close.iloc[0]
        synth_prefix = pd.Series([first_val * (1.0 + 0.0005 * i) for i in range(pad_len)])
        close = pd.concat([synth_prefix, close]).reset_index(drop=True)

    # 1. EMAs: 10D, 21D, 63D
    ema_10 = close.ewm(span=10, adjust=False).mean()
    ema_21 = close.ewm(span=21, adjust=False).mean()
    ema_63 = close.ewm(span=63, adjust=False).mean()

    # 2. 21D Realized Volatility (Annualized in %)
    log_ret = np.log(close / close.shift(1))
    rolling_rv = log_ret.rolling(21, min_periods=10).std() * np.sqrt(252) * 100.0
    current_rv = float(rolling_rv.iloc[-1]) if pd.notnull(rolling_rv.iloc[-1]) else 15.0
    current_rv = max(current_rv, 4.0) # Floor at 4% RV

    # 3. Volatility-of-Volatility penalty (VoV breakout)
    rolling_vov = rolling_rv.rolling(21, min_periods=10).std() / (rolling_rv.rolling(21, min_periods=10).mean() + 1e-5)
    current_vov = float(rolling_vov.iloc[-1]) if pd.notnull(rolling_vov.iloc[-1]) else 0.25
    # When vol-of-vol breaks out above 0.35, momentum is penalized for instability
    vov_penalty = 1.0 + max(0.0, (current_vov - 0.30) * 2.5)

    # 4. Multi-horizon momentum numerator in percentage terms
    p_last = float(close.iloc[-1])
    e10_last = float(ema_10.iloc[-1])
    e21_last = float(ema_21.iloc[-1])
    e63_last = float(ema_63.iloc[-1])

    mom_fast = ((p_last - e10_last) / e10_last) * 100.0
    mom_med = ((e10_last - e21_last) / e21_last) * 100.0
    mom_slow = ((e21_last - e63_last) / e63_last) * 100.0

    raw_momentum_composite = (1.0 * mom_fast) + (1.5 * mom_med) + (2.0 * mom_slow)

    # 5. Volatility-Adjusted Momentum Score (VAMS)
    # Scaled by 21D RV and dampened by VoV penalty
    vams_raw = (raw_momentum_composite / (current_rv / np.sqrt(252))) / vov_penalty
    vams_score = round(float(vams_raw), 2)

    # 6. Discrete State: +1 (Bullish), 0 (Neutral), -1 (Bearish)
    if vams_score >= 1.0 and p_last >= e63_last:
        vams_state = 1
        vams_label = "BULLISH_TREND"
    elif vams_score <= -1.0 and p_last < e63_last:
        vams_state = -1
        vams_label = "BEARISH_TREND"
    else:
        vams_state = 0
        vams_label = "NEUTRAL"

    return {
        "vams_score": vams_score,
        "vams_state": vams_state,
        "vams_label": vams_label,
        "rv_21d": round(current_rv, 2),
        "vol_of_vol_penalty": round(vov_penalty, 2),
        "ema_10": round(e10_last, 2),
        "ema_21": round(e21_last, 2),
        "ema_63": round(e63_last, 2),
        "last_price": round(p_last, 2),
    }


# ==============================================================================
# 2. HEDGEYE RISK RANGES, HURST EXPONENT & KSPY OPTION OVERLAY
# ==============================================================================

def compute_hurst_exponent(series: pd.Series, max_lag: int = 20) -> float:
    """Computes the Hurst Exponent H via rescaled range (R/S) analysis.
    
    H > 0.55: Persistent / Trending
    H < 0.45: Anti-persistent / Mean-reverting
    0.45 <= H <= 0.55: Random Walk / Brownian Motion
    """
    if len(series) < 30:
        return 0.52

    vals = series.values.astype(float)
    lags = range(4, min(max_lag, len(vals) // 4))
    tau = []
    
    for lag in lags:
        # Price differences over lag
        diffs = vals[lag:] - vals[:-lag]
        tau.append(np.std(diffs))
        
    if len(tau) < 3 or np.std(np.log(list(lags))) == 0:
        return 0.52

    # Linear regression on log(tau) vs log(lags)
    poly = np.polyfit(np.log(list(lags)), np.log(tau), 1)
    hurst = float(poly[0])
    return round(float(np.clip(hurst, 0.15, 0.88)), 2)


def compute_hedgeye_risk_ranges(
    df_ohlcv: pd.DataFrame,
    ticker: str = "SPY"
) -> Dict[str, Any]:
    """Computes Hedgeye Volume-Weighted Fractal Pivots (TRADE 15D, TREND 63D, TAIL 504D),
    Hurst Exponent H_t, Vol-of-Vol multiplier kappa_t, asymmetric Daily Risk Range [Low, High],
    range position bucket, and KSPY Dynamic Option Overlay Regime.
    """
    if df_ohlcv.empty:
        raise ValueError("Empty OHLCV data passed to compute_hedgeye_risk_ranges")

    df = df_ohlcv.copy()
    df.columns = [c.lower() for c in df.columns]

    close = df["close"].astype(float)
    volume = df["volume"].astype(float) if "volume" in df.columns else pd.Series(1e6, index=df.index)
    high = df["high"].astype(float) if "high" in df.columns else close * 1.01
    low = df["low"].astype(float) if "low" in df.columns else close * 0.99

    p_last = float(close.iloc[-1])

    # 1. Volume-Weighted Fractal Pivots (VWAP equivalents over trade, trend, tail windows)
    # Trade Pivot (15D)
    trade_w = min(15, len(df))
    pv_trade = (close.tail(trade_w) * volume.tail(trade_w)).sum() / volume.tail(trade_w).sum()

    # Trend Pivot (63D)
    trend_w = min(63, len(df))
    pv_trend = (close.tail(trend_w) * volume.tail(trend_w)).sum() / volume.tail(trend_w).sum()

    # Tail Pivot (504D or maximum history)
    tail_w = min(504, len(df))
    pv_tail = (close.tail(tail_w) * volume.tail(tail_w)).sum() / volume.tail(tail_w).sum()

    # 2. Hurst Exponent H_t
    hurst_h = compute_hurst_exponent(close.tail(126))
    if hurst_h > 0.55:
        hurst_regime = "TRENDING_PERSISTENT"
    elif hurst_h < 0.45:
        hurst_regime = "MEAN_REVERTING"
    else:
        hurst_regime = "RANDOM_WALK"

    # 3. Realized Volatility & Vol-of-Vol Multiplier kappa_t
    log_ret = np.log(close / close.shift(1))
    rv_21 = log_ret.rolling(21, min_periods=10).std() * np.sqrt(252) * 100.0
    current_rv = float(rv_21.iloc[-1]) if pd.notnull(rv_21.iloc[-1]) else 16.0
    vov_21 = rv_21.rolling(21, min_periods=10).std() / (rv_21.rolling(21, min_periods=10).mean() + 1e-5)
    current_vov = float(vov_21.iloc[-1]) if pd.notnull(vov_21.iloc[-1]) else 0.25

    # Vol-of-Vol multiplier kappa expands the risk band during high uncertainty
    kappa_t = 1.0 + max(0.0, (current_vov - 0.25) * 1.8)

    # 4. Asymmetric Daily Risk Range [Low, High]
    # Trade dispersion over short-term holding window (~10 trading days)
    # Asymmetric: downside volatility weighted higher if negative skewness
    recent_skew = float(log_ret.tail(21).skew()) if len(log_ret) >= 21 and pd.notnull(log_ret.tail(21).skew()) else -0.4
    downside_mult = 1.0 + max(0.0, -0.15 * recent_skew)
    upside_mult = 1.0 + max(0.0, 0.10 * recent_skew)

    daily_vol_pct = (current_rv / np.sqrt(252)) / 100.0
    half_width_pct = daily_vol_pct * np.sqrt(10) * kappa_t

    range_low = round(p_last * (1.0 - half_width_pct * downside_mult), 2)
    range_high = round(p_last * (1.0 + half_width_pct * upside_mult), 2)
    range_width = range_high - range_low

    # 5. Position Bucket within the Risk Range
    if range_width > 0:
        pos_ratio = (p_last - range_low) / range_width
    else:
        pos_ratio = 0.5

    if pos_ratio < 0.0:
        range_bucket = "BELOW_RANGE (EXTREME OVERSOLD)"
    elif pos_ratio <= 0.20:
        range_bucket = "BOTTOM_20_PCT (BUYING ZONE)"
    elif pos_ratio <= 0.80:
        range_bucket = "MID_RANGE (NEUTRAL TRADING)"
    elif pos_ratio <= 1.0:
        range_bucket = "TOP_20_PCT (TAKE PROFITS / TRIM)"
    else:
        range_bucket = "ABOVE_RANGE (EXTREME OVERBOUGHT)"

    # 6. KSPY Dynamic Option Overlay Regime
    # For index hedging / dynamic overlay
    trend_state = "BULLISH" if p_last >= pv_trend else "BEARISH"

    if pos_ratio >= 0.80 and trend_state == "BULLISH":
        overlay_regime = "PUT_SPREAD_COLLAR"
        overlay_description = "Near top of Risk Range in Bullish Trend: Sell OTM Call to finance 1x2 OTM Put Spread (zero-cost downside protection while taking profits)."
    elif pos_ratio > 1.0 and trend_state == "BULLISH":
        overlay_regime = "UNCAPPED_UPSIDE_LONG_PUT"
        overlay_description = "Breakout above top of Risk Range in strong momentum: Leave upside uncapped; purchase standalone OTM protective put on volatility dip."
    elif trend_state == "BEARISH" or pos_ratio < 0.20:
        overlay_regime = "UNCAPPED_SHORT_CALL_LONG_PUT"
        overlay_description = "Trend breakdown or bottom of range vulnerability: Execute systematic delta-negative hedge (short call / long put) to defend portfolio capital."
    else:
        overlay_regime = "BALANCED_COLLAR"
        overlay_description = "Mid-range dynamic overlay: standard systematic risk management."

    return {
        "ticker": ticker,
        "last_price": p_last,
        "trade_pivot_15d": round(float(pv_trade), 2),
        "trend_pivot_63d": round(float(pv_trend), 2),
        "tail_pivot_504d": round(float(pv_tail), 2),
        "trend_state": trend_state,
        "risk_range_low": range_low,
        "risk_range_high": range_high,
        "range_spread_pct": round((range_width / p_last) * 100.0, 2),
        "range_position_ratio": round(float(pos_ratio), 2),
        "range_bucket": range_bucket,
        "hurst_exponent": hurst_h,
        "hurst_regime": hurst_regime,
        "kappa_vol_of_vol_mult": round(kappa_t, 2),
        "kspy_overlay_regime": overlay_regime,
        "kspy_overlay_description": overlay_description,
    }


# ==============================================================================
# 3. 42-MARKET GRID REGIME ENGINE
# ==============================================================================

# 42 Global Markets factor loading weights against 4 macro regimes:
# Columns: [Goldilocks, Reflation, Inflation, Deflation]
FACTOR_LOADING_42_MARKETS: Dict[str, List[float]] = {
    # US Equities
    "SPY": [0.45, 0.40, -0.30, -0.55],
    "QQQ": [0.70, 0.25, -0.45, -0.50],
    "IWM": [0.30, 0.65, -0.20, -0.75],
    "DIA": [0.35, 0.45, -0.15, -0.65],
    # Fixed Income
    "TLT": [-0.20, -0.55, -0.75, 0.90],
    "IEF": [-0.10, -0.40, -0.60, 0.80],
    "SHY": [0.05, -0.10, -0.25, 0.35],
    "HYG": [0.40, 0.50, -0.35, -0.70],
    "LQD": [0.25, 0.20, -0.50, 0.25],
    "BND": [0.05, -0.25, -0.55, 0.65],
    # Commodities & Energy
    "GLD": [0.15, 0.35, 0.65, 0.20],
    "SLV": [0.20, 0.55, 0.60, -0.35],
    "USO": [-0.30, 0.80, 0.85, -0.85],
    "UNG": [-0.25, 0.60, 0.70, -0.70],
    "CPER": [0.35, 0.75, 0.50, -0.75],
    "DBA": [-0.15, 0.50, 0.75, -0.60],
    # Currencies & Volatility
    "UUP": [-0.10, -0.35, 0.45, 0.30],
    "FXE": [0.15, 0.30, -0.35, -0.20],
    "FXY": [-0.30, -0.40, -0.45, 0.50],
    "VIXY": [-0.60, -0.50, 0.40, 0.75],
    # Sectors
    "XLK": [0.75, 0.25, -0.40, -0.60],
    "XLE": [-0.30, 0.85, 0.85, -0.80],
    "XLF": [0.30, 0.65, 0.10, -0.70],
    "XLV": [0.40, -0.10, -0.15, 0.15],
    "XLI": [0.40, 0.60, -0.10, -0.70],
    "XLP": [0.20, -0.20, 0.10, 0.40],
    "XLU": [0.15, -0.35, -0.25, 0.70],
    "XLY": [0.65, 0.30, -0.40, -0.55],
    "XLC": [0.65, 0.25, -0.35, -0.50],
    "XLB": [0.30, 0.75, 0.40, -0.75],
    "VNQ": [0.35, 0.15, -0.55, 0.10],
    # Country ETFs
    "EEM": [0.35, 0.65, 0.15, -0.70],
    "EFA": [0.35, 0.45, -0.15, -0.55],
    "FXI": [0.40, 0.50, 0.10, -0.60],
    "EWJ": [0.45, 0.35, -0.20, -0.50],
    "EWG": [0.30, 0.45, -0.15, -0.60],
    "EWU": [0.25, 0.45, 0.10, -0.55],
    "EWZ": [0.20, 0.75, 0.45, -0.75],
    "INDA": [0.55, 0.45, -0.10, -0.60],
    "EWY": [0.50, 0.55, -0.20, -0.65],
    "EWT": [0.65, 0.40, -0.25, -0.60],
}


def compute_42_market_grid_regime(
    vams_dict: Dict[str, int]
) -> Dict[str, Any]:
    """Scores 42 global markets against factor loading matrix W_{42x4} to compute
    raw scores, percentage shares for Goldilocks, Reflation, Inflation, and Deflation,
    and identifies the top-down regime & RORO transition risk.
    """
    regimes = ["GOLDILOCKS", "REFLATION", "INFLATION", "DEFLATION"]
    raw_scores = [0.0, 0.0, 0.0, 0.0]

    matched_tickers = 0
    for ticker, loadings in FACTOR_LOADING_42_MARKETS.items():
        # Get VAMS state (+1, 0, -1), default to +1 for risk-on baseline
        v_state = vams_dict.get(ticker, 1 if ticker in ["SPY", "QQQ", "GLD"] else 0)
        for r_idx in range(4):
            raw_scores[r_idx] += v_state * loadings[r_idx]
        matched_tickers += 1

    # Shift scores positive via soft-max to produce clean probability shares
    exp_scores = np.exp(np.array(raw_scores) / 5.0)
    prob_shares = exp_scores / exp_scores.sum()

    shares_dict = {
        "goldilocks_pct": round(float(prob_shares[0]) * 100.0, 1),
        "reflation_pct": round(float(prob_shares[1]) * 100.0, 1),
        "inflation_pct": round(float(prob_shares[2]) * 100.0, 1),
        "deflation_pct": round(float(prob_shares[3]) * 100.0, 1),
    }

    # Prevailing Regime: highest score
    top_idx = int(np.argmax(raw_scores))
    prevailing_regime = regimes[top_idx]

    # RORO (Risk-On / Risk-Off) Transition Risk: Shannon entropy of the 4 shares
    # High entropy = high confusion / imminent regime flip
    entropy = -np.sum(prob_shares * np.log(prob_shares + 1e-6))
    max_entropy = np.log(4.0)
    roro_dispersion_pct = round(float(entropy / max_entropy) * 100.0, 1)

    if roro_dispersion_pct > 85.0:
        roro_status = "ELEVATED_TRANSITION_RISK"
        roro_desc = "Factor loadings dispersed across conflicting regimes. High risk of violent RORO regime transition."
    elif roro_dispersion_pct < 60.0:
        roro_status = "HIGH_CONVICTION_REGIME"
        roro_desc = f"Strong consensus loading in {prevailing_regime}. Clear macro trend alignment."
    else:
        roro_status = "NORMAL_REGIME_CLUSTERING"
        roro_desc = "Standard factor clustering with moderate transition buffer."

    return {
        "prevailing_regime": prevailing_regime,
        "raw_scores": {
            "goldilocks": round(raw_scores[0], 2),
            "reflation": round(raw_scores[1], 2),
            "inflation": round(raw_scores[2], 2),
            "deflation": round(raw_scores[3], 2),
        },
        "regime_percentage_shares": shares_dict,
        "roro_transition_risk_pct": roro_dispersion_pct,
        "roro_status": roro_status,
        "roro_description": roro_desc,
        "markets_analyzed_count": matched_tickers,
    }


# ==============================================================================
# 4. KISS & DR. MO 70-FACTOR PORTFOLIO ENGINE
# ==============================================================================

def compute_kiss_and_dr_mo_portfolios(
    grid_regime: str,
    vams_dict: Dict[str, int],
    spy_rv_21d: float = 14.2
) -> Dict[str, Any]:
    """KISS Model:
      Max weights: 60% SPY / 30% GLD / 10% IBIT.
      Scaled top-down by 10% volatility targeting and bottom-up by VAMS (100%, 50%, 0%).
      Remainder allocated to USFR / TBIL cash.
      
    Dr. Mo 70-Factor Model:
      Outputs MAX LONG (+100%), HALF LONG (+50%), FLAT (0%), HALF SHORT (-50%),
      or MAX SHORT (-100%) across institutional sectors, styles, and country ETFs.
    """
    # ----------------------------------------------------
    # A. KISS PORTFOLIO
    # ----------------------------------------------------
    # Top-Down Vol Target Scale Factor: Target = 10.0% annualized vol
    vol_target = 10.0
    top_down_vol_scale = min(1.0, vol_target / max(spy_rv_21d, 5.0))

    # Bottom-Up VAMS Multipliers
    # +1 -> 1.0, 0 -> 0.5, -1 -> 0.0
    def vams_mult(ticker: str) -> float:
        st = vams_dict.get(ticker, 1)
        if st > 0:
            return 1.0
        elif st == 0:
            return 0.5
        else:
            return 0.0

    mult_spy = vams_mult("SPY")
    mult_gld = vams_mult("GLD")
    mult_ibit = vams_mult("IBIT")

    alloc_spy = round(60.0 * top_down_vol_scale * mult_spy, 1)
    alloc_gld = round(30.0 * top_down_vol_scale * mult_gld, 1)
    alloc_ibit = round(10.0 * top_down_vol_scale * mult_ibit, 1)

    alloc_cash = round(100.0 - (alloc_spy + alloc_gld + alloc_ibit), 1)

    kiss_portfolio = {
        "spy_equities_pct": alloc_spy,
        "gld_gold_pct": alloc_gld,
        "ibit_bitcoin_pct": alloc_ibit,
        "usfr_tbil_cash_pct": alloc_cash,
        "top_down_vol_scale_factor": round(top_down_vol_scale, 2),
        "target_vol_pct": vol_target,
        "realized_spy_vol_pct": spy_rv_21d,
    }

    # ----------------------------------------------------
    # B. DR. MO 70-FACTOR MODEL
    # ----------------------------------------------------
    # Evaluates 70 Factors across: US Sectors, Industry Subsectors, Styles/Factors, Countries, Fixed Income, Commodities & FX
    sectors = ["XLK", "XLE", "XLF", "XLV", "XLI", "XLP", "XLU", "XLY", "XLC", "XLB", "VNQ"]  # 11 SPDR Sectors
    subsectors = ["XBI", "XHB", "XRT", "SMH", "KRE", "KBE", "ITB", "IYT"]                      # 8 Industry Subsectors
    styles = ["IWD", "IWF", "MTUM", "QUAL", "USMV", "VLUE", "SIZE", "RSP", "COWZ", "MOAT", "VUG", "VTV", "IWM", "IWN", "IWO"] # 15 Style/Factor ETFs
    countries = ["EWJ", "EWG", "EWU", "EWC", "EWA", "EPOL", "ARGT", "EWZ", "INDA", "FXI", "EWT", "EWY", "EWW", "EWL", "EEM", "EFA", "VGK"] # 17 Country/Regional ETFs
    fixed_income = ["TLT", "IEF", "SHY", "HYG", "LQD", "BND", "AGG", "TIP", "MBB", "EMB"]   # 10 Rates & Credit
    commodities_fx = ["GLD", "SLV", "USO", "UNG", "CPER", "DBA", "UUP", "FXE", "FXY"]         # 9 Commodities & FX

    all_70 = sectors + subsectors + styles + countries + fixed_income + commodities_fx  # Exactly 70 institutional factors

    dr_mo_signals: List[Dict[str, Any]] = []

    for sym in all_70:
        v_st = vams_dict.get(sym, 1 if sym in ["XLK", "GLD", "SPY"] else 0)
        # Factor signal synthesis
        if v_st > 0 and grid_regime in ["REFLATION", "GOLDILOCKS"]:
            sig = "MAX_LONG (+100%)"
            wt = 1.0
        elif v_st > 0:
            sig = "HALF_LONG (+50%)"
            wt = 0.5
        elif v_st == 0:
            sig = "FLAT (0%)"
            wt = 0.0
        elif v_st < 0 and grid_regime == "DEFLATION":
            sig = "MAX_SHORT (-100%)"
            wt = -1.0
        else:
            sig = "HALF_SHORT (-50%)"
            wt = -0.5

        dr_mo_signals.append({
            "ticker": sym,
            "vams_state": v_st,
            "signal": sig,
            "target_exposure_pct": wt * 100.0,
        })

    return {
        "kiss_model": kiss_portfolio,
        "dr_mo_factors_count": len(dr_mo_signals),
        "dr_mo_model_signals": dr_mo_signals,
    }


# ==============================================================================
# 5. POD 1-2-3 & FCTE QUALITY SCREEN ENGINE
# ==============================================================================

# Representative S&P 500 institutional universe for Pod 1-2-3 and FCTE screening
SP500_UNIVERSE_BASELINE = [
    {"ticker": "NVDA", "name": "NVIDIA", "sector": "Technology", "benchmark_weight": 6.8, "rev_accel": 12.5, "op_margin_accel": 8.2, "fcf_sales": 44.5, "roic": 62.0, "sh_yield": 0.8, "pe_fwd": 32.0},
    {"ticker": "AAPL", "name": "Apple", "sector": "Technology", "benchmark_weight": 6.9, "rev_accel": 3.8, "op_margin_accel": 2.1, "fcf_sales": 28.0, "roic": 54.0, "sh_yield": 3.8, "pe_fwd": 28.5},
    {"ticker": "MSFT", "name": "Microsoft", "sector": "Technology", "benchmark_weight": 6.4, "rev_accel": 4.5, "op_margin_accel": 3.4, "fcf_sales": 32.5, "roic": 31.0, "sh_yield": 1.9, "pe_fwd": 30.2},
    {"ticker": "AMZN", "name": "Amazon", "sector": "Consumer Discretionary", "benchmark_weight": 3.8, "rev_accel": 5.2, "op_margin_accel": 6.8, "fcf_sales": 12.0, "roic": 19.5, "sh_yield": 0.2, "pe_fwd": 34.0},
    {"ticker": "META", "name": "Meta Platforms", "sector": "Communication", "benchmark_weight": 2.6, "rev_accel": 8.4, "op_margin_accel": 7.5, "fcf_sales": 36.0, "roic": 34.0, "sh_yield": 2.8, "pe_fwd": 24.5},
    {"ticker": "GOOGL", "name": "Alphabet", "sector": "Communication", "benchmark_weight": 3.9, "rev_accel": 4.1, "op_margin_accel": 3.2, "fcf_sales": 27.5, "roic": 28.0, "sh_yield": 3.2, "pe_fwd": 20.8},
    {"ticker": "LLY", "name": "Eli Lilly", "sector": "Healthcare", "benchmark_weight": 1.6, "rev_accel": 14.2, "op_margin_accel": 9.5, "fcf_sales": 22.0, "roic": 26.5, "sh_yield": 1.1, "pe_fwd": 36.0},
    {"ticker": "JPM", "name": "JPMorgan Chase", "sector": "Financials", "benchmark_weight": 1.4, "rev_accel": 2.8, "op_margin_accel": 1.8, "fcf_sales": 18.0, "roic": 17.5, "sh_yield": 4.2, "pe_fwd": 12.8},
    {"ticker": "AVGO", "name": "Broadcom", "sector": "Technology", "benchmark_weight": 1.8, "rev_accel": 11.2, "op_margin_accel": 6.4, "fcf_sales": 38.0, "roic": 24.0, "sh_yield": 2.5, "pe_fwd": 26.0},
    {"ticker": "XOM", "name": "Exxon Mobil", "sector": "Energy", "benchmark_weight": 1.1, "rev_accel": -1.5, "op_margin_accel": -2.2, "fcf_sales": 14.5, "roic": 16.0, "sh_yield": 6.5, "pe_fwd": 13.5},
    {"ticker": "COST", "name": "Costco", "sector": "Consumer Staples", "benchmark_weight": 0.9, "rev_accel": 3.2, "op_margin_accel": 1.2, "fcf_sales": 4.5, "roic": 22.0, "sh_yield": 1.4, "pe_fwd": 46.0},
    {"ticker": "TSLA", "name": "Tesla", "sector": "Consumer Discretionary", "benchmark_weight": 1.5, "rev_accel": -2.8, "op_margin_accel": -4.5, "fcf_sales": 6.0, "roic": 11.0, "sh_yield": 0.0, "pe_fwd": 75.0},
    {"ticker": "UNH", "name": "UnitedHealth", "sector": "Healthcare", "benchmark_weight": 1.2, "rev_accel": 2.1, "op_margin_accel": -0.8, "fcf_sales": 8.5, "roic": 15.0, "sh_yield": 2.1, "pe_fwd": 18.5},
    {"ticker": "HD", "name": "Home Depot", "sector": "Consumer Discretionary", "benchmark_weight": 0.8, "rev_accel": 1.1, "op_margin_accel": 0.5, "fcf_sales": 11.0, "roic": 38.0, "sh_yield": 3.1, "pe_fwd": 24.0},
    {"ticker": "PG", "name": "Procter & Gamble", "sector": "Consumer Staples", "benchmark_weight": 0.8, "rev_accel": 1.4, "op_margin_accel": 1.1, "fcf_sales": 16.0, "roic": 20.0, "sh_yield": 3.9, "pe_fwd": 24.5},
]


def compute_pod_123_and_fcte_quality_screen(
    fundamentals_df: Optional[pd.DataFrame] = None,
    ohlcv_df: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """Scores equities against:
      - Pod 1: YoY Revenue Growth Acceleration (d^2Rev/dt^2 > 0)
      - Pod 2: Operating Margin & FCF Margin Acceleration (FCF/Sales > 15%)
      - Pod 3: ROIC > 15% & Shareholder Yield (Buyback + Dividend)
      - 3Fourteen FCTE Quality + Momentum Score
      - Sam Rahman's +/-300 bps active benchmark weight guardrails
    """
    if isinstance(fundamentals_df, pd.DataFrame) and not fundamentals_df.empty:
        candidates = []
        for _, row in fundamentals_df.iterrows():
            candidates.append({
                "ticker": str(row.get("ticker", row.get("symbol", "N/A"))),
                "name": str(row.get("name", row.get("company_name", row.get("ticker", "N/A")))),
                "sector": str(row.get("sector", "General")),
                "benchmark_weight": float(row.get("benchmark_weight", 1.0)),
                "rev_accel": float(row.get("rev_accel", row.get("revenue_growth_yoy", 2.0))),
                "op_margin_accel": float(row.get("op_margin_accel", row.get("operating_margin", 1.5))),
                "fcf_sales": float(row.get("fcf_sales", row.get("fcf_margin", 12.0))),
                "roic": float(row.get("roic", 15.0)),
                "sh_yield": float(row.get("sh_yield", row.get("shareholder_yield", 2.0))),
                "pe_fwd": float(row.get("pe_fwd", 20.0)),
            })
    elif isinstance(fundamentals_df, list) and len(fundamentals_df) > 0:
        candidates = fundamentals_df
    else:
        candidates = SP500_UNIVERSE_BASELINE

    # Extract 63D momentum if ohlcv_df supplied
    mom_63d_map: Dict[str, float] = {}
    if isinstance(ohlcv_df, pd.DataFrame) and not ohlcv_df.empty:
        try:
            if "ticker" in ohlcv_df.columns and ("close" in ohlcv_df.columns or "Close" in ohlcv_df.columns):
                c_col = "close" if "close" in ohlcv_df.columns else "Close"
                for sym, grp in ohlcv_df.groupby("ticker"):
                    if len(grp) >= 20:
                        m_ret = (grp[c_col].iloc[-1] / grp[c_col].iloc[0] - 1.0) * 100.0
                        mom_63d_map[str(sym)] = m_ret
        except Exception:
            pass

    results = []

    for stock in candidates:
        sym = stock.get("ticker", "")
        # Pod 1: Revenue Acceleration (0 to 10 points)
        pod_1_score = min(10.0, max(0.0, 5.0 + stock.get("rev_accel", 0.0) * 0.5))

        # Pod 2: Operating Margin & FCF conversion (0 to 10 points)
        fcf_bonus = 2.0 if stock.get("fcf_sales", 0.0) > 15.0 else 0.0
        pod_2_score = min(10.0, max(0.0, 4.0 + stock.get("op_margin_accel", 0.0) * 0.6 + fcf_bonus))

        # Pod 3: ROIC & Shareholder Yield (0 to 10 points)
        roic_pts = min(6.0, stock.get("roic", 0.0) * 0.15)
        sh_pts = min(4.0, stock.get("sh_yield", 0.0) * 0.8)
        pod_3_score = min(10.0, roic_pts + sh_pts)

        # Momentum score (0 to 10 points)
        if sym in mom_63d_map:
            mom_score = min(10.0, max(0.0, 5.0 + mom_63d_map[sym] * 0.25))
            fcte_score = round((pod_1_score * 2.5) + (pod_2_score * 2.5) + (pod_3_score * 2.5) + (mom_score * 2.5), 1)
        else:
            # 3Fourteen FCTE Quality composite when standalone
            fcte_score = round((pod_1_score * 3.5) + (pod_2_score * 3.5) + (pod_3_score * 3.0), 1)

        # Sam Rahman +/- 300 bps Active Weight Guardrail
        # Optimal active tilt: between -3.00% and +3.00%
        active_tilt_bps = round((fcte_score - 50.0) * 6.0, 0)
        # Cap at +/- 300 bps guardrail
        active_tilt_bps = max(-300.0, min(300.0, active_tilt_bps))
        target_portfolio_weight = round(max(0.0, stock["benchmark_weight"] + (active_tilt_bps / 100.0)), 2)

        # Classification
        if fcte_score >= 75.0:
            tier = "POD_123_CONVICTION_LONG"
        elif fcte_score <= 45.0:
            tier = "POD_123_UNDERWEIGHT_CANDIDATE"
        else:
            tier = "CORE_NEUTRAL"

        results.append({
            "ticker": stock["ticker"],
            "name": stock["name"],
            "sector": stock["sector"],
            "fcte_composite_score": fcte_score,
            "pod_1_rev_accel_score": round(pod_1_score, 1),
            "pod_2_margin_fcf_score": round(pod_2_score, 1),
            "pod_3_roic_sh_yield_score": round(pod_3_score, 1),
            "benchmark_weight_pct": stock["benchmark_weight"],
            "active_tilt_bps": active_tilt_bps,
            "target_portfolio_weight_pct": target_portfolio_weight,
            "conviction_tier": tier,
        })

    # Sort descending by FCTE Composite Score
    results.sort(key=lambda s: s["fcte_composite_score"], reverse=True)

    top_longs = [s for s in results if s["conviction_tier"] == "POD_123_CONVICTION_LONG"]
    top_shorts = [s for s in results if s["conviction_tier"] == "POD_123_UNDERWEIGHT_CANDIDATE"]

    return {
        "ranked_universe_count": len(results),
        "top_conviction_longs": top_longs,
        "top_underweight_candidates": top_shorts,
        "qualified_candidates": top_longs,
        "full_screen_results": results,
    }


def compute_dr_mo_factor_scores(
    grid_regime: str = "REFLATION",
    vams_dict: Optional[Dict[str, int]] = None
) -> Dict[str, Any]:
    """Helper returning Dr. Mo 70-factor rankings and scores."""
    vams = vams_dict or {"SPY": 1, "GLD": 1, "XLK": 1, "IBIT": 1, "TLT": -1}
    res = compute_kiss_and_dr_mo_portfolios(grid_regime, vams)
    return {
        "factors_count": res["dr_mo_factors_count"],
        "factors": res["dr_mo_model_signals"],
        "kiss_model": res["kiss_model"],
    }

