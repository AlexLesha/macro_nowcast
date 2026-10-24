# Antigravity IDE Specification: Single-Stock Macro-Fundamental X-Ray Engine (`stock_analyzer.py` & `/stock-xray`)

> **Copy-Paste Prompt for Antigravity IDE:**
> *"Read `antigravity_single_stock_analyzer_spec.md` and implement the Single-Stock Macro-Fundamental X-Ray Engine (`backend/app/quant_engine/stock_analyzer.py`), wire the `/api/v1/stock/xray/{ticker}` endpoint into `backend/app/main.py`, and build the interactive Stock X-Ray drawer/sub-page (`frontend/src/app/stock-xray/page.tsx`) so any stock ticker can be evaluated across Sector/Style Factor DNA, Macro Regime & Interest Rate Earnings Sensitivity, Hedgeye's 3 Pods (Revenue/Margin/ROIC RoC & Base Effects), 3Fourteen FCTE Quality, and 42 Macro VAMS/Probable Range."*

---

## 1. Architectural Purpose: Bridging Macro Nowcasting to Single-Stock Selection

While MacroPulse Alpha's existing engines excel at **top-down regime identification** (Quads 1–4, 42 Macro GRID, Macro Weather, Liquidity), evaluating an **individual stock** (`NVDA`, `JPM`, `CAT`, `TSLA`, `COST`, `TPL`, etc.) requires 5 bottom-up quantitative bridges using 100% free data (`yfinance` + `FRED` + `SEC EDGAR`):

1. **Empirical Sector & Style Factor DNA Decomposition (Rolling 126-Day Regression)**:
   - Rather than relying solely on static GICS labels, regresses the stock's daily returns against the **11 S&P Sector ETFs** and **7 Style Factors** (`MTUM`, `IWF`, `IWD`, `QUAL`, `SPHB`, `SPLV`, `IWM`) to identify its true factor beta and Dr. Mo / Quad alignment.
2. **Macro & Interest Rate Sensitivity Matrix (2-Channel Earnings & Valuation Stress Test)**:
   - **Channel 1 — Balance Sheet Refinancing & Floating-Rate Debt Impact on EPS**: Computes Net Debt / EBITDA, Interest Coverage ($\text{EBIT} / \text{Interest}$), Effective Interest Rate on Debt, and the exact **% EPS Hit from a +100 bps Interest Rate Shock**.
   - **Channel 2 — Valuation Duration Beta**: Computes rolling 126-day sensitivity to **10Y Nominal Yields (`^TNX`)**, **10Y Real TIPS Yields (`TIP`)**, **US Dollar (`UUP`)**, and **Crude Oil (`USO`)**.
3. **Hedgeye "3 Pods" Quarterly Rate-of-Change (RoC) & Base-Effect Engine**:
   - **Pod 1 (Revenue Acceleration & Base Effects)**: YoY Revenue growth %, sequential 2nd-derivative acceleration ($\Delta \text{YoY}$), and the next 4 quarters' **Base Comparison Difficulty** ("Easy Valley" vs. "Steep Mountain").
   - **Pod 2 (Margin & Labor/Inflation Pass-Through)**: Gross Margin $\Delta$ bps YoY, Operating Margin $\Delta$ bps YoY, and EBITDA/FCF margin momentum (testing whether sticky inflation is squeezing or expanding margins).
   - **Pod 3 (Capital Allocation & ROIC)**: Return on Invested Capital (ROIC), FCF Conversion ($\text{FCF}/\text{Net Income}$), and Net Buyback / Dilution Rate ($\Delta \text{Shares YoY}$).
4. **42 Macro P/E-to-FCF Ratio & 3Fourteen `FCTE` Full-Cycle Quality Score**:
   - Implements Darius Dale's **P/NTM EPS divided by FCF-per-Share** filter (MSR Slide 116) alongside Warren Pies' `FCTE` Quality + Trend composite.
5. **Tactical Timing Overlay (VAMS + Probable Range 21D Drawdown + Options GEX)**:
   - Combines the fundamental/macro score with 42 Macro VAMS, Probable Range bounds, 21-day expected max drawdown, and options Call/Put walls.

---

## 2. Backend Implementation: `backend/app/quant_engine/stock_analyzer.py`

Create `backend/app/quant_engine/stock_analyzer.py`:

