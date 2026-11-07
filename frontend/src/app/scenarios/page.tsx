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
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

// Macro Glossary Dictionary for Interactive Hover Tooltips
const MACRO_GLOSSARY: Record<string, string> = {
  TGA: "Treasury General Account: The US government's operating checking account at the Federal Reserve. When the Treasury spends down TGA cash, it injects liquidity directly into the banking system.",
  RRP: "Overnight Reverse Repo Facility: A Fed program where money market funds park excess cash. When RRP balances drain, money flows out into Treasury bills and broader financial markets.",
  MOVE: "Merrill Lynch Option Volatility Estimate: The benchmark index tracking implied volatility in US Treasury options—frequently called the 'VIX of the bond market.'",
  "HY OAS": "High Yield Option-Adjusted Spread: The yield premium paid by junk-rated corporate bonds over risk-free US Treasuries, measuring corporate credit default anxiety.",
  DFII10: "10-Year TIPS Constant Maturity Yield: The inflation-adjusted (real) interest rate on 10-year US Treasuries. Represents the true hurdle cost of long-term capital.",
  "r - g": "Debt Snowball Gap: The real borrowing interest rate (r) minus real economic trend growth (g). When r exceeds g, sovereign debt compounds exponentially without fiscal cuts.",
  SLR: "Supplementary Leverage Ratio: Bank capital rule requiring large institutions to hold equity capital against Treasuries. Relaxing SLR enables banks to absorb more government debt.",
  RMP: "Reserve Management Purchases: Fed purchases of short-term Treasury bills to maintain ample bank reserves without officially declaring a quantitative easing (QE) program.",
  NIIP: "Net International Investment Position: The net value of domestic assets owned by foreigners versus overseas assets owned by citizens. A large negative NIIP leaves the currency vulnerable.",
  "Accord 2.0": "Coordinated monetary-fiscal intervention where the Fed caps government borrowing costs or Treasury tilts debt issuance heavily into short-term bills.",
  LGFV: "Local Government Financing Vehicles: Off-balance-sheet municipal financing entities in China that funded infrastructure megaprojects, now facing debt saturation.",
  RRR: "Reserve Requirement Ratio: The proportion of bank deposits Chinese commercial lenders must hold at the PBOC. Cutting RRR unlocks lending capacity.",
  "Trimmed Mean CPI": "Core inflation measure calculating the 70% central core of price movements, eliminating temporary upside and downside extremes (standard RBA metric).",
};

// Tooltip Component
const TooltipWord: React.FC<{ term: string; label?: string }> = ({ term, label }) => {
  const [open, setOpen] = useState(false);
  const def = MACRO_GLOSSARY[term] || "Macroeconomic plumbing and systemic liquidity metric.";
  return (
    <span
      className="relative inline-block cursor-help"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="underline decoration-dotted decoration-cyan-400/70 underline-offset-2 text-cyan-300 font-semibold">
        {label || term}
      </span>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-[#090d16] border border-cyan-500/70 text-slate-200 text-xs shadow-2xl z-50 pointer-events-none leading-relaxed font-mono">
          <span className="font-bold text-cyan-400 block mb-1 uppercase tracking-wider">{term}</span>
          {def}
        </span>
      )}
    </span>
  );
};

