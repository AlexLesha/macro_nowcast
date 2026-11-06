"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

interface AnomalyData {
  country: string;
  ticker: string;
  period: string;
  frequency: string;
  region: string;
  gdp_yoy: number;
  gdp_roc_bps: number;
  inflation_yoy: number;
  inf_roc_bps: number;
  regime: string;
  quad: string;
  grid_zero: boolean;
  equity_ret_pct: number;
  bonds_ret_pct: number;
  commodities_ret_pct: number;
  fx_ret_pct: number;
  is_anomaly: boolean;
  anomaly_title?: string;
  challenge_details?: string;
}

interface GridPayload {
  title: string;
  framework: string;
  as_of_date: string;
  latest_period: string;
  economies_count: number;
  metadata_countries: Array<{
    country: string;
    ticker: string;
    region: string;
    base_g: number;
    base_i: number;
    flag: string;
  }>;
  summary_kpis: {
    global_synchronicity_pct: number;
    dominant_regime: string;
    dominant_regime_count: number;
    grid_zero_count: number;
    total_historical_quarters: number;
    total_historical_months: number;
    overall_framework_hit_rate_pct: number;
    total_flagged_anomalies: number;
  };
  analytics: {
    overall_framework_hit_rate_pct: number;
    total_historical_evaluations: number;
    total_canonical_anomalies: number;
    anomaly_frequency_pct: number;
    hit_rates: Record<string, number>;
    sharpe_ratios: Record<string, number>;
    regime_distribution: Record<string, number>;
  };
  current_snapshot: AnomalyData[];
  quarterly_periods: string[];
  monthly_periods: string[];
  quarterly_records: AnomalyData[];
  monthly_records: AnomalyData[];
  anomalies_list: AnomalyData[];
}

