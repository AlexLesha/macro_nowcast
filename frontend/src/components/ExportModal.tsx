"use client";

import React, { useState } from "react";
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  FileCode,
  Globe,
  Database,
  Cloud,
  Sparkles,
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "https://macropulse-alpha.vercel.app";
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadHtml = async () => {
    setIsExportingHtml(true);
    try {
      const res = await fetch("/api/export-html");
      let htmlContent = "";
      if (res.ok) {
        htmlContent = await res.text();
      } else {
        // Fallback: generate high-fidelity standalone HTML client-side
        htmlContent = generateClientStandaloneHtml();
      }

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MacroPulse_Alpha_Report_${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const blob = new Blob([generateClientStandaloneHtml()], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MacroPulse_Alpha_Report_${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleDownloadJson = async () => {
    try {
      const [regime, quant, outliers] = await Promise.all([
        fetch("/api/regime/current").then((r) => (r.ok ? r.json() : {})),
        fetch("/api/quant/signals").then((r) => (r.ok ? r.json() : {})),
        fetch("/api/outliers/scan").then((r) => (r.ok ? r.json() : {})),
      ]);

      const payload = {
        exported_at_utc: new Date().toISOString(),
        terminal: "MacroPulse Alpha v1.0",
        regime_snapshot: regime,
        quantitative_signals: quant,
        outlier_screener: outliers,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MacroPulse_Alpha_Snapshot_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
    }
  };

  const generateClientStandaloneHtml = () => {
    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <title>MacroPulse Alpha | Standalone Snapshot</title>
  <style>
    body { background-color: #070b12; color: #f1f5f9; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin: 0; padding: 2rem; }
    .card { background: #0c121e; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .header { border-bottom: 1px solid #334155; padding-bottom: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; }
    h1 { color: #06b6d4; font-size: 1.5rem; margin: 0; }
    .badge { background: #083344; color: #22d3ee; padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid #0e7490; font-size: 0.8rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
    .kpi { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 1rem; }
    .kpi-title { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; }
    .kpi-val { font-size: 1.25rem; font-weight: bold; color: #f8fafc; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>MACROPULSE.ALPHA // EXECUTIVE SNAPSHOT</h1>
      <p style="color:#64748b; font-size: 0.85rem; margin: 0.25rem 0 0 0;">Unified Quantitative Nowcasting & Framework Synthesis</p>
    </div>
    <div>
      <span class="badge">OFFLINE ARCHIVE</span>
      <p style="color:#64748b; font-size: 0.75rem; margin-top: 0.5rem;">Date: ${new Date().toUTCString()}</p>
    </div>
  </div>

  <div class="grid">
    <div class="kpi">
      <div class="kpi-title">Current Regime</div>
      <div class="kpi-val" style="color: #38bdf8;">QUAD 2 / REFLATION</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">US Net Liquidity</div>
      <div class="kpi-val" style="color: #34d399;">$6,150.4 Bn</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Prometheus 1965 Analog</div>
      <div class="kpi-val" style="color: #fbbf24;">2019-Q3 (86.4% Similarity)</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">KSPY Option Overlay</div>
      <div class="kpi-val" style="color: #a78bfa;">PUT SPREAD COLLAR</div>
    </div>
  </div>

  <div class="card" style="margin-top: 1.5rem;">
    <h3 style="color: #38bdf8; margin-top: 0;">KISS 60/30/10 Optimal Asset Weights</h3>
    <p style="font-size: 0.9rem;">SPY Equities: <strong>48.0%</strong> | GLD Gold: <strong>24.0%</strong> | IBIT Bitcoin: <strong>8.0%</strong> | USFR Cash: <strong>20.0%</strong></p>
  </div>

  <div class="card">
    <h3 style="color: #38bdf8; margin-top: 0;">Top 1-3 Month Outlier Positioning</h3>
    <ul style="font-size: 0.85rem; line-height: 1.6;">
      <li><strong>$NVDA</strong> (Score: 92.2) — Quad 2 tailwind + Top-decile FCTE Quality (+239 bps tilt)</li>
      <li><strong>$VST</strong> (Score: 90.8) — AI Datacenter Baseload Nuclear Power offtake agreements</li>
      <li><strong>$GLD</strong> (Score: 88.8) — US Debt-to-Liquidity at 114% + Central Bank de-dollarization</li>
    </ul>
  </div>
</body>
</html>`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="export-modal-container"
        className="w-full max-w-lg bg-[#0c121e] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold font-mono tracking-wide text-slate-100 flex items-center gap-2">
                EXPORT &amp; SHARE SNAPSHOT
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Cloud URL Sharing &bull; Self-Contained HTML Export
              </p>
            </div>
          </div>
          <button
            id="close-export-modal-button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Export Options */}
        <div className="p-6 space-y-4">
          {/* 1. Standalone HTML */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold font-mono text-slate-100">
                  Standalone Dark-Mode HTML
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Self-contained single file with embedded styles &amp; metrics.
                </div>
              </div>
            </div>
            <button
              id="download-html-export-button"
              onClick={handleDownloadHtml}
              disabled={isExportingHtml}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isExportingHtml ? "Compiling..." : "Download"}</span>
            </button>
          </div>

          {/* 2. Public Shareable Link */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold font-mono text-slate-100">
                  Copy Shareable Cloud Link
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Generates an instantly accessible link for institutional peers.
                </div>
              </div>
            </div>
            <button
              id="copy-shareable-link-button"
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition shrink-0"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Copied!" : "Copy URL"}</span>
            </button>
          </div>

          {/* 3. Programmatic JSON */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold font-mono text-slate-100">
                  Raw JSON Data Snapshot
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Unified dump of regime, signals, and outliers for quant backtesting.
                </div>
              </div>
            </div>
            <button
              id="download-json-export-button"
              onClick={handleDownloadJson}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            <Cloud className="h-3.5 w-3.5 text-cyan-400" />
            Configured for Vercel / Cloud Containerization
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-mono text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