export default function ScenariosPlaybookPage() {
  const [activeTab, setActiveTab] = useState<"scenarios" | "central-banks" | "real-rates">("scenarios");
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold mb-1">
          <Compass className="h-4 w-4" />
          <span>Systematic Policy Playbook &bull; Rolling 4-Quarter Forward Scenarios</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-base font-bold font-mono tracking-tight text-slate-100">
            Forward Macro Scenarios, Real Rates &amp; Central Bank Sentiment
          </h1>
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
        <p className="text-xs text-slate-400 font-mono mt-1 max-w-4xl">
          Unified institutional dashboard combining dynamic quarterly macro regimes, live FRED trigger telemetry, sovereign real interest rate dynamics (<TooltipWord term="r - g" />), and 8-week central bank speech sentiment analysis across the Fed, ECB, BoE, BoJ, PBOC, and RBA.
        </p>
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
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">10Y Real Rate (<TooltipWord term="DFII10" label="TIPS" />)</span>
          <div className="text-base font-mono font-bold text-emerald-400 mt-1">
            {scorecards.us_10y_real_rate_pct !== undefined ? `${scorecards.us_10y_real_rate_pct}%` : "2.05%"}
          </div>
          <span className="text-xs font-mono text-slate-300 mt-1">
            r - g Spread: <strong className={scorecards.us_r_minus_g_spread > 0 ? "text-amber-400" : "text-emerald-400"}>{scorecards.us_r_minus_g_spread !== undefined ? `${scorecards.us_r_minus_g_spread > 0 ? "+" : ""}${scorecards.us_r_minus_g_spread}%` : "+0.50%"}</strong>
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
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "scenarios"
              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/50"
              : "bg-[#0c121e] text-slate-400 border border-slate-800 hover:text-slate-200"
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Forward Macro Scenarios &amp; Policy Playbook</span>
        </button>

        <button
          onClick={() => setActiveTab("central-banks")}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "central-banks"
              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/50"
              : "bg-[#0c121e] text-slate-400 border border-slate-800 hover:text-slate-200"
          }`}
        >
          <Landmark className="h-4 w-4" />
          <span>Central Bank Speeches &amp; Monetary Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab("real-rates")}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "real-rates"
              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/50"
              : "bg-[#0c121e] text-slate-400 border border-slate-800 hover:text-slate-200"
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Real Interest Rates &amp; Sovereign Debt Squeeze</span>
        </button>
      </div>

      {/* TAB 1: FORWARD MACRO SCENARIOS */}
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
                  className={`p-3.5 rounded-xl border text-left font-mono transition shadow-md flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? "bg-gradient-to-br from-cyan-950/60 to-slate-900 border-cyan-500/50 shadow-cyan-950/40"
                      : "bg-[#0c121e] border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${isSelected ? "text-cyan-400" : "text-slate-300"}`}>
                      {item.quarter}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase border ${
                        isWarning
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
                  <span
                    className={`text-xs px-2 py-0.5 rounded border font-bold uppercase ${
                      activeQ.trigger_status?.includes("WARNING") || activeQ.trigger_status?.includes("ACTIVE")
                        ? "bg-amber-950 text-amber-300 border-amber-800"
                        : "bg-emerald-950 text-emerald-300 border-emerald-800"
                    }`}
                  >
                    {activeQ.trigger_status}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                  {activeQ.live_trigger_telemetry}
                </p>
              </div>

              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                {activeQ.baseScenario?.description}
              </p>

              {/* Policy Trajectory Result */}
              {activeQ.policy_and_market_result && (
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-1">
                  <span className="text-xs uppercase font-bold text-cyan-400 block">
                    Policy Trajectory &amp; Systematic Deployment Result:
                  </span>
                  <p className="text-slate-200 leading-relaxed text-xs">
                    {activeQ.policy_and_market_result}
                  </p>
                </div>
              )}

              {/* Asset Direction Matrix */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
                  Consensus Asset Direction Matrix:
                </h3>
                {activeQ.asset_directions && (
                  <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-300">
                    <span className="font-bold text-cyan-300">Directional Tilt: </span>
                    {activeQ.asset_directions}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {activeQ.baseScenario?.assetMatrix?.map((row: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300 font-medium">{row.asset}</span>
                      <span className={`font-bold ${row.color}`}>{row.direction}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Triggers and Prerequisites */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <span className="text-cyan-400 font-bold uppercase text-xs block">
                    Quantitative Triggers:
                  </span>
                  <ul className="space-y-1.5 text-slate-300 text-xs">
                    {activeQ.baseScenario?.triggers?.map((t: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <span className="text-indigo-400 font-bold uppercase text-xs block">
                    Firm Prerequisites:
                  </span>
                  <ul className="space-y-1.5 text-slate-300 text-xs">
                    {activeQ.baseScenario?.prerequisites?.map((p: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right: Alternative Case (40%) */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0c121e] border border-amber-500/30 shadow-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800">
                    ALTERNATIVE TAIL CASE ({activeQ.altProb || "40%"})
                  </span>
                </div>

                <h3 className="text-base font-mono font-bold text-slate-100">
                  {activeQ.altScenario?.title}
                </h3>

                <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  {activeQ.altScenario?.description}
                </p>

                <div className="space-y-2 text-xs font-mono">
                  <span className="text-amber-400 font-bold uppercase text-xs block">
                    Trigger Checkpoints:
                  </span>
                  <ul className="space-y-1.5 text-slate-300 text-xs">
                    {activeQ.altScenario?.triggers?.map((t: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400 text-xs block uppercase font-bold mb-1">
                    Alternative Market Trajectory:
                  </span>
                  <p className="text-slate-200">{activeQ.altScenario?.assetDirection}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs font-mono space-y-1">
                <span className="text-amber-400 font-bold uppercase text-xs block">
                  Emergency Policy Intervention:
                </span>
                <p className="text-slate-300 text-xs">{activeQ.altScenario?.policyResponse}</p>
              </div>
            </div>
          </div>

          {/* SYSTEMIC TRIGGERS LEDGER TABLE */}
          <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                  Live Quantitative Trigger Distance Barometer
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Audited against live FRED, Treasury &amp; Market feeds
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                    <th className="p-3">Trigger Parameter</th>
                    <th className="p-3">Live Reading</th>
                    <th className="p-3">Stress Threshold</th>
                    <th className="p-3">Distance to Line</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Market Consequence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {triggersList.map((t: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-900/30 transition">
                      <td className="p-3 font-bold text-slate-200">{t.name}</td>
                      <td className="p-3 font-semibold text-cyan-300">{t.live_value}</td>
                      <td className="p-3 text-slate-400">{t.threshold}</td>
                      <td className="p-3 text-slate-300">{t.distance_pct}%</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase text-xs border ${
                            t.status === "TRIGGERED"
                              ? "bg-rose-950 text-rose-300 border-rose-800"
                              : t.status === "ACTIVE WATCH"
                              ? "bg-amber-950 text-amber-300 border-amber-800"
                              : "bg-emerald-950 text-emerald-300 border-emerald-800"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{t.implication}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Simple English Explanation Box */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-xs">
                <Info className="h-3.5 w-3.5" />
                <span>In Plain English: What are Quantitative Triggers?</span>
              </div>
              <p className="leading-relaxed">
                Think of these triggers as circuit breakers in an electrical panel. Under normal conditions, financial markets follow standard business cycles. However, if any key indicator—such as junk bond borrowing costs (<TooltipWord term="HY OAS" />) or inflation spikes—breaches its red line, it automatically triggers a policy pivot. When circuit breakers trip, central banks and the Treasury are forced to intervene with emergency liquidity, rate cuts, or regulatory relief, overriding standard market trends.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CENTRAL BANK SPEECHES & MONETARY MATRIX */}
      {activeTab === "central-banks" && (
        <div className="space-y-6">
          {/* Header Summary Card */}
          <div className="p-5 rounded-2xl bg-[#0c121e] border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
                  Trailing 8-Week Global Consensus Matrix
                </span>
                <h2 className="text-base font-mono font-bold text-slate-100 mt-1">
                  Institutional Central Bank Sentiment Ledger &amp; Policy Stance
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block">Overall Stance:</span>
                <span className="text-sm font-mono font-bold text-cyan-300">
                  {cbSentiment.net_bias_label || "Divergent Asymmetric Tilt"} (Net Score: {cbSentiment.global_net_balance})
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              Synthesized official communications, press conference transcripts, and economic remarks from the core leadership of the Federal Reserve, European Central Bank, Bank of England, Bank of Japan, People's Bank of China, and Reserve Bank of Australia over the last 8 weeks.
            </p>

            {/* Central Bank Institution Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(cbSentiment.institutions_breakdown || {}).map(([code, item]: [string, any]) => {
                const score = item.avg_score || 0;
                const isHawkish = score > 15;
                const isDovish = score < -15;

                return (
                  <div key={code} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{code}</span>
                        <span className="text-xs text-slate-400">({item.speeches_count} speeches)</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-xs border ${
                          isHawkish
                            ? "bg-rose-950 text-rose-300 border-rose-800"
                            : isDovish
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {item.status_label} ({score > 0 ? "+" : ""}{score})
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-slate-400 block">Lead Speaker:</span>
                      <span className="text-slate-200 font-semibold">{item.latest_speaker} &bull; <span className="text-slate-400">{item.latest_role}</span></span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800/80 text-xs italic text-cyan-200 leading-relaxed">
                      "{item.key_quote}"
                    </div>

                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Balance Sheet Stance:</span>
                        <span className="text-slate-200 font-bold">{item.balance_sheet_stance}</span>
                      </div>
                      <p className="text-slate-400 line-clamp-2">{item.liquidity_implication}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHINA 2008 LIQUIDITY CASE STUDY & STRUCTURAL REALITY */}
          <div className="p-5 rounded-2xl bg-[#0c121e] border border-indigo-500/30 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                China Liquidity Provider Assessment: The 2008 Playbook vs. 2026 Structural Constraints
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* 2008 Historical Case Study */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30 space-y-3">
                <span className="text-emerald-400 font-bold uppercase text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>The 2008 Global Liquidity Locomotive Playbook</span>
                </span>
                <p className="text-slate-300 leading-relaxed">
                  In late 2008, Beijing unleashed a massive <strong>4 Trillion RMB ($586B, ~12.5% of GDP)</strong> stimulus package. Channeled through state-owned banks and <TooltipWord term="LGFV" label="LGFVs" />, this spending boom absorbed the world's excess industrial capacity, ignited a multi-year global commodity supercycle, and directly rescued Australia and Europe from prolonged depression.
                </p>
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
                  <strong>Historical Impact:</strong> Surging demand for Australian iron ore, metallurgical coal, and industrial machinery pulled the global economy out of the Great Financial Crisis.
                </div>
              </div>

              {/* Current Structural Reality */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/30 space-y-3">
                <span className="text-amber-400 font-bold uppercase text-xs flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>2026 Structural Constraints: Why No Global Bazooka?</span>
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  <li>&bull; <strong>Balance Sheet Recession:</strong> Chinese households and real estate developers are aggressively deleveraging rather than borrowing.</li>
                  <li>&bull; <strong>LGFV Debt Saturation:</strong> Municipal debt exceeds 100% of provincial GDP, limiting local fiscal execution.</li>
                  <li>&bull; <strong>Currency Defense:</strong> A massive monetary flood risks destabilizing the RMB against the US Dollar and triggering capital flight.</li>
                </ul>
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300">
                  <strong>Macro Conclusion:</strong> PBOC will provide a targeted domestic floor via <TooltipWord term="RRR" /> cuts and debt swaps, but will <em>not</em> export a 2008-style global liquidity wave.
                </div>
              </div>
            </div>

            {/* Australia - China Dependency Basket */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span>Australia &bull; China Macro Dependency &amp; Terms of Trade</span>
                <span>86.4% Correlation</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Because China's stimulus is targeted at domestic debt swaps rather than commodity-intensive infrastructure megaprojects, Australian mining corporate tax receipts remain subdued. The Reserve Bank of Australia (RBA) must manage domestic services inflation (<TooltipWord term="Trimmed Mean CPI" /> 3.5%) without the windfall revenue of a booming Chinese commodity supercycle, keeping the AUD/USD capped below 0.6800.
              </p>
            </div>

            {/* Simple English Explanation Box */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-xs">
                <Info className="h-3.5 w-3.5" />
                <span>In Plain English: Why Does China's Stimulus Matter Globally?</span>
              </div>
              <p className="leading-relaxed">
                China is the world's largest consumer of raw commodities (iron ore, copper, oil, energy). In 2008, China acted like a global economic superhero by borrowing heavily to build roads, railways, and cities, which created trillions of dollars of demand for exporting countries like Australia, Brazil, and Germany. Today, China already has built vast infrastructure and has too much domestic debt, so it is choosing to fix its local debts rather than buy huge volumes of foreign commodities.
              </p>
            </div>
          </div>

          {/* AUDITED SPEECHES LEDGER TABLE */}
          <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                  Audited Official Speeches &amp; Press Conferences (Last 8 Weeks)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Stored in PostgreSQL central database
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                    <th className="p-3">Date</th>
                    <th className="p-3">Bank</th>
                    <th className="p-3">Speaker &amp; Role</th>
                    <th className="p-3">Speech Title</th>
                    <th className="p-3">Sentiment Score</th>
                    <th className="p-3">Balance Sheet Stance</th>
                    <th className="p-3">Official Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(cbSentiment.speeches_ledger || []).map((s: any) => {
                    const score = s.hawkish_dovish_score || 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-900/30 transition">
                        <td className="p-3 text-slate-400">{s.speech_date}</td>
                        <td className="p-3 font-bold text-cyan-300">{s.institution}</td>
                        <td className="p-3 text-slate-200">
                          <strong>{s.speaker}</strong>
                          <span className="block text-slate-400 text-xs">{s.speaker_role}</span>
                        </td>
                        <td className="p-3 text-slate-300 max-w-xs truncate">{s.speech_title}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-xs border ${
                              score > 15
                                ? "bg-rose-950 text-rose-300 border-rose-800"
                                : score < -15
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                            }`}
                          >
                            {score > 0 ? `+${score}` : score} ({s.tone_label})
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-semibold">{s.balance_sheet_stance}</td>
                        <td className="p-3">
                          {s.source_url ? (
                            <a
                              href={s.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                              <span>Official</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-slate-600">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REAL INTEREST RATES & SOVEREIGN DEBT SQUEEZE */}
      {activeTab === "real-rates" && (
        <div className="space-y-6">
          {/* US Debt Squeeze Metric Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#0c121e] border border-cyan-500/30 font-mono text-xs space-y-1">
              <span className="text-slate-400 uppercase block font-semibold">Total Public Debt</span>
              <div className="text-base font-bold text-slate-100">${realRates.us_metrics?.us_public_debt_tn || "36.5"} Trillion</div>
              <span className="text-slate-400">122.5% of US GDP</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0c121e] border border-amber-500/30 font-mono text-xs space-y-1">
              <span className="text-slate-400 uppercase block font-semibold">Annual Net Interest</span>
              <div className="text-base font-bold text-amber-400">${realRates.us_metrics?.annual_net_interest_expense_tn || "1.18"} Trillion</div>
              <span className="text-slate-400">Exceeds US Defense Budget</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0c121e] border border-emerald-500/30 font-mono text-xs space-y-1">
              <span className="text-slate-400 uppercase block font-semibold">10Y Real TIPS Yield</span>
              <div className="text-base font-bold text-emerald-400">{realRates.us_metrics?.live_10y_real_tips_pct || "2.05"}%</div>
              <span className="text-slate-400">Nominal 10Y: {realRates.us_metrics?.live_10y_nominal_pct || "4.41"}%</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0c121e] border border-rose-500/30 font-mono text-xs space-y-1">
              <span className="text-slate-400 uppercase block font-semibold">Mandatory Entitlements</span>
              <div className="text-base font-bold text-rose-400">${realRates.us_metrics?.mandatory_entitlements_tn || "4.25"} Trillion</div>
              <span className="text-slate-400">Absorbs 82% of Tax Receipts</span>
            </div>
          </div>

          {/* SOVEREIGN COMPARATIVE REAL RATE BASKET */}
          <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                  Sovereign Comparative Real Interest Rate Basket &amp; The <TooltipWord term="r - g" /> Debt Snowball
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Formula: Real Yield (r) = 10Y Nominal &minus; Expected Inflation
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                    <th className="p-3">Sovereign Economy</th>
                    <th className="p-3">10Y Nominal</th>
                    <th className="p-3">Inflation Expectation</th>
                    <th className="p-3">10Y Real Rate (r)</th>
                    <th className="p-3">Real GDP Trend (g)</th>
                    <th className="p-3">r &minus; g Snowball Spread</th>
                    <th className="p-3">Debt / GDP</th>
                    <th className="p-3">Compounding Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(realRates.sovereign_comparative_basket || []).map((row: any) => {
                    const rMinusG = row.r_minus_g_spread || 0;
                    return (
                      <tr key={row.country} className="hover:bg-slate-900/30 transition">
                        <td className="p-3 font-bold text-slate-100">
                          <span className="mr-2">{row.flag}</span>
                          <span>{row.country}</span>
                          <span className="block text-slate-500 text-xs">{row.ticker}</span>
                        </td>
                        <td className="p-3 text-slate-300">{row.nominal_10y}%</td>
                        <td className="p-3 text-slate-400">{row.inflation_expectation}%</td>
                        <td className="p-3 font-bold text-cyan-300">{row.real_rate_10y}%</td>
                        <td className="p-3 text-slate-300">{row.real_gdp_trend}%</td>
                        <td className="p-3">
                          <span
                            className={`font-bold ${
                              rMinusG > 0 ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {rMinusG > 0 ? `+${rMinusG}` : rMinusG}%
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{row.debt_to_gdp_pct}%</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold uppercase text-xs border ${
                              row.debt_compounding_status?.includes("CRITICAL") || row.debt_compounding_status?.includes("RESTRICTION")
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

            {/* Simple English Explanation Box */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-xs">
                <Info className="h-3.5 w-3.5" />
                <span>In Plain English: What is the "r &minus; g" Debt Snowball Spread?</span>
              </div>
              <p className="leading-relaxed">
                Think of <strong>r</strong> as the interest rate on your government's credit card, and <strong>g</strong> as how fast the nation's paychecks are growing. When <strong>r &gt; g</strong>, the interest charges grow faster than the whole economy, causing debt to snowball out of control. This eventually forces governments to seek <TooltipWord term="Accord 2.0" label="Accord 2.0 policies" />—meaning the central bank must print money or suppress bond yields to prevent a bankruptcy crisis.
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
                          className={`px-2 py-0.5 rounded font-bold uppercase text-xs ${
                            s.duration_risk.includes("EXTREME") || s.duration_risk.includes("VERY HIGH")
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

            {/* Simple English Explanation Box */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-xs">
                <Info className="h-3.5 w-3.5" />
                <span>In Plain English: Why Do Real Rates Hurt Tech and REITs More Than Energy?</span>
              </div>
              <p className="leading-relaxed">
                Companies that promise big profits far into the future (like Tech and AI companies) are called "long duration." When real rates jump, a dollar earned 10 years from now becomes worth significantly less today in present value, dragging down stock valuation multiples. Meanwhile, capital-intensive businesses like Real Estate (<TooltipWord term="SLR" label="REITs" />) get crushed by higher borrowing costs when refinancing mortgages. Energy and Financial companies have short payback cycles or benefit from lending at higher interest rates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
