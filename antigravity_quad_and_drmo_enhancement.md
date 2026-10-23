# Antigravity IDE Specification: Exact Hedgeye Quad Matrix & 42 Macro Dr. Mo Engine Upgrade

## 1. Architectural Scope & New Empirical Intelligence

This specification upgrades `backend/app/quant_engine/signals.py`, `backend/app/quant_engine/macro_nowcast.py`, and `frontend/src/` by integrating:
1. **Hedgeye's Exact 20-Year Empirical Backtest Data** (from Hedgeye GIP Model Market History Backtests since 1Q98 across 40+ asset classes, sectors, fixed income, and currencies).
2. **Hedgeye's Formal 4-Quad Portfolio Models**:
   - **Hypothetical Long-Only Balanced Portfolio**:
     - *Quad 1*: 70% Equities / 20% Fixed Income / 5% FX / 5% Commodities
     - *Quad 2*: 60% Equities / 20% Fixed Income / 10% FX / 10% Commodities
     - *Quad 3*: 40% Equities / 40% Fixed Income / 10% FX / 10% Commodities
     - *Quad 4*: 30% Equities / 50% Fixed Income / 10% FX / 10% Commodities
   - **Hypothetical Long-Short Market Neutral Portfolio** (Target Gross 200% / Target Net 10%).
3. **42 Macro Discretionary Risk Management Overlay ("Dr. Mo") Protocol**:
   - Absolute decoupling of **KISS Model** (systematic 60/30/10/Cash) from **Dr. Mo** (discretionary 70-asset rotation).
   - Strict 3-state allocation logic: `LONG/SHORT Max (100%)`, `LONG/SHORT Half (50%)`, and `No Position (0%)`.
4. **ISM Leading Recession Probability Gauge**:
   - `ISM < 50` $\to$ 60% recession probability
   - `ISM < 47` $\to$ 80% recession probability
   - `ISM < 46` $\to$ 100% recession probability

---

## 2. Updated File Targets

Implement or replace these files in the repository:
```
backend/app/quant_engine/
├── hedgeye_quad_matrix.py   # NEW: Exact 20-year empirical table & portfolio templates
├── signals.py               # UPDATED: Upgraded Dr. Mo & QuadAlignment scoring
└── macro_nowcast.py         # UPDATED: Added ISM recession probability tiers
```

---

## 3. Module 1: Exact Hedgeye Empirical Quad Matrix (`hedgeye_quad_matrix.py`)

Create `backend/app/quant_engine/hedgeye_quad_matrix.py`:

