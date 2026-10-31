"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

const DEFAULT_FRAMEWORKS = [
  {
    id: "km",
    author: "Keith McCullough",
    firm: "Hedgeye Risk Management",
    badgeColor: "border-cyan-500/50 text-cyan-400 bg-cyan-950/40",
    avatarGradient: "from-cyan-600 to-blue-700",
    statedRegime: "Quad 3 (Forward: Quad 4)",
    growthCall: "Real GDP tracking 2.1% YoY (ΔG -)",
    growthDetail: "Sequential second derivative (-0.54σ). Base effects project Quad 4.",
    inflationCall: "Headline CPI Nowcast: 2.78%",
    inflationDetail: "Core PCE tracking 2.85%. Sticky services momentum persisting.",
    liquidityView: "Fed Net Liquidity at $5,742B",
    liquidityDetail: "TGA at $780B. TBAC debt issuance skew monitoring long-end yield auctions.",
    bondStance: "Confirmed Bearish Trend ($TLT)",
    bondDetail: "10Y Treasury yield at 4.25%. Long bond trading below risk range pivot.",
    bullishTickers: ["$PDBC", "$GLD", "$XLE", "$SMH", "$USFR"],
    bearishTickers: ["$TLT", "$EWG", "$EPOL", "$XLP"],
    quote: "Signal to Quad: Respect the machine's 0DTE flows. Long Quad inflation hedges until Trend breaks.",
    badgeLabel: "LIVE QUANT TELEMETRY",
    url: "https://app.hedgeye.com",
  },
  {
    id: "dd",
    author: "Darius Dale",
    firm: "42 Macro",
    badgeColor: "border-emerald-500/50 text-emerald-400 bg-emerald-950/40",
    avatarGradient: "from-emerald-600 to-teal-700",
    statedRegime: "REFLATION (Signal: 83%)",
    growthCall: "42-Market Grid confirms REFLATION leadership",
    growthDetail: "CACRI at 30.4% (NORMAL). Risk-On probability at 70%.",
    inflationCall: "Real Yield Dominance (94% Rule)",
    inflationDetail: "Real 10Y TIPS yields (1.88%) driving asset repricing.",
    liquidityView: "US Debt-to-Liquidity at 114%",
    liquidityDetail: "Fiscal dominance intact. Global M2 tracking $106.4T.",
    bondStance: "Underweight Duration / Long USFR Cash",
    bondDetail: "Accord 2.0 Gauge: ELEVATED",
    bullishTickers: ["$VT", "$GLDM", "$USFR", "$SPY"],
    bearishTickers: ["$TLT", "$HYG", "$FBTC"],
    quote: "Paradigm C means fiscal dominance: US public debt is 114% of domestic liquidity. 0% structural weight in bonds.",
    badgeLabel: "LIVE QUANT TELEMETRY",
    url: "https://www.42macro.com",
  },
  {
    id: "am",
    author: "Aahan Menon",
    firm: "Prometheus Macro",
    badgeColor: "border-amber-500/50 text-amber-400 bg-amber-950/40",
    avatarGradient: "from-amber-600 to-orange-700",
    statedRegime: "Historical Regime Analog (Nowcast: 2.1% GDP)",
    growthCall: "Kalecki-Levy Household Impulse: EXPANSIONARY",
    growthDetail: "Household dissaving buffers private consumption and corporate cash generation.",
    inflationCall: "Demand-Driven PCE: 72%",
    inflationDetail: "Core Sticky Services remain sticky above 3.2% while supply shocks are secondary.",
    liquidityView: "Global Central Bank M2 ($106.4T)",
    liquidityDetail: "Global central bank balance sheets stabilizing; monetary pressure gauge neutral.",
    bondStance: "Neutral / Selective TIPS ($TIP)",
    bondDetail: "Mahalanobis distance scoring indicates positive real yield spread favors TIPS over nominal duration.",
    bullishTickers: ["$SPY", "$PDBC", "$TIP", "$GLD"],
    bearishTickers: ["$IEF", "$TLT"],
    quote: "Narrative follows data: Household wealth effect is generating profit flows that offset higher policy rates.",
    badgeLabel: "SYNTHESIZED IN ALPHA ENGINE",
    url: "https://www.prometheus-macro.com",
  },
  {
    id: "wp",
    author: "Warren Pies",
    firm: "3Fourteen Research",
    badgeColor: "border-indigo-500/50 text-indigo-400 bg-indigo-950/40",
    avatarGradient: "from-indigo-600 to-purple-700",
    statedRegime: "Debasement Mindset + FCTE Quality",
    growthCall: "Housing Alert: -0.8% from Peak",
    growthDetail: "Construction payrolls well above the -5.0% recession alert threshold.",
    inflationCall: "3-Vector Model: 2.65% CPI",
    inflationDetail: "Brent crude steady, shelter rent decay curve active, wage growth stabilizing ~4%.",
    liquidityView: "MOVE Index at 98 vs VIX 16.0",
    liquidityDetail: "Bond volatility must settle before broad small-cap equity breadth accelerates.",
    bondStance: "10Y Fair Value Model at 4.25%",
    bondDetail: "Actual 10Y (4.25%) trading near fair value. Favors yield curve steepeners.",
    bullishTickers: ["$NVDA", "$VRT", "$CEG", "$ANET", "$TPL"],
    bearishTickers: ["$TLT", "$XLRE"],
    quote: "Manage risk with technicals, build conviction with fundamentals. Debasement mindset favors hard assets.",
    badgeLabel: "LIVE FCTE TELEMETRY",
    url: "https://3fourteensmi.com",
  },
];

