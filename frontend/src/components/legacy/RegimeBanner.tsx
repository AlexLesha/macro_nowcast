"use client";

import React from "react";
import { Compass, TrendingUp, DollarSign, Globe, PieChart, Layers } from "lucide-react";

interface RegimeBannerProps {
  regime: any;
}

export const RegimeBanner: React.FC<RegimeBannerProps> = ({ regime }) => {
  const activeQuad = regime?.us_monthly_quad || "QUAD_2";
  const netLiquidity = regime?.net_liquidity_usd_bn ?? 6150.4;
  const globalLiq = regime?.global_liquidity_usd_tn ?? 106.4;
  const gridRegime = regime?.grid_regime || "REFLATION";

  const p1 = Math.round((regime?.quad_1_prob ?? 0.18) * 100);
  const p2 = Math.round((regime?.quad_2_prob ?? 0.55) * 100);
  const p3 = Math.round((regime?.quad_3_prob ?? 0.12) * 100);
  const p4 = Math.round((regime?.quad_4_prob ?? 0.15) * 100);

  let kissWeights: Record<string, number> = {
    SPY: 35,
    QQQ: 20,
    GLD: 15,
    TLT: 10,
    USO: 10,
    BIL: 10,
  };

  if (regime?.kiss_weights_json) {
    try {
      const parsed = JSON.parse(regime.kiss_weights_json);
      kissWeights = Object.entries(parsed).reduce((acc, [k, v]) => {
        acc[k] = Math.round(Number(v) * 100);
        return acc;
      }, {} as Record<string, number>);
    } catch {
      // fallback
    }
  }

  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Regime Status Indicator */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 pb-5 lg:pb-0 lg:pr-6">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1.5">
            <Compass className="h-4 w-4" />
            <span>MACRO REGIME NOWCAST</span>
          </div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-black font-mono tracking-tight text-white">
              {activeQuad.replace("_", " ")}
            </h2>
            <span className="text-xs px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-mono font-semibold">
              {gridRegime}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2 font-mono leading-relaxed">
            Hedgeye Quad 2 (Growth Accelerating / Inflation Accelerating). Optimal environment for Equities, Commodities, and Crypto.
          </p>

          {/* Probability Distribution Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm font-mono text-slate-400 mb-1">
              <span>Quad Probabilities</span>
              <span className="text-slate-200 font-semibold">Q2: {p2}% Conviction</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div style={{ width: `${p1}%` }} className="bg-sky-500" title={`Quad 1: ${p1}%`} />
              <div style={{ width: `${p2}%` }} className="bg-emerald-500" title={`Quad 2: ${p2}%`} />
              <div style={{ width: `${p3}%` }} className="bg-amber-500" title={`Quad 3: ${p3}%`} />
              <div style={{ width: `${p4}%` }} className="bg-rose-500" title={`Quad 4: ${p4}%`} />
            </div>
            <div className="flex justify-between text-xs font-mono text-slate-500 mt-1">
              <span>Q1 (Goldilocks): {p1}%</span>
              <span>Q2 (Reflation): {p2}%</span>
              <span>Q3 (Stagflation): {p3}%</span>
              <span>Q4 (Deflation): {p4}%</span>
            </div>
          </div>
        </div>

        {/* Liquidity Gauges */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 pb-5 lg:pb-0 lg:pr-6">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest mb-3">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>LIQUIDITY NOWCAST ARCHITECTURE</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800/80">
              <span className="text-xs font-mono text-slate-400 block mb-1">
                FED NET LIQUIDITY
              </span>
              <div className="flex items-baseline gap-1 text-base font-bold font-mono text-white">
                <DollarSign className="h-4 w-4 text-emerald-400 -mr-1" />
                <span>{netLiquidity.toLocaleString()}</span>
                <span className="text-xs text-slate-400">B</span>
              </div>
              <span className="text-xs text-slate-400 font-mono block mt-0.5">
                WALCL − TGA − RRP
              </span>
            </div>

            <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800/80">
              <span className="text-xs font-mono text-slate-400 block mb-1">
                GLOBAL M2 LIQUIDITY
              </span>
              <div className="flex items-baseline gap-1 text-base font-bold font-mono text-white">
                <Globe className="h-4 w-4 text-cyan-400 -mr-1" />
                <span>${globalLiq}</span>
                <span className="text-xs text-slate-400">T</span>
              </div>
              <span className="text-xs text-emerald-400 font-mono block mt-0.5">
                +1.8% 30d RoC
              </span>
            </div>
          </div>
        </div>

        {/* KISS Model Allocation Weights */}
        <div className="lg:col-span-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest">
              <PieChart className="h-4 w-4 text-cyan-400" />
              <span>OPTIMAL KISS ALLOCATION</span>
            </div>
            <span className="text-xs font-mono text-cyan-400">SYSTEMATIC</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Object.entries(kissWeights).map(([ticker, wt]) => (
              <div
                key={ticker}
                className="bg-[#121c2e] px-2.5 py-1.5 rounded border border-slate-800 flex items-center justify-between"
              >
                <span className="text-sm font-mono font-semibold text-slate-200">{ticker}</span>
                <span className="text-sm font-mono font-bold text-cyan-400">{wt}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