```python
"""
backend/app/quant_engine/hedgeye_quad_matrix.py
Exact Hedgeye GIP Model 20-Year Empirical Backtest Data (since 1Q98).
Data Source: Bloomberg / Hedgeye Risk Management LLC.
"""

from typing import Dict, Any, List

# 1. Exact 20-Year Backtest Performance & Win-Rates
# Fields: expected_value_weighted (EV), win_rate_positive_ratio (WR)
HEDGEYE_EMPIRICAL_BACKTEST = {
    # Equities & Indices
    "SPY": {
        "Q1": {"ev": 1.4, "wr": 0.81}, "Q2": {"ev": 0.4, "wr": 0.75},
        "Q3": {"ev": 0.1, "wr": 0.59}, "Q4": {"ev": -0.4, "wr": 0.56}
    },
    "QQQ": {
        "Q1": {"ev": 2.0, "wr": 0.76}, "Q2": {"ev": 1.2, "wr": 0.75},
        "Q3": {"ev": 0.0, "wr": 0.52}, "Q4": {"ev": -0.7, "wr": 0.56}
    },
    "IWM": {
        "Q1": {"ev": 1.5, "wr": 0.76}, "Q2": {"ev": 0.5, "wr": 0.75},
        "Q3": {"ev": 0.1, "wr": 0.52}, "Q4": {"ev": -0.1, "wr": 0.56}
    },
    # S&P 500 Select Sectors
    "XLK": { # Technology
        "Q1": {"ev": 1.8, "wr": 0.81}, "Q2": {"ev": 1.0, "wr": 0.81},
        "Q3": {"ev": 0.4, "wr": 0.52}, "Q4": {"ev": -0.7, "wr": 0.56}
    },
    "XLY": { # Consumer Discretionary
        "Q1": {"ev": 1.7, "wr": 0.81}, "Q2": {"ev": 0.4, "wr": 0.75},
        "Q3": {"ev": 0.1, "wr": 0.59}, "Q4": {"ev": 0.0, "wr": 0.44}
    },
    "XLI": { # Industrials
        "Q1": {"ev": 1.5, "wr": 0.71}, "Q2": {"ev": 0.5, "wr": 0.75},
        "Q3": {"ev": 0.0, "wr": 0.48}, "Q4": {"ev": -0.4, "wr": 0.44}
    },
    "XLB": { # Materials
        "Q1": {"ev": 1.5, "wr": 0.81}, "Q2": {"ev": 0.5, "wr": 0.75},
        "Q3": {"ev": -0.1, "wr": 0.52}, "Q4": {"ev": 0.1, "wr": 0.56}
    },
    "XLE": { # Energy
        "Q1": {"ev": -1.2, "wr": 0.71}, "Q2": {"ev": 0.3, "wr": 0.75},
        "Q3": {"ev": 0.4, "wr": 0.63}, "Q4": {"ev": -0.4, "wr": 0.50}
    },
    "XLF": { # Financials
        "Q1": {"ev": 1.4, "wr": 0.76}, "Q2": {"ev": 0.3, "wr": 0.69},
        "Q3": {"ev": -0.2, "wr": 0.56}, "Q4": {"ev": -0.2, "wr": 0.63}
    },
    "XLV": { # Health Care
        "Q1": {"ev": 1.3, "wr": 0.81}, "Q2": {"ev": 0.3, "wr": 0.69},
        "Q3": {"ev": 0.0, "wr": 0.52}, "Q4": {"ev": 0.1, "wr": 0.75}
    },
    "XLP": { # Consumer Staples
        "Q1": {"ev": 1.1, "wr": 0.86}, "Q2": {"ev": 0.1, "wr": 0.63},
        "Q3": {"ev": 0.0, "wr": 0.59}, "Q4": {"ev": 0.2, "wr": 0.69}
    },
    "XLU": { # Utilities
        "Q1": {"ev": 0.8, "wr": 0.71}, "Q2": {"ev": -0.7, "wr": 0.31},
        "Q3": {"ev": 0.7, "wr": 0.67}, "Q4": {"ev": -0.2, "wr": 0.50}
    },
    "VNQ": { # Real Estate / REITs
        "Q1": {"ev": 1.3, "wr": 0.67}, "Q2": {"ev": 0.1, "wr": 0.62},
        "Q3": {"ev": 0.2, "wr": 0.64}, "Q4": {"ev": 0.0, "wr": 0.82}
    },
    # Style Factors
    "IWF": { # Russell 1000 Growth
        "Q1": {"ev": 1.5, "wr": 0.71}, "Q2": {"ev": 0.7, "wr": 0.75},
        "Q3": {"ev": 0.1, "wr": 0.63}, "Q4": {"ev": -0.4, "wr": 0.56}
    },
    "IWD": { # Russell 1000 Value
        "Q1": {"ev": 1.4, "wr": 0.71}, "Q2": {"ev": 0.0, "wr": 0.75},
        "Q3": {"ev": 0.1, "wr": 0.56}, "Q4": {"ev": -0.1, "wr": 0.69}
    },
    "SPHB": { # High Beta
        "Q1": {"ev": 2.0, "wr": 0.67}, "Q2": {"ev": 0.6, "wr": 0.81},
        "Q3": {"ev": 0.2, "wr": 0.56}, "Q4": {"ev": -0.7, "wr": 0.56}
    },
    "MTUM": { # Momentum
        "Q1": {"ev": 1.7, "wr": 0.90}, "Q2": {"ev": 0.7, "wr": 0.69},
        "Q3": {"ev": 0.3, "wr": 0.48}, "Q4": {"ev": -1.0, "wr": 0.56}
    },
    "QUAL": { # Quality
        "Q1": {"ev": 1.5, "wr": 0.90}, "Q2": {"ev": 0.5, "wr": 0.81},
        "Q3": {"ev": 0.2, "wr": 0.56}, "Q4": {"ev": 0.0, "wr": 0.56}
    },
    "SPLV": { # Low Beta / Min Vol
        "Q1": {"ev": 1.2, "wr": 0.71}, "Q2": {"ev": -0.2, "wr": 0.63},
        "Q3": {"ev": 0.2, "wr": 0.52}, "Q4": {"ev": 0.4, "wr": 0.75}
    },
    # Fixed Income & Rates
    "TLT": { # 20Y+ Treasuries (Yield proxy inverse)
        "Q1": {"ev": -0.1, "wr": 0.48}, "Q2": {"ev": -0.7, "wr": 0.31},
        "Q3": {"ev": 0.0, "wr": 0.52}, "Q4": {"ev": 1.1, "wr": 0.69}
    },
    "IEF": { # 7-10Y Treasuries
        "Q1": {"ev": 0.5, "wr": 0.52}, "Q2": {"ev": -1.1, "wr": 0.38},
        "Q3": {"ev": 0.0, "wr": 0.52}, "Q4": {"ev": 1.5, "wr": 0.69}
    },
    "TIP": { # TIPS
        "Q1": {"ev": -0.2, "wr": 0.43}, "Q2": {"ev": 1.0, "wr": 0.75},
        "Q3": {"ev": -0.2, "wr": 0.56}, "Q4": {"ev": 0.0, "wr": 0.50}
    },
    "HYG": { # High Yield Credit (Spread proxy inverse)
        "Q1": {"ev": 0.2, "wr": 0.71}, "Q2": {"ev": 0.5, "wr": 0.69},
        "Q3": {"ev": -1.4, "wr": 0.52}, "Q4": {"ev": -0.8, "wr": 0.50}
    },
    # Commodities & Currencies
    "GLD": { # Gold
        "Q1": {"ev": -0.2, "wr": 0.52}, "Q2": {"ev": -0.1, "wr": 0.75},
        "Q3": {"ev": 0.4, "wr": 0.59}, "Q4": {"ev": 0.1, "wr": 0.63}
    },
    "USO": { # WTI / Brent Crude
        "Q1": {"ev": -0.6, "wr": 0.52}, "Q2": {"ev": 2.3, "wr": 0.75},
        "Q3": {"ev": 1.0, "wr": 0.52}, "Q4": {"ev": -0.7, "wr": 0.50}
    },
    "UUP": { # US Dollar (DXY)
        "Q1": {"ev": -0.1, "wr": 0.43}, "Q2": {"ev": -0.3, "wr": 0.38},
        "Q3": {"ev": -0.1, "wr": 0.52}, "Q4": {"ev": 0.3, "wr": 0.63}
    }
}

# 2. Exact Hedgeye Model Portfolios from "What Works In Each Quad?"
HEDGEYE_PORTFOLIO_MODELS = {
    "Quad 1": {
        "macro_split": {"Equities": 0.70, "Fixed Income": 0.20, "Currencies": 0.05, "Commodities": 0.05},
        "long_only_weights": {
            "XLK": 0.088, "XLY": 0.088, "XLI": 0.088, "XLB": 0.088,
            "SPHB": 0.117, "IWF": 0.117, "MTUM": 0.117,
            "CWB": 0.050, "HYG": 0.050, "BKLN": 0.050, "BIZD": 0.050,
            "FXE": 0.050, "JJC": 0.050
        },
        "short_weights": {
            "XLU": -0.079, "XLP": -0.079, "XLE": -0.079, "XLV": -0.079,
            "SPLV": -0.105, "DEF": -0.105, "SPHD": -0.105,
            "TIP": -0.045, "SHY": -0.045, "MBB": -0.045, "IEF": -0.045,
            "UUP": -0.045, "DBA": -0.045
        }
    },
    "Quad 2": {
        "macro_split": {"Equities": 0.60, "Fixed Income": 0.20, "Currencies": 0.10, "Commodities": 0.10},
        "long_only_weights": {
            "XLK": 0.075, "XLY": 0.075, "XLI": 0.075, "XLE": 0.075,
            "MTUM": 0.100, "IWF": 0.100, "IWM": 0.100,
            "BIZD": 0.050, "CWB": 0.050, "PFF": 0.050, "BKLN": 0.050,
            "CEW": 0.100, "USO": 0.100
        },
        "short_weights": {
            "IYZ": -0.068, "XLU": -0.068, "XLP": -0.068, "VNQ": -0.068,
            "SPLV": -0.090, "IWD": -0.090, "SPHD": -0.090,
            "TLT": -0.045, "MUB": -0.045, "LQD": -0.045, "IEF": -0.045,
            "UUP": -0.090, "DBA": -0.090
        }
    },
    "Quad 3": {
        "macro_split": {"Equities": 0.40, "Fixed Income": 0.40, "Currencies": 0.10, "Commodities": 0.10},
        "long_only_weights": {
            "XLU": 0.050, "XLK": 0.050, "XLE": 0.050, "VNQ": 0.050,
            "SPLV": 0.067, "QUAL": 0.067, "IWF": 0.067,
            "MUB": 0.100, "TLT": 0.100, "TIP": 0.100, "LQD": 0.100,
            "UDN": 0.100, "USO": 0.100
        },
        "short_weights": {
            "XLF": -0.045, "XLB": -0.045, "IYZ": -0.045, "XLP": -0.045,
            "SPHD": -0.060, "IWM": -0.060, "IWD": -0.060,
            "BIZD": -0.090, "PFF": -0.090, "CWB": -0.090, "BKLN": -0.090,
            "CEW": -0.090, "DBB": -0.090
        }
    },
    "Quad 4": {
        "macro_split": {"Equities": 0.30, "Fixed Income": 0.50, "Currencies": 0.10, "Commodities": 0.10},
        "long_only_weights": {
            "XLP": 0.038, "XLV": 0.038, "VNQ": 0.038, "XLU": 0.038,
            "SPLV": 0.050, "SPHD": 0.050, "DEF": 0.050,
            "TLT": 0.125, "IEF": 0.125, "MUB": 0.125, "MBB": 0.125,
            "UUP": 0.100, "GLD": 0.100
        },
        "short_weights": {
            "XLK": -0.034, "XLE": -0.034, "XLI": -0.034, "XLF": -0.034,
            "MTUM": -0.045, "SPHB": -0.045, "IWF": -0.045,
            "CWB": -0.113, "TIP": -0.113, "BKLN": -0.113, "HYG": -0.113,
            "FXE": -0.090, "USO": -0.090
        }
    }
}
```

