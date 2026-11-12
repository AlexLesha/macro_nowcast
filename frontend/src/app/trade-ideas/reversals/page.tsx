"use client";

import React from "react";
import { ReversalsDashboard } from "@/components/ReversalsDashboard";

export default function TradeIdeasReversalsSubPage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <ReversalsDashboard isSubPage={true} />
      </div>
    </div>
  );
}

