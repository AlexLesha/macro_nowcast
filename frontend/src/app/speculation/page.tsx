"use client";

import React, { useState } from "react";
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

export default function SpeculationMatrixPage() {
  const [selectedTheme, setSelectedTheme] = useState<string>("ALL");

  // The 14 High-Conviction Institutional Stocks
  const speculationStocks = [
    // Theme 1: AI Compute & Power Infrastructure
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
      stock: "Broadcom Inc",
      ticker: "AVGO",
      industry: "Custom AI Accelerators & ASIC",
      theme: "AI Datacenter Expansion",
      asymmetry: "3.4 : 1",
      horizon: "1–3 Months",
      reasons:
        "High-margin enterprise networking switches + custom ASIC co-design for Google & Meta. FCF margin exceeds 38% of sales with consistent share repurchase yield.",
    },
    {
      order: "2nd Order",
      stock: "Vistra Corp",
      ticker: "VST",
      industry: "Independent Power & Nuclear",
      theme: "AI Datacenter Expansion",
      asymmetry: "4.2 : 1",
      horizon: "3–6 Months",
      reasons:
        "Hyperscalers require 24/7 baseload electricity. PJM capacity auction pricing up 800% + long-term power purchase contracts at premium pricing. VAMS Bullish Trend with 2.1x RVOL thrust.",
    },
    {
      order: "2nd Order",
      stock: "Constellation Energy",
      ticker: "CEG",
      industry: "Clean Energy / Nuclear Baseload",
      theme: "AI Datacenter Expansion",
      asymmetry: "3.9 : 1",
      horizon: "3–6 Months",
      reasons:
        "Largest US commercial nuclear operator. Historic 20-year Microsoft power contract for Crane Clean Energy Center restarts Three Mile Island capacity at high fixed spread.",
    },
    {
      order: "2nd Order",
      stock: "Vertiv Holdings",
      ticker: "VRT",
      industry: "Datacenter Liquid Cooling",
      theme: "AI Datacenter Expansion",
      asymmetry: "3.6 : 1",
      horizon: "2–4 Months",
      reasons:
        "Next-gen AI servers (GB200) consume 100kW+ per rack, requiring complete transition from air to liquid cooling. Vertiv controls ~40% global thermal management market share.",
    },
    {
      order: "2nd Order",
      stock: "Arista Networks",
      ticker: "ANET",
      industry: "AI Networking Infrastructure",
      theme: "AI Datacenter Expansion",
      asymmetry: "3.2 : 1",
      horizon: "2–4 Months",
      reasons:
        "Dominant supplier of 800G and 1.6T Ethernet switching connecting tens of thousands of GPUs without latency bottlenecks. Operating margins exceed 42%.",
    },
    {
      order: "3rd Order",
      stock: "United States Copper Index",
      ticker: "CPER",
      industry: "Industrial Commodities",
      theme: "AI Datacenter Expansion",
      asymmetry: "3.5 : 1",
      horizon: "3–9 Months",
      reasons:
        "Each 1GW datacenter requires ~50,000 tons of refined copper for substation transformers, busbars, and distribution cables. Collides with severe global mine supply deficit.",
    },
    {
      order: "3rd Order",
      stock: "Freeport-McMoRan",
      ticker: "FCX",
      industry: "Base Metals Mining & Smelting",
      theme: "AI Datacenter Expansion",
      asymmetry: "3.7 : 1",
      horizon: "3–9 Months",
      reasons:
        "Tier-1 copper assets in Americas & Indonesia with low all-in sustaining costs. Operates as high-beta operating leverage proxy on physical copper price spikes.",
    },
    {
      order: "3rd Order",
      stock: "Quanta Services",
      ticker: "PWR",
      industry: "Grid Engineering & Construction (EPC)",
      theme: "AI Datacenter Expansion",
      asymmetry: "3.1 : 1",
      horizon: "6–12 Months",
      reasons:
        "Regulated utilities cannot connect new nuclear and gas baseload without massive high-voltage transmission line rebuilds. Quanta holds $30B+ backlogs with multi-year visibility.",
    },

    // Theme 2: Sovereign Fiscal Dominance & Debasement
    {
      order: "1st Order",
      stock: "SPDR Gold Trust",
      ticker: "GLD",
      industry: "Physical Precious Metals",
      theme: "Sovereign Debt Dominance",
      asymmetry: "4.5 : 1",
      horizon: "1–12 Months",
      reasons:
        "US Debt-to-Liquidity ratio at 114% + foreign central banks shifting reserves out of Treasuries into physical bullion. Prometheus 1965 analog expected return +14.2%.",
    },
    {
      order: "2nd Order",
      stock: "VanEck Gold Miners",
      ticker: "GDX",
      industry: "Precious Metals Equity",
      theme: "Sovereign Debt Dominance",
      asymmetry: "4.1 : 1",
      horizon: "2–6 Months",
      reasons:
        "All-in sustaining costs stabilized at ~$1,350/oz while gold trades above $2,700/oz, generating record free cash flow yields and dividend acceleration for unhedged producers.",
    },

    // Theme 3: Yield Curve Steepening & Bank NIM
    {
      order: "1st Order",
      stock: "ProShares UltraShort 20+ Year",
      ticker: "TBT",
      industry: "Fixed Income Inverse",
      theme: "Yield Curve Steepening",
      asymmetry: "2.8 : 1",
      horizon: "1–3 Months",
      reasons:
        "Direct trade on duration repricing as Treasury bill issuance share is cut in favor of longer coupon auctions, expanding the 10Y/30Y term premium.",
    },
    {
      order: "2nd Order",
      stock: "SPDR S&P Regional Banking",
      ticker: "KRE",
      industry: "Regional Financial Institutions",
      theme: "Yield Curve Steepening",
      asymmetry: "3.0 : 1",
      horizon: "2–4 Months",
      reasons:
        "Asset-liability spread recovery: Fed rate cuts reduce funding/deposit costs while intermediate lending yields remain sticky, boosting bank Net Interest Margins (NIM).",
    },

    // Theme 4: Commodity Reflation
    {
      order: "1st Order",
      stock: "United States Oil Fund",
      ticker: "USO",
      industry: "Energy Commodities",
      theme: "Reflation & Energy Supply",
      asymmetry: "3.2 : 1",
      horizon: "1–3 Months",
      reasons:
        "Direct proxy on front-month crude oil. Quad 2 global economic acceleration + Red Sea and Middle East transit friction keeping global inventory draws elevated.",
    },
  ];

  const themes = ["ALL", "AI Datacenter Expansion", "Sovereign Debt Dominance", "Yield Curve Steepening", "Reflation & Energy Supply"];

  const filteredStocks = speculationStocks.filter((s) => {
    return selectedTheme === "ALL" || s.theme === selectedTheme;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-semibold mb-1">
          <Sparkles className="h-4 w-4" />
          <span>INSTITUTIONAL CAPITAL FLOW LOGIC</span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
          1st, 2nd &amp; 3rd Order Speculation Matrix
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1 max-w-3xl">
          Mapping the sequential transmission of macro drivers into equity capital flows. As 1st order trades become crowded, 2nd and 3rd order infrastructure enablers capture asymmetric alpha.
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
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300">OBVIOUS CROWD</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Primary assets directly impacted by headline macro policy (e.g. NVDA GPU demand, GLD currency debasement, USO crude prices).
            </p>
            <div className="pt-1 text-[10px] text-slate-400 font-semibold">
              Valuation Multiples: <strong className="text-slate-200">Expanded / Peak</strong>
            </div>
          </div>

          {/* Box 2 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400">2ND ORDER: ENABLERS</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300">ALPHA ZONE</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Critical supply chain inputs and infrastructure required for 1st order themes to scale (e.g. VST/CEG nuclear power, VRT liquid cooling).
            </p>
            <div className="pt-1 text-[10px] text-slate-400 font-semibold">
              Valuation Multiples: <strong className="text-slate-200">Lagging Hyperscalers</strong>
            </div>
          </div>

          {/* Box 3 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">3RD ORDER: DERIVATIVES</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300">ASYMMETRIC</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Second-derivative capital flows and bottleneck physical resources (e.g. CPER/FCX copper wiring, PWR grid EPC engineering).
            </p>
            <div className="pt-1 text-[10px] text-slate-400 font-semibold">
              Valuation Multiples: <strong className="text-slate-200">Deep Cyclical Discount</strong>
            </div>
          </div>
        </div>
      </div>

      {/* THE 14 HIGH-CONVICTION STOCKS DATA TABLE */}
      <div className="rounded-2xl bg-[#0c121e] border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Order of Effect</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Ticker</th>
                <th className="py-3.5 px-4">Industry</th>
                <th className="py-3.5 px-4 min-w-[320px]">
                  Reasons for Selection (Framework Synthesis &amp; Capital Flow Logic)
                </th>
                <th className="py-3.5 px-4 text-center">Asymmetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStocks.map((item, idx) => {
                const is1st = item.order === "1st Order";
                const is2nd = item.order === "2nd Order";

                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    {/* Order Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
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
                    <td className="py-3 px-4 font-bold text-slate-100">{item.stock}</td>

                    {/* Ticker */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-cyan-400">${item.ticker}</span>
                    </td>

                    {/* Industry */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{item.industry}</td>

                    {/* Reasons for Selection */}
                    <td className="py-3 px-4 text-slate-300 leading-relaxed text-[11px]">
                      {item.reasons}
                    </td>

                    {/* Asymmetry */}
                    <td className="py-3 px-4 text-center font-bold text-emerald-400">
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
