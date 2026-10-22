import unittest
from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.refresh_pipeline.media_scraper import MediaScraper
from app.refresh_pipeline.synthesizer import StrategySynthesizer
from app.refresh_pipeline.orchestrator import refresh_orchestrator


class TestRefreshPipeline(unittest.TestCase):
    """Test suite for Chunk 6 autonomous refresh pipeline, scrapers, and synthesizer."""

    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_media_scraper(self):
        scraper = MediaScraper(timeout=4.0)
        items = scraper.run_full_scrape()
        self.assertIsInstance(items, list)
        self.assertGreater(len(items), 0)

        first = items[0]
        self.assertIn("source_id", first)
        self.assertIn("framework_author", first)
        self.assertIn("source_title", first)
        self.assertIn("source_url", first)
        self.assertIn("raw_text", first)

    def test_synthesizer_and_diff(self):
        synth = StrategySynthesizer()
        mock_item = {
            "source_id": "test-hedgeye-item",
            "source_type": "YOUTUBE",
            "framework_author": "Hedgeye (Keith McCullough)",
            "source_title": "The Macro Show: Quad 2 Momentum Acceleration",
            "source_url": "https://app.hedgeye.com/insights/macro-show",
            "raw_text": "Keith McCullough discusses Quad 2 accelerating into Q3.",
            "affected_tickers": "SPY, NVDA, VST",
        }
        extracted = synth.extract_structured_assertions(mock_item, {"quad": "QUAD_2"})
        self.assertIn("macro_regime_call", extracted)
        self.assertIn("actionable_ticker_tilts", extracted)

        deltas = synth.generate_intelligence_deltas(self.db, [mock_item], {"quad": "QUAD_2"})
        self.assertEqual(len(deltas), 1)

        diff = synth.compute_what_changed_diff(
            self.db,
            new_quant_metrics={"net_liquidity_usd_bn": 6155.0, "quad_2_prob": 0.60, "quad_3_prob": 0.08},
            new_deltas=deltas
        )
        self.assertIn("quantitative_deltas", diff)
        self.assertIn("top_conviction_call_outs", diff)
        self.assertIn("narrative_highlights", diff)

    def test_api_endpoints(self):
        # 1. Trigger endpoint
        res = self.client.post("/api/v1/refresh/trigger")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("status", data)

        # 2. Status endpoint
        res = self.client.get("/api/v1/refresh/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("progress_pct", data)

        # 3. Diff endpoint
        res = self.client.get("/api/v1/refresh/diff")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("quantitative_deltas", data)
        self.assertIn("top_conviction_call_outs", data)


if __name__ == "__main__":
    unittest.main()
