"use client";

import React, { useState } from "react";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function FrameworkSynthesisPage() {
  const [selectedTopic, setSelectedTopic] = useState<string>("all");

  const frameworks = [
    {
      author: "Aahan Menon",
      firm: "Prometheus Macro",
      badgeColor: "border-amber-500/50 text-amber-400 bg-amber-950/40",
      avatarGradient: "from-amber-600 to-orange-700",
      growthCall: "Accelerating (2.4% YoY) & Mid-Cycle Expansion",
      growthDetail: "Income + Consumption model shows household real spend accelerating above cycle average.",
      inflationCall: "Demand-Driven Sticky Services (2.8% YoY)",
      inflationDetail: "Goods deflation fully exhausted; Sticky Services remain elevated above 3.2%.",
      liquidityView: "Global M2 Re-acceleration ($106.4T)",
      liquidityDetail: "Global central bank liquidity inflecting higher despite Fed balance sheet runoff.",
      bondStance: "Neutral / Selective TIPS ($TIP)",
      bondDetail: "1965 Mahalanobis distance similarity suggests real yield compression favors TIPS over nominals.",
      equitySignal: "Overweight Secular Growth & Gold",
      equityDetail: "Expected 63-day return: SPY +12.4%, GLD +14.2%, TLT -4.8%.",
      url: "https://www.prometheus-macro.com",
    },
    {
      author: "Keith McCullough",
      firm: "Hedgeye Risk Management",
      badgeColor: "border-cyan-500/50 text-cyan-400 bg-cyan-950/40",
      avatarGradient: "from-cyan-600 to-blue-700",
      growthCall: "Shallow Quad 2 Acceleration",
      growthDetail: "Headline CPI & Real GDP both rising YoY (&Delta;G+ &Delta;I+). Locking into Q3 base effects.",
      inflationCall: "Quad 2 Reflation Push (Headline CPI: 2.78%)",
      inflationDetail: "Commodity pass-through accelerating headline numbers; Core PCE tracking sticky.",
      liquidityView: "US TGA Drain Buffering Cash Reserves",
      liquidityDetail: "Yellen Treasury General Account spenddown providing stealth fiscal liquidity injection.",
      bondStance: "Confirmed Bearish Trend ($TLT)",
      bondDetail: "Long bond below 504D TAIL pivot. Any bounce to top of risk range is a short.",
      equitySignal: "Bullish Trend & Pod 1/2 Conviction Longs",
      equityDetail: "Top conviction in NVDA, VST, CEG. Execute dynamic KSPY Collar overlay at top of range.",
      url: "https://app.hedgeye.com",
    },
    {
      author: "Darius Dale",
      firm: "42 Macro",
      badgeColor: "border-emerald-500/50 text-emerald-400 bg-emerald-950/40",
      avatarGradient: "from-emerald-600 to-teal-700",
      growthCall: "Reflation Leading 42-Market Grid (33.2%)",
      growthDetail: "Factor loadings in 42-Market Grid matrix show dominant cyclical and commodity leadership.",
      inflationCall: "Real Yield Dominance (94% Rule)",
      inflationDetail: "Real rate rise accounts for >80% of nominal moves; Accord 2.0 gauge on watch.",
      liquidityView: "US Debt-to-Liquidity Stretches to 114%",
      liquidityDetail: "Structural fiscal dominance ratio remains unsustainable; Fed forced to ease into 2027.",
      bondStance: "Underweight Duration / Long USFR Cash",
      bondDetail: "MOVE vs VIX ratio favors risk-on; keep duration exposure parked in floating-rate notes.",
      equitySignal: "KISS 60/30/10 Systematic Scaling",
      equityDetail: "48% SPY / 24% GLD / 8% IBIT / 20% USFR cash scaled by 10% Vol Target & VAMS +1.",
      url: "https://www.42macro.com",
    },
    {
      author: "Warren Pies",
      firm: "3Fourteen Research",
      badgeColor: "border-indigo-500/50 text-indigo-400 bg-indigo-950/40",
      avatarGradient: "from-indigo-600 to-purple-700",
      growthCall: "Resilient Corporate Margin & FCF Expansion",
      growthDetail: "3Fourteen Residential Construction drawdown (-0.8%) remains well above -5% recession trigger.",
      inflationCall: "3-Vector Model Neutral (2.65% CPI Path)",
      inflationDetail: "Energy vector stabilizing; Shelter rent decay curve offsetting wage growth impulse.",
      liquidityView: "Speculative Inverse Ratio at 41.8%",
      liquidityDetail: "SQQQ + SOXS + SPXS volume ratio at 41.8%; retail has not yet panicked into capitulation.",
      bondStance: "10Y Fair Value at 4.15% - 4.35%",
      bondDetail: "Yield curve steepener favored: Long 2Y ($SHY) / Short 10Y/30Y duration.",
      equitySignal: "FCTE Top-Decile Quality + Momentum",
      equityDetail: "Top conviction active benchmark tilts: NVDA (+239 bps), VRT (+195 bps), CEG (+160 bps).",
      url: "https://3fourteensmi.com",
    },
  ];

  const contradictions = [
    {
      id: "contradiction-1",
      title: "Contradiction 1: Secular Bond Bear vs. Cyclical Duration Hedge",
      dispute:
        "Hedgeye and 42 Macro are structurally short duration (TLT Bearish Trend / 114% Debt-to-Liquidity) while Prometheus historical analog and 3Fourteen Fair Value model signal that a 10Y yield over 4.40% offers asymmetric cyclical risk/reward.",
      unifiedResolution:
        "Unified Engine Resolution: Implement an asymmetric barbell. Underweight long-duration nominal Treasuries ($TLT) to respect Hedgeye's 504D Tail breakdown and Darius Dale's Accord watch, while overweighting short/intermediate floating rate notes ($USFR / $SHY) and TIPS ($TIP) to capture positive real carry without duration drawdown risk.",
      status: "RESOLVED & SYSTEMATIZED",
      statusColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
    },
    {
      id: "contradiction-2",
      title: "Contradiction 2: Base-Effect Forward Quads vs. High-Frequency VAMS Momentum",
      dispute:
        "Hedgeye's 4-Quarter forward quad count projects potential Quad 3 (Stagflation) transition in early 2027 based on 12-month base effects, whereas 42 Macro's daily VAMS and 3Fourteen's FCTE remain firmly in Bullish Trend today.",
      unifiedResolution:
        "Unified Engine Resolution: Horizon separation. Use Hedgeye's forward Base-Effect projections to set multi-quarter risk caps (preventing over-leveraging into late-cycle equities), while allowing 42 Macro's daily VAMS and options GEX to execute high-conviction momentum trades right now until a confirmed trend pivot occurs.",
      status: "RESOLVED & SYSTEMATIZED",
      statusColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
    },
    {
      id: "contradiction-3",
      title: "Contradiction 3: Sticky Services Inflation vs. Supply Disinflation Vectors",
      dispute:
        "Prometheus isolates persistent sticky services inflation (3.4% YoY) as a threat to aggressive Fed rate cuts, while 3Fourteen highlights that goods disinflation and shelter rent decay curve will compress headline CPI.",
      unifiedResolution:
        "Unified Engine Resolution: Capital flow barbell. Allocate to assets that profit from stubborn services pricing power (Hedgeye Pod 1/2 secular compounders with >15% FCF margins like NVDA and VST) paired with hard commodities ($GLD, $CPER) that absorb persistent monetary debasement.",
      status: "RESOLVED & SYSTEMATIZED",
      statusColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold mb-1">
          <Scale className="h-4 w-4" />
          <span>FRAMEWORK SYNTHESIS MATRIX</span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
          Cross-Institutional Consensus &amp; Contradiction Resolution
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
          Harmonizing institutional methodologies across Prometheus Macro, Hedgeye, 42 Macro, and 3Fourteen Research into a unified quantitative alpha signal.
        </p>
      </div>

      {/* 4-COLUMN COMPARISON MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {frameworks.map((fw, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-[#0c121e] border border-slate-800 hover:border-slate-700 transition p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden"
          >
            <div className="space-y-3">
              {/* Strategist Profile */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${fw.avatarGradient} flex items-center justify-center font-mono font-bold text-white text-xs border border-white/20`}
                  >
                    {fw.author.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-mono text-slate-100">{fw.author}</h2>
                    <p className="text-[11px] font-mono text-slate-400">{fw.firm}</p>
                  </div>
                </div>
                <a
                  href={fw.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-cyan-400 transition"
                  title="Source website"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Call Rows */}
              <div className="space-y-3 text-xs font-mono">
                {/* Growth */}
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                  <span className="text-[10px] uppercase text-cyan-400 font-bold block">Growth Call</span>
                  <div className="font-semibold text-slate-200">{fw.growthCall}</div>
                  <p className="text-[10px] text-slate-400 leading-tight">{fw.growthDetail}</p>
                </div>

                {/* Inflation */}
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                  <span className="text-[10px] uppercase text-amber-400 font-bold block">Inflation Call</span>
                  <div className="font-semibold text-slate-200">{fw.inflationCall}</div>
                  <p className="text-[10px] text-slate-400 leading-tight">{fw.inflationDetail}</p>
                </div>

                {/* Liquidity */}
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                  <span className="text-[10px] uppercase text-emerald-400 font-bold block">Liquidity View</span>
                  <div className="font-semibold text-slate-200">{fw.liquidityView}</div>
                  <p className="text-[10px] text-slate-400 leading-tight">{fw.liquidityDetail}</p>
                </div>

                {/* Bonds */}
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                  <span className="text-[10px] uppercase text-blue-400 font-bold block">Bond Stance</span>
                  <div className="font-semibold text-slate-200">{fw.bondStance}</div>
                  <p className="text-[10px] text-slate-400 leading-tight">{fw.bondDetail}</p>
                </div>

                {/* Equities */}
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                  <span className="text-[10px] uppercase text-indigo-400 font-bold block">Equity Signal</span>
                  <div className="font-semibold text-slate-200">{fw.equitySignal}</div>
                  <p className="text-[10px] text-slate-400 leading-tight">{fw.equityDetail}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border block text-center ${fw.badgeColor}`}>
                SYNTHESIZED IN ALPHA ENGINE
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CONSENSUS VS. CONTRADICTION RESOLUTION ENGINE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-mono font-bold text-slate-100">
            CONSENSUS VS. CONTRADICTION RESOLUTION CARDS
          </h2>
        </div>

        <div className="space-y-4">
          {contradictions.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 hover:border-cyan-500/30 transition shadow-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold font-mono text-cyan-300">{c.title}</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${c.statusColor}`}>
                  {c.status}
                </span>
              </div>

              {/* The Disagreement */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  The Cross-Framework Friction:
                </span>
                <p className="text-xs text-slate-300 font-mono leading-relaxed pl-5">{c.dispute}</p>
              </div>

              {/* Unified Resolution */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-indigo-950/40 border border-cyan-500/30 space-y-1">
                <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                  Quantitative Synthesis Engine Execution:
                </span>
                <p className="text-xs text-slate-200 font-mono leading-relaxed">{c.unifiedResolution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
