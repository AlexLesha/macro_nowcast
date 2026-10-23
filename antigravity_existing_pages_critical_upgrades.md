# Antigravity IDE Specification: Critical High-Value Upgrades to Existing Pages (Sub-Pages 1, 3 & 4)

## 1. Critical Rationale: Why Only These 6 Upgrades Are Warranted

Following a rigorous audit of the three newly uploaded 2026 42 Macro institutional reports (*Macro Scouting Report* Jan 14, 2026; *Around the Horn* Apr 11, 2026; *Leadoff Morning Note* Jun 3, 2026), **we should NOT bloat existing pages with redundant charts**. However, **6 specific mathematical formulas and rules** in our existing backend (`liquidity_engine.py`, `signals.py`, `macro_nowcast.py`, and `options_outliers.py`) require targeted upgrades because the 2026 reports revealed important methodological refinements:

1. **Upgrade 1 — KISS Model Portfolio 2026 Evolution: `$VT` Equity Default, Gold `INFLATION` Halving Rule & Beta-Adjusted SPX Delta (Sub-Page 1 / `signals.py`)**:
   - *What Changed in 2026*: Between January 14, 2026 (MSR Slide 8/13) and April 11 / June 3, 2026 (ATH Slide 8/14 & LMN Slide 3), 42 Macro made two critical upgrades to KISS:
     1. **Equity Default Upgraded from `$SPYM` (US S&P 500) to `$VT` (Vanguard Total World Stock ETF)** because AI diffusion favors global productivity/profitability convergence and international stocks over crowded US mega-cap tech.
     2. **Gold (`$GLDM`) Top-Down Rule Refined**: While the January 2026 deck tested a fixed `30%` target across all regimes, the April and June 2026 decks codified the exact conditional rule: **Gold's Target Allocation is `30%` in `GOLDILOCKS`, `REFLATION`, and `DEFLATION` (`GRD = 30%`), and is cut in half to `15%` in `INFLATION` (`I = 15%`)** before multiplying by VAMS (`100% / 50% / 0%`).
     3. **6-Month Beta-Adjusted S&P 500 Delta**: Added to quantify true portfolio market beta (`VT = 1.0`, `GLDM = 0.5`, `FBTC = 2.0`, `USFR = 0.0`).
2. **Upgrade 2 — Dr. Mo Strict Asymmetric Sizing Rule: Zero `SHORT: Half Positions` for Equities & Crypto (Sub-Page 3 / `signals.py`)**:
   - *The Flaw*: Our previous `signals.py` allowed `-50%` (`SHORT: Half Position`) for any neutral-VAMS asset in a bearish regime.
   - *The Fix*: All three 2026 reports explicitly state in the Dr. Mo footnote (e.g., LMN Slide 52, ATH Slide 25): **"There are no SHORT: Half Positions for Equity and Crypto exposures."** Because equities and crypto exhibit positive secular drift and extreme right-tail skew, neutral VAMS in a bearish regime must map to **`No Position (0%)`** for Equities and Crypto, while Fixed Income, Commodities, and FX retain `SHORT: Half Position (-50%)`.
3. **Upgrade 3 — 2015–2019 Pre-COVID Baseline Z-Score & 4-Tier Impulse Engine (Sub-Page 1 & 2 / `macro_nowcast.py`)**:
   - *The Flaw*: Rolling 3-year or 10-year Z-scores computed across 2020–2021 suffer from massive COVID lockdown/reopening standard deviation distortion, muting current macro signals.
   - *The Fix*: Implement 42 Macro's exact normalization rule: **all post-2020 macro Z-scores are standardized against their 2015–2019 pre-COVID trend mean and standard deviation**, and every macro release is classified into one of four exact impulse states (`Strong Positive`, `Weak Positive`, `Weak Negative`, `Strong Negative`) by comparing $3\text{M SAAR} \text{ vs. } 6\text{M SAAR} \text{ vs. } 12\text{M YoY}$.
4. **Upgrade 4 — Approximate NTM Marketable Treasury Debt Supply & Fed RMP Offset (Sub-Page 3 / `liquidity_engine.py`)**:
   - *The Flaw*: Our fiscal monitor tracked headline debt and deficits without calculating the forward 12-month gross supply wall that the bond market must absorb.
   - *The Fix*: Add the exact **Approximate NTM Marketable Treasury Debt Supply** formula (ATH Slide 77, MSR Slide 81):
     $$\text{NTM Supply} = \text{Debt Maturing in Next 12M} + \text{Annualized FYTD Budget Deficit} + \text{Annualized Fed Treasury Divestment / RMP Offset}$$
     *(As of April 2026: $\$10,179\text{B Maturing} + \$2,337\text{B Deficit} - \$282\text{B Fed RMP Purchases} = \$12,234\text{B}$ — equal to $231\%$ of US Savings and $40\%$ of Global Savings).*
