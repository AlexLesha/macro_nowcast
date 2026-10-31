"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Compass,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Globe,
  PieChart,
  ShieldAlert,
  ArrowRight,
  Zap,
  Layers,
  Sparkles,
  Target,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Scale,
} from "lucide-react";
import { IntelligenceFeed } from "@/components/IntelligenceFeed";
import { MacroNowcastCard } from "@/components/MacroNowcastCard";
import { FcteHoldingsTable } from "@/components/FcteHoldingsTable";
import { getApiUrl } from "@/lib/api";

export default function UnifiedNowcastDashboard() {
  const [regime, setRegime] = useState<any>(null);
  const [quantSignals, setQuantSignals] = useState<any>(null);
  const [liquidity, setLiquidity] = useState<any>(null);
  const [outliers, setOutliers] = useState<any>(null);
  const [deltas, setDeltas] = useState<any[]>([]);
  const [execData, setExecData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncingHoldings, setIsSyncingHoldings] = useState(false);

  const handleHoldingsSync = async () => {
    setIsSyncingHoldings(true);
    try {
      await fetch(getApiUrl("/api/intelligence/ingest-holdings"), { method: "POST" });
      const res = await fetch(getApiUrl("/api/intelligence/deltas"));
      if (res.ok) {
        setDeltas(await res.json());
      }
    } catch (err) {
      console.error("Error triggering holdings sync:", err);
    } finally {
      setIsSyncingHoldings(false);
    }
  };


  const fetchDashboardData = async () => {
    try {
      const [regimeRes, quantRes, liqRes, outliersRes, deltasRes, execRes] = await Promise.allSettled([
        fetch(getApiUrl("/api/regime/current")),
        fetch(getApiUrl("/api/quant/signals?ticker=SPY")),
        fetch(getApiUrl("/api/liquidity/us-net")),
        fetch(getApiUrl("/api/outliers/scan")),
        fetch(getApiUrl("/api/intelligence/deltas")),
        fetch(getApiUrl("/api/v1/executive-summary")),
      ]);

      if (regimeRes.status === "fulfilled" && regimeRes.value.ok) {
        setRegime(await regimeRes.value.json());
      }
      if (quantRes.status === "fulfilled" && quantRes.value.ok) {
        setQuantSignals(await quantRes.value.json());
      }
      if (liqRes.status === "fulfilled" && liqRes.value.ok) {
        setLiquidity(await liqRes.value.json());
      }
      if (outliersRes.status === "fulfilled" && outliersRes.value.ok) {
        setOutliers(await outliersRes.value.json());
      }
      if (deltasRes.status === "fulfilled" && deltasRes.value.ok) {
        setDeltas(await deltasRes.value.json());
      }
      if (execRes.status === "fulfilled" && execRes.value.ok) {
        setExecData(await execRes.value.json());
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Baseline values synchronized across Executive Summary, Regime Snapshot, and 42 Macro Live Engine
  const rawMonthlyQuad = String(
    execData?.kpi_1_us_quad?.active_quad || regime?.us_monthly_quad || "QUAD_3"
  )
    .toUpperCase()
    .replace("QUAD ", "QUAD_");
  const monthlyQuad = rawMonthlyQuad;
  const quarterlyQuad = String(
    regime?.us_quarterly_quad || execData?.kpi_1_us_quad?.active_quad || "QUAD_3"
  )
    .toUpperCase()
    .replace("QUAD ", "QUAD_");

  const quadDeltaLabel =
    monthlyQuad === "QUAD_1"
      ? "ΔG+ ΔI-"
      : monthlyQuad === "QUAD_2"
        ? "ΔG+ ΔI+"
        : monthlyQuad === "QUAD_3"
          ? "ΔG- ΔI+"
          : "ΔG- ΔI-";

  const quadDeltaColor =
    monthlyQuad === "QUAD_1" || monthlyQuad === "QUAD_2"
      ? "text-emerald-400"
      : monthlyQuad === "QUAD_3"
        ? "text-amber-400"
        : "text-rose-400";

  const gridRegime =
    execData?.kpi_2_grid_regime?.primary_regime ||
    quantSignals?.market_grid?.prevailing_regime ||
    regime?.grid_regime ||
    "DEFLATION";

  const execConfirmingShares = execData?.kpi_2_grid_regime?.confirming_shares_pct;
  const quantShares = quantSignals?.market_grid?.regime_shares;
  const gridShares = execConfirmingShares
    ? {
      goldilocks_pct: Number(execConfirmingShares.GOLDILOCKS ?? 14.6),
      reflation_pct: Number(execConfirmingShares.REFLATION ?? 16.7),
      inflation_pct: Number(execConfirmingShares.INFLATION ?? 31.2),
      deflation_pct: Number(execConfirmingShares.DEFLATION ?? 37.5),
    }
    : quantShares
      ? {
        goldilocks_pct: Number(((quantShares.GOLDILOCKS ?? 0.146) * 100).toFixed(1)),
        reflation_pct: Number(((quantShares.REFLATION ?? 0.167) * 100).toFixed(1)),
        inflation_pct: Number(((quantShares.INFLATION ?? 0.312) * 100).toFixed(1)),
        deflation_pct: Number(((quantShares.DEFLATION ?? 0.375) * 100).toFixed(1)),
      }
      : {
        goldilocks_pct: 14.6,
        reflation_pct: 16.7,
        inflation_pct: 31.2,
        deflation_pct: 37.5,
      };

  const netLiquidityBn =
    execData?.kpi_4_us_net_liquidity?.net_liquidity_usd_bn ??
    liquidity?.net_liquidity_usd_bn ??
    regime?.net_liquidity_usd_bn ??
    6150.4;
  const netLiq4wImpulse =
    execData?.kpi_4_us_net_liquidity?.rates_of_change?.roc_4w_pct ??
    liquidity?.rates_of_change?.roc_4w_pct ??
    1.8;

  // KISS weights synchronized with live 42 Macro KISS Portfolio
  const liveKissExp = execData?.card_a_kiss_portfolio?.actual_exposures_pct;
  const kissAlloc = liveKissExp
    ? {
        spy_equities_pct: Number(liveKissExp.VT ?? liveKissExp.SPY ?? 0),
        gld_gold_pct: Number(liveKissExp.GLDM ?? liveKissExp.GLD ?? 0),
        ibit_bitcoin_pct: Number(liveKissExp.FBTC ?? liveKissExp.IBIT ?? 0),
        usfr_tbil_cash_pct: Number(liveKissExp.USFR ?? 100),
      }
    : quantSignals?.portfolios?.kiss_model || {
        spy_equities_pct: 0.0,
        gld_gold_pct: 0.0,
        ibit_bitcoin_pct: 0.0,
        usfr_tbil_cash_pct: 100.0,
      };

  // Option Overlay
  const kspyOverlay = quantSignals?.risk_ranges?.kspy_overlay_regime || "PUT_SPREAD_COLLAR";
  const kspyDesc =
    quantSignals?.risk_ranges?.kspy_overlay_description ||
    "Near top of Risk Range in Bullish Trend: Sell OTM Call to finance 1x2 OTM Put Spread (zero-cost downside protection).";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. TOP KPI BANNER */}
      <div className="bg-[#0e1626]/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
          {/* KPI 1: Current US & Global Quad */}
          <div className="border-b md:border-b-0 md:border-r border-slate-800/80 pr-4 pb-4 md:pb-0 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              <Compass className="h-4 w-4" />
              <span>US &amp; GLOBAL QUADS</span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-base font-black font-mono text-slate-100">{monthlyQuad.replace("_", " ")}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-bold">
                MONTHLY
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between pt-1">
              <span>Quarterly: <strong>{quarterlyQuad.replace("_", " ")}</strong></span>
              <span className={`${quadDeltaColor} font-semibold`}>{quadDeltaLabel}</span>
            </div>
          </div>

          {/* KPI 2: 42 Macro GRID Score Bar */}
          <div className="border-b md:border-b-0 md:border-r border-slate-800/80 pr-4 pb-4 md:pb-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span>42 MACRO GRID</span>
              </span>
              <span
                className={`text-xs font-bold font-mono ${gridRegime.includes("DEFLATION") || gridRegime.includes("INFLATION")
                    ? "text-amber-400"
                    : "text-emerald-400"
                  }`}
              >
                {gridRegime}
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2.5 flex overflow-hidden border border-slate-800">
              <div
                style={{ width: `${gridShares.goldilocks_pct}%` }}
                className="bg-cyan-400 h-full"
                title={`Goldilocks: ${gridShares.goldilocks_pct}%`}
              />
              <div
                style={{ width: `${gridShares.reflation_pct}%` }}
                className="bg-emerald-500 h-full"
                title={`Reflation: ${gridShares.reflation_pct}%`}
              />
              <div
                style={{ width: `${gridShares.inflation_pct}%` }}
                className="bg-amber-500 h-full"
                title={`Inflation: ${gridShares.inflation_pct}%`}
              />
              <div
                style={{ width: `${gridShares.deflation_pct}%` }}
                className="bg-rose-500 h-full"
                title={`Deflation: ${gridShares.deflation_pct}%`}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Gold: {gridShares.goldilocks_pct}%</span>
              <span>Refl: {gridShares.reflation_pct}%</span>
              <span>Infl: {gridShares.inflation_pct}%</span>
              <span>Defl: {gridShares.deflation_pct}%</span>
            </div>
          </div>

          {/* KPI 3: Prometheus 1965 Similarity & Expected Returns */}
          <div className="border-b md:border-b-0 md:border-r border-slate-800/80 pr-4 pb-4 md:pb-0 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>PROMETHEUS 1965 ANALOG</span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-base font-bold font-mono text-slate-100">
                {execData?.kpi_3_similarity_match?.top_historical_period || "2019-Q3"}
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-800">
                {execData?.kpi_3_similarity_match?.similarity_score_pct ?? 86.4}% MATCH
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 pt-0.5">
              <span>Expected Return: </span>
              <span className="text-emerald-400 font-semibold">
                SPY {execData?.kpi_3_similarity_match?.expected_21d_spy_return_pct || "+1.8%"}
              </span>
            </div>
          </div>

          {/* KPI 4: US Net Liquidity ($Bn & 4W Impulse) */}
          <div className="border-b md:border-b-0 md:border-r border-slate-800/80 pr-4 pb-4 md:pb-0 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              <DollarSign className="h-4 w-4" />
              <span>US NET LIQUIDITY</span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-base font-black font-mono text-emerald-400">
                ${netLiquidityBn.toLocaleString()}B
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1 pt-0.5">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span>4W Impulse: </span>
              <span className="text-emerald-400 font-bold">+{netLiq4wImpulse}%</span>
            </div>
          </div>

          {/* KPI 5: 3Fourteen MOVE vs. VIX Co-Signer Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              <Activity className="h-4 w-4" />
              <span>MOVE / VIX CO-SIGNER</span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-sm font-bold font-mono text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80">
                {execData?.kpi_5_move_vix_cosigner?.cosigner_state || "BULLISH CO-SIGN"}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 pt-1">
              MOVE: <strong className="text-slate-200">{execData?.kpi_5_move_vix_cosigner?.move_index ?? 94.2}</strong> ({execData?.kpi_5_move_vix_cosigner?.move_1y_pct ?? 25}th pct) &bull; VIX:{" "}
              <strong className="text-slate-200">{execData?.kpi_5_move_vix_cosigner?.vix_index ?? 15.8}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LIVE ALLOCATION SHOWDOWN (KISS vs. 3FOURTEEN RAA vs. KSPY OPTION OVERLAY) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card A: 42 Macro KISS 60/30/10 Model */}
        <div className="p-6 rounded-2xl bg-[#0c121e] border border-slate-800 hover:border-cyan-500/30 transition shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400">
                <PieChart className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-mono font-bold text-slate-100">KISS 60/30/10 MODEL</h3>
                <p className="text-xs font-mono text-slate-400">Vol-Targeted &amp; VAMS-Scaled Allocation</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              10% VOL TARGET
            </span>
          </div>

          {/* Allocation Weights */}
          <div className="space-y-3 font-mono text-sm">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold text-cyan-400">$SPY (Equities)</span>
                <span>{kissAlloc.spy_equities_pct}% (Max: 60%)</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${kissAlloc.spy_equities_pct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold text-amber-400">$GLD (Physical Gold)</span>
                <span>{kissAlloc.gld_gold_pct}% (Max: 30%)</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${kissAlloc.gld_gold_pct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold text-indigo-400">$IBIT (Bitcoin Digital Gold)</span>
                <span>{kissAlloc.ibit_bitcoin_pct}% (Max: 10%)</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${kissAlloc.ibit_bitcoin_pct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold text-emerald-400">$USFR / $TBIL (Cash Reserve)</span>
                <span>{kissAlloc.usfr_tbil_cash_pct}% (Tactical Buffer)</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${kissAlloc.usfr_tbil_cash_pct}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs font-mono text-slate-400 border-t border-slate-800/80">
            Systematic rule: VAMS momentum scaling scales risk assets; unallocated capital parks in ultra-short Treasuries.
          </div>
        </div>

        {/* Card B: 3Fourteen RAA Portfolio */}
        <div className="p-6 rounded-2xl bg-[#0c121e] border border-slate-800 hover:border-indigo-500/30 transition shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800/40 text-indigo-400">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-mono font-bold text-slate-100">3FOURTEEN RAA MODEL</h3>
                <p className="text-xs font-mono text-slate-400">Regime Adaptive Asset Allocation</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
              WARREN PIES
            </span>
          </div>

          <div className="space-y-3 font-mono text-sm">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold text-indigo-400">Equities Bucket</span>
                <span>{execData?.card_b_3fourteen_raa?.equities_pct ?? 41.0}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${execData?.card_b_3fourteen_raa?.equities_pct ?? 41.0}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Tilt: High FCTE Quality &bull; Top: {(execData?.card_b_3fourteen_raa?.top_holdings || ["SPY", "PDBC", "GLDM"]).slice(0, 4).join(", ")}</p>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold text-blue-400">Fixed Income Bucket</span>
                <span>{execData?.card_b_3fourteen_raa?.fixed_income_pct ?? 29.3}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${execData?.card_b_3fourteen_raa?.fixed_income_pct ?? 29.3}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Focus: Short-to-Intermediate durations ($SHY / $IEF / $SCHQ)</p>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold text-amber-400">Alternatives &amp; Commodities</span>
                <span>{execData?.card_b_3fourteen_raa?.alternatives_pct ?? 29.7}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${execData?.card_b_3fourteen_raa?.alternatives_pct ?? 29.7}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Focus: Bullion ($GLDM), Commodities ($PDBC), Crypto ($IBIT)</p>
            </div>
          </div>

          <div className="pt-2 text-xs font-mono text-slate-400 border-t border-slate-800/80">
            RAA dynamically weights factors based on 2Y/10Y Fair Value modeling and speculative capitulation triggers.
          </div>
        </div>

        {/* Card C: Hedgeye KSPY Option Overlay */}
        <div className="p-6 rounded-2xl bg-[#0c121e] border border-slate-800 hover:border-cyan-500/30 transition shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-emerald-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-mono font-bold text-slate-100">KSPY OPTION OVERLAY</h3>
                <p className="text-xs font-mono text-slate-400">Hedgeye Dynamic Collar Engine</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
              ACTIVE
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-xs font-mono text-slate-400 uppercase">Regime Designation:</div>
            <div className="text-base font-bold font-mono text-cyan-400 tracking-wide">
              {(execData?.card_c_kspy_option_overlay?.kspy_overlay_regime || kspyOverlay).replace(/_/g, " ")}
            </div>
            <p className="text-sm text-slate-300 font-mono leading-relaxed">
              {execData?.card_c_kspy_option_overlay?.plain_english_verdict || kspyDesc}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 text-xs block">Put Wall</span>
              <strong className="text-slate-100">
                ${execData?.card_c_kspy_option_overlay?.put_wall_strike ? Number(execData.card_c_kspy_option_overlay.put_wall_strike).toFixed(1) : "540.0"}
              </strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 text-xs block">Gamma Flip</span>
              <strong className="text-slate-100">
                ${execData?.card_c_kspy_option_overlay?.gamma_flip_price ? Number(execData.card_c_kspy_option_overlay.gamma_flip_price).toFixed(1) : "581.0"}
              </strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 text-xs block">Call Wall</span>
              <strong className="text-slate-100">
                ${execData?.card_c_kspy_option_overlay?.call_wall_strike ? Number(execData.card_c_kspy_option_overlay.call_wall_strike).toFixed(1) : "595.0"}
              </strong>
            </div>
          </div>

          <div className="pt-2 text-xs font-mono text-slate-400 border-t border-slate-800/80">
            Net GEX: <strong className="text-cyan-400">{execData?.card_c_kspy_option_overlay?.net_gex_bn ? `${execData.card_c_kspy_option_overlay.net_gex_bn > 0 ? "+" : ""}${execData.card_c_kspy_option_overlay.net_gex_bn}B` : "+4.2B"}</strong> &bull; Systematic overlay finances zero-cost tail protection when S&amp;P 500 pushes into top of risk range.
          </div>
        </div>
      </div>

      {/* 3. CORE NOWCASTING & MODEL INTELLIGENCE */}
      <MacroNowcastCard />

      {/* 4. LATEST VERIFIED INTELLIGENCE FEED */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-mono font-bold text-slate-100">
              LATEST VERIFIED INTELLIGENCE DELTAS
            </h2>
          </div>
          <Link
            href="/synthesis"
            className="text-sm font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            <span>Explore 4-Framework Synthesis Matrix</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <IntelligenceFeed
          deltas={deltas}
          onTriggerHoldingsSync={handleHoldingsSync}
          isSyncing={isSyncingHoldings}
        />
      </div>

      {/* 5. 3FOURTEEN FCTE CORE 20 HOLDINGS */}
      <div className="space-y-4 pt-2">
        <FcteHoldingsTable />
      </div>
    </div>
  );
}
