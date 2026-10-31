"""
backend/tests/test_llm_gateway.py
Unit tests for Groq LLM Gateway and Structured Synthesizer.
"""

import os
import sys
import unittest
from pydantic import BaseModel

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.llm_gateway import llm_gateway, _clean_json_markdown
from app.refresh_pipeline.synthesizer import LLMStrategySynthesizer, UnifiedRefreshBatchOutput
from app.refresh_pipeline.health_monitor import health_tracker


class SampleSchema(BaseModel):
    summary: str
    confidence: float


class TestLLMGateway(unittest.TestCase):
    def test_clean_json_markdown(self):
        raw_md = "```json\n{\"summary\": \"test\", \"confidence\": 0.95}\n```"
        cleaned = _clean_json_markdown(raw_md)
        self.assertEqual(cleaned, '{"summary": "test", "confidence": 0.95}')

        plain = '{"summary": "clean"}'
        self.assertEqual(_clean_json_markdown(plain), plain)

    def test_gateway_configuration(self):
        self.assertTrue(llm_gateway.is_configured())

    def test_sync_completion_structured(self):
        result = llm_gateway.complete_sync(
            prompt="Analyze current market regime and return summary and confidence.",
            system_instruction="You are a macro analyst. Return structured JSON.",
            response_json_schema=SampleSchema,
            temperature=0.1,
            max_tokens=300
        )
        self.assertIsInstance(result, dict)
        self.assertIn("summary", result)
        self.assertIn("confidence", result)
        self.assertGreater(llm_gateway.last_tokens_used, 0)

    def test_synthesizer_offline_mock(self):
        synth = LLMStrategySynthesizer()
        mock_output = synth._build_offline_mock({"since_date": "2026-10-01"})
        self.assertIsInstance(mock_output, UnifiedRefreshBatchOutput)
        self.assertGreater(len(mock_output.authors), 0)
        self.assertGreater(len(mock_output.consolidated_affected_tickers), 0)

    def test_synthesizer_async_live(self):
        import asyncio
        synth = LLMStrategySynthesizer()
        raw_sweep = {
            "since_date": "2026-10-01",
            "raw_text": "Keith McCullough notes Quad 2 reflation momentum."
        }
        math_snap = {
            "us_monthly_quad": "Quad 2",
            "grid_regime": "REFLATION",
            "net_liquidity_usd_bn": 6150.0
        }
        output = asyncio.run(synth.synthesize(raw_sweep, math_snap))
        self.assertIsInstance(output, UnifiedRefreshBatchOutput)
        self.assertGreater(len(output.authors), 0)

    def test_health_tracker_groq_run(self):
        health_tracker.record_groq_run(True, tokens_used=150)
        self.assertEqual(health_tracker.state["gemini_ai"]["color"], "green")
        self.assertIn("150", health_tracker.state["gemini_ai"]["label"])
        self.assertEqual(health_tracker.state["groq_ai"]["color"], "green")


if __name__ == "__main__":
    unittest.main()

