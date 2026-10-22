"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Terminal,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface RefreshModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshComplete?: () => void;
}

interface StreamEvent {
  timestamp?: string;
  stage?: string;
  progress_pct?: number;
  message?: string;
  status?: string;
  diff?: any;
}

export const RefreshModal: React.FC<RefreshModalProps> = ({
  isOpen,
  onClose,
  onRefreshComplete,
}) => {
  const [status, setStatus] = useState<"IDLE" | "RUNNING" | "COMPLETED" | "FAILED">("IDLE");
  const [currentStage, setCurrentStage] = useState<string>("Initializing pipeline...");
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [diffReport, setDiffReport] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    let eventSource: EventSource | null = null;
    let isSubscribed = true;

    const startRefresh = async () => {
      setStatus("RUNNING");
      setProgress(5);
      setLogs(["[0%] Initializing Autonomous Refresh Pipeline..."]);
      setDiffReport(null);

      try {
        // Trigger pipeline run
        await fetch(getApiUrl("/api/v1/refresh/trigger"), { method: "POST" });

        // Connect to SSE stream
        eventSource = new EventSource(getApiUrl("/api/v1/refresh/stream"));

        eventSource.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data: StreamEvent = JSON.parse(event.data);

            if (data.progress_pct !== undefined) {
              setProgress(data.progress_pct);
            }
            if (data.stage) {
              setCurrentStage(data.stage);
            }
            if (data.message) {
              setLogs((prev) => [...prev.slice(-30), `[${data.progress_pct || 0}%] ${data.message}`]);
            }
            if (data.stage === "DIFF_REPORT" && data.diff) {
              setDiffReport(data.diff);
            }
            if (data.stage === "COMPLETED" || data.status === "COMPLETED") {
              setStatus("COMPLETED");
              setProgress(100);
              if (onRefreshComplete) onRefreshComplete();
            } else if (data.stage === "ERROR" || data.status === "FAILED") {
              setStatus("FAILED");
            }
          } catch {
            // Non-JSON comments/heartbeats
          }
        };

        eventSource.onerror = () => {
          if (status === "RUNNING") {
            // Check status via REST polling fallback
            checkStatusFallback();
          }
        };
      } catch (err: any) {
        setStatus("FAILED");
        setLogs((prev) => [...prev, `[ERROR] Failed to start pipeline: ${err.message}`]);
      }
    };

    const checkStatusFallback = async () => {
      try {
        const res = await fetch(getApiUrl("/api/v1/refresh/status"));
        if (res.ok) {
          const st = await res.json();
          if (st.status === "COMPLETED") {
            setStatus("COMPLETED");
            setProgress(100);
            const diffRes = await fetch(getApiUrl("/api/v1/refresh/diff"));
            if (diffRes.ok) setDiffReport(await diffRes.json());
            if (onRefreshComplete) onRefreshComplete();
          }
        }
      } catch {
        // ignore
      }
    };

    startRefresh();

    return () => {
      isSubscribed = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="refresh-modal-container"
        className="w-full max-w-3xl bg-[#0c121e] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg border ${
                status === "COMPLETED"
                  ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-400"
                  : status === "FAILED"
                  ? "bg-rose-950/80 border-rose-500/40 text-rose-400"
                  : "bg-cyan-950/80 border-cyan-500/40 text-cyan-400"
              }`}
            >
              <RefreshCw className={`h-5 w-5 ${status === "RUNNING" ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h2 className="text-base font-semibold font-mono tracking-wide text-slate-100 flex items-center gap-2">
                AUTONOMOUS DATA REFRESH
                <span
                  className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                    status === "COMPLETED"
                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-700/60"
                      : status === "FAILED"
                      ? "bg-rose-950/80 text-rose-400 border-rose-700/60"
                      : "bg-cyan-950/80 text-cyan-400 border-cyan-700/60 animate-pulse"
                  }`}
                >
                  {status}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Ingesting Open Data &bull; Scraping Media Transcripts &bull; Recalibrating Quantitative Models
              </p>
            </div>
          </div>
          <button
            id="close-refresh-modal-button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar & Stage Indicator */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/40 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 flex items-center gap-1.5 font-medium">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              STAGE: {currentStage}
            </span>
            <span className="text-slate-300 font-bold">{progress}%</span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 relative">
            <div
              className={`h-full transition-all duration-300 ease-out rounded-full ${
                status === "COMPLETED"
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_12px_#10b981]"
                  : status === "FAILED"
                  ? "bg-rose-500"
                  : "bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_12px_#06b6d4]"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Pipeline Checklist */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
            <div
              className={`p-2 rounded border flex items-center gap-1.5 ${
                progress >= 25
                  ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                  : "bg-slate-900/40 border-slate-800 text-slate-500"
              }`}
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${progress >= 25 ? "text-emerald-400" : "text-slate-600"}`} />
              <span>1. Open Data</span>
            </div>
            <div
              className={`p-2 rounded border flex items-center gap-1.5 ${
                progress >= 50
                  ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                  : "bg-slate-900/40 border-slate-800 text-slate-500"
              }`}
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${progress >= 50 ? "text-emerald-400" : "text-slate-600"}`} />
              <span>2. Media Scraper</span>
            </div>
            <div
              className={`p-2 rounded border flex items-center gap-1.5 ${
                progress >= 75
                  ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                  : "bg-slate-900/40 border-slate-800 text-slate-500"
              }`}
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${progress >= 75 ? "text-emerald-400" : "text-slate-600"}`} />
              <span>3. Quant Engines</span>
            </div>
            <div
              className={`p-2 rounded border flex items-center gap-1.5 ${
                progress >= 100
                  ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                  : "bg-slate-900/40 border-slate-800 text-slate-500"
              }`}
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${progress >= 100 ? "text-emerald-400" : "text-slate-600"}`} />
              <span>4. LLM Delta Diff</span>
            </div>
          </div>
        </div>

        {/* Content Body: Live Terminal Logs & Completed Diff */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {diffReport && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900/80 border border-cyan-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  WHAT CHANGED SINCE LAST REFRESH
                </span>
                <span className="text-[11px] font-mono text-slate-400">{diffReport.refresh_date}</span>
              </div>

              {/* Quant Deltas Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">US Net Liquidity Shift</div>
                  <div className="text-base font-bold text-slate-100 mt-1 flex items-center gap-2">
                    ${diffReport.quantitative_deltas?.net_liquidity?.current_bn}B
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        (diffReport.quantitative_deltas?.net_liquidity?.delta_bn || 0) >= 0
                          ? "bg-emerald-950 text-emerald-400"
                          : "bg-rose-950 text-rose-400"
                      }`}
                    >
                      {(diffReport.quantitative_deltas?.net_liquidity?.delta_bn || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {diffReport.quantitative_deltas?.net_liquidity?.delta_bn >= 0 ? "+" : ""}
                      ${diffReport.quantitative_deltas?.net_liquidity?.delta_bn}B
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Quad 2 Probability Shift</div>
                  <div className="text-base font-bold text-slate-100 mt-1 flex items-center gap-2">
                    {diffReport.quantitative_deltas?.quad_probabilities?.quad_2_reflation_pct}%
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
                      +{diffReport.quantitative_deltas?.quad_probabilities?.quad_2_delta_pts} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Call-Outs */}
              {diffReport.top_conviction_call_outs && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                    Top Institutional Conviction Tilts:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {diffReport.top_conviction_call_outs.map((c: any, i: number) => (
                      <div key={i} className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                        <span className="font-bold text-cyan-400">${c.ticker}</span>
                        <div className="text-slate-300 text-[11px]">
                          <span className="text-slate-400">[{c.stance}]:</span> {c.driver}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Narrative Highlights */}
              {diffReport.narrative_highlights && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-mono uppercase text-slate-400 mb-1.5">Key Strategy Takeaways:</div>
                  <ul className="space-y-1 text-xs text-slate-300 font-mono">
                    {diffReport.narrative_highlights.map((h: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Terminal Logs */}
          <div className="rounded-xl bg-black/60 border border-slate-800 p-3 font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-slate-500 pb-1 border-b border-slate-800/60">
              <Terminal className="h-3.5 w-3.5 text-cyan-500" />
              <span>LIVE LOG STREAM</span>
            </div>
            {logs.map((log, i) => (
              <div key={i} className="text-slate-300 font-mono leading-tight">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            {status === "COMPLETED" ? "All engines calibrated to latest data." : "Autonomous background execution active."}
          </span>
          <button
            id="dismiss-refresh-modal-button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-mono text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {status === "COMPLETED" ? "Close & View Dashboard" : "Close Window"}
          </button>
        </div>
      </div>
    </div>
  );
};