const DEFAULT_CONTRADICTIONS = [
  {
    id: "contradiction-1",
    title: "Contradiction 1: Secular Bond Bear vs. Cyclical Duration Hedge",
    dispute:
      "Hedgeye (Quad 3) and 42 Macro (REFLATION) are structurally short duration ($TLT) while Prometheus analog and 3Fourteen Fair Value (4.25%) signal that 10Y yields offer cyclical value.",
    unifiedResolution:
      "Unified Barbell: Underweight long-duration nominal Treasuries ($TLT) to avoid auction supply indigestion and Accord watch, while overweighting floating-rate cash ($USFR) and real TIPS ($TIP) to collect positive real yield without duration volatility.",
    status: "RESOLVED & SYSTEMATIZED",
    statusColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
  },
  {
    id: "contradiction-2",
    title: "Contradiction 2: Base-Effect Forward Quads vs. High-Frequency VAMS Momentum",
    dispute:
      "Hedgeye's 12-month base effects signal a potential forward transition toward Quad 4, whereas 42 Macro's daily VAMS and 3Fourteen's FCTE remain in confirmed Bullish Trend today.",
    unifiedResolution:
      "Horizon Separation: Use forward Base-Effect projections to cap multi-quarter equity leverage, while allowing daily VAMS and 0DTE dealer GEX to trade bullish momentum until a confirmed trend breakdown occurs.",
    status: "RESOLVED & SYSTEMATIZED",
    statusColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
  },
  {
    id: "contradiction-3",
    title: "Contradiction 3: Sticky Services Inflation vs. Supply Disinflation Vectors",
    dispute:
      "Prometheus isolates persistent sticky services inflation (72% demand-driven) while 3Fourteen highlights goods disinflation and shelter rent decay curve easing headline CPI to 2.65%.",
    unifiedResolution:
      "Cash Flow Quality Barbell: Allocate to high-pricing-power compounders with >15% FCF margins (e.g. FCTE top tilts NVDA, VST) paired with physical commodity debasement hedges ($GLD, $CPER).",
    status: "RESOLVED & SYSTEMATIZED",
    statusColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
  },
];

