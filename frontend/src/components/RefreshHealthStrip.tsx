"use client";

import React, { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

export interface ComponentStatus {
  color: "green" | "amber" | "red";
  label: string;
  last_error?: string | null;
}

export interface RefreshHealthPayload {
  last_checked_utc: string | null;
  backend_api: ComponentStatus;
  macro_data: ComponentStatus;
  market_feeds: ComponentStatus;
  gemini_ai: ComponentStatus & { last_run_tokens?: number; calls_today?: number };
}

const DOT_STYLES: Record<"green" | "amber" | "red", string> = {
  green: "bg-emerald-400 shadow-[0_0_8px_#10b981]",
  amber: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
  red: "bg-rose-500 shadow-[0_0_10px_#ef4444] animate-pulse",
};

const TEXT_STYLES: Record<"green" | "amber" | "red", string> = {
  green: "text-slate-200 border-slate-700/80 bg-slate-900/90",
  amber: "text-amber-300 border-amber-500/40 bg-amber-950/30",
  red: "text-rose-300 border-rose-500/60 bg-rose-950/50 font-semibold",
};

export function RefreshHealthStrip({ apiBaseUrl }: { apiBaseUrl?: string }) {
  const [health, setHealth] = useState<RefreshHealthPayload | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkHealth = async (force = false) => {
    setIsChecking(true);
    try {
      const endpoint = apiBaseUrl 
        ? `${apiBaseUrl.replace(/\/$/, "")}/api/v1/refresh/status?force=${force}`
        : getApiUrl(`/api/v1/refresh/status?force=${force}`);

      const res = await fetch(endpoint, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({
        last_checked_utc: new Date().toISOString(),
        backend_api: { color: "red", label: "API Offline / Waking" },
        macro_data: { color: "amber", label: "Macro: Standby" },
        market_feeds: { color: "amber", label: "Markets: Standby" },
        gemini_ai: { color: "amber", label: "Gemini: Unreachable" },
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth(false);
  }, []);

  if (!health) return null;

  const items = [
    { key: "API", ...health.backend_api },
    { key: "Macro", ...health.macro_data },
    { key: "Markets", ...health.market_feeds },
    { key: "Gemini AI", ...health.gemini_ai },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#0B101B] px-3 py-1.5 text-sm font-mono">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-400 uppercase tracking-wider text-xs">
          System & Quota:
        </span>
        {items.map((item) => (
          <div
            key={item.key}
            title={item.last_error || item.label}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${TEXT_STYLES[item.color] || TEXT_STYLES.amber}`}
          >
            <span className={`h-2 w-2 rounded-full ${DOT_STYLES[item.color] || DOT_STYLES.amber}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => checkHealth(true)}
        disabled={isChecking}
        className="text-xs text-cyan-400 hover:text-cyan-300 underline decoration-dotted disabled:opacity-50"
        title="Re-check API & Gemini key status (0 tokens)"
      >
        {isChecking ? "Checking..." : "Check Status"}
      </button>
    </div>
  );
}
