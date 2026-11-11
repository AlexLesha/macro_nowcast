/**
 * ============================================================================
 * CRITICAL ARCHITECTURE CONTRACT: TOP & BOTTOM MENUS (SINGLE SOURCE OF TRUTH)
 * ============================================================================
 * NOTE TO DEVELOPERS:
 * This file defines the canonical list of navigation routes for MacroPulse Alpha.
 * Both the Top Header Navigation (Navigation.tsx) and Bottom Footer Navigation
 * (Footer.tsx) use this list to render text-based single-row navigation with
 * pipe separators.
 *
 * Whenever a new page or route is added, renamed, or modified:
 * ALWAYS UPDATE BOTH SIDES (TOP AND BOTTOM) BY KEEPING THIS LIST SYNCHRONIZED!
 * ============================================================================
 */

export interface NavItem {
  label: string;
  href: string;
  shortLabel?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Summary", href: "/" },
  { label: "Framework Synthesis", href: "/synthesis" },
  { label: "Liquidity & Allocation", href: "/liquidity-allocation" },
  { label: "Trade Ideas", href: "/trade-ideas" },
  { label: "Outliers", href: "/outliers" },
  { label: "Stock Analysis", href: "/stock-analysis" },
  { label: "Speculation", href: "/speculation" },
  { label: "Policy Scenarios", href: "/scenarios" },
  { label: "42 Macro Deep-Dive", href: "/42-macro" },
  { label: "Global GRID Matrix", href: "/global-grid" },
  { label: "Commodities & Alts", href: "/commodities-alternatives" },
  { label: "Options & Vol Lab", href: "/options-lab" },
];

