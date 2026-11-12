"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { ReversalsDashboard } from "@/components/ReversalsDashboard";

export default function ReversalsPage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Unified Location Notice */}
        <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Reversals Workstation Unified:</strong> Reversals is now fully integrated into{" "}
              <strong className="text-white">Trade Ideas</strong> under the <strong>Reversals (T+3)</strong> horizon.
            </span>
          </div>
          <Link
            href="/trade-ideas?horizon=reversals"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/50 bg-cyan-900/40 text-cyan-200 hover:bg-cyan-800/50 transition font-mono text-xs font-semibold"
          >
            <span>View inside Trade Ideas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ReversalsDashboard isSubPage={true} />
      </div>
    </div>
  );
}
