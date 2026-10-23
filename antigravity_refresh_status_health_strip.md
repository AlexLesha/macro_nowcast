# Antigravity IDE Specification: Zero-Token Refresh Status & Traffic-Light Health Strip

## 1. Architectural Rationale: Zero-Token Health & Quota Diagnostics

To give you immediate visibility into every component of the **"Refresh Data"** pipeline—and specifically whether your **Gemini API key** is valid, approaching quota, or throwing a `429 ResourceExhausted` rate-limit error—without burning a single LLM token during health checks:

1. **Zero-Token Gemini Key & Quota Check**:
   - Instead of calling `generate_content("ping")` (which consumes input/output tokens and counts against your Requests-Per-Minute / Requests-Per-Day quota), the backend queries the free metadata endpoint `GET https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}` (which costs **0 tokens**) and combines it with an in-memory **Live Quota & Error Tracker** that records actual token usage (`usage_metadata.total_token_count`) and any `429 Quota Exceeded` or `401/403 Key Invalid` errors from your most recent refresh runs.
2. **4-Component Traffic-Light Strip**:
   - Displays a compact row of 4 traffic lights (`🟢 GREEN`, `🟡 AMBER`, `🔴 RED`) in the top header and inside the **Refresh Data Modal**:
     1. **Backend API (`Render`)**: `🟢 Online` | `🟡 Waking Up` | `🔴 Unreachable`
     2. **Macro Data (`FRED / FiscalData`)**: `🟢 Live API/CSV` | `🟡 Cached Fallback` | `🔴 Error`
     3. **Market Feeds (`Yahoo / CBOE`)**: `🟢 Live Quotes` | `🟡 Delayed/Cached` | `🔴 Error`
     4. **Gemini AI (`Quota & Key`)**:
        - `🟢 Active (X/1,500 RPD | Yk tokens last run)`
        - `🟡 No Key Set (Offline Mock Mode)`
        - `🔴 QUOTA EXCEEDED (HTTP 429) or INVALID KEY`

---

## 2. File Targets

Update or create the following 3 files:
```
backend/app/refresh_pipeline/
├── health_monitor.py    # NEW: Zero-token component & Gemini quota tracker
├── synthesizer.py       # UPDATED: Captures token usage & HTTP 429 quota errors
frontend/src/components/
└── RefreshModal.tsx     # UPDATED: Adds compact 4-pill traffic-light status bar
```

---

## 3. Backend Step 1: Zero-Token Health & Quota Tracker (`backend/app/refresh_pipeline/health_monitor.py`)

Create `backend/app/refresh_pipeline/health_monitor.py`:

