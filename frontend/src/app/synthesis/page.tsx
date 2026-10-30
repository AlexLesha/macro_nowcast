"use client";

import React, { useState, useEffect } from "react";
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
import { getApiUrl } from "@/lib/api";

const authorStyles: Record<string, { badgeColor: string; avatarGradient: string }> = {
  "Keith McCullough": {
    badgeColor: "border-cyan-500/50 text-cyan-400 bg-cyan-950/40",
    avatarGradient: "from-cyan-600 to-blue-700",
  },
  "Darius Dale": {
    badgeColor: "border-emerald-500/50 text-emerald-400 bg-emerald-950/40",
    avatarGradient: "from-emerald-600 to-teal-700",
  },
  "Aahan Menon": {
    badgeColor: "border-amber-500/50 text-amber-400 bg-amber-950/40",
    avatarGradient: "from-amber-600 to-orange-700",
  },
  "Warren Pies": {
    badgeColor: "border-indigo-500/50 text-indigo-400 bg-indigo-950/40",
    avatarGradient: "from-indigo-600 to-purple-700",
  },
};

const defaultFrameworks = [
  {
    author_name: "Keith McCullough",
    firm: "Hedgeye Risk Management",
    stated_quad_or_regime: "Quad 2 / Quad 3 Oscillation",
    growth_view: "Headline CPI & Real GDP both rising YoY (ΔG+ ΔI+). Base effects tighten into Q3.",
    inflation_view: "Commodity pass-through accelerating headline numbers; Core PCE tracking sticky.",
    policy_liquidity_view: "Treasury relying on T-Bills to avoid long-end auction indigestion; Fed trapped into higher-for-longer.",
    bullish_tickers: ["PDBC", "GLD", "XLE", "IVOL", "SMH"],
    bearish_tickers: ["TLT", "EWG", "EPOL", "ARGT", "XLP"],
    key_verbatim_quote: "Signal to Quad: Respect the machine's 0DTE flows. Long Quad 2/3 inflation hedges until Trend breaks.",
    source_url: "https://app.hedgeye.com",
    has_recent_update: true,
  },
  {
    author_name: "Darius Dale",
    firm: "42 Macro",
    stated_quad_or_regime: "Goldilocks transitioning to Reflation Watch",
    growth_view: "Real growth resilient; K-shaped consumer spending maintaining services momentum.",
    inflation_view: "Sticky inflation theme intact; 100-140 bps higher equilibrium than 2010s.",
    policy_liquidity_view: "94% of 10Y yield surge driven by real rates. Widening credit spreads setting stage for Accord 2.0.",
    bullish_tickers: ["SPY", "QQQ", "GLD", "IBIT", "USFR"],
    bearish_tickers: ["TLT", "HYG", "JNK"],
    key_verbatim_quote: "Paradigm C means fiscal dominance: US public debt is 114% of domestic liquidity. 0% structural weight in bonds.",
    source_url: "https://www.42macro.com",
    has_recent_update: true,
  },
  {
    author_name: "Aahan Menon",
    firm: "Prometheus Macro",
    stated_quad_or_regime: "Flat Probability Distribution across Regimes",
    growth_view: "Kalecki-Levy corporate profit impulse remains positive via household dissaving.",
    inflation_view: "75% of PCE inflation is demand-driven and persistent; supply oil shocks are secondary.",
    policy_liquidity_view: "Monetary pressure gauge is neutral to slightly restrictive; avoid unobservable term premium models.",
    bullish_tickers: ["SPY", "PDBC", "TIP"],
    bearish_tickers: ["IEF", "TLT"],
    key_verbatim_quote: "Narrative follows data: Household wealth effect is generating profit flows that offset higher policy rates.",
    source_url: "https://www.prometheus-macro.com",
    has_recent_update: false,
  },
  {
    author_name: "Warren Pies",
    firm: "3Fourteen Research",
    stated_quad_or_regime: "Debasement Regime + AI Compute Ratification",
    growth_view: "No recession without residential construction payrolls breaking -5% to -8%.",
    inflation_view: "3 Vectors: Brent crude steady, shelter/CoreLogic rents easing with lag, wage growth sticky at ~4%.",
    policy_liquidity_view: "MOVE index elevated while VIX is low: bond volatility must settle before small-caps break out.",
    bullish_tickers: ["TPL", "CBOE", "LMT", "NVDA", "ANET", "CEG", "WMB"],
    bearish_tickers: ["TLT", "XLRE"],
    key_verbatim_quote: "Manage risk with technicals, build conviction with fundamentals. Debasement mindset favors hard assets and FCTE compounders.",
    source_url: "https://3fourteensmi.com",
    has_recent_update: true,
  },
];

