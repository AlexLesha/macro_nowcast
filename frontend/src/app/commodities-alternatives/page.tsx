"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

const FALLBACK_COMMODITIES_DATA = {
  as_of_utc: "Live Syncing...",
  macro_regime: {
    active_regime_label: "DEFLATION",
    hedgeye_quad: "QUAD_3",
    net_liquidity_usd_bn: 5745.7,
    net_liquidity_4w_roc_bn: -120.0,
    probability_risk_on_pct: 70.0,
    accord_2_0_prob: 72.0,
    synthesis_consensus: "3 of 4 Authors Cautious / Reflationary Overhang",
  },
  structure_1_term_structure: {
    sofr_benchmark_pct: 3.62,
    eia_live_inventories: {
      us_crude_commercial_mbbl: 428.5,
      us_spr_mbbl: 395.2,
      crude_inventory_52w_z: -1.12,
      natgas_working_storage_bcf: 2940.0,
      natgas_inventory_52w_z: 0.25,
      combined_oil_days_cover: 31.4,
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
        cot_crowding_status: "BALANCED",
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
        cot_crowding_status: "CAPITULATION BOTTOM",
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
        cot_crowding_status: "BALANCED",
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
        cot_crowding_status: "CAPITULATION BOTTOM",
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
        cot_crowding_status: "CROWDED SPECULATIVE LONG",
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
        cot_crowding_status: "BALANCED",
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
    copper_gold_barometer: {
      copper_gold_ratio: 1.535,
      ratio_200d_sma: 1.485,
      ratio_63d_z_score: 0.45,
      trend_state: "PRO-GROWTH EXPANSION (Yield Support)",
      us_10y_yield_pct: 4.45,
      projected_10y_yield_direction: "RISING / PRESSURING YIELDS HIGHER",
      correlation_to_yields: 0.82,
      macro_signal: "Copper/Gold at 1.535 (200D MA: 1.485 | Z=+0.45σ). Signal indicates PRO-GROWTH EXPANSION. Leads 10Y Yields by ~75 days.",
      actionable_expression: "Overweight Base Metal Miners ($COPX, $FCX) and Short Nominal Duration ($TLT) while Ratio > 200D MA.",
    },
    gold_to_oil_ratio_comps: {
      gold_oil_ratio: 38.5,
      historical_median: 16.5,
      pct_above_median: 133.3,
      is_extreme_undervaluation: true,
      signal_status: "EXTREME ENERGY UNDERVALUATION (38.5x vs. 16.5x Median — +133.3% Premium)",
      historical_comps: [
        { year: 1973, ratio_peak: 32.4, forward_3y_oil_perf_pct: "+280%", outcome: "First OPEC Oil Embargo; energy supercycle ignited." },
        { year: 1986, ratio_peak: 35.1, forward_3y_oil_perf_pct: "+115%", outcome: "Saudi market share war bottom; massive capex rebuild." },
        { year: 1998, ratio_peak: 41.2, forward_3y_oil_perf_pct: "+210%", outcome: "Asian Financial Crisis trough; commodity supercycle began." },
        { year: 2016, ratio_peak: 38.6, forward_3y_oil_perf_pct: "+135%", outcome: "US Shale bust bottom; multi-year FCF recovery." },
        { year: 2020, ratio_peak: 85.0, forward_3y_oil_perf_pct: "+320%", outcome: "COVID negative oil crash; explosive 2021-2022 energy rally." },
      ],
      actionable_trade: "Gold/Oil ratio of 38.5x sits in the top 3rd historical percentile. Historically, readings >30x mark secular bottoms for physical energy. Strategy: Accumulate Tier-1 Cash Flow Energy ($TPL, $XLE) and Nuclear Fuel ($SRUUF, $CCJ) for 12M–3Y+ mean-reversion.",
    },
    global_liquidity_betas: {
      net_liquidity_4w_roc_bn: -120.0,
      net_liquidity_4w_roc_pct: -2.09,
      asset_beta_matrix: [
        { asset: "Bitcoin ($IBIT / BTC)", beta: 3.20, role: "Exponential Shadow Liquidity Sponge", projected_30d_impulse_pct: -6.7, impulse_state: "BEARISH DRAG" },
        { asset: "Copper & Base Metals ($COPX)", beta: 1.45, role: "Global Electrification & Industrial Beta", projected_30d_impulse_pct: -3.0, impulse_state: "BEARISH DRAG" },
        { asset: "WTI Crude Oil ($CL / $XLE)", beta: 1.20, role: "Cyclical Growth & Reflation Carry", projected_30d_impulse_pct: -2.5, impulse_state: "BEARISH DRAG" },
        { asset: "Gold Bullion ($GLDM / $WPM)", beta: 1.10, role: "Sovereign Debasement Anchor", projected_30d_impulse_pct: -2.3, impulse_state: "BEARISH DRAG" },
        { asset: "Agriculture ($DBA)", beta: 0.85, role: "Inelastic Supply & Fertilizer Pass-Through", projected_30d_impulse_pct: -1.8, impulse_state: "NEUTRAL CHOP" },
      ],
      howell_summary: "With Net Liquidity 4-week rate of change at -$120.0B (-2.09%), high-beta assets (Bitcoin β=3.2x, Copper β=1.45x) face short-term liquidity drag, while sovereign debasement stores ($GLDM, $WPM) hold resilient cash floors.",
    },
    feedback_channels: [
      {
        channel: "1. Inflation Nowcast Pass-Through (Prometheus & 3Fourteen)",
        status: "MODERATE HEADLINE IMPULSE (+18 bps to 30D CPI Nowcast at $71.50 WTI)",
        mechanism: "WTI Crude feeds into headline CPI energy vector, while core services demand (~75% of PCE) remains sticky.",
        portfolio_action: "Overweight Permian Royalties ($TPL) & Broad Commodities ($PDBC) over long-duration nominal bonds ($TLT).",
      },
      {
        channel: "2. Central Bank Reaction & Accord 2.0 Trigger (42 Macro)",
        status: "REGIME: DEFLATION • FED TOLERATES SUPPLY SHOCKS WHILE MOVE < 100",
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
        status: "GOLD/OIL RATIO AT 38.5x (+133.3% vs. 16.5x Median)",
        mechanism: "Crude oil and physical energy producers are structurally cheap relative to monetary gold.",
        portfolio_action: "Accumulate unloved physical energy & nuclear fuel ($SRUUF, $CCJ, $TPL) for 12M–3Y+ mean reversion.",
      },
    ],
  },
};

export default function CommoditiesAlternativesPage() {
  const [data, setData] = useState<any>(FALLBACK_COMMODITIES_DATA);
  const [viewMode, setViewMode] = useState<"ALL" | "OPTION_A" | "OPTION_B">("ALL");
  const [complexFilter, setComplexFilter] = useState<"ALL" | "ENERGY" | "METALS" | "ALTS">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("Loading...");

  const loadData = async (force: boolean = false) => {
    if (force) setIsRefreshing(true);
    try {
      const url = getApiUrl(`/api/v1/commodities-alternatives/dashboard${force ? "?force=true" : ""}`);
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.structure_1_term_structure) {
          setData(json);
          setLastRefreshedAt(json.as_of_utc || new Date().toISOString().slice(11, 19) + " UTC");
        }
      }
    } catch (err) {
      console.error("Commodities dashboard fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);

    const handleGlobalRefresh = () => {
      loadData(false);
    };
    window.addEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
    return () => window.removeEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
  }, []);

  const s1 = data.structure_1_term_structure || FALLBACK_COMMODITIES_DATA.structure_1_term_structure;
  const s2 = data.structure_2_shadow_plumbing || FALLBACK_COMMODITIES_DATA.structure_2_shadow_plumbing;
  const s3 = data.structure_3_feedback_loops || FALLBACK_COMMODITIES_DATA.structure_3_feedback_loops;
  const regime = data.macro_regime || FALLBACK_COMMODITIES_DATA.macro_regime;

  const m2a = s2.module_2a_onchain_whales;
  const m2b = s2.module_2b_stablecoins_and_drainage;
  const m2c = s2.module_2c_cayman_basis_trade;
  const m2d = s2.module_2d_sovereign_gold_bid;

  const cuAu = s3.copper_gold_barometer || FALLBACK_COMMODITIES_DATA.structure_3_feedback_loops.copper_gold_barometer;
  const auOil = s3.gold_to_oil_ratio_comps || FALLBACK_COMMODITIES_DATA.structure_3_feedback_loops.gold_to_oil_ratio_comps;
  const liqBetas = s3.global_liquidity_betas || FALLBACK_COMMODITIES_DATA.structure_3_feedback_loops.global_liquidity_betas;

  // Filter complexes
  const filteredComplexes = (s1.term_structure_matrix || []).filter((row: any) => {
    if (complexFilter === "ALL") return true;
    if (complexFilter === "ENERGY") return row.commodity.includes("Crude") || row.commodity.includes("Natural Gas");
    if (complexFilter === "METALS") return row.commodity.includes("Copper") || row.commodity.includes("Gold");
    if (complexFilter === "ALTS") return row.commodity.includes("Uranium") || row.commodity.includes("Agriculture");
    return true;
  });

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 space-y-5">
        
        {/* 1. PROJECT-GLOBAL MACRO REGIME ALIGNMENT STRIP */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 shadow-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-xs font-bold">
                CANONICAL REGIME: {regime?.active_regime_label} • {regime?.hedgeye_quad}
              </span>
              <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
                Risk-On Prob: <strong className="text-emerald-400">{regime?.probability_risk_on_pct}%</strong>
              </span>
              <span className="hidden md:inline-block text-xs font-mono text-slate-400">
                US Net Liq: <strong className="text-cyan-300">${regime?.net_liquidity_usd_bn}B</strong> ({regime?.net_liquidity_4w_roc_bn > 0 ? "+" : ""}{regime?.net_liquidity_4w_roc_bn}B 4W)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">
                {data._cache_hit ? "⚡ Fast DB Cache (<15ms)" : "Live Synced"} • {lastRefreshedAt}
              </span>
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="px-3 py-1 rounded bg-cyan-600/30 border border-cyan-400/50 text-cyan-200 text-xs font-mono font-semibold hover:bg-cyan-600/50 transition disabled:opacity-50"
              >
                {isRefreshing ? "Syncing..." : "Sync Live Data"}
              </button>
            </div>
          </div>

          {/* Project Cross-Navigation Hub */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500">Cross-Module Bridges:</span>
              <Link href="/liquidity-allocation" className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-slate-700 transition">
                💧 Liquidity Allocation
              </Link>
              <Link href="/42-macro" className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-slate-700 transition">
                🌐 42 Macro 15-GRID
              </Link>
              <Link href="/synthesis" className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-slate-700 transition">
                ⚖️ Framework Synthesis
              </Link>
              <Link href="/trade-ideas" className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-slate-700 transition">
                🎯 Trade Ideas
              </Link>
            </div>
            <div className="text-slate-400 text-xs">
              Synthesis Consensus: <span className="text-amber-300 font-semibold">{regime?.synthesis_consensus}</span>
            </div>
          </div>
        </div>

        {/* 2. TOP HEADER & PRESENTATION CONTROLS */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Physical Scarcity • CrossBorder Shadow Plumbing • Macro Feedback Loops
              </span>
              <h1 className="text-base font-bold text-white mt-0.5">
                Commodities & Alternatives Institutional Suite
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Presentation Mode:</span>
              {(["ALL", "OPTION_A", "OPTION_B"] as const).map((m) => (
                <button
                  key={m}
                  id={`view-mode-button-${m.toLowerCase()}`}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1 rounded border transition ${
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

        {/* 3. STRUCTURE #1: PHYSICAL TERM-STRUCTURE & EIA INVENTORIES */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Structure #1 — Physical Term-Structure, Rate-Adjusted Convenience Yield & Vehicle Router
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kaldor-Working Storage Theory • Real-Time Futures Roll Yield vs. Cash Carry (SOFR {s1.sofr_benchmark_pct}%)
              </p>
            </div>
            
            {/* Sector Filter Tabs */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              {(["ALL", "ENERGY", "METALS", "ALTS"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setComplexFilter(f)}
                  className={`px-2.5 py-1 rounded border transition ${
                    complexFilter === f
                      ? "bg-cyan-600/30 border-cyan-400 text-cyan-200 font-semibold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f === "ALL" ? "All Complexes" : f === "ENERGY" ? "Energy" : f === "METALS" ? "Metals" : "Uranium & Ag"}
                </button>
              ))}
            </div>
          </div>

          {/* EIA Physical Depletion Cover Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs font-mono">
            <div>
              <span className="text-slate-400 block">Commercial Crude:</span>
              <span className="text-white font-bold">{s1.eia_live_inventories?.us_crude_commercial_mbbl}M bbl</span>
              <span className="text-amber-400 block text-xs">Z = {s1.eia_live_inventories?.crude_inventory_52w_z}σ (Tight)</span>
            </div>
            <div>
              <span className="text-slate-400 block">Strategic Reserve (SPR):</span>
              <span className="text-white font-bold">{s1.eia_live_inventories?.us_spr_mbbl}M bbl</span>
              <span className="text-rose-400 block text-xs">38% Below 2020 Peak</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Oil Cover:</span>
              <span className="text-cyan-300 font-bold">{s1.eia_live_inventories?.combined_oil_days_cover || 31.4} Days</span>
              <span className="text-slate-400 block text-xs">Historic Avg: 55 Days</span>
            </div>
            <div>
              <span className="text-slate-400 block">NatGas Storage:</span>
              <span className="text-white font-bold">{s1.eia_live_inventories?.natgas_working_storage_bcf} Bcf</span>
              <span className="text-emerald-400 block text-xs">Z = +{s1.eia_live_inventories?.natgas_inventory_52w_z}σ (Normal)</span>
            </div>
          </div>

          {/* Main Term Structure Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Commodity Complex</th>
                  <th className="py-2.5 px-3">Live Spot</th>
                  <th className="py-2.5 px-3">Ann. Roll / Net Conv.</th>
                  <th className="py-2.5 px-3">52W Range % / 14D RSI</th>
                  <th className="py-2.5 px-3">COT Spec Net / Crowding</th>
                  <th className="py-2.5 px-3">Live Regime Setup</th>
                  <th className="py-2.5 px-3">Optimal Vehicle Routing & Equities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredComplexes.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-bold text-white">
                      <div>{row.commodity}</div>
                      <span className="text-slate-500 text-xs">Ticker: {row.spot_ticker}</span>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">
                      ${row.spot_price}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={row.annualized_roll_yield_pct >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                        {row.annualized_roll_yield_pct > 0 ? "+" : ""}
                        {row.annualized_roll_yield_pct}%
                      </span>{" "}
                      / <span className="text-slate-300">{row.rate_adjusted_net_convenience_yield_pct}%</span>
                      <span className={`block text-xs font-semibold ${row.curve_state === "BACKWARDATION" ? "text-emerald-400" : "text-amber-400"}`}>
                        {row.curve_state}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={row.range_52w_pct >= 80 ? "text-amber-300 font-bold" : "text-emerald-300"}>
                        {row.range_52w_pct}%
                      </span>{" "}
                      • RSI {row.rsi_14d}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <div>{row.cot_spec_pct_oi}% Net OI</div>
                      <span className={`text-xs ${row.cot_crowding_status === "CROWDED SPECULATIVE LONG" ? "text-rose-400" : row.cot_crowding_status === "CAPITULATION BOTTOM" ? "text-emerald-400 font-semibold" : "text-slate-400"}`}>
                        {row.cot_crowding_status || "BALANCED"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">{row.regime_setup}</td>
                    <td className="py-2.5 px-3 text-emerald-300 font-sans">
                      <div>{row.routed_vehicle}</div>
                      {row.producer_vehicles && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-slate-500 font-mono text-xs">Analyze:</span>
                          {row.producer_vehicles.map((v: string) => (
                            <Link
                              key={v}
                              href={`/stock-analysis?ticker=${v}`}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs hover:bg-cyan-600 hover:text-white transition"
                              title={`Analyze ${v} in Single-Stock Analyzer`}
                            >
                              ${v}
                            </Link>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. STRUCTURE #2: SHADOW MONETARY PLUMBING (MICHAEL HOWELL / CROSSBORDER CAPITAL) */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white">
              Structure #2 — CrossBorder Capital (Michael Howell) Shadow Monetary Plumbing, Stablecoins, Cayman Basis & Sovereign Gold
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live CoinGecko Spot • On-Chain Cost-Basis • T-Bill Absorption • Treasury Repo Plumbing
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
                  <div className="text-xs text-slate-300">Source: {m2b?.detected_funding_source}</div>
                </div>
              )}

              {(viewMode === "ALL" || viewMode === "OPTION_B") && (
                <div className="rounded border border-slate-800 bg-[#090D16] p-3 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-semibold">Option B — 4-Stage Crypto Cycle & Equity Drainage:</div>
                  <div className="flex justify-between">
                    <span>Cycle Stage (BTC.D {m2b?.crypto_cycle_stage?.btc_dominance_pct}% | ETH.D {m2b?.crypto_cycle_stage?.eth_dominance_pct}%):</span>
                    <span className="text-cyan-300">{m2b?.crypto_cycle_stage?.current_stage}</span>
                  </div>
                  <div className="text-xs text-slate-300">
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
                  <div className="text-slate-400 font-semibold">Option B — Marketable Treasury Ownership Shares:</div>
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
                  Live Gold: ${m2d?.gold_spot_usd} | Residual: {m2d?.ols_63d_sovereign_residual_sigma > 0 ? "+" : ""}{m2d?.ols_63d_sovereign_residual_sigma}σ
                </span>
              </div>

              {(viewMode === "ALL" || viewMode === "OPTION_A") && (
                <div className="rounded border border-slate-800 bg-[#090D16] p-3 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-semibold">Option A — 63D OLS Real-Yield/DXY Residual & Intraday Session Split:</div>
                  <div className="flex justify-between">
                    <span>Asian Physical Session (90D Cum.) vs NY COMEX Paper:</span>
                    <span className="text-emerald-400">Asia +{m2d?.asian_physical_session_cum_90d_pct}% vs NY {m2d?.ny_comex_paper_session_cum_90d_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>10Y Real TIPS Yield / DXY Index:</span>
                    <span className="text-cyan-300">{m2d?.real_yield_10y_tips_pct}% TIPS / DXY {m2d?.dxy_index}</span>
                  </div>
                </div>
              )}

              {(viewMode === "ALL" || viewMode === "OPTION_B") && (
                <div className="rounded border border-slate-800 bg-[#090D16] p-3 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-semibold">Option B — World FX Reserves De-Dollarization Share:</div>
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

        {/* 5. STRUCTURE #3: TWO-WAY MACRO FEEDBACK & INSTITUTIONAL BAROMETERS */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Structure #3 — Institutional Macro Barometers & Two-Way Feedback Transmission
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dr. Copper / Gold Yield Barometer • Gold-to-Oil Capex Supercycle Comps • CrossBorder Liquidity Betas
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Gold/Oil: <strong className="text-amber-300">{auOil.gold_oil_ratio}x</strong> • Copper/Gold: <strong className="text-cyan-300">{cuAu.copper_gold_ratio}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* 3A: COPPER / GOLD MACRO BAROMETER */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300">3A. Copper / Gold Yield Barometer</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">{cuAu.copper_gold_ratio}</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">200-Day SMA:</span>
                  <span className="font-mono text-white">{cuAu.ratio_200d_sma}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">63-Day Z-Score:</span>
                  <span className="font-mono text-cyan-300">{cuAu.ratio_63d_z_score > 0 ? "+" : ""}{cuAu.ratio_63d_z_score}σ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">10Y Yield Target:</span>
                  <span className="font-mono text-amber-300 font-semibold">{cuAu.projected_10y_yield_direction}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 border-t border-slate-800 pt-2">{cuAu.macro_signal}</p>
              <p className="text-xs text-emerald-300 font-semibold pt-1">Expression: {cuAu.actionable_expression}</p>
            </div>

            {/* 3B: GOLD / OIL RATIO CAPEX COMPS */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-300">3B. Gold / Oil Ratio Secular Capex</span>
                <span className="text-xs font-mono text-amber-300 font-bold">{auOil.gold_oil_ratio}x</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">50Y Historical Median:</span>
                  <span className="font-mono text-white">{auOil.historical_median}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deviation vs. Median:</span>
                  <span className="font-mono text-rose-400 font-bold">+{auOil.pct_above_median}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capex Cycle Signal:</span>
                  <span className="font-mono text-emerald-300 font-semibold">Energy Bottom / Capex Deficit</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 border-t border-slate-800 pt-2">{auOil.signal_status}</p>
              <p className="text-xs text-emerald-300 font-semibold pt-1">Playbook: {auOil.actionable_trade}</p>
            </div>

            {/* 3C: GLOBAL LIQUIDITY BETAS */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300">3C. Howell Global Liquidity Betas</span>
                <span className="text-xs font-mono text-slate-400">Net Liq 4W: {liqBetas.net_liquidity_4w_roc_bn > 0 ? "+" : ""}{liqBetas.net_liquidity_4w_roc_bn}B</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {(liqBetas.asset_beta_matrix || []).map((row: any) => (
                  <div key={row.asset} className="flex items-center justify-between border-b border-slate-800/40 pb-1">
                    <span className="text-slate-300">{row.asset}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-bold">β={row.beta}x</span>
                      <span className={`text-xs ${row.projected_30d_impulse_pct >= 0 ? "text-emerald-400" : "text-rose-400 font-semibold"}`}>
                        {row.projected_30d_impulse_pct > 0 ? "+" : ""}{row.projected_30d_impulse_pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 border-t border-slate-800 pt-2">{liqBetas.howell_summary}</p>
            </div>
          </div>

          {/* Historical Gold/Oil Comps Table */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-2">
            <span className="text-xs font-mono font-bold text-slate-300">
              Historical Precedents: What Happens When Gold/Oil &gt; 30x (Secular Energy Reversals)
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-1.5 px-3">Historical Peak Year</th>
                    <th className="py-1.5 px-3">Ratio Peak</th>
                    <th className="py-1.5 px-3">Forward 3Y Oil Performance</th>
                    <th className="py-1.5 px-3">Macro Context & Supercycle Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(auOil.historical_comps || []).map((c: any) => (
                    <tr key={c.year} className="hover:bg-slate-800/40">
                      <td className="py-1.5 px-3 font-bold text-white">{c.year}</td>
                      <td className="py-1.5 px-3 text-amber-300 font-bold">{c.ratio_peak}x</td>
                      <td className="py-1.5 px-3 text-emerald-400 font-bold">{c.forward_3y_oil_perf_pct}</td>
                      <td className="py-1.5 px-3 text-slate-300">{c.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3D: FOUR MACRO FEEDBACK TRANSMISSION CHANNELS */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-slate-300">
              Macro Feedback Transmission Channels
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(s3.feedback_channels || []).map((ch: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-1">
                  <div className="text-xs font-mono font-bold text-cyan-300">{ch.channel}</div>
                  <div className="text-xs font-mono text-amber-300">{ch.status}</div>
                  <p className="text-xs text-slate-300">{ch.mechanism}</p>
                  <p className="text-xs font-semibold text-emerald-300 pt-1">Action: {ch.portfolio_action}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. PRODUCER EQUITIES QUICK-ACCESS STRIP */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">
              Tracked Physical Commodity & Alternative Equity Leaders (Click to Analyze):
            </span>
            <span className="text-xs font-mono text-cyan-400">Institutional Forensic Coverage</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { ticker: "TPL", name: "Texas Pacific Land", type: "Energy Royalties" },
              { ticker: "XLE", name: "Energy SPDR", type: "Broad Energy" },
              { ticker: "CNQ", name: "Canadian Natural", type: "Low-Decline Oil Sands" },
              { ticker: "CCJ", name: "Cameco Corp", type: "Nuclear / Uranium" },
              { ticker: "URA", name: "Global Uranium", type: "Nuclear ETF" },
              { ticker: "CEG", name: "Constellation Energy", type: "Nuclear Baseload PPA" },
              { ticker: "COPX", name: "Copper Miners ETF", type: "Base Metals" },
              { ticker: "FCX", name: "Freeport-McMoRan", type: "Copper Major" },
              { ticker: "WPM", name: "Wheaton Precious", type: "Gold/Silver Streaming" },
              { ticker: "AEM", name: "Agnico Eagle", type: "Low-Cost Gold Major" },
              { ticker: "EQT", name: "EQT Corp", type: "Natural Gas Low-Cost" },
              { ticker: "WMB", name: "Williams Companies", type: "Gas Pipelines" },
              { ticker: "IBIT", name: "iShares Bitcoin ETF", type: "Digital Hard Asset" },
              { ticker: "CBOE", name: "Cboe Global Markets", type: "Derivatives Tollbooth" },
            ].map((st) => (
              <Link
                key={st.ticker}
                href={`/stock-analysis?ticker=${st.ticker}`}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs font-mono hover:border-cyan-500/50 hover:bg-slate-800 transition group"
              >
                <span className="font-bold text-cyan-300 group-hover:text-cyan-200">${st.ticker}</span>
                <span className="text-slate-400 ml-1.5 hidden sm:inline">{st.name}</span>
                <span className="text-slate-500 ml-1 text-xs">({st.type})</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