5. **Upgrade 5 — Global Liquidity 9 Correlation-Adjusted Leading Indicators & OIS Neutral Rate Spread (Sub-Page 3 / `liquidity_engine.py`)**:
   - *The Fix*: Add the **Correlation-Adjusted Z-Score Sum (ex-Stocks & Crypto minus Global Liquidity YoY Z-Score)** across the 9 leading indicators (`[0.0 to 0.5]` = Modest Uptrend; `[0.5 to 1.0]` = Meaningful/Significant Uptrend) and the **OIS-Derived Fed Neutral Rate Model** (`Floor FFR <=5yr` in cutting cycles, `Terminal FFR <=5yr` in hiking cycles minus `EFFR`) to detect when the Fed is falling behind the curve.
6. **Upgrade 6 — Probable Range 21-Day Forward Max Drawdown by VAMS State & 4-Quadrant Crowding Filter (Sub-Page 4 / `options_outliers.py`)**:
   - *The Fix*: Upgrade the Sub-Page 4 Risk Range / Outlier table to include **Mean 21-Day Forward Max Drawdown conditioned on VAMS State** (proving empirically that Bearish VAMS has ~2x the 21-day drawdown of Bullish VAMS) and classify all 4 quadrants of the `14D RSI vs. 3M ETF Flow Z-Score` Crowding Model (`Signal: Chasing Highs`, `Signal: Puking Lows`, `Noise: Buying Dip Already`, `Noise: Selling Rip Already`).

---

## 2. Drop-In Code Updates for Antigravity IDE

### 2.1 Update `backend/app/quant_engine/signals.py`

Replace `compute_kiss_v2_portfolio` and update `compute_dr_mo_proper_trade` in `backend/app/quant_engine/signals.py`:

```python
from typing import Dict, Any

def compute_kiss_2026_portfolio(
    primary_regime: str,
    vt_vams: int,
    gldm_vams: int,
    fbtc_vams: int,
    gold_rule: str = "april_2026_conditional"
) -> Dict[str, Any]:
    """
    KISS 2026 Exact Sizing Rules (from 42 Macro April 11 & June 3, 2026 Reports):
    - Default Tickers: 60% Stocks ($VT), 30% Gold ($GLDM), 10% Bitcoin ($FBTC), Cash ($USFR).
    - Top-Down Risk Management Overlay:
      * Stocks ($VT): 60% in GOLDILOCKS or REFLATION; cut in half to 30% in INFLATION or DEFLATION.
      * Gold ($GLDM):
        - If 'april_2026_conditional' (default): 30% in GOLDILOCKS, REFLATION, or DEFLATION; cut in half to 15% in INFLATION.
        - If 'jan_2026_fixed': 30% fixed across all 4 regimes.
      * Bitcoin ($FBTC): 10% in GOLDILOCKS or REFLATION; cut in half to 5% in INFLATION or DEFLATION.
    - Bottom-Up VAMS Overlay:
      * Bullish (+1) = 100% of Target
      * Neutral (0)  = 50% of Target
      * Bearish (-1) = 0% of Target
    - Residual allocated to $USFR (WisdomTree Floating Rate Treasury Fund).
    """
    reg = primary_regime.upper()
    is_risk_on = reg in ["GOLDILOCKS", "REFLATION"]

    vt_target = 0.60 if is_risk_on else 0.30
    if gold_rule == "april_2026_conditional":
        gldm_target = 0.15 if reg == "INFLATION" else 0.30
    else:
        gldm_target = 0.30
    fbtc_target = 0.10 if is_risk_on else 0.05

    targets = {"VT": vt_target, "GLDM": gldm_target, "FBTC": fbtc_target}
    vams_states = {"VT": vt_vams, "GLDM": gldm_vams, "FBTC": fbtc_vams}
    betas_6m = {"USFR": 0.0, "VT": 1.0, "GLDM": 0.5, "FBTC": 2.0}

    executed_weights = {}
    for ticker, target in targets.items():
        v = vams_states[ticker]
        scalar = 1.0 if v == 1 else (0.5 if v == 0 else 0.0)
        executed_weights[ticker] = round(target * scalar * 100.0, 2)

    executed_weights["USFR"] = round(max(0.0, 100.0 - sum(executed_weights.values())), 2)
    portfolio_spx_beta_delta = round(
        sum((executed_weights[k] / 100.0) * betas_6m[k] for k in ["VT", "GLDM", "FBTC"]) * 100.0, 1
    )

    return {
        "is_risk_on": is_risk_on,
        "target_weights_pct": {k: round(v * 100.0, 1) for k, v in targets.items()},
        "executed_weights_pct": executed_weights,
        "portfolio_beta_adjusted_spx_delta_pct": portfolio_spx_beta_delta
    }


def compute_dr_mo_2026_proper_trade(
    vams_state: int,
    is_historically_bullish_in_regime: bool,
    is_equity_or_crypto: bool
) -> Dict[str, Any]:
    """
    Exact 42 Macro Dr. Mo Proper Trade Rule (LMN Slide 52 / ATH Slide 25):
    - If asset should be Bullish in current Market Regime:
      * Bullish VAMS (+1) -> LONG: Max Position (100%)
      * Neutral VAMS (0)  -> LONG: Half Position (50%)
      * Bearish VAMS (-1) -> No Position (0%)
    - If asset should be Bearish in current Market Regime:
      * Bearish VAMS (-1) -> SHORT: Max Position (-100%)
      * Neutral VAMS (0)  -> No Position (0%) if Equity/Crypto; else SHORT: Half Position (-50%)
      * Bullish VAMS (+1) -> No Position (0%)
    """
    if is_historically_bullish_in_regime:
        if vams_state == 1:
            return {"recommendation": "LONG: Max Position", "size_multiplier": 1.0}
        elif vams_state == 0:
            return {"recommendation": "LONG: Half Position", "size_multiplier": 0.5}
        return {"recommendation": "No Position", "size_multiplier": 0.0}
    else:
        if vams_state == -1:
            return {"recommendation": "SHORT: Max Position", "size_multiplier": -1.0}
        elif vams_state == 0:
            if is_equity_or_crypto:
                return {"recommendation": "No Position (No Equity/Crypto Half-Shorts)", "size_multiplier": 0.0}
            return {"recommendation": "SHORT: Half Position", "size_multiplier": -0.5}
        return {"recommendation": "No Position", "size_multiplier": 0.0}
```

### 2.2 Update `backend/app/quant_engine/liquidity_engine.py`

Add the **Approximate NTM Marketable Treasury Supply**, **OIS Neutral Rate Spread**, and **Global Liquidity Leading Indicator Z-Sum** to `backend/app/quant_engine/liquidity_engine.py`:

```python
import numpy as np
from typing import Dict, Any

def compute_42m_liquidity_and_treasury_supply(
    cb_assets_usd_tn: float,
    broad_m2_usd_tn: float,
    fx_reserves_ex_gold_tn: float,
    move_index: float,
    lead_z_sum_ex_equities_crypto: float,
    glp_yoy_z_score: float,
    maturing_debt_12m_bn: float = 10179.0,
    annualized_deficit_bn: float = 2337.0,
    fed_divestment_or_rmp_bn: float = -282.0,
    effr: float = 3.62,
    ois_floor_5y: float = 3.73,
    ois_terminal_5y: float = 4.01
) -> Dict[str, Any]:
    """
    Combines:
    1. 42 Macro Global Liquidity Proxy ($tn) & Collateral Vol Adjustment
    2. Leading Indicators Z-Sum minus GLP YoY Z-Score:
       - y in [0.0, 0.5] -> 'Modest Uptrend'
       - y in [0.5, 1.0+] -> 'Meaningful / Significant Uptrend'
    3. Approximate NTM Marketable US Treasury Debt Supply ($bn)
    4. OIS-Derived Fed Neutral Rate Spread (Cutting = Floor FFR; Hiking = Terminal FFR)
    """
    nominal_total_tn = cb_assets_usd_tn + broad_m2_usd_tn + fx_reserves_ex_gold_tn
    log10_move = float(np.log10(max(10.0, move_index)))
    vol_adjusted_proxy = round(nominal_total_tn / log10_move, 2)

    y_diff = round(lead_z_sum_ex_equities_crypto - glp_yoy_z_score, 2)
    if y_diff >= 0.50:
        lead_signal = "MEANINGFUL UPTREND OVER MEDIUM TERM (y >= 0.50)"
    elif y_diff >= 0.0:
        lead_signal = "MODEST UPTREND OVER MEDIUM TERM (0.0 <= y < 0.50)"
    elif y_diff >= -0.50:
        lead_signal = "MODEST DOWNTREND OVER MEDIUM TERM (-0.50 <= y < 0.0)"
    else:
        lead_signal = "MEANINGFUL DOWNTREND OVER MEDIUM TERM (y < -0.50)"

    ntm_supply_bn = round(maturing_debt_12m_bn + annualized_deficit_bn + fed_divestment_or_rmp_bn, 1)

    return {
        "nominal_global_liquidity_tn": round(nominal_total_tn, 2),
        "vol_adjusted_global_liquidity_proxy": vol_adjusted_proxy,
        "lead_minus_glp_z_diff": y_diff,
        "medium_term_liquidity_signal": lead_signal,
        "ntm_marketable_treasury_supply_bn": ntm_supply_bn,
        "ois_cutting_neutral_spread_bps": round((ois_floor_5y - effr) * 100.0, 0),
        "ois_hiking_neutral_spread_bps": round((ois_terminal_5y - effr) * 100.0, 0),
    }
```

