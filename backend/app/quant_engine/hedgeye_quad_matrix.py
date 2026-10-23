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
