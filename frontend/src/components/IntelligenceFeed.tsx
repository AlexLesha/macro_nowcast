"use client";

import React, { useState } from "react";
import { BookOpen, Radio, Sparkles, RefreshCw, ExternalLink } from "lucide-react";

interface IntelligenceDeltaItem {
  id: string;
  timestamp_utc: string | null;
  framework_author: string;
  source_type: string;
  source_title: string;
  source_url: string | null;
  published_at: string | null;
  summary_markdown: string;
  extracted_json: string | null;
  affected_tickers: string | null;
}

interface IntelligenceFeedProps {
  deltas: IntelligenceDeltaItem[];
  onTriggerHoldingsSync?: () => void;
  onTriggerCftcSync?: () => void;
  isSyncing?: boolean;
}

export const IntelligenceFeed: React.FC<IntelligenceFeedProps> = ({
  deltas,
  onTriggerHoldingsSync = () => {},
  onTriggerCftcSync = () => {},
  isSyncing = false,
}) => {
  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-cyan-400" />
          <h3 className="font-mono text-base font-bold uppercase tracking-wider text-slate-100">
            SYSTEMATIC INTELLIGENCE &amp; PORTFOLIO DELTAS
          </h3>
        </div>

        <div className="flex items-center gap-2 font-mono text-sm">
          <button
            onClick={onTriggerHoldingsSync}
            disabled={isSyncing}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-cyan-600/30 text-cyan-300 border border-slate-700/80 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
            <span>3FOURTEEN (FCTE/RAA)</span>
          </button>
          <button
            onClick={onTriggerCftcSync}
            disabled={isSyncing}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-cyan-600/30 text-cyan-300 border border-slate-700/80 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
            <span>CFTC COT</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
        {deltas.map((delta) => {
          let parsedData: any = null;
          if (delta.extracted_json) {
            try {
              parsedData = JSON.parse(delta.extracted_json);
            } catch {
              // ignore
            }
          }

          return (
            <div
              key={delta.id}
              className="bg-[#121c2e] border border-slate-800/80 rounded-lg p-4 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono font-bold">
                    {delta.framework_author}
                  </span>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {delta.source_type}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {delta.timestamp_utc ? new Date(delta.timestamp_utc).toLocaleDateString() : ""}
                </span>
              </div>

              <h4 className="font-mono text-base font-bold text-slate-100 flex items-center gap-1.5">
                <span>{delta.source_title}</span>
                {delta.source_url && (
                  <a
                    href={delta.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-cyan-400 transition"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </h4>

              <p className="text-sm text-slate-300 font-sans mt-1 leading-relaxed">
                {delta.summary_markdown}
              </p>

              {/* If FCTE holdings parsed */}
              {parsedData?.fcte_holdings && (
                <div className="mt-3 bg-[#0b1220] p-2.5 rounded border border-slate-800/80">
                  <span className="text-xs font-mono text-cyan-400 block mb-2 font-semibold">
                    WARREN PIES FCTE TOP 20 CONVICTION STOCKS:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedData.fcte_holdings.map((h: any) => (
                      <span
                        key={h.ticker}
                        className="text-xs font-mono px-2 py-0.5 rounded bg-[#131e33] border border-slate-700/60 text-slate-200"
                      >
                        <strong>{h.ticker}</strong>: {h.weight_pct}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* If RAA allocations parsed */}
              {parsedData?.raa_allocations && (
                <div className="mt-3 bg-[#0b1220] p-2.5 rounded border border-slate-800/80">
                  <span className="text-xs font-mono text-cyan-400 block mb-2 font-semibold">
                    3FOURTEEN RAA TARGET ASSET ALLOCATION:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {parsedData.raa_allocations.map((a: any) => (
                      <div
                        key={a.asset_class}
                        className="text-xs font-mono p-1.5 rounded bg-[#131e33] border border-slate-700/60 flex justify-between"
                      >
                        <span className="text-slate-300 truncate mr-1">{a.asset_class}</span>
                        <span className="font-bold text-cyan-300">{a.weight_pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* If CFTC COT parsed */}
              {parsedData?.cftc_cot && (
                <div className="mt-3 bg-[#0b1220] p-2.5 rounded border border-slate-800/80">
                  <span className="text-xs font-mono text-cyan-400 block mb-2 font-semibold">
                    CFTC NET NON-COMMERCIAL POSITIONING &amp; PERCENTILE RANK:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {parsedData.cftc_cot.map((c: any) => (
                      <div
                        key={c.contract}
                        className="text-xs font-mono p-1.5 rounded bg-[#131e33] border border-slate-700/60 flex justify-between"
                      >
                        <span className="text-slate-300">{c.ticker} ({c.percentile_3y}%)</span>
                        <span
                          className={`font-bold ${
                            c.net_position > 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {c.net_position.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
