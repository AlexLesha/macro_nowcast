import os
import sys
import unittest
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.quant_engine.options_outliers import (
    analyze_options_chain,
    compute_crowding_and_dispersion,
    scan_1_to_3_month_outliers,
)


class TestOptionsOutliersEngine(unittest.TestCase):
    """Test suite for Chunk 5 options microstructure, crowding, and outlier scanner."""

    def test_analyze_options_chain_spy(self):
        result = analyze_options_chain("SPY")
        self.assertIsNotNone(result)
        self.assertEqual(result["ticker"], "SPY")
        self.assertGreater(result["spot_price"], 0)
        self.assertIn("gex_regime", result)
        self.assertGreater(result["call_wall"], 0)
        self.assertGreater(result["put_wall"], 0)
        self.assertGreaterEqual(result["zero_dte_heat_ratio"], 0.0)

    def test_compute_crowding_and_dispersion(self):
        result = compute_crowding_and_dispersion()
        self.assertIn("vrp_crowding", result)
        self.assertIn("sector_dispersion", result)
        self.assertIn("inverse_etf_sentiment", result)
        self.assertIsInstance(result["vrp_crowding"]["vrp_z_score"], float)
        self.assertIsInstance(result["inverse_etf_sentiment"]["capitulation_triggered"], bool)

    def test_scan_1_to_3_month_outliers(self):
        result = scan_1_to_3_month_outliers()
        self.assertIn("ranked_outliers", result)
        self.assertIn("speculation_ripple_effects", result)
        self.assertGreater(len(result["ranked_outliers"]), 0)
        top = result["ranked_outliers"][0]
        self.assertIn("outlier_score", top)
        self.assertIn("why_rationale", top)
        self.assertGreaterEqual(top["outlier_score"], 0)
        self.assertLessEqual(top["outlier_score"], 100)


if __name__ == "__main__":
    unittest.main()
