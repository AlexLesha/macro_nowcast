# Antigravity Task: Unified Refresh Pipeline & Dynamic Live Scraping Synthesis for /synthesis

> **Antigravity Execution Directive:**
> Read `antigravity_unified_refresh_and_synthesis_engine.md` and execute the following upgrades:
> 1. `backend/app/refresh_pipeline/orchestrator.py`: Build a unified `RefreshPipelineOrchestrator` that executes Quantitative Ingestion -> Quant Recalculation -> Media Scraping -> LLM Structured Extraction -> DB Snapshot Commit.
> 2. `backend/app/refresh_pipeline/synthesizer.py`: Update extraction to parse live author telemetry, verbatim quotes, bullish/bearish tickers, and cross-framework contradictions into `intelligence_deltas`.
> 3. `backend/app/api/routes.py`: Update `GET /api/v1/synthesis/dashboard` to query the latest `intelligence_deltas` and `regime_snapshots` from the database, falling back to live quant engines if the database is unpopulated.
> 4. `frontend/src/app/synthesis/page.tsx`: Connect to the live endpoint, display live scraping provenance badges, and subscribe to the global refresh event.
> 5. Ensure `npm run build` succeeds with zero errors.

---

## 1. Unified Pipeline Orchestrator: `backend/app/refresh_pipeline/orchestrator.py`

Create `backend/app/refresh_pipeline/orchestrator.py` to unify all ingestion, calculations, and scraping into an atomic execution sequence:

