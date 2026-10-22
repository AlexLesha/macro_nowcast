"use client";

import React, { useState, useEffect } from "react";
import { X, TrendingUp, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getApiUrl } from "@/lib/api";

interface ChartModalProps {
  seriesId: string | null;
  onClose: () => void;
}

export const ChartModal: React.FC<ChartModalProps> = ({ seriesId, onClose }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartMode, setChartMode] = useState<"value" | "yoy" | "zscore">("value");

  useEffect(() => {
    if (!seriesId) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl(`/api/macro/series/${seriesId}?limit=120`));
        if (res.ok) {
          const items = await res.json();
          setData(items);
        }
      } catch (e) {
        console.error("Failed to fetch series history:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [seriesId]);

  if (!seriesId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1626] border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0a101d]">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-cyan-400" />
            <h3 className="font-mono text-base font-bold text-white">
              {seriesId} — HISTORICAL TRANSFORMATIONS
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-xs font-mono">
              <button
                onClick={() => setChartMode("value")}
                className={`px-2.5 py-1 rounded transition ${
                  chartMode === "value" ? "bg-cyan-600 text-white font-bold" : "text-slate-400"
                }`}
              >
                LEVEL
              </button>
              <button
                onClick={() => setChartMode("yoy")}
                className={`px-2.5 py-1 rounded transition ${
                  chartMode === "yoy" ? "bg-cyan-600 text-white font-bold" : "text-slate-400"
                }`}
              >
                YoY RoC %
              </button>
              <button
                onClick={() => setChartMode("zscore")}
                className={`px-2.5 py-1 rounded transition ${
                  chartMode === "zscore" ? "bg-cyan-600 text-white font-bold" : "text-slate-400"
                }`}
              >
                3Y Z-SCORE
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {loading ? (
            <div className="h-72 flex items-center justify-center text-slate-400 font-mono text-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mr-3" />
              Loading series history from database...
            </div>
          ) : data.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-500 font-mono text-xs">
              No historical data available for {seriesId}
            </div>
          ) : (
            <div className="h-72 w-full font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => String(val).slice(0, 7)}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      borderColor: "#334155",
                      color: "#f8fafc",
                      borderRadius: 8,
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                  />
                  {chartMode === "value" && (
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Level"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {chartMode === "yoy" && (
                    <Line
                      type="monotone"
                      dataKey="yoy_roc"
                      name="YoY RoC (%)"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {chartMode === "zscore" && (
                    <Line
                      type="monotone"
                      dataKey="z_score_3y"
                      name="3Y Z-Score (σ)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
