"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Mail,
  Sliders,
  DollarSign,
  Percent,
  Calendar,
  Crosshair,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  Copy,
  Check,
  Table as TableIcon,
  LayoutGrid,
  Activity,
  AlertOctagon,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { MetricTip } from "@/components/FinancialTooltip";

interface Candidate {
  ticker: string;
  name: string;
  sector: string;
  sector_etf: string;
  current_price: number;
  one_day_return_pct: number;
  residual_shock_sigma: number;
  beta_spy: number;
  beta_sector: number;
  ibs: number;
  ibs_percentile: number;
  rvol_20d: number;
  dollar_volume_20d_m: number;
  atr_14: number;
  shock_score?: number;
  entry_limit: number;
  limit_entry_zone: [number, number];
  stop_loss: number;
  target_exit: number;
  target_price: number;
  reward_risk_ratio: number;
  time_exit_trading_days: number;
  target_exit_date: string;
  urgency: string;
  is_strict_shock: boolean;
  suggested_shares: number;
  capital_outlay: number;
  portfolio_allocation_pct: number;
  plain_english_thesis: string;
  deep_links: {
    stock_xray: string;
    stock_analysis: string;
  };
}

interface MacroThrottle {
  regime: string;
  risk_on_pct: number;
  move_index: number;
  cacri?: number;
  bond_stress_triggered?: boolean;
  throttle_pct: number;
  throttle_multiplier: number;
  status_code: string;
  badge_color: string;
  verdict: string;
}

interface ScanResponse {
  status: string;
  summary: {
    total_universe_scanned: number;
    earnings_blackout_excluded: number;
    candidates_found: number;
    scan_elapsed_seconds: number;
    scan_timestamp_utc: string;
  };
  macro_throttle: MacroThrottle;
  account_defaults: {
    account_equity: number;
    risk_pct: number;
  };
  candidates: Candidate[];
}

interface JournalEntry {
  ticker: string;
  name: string;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  shares: number;
  capitalOutlay: number;
  dateEntered: string;
  exitDate: string;
  status: "ACTIVE" | "PROFIT" | "STOPPED" | "CLOSED";
}

