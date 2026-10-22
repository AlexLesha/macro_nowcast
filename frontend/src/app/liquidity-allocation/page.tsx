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
} from "lucide-react";
import { LiquidityEngineCard } from "@/components/LiquidityEngineCard";
import { FcteHoldingsTable } from "@/components/FcteHoldingsTable";

export default function LiquidityAllocationPage() {
  const [horizonTab, setHorizonTab] = useState<"now" | "intermediate" | "long">("now");
  const [factorFilter, setFactorFilter] = useState<string>("ALL");
  const [quantSignals, setQuantSignals] = useState<any>(null);

  useEffect(() => {
    fetch("/api/quant/signals?ticker=SPY")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setQuantSignals(data);
      })
      .catch((e) => console.error("Error loading signals:", e));
  }, []);

  // Multi-Horizon Allocations
  const horizons = {
    now: {
      name: "Now (0–6 Months)",
      focus: "Tactical Cyclical Momentum & Reflation Quad Leadership",
      benchmark: "Aggressive Alpha Tilt",
      allocations: [
        { asset: "Mega-Cap Tech / Accelerated Compute ($NVDA / $SMH)", weight: "22%", stance: "MAX OVERWEIGHT", rationale: "Hyperscaler capex boom & top FCTE Quality (+239 bps)" },
        { asset: "Independent Power Producers ($VST / $CEG)", weight: "12%", stance: "OVERWEIGHT", rationale: "Nuclear & baseload data center offtake contracts" },
        { asset: "Physical Bullion ($GLD)", weight: "18%", stance: "OVERWEIGHT", rationale: "Sovereign fiscal dominance & central bank accumulation" },
        { asset: "Bitcoin / Digital Alternative ($IBIT)", weight: "8%", stance: "TACTICAL LONG", rationale: "M2 acceleration & structural monetary hedge" },
        { asset: "Energy & Industrial Metals ($XLE / $CPER)", weight: "14%", stance: "OVERWEIGHT", rationale: "Reflation Quad 2 commodity supply tightness" },
        { asset: "Ultra-Short Treasuries / Cash ($USFR / $TBIL)", weight: "20%", stance: "RISK BUFFER", rationale: "Zero duration risk yielding ~4.7% risk-free carry" },
        { asset: "Long-Duration Sovereign Debt ($TLT)", weight: "6%", stance: "MAX UNDERWEIGHT", rationale: "504D TAIL pivot breakdown & deficit supply overhang" },
      ],
    },
    intermediate: {
      name: "Intermediate (6–12 Months)",
      focus: "Quality FCF Compounders, Yield Curve Steepeners & Grid Infrastructure",
      benchmark: "Core Institutional Alpha",
      allocations: [
        { asset: "High-FCF Quality Large Caps ($QUAL / $MOAT)", weight: "24%", stance: "CORE OVERWEIGHT", rationale: "Balance sheet strength against mid-cycle volatility" },
        { asset: "Regional Banks ($KRE / $XLF)", weight: "14%", stance: "OVERWEIGHT", rationale: "Yield curve steepening & Net Interest Margin (NIM) recovery" },
        { asset: "Grid Infrastructure EPC ($PWR / $ETN / $VRT)", weight: "16%", stance: "OVERWEIGHT", rationale: "Electrical grid bottleneck & transformer backlogs" },
        { asset: "Physical Gold & Miners ($GLD / $GDX)", weight: "16%", stance: "CORE HOLD", rationale: "Operating margin leverage on sustained high bullion" },
        { asset: "TIPS & Floating Rate Debt ($TIP / $USFR)", weight: "18%", stance: "BENCHMARK TILT", rationale: "Real rate compensation without nominal duration risk" },
        { asset: "Broad S&P 500 Equities ($SPY)", weight: "12%", stance: "DYNAMIC COLLAR", rationale: "KSPY Put Spread Collar overlay protection" },
      ],
    },
    long: {
      name: "Long-View (12–36 Months)",
      focus: "Hard Asset Hegemony, Nuclear Renaissance & De-Dollarization Hedges",
      benchmark: "Secular Wealth Preservation",
      allocations: [
        { asset: "Hard Monetary Assets ($GLD / $IBIT)", weight: "30%", stance: "STRATEGIC CORE", rationale: "US Public Debt > $36T & 114% Debt-to-Liquidity debasement" },
        { asset: "Critical Minerals & Copper ($CPER / $FCX / $LIT)", weight: "18%", stance: "SECULAR BULL", rationale: "Global power electrification demand doubling by 2030" },
        { asset: "Nuclear Utilities & Clean Energy ($CEG / $CCJ / $XLU)", weight: "16%", stance: "OVERWEIGHT", rationale: "Decade-long power purchase contracts with Big Tech" },
        { asset: "Global Emerging Markets ($INDA / $EWZ)", weight: "14%", stance: "SELECTIVE OVERWEIGHT", rationale: "Favorable demographics & commodity terms-of-trade" },
        { asset: "Short-Duration Fixed Income ($SHY / $BIL)", weight: "15%", stance: "LIQUIDITY BUFFER", rationale: "Dry powder for cyclical drawdowns" },
        { asset: "Long-Duration Nominal Debt ($TLT)", weight: "7%", stance: "SECULAR MINIMUM", rationale: "Structural fiscal deficit crowding out risk" },
      ],
    },
  };

  // Dr. Mo 70-Factor Data
  const drMoList = quantSignals?.portfolios?.dr_mo_model_signals || [
    { ticker: "XLK", vams_state: 1, signal: "MAX_LONG (+100%)", target_exposure_pct: 100 },
    { ticker: "XLE", vams_state: 1, signal: "MAX_LONG (+100%)", target_exposure_pct: 100 },
    { ticker: "XLF", vams_state: 1, signal: "MAX_LONG (+100%)", target_exposure_pct: 100 },
    { ticker: "XLV", vams_state: 0, signal: "FLAT (0%)", target_exposure_pct: 0 },
    { ticker: "XLI", vams_state: 1, signal: "HALF_LONG (+50%)", target_exposure_pct: 50 },
    { ticker: "XLP", vams_state: 0, signal: "FLAT (0%)", target_exposure_pct: 0 },
    { ticker: "XLU", vams_state: 1, signal: "HALF_LONG (+50%)", target_exposure_pct: 50 },
    { ticker: "XLY", vams_state: 1, signal: "MAX_LONG (+100%)", target_exposure_pct: 100 },
    { ticker: "XLC", vams_state: 1, signal: "MAX_LONG (+100%)", target_exposure_pct: 100 },
    { ticker: "XLB", vams_state: 1, signal: "HALF_LONG (+50%)", target_exposure_pct: 50 },
    { ticker: "VNQ", vams_state: 0, signal: "FLAT (0%)", target_exposure_pct: 0 },
    { ticker: "SMH", vams_state: 1, signal: "MAX_LONG (+100%)", target_exposure_pct: 100 },
    { ticker: "KRE", vams_state: 1, signal: "MAX_LONG (+100%)", target_exposure_pct: 100 },
    { ticker: "GLD", vams_state: 1, signal: "MAX_LONG (+100%)", target_exposure_pct: 100 },
    { ticker: "SLV", vams_state: 1, signal: "HALF_LONG (+50%)", target_exposure_pct: 50 },
    { ticker: "USO", vams_state: 1, signal: "MAX_LONG (+100%)", target_exposure_pct: 100 },
    { ticker: "CPER", vams_state: 1, signal: "MAX_LONG (+100%)", target_exposure_pct: 100 },
    { ticker: "TLT", vams_state: -1, signal: "HALF_SHORT (-50%)", target_exposure_pct: -50 },
    { ticker: "IEF", vams_state: 0, signal: "FLAT (0%)", target_exposure_pct: 0 },
    { ticker: "SHY", vams_state: 1, signal: "HALF_LONG (+50%)", target_exposure_pct: 50 },
    { ticker: "INDA", vams_state: 1, signal: "MAX_LONG (+100%)", target_exposure_pct: 100 },
    { ticker: "EWZ", vams_state: 1, signal: "HALF_LONG (+50%)", target_exposure_pct: 50 },
    { ticker: "FXI", vams_state: 0, signal: "FLAT (0%)", target_exposure_pct: 0 },
  ];

  const filteredDrMo = drMoList.filter((item: any) => {
    if (factorFilter === "ALL") return true;
    if (factorFilter === "LONG") return item.signal.includes("LONG");
    if (factorFilter === "SHORT") return item.signal.includes("SHORT");
    if (factorFilter === "FLAT") return item.signal.includes("FLAT");
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold mb-1">
          <Layers className="h-4 w-4" />
          <span>MACRO LIQUIDITY &amp; ASSET ALLOCATION</span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
          Sovereign Fiscal Stress &amp; Multi-Horizon Portfolio Engines
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
          Real-time tracking of US Net Liquidity ($L_t), global central bank balance sheets, Fed-Treasury Accord 2.0 triggers, and institutional asset deployment across 0–36 month horizons.
        </p>
      </div>

      {/* 1. FULL LIQUIDITY ENGINE SUITE */}
      <LiquidityEngineCard />

      {/* 2. MULTI-HORIZON ASSET ALLOCATION MATRIX */}
      <div className="p-6 rounded-2xl bg-[#0c121e] border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-mono font-bold text-slate-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              MULTI-HORIZON ASSET ALLOCATION MATRIX
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Horizon-separated tactical, intermediate, and secular deployment playbook
            </p>
          </div>

          {/* Horizon Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setHorizonTab("now")}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                horizonTab === "now"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Now (0–6M)
            </button>
            <button
              onClick={() => setHorizonTab("intermediate")}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                horizonTab === "intermediate"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Intermediate (6–12M)
            </button>
            <button
              onClick={() => setHorizonTab("long")}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
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
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-cyan-400 font-bold uppercase block text-[11px]">Active Strategy Horizon:</span>
              <span className="text-base font-bold text-slate-100">{horizons[horizonTab].name}</span>
            </div>
            <div className="text-slate-300">
              <span className="text-slate-400">Core Focus:</span> {horizons[horizonTab].focus}
            </div>
            <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-[11px]">
              {horizons[horizonTab].benchmark}
            </div>
          </div>

          {/* Allocation Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Asset / Sector Allocation</th>
                  <th className="py-3 px-4">Target Weight</th>
                  <th className="py-3 px-4">Institutional Stance</th>
                  <th className="py-3 px-4">Systematic Synthesis Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {horizons[horizonTab].allocations.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-semibold text-slate-200">{row.asset}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-bold">
                        {row.weight}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
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
                    <td className="py-3 px-4 text-slate-400">{row.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. DR. MO 70-FACTOR HEATMAP */}
      <div className="p-6 rounded-2xl bg-[#0c121e] border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-mono font-bold text-slate-100 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-indigo-400" />
              DR. MO 70-FACTOR INSTITUTIONAL HEATMAP
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Quantitative trend signals across Sectors, Styles, Countries, Rates, Commodities &amp; FX
            </p>
          </div>

          {/* Factor Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 px-2 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Filter:
            </span>
            {["ALL", "LONG", "SHORT", "FLAT"].map((flt) => (
              <button
                key={flt}
                onClick={() => setFactorFilter(flt)}
                className={`px-2.5 py-1 rounded transition font-semibold ${
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

        {/* Heatmap Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredDrMo.map((f: any, idx: number) => {
            const isLong = f.signal.includes("LONG");
            const isShort = f.signal.includes("SHORT");
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
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
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
                <div
                  className={`text-[11px] font-mono font-semibold mt-2 ${
                    isLong ? "text-emerald-400" : isShort ? "text-rose-400" : "text-slate-400"
                  }`}
                >
                  {f.signal}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  Target Exp: {f.target_exposure_pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3Fourteen FCTE Core 20 Holdings Table */}
      <div className="pt-2">
        <FcteHoldingsTable />
      </div>
    </div>
  );
}
