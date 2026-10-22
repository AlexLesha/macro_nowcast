'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  RefreshCw, 
  Share2, 
  AlertTriangle, 
  CheckCircle2, 
  WifiOff 
} from 'lucide-react';

const rawApiUrl =
  (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '')
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
    : 'https://macro-nowcast-wdw2.onrender.com';
const API_BASE_URL = rawApiUrl.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[\[\]]/g, '').trim().replace(/\/$/, '');

type HealthStatus = 'checking' | 'waking' | 'online' | 'offline';

export default function Header({ onRefreshClick }: { onRefreshClick?: () => void }) {
  const pathname = usePathname();
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('checking');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s max for Render cold boot

      let res = await fetch(`${API_BASE_URL}/api/v1/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE_URL}/api/health`, {
          signal: controller.signal,
          cache: 'no-store',
        });
      }
      clearTimeout(timeoutId);

      if (res.ok) {
        setHealthStatus('online');
      } else {
        setHealthStatus('waking');
      }
    } catch {
      setHealthStatus((prev) => (prev === 'waking' ? 'waking' : 'offline'));
    }
  }, []);

  useEffect(() => {
    checkHealth();

    // Timer counter when backend is waking up
    let interval: NodeJS.Timeout;
    if (healthStatus === 'checking' || healthStatus === 'waking') {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        // Retry ping every 5 seconds until online
        if (elapsedSeconds % 5 === 0) {
          checkHealth();
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [checkHealth, healthStatus, elapsedSeconds]);

  // If initial check takes more than 2 seconds, transition badge from 'checking' to 'waking'
  useEffect(() => {
    if (healthStatus === 'checking' && elapsedSeconds > 2) {
      setHealthStatus('waking');
    }
  }, [elapsedSeconds, healthStatus]);

  const navTabs = [
    { name: '1. Executive Summary', href: '/' },
    { name: '2. Framework Synthesis', href: '/synthesis' },
    { name: '3. Liquidity & Allocation', href: '/liquidity-allocation' },
    { name: '4. 1–3M Outliers', href: '/outliers' },
    { name: '5. Speculation Matrix', href: '/speculation' },
    { name: '6. 4Q Scenarios', href: '/scenarios' },
  ];

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-[#1F2937] bg-[#111827]/85 backdrop-blur-md px-4 lg:px-8">
      <div className="flex h-full items-center justify-between gap-4">
        
        {/* Brand & Live Connection Indicator */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-mono text-lg font-bold text-white tracking-wider">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md">
              M
            </span>
            <span>MacroPulse<span className="text-cyan-400">Alpha</span></span>
          </Link>

          {/* Render Backend Health Badge */}
          <div className="hidden sm:flex items-center ml-2">
            {healthStatus === 'online' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE API
              </span>
            )}

            {(healthStatus === 'waking' || healthStatus === 'checking') && (
              <button 
                onClick={checkHealth}
                title="Render free tier takes ~30-50s to spin up from idle state. Click to check again."
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-medium text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
              >
                <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                <span>Waking Engine ({elapsedSeconds}s)...</span>
              </button>
            )}

            {healthStatus === 'offline' && (
              <button 
                onClick={() => { setElapsedSeconds(0); setHealthStatus('checking'); checkHealth(); }}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-mono font-medium text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              >
                <WifiOff className="h-3 w-3 text-rose-400" />
                <span>API Offline (Click to Retry)</span>
              </button>
            )}
          </div>
        </div>

        {/* Center Sub-Page Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1">
          {navTabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-[#1E293B] text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1E293B]/50'
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshClick}
            className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={() => window.open(`${API_BASE_URL}/docs`, '_blank')}
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-[#1F2937] bg-[#1E293B] hover:bg-[#374151] px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors"
          >
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>Swagger API</span>
          </button>
        </div>

      </div>
    </header>
  );
}

// Named export compatibility
export { Header };
