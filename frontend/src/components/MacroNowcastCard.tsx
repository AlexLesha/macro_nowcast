"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Flame,
  Globe,
  Clock,
  Layers,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface MacroNowcastProps {
  onRefresh?: () => void;
}

export const MacroNowcastCard: React.FC<MacroNowcastProps> = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchNowcast = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quant/full-nowcast");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error("Failed to load quant nowcast:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNowcast();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-8 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400" />
        <span>Calculating Prometheus Growth, Inflation Vectors &amp; 1965 Similarity...</span>
      </div>
    );
  }

  if (!data) return null;

  const growth = data.growth;
  const inflation = data.inflation;
  const quads = data.quads;
  const sim = data.similarity_1965;

  const housingAlert = growth?.housing_recession_alert;
  const profitImpulse = growth?.kalecki_levy_profit_impulse;
  const promDecomp = inflation?.prometheus_decomposition;
  const primaryAnalog = sim?.primary_analog;
  const expectedReturns = sim?.similarity_weighted_expected_returns;

  return (
    <div className="space-y-6">
      {/* SECTION A: Growth & Inflation Nowcast Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Growth Card */}
        <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                PROMETHEUS GDP GROWTH NOWCAST
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              MOMENTUM Z: +{growth.growth_momentum_z}σ
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">
                US REAL GDP NOWCAST
              </span>
              <div className="text-2xl font-black font-mono text-emerald-400">
                +{growth.real_gdp_nowcast_annualized}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono">ANNUALIZED RUN-RATE</span>
            </div>

            <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">
                NOMINAL GDP NOWCAST
              </span>
              <div className="text-2xl font-black font-mono text-cyan-400">
                +{growth.nominal_gdp_nowcast_annualized}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono">REAL + DEFLATOR PROXY</span>
            </div>
          </div>

          {/* Component Contributions */}
          <div className="space-y-2 font-mono text-xs mb-4">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
              COMPONENT FACTOR WEIGHTS
            </span>
            {Object.entries(growth.components || {}).map(([key, comp]: [string, any]) => (
              <div key={key} className="flex items-center justify-between py-1 border-b border-slate-800/40 text-[11px]">
                <span className="text-slate-300">
                  {key.replace(/_/g, " ").toUpperCase()} ({(comp.weight * 100).toFixed(0)}%)
                </span>
                <span className="font-bold text-slate-100">
                  +{comp.roc}% ({comp.contribution > 0 ? "+" : ""}{comp.contribution}%)
                </span>
              </div>
            ))}
          </div>

          {/* Kalecki-Levy & Housing Recession Alert */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Kalecki-Levy */}
            <div className="bg-[#0a101c] p-2.5 rounded border border-slate-800 text-[11px] font-mono">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-semibold">KALECKI-LEVY IMPULSE</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    profitImpulse.state === "EXPANSIONARY"
                      ? "text-emerald-400 bg-emerald-950"
                      : "text-amber-400 bg-amber-950"
                  }`}
                >
                  {profitImpulse.state}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{profitImpulse.description}</p>
            </div>

            {/* Housing Alert */}
            <div
              className={`p-2.5 rounded border text-[11px] font-mono ${
                housingAlert.is_active
                  ? "bg-rose-950/40 border-rose-800 text-rose-300"
                  : "bg-[#0a101c] border-slate-800 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold flex items-center gap-1">
                  {housingAlert.is_active ? <AlertTriangle className="h-3 w-3 text-rose-400" /> : null}
                  HOUSING RECESSION ALERT
                </span>
                <span className="text-[9px] font-bold">
                  {housingAlert.drawdown_pct}% PEAK DD
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{housingAlert.status}</p>
            </div>
          </div>
        </div>

        {/* Inflation Card */}
        <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-400" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                3FOURTEEN 3 VECTORS &amp; PROMETHEUS INFLATION
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {promDecomp.primary_driver}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">
                HEADLINE CPI NOWCAST
              </span>
              <div className="text-2xl font-black font-mono text-rose-400">
                +{inflation.headline_cpi_nowcast_yoy}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                +{inflation.headline_cpi_nowcast_mom}% MOM
              </span>
            </div>

            <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">
                CORE PCE NOWCAST
              </span>
              <div className="text-2xl font-black font-mono text-amber-400">
                +{inflation.core_pce_nowcast_yoy}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                +{inflation.core_pce_nowcast_mom}% MOM
              </span>
            </div>
          </div>

          {/* 3Fourteen 3 Vectors Breakdown */}
          <div className="space-y-2 font-mono text-xs mb-4">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
              3FOURTEEN 3 VECTORS DECOMPOSITION
            </span>
            <div className="bg-[#0b1220] p-2.5 rounded border border-slate-800/80 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-300">Vector 1: Brent Energy / Fuel (20%)</span>
                <span className="font-bold text-slate-200">
                  +{inflation.three_fourteen_vectors.energy_vector.contribution_cpi_pct}% contribution
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Vector 2: Shelter Rent Decay (35%)</span>
                <span className="font-bold text-slate-200">
                  +{inflation.three_fourteen_vectors.shelter_vector.contribution_cpi_pct}% contribution
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Vector 3: Wage &amp; Sticky Labor (45%)</span>
                <span className="font-bold text-slate-200">
                  +{inflation.three_fourteen_vectors.wage_labor_vector.contribution_cpi_pct}% contribution
                </span>
              </div>
            </div>
          </div>

          {/* Prometheus Demand vs Supply Breakdown */}
          <div className="bg-[#0a101c] p-3 rounded border border-slate-800 font-mono text-[11px]">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>DEMAND PRESSURE (SERVICES/WAGES): +{promDecomp.demand_pressure_score}σ</span>
              <span>SUPPLY PRESSURE (ENERGY/GOODS): +{promDecomp.supply_pressure_score}σ</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div style={{ width: "65%" }} className="bg-rose-500" title="Demand 65%" />
              <div style={{ width: "35%" }} className="bg-amber-500" title="Supply 35%" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: 4-Quarter Forward Quad Path & 15 Global Country ETFs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Forward 4Q Sequence */}
        <div className="lg:col-span-5 bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <Clock className="h-4 w-4 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
              4-QUARTER FORWARD QUAD SEQUENCE (12M BASE EFFECTS)
            </h3>
          </div>

          <div className="space-y-3 font-mono">
            {quads.forward_4q_quad_count.map((q: any, i: number) => {
              const isQuad2 = q.quad === "QUAD_2";
              const isQuad1 = q.quad === "QUAD_1";
              const isQuad3 = q.quad === "QUAD_3";

              return (
                <div
                  key={q.quarter}
                  className="bg-[#121c2e] p-3 rounded-lg border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{q.quarter}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isQuad2
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : isQuad1
                          ? "bg-sky-950 text-sky-300 border-sky-800"
                          : isQuad3
                          ? "bg-amber-950 text-amber-300 border-amber-800"
                          : "bg-rose-950 text-rose-300 border-rose-800"
                      }`}
                    >
                      {q.quad} ({q.modifier})
                    </span>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <span>
                      G: <strong className="text-white">+{q.projected_growth_yoy}%</strong>
                    </span>
                    <span className="ml-2">
                      I: <strong className="text-white">+{q.projected_inflation_yoy}%</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 15 Country ETFs Matrix */}
        <div className="lg:col-span-7 bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-400" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                15 GLOBAL COUNTRY ETFS QUAD HEAT MAP
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">CROSS-ASSET REGIMES</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
            {quads.global_15_country_matrix.map((c: any) => {
              const isQ1 = c.quad === "QUAD_1";
              const isQ2 = c.quad === "QUAD_2";
              const isQ3 = c.quad === "QUAD_3";

              return (
                <div
                  key={c.ticker}
                  className="bg-[#121c2e] p-2.5 rounded border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{c.ticker}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        isQ2
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : isQ1
                          ? "bg-sky-950 text-sky-300 border-sky-800"
                          : isQ3
                          ? "bg-amber-950 text-amber-300 border-amber-800"
                          : "bg-rose-950 text-rose-300 border-rose-800"
                      }`}
                    >
                      {c.quad}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{c.country}</div>
                  <div className="text-[9px] text-slate-500 mt-1">
                    G: +{c.growth_roc}% | I: +{c.inflation_roc}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION C: Prometheus 1965 Mahalanobis Similarity & Expected Returns */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
              PROMETHEUS 1965 MAHALANOBIS HISTORICAL SIMILARITY &amp; EXPECTED RETURNS
            </h3>
          </div>
          {primaryAnalog && (
            <span className="text-xs font-mono px-3 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              PRIMARY MATCH: {primaryAnalog.regime_name} ({primaryAnalog.similarity_score}% Match)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top 5 Historical Analogs */}
          <div className="lg:col-span-6 space-y-2.5 font-mono text-xs">
            <span className="text-[10px] uppercase text-slate-500 font-semibold block">
              TOP 5 1965-PRESENT HISTORICAL ANALOG PERIODS
            </span>
            {sim.top_analogs.map((a: any) => (
              <div
                key={a.date}
                className="bg-[#121c2e] p-2.5 rounded border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-100 mr-2">#{a.rank}</span>
                  <span className="text-cyan-300 font-semibold">{a.regime_name}</span>
                  <span className="text-[10px] text-slate-500 block">Date: {a.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">{a.similarity_score}% Match</span>
                  <span className="text-[10px] text-slate-500 block">D_M: {a.mahalanobis_distance}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Similarity-Weighted Forward Expected Returns */}
          <div className="lg:col-span-6">
            <span className="text-[10px] uppercase text-slate-500 font-semibold font-mono block mb-2.5">
              REGIME-SIMILARITY-WEIGHTED FORWARD EXPECTED RETURNS
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              {/* SPY */}
              <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">EQUITIES (SPY)</span>
                <div className="text-base font-bold text-emerald-400">
                  +{expectedReturns.equities_spy.expected_63d_pct}% (63d)
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  21d: +{expectedReturns.equities_spy.expected_21d_pct}%
                </span>
              </div>

              {/* IEF */}
              <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">TREASURIES (IEF)</span>
                <div className="text-base font-bold text-cyan-400">
                  +{expectedReturns.treasuries_ief.expected_63d_pct}% (63d)
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {expectedReturns.treasuries_ief.conviction}
                </span>
              </div>

              {/* PDBC */}
              <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">COMMODITIES (PDBC)</span>
                <div className="text-base font-bold text-amber-400">
                  +{expectedReturns.commodities_pdbc.expected_63d_pct}% (63d)
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {expectedReturns.commodities_pdbc.conviction}
                </span>
              </div>

              {/* GLD */}
              <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">GOLD (GLD)</span>
                <div className="text-base font-bold text-yellow-400">
                  +{expectedReturns.gold_gld.expected_63d_pct}% (63d)
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {expectedReturns.gold_gld.conviction}
                </span>
              </div>

              {/* TIP */}
              <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">TIPS (TIP)</span>
                <div className="text-base font-bold text-indigo-400">
                  +{expectedReturns.tips_tip.expected_63d_pct}% (63d)
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {expectedReturns.tips_tip.conviction}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