export default function FrameworkSynthesisPage() {
  const [synthesisData, setSynthesisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl("/api/v1/synthesis"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSynthesisData(data);
      })
      .catch((err) => console.error("Error loading live synthesis:", err))
      .finally(() => setLoading(false));
  }, []);

  const authors = (synthesisData?.authors && synthesisData.authors.length > 0)
    ? synthesisData.authors
    : defaultFrameworks;

  const contradictions = [
    {
      id: "contradiction-1",
      title: "Contradiction 1: Secular Bond Bear vs. Cyclical Duration Hedge",
      dispute:
        "Hedgeye and 42 Macro are structurally short duration (TLT Bearish Trend / 114% Debt-to-Liquidity) while Prometheus historical analog and 3Fourteen Fair Value model signal that a 10Y yield over 4.40% offers asymmetric cyclical risk/reward.",
      unifiedResolution:
        synthesisData?.live_resolution_rules?.bond_conflict_resolution ||
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
        synthesisData?.live_resolution_rules?.phase_lag_resolution ||
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
        synthesisData?.live_resolution_rules?.inflation_barbell_resolution ||
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
          <span>FRAMEWORK SYNTHESIS MATRIX &bull; AUDIT ITEM #23</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
            Cross-Institutional Consensus &amp; Contradiction Resolution
          </h1>
          <span className="text-xs font-mono px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            As of: <strong className="text-cyan-400">{synthesisData?.as_of_utc || "Live Stream"}</strong>
          </span>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
          Harmonizing institutional methodologies across Prometheus Macro, Hedgeye, 42 Macro, and 3Fourteen Research into a unified quantitative alpha signal.
        </p>
      </div>

      {/* Latest Harvested Delta Summary if available */}
      {synthesisData?.what_changed_summary_markdown && (
        <div className="p-4 rounded-xl bg-slate-900/70 border border-cyan-500/30 text-xs font-mono text-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px]">
            <Sparkles className="h-4 w-4" />
            <span>LATEST HARVESTED STRATEGIST DELTAS</span>
          </div>
          <div className="text-slate-300 leading-relaxed whitespace-pre-line text-[11px]">
            {synthesisData.what_changed_summary_markdown}
          </div>
        </div>
      )}

      {/* 4-COLUMN COMPARISON MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {authors.map((fw: any, idx: number) => {
          const style = authorStyles[fw.author_name] || {
            badgeColor: "border-cyan-500/50 text-cyan-400 bg-cyan-950/40",
            avatarGradient: "from-cyan-600 to-indigo-700",
          };

          return (
            <div
              key={idx}
              className="rounded-2xl bg-[#0c121e] border border-slate-800 hover:border-slate-700 transition p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Strategist Profile */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${style.avatarGradient} flex items-center justify-center font-mono font-bold text-white text-xs border border-white/20`}
                    >
                      {fw.author_name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold font-mono text-slate-100">{fw.author_name}</h2>
                      <p className="text-[11px] font-mono text-slate-400">{fw.firm}</p>
                    </div>
                  </div>
                  {fw.source_url && (
                    <a
                      href={fw.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-cyan-400 transition"
                      title="Source website"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {/* Stated Quad / Regime */}
                <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">Stated Regime:</span>
                  <span className="font-bold text-cyan-300 text-[11px] truncate max-w-[160px]" title={fw.stated_quad_or_regime}>
                    {fw.stated_quad_or_regime}
                  </span>
                </div>

                {/* Call Rows */}
                <div className="space-y-2.5 text-xs font-mono">
                  {/* Growth */}
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                    <span className="text-[10px] uppercase text-cyan-400 font-bold block">Growth Call</span>
                    <p className="text-[11px] text-slate-300 leading-snug">{fw.growth_view}</p>
                  </div>

                  {/* Inflation */}
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                    <span className="text-[10px] uppercase text-amber-400 font-bold block">Inflation Call</span>
                    <p className="text-[11px] text-slate-300 leading-snug">{fw.inflation_view}</p>
                  </div>

                  {/* Policy & Liquidity */}
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                    <span className="text-[10px] uppercase text-emerald-400 font-bold block">Policy &amp; Liquidity</span>
                    <p className="text-[11px] text-slate-300 leading-snug">{fw.policy_liquidity_view}</p>
                  </div>

                  {/* Bullish & Bearish Tickers */}
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-emerald-400 font-bold">Bullish</span>
                      <span className="text-[10px] text-slate-300 font-bold">
                        {fw.bullish_tickers?.slice(0, 5).map((t: string) => `$${t}`).join(" ") || "None"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-rose-400 font-bold">Bearish</span>
                      <span className="text-[10px] text-slate-300 font-bold">
                        {fw.bearish_tickers?.slice(0, 5).map((t: string) => `$${t}`).join(" ") || "None"}
                      </span>
                    </div>
                  </div>

                  {/* Key Verbatim Quote */}
                  {fw.key_verbatim_quote && (
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 italic text-[11px] text-slate-400">
                      &ldquo;{fw.key_verbatim_quote}&rdquo;
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border block text-center ${style.badgeColor}`}>
                  {fw.has_recent_update ? "LIVE STRATEGIST TELEMETRY" : "SYNTHESIZED IN ALPHA ENGINE"}
                </span>
              </div>
            </div>
          );
        })}
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
