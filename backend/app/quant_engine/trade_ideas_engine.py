"""
macro_nowcast/backend/app/quant_engine/trade_ideas_engine.py
============================================================
Unified Macro & Quantitative Trade Ideas Engine.
Synthesizes:
  - Multi-Horizon Outliers (1-3M Tactical, 12M Cyclical, 3Y+ Secular)
  - Multi-Order Thematic Speculation (1st Order Direct, 2nd Order Infrastructure, 3rd Order Policy & Wealth)
  - Project-Global Macro Regime (Hedgeye Quads, 42 Macro GRID, US Net Liquidity, Cem Karsan OpEx & Dealer Gamma, Accord 2.0)
  - High-Speed Database Caching via StockCompressedStore (<15ms response time)
"""

import os
import time
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

# Fast in-memory cache
_TRADE_IDEAS_MEMORY_CACHE: Dict[str, Any] = {
    "payload": None,
    "timestamp": 0.0,
    "ttl_sec": 900,  # 15 minutes
}

# ==============================================================================
# 1. MASTER UNIFIED CANDIDATE UNIVERSE
# ==============================================================================
TRADE_IDEAS_UNIVERSE: List[Dict[str, Any]] = [
    # --------------------------------------------------------------------------
    # HORIZON 1: 1–3 MONTHS (Tactical / Volatility / OpEx & Dealer Gamma Pivots)
    # --------------------------------------------------------------------------
    {
        "ticker": "NVDA",
        "display_ticker": "$NVDA",
        "name": "NVIDIA Corporation",
        "industry": "Semiconductors & AI Compute",
        "theme": "AI Datacenter Expansion",
        "order": "1st Order (Direct)",
        "horizon": "1_to_3_months",
        "horizon_label": "1–3 Months",
        "macro_driver": "Direct primary beneficiary of hyperscaler AI capex acceleration. Blackwell architecture ramp, high OpEx call gamma concentration, and top-decile revenue acceleration (+12.5% YoY).",
        "why_this_trade": "Trading at a tactical pullback zone within its 52-week channel. While headline sentiment vacillates around Blackwell ramp timelines, hyperscaler cloud capex budgets (MSFT, GOOGL, AMZN, META) exceed $220B annualized with zero capex cancellations. Strong dealer call wall positioning provides a structural upward magnet into monthly OpEx.",
        "actionable_direction": "Accumulate equity on pullbacks toward the 15-day Probable Range Low, or structure a 45-day defined-risk Bull Call Debit Spread (e.g. +5Δ OTM calls funded by selling +15Δ OTM calls). Size at 3-5% NAV.",
        "invalidation_stop": "Daily close below 15-day Probable Range Low or sustained break below the 200-day moving average. Invalidate if aggregate hyperscaler capex guidance is revised downward.",
    },
    {
        "ticker": "CBOE",
        "display_ticker": "$CBOE",
        "name": "Cboe Global Markets",
        "industry": "Derivatives & Options Exchanges",
        "theme": "Yield Curve Steepening & Volatility",
        "order": "1st Order (Direct)",
        "horizon": "1_to_3_months",
        "horizon_label": "1–3 Months",
        "macro_driver": "Structural toll-collector on record 0DTE options volumes, VIX index hedging, single-stock dispersion trading, and Treasury volatility hedging.",
        "why_this_trade": "CBOE possesses an unassailable proprietary moat as the exclusive venue for SPX options and VIX futures trading. During macro regime transitions or debt ceiling volatility spikes, trading volume surges exponentially regardless of market direction, delivering 85%+ Clean Cash Conversion without credit risk.",
        "actionable_direction": "Initiate core long equity position on any dips toward the 50-day EMA. Excellent natural portfolio hedge against volatility spikes. Size at 3-4% NAV.",
        "invalidation_stop": "Daily close below 52-week tactical support or sudden sustained contraction in aggregate daily options clearing volume (>25% drop over 30 days).",
    },
    {
        "ticker": "BTC-USD",
        "display_ticker": "$BTC / $IBIT",
        "name": "Bitcoin Spot & US Spot Bitcoin ETFs",
        "industry": "Digital Assets / Shadow Liquidity",
        "theme": "Digital Assets & Shadow Liquidity",
        "order": "1st Order (Direct)",
        "horizon": "1_to_3_months",
        "horizon_label": "1–3 Months",
        "macro_driver": "High-beta monetary debasement proxy tracking 30-day stablecoin minting velocity, Coinbase institutional spot premium, and Fed Net Liquidity impulse.",
        "why_this_trade": "Bitcoin is the purest market gauge of global shadow fiat debasement. When US Net Liquidity expands and global M2 rises, BTC acts as a levered sponge absorbing liquidity overflows. Institutional spot ETF inflows provide an ongoing structural bid that absorbs daily miner issuance.",
        "actionable_direction": "Accumulate spot BTC or $IBIT shares during tactical pullbacks where 14-day daily RSI dips below 45. Size at 2-4% portfolio risk.",
        "invalidation_stop": "Sustained weekly close below the 200-day moving average or sharp rollover in US Net Liquidity (<$5,600B) accompanied by stablecoin redemption outflows.",
    },
    {
        "ticker": "USO",
        "display_ticker": "$USO / $CL=F",
        "name": "United States Oil Fund (WTI Crude)",
        "industry": "Energy Commodities",
        "theme": "Reflation & Energy Supply",
        "order": "1st Order (Direct)",
        "horizon": "1_to_3_months",
        "horizon_label": "1–3 Months",
        "macro_driver": "Physical crude inventory drawdowns, SPR replenishment requirements, and geopolitical transit risk in the Red Sea / Strait of Hormuz.",
        "why_this_trade": "WTI crude oil trades at a historic valuation discount relative to monetary gold (Gold/Oil ratio > 35x). With commercial inventories near 5-year seasonal lows and upstream capex suppressed by ESG and capital return mandates, tactical supply disruptions create asymmetric upside price spikes.",
        "actionable_direction": "Enter tactical long via $USO equity or 60-day slightly out-of-the-money Call Spreads. Avoid long-term holding if futures curve enters steep contango; prioritize when front-month is backwardated. Size at 2-3% NAV.",
        "invalidation_stop": "Daily close below recent range support or front-month prompt spread rolling into deep contango (> -$0.50/bbl).",
    },
    {
        "ticker": "TLT",
        "display_ticker": "$TLT / $IEF",
        "name": "iShares 20+ Year Treasury Bond ETF",
        "industry": "Sovereign Fixed Income",
        "theme": "Sovereign Debt Dominance",
        "order": "1st Order (Direct)",
        "horizon": "1_to_3_months",
        "horizon_label": "1–3 Months",
        "macro_driver": "Extreme speculative short positioning (CFTC 10th percentile), oversold duration sentiment, and Fed rate cut asymmetry.",
        "why_this_trade": "Institutional hedge funds have built extreme speculative short positions across long duration. Any subtle growth slowdown (e.g. initial jobless claims spike or core inflation decelerating) triggers violent short covering. At current yield levels, duration offers compelling convexity on growth surprises.",
        "actionable_direction": "Tactical mean-reversion long via $TLT or defined-risk 2-month Call Debit Spreads. Size at 2-4% NAV as a deflationary hedge against equity drawdowns.",
        "invalidation_stop": "Daily close below 52-week low ($87.50) or 10-year Treasury yield breaking above 4.85% on auction tailing.",
    },
    {
        "ticker": "XLF",
        "display_ticker": "$XLF / $KRE",
        "name": "Financial Select Sector SPDR",
        "industry": "US Financials & Money-Center Banks",
        "theme": "Yield Curve Steepening",
        "order": "1st Order (Direct)",
        "horizon": "1_to_3_months",
        "horizon_label": "1–3 Months",
        "macro_driver": "2s10s yield curve disinversion and steepening, bank regulatory capital relief (Basel III Endgame rollback / SLR exemptions), and accelerating Net Interest Margin (NIM).",
        "why_this_trade": "After prolonged yield curve inversion, the un-inversion of the 2s10s curve mechanically widens commercial bank lending margins. Regulatory shifts under Paradigm C favor domestic capital formation, lowering compliance friction and boosting capital return (buybacks and dividends).",
        "actionable_direction": "Accumulate $XLF or regional banking ETF $KRE upon pullbacks toward the 21-day EMA. Size at 3-5% NAV.",
        "invalidation_stop": "Daily close below the 50-day moving average or sudden re-inversion of the 2s10s curve into negative territory.",
    },
    {
        "ticker": "XLV",
        "display_ticker": "$XLV",
        "name": "Health Care Select Sector SPDR",
        "industry": "US Healthcare & Pharmaceuticals",
        "theme": "Defensive Quality & Mean Reversion",
        "order": "1st Order (Direct)",
        "horizon": "1_to_3_months",
        "horizon_label": "1–3 Months",
        "macro_driver": "High-quality defensive growth laggard with >85% Clean Cash Conversion and favorable forward earnings base comparisons.",
        "why_this_trade": "Healthcare has historically lagged during early speculative tech rallies, depressing sector valuations to attractive multi-year discounts. Its non-cyclical recurring revenues and fortress balance sheets provide strong drawdown insulation when market volatility expands.",
        "actionable_direction": "Accumulate $XLV shares for conservative defensive allocation or collar overlay (long stock + covered OTM call + protective OTM put). Size at 3-4% NAV.",
        "invalidation_stop": "Daily close below the 200-day moving average or severe federal legislative price caps on key revenue drugs.",
    },
    {
        "ticker": "DBA",
        "display_ticker": "$DBA / $NTR",
        "name": "Invesco DB Agriculture & Nutrien",
        "industry": "Agricultural Commodities & Fertilizer",
        "theme": "Reflation & Energy Supply",
        "order": "1st Order (Direct)",
        "horizon": "1_to_3_months",
        "horizon_label": "1–3 Months",
        "macro_driver": "Commercial hedger accumulation in grains/softs, extreme weather disruption to crop yields, and rising fertilizer input costs.",
        "why_this_trade": "Agricultural commodities offer zero correlation to tech mega-caps and high correlation to raw food inflation. Commercial hedgers (smart money) have shifted net-long across softs and corn, signaling cyclical bottoming while retail participation remains near historical lows.",
        "actionable_direction": "Buy $DBA equity or combine with high-FCF fertilizer producer $NTR on dips. Size at 2-3% NAV.",
        "invalidation_stop": "Daily close below recent cyclical base support or sudden collapse in global fertilizer prices.",
    },
    {
        "ticker": "EQT",
        "display_ticker": "$EQT",
        "name": "EQT Corporation",
        "industry": "Natural Gas Exploration & Production",
        "theme": "Reflation & Energy Supply",
        "order": "1st Order (Direct)",
        "horizon": "1_to_3_months",
        "horizon_label": "1–3 Months",
        "macro_driver": "Pure-play Appalachian natural gas producer positioned to supply AI hyperscale datacenter baseload power and Gulf Coast LNG export terminals.",
        "why_this_trade": "Unlike retail commodity funds (like $UNG) that suffer continuous contango roll yield decay, EQT owns low-breakeven physical reserves with long production lives. AI datacenters require 24/7 non-intermittent power that only natural gas and nuclear can deliver at scale over the next 24 months.",
        "actionable_direction": "Accumulate EQT common stock on dips toward the lower third of its 52-week trading range. Size at 2-4% NAV.",
        "invalidation_stop": "Daily close below 52-week support ($32.50) or prompt Henry Hub natural gas futures breaking below $1.80/MMBtu.",
    },
    {
        "ticker": "KWEB",
        "display_ticker": "$KWEB / $FXI",
        "name": "KraneShares CSI China Internet ETF",
        "industry": "International Tech & E-Commerce",
        "theme": "Global Valuation Convergence",
        "order": "1st Order (Direct)",
        "horizon": "1_to_3_months",
        "horizon_label": "1–3 Months",
        "macro_driver": "PBOC monetary easing, sovereign fiscal stimulus packages, and extreme valuation compression relative to US mega-cap tech.",
        "why_this_trade": "Chinese internet equities trade at 60%+ discounts to US counterparts on EV/EBITDA and Free Cash Flow Yields despite holding net cash balances equal to 25-40% of their market caps. As PBOC injects liquidity and central authorities support equities, mean reversion generates violent upside bursts.",
        "actionable_direction": "Tactical long via $KWEB or defined-risk 3-month Call Debit Spreads. Size conservatively at 2% NAV given sub-national geopolitical risks.",
        "invalidation_stop": "Daily close below multi-month low support or sudden geopolitical escalation resulting in direct international capital sanctions.",
    },

    # --------------------------------------------------------------------------
    # HORIZON 2: 12 MONTHS (Intermediate / Quad Alignment & FCF Compounders)
    # --------------------------------------------------------------------------
    {
        "ticker": "ANET",
        "display_ticker": "$ANET",
        "name": "Arista Networks Inc.",
        "industry": "High-Speed AI Datacenter Networking",
        "theme": "AI Datacenter Expansion",
        "order": "2nd Order (Downstream Infrastructure)",
        "horizon": "12_months",
        "horizon_label": "12 Months",
        "macro_driver": "Ultra-low-latency Ethernet switching infrastructure solving the critical inter-GPU communications bottleneck in hyperscaler AI clusters.",
        "why_this_trade": "As AI model parameters scale from billions to trillions, GPU clusters spend up to 40% of compute time waiting on inter-node data exchange. Arista's EOS software and high-throughput switching hardware dominate hyperscaler data centers. Pristine balance sheet with zero net debt and >90% Clean Cash Conversion.",
        "actionable_direction": "Core 12-month compounder. Accumulate on any pullbacks to the 50-day moving average or cyclical mid-range. Target position 4-5% NAV.",
        "invalidation_stop": "Weekly close below the 200-day moving average or loss of top-tier cloud hyperscaler supplier allocation to proprietary optical fabrics.",
    },
    {
        "ticker": "MPWR",
        "display_ticker": "$MPWR",
        "name": "Monolithic Power Systems",
        "industry": "AI Server High-Density Power Management",
        "theme": "AI Datacenter Expansion",
        "order": "2nd Order (Downstream Infrastructure)",
        "horizon": "12_months",
        "horizon_label": "12 Months",
        "macro_driver": "Monolithic power delivery integrated circuits required to deliver thousands of amperes of clean power to high-wattage AI accelerators.",
        "why_this_trade": "Each modern AI server rack requires massive electrical power management, increasing semiconductor silicon dollar content per server by 3x–5x over legacy servers. MPWR has industry-leading gross margins (>55%) and zero long-term debt, compounding through both semiconductor upcycles and enterprise infrastructure buildouts.",
        "actionable_direction": "Accumulate in tranches on cyclical pullbacks toward the 2-year range median. Size at 3-4% NAV.",
        "invalidation_stop": "Weekly close below the 2-year cyclical support base or sustained market share loss in flagship accelerator server reference designs.",
    },
    {
        "ticker": "LRCX",
        "display_ticker": "$LRCX",
        "name": "Lam Research Corporation",
        "industry": "Wafer Fab Equipment (WFE)",
        "theme": "AI Datacenter Expansion",
        "order": "2nd Order (Downstream Infrastructure)",
        "horizon": "12_months",
        "horizon_label": "12 Months",
        "macro_driver": "Advanced etch and deposition tools essential for High-Bandwidth Memory (HBM3e/HBM4) multi-die 3D stacking and advanced gate-all-around (GAA) logic.",
        "why_this_trade": "HBM memory packaging is the primary physical gating factor for AI server shipment velocity. Every additional GPU requires 8 to 12 HBM dies stacked with precise atomic etch and deposition. LRCX captures massive recurring high-margin service revenue alongside equipment sales, delivering 25%+ ROIC.",
        "actionable_direction": "Buy on cyclical pullbacks toward the 200-day SMA. Use 12-month horizon to compound through memory capex recovery. Size at 3-4% NAV.",
        "invalidation_stop": "Monthly close below 2-year cyclical base or sweeping export bans that completely halt non-advanced trailing-edge equipment deliveries.",
    },
    {
        "ticker": "WMB",
        "display_ticker": "$WMB",
        "name": "The Williams Companies",
        "industry": "Natural Gas Midstream Pipelines",
        "theme": "Reflation & Energy Supply",
        "order": "2nd Order (Downstream Infrastructure)",
        "horizon": "12_months",
        "horizon_label": "12 Months",
        "macro_driver": "Transco pipeline network handling ~30% of total US natural gas volume, directly feeding AI hyperscale datacenter corridors and LNG export docks.",
        "why_this_trade": "WMB operates the irreplaceable physical toll-road pipeline network across the eastern US corridor where hyperscalers are constructing gigawatt-scale data campuses. Long-term take-or-pay fee contracts guarantee cash flow stability independent of commodity price volatility, yielding a reliable 4.5%+ dividend backed by steady FCF.",
        "actionable_direction": "Core intermediate compounder. Buy on dips toward the 50-day moving average with dividend reinvestment. Size at 4% NAV.",
        "invalidation_stop": "Weekly close below 200-day SMA or major federal regulatory revocation of interstate pipeline operating rights.",
    },
    {
        "ticker": "TPL",
        "display_ticker": "$TPL",
        "name": "Texas Pacific Land Corporation",
        "industry": "Permian Oil, Gas & Water Royalties",
        "theme": "Reflation & Energy Supply",
        "order": "1st Order (Direct)",
        "horizon": "12_months",
        "horizon_label": "12 Months",
        "macro_driver": "Pure-play royalty owner across ~880,000 acres in the core Permian Basin with 90%+ Free Cash Flow margins and zero capital expenditure inflation.",
        "why_this_trade": "TPL is the ultimate inflation and debasement armor. Because it owns the underlying surface and mineral royalties rather than operating drilling rigs, it incurs zero capex, zero steel inflation, and zero labor cost inflation. When operators produce oil, gas, or recycle brackish water, TPL collects cash royalties straight to its balance sheet.",
        "actionable_direction": "Accumulate on pullbacks into the 52-week or 2-year range median. Exceptional long-term compounder. Size at 3-5% NAV.",
        "invalidation_stop": "Weekly close below 2-year cyclical support or sustained collapse in Permian basin drilling permits below pandemic-era lows.",
    },
    {
        "ticker": "LMT",
        "display_ticker": "$LMT",
        "name": "Lockheed Martin Corporation",
        "industry": "Aerospace & Defense",
        "theme": "Sovereign Debt Dominance",
        "order": "1st Order (Direct)",
        "horizon": "12_months",
        "horizon_label": "12 Months",
        "macro_driver": "Structural expansion in global defense spending budgets (NATO 2%+ GDP compliance, Indo-Pacific deterrence, US Paradigm C defense outlays).",
        "why_this_trade": "Global geopolitical friction guarantees multi-year backlog expansion for flagship platforms (F-35, HIMARS, PAC-3, JASSM). Backlog stands at all-time highs exceeding $160B with guaranteed US government backing, providing rock-solid earnings visibility, growing dividend distributions, and heavy share buybacks.",
        "actionable_direction": "Buy on valuation pullbacks toward the lower boundary of its 2-year cyclical range. Size at 3-4% NAV.",
        "invalidation_stop": "Monthly close below 2-year base support ($410) or comprehensive bipartisan federal defense budget sequestration.",
    },
    {
        "ticker": "GWW",
        "display_ticker": "$GWW",
        "name": "W.W. Grainger Inc.",
        "industry": "Industrial Supplies & MRO Distribution",
        "theme": "Yield Curve Steepening & Reshoring",
        "order": "2nd Order (Downstream Infrastructure)",
        "horizon": "12_months",
        "horizon_label": "12 Months",
        "macro_driver": "Domestic manufacturing reshoring, CHIPS/IRA industrial buildout, and B2B supply-chain inventory restocking with strong pricing pass-through power.",
        "why_this_trade": "Grainger is the premier institutional distributor of maintenance, repair, and operating (MRO) supplies. Its automated distribution centers and proprietary digital ordering give it immense pricing power over fragmented suppliers, generating consistent 30%+ Return on Invested Capital (ROIC).",
        "actionable_direction": "Accumulate on cyclical dips to the 200-day moving average. Hold as a high-quality compounder benefiting from nominal GDP growth. Size at 3-4% NAV.",
        "invalidation_stop": "Weekly close below 200-day moving average or sharp contraction in ISM Manufacturing PMI below 42 for consecutive quarters.",
    },
    {
        "ticker": "AVUV",
        "display_ticker": "$AVUV / $IWM",
        "name": "Avantis US Small Cap Value ETF",
        "industry": "US Small-Cap Value (Quality-Filtered)",
        "theme": "Reflation & Credit Recovery",
        "order": "2nd Order (Downstream Infrastructure)",
        "horizon": "12_months",
        "horizon_label": "12 Months",
        "macro_driver": "AQR/Verdad style small-cap recovery setup, 42 Macro corporate profitability rebound, and historical 25-year valuation discount vs S&P 500 Large-Cap.",
        "why_this_trade": "Unlike the standard Russell 2000 ($IWM) where ~40% of components are non-earning zombie firms, $AVUV screens strictly for high profitability and low debt. As interest rates peak and the yield curve steepens, profitable small-caps enjoy massive multiple expansion from historical valuation troughs.",
        "actionable_direction": "Core intermediate allocation. Accumulate in monthly installments or on broad market dips. Size at 4-6% NAV.",
        "invalidation_stop": "Weekly close below 2-year range support or severe credit spread blow-out (HY spreads > 600 bps).",
    },
    {
        "ticker": "IVOL",
        "display_ticker": "$IVOL",
        "name": "Quadratic Interest Rate Volatility ETF",
        "industry": "Rates / 2s10s Yield Curve Steepener",
        "theme": "Yield Curve Steepening",
        "order": "2nd Order (Downstream Infrastructure)",
        "horizon": "12_months",
        "horizon_label": "12 Months",
        "macro_driver": "Structural 2s10s yield curve steepening driven by $12T+ forward US Treasury debt issuance colliding with Fed easing bias.",
        "why_this_trade": "IVOL owns TIPS combined with long OTC swaption options that profit directly when the 2s10s Treasury yield curve steepens and interest rate volatility rises. Acts as a brilliant portfolio diversifier that generates asymmetric capital gains during sovereign bond supply indigestion.",
        "actionable_direction": "Allocate as a structural portfolio hedge against bond market instability and curve steepening. Size at 3-5% NAV.",
        "invalidation_stop": "Sustained re-inversion of the 2s10s curve below -50 bps or prolonged collapse in interest rate volatility (MOVE index < 65).",
    },
    {
        "ticker": "VT",
        "display_ticker": "$VT / $EWJ",
        "name": "Vanguard Total World Stock & Japan",
        "industry": "Global Equities (ex-US Valuation Arbitrage)",
        "theme": "Global Valuation Convergence",
        "order": "2nd Order (Downstream Infrastructure)",
        "horizon": "12_months",
        "horizon_label": "12 Months",
        "macro_driver": "Global AI productivity diffusion, corporate governance reforms in Japan (TSE P/B targets), and 35% valuation discount vs US mega-cap multiples.",
        "why_this_trade": "US equity concentration is at 100-year extremes (~70% of MSCI World). International developed markets, particularly Japan, are reforming corporate capital allocation, unbundling cross-shareholdings, and increasing share buybacks at 13x forward earnings versus 22x for the S&P 500.",
        "actionable_direction": "Systematically accumulate on mid-cycle consolidations to reduce single-country US concentration risk. Size at 5-8% NAV.",
        "invalidation_stop": "Weekly close below 2-year range low or catastrophic spike in trade tariffs shutting down international commerce.",
    },
    {
        "ticker": "VNQ",
        "display_ticker": "$VNQ / $XLRE",
        "name": "Vanguard Real Estate ETF",
        "industry": "Commercial REITs & Data Centers",
        "theme": "Yield Curve Steepening & Real Assets",
        "order": "2nd Order (Downstream Infrastructure)",
        "horizon": "12_months",
        "horizon_label": "12 Months",
        "macro_driver": "Lagged interest-rate sensitive sector inflecting upward as Fed cuts benchmark rates and commercial refinancing distress resolves into equity recapitalizations.",
        "why_this_trade": "High interest rates triggered the steepest REIT drawdown since 2008. Over 60% of modern REIT asset value is in non-office secular growth sectors (hyperscale data centers, cell towers, modern logistics warehouses). At 4%+ dividend yields backed by contractual rent escalators, REITs offer compelling total return.",
        "actionable_direction": "Accumulate in tranches as 10-year Treasury yields stabilize below 4.50%. Size at 3-4% NAV.",
        "invalidation_stop": "Weekly close below 52-week support or sustained acceleration in commercial mortgage default cascades spreading to tier-1 banks.",
    },

    # --------------------------------------------------------------------------
    # HORIZON 3: 3+ YEARS (Secular / Sovereign Debt & Paradigm C Dominance)
    # --------------------------------------------------------------------------
    {
        "ticker": "CEG",
        "display_ticker": "$CEG",
        "name": "Constellation Energy Corporation",
        "industry": "Baseload Nuclear Power Generation",
        "theme": "AI Datacenter Expansion & Clean Power",
        "order": "3rd Order (Knock-On / Policy & Wealth)",
        "horizon": "3_plus_years",
        "horizon_label": "3+ Years",
        "macro_driver": "Electricity grid interconnect capacity is the #1 physical bottleneck of the AI revolution; 20-year hyperscaler nuclear power purchase agreements (PPAs).",
        "why_this_trade": "AI data centers cannot run on intermittent wind and solar alone; they require 24/7 carbon-free baseload electricity. Constellation is the largest nuclear operator in the US, signing landmark 20-year private PPAs (such as the Crane Clean Energy Center restart with Microsoft) at premium fixed power prices ($100+/MWh), unlocking multi-decade contractually secured cash flows.",
        "actionable_direction": "Core secular holding. Buy during broad market drawdowns or when 14-month RSI consolidates below 65. Size at 4-6% NAV.",
        "invalidation_stop": "Secular break below the 200-week moving average or sweeping federal legislation prohibiting behind-the-meter colocation of data centers at nuclear facilities.",
    },
    {
        "ticker": "CCJ",
        "display_ticker": "$CCJ / $SRUUF",
        "name": "Cameco Corporation & Sprott Uranium",
        "industry": "Uranium Mining & Nuclear Fuel Cycle",
        "theme": "Secular Energy & Resource Scarcity",
        "order": "3rd Order (Knock-On / Policy & Wealth)",
        "horizon": "3_plus_years",
        "horizon_label": "3+ Years",
        "macro_driver": "Decade-long upstream Capex/DD&A deficit (0.68x) colliding with global nuclear fleet life extensions, SMR buildouts, and Western utility procurement bans on Russian supply.",
        "why_this_trade": "Uranium is in a structural primary supply deficit that cannot be rapidly bridged because building a new tier-1 uranium mine takes 10–15 years of permitting and development. Utilities are forced to contract long-term at escalating replacement-cost prices. Cameco controls the world's highest-grade low-cost mines (McArthur River, Cigar Lake) and Westinghouse conversion/enrichment assets.",
        "actionable_direction": "Accumulate Cameco ($CCJ) or Sprott Physical Uranium ($SRUUF) on pullbacks toward the 200-day SMA. Size at 3-5% NAV.",
        "invalidation_stop": "Sustained monthly close below 2-year cyclical support or a major global nuclear accident causing widespread fleet shutdowns.",
    },
    {
        "ticker": "COPX",
        "display_ticker": "$COPX / $FCX",
        "name": "Global X Copper Miners ETF & Freeport",
        "industry": "Copper Mining & Electrification Reserves",
        "theme": "Secular Energy & Resource Scarcity",
        "order": "3rd Order (Knock-On / Policy & Wealth)",
        "horizon": "3_plus_years",
        "horizon_label": "3+ Years",
        "macro_driver": "Upstream Capex/DD&A at 0.79x, declining average ore grades, and 16-year average permitting lead times for new mines colliding with AI grid, EV, and defense copper demand.",
        "why_this_trade": "Copper is the indispensable physical conductor of the modern electrical era. A modern AI data center requires up to 50,000 tons of copper for power transmission and transformer windings. With global copper inventories at historically depressed days-of-consumption and major existing mines aging, the incentive price for new supply exceeds $5.50/lb.",
        "actionable_direction": "Secular supercycle holding. Accumulate on pullbacks into the lower half of the 5-year relative ratio vs S&P 500. Size at 3-5% NAV.",
        "invalidation_stop": "Monthly close below 5-year base support or technological obsolescence of copper via superconducting room-temperature conductors.",
    },
    {
        "ticker": "WPM",
        "display_ticker": "$WPM",
        "name": "Wheaton Precious Metals Corp.",
        "industry": "Precious Metals Royalty & Streaming",
        "theme": "Sovereign Debt Dominance & Hard Assets",
        "order": "1st Order (Direct)",
        "horizon": "3_plus_years",
        "horizon_label": "3+ Years",
        "macro_driver": "Sovereign central bank de-dollarization gold accumulation (+1.85σ residual vs real yields), negative US NIIP (-$24T), and monetary debasement protection.",
        "why_this_trade": "Wheaton provides fixed-cost streaming exposure to gold and silver: it pays fixed pre-agreed prices (~$450/oz gold, ~$5/oz silver) to mining partners in exchange for life-of-mine production. It captures 100% of gold price appreciation with zero exposure to mine sustaining capital cost inflation or fuel price spikes, delivering pristine 70%+ cash margins.",
        "actionable_direction": "Core wealth preservation and debasement hedge. Accumulate on cyclical dips to the 200-day SMA. Size at 4-6% NAV.",
        "invalidation_stop": "Monthly close below 3-year support or comprehensive international return to a disciplined gold-backed sovereign currency standard that eliminates debasement risk.",
    },
    {
        "ticker": "XLE",
        "display_ticker": "$XLE",
        "name": "Energy Select Sector SPDR Fund",
        "industry": "US Oil & Gas Mega-Cap Producers",
        "theme": "Reflation & Energy Supply",
        "order": "3rd Order (Knock-On / Policy & Wealth)",
        "horizon": "3_plus_years",
        "horizon_label": "3+ Years",
        "macro_driver": "Upstream capital discipline (Capex/DD&A < 0.85x), record share buybacks and dividend distributions, and the historic under-valuation of physical energy vs monetary assets.",
        "why_this_trade": "Energy companies have fundamentally shifted business models from debt-fueled drilling to disciplined free cash flow distribution. S&P energy weighting sits near multi-decade lows (~4% of index) despite generating ~10% of total S&P earnings. Mean reversion of the Gold/Oil ratio from 38x toward 20x generates massive secular outperformance.",
        "actionable_direction": "Secular foundation holding for inflationary regimes. Accumulate on broad market pullbacks. Size at 4-6% NAV.",
        "invalidation_stop": "Secular monthly close below 5-year support or rapid cost-effective commercialization of grid-scale nuclear fusion that renders hydrocarbons obsolete.",
    },
    {
        "ticker": "JPM",
        "display_ticker": "$JPM",
        "name": "JPMorgan Chase & Co.",
        "industry": "Money-Center Banking & Wealth",
        "theme": "Yield Curve Steepening & Wealth Flows",
        "order": "3rd Order (Knock-On / Policy & Wealth)",
        "horizon": "3_plus_years",
        "horizon_label": "3+ Years",
        "macro_driver": "Paradigm C regulatory SLR deregulation, flight-to-fortress commercial deposit consolidation, and top-decile wealth management fee growth.",
        "why_this_trade": "JPMorgan is the undisputed sovereign-grade commercial institution in the Western banking system. During regional bank instability, deposits consolidate directly into JPM. Under Paradigm C fiscal dominance, JPM acts as the indispensable primary dealer warehousing Treasury debt while earning high risk-free spreads at the Fed.",
        "actionable_direction": "Accumulate on pullbacks into the 200-day SMA. Size at 4-5% NAV.",
        "invalidation_stop": "Monthly close below the 200-week moving average or radical sovereign nationalization of commercial banking deposit franchises.",
    },
    {
        "ticker": "PLTR",
        "display_ticker": "$PLTR",
        "name": "Palantir Technologies Inc.",
        "industry": "Enterprise AI & Defense Logistics Software",
        "theme": "AI Datacenter Expansion & Margin Defense",
        "order": "3rd Order (Knock-On / Policy & Wealth)",
        "horizon": "3_plus_years",
        "horizon_label": "3+ Years",
        "macro_driver": "Corporate margin defense via Artificial Intelligence Platform (AIP) enterprise workflow automation and US Department of Defense Project Maven logistics contracts.",
        "why_this_trade": "While hyperscalers build the physical infrastructure, Palantir provides the ontology operating system that translates raw large language models into actionable enterprise decisions with strict data security. With GAAP profitability secured and zero long-term debt, customer bootcamps are converting into 100%+ net dollar retention rates.",
        "actionable_direction": "Accumulate in tranches during valuation consolidations or pullbacks toward the 50-day EMA. Size at 3-4% NAV.",
        "invalidation_stop": "Weekly close below 2-year base support or sustained deceleration in US commercial revenue growth below 20% YoY.",
    },
    {
        "ticker": "BKNG",
        "display_ticker": "$BKNG",
        "name": "Booking Holdings Inc.",
        "industry": "Global Online Travel & Experiential Luxury",
        "theme": "Sovereign Debt Dominance & Wealth Impulse",
        "order": "3rd Order (Knock-On / Policy & Wealth)",
        "horizon": "3_plus_years",
        "horizon_label": "3+ Years",
        "macro_driver": "Captures Prometheus Kalecki-Levy top-decile household wealth effect, sovereign interest dissaving impulse, and global asset-light travel compounder.",
        "why_this_trade": "Due to $1.2T+ annual sovereign interest payments flowing to domestic asset owners, top-decile households experience an ongoing wealth transfer that fuels non-discretionary experiential spending. Booking operates a pure asset-light network marketplace with 30%+ ROIC and massive share repurchases (>8% of float annually).",
        "actionable_direction": "Accumulate on cyclical travel pullbacks into the 200-day moving average. Size at 3-4% NAV.",
        "invalidation_stop": "Weekly close below 200-day SMA or severe global pandemic shutting down cross-border travel.",
    },
    {
        "ticker": "EEM",
        "display_ticker": "$EEM / $INDA",
        "name": "iShares MSCI Emerging Markets ETF",
        "industry": "Emerging Market Equities & Demographics",
        "theme": "Global Valuation Convergence & Multipolarity",
        "order": "3rd Order (Knock-On / Policy & Wealth)",
        "horizon": "3_plus_years",
        "horizon_label": "3+ Years",
        "macro_driver": "15-year structural valuation trough vs S&P 500, multipolar trade settlement, and demographic expansion in India, Southeast Asia, and Latin America.",
        "why_this_trade": "Emerging markets offer younger median demographics, lower debt-to-GDP ratios than Western sovereigns, and dominant control of critical raw materials (lithium, copper, agriculture). As global trade diversifies away from single-currency dollar settlement, international capital reallocates to undervalued EM equity markets.",
        "actionable_direction": "Core secular allocation. Accumulate systematically on dollar strength or broad market pullbacks. Size at 4-6% NAV.",
        "invalidation_stop": "Monthly close below 5-year valuation base or sweeping global trade embargoes halting cross-border commerce.",
    },
]

