"""
backend/app/quant_engine/macro_plumbing_state.py
================================================
Institutional Macro Plumbing, US Fiscal Hydraulics & Options Market Dynamics Engine.
Synthesizes:
1. US Fiscal Plumbing Hydraulic Architecture (Fed Balance Sheet = Bank Reserves + TGA + ON RRP):
   - Net Liquidity = WALCL - WTREGEN - RRPONTSYD
   - Hydraulic Reservoirs: Bank Reserves (base collateral), TGA (sterilized cash buffer), ON RRP (liquidity dampener)
   - Issuance Dynamics: T-Bills (absorbed by MMFs via ON RRP, reserves untouched) vs Coupons (drains bank reserves)
   - Shadow Collateral Engine: Cash-Futures Basis Trade (30x-60x leverage funded via overnight repo/SOFR)
   - Foreign Central Bank Diversification (PBOC/BOJ shifting to gold/bills -> Primary Dealer SLR limits -> MOVE index / term premium spike)
   - Four Fiscal Phases: Debt Ceiling Standoff, Debt Ceiling Resolution & Refill, Tax Season (April / Quarterly), Shutdowns

2. Cem Karsan / Noel Smith Options Market Dynamics & Volatility Plumbing:
   - "The tail wags the dog": dealer delta/gamma hedging forces underlying asset pricing
   - Charm (time decay) and Vanna (volatility decay) create mechanical structural bids
   - Index Pinning (covered call ETFs / short vol) vs Single-Stock / Sector Dispersion
   - Fat Left Tail (Minsky Moment): Long Gamma (buy dips, sell rips) vs Short Gamma (cascading crash)
   - Temporal Calendar & OpEx cycles:
     * Pre-OpEx (Valves Closed: 1st of month to 3rd Friday) -> Vanna/Charm flows act as a structural dam
     * Post-OpEx ("Window of Weakness": OpEx + 1 to OpEx + 10 days) -> Options expire, dealer bid vanishes, market absorbs net liquidity drains

3. The 3-Regime Signal Generation Matrix:
   - Regime 1: The Structural Pin (Bullish / Rangebound)
   - Regime 2: The Window of Weakness (Vulnerable / Macro-Driven)
   - Regime 3: The Left Tail Cascade (Crisis Mode)

4. Forward Crash Windows / Fragility Matrix:
   - Calendar mapping of TGA refills & tax deadlines (April 15, June 15, Sept 15, Jan 15) colliding with Post-OpEx Windows of Weakness.

5. Plain English Actionable Trade Ideas / Verdicts & "Where to Look Next" Monitoring Checklist.
"""

import math
import time
import calendar
import logging
from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple

import numpy as np
import pandas as pd

try:
    from app.config import fetch_fred_series_live, fetch_ohlcv_Slot_with_failover
    from app.db.stock_compressed_store import StockCompressedStore
except ImportError:
    from backend.app.config import fetch_fred_series_live, fetch_ohlcv_Slot_with_failover
    from backend.app.db.stock_compressed_store import StockCompressedStore

logger = logging.getLogger("macropulse.macro_plumbing_state")

_IN_MEMORY_PLUMBING_CACHE: Dict[str, Any] = {}
PLUMBING_CACHE_TTL: float = 300.0  # 5 minutes in-memory TTL


def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (ValueError, TypeError):
        return default


