"use client";

import React, { useState } from "react";
import { Database, TrendingUp, TrendingDown, ArrowUpDown, Play, CheckCircle } from "lucide-react";

interface MacroSeriesItem {
  series_id: string;
  source: string;
  date: string;
  value: number | null;
  yoy_roc: number | null;
  mom_roc: number | null;
  z_score_3y: number | null;
  updated_at: string | null;
}

interface MacroSeriesTableProps {
  series: MacroSeriesItem[];
  onSelectSeries: (seriesId: string) => void;
  onIngestSingle: (seriesId: string) => void;
}

export const MacroSeriesTable: React.FC<MacroSeriesTableProps> = ({
  series,
  onSelectSeries,
  onIngestSingle,
}) => {
  const [search, setSearch] = useState("");
  const [ingestingId, setIngestingId] = useState<string | null>(null);

  const filtered = series.filter(
    (s) =>
      s.series_id.toLowerCase().includes(search.toLowerCase()) ||
      s.source.toLowerCase().includes(search.toLowerCase())
  );

  const handleIngest = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIngestingId(id);
    await onIngestSingle(id);
    setIngestingId(null);
  };

  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0a101d]">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-400" />
          <h3 className="font-mono text-base font-bold uppercase tracking-wider text-slate-100">
            MACRO ECONOMIC INGESTION LAYER
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {series.length} Series Loaded
          </span>
        </div>

        <input
          type="text"
          placeholder="Filter series (e.g. CPI, GDP, DGS10)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm bg-[#121c2e] border border-slate-700/80 rounded-md px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64 font-mono"
        />
      </div>

      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-[#0b1220] text-slate-400 uppercase text-xs sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">SERIES ID</th>
              <th className="px-3 py-3">SOURCE</th>
              <th className="px-3 py-3">LATEST DATE</th>
              <th className="px-3 py-3 text-right">VALUE</th>
              <th className="px-3 py-3 text-right">YoY RoC (%)</th>
              <th className="px-3 py-3 text-right">MoM RoC (%)</th>
              <th className="px-3 py-3 text-center">3Y Z-SCORE</th>
              <th className="px-3 py-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((item) => {
              const yoyVal = item.yoy_roc;
              const zVal = item.z_score_3y;

              return (
                <tr
                  key={item.series_id}
                  onClick={() => onSelectSeries(item.series_id)}
                  className="hover:bg-slate-800/40 transition cursor-pointer group"
                >
                  <td className="px-4 py-2.5 font-bold text-cyan-300 group-hover:text-cyan-200">
                    {item.series_id}
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs">
                      {item.source}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">{item.date}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-white">
                    {item.value !== null ? item.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold">
                    {yoyVal !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          yoyVal > 0 ? "text-emerald-400" : yoyVal < 0 ? "text-rose-400" : "text-slate-400"
                        }`}
                      >
                        {yoyVal > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {yoyVal > 0 ? `+${yoyVal.toFixed(2)}%` : `${yoyVal.toFixed(2)}%`}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold">
                    {item.mom_roc !== null ? (
                      <span
                        className={
                          item.mom_roc > 0 ? "text-emerald-400" : item.mom_roc < 0 ? "text-rose-400" : "text-slate-400"
                        }
                      >
                        {item.mom_roc > 0 ? `+${item.mom_roc.toFixed(2)}%` : `${item.mom_roc.toFixed(2)}%`}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {zVal !== null ? (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border ${
                          zVal > 1.5
                            ? "bg-rose-950/80 text-rose-300 border-rose-800"
                            : zVal < -1.5
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                            : "bg-slate-900 text-slate-300 border-slate-800"
                        }`}
                      >
                        {zVal > 0 ? `+${zVal.toFixed(2)}σ` : `${zVal.toFixed(2)}σ`}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={(e) => handleIngest(e, item.series_id)}
                      disabled={ingestingId === item.series_id}
                      title="Sync latest data"
                      className="p-1 rounded bg-slate-800/80 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 transition border border-slate-700/60"
                    >
                      <Play
                        className={`h-3 w-3 ${ingestingId === item.series_id ? "animate-spin text-cyan-400" : ""}`}
                      />
                    </button>
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
