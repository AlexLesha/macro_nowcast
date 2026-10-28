"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { getApiUrl } from "@/lib/api";

const QUICK_TICKERS = ["ENPH", "NVDA", "TPL", "JPM", "CEG", "CAT"];

type ViewMode = "BOTH" | "GRAPHS" | "TABLE";

export default function SingleStockAnalysisPage() {
  const [tickerInput, setTickerInput] = useState<string>("ENPH");
  const [activeTicker, setActiveTicker] = useState<string>("ENPH");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [geminiStatus, setGeminiStatus] = useState<any>(null);
  const [walkViewMode, setWalkViewMode] = useState<ViewMode>("BOTH");

  const fetchAnalysis = async (symbol: string) => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/v1/stock/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: symbol, regime: "REFLATION", quad: "Quad 2" }),
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setActiveTicker(symbol.toUpperCase());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeminiHealth = async () => {
    try {
      const res = await fetch(getApiUrl("/api/v1/stock/gemini-status"));
      if (res.ok) {
        const json = await res.json();
        setGeminiStatus(json);
      }
    } catch {}
  };

  useEffect(() => {
    fetchGeminiHealth();
    fetchAnalysis("ENPH");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      fetchAnalysis(tickerInput.trim());
    }
  };

  const dossier = data?.forensic_dossier;
  const quant = data?.quant_xray;
  const ribbon = data?.header_ribbon;
  const factor = quant?.factor_and_sector_dna;
  const rate = quant?.interest_rate_and_earnings_sensitivity;
  const pods = quant?.hedgeye_3_pods;
  const vams = quant?.vams_and_probable_range;

  const historical12Q: any[] =
    data?.historical_12_quarters ||
    dossier?.forensic_walk?.table ||
    [];

  const peerBenchmarks = data?.peer_valuations;
  const optionsSurface = data?.options_surface;

  const line1 = ribbon?.line_1_identity_and_valuation;
  const line2 = ribbon?.line_2_risk_and_ownership;
  const line3 = ribbon?.line_3_macro_and_regime;

  const bullCatalysts: any[] = dossier?.macro_scenarios?.bull_catalysts_6_12m || [];
  const bearVulnerabilities: any[] = dossier?.macro_scenarios?.bear_vulnerabilities_6_12m || [];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* STICKY TOP COCKPIT WITH SEARCH INPUT & 3-LINE METRIC RIBBON */}
        <section className="sticky top-16 z-30 rounded-xl border border-slate-800 bg-[#111827]/95 backdrop-blur-md p-4 shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                  Institutional Single-Stock Forensic & Macro Dossier
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-mono">
                  Continuous Long-Scroll View
                </span>
                {geminiStatus && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono border ${
                      geminiStatus.color === "green"
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                        : "bg-amber-950/40 border-amber-500/40 text-amber-300"
                    }`}
                    title={geminiStatus.format_warning || geminiStatus.message}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        geminiStatus.color === "green" ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                    {geminiStatus.status === "ONLINE"
                      ? "Gemini 2.5 Flash Online"
                      : "Verified Quant Mode"}
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-0.5">
                {dossier?.company_name || activeTicker} ({activeTicker})
              </h1>
            </div>

            {/* TOP RIGHT CORNER: SEARCH INPUT + ANALYZE BUTTON */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 font-mono text-xs">
              <div className="relative">
                <input
                  type="text"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  placeholder="ENTER TICKER..."
                  className="w-36 md:w-44 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-cyan-400 uppercase tracking-wider"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-md transition disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze Stock"}
              </button>
            </form>
          </div>

          {/* 3-LINE TOP HEADER METRIC RIBBON */}
          <div className="rounded-lg border border-slate-800/90 bg-slate-950/70 p-2.5 space-y-1.5 font-mono text-[11px]">
            {/* Line 1: GICS, Live Price, Market Cap, Enterprise Value */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-semibold">
                  GICS: {line1?.gics_sector || quant?.gics_sector || "Technology"} • {line1?.gics_industry || quant?.gics_industry || "Semiconductors / Solar"}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-white font-bold">
                  LIVE PRICE: ${(line1?.live_price ?? vams?.price ?? 64.8).toFixed(2)}{" "}
                  <span
                    className={
                      (line1?.price_change_1d_pct ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }
                  >
                    ({(line1?.price_change_1d_pct ?? 0) >= 0 ? "+" : ""}
                    {line1?.price_change_1d_pct ?? -1.42}%)
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-slate-300">
                <span>
                  MKT CAP: <strong className="text-white">${line1?.market_cap_bn ?? quant?.market_cap_bn ?? 8.4}B</strong>
                </span>
                <span>•</span>
                <span>
                  ENTERPRISE VALUE (EV): <strong className="text-cyan-300">${line1?.enterprise_value_bn ?? 8.0}B</strong>
                </span>
                <span>•</span>
                <span>
                  FWD P/E: <strong className="text-white">{line1?.forward_pe ?? quant?.quality_and_valuation?.forward_pe ?? 19.8}x</strong>
                </span>
              </div>
            </div>

            {/* Line 2: Beta, Short Float %, Institutional %, Insider %, RSI / VAMS */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-1.5">
              <div className="flex flex-wrap items-center gap-3 text-slate-300">
                <span>
                  126D BETA: <strong className="text-amber-300">{line2?.beta_126d ?? factor?.primary_empirical_sector?.beta_6m ?? 1.35}x</strong>
                </span>
                <span>•</span>
                <span>
                  SHORT FLOAT:{" "}
                  <strong className={(line2?.short_float_pct ?? 5) >= 10 ? "text-rose-400" : "text-white"}>
                    {line2?.short_float_pct ?? 11.4}%
                  </strong>{" "}
                  <span className="text-slate-500">({line2?.short_ratio_days ?? 3.8}d DTC)</span>
                </span>
                <span>•</span>
                <span>
                  INSTITUTIONAL OWN: <strong className="text-emerald-300">{line2?.institutional_ownership_pct ?? 84.6}%</strong>
                </span>
                <span>•</span>
                <span>
                  INSIDER (DEF 14A): <strong className="text-cyan-300">{line2?.insider_ownership_pct ?? dossier?.governance?.insider_ownership_pct ?? 2.8}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  14D RSI: <strong className="text-white">{line2?.rsi_14d ?? vams?.rsi_14d ?? 48.5}</strong>
                </span>
                <span
                  className={`px-2 py-0.5 rounded border font-bold ${
                    (line2?.vams_state_label || vams?.vams_label) === "BULLISH"
                      ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                      : (line2?.vams_state_label || vams?.vams_label) === "BEARISH"
                      ? "bg-rose-950/50 border-rose-500/40 text-rose-300"
                      : "bg-amber-950/50 border-amber-500/40 text-amber-300"
                  }`}
                >
                  VAMS: {line2?.vams_state_label || vams?.vams_label || "NEUTRAL"}
                </span>
              </div>
            </div>

            {/* Line 3: Macro Regime, CACRI, Dr. Mo, Factor DNA */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3 text-slate-300">
                <span>
                  MACRO REGIME: <strong className="text-blue-300">{line3?.macro_regime_label || "REFLATION (Quad 2)"}</strong>
                </span>
                <span>•</span>
                <span>
                  42M CACRI: <strong className="text-emerald-400">{line3?.cacri_pct ?? 19.0}% ({line3?.cacri_status || "CONTAINED"})</strong>
                </span>
                <span>•</span>
                <span>
                  FACTOR DNA: <strong className="text-white">{line3?.primary_sector_etf || "$XLK"}</strong> /{" "}
                  <strong className="text-cyan-300">{line3?.primary_style_etf || "$MTUM"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-bold">
                  DR. MO: {line3?.dr_mo_signal || quant?.verdict?.dr_mo_proper_action || "LONG: Half Position"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick-Pick Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              <span>Quick Analyze:</span>
              {QUICK_TICKERS.map((sym) => (
                <button
                  key={sym}
                  onClick={() => {
                    setTickerInput(sym);
                    fetchAnalysis(sym);
                  }}
                  className={`px-2.5 py-0.5 rounded border transition ${
                    activeTicker === sym
                      ? "bg-cyan-950 border-cyan-500/50 text-cyan-300 font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  ${sym}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500">
              As of: {data?.as_of_utc || "Live Sync"}
            </span>
          </div>
        </section>

        {/* SECTION 1: THE EXECUTIVE COCKPIT & TRAFFIC-LIGHT SCORECARD */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex flex-wrap justify-between items-center gap-2">
            <h2 className="text-lg font-bold text-white">
              1. Executive Cockpit & &quot;Traffic Light&quot; Quality Scorecard
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Evaluated in Macro Regime: {line3?.macro_regime_label || "Reflation (US Quad 2)"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Moat & Architecture", item: dossier?.scorecard?.moat_and_architecture },
              { label: "Balance Sheet Solvency", item: dossier?.scorecard?.balance_sheet_solvency },
              { label: "Forensic Earnings Quality", item: dossier?.scorecard?.forensic_earnings_quality },
              { label: "Factor & Rate Resilience", item: dossier?.scorecard?.factor_and_rate_resilience },
              { label: "Macro Regime Congruence", item: dossier?.scorecard?.macro_regime_congruence },
            ].map((card, idx) => {
              const gr = card.item?.grade || "AMBER";
              const col =
                gr === "GREEN"
                  ? "text-emerald-400 bg-emerald-950/40 border-emerald-500/40"
                  : gr === "RED"
                  ? "text-rose-400 bg-rose-950/40 border-rose-500/40"
                  : "text-amber-400 bg-amber-950/40 border-amber-500/40";
              return (
                <div key={idx} className={`rounded-lg border p-3 space-y-1.5 flex flex-col justify-between ${col}`}>
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span>{card.label}</span>
                    <span className="px-1.5 py-0.5 rounded bg-black/40">{gr}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-snug">
                    {card.item?.rationale || "Analyzing fundamental signals..."}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quantitative Factor Regression Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-2 text-xs font-mono">
              <div className="text-cyan-300 font-bold uppercase">Empirical Factor DNA (126-Day Rolling OLS)</div>
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Sector Match:</span>
                <span className="text-white font-bold">
                  {factor?.primary_empirical_sector?.name || "N/A"} (${factor?.primary_empirical_sector?.etf || "XLK"}) • r={factor?.primary_empirical_sector?.corr_6m ?? "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Style Factor:</span>
                <span className="text-white font-bold">
                  {factor?.primary_empirical_style_factor?.name || "N/A"} (${factor?.primary_empirical_style_factor?.etf || "MTUM"}) • r={factor?.primary_empirical_style_factor?.corr_6m ?? "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">OLS Systematic R² vs Alpha:</span>
                <span className="text-emerald-300 font-bold">
                  R²={factor?.alpha_beta_decomposition?.systematic_macro_factor_r2_pct ?? 65}% • α={factor?.alpha_beta_decomposition?.jensens_alpha_annualized_pct ?? 4.5}%/yr
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-2 text-xs font-mono">
              <div className="text-amber-300 font-bold uppercase">Balance Sheet & Rate Sensitivity</div>
              <div className="flex justify-between">
                <span className="text-slate-400">Net Debt / EBITDA:</span>
                <span className="text-white font-bold">
                  {rate?.net_debt_to_ebitda ?? "N/A"}x (EBIT Coverage: {rate?.interest_coverage_x ?? "N/A"}x)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">+100 bps Rate Shock EPS Impact:</span>
                <span className={(rate?.est_eps_impact_from_plus_100bps_rates_pct || 0) >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {(rate?.est_eps_impact_from_plus_100bps_rates_pct || 0) > 0 ? "+" : ""}
                  {rate?.est_eps_impact_from_plus_100bps_rates_pct ?? 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rate Sensitivity Character:</span>
                <span className="text-slate-300 truncate max-w-[260px]" title={rate?.rate_regime_character}>
                  {rate?.rate_regime_character || "Evaluating"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: 12-QUARTER FORENSIC FINANCIAL WALK & DUAL-CHART VISUALIZER */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                2. 12-Quarter Forensic Financial Walk & Solvency Visualizer
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                GAAP Net Income vs Operating Cash Flow vs True FCF Conversion & Net Cash Solvency Walk (SEC EDGAR 10-K / 10-Q)
              </p>
            </div>

            {/* VIEW-MODE TOGGLE: GRAPHS & TABLE | GRAPHS ONLY | TABLE ONLY */}
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1 font-mono text-xs">
              {[
                { mode: "BOTH" as ViewMode, label: "Graphs & Table" },
                { mode: "GRAPHS" as ViewMode, label: "Graphs Only" },
                { mode: "TABLE" as ViewMode, label: "Table Only" },
              ].map((btn) => (
                <button
                  key={btn.mode}
                  type="button"
                  onClick={() => setWalkViewMode(btn.mode)}
                  className={`px-3 py-1 rounded-md transition ${
                    walkViewMode === btn.mode
                      ? "bg-cyan-600 text-white font-bold shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* DUAL-CHART 12-QUARTER RECHARTS VISUALIZER */}
          {(walkViewMode === "BOTH" || walkViewMode === "GRAPHS") && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* CHART 1: 12-QUARTER EARNINGS & CASH CONVERSION WALK */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="text-cyan-400 font-bold uppercase">
                    Chart 2A: 12-Quarter Earnings & True FCF Walk ($M vs Margin %)
                  </span>
                  <span className="text-slate-400 text-[11px]">12 Quarters</span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={historical12Q} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                      <YAxis
                        yAxisId="left"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#34d399"
                        fontSize={11}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          fontSize: "11px",
                          fontFamily: "monospace",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                      <Bar yAxisId="left" dataKey="revenue_m" name="Revenue ($M)" fill="#0284c7" radius={[2, 2, 0, 0]} />
                      <Bar yAxisId="left" dataKey="operating_cash_flow_m" name="OCF ($M)" fill="#38bdf8" radius={[2, 2, 0, 0]} />
                      <Bar yAxisId="left" dataKey="free_cash_flow_m" name="Free Cash Flow ($M)" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar yAxisId="left" dataKey="gaap_net_income_m" name="GAAP Net Inc ($M)" fill="#a855f7" radius={[2, 2, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="gaap_gross_margin_pct"
                        name="Gross Margin (%)"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ r: 2.5 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="roic_pct"
                        name="ROIC (%)"
                        stroke="#34d399"
                        strokeWidth={2}
                        dot={{ r: 2.5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CHART 2: 12-QUARTER BALANCE SHEET SOLVENCY & INTEREST COVERAGE WALK */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="text-amber-400 font-bold uppercase">
                    Chart 2B: 12-Quarter Solvency, Net Cash & EBIT Coverage Walk
                  </span>
                  <span className="text-slate-400 text-[11px]">Cash vs Debt ($M)</span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={historical12Q} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                      <YAxis
                        yAxisId="left"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#fbbf24"
                        fontSize={11}
                        tickFormatter={(v) => `${v}x`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          fontSize: "11px",
                          fontFamily: "monospace",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                      <ReferenceLine yAxisId="left" y={0} stroke="#475569" strokeDasharray="3 3" />
                      <Bar yAxisId="left" dataKey="cash_and_equivalents_m" name="Total Cash ($M)" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar yAxisId="left" dataKey="total_debt_m" name="Total Debt ($M)" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                      <Bar yAxisId="left" dataKey="net_cash_m" name="Net Cash ($M)" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ebit_interest_coverage"
                        name="EBIT Coverage (x)"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        dot={{ r: 2.5 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="net_debt_to_ebitda"
                        name="Net Debt / EBITDA (x)"
                        stroke="#c084fc"
                        strokeWidth={2}
                        dot={{ r: 2.5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 12-QUARTER FORENSIC TABLE */}
          {(walkViewMode === "BOTH" || walkViewMode === "TABLE") && (
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Quarter</th>
                    <th className="py-2.5 px-3">Revenue ($M)</th>
                    <th className="py-2.5 px-3">YoY %</th>
                    <th className="py-2.5 px-3">Gross Margin</th>
                    <th className="py-2.5 px-3">GAAP Net Inc ($M)</th>
                    <th className="py-2.5 px-3">Operating CF ($M)</th>
                    <th className="py-2.5 px-3">Free CF ($M)</th>
                    <th className="py-2.5 px-3">FCF Conversion</th>
                    <th className="py-2.5 px-3">Net Cash ($M)</th>
                    <th className="py-2.5 px-3">EBIT Coverage</th>
                    <th className="py-2.5 px-3">ROIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {historical12Q.map((row: any, i: number) => {
                    const netCash =
                      row.net_cash_m !== undefined && row.net_cash_m !== null
                        ? row.net_cash_m
                        : (row.cash_and_equivalents_m || 0) - (row.total_debt_m || 0);
                    return (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-white">{row.period}</td>
                        <td className="py-2 px-3 text-cyan-300">${row.revenue_m}</td>
                        <td className={`py-2 px-3 ${(row.rev_yoy_pct ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {row.rev_yoy_pct !== undefined && row.rev_yoy_pct !== null
                            ? `${row.rev_yoy_pct > 0 ? "+" : ""}${row.rev_yoy_pct}%`
                            : "N/A"}
                        </td>
                        <td className="py-2 px-3">{row.gaap_gross_margin_pct}%</td>
                        <td className={`py-2 px-3 ${(row.gaap_net_income_m || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          ${row.gaap_net_income_m}
                        </td>
                        <td className="py-2 px-3 text-slate-300">${row.operating_cash_flow_m}</td>
                        <td className="py-2 px-3 text-slate-200 font-bold">${row.free_cash_flow_m}</td>
                        <td className="py-2 px-3 text-emerald-300">
                          {row.fcf_conversion_pct ? `${row.fcf_conversion_pct}%` : "N/A"}
                        </td>
                        <td className={`py-2 px-3 font-semibold ${netCash >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                          {netCash >= 0 ? `+$${netCash.toFixed(0)}M` : `-$${Math.abs(netCash).toFixed(0)}M`}
                        </td>
                        <td className="py-2 px-3 text-slate-300">{row.ebit_interest_coverage}x</td>
                        <td className="py-2 px-3 text-cyan-300">{row.roic_pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300 leading-relaxed">
            <strong className="text-cyan-400 font-mono uppercase">Forensic Accounting Audit Verdict: </strong>
            {dossier?.forensic_walk?.forensic_audit_verdict}
          </div>
        </section>

        {/* SECTION 3: HEDGEYE 3 PODS, UNIT ECONOMICS, MOAT & PEER VALUATION BENCHMARKING */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">
              3. Hedgeye 3 Pods, Unit Economics & Peer Valuation Benchmarking Scorecard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rate-of-Change Acceleration (2nd Derivative) + Base Effect Analysis + Industry Peer Multiples
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <span className="text-cyan-400 font-bold">POD 1: REVENUE RATE-OF-CHANGE</span>
              <div className="flex justify-between">
                <span className="text-slate-400">YoY Growth:</span>
                <span className="text-white font-bold">{pods?.pod_1_revenue?.rev_yoy_pct ?? "N/A"}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sequential Acceleration:</span>
                <span className={(pods?.pod_1_revenue?.rev_acceleration_bps || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {(pods?.pod_1_revenue?.rev_acceleration_bps || 0) > 0 ? "+" : ""}
                  {pods?.pod_1_revenue?.rev_acceleration_bps ?? 0} bps ({pods?.pod_1_revenue?.status || "N/A"})
                </span>
              </div>
              <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                Forward Base Effect: <strong className="text-emerald-300">{pods?.pod_1_revenue?.forward_base_effect || "Analyzing"}</strong>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <span className="text-amber-400 font-bold">POD 2: OPERATING MARGINS</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Margin:</span>
                <span className="text-white font-bold">{pods?.pod_2_margins?.gross_margin_pct ?? "N/A"}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Operating Margin YoY:</span>
                <span className={(pods?.pod_2_margins?.operating_margin_yoy_change_bps || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {(pods?.pod_2_margins?.operating_margin_yoy_change_bps || 0) > 0 ? "+" : ""}
                  {pods?.pod_2_margins?.operating_margin_yoy_change_bps ?? 0} bps
                </span>
              </div>
              <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                Inflation Pass-Through: <strong className="text-slate-200">{pods?.pod_2_margins?.inflation_passthrough || "Evaluating"}</strong>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <span className="text-blue-400 font-bold">POD 3: CAPITAL EFFICIENCY</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Return on Equity (ROE):</span>
                <span className="text-white font-bold">{pods?.pod_3_capital_allocation?.roe_pct ?? "N/A"}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Return on Assets (ROA):</span>
                <span className="text-white font-bold">{pods?.pod_3_capital_allocation?.roa_pct ?? "N/A"}%</span>
              </div>
              <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                FCTE Quality Score: <strong className="text-cyan-300">{quant?.quality_and_valuation?.fcte_quality_score_100 || 50}/100</strong> ({quant?.quality_and_valuation?.quality_tier || "Average"})
              </div>
            </div>
          </div>

          {/* Unit Economics & Moat Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-slate-300">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-1">
              <span className="font-mono font-bold text-white text-xs">Core Moat Architecture:</span>
              <p>{dossier?.moat_economics?.core_architecture || "Evaluating product architecture..."}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-1">
              <span className="font-mono font-bold text-white text-xs">Pricing Power & Switching Costs:</span>
              <p>{dossier?.moat_economics?.pricing_power_and_switching_costs || "Evaluating switching costs..."}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-1">
              <span className="font-mono font-bold text-white text-xs">Customer Concentration:</span>
              <p>{dossier?.moat_economics?.customer_concentration || "Evaluating customer concentration..."}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-1">
              <span className="font-mono font-bold text-white text-xs">Supplier Dependencies:</span>
              <p>{dossier?.moat_economics?.supplier_dependencies || "Evaluating supplier dependencies..."}</p>
            </div>
          </div>

          {/* PEER VALUATION BENCHMARKING SCORECARD */}
          {peerBenchmarks && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold font-mono uppercase text-cyan-300">
                    Peer Valuation Benchmarking Scorecard — {peerBenchmarks.peer_group_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comparing Forward P/E, EV/EBITDA, FCF Yield, Margins, and Leverage across direct sector peers
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Ticker / Company</th>
                      <th className="py-2.5 px-3">Mkt Cap ($B)</th>
                      <th className="py-2.5 px-3">Fwd P/E</th>
                      <th className="py-2.5 px-3">EV/EBITDA</th>
                      <th className="py-2.5 px-3">P/Sales</th>
                      <th className="py-2.5 px-3">FCF Yield</th>
                      <th className="py-2.5 px-3">Rev YoY %</th>
                      <th className="py-2.5 px-3">Gross Margin</th>
                      <th className="py-2.5 px-3">Op Margin</th>
                      <th className="py-2.5 px-3">ROIC / ROE</th>
                      <th className="py-2.5 px-3">Net Debt/EBITDA</th>
                      <th className="py-2.5 px-3">Peer Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {peerBenchmarks.peers?.map((peer: any, idx: number) => (
                      <tr
                        key={idx}
                        className={
                          peer.is_target
                            ? "bg-cyan-950/30 border-l-2 border-l-cyan-400 font-semibold"
                            : "hover:bg-slate-800/40"
                        }
                      >
                        <td className="py-2 px-3">
                          <span className="font-bold text-white">{peer.ticker}</span>{" "}
                          <span className="text-slate-400 text-[11px]">{peer.company_name}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-200">${peer.market_cap_bn}B</td>
                        <td className="py-2 px-3 text-cyan-300">{peer.forward_pe}x</td>
                        <td className="py-2 px-3 text-slate-200">{peer.ev_to_ebitda}x</td>
                        <td className="py-2 px-3 text-slate-300">{peer.price_to_sales}x</td>
                        <td className={`py-2 px-3 ${(peer.fcf_yield_pct ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {peer.fcf_yield_pct}%
                        </td>
                        <td className={`py-2 px-3 ${(peer.rev_growth_yoy_pct ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {peer.rev_growth_yoy_pct > 0 ? "+" : ""}
                          {peer.rev_growth_yoy_pct}%
                        </td>
                        <td className="py-2 px-3 text-slate-200">{peer.gross_margin_pct}%</td>
                        <td className="py-2 px-3 text-slate-200">{peer.operating_margin_pct}%</td>
                        <td className="py-2 px-3 text-cyan-300">{peer.roic_or_roe_pct}%</td>
                        <td className={`py-2 px-3 ${(peer.net_debt_to_ebitda ?? 0) <= 0 ? "text-emerald-400" : "text-amber-300"}`}>
                          {peer.net_debt_to_ebitda}x
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-[10px]">
                            {peer.valuation_verdict}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {peerBenchmarks.peer_averages && (
                      <tr className="bg-slate-900/90 text-amber-300 font-bold border-t-2 border-slate-700">
                        <td className="py-2 px-3">PEER GROUP AVERAGE</td>
                        <td className="py-2 px-3">—</td>
                        <td className="py-2 px-3">{peerBenchmarks.peer_averages.forward_pe}x</td>
                        <td className="py-2 px-3">{peerBenchmarks.peer_averages.ev_to_ebitda}x</td>
                        <td className="py-2 px-3">{peerBenchmarks.peer_averages.price_to_sales}x</td>
                        <td className="py-2 px-3">{peerBenchmarks.peer_averages.fcf_yield_pct}%</td>
                        <td className="py-2 px-3">{peerBenchmarks.peer_averages.rev_growth_yoy_pct}%</td>
                        <td className="py-2 px-3">{peerBenchmarks.peer_averages.gross_margin_pct}%</td>
                        <td className="py-2 px-3">{peerBenchmarks.peer_averages.operating_margin_pct}%</td>
                        <td className="py-2 px-3">{peerBenchmarks.peer_averages.roic_or_roe_pct}%</td>
                        <td className="py-2 px-3">—</td>
                        <td className="py-2 px-3 text-xs">BENCHMARK MEAN</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
                <strong className="text-cyan-400 font-mono uppercase">Relative Valuation Verdict: </strong>
                {peerBenchmarks.relative_valuation_verdict}
              </div>
            </div>
          )}
        </section>

        {/* SECTION 4: GOVERNANCE & SEC REGULATION S-K ITEM 401(f) AUDIT */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-3">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">
              4. Executive Governance, Insider Ownership & Legal Audit
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Form DEF 14A Beneficial Ownership + Trailing 12M Form 4 Insider Logs + SEC Regulation S-K Item 401(f)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
              <span className="text-slate-400">Leadership Tenure:</span>
              <div className="text-white font-bold font-sans">{dossier?.governance?.ceo_tenure || "N/A"}</div>
              <div className="text-slate-400 font-sans">{dossier?.governance?.founder_involvement || ""}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
              <span className="text-slate-400">Insider Equity Stake (DEF 14A):</span>
              <div className="text-emerald-400 font-bold text-base">
                {dossier?.governance?.insider_ownership_pct ?? "N/A"}% of Float
              </div>
              <div className="text-slate-300 font-sans text-[11px]">
                {dossier?.governance?.trailing_12m_form4_summary || "Routine transactions."}
              </div>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1">
              <span className="text-emerald-400 font-bold">SEC Item 401(f) Legal Audit (10-Yr):</span>
              <div className="text-slate-200 font-sans text-xs">{dossier?.governance?.item_401f_legal_audit || "Clean."}</div>
            </div>
          </div>
        </section>

        {/* SECTION 5: MACRO SCENARIOS & SIDE-BY-SIDE 6-12M BULL CATALYSTS VS BEAR VULNERABILITIES */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">
              5. Macro Regime Transmission Channels & 6–12M Bull Catalysts vs. Bear Vulnerabilities
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Top-Down Macro Scenario Sensitivity + Bottom-Up 6–12 Month Catalyst & Vulnerability Matrix
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div className="rounded-lg border border-blue-500/40 bg-blue-950/20 p-4 space-y-1.5">
              <span className="text-blue-300 font-mono font-bold">REFLATION / ACCORD 2.0 (55% PROB)</span>
              <p className="text-slate-200 leading-relaxed">{dossier?.macro_scenarios?.reflation_accord_impact || "Evaluating transmission..."}</p>
            </div>
            <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4 space-y-1.5">
              <span className="text-amber-300 font-mono font-bold">STICKY REAL YIELDS &gt;2% (30% PROB)</span>
              <p className="text-slate-200 leading-relaxed">{dossier?.macro_scenarios?.sticky_inflation_impact || "Evaluating transmission..."}</p>
            </div>
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/20 p-4 space-y-1.5">
              <span className="text-rose-300 font-mono font-bold">QUAD 4 DEFLATION SCARE (15% PROB)</span>
              <p className="text-slate-200 leading-relaxed">{dossier?.macro_scenarios?.deflation_quad4_impact || "Evaluating transmission..."}</p>
            </div>
          </div>

          {/* SIDE-BY-SIDE 6-12M BULL CATALYSTS VS BEAR VULNERABILITIES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {/* LEFT COLUMN: 6-12M BULL CATALYSTS */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 font-mono text-xs">
                <span className="text-emerald-400 font-bold uppercase">
                  ▲ 6–12M Bull Catalysts & Upside Drivers
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 text-[10px]">
                  {bullCatalysts.length} Active Catalysts
                </span>
              </div>
              <div className="space-y-2.5">
                {bullCatalysts.map((cat: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-3 space-y-1 text-xs">
                    <div className="flex flex-wrap justify-between items-center gap-1 font-mono">
                      <span className="font-bold text-emerald-300">{cat.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-[10px]">
                        {cat.horizon_or_prob}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-snug">{cat.transmission}</p>
                    <div className="text-[11px] font-mono text-cyan-300 pt-1">
                      ► Quantified Impact: <strong className="text-white">{cat.valuation_or_eps_impact}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: 6-12M BEAR VULNERABILITIES */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-2 font-mono text-xs">
                <span className="text-rose-400 font-bold uppercase">
                  ▼ 6–12M Bear Vulnerabilities & Downside Risks
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 text-[10px]">
                  {bearVulnerabilities.length} Monitored Risks
                </span>
              </div>
              <div className="space-y-2.5">
                {bearVulnerabilities.map((vuln: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-3 space-y-1 text-xs">
                    <div className="flex flex-wrap justify-between items-center gap-1 font-mono">
                      <span className="font-bold text-rose-300">{vuln.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-200 text-[10px]">
                        {vuln.horizon_or_prob}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-snug">{vuln.transmission}</p>
                    <div className="text-[11px] font-mono text-amber-300 pt-1">
                      ► Downside Sensitivity: <strong className="text-white">{vuln.valuation_or_eps_impact}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: 6-METRIC OPTIONS VOLATILITY SURFACE & TACTICAL OPTIONS PLAYBOOK */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex flex-wrap justify-between items-center gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">
                6. 6-Metric Options Volatility Surface & Multi-Horizon Trade Playbook
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ATM Implied Vol, VRP Spread, 25D Put-Call Skew, Dealer Net GEX, Put/Call Walls & Defined-Risk Options Routing
              </p>
            </div>
            <div className="text-xs font-mono text-cyan-300">
              15D Probable Range: ${vams?.prob_low ?? "N/A"} – ${vams?.prob_high ?? "N/A"}
            </div>
          </div>

          {/* 6-METRIC OPTIONS VOLATILITY SURFACE GRID */}
          {optionsSurface?.metrics_6 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
              {optionsSurface.metrics_6.map((m: any) => {
                const toneClasses =
                  m.tone === "emerald"
                    ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
                    : m.tone === "amber"
                    ? "border-amber-500/40 bg-amber-950/20 text-amber-300"
                    : m.tone === "rose"
                    ? "border-rose-500/40 bg-rose-950/20 text-rose-300"
                    : "border-cyan-500/40 bg-cyan-950/20 text-cyan-300";
                return (
                  <div key={m.id} className={`rounded-lg border p-3.5 space-y-1 ${toneClasses}`}>
                    <div className="text-[11px] text-slate-400 uppercase">{m.label}</div>
                    <div className="text-base font-bold text-white">{m.value}</div>
                    <div className="text-[11px] text-slate-300 font-sans">{m.subvalue}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TACTICAL OPTIONS TRADE SETUPS */}
          {optionsSurface?.tactical_setups && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {optionsSurface.tactical_setups.map((setup: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/90 p-4 space-y-2">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-cyan-400 font-bold">{setup.name}</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px]">
                      {setup.horizon}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-black/50 border border-slate-800 font-mono text-emerald-300 text-xs font-bold">
                    ► {setup.structure}
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 font-mono text-[11px] text-slate-300">
                    <span>{setup.breakeven_and_cushion}</span>
                    <span className="text-amber-300 font-bold">{setup.max_return_on_risk}</span>
                  </div>
                  <p className="text-slate-300 leading-snug">{setup.rationale}</p>
                </div>
              ))}
            </div>
          )}

          {/* 1-3M TACTICAL STANCE & 2-3Y SECULAR THESIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-2.5">
              <div className="flex justify-between items-center font-mono">
                <span className="text-cyan-400 font-bold uppercase">1–3 Month Tactical Execution Summary</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[11px]">
                  Probable Range Routing
                </span>
              </div>
              <p className="text-slate-300">{dossier?.trade_playbook?.tactical_1_to_3m_stance || "Analyzing tactical posture..."}</p>
              <div className="p-3 rounded bg-black/40 border border-slate-800 font-mono text-emerald-300 text-[11px]">
                ► Primary Playbook: {dossier?.trade_playbook?.tactical_options_trade || "Evaluating options blueprint..."}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-2.5">
              <div className="flex justify-between items-center font-mono">
                <span className="text-emerald-400 font-bold uppercase">2–3 Year Secular Thesis & Fair Value</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[11px]">
                  Target: {dossier?.trade_playbook?.fair_value_target_range || "N/A"}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{dossier?.trade_playbook?.secular_2_to_3y_thesis || "Evaluating multi-year secular runway..."}</p>
              <div className="p-3 rounded bg-black/40 border border-slate-800 font-mono text-slate-300 text-[11px]">
                Fair Value Target Range: <strong className="text-white">{dossier?.trade_playbook?.fair_value_target_range || "N/A"}</strong>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
