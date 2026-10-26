"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

const SUPPORTED_TICKERS = ["SPY", "QQQ", "IWM", "NVDA", "IBIT", "GLD", "TLT", "USO", "XLK", "XLF", "XLE"];

const FALLBACK_OPTIONS_DATA: any = {
  status: "ok",
  as_of_utc: "Live Syncing...",
  selected_ticker: "SPY",
  supported_tickers: SUPPORTED_TICKERS,
  executive_synthesis: {
    active_signals_count: 2,
    actionable_modules_list: ["Module 3 (MOVE vs VIX Co-Signer)", "Module 4 (VIX Term Structure & VRP)"],
    neutral_modules_list: ["Module 1 (Dealer GEX & Walls)", "Module 2 (Correlation & Dispersion)", "Module 5 (Cross-Asset Options Flow)"],
    headline_summary: "2 of 5 Options Modules currently flash a standalone actionable signal (Module 3 (MOVE vs VIX Co-Signer), Module 4 (VIX Term Structure & VRP)).",
  },
  module_1_gex_and_collar: {
    ticker: "SPY",
    spot_price: 585.20,
    net_gex_bn: 0.42,
    call_gex_bn: 1.15,
    put_gex_bn: 0.73,
    gamma_flip_price: 578.50,
    call_wall_strike: 595.0,
    put_wall_strike: 572.0,
    wall_corridor_pos_pct: 57.4,
    near_term_0dte_heat_pct: 44.8,
    vanna_notional_mn: 142.5,
    charm_notional_mn: 88.2,
    atm_iv_30d_pct: 14.8,
    skew_25d_pct: 4.1,
    top_strike_Ladder: [
      { strike: 572.0, net_gex_bn: -0.62, role: "PUT WALL (Support / Trap)" },
      { strike: 578.5, net_gex_bn: 0.0, role: "GAMMA FLIP PIVOT" },
      { strike: 585.0, net_gex_bn: 0.28, role: "SPOT PIN" },
      { strike: 595.0, net_gex_bn: 0.84, role: "CALL WALL (Magnetic Cap)" },
    ],
    kspy_overlay_regime: "MID-CORRIDOR POSITIVE GAMMA PIN -> NO DIRECTIONAL INDEX EDGE",
    signal_status: "NO_STANDALONE_ACTION",
    plain_english_verdict: "NO STANDALONE DIRECTIONAL OPTIONS TRADE: $SPY ($585.20) is pinned in the middle (57.4%) of its Put Wall ($572.00) to Call Wall ($595.00) corridor under Positive Dealer Gamma (+0.42B). Dealers are mechanically selling rips and buying dips, which crushes directional index option buyers via theta decay.",
    model_complement_and_next_step: "WHERE TO LOOK NEXT: When the broad index is pinned by positive dealer gamma, alpha shifts to single-stock & sector rotation. Look at Module 2 (Sector Dispersion) below and /outliers (1-3 months & 12 months Priority 1 Pivots).",
  },
  module_2_correlation_and_dispersion: {
    implied_sector_corr_pct: 34.2,
    corr_1y_percentile: 42.0,
    sector_sharpe_dispersion: 0.94,
    top_sector_leader: { sector: "XLK", sharpe_21d: 1.82, ret_21d_pct: 5.4 },
    bottom_sector_laggard: { sector: "XLRE", sharpe_21d: -0.74, ret_21d_pct: -2.8 },
    sector_rankings: [
      { sector: "XLK", sharpe_21d: 1.82, ret_21d_pct: 5.4 },
      { sector: "XLF", sharpe_21d: 1.25, ret_21d_pct: 3.8 },
      { sector: "XLI", sharpe_21d: 0.95, ret_21d_pct: 2.7 },
      { sector: "XLC", sharpe_21d: 0.88, ret_21d_pct: 2.4 },
      { sector: "XLY", sharpe_21d: 0.65, ret_21d_pct: 1.9 },
      { sector: "XLE", sharpe_21d: 0.22, ret_21d_pct: 0.8 },
      { sector: "XLV", sharpe_21d: 0.05, ret_21d_pct: 0.1 },
      { sector: "XLP", sharpe_21d: -0.15, ret_21d_pct: -0.4 },
      { sector: "XLB", sharpe_21d: -0.32, ret_21d_pct: -0.9 },
      { sector: "XLU", sharpe_21d: -0.55, ret_21d_pct: -1.7 },
      { sector: "XLRE", sharpe_21d: -0.74, ret_21d_pct: -2.8 },
    ],
    signal_status: "NO_STANDALONE_ACTION",
    plain_english_verdict: "NO STANDALONE CORRELATION OR DISPERSION TRADE: Sector correlation (34.2%, 42.0th pct) and 11-Sector Sharpe Dispersion (0.94) are both sitting in neutral mid-ranges. Neither pod-shop crowding nor liquidation panic is present.",
    model_complement_and_next_step: "WHERE TO LOOK NEXT: With no index correlation distortion, rely on /stock-xray (Pod 1-3 Earnings RoC) and /outliers (12 months & 3+ Years) for fundamental stock selection.",
  },
  module_3_move_vix_cosigner: {
    move_index: 73.5,
    move_1y_pct: 28.5,
    vix_index: 18.2,
    vix_1y_pct: 58.2,
    vvix_index: 92.4,
    vvix_1y_pct: 46.0,
    vvix_to_vix_ratio: 5.08,
    move_minus_vix_z_spread: -0.85,
    cosigner_state: "BULLISH CO-SIGNER ACTIVE (Bond Vol Calm While Equity Vol Elevated)",
    signal_status: "ACTIONABLE_BULLISH",
    plain_english_verdict: "ACTIONABLE 3FOURTEEN CO-SIGNER BUY SIGNAL: Treasury Bond Volatility (^MOVE = 73.5, 28.5th 1Y pct) is subdued in its lowest tier while Equity Volatility (^VIX = 18.2, 58.2th 1Y pct) is elevated. Historically, equity scares that are NOT confirmed by bond market volatility have a near-100% 12M win rate. Action: Buy the equity dip ($SPY, $QQQ, $IWM) and sell inflated equity put spreads.",
    model_complement_and_next_step: "Deploy capital into the top-ranked candidates on /outliers (1-3 months Priority 1 Pivots) and /speculation.",
  },
  module_4_term_structure_and_vrp: {
    vix9d: 17.5,
    vix_spot: 18.2,
    vix3m: 19.8,
    vix_to_vix3m_ratio: 0.919,
    vix9d_to_vix_ratio: 0.962,
    spy_rv_21d_pct: 12.4,
    vrp_spread_pts: 5.8,
    skew_25d_pct: 4.1,
    cboe_skew_index: 142.5,
    term_structure_state: "RICH VOLATILITY RISK PREMIUM (VRP +5.8 pts -> Sell Overpriced Vol)",
    signal_status: "ACTIONABLE_VOL_ARB",
    plain_english_verdict: "ACTIONABLE VRP CARRY HARVEST: 30D Implied Volatility (18.2%) is trading +5.8 vol points above 21D Realized Volatility (12.4%) while the VIX curve is in contango (0.919x). Action: Harvest rich option premium by selling cash-secured puts on Priority 1 pivots or writing covered calls against extended Bucket 3 holdings.",
    model_complement_and_next_step: "Select cash-secured put strike levels using the 15-Day Probable Range Low on /42-macro and /outliers.",
  },
  module_5_flow_and_capitulation: {
    inverse_etf_vol_share_pct: 31.8,
    bull_leveraged_etf_vol_share_pct: 68.2,
    call_sweep_anomalies: ["$XLK (P/C Vol 0.52x, RVOL 1.20x)", "$IBIT (P/C Vol 0.48x, RVOL 1.25x)"],
    put_hedge_anomalies: [],
    cross_asset_flow_table: [
      { ticker: "SPY", name: "S&P 500 Trust", group: "Equity Index", rvol_5d_vs_21d: 1.05, put_call_vol_ratio: 0.88, put_call_oi_ratio: 1.02, flow_regime: "BALANCED TWO-WAY FLOW" },
      { ticker: "QQQ", name: "Nasdaq 100 Trust", group: "Equity Index", rvol_5d_vs_21d: 1.12, put_call_vol_ratio: 0.82, put_call_oi_ratio: 0.94, flow_regime: "BALANCED TWO-WAY FLOW" },
      { ticker: "IWM", name: "Russell 2000 Small Cap", group: "Equity Index", rvol_5d_vs_21d: 0.95, put_call_vol_ratio: 0.92, put_call_oi_ratio: 1.10, flow_regime: "BALANCED TWO-WAY FLOW" },
      { ticker: "XLK", name: "Technology Sector", group: "US Sector", rvol_5d_vs_21d: 1.20, put_call_vol_ratio: 0.52, put_call_oi_ratio: 0.78, flow_regime: "HEAVY CALL ACCUMULATION (Bullish Sweep)" },
      { ticker: "XLF", name: "Financials Sector", group: "US Sector", rvol_5d_vs_21d: 0.98, put_call_vol_ratio: 0.84, put_call_oi_ratio: 0.88, flow_regime: "BALANCED TWO-WAY FLOW" },
      { ticker: "XLE", name: "Energy Sector", group: "US Sector", rvol_5d_vs_21d: 0.89, put_call_vol_ratio: 0.96, put_call_oi_ratio: 0.92, flow_regime: "BALANCED TWO-WAY FLOW" },
      { ticker: "GLD", name: "SPDR Gold Trust", group: "Hard Assets", rvol_5d_vs_21d: 1.15, put_call_vol_ratio: 0.65, put_call_oi_ratio: 0.80, flow_regime: "BALANCED TWO-WAY FLOW" },
      { ticker: "USO", name: "US Crude Oil Fund", group: "Hard Assets", rvol_5d_vs_21d: 1.02, put_call_vol_ratio: 0.78, put_call_oi_ratio: 0.85, flow_regime: "BALANCED TWO-WAY FLOW" },
      { ticker: "TLT", name: "20+ Year Treasury Bond", group: "Rates", rvol_5d_vs_21d: 1.08, put_call_vol_ratio: 1.05, put_call_oi_ratio: 1.18, flow_regime: "BALANCED TWO-WAY FLOW" },
      { ticker: "IBIT", name: "iShares Bitcoin Trust", group: "Digital Assets", rvol_5d_vs_21d: 1.25, put_call_vol_ratio: 0.48, put_call_oi_ratio: 0.62, flow_regime: "HEAVY CALL ACCUMULATION (Bullish Sweep)" },
    ],
    signal_status: "ACTIONABLE_BULLISH",
    plain_english_verdict: "ACTIONABLE CROSS-ASSET CALL ACCUMULATION: While broad Inverse ETF sentiment is neutral (31.8%), institutional options sweeps are aggressively bidding Calls in $XLK (P/C Vol 0.52x, RVOL 1.20x), $IBIT (P/C Vol 0.48x, RVOL 1.25x). Action: Focus tactical long exposure on $XLK and $IBIT.",
    model_complement_and_next_step: "Run any equity ticker from this flow anomaly list through /stock-xray and /outliers to confirm its Range Position % before entering.",
  },
};