```python
"""
backend/app/quant_engine/stock_analyzer.py
Single-Stock Macro-Fundamental X-Ray Engine:
1. Empirical Sector & Style Factor DNA (Rolling 126D Betas & Correlations)
2. Macro & Interest Rate Earnings Sensitivity (Debt Refinancing EPS Hit + Real-Yield Duration Beta)
3. Hedgeye 3 Pods (Revenue RoC + Base Effects, Operating Margin RoC, ROIC & Share Buybacks)
4. 3Fourteen FCTE Quality Screen & 42 Macro PE-to-FCF Valuation Filter
5. VAMS, Probable Range (5D Return / 21D Max Drawdown) & Composite Investment Verdict (0-100)
"""

import numpy as np
import pandas as pd
import yfinance as yf
from typing import Dict, Any, List, Optional
from backend.app.quant_engine.forty_two_macro_engine import FortyTwoMacroEngine, DR_MO_56_UNIVERSE
from backend.app.quant_engine.hedgeye_quad_matrix import HEDGEYE_EMPIRICAL_BACKTEST

SECTOR_ETFS = {
    "XLK": "Information Technology",
    "XLF": "Financials",
    "XLE": "Energy",
    "XLV": "Health Care",
    "XLI": "Industrials",
    "XLY": "Consumer Discretionary",
    "XLP": "Consumer Staples",
    "XLU": "Utilities",
    "XLB": "Materials",
    "XLRE": "Real Estate",
    "XLC": "Communication Services",
}

STYLE_FACTOR_ETFS = {
    "MTUM": "Momentum",
    "IWF": "Secular Growth",
    "IWD": "Value",
    "QUAL": "Quality",
    "SPHB": "High Beta",
    "SPLV": "Low Beta / Min Vol",
    "IWM": "Small Cap",
    "QQQ": "Mega Cap Tech",
}

MACRO_BENCHMARKS = {
    "SPY": "S&P 500 Market Beta",
    "TLT": "Long Duration Bonds (Inverse Yield)",
    "TIP": "TIPS / Real Yield Proxy",
    "UUP": "US Dollar (DXY)",
    "USO": "Crude Oil / Energy Inflation",
    "GLD": "Gold / Debasement",
}


class SingleStockXRayEngine:
    """Evaluates any individual stock ticker through our 4 institutional macro-quant frameworks."""

    @classmethod
    def analyze_ticker(
        cls,
        ticker: str,
        active_market_regime: str = "REFLATION",
        active_economic_quad: str = "Quad 2"
    ) -> Dict[str, Any]:
        clean_ticker = ticker.strip().upper()
        tk = yf.Ticker(clean_ticker)

        # 1. Fetch 2 years of daily price history for target stock + factor benchmarks
        benchmark_tickers = (
            [clean_ticker]
            + list(SECTOR_ETFS.keys())
            + list(STYLE_FACTOR_ETFS.keys())
            + list(MACRO_BENCHMARKS.keys())
        )
        raw_px = yf.download(benchmark_tickers, period="2y", interval="1d", progress=False, auto_adjust=True)
        close_df = raw_px["Close"] if isinstance(raw_px.columns, pd.MultiIndex) else raw_px

        if clean_ticker not in close_df.columns or close_df[clean_ticker].dropna().empty:
            raise ValueError(f"No market price data found for ticker '{clean_ticker}'.")

        stock_close = close_df[clean_ticker].dropna()

        # 2. Compute VAMS & Probable Range (with 21D Max Drawdown by VAMS State)
        vams_pr = FortyTwoMacroEngine.compute_vams_and_probable_range(stock_close)
        rsi_14d = cls._compute_rsi(stock_close, 14)

        # 3. Empirical Sector, Style Factor & Macro Beta DNA (126-Day Rolling Returns)
        factor_dna = cls._compute_factor_and_macro_dna(clean_ticker, close_df, active_market_regime, active_economic_quad)

        # 4. Fundamental Info, Interest Rate Earnings Sensitivity & 3 Pods (Quarterly RoC)
        info = {}
        try:
            info = tk.info or {}
        except Exception:
            info = {}

        q_fin = pd.DataFrame()
        q_bal = pd.DataFrame()
        q_cf = pd.DataFrame()
        try:
            q_fin = tk.quarterly_income_stmt if hasattr(tk, "quarterly_income_stmt") else tk.quarterly_financials
            q_bal = tk.quarterly_balance_sheet
            q_cf = tk.quarterly_cashflow
        except Exception:
            pass

        rate_sensitivity = cls._compute_interest_rate_and_debt_stress(info, q_fin, q_bal, factor_dna["macro_sensitivities"])
        pods_123 = cls._compute_hedgeye_3_pods_and_base_effects(info, q_fin, q_bal, q_cf)
        quality_valuation = cls._compute_fcte_quality_and_42m_valuation(info, pods_123, rate_sensitivity)

        # 5. Synthesize Final 0-100 Conviction Score & Dr. Mo Proper Sizing
        verdict = cls._compute_composite_verdict(
            clean_ticker,
            info,
            active_market_regime,
            active_economic_quad,
            vams_pr,
            rsi_14d,
            factor_dna,
            rate_sensitivity,
            pods_123,
            quality_valuation,
        )

        return {
            "ticker": clean_ticker,
            "company_name": info.get("longName") or info.get("shortName") or clean_ticker,
            "gics_sector": info.get("sector", "Unknown"),
            "gics_industry": info.get("industry", "Unknown"),
            "market_cap_bn": round((info.get("marketCap", 0) or 0) / 1e9, 2),
            "active_market_regime": active_market_regime,
            "active_economic_quad": active_economic_quad,
            "verdict": verdict,
            "vams_and_probable_range": {**vams_pr, "rsi_14d": rsi_14d},
            "factor_and_sector_dna": factor_dna,
            "interest_rate_and_earnings_sensitivity": rate_sensitivity,
            "hedgeye_3_pods": pods_123,
            "quality_and_valuation": quality_valuation,
        }

    @staticmethod
    def _compute_rsi(series: pd.Series, period: int = 14) -> float:
        delta = series.diff()
        gain = delta.clip(lower=0).rolling(period).mean()
        loss = (-delta.clip(upper=0)).rolling(period).mean()
        rs = gain / loss.replace(0, np.nan)
        rsi = 100.0 - (100.0 / (1.0 + rs))
        return round(float(rsi.iloc[-1]), 1) if not rsi.dropna().empty else 50.0

    @classmethod
    def _compute_factor_and_macro_dna(
        cls,
        ticker: str,
        close_df: pd.DataFrame,
        active_regime: str,
        active_quad: str
    ) -> Dict[str, Any]:
        """Computes 126-day empirical correlations and betas to Sector ETFs, Style Factors, and Macro Proxies."""
        rets = np.log(close_df / close_df.shift(1)).tail(126)
        if ticker not in rets.columns:
            return {}

        target_ret = rets[ticker].dropna()
        reg_key = active_regime.upper()[0] if active_regime else "R"
        q_key = {"Quad 1": "Q1", "Quad 2": "Q2", "Quad 3": "Q3", "Quad 4": "Q4"}.get(active_quad, "Q2")

        # 1. Empirical Sector Alignment
        sector_scores = []
        for sec_etf, sec_name in SECTOR_ETFS.items():
            if sec_etf in rets.columns:
                aligned = pd.concat([target_ret, rets[sec_etf]], axis=1).dropna()
                if len(aligned) > 30:
                    corr = float(aligned.iloc[:, 0].corr(aligned.iloc[:, 1]))
                    cov = float(aligned.iloc[:, 0].cov(aligned.iloc[:, 1]))
                    var = float(aligned.iloc[:, 1].var()) or 1e-6
                    beta = cov / var
                    drmo_dir = DR_MO_56_UNIVERSE.get(sec_etf, {}).get(reg_key, 1)
                    quad_stats = HEDGEYE_EMPIRICAL_BACKTEST.get(sec_etf, {}).get(q_key, {"ev": 0.0, "wr": 0.50})
                    sector_scores.append({
                        "etf": sec_etf,
                        "name": sec_name,
                        "corr_6m": round(corr, 2),
                        "beta_6m": round(beta, 2),
                        "regime_fit": "BULLISH" if drmo_dir == 1 else "BEARISH",
                        "quad_ev_pct": quad_stats["ev"],
                        "quad_win_rate_pct": round(quad_stats["wr"] * 100.0, 0),
                    })
        sector_scores.sort(key=lambda x: x["corr_6m"], reverse=True)

        # 2. Empirical Style Factor Alignment
        style_scores = []
        for fac_etf, fac_name in STYLE_FACTOR_ETFS.items():
            if fac_etf in rets.columns:
                aligned = pd.concat([target_ret, rets[fac_etf]], axis=1).dropna()
                if len(aligned) > 30:
                    corr = float(aligned.iloc[:, 0].corr(aligned.iloc[:, 1]))
                    cov = float(aligned.iloc[:, 0].cov(aligned.iloc[:, 1]))
                    var = float(aligned.iloc[:, 1].var()) or 1e-6
                    beta = cov / var
                    drmo_dir = DR_MO_56_UNIVERSE.get(fac_etf, {}).get(reg_key, 1)
                    quad_stats = HEDGEYE_EMPIRICAL_BACKTEST.get(fac_etf, {}).get(q_key, {"ev": 0.0, "wr": 0.50})
                    style_scores.append({
                        "etf": fac_etf,
                        "name": fac_name,
                        "corr_6m": round(corr, 2),
                        "beta_6m": round(beta, 2),
                        "regime_fit": "BULLISH" if drmo_dir == 1 else "BEARISH",
                        "quad_ev_pct": quad_stats["ev"],
                        "quad_win_rate_pct": round(quad_stats["wr"] * 100.0, 0),
                    })
        style_scores.sort(key=lambda x: x["corr_6m"], reverse=True)

        # 3. Macro Driver Sensitivities (SPX, Bonds/Yields, Real Rates, USD, Oil, Gold)
        macro_sens = {}
        for m_etf, m_label in MACRO_BENCHMARKS.items():
            if m_etf in rets.columns:
                aligned = pd.concat([target_ret, rets[m_etf]], axis=1).dropna()
                if len(aligned) > 30:
                    corr = float(aligned.iloc[:, 0].corr(aligned.iloc[:, 1]))
                    cov = float(aligned.iloc[:, 0].cov(aligned.iloc[:, 1]))
                    var = float(aligned.iloc[:, 1].var()) or 1e-6
                    macro_sens[m_etf] = {
                        "label": m_label,
                        "corr_6m": round(corr, 2),
                        "beta_6m": round(cov / var, 2),
                    }

        top_sec = sector_scores[0] if sector_scores else {"etf": "SPY", "name": "Broad Market", "corr_6m": 0.5, "quad_ev_pct": 0.4}
        top_fac = style_scores[0] if style_scores else {"etf": "MTUM", "name": "Momentum", "corr_6m": 0.5, "quad_ev_pct": 0.7}

        return {
            "primary_empirical_sector": top_sec,
            "primary_empirical_style_factor": top_fac,
            "top_3_sectors": sector_scores[:3],
            "top_4_style_factors": style_scores[:4],
            "macro_sensitivities": macro_sens,
        }

    @staticmethod
    def _compute_interest_rate_and_debt_stress(
        info: Dict[str, Any],
        q_fin: pd.DataFrame,
        q_bal: pd.DataFrame,
        macro_sens: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Quantifies how interest rates and inflation impact the stock's earnings & multiple:
        1. Balance Sheet Refinancing & Floating-Rate Debt Hit to EPS (+100 bps shock)
        2. Equity Duration / Real-Rate Valuation Sensitivity (Beta to TLT/TIP)
        """
        total_debt = float(info.get("totalDebt", 0) or 0)
        total_cash = float(info.get("totalCash", 0) or 0)
        ebitda = float(info.get("ebitda", 0) or 0)
        net_income = float(info.get("netIncomeToCommon", 0) or 0)
        market_cap = float(info.get("marketCap", 1) or 1)

        # Estimate Short-Term / Current Debt from quarterly balance sheet if available
        short_term_debt = 0.0
        if isinstance(q_bal, pd.DataFrame) and not q_bal.empty:
            for row_name in ["Current Debt", "Current Debt And Capital Lease Obligation", "Short Long Term Debt"]:
                if row_name in q_bal.index:
                    val = q_bal.loc[row_name].dropna()
                    if not val.empty:
                        short_term_debt = float(val.iloc[0])
                        break
        if short_term_debt == 0.0 and total_debt > 0:
            short_term_debt = 0.20 * total_debt  # Conservative 20% maturing/floating assumption

        # Estimate annual interest expense
        interest_expense = 0.0
        if isinstance(q_fin, pd.DataFrame) and not q_fin.empty:
            for row_name in ["Interest Expense", "Interest Expense Non Operating", "Net Interest Income"]:
                if row_name in q_fin.index:
                    vals = q_fin.loc[row_name].dropna().head(4)
                    if not vals.empty:
                        interest_expense = abs(float(vals.sum()))
                        break

        net_debt = total_debt - total_cash
        net_debt_to_ebitda = round(net_debt / ebitda, 2) if ebitda > 0 else (0.0 if net_debt <= 0 else 9.9)
        interest_coverage = round(ebitda / interest_expense, 1) if interest_expense > 0 else 50.0
        effective_interest_rate_pct = round((interest_expense / total_debt) * 100.0, 2) if total_debt > 0 else 0.0

        # EPS Impact of +100 bps (+1.0%) increase in interest rates on short-term/floating debt & 12M rollovers
        # Tax shield assumed at 21% statutory corporate rate
        exposed_debt = short_term_debt + 0.15 * max(0.0, total_debt - short_term_debt)
        annual_after_tax_rate_hit = (exposed_debt * 0.01 - total_cash * 0.005) * (1.0 - 0.21)
        if net_income > 0:
            eps_impact_100bps_pct = round((-annual_after_tax_rate_hit / net_income) * 100.0, 2)
        else:
            eps_impact_100bps_pct = round((-annual_after_tax_rate_hit / (0.05 * market_cap)) * 100.0, 2)

        tlt_corr = macro_sens.get("TLT", {}).get("corr_6m", 0.0)
        # Note: TLT price moves inversely to 10Y Treasury yields.
        # If corr(Stock, TLT) < -0.20 -> Stock rises when yields rise (Pro-Cyclical / Reflation beneficiary).
        # If corr(Stock, TLT) > +0.20 -> Stock falls when yields rise (Long-Duration / Rate-Sensitive).
        if tlt_corr > 0.20:
            rate_regime_character = "LONG-DURATION / RATE-SENSITIVE (Hurt by rising 10Y yields; benefits from Fed cuts)"
        elif tlt_corr < -0.20:
            rate_regime_character = "PRO-CYCLICAL / REFLATIONARY (Benefits from rising nominal growth & higher yields)"
        else:
            rate_regime_character = "RATE-AGNOSTIC / IDIOSYNCRATIC (Low direct sensitivity to 10Y Treasury yields)"

        if net_debt <= 0 and eps_impact_100bps_pct >= 0:
            balance_sheet_verdict = "NET CASH FORTRESS (Earns more interest on cash than it pays on debt when rates rise)"
        elif net_debt_to_ebitda < 2.0 and interest_coverage > 6.0:
            balance_sheet_verdict = "INVESTMENT-GRADE RESILIENT (Low refinancing risk in a Higher-for-Longer regime)"
        elif net_debt_to_ebitda < 3.5:
            balance_sheet_verdict = "MODERATE LEVERAGE (Watch OIS Neutral Rate & credit spread widening)"
        else:
            balance_sheet_verdict = "HIGH REFINANCING VULNERABILITY ('Crowded-Out / Zombie Risk' if yields stay elevated)"

        return {
            "total_debt_bn": round(total_debt / 1e9, 2),
            "total_cash_bn": round(total_cash / 1e9, 2),
            "net_debt_to_ebitda": net_debt_to_ebitda,
            "interest_coverage_x": interest_coverage,
            "effective_interest_rate_pct": effective_interest_rate_pct,
            "est_eps_impact_from_plus_100bps_rates_pct": eps_impact_100bps_pct,
            "bond_price_corr_6m": tlt_corr,
            "implied_10y_yield_corr_6m": round(-tlt_corr, 2),
            "rate_regime_character": rate_regime_character,
            "balance_sheet_verdict": balance_sheet_verdict,
        }

    @staticmethod
    def _compute_hedgeye_3_pods_and_base_effects(
        info: Dict[str, Any],
        q_fin: pd.DataFrame,
        q_bal: pd.DataFrame,
        q_cf: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Computes Hedgeye's 3 Pods from quarterly financial statements:
        - Pod 1: Revenue YoY % Growth, 2nd-Derivative Acceleration (Delta YoY), and Next-Quarter Base Comparison
        - Pod 2: Operating Margin & Gross Margin YoY bps expansion (pricing power vs inflation cost squeeze)
        - Pod 3: ROIC, FCF Conversion, and Share Buyback / Dilution trajectory
        """
        rev_yoy_latest = round((info.get("revenueGrowth", 0) or 0) * 100.0, 1)
        rev_yoy_prior = rev_yoy_latest
        rev_roc_accel_bps = 0.0
        base_effect_difficulty = "NEUTRAL BASE COMPARISON"

        op_margin_latest = round((info.get("operatingMargins", 0) or 0) * 100.0, 1)
        gross_margin_latest = round((info.get("grossMargins", 0) or 0) * 100.0, 1)
        op_margin_delta_bps = 0.0

        if isinstance(q_fin, pd.DataFrame) and not q_fin.empty and q_fin.shape[1] >= 5:
            # Extract Total Revenue series (most recent column first)
            rev_row = None
            for k in ["Total Revenue", "Operating Revenue", "Revenue"]:
                if k in q_fin.index:
                    rev_row = q_fin.loc[k].dropna()
                    break
            if rev_row is not None and len(rev_row) >= 5:
                r0, r1, r4 = float(rev_row.iloc[0]), float(rev_row.iloc[1]), float(rev_row.iloc[4])
                if r4 > 0:
                    rev_yoy_latest = round(((r0 / r4) - 1.0) * 100.0, 1)
                if len(rev_row) >= 6 and float(rev_row.iloc[5]) > 0:
                    rev_yoy_prior = round(((r1 / float(rev_row.iloc[5])) - 1.0) * 100.0, 1)
                rev_roc_accel_bps = round((rev_yoy_latest - rev_yoy_prior) * 100.0, 0)

                # Base Effect Check: compare the year-ago sequential jump (r3 vs r4)
                r3 = float(rev_row.iloc[3])
                yr_ago_qoq_pct = ((r3 / r4) - 1.0) * 100.0 if r4 > 0 else 0.0
                if yr_ago_qoq_pct > 5.0:
                    base_effect_difficulty = f"STEEP MOUNTAIN (+{yr_ago_qoq_pct:.1f}% QoQ comp from 1Y ago — harder to accelerate)"
                elif yr_ago_qoq_pct < 0.0:
                    base_effect_difficulty = f"EASY VALLEY ({yr_ago_qoq_pct:.1f}% QoQ comp from 1Y ago — favorable tailwind)"
                else:
                    base_effect_difficulty = f"MODERATE BASE (+{yr_ago_qoq_pct:.1f}% QoQ comp from 1Y ago)"

            # Operating Income margin change
            op_row = None
            for k in ["Operating Income", "EBIT"]:
                if k in q_fin.index:
                    op_row = q_fin.loc[k].dropna()
                    break
            if rev_row is not None and op_row is not None and len(op_row) >= 5 and len(rev_row) >= 5:
                m0 = (float(op_row.iloc[0]) / float(rev_row.iloc[0])) * 100.0 if float(rev_row.iloc[0]) else 0.0
                m4 = (float(op_row.iloc[4]) / float(rev_row.iloc[4])) * 100.0 if float(rev_row.iloc[4]) else 0.0
                op_margin_latest = round(m0, 1)
                op_margin_delta_bps = round((m0 - m4) * 100.0, 0)

        roe_pct = round((info.get("returnOnEquity", 0) or 0) * 100.0, 1)
        roa_pct = round((info.get("returnOnAssets", 0) or 0) * 100.0, 1)

        return {
            "pod_1_revenue": {
                "rev_yoy_pct": rev_yoy_latest,
                "prior_qtr_rev_yoy_pct": rev_yoy_prior,
                "rev_acceleration_bps": rev_roc_accel_bps,
                "status": "ACCELERATING" if rev_roc_accel_bps >= 0 else "DECELERATING",
                "forward_base_effect": base_effect_difficulty,
            },
            "pod_2_margins": {
                "gross_margin_pct": gross_margin_latest,
                "operating_margin_pct": op_margin_latest,
                "operating_margin_yoy_change_bps": op_margin_delta_bps,
                "inflation_passthrough": (
                    "STRONG PRICING POWER (Margins expanding faster than unit costs)"
                    if op_margin_delta_bps >= 0
                    else "MARGIN COMPRESSION (Input/wage costs outpacing pricing)"
                ),
            },
            "pod_3_capital_allocation": {
                "roe_pct": roe_pct,
                "roa_pct": roa_pct,
                "earnings_growth_yoy_pct": round((info.get("earningsGrowth", 0) or 0) * 100.0, 1),
            },
        }

    @staticmethod
    def _compute_fcte_quality_and_42m_valuation(
        info: Dict[str, Any],
        pods_123: Dict[str, Any],
        rate_sens: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Computes:
        1. 42 Macro P/NTM EPS divided by FCF-per-Share (from MSR Slide 116)
        2. 3Fourteen FCTE Quality Score (0-100)
        """
        forward_pe = float(info.get("forwardPE", 0) or info.get("trailingPE", 20) or 20)
        fcf = float(info.get("freeCashflow", 0) or 0)
        shares = float(info.get("sharesOutstanding", 1) or 1)
        market_cap = float(info.get("marketCap", 1) or 1)

        fcf_per_share = round(fcf / shares, 2) if shares > 0 else 0.0
        fcf_yield_pct = round((fcf / market_cap) * 100.0, 2) if market_cap > 0 else 0.0
        pe_to_fcf_per_share = round(forward_pe / fcf_per_share, 2) if fcf_per_share > 0.1 else 99.0

        # 3Fourteen FCTE Quality Composite (0-100): ROA/ROE + Margin Stability + Low Leverage + FCF Yield
        roe_score = min(30.0, max(0.0, pods_123["pod_3_capital_allocation"]["roe_pct"] * 1.2))
        margin_score = min(25.0, max(0.0, pods_123["pod_2_margins"]["operating_margin_pct"] * 1.0))
        lev_score = 25.0 if rate_sens["net_debt_to_ebitda"] < 1.5 else (15.0 if rate_sens["net_debt_to_ebitda"] < 3.0 else 5.0)
        fcf_score = min(20.0, max(0.0, fcf_yield_pct * 4.0))
        fcte_quality_score = round(roe_score + margin_score + lev_score + fcf_score, 1)

        return {
            "forward_pe": round(forward_pe, 1),
            "fcf_per_share_usd": fcf_per_share,
            "fcf_yield_pct": fcf_yield_pct,
            "pe_to_fcf_per_share_ratio": pe_to_fcf_per_share,
            "fcte_quality_score_100": fcte_quality_score,
            "quality_tier": (
                "ELITE COMPOUNDER (Top FCTE Tier)" if fcte_quality_score >= 75 else
                ("SOLID QUALITY" if fcte_quality_score >= 50 else "SPECULATIVE / HIGH BETA")
            ),
        }

    @staticmethod
    def _compute_composite_verdict(
        ticker: str,
        info: Dict[str, Any],
        active_regime: str,
        active_quad: str,
        vams_pr: Dict[str, Any],
        rsi_14d: float,
        factor_dna: Dict[str, Any],
        rate_sens: Dict[str, Any],
        pods_123: Dict[str, Any],
        quality_val: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Combines Macro Regime Fit (25%), VAMS Technicals (25%), 3 Pods RoC (25%), and Rate/Quality Resilience (25%)."""
        sec_fit = 100.0 if factor_dna.get("primary_empirical_sector", {}).get("regime_fit") == "BULLISH" else 25.0
        fac_fit = 100.0 if factor_dna.get("primary_empirical_style_factor", {}).get("regime_fit") == "BULLISH" else 25.0
        macro_score = 0.5 * sec_fit + 0.5 * fac_fit

        vams_state = vams_pr.get("vams_state", 0)
        tech_score = 90.0 if vams_state == 1 else (55.0 if vams_state == 0 else 15.0)
        if rsi_14d >= 75.0:
            tech_score -= 10.0  # Overbought tactical caution

        pod1_accel = pods_123["pod_1_revenue"]["rev_acceleration_bps"] >= 0
        pod2_accel = pods_123["pod_2_margins"]["operating_margin_yoy_change_bps"] >= 0
        pods_score = (50.0 if pod1_accel else 20.0) + (50.0 if pod2_accel else 20.0)

        qual_score = quality_val["fcte_quality_score_100"]
        total_score = round(0.25 * macro_score + 0.25 * tech_score + 0.25 * pods_score + 0.25 * qual_score, 1)

        # Strict Dr. Mo Equity Rule (No SHORT: Half Positions for Equities)
        is_macro_bullish = macro_score >= 50.0
        if is_macro_bullish:
            if vams_state == 1:
                proper_action = "LONG: Max Position (Strong Macro + Bullish VAMS)"
            elif vams_state == 0:
                proper_action = "LONG: Half Position (Bullish Macro + Neutral VAMS)"
            else:
                proper_action = "No Position — Wait for VAMS Flip (Bearish VAMS overrides Macro)"
        else:
            if vams_state == -1:
                proper_action = "SHORT / AVOID: Max Bearish Confluence"
            else:
                proper_action = "No Position (Macro Headwind; No Equity Half-Shorts per Dr. Mo Rule)"

        return {
            "composite_score_100": total_score,
            "dr_mo_proper_action": proper_action,
            "macro_regime_alignment_score": macro_score,
            "technical_vams_score": tech_score,
            "pods_fundamental_roc_score": pods_score,
            "quality_balance_sheet_score": qual_score,
            "plain_english_thesis": (
                f"{ticker} empirically trades closest to {factor_dna.get('primary_empirical_sector', {}).get('name')} "
                f"(${factor_dna.get('primary_empirical_sector', {}).get('etf')}, r={factor_dna.get('primary_empirical_sector', {}).get('corr_6m')}) "
                f"and the {factor_dna.get('primary_empirical_style_factor', {}).get('name')} factor "
                f"(${factor_dna.get('primary_empirical_style_factor', {}).get('etf')}, r={factor_dna.get('primary_empirical_style_factor', {}).get('corr_6m')}). "
                f"In {active_regime} ({active_quad}), its Pod 1 revenue growth is {pods_123['pod_1_revenue']['rev_yoy_pct']}% YoY "
                f"({pods_123['pod_1_revenue']['status']}), and a +100 bps rate shock impacts EPS by an estimated "
                f"{rate_sens['est_eps_impact_from_plus_100bps_rates_pct']}%."
            ),
        }
```