def _sanitize_floats(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _sanitize_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_floats(x) for x in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
        return obj
    return obj


def get_third_friday(year: int, month: int) -> date:
    """Returns the 3rd Friday of a given year and month (standard monthly OpEx)."""
    cal = calendar.monthcalendar(year, month)
    fridays = [week[calendar.FRIDAY] for week in cal if week[calendar.FRIDAY] != 0]
    return date(year, month, fridays[2])


def calculate_opex_calendar(reference_date: Optional[date] = None) -> Dict[str, Any]:
    """
    Computes current OpEx temporal state:
    - Current month's 3rd Friday (Monthly OpEx)
    - Next month's 3rd Friday
    - Current phase: PRE_OPEX_STRUCTURAL_PIN vs POST_OPEX_WINDOW_OF_WEAKNESS vs NEUTRAL_TRANSITION
    - Days to next OpEx, days since last OpEx
    - Whether next OpEx is a Quarterly Triple/Quadruple Witching (March, June, Sept, Dec)
    """
    today = reference_date or datetime.now(timezone.utc).date()
    curr_opex = get_third_friday(today.year, today.month)

    # Determine last OpEx and next OpEx
    if today <= curr_opex:
        # We are before or on this month's OpEx
        next_opex = curr_opex
        # Previous month OpEx
        prev_month = 12 if today.month == 1 else today.month - 1
        prev_year = today.year - 1 if today.month == 1 else today.year
        last_opex = get_third_friday(prev_year, prev_month)
    else:
        # We are after this month's OpEx
        last_opex = curr_opex
        next_month = 1 if today.month == 12 else today.month + 1
        next_year = today.year + 1 if today.month == 12 else today.year
        next_opex = get_third_friday(next_year, next_month)

    days_until_next = (next_opex - today).days
    days_since_last = (today - last_opex).days

    # Post-OpEx Window of Weakness: OpEx + 1 to OpEx + 10 calendar days (~1.5-2 weeks)
    # Pre-OpEx Structural Pin: 1st of month up to 3rd Friday
    is_window_of_weakness = 1 <= days_since_last <= 10
    is_structural_pin = (today.day <= curr_opex.day and today <= curr_opex) or (days_until_next > 10 and not is_window_of_weakness)

    if is_window_of_weakness:
        phase = "POST_OPEX_WINDOW_OF_WEAKNESS"
        phase_label = "Post-OpEx Window of Weakness (Valves Open)"
        valve_status = "VALVES_OPEN"
        dealer_bid_description = "Option open interest expired; structural dealer Vanna/Charm shock absorbers removed. Market is unanchored and vulnerable to liquidity drains."
    elif is_structural_pin:
        phase = "PRE_OPEX_STRUCTURAL_PIN"
        phase_label = "Pre-OpEx Structural Pin (Valves Closed)"
        valve_status = "VALVES_CLOSED"
        dealer_bid_description = "Dealer delta/gamma hedging acts as a structural dam. Daily Vanna and Charm decay mechanically absorb selling, pinning the index."
    else:
        phase = "MID_CYCLE_TRANSITION"
        phase_label = "Mid-Cycle Transition"
        valve_status = "PARTIAL_ABSORPTION"
        dealer_bid_description = "Between cycles; directional momentum governed by high-powered liquidity and dealer gamma positioning."

    is_quarterly_opex = next_opex.month in [3, 6, 9, 12]

    return {
        "today": today.isoformat(),
        "last_opex": last_opex.isoformat(),
        "next_opex": next_opex.isoformat(),
        "days_until_next_opex": days_until_next,
        "days_since_last_opex": days_since_last,
        "phase": phase,
        "phase_label": phase_label,
        "valve_status": valve_status,
        "is_window_of_weakness": is_window_of_weakness,
        "is_structural_pin": is_structural_pin,
        "is_quarterly_opex": is_quarterly_opex,
        "dealer_bid_description": dealer_bid_description,
    }


def compute_forward_crash_windows(start_date: Optional[date] = None, quarters_ahead: int = 4) -> List[Dict[str, Any]]:
    """
    Maps the forward Treasury Refill / Tax Drain schedule against the OpEx calendar
    over the next 4 quarters to pinpoint systemic "Crash Windows" months in advance.
    
    Collision Mechanism:
    When a major TGA drain / tax payment date (April 15, June 15, Sept 15, Jan 15)
    or quarterly debt refill aligns with a Post-OpEx Window of Weakness (OpEx + 1 to +10 days),
    shock absorbers are zero while liquidity is drained -> Maximum Risk Collision!
    """
    ref_date = start_date or datetime.now(timezone.utc).date()
    windows = []

    # Check each month for the next 12 months
    for m_offset in range(quarters_ahead * 3):
        m = ((ref_date.month - 1 + m_offset) % 12) + 1
        y = ref_date.year + ((ref_date.month - 1 + m_offset) // 12)
        opex_date = get_third_friday(y, m)
        wow_start = opex_date + timedelta(days=1)
        wow_end = opex_date + timedelta(days=10)
        is_quarterly = m in [3, 6, 9, 12]

        # Check known Treasury / Tax milestones in month m
        fiscal_event = None
        severity = "LOW"
        risk_score = 30

        if m == 4:
            tax_date = date(y, 4, 15)
            fiscal_event = "April Tax Surge (~$250B-$400B TGA Drain in 10 Days)"
            # Check overlap between tax payment week and Window of Weakness
            if wow_start <= tax_date <= wow_end or abs((tax_date - opex_date).days) <= 7:
                severity = "EXTREME_COLLISION"
                risk_score = 95
            else:
                severity = "HIGH"
                risk_score = 80
        elif m == 6:
            tax_date = date(y, 6, 15)
            fiscal_event = "Q2 Corporate Tax Payment & Mid-Year Quarterly Refunding"
            if wow_start <= tax_date <= wow_end or abs((tax_date - opex_date).days) <= 6:
                severity = "HIGH_COLLISION"
                risk_score = 85
            else:
                severity = "ELEVATED"
                risk_score = 65
        elif m == 9:
            tax_date = date(y, 9, 15)
            fiscal_event = "Q3 Corporate Tax Payment & Pre-Fiscal Year-End Treasury Cash Rebalancing"
            if wow_start <= tax_date <= wow_end or abs((tax_date - opex_date).days) <= 6:
                severity = "HIGH_COLLISION"
                risk_score = 85
            else:
                severity = "ELEVATED"
                risk_score = 70
        elif m == 1:
            tax_date = date(y, 1, 15)
            fiscal_event = "Q4 Estimated Tax Inflows & Debt Limit Resets"
            if wow_start <= tax_date <= wow_end:
                severity = "HIGH_COLLISION"
                risk_score = 80
            else:
                severity = "MODERATE"
                risk_score = 60
        elif is_quarterly:
            fiscal_event = f"Quarterly Refunding Issuance Wave & Triple/Quad Witching ({calendar.month_abbr[m]} {y})"
            severity = "ELEVATED"
            risk_score = 70
        else:
            fiscal_event = f"Standard Monthly Treasury Coupon Issuance & Settlement ({calendar.month_abbr[m]} {y})"
            severity = "MODERATE"
            risk_score = 45

        # Collision flag
        has_collision = severity in ["EXTREME_COLLISION", "HIGH_COLLISION"]

        windows.append({
            "year": y,
            "month": m,
            "month_label": f"{calendar.month_name[m]} {y}",
            "opex_date": opex_date.isoformat(),
            "window_of_weakness_start": wow_start.isoformat(),
            "window_of_weakness_end": wow_end.isoformat(),
            "is_quarterly_witching": is_quarterly,
            "fiscal_event": fiscal_event,
            "severity": severity,
            "risk_score": risk_score,
            "has_collision": has_collision,
            "recommended_strategy": (
                "Purchase out-of-the-money put spreads or index collar 2 weeks prior; rotate high-beta tech into T-Bills."
                if has_collision else
                "Monitor Treasury coupon auction tail sizes and SOFR-IORB spread; maintain standard delta hedging."
            )
        })

    return windows


class MacroPlumbingAndOptionsStateEngine:
    """
    Centralized State Machine synchronizing:
    - US Fiscal Plumbing & Net Liquidity Hydraulics
    - Options Market Dynamics & Dealer Gamma/Vanna/Charm Positioning
    - The 3-Regime Signal Matrix
    - Forward Crash Windows & Actionable Trade Verdicts
    """

    @classmethod
    def get_market_volatility_proxies(cls) -> Dict[str, Any]:
        """
        Fetches live market volatility term structure proxies:
        - VIX (30-day implied volatility)
        - VIX3M (3-month implied volatility)
        - VVIX (volatility of volatility)
        - MOVE (Treasury bond volatility)
        - SPY spot price
        - Slope (Contango if VIX < VIX3M; Inversion if VIX > VIX3M)
        """
        # Default fallbacks
        defaults = {
            "vix": 15.8,
            "vix3m": 17.5,
            "vvix": 88.5,
            "move": 94.2,
            "spy_price": 585.0,
            "term_structure_slope": 1.7,
            "term_structure_state": "CONTANGO",
            "is_inverted": False,
            "put_call_ratio": 0.88,
            "is_live": False,
        }

        try:
            res = fetch_ohlcv_Slot_with_failover(["^MOVE", "^VIX", "^VVIX", "^VIX3M", "SPY"], period="1mo")
            close_df = res[0] if isinstance(res, tuple) else res

            def _get_last(tk: str, default_val: float) -> float:
                if isinstance(close_df, pd.DataFrame) and tk in close_df.columns and not close_df[tk].dropna().empty:
                    return float(close_df[tk].dropna().iloc[-1])
                return default_val

            vix_val = _get_last("^VIX", defaults["vix"])
            vix3m_val = _get_last("^VIX3M", defaults["vix3m"])
            vvix_val = _get_last("^VVIX", defaults["vvix"])
            move_val = _get_last("^MOVE", defaults["move"])
            spy_val = _get_last("SPY", defaults["spy_price"])

            slope = round(vix3m_val - vix_val, 2)
            is_inverted = vix_val > vix3m_val
            term_structure_state = "INVERTED_BACKWARDATION" if is_inverted else "CONTANGO"

            return {
                "vix": round(vix_val, 2),
                "vix3m": round(vix3m_val, 2),
                "vvix": round(vvix_val, 2),
                "move": round(move_val, 2),
                "spy_price": round(spy_val, 2),
                "term_structure_slope": slope,
                "term_structure_state": term_structure_state,
                "is_inverted": is_inverted,
                "put_call_ratio": 0.85,
                "is_live": True,
            }
        except Exception as e:
            logger.warning(f"Error fetching live market volatility proxies: {e}")
            return defaults

    @classmethod
    def get_hydraulic_liquidity_state(cls) -> Dict[str, Any]:
        """
        Fetches live FRED US Net Liquidity series and computes hydraulic reservoir mechanics:
        - WALCL: Total Fed Assets
        - WTREGEN: TGA Balance
        - RRPONTSYD: ON RRP Balance
        - WRESBAL: Bank Reserves
        - Net Liquidity = WALCL - WTREGEN - RRPONTSYD
        - Momentum (4W, 13W, 26W)
        - Cash-Futures Basis Trade capacity & Funding pressure
        - Fiscal Phase diagnosis
        """
        try:
            walcl = fetch_fred_series_live("WALCL", limit=120)
            tga = fetch_fred_series_live("WTREGEN", limit=120)
            rrp = fetch_fred_series_live("RRPONTSYD", limit=260)
            reserves = fetch_fred_series_live("WRESBAL", limit=120)
            sofr = fetch_fred_series_live("SOFR", limit=30)
            iorb = fetch_fred_series_live("IORB", limit=30)

            # Normalization to USD Billions
            walcl_bn = walcl / 1000.0 if (not walcl.empty and float(walcl.iloc[-1]) > 50000) else walcl
            tga_bn = tga / 1000.0 if (not tga.empty and float(tga.iloc[-1]) > 5000) else tga
            rrp_bn = rrp / 1000.0 if (not rrp.empty and float(rrp.iloc[-1]) > 5000) else rrp
            res_bn = reserves / 1000.0 if (not reserves.empty and float(reserves.iloc[-1]) > 50000) else reserves

            df = pd.DataFrame({"walcl": walcl_bn, "tga": tga_bn, "rrp": rrp_bn, "res": res_bn}).sort_index()
            df = df.resample("W-WED").last().ffill().dropna(subset=["walcl"])

            if not df.empty:
                df["tga"] = df["tga"].fillna(750.0)
                df["rrp"] = df["rrp"].fillna(85.0)
                df["res"] = df["res"].fillna(3250.0)
                df["net_liq"] = df["walcl"] - (df["tga"] + df["rrp"])

                s_nl = df["net_liq"].dropna().tail(52)
                curr_nl = round(float(s_nl.iloc[-1]), 1)
                nl_4w_ago = float(s_nl.iloc[-5]) if len(s_nl) >= 5 else curr_nl
                nl_13w_ago = float(s_nl.iloc[-14]) if len(s_nl) >= 14 else curr_nl

                roc_4w = round(curr_nl - nl_4w_ago, 1)
                roc_13w = round(curr_nl - nl_13w_ago, 1)
                roc_4w_pct = round(((curr_nl - nl_4w_ago) / max(1.0, nl_4w_ago)) * 100.0, 2)
                roc_13w_pct = round(((curr_nl - nl_13w_ago) / max(1.0, nl_13w_ago)) * 100.0, 2)

                curr_walcl = round(float(df["walcl"].iloc[-1]), 1)
                curr_tga = round(float(df["tga"].iloc[-1]), 1)
                curr_rrp = round(float(df["rrp"].iloc[-1]), 1)
                curr_res = round(float(df["res"].iloc[-1]), 1)
            else:
                curr_nl, roc_4w, roc_13w, roc_4w_pct, roc_13w_pct = 6120.0, 38.5, 92.0, 0.63, 1.53
                curr_walcl, curr_tga, curr_rrp, curr_res = 6810.0, 780.0, 95.0, 3280.0

            # SOFR vs IORB funding stress
            sofr_val = _safe_float(sofr.iloc[-1], 4.82) if not sofr.empty else 4.82
            iorb_val = _safe_float(iorb.iloc[-1], 4.90) if not iorb.empty else 4.90
            sofr_iorb_spread_bps = round((sofr_val - iorb_val) * 100.0, 1)
            repo_pressure = (
                "ELEVATED_STRESS" if sofr_iorb_spread_bps > 5.0 else
                "MODERATE_FRICTION" if sofr_iorb_spread_bps > 0.0 else
                "NORMAL_ABUNDANT"
            )

            # Determine Fiscal Phase
            today = datetime.now(timezone.utc).date()
            if today.month == 4 and today.day >= 10:
                fiscal_phase = "TAX_SEASON_DRAIN"
                fiscal_phase_desc = "April income tax collections actively draining commercial bank deposits into the TGA ($250B-$400B suction)."
            elif curr_tga > 850.0:
                fiscal_phase = "CEILING_REFILL_COMPLETED"
                fiscal_phase_desc = "TGA replenished above target buffer; Treasury coupon issuance moderating."
            elif curr_tga < 300.0:
                fiscal_phase = "DEBT_CEILING_STANDOFF_DRAIN"
                fiscal_phase_desc = "Treasury utilizing Extraordinary Measures; TGA drawdown acting as a stealth liquidity injection."
            else:
                fiscal_phase = "NEUTRAL_REFUNDING_CYCLE"
                fiscal_phase_desc = "Treasury adhering to Quarterly Refunding Announcement schedule; issuance balanced across bills and notes."

            # Issuance Absorption Capacity:
            # If RRP > $200B, MMFs can easily absorb T-Bills without hitting bank reserves.
            # If RRP < $100B, MMF buffer is largely exhausted; any new coupon duration hits commercial bank reserves directly!
            rrp_buffer_status = (
                "HEALTHY_BUFFER" if curr_rrp > 250.0 else
                "DEPLETED_SPONGE" if curr_rrp < 120.0 else
                "MODERATE_BUFFER"
            )

            return {
                "net_liquidity_usd_bn": curr_nl,
                "fed_assets_walcl_bn": curr_walcl,
                "tga_wtregen_bn": curr_tga,
                "on_rrp_bn": curr_rrp,
                "bank_reserves_bn": curr_res,
                "roc_4w_bn": roc_4w,
                "roc_13w_bn": roc_13w,
                "roc_4w_pct": roc_4w_pct,
                "roc_13w_pct": roc_13w_pct,
                "sofr_rate_pct": sofr_val,
                "iorb_rate_pct": iorb_val,
                "sofr_iorb_spread_bps": sofr_iorb_spread_bps,
                "repo_pressure": repo_pressure,
                "fiscal_phase": fiscal_phase,
                "fiscal_phase_desc": fiscal_phase_desc,
                "rrp_buffer_status": rrp_buffer_status,
                "issuance_transmission_diagnosis": (
                    "ON RRP buffer is largely exhausted. New Treasury coupon debt will directly debit commercial bank reserves, intensifying systemic discount rate pressure."
                    if rrp_buffer_status == "DEPLETED_SPONGE" else
                    "ON RRP cash buffer allows Money Market Funds to absorb Treasury bill issuance without draining commercial bank reserves."
                ),
                "is_live": True,
            }
        except Exception as e:
            logger.warning(f"Error computing hydraulic liquidity state: {e}")
            return {
                "net_liquidity_usd_bn": 6120.0,
                "fed_assets_walcl_bn": 6810.0,
                "tga_wtregen_bn": 780.0,
                "on_rrp_bn": 95.0,
                "bank_reserves_bn": 3280.0,
                "roc_4w_bn": 38.5,
                "roc_13w_bn": 92.0,
                "roc_4w_pct": 0.63,
                "roc_13w_pct": 1.53,
                "sofr_rate_pct": 4.82,
                "iorb_rate_pct": 4.90,
                "sofr_iorb_spread_bps": -8.0,
                "repo_pressure": "NORMAL_ABUNDANT",
                "fiscal_phase": "NEUTRAL_REFUNDING_CYCLE",
                "fiscal_phase_desc": "Standard fiscal refunding cycle.",
                "rrp_buffer_status": "DEPLETED_SPONGE",
                "issuance_transmission_diagnosis": "ON RRP buffer near baseline.",
                "is_live": False,
            }

    @classmethod
    def synthesize_3_regime_matrix(
        cls,
        opex_state: Dict[str, Any],
        vol_proxies: Dict[str, Any],
        liquidity_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synthesizes the Cem Karsan / Noel Smith 3-Regime Signal Matrix:
        Regime 1: Structural Pin (Bullish / Rangebound)
        Regime 2: Window of Weakness (Vulnerable / Macro-Driven)
        Regime 3: Left Tail Cascade (Crisis Mode)
        """
        is_pre_opex = opex_state.get("is_structural_pin", False)
        is_wow = opex_state.get("is_window_of_weakness", False)
        is_contango = not vol_proxies.get("is_inverted", False)
        is_inverted = vol_proxies.get("is_inverted", False)
        vix = vol_proxies.get("vix", 16.0)
        vvix = vol_proxies.get("vvix", 88.0)
        pcr = vol_proxies.get("put_call_ratio", 0.85)

        nl_roc_4w_pct = liquidity_state.get("roc_4w_pct", 0.0)
        nl_contracting = nl_roc_4w_pct < 0.0
        nl_sharp_drain = nl_roc_4w_pct < -1.0 or liquidity_state.get("repo_pressure") == "ELEVATED_STRESS"

        # Determine Active Regime
        # Regime 3 Check: Left-Tail Cascade (Negative Gamma Crisis)
        if (nl_sharp_drain and is_inverted) or (vix > 24.0 and is_inverted) or (vvix > 115.0 and is_inverted):
            active_regime_id = 3
            active_regime_name = "REGIME 3: THE LEFT TAIL CASCADE (CRISIS MODE)"
            regime_status_color = "rose"
            badge_label = "CRISIS ALERT"
            executive_verdict = (
                "Dealers warehouse negative gamma and are forced to mechanically short into a falling market. "
                "Shock absorbers have failed and the term structure is backwardated (VIX > VIX3M). "
                "Exit risk assets immediately or implement deep out-of-the-money long volatility hedges."
            )
            trading_playbook = [
                "De-gross equity long portfolios immediately; sell high-beta, unprofitable tech and Russell 2000 small caps.",
                "Rotate proceeds into ultra-short cash equivalents (T-Bills, USFR) and physical Gold (GLD) as Accord 2.0 hedge.",
                "Execute long SPY/QQQ put spreads or long VIX call spreads to monetize convexity as dealers accelerate selling.",
                "Monitor SOFR-IORB spread for repo market seizure and basis trade unwind signals."
            ]
            where_to_look_next = [
                "SOFR vs IORB spread: if spread blows out > +10 bps, expect cash-futures basis trade forced liquidation.",
                "Treasury auction bid-to-cover: primary dealer tails signaling balance sheet absorption saturation.",
                "MOVE Index vs VIX: if MOVE breaches 120 while VIX surges, systemic cross-asset de-grossing is active.",
                "Fed Standing Repo Facility (SRF) take-up: confirms emergency liquidity tapping."
            ]

        # Regime 2 Check: Window of Weakness (Valves open + contracting liquidity)
        elif is_wow or (nl_contracting and not is_pre_opex) or (is_wow and nl_contracting):
            active_regime_id = 2
            active_regime_name = "REGIME 2: THE WINDOW OF WEAKNESS (MACRO-DRIVEN VULNERABILITY)"
            regime_status_color = "amber"
            badge_label = "ELEVATED VULNERABILITY"
            executive_verdict = (
                "Monthly OpEx contracts have settled and the structural dealer Vanna/Charm bid has expired. "
                "The market has lost its mechanical shock absorbers and is fully exposed to underlying Treasury liquidity drains. "
                "Initiate tactical downside hedges and curb aggressive dip-buying."
            )
            trading_playbook = [
                "Initiate tactical downside put collars or long put spreads on SPY and QQQ.",
                "Halt unhedged buy-the-dip strategies; multiple contraction risks are heightened during this 10-day window.",
                "Overweight high-quality balance sheets with strong Free Cash Flow conversion (clean cash conversion > 90%).",
                "Trim long-duration growth assets vulnerable to coupon duration issuance and sovereign yield spikes."
            ]
            where_to_look_next = [
                "Daily TGA balance trajectory on FiscalData: watch for rapid post-auction cash replenishment.",
                "VIX / VIX3M term structure slope: watch for flattening toward inversion (< +0.5 pts contango).",
                "CBOE Equity Put/Call Ratio: spike above 1.0 indicates retail and pod-shop capitulation hedging.",
                "Next upcoming OpEx cycle reset: structural bid begins rebuilding after OpEx + 10 days."
            ]

        # Regime 1: The Structural Pin (Bullish / Rangebound)
        else:
            active_regime_id = 1
            active_regime_name = "REGIME 1: THE STRUCTURAL PIN (BULLISH / RANGEBOUND)"
            regime_status_color = "emerald"
            badge_label = "STRUCTURAL DAM ACTIVE"
            executive_verdict = (
                "The market is inside the Pre-OpEx temporal window with VIX term structure in contango (VIX < VIX3M). "
                "Mechanical dealer hedging (Vanna and Charm decay) acts as a structural dam, absorbing macroeconomic selling. "
                "Override headline bearish macro noise; buy dips and monetize high implied volatility."
            )
            trading_playbook = [
                "Exploit mechanical dealer dip-buying: sell out-of-the-money index puts or deploy short-volatility / put-write strategies.",
                "Maintain core long exposure in high-beta tech, semiconductors, and cyclicals favored by liquidity flow.",
                "Harvest the Volatility Risk Premium (VRP) across SPY and single stocks pinned near major call walls.",
                "Avoid purchasing expensive outright put protection; time decay will relentlessly erode long option premiums."
            ]
            where_to_look_next = [
                "Dealer Gamma Flip Level on SPY: ensure spot remains safely above gamma neutral threshold.",
                "Days remaining until OpEx: begin de-risking as calendar approaches OpEx Friday.",
                "Dispersion under the surface: index pinned while individual earnings stocks exhibit violent idiosyncratic moves.",
                "Foreign central bank gold accumulation and US Treasury auction foreign allotment metrics."
            ]

        # Detailed breakdown for all 3 regimes for UI display
        regimes_breakdown = [
            {
                "id": 1,
                "name": "Regime 1: The Structural Pin",
                "subtitle": "Bullish / Rangebound Dam",
                "condition_logic": "Date is between 1st of month and OpEx Friday AND VIX < VIX3M (Contango).",
                "mechanism": "Charm (time decay) and Vanna (volatility decay) force dealers to mechanically buy underlying indices as hedges decay.",
                "action": "Override bearish macro headlines. Buy dips, sell volatility, hold long core positions.",
                "is_active": active_regime_id == 1,
                "status_badge": "ACTIVE" if active_regime_id == 1 else "INACTIVE",
            },
            {
                "id": 2,
                "name": "Regime 2: Window of Weakness",
                "subtitle": "Vulnerable / Macro-Driven",
                "condition_logic": "Date is between OpEx + 1 and OpEx + 10 days AND Net Liquidity is contracting or flat.",
                "mechanism": "Derivative contracts have expired; structural dealer bids disappear. Shock absorbers vanish while Treasury drains hit.",
                "action": "Macro Vulnerability Alert. Buy downside hedges, rotate to T-Bills and cash, avoid unhedged dip-buying.",
                "is_active": active_regime_id == 2,
                "status_badge": "ACTIVE" if active_regime_id == 2 else "INACTIVE",
            },
            {
                "id": 3,
                "name": "Regime 3: The Left Tail Cascade",
                "subtitle": "Crisis / Negative Gamma",
                "condition_logic": "Net Liquidity sharp contraction AND VIX > VIX3M (Inversion) AND VVIX/Put-Call breakout.",
                "mechanism": "Dealers transition to negative gamma (forced to short into falling markets). Cascading non-linear crash.",
                "action": "De-gross all equities. Exit risk assets; basis trade and risk-parity forced deleveraging active.",
                "is_active": active_regime_id == 3,
                "status_badge": "ACTIVE" if active_regime_id == 3 else "INACTIVE",
            },
        ]

        return {
            "active_regime_id": active_regime_id,
            "active_regime_name": active_regime_name,
            "regime_status_color": regime_status_color,
            "badge_label": badge_label,
            "executive_verdict": executive_verdict,
            "trading_playbook": trading_playbook,
            "where_to_look_next": where_to_look_next,
            "regimes_breakdown": regimes_breakdown,
        }

    @classmethod
    def get_sector_factor_transmission_matrix(cls) -> List[Dict[str, Any]]:
        """
        Sector & Style Factor Transmission Matrix across the 3 core hydraulic liquidity states:
        - Liquidity Flood
        - Liquidity Crunch
        - Funding Market Seizure
        """
        return [
            {
                "regime": "Liquidity Flood",
                "vectors": "TGA ↓ (Drawdown), Bank Reserves ↑, ON RRP ↓, Fed QE/Easing",
                "market_impact": "Yield curve flattens/anchors; credit spreads compress; risk appetite peaks.",
                "winning_sectors_factors": [
                    "Long-Duration & Mega-Cap Tech (XLK, QQQ)",
                    "High-Beta & Unprofitable Growth (ARKK)",
                    "Small-Cap Cyclicals (Russell 2000 / IWM)",
                    "Digital & Speculative Assets (Bitcoin / IBIT)"
                ],
                "losing_sectors_factors": [
                    "Cash & Ultra-Short T-Bills (USFR, BIL)",
                    "Low-Beta Defensive Consumer Staples (XLP)",
                    "High-Dividend Defensive Value (VYM)"
                ],
                "hedging_verdict": "Stay fully invested in growth & tech; finance call spreads by selling far OTM put spreads."
            },
            {
                "regime": "Liquidity Crunch",
                "vectors": "TGA ↑ (Refill/Tax drain), Bank Reserves ↓, ON RRP Depleted, Fed QT",
                "market_impact": "SOFR spreads widen; financial conditions tighten; P/E multiples compress across long duration.",
                "winning_sectors_factors": [
                    "High-Quality Free Cash Flow Compounders (Clean Cash Conversion > 85%)",
                    "Low-Vol / Large-Cap Healthcare & Defensives (XLV, XLP)",
                    "Energy & Physical Commodities (XLE, DBC, GLD)"
                ],
                "losing_sectors_factors": [
                    "High-Multiple Tech & Unprofitable Software",
                    "Leveraged Balance Sheets & High Yield / Junk Credit (HYG)",
                    "Emerging Market Equities (EEM) via strong USD pressure"
                ],
                "hedging_verdict": "Rotate into pristine balance sheets with zero net refinancing debt; execute index put collars."
            },
            {
                "regime": "Funding Market Seizure",
                "vectors": "Repo (SOFR) spikes above IORB; Cash-Futures Basis Trade margin blowout; Primary Dealer SLR limits hit",
                "market_impact": "Panic dash for cash; cross-asset correlation heads to 1.0; risk-parity and hedge fund multi-strategy deleveraging.",
                "winning_sectors_factors": [
                    "US Dollar Cash & Currency (DXY / UUP)",
                    "Short-Term 0-3 Month Treasury Bills (USFR, SGOV, BIL)",
                    "Physical Gold Bullion (GLD / Accord 2.0 Sovereign Reserve Alternative)"
                ],
                "losing_sectors_factors": [
                    "Everything Else: Equities, Real Estate (XLRE), High Yield Credit, Long Treasuries (TLT)",
                    "Leveraged Carry Trades & Crypto"
                ],
                "hedging_verdict": "Maximum defensive posture: 60%+ T-Bills/Cash, long Gold, out-of-the-money VIX calls."
            }
        ]

    @classmethod
    def build_complete_plumbing_and_options_state(cls, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Orchestrates all components and caches in memory + DB store.
        Sub-millisecond retrieval on cache hits.
        """
        cache_key = "central_macro_plumbing_state"
        now = time.time()

        if not force_refresh and cache_key in _IN_MEMORY_PLUMBING_CACHE:
            entry = _IN_MEMORY_PLUMBING_CACHE[cache_key]
            if now - entry["cached_at"] < PLUMBING_CACHE_TTL:
                return entry["payload"]

        # Check DB persistent store
        if not force_refresh:
            try:
                db_data = StockCompressedStore.get_macro_liquidity_payload(cache_key, max_age_seconds=600)
                if db_data:
                    _IN_MEMORY_PLUMBING_CACHE[cache_key] = {"cached_at": now, "payload": db_data}
                    return db_data
            except Exception as e:
                logger.debug(f"DB cache read error for {cache_key}: {e}")

        # Compute live state components
        opex_calendar = calculate_opex_calendar()
        vol_proxies = cls.get_market_volatility_proxies()
        hydraulic_state = cls.get_hydraulic_liquidity_state()
        regime_matrix = cls.synthesize_3_regime_matrix(opex_calendar, vol_proxies, hydraulic_state)
        forward_crash_windows = compute_forward_crash_windows()
        transmission_matrix = cls.get_sector_factor_transmission_matrix()

        # Synthesis
        payload = {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "opex_calendar": opex_calendar,
            "volatility_proxies": vol_proxies,
            "hydraulic_liquidity_state": hydraulic_state,
            "signal_matrix": regime_matrix,
            "forward_crash_windows": forward_crash_windows,
            "sector_factor_transmission_matrix": transmission_matrix,
            "systemic_framework_notes": {
                "hydraulic_formula": "Net Liquidity = Fed Assets (WALCL) - TGA (WTREGEN) - ON RRP (RRPONTSYD)",
                "accounting_identity": "Fed Assets = Bank Reserves + TGA + ON RRP + Currency in Circulation",
                "cem_karsan_noel_smith_thesis": (
                    "Derivatives and options dealer delta hedging dictate underlying market pricing. "
                    "Vanna and Charm create mechanical buying into monthly OpEx (valves closed). "
                    "Post-OpEx (valves open), the structural dealer bid disappears, leaving markets vulnerable to Treasury liquidity drains."
                ),
                "basis_trade_warning": (
                    "Cash-Futures basis trade hedge funds operate at 30x-60x leverage funded via overnight repo/SOFR. "
                    "If repo rates exceed basis yield or clearinghouse margin haircuts increase, forced Treasury selling cascades."
                )
            }
        }

        payload = _sanitize_floats(payload)

        # Cache in memory
        _IN_MEMORY_PLUMBING_CACHE[cache_key] = {"cached_at": now, "payload": payload}

        # Cache in DB
        try:
            StockCompressedStore.save_macro_liquidity_payload(cache_key, payload)
        except Exception as e:
            logger.debug(f"DB cache save error for {cache_key}: {e}")

        return payload
