"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  Scale,
  Sparkles,
  Activity,
  Globe,
  Building2,
  DollarSign,
  Landmark,
  FileText,
  Info,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Eye,
  AlertOctagon,
  Flame,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { MetricTip } from "@/components/FinancialTooltip";

export default function ScenariosPlaybookPage() {
  const [activeTab, setActiveTab] = useState<"scenarios" | "crash-windows" | "central-banks" | "real-rates">("scenarios");
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [scenariosData, setScenariosData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = (force: boolean = false) => {
    if (force) setRefreshing(true);
    fetch(getApiUrl(`/api/v1/scenarios${force ? "?force=true" : ""}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setScenariosData(data);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error("Error loading live scenarios:", err);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();

    const handleGlobalRefresh = () => {
      loadData(true);
    };
    window.addEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
    return () => window.removeEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
  }, []);

  const scenariosList = scenariosData?.scenarios || [];
  const activeQ = scenariosList[selectedIdx] || scenariosList[0] || {};
  const scorecards = scenariosData?.scorecards || {};
  const triggersList = scenariosData?.trigger_telemetry?.triggers_list || [];
  const cbSentiment = scenariosData?.central_bank_sentiment || {};
  const realRates = scenariosData?.real_interest_rates || {};
  const crashWindows = scenariosData?.forward_crash_windows || [];
  const hydraulicScenarios = scenariosData?.hydraulic_policy_scenarios || [];
  const actionableVerdict = scenariosData?.actionable_verdict || {};

  const activeRegimeId = actionableVerdict.active_regime_id || 1;
  const regimeBadgeColor =
    activeRegimeId === 3
      ? "bg-rose-950/80 text-rose-300 border-rose-700"
      : activeRegimeId === 2
        ? "bg-amber-950/80 text-amber-300 border-amber-700"
        : "bg-emerald-950/80 text-emerald-300 border-emerald-700";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold mb-1">
          <Compass className="h-4 w-4" />
          <span>Forward Macro Scenarios, Crash Windows &amp; Systematic Policy Playbook</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            As of: <strong className="text-cyan-400">{scenariosData?.as_of_utc ? new Date(scenariosData.as_of_utc).toLocaleDateString() : "Live Stream"}</strong>
          </span>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
            <span>{refreshing ? "Recalculating..." : "Force Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIONABLE MACRO VERDICT BANNER (CEM KARSAN / NOEL SMITH) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0a1224] via-[#0f1b33] to-[#0c1527] border border-cyan-800/60 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-700/60 pb-3 mb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                ACTIONABLE DERIVATIVES &amp; HYDRAULIC VERDICT
              </span>
              <h2 className="text-base sm:text-lg font-black text-white font-mono">
                {actionableVerdict.active_regime_name || "REGIME 1: THE STRUCTURAL PIN (BULLISH / RANGEBOUND)"}
              </h2>
            </div>
          </div>
          <span className={`text-xs font-mono px-3 py-1 rounded border font-black uppercase tracking-wider ${regimeBadgeColor}`}>
            {actionableVerdict.badge_label || "STRUCTURAL DAM ACTIVE"}
          </span>
        </div>

        {/* Executive Verdict Plain English */}
        <div className="bg-[#080e1b]/90 border border-cyan-900/40 rounded-lg p-3.5 mb-4">
          <div className="text-xs font-mono text-cyan-300 font-bold uppercase mb-1 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            PLAIN ENGLISH ACTIONABLE VERDICT &amp; HEDGE SETUP
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {actionableVerdict.executive_verdict ||
              "Mechanical dealer hedging (Vanna and Charm decay) acts as a structural dam, absorbing macroeconomic selling. Override headline bearish macro noise; buy dips and monetize high implied volatility."}
          </p>
        </div>

        {/* Trading Playbook & Where to Look Next */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0b1526]/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              SYSTEMATIC TRADING PLAYBOOK
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(actionableVerdict.trading_playbook || [
                "Exploit mechanical dealer dip-buying: sell out-of-the-money index puts or deploy short-volatility / put-write strategies.",
                "Maintain core long exposure in high-beta tech, semiconductors, and cyclicals favored by liquidity flow.",
                "Harvest the Volatility Risk Premium (VRP) across SPY and single stocks pinned near major call walls.",
                "Avoid purchasing expensive outright put protection; time decay will relentlessly erode long option premiums.",
              ]).map((step: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5 leading-snug">
                  <ArrowRight className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#0b1526]/80 p-3.5 rounded-lg border border-slate-800">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5 mb-2">
              <Eye className="h-3.5 w-3.5" />
              WHERE TO LOOK NEXT &bull; WHAT TO MONITOR
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(actionableVerdict.where_to_look_next || [
                "Dealer Gamma Flip Level on SPY: ensure spot remains safely above gamma neutral threshold.",
                "Days remaining until OpEx: begin de-risking as calendar approaches OpEx Friday.",
                "Dispersion under the surface: index pinned while individual earnings stocks exhibit violent idiosyncratic moves.",
                "Foreign central bank gold accumulation and US Treasury auction foreign allotment metrics.",
              ]).map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-amber-400 font-mono font-bold shrink-0">#{idx + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* DYNAMIC SCORECARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Central Bank Net Balance */}
        <div className="p-3.5 rounded-xl bg-[#0c121e] border border-cyan-500/30 flex flex-col justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Central Bank Balance</span>
          <div className="text-base font-mono font-bold text-cyan-400 mt-1">
            {scorecards.central_bank_net_balance !== undefined ? `${scorecards.central_bank_net_balance > 0 ? "+" : ""}${scorecards.central_bank_net_balance}` : "-2.4"}
          </div>
          <span className="text-xs font-mono text-slate-300 mt-1 truncate">
            {scorecards.central_bank_net_label || "Divergent Asymmetric"}
          </span>
        </div>

        {/* Card 2: US 10Y Real Rate & r - g */}
        <div className="p-3.5 rounded-xl bg-[#0c121e] border border-emerald-500/30 flex flex-col justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            10Y Real Rate (<MetricTip term="DFII10">TIPS</MetricTip>)
          </span>
          <div className="text-base font-mono font-bold text-emerald-400 mt-1">
            {scorecards.us_10y_real_rate_pct !== undefined ? `${scorecards.us_10y_real_rate_pct}%` : "2.05%"}
          </div>
          <span className="text-xs font-mono text-slate-300 mt-1">
            <MetricTip term="r - g">r &minus; g Spread</MetricTip>:{" "}
            <strong className={scorecards.us_r_minus_g_spread > 0 ? "text-amber-400" : "text-emerald-400"}>
              {scorecards.us_r_minus_g_spread !== undefined ? `${scorecards.us_r_minus_g_spread > 0 ? "+" : ""}${scorecards.us_r_minus_g_spread}%` : "+0.50%"}
            </strong>
          </span>
        </div>

        {/* Card 3: China Liquidity Stance */}
        <div className="p-3.5 rounded-xl bg-[#0c121e] border border-indigo-500/30 flex flex-col justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">China Liquidity Provider</span>
          <div className="text-base font-mono font-bold text-indigo-400 mt-1">Targeted Floor</div>
          <span className="text-xs font-mono text-slate-300 mt-1 truncate">No 2008 Bazooka Stimulus</span>
        </div>

        {/* Card 4: US Debt Interest Outlays */}
        <div className="p-3.5 rounded-xl bg-[#0c121e] border border-amber-500/30 flex flex-col justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Net Interest Expense</span>
          <div className="text-base font-mono font-bold text-amber-400 mt-1">
            ${scorecards.annual_debt_interest_usd_tn || "1.18"}T / Year
          </div>
          <span className="text-xs font-mono text-slate-300 mt-1">
            {scorecards.interest_to_gdp_pct || "3.92"}% of US GDP
          </span>
        </div>

        {/* Card 5: Trigger Barometer */}
        <div className="p-3.5 rounded-xl bg-[#0c121e] border border-rose-500/30 col-span-2 md:col-span-1 flex flex-col justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Systemic Triggers Status</span>
          <div className="text-base font-mono font-bold text-rose-400 mt-1">
            {scorecards.active_triggers_count || 2} of {scorecards.total_triggers_count || 7} Watch/Alert
          </div>
          <span className="text-xs font-mono text-amber-400 mt-1 truncate">
            {scorecards.trigger_overall_status || "Active Monitoring"}
          </span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("scenarios")}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 ${activeTab === "scenarios"
              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/50"
              : "bg-[#0c121e] text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
        >
          <Compass className="h-4 w-4" />
          <span>Forward Macro Scenarios &amp; Policy Playbook</span>
        </button>

        <button
          onClick={() => setActiveTab("crash-windows")}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 ${activeTab === "crash-windows"
              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/50"
              : "bg-[#0c121e] text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
        >
          <Calendar className="h-4 w-4 text-amber-400" />
          <span>Forward Crash Windows &amp; Fragility Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab("central-banks")}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 ${activeTab === "central-banks"
              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/50"
              : "bg-[#0c121e] text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
        >
          <Landmark className="h-4 w-4" />
          <span>Central Bank Speeches &amp; Monetary Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab("real-rates")}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 ${activeTab === "real-rates"
              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/50"
              : "bg-[#0c121e] text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
        >
          <Scale className="h-4 w-4" />
          <span>Real Interest Rates &amp; Sovereign Debt Squeeze</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FORWARD MACRO SCENARIOS */}
      {/* ========================================================================= */}
      {activeTab === "scenarios" && (
        <div className="space-y-6">
          {/* Quarter Selector Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {scenariosList.map((item: any, idx: number) => {
              const isSelected = selectedIdx === idx;
              const isWarning = item.trigger_status?.includes("WARNING") || item.trigger_status?.includes("ACTIVE");

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`p-3.5 rounded-xl border text-left font-mono transition shadow-md flex flex-col justify-between space-y-2 ${isSelected
                      ? "bg-gradient-to-br from-cyan-950/60 to-slate-900 border-cyan-500/50 shadow-cyan-950/40"
                      : "bg-[#0c121e] border-slate-800 hover:border-slate-700 text-slate-400"
                    }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${isSelected ? "text-cyan-400" : "text-slate-300"}`}>
                      {item.quarter}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase border ${isWarning
                          ? "bg-amber-950/80 text-amber-300 border-amber-800"
                          : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                        }`}
                    >
                      {item.trigger_status?.split("(")[0].trim() || "NORMAL"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium line-clamp-1">{item.headline}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    Base: {item.baseProb} &bull; Alt: {item.altProb}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ACTIVE QUARTER SCENARIO DETAILS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Base Case (60%) */}
            <div className="lg:col-span-8 p-5 rounded-2xl bg-[#0c121e] border border-cyan-500/30 shadow-2xl space-y-5">
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                      BASE SCENARIO ({activeQ.baseProb || "60%"} PROBABILITY)
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{activeQ.quarter}</span>
                  </div>
                  <h2 className="text-base font-mono font-bold text-slate-100 mt-2">
                    {activeQ.scenario_name || activeQ.baseScenario?.title}
                  </h2>
                </div>
              </div>

              {/* Quantitative Trigger Telemetry Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-indigo-950/40 border border-cyan-500/40 space-y-2 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span>Live Quantitative Trigger Telemetry</span>
                  </span>
                  <span className="text-xs text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800">
                    {activeQ.trigger_status}
                  </span>
                </div>
                <div className="text-xs text-slate-200 font-sans leading-relaxed">
                  {activeQ.live_trigger_telemetry}
                </div>
              </div>

              {/* Asset Matrix */}
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  Systematic Asset Allocation &bull; Directional Vector
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(activeQ.baseScenario?.assetMatrix || []).map((a: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[#080d16] border border-slate-800 font-mono text-xs">
                      <span className="text-slate-400 block text-[11px] truncate">{a.asset}</span>
                      <span className={`font-bold block mt-0.5 ${a.color || "text-slate-200"}`}>{a.direction}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policy & Market Result */}
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs font-sans text-slate-300 leading-relaxed">
                <span className="font-bold font-mono text-cyan-400 block mb-1 uppercase tracking-wider text-[11px]">
                  Macro Transmission &bull; Policy Response
                </span>
                {activeQ.policy_and_market_result}
              </div>

              {/* Scenario Triggers Checklist */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  Trigger Validation Rules (Requires 2+ to validate)
                </span>
                <div className="space-y-1 text-xs font-mono text-slate-300">
                  {(activeQ.baseScenario?.triggers || []).map((trig: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-1.5 rounded bg-slate-900/30">
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{trig}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Alternative Case (40%) */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0c121e] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    ALT SCENARIO ({activeQ.altProb || "40%"})
                  </span>
                </div>
                <h3 className="text-sm font-mono font-bold text-slate-200 mb-2">
                  {activeQ.altScenario?.title}
                </h3>
                <p className="text-xs font-sans text-slate-400 leading-relaxed mb-4">
                  {activeQ.altScenario?.description}
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1 uppercase text-[11px]">
                      Asset Reaction Vector
                    </span>
                    <p className="text-slate-300 font-sans text-xs">{activeQ.altScenario?.assetDirection}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-1 uppercase text-[11px]">
                      Policy Reaction Function
                    </span>
                    <p className="text-slate-300 font-sans text-xs">{activeQ.altScenario?.policyResponse}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-xs font-mono text-slate-500">
                Quarter: {activeQ.quarter} &bull; Model Status: Active Rolling
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FORWARD CRASH WINDOWS & HYDRAULIC FRAGILITY MATRIX */}
      {/* ========================================================================= */}
      {activeTab === "crash-windows" && (
        <div className="space-y-6">
          {/* Header Explanation */}
          <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase font-bold mb-2">
              <Calendar className="h-4 w-4" />
              <span>Cem Karsan / Noel Smith Temporal Collision Windows</span>
            </div>
            <h2 className="text-base font-bold font-mono text-white mb-2">
              Forward 12-Month Crash Window Calendar: OpEx Cycles vs. Treasury Liquidity Drains
            </h2>
            <p className="text-xs font-sans text-slate-300 leading-relaxed max-w-4xl">
              Treasury liquidity dictates the <strong className="text-cyan-300">magnitude</strong> of market moves, but the options market valve system dictates the <strong className="text-cyan-300">timing</strong>. In the weeks prior to monthly OpEx (3rd Friday), mechanical dealer Vanna and Charm flows act as a structural dam, propping up indices and suppressing volatility. Once contracts expire, the market enters the 10-day <MetricTip term="WINDOW OF WEAKNESS">Post-OpEx Window of Weakness</MetricTip>. If an acute Treasury cash drain (such as the mid-April $300B tax collection, June quarterly refunding, or post-debt ceiling refill) collides with this window, systemic shock absorbers are zero and markets are acutely vulnerable to cascading drawdowns.
            </p>
          </div>

          {/* 12-Month Crash Windows Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {crashWindows.map((win: any, idx: number) => {
              const isExtreme = win.severity === "EXTREME_COLLISION";
              const isHigh = win.severity === "HIGH_COLLISION";
              const isElevated = win.severity === "ELEVATED";

              const cardBorder = isExtreme
                ? "border-rose-700 bg-gradient-to-br from-rose-950/40 via-[#0e1628] to-[#080d17]"
                : isHigh
                  ? "border-amber-700 bg-gradient-to-br from-amber-950/30 via-[#0e1628] to-[#080d17]"
                  : isElevated
                    ? "border-cyan-800/60 bg-[#0c121e]"
                    : "border-slate-800 bg-[#0a0f1a]";

              const badgeColor = isExtreme
                ? "bg-rose-950 text-rose-300 border-rose-700"
                : isHigh
                  ? "bg-amber-950 text-amber-300 border-amber-700"
                  : isElevated
                    ? "bg-cyan-950 text-cyan-300 border-cyan-700"
                    : "bg-slate-900 text-slate-400 border-slate-800";

              return (
                <div key={idx} className={`p-4 rounded-xl border ${cardBorder} font-mono text-xs flex flex-col justify-between space-y-3 shadow-lg`}>
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <span className="font-bold text-sm text-slate-100">{win.month_label}</span>
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase border ${badgeColor}`}>
                        {win.severity.replace("_", " ")}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-300">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Monthly OpEx (3rd Fri):</span>
                        <span className="font-bold text-cyan-300">{win.opex_date}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">
                          <MetricTip term="WINDOW OF WEAKNESS">Window of Weakness:</MetricTip>
                        </span>
                        <span className="text-slate-200">{win.window_of_weakness_start} &rarr; {win.window_of_weakness_end}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Collision Risk Score:</span>
                        <span className={`font-black ${win.risk_score >= 80 ? "text-rose-400" : win.risk_score >= 60 ? "text-amber-400" : "text-emerald-400"}`}>
                          {win.risk_score} / 100
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#070b14] border border-slate-800 mt-3 font-sans text-xs">
                      <span className="font-bold font-mono text-amber-400 block mb-1 text-[11px] uppercase">
                        Fiscal / Treasury Event:
                      </span>
                      <p className="text-slate-300 leading-snug">{win.fiscal_event}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 font-sans text-xs text-cyan-300/90 leading-snug">
                    <strong className="font-mono text-[11px] text-white block uppercase mb-0.5">Recommended Hedge Strategy:</strong>
                    {win.recommended_strategy}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Systematic Hydraulic Policy Shock Scenarios */}
          <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-400" />
                <h3 className="font-mono text-base font-bold uppercase tracking-wider text-slate-100">
                  4 Systematic Hydraulic Policy Shock Scenarios (Treasury &amp; Derivatives)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Stress Simulation Matrix
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {hydraulicScenarios.map((sc: any) => {
                const isRose = sc.badge_color === "rose";
                const isAmber = sc.badge_color === "amber";
                const borderCol = isRose
                  ? "border-rose-900/60 bg-gradient-to-b from-rose-950/20 to-[#080e1b]"
                  : isAmber
                    ? "border-amber-900/60 bg-gradient-to-b from-amber-950/20 to-[#080e1b]"
                    : "border-emerald-900/60 bg-gradient-to-b from-emerald-950/20 to-[#080e1b]";

                return (
                  <div key={sc.id} className={`p-4 rounded-xl border ${borderCol} flex flex-col justify-between space-y-3`}>
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                        <span className="font-bold text-sm text-white">{sc.title}</span>
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase border ${isRose ? "bg-rose-950 text-rose-300 border-rose-800" : isAmber ? "bg-amber-950 text-amber-300 border-amber-800" : "bg-emerald-950 text-emerald-300 border-emerald-800"
                          }`}>
                          {sc.probability} PROB
                        </span>
                      </div>

                      <div className="space-y-2 font-sans text-xs text-slate-300">
                        <div>
                          <strong className="text-slate-400 font-mono block text-[11px] uppercase">Catalyst Trigger:</strong>
                          <p>{sc.catalyst}</p>
                        </div>
                        <div>
                          <strong className="text-slate-400 font-mono block text-[11px] uppercase">Hydraulic Flow Mechanics:</strong>
                          <p>{sc.flow_mechanics}</p>
                        </div>
                        <div>
                          <strong className="text-slate-400 font-mono block text-[11px] uppercase">Cross-Asset Impact:</strong>
                          <p>{sc.market_impact}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800 font-sans text-xs">
                      <div className="p-2 rounded bg-[#060a12] border border-cyan-900/40 text-cyan-200">
                        <strong className="font-mono text-[11px] text-cyan-400 block uppercase mb-0.5">
                          Actionable Trade Strategy:
                        </strong>
                        {sc.actionable_trade_idea}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        <strong className="text-amber-400 font-mono uppercase">Where to look next:</strong> {sc.where_to_look_next}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CENTRAL BANK SENTIMENT MATRIX */}
      {/* ========================================================================= */}
      {activeTab === "central-banks" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                  8-Week Central Bank Speech Sentiment &bull; Balance Sheet Telemetry
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                Fed &bull; ECB &bull; BoE &bull; BoJ &bull; PBOC &bull; RBA
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                    <th className="p-3">Institution &amp; Speaker</th>
                    <th className="p-3">Date &amp; Speech Title</th>
                    <th className="p-3">Hawkish / Dovish Bias</th>
                    <th className="p-3">Balance Sheet Stance</th>
                    <th className="p-3">Liquidity Implication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(cbSentiment.speeches || []).map((sp: any) => (
                    <tr key={sp.id} className="hover:bg-slate-900/30 transition">
                      <td className="p-3">
                        <span className="font-bold text-slate-200 block">{sp.speaker}</span>
                        <span className="text-slate-400 text-[11px]">{sp.institution} &bull; {sp.speaker_role}</span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <span className="text-slate-400 text-[11px] block">{sp.speech_date}</span>
                        <span className="text-slate-200 font-sans text-xs line-clamp-1">{sp.speech_title}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase text-xs ${sp.hawkish_dovish_score > 10
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : sp.hawkish_dovish_score < -10
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                        >
                          {sp.tone_label} ({sp.hawkish_dovish_score > 0 ? `+${sp.hawkish_dovish_score}` : sp.hawkish_dovish_score})
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{sp.balance_sheet_stance}</td>
                      <td className="p-3 text-slate-300 max-w-sm font-sans text-xs leading-relaxed">{sp.liquidity_implication}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REAL INTEREST RATES & SOVEREIGN DEBT SQUEEZE */}
      {/* ========================================================================= */}
      {activeTab === "real-rates" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                  Sovereign "r &minus; g" Debt Snowball Gap &bull; G4 &amp; Australia
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Formula: Real Yield &minus; Potential Real GDP Growth
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                    <th className="p-3">Country / Jurisdiction</th>
                    <th className="p-3">10Y Benchmark Nominal</th>
                    <th className="p-3">Core Inflation / TIPS</th>
                    <th className="p-3">10Y Real Rate (r)</th>
                    <th className="p-3">Trend GDP Growth (g)</th>
                    <th className="p-3">r &minus; g Snowball Gap</th>
                    <th className="p-3">Fiscal Compounding Diagnosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(realRates.g4_comparison_table || []).map((row: any) => {
                    const isPositive = row.r_minus_g_gap > 0;
                    return (
                      <tr key={row.country} className="hover:bg-slate-900/30 transition">
                        <td className="p-3 font-bold text-slate-200">{row.country}</td>
                        <td className="p-3 text-slate-300">{row.nominal_10y_yield_pct}%</td>
                        <td className="p-3 text-slate-300">{row.core_inflation_pct}%</td>
                        <td className="p-3 text-slate-200 font-bold">{row.real_yield_r_pct}%</td>
                        <td className="p-3 text-slate-300">{row.real_gdp_growth_g_pct}%</td>
                        <td className="p-3 font-black">
                          <span className={isPositive ? "text-rose-400" : "text-emerald-400"}>
                            {isPositive ? `+${row.r_minus_g_gap}` : row.r_minus_g_gap}%
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold uppercase text-xs border ${row.debt_compounding_status?.includes("CRITICAL") || row.debt_compounding_status?.includes("RESTRICTION")
                                ? "bg-rose-950 text-rose-300 border-rose-800"
                                : row.debt_compounding_status?.includes("REPRESSION")
                                  ? "bg-indigo-950 text-indigo-300 border-indigo-800"
                                  : "bg-emerald-950 text-emerald-300 border-emerald-800"
                              }`}
                          >
                            {row.debt_compounding_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Plain English Explanation Box */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-xs">
                <Info className="h-3.5 w-3.5" />
                <span>In Plain English: What is the "r &minus; g" Debt Snowball Spread?</span>
              </div>
              <p className="leading-relaxed font-sans text-slate-300 text-xs">
                Think of <strong>r</strong> as the interest rate on your government's credit card, and <strong>g</strong> as how fast the nation's paychecks are growing. When <strong>r &gt; g</strong>, the interest charges grow faster than the whole economy, causing sovereign debt to snowball out of control. This eventually forces governments to seek <MetricTip term="ACCORD 2.0">Accord 2.0 policies</MetricTip>—meaning the central bank must print money or suppress bond yields to prevent a sovereign debt clearance crisis.
              </p>
            </div>
          </div>

          {/* SECTOR VALUATION SENSITIVITY TABLE */}
          <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                  Equity Sector Multiple Sensitivity to Real Rates (+50 bps Shock)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                P/E Multiple Expansion / Compression Beta
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                    <th className="p-3">Sector &amp; ETF</th>
                    <th className="p-3">Duration Risk Profile</th>
                    <th className="p-3">Estimated Multiple Impact</th>
                    <th className="p-3">Economic Transmission Channel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(realRates.sector_sensitivities || []).map((s: any) => (
                    <tr key={s.sector} className="hover:bg-slate-900/30 transition">
                      <td className="p-3 font-bold text-slate-200">{s.sector}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase text-xs border ${s.duration_risk.includes("EXTREME") || s.duration_risk.includes("VERY HIGH")
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : s.duration_risk.includes("HIGH")
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            }`}
                        >
                          {s.duration_risk}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${s.pe_multiple_impact_pct < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {s.pe_multiple_impact_pct > 0 ? `+${s.pe_multiple_impact_pct}` : s.pe_multiple_impact_pct}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{s.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
