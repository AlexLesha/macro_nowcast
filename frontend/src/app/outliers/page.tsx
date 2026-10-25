"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

type HorizonKey = "1_to_3_months" | "12_months" | "3_plus_years";

const SUBMENU_TITLES: Record<HorizonKey, string> = {
  "1_to_3_months": "1-3 months",
  "12_months": "12 months",
  "3_plus_years": "3+ Years",
};

function extractFirstTicker(displayTicker: string): string {
  if (!displayTicker) return "SPY";
  const first = displayTicker.split(/[\s\/\+,]+/)[0].trim().replace("$", "");
  return first || "SPY";
}

export default function MultiHorizonOutliersPage() {
  const [horizon, setHorizon] = useState<HorizonKey>("1_to_3_months");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveOutliers = (force = false) => {
    setLoading(true);
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || "https://macro-nowcast-wdw2.onrender.com";
    fetch(`${apiBase}/api/v1/outliers/multi-horizon?force=${force}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLiveOutliers(false);
  }, []);

  const active = data?.horizons?.[horizon] || {
    label: SUBMENU_TITLES[horizon],
    subtitle:
      "Fetching live 5-year price series, Weekly/Monthly RSIs, and Relative-to-SPY ratios from Yahoo Finance & CoinGecko...",
    range_bar_label: "Range Position",
    priority_1_unloved_pivots: [],
    priority_2_trend_compounders: [],
    played_out_at_highs: [],
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* HEADER & CLEAN SUB-MENU TABS ("1-3 months" | "12 months" | "3+ Years") */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                  Live Multi-Horizon Outlier & Pivot Scanner
                </span>
                {data?.as_of_utc && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                    ● Synced: {data.as_of_utc}
                  </span>
                )}
                {data?.live_gold_oil_ratio && (
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
                    Gold/Oil: {data.live_gold_oil_ratio}x
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
                Outliers
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {(["1_to_3_months", "12_months", "3_plus_years"] as HorizonKey[]).map(
                (hKey) => (
                  <button
                    key={hKey}
                    id={`horizon-tab-${hKey}`}
                    onClick={() => setHorizon(hKey)}
                    className={`px-4 py-2 rounded-lg border font-semibold transition ${
                      horizon === hKey
                        ? "bg-blue-600 border-blue-400 text-white shadow-md"
                        : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {SUBMENU_TITLES[hKey]}
                  </button>
                )
              )}
              <button
                id="recalculate-live-button"
                onClick={() => fetchLiveOutliers(true)}
                disabled={loading}
                className="px-3 py-2 rounded-lg border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 transition disabled:opacity-50"
              >
                {loading ? "Scanning..." : "↻ Recalculate Live"}
              </button>
            </div>
          </div>

          <p className="text-xs md:text-sm text-slate-300">
            <strong>{SUBMENU_TITLES[horizon]} Logic:</strong> {active.subtitle}
          </p>
        </section>

        {/* BUCKET 1 — PRIORITY 1: VERIFIED UNLOVED BOTTOMING PIVOTS */}
        <section className="rounded-xl border border-emerald-500/40 bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                🥇 Priority 1 — Verified Low-Base / Pullback Pivots
              </span>
              <h2 className="text-lg font-bold text-white mt-1.5">
                Unloved Bottoming Pivots & Coiled Springs ({SUBMENU_TITLES[horizon]})
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {horizon === "1_to_3_months"
                ? "Gate: 63D/52W Range <= 48% or DD <= -10% or 14D RSI <= 46"
                : horizon === "12_months"
                ? "Gate: 2Y Range <= 52% or 14W RSI <= 48 or Near 200D SMA"
                : "Gate: 5Y Relative-to-SPY <= 52nd Pct or 14M Monthly RSI <= 52"}
            </span>
          </div>

          {active.priority_1_unloved_pivots?.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs font-mono text-slate-400">
              {loading
                ? "Computing live horizon metrics from Yahoo Finance & CoinGecko..."
                : "No tracked candidates in this horizon currently sit in a verified low-base/pullback zone (check Trend Compounders & Played-Out Highs below)."}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {active.priority_1_unloved_pivots.map((idea: any, i: number) => {
                const primaryTicker = extractFirstTicker(idea.ticker);
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-3 flex flex-col justify-between hover:border-emerald-500/50 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <Link
                            href={`/stock-xray?ticker=${encodeURIComponent(primaryTicker)}`}
                            className="text-base font-bold font-mono text-emerald-400 hover:underline"
                            title="Open in Sector-Aware Stock X-Ray"
                          >
                            ${idea.ticker}
                          </Link>{" "}
                          <span className="text-sm font-semibold text-white">
                            — {idea.name}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                          Pivot Score: {idea.pivot_score}/100
                        </span>
                      </div>
                      <div className="text-xs font-mono text-cyan-300">
                        {idea.price_and_vams}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>0% (Low)</span>
                          <span>
                            {active.range_bar_label}: {idea.range_bar_pct}%
                          </span>
                          <span>100% (High)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${Math.max(4, Math.min(100, idea.range_bar_pct))}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {idea.why_unloved_and_pivoting}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <div className="text-xs font-semibold text-emerald-300">
                        ► Actionable Direction: {idea.actionable_trade}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Invalidation / Stop: {idea.invalidation_stop}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* BUCKET 2 — PRIORITY 2: MID-RUNWAY TREND CONTINUATION COMPOUNDERS */}
        <section className="rounded-xl border border-blue-500/40 bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                🥈 Priority 2 — Trend Continuation Compounders
              </span>
              <h2 className="text-lg font-bold text-white mt-1.5">
                Mid-Runway Compounders ({SUBMENU_TITLES[horizon]})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {active.priority_2_trend_compounders?.map((idea: any, i: number) => {
              const primaryTicker = extractFirstTicker(idea.ticker);
              return (
                <div
                  key={i}
                  className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-3 flex flex-col justify-between hover:border-blue-500/50 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/stock-xray?ticker=${encodeURIComponent(primaryTicker)}`}
                          className="text-base font-bold font-mono text-blue-400 hover:underline"
                          title="Open in Sector-Aware Stock X-Ray"
                        >
                          ${idea.ticker}
                        </Link>{" "}
                        <span className="text-sm font-semibold text-white">
                          — {idea.name}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-blue-950 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold">
                        Runway Score: {idea.continuation_score}/100
                      </span>
                    </div>
                    <div className="text-xs font-mono text-amber-300">
                      {idea.price_and_vams}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>0%</span>
                        <span>
                          {active.range_bar_label}: {idea.range_bar_pct}%
                        </span>
                        <span>100%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.max(4, Math.min(100, idea.range_bar_pct))}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {idea.why_trend_has_runway}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <div className="text-xs font-semibold text-blue-300">
                      ► Actionable Direction: {idea.actionable_trade}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Invalidation / Stop: {idea.invalidation_stop}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* BUCKET 3 — PLAYED-OUT PIVOTS / EXTENDED AT HIGHS */}
        <section className="rounded-xl border border-amber-500/40 bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                🛑 Bucket 3 — Played-Out Pivots / Extended At Highs
              </span>
              <h2 className="text-lg font-bold text-white mt-1.5">
                Bullish Pivot Already Played Out ({SUBMENU_TITLES[horizon]} — Hold Trailing Stop or Wait for Pullback)
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {active.played_out_at_highs?.map((idea: any, i: number) => {
              const primaryTicker = extractFirstTicker(idea.ticker);
              return (
                <div
                  key={i}
                  className="rounded-lg border border-amber-500/30 bg-slate-900/80 p-4 space-y-2.5 flex flex-col justify-between hover:border-amber-400/50 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <Link
                          href={`/stock-xray?ticker=${encodeURIComponent(primaryTicker)}`}
                          className="text-base font-bold font-mono text-amber-400 hover:underline"
                          title="Open in Sector-Aware Stock X-Ray"
                        >
                          ${idea.ticker}
                        </Link>{" "}
                        <span className="text-sm font-semibold text-white">
                          — {idea.name}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
                        {active.range_bar_label}: {idea.range_bar_pct}%
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-300">
                      {idea.price_and_vams}
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${Math.min(100, idea.range_bar_pct)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {idea.why_played_out}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-xs font-semibold text-amber-300">
                      ► Proper Discipline: {idea.actionable_trade}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