# Baseline prices fallback if external APIs are completely unreachable
DEFAULT_TRADE_IDEAS_PRICES: Dict[str, float] = {
    "NVDA": 138.50, "CBOE": 218.40, "BTC-USD": 68200.0, "USO": 75.30, "TLT": 92.10,
    "XLF": 46.80, "XLV": 149.20, "DBA": 25.10, "EQT": 39.40, "KWEB": 31.80,
    "ANET": 418.00, "MPWR": 772.00, "LRCX": 79.50, "WMB": 48.60, "TPL": 1150.00,
    "LMT": 498.00, "GWW": 995.00, "AVUV": 95.40, "IVOL": 20.90, "VT": 118.20,
    "VNQ": 89.40, "CEG": 275.00, "CCJ": 55.40, "COPX": 45.60, "WPM": 69.20,
    "XLE": 91.80, "JPM": 224.50, "PLTR": 44.50, "BKNG": 4480.00, "EEM": 44.10,
    "SPY": 586.50, "GC=F": 2745.0, "CL=F": 71.50, "HG=F": 4.40,
}


class TradeIdeasEngine:
    """Master engine orchestrating multi-horizon trade ideas, macro regimes, and database caching."""

    @classmethod
    def _calc_rsi(cls, series: pd.Series, period: int = 14) -> float:
        """Calculates standard Wilders RSI over the given period."""
        if len(series) < period + 1:
            return 50.0
        delta = series.diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)
        avg_gain = gain.rolling(window=period, min_periods=period).mean()
        avg_loss = loss.rolling(window=period, min_periods=period).mean()
        rs = avg_gain / avg_loss.replace(0, np.nan)
        rsi = 100.0 - (100.0 / (1.0 + rs))
        last_val = rsi.dropna().iloc[-1] if not rsi.dropna().empty else 50.0
        return round(float(last_val), 1)

    @classmethod
    def _compute_vams_and_ranges(cls, series: pd.Series) -> Dict[str, Any]:
        """Calculates VAMS (Volume-Adjusted Momentum Score) and 15D Probable Range."""
        s = series.dropna()
        curr_p = float(s.iloc[-1]) if not s.empty else 100.0
        if len(s) < 25:
            return {
                "vams_state": 0,
                "vams_label": "NEUTRAL (0)",
                "prob_low": round(curr_p * 0.95, 2),
                "prob_high": round(curr_p * 1.05, 2),
            }

        log_ret = np.log(s / s.shift(1))
        rv_21d = max(0.05, float(log_ret.rolling(21).std().iloc[-1] * np.sqrt(252)))
        ema_10 = float(s.ewm(span=10, adjust=False).mean().iloc[-1])
        ema_21 = float(s.ewm(span=21, adjust=False).mean().iloc[-1])
        ema_63 = float(s.ewm(span=63, adjust=False).mean().iloc[-1])

        p_mom = (
            ((curr_p / max(1e-6, ema_21) - 1.0) / (rv_21d / np.sqrt(12))) * 0.50
            + ((curr_p / max(1e-6, ema_63) - 1.0) / (rv_21d / 2.0)) * 0.30
            + ((ema_10 / max(1e-6, ema_21) - 1.0) / (rv_21d / 5.0)) * 0.20
        )
        vams_state = 1 if p_mom > 0.20 else (-1 if p_mom < -0.20 else 0)
        vams_label = "BULLISH (+1)" if vams_state == 1 else ("BEARISH (-1)" if vams_state == -1 else "NEUTRAL (0)")

        daily_sigma_15d = curr_p * (rv_21d / np.sqrt(252)) * np.sqrt(15)
        pivot_15d = 0.5 * curr_p + 0.5 * ema_21
        prob_low = round(pivot_15d - 1.65 * daily_sigma_15d, 2)
        prob_high = round(pivot_15d + 1.65 * daily_sigma_15d, 2)

        return {
            "vams_state": vams_state,
            "vams_label": vams_label,
            "prob_low": prob_low,
            "prob_high": prob_high,
        }

    @classmethod
    def get_macro_context(cls) -> Dict[str, Any]:
        """Pulls centralized macro states across 42 Macro, US Net Liquidity, and OpEx Plumbing."""
        active_regime = "REFLATION"
        risk_on_pct = 72.0
        try:
            try:
                from backend.app.quant_engine.forty_two_macro_engine import FortyTwoMacroLiveBuilder
            except ImportError:
                from app.quant_engine.forty_two_macro_engine import FortyTwoMacroLiveBuilder
            ftm = FortyTwoMacroLiveBuilder.build_live_42macro_dashboard()
            active_regime = ftm.get("global_macro_risk_matrix", {}).get("active_regime_label", "REFLATION")
            risk_on_pct = float(ftm.get("global_macro_risk_matrix", {}).get("probability_risk_on_pct", 72.0))
        except Exception:
            pass

        net_liq_val = 5820.4
        net_liq_4w = 42.5
        try:
            try:
                from backend.app.quant_engine.liquidity_engine import LiquidityEngine
            except ImportError:
                from app.quant_engine.liquidity_engine import LiquidityEngine
            liq = LiquidityEngine.build_complete_liquidity_payload(force_refresh=False)
            net_liq_val = float(liq.get("us_net_liquidity", {}).get("net_liquidity_usd_bn") or 5820.4)
            net_liq_4w = float(liq.get("us_net_liquidity", {}).get("roc_4w_usd_bn") or 42.5)
        except Exception:
            pass

        # OpEx & Dealer Gamma Plumbing State
        opex_phase = "STRUCTURAL PIN"
        gamma_regime = "LONG GAMMA (Low Volatility Pin)"
        term_structure = "CONTANGO"
        move_index = 96.5
        try:
            try:
                from backend.app.quant_engine.macro_plumbing_state import MacroPlumbingState
            except ImportError:
                from app.quant_engine.macro_plumbing_state import MacroPlumbingState
            plumbing = MacroPlumbingState.build_complete_plumbing_and_options_state(force_refresh=False)
            opex_phase = plumbing.get("opex_calendar", {}).get("phase_label", "STRUCTURAL PIN")
            gamma_regime = plumbing.get("active_hydraulic_regime", {}).get("state_name", "LONG GAMMA (Low Volatility Pin)")
            term_structure = plumbing.get("market_volatility_proxies", {}).get("vix_term_structure_status", "CONTANGO")
            move_index = float(plumbing.get("market_volatility_proxies", {}).get("move_index_val", 96.5))
        except Exception:
            pass

        return {
            "active_regime": active_regime,
            "probability_risk_on_pct": risk_on_pct,
            "net_liquidity_usd_bn": round(net_liq_val, 1),
            "net_liquidity_4w_roc_bn": round(net_liq_4w, 1),
            "net_liquidity_status": "EXPANSIONARY IMPULSE" if net_liq_4w > 0 else "CONTRACTIONARY DRAIN",
            "opex_cycle_phase": opex_phase,
            "dealer_gamma_regime": gamma_regime,
            "term_structure": term_structure,
            "move_index": move_index,
            "accord_2_watch": True if net_liq_val < 5700.0 or move_index > 115.0 else False,
        }

    @classmethod
    def build_trade_ideas_payload(cls, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Builds or retrieves the unified Trade Ideas payload.
        Checks:
          1. In-memory cache (<1ms)
          2. SQLite/PostgreSQL Database Cache via StockCompressedStore (<15ms)
          3. Live computation via yfinance / CoinGecko / Macro engines if cache expired or force_refresh=True.
        """
        now = time.time()
        # 1. Fast In-Memory Cache Check
        if not force_refresh and _TRADE_IDEAS_MEMORY_CACHE["payload"] and (now - _TRADE_IDEAS_MEMORY_CACHE["timestamp"]) < _TRADE_IDEAS_MEMORY_CACHE["ttl_sec"]:
            cached = dict(_TRADE_IDEAS_MEMORY_CACHE["payload"])
            cached["_cache_hit"] = True
            cached["_cache_tier"] = "memory"
            return cached

        # 2. Database Cache Check via StockCompressedStore (<15ms)
        if not force_refresh:
            try:
                try:
                    from backend.app.db.stock_compressed_store import StockCompressedStore
                except ImportError:
                    from app.db.stock_compressed_store import StockCompressedStore
                db_cached = StockCompressedStore.get_macro_liquidity_payload("trade_ideas_master_payload", max_age_seconds=900)
                if db_cached:
                    _TRADE_IDEAS_MEMORY_CACHE["payload"] = db_cached
                    _TRADE_IDEAS_MEMORY_CACHE["timestamp"] = now
                    db_cached["_cache_hit"] = True
                    db_cached["_cache_tier"] = "database"
                    return db_cached
            except Exception as e:
                logger.warning(f"StockCompressedStore cache check notice: {e}")

        # 3. Live Re-Computation
        logger.info("[TradeIdeasEngine] Re-computing full unified trade ideas payload...")
        macro_ctx = cls.get_macro_context()

        # Gather all distinct tickers to batch download 5 years of daily bars
        all_tickers = list({c["ticker"] for c in TRADE_IDEAS_UNIVERSE} | {"SPY", "GC=F", "CL=F", "HG=F"})

        close_df = pd.DataFrame()
        try:
            try:
                from backend.app.config import fetch_ohlcv_Slot_with_failover
            except ImportError:
                from app.config import fetch_ohlcv_Slot_with_failover
            c_df, _ = fetch_ohlcv_Slot_with_failover(all_tickers, period="5y")
            if isinstance(c_df, pd.DataFrame) and not c_df.empty:
                close_df = c_df
        except Exception:
            pass

        if close_df.empty:
            try:
                raw = yf.download(all_tickers, period="5y", interval="1d", progress=False, auto_adjust=True)
                if isinstance(raw.columns, pd.MultiIndex) and "Close" in raw.columns.levels[0]:
                    close_df = raw["Close"]
                else:
                    close_df = raw.get("Close", raw)
            except Exception as yf_err:
                logger.warning(f"[TradeIdeasEngine] yfinance batch download warning: {yf_err}")

        # Gold/Oil ratio for secular macro context
        gold_oil_ratio = 38.5
        if isinstance(close_df, pd.DataFrame) and "GC=F" in close_df.columns and "CL=F" in close_df.columns:
            gc_s = close_df["GC=F"].dropna()
            cl_s = close_df["CL=F"].dropna()
            if not gc_s.empty and not cl_s.empty and float(cl_s.iloc[-1]) > 1.0:
                gold_oil_ratio = round(float(gc_s.iloc[-1]) / float(cl_s.iloc[-1]), 1)

        spy_series = close_df["SPY"].dropna() if isinstance(close_df, pd.DataFrame) and "SPY" in close_df.columns else pd.Series()

        # Initialize Output Structure for the 3 Timeframes
        horizons_dict: Dict[str, Dict[str, Any]] = {
            "1_to_3_months": {
                "key": "1_to_3_months",
                "label": "1-3 months",
                "subtitle": f"Tactical Horizon • Evaluated on 63D/52W Range Position, 14-Day Daily RSI, 15D Probable Range, and OpEx Dealer Gamma (Active: {macro_ctx['opex_cycle_phase']})",
                "range_bar_label": "52W Tactical Range Position",
                "priority_1_unloved_pivots": [],
                "priority_2_trend_compounders": [],
                "played_out_at_highs": [],
                "all_ideas": [],
            },
            "12_months": {
                "key": "12_months",
                "label": "12 months",
                "subtitle": f"Cyclical Horizon • Evaluated on 2-Year (104-Week) Range Position, 14-Week Weekly RSI, 200-Day SMA Distance, and Quad Alignment (Regime: {macro_ctx['active_regime']})",
                "range_bar_label": "2-Year Cyclical Range Position",
                "priority_1_unloved_pivots": [],
                "priority_2_trend_compounders": [],
                "played_out_at_highs": [],
                "all_ideas": [],
            },
            "3_plus_years": {
                "key": "3_plus_years",
                "label": "3+ Years",
                "subtitle": f"Secular Horizon • Evaluated on 5-Year Relative-to-S&P 500 Percentile, 14-Month RSI, Sovereign Debt Dominance & Debasement Armor (Live Gold/Oil: {gold_oil_ratio}x)",
                "range_bar_label": "5-Year Relative-to-S&P 500 Percentile",
                "priority_1_unloved_pivots": [],
                "priority_2_trend_compounders": [],
                "played_out_at_highs": [],
                "all_ideas": [],
            },
        }

        # Process Each Candidate
        for cand in TRADE_IDEAS_UNIVERSE:
            tk = cand["ticker"]
            h_key = cand["horizon"]

            # Pull Series
            s = pd.Series(dtype=float)
            if isinstance(close_df, pd.DataFrame) and tk in close_df.columns:
                s = close_df[tk].dropna()

            curr_p = DEFAULT_TRADE_IDEAS_PRICES.get(tk, 100.0)
            if not s.empty:
                val = s.iloc[-1]
                if not np.isnan(val) and float(val) > 0:
                    curr_p = round(float(val), 2)
            else:
                # Synthetic baseline series for missing tickers
                dates = pd.date_range(end=datetime.now(timezone.utc), periods=504, freq="B")
                s = pd.Series(np.linspace(curr_p * 0.85, curr_p, 504), index=dates)

            # Volatility & Probable Range
            pr_data = cls._compute_vams_and_ranges(s)
            vams_state = pr_data["vams_state"]
            vams_label = pr_data["vams_label"]
            prob_low = pr_data["prob_low"]
            prob_high = pr_data["prob_high"]

            # ------------------------------------------------------------------
            # Calculate Horizon-Specific Quantitative Metrics
            # ------------------------------------------------------------------
            if h_key == "1_to_3_months":
                s_52w = s.tail(min(len(s), 252))
                high_val = float(s_52w.max()) if not s_52w.empty else curr_p * 1.15
                low_val = float(s_52w.min()) if not s_52w.empty else curr_p * 0.85
                range_bar_pct = round(((curr_p - low_val) / max(1e-6, high_val - low_val)) * 100.0, 1)
                rsi_val = cls._calc_rsi(s, 14)
                rsi_label = "14D Daily RSI"
                range_bar_label = "52W Range Position"

                # Check if Unloved Pivot, Mid-Runway, or Played Out at Highs
                is_low_pivot = (range_bar_pct <= 48.0) or (rsi_val <= 46.0) or (curr_p <= prob_low * 1.02)
                is_at_highs = (range_bar_pct >= 82.0 and rsi_val >= 64.0) or (range_bar_pct >= 90.0)

                # Dynamic Asymmetry Ratio
                upside_pct = max(10.0, ((high_val - curr_p) / max(1e-6, curr_p)) * 100.0 + 12.0)
                downside_pct = max(3.5, ((curr_p - prob_low) / max(1e-6, curr_p)) * 100.0 * 1.25)
                asym_ratio = round(min(5.5, max(1.8, upside_pct / downside_pct)), 1)

            elif h_key == "12_months":
                s_2y = s.tail(min(len(s), 504))
                high_val = float(s_2y.max()) if not s_2y.empty else curr_p * 1.25
                low_val = float(s_2y.min()) if not s_2y.empty else curr_p * 0.75
                range_bar_pct = round(((curr_p - low_val) / max(1e-6, high_val - low_val)) * 100.0, 1)
                weekly_s = s.resample("W-FRI").last().dropna() if isinstance(s.index, pd.DatetimeIndex) else s.iloc[::5]
                rsi_val = cls._calc_rsi(weekly_s, 14)
                rsi_label = "14W Weekly RSI"
                range_bar_label = "2-Year Cyclical Range"

                sma_200 = float(s.tail(min(len(s), 200)).mean()) if not s.empty else curr_p
                dist_200_pct = round(((curr_p / max(1e-6, sma_200)) - 1.0) * 100.0, 1)

                is_low_pivot = (range_bar_pct <= 52.0) or (rsi_val <= 48.0) or (-12.0 <= dist_200_pct <= 5.0)
                is_at_highs = (range_bar_pct >= 84.0 and rsi_val >= 66.0) or (range_bar_pct >= 90.0 and dist_200_pct >= 18.0)

                upside_pct = max(15.0, ((high_val - curr_p) / max(1e-6, curr_p)) * 100.0 + 15.0)
                downside_pct = max(4.0, abs(dist_200_pct) if dist_200_pct < 0 else 6.0)
                asym_ratio = round(min(5.5, max(1.8, upside_pct / downside_pct)), 1)

            else:  # '3_plus_years'
                s_5y = s.tail(min(len(s), 1260))
                high_val = float(s_5y.max()) if not s_5y.empty else curr_p * 1.50
                low_val = float(s_5y.min()) if not s_5y.empty else curr_p * 0.50
                range_bar_pct = round(((curr_p - low_val) / max(1e-6, high_val - low_val)) * 100.0, 1)

                # Compute 5Y Relative Ratio vs SPY Percentile
                if not spy_series.empty and len(s) >= 30:
                    aligned = pd.concat([s_5y, spy_series.tail(len(s_5y))], axis=1).dropna()
                    if len(aligned) >= 30:
                        ratio = aligned.iloc[:, 0] / aligned.iloc[:, 1].replace(0, np.nan)
                        ratio = ratio.dropna()
                        if not ratio.empty:
                            r_curr = float(ratio.iloc[-1])
                            r_min = float(ratio.min())
                            r_max = float(ratio.max())
                            range_bar_pct = round(((r_curr - r_min) / max(1e-8, r_max - r_min)) * 100.0, 1)

                monthly_s = s.resample("ME").last().dropna() if isinstance(s.index, pd.DatetimeIndex) else s.iloc[::21]
                rsi_val = cls._calc_rsi(monthly_s, 14) if len(monthly_s) >= 16 else cls._calc_rsi(s, 14)
                rsi_label = "14M Monthly RSI"
                range_bar_label = "5-Year Relative-to-SPY Pct"

                is_low_pivot = (range_bar_pct <= 52.0) or (rsi_val <= 50.0)
                is_at_highs = (range_bar_pct >= 85.0 and rsi_val >= 68.0)

                upside_pct = max(25.0, (100.0 - range_bar_pct) * 0.85 + 20.0)
                downside_pct = max(6.0, range_bar_pct * 0.20 + 4.0)
                asym_ratio = round(min(5.5, max(1.8, upside_pct / downside_pct)), 1)

            # Determine Live Entry Timing Label
            if is_at_highs:
                entry_timing = f"EXTENDED AT HIGHS ({range_bar_pct}% Range | {rsi_label} {rsi_val}) — Wait for Pullback"
                bucket = "played_out_at_highs"
            elif is_low_pivot:
                entry_timing = f"LOW-BASE / PULLBACK ZONE ({range_bar_pct}% Range | {rsi_label} {rsi_val}) — Priority Accumulate"
                bucket = "priority_1_unloved_pivots"
            else:
                entry_timing = f"MID-RUNWAY COMPOUNDER ({range_bar_pct}% Range | {rsi_label} {rsi_val})"
                bucket = "priority_2_trend_compounders"

            # Compute 0-100 OutlierScore
            quad_factor = 90.0 if macro_ctx["active_regime"] in ("REFLATION", "GOLDILOCKS") else 75.0
            vams_factor = 95.0 if "BULLISH" in vams_label else (68.0 if "NEUTRAL" in vams_label else 48.0)
            asym_factor = min(98.0, asym_ratio * 20.0)
            timing_factor = 95.0 if bucket == "priority_1_unloved_pivots" else (75.0 if bucket == "priority_2_trend_compounders" else 45.0)
            outlier_score = round(0.25 * quad_factor + 0.25 * vams_factor + 0.25 * asym_factor + 0.25 * timing_factor, 1)

            if outlier_score >= 85.0:
                conviction_tier = "HIGH_CONVICTION_LONG"
            elif outlier_score >= 75.0:
                conviction_tier = "CYCLICAL_MOMENTUM_LONG"
            elif outlier_score >= 65.0:
                conviction_tier = "ACCUMULATE_PULLBACK"
            else:
                conviction_tier = "TACTICAL_HOLD"

            # Compute ML4T Triple-Barrier Meta-Labeling Probability
            meta_label_data = {}
            try:
                try:
                    from app.quant_engine.meta_labeling import MetaLabelingEngine
                except ImportError:
                    from backend.app.quant_engine.meta_labeling import MetaLabelingEngine
                v_score = 1.0 if "BULLISH" in vams_label else (-1.0 if "BEARISH" in vams_label else 0.0)
                macro_throttle = 1.0 if macro_ctx.get("active_regime") in ("REFLATION", "GOLDILOCKS") else (0.5 if macro_ctx.get("active_regime") == "INFLATION" else 0.0)
                meta_label_data = MetaLabelingEngine.evaluate_trade_idea(
                    spot_price=curr_p,
                    vams_score=v_score,
                    ibs=0.25 if bucket == "priority_1_unloved_pivots" else (0.75 if bucket == "played_out_at_highs" else 0.45),
                    rvol_20d=1.6 if bucket == "priority_1_unloved_pivots" else 1.1,
                    residual_z_60d=-2.1 if bucket == "priority_1_unloved_pivots" else (1.8 if bucket == "played_out_at_highs" else -0.3),
                    macro_regime_throttle=macro_throttle,
                    rsi_14d=rsi_val,
                )
            except Exception as ml_err:
                logger.debug(f"[TradeIdeasEngine] Meta-labeling evaluation notice: {ml_err}")

            # Build Formatted Item
            idea_record = {
                **cand,
                "live_price": curr_p,
                "high_val": round(high_val, 2),
                "low_val": round(low_val, 2),
                "range_bar_pct": range_bar_pct,
                "range_bar_label": range_bar_label,
                "rsi": rsi_val,
                "rsi_label": rsi_label,
                "vams_state": vams_state,
                "vams_label": vams_label,
                "prob_low": prob_low,
                "prob_high": prob_high,
                "asymmetry": f"{asym_ratio} : 1",
                "asymmetry_num": asym_ratio,
                "outlier_score": outlier_score,
                "conviction_tier": conviction_tier,
                "live_entry_timing": entry_timing,
                "bucket": bucket,
                "meta_labeling": meta_label_data,
                "probability_of_success": meta_label_data.get("probability_of_success", 0.60),
                "probability_pct": meta_label_data.get("probability_pct", "60%"),
                "meta_verdict": meta_label_data.get("meta_verdict", "SYSTEMATIC ALLOCATION"),
                "meta_badge": meta_label_data.get("verdict_badge", "text-cyan-400 bg-cyan-950/70 border-cyan-800"),
                "triple_barrier": meta_label_data.get("triple_barrier", {}),
            }

            # Route into target horizon and bucket
            horizons_dict[h_key]["all_ideas"].append(idea_record)
            if bucket == "priority_1_unloved_pivots":
                horizons_dict[h_key]["priority_1_unloved_pivots"].append(idea_record)
            elif bucket == "priority_2_trend_compounders":
                horizons_dict[h_key]["priority_2_trend_compounders"].append(idea_record)
            else:
                horizons_dict[h_key]["played_out_at_highs"].append(idea_record)

        # Sort each bucket descending by OutlierScore
        for h_key in horizons_dict:
            horizons_dict[h_key]["priority_1_unloved_pivots"].sort(key=lambda x: x["outlier_score"], reverse=True)
            horizons_dict[h_key]["priority_2_trend_compounders"].sort(key=lambda x: x["outlier_score"], reverse=True)
            horizons_dict[h_key]["played_out_at_highs"].sort(key=lambda x: x["outlier_score"], reverse=True)
            horizons_dict[h_key]["all_ideas"].sort(key=lambda x: x["outlier_score"], reverse=True)

        # Integrated Short-Term Reversals Radar
        reversals_summary = {}
        try:
            try:
                from backend.app.quant_engine.reversal_scanner import ReversalScanner
            except ImportError:
                from app.quant_engine.reversal_scanner import ReversalScanner
            reversals_summary = ReversalScanner.run_reversal_scan(force=force_refresh)
        except Exception as rev_err:
            logger.debug(f"[TradeIdeasEngine] Reversal scan integration notice: {rev_err}")

        # Integrated Statistical Arbitrage & Cointegration Pairs Radar
        stat_arb_summary = {}
        try:
            try:
                from backend.app.quant_engine.statistical_arbitrage import StatisticalArbitrageEngine
            except ImportError:
                from app.quant_engine.statistical_arbitrage import StatisticalArbitrageEngine
            stat_arb_summary = StatisticalArbitrageEngine.scan_stat_arb_pairs(force_refresh=force_refresh, universe_limit=25)
        except Exception as sa_err:
            logger.debug(f"[TradeIdeasEngine] StatArb scan integration notice: {sa_err}")

        payload = {
            "status": "success",
            "as_of_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            "macro_context": macro_ctx,
            "live_gold_oil_ratio": gold_oil_ratio,
            "horizons": horizons_dict,
            "reversals": reversals_summary,
            "statistical_arbitrage": stat_arb_summary,
            "total_candidates_tracked": len(TRADE_IDEAS_UNIVERSE),
            "_cache_hit": False,
        }

        # Save to In-Memory Cache
        _TRADE_IDEAS_MEMORY_CACHE["payload"] = payload
        _TRADE_IDEAS_MEMORY_CACHE["timestamp"] = now

        # Persist to Database via StockCompressedStore (<15ms on next retrieval)
        try:
            try:
                from backend.app.db.stock_compressed_store import StockCompressedStore
            except ImportError:
                from app.db.stock_compressed_store import StockCompressedStore
            StockCompressedStore.save_macro_liquidity_payload("trade_ideas_master_payload", payload)
            logger.info("[TradeIdeasEngine] Successfully persisted trade ideas master payload to database.")
        except Exception as db_save_err:
            logger.warning(f"[TradeIdeasEngine] Database persistence notice: {db_save_err}")

        return payload

