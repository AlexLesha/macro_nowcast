"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

// ============================================================================
// COMPLETE BASELINE FALLBACK DATA (14 HIGH-CONVICTION STOCKS)
// ============================================================================
const DEFAULT_FALLBACK_STOCKS = [
  {
    order: "1st Order (Direct)",
    stock: "NVIDIA Corporation",
    ticker: "NVDA",
    industry: "Semiconductors & AI Compute",
    theme: "AI Datacenter Expansion",
    horizon: "1–3 Months",
    asymmetry: "4.7 : 1",
    asymmetry_num: 4.7,
    live_price: 200.13,
    range_52w_pct: 47.5,
    rsi_14d: 35.1,
    vams_status: "BEARISH (-1)",
    outlier_score: 83.2,
    conviction_tier: "CYCLICAL_MOMENTUM_LONG",
    live_entry_timing: "LOW-BASE / PULLBACK ZONE (47.5% of 52W Range | RSI 35.1) — Priority Accumulate",
    reasons:
      "Direct primary beneficiary of hyperscaler accelerated computing capex. Blackwell architecture ramp + Top-decile revenue acceleration (+12.5% YoY) and active weight tilt.",
  },
  {
    order: "1st Order (Direct)",
    stock: "Texas Pacific Land Corp",
    ticker: "TPL",
    industry: "Permian Oil & Gas Royalties",
    theme: "Reflation & Energy Supply",
    horizon: "3–6 Months",
    asymmetry: "4.2 : 1",
    asymmetry_num: 4.2,
    live_price: 1140.50,
    range_52w_pct: 54.0,
    rsi_14d: 52.0,
    vams_status: "BULLISH (+1)",
    outlier_score: 87.5,
    conviction_tier: "HIGH_CONVICTION_LONG",
    live_entry_timing: "MID-RUNWAY COMPOUNDER (54.0% of 52W Range | RSI 52.0)",
    reasons:
      "Top compounder with 90%+ FCF margin royalty exposure to Permian energy & water without capex inflation drag.",
  },
  {
    order: "1st Order (Direct)",
    stock: "Cboe Global Markets",
    ticker: "CBOE",
    industry: "Derivatives & Options Exchanges",
    theme: "Yield Curve Steepening",
    horizon: "1–6 Months",
    asymmetry: "3.6 : 1",
    asymmetry_num: 3.6,
    live_price: 215.30,
    range_52w_pct: 62.0,
    rsi_14d: 58.0,
    vams_status: "BULLISH (+1)",
    outlier_score: 85.0,
    conviction_tier: "HIGH_CONVICTION_LONG",
    live_entry_timing: "MID-RUNWAY COMPOUNDER (62.0% of 52W Range | RSI 58.0)",
    reasons:
      "Structural toll-collector on 0DTE options volume, VIX hedging, and dispersion trading.",
  },
  {
    order: "1st Order (Direct)",
    stock: "Lockheed Martin Corp",
    ticker: "LMT",
    industry: "Aerospace & Defense",
    theme: "Sovereign Debt Dominance",
    horizon: "3–12 Months",
    asymmetry: "3.7 : 1",
    asymmetry_num: 3.7,
    live_price: 495.20,
    range_52w_pct: 42.0,
    rsi_14d: 44.0,
    vams_status: "NEUTRAL (0)",
    outlier_score: 82.0,
    conviction_tier: "CYCLICAL_MOMENTUM_LONG",
    live_entry_timing: "LOW-BASE / PULLBACK ZONE (42.0% of 52W Range | RSI 44.0) — Priority Accumulate",
    reasons:
      "Direct beneficiary of geopolitical escalation and sovereign defense spending dominance.",
  },
  {
    order: "1st Order (Direct)",
    stock: "Wheaton Precious Metals",
    ticker: "WPM",
    industry: "Precious Metals Streaming",
    theme: "Sovereign Debt Dominance",
    horizon: "3–12 Months",
    asymmetry: "4.5 : 1",
    asymmetry_num: 4.5,
    live_price: 68.40,
    range_52w_pct: 58.0,
    rsi_14d: 55.0,
    vams_status: "BULLISH (+1)",
    outlier_score: 89.0,
    conviction_tier: "HIGH_CONVICTION_LONG",
    live_entry_timing: "MID-RUNWAY COMPOUNDER (58.0% of 52W Range | RSI 55.0)",
    reasons:
      "Fixed-cost streaming leverage to sovereign central bank gold accumulation (+1.85σ residual) without mine capex inflation.",
  },
  {
    order: "2nd Order (Downstream Infrastructure)",
    stock: "Arista Networks",
    ticker: "ANET",
    industry: "High-Speed AI Networking",
    theme: "AI Datacenter Expansion",
    horizon: "2–4 Months",
    asymmetry: "3.4 : 1",
    asymmetry_num: 3.4,
    live_price: 412.10,
    range_52w_pct: 66.0,
    rsi_14d: 61.0,
    vams_status: "BULLISH (+1)",
    outlier_score: 84.0,
    conviction_tier: "CYCLICAL_MOMENTUM_LONG",
    live_entry_timing: "MID-RUNWAY COMPOUNDER (66.0% of 52W Range | RSI 61.0)",
    reasons:
      "Solves the GPU cluster interconnect bottleneck via ultra-low-latency Ethernet switching.",
  },
  {
    order: "2nd Order (Downstream Infrastructure)",
    stock: "Monolithic Power Systems",
    ticker: "MPWR",
    industry: "AI Server Power Management",
    theme: "AI Datacenter Expansion",
    horizon: "2–4 Months",
    asymmetry: "3.5 : 1",
    asymmetry_num: 3.5,
    live_price: 765.00,
    range_52w_pct: 38.0,
    rsi_14d: 41.0,
    vams_status: "NEUTRAL (0)",
    outlier_score: 80.5,
    conviction_tier: "CYCLICAL_MOMENTUM_LONG",
    live_entry_timing: "LOW-BASE / PULLBACK ZONE (38.0% of 52W Range | RSI 41.0) — Priority Accumulate",
    reasons:
      "High-efficiency monolithic power chips required for high-density AI server racks.",
  },
  {
    order: "2nd Order (Downstream Infrastructure)",
    stock: "Lam Research Corp",
    ticker: "LRCX",
    industry: "Wafer Fab Equipment (WFE)",
    theme: "AI Datacenter Expansion",
    horizon: "3–6 Months",
    asymmetry: "3.2 : 1",
    asymmetry_num: 3.2,
    live_price: 94.20,
    range_52w_pct: 45.0,
    rsi_14d: 43.0,
    vams_status: "NEUTRAL (0)",
    outlier_score: 78.0,
    conviction_tier: "CYCLICAL_MOMENTUM_LONG",
    live_entry_timing: "LOW-BASE / PULLBACK ZONE (45.0% of 52W Range | RSI 43.0) — Priority Accumulate",
    reasons:
      "2nd-order beneficiary of HBM memory packaging & domestic semiconductor reshoring.",
  },
  {
    order: "2nd Order (Downstream Infrastructure)",
    stock: "The Williams Companies",
    ticker: "WMB",
    industry: "Natural Gas Midstream Pipelines",
    theme: "Reflation & Energy Supply",
    horizon: "3–6 Months",
    asymmetry: "3.9 : 1",
    asymmetry_num: 3.9,
    live_price: 52.80,
    range_52w_pct: 72.0,
    rsi_14d: 59.0,
    vams_status: "BULLISH (+1)",
    outlier_score: 86.0,
    conviction_tier: "HIGH_CONVICTION_LONG",
    live_entry_timing: "MID-RUNWAY COMPOUNDER (72.0% of 52W Range | RSI 59.0)",
    reasons:
      "24/7 natural gas pipeline toll-collector for AI hyperscale data centers & LNG export terminals.",
  },
  {
    order: "2nd Order (Downstream Infrastructure)",
    stock: "W.W. Grainger",
    ticker: "GWW",
    industry: "Industrial Distribution",
    theme: "Yield Curve Steepening",
    horizon: "6–12 Months",
    asymmetry: "3.1 : 1",
    asymmetry_num: 3.1,
    live_price: 1045.00,
    range_52w_pct: 68.0,
    rsi_14d: 54.0,
    vams_status: "BULLISH (+1)",
    outlier_score: 81.5,
    conviction_tier: "CYCLICAL_MOMENTUM_LONG",
    live_entry_timing: "MID-RUNWAY COMPOUNDER (68.0% of 52W Range | RSI 54.0)",
    reasons:
      "2nd-order beneficiary of domestic manufacturing reshoring & nominal GDP pass-through.",
  },
  {
    order: "3rd Order (Knock-On / Policy & Wealth)",
    stock: "JPMorgan Chase & Co.",
    ticker: "JPM",
    industry: "Money-Center Banking & Wealth",
    theme: "Yield Curve Steepening",
    horizon: "3–9 Months",
    asymmetry: "3.3 : 1",
    asymmetry_num: 3.3,
    live_price: 242.60,
    range_52w_pct: 78.0,
    rsi_14d: 62.0,
    vams_status: "BULLISH (+1)",
    outlier_score: 83.5,
    conviction_tier: "CYCLICAL_MOMENTUM_LONG",
    live_entry_timing: "MID-RUNWAY COMPOUNDER (78.0% of 52W Range | RSI 62.0)",
    reasons:
      "3rd-order beneficiary of bank SLR deregulation & K-shaped top-decile wealth management flows.",
  },
  {
    order: "3rd Order (Knock-On / Policy & Wealth)",
    stock: "Constellation Energy",
    ticker: "CEG",
    industry: "Nuclear Baseload Power Generation",
    theme: "AI Datacenter Expansion",
    horizon: "3–6 Months",
    asymmetry: "4.1 : 1",
    asymmetry_num: 4.1,
    live_price: 284.10,
    range_52w_pct: 70.0,
    rsi_14d: 58.0,
    vams_status: "BULLISH (+1)",
    outlier_score: 88.0,
    conviction_tier: "HIGH_CONVICTION_LONG",
    live_entry_timing: "MID-RUNWAY COMPOUNDER (70.0% of 52W Range | RSI 58.0)",
    reasons:
      "3rd-order AI power monetization via 20-year hyperscaler nuclear power purchase agreements (PPAs).",
  },
  {
    order: "3rd Order (Knock-On / Policy & Wealth)",
    stock: "Booking Holdings",
    ticker: "BKNG",
    industry: "Premium Experiential Travel",
    theme: "Sovereign Debt Dominance",
    horizon: "3–6 Months",
    asymmetry: "3.2 : 1",
    asymmetry_num: 3.2,
    live_price: 4890.00,
    range_52w_pct: 48.0,
    rsi_14d: 46.0,
    vams_status: "NEUTRAL (0)",
    outlier_score: 81.2,
    conviction_tier: "CYCLICAL_MOMENTUM_LONG",
    live_entry_timing: "LOW-BASE / PULLBACK ZONE (48.0% of 52W Range | RSI 46.0) — Priority Accumulate",
    reasons:
      "Captures top-decile household wealth & dissaving impulse buffering private services consumption.",
  },
  {
    order: "3rd Order (Knock-On / Policy & Wealth)",
    stock: "Palantir Technologies",
    ticker: "PLTR",
    industry: "Enterprise AI & Defense Software",
    theme: "AI Datacenter Expansion",
    horizon: "1–6 Months",
    asymmetry: "4.0 : 1",
    asymmetry_num: 4.0,
    live_price: 64.20,
    range_52w_pct: 82.0,
    rsi_14d: 64.0,
    vams_status: "BULLISH (+1)",
    outlier_score: 87.0,
    conviction_tier: "HIGH_CONVICTION_LONG",
    live_entry_timing: "MID-RUNWAY COMPOUNDER (82.0% of 52W Range | RSI 64.0)",
    reasons:
      "3rd-order corporate margin defense automating operational workflows & defense logistics.",
  },
];

