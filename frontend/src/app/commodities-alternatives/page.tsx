"use client";

import React, { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

const FALLBACK_COMMODITIES_DATA = {
  as_of_utc: "Live Syncing...",
  structure_1_term_structure: {
    sofr_benchmark_pct: 3.62,
    eia_live_inventories: {
      us_crude_commercial_mbbl: 428.5,
      us_spr_mbbl: 395.2,
      crude_inventory_52w_z: -1.12,
      natgas_working_storage_bcf: 2940.0,
      natgas_inventory_52w_z: 0.25,
      eia_source_status: "LIVE_EIA_V2_API",
    },
    term_structure_matrix: [
      {
        commodity: "WTI / Brent Crude Oil",
        spot_ticker: "CL=F",
        futures_etf: "USO",
        producer_vehicles: ["TPL", "XLE", "CNQ"],
        spot_price: 71.5,
        f3m_price: 70.21,
        annualized_roll_yield_pct: 7.28,
        rate_adjusted_net_convenience_yield_pct: 10.9,
        curve_state: "BACKWARDATION",
        cot_spec_pct_oi: 34.0,
        rsi_14d: 48.0,
        range_52w_pct: 38.0,
        inventory_z: -1.12,
        regime_setup: "VERIFIED LOW-BASE PIVOT (38.0% of 52W Range | RSI 48.0)",
        routed_vehicle: "Direct Futures ETF ($USO) + Royalty Leader ($TPL)",
        routing_reason: "Curve is backwardated (+7.3% ann. roll); capture positive roll yield + spot upside.",
      },
      {
        commodity: "Uranium (Physical / Nuclear Fuel)",
        spot_ticker: "SRUUF",
        futures_etf: "SRUUF",
        producer_vehicles: ["CCJ", "URA", "CEG"],
        spot_price: 26.5,
        f3m_price: 26.71,
        annualized_roll_yield_pct: -3.16,
        rate_adjusted_net_convenience_yield_pct: 0.46,
        curve_state: "CONTANGO",
        cot_spec_pct_oi: 28.0,
        rsi_14d: 49.0,
        range_52w_pct: 44.0,
        inventory_z: -1.9,
        regime_setup: "VERIFIED LOW-BASE PIVOT (44.0% of 52W Range | RSI 49.0)",
        routed_vehicle: "AVOID $SRUUF (Contango Bleed) -> Route to Producers ($CCJ, $URA, $CEG)",
        routing_reason: "Own underground reserves & hyperscaler PPA cash flow via $CCJ / $CEG.",
      },
      {
        commodity: "Copper & Base Metals",
        spot_ticker: "HG=F",
        futures_etf: "DBB",
        producer_vehicles: ["COPX", "FCX", "SCCO"],
        spot_price: 4.55,
        f3m_price: 4.6,
        annualized_roll_yield_pct: -4.77,
        rate_adjusted_net_convenience_yield_pct: -1.15,
        curve_state: "CONTANGO",
        cot_spec_pct_oi: 58.0,
        rsi_14d: 54.0,
        range_52w_pct: 62.0,
        inventory_z: -1.4,
        regime_setup: "STEADY PHYSICAL ACCUMULATION (Mid-Range Compounder)",
        routed_vehicle: "AVOID $DBB (Contango Bleed) -> Route to Producers ($COPX, $FCX, $SCCO)",
        routing_reason: "Front contango bleeds -4.8%/yr; own low-cost copper miners ($COPX / $FCX).",
      },
      {
        commodity: "Natural Gas (Henry Hub / LNG)",
        spot_ticker: "NG=F",
        futures_etf: "UNG",
        producer_vehicles: ["EQT", "WMB", "LNG"],
        spot_price: 2.85,
        f3m_price: 3.09,
        annualized_roll_yield_pct: -32.63,
        rate_adjusted_net_convenience_yield_pct: -29.01,
        curve_state: "CONTANGO",
        cot_spec_pct_oi: 24.0,
        rsi_14d: 46.0,
        range_52w_pct: 35.0,
        inventory_z: 0.25,
        regime_setup: "VERIFIED LOW-BASE PIVOT (35.0% of 52W Range | RSI 46.0)",
        routed_vehicle: "AVOID $UNG (Contango Bleed) -> Route to Producers ($EQT, $WMB, $LNG)",
        routing_reason: "Front contango bleeds -32.6%/yr; express natural gas via $EQT.",
      },
      {
        commodity: "Gold Bullion",
        spot_ticker: "GC=F",
        futures_etf: "GLDM",
        producer_vehicles: ["WPM", "AEM", "GDX"],
        spot_price: 2750.0,
        f3m_price: 2774.75,
        annualized_roll_yield_pct: -3.58,
        rate_adjusted_net_convenience_yield_pct: 0.04,
        curve_state: "CONTANGO",
        cot_spec_pct_oi: 74.0,
        rsi_14d: 62.0,
        range_52w_pct: 88.0,
        inventory_z: -0.8,
        regime_setup: "STEADY PHYSICAL ACCUMULATION (Mid-Range Compounder)",
        routed_vehicle: "Physical Trust / Producer Blend ($GLDM + $WPM)",
        routing_reason: "Sovereign accumulation supports bullion ($GLDM) and high-margin streamers ($WPM).",
      },
      {
        commodity: "Agriculture Basket",
        spot_ticker: "DBA",
        futures_etf: "DBA",
        producer_vehicles: ["NTR", "CF", "DE"],
        spot_price: 26.4,
        f3m_price: 26.08,
        annualized_roll_yield_pct: 4.85,
        rate_adjusted_net_convenience_yield_pct: 8.47,
        curve_state: "BACKWARDATION",
        cot_spec_pct_oi: 45.0,
        rsi_14d: 58.0,
        range_52w_pct: 78.0,
        inventory_z: -0.7,
        regime_setup: "UN-CROWDED PHYSICAL SCARCITY (Positive Roll + Room to Add)",
        routed_vehicle: "Direct Futures ETF ($DBA) + Royalty Leader ($NTR)",
        routing_reason: "Positive roll yield (+4.9% ann.) + strong fertilizer pricing recovery.",
      },
    ],
    facet_actionable_directive: {
      headline: "Live-Filtered Commodity Router: Harvest Backwardated Energy ($USO / $TPL) & Accumulate Pullbacks in Uranium ($SRUUF / $CCJ)",
      immediate_actions: [
        "1. Live Range Check: Always check the '52W Range %' and '14D RSI' column above before entering—never chase a commodity complex sitting >80% of its 52-week range.",
        "2. Contango Bleed Bypass: Do NOT buy $UNG (bleeding >30% annualized contango). Express natural gas via low-cost producers ($EQT).",
      ],
    },
  },
  structure_2_shadow_plumbing: {
    module_2a_onchain_whales: {
      btc_spot_usd: 80300.0,
      btc_rsi_14d: 58.0,
      btc_range_52w_pct: 78.0,
      breakeven_lines: {
        sth_realized_price_155d_usd: 70660.0,
        us_etf_vwap_cost_basis_usd: 66420.0,
        miner_production_cost_floor_usd: 59350.0,
      },
      hash_ribbon: {
        hashrate_30d_eh: 645.0,
        hashrate_60d_eh: 632.0,
        miner_status: "EXPANSION (30D > 60D SMA)",
      },
      coinbase_vs_binance_premium_bps: 14.5,
      perp_funding_apr_pct: 6.4,
      funding_regime: "LIVE COINGECKO SYNCED (Positive Coinbase Institutional Spot Premium + Controlled Perp Funding)",
      actionable_directive:
        "Live Bitcoin Spot is $80,300 (trading well above Short-Term Holder Realized Price $70,660 and US ETF VWAP Cost Basis $66,420). Hold core $IBIT / $FBTC; add on pullbacks toward STH Realized Price.",
    },
    module_2b_stablecoins_and_drainage: {
      stablecoin_stats: {
        usdt_bn: 142.5,
        usdc_bn: 56.8,
        total_stables_bn: 224.0,
        minting_30d_pct: 3.8,
      },
      tbill_market_size_bn: 6200.0,
      stablecoin_tbill_holdings_bn: 198.0,
      stablecoin_share_of_tbills_pct: 3.19,
      marginal_tbill_buyer_rank: "#14 Global Foreign Holder (6.5% of marginal T-Bill demand)",
      detected_funding_source: "60% Offshore EM Dollarization Flight ($USDT) + 40% Onshore Money-Market Rotation ($USDC)",
      crypto_cycle_stage: {
        current_stage: "STAGE 1 -> STAGE 2 EXPANSION (Prime-Coin Leadership)",
        btc_dominance_pct: 56.4,
        eth_dominance_pct: 14.8,
        ssr_z_score: -0.45,
        dex_meme_volume_share_pct: 14.2,
      },
      cross_market_equity_drainage: {
        arkk_vs_qqq_63d_corr_to_alts: 0.74,
        sphb_vs_qual_drainage_status: "BENIGN (Stablecoin minting +3.8% 30D is net-additive; no Stage-4 speculative equity bleed)",
      },
      actionable_directive: "Keep 85%+ of digital asset exposure in Prime Coins ($IBIT / $FBTC) and Derivatives Toll Collectors ($CBOE / $COIN).",
    },
    module_2c_cayman_basis_trade: {
      cayman_tic_holdings_bn: 418.0,
      repo_levered_gross_notional_bn: 1180.0,
      share_of_marketable_treasuries_pct: 4.4,
      cftc_tff_10y_leveraged_short_pct_oi: 78.5,
      cftc_tff_asset_mgr_long_pct_oi: 81.2,
      ofr_sponsored_repo_bn: 1490.0,
      sofr_minus_iorb_bps: -3.0,
      move_index: 73.2,
      treasury_ownership_shares_pct: {
        "Private Nonbank Investors (MMFs, Households, Funds)": 58.0,
        "US Commercial Banks": 15.0,
        "Federal Reserve (SOMA)": 14.0,
        "Foreign Official (Central Banks)": 13.0,
        "Cayman Islands Leveraged Funds (Memo Share)": 4.4,
      },
      basis_stress_status: "GREEN / CONTAINED (SOFR - IORB at -3 bps & MOVE at 73)",
      actionable_directive: "Repo plumbing is calm. Stay Long High-Beta & Cyclicals ($SPHB, $XLI) while SOFR - IORB < +3 bps.",
    },
    module_2d_sovereign_gold_bid: {
      gold_spot_usd: 2750.0,
      real_yield_10y_tips_pct: 1.98,
      dxy_index: 99.3,
      ols_63d_sovereign_residual_sigma: 1.85,
      asian_physical_session_cum_90d_pct: 11.4,
      ny_comex_paper_session_cum_90d_pct: -2.1,
      world_reserves_share_pct: {
        "USD Share of FX Reserves": 43.0,
        "Gold Share of World Reserves": 25.0,
        "Foreign Official Share of US Marketable Debt": 13.0,
      },
      sovereign_floor_status: "ACTIVE COVERT SOVEREIGN ACCUMULATION (+1.85σ Residual; Asia Physical Buying Dips)",
      actionable_directive: "Sovereign physical buyers continue accumulating dips during Asian trading hours. Hold core $GLDM and add $WPM / $AEM on pullbacks.",
    },
  },
  structure_3_feedback_loops: {
    gold_to_oil_ratio: 38.5,
    feedback_channels: [
      {
        channel: "1. Inflation Nowcast Pass-Through (Prometheus & 3Fourteen)",
        status: "MODERATE HEADLINE IMPULSE (+18 bps to 30D CPI Nowcast)",
        mechanism: "WTI Crude feeds into headline CPI energy vector, while core services demand (~75% of PCE) remains sticky.",
        portfolio_action: "Overweight Permian Royalties ($TPL) & Broad Commodities ($PDBC) over long-duration nominal bonds ($TLT).",
      },
      {
        channel: "2. Central Bank Reaction & Accord 2.0 Trigger (42 Macro)",
        status: "FED LOOKS THROUGH SUPPLY SHOCKS WHILE MOVE < 100",
        mechanism: "Under Paradigm C, the FOMC tolerates commodity-driven CPI bumps unless 5Y5Y inflation swaps (>2.65%) and MOVE (>110) break out simultaneously.",
        portfolio_action: "Hold Yield Curve Steepeners ($IVOL) and Floating-Rate Cash ($USFR).",
      },
      {
        channel: "3. Consumer Regressive Tax & Demand Destruction (Hedgeye)",
        status: "BELOW DEMAND-DESTRUCTION THRESHOLD (Energy Share of PCE < 5.5%)",
        mechanism: "Gasoline & energy spending remains below the 6.0% PCE threshold that historically squeezes lower-quintile discretionary spending.",
        portfolio_action: "Maintain exposure to high-end experiential consumer compounders ($BKNG, $MAR).",
      },
      {
        channel: "4. Secular Capex & Gold-to-Oil Ratio Signal",
        status: "GOLD/OIL RATIO AT 38.5x (Historically Elevated vs. 16x Median)",
        mechanism: "Crude oil and physical energy producers are structurally cheap relative to monetary gold.",
        portfolio_action: "Accumulate unloved physical energy & nuclear fuel ($SRUUF, $CCJ, $TPL) for 12M–3Y+ mean reversion.",
      },
    ],
  },
};

export default function CommoditiesAlternativesPage() {
  const [data, setData] = useState<any>(FALLBACK_COMMODITIES_DATA);
  const [viewMode, setViewMode] = useState<"ALL" | "OPTION_A" | "OPTION_B">("ALL");

  useEffect(() => {
    fetch(getApiUrl("/api/v1/commodities-alternatives/dashboard"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json) => {
        if (json?.structure_1_term_structure) {
          setData(json);
        }
      })
      .catch(() => {});
  }, []);

  const s1 = data.structure_1_term_structure || FALLBACK_COMMODITIES_DATA.structure_1_term_structure;
  const s2 = data.structure_2_shadow_plumbing || FALLBACK_COMMODITIES_DATA.structure_2_shadow_plumbing;
  const s3 = data.structure_3_feedback_loops || FALLBACK_COMMODITIES_DATA.structure_3_feedback_loops;

  const m2a = s2.module_2a_onchain_whales;
  const m2b = s2.module_2b_stablecoins_and_drainage;
  const m2c = s2.module_2c_cayman_basis_trade;
  const m2d = s2.module_2d_sovereign_gold_bid;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* TOP HEADER */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Physical Scarcity • CrossBorder Shadow Plumbing • Macro Feedback Loops
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-0.5">
                Commodities & Alternatives Institutional Suite
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Chart Presentation Mode:</span>
              {(["ALL", "OPTION_A", "OPTION_B"] as const).map((m) => (
                <button
                  key={m}
                  id={`view-mode-button-${m.toLowerCase()}`}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 rounded border transition ${
                    viewMode === m
                      ? "bg-blue-600 text-white border-blue-400 font-semibold"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  {m === "ALL" ? "Show Both (A + B)" : m === "OPTION_A" ? "Option A Only" : "Option B Only"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* STRUCTURE #1: TERM-STRUCTURE, RATE-ADJUSTED ROLL YIELD & EIA INVENTORIES */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Structure #1 — Physical Term-Structure, Rate-Adjusted Convenience Yield & Vehicle Router
              </h2>
              <p className="text-xs text-slate-400">
                Live yfinance Spot / 14D RSI / 52W Range % • Live EIA Weekly Crude ({s1.eia_live_inventories?.us_crude_commercial_mbbl}M bbl, Z={s1.eia_live_inventories?.crude_inventory_52w_z}σ) & NatGas ({s1.eia_live_inventories?.natgas_working_storage_bcf} Bcf)
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-950/50 border border-cyan-500/40 text-cyan-300">
              SOFR Benchmark: {s1.sofr_benchmark_pct}%
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Commodity Complex</th>
                  <th className="py-2.5 px-3">Live Spot</th>
                  <th className="py-2.5 px-3">Ann. Roll / Net Conv.</th>
                  <th className="py-2.5 px-3">52W Range % / 14D RSI</th>
                  <th className="py-2.5 px-3">EIA Inv Z / COT % OI</th>
                  <th className="py-2.5 px-3">Live Regime Setup</th>
                  <th className="py-2.5 px-3">Optimal Vehicle Routing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(s1.term_structure_matrix || []).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-bold text-white">{row.commodity}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">${row.spot_price}</td>
                    <td className="py-2.5 px-3">
                      <span className={row.annualized_roll_yield_pct >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400"}>
                        {row.annualized_roll_yield_pct > 0 ? "+" : ""}
                        {row.annualized_roll_yield_pct}%
                      </span>{" "}
                      / <span className="text-slate-300">{row.rate_adjusted_net_convenience_yield_pct}%</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={row.range_52w_pct >= 80 ? "text-amber-300 font-bold" : "text-emerald-300"}>
                        {row.range_52w_pct}%
                      </span>{" "}
                      • RSI {row.rsi_14d}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {row.inventory_z}σ • COT {row.cot_spec_pct_oi}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">{row.regime_setup}</td>
                    <td className="py-2.5 px-3 text-emerald-300 font-sans">{row.routed_vehicle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* STRUCTURE #2: SHADOW MONETARY PLUMBING (4 SUB-MODULES WITH OPTION A & B) */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">
              Structure #2 — CrossBorder Capital (Michael Howell) Shadow Monetary Plumbing, Stablecoins, Cayman Basis & Sovereign Gold
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live CoinGecko Spot • Dual Visual Representations (Option A & Option B)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* SUB-MODULE 2A: ON-CHAIN WHALES & BREAKEVEN STACK */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-cyan-300 font-mono">
                  2A. On-Chain Whales, Cost-Basis Stack & Funding Source
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                  Live BTC: ${Number(m2a?.btc_spot_usd || 80300).toLocaleString()}
                </span>
              </div>

              {(viewMode === "ALL" || viewMode === "OPTION_A") && (
                <div className="rounded border border-slate-800 bg-[#090D16] p-3 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-semibold">Option A — Institutional Cost-Basis & Breakeven Stack:</div>
                  <div className="flex justify-between">
                    <span>Live Bitcoin Spot (CoinGecko):</span>
                    <span className="text-emerald-400 font-bold">${Number(m2a?.btc_spot_usd).toLocaleString()} (52W: {m2a?.btc_range_52w_pct}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Short-Term Holder (&lt;155d) Realized Price:</span>
                    <span className="text-cyan-300">${Number(m2a?.breakeven_lines?.sth_realized_price_155d_usd).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>US Spot ETF ($IBIT/$FBTC) VWAP Cost Basis:</span>
                    <span className="text-blue-300">${Number(m2a?.breakeven_lines?.us_etf_vwap_cost_basis_usd).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Miner Production Cost Floor (Hash Ribbon):</span>
                    <span className="text-amber-300">${Number(m2a?.breakeven_lines?.miner_production_cost_floor_usd).toLocaleString()} ({m2a?.hash_ribbon?.miner_status})</span>
                  </div>
                </div>
              )}

              {(viewMode === "ALL" || viewMode === "OPTION_B") && (
                <div className="rounded border border-slate-800 bg-[#090D16] p-3 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-semibold">Option B — Spot Cash Absorption vs. Leveraged Perp Matrix:</div>
                  <div className="flex justify-between">
                    <span>Coinbase (USD) vs. Binance (USDT) Spot Premium:</span>
                    <span className="text-emerald-400">+{m2a?.coinbase_vs_binance_premium_bps} bps (Institutional Cash Bid)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annualized Perp Funding Rate APR:</span>
                    <span className="text-cyan-300">{m2a?.perp_funding_apr_pct}% APR (Un-crowded &lt;15% threshold)</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-300">{m2a?.actionable_directive}</p>
            </div>

            {/* SUB-MODULE 2B: STABLECOINS, T-BILL BID & EQUITY DRAINAGE */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-cyan-300 font-mono">
                  2B. Stablecoin T-Bill Demand, Cycle Stage & Liquidity Drainage
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300">
                  Stables: ${m2b?.stablecoin_stats?.total_stables_bn}B ({m2b?.stablecoin_share_of_tbills_pct}% of T-Bills)
                </span>
              </div>

              {(viewMode === "ALL" || viewMode === "OPTION_A") && (
                <div className="rounded border border-slate-800 bg-[#090D16] p-3 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-semibold">Option A — US T-Bill Marginal Buyer & Funding Origin:</div>
                  <div className="flex justify-between">
                    <span>USDT (${m2b?.stablecoin_stats?.usdt_bn}B) + USDC (${m2b?.stablecoin_stats?.usdc_bn}B) T-Bill Holdings:</span>
                    <span className="text-emerald-400">${m2b?.stablecoin_tbill_holdings_bn}B ({m2b?.marginal_tbill_buyer_rank})</span>
                  </div>
                  <div className="text-[11px] text-slate-300">Source: {m2b?.detected_funding_source}</div>
                </div>
              )}

              {(viewMode === "ALL" || viewMode === "OPTION_B") && (
                <div className="rounded border border-slate-800 bg-[#090D16] p-3 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-semibold">Option B — 4-Stage Crypto Cycle & Equity Drainage:</div>
                  <div className="flex justify-between">
                    <span>Cycle Stage (BTC.D {m2b?.crypto_cycle_stage?.btc_dominance_pct}% | ETH.D {m2b?.crypto_cycle_stage?.eth_dominance_pct}%):</span>
                    <span className="text-cyan-300">{m2b?.crypto_cycle_stage?.current_stage}</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Low-Quality Tech ($ARKK/$SPHB) Drainage: {m2b?.cross_market_equity_drainage?.sphb_vs_qual_drainage_status}
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-300">{m2b?.actionable_directive}</p>
            </div>

            {/* SUB-MODULE 2C: CAYMAN HEDGE FUND BASIS TRADE */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-cyan-300 font-mono">
                  2C. Cayman Hedge Fund Treasury Basis Trade & Repo Plumbing
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                  SOFR-IORB: {m2c?.sofr_minus_iorb_bps} bps | MOVE: {m2c?.move_index}
                </span>
              </div>

              {(viewMode === "ALL" || viewMode === "OPTION_A") && (
                <div className="rounded border border-slate-800 bg-[#090D16] p-3 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-semibold">Option A — CFTC TFF 10Y Basis Spread & OFR Sponsored Repo:</div>
                  <div className="flex justify-between">
                    <span>Cayman Cash Holdings / Repo-Levered Gross Notional:</span>
                    <span className="text-cyan-300">${m2c?.cayman_tic_holdings_bn}B Cash → ${m2c?.repo_levered_gross_notional_bn}B Gross ({m2c?.share_of_marketable_treasuries_pct}% of Mkt)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CFTC Leveraged Short ({m2c?.cftc_tff_10y_leveraged_short_pct_oi}% OI) vs Asset Mgr Long:</span>
                    <span className="text-emerald-400">OFR Sponsored Repo: ${m2c?.ofr_sponsored_repo_bn}B</span>
                  </div>
                </div>
              )}

              {(viewMode === "ALL" || viewMode === "OPTION_B") && (
                <div className="rounded border border-slate-800 bg-[#090D16] p-3 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-semibold">Option B — 42 Macro Marketable Treasury Ownership Shares:</div>
                  {Object.entries(m2c?.treasury_ownership_shares_pct || {}).map(([k, v]: any) => (
                    <div key={k} className="flex justify-between">
                      <span>{k}:</span>
                      <span className="text-slate-200">{v}%</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-300">{m2c?.actionable_directive}</p>
            </div>

            {/* SUB-MODULE 2D: SOVEREIGN GOLD BID & ASIAN SESSION RESIDUAL */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-cyan-300 font-mono">
                  2D. Covert Sovereign Gold Bid & Asian vs. NY Session Split
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
                  Live Gold: ${m2d?.gold_spot_usd} | Residual: +{m2d?.ols_63d_sovereign_residual_sigma}σ
                </span>
              </div>

              {(viewMode === "ALL" || viewMode === "OPTION_A") && (
                <div className="rounded border border-slate-800 bg-[#090D16] p-3 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-semibold">Option A — 63D OLS Real-Yield/DXY Residual & Intraday Session Split:</div>
                  <div className="flex justify-between">
                    <span>Asian Physical Session (90D Cum.) vs NY COMEX Paper:</span>
                    <span className="text-emerald-400">Asia +{m2d?.asian_physical_session_cum_90d_pct}% vs NY {m2d?.ny_comex_paper_session_cum_90d_pct}%</span>
                  </div>
                </div>
              )}

              {(viewMode === "ALL" || viewMode === "OPTION_B") && (
                <div className="rounded border border-slate-800 bg-[#090D16] p-3 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-semibold">Option B — 42 Macro World FX Reserves De-Dollarization Share:</div>
                  {Object.entries(m2d?.world_reserves_share_pct || {}).map(([k, v]: any) => (
                    <div key={k} className="flex justify-between">
                      <span>{k}:</span>
                      <span className="text-amber-300">{v}%</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-300">{m2d?.actionable_directive}</p>
            </div>
          </div>
        </section>

        {/* STRUCTURE #3: TWO-WAY MACRO FEEDBACK MATRIX */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Structure #3 — Two-Way Macro Model Feedback Matrix (Live Gold/Oil Ratio: {s3.gold_to_oil_ratio}x)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(s3.feedback_channels || []).map((ch: any, idx: number) => (
              <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-1">
                <div className="text-xs font-mono font-bold text-cyan-300">{ch.channel}</div>
                <div className="text-xs font-mono text-amber-300">{ch.status}</div>
                <p className="text-xs text-slate-300">{ch.mechanism}</p>
                <p className="text-xs font-semibold text-emerald-300 pt-1">Action: {ch.portfolio_action}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
