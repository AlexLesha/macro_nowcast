"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Activity,
  Filter,
} from "lucide-react";
import { MetricTip } from "@/components/FinancialTooltip";

interface StatArbPair {
  pair_id: string;
  ticker_a: string;
  ticker_b: string;
  sector: string;
  theme: string;
  spot_a: number;
  spot_b: number;
  hedge_ratio_beta: number;
  alpha_intercept: number;
  p_value: number;
  is_cointegrated: boolean;
  r_squared: number;
  half_life_days: number;
  ou_mean_reversion_speed: number;
  z_score: number;
  signal: "LONG_SPREAD" | "SHORT_SPREAD" | "NEUTRAL";
  action: string;
  rationale: string;
  target: string;
  stop_invalidation: string;
  conviction: string;
  spread_chart?: number[];
}

interface StatisticalArbitrageDashboardProps {
  statArbData: {
    as_of_utc?: string;
    pairs_scanned?: number;
    actionable_signals_count?: number;
    pairs?: StatArbPair[];
  } | null;
}

export const StatisticalArbitrageDashboard: React.FC<StatisticalArbitrageDashboardProps> = ({
  statArbData,
}) => {
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [signalFilter, setSignalFilter] = useState<string>("ALL");

  const pairs = statArbData?.pairs || [];
  const actionableCount = statArbData?.actionable_signals_count || 0;
  const pairsScanned = statArbData?.pairs_scanned || pairs.length;

  const sectors = Array.from(new Set(pairs.map((p) => p.sector))).filter(Boolean);

  const filteredPairs = pairs.filter((p) => {
    if (sectorFilter !== "ALL" && p.sector !== sectorFilter) return false;
    if (signalFilter === "ACTIONABLE" && p.signal === "NEUTRAL") return false;
    if (signalFilter === "LONG_SPREAD" && p.signal !== "LONG_SPREAD") return false;
    if (signalFilter === "SHORT_SPREAD" && p.signal !== "SHORT_SPREAD") return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER SCOREBOARD */}
      <section className="rounded-xl border border-purple-500/30 bg-[#120F1D] p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-950/60 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-purple-400 font-bold">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span>Institutional Statistical Arbitrage &amp; Intra-Sector Cointegration</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white mt-1">
              Mean-Reverting Pairs &amp; Spread Z-Score Alpha Radar
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
              Vectorized <MetricTip term="ENGLE-GRANGER">Engle-Granger Two-Step OLS Cointegration</MetricTip> identifying stationary residual spreads, coupled with <MetricTip term="ORNSTEIN-UHLENBECK">Ornstein-Uhlenbeck (OU)</MetricTip> mean-reversion speed modeling and strict &plusmn;3.5&sigma; divergence stops.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 text-xs font-mono font-semibold">
              Actionable Signals: {actionableCount}
            </span>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono space-y-1">
            <div className="text-[10px] uppercase text-slate-400">Total Pairs Scanned</div>
            <div className="text-lg font-bold text-white">{pairsScanned} Bellwethers</div>
            <div className="text-[10px] text-slate-500">11 GICS Sectors + Macro</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono space-y-1">
            <div className="text-[10px] uppercase text-slate-400">
              <MetricTip term="SPREAD Z-SCORE" explanation="The number of standard deviations the current price spread has dislocated from its 60-day historical mean. |Z| > 2.2 indicates statistical dislocation.">
                Divergent Spreads (|Z| &ge; 2.2&sigma;)
              </MetricTip>
            </div>
            <div className={`text-lg font-bold ${actionableCount > 0 ? "text-emerald-400" : "text-slate-400"}`}>
              {actionableCount} Active Signals
            </div>
            <div className="text-[10px] text-slate-500">Target Reversion: Z &rarr; 0.0</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono space-y-1">
            <div className="text-[10px] uppercase text-slate-400">
              <MetricTip term="ENGLE-GRANGER" explanation="Two-step econometric test (OLS regression + Augmented Dickey-Fuller stationarity test). A p-value < 0.05 proves the spread is genuinely cointegrated rather than spurious.">
                Avg Cointegration p-value
              </MetricTip>
            </div>
            <div className="text-lg font-bold text-cyan-300">
              {pairs.length > 0 ? (pairs.reduce((acc, p) => acc + p.p_value, 0) / pairs.length).toFixed(3) : "0.045"}
            </div>
            <div className="text-[10px] text-slate-500">Threshold: p &lt; 0.05</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono space-y-1">
            <div className="text-[10px] uppercase text-slate-400">
              <MetricTip term="ORNSTEIN-UHLENBECK" explanation="Mean-reverting stochastic process. Half-life (t_half) measures the expected number of trading days for a 50% reversion of the dislocated spread back to equilibrium.">
                Median OU Half-Life
              </MetricTip>
            </div>
            <div className="text-lg font-bold text-amber-300">
              {pairs.length > 0 ? Math.round(pairs[Math.floor(pairs.length / 2)]?.half_life_days || 18) : 18} Trading Days
            </div>
            <div className="text-[10px] text-slate-500">Optimal: 5 to 45 Days</div>
          </div>
        </div>
      </section>

      {/* FILTER CONTROLS */}
      <section className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800 bg-[#111827]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Sector:</span>
          </span>
          <button
            onClick={() => setSectorFilter("ALL")}
            className={`px-2.5 py-1 rounded text-xs font-mono transition ${
              sectorFilter === "ALL" ? "bg-purple-600 text-white font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All Sectors ({pairs.length})
          </button>
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSectorFilter(sec)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                sectorFilter === sec ? "bg-purple-600 text-white font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase text-slate-400">Signal:</span>
          {(["ALL", "ACTIONABLE", "LONG_SPREAD", "SHORT_SPREAD"] as const).map((sig) => (
            <button
              key={sig}
              onClick={() => setSignalFilter(sig)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                signalFilter === sig ? "bg-cyan-600 text-white font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {sig === "ACTIONABLE" ? "⚡ Actionable Only" : sig.replace("_", " ")}
            </button>
          ))}
        </div>
      </section>

      {/* PAIRS CARDS GRID */}
      {filteredPairs.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-xs font-mono text-slate-400">
          No statistical arbitrage pairs match the active sector or signal filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPairs.map((p) => {
            const isLong = p.signal === "LONG_SPREAD";
            const isShort = p.signal === "SHORT_SPREAD";
            const isActionable = isLong || isShort;

            return (
              <div
                key={p.pair_id}
                className={`rounded-xl border p-4 space-y-3 flex flex-col justify-between transition shadow-md ${
                  isActionable
                    ? isLong
                      ? "border-emerald-500/50 bg-[#0C1717] hover:border-emerald-400/80"
                      : "border-purple-500/50 bg-[#140E1E] hover:border-purple-400/80"
                    : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                }`}
              >
                <div className="space-y-2.5">
                  {/* Pair Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/stock-analysis?ticker=${p.ticker_a}`}
                          className="text-base font-bold text-white hover:text-cyan-400 transition font-mono"
                        >
                          ${p.ticker_a}
                        </Link>
                        <span className="text-slate-500 text-xs font-mono font-bold">vs</span>
                        <Link
                          href={`/stock-analysis?ticker=${p.ticker_b}`}
                          className="text-base font-bold text-white hover:text-cyan-400 transition font-mono"
                        >
                          ${p.ticker_b}
                        </Link>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {p.sector} &bull; {p.theme}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        isLong
                          ? "bg-emerald-950/80 border-emerald-600 text-emerald-300"
                          : isShort
                          ? "bg-purple-950/80 border-purple-600 text-purple-300"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}
                    >
                      {p.signal.replace("_", " ")}
                    </span>
                  </div>

                  {/* Quantitative Telemetry Strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2.5 rounded bg-black/40 border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 text-[10px]">Spread Z-Score:</span>
                      <div
                        className={`text-sm font-bold ${
                          p.z_score <= -2.2
                            ? "text-emerald-400"
                            : p.z_score >= 2.2
                            ? "text-rose-400"
                            : "text-slate-300"
                        }`}
                      >
                        {p.z_score > 0 ? "+" : ""}
                        {p.z_score.toFixed(2)}&sigma;
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px]">OU Half-Life:</span>
                      <div className="text-sm font-bold text-amber-300">
                        {p.half_life_days} Days
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px]">Hedge Ratio (&beta;):</span>
                      <div className="text-xs font-semibold text-cyan-300">
                        {p.hedge_ratio_beta.toFixed(3)}x
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px]">Cointegration p-val:</span>
                      <div
                        className={`text-xs font-semibold ${
                          p.p_value < 0.05 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {p.p_value.toFixed(4)} ({p.is_cointegrated ? "Stationary" : "Near-Stationary"})
                      </div>
                    </div>
                  </div>

                  {/* Actionable Execution Ticket */}
                  <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                        Execution Direction:
                      </span>
                      <p className="text-slate-100 font-semibold mt-0.5">
                        {p.action}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Rationale &amp; Thesis:
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                        {p.rationale}
                      </p>
                    </div>

                    <div className="pt-1 border-t border-slate-800/80 flex flex-col gap-1 text-[11px]">
                      <div>
                        <span className="text-emerald-400 font-semibold">Target: </span>
                        <span className="text-slate-300">{p.target}</span>
                      </div>
                      <div>
                        <span className="text-rose-400 font-semibold">Stop: </span>
                        <span className="text-slate-400">{p.stop_invalidation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-800/60">
                  <span>OLS R&sup2;: {p.r_squared.toFixed(2)}</span>
                  <span className="text-slate-400 font-semibold">Conviction: {p.conviction}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