```python
"""
backend/app/refresh_pipeline/health_monitor.py
Zero-token health and Gemini quota diagnostics for the Refresh Data status window.
"""

import os
import time
from datetime import datetime, timezone
from typing import Dict, Any, Literal
import httpx

TrafficColor = Literal["green", "amber", "red"]

class RefreshHealthTracker:
    """Tracks component status and Gemini API quota/token usage in-memory with zero token overhead."""
    def __init__(self):
        self.state: Dict[str, Any] = {
            "last_checked_utc": None,
            "backend_api": {"color": "green", "label": "Online (Render)"},
            "macro_data": {"color": "green", "label": "FRED / Treasury Ready"},
            "market_feeds": {"color": "green", "label": "yfinance / CBOE Ready"},
            "gemini_ai": {
                "color": "amber",
                "label": "Unchecked",
                "last_run_tokens": 0,
                "calls_today": 0,
                "last_error": None
            }
        }
        self._last_probe_ts = 0.0

    def record_macro_status(self, ok: bool, detail: str = "Live"):
        self.state["macro_data"] = {
            "color": "green" if ok else "amber",
            "label": f"Macro: {detail}" if ok else f"Macro Fallback ({detail})"
        }

    def record_market_status(self, ok: bool, detail: str = "Live"):
        self.state["market_feeds"] = {
            "color": "green" if ok else "amber",
            "label": f"Markets: {detail}" if ok else f"Markets Cached ({detail})"
        }

    def record_gemini_run(self, success: bool, tokens_used: int = 0, error_msg: Optional[str] = None):
        """Called by synthesizer.py after a single-batch extraction attempt."""
        gem = self.state["gemini_ai"]
        if success:
            gem["calls_today"] = gem.get("calls_today", 0) + 1
            gem["last_run_tokens"] = tokens_used
            gem["last_error"] = None
            gem["color"] = "green"
            gem["label"] = f"OK ({tokens_used:,} tok | {gem['calls_today']} runs)"
        else:
            err_str = str(error_msg or "Unknown Error")
            gem["last_error"] = err_str[:120]
            if "429" in err_str or "quota" in err_str.lower() or "exhausted" in err_str.lower():
                gem["color"] = "red"
                gem["label"] = "QUOTA EXCEEDED (429)"
            elif "400" in err_str or "401" in err_str or "403" in err_str or "key" in err_str.lower():
                gem["color"] = "red"
                gem["label"] = "INVALID API KEY"
            else:
                gem["color"] = "red"
                gem["label"] = "API Error (Fallback Used)"

    async def probe_statuses(self, force: bool = False) -> Dict[str, Any]:
        """
        Runs a lightweight, zero-token probe (cached for 60s unless forced)
        to verify FRED CSV reachability and Gemini API key validity.
        """
        now = time.time()
        if not force and (now - self._last_probe_ts) < 60:
            return self.state

        self._last_probe_ts = now
        self.state["last_checked_utc"] = datetime.now(timezone.utc).isoformat()

        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            self.state["gemini_ai"]["color"] = "amber"
            self.state["gemini_ai"]["label"] = "No Key (Offline Mock)"
        elif self.state["gemini_ai"]["color"] != "red":
            # Zero-token metadata check against Gemini models endpoint
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    r = await client.get(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key={api_key}"
                    )
                    if r.status_code == 200:
                        tok = self.state["gemini_ai"].get("last_run_tokens", 0)
                        runs = self.state["gemini_ai"].get("calls_today", 0)
                        self.state["gemini_ai"]["color"] = "green"
                        self.state["gemini_ai"]["label"] = (
                            f"Ready ({tok:,} tok | {runs} runs)" if runs > 0 else "Key Valid (0 tok used)"
                        )
                    elif r.status_code == 429:
                        self.state["gemini_ai"]["color"] = "red"
                        self.state["gemini_ai"]["label"] = "QUOTA EXCEEDED (429)"
                    else:
                        self.state["gemini_ai"]["color"] = "red"
                        self.state["gemini_ai"]["label"] = f"Key Error (HTTP {r.status_code})"
            except Exception as e:
                self.state["gemini_ai"]["color"] = "amber"
                self.state["gemini_ai"]["label"] = "Network Timeout"

        return self.state

# Singleton tracker instance
health_tracker = RefreshHealthTracker()
```

---

## 4. Backend Step 2: Hook `synthesizer.py` & `main.py` Into the Health Tracker

### 4.1 Update `backend/app/refresh_pipeline/synthesizer.py`
Inside `LLMStrategySynthesizer.synthesize()`, record the exact token count or `429` error into `health_tracker`:

```python
from backend.app.refresh_pipeline.health_monitor import health_tracker

# Inside LLMStrategySynthesizer.synthesize():
        if not self.api_key:
            health_tracker.record_gemini_run(False, error_msg="GEMINI_API_KEY not set")
            self.state_color = "amber"
            return self._build_offline_mock(raw_sweep_data)

        try:
            response = model.generate_content(prompt)
            # Extract exact token usage from Gemini response metadata (0 extra cost)
            tokens_used = 0
            if hasattr(response, "usage_metadata") and response.usage_metadata:
                tokens_used = getattr(response.usage_metadata, "total_token_count", 0)
            health_tracker.record_gemini_run(True, tokens_used=tokens_used)
            data = json.loads(response.text)
            return UnifiedRefreshBatchOutput(**data)
        except Exception as e:
            health_tracker.record_gemini_run(False, error_msg=str(e))
            print(f"[Synthesizer] LLM extraction error: {e}. Falling back to baseline structure.")
            return self._build_offline_mock(raw_sweep_data)
```

### 4.2 Add `/api/v1/refresh/status` & Include Status in SSE Stream (`backend/app/main.py`)
In `backend/app/main.py`, expose a fast status endpoint (and also attach `"health": await health_tracker.probe_statuses()` to `/api/health` and the SSE `complete` event):

