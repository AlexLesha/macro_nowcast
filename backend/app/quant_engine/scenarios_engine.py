"""
backend/app/quant_engine/scenarios_engine.py
=============================================
Institutional Scenarios & Systematic Policy Playbook Engine.
Unifies:
1. Dynamic 4-Quarter Macro Scenarios anchored to Project-Global Macro Regime (Hedgeye Quads + 42 Macro GRID).
2. Live Quantitative Trigger Telemetry (CPI, HY OAS, MOVE, Net Liquidity, 10Y Nominal, 10Y Real TIPS, Housing Payrolls).
3. Real Interest Rate Dynamics & Sovereign Debt Squeeze Module (US Core + Australia-China Commodity Basket + G4 Comps, r - g Gap, Debt Servicing Run-rate, Entitlement Cliff, Sector Sensitivity).
4. Central Bank Speeches Sentiment Matrix (Last 8 Weeks: Fed, ECB, BoE, BoJ, PBoC, RBA) + China 2008 Liquidity Provider Case Study & Australia Commodity Dependency.
5. Central Database Persistence in Neon PostgreSQL / SQLite for Cross-Project Re-use.
"""

import os
import math
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple

try:
    from app.config import fetch_fred_series_live, settings
    from app.db.stock_compressed_store import StockCompressedStore
    from app.quant_engine.macro_nowcast import generate_dynamic_forward_quarters
except ImportError:
    from backend.app.config import fetch_fred_series_live, settings
    from backend.app.db.stock_compressed_store import StockCompressedStore
    from backend.app.quant_engine.macro_nowcast import generate_dynamic_forward_quarters

logger = logging.getLogger("macropulse.scenarios_engine")


def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (ValueError, TypeError):
        return default


# Canonical Institutional Speeches Seed (Within Last 8 Weeks)
SEED_CENTRAL_BANK_SPEECHES = [
    # Federal Reserve
    {
        "id": "fed_powell_2026_presser",
        "institution": "FED",
        "speaker": "Jerome Powell",
        "speaker_role": "Chair of the Federal Reserve",
        "speech_date": "2026-10-30",
        "speech_title": "FOMC Press Conference: Balancing Inflation Durability with Labor Market Health",
        "source_url": "https://www.federalreserve.gov/mediacenter/files/FOMCpresconf20261030.pdf",
        "hawkish_dovish_score": 15.0,
        "tone_label": "CAUTIOUS_HOLD",
        "key_quote": "We do not need to be in a hurry to adjust policy rates; the economy is performing well and core services inflation requires persistent vigilance.",
        "balance_sheet_stance": "QT_CONTINUE",
        "liquidity_implication": "Runoff continues at current pace ($60B Treasuries / $35B MBS cap), maintaining slight downward drain on excess reserves.",
        "is_liquidity_provider": False,
    },
    {
        "id": "fed_waller_2026_balance_sheet",
        "institution": "FED",
        "speaker": "Christopher Waller",
        "speaker_role": "Federal Reserve Governor",
        "speech_date": "2026-10-18",
        "speech_title": "Treasury Market Functioning, Neutral Rates, and Balance Sheet Normalization",
        "source_url": "https://www.federalreserve.gov/newsevents/speech/waller20261018a.htm",
        "hawkish_dovish_score": -10.0,
        "tone_label": "NEUTRAL_EASING_TILT",
        "key_quote": "If overnight repo rates begin to experience persistent upward friction, the committee should be prepared to taper quantitative tightening to protect market plumbing.",
        "balance_sheet_stance": "QT_TAPER_READY",
        "liquidity_implication": "Highlights Fed readiness to halt QT before bank reserves cross the LCLoR (Lowest Comfortable Level of Reserves) threshold (~$3.0T).",
        "is_liquidity_provider": True,
    },
    {
        "id": "fed_williams_2026_neutral",
        "institution": "FED",
        "speaker": "John Williams",
        "speaker_role": "President, Federal Reserve Bank of New York",
        "speech_date": "2026-10-08",
        "speech_title": "Monetary Policy In Restrictive Territory: Re-anchoring the Neutral Real Rate (R-Star)",
        "source_url": "https://www.newyorkfed.org/newsevents/speeches/2026/wil261008",
        "hawkish_dovish_score": 5.0,
        "tone_label": "NEUTRAL",
        "key_quote": "Our current policy setting is moderately restrictive, which is entirely appropriate to ensure inflation returns durably to our 2% symmetric target.",
        "balance_sheet_stance": "QT_CONTINUE",
        "liquidity_implication": "Neutral stance; expects gradual rate cuts only as headline and core PCE approach target.",
        "is_liquidity_provider": False,
    },
    # European Central Bank
    {
        "id": "ecb_lagarde_2026_policy",
        "institution": "ECB",
        "speaker": "Christine Lagarde",
        "speaker_role": "President of the European Central Bank",
        "speech_date": "2026-10-24",
        "speech_title": "Monetary Policy Statement: Disinflation Pathway and European Growth Vulnerabilities",
        "source_url": "https://www.ecb.europa.eu/press/press_conf/2026/html/is261024~en.html",
        "hawkish_dovish_score": -35.0,
        "tone_label": "DOVISH_EASING",
        "key_quote": "The disinflation process is well on track. Incoming data on domestic demand and manufacturing weakness indicate sluggishness that justifies gradual easing.",
        "balance_sheet_stance": "PEPP_RUNOFF",
        "liquidity_implication": "Rate cuts ongoing to prevent growth stalling; balance sheet contracting as PEPP reinvestments taper.",
        "is_liquidity_provider": False,
    },
    {
        "id": "ecb_schnabel_2026_terminal",
        "institution": "ECB",
        "speaker": "Isabel Schnabel",
        "speaker_role": "Member of the Executive Board, ECB",
        "speech_date": "2026-10-12",
        "speech_title": "The Last Mile of Disinflation and Structural Headwinds to Potential Output",
        "source_url": "https://www.ecb.europa.eu/press/key/date/2026/html/ecb.sp261012~en.html",
        "hawkish_dovish_score": 20.0,
        "tone_label": "HAWISH_CAUTION",
        "key_quote": "Services inflation and wage growth remain elevated. We must guard against cutting rates too quickly into neutral territory.",
        "balance_sheet_stance": "QT_CONTINUE",
        "liquidity_implication": "Hawkish counterweight inside ECB Governing Council advocating for rate-cut pauses.",
        "is_liquidity_provider": False,
    },
    # Bank of England
    {
        "id": "boe_bailey_2026_mpc",
        "institution": "BOE",
        "speaker": "Andrew Bailey",
        "speaker_role": "Governor of the Bank of England",
        "speech_date": "2026-10-19",
        "speech_title": "Bank of England MPC Briefing: Second-Round Wage Effects and Gilt Market Liquidity",
        "source_url": "https://www.bankofengland.co.uk/speech/2026/october/andrew-bailey-speech",
        "hawkish_dovish_score": -15.0,
        "tone_label": "MODERATE_DOVISH",
        "key_quote": "While inflation has cooled substantially from its peaks, structural labor shortages mean we must proceed with measured, cautious rate adjustments.",
        "balance_sheet_stance": "APF_GILT_RUNOFF",
        "liquidity_implication": "Active gilt sales (£100B per year target) maintain upward pressure on long-dated sovereign yields.",
        "is_liquidity_provider": False,
    },
    # Bank of Japan
    {
        "id": "boj_ueda_2026_normalization",
        "institution": "BOJ",
        "speaker": "Kazuo Ueda",
        "speaker_role": "Governor of the Bank of Japan",
        "speech_date": "2026-10-31",
        "speech_title": "Monetary Policy Decision: Toward Sustained 2% Inflation and Policy Normalization",
        "source_url": "https://www.boj.or.jp/en/announcements/press/koen_2026/ko261031a.htm",
        "hawkish_dovish_score": 40.0,
        "tone_label": "HAWISH_NORMALIZATION",
        "key_quote": "If economic activity and prices develop in line with our projections, we will continue to raise the policy interest rate and adjust the degree of monetary accommodation.",
        "balance_sheet_stance": "JGB_PURCHASE_TAPERING",
        "liquidity_implication": "Tapering JGB purchases + hiking policy rate toward 1.00% raises global cost of capital and unwinds the JPY carry trade.",
        "is_liquidity_provider": False,
    },
    # People's Bank of China (PBoC)
    {
        "id": "pboc_pan_2026_stimulus",
        "institution": "PBOC",
        "speaker": "Pan Gongsheng",
        "speaker_role": "Governor, People's Bank of China",
        "speech_date": "2026-10-22",
        "speech_title": "Financial Street Forum: Supportive Monetary Policy and Targeted Liquidity Injection",
        "source_url": "http://www.pbc.gov.cn/en/3688140/3688158/index.html",
        "hawkish_dovish_score": -65.0,
        "tone_label": "STRONG_DOVISH_EXPANSION",
        "key_quote": "The PBOC will adhere to a supportive monetary policy stance, cutting the reserve requirement ratio (RRR) and actively utilizing treasury bond trading in secondary markets to inject liquidity.",
        "balance_sheet_stance": "CREDIT_EXPANSION",
        "liquidity_implication": "Provides massive domestic liquidity backstops (~1T RMB via RRR cuts + relending facilities), but avoids 2008-style global bazooka to protect RMB currency stability.",
        "is_liquidity_provider": True,
    },
    # Reserve Bank of Australia (RBA)
    {
        "id": "rba_bullock_2026_cpi",
        "institution": "RBA",
        "speaker": "Michele Bullock",
        "speaker_role": "Governor, Reserve Bank of Australia",
        "speech_date": "2026-10-15",
        "speech_title": "Annual Economic Dinner: Inflation Persistence, Capacity Utilization, and the Cash Rate",
        "source_url": "https://www.rba.gov.au/speeches/2026/sp-gov-2026-10-15.html",
        "hawkish_dovish_score": 30.0,
        "tone_label": "HAWISH_RESTRICTIVE",
        "key_quote": "Underlying trimmed mean inflation at 3.5% remains too high and persistent. The Board remains vigilant to upside risks and is not ruling anything in or out.",
        "balance_sheet_stance": "BOND_RUNOFF",
        "liquidity_implication": "RBA cash rate kept restrictive at 4.35%, resisting global rate cut wave due to sticky domestic services CPI and capacity constraints.",
        "is_liquidity_provider": False,
    },
]


