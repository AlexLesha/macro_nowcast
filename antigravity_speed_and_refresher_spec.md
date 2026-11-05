# Antigravity IDE Specification: Production Speed Fixes & Multi-Cadence Refresher

> **Copy-Paste Prompt for Antigravity IDE:**
> *"Read `antigravity_speed_and_refresher_spec.md`, `benchmark_etf_cache.py`, `stock_compressed_store.py`, and `scheduled_refresher.py`. Implement all four production techniques and the adaptive refresher:
> 1. **Technique 1 & 3 (Pre-Cache & Warm Benchmarks)**: Wire `BenchmarkETFCacheManager` into `main.py`'s `lifespan` startup hook so all 26 Sector/Style ETFs are cached in memory on boot. Update `stock_analyzer.py` to use `BenchmarkETFCacheManager.get_benchmark_closes()`, eliminating the 4.5-second `yf.download()` on every stock search.
> 2. **Technique 2 (Two-Stage Stale-While-Revalidate UI)**: Update `frontend/src/app/stock-analysis/page.tsx` with two-stage loading. Stage 1 renders cached headers, solvency, and 12Q visualizer in <50ms. If data is stale, Stage 2 completes in the background without freezing the UI.
> 3. **Technique 4 (Compressed Store)**: Integrate `StockCompressedStore` in `backend/app/quant_engine/stock_llm_analyzer.py` to persist and retrieve full 12Q XBRL statements and dossiers via a single primary key lookup (<10ms).
> 4. **Multi-Cadence Refresher**: Expose `/api/v1/refresher/trigger?routine={daily|weekly|monthly}` in `routes.py`, automatically detecting earnings season windows (April/May, July/August, October/November, January/February) for accelerated filing updates."*

---

## 1. Architectural Blueprint: The 4 Production Speed Techniques

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PRODUCTION SPEED PIPELINE (< 200ms Target Response)                                   │
├──────────────────────────────┬─────────────────────────────────────────────────────────┤
│ Technique 1: ETF Pre-Cache   │ 26 Sector/Style ETFs pre-warmed in memory (Saves ~4.5s) │
├──────────────────────────────┼─────────────────────────────────────────────────────────┤
│ Technique 2: SWR UI Loading  │ Stage 1: Cached view in <50ms; Stage 2: Background sync│
├──────────────────────────────┼─────────────────────────────────────────────────────────┤
│ Technique 3: DB Pre-Warming  │ 77 GICS industry peers loaded into RAM on startup (0ms) │
├──────────────────────────────┼─────────────────────────────────────────────────────────┤
│ Technique 4: Compressed Store│ 12Q XBRL payload stored as compressed JSON blob (<10ms) │
└──────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion Cadences: Normal vs. Earnings Season

| Cadence Loop | Frequency | What Gets Updated | Trigger Condition |
| :--- | :--- | :--- | :--- |
| **Fast Loop** | Daily (or 2x weekly) | Earnings Season Scanner & Quotes | Active during US Earnings Windows (Oct 10 - Nov 25, Jan 15 - Mar 1, Apr 10 - May 25, Jul 10 - Aug 25) |
| **Medium Loop** | Weekly (Saturday 02:00 UTC) | 77 GICS Industry Benchmark Peer Ratios | Standard weekly cron across 385 benchmark peers |
| **Slow Loop** | Monthly (1st of Month) | 12-Quarter Historical Statements | Recalibrates full 10-Q/10-K balance sheet histories |
| **Sector LLM Loop** | Monthly (Every 30 Days) | Sector Moats & Regulatory Frameworks | Re-generates industry-wide structural moat commentary |

---

## 3. Backend Wiring Instructions

### Step 1: Pre-Warm Benchmarks on Backend Startup (`backend/app/main.py`)
In `backend/app/main.py`, update the `lifespan` context manager:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from backend.app.quant_engine.benchmark_etf_cache import BenchmarkETFCacheManager
from backend.app.db.stock_compressed_store import StockCompressedStore

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize compressed tables
    StockCompressedStore.init_tables()
    
    # 2. Pre-warm the 26 Benchmark ETFs in memory
    await BenchmarkETFCacheManager.warm_cache()
    
    yield
```

### Step 2: Use Pre-Warmed Closes in `SingleStockXRayEngine` (`stock_analyzer.py`)
In `backend/app/quant_engine/stock_analyzer.py`, replace the heavy `yf.download(26 tickers)` block:

```python
from backend.app.quant_engine.benchmark_etf_cache import BenchmarkETFCacheManager

# In SingleStockXRayEngine.analyze_ticker():
bench_closes = BenchmarkETFCacheManager.get_benchmark_closes()

if bench_closes.empty:
    # Fallback to single batch download if not warmed
    bench_closes = await BenchmarkETFCacheManager.warm_cache()

# Download ONLY the single target stock
target_px = yf.download(clean_ticker, period="2y", interval="1d", progress=False, auto_adjust=True)
close_df = bench_closes.copy()
close_df[clean_ticker] = target_px["Close"] if "Close" in target_px else target_px
```

### Step 3: Fast Cache Lookup in `StockLLMAnalyzer` (`stock_llm_analyzer.py`)
In `backend/app/quant_engine/stock_llm_analyzer.py`:

```python
from backend.app.db.stock_compressed_store import StockCompressedStore

# At start of StockLLMAnalyzer.analyze_stock():
if not force_refresh:
    cached_payload = StockCompressedStore.get_stock_payload(clean_ticker)
    if cached_payload:
        return cached_payload

# Run full live analysis once...
result = await cls._execute_live_analysis(...)

# Persist compressed snapshot for instant repeat visits
StockCompressedStore.save_stock_payload(clean_ticker, gics_industry, result)
return result
```

---

## 4. Frontend Wiring: Two-Stage SWR Loading (`page.tsx`)

In `frontend/src/app/stock-analysis/page.tsx`:

```tsx
// 1. Read cached payload immediately on search (<50ms)
const fetchAnalysisFast = async (symbol: string) => {
  setLoading(true);
  try {
    // Stage 1: Load cached snapshot
    const res = await fetch(`${apiBase}/api/v1/stock/analyze?ticker=${symbol}&cached=true`);
    if (res.ok) {
      const cachedData = await res.json();
      setData(cachedData);
      setLoading(false); // UI unblocks immediately!
      
      // Stage 2: If data is older than 7 days, trigger background revalidation
      if (cachedData.is_stale) {
        setIsRevalidating(true);
        fetch(`${apiBase}/api/v1/stock/analyze?ticker=${symbol}&force=true`)
          .then(r => r.json())
          .then(freshData => {
            setData(freshData);
            setIsRevalidating(false);
          });
      }
    }
  } catch (err) {
    console.error(err);
    setLoading(false);
  }
};
```

---

## 5. Verification Protocol

1. **Verify Startup Pre-Warming:** Start the backend. Observe in server logs: `[BenchmarkCache] Successfully pre-warmed 26 ETFs`.
2. **Verify Load Speed:** Open `/stock-analysis` and search `ENPH`. Check Chrome DevTools Network tab:
   * First lookup with warm cache: **~2.8s** (down from 11s).
   * Second lookup for `ENPH`: **< 30ms** (served from compressed store).
3. **Verify Refresher Route:** Call `POST /api/v1/refresher/trigger?routine=daily`. Confirm that during October/November it outputs `is_earnings_season: true`.
