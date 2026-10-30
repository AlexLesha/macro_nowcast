"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshModal } from "./RefreshModal";
import { ExportModal } from "./ExportModal";
import { getApiUrl } from "@/lib/api";

const NAV_ITEMS_ROW_1 = [
  { label: "Summary", href: "/" },
  { label: "Framework Synthesis", href: "/synthesis" },
  { label: "Liquidity & Allocation", href: "/liquidity-allocation" },
  { label: "Outliers", href: "/outliers" },
  { label: "Stock Analysis", href: "/stock-analysis" },
  { label: "🔬 Sources Test", href: "/sources-test" },
];

const NAV_ITEMS_ROW_2 = [
  { label: "Speculation", href: "/speculation" },
  { label: "Policy Scenarios", href: "/scenarios" },
  { label: "42 Macro Deep-Dive", href: "/42-macro" },
  { label: "Commodities & Alts", href: "/commodities-alternatives" },
  { label: "Options & Vol Lab", href: "/options-lab" },
];

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const [backendStatus, setBackendStatus] = useState<"checking" | "waking" | "online" | "offline">("checking");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [displayDate, setDisplayDate] = useState<string>("");
  const [isRefreshModalOpen, setIsRefreshModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [liveHeaderBadge, setLiveHeaderBadge] = useState<string>("GRID: DEFLATION • US QUAD: Q3");
  const [fontScale, setFontScale] = useState<number>(100);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("app_font_scale");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!Number.isNaN(val) && val >= 80 && val <= 130) {
          setFontScale(val);
          document.documentElement.style.fontSize = `${(val / 100) * 16}px`;
        }
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }, []);

  const adjustFontSize = (delta: number) => {
    setFontScale((prev) => {
      const next = Math.min(130, Math.max(80, prev + delta));
      try {
        localStorage.setItem("app_font_scale", next.toString());
      } catch {
        // Ignore storage write errors
      }
      document.documentElement.style.fontSize = `${(next / 100) * 16}px`;
      return next;
    });
  };

  useEffect(() => {
    setDisplayDate(new Date().toISOString().slice(0, 10));
    fetch(getApiUrl("/api/v1/executive-summary"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.header_badge) setLiveHeaderBadge(json.header_badge);
      })
      .catch(() => { });
  }, []);

  const checkHealth = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      let res = await fetch(getApiUrl("/api/v1/health"), {
        signal: controller.signal,
        cache: "no-store",
      });
      if (res.status === 404) {
        res = await fetch(getApiUrl("/api/health"), {
          signal: controller.signal,
          cache: "no-store",
        });
      }
      if (res.ok) {
        setBackendStatus("online");
      } else {
        setBackendStatus("waking");
      }
    } catch {
      setBackendStatus((prev) => (prev === "waking" ? "waking" : "offline"));
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    if (backendStatus !== "checking" && backendStatus !== "waking") {
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next % 5 === 0) {
          checkHealth();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [checkHealth, backendStatus]);

  useEffect(() => {
    if (backendStatus === "checking" && elapsedSeconds > 2) {
      setBackendStatus("waking");
    }
  }, [elapsedSeconds, backendStatus]);

  const apiOnline = backendStatus === "online";
  const apiStatusLabel =
    backendStatus === "online"
      ? "Live API Synced"
      : backendStatus === "waking"
        ? `Waking Engine (${elapsedSeconds}s)`
        : backendStatus === "checking"
          ? "Connecting..."
          : "API Offline (Click to Retry)";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-md">
        {/* Aligned to exact max-w-7xl mx-auto px-4 md:px-6 container width */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-2.5 pb-3 space-y-2.5">
          {/* TOP UTILITY BAR: Brand & Regime Left | Date, API Status, Refresh & Export Moved Higher & Aligned Right */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-base md:text-lg font-bold tracking-tight text-white hover:opacity-90 transition">
                MacroPulse <span className="text-cyan-400">Alpha</span>
              </Link>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-[11px]">
                {liveHeaderBadge}
              </span>
              <Link
                href="/stock-analysis"
                className={`hidden md:inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-mono transition ${pathname === "/stock-analysis"
                  ? "bg-cyan-600/30 border-cyan-400 text-cyan-300 font-semibold"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
              >
                Stock Analysis
              </Link>
              <Link
                href="/stock-xray"
                className={`hidden md:inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-mono transition ${pathname === "/stock-xray"
                  ? "bg-purple-600/30 border-purple-400 text-purple-300 font-semibold"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
              >
                Stock X-Ray
              </Link>
            </div>

            {/* Date, API Status, Refresh & Export aligned flush with right edge of content table */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                {displayDate || "2026-10-26"}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (!apiOnline) {
                    setElapsedSeconds(0);
                    setBackendStatus("checking");
                    checkHealth();
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border transition ${apiOnline
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : backendStatus === "waking" || backendStatus === "checking"
                    ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                    : "bg-rose-950/40 border-rose-500/40 text-rose-300 cursor-pointer"
                  }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${apiOnline
                    ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]"
                    : backendStatus === "waking" || backendStatus === "checking"
                      ? "bg-amber-400 animate-spin"
                      : "bg-rose-500"
                    }`}
                />
                {apiStatusLabel}
              </button>

              <button
                type="button"
                id="header-refresh-data-button"
                onClick={() => setIsRefreshModalOpen(true)}
                className="px-3 py-1 rounded bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-sm transition active:scale-[0.98]"
              >
                ↻ Refresh Data
              </button>

              <button
                type="button"
                id="header-export-share-button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              >
                Export
              </button>
              {/* FONT RESIZE BUTTONS (A- / A+) */}
              <div className="flex items-center gap-1 border-l border-slate-700/60 pl-2">
                <button
                  type="button"
                  title={`Decrease font size (${fontScale}%)`}
                  onClick={() => adjustFontSize(-5)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold transition active:scale-95"
                >
                  A-
                </button>
                <button
                  type="button"
                  title={`Increase font size (${fontScale}%)`}
                  onClick={() => adjustFontSize(+5)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold transition active:scale-95"
                >
                  A+
                </button>
              </div>
            </div>
          </div>

          {/* 2-LINE MAIN NAVIGATION MENU (Aligned to full width of content table) */}
          <nav className="space-y-1.5 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {NAV_ITEMS_ROW_1.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    id={`nav-link-${item.href.replace("/", "") || "summary"}`}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md border text-center font-medium transition truncate ${active
                      ? "bg-blue-600/90 border-blue-400 text-white shadow-sm"
                      : "bg-[#111827] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {NAV_ITEMS_ROW_2.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    id={`nav-link-${item.href.replace("/", "")}`}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md border text-center font-medium transition truncate ${active
                      ? "bg-blue-600/90 border-blue-400 text-white shadow-sm"
                      : "bg-[#111827] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      {/* Autonomous Modals */}
      <RefreshModal isOpen={isRefreshModalOpen} onClose={() => setIsRefreshModalOpen(false)} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </>
  );
};
