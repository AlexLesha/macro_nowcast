"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  Zap,
  Filter,
  CheckCircle2,
  GitBranch,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Info,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { MetricTip } from "@/components/FinancialTooltip";
import { ReversalsDashboard } from "@/components/ReversalsDashboard";

type HorizonKey = "1_to_3_months" | "12_months" | "3_plus_years" | "reversals";

const SUBMENU_TITLES: Record<HorizonKey, string> = {
  "1_to_3_months": "1-3 months",
  "12_months": "12 months",
  "3_plus_years": "3+ Years",
  "reversals": "Reversals (T+3)",
};

function extractFirstTicker(displayTicker: string): string {
  if (!displayTicker) return "SPY";
  const first = displayTicker.split(/[\s\/\+,]+/)[0].trim().replace("$", "");
  return first || "SPY";
}

function TradeIdeasContent() {
  const searchParams = useSearchParams();
  const [horizon, setHorizon] = useState<HorizonKey>("1_to_3_months");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [themeFilter, setThemeFilter] = useState<string>("ALL");
  const [orderFilter, setOrderFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    const h = searchParams.get("horizon") || searchParams.get("tab");
    if (h === "reversals" || h === "1_to_3_months" || h === "12_months" || h === "3_plus_years") {
      setHorizon(h as HorizonKey);
    }
  }, [searchParams]);

  const fetchTradeIdeas = (force = false) => {
    setLoading(true);
    fetch(getApiUrl(`/api/v1/trade-ideas?force=${force}`), {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTradeIdeas(false);
    const handleGlobalRefresh = () => {
      fetchTradeIdeas(true);
    };
    window.addEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
    return () => window.removeEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
  }, []);

  const activeHorizonData = (horizon !== "reversals" ? data?.horizons?.[horizon] : null) || {
    label: SUBMENU_TITLES[horizon],
    subtitle:
      horizon === "reversals"
        ? "Daily Residual Shock Scanner (Residual < -2.25σ vs SPY & Sector ETF, IBS < 0.15, RVOL > 1.8x, T+3 Mean-Reversion Target)"
        : "Fetching live 5-year price series, Weekly/Monthly RSIs, and central macro regimes...",
    range_bar_label: "Range Position",
    priority_1_unloved_pivots: [],
    priority_2_trend_compounders: [],
    played_out_at_highs: [],
    all_ideas: [],
  };

  const macroContext = data?.macro_context || {
    active_regime: "REFLATION",
    probability_risk_on_pct: 72.0,
    net_liquidity_usd_bn: 5820.4,
    net_liquidity_4w_roc_bn: 42.5,
    net_liquidity_status: "EXPANSIONARY IMPULSE",
    opex_cycle_phase: "STRUCTURAL PIN",
    dealer_gamma_regime: "LONG GAMMA (Low Volatility Pin)",
    term_structure: "CONTANGO",
    move_index: 96.5,
    accord_2_watch: false,
  };

  // Distinct themes in active horizon
  const distinctThemes = useMemo(() => {
    const list = activeHorizonData.all_ideas || [];
    const themes = new Set<string>();
    list.forEach((item: any) => {
      if (item.theme) themes.add(item.theme);
    });
    return Array.from(themes);
  }, [activeHorizonData]);

  // Filter helper
  const filterPredicate = (idea: any) => {
    if (themeFilter !== "ALL" && idea.theme !== themeFilter) return false;
    if (orderFilter !== "ALL" && !idea.order?.includes(orderFilter)) return false;
    if (statusFilter === "PIVOT" && idea.bucket !== "priority_1_unloved_pivots") return false;
    if (statusFilter === "COMPOUNDER" && idea.bucket !== "priority_2_trend_compounders") return false;
    if (statusFilter === "HIGHS" && idea.bucket !== "played_out_at_highs") return false;
    return true;
  };

  const p1Ideas = (activeHorizonData.priority_1_unloved_pivots || []).filter(filterPredicate);
  const p2Ideas = (activeHorizonData.priority_2_trend_compounders || []).filter(filterPredicate);
  const playedOutIdeas = (activeHorizonData.played_out_at_highs || []).filter(filterPredicate);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* HEADER & CENTRAL MACRO REGIME CONTEXT RIBBON */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Unified Trade Ideas &amp; Capital Flow Synthesis
                </span>
                {data?.as_of_utc && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                    ● Synced: {data.as_of_utc}
                  </span>
                )}
                {data?.live_gold_oil_ratio && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
                    <MetricTip term="GOLD/OIL RATIO" explanation="Gold-to-Oil Ratio: measures relative valuation between monetary gold and crude oil. Above 35x indicates energy is historically cheap relative to monetary debasement.">
                      Gold/Oil: {data.live_gold_oil_ratio}x
                    </MetricTip>
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white mt-1">
                Trade Ideas
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl">
                Cross-framework institutional trade ideas synthesizing <strong>1-3 Month Tactical Pivots</strong>,{" "}
                <strong>12-Month Cyclical Compounders</strong>, <strong>3+ Year Secular Supercycles</strong>, and{" "}
                <strong>T+3 Microstructural Reversals</strong> with explicit <em>&quot;Why this trade&quot;</em>,{" "}
                <em>Actionable Directions</em>, and <em>Invalidation Stops</em>.
              </p>
            </div>

            {/* TIME HORIZON TABS & RECALCULATE LIVE */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {(["1_to_3_months", "12_months", "3_plus_years", "reversals"] as HorizonKey[]).map((hKey) => (
                <button
                  key={hKey}
                  id={`trade-ideas-tab-${hKey}`}
                  onClick={() => {
                    setHorizon(hKey);
                    setThemeFilter("ALL");
                  }}
                  className={`px-3.5 py-2 rounded-lg border font-semibold transition flex items-center gap-1.5 ${
                    horizon === hKey
                      ? hKey === "reversals"
                        ? "bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-900/40"
                        : "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/40"
                      : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {hKey === "reversals" && <Zap className="w-3.5 h-3.5 text-amber-300" />}
                  <span>{SUBMENU_TITLES[hKey]}</span>
                  {hKey === "reversals" && (data?.reversals?.candidates?.length || 0) > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono">
                      {data.reversals.candidates.length}
                    </span>
                  )}
                </button>
              ))}

              {/* Dedicated Sub-Page Link Next to Timeframes */}
              <Link
                href="/trade-ideas/reversals"
                id="reversals-subpage-link"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-500/70 transition font-mono text-xs font-semibold"
                title="Open full dedicated Reversals workstation in isolated sub-page"
              >
                <span>Sub-Page</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              </Link>

              <button
                id="recalculate-live-trade-ideas"
                onClick={() => fetchTradeIdeas(true)}
                disabled={loading}
                className="px-3.5 py-2 rounded-lg border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 transition disabled:opacity-50 flex items-center gap-1.5 font-bold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Scanning..." : "↻ Recalculate Live"}
              </button>
            </div>
          </div>

          {/* PROJECT-GLOBAL MACRO REGIME RIBBON */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-mono text-slate-400">
                <MetricTip term="QUAD REGIME" explanation="Active macroeconomic regime determining asset allocation factor tilts (Quad 1: Goldilocks, Quad 2: Reflation, Quad 3: Stagflation, Quad 4: Deflation).">
                  Macro Regime
                </MetricTip>
              </div>
              <div className="text-xs font-bold font-mono text-cyan-300 truncate">
                {macroContext.active_regime}
              </div>
              <div className="text-[10px] text-slate-500">
                Risk-On: {macroContext.probability_risk_on_pct}%
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-mono text-slate-400">
                <MetricTip term="US NET LIQUIDITY" explanation="Fed Assets minus Treasury General Account (TGA) minus Overnight Reverse Repo (ON RRP). Primary monetary engine powering financial asset price multiples.">
                  US Net Liquidity
                </MetricTip>
              </div>
              <div className="text-xs font-bold font-mono text-emerald-400 truncate">
                ${macroContext.net_liquidity_usd_bn}B
              </div>
              <div className={`text-[10px] font-mono ${macroContext.net_liquidity_4w_roc_bn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                4W: {macroContext.net_liquidity_4w_roc_bn >= 0 ? "+" : ""}{macroContext.net_liquidity_4w_roc_bn}B
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-mono text-slate-400">
                <MetricTip term="OPEX CYCLE" explanation="Cem Karsan structural options calendar: Pre-OpEx 'Structural Pin' (Vanna/Charm suppress volatility) vs Post-OpEx 'Window of Weakness'.">
                  OpEx Phase
                </MetricTip>
              </div>
              <div className="text-xs font-bold font-mono text-amber-300 truncate">
                {macroContext.opex_cycle_phase}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {macroContext.term_structure}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-mono text-slate-400">
                <MetricTip term="DEALER GEX" explanation="Net dealer gamma posture: Positive GEX dampens market swings (mean-reversion pin), negative GEX amplifies trending runs and volatility spikes.">
                  Dealer Gamma
                </MetricTip>
              </div>
              <div className="text-xs font-bold font-mono text-purple-300 truncate" title={macroContext.dealer_gamma_regime}>
                {macroContext.dealer_gamma_regime.split("(")[0].trim()}
              </div>
              <div className="text-[10px] text-slate-500">
                Market Structure
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-mono text-slate-400">
                <MetricTip term="MOVE INDEX" explanation="ICE BofA MOVE Index: Implied volatility of US Treasury bonds. Readings over 115 signal sovereign bond market stress and liquidity indigestion.">
                  MOVE Index
                </MetricTip>
              </div>
              <div className="text-xs font-bold font-mono text-blue-300">
                {macroContext.move_index}
              </div>
              <div className="text-[10px] text-slate-500">
                Rates Volatility
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-mono text-slate-400">
                <MetricTip term="ACCORD 2.0" explanation="Fed-Treasury yield capping regime triggered by high public debt to liquidity. Favors hard assets, gold, and energy royalties over long-duration nominal bonds.">
                  Accord 2.0 Watch
                </MetricTip>
              </div>
              <div className={`text-xs font-bold font-mono ${macroContext.accord_2_watch ? "text-amber-400" : "text-emerald-400"}`}>
                {macroContext.accord_2_watch ? "ACTIVE ALERT" : "MONITORING"}
              </div>
              <div className="text-[10px] text-slate-500">
                Fiscal Dominance
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-300">
            <strong>{SUBMENU_TITLES[horizon]} Quantitative Gate:</strong> {activeHorizonData.subtitle}
          </div>
        </section>

        {/* CONDITIONAL RENDER: REVERSALS DASHBOARD VS THEMATIC TIME HORIZONS */}
        {horizon === "reversals" ? (
          <section className="pt-1">
            <ReversalsDashboard isSubPage={false} initialData={data?.reversals || null} />
          </section>
        ) : (
          <>
            {/* CROSS-LINK REVERSALS RADAR BANNER (ON THEMATIC HORIZONS) */}
            {data?.reversals?.candidates?.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>
                    <strong>T+3 Reversals Radar Active:</strong>{" "}
                    <span className="text-white font-bold">{data.reversals.candidates.length} candidates</span> flagged with idiosyncratic residual shock (&epsilon; &lt; -2.25&sigma;, IBS &lt; 0.15).
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHorizon("reversals")}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                  >
                    View Reversals Tab →
                  </button>
                  <Link
                    href="/trade-ideas/reversals"
                    className="px-2.5 py-1 rounded border border-emerald-500/50 hover:bg-emerald-900/40 text-emerald-300 transition flex items-center gap-1"
                  >
                    Dedicated Sub-Page ↗
                  </Link>
                </div>
              </div>
            )}

            {/* INTERACTIVE FILTERS BAR */}
            <section className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800 bg-[#111827]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filters:
                </span>

                {/* Theme Filter */}
                <select
                  value={themeFilter}
                  onChange={(e) => setThemeFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Themes ({activeHorizonData.all_ideas?.length || 0})</option>
                  {distinctThemes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Order Filter */}
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Orders (1st, 2nd, 3rd)</option>
                  <option value="1st Order">1st Order (Direct Beneficiaries)</option>
                  <option value="2nd Order">2nd Order (Infrastructure &amp; Enablers)</option>
                  <option value="3rd Order">3rd Order (Policy, Wealth &amp; Power)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Conviction Tiers</option>
                  <option value="PIVOT">Priority 1 — Unloved Pivots</option>
                  <option value="COMPOUNDER">Priority 2 — Trend Compounders</option>
                  <option value="HIGHS">Caution — Played Out at Highs</option>
                </select>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Showing <span className="text-cyan-300 font-bold">{p1Ideas.length + p2Ideas.length + playedOutIdeas.length}</span> ideas in {SUBMENU_TITLES[horizon]}
              </div>
            </section>

            {/* ================================================================== */}
            {/* BUCKET 1: PRIORITY 1 — VERIFIED LOW-BASE / PULLBACK PIVOTS        */}
            {/* ================================================================== */}
            <section className="rounded-xl border border-emerald-500/40 bg-[#111827] p-5 space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    🥇 Priority 1 — Verified Low-Base / Pullback Pivots
                  </span>
                  <h2 className="text-base font-bold text-white mt-1.5">
                    Unloved Bottoming Pivots &amp; Coiled Springs ({SUBMENU_TITLES[horizon]})
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {horizon === "1_to_3_months"
                    ? "Tactical Gate: 52W Range <= 48% | RSI <= 46 | Near 15D Probable Low"
                    : horizon === "12_months"
                    ? "Cyclical Gate: 2Y Range <= 52% | 14W RSI <= 48 | Near 200D SMA"
                    : "Secular Gate: 5Y Relative Ratio vs SPY <= 52nd Pct | 14M RSI <= 50"}
                </span>
              </div>

              {p1Ideas.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs font-mono text-slate-400">
                  {loading
                    ? "Computing live horizon metrics from Yahoo Finance & database..."
                    : "No tracked candidates in this horizon currently sit in a verified low-base/pullback zone with active filters."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {p1Ideas.map((idea: any) => {
                    const firstTk = extractFirstTicker(idea.ticker);
                    return (
                      <div
                        key={idea.ticker}
                        className="rounded-xl border border-emerald-500/30 bg-slate-900/70 p-4 space-y-3 flex flex-col justify-between hover:border-emerald-500/60 transition shadow-md"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/stock-analysis?ticker=${firstTk}`}
                                  className="text-base font-bold text-white hover:text-emerald-400 transition font-mono flex items-center gap-1"
                                >
                                  <span>{idea.ticker}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400" />
                                </Link>
                                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                                  Score: {idea.outlier_score}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 font-medium">
                                {idea.name}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-700">
                              {idea.theme}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono p-2 rounded bg-black/40 border border-slate-800/80">
                            <span className="text-white font-bold">
                              ${idea.live_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className="text-emerald-400 font-semibold">
                              Range: {idea.range_bar_pct}%
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className="text-amber-300">
                              {idea.rsi_label}: {idea.rsi}
                            </span>
                            {idea.relative_vs_spy_percentile !== null && (
                              <>
                                <span className="text-slate-400">|</span>
                                <span className="text-cyan-300">
                                  vs SPY: {idea.relative_vs_spy_percentile}th %ile
                                </span>
                              </>
                            )}
                          </div>

                          {idea.prob_low && idea.prob_high && (
                            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between px-1">
                              <span>Low: ${idea.prob_low}</span>
                              <span className="text-slate-500">Probable Range</span>
                              <span>High: ${idea.prob_high}</span>
                            </div>
                          )}

                          <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            {idea.why_this_trade}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                            <span>► Actionable:</span>
                            <span className="text-slate-200">{idea.actionable_direction}</span>
                          </div>
                          <div className="text-xs font-mono text-rose-300/90 flex items-center gap-1">
                            <span>■ Stop / Invalidation:</span>
                            <span className="text-slate-300">{idea.invalidation_stop}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ================================================================== */}
            {/* BUCKET 2: PRIORITY 2 — VERIFIED TRENDING COMPOUNDERS               */}
            {/* ================================================================== */}
            <section className="rounded-xl border border-blue-500/40 bg-[#111827] p-5 space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                    🥈 Priority 2 — Verified Trend Compounders
                  </span>
                  <h2 className="text-base font-bold text-white mt-1.5">
                    Structural Trend Accumulations &amp; Pullback Entries ({SUBMENU_TITLES[horizon]})
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {horizon === "1_to_3_months"
                    ? "Tactical Trend Gate: Range 48% - 75% | RSI 46 - 65 | Bullish VAMS"
                    : horizon === "12_months"
                    ? "Cyclical Trend Gate: 2Y Range 52% - 78% | RSI 48 - 65 | Above 200D SMA"
                    : "Secular Trend Gate: 5Y Relative Ratio 52nd - 80th Pct | Above 20M SMA"}
                </span>
              </div>

              {p2Ideas.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs font-mono text-slate-400">
                  {loading
                    ? "Computing live horizon metrics from Yahoo Finance & database..."
                    : "No tracked candidates currently qualify for Priority 2 with active filters."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {p2Ideas.map((idea: any) => {
                    const firstTk = extractFirstTicker(idea.ticker);
                    return (
                      <div
                        key={idea.ticker}
                        className="rounded-xl border border-blue-500/30 bg-slate-900/70 p-4 space-y-3 flex flex-col justify-between hover:border-blue-500/60 transition shadow-md"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/stock-analysis?ticker=${firstTk}`}
                                  className="text-base font-bold text-white hover:text-blue-400 transition font-mono flex items-center gap-1"
                                >
                                  <span>{idea.ticker}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400" />
                                </Link>
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                                  Score: {idea.outlier_score}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 font-medium">
                                {idea.name}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-700">
                              {idea.theme}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono p-2 rounded bg-black/40 border border-slate-800/80">
                            <span className="text-white font-bold">
                              ${idea.live_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className="text-blue-400 font-semibold">
                              Range: {idea.range_bar_pct}%
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className="text-amber-300">
                              {idea.rsi_label}: {idea.rsi}
                            </span>
                            {idea.relative_vs_spy_percentile !== null && (
                              <>
                                <span className="text-slate-400">|</span>
                                <span className="text-cyan-300">
                                  vs SPY: {idea.relative_vs_spy_percentile}th %ile
                                </span>
                              </>
                            )}
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            {idea.why_this_trade}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                          <div className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                            <span>► Actionable:</span>
                            <span className="text-slate-200">{idea.actionable_direction}</span>
                          </div>
                          <div className="text-xs font-mono text-rose-300/90 flex items-center gap-1">
                            <span>■ Stop / Invalidation:</span>
                            <span className="text-slate-300">{idea.invalidation_stop}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ================================================================== */}
            {/* BUCKET 3: CAUTION — EXTENDED / PLAYED OUT AT HIGHS                */}
            {/* ================================================================== */}
            {playedOutIdeas.length > 0 && (
              <section className="rounded-xl border border-rose-500/30 bg-[#111827] p-5 space-y-4 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1 w-fit">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Caution — Structurally Extended at Highs
                    </span>
                    <h2 className="text-base font-bold text-white mt-1.5">
                      Crowded or Extended Trades (Do NOT Chase at Resistance)
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Range &gt; 78% | Overbought RSI | Near Upper Risk Boundary
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playedOutIdeas.map((idea: any) => {
                    const firstTk = extractFirstTicker(idea.ticker);
                    return (
                      <div
                        key={idea.ticker}
                        className="rounded-xl border border-rose-900/40 bg-slate-900/40 p-4 space-y-3 flex flex-col justify-between opacity-85 hover:opacity-100 transition shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/stock-analysis?ticker=${firstTk}`}
                                  className="text-base font-bold text-white hover:text-rose-400 transition font-mono flex items-center gap-1"
                                >
                                  <span>{idea.ticker}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 hover:text-rose-400" />
                                </Link>
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                  {idea.theme}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                {idea.name}
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded bg-rose-950 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold">
                              Caution Tier
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs font-mono p-2 rounded bg-black/40 border border-slate-800/80">
                            <span className="text-white font-bold">
                              ${idea.live_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className="text-rose-400 font-semibold">
                              Range: {idea.range_bar_pct}%
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className="text-amber-300">
                              {idea.rsi_label}: {idea.rsi}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            {idea.why_this_trade}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-1">
                          <div className="text-xs font-semibold text-rose-300">
                            ► Tactical Guidance: Do NOT chase new long exposure here. Await consolidation toward ${idea.prob_low || "support"} before accumulating.
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            Invalidation / Exit: Tight trailing stop at ${idea.prob_low || "recent support"}.
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default function TradeIdeasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090D16] text-slate-100 flex items-center justify-center font-mono text-sm">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Loading Trade Ideas &amp; Reversals Engine...</span>
          </div>
        </div>
      }
    >
      <TradeIdeasContent />
    </Suspense>
  );
}