### 2.3 Update `backend/app/quant_engine/options_outliers.py`

Update `compute_gen2_crowding_modifier` in `backend/app/quant_engine/options_outliers.py` to include all 4 quadrants of the Crowding Model and the 21-day VAMS drawdown penalty:

```python
from typing import Dict, Any

def compute_gen2_crowding_and_vams_dd_modifier(
    rsi_14d: float,
    flow_z_3m: float,
    vams_state: int
) -> Dict[str, Any]:
    """
    Applies 42 Macro's 4-Quadrant Crowding Model (<3wk horizon) & VAMS 21D Drawdown Risk:
    - RSI <= 30 and 3M Flow Z <= -2.0 -> SIGNAL: BULLISH (Investors Puking Local Lows) -> +15 pt boost
    - RSI >= 70 and 3M Flow Z >= +2.0 -> SIGNAL: BEARISH (Investors Chasing Local Highs) -> -15 pt penalty
    - RSI <= 30 and 3M Flow Z > -2.0  -> NOISE: Buying the Dip Already -> 0 pt
    - RSI >= 70 and 3M Flow Z < +2.0  -> NOISE: Selling the Rip Already -> 0 pt
    """
    if rsi_14d <= 30.0 and flow_z_3m <= -2.0:
        sig, adj = "SIGNAL_BULLISH_PUKING_LOWS", 15.0
    elif rsi_14d >= 70.0 and flow_z_3m >= 2.0:
        sig, adj = "SIGNAL_BEARISH_CHASING_HIGHS", -15.0
    elif rsi_14d <= 30.0:
        sig, adj = "NOISE_BUYING_DIP_ALREADY", 0.0
    elif rsi_14d >= 70.0:
        sig, adj = "NOISE_SELLING_RIP_ALREADY", 0.0
    else:
        sig, adj = "NEUTRAL_FLOW", 0.0

    # VAMS 21-day drawdown expectation adjustment
    vams_dd_adj = 5.0 if vams_state == 1 else (-10.0 if vams_state == -1 else 0.0)

    return {
        "crowding_quadrant": sig,
        "crowding_score_adjustment": adj,
        "vams_drawdown_score_adjustment": vams_dd_adj,
        "total_score_adjustment": adj + vams_dd_adj
    }
```

---

## 3. Verification Steps for Antigravity

```bash
python -c "from backend.app.quant_engine.signals import compute_kiss_2026_portfolio, compute_dr_mo_2026_proper_trade; print('KISS Apr/Jun 2026 Reflation:', compute_kiss_2026_portfolio('REFLATION', 1, 0, -1)['executed_weights_pct']); print('Equity in Bear Regime w/ Neutral VAMS:', compute_dr_mo_2026_proper_trade(0, False, True)['recommendation'])"
```
*Expected Output*:
- `KISS Apr/Jun 2026 Reflation: {'VT': 60.0, 'GLDM': 15.0, 'FBTC': 0.0, 'USFR': 25.0}`
- `Equity in Bear Regime w/ Neutral VAMS: No Position (No Equity/Crypto Half-Shorts)`
