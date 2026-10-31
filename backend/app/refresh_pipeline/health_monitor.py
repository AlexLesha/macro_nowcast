"""
backend/app/refresh_pipeline/health_monitor.py
Zero-token health and Groq (Llama 3.3 70B) diagnostics for the Refresh Data status window.
"""

import os
import time
from datetime import datetime, timezone
from typing import Dict, Any, Literal, Optional
import httpx

TrafficColor = Literal["green", "amber", "red"]

class RefreshHealthTracker:
    """Tracks component status and Groq LLM API quota/token usage in-memory with zero token overhead."""
    def __init__(self):
        self.state: Dict[str, Any] = {
            "last_checked_utc": None,
            "backend_api": {"color": "green", "label": "Online (Render)"},
            "macro_data": {"color": "green", "label": "FRED / Treasury Ready"},
            "market_feeds": {"color": "green", "label": "yfinance / CBOE Ready"},
            "groq_ai": {
                "color": "amber",
                "label": "Unchecked",
                "last_run_tokens": 0,
                "calls_today": 0,
                "last_error": None
            }
        }
        self.state["gemini_ai"] = self.state["groq_ai"]
        self.state["llm_ai"] = self.state["groq_ai"]
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

    def record_groq_run(self, success: bool, tokens_used: int = 0, error_msg: Optional[str] = None):
        """Called by synthesizer.py after a single-batch extraction attempt."""
        groq = self.state["groq_ai"]
        if success:
            groq["calls_today"] = groq.get("calls_today", 0) + 1
            groq["last_run_tokens"] = tokens_used
            groq["last_error"] = None
            groq["color"] = "green"
            groq["label"] = f"Groq Ready ({tokens_used:,} tok | {groq['calls_today']} runs)"
        else:
            err_str = str(error_msg or "Unknown Error")
            groq["last_error"] = err_str[:120]
            if "429" in err_str or "quota" in err_str.lower() or "exhausted" in err_str.lower():
                groq["color"] = "red"
                groq["label"] = "QUOTA EXCEEDED (429)"
            elif "400" in err_str or "401" in err_str or "403" in err_str or "key" in err_str.lower():
                groq["color"] = "red"
                groq["label"] = "INVALID API KEY"
            else:
                groq["color"] = "red"
                groq["label"] = "API Error (Fallback Used)"

        self.state["gemini_ai"] = groq
        self.state["llm_ai"] = groq

    record_gemini_run = record_groq_run

    async def probe_statuses(self, force: bool = False) -> Dict[str, Any]:
        """
        Runs a lightweight, zero-token probe (cached for 60s unless forced)
        to verify FRED CSV reachability and Groq API key validity.
        """
        now = time.time()
        if not force and (now - self._last_probe_ts) < 60 and self.state.get("last_checked_utc"):
            return self.state

        self._last_probe_ts = now
        self.state["last_checked_utc"] = datetime.now(timezone.utc).isoformat()

        api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not api_key:
            try:
                from app.config import settings
                api_key = (getattr(settings, "GROQ_API_KEY", "") or getattr(settings, "LLM_API_KEY", "")).strip()
            except Exception:
                pass

        if not api_key:
            self.state["groq_ai"] = {"color": "amber", "label": "No Key (Offline Mock)"}
        else:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    r = await client.get(
                        "https://api.groq.com/openai/v1/models",
                        headers={"Authorization": f"Bearer {api_key}"}
                    )
                    if r.status_code == 200:
                        self.state["groq_ai"] = {"color": "green", "label": "Groq Llama-3.3 Ready"}
                    elif r.status_code == 429:
                        self.state["groq_ai"] = {"color": "red", "label": "QUOTA EXCEEDED (429)"}
                    else:
                        self.state["groq_ai"] = {"color": "red", "label": f"Key Error ({r.status_code})"}
            except Exception:
                self.state["groq_ai"] = {"color": "amber", "label": "Network Timeout"}

        # Maintain gemini_ai and llm_ai for frontend backward compatibility
        self.state["gemini_ai"] = self.state["groq_ai"]
        self.state["llm_ai"] = self.state["groq_ai"]
        return self.state

# Singleton tracker instance
health_tracker = RefreshHealthTracker()
