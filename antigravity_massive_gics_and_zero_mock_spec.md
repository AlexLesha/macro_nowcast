# Antigravity Task: Zero-Hardcoding, Database-Driven GICS Classification & Massive REST API Migration

> **Antigravity Execution Directive:**
> Read below instructions and implement the complete overhaul across:
> 1. `backend/app/models/db_models.py` and `backend/app/models/gics_seed.py` (Add and seed the 77 GICS Industries database table).
> 2. `backend/app/quant_engine/stock_analyzer.py` (Remove ALL hardcoded tickers, preset profiles, dummy fallback values, and Polygon references. Use `MASSIVE_API_KEY` exclusively, resolve sectors/industries from the DB table, and return verbatim errors on failures).
> 3. `frontend/src/app/stock-analysis/page.tsx` (Remove `DEFAULT_STOCK_DATA` and hardcoded preset ticker lists. Surface verbatim error responses).
> 4. `frontend/src/app/sources-test/page.tsx` (Migrate Section 3 to Massive REST Financials v1 endpoints, and remove mock/fallback industry injections from Section 5).
> 5. Verify `npm run build` succeeds with zero errors.

---

## 1. Database Schema & Seeder: `gics_industries` (77 GICS Industries)

### A. Add `GicsIndustry` Model to `backend/app/models/db_models.py`

Add the following table definition to `backend/app/models/db_models.py`:

