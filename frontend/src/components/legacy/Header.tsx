"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getApiUrl } from "@/lib/api";

interface HeaderProps {
  asOfDate?: string;
  apiStatusLabel?: string;
  apiOnline?: boolean;
  onRefreshClick?: () => void;
  onExportClick?: () => void;
  isRefreshing?: boolean;
}

const NAV_ITEMS_ROW_1 = [
  { label: "1. Executive Summary", href: "/" },
  { label: "2. Framework Synthesis", href: "/synthesis" },
  { label: "3. Liquidity & Allocation", href: "/liquidity-allocation" },
  { label: "4. Outliers", href: "/outliers" },
];

const NAV_ITEMS_ROW_2 = [
  { label: "5. 1st/2nd/3rd Order Speculation", href: "/speculation" },
  { label: "6. 4Q Scenarios & Policy", href: "/scenarios" },
  { label: "7. 42 Macro Deep-Dive", href: "/42-macro" },
  { label: "8. Commodities & Alts", href: "/commodities-alternatives" },
  { label: "9. Options & Vol Lab", href: "/options-lab" },
];

export default function Header({
  asOfDate,
  apiStatusLabel = "Live API Synced",
  apiOnline = true,
  onRefreshClick,
  onExportClick,
  isRefreshing = false,
}: HeaderProps) {
  const pathname = usePathname();
  const displayDate = asOfDate || new Date().toISOString().slice(0, 10);
  const [liveHeaderBadge, setLiveHeaderBadge] = useState<string>("GRID: REFLATION • US QUAD: Q2");

  useEffect(() => {
    fetch(getApiUrl("/api/v1/executive-summary"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.header_badge) setLiveHeaderBadge(json.header_badge);
      })
      .catch(() => {});
  }, [isRefreshing]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-md">
      {/* Aligned to exact width of content tables below */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-2.5 pb-3 space-y-2.5">
        {/* TOP UTILITY BAR: Brand Left | Date, API Status, Refresh & Export Moved Higher & Aligned Right */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-base font-bold tracking-tight text-white hover:opacity-90 transition">
              MacroPulse <span className="text-cyan-400">Alpha</span>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-xs">
              {liveHeaderBadge}
            </span>
            <Link
              href="/stock-xray"
              className={`hidden md:inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono transition ${
                pathname === "/stock-xray"
                  ? "bg-purple-600/30 border-purple-400 text-purple-300 font-semibold"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              Stock X-Ray
            </Link>
          </div>

          {/* Date, API Status, Refresh & Export aligned flush with right edge of content table */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              {displayDate}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border ${
                apiOnline
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-amber-950/40 border-amber-500/40 text-amber-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  apiOnline ? "bg-emerald-400 shadow-[0_0_6px_#10b981]" : "bg-amber-400"
                }`}
              />
              {apiStatusLabel}
            </span>
            <button
              onClick={onRefreshClick}
              disabled={isRefreshing}
              className="px-3 py-1 rounded bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "↻ Refresh Data"}
            </button>
            <button
              onClick={onExportClick}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            >
              Export
            </button>
          </div>
        </div>

        {/* 2-LINE MAIN NAVIGATION MENU (Aligned to full width of content table) */}
        <nav className="space-y-1.5 font-mono text-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {NAV_ITEMS_ROW_1.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md border text-center font-medium transition truncate ${
                    active
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
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md border text-center font-medium transition truncate ${
                    active
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
  );
}
