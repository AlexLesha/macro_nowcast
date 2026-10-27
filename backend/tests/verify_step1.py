"""
backend/tests/verify_step1.py
Empirical verification script for Step 1 fixes:
1. Route Shadowing (Option B): Verifies dynamic endpoints take precedence over legacy api_router.
2. Fallback Router: Verifies legacy endpoints on api_router remain accessible.
3. .env Auto-discovery & Fallback API Keys.
4. Database Path Anchoring.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

def main():
    client = TestClient(app)

    print("=" * 60)
    print("STEP 1 VERIFICATION SUITE")
    print("=" * 60)

    # 1. Config & Environment Verification
    print("\n--- 1. CONFIG & DB ANCHORING ---")
    print(f"FRED_API_KEY: {settings.FRED_API_KEY[:8]}... (length: {len(settings.FRED_API_KEY)})")
    print(f"GEMINI_API_KEY: {settings.GEMINI_API_KEY[:8]}... (length: {len(settings.GEMINI_API_KEY)})")
    print(f"DATABASE_URL: {settings.DATABASE_URL}")
    assert len(settings.FRED_API_KEY) > 10, "FRED_API_KEY is too short"
    assert len(settings.GEMINI_API_KEY) > 10, "GEMINI_API_KEY is too short"
    assert "macro_pulse.db" in settings.DATABASE_URL, "DATABASE_URL does not point to macro_pulse.db"
    print("[OK] Config & DB anchoring verified successfully.")

    # 2. Route Precedence & Fallback Verification
    print("\n--- 2. ROUTE PRECEDENCE & FALLBACK VERIFICATION ---")
    tests = [
        # Dynamic Endpoints from main.py (Must NOT be shadowed by legacy routes.py)
        ("/api/v1/synthesis", lambda d: "authors" in d and "live_resolution_rules" in d, "Dynamic 4-Author Synthesis"),
        ("/api/v1/speculation", lambda d: "speculation_rows" in d and len(d["speculation_rows"]) > 0, "Dynamic Speculation Matrix"),
        ("/api/v1/scenarios", lambda d: "scenarios" in d and "quarters" in d, "Dynamic Scenarios Matrix"),
        ("/api/v1/executive-summary", lambda d: "header_badge" in d and "kpi_1_us_quad" in d, "Dynamic Executive Summary"),
        ("/api/v1/health", lambda d: d.get("status") == "ok" and "health" in d, "Dynamic Health Tracker"),
        ("/api/health", lambda d: d.get("status") == "ok" and "health" in d, "Dynamic /api/health"),
        ("/api/v1/42macro/dashboard", lambda d: "global_macro_risk_matrix" in d, "Dynamic 42Macro Dashboard"),
        ("/api/v1/commodities-alternatives/dashboard", lambda d: "structure_1_term_structure" in d and "structure_2_shadow_plumbing" in d, "Dynamic Commodities Dashboard"),
        ("/api/v1/options-lab/dashboard?ticker=SPY", lambda d: "module_1_gex_and_collar" in d, "Dynamic Options Lab"),
        # Fallback Endpoints from routes.py (Must still be registered and functional)
        ("/api/macro/series/latest", lambda d: isinstance(d, list), "Fallback /api/macro/series/latest"),
        ("/api/market/matrix", lambda d: isinstance(d, list), "Fallback /api/market/matrix"),
        ("/api/options/microstructure", lambda d: isinstance(d, list), "Fallback /api/options/microstructure"),
    ]

    all_passed = True
    for url, validator, label in tests:
        r = client.get(url)
        passed = False
        if r.status_code == 200:
            try:
                data = r.json()
                passed = validator(data)
            except Exception as e:
                print(f"Error parsing JSON for {url}: {e}")
                passed = False
        status_icon = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_passed = False
        print(f"{status_icon}: [{r.status_code}] {url} -> {label}")

    # Test /api/export-html (returns HTML)
    r_html = client.get("/api/v1/export-html")
    html_passed = (r_html.status_code == 200 and "MacroPulse Alpha" in r_html.text)
    print(f"{'[PASS]' if html_passed else '[FAIL]'}: [{r_html.status_code}] /api/v1/export-html -> Fallback HTML Export")
    if not html_passed:
        all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("ALL STEP 1 TESTS PASSED SUCCESSFULLY!")
    else:
        print("SOME TESTS FAILED.")
    print("=" * 60)
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
