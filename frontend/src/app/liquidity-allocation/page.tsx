"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  DollarSign,
  Globe,
  TrendingUp,
  TrendingDown,
  Clock,
  PieChart,
  ShieldCheck,
  Filter,
  BarChart2,
  Sparkles,
  Zap,
  Activity,
  AlertCircle,
  Compass,
} from "lucide-react";
import { LiquidityEngineCard } from "@/components/LiquidityEngineCard";
import { getApiUrl } from "@/lib/api";
import { MetricTip } from "@/components/FinancialTooltip";

export default function LiquidityAllocationPage() {
  const [horizonTab, setHorizonTab] = useState<"now" | "intermediate" | "long">("now");
  const [factorFilter, setFactorFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [liveAllocationData, setLiveAllocationData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAllocation = () => {
    setLoading(true);
    fetch(getApiUrl("/api/v1/liquidity-allocation"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setLiveAllocationData(data);
      })
      .catch((e) => console.error("Error loading live liquidity allocation:", e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllocation();

    const handleGlobalRefresh = () => {
      fetchAllocation();
    };
    window.addEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
    return () => window.removeEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
  }, []);

  const macroRegime = liveAllocationData?.macro_regime;
  const dynHorizons = liveAllocationData?.dynamic_horizons;
  const cftcPositions = liveAllocationData?.cftc_positioning || [];

  const activeDynHorizon =
    horizonTab === "now"
      ? dynHorizons?.now_0_6m
      : horizonTab === "intermediate"
        ? dynHorizons?.intermediate_6_12m
        : dynHorizons?.long_view_12_36m;

  const rawDrMoList = liveAllocationData?.dr_mo_matrix || [];

  const fmtRoC = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return "0.0%";
    return `${val >= 0 ? "+" : ""}${Number(val).toFixed(1)}%`;
  };

  const getAssetGroup = (cat: string) => {
    const c = String(cat || "").toUpperCase();
    if (c.includes("SECTOR") && !c.includes("FIXED")) return "SECTORS";
    if (c.includes("FACTOR") || c.includes("STYLE")) return "FACTORS";
    if (c.includes("GLOBAL") || c.includes("COUNTRY")) return "GLOBAL";
    if (c.includes("FIXED") || c.includes("BOND") || c.includes("RATE")) return "BONDS";
    return "COMMODITIES"; // Macro Exposures, Commodities, FX, Crypto
  };

  const DR_MO_GROUPS = [
    {
      id: "SECTORS",
      title: "US Equity Sectors",
      description: "11 GICS Select Sector SPDRs, SMH, XBI, XME & ITA Leaders",
    },
    {
      id: "FACTORS",
      title: "US Equity Style Factors",
      description: "Smart Beta, Low Volatility, FCF Cash Cows, Quality & Small-Cap Alpha",
    },
    {
      id: "GLOBAL",
      title: "Global Equities & Regions (G20+)",
      description: "G20 Economies, Developed & Emerging Market Country Quad Proxies",
    },
    {
      id: "BONDS",
      title: "Fixed Income & Sovereign Debt",
      description: "Duration, Floating Rate USFR, Muni & TIPS Inflation Plumbing",
    },
    {
      id: "COMMODITIES",
      title: "Commodities, Currencies & Digital Assets",
      description: "Gold, Copper, Energy, Agriculture, Currencies & Digital Assets",
    },
  ];

  const filterFactorItem = (item: any) => {
    const signalStr = String(item.proper_trade || item.signal || "");
    const vScore = item.vams_score !== undefined && item.vams_score !== null ? Number(item.vams_score) : Number(item.vams_state || 0);
    if (factorFilter === "LONG" && !signalStr.includes("LONG") && vScore <= 0.15) return false;
    if (factorFilter === "SHORT" && !signalStr.includes("SHORT") && vScore >= -0.15) return false;
    if (factorFilter === "FLAT" && !signalStr.includes("NEUTRAL") && !signalStr.includes("FLAT") && Math.abs(vScore) > 0.15) return false;
    return true;
  };

  const getRsiActionDetails = (rsi: number | undefined | null, vScore: number) => {
    const isPositive = vScore > 0.15;
    const isNegative = vScore < -0.15;
    const isNeutral = !isPositive && !isNegative;

    if (rsi === undefined || rsi === null || isNaN(rsi)) {
      if (isPositive) return { text: "Bullish", color: "text-emerald-400" };
      if (isNegative) return { text: "Bearish", color: "text-rose-400" };
      return { text: "Neutral", color: "text-slate-400" };
    }

    const r = Math.round(rsi);

    // 1. Extreme actionable states
    if (isPositive && r <= 38) {
      return { text: `RSI: ${r} · BUY PULLBACK`, color: "text-emerald-400 font-bold" };
    }
    if (isPositive && r >= 68) {
      return { text: `RSI: ${r} · EXTENDED`, color: "text-amber-400 font-bold" };
    }
    if (isNegative && r >= 62) {
      return { text: `RSI: ${r} · SELL RIP`, color: "text-rose-400 font-bold" };
    }
    if (isNegative && r <= 30) {
      return { text: `RSI: ${r} · SQUEEZE RISK`, color: "text-amber-400 font-bold" };
    }

    // 2. Normal non-extreme states: Bullish, Bearish, Neutral
    if (isPositive) {
      return { text: `RSI: ${r} · Bullish`, color: "text-cyan-300" };
    }
    if (isNegative) {
      return { text: `RSI: ${r} · Bearish`, color: "text-rose-300" };
    }
    return { text: `RSI: ${r} · Neutral`, color: "text-slate-400" };
  };

  const renderDrMoCard = (f: any, idx: string | number) => {
    const vScore = f.vams_score !== undefined && f.vams_score !== null ? Number(f.vams_score) : Number(f.vams_state || 0);
    const targetExp =
      f.target_exposure_pct !== undefined && f.target_exposure_pct !== null
        ? Number(f.target_exposure_pct)
        : f.vams_state > 0
          ? 100
          : f.vams_state < 0
            ? -100
            : 0;
    const isPositive = vScore > 0.15;
    const isNegative = vScore < -0.15;
    const rsiInfo = getRsiActionDetails(f.rsi_14d, vScore);

    return (
      <div
        key={`${f.ticker}-${idx}`}
        className={`p-2 rounded-lg border transition shadow-sm w-[130px] sm:w-[134px] shrink-0 font-mono space-y-1 ${isPositive
          ? "bg-[#0b1622] border-emerald-900/60 hover:border-emerald-500/60"
          : isNegative
            ? "bg-[#180d15] border-rose-900/60 hover:border-rose-500/60"
            : "bg-[#101726] border-slate-800 hover:border-slate-700"
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-100 text-xs">${f.ticker}</span>
          <span
            className={`px-1 py-0.2 rounded text-xs font-bold ${isPositive
              ? "bg-emerald-950 text-emerald-300"
              : isNegative
                ? "bg-rose-950 text-rose-300"
                : "bg-slate-800 text-slate-300"
              }`}
          >
            {vScore > 0 ? "+" : ""}{vScore.toFixed(2)}
          </span>
        </div>

        <div className="text-slate-400 truncate text-[10.5px] leading-tight" title={f.name}>
          {f.name || f.ticker}
        </div>

        <div className="flex items-center justify-between pt-0.5 border-t border-slate-800/60 text-[10px] leading-tight">
          <span
            className={`font-bold uppercase tracking-tight ${isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-slate-400"
              }`}
          >
            {isPositive ? "LONG" : isNegative ? "SHORT" : "NEUTRAL"}
          </span>
          <span className="text-slate-300 tracking-tight">
            Exp:{" "}
            <strong
              className={
                targetExp > 0 ? "text-emerald-300" : targetExp < 0 ? "text-rose-300" : "text-slate-300"
              }
            >
              {targetExp > 0 ? "+" : ""}
              {typeof targetExp === "number" ? Math.round(targetExp) : targetExp}%
            </strong>
          </span>
        </div>

        <div className={`text-[10px] truncate font-medium tracking-tight pt-0.5 leading-tight ${rsiInfo.color}`}>
          {rsiInfo.text}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold mb-1">
          <Layers className="h-4 w-4" />
          <span>MACRO LIQUIDITY &amp; MULTI-HORIZON ASSET ALLOCATION</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-bold font-mono tracking-tight text-slate-100">
              Sovereign Fiscal Stress, Net Liquidity &amp; Multi-Horizon Deployments
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5 max-w-3xl">
              Live quantitative tracking of US Net Liquidity ($L_t), central bank balance sheets, Fed-Treasury Accord 2.0 triggers, and systematic 0–36M asset positioning.
            </p>
          </div>
          {liveAllocationData?.as_of_utc && (
            <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded shrink-0">
              Synced: <span className="text-cyan-300 font-semibold">{liveAllocationData.as_of_utc}</span>
            </div>
          )}
        </div>
      </div>

      {/* GLOBAL MACRO REGIME & LIQUIDITY COCKPIT */}
      {macroRegime && (
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3.5 space-y-2.5 font-mono text-xs shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold">
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                GLOBAL REGIME: {macroRegime.regime_name || macroRegime.primary_regime || "STAGFLATION"} ({macroRegime.active_quad || "QUAD 3"})
              </span>
              <span
                className={`px-2.5 py-1 rounded border font-semibold ${macroRegime.probability_risk_off_pct >= 60
                  ? "bg-rose-950/80 border-rose-800 text-rose-300"
                  : "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                  }`}
              >
                CARCI: {macroRegime.probability_risk_off_pct}% Risk-Off (D: {fmtRoC(macroRegime.carci_d_pct)}, W: {fmtRoC(macroRegime.carci_w_pct)})
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                10Y Real TIPS: <span className="text-amber-300 font-bold">{macroRegime.real_10y_tips_pct}%</span>{" "}
                <span className="text-slate-400 text-xs">
                  (D: {fmtRoC(macroRegime.real_10y_tips_d_chg)}, W: {fmtRoC(macroRegime.real_10y_tips_w_chg)})
                </span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-slate-400 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                <MetricTip term="MOVE INDEX">^MOVE</MetricTip>: <strong className="text-cyan-300">{macroRegime.move_index}</strong> (D: {fmtRoC(macroRegime.move_d_pct)}, W: {fmtRoC(macroRegime.move_w_pct)})
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                ^VIX: <strong className="text-cyan-300">{macroRegime.vix_index}</strong> (D: {fmtRoC(macroRegime.vix_d_pct)}, W: {fmtRoC(macroRegime.vix_w_pct)})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/70">
              <span className="text-slate-400 text-xs block">
                <MetricTip term="NET LIQUIDITY">US Net Liquidity ($L_t)</MetricTip>
              </span>
              <span className="text-sm font-bold text-emerald-400">
                ${Number(macroRegime.net_liquidity_usd_bn || 0).toLocaleString()}B
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                4W Imp: {macroRegime.roc_4w_bn >= 0 ? "+" : ""}{macroRegime.roc_4w_bn}B
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/70">
              <span className="text-slate-400 text-xs block">
                <MetricTip term="NET LIQUIDITY">Liquidity Impulse</MetricTip>
              </span>
              <span
                className={`text-sm font-bold ${String(macroRegime.liquidity_impulse_state).includes("EXPANDING")
                  ? "text-emerald-400"
                  : String(macroRegime.liquidity_impulse_state).includes("INFLECTING")
                    ? "text-amber-400"
                    : "text-rose-400"
                  }`}
              >
                {String(macroRegime.liquidity_impulse_state).split(" ")[0]}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5 truncate">
                {macroRegime.liquidity_impulse_state}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/70">
              <span className="text-slate-400 text-xs block">
                <MetricTip term="DEBT-TO-LIQUIDITY">US Debt-to-Liquidity</MetricTip>
              </span>
              <span className="text-sm font-bold text-rose-400">
                {macroRegime.debt_to_liquidity_pct}%
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Fiscal Dominance
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/70">
              <span className="text-slate-400 text-xs block">
                <MetricTip term="ACCORD 2.0">Accord 2.0 Probability</MetricTip>
              </span>
              <span className="text-sm font-bold text-amber-400">
                {macroRegime.accord_2_0_prob}%
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                T-Bills: {macroRegime.tbill_issuance_share_pct}% of Mkt Debt
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. FULL LIQUIDITY ENGINE SUITE (Zero duplicate network calls) */}
      <LiquidityEngineCard initialData={liveAllocationData?.liquidity} />

      {/* 2. MULTI-HORIZON ASSET ALLOCATION MATRIX */}
      <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              DYNAMIC MULTI-HORIZON ASSET ALLOCATION MATRIX
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Systematic tactical, intermediate, and secular deployment matrix grounded in live macro regimes
            </p>
          </div>

          {/* Horizon Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setHorizonTab("now")}
              className={`px-3 py-1 rounded-md font-semibold transition text-xs ${horizonTab === "now"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Now (0–6M)
            </button>
            <button
              onClick={() => setHorizonTab("intermediate")}
              className={`px-3 py-1 rounded-md font-semibold transition text-xs ${horizonTab === "intermediate"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Intermediate (6–12M)
            </button>
            <button
              onClick={() => setHorizonTab("long")}
              className={`px-3 py-1 rounded-md font-semibold transition text-xs ${horizonTab === "long"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Long-View (12–36M)
            </button>
          </div>
        </div>

        {/* Active Horizon Card */}
        <div className="space-y-3.5">
          {activeDynHorizon ? (
            <>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <span className="text-cyan-400 font-bold uppercase block text-xs">Active Strategy Horizon:</span>
                  <span className="text-sm font-bold text-slate-100">
                    {activeDynHorizon.title}
                  </span>
                </div>
                <div className="text-slate-300 max-w-xl text-xs">
                  <span className="text-slate-400 font-semibold">Regime Synthesis Rationale:</span>{" "}
                  {activeDynHorizon.regime_thesis}
                </div>
                <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs shrink-0">
                  {horizonTab === "now" ? "Aggressive Tactical Alpha" : horizonTab === "intermediate" ? "Core Institutional Alpha" : "Secular Wealth Preservation"}
                </div>
              </div>

              {/* Dynamic Sectors, Countries, Factors Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase block">Overweight Sectors</span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {activeDynHorizon.sectors_long?.map((s: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 text-xs border border-emerald-700/50">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1">
                  <span className="text-xs font-bold text-rose-400 uppercase block">Underweight / Avoid</span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {activeDynHorizon.sectors_avoid?.map((s: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 text-xs border border-rose-700/50">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-1">
                  <span className="text-xs font-bold text-cyan-400 uppercase block">Country Quads Leadership</span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {activeDynHorizon.countries_long?.map((c: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-200 text-xs border border-cyan-700/50">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/40 space-y-1">
                  <span className="text-xs font-bold text-indigo-400 uppercase block">Factors &amp; Sleeves</span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {activeDynHorizon.factors_and_sleeves?.map((f: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-200 text-xs border border-indigo-700/50">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Allocation Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-xs border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Asset / Sector Allocation</th>
                      <th className="py-2.5 px-3">Target Weight</th>
                      <th className="py-2.5 px-3">Institutional Stance</th>
                      <th className="py-2.5 px-3">Systematic Synthesis Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activeDynHorizon.allocations?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/40 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{row.asset}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-bold">
                            {row.weight}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-xs ${row.stance.includes("OVERWEIGHT") || row.stance.includes("LONG") || row.stance.includes("BULL")
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                              : row.stance.includes("UNDERWEIGHT")
                                ? "bg-rose-950/80 text-rose-400 border border-rose-800"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                              }`}
                          >
                            {row.stance}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{row.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 font-mono text-xs animate-pulse">
              Loading dynamic multi-horizon allocations for {horizonTab}...
            </div>
          )}
        </div>
      </div>

      {/* 3. CFTC SPECULATIVE POSITIONING & COT SENTIMENT */}
      {cftcPositions && cftcPositions.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-400" />
                CFTC INSTITUTIONAL SPECULATIVE POSITIONING (COT REPORT)
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Official CFTC Socrata live feed: non-commercial net contracts, % of open interest &amp; 52-week crowding percentiles
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded">
              US Futures Regulators Feed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cftcPositions.map((pos: any, idx: number) => {
              const isNetLong = (pos.net_position_contracts || 0) >= 0;
              const pctl = pos.percentile_52w || 50.0;
              const isCrowdedLong = pctl >= 80.0;
              const isCrowdedShort = pctl <= 20.0;
              const oiVal = pos.net_pct_of_oi ?? pos.net_noncommercial_pct_oi;
              const oiNum = oiVal !== undefined && oiVal !== null ? Number(oiVal) : null;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-100 text-xs">{pos.contract_name || pos.name}</span>
                      <span className="text-slate-400 text-xs ml-1.5">(${pos.ticker})</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold text-xs ${isCrowdedLong
                        ? "bg-amber-950/80 border border-amber-800 text-amber-300"
                        : isCrowdedShort
                          ? "bg-rose-950/80 border border-rose-800 text-rose-300"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                    >
                      {isCrowdedLong ? "CROWDED LONG" : isCrowdedShort ? "CROWDED SHORT" : "BALANCED"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-slate-400 text-xs">Net Contracts:</span>
                    <span className={`font-bold text-sm ${isNetLong ? "text-emerald-400" : "text-rose-400"}`}>
                      {isNetLong ? "+" : ""}{Number(pos.net_position_contracts || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>% of Open Interest:</span>
                    <span className={`font-semibold ${oiNum !== null && oiNum >= 0 ? "text-emerald-400" : oiNum !== null ? "text-rose-400" : "text-slate-200"}`}>
                      {oiNum !== null ? `${oiNum > 0 ? "+" : ""}${oiNum}%` : "N/A"}
                    </span>
                  </div>

                  {/* 52W Percentile Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>52W Crowding:</span>
                      <span className="font-semibold text-slate-300">{pctl}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${Math.min(100, Math.max(0, pctl))}%` }}
                        className={`h-full ${pctl >= 80 ? "bg-amber-500" : pctl <= 20 ? "bg-rose-500" : "bg-cyan-500"
                          }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. DR. MO 70-FACTOR INSTITUTIONAL HEATMAP */}
      <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-indigo-400" />
              DR. MO 70-FACTOR INSTITUTIONAL HEATMAP
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Continuous Multi-Row Spectrum: Negative VAMS on left, Neutral in center, Positive VAMS on right — dynamically scaled to eliminate overflow
            </p>
          </div>

          {/* Stance Filter */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 px-1.5 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Stance:
            </span>
            {["ALL", "LONG", "SHORT", "FLAT"].map((flt) => (
              <button
                key={flt}
                onClick={() => setFactorFilter(flt)}
                className={`px-2 py-0.5 rounded transition font-semibold text-xs ${factorFilter === flt
                  ? "bg-slate-800 text-cyan-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                {flt}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400 mr-1">Category View:</span>
          {[
            { id: "ALL", label: "All Universes" },
            { id: "SECTORS", label: "US Sectors" },
            { id: "FACTORS", label: "Equity Factors" },
            { id: "GLOBAL", label: "Global Equities (G20+)" },
            { id: "BONDS", label: "Fixed Income" },
            { id: "COMMODITIES", label: "Commodities & FX" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-md transition font-semibold text-xs border ${categoryFilter === cat.id
                ? "bg-indigo-950/80 border-indigo-600 text-indigo-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="text-slate-400 ml-auto">
            Universe: {rawDrMoList.length} Systematic Proxies
          </span>
        </div>

        {/* 50/50 Staggered Spectrum Layout Across Groups */}
        <div className="space-y-4 pt-1">
          {DR_MO_GROUPS.filter((grp) => categoryFilter === "ALL" || categoryFilter === grp.id).map((grp) => {
            const rawGroupItems = rawDrMoList.filter((item: any) => getAssetGroup(item.category) === grp.id);
            const filteredGroupItems = rawGroupItems.filter(filterFactorItem);

            if (categoryFilter !== "ALL" && filteredGroupItems.length === 0) {
              return (
                <div key={grp.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs font-mono">
                  No assets in {grp.title} matching stance &quot;{factorFilter}&quot;.
                </div>
              );
            }

            if (filteredGroupItems.length === 0) return null;

            // Sort all cards strictly ascending by continuous VAMS score (-1.00 to +1.00)
            const sortedCards = [...filteredGroupItems].sort((a: any, b: any) => {
              const vA = a.vams_score !== undefined && a.vams_score !== null ? Number(a.vams_score) : Number(a.vams_state || 0);
              const vB = b.vams_score !== undefined && b.vams_score !== null ? Number(b.vams_score) : Number(b.vams_state || 0);
              return vA - vB;
            });

            // Dynamically calculate optimal number of columns based on universe size:
            // Removes any row limit (allows 3, 4, 5, 6, 7+ rows) so scorecards neatly populate the allocated space
            // without exceeding container width or requiring horizontal scroll.
            const totalCount = sortedCards.length;
            let numCols = 5;
            if (totalCount <= 3) {
              numCols = totalCount;
            } else if (totalCount <= 6) {
              numCols = 3;
            } else if (totalCount <= 14) {
              numCols = 4;
            } else if (totalCount <= 20) {
              numCols = 5;
            } else {
              numCols = 5;
            }

            // Partition sortedCards evenly across columns from left (most negative) to right (most positive).
            // Rules of segregating types are relaxed: adjacent types sit next to or on top of one another smoothly.
            const basePerCol = Math.floor(totalCount / numCols);
            const remainder = totalCount % numCols;
            const columns: any[][] = [];
            let cursor = 0;
            for (let c = 0; c < numCols; c++) {
              const countInCol = basePerCol + (c < remainder ? 1 : 0);
              columns.push(sortedCards.slice(cursor, cursor + countInCol));
              cursor += countInCol;
            }

            return (
              <div key={grp.id} className="p-3.5 rounded-xl bg-[#090f1a] border border-slate-800/80 space-y-2.5">
                {/* Header (Clean, no axis legends) */}
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wide">
                      {grp.title}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {filteredGroupItems.length} assets
                    </span>
                  </div>
                </div>

                {/* Continuous Multi-Row Spectrum: Negative (Left) -> Neutral (Center) -> Positive (Right) */}
                <div className="flex flex-wrap items-start justify-center gap-2 sm:gap-2.5 min-h-[90px] w-full pb-1">
                  {columns.map((colCards: any[], colIdx: number) => (
                    <div key={colIdx} className="flex flex-col gap-2 shrink-0">
                      {colCards.map((f: any, idx: number) => renderDrMoCard(f, `${colIdx}-${idx}`))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* PRACTICAL GUIDANCE: WHAT ROLE RSI PLAYS IN GLOBAL MACRO & 42MACRO FRAMEWORKS */}
        <div className="p-4 rounded-xl bg-[#080d16] border border-slate-800 text-xs font-mono space-y-3 mt-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
              What Role RSI Plays in Global Macro &amp; 42Macro Frameworks
            </h3>
          </div>

          <p className="text-slate-300 leading-relaxed font-sans text-xs">
            In systematic macro trading (42Macro, Hedgeye, and Dr. Mo frameworks), <strong>VAMS</strong> and <strong>14-Day RSI</strong> resolve two fundamentally different portfolio decisions:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-[#0e1626] border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold text-xs uppercase">1. VAMS (Volatility-Adjusted Momentum)</span>
                <span className="text-slate-500 text-xs">Horizon: 30–90 Days</span>
              </div>
              <p className="text-slate-300 text-xs font-sans leading-relaxed">
                <strong>Answers: What is the structural regime trend?</strong> Determines institutional <strong>Stance &amp; Position Sizing</strong> (Long, Short, Neutral, % exposure). Grounded in multi-month volatility-adjusted trend momentum.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#0e1626] border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold text-xs uppercase">2. 14D RSI (Relative Strength Index)</span>
                <span className="text-slate-500 text-xs">Horizon: 1–15 Days</span>
              </div>
              <p className="text-slate-300 text-xs font-sans leading-relaxed">
                <strong>Answers: Is the asset tactically extended or oversold today?</strong> Determines <strong>Execution Timing</strong> (Do I deploy capital right now, or wait for mean-reversion?).
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-slate-200 font-bold text-xs uppercase block">
              The 4 Core Systematic Execution Rules:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/50 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-emerald-400">
                  <span>BUY PULLBACK (VAMS &gt; 0, RSI &le; 38)</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">Prime Entry</span>
                </div>
                <p className="text-slate-300 font-sans text-xs">
                  Asset is in a structural bull regime but experiencing short-term liquidation. High-conviction entry point (&quot;Buy the Dip&quot;).
                </p>
              </div>

              <div className="p-2.5 rounded bg-amber-950/20 border border-amber-900/50 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-amber-400">
                  <span>EXTENDED / HOLD (VAMS &gt; 0, RSI &ge; 68)</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800">Crowded Long</span>
                </div>
                <p className="text-slate-300 font-sans text-xs">
                  Asset is bullish, but priced to perfection short-term. Hold existing size; do not chase with fresh capital until a pullback occurs.
                </p>
              </div>

              <div className="p-2.5 rounded bg-rose-950/20 border border-rose-900/50 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-rose-400">
                  <span>SELL RIP (VAMS &lt; 0, RSI &ge; 62)</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800">Asymmetric Short</span>
                </div>
                <p className="text-slate-300 font-sans text-xs">
                  Asset is in a structural bear regime experiencing an unbacked counter-trend squeeze. Prime entry to initiate or reload shorts.
                </p>
              </div>

              <div className="p-2.5 rounded bg-amber-950/20 border border-amber-900/50 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-amber-400">
                  <span>SQUEEZE RISK (VAMS &lt; 0, RSI &le; 30)</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800">Tighten Stops</span>
                </div>
                <p className="text-slate-300 font-sans text-xs">
                  Asset is fundamentally bearish, but exhausted to the downside. High risk of violent short covering. Do not add fresh shorts; harvest profits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