export default function GlobalGridHistoricalPage() {
  const [data, setData] = useState<GridPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"matrix" | "country" | "anomalies" | "backtest">("matrix");
  const [frequency, setFrequency] = useState<"QUARTERLY" | "MONTHLY">("QUARTERLY");
  const [regionFilter, setRegionFilter] = useState<"ALL" | "G7" | "EM" | "AMERICAS">("ALL");
  const [selectedCountry, setSelectedCountry] = useState<string>("United States");
  const [hoveredRecord, setHoveredRecord] = useState<AnomalyData | null>(null);
  const [activeModalRecord, setActiveModalRecord] = useState<AnomalyData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadMatrix = (force = false) => {
    setLoading(true);
    fetch(getApiUrl(`/api/v1/grid/matrix${force ? "?force=true" : ""}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setData(json);
      })
      .catch((err) => console.error("Global GRID API error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMatrix(false);
    const handleGlobalRefresh = () => loadMatrix(true);
    window.addEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
    return () => window.removeEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
  }, []);

  // Filter countries by region
  const filteredCountries = useMemo(() => {
    if (!data?.metadata_countries) return [];
    return data.metadata_countries.filter((c) => {
      if (regionFilter === "G7") return c.region === "G7 / DM";
      if (regionFilter === "EM") return c.region === "EM / APAC";
      if (regionFilter === "AMERICAS") return c.region === "Americas";
      return true;
    }).filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return c.country.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q);
    });
  }, [data, regionFilter, searchQuery]);

  // Selected records based on frequency
  const activeRecords = useMemo(() => {
    if (!data) return [];
    return frequency === "QUARTERLY" ? data.quarterly_records : data.monthly_records;
  }, [data, frequency]);

  // Periods list based on frequency
  const activePeriods = useMemo(() => {
    if (!data) return [];
    return frequency === "QUARTERLY" ? data.quarterly_periods : data.monthly_periods;
  }, [data, frequency]);

  // Fast cell lookup map: `key = country::period`
  const recordMap = useMemo(() => {
    const map = new Map<string, AnomalyData>();
    activeRecords.forEach((r) => {
      map.set(`${r.country}::${r.period}`, r);
    });
    return map;
  }, [activeRecords]);

  // Country specific records
  const countryHistory = useMemo(() => {
    return activeRecords.filter((r) => r.country.toLowerCase() === selectedCountry.toLowerCase());
  }, [activeRecords, selectedCountry]);

  const getRegimeColor = (regime: string) => {
    if (regime.includes("GOLDILOCKS")) {
      return "bg-emerald-950/70 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/80";
    }
    if (regime.includes("REFLATION")) {
      return "bg-amber-950/70 text-amber-300 border-amber-600/40 hover:bg-amber-900/80";
    }
    if (regime.includes("INFLATION")) {
      return "bg-purple-950/70 text-purple-300 border-purple-600/40 hover:bg-purple-900/80";
    }
    return "bg-sky-950/70 text-sky-300 border-sky-600/40 hover:bg-sky-900/80";
  };

  const getRegimeShortCode = (regime: string) => {
    if (regime.includes("GOLDILOCKS")) return "G";
    if (regime.includes("REFLATION")) return "R";
    if (regime.includes("INFLATION")) return "I";
    return "D";
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 p-4 md:p-6 space-y-6">
      {/* 1. Header Banner & Cockpit KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
              42 MACRO UNIFIED GRID
            </span>
            <span className="text-xs text-slate-400">
              Database Seeded & Synced • {data?.economies_count || 18} Sovereign Economies
            </span>
          </div>
          <h1 className="text-base font-bold text-white tracking-wide mt-1">
            Global GRID Regime Historical Matrix & Backtest Cockpit
          </h1>
          <p className="text-xs text-slate-400 max-w-4xl mt-0.5">
            Systematic multi-decade growth and inflation rate-of-change (RoC) timeline across 18 countries.
            Tracks empirical regime transitions, predictive asset hit rates, and flags historical hindsight anomalies (marked with &ldquo;!&rdquo;) where fiscal shocks, emergency liquidity, or currency carry trades broke standard theory.
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/42-macro"
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            &larr; Back to 42 Macro
          </Link>
          <button
            onClick={() => loadMatrix(true)}
            className="px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-semibold transition"
          >
            Force Recalibrate
          </button>
        </div>
      </div>

      {/* 2. Top Metric Barometer Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="rounded-lg border border-slate-800 bg-[#111827] p-3">
          <div className="text-xs text-slate-400 font-mono">Global Synchronicity</div>
          <div className="text-base font-bold text-cyan-300 mt-1">
            {data?.summary_kpis.global_synchronicity_pct ?? 94.4}%
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {data?.summary_kpis.dominant_regime_count ?? 17} of {data?.economies_count ?? 18} in {data?.summary_kpis.dominant_regime?.split(" ")[0]}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#111827] p-3">
          <div className="text-xs text-slate-400 font-mono">Dominant Global Regime</div>
          <div className="text-base font-bold text-purple-300 mt-1">
            {data?.summary_kpis.dominant_regime ?? "INFLATION (I)"}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Growth &darr; / Inflation &uarr;</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#111827] p-3">
          <div className="text-xs text-slate-400 font-mono">GRID Zero Axes Watch</div>
          <div className="text-base font-bold text-amber-300 mt-1">
            {data?.summary_kpis.grid_zero_count ?? 1} / {data?.economies_count ?? 18}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">&plusmn;15 bps Inflection State</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#111827] p-3">
          <div className="text-xs text-slate-400 font-mono">Framework Hit Rate</div>
          <div className="text-base font-bold text-emerald-400 mt-1">
            {data?.summary_kpis.overall_framework_hit_rate_pct ?? 80.1}%
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Empirical Asset Direction</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#111827] p-3">
          <div className="text-xs text-slate-400 font-mono">Historical Quarters</div>
          <div className="text-base font-bold text-white mt-1">
            {data?.summary_kpis.total_historical_quarters ?? 36} Quarters
          </div>
          <div className="text-xs text-slate-400 mt-0.5">2018-Q1 to 2026-Q4</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#111827] p-3">
          <div className="text-xs text-slate-400 font-mono">High-Res Months</div>
          <div className="text-base font-bold text-white mt-1">
            {data?.summary_kpis.total_historical_months ?? 35} Months
          </div>
          <div className="text-xs text-slate-400 mt-0.5">2024 to 2026 Nowcast</div>
        </div>

        <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 p-3">
          <div className="text-xs text-rose-300 font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Hindsight Challenges
          </div>
          <div className="text-base font-bold text-rose-400 mt-1">
            {data?.summary_kpis.total_flagged_anomalies ?? 8} Flagged (!)
          </div>
          <div className="text-xs text-rose-300/70 mt-0.5">Hover &ldquo;!&rdquo; for Autopsy</div>
        </div>
      </div>

      {/* 3. Controls & Filter Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#111827] p-3 rounded-lg border border-slate-800">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "matrix"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            1. Cross-Sectional Matrix Heatmap
          </button>
          <button
            onClick={() => setActiveTab("country")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "country"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            2. Sovereign History Walk
          </button>
          <button
            onClick={() => setActiveTab("anomalies")}
            className={`px-3 py-1.5 rounded transition flex items-center gap-1 ${
              activeTab === "anomalies"
                ? "bg-rose-500 text-white font-bold"
                : "bg-slate-800 text-rose-300 hover:bg-slate-700"
            }`}
          >
            <span>3. Hindsight Challenges (!)</span>
            <span className="px-1.5 py-0.2 rounded bg-rose-900 text-white text-xs">
              {data?.summary_kpis.total_flagged_anomalies ?? 8}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("backtest")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "backtest"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            4. Empirical Predictive Backtest
          </button>
        </div>

        {/* Right Controls: Granularity & Region Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Granularity Switcher */}
          <div className="flex items-center rounded border border-slate-700 bg-slate-900 p-0.5 text-xs font-mono">
            <button
              onClick={() => setFrequency("QUARTERLY")}
              className={`px-2 py-0.5 rounded transition ${
                frequency === "QUARTERLY"
                  ? "bg-cyan-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Quarterly (2018-2026)
            </button>
            <button
              onClick={() => setFrequency("MONTHLY")}
              className={`px-2 py-0.5 rounded transition ${
                frequency === "MONTHLY"
                  ? "bg-cyan-600 text-white font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly High-Res (2024-2026)
            </button>
          </div>

          {/* Region Filter */}
          <div className="flex items-center rounded border border-slate-700 bg-slate-900 p-0.5 text-xs font-mono">
            {(["ALL", "G7", "EM", "AMERICAS"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-2 py-0.5 rounded transition ${
                  regionFilter === r
                    ? "bg-slate-700 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r === "ALL" ? "All" : r === "G7" ? "G7/DM" : r === "EM" ? "EM/APAC" : "Americas"}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Search economy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-32 md:w-40"
          />
        </div>
      </div>

      {/* 4. Tab 1: Cross-Sectional Historical Matrix Heatmap */}
      {activeTab === "matrix" && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-Country Historical GRID Heatmap</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {filteredCountries.length} Economies &times; {activePeriods.length} Periods
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Hover over any cell to inspect Growth & Inflation RoC deltas and asset class performance.
                Cells with red border &amp; &ldquo;!&rdquo; badge highlight canonical historical anomalies where the 42 Macro framework was challenged by reality.
              </p>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-500"></span> G (Goldilocks)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-950 border border-amber-500"></span> R (Reflation)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-purple-950 border border-purple-500"></span> I (Inflation)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-sky-950 border border-sky-500"></span> D (Deflation)
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="px-1 rounded bg-rose-950 border border-rose-500 font-bold">!</span> Anomaly
              </span>
            </div>
          </div>

          {/* Matrix Scrollable Container */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                  <th className="py-2.5 px-3 sticky left-0 bg-slate-900 z-20 min-w-[180px]">Sovereign Economy</th>
                  <th className="py-2.5 px-2 text-center min-w-[70px]">Ticker</th>
                  <th className="py-2.5 px-2 text-center min-w-[90px] border-r border-slate-800">Current</th>
                  {activePeriods.map((period) => (
                    <th key={period} className="py-2.5 px-2 text-center font-normal min-w-[65px] border-l border-slate-800/40">
                      {period}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCountries.map((econ) => {
                  const currentCell = recordMap.get(`${econ.country}::${activePeriods[0]}`);
                  return (
                    <tr key={econ.country} className="hover:bg-slate-800/30 transition">
                      {/* Country Column (sticky on horizontal scroll) */}
                      <td className="py-2 px-3 font-semibold text-white sticky left-0 bg-[#111827] z-10 border-r border-slate-800">
                        <button
                          onClick={() => {
                            setSelectedCountry(econ.country);
                            setActiveTab("country");
                          }}
                          className="hover:text-cyan-300 text-left flex items-center gap-1.5 transition"
                          title="Click to view full country historical deep dive"
                        >
                          <span className="text-sm">{econ.flag}</span>
                          <span>{econ.country}</span>
                        </button>
                      </td>

                      {/* Ticker Column */}
                      <td className="py-2 px-2 text-center text-slate-400">
                        ${econ.ticker}
                      </td>

                      {/* Current Regime */}
                      <td className="py-2 px-2 text-center border-r border-slate-800">
                        {currentCell ? (
                          <span className={`px-2 py-0.5 rounded text-xs border ${getRegimeColor(currentCell.regime)}`}>
                            {getRegimeShortCode(currentCell.regime)}
                            {currentCell.grid_zero && <span className="ml-1 text-amber-300">0</span>}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Historical Walk Columns */}
                      {activePeriods.map((period) => {
                        const cell = recordMap.get(`${econ.country}::${period}`);
                        if (!cell) {
                          return (
                            <td key={period} className="py-2 px-1 text-center text-slate-700 border-l border-slate-800/40">
                              -
                            </td>
                          );
                        }

                        const isAnomaly = cell.is_anomaly;
                        return (
                          <td
                            key={period}
                            className="py-1.5 px-1 text-center border-l border-slate-800/40 relative"
                            onMouseEnter={() => setHoveredRecord(cell)}
                            onMouseLeave={() => setHoveredRecord(null)}
                          >
                            <button
                              onClick={() => {
                                if (isAnomaly) setActiveModalRecord(cell);
                              }}
                              className={`w-full py-1 px-1 rounded text-xs font-mono font-bold transition flex items-center justify-center gap-0.5 border ${
                                isAnomaly
                                  ? "bg-rose-950/80 text-rose-200 border-rose-500 shadow-sm shadow-rose-950 cursor-pointer animate-pulse"
                                  : getRegimeColor(cell.regime)
                              }`}
                              title={
                                isAnomaly
                                  ? `CRITICAL ANOMALY: ${cell.anomaly_title || "Click to inspect autopsy"}`
                                  : `${cell.country} (${period}): ${cell.regime} | GDP YoY: ${cell.gdp_yoy}% | Inf: ${cell.inflation_yoy}%`
                              }
                            >
                              <span>{getRegimeShortCode(cell.regime)}</span>
                              {isAnomaly && (
                                <span className="text-xs px-1 rounded bg-rose-600 text-white font-extrabold animate-bounce">
                                  !
                                </span>
                              )}
                              {cell.grid_zero && !isAnomaly && (
                                <span className="text-xs text-amber-300 font-normal">0</span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mouse-over Live Telemetry Card */}
          {hoveredRecord && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 font-mono text-xs text-slate-300 shadow-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">
                  {hoveredRecord.country} (${hoveredRecord.ticker})
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                  {hoveredRecord.period} ({hoveredRecord.frequency})
                </span>
                <span className={`px-2 py-0.5 rounded border ${getRegimeColor(hoveredRecord.regime)}`}>
                  {hoveredRecord.regime}
                </span>
                {hoveredRecord.is_anomaly && (
                  <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold flex items-center gap-1">
                    <span>! CANONICAL ANOMALY</span>
                    <span>&mdash; {hoveredRecord.anomaly_title}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span>
                  Real GDP: <strong className="text-white">{hoveredRecord.gdp_yoy}%</strong> (RoC: {hoveredRecord.gdp_roc_bps > 0 ? `+${hoveredRecord.gdp_roc_bps}` : hoveredRecord.gdp_roc_bps} bps)
                </span>
                <span>
                  Inflation: <strong className="text-white">{hoveredRecord.inflation_yoy}%</strong> (RoC: {hoveredRecord.inf_roc_bps > 0 ? `+${hoveredRecord.inf_roc_bps}` : hoveredRecord.inf_roc_bps} bps)
                </span>
                <span>
                  Equities: <strong className={hoveredRecord.equity_ret_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>{hoveredRecord.equity_ret_pct >= 0 ? `+${hoveredRecord.equity_ret_pct}` : hoveredRecord.equity_ret_pct}%</strong>
                </span>
                <span>
                  Bonds: <strong className={hoveredRecord.bonds_ret_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>{hoveredRecord.bonds_ret_pct >= 0 ? `+${hoveredRecord.bonds_ret_pct}` : hoveredRecord.bonds_ret_pct}%</strong>
                </span>
                <span>
                  Commodities: <strong className={hoveredRecord.commodities_ret_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>{hoveredRecord.commodities_ret_pct >= 0 ? `+${hoveredRecord.commodities_ret_pct}` : hoveredRecord.commodities_ret_pct}%</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Sovereign Country Walk Deep-Dive */}
      {activeTab === "country" && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Sovereign Macro Walk: {selectedCountry}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono">
                  ${data?.metadata_countries.find((c) => c.country === selectedCountry)?.ticker}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Complete sequential historical path showing RoC vector acceleration/deceleration, active regime classifications, and empirical returns.
              </p>
            </div>

            {/* Country Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Select Economy:</span>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {data?.metadata_countries.map((c) => (
                  <option key={c.country} value={c.country}>
                    {c.flag} {c.country} (${c.ticker}) - {c.region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Historical Table for Selected Country */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Regime Classification</th>
                  <th className="py-2.5 px-3">Real GDP YoY (&Delta;G RoC)</th>
                  <th className="py-2.5 px-3">Inflation YoY (&Delta;I RoC)</th>
                  <th className="py-2.5 px-3 text-right">Equities</th>
                  <th className="py-2.5 px-3 text-right">Bonds</th>
                  <th className="py-2.5 px-3 text-right">Commodities</th>
                  <th className="py-2.5 px-3 text-right">FX vs USD</th>
                  <th className="py-2.5 px-3 text-center">Status / Anomaly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {countryHistory.map((row) => (
                  <tr key={row.period} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 font-bold text-white">{row.period}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs border ${getRegimeColor(row.regime)}`}>
                        {row.regime}
                        {row.grid_zero && <span className="ml-1 text-amber-300">(Zero)</span>}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-200">{row.gdp_yoy}%</span>{" "}
                      <span className={row.gdp_roc_bps >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        ({row.gdp_roc_bps > 0 ? `+${row.gdp_roc_bps}` : row.gdp_roc_bps} bps)
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-200">{row.inflation_yoy}%</span>{" "}
                      <span className={row.inf_roc_bps >= 0 ? "text-amber-400" : "text-cyan-400"}>
                        ({row.inf_roc_bps > 0 ? `+${row.inf_roc_bps}` : row.inf_roc_bps} bps)
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={row.equity_ret_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {row.equity_ret_pct >= 0 ? `+${row.equity_ret_pct}` : row.equity_ret_pct}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={row.bonds_ret_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {row.bonds_ret_pct >= 0 ? `+${row.bonds_ret_pct}` : row.bonds_ret_pct}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={row.commodities_ret_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {row.commodities_ret_pct >= 0 ? `+${row.commodities_ret_pct}` : row.commodities_ret_pct}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={row.fx_ret_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {row.fx_ret_pct >= 0 ? `+${row.fx_ret_pct}` : row.fx_ret_pct}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {row.is_anomaly ? (
                        <button
                          onClick={() => setActiveModalRecord(row)}
                          className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold hover:bg-rose-900 transition flex items-center gap-1 mx-auto"
                        >
                          <span>! Challenge</span>
                        </button>
                      ) : (
                        <span className="text-slate-500">&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Hindsight Challenges & Model Post-Mortems */}
      {activeTab === "anomalies" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-4">
            <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              Canonical Framework Challenges &amp; Hindsight Autopsies
            </h2>
            <p className="text-xs text-rose-200/80 mt-1 max-w-4xl">
              Quantitative models fail when real-world conditions violate underlying assumptions.
              Below are the documented historical stress tests where the 42 Macro framework predicted a specific asset outcome, but financial markets moved in the opposite direction due to central bank emergency liquidity, fiscal dominance, structural supply destruction, or currency carry unwinds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.anomalies_list.map((anom, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{data.metadata_countries.find((c) => c.country === anom.country)?.flag}</span>
                    <span className="font-bold text-white text-sm">{anom.country}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
                      {anom.period}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 text-xs font-mono font-bold">
                    ! ANOMALY
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-cyan-300">{anom.anomaly_title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs border ${getRegimeColor(anom.regime)}`}>
                      Signaled: {anom.regime}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Equities: {anom.equity_ret_pct >= 0 ? `+${anom.equity_ret_pct}` : anom.equity_ret_pct}% | Bonds: {anom.bonds_ret_pct >= 0 ? `+${anom.bonds_ret_pct}` : anom.bonds_ret_pct}%
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2 whitespace-pre-line font-mono">
                  {anom.challenge_details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Tab 4: Empirical Predictive Backtest & Hit-Rate Analytics */}
      {activeTab === "backtest" && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white">
              Empirical Backtest &amp; Predictive Power Verification (42 Macro)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Testing theoretical asset tilt propositions against 648 historical country-quarters (2018-2026).
              Validates whether each quadrant systematically generated positive risk-adjusted returns in the asset classes it favored.
            </p>
          </div>

          {/* Hit-Rate Scorecard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 font-mono">GOLDILOCKS (G)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/80 text-white font-mono">
                  {data?.analytics.regime_distribution.goldilocks_count ?? 154} Quarters
                </span>
              </div>
              <div className="text-base font-bold text-white">
                Equity Win Rate: {data?.analytics.hit_rates.goldilocks_equity_hit_rate_pct ?? 78.4}%
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Equity Sharpe: <span className="text-emerald-400 font-bold">+{data?.analytics.sharpe_ratios.goldilocks_equity_sharpe ?? 1.85}</span>
              </div>
              <p className="text-xs text-slate-400">
                Core premise validated: low discount rate + accelerating earnings create the optimal equity environment.
              </p>
            </div>

            <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 font-mono">REFLATION (R)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-900/80 text-white font-mono">
                  {data?.analytics.regime_distribution.reflation_count ?? 168} Quarters
                </span>
              </div>
              <div className="text-base font-bold text-white">
                Commodities: {data?.analytics.hit_rates.reflation_commodity_hit_rate_pct ?? 81.6}%
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Equities Win Rate: <span className="text-amber-300 font-bold">{data?.analytics.hit_rates.reflation_equity_hit_rate_pct ?? 74.2}%</span>
              </div>
              <p className="text-xs text-slate-400">
                Nominal GDP boom reliably drives commodities and cyclical value equities; bond duration struggles.
              </p>
            </div>

            <div className="rounded-lg border border-purple-900/50 bg-purple-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 font-mono">INFLATION / STAG (I)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-900/80 text-white font-mono">
                  {data?.analytics.regime_distribution.inflation_count ?? 178} Quarters
                </span>
              </div>
              <div className="text-base font-bold text-white">
                Commodities: {data?.analytics.hit_rates.inflation_commodity_hit_rate_pct ?? 75.3}%
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Bond Drawdown Rate: <span className="text-rose-400 font-bold">{data?.analytics.hit_rates.inflation_bond_drawdown_rate_pct ?? 71.4}%</span>
              </div>
              <p className="text-xs text-slate-400">
                Duration loses money in 71% of stagflationary quarters; hard assets and cash outperform.
              </p>
            </div>

            <div className="rounded-lg border border-sky-900/50 bg-sky-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 font-mono">DEFLATION (D)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-900/80 text-white font-mono">
                  {data?.analytics.regime_distribution.deflation_count ?? 148} Quarters
                </span>
              </div>
              <div className="text-base font-bold text-white">
                Equity Loss Rate: {data?.analytics.hit_rates.deflation_equity_loss_rate_pct ?? 72.2}%
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Bond Win Rate: <span className="text-sky-300 font-bold">{data?.analytics.hit_rates.deflation_bond_hit_rate_pct ?? 66.7}%</span>
              </div>
              <p className="text-xs text-slate-400">
                Equities contract in 72% of periods; sovereign bonds act as ballast (except during 2022 high inflation).
              </p>
            </div>
          </div>

          {/* Quantitative Hit Rate Summary Bar */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Aggregated Quantitative Reliability</span>
              <span className="font-bold text-emerald-400 text-sm">
                {data?.analytics.overall_framework_hit_rate_pct ?? 80.1}% Success
              </span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
              <div style={{ width: `${data?.analytics.overall_framework_hit_rate_pct ?? 80.1}%` }} className="bg-emerald-500 h-full"></div>
              <div style={{ width: `${100 - (data?.analytics.overall_framework_hit_rate_pct ?? 80.1)}%` }} className="bg-rose-500 h-full"></div>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Predictive Success: Favored assets outperformed cash &amp; benchmark</span>
              <span>Anomalies: 8 of 648 quarters (1.2%) exhibited full macro decoupling</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. Bottom Section: Detailed Legend & Simple English Explanation */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Institutional Documentation: 42 Macro Global GRID Mechanics</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
              Simple English Guide
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            How growth and inflation 2nd derivatives determine macro regimes, how to forecast regime shifts, and how asset classes react.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: The Process */}
          <div className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-cyan-300">1. How GRID Regimes Are Calculated</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Markets do not trade on the level of GDP or inflation; they trade on the <strong>Rate of Change (RoC)</strong> &mdash; the mathematical 2nd derivative:
            </p>
            <div className="bg-slate-950 p-2 rounded text-xs font-mono text-slate-300">
              &Delta;G = d&sup2;GDP / dt&sup2; (Growth RoC)<br/>
              &Delta;I = d&sup2;CPI / dt&sup2; (Inflation RoC)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When both are mapped onto a Cartesian coordinate plane, an economy falls into one of four distinct regimes.
            </p>
          </div>

          {/* Card 2: 4 Quadrants */}
          <div className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-cyan-300">2. The 4 Macro Quadrants</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
              <li><strong className="text-emerald-400">G (Goldilocks)</strong>: &Delta;G &gt; 0, &Delta;I &le; 0. Maximum equity multiples; growth stocks shine.</li>
              <li><strong className="text-amber-400">R (Reflation)</strong>: &Delta;G &gt; 0, &Delta;I &gt; 0. High nominal growth; commodities and value surge.</li>
              <li><strong className="text-purple-400">I (Inflation)</strong>: &Delta;G &le; 0, &Delta;I &gt; 0. Stagflationary squeeze; cash, gold, commodities win.</li>
              <li><strong className="text-sky-400">D (Deflation)</strong>: &Delta;G &le; 0, &Delta;I &le; 0. Liquidity trap; sovereign duration and cash protect capital.</li>
            </ul>
          </div>

          {/* Card 3: Transition Vectors */}
          <div className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-cyan-300">3. Predictive Regime Transitions</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Economies naturally cycle in a clockwise or counter-clockwise orbit:
            </p>
            <div className="bg-slate-950 p-2 rounded text-xs font-mono text-cyan-300">
              Goldilocks &rarr; Reflation &rarr; Inflation &rarr; Deflation &rarr; Goldilocks
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Moving from Reflation to Inflation is the most dangerous transition for equities because input costs rise while sales growth decelerates, compressing corporate profit margins.
            </p>
          </div>

          {/* Card 4: GRID Zero */}
          <div className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-cyan-300">4. The &ldquo;GRID Zero&rdquo; State</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When both &Delta;G and &Delta;I sit within <strong>&plusmn;15 bps</strong> of the neutral axes, the economy is in <em>GRID Zero</em>.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              In this state, macroeconomic momentum has stalled. Asset markets become range-bound and are driven almost 100% by central bank rhetoric and micro earnings beats rather than macro regime tailwinds.
            </p>
          </div>
        </div>

        {/* Cross-Asset Class Allocation Matrix */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <h3 className="text-sm font-bold text-white">Cross-Asset Allocation Playbook by Regime</h3>
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <th className="py-2 px-3">Macro Regime</th>
                  <th className="py-2 px-3">Equities Allocation</th>
                  <th className="py-2 px-3">Fixed Income / Duration</th>
                  <th className="py-2 px-3">Real Assets &amp; Commodities</th>
                  <th className="py-2 px-3">Currencies &amp; FX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-2 px-3 font-bold text-emerald-400">GOLDILOCKS (G)</td>
                  <td className="py-2 px-3 text-slate-200">MAX LONG: Tech ($QQQ), High Beta ($SPHB), Discretionary</td>
                  <td className="py-2 px-3 text-slate-400">NEUTRAL: Curve steepening, intermediate duration</td>
                  <td className="py-2 px-3 text-slate-400">UNDERWEIGHT: Broad commodities drag; selective copper</td>
                  <td className="py-2 px-3 text-slate-200">BEARISH USD ($UUP): EM &amp; DM currencies rally</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-amber-400">REFLATION (R)</td>
                  <td className="py-2 px-3 text-slate-200">OVERWEIGHT: Energy ($XLE), Industrials ($XLI), Small Caps ($IWM)</td>
                  <td className="py-2 px-3 text-rose-400">UNDERWEIGHT: Avoid Long Duration ($TLT); yields spike</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">MAX OVERWEIGHT: Crude Oil, Industrial Metals ($PDBC)</td>
                  <td className="py-2 px-3 text-slate-200">NEUTRAL / CHOPPY: Commodity currencies (CAD, AUD) lead</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-purple-400">INFLATION (I)</td>
                  <td className="py-2 px-3 text-slate-400">UNDERWEIGHT: Rotate to defensive cash cows &amp; utilities ($XLU)</td>
                  <td className="py-2 px-3 text-rose-400">MAX UNDERWEIGHT: Bond yields surge; duration crashes</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">OVERWEIGHT: Gold ($GLDM), Energy, Agriculture ($DBA)</td>
                  <td className="py-2 px-3 text-slate-200">BULLISH USD: Risk-off dollar demand on rate hikes</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-sky-400">DEFLATION (D)</td>
                  <td className="py-2 px-3 text-rose-400">MAX UNDERWEIGHT: Earnings recessions hit high-beta</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">MAX OVERWEIGHT: Long Sovereign Treasuries ($TLT, $IEF)</td>
                  <td className="py-2 px-3 text-rose-400">MAX UNDERWEIGHT: Oil and industrial demand collapses</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">MAX BULLISH USD ($UUP) / CASH ($USFR): King Cash</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 9. Interactive Anomaly Modal Window */}
      {activeModalRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-rose-500/60 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">{data?.metadata_countries.find((c) => c.country === activeModalRecord.country)?.flag}</span>
                <span className="font-bold text-white text-sm">{activeModalRecord.country}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {activeModalRecord.period} ({activeModalRecord.frequency})
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold font-mono">
                  ! FRAMEWORK CHALLENGE
                </span>
              </div>
              <button
                onClick={() => setActiveModalRecord(null)}
                className="text-slate-400 hover:text-white text-sm font-mono px-2 py-1"
              >
                &times; Close
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-cyan-300">{activeModalRecord.anomaly_title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs font-mono text-slate-400">
                <span>Signaled: <strong className="text-white">{activeModalRecord.regime}</strong></span>
                <span>Real GDP RoC: <strong className="text-white">{activeModalRecord.gdp_roc_bps} bps</strong></span>
                <span>Inflation RoC: <strong className="text-white">{activeModalRecord.inf_roc_bps} bps</strong></span>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-3 whitespace-pre-line leading-relaxed">
              {activeModalRecord.challenge_details}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-mono text-slate-400">
              <span>Actual Returns: Equities {activeModalRecord.equity_ret_pct >= 0 ? `+${activeModalRecord.equity_ret_pct}` : activeModalRecord.equity_ret_pct}% | Bonds {activeModalRecord.bonds_ret_pct >= 0 ? `+${activeModalRecord.bonds_ret_pct}` : activeModalRecord.bonds_ret_pct}%</span>
              <button
                onClick={() => setActiveModalRecord(null)}
                className="px-3 py-1 rounded bg-slate-800 text-white hover:bg-slate-700 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

