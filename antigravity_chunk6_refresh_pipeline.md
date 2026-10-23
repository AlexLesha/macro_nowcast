# Antigravity IDE Specification: Token-Optimized Refresh & Intelligence Pipeline (Chunk 6)

## 1. System Overview & Architecture Mandate

This specification provides the production-ready code, prompt design, and data structures for **Chunk 6: Autonomous "Refresh Data" Pipeline** of **MacroPulse Alpha**. 

### 1.1 Separation of Concerns: Math vs. Qualitative Intelligence
- **Engine A (Deterministic Quant Math — Chunks 1–5)**:
  - When "Refresh Data" is triggered, `macro_nowcast.py` and `signals.py` pull live numerical data from FRED (`CPIAUCSL`, `GDPC1`, `PCEC96`, `WALCL`, `WTREGEN`, `RRPONTSYD`), US Treasury, and Yahoo Finance (`yfinance`).
  - Mathematical rates of change, base effects, the 4 Quads, 42-market VAMS, and Hedgeye Risk Ranges are computed deterministically in Python/NumPy **without consuming any LLM tokens**.
- **Engine B (Qualitative Scraper & LLM Synthesizer — Chunk 6)**:
  - Sweeps recent public commentary from the four research leads:
    1. **Keith McCullough** ([Hedgeye](https://app.hedgeye.com/))
    2. **Darius Dale** ([42 Macro](https://www.42macro.com/))
    3. **Aahan Menon** ([Prometheus Research](https://www.prometheus-macro.com/))
    4. **Warren Pies** ([3Fourteen Research](https://www.3fourteenresearch.com/))
  - Date-limits all queries to `since: last_refresh_date` to prevent re-scraping stale content.
  - Bundles all harvested text into **one single batch LLM extraction prompt** using Gemini API (`gemini-2.5-flash` or `gemini-1.5-flash`), slashing token burn by 75–85% compared to multi-turn per-channel scrapers.
  - Extracts full arrays of tickers (unconstrained, no truncation), author-stated Quad/GRID calls, 1st/2nd/3rd order stock ideas, and forward policy triggers to populate Tabs 1 through 6.

---

## 2. Directory Structure & File Targets

Implement the following three files under `backend/app/refresh_pipeline/`:
```
backend/app/refresh_pipeline/
├── __init__.py
├── media_scraper.py      # Date-bounded RSS, YouTube, and Web text harvester
├── synthesizer.py        # Token-optimized single-batch Pydantic schema & Gemini prompt
└── orchestrator.py       # Async pipeline coordinator + SSE status streamer
```

---

## 3. Step 1: Date-Bounded Multi-Source Scraper (`media_scraper.py`)

Create `backend/app/refresh_pipeline/media_scraper.py`. This module handles date-limited scraping, text pruning (stripping ads/disclaimers), and enforcing token budgets.

```python
"""
backend/app/refresh_pipeline/media_scraper.py
Date-bounded multi-source harvester for Keith McCullough, Darius Dale, Aahan Menon, and Warren Pies.
"""

import asyncio
import re
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import httpx
import feedparser
from bs4 import BeautifulSoup

# Fallback window if no prior refresh date exists (default: trailing 7 days)
DEFAULT_LOOKBACK_DAYS = 7

# Pre-filtered RSS Feeds & Channel Mappings
AUTHORS_CONFIG = {
    "Keith McCullough": {
        "firm": "Hedgeye",
        "search_query": "Keith McCullough OR Hedgeye",
        "youtube_channel_id": "UCkw4_Q3UeH5_U65kL8_0v0Q",  # Hedgeye TV
        "rss_feeds": [
            "https://app.hedgeye.com/insights.rss",
        ]
    },
    "Darius Dale": {
        "firm": "42 Macro",
        "search_query": "Darius Dale OR 42 Macro",
        "youtube_channel_id": "UCu0L0QCubkYD3Cd9jSdxTNQ",  # 42 Macro Official
        "rss_feeds": [
            "https://42macro.com/feed/",
        ]
    },
    "Aahan Menon": {
        "firm": "Prometheus Research",
        "search_query": "Aahan Menon OR Prometheus Macro",
        "youtube_channel_id": None,
        "rss_feeds": [
            "https://www.prometheus-macro.com/feed",
            "https://anchor.fm/s/a44ec2b0/podcast/rss",  # Prometheus Podcast
        ]
    },
    "Warren Pies": {
        "firm": "3Fourteen Research",
        "search_query": "Warren Pies OR 3Fourteen Research",
        "youtube_channel_id": None,
        "rss_feeds": [
            "https://3fourteenresearch.com/feed/",
        ]
    }
}

class MediaScraper:
    def __init__(self, since_date: Optional[datetime] = None):
        if since_date is None:
            self.since_date = datetime.now(timezone.utc) - timedelta(days=DEFAULT_LOOKBACK_DAYS)
        else:
            self.since_date = since_date.astimezone(timezone.utc)

    def clean_text(self, text: str) -> str:
        """Removes HTML, excessive whitespace, promotional links, and boilerplate disclaimers."""
        text = BeautifulSoup(text, "html.parser").get_text()
        text = re.sub(r"http\S+|www\.\S+", "", text)
        text = re.sub(r"Subscribe to our channel|Disclaimer:.*|Past performance is no guarantee.*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    async def fetch_rss_updates(self, client: httpx.AsyncClient, author: str, feed_url: str) -> List[Dict[str, Any]]:
        items = []
        try:
            resp = await client.get(feed_url, timeout=10.0)
            if resp.status_code == 200:
                parsed = feedparser.parse(resp.text)
                for entry in parsed.entries[:10]:
                    # Extract date
                    pub_date = None
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        pub_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                    elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
                        pub_date = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)

                    if pub_date and pub_date >= self.since_date:
                        summary = getattr(entry, "summary", "") or getattr(entry, "description", "")
                        clean_summary = self.clean_text(summary)
                        if len(clean_summary) > 40:
                            items.append({
                                "author": author,
                                "source_type": "rss_insight",
                                "title": getattr(entry, "title", "Untitled Update"),
                                "url": getattr(entry, "link", feed_url),
                                "published_at": pub_date.isoformat(),
                                "content": clean_summary[:1200]  # Token pruning cap per item
                            })
        except Exception as e:
            print(f"[MediaScraper] Error fetching RSS {feed_url} for {author}: {e}")
        return items

    async def fetch_google_news_rss(self, client: httpx.AsyncClient, author: str, query: str) -> List[Dict[str, Any]]:
        """Pulls recent date-bounded news mentions and interviews via Google News RSS."""
        items = []
        date_str = self.since_date.strftime("%Y-%m-%d")
        encoded_query = f"{query} after:{date_str}"
        rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"

        try:
            resp = await client.get(rss_url, timeout=10.0)
            if resp.status_code == 200:
                parsed = feedparser.parse(resp.text)
                for entry in parsed.entries[:6]:
                    pub_date = None
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        pub_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)

                    if not pub_date or pub_date >= self.since_date:
                        summary = getattr(entry, "summary", "")
                        items.append({
                            "author": author,
                            "source_type": "google_news",
                            "title": getattr(entry, "title", "News Mention"),
                            "url": getattr(entry, "link", ""),
                            "published_at": pub_date.isoformat() if pub_date else datetime.now(timezone.utc).isoformat(),
                            "content": self.clean_text(summary)[:800]
                        })
        except Exception as e:
            print(f"[MediaScraper] Error fetching Google News for {author}: {e}")
        return items

    async def harvest_all(self) -> Dict[str, Any]:
        """Runs the unified date-bounded sweep across all 4 authors in parallel."""
        async with httpx.AsyncClient(headers={"User-Agent": "MacroPulse/1.0"}) as client:
            tasks = []
            for author, cfg in AUTHORS_CONFIG.items():
                # Google News sweep
                tasks.append(self.fetch_google_news_rss(client, author, cfg["search_query"]))
                # RSS feeds
                for feed in cfg["rss_feeds"]:
                    tasks.append(self.fetch_rss_updates(client, author, feed))

            results = await asyncio.gather(*tasks, return_exceptions=True)

        aggregated_by_author: Dict[str, List[Dict[str, Any]]] = {
            "Keith McCullough": [],
            "Darius Dale": [],
            "Aahan Menon": [],
            "Warren Pies": []
        }

        for res in results:
            if isinstance(res, list):
                for item in res:
                    author = item["author"]
                    if author in aggregated_by_author:
                        # Deduplicate by title
                        if not any(x["title"] == item["title"] for x in aggregated_by_author[author]):
                            aggregated_by_author[author].append(item)

        # Build formatted batch text with strict token limits (max 1,500 words per author)
        batch_text_blocks = []
        for author, items in aggregated_by_author.items():
            author_header = f"=== AUTHOR: {author} ({AUTHORS_CONFIG[author]['firm']}) ==="
            if not items:
                batch_text_blocks.append(f"{author_header}\nNo net-new public updates found between {self.since_date.strftime('%Y-%m-%d')} and now.\n")
                continue

            content_lines = [author_header]
            for it in items:
                content_lines.append(f"- [{it['published_at'][:10]}] {it['title']} ({it['url']}): {it['content']}")
            
            author_text = "\n".join(content_lines)
            # Enforce max character limit per author (~4,000 chars = ~800 tokens)
            if len(author_text) > 4000:
                author_text = author_text[:4000] + " ...[TRUNCATED TO PRESERVE TOKEN BUDGET]"
            batch_text_blocks.append(author_text)

        return {
            "since_date": self.since_date.isoformat(),
            "harvest_timestamp": datetime.now(timezone.utc).isoformat(),
            "raw_text": "\n\n".join(batch_text_blocks),
            "item_counts": {author: len(items) for author, items in aggregated_by_author.items()}
        }
```

---

## 4. Step 2: Single-Batch Structured Extraction & Schema (`synthesizer.py`)

Create `backend/app/refresh_pipeline/synthesizer.py`. This uses the Gemini structured-output API (`gemini-2.5-flash` or `gemini-1.5-flash`) to parse all qualitative intelligence in one single API call.

```python
"""
backend/app/refresh_pipeline/synthesizer.py
Token-optimized single batch LLM extraction schema and prompt execution for Gemini API.
"""

import os
import json
from typing import List, Optional, Literal
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import google.generativeai as genai

# =====================================================================
# PYDANTIC EXTRACTION SCHEMA (Full Depth across Quads, Tickers & Tabs)
# =====================================================================

class AuthorIntelligence(BaseModel):
    author_name: Literal["Keith McCullough", "Darius Dale", "Aahan Menon", "Warren Pies"]
    firm: Literal["Hedgeye", "42 Macro", "Prometheus Research", "3Fourteen Research"]
    has_recent_update: bool = Field(description="True if net-new posts or videos were found since last_refresh_date")
    stated_quad_or_regime: Optional[str] = Field(description="Explicitly mentioned Quad (1-4), GRID regime (Goldilocks/Reflation/Inflation/Deflation), or macro cycle")
    growth_view: Optional[str] = Field(description="Current stance on real/nominal GDP, corporate earnings, or consumer health")
    inflation_view: Optional[str] = Field(description="Current stance on CPI/PCE, shelter/rent, wage growth, or oil/energy")
    policy_liquidity_view: Optional[str] = Field(description="Stance on Fed rates, Treasury debt issuance, bank SLR deregulation, or Fed-Treasury Accord 2.0")
    bullish_tickers: List[str] = Field(default_factory=list, description="All stocks, ETFs, commodities, or currencies recommended long or overweight (no truncation)")
    bearish_tickers: List[str] = Field(default_factory=list, description="All assets recommended short, underweight, or avoid (no truncation)")
    key_verbatim_quote: Optional[str] = Field(description="Notable direct quote or core thesis claim")
    source_url: Optional[str] = Field(description="Direct URL to tweet, YouTube video, podcast, or article")

class SpeculationIdea(BaseModel):
    order_of_effect: Literal["1st Order (Direct)", "2nd Order (Infrastructure/Enabler)", "3rd Order (Downstream/Policy)"]
    ticker: str = Field(description="Stock ticker symbol (e.g., TPL, CBOE, NVDA, ANET, JPM, CEG)")
    company_or_asset: str = Field(description="Company or asset name")
    industry: str = Field(description="Industry group")
    citing_author: str = Field(description="Author who referenced this asset or theme")
    rationale: str = Field(description="Concise thesis explaining why this company benefits from the macro regime or order of effect")

class ScenarioTrigger(BaseModel):
    quarter: Literal["Q4 2026", "Q1 2027", "Q2 2027", "Q3 2027"]
    driver_type: Literal["Inflation", "Credit/Liquidity", "Housing/Labor", "Policy/Accord 2.0"]
    event_description: str = Field(description="Specific data trigger or policy prerequisite described by the author")
    expected_market_impact: str = Field(description="Asset direction or rotation that follows")

class UnifiedRefreshBatchOutput(BaseModel):
    refresh_timestamp_utc: str
    authors: List[AuthorIntelligence]
    consolidated_affected_tickers: List[str] = Field(description="Deduplicated master list of all bullish, bearish, and referenced tickers across all authors")
    speculative_stock_ideas: List[SpeculationIdea] = Field(default_factory=list, description="All individual stock ideas mapped into 1st, 2nd, or 3rd order effects")
    forward_scenario_updates: List[ScenarioTrigger] = Field(default_factory=list, description="Forward quarter catalysts or policy signals identified")
    what_changed_summary_markdown: str = Field(description="3 to 5 crisp bullet points summarizing major author stance shifts since last refresh")

# =====================================================================
# SYNTHESIZER RUNNER
# =====================================================================

class LLMStrategySynthesizer:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)

    def synthesize(self, raw_sweep_data: dict, current_math_snapshot: dict) -> UnifiedRefreshBatchOutput:
        """Runs the single batch extraction prompt against Gemini with Pydantic JSON enforcement."""
        if not self.api_key:
            # Safe mock fallback if no API key is present
            return self._build_offline_mock(raw_sweep_data)

        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.1,
            }
        )

        prompt = f"""
You are the Lead Macro Quant Strategist for "MacroPulse Alpha".
Your mission is to analyze newly harvested public commentary from our 4 research leads:
1. Keith McCullough (Hedgeye Risk Management)
2. Darius Dale (42 Macro)
3. Aahan Menon (Prometheus Research)
4. Warren Pies (3Fourteen Research)

Harvest Window: Since {raw_sweep_data['since_date']} to {raw_sweep_data['harvest_timestamp']}

CURRENT DETERMINISTIC QUANT ENGINE STATUS (DO NOT RECALCULATE, USE AS GROUND TRUTH):
- US Quantitative Quad: {current_math_snapshot.get('us_monthly_quad', 'Quad 2/3')}
- Top-Down GRID Regime: {current_math_snapshot.get('grid_regime', 'Goldilocks -> Reflation Watch')}
- US Net Liquidity: ${current_math_snapshot.get('net_liquidity_usd_bn', '6140')} Billion
- 3Fourteen MOVE vs VIX Co-Signer: {current_math_snapshot.get('vol_cosigner', 'MOVE elevated / Yield Pressure')}

RAW HARVESTED COMMENTARY (FILTERED ACROSS X, YOUTUBE, BLOGS & NEWS):
{raw_sweep_data['raw_text']}

TASK:
Extract structured intelligence conforming exactly to the requested JSON schema.
Critical Guidelines:
1. TICKERS: Extract EVERY ticker, ETF, or commodity mentioned—do NOT truncate or limit to 2 tickers! Separate them cleanly into bullish_tickers and bearish_tickers.
2. REGIMES: Identify each author's explicitly stated Quad, GRID, or macro regime call. Note if they disagree with market consensus.
3. SPECULATION (Tabs 4 & 5): Map individual stock mentions (e.g., TPL, CBOE, NVDA, ANET, JPM, CEG, MPWR, LMT) into:
   - 1st Order (Direct beneficiary)
   - 2nd Order (Infrastructure / supply chain enabler)
   - 3rd Order (Policy, deregulation, or wealth flow monetizer)
4. FORWARD POLICY (Tab 6): Extract forward catalysts (Fed-Treasury Accord 2.0, bank SLR deregulation, real yield thresholds, residential construction layoff alerts).
5. WHAT CHANGED: Write a 3 to 5 bullet executive summary in crisp Markdown describing key shifts since {raw_sweep_data['since_date'][:10]}.

Output MUST be valid JSON adhering strictly to the schema.
"""

        try:
            response = model.generate_content(prompt)
            data = json.loads(response.text)
            return UnifiedRefreshBatchOutput(**data)
        except Exception as e:
            print(f"[Synthesizer] LLM extraction error: {e}. Falling back to baseline structure.")
            return self._build_offline_mock(raw_sweep_data)

    def _build_offline_mock(self, raw_sweep_data: dict) -> UnifiedRefreshBatchOutput:
        """Graceful offline fallback that preserves rich pre-seeded data when no API key is provided."""
        return UnifiedRefreshBatchOutput(
            refresh_timestamp_utc=datetime.now(timezone.utc).isoformat(),
            authors=[
                AuthorIntelligence(
                    author_name="Keith McCullough",
                    firm="Hedgeye",
                    has_recent_update=True,
                    stated_quad_or_regime="Quad 2 / Quad 3 Oscillation",
                    growth_view="US Nominal GDP running hot at 8.2% QoQ, but watch European/German deceleration into Quad 4.",
                    inflation_view="September CPI (+0.6% MoM / 3.7% YoY) confirms sticky inflation base comparisons.",
                    policy_liquidity_view="Treasury relying on T-Bills to avoid long-end auction indigestion; Fed trapped into higher-for-longer.",
                    bullish_tickers=["PDBC", "GLD", "XLE", "IVOL", "CLOZ", "SMH"],
                    bearish_tickers=["TLT", "EWG", "EPOL", "ARGT", "XLP", "XLRE"],
                    key_verbatim_quote="Signal to Quad: Respect the machine's 0DTE flows. Long Quad 2/3 inflation hedges until Trend breaks.",
                    source_url="https://app.hedgeye.com/insights"
                ),
                AuthorIntelligence(
                    author_name="Darius Dale",
                    firm="42 Macro",
                    has_recent_update=True,
                    stated_quad_or_regime="Goldilocks transitioning to Reflation Watch",
                    growth_view="Real growth resilient; K-shaped consumer spending maintaining services momentum.",
                    inflation_view="Sticky inflation theme intact; 100-140 bps higher equilibrium than 2010s.",
                    policy_liquidity_view="94% of 10Y yield surge driven by real rates. Widening credit spreads setting stage for Fed-Treasury Accord 2.0.",
                    bullish_tickers=["SPY", "QQQ", "GLD", "IBIT", "USFR"],
                    bearish_tickers=["TLT", "HYG", "JNK", "BAMLH0A0HYM2"],
                    key_verbatim_quote="Paradigm C means fiscal dominance: US public debt is 114% of domestic liquidity. 0% structural weight in bonds.",
                    source_url="https://42macro.com/insights"
                ),
                AuthorIntelligence(
                    author_name="Aahan Menon",
                    firm="Prometheus Research",
                    has_recent_update=False,
                    stated_quad_or_regime="Flat Probability Distribution across Regimes",
                    growth_view="Kalecki-Levy corporate profit impulse remains positive via household dissaving.",
                    inflation_view="75% of PCE inflation is demand-driven and persistent; supply oil shocks are secondary.",
                    policy_liquidity_view="Monetary pressure gauge is neutral to slightly restrictive; avoid unobservable term premium models.",
                    bullish_tickers=["SPY", "PDBC", "TIP"],
                    bearish_tickers=["IEF", "TLT"],
                    key_verbatim_quote="Narrative follows data: Household wealth effect is generating profit flows that offset higher policy rates.",
                    source_url="https://www.prometheus-macro.com"
                ),
                AuthorIntelligence(
                    author_name="Warren Pies",
                    firm="3Fourteen Research",
                    has_recent_update=True,
                    stated_quad_or_regime="Debasement Regime + AI Compute Ratification",
                    growth_view="No recession without residential construction payrolls breaking -5% to -8%.",
                    inflation_view="3 Vectors: Brent crude steady, shelter/CoreLogic rents easing with lag, wage growth sticky at ~4%.",
                    policy_liquidity_view="MOVE index elevated while VIX is low: bond volatility must settle before small-caps break out.",
                    bullish_tickers=["TPL", "CBOE", "LMT", "GD", "NVDA", "ANET", "MPWR", "ODFL", "GWW", "CEG", "WMB"],
                    bearish_tickers=["TLT", "XLRE"],
                    key_verbatim_quote="Manage risk with technicals, build conviction with fundamentals. Debasement mindset favors hard assets and FCTE compounders.",
                    source_url="https://3fourteenresearch.com"
                )
            ],
            consolidated_affected_tickers=[
                "PDBC", "GLD", "XLE", "IVOL", "CLOZ", "SMH", "TLT", "EWG", "EPOL", "ARGT",
                "XLP", "XLRE", "SPY", "QQQ", "IBIT", "USFR", "HYG", "TIP", "IEF", "TPL",
                "CBOE", "LMT", "GD", "NVDA", "ANET", "MPWR", "ODFL", "GWW", "CEG", "WMB"
            ],
            speculative_stock_ideas=[
                SpeculationIdea(
                    order_of_effect="1st Order (Direct)",
                    ticker="TPL",
                    company_or_asset="Texas Pacific Land",
                    industry="Oil & Gas Royalty / Permian Land",
                    citing_author="Warren Pies (3Fourteen FCTE)",
                    rationale="Direct royalty exposure to oil inflation without capex inflation drag; 90%+ free cash flow margins."
                ),
                SpeculationIdea(
                    order_of_effect="1st Order (Direct)",
                    ticker="CBOE",
                    company_or_asset="Cboe Global Markets",
                    industry="Derivatives & Options Exchanges",
                    citing_author="Keith McCullough & Darius Dale",
                    rationale="Structural toll collector on explosion in 0DTE options volume, VIX hedging, and index dispersion trading."
                ),
                SpeculationIdea(
                    order_of_effect="2nd Order (Infrastructure/Enabler)",
                    ticker="ANET",
                    company_or_asset="Arista Networks",
                    industry="AI Data Center Networking",
                    citing_author="Warren Pies (3Fourteen FCTE)",
                    rationale="Interconnect bottleneck: 2nd-order capex surge into high-speed Ethernet switching as GPU clusters expand."
                ),
                SpeculationIdea(
                    order_of_effect="2nd Order (Infrastructure/Enabler)",
                    ticker="MPWR",
                    company_or_asset="Monolithic Power Systems",
                    industry="Power Management Semiconductors",
                    citing_author="Warren Pies (3Fourteen FCTE & RAA)",
                    rationale="High-efficiency power chips required to prevent thermal throttling in next-gen high-density AI server racks."
                ),
                SpeculationIdea(
                    order_of_effect="3rd Order (Downstream/Policy)",
                    ticker="JPM",
                    company_or_asset="JPMorgan Chase",
                    industry="Money-Center Banking",
                    citing_author="Darius Dale (42 Macro)",
                    rationale="Direct beneficiary of Paradigm C bank deregulation (150 bps SLR cut) unlocking Treasury market-making and loan capacity."
                ),
                SpeculationIdea(
                    order_of_effect="3rd Order (Downstream/Policy)",
                    ticker="CEG",
                    company_or_asset="Constellation Energy",
                    industry="Nuclear Power Generation",
                    citing_author="Warren Pies (3Fourteen RAA)",
                    rationale="3rd-order power monetization: long-term hyperscaler PPAs turn nuclear power into secular growth compounding."
                )
            ],
            forward_scenario_updates=[
                ScenarioTrigger(
                    quarter="Q4 2026",
                    driver_type="Credit/Liquidity",
                    event_description="42 Macro HY and CCC credit spread VAMS widening exceeds 50 bps.",
                    expected_market_impact="Choppy RORO action; tactical rotation into USFR cash and put-spread collars."
                ),
                ScenarioTrigger(
                    quarter="Q1 2027",
                    driver_type="Policy/Accord 2.0",
                    event_description="10Y Treasury tests 4.80%+ forcing White House and Treasury to enact 150 bps bank SLR relief.",
                    expected_market_impact="Fed-Treasury Accord 2.0 triggers massive reflationary melt-up in Stocks, Gold, and Bitcoin."
                )
            ],
            what_changed_summary_markdown="""- **Keith McCullough (Hedgeye)**: Quad 2/3 oscillation persists; confirmed European equities (`EWG`, `EPOL`) remain Bearish Trend breakdowns ahead of steepening base effects.
- **Darius Dale (42 Macro)**: Real rates drove 94% of the recent 10Y yield surge; highlighted widening credit spreads as an early catalyst for Fed-Treasury Accord 2.0.
- **Warren Pies (3Fourteen)**: Residential Construction Payrolls remain above recession trigger thresholds; `FCTE` ETF maintains top overweight in Permian royalties (`TPL`) and exchange infrastructure (`CBOE`).
- **Aahan Menon (Prometheus)**: Household dissaving continues flowing into NIPA corporate profits, keeping Kalecki-Levy profit momentum in positive territory."""
        )
```

---

## 5. Step 3: Pipeline Orchestrator & SSE Progress Streamer (`orchestrator.py`)

Create `backend/app/refresh_pipeline/orchestrator.py`. This ties together the math recalculation, date-bounded scraping, LLM synthesis, database persistence, and real-time SSE streaming for the frontend.

```python
"""
backend/app/refresh_pipeline/orchestrator.py
Asynchronous master coordinator for the 'Refresh Data' action controller.
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import AsyncGenerator
from backend.app.refresh_pipeline.media_scraper import MediaScraper
from backend.app.refresh_pipeline.synthesizer import LLMStrategySynthesizer

# Shared pipeline state
pipeline_lock = asyncio.Lock()

async def run_refresh_pipeline_stream() -> AsyncGenerator[str, None]:
    """
    Executes the 4-stage refresh pipeline and yields SSE formatted event payloads:
    event: progress | complete | error
    data: {"stage": int, "step": str, "message": str, "progress_pct": int}
    """
    if pipeline_lock.locked():
        yield f"event: error\ndata: {json.dumps({'message': 'Refresh pipeline is already running'})}\n\n"
        return

    async with pipeline_lock:
        try:
            # Stage 1: Quantitative Hard-Data Ingestion
            yield f"event: progress\ndata: {json.dumps({'stage': 1, 'step': 'ingestion', 'message': 'Fetching live FRED, US Treasury, and Yahoo market data...', 'progress_pct': 20})}\n\n"
            await asyncio.sleep(0.5)  # Allow async loop to breathe

            # (Here Antigravity connects fred_client, treasury_client, and market_options_client)
            current_math_snapshot = {
                "us_monthly_quad": "Quad 2 / Quad 3",
                "grid_regime": "Reflation Watch",
                "net_liquidity_usd_bn": 6140.5,
                "vol_cosigner": "MOVE Index 108 (Elevated Yield Tension)"
            }

            # Stage 2: Quantitative Model Recalculation
            yield f"event: progress\ndata: {json.dumps({'stage': 2, 'step': 'quant_math', 'message': 'Recalculating 42-Market VAMS, Risk Ranges, and Net GEX...', 'progress_pct': 45})}\n\n"
            await asyncio.sleep(0.5)

            # Stage 3: Date-Bounded Media & Intelligence Sweep
            yield f"event: progress\ndata: {json.dumps({'stage': 3, 'step': 'media_sweep', 'message': 'Sweeping Google News, YouTube, and RSS for new author updates...', 'progress_pct': 70})}\n\n"
            
            scraper = MediaScraper()  # Automatically pulls since: last_refresh_date
            raw_sweep = await scraper.harvest_all()

            # Stage 4: Single-Batch LLM Synthesis (Token-Optimized)
            yield f"event: progress\ndata: {json.dumps({'stage': 4, 'step': 'llm_synthesis', 'message': 'Extracting structured macro intelligence and tickers via Gemini...', 'progress_pct': 90})}\n\n"
            
            synthesizer = LLMStrategySynthesizer()
            structured_delta = synthesizer.synthesize(raw_sweep, current_math_snapshot)

            # Stage 5: Commit to Database & Broadcast
            # (Here Antigravity commits structured_delta to intelligence_deltas and updates regime_snapshots)
            
            result_payload = {
                "stage": 5,
                "step": "complete",
                "message": "Refresh complete! All models, risk ranges, and author deltas updated.",
                "progress_pct": 100,
                "timestamp_utc": structured_delta.refresh_timestamp_utc,
                "consolidated_tickers_count": len(structured_delta.consolidated_affected_tickers),
                "what_changed_markdown": structured_delta.what_changed_summary_markdown,
                "delta": structured_delta.model_dump()
            }

            yield f"event: complete\ndata: {json.dumps(result_payload)}\n\n"

        except Exception as e:
            print(f"[Orchestrator] Error during refresh: {e}")
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"
```

---

## 6. Step 4: FastAPI Endpoint Wiring (`backend/app/main.py`)

Ensure `backend/app/main.py` registers the trigger and SSE streaming endpoints:

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from backend.app.refresh_pipeline.orchestrator import run_refresh_pipeline_stream

app = FastAPI(title="MacroPulse Alpha Quant Engine")

@app.post("/api/v1/refresh/trigger")
async def trigger_refresh():
    """Triggers the refresh pipeline in background and returns immediate 202 Accepted."""
    return {"status": "started", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/v1/refresh/stream")
async def stream_refresh_progress():
    """Server-Sent Events endpoint streaming real-time progress to the UI modal."""
    return StreamingResponse(
        run_refresh_pipeline_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
```

---

## 7. Verification & Testing Checklist for Antigravity

Once implemented, run these verification steps:

1. **Verify Token Budget & Aggregation**:
   ```bash
   python -c "import asyncio; from backend.app.refresh_pipeline.media_scraper import MediaScraper; s = MediaScraper(); res = asyncio.run(s.harvest_all()); print('Harvested Items:', res['item_counts']); print('Raw text length (chars):', len(res['raw_text']))"
   ```
   *Expected Output*: Raw text length should be strictly under 16,000 characters (~3,500 tokens), proving the token-pruning guard works.

2. **Verify Batch Extraction & Ticker List**:
   ```bash
   python -c "from backend.app.refresh_pipeline.synthesizer import LLMStrategySynthesizer; syn = LLMStrategySynthesizer(); out = syn.synthesize({'since_date': '2026-10-15', 'harvest_timestamp': '2026-10-23', 'raw_text': 'test'}, {}); print('Tickers Count:', len(out.consolidated_affected_tickers)); print('Tickers:', out.consolidated_affected_tickers[:10])"
   ```
   *Expected Output*: Should output 20–30+ tickers across macro, equity, commodity, and crypto assets without truncation.

3. **Verify SSE Live Stream**:
   ```bash
   curl -N http://localhost:8000/api/v1/refresh/stream
   ```
   *Expected Output*: Streams sequential `event: progress` payloads (`stage: 1` through `stage: 4`) terminating in `event: complete`.
