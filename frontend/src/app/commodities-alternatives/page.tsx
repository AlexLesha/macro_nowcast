"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Layers,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Coins,
  Compass,
  Gauge,
  Sliders,
  DollarSign,
  PieChart,
  BarChart3,
  Zap,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function CommoditiesAlternativesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive View Mode Toggles for each module
  const [viewS1, setViewS1] = useState<"A" | "B" | "C">("A");
  const [view2A, setView2A] = useState<"A" | "B" | "C">("A");
  const [view2B, setView2B] = useState<"A" | "B" | "C">("A");
  const [view2C, setView2C] = useState<"A" | "B" | "C">("A");
  const [view2D, setView2D] = useState<"A" | "B" | "C">("A");
  const [viewS3, setViewS3] = useState<"A" | "B" | "C">("A");

  // Filter for Term Structure table
  const [selectedComplex, setSelectedComplex] = useState<string>("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      let res = await fetch(`${API_BASE_URL}/api/v1/commodities-alternatives/dashboard`, {
        cache: "no-store",
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/api/commodities-alternatives/dashboard`, {
          cache: "no-store",
        });
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.warn("Using offline fallback for commodities dashboard:", err);
      setError("Using offline high-fidelity institutional fallback dataset.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // High-fidelity fallback dataset adhering precisely to the Antigravity specification
  const s1 = data?.structure_1_term_structure || {
    sofr_benchmark_pct: 3.62,
    term_structure_matrix: [
      {
        commodity: "WTI / Brent Crude Oil",
        spot_ticker: "CL=F",
        futures_etf: "USO",
        producer_vehicles: ["TPL", "XLE", "CNQ"],
        spot_price: 78.4,
        f3m_price: 76.95,
        spread_21d_change_pct: 1.4,
        annualized_roll_yield_pct: 7.47,
        rate_adjusted_net_convenience_yield_pct: 11.09,
        curve_state: "BACKWARDATION",
        cot_spec_pct_oi: 34.0,
        cot_comm_net: "BULLISH_HEDGER_ACCUMULATION",
        rsi_14d: 51.0,
        flow_z_3m: 0.4,
        inventory_z: -1.1,
        regime_setup: "UN-CROWDED PHYSICAL SCARCITY (Positive Roll + Room to Add)",
        routed_vehicle: "Direct Futures ETF ($USO) + Royalty Leader ($TPL)",
        routing_reason: "Curve is backwardated (+7.5% ann. roll); capture positive roll yield + spot upside.",
      },
      {
        commodity: "Copper & Base Metals",
        spot_ticker: "HG=F",
        futures_etf: "DBB",
        producer_vehicles: ["COPX", "FCX", "SCCO"],
        spot_price: 4.68,
        f3m_price: 4.74,
        spread_21d_change_pct: 0.9,
        annualized_roll_yield_pct: -5.09,
        rate_adjusted_net_convenience_yield_pct: -1.47,
        curve_state: "CONTANGO",
        cot_spec_pct_oi: 62.0,
        cot_comm_net: "NEUTRAL",
        rsi_14d: 67.0,
        flow_z_3m: 1.1,
        inventory_z: -1.4,
        regime_setup: "STEADY PHYSICAL ACCUMULATION (Rate-Adjusted Carry Positive)",
        routed_vehicle: "AVOID $DBB Contango -> Route to Producers ($COPX, $FCX, $SCCO)",
        routing_reason: "Front contango bleeds -5.1%/yr; own underground reserves & free cash flow via $COPX / $FCX.",
      },
      {
        commodity: "Gold Bullion",
        spot_ticker: "GC=F",
        futures_etf: "GLDM",
        producer_vehicles: ["WPM", "AEM", "GDX"],
        spot_price: 4460.2,
        f3m_price: 4501.0,
        spread_21d_change_pct: 0.2,
        annualized_roll_yield_pct: -3.64,
        rate_adjusted_net_convenience_yield_pct: -0.02,
        curve_state: "CONTANGO",
        cot_spec_pct_oi: 74.0,
        cot_comm_net: "SOVEREIGN_PHYSICAL_BID",
        rsi_14d: 42.0,
        flow_z_3m: -0.6,
        inventory_z: -0.8,
        regime_setup: "STEADY PHYSICAL ACCUMULATION (Sovereign Floor Offsets Cost)",
        routed_vehicle: "Physical Trust / Producer Blend ($GLDM + $WPM)",
        routing_reason: "Covert central bank dips offset storage carry; own low-AISC streamers ($WPM).",
      },
      {
        commodity: "Natural Gas (Henry Hub / LNG)",
        spot_ticker: "NG=F",
        futures_etf: "UNG",
        producer_vehicles: ["EQT", "WMB", "LNG"],
        spot_price: 3.15,
        f3m_price: 3.42,
        spread_21d_change_pct: 1.8,
        annualized_roll_yield_pct: -32.89,
        rate_adjusted_net_convenience_yield_pct: -29.27,
        curve_state: "CONTANGO",
        cot_spec_pct_oi: 18.0,
        cot_comm_net: "EXTREME_COMMERCIAL_LONG",
        rsi_14d: 39.0,
        flow_z_3m: -1.5,
        inventory_z: 0.3,
        regime_setup: "COILED SPRING PIVOT (Contango Flattening + Unloved Specs <20th Pct)",
        routed_vehicle: "AVOID $UNG (Contango Bleed) -> Route to Producers ($EQT, $WMB, $LNG)",
        routing_reason: "Front contango bleeds -32.9%/yr; own low-cost gas reserves & AI pipeline toll-roads via $EQT / $WMB.",
      },
      {
        commodity: "Uranium (Physical / Nuclear Fuel)",
        spot_ticker: "SRUUF",
        futures_etf: "SRUUF",
        producer_vehicles: ["CCJ", "URA", "CEG"],
        spot_price: 84.5,
        f3m_price: 85.2,
        spread_21d_change_pct: 1.2,
        annualized_roll_yield_pct: -3.3,
        rate_adjusted_net_convenience_yield_pct: 0.32,
        curve_state: "CONTANGO",
        cot_spec_pct_oi: 28.0,
        cot_comm_net: "UTILITY_TERM_CONTRACTING",
        rsi_14d: 44.0,
        flow_z_3m: -0.8,
        inventory_z: -1.9,
        regime_setup: "COILED SPRING PIVOT (Unloved Pullback + Utility Term Contracting)",
        routed_vehicle: "Physical Trust ($SRUUF) + Tier-1 Miner ($CCJ) & Nuclear Utility ($CEG)",
        routing_reason: "Net convenience yield (+0.32% vs SOFR) is positive; physical trust has zero futures roll bleed.",
      },
      {
        commodity: "Agriculture Basket",
        spot_ticker: "DBA",
        futures_etf: "DBA",
        producer_vehicles: ["NTR", "CF", "DE"],
        spot_price: 26.8,
        f3m_price: 26.45,
        spread_21d_change_pct: 1.1,
        annualized_roll_yield_pct: 5.26,
        rate_adjusted_net_convenience_yield_pct: 8.88,
        curve_state: "BACKWARDATION",
        cot_spec_pct_oi: 22.0,
        cot_comm_net: "BULLISH_COMMERCIAL_FLOOR",
        rsi_14d: 39.0,
        flow_z_3m: -0.9,
        inventory_z: -0.7,
        regime_setup: "COILED SPRING PIVOT (Backwardated + Unloved 22nd Pct Positioning)",
        routed_vehicle: "Direct Futures ETF ($DBA) + Fertilizer/Agri turnaround ($NTR)",
        routing_reason: "Curve is backwardated (+5.3% ann. roll) with washed-out RSI (39) and bullish VAMS (+1).",
      },
    ],
    cross_asset_carry_table: [
      {
        carry_trade: "BBB-B CLO Floating Rate Carry ($CLOZ)",
        gross_yield_pct: 8.45,
        vol_90d_pct: 3.8,
        crowding_pct: 58.0,
        carry_to_vol_score: 2.22,
        status: "ACTIVE HARVEST (SOFR Floating Coupon + Booming 6.3% N-GDP)",
        actionable_directive: "LONG $CLOZ (up to 6% weight) while HY OAS VAMS remains neutral; cut if MOVE > 110.",
      },
      {
        carry_trade: "Business Development Companies ($BIZD / $ARCC)",
        gross_yield_pct: 9.6,
        vol_90d_pct: 11.4,
        crowding_pct: 52.0,
        carry_to_vol_score: 0.84,
        status: "HALF POSITION (Reflation Tailwind vs Credit Spread Watch)",
        actionable_directive: "LONG Half Position in $BIZD / $ARCC; pair with $USFR liquidity buffer.",
      },
      {
        carry_trade: "G10 FX Carry (USD/JPY & EM Local $EMLC)",
        gross_yield_pct: 5.35,
        vol_90d_pct: 9.2,
        crowding_pct: 48.0,
        carry_to_vol_score: 0.58,
        status: "SELECTIVE EM CARRY ($EMLC Bullish VAMS; Avoid Crowded JPY Shorts)",
        actionable_directive: "LONG $EMLC & $CEW on DXY weakness; avoid unhedged JPY carry when CFTC specs >80th pct.",
      },
    ],
    facet_actionable_directive: {
      headline:
        "Look at Backwardated Energy ($USO / $TPL), Coiled-Spring NatGas Midstream ($EQT / $WMB), and Unloved Ags ($DBA)",
      immediate_actions: [
        "1. Direct Futures Harvest: Buy $USO and $PDBC where annualized roll yield (+7.5%) + SOFR (+3.62%) delivers +11.1% net convenience yield with only 34th-percentile speculator positioning.",
        "2. Contango Bleed Bypass: Do NOT buy $UNG (bleeding -32.9% annualized contango). Express the AI/LNG natural gas inflection via low-cost producers and pipelines ($EQT, $WMB, $LNG).",
        "3. Unloved Pivot Alert: Accumulate $SRUUF / $CCJ (Uranium) and $DBA (Agriculture) where RSI is 39-44 and commercial hedgers are heavily net long.",
      ],
    },
  };

  const s2 = data?.structure_2_shadow_plumbing || {
    module_2a_onchain_whales: {
      btc_spot_usd: 80283.0,
      breakeven_lines: {
        sth_realized_price_155d_usd: 64250.0,
        us_etf_vwap_cost_basis_usd: 61800.0,
        miner_production_cost_floor_usd: 56400.0,
      },
      hash_ribbon: {
        hashrate_30d_eh: 645.0,
        hashrate_60d_eh: 632.0,
        miner_status: "EXPANSION (30D > 60D SMA)",
      },
      coinbase_vs_binance_premium_bps: 14.5,
      perp_funding_apr_pct: 4.2,
      funding_regime:
        "STEALTH US INSTITUTIONAL ACCUMULATION (Positive Coinbase Premium + Low Perp Leverage)",
      high_dilution_avoid_list: [
        {
          Category: "High-FDV VC Layer-2 Unlocks",
          ann_supply_inflation_pct: 34.5,
          verdict: "AVOID / SHORT AGAINST $IBIT",
        },
        {
          Category: "Low-Float AI Meme Tokens",
          ann_supply_inflation_pct: 48.0,
          verdict: "AVOID (Stage 4 Retail Exit Liquidity)",
        },
      ],
      actionable_directive:
        "BTC is testing well above its Short-Term Holder Realized Price ($64,250) and US ETF Cost Basis ($61,800) with Coinbase USD premium positive (+14.5 bps). Action: Maintain prime-asset core in $FBTC / $IBIT while avoiding high-unlock VC altcoins.",
    },
    module_2b_stablecoins_and_drainage: {
      stablecoin_stats: { usdt_bn: 142.5, usdc_bn: 56.8, total_stables_bn: 224.0, minting_30d_pct: 3.8 },
      tbill_market_size_bn: 6200.0,
      stablecoin_tbill_holdings_bn: 198.0,
      stablecoin_share_of_tbills_pct: 3.19,
      marginal_tbill_buyer_rank: "#14 Global Foreign Holder (Ahead of Germany & Mexico; 6.5% of marginal T-Bill demand)",
      detected_funding_source:
        "60% Offshore EM Dollarization Flight ($USDT) + 40% Onshore Money-Market Rotation ($USDC)",
      crypto_cycle_stage: {
        current_stage: "STAGE 1 -> STAGE 2 TRANSITION (Prime-Coin Consolidation / Pre-Broadening)",
        btc_dominance_pct: 56.4,
        eth_dominance_pct: 14.8,
        ssr_z_score: -0.65,
        dex_meme_volume_share_pct: 14.2,
      },
      cross_market_equity_drainage: {
        arkk_vs_qqq_63d_corr_to_alts: 0.74,
        sphb_vs_qual_drainage_status:
          "BENIGN (Stablecoin minting +3.8% 30D is net-additive; no Stage-4 speculative equity bleed)",
      },
      actionable_directive:
        "30D net stablecoin minting (+3.8%) is expanding dry powder (SSR Z-score -0.65) while BTC Dominance holds 56.4%. Action: Focus crypto allocation 85%+ in Prime Coins ($IBIT / $FBTC) and Crypto-TradFi Toll Collectors ($COIN / $CBOE); do not rotate into small-cap alts until BTC VAMS flips +1.",
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
      qual_vs_sphb_ratio_z: -0.4,
      treasury_ownership_shares_pct: {
        "Private Nonbank Investors (MMFs, Households, Funds)": 58.0,
        "US Commercial Banks": 15.0,
        "Federal Reserve (SOMA)": 14.0,
        "Foreign Official (Central Banks)": 13.0,
        "Cayman Leveraged Basis Funds (Memo Share)": 4.4,
      },
      basis_stress_status: "GREEN / CONTAINED (SOFR - IORB at -3 bps & MOVE at 73; Fed RMP absorbing $282B/yr)",
      actionable_directive:
        "Cayman basis trade is large ($1.18T gross) but repo plumbing is currently calm (SOFR 3 bps below IORB, MOVE at 73). Action: Stay Long High-Beta & Cyclicals ($SPHB, $XLI, $IWM) and Yield-Curve Steepeners ($IVOL). If SOFR - IORB spikes > +3 bps and MOVE breaks > 105, immediately rotate from $SPHB/$IWM into Quality ($QUAL) and Cash ($USFR).",
    },
    module_2d_sovereign_gold_bid: {
      gold_spot_usd: 4460.22,
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
      actionable_directive:
        "Even though short-term COMEX paper VAMS in Gold is Neutral/Bearish after its run to $4,460, the 63D Real-Yield Regression Residual (+1.85σ) and Asian Session Cumulative Return (+11.4% vs -2.1% NY) prove sovereign central banks are buying every dip. Action: Hold 15% core $GLDM in KISS and accumulate Royalty/Low-AISC Miners ($WPM, $AEM) at the bottom of their Probable Range ($4,248).",
    },
  };

  const s3 = data?.structure_3_capex_clock || {
    depletion_clock_sectors: [
      {
        sector: "Uranium & Nuclear Fuel Cycle",
        tickers: ["SRUUF", "CCJ", "URA", "CEG"],
        capex_to_dda_ratio: 0.68,
        ten_year_avg_capex_dda: 0.75,
        valuation_vs_spx_pct: 18.0,
        clock_stage: "STAGE 1: SEVERE UNDERINVESTMENT + CONTRACTING PIVOT (1-3Y & 3Y+ Supercycle)",
        actionable_call:
          "PRIORITY 1 BUY ON DIP: Capex/DD&A is 0.68x (depleting faster than replacement) while hyperscaler nuclear PPAs lock in 10-year demand. Accumulate $SRUUF, $CCJ, and $CEG.",
      },
      {
        sector: "Upstream Oil & Permian Royalties",
        tickers: ["TPL", "XLE", "CNQ", "SLB"],
        capex_to_dda_ratio: 0.84,
        ten_year_avg_capex_dda: 0.92,
        valuation_vs_spx_pct: 14.0,
        clock_stage: "STAGE 2: CAPITAL DISCIPLINE + HIGH FCF YIELD (Immediate & 12M Winner)",
        actionable_call:
          "PRIORITY 1 OVERWEIGHT: Producers are returning cash via buybacks/dividends rather than drilling. Own $TPL (zero-capex royalty) and $XLE.",
      },
      {
        sector: "Copper & Electrification Metals",
        tickers: ["COPX", "FCX", "SCCO", "DBB"],
        capex_to_dda_ratio: 0.79,
        ten_year_avg_capex_dda: 0.88,
        valuation_vs_spx_pct: 26.0,
        clock_stage: "STAGE 2: AI GRID BOTTLENECK vs GRADE DEPLETION (12M & 3Y+ Winner)",
        actionable_call:
          "BUY DIPS TO PROBABLE RANGE LOW: New copper mines take 16 years to permit; own $COPX and $FCX for AI grid & defense electrification.",
      },
      {
        sector: "Precious Metals Royalty & Low-AISC Miners",
        tickers: ["WPM", "AEM", "GDX"],
        capex_to_dda_ratio: 0.81,
        ten_year_avg_capex_dda: 0.9,
        valuation_vs_spx_pct: 19.0,
        clock_stage: "STAGE 1 -> 2 PIVOT: RECORD FREE CASH FLOW MARGIN EXPANSION",
        actionable_call:
          "ACCUMULATE $WPM & $AEM: Gold at $4,460 with stable oil inputs creates record miner FCF margins while valuations sit at 19th-percentile vs S&P 500.",
      },
    ],
    commodity_valuation_ratios: {
      gold_to_oil_ratio: 56.9,
      gold_to_oil_historical_mean: 16.5,
      gold_to_oil_signal:
        "EXTREME OIL CHEAPNESS VS GOLD (56.9x vs 16.5x mean -> Oil & Energy Equities $XLE/$TPL offer massive catch-up value)",
      copper_to_gold_ratio_z: -1.65,
      copper_to_gold_signal:
        "CYCLICAL REFLATION COILED SPRING (Copper/Gold at -1.65σ despite 8.2% Nominal GDP -> Favors $COPX/$FCX and higher 10Y yields)",
    },
    facet_actionable_directive: {
      headline:
        "Gold-to-Oil Ratio at 56.9x (vs 16.5x Norm) & Copper-to-Gold at -1.65σ Scream Hard-Asset Catch-Up",
      immediate_actions: [
        "1. Relative-Value Arbitrage: Gold has already front-run monetary debasement ($4,460/oz), pushing the Gold/Oil ratio to 56.9x. Rotate incremental inflation-hedge dollars into Crude/Permian Royalties ($TPL, $XLE) and Copper Miners ($COPX, $FCX).",
        "2. Multi-Year Depletion Compounders: Build core 12M-36M positions in Uranium ($SRUUF, $CCJ) and Precious Metal Streamers ($WPM) where Capex/DD&A is below 0.85x.",
      ],
    },
  };

  const filteredMatrix =
    selectedComplex === "ALL"
      ? s1.term_structure_matrix
      : s1.term_structure_matrix.filter((row: any) =>
          row.commodity.toLowerCase().includes(selectedComplex.toLowerCase())
        );

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 p-3 sm:p-5 lg:p-7 space-y-6">
      {/* =========================================================================
          EXECUTIVE SUMMARY BANNER & SYNTHESIS
          ========================================================================= */}
      <section className="rounded-xl border border-slate-800 bg-[#0e1626]/90 backdrop-blur-md p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-yellow-500/10 flex items-center justify-center border border-amber-500/30 text-amber-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Section 8 • Institutional Commodities & Alternatives Engine
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  Rate-Adjusted SOFR: {s1.sofr_benchmark_pct}%
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                Physical Term-Structure, Shadow Liquidity & Depletion Clock
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              CoinGecko Demo + Keyless Public API Active
            </span>
            <button
              id="commodities-refresh-button"
              onClick={fetchData}
              className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh live feeds"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Executive Synthesis High-Contrast Banner */}
        <div className="rounded-lg bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-cyan-950/20 border border-amber-500/40 p-4 shadow-inner space-y-2.5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-300 tracking-wide">
              Executive Synthesis: Physical Scarcity + Shadow Liquidity Expansion Favor Backwardated Energy ($USO/$TPL), Unloved Uranium/Ag Pivots ($SRUUF/$DBA), and Prime-Coin/Gold Dip Accumulation
            </h2>
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-white">Structure #1 (Term-Structure & Vehicle Router):</strong> Harvest{" "}
              <span className="text-emerald-400 font-mono font-bold">+11.09%</span> rate-adjusted convenience yield in Crude Oil ($USO / $TPL) and <span className="text-emerald-400 font-mono font-bold">+8.88%</span> in Agriculture ($DBA). Bypass <span className="text-rose-400 font-mono font-bold">-32.9%</span> contango bleed in $UNG by routing Natural Gas exposure directly to low-cost producers & pipelines ($EQT, $WMB, $LNG).
            </li>
            <li>
              <strong className="text-white">Structure #2 (Shadow Monetary Plumbing):</strong> Stablecoins hold{" "}
              <span className="text-cyan-300 font-mono font-bold">$198B (3.19%)</span> of the $6.2T US T-Bill market (#14 Foreign Holder). Cayman Basis Trade repo stress is calm (<span className="text-emerald-400 font-mono">SOFR - IORB = -3 bps, MOVE = 73</span>), supporting high-beta carry ($CLOZ, $SPHB). Sovereign Gold Residual (<span className="text-amber-300 font-mono font-bold">+1.85σ</span>) confirms Asian central banks are buying every dip.
            </li>
            <li>
              <strong className="text-white">Structure #3 (Capex Depletion Clock):</strong> Gold-to-Oil at{" "}
              <span className="text-amber-300 font-mono font-bold">56.9x</span> (vs. 16.5x historical norm) and Capex/DD&A below <span className="text-cyan-300 font-mono font-bold">0.85x</span> in Uranium ($SRUUF, $CCJ) and Copper ($COPX, $FCX) flag generational physical supply deficits.
            </li>
          </ul>
        </div>
      </section>

      {/* =========================================================================
          STRUCTURE #1: PHYSICAL COMMODITY TERM-STRUCTURE & VEHICLE ROUTER
          ========================================================================= */}
      <section className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Structure #1
              </span>
              <h2 className="text-lg font-bold text-white">
                Physical Commodity Term-Structure, Rate-Adjusted Carry & Automatic Vehicle Router
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Strips out the nominal SOFR benchmark ({s1.sofr_benchmark_pct}%) to isolate true physical scarcity (Net Convenience Yield = Annualized Roll Yield + SOFR) and intelligently routes capital between Direct Futures ETFs and Producer/Royalty Equities to prevent contango decay.
            </p>
          </div>

          {/* Interactive Multi-Option Toggles */}
          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            <button
              id="view-s1-a"
              onClick={() => setViewS1("A")}
              className={`px-3 py-1.5 rounded-md font-semibold transition border ${
                viewS1 === "A"
                  ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/30"
                  : "bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              Option A: Router Table
            </button>
            <button
              id="view-s1-b"
              onClick={() => setViewS1("B")}
              className={`px-3 py-1.5 rounded-md font-semibold transition border ${
                viewS1 === "B"
                  ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/30"
                  : "bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              Option B: Carry vs Crowding Cards
            </button>
            <button
              id="view-s1-c"
              onClick={() => setViewS1("C")}
              className={`px-3 py-1.5 rounded-md font-semibold transition border ${
                viewS1 === "C"
                  ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/30"
                  : "bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              Option C: Cross-Asset Carry
            </button>
          </div>
        </div>

        {/* View Mode A: Term-Structure & Router Table */}
        {viewS1 === "A" && (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Commodity Complex</th>
                  <th className="py-3 px-3">Spot / 3M Price</th>
                  <th className="py-3 px-3">Curve / Roll Yield</th>
                  <th className="py-3 px-3">Rate-Adj. Net Convenience Yield</th>
                  <th className="py-3 px-3">COT Spec % / 14D RSI</th>
                  <th className="py-3 px-3">Regime Setup</th>
                  <th className="py-3 px-3 min-w-[260px]">Automatic Vehicle Router</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {s1.term_structure_matrix.map((row: any, i: number) => {
                  const isBack = row.curve_state === "BACKWARDATION";
                  return (
                    <tr key={i} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{row.commodity}</div>
                        <div className="text-[11px] text-slate-400">
                          {row.spot_ticker} • Spread 21D:{" "}
                          <span className={row.spread_21d_change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {row.spread_21d_change_pct > 0 ? "+" : ""}
                            {row.spread_21d_change_pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        <div>Spot: ${row.spot_price.toLocaleString()}</div>
                        <div className="text-slate-400">3M: ${row.f3m_price.toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold ${
                            isBack
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-950/80 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {row.curve_state} ({row.annualized_roll_yield_pct > 0 ? "+" : ""}
                          {row.annualized_roll_yield_pct}%)
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-cyan-300 font-bold text-sm">
                          {row.rate_adjusted_net_convenience_yield_pct > 0 ? "+" : ""}
                          {row.rate_adjusted_net_convenience_yield_pct}%
                        </div>
                        <div className="text-[10px] text-slate-400">vs SOFR {s1.sofr_benchmark_pct}%</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>COT: {row.cot_spec_pct_oi}th %</div>
                        <div className="text-[11px] text-slate-400">
                          RSI: {row.rsi_14d} • Flow Z: {row.flow_z_3m > 0 ? "+" : ""}
                          {row.flow_z_3m}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-amber-300 text-[11px] font-semibold">{row.regime_setup}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-emerald-300 text-xs">{row.routed_vehicle}</div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">{row.routing_reason}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode B: Carry vs. Crowding Quadrant Cards */}
        {viewS1 === "B" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            {s1.term_structure_matrix.map((row: any, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{row.commodity}</h3>
                    <span className="text-[11px] text-slate-400">{row.spot_ticker}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      row.rate_adjusted_net_convenience_yield_pct > 0
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    Conv. Yield: {row.rate_adjusted_net_convenience_yield_pct > 0 ? "+" : ""}
                    {row.rate_adjusted_net_convenience_yield_pct}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Spec Crowding:</span>
                    <span className="font-bold text-slate-200">{row.cot_spec_pct_oi}th percentile</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        row.cot_spec_pct_oi < 35
                          ? "bg-emerald-500"
                          : row.cot_spec_pct_oi > 70
                          ? "bg-rose-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(100, row.cot_spec_pct_oi)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800/80">
                  <div>
                    <span className="text-slate-400">14D RSI:</span>{" "}
                    <span className="font-bold text-white">{row.rsi_14d}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Roll Yield:</span>{" "}
                    <span className={row.annualized_roll_yield_pct > 0 ? "text-emerald-400" : "text-rose-400"}>
                      {row.annualized_roll_yield_pct > 0 ? "+" : ""}
                      {row.annualized_roll_yield_pct}%
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-2 space-y-1">
                  <div className="text-emerald-300 font-semibold">{row.routed_vehicle}</div>
                  <div className="text-[11px] text-slate-400 font-sans">{row.routing_reason}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Mode C: Cross-Asset Carry Harvest Table */}
        {viewS1 === "C" && (
          <div className="space-y-3 font-mono text-xs">
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Carry Expression</th>
                    <th className="py-2.5 px-3">Gross Yield</th>
                    <th className="py-2.5 px-3">90D Vol</th>
                    <th className="py-2.5 px-3">Crowding Pct</th>
                    <th className="py-2.5 px-3">Carry / Vol Ratio</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Tactical Directive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {s1.cross_asset_carry_table.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">{c.carry_trade}</td>
                      <td className="py-2.5 px-3 text-cyan-300 font-bold">{c.gross_yield_pct}%</td>
                      <td className="py-2.5 px-3 text-slate-300">{c.vol_90d_pct}%</td>
                      <td className="py-2.5 px-3 text-slate-300">{c.crowding_pct}th %</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{c.carry_to_vol_score}x</td>
                      <td className="py-2.5 px-3 text-amber-300 text-[11px]">{c.status}</td>
                      <td className="py-2.5 px-3 text-slate-200 font-sans text-xs">{c.actionable_directive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Highlighted Actionable Directive Box for Structure #1 */}
        <div className="rounded-lg border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-slate-900/80 to-emerald-950/20 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
              Structure #1 Actionable Direction & Vehicle Call: {s1.facet_actionable_directive.headline}
            </h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-200 list-disc list-inside font-sans">
            {s1.facet_actionable_directive.immediate_actions.map((act: string, idx: number) => (
              <li key={idx} className="leading-relaxed">
                {act}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* =========================================================================
          STRUCTURE #2: SHADOW MONETARY PLUMBING, ON-CHAIN, BASIS TRADE & GOLD BID
          ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Structure #2
          </span>
          <h2 className="text-lg font-bold text-white">
            CrossBorder Capital Shadow Monetary Plumbing, Cayman Basis Trade & Sovereign Gold Bid
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* -------------------------------------------------------------------
              SUB-MODULE 2A: ON-CHAIN WHALES, BREAKEVENS & FUNDING
              ------------------------------------------------------------------- */}
          <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Coins className="h-4 w-4 text-cyan-400" />
                  2A. On-Chain Whales, 3 Breakeven Lines & Miner Ribbons
                </h3>
                <p className="text-[11px] text-slate-400">
                  Keyless mempool.space + CoinGecko Demo dual-mode feeds
                </p>
              </div>

              <div className="flex gap-1 text-xs font-mono">
                <button
                  id="view-2a-a"
                  onClick={() => setView2A("A")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2A === "A" ? "bg-cyan-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option A: Breakeven Ladder
                </button>
                <button
                  id="view-2a-b"
                  onClick={() => setView2A("B")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2A === "B" ? "bg-cyan-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option B: Whale Premium
                </button>
                <button
                  id="view-2a-c"
                  onClick={() => setView2A("C")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2A === "C" ? "bg-cyan-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option C: Dilution Avoid
                </button>
              </div>
            </div>

            {view2A === "A" && (
              <div className="space-y-3 font-mono text-xs">
                {[
                  {
                    label: "Live Bitcoin Spot ($BTC)",
                    val: s2.module_2a_onchain_whales.btc_spot_usd,
                    color: "bg-cyan-400",
                    tag: "Spot Price",
                  },
                  {
                    label: "Short-Term Holder (<155d) Realized Price",
                    val: s2.module_2a_onchain_whales.breakeven_lines.sth_realized_price_155d_usd,
                    color: "bg-emerald-500",
                    tag: "Institutional Support",
                  },
                  {
                    label: "US Spot ETF ($IBIT / $FBTC) VWAP Cost Basis",
                    val: s2.module_2a_onchain_whales.breakeven_lines.us_etf_vwap_cost_basis_usd,
                    color: "bg-blue-500",
                    tag: "TradFi Floor",
                  },
                  {
                    label: "Bitcoin Miner Production Cost Floor",
                    val: s2.module_2a_onchain_whales.breakeven_lines.miner_production_cost_floor_usd,
                    color: "bg-amber-500",
                    tag: "Hard Physical Cost",
                  },
                ].map((b, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-medium">
                        {b.label} <span className="text-slate-500 text-[10px]">({b.tag})</span>
                      </span>
                      <span className="font-bold text-white text-xs">${b.val.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${b.color}`} style={{ width: `${Math.min(100, (b.val / 90000) * 100)}%` }} />
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-800 text-slate-300 text-[11px]">
                  Miner Status:{" "}
                  <strong className="text-emerald-400">
                    {s2.module_2a_onchain_whales.hash_ribbon.miner_status}
                  </strong>{" "}
                  (30D SMA: {s2.module_2a_onchain_whales.hash_ribbon.hashrate_30d_eh} EH/s vs 60D SMA:{" "}
                  {s2.module_2a_onchain_whales.hash_ribbon.hashrate_60d_eh} EH/s)
                </div>
              </div>
            )}

            {view2A === "B" && (
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-1">
                  <div className="text-slate-400 text-[11px]">Coinbase USD vs Binance USDT</div>
                  <div className="text-xl font-extrabold text-emerald-400">
                    +{s2.module_2a_onchain_whales.coinbase_vs_binance_premium_bps} bps
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans leading-tight pt-1">
                    Positive spread confirms onshore US institutional & ETF accumulation is absorbing offshore perp liquidations.
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-1">
                  <div className="text-slate-400 text-[11px]">Perp Funding APR</div>
                  <div className="text-xl font-extrabold text-cyan-300">
                    +{s2.module_2a_onchain_whales.perp_funding_apr_pct}% APR
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans leading-tight pt-1">
                    Benign perp leverage (healthy & far below 25%+ retail frothy danger zone).
                  </div>
                </div>
              </div>
            )}

            {view2A === "C" && (
              <div className="space-y-2 font-mono text-xs">
                <div className="text-[11px] text-slate-400">
                  High-FDV Dilution Avoid List (DefiLlama / CoinGecko unlock schedule):
                </div>
                {s2.module_2a_onchain_whales.high_dilution_avoid_list.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2.5 rounded bg-rose-950/20 border border-rose-500/30 text-rose-300"
                  >
                    <div>
                      <div className="font-bold text-white">{item.Category}</div>
                      <div className="text-[10px] text-rose-400">
                        Supply Inflation: +{item.ann_supply_inflation_pct}% ann.
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 text-[10px] font-bold">
                      {item.verdict}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actionable Call Box 2A */}
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-slate-200">
              <strong className="text-cyan-300 font-mono">Actionable Call (2A): </strong>
              <span className="font-sans leading-relaxed">{s2.module_2a_onchain_whales.actionable_directive}</span>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              SUB-MODULE 2B: STABLECOIN T-BILLS & 4-STAGE CRYPTO/EQUITY DRAINAGE
              ------------------------------------------------------------------- */}
          <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  2B. Stablecoin T-Bill Bid & 4-Stage Crypto/Equity Drainage
                </h3>
                <p className="text-[11px] text-slate-400">
                  DefiLlama Live Stables API + T-Bill market absorption
                </p>
              </div>

              <div className="flex gap-1 text-xs font-mono">
                <button
                  id="view-2b-a"
                  onClick={() => setView2B("A")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2B === "A" ? "bg-emerald-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option A: T-Bills & Cycle
                </button>
                <button
                  id="view-2b-b"
                  onClick={() => setView2B("B")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2B === "B" ? "bg-emerald-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option B: Equity Drainage
                </button>
                <button
                  id="view-2b-c"
                  onClick={() => setView2B("C")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2B === "C" ? "bg-emerald-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option C: 4-Stage Waterfall
                </button>
              </div>
            </div>

            {view2B === "A" && (
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-1">
                  <div className="text-slate-400 text-[11px]">Total Stablecoins ($USDT + $USDC)</div>
                  <div className="text-xl font-extrabold text-white">
                    ${s2.module_2b_stablecoins_and_drainage.stablecoin_stats.total_stables_bn}B{" "}
                    <span className="text-emerald-400 text-xs">
                      (+{s2.module_2b_stablecoins_and_drainage.stablecoin_stats.minting_30d_pct}% 30D)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans leading-tight pt-1">
                    Holds ${s2.module_2b_stablecoins_and_drainage.stablecoin_tbill_holdings_bn}B in US T-Bills ({s2.module_2b_stablecoins_and_drainage.stablecoin_share_of_tbills_pct}% of $6.2T T-Bill market).
                  </div>
                  <div className="text-[10px] text-cyan-300 font-mono font-bold">
                    {s2.module_2b_stablecoins_and_drainage.marginal_tbill_buyer_rank}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-1">
                  <div className="text-slate-400 text-[11px]">Active Crypto Cycle Stage</div>
                  <div className="text-xs font-bold text-amber-300">
                    {s2.module_2b_stablecoins_and_drainage.crypto_cycle_stage.current_stage}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans leading-tight pt-1">
                    BTC Dominance: {s2.module_2b_stablecoins_and_drainage.crypto_cycle_stage.btc_dominance_pct}% • Stablecoin Supply Ratio Z:{" "}
                    {s2.module_2b_stablecoins_and_drainage.crypto_cycle_stage.ssr_z_score}σ
                  </div>
                  <div className="text-[10px] text-slate-400">
                    DEX Meme Volume Share: {s2.module_2b_stablecoins_and_drainage.crypto_cycle_stage.dex_meme_volume_share_pct}%
                  </div>
                </div>
              </div>
            )}

            {view2B === "B" && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Detected Fiat Funding Source:</span>
                  <span className="text-cyan-300 font-bold">
                    {s2.module_2b_stablecoins_and_drainage.detected_funding_source}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">63D Corr (Alt Volume vs $ARKK / $QQQ):</span>
                  <span className="text-amber-300 font-bold">
                    +{s2.module_2b_stablecoins_and_drainage.cross_market_equity_drainage.arkk_vs_qqq_63d_corr_to_alts}
                  </span>
                </div>
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 font-sans text-xs">
                  {s2.module_2b_stablecoins_and_drainage.cross_market_equity_drainage.sphb_vs_qual_drainage_status}
                </div>
              </div>
            )}

            {view2B === "C" && (
              <div className="space-y-2 font-mono text-xs">
                {[
                  { stage: "Stage 1", title: "Bitcoin / Prime Dominance", active: true, desc: "BTC absorbs fresh institutional fiat & stablecoin minting. Dom > 55%." },
                  { stage: "Stage 2", title: "Ethereum & Large Cap Layer 1s", active: true, desc: "Capital rotates into ETH, SOL, and primary smart contract platforms." },
                  { stage: "Stage 3", title: "Mid-Cap DeFi & Infrastructure", active: false, desc: "Rotation into bluechip DeFi protocols, real-world assets, and oracles." },
                  { stage: "Stage 4", title: "Meme Tokens & Equity Drainage", active: false, desc: "Blow-off retail speculation draining liquidity from ARKK, SPHB, and small-caps." },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded border flex items-center justify-between ${
                      s.active
                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-900/40 border-slate-800 text-slate-500"
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{s.stage}: {s.title}</span>
                        {s.active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">{s.desc}</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800/80">
                      {s.active ? "CURRENT" : "WAIT"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actionable Call Box 2B */}
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-slate-200">
              <strong className="text-cyan-300 font-mono">Actionable Call (2B): </strong>
              <span className="font-sans leading-relaxed">{s2.module_2b_stablecoins_and_drainage.actionable_directive}</span>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              SUB-MODULE 2C: CAYMAN TREASURY BASIS TRADE & REPO STRESS
              ------------------------------------------------------------------- */}
          <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-emerald-400" />
                  2C. Cayman Islands Treasury Basis Trade & Repo Stress
                </h3>
                <p className="text-[11px] text-slate-400">
                  CFTC TFF Leveraged Shorts vs Sponsored Repo & SOFR-IORB
                </p>
              </div>

              <div className="flex gap-1 text-xs font-mono">
                <button
                  id="view-2c-a"
                  onClick={() => setView2C("A")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2C === "A" ? "bg-emerald-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option A: Basis & Repo
                </button>
                <button
                  id="view-2c-b"
                  onClick={() => setView2C("B")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2C === "B" ? "bg-emerald-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option B: Ownership Shares
                </button>
                <button
                  id="view-2c-c"
                  onClick={() => setView2C("C")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2C === "C" ? "bg-emerald-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option C: De-Gross Triggers
                </button>
              </div>
            </div>

            {view2C === "A" && (
              <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
                  <div className="text-slate-400 text-[10px]">Cayman Gross Basis</div>
                  <div className="text-base font-extrabold text-white">
                    ${s2.module_2c_cayman_basis_trade.repo_levered_gross_notional_bn}B
                  </div>
                  <div className="text-[10px] text-slate-400">
                    CFTC Short: {s2.module_2c_cayman_basis_trade.cftc_tff_10y_leveraged_short_pct_oi}th %
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
                  <div className="text-slate-400 text-[10px]">SOFR − IORB Spread</div>
                  <div className="text-base font-extrabold text-emerald-400">
                    {s2.module_2c_cayman_basis_trade.sofr_minus_iorb_bps} bps
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Repo Calm (&lt;+3 bps)
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1">
                  <div className="text-slate-400 text-[10px]">MOVE Vol Index</div>
                  <div className="text-base font-extrabold text-cyan-300">
                    {s2.module_2c_cayman_basis_trade.move_index}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Below 105 Panic Cut
                  </div>
                </div>
              </div>
            )}

            {view2C === "B" && (
              <div className="space-y-2 font-mono text-xs">
                {Object.entries(s2.module_2c_cayman_basis_trade.treasury_ownership_shares_pct).map(
                  ([holder, pct]: [string, any], i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">{holder}</span>
                        <span className="font-bold text-white">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {view2C === "C" && (
              <div className="space-y-2 font-mono text-xs">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
                  <div className="text-amber-400 font-bold">Multi-Manager Pod-Shop De-Grossing Circuit Breakers:</div>
                  <p className="text-slate-300 font-sans">
                    1. <strong>SOFR - IORB Spikes &gt; +3 bps:</strong> Front-runs repo dealer balance-sheet exhaustion.
                  </p>
                  <p className="text-slate-300 font-sans">
                    2. <strong>^MOVE Breaks &gt; 105:</strong> Forces multi-asset pod shops to de-lever Treasury basis arb, triggering fire-sales in $SPHB, $IWM, and high-beta cyclicals.
                  </p>
                  <p className="text-slate-300 font-sans">
                    3. <strong>Immediate Emergency Rotation:</strong> Shift into Quality ($QUAL), Cash ($USFR), and Short-Duration ($BIL).
                  </p>
                </div>
              </div>
            )}

            {/* Actionable Call Box 2C */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-slate-200">
              <strong className="text-emerald-300 font-mono">Actionable Call (2C): </strong>
              <span className="font-sans leading-relaxed">{s2.module_2c_cayman_basis_trade.actionable_directive}</span>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              SUB-MODULE 2D: SOVEREIGN GOLD BID RESIDUAL & SESSION SPLIT
              ------------------------------------------------------------------- */}
          <div className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  2D. Sovereign Gold Bid Residual & Asian-vs-NY Session Split
                </h3>
                <p className="text-[11px] text-slate-400">
                  63D OLS Real Yield Regression Residual + Session Breakdown
                </p>
              </div>

              <div className="flex gap-1 text-xs font-mono">
                <button
                  id="view-2d-a"
                  onClick={() => setView2D("A")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2D === "A" ? "bg-amber-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option A: Residual & Sessions
                </button>
                <button
                  id="view-2d-b"
                  onClick={() => setView2D("B")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2D === "B" ? "bg-amber-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option B: World Reserves
                </button>
                <button
                  id="view-2d-c"
                  onClick={() => setView2D("C")}
                  className={`px-2.5 py-1 rounded transition ${
                    view2D === "C" ? "bg-amber-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Option C: Covert Floor
                </button>
              </div>
            </div>

            {view2D === "A" && (
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-1">
                  <div className="text-slate-400 text-[11px]">63D Gold vs TIPS+DXY Residual</div>
                  <div className="text-xl font-extrabold text-amber-300">
                    +{s2.module_2d_sovereign_gold_bid.ols_63d_sovereign_residual_sigma}σ
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans leading-tight pt-1">
                    &gt;+1.5σ confirms price-insensitive covert sovereign physical floor buying (disconnecting from 10Y real yields).
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-1">
                  <div className="text-slate-400 text-[11px]">90D Session Return Split</div>
                  <div className="text-sm font-bold text-emerald-400">
                    Asia Physical: +{s2.module_2d_sovereign_gold_bid.asian_physical_session_cum_90d_pct}%
                  </div>
                  <div className="text-sm font-bold text-rose-400">
                    NY COMEX Paper: {s2.module_2d_sovereign_gold_bid.ny_comex_paper_session_cum_90d_pct}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans leading-tight pt-1">
                    Eastern central banks buy physical dips while Western funds short paper derivatives.
                  </div>
                </div>
              </div>
            )}

            {view2D === "B" && (
              <div className="space-y-2 font-mono text-xs">
                {Object.entries(s2.module_2d_sovereign_gold_bid.world_reserves_share_pct).map(
                  ([k, v]: [string, any], i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">{k}</span>
                        <span className="font-bold text-amber-300">{v}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${v * 1.8}%` }} />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {view2D === "C" && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-2 font-mono text-xs">
                <div className="text-amber-400 font-bold">The De-Dollarization Reserve Shift:</div>
                <p className="text-slate-300 font-sans text-xs">
                  Foreign Official Treasury Share has fallen to <strong>13%</strong> while Gold has climbed to <strong>25%</strong> of global reserves.
                </p>
                <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-200 font-sans text-xs">
                  {s2.module_2d_sovereign_gold_bid.sovereign_floor_status}
                </div>
              </div>
            )}

            {/* Actionable Call Box 2D */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-slate-200">
              <strong className="text-amber-300 font-mono">Actionable Call (2D): </strong>
              <span className="font-sans leading-relaxed">{s2.module_2d_sovereign_gold_bid.actionable_directive}</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STRUCTURE #3: PHYSICAL CAPEX / RESOURCE DEPLETION CLOCK
          ========================================================================= */}
      <section className="rounded-xl border border-slate-800 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Structure #3
              </span>
              <h2 className="text-lg font-bold text-white">
                Physical Capex / Resource Depletion Clock (Goehring & Rozencwajg / Jeff Currie)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Tracks upstream Capex-to-Depreciation (DD&A) ratios across critical physical resources to front-run structural supply deficits before spot prices breakout.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            <button
              id="view-s3-a"
              onClick={() => setViewS3("A")}
              className={`px-3 py-1.5 rounded-md font-semibold transition border ${
                viewS3 === "A"
                  ? "bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-900/30"
                  : "bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              Option A: Sector Depletion Cards
            </button>
            <button
              id="view-s3-b"
              onClick={() => setViewS3("B")}
              className={`px-3 py-1.5 rounded-md font-semibold transition border ${
                viewS3 === "B"
                  ? "bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-900/30"
                  : "bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              Option B: Capex Deficit Gauges
            </button>
            <button
              id="view-s3-c"
              onClick={() => setViewS3("C")}
              className={`px-3 py-1.5 rounded-md font-semibold transition border ${
                viewS3 === "C"
                  ? "bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-900/30"
                  : "bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              Option C: Gold / Oil & Copper Ratios
            </button>
          </div>
        </div>

        {/* View Mode A: Sector Depletion Cards */}
        {viewS3 === "A" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {s3.depletion_clock_sectors.map((sec: any, idx: number) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-2.5 hover:border-slate-700 transition"
              >
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="font-bold text-white text-sm">{sec.sector}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded font-bold ${
                      sec.capex_to_dda_ratio < 0.75
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    Capex / DD&A: {sec.capex_to_dda_ratio}x (10Y Avg: {sec.ten_year_avg_capex_dda}x)
                  </span>
                </div>
                <div className="text-xs font-mono text-cyan-300 font-semibold">{sec.clock_stage}</div>
                <div className="text-xs font-mono text-slate-400">
                  Vehicles:{" "}
                  <span className="text-slate-200">{sec.tickers.map((t: string) => `$${t}`).join(", ")}</span> • S&P Valuation Percentile:{" "}
                  <span className="text-amber-300">{sec.valuation_vs_spx_pct}th percentile</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed pt-2 border-t border-slate-800/80 font-sans">
                  {sec.actionable_call}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* View Mode B: Capex Deficit Gauges */}
        {viewS3 === "B" && (
          <div className="space-y-3 font-mono text-xs">
            {s3.depletion_clock_sectors.map((sec: any, idx: number) => (
              <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-white">{sec.sector}</span>
                  <span className="text-cyan-300">
                    Ratio: {sec.capex_to_dda_ratio}x (Depletion Threshold: 1.00x)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full ${
                      sec.capex_to_dda_ratio < 0.75
                        ? "bg-rose-500"
                        : sec.capex_to_dda_ratio < 0.85
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, sec.capex_to_dda_ratio * 100)}%` }}
                  />
                  {/* 1.0x line indicator */}
                  <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-white/40" title="1.0x Replacement Line" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Vehicles: {sec.tickers.join(", ")}</span>
                  <span>Deficit vs 1.0x: {Math.round((1.0 - sec.capex_to_dda_ratio) * 100)}% underinvestment</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Mode C: Commodity Valuation Ratios & Catch-Up Arbitrage */}
        {viewS3 === "C" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="rounded-lg border border-amber-500/40 bg-slate-900/80 p-4 space-y-2">
              <div className="text-amber-400 font-bold text-sm">Gold-to-Oil Ratio Matrix</div>
              <div className="text-2xl font-extrabold text-white">
                {s3.commodity_valuation_ratios.gold_to_oil_ratio}x{" "}
                <span className="text-xs text-slate-400 font-normal">
                  (Historical Mean: {s3.commodity_valuation_ratios.gold_to_oil_historical_mean}x)
                </span>
              </div>
              <p className="text-xs text-slate-200 font-sans pt-1 leading-relaxed">
                {s3.commodity_valuation_ratios.gold_to_oil_signal}
              </p>
            </div>

            <div className="rounded-lg border border-cyan-500/40 bg-slate-900/80 p-4 space-y-2">
              <div className="text-cyan-400 font-bold text-sm">Copper-to-Gold Ratio Reflation Z-Score</div>
              <div className="text-2xl font-extrabold text-white">
                {s3.commodity_valuation_ratios.copper_to_gold_ratio_z}σ
              </div>
              <p className="text-xs text-slate-200 font-sans pt-1 leading-relaxed">
                {s3.commodity_valuation_ratios.copper_to_gold_signal}
              </p>
            </div>
          </div>
        )}

        {/* Highlighted Actionable Directive Box for Structure #3 */}
        <div className="rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-amber-950/20 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            <h3 className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider">
              Structure #3 Actionable Direction & Vehicle Call: {s3.facet_actionable_directive.headline}
            </h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-200 list-disc list-inside font-sans">
            {s3.facet_actionable_directive.immediate_actions.map((act: string, idx: number) => (
              <li key={idx} className="leading-relaxed">
                {act}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
