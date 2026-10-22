"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  Filter,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Zap,
  BarChart3,
  Layers,
  Search,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

export default function OutlierScannerPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetch(getApiUrl("/api/outliers/scan"))
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res) setData(res);
      })
      .catch((e) => console.error("Error loading outliers:", e))
      .finally(() => setLoading(false));
  }, []);

  const defaultOutliers = [
    {
      ticker: "NVDA",
      name: "NVIDIA Corp",
      theme: "AI Compute Scaling",
      asset_class: "Semiconductors",
      outlier_score: 92.2,
      conviction_tier: "HIGH_CONVICTION_LONG",
      target_return_horizon_pct: "+18.5%",
      stop_loss_level: 128.53,
      current_price: 141.50,
      risk_range_low: 132.50,
      risk_range_high: 149.00,
      trend_pivot: 135.20,
      vams_state: 1,
      total_gex_m: 1850.0,
      call_wall: 150.0,
      put_wall: 130.0,
      zero_dte_heat: 0.32,
      why_rationale:
        "Quad 2 tailwind acceleration + VAMS momentum breakout above Trend pivot + Strong dealer Call Wall magnet ($150) + Top-decile Pod 1/2 FCF acceleration",
    },
    {
      ticker: "VST",
      name: "Vistra Corp",
      theme: "AI Datacenter Power Demand",
      asset_class: "Independent Power",
      outlier_score: 90.8,
      conviction_tier: "HIGH_CONVICTION_LONG",
      target_return_horizon_pct: "+24.0%",
      stop_loss_level: 114.46,
      current_price: 124.80,
      risk_range_low: 118.00,
      risk_range_high: 134.50,
      trend_pivot: 120.50,
      vams_state: 1,
      total_gex_m: 420.0,
      call_wall: 135.0,
      put_wall: 115.0,
      zero_dte_heat: 0.28,
      why_rationale:
        "Long-term nuclear datacenter offtake power agreements + 2.1x institutional volume thrust + Bullish VAMS breakout above 63D pivot",
    },
    {
      ticker: "GLD",
      name: "SPDR Gold Shares",
      theme: "Sovereign Debt Dominance",
      asset_class: "Hard Asset",
      outlier_score: 88.8,
      conviction_tier: "HIGH_CONVICTION_LONG",
      target_return_horizon_pct: "+12.0%",
      stop_loss_level: 234.74,
      current_price: 248.50,
      risk_range_low: 242.00,
      risk_range_high: 256.00,
      trend_pivot: 244.00,
      vams_state: 1,
      total_gex_m: 550.0,
      call_wall: 255.0,
      put_wall: 240.0,
      zero_dte_heat: 0.15,
      why_rationale:
        "114% US Debt-to-Liquidity ratio + Global central bank de-dollarization reserves + 1965 analog expected return +14.2%",
    },
    {
      ticker: "CEG",
      name: "Constellation Energy",
      theme: "Nuclear Baseload Offtake",
      asset_class: "Clean Baseload",
      outlier_score: 87.2,
      conviction_tier: "CYCLICAL_MOMENTUM_LONG",
      target_return_horizon_pct: "+21.5%",
      stop_loss_level: 244.44,
      current_price: 268.00,
      risk_range_low: 252.00,
      risk_range_high: 284.00,
      trend_pivot: 258.00,
      vams_state: 1,
      total_gex_m: 380.0,
      call_wall: 285.0,
      put_wall: 250.0,
      zero_dte_heat: 0.22,
      why_rationale:
        "Secular baseload demand + Three Mile Island restart catalyst + Top-tier FCF conversion (>22% of revenue)",
    },
    {
      ticker: "VRT",
      name: "Vertiv Holdings",
      theme: "AI Thermal Management",
      asset_class: "Datacenter Hardware",
      outlier_score: 86.5,
      conviction_tier: "CYCLICAL_MOMENTUM_LONG",
      target_return_horizon_pct: "+22.0%",
      stop_loss_level: 98.94,
      current_price: 112.50,
      risk_range_low: 102.00,
      risk_range_high: 122.00,
      trend_pivot: 105.00,
      vams_state: 1,
      total_gex_m: 290.0,
      call_wall: 120.0,
      put_wall: 100.0,
      zero_dte_heat: 0.25,
      why_rationale:
        "Liquid cooling capacity backlog expansion + 3Fourteen FCTE +195 bps active benchmark tilt + Accelerating operating margins",
    },
    {
      ticker: "CPER",
      name: "US Copper Index Fund",
      theme: "Grid Electrification",
      asset_class: "Industrial Metals",
      outlier_score: 81.4,
      conviction_tier: "CYCLICAL_MOMENTUM_LONG",
      target_return_horizon_pct: "+16.0%",
      stop_loss_level: 26.00,
      current_price: 28.50,
      risk_range_low: 26.80,
      risk_range_high: 30.50,
      trend_pivot: 27.40,
      vams_state: 1,
      total_gex_m: 120.0,
      call_wall: 30.0,
      put_wall: 26.5,
      zero_dte_heat: 0.12,
      why_rationale:
        "Global mine supply deficit colliding with hyperscaler electrical grid transformer buildouts",
    },
    {
      ticker: "TLT",
      name: "iShares 20+ Year Treasury",
      theme: "Fiscal Deficit Overhang",
      asset_class: "Long Sovereign Debt",
      outlier_score: 39.5,
      conviction_tier: "TACTICAL_SHORT",
      target_return_horizon_pct: "-8.5%",
      stop_loss_level: 94.50,
      current_price: 92.40,
      risk_range_low: 89.00,
      risk_range_high: 95.50,
      trend_pivot: 93.80,
      vams_state: -1,
      total_gex_m: -250.0,
      call_wall: 96.0,
      put_wall: 89.0,
      zero_dte_heat: 0.18,
      why_rationale:
        "504D TAIL pivot breakdown + US Treasury auction size increases + 42 Macro Accord 2.0 watch",
    },
  ];

  const outliersList = data?.ranked_outliers || defaultOutliers;

  const filteredOutliers = outliersList.filter((item: any) => {
    const matchesTier =
      filterTier === "ALL" ||
      (filterTier === "LONG" && item.conviction_tier.includes("LONG")) ||
      (filterTier === "SHORT" && item.conviction_tier.includes("SHORT"));

    const matchesSearch =
      item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.theme.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTier && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold mb-1">
          <Target className="h-4 w-4" />
          <span>QUANTITATIVE OUTLIER ENGINE</span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
          1–3 Month Positioned Assets &amp; Outlier Screener
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
          Multi-factor synthesis of Quad Alignment (25%), VAMS Trend Flips (25%), Options Dealer GEX &amp; Skew (20%), Relative Volume Thrust (15%), and Hedgeye Pod 1/2 Quality (15%) into a calibrated 0–100 OutlierScore.
        </p>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-xs font-mono shadow-md">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            id="outlier-search-input"
            type="text"
            placeholder="Search ticker, name, or macro theme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-slate-500 px-2 flex items-center gap-1 text-[11px]">
            <Filter className="h-3 w-3" />
            Tier:
          </span>
          {["ALL", "LONG", "SHORT"].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                filterTier === tier
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tier === "ALL" ? "All Outliers" : `${tier} Conviction`}
            </button>
          ))}
        </div>
      </div>

      {/* OUTLIER DATA TABLE */}
      <div className="rounded-2xl bg-[#0c121e] border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Asset / Ticker</th>
                <th className="py-3.5 px-4">Outlier Score</th>
                <th className="py-3.5 px-4 min-w-[200px]">Visual Risk Range [Low &bull; Trend &bull; High]</th>
                <th className="py-3.5 px-4">VAMS</th>
                <th className="py-3.5 px-4">Options GEX / Walls</th>
                <th className="py-3.5 px-4">1-3M Target / Stop</th>
                <th className="py-3.5 px-4 min-w-[280px]">Quantitative "Why" Call-Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOutliers.map((row: any, i: number) => {
                const score = row.outlier_score;
                const isLong = row.conviction_tier.includes("LONG");
                const isShort = row.conviction_tier.includes("SHORT");

                // Risk Range Positioning Needle Calculation
                const rrLow = row.risk_range_low || 100;
                const rrHigh = row.risk_range_high || 120;
                const price = row.current_price || (rrLow + rrHigh) / 2;
                const pctPosition = Math.min(100, Math.max(0, ((price - rrLow) / (rrHigh - rrLow)) * 100));

                return (
                  <tr key={i} className="hover:bg-slate-900/40 transition">
                    {/* Ticker & Theme */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        <span className="text-cyan-400">${row.ticker}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-medium">{row.name}</div>
                      <span className="text-[10px] text-slate-500 block">{row.theme}</span>
                    </td>

                    {/* Outlier Score */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base font-black px-2 py-0.5 rounded font-mono ${
                            score >= 85
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                              : score >= 70
                              ? "bg-cyan-950/80 text-cyan-400 border border-cyan-800"
                              : "bg-rose-950/80 text-rose-400 border border-rose-800"
                          }`}
                        >
                          {score}
                        </span>
                      </div>
                      <span className="text-[9px] uppercase text-slate-400 block mt-1">
                        {row.conviction_tier.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Visual Risk Range Bar */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>${rrLow.toFixed(1)}</span>
                          <span className="text-cyan-300 font-bold">${price.toFixed(1)}</span>
                          <span>${rrHigh.toFixed(1)}</span>
                        </div>
                        {/* Range Track with Current Price Needle */}
                        <div className="w-full bg-slate-900 rounded-full h-2.5 relative border border-slate-800 overflow-visible">
                          {/* Low 20% Zone (Buy) */}
                          <div className="absolute left-0 top-0 bottom-0 w-[20%] bg-emerald-500/20 rounded-l-full" />
                          {/* Top 20% Zone (Trim) */}
                          <div className="absolute right-0 top-0 bottom-0 w-[20%] bg-rose-500/20 rounded-r-full" />
                          {/* Needle Indicator */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-2 h-4 rounded bg-cyan-400 border border-white shadow-[0_0_8px_#22d3ee] -ml-1 transition-all"
                            style={{ left: `${pctPosition}%` }}
                            title={`Position: ${pctPosition.toFixed(0)}% of Risk Range`}
                          />
                        </div>
                        <div className="text-[9px] text-slate-500 flex justify-between">
                          <span>Buy Zone</span>
                          <span>Trend Pivot: ${row.trend_pivot?.toFixed(1) || "-"}</span>
                          <span>Trim Zone</span>
                        </div>
                      </div>
                    </td>

                    {/* VAMS Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded font-bold text-xs inline-flex items-center gap-1 ${
                          row.vams_state > 0
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : row.vams_state < 0
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {row.vams_state > 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            +1 BULL
                          </>
                        ) : row.vams_state < 0 ? (
                          <>
                            <TrendingDown className="h-3 w-3" />
                            -1 BEAR
                          </>
                        ) : (
                          "0 NEUTRAL"
                        )}
                      </span>
                    </td>

                    {/* Options GEX / Walls */}
                    <td className="py-3 px-4 text-[11px]">
                      <div>
                        GEX:{" "}
                        <strong className={row.total_gex_m >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {row.total_gex_m >= 0 ? "+" : ""}${row.total_gex_m}M
                        </strong>
                      </div>
                      <div className="text-slate-400">
                        Call Wall: <strong className="text-slate-200">${row.call_wall}</strong>
                      </div>
                      <div className="text-slate-400">
                        Put Wall: <strong className="text-slate-200">${row.put_wall}</strong>
                      </div>
                    </td>

                    {/* Target & Stop */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-emerald-400 text-sm">
                        {row.target_return_horizon_pct}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Stop: <strong className="text-rose-400">${row.stop_loss_level}</strong>
                      </div>
                    </td>

                    {/* Why Rationale */}
                    <td className="py-3 px-4 text-slate-300 leading-relaxed text-[11px]">
                      {row.why_rationale}
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
