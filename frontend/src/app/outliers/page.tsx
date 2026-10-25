"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Filter,
  Search,
  Crosshair,
  RefreshCw,
  Compass,
  Zap,
  Activity,
  Layers,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type HorizonKey = "1_to_3_months" | "12_months" | "3_plus_years";

const FALLBACK_HORIZON_DATA: Record<HorizonKey, any> = {
  "1_to_3_months": {
    label: "1–3 Months (Immediate Horizon)",
    subtitle:
      "Tactical Coiled Springs, Probable Range Lower-Bound Bounces & Un-Crowded Breakouts",
    priority_1_unloved_pivots: [
      {
        ticker: "DBA / NTR",
        name: "Invesco DB Agriculture ETF & Nutrien Ltd.",
        asset_class: "Commodities / Ag Equities",
        pivot_score: 91.0,
        metrics: "14D RSI: 39 (Unloved) | COT Specs: 22nd Pct | VAMS: +1 (Fresh Bullish Flip)",
        why_pivoting:
          "Speculator COT positioning is washed out at the 22nd percentile and 14D RSI sits at 39, yet physical grain/softs term structure is backwardated (+5.3% ann. roll + 3.62% SOFR = +8.88% Net Convenience Yield) and VAMS just flipped Bullish (+1).",
        actionable_call:
          "LONG $DBA (Direct Futures ETF) + Accumulate $NTR (Fertilizer turnaround with positive 30D EPS revisions).",
        stop_trigger: "Close below 63-day Trend pivot or curve flipping into >-4% contango.",
      },
      {
        ticker: "EQT / WMB",
        name: "EQT Corp & Williams Companies (NatGas / AI Pipeline Pivot)",
        asset_class: "Energy Equities (Bypassing $UNG Contango)",
        pivot_score: 89.5,
        metrics: "NatGas RSI: 39 | COT Specs: 18th Pct | Producer VAMS: 0 -> +1",
        why_pivoting:
          "Natural gas speculators are at a washed-out 18th percentile while commercial hedgers are heavily net long. Because front-month $UNG suffers -32.9% annualized contango bleed, Structure #1 routes capital into low-cost Appalachian gas reserves ($EQT) and AI data-center pipeline toll-roads ($WMB).",
        actionable_call:
          "AVOID $UNG; Buy $EQT and $WMB in the bottom 25% of their Probable Range.",
        stop_trigger: "Break below 200-day moving average or Henry Hub < $2.40.",
      },
      {
        ticker: "FBTC / IBIT",
        name: "Spot Bitcoin ETFs (Testing On-Chain Whale Breakeven Floor)",
        asset_class: "Digital Assets / Shadow Liquidity",
        pivot_score: 86.0,
        metrics: "Price: $67,069 | 14D RSI: 22–26 (Washed Out) | STH Realized Floor: $64,250",
        why_pivoting:
          "Bitcoin is deeply oversold (14D RSI 22) and testing its Short-Term Holder Realized Price ($64,250) and US ETF Cost Basis VWAP ($61,800). Structure #2 shows Coinbase USD spot premium is positive (+14.5 bps), 30D Stablecoin minting is +3.8% (expanding dry powder), and Macro Weather 1–3M outlook is Bullish.",
        actionable_call:
          "Staged Accumulation at $64,250–$67,000; scale from 0% to 5% KISS weight the day VAMS flips from -1 to 0.",
        stop_trigger: "Sustained weekly close below US ETF VWAP Cost Basis ($61,800).",
      },
      {
        ticker: "XLF / JPM / KRE",
        name: "US Financials & Money-Center / Regional Banks",
        asset_class: "US Equity Sector",
        pivot_score: 84.0,
        metrics: "14D RSI: 50 | VAMS: 0 (Coiled Spring) | 30D EPS Revisions: Positive",
        why_pivoting:
          "Financials lagged Mega-Cap Tech ($XLK RSI 84) and sit at Neutral VAMS (0) with RSI 50, but benefit from 2s10s curve steepening, upward 30D NII & EPS revisions, and 42 Macro's Paradigm C bank deregulation (SLR relief).",
        actionable_call:
          "LONG Half Position in $XLF / $JPM now; upgrade to Max Position on VAMS flip to +1.",
        stop_trigger: "HY OAS credit spreads widening > +60 bps or SOFR - IORB > +5 bps.",
      },
    ],
    priority_2_trend_compounders: [
      {
        ticker: "TPL / USO / PDBC",
        name: "Texas Pacific Land & Backwardated Crude / Commodity Basket",
        asset_class: "Commodities & Royalty Compounders",
        continuation_score: 92.5,
        metrics: "VAMS: +1 (Bullish) | RSI: 50–52 (Un-Crowded) | EIA Inv Z: -1.12σ",
        why_runway:
          "Confirmed Bullish VAMS (+1) trend in Reflation/Quad 2, yet far from overbought (RSI 51, COT 34th pct) with live EIA commercial crude inventories -1.12σ below average. Harvests +11.09% rate-adjusted convenience yield in $USO/$PDBC while $TPL delivers 90%+ FCF margins with zero capex drag.",
        actionable_call: "LONG: Max Position in $TPL, $USO, and $PDBC.",
        stop_trigger: "VAMS flip to -1 or Brent crude breaking below 63D Trend.",
      },
      {
        ticker: "CBOE / ANET / MPWR",
        name: "Cboe Global Markets, Arista Networks & Monolithic Power",
        asset_class: "3Fourteen FCTE Quality + AI Infrastructure Compounders",
        continuation_score: 88.0,
        metrics: "VAMS: +1 | True FCF Conversion: >90% | 30D EPS Revs: Positive",
        why_runway:
          "While Mega-Cap $MGK triggered a short-term Bearish Crowding signal (RSI 75, Flow Z +6.2σ), 2nd-order AI power/networking enablers ($ANET, $MPWR) and volatility exchange toll-collectors ($CBOE) have positive Jensen's Alpha (+14% ann.), positive 30D EPS revision breadth, and un-crowded Flow Z-scores (< +1.2σ).",
        actionable_call:
          "Buy dips toward the lower half of their 15D Probable Range; trim $MGK rips to fund.",
        stop_trigger: "30D EPS revision breadth turning negative or VAMS flipping -1.",
      },
    ],
  },
  "12_months": {
    label: "12 Months (Short-Term Cyclical Horizon)",
    subtitle:
      "Forward Quad Base-Effect Inflections, OIS/Accord 2.0 Beneficiaries & Global Profit Convergence",
    priority_1_unloved_pivots: [
      {
        ticker: "WPM / AEM / GLDM",
        name: "Wheaton Precious Metals, Agnico Eagle & Gold Bullion",
        asset_class: "Precious Metals & Streamers",
        pivot_score: 93.0,
        metrics: "Gold RSI: 42 | Miner Valuation vs SPX: 19th Pct | Sovereign Residual: +1.85σ",
        why_pivoting:
          "Gold pulled back to RSI 42 (Neutral/Bearish short-term VAMS), shaking out paper tourists. Yet Structure #2D proves covert sovereign central-bank accumulation (+1.85σ residual, +11.4% Asian session return), and Gold Miners trade at the 19th valuation percentile vs. the S&P 500 despite record FCF margins.",
        actionable_call:
          "Accumulate $WPM and $AEM on dips toward Gold's $4,248 Probable Range floor; hold 15–30% $GLDM.",
        stop_trigger:
          "Sovereign Gold Residual dropping below -1.0σ alongside Fed hiking above 4.50%.",
      },
      {
        ticker: "AVUV / IWM",
        name: "US Quality Small-Cap Value (AQR / Verdad Credit-Recovery Setup)",
        asset_class: "US Equity Style Factor",
        pivot_score: 85.0,
        metrics: "Valuation vs Large Cap: 12th Pct | COT Positioning: 25th Pct | VAMS: +1",
        why_pivoting:
          "Small caps sit near 25-year relative valuation lows vs. Mega-Cap Tech. 42 Macro's Corporate Profitability Model (+607 bps) and Paradigm C bank deregulation + Fed RMP liquidity support unlock domestic credit creation over the next 6–12 months. $AVUV filters out unprofitable zombie small caps.",
        actionable_call:
          "Overweight $AVUV (Quality Small-Cap Value) and $IWM on pullbacks while SOFR - IORB stays < 0 bps.",
        stop_trigger: "HY OAS credit spreads breaking above 450 bps.",
      },
      {
        ticker: "IVOL",
        name: "Quadratic Interest Rate Volatility & Inflation Hedge ETF",
        asset_class: "Rates / Yield Curve Steepener",
        pivot_score: 83.5,
        metrics: "2s10s Curve: Normalizing | 10Y Supply Wall: $12.23T NTM",
        why_pivoting:
          "With $12.23T in Approximate NTM Marketable Treasury Supply (231% of US savings) colliding with an accommodative Fed (EFFR 11–39 bps below OIS Neutral), the 2s10s yield curve faces structural steepening pressure over the next 12 months.",
        actionable_call:
          "LONG $IVOL as a convex 6–12M yield-curve steepener and inflation breakeven hedge.",
        stop_trigger:
          "FOMC enacting aggressive Volcker-style hikes that invert 2s10s below -50 bps.",
      },
    ],
    priority_2_trend_compounders: [
      {
        ticker: "VT / EWJ / EEM",
        name: "Global Equities ex-US, Japan & Emerging Markets (KISS 2026 Upgrade)",
        asset_class: "Global Equities",
        continuation_score: 89.0,
        metrics: "VAMS: +1 | RSI: 66–71 | Valuation Discount vs US: -35%",
        why_runway:
          "Direct expression of 42 Macro's 2026 KISS upgrade from $SPYM to $VT: AI diffusion and global productivity/profitability convergence allow cheaper international markets ($EWJ, $EEM, $ACWX) to compound alongside a softening US Dollar.",
        actionable_call: "LONG: Max Position in $VT, $EWJ, and $EEM per Dr. Mo matrix.",
        stop_trigger: "DXY US Dollar Index breaking above 104.5 with VAMS +1.",
      },
      {
        ticker: "XLI / GWW / ODFL",
        name: "US Industrials, Domestic Reshoring & B2B Logistics Leaders",
        asset_class: "US Equity Sector / Quality Compounders",
        continuation_score: 87.5,
        metrics: "XLI VAMS: +1 | RSI: 55 (Un-Crowded) | True FCF Conversion: >88%",
        why_runway:
          "Beneficiary of Paradigm C 'Run It Hot' capex, Section 232 reshoring, and 6.3% YoY Nominal GDP growth, with RSI at a comfortable 55 and expanding operating margins.",
        actionable_call: "LONG $XLI, $GWW, and $ODFL.",
        stop_trigger: "ISM Manufacturing dropping below 47 (80% recession tier).",
      },
    ],
  },
  "3_plus_years": {
    label: "3+ Years (Long-Term Secular Horizon)",
    subtitle:
      "Physical Capex Depletion Supercycles, Fourth Turning Debasement & AI Productivity Winners",
    priority_1_unloved_pivots: [
      {
        ticker: "SRUUF / CCJ / URA",
        name: "Physical Uranium & Tier-1 Nuclear Fuel Cycle",
        asset_class: "Secular Commodity Depletion Supercycle",
        pivot_score: 96.0,
        metrics: "Capex/DD&A: 0.68x | RSI: 44 (Unloved Pullback) | Inventory Z: -1.9σ",
        why_pivoting:
          "The #1 multi-year asymmetric setup in Structure #3: Uranium has pulled back to RSI 44 (VAMS 0) even as industry Capex-to-Depletion sits at 0.68x and sovereigns/hyperscalers commit to 10-to-20-year nuclear baseload expansion.",
        actionable_call:
          "Build core 3–5 year position in $SRUUF (Physical Trust) and $CCJ (Cameco) on every cyclical dip.",
        stop_trigger: "Industry Capex/DD&A exceeding 1.5x (new mine oversupply).",
      },
      {
        ticker: "COPX / FCX / SCCO",
        name: "Global Copper Miners & Electrification Reserve Owners",
        asset_class: "Secular Commodity Depletion Supercycle",
        pivot_score: 92.0,
        metrics: "Copper/Gold Ratio: -1.65σ | Capex/DD&A: 0.79x | Mine Lead Time: 16 Yrs",
        why_pivoting:
          "The Copper-to-Gold ratio sits at a generational -1.65σ extreme while copper ore grades decline and AI data centers + grid modernization + defense require massive copper tonnage that cannot be brought online in <10 years.",
        actionable_call:
          "Accumulate $COPX, $FCX, and $SCCO as core 3+ year real-asset compounders.",
        stop_trigger: "Global capex cycle overbuilding (>1.4x DD&A).",
      },
      {
        ticker: "XLE / TPL / CNQ",
        name: "Long-Reserve-Life Energy Producers & Permian Land Royalties",
        asset_class: "Secular Hard-Asset Value",
        pivot_score: 90.5,
        metrics: "Gold-to-Oil Ratio: 56.9x (vs 16.5x Historical Mean) | Capex/DD&A: 0.84x",
        why_pivoting:
          "At a 56.9x Gold-to-Oil ratio, crude oil and long-life energy reserves are at a 95th-percentile historical discount to monetary gold. Capex discipline (0.84x DD&A) turns $TPL and $CNQ into free-cash-flow return machines.",
        actionable_call: "Core secular overweight in $TPL and $CNQ / $XLE.",
        stop_trigger: "OPEC+ abandoning supply discipline into a global Deep Quad 4 recession.",
      },
    ],
    priority_2_trend_compounders: [
      {
        ticker: "CEG / VST / GRID",
        name: "Nuclear Baseload Power & Smart-Grid Infrastructure",
        asset_class: "Secular AI Power Monetization (3rd Order)",
        continuation_score: 94.0,
        metrics: "PPAs: 10–20Yr Contracted | Pod 1 & 2 RoC: Accelerating",
        why_runway:
          "Electricity is the ultimate physical bottleneck of the AI Productivity Boom. Nuclear and grid operators lock in inflation-escalated multi-decade cash flows.",
        actionable_call:
          "Core long-term compounder sleeve in $CEG and $GRID; add on rate-driven pullbacks.",
        stop_trigger: "Regulatory price caps on wholesale data-center power contracts.",
      },
      {
        ticker: "VT + GLDM + FBTC (KISS 60/30/10)",
        name: "42 Macro KISS Structural Debasement Portfolio",
        asset_class: "Multi-Asset Core Wealth Engine",
        continuation_score: 95.0,
        metrics: "0% Long Nominal Bonds | Foreign Official Treasury Share: Record Low 13%",
        why_runway:
          "In a Fourth Turning where US Public Debt is 114% of domestic liquidity and NTM Treasury supply is $12.23T/yr, replacing obsolete 60/40 nominal bonds with 30% Gold ($GLDM), 10% Bitcoin ($FBTC), and Dynamic $USFR Cash structurally protects purchasing power.",
        actionable_call:
          "Maintain systematic 60% $VT / 30% $GLDM / 10% $FBTC core governed by daily VAMS.",
        stop_trigger: "Structural fiscal surplus + positive real rates >3% (Paradigm B austerity).",
      },
    ],
  },
};