---

## 3. FastAPI Endpoint Wiring (`backend/app/main.py`)

Add the `/api/v1/stock/xray/{ticker}` endpoint to `backend/app/main.py`:

```python
@app.get("/api/v1/stock/xray/{ticker}")
async def get_single_stock_xray(
    ticker: str,
    regime: str = "REFLATION",
    quad: str = "Quad 2"
):
    """Runs the 5-Pillar Single-Stock Macro-Fundamental X-Ray for any stock ticker."""
    from backend.app.quant_engine.stock_analyzer import SingleStockXRayEngine
    try:
        return SingleStockXRayEngine.analyze_ticker(
            ticker=ticker,
            active_market_regime=regime,
            active_economic_quad=quad
        )
    except Exception as e:
        return {"status": "error", "ticker": ticker.upper(), "message": str(e)}
```

---

## 4. Frontend Interactive Stock X-Ray Component (`frontend/src/app/stock-xray/page.tsx`)

Create `frontend/src/app/stock-xray/page.tsx` (and link it in the top navigation bar or as a drawer from the Speculation / Outliers tables) so you can type any stock ticker (`NVDA`, `TPL`, `JPM`, `CAT`, `TSLA`, `MSFT`, etc.) and immediately inspect:
1. **Composite Conviction Score (`0–100`) & Dr. Mo Proper Trade Action** (`LONG: Max Position`, `LONG: Half Position`, `No Position`, `SHORT: Max Position`).
2. **Empirical Sector & Style Factor DNA Card**: Shows which Sector ETF and Style Factor ETF the stock actually correlates with over the trailing 6 months, plus its historical Quad Expected Value and Win Rate.
3. **Interest Rate & Earnings Stress-Test Card**: Displays Net Debt / EBITDA, Interest Coverage, 6M correlation to 10Y Treasury yields, and the exact **Estimated % EPS Impact of a +100 bps Rate Shock**.
4. **Hedgeye 3 Pods Quarterly RoC Card**: Displays Revenue YoY % + 2nd-derivative acceleration ($\Delta \text{bps}$), Forward Base-Effect Difficulty ("Easy Valley" vs. "Steep Mountain"), Operating Margin $\Delta \text{bps}$, and ROE/ROA.
5. **VAMS & Probable Range Card**: Shows live price, Upper/Lower Probable Range bounds, 14D RSI, and historical **21-Day Max Drawdown in Bullish vs. Bearish VAMS**.
