"use client";

/**
 * ============================================================================
 * CRITICAL ARCHITECTURE CONTRACT: TOP & BOTTOM MENUS (FOOTER COMPONENT)
 * ============================================================================
 * NOTE TO DEVELOPERS:
 * This component mirrors the exact text-based single-row navigation with pipe
 * separators found in `Navigation.tsx`.
 *
 * ALWAYS KEEP BOTH SIDES (TOP HEADER AND BOTTOM FOOTER) SYNCHRONIZED WHEN
 * ADDING, RENAMING, OR MODIFYING ROUTES!
 * ============================================================================
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  return (
    <footer className="w-full border-t border-slate-800 bg-[#090D16]/95 backdrop-blur-md mt-12 py-5">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-3">
        {/* TEXT-BASED SINGLE-ROW NAVIGATION (IDENTICAL TO TOP HEADER) */}
        <nav
          id="footer-text-navigation-bar"
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
                  id={`footer-nav-link-${item.href.replace("/", "") || "summary"}`}
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

        {/* BOTTOM METADATA & STATUS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-500 font-mono">
          <div>
            MacroPulse <span className="text-cyan-400">Alpha</span> &copy; {new Date().getFullYear()} • Institutional Quantitative Macro Nowcasting
          </div>
          <div className="flex items-center gap-2">
            <span>42 Macro GRID</span>
            <span>&bull;</span>
            <span>Howell Liquidity</span>
            <span>&bull;</span>
            <span>Prometheus</span>
            <span>&bull;</span>
            <span>3Fourteen</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