export default function MultiHorizonOutliersPage() {
  const [horizon, setHorizon] = useState<HorizonKey>("1_to_3_months");
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      let res = await fetch(`${API_BASE_URL}/api/v1/outliers/multi-horizon`, { cache: "no-store" });
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/api/outliers/multi-horizon`, { cache: "no-store" });
      }
      if (res.ok) {
        const json = await res.json();
        if (json?.horizons) {
          setApiData(json);
        }
      }
    } catch (err) {
      console.warn("Using fallback for multi-horizon outliers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const active = apiData?.horizons?.[horizon] || FALLBACK_HORIZON_DATA[horizon];

  const filterMatches = (item: any) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.ticker?.toLowerCase().includes(q) ||
      item.name?.toLowerCase().includes(q) ||
      item.asset_class?.toLowerCase().includes(q) ||
      item.actionable_call?.toLowerCase().includes(q)
    );
  };

  const p1Pivots = (active.priority_1_unloved_pivots || []).filter(filterMatches);
  const p2Compounders = (active.priority_2_trend_compounders || []).filter(filterMatches);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 p-3 sm:p-5 lg:p-7 space-y-6">
      {/* 1. HEADER & HORIZON SELECTOR TABS */}
      <section className="rounded-xl border border-slate-800 bg-[#0e1626]/90 backdrop-blur-md p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-emerald-500/20 via-cyan-500/20 to-blue-500/10 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Section 4 • Multi-Horizon Actionable Idea Engine
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  Priority 1: Pivots First • Priority 2: Compounders Second
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                Actionable Pivot & Outlier Scanner (1–3M • 12M • 3+ Years)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="outliers-refresh-btn"
              onClick={fetchData}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh scanner feeds"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Horizon Selector Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {(["1_to_3_months", "12_months", "3_plus_years"] as HorizonKey[]).map((hKey) => {
              const isActive = horizon === hKey;
              return (
                <button
                  key={hKey}
                  id={`horizon-tab-${hKey}`}
                  onClick={() => setHorizon(hKey)}
                  className={`px-4 py-2 rounded-lg border font-semibold transition flex items-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-900/30"
                      : "bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{FALLBACK_HORIZON_DATA[hKey].label}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />}
                </button>
              );
            })}
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter ideas by ticker, name, or theme..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-300 flex items-center gap-2">
          <Compass className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Active Horizon Thesis:</strong> {active.label} — {active.subtitle}
          </span>
        </div>
      </section>

      {/* 2. PRIORITY 1: UNLOVED BOTTOMING PIVOTS & COILED SPRINGS */}
      <section className="rounded-xl border border-emerald-500/40 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              🥇 Priority 1 — Highest Institutional Asymmetry
            </span>
            <h2 className="text-lg font-bold text-white mt-1.5">
              Unloved Bottoming Pivots & Coiled Springs (Inflecting From Lows / Washed-Out Positioning)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Criteria: Low RSI / Range Position &lt; 40% + Washed-Out COT/Flows + Inflecting Macro/EPS Catalyst
          </span>
        </div>

        {p1Pivots.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-400 bg-slate-900/40 rounded-lg border border-slate-800">
            No Priority 1 ideas match the filter &quot;{searchTerm}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {p1Pivots.map((idea: any, i: number) => {
              // Extract first ticker if slash-separated
              const primaryTicker = idea.ticker.split("/")[0].trim().replace("$", "");
              return (
                <div
                  key={i}
                  className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-3 flex flex-col justify-between hover:border-emerald-500/40 transition shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold font-mono text-emerald-400">
                          ${idea.ticker}
                        </span>
                        <span className="text-sm font-semibold text-white">— {idea.name}</span>
                        <Link
                          href={`/stock-xray?ticker=${primaryTicker}`}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 transition inline-flex items-center gap-1"
                          title={`Run 5-Pillar Sector X-Ray for ${primaryTicker}`}
                        >
                          <Crosshair className="h-3 w-3" />
                          <span>X-Ray</span>
                        </Link>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shrink-0">
                        Pivot Score: {idea.pivot_score}/100
                      </span>
                    </div>

                    <div className="text-xs font-mono text-cyan-300">{idea.metrics || idea.price_and_vams}</div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {idea.why_pivoting || idea.why_unloved_and_pivoting}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5 font-sans">
                    <div className="text-xs font-semibold text-emerald-300 flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">► Action:</span>
                      <span>{idea.actionable_call || idea.actionable_trade}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      <strong className="text-slate-300">Invalidation Trigger:</strong>{" "}
                      {idea.stop_trigger || idea.invalidation_stop}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. PRIORITY 2: SECULAR COMPOUNDERS & TREND CONTINUATION */}
      <section className="rounded-xl border border-blue-500/40 bg-[#0e1626]/80 p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
              🥈 Priority 2 — Momentum With Sustained Runway
            </span>
            <h2 className="text-lg font-bold text-white mt-1.5">
              High-Alpha Trend Continuation Compounders (Bullish VAMS + Un-Crowded + Expanding Cash Flow)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Criteria: Bullish VAMS +1 + Positive Jensen&apos;s Alpha (α) + Flow Z &lt; +2.0σ + True FCF &gt; 85%
          </span>
        </div>

        {p2Compounders.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-400 bg-slate-900/40 rounded-lg border border-slate-800">
            No Priority 2 ideas match the filter &quot;{searchTerm}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {p2Compounders.map((idea: any, i: number) => {
              const primaryTicker = idea.ticker.split("/")[0].trim().replace("$", "");
              return (
                <div
                  key={i}
                  className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-3 flex flex-col justify-between hover:border-blue-500/40 transition shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold font-mono text-blue-400">
                          ${idea.ticker}
                        </span>
                        <span className="text-sm font-semibold text-white">— {idea.name}</span>
                        <Link
                          href={`/stock-xray?ticker=${primaryTicker}`}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 transition inline-flex items-center gap-1"
                          title={`Run 5-Pillar Sector X-Ray for ${primaryTicker}`}
                        >
                          <Crosshair className="h-3 w-3" />
                          <span>X-Ray</span>
                        </Link>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold shrink-0">
                        Runway Score: {idea.continuation_score}/100
                      </span>
                    </div>

                    <div className="text-xs font-mono text-amber-300">{idea.metrics || idea.price_and_vams}</div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {idea.why_runway || idea.why_trend_has_runway}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5 font-sans">
                    <div className="text-xs font-semibold text-blue-300 flex items-start gap-1.5">
                      <span className="text-blue-400 font-bold shrink-0">► Action:</span>
                      <span>{idea.actionable_call || idea.actionable_trade}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      <strong className="text-slate-300">Invalidation Trigger:</strong>{" "}
                      {idea.stop_trigger || idea.invalidation_stop}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
