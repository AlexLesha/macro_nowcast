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
import { FcteHoldingsTable } from "@/components/FcteHoldingsTable";
import { getApiUrl } from "@/lib/api";

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

  const filteredDrMo = rawDrMoList.filter((item: any) => {
    // 1. Stance Filter
    const signalStr = String(item.proper_trade || item.signal || "");
    if (factorFilter === "LONG" && !signalStr.includes("LONG")) return false;
    if (factorFilter === "SHORT" && !signalStr.includes("SHORT")) return false;
    if (factorFilter === "FLAT" && !signalStr.includes("FLAT")) return false;

    // 2. Category Filter
    const cat = String(item.category || "").toUpperCase();
    if (categoryFilter === "SECTORS" && !cat.includes("SECTOR")) return false;
    if (categoryFilter === "FACTORS" && !cat.includes("FACTOR") && !cat.includes("STYLE")) return false;
    if (categoryFilter === "GLOBAL" && !cat.includes("COUNTRY") && !cat.includes("GLOBAL")) return false;
    if (categoryFilter === "BONDS" && !cat.includes("FIXED") && !cat.includes("BOND") && !cat.includes("RATE")) return false;
    if (categoryFilter === "COMMODITIES" && !cat.includes("COMMODITY") && !cat.includes("FX") && !cat.includes("CRYPTO")) return false;

    return true;
  });

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
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3.5 space-y-2 font-mono text-xs shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold">
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                GLOBAL REGIME: {macroRegime.regime_name || macroRegime.primary_regime || "STAGFLATION"} ({macroRegime.active_quad || "QUAD 3"})
              </span>
              <span className={`px-2.5 py-0.5 rounded border font-semibold ${
                macroRegime.probability_risk_off_pct >= 60
                  ? "bg-rose-950/80 border-rose-800 text-rose-300"
                  : "bg-emerald-950/80 border-emerald-800 text-emerald-300"
              }`}>
                CACRI: {macroRegime.probability_risk_off_pct}% Risk-Off ({macroRegime.cacri_state})
              </span>
              <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                10Y Real TIPS: <span className="text-amber-300 font-bold">{macroRegime.real_10y_tips_pct}%</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <span>^MOVE: <strong className="text-cyan-300">{macroRegime.move_index}</strong></span>
              <span>•</span>
              <span>^VIX: <strong className="text-cyan-300">{macroRegime.vix_index}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/70">
              <span className="text-slate-400 text-xs block">US Net Liquidity ($L_t)</span>
              <span className="text-sm font-bold text-emerald-400">
                ${Number(macroRegime.net_liquidity_usd_bn || 0).toLocaleString()}B
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                4W Imp: {macroRegime.roc_4w_bn >= 0 ? "+" : ""}{macroRegime.roc_4w_bn}B
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/70">
              <span className="text-slate-400 text-xs block">Liquidity Impulse</span>
              <span className={`text-sm font-bold ${
                String(macroRegime.liquidity_impulse_state).includes("EXPANDING")
                  ? "text-emerald-400"
                  : String(macroRegime.liquidity_impulse_state).includes("INFLECTING")
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}>
                {String(macroRegime.liquidity_impulse_state).split(" ")[0]}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5 truncate">
                {macroRegime.liquidity_impulse_state}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/70">
              <span className="text-slate-400 text-xs block">US Debt-to-Liquidity</span>
              <span className="text-sm font-bold text-rose-400">
                {macroRegime.debt_to_liquidity_pct}%
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Fiscal Dominance
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/70">
              <span className="text-slate-400 text-xs block">Accord 2.0 Probability</span>
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
              className={`px-3 py-1 rounded-md font-semibold transition text-xs ${
                horizonTab === "now"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Now (0–6M)
            </button>
            <button
              onClick={() => setHorizonTab("intermediate")}
              className={`px-3 py-1 rounded-md font-semibold transition text-xs ${
                horizonTab === "intermediate"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Intermediate (6–12M)
            </button>
            <button
              onClick={() => setHorizonTab("long")}
              className={`px-3 py-1 rounded-md font-semibold transition text-xs ${
                horizonTab === "long"
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
                            className={`px-2 py-0.5 rounded font-semibold text-xs ${
                              row.stance.includes("OVERWEIGHT") || row.stance.includes("LONG") || row.stance.includes("BULL")
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
                Non-commercial institutional net contracts, open interest share &amp; 52-week crowding percentiles
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
                      className={`px-1.5 py-0.5 rounded font-bold text-xs ${
                        isCrowdedLong
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
                    <span className="font-semibold text-slate-200">{pos.net_pct_of_oi ? `${pos.net_pct_of_oi}%` : "N/A"}</span>
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
                        className={`h-full ${
                          pctl >= 80 ? "bg-amber-500" : pctl <= 20 ? "bg-rose-500" : "bg-cyan-500"
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
              Live quantitative momentum &amp; VAMS signals across Sectors, Factors, Global Quads, Rates, Commodities &amp; FX
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
                className={`px-2 py-0.5 rounded transition font-semibold text-xs ${
                  factorFilter === flt
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
          <span className="text-slate-400 mr-1">Category:</span>
          {[
            { id: "ALL", label: "All Universes" },
            { id: "SECTORS", label: "US Sectors" },
            { id: "FACTORS", label: "Equity Factors" },
            { id: "GLOBAL", label: "Global Countries" },
            { id: "BONDS", label: "Fixed Income" },
            { id: "COMMODITIES", label: "Commodities & FX" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-md transition font-semibold text-xs border ${
                categoryFilter === cat.id
                  ? "bg-indigo-950/80 border-indigo-600 text-indigo-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="text-slate-400 ml-auto">
            Showing {filteredDrMo.length} of {rawDrMoList.length} assets
          </span>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {filteredDrMo.map((f: any, idx: number) => {
            const signalStr = String(f.proper_trade || f.signal || "");
            const isLong = signalStr.includes("LONG") || f.vams_state > 0;
            const isShort = signalStr.includes("SHORT") || f.vams_state < 0;
            const targetExp = f.target_exposure_pct ?? (f.vams_state > 0 ? 100 : f.vams_state < 0 ? -100 : 0);
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition shadow-sm ${
                  isLong
                    ? "bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-500/60"
                    : isShort
                    ? "bg-rose-950/20 border-rose-800/40 hover:border-rose-500/60"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-100">${f.ticker}</span>
                  <span
                    className={`text-xs px-1.5 py-0.2 rounded font-mono font-bold ${
                      isLong
                        ? "bg-emerald-900 text-emerald-300"
                        : isShort
                        ? "bg-rose-900 text-rose-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    VAMS: {f.vams_state > 0 ? "+1" : f.vams_state < 0 ? "-1" : "0"}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono truncate mt-1" title={f.name}>
                  {f.name || f.ticker}
                </div>
                <div
                  className={`text-xs font-mono font-bold mt-1.5 ${
                    isLong ? "text-emerald-400" : isShort ? "text-rose-400" : "text-slate-400"
                  }`}
                >
                  {signalStr || (isLong ? "LONG (+1)" : isShort ? "SHORT (-1)" : "FLAT")}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-0.5 flex justify-between">
                  <span>Exp: {targetExp}%</span>
                  {f.rsi_14 != null && <span>RSI: {Math.round(f.rsi_14)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. 3FOURTEEN FCTE CORE 20 HOLDINGS TABLE */}
      <div className="pt-1">
        <FcteHoldingsTable />
      </div>
    </div>
  );
}
