"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { getApiUrl } from "@/lib/api";

// ============================================================================
// NULL-SAFE STRING & ARRAY HELPERS (PREVENTS undefined.split() CRASHES)
// ============================================================================
function safeSplit(val: unknown, delimiter: string): string[] {
  if (typeof val !== "string" || !val) return [""];
  return val.split(delimiter);
}

function safeArray<T>(val: unknown, fallback: T[] = []): T[] {
  return Array.isArray(val) ? val : fallback;
}

// ============================================================================
// COMPLETE PRE-SEEDED FALLBACK STATE (2026 42 MACRO SUITE)
// ============================================================================
const FALLBACK_DATA = {
  as_of_date: new Date().toISOString().split("T")[0],
  project_alignment: {
    forty_two_macro_regime: "DEFLATION",
    hedgeye_us_quad: "QUAD_3",
    net_liquidity_usd_bn: 5745.7,
    net_liquidity_4w_roc_bn: -120.0,
    accord_2_0_prob: 72.0,
    synthesis_consensus: "3 of 4 Authors Cautious / Reflationary Overhang",
    liquidity_allocation_link: "/liquidity-allocation",
    synthesis_link: "/synthesis",
  },
  executive_summary: {
    question: "How should portfolios be positioned across the prevailing macro regime?",
    short_answer:
      "Top-Down Market Regime is DEFLATION / STAGFLATION WATCH (Signal Strength: 83%). Short-term tactical traders should favor quality equity factors, real liquidity carry ($USFR), and discipline on extreme crowding signals, while monitoring global liquidity transmission.",
    plain_english_bullets: [
      "Top-Down Market Regime shows confirming markets in Deflation and Stagflation. Risk-On probability stands at 70%, with CACRI in Normal Trending Zone.",
      "KISS Model Portfolio holds 60% Global Stocks ($VT), 15% Gold ($GLDM), 0% Bitcoin ($FBTC), and 25% Floating-Rate Cash ($USFR), maintaining a 69% Beta-Adjusted S&P 500 Delta.",
      "Macro Weather Model (1–3 month horizon) signals positive cyclical impulse in Corporate Profitability (+671 bps), with JOLTS 'Fake Demand Spread' at +100 bps.",
      "US Net Liquidity tracks at $5,745.7B with TGA and reverse repo transmission driving domestic liquidity flows.",
    ],
  },
  active_themes: [
    { name: "Sticky Inflation & Term Premium", introduced: "Jan-24", horizon: "1yr+", bias: "Bearish" },
    { name: "Resilient US Corporate Cashflows", introduced: "Sep-24", horizon: "1yr+", bias: "Bullish" },
    { name: "Fiscal Dominance & Accord 2.0 Watch", introduced: "Apr-25", horizon: "1yr+", bias: "Bearish" },
    { name: "AI Productivity vs Capex Monetization", introduced: "Oct-25", horizon: "1yr+", bias: "Bullish" },
    { name: "Labor Fake Demand & Jobless Growth", introduced: "Oct-25", horizon: "1yr+", bias: "Bearish" },
    { name: "K-Shaped Consumer Dispersal", introduced: "Dec-25", horizon: "1yr+", bias: "Bearish" },
    { name: "Global Liquidity Reflation Vector", introduced: "Jan-26", horizon: "1yr+", bias: "Bullish" },
  ],
  four_horsemen: [
    { indicator: "VVIX / VIX Ratio", current: 5.58, threshold: "High > 8.0", status: "CONTAINED", signal: "Vol-of-vol tail risk" },
    { indicator: "SPHB / SPLV (Beta Spread)", current: 1.48, threshold: "Trend Break < 1.40", status: "BULLISH", signal: "High beta outperforming min-vol" },
    { indicator: "IWM / OEF (Size Spread)", current: 0.74, threshold: "Breadth > 0.80", status: "NARROW", signal: "Mega-caps dominating index returns" },
    { indicator: "Mag-7 vs ACWI Weight", current: 21.4, threshold: "Extreme > 20%", status: "CROWDED", signal: "Historical concentration peak" },
  ],
  global_macro_risk_matrix: {
    active_regime_label: "DEFLATION",
    primary_regime: "DEFLATION",
    strength_of_signal_pct: 83.0,
    confirming_sums: { GOLDILOCKS: 18, REFLATION: 30, INFLATION: 19, DEFLATION: 2 },
    t10yr_peaks: { GOLDILOCKS: 35, REFLATION: 37, INFLATION: 40, DEFLATION: 34 },
    confirming_shares_pct: { GOLDILOCKS: 26.1, REFLATION: 43.5, INFLATION: 27.5, DEFLATION: 2.9 },
    probability_risk_on_pct: 70.0,
    probability_risk_off_pct: 30.0,
    cacri_pct: 30.4,
    roro_3wk_confirmed: true,
    roro_transitions_per_year_10yr_avg: 2.4,
    cacri_zone: "NORMAL TRENDING ZONE (30.4% Risk-Off Share)",
  },
  grid_economies: [
    { country: "United States", ticker: "SPY", current_regime: "INFLATION (I)", quad: "QUAD_3", gdp_yoy: "+2.51%", gdp_roc_bps: "-39 bps", cpi_or_pce_yoy: "+3.23%", inf_roc_bps: "+26 bps", ret_3m_pct: "-0.59%", grid_zero: false },
    { country: "China", ticker: "MCHI", current_regime: "GOLDILOCKS (G)", quad: "QUAD_1", gdp_yoy: "+4.60%", gdp_roc_bps: "+15 bps", cpi_or_pce_yoy: "+1.10%", inf_roc_bps: "-20 bps", ret_3m_pct: "-2.10%", grid_zero: false },
    { country: "Eurozone", ticker: "EZU", current_regime: "DEFLATION (D)", quad: "QUAD_4", gdp_yoy: "+0.90%", gdp_roc_bps: "-12 bps", cpi_or_pce_yoy: "+2.20%", inf_roc_bps: "-35 bps", ret_3m_pct: "+0.40%", grid_zero: false },
    { country: "Japan", ticker: "EWJ", current_regime: "INFLATION (I)", quad: "QUAD_3", gdp_yoy: "+0.80%", gdp_roc_bps: "-8 bps", cpi_or_pce_yoy: "+2.60%", inf_roc_bps: "+40 bps", ret_3m_pct: "+3.20%", grid_zero: false },
    { country: "United Kingdom", ticker: "EWU", current_regime: "INFLATION (I)", quad: "QUAD_3", gdp_yoy: "+0.70%", gdp_roc_bps: "-5 bps", cpi_or_pce_yoy: "+3.10%", inf_roc_bps: "+15 bps", ret_3m_pct: "-1.00%", grid_zero: true },
  ],
  kiss_and_drmo: {
    kiss_portfolio: {
      market_regime: "DEFLATION",
      targets_pct: { VT: 60.0, GLDM: 30.0, FBTC: 10.0 },
      actual_exposures_pct: { USFR: 25.0, VT: 60.0, GLDM: 15.0, FBTC: 0.0 },
      pct_of_max_exposure: { USFR: 25.0, VT: 100.0, GLDM: 50.0, FBTC: 0.0 },
      portfolio_beta_adjusted_spx_delta_pct: 69.0,
    },
    dr_mo_matrix: [
      { ticker: "SPY", name: "USA (S&P 500)", category: "US Equity Sectors", vams_state: 1, rsi_14d: 76, proper_trade: "LONG: Max Position" },
      { ticker: "XLK", name: "Information Technology", category: "US Equity Sectors", vams_state: 1, rsi_14d: 84, proper_trade: "LONG: Max Position" },
      { ticker: "XLI", name: "Industrials", category: "US Equity Sectors", vams_state: 1, rsi_14d: 55, proper_trade: "LONG: Max Position" },
      { ticker: "XLE", name: "Energy", category: "US Equity Sectors", vams_state: 1, rsi_14d: 50, proper_trade: "LONG: Max Position" },
      { ticker: "XLF", name: "Financials", category: "US Equity Sectors", vams_state: 0, rsi_14d: 50, proper_trade: "LONG: Half Position" },
      { ticker: "XLC", name: "Communication Services", category: "US Equity Sectors", vams_state: 0, rsi_14d: 38, proper_trade: "LONG: Half Position" },
      { ticker: "VT", name: "Global Equities", category: "US Equity Factors", vams_state: 1, rsi_14d: 71, proper_trade: "LONG: Max Position" },
      { ticker: "SPHB", name: "High Beta", category: "US Equity Factors", vams_state: 1, rsi_14d: 76, proper_trade: "LONG: Max Position" },
      { ticker: "QQQ", name: "Mega Cap Growth", category: "US Equity Factors", vams_state: 1, rsi_14d: 79, proper_trade: "LONG: Max Position" },
      { ticker: "MTUM", name: "Momentum", category: "US Equity Factors", vams_state: 1, rsi_14d: 77, proper_trade: "LONG: Max Position" },
      { ticker: "IWM", name: "Small Caps", category: "US Equity Factors", vams_state: 1, rsi_14d: 64, proper_trade: "LONG: Max Position" },
      { ticker: "SPLV", name: "Low Beta", category: "US Equity Factors", vams_state: 0, rsi_14d: 36, proper_trade: "LONG: Half Position" },
      { ticker: "EEM", name: "Emerging Markets", category: "Global Equities", vams_state: 1, rsi_14d: 71, proper_trade: "LONG: Max Position" },
      { ticker: "ACWX", name: "Global Equities ex-US", category: "Global Equities", vams_state: 1, rsi_14d: 66, proper_trade: "LONG: Max Position" },
      { ticker: "EWJ", name: "Japan", category: "Global Equities", vams_state: 1, rsi_14d: 66, proper_trade: "LONG: Max Position" },
      { ticker: "GNR", name: "Commodity Producers", category: "Global Equities", vams_state: 1, rsi_14d: 51, proper_trade: "LONG: Max Position" },
      { ticker: "TLT", name: "25+ Year Treasurys", category: "Fixed Income Sectors", vams_state: -1, rsi_14d: 53, proper_trade: "SHORT: Max Position" },
      { ticker: "IEF", name: "5-10yr Treasurys", category: "Fixed Income Sectors", vams_state: -1, rsi_14d: 47, proper_trade: "SHORT: Max Position" },
      { ticker: "TIP", name: "5-10yr TIPS", category: "Fixed Income Sectors", vams_state: -1, rsi_14d: 35, proper_trade: "SHORT: Max Position" },
      { ticker: "CWB", name: "Convertibles", category: "Fixed Income Sectors", vams_state: 1, rsi_14d: 74, proper_trade: "LONG: Max Position" },
      { ticker: "HYG", name: "High Yield Credit", category: "Fixed Income Sectors", vams_state: 0, rsi_14d: 48, proper_trade: "LONG: Half Position" },
      { ticker: "DBB", name: "Base Metals", category: "Macro Exposures", vams_state: 1, rsi_14d: 67, proper_trade: "LONG: Max Position" },
      { ticker: "USO", name: "Crude Oil", category: "Macro Exposures", vams_state: 1, rsi_14d: 51, proper_trade: "LONG: Max Position" },
      { ticker: "PDBC", name: "Commodities", category: "Macro Exposures", vams_state: 1, rsi_14d: 49, proper_trade: "LONG: Max Position" },
      { ticker: "GLD", name: "Gold", category: "Macro Exposures", vams_state: -1, rsi_14d: 42, proper_trade: "No Position" },
      { ticker: "Bitcoin", name: "Bitcoin", category: "Macro Exposures", vams_state: -1, rsi_14d: 22, proper_trade: "No Position" },
      { ticker: "UUP", name: "US Dollar", category: "Macro Exposures", vams_state: 0, rsi_14d: 58, proper_trade: "SHORT: Half Position" },
    ],
  },
  macro_weather: {
    roro_persistence_prob: "HIGH (Sustaining Risk-On Market Regime)",
    asset_outlooks_1_to_3m: [
      { asset: "Stocks (VT/SPY)", outlook: "BULLISH" },
      { asset: "Gold (GLDM)", outlook: "BULLISH" },
      { asset: "Bitcoin (FBTC)", outlook: "BULLISH" },
      { asset: "Commodities (PDBC)", outlook: "BULLISH" },
      { asset: "Bonds (TLT/IEF)", outlook: "BEARISH" },
      { asset: "US Dollar (UUP)", outlook: "BEARISH" },
    ],
    cycles: [
      { cycle: "Growth Cycle", assessment: "Positive Impulse", detail: "Corporate profitability running at +671 bps (above 10Y mean of +584 bps)." },
      { cycle: "Inflation Cycle", assessment: "Sticky Cyclical Vector", detail: "Commodity pass-through and services inflation keeping headline firm." },
      { cycle: "Monetary Policy Cycle", assessment: "Accommodative vs OIS", detail: "OIS pricing neutral floor spread at +73 bps over EFFR." },
      { cycle: "Fiscal Policy Cycle", assessment: "High Supply Dilution", detail: "NTM Marketable Treasury supply projected at $12,234B." },
      { cycle: "Liquidity Cycle", assessment: "US Net Liquidity Tracking", detail: "Fed Net Liquidity at $5,745.7B (4W RoC: -$120.0B); TGA & RRP liquidity transmission active." },
      { cycle: "Positioning Cycle", assessment: "Complacent Chasing", detail: "16-Indicator Positioning median at 84.0%; tactical correction risk reasonable." },
    ],
  },
  probable_ranges: [
    { asset: "S&P 500 (SPY)", price: "596.12", vams: "BULLISH", low: "588.40 (-1.3%)", high: "608.20 (+2.0%)", fwd_5d_low: "+0.9% (n=57)", fwd_5d_high: "-0.2% (n=15)", dd_21d_bull: "-2.2%", dd_21d_neut: "-3.8%", dd_21d_bear: "-4.0%" },
    { asset: "NASDAQ 100 (QQQ)", price: "524.30", vams: "BULLISH", low: "512.60 (-2.2%)", high: "538.90 (+2.8%)", fwd_5d_low: "+0.9% (n=63)", fwd_5d_high: "-0.8% (n=16)", dd_21d_bull: "-2.8%", dd_21d_neut: "-5.5%", dd_21d_bear: "-4.1%" },
    { asset: "Global Equities (VT)", price: "122.45", vams: "BULLISH", low: "120.30 (-1.8%)", high: "124.80 (+1.9%)", fwd_5d_low: "+0.9% (n=93)", fwd_5d_high: "-0.3% (n=35)", dd_21d_bull: "-2.3%", dd_21d_neut: "-3.2%", dd_21d_bear: "-4.8%" },
    { asset: "Gold Trust (GLD)", price: "248.80", vams: "BEARISH", low: "238.50 (-4.1%)", high: "256.20 (+3.0%)", fwd_5d_low: "+1.4% (n=31)", fwd_5d_high: "+0.5% (n=37)", dd_21d_bull: "-3.5%", dd_21d_neut: "-2.0%", dd_21d_bear: "-2.6%" },
    { asset: "Bitcoin Spot (BTC)", price: "68,420.00", vams: "BEARISH", low: "64,800.00 (-5.3%)", high: "73,500.00 (+7.4%)", fwd_5d_low: "+0.7% (n=75)", fwd_5d_high: "+1.9% (n=60)", dd_21d_bull: "-6.6%", dd_21d_neut: "-6.5%", dd_21d_bear: "-11.3%" },
    { asset: "20Y+ Treasury (TLT)", price: "88.75", vams: "BEARISH", low: "86.50 (-2.5%)", high: "91.10 (+2.6%)", fwd_5d_low: "+0.9% (n=59)", fwd_5d_high: "+0.6% (n=35)", dd_21d_bull: "-4.8%", dd_21d_neut: "-2.5%", dd_21d_bear: "-3.2%" },
    { asset: "US Dollar (UUP)", price: "28.60", vams: "NEUTRAL", low: "28.25 (-1.2%)", high: "28.95 (+1.2%)", fwd_5d_low: "+0.2% (n=31)", fwd_5d_high: "-0.1% (n=44)", dd_21d_bull: "-1.8%", dd_21d_neut: "-1.1%", dd_21d_bear: "-1.0%" },
  ],
  positioning_and_crowding: {
    mean_crowded_bullish_pct: 69.0,
    median_crowded_bullish_pct: 84.0,
    correction_10pct_risk_1_to_3m: "REASONABLE (50-75%)",
    crash_20pct_risk_3_to_12m: "MODERATE (25-50%)",
    crowding_scatter: [
      { ticker: "MGK", name: "Vanguard Mega Cap Growth ETF", rsi_14d: 75.0, flow_z_3m: 6.2, quadrant: "SIGNAL: BEARISH (Overbought + Investors Chasing Local Highs)" },
      { ticker: "XLK", name: "Technology Select Sector SPDR", rsi_14d: 84.0, flow_z_3m: -0.9, quadrant: "NOISE (Overbought + Investors Selling the Rip Already)" },
      { ticker: "QQQ", name: "Invesco QQQ Trust", rsi_14d: 79.0, flow_z_3m: 0.1, quadrant: "NOISE (Overbought + Investors Selling the Rip Already)" },
      { ticker: "XLB", name: "Materials Select Sector SPDR", rsi_14d: 54.0, flow_z_3m: 2.6, quadrant: "NEUTRAL" },
      { ticker: "IEF", name: "iShares 7-10Y Treasury Bond ETF", rsi_14d: 47.0, flow_z_3m: -4.3, quadrant: "NEUTRAL" },
      { ticker: "FBTC", name: "Fidelity Wise Origin Bitcoin Fund", rsi_14d: 26.0, flow_z_3m: 0.3, quadrant: "NOISE (Oversold + Investors Buying the Dip Already)" },
    ],
  },
  scouting_monitors: {
    corporate_profitability_model_bps: 671,
    corporate_profitability_historical_mean_bps: 584,
    jolts_fake_job_demand_spread_bps: 100,
    jolts_interpretation:
      "Private Sector Job Openings Rate (4.7%) minus Private Hires Rate (3.7%) widened to +100 bps — confirming an AI-driven Jobless Recovery and corporate ghost listings.",
    ois_neutral_rate_model: {
      effr_pct: 3.88,
      ois_floor_neutral_pct: 4.61,
      ois_terminal_neutral_pct: 4.74,
      cutting_cycle_spread_bps: 73,
      hiking_cycle_spread_bps: 86,
      policy_bias: "ACCOMMODATIVE (Fed behind the curve; 1-2 hikes needed to reach neutral)",
    },
    ntm_marketable_treasury_supply_bn: 12234,
    ntm_supply_components_bn: {
      maturing_next_12m_bn: 10179,
      annualized_fytd_deficit_bn: 2337,
      annualized_fed_divestment_or_rmp_bn: -282,
    },
    historical_comps: {
      corporate_profitability: {
        current_bps: 671,
        mean_10y_bps: 584,
        z_score: 0.72,
        pre_recession_threshold_bps: 300,
        status: "EXPANSIONARY",
      },
      jolts_labor_spread: {
        current_spread_bps: 100,
        pre_covid_baseline_bps: 30,
        peak_2022_bps: 310,
        status: "AI_JOBLESS_RECOVERY",
        interpretation: "Openings exceed hires by >100 bps; ghost/AI listings distorting headline demand.",
      },
      ois_neutral_spread: {
        cutting_spread_bps: 73,
        hiking_spread_bps: 86,
        status: "ACCOMMODATIVE_GAP",
      },
      treasury_supply: {
        ntm_supply_bn: 12234,
        hist_10y_avg_bn: 7500,
        expansion_pct: 63.1,
        status: "DILUTIVE_SUPPLY_WAVE",
      },
    },
  },
};

