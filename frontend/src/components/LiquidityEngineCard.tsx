"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  DollarSign,
  Globe,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Sliders,
  Scale,
  Zap,
} from "lucide-react";

import { getApiUrl } from "@/lib/api";

interface LiquidityEngineCardProps {
  initialData?: any;
}

export const LiquidityEngineCard: React.FC<LiquidityEngineCardProps> = ({ initialData }) => {
  const [data, setData] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }
    fetchLiquidityData();
  }, [initialData]);

  const fetchLiquidityData = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/liquidity/full-suite"));
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error("Failed to load liquidity suite:", e);
    } finally {
      setLoading(false);
    }
  };

  const renderRocLine = (rocs?: { roc_4w_pct?: number; roc_13w_pct?: number; roc_26w_pct?: number }) => {
    const r4 = rocs?.roc_4w_pct ?? 0.0;
    const r13 = rocs?.roc_13w_pct ?? 0.0;
    const r26 = rocs?.roc_26w_pct ?? 0.0;
    return (
      <div className="text-xs font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span>
          4W:{" "}
          <span className={r4 >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
            {r4 > 0 ? "+" : ""}{r4}%
          </span>
        </span>
        <span>
          13W:{" "}
          <span className={r13 >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
            {r13 > 0 ? "+" : ""}{r13}%
          </span>
        </span>
        <span>
          26W:{" "}
          <span className={r26 >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
            {r26 > 0 ? "+" : ""}{r26}%
          </span>
        </span>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-8 text-center text-slate-400 font-mono text-sm flex items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400" />
        <span>Calculating US Net Liquidity, Global Debt Ratios &amp; Accord 2.0 Gauge...</span>
      </div>
    );
  }

  if (!data) return null;

  const usLiq = data.us_net_liquidity || {};
  const globalDebt = data.global_debt_ratios || data.global_liquidity || {};
  const bondAccord = data.bond_stress_accord || data.bond_stress_and_accord || {};

  const accordGauge = bondAccord?.fed_treasury_accord_gauge || {};
  const yieldDecomp = bondAccord?.yield_decomposition || {};
  const fvModel = bondAccord?.fair_value_model || {};
  const moveVix = bondAccord?.move_vix_co_signer || {};
  const iip = globalDebt?.us_net_international_investment_position || {};
  const ausIip = globalDebt?.australia_net_international_investment_position || {
    net_iip_usd_tn: -0.42,
    net_iip_aud_bn: -638.9,
    macro_implication: "Australia Net IIP sits at -$0.42T (-A$638.9B, ~24% of GDP). Resilient global buffer backed by A$4.5T in superannuation assets invested overseas.",
  };
  const bondRocs = bondAccord?.bond_market_rocs || {};

  return (
    <div className="space-y-6">
      {/* SECTION A: US NET LIQUIDITY PLUMBING */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h3 className="font-mono text-base font-bold uppercase tracking-wider text-slate-100">
              US NET LIQUIDITY ARCHITECTURE: L_t = WALCL − (TGA + RRP)
            </h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
            {usLiq.liquidity_regime}
          </span>
        </div>

        {/* 4 Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800">
            <span className="text-xs font-mono text-slate-400 block mb-1">FED NET LIQUIDITY</span>
            <div className="text-base font-black font-mono text-emerald-400">
              ${Number(usLiq.net_liquidity_usd_bn || 0).toLocaleString()}B
            </div>
            {renderRocLine(usLiq.net_liquidity_rocs || usLiq.rates_of_change)}
            <span className="text-xs text-slate-500 font-mono block mt-1.5">
              52W Z: {usLiq.z_score_52w > 0 ? "+" : ""}{usLiq.z_score_52w}σ
            </span>
          </div>

          <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800">
            <span className="text-xs font-mono text-slate-400 block mb-1">FED TOTAL ASSETS (WALCL)</span>
            <div className="text-base font-bold font-mono text-slate-100">
              ${Number(usLiq.fed_assets_walcl_bn || 0).toLocaleString()}B
            </div>
            {renderRocLine(usLiq.walcl_rocs)}
            <span className="text-xs text-slate-500 font-mono block mt-1.5">QT RUNOFF ACTIVE</span>
          </div>

          <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800">
            <span className="text-xs font-mono text-slate-400 block mb-1">TREASURY TGA (WTREGEN)</span>
            <div className="text-base font-bold font-mono text-amber-400">
              ${Number(usLiq.tga_wtregen_bn || 0).toLocaleString()}B
            </div>
            {renderRocLine(usLiq.tga_rocs)}
            <span className="text-xs text-slate-500 font-mono block mt-1.5">DRAWS LIQUIDITY (+)</span>
          </div>

          <div className="bg-[#121c2e] p-3 rounded-lg border border-slate-800">
            <span className="text-xs font-mono text-slate-400 block mb-1">REVERSE REPO (RRP)</span>
            <div className="text-base font-bold font-mono text-rose-400">
              ${Number(usLiq.reverse_repo_rrp_bn || 0).toLocaleString()}B
            </div>
            {renderRocLine(usLiq.rrp_rocs)}
            <span className="text-xs text-slate-500 font-mono block mt-1.5">FACILITY DRAIN (+)</span>
          </div>
        </div>

        {/* Rates of Change & Asset Spreads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm pt-1">
          {/* Multi-horizon RoC */}
          <div className="bg-[#0b1220] p-3 rounded border border-slate-800">
            <span className="text-xs uppercase text-slate-500 font-semibold block mb-2">
              NET LIQUIDITY RATES OF CHANGE
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-[#131e32] border border-slate-700/60">
                <span className="text-xs text-slate-400 block">4-WEEK RoC</span>
                <span className={`font-bold ${usLiq.rates_of_change?.roc_4w_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {usLiq.rates_of_change?.roc_4w_pct > 0 ? "+" : ""}{usLiq.rates_of_change?.roc_4w_pct}%
                </span>
              </div>
              <div className="p-2 rounded bg-[#131e32] border border-slate-700/60">
                <span className="text-xs text-slate-400 block">13-WEEK RoC</span>
                <span className={`font-bold ${usLiq.rates_of_change?.roc_13w_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {usLiq.rates_of_change?.roc_13w_pct > 0 ? "+" : ""}{usLiq.rates_of_change?.roc_13w_pct}%
                </span>
              </div>
              <div className="p-2 rounded bg-[#131e32] border border-slate-700/60">
                <span className="text-xs text-slate-400 block">26-WEEK RoC</span>
                <span className={`font-bold ${usLiq.rates_of_change?.roc_26w_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {usLiq.rates_of_change?.roc_26w_pct > 0 ? "+" : ""}{usLiq.rates_of_change?.roc_26w_pct}%
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{usLiq.regime_description}</p>
          </div>

          {/* SPY & IBIT Liquidity Gap */}
          <div className="bg-[#0b1220] p-3 rounded border border-slate-800">
            <span className="text-xs uppercase text-slate-500 font-semibold block mb-2">
              CROSS-ASSET LIQUIDITY VALUATION GAPS
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm p-1.5 rounded bg-[#131e32]">
                <span className="text-slate-200 font-bold">SPY (S&amp;P 500)</span>
                <span className="text-slate-400">
                  Fair: ${usLiq.cross_asset_spreads?.spy?.liquidity_implied_fair_value} | Gap:{" "}
                  <strong className={usLiq.cross_asset_spreads?.spy?.valuation_gap_pct > 5 ? "text-amber-400" : "text-emerald-400"}>
                    {usLiq.cross_asset_spreads?.spy?.valuation_gap_pct > 0 ? "+" : ""}
                    {usLiq.cross_asset_spreads?.spy?.valuation_gap_pct}%
                  </strong>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm p-1.5 rounded bg-[#131e32]">
                <span className="text-slate-200 font-bold">IBIT (Bitcoin, Beta: 3.85)</span>
                <span className="text-slate-400">
                  Fair: ${usLiq.cross_asset_spreads?.ibit_bitcoin?.liquidity_implied_fair_value} | Gap:{" "}
                  <strong className={usLiq.cross_asset_spreads?.ibit_bitcoin?.valuation_gap_pct > 10 ? "text-amber-400" : "text-emerald-400"}>
                    {usLiq.cross_asset_spreads?.ibit_bitcoin?.valuation_gap_pct > 0 ? "+" : ""}
                    {usLiq.cross_asset_spreads?.ibit_bitcoin?.valuation_gap_pct}%
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: GLOBAL LIQUIDITY & SOVEREIGN DEBT RATIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Liquidity Aggregation */}
        <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <Globe className="h-4 w-4 text-cyan-400" />
              <h3 className="font-mono text-base font-bold uppercase tracking-wider text-slate-100">
                GLOBAL LIQUIDITY: ${globalDebt.global_liquidity_usd_tn}T
              </h3>
            </div>

            <div className="space-y-3 font-mono text-sm">
              <div className="bg-[#121c2e] p-3 rounded border border-slate-800 space-y-2">
                <span className="text-xs text-slate-500 uppercase block font-semibold">
                  CENTRAL BANK BALANCE SHEETS (SPOT USD)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                  <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 text-xs">FED (US):</span>
                      <span className="font-bold text-slate-200 text-sm">${globalDebt.central_bank_breakdown_tn?.fed_united_states}T</span>
                    </div>
                    {renderRocLine(globalDebt.central_bank_rocs?.fed_united_states)}
                  </div>

                  <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 text-xs">ECB (Eurozone):</span>
                      <span className="font-bold text-slate-200 text-sm">${globalDebt.central_bank_breakdown_tn?.ecb_eurozone}T</span>
                    </div>
                    {renderRocLine(globalDebt.central_bank_rocs?.ecb_eurozone)}
                  </div>

                  <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 text-xs">BOJ (Japan):</span>
                      <span className="font-bold text-slate-200 text-sm">${globalDebt.central_bank_breakdown_tn?.boj_japan}T</span>
                    </div>
                    {renderRocLine(globalDebt.central_bank_rocs?.boj_japan)}
                  </div>

                  <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 text-xs">PBOC (China):</span>
                      <span className="font-bold text-slate-200 text-sm">${globalDebt.central_bank_breakdown_tn?.pboc_china}T</span>
                    </div>
                    {renderRocLine(globalDebt.central_bank_rocs?.pboc_china)}
                  </div>
                </div>
              </div>

              <div className="bg-[#121c2e] p-3 rounded border border-slate-800 space-y-2">
                <span className="text-xs text-slate-500 uppercase block font-semibold">
                  BROAD M2 MONEY SUPPLY: ${globalDebt.global_m2_usd_tn}T
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                  <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 text-xs">US M2:</span>
                      <span className="font-bold text-slate-200 text-sm">${globalDebt.m2_breakdown_tn?.united_states}T</span>
                    </div>
                    {renderRocLine(globalDebt.m2_rocs?.united_states)}
                  </div>

                  <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 text-xs">China M2:</span>
                      <span className="font-bold text-slate-200 text-sm">${globalDebt.m2_breakdown_tn?.china}T</span>
                    </div>
                    {renderRocLine(globalDebt.m2_rocs?.china)}
                  </div>

                  <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 text-xs">Eurozone M2:</span>
                      <span className="font-bold text-slate-200 text-sm">${globalDebt.m2_breakdown_tn?.eurozone}T</span>
                    </div>
                    {renderRocLine(globalDebt.m2_rocs?.eurozone)}
                  </div>

                  <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 text-xs">Japan M2:</span>
                      <span className="font-bold text-slate-200 text-sm">${globalDebt.m2_breakdown_tn?.japan}T</span>
                    </div>
                    {renderRocLine(globalDebt.m2_rocs?.japan)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Public Debt-to-Liquidity & NIIP */}
        <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-cyan-400" />
              <h3 className="font-mono text-base font-bold uppercase tracking-wider text-slate-100">
                PUBLIC DEBT-TO-DOMESTIC LIQUIDITY
              </h3>
            </div>
            <span className="text-xs font-mono text-rose-400 font-bold border border-rose-900 bg-rose-950/60 px-2 py-0.5 rounded">
              US STRUCTURAL DEFICIT
            </span>
          </div>

          <div className="space-y-4 font-mono text-sm">
            {/* Comparison Bars */}
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-2">
                SOVEREIGN PUBLIC DEBT-TO-DOMESTIC LIQUIDITY RATIOS (%)
              </span>
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-rose-400">United States: {globalDebt.debt_to_domestic_liquidity_ratios?.united_states_pct || 114}%</span>
                    <span className="text-slate-400 text-xs">Extremely Overleveraged vs Domestic Base</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                    <div
                      style={{ width: `${Math.min(100, Math.round(((globalDebt.debt_to_domestic_liquidity_ratios?.united_states_pct || 140) / 150) * 100))}%` }}
                      className="bg-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-emerald-400">Eurozone: {globalDebt.debt_to_domestic_liquidity_ratios?.eurozone_pct || 61.4}%</span>
                    <span className="font-bold text-emerald-400">Japan: {globalDebt.debt_to_domestic_liquidity_ratios?.japan_pct || 61.2}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                    <div
                      style={{ width: `${Math.min(100, Math.round(((globalDebt.debt_to_domestic_liquidity_ratios?.eurozone_pct || 61) / 150) * 100))}%` }}
                      className="bg-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-cyan-400">China: {globalDebt.debt_to_domestic_liquidity_ratios?.china_pct || 31.5}%</span>
                    <span className="font-bold text-cyan-400">Australia: {globalDebt.debt_to_domestic_liquidity_ratios?.australia_pct || 31.8}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                    <div
                      style={{ width: `${Math.min(100, Math.round(((globalDebt.debt_to_domestic_liquidity_ratios?.australia_pct || 31.8) / 150) * 100))}%` }}
                      className="bg-cyan-500"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>High Domestic Liquid Cushion</span>
                    <span>Pristine AAA / Super Cushion</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net International Investment Position (US & Australia) */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 uppercase font-semibold block">
                NET INTERNATIONAL INVESTMENT POSITION (NIIP)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* United States */}
                <div className="bg-[#0b1220] p-3 rounded-lg border border-rose-900/60 bg-gradient-to-br from-rose-950/20 to-transparent space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      UNITED STATES (IIPUSNETIQ)
                    </span>
                    <span className="text-sm font-black text-rose-400">
                      ${iip.net_iip_usd_tn || -24.2}T
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {iip.macro_implication || "US NIIP deficit sits at -$24.2T (~85% of GDP). Heavy reliance on foreign capital absorption."}
                  </p>
                </div>

                {/* Australia */}
                <div className="bg-[#0b1220] p-3 rounded-lg border border-cyan-900/60 bg-gradient-to-br from-cyan-950/20 to-transparent space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      AUSTRALIA (ABS 5302.0)
                    </span>
                    <span className="text-sm font-black text-cyan-400">
                      ${ausIip.net_iip_usd_tn || -0.42}T
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {ausIip.macro_implication || "Australia Net IIP sits at -$0.42T (-A$638.9B, ~24% of GDP). Resilient global buffer backed by A$4.5T in superannuation assets invested overseas."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C: BOND STRESS & FED-TREASURY ACCORD 2.0 TRIGGER GAUGE */}
      <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <h3 className="font-mono text-base font-bold uppercase tracking-wider text-slate-100">
              BOND MARKET PLUMBING &amp; FED-TREASURY ACCORD 2.0 TRIGGER GAUGE
            </h3>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
            ACCORD PROBABILITY: {accordGauge.probability_pct}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 10Y Yield Decomposition */}
          <div className="bg-[#121c2e] p-4 rounded-lg border border-slate-800 font-mono text-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold block mb-2">
                10Y YIELD DECOMPOSITION (42 MACRO 94% RULE)
              </span>
              <div className="space-y-2.5">
                <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">10Y Nominal (DGS10):</span>
                    <span className="font-bold text-white text-sm">{yieldDecomp.nominal_10y_pct}%</span>
                  </div>
                  {renderRocLine(bondRocs.nominal_10y)}
                </div>

                <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">10Y Real TIPS (DFII10):</span>
                    <span className="font-bold text-amber-300 text-sm">{yieldDecomp.real_tips_10y_pct}%</span>
                  </div>
                  {renderRocLine(bondRocs.real_10y_tips)}
                </div>

                <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">10Y Breakeven Inflation:</span>
                    <span className="font-bold text-cyan-300 text-sm">{yieldDecomp.breakeven_inflation_10y_pct}%</span>
                  </div>
                  {renderRocLine(bondRocs.breakeven_10y)}
                </div>

                <div className="pt-1 flex justify-between text-xs">
                  <span className="text-slate-400">Real Rate Share of Yield Rise:</span>
                  <span className="font-black text-rose-400">{yieldDecomp.real_rate_share_pct}%</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2.5 border-t border-slate-800/70 pt-2">{yieldDecomp.rule_interpretation}</p>
          </div>

          {/* 3Fourteen Fair Value & MOVE vs VIX */}
          <div className="bg-[#121c2e] p-4 rounded-lg border border-slate-800 font-mono text-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold block mb-2">
                3FOURTEEN FAIR VALUE &amp; MOVE/VIX RATIO
              </span>
              <div className="space-y-2.5">
                <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">2Y Actual vs FV:</span>
                    <span className="font-bold text-slate-200 text-sm">
                      {fvModel.actual_2y_pct}% (FV: {fvModel.fair_value_2y_pct}%)
                    </span>
                  </div>
                  {renderRocLine(bondRocs.two_year)}
                </div>

                <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">10Y Actual vs FV:</span>
                    <span className="font-bold text-slate-200 text-sm">
                      {fvModel.actual_10y_pct}% (FV: {fvModel.fair_value_10y_pct}%)
                    </span>
                  </div>
                  {renderRocLine(bondRocs.nominal_10y)}
                </div>

                <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">^MOVE Index:</span>
                    <span className="font-bold text-cyan-300 text-sm">{moveVix.move_index}</span>
                  </div>
                  {renderRocLine(bondRocs.move_index)}
                </div>

                <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">^VIX Index:</span>
                    <span className="font-bold text-cyan-300 text-sm">{moveVix.vix_index}</span>
                  </div>
                  {renderRocLine(bondRocs.vix_index)}
                </div>

                <div className="pt-1 flex justify-between text-xs">
                  <span className="text-slate-400">MOVE / VIX Ratio:</span>
                  <span className="font-bold text-cyan-300">{moveVix.move_vix_ratio}x ({moveVix.co_signer_signal})</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2.5 border-t border-slate-800/70 pt-2">{moveVix.co_signer_description}</p>
          </div>

          {/* Fed-Treasury Accord 2.0 Probability Gauge */}
          <div className="bg-[#121c2e] p-4 rounded-lg border border-slate-800 font-mono text-sm flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold block mb-2">
                ACCORD 2.0 PROBABILITY GAUGE
              </span>
              <div className="space-y-2.5">
                <div className="p-2.5 rounded bg-[#0b1220] border border-slate-800/80 text-center">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs uppercase font-semibold">ACCORD 2.0 PROBABILITY:</span>
                    <span className="text-base font-black text-amber-400">{accordGauge.probability_pct}%</span>
                  </div>
                  {renderRocLine(bondRocs.accord_gauge)}
                  <span className="text-xs font-bold text-slate-300 uppercase block mt-1">
                    {accordGauge.state}
                  </span>
                </div>

                <div className="p-2 rounded bg-[#0b1220] border border-slate-800/80">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">T-Bill Issuance Share:</span>
                    <span className="font-bold text-slate-200 text-sm">
                      {accordGauge.tbill_issuance_share_pct}% (TBAC Max: {accordGauge.tbac_recommended_limit_pct}%)
                    </span>
                  </div>
                  {renderRocLine(bondRocs.tbill_share)}
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Real Rate Surge Factor:</span>
                    <span className="font-bold text-slate-200">{accordGauge.sub_scores?.real_rate_surge_score} / 35</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">HY Credit Spread Stress:</span>
                    <span className="font-bold text-slate-200">{accordGauge.sub_scores?.credit_spread_stress_score} / 35</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2.5 border-t border-slate-800/70 pt-2">
              Accord 2.0 indicates market pressure for administrative caps on long Treasury yields or SLR balance-sheet relief.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
