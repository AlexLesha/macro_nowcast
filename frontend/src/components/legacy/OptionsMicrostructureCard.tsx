"use client";

import React from "react";
import { Zap, ShieldCheck, Target, Flame, AlertCircle } from "lucide-react";

interface OptionsMicrostructureItem {
  ticker: string;
  date: string;
  total_gex: number | null;
  zero_dte_heat_ratio: number | null;
  gamma_flip_level: number | null;
  call_wall: number | null;
  put_wall: number | null;
  skew_25d: number | null;
  put_call_vol_ratio: number | null;
  crowding_z: number | null;
}

interface OptionsMicrostructureProps {
  items: OptionsMicrostructureItem[];
  onTriggerOptionsSync: () => void;
  isSyncing: boolean;
}

export const OptionsMicrostructureCard: React.FC<OptionsMicrostructureProps> = ({
  items,
  onTriggerOptionsSync,
  isSyncing,
}) => {
  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          <h3 className="font-mono text-base font-bold uppercase tracking-wider text-slate-100">
            OPTIONS MICROSTRUCTURE &amp; DEALER GEX REGIME
          </h3>
        </div>

        <button
          onClick={onTriggerOptionsSync}
          disabled={isSyncing}
          className="text-sm font-mono px-3 py-1 rounded bg-slate-800 hover:bg-cyan-600/30 text-cyan-300 border border-slate-700/80 transition"
        >
          {isSyncing ? "SYNCING GEX..." : "UPDATE GEX"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((opt) => {
          const isPositiveGex = (opt.total_gex ?? 0) >= 0;

          return (
            <div
              key={opt.ticker}
              className="bg-[#121c2e] border border-slate-800/80 rounded-lg p-4 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold font-mono text-white tracking-wide">
                  {opt.ticker}
                </span>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded font-bold border ${
                    isPositiveGex
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                      : "bg-rose-950/80 text-rose-300 border-rose-800"
                  }`}
                >
                  {isPositiveGex ? "LONG GAMMA (VOL SUPPRESSION)" : "SHORT GAMMA (VOL EXPANSION)"}
                </span>
              </div>

              {/* Net GEX */}
              <div className="flex items-baseline justify-between py-1 border-b border-slate-800/60 font-mono text-sm">
                <span className="text-slate-400">Total Dealer GEX:</span>
                <span
                  className={`font-bold ${
                    isPositiveGex ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {opt.total_gex ? `${opt.total_gex > 0 ? "+" : ""}${opt.total_gex} $M/1%` : "-"}
                </span>
              </div>

              {/* Gamma Flip Level */}
              <div className="flex items-baseline justify-between py-1 border-b border-slate-800/60 font-mono text-sm">
                <span className="text-slate-400">Gamma Flip Level:</span>
                <span className="font-bold text-amber-300">
                  ${opt.gamma_flip_level?.toFixed(2) ?? "-"}
                </span>
              </div>

              {/* Call Wall / Put Wall */}
              <div className="grid grid-cols-2 gap-2 py-2 font-mono text-sm">
                <div className="bg-[#0b1220] p-2 rounded border border-slate-800 text-center">
                  <span className="text-xs text-slate-500 block">CALL WALL</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    ${opt.call_wall?.toFixed(0) ?? "-"}
                  </span>
                </div>
                <div className="bg-[#0b1220] p-2 rounded border border-slate-800 text-center">
                  <span className="text-xs text-slate-500 block">PUT WALL</span>
                  <span className="font-bold text-rose-400 text-sm">
                    ${opt.put_wall?.toFixed(0) ?? "-"}
                  </span>
                </div>
              </div>

              {/* 0DTE Heat & Skew */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-amber-400" />
                  0DTE Heat: <strong className="text-slate-200">{((opt.zero_dte_heat_ratio ?? 0) * 100).toFixed(0)}%</strong>
                </span>
                <span>
                  25d Skew: <strong className="text-cyan-300">{opt.skew_25d?.toFixed(1) ?? "-"}%</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
