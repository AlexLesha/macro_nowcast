"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";
import { MetricTip } from "@/components/FinancialTooltip";
import {
  ShieldCheck,
  Zap,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Activity,
  Compass,
  Cpu,
} from "lucide-react";

const SUPPORTED_TICKERS = ["SPY", "QQQ", "IWM", "NVDA", "IBIT", "GLD", "TLT", "USO", "XLK", "XLF", "XLE"];

const FALLBACK_OPTIONS_DATA: any = {
  status: "ok",
  as_of_utc: "Live Syncing...",
  selected_ticker: "SPY",
  supported_tickers: SUPPORTED_TICKERS,
  macro_regime: {
    active_regime_label: "DEFLATION",
    hedgeye_quad: "QUAD_3",
    net_liquidity_usd_bn: 5745.7,
    net_liquidity_4w_roc_bn: -120.0,
    probability_risk_on_pct: 42.0,
    gamma_regime_impact: "POSITIVE GAMMA CUSHION: Positive dealer GEX dampens macro quad volatility, forcing mean-reversion around strike pins.",
    vrp_regime_state: "POSITIVE VOL CARRY: Implied Volatility exceeds Realized Volatility; options selling / collar financing is favorable.",
    forty_two_macro_volatility_gate: "VOLATILITY REGIME DEFENSIVE / RISK-OFF (Curve Backwardation or Bond Vol Spike)",
    vol_gate_color: "ROSE",
    accord_2_0_prob: 72.0,
  },
  executive_synthesis: {
    active_signals_count: 2,
    actionable_modules_list: ["Module 3 (MOVE vs VIX Co-Signer)", "Module 4 (VIX Term Structure & VRP)"],
    neutral_modules_list: ["Module 1 (Dealer GEX & Walls)", "Module 2 (Correlation & Dispersion)", "Module 5 (Cross-Asset Options Flow)"],
    headline_summary: "2 of 5 Options Modules currently flash a standalone actionable signal.",
  },
  module_1_gex_and_collar: {
    ticker: "SPY",
    spot_price: 585.20,
    net_gex_bn: 0.42,
    call_gex_bn: 1.15,
    put_gex_bn: 0.73,
    gamma_flip_price: 578.50,
    call_wall_strike: 595.0,
    put_wall_strike: 572.0,
    wall_corridor_pos_pct: 57.4,
    near_term_0dte_heat_pct: 44.8,
    vanna_notional_mn: 142.5,
    charm_notional_mn: 88.2,
    atm_iv_30d_pct: 14.8,
    skew_25d_pct: 4.1,
    gamma_regime_classification: "POSITIVE_GAMMA_PIN",
    top_strike_Ladder: [
      { strike: 572.0, net_gex_bn: -0.62, role: "PUT WALL (Structural Support / Trap)" },
      { strike: 578.5, net_gex_bn: 0.0, role: "GAMMA FLIP PIVOT" },
      { strike: 585.0, net_gex_bn: 0.28, role: "SPOT PIN (Mean-Reverting)" },
      { strike: 595.0, net_gex_bn: 0.84, role: "CALL WALL (Magnetic Resistance)" },
    ],
    kspy_overlay_regime: "MID-CORRIDOR POSITIVE GAMMA PIN -> NO DIRECTIONAL INDEX EDGE",
    signal_status: "NO_STANDALONE_ACTION",
    plain_english_verdict: "NO STANDALONE DIRECTIONAL OPTIONS TRADE: $SPY is pinned between its Put Wall and Call Wall under Positive Dealer Gamma. Dealers mechanically sell rips and buy dips, crushing option buyers via theta decay.",
    model_complement_and_next_step: "Alpha shifts to single-stock and sector rotation; check Module 2 and /trade-ideas.",
  },
  module_2_correlation_and_dispersion: {
    implied_sector_corr_pct: 34.2,
    corr_1y_percentile: 42.0,
    sector_sharpe_dispersion: 0.94,
    top_sector_leader: { sector: "XLK", sharpe_21d: 1.82, ret_21d_pct: 5.4 },
    bottom_sector_laggard: { sector: "XLRE", sharpe_21d: -0.74, ret_21d_pct: -2.8 },
    sector_rankings: [],
    signal_status: "NO_STANDALONE_ACTION",
    plain_english_verdict: "Sector correlation and dispersion are both sitting in neutral mid-ranges.",
    model_complement_and_next_step: "Rely on /stock-analysis and /trade-ideas for fundamental selection.",
  },
  module_3_move_vix_cosigner: {
    move_index: 73.5,
    move_1y_pct: 28.5,
    vix_index: 18.2,
    vix_1y_pct: 58.2,
    vvix_index: 92.4,
    vvix_1y_pct: 46.0,
    vvix_to_vix_ratio: 5.08,
    move_minus_vix_z_spread: -0.85,
    cosigner_state: "BULLISH CO-SIGNER ACTIVE (Bond Vol Calm While Equity Vol Elevated)",
    signal_status: "ACTIONABLE_BULLISH",
    plain_english_verdict: "Treasury Bond Volatility is subdued while Equity Volatility is elevated. Buy equity dips.",
    model_complement_and_next_step: "Deploy capital into /trade-ideas candidates.",
  },
  module_4_term_structure_and_vrp: {
    vix9d: 17.5,
    vix_spot: 18.2,
    vix3m: 19.8,
    vix_to_vix3m_ratio: 0.919,
    vrp_spread_pts: 3.4,
    cboe_skew_index: 138.5,
    skew_to_vix_ratio: 7.6,
    skew_to_vix_percentile: 65.0,
    skew_25d_pct: 4.1,
    term_structure_state: "CONTANGO (Normal Steepening)",
    signal_status: "NO_STANDALONE_ACTION",
    plain_english_verdict: "Term structure is in normal contango with positive volatility carry.",
    model_complement_and_next_step: "Option selling strategies enjoy positive carry.",
  },
  module_5_flow_and_capitulation: {
    inverse_etf_vol_share_pct: 28.5,
    bull_leveraged_etf_vol_share_pct: 35.2,
    cross_asset_flow_table: [],
    signal_status: "NO_STANDALONE_ACTION",
    plain_english_verdict: "Speculative Inverse ETF share is in the neutral band.",
    model_complement_and_next_step: "Monitor for extreme capitulation washouts (>48%).",
  },
};

