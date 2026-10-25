"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  RefreshCw,
  Share2,
  Terminal,
  Layers,
  Scale,
  TrendingUp,
  Target,
  Sparkles,
  Compass,
  BarChart3,
  Crosshair,
  Flame,
} from "lucide-react";
import { RefreshModal } from "./RefreshModal";
import { ExportModal } from "./ExportModal";
import { API_BASE_URL } from "@/lib/api";

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const [backendStatus, setBackendStatus] = useState<"checking" | "waking" | "online" | "offline">("checking");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = React.useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      let res = await fetch(`${API_BASE_URL}/api/v1/health`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE_URL}/api/health`, {
          signal: controller.signal,
          cache: "no-store",
        });
      }
      clearTimeout(timeoutId);
      if (res.ok) {
        setBackendStatus("online");
      } else {
        setBackendStatus("waking");
      }
    } catch {
      setBackendStatus((prev) => (prev === "waking" ? "waking" : "offline"));
    }
  }, []);

  useEffect(() => {
    checkHealth();
    let interval: NodeJS.Timeout;
    if (backendStatus === "checking" || backendStatus === "waking") {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        if (elapsedSeconds % 5 === 0) {
          checkHealth();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [checkHealth, backendStatus, elapsedSeconds]);

  useEffect(() => {
    if (backendStatus === "checking" && elapsedSeconds > 2) {
      setBackendStatus("waking");
    }
  }, [elapsedSeconds, backendStatus]);

  const navLinks = [
    { href: "/", label: "Nowcast Dashboard", icon: Activity, short: "Dashboard" },
    { href: "/synthesis", label: "Framework Synthesis", icon: Scale, short: "Synthesis" },
    { href: "/liquidity-allocation", label: "Liquidity & Allocation", icon: Layers, short: "Liquidity" },
    { href: "/outliers", label: "1-3M Outlier Scanner", icon: Target, short: "Outliers" },
    { href: "/speculation", label: "Speculation Matrix", icon: Sparkles, short: "Speculation" },
    { href: "/scenarios", label: "Policy Playbook", icon: Compass, short: "Scenarios" },
    { href: "/42-macro", label: "42 Macro Deep-Dive", icon: BarChart3, short: "42Macro" },
    { href: "/commodities-alternatives", label: "8. Commodities & Alts", icon: Flame, short: "Commodities" },
    { href: "/stock-xray", label: "Stock X-Ray", icon: Crosshair, short: "X-Ray" },
  ];

  return (
    <>
      <header className="border-b border-slate-800 bg-[#0c121e]/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Brand & Sub-Page Navigation */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30 group-hover:border-cyan-300 transition">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-base font-bold tracking-wider text-slate-100">
                  MACROPULSE<span className="text-cyan-400">.ALPHA</span>
                </span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                  v1.0
                </span>
              </div>
            </Link>

            {/* Sub-Pages Tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto py-1 text-xs font-mono">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    id={`nav-link-${link.short.toLowerCase()}`}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Action Buttons & Status Indicators */}
          <div className="flex items-center gap-2.5 text-xs font-mono shrink-0 w-full lg:w-auto justify-end">
            {/* UTC Clock */}
            <div className="hidden xl:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded text-slate-400 text-[11px]">
              <Terminal className="h-3 w-3 text-cyan-400" />
              <span>{currentTime || "UTC"}</span>
            </div>

            {/* Health Badge */}
            {backendStatus === "online" && (
              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded text-[11px] text-emerald-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
                <span>LIVE API</span>
              </div>
            )}

            {(backendStatus === "waking" || backendStatus === "checking") && (
              <button
                onClick={checkHealth}
                title="Render free tier takes ~30-50s to spin up. Click to ping."
                className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded text-[11px] text-amber-400 font-mono hover:bg-amber-900/40 transition cursor-pointer"
              >
                <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                <span>Waking Engine ({elapsedSeconds}s)...</span>
              </button>
            )}

            {backendStatus === "offline" && (
              <button
                onClick={() => { setElapsedSeconds(0); setBackendStatus("checking"); checkHealth(); }}
                title="Click to retry connection"
                className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/30 px-2.5 py-1 rounded text-[11px] text-rose-400 font-mono hover:bg-rose-900/40 transition cursor-pointer"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span>API Offline (Retry)</span>
              </button>
            )}

            {/* Refresh Data Button */}
            <button
              id="header-refresh-data-button"
              onClick={() => setIsRefreshModalOpen(true)}
              className="px-3 py-1.5 rounded-md bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-900/30 border border-cyan-400/30 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Data</span>
            </button>

            {/* Export / Share Button */}
            <button
              id="header-export-share-button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-semibold flex items-center gap-1.5 border border-slate-700 transition hover:border-slate-600"
            >
              <Share2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      <RefreshModal isOpen={isRefreshModalOpen} onClose={() => setIsRefreshModalOpen(false)} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </>
  );
};
