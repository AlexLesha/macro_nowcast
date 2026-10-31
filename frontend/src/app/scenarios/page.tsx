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
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

export default function ScenariosPlaybookPage() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [scenariosData, setScenariosData] = useState<any>(null);

  useEffect(() => {
    fetch(getApiUrl("/api/v1/scenarios"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setScenariosData(data);
      })
      .catch((err) => console.error("Error loading live scenarios:", err));
  }, []);

  const defaultQuarters = [
    {
      quarter: "Q4 2026 (Current Quarter)",
      scenario_name: "Base Case (60%): Sticky Inflation & Real-Rate Tension | Alt Case (40%): Credit Spread RORO Air-Pocket",
      headline: "Cyclical Reflation vs. Credit Spread Tension",
      baseProb: "60%",
      altProb: "40%",
      live_trigger_telemetry: "Live CPI YoY: 4.02% (Trigger >3.5%) | HY OAS 60D Delta: +55.0 bps (Trigger >+50 bps) | Live MOVE: 103.3 (Trigger >115)",
      trigger_status: "ACTIVE WATCH",
      asset_directions: "Base: Equities Choppy/Up, Commodities ($PDBC/$XLE) & Gold ($GLDM) Up, Long Bonds ($TLT) Down | Alt: $USFR Cash Outperforms",
      policy_and_market_result: "Treasury relies on T-Bill issuance (>22% share) while FOMC tolerates sticky inflation unless MOVE breaks >115.",
      baseScenario: {
        title: "Base Case: Cyclical Reflation Acceleration (Quad 2)",
        description:
          "US GDP YoY accelerates toward 2.50% while headline CPI lifts to ~2.80% driven by energy base effects. Corporate earnings beat consensus on robust hyperscaler capex and AI productivity gains.",
        assetMatrix: [
          { asset: "US Equities ($SPY / $QQQ)", direction: "BULLISH (+6% to +10%)", color: "text-emerald-400" },
          { asset: "Semiconductors ($SMH / $NVDA)", direction: "OUTPERFORM (+12% to +18%)", color: "text-emerald-400" },
          { asset: "Physical Bullion ($GLD)", direction: "MODERATE BULLISH (+5%)", color: "text-amber-400" },
          { asset: "Long Treasuries ($TLT)", direction: "BEARISH (-4% to -8%)", color: "text-rose-400" },
          { asset: "Crude Oil ($USO)", direction: "BULLISH (+8%)", color: "text-emerald-400" },
          { asset: "Bitcoin ($IBIT)", direction: "HIGH BETA (+15% to +25%)", color: "text-indigo-400" },
        ],
        triggers: [
          "Core PCE holds between 2.6% and 2.9% YoY",
          "Initial Claims stay below 230,000 4-week average",
          "Fed Net Liquidity stays above $6,100B via TGA drawdown",
        ],
        prerequisites: [
          "Hyperscaler datacenter capex guidance grows >20% YoY",
          "3Fourteen Residential Construction payrolls drawdown remains > -5% from peak",
        ],
      },
      altScenario: {
        title: "Alternative Case: Premature Growth Deceleration (Quad 4)",
        description:
          "Delayed impact of restrictive real rates stalls small business hiring. Unemployment ticks toward 4.4%, triggering rapid duration short-covering.",
        triggers: [
          "Initial Claims break out above 260,000",
          "ISM Manufacturing drops below 46.5",
          "HY Credit Spreads widen >350 bps over OTR Treasuries",
        ],
        assetDirection: "TLT and USFR surge; Cyclical Equities (IWM, XLE) re-test Risk Range lows.",
        policyResponse: "Fed accelerates emergency rate cuts by 50 bps; Treasury pauses long coupon auctions.",
      },
    },
    {
      quarter: "Q1 2027 (Quarter + 1)",
      scenario_name: "Base Case (55%): Fed-Treasury Accord 2.0 & SLR Deregulation | Alt Case (45%): Hawkish Credibility Tightening",
      headline: "Reflation-to-Stagflation Inflection & Accord 2.0 Watch",
      baseProb: "55%",
      altProb: "45%",
      live_trigger_telemetry: "Live 10Y Nominal Yield: 4.41% (Accord Trigger: 4.75%–5.00%) | Real-Rate Share of Yield Change: 94.0% | Accord 2.0 Probability Gauge: 48.0%",
      trigger_status: "MONITORING (Normal Tolerances)",
      asset_directions: "Base: Equities ($VT/$IWM), Financials ($XLF), Gold ($GLDM) & Bitcoin ($IBIT) Surge Up; 10Y Yields Capped",
      policy_and_market_result: "150 bps bank SLR relief + Fed RMP Treasury bill absorption caps real yields and triggers a high-conviction equity & hard-asset melt-up.",
      baseScenario: {
        title: "Base Case: Quad 2 Transitioning into Quad 3 Pressure",
        description:
          "Persistent commodity pass-through and services inflation collide with slowing marginal revenue growth. The 4-Quarter forward quad count flips from Quad 2 to Quad 3 as 12-month base effects toughen.",
        assetMatrix: [
          { asset: "US Equities ($SPY)", direction: "CONSOLIDATION (0% to +3%)", color: "text-cyan-300" },
          { asset: "High-FCF Quality ($QUAL / $MOAT)", direction: "OUTPERFORM (+8%)", color: "text-emerald-400" },
          { asset: "Physical Bullion ($GLD)", direction: "STRONG BULLISH (+10% to +14%)", color: "text-amber-400" },
          { asset: "Long Treasuries ($TLT)", direction: "VOLATILE / CHOPPY", color: "text-slate-400" },
          { asset: "Commodities & Copper ($CPER)", direction: "BULLISH (+10%)", color: "text-emerald-400" },
          { asset: "Regional Banks ($KRE)", direction: "EXPANDING NIM (+7%)", color: "text-emerald-400" },
        ],
        triggers: [
          "Headline CPI rises above 3.10% YoY while Real GDP drops below 1.8%",
          "10Y TIPS Breakeven spreads widen above 2.45%",
          "Speculative Inverse ETF ratio crosses 50% retail panic threshold",
        ],
        prerequisites: [
          "Oil prices stabilize above $82/bbl",
          "Unit labor costs accelerate above 3.5%",
        ],
      },
      altScenario: {
        title: "Alternative Case: Productivity Boom (Goldilocks Quad 1)",
        description:
          "AI hardware adoption drives enterprise productivity higher; unit labor costs plummet, creating disinflationary growth (ΔG+ ΔI-).",
        triggers: [
          "Non-farm labor productivity accelerates above 2.8% annualized",
          "Core PCE dips below 2.2%",
        ],
        assetDirection: "Broad equity market blowout rally ($QQQ, $IWM); dollar softens; TLT stabilizes.",
        policyResponse: "Fed smoothly normalizes rates to 3.25% neutral rate with zero inflation pushback.",
      },
    },
    {
      quarter: "Q2 2027 (Quarter + 2)",
      scenario_name: "Base Case (60%): Quad 1/2 Productivity Broadening | Alt Case (40%): Housing & Labor Scare (Quad 4)",
      headline: "Productivity Broadening vs. Housing Payrolls Drawdown",
      baseProb: "60%",
      altProb: "40%",
      live_trigger_telemetry: "Live 3Fourteen Residential Construction Payrolls Drawdown from Peak: -0.78% (Recession Trigger Threshold: -5.0% to -8.0%)",
      trigger_status: "NO RECESSION SIGNAL (Housing Payrolls Resilient)",
      asset_directions: "Base: Small Caps ($AVUV/$IWM), Industrials ($XLI) & Quality ($FCTE) Outperform | Alt (Quad 4): Long Bonds ($TLT) & Utilities ($XLU) Up",
      policy_and_market_result: "So long as Residential Construction Payrolls remain above -5% drawdown, fade recession scares and stay overweight cyclical compounders.",
      baseScenario: {
        title: "Base Case: Fiscal Dominance & Treasury Debt Refinancing Squeeze",
        description:
          "US Public Debt crosses $37T with annual net interest expense exceeding $1.3T. Treasury coupon auctions require regulatory intervention or SLR exemptions to prevent duration auction tails.",
        assetMatrix: [
          { asset: "Physical Gold & Miners ($GLD / $GDX)", direction: "MAX ACCELERATION (+18%)", color: "text-amber-400" },
          { asset: "Bitcoin ($IBIT)", direction: "SURGE (+25% to +40%)", color: "text-indigo-400" },
          { asset: "US Equities ($SPY)", direction: "CHOPPY / PINNED BY GEX", color: "text-slate-300" },
          { asset: "TIPS ($TIP)", direction: "OUTPERFORM NOMINALS (+6%)", color: "text-emerald-400" },
          { asset: "US Dollar Index ($UUP)", direction: "CYCLICAL BEAR (-5%)", color: "text-rose-400" },
        ],
        triggers: [
          "Treasury interest expense surpasses 4.2% of US GDP",
          "10Y Real TIPS yield account for >90% of Treasury yield adjustments",
          "US Debt-to-Domestic Liquidity ratio reaches 116%",
        ],
        prerequisites: [
          "Debt limit negotiations stall in Congress",
          "Primary dealer Treasury absorption limits reached",
        ],
      },
      altScenario: {
        title: "Alternative Case: Fiscal Consolidation Agreement",
        description:
          "Bipartisan fiscal restraint package caps discretionary spending and initiates entitlement stabilization, shrinking borrowing forecasts.",
        triggers: [
          "Projected 2028 federal deficit forecast revised downward by >$400B",
          "Primary dealer absorption ratios improve",
        ],
        assetDirection: "Treasuries surge in relief rally ($TLT +12%); US Dollar rallies.",
        policyResponse: "Treasury lengthens average debt maturity; Fed concludes balance sheet runoff quietly.",
      },
    },
    {
      quarter: "Q3 2027 (Quarter + 3)",
      scenario_name: "Base Case (55%): Paradigm C Debasement Melt-Up | Alt Case (45%): Sovereign NIIP Capital Outflow Shock",
      headline: "Secular Debasement Melt-Up & Hard Asset Supercycle",
      baseProb: "55%",
      altProb: "45%",
      live_trigger_telemetry: "Live Global Liquidity: $106.4T | US Debt-to-Liquidity: 114.2% | US NIIP: -$22.5T",
      trigger_status: "SECULAR DEBASEMENT TREND ACTIVE",
      asset_directions: "Base: Hard Assets ($GLDM, $IBIT, $SRUUF, $COPX, $TPL) & Quality Equities Up; Long Fiat Debt Underperforms",
      policy_and_market_result: "Validates 42 Macro KISS (60% $VT / 30% $GLDM / 10% $FBTC / 0% Long Bonds) and 3Fourteen Debasement allocation.",
      baseScenario: {
        title: "Base Case: Global Liquidity Wave & Electrification Supercycle",
        description:
          "Global M2 money supply accelerates past $115T as PBOC and ECB join Fed in synchronous easing. Commercial nuclear restarts and transmission buildouts reach construction peaks.",
        assetMatrix: [
          { asset: "Industrial Metals ($CPER / $FCX)", direction: "MAX BULL (+22%)", color: "text-emerald-400" },
          { asset: "Independent Nuclear Power ($VST / $CEG)", direction: "SUPER-CYCLE (+28%)", color: "text-emerald-400" },
          { asset: "Broad Equities ($SPY / $QQQ)", direction: "REFLATION HIGH (+15%)", color: "text-emerald-400" },
          { asset: "Hard Assets ($GLD / $IBIT)", direction: "NEW ALL-TIME HIGHS", color: "text-amber-400" },
          { asset: "Cash ($USFR)", direction: "UNDERPERFORM RISK ASSETS", color: "text-slate-400" },
        ],
        triggers: [
          "Global Central Bank balance sheets expand >8% YoY",
          "PJM and ERCOT power interconnection backlogs reach record valuation multiples",
          "Commercial real estate debt maturities successfully restructured into lower rates",
        ],
        prerequisites: [
          "Federal permitting reform passes for interstate electric transmission lines",
          "Chinese industrial stimulus accelerates global copper demand",
        ],
      },
      altScenario: {
        title: "Alternative Case: Geopolitical Trade Block Partitioning",
        description:
          "Tariffs and regional export bans fragment global supply chains; cost-push inflation forces renewed stagflationary tightening.",
        triggers: [
          "Universal reciprocal tariff implementation",
          "Critical mineral export bans enforced by foreign producers",
        ],
        assetDirection: "Domestic critical producers outperform; globalized tech and retail underperform.",
        policyResponse: "Aggressive industrial defense policy; targeted state-directed lending facilities.",
      },
    },
  ];

  const activeQuarterList = (scenariosData?.scenarios && scenariosData.scenarios.length > 0)
    ? scenariosData.scenarios.map((row: any, idx: number) => {
        const base = defaultQuarters[idx] || defaultQuarters[0];
        return {
          ...base,
          ...row,
          quarter: row.quarter || base.quarter,
          headline: row.headline || base.headline,
          baseProb: row.baseProb || base.baseProb,
          altProb: row.altProb || base.altProb,
          baseScenario: row.baseScenario
            ? { ...base.baseScenario, ...row.baseScenario }
            : {
                ...base.baseScenario,
                title: row.scenario_name || base.baseScenario.title,
              },
          altScenario: row.altScenario
            ? { ...base.altScenario, ...row.altScenario }
            : base.altScenario,
        };
      })
    : defaultQuarters;

  const activeQ = activeQuarterList[selectedIdx] || activeQuarterList[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold mb-1">
          <Compass className="h-4 w-4" />
          <span>4-QUARTER FORWARD SCENARIO PLAYBOOK &bull; AUDIT ITEM #26</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-base font-bold font-mono tracking-tight text-slate-100">
            Forward Macro Scenarios &amp; Systematic Policy Execution
          </h1>
          <span className="text-xs font-mono px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            As of: <strong className="text-cyan-400">{scenariosData?.as_of_utc || "Live Stream"}</strong>
          </span>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
          Quarter-by-quarter predictive mapping across Base and Alternative macroeconomic regimes, live FRED/Market trigger distance telemetry, and central bank policy responses through rolling 4 quarters.
        </p>
      </div>

      {/* QUARTER SELECTOR PILLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeQuarterList.map((item: any, idx: number) => {
          const isSelected = selectedIdx === idx;
          const isWarning = item.trigger_status?.includes("WARNING") || item.trigger_status?.includes("ACTIVE");

          return (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`p-4 rounded-xl border text-left font-mono transition shadow-md flex flex-col justify-between space-y-2 ${
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

      {/* ACTIVE QUARTER SCENARIO BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Base Case Scenario (60-70% Probability) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0c121e] border border-cyan-500/30 shadow-2xl space-y-6">
          <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  BASE SCENARIO ({activeQ.baseProb} PROBABILITY)
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">{activeQ.quarter}</span>
              </div>
              <h2 className="text-base font-mono font-bold text-slate-100 mt-2">
                {activeQ.scenario_name || activeQ.baseScenario.title}
              </h2>
            </div>
          </div>

          {/* Live Quantitative Trigger Telemetry Box (Audit Item #26 Core Requirement) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-indigo-950/40 border border-cyan-500/40 space-y-2 font-mono">
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

          <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {activeQ.baseScenario.description}
          </p>

          {/* Dynamic Policy & Market Result */}
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
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
              Asset Direction Matrix:
            </h3>
            {activeQ.asset_directions && (
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-300">
                <span className="font-bold text-cyan-300">Consensus Directions: </span>
                {activeQ.asset_directions}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {activeQ.baseScenario.assetMatrix.map((row: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">{row.asset}</span>
                  <span className={`font-bold ${row.color}`}>{row.direction}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quantitative Triggers & Prerequisites */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <span className="text-cyan-400 font-bold uppercase text-xs block">
                Quantitative Triggers:
              </span>
              <ul className="space-y-1 text-slate-300 text-xs">
                {activeQ.baseScenario.triggers.map((t: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <span className="text-indigo-400 font-bold uppercase text-xs block">
                Firm Prerequisites:
              </span>
              <ul className="space-y-1 text-slate-300 text-xs">
                {activeQ.baseScenario.prerequisites.map((p: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Alternative Tail Scenario (30-40% Probability) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0c121e] border border-amber-500/30 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800">
                ALTERNATIVE CASE ({activeQ.altProb})
              </span>
            </div>

            <h3 className="text-base font-mono font-bold text-slate-100">
              {activeQ.altScenario.title}
            </h3>

            <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              {activeQ.altScenario.description}
            </p>

            <div className="space-y-2 text-xs font-mono">
              <span className="text-amber-400 font-bold uppercase text-xs block">
                Trigger Checkpoints:
              </span>
              <ul className="space-y-1 text-slate-300 text-xs">
                {activeQ.altScenario.triggers.map((t: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 text-xs block uppercase font-bold mb-1">
                Alternative Market Results:
              </span>
              <p className="text-slate-200">{activeQ.altScenario.assetDirection}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs font-mono space-y-1">
            <span className="text-amber-400 font-bold uppercase text-xs block">
              Emergency Policy Intervention:
            </span>
            <p className="text-slate-300 text-xs">{activeQ.altScenario.policyResponse}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
