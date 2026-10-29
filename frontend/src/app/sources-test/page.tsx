"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL, getApiUrl } from "@/lib/api";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const QUICK_TICKERS = ["ENPH", "NVDA", "CAT", "TSLA", "XOM"];

export default function SourcesTestPage() {
  const [tickerInput, setTickerInput] = useState<string>("ENPH");
  const [activeTicker, setActiveTicker] = useState<string>("ENPH");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [chartViewMode, setChartViewMode] = useState<"BOTH" | "CHARTS_ONLY" | "TABLE_ONLY">("BOTH");

  const fetchSources = async (sym: string) => {
    const cleanSym = sym.trim().toUpperCase();
    setLoading(true);
    setActiveTicker(cleanSym);
    try {
      const url = getApiUrl(`/api/v1/stock/sources-test?ticker=${encodeURIComponent(cleanSym)}`);
      const res = await fetch(url || `${API_BASE_URL}/api/v1/stock/sources-test?ticker=${encodeURIComponent(cleanSym)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Error fetching multi-source data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources("ENPH");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      fetchSources(tickerInput.trim());
    }
  };

  const sourcesMap = data?.sources || {};
  const sourceKeys = Object.keys(sourcesMap);
  const displayedKeys = selectedSource === "ALL" ? sourceKeys : [selectedSource];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* TOP CONTROL BAR */}
        <section className="sticky top-16 z-30 rounded-xl border border-slate-800 bg-[#111827]/95 backdrop-blur-md p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                  Data Sources Benchmark Test Bench
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono">
                  Comparing 5 Financial Feeds
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-0.5">
                Multi-Source Header Stats &amp; 12-Quarter Walk: ${activeTicker}
              </h1>
            </div>

            {/* SEARCH INPUT */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 font-mono text-xs">
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                placeholder="ENTER TICKER..."
                className="w-36 md:w-44 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-cyan-400 uppercase"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold transition disabled:opacity-50"
              >
                {loading ? "Comparing..." : "Test Sources"}
              </button>
            </form>
          </div>

          {/* Quick-Pick Chips & Source Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 mt-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span>Quick Test:</span>
              {QUICK_TICKERS.map((sym) => (
                <button
                  type="button"
                  key={sym}
                  onClick={() => {
                    setTickerInput(sym);
                    fetchSources(sym);
                  }}
                  className={`px-2.5 py-0.5 rounded border transition ${
                    activeTicker === sym
                      ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  ${sym}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5">
              {(["BOTH", "CHARTS_ONLY", "TABLE_ONLY"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setChartViewMode(m)}
                  className={`px-2.5 py-1 rounded border transition ${
                    chartViewMode === m
                      ? "bg-blue-600 text-white border-blue-400"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  {m === "BOTH" ? "Graphs & Table" : m === "CHARTS_ONLY" ? "Graphs Only" : "Table Only"}
                </button>
              ))}
            </div>
          </div>

          {/* Source Tabs */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800/80 mt-3 font-mono text-xs">
            <button
              type="button"
              onClick={() => setSelectedSource("ALL")}
              className={`px-3 py-1 rounded border transition ${
                selectedSource === "ALL"
                  ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
              }`}
            >
              All Sources Stacked
            </button>
            {sourceKeys.map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setSelectedSource(k)}
                className={`px-3 py-1 rounded border transition ${
                  selectedSource === k
                    ? "bg-blue-600 border-blue-400 text-white font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {sourcesMap[k]?.source_name}
              </button>
            ))}
          </div>
        </section>

        {/* COMPARISON SECTIONS FOR EACH SOURCE */}
        <div className="space-y-8">
          {displayedKeys.map((key) => {
            const src = sourcesMap[key];
            if (!src) return null;
            const h = src.header_strip || {};
            const hist12q = src.historical_12q || [];

            return (
              <div key={key} className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4 shadow-lg">

                {/* SOURCE TELEMETRY BADGE */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{src.source_name}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                        {src.status}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Policy: <strong className="text-slate-300">{src.rate_limit_policy}</strong> • Latest Period: <strong className="text-cyan-400">{src.latest_quarter_reported}</strong>
                    </p>
                  </div>
                  <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                    HTTP Latency: <strong className="text-emerald-400">{src.latency_ms} ms</strong>
                  </div>
                </div>

                {/* 1. HEADER-STATS INSTITUTIONAL RIBBON */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-2 font-mono text-xs">
                  <div className="flex flex-wrap justify-between gap-2 text-slate-300 border-b border-slate-800 pb-1.5">
                    <div>
                      GICS: <strong className="text-white">{h.gics_sector}</strong> ({h.gics_industry})
                    </div>
                    <div>
                      LIVE PRICE: <strong className="text-emerald-400 text-sm font-bold">${h.live_price}</strong>
                    </div>
                    <div>
                      MCAP: <strong className="text-white">${h.market_cap_bn}B</strong> • EV: <strong className="text-white">${h.enterprise_value_bn}B</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-300">
                    <div>
                      BETA: <strong className="text-amber-300">{h.beta}</strong> • SHORT FLOAT: <strong className="text-rose-300">{h.short_interest_pct_float}%</strong> • INST OWN: <strong className="text-slate-200">{h.institutional_ownership_pct}%</strong>
                    </div>
                    <div>
                      CASH: <strong className="text-emerald-300">${h.total_cash_bn}B</strong> • DEBT: <strong className="text-rose-300">${h.total_debt_bn}B</strong> • NET DEBT/EBITDA: <strong className="text-cyan-300">{h.net_debt_to_ebitda}x</strong>
                    </div>
                  </div>
                </div>

                {/* 2. 12-QUARTER FORENSIC FINANCIAL WALK & SOLVENCY VISUALIZER */}
                {(chartViewMode === "BOTH" || chartViewMode === "CHARTS_ONLY") && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Graph 1 */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="font-bold text-cyan-300 uppercase">
                          Revenue, OCF, FCF &amp; Net Income ($M)
                        </span>
                        <span className="text-slate-400">Right: Gross Margin %</span>
                      </div>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={hist12q} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} />
                            <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v}`} />
                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} domain={[20, 85]} tickFormatter={(v) => `${v}%`} />
                            <Tooltip contentStyle={{ backgroundColor: "#0b101b", borderColor: "#334155", fontSize: "11px" }} />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                            <Bar yAxisId="left" dataKey="revenue_m" name="Revenue ($M)" fill="#38bdf8" radius={[2, 2, 0, 0]} opacity={0.8} />
                            <Line yAxisId="left" type="monotone" dataKey="free_cash_flow_m" name="FCF ($M)" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} />
                            <Line yAxisId="left" type="monotone" dataKey="gaap_net_income_m" name="Net Income ($M)" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} />
                            <Line yAxisId="right" type="monotone" dataKey="gaap_gross_margin_pct" name="Gross Margin %" stroke="#10b981" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Graph 2 */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="font-bold text-amber-300 uppercase">
                          Cash vs Debt ($M) &amp; FCF Conv (%)
                        </span>
                        <span className="text-slate-400">Right: FCF Conv %</span>
                      </div>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={hist12q} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} />
                            <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v}`} />
                            <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={10} domain={[0, 400]} tickFormatter={(v) => `${v}%`} />
                            <Tooltip contentStyle={{ backgroundColor: "#0b101b", borderColor: "#334155", fontSize: "11px" }} />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                            <Bar yAxisId="left" dataKey="cash_and_equivalents_m" name="Cash ($M)" fill="#10b981" opacity={0.6} radius={[2, 2, 0, 0]} />
                            <Bar yAxisId="left" dataKey="total_debt_m" name="Debt ($M)" fill="#ef4444" opacity={0.6} radius={[2, 2, 0, 0]} />
                            <Line yAxisId="left" type="monotone" dataKey="net_cash_m" name="Net Cash ($M)" stroke="#a855f7" strokeWidth={2} dot={{ r: 2 }} />
                            <Line yAxisId="right" type="monotone" dataKey="fcf_conversion_pct" name="FCF Conv %" stroke="#38bdf8" strokeWidth={1.5} dot={{ r: 2 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Table View */}
                {(chartViewMode === "BOTH" || chartViewMode === "TABLE_ONLY") && (
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Period</th>
                          <th className="py-2 px-3">Revenue ($M)</th>
                          <th className="py-2 px-3">Gross Margin</th>
                          <th className="py-2 px-3">GAAP Net Inc</th>
                          <th className="py-2 px-3">OCF ($M)</th>
                          <th className="py-2 px-3">FCF ($M)</th>
                          <th className="py-2 px-3">Net Cash ($M)</th>
                          <th className="py-2 px-3">EBIT Coverage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {hist12q.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/60">
                            <td className="py-1.5 px-3 font-bold text-white">{row.period}</td>
                            <td className="py-1.5 px-3 text-cyan-400">${row.revenue_m}</td>
                            <td className="py-1.5 px-3 text-slate-300">{row.gaap_gross_margin_pct}%</td>
                            <td className={`py-1.5 px-3 ${row.gaap_net_income_m >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              ${row.gaap_net_income_m}
                            </td>
                            <td className="py-1.5 px-3 text-slate-300">${row.operating_cash_flow_m}</td>
                            <td className="py-1.5 px-3 text-slate-200 font-bold">${row.free_cash_flow_m}</td>
                            <td className={`py-1.5 px-3 font-semibold ${row.net_cash_m >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                              {row.net_cash_m >= 0 ? `+$${row.net_cash_m}M` : `-$${Math.abs(row.net_cash_m)}M`}
                            </td>
                            <td className="py-1.5 px-3 text-slate-300">{row.ebit_interest_coverage}x</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