```python
class GicsIndustry(Base):
    """Stores the official GICS 4-level taxonomy (11 Sectors, 25 Industry Groups, 74/77 Industries)."""
    __tablename__ = "gics_industries"

    industry_code = Column(String(16), primary_key=True, index=True) # e.g. "453010", "601010"
    sector_name = Column(String(64), nullable=False, index=True)     # e.g. "Information Technology"
    industry_group_name = Column(String(64), nullable=False)        # e.g. "Semiconductors & Semiconductor Equipment"
    industry_name = Column(String(64), nullable=False, index=True)   # e.g. "Semiconductors"
    benchmark_etf = Column(String(16), nullable=True)               # e.g. "XLK", "XLRE", "XLE"
    sic_prefixes = Column(String(128), nullable=True)               # e.g. "6798" for REITs, "3674" for Semis

    def to_dict(self) -> Dict[str, Any]:
        return {
            "industry_code": self.industry_code,
            "sector": self.sector_name,
            "industry_group": self.industry_group_name,
            "industry": self.industry_name,
            "benchmark_etf": self.benchmark_etf,
        }
		
		B. Create Seeder Script: backend/app/models/gics_seed.py
Create backend/app/models/gics_seed.py to populate the 77 GICS industries into the DB during init_db():
"""
backend/app/models/gics_seed.py
Seeds all 77 GICS industries and benchmark sector ETFs into the database.
"""
from sqlalchemy.orm import Session
from app.models.db_models import GicsIndustry

GICS_77_DATA = [
    # Energy (Sector 10)
    ("101010", "Energy", "Energy", "Energy Equipment & Services", "XLE", "1381,1389"),
    ("101020", "Energy", "Energy", "Oil, Gas & Consumable Fuels", "XLE", "1311,2911,1221"),
    # Materials (Sector 15)
    ("151010", "Materials", "Materials", "Chemicals", "XLB", "2800,2810,2820"),
    ("151020", "Materials", "Materials", "Construction Materials", "XLB", "3241,3270"),
    ("151030", "Materials", "Materials", "Containers & Packaging", "XLB", "2650,3411"),
    ("151040", "Materials", "Materials", "Metals & Mining", "XLB", "1000,1040,3312"),
    ("151050", "Materials", "Materials", "Paper & Forest Products", "XLB", "2400,2600"),
    # Industrials (Sector 20)
    ("201010", "Industrials", "Capital Goods", "Aerospace & Defense", "XLI", "3720,3760"),
    ("201020", "Industrials", "Capital Goods", "Building Products", "XLI", "3200,3442"),
    ("201030", "Industrials", "Capital Goods", "Construction & Engineering", "XLI", "1500,1600"),
    ("201040", "Industrials", "Capital Goods", "Electrical Equipment", "XLI", "3612,3620"),
    ("201050", "Industrials", "Capital Goods", "Industrial Conglomerates", "XLI", "9997"),
    ("201060", "Industrials", "Capital Goods", "Machinery", "XLI", "3523,3531"),
    ("201070", "Industrials", "Capital Goods", "Trading Companies & Distributors", "XLI", "5000,5080"),
    ("202010", "Industrials", "Commercial & Professional Services", "Commercial Services & Supplies", "XLI", "7300,7340"),
    ("202020", "Industrials", "Commercial & Professional Services", "Professional Services", "XLI", "7361,7380"),
    ("203010", "Industrials", "Transportation", "Air Freight & Logistics", "XLI", "4513,4700"),
    ("203020", "Industrials", "Transportation", "Passenger Airlines", "XLI", "4512"),
    ("203030", "Industrials", "Transportation", "Marine Transportation", "XLI", "4400"),
    ("203040", "Industrials", "Transportation", "Ground Transportation", "XLI", "4011,4210"),
    ("203050", "Industrials", "Transportation", "Transportation Infrastructure", "XLI", "4724,4785"),
    # Consumer Discretionary (Sector 25)
    ("251010", "Consumer Discretionary", "Automobiles & Components", "Automobile Components", "XLY", "3714"),
    ("251020", "Consumer Discretionary", "Automobiles & Components", "Automobiles", "XLY", "3711"),
    ("252010", "Consumer Discretionary", "Consumer Durables & Apparel", "Household Durables", "XLY", "3630,3651"),
    ("252020", "Consumer Discretionary", "Consumer Durables & Apparel", "Leisure Products", "XLY", "3944,3949"),
    ("252030", "Consumer Discretionary", "Consumer Durables & Apparel", "Textiles, Apparel & Luxury Goods", "XLY", "2300,3100"),
    ("253010", "Consumer Discretionary", "Consumer Services", "Hotels, Restaurants & Leisure", "XLY", "7011,5812"),
    ("253020", "Consumer Discretionary", "Consumer Services", "Diversified Consumer Services", "XLY", "7200,8200"),
    ("255010", "Consumer Discretionary", "Consumer Discretionary Distribution & Retail", "Distributors", "XLY", "5010"),
    ("255020", "Consumer Discretionary", "Consumer Discretionary Distribution & Retail", "Broadline Retail", "XLY", "5311,5961"),
    ("255030", "Consumer Discretionary", "Consumer Discretionary Distribution & Retail", "Specialty Retail", "XLY", "5600,5700"),
    # Consumer Staples (Sector 30)
    ("301010", "Consumer Staples", "Consumer Staples Distribution & Retail", "Consumer Staples Distribution & Retail", "XLP", "5411,5140"),
    ("302010", "Consumer Staples", "Food, Beverage & Tobacco", "Beverages", "XLP", "2080,2086"),
    ("302020", "Consumer Staples", "Food, Beverage & Tobacco", "Food Products", "XLP", "2000,2020"),
    ("302030", "Consumer Staples", "Food, Beverage & Tobacco", "Tobacco", "XLP", "2111"),
    ("303010", "Consumer Staples", "Household & Personal Products", "Household Products", "XLP", "2840,2844"),
    ("303020", "Consumer Staples", "Household & Personal Products", "Personal Care Products", "XLP", "2844"),
    # Health Care (Sector 35)
    ("351010", "Health Care", "Health Care Equipment & Services", "Health Care Equipment & Supplies", "XLV", "3841,3842"),
    ("351020", "Health Care", "Health Care Equipment & Services", "Health Care Providers & Services", "XLV", "8000,8062"),
    ("351030", "Health Care", "Health Care Equipment & Services", "Health Care Technology", "XLV", "7373"),
    ("352010", "Health Care", "Pharmaceuticals, Biotechnology & Life Sciences", "Biotechnology", "XLV", "2836"),
    ("352020", "Health Care", "Pharmaceuticals, Biotechnology & Life Sciences", "Pharmaceuticals", "XLV", "2834"),
    ("352030", "Health Care", "Pharmaceuticals, Biotechnology & Life Sciences", "Life Sciences Tools & Services", "XLV", "3826"),
    # Financials (Sector 40)
    ("401010", "Financials", "Banks", "Banks", "XLF", "6020,6021,6022"),
    ("402010", "Financials", "Financial Services", "Financial Services", "XLF", "6199,6200"),
    ("402020", "Financials", "Financial Services", "Consumer Finance", "XLF", "6141"),
    ("402030", "Financials", "Financial Services", "Capital Markets", "XLF", "6211,6282"),
    ("402040", "Financials", "Financial Services", "Mortgage Real Estate Investment Trusts (REITs)", "XLF", "6798"),
    ("403010", "Financials", "Insurance", "Insurance", "XLF", "6311,6321,6331"),
    # Information Technology (Sector 45)
    ("451020", "Information Technology", "Software & Services", "IT Services", "XLK", "7370,7371"),
    ("451030", "Information Technology", "Software & Services", "Software", "XLK", "7372"),
    ("452010", "Information Technology", "Technology Hardware & Equipment", "Communications Equipment", "XLK", "3661,3663"),
    ("452020", "Information Technology", "Technology Hardware & Equipment", "Technology Hardware, Storage & Peripherals", "XLK", "3571,3572"),
    ("452030", "Information Technology", "Technology Hardware & Equipment", "Electronic Equipment, Instruments & Components", "XLK", "3670,3825"),
    ("453010", "Information Technology", "Semiconductors & Semiconductor Equipment", "Semiconductors", "XLK", "3674"),
    # Communication Services (Sector 50)
    ("501010", "Communication Services", "Telecommunication Services", "Diversified Telecommunication Services", "XLC", "4813"),
    ("501020", "Communication Services", "Telecommunication Services", "Wireless Telecommunication Services", "XLC", "4812"),
    ("502010", "Communication Services", "Media & Entertainment", "Media", "XLC", "2711,4832"),
    ("502020", "Communication Services", "Media & Entertainment", "Entertainment", "XLC", "7812,7900"),
    ("502030", "Communication Services", "Media & Entertainment", "Interactive Media & Services", "XLC", "7370,7374"),
    # Utilities (Sector 55)
    ("551010", "Utilities", "Utilities", "Electric Utilities", "XLU", "4911"),
    ("551020", "Utilities", "Utilities", "Gas Utilities", "XLU", "4922,4923"),
    ("551030", "Utilities", "Utilities", "Multi-Utilities", "XLU", "4931"),
    ("551040", "Utilities", "Utilities", "Water Utilities", "XLU", "4941"),
    ("551050", "Utilities", "Utilities", "Independent Power and Renewable Electricity Producers", "XLU", "4911,4991"),
    # Real Estate (Sector 60)
    ("601010", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Diversified REITs", "XLRE", "6798"),
    ("601025", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Industrial REITs", "XLRE", "6798"),
    ("601030", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Hotel & Resort REITs", "XLRE", "6798"),
    ("601040", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Office REITs", "XLRE", "6798"),
    ("601050", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Health Care REITs", "XLRE", "6798"),
    ("601060", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Residential REITs", "XLRE", "6798"),
    ("601070", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Retail REITs", "XLRE", "6798"),
    ("601080", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Specialized REITs", "XLRE", "6798"), # Covers Agricultural/Farmland REITs (e.g. LAND)
    ("602010", "Real Estate", "Real Estate Management & Development", "Real Estate Management & Development", "XLRE", "6500,6512"),
]

def seed_gics_industries(db: Session):
    """Inserts the official GICS taxonomy into the database if not present."""
    count = db.query(GicsIndustry).count()
    if count >= 70:
        return
    for code, sec, grp, ind, etf, sic in GICS_77_DATA:
        existing = db.query(GicsIndustry).filter_by(industry_code=code).first()
        if not existing:
            db.add(GicsIndustry(
                industry_code=code,
                sector_name=sec,
                industry_group_name=grp,
                industry_name=ind,
                benchmark_etf=etf,
                sic_prefixes=sic
            ))
    db.commit()
	
	Connect seed_gics_industries inside backend/app/db.py:
	
	def init_db():
    Base.metadata.create_all(bind=engine)
    from app.models.gics_seed import seed_gics_industries
    with SessionLocal() as db:
        seed_gics_industries(db)
		
		
		2. Backend Overhaul: backend/app/quant_engine/stock_analyzer.py
Rewrite the stock analyzer to:

Accept any user ticker dynamically (never reference hardcoded tickers).

Fetch company reference metadata using MASSIVE_API_KEY.

Match the SIC / Industry against the gics_industries database table.

Fetch 12 quarters of statements from Massive (/stocks/financials/v1/*), with SEC EDGAR as a secondary fallback.

Never hallucinate or substitute fake data: Return clean error payloads if data is unavailable.

"""
backend/app/quant_engine/stock_analyzer.py
Dynamic, Database-Backed GICS Single-Stock Engine with Massive REST API.
Zero Hardcoded Tickers, Zero Hallucinated Fallbacks.
"""

import os
import logging
import httpx
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import yfinance as yf

from app.models.db_models import GicsIndustry
from app.quant_engine.forty_two_macro_engine import FortyTwoMacroEngine

logger = logging.getLogger("macropulse.stock_analyzer")

MASSIVE_BASE_URL = "[https://api.massive.com](https://api.massive.com)"
MASSIVE_API_KEY = os.getenv("MASSIVE_API_KEY")

SEC_EDGAR_HEADERS = {
    "User-Agent": "MacroPulseAlpha/2.0 (quant-engine@macropulse-alpha.dev)",
    "Accept-Encoding": "gzip, deflate",
    "Accept": "application/json",
}

class SingleStockXRayEngine:
    _CIK_MAP_CACHE: Dict[str, str] = {}

    @classmethod
    def resolve_industry_from_db(cls, db: Session, sic_code: Optional[str], raw_industry: Optional[str]) -> Dict[str, str]:
        """Resolves Sector, Industry, and Benchmark ETF directly from the DB gics_industries table."""
        # 1. Match by SIC code if available
        if sic_code:
            clean_sic = str(sic_code).strip()
            all_inds = db.query(GicsIndustry).all()
            for row in all_inds:
                if row.sic_prefixes:
                    prefixes = [p.strip() for p in row.sic_prefixes.split(",")]
                    if any(clean_sic.startswith(p) or p == clean_sic for p in prefixes):
                        return {
                            "sector": row.sector_name,
                            "industry": row.industry_name,
                            "industry_group": row.industry_group_name,
                            "benchmark_etf": row.benchmark_etf or "SPY"
                        }

        # 2. Match by industry name substring
        if raw_industry:
            match = db.query(GicsIndustry).filter(
                (GicsIndustry.industry_name.ilike(f"%{raw_industry}%")) |
                (GicsIndustry.industry_group_name.ilike(f"%{raw_industry}%"))
            ).first()
            if match:
                return {
                    "sector": match.sector_name,
                    "industry": match.industry_name,
                    "industry_group": match.industry_group_name,
                    "benchmark_etf": match.benchmark_etf or "SPY"
                }

        return {
            "sector": "Unclassified",
            "industry": raw_industry or "Unclassified Industry",
            "industry_group": "General",
            "benchmark_etf": "SPY"
        }

    @classmethod
    def fetch_company_overview(cls, db: Session, ticker: str) -> Dict[str, Any]:
        """Fetches metadata from Massive /v3/reference/tickers/{ticker}, resolving against gics_industries."""
        clean_t = ticker.strip().upper()
        if not MASSIVE_API_KEY:
            raise ValueError("MASSIVE_API_KEY is not configured in environment variables.")

        headers = {"Authorization": f"Bearer {MASSIVE_API_KEY}"}
        url = f"{MASSIVE_BASE_URL}/v3/reference/tickers/{clean_t}"

        with httpx.Client(timeout=8.0) as client:
            resp = client.get(url, headers=headers)
            if resp.status_code == 404:
                raise ValueError(f"Ticker '{clean_t}' not found in Massive API database.")
            elif resp.status_code in (401, 403):
                raise PermissionError(f"Massive API access denied (HTTP {resp.status_code}). Check MASSIVE_API_KEY entitlement.")
            elif resp.status_code != 200:
                raise RuntimeError(f"Massive API returned HTTP {resp.status_code}: {resp.text}")

            data = resp.json().get("results", {})
            sic_code = data.get("sic_code")
            sic_desc = data.get("sic_description")
            
            # Resolve against the database
            gics = cls.resolve_industry_from_db(db, sic_code=sic_code, raw_industry=sic_desc)
            mcap = data.get("market_cap")

            return {
                "ticker": clean_t,
                "company_name": data.get("name", clean_t),
                "sector": gics["sector"],
                "industry": gics["industry"],
                "industry_group": gics["industry_group"],
                "benchmark_etf": gics["benchmark_etf"],
                "market_cap_bn": round(mcap / 1e9, 2) if mcap else None,
                "cik": str(data.get("cik", "")).zfill(10) if data.get("cik") else None,
                "source": "MASSIVE_V3_REFERENCE"
            }

    @classmethod
    def fetch_12q_financials(cls, ticker: str, cik: Optional[str]) -> List[Dict[str, Any]]:
        """Pulls 12 consecutive quarters from Massive /stocks/financials/v1/*; falls back to SEC EDGAR facts."""
        clean_t = ticker.strip().upper()
        headers = {"Authorization": f"Bearer {MASSIVE_API_KEY}"}
        params = {"tickers": clean_t, "timeframe": "quarterly", "limit": 12, "sort": "period_end.desc"}

        quarters = []
        try:
            with httpx.Client(timeout=8.0) as client:
                r_inc = client.get(f"{MASSIVE_BASE_URL}/stocks/financials/v1/income-statements", headers=headers, params=params)
                r_bal = client.get(f"{MASSIVE_BASE_URL}/stocks/financials/v1/balance-sheets", headers=headers, params=params)
                r_cf = client.get(f"{MASSIVE_BASE_URL}/stocks/financials/v1/cash-flow-statements", headers=headers, params=params)

                if r_inc.status_code == 200 and r_bal.status_code == 200 and r_cf.status_code == 200:
                    inc_res = r_inc.json().get("results", [])
                    bal_res = {r["period_end"]: r for r in r_bal.json().get("results", [])}
                    cf_res = {r["period_end"]: r for r in r_cf.json().get("results", [])}

                    for inc in inc_res:
                        p_end = inc.get("period_end")
                        b = bal_res.get(p_end, {})
                        c = cf_res.get(p_end, {})

                        rev = float(inc.get("revenue") or 0.0)
                        gp = float(inc.get("gross_profit") or 0.0)
                        oi = float(inc.get("operating_income") or 0.0)
                        ni = float(inc.get("consolidated_net_income_loss") or inc.get("net_income_loss_attributable_common_shareholders") or 0.0)
                        ocf = float(c.get("net_cash_from_operating_activities") or 0.0)
                        capex = abs(float(c.get("capital_expenditures") or 0.0))
                        cash = float(b.get("cash_and_equivalents") or 0.0)
                        debt = float(b.get("debt_current") or 0.0) + float(b.get("long_term_debt") or 0.0)
                        cl = float(b.get("total_current_liabilities") or 0.0)

                        quarters.append({
                            "period_end": p_end,
                            "fiscal_label": f"{inc.get('fiscal_year', '')} Q{inc.get('fiscal_quarter', '')}".strip(),
                            "form": "10-Q" if inc.get("fiscal_quarter") else "10-K",
                            "revenue": rev,
                            "gross_profit": gp,
                            "gross_margin_pct": round(gp / rev * 100.0, 2) if rev > 0 else 0.0,
                            "operating_income": oi,
                            "operating_margin_pct": round(oi / rev * 100.0, 2) if rev > 0 else 0.0,
                            "net_income": ni,
                            "ocf": ocf,
                            "capex": capex,
                            "fcf": ocf - capex,
                            "cash_and_equiv": cash,
                            "total_debt": debt,
                            "net_debt": debt - cash,
                            "quick_ratio": round(cash / cl, 2) if cl > 0 else None
                        })
                    if quarters:
                        return quarters
        except Exception as e:
            logger.warning(f"Massive financials fetch failed for {clean_t}: {e}")

        # Fallback to SEC EDGAR if Massive fundamentals are un-entitled or empty
        if cik:
            return cls.fetch_sec_edgar_12q_facts(clean_t, cik)
        return []

    @classmethod
    def analyze_ticker(cls, db: Session, ticker: str, active_market_regime: str, active_economic_quad: str) -> Dict[str, Any]:
        """Analyzes any user-supplied ticker dynamically. Zero mock fallbacks."""
        clean_t = ticker.strip().upper()

        # 1. Fetch Company Overview (Massive -> GICS DB Resolution)
        overview = cls.fetch_company_overview(db, clean_t)

        # 2. Fetch 12Q Statements
        financials = cls.fetch_12q_financials(clean_t, overview.get("cik"))

        # 3. Live Price & Market Numbers (Strictly verified)
        tk = yf.Ticker(clean_t)
        try:
            hist = tk.history(period="1y", interval="1d", auto_adjust=True)
            if hist.empty:
                raise ValueError(f"No price history found for ticker '{clean_t}'.")
            curr_px = round(float(hist["Close"].iloc[-1]), 2)
            prev_px = float(hist["Close"].iloc[-2]) if len(hist) > 1 else curr_px
            px_chg_pct = round(((curr_px - prev_px) / prev_px) * 100.0, 2)
            vams_data = FortyTwoMacroEngine.compute_vams_and_probable_range(hist["Close"])
        except Exception as e:
            raise RuntimeError(f"Market price fetch error for '{clean_t}': {str(e)}")

        info = getattr(tk, "info", {}) or {}
        mcap = overview.get("market_cap_bn") or (round(info.get("marketCap") / 1e9, 2) if info.get("marketCap") else None)
        ev = round(info.get("enterpriseValue") / 1e9, 2) if info.get("enterpriseValue") else None
        fwd_pe = round(float(info.get("forwardPE")), 1) if info.get("forwardPE") else None

        return {
            "status": "ok",
            "ticker": clean_t,
            "company_name": overview.get("company_name"),
            "gics_sector": overview.get("sector"),
            "gics_industry": overview.get("industry"),
            "benchmark_etf": overview.get("benchmark_etf"),
            "market_cap_bn": mcap,
            "enterprise_value_bn": ev,
            "forward_pe": fwd_pe,
            "live_price": curr_px,
            "price_change_pct": px_chg_pct,
            "active_market_regime": active_market_regime,
            "active_economic_quad": active_economic_quad,
            "vams_and_probable_range": vams_data,
            "financial_walk_12q": financials,
            "cik": overview.get("cik")
        }
		
		3. Frontend Zero-Mock Overhaul: frontend/src/app/stock-analysis/page.tsx
Eliminate DEFAULT_STOCK_DATA and preset ticker buttons. If the backend returns an error or 404, display the exact error banner:

// Inside frontend/src/app/stock-analysis/page.tsx

export default function StockAnalysisPage() {
  const [tickerInput, setTickerInput] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const runAnalysis = async (ticker: string) => {
    if (!ticker) return;
    setIsLoading(true);
    setErrorDetails(null);
    setData(null); // Clear prior state immediately; no mock fallbacks

    try {
      const clean = ticker.trim().toUpperCase();
      const res = await fetch(`${API_BASE_URL}/api/v1/stock/analysis/${clean}`, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || json.status === "error") {
        throw new Error(json.message || `API error (${res.status}): Failed to retrieve analysis for ${clean}`);
      }
      setData(json);
    } catch (err: any) {
      setErrorDetails(err.message || "An unexpected error occurred while analyzing the ticker.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input (No Hardcoded Presets) */}
      <form onSubmit={(e) => { e.preventDefault(); runAnalysis(tickerInput); }} className="flex gap-2">
        <input
          type="text"
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
          placeholder="Enter any equity or ETF ticker (e.g. LAND, NVDA, CAT)..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-white focus:border-cyan-400 outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-mono text-sm font-semibold disabled:opacity-50"
        >
          {isLoading ? "Analyzing..." : "Analyze Stock"}
        </button>
      </form>

      {/* Verbatim Error Notification Banner */}
      {errorDetails && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-start gap-2.5">
          <span className="text-rose-400 font-bold text-sm">✕ Error:</span>
          <span className="leading-relaxed">{errorDetails}</span>
        </div>
      )}

      {/* Render Results Only When Data Successfully Fetched */}
      {data && (
        <div className="space-y-6">
          {/* Header Strip */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap gap-3 font-mono text-xs">
            <div>GICS: <strong className="text-white">{data.gics_sector}</strong> • <span className="text-slate-400">{data.gics_industry}</span></div>
            <div>PRICE: <strong className="text-cyan-300">${data.live_price}</strong> ({data.price_change_pct}%)</div>
            <div>MKT CAP: <strong>{data.market_cap_bn != null ? `$${data.market_cap_bn}B` : "N/A"}</strong></div>
            <div>EV: <strong>{data.enterprise_value_bn != null ? `$${data.enterprise_value_bn}B` : "N/A"}</strong></div>
            <div>FWD P/E: <strong>{data.forward_pe != null ? `${data.forward_pe}x` : "N/A"}</strong></div>
          </div>
          {/* Section 2: 12-Quarter Walk & Section 3: Peer Scorecard */}
        </div>
      )}
    </div>
  );
}

4. Benchmark Overhaul: frontend/src/app/sources-test/page.tsx
Update Section 3 to test Massive REST API directly, and eliminate mock fallback injections from Section 5:

// Inside frontend/src/app/sources-test/page.tsx

// Section 3: Massive REST API Financials Test
async function testMassiveFinancials(ticker: string) {
  const apiKey = process.env.NEXT_PUBLIC_MASSIVE_API_KEY || "";
  if (!apiKey) {
    return { status: "error", message: "MASSIVE_API_KEY is not defined in client environment." };
  }
  const url = `[https://api.massive.com/stocks/financials/v1/income-statements?tickers=$](https://api.massive.com/stocks/financials/v1/income-statements?tickers=$){ticker}&limit=4&sort=period_end.desc&apiKey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    return {
      status: "error",
      http_status: res.status,
      message: `Massive API returned HTTP ${res.status} (${res.statusText})`
    };
  }
  const json = await res.json();
  return { status: "ok", results: json.results || [] };
}

// Section 5: Yahoo Finance Live Probe (Zero Dummy Fallback)
async function testYahooSession(ticker: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/stock/analysis/${ticker}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    return { status: "error", message: err.message || `Upstream fetch failed (${res.status})` };
  }
  return await res.json();
}

5. Verification Checklist
Database Seeding Verification:

Restart backend. Verify table gics_industries exists and has >= 70 records.

$LAND Ticker Test:

In /stock-analysis or /sources-test, search for LAND.

Verify Sector: Real Estate.

Verify Industry: Equity Real Estate Investment Trusts (REITs) or Specialized REITs.

Verify CIK: 0001495240.

Verify Market Cap: ~$0.3B–$0.4B (never $55.3B).

Verify Forward P/E: Actual value or N/A (never 18.8x).

Invalid Ticker Test:

Search for XYZNONEXISTENT.

Confirm the UI displays: ✕ Error: Ticker 'XYZNONEXISTENT' not found in Massive API database.

Ensure no fallback NVDA or Semiconductor metrics are rendered.

Build Verification:

Execute npm run build in frontend/. Confirm 0 errors.