"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function StockXRayRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ticker = searchParams.get("ticker");
    const targetUrl = ticker ? `/stock-analysis?ticker=${ticker}` : "/stock-analysis";
    router.replace(targetUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-300 flex items-center justify-center font-mono text-sm">
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 text-center space-y-2">
        <div className="text-cyan-400 font-bold">Redirecting to Stock Analysis...</div>
        <div className="text-xs text-slate-500">Stock X-Ray has been consolidated into /stock-analysis</div>
      </div>
    </div>
  );
}

export default function DeprecatedStockXRayRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070B12] text-slate-300 flex items-center justify-center font-mono text-sm">
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 text-center space-y-2">
            <div className="text-cyan-400 font-bold">Redirecting to Stock Analysis...</div>
          </div>
        </div>
      }
    >
      <StockXRayRedirectContent />
    </Suspense>
  );
}