export default function ReversalsPage() {
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [alertSending, setAlertSending] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [copiedTicker, setCopiedTicker] = useState<string | null>(null);

  // View Mode: Table vs Cards (default TABLE as specified in Phase 4)
  const [viewMode, setViewMode] = useState<"TABLE" | "CARDS">("TABLE");

  // Interactive Position Sizing State (Stored in localStorage)
  const [accountEquity, setAccountEquity] = useState<number>(100000);
  const [riskPct, setRiskPct] = useState<number>(1.0);

  // Sorting
  const [sortKey, setSortKey] = useState<keyof Candidate>("shock_score");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filters & Tabs
  const [filterTab, setFilterTab] = useState<"ALL" | "STRICT" | "TACTICAL">("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [journal, setJournal] = useState<Record<string, JournalEntry>>({});
  const [showJournalOnly, setShowJournalOnly] = useState<boolean>(false);

  // Load user settings and local journal on mount
  useEffect(() => {
    try {
      const savedEquity = localStorage.getItem("macropulse_reversals_equity");
      if (savedEquity) {
        const val = parseFloat(savedEquity);
        if (!Number.isNaN(val) && val > 0) setAccountEquity(val);
      }
      const savedRisk = localStorage.getItem("macropulse_reversals_risk_pct");
      if (savedRisk) {
        const val = parseFloat(savedRisk);
        if (!Number.isNaN(val) && val > 0) setRiskPct(val);
      }
      const savedJournal = localStorage.getItem("macropulse_reversals_journal");
      if (savedJournal) {
        setJournal(JSON.parse(savedJournal));
      }
      const savedView = localStorage.getItem("macropulse_reversals_view_mode");
      if (savedView === "CARDS" || savedView === "TABLE") {
        setViewMode(savedView);
      }
    } catch {
      // Ignore local storage error in sandboxes
    }
  }, []);

  const fetchScan = (force = false) => {
    if (force) setScanning(true);
    else setLoading(true);

    fetch(
      getApiUrl(
        `/api/v1/reversals/scan?force=${force}&equity=${accountEquity}&risk_pct=${riskPct}`
      ),
      { cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: ScanResponse) => {
        setData(json);
        setLoading(false);
        setScanning(false);
      })
      .catch(() => {
        setLoading(false);
        setScanning(false);
      });
  };

  useEffect(() => {
    fetchScan(false);
    const handleGlobalRefresh = () => fetchScan(true);
    window.addEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
    return () => window.removeEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
  }, []);

  const handleEquityChange = (val: number) => {
    const clamped = Math.max(1000, val);
    setAccountEquity(clamped);
    try {
      localStorage.setItem("macropulse_reversals_equity", clamped.toString());
    } catch {}
  };

  const handleRiskPctChange = (val: number) => {
    const clamped = Math.max(0.1, Math.min(5.0, val));
    setRiskPct(clamped);
    try {
      localStorage.setItem("macropulse_reversals_risk_pct", clamped.toString());
    } catch {}
  };

  const handleViewModeToggle = (mode: "TABLE" | "CARDS") => {
    setViewMode(mode);
    try {
      localStorage.setItem("macropulse_reversals_view_mode", mode);
    } catch {}
  };

  // Send Alert handler
  const handleSendAlert = async () => {
    setAlertSending(true);
    setAlertMessage(null);
    try {
      const res = await fetch(getApiUrl("/api/v1/reversals/send-alert"), {
        method: "POST",
      });
      const json = await res.json();
      if (json.status === "SENT") {
        setAlertMessage(`Alert sent successfully via ${json.provider} to ${json.recipient}`);
      } else if (json.status === "SIMULATED") {
        setAlertMessage(`Simulated alert prepared (${json.candidates_count} candidates). Configure SMTP credentials in backend to dispatch live.`);
      } else {
        setAlertMessage(`Notice: ${json.notice || "Alert trigger completed."}`);
      }
    } catch (e: any) {
      setAlertMessage(`Error sending alert: ${e.message}`);
    } finally {
      setAlertSending(false);
    }
  };

  // Copy IBKR Ticket string: BUY {shares} {ticker} LMT {entry_limit} STP {stop_loss}
  const copyIBKRTicket = (c: Candidate, shares: number) => {
    const entryLimit = c.entry_limit || c.current_price;
    const ticketStr = `BUY ${shares} ${c.ticker} LMT ${entryLimit.toFixed(2)} STP ${c.stop_loss.toFixed(2)} | TGT ${c.target_exit.toFixed(2)} | EXIT ${c.target_exit_date}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ticketStr);
      setCopiedTicker(c.ticker);
      setTimeout(() => setCopiedTicker(null), 2500);
    }
  };

  // Trade Journal Entry Toggles
  const toggleJournalStatus = (candidate: Candidate, targetStatus: "ACTIVE" | "CLOSED") => {
    const nextJournal = { ...journal };
    if (nextJournal[candidate.ticker]) {
      if (targetStatus === "CLOSED") {
        delete nextJournal[candidate.ticker];
      } else {
        nextJournal[candidate.ticker].status = targetStatus;
      }
    } else {
      const liveSizing = computeClientSizing(
        candidate.current_price,
        candidate.stop_loss,
        data?.macro_throttle?.throttle_pct ?? 100
      );
      nextJournal[candidate.ticker] = {
        ticker: candidate.ticker,
        name: candidate.name,
        entryPrice: candidate.current_price,
        stopLoss: candidate.stop_loss,
        targetPrice: candidate.target_exit || candidate.target_price,
        shares: liveSizing.shares,
        capitalOutlay: liveSizing.capitalOutlay,
        dateEntered: new Date().toISOString().split("T")[0],
        exitDate: candidate.target_exit_date,
        status: "ACTIVE",
      };
    }
    setJournal(nextJournal);
    try {
      localStorage.setItem("macropulse_reversals_journal", JSON.stringify(nextJournal));
    } catch {}
  };

  // Dynamic share recalculation
  const computeClientSizing = (
    entryPrice: number,
    stopLoss: number,
    throttlePct: number
  ) => {
    const throttleMult = Math.max(0, Math.min(1.0, throttlePct / 100.0));
    const dollarRiskBudget = accountEquity * (riskPct / 100.0) * throttleMult;
    const perShareRisk = Math.max(0.25, entryPrice - stopLoss);
    const shares = throttleMult <= 0 ? 0 : Math.floor(dollarRiskBudget / perShareRisk);
    const capitalOutlay = shares * entryPrice;
    const allocPct = (capitalOutlay / accountEquity) * 100;
    return {
      shares,
      capitalOutlay,
      allocPct,
      dollarRiskBudget,
      perShareRisk,
    };
  };

  const macro = data?.macro_throttle;
  const throttlePct = macro?.throttle_pct ?? 100;
  const isHalt = throttlePct === 0;

  // Phase 4 Macro Regime Throttle Status Label
  const throttleStatusLabel = isHalt
    ? "0% HALTED - RISK OFF"
    : throttlePct === 50
    ? "50% CYCLICALS ONLY"
    : "100% ACTIVE";

  const availableSectors = useMemo(() => {
    if (!data?.candidates) return [];
    const set = new Set(data.candidates.map((c) => c.sector));
    return Array.from(set).sort();
  }, [data]);

  // Filter & Sort Candidates
  const filteredCandidates = useMemo(() => {
    if (!data?.candidates) return [];
    const list = data.candidates.filter((c) => {
      if (filterTab === "STRICT" && !c.is_strict_shock) return false;
      if (filterTab === "TACTICAL" && c.is_strict_shock) return false;
      if (selectedSector !== "ALL" && c.sector !== selectedSector) return false;
      return true;
    });

    return list.sort((a, b) => {
      let aVal = (a as any)[sortKey] ?? 0;
      let bVal = (b as any)[sortKey] ?? 0;
      if (sortKey === "shock_score") {
        aVal = a.shock_score ?? (Math.abs(a.residual_shock_sigma) * a.rvol_20d * (1 - a.ibs));
        bVal = b.shock_score ?? (Math.abs(b.residual_shock_sigma) * b.rvol_20d * (1 - b.ibs));
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [data, filterTab, selectedSector, sortKey, sortAsc]);

  const handleSort = (key: keyof Candidate) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Alpha Microstructure & Liquidity Dislocation Radar</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Idiosyncratic Residual Reversals
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Trailing 60-day multi-factor OLS regression against SPY and Sector SPDRs.
              Strips out market and sector beta to identify rare multi-sigma idiosyncratic dislocations (
              <MetricTip term="RESIDUAL SHOCK">
                <span className="text-emerald-400 underline decoration-dotted font-medium">ε &lt; -2.25σ</span>
              </MetricTip>
              ,{" "}
              <MetricTip term="IBS">
                <span className="text-emerald-400 underline decoration-dotted font-medium">IBS &lt; 0.15</span>
              </MetricTip>
              ,{" "}
              <MetricTip term="RVOL">
                <span className="text-emerald-400 underline decoration-dotted font-medium">RVOL &gt; 1.8x</span>
              </MetricTip>
              ) protected by Nasdaq earnings blackout filters and regime-gated throttles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchScan(true)}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin text-emerald-400" : ""}`} />
              <span>{scanning ? "Scanning Universe..." : "↻ Run Live Scan"}</span>
            </button>

            <button
              onClick={handleSendAlert}
              disabled={alertSending}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-emerald-950 disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{alertSending ? "Sending Alert..." : "📧 Morning Briefing"}</span>
            </button>
          </div>
        </div>

        {/* Alert Feedback Banner */}
        {alertMessage && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-xs text-emerald-200 flex items-center justify-between">
            <span>{alertMessage}</span>
            <button onClick={() => setAlertMessage(null)} className="text-emerald-400 hover:text-white font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Phase 4 Top Banner: Macro Regime Throttle + CACRI & Bond Stress Gauges */}
        <div
          className={`p-5 rounded-xl border transition-all ${
            isHalt
              ? "bg-rose-950/40 border-rose-800/80 shadow-lg shadow-rose-950/50"
              : throttlePct === 50
              ? "bg-amber-950/40 border-amber-800/80 shadow-lg shadow-amber-950/50"
              : "bg-emerald-950/40 border-emerald-800/80 shadow-lg shadow-emerald-950/50"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MetricTip term="MACRO THROTTLE">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 cursor-help flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    Macro Circuit Breaker Throttle
                  </span>
                </MetricTip>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wide ${
                    isHalt
                      ? "bg-rose-900 text-rose-200 border border-rose-700"
                      : throttlePct === 50
                      ? "bg-amber-900 text-amber-200 border border-amber-700"
                      : "bg-emerald-900 text-emerald-200 border border-emerald-700"
                  }`}
                >
                  {throttleStatusLabel}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-200 leading-snug">
                {macro?.verdict || "Evaluating global macro liquidity and credit risk dynamics..."}
              </p>
            </div>

            {/* Macro Gauges: Regime, CACRI, Bond Stress & MOVE Index */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Macro Regime</span>
                <span className="font-bold text-white">{macro?.regime || "REFLATION"}</span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">CACRI Gauge</span>
                <span
                  className={`font-bold ${
                    (macro?.cacri ?? 45.0) > 75.0 ? "text-rose-400 font-black" : "text-emerald-400"
                  }`}
                >
                  {macro?.cacri ?? 45.0} / 100
                </span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bond Stress</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    macro?.bond_stress_triggered ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {macro?.bond_stress_triggered ? (
                    <>
                      <AlertOctagon className="w-3 h-3 text-rose-400" />
                      <span>TRIGGERED</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>NORMAL</span>
                    </>
                  )}
                </span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">MOVE Index</span>
                <span className="font-bold text-amber-400">{macro?.move_index ?? 95.0}</span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sizing Mult</span>
                <span
                  className={`font-extrabold text-sm ${
                    isHalt ? "text-rose-400" : throttlePct === 50 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {macro?.throttle_multiplier ?? 1.0}x
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive IBKR Sizing Bar */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Interactive IBKR Sizing:</span>
            </div>

            {/* Account Equity Input */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Account Equity ($):</span>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="number"
                  value={accountEquity}
                  onChange={(e) => handleEquityChange(parseFloat(e.target.value) || 0)}
                  className="w-28 pl-7 pr-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  step={5000}
                />
              </div>
            </div>

            {/* Risk Per Trade % */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Risk / Trade (%):</span>
              <div className="relative">
                <input
                  type="number"
                  value={riskPct}
                  onChange={(e) => handleRiskPctChange(parseFloat(e.target.value) || 0)}
                  className="w-20 pl-2 pr-6 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  step={0.25}
                  min={0.1}
                  max={5.0}
                />
                <Percent className="w-3 h-3 text-slate-400 absolute right-2 top-2.5" />
              </div>
            </div>

            {/* Active Dollar Risk */}
            <div className="text-xs text-slate-400">
              Dollar Risk Budget:{" "}
              <strong className="text-emerald-400 font-bold">
                $
                {(
                  accountEquity *
                  (riskPct / 100) *
                  (macro?.throttle_multiplier ?? 1.0)
                ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </strong>
            </div>
          </div>

          {/* Telemetry info */}
          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span>Universe: {data?.summary?.total_universe_scanned ?? "500+"} symbols</span>
            <span>&bull;</span>
            <span className="text-rose-400">Blackout Excluded: {data?.summary?.earnings_blackout_excluded ?? 0}</span>
            <span>&bull;</span>
            <span>Scan Time: {data?.summary?.scan_elapsed_seconds ?? 0}s</span>
          </div>
        </div>

        {/* View Switcher, Filter Tabs & Sector Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => {
                setFilterTab("ALL");
                setShowJournalOnly(false);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterTab === "ALL" && !showJournalOnly
                  ? "bg-slate-800 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Setups ({data?.candidates?.length ?? 0})
            </button>
            <button
              onClick={() => {
                setFilterTab("STRICT");
                setShowJournalOnly(false);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterTab === "STRICT" && !showJournalOnly
                  ? "bg-rose-950/80 text-rose-200 font-bold border border-rose-800/80 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Strict Residual Shocks (ε &lt; -2.25σ)
            </button>
            <button
              onClick={() => {
                setFilterTab("TACTICAL");
                setShowJournalOnly(false);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterTab === "TACTICAL" && !showJournalOnly
                  ? "bg-amber-950/80 text-amber-200 font-bold border border-amber-800/80 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Tactical Pullbacks
            </button>
            <button
              onClick={() => setShowJournalOnly(true)}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                showJournalOnly
                  ? "bg-emerald-950 text-emerald-200 font-bold border border-emerald-800/80 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Journal ({Object.keys(journal).length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher: Table vs Cards */}
            {!showJournalOnly && (
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-xs">
                <button
                  onClick={() => handleViewModeToggle("TABLE")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
                    viewMode === "TABLE"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => handleViewModeToggle("CARDS")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
                    viewMode === "CARDS"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>
            )}

            {/* Sector Dropdown */}
            {!showJournalOnly && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Sector:</span>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="ALL">All GICS Sectors</option>
                  {availableSectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-24 text-center space-y-4 bg-slate-900/30 rounded-2xl border border-slate-800/50">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <div className="text-base font-bold text-slate-200">
              Running High-Performance Residual Shock Regression...
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Scanning liquid constituents, regressing 60-day OLS returns against SPY and Sector SPDRs,
              evaluating IBS microstructure capitulation and filtering active earnings blackout windows.
            </p>
          </div>
        )}

        {/* TRADE JOURNAL VIEW */}
        {!loading && showJournalOnly && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Active Reversal Execution Journal</span>
              </h2>
              <span className="text-xs text-slate-400">Stored locally in browser session storage</span>
            </div>

            {Object.keys(journal).length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-sm">
                No active entered trades in journal. Click <strong>[+ Enter Trade]</strong> on any candidate row to track execution.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(journal).map((entry) => (
                  <div
                    key={entry.ticker}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-lg font-black text-white">{entry.ticker}</span>
                        <div className="text-xs text-slate-400">{entry.name}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {entry.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Entry Price</span>
                        <span className="font-bold text-white">${entry.entryPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Stop Loss</span>
                        <span className="font-bold text-rose-400">${entry.stopLoss}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Target Price</span>
                        <span className="font-bold text-emerald-400">${entry.targetPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">3-Day Exit Date</span>
                        <span className="font-bold text-amber-400">{entry.exitDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Shares</span>
                        <span className="font-bold text-white">{entry.shares} shs</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Capital Outlay</span>
                        <span className="font-bold text-white">${entry.capitalOutlay.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <Link
                        href={`/stock-xray?ticker=${entry.ticker}`}
                        className="flex-1 text-center py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-semibold text-slate-200 transition-all"
                      >
                        Stock X-Ray
                      </Link>
                      <button
                        onClick={() =>
                          toggleJournalStatus({ ticker: entry.ticker } as any, "CLOSED")
                        }
                        className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800/80 rounded text-xs font-semibold text-rose-200 transition-all"
                      >
                        Close / Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CANDIDATES TABLE VIEW (PHASE 4 SPECIFICATION) */}
        {!loading && !showJournalOnly && viewMode === "TABLE" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("ticker")}>
                      Ticker
                    </th>
                    <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort("sector")}>
                      Sector
                    </th>
                    <th className="py-3 px-3 cursor-pointer hover:text-white text-center" onClick={() => handleSort("residual_shock_sigma")}>
                      Residual Z
                    </th>
                    <th className="py-3 px-3 cursor-pointer hover:text-white text-center" onClick={() => handleSort("ibs")}>
                      IBS
                    </th>
                    <th className="py-3 px-3 cursor-pointer hover:text-white text-center" onClick={() => handleSort("rvol_20d")}>
                      RVOL
                    </th>
                    <th className="py-3 px-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort("entry_limit")}>
                      Entry Limit
                    </th>
                    <th className="py-3 px-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort("stop_loss")}>
                      Stop Loss
                    </th>
                    <th className="py-3 px-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort("target_exit")}>
                      Target / T+3 Exit
                    </th>
                    <th className="py-3 px-3 text-right">
                      Calc Shares
                    </th>
                    <th className="py-3 px-3 text-right">
                      Notional ($)
                    </th>
                    <th className="py-3 px-4 text-center">
                      Execution Ticket
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        No candidates matched the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((c) => {
                      const liveSizing = computeClientSizing(
                        c.current_price,
                        c.stop_loss,
                        macro?.throttle_pct ?? 100
                      );
                      const isCopied = copiedTicker === c.ticker;
                      const isEntered = !!journal[c.ticker];
                      const entryLimit = c.entry_limit || c.current_price;
                      const targetExit = c.target_exit || c.target_price;

                      return (
                        <tr
                          key={c.ticker}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            c.is_strict_shock ? "bg-rose-950/10" : ""
                          }`}
                        >
                          {/* Ticker & Link to /stock-xray */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/stock-xray?ticker=${c.ticker}`}
                                className="font-black text-white hover:text-emerald-400 text-sm tracking-tight flex items-center gap-1 group"
                              >
                                <span>{c.ticker}</span>
                                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 inline" />
                              </Link>
                              {c.is_strict_shock && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800">
                                  SHOCK
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {c.name}
                            </div>
                          </td>

                          {/* Sector */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-slate-300 font-medium">{c.sector}</span>
                            <span className="text-slate-500 block text-[10px]">({c.sector_etf})</span>
                          </td>

                          {/* Residual Z */}
                          <td className="py-3 px-3 whitespace-nowrap text-center">
                            <span className="px-2 py-0.5 rounded font-extrabold text-xs bg-rose-950 text-rose-300 border border-rose-800/80">
                              {c.residual_shock_sigma}σ
                            </span>
                          </td>

                          {/* IBS */}
                          <td className="py-3 px-3 whitespace-nowrap text-center">
                            <span className="font-bold text-slate-200">
                              {c.ibs_percentile}%
                            </span>
                          </td>

                          {/* RVOL */}
                          <td className="py-3 px-3 whitespace-nowrap text-center">
                            <span className="font-bold text-amber-400">
                              {c.rvol_20d}x
                            </span>
                          </td>

                          {/* Entry Limit */}
                          <td className="py-3 px-3 whitespace-nowrap text-right">
                            <span className="font-bold text-white">
                              ${entryLimit.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              (Spot: ${c.current_price.toFixed(2)})
                            </span>
                          </td>

                          {/* Stop Loss */}
                          <td className="py-3 px-3 whitespace-nowrap text-right">
                            <span className="font-bold text-rose-400">
                              ${c.stop_loss.toFixed(2)}
                            </span>
                          </td>

                          {/* Target / T+3 Exit */}
                          <td className="py-3 px-3 whitespace-nowrap text-right">
                            <span className="font-bold text-emerald-400">
                              ${targetExit.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-amber-300 block flex items-center justify-end gap-1">
                              <Calendar className="w-2.5 h-2.5 inline" />
                              {c.target_exit_date}
                            </span>
                          </td>

                          {/* Calc Shares */}
                          <td className="py-3 px-3 whitespace-nowrap text-right">
                            {isHalt ? (
                              <span className="text-rose-400 font-bold">0 (HALT)</span>
                            ) : (
                              <span className="font-black text-white text-sm">
                                {liveSizing.shares.toLocaleString()}
                              </span>
                            )}
                          </td>

                          {/* Notional ($) */}
                          <td className="py-3 px-3 whitespace-nowrap text-right">
                            <span className="font-bold text-slate-300">
                              ${liveSizing.capitalOutlay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {liveSizing.allocPct.toFixed(1)}% NAV
                            </span>
                          </td>

                          {/* Copy IBKR Ticket & Journal Action */}
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => copyIBKRTicket(c, liveSizing.shares)}
                                className={`px-2.5 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                                  isCopied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                                }`}
                                title="Copy IBKR Order Ticket to Clipboard"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3 h-3 text-white" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-emerald-400" />
                                    <span>Copy Ticket</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => toggleJournalStatus(c, isEntered ? "CLOSED" : "ACTIVE")}
                                className={`p-1.5 rounded transition-all ${
                                  isEntered
                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                                }`}
                                title={isEntered ? "Remove from Journal" : "Add to Journal"}
                              >
                                <CheckCircle className={`w-3.5 h-3.5 ${isEntered ? "text-emerald-400" : ""}`} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CANDIDATES CARD VIEW (DETAILED TICKET VIEW) */}
        {!loading && !showJournalOnly && viewMode === "CARDS" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCandidates.map((c) => {
              const liveSizing = computeClientSizing(
                c.current_price,
                c.stop_loss,
                macro?.throttle_pct ?? 100
              );
              const isEntered = !!journal[c.ticker];
              const isCopied = copiedTicker === c.ticker;
              const entryLimit = c.entry_limit || c.current_price;
              const targetExit = c.target_exit || c.target_price;

              return (
                <div
                  key={c.ticker}
                  className={`p-6 rounded-xl border transition-all flex flex-col justify-between ${
                    c.is_strict_shock
                      ? "bg-slate-900/90 border-rose-900/40 hover:border-rose-700/60 shadow-lg shadow-black/40"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md shadow-black/30"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/stock-xray?ticker=${c.ticker}`}
                            className="text-xl font-black text-white tracking-tight hover:text-emerald-400 flex items-center gap-1 group"
                          >
                            <span>{c.ticker}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                          </Link>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              c.is_strict_shock
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : "bg-amber-950 text-amber-300 border border-amber-800"
                            }`}
                          >
                            {c.urgency}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          {c.name} &bull; {c.sector} ({c.sector_etf})
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-white">
                          ${c.current_price.toFixed(2)}
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            c.one_day_return_pct < 0 ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {c.one_day_return_pct > 0 ? "+" : ""}
                          {c.one_day_return_pct}%
                        </div>
                      </div>
                    </div>

                    {/* Metrics Matrix */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 text-xs">
                      <div>
                        <MetricTip term="RESIDUAL SHOCK">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold cursor-help">
                            Residual Shock
                          </span>
                        </MetricTip>
                        <span className="font-extrabold text-rose-400 text-sm">
                          {c.residual_shock_sigma}σ
                        </span>
                      </div>

                      <div>
                        <MetricTip term="IBS">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold cursor-help">
                            IBS Decile
                          </span>
                        </MetricTip>
                        <span className="font-bold text-white text-sm">
                          {c.ibs_percentile}%
                        </span>
                      </div>

                      <div>
                        <MetricTip term="RVOL">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold cursor-help">
                            20D RVOL
                          </span>
                        </MetricTip>
                        <span className="font-bold text-amber-400 text-sm">
                          {c.rvol_20d}x
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Daily $ Vol
                        </span>
                        <span className="font-bold text-slate-300 text-sm">
                          ${c.dollar_volume_20d_m}M
                        </span>
                      </div>
                    </div>

                    {/* Execution Parameters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/50 text-xs">
                      <div>
                        <MetricTip term="LIMIT ENTRY ZONE">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold cursor-help">
                            Limit Entry
                          </span>
                        </MetricTip>
                        <span className="font-bold text-white">
                          ${entryLimit.toFixed(2)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          ATR(14) Stop Loss
                        </span>
                        <span className="font-bold text-rose-400">
                          ${c.stop_loss.toFixed(2)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Target Exit (R:R)
                        </span>
                        <span className="font-bold text-emerald-400">
                          ${targetExit.toFixed(2)} ({c.reward_risk_ratio}:1)
                        </span>
                      </div>

                      <div>
                        <MetricTip term="3-DAY TIME EXIT">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold cursor-help">
                            T+3 Time Exit
                          </span>
                        </MetricTip>
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-400 inline" />
                          {c.target_exit_date}
                        </span>
                      </div>
                    </div>

                    {/* Attribution Thesis */}
                    <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/20 p-3 rounded-lg border border-slate-800/40">
                      <strong className="text-slate-200">Attribution Thesis: </strong>
                      {c.plain_english_thesis}
                    </div>

                    {/* Sizing Box */}
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-300">IBKR Sizing:</span>
                        {isHalt ? (
                          <span className="text-rose-400 font-bold uppercase">
                            0 Shares (Macro Halt Active)
                          </span>
                        ) : (
                          <span className="text-slate-200">
                            <strong className="text-white text-sm">
                              {liveSizing.shares.toLocaleString()}
                            </strong>{" "}
                            shares &bull; Outlay:{" "}
                            <strong className="text-white">
                              ${liveSizing.capitalOutlay.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </strong>{" "}
                            ({liveSizing.allocPct.toFixed(1)}% NAV)
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Risk Budget: ${liveSizing.dollarRiskBudget.toFixed(0)} ($
                        {liveSizing.perShareRisk.toFixed(2)}/sh risk)
                      </div>
                    </div>
                  </div>

                  {/* Actions & Copy Button */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={c.deep_links.stock_xray}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition-all border border-slate-700"
                      >
                        <span>X-Ray</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>

                      <button
                        onClick={() => copyIBKRTicket(c, liveSizing.shares)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                          isCopied
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        }`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-emerald-400" />}
                        <span>{isCopied ? "Copied Ticket" : "Copy IBKR Ticket"}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => toggleJournalStatus(c, isEntered ? "CLOSED" : "ACTIVE")}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold transition-all ${
                        isEntered
                          ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                          : "bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 border border-slate-700"
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${isEntered ? "text-white" : "text-emerald-400"}`} />
                      <span>{isEntered ? "In Journal (Active)" : "+ Enter Trade"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