---

## 4. Module 2: Upgraded Signals & Dr. Mo Engine (`signals.py`)

In `backend/app/quant_engine/signals.py`, implement the rigorous 42 Macro Dr. Mo logic and update the `QuadAlignment` scoring function:

```python
"""
backend/app/quant_engine/signals.py (Updated excerpt)
Upgraded Dr. Mo proper trade recommendations and empirical Quad Alignment.
"""

from typing import Dict, Any, Tuple
from backend.app.quant_engine.hedgeye_quad_matrix import HEDGEYE_EMPIRICAL_BACKTEST, HEDGEYE_PORTFOLIO_MODELS

def compute_dr_mo_proper_trade(vams_state: int, ticker: str, top_down_regime: str) -> Dict[str, Any]:
    """
    Implements 42 Macro's exact Discretionary Risk Management Overlay ("Dr. Mo") logic:
    - Target regime: 'Goldilocks' (Q1), 'Reflation' (Q2), 'Inflation' (Q3), 'Deflation' (Q4)
    - Returns: recommendation (str), position_size_pct (float), rationale (str)
    """
    # Map top down regime to Quad key
    regime_map = {
        "Goldilocks": "Q1", "Reflation": "Q2", "Inflation": "Q3", "Deflation": "Q4",
        "Quad 1": "Q1", "Quad 2": "Q2", "Quad 3": "Q3", "Quad 4": "Q4"
    }
    q_key = regime_map.get(top_down_regime, "Q2")
    
    # Check if ticker has empirical history
    stats = HEDGEYE_EMPIRICAL_BACKTEST.get(ticker, {}).get(q_key, {"ev": 0.0, "wr": 0.50})
    is_historically_bullish = stats["ev"] > 0.2 and stats["wr"] >= 0.60
    is_historically_bearish = stats["ev"] < -0.2 or stats["wr"] < 0.45

    recommendation = "No Position"
    size_pct = 0.0

    if is_historically_bullish:
        if vams_state == 1:
            recommendation = "LONG: Max Position"
            size_pct = 1.0
        elif vams_state == 0:
            recommendation = "LONG: Half Position"
            size_pct = 0.5
        else:
            recommendation = "No Position (Counter-Trend VAMS)"
            size_pct = 0.0
    elif is_historically_bearish:
        if vams_state == -1:
            recommendation = "SHORT: Max Position"
            size_pct = -1.0
        elif vams_state == 0:
            recommendation = "SHORT: Half Position"
            size_pct = -0.5
        else:
            recommendation = "No Position (Counter-Trend VAMS)"
            size_pct = 0.0
    else:
        # Neutral asset in this regime
        if vams_state == 1:
            recommendation = "LONG: Half Position (Tactical Momentum)"
            size_pct = 0.5
        elif vams_state == -1:
            recommendation = "SHORT: Half Position (Tactical Weakness)"
            size_pct = -0.5
        else:
            recommendation = "No Position"
            size_pct = 0.0

    return {
        "ticker": ticker,
        "regime": top_down_regime,
        "vams_state": vams_state,
        "recommendation": recommendation,
        "size_multiplier": size_pct,
        "empirical_expected_value": stats["ev"],
        "empirical_win_rate": stats["wr"]
    }

def compute_empirical_quad_alignment_score(ticker: str, current_quad: str) -> float:
    """
    Computes a 0 to 100 alignment score based on Hedgeye's 20-year empirical table:
    - 100: Top historical performer with high win rate (>70% positive ratio)
    - 50: Neutral or mixed historical performance
    - 0: Systematically negative expected return / poor win rate
    """
    q_map = {"Quad 1": "Q1", "Quad 2": "Q2", "Quad 3": "Q3", "Quad 4": "Q4"}
    qk = q_map.get(current_quad, "Q2")
    
    if ticker in HEDGEYE_EMPIRICAL_BACKTEST:
        metrics = HEDGEYE_EMPIRICAL_BACKTEST[ticker].get(qk, {"ev": 0.0, "wr": 0.50})
        # Score = scaled combination of win rate and expected return
        ev_score = min(50.0, max(0.0, (metrics["ev"] + 1.0) * 25.0))  # -1.0% to +1.0% -> 0 to 50
        wr_score = min(50.0, max(0.0, (metrics["wr"] - 0.3) * 100.0)) # 30% to 80% -> 0 to 50
        return round(ev_score + wr_score, 1)
        
    return 50.0  # Default neutral for non-indexed tickers
```

