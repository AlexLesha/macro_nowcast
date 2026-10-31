"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Percent,
  Search,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface FcteHolding {
  ticker: string;
  name: string;
  weight_pct: number;
  market_value?: string | null;
  shares_held?: string | null;
}

export const FcteHoldingsTable: React.FC = () => {
  const [holdings, setHoldings] = useState<FcteHolding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchHoldings = async (manual: boolean = false) => {
    if (manual) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Primary route: /api/v1/etf/fcte-holdings
      // Fallback via rewrite: /api/etf/fcte-holdings
      let res = await fetch(getApiUrl("/api/v1/etf/fcte-holdings"));
      if (!res.ok) {
        res = await fetch(getApiUrl("/api/etf/fcte-holdings"));
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setHoldings([]);
      } else if (Array.isArray(data)) {
        setHoldings(data);
        setError(null);
      } else if (Array.isArray(data.holdings)) {
        setHoldings(data.holdings);
        setError(data.error || null);
      } else {
        throw new Error("Unexpected response structure from FCTE holdings endpoint");
      }

      setLastFetched(new Date().toLocaleTimeString());
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(`Data not available: ${msg}`);
      setHoldings([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  const filteredHoldings = holdings.filter(
    (h) =>
      h.ticker.toLowerCase().includes(search.toLowerCase()) ||
      h.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalWeight = holdings.reduce((sum, h) => sum + (h.weight_pct || 0), 0);

  return (
    <div
      id="fcte-holdings-container"
      className="p-6 rounded-2xl bg-[#0c121e] border border-slate-800 shadow-2xl relative overflow-hidden"
    >
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-700/50 text-indigo-400 shadow-lg shadow-indigo-950/50">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-mono font-bold tracking-wide text-slate-100">
                3FOURTEEN FCTE CORE 20 HOLDINGS
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold">
                WARREN PIES FULL-CYCLE TREND
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Live Holdings Scraped Directly from{" "}
              <a
                href="https://3fourteensmi.com/fcte"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-0.5"
              >
                3fourteensmi.com/fcte
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-44">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ticker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-[#070b12] border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            id="refresh-fcte-holdings-button"
            onClick={() => fetchHoldings(true)}
            disabled={isRefreshing || loading}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-mono text-sm font-semibold transition flex items-center gap-1.5 shrink-0"
            title="Re-scrape live holdings table"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Scraping..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          id="fcte-error-banner"
          className="p-4 mb-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-start justify-between gap-3 font-mono text-sm animate-in fade-in"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-300">Scraper Notice</div>
              <div className="text-slate-300 mt-0.5">{error}</div>
            </div>
          </div>
          <button
            onClick={() => fetchHoldings(true)}
            className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-white font-bold transition text-sm shrink-0"
          >
            Retry Scrape
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="space-y-2 py-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-slate-900/60 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Live Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#070b12]">
          <table className="w-full text-left font-mono text-sm">
            <thead className="bg-[#0b1220] text-slate-400 uppercase text-xs border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">TICKER</th>
                <th className="px-4 py-3">DESCRIPTION / SECURITY NAME</th>
                <th className="px-4 py-3 text-right">WEIGHT (%)</th>
                <th className="px-4 py-3 w-48">ALLOCATION WEIGHT</th>
                {holdings.some((h) => h.shares_held) && (
                  <th className="px-4 py-3 text-right hidden md:table-cell">SHARES HELD</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredHoldings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-mono">
                    No holdings match your search query &ldquo;{search}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredHoldings.map((h, idx) => (
                  <tr
                    key={h.ticker}
                    className="hover:bg-slate-800/30 transition group"
                  >
                    <td className="px-4 py-2.5 text-center text-slate-500 text-sm">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-cyan-300 group-hover:text-cyan-200">
                      <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
                        ${h.ticker}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-200 font-sans font-medium text-sm">
                      {h.name}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-400 font-mono">
                      {h.weight_pct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, (h.weight_pct / 7.0) * 100)}%` }}
                        />
                      </div>
                    </td>
                    {holdings.some((item) => item.shares_held) && (
                      <td className="px-4 py-2.5 text-right text-slate-400 font-mono text-xs hidden md:table-cell">
                        {h.shares_held ? Number(h.shares_held).toLocaleString() : "-"}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Summary */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Live Scraped Feed Active ({holdings.length} Core Positions)
          </span>
          <span className="text-slate-600">&bull;</span>
          <span>
            Total Equity Weight: <strong className="text-slate-200">{totalWeight.toFixed(2)}%</strong>
          </span>
        </div>
        {lastFetched && (
          <span className="text-xs text-slate-500">
            Last Checked: {lastFetched}
          </span>
        )}
      </div>
    </div>
  );
};