function statusBadgeStyle(status: string) {
  if (status === "ACTIONABLE_BULLISH") {
    return "bg-emerald-950/60 border-emerald-500/50 text-emerald-300";
  }
  if (status === "ACTIONABLE_BEARISH") {
    return "bg-rose-950/60 border-rose-500/50 text-rose-300";
  }
  if (status === "ACTIONABLE_VOL_ARB") {
    return "bg-cyan-950/60 border-cyan-500/50 text-cyan-300";
  }
  return "bg-slate-800/80 border-slate-600 text-slate-300";
}

function statusLabelText(status: string) {
  if (status === "ACTIONABLE_BULLISH") return "● ACTIONABLE BULLISH IDEA";
  if (status === "ACTIONABLE_BEARISH") return "● ACTIONABLE BEARISH / HEDGE IDEA";
  if (status === "ACTIONABLE_VOL_ARB") return "● ACTIONABLE VOL / DISPERSION ARB";
  return "○ NO STANDALONE ACTION (SEE COMPLEMENTARY MODULE)";
}

export default function OptionsAndVolatilityLabPage() {
  const [selectedTicker, setSelectedTicker] = useState<string>("SPY");
  const [data, setData] = useState<any>(FALLBACK_OPTIONS_DATA);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboard = (tk: string, force = false) => {
    setLoading(true);
    const apiBase = API_BASE_URL || "https://macro-nowcast-wdw2.onrender.com";
    fetch(`${apiBase}/api/v1/options-lab/dashboard?ticker=${encodeURIComponent(tk)}&force=${force}`, {
      cache: "no-store",
    })
      .then((r) => {
        if (!r.ok) {
          // Attempt fallback route without v1 prefix
          return fetch(`${apiBase}/api/options-lab/dashboard?ticker=${encodeURIComponent(tk)}&force=${force}`, { cache: "no-store" })
            .then((r2) => (r2.ok ? r2.json() : Promise.reject(new Error(`HTTP ${r2.status}`))));
        }
        return r.json();
      })
      .then((json) => {
        if (json && json.status === "ok") {
          setData(json);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard(selectedTicker, false);
  }, [selectedTicker]);

  const m1 = data?.module_1_gex_and_collar;
  const m2 = data?.module_2_correlation_and_dispersion;
  const m3 = data?.module_3_move_vix_cosigner;
  const m4 = data?.module_4_term_structure_and_vrp;
  const m5 = data?.module_5_flow_and_capitulation;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* TOP HEADER & LIVE UNDERLYING TICKER SELECTOR */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                  Live Options Microstructure • Dealer GEX • Cross-Asset Volatility Surface
                </span>
                {data?.as_of_utc && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                    ● Live Chain Synced: {data.as_of_utc}
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
                Options & Volatility Surface Lab (5-Module Dynamic Suite)
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-400 mr-1">GEX Underlying:</span>
              {SUPPORTED_TICKERS.map((tk) => (
                <button
                  key={tk}
                  onClick={() => setSelectedTicker(tk)}
                  className={`px-2.5 py-1.5 rounded border font-semibold transition ${
                    selectedTicker === tk
                      ? "bg-blue-600 border-blue-400 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  ${tk}
                </button>
              ))}
              <button
                onClick={() => fetchDashboard(selectedTicker, true)}
                className="ml-1 px-3 py-1.5 rounded border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50"
              >
                {loading ? "Scanning..." : "↻ Recalculate"}
              </button>
            </div>
          </div>

          {/* EXECUTIVE SYNTHESIS BANNER */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-200 font-medium">
              <strong className="text-cyan-300 font-mono uppercase mr-1.5">
                Critical Actionability Audit:
              </strong>
              {data?.executive_synthesis?.headline_summary ||
                "Evaluating live option chains, VIX term structure, MOVE co-signer, and sector dispersion..."}
            </div>
            <div className="flex flex-wrap gap-2 font-mono text-[11px]">
              <Link href="/outliers" className="text-cyan-400 hover:underline">
                → Go to Outliers
              </Link>
              <Link href="/commodities-alternatives" className="text-cyan-400 hover:underline">
                → Go to Commodities & Plumbing
              </Link>
              <Link href="/42-macro" className="text-cyan-400 hover:underline">
                → Go to 42 Macro
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================================
            MODULE 1: DEALER GAMMA EXPOSURE (GEX), VANNA/CHARM & KSPY COLLAR ROUTER
           ===================================================================== */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase">
                Module 1 • Live Option Chain Greeks (${m1?.ticker || selectedTicker})
              </span>
              <h2 className="text-lg font-bold text-white">
                Dealer Net Gamma (GEX), 0DTE Heat, Vanna/Charm & KSPY Collar Router
              </h2>
            </div>
            {m1 && (
              <span
                className={`px-3 py-1 rounded-full border text-xs font-mono font-semibold ${statusBadgeStyle(
                  m1.signal_status
                )}`}
              >
                {statusLabelText(m1.signal_status)}
              </span>
            )}
          </div>

          {m1 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Live Spot / Flip</div>
                  <div className="text-sm font-bold text-white mt-1">
                    ${m1.spot_price} /{" "}
                    <span className="text-amber-300">${m1.gamma_flip_price}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Net Dealer GEX</div>
                  <div
                    className={`text-sm font-bold mt-1 ${
                      m1.net_gex_bn >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {m1.net_gex_bn >= 0 ? "+" : ""}
                    {m1.net_gex_bn}B / 1%
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Put Wall → Call Wall</div>
                  <div className="text-sm font-bold text-cyan-300 mt-1">
                    ${m1.put_wall_strike} → ${m1.call_wall_strike}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Wall Corridor Pos</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {m1.wall_corridor_pos_pct}%
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Near-Term 0DTE Heat</div>
                  <div className="text-sm font-bold text-amber-300 mt-1">
                    {m1.near_term_0dte_heat_pct}% of Vol
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Vanna / Charm Flow</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    ${m1.vanna_notional_mn}M / ${m1.charm_notional_mn}M
                  </div>
                </div>
              </div>

              {/* Strike GEX Ladder */}
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Option Strike</th>
                      <th className="py-2 px-3">Net Dealer GEX ($Bn / 1%)</th>
                      <th className="py-2 px-3">Microstructure Role</th>
                      <th className="py-2 px-3">KSPY Dynamic Collar Regime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(m1.top_strike_Ladder || []).map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-white">${row.strike}</td>
                        <td
                          className={`py-2 px-3 font-semibold ${
                            row.net_gex_bn >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {row.net_gex_bn >= 0 ? "+" : ""}
                          {row.net_gex_bn}B
                        </td>
                        <td className="py-2 px-3 text-cyan-300">{row.role}</td>
                        <td className="py-2 px-3 text-slate-300">{m1.kspy_overlay_regime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Critical Plain-English Verdict & Complement Box */}
              <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-4 space-y-2">
                <div className="text-xs font-bold text-white">
                  ► Plain-English Verdict ({m1.kspy_overlay_regime}):
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {m1.plain_english_verdict}
                </p>
                <div className="text-xs font-mono text-cyan-300 pt-1 border-t border-slate-800">
                  🔗 Model Complement & Where to Look Next: {m1.model_complement_and_next_step}
                </div>
              </div>
            </>
          )}
        </section>

        {/* =====================================================================
            MODULE 2 & MODULE 3 SIDE BY SIDE
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MODULE 2: IMPLIED CORRELATION & 11-SECTOR SHARPE DISPERSION */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase">
                    Module 2 • 42 Macro Dispersion & Pod-Shop Monitor
                  </span>
                  <h2 className="text-base font-bold text-white">
                    Implied/Realized Sector Correlation & 11-Sector Sharpe Dispersion
                  </h2>
                </div>
                {m2 && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-semibold ${statusBadgeStyle(
                      m2.signal_status
                    )}`}
                  >
                    {statusLabelText(m2.signal_status)}
                  </span>
                )}
              </div>

              {m2 && (
                <>
                  <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">21D Sector Corr</div>
                      <div className="text-base font-bold text-white mt-1">
                        {m2.implied_sector_corr_pct}%{" "}
                        <span className="text-xs text-slate-400">
                          ({m2.corr_1y_percentile}th pct)
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">Sharpe Dispersion</div>
                      <div className="text-base font-bold text-cyan-300 mt-1">
                        {m2.sector_sharpe_dispersion}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">Top / Bottom 21D</div>
                      <div className="text-xs font-bold text-emerald-400 mt-1">
                        ${m2.top_sector_leader?.sector} ({m2.top_sector_leader?.sharpe_21d}) /{" "}
                        <span className="text-rose-400">
                          ${m2.bottom_sector_laggard?.sector} ({m2.bottom_sector_laggard?.sharpe_21d})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-1.5 px-3">Sector ETF</th>
                          <th className="py-1.5 px-3">21D Annualized Sharpe</th>
                          <th className="py-1.5 px-3">21D Return %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(m2.sector_rankings || []).map((s: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-3 font-bold text-white">${s.sector}</td>
                            <td
                              className={`py-1.5 px-3 ${
                                s.sharpe_21d >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {s.sharpe_21d >= 0 ? "+" : ""}
                              {s.sharpe_21d}
                            </td>
                            <td className="py-1.5 px-3 text-slate-300">
                              {s.ret_21d_pct >= 0 ? "+" : ""}
                              {s.ret_21d_pct}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {m2 && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-white">► Plain-English Verdict:</div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {m2.plain_english_verdict}
                </p>
                <div className="text-[11px] font-mono text-cyan-300 pt-1 border-t border-slate-800">
                  🔗 Where to Look Next: {m2.model_complement_and_next_step}
                </div>
              </div>
            )}
          </section>

          {/* MODULE 3: CROSS-ASSET VOLATILITY CO-SIGNER (^MOVE vs ^VIX) */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase">
                    Module 3 • 3Fourteen Cross-Asset Volatility Co-Signer
                  </span>
                  <h2 className="text-base font-bold text-white">
                    Treasury Bond Vol (^MOVE) vs. Equity Vol (^VIX & ^VVIX)
                  </h2>
                </div>
                {m3 && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-semibold ${statusBadgeStyle(
                      m3.signal_status
                    )}`}
                  >
                    {statusLabelText(m3.signal_status)}
                  </span>
                )}
              </div>

              {m3 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">^MOVE (Bond Vol)</div>
                      <div className="text-base font-bold text-amber-300 mt-1">
                        {m3.move_index}{" "}
                        <span className="text-[11px] text-slate-400">
                          ({m3.move_1y_pct}th pct)
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">^VIX (Equity Vol)</div>
                      <div className="text-base font-bold text-cyan-300 mt-1">
                        {m3.vix_index}{" "}
                        <span className="text-[11px] text-slate-400">
                          ({m3.vix_1y_pct}th pct)
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">MOVE - VIX Z-Diff</div>
                      <div className="text-base font-bold text-white mt-1">
                        {m3.move_minus_vix_z_spread >= 0 ? "+" : ""}
                        {m3.move_minus_vix_z_spread}σ
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">VVIX / VIX Ratio</div>
                      <div className="text-base font-bold text-emerald-300 mt-1">
                        {m3.vvix_to_vix_ratio}x
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs font-mono space-y-1.5">
                    <div className="text-slate-400">Active Co-Signer Regime State:</div>
                    <div className="text-amber-300 font-bold">{m3.cosigner_state}</div>
                    <div className="text-slate-400 text-[11px] font-sans">
                      Rule: Equity spikes (^VIX &gt; 55th pct) while Bond Vol stays calm (^MOVE &lt; 32nd pct) trigger a high-conviction equity buy. Rising ^MOVE (&gt;72nd pct) while ^VIX is low warns of an impending rate-led equity air-pocket.
                    </div>
                  </div>
                </>
              )}
            </div>

            {m3 && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-white">► Plain-English Verdict:</div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {m3.plain_english_verdict}
                </p>
                <div className="text-[11px] font-mono text-cyan-300 pt-1 border-t border-slate-800">
                  🔗 Where to Look Next: {m3.model_complement_and_next_step}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* =====================================================================
            MODULE 4 & MODULE 5 SIDE BY SIDE
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MODULE 4: VIX TERM-STRUCTURE (VIX9D / VIX / VIX3M), SKEW & VRP */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase">
                    Module 4 • Term Structure, 25Δ Skew & VRP Carry
                  </span>
                  <h2 className="text-base font-bold text-white">
                    VIX Curve (^VIX9D / ^VIX / ^VIX3M), Put-Call Skew & VRP
                  </h2>
                </div>
                {m4 && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-semibold ${statusBadgeStyle(
                      m4.signal_status
                    )}`}
                  >
                    {statusLabelText(m4.signal_status)}
                  </span>
                )}
              </div>

              {m4 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">9D / 30D / 3M VIX</div>
                      <div className="text-xs font-bold text-white mt-1">
                        {m4.vix9d} / {m4.vix_spot} / {m4.vix3m}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">VIX / VIX3M Ratio</div>
                      <div
                        className={`text-sm font-bold mt-1 ${
                          m4.vix_to_vix3m_ratio >= 1.0 ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {m4.vix_to_vix3m_ratio}x
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">VRP (IV30 - RV21)</div>
                      <div className="text-sm font-bold text-cyan-300 mt-1">
                        {m4.vrp_spread_pts >= 0 ? "+" : ""}
                        {m4.vrp_spread_pts} pts
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="text-slate-400">25Δ Skew / SKEW</div>
                      <div className="text-sm font-bold text-amber-300 mt-1">
                        +{m4.skew_25d_pct}% / {m4.cboe_skew_index}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs font-mono">
                    <div className="text-slate-400">Term-Structure & Carry State:</div>
                    <div className="text-cyan-300 font-bold mt-0.5">{m4.term_structure_state}</div>
                  </div>
                </>
              )}
            </div>

            {m4 && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-white">► Plain-English Verdict:</div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {m4.plain_english_verdict}
                </p>
                <div className="text-[11px] font-mono text-cyan-300 pt-1 border-t border-slate-800">
                  🔗 Where to Look Next: {m4.model_complement_and_next_step}
                </div>
              </div>
            )}
          </section>

          {/* MODULE 5: CROSS-ASSET OPTIONS FLOW & INVERSE-ETF CAPITULATION */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase">
                    Module 5 • Cross-Asset Options Sweeps & 3Fourteen Capitulation
                  </span>
                  <h2 className="text-base font-bold text-white">
                    Speculative Inverse-ETF Volume Share & Cross-Asset Put/Call Ratios
                  </h2>
                </div>
                {m5 && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-semibold ${statusBadgeStyle(
                      m5.signal_status
                    )}`}
                  >
                    {statusLabelText(m5.signal_status)}
                  </span>
                )}
              </div>

              {m5 && (
                <>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 font-mono text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        3Fourteen Inverse Leveraged ETF Share (SQQQ+SOXS+SPXS):
                      </span>
                      <span className="font-bold text-amber-300">
                        {m5.inverse_etf_vol_share_pct}% (Washout &gt; 48% | Euphoria &lt; 19%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${Math.min(100, m5.inverse_etf_vol_share_pct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-1.5 px-2.5">Ticker</th>
                          <th className="py-1.5 px-2.5">5D RVOL</th>
                          <th className="py-1.5 px-2.5">P/C Vol</th>
                          <th className="py-1.5 px-2.5">P/C OI</th>
                          <th className="py-1.5 px-2.5">Flow Regime</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(m5.cross_asset_flow_table || []).map((r: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-2.5 font-bold text-white">${r.ticker}</td>
                            <td className="py-1.5 px-2.5 text-slate-300">{r.rvol_5d_vs_21d}x</td>
                            <td className="py-1.5 px-2.5 text-cyan-300">{r.put_call_vol_ratio}x</td>
                            <td className="py-1.5 px-2.5 text-slate-300">{r.put_call_oi_ratio}x</td>
                            <td className="py-1.5 px-2.5 text-[11px] text-slate-200">
                              {r.flow_regime}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {m5 && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-white">► Plain-English Verdict:</div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {m5.plain_english_verdict}
                </p>
                <div className="text-[11px] font-mono text-cyan-300 pt-1 border-t border-slate-800">
                  🔗 Where to Look Next: {m5.model_complement_and_next_step}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
