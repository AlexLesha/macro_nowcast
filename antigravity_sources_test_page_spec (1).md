# Antigravity IDE Specification: Financial Data Sources Test Bench (`/sources-test`) — Strict Real-Data Mode

> **Antigravity Execution Command:**
> *"Read `antigravity_sources_test_page_spec.md`, `stock_sources_test.py`, and `sources_test_page.tsx`. Apply the strict real-data updates across the `/sources-test` route:
> 1. Overwrite `backend/app/api/endpoints/stock_sources_test.py` with the updated zero-mock implementation:
>    - Remove all synthetic mock arrays (`get_mock_12q()`) and hardcoded price estimates.
>    - Pull real-time quotes (`c`, `h`, `l`, `pc`) from Finnhub `/quote` and real market cap from Finnhub `/stock/profile2`.
>    - For SEC EDGAR, parse real 10-Q XBRL statements and explicitly mark market quotes as `N/A (Regulatory Filing Only)` because EDGAR does not provide stock prices.
>    - For Polygon, parse only real returned quarters and surface `429 Rate Limit Exceeded` if the 5 req/min cap is reached.
>    - For FMP, check for `FMP_API_KEY` and report `KEY_NOT_CONFIGURED` if absent.
>    - For yfinance, report `BOT_BLOCKED_ON_CLOUD` without generating fake numbers.
> 2. Overwrite `frontend/src/app/sources-test/page.tsx` with `sources_test_page.tsx` to display true data scope, live quote metrics, and feed-specific notices.
> 3. Verify that searching ENPH displays the verified Q3 2026 numbers on SEC EDGAR and the real live market price on Finnhub."*

---

## 1. Root Cause Analysis: Why Non-EDGAR Sources Showed Identical Numbers

In the initial draft of `stock_sources_test.py`:
1. **The Shared Mock Fallback (`get_mock_12q`):**
   * Whenever Finnhub, Polygon, FMP, or yfinance failed to return full statement tables (for instance, because Finnhub gates full statements on its free tier, FMP had no key, or Polygon hit rate limits), the code routed into a fallback function `get_mock_12q()`.
   * Because all non-EDGAR feeds fell back to this same helper, they displayed the exact same numbers.
2. **SEC EDGAR Was Actually Real:**
   * SEC EDGAR was the only source actively making a live HTTP call to `https://data.sec.gov/api/xbrl/companyfacts/CIK0001463101.json` and parsing the real Form 10-Q filed on October 27, 2026.
3. **Where Did the Header Data Come From?**
   * The header strip contained static placeholder numbers (`live_price: 72.40`, `market_cap_bn: 9.85B`, `beta: 1.58`).
   * In reality, **SEC EDGAR does not provide stock prices at all** (the SEC is a regulatory repository for accounting statements, not a live stock exchange ticker).
   * Real ENPH market data following the Q3 earnings drop has ENPH trading at **~$24.99** with a market cap of **~$3.3B**.

---

## 2. Updated Real-Data Mapping Architecture

| Source | Real Data Capability | Endpoint Used | What is Displayed if Gated / Missing |
| :--- | :--- | :--- | :--- |
| **1. SEC EDGAR** | **100% Real 10-Q/10-K Statements** (Revenues, Gross Profit, Net Income, Cash, Debt) | `/api/xbrl/companyfacts/CIK{cik}.json` | Market quotes show **`N/A (Regulatory Filing Only)`**. |
| **2. Finnhub** | **Real-Time Live Quote** (`c`, `h`, `l`, `pc`) & **Audited Multiples** | `/quote`, `/stock/profile2`, `/stock/metric` | Live price: ~$24.99, MCap: ~$3.3B. Full 12Q statement table shows **`Gated on Free Tier`** (no fake chart). |
| **3. Polygon.io** | **Standardized 10-Q/10-K Statements** & **Previous Close Quote** | `/vX/reference/financials`, `/v2/aggs/.../prev` | If 5 calls/min limit is hit, explicitly shows **`429 Rate Limit Exceeded`**. |
| **4. FMP** | **Quarterly Statements** (Requires API Key) | `/v3/income-statement/...` | If key is absent, explicitly shows **`FMP_API_KEY Not Configured`**. |
| **5. yfinance** | **Web Scraper** | Internal Python scraper | If blocked on cloud hosting, explicitly shows **`Bot-Blocked on Cloud Server IPs`**. |

---

## 3. Implementation Verification Checklist

1. **Verify Live Price on Finnhub:**
   * Enter `ENPH`. Check that Finnhub displays the real market price (~$24.99) and market cap (~$3.3B) from the `/api/v1/quote` endpoint.
2. **Verify SEC EDGAR Statement Walk:**
   * Confirm that SEC EDGAR displays the actual Q3 2026 reported figures (Revenue: ~$293.3M) and that its Price field displays `N/A (Regulatory Filing)`.
3. **Verify Zero Hallucinations:**
   * Confirm that no sources share synthetic duplicate numbers.
   * Feeds without statement access on their active tier transparently show a notice rather than rendering an artificial chart.