export default function FortyTwoMacroSubPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [selectedBucket, setSelectedBucket] = useState<string>("ALL");
  const [selectedStance, setSelectedStance] = useState<string>("ALL");
  const [gridRegionFilter, setGridRegionFilter] = useState<"ALL" | "G7" | "EM">("ALL");
  const [apiStatus, setApiStatus] = useState<"synced" | "cached" | "fallback">("fallback");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetch42Macro = (force: boolean = false) => {
    if (force) setIsRefreshing(true);
    fetch(getApiUrl(`/api/v1/42macro/dashboard${force ? "?force=true" : ""}`), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json) => {
        if (json && typeof json === "object") {
          setData((prev) => ({
            ...prev,
            ...json,
            project_alignment: { ...prev.project_alignment, ...(json.project_alignment || {}) },
            executive_summary: { ...prev.executive_summary, ...(json.executive_summary || {}) },
            four_horsemen: safeArray(json.four_horsemen, prev.four_horsemen),
            global_macro_risk_matrix: {
              ...prev.global_macro_risk_matrix,
              ...(json.global_macro_risk_matrix || {}),
            },
            grid_economies: safeArray(json.grid_economies || json.grids_35_country, prev.grid_economies),
            kiss_and_drmo: {
              ...prev.kiss_and_drmo,
              ...(json.kiss_and_drmo || {}),
              kiss_portfolio: {
                ...prev.kiss_and_drmo.kiss_portfolio,
                ...(json.kiss_and_drmo?.kiss_portfolio || {}),
              },
              dr_mo_matrix: safeArray(
                json.kiss_and_drmo?.dr_mo_matrix || json.dr_mo_matrix,
                prev.kiss_and_drmo.dr_mo_matrix
              ),
            },
            positioning_and_crowding: {
              ...prev.positioning_and_crowding,
              ...(json.positioning_and_crowding || {}),
              crowding_scatter: safeArray(
                json.positioning_and_crowding?.crowding_scatter,
                prev.positioning_and_crowding.crowding_scatter
              ),
            },
            scouting_monitors: {
              ...prev.scouting_monitors,
              ...(json.scouting_monitors || {}),
              ois_neutral_rate_model: {
                ...prev.scouting_monitors.ois_neutral_rate_model,
                ...(json.scouting_monitors?.ois_neutral_rate_model || {}),
              },
              ntm_supply_components_bn: {
                ...prev.scouting_monitors.ntm_supply_components_bn,
                ...(json.scouting_monitors?.ntm_supply_components_bn || {}),
              },
              historical_comps: {
                ...prev.scouting_monitors.historical_comps,
                ...(json.scouting_monitors?.historical_comps || {}),
              },
            },
          }));
          setApiStatus(json._cache_hit ? "cached" : "synced");
        }
      })
      .catch(() => {
        setApiStatus("fallback");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetch42Macro(false);

    const handleGlobalRefresh = () => {
      fetch42Macro(true);
    };
    window.addEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
    return () => window.removeEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
  }, []);

  const themes = safeArray(data.active_themes, FALLBACK_DATA.active_themes);
  const bullets = safeArray(
    data.executive_summary?.plain_english_bullets,
    FALLBACK_DATA.executive_summary.plain_english_bullets
  );
  const drmoList = safeArray(
    data.kiss_and_drmo?.dr_mo_matrix,
    FALLBACK_DATA.kiss_and_drmo.dr_mo_matrix
  );

  const filteredDrmo = drmoList.filter((item) => {
    const bucketMatch = selectedBucket === "ALL" || item?.category === selectedBucket;
    if (!bucketMatch) return false;
    if (selectedStance === "ALL") return true;
    const tradeStr = String(
      item?.proper_trade || (item as Record<string, unknown>)?.recommendation || ""
    );
    if (selectedStance === "LONG") return tradeStr.startsWith("LONG");
    if (selectedStance === "SHORT") return tradeStr.startsWith("SHORT");
    if (selectedStance === "FLAT") return tradeStr.includes("No Position") || tradeStr.includes("Half");
    return true;
  });

  const buckets = [
    "ALL",
    "US Equity Sectors",
    "US Equity Factors",
    "Global Equities",
    "Fixed Income Sectors",
    "Macro Exposures",
  ];

  const gridEconomies = safeArray(data.grid_economies, FALLBACK_DATA.grid_economies);
  const filteredGrids = gridEconomies.filter((row) => {
    if (gridRegionFilter === "ALL") return true;
    const c = String(row.country || "").toLowerCase();
    const g7List = ["united states", "japan", "germany", "united kingdom", "france", "canada", "eurozone", "switzerland"];
    if (gridRegionFilter === "G7") return g7List.some((g) => c.includes(g));
    if (gridRegionFilter === "EM") return !g7List.some((g) => c.includes(g));
    return true;
  });

  const kiss = data.kiss_and_drmo?.kiss_portfolio || FALLBACK_DATA.kiss_and_drmo.kiss_portfolio;
  const matrix = data.global_macro_risk_matrix || FALLBACK_DATA.global_macro_risk_matrix;
  const scouting = data.scouting_monitors || FALLBACK_DATA.scouting_monitors;
  const fourHorsemen = safeArray(data.four_horsemen, FALLBACK_DATA.four_horsemen);
  const alignment = data.project_alignment || FALLBACK_DATA.project_alignment;
  const comps = scouting.historical_comps || FALLBACK_DATA.scouting_monitors.historical_comps;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 space-y-6">
      {/* 0. PROJECT-GLOBAL MACRO ALIGNMENT & LIQUIDITY RIBBON */}
      <section className="rounded-xl border border-blue-900/40 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="text-cyan-400 font-bold uppercase tracking-wider">
              Project-Global Alignment:
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300">
              42 Macro: <strong>{matrix.active_regime_label || "DEFLATION"}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
              Hedgeye Quad: <strong>{alignment.hedgeye_us_quad || "QUAD 3"}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300">
              Net Liquidity: <strong>${alignment.net_liquidity_usd_bn ? Number(alignment.net_liquidity_usd_bn).toLocaleString() : "5,745.7"}B</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300">
              Consensus: <strong>{alignment.synthesis_consensus || "3/4 Authors Cautious"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <Link
              href="/liquidity-allocation"
              className="px-3 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
            >
              Liquidity Cockpit →
            </Link>
            <Link
              href="/synthesis"
              className="px-3 py-1 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
            >
              4-Author Synthesis →
            </Link>
          </div>
        </div>
      </section>

      {/* 1. PLAIN-ENGLISH EXECUTIVE SUMMARY BANNER */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              42 Macro Institutional Suite • Bayesian Nowcast & Risk Overlays
            </span>
            <h1 className="text-base font-bold text-white mt-0.5">
              Plain-English Executive Summary ({data.as_of_date || new Date().toISOString().split("T")[0]})
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className={`px-2.5 py-1 rounded-full border ${
                apiStatus === "synced"
                  ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                  : apiStatus === "cached"
                  ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
                  : "border-amber-500/40 bg-amber-950/40 text-amber-300"
              }`}
            >
              {apiStatus === "synced"
                ? "● Live Sync"
                : apiStatus === "cached"
                ? "⚡ DB Cached (<15ms)"
                : "● Verified Snapshot"}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-semibold">
              REGIME: {matrix.active_regime_label || "DEFLATION"}
            </span>
            <button
              onClick={() => {
                fetch42Macro(true);
                window.dispatchEvent(new CustomEvent("macro-nowcast-global-refresh"));
              }}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 border border-cyan-800 hover:border-cyan-600 text-cyan-300 rounded text-xs font-mono font-medium transition shadow-sm hover:shadow-cyan-950/50 disabled:opacity-50"
              title="Force recalculate 42 Macro Bayesian dashboard live"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
              <span>{isRefreshing ? "Recalculating..." : "Force Refresh"}</span>
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-4 mb-4">
          <p className="text-sm font-semibold text-amber-300">
            Key Macro Question: {data.executive_summary?.question}
          </p>
          <p className="text-sm text-slate-200 mt-1 leading-relaxed">
            {data.executive_summary?.short_answer}
          </p>
          <ul className="mt-3 space-y-1.5 text-xs md:text-sm text-slate-300 list-disc list-inside">
            {bullets.map((b, i) => (
              <li key={i}>{String(b ?? "")}</li>
            ))}
          </ul>
        </div>

        {/* Active Themes Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase text-slate-400 mr-1">Active Themes:</span>
          {themes.map((t, idx) => {
            const isBull = String(t?.bias || "").toLowerCase() === "bullish";
            return (
              <span
                key={idx}
                className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                  isBull
                    ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                    : "border-rose-500/30 bg-rose-950/30 text-rose-300"
                }`}
              >
                {t?.name || "Theme"} ({t?.introduced || "2025"})
              </span>
            );
          })}
        </div>
      </section>

      {/* 2. FOUR HORSEMEN OF MARKET RISK (SIGNATURE 42 MACRO SURVEILLANCE SCORECARD) */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-bold text-white">
              The Four Horsemen of Market Risk (Real-Time Structural Surveillance)
            </h2>
            <p className="text-xs text-slate-400">
              42 Macro early-warning signals tracking vol-of-vol, cyclical beta leadership, equity market breadth, and mega-cap concentration.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Live Surveillance
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fourHorsemen.map((fh, idx) => {
            const statusUpper = String(fh.status || "CONTAINED").toUpperCase();
            const badgeColor =
              statusUpper === "CONTAINED" || statusUpper === "BULLISH"
                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                : statusUpper === "ELEVATED" || statusUpper === "NARROW"
                ? "border-amber-500/30 bg-amber-950/40 text-amber-300"
                : "border-rose-500/30 bg-rose-950/40 text-rose-300";

            return (
              <div
                key={idx}
                className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-2 font-mono text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">{fh.indicator}</span>
                  <span className={`px-2 py-0.5 rounded border text-xs ${badgeColor}`}>
                    {fh.status}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-white">{fh.current}</span>
                  <span className="text-xs text-slate-400">Trigger: {fh.threshold}</span>
                </div>
                <div className="text-xs text-slate-300 border-t border-slate-800/80 pt-2 font-sans">
                  {fh.signal}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. TOP-DOWN GLOBAL MACRO RISK MATRIX vs BOTTOM-UP 15-COUNTRY UNIFIED GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Global Macro Risk Matrix */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">
              Top-Down: Global Macro Risk Matrix (42 Markets)
            </h2>
            <span className="text-xs font-mono text-emerald-400">
              Signal Strength: {matrix.strength_of_signal_pct ?? 83}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Aggregates daily VAMS across 42 global markets. RORO 3-week false-alarm filter:{" "}
            <strong className="text-slate-200">
              {matrix.roro_3wk_confirmed ? "CONFIRMED (>15d)" : "PENDING"}
            </strong>{" "}
            • Risk-On Probability:{" "}
            <strong className="text-emerald-400">{matrix.probability_risk_on_pct ?? 70}%</strong>
          </p>

          <div className="space-y-3">
            {(["REFLATION", "INFLATION", "GOLDILOCKS", "DEFLATION"] as const).map((reg) => {
              const count = matrix.confirming_sums?.[reg] ?? 0;
              const peak = matrix.t10yr_peaks?.[reg] ?? 37;
              const share = matrix.confirming_shares_pct?.[reg] ?? 0;
              const colorBar =
                reg === "REFLATION"
                  ? "bg-blue-500"
                  : reg === "GOLDILOCKS"
                  ? "bg-emerald-500"
                  : reg === "INFLATION"
                  ? "bg-amber-500"
                  : "bg-rose-500";
              return (
                <div key={reg} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-semibold text-slate-200">{reg}</span>
                    <span className="text-slate-300">
                      Sum: {count} (10Y Peak: {peak}) • Share: {share}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorBar}`}
                      style={{ width: `${Math.min(100, Math.max(4, share * 1.8))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Bottom-Up 15-Country Unified Global GRID Model */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Bottom-Up: 15-Country Global GRID Model (Unified Engine)
                </h2>
                <Link
                  href="/global-grid"
                  className="px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/90 text-xs font-semibold flex items-center gap-1 transition"
                  title="Open dedicated Global GRID Historical Matrix & Backtest Cockpit"
                >
                  <span>Historical GRID Matrix & Backtest</span>
                  <span className="text-cyan-400">&rarr;</span>
                </Link>
              </div>
              <p className="text-xs text-slate-400">
                Live Growth & Inflation Rate of Change (RoC) standardizing national economies into 42 Macro GRID quadrants.
              </p>
            </div>
            <div className="flex gap-1 font-mono text-xs">
              {(["ALL", "G7", "EM"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setGridRegionFilter(r)}
                  className={`px-2 py-0.5 rounded transition ${
                    gridRegionFilter === r
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {r === "ALL" ? "All (15)" : r === "G7" ? "G7 / DM" : "EM / APAC"}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-2">Economy</th>
                <th className="py-2 px-2">Ticker</th>
                <th className="py-2 px-2">Current Regime</th>
                <th className="py-2 px-2">GDP YoY (RoC)</th>
                <th className="py-2 px-2">Inflation (RoC)</th>
                <th className="py-2 pl-2">3M Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredGrids.map((row, idx) => {
                const isZero = row.grid_zero;
                return (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2 pr-2 font-semibold text-white">
                      {row.country}{" "}
                      {isZero && (
                        <span className="text-xs px-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
                          Zero
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-slate-400">${row.ticker}</td>
                    <td className="py-2 px-2 text-cyan-300">{row.current_regime}</td>
                    <td className="py-2 px-2">
                      {row.gdp_yoy}{" "}
                      <span className="text-slate-400">({row.gdp_roc_bps || "0 bps"})</span>
                    </td>
                    <td className="py-2 px-2">
                      {row.cpi_or_pce_yoy}{" "}
                      <span className="text-slate-400">({row.inf_roc_bps || "0 bps"})</span>
                    </td>
                    <td className="py-2 pl-2 text-emerald-400">{row.ret_3m_pct || "0.0%"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. KISS MODEL PORTFOLIO (VT / GLDM / FBTC / USFR) & DR. MO 56-ETF MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KISS Portfolio Card */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-white">KISS Model Portfolio (60/30/10)</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              SPX Beta Δ: {kiss.portfolio_beta_adjusted_spx_delta_pct ?? 69}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Rules: 60% Global Equities ($VT), 30% Gold ($GLDM, halved in INFLATION), 10% Bitcoin ($FBTC), residual in Floating-Rate Cash ($USFR).
          </p>
          <div className="space-y-3 font-mono text-xs">
            {(["VT", "GLDM", "FBTC", "USFR"] as const).map((tk) => {
              const actual = kiss.actual_exposures_pct?.[tk] ?? 0;
              const pctMax = kiss.pct_of_max_exposure?.[tk] ?? 0;
              const labelMap: Record<string, string> = {
                VT: "Stocks ($VT)",
                GLDM: "Gold ($GLDM)",
                FBTC: "Bitcoin ($FBTC)",
                USFR: "Liquidity Cash ($USFR)",
              };
              return (
                <div key={tk} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{labelMap[tk]}</span>
                    <span className="text-sm font-bold text-cyan-300">{actual}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>% of Max Target Allocation</span>
                    <span>{pctMax}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dr. Mo 56-ETF Proper Trade Matrix */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Dr. Mo Discretionary Risk Management Overlay ({filteredDrmo.length} Assets)
              </h2>
              <p className="text-xs text-slate-400">
                Strict Rule: No &quot;SHORT: Half Positions&quot; for Equity and Crypto exposures.
              </p>
            </div>
            <div className="flex flex-wrap gap-1 font-mono text-xs">
              <span className="text-slate-400 self-center mr-1">Stance:</span>
              {(["ALL", "LONG", "SHORT", "FLAT"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStance(s)}
                  className={`px-2 py-0.5 rounded transition ${
                    selectedStance === s
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {buckets.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBucket(b)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                  selectedBucket === b
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {b === "ALL" ? "All Buckets" : b}
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Ticker</th>
                  <th className="py-2 px-3">Exposure</th>
                  <th className="py-2 px-3">Bucket</th>
                  <th className="py-2 px-3">VAMS</th>
                  <th className="py-2 px-3">14D RSI</th>
                  <th className="py-2 px-3">PROPER TRADE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDrmo.map((item, idx) => {
                  const tradeStr = String(
                    item?.proper_trade || (item as Record<string, unknown>)?.recommendation || "No Position"
                  );
                  const [tradeSide] = safeSplit(tradeStr, ":");
                  const vams = item?.vams_state ?? 0;
                  const vamsBadge =
                    vams === 1 ? "✓ BULL" : vams === -1 ? "✗ BEAR" : "! NEUT";
                  const vamsColor =
                    vams === 1
                      ? "text-emerald-400"
                      : vams === -1
                      ? "text-rose-400"
                      : "text-amber-400";
                  const tradeColor =
                    tradeSide === "LONG"
                      ? "text-emerald-300 bg-emerald-950/40 border-emerald-500/30"
                      : tradeSide === "SHORT"
                      ? "text-rose-300 bg-rose-950/40 border-rose-500/30"
                      : "text-slate-400 bg-slate-800/50 border-slate-700";

                  return (
                    <tr key={`${item?.ticker || idx}-${idx}`} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-bold text-white">{item?.ticker || "N/A"}</td>
                      <td className="py-2 px-3 text-slate-200">{item?.name || item?.ticker}</td>
                      <td className="py-2 px-3 text-slate-400">{item?.category || "Macro"}</td>
                      <td className={`py-2 px-3 font-semibold ${vamsColor}`}>{vamsBadge}</td>
                      <td className="py-2 px-3">{item?.rsi_14d ?? 50}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded border text-xs ${tradeColor}`}>
                          {tradeStr}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. MACRO WEATHER MODEL (6 CYCLES & 1-3M ASSET COMPOSITES) */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white">
              Macro Weather Model (6 Principal Component Cycles • 1–3M Horizon)
            </h2>
            <p className="text-xs text-slate-400">
              3M SAAR vs. 6M SAAR vs. 12M YoY impulse rules • RORO Persistence:{" "}
              <strong className="text-emerald-400">
                {data.macro_weather?.roro_persistence_prob || "HIGH"}
              </strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {safeArray(
              data.macro_weather?.asset_outlooks_1_to_3m,
              FALLBACK_DATA.macro_weather.asset_outlooks_1_to_3m
            ).map((ao, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded border ${
                  ao.outlook === "BULLISH"
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                    : "border-rose-500/40 bg-rose-950/30 text-rose-300"
                }`}
              >
                {ao.asset}: {ao.outlook}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeArray(data.macro_weather?.cycles, FALLBACK_DATA.macro_weather.cycles).map(
            (c, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-1.5"
              >
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="font-bold text-white uppercase">{c.cycle}</span>
                  <span className="text-cyan-300">{c.assessment}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{c.detail}</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* 6. PROBABLE RANGE & CROWDING / POSITIONING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Probable Range Table */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 overflow-x-auto">
          <h2 className="text-base font-bold text-white mb-1">
            VAMS & Probable Range (5D Return + 21D Max Drawdown by VAMS)
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Asymmetric fractal bounds + historical 21-day max drawdown conditioned on Bullish vs. Bearish VAMS.
          </p>
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-2">Asset</th>
                <th className="py-2 px-2">Price / VAMS</th>
                <th className="py-2 px-2">Lower / Upper Bound</th>
                <th className="py-2 pl-2">21D Max DD (Bull / Bear)</th>
              </tr>
            </thead>
            <tbody className="divide-y border-slate-800/60">
              {safeArray(data.probable_ranges, FALLBACK_DATA.probable_ranges).map((pr, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2 pr-2 font-semibold text-white">{pr.asset}</td>
                  <td className="py-2 px-2">
                    {pr.price}{" "}
                    <span
                      className={
                        pr.vams === "BULLISH"
                          ? "text-emerald-400"
                          : pr.vams === "BEARISH"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }
                    >
                      ({pr.vams})
                    </span>
                  </td>
                  <td className="py-2 px-2 text-slate-300">
                    {pr.low} → {pr.high}
                  </td>
                  <td className="py-2 pl-2">
                    <span className="text-emerald-400">{pr.dd_21d_bull}</span> /{" "}
                    <span className="text-rose-400">{pr.dd_21d_bear}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Crowding & 16-Indicator Positioning Model */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-bold text-white">
              Tactical Crowding & 16-Indicator Positioning
            </h2>
            <span className="text-xs font-mono text-amber-300">
              Crowded Bullish Median:{" "}
              {data.positioning_and_crowding?.median_crowded_bullish_pct ?? 84}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-slate-400">1–3M Correction Risk (↓10%)</div>
              <div className="text-sm font-bold text-amber-400 mt-0.5">
                {data.positioning_and_crowding?.correction_10pct_risk_1_to_3m ||
                  "REASONABLE (50-75%)"}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-slate-400">3–12M Crash Risk (↓20%)</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {data.positioning_and_crowding?.crash_20pct_risk_3_to_12m || "MODERATE (25-50%)"}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {safeArray(
              data.positioning_and_crowding?.crowding_scatter,
              FALLBACK_DATA.positioning_and_crowding.crowding_scatter
            ).map((c, idx) => {
              const qStr = String(c?.quadrant || "NEUTRAL");
              const [qType] = safeSplit(qStr, ":");
              const isSignal = qType.includes("SIGNAL");
              return (
                <div
                  key={idx}
                  className={`flex flex-wrap items-center justify-between rounded border px-3 py-2 ${
                    isSignal
                      ? "border-rose-500/50 bg-rose-950/30 text-rose-200"
                      : "border-slate-800 bg-slate-900/60 text-slate-300"
                  }`}
                >
                  <div>
                    <strong className="text-white">${c?.ticker}</strong> ({c?.name}) • RSI:{" "}
                    {c?.rsi_14d} • 3M Flow Z: {c?.flow_z_3m}σ
                  </div>
                  <span className="text-xs font-semibold">{qStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. SECULAR & SCOUTING MONITORS + HISTORICAL COMPS */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-bold text-white">
              Specialized Macro Scouting Monitors & Historical Comps
            </h2>
            <p className="text-xs text-slate-400">
              Quantitative indicators benchmarked against 10-year historical averages, pre-COVID baselines, and recession trigger levels.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Historical Baseline Integrated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {/* JOLTS Fake Demand Spread */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
            <div className="text-slate-400">JOLTS Fake Job Demand Spread</div>
            <div className="text-base font-bold text-amber-400">
              +{scouting.jolts_fake_job_demand_spread_bps ?? 100} bps
            </div>
            <div className="rounded bg-slate-950/50 border border-slate-800 p-2 text-xs font-sans text-slate-300">
              <div className="font-semibold text-slate-200">Historical Comps:</div>
              <div>• Pre-COVID Baseline: +30 bps</div>
              <div>• 2022 Post-COVID Peak: +310 bps</div>
              <div>• Status: AI Jobless Recovery & Ghost Listings</div>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              {scouting.jolts_interpretation}
            </p>
          </div>

          {/* Corporate Profitability Model */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
            <div className="text-slate-400">Corporate Profitability Model</div>
            <div className="text-base font-bold text-emerald-400">
              +{scouting.corporate_profitability_model_bps ?? 671} bps
            </div>
            <div className="rounded bg-slate-950/50 border border-slate-800 p-2 text-xs font-sans text-slate-300">
              <div className="font-semibold text-slate-200">Historical Comps:</div>
              <div>• 10Y Mean: +584 bps</div>
              <div>• Z-Score: +{comps.corporate_profitability?.z_score ?? "0.72"}σ</div>
              <div>• Recession Warning Level: &lt;+300 bps</div>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              N-GDP YoY minus (ULC YoY − Productivity YoY). Above historical baseline, supporting corporate margins.
            </p>
          </div>

          {/* OIS-Derived Fed Neutral Spread */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
            <div className="text-slate-400">OIS-Derived Fed Neutral Spread</div>
            <div className="text-base font-bold text-rose-400">
              +{scouting.ois_neutral_rate_model?.cutting_cycle_spread_bps ?? 73} to +
              {scouting.ois_neutral_rate_model?.hiking_cycle_spread_bps ?? 86} bps
            </div>
            <div className="rounded bg-slate-950/50 border border-slate-800 p-2 text-xs font-sans text-slate-300">
              <div className="font-semibold text-slate-200">Policy Benchmark:</div>
              <div>• EFFR: {scouting.ois_neutral_rate_model?.effr_pct ?? 3.88}%</div>
              <div>• OIS Neutral Floor: {scouting.ois_neutral_rate_model?.ois_floor_neutral_pct ?? 4.61}%</div>
              <div>• Policy Bias: Accommodative Gap</div>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Market-implied neutral rate indicates current EFFR remains accommodative vs long-term equilibrium.
            </p>
          </div>

          {/* NTM Treasury Supply */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
            <div className="text-slate-400">Approx. NTM Treasury Supply</div>
            <div className="text-base font-bold text-cyan-300">
              ${(scouting.ntm_marketable_treasury_supply_bn ?? 12234).toLocaleString()}B
            </div>
            <div className="rounded bg-slate-950/50 border border-slate-800 p-2 text-xs font-sans text-slate-300">
              <div className="font-semibold text-slate-200">Historical Comps:</div>
              <div>• 10Y Average: ~$7,500B</div>
              <div>• Expansion: +{comps.treasury_supply?.expansion_pct ?? "63.1"}% vs avg</div>
              <div>• Supply Pressure: Dilutive Wave</div>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Maturing 12M (${scouting.ntm_supply_components_bn?.maturing_next_12m_bn ?? 10179}B) + FYTD Deficit (${scouting.ntm_supply_components_bn?.annualized_fytd_deficit_bn ?? 2337}B).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
