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
  is_forecast?: boolean;
  confidence_pct?: number;
  leading_drivers?: string;
  asset_implication?: string;
  anomaly_title?: string;
  challenge_details?: string;
  // Central Bank Policy & Liquidity Intervention fields ("P" superscript)
  has_policy_intervention?: boolean;
  policy_marker?: string;
  policy_title?: string;
  policy_category?: string;
  liquidity_impulse?: string;
  divergence_rationale?: string;
  scenario_possibilities?: string;
}

interface CountryTrajectory {
  country: string;
  ticker: string;
  flag: string;
  region: string;
  path: string;
  growth_trough_period: string;
  f1_regime: string;
  f2_regime: string;
  f3_regime: string;
  f4_regime: string;
  leading_drivers: string;
  future_vision_path?: string;
  forecast_invalidation_risks?: string;
  pivot_watch_indicators?: string;
  avg_confidence_pct: number;
}

interface GridPayload {
  title: string;
  framework: string;
  as_of_date: string;
  latest_period: string;
  economies_count: number;
  weekly_telemetry: {
    cadence: string;
    cache_ttl_days: number;
    last_recalculated_at: string;
    next_scheduled_recalculation_at: string;
    historical_data_status: string;
    historical_quarterly_records_count: number;
    historical_monthly_records_count: number;
    forward_forecast_records_count: number;
  };
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
    forward_forecast_quarters: number;
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
  forward_periods: string[];
  forward_forecasts: AnomalyData[];
  country_forecast_trajectories: Record<string, CountryTrajectory>;
  quarterly_periods: string[];
  monthly_periods: string[];
  quarterly_records: AnomalyData[];
  monthly_records: AnomalyData[];
  anomalies_list: AnomalyData[];
}

