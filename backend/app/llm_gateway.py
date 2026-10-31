"""
backend/app/llm_gateway.py
Unified, resilient Groq LLM Gateway (Llama 3.3 70B).
Provides high-throughput, low-latency institutional macro and fundamental intelligence synthesis.
"""

import os
import re
import json
import logging
from typing import Optional, Dict, Any, Union, Type, List
from pydantic import BaseModel
import httpx

logger = logging.getLogger("macropulse.llm_gateway")

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
FALLBACK_GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]


def _clean_json_markdown(raw_content: str) -> str:
    """Strips markdown code fences (```json ... ```) from LLM output if present."""
    trimmed = raw_content.strip()
    if trimmed.startswith("```"):
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", trimmed)
        if match:
            return match.group(1).strip()
    return trimmed


class LLMGateway:
    def __init__(self):
        self.api_key = (os.getenv("GROQ_API_KEY") or "").strip()
        if not self.api_key:
            try:
                from app.config import settings
                self.api_key = (getattr(settings, "GROQ_API_KEY", "") or getattr(settings, "LLM_API_KEY", "")).strip()
            except Exception:
                pass
        self.last_tokens_used: int = 0
        self.last_model_used: str = ""

    def is_configured(self) -> bool:
        if not self.api_key:
            self.api_key = (os.getenv("GROQ_API_KEY") or "").strip()
        return bool(self.api_key)

    def _build_payload(
        self,
        prompt: str,
        system_instruction: str,
        response_json_schema: Optional[Type[BaseModel]],
        temperature: float,
        max_tokens: int,
        model: str,
    ) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt},
        ]

        if response_json_schema:
            schema_json = json.dumps(response_json_schema.model_json_schema())
            messages[0]["content"] += f"\nYou must output strictly valid JSON conforming to this schema:\n{schema_json}"

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if response_json_schema:
            payload["response_format"] = {"type": "json_object"}

        return payload

    def _parse_completion_response(
        self,
        data: Dict[str, Any],
        response_json_schema: Optional[Type[BaseModel]],
    ) -> Union[Dict[str, Any], str]:
        usage = data.get("usage", {})
        self.last_tokens_used = usage.get("total_tokens", 0)
        self.last_model_used = data.get("model", "")

        content = data["choices"][0]["message"]["content"]
        if response_json_schema:
            cleaned = _clean_json_markdown(content)
            return json.loads(cleaned)
        return content

    async def complete(
        self,
        prompt: str,
        system_instruction: str = "You are an institutional macro research and equity analyst.",
        response_json_schema: Optional[Type[BaseModel]] = None,
        temperature: float = 0.15,
        max_tokens: int = 2500,
    ) -> Union[Dict[str, Any], str]:
        """
        Executes a fast completion call via Groq API (async).
        If response_json_schema is provided, enforces JSON format and returns parsed dict.
        """
        if not self.is_configured():
            logger.warning("GROQ_API_KEY not found. Returning empty/mock response.")
            return {} if response_json_schema else "AI Analysis disabled (Missing GROQ_API_KEY)."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        requested_model = os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL).strip()
        models_to_try = [requested_model] + [m for m in FALLBACK_GROQ_MODELS if m != requested_model]

        async with httpx.AsyncClient(timeout=25.0) as client:
            last_error = None
            for model_name in models_to_try:
                payload = self._build_payload(
                    prompt, system_instruction, response_json_schema, temperature, max_tokens, model_name
                )
                try:
                    res = await client.post(f"{GROQ_BASE_URL}/chat/completions", headers=headers, json=payload)
                    if res.status_code == 200:
                        return self._parse_completion_response(res.json(), response_json_schema)
                    elif res.status_code == 429:
                        logger.error("Groq rate limit hit (HTTP 429).")
                        raise RuntimeError("GROQ_RATE_LIMIT")
                    elif res.status_code in (400, 404):
                        err_text = res.text
                        if "model_not_found" in err_text or "decommissioned" in err_text or "does not exist" in err_text:
                            logger.warning(
                                f"Model '{model_name}' unavailable on Groq ({res.status_code}). Trying fallback model..."
                            )
                            last_error = RuntimeError(f"GROQ_MODEL_UNAVAILABLE: {model_name}")
                            continue
                        logger.error(f"Groq API error {res.status_code}: {err_text}")
                        raise RuntimeError(f"GROQ_ERROR_{res.status_code}")
                    else:
                        logger.error(f"Groq API error {res.status_code}: {res.text}")
                        raise RuntimeError(f"GROQ_ERROR_{res.status_code}")
                except (RuntimeError, json.JSONDecodeError):
                    raise
                except Exception as e:
                    logger.error(f"LLM Gateway execution error on {model_name}: {e}")
                    last_error = e
                    continue

            if last_error:
                raise last_error
            raise RuntimeError("GROQ_COMPLETION_FAILED")

    def complete_sync(
        self,
        prompt: str,
        system_instruction: str = "You are an institutional macro research and equity analyst.",
        response_json_schema: Optional[Type[BaseModel]] = None,
        temperature: float = 0.15,
        max_tokens: int = 2500,
    ) -> Union[Dict[str, Any], str]:
        """
        Synchronous completion call via Groq API (httpx.Client).
        Guarantees safe execution inside running asyncio event loops or background threads.
        """
        if not self.is_configured():
            logger.warning("GROQ_API_KEY not found. Returning empty/mock response.")
            return {} if response_json_schema else "AI Analysis disabled (Missing GROQ_API_KEY)."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        requested_model = os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL).strip()
        models_to_try = [requested_model] + [m for m in FALLBACK_GROQ_MODELS if m != requested_model]

        with httpx.Client(timeout=25.0) as client:
            last_error = None
            for model_name in models_to_try:
                payload = self._build_payload(
                    prompt, system_instruction, response_json_schema, temperature, max_tokens, model_name
                )
                try:
                    res = client.post(f"{GROQ_BASE_URL}/chat/completions", headers=headers, json=payload)
                    if res.status_code == 200:
                        return self._parse_completion_response(res.json(), response_json_schema)
                    elif res.status_code == 429:
                        logger.error("Groq rate limit hit (HTTP 429).")
                        raise RuntimeError("GROQ_RATE_LIMIT")
                    elif res.status_code in (400, 404):
                        err_text = res.text
                        if "model_not_found" in err_text or "decommissioned" in err_text or "does not exist" in err_text:
                            logger.warning(
                                f"Model '{model_name}' unavailable on Groq ({res.status_code}). Trying fallback model..."
                            )
                            last_error = RuntimeError(f"GROQ_MODEL_UNAVAILABLE: {model_name}")
                            continue
                        logger.error(f"Groq API error {res.status_code}: {err_text}")
                        raise RuntimeError(f"GROQ_ERROR_{res.status_code}")
                    else:
                        logger.error(f"Groq API error {res.status_code}: {res.text}")
                        raise RuntimeError(f"GROQ_ERROR_{res.status_code}")
                except (RuntimeError, json.JSONDecodeError):
                    raise
                except Exception as e:
                    logger.error(f"LLM Gateway execution error on {model_name}: {e}")
                    last_error = e
                    continue

            if last_error:
                raise last_error
            raise RuntimeError("GROQ_COMPLETION_FAILED")

    async def probe_health(self) -> Dict[str, Any]:
        """Probes Groq models endpoint with zero token generation overhead."""
        if not self.is_configured():
            return {
                "status": "NO_KEY",
                "color": "amber",
                "model": os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL),
                "label": "No Key (Offline Mock)",
                "message": "GROQ_API_KEY not configured in environment.",
            }

        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{GROQ_BASE_URL}/models", headers=headers)
                if res.status_code == 200:
                    model_list = [m.get("id", "") for m in res.json().get("data", [])]
                    active_model = os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL)
                    return {
                        "status": "ONLINE",
                        "color": "green",
                        "model": active_model,
                        "label": f"Groq Online ({active_model})",
                        "available_models_count": len(model_list),
                        "message": "Groq Llama 3.3 Gateway Online",
                    }
                elif res.status_code == 429:
                    return {
                        "status": "QUOTA_EXCEEDED",
                        "color": "red",
                        "model": os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL),
                        "label": "QUOTA EXCEEDED (429)",
                        "message": "Groq Rate Limit Exceeded",
                    }
                else:
                    return {
                        "status": "AUTH_ERROR",
                        "color": "red",
                        "model": os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL),
                        "label": f"Key Error (HTTP {res.status_code})",
                        "message": f"Groq Authentication Error (HTTP {res.status_code})",
                    }
        except Exception as exc:
            return {
                "status": "OFFLINE",
                "color": "amber",
                "model": os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL),
                "label": "Network Timeout",
                "message": f"Groq Network Error: {exc}",
            }


# Singleton instance
llm_gateway = LLMGateway()