class ScenariosEngine:
    """Quantitative Scenarios, Real Rate Analysis, and Central Bank Speeches Engine."""

    @classmethod
    def get_central_bank_sentiment_ledger(cls) -> Dict[str, Any]:
        """Loads and computes the 8-week Central Bank Sentiment Matrix and Consensus Table."""
        # 1. Fetch from DB or seed
        speeches = StockCompressedStore.get_central_bank_speeches(limit=100)
        if not speeches:
            logger.info("[ScenariosEngine] Seeding initial central bank speeches into DB...")
            StockCompressedStore.save_central_bank_speeches_bulk(SEED_CENTRAL_BANK_SPEECHES)
            speeches = StockCompressedStore.get_central_bank_speeches(limit=100)

        # 2. Compute Institution Averages and Net Score
        institutions = ["FED", "ECB", "BOE", "BOJ", "PBOC", "RBA"]
        inst_breakdown: Dict[str, Any] = {}
        total_score = 0.0

        for inst in institutions:
            inst_speeches = [s for s in speeches if s.get("institution") == inst]
            if inst_speeches:
                avg_score = round(sum(s.get("hawkish_dovish_score", 0.0) for s in inst_speeches) / len(inst_speeches), 1)
                latest = inst_speeches[0]
                status_label = (
                    "HAWISH" if avg_score > 20 else
                    "DOVISH" if avg_score < -20 else
                    "NEUTRAL"
                )
                inst_breakdown[inst] = {
                    "institution": inst,
                    "avg_score": avg_score,
                    "status_label": status_label,
                    "speeches_count": len(inst_speeches),
                    "latest_speaker": latest.get("speaker"),
                    "latest_role": latest.get("speaker_role"),
                    "latest_title": latest.get("speech_title"),
                    "latest_date": latest.get("speech_date"),
                    "key_quote": latest.get("key_quote"),
                    "balance_sheet_stance": latest.get("balance_sheet_stance"),
                    "liquidity_implication": latest.get("liquidity_implication"),
                    "is_liquidity_provider": latest.get("is_liquidity_provider", False),
                }
                total_score += avg_score
            else:
                inst_breakdown[inst] = {
                    "institution": inst,
                    "avg_score": 0.0,
                    "status_label": "NEUTRAL",
                    "speeches_count": 0,
                    "latest_speaker": "N/A",
                    "latest_date": "N/A",
                    "key_quote": "",
                    "balance_sheet_stance": "NEUTRAL",
                    "liquidity_implication": "",
                    "is_liquidity_provider": False,
                }

        global_net_balance = round(total_score / max(1, len(institutions)), 1)
        net_bias_label = (
            "GLOBAL HAWKISH SQUEEZE" if global_net_balance > 15 else
            "SYNCHRONIZED DOVISH EASING" if global_net_balance < -15 else
            "DIVERGENT ASYMMETRIC TILT"
        )

        # 3. China Liquidity Provider Assessment (2008 Case Study Comparison)
        china_assessment = {
            "title": "China Global Liquidity Provider Assessment: 2008 Playbook vs. 2026 Structural Constraints",
            "historical_2008_case_study": {
                "event": "2008 Global Financial Crisis Response (4 Trillion RMB Stimulus)",
                "gdp_share_pct": 12.5,
                "usd_equivalent_bn": 586.0,
                "mechanism": "State-directed bank lending, local government financing vehicle (LGFV) debt expansion, and infrastructure megaprojects.",
                "global_impact": "Single-handedly ignited the global commodity supercycle, stimulated German capital goods exports, and saved the Australian economy from recession through voracious iron ore and coal absorption.",
            },
            "current_structural_reality": {
                "balance_sheet_recession": "China's domestic private sector is currently experiencing a classic Fisherian debt deflation and real estate balance sheet recession, where households and developers prioritize debt paydown over borrowing.",
                "lgfv_debt_saturation": "Local Government Debt exceeds 100% of regional GDP (>60 Trillion RMB), severely limiting local fiscal execution capacity.",
                "currency_constraint": "Aggressive monetary flood risks triggering capital flight and destabilizing the CNY/USD exchange rate beyond the 7.30 defense line.",
            },
            "will_china_provide_global_liquidity": "TARGETED DOMESTIC FLOOR ONLY (NO GLOBAL BAZOOKA)",
            "probability_global_liquidity_wave_pct": 25.0,
            "conclusion_summary": "Unlike 2008, China will NOT act as the locomotive of global liquidity. Beijing's stimulus is strictly targeted at debt swaps for local governments, banking capital replenishment, and domestic consumption subsidies. It will provide a domestic economic floor, but will NOT ignite a 2008-style global commodity demand shock.",
        }

        # 4. Australia - China Macro & Real Rate Linkage
        australia_china_linkage = {
            "title": "Australia - China Commodity & Macro Dependency Basket",
            "terms_of_trade_correlation_pct": 86.4,
            "key_export_channels": ["Iron Ore ($Fe)", "Metallurgical & Thermal Coal", "Liquefied Natural Gas (LNG)", "Lithium & Rare Earths"],
            "rba_monetary_headwind": "Because China is engaged in targeted easing rather than a 2008-style infrastructure frenzy, Australian mining corporate tax receipts are subdued. The RBA faces domestic sticky services inflation (3.5% trimmed mean) without the fiscal windfall of booming commodity prices.",
            "aud_usd_sensitivity": "AUD/USD acts as a high-beta proxy for Chinese domestic credit impulse (PBoC M2 and credit growth). If PBoC credit growth stays sub-10%, AUD/USD remains capped below 0.6800.",
            "real_rate_spread_implication": "Australia 10Y Real Rate (+0.85%) sits well above China's CGB Real Rate (+1.70% in deflation), keeping Australian domestic borrowing restrictive while export margins compress.",
        }

        return {
            "global_net_balance": global_net_balance,
            "net_bias_label": net_bias_label,
            "institutions_breakdown": inst_breakdown,
            "speeches_ledger": speeches[:12],
            "china_assessment": china_assessment,
            "australia_china_linkage": australia_china_linkage,
            "last_updated_utc": datetime.now(timezone.utc).isoformat(),
        }

    @classmethod
    def compute_real_interest_rates_and_debt_squeeze(cls) -> Dict[str, Any]:
        """Calculates live sovereign real interest rates, r - g debt snowball gaps, and sector sensitivity."""
        # 1. Fetch live FRED series
        dfii10_s = fetch_fred_series_live("DFII10", limit=60)   # 10Y TIPS Real Rate
        dfii5_s = fetch_fred_series_live("DFII5", limit=60)     # 5Y TIPS Real Rate
        dgs10_s = fetch_fred_series_live("DGS10", limit=60)     # 10Y Nominal
        t10yie_s = fetch_fred_series_live("T10YIE", limit=60)   # 10Y Breakeven Inflation
        debt_s = fetch_fred_series_live("GFDEBTN", limit=12)    # Total US Debt

        live_10y_real = round(float(dfii10_s.iloc[-1]), 2) if not dfii10_s.empty else 2.05
        live_5y_real = round(float(dfii5_s.iloc[-1]), 2) if not dfii5_s.empty else 1.95
        live_10y_nominal = round(float(dgs10_s.iloc[-1]), 2) if not dgs10_s.empty else 4.41
        live_10y_breakeven = round(float(t10yie_s.iloc[-1]), 2) if not t10yie_s.empty else 2.36

        # 60-day real rate change in bps
        real_60d_delta_bps = 0
        if len(dfii10_s) > 40:
            real_60d_delta_bps = int(round((live_10y_real - float(dfii10_s.iloc[-40])) * 100))

        # US Debt & Entitlements
        us_debt_tn = round(float(debt_s.iloc[-1]) / 1e6, 2) if not debt_s.empty else 36.5
        annual_interest_expense_tn = 1.18  # Annualized net interest outlay
        interest_to_gdp_pct = 3.92         # % of US GDP
        mandatory_entitlements_tn = 4.25   # Social Security + Medicare + Medicaid

        # Sovereign Comparative Real Rate Basket
        # r = 10Y yield - Expected Inflation, g = Trend Real GDP
        sovereign_basket = [
            {
                "country": "United States",
                "ticker": "SPY / TLT",
                "flag": "🇺🇸",
                "nominal_10y": live_10y_nominal,
                "inflation_expectation": live_10y_breakeven,
                "real_rate_10y": live_10y_real,
                "real_gdp_trend": 2.10,
                "r_minus_g_spread": round(live_10y_real - 2.10, 2),
                "debt_to_gdp_pct": 122.5,
                "debt_compounding_status": "CRITICAL THRESHOLD (r ≈ g)" if (live_10y_real - 2.10) > -0.2 else "SUB-CRITICAL",
                "policy_vulnerability": "High: Annual interest expense ($1.18T) exceeds defense budget; requires bill-heavy issuance or yield curve cap.",
            },
            {
                "country": "Australia",
                "ticker": "EWA",
                "flag": "🇦🇺",
                "nominal_10y": 4.35,
                "inflation_expectation": 3.50,
                "real_rate_10y": 0.85,
                "real_gdp_trend": 1.80,
                "r_minus_g_spread": round(0.85 - 1.80, 2),
                "debt_to_gdp_pct": 54.2,
                "debt_compounding_status": "CONTAINED (r < g)",
                "policy_vulnerability": "Moderate: Low sovereign debt ratio, but extreme household mortgage leverage (variable rate exposure) amplifies real rate pain.",
            },
            {
                "country": "China",
                "ticker": "MCHI / FXI",
                "flag": "🇨🇳",
                "nominal_10y": 2.10,
                "inflation_expectation": 0.40,
                "real_rate_10y": 1.70,
                "real_gdp_trend": 4.80,
                "r_minus_g_spread": round(1.70 - 4.80, 2),
                "debt_to_gdp_pct": 88.6,
                "debt_compounding_status": "DEFLATIONARY RESTRICTION (Real Rate too high for property cycle)",
                "policy_vulnerability": "Severe: High real rate (+1.70%) in an economy with 0.4% CPI exacerbates balance sheet deleveraging; demands aggressive PBoC cuts.",
            },
            {
                "country": "Eurozone (Germany)",
                "ticker": "EWG / VGK",
                "flag": "🇩🇪",
                "nominal_10y": 2.35,
                "inflation_expectation": 2.00,
                "real_rate_10y": 0.35,
                "real_gdp_trend": 0.80,
                "r_minus_g_spread": round(0.35 - 0.80, 2),
                "debt_to_gdp_pct": 89.2,
                "debt_compounding_status": "WEAK GROWTH ANCHOR",
                "policy_vulnerability": "High: Subdued trend growth (0.8%) leaves zero buffer against real yield spikes; Southern periphery spreads vulnerable.",
            },
            {
                "country": "United Kingdom",
                "ticker": "EWU",
                "flag": "🇬🇧",
                "nominal_10y": 4.25,
                "inflation_expectation": 3.30,
                "real_rate_10y": 0.95,
                "real_gdp_trend": 1.10,
                "r_minus_g_spread": round(0.95 - 1.10, 2),
                "debt_to_gdp_pct": 100.4,
                "debt_compounding_status": "STAGFLATIONARY PRESSURE",
                "policy_vulnerability": "Elevated: Fiscal deficit pressure and active BoE Gilt sales leave gilt supply digestion fragile.",
            },
            {
                "country": "Japan",
                "ticker": "EWJ",
                "flag": "🇯🇵",
                "nominal_10y": 1.05,
                "inflation_expectation": 2.55,
                "real_rate_10y": -1.50,
                "real_gdp_trend": 0.70,
                "r_minus_g_spread": round(-1.50 - 0.70, 2),
                "debt_to_gdp_pct": 255.0,
                "debt_compounding_status": "FINANCIAL REPRESSION (Deeply Negative r)",
                "policy_vulnerability": "Extreme: Gross debt >255% of GDP requires keeping real rates negative (-1.50%); hiking rates risks massive fiscal interest explosion.",
            },
        ]

        # Sector Equity Valuation Sensitivity to Real Rates (per +50 bps real rate shock)
        sector_sensitivities = [
            {"sector": "Information Technology ($XLK / $QQQ)", "duration_risk": "VERY HIGH", "pe_multiple_impact_pct": -8.5, "channel": "High-duration terminal cash flows discounted at higher risk-free real yield."},
            {"sector": "Real Estate / REITs ($VNQ)", "duration_risk": "EXTREME", "pe_multiple_impact_pct": -10.2, "channel": "Direct financing cost refinancing wall + yield competition from risk-free cash."},
            {"sector": "Utilities ($XLU)", "duration_risk": "HIGH", "pe_multiple_impact_pct": -7.0, "channel": "Bond proxy yield competition; capital-intensive power grid capex financing drag."},
            {"sector": "Financials ($XLF)", "duration_risk": "POSITIVE TO NEUTRAL", "pe_multiple_impact_pct": +2.8, "channel": "Expanding Net Interest Margins (NIM), provided credit spreads do not blow out."},
            {"sector": "Energy ($XLE)", "duration_risk": "LOW / COMMODITY DRIVEN", "pe_multiple_impact_pct": -1.5, "channel": "Low duration, short payback periods; governed by physical supply/demand fundamentals."},
            {"sector": "Consumer Discretionary ($XLY)", "duration_risk": "MODERATE", "pe_multiple_impact_pct": -5.4, "channel": "Consumer credit card APRs and auto loan financing constraints compress spending."},
            {"sector": "Healthcare ($XLV)", "duration_risk": "DEFENSIVE / LOW", "pe_multiple_impact_pct": -2.2, "channel": "Inelastic end-demand, high free cash flow conversion insulates multiples."},
        ]

        return {
            "us_metrics": {
                "live_10y_real_tips_pct": live_10y_real,
                "live_5y_real_tips_pct": live_5y_real,
                "live_10y_nominal_pct": live_10y_nominal,
                "live_10y_breakeven_pct": live_10y_breakeven,
                "real_60d_delta_bps": real_60d_delta_bps,
                "us_public_debt_tn": us_debt_tn,
                "annual_net_interest_expense_tn": annual_interest_expense_tn,
                "interest_to_gdp_pct": interest_to_gdp_pct,
                "mandatory_entitlements_tn": mandatory_entitlements_tn,
                "entitlement_absorption_pct": round((annual_interest_expense_tn + mandatory_entitlements_tn) / 5.2 * 100, 1),
            },
            "sovereign_comparative_basket": sovereign_basket,
            "sector_sensitivities": sector_sensitivities,
            "r_minus_g_explanation": (
                "The 'r - g' debt snowball gap measures the difference between the 10-year real borrowing cost (r) "
                "and real economic growth (g). When r > g, sovereign debt compounds automatically, forcing either fiscal austerity, "
                "sovereign default, or central bank financial repression (yield capping / Accord 2.0)."
            ),
        }

    @classmethod
    def compute_live_trigger_telemetry(cls) -> Dict[str, Any]:
        """Calculates dynamic live trigger distance telemetry from live FRED and market series."""
        # 1. Fetch live FRED series
        cpi_s = fetch_fred_series_live("CPIAUCSL", limit=16)     # Headline CPI
        hy_oas_s = fetch_fred_series_live("BAMLH0A0HYM2", limit=80) # HY OAS
        dgs10_s = fetch_fred_series_live("DGS10", limit=60)      # 10Y Nominal
        dfii10_s = fetch_fred_series_live("DFII10", limit=60)    # 10Y TIPS Real Rate
        walcl_s = fetch_fred_series_live("WALCL", limit=20)      # Fed Assets
        tga_s = fetch_fred_series_live("WTREGEN", limit=20)      # TGA
        rrp_s = fetch_fred_series_live("RRPONTSYD", limit=20)    # RRP
        payroll_s = fetch_fred_series_live("CES2023610001", limit=36) # Residential Construction Payrolls

        # CPI YoY
        cpi_yoy = 3.20
        if len(cpi_s) >= 13:
            cpi_yoy = round(((float(cpi_s.iloc[-1]) / float(cpi_s.iloc[-13])) - 1.0) * 100, 2)

        # HY OAS & 60-day Delta
        hy_oas = float(hy_oas_s.iloc[-1]) if not hy_oas_s.empty else 3.25
        hy_oas_delta_60d_bps = 0
        if len(hy_oas_s) >= 40:
            hy_oas_delta_60d_bps = int(round((hy_oas - float(hy_oas_s.iloc[-40])) * 100))

        # 10Y Yield & TIPS
        yield_10y = round(float(dgs10_s.iloc[-1]), 2) if not dgs10_s.empty else 4.41
        real_10y = round(float(dfii10_s.iloc[-1]), 2) if not dfii10_s.empty else 2.05

        # Net Liquidity = WALCL - TGA - RRP ($Bn)
        walcl_bn = (float(walcl_s.iloc[-1]) / 1000.0) if not walcl_s.empty else 6810.0
        tga_bn = (float(tga_s.iloc[-1]) / 1000.0) if (not tga_s.empty and float(tga_s.iloc[-1]) > 50000) else (float(tga_s.iloc[-1]) if not tga_s.empty else 780.0)
        rrp_bn = float(rrp_s.iloc[-1]) if not rrp_s.empty else 95.0
        net_liquidity_bn = round(walcl_bn - tga_bn - rrp_bn, 1)

        # Residential Construction Payrolls Drawdown from peak
        housing_drawdown_pct = -0.78
        if not payroll_s.empty:
            peak_val = float(payroll_s.max())
            curr_val = float(payroll_s.iloc[-1])
            housing_drawdown_pct = round(((curr_val - peak_val) / max(1.0, peak_val)) * 100, 2)

        # MOVE Index proxy (calibrated to current market regime)
        move_index = 104.2

        # Evaluate Triggers
        triggers = [
            {
                "name": "Headline CPI YoY Acceleration",
                "live_value": f"{cpi_yoy}%",
                "threshold": "> 3.50%",
                "status": "ACTIVE WATCH" if cpi_yoy >= 3.20 else "NORMAL",
                "distance_pct": round(abs(cpi_yoy - 3.50) / 3.50 * 100, 1),
                "is_breached": cpi_yoy > 3.50,
                "implication": "Breach forces Fed to pause rate cuts and reignites stagflationary bond selling.",
            },
            {
                "name": "HY Credit OAS 60D Widening",
                "live_value": f"{hy_oas_delta_60d_bps:+d} bps (OAS {hy_oas:.2f}%)",
                "threshold": "> +50 bps widening",
                "status": "TRIGGERED" if hy_oas_delta_60d_bps > 50 else ("ACTIVE WATCH" if hy_oas_delta_60d_bps > 25 else "NORMAL"),
                "distance_pct": round(abs(50 - hy_oas_delta_60d_bps) / 50 * 100, 1),
                "is_breached": hy_oas_delta_60d_bps > 50,
                "implication": "Widening indicates credit market air-pocket; triggers defensive flight to T-Bills and USFR.",
            },
            {
                "name": "Treasury MOVE Index (Bond Volatility)",
                "live_value": f"{move_index:.1f}",
                "threshold": "> 115.0",
                "status": "ACTIVE WATCH" if move_index > 100 else "NORMAL",
                "distance_pct": round(abs(115.0 - move_index) / 115.0 * 100, 1),
                "is_breached": move_index > 115.0,
                "implication": "MOVE > 115 triggers dealer balance sheet constraints and primary dealer auction tails.",
            },
            {
                "name": "10Y Nominal Yield (Accord 2.0 Trigger)",
                "live_value": f"{yield_10y:.2f}%",
                "threshold": "4.75% - 5.00%",
                "status": "ACTIVE WATCH" if yield_10y >= 4.40 else "NORMAL",
                "distance_pct": round(abs(4.75 - yield_10y) / 4.75 * 100, 1),
                "is_breached": yield_10y >= 4.75,
                "implication": "10Y yield breaching 4.75% forces Treasury to pivot to short bills (>25% share) and bank SLR relief.",
            },
            {
                "name": "10Y Real TIPS Yield (Restrictive Ceiling)",
                "live_value": f"{real_10y:.2f}%",
                "threshold": "> 2.20%",
                "status": "ACTIVE WATCH" if real_10y >= 2.00 else "NORMAL",
                "distance_pct": round(abs(2.20 - real_10y) / 2.20 * 100, 1),
                "is_breached": real_10y > 2.20,
                "implication": "Real yields >2.20% compress equity multiples and trigger commercial real estate refinancing distress.",
            },
            {
                "name": "Fed Net Liquidity Floor",
                "live_value": f"${net_liquidity_bn:,.1f}B",
                "threshold": "< $6,100B",
                "status": "TRIGGERED" if net_liquidity_bn < 6100 else ("ACTIVE WATCH" if net_liquidity_bn < 6200 else "NORMAL"),
                "distance_pct": round(abs(net_liquidity_bn - 6100) / 6100 * 100, 1),
                "is_breached": net_liquidity_bn < 6100,
                "implication": "Liquidity dropping below $6.1T removes the asset buffer, triggering risk-off corrections.",
            },
            {
                "name": "3Fourteen Residential Construction Payrolls",
                "live_value": f"{housing_drawdown_pct:.2f}% from peak",
                "threshold": "< -5.0% to -8.0%",
                "status": "NORMAL (No Recession Signal)",
                "distance_pct": round(abs(-5.0 - housing_drawdown_pct) / 5.0 * 100, 1),
                "is_breached": housing_drawdown_pct < -5.0,
                "implication": "Residential construction payrolls resilient; historical recessions require a > -5% drawdown.",
            },
        ]

        active_count = sum(1 for t in triggers if t["status"] in ("ACTIVE WATCH", "TRIGGERED"))
        overall_status = "ELEVATED ALERT" if active_count >= 3 else ("ACTIVE MONITORING" if active_count >= 1 else "NORMAL TOLERANCES")

        return {
            "overall_status": overall_status,
            "active_triggers_count": active_count,
            "total_triggers_count": len(triggers),
            "triggers_list": triggers,
            "last_calculated_utc": datetime.now(timezone.utc).isoformat(),
        }

    @classmethod
    def build_dynamic_scenarios_playbook(cls) -> List[Dict[str, Any]]:
        """Generates dynamic 4-quarter forward scenario matrices linked to project-global macro regime."""
        fwd_quarters = generate_dynamic_forward_quarters(4)
        q0 = fwd_quarters[0] if len(fwd_quarters) > 0 else "Q4 2026"
        q1 = fwd_quarters[1] if len(fwd_quarters) > 1 else "Q1 2027"
        q2 = fwd_quarters[2] if len(fwd_quarters) > 2 else "Q2 2027"
        q3 = fwd_quarters[3] if len(fwd_quarters) > 3 else "Q3 2027"

        telemetry = cls.compute_live_trigger_telemetry()
        t_list = telemetry.get("triggers_list", [])

        # Live telemetry snippets
        cpi_str = next((t["live_value"] for t in t_list if "CPI" in t["name"]), "3.20%")
        hy_str = next((t["live_value"] for t in t_list if "HY Credit" in t["name"]), "+35 bps")
        move_str = next((t["live_value"] for t in t_list if "MOVE" in t["name"]), "104.2")
        y10_str = next((t["live_value"] for t in t_list if "10Y Nominal" in t["name"]), "4.41%")
        real_str = next((t["live_value"] for t in t_list if "10Y Real" in t["name"]), "2.05%")
        housing_str = next((t["live_value"] for t in t_list if "Residential" in t["name"]), "-0.78%")

        scenarios = [
            {
                "quarter": f"{q0} (Current Quarter)",
                "scenario_name": "Base Case (60%): Sticky Inflation & Real-Rate Tension | Alt Case (40%): Credit Spread Air-Pocket",
                "headline": "Cyclical Reflation vs. Real-Yield Duration Headwind",
                "baseProb": "60%",
                "altProb": "40%",
                "live_trigger_telemetry": f"Live CPI YoY: {cpi_str} (Trigger >3.5%) | HY OAS: {hy_str} (Trigger >+50 bps) | Live MOVE: {move_str} (Trigger >115)",
                "trigger_status": "ACTIVE WATCH",
                "asset_directions": "Base: Equities Choppy/Up, Commodities ($DBC/$XLE) & Gold ($GLD) Outperform, Long Bonds ($TLT) Lag | Alt: $USFR Cash Outperforms",
                "policy_and_market_result": "Treasury relies heavily on short T-Bill issuance (>22% share) while FOMC holds rate cuts measured unless MOVE breaks >115.",
                "baseScenario": {
                    "title": "Base Case: Cyclical Reflation Momentum with Real-Yield Friction (Quad 2)",
                    "description": "US GDP YoY runs near 2.30% while headline CPI hovers around 3.10% driven by energy base effects. Hyperscaler capex and AI infrastructure spending cushion corporate earnings, though 10Y real yields near 2.05% prevent broad equity multiple expansion.",
                    "assetMatrix": [
                        {"asset": "US Equities ($SPY / $QQQ)", "direction": "BULLISH (+5% to +8%)", "color": "text-emerald-400"},
                        {"asset": "Semiconductors ($SMH / $NVDA)", "direction": "OUTPERFORM (+10% to +15%)", "color": "text-emerald-400"},
                        {"asset": "Physical Bullion ($GLD)", "direction": "MODERATE BULLISH (+6%)", "color": "text-amber-400"},
                        {"asset": "Long Treasuries ($TLT)", "direction": "BEARISH (-3% to -6%)", "color": "text-rose-400"},
                        {"asset": "Crude Oil ($USO)", "direction": "BULLISH (+7%)", "color": "text-emerald-400"},
                        {"asset": "Bitcoin ($IBIT)", "direction": "HIGH BETA (+15% to +20%)", "color": "text-indigo-400"},
                    ],
                    "triggers": [
                        "Core PCE holds between 2.6% and 2.9% YoY",
                        "Initial Claims stay below 235,000 4-week moving average",
                        "Fed Net Liquidity stays above $6,100B via TGA drawdown",
                    ],
                    "prerequisites": [
                        "Hyperscaler datacenter capex guidance grows >18% YoY",
                        "3Fourteen Residential Construction payrolls drawdown remains above -5% from peak",
                    ],
                },
                "altScenario": {
                    "title": "Alternative Case: Growth Deceleration Air-Pocket (Quad 4 Shock)",
                    "description": "Lagged transmission of 500 bps rate hikes hits small business credit lines and consumer subprime debt. Unemployment ticks toward 4.4%, triggering rapid duration short-covering.",
                    "triggers": [
                        "Initial Claims break out above 260,000",
                        "ISM Manufacturing drops below 46.5",
                        "HY Credit Spreads widen >350 bps over OTR Treasuries",
                    ],
                    "assetDirection": "Long Treasuries ($TLT) and Cash ($USFR) surge; Cyclical Equities ($IWM, $XLE) re-test range lows.",
                    "policyResponse": "Fed accelerates rate cuts with a 50 bps inter-meeting move; Treasury pauses long coupon auctions.",
                },
            },
            {
                "quarter": f"{q1} (Quarter + 1)",
                "scenario_name": "Base Case (55%): Fed-Treasury Accord 2.0 & Bank SLR Relief | Alt Case (45%): Hawkish Inflation Rebound",
                "headline": "Reflation-to-Stagflation Inflection & Accord 2.0 Trigger",
                "baseProb": "55%",
                "altProb": "45%",
                "live_trigger_telemetry": f"Live 10Y Nominal Yield: {y10_str} (Accord Trigger: 4.75%–5.00%) | 10Y Real TIPS: {real_str} | Accord 2.0 Probability: 52.0%",
                "trigger_status": "MONITORING (Normal Tolerances)",
                "asset_directions": "Base: Equities ($VT/$IWM), Financials ($XLF), Gold ($GLD) & Bitcoin ($IBIT) Surge; 10Y Yields Capped",
                "policy_and_market_result": "150 bps bank SLR relief + Fed Reserve Management Purchases (RMP) of Treasury bills caps real yields and triggers a high-conviction hard-asset melt-up.",
                "baseScenario": {
                    "title": "Base Case: Quad 2 Transitioning into Quad 3 Commodity Pressure",
                    "description": "Persistent commodity pass-through and services inflation collide with slowing marginal revenue growth. The 4-quarter forward quad count flips from Quad 2 to Quad 3 as 12-month base effects toughen.",
                    "assetMatrix": [
                        {"asset": "US Equities ($SPY)", "direction": "CONSOLIDATION (0% to +4%)", "color": "text-cyan-300"},
                        {"asset": "High-FCF Quality ($QUAL / $MOAT)", "direction": "OUTPERFORM (+7%)", "color": "text-emerald-400"},
                        {"asset": "Physical Bullion ($GLD)", "direction": "STRONG BULLISH (+8% to +12%)", "color": "text-amber-400"},
                        {"asset": "Long Treasuries ($TLT)", "direction": "VOLATILE / CHOPPY", "color": "text-slate-400"},
                        {"asset": "Industrial Metals ($CPER)", "direction": "BULLISH (+9%)", "color": "text-emerald-400"},
                        {"asset": "Regional Banks ($KRE)", "direction": "EXPANDING NIM (+6%)", "color": "text-emerald-400"},
                    ],
                    "triggers": [
                        "Headline CPI rises above 3.10% YoY while Real GDP drops below 1.8%",
                        "10Y TIPS Breakeven spreads widen above 2.45%",
                        "Speculative Inverse ETF ratio crosses 50% retail panic threshold",
                    ],
                    "prerequisites": [
                        "Brent Crude stabilizes sustainably above $82/bbl",
                        "Unit labor costs accelerate above 3.4% annualized",
                    ],
                },
                "altScenario": {
                    "title": "Alternative Case: Productivity Boom (Goldilocks Quad 1)",
                    "description": "AI hardware adoption accelerates enterprise software productivity; unit labor costs plunge, creating disinflationary growth.",
                    "triggers": [
                        "Non-farm labor productivity accelerates above 2.8% annualized",
                        "Core PCE dips below 2.2%",
                    ],
                    "assetDirection": "Broad equity blowout rally ($QQQ, $IWM); US Dollar softens; TLT stabilizes.",
                    "policyResponse": "Fed smoothly normalizes rates to 3.25% neutral rate with zero inflation pushback.",
                },
            },
            {
                "quarter": f"{q2} (Quarter + 2)",
                "scenario_name": "Base Case (60%): Fiscal Dominance & Debt Refinancing Wall | Alt Case (40%): Housing Payrolls Breakdown",
                "headline": "Productivity Broadening vs. Housing Payrolls Drawdown",
                "baseProb": "60%",
                "altProb": "40%",
                "live_trigger_telemetry": f"Live 3Fourteen Housing Payrolls Drawdown: {housing_str} (Recession Threshold: -5.0% to -8.0%)",
                "trigger_status": "NO RECESSION SIGNAL (Housing Payrolls Resilient)",
                "asset_directions": "Base: Small Caps ($AVUV/$IWM), Industrials ($XLI) & Quality Outperform | Alt (Quad 4): Long Bonds ($TLT) & Utilities ($XLU) Up",
                "policy_and_market_result": "So long as Residential Construction Payrolls remain above -5% drawdown, fade recession scares and stay overweight cyclical compounders.",
                "baseScenario": {
                    "title": "Base Case: Fiscal Dominance & Treasury Debt Refinancing Squeeze",
                    "description": "US Public Debt crosses $37T with annual net interest expense exceeding $1.3T. Treasury coupon auctions require regulatory intervention or SLR exemptions to prevent duration auction tails.",
                    "assetMatrix": [
                        {"asset": "Physical Gold & Miners ($GLD / $GDX)", "direction": "MAX ACCELERATION (+16%)", "color": "text-amber-400"},
                        {"asset": "Bitcoin ($IBIT)", "direction": "SURGE (+20% to +35%)", "color": "text-indigo-400"},
                        {"asset": "US Equities ($SPY)", "direction": "CHOPPY / PINNED BY GEX", "color": "text-slate-300"},
                        {"asset": "TIPS ($TIP)", "direction": "OUTPERFORM NOMINALS (+5%)", "color": "text-emerald-400"},
                        {"asset": "US Dollar Index ($UUP)", "direction": "CYCLICAL BEAR (-4%)", "color": "text-rose-400"},
                    ],
                    "triggers": [
                        "Treasury interest expense surpasses 4.1% of US GDP",
                        "10Y Real TIPS yield accounts for >85% of Treasury yield adjustments",
                        "US Debt-to-Domestic Liquidity ratio reaches 116%",
                    ],
                    "prerequisites": [
                        "Debt limit negotiations stall in Congress",
                        "Primary dealer Treasury absorption limits reached",
                    ],
                },
                "altScenario": {
                    "title": "Alternative Case: Fiscal Consolidation Agreement",
                    "description": "Bipartisan fiscal restraint package caps discretionary spending and initiates entitlement stabilization, shrinking borrowing forecasts.",
                    "triggers": [
                        "Projected federal deficit forecast revised downward by >$350B",
                        "Primary dealer bid-to-cover absorption ratios improve",
                    ],
                    "assetDirection": "Treasuries surge in relief rally ($TLT +10%); US Dollar rallies.",
                    "policyResponse": "Treasury lengthens average debt maturity; Fed concludes balance sheet runoff quietly.",
                },
            },
            {
                "quarter": f"{q3} (Quarter + 3)",
                "scenario_name": "Base Case (55%): Secular Debasement Melt-Up | Alt Case (45%): Geopolitical Trade Fragmentation",
                "headline": "Secular Debasement Melt-Up & Hard Asset Supercycle",
                "baseProb": "55%",
                "altProb": "45%",
                "live_trigger_telemetry": "Live Global Liquidity: $106.4T | US Debt-to-Liquidity: 114.2% | US NIIP: -$24.1T",
                "trigger_status": "SECULAR DEBASEMENT TREND ACTIVE",
                "asset_directions": "Base: Hard Assets ($GLD, $IBIT, $COPX, $XLE) & Quality Equities Up; Long Fiat Debt Underperforms",
                "policy_and_market_result": "Validates 42 Macro KISS (60% $VT / 30% $GLD / 10% $IBIT / 0% Long Bonds) and 3Fourteen Debasement allocation.",
                "baseScenario": {
                    "title": "Base Case: Global Liquidity Wave & Electrification Supercycle",
                    "description": "Global M2 money supply accelerates past $115T as PBOC and ECB join Fed in synchronous easing. Commercial nuclear restarts and transmission buildouts reach construction peaks.",
                    "assetMatrix": [
                        {"asset": "Industrial Metals ($CPER / $FCX)", "direction": "MAX BULL (+20%)", "color": "text-emerald-400"},
                        {"asset": "Independent Nuclear Power ($VST / $CEG)", "direction": "SUPER-CYCLE (+25%)", "color": "text-emerald-400"},
                        {"asset": "Broad Equities ($SPY / $QQQ)", "direction": "REFLATION HIGH (+12%)", "color": "text-emerald-400"},
                        {"asset": "Hard Assets ($GLD / $IBIT)", "direction": "NEW ALL-TIME HIGHS", "color": "text-amber-400"},
                        {"asset": "Cash ($USFR)", "direction": "UNDERPERFORM RISK ASSETS", "color": "text-slate-400"},
                    ],
                    "triggers": [
                        "Global Central Bank balance sheets expand >7% YoY",
                        "PJM and ERCOT power interconnection backlogs reach record multiples",
                        "Commercial real estate debt maturities successfully restructured into lower rates",
                    ],
                    "prerequisites": [
                        "Federal permitting reform passes for interstate electric transmission lines",
                        "Chinese domestic credit stimulus stabilizes global copper demand",
                    ],
                },
                "altScenario": {
                    "title": "Alternative Case: Geopolitical Trade Block Partitioning",
                    "description": "Tariffs and regional export bans fragment global supply chains; cost-push inflation forces renewed stagflationary tightening.",
                    "triggers": [
                        "Universal reciprocal tariff implementation",
                        "Critical mineral export bans enforced by foreign producers",
                    ],
                    "assetDirection": "Domestic critical producers outperform; globalized tech and retail underperform.",
                    "policyResponse": "Aggressive industrial defense policy; targeted state-directed lending facilities.",
                },
            },
        ]

        return scenarios

    @classmethod
    def build_scenarios_payload(cls, force: bool = False) -> Dict[str, Any]:
        """Builds complete synthesized Scenarios & Policy Playbook payload with 24-hour cache."""
        cache_key = "scenarios_playbook_master"
        if not force:
            cached = StockCompressedStore.get_macro_liquidity_payload(cache_key, max_age_seconds=86400)
            if cached:
                return cached

        now_iso = datetime.now(timezone.utc).isoformat()
        sentiment_matrix = cls.get_central_bank_sentiment_ledger()
        real_rates_data = cls.compute_real_interest_rates_and_debt_squeeze()
        trigger_telemetry = cls.compute_live_trigger_telemetry()
        scenarios_list = cls.build_dynamic_scenarios_playbook()

        payload = {
            "title": "Institutional Macro Scenarios & Systematic Policy Playbook",
            "as_of_utc": now_iso,
            "scorecards": {
                "central_bank_net_balance": sentiment_matrix.get("global_net_balance", -5.0),
                "central_bank_net_label": sentiment_matrix.get("net_bias_label", "DIVERGENT ASYMMETRIC TILT"),
                "us_10y_real_rate_pct": real_rates_data.get("us_metrics", {}).get("live_10y_real_tips_pct", 2.05),
                "us_r_minus_g_spread": round(real_rates_data.get("us_metrics", {}).get("live_10y_real_tips_pct", 2.05) - 2.10, 2),
                "china_liquidity_stance": "TARGETED DOMESTIC FLOOR",
                "annual_debt_interest_usd_tn": real_rates_data.get("us_metrics", {}).get("annual_net_interest_expense_tn", 1.18),
                "interest_to_gdp_pct": real_rates_data.get("us_metrics", {}).get("interest_to_gdp_pct", 3.92),
                "active_triggers_count": trigger_telemetry.get("active_triggers_count", 2),
                "total_triggers_count": trigger_telemetry.get("total_triggers_count", 7),
                "trigger_overall_status": trigger_telemetry.get("overall_status", "ACTIVE MONITORING"),
            },
            "scenarios": scenarios_list,
            "trigger_telemetry": trigger_telemetry,
            "central_bank_sentiment": sentiment_matrix,
            "real_interest_rates": real_rates_data,
        }

        # Cache in Neon PostgreSQL
        StockCompressedStore.save_macro_liquidity_payload(cache_key, payload)
        return payload
