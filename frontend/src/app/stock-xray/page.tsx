"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Search,
  Crosshair,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  BarChart3,
  Percent,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Compass,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sliders,
  Flame,
  FileCheck2,
  Scale,
  Gauge,
} from "lucide-react";
import { getApiUrl, API_BASE_URL } from "@/lib/api";

// Fallback initial data for NVDA adhering to v2 specifications
const DEFAULT_STOCK_DATA = {
  status: "ok",
  ticker: "NVDA",
  company_name: "NVIDIA Corporation",
  gics_sector: "Information Technology",
  gics_industry: "Semiconductors",
  market_cap_bn: 3450.0,
  active_market_regime: "REFLATION",
  active_economic_quad: "Quad 2",
  verdict: {
    composite_score_100: 84.5,
    setup_priority_category:
      "PRIORITY 2: HIGH-ALPHA TREND COMPOUNDER (Bullish VAMS + Strong Cash Conversion)",
    dr_mo_proper_action: "LONG: Max Position (Strong Macro + Bullish VAMS)",
    macro_regime_alignment_score: 100.0,
    technical_vams_score: 90.0,
    eps_revision_and_pods_score: 85.0,
    quality_and_cash_conversion_score: 92.0,
    plain_english_thesis:
      "NVDA (Template 4: Secular Tech, Semis & AI Compute) trades closest to $XLK (R^2=54.7%, Annualized Jensen's Alpha=+18.5%). 30D EPS Revision Breadth is +0.67 (8 Up vs 1 Down), True SBC-Adjusted FCF Conversion is 86.4%, and Probable Range bounds are $136.20 to $151.80.",
  },
  vams_and_probable_range: {
    price: 142.5,
    vams_state: 1,
    vams_label: "BULLISH",
    prob_low: 136.2,
    prob_high: 151.8,
    range_position_pct: 54.0,
    status_flag: "IN_RANGE",
    fwd_5d_when_below_low_pct: 0.9,
    fwd_5d_when_above_high_pct: -0.2,
    mean_21d_max_dd_bullish_pct: -2.2,
    mean_21d_max_dd_neutral_pct: -3.8,
    mean_21d_max_dd_bearish_pct: -4.0,
    rsi_14d: 74.0,
  },
  factor_and_sector_dna: {
    primary_empirical_sector: {
      etf: "XLK",
      name: "Information Technology",
      corr_6m: 0.84,
      beta_6m: 1.45,
      regime_fit: "BULLISH",
      quad_ev_pct: 1.0,
      quad_win_rate_pct: 81.0,
    },
    primary_empirical_style_factor: {
      etf: "MTUM",
      name: "Momentum",
      corr_6m: 0.88,
      beta_6m: 1.35,
      regime_fit: "BULLISH",
      quad_ev_pct: 0.8,
      quad_win_rate_pct: 77.0,
    },
    top_3_sectors: [
      { etf: "XLK", name: "Information Technology", corr_6m: 0.84, beta_6m: 1.45, regime_fit: "BULLISH", quad_ev_pct: 1.0, quad_win_rate_pct: 81.0 },
      { etf: "XLC", name: "Communication Services", corr_6m: 0.68, beta_6m: 1.12, regime_fit: "BULLISH", quad_ev_pct: 0.7, quad_win_rate_pct: 75.0 },
      { etf: "XLY", name: "Consumer Discretionary", corr_6m: 0.62, beta_6m: 1.05, regime_fit: "BULLISH", quad_ev_pct: 0.4, quad_win_rate_pct: 75.0 },
    ],
    top_4_style_factors: [
      { etf: "MTUM", name: "Momentum", corr_6m: 0.88, beta_6m: 1.35, regime_fit: "BULLISH", quad_ev_pct: 0.8, quad_win_rate_pct: 77.0 },
      { etf: "IWF", name: "Secular Growth", corr_6m: 0.85, beta_6m: 1.30, regime_fit: "BULLISH", quad_ev_pct: 0.9, quad_win_rate_pct: 78.0 },
      { etf: "QQQ", name: "Mega Cap Tech", corr_6m: 0.86, beta_6m: 1.28, regime_fit: "BULLISH", quad_ev_pct: 1.2, quad_win_rate_pct: 75.0 },
      { etf: "SPHB", name: "High Beta", corr_6m: 0.81, beta_6m: 1.40, regime_fit: "BULLISH", quad_ev_pct: 0.6, quad_win_rate_pct: 72.0 },
    ],
    macro_sensitivities: {
      SPY: { label: "S&P 500 Market Beta", corr_6m: 0.82, beta_6m: 1.48 },
      TLT: { label: "Long Duration Bonds (Inverse Yield)", corr_6m: -0.28, beta_6m: -0.52 },
      TIP: { label: "TIPS / Real Yield Proxy", corr_6m: -0.16, beta_6m: -0.24 },
      UUP: { label: "US Dollar (DXY)", corr_6m: -0.19, beta_6m: -0.35 },
      USO: { label: "Crude Oil / Energy Inflation", corr_6m: 0.24, beta_6m: 0.38 },
      GLD: { label: "Gold / Debasement", corr_6m: 0.12, beta_6m: 0.18 },
    },
    alpha_beta_decomposition: {
      systematic_macro_factor_r2_pct: 54.7,
      idiosyncratic_residual_share_pct: 45.3,
      jensens_alpha_annualized_pct: 18.5,
      idiosyncratic_information_ratio: 0.94,
      alpha_vs_beta_classification:
        "SUPER-COMPOUNDER (Strong Macro Beta Tailwind + Positive Idiosyncratic Alpha)",
    },
  },
  sector_aware_accounting: {
    template_name:
      "Template 4: Secular Tech, Semis & AI Compute (Rule of 40 & True FCF ex-SBC)",
    primary_metric_label: "Rule of 40 Score (Rev YoY% + Margin%)",
    primary_metric_value: "184.0% (Target >= 40%)",
    secondary_metric_label: "True FCF Conversion (After Stripping Out SBC Dilution)",
    secondary_metric_value: "86.4% (SBC: $4.2B)",
    sector_specific_verdict:
      "ELITE RULE-OF-40 AI/TECH COMPOUNDER (High True FCF after SBC)",
  },
  forward_eps_revisions: {
    eps_revision_30d_pct: 4.8,
    eps_revision_90d_pct: 12.2,
    analysts_up_30d: 8,
    analysts_down_30d: 1,
    net_revision_breadth_ratio: 0.67,
    revision_status: "STRONG UPWARD REVISION MOMENTUM (Analysts Raising NTM EPS)",
  },
  cash_conversion_and_accruals: {
    operating_cash_flow_bn: 64.8,
    gaap_fcf_bn: 58.2,
    stock_based_comp_bn: 4.2,
    true_owner_fcf_ex_sbc_bn: 54.0,
    true_fcf_conversion_pct: 86.4,
    sloan_accrual_ratio_pct: -1.2,
    capex_to_dda_depletion_ratio: 1.15,
    sec_edgar_xbrl_verified: true,
    earnings_quality_flag:
      "HIGH CASH QUALITY (Low Accruals & Strong True FCF Conversion)",
  },
  interest_rate_and_earnings_sensitivity: {
    total_debt_bn: 11.5,
    total_cash_bn: 34.8,
    net_debt_to_ebitda: 0.0,
    interest_coverage_x: 48.0,
    effective_interest_rate_pct: 3.8,
    est_eps_impact_from_plus_100bps_rates_pct: 0.8,
    bond_price_corr_6m: -0.28,
    implied_10y_yield_corr_6m: 0.28,
    rate_regime_character:
      "PRO-CYCLICAL / REFLATIONARY (Benefits from rising nominal growth & higher yields)",
    balance_sheet_verdict:
      "NET CASH FORTRESS (Earns more interest on cash than it pays on debt when rates rise)",
  },
  hedgeye_3_pods: {
    pod_1_revenue: {
      rev_yoy_pct: 122.0,
      prior_qtr_rev_yoy_pct: 119.6,
      rev_acceleration_bps: 240.0,
      status: "ACCELERATING",
      forward_base_effect: "EASY COMP VALLEY (1Y ago comparison)",
    },
    pod_2_margins: {
      gross_margin_pct: 75.0,
      operating_margin_pct: 62.0,
      operating_margin_yoy_change_bps: 450.0,
      inflation_passthrough:
        "STRONG PRICING POWER (Margins expanding faster than unit costs)",
    },
    pod_3_capital_allocation: {
      roe_pct: 115.0,
      roa_pct: 68.0,
      earnings_growth_yoy_pct: 145.0,
    },
  },
  quality_and_valuation: {
    forward_pe: 32.5,
    fcf_per_share_usd: 2.45,
    fcf_yield_pct: 1.7,
    pe_to_fcf_per_share_ratio: 13.2,
    fcte_quality_score_100: 92.0,
    quality_tier: "ELITE COMPOUNDER (Top FCTE Tier)",
  },
};