function statusBadgeStyle(status: string) {
  switch (status) {
    case "ACTIONABLE_BULLISH":
      return "bg-emerald-950/80 border-emerald-500/50 text-emerald-300";
    case "ACTIONABLE_BEARISH":
      return "bg-rose-950/80 border-rose-500/50 text-rose-300";
    case "ACTIONABLE_VOL_HARVEST":
      return "bg-amber-950/80 border-amber-500/50 text-amber-300";
    default:
      return "bg-slate-900 border-slate-700 text-slate-300";
  }
}

function statusLabelText(status: string) {
  switch (status) {
    case "ACTIONABLE_BULLISH":
      return "ACTIONABLE BUY";
    case "ACTIONABLE_BEARISH":
      return "ACTIONABLE HEDGE / SHORT";
    case "ACTIONABLE_VOL_HARVEST":
      return "VOL CARRY HARVEST";
    default:
      return "NEUTRAL / NO EDGE";
  }
}

export default function OptionsLabPage() {
  const [selectedTicker, setSelectedTicker] = useState<string>("SPY");
  const [data, setData] = useState<any>(FALLBACK_OPTIONS_DATA);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDashboard = (tk: string, force = false) => {
    setLoading(true);
    fetch(getApiUrl(`/api/v1/options-lab/dashboard?ticker=${encodeURIComponent(tk)}&force=${force}`), {
      cache: "no-store",
    })
      .then((r) => {
        if (!r.ok) {
          return fetch(getApiUrl(`/api/options-lab/dashboard?ticker=${encodeURIComponent(tk)}&force=${force}`), { cache: "no-store" })
            .then((r2) => (r2.ok ? r2.json() : null));
        }
        return r.json();
      })
      .then((json) => {
        if (json && json.status === "ok") {
          setData(json);
        }
      })
      .catch((e) => {
        console.error("Options Lab fetch error:", e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard(selectedTicker, false);

    const handleGlobalRefresh = () => {
      fetchDashboard(selectedTicker, true);
    };
    window.addEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
    return () => window.removeEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
  }, [selectedTicker]);

  const regime = data?.macro_regime;
  const m1 = data?.module_1_gex_and_collar;
  const m2 = data?.module_2_correlation_and_dispersion;
  const m3 = data?.module_3_move_vix_cosigner;
  const m4 = data?.module_4_term_structure_and_vrp;
  const m5 = data?.module_5_flow_and_capitulation;

  const macroPlumbing = data?.macro_plumbing_state || {};
  const opexCal = macroPlumbing.opex_calendar || {};
  const signalMatrix = macroPlumbing.signal_matrix || {};
  const volProxies = macroPlumbing.volatility_proxies || {};
  const hydraulics = macroPlumbing.hydraulic_liquidity_state || {};

  const activeRegimeId = signalMatrix.active_regime_id || 1;
  const regimeBadgeColor =
    activeRegimeId === 3
      ? "bg-rose-950/80 text-rose-300 border-rose-700"
      : activeRegimeId === 2
        ? "bg-amber-950/80 text-amber-300 border-amber-700"
        : "bg-emerald-950/80 text-emerald-300 border-emerald-700";

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* TOP HEADER & LIVE UNDERLYING TICKER SELECTOR */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-4 md:p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Live Options Microstructure &bull; Dealer GEX &bull; Cem Karsan / Noel Smith Framework
                </span>
                {data?.as_of_utc && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                    ● Synced: {data.as_of_utc}
                  </span>
                )}
              </div>
              <h1 className="text-base font-bold text-white mt-1">
                Institutional Options &amp; Volatility Surface Lab (5-Module Dynamic Suite)
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-400 mr-1">Underlying:</span>
              {SUPPORTED_TICKERS.map((tk) => (
                <button
                  key={tk}
                  onClick={() => setSelectedTicker(tk)}
                  className={`px-2.5 py-1 rounded border font-semibold transition text-xs ${selectedTicker === tk
                      ? "bg-blue-600 border-blue-400 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                >
                  ${tk}
                </button>
              ))}
              <button
                onClick={() => fetchDashboard(selectedTicker, true)}
                className="ml-1 px-3 py-1 rounded border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-semibold"
              >
                {loading ? "Scanning..." : "↻ Sync Live Data"}
              </button>
            </div>
          </div>

          {/* PROJECT-GLOBAL MACRO REGIME STRIP */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                  Project-Global Macro Regime Alignment
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-mono font-semibold">
                  Regime: {regime?.active_regime_label || "DEFLATION"} &bull; {regime?.hedgeye_quad || "QUAD_3"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">
                  <MetricTip term="NET LIQUIDITY">Fed Net Liquidity</MetricTip>: <strong className="text-emerald-400">${regime?.net_liquidity_usd_bn || 5745.7}B</strong> ({regime?.net_liquidity_4w_roc_bn || -120.0}B 4W)
                </span>
                <span className="text-slate-400">
                  <MetricTip term="ACCORD 2.0">Accord 2.0 Prob</MetricTip>: <strong className="text-amber-400">{regime?.accord_2_0_prob || 72.0}%</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60">
                <span className="text-slate-400">
                  <MetricTip term="DEALER GAMMA">Dealer Gamma Impact:</MetricTip>
                </span>
                <div className="text-xs font-bold text-white mt-1">
                  {regime?.gamma_regime_impact || "Evaluating dealer gamma buffer..."}
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60">
                <span className="text-slate-400">
                  <MetricTip term="VRP">Volatility Risk Premium Carry:</MetricTip>
                </span>
                <div className="text-xs font-bold text-cyan-300 mt-1">
                  {regime?.vrp_regime_state || "Positive Volatility Carry"}
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60">
                <span className="text-slate-400">42 Macro Volatility Confirmation Gate:</span>
                <div className={`text-xs font-bold mt-1 ${regime?.vol_gate_color === "EMERALD" ? "text-emerald-400" :
                    regime?.vol_gate_color === "ROSE" ? "text-rose-400" : "text-cyan-300"
                  }`}>
                  {regime?.forty_two_macro_volatility_gate || "VOLATILITY REGIME NEUTRAL"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <span className="text-slate-400">Integrated Models:</span>
              <div className="flex flex-wrap gap-3">
                <Link href="/42-macro" className="text-cyan-400 hover:text-cyan-300 transition">
                  &rarr; 42 Macro GRID
                </Link>
                <Link href="/liquidity-allocation" className="text-cyan-400 hover:text-cyan-300 transition">
                  &rarr; Liquidity Allocation
                </Link>
                <Link href="/scenarios" className="text-cyan-400 hover:text-cyan-300 transition">
                  &rarr; Forward Scenarios
                </Link>
                <Link href={`/stock-analysis?ticker=${selectedTicker}`} className="text-amber-400 hover:text-amber-300 transition font-semibold">
                  &rarr; Analyze ${selectedTicker} in Stock Analysis
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CEM KARSAN / NOEL SMITH OPEX CYCLE TRACKER & 3-REGIME SIGNAL MATRIX */}
        {/* ========================================================================= */}
        <section className="rounded-xl border border-cyan-800/60 bg-gradient-to-r from-[#0a1224] via-[#0f1b33] to-[#0c1527] p-5 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-700/60 pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                  OPTIONS HYDRAULIC VALVE SYSTEM &bull; CEM KARSAN &amp; NOEL SMITH ENGINE
                </span>
                <h2 className="text-base font-black text-white font-mono">
                  OpEx Cycle Phase: {opexCal.phase_label || "Pre-OpEx Structural Pin (Valves Closed)"}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono px-3 py-1 rounded border font-black uppercase tracking-wider ${regimeBadgeColor}`}>
                {signalMatrix.badge_label || "STRUCTURAL DAM ACTIVE"}
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
                Valve: <strong className={opexCal.valve_status === "VALVES_OPEN" ? "text-rose-400" : "text-emerald-400"}>{opexCal.valve_status || "VALVES_CLOSED"}</strong>
              </span>
            </div>
          </div>

          {/* OpEx Temporal Details Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-[#080e1b] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Days to Next OpEx</span>
              <div className="text-base font-black text-cyan-300">
                {opexCal.days_until_next_opex ?? 12} Days
              </div>
              <span className="text-[11px] text-slate-500">
                Next: {opexCal.next_opex || "2026-11-20"} {opexCal.is_quarterly_opex ? "(Quarterly)" : "(Monthly)"}
              </span>
            </div>

            <div className="bg-[#080e1b] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-0.5">
                <MetricTip term="VANNA">Vanna Decay Flow</MetricTip>
              </span>
              <div className="text-base font-bold text-emerald-400">
                +${m1?.vanna_notional_mn || 142.5}M
              </div>
              <span className="text-[11px] text-slate-500">dDelta / dSigma dealer bid</span>
            </div>

            <div className="bg-[#080e1b] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-0.5">
                <MetricTip term="CHARM">Charm Time Decay Flow</MetricTip>
              </span>
              <div className="text-base font-bold text-emerald-400">
                +${m1?.charm_notional_mn || 88.2}M
              </div>
              <span className="text-[11px] text-slate-500">Daily passage forces buying</span>
            </div>

            <div className="bg-[#080e1b] p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-0.5">
                <MetricTip term="TERM STRUCTURE CONTANGO">Term Structure Slope</MetricTip>
              </span>
              <div className="text-base font-bold text-amber-300">
                {volProxies.term_structure_slope !== undefined ? `${volProxies.term_structure_slope > 0 ? "+" : ""}${volProxies.term_structure_slope}` : "+1.70"} pts
              </div>
              <span className="text-[11px] text-slate-500">
                {volProxies.term_structure_state || "CONTANGO"} (VIX &lt; VIX3M)
              </span>
            </div>
          </div>

          {/* 3-Regime Signal Matrix Breakdown */}
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
              The 3-Regime Signal Matrix (Quantitative State Machine)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(signalMatrix.regimes_breakdown || [
                {
                  id: 1,
                  name: "Regime 1: The Structural Pin",
                  subtitle: "Bullish / Rangebound Dam",
                  condition_logic: "1st of month to OpEx Friday AND VIX < VIX3M (Contango).",
                  mechanism: "Vanna and Charm force dealers to buy as hedges decay.",
                  action: "Override bearish macro headlines. Buy dips, sell volatility.",
                  is_active: activeRegimeId === 1,
                },
                {
                  id: 2,
                  name: "Regime 2: Window of Weakness",
                  subtitle: "Vulnerable / Macro-Driven",
                  condition_logic: "OpEx + 1 to OpEx + 10 days AND Net Liquidity flat/contracting.",
                  mechanism: "Derivatives expire; structural dealer bid vanishes. Vulnerable to TGA.",
                  action: "Macro Vulnerability Alert. Buy downside hedges, rotate to T-Bills.",
                  is_active: activeRegimeId === 2,
                },
                {
                  id: 3,
                  name: "Regime 3: The Left Tail Cascade",
                  subtitle: "Crisis / Negative Gamma",
                  condition_logic: "Net Liquidity sharp drain AND VIX > VIX3M AND Put/Call breakout.",
                  mechanism: "Dealers transition to short gamma (forced momentum sellers).",
                  action: "De-gross all equities. Exit risk assets; basis trade forced unwind.",
                  is_active: activeRegimeId === 3,
                },
              ]).map((reg: any) => {
                const isActive = reg.is_active;
                const borderClass = isActive
                  ? reg.id === 3
                    ? "border-rose-500 bg-rose-950/30 shadow-lg shadow-rose-950/40"
                    : reg.id === 2
                      ? "border-amber-500 bg-amber-950/30 shadow-lg shadow-amber-950/40"
                      : "border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-950/40"
                  : "border-slate-800 bg-[#091120] opacity-75";

                return (
                  <div key={reg.id} className={`p-3.5 rounded-xl border ${borderClass} font-mono text-xs flex flex-col justify-between space-y-2`}>
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                        <span className="font-bold text-white text-xs">{reg.name}</span>
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase border ${isActive
                            ? reg.id === 3
                              ? "bg-rose-950 text-rose-300 border-rose-600 animate-pulse"
                              : reg.id === 2
                                ? "bg-amber-950 text-amber-300 border-amber-600 animate-pulse"
                                : "bg-emerald-950 text-emerald-300 border-emerald-600"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                          }`}>
                          {isActive ? "ACTIVE REGIME" : "INACTIVE"}
                        </span>
                      </div>
                      <div className="text-[11px] text-cyan-400 font-semibold mb-1">{reg.subtitle}</div>
                      <p className="text-[11px] text-slate-300 font-sans mb-1.5 leading-snug">
                        <strong className="font-mono text-slate-400 text-[10px] block uppercase">Logic:</strong> {reg.condition_logic}
                      </p>
                      <p className="text-[11px] text-slate-300 font-sans leading-snug">
                        <strong className="font-mono text-slate-400 text-[10px] block uppercase">Plumbing:</strong> {reg.mechanism}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[11px] font-sans text-cyan-200">
                      <strong className="font-mono text-cyan-400 block uppercase text-[10px]">Action:</strong> {reg.action}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tradable Verdict & Checklist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
            <div className="bg-[#080e1b] p-3 rounded-lg border border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                SYSTEMATIC OPTIONS ACTIONABLE PLAYBOOK
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {(signalMatrix.trading_playbook || [
                  "Exploit mechanical dealer dip-buying: sell out-of-the-money index puts or deploy short-volatility strategies.",
                  "Harvest the Volatility Risk Premium (VRP) across SPY pinned near major call walls.",
                  "Avoid purchasing expensive outright put protection; time decay will relentlessly erode long option premiums.",
                ]).map((step: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <ArrowRight className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#080e1b] p-3 rounded-lg border border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5 mb-1.5">
                <Eye className="h-3.5 w-3.5" />
                WHERE TO LOOK NEXT &bull; WHAT TO MONITOR
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {(signalMatrix.where_to_look_next || [
                  "Dealer Gamma Flip Level on SPY: ensure spot remains safely above gamma neutral threshold.",
                  "Days remaining until OpEx: begin de-risking as calendar approaches OpEx Friday.",
                  "Dispersion under the surface: index pinned while individual earnings stocks exhibit violent moves.",
                ]).map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-amber-400 font-mono font-bold shrink-0">#{idx + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* =====================================================================
            INSTITUTIONAL MACRO-TRADER VOLATILITY COCKPIT (THE 5 CORE BAROMETERS)
           ===================================================================== */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-4 md:p-5 space-y-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
                  Institutional Macro-Trader Synthesis
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                  5 Core Volatility &amp; Microstructure Barometers
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">
                Institutional Macro-Trader Framework Matrix (Regime Transmission &amp; Tail Risk)
              </h2>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Cross-Asset Signal Arbitrage &bull; Multi-Manager Positioning
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
            {/* Barometer 1: Dealer Gamma Modulator */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-slate-400 text-xs">
                  <MetricTip term="DEALER GAMMA">1. Dealer Gamma (GEX)</MetricTip>
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {m1?.net_gex_bn >= 0 ? "+" : ""}{m1?.net_gex_bn}B <span className="text-xs font-normal text-slate-400">/ 1%</span>
                </div>
                <div className={`mt-1.5 px-2 py-0.5 rounded border text-xs font-semibold inline-block ${m1?.net_gex_bn >= 0 ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" : "bg-rose-950/60 border-rose-500/40 text-rose-300"
                  }`}>
                  {m1?.net_gex_bn >= 0 ? "VOL CUSHION" : "VOL ACCELERATOR"}
                </div>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed pt-1 border-t border-slate-800/80">
                {m1?.net_gex_bn >= 0
                  ? "Dealers mechanically buy dips and sell rallies, dampening macro quad volatility."
                  : "Dealers are short gamma and must sell futures as market drops, accelerating air pockets."}
              </p>
            </div>

            {/* Barometer 2: Pod-Shop Dispersion */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-slate-400 text-xs">
                  <MetricTip term="DISPERSION">2. Pod-Shop Dispersion</MetricTip>
                </div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  {m2?.implied_sector_corr_pct}% <span className="text-xs font-normal text-slate-400">({m2?.corr_1y_percentile}th pct)</span>
                </div>
                <div className={`mt-1.5 px-2 py-0.5 rounded border text-xs font-semibold inline-block ${(m2?.corr_1y_percentile || 50) <= 18 ? "bg-rose-950/60 border-rose-500/40 text-rose-300" :
                    (m2?.corr_1y_percentile || 50) >= 82 ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" :
                      "bg-slate-800 border-slate-700 text-slate-300"
                  }`}>
                  {(m2?.corr_1y_percentile || 50) <= 18 ? "DE-GROSSING RISK" : (m2?.corr_1y_percentile || 50) >= 82 ? "WASHOUT RALLY" : "BALANCED DISPERSION"}
                </div>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed pt-1 border-t border-slate-800/80">
                11-Sector Sharpe dispersion is {m2?.sector_sharpe_dispersion}. Multi-manager funds are levered long/short.
              </p>
            </div>

            {/* Barometer 3: 3Fourteen Co-Signer */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-slate-400 text-xs">
                  <MetricTip term="MOVE INDEX">3. Volatility Co-Signer</MetricTip>
                </div>
                <div className="text-sm font-bold text-amber-300 mt-0.5">
                  MOVE {m3?.move_index} <span className="text-xs font-normal text-slate-400">vs VIX {m3?.vix_index}</span>
                </div>
                <div className={`mt-1.5 px-2 py-0.5 rounded border text-xs font-semibold inline-block ${statusBadgeStyle(m3?.signal_status)
                  }`}>
                  {m3?.signal_status === "ACTIONABLE_BULLISH" ? "BULLISH CO-SIGNER" :
                    m3?.signal_status === "ACTIONABLE_BEARISH" ? "RATE AIR-POCKET" : "CO-MOVING REGIME"}
                </div>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed pt-1 border-t border-slate-800/80">
                Z-spread: {m3?.move_minus_vix_z_spread >= 0 ? "+" : ""}{m3?.move_minus_vix_z_spread}σ. Subdued bond vol confirms equity dip buying.
              </p>
            </div>

            {/* Barometer 4: SKEW / VIX Tail Risk */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-slate-400 text-xs">
                  <MetricTip term="25D SKEW">4. SKEW / VIX Tail Crash</MetricTip>
                </div>
                <div className="text-sm font-bold text-rose-300 mt-0.5">
                  {m4?.skew_to_vix_ratio || 7.8}x <span className="text-xs font-normal text-slate-400">({m4?.skew_to_vix_percentile || 65}th pct)</span>
                </div>
                <div className={`mt-1.5 px-2 py-0.5 rounded border text-xs font-semibold inline-block ${(m4?.skew_to_vix_ratio || 0) >= 8.5 ? "bg-rose-950/60 border-rose-500/40 text-rose-300" :
                    (m4?.cboe_skew_index || 140) <= 125 ? "bg-amber-950/60 border-amber-500/40 text-amber-300" :
                      "bg-slate-800 border-slate-700 text-slate-300"
                  }`}>
                  {(m4?.skew_to_vix_ratio || 0) >= 8.5 ? "TAIL CRASH ASYMMETRY" : (m4?.cboe_skew_index || 140) <= 125 ? "COMPLACENT UNHEDGED" : "NORMAL TAIL SKEW"}
                </div>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed pt-1 border-t border-slate-800/80">
                CBOE SKEW: {m4?.cboe_skew_index}. Measures extreme OTM crash puts relative to ATM headline vol.
              </p>
            </div>

            {/* Barometer 5: Leveraged Inverse ETF Share */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-slate-400 text-xs">5. Inverse ETF Capitulation</div>
                <div className="text-sm font-bold text-emerald-300 mt-0.5">
                  {m5?.inverse_etf_vol_share_pct}% <span className="text-xs font-normal text-slate-400">Inverse Vol</span>
                </div>
                <div className={`mt-1.5 px-2 py-0.5 rounded border text-xs font-semibold inline-block ${(m5?.inverse_etf_vol_share_pct || 0) >= 48 ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" :
                    (m5?.inverse_etf_vol_share_pct || 0) <= 19 ? "bg-rose-950/60 border-rose-500/40 text-rose-300" :
                      "bg-slate-800 border-slate-700 text-slate-300"
                  }`}>
                  {(m5?.inverse_etf_vol_share_pct || 0) >= 48 ? "CAPITULATION WASHOUT" :
                    (m5?.inverse_etf_vol_share_pct || 0) <= 19 ? "LEVERAGED LONG EUPHORIA" : "NEUTRAL BAND"}
                </div>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed pt-1 border-t border-slate-800/80">
                Retail short ETF share (SQQQ+SOXS+SPXS). &gt;48% signals a washout; &lt;19% warns of retail euphoria.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================================
            MODULE 1: DEALER GAMMA EXPOSURE (GEX), VANNA/CHARM & KSPY COLLAR ROUTER
           ===================================================================== */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-4 md:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 uppercase">
                  Module 1 &bull; Live Option Chain Greeks (${m1?.ticker || selectedTicker})
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-mono text-slate-300">
                  Regime: {m1?.gamma_regime_classification || "POSITIVE_GAMMA_PIN"}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Dealer Net Gamma (<MetricTip term="DEALER GEX">GEX</MetricTip>),{" "}
                <MetricTip term="0DTE HEAT">0DTE Heat</MetricTip>,{" "}
                <MetricTip term="VANNA">Vanna</MetricTip>/<MetricTip term="CHARM">Charm</MetricTip> &amp; KSPY Collar Router
              </h2>
            </div>
            {m1 && (
              <span
                className={`px-3 py-1 rounded-full border text-xs font-mono font-semibold ${statusBadgeStyle(
                  m1.signal_status
                )}`}
              >
                {statusLabelText(m1.signal_status)}
              </span>
            )}
          </div>

          {m1 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">
                    Live Spot / <MetricTip term="GAMMA FLIP">Flip</MetricTip>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    ${m1.spot_price} /{" "}
                    <span className="text-amber-300">${m1.gamma_flip_price}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">
                    <MetricTip term="DEALER GEX">Net Dealer GEX</MetricTip>
                  </div>
                  <div
                    className={`text-sm font-bold mt-1 ${m1.net_gex_bn >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                  >
                    {m1.net_gex_bn >= 0 ? "+" : ""}
                    {m1.net_gex_bn}B / 1%
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">
                    <MetricTip term="PUT WALL">Put Wall</MetricTip> &rarr; <MetricTip term="CALL WALL">Call Wall</MetricTip>
                  </div>
                  <div className="text-sm font-bold text-cyan-300 mt-1">
                    ${m1.put_wall_strike} &rarr; ${m1.call_wall_strike}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Wall Corridor Pos</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {m1.wall_corridor_pos_pct}%
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">
                    <MetricTip term="0DTE HEAT">Near-Term 0DTE Heat</MetricTip>
                  </div>
                  <div className="text-sm font-bold text-amber-300 mt-1">
                    {m1.near_term_0dte_heat_pct}% of Vol
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">
                    <MetricTip term="VANNA">Vanna</MetricTip> / <MetricTip term="CHARM">Charm Flow</MetricTip>
                  </div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    ${m1.vanna_notional_mn}M / ${m1.charm_notional_mn}M
                  </div>
                </div>
              </div>

              {/* Strike GEX Ladder */}
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Option Strike</th>
                      <th className="py-2 px-3">Net Dealer GEX ($Bn / 1%)</th>
                      <th className="py-2 px-3">Microstructure Role</th>
                      <th className="py-2 px-3">Dynamic Overlay Regime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(m1.top_strike_Ladder || []).map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-white">${row.strike}</td>
                        <td
                          className={`py-2 px-3 font-semibold ${row.net_gex_bn >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                        >
                          {row.net_gex_bn >= 0 ? "+" : ""}
                          {row.net_gex_bn}B
                        </td>
                        <td className="py-2 px-3 text-cyan-300">{row.role}</td>
                        <td className="py-2 px-3 text-slate-300">{m1.kspy_overlay_regime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Critical Plain-English Verdict & Complement Box */}
              <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-4 space-y-2">
                <div className="text-xs font-bold text-white">
                  ► Plain-English Verdict ({m1.kspy_overlay_regime}):
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {m1.plain_english_verdict}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  <span className="text-cyan-300">
                    🔗 Model Complement: {m1.model_complement_and_next_step}
                  </span>
                  <Link
                    href={`/stock-analysis?ticker=${m1.ticker}`}
                    className="text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    &rarr; Open ${m1.ticker} Forensic Dossier
                  </Link>
                </div>
              </div>
            </>
          )}
        </section>

        {/* =====================================================================
            MODULE 2 & MODULE 3 SIDE BY SIDE
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MODULE 2: IMPLIED CORRELATION & 11-SECTOR SHARPE DISPERSION */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] p-4 md:p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase">
                    Module 2 &bull; 42 Macro Dispersion &amp; Pod-Shop Monitor
                  </span>
                  <h2 className="text-base font-bold text-white mt-0.5">
                    Implied/Realized Sector Correlation &amp;{" "}
                    <MetricTip term="DISPERSION">11-Sector Sharpe Dispersion</MetricTip>
                  </h2>
                </div>
                {m2 && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-xs font-mono font-semibold ${statusBadgeStyle(
                      m2.signal_status
                    )}`}
                  >
                    {statusLabelText(m2.signal_status)}
                  </span>
                )}
              </div>

              {m2 && (
                <>
                  <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">21D Sector Corr</div>
                      <div className="text-sm font-bold text-white mt-1">
                        {m2.implied_sector_corr_pct}%{" "}
                        <span className="text-xs text-slate-400">
                          ({m2.corr_1y_percentile}th pct)
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">
                        <MetricTip term="DISPERSION">Sharpe Dispersion</MetricTip>
                      </div>
                      <div className="text-sm font-bold text-cyan-300 mt-1">
                        {m2.sector_sharpe_dispersion}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">Top / Bottom 21D</div>
                      <div className="text-xs font-bold text-emerald-400 mt-1">
                        ${m2.top_sector_leader?.sector} ({m2.top_sector_leader?.sharpe_21d}) /{" "}
                        <span className="text-rose-400">
                          ${m2.bottom_sector_laggard?.sector} ({m2.bottom_sector_laggard?.sharpe_21d})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-1.5 px-3">Sector ETF</th>
                          <th className="py-1.5 px-3">21D Annualized Sharpe</th>
                          <th className="py-1.5 px-3">21D Return %</th>
                          <th className="py-1.5 px-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(m2.sector_rankings || []).map((s: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-1.5 px-3 font-bold text-white">${s.sector}</td>
                            <td
                              className={`py-1.5 px-3 ${s.sharpe_21d >= 0 ? "text-emerald-400" : "text-rose-400"
                                }`}
                            >
                              {s.sharpe_21d >= 0 ? "+" : ""}
                              {s.sharpe_21d}
                            </td>
                            <td className="py-1.5 px-3 text-slate-300">
                              {s.ret_21d_pct >= 0 ? "+" : ""}
                              {s.ret_21d_pct}%
                            </td>
                            <td className="py-1.5 px-3">
                              <Link
                                href={s.analysis_link || `/stock-analysis?ticker=${s.sector}`}
                                className="text-cyan-400 hover:text-cyan-300 text-xs"
                              >
                                Dossier &rarr;
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {m2 && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-white">► Plain-English Verdict:</div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {m2.plain_english_verdict}
                </p>
                <div className="text-xs font-mono text-cyan-300 pt-1 border-t border-slate-800">
                  🔗 Where to Look Next: {m2.model_complement_and_next_step}
                </div>
              </div>
            )}
          </section>

          {/* MODULE 3: CROSS-ASSET VOLATILITY CO-SIGNER (^MOVE vs ^VIX) */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] p-4 md:p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase">
                    Module 3 &bull; 3Fourteen Cross-Asset Volatility Co-Signer
                  </span>
                  <h2 className="text-base font-bold text-white mt-0.5">
                    Treasury Bond Vol (<MetricTip term="MOVE INDEX">^MOVE</MetricTip>) vs. Equity Vol (^VIX &amp; ^VVIX)
                  </h2>
                </div>
                {m3 && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-xs font-mono font-semibold ${statusBadgeStyle(
                      m3.signal_status
                    )}`}
                  >
                    {statusLabelText(m3.signal_status)}
                  </span>
                )}
              </div>

              {m3 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">
                        <MetricTip term="MOVE INDEX">^MOVE (Bond Vol)</MetricTip>
                      </div>
                      <div className="text-sm font-bold text-amber-300 mt-1">
                        {m3.move_index}{" "}
                        <span className="text-xs text-slate-400">
                          ({m3.move_1y_pct}th pct)
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">^VIX (Equity Vol)</div>
                      <div className="text-sm font-bold text-cyan-300 mt-1">
                        {m3.vix_index}{" "}
                        <span className="text-xs text-slate-400">
                          ({m3.vix_1y_pct}th pct)
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">MOVE - VIX Z-Diff</div>
                      <div className="text-sm font-bold text-white mt-1">
                        {m3.move_minus_vix_z_spread >= 0 ? "+" : ""}
                        {m3.move_minus_vix_z_spread}σ
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">VVIX / VIX Ratio</div>
                      <div className="text-sm font-bold text-emerald-300 mt-1">
                        {m3.vvix_to_vix_ratio}x
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs font-mono space-y-1.5">
                    <div className="text-slate-400">Active Co-Signer Regime State:</div>
                    <div className="text-amber-300 font-bold">{m3.cosigner_state}</div>
                    <div className="text-slate-400 text-xs font-sans leading-relaxed">
                      Rule: Equity scares (^VIX &gt; 55th pct) while Bond Vol stays calm (^MOVE &lt; 32nd pct) trigger a high-conviction equity buy. Rising ^MOVE (&gt;72nd pct) while ^VIX is low warns of an impending rate-led equity air-pocket.
                    </div>
                  </div>
                </>
              )}
            </div>

            {m3 && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-white">► Plain-English Verdict:</div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {m3.plain_english_verdict}
                </p>
                <div className="text-xs font-mono text-cyan-300 pt-1 border-t border-slate-800">
                  🔗 Where to Look Next: {m3.model_complement_and_next_step}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* =====================================================================
            MODULE 4 & MODULE 5 SIDE BY SIDE
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MODULE 4: VIX TERM-STRUCTURE (VIX9D / VIX / VIX3M), SKEW & VRP */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] p-4 md:p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase">
                    Module 4 &bull; Term Structure, SKEW/VIX Ratio &amp; VRP Carry
                  </span>
                  <h2 className="text-base font-bold text-white mt-0.5">
                    VIX Curve (^VIX9D / ^VIX / ^VIX3M), Tail Risk &amp;{" "}
                    <MetricTip term="VRP">VRP</MetricTip>
                  </h2>
                </div>
                {m4 && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-xs font-mono font-semibold ${statusBadgeStyle(
                      m4.signal_status
                    )}`}
                  >
                    {statusLabelText(m4.signal_status)}
                  </span>
                )}
              </div>

              {m4 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">9D / 30D / 3M VIX</div>
                      <div className="text-xs font-bold text-white mt-1">
                        {m4.vix9d} / {m4.vix_spot} / {m4.vix3m}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">
                        <MetricTip term="TERM STRUCTURE CONTANGO">VIX / VIX3M Ratio</MetricTip>
                      </div>
                      <div
                        className={`text-sm font-bold mt-1 ${m4.vix_to_vix3m_ratio >= 1.0 ? "text-rose-400" : "text-emerald-400"
                          }`}
                      >
                        {m4.vix_to_vix3m_ratio}x
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">
                        <MetricTip term="VRP">VRP (IV30 - RV21)</MetricTip>
                      </div>
                      <div className="text-sm font-bold text-cyan-300 mt-1">
                        {m4.vrp_spread_pts >= 0 ? "+" : ""}
                        {m4.vrp_spread_pts} pts
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">
                        <MetricTip term="25D SKEW">SKEW / VIX Ratio</MetricTip>
                      </div>
                      <div className="text-sm font-bold text-amber-300 mt-1">
                        {m4.skew_to_vix_ratio || 7.8}x
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                      <div className="text-slate-400">Term-Structure &amp; Carry State:</div>
                      <div className="text-cyan-300 font-bold mt-0.5">{m4.term_structure_state}</div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                      <div className="text-slate-400">
                        <MetricTip term="25D SKEW">CBOE SKEW &amp; 25Δ Skew:</MetricTip>
                      </div>
                      <div className="text-amber-300 font-bold mt-0.5">
                        SKEW: {m4.cboe_skew_index} &bull; 25Δ Put Skew: +{m4.skew_25d_pct}%
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {m4 && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-white">► Plain-English Verdict:</div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {m4.plain_english_verdict}
                </p>
                <div className="text-xs font-mono text-cyan-300 pt-1 border-t border-slate-800">
                  🔗 Where to Look Next: {m4.model_complement_and_next_step}
                </div>
              </div>
            )}
          </section>

          {/* MODULE 5: CROSS-ASSET OPTIONS FLOW & INVERSE-ETF CAPITULATION */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] p-4 md:p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase">
                    Module 5 &bull; Cross-Asset Options Sweeps &amp; 3Fourteen Capitulation
                  </span>
                  <h2 className="text-base font-bold text-white mt-0.5">
                    Speculative Inverse-ETF Volume Share &amp; Cross-Asset Put/Call Ratios
                  </h2>
                </div>
                {m5 && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-xs font-mono font-semibold ${statusBadgeStyle(
                      m5.signal_status
                    )}`}
                  >
                    {statusLabelText(m5.signal_status)}
                  </span>
                )}
              </div>

              {m5 && (
                <>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 font-mono text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        3Fourteen Inverse Leveraged ETF Share (SQQQ+SOXS+SPXS):
                      </span>
                      <span className="font-bold text-amber-300">
                        {m5.inverse_etf_vol_share_pct}% (Washout &gt; 48% | Euphoria &lt; 19%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${Math.min(100, m5.inverse_etf_vol_share_pct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-1.5 px-2.5">Ticker</th>
                          <th className="py-1.5 px-2.5">5D RVOL</th>
                          <th className="py-1.5 px-2.5">P/C Vol</th>
                          <th className="py-1.5 px-2.5">P/C OI</th>
                          <th className="py-1.5 px-2.5">Flow Regime</th>
                          <th className="py-1.5 px-2.5">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(m5.cross_asset_flow_table || []).map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-1.5 px-2.5 font-bold text-white">${r.ticker}</td>
                            <td className="py-1.5 px-2.5 text-slate-300">{r.rvol_5d_vs_21d}x</td>
                            <td className="py-1.5 px-2.5 text-cyan-300">{r.put_call_vol_ratio}x</td>
                            <td className="py-1.5 px-2.5 text-slate-300">{r.put_call_oi_ratio}x</td>
                            <td className="py-1.5 px-2.5 text-xs text-slate-200">
                              {r.flow_regime}
                            </td>
                            <td className="py-1.5 px-2.5">
                              <Link
                                href={r.analysis_link || `/stock-analysis?ticker=${r.ticker}`}
                                className="text-cyan-400 hover:text-cyan-300 text-xs"
                              >
                                Dossier &rarr;
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {m5 && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-white">► Plain-English Verdict:</div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {m5.plain_english_verdict}
                </p>
                <div className="text-xs font-mono text-cyan-300 pt-1 border-t border-slate-800">
                  🔗 Where to Look Next: {m5.model_complement_and_next_step}
                </div>
              </div>
            )}
          </section>

          {/* ============================================================================== */}
          {/* MODULE 6: QUANTCONNECT-STYLE VRP HARVESTING & MICROSTRUCTURE GAMMA SQUEEZES  */}
          {/* ============================================================================== */}
          <section className="rounded-xl border border-cyan-500/40 bg-[#111827] p-5 space-y-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Systematic Alpha • QuantConnect VRP Harvesting &amp; Hummingbot Gamma Squeezes
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">
                  Volatility Risk Premium (IV30 &minus; RV21) &amp; Dealer Short-Gamma Acceleration
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 max-w-3xl font-sans">
                  Harvests structural volatility overpricing where <MetricTip term="VRP" explanation="Volatility Risk Premium (IV30 - RV21): The structural spread between implied volatility and realized volatility. When VRP > 8.0%, options are overpriced and systematically favor options sellers.">VRP &gt; 8.0%</MetricTip> cross-referenced with 42 Macro VAMS trends, and flags high-velocity <MetricTip term="GAMMA FLIP" explanation="The inflection price where dealer aggregate positioning flips from positive gamma (stabilizing mean-reverting hedging) to negative gamma (forced pro-cyclical trend chasing).">Gamma Squeeze inflections</MetricTip>.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-700 text-cyan-300 font-semibold">
                  Overpriced Vol: {data?.vrp_and_gamma_suite?.overpriced_vol_count || 0}
                </span>
                <span className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-700 text-amber-300 font-semibold">
                  Gamma Alerts: {data?.vrp_and_gamma_suite?.gamma_squeeze_alerts_count || 0}
                </span>
              </div>
            </div>

            {/* PART A: DEALER GAMMA SQUEEZE DETECTOR */}
            {(data?.vrp_and_gamma_suite?.gamma_squeeze_alerts || []).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                  <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>DEALER SHORT-GAMMA SQUEEZE RADAR (0DTE ACCELERATION)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(data?.vrp_and_gamma_suite?.gamma_squeeze_alerts || []).map((alert: any) => {
                    const isActive = alert.status === "GAMMA_SQUEEZE_ACTIVE";
                    return (
                      <div
                        key={alert.ticker}
                        className={`rounded-xl border p-4 space-y-2.5 font-mono text-xs transition ${
                          isActive
                            ? "border-amber-500/60 bg-amber-950/20 shadow-lg shadow-amber-950/40"
                            : "border-slate-800 bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-bold text-white">${alert.ticker}</span>
                              <span className="text-slate-400 font-bold">${alert.spot_price}</span>
                            </div>
                            <span className="text-[10px] text-amber-300 font-semibold">
                              {alert.status.replace("_", " ")}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                            Window: {alert.catalyst_window}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded bg-black/40 border border-slate-800/80">
                          <div>
                            <span className="text-slate-500 text-[10px] block">Gamma Flip:</span>
                            <span className="font-bold text-cyan-300">${alert.gamma_flip_level}</span>
                            <span className="text-[10px] text-slate-400 block">({alert.distance_to_flip_pct >= 0 ? "+" : ""}{alert.distance_to_flip_pct}%)</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Call Wall Target:</span>
                            <span className="font-bold text-emerald-400">${alert.call_wall_target}</span>
                            <span className="text-[10px] text-slate-400 block">(+{alert.distance_to_call_wall_pct}%)</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-300 space-y-1">
                          <div className="text-amber-300 font-semibold">
                            ► 0DTE Heat: {(alert.zero_dte_heat_ratio * 100).toFixed(0)}% Volume Share
                          </div>
                          <p className="text-slate-200 text-xs font-sans leading-relaxed">
                            {alert.actionable_setup}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PART B: QUANTCONNECT VOLATILITY RISK PREMIUM (VRP) HARVESTING */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>SYSTEMATIC VRP HARVESTING CANDIDATES (IV30 &minus; RV21 &gt; 8.0%)</span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  Optimal: High PoP Credit Spreads
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(data?.vrp_and_gamma_suite?.vrp_harvesting_trades || []).slice(0, 9).map((vrp: any) => {
                  const isHighVrp = vrp.is_overpriced_vol;
                  return (
                    <div
                      key={vrp.ticker}
                      className={`rounded-xl border p-4 space-y-2.5 font-mono text-xs transition ${
                        isHighVrp
                          ? "border-emerald-500/50 bg-[#0C161D] shadow-md hover:border-emerald-400"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-bold text-white">${vrp.ticker}</span>
                            <span className="text-slate-400">${vrp.spot_price}</span>
                          </div>
                          <span className={`text-[10px] font-bold ${vrp.vams_state >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            VAMS: {vrp.vams_state >= 0 ? "BULLISH TREND" : "BEARISH TREND"} ({vrp.vams_score > 0 ? "+" : ""}{vrp.vams_score})
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isHighVrp
                              ? "bg-emerald-950 border-emerald-600 text-emerald-300"
                              : "bg-slate-800 border-slate-700 text-slate-400"
                          }`}
                        >
                          VRP: {vrp.vrp_spread_pts > 0 ? "+" : ""}{vrp.vrp_spread_pts} pts
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded bg-black/40 border border-slate-800/80">
                        <div>
                          <span className="text-slate-500 text-[10px] block">IV 30D:</span>
                          <span className="font-bold text-cyan-300">{vrp.iv_30d_pct}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">RV 21D:</span>
                          <span className="font-bold text-amber-300">{vrp.rv_21d_pct}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Put Wall Floor:</span>
                          <span className="font-semibold text-emerald-300">${vrp.put_wall}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Call Wall Cap:</span>
                          <span className="font-semibold text-rose-300">${vrp.call_wall}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="text-xs font-semibold text-emerald-400">
                          {vrp.strategy_title}
                        </div>
                        <p className="text-slate-300 text-xs font-sans leading-relaxed">
                          {vrp.actionable_direction}
                        </p>
                        <div className="text-[10px] text-cyan-300 font-mono">
                          PoP: {vrp.expected_win_rate}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
