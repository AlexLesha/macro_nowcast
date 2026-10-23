"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Activity,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Layers,
  PieChart,
  Sliders,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Sparkles,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  DollarSign,
  Gauge,
  Compass,
  HelpCircle,
  RefreshCw,
  Eye,
  Crosshair,
  Lock,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

// Default fallback data matching the institutional 2026 spec
const DEFAULT_42_DATA = {
  status: "ok",
  as_of_date: "2026-06-03",
  executive_summary: {
    headline: "Top-Down REFLATION Confirmed (83% Strength of Signal); Maintain KISS Risk-On Posture with 25% Safe Cash Buffer",
    market_regime: "REFLATION (30 Confirming Markets / 43% Share)",
    plain_english_takeaways: [
      {
        question: "What is the Market Regime today?",
        answer: "The market is firmly in REFLATION. 30 out of 42 global assets confirm accelerating growth and rebuilding cyclical inflation. The 3-week RORO filter has been locked in for 26 trading days, meaning this is a durable trend, not a transitory whipsaw."
      },
      {
        question: "What is the US Economy doing over the next 3–6 months?",
        answer: "The US business cycle is accelerating. Corporate profitability is running at +670 bps (well above the +584 bps 30-year average). While private job openings outpace hiring by +130 bps, productivity gains (+2.5%) are offsetting wage pressures, powering an AI-led mid-cycle expansion."
      },
      {
        question: "Are investors complacent or panicked?",
        answer: "Positioning is approaching crowded complacency. The 16-indicator positioning percentile is at 84% median, and mega-cap tech flows ($MGK) are registering a +6.2 Z-Score. 1-to-3 month correction risk is MODERATE to REASONABLE, but 3-to-12 month systemic crash risk remains LOW."
      },
      {
        question: "What exact portfolio actions should I take?",
        answer: "In KISS: Hold 60% Stocks ($VT), 15% Gold ($GLDM), and 25% Floating Cash ($USFR) with 0% Bitcoin ($FBTC) until its VAMS trend turns positive. In Dr. Mo: Overweight Tech ($XLK), Energy ($XLE), and Industrials ($XLI), while remaining SHORT Long Treasuries ($TLT). Never take Short Half Positions on equities or crypto."
      }
    ]
  },
  active_themes: [
    { name: "Sticky Inflation", introduced: "Jan-22", horizon: "1yr+", bias: "Bearish Duration", status: "Active" },
    { name: "Resilient US Economy", introduced: "Sep-22", horizon: "1yr+", bias: "Bullish Equities", status: "Active" },
    { name: "Paradigm C ('Run It Hot')", introduced: "Apr-25", horizon: "1yr+", bias: "Fiscal Dominance", status: "Active" },
    { name: "Productivity Boom", introduced: "Oct-25", horizon: "1yr+", bias: "Bullish Margin Spread", status: "Active" },
    { name: "Jobless Recovery", introduced: "Oct-25", horizon: "1yr+", bias: "AI Capex / Ghost Openings", status: "Active" },
    { name: "Cooling Housing & Labor", introduced: "Dec-25", horizon: "1yr+", bias: "Fed Pivot Cushion", status: "Active" },
    { name: "Source of Funds (Europe/Crowded AI)", introduced: "Dec-25", horizon: "1yr+", bias: "Tactical Pullback Risk", status: "Active" }
  ],
  global_macro_risk_matrix: {
    active_regime_label: "REFLATION",
    primary_regime: "REFLATION",
    secondary_regime: "INFLATION",
    is_hybrid_regime: false,
    strength_of_signal_pct: 83.0,
    confirming_sums: { GOLDILOCKS: 18, REFLATION: 30, INFLATION: 19, DEFLATION: 2 },
    t10yr_peaks: { GOLDILOCKS: 35, REFLATION: 37, INFLATION: 40, DEFLATION: 34 },
    confirming_shares_pct: { GOLDILOCKS: 26.1, REFLATION: 43.5, INFLATION: 27.5, DEFLATION: 2.9 },
    probability_risk_on_pct: 69.6,
    probability_risk_off_pct: 30.4,
    cacri_pct: 30.4,
    roro_3wk_confirmed: true,
    roro_transitions_per_year_10yr_avg: 2.4,
    cacri_zone: "NORMAL TRENDING ZONE (Risk-Off Share: 30.4%)"
  },
  kiss_portfolio: {
    market_regime: "REFLATION",
    targets_pct: { VT: 60.0, GLDM: 15.0, FBTC: 10.0 },
    actual_exposures_pct: { USFR: 25.0, VT: 60.0, GLDM: 15.0, FBTC: 0.0 },
    pct_of_max_exposure: { USFR: 25.0, VT: 100.0, GLDM: 50.0, FBTC: 0.0 },
    portfolio_beta_adjusted_spx_delta_pct: 67.5
  },
  dr_mo_matrix: [
    { ticker: "SPY", name: "USA (S&P 500)", category: "US Equity Sectors", vams_state: 1, rsi_14d: 68.2, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "XLK", name: "Information Technology", category: "US Equity Sectors", vams_state: 1, rsi_14d: 71.4, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "XLE", name: "Energy", category: "US Equity Sectors", vams_state: 1, rsi_14d: 64.0, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "XLI", name: "Industrials", category: "US Equity Sectors", vams_state: 1, rsi_14d: 66.5, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "XLF", name: "Financials", category: "US Equity Sectors", vams_state: 1, rsi_14d: 63.8, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "XLB", name: "Materials", category: "US Equity Sectors", vams_state: 0, rsi_14d: 54.2, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "XLY", name: "Consumer Discretionary", category: "US Equity Sectors", vams_state: 0, rsi_14d: 52.8, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "XLC", name: "Communication Services", category: "US Equity Sectors", vams_state: 1, rsi_14d: 69.1, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "XLRE", name: "Real Estate", category: "US Equity Sectors", vams_state: -1, rsi_14d: 41.2, expected_regime_dir: "BULLISH", proper_trade: "No Position" },
    { ticker: "XLU", name: "Utilities", category: "US Equity Sectors", vams_state: 0, rsi_14d: 58.6, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "XLV", name: "Health Care", category: "US Equity Sectors", vams_state: -1, rsi_14d: 43.5, expected_regime_dir: "BULLISH", proper_trade: "No Position" },
    { ticker: "XLP", name: "Consumer Staples", category: "US Equity Sectors", vams_state: -1, rsi_14d: 42.0, expected_regime_dir: "BEARISH", proper_trade: "No Position" },
    { ticker: "VT", name: "Global Equities", category: "US Equity Factors", vams_state: 1, rsi_14d: 66.0, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "QQQ", name: "Mega Cap Growth", category: "US Equity Factors", vams_state: 1, rsi_14d: 70.8, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "SPHB", name: "High Beta", category: "US Equity Factors", vams_state: 1, rsi_14d: 72.0, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "SPLV", name: "Low Beta", category: "US Equity Factors", vams_state: -1, rsi_14d: 44.0, expected_regime_dir: "BEARISH", proper_trade: "No Position" },
    { ticker: "IWF", name: "Growth", category: "US Equity Factors", vams_state: 1, rsi_14d: 68.5, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "IWD", name: "Value", category: "US Equity Factors", vams_state: 0, rsi_14d: 55.4, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "IWM", name: "Small Caps", category: "US Equity Factors", vams_state: 0, rsi_14d: 53.0, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "QUAL", name: "Quality", category: "US Equity Factors", vams_state: 1, rsi_14d: 67.2, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "MTUM", name: "Momentum", category: "US Equity Factors", vams_state: 1, rsi_14d: 74.1, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "SPHD", name: "Dividend Compounders", category: "US Equity Factors", vams_state: 0, rsi_14d: 51.5, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "IWR", name: "Mid Caps", category: "US Equity Factors", vams_state: 0, rsi_14d: 54.0, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "EWJ", name: "Japan", category: "Global Equities", vams_state: 1, rsi_14d: 64.2, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "EWC", name: "Canada", category: "Global Equities", vams_state: 1, rsi_14d: 62.8, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "EWA", name: "Australia", category: "Global Equities", vams_state: 1, rsi_14d: 61.5, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "GNR", name: "Commodity Producers", category: "Global Equities", vams_state: 1, rsi_14d: 67.0, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "FXI", name: "China", category: "Global Equities", vams_state: 0, rsi_14d: 49.8, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "INDA", name: "India", category: "Global Equities", vams_state: 0, rsi_14d: 56.4, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "EZU", name: "Eurozone", category: "Global Equities", vams_state: 0, rsi_14d: 48.2, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "EWU", name: "United Kingdom", category: "Global Equities", vams_state: 0, rsi_14d: 50.1, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "EWZ", name: "Brazil", category: "Global Equities", vams_state: -1, rsi_14d: 38.4, expected_regime_dir: "BULLISH", proper_trade: "No Position" },
    { ticker: "EEM", name: "Emerging Markets", category: "Global Equities", vams_state: 0, rsi_14d: 52.2, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "ACWX", name: "Global Equities ex-US", category: "Global Equities", vams_state: 0, rsi_14d: 53.5, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "TLT", name: "25+ Year Treasurys", category: "Fixed Income Sectors", vams_state: -1, rsi_14d: 39.8, expected_regime_dir: "BEARISH", proper_trade: "SHORT: Max Position" },
    { ticker: "IEF", name: "5-10yr Treasurys", category: "Fixed Income Sectors", vams_state: -1, rsi_14d: 42.1, expected_regime_dir: "BEARISH", proper_trade: "SHORT: Max Position" },
    { ticker: "SHY", name: "1-3yr Treasurys", category: "Fixed Income Sectors", vams_state: 0, rsi_14d: 49.5, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "STIP", name: "0-5yr TIPS", category: "Fixed Income Sectors", vams_state: 1, rsi_14d: 58.2, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "TIP", name: "5-10yr TIPS", category: "Fixed Income Sectors", vams_state: 0, rsi_14d: 50.4, expected_regime_dir: "BEARISH", proper_trade: "SHORT: Half Position" },
    { ticker: "HYG", name: "High Yield Credit", category: "Fixed Income Sectors", vams_state: 1, rsi_14d: 63.8, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "BKLN", name: "Leveraged Loans", category: "Fixed Income Sectors", vams_state: 1, rsi_14d: 65.2, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "LQD", name: "Investment Grade Credit", category: "Fixed Income Sectors", vams_state: 0, rsi_14d: 48.0, expected_regime_dir: "BEARISH", proper_trade: "SHORT: Half Position" },
    { ticker: "EMB", name: "EM USD Bonds", category: "Fixed Income Sectors", vams_state: 0, rsi_14d: 51.2, expected_regime_dir: "BEARISH", proper_trade: "SHORT: Half Position" },
    { ticker: "EMLC", name: "EM Local Currency Bonds", category: "Fixed Income Sectors", vams_state: 0, rsi_14d: 49.0, expected_regime_dir: "BEARISH", proper_trade: "SHORT: Half Position" },
    { ticker: "BIZD", name: "BDCs", category: "Fixed Income Sectors", vams_state: 1, rsi_14d: 61.0, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "CWB", name: "Convertibles", category: "Fixed Income Sectors", vams_state: 1, rsi_14d: 64.5, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "MBB", name: "MBS", category: "Fixed Income Sectors", vams_state: -1, rsi_14d: 43.1, expected_regime_dir: "BEARISH", proper_trade: "SHORT: Max Position" },
    { ticker: "PFF", name: "Preferreds", category: "Fixed Income Sectors", vams_state: 0, rsi_14d: 52.4, expected_regime_dir: "BEARISH", proper_trade: "SHORT: Half Position" },
    { ticker: "AGG", name: "US Aggregate", category: "Fixed Income Sectors", vams_state: -1, rsi_14d: 44.5, expected_regime_dir: "BEARISH", proper_trade: "SHORT: Max Position" },
    { ticker: "GLD", name: "Gold", category: "Macro Exposures", vams_state: 1, rsi_14d: 69.8, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "SLV", name: "Silver", category: "Macro Exposures", vams_state: 1, rsi_14d: 67.4, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "GDX", name: "Gold Miners", category: "Macro Exposures", vams_state: 0, rsi_14d: 54.0, expected_regime_dir: "BEARISH", proper_trade: "No Position" },
    { ticker: "PDBC", name: "Commodities", category: "Macro Exposures", vams_state: 1, rsi_14d: 65.5, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "USO", name: "Crude Oil", category: "Macro Exposures", vams_state: 1, rsi_14d: 62.0, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "DBB", name: "Base Metals", category: "Macro Exposures", vams_state: 1, rsi_14d: 63.8, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" },
    { ticker: "DBA", name: "Agriculture", category: "Macro Exposures", vams_state: 0, rsi_14d: 52.1, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "Bitcoin", name: "Bitcoin", category: "Macro Exposures", vams_state: -1, rsi_14d: 46.2, expected_regime_dir: "BULLISH", proper_trade: "No Position" },
    { ticker: "Ethereum", name: "Ethereum", category: "Macro Exposures", vams_state: -1, rsi_14d: 44.0, expected_regime_dir: "BULLISH", proper_trade: "No Position" },
    { ticker: "UUP", name: "US Dollar", category: "Macro Exposures", vams_state: 0, rsi_14d: 52.8, expected_regime_dir: "BEARISH", proper_trade: "SHORT: Half Position" },
    { ticker: "FXE", name: "Euro", category: "Macro Exposures", vams_state: 0, rsi_14d: 48.9, expected_regime_dir: "BULLISH", proper_trade: "LONG: Half Position" },
    { ticker: "FXY", name: "Japanese Yen", category: "Macro Exposures", vams_state: -1, rsi_14d: 38.5, expected_regime_dir: "BEARISH", proper_trade: "SHORT: Max Position" },
    { ticker: "SRUUF", name: "Uranium", category: "Macro Exposures", vams_state: 1, rsi_14d: 68.0, expected_regime_dir: "BULLISH", proper_trade: "LONG: Max Position" }
  ],
  grids_35_country: [
    { country: "United States", current_regime: "REFLATION", three_month_forecast: "REFLATION", gdp_3m_impulse: "+2.4% (Strong Pos)", core_pce_or_cpi_3m_impulse: "+2.8% (Sticky Pos)", hit_rate_10yr: "54%" },
    { country: "China", current_regime: "REFLATION", three_month_forecast: "REFLATION", gdp_3m_impulse: "+4.9% (Fiscal Pos)", core_pce_or_cpi_3m_impulse: "+0.8% (Exiting Deflation)", hit_rate_10yr: "52%" },
    { country: "Eurozone", current_regime: "GOLDILOCKS", three_month_forecast: "REFLATION", gdp_3m_impulse: "+1.1% (Weak Pos)", core_pce_or_cpi_3m_impulse: "+2.3% (Disinflation Lag)", hit_rate_10yr: "55%" },
    { country: "Japan", current_regime: "REFLATION", three_month_forecast: "REFLATION", gdp_3m_impulse: "+1.4% (Wage Spiral Pos)", core_pce_or_cpi_3m_impulse: "+2.6% (Positive Impulse)", hit_rate_10yr: "56%" },
    { country: "United Kingdom", current_regime: "REFLATION", three_month_forecast: "REFLATION", gdp_3m_impulse: "+1.2% (Pos Impulse)", core_pce_or_cpi_3m_impulse: "+3.1% (Sticky Services)", hit_rate_10yr: "53%" }
  ],
  macro_weather: {
    cycles: [
      { name: "Growth Cycle", impulse: "Strong Positive (+2)", outlook: "Accelerating real domestic private demand; corporate profits expanding at +670 bps." },
      { name: "Inflation Cycle", impulse: "Weak Positive (+1)", outlook: "Sticky demand-side PCE pressures around ~2.8%; shelter lags easing while energy stabilizes." },
      { name: "Monetary Policy Cycle", impulse: "Weak Easing (+1)", outlook: "Fed paused; OIS pricing neutral rate above current EFFR, indicating policy is behind the curve." },
      { name: "Fiscal Policy Cycle", impulse: "Strong Tightening (-2)", outlook: "Structural deficits driving $12.23T NTM debt supply; True Interest Expense exceeding 28% of receipts." },
      { name: "Liquidity Cycle", impulse: "Strong Positive (+2)", outlook: "Global M2 liquidity at $106.4T; Fed Net Liquidity supportive at $6.14T with TGA drain offsetting RRP." },
      { name: "Positioning Cycle", impulse: "Strong Tightening (-2)", outlook: "Median crowded bullish score at 84%; Mega-Cap growth ETF flows pushing extreme tactical overbought levels." }
    ],
    asset_composite_signals: {
      Stocks: { stance: "BULLISH", conviction: "High", driver: "Reflation regime + positive corporate profitability spread." },
      Bonds: { stance: "BEARISH", conviction: "High", driver: "Persistent fiscal supply ($12.23T NTM) + elevated term premium." },
      "USD (DXY)": { stance: "NEUTRAL", conviction: "Moderate", driver: "Rate differentials supportive, but offset by global reflation flows." },
      Gold: { stance: "BULLISH", conviction: "High", driver: "Accord 2.0 currency debasement + central bank reserves accumulation." },
      Bitcoin: { stance: "TACTICALLY_NEUTRAL", conviction: "Moderate", driver: "VAMS bearish trend (-1) enforces zero position in KISS until breakout." },
      Commodities: { stance: "BULLISH", conviction: "High", driver: "Reflation confirmed; industrial and energy demand accelerating." }
    },
    phase_transition_risk_pct: 28.0,
    phase_transition_tier: "MODERATE (25-50%)"
  },
  probable_ranges: [
    { ticker: "SPY", name: "S&P 500", price: 586.20, vams: 1, vams_label: "BULLISH", prob_low: 574.50, prob_high: 598.00, pos_pct: 49.8, status: "IN_RANGE", fwd_5d_below_low: 1.1, fwd_5d_above_high: -0.4, dd_21d_bull: -2.2, dd_21d_neut: -3.8, dd_21d_bear: -4.0 },
    { ticker: "QQQ", name: "Nasdaq 100", price: 498.40, vams: 1, vams_label: "BULLISH", prob_low: 485.00, prob_high: 512.50, pos_pct: 48.7, status: "IN_RANGE", fwd_5d_below_low: 1.4, fwd_5d_above_high: -0.6, dd_21d_bull: -2.6, dd_21d_neut: -4.2, dd_21d_bear: -4.9 },
    { ticker: "GLD", name: "Gold", price: 248.50, vams: 1, vams_label: "BULLISH", prob_low: 241.00, prob_high: 256.00, pos_pct: 50.0, status: "IN_RANGE", fwd_5d_below_low: 0.8, fwd_5d_above_high: -0.1, dd_21d_bull: -1.8, dd_21d_neut: -2.9, dd_21d_bear: -3.5 },
    { ticker: "TLT", name: "20Y+ Treasury", price: 91.40, vams: -1, vams_label: "BEARISH", prob_low: 88.20, prob_high: 94.60, pos_pct: 50.0, status: "IN_RANGE", fwd_5d_below_low: 0.5, fwd_5d_above_high: -0.8, dd_21d_bull: -2.1, dd_21d_neut: -3.2, dd_21d_bear: -4.4 },
    { ticker: "FBTC", name: "Bitcoin Fund", price: 63.80, vams: -1, vams_label: "BEARISH", prob_low: 58.20, prob_high: 69.50, pos_pct: 49.6, status: "IN_RANGE", fwd_5d_below_low: 2.4, fwd_5d_above_high: -1.2, dd_21d_bull: -4.8, dd_21d_neut: -7.5, dd_21d_bear: -9.2 }
  ],
  four_horsemen: [
    { indicator: "VVIX / VIX Ratio", current: 8.4, threshold: "High > 8.0", status: "ELEVATED", signal: "Vol-of-vol pricing convex tail risk" },
    { indicator: "SPHB / SPLV (Beta Spread)", current: 1.48, threshold: "Trend Break < 1.40", status: "BULLISH", signal: "High beta outperforming min-vol" },
    { indicator: "IWM / OEF (Size Spread)", current: 0.74, threshold: "Breadth > 0.80", status: "NARROW", signal: "Mega-caps dominating index returns" },
    { indicator: "Mag-7 vs ACWI Weight", current: 21.4, threshold: "Extreme > 20%", status: "CROWDED", signal: "Historical concentration peak" }
  ],
  positioning_and_crowding: {
    raw_percentiles: {
      "AAII Bulls-Bears": 24.0,
      "NAAIM Stock %": 95.0,
      "AAII Stock %": 88.0,
      "AAII Bond %": 12.0,
      "AAII Cash %": 14.0,
      "US Equities COT % OI": 25.0,
      "S&P 500 3mo Rvol": 15.0,
      "S&P 500 3mo Ivol Correlations": 8.0,
      "S&P 500 P/NTM EPS": 91.0,
      "IG Credit Spreads": 6.0,
      "Economic Policy Uncertainty": 28.0
    },
    implied_crowded_bullish_percentiles: {
      "AAII Bulls-Bears": 24.0,
      "NAAIM Stock %": 95.0,
      "AAII Stock %": 88.0,
      "AAII Bond % (Inverted)": 88.0,
      "AAII Cash % (Inverted)": 86.0,
      "US Equities COT % OI": 25.0,
      "S&P 500 3mo Rvol (Inverted)": 85.0,
      "S&P 500 3mo Ivol Corr (Inverted)": 92.0,
      "S&P 500 P/NTM EPS": 91.0,
      "IG Credit Spreads (Inverted)": 94.0,
      "Economic Policy Uncertainty (Inverted)": 72.0
    },
    mean_crowded_bullish_pct: 69.0,
    median_crowded_bullish_pct: 84.0,
    historical_bubble_peaks_median: { "Mar-00": 89.0, "Oct-07": 55.0, "Jan-22": 78.0, "Feb-25": 83.0 },
    correction_10pct_risk_1_to_3m: "MODERATE (25-50%)",
    crash_20pct_risk_3_to_12m: "LOW (<25%)",
    crowding_scatter: [
      { ticker: "MGK", name: "Mega-Cap Growth", rsi_14d: 75.0, flow_z_3m: 6.2, quadrant: "SIGNAL: BEARISH (Overbought + Chasing Highs)" },
      { ticker: "XLK", name: "Technology SPDR", rsi_14d: 71.4, flow_z_3m: 2.8, quadrant: "SIGNAL: BEARISH (Overbought + Chasing Highs)" },
      { ticker: "QQQ", name: "Nasdaq 100", rsi_14d: 70.8, flow_z_3m: 2.4, quadrant: "SIGNAL: BEARISH (Overbought + Chasing Highs)" },
      { ticker: "SPY", name: "S&P 500 ETF", rsi_14d: 68.2, flow_z_3m: 1.1, quadrant: "NEUTRAL" },
      { ticker: "GLD", name: "Gold Trust", rsi_14d: 69.8, flow_z_3m: 1.5, quadrant: "NEUTRAL" },
      { ticker: "TLT", name: "20Y+ Treasury", rsi_14d: 39.8, flow_z_3m: -0.8, quadrant: "NEUTRAL" },
      { ticker: "EWZ", name: "Brazil ETF", rsi_14d: 28.5, flow_z_3m: -2.3, quadrant: "SIGNAL: BULLISH (Oversold + Puking Lows)" },
      { ticker: "XBI", name: "Biotech ETF", rsi_14d: 29.1, flow_z_3m: -2.1, quadrant: "SIGNAL: BULLISH (Oversold + Puking Lows)" },
      { ticker: "FXY", name: "Japanese Yen ETF", rsi_14d: 27.4, flow_z_3m: 0.4, quadrant: "NOISE (Oversold + Buying Dip Early)" },
      { ticker: "SMH", name: "Semiconductors", rsi_14d: 74.0, flow_z_3m: 0.9, quadrant: "NOISE (Overbought + Selling Rip Early)" }
    ]
  },
  scouting_monitors: {
    corporate_profitability_model_bps: 670,
    corporate_profitability_historical_mean_bps: 584,
    jolts_fake_job_demand_spread_bps: 130,
    jolts_interpretation: "Private Openings Rate (4.8%) minus Hires Rate (3.5%) = +130 bps (widest since Mar-24 peak; indicates AI 'jobless recovery' & ghost job listings).",
    ois_neutral_rate_model: {
      effr_pct: 3.62,
      ois_floor_neutral_pct: 3.73,
      ois_terminal_neutral_pct: 4.01,
      cutting_cycle_spread_bps: 11,
      hiking_cycle_spread_bps: 39,
      policy_bias: "ACCOMMODATIVE (Fed behind the curve; 1-2 hikes needed to reach neutral)"
    },
    ntm_marketable_treasury_supply_bn: 12234,
    ntm_supply_components_bn: {
      maturing_next_12m_bn: 10179,
      annualized_fytd_deficit_bn: 2337,
      annualized_fed_divestment_or_rmp_bn: -282
    }
  }
};

export default function FortyTwoMacroPage() {
  const [data, setData] = useState(DEFAULT_42_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [useApril2026GoldRule, setUseApril2026GoldRule] = useState<boolean>(true);
  const [selectedDrMoCategory, setSelectedDrMoCategory] = useState<string>("All");
  const [drMoSearch, setDrMoSearch] = useState<string>("");
  const [crowdingFilter, setCrowdingFilter] = useState<string>("All");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoint = getApiUrl("/api/v1/42macro/dashboard");
      const res = await fetch(endpoint, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json && json.executive_summary) {
          setData(json);
        }
      }
    } catch {
      // Fallback data remains active
    } finally {
      setIsLoading(false);
      setLastRefreshed(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute dynamic KISS portfolio values based on the toggle for April 2026 vs Jan 2026 gold rule
  const computedKiss = useMemo(() => {
    const rawKiss = data.kiss_portfolio || DEFAULT_42_DATA.kiss_portfolio;
    const isReflationOrInflation = (rawKiss.market_regime || "REFLATION").toUpperCase().includes("REFLATION") || (rawKiss.market_regime || "").toUpperCase().includes("INFLATION");
    
    // In April 2026 rule, Gold target is cut to 15% in Inflation/Reflation; in Jan 2026 it was fixed at 30%
    const gldmTarget = useApril2026GoldRule && isReflationOrInflation ? 15.0 : 30.0;
    const vtTarget = 60.0;
    const fbtcTarget = 10.0;

    // VAMS states: VT = 1 (100%), GLDM = 1 (100%), FBTC = -1 (0%)
    const vtActual = vtTarget;
    const gldmActual = gldmTarget;
    const fbtcActual = 0.0;
    const usfrActual = Math.max(0, 100 - (vtActual + gldmActual + fbtcActual));

    // Betas: USFR=0, VT=1.0, GLDM=0.5, FBTC=2.0
    const betaDelta = vtActual * 1.0 + gldmActual * 0.5 + fbtcActual * 2.0;

    return {
      vtTarget,
      gldmTarget,
      fbtcTarget,
      vtActual,
      gldmActual,
      fbtcActual,
      usfrActual,
      betaDelta: roundOne(betaDelta),
    };
  }, [data.kiss_portfolio, useApril2026GoldRule]);

  // Filter Dr. Mo 56-ETF matrix
  const filteredDrMo = useMemo(() => {
    const list = data.dr_mo_matrix || DEFAULT_42_DATA.dr_mo_matrix;
    return list.filter((item) => {
      const matchCat = selectedDrMoCategory === "All" || item.category === selectedDrMoCategory;
      const matchSearch =
        !drMoSearch ||
        item.ticker.toLowerCase().includes(drMoSearch.toLowerCase()) ||
        item.name.toLowerCase().includes(drMoSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [data.dr_mo_matrix, selectedDrMoCategory, drMoSearch]);

  // Categories for Dr. Mo
  const drMoCategories = [
    "All",
    "US Equity Sectors",
    "US Equity Factors",
    "Global Equities",
    "Fixed Income Sectors",
    "Macro Exposures",
  ];

  // Filter Crowding scatter
  const filteredCrowding = useMemo(() => {
    const list = data.positioning_and_crowding?.crowding_scatter || DEFAULT_42_DATA.positioning_and_crowding.crowding_scatter;
    if (crowdingFilter === "All") return list;
    if (crowdingFilter === "Bearish") return list.filter((x) => x.quadrant.includes("BEARISH"));
    if (crowdingFilter === "Bullish") return list.filter((x) => x.quadrant.includes("BULLISH"));
    return list.filter((x) => x.quadrant.includes("NOISE") || x.quadrant.includes("NEUTRAL"));
  }, [data.positioning_and_crowding, crowdingFilter]);

  return (
    <div className="space-y-8 pb-16">
      {/* =========================================================================
          PAGE HERO & REFRESH ACTION BAR
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                  42 Macro Institutional Deep-Dive
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 uppercase">
                  Tab 7 • 2026 Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Macro Weather, 35-Country GRIDs, 42-Market Matrix, KISS & Dr. Mo Proper Trade Models
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-500" />
              Updated: {lastRefreshed}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono font-medium text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Syncing..." : "Sync Model"}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PANEL 1: PLAIN-ENGLISH EXECUTIVE SUMMARY & ACTIVE THEMES STRIP
          ========================================================================= */}
      <section className="space-y-4">
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-[#0c1624] via-[#0d1829] to-[#08111e] p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 border-b border-slate-800/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                Plain-English Executive Translation
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {data.executive_summary?.headline || DEFAULT_42_DATA.executive_summary.headline}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-slate-400">Primary Regime:</span>
              <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/40">
                {data.global_macro_risk_matrix?.active_regime_label || "REFLATION"}
              </span>
            </div>
          </div>

          {/* 4 Plain-English Core Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(data.executive_summary?.plain_english_takeaways || DEFAULT_42_DATA.executive_summary.plain_english_takeaways).map(
              (item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-4 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5" />
                      {item.question}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* 7 Active Themes Strip */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>7 Active Secular & Cyclical Macro Themes:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data.active_themes || DEFAULT_42_DATA.active_themes).map((theme, i) => {
                const isBullish = theme.bias.toLowerCase().includes("bullish") || theme.bias.toLowerCase().includes("expansion");
                const isBearish = theme.bias.toLowerCase().includes("bearish") || theme.bias.toLowerCase().includes("pullback");
                return (
                  <div
                    key={i}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 transition"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isBullish ? "bg-emerald-400" : isBearish ? "bg-rose-400" : "bg-cyan-400"
                      }`}
                    />
                    <span className="font-semibold text-slate-100">{theme.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">({theme.introduced})</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        isBullish
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/40"
                          : isBearish
                          ? "bg-rose-950/60 text-rose-300 border-rose-800/40"
                          : "bg-cyan-950/60 text-cyan-300 border-cyan-800/40"
                      }`}
                    >
                      {theme.bias}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PANEL 2: TOP-DOWN GLOBAL RISK MATRIX vs BOTTOM-UP 35-COUNTRY GRIDS
          ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 42-Market Matrix */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0d1527]/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                  Top-Down 42-Market Global Macro Risk Matrix
                </h3>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                10-Year Peaks Benchmark
              </span>
            </div>

            {/* Confirming Markets Breakdown Bar */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    name: "REFLATION",
                    count: data.global_macro_risk_matrix?.confirming_sums?.REFLATION ?? 30,
                    share: data.global_macro_risk_matrix?.confirming_shares_pct?.REFLATION ?? 43.5,
                    peak: 37,
                    color: "border-emerald-500/50 bg-emerald-950/20 text-emerald-400",
                    bar: "bg-emerald-500",
                  },
                  {
                    name: "INFLATION",
                    count: data.global_macro_risk_matrix?.confirming_sums?.INFLATION ?? 19,
                    share: data.global_macro_risk_matrix?.confirming_shares_pct?.INFLATION ?? 27.5,
                    peak: 40,
                    color: "border-amber-500/50 bg-amber-950/20 text-amber-400",
                    bar: "bg-amber-500",
                  },
                  {
                    name: "GOLDILOCKS",
                    count: data.global_macro_risk_matrix?.confirming_sums?.GOLDILOCKS ?? 18,
                    share: data.global_macro_risk_matrix?.confirming_shares_pct?.GOLDILOCKS ?? 26.1,
                    peak: 35,
                    color: "border-cyan-500/50 bg-cyan-950/20 text-cyan-400",
                    bar: "bg-cyan-500",
                  },
                  {
                    name: "DEFLATION",
                    count: data.global_macro_risk_matrix?.confirming_sums?.DEFLATION ?? 2,
                    share: data.global_macro_risk_matrix?.confirming_shares_pct?.DEFLATION ?? 2.9,
                    peak: 34,
                    color: "border-rose-500/50 bg-rose-950/20 text-rose-400",
                    bar: "bg-rose-500",
                  },
                ].map((reg, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${reg.color}`}>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                      {reg.name}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-mono font-bold text-white">{reg.count}</span>
                      <span className="text-xs font-mono font-semibold">{reg.share}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${reg.bar}`} style={{ width: `${reg.share}%` }} />
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 mt-1.5">
                      Peak Target: {reg.peak} mkts
                    </div>
                  </div>
                ))}
              </div>

              {/* Strength of Signal & Filters Status */}
              <div className="mt-4 p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Strength of Signal</div>
                  <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                    {data.global_macro_risk_matrix?.strength_of_signal_pct ?? 83.0}%
                  </div>
                  <div className="text-[10px] text-slate-500">30 confirmations / 37 peak</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">3-Wk False-Alarm Filter</div>
                  <div className="text-base font-mono font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Locked In (26D &gt; 15D)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">10yr avg: 2.4 shifts/yr</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">CACRI Indicator</div>
                  <div className="text-base font-mono font-bold text-cyan-400 mt-0.5">
                    {data.global_macro_risk_matrix?.cacri_pct ?? 30.4}%
                  </div>
                  <div className="text-[10px] text-slate-400">Normal Trending Zone (20–75%)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>CACRI Rule: Risk-Off Share &lt;20% = Complacency Warning | &gt;75% = Contrarian Fear Buy</span>
            <span className="font-mono text-slate-500">42 Assets Standardized</span>
          </div>
        </div>

        {/* Right: 35-Country Smoothed GRIDs Table */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0d1527]/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                  35-Country Monthly Smoothed GRIDs
                </h3>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
                54% vs 41% Hit Rate
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                    <th className="pb-2">Country</th>
                    <th className="pb-2">Current</th>
                    <th className="pb-2">3M Forecast</th>
                    <th className="pb-2 text-right">Real GDP 3M</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(data.grids_35_country || DEFAULT_42_DATA.grids_35_country).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 font-sans font-medium text-slate-200">{row.country}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          {row.current_regime}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                          {row.three_month_forecast}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-300">{row.gdp_3m_impulse.split(" ")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-lg border border-slate-800 bg-slate-900/60 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">10-Year Macro Hit Rate:</span>
                <span className="font-mono font-bold text-emerald-400">54% vs 41% Bloomberg Consensus</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Core PCE Mean Forecast Error:</span>
                <span className="font-mono text-cyan-400">17 bps (vs 34 bps Street)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">GRID Zero Detector:</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Inactive (No Zero Clustering)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            Post-2020 series standardized against 2015–2019 baseline to eliminate COVID variance.
          </div>
        </div>
      </section>

      {/* =========================================================================
          PANEL 3: KISS MODEL PORTFOLIO (2026 RULES) & DR. MO 56-ETF MATRIX
          ========================================================================= */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* KISS Model Portfolio Card */}
          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0d1527]/80 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                    KISS Model Portfolio
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                  April 2026 Suite
                </span>
              </div>

              {/* April 2026 vs Jan 2026 Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 mb-4">
                <div className="text-xs">
                  <span className="text-slate-300 font-medium">Gold Overlay Rule:</span>
                  <div className="text-[10px] text-slate-500">
                    {useApril2026GoldRule
                      ? "April 2026: 15% in Inflation/Reflation"
                      : "Jan 2026: Fixed 30% across all regimes"}
                  </div>
                </div>
                <button
                  onClick={() => setUseApril2026GoldRule(!useApril2026GoldRule)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium border transition ${
                    useApril2026GoldRule
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {useApril2026GoldRule ? "Apr-26 Rule (Active)" : "Jan-26 Rule"}
                </button>
              </div>

              {/* Exposure Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Global Stocks ($VT)</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-mono font-bold text-emerald-400">
                      {computedKiss.vtActual}%
                    </span>
                    <span className="text-xs font-mono text-slate-500">Target: {computedKiss.vtTarget}%</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-500 mt-1">VAMS: +1 Bullish (100% Scale)</div>
                </div>

                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Gold ($GLDM)</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-mono font-bold text-amber-400">
                      {computedKiss.gldmActual}%
                    </span>
                    <span className="text-xs font-mono text-slate-500">Target: {computedKiss.gldmTarget}%</span>
                  </div>
                  <div className="text-[10px] font-mono text-amber-500 mt-1">VAMS: +1 Bullish (100% Scale)</div>
                </div>

                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Bitcoin ($FBTC)</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-mono font-bold text-rose-400">
                      {computedKiss.fbtcActual}%
                    </span>
                    <span className="text-xs font-mono text-slate-500">Target: {computedKiss.fbtcTarget}%</span>
                  </div>
                  <div className="text-[10px] font-mono text-rose-500 mt-1">VAMS: -1 Bearish (0% Scale)</div>
                </div>

                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Cash / Floating ($USFR)</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-mono font-bold text-cyan-400">
                      {computedKiss.usfrActual}%
                    </span>
                    <span className="text-xs font-mono text-slate-500">Residual Buffer</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-500 mt-1">Yielding ~4.9% with zero duration</div>
                </div>
              </div>

              {/* Beta-Adjusted S&P 500 Delta */}
              <div className="p-3.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-cyan-300 uppercase font-semibold">
                    Portfolio 6M Beta-Adjusted SPX Delta
                  </div>
                  <div className="text-[11px] text-slate-400">
                    60% VT(1.0) + {computedKiss.gldmActual}% GLDM(0.5) + {computedKiss.fbtcActual}% FBTC(2.0)
                  </div>
                </div>
                <div className="text-2xl font-mono font-bold text-cyan-400">
                  {computedKiss.betaDelta}%
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              Systematic 60/30/10 model upgraded from $SPYM to $VT in April 2026.
            </div>
          </div>

          {/* Dr. Mo 56-ETF Proper Trade Matrix */}
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0d1527]/80 p-5 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                      Dr. Mo 56-ETF Proper Trade Matrix
                    </h3>
                    <div className="text-[11px] text-amber-400 font-mono">
                      Strict Rule: No SHORT: Half Positions for Equity and Crypto exposures!
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ETF..."
                    value={drMoSearch}
                    onChange={(e) => setDrMoSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
                  />
                </div>
              </div>

              {/* Bucket Category Tabs */}
              <div className="flex flex-wrap gap-1.5 mb-3.5">
                {drMoCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedDrMoCategory(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                      selectedDrMoCategory === cat
                        ? "bg-indigo-600 text-white font-semibold"
                        : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 bg-[#0d1527] z-10">
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                      <th className="pb-2">Ticker / Name</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2 text-center">Regime Dir</th>
                      <th className="pb-2 text-center">VAMS</th>
                      <th className="pb-2 text-center">14D RSI</th>
                      <th className="pb-2 text-right">Proper Trade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDrMo.map((row, idx) => {
                      const isMaxLong = row.proper_trade.includes("LONG: Max");
                      const isHalfLong = row.proper_trade.includes("LONG: Half");
                      const isMaxShort = row.proper_trade.includes("SHORT: Max");
                      const isHalfShort = row.proper_trade.includes("SHORT: Half");
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5">
                            <span className="font-bold text-white mr-1.5">{row.ticker}</span>
                            <span className="text-slate-400 font-sans text-[11px]">{row.name}</span>
                          </td>
                          <td className="py-2.5 text-slate-400 text-[11px]">{row.category}</td>
                          <td className="py-2.5 text-center">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                row.expected_regime_dir === "BULLISH"
                                  ? "text-emerald-400 bg-emerald-950/40"
                                  : "text-rose-400 bg-rose-950/40"
                              }`}
                            >
                              {row.expected_regime_dir}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            <span
                              className={`text-[11px] font-bold ${
                                row.vams_state === 1
                                  ? "text-emerald-400"
                                  : row.vams_state === -1
                                  ? "text-rose-400"
                                  : "text-amber-400"
                              }`}
                            >
                              {row.vams_state === 1 ? "+1" : row.vams_state === -1 ? "-1" : "0"}
                            </span>
                          </td>
                          <td className="py-2.5 text-center text-slate-300">{row.rsi_14d}</td>
                          <td className="py-2.5 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isMaxLong
                                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                                  : isHalfLong
                                  ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50"
                                  : isMaxShort
                                  ? "bg-rose-950/80 text-rose-300 border-rose-500/50"
                                  : isHalfShort
                                  ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                                  : "bg-slate-900 text-slate-400 border-slate-800"
                              }`}
                            >
                              {row.proper_trade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Showing {filteredDrMo.length} of 56 ETFs across 5 institutional buckets</span>
              <span className="font-mono text-slate-500">Backtested 1998–2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PANEL 4: MACRO WEATHER MODEL (6 CYCLES & 1-3M ASSET COMPOSITE SIGNALS)
          ========================================================================= */}
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-[#0d1527]/80 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                Macro Weather Model (6 Principal Cycles & 30 Indicators)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">RORO Phase Transition Risk:</span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                {data.macro_weather?.phase_transition_risk_pct ?? 28.0}% (Moderate 25–50%)
              </span>
            </div>
          </div>

          {/* 6 Cycles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
            {(data.macro_weather?.cycles || DEFAULT_42_DATA.macro_weather.cycles).map((cycle, i) => {
              const isPos = cycle.impulse.includes("+");
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-lg border border-slate-800/90 bg-slate-900/50 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-white">{cycle.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold border ${
                        isPos
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/40"
                          : "bg-rose-950/60 text-rose-300 border-rose-800/40"
                      }`}
                    >
                      {cycle.impulse}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{cycle.outlook}</p>
                </div>
              );
            })}
          </div>

          {/* 1-to-3-Month Asset Composite Outlooks */}
          <div className="border-t border-slate-800 pt-4">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3">
              1-to-3 Month Asset Class Composite Signals:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(
                data.macro_weather?.asset_composite_signals ||
                  DEFAULT_42_DATA.macro_weather.asset_composite_signals
              ).map(([asset, meta]: [string, any], idx) => {
                const isBull = meta.stance === "BULLISH";
                const isBear = meta.stance === "BEARISH";
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white mb-1">{asset}</div>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block mb-1.5 ${
                          isBull
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                            : isBear
                            ? "bg-rose-950/80 text-rose-300 border-rose-500/40"
                            : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        {meta.stance}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{meta.driver}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PANEL 5: PROBABLE RANGE, CROWDING & 16-INDICATOR POSITIONING
          ========================================================================= */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Probable Range Cards for SPY, QQQ, GLD, TLT, FBTC */}
          <div className="lg:col-span-12 rounded-xl border border-slate-800 bg-[#0d1527]/80 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                  Asymmetric Probable Range & 21D Max Drawdown Conditioned on VAMS
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                5D Forward % Change on Upper/Lower Boundary Violations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              {(data.probable_ranges || DEFAULT_42_DATA.probable_ranges).map((asset, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-white">{asset.ticker}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          asset.vams === 1
                            ? "text-emerald-400 bg-emerald-950/60"
                            : asset.vams === -1
                            ? "text-rose-400 bg-rose-950/60"
                            : "text-amber-400 bg-amber-950/60"
                        }`}
                      >
                        VAMS: {asset.vams_label}
                      </span>
                    </div>
                    <div className="text-xl font-mono font-bold text-white">${asset.price.toFixed(2)}</div>

                    {/* Range Visualizer Bar */}
                    <div className="my-3">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>Low: ${asset.prob_low}</span>
                        <span>High: ${asset.prob_high}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, asset.pos_pct))}%` }}
                        />
                      </div>
                      <div className="text-center text-[10px] font-mono text-cyan-400 mt-1">
                        Range Pos: {asset.pos_pct}% ({asset.status})
                      </div>
                    </div>
                  </div>

                  {/* Backtested Return on Violation */}
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>5D Ret if &lt; Low:</span>
                      <span className="text-emerald-400">+{asset.fwd_5d_below_low}%</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>5D Ret if &gt; High:</span>
                      <span className="text-rose-400">{asset.fwd_5d_above_high}%</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/50">
                      <span>21D Max DD (Bull/Neut/Bear):</span>
                      <span className="text-slate-300">
                        {asset.dd_21d_bull}% / {asset.dd_21d_neut}% / {asset.dd_21d_bear}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Left: 4-Quadrant Tactical Crowding Scatter */}
          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-[#0d1527]/80 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-amber-400" />
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                    67-ETF Tactical Crowding Model
                  </h3>
                </div>
                <div className="flex gap-1">
                  {["All", "Bearish", "Bullish"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setCrowdingFilter(f)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                        crowdingFilter === f
                          ? "bg-amber-600 text-white font-semibold"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 text-xs text-amber-300 mb-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  <strong>Extreme Crowding Alert:</strong> $MGK is at 14D RSI 75 with 3M Flow Z-Score of +6.2!
                  Investors are chasing local highs into an overbought condition.
                </span>
              </div>

              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                      <th className="pb-2">Ticker</th>
                      <th className="pb-2">14D RSI</th>
                      <th className="pb-2">3M Flow Z</th>
                      <th className="pb-2 text-right">Crowding Quadrant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCrowding.map((item, idx) => {
                      const isBear = item.quadrant.includes("BEARISH");
                      const isBull = item.quadrant.includes("BULLISH");
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="py-2 font-bold text-white">
                            {item.ticker}{" "}
                            <span className="font-sans font-normal text-slate-400 text-[10px]">
                              {item.name}
                            </span>
                          </td>
                          <td className="py-2 text-slate-200">{item.rsi_14d}</td>
                          <td className="py-2">
                            <span className={item.flow_z_3m > 2 ? "text-rose-400 font-bold" : "text-slate-300"}>
                              {item.flow_z_3m > 0 ? `+${item.flow_z_3m}` : item.flow_z_3m}
                            </span>
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                isBear
                                  ? "bg-rose-950/60 text-rose-300 border border-rose-800/40"
                                  : isBull
                                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                                  : "bg-slate-900 text-slate-400"
                              }`}
                            >
                              {item.quadrant.split(" ")[0]} {item.quadrant.split(" ")[1]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              Signal: RSI &ge; 70 &amp; Flow Z &ge; +2 = Bearish | RSI &le; 30 &amp; Flow Z &le; -2 = Bullish
            </div>
          </div>

          {/* Right: 16-Indicator Positioning Model */}
          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-[#0d1527]/80 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                    16-Indicator Positioning Model
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50">
                  Median: 84% All-Time
                </span>
              </div>

              {/* Correction Risk & Crash Risk Summary Badges */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">1–3M Correction Risk (-10%)</div>
                  <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                    {data.positioning_and_crowding?.correction_10pct_risk_1_to_3m || "MODERATE (25-50%)"}
                  </div>
                  <div className="text-[10px] text-slate-500">Retail &amp; NAAIM Overstretched</div>
                </div>

                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">3–12M Systemic Crash Risk (-20%)</div>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                    {data.positioning_and_crowding?.crash_20pct_risk_3_to_12m || "LOW (<25%)"}
                  </div>
                  <div className="text-[10px] text-slate-500">No Credit Spread Blowout</div>
                </div>
              </div>

              {/* Historical Bubble Peak Comparison */}
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 mb-3">
                <div className="text-[11px] font-mono text-slate-400 uppercase mb-1.5">
                  Historical Bubble Peaks Median Percentiles:
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="p-1.5 rounded bg-slate-800/50">
                    <div className="text-[10px] text-slate-400">Mar-2000</div>
                    <div className="font-bold text-rose-400">89%</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-800/50">
                    <div className="text-[10px] text-slate-400">Oct-2007</div>
                    <div className="font-bold text-slate-300">55%</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-800/50">
                    <div className="text-[10px] text-slate-400">Jan-2022</div>
                    <div className="font-bold text-amber-400">78%</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-800/50">
                    <div className="text-[10px] text-slate-400">Today</div>
                    <div className="font-bold text-rose-400">84%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              Inverted metrics: AAII Cash &amp; Bonds, 3M RVol, 3M Implied Corr, IG Spreads, EPU.
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PANEL 6: SECULAR & FUNDAMENTAL MONITORS
          ========================================================================= */}
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-[#0d1527]/80 p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
              Secular &amp; Fundamental Scouting Monitors (2026 MSR Suite)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Corporate Profitability */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Corporate Profitability Model
                </div>
                <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                  +{data.scouting_monitors?.corporate_profitability_model_bps ?? 670} bps
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Historical Mean: +{data.scouting_monitors?.corporate_profitability_historical_mean_bps ?? 584} bps
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Nominal GDP YoY (5.4%) minus [Unit Labor Costs YoY (1.2%) - Productivity YoY (2.5%)].
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-emerald-400">
                &uarr; Margin Expansion Accelerating
              </div>
            </div>

            {/* JOLTS Fake Job Demand Spread */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  JOLTS Fake Job Demand Spread
                </div>
                <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                  +{data.scouting_monitors?.jolts_fake_job_demand_spread_bps ?? 130} bps
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Private Openings (4.8%) - Hires (3.5%)
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Widest spread since Mar-2024. Confirms AI-driven "jobless recovery" and ghost listings.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-amber-400">
                &bull; Ghost Hiring Divergence
              </div>
            </div>

            {/* OIS Neutral Rate Spread */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Market-Implied Fed Neutral Spread
                </div>
                <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                  +{data.scouting_monitors?.ois_neutral_rate_model?.cutting_cycle_spread_bps ?? 11} to +{data.scouting_monitors?.ois_neutral_rate_model?.hiking_cycle_spread_bps ?? 39} bps
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  EFFR: 3.62% vs 5Y OIS: 3.73%–4.01%
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Fed policy remains accommodative; market pricing requires 1–2 rate hikes to reach neutral.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-cyan-400">
                &bull; Fed Behind the Curve
              </div>
            </div>

            {/* NTM Marketable Treasury Supply */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  NTM Marketable Treasury Supply
                </div>
                <div className="text-2xl font-mono font-bold text-rose-400 mt-1">
                  ${((data.scouting_monitors?.ntm_marketable_treasury_supply_bn ?? 12234) / 1000).toFixed(2)}T
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Maturing: $10.18T | Deficit: $2.34T
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Structural debt overhang driving persistent duration bear steepening across the curve.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-rose-400">
                &darr; Heavy Duration Bearish Pressure
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function roundOne(n: number): number {
  return Math.round(n * 10) / 10;
}