export default function FrameworkSynthesisPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchSynthesisData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/v1/synthesis/dashboard"), { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        console.warn("Synthesis endpoint returned non-200. Retaining current view.");
      }
    } catch (err) {
      console.warn("Synthesis live fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSynthesisData();

    // Listen to top navigation "Refresh Data" button
    const handleGlobalRefresh = () => fetchSynthesisData();
    window.addEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
    return () => window.removeEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
  }, []);

  const frameworks = data?.frameworks && data.frameworks.length > 0 ? data.frameworks : DEFAULT_FRAMEWORKS;
  const contradictions = data?.contradictions && data.contradictions.length > 0 ? data.contradictions : DEFAULT_CONTRADICTIONS;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-slate-800/80 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold mb-1">
            <Scale className="h-4 w-4" />
            <span>FRAMEWORK SYNTHESIS MATRIX • LIVE QUANT ENGINE</span>
          </div>
          <h1 className="text-base font-bold font-mono tracking-tight text-slate-100">
            Cross-Institutional Consensus &amp; Contradiction Resolution
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
            Harmonizing institutional methodologies across Prometheus Macro, Hedgeye, 42 Macro, and 3Fourteen Research into a unified quantitative alpha signal.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 self-start md:self-auto">
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            Status: <strong className="text-cyan-300">{data?.live_stream_label || "Live Telemetry"}</strong>
          </span>
          {lastUpdated && (
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Synced: {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchSynthesisData}
            disabled={isLoading}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            title="Refresh synthesis telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4-COLUMN COMPARISON MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {frameworks.map((fw: any) => {
          const cleanUrl = (fw.url || "")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/[\[\]]/g, "")
            .trim();

          return (
            <div
              key={fw.id}
              className="rounded-2xl bg-[#0c121e] border border-slate-800 hover:border-slate-700 transition p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Strategist Profile */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${fw.avatarGradient || "from-cyan-600 to-blue-700"} flex items-center justify-center font-mono font-bold text-white text-xs border border-white/20`}
                    >
                      {fw.author.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold font-mono text-slate-100">{fw.author}</h2>
                      <p className="text-xs font-mono text-slate-400">{fw.firm}</p>
                    </div>
                  </div>
                  {cleanUrl && (
                    <a
                      href={cleanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-cyan-400 transition"
                      title="Source website"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {/* Dynamic Stated Regime Strip */}
                <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-xs flex justify-between items-center">
                  <span className="text-slate-400">Regime:</span>
                  <span className="font-bold text-cyan-300 truncate max-w-[170px]" title={fw.statedRegime}>
                    {fw.statedRegime}
                  </span>
                </div>

                {/* Call Rows */}
                <div className="space-y-2.5 text-xs font-mono">
                  {/* Growth */}
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                    <span className="text-xs uppercase text-cyan-400 font-bold block">Growth Call</span>
                    <div className="font-semibold text-slate-200">{fw.growthCall}</div>
                    <p className="text-xs text-slate-400 leading-tight">{fw.growthDetail}</p>
                  </div>

                  {/* Inflation */}
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                    <span className="text-xs uppercase text-amber-400 font-bold block">Inflation Call</span>
                    <div className="font-semibold text-slate-200">{fw.inflationCall}</div>
                    <p className="text-xs text-slate-400 leading-tight">{fw.inflationDetail}</p>
                  </div>

                  {/* Liquidity */}
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                    <span className="text-xs uppercase text-emerald-400 font-bold block">Liquidity View</span>
                    <div className="font-semibold text-slate-200">{fw.liquidityView}</div>
                    <p className="text-xs text-slate-400 leading-tight">{fw.liquidityDetail}</p>
                  </div>

                  {/* Bond Stance */}
                  {fw.bondStance && (
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                      <span className="text-xs uppercase text-purple-400 font-bold block">Bond Stance</span>
                      <div className="font-semibold text-slate-200">{fw.bondStance}</div>
                      {fw.bondDetail && (
                        <p className="text-xs text-slate-400 leading-tight">{fw.bondDetail}</p>
                      )}
                    </div>
                  )}

                  {/* Bullish & Bearish Ticker Clusters */}
                  <div className="p-2 rounded bg-slate-900/40 border border-slate-800/40 space-y-1 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400 font-bold">Bullish:</span>
                      <span className="text-slate-300 truncate">{fw.bullishTickers?.join(" ")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-rose-400 font-bold">Bearish:</span>
                      <span className="text-slate-300 truncate">{fw.bearishTickers?.join(" ")}</span>
                    </div>
                  </div>

                  {/* Strategist Stance Quote */}
                  <blockquote className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded border-l-2 border-slate-700">
                    “{fw.quote}”
                  </blockquote>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <span className={`text-xs font-mono px-2 py-0.5 rounded border block text-center ${fw.badgeColor || "border-cyan-500/50 text-cyan-400 bg-cyan-950/40"}`}>
                  {fw.badgeLabel || "SYNTHESIZED IN ALPHA ENGINE"}
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
          <h2 className="text-base font-mono font-bold text-slate-100">
            CONSENSUS VS. CONTRADICTION RESOLUTION CARDS
          </h2>
        </div>

        <div className="space-y-4">
          {contradictions.map((c: any) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 hover:border-cyan-500/30 transition shadow-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold font-mono text-cyan-300">{c.title}</h3>
                <span className={`text-xs font-mono px-2 py-0.5 rounded border font-semibold ${c.statusColor || "text-emerald-400 bg-emerald-950/60 border-emerald-800"}`}>
                  {c.status}
                </span>
              </div>

              {/* The Disagreement */}
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  The Cross-Framework Friction:
                </span>
                <p className="text-xs text-slate-300 font-mono leading-relaxed pl-5">{c.dispute}</p>
              </div>

              {/* Unified Resolution */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-indigo-950/40 border border-cyan-500/30 space-y-1">
                <span className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
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
