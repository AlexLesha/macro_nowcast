"use client";

/**
 * ============================================================================
 * CRITICAL ARCHITECTURE CONTRACT: TOP & BOTTOM MENUS (NAVIGATION COMPONENT)
 * ============================================================================
 * NOTE TO DEVELOPERS:
 * This component renders the Top Header text-based single-row navigation with
 * pipe separators.
 *
 * ALWAYS KEEP BOTH SIDES (TOP HEADER AND BOTTOM FOOTER) SYNCHRONIZED WHEN
 * ADDING, RENAMING, OR MODIFYING ROUTES IN `@/lib/navigation`!
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshModal } from "./RefreshModal";
import { ExportModal } from "./ExportModal";
import { getApiUrl } from "@/lib/api";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

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
    const loadBadge = () => {
      fetch(getApiUrl("/api/v1/executive-summary"), { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (json?.header_badge) setLiveHeaderBadge(json.header_badge);
        })
        .catch(() => { });
    };
    loadBadge();

    const handleGlobalRefresh = () => {
      loadBadge();
    };
    window.addEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
    return () => window.removeEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
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
        {/* Compact, smaller height container */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 space-y-1.5">
          {/* TOP UTILITY BAR: Brand & Regime Left | Date, API Status, Refresh & Export Aligned Right */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
            <div className="flex items-center gap-2.5">
              <Link href="/" className="text-sm md:text-base font-bold tracking-tight text-white hover:opacity-90 transition">
                MacroPulse <span className="text-cyan-400">Alpha</span>
              </Link>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-xs">
                {liveHeaderBadge}
              </span>
              <Link
                href="/sources-test"
                className={`hidden md:inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-mono transition ${pathname === "/sources-test"
                    ? "bg-cyan-600/30 border-cyan-400 text-cyan-300 font-semibold"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
              >
                🔬Lab
              </Link>
            </div>

            {/* Date, API Status, Refresh & Export */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
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
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border transition ${apiOnline
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : backendStatus === "waking" || backendStatus === "checking"
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                      : "bg-rose-950/40 border-rose-500/40 text-rose-300 cursor-pointer"
                  }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${apiOnline
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
                className="px-2.5 py-0.5 rounded bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-sm transition active:scale-[0.98]"
              >
                ↻ Refresh Data
              </button>

              <button
                type="button"
                id="header-export-share-button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              >
                Export
              </button>

              {/* FONT RESIZE BUTTONS (A- / A+) */}
              <div className="flex items-center gap-1 border-l border-slate-700/60 pl-1.5">
                <button
                  type="button"
                  title={`Decrease font size (${fontScale}%)`}
                  onClick={() => adjustFontSize(-5)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold transition active:scale-95"
                >
                  A-
                </button>
                <button
                  type="button"
                  title={`Increase font size (${fontScale}%)`}
                  onClick={() => adjustFontSize(+5)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold transition active:scale-95"
                >
                  A+
                </button>
              </div>
            </div>
          </div>

          {/* TEXT-BASED NAVIGATION WITH PIPE SEPARATORS (IDENTICAL TO BOTTOM FOOTER) */}
          <nav
            id="header-text-navigation-bar"
            className="flex flex-wrap items-center justify-center gap-y-1 font-mono text-xs md:text-sm"
          >
            {MAIN_NAV_ITEMS.map((item, idx) => {
              const isActive = pathname === item.href;
              return (
                <React.Fragment key={item.href}>
                  {idx > 0 && (
                    <span className="text-slate-600 px-1.5 md:px-2 select-none">|</span>
                  )}
                  <Link
                    href={item.href}
                    id={`header-nav-link-${item.href.replace("/", "") || "summary"}`}
                    className={`transition font-medium ${
                      isActive
                        ? "text-cyan-300 font-bold underline underline-offset-4 decoration-cyan-400"
                        : "text-slate-400 hover:text-white hover:underline underline-offset-4 decoration-slate-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Autonomous Modals */}
      <RefreshModal isOpen={isRefreshModalOpen} onClose={() => setIsRefreshModalOpen(false)} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </>
  );
};