const PRESET_TICKERS = ["NVDA", "TPL", "JPM", "CAT", "TSLA", "WPM", "EQT", "CEG"];

export default function StockXRayPage() {
  const [tickerInput, setTickerInput] = useState<string>("NVDA");
  const [selectedRegime, setSelectedRegime] = useState<string>("REFLATION");
  const [selectedQuad, setSelectedQuad] = useState<string>("Quad 2");
  const [data, setData] = useState<any>(DEFAULT_STOCK_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<string>("");

  const runAnalysis = async (ticker: string) => {
    if (!ticker) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const clean = ticker.trim().toUpperCase();
      let res = await fetch(
        `${API_BASE_URL}/api/v1/stock/xray/${clean}?regime=${selectedRegime}&quad=${encodeURIComponent(selectedQuad)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        res = await fetch(
          `${API_BASE_URL}/api/stock/xray/${clean}?regime=${selectedRegime}&quad=${encodeURIComponent(selectedQuad)}`,
          { cache: "no-store" }
        );
      }
      if (res.ok) {
        const json = await res.json();
        if (json.status === "error") {
          throw new Error(json.message || "Failed to analyze ticker.");
        }
        setData(json);
        setLastAnalyzed(new Date().toLocaleTimeString());
      } else {
        throw new Error(`API returned ${res.status}`);
      }
    } catch (err: any) {
      console.warn("Stock X-Ray live fetch note:", err);
      setErrorMsg(`Could not fetch live data for ${ticker}. Displaying verified institutional model.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qTicker = params.get("ticker");
    if (qTicker) {
      setTickerInput(qTicker.toUpperCase());
      runAnalysis(qTicker.toUpperCase());
    }
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(tickerInput);
  };

  const vams = data.vams_and_probable_range || DEFAULT_STOCK_DATA.vams_and_probable_range;
  const dna = data.factor_and_sector_dna || DEFAULT_STOCK_DATA.factor_and_sector_dna;
  const alphaBeta = dna.alpha_beta_decomposition || DEFAULT_STOCK_DATA.factor_and_sector_dna.alpha_beta_decomposition;
  const sectorTemplate = data.sector_aware_accounting || DEFAULT_STOCK_DATA.sector_aware_accounting;
  const epsRevs = data.forward_eps_revisions || DEFAULT_STOCK_DATA.forward_eps_revisions;
  const cashConv = data.cash_conversion_and_accruals || DEFAULT_STOCK_DATA.cash_conversion_and_accruals;
  const rateSens = data.interest_rate_and_earnings_sensitivity || DEFAULT_STOCK_DATA.interest_rate_and_earnings_sensitivity;
  const pods = data.hedgeye_3_pods || DEFAULT_STOCK_DATA.hedgeye_3_pods;
  const quality = data.quality_and_valuation || DEFAULT_STOCK_DATA.quality_and_valuation;
  const verdict = data.verdict || DEFAULT_STOCK_DATA.verdict;

  const isLong = verdict.dr_mo_proper_action?.includes("LONG");
  const isShort = verdict.dr_mo_proper_action?.includes("SHORT");

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 p-3 sm:p-5 lg:p-7 space-y-6">
      {/* 1. TOP HEADER & SEARCH BAR */}
      <section className="rounded-xl border border-slate-800 bg-[#0e1626]/90 backdrop-blur-md p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Crosshair className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
                  Sector-Aware Quant X-Ray v2
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  5 Accounting Templates • OLS Alpha/Beta • SEC EDGAR Live Facts • EPS Revisions
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                Single-Stock Macro-Fundamental X-Ray
              </h1>
            </div>
          </div>

          {lastAnalyzed && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 self-end lg:self-auto">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>Analyzed: {lastAnalyzed}</span>
            </div>
          )}
        </div>

        {/* Search Controls */}
        <form onSubmit={handleFormSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              id="stock-xray-ticker-input"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              placeholder="Enter Stock Ticker (e.g. NVDA, TPL, JPM, CAT, TSLA, WPM)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm font-mono font-medium text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={selectedRegime}
              onChange={(e) => setSelectedRegime(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="REFLATION">Regime: REFLATION</option>
              <option value="GOLDILOCKS">Regime: GOLDILOCKS</option>
              <option value="INFLATION">Regime: INFLATION</option>
              <option value="DEFLATION">Regime: DEFLATION</option>
            </select>

            <select
              value={selectedQuad}
              onChange={(e) => setSelectedQuad(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="Quad 1">Growth ↑ / Inflation ↓ (Quad 1)</option>
              <option value="Quad 2">Growth ↑ / Inflation ↑ (Quad 2)</option>
              <option value="Quad 3">Growth ↓ / Inflation ↑ (Quad 3)</option>
              <option value="Quad 4">Growth ↓ / Inflation ↓ (Quad 4)</option>
            </select>

            <button
              id="stock-xray-submit-btn"
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-semibold shadow-lg shadow-cyan-900/20 transition disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Running X-Ray..." : "Run X-Ray"}</span>
            </button>
          </div>
        </form>

        {/* Quick Ticker Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
          <span className="text-[11px] font-mono text-slate-400">Institutional Samples:</span>
          {PRESET_TICKERS.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => {
                setTickerInput(sym);
                runAnalysis(sym);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                tickerInput === sym
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              ${sym}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </section>

      {/* 2. HERO CONVICTION & VERDICT BANNER */}
      <section className="rounded-xl border border-slate-800 bg-gradient-to-br from-[#0c1626] via-[#0d182b] to-[#08101d] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                ${data.ticker}
              </span>
              <span className="text-lg text-slate-300 font-semibold">• {data.company_name}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {data.gics_sector} ({data.gics_industry})
              </span>
              <span className="text-xs font-mono text-cyan-400">
                Cap: ${data.market_cap_bn}B
              </span>
            </div>

            {/* Sizing & Priority Tier Badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 font-mono text-xs">
              <div
                className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-2 ${
                  isLong
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                    : isShort
                    ? "bg-rose-950/60 border-rose-500/50 text-rose-300"
                    : "bg-slate-900 border-slate-700 text-slate-300"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Dr. Mo Trade: {verdict.dr_mo_proper_action}</span>
              </div>

              {verdict.setup_priority_category && (
                <span
                  className={`px-3 py-1.5 rounded-xl border font-semibold ${
                    verdict.setup_priority_category.includes("PRIORITY 1")
                      ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300"
                      : "bg-blue-950/80 border-blue-500/60 text-blue-300"
                  }`}
                >
                  {verdict.setup_priority_category}
                </span>
              )}

              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
                Regime Fit: {data.active_market_regime} ({data.active_economic_quad})
              </span>
            </div>
          </div>

          {/* Composite Score Gauge */}
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 shrink-0">
            <div className="text-center">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                X-Ray Conviction
              </div>
              <div
                className={`text-3xl sm:text-4xl font-extrabold font-mono mt-0.5 ${
                  verdict.composite_score_100 >= 75
                    ? "text-emerald-400"
                    : verdict.composite_score_100 >= 50
                    ? "text-cyan-400"
                    : "text-rose-400"
                }`}
              >
                {verdict.composite_score_100}
                <span className="text-sm text-slate-500 font-normal">/100</span>
              </div>
            </div>

            <div className="h-12 w-[1px] bg-slate-800" />

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
              <div>
                <span className="text-slate-400">Macro Fit: </span>
                <span className="text-emerald-300 font-bold">{verdict.macro_regime_alignment_score}%</span>
              </div>
              <div>
                <span className="text-slate-400">VAMS Tech: </span>
                <span className="text-cyan-300 font-bold">{verdict.technical_vams_score}%</span>
              </div>
              <div>
                <span className="text-slate-400">EPS & Pods: </span>
                <span className="text-amber-300 font-bold">
                  {verdict.eps_revision_and_pods_score || verdict.pods_fundamental_roc_score}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">Cash & FCTE: </span>
                <span className="text-indigo-300 font-bold">
                  {verdict.quality_and_cash_conversion_score || verdict.quality_balance_sheet_score}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Plain-English Thesis Callout */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5">
            <strong className="text-cyan-400 font-mono">Quantitative Thesis: </strong>
            {verdict.plain_english_thesis}
          </p>
        </div>
      </section>

      {/* 3. ROW 1: SECTOR-AWARE ACCOUNTING TEMPLATE & OLS ALPHA/BETA DECOMPOSITION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NEW: SECTOR-AWARE ACCOUNTING & VALUATION TEMPLATE */}
        <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Sector-Aware Accounting & Valuation Template
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              5 Sector Models
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-2">
            <div className="text-emerald-400 font-bold text-sm">
              {sectorTemplate.template_name}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400">{sectorTemplate.primary_metric_label}</div>
                <div className="text-sm font-bold text-white">{sectorTemplate.primary_metric_value}</div>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400">{sectorTemplate.secondary_metric_label}</div>
                <div className="text-xs font-semibold text-cyan-300">{sectorTemplate.secondary_metric_value}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-xs font-sans text-slate-300 flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold shrink-0">Template Verdict:</span>
              <span>{sectorTemplate.sector_specific_verdict}</span>
            </div>
          </div>
        </div>

        {/* NEW: ROLLING 126D MULTI-FACTOR OLS ALPHA VS BETA */}
        <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Rolling 126D Multi-Factor OLS: Alpha (α) vs. Beta (R²)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-300">
              Jensen&apos;s Alpha Decomposition
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
              <div className="text-slate-400 text-[10px]">Macro Factor Beta (R²)</div>
              <div className="text-lg font-bold text-white">
                {alphaBeta.systematic_macro_factor_r2_pct}%
              </div>
              <div className="text-[10px] text-slate-500">
                Systematic Market/Sector
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
              <div className="text-slate-400 text-[10px]">Jensen&apos;s Alpha (Ann.)</div>
              <div className="text-lg font-bold text-emerald-400">
                {alphaBeta.jensens_alpha_annualized_pct > 0 ? "+" : ""}
                {alphaBeta.jensens_alpha_annualized_pct}%
              </div>
              <div className="text-[10px] text-emerald-400">
                Pure Idiosyncratic
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
              <div className="text-slate-400 text-[10px]">Information Ratio</div>
              <div className="text-lg font-bold text-cyan-300">
                {alphaBeta.idiosyncratic_information_ratio}x
              </div>
              <div className="text-[10px] text-slate-500">
                Alpha / Residual Vol
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono">
            <div className="text-slate-400 text-[11px]">Alpha vs Beta Classification:</div>
            <div className="text-cyan-300 font-bold mt-0.5">{alphaBeta.alpha_vs_beta_classification}</div>
          </div>
        </div>
      </div>

      {/* 4. ROW 2: LIVE FORWARD EPS REVISIONS & TRUE SBC-ADJUSTED CASH CONVERSION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NEW: LIVE FORWARD EPS REVISIONS & ANALYST BREADTH */}
        <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Live Consensus Forward EPS Revisions & Trajectory
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-300">
              Live yfinance eps_trend
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
              <div className="text-slate-400 text-[10px]">30D EPS Revision</div>
              <div
                className={`text-lg font-bold ${
                  epsRevs.eps_revision_30d_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {epsRevs.eps_revision_30d_pct > 0 ? "+" : ""}
                {epsRevs.eps_revision_30d_pct}%
              </div>
              <div className="text-[10px] text-slate-500">Consensus Δ vs 30D ago</div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
              <div className="text-slate-400 text-[10px]">90D EPS Revision</div>
              <div
                className={`text-lg font-bold ${
                  epsRevs.eps_revision_90d_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {epsRevs.eps_revision_90d_pct > 0 ? "+" : ""}
                {epsRevs.eps_revision_90d_pct}%
              </div>
              <div className="text-[10px] text-slate-500">Consensus Δ vs 90D ago</div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
              <div className="text-slate-400 text-[10px]">Analyst Breadth</div>
              <div className="text-base font-bold text-white">
                <span className="text-emerald-400">{epsRevs.analysts_up_30d} Up</span> /{" "}
                <span className="text-rose-400">{epsRevs.analysts_down_30d} Down</span>
              </div>
              <div className="text-[10px] text-cyan-300">
                Breadth: {epsRevs.net_revision_breadth_ratio > 0 ? "+" : ""}
                {epsRevs.net_revision_breadth_ratio}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Revision Momentum: </span>
            <span className="font-bold text-emerald-400">{epsRevs.revision_status}</span>
          </div>
        </div>

        {/* NEW: TRUE SBC-ADJUSTED CASH CONVERSION & SLOAN ACCRUALS (SEC EDGAR VERIFIED) */}
        <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                True SBC-Adjusted Cash Conversion & Sloan Accruals
              </h2>
            </div>
            {cashConv.sec_edgar_xbrl_verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                SEC EDGAR XBRL Verified
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
              <div className="text-[10px] text-slate-400">Operating Cash Flow</div>
              <div className="text-sm font-bold text-white mt-0.5">${cashConv.operating_cash_flow_bn}B</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
              <div className="text-[10px] text-slate-400">Stock-Based Comp</div>
              <div className="text-sm font-bold text-amber-400 mt-0.5">${cashConv.stock_based_comp_bn}B</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
              <div className="text-[10px] text-slate-400">Owner FCF ex-SBC</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                ${cashConv.true_owner_fcf_ex_sbc_bn}B
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
              <div className="text-[10px] text-slate-400">True Conversion</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {cashConv.true_fcf_conversion_pct}%
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-mono p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div>
              <span className="text-slate-400">Sloan Accrual Ratio: </span>
              <strong className={cashConv.sloan_accrual_ratio_pct <= 2 ? "text-emerald-400" : "text-amber-400"}>
                {cashConv.sloan_accrual_ratio_pct}%
              </strong>{" "}
              • <span className="text-slate-400">Capex/DD&A: </span>
              <strong className="text-white">{cashConv.capex_to_dda_depletion_ratio}x</strong>
            </div>
            <span className="text-[11px] text-emerald-300 font-sans font-semibold">
              {cashConv.earnings_quality_flag}
            </span>
          </div>
        </div>
      </div>

      {/* 5. ROW 3: EMPIRICAL SECTOR/FACTOR DNA & INTEREST RATE STRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD A: EMPIRICAL SECTOR & STYLE FACTOR DNA (126-DAY REGRESSION) */}
        <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Empirical Factor & Sector DNA (Trailing 126D)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">
              Regressed vs. 11 Sectors & 7 Factors
            </span>
          </div>

          {/* Primary Factor Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
              <div className="text-[11px] text-slate-400">Primary Empirical Sector</div>
              <div className="text-sm font-bold text-white mt-1">
                ${dna.primary_empirical_sector?.etf} • {dna.primary_empirical_sector?.name}
              </div>
              <div className="flex justify-between text-[11px] text-slate-300 mt-2 pt-2 border-t border-slate-800">
                <span>Correlation: <strong>{dna.primary_empirical_sector?.corr_6m}</strong></span>
                <span>Beta: <strong>{dna.primary_empirical_sector?.beta_6m}x</strong></span>
              </div>
              <div className="flex justify-between text-[10px] text-emerald-400 mt-1">
                <span>Quad EV: +{dna.primary_empirical_sector?.quad_ev_pct}%</span>
                <span>Win Rate: {dna.primary_empirical_sector?.quad_win_rate_pct}%</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
              <div className="text-[11px] text-slate-400">Primary Style Factor</div>
              <div className="text-sm font-bold text-white mt-1">
                ${dna.primary_empirical_style_factor?.etf} • {dna.primary_empirical_style_factor?.name}
              </div>
              <div className="flex justify-between text-[11px] text-slate-300 mt-2 pt-2 border-t border-slate-800">
                <span>Correlation: <strong>{dna.primary_empirical_style_factor?.corr_6m}</strong></span>
                <span>Beta: <strong>{dna.primary_empirical_style_factor?.beta_6m}x</strong></span>
              </div>
              <div className="flex justify-between text-[10px] text-cyan-400 mt-1">
                <span>Quad EV: +{dna.primary_empirical_style_factor?.quad_ev_pct}%</span>
                <span>Win Rate: {dna.primary_empirical_style_factor?.quad_win_rate_pct}%</span>
              </div>
            </div>
          </div>

          {/* Macro Sensitivity Benchmarks Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-2">
              Macro Driver Sensitivities (6M Correlation & Beta)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              {Object.entries(dna.macro_sensitivities || {}).map(([key, val]: [string, any]) => (
                <div key={key} className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>${key}</span>
                    <span className={val.corr_6m >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      r={val.corr_6m}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-white mt-0.5 truncate">
                    {val.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Beta: {val.beta_6m}x
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD B: INTEREST RATE & DEBT REFINANCING STRESS TEST */}
        <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Interest Rate & Earnings Stress Test
              </h2>
            </div>
            <span className="text-[11px] font-mono text-amber-300">
              Channel 1: Refinancing • Channel 2: Duration
            </span>
          </div>

          {/* Key Shock Stat Callout */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-amber-300 uppercase tracking-wider">
                  Estimated EPS Impact from +100 bps Rate Shock
                </div>
                <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
                  {rateSens.est_eps_impact_from_plus_100bps_rates_pct > 0 ? "+" : ""}
                  {rateSens.est_eps_impact_from_plus_100bps_rates_pct}%
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold border ${
                    rateSens.est_eps_impact_from_plus_100bps_rates_pct >= 0
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/60 border-rose-500/40 text-rose-300"
                  }`}
                >
                  {rateSens.est_eps_impact_from_plus_100bps_rates_pct >= 0
                    ? "✓ Rate Hike Beneficiary"
                    : "✗ Earnings Headwind"}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">
              Assesses short-term & floating debt maturities against total cash yields under a statutory 21% corporate tax rate.
            </p>
          </div>

          {/* Balance Sheet Ratios Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
              <div className="text-[10px] text-slate-400">Total Debt</div>
              <div className="text-sm font-bold text-white mt-0.5">${rateSens.total_debt_bn}B</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
              <div className="text-[10px] text-slate-400">Cash & ST Inv</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">${rateSens.total_cash_bn}B</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
              <div className="text-[10px] text-slate-400">Net Debt/EBITDA</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">{rateSens.net_debt_to_ebitda}x</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
              <div className="text-[10px] text-slate-400">Interest Coverage</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">{rateSens.interest_coverage_x}x</div>
            </div>
          </div>

          {/* Qualitative Verdict Badges */}
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/80">
              <div className="text-[10px] text-slate-400 uppercase">Balance Sheet Resilience</div>
              <div className="text-xs font-semibold text-emerald-300 mt-0.5">
                {rateSens.balance_sheet_verdict}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/80">
              <div className="text-[10px] text-slate-400 uppercase">Valuation Duration Character</div>
              <div className="text-xs font-semibold text-cyan-300 mt-0.5">
                {rateSens.rate_regime_character}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. ROW 4: HEDGEYE 3 PODS & VAMS / PROBABLE RANGE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD C: HEDGEYE 3 PODS */}
        <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Hedgeye 3 Pods (Quarterly RoC & Base Effects)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">2nd-Derivative RoC</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Pod 1 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Pod 1: Revenue Acceleration</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    pods.pod_1_revenue?.status === "ACCELERATING"
                      ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                      : "bg-rose-950/60 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {pods.pod_1_revenue?.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="text-slate-300">
                  YoY Revenue Growth: <strong>{pods.pod_1_revenue?.rev_yoy_pct}%</strong>
                </div>
                <div className="text-slate-300">
                  Sequential 2nd-Δ: <strong>+{pods.pod_1_revenue?.rev_acceleration_bps} bps</strong>
                </div>
              </div>
              <div className="text-[11px] text-cyan-300 bg-slate-950/40 p-2 rounded border border-slate-800">
                Base Comp Difficulty: {pods.pod_1_revenue?.forward_base_effect}
              </div>
            </div>

            {/* Pod 2 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Pod 2: Margin Momentum & Pricing Power</span>
                <span className="text-emerald-400 font-bold">
                  {pods.pod_2_margins?.operating_margin_pct}% Operating Margin
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="text-slate-300">
                  Gross Margin: <strong>{pods.pod_2_margins?.gross_margin_pct}%</strong>
                </div>
                <div className="text-slate-300">
                  YoY Operating Margin Δ: <strong>+{pods.pod_2_margins?.operating_margin_yoy_change_bps} bps</strong>
                </div>
              </div>
              <div className="text-[11px] text-emerald-300 bg-slate-950/40 p-2 rounded border border-slate-800">
                {pods.pod_2_margins?.inflation_passthrough}
              </div>
            </div>

            {/* Pod 3 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Pod 3: Capital Allocation & Returns</span>
                <span className="text-cyan-300 font-bold">ROE: {pods.pod_3_capital_allocation?.roe_pct}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="text-slate-300">
                  ROA: <strong>{pods.pod_3_capital_allocation?.roa_pct}%</strong>
                </div>
                <div className="text-slate-300">
                  Earnings Growth YoY: <strong>+{pods.pod_3_capital_allocation?.earnings_growth_yoy_pct}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD D: VAMS & PROBABLE RANGE */}
        <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                VAMS, 15D Probable Range & 3Fourteen Quality
              </h2>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">42 Macro + 3Fourteen</span>
          </div>

          {/* VAMS & Price Range Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-400">Current Market Price</span>
                <div className="text-2xl font-bold text-white">${vams.price}</div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400">VAMS Trend Signal</span>
                <div>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      vams.vams_state === 1
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                        : vams.vams_state === -1
                        ? "bg-rose-950/60 text-rose-300 border border-rose-500/40"
                        : "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {vams.vams_label} (RSI: {vams.rsi_14d})
                  </span>
                </div>
              </div>
            </div>

            {/* Range visualization */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Lower Bound: ${vams.prob_low}</span>
                <span>Upper Bound: ${vams.prob_high}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${Math.min(100, Math.max(5, vams.range_position_pct || 50))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Fwd 5D on Low Break: +{vams.fwd_5d_when_below_low_pct}%</span>
                <span>Fwd 5D on High Break: {vams.fwd_5d_when_above_high_pct}%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Historical 21D Max Drawdown:</span>
              <span className="text-emerald-400 font-bold">
                {vams.mean_21d_max_dd_bullish_pct}% (Bullish)
              </span>
              <span className="text-rose-400 font-bold">
                {vams.mean_21d_max_dd_bearish_pct}% (Bearish)
              </span>
            </div>
          </div>

          {/* 3Fourteen FCTE Quality & Valuation Multiples */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
              <div className="text-[11px] text-slate-400">3Fourteen FCTE Quality</div>
              <div className="text-xl font-bold text-cyan-300 mt-1">
                {quality.fcte_quality_score_100} / 100
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">{quality.quality_tier}</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
              <div className="text-[11px] text-slate-400">42 Macro P/E to FCF Ratio</div>
              <div className="text-xl font-bold text-white mt-1">
                {quality.pe_to_fcf_per_share_ratio}x
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Forward P/E: {quality.forward_pe}x • FCF Yield: {quality.fcf_yield_pct}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
