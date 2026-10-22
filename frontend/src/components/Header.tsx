"use client";

import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, Database, Terminal, ShieldAlert } from "lucide-react";

interface HeaderProps {
  onRefreshAll: () => void;
  isIngesting: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefreshAll, isIngesting }) => {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          setBackendStatus("online");
        } else {
          setBackendStatus("offline");
        }
      } catch {
        setBackendStatus("offline");
      }
    };
    checkHealth();
    const poll = setInterval(checkHealth, 15000);
    return () => clearInterval(poll);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-[#0c121e]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/10 border border-cyan-400/30">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-wider text-slate-100">
                MACROPULSE<span className="text-cyan-400">.ALPHA</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                v1.0-LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Quantitative Macro Nowcast &amp; Microstructure Engine
            </p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-md text-slate-300">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span>{currentTime || "UTC CLOCK"}</span>
          </div>

          {/* Backend Health Badge */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-md">
            <span
              className={`h-2 w-2 rounded-full ${
                backendStatus === "online"
                  ? "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                  : backendStatus === "checking"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
              }`}
            />
            <span className="text-slate-300">
              API:{" "}
              <strong
                className={
                  backendStatus === "online"
                    ? "text-emerald-400"
                    : backendStatus === "checking"
                    ? "text-amber-400"
                    : "text-rose-400"
                }
              >
                {backendStatus.toUpperCase()}
              </strong>
            </span>
          </div>

          {/* Refresh Ingestion Trigger */}
          <button
            onClick={onRefreshAll}
            disabled={isIngesting}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-medium transition border ${
              isIngesting
                ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                : "bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border-cyan-500/40 hover:border-cyan-400"
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isIngesting ? "animate-spin" : ""}`} />
            <span>{isIngesting ? "INGESTING..." : "INGEST ALL"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