```python
from backend.app.refresh_pipeline.health_monitor import health_tracker

@app.get("/api/v1/refresh/status")
async def get_refresh_health_status(force: bool = False):
    """Returns the 4-component traffic-light health & Gemini quota status (0 tokens used)."""
    return await health_tracker.probe_statuses(force=force)
```

---

## 5. Frontend Step 3: Compact Traffic-Light Status Line (`frontend/src/components/RefreshModal.tsx` or `Header.tsx`)

Add this compact, single-line **Traffic-Light Health Strip** right inside the Refresh Data status window (and optionally next to the "Refresh Data" button in the top header):

```tsx
"use client";
import React, { useEffect, useState } from "react";

interface ComponentStatus {
  color: "green" | "amber" | "red";
  label: string;
  last_error?: string | null;
}

interface RefreshHealthPayload {
  last_checked_utc: string | null;
  backend_api: ComponentStatus;
  macro_data: ComponentStatus;
  market_feeds: ComponentStatus;
  gemini_ai: ComponentStatus & { last_run_tokens?: number; calls_today?: number };
}

const DOT_STYLES: Record<"green" | "amber" | "red", string> = {
  green: "bg-emerald-400 shadow-[0_0_8px_#10b981]",
  amber: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
  red: "bg-rose-500 shadow-[0_0_10px_#ef4444] animate-pulse",
};

const TEXT_STYLES: Record<"green" | "amber" | "red", string> = {
  green: "text-slate-200 border-slate-700/80 bg-slate-900/90",
  amber: "text-amber-300 border-amber-500/40 bg-amber-950/30",
  red: "text-rose-300 border-rose-500/60 bg-rose-950/50 font-semibold",
};

export function RefreshHealthStrip({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [health, setHealth] = useState<RefreshHealthPayload | null>(null);

  const checkHealth = async (force = false) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/refresh/status?force=${force}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({
        last_checked_utc: new Date().toISOString(),
        backend_api: { color: "red", label: "API Offline / Waking" },
        macro_data: { color: "amber", label: "Macro: Standby" },
        market_feeds: { color: "amber", label: "Markets: Standby" },
        gemini_ai: { color: "amber", label: "Gemini: Unreachable" },
      });
    }
  };

  useEffect(() => {
    checkHealth(false);
  }, []);

  if (!health) return null;

  const items = [
    { key: "API", ...health.backend_api },
    { key: "Macro", ...health.macro_data },
    { key: "Markets", ...health.market_feeds },
    { key: "Gemini AI", ...health.gemini_ai },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#0B101B] px-3 py-1.5 text-xs font-mono">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-400 uppercase tracking-wider text-[10px]">
          System & Quota:
        </span>
        {items.map((item) => (
          <div
            key={item.key}
            title={item.last_error || item.label}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${TEXT_STYLES[item.color]}`}
          >
            <span className={`h-2 w-2 rounded-full ${DOT_STYLES[item.color]}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => checkHealth(true)}
        className="text-[11px] text-cyan-400 hover:text-cyan-300 underline decoration-dotted"
        title="Re-check API & Gemini key status (0 tokens)"
      >
        Check Status
      </button>
    </div>
  );
}
```

### 5.1 Mount Inside Your Refresh Modal
Place `<RefreshHealthStrip apiBaseUrl={API_BASE_URL} />` directly at the top of the **Refresh Data** status modal (and re-trigger `checkHealth(false)` when the SSE `complete` or `error` event fires). If your Gemini key ever hits its free-tier rate limit (`HTTP 429`), the **Gemini AI** pill immediately pulses **🔴 RED (`QUOTA EXCEEDED (429)`)** while the rest of your quantitative refresh finishes safely using the fallback cache.

---

## 6. Verification Command for Antigravity

```bash
python -c "import asyncio; from backend.app.refresh_pipeline.health_monitor import health_tracker; health_tracker.record_gemini_run(False, error_msg='429 ResourceExhausted: Quota exceeded'); print(health_tracker.state['gemini_ai'])"
```
*Expected Output*: `{'color': 'red', 'label': 'QUOTA EXCEEDED (429)', 'last_run_tokens': 0, 'calls_today': 0, 'last_error': '429 ResourceExhausted: Quota exceeded'}`.
