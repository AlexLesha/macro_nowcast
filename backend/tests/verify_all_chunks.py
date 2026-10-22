"""
Comprehensive Verification Script for Chunks 1 through 7 of MacroPulse Alpha.
Validates all modules, functions, API endpoints, and calculation pipelines.
"""

import os
import sys
import unittest
from datetime import datetime, timezone
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from fastapi.testclient import TestClient
from app.db import init_db, SessionLocal, engine
from app.models.db_models import Base, RegimeSnapshot, MacroSeries, IntelligenceDelta
from app.quant_engine.macro_nowcast import (
    compute_growth_nowcast,
    compute_inflation_nowcast,
    evaluate_hedgeye_quad,
    compute_42macro_grid_regime,
    compute_prometheus_analog,
)
from app.quant_engine.liquidity_engine import (
    compute_us_net_liquidity,
    compute_global_liquidity,
    compute_accord2_gauge,
    compute_kiss_allocation,
    compute_three_fourteen_raa,
    compute_hedgeye_kspy_overlay,
)
from app.quant_engine.signals import (
    compute_dr_mo_factor_scores,
    compute_pod_123_and_fcte_quality_screen,
)
from app.quant_engine.options_outliers import (
    analyze_options_chain,
    compute_crowding_and_dispersion,
    scan_1_to_3_month_outliers,
)
from app.refresh_pipeline.media_scraper import MediaScraper
from app.refresh_pipeline.synthesizer import StrategySynthesizer
from app.refresh_pipeline.orchestrator import RefreshPipelineOrchestrator


class TestAllSevenChunks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_chunk_1_db_and_models(self):
        """Chunk 1: Database schemas & Ingestion Models."""
        # Verify tables created
        table_names = list(Base.metadata.tables.keys())
        expected = ["macro_series", "market_daily", "options_microstructure", "regime_snapshots", "intelligence_deltas"]
        for exp in expected:
            self.assertIn(exp, table_names, f"Table {exp} missing from DB metadata")

        # Verify query execution
        snapshot_count = self.db.query(RegimeSnapshot).count()
        self.assertGreaterEqual(snapshot_count, 0)

    def test_chunk_2_macro_nowcasting(self):
        """Chunk 2: Growth/Inflation nowcasting, Quads, GRID, Analog."""
        # Growth & Inflation
        g_nowcast = compute_growth_nowcast()
        self.assertIn("gdp_nowcast_qoq_saar", g_nowcast)
        self.assertGreater(g_nowcast["gdp_nowcast_qoq_saar"], -10.0)

        inf_nowcast = compute_inflation_nowcast()
        self.assertIn("headline_cpi_forecast_yoy", inf_nowcast)

        # Hedgeye Quad
        quad_res = evaluate_hedgeye_quad(growth_rate=0.024, inflation_rate=0.028)
        self.assertIn("quad", quad_res)
        self.assertIn(quad_res["quad"], [1, 2, 3, 4])

        # 42 Macro GRID
        grid_res = compute_42macro_grid_regime(growth_rate=0.024, inflation_rate=0.028)
        self.assertIn("regime", grid_res)
        self.assertIn("scores", grid_res)

        # Prometheus 1965 Analog
        analog_res = compute_prometheus_analog()
        self.assertIn("top_historical_analogs", analog_res)
        self.assertGreaterEqual(len(analog_res["top_historical_analogs"]), 1)

    def test_chunk_3_liquidity_and_allocation(self):
        """Chunk 3: US Net Liquidity, Accord 2.0, KISS 60/30/10, RAA, KSPY."""
        liq = compute_us_net_liquidity(walcl=7020.0, tga=780.0, rrp=90.0)
        self.assertIn("us_net_liquidity_usd_bn", liq)
        self.assertAlmostEqual(liq["us_net_liquidity_usd_bn"], 6150.0, delta=1.0)

        accord = compute_accord2_gauge()
        self.assertIn("accord2_active", accord)

        kiss = compute_kiss_allocation(current_quad=2)
        self.assertIn("SPY", kiss)
        self.assertIn("GLD", kiss)
        self.assertIn("IBIT", kiss)
        self.assertIn("USFR", kiss)
        self.assertAlmostEqual(sum(kiss.values()), 1.0, delta=0.01)

        raa = compute_three_fourteen_raa()
        self.assertIn("equities_pct", raa)

        kspy = compute_hedgeye_kspy_overlay(current_price=590.0, trend_pivot=580.0)
        self.assertIn("overlay_state", kspy)
        self.assertIn("net_delta", kspy)

    def test_chunk_4_quant_signals_and_quality(self):
        """Chunk 4: Dr. Mo 70 Factors & POD 1/2/3 Quality Screening."""
        scores = compute_dr_mo_factor_scores()
        self.assertIn("factors", scores)
        self.assertGreaterEqual(len(scores["factors"]), 50)

        pod = compute_pod_123_and_fcte_quality_screen()
        self.assertIn("qualified_candidates", pod)
        self.assertGreaterEqual(len(pod["qualified_candidates"]), 1)

    def test_chunk_5_options_and_outliers(self):
        """Chunk 5: Options GEX, VRP Crowding, 1-3M Outliers."""
        opts = analyze_options_chain("NVDA")
        self.assertIn("net_gex_usd", opts)
        self.assertIn("call_wall", opts)
        self.assertIn("put_wall", opts)

        crowd = compute_crowding_and_dispersion()
        self.assertIn("vrp_z_score", crowd)
        self.assertIn("speculative_inverse_etf_volume_ratio", crowd)

        outliers = scan_1_to_3_month_outliers()
        self.assertIn("outliers", outliers)
        self.assertGreaterEqual(len(outliers["outliers"]), 1)

    def test_chunk_6_refresh_pipeline(self):
        """Chunk 6: Autonomous Media Scraper, Synthesizer, SSE endpoints."""
        scraper = MediaScraper()
        items = scraper.scrape_curated_institutional_sources()
        self.assertGreaterEqual(len(items), 1)

        synth = StrategySynthesizer()
        diff = synth.compute_what_changed_diff(self.db)
        self.assertIn("summary", diff)
        self.assertIn("author_convictions", diff)

        # Trigger refresh endpoint
        resp = self.client.post("/api/v1/refresh/trigger")
        self.assertEqual(resp.status_code, 200)

        status_resp = self.client.get("/api/v1/refresh/status")
        self.assertEqual(status_resp.status_code, 200)
        self.assertIn("status", status_resp.json())

    def test_chunk_7_endpoints_and_export(self):
        """Chunk 7: API endpoints & Standalone HTML export."""
        health = self.client.get("/api/health")
        self.assertEqual(health.status_code, 200)

        regime = self.client.get("/api/regime/current")
        self.assertEqual(regime.status_code, 200)

        outliers_api = self.client.get("/api/outliers/scan")
        self.assertEqual(outliers_api.status_code, 200)

        export_html = self.client.get("/api/export-html")
        self.assertEqual(export_html.status_code, 200)
        self.assertIn("<!DOCTYPE html>", export_html.text)
        self.assertIn("MACROPULSE.ALPHA", export_html.text)
        self.assertIn("Executive Summary", export_html.text)
        self.assertIn("Framework Synthesis", export_html.text)
        self.assertIn("Speculation Matrix", export_html.text)


if __name__ == "__main__":
    unittest.main()
