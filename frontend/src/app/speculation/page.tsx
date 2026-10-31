"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  Zap,
  Filter,
  CheckCircle2,
  GitBranch,
  ShieldCheck,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

export default function SpeculationMatrixPage() {
  const [selectedTheme, setSelectedTheme] = useState<string>("ALL");
  const [specData, setSpecData] = useState<any>(null);

  useEffect(() => {
    fetch(getApiUrl("/api/v1/speculation"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSpecData(data);
      })
      .catch((err) => console.error("Error loading speculation matrix:", err));
  }, []);

  // Baseline Fallback Stock Ideas
  const defaultStocks = [
    {
      order: "1st Order",
      stock: "NVIDIA Corp",
      ticker: "NVDA",
      industry: "Semiconductors / GPU Compute",
      theme: "AI Datacenter Expansion",
      asymmetry: "3.8 : 1",
      horizon: "1–3 Months",
      reasons:
        "Direct primary beneficiary of hyperscaler accelerated computing capex. Blackwell architecture ramp + Top-decile Pod 1/2 revenue acceleration (+12.5% YoY) and 3Fourteen +239 bps active weight tilt.",
    },
    {
      order: "1st Order",
      stock: "Texas Pacific Land Corp",
      ticker: "TPL",
      industry: "Permian Oil & Gas Royalties",
      theme: "Reflation & Energy Supply",
      asymmetry: "4.2 : 1",
      horizon: "3–6 Months",
      reasons:
        "Top 3Fourteen FCTE compounder; 90%+ FCF margin royalty exposure to Permian energy & water without capex inflation drag.",
    },
    {
      order: "1st Order",
      stock: "Cboe Global Markets",
      ticker: "CBOE",
      industry: "Derivatives & Options Exchanges",
      theme: "Yield Curve Steepening",
      asymmetry: "3.6 : 1",
      horizon: "1–6 Months",
      reasons:
        "Structural toll-collector on 0DTE options volume, VIX hedging, and dispersion trading (FCTE + 42 Macro).",
    },
    {
      order: "1st Order",
      stock: "Lockheed Martin Corp",
      ticker: "LMT",
      industry: "Aerospace & Defense",
      theme: "Sovereign Debt Dominance",
      asymmetry: "3.7 : 1",
      horizon: "3–12 Months",
      reasons:
        "Direct beneficiary of Fourth Turning geopolitical escalation & Paradigm C defense outlays.",
    },
    {
      order: "1st Order",
      stock: "Wheaton Precious Metals",
      ticker: "WPM",
      industry: "Precious Metals Streaming",
      theme: "Sovereign Debt Dominance",
      asymmetry: "4.5 : 1",
      horizon: "3–12 Months",
      reasons:
        "Fixed-cost streaming leverage to sovereign gold accumulation (+1.85σ residual) without mine capex inflation.",
    },
    {
      order: "2nd Order",
      stock: "Arista Networks",
      ticker: "ANET",
      industry: "High-Speed AI Networking",
      theme: "AI Datacenter Expansion",
      asymmetry: "3.4 : 1",
      horizon: "2–4 Months",
      reasons:
        "Solves the GPU cluster interconnect bottleneck via ultra-low-latency Ethernet switching (3Fourteen FCTE).",
    },
    {
      order: "2nd Order",
      stock: "Monolithic Power Systems",
      ticker: "MPWR",
      industry: "AI Server Power Management",
      theme: "AI Datacenter Expansion",
      asymmetry: "3.5 : 1",
      horizon: "2–4 Months",
      reasons:
        "High-efficiency monolithic power chips required for high-density AI server racks (FCTE & RAA).",
    },
    {
      order: "2nd Order",
      stock: "Lam Research Corp",
      ticker: "LRCX",
      industry: "Wafer Fab Equipment (WFE)",
      theme: "AI Datacenter Expansion",
      asymmetry: "3.2 : 1",
      horizon: "3–6 Months",
      reasons:
        "2nd-order beneficiary of HBM memory packaging & domestic semiconductor reshoring.",
    },
    {
      order: "2nd Order",
      stock: "The Williams Companies",
      ticker: "WMB",
      industry: "Natural Gas Midstream Pipelines",
      theme: "Reflation & Energy Supply",
      asymmetry: "3.9 : 1",
      horizon: "3–6 Months",
      reasons:
        "24/7 natural gas pipeline toll-collector for AI hyperscale data centers & LNG export terminals.",
    },
    {
      order: "2nd Order",
      stock: "W.W. Grainger",
      ticker: "GWW",
      industry: "Industrial Distribution",
      theme: "Yield Curve Steepening",
      asymmetry: "3.1 : 1",
      horizon: "6–12 Months",
      reasons:
        "2nd-order beneficiary of Paradigm C domestic reshoring & nominal GDP pass-through (3Fourteen FCTE).",
    },
    {
      order: "3rd Order",
      stock: "JPMorgan Chase & Co.",
      ticker: "JPM",
      industry: "Money-Center Banking & Wealth",
      theme: "Yield Curve Steepening",
      asymmetry: "3.3 : 1",
      horizon: "3–9 Months",
      reasons:
        "3rd-order beneficiary of Paradigm C bank SLR deregulation & K-shaped wealth management flows.",
    },
    {
      order: "3rd Order",
      stock: "Constellation Energy",
      ticker: "CEG",
      industry: "Nuclear Baseload Power Generation",
      theme: "AI Datacenter Expansion",
      asymmetry: "4.1 : 1",
      horizon: "3–6 Months",
      reasons:
        "3rd-order AI power monetization via 20-year hyperscaler nuclear power purchase agreements (PPAs).",
    },
    {
      order: "3rd Order",
      stock: "Booking Holdings",
      ticker: "BKNG",
      industry: "Premium Experiential Travel",
      theme: "Sovereign Debt Dominance",
      asymmetry: "3.2 : 1",
      horizon: "3–6 Months",
      reasons:
        "Captures Prometheus Kalecki-Levy top-decile household wealth & dissaving impulse.",
    },
    {
      order: "3rd Order",
      stock: "Palantir Technologies",
      ticker: "PLTR",
      industry: "Enterprise AI & Defense Software",
      theme: "AI Datacenter Expansion",
      asymmetry: "4.0 : 1",
      horizon: "1–6 Months",
      reasons:
        "3rd-order corporate margin defense automating white-collar workflows & defense logistics.",
    },
  ];

  const themes = ["ALL", "AI Datacenter Expansion", "Sovereign Debt Dominance", "Yield Curve Steepening", "Reflation & Energy Supply"];

  const activeStocks = (specData?.speculation_rows && specData.speculation_rows.length > 0)
    ? specData.speculation_rows.map((row: any) => {
        const base = defaultStocks.find((s) => s.ticker === row.ticker);
        return {
          ...base,
          ...row,
          order: row.order || base?.order || "1st Order",
          stock: row.stock || base?.stock || row.ticker,
          theme: row.theme || base?.theme || "AI Datacenter Expansion",
          asymmetry: row.asymmetry || base?.asymmetry || "3.5 : 1",
          reasons: row.reason || base?.reasons,
        };
      })
    : defaultStocks;

  const filteredStocks = activeStocks.filter((s: any) => {
    return selectedTheme === "ALL" || s.theme === selectedTheme;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold mb-1">
          <Sparkles className="h-4 w-4" />
          <span>INSTITUTIONAL CAPITAL FLOW LOGIC &bull; AUDIT ITEM #25</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-base font-bold font-mono tracking-tight text-slate-100">
            1st, 2nd &amp; 3rd Order Speculation Matrix
          </h1>
          <span className="text-xs font-mono px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            As of: <strong className="text-cyan-400">{specData?.as_of_utc || "Live Stream"}</strong>
          </span>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
          Mapping the sequential transmission of macro drivers into equity capital flows. Enriched with live prices, 14D RSI, 52-week price range %, Dr. Mo VAMS states, and dynamic entry timing.
        </p>
      </div>

      {/* THEME SELECTOR PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        {themes.map((th) => (
          <button
            key={th}
            onClick={() => setSelectedTheme(th)}
            className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap font-semibold ${
              selectedTheme === th
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            {th === "ALL" ? "All Macro Themes" : th}
          </button>
        ))}
      </div>

      {/* VISUAL CASCADE FLOW DIAGRAM */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c121e] to-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase">
          <GitBranch className="h-4 w-4" />
          <span>MACRO RIPPLE EFFECT TRANSMISSION MECHANISM</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Box 1 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">1ST ORDER: DIRECT THEME</span>
              <span className="text-xs px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300">OBVIOUS CROWD</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Primary assets directly impacted by headline macro policy (e.g. NVDA GPU compute, GLD currency debasement, TPL Permian energy royalties).
            </p>
            <div className="pt-1 text-xs text-slate-400 font-semibold">
              Valuation Multiples: <strong className="text-slate-200">Expanded / Peak</strong>
            </div>
          </div>

          {/* Box 2 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400">2ND ORDER: ENABLERS</span>
              <span className="text-xs px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300">ALPHA ZONE</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Critical supply chain inputs and infrastructure required for 1st order themes to scale (e.g. ANET networking, MPWR power management, WMB gas pipelines).
            </p>
            <div className="pt-1 text-xs text-slate-400 font-semibold">
              Valuation Multiples: <strong className="text-slate-200">Lagging Hyperscalers</strong>
            </div>
          </div>

          {/* Box 3 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">3RD ORDER: DERIVATIVES</span>
              <span className="text-xs px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300">ASYMMETRIC</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Second-derivative capital flows and bottleneck physical resources (e.g. CEG nuclear power PPAs, JPM SLR relief, PLTR margin defense).
            </p>
            <div className="pt-1 text-xs text-slate-400 font-semibold">
              Valuation Multiples: <strong className="text-slate-200">Deep Cyclical Discount</strong>
            </div>
          </div>
        </div>
      </div>

      {/* THE 14 HIGH-CONVICTION STOCKS DATA TABLE */}
      <div className="rounded-2xl bg-[#0c121e] border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-xs border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Order of Effect</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Ticker</th>
                <th className="py-3.5 px-4">Live Price / VAMS</th>
                <th className="py-3.5 px-4 min-w-[240px]">Live Entry Timing &amp; 52W Range</th>
                <th className="py-3.5 px-4">Industry</th>
                <th className="py-3.5 px-4 min-w-[280px]">
                  Selection Logic &amp; Alpha Rationale
                </th>
                <th className="py-3.5 px-4 text-center">Asymmetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStocks.map((item: any, idx: number) => {
                const is1st = item.order?.includes("1st");
                const is2nd = item.order?.includes("2nd");

                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    {/* Order Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs uppercase ${
                          is1st
                            ? "bg-cyan-950/80 text-cyan-400 border border-cyan-800"
                            : is2nd
                            ? "bg-indigo-950/80 text-indigo-400 border border-indigo-800"
                            : "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                        }`}
                      >
                        {item.order}
                      </span>
                    </td>

                    {/* Stock Name */}
                    <td className="py-3 px-4 font-bold text-slate-100 whitespace-nowrap">{item.stock}</td>

                    {/* Ticker */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-cyan-400">${item.ticker}</span>
                    </td>

                    {/* Live Price / VAMS */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.live_price ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-100">${Number(item.live_price).toFixed(2)}</span>
                          <span
                            className={`block text-xs font-bold ${
                              item.vams_status?.includes("+1") || item.vams_status?.includes("BULLISH")
                                ? "text-emerald-400"
                                : item.vams_status?.includes("-1") || item.vams_status?.includes("BEARISH")
                                ? "text-rose-400"
                                : "text-slate-400"
                            }`}
                          >
                            {item.vams_status || "NEUTRAL (0)"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>

                    {/* Live Entry Timing & 52W Range */}
                    <td className="py-3 px-4">
                      {item.live_entry_timing ? (
                        <div className="space-y-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold border inline-block ${
                              item.live_entry_timing.includes("LOW-BASE") || item.live_entry_timing.includes("Priority Accumulate")
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                                : item.live_entry_timing.includes("EXTENDED")
                                ? "bg-amber-950/80 text-amber-300 border-amber-800"
                                : "bg-cyan-950/80 text-cyan-300 border-cyan-800"
                            }`}
                          >
                            {item.live_entry_timing}
                          </span>
                          {item.range_52w_pct !== undefined && (
                            <div className="w-28 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-cyan-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, item.range_52w_pct))}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">Tracking</span>
                      )}
                    </td>

                    {/* Industry */}
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{item.industry}</td>

                    {/* Reasons for Selection */}
                    <td className="py-3 px-4 text-slate-300 leading-relaxed text-xs">
                      {item.reasons}
                    </td>

                    {/* Asymmetry */}
                    <td className="py-3 px-4 text-center font-bold text-emerald-400 whitespace-nowrap">
                      {item.asymmetry}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