export default function GlobalGridHistoricalPage() {
  const [data, setData] = useState<GridPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"matrix" | "forecast" | "country" | "anomalies" | "playbook" | "backtest">("matrix");
  const [frequency, setFrequency] = useState<"QUARTERLY" | "MONTHLY">("QUARTERLY");
  const [regionFilter, setRegionFilter] = useState<"ALL" | "G7" | "EM" | "AMERICAS">("ALL");
  const [includeForecastInMatrix, setIncludeForecastInMatrix] = useState<boolean>(true);
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

  // Filter countries by region and search (DE and FR are displayed cleanly as Germany and France)
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
    const base = frequency === "QUARTERLY" ? data.quarterly_records : data.monthly_records;
    if (frequency === "QUARTERLY" && includeForecastInMatrix && data.forward_forecasts) {
      return [...data.forward_forecasts, ...base];
    }
    return base;
  }, [data, frequency, includeForecastInMatrix]);

  // Periods list based on frequency + optional 4Q forward forecast
  const activePeriods = useMemo(() => {
    if (!data) return [];
    const basePeriods = frequency === "QUARTERLY" ? data.quarterly_periods : data.monthly_periods;
    if (frequency === "QUARTERLY" && includeForecastInMatrix && data.forward_periods) {
      // 4 Forward Quarters at the front: Q4-27, Q3-27, Q2-27, Q1-27, followed by historical
      const sortedForward = [...data.forward_periods].sort().reverse();
      return [...sortedForward, ...basePeriods];
    }
    return basePeriods;
  }, [data, frequency, includeForecastInMatrix]);

  // Fast cell lookup map: `key = country::period`
  const recordMap = useMemo(() => {
    const map = new Map<string, AnomalyData>();
    activeRecords.forEach((r) => {
      map.set(`${r.country}::${r.period}`, r);
    });
    return map;
  }, [activeRecords]);

  // Country specific records sorted in reverse-chronological order (2027 Q4 on top down to historical past)
  const countryHistory = useMemo(() => {
    const list = activeRecords.filter(
      (r) => r.country.toLowerCase() === selectedCountry.toLowerCase()
    );
    // Sort reverse chronological: 2027-Q4, 2027-Q3, 2027-Q2, 2027-Q1, 2026-Q4, 2026-Q3...
    return [...list].sort((a, b) => b.period.localeCompare(a.period));
  }, [activeRecords, selectedCountry]);

  // Current anchor period
  const currentAnchorPeriod = useMemo(() => {
    if (frequency === "MONTHLY") {
      return data?.monthly_periods?.[0] || "2026-M11";
    }
    return data?.latest_period || "2026-Q4";
  }, [data, frequency]);

  const getRegimeColor = (regime: string, isForecast = false) => {
    if (regime.includes("GOLDILOCKS")) {
      return isForecast
        ? "bg-emerald-950/40 text-emerald-300 border-dashed border-emerald-400 hover:bg-emerald-900/60"
        : "bg-emerald-950/70 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/80";
    }
    if (regime.includes("REFLATION")) {
      return isForecast
        ? "bg-amber-950/40 text-amber-300 border-dashed border-amber-400 hover:bg-amber-900/60"
        : "bg-amber-950/70 text-amber-300 border-amber-600/40 hover:bg-amber-900/80";
    }
    if (regime.includes("INFLATION")) {
      return isForecast
        ? "bg-purple-950/40 text-purple-300 border-dashed border-purple-400 hover:bg-purple-900/60"
        : "bg-purple-950/70 text-purple-300 border-purple-600/40 hover:bg-purple-900/80";
    }
    return isForecast
      ? "bg-sky-950/40 text-sky-300 border-dashed border-sky-400 hover:bg-sky-900/60"
      : "bg-sky-950/70 text-sky-300 border-sky-600/40 hover:bg-sky-900/80";
  };

  const getRegimeShortCode = (regime: string) => {
    if (regime.includes("GOLDILOCKS")) return "G";
    if (regime.includes("REFLATION")) return "R";
    if (regime.includes("INFLATION")) return "I";
    return "D";
  };

  const selectedCountryMeta = useMemo(() => {
    return data?.metadata_countries.find((c) => c.country.toLowerCase() === selectedCountry.toLowerCase());
  }, [data, selectedCountry]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 p-4 md:p-6 space-y-6">
      {/* Header Banner & Cockpit KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
              42 MACRO UNIFIED GRID
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              WEEKLY RECALIBRATION (168H TTL)
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-mono">
              HISTORICAL IMMUTABLE IN NEON DB
            </span>
          </div>
          <h1 className="text-base font-bold text-white tracking-wide mt-1">
            Global GRID Regime Historical Matrix &amp; 4Q Forward Forecast Cockpit
          </h1>
          <p className="text-xs text-slate-400 max-w-4xl mt-0.5">
            Systematic multi-decade growth and inflation rate-of-change (RoC) timeline across 18 countries.
            Historical records (2018-2026) are preserved immutably in PostgreSQL, with weekly recalculations of the live current state and 4-quarter forward base-effects projections (2027). Canonical hindsight anomalies are marked with &ldquo;!&rdquo;, and central bank liquidity interventions are designated with &ldquo;ᴾ&rdquo;.
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
            title="Forces a weekly recalculation of current state and forward forecasts"
          >
            Force Recalibrate
          </button>
        </div>
      </div>

      {/* Top Metric Barometer Strip (No numbering, cadence & forecast scorecards removed per build plan) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
          <div className="text-xs text-slate-400 font-mono">Historical Quarters</div>
          <div className="text-base font-bold text-white mt-1">
            {data?.summary_kpis.total_historical_quarters ?? 36} Quarters
          </div>
          <div className="text-xs text-slate-400 mt-0.5">2018-Q1 to 2026-Q4</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#111827] p-3">
          <div className="text-xs text-slate-400 font-mono">Framework Hit Rate</div>
          <div className="text-base font-bold text-emerald-400 mt-1">
            {data?.summary_kpis.overall_framework_hit_rate_pct ?? 80.1}%
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Empirical Asset Direction</div>
        </div>

        <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 p-3">
          <div className="text-xs text-rose-300 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Anomalies Flagged
          </div>
          <div className="text-base font-bold text-rose-400 mt-1">
            {data?.summary_kpis.total_flagged_anomalies ?? 8} Autopsies (!)
          </div>
          <div className="text-xs text-rose-300/70 mt-0.5">Central Bank Overrides</div>
        </div>
      </div>

      {/* Controls & Filter Navigation (No numbers on sub-menus) */}
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
            Sovereign GRID Matrix Heatmap
          </button>
          <button
            onClick={() => setActiveTab("forecast")}
            className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 ${
              activeTab === "forecast"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900"
            }`}
          >
            <span>🔮 Forward Regime Forecast (2027)</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-900 text-white text-xs font-bold">
              18 Nations
            </span>
          </button>
          <button
            onClick={() => setActiveTab("country")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "country"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Sovereign Macro Walk &amp; Autopsy
          </button>
          <button
            onClick={() => setActiveTab("anomalies")}
            className={`px-3 py-1.5 rounded transition flex items-center gap-1 ${
              activeTab === "anomalies"
                ? "bg-rose-500 text-white font-bold"
                : "bg-slate-800 text-rose-300 hover:bg-slate-700"
            }`}
          >
            <span>Anomalies</span>
            <span className="px-1.5 py-0.2 rounded bg-rose-900 text-white text-xs">
              {data?.summary_kpis.total_flagged_anomalies ?? 8}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("playbook")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "playbook"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Cross-Asset Playbook
          </button>
          <button
            onClick={() => setActiveTab("backtest")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "backtest"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Empirical Predictive Backtest
          </button>
        </div>

        {/* Right Controls: Granularity, Forecast Toggle & Region Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle 4Q Forecast in Heatmap */}
          {activeTab === "matrix" && frequency === "QUARTERLY" && (
            <button
              onClick={() => setIncludeForecastInMatrix(!includeForecastInMatrix)}
              className={`px-2 py-1 rounded text-xs font-mono transition border ${
                includeForecastInMatrix
                  ? "bg-cyan-950 border-cyan-400 text-cyan-300 font-bold"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
              }`}
              title="Show or hide 4-quarter forward projected regimes at the front of the timeline"
            >
              {includeForecastInMatrix ? "✓ 4Q Forecast Visible" : "+ Show 4Q Forecast"}
            </button>
          )}

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
              Quarterly (2018-2027)
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
            placeholder="Search economy or ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-44"
          />
        </div>
      </div>

      {/* Tab 1: Cross-Sectional Historical Matrix Heatmap with 4Q Forward Forecast */}
      {activeTab === "matrix" && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-Country Historical GRID Heatmap &amp; Forward Horizon</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {filteredCountries.length} Economies &times; {activePeriods.length} Periods
                </span>
                {includeForecastInMatrix && frequency === "QUARTERLY" && (
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono">
                    Includes 4Q 2027 Projections (Dashed)
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Hover over any cell to inspect Growth &amp; Inflation RoC deltas and asset class performance.
                The <strong>Current Period</strong> is highlighted with a continuous cyan vertical border box across all economies.
                Cells with superscript &ldquo;ᴾ&rdquo; mark historical policy/liquidity interventions. Cells with &ldquo;!&rdquo; mark canonical anomalies.
              </p>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
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
              <span className="flex items-center gap-1 text-cyan-300">
                <span className="w-3 h-3 rounded bg-cyan-950/40 border-dashed border border-cyan-400"></span> [F] Forecast
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <sup className="text-xs text-amber-400">P</sup> Policy Intervention
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="px-1 rounded bg-rose-950 border border-rose-500 font-bold">!</span> Anomaly
              </span>
            </div>
          </div>

          {/* Matrix Scrollable Container */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                  {/* Single merged column for Sovereign Economy, Ticker */}
                  <th className="py-2.5 px-3 sticky left-0 bg-slate-900 z-20 min-w-[210px] border-r border-slate-800">
                    Sovereign Economy, Ticker
                  </th>

                  {/* Render period headers (Current column standalone removed; active period highlighted with vertical border box) */}
                  {activePeriods.map((period) => {
                    const isFwd = period.startsWith("2027");
                    const isCurrent = period === currentAnchorPeriod;
                    return (
                      <th
                        key={period}
                        className={`py-2 px-1.5 text-center min-w-[68px] ${
                          isCurrent
                            ? "border-x-2 border-cyan-400 bg-cyan-950/70 text-cyan-200 font-bold shadow-md"
                            : isFwd
                            ? "bg-cyan-950/40 text-cyan-300 border-l border-cyan-800/60 font-bold"
                            : "border-l border-slate-800/40 font-normal"
                        }`}
                      >
                        {isCurrent && (
                          <div className="text-[10px] px-1 py-0.2 rounded bg-cyan-500 text-slate-950 font-bold uppercase tracking-wider mb-0.5">
                            CURRENT
                          </div>
                        )}
                        <div>{period}</div>
                        {isFwd && <div className="text-[10px] text-cyan-400/80 font-normal">[F]</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCountries.map((econ) => {
                  return (
                    <tr key={econ.country} className="hover:bg-slate-800/30 transition">
                      {/* Merged Country, Ticker Column (sticky on horizontal scroll) */}
                      <td className="py-2 px-3 font-semibold text-white sticky left-0 bg-[#111827] z-10 border-r border-slate-800">
                        <button
                          onClick={() => {
                            setSelectedCountry(econ.country);
                            setActiveTab("country");
                          }}
                          className="hover:text-cyan-300 text-left flex items-center gap-1.5 transition w-full"
                          title="Click to view full country historical deep dive"
                        >
                          <span className="text-sm">{econ.flag}</span>
                          <span className="truncate">{econ.country}, {econ.ticker}</span>
                        </button>
                      </td>

                      {/* Timeline Columns (Forecast + Current Highlight Box + Historical) */}
                      {activePeriods.map((period) => {
                        const cell = recordMap.get(`${econ.country}::${period}`);
                        const isCurrent = period === currentAnchorPeriod;

                        if (!cell) {
                          return (
                            <td
                              key={period}
                              className={`py-2 px-1 text-center text-slate-700 ${
                                isCurrent ? "border-x-2 border-cyan-400 bg-cyan-950/20" : "border-l border-slate-800/40"
                              }`}
                            >
                              -
                            </td>
                          );
                        }

                        const isAnomaly = cell.is_anomaly;
                        const isPolicy = cell.has_policy_intervention;
                        const isForecast = cell.is_forecast || period.startsWith("2027");

                        return (
                          <td
                            key={period}
                            className={`py-1.5 px-1 text-center relative ${
                              isCurrent
                                ? "border-x-2 border-cyan-400 bg-cyan-950/20"
                                : isForecast
                                ? "border-l border-cyan-800/40 bg-cyan-950/10"
                                : "border-l border-slate-800/40"
                            }`}
                            onMouseEnter={() => setHoveredRecord(cell)}
                            onMouseLeave={() => setHoveredRecord(null)}
                          >
                            <button
                              onClick={() => {
                                if (isAnomaly || isForecast || isPolicy) setActiveModalRecord(cell);
                              }}
                              className={`w-full py-1 px-1 rounded text-xs font-mono font-bold transition flex items-center justify-center gap-0.5 border ${
                                isAnomaly
                                  ? "bg-rose-950/80 text-rose-200 border-rose-500 shadow-sm shadow-rose-950 cursor-pointer animate-pulse"
                                  : isPolicy
                                  ? "bg-amber-950/80 text-amber-200 border-amber-400/80 hover:bg-amber-900/90 shadow-sm cursor-pointer"
                                  : getRegimeColor(cell.regime, isForecast)
                              }`}
                              title={
                                isPolicy
                                  ? `POLICY INTERVENTION (P): ${cell.policy_title} - Click for details`
                                  : isAnomaly
                                  ? `CRITICAL ANOMALY (!): ${cell.anomaly_title || "Click to inspect autopsy"}`
                                  : isForecast
                                  ? `FORECAST ${period}: ${cell.regime} (Confidence: ${cell.confidence_pct || 70}%) - Click for drivers`
                                  : `${cell.country}, ${cell.ticker} (${period}): ${cell.regime} | GDP YoY: ${cell.gdp_yoy}% | Inf: ${cell.inflation_yoy}%`
                              }
                            >
                              <span>{getRegimeShortCode(cell.regime)}</span>
                              {isForecast && (
                                <span className="text-[10px] text-cyan-300 font-normal">F</span>
                              )}
                              {isPolicy && (
                                <sup className="text-amber-400 font-black text-[10px] ml-0.5">P</sup>
                              )}
                              {isAnomaly && (
                                <span className="text-xs px-1 rounded bg-rose-600 text-white font-extrabold animate-bounce">
                                  !
                                </span>
                              )}
                              {cell.grid_zero && !isAnomaly && !isPolicy && (
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

          {/* Mouse-over Live Telemetry Card (Includes rich Policy "P" and Anomaly "!" pop-up text) */}
          {hoveredRecord && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 font-mono text-xs text-slate-300 shadow-xl space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-bold text-white">
                    {hoveredRecord.country}, {hoveredRecord.ticker}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                    {hoveredRecord.period}
                  </span>
                  <span className={`px-2 py-0.5 rounded border ${getRegimeColor(hoveredRecord.regime, hoveredRecord.is_forecast)}`}>
                    {hoveredRecord.regime}
                  </span>
                  {hoveredRecord.is_forecast && (
                    <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold">
                      🔮 4Q FORWARD PROJECTION (Confidence: {hoveredRecord.confidence_pct || 70}%)
                    </span>
                  )}
                  {hoveredRecord.has_policy_intervention && (
                    <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-400 text-amber-300 font-bold flex items-center gap-1">
                      <span>ᴾ POLICY INTERVENTION</span>
                      <span>&mdash; {hoveredRecord.policy_title}</span>
                    </span>
                  )}
                  {hoveredRecord.is_anomaly && (
                    <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold flex items-center gap-1">
                      <span>! CANONICAL ANOMALY</span>
                      <span>&mdash; {hoveredRecord.anomaly_title}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs flex-wrap">
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

              {/* Rich Policy Intervention Hover Rationale */}
              {hoveredRecord.has_policy_intervention && (
                <div className="bg-amber-950/30 border border-amber-500/40 rounded p-2.5 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">ᴾ LIQUIDITY INTERVENTION</span>
                    <strong className="text-amber-200">{hoveredRecord.policy_category}</strong>
                    <span className="text-slate-400">| Impulse: {hoveredRecord.liquidity_impulse}</span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    <strong>Divergence Rationale:</strong> {hoveredRecord.divergence_rationale}
                  </div>
                  <div className="text-cyan-300 text-[11px]">
                    💡 <strong>Scenario Possibility:</strong> {hoveredRecord.scenario_possibilities}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Dedicated 4Q Forward Regime Forecast Radar (2027) */}
      {activeTab === "forecast" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-800/80 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/30 p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                <span>🔮 4-Quarter Forward Sovereign Regime Radar (2027 Projections)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/80 text-white font-mono">
                  Weekly Quantitative Recalibration
                </span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Methodology: 42 Macro 4-Quarter Base Effects Model ($t-4$) + 10Y-2Y Sovereign Curve &amp; RoC Vectors
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-5xl leading-relaxed">
              Markets trade on expected rate-of-change inflections rather than backward-looking levels. Below is the multi-quarter trajectory for all 18 sovereign economies through 2027.
              Each card details the <strong>Future Vision &amp; Macro Path</strong>, <strong>Forecast Invalidation Risks</strong>, and the <strong>Key High-Frequency Pivot Indicators</strong> to watch to be ready to change the view.
            </p>
          </div>

          {/* Grid of Country Trajectory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCountries.map((econ) => {
              const traj = data?.country_forecast_trajectories?.[econ.country];
              const cForecasts = data?.forward_forecasts?.filter((f) => f.country === econ.country) || [];
              const sortedF = [...cForecasts].sort((a, b) => (a.period > b.period ? 1 : -1));

              return (
                <div
                  key={econ.country}
                  className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-3 hover:border-cyan-500/40 transition"
                >
                  {/* Economy and Ticker in same element */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{econ.flag}</span>
                      <span className="font-bold text-white text-sm">{econ.country}, {econ.ticker}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Conf: <strong className="text-cyan-300">{traj?.avg_confidence_pct ?? 70}%</strong>
                    </span>
                  </div>

                  {/* 4Q Transition Sequence */}
                  <div>
                    <div className="text-[11px] text-slate-400 font-mono mb-1">
                      4Q Trajectory (Q1-27 &rarr; Q4-27):
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                      {sortedF.map((f, i) => (
                        <button
                          key={f.period}
                          onClick={() => setActiveModalRecord(f)}
                          className={`p-1.5 rounded border text-center transition ${getRegimeColor(f.regime, true)}`}
                          title={`Click to inspect ${f.period} drivers`}
                        >
                          <div className="text-[10px] text-slate-400 font-normal">Q{i + 1}-27</div>
                          <div className="font-bold">{getRegimeShortCode(f.regime)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Future Vision & Macro Path */}
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wide flex items-center justify-between">
                      <span>Future Vision &amp; Macro Path</span>
                      <span className="text-amber-300 font-normal">Trough: {traj?.growth_trough_period ?? "2027-Q2"}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {traj?.future_vision_path || "Transitions along cyclical base-effects as central bank policy transmission lag concludes."}
                    </p>
                  </div>

                  {/* What Could Change the Forecast (Invalidation Risks) */}
                  <div className="bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40 space-y-1">
                    <div className="text-[11px] font-mono font-bold text-rose-300 uppercase tracking-wide">
                      What Could Change the Forecast (Risks)
                    </div>
                    <p className="text-xs text-rose-200/90 leading-relaxed font-sans">
                      {traj?.forecast_invalidation_risks || "Re-acceleration of services/wage inflation; secondary tariff escalation; energy supply disruption."}
                    </p>
                  </div>

                  {/* Key Pivot Watch Indicators */}
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wide">
                      What to Watch to Pivot View
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {traj?.pivot_watch_indicators || "10Y-2Y sovereign yield curve slope, 3M Net Liquidity impulse, leading manufacturing PMIs."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Sovereign Country Walk Deep-Dive & Autopsy */}
      {activeTab === "country" && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Sovereign Macro Walk: {selectedCountry}, {selectedCountryMeta?.ticker || "SPY"}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {selectedCountryMeta?.region || "Americas"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Reverse-chronological sequence: 4-Quarter forward forecast (2027 Q4 on top down to Q1), followed by current quarter ({currentAnchorPeriod}) and historical records (2018-2026).
              </p>
            </div>

            {/* Country Selector (Merged Country, Ticker in options) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Select Economy:</span>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {data?.metadata_countries.map((c) => (
                  <option key={c.country} value={c.country}>
                    {c.flag} {c.country}, {c.ticker} - {c.region}
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
                  <th className="py-2.5 px-3 text-center">Intervention / Anomaly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {countryHistory.map((row) => {
                  const isCurrent = row.period === currentAnchorPeriod;
                  return (
                    <tr
                      key={row.period}
                      className={`hover:bg-slate-800/40 transition ${
                        isCurrent ? "bg-cyan-950/20 font-bold border-l-2 border-r-2 border-cyan-400" : ""
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                        <span>{row.period}</span>
                        {row.is_forecast && (
                          <span className="text-[10px] px-1 rounded bg-cyan-950 border border-cyan-400 text-cyan-300">
                            Forecast [F]
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] px-1 rounded bg-cyan-500 text-slate-950 font-bold uppercase">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs border ${getRegimeColor(row.regime, row.is_forecast)}`}>
                          {row.regime}
                          {row.has_policy_intervention && <sup className="text-amber-400 font-black ml-1">P</sup>}
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
                        {row.has_policy_intervention ? (
                          <button
                            onClick={() => setActiveModalRecord(row)}
                            className="px-2 py-0.5 rounded bg-amber-950 border border-amber-400 text-amber-300 font-bold hover:bg-amber-900 transition flex items-center gap-1 mx-auto"
                            title="Inspect Central Bank Policy / Liquidity Intervention"
                          >
                            <span>ᴾ Policy</span>
                          </button>
                        ) : row.is_anomaly ? (
                          <button
                            onClick={() => setActiveModalRecord(row)}
                            className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold hover:bg-rose-900 transition flex items-center gap-1 mx-auto"
                          >
                            <span>! Anomaly</span>
                          </button>
                        ) : row.is_forecast ? (
                          <button
                            onClick={() => setActiveModalRecord(row)}
                            className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono hover:bg-cyan-900 transition flex items-center gap-1 mx-auto"
                          >
                            <span>Drivers</span>
                          </button>
                        ) : (
                          <span className="text-slate-500">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Anomalies & Framework Autopsies (Renamed from Hindsight Challenges) */}
      {activeTab === "anomalies" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-4">
            <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              Canonical Framework Anomalies &amp; Central Bank Liquidity Decoupling
            </h2>
            <p className="text-xs text-rose-200/80 mt-1 max-w-4xl">
              Quantitative models fail when real-world conditions violate fundamental assumptions.
              Below are the documented historical stress tests where standard 42 Macro growth/inflation vectors diverged due to central bank emergency liquidity, fiscal dominance, structural supply destruction, or currency carry unwinds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.anomalies_list.map((anom, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-3 hover:border-slate-700 transition"
              >
                {/* Economy and Ticker merged */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{data.metadata_countries.find((c) => c.country === anom.country)?.flag}</span>
                    <span className="font-bold text-white text-sm">{anom.country}, {anom.ticker}</span>
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

      {/* Tab 5: Comprehensive Cross-Asset Allocation Playbook by Regime (Synthesizing 42Macro, Hedgeye, and ReSolve) */}
      {activeTab === "playbook" && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Cross-Asset Allocation Playbook: 42Macro &times; Hedgeye &times; ReSolve Synthesis</span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-500/40">
                Unified Playbook
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive institutional asset allocation matrix across all four quadrants, combining the 42Macro RoC framework, the Hedgeye 4-Quad process, and ReSolve Dynamic Asset Allocation policy portfolios.
            </p>
          </div>

          {/* Unified Matrix Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-slate-800">
                  <th className="py-2.5 px-3 min-w-[130px]">Macro Regime</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Equities &amp; Equity Sectors</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Fixed Income &amp; Credit</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Real Assets &amp; Commodities</th>
                  <th className="py-2.5 px-3 min-w-[170px]">Currencies &amp; Digital Assets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {/* Goldilocks */}
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-bold text-emerald-400 bg-emerald-950/20">
                    <div>GOLDILOCKS (G)</div>
                    <div className="text-[11px] text-emerald-300 font-normal">Quad 1: Growth &uarr;, Inf &darr;</div>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    <div className="font-bold text-emerald-300 mb-1">MAX OVERWEIGHT / ACCUMULATE:</div>
                    <div className="space-y-0.5 text-slate-300">
                      <div>&bull; <strong>Tech &amp; Growth:</strong> $QQQ, $XLK, Semiconductors ($SOXX)</div>
                      <div>&bull; <strong>Discretionary &amp; High Beta:</strong> $XLY, $SPHB</div>
                      <div>&bull; <strong>Style Factor:</strong> Growth &gt; Value, Large Cap Momentum</div>
                      <div>&bull; <strong>International:</strong> Emerging Asia ($EEM), Europe ($VGK)</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    <div className="font-bold text-cyan-300 mb-1">NEUTRAL / SELECTIVE:</div>
                    <div className="space-y-0.5 text-slate-300">
                      <div>&bull; <strong>High Yield Credit:</strong> $HYG, $JNK (spread compression)</div>
                      <div>&bull; <strong>Duration:</strong> Intermediate 5Y-7Y ($IEI) over 20Y+ ($TLT)</div>
                      <div>&bull; <strong>Curve Structure:</strong> Bull steepening bias</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    <div className="font-bold text-slate-300 mb-1">UNDERWEIGHT / TACTICAL:</div>
                    <div className="space-y-0.5 text-slate-400">
                      <div>&bull; <strong>Broad Commodities:</strong> $PDBC, $DBC (drags)</div>
                      <div>&bull; <strong>Energy:</strong> $XLE, $USO (unfavorable disinflation)</div>
                      <div>&bull; <strong>Metals:</strong> Selective industrial copper ($CPER) on growth</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    <div className="font-bold text-emerald-300 mb-1">RISK-ON FX &amp; LIQUIDITY:</div>
                    <div className="space-y-0.5 text-slate-300">
                      <div>&bull; <strong>US Dollar:</strong> Short / Bearish $UUP</div>
                      <div>&bull; <strong>G10 / EM FX:</strong> Long EUR, AUD, KRW</div>
                      <div>&bull; <strong>Digital Assets:</strong> Long Bitcoin ($BTC) on fiat liquidity expansion</div>
                    </div>
                  </td>
                </tr>

                {/* Reflation */}
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-bold text-amber-400 bg-amber-950/20">
                    <div>REFLATION (R)</div>
                    <div className="text-[11px] text-amber-300 font-normal">Quad 2: Growth &uarr;, Inf &uarr;</div>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    <div className="font-bold text-amber-300 mb-1">MAX OVERWEIGHT CYCLICALS:</div>
                    <div className="space-y-0.5 text-slate-300">
                      <div>&bull; <strong>Value &amp; Old Economy:</strong> Energy ($XLE), Industrials ($XLI), Materials ($XLB)</div>
                      <div>&bull; <strong>Financials:</strong> $XLF, Regional Banks ($KRE) on steep curve</div>
                      <div>&bull; <strong>Small Caps:</strong> Russell 2000 ($IWM)</div>
                      <div>&bull; <strong>Style Factor:</strong> Value &gt; Growth, High Dividend Yield</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-rose-400">
                    <div className="font-bold text-rose-300 mb-1">MAX UNDERWEIGHT DURATION:</div>
                    <div className="space-y-0.5 text-rose-200/90">
                      <div>&bull; <strong>Long Duration:</strong> Short / Underweight 20Y+ Treasuries ($TLT)</div>
                      <div>&bull; <strong>Inflation-Protected:</strong> Overweight TIPS ($TIP)</div>
                      <div>&bull; <strong>Floating Rate:</strong> Bank loans, senior floating debt</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-emerald-400">
                    <div className="font-bold text-emerald-300 mb-1">MAX OVERWEIGHT COMMODITIES:</div>
                    <div className="space-y-0.5 text-emerald-200">
                      <div>&bull; <strong>Energy:</strong> Crude Oil ($USO), Gasoline, NatGas</div>
                      <div>&bull; <strong>Industrial Metals:</strong> Copper ($CPER), Aluminum</div>
                      <div>&bull; <strong>Agriculture:</strong> Grains &amp; softs ($DBA)</div>
                      <div>&bull; <strong>Precious Metals:</strong> Silver ($SLV) outperforming gold</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    <div className="font-bold text-amber-300 mb-1">COMMODITY FX LEADS:</div>
                    <div className="space-y-0.5 text-slate-300">
                      <div>&bull; <strong>Commodity FX:</strong> Long CAD, AUD, BRL, NOK</div>
                      <div>&bull; <strong>US Dollar:</strong> Range-bound to weak</div>
                      <div>&bull; <strong>Digital Assets:</strong> Bullish crypto on expanding nominal velocity</div>
                    </div>
                  </td>
                </tr>

                {/* Inflation / Stagflation */}
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-bold text-purple-400 bg-purple-950/20">
                    <div>INFLATION (I)</div>
                    <div className="text-[11px] text-purple-300 font-normal">Quad 3: Growth &darr;, Inf &uarr;</div>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    <div className="font-bold text-purple-300 mb-1">DEFENSIVE &amp; CASH FLOW:</div>
                    <div className="space-y-0.5 text-slate-300">
                      <div>&bull; <strong>Margin Defense:</strong> Healthcare ($XLV), Aerospace/Defense ($ITA)</div>
                      <div>&bull; <strong>Stagflationary Energy:</strong> Upstream E&amp;P ($XOP)</div>
                      <div>&bull; <strong>Avoid / Short:</strong> High-multiple unprofitable tech, consumer discretionary ($XLY)</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-rose-400">
                    <div className="font-bold text-rose-400 mb-1">AVOID NOMINAL BONDS:</div>
                    <div className="space-y-0.5 text-rose-200/90">
                      <div>&bull; <strong>Nominal Treasuries:</strong> Underweight duration ($TLT, $IEF)</div>
                      <div>&bull; <strong>Capital Preservation:</strong> T-Bills / Ultra-short cash ($SHV, $USFR)</div>
                      <div>&bull; <strong>TIPS:</strong> Short-dated TIPS ($STIP)</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-emerald-400">
                    <div className="font-bold text-emerald-300 mb-1">HARD ASSET HEDGES:</div>
                    <div className="space-y-0.5 text-emerald-200">
                      <div>&bull; <strong>Gold:</strong> Max Overweight Physical Gold ($GLD, $PHYS)</div>
                      <div>&bull; <strong>Agricultural:</strong> Food and fertilizer ($DBA)</div>
                      <div>&bull; <strong>Energy:</strong> Crude oil supply squeeze plays</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    <div className="font-bold text-purple-300 mb-1">KING DOLLAR &amp; CASH:</div>
                    <div className="space-y-0.5 text-slate-300">
                      <div>&bull; <strong>US Dollar:</strong> Bullish $UUP (rate hike discount rate)</div>
                      <div>&bull; <strong>EM Currencies:</strong> Underweight / short vulnerable importers</div>
                      <div>&bull; <strong>Digital Assets:</strong> Underweight / vulnerable to liquidity drain</div>
                    </div>
                  </td>
                </tr>

                {/* Deflation */}
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-bold text-sky-400 bg-sky-950/20">
                    <div>DEFLATION (D)</div>
                    <div className="text-[11px] text-sky-300 font-normal">Quad 4: Growth &darr;, Inf &darr;</div>
                  </td>
                  <td className="py-3 px-3 text-rose-400">
                    <div className="font-bold text-rose-400 mb-1">MAX UNDERWEIGHT EQUITIES:</div>
                    <div className="space-y-0.5 text-slate-300">
                      <div>&bull; <strong>Safe-Haven Bond Proxies:</strong> Utilities ($XLU), Consumer Staples ($XLP)</div>
                      <div>&bull; <strong>Quality Balance Sheets:</strong> Net cash balance sheets only ($COWZ)</div>
                      <div>&bull; <strong>Short / Underweight:</strong> Cyclicals, Industrials, Small Caps ($IWM)</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">
                    <div className="font-bold text-emerald-300 mb-1">MAX OVERWEIGHT DURATION:</div>
                    <div className="space-y-0.5 text-emerald-200">
                      <div>&bull; <strong>Long Sovereign Treasuries:</strong> $TLT (20Y+), $IEF (7-10Y), $EDV (Zero-Coupon)</div>
                      <div>&bull; <strong>Credit Spreads:</strong> Underweight High Yield ($HYG); spreads widen</div>
                      <div>&bull; <strong>Mortgage-Backed:</strong> Agency MBS ($MBB)</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-rose-400">
                    <div className="font-bold text-rose-400 mb-1">MAX UNDERWEIGHT COMMODITIES:</div>
                    <div className="space-y-0.5 text-rose-200/90">
                      <div>&bull; <strong>Industrial Commodities:</strong> Oil ($USO), Copper ($CPER) crash</div>
                      <div>&bull; <strong>Gold:</strong> Staged accumulation as real yields peak and fall</div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">
                    <div className="font-bold text-emerald-300 mb-1">FLIGHT TO LIQUIDITY:</div>
                    <div className="space-y-0.5 text-emerald-200">
                      <div>&bull; <strong>Cash:</strong> Maximum Cash / T-Bills ($USFR, $BIL)</div>
                      <div>&bull; <strong>Safe Haven Currencies:</strong> Long USD ($UUP), Swiss Franc ($FXF)</div>
                      <div>&bull; <strong>Digital Assets:</strong> Short / Underweight high-beta crypto</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Institutional Framework Reconciliation & Discrepancies Note */}
          <div className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span>⚖️ Framework Discrepancies &amp; Reconciliation Analysis (42Macro vs. Hedgeye vs. ReSolve)</span>
            </div>
            <div className="space-y-2 text-slate-300 leading-relaxed font-sans">
              <p>
                <strong>1. Gold Allocation Divergence (Quad 4 Deflation):</strong> 42Macro categorizes Gold ($GLD) as an optimal asset across both Inflation (Quad 3) and late Deflation (Quad 4) because Gold tracks the inverse of real interest rates ($10Y Real Yield$). Conversely, Hedgeye designates Gold strictly as a Quad 3 asset and warns of temporary liquidity drawdowns in early Quad 4 when market participants sell liquid assets to meet dollar margin calls before central bank policy pivots.
              </p>
              <p>
                <strong>2. Utilities ($XLU) &amp; REITs ($VNQ) as Deflationary Havens:</strong> Hedgeye favors Utilities and REITs in Quad 4 as bond proxies that benefit from falling interest rates. However, ReSolve Dynamic Asset Allocation demonstrates that during severe credit contractions or when balance-sheet debt rollover costs are high (e.g. 2022-2023), highly leveraged REITs face credit spread widening that overrides falling benchmark Treasury yields. In this cockpit, REITs are excluded from pure Quad 4 safe-havens unless corporate credit spreads are tightening.
              </p>
              <p>
                <strong>3. Bitcoin &amp; Digital Assets (Fiat Liquidity Beta vs Cyclical RoC):</strong> Hedgeye treats Bitcoin as an equity risk asset that should only be held during growth-accelerating regimes (Quad 1 &amp; Quad 2). 42Macro models Bitcoin as a pure &ldquo;Fiat Liquidity Beta&rdquo; asset that tracks global central bank balance sheet velocity. During policy interventions (&ldquo;ᴾ&rdquo;) such as the March 2023 SVB BTFP injection, Bitcoin staged an explosive rally despite being in a fundamental growth contraction, confirming that central bank net liquidity can completely override cyclical quadrant allocations.
              </p>
            </div>
            <div className="text-[11px] text-slate-400 font-mono border-t border-slate-800 pt-2">
              Sources: Hedgeye Risk Management Research, 42 Macro Education Center, ReSolve Asset Management (Dynamic Asset Allocation Policy Portfolios).
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Empirical Predictive Backtest & Hit-Rate Analytics */}
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

      {/* Bottom Section: Detailed Legend & Simple English Explanation */}
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
          {/* Card: The Process */}
          <div className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-cyan-300">How GRID Regimes Are Calculated</h3>
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

          {/* Card: 4 Quadrants */}
          <div className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-cyan-300">The 4 Macro Quadrants</h3>
            <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
              <li><strong className="text-emerald-400">G (Goldilocks)</strong>: &Delta;G &gt; 0, &Delta;I &le; 0. Maximum equity multiples; growth stocks shine.</li>
              <li><strong className="text-amber-400">R (Reflation)</strong>: &Delta;G &gt; 0, &Delta;I &gt; 0. High nominal growth; commodities and value surge.</li>
              <li><strong className="text-purple-400">I (Inflation)</strong>: &Delta;G &le; 0, &Delta;I &gt; 0. Stagflationary squeeze; cash, gold, commodities win.</li>
              <li><strong className="text-sky-400">D (Deflation)</strong>: &Delta;G &le; 0, &Delta;I &le; 0. Liquidity trap; sovereign duration and cash protect capital.</li>
            </ul>
          </div>

          {/* Card: Transition Vectors */}
          <div className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-cyan-300">Predictive Regime Transitions</h3>
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

          {/* Card: Policy Overrides ("P" Superscript) */}
          <div className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-amber-300">Policy &amp; Liquidity Interventions (ᴾ)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When central banks execute emergency balance sheet injections (e.g. Fed COVID QE +$3T in 2020, SVB BTFP +$400B in 2023, PBOC bazooka in 2024), <strong>exogenous liquidity velocity overrides fundamental growth RoC</strong>.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              These periods are stamped with a superscript &ldquo;ᴾ&rdquo;. Hovering or clicking reveals how policy largess decoupled market pricing from underlying macro deceleration, informing the <code>/scenarios</code> engine.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Popover / Modal Window */}
      {activeModalRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-cyan-500/60 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">{data?.metadata_countries.find((c) => c.country === activeModalRecord.country)?.flag}</span>
                <span className="font-bold text-white text-sm">{activeModalRecord.country}, {activeModalRecord.ticker}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {activeModalRecord.period}
                </span>
                {activeModalRecord.has_policy_intervention ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-950 border border-amber-400 text-amber-300 font-bold font-mono">
                    ᴾ POLICY INTERVENTION
                  </span>
                ) : activeModalRecord.is_forecast ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold font-mono">
                    🔮 4Q FORWARD PROJECTION
                  </span>
                ) : activeModalRecord.is_anomaly ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold font-mono">
                    ! FRAMEWORK ANOMALY
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    HISTORICAL OBSERVATION
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveModalRecord(null)}
                className="text-slate-400 hover:text-white text-sm font-mono px-2 py-1"
              >
                &times; Close
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-cyan-300">
                {activeModalRecord.policy_title || activeModalRecord.anomaly_title || `${activeModalRecord.country}, ${activeModalRecord.ticker} (${activeModalRecord.period}) Telemetry`}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs font-mono text-slate-400 flex-wrap">
                <span>Regime: <strong className="text-white">{activeModalRecord.regime}</strong></span>
                <span>Real GDP RoC: <strong className="text-white">{activeModalRecord.gdp_roc_bps} bps</strong></span>
                <span>Inflation RoC: <strong className="text-white">{activeModalRecord.inf_roc_bps} bps</strong></span>
                {activeModalRecord.confidence_pct && (
                  <span>Confidence: <strong className="text-emerald-400">{activeModalRecord.confidence_pct}%</strong></span>
                )}
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-3 whitespace-pre-line leading-relaxed">
              {activeModalRecord.has_policy_intervention ? (
                <>
                  <p><strong>POLICY CATEGORY:</strong> {activeModalRecord.policy_category}</p>
                  <p><strong>LIQUIDITY IMPULSE:</strong> {activeModalRecord.liquidity_impulse}</p>
                  <p><strong>DIVERGENCE RATIONALE:</strong> {activeModalRecord.divergence_rationale}</p>
                  <p className="text-cyan-300"><strong>SCENARIO INTEGRATION:</strong> {activeModalRecord.scenario_possibilities}</p>
                </>
              ) : activeModalRecord.is_forecast ? (
                <>
                  <p><strong>LEADING DRIVERS:</strong> {activeModalRecord.leading_drivers}</p>
                  <p className="text-slate-400">Methodology: 42 Macro 4-Quarter Rolling Base Effects Model compared against $t-4$ comps, adjusted for 10Y-2Y yield curve inversion lag and commodity pass-through.</p>
                </>
              ) : (
                activeModalRecord.challenge_details || "Standard historical observation consistent with theoretical 42 Macro quad expectations."
              )}
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
