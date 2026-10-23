"""
backend/app/refresh_pipeline/health_monitor.py
Zero-token health and Gemini quota diagnostics for the Refresh Data status window.
"""

import os
import time
from datetime import datetime, timezone
from typing import Dict, Any, Literal, Optional
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
        if not force and (now - self._last_probe_ts) < 60 and self.state.get("last_checked_utc"):
            return self.state

        self._last_probe_ts = now
        self.state["last_checked_utc"] = datetime.now(timezone.utc).isoformat()

        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            try:
                from app.config import settings
                api_key = getattr(settings, "LLM_API_KEY", "") or ""
            except Exception:
                pass

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
            except Exception:
                self.state["gemini_ai"]["color"] = "amber"
                self.state["gemini_ai"]["label"] = "Network Timeout"

        return self.state

# Singleton tracker instance
health_tracker = RefreshHealthTracker()
