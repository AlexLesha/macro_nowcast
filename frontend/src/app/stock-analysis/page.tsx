"use client";

import React, { useState, useEffect } from "react";
import { getApiUrl } from "@/lib/api";

const QUICK_TICKERS = ["ENPH", "NVDA", "TPL", "JPM", "CEG", "CAT"];

export default function SingleStockAnalysisPage() {
  const [tickerInput, setTickerInput] = useState<string>("ENPH");
  const [activeTicker, setActiveTicker] = useState<string>("ENPH");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [geminiStatus, setGeminiStatus] = useState<any>(null);

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
  const factor = quant?.factor_and_sector_dna;
  const rate = quant?.interest_rate_and_earnings_sensitivity;
  const pods = quant?.hedgeye_3_pods;
  const vams = quant?.vams_and_probable_range;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* STICKY TOP COCKPIT WITH SEARCH INPUT AT TOP RIGHT */}
        <section className="sticky top-16 z-30 rounded-xl border border-slate-800 bg-[#111827]/95 backdrop-blur-md p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
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

          {/* Quick-Pick Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80 mt-3 font-mono text-xs text-slate-400">
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
        </section>

        {/* SECTION 1: THE EXECUTIVE COCKPIT & TRAFFIC-LIGHT SCORECARD */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">
              1. Executive Cockpit & &quot;Traffic Light&quot; Quality Scorecard
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Evaluated in Macro Regime: Reflation (US Quad 2)
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
              <div className="text-cyan-300 font-bold uppercase">Empirical Factor DNA (126-Day Rolling)</div>
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Sector Match:</span>
                <span className="text-white font-bold">{factor?.primary_empirical_sector?.name || "N/A"} (${factor?.primary_empirical_sector?.etf || "XLK"}) • r={factor?.primary_empirical_sector?.corr_6m ?? "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Style Factor:</span>
                <span className="text-white font-bold">{factor?.primary_empirical_style_factor?.name || "N/A"} (${factor?.primary_empirical_style_factor?.etf || "MTUM"}) • r={factor?.primary_empirical_style_factor?.corr_6m ?? "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dr. Mo Proper Sizing:</span>
                <span className="text-emerald-300 font-bold">{quant?.verdict?.dr_mo_proper_action || "WATCH"}</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-2 text-xs font-mono">
              <div className="text-amber-300 font-bold uppercase">Balance Sheet & Rate Sensitivity</div>
              <div className="flex justify-between">
                <span className="text-slate-400">Net Debt / EBITDA:</span>
                <span className="text-white font-bold">{rate?.net_debt_to_ebitda ?? "N/A"}x (EBIT Coverage: {rate?.interest_coverage_x ?? "N/A"}x)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">+100 bps Rate Shock EPS Impact:</span>
                <span className={(rate?.est_eps_impact_from_plus_100bps_rates_pct || 0) >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {(rate?.est_eps_impact_from_plus_100bps_rates_pct || 0) > 0 ? "+" : ""}{rate?.est_eps_impact_from_plus_100bps_rates_pct ?? 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rate Sensitivity Character:</span>
                <span className="text-slate-300">{rate?.rate_regime_character || "Evaluating"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: FORENSIC FINANCIAL WALK & EARNINGS QUALITY */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">
              2. Forensic Financial Walk & Earnings Quality (Trailing 3 Years + 4 Quarters)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              GAAP Net Income vs Operating Cash Flow vs True FCF Conversion Bridge (Source: SEC EDGAR 10-K / 10-Q)
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Revenue ($M)</th>
                  <th className="py-2.5 px-3">Gross Margin</th>
                  <th className="py-2.5 px-3">GAAP Net Income ($M)</th>
                  <th className="py-2.5 px-3">Operating Cash Flow ($M)</th>
                  <th className="py-2.5 px-3">Free Cash Flow ($M)</th>
                  <th className="py-2.5 px-3">FCF Conversion</th>
                  <th className="py-2.5 px-3">Net Cash ($M)</th>
                  <th className="py-2.5 px-3">EBIT Coverage</th>
                  <th className="py-2.5 px-3">ROIC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dossier?.forensic_walk?.table?.map((row: any, i: number) => {
                  const netCash = (row.cash_and_equivalents_m || 0) - (row.total_debt_m || 0);
                  return (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-bold text-white">{row.period}</td>
                      <td className="py-2 px-3 text-cyan-300">${row.revenue_m}</td>
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
                        {netCash >= 0 ? `+$${netCash}M` : `-$${Math.abs(netCash)}M`}
                      </td>
                      <td className="py-2 px-3 text-slate-300">{row.ebit_interest_coverage}x</td>
                      <td className="py-2 px-3 text-cyan-300">{row.roic_pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300 leading-relaxed">
            <strong className="text-cyan-400 font-mono uppercase">Forensic Accounting Audit Verdict: </strong>
            {dossier?.forensic_walk?.forensic_audit_verdict}
          </div>
        </section>

        {/* SECTION 3: HEDGEYE 3 PODS, UNIT ECONOMICS & MOAT DEFENSE */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">
              3. Hedgeye 3 Pods, Unit Economics & Moat Defense
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rate-of-Change Acceleration (2nd Derivative) + Base Effect Analysis
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
                  {(pods?.pod_1_revenue?.rev_acceleration_bps || 0) > 0 ? "+" : ""}{pods?.pod_1_revenue?.rev_acceleration_bps ?? 0} bps ({pods?.pod_1_revenue?.status || "N/A"})
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
                  {(pods?.pod_2_margins?.operating_margin_yoy_change_bps || 0) > 0 ? "+" : ""}{pods?.pod_2_margins?.operating_margin_yoy_change_bps ?? 0} bps
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-slate-300 pt-2">
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
              <div className="text-emerald-400 font-bold text-base">{dossier?.governance?.insider_ownership_pct ?? "N/A"}% of Float</div>
              <div className="text-slate-300 font-sans text-[11px]">{dossier?.governance?.trailing_12m_form4_summary || "Routine transactions."}</div>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1">
              <span className="text-emerald-400 font-bold">SEC Item 401(f) Legal Audit (10-Yr):</span>
              <div className="text-slate-200 font-sans text-xs">{dossier?.governance?.item_401f_legal_audit || "Clean."}</div>
            </div>
          </div>
        </section>

        {/* SECTION 5: MACRO SCENARIOS & TRANSMISSION CHANNELS */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-3">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">
              5. Macro Regime Transmission Channels & Catalysts vs. Vulnerabilities
            </h2>
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
        </section>

        {/* SECTION 6: MULTI-HORIZON TRADE STRUCTURING & OPTIONS BLUEPRINT */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">
                6. Multi-Horizon Capital Allocation & Options Volatility Playbook
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                15-Day Probable Range Bounds + Options Collar & Cash-Secured Put Routing
              </p>
            </div>
            <div className="text-xs font-mono text-cyan-300">
              15D Range: ${vams?.prob_low ?? "N/A"} – ${vams?.prob_high ?? "N/A"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Tactical 1-3M Options Spread */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-2.5">
              <div className="flex justify-between items-center font-mono">
                <span className="text-cyan-400 font-bold uppercase">1–3 Month Tactical Execution</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[11px]">
                  Options Spread
                </span>
              </div>
              <p className="text-slate-300">{dossier?.trade_playbook?.tactical_1_to_3m_stance || "Analyzing tactical posture..."}</p>
              <div className="p-3 rounded bg-black/40 border border-slate-800 font-mono text-emerald-300 text-[11px]">
                ► Structure: {dossier?.trade_playbook?.tactical_options_trade || "Evaluating options blueprint..."}
              </div>
            </div>

            {/* Secular 2-3Y Multi-Year Horizon */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-2.5">
              <div className="flex justify-between items-center font-mono">
                <span className="text-emerald-400 font-bold uppercase">2–3 Year Secular Thesis</span>
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