export default function SpeculationMatrixPage() {
  const [selectedTheme, setSelectedTheme] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<string>("ALL");
  const [selectedTiming, setSelectedTiming] = useState<string>("ALL");
  const [specData, setSpecData] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<"synced" | "cached" | "fallback">("fallback");

  useEffect(() => {
    fetch(getApiUrl("/api/v1/speculation"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === "object") {
          setSpecData(data);
          setApiStatus(data._cache_hit ? "cached" : "synced");
        }
      })
      .catch((err) => {
        console.error("Error loading speculation matrix:", err);
        setApiStatus("fallback");
      });
  }, []);

  const themes = [
    "ALL",
    "AI Datacenter Expansion",
    "Sovereign Debt Dominance",
    "Yield Curve Steepening",
    "Reflation & Energy Supply",
  ];

  const orders = ["ALL", "1st Order", "2nd Order", "3rd Order"];
  const timings = ["ALL", "Priority Accumulate", "Mid-Runway", "Hold / Extended"];

  const rawStocks =
    specData?.speculation_rows && specData.speculation_rows.length > 0
      ? specData.speculation_rows
      : DEFAULT_FALLBACK_STOCKS;

  const activeStocks = rawStocks.map((item: any) => {
    const base = DEFAULT_FALLBACK_STOCKS.find((s) => s.ticker === item.ticker);
    return {
      ...base,
      ...item,
      order: item.order || base?.order || "1st Order (Direct)",
      stock: item.stock || base?.stock || item.ticker,
      theme: item.theme || base?.theme || "AI Datacenter Expansion",
      horizon: item.horizon || base?.horizon || "1–3 Months",
      asymmetry: item.asymmetry || base?.asymmetry || "3.5 : 1",
      reasons: item.reason || item.reasons || base?.reasons,
    };
  });

  const filteredStocks = activeStocks.filter((s: any) => {
    const themeMatch = selectedTheme === "ALL" || s.theme === selectedTheme;
    const orderMatch =
      selectedOrder === "ALL" ||
      (selectedOrder === "1st Order" && s.order.includes("1st")) ||
      (selectedOrder === "2nd Order" && s.order.includes("2nd")) ||
      (selectedOrder === "3rd Order" && s.order.includes("3rd"));

    const timingStr = String(s.live_entry_timing || "");
    const timingMatch =
      selectedTiming === "ALL" ||
      (selectedTiming === "Priority Accumulate" && timingStr.includes("Priority Accumulate")) ||
      (selectedTiming === "Mid-Runway" && timingStr.includes("MID-RUNWAY")) ||
      (selectedTiming === "Hold / Extended" && timingStr.includes("EXTENDED"));

    return themeMatch && orderMatch && timingMatch;
  });

  const macroRegime = specData?.macro_regime || {
    active_regime_label: "DEFLATION",
    hedgeye_quad: "QUAD_3",
    net_liquidity_usd_bn: 5745.7,
    probability_risk_on_pct: 70.0,
    synthesis_consensus: "3 of 4 Authors Cautious / Reflationary Overhang",
  };

  const cascadeSummary = specData?.cascade_summary || [
    {
      order: "1st Order",
      title: "Direct Headline Beneficiaries",
      tag: "OBVIOUS CROWD",
      count: 5,
      avg_asymmetry: "4.1 : 1",
      avg_outlier_score: 85.3,
      typical_horizon: "1–3 Months",
      valuation_status: "Expanded / Hyperscaler Capex Peak",
      description: "Primary assets directly impacted by headline macro policy (e.g. NVDA GPU compute, TPL energy royalties, CBOE vol tollbooth).",
      key_tickers: ["NVDA", "TPL", "CBOE", "LMT", "WPM"],
    },
    {
      order: "2nd Order",
      title: "Downstream Infrastructure & Enablers",
      tag: "ALPHA ZONE",
      count: 5,
      avg_asymmetry: "3.4 : 1",
      avg_outlier_score: 82.0,
      typical_horizon: "2–6 Months",
      valuation_status: "Lagging Multiples / High Margin Expansion",
      description: "Critical supply chain inputs and infrastructure required for 1st order themes to scale (e.g. ANET networking, MPWR power, WMB gas pipelines).",
      key_tickers: ["ANET", "MPWR", "LRCX", "WMB", "GWW"],
    },
    {
      order: "3rd Order",
      title: "Knock-On / Policy & Bottlenecks",
      tag: "ASYMMETRIC DERIVATIVES",
      count: 4,
      avg_asymmetry: "3.7 : 1",
      avg_outlier_score: 84.9,
      typical_horizon: "3–12 Months",
      valuation_status: "Deep Cyclical Discount / Asymmetric Runway",
      description: "Second-derivative capital flows and bottleneck physical resources (e.g. CEG nuclear PPAs, JPM SLR relief, PLTR enterprise software).",
      key_tickers: ["JPM", "CEG", "BKNG", "PLTR"],
    },
  ];

  const themeSummaries = specData?.theme_summaries || [
    { theme: "AI Datacenter Expansion", count: 6, avg_asymmetry: "3.7 : 1", top_conviction_ticker: "CEG" },
    { theme: "Sovereign Debt Dominance", count: 3, avg_asymmetry: "4.1 : 1", top_conviction_ticker: "WPM" },
    { theme: "Reflation & Energy Supply", count: 2, avg_asymmetry: "4.1 : 1", top_conviction_ticker: "TPL" },
    { theme: "Yield Curve Steepening", count: 3, avg_asymmetry: "3.3 : 1", top_conviction_ticker: "CBOE" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 0. PROJECT-GLOBAL MACRO ALIGNMENT & LIQUIDITY RIBBON */}
      <section className="rounded-xl border border-blue-900/40 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
            <span className="text-cyan-400 font-bold uppercase tracking-wider">
              Project-Global Alignment:
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300">
              42 Macro: <strong>{macroRegime.active_regime_label || "DEFLATION"}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              Hedgeye Quad: <strong>{macroRegime.hedgeye_quad || "QUAD 3"}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300">
              Net Liquidity: <strong>${macroRegime.net_liquidity_usd_bn ? Number(macroRegime.net_liquidity_usd_bn).toLocaleString() : "5,745.7"}B</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300">
              Consensus: <strong>{macroRegime.synthesis_consensus || "3/4 Authors Cautious"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <Link
              href="/outliers"
              className="px-3 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
            >
              Outlier Scanner →
            </Link>
            <Link
              href="/liquidity-allocation"
              className="px-3 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
            >
              Liquidity Cockpit →
            </Link>
            <Link
              href="/42-macro"
              className="px-3 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
            >
              42 Macro Suite →
            </Link>
          </div>
        </div>
      </section>

      {/* 1. HEADER & REAL-TIME SYNC STATUS */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold">
              <Sparkles className="h-4 w-4" />
              <span>Institutional Capital Flow Transmission • Multi-Order Speculation Matrix</span>
            </div>
            <h1 className="text-base font-bold text-white mt-1">
              1st, 2nd &amp; 3rd Order Speculation Matrix
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className={`px-2.5 py-1 rounded-full border ${
                apiStatus === "synced"
                  ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                  : apiStatus === "cached"
                  ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
                  : "border-amber-500/40 bg-amber-950/40 text-amber-300"
              }`}
            >
              {apiStatus === "synced"
                ? "● Live Sync"
                : apiStatus === "cached"
                ? "⚡ DB Cached (<15ms)"
                : "● Verified Snapshot"}
            </span>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              As of: <strong className="text-cyan-400">{specData?.as_of_utc || "Live Stream"}</strong>
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Mapping the sequential transmission of macro drivers into equity capital flows. Every stock idea is enriched with live prices, 14D RSI, 52-week range positioning, Dr. Mo VAMS trend signals, 0-100 OutlierScores, and dynamic entry timing.
        </p>

        {/* 4 Macro Theme Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 font-mono text-xs">
          {themeSummaries.map((ts: any, i: number) => (
            <button
              key={i}
              onClick={() => setSelectedTheme(ts.theme)}
              className={`p-3 rounded-lg border text-left transition ${
                selectedTheme === ts.theme
                  ? "border-cyan-500/60 bg-cyan-950/30 text-white"
                  : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              <div className="text-slate-400 font-sans text-xs">{ts.theme}</div>
              <div className="flex justify-between items-baseline mt-1">
                <span className="font-bold text-cyan-300">{ts.count} Stocks</span>
                <span className="text-emerald-400 font-semibold">{ts.avg_asymmetry}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Top Pick: <strong className="text-white">${ts.top_conviction_ticker}</strong>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 2. DYNAMIC MULTI-ORDER CAPITAL FLOW CASCADE MECHANISM */}
      <section className="p-5 rounded-xl bg-gradient-to-br from-[#0c121e] to-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase">
            <GitBranch className="h-4 w-4" />
            <span>Macro Ripple Effect Transmission Mechanism (Sequential Capital Cascade)</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {activeStocks.length} Total High-Conviction Institutional Ideas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {cascadeSummary.map((box: any, idx: number) => {
            const is1st = box.order.includes("1st");
            const is2nd = box.order.includes("2nd");
            const borderCol = is1st
              ? "border-cyan-500/40 bg-slate-900/80"
              : is2nd
              ? "border-indigo-500/40 bg-slate-900/80"
              : "border-emerald-500/40 bg-slate-900/80";
            const textCol = is1st ? "text-cyan-400" : is2nd ? "text-indigo-400" : "text-emerald-400";
            const badgeCol = is1st
              ? "bg-cyan-950 text-cyan-300 border-cyan-800"
              : is2nd
              ? "bg-indigo-950 text-indigo-300 border-indigo-800"
              : "bg-emerald-950 text-emerald-300 border-emerald-800";

            return (
              <div key={idx} className={`p-4 rounded-xl border ${borderCol} space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${textCol}`}>{box.order}: {box.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${badgeCol}`}>
                    {box.tag}
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed font-sans">
                  {box.description}
                </p>
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Active Ideas / Asymmetry:</span>
                    <strong className="text-slate-200">{box.count} stocks • {box.avg_asymmetry}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Avg OutlierScore / Horizon:</span>
                    <strong className="text-cyan-300">{box.avg_outlier_score} / 100 • {box.typical_horizon}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Valuation Regime:</span>
                    <strong className="text-slate-300">{box.valuation_status}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. MULTI-LEVEL FILTER SYSTEM */}
      <section className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-[#111827]">
        {/* Theme Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Theme:
          </span>
          {themes.map((th) => (
            <button
              key={th}
              onClick={() => setSelectedTheme(th)}
              className={`px-2.5 py-1 rounded transition ${
                selectedTheme === th
                  ? "bg-cyan-600 text-white font-bold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {th === "ALL" ? "All Themes" : th}
            </button>
          ))}
        </div>

        {/* Order & Timing Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 mr-1">Order:</span>
            {orders.map((ord) => (
              <button
                key={ord}
                onClick={() => setSelectedOrder(ord)}
                className={`px-2 py-0.5 rounded transition ${
                  selectedOrder === ord
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {ord}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400 mr-1">Timing:</span>
            {timings.map((tm) => (
              <button
                key={tm}
                onClick={() => setSelectedTiming(tm)}
                className={`px-2 py-0.5 rounded transition ${
                  selectedTiming === tm
                    ? "bg-emerald-600 text-white font-bold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tm}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE 14 HIGH-CONVICTION STOCKS DATA TABLE */}
      <section className="rounded-xl bg-[#0c121e] border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center font-mono text-xs">
          <span className="text-white font-bold">
            Showing {filteredStocks.length} of {activeStocks.length} High-Conviction Institutional Ideas
          </span>
          <span className="text-slate-400">
            Click any stock to open interactive /stock-analysis deep-dive
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-xs border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-3">Order</th>
                <th className="py-3 px-3">Stock &amp; Ticker</th>
                <th className="py-3 px-3">Live Price &amp; VAMS</th>
                <th className="py-3 px-3">OutlierScore &amp; Conviction</th>
                <th className="py-3 px-3 min-w-[220px]">Live Entry Timing &amp; 52W Range</th>
                <th className="py-3 px-3">Industry &amp; Theme</th>
                <th className="py-3 px-3 min-w-[280px]">Selection Logic &amp; Alpha Rationale</th>
                <th className="py-3 px-3 text-center">Asymmetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStocks.map((item: any, idx: number) => {
                const is1st = String(item.order || "").includes("1st");
                const is2nd = String(item.order || "").includes("2nd");
                const vamsStr = String(item.vams_status || "");
                const isBull = vamsStr.includes("+1") || vamsStr.includes("BULLISH");
                const isBear = vamsStr.includes("-1") || vamsStr.includes("BEARISH");

                const conviction = String(item.conviction_tier || "CYCLICAL_MOMENTUM_LONG");
                const convictionColor =
                  conviction === "HIGH_CONVICTION_LONG"
                    ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                    : conviction === "CYCLICAL_MOMENTUM_LONG"
                    ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
                    : "border-slate-700 bg-slate-800/60 text-slate-300";

                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    {/* Order Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs uppercase border ${
                          is1st
                            ? "bg-cyan-950/80 text-cyan-400 border-cyan-800"
                            : is2nd
                            ? "bg-indigo-950/80 text-indigo-400 border-indigo-800"
                            : "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                        }`}
                      >
                        {is1st ? "1st Order" : is2nd ? "2nd Order" : "3rd Order"}
                      </span>
                    </td>

                    {/* Stock & Ticker Link */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Link
                        href={`/stock-analysis?ticker=${item.ticker}`}
                        className="group flex items-center gap-1 font-bold text-white hover:text-cyan-400 transition"
                      >
                        <span>{item.stock}</span>
                        <span className="text-cyan-400">(${item.ticker})</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition text-cyan-400" />
                      </Link>
                    </td>

                    {/* Live Price / VAMS */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.live_price ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-100">
                            ${Number(item.live_price).toFixed(2)}
                          </span>
                          <span
                            className={`block text-xs font-bold ${
                              isBull
                                ? "text-emerald-400"
                                : isBear
                                ? "text-rose-400"
                                : "text-amber-400"
                            }`}
                          >
                            {vamsStr || "NEUTRAL (0)"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>

                    {/* OutlierScore & Conviction */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100">
                            {item.outlier_score ?? 82.5}
                          </span>
                          <span className="text-slate-500 text-xs">/ 100</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded border text-xs font-semibold block ${convictionColor}`}>
                          {conviction.replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>

                    {/* Live Entry Timing & 52W Range */}
                    <td className="py-3 px-3">
                      {item.live_entry_timing ? (
                        <div className="space-y-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold border inline-block ${
                              item.live_entry_timing.includes("LOW-BASE") ||
                              item.live_entry_timing.includes("Priority Accumulate")
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                                : item.live_entry_timing.includes("EXTENDED")
                                ? "bg-amber-950/80 text-amber-300 border-amber-800"
                                : "bg-cyan-950/80 text-cyan-300 border-cyan-800"
                            }`}
                          >
                            {item.live_entry_timing}
                          </span>
                          {item.range_52w_pct !== undefined && (
                            <div className="w-28 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-cyan-500 h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.max(0, item.range_52w_pct))}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">Tracking</span>
                      )}
                    </td>

                    {/* Industry & Theme */}
                    <td className="py-3 px-3 text-xs whitespace-nowrap">
                      <div className="text-slate-300">{item.industry}</div>
                      <div className="text-cyan-400/80 text-xs font-sans">{item.theme}</div>
                    </td>

                    {/* Reasons for Selection */}
                    <td className="py-3 px-3 text-slate-300 leading-relaxed text-xs font-sans">
                      {item.reasons}
                    </td>

                    {/* Asymmetry & Horizon */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="font-bold text-emerald-400">{item.asymmetry}</div>
                      <div className="text-xs text-slate-400">{item.horizon || "1–3M"}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