```python
"""
backend/app/refresh_pipeline/orchestrator.py
Central Unified Orchestrator for MacroPulse Alpha:
Stage 1: Parallel Open-Data Ingestion (FRED, Treasury, Market, FCTE)
Stage 2: Deterministic Quant Recalculation (Quads, Nowcasts, VAMS, Risk Ranges)
Stage 3: Multi-Source Media Scraper & LLM Synthesis
Stage 4: Atomic DB Snapshot & Event Broadcast
"""

import logging
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.db_models import MacroSeries, MarketDaily, RegimeSnapshot, IntelligenceDelta
from app.ingestion.fred_client import FredClient
from app.ingestion.treasury_client import TreasuryClient
from app.ingestion.market_options_client import MarketOptionsClient
from app.ingestion.etf_holdings_client import EtfHoldingsClient
from app.quant_engine.macro_nowcast import (
    compute_growth_nowcast,
    compute_inflation_nowcast,
    compute_quads_and_base_effects,
)
from app.quant_engine.liquidity_engine import compute_us_net_liquidity, compute_global_liquidity_and_debt_ratios
from app.quant_engine.forty_two_macro_engine import FortyTwoMacroEngine
from app.refresh_pipeline.media_scraper import MediaScraper
from app.refresh_pipeline.synthesizer import LLMStrategySynthesizer

logger = logging.getLogger("macropulse.orchestrator")


class RefreshPipelineOrchestrator:
    @classmethod
    async def run_full_refresh(cls, db: Session) -> dict:
        """Executes the 4-stage pipeline sequentially and commits an atomic snapshot."""
        logger.info("[Pipeline] Starting Stage 1: Market & Macro Ingestion...")
        # 1. Ingestion
        try:
            FredClient().ingest_all_series(db, limit_records=60)
            TreasuryClient().ingest_treasury_data(db)
            MarketOptionsClient().ingest_market_data(db, days_back=60)
            EtfHoldingsClient().ingest_holdings(db)
        except Exception as e:
            logger.warning(f"[Pipeline] Ingestion warning (non-fatal): {e}")

        logger.info("[Pipeline] Starting Stage 2: Quant Engine Recalculation...")
        # 2. Recompute Deterministic Quant Models
        growth = compute_growth_nowcast()
        inflation = compute_inflation_nowcast()
        quads = compute_quads_and_base_effects(
            growth_series=growth.get("real_gdp_yoy", 2.1),
            inflation_series=inflation.get("headline_cpi_nowcast_yoy", 2.6)
        )
        us_liq = compute_us_net_liquidity(db=db)
        glob_liq = compute_global_liquidity_and_debt_ratios()

        current_quad = quads.get("current_quad", "Quad 3")
        grid_matrix = FortyTwoMacroEngine.compute_global_macro_risk_matrix(
            {"GOLDILOCKS": 10, "REFLATION": 14, "INFLATION": 16, "DEFLATION": 29}
            if "3" in current_quad
            else {"GOLDILOCKS": 18, "REFLATION": 30, "INFLATION": 19, "DEFLATION": 2}
        )
        grid_regime = grid_matrix.get("active_regime_label", "DEFLATION" if "3" in current_quad else "REFLATION")

        # Record atomic RegimeSnapshot
        snapshot = RegimeSnapshot(
            date=datetime.now(timezone.utc).date(),
            us_monthly_quad=current_quad,
            us_quarterly_quad=quads.get("forward_1q_quad", "Quad 4"),
            quad_1_prob=quads.get("quad_probabilities", {}).get("Q1", 0.1),
            quad_2_prob=quads.get("quad_probabilities", {}).get("Q2", 0.2),
            quad_3_prob=quads.get("quad_probabilities", {}).get("Q3", 0.5),
            quad_4_prob=quads.get("quad_probabilities", {}).get("Q4", 0.2),
            grid_regime=grid_regime,
            grid_scores_json=json.dumps(grid_matrix.get("confirming_sums", {})),
            net_liquidity_usd_bn=us_liq.get("net_liquidity_usd_bn", 5742.0),
            global_liquidity_usd_tn=glob_liq.get("global_liquidity_usd_tn", 106.4),
            debt_to_liquidity_pct=glob_liq.get("debt_to_liquidity_pct", 114.0)
        )
        db.merge(snapshot)
        db.commit()

        logger.info("[Pipeline] Starting Stage 3: Media Scraping & LLM Synthesis...")
        # 3. Scrape Media & Synthesize
        quant_ground_truth = {
            "us_monthly_quad": current_quad,
            "grid_regime": grid_regime,
            "net_liquidity_usd_bn": us_liq.get("net_liquidity_usd_bn", 5742.0),
            "real_gdp_yoy": growth.get("real_gdp_yoy", 2.1),
            "headline_cpi": inflation.get("headline_cpi_nowcast_yoy", 2.6)
        }

        scraper = MediaScraper()
        raw_sweep = scraper.scrape_curated_institutional_sources()
        synthesizer = LLMStrategySynthesizer()
        batch_output = synthesizer.synthesize(raw_sweep, quant_ground_truth)

        # 4. Commit Structured Intelligence Deltas to DB
        logger.info("[Pipeline] Starting Stage 4: Persisting Intelligence Deltas...")
        for author in batch_output.authors:
            delta = IntelligenceDelta(
                timestamp_utc=datetime.now(timezone.utc),
                framework_author=f"{author.author_name} ({author.firm})",
                source_type="LIVE_SCRAPED_SYNTHESIS",
                source_title=f"{author.author_name}: {author.stated_quad_or_regime or grid_regime}",
                source_url=author.source_url or "[https://macropulse-alpha.dev](https://macropulse-alpha.dev)",
                published_at=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                summary_markdown=author.key_verbatim_quote or "",
                extracted_json=author.model_dump_json(),
                affected_tickers=", ".join(author.bullish_tickers + author.bearish_tickers)
            )
            db.add(delta)
        db.commit()

        return {
            "status": "success",
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "regime": current_quad,
            "grid": grid_regime,
            "authors_updated": len(batch_output.authors),
            "what_changed": batch_output.what_changed_summary_markdown
        }
		
2. Dynamic Synthesis Endpoint: backend/app/api/routes.py
Update GET /api/v1/synthesis/dashboard to query stored intelligence_deltas first, merging scraped qualitative data with quantitative telemetry:
# In backend/app/api/routes.py

@api_router.get("/v1/synthesis/dashboard")
def get_synthesis_dashboard(db: Session = Depends(get_db)):
    """
    Returns the synthesized multi-framework dossier.
    Prefers recent intelligence_deltas generated by web scraping and LLM extraction,
    merging with live deterministic quant models.
    """
    from datetime import datetime, timezone
    from sqlalchemy import desc
    from app.models.db_models import RegimeSnapshot, IntelligenceDelta, MacroSeries
    from app.quant_engine.macro_nowcast import (
        compute_growth_nowcast,
        compute_inflation_nowcast,
        compute_quads_and_base_effects,
    )
    from app.quant_engine.liquidity_engine import (
        compute_us_net_liquidity,
        compute_global_liquidity_and_debt_ratios,
        compute_bond_stress_and_accord_trigger,
    )

    # 1. Resolve Ground Truth Regime
    latest_snapshot = db.query(RegimeSnapshot).order_by(desc(RegimeSnapshot.date)).first()
    growth = get_growth_nowcast(db)
    inflation = get_inflation_nowcast(db)
    quads = compute_quads_and_base_effects(
        growth_series=growth.get("real_gdp_yoy", 2.1),
        inflation_series=inflation.get("headline_cpi_nowcast_yoy", 2.6)
    )
    current_quad = (
        latest_snapshot.us_monthly_quad
        if (latest_snapshot and latest_snapshot.us_monthly_quad)
        else quads.get("current_quad", "Quad 3")
    )
    grid_regime = (
        latest_snapshot.grid_regime
        if (latest_snapshot and latest_snapshot.grid_regime)
        else ("DEFLATION" if "3" in current_quad else "REFLATION")
    )

    # 2. Fetch Latest Scraped Deltas for Each of the 4 Framework Leads
    authors_config = [
        {"name": "Keith McCullough", "firm": "Hedgeye", "id": "km", "avatarGradient": "from-cyan-600 to-blue-700", "badgeColor": "border-cyan-500/50 text-cyan-400 bg-cyan-950/40"},
        {"name": "Darius Dale", "firm": "42 Macro", "id": "dd", "avatarGradient": "from-emerald-600 to-teal-700", "badgeColor": "border-emerald-500/50 text-emerald-400 bg-emerald-950/40"},
        {"name": "Aahan Menon", "firm": "Prometheus", "id": "am", "avatarGradient": "from-amber-600 to-orange-700", "badgeColor": "border-amber-500/50 text-amber-400 bg-amber-950/40"},
        {"name": "Warren Pies", "firm": "3Fourteen", "id": "wp", "avatarGradient": "from-indigo-600 to-purple-700", "badgeColor": "border-indigo-500/50 text-indigo-400 bg-indigo-950/40"},
    ]

    framework_cards = []
    for cfg in authors_config:
        # Search DB for the most recent scraped delta for this author
        recent_delta = (
            db.query(IntelligenceDelta)
            .filter(IntelligenceDelta.framework_author.contains(cfg["name"]))
            .order_by(desc(IntelligenceDelta.timestamp_utc))
            .first()
        )

        extracted = {}
        if recent_delta and recent_delta.extracted_json:
            try:
                extracted = json.loads(recent_delta.extracted_json)
            except Exception:
                extracted = {}

        # Merge extracted scraping fields with quantitative baseline
        stated_regime = extracted.get("stated_quad_or_regime") or (grid_regime if cfg["name"] == "Darius Dale" else current_quad)
        growth_call = extracted.get("growth_view") or f"Real GDP tracking {growth.get('real_gdp_nowcast_annualized', 2.1)}% YoY"
        inflation_call = extracted.get("inflation_view") or f"Headline CPI Nowcast: {inflation.get('headline_cpi_nowcast_yoy', 2.78)}%"
        policy_view = extracted.get("policy_liquidity_view") or "Monitoring Fed-Treasury Accord 2.0 triggers and liquidity runoff."
        quote = extracted.get("key_verbatim_quote") or recent_delta.summary_markdown if recent_delta else "Signal to Quad: Adapt asset allocation dynamically as data confirms trend pivots."
        bullish = extracted.get("bullish_tickers") or (["$VT", "$GLDM", "$USFR"] if "3" in current_quad else ["$SPY", "$QQQ", "$GLD"])
        bearish = extracted.get("bearish_tickers") or ["$TLT", "$HYG"]
        source_url = extracted.get("source_url") or getattr(recent_delta, "source_url", "[https://macropulse-alpha.dev](https://macropulse-alpha.dev)")

        framework_cards.append({
            "id": cfg["id"],
            "author": cfg["name"],
            "firm": cfg["firm"],
            "badgeColor": cfg["badgeColor"],
            "avatarGradient": cfg["avatarGradient"],
            "statedRegime": stated_regime,
            "growthCall": growth_call,
            "growthDetail": f"Quantitative momentum z-score: {growth.get('growth_momentum_z', 0):+.2f}σ.",
            "inflationCall": inflation_call,
            "inflationDetail": f"Demand-driven component: {inflation.get('demand_vs_supply_split', {}).get('demand_pct', 72)}%.",
            "liquidityView": policy_view,
            "liquidityDetail": f"Global liquidity ratio at {latest_snapshot.debt_to_liquidity_pct if latest_snapshot else 114:.0f}%.",
            "bullishTickers": [f"${t.replace('$', '')}" for t in bullish],
            "bearishTickers": [f"${t.replace('$', '')}" for t in bearish],
            "quote": quote,
            "badgeLabel": "LIVE WEB SCRAPE + LLM" if recent_delta else "DETERMINISTIC QUANT",
            "url": source_url,
            "lastScraped": recent_delta.timestamp_utc.strftime("%b %d, %H:%M UTC") if recent_delta else "Live Stream"
        })

    # Contradiction cards driven by active regime
    contradictions = [
        {
            "id": "c1",
            "title": "Contradiction 1: Secular Bond Bear vs. Cyclical Duration Hedge",
            "dispute": f"Hedgeye ({current_quad}) and 42 Macro ({grid_regime}) are structurally short duration ($TLT), while Prometheus analog and 3Fourteen Fair Value models indicate 10Y yields offer cyclical value.",
            "unifiedResolution": "Asymmetric Duration Barbell: Underweight long nominal Treasuries ($TLT) to avoid fiscal supply digestion, while overweighting floating rate cash ($USFR) and real TIPS ($TIP).",
            "status": "RESOLVED & SYSTEMATIZED",
            "statusColor": "text-emerald-400 bg-emerald-950/60 border-emerald-800"
        },
        {
            "id": "c2",
            "title": "Contradiction 2: Forward Base-Effect Quads vs. High-Frequency VAMS Momentum",
            "dispute": f"Hedgeye's 12-month base effects project forward transition to {quads.get('forward_1q_quad', 'Quad 4')}, whereas 42 Macro's daily VAMS shows Bullish Trend in defensive real assets.",
            "unifiedResolution": "Horizon Separation: Use multi-quarter base effects to cap equity leverage, while allowing daily VAMS and options GEX to trade tactical bounces until a confirmed trend pivot occurs.",
            "status": "RESOLVED & SYSTEMATIZED",
            "statusColor": "text-emerald-400 bg-emerald-950/60 border-emerald-800"
        }
    ]

    return {
        "as_of_utc": datetime.now(timezone.utc).isoformat(),
        "live_stream_label": f"US {current_quad} • 42M {grid_regime}",
        "frameworks": framework_cards,
        "contradictions": contradictions
    }
	
3. Trigger Endpoint Wiring: backend/app/api/routes.py
Connect POST /api/v1/refresh/trigger so clicking Refresh Data runs the orchestrator:

# In backend/app/api/routes.py

@api_router.post("/v1/refresh/trigger")
async def trigger_full_refresh(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Triggers the full 4-stage pipeline in the background."""
    from app.refresh_pipeline.orchestrator import RefreshPipelineOrchestrator
    
    background_tasks.add_task(RefreshPipelineOrchestrator.run_full_refresh, db)
    return {
        "status": "started",
        "message": "Full 4-Stage Refresh Pipeline initiated in background.",
        "timestamp_utc": datetime.now(timezone.utc).isoformat()
    }
	
	4. Frontend Dynamic Rendering: frontend/src/app/synthesis/page.tsx
Ensure /synthesis updates reactively when the global refresh is triggered:

// Inside frontend/src/app/synthesis/page.tsx

useEffect(() => {
  fetchSynthesisData();

  const handleGlobalRefresh = () => {
    // Re-query the synthesis endpoint immediately when the user clicks Refresh Data
    fetchSynthesisData();
  };

  window.addEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
  return () => window.removeEventListener("macro-nowcast-global-refresh", handleGlobalRefresh);
}, []);

Run npm run build in frontend/ to confirm zero build errors.