---

## 5. Module 3: ISM Leading Recession Probability Tiers (`macro_nowcast.py`)

In `backend/app/quant_engine/macro_nowcast.py`, integrate Darius Dale's exact ISM thresholds:

```python
"""
backend/app/quant_engine/macro_nowcast.py (Updated excerpt)
Adds 42 Macro ISM Manufacturing Recession Probability Tiers.
"""

def compute_ism_recession_probability(ism_reading: float) -> Dict[str, Any]:
    """
    Calculates historical recession probability based on ISM Manufacturing Index:
    - ISM < 50: 60% probability of recession
    - ISM < 47: 80% probability of recession
    - ISM < 46: 100% probability of recession
    """
    if ism_reading < 46.0:
        prob = 1.00
        tier = "EXTREME_RECESSION_CERTAINTY (100%)"
    elif ism_reading < 47.0:
        prob = 0.80
        tier = "HIGH_RECESSION_PROBABILITY (80%)"
    elif ism_reading < 50.0:
        prob = 0.60
        tier = "ELEVATED_RECESSION_RISK (60%)"
    else:
        prob = 0.15
        tier = "EXPANSIONARY_ZONE (Low Risk)"

    return {
        "ism_reading": ism_reading,
        "recession_probability": prob,
        "risk_tier": tier,
        "source": "42 Macro / ISM Historical Survey Data (since 1948)"
    }
```

---

## 6. Verification Steps for Antigravity

1. Run the test script in terminal:
   ```bash
   python -c "from backend.app.quant_engine.hedgeye_quad_matrix import HEDGEYE_PORTFOLIO_MODELS, HEDGEYE_EMPIRICAL_BACKTEST; print('Loaded assets:', len(HEDGEYE_EMPIRICAL_BACKTEST)); print('Quad 1 Long Equities:', HEDGEYE_PORTFOLIO_MODELS['Quad 1']['macro_split']['Equities'])"
   ```
   *Expected Output*: Loaded assets >= 25, Quad 1 Long Equities == 0.70.

2. Test Dr. Mo proper trade logic:
   ```bash
   python -c "from backend.app.quant_engine.signals import compute_dr_mo_proper_trade; print('XLK in Reflation with Bullish VAMS:', compute_dr_mo_proper_trade(1, 'XLK', 'Reflation')['recommendation'])"
   ```
   *Expected Output*: "LONG: Max Position".
