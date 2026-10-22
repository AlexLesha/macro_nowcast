"use client";

import React, { useState } from "react";
import { Grid, Shield, TrendingUp, TrendingDown, Layers, Activity } from "lucide-react";

interface MarketDailyItem {
  ticker: string;
  asset_class: string;
  date: string;
  close: number | null;
  rv_21d: number | null;
  iv_30d: number | null;
  vams_score: number | null;
  vams_state: string | null;
  rr_trade_low: number | null;
  rr_trade_high: number | null;
  rr_trend_pivot: number | null;
  rr_trend_state: string | null;
  rr_tail_pivot: number | null;
}

interface RiskMatrixTableProps {
  matrix: MarketDailyItem[];
}

export const RiskMatrixTable: React.FC<RiskMatrixTableProps> = ({ matrix }) => {
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>("ALL");

  const assetClasses = ["ALL", "EQUITY", "FIXED_INCOME", "COMMODITY", "CURRENCY", "VOLATILITY"];

  const filtered = matrix.filter((item) =>
    selectedAssetClass === "ALL" ? true : item.asset_class === selectedAssetClass
  );

  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#0a101d]">
        <div className="flex items-center gap-2">
          <Grid className="h-4 w-4 text-cyan-400" />
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
            42-MARKET RISK RANGE &amp; VAMS MOMENTUM MATRIX
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 font-mono text-xs">
          {assetClasses.map((ac) => (
            <button
              key={ac}
              onClick={() => setSelectedAssetClass(ac)}
              className={`px-2.5 py-1 rounded transition text-[11px] ${
                selectedAssetClass === ac
                  ? "bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {ac.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#0b1220] text-slate-400 uppercase text-[10px] sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">TICKER</th>
              <th className="px-3 py-3">ASSET CLASS</th>
              <th className="px-3 py-3 text-right">PRICE</th>
              <th className="px-3 py-3 text-right">21D VOL (RV)</th>
              <th className="px-3 py-3 text-right">30D IMP VOL</th>
              <th className="px-3 py-3 text-center">VAMS SCORE</th>
              <th className="px-3 py-3 text-center">VAMS STATE</th>
              <th className="px-3 py-3 text-center">TRADE RANGE [LOW - HIGH]</th>
              <th className="px-3 py-3 text-right">TREND PIVOT</th>
              <th className="px-3 py-3 text-center">TREND</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((item) => {
              const vams = item.vams_score;
              const isBull = item.vams_state === "BULLISH_TREND";
              const isBear = item.vams_state === "BEARISH_TREND";
              const isTrendBull = item.rr_trend_state === "BULLISH";

              return (
                <tr key={item.ticker} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-2.5 font-bold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span>{item.ticker}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {item.asset_class}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-100">
                    ${item.close?.toFixed(2) ?? "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-300">
                    {item.rv_21d ? `${item.rv_21d.toFixed(1)}%` : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-cyan-300">
                    {item.iv_30d ? `${item.iv_30d.toFixed(1)}%` : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold">
                    {vams !== null ? (
                      <span
                        className={
                          vams > 1.0 ? "text-emerald-400" : vams < -1.0 ? "text-rose-400" : "text-amber-400"
                        }
                      >
                        {vams > 0 ? `+${vams.toFixed(2)}` : vams.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isBull
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                          : isBear
                          ? "bg-rose-950/80 text-rose-300 border-rose-800"
                          : "bg-amber-950/80 text-amber-300 border-amber-800"
                      }`}
                    >
                      {item.vams_state || "NEUTRAL"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-300">
                    {item.rr_trade_low && item.rr_trade_high ? (
                      <span className="px-2 py-0.5 rounded bg-[#131e32] border border-slate-700/60">
                        ${item.rr_trade_low.toFixed(2)} — ${item.rr_trade_high.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-300">
                    ${item.rr_trend_pivot?.toFixed(2) ?? "-"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 font-bold text-[10px] ${
                        isTrendBull ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isTrendBull ? (
                        <>
                          <TrendingUp className="h-3 w-3" />
                          <span>BULLISH</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3" />
                          <span>BEARISH</span>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
