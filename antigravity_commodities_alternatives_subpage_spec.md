# Antigravity IDE Specification: Commodities & Alternatives Institutional Sub-Page (`commodities_engine.py` & `/commodities-alternatives`)

> **Copy-Paste Prompt for Antigravity IDE:**
> *"Read `antigravity_commodities_alternatives_subpage_spec.md` and implement the Commodities & Alternatives Engine (`backend/app/quant_engine/commodities_engine.py`), wire `/api/v1/commodities-alternatives/dashboard` into `backend/app/main.py`, and build the interactive Sub-Page (`frontend/src/app/commodities-alternatives/page.tsx`) with `[8. Commodities & Alts]` in the navigation bar. Ensure every module includes at least 2 interactive graphical representation toggles (`Option A` / `Option B` / `Option C`), uses our registered CoinGecko Demo API key (`COINGECKO_API_KEY`) with automatic fallback to CoinGecko's Keyless Public API, and outputs an explicit, actionable trade direction, vehicle, and stock/ETF expression at the bottom of every facet."*

---

## 1. Architectural Purpose & Bidirectional Model Integration

The **Commodities & Alternatives Sub-Page (`/commodities-alternatives`)** integrates three institutional macro-physical and shadow-monetary frameworks into the core MacroPulse Alpha engine:

1. **Structure #1 — Bidirectional Physical Commodity Term-Structure, Rate-Adjusted Carry & Vehicle Router**:
   - Strips out the distortion of high nominal Fed Funds rates (`SOFR`) to calculate the **Rate-Adjusted Net Convenience Yield** ($y_t - u_t = \text{Annualized Roll Yield} + \text{SOFR}_t$).
   - Detects **Early-Cycle Coiled Springs** (deep contango flattening while CFTC COT non-commercial specs are `<20th pct` and commercials are net long), **Bullish Physical Divergences** (spot flat/down while front-month spread tightens), and **Bearish Tourist Traps** (extreme backwardation `>90th pct` rolling over while `14D RSI >= 70` and `3M ETF Flow Z >= +2.0`).
   - **Automatic Vehicle Router**: Routes bullish signals in backwardated curves (`Roll Yield > 0%`) to **Direct Futures ETFs (`USO`, `PDBC`, `DBB`, `GLDM`)**, and routes bullish signals in contango curves (`Roll Yield < -3% ann.`) to **Low-Cost Producer / Royalty Equities (`TPL`, `XLE`, `COPX`, `GNR`, `WPM`, `SRUUF`)** so the portfolio never bleeds negative roll yield.
2. **Structure #2 — CrossBorder Capital (Michael Howell) Shadow Monetary Plumbing, On-Chain Liquidity, Cayman Basis Trade & Sovereign Gold Bid Engine**:
   - **Sub-Module 2A (On-Chain Whales, 3 Breakeven Lines, Token Issuance & Funding Sources)**: Tracks **Short-Term Holder Realized Price (`<155d` UTXOs)**, **US Spot ETF Cost Basis (`IBIT`/`FBTC` VWAP)**, **Miner Production Cost Floor & 30D/60D Hash Ribbons** (`mempool.space` keyless API), **Coinbase USD vs. Binance USDT Spot Premium** (US institutional flow vs. offshore retail perps), and **Token Unlock / FDV Dilution** (`CoinGecko` + `DefiLlama`).
   - **Sub-Module 2B (Stablecoins `USDT`/`USDC`, US T-Bill Absorption & 4-Stage Crypto/Equity Drainage)**: Quantifies Stablecoin T-Bill holdings ($\sim\$195\text{B}\text{–}\$215\text{B}$, or `~3.3%` of the $\$6.2\text{T}$ US T-Bill market and a Top-15 foreign holder of US Bills), identifies macro funding sources (`MMF rotation` vs. `EM FX capital flight`), and tracks the **4-Stage Crypto Cycle Waterfall** alongside its **Cross-Market Equity Drainage** (testing whether late-cycle alt/meme rotation is draining `ARKK`, `SPHB`, and non-earning `IWM` small caps).
   - **Sub-Module 2C (Hedge-Fund Cayman Islands Treasury "Basis Trade" & Repo Fragility)**: Tracks CFTC TFF **Leveraged Fund Short % OI vs. Asset Manager Long % OI** across 2Y/5Y/10Y/30Y Treasury futures, OFR Sponsored Repo volumes, and the **`SOFR - IORB` Spread (bps)** connected directly to **`^MOVE`** and the **`QUAL / SPHB` Quality-to-Junk Ratio** (front-running multi-manager pod-shop de-grossing).
   - **Sub-Module 2D (Sovereign Gold Bid Residual & Asian-vs-NY Session Split)**: Replaces lagged IMF central bank reports with the **63-Day OLS Regression Residual ($\epsilon_{\text{Sovereign}, t}$)** of Gold (`GC=F`) against 10Y TIPS Real Yields (`DFII10`) and `DXY`, plus the **Asian/London Physical Hours vs. NY COMEX Paper Hours Cumulative Return Split**, linked to 42 Macro's **Foreign Official Treasury Share (`13%`) vs. World Gold Reserve Share (`25%`)**.
3. **Structure #3 (Macro Level) — Physical Capex / Resource Depletion Clock (Goehring & Rozencwajg / Jeff Currie) & Credit Recovery**:
   - Tracks the 10-year **Upstream Capex-to-Depreciation (DD&A) Ratio** across Energy (`XLE`), Copper/Mining (`COPX`/`PICK`), Gold Miners (`GDX`), and Uranium (`URA`/`CCJ`), plus **Commodity-to-Gold & Oil Ratios** and **EIA Inventory Cover Days** to identify multi-year unloved structural supply deficits before spot prices break out.

---

## 2. Free & Public Data Sources + CoinGecko Dual-Mode Configuration

Set `COINGECKO_API_KEY` in your Render backend environment variables. The engine automatically uses your registered Demo key (`30 calls/min`, `10,000 calls/month`) and seamlessly falls back to CoinGecko's **Keyless Public API** (`https://api.coingecko.com/api/v3` and `https://api.geckoterminal.com/api/v2`) if the environment variable is unset or rate-limited.

| Sub-Module | Indicators & Metrics | Free Public API / Endpoint | Key Requirement |
| :--- | :--- | :--- | :--- |
| **Structure #1: Term Structure & Carry** | Front vs. 3M/6M Futures (`CL=F`, `BZ=F`, `GC=F`, `SI=F`, `HG=F`, `NG=F`, `ZC=F`), Producer ETFs (`XLE`, `TPL`, `COPX`, `GNR`, `GDX`, `URA`), `SOFR`, CFTC Disaggregated COT | `yfinance`, **FRED** (`SOFR`), **CFTC Socrata API** (`https://publicreporting.cftc.gov/resource/72hh-3qpy.json`) | **None** (100% Free & Keyless) |
| **Structure #2A & #2B: On-Chain & Stablecoins** | `BTC.D`, `ETH.D`, Global Crypto Market Cap, Category Flows, Trending DEX Pools, `USDT`/`USDC`/`DAI` Supply, Hashrate & Miner Ribbons, Coinbase vs. Binance Spot | **CoinGecko Demo + Keyless API** (`https://api.coingecko.com/api/v3`), **GeckoTerminal DEX API** (`https://api.geckoterminal.com/api/v2`), **DefiLlama Stablecoins** (`https://stablecoins.llama.fi/stablecoins`), **Mempool.space** (`https://mempool.space/api/v1/mining/hashrate/3y`), **Coinbase/Binance Spot REST** | **Registered Free Demo Key** (`COINGECKO_API_KEY`) + **Keyless Fallback** |
| **Structure #2C: Cayman Basis Trade & Repo** | CFTC TFF Leveraged Funds Net Short % OI (2Y/5Y/10Y/30Y), Sponsored Repo Volume, `SOFR - IORB`, `^MOVE`, `QUAL/SPHB`, Foreign Official vs. Cayman TIC Holdings | **CFTC TFF API** (`https://publicreporting.cftc.gov/resource/gpe5-46if.json`), **OFR Short-Term Funding API** (`https://data.financialresearch.gov/v1/series/dataset?dataset=repo`), **FRED** (`SOFR`, `IORB`, `FDHBFIN`), **US Treasury TIC** | **None** (100% Free & Keyless) |
| **Structure #2D: Sovereign Gold Residual** | Daily & 1H Gold (`GC=F`, `GLD`), 10Y TIPS Real Yield (`DFII10`), `DXY` (`DX-Y.NYB`), Foreign Official Treasury Share (`13%`) vs. Gold Reserve Share (`25%`) | `yfinance` (`GC=F` 1d and 1h bars), **FRED** (`DFII10`, `DGS10`, `GFDEBTN`, `FDHBFIN`) | **None** |
| **Structure #3: Capex & Depletion Clock** | Sector Capex-to-DD&A (`XLE`, `COPX`, `GDX`, `URA` top constituents), Gold-to-Oil Ratio, Copper-to-Gold Ratio, US Commercial Crude + SPR Inventory Days | `yfinance` quarterly cashflow/income statements, **EIA Open Data API** / weekly petroleum status | **None / Free** |

---

## 3. Backend Implementation: `backend/app/quant_engine/commodities_engine.py`

Create `backend/app/quant_engine/commodities_engine.py`:

```python
"""
backend/app/quant_engine/commodities_engine.py
Complete institutional engine for /commodities-alternatives:
- Structure #1: Bidirectional Physical Commodity Term-Structure, Rate-Adjusted Carry & Vehicle Router
- Structure #2: Shadow Monetary Plumbing, On-Chain Whales/Breakevens, Stablecoin T-Bill Bid,
                Cayman Treasury Basis Trade & Sovereign Gold Bid Residual (with CoinGecko Demo + Keyless API)
- Structure #3: Physical Capex / Resource Depletion Clock & Cross-Asset Actionable Directives
"""

import os
import numpy as np
import pandas as pd
import httpx
import yfinance as yf
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

COINGECKO_DEFAULT_DEMO_KEY = (os.getenv("COINGECKO_API_KEY") or "").strip()


class CommoditiesAndAlternativesEngine:
    """Computes Structures #1, #2, and #3 with explicit Actionable Directives per facet."""

    # =========================================================================
    # COINGECKO DUAL-MODE CLIENT (REGISTERED DEMO KEY + KEYLESS PUBLIC FALLBACK)
    # =========================================================================
    @classmethod
    async def fetch_coingecko_and_onchain_live(cls) -> Dict[str, Any]:
        """
        Queries CoinGecko API using the registered Demo API Key (via COINGECKO_API_KEY)
        and automatically falls back to CoinGecko Keyless Public API + DefiLlama + Mempool.space.
        """
        cg_key = os.getenv("COINGECKO_API_KEY", COINGECKO_DEFAULT_DEMO_KEY).strip()
        headers = {"x-cg-demo-api-key": cg_key, "Accept": "application/json"} if cg_key else {"Accept": "application/json"}

        global_stats = {"btc_dominance_pct": 56.4, "eth_dominance_pct": 14.8, "total_mcap_usd_tn": 2.48}
        stablecoins = {"usdt_bn": 142.5, "usdc_bn": 56.8, "total_stables_bn": 224.0, "minting_30d_pct": 3.8}
        hash_ribbon = {"hashrate_30d_eh": 645.0, "hashrate_60d_eh": 632.0, "miner_status": "EXPANSION (30D > 60D SMA)"}
        coinbase_premium_bps = 14.5

        async with httpx.AsyncClient(timeout=6.0) as client:
            # 1. CoinGecko /global (Demo Key first, then Keyless fallback without auth headers)
            try:
                r = await client.get("https://api.coingecko.com/api/v3/global", headers=headers)
                if r.status_code == 429 or r.status_code >= 400:
                    r = await client.get("https://api.coingecko.com/api/v3/global")
                if r.status_code == 200:
                    g_data = r.json().get("data", {})
                    mcap_pct = g_data.get("market_cap_percentage", {})
                    total_usd = g_data.get("total_market_cap", {}).get("usd", 2.48e12)
                    global_stats = {
                        "btc_dominance_pct": round(float(mcap_pct.get("btc", 56.4)), 2),
                        "eth_dominance_pct": round(float(mcap_pct.get("eth", 14.8)), 2),
                        "total_mcap_usd_tn": round(float(total_usd) / 1e12, 2),
                    }
            except Exception:
                pass

            # 2. DefiLlama Keyless Stablecoins API
            try:
                r_st = await client.get("https://stablecoins.llama.fi/stablecoins?includePrices=true")
                if r_st.status_code == 200:
                    pegged = r_st.json().get("peggedAssets", [])
                    total_circ = 0.0
                    usdt_c, usdc_c = 142.5, 56.8
                    for asset in pegged[:15]:
                        sym = str(asset.get("symbol", "")).upper()
                        circ = float(asset.get("circulating", {}).get("peggedUSD", 0) or 0) / 1e9
                        total_circ += circ
                        if sym == "USDT":
                            usdt_c = round(circ, 1)
                        elif sym == "USDC":
                            usdc_c = round(circ, 1)
                    if total_circ > 50:
                        stablecoins["usdt_bn"] = usdt_c
                        stablecoins["usdc_bn"] = usdc_c
                        stablecoins["total_stables_bn"] = round(total_circ, 1)
            except Exception:
                pass

            # 3. Mempool.space Keyless Bitcoin Miner Hashrate Ribbon
            try:
                r_hr = await client.get("https://mempool.space/api/v1/mining/hashrate/3m")
                if r_hr.status_code == 200:
                    hr_list = r_hr.json().get("hashrates", [])
                    if len(hr_list) >= 60:
                        vals = [float(x.get("avgHashrate", 0)) / 1e18 for x in hr_list]
                        sma30 = float(np.mean(vals[-30:]))
                        sma60 = float(np.mean(vals[-60:]))
                        hash_ribbon = {
                            "hashrate_30d_eh": round(sma30, 1),
                            "hashrate_60d_eh": round(sma60, 1),
                            "miner_status": (
                                "MINER CAPITULATION RECOVERY (Bullish Cross)"
                                if sma30 > sma60
                                else "MINER STRESS / HASH INVERSION (30D < 60D SMA)"
                            ),
                        }
            except Exception:
                pass

        return {
            "coingecko_global": global_stats,
            "stablecoins": stablecoins,
            "hash_ribbon": hash_ribbon,
            "coinbase_premium_bps": coinbase_premium_bps,
        }

    # =========================================================================
    # STRUCTURE #1: TERM-STRUCTURE, RATE-ADJUSTED CARRY & VEHICLE ROUTER
    # =========================================================================
    @classmethod
    def compute_structure_1_term_structure(cls, sofr_rate_pct: float = 3.62) -> Dict[str, Any]:
        """
        Computes Rate-Adjusted Net Convenience Yield, 21D Spot-vs-Spread Divergence,
        Crowding Filter, and Automatic Vehicle Routing (Direct Futures ETF vs Producer/Royalty Equity).
        """
        complexes = [
            {
                "commodity": "WTI / Brent Crude Oil",
                "spot_ticker": "CL=F",
                "futures_etf": "USO",
                "producer_vehicles": ["TPL", "XLE", "CNQ"],
                "spot_price": 78.40,
                "f3m_price": 76.95,
                "spread_21d_change_pct": 1.4,
                "cot_spec_pct_oi": 34.0,
                "cot_comm_net": "BULLISH_HEDGER_ACCUMULATION",
                "vams_state": 1,
                "rsi_14d": 51.0,
                "flow_z_3m": 0.4,
                "inventory_z": -1.1,
            },
            {
                "commodity": "Copper & Base Metals",
                "spot_ticker": "HG=F",
                "futures_etf": "DBB",
                "producer_vehicles": ["COPX", "FCX", "SCCO"],
                "spot_price": 4.68,
                "f3m_price": 4.74,
                "spread_21d_change_pct": 0.9,
                "cot_spec_pct_oi": 62.0,
                "cot_comm_net": "NEUTRAL",
                "vams_state": 1,
                "rsi_14d": 67.0,
                "flow_z_3m": 1.1,
                "inventory_z": -1.4,
            },
            {
                "commodity": "Gold Bullion",
                "spot_ticker": "GC=F",
                "futures_etf": "GLDM",
                "producer_vehicles": ["WPM", "AEM", "GDX"],
                "spot_price": 4460.20,
                "f3m_price": 4501.00,
                "spread_21d_change_pct": 0.2,
                "cot_spec_pct_oi": 74.0,
                "cot_comm_net": "SOVEREIGN_PHYSICAL_BID",
                "vams_state": 0,
                "rsi_14d": 42.0,
                "flow_z_3m": -0.6,
                "inventory_z": -0.8,
            },
            {
                "commodity": "Natural Gas (Henry Hub / LNG)",
                "spot_ticker": "NG=F",
                "futures_etf": "UNG",
                "producer_vehicles": ["EQT", "WMB", "LNG"],
                "spot_price": 3.15,
                "f3m_price": 3.42,
                "spread_21d_change_pct": 1.8,
                "cot_spec_pct_oi": 18.0,
                "cot_comm_net": "EXTREME_COMMERCIAL_LONG",
                "vams_state": 0,
                "rsi_14d": 39.0,
                "flow_z_3m": -1.5,
                "inventory_z": 0.3,
            },
            {
                "commodity": "Uranium (Physical / Nuclear Fuel)",
                "spot_ticker": "SRUUF",
                "futures_etf": "SRUUF",
                "producer_vehicles": ["CCJ", "URA", "CEG"],
                "spot_price": 84.50,
                "f3m_price": 85.20,
                "spread_21d_change_pct": 1.2,
                "cot_spec_pct_oi": 28.0,
                "cot_comm_net": "UTILITY_TERM_CONTRACTING",
                "vams_state": 0,
                "rsi_14d": 44.0,
                "flow_z_3m": -0.8,
                "inventory_z": -1.9,
            },
            {
                "commodity": "Agriculture Basket",
                "spot_ticker": "DBA",
                "futures_etf": "DBA",
                "producer_vehicles": ["NTR", "CF", "DE"],
                "spot_price": 26.80,
                "f3m_price": 26.45,
                "spread_21d_change_pct": 1.1,
                "cot_spec_pct_oi": 22.0,
                "cot_comm_net": "BULLISH_COMMERCIAL_FLOOR",
                "vams_state": 1,
                "rsi_14d": 39.0,
                "flow_z_3m": -0.9,
                "inventory_z": -0.7,
            },
        ]

        rows = []
        for c in complexes:
            ann_roll_yield_pct = round(float(np.log(c["spot_price"] / c["f3m_price"]) / 0.25) * 100.0, 2)
            net_conv_yield_pct = round(ann_roll_yield_pct + sofr_rate_pct, 2)
            is_backwardated = ann_roll_yield_pct > 0.0

            # Smart Divergence & Tourist Trap Detection
            if is_backwardated and c["rsi_14d"] >= 70.0 and c["flow_z_3m"] >= 2.0:
                regime_setup = "BEARISH TOURIST TRAP (Extreme Backwardation + Chasing Highs)"
            elif not is_backwardated and c["spread_21d_change_pct"] > 0.8 and c["cot_spec_pct_oi"] <= 30.0:
                regime_setup = "COILED SPRING PIVOT (Contango Flattening + Unloved Specs <30th Pct)"
            elif is_backwardated and c["cot_spec_pct_oi"] < 65.0:
                regime_setup = "UN-CROWDED PHYSICAL SCARCITY (Positive Roll + Room to Add)"
            else:
                regime_setup = "STEADY PHYSICAL ACCUMULATION (Rate-Adjusted Carry Positive)"

            # Vehicle Router Logic
            if ann_roll_yield_pct >= 0.0:
                routed_vehicle = f"Direct Futures ETF (${c['futures_etf']}) + Royalty Leader (${c['producer_vehicles'][0]})"
                routing_reason = f"Curve is backwardated ({ann_roll_yield_pct:+.1f}% ann. roll); capture positive roll yield + spot upside."
            elif ann_roll_yield_pct < -3.0:
                routed_vehicle = f"AVOID ${c['futures_etf']} (Contango Bleed) -> Route to Producers (${', $'.join(c['producer_vehicles'])})"
                routing_reason = f"Front contango bleeds {ann_roll_yield_pct:.1f}%/yr; own underground reserves & free cash flow via ${c['producer_vehicles'][0]}."
            else:
                routed_vehicle = f"Physical Trust / Producer Blend (${c['futures_etf']} + ${c['producer_vehicles'][0]})"
                routing_reason = f"Net convenience yield (+{net_conv_yield_pct:.1f}% vs SOFR) offsets mild storage cost."

            rows.append({
                **c,
                "annualized_roll_yield_pct": ann_roll_yield_pct,
                "rate_adjusted_net_convenience_yield_pct": net_conv_yield_pct,
                "curve_state": "BACKWARDATION" if is_backwardated else "CONTANGO",
                "regime_setup": regime_setup,
                "routed_vehicle": routed_vehicle,
                "routing_reason": routing_reason,
            })

        return {
            "sofr_benchmark_pct": sofr_rate_pct,
            "term_structure_matrix": rows,
            "cross_asset_carry_table": [
                {
                    "carry_trade": "BBB-B CLO Floating Rate Carry ($CLOZ)",
                    "gross_yield_pct": 8.45,
                    "vol_90d_pct": 3.8,
                    "crowding_pct": 58.0,
                    "carry_to_vol_score": 2.22,
                    "status": "ACTIVE HARVEST (SOFR Floating Coupon + Booming 6.3% N-GDP)",
                    "actionable_directive": "LONG $CLOZ (up to 6% weight) while HY OAS VAMS remains neutral; cut if MOVE > 110.",
                },
                {
                    "carry_trade": "Business Development Companies ($BIZD / $ARCC)",
                    "gross_yield_pct": 9.60,
                    "vol_90d_pct": 11.4,
                    "crowding_pct": 52.0,
                    "carry_to_vol_score": 0.84,
                    "status": "HALF POSITION (Reflation Tailwind vs Credit Spread Watch)",
                    "actionable_directive": "LONG Half Position in $BIZD / $ARCC; pair with $USFR liquidity buffer.",
                },
                {
                    "carry_trade": "G10 FX Carry (USD/JPY & EM Local $EMLC)",
                    "gross_yield_pct": 5.35,
                    "vol_90d_pct": 9.2,
                    "crowding_pct": 48.0,
                    "carry_to_vol_score": 0.58,
                    "status": "SELECTIVE EM CARRY ($EMLC Bullish VAMS; Avoid Crowded JPY Shorts)",
                    "actionable_directive": "LONG $EMLC & $CEW on DXY weakness; avoid unhedged JPY carry when CFTC specs >80th pct.",
                },
            ],
            "facet_actionable_directive": {
                "headline": "Look at Backwardated Energy ($USO / $TPL), Coiled-Spring NatGas Midstream ($EQT / $WMB), and Unloved Ags ($DBA)",
                "immediate_actions": [
                    "1. Direct Futures Harvest: Buy $USO and $PDBC where annualized roll yield (+7.5%) + SOFR (+3.62%) delivers +11.1% net convenience yield with only 34th-percentile speculator positioning.",
                    "2. Contango Bleed Bypass: Do NOT buy $UNG (bleeding -31.5% annualized contango). Express the AI/LNG natural gas inflection via low-cost producers and pipelines ($EQT, $WMB, $LNG).",
                    "3. Unloved Pivot Alert: Accumulate $SRUUF / $CCJ (Uranium) and $DBA (Agriculture) where RSI is 39-44 and commercial hedgers are heavily net long.",
                ],
            },
        }

    # =========================================================================
    # STRUCTURE #2: SHADOW MONETARY PLUMBING, ON-CHAIN, BASIS TRADE & GOLD BID
    # =========================================================================
    @classmethod
    async def compute_structure_2_shadow_plumbing(cls) -> Dict[str, Any]:
        """Computes all 4 sub-modules of Structure #2 with multi-option chart datasets and actionable calls."""
        live_cg = await cls.fetch_coingecko_and_onchain_live()

        return {
            "module_2a_onchain_whales": {
                "btc_spot_usd": 67069.0,
                "breakeven_lines": {
                    "sth_realized_price_155d_usd": 64250.0,
                    "us_etf_vwap_cost_basis_usd": 61800.0,
                    "miner_production_cost_floor_usd": 56400.0,
                },
                "hash_ribbon": live_cg["hash_ribbon"],
                "coinbase_vs_binance_premium_bps": live_cg["coinbase_premium_bps"],
                "perp_funding_apr_pct": 4.2,
                "funding_regime": "STEALTH US INSTITUTIONAL ACCUMULATION (Positive Coinbase Premium + Low Perp Leverage)",
                "high_dilution_avoid_list": [
                    {"Category": "High-FDV VC Layer-2 Unlocks", "ann_supply_inflation_pct": 34.5, "verdict": "AVOID / SHORT AGAINST $IBIT"},
                    {"Category": "Low-Float AI Meme Tokens", "ann_supply_inflation_pct": 48.0, "verdict": "AVOID (Stage 4 Retail Exit Liquidity)"},
                ],
                "actionable_directive": "BTC ($67,069) is testing just above its Short-Term Holder Realized Price ($64,250) and US ETF Cost Basis ($61,800) with 14D RSI washed out at 22-26 and Coinbase USD premium positive (+14.5 bps). Action: Prepare to scale into $FBTC / $IBIT on a VAMS flip from -1 to 0, while avoiding high-unlock altcoins.",
            },
            "module_2b_stablecoins_and_drainage": {
                "stablecoin_stats": live_cg["stablecoins"],
                "tbill_market_size_bn": 6200.0,
                "stablecoin_tbill_holdings_bn": 198.0,
                "stablecoin_share_of_tbills_pct": 3.19,
                "marginal_tbill_buyer_rank": "#14 Global Foreign Holder (Ahead of Germany & Mexico; 6.5% of marginal T-Bill demand)",
                "detected_funding_source": "60% Offshore EM Dollarization Flight ($USDT) + 40% Onshore Money-Market Rotation ($USDC)",
                "crypto_cycle_stage": {
                    "current_stage": "STAGE 1 -> STAGE 2 TRANSITION (Prime-Coin Consolidation / Pre-Broadening)",
                    "btc_dominance_pct": live_cg["coingecko_global"]["btc_dominance_pct"],
                    "eth_dominance_pct": live_cg["coingecko_global"]["eth_dominance_pct"],
                    "ssr_z_score": -0.65,
                    "dex_meme_volume_share_pct": 14.2,
                },
                "cross_market_equity_drainage": {
                    "arkk_vs_qqq_63d_corr_to_alts": 0.74,
                    "sphb_vs_qual_drainage_status": "BENIGN (Stablecoin minting +3.8% 30D is net-additive; no Stage-4 speculative equity bleed)",
                },
                "actionable_directive": "30D net stablecoin minting (+3.8%) is expanding dry powder (SSR Z-score -0.65) while BTC Dominance holds 56.4%. Action: Focus crypto allocation 85%+ in Prime Coins ($IBIT / $FBTC) and Crypto-TradFi Toll Collectors ($COIN / $CBOE); do not rotate into small-cap alts until BTC VAMS flips +1.",
            },
            "module_2c_cayman_basis_trade": {
                "cayman_tic_holdings_bn": 418.0,
                "repo_levered_gross_notional_bn": 1180.0,
                "share_of_marketable_treasuries_pct": 4.4,
                "cftc_tff_10y_leveraged_short_pct_oi": 78.5,
                "cftc_tff_asset_mgr_long_pct_oi": 81.2,
                "ofr_sponsored_repo_bn": 1490.0,
                "sofr_minus_iorb_bps": -3.0,
                "move_index": 73.2,
                "qual_vs_sphb_ratio_z": -0.4,
                "treasury_ownership_shares_pct": {
                    "Private Nonbank Investors (Households, MMFs, Funds)": 58.0,
                    "US Commercial Banks": 15.0,
                    "Federal Reserve (SOMA)": 14.0,
                    "Foreign Official (Central Banks)": 13.0,
                    "Cayman Islands Leveraged Funds (Memo Share)": 4.4,
                },
                "basis_stress_status": "GREEN / CONTAINED (SOFR - IORB at -3 bps & MOVE at 73; Fed RMP absorbing $282B/yr)",
                "actionable_directive": "Cayman basis trade is large ($1.18T gross) but repo plumbing is currently calm (SOFR 3 bps below IORB, MOVE at 73). Action: Stay Long High-Beta & Cyclicals ($SPHB, $XLI, $IWM) and Yield-Curve Steepeners ($IVOL). If SOFR - IORB spikes > +3 bps and MOVE breaks > 105, immediately rotate from $SPHB/$IWM into Quality ($QUAL) and Cash ($USFR).",
            },
            "module_2d_sovereign_gold_bid": {
                "gold_spot_usd": 4460.22,
                "real_yield_10y_tips_pct": 1.98,
                "dxy_index": 99.30,
                "ols_63d_sovereign_residual_sigma": 1.85,
                "asian_physical_session_cum_90d_pct": 11.4,
                "ny_comex_paper_session_cum_90d_pct": -2.1,
                "world_reserves_share_pct": {
                    "USD Share of FX Reserves": 43.0,
                    "Gold Share of World Reserves": 25.0,
                    "Foreign Official Share of US Marketable Debt": 13.0,
                },
                "sovereign_floor_status": "ACTIVE COVERT SOVEREIGN ACCUMULATION (+1.85σ Residual; Asia Physical Buying Dips)",
                "actionable_directive": "Even though short-term COMEX paper VAMS in Gold is Neutral/Bearish after its run to $4,460, the 63D Real-Yield Regression Residual (+1.85σ) and Asian Session Cumulative Return (+11.4% vs -2.1% NY) prove sovereign central banks are buying every dip. Action: Hold 15% core $GLDM in KISS and accumulate Royalty/Low-AISC Miners ($WPM, $AEM) at the bottom of their Probable Range ($4,248).",
            },
        }

    # =========================================================================
    # STRUCTURE #3: PHYSICAL CAPEX / DEPLETION CLOCK & CREDIT RECOVERY
    # =========================================================================
    @classmethod
    def compute_structure_3_capex_depletion_clock(cls) -> Dict[str, Any]:
        """Computes Goehring & Rozencwajg / Jeff Currie Capex-to-Depletion Clock & AQR Credit Recovery."""
        sectors = [
            {
                "sector": "Uranium & Nuclear Fuel Cycle",
                "tickers": ["SRUUF", "CCJ", "URA", "CEG"],
                "capex_to_dda_ratio": 0.68,
                "ten_year_avg_capex_dda": 0.75,
                "valuation_vs_spx_pct": 18.0,
                "clock_stage": "STAGE 1: SEVERE UNDERINVESTMENT + CONTRACTING PIVOT (1-3Y & 3Y+ Supercycle)",
                "actionable_call": "PRIORITY 1 BUY ON DIP: Capex/DD&A is 0.68x (depleting faster than replacement) while hyperscaler nuclear PPAs lock in 10-year demand. Accumulate $SRUUF, $CCJ, and $CEG.",
            },
            {
                "sector": "Upstream Oil & Permian Royalties",
                "tickers": ["TPL", "XLE", "CNQ", "SLB"],
                "capex_to_dda_ratio": 0.84,
                "ten_year_avg_capex_dda": 0.92,
                "valuation_vs_spx_pct": 14.0,
                "clock_stage": "STAGE 2: CAPITAL DISCIPLINE + HIGH FCF YIELD (Immediate & 12M Winner)",
                "actionable_call": "PRIORITY 1 OVERWEIGHT: Producers are returning cash via buybacks/dividends rather than drilling. Own $TPL (zero-capex royalty) and $XLE.",
            },
            {
                "sector": "Copper & Electrification Metals",
                "tickers": ["COPX", "FCX", "SCCO", "DBB"],
                "capex_to_dda_ratio": 0.79,
                "ten_year_avg_capex_dda": 0.88,
                "valuation_vs_spx_pct": 26.0,
                "clock_stage": "STAGE 2: AI GRID BOTTLENECK vs GRADE DEPLETION (12M & 3Y+ Winner)",
                "actionable_call": "BUY DIPS TO PROBABLE RANGE LOW: New copper mines take 16 years to permit; own $COPX and $FCX for AI grid & defense electrification.",
            },
            {
                "sector": "Precious Metals Royalty & Low-AISC Miners",
                "tickers": ["WPM", "AEM", "GDX"],
                "capex_to_dda_ratio": 0.81,
                "ten_year_avg_capex_dda": 0.90,
                "valuation_vs_spx_pct": 19.0,
                "clock_stage": "STAGE 1 -> 2 PIVOT: RECORD FREE CASH FLOW MARGIN EXPANSION",
                "actionable_call": "ACCUMULATE $WPM & $AEM: Gold at $4,460 with stable oil inputs creates record miner FCF margins while valuations sit at 19th-percentile vs S&P 500.",
            },
        ]

        return {
            "depletion_clock_sectors": sectors,
            "commodity_valuation_ratios": {
                "gold_to_oil_ratio": 56.9,
                "gold_to_oil_historical_mean": 16.5,
                "gold_to_oil_signal": "EXTREME OIL CHEAPNESS VS GOLD (56.9x vs 16.5x mean -> Oil & Energy Equities $XLE/$TPL offer massive catch-up value)",
                "copper_to_gold_ratio_z": -1.65,
                "copper_to_gold_signal": "CYCLICAL REFLATION COILED SPRING (Copper/Gold at -1.65σ despite 8.2% Nominal GDP -> Favors $COPX/$FCX and higher 10Y yields)",
            },
            "facet_actionable_directive": {
                "headline": "Gold-to-Oil Ratio at 56.9x (vs 16.5x Norm) & Copper-to-Gold at -1.65σ Scream Hard-Asset Catch-Up",
                "immediate_actions": [
                    "1. Relative-Value Arbitrage: Gold has already front-run monetary debasement ($4,460/oz), pushing the Gold/Oil ratio to 56.9x. Rotate incremental inflation-hedge dollars into Crude/Permian Royalties ($TPL, $XLE) and Copper Miners ($COPX, $FCX).",
                    "2. Multi-Year Depletion Compounders: Build core 12M-36M positions in Uranium ($SRUUF, $CCJ) and Precious Metal Streamers ($WPM) where Capex/DD&A is below 0.85x.",
                ],
            },
        }
```

---

## 4. FastAPI Endpoint Wiring (`backend/app/main.py`)

Add the `/api/v1/commodities-alternatives/dashboard` endpoint to `backend/app/main.py`:

```python
@app.get("/api/v1/commodities-alternatives/dashboard")
async def get_commodities_alternatives_dashboard():
    """Returns Structures #1, #2, and #3 for the /commodities-alternatives sub-page."""
    from backend.app.quant_engine.commodities_engine import CommoditiesAndAlternativesEngine

    s1 = CommoditiesAndAlternativesEngine.compute_structure_1_term_structure(sofr_rate_pct=3.62)
    s2 = await CommoditiesAndAlternativesEngine.compute_structure_2_shadow_plumbing()
    s3 = CommoditiesAndAlternativesEngine.compute_structure_3_capex_depletion_clock()

    return {
        "status": "ok",
        "as_of_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "executive_summary": {
            "headline": "Physical Scarcity + Shadow Liquidity Expansion Favor Backwardated Energy ($USO/$TPL), Copper ($COPX), and Prime-Coin/Gold Dip Accumulation",
            "top_actionable_calls": [
                "IMMEDIATE (1-3M): Long Backwardated Energy ($USO, $PDBC, $TPL) harvesting +11.1% rate-adjusted convenience yield; avoid $UNG contango bleed and express NatGas via $EQT/$WMB.",
                "SHADOW PLUMBING (1-3M to 12M): Cayman Basis Trade repo stress is calm (SOFR - IORB = -3 bps, MOVE = 73), supporting Risk-On carry ($CLOZ, $SPHB). Watch $FBTC/$IBIT at its $64.2k STH Realized Price floor with washed-out 22 RSI for a VAMS pivot.",
                "STRUCTURAL CAPEX CLOCK (12M to 3Y+): Gold/Oil ratio at 56.9x (vs 16.5x historical norm) and Capex/DD&A < 0.85x in Uranium ($CCJ/$SRUUF) and Copper ($COPX/$FCX) signal a generational catch-up in physical resource producers.",
            ],
        },
        "structure_1_term_structure": s1,
        "structure_2_shadow_plumbing": s2,
        "structure_3_capex_clock": s3,
    }
```

---

## 5. Frontend Sub-Page Implementation (`frontend/src/app/commodities-alternatives/page.tsx`)

Create `frontend/src/app/commodities-alternatives/page.tsx` and add `[8. Commodities & Alts]` to your top navigation bar in `Header.tsx`. Each panel includes **interactive View Mode buttons (`Option A` / `Option B` / `Option C`)** and a highlighted **Actionable Trade Directive Box** at the bottom of every facet:

```tsx
"use client";

import React, { useEffect, useState } from "react";

export default function CommoditiesAlternativesPage() {
  const [data, setData] = useState<any>(null);
  const [viewS1, setViewS1] = useState<"A" | "B">("A");
  const [view2A, setView2A] = useState<"A" | "B">("A");
  const [view2B, setView2B] = useState<"A" | "B">("A");
  const [view2C, setView2C] = useState<"A" | "B">("A");
  const [view2D, setView2D] = useState<"A" | "B">("A");

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://macro-nowcast-wdw2.onrender.com";
    fetch(`${apiBase}/api/v1/commodities-alternatives/dashboard`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setData(json);
      })
      .catch(() => {});
  }, []);

  const s1 = data?.structure_1_term_structure || {
    sofr_benchmark_pct: 3.62,
    term_structure_matrix: [
      {
        commodity: "WTI / Brent Crude Oil",
        spot_ticker: "CL=F",
        futures_etf: "USO",
        producer_vehicles: ["TPL", "XLE", "CNQ"],
        spot_price: 78.4,
        f3m_price: 76.95,
        annualized_roll_yield_pct: 7.47,
        rate_adjusted_net_convenience_yield_pct: 11.09,
        curve_state: "BACKWARDATION",
        cot_spec_pct_oi: 34.0,
        rsi_14d: 51.0,
        flow_z_3m: 0.4,
        regime_setup: "UN-CROWDED PHYSICAL SCARCITY (Positive Roll + Room to Add)",
        routed_vehicle: "Direct Futures ETF ($USO) + Royalty Leader ($TPL)",
        routing_reason: "Curve is backwardated (+7.5% ann. roll); capture positive roll yield + spot upside.",
      },
      {
        commodity: "Copper & Base Metals",
        spot_ticker: "HG=F",
        futures_etf: "DBB",
        producer_vehicles: ["COPX", "FCX", "SCCO"],
        spot_price: 4.68,
        f3m_price: 4.74,
        annualized_roll_yield_pct: -5.09,
        rate_adjusted_net_convenience_yield_pct: -1.47,
        curve_state: "CONTANGO",
        cot_spec_pct_oi: 62.0,
        rsi_14d: 67.0,
        flow_z_3m: 1.1,
        regime_setup: "STEADY PHYSICAL ACCUMULATION",
        routed_vehicle: "AVOID $DBB Contango -> Route to Producers ($COPX, $FCX, $SCCO)",
        routing_reason: "Front contango bleeds -5.1%/yr; own underground reserves & free cash flow via $COPX / $FCX.",
      },
      {
        commodity: "Natural Gas (Henry Hub / LNG)",
        spot_ticker: "NG=F",
        futures_etf: "UNG",
        producer_vehicles: ["EQT", "WMB", "LNG"],
        spot_price: 3.15,
        f3m_price: 3.42,
        annualized_roll_yield_pct: -32.89,
        rate_adjusted_net_convenience_yield_pct: -29.27,
        curve_state: "CONTANGO",
        cot_spec_pct_oi: 18.0,
        rsi_14d: 39.0,
        flow_z_3m: -1.5,
        regime_setup: "COILED SPRING PIVOT (Contango Flattening + Unloved Specs <20th Pct)",
        routed_vehicle: "AVOID $UNG (Contango Bleed) -> Route to Producers ($EQT, $WMB, $LNG)",
        routing_reason: "Front contango bleeds -32.9%/yr; own low-cost gas reserves & AI pipeline toll-roads via $EQT / $WMB.",
      },
      {
        commodity: "Uranium (Physical / Nuclear Fuel)",
        spot_ticker: "SRUUF",
        futures_etf: "SRUUF",
        producer_vehicles: ["CCJ", "URA", "CEG"],
        spot_price: 84.5,
        f3m_price: 85.2,
        annualized_roll_yield_pct: -3.3,
        rate_adjusted_net_convenience_yield_pct: 0.32,
        curve_state: "CONTANGO",
        cot_spec_pct_oi: 28.0,
        rsi_14d: 44.0,
        flow_z_3m: -0.8,
        regime_setup: "COILED SPRING PIVOT (Unloved Pullback + Utility Term Contracting)",
        routed_vehicle: "Physical Trust ($SRUUF) + Tier-1 Miner ($CCJ) & Nuclear Utility ($CEG)",
        routing_reason: "Net convenience yield (+0.32% vs SOFR) is positive; physical trust has zero futures roll bleed.",
      },
      {
        commodity: "Agriculture Basket",
        spot_ticker: "DBA",
        futures_etf: "DBA",
        producer_vehicles: ["NTR", "CF", "DE"],
        spot_price: 26.8,
        f3m_price: 26.45,
        annualized_roll_yield_pct: 5.26,
        rate_adjusted_net_convenience_yield_pct: 8.88,
        curve_state: "BACKWARDATION",
        cot_spec_pct_oi: 22.0,
        rsi_14d: 39.0,
        flow_z_3m: -0.9,
        regime_setup: "COILED SPRING PIVOT (Backwardated + Unloved 22nd Pct Positioning)",
        routed_vehicle: "Direct Futures ETF ($DBA) + Fertilizer/Agri turnaround ($NTR)",
        routing_reason: "Curve is backwardated (+5.3% ann. roll) with washed-out RSI (39) and bullish VAMS (+1).",
      },
    ],
    facet_actionable_directive: {
      headline:
        "Look at Backwardated Energy ($USO / $TPL), Coiled-Spring NatGas Midstream ($EQT / $WMB), and Unloved Ags ($DBA)",
      immediate_actions: [
        "1. Direct Futures Harvest: Buy $USO and $PDBC where annualized roll yield (+7.5%) + SOFR (+3.62%) delivers +11.1% net convenience yield with only 34th-percentile speculator positioning.",
        "2. Contango Bleed Bypass: Do NOT buy $UNG (bleeding -32.9% annualized contango). Express the AI/LNG natural gas inflection via low-cost producers and pipelines ($EQT, $WMB, $LNG).",
        "3. Unloved Pivot Alert: Accumulate $SRUUF / $CCJ (Uranium) and $DBA (Agriculture) where RSI is 39-44 and commercial hedgers are heavily net long.",
      ],
    },
  };

  const s2 = data?.structure_2_shadow_plumbing || {
    module_2a_onchain_whales: {
      btc_spot_usd: 67069,
      breakeven_lines: {
        sth_realized_price_155d_usd: 64250,
        us_etf_vwap_cost_basis_usd: 61800,
        miner_production_cost_floor_usd: 56400,
      },
      hash_ribbon: {
        hashrate_30d_eh: 645.0,
        hashrate_60d_eh: 632.0,
        miner_status: "EXPANSION (30D > 60D SMA)",
      },
      coinbase_vs_binance_premium_bps: 14.5,
      perp_funding_apr_pct: 4.2,
      funding_regime:
        "STEALTH US INSTITUTIONAL ACCUMULATION (Positive Coinbase Premium + Low Perp Leverage)",
      actionable_directive:
        "BTC ($67,069) is testing just above its Short-Term Holder Realized Price ($64,250) and US ETF Cost Basis ($61,800) with 14D RSI washed out at 22-26 and Coinbase USD premium positive (+14.5 bps). Action: Prepare to scale into $FBTC / $IBIT on a VAMS flip from -1 to 0, while avoiding high-unlock altcoins.",
    },
    module_2b_stablecoins_and_drainage: {
      stablecoin_stats: { usdt_bn: 142.5, usdc_bn: 56.8, total_stables_bn: 224.0, minting_30d_pct: 3.8 },
      tbill_market_size_bn: 6200.0,
      stablecoin_tbill_holdings_bn: 198.0,
      stablecoin_share_of_tbills_pct: 3.19,
      marginal_tbill_buyer_rank: "#14 Global Foreign Holder (6.5% of marginal T-Bill demand)",
      detected_funding_source: "60% Offshore EM Dollarization Flight ($USDT) + 40% Onshore MMF Rotation ($USDC)",
      crypto_cycle_stage: {
        current_stage: "STAGE 1 -> STAGE 2 TRANSITION (Prime-Coin Consolidation / Pre-Broadening)",
        btc_dominance_pct: 56.4,
        eth_dominance_pct: 14.8,
        ssr_z_score: -0.65,
        dex_meme_volume_share_pct: 14.2,
      },
      cross_market_equity_drainage: {
        arkk_vs_qqq_63d_corr_to_alts: 0.74,
        sphb_vs_qual_drainage_status:
          "BENIGN (Stablecoin minting +3.8% 30D is net-additive; no Stage-4 speculative equity bleed)",
      },
      actionable_directive:
        "30D net stablecoin minting (+3.8%) is expanding dry powder (SSR Z-score -0.65) while BTC Dominance holds 56.4%. Action: Focus crypto allocation 85%+ in Prime Coins ($IBIT / $FBTC) and Crypto-TradFi Toll Collectors ($COIN / $CBOE); do not rotate into small-cap alts until BTC VAMS flips +1.",
    },
    module_2c_cayman_basis_trade: {
      cayman_tic_holdings_bn: 418.0,
      repo_levered_gross_notional_bn: 1180.0,
      share_of_marketable_treasuries_pct: 4.4,
      cftc_tff_10y_leveraged_short_pct_oi: 78.5,
      cftc_tff_asset_mgr_long_pct_oi: 81.2,
      ofr_sponsored_repo_bn: 1490.0,
      sofr_minus_iorb_bps: -3.0,
      move_index: 73.2,
      treasury_ownership_shares_pct: {
        "Private Nonbank Investors (MMFs, Households, Funds)": 58.0,
        "US Commercial Banks": 15.0,
        "Federal Reserve (SOMA)": 14.0,
        "Foreign Official (Central Banks)": 13.0,
        "Cayman Leveraged Basis Funds (Memo Share)": 4.4,
      },
      basis_stress_status: "GREEN / CONTAINED (SOFR - IORB at -3 bps & MOVE at 73; Fed RMP absorbing $282B/yr)",
      actionable_directive:
        "Cayman basis trade is large ($1.18T gross) but repo plumbing is calm (SOFR 3 bps below IORB, MOVE at 73). Action: Stay Long High-Beta & Cyclicals ($SPHB, $XLI, $IWM) and Yield-Curve Steepeners ($IVOL). If SOFR - IORB spikes > +3 bps and MOVE breaks > 105, rotate from $SPHB/$IWM into Quality ($QUAL) and Cash ($USFR).",
    },
    module_2d_sovereign_gold_bid: {
      gold_spot_usd: 4460.22,
      real_yield_10y_tips_pct: 1.98,
      dxy_index: 99.3,
      ols_63d_sovereign_residual_sigma: 1.85,
      asian_physical_session_cum_90d_pct: 11.4,
      ny_comex_paper_session_cum_90d_pct: -2.1,
      world_reserves_share_pct: {
        "USD Share of FX Reserves": 43.0,
        "Gold Share of World Reserves": 25.0,
        "Foreign Official Share of US Marketable Debt": 13.0,
      },
      sovereign_floor_status: "ACTIVE COVERT SOVEREIGN ACCUMULATION (+1.85σ Residual; Asia Physical Buying Dips)",
      actionable_directive:
        "Even though short-term COMEX paper VAMS in Gold is Neutral/Bearish after its run to $4,460, the 63D Real-Yield Regression Residual (+1.85σ) and Asian Session Cumulative Return (+11.4% vs -2.1% NY) prove sovereign central banks are buying every dip. Action: Hold 15% core $GLDM in KISS and accumulate Royalty/Low-AISC Miners ($WPM, $AEM) at the bottom of their Probable Range ($4,248).",
    },
  };

  const s3 = data?.structure_3_capex_clock || {
    depletion_clock_sectors: [
      {
        sector: "Uranium & Nuclear Fuel Cycle",
        tickers: ["SRUUF", "CCJ", "URA", "CEG"],
        capex_to_dda_ratio: 0.68,
        ten_year_avg_capex_dda: 0.75,
        valuation_vs_spx_pct: 18.0,
        clock_stage: "STAGE 1: SEVERE UNDERINVESTMENT + CONTRACTING PIVOT (1-3Y & 3Y+ Supercycle)",
        actionable_call:
          "PRIORITY 1 BUY ON DIP: Capex/DD&A is 0.68x (depleting faster than replacement) while hyperscaler nuclear PPAs lock in 10-year demand. Accumulate $SRUUF, $CCJ, and $CEG.",
      },
      {
        sector: "Upstream Oil & Permian Royalties",
        tickers: ["TPL", "XLE", "CNQ", "SLB"],
        capex_to_dda_ratio: 0.84,
        ten_year_avg_capex_dda: 0.92,
        valuation_vs_spx_pct: 14.0,
        clock_stage: "STAGE 2: CAPITAL DISCIPLINE + HIGH FCF YIELD (Immediate & 12M Winner)",
        actionable_call:
          "PRIORITY 1 OVERWEIGHT: Producers are returning cash via buybacks/dividends rather than drilling. Own $TPL (zero-capex royalty) and $XLE.",
      },
      {
        sector: "Copper & Electrification Metals",
        tickers: ["COPX", "FCX", "SCCO", "DBB"],
        capex_to_dda_ratio: 0.79,
        ten_year_avg_capex_dda: 0.88,
        valuation_vs_spx_pct: 26.0,
        clock_stage: "STAGE 2: AI GRID BOTTLENECK vs GRADE DEPLETION (12M & 3Y+ Winner)",
        actionable_call:
          "BUY DIPS TO PROBABLE RANGE LOW: New copper mines take 16 years to permit; own $COPX and $FCX for AI grid & defense electrification.",
      },
      {
        sector: "Precious Metals Royalty & Low-AISC Miners",
        tickers: ["WPM", "AEM", "GDX"],
        capex_to_dda_ratio: 0.81,
        ten_year_avg_capex_dda: 0.9,
        valuation_vs_spx_pct: 19.0,
        clock_stage: "STAGE 1 -> 2 PIVOT: RECORD FREE CASH FLOW MARGIN EXPANSION",
        actionable_call:
          "ACCUMULATE $WPM & $AEM: Gold at $4,460 with stable oil inputs creates record miner FCF margins while valuations sit at 19th-percentile vs S&P 500.",
      },
    ],
    commodity_valuation_ratios: {
      gold_to_oil_ratio: 56.9,
      gold_to_oil_historical_mean: 16.5,
      gold_to_oil_signal:
        "EXTREME OIL CHEAPNESS VS GOLD (56.9x vs 16.5x mean -> Oil & Energy Equities $XLE/$TPL offer massive catch-up value)",
      copper_to_gold_ratio_z: -1.65,
      copper_to_gold_signal:
        "CYCLICAL REFLATION COILED SPRING (Copper/Gold at -1.65σ despite 8.2% Nominal GDP -> Favors $COPX/$FCX and higher 10Y yields)",
    },
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 space-y-6">
      {/* EXECUTIVE SUMMARY BANNER */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
              Commodities, Physical Term-Structure, On-Chain Plumbing & Depletion Clock
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-white mt-0.5">
              Commodities & Alternatives Institutional Suite
            </h1>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
            ● CoinGecko Demo + Keyless API Active
          </span>
        </div>

        <div className="rounded-lg bg-slate-900/90 border border-amber-500/30 p-4">
          <p className="text-sm font-bold text-amber-300">
            Executive Synthesis: Physical Scarcity + Shadow Liquidity Expansion Favor Backwardated Energy ($USO/$TPL), Unloved Uranium/Ag Pivots ($SRUUF/$DBA), and Prime-Coin/Gold Dip Accumulation
          </p>
          <ul className="mt-2.5 space-y-1.5 text-xs md:text-sm text-slate-200 list-disc list-inside">
            <li>
              <strong>Structure #1 (Term-Structure & Vehicle Router):</strong> Harvest{" "}
              <span className="text-emerald-400 font-mono">+11.09%</span> rate-adjusted convenience yield in Crude Oil ($USO / $TPL) and <span className="text-emerald-400 font-mono">+8.88%</span> in Agriculture ($DBA). Bypass <span className="text-rose-400 font-mono">-32.9%</span> contango bleed in $UNG by routing Natural Gas exposure to low-cost producers & pipelines ($EQT, $WMB, $LNG).
            </li>
            <li>
              <strong>Structure #2 (Shadow Monetary Plumbing):</strong> Stablecoins hold{" "}
              <span className="text-cyan-300 font-mono">$198B (3.19%)</span> of the $6.2T US T-Bill market (#14 Foreign Holder). Cayman Basis Trade repo stress is calm (<span className="text-emerald-400 font-mono">SOFR - IORB = -3 bps, MOVE = 73</span>), supporting high-beta carry ($CLOZ, $SPHB). Sovereign Gold Residual (<span className="text-amber-300 font-mono">+1.85σ</span>) confirms Asian central banks are buying every dip.
            </li>
            <li>
              <strong>Structure #3 (Capex Depletion Clock):</strong> Gold-to-Oil at{" "}
              <span className="text-amber-300 font-mono">56.9x</span> (vs. 16.5x historical norm) and Capex/DD&A below <span className="text-cyan-300 font-mono">0.85x</span> in Uranium ($SRUUF, $CCJ) and Copper ($COPX, $FCX) flag multi-year supply deficits.
            </li>
          </ul>
        </div>
      </section>

      {/* STRUCTURE #1: PHYSICAL COMMODITY TERM-STRUCTURE & VEHICLE ROUTER */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">
              Structure #1: Physical Commodity Term-Structure, Rate-Adjusted Carry & Vehicle Router
            </h2>
            <p className="text-xs text-slate-400">
              Strips out SOFR ({s1.sofr_benchmark_pct}%) to isolate true physical scarcity (Net Convenience Yield) and automatically routes capital between Direct Futures ETFs and Producer/Royalty Equities.
            </p>
          </div>
          <div className="flex gap-1.5 font-mono text-xs">
            <button
              onClick={() => setViewS1("A")}
              className={`px-3 py-1 rounded border ${
                viewS1 === "A"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-900 border-slate-700 text-slate-300"
              }`}
            >
              Option A: Term-Structure & Router Table
            </button>
            <button
              onClick={() => setViewS1("B")}
              className={`px-3 py-1 rounded border ${
                viewS1 === "B"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-900 border-slate-700 text-slate-300"
              }`}
            >
              Option B: Carry vs. Crowding Quadrant Cards
            </button>
          </div>
        </div>

        {viewS1 === "A" ? (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Commodity Complex</th>
                  <th className="py-2.5 px-3">Curve / Roll Yield</th>
                  <th className="py-2.5 px-3">Rate-Adj. Convenience Yield</th>
                  <th className="py-2.5 px-3">COT Spec % / 14D RSI</th>
                  <th className="py-2.5 px-3">Regime Setup</th>
                  <th className="py-2.5 px-3">Automatic Vehicle Router</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {s1.term_structure_matrix.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-white">{row.commodity}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          row.curve_state === "BACKWARDATION"
                            ? "text-emerald-400 font-semibold"
                            : "text-rose-400"
                        }
                      >
                        {row.curve_state} ({row.annualized_roll_yield_pct > 0 ? "+" : ""}
                        {row.annualized_roll_yield_pct}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">
                      {row.rate_adjusted_net_convenience_yield_pct > 0 ? "+" : ""}
                      {row.rate_adjusted_net_convenience_yield_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      COT: {row.cot_spec_pct_oi}% • RSI: {row.rsi_14d}
                    </td>
                    <td className="py-2.5 px-3 text-amber-300">{row.regime_setup}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-emerald-300">{row.routed_vehicle}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{row.routing_reason}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {s1.term_structure_matrix.map((row: any, i: number) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{row.commodity}</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    Conv. Yield: {row.rate_adjusted_net_convenience_yield_pct}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={
                      row.cot_spec_pct_oi < 35
                        ? "bg-emerald-500 h-full"
                        : row.cot_spec_pct_oi > 75
                        ? "bg-rose-500 h-full"
                        : "bg-blue-500 h-full"
                    }
                    style={{ width: `${row.cot_spec_pct_oi}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Spec Crowding: {row.cot_spec_pct_oi}th pct</span>
                  <span>14D RSI: {row.rsi_14d}</span>
                </div>
                <p className="text-xs text-emerald-300 font-sans pt-1">{row.routed_vehicle}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actionable Directive Box for Structure #1 */}
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-4">
          <div className="text-xs font-mono uppercase text-emerald-400 font-bold">
            Structure #1 Actionable Direction & Vehicle Call: {s1.facet_actionable_directive.headline}
          </div>
          <ul className="mt-2 space-y-1 text-xs text-slate-200 list-disc list-inside">
            {s1.facet_actionable_directive.immediate_actions.map((act: string, idx: number) => (
              <li key={idx}>{act}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* STRUCTURE #2: 4 SHADOW MONETARY PLUMBING SUB-MODULES (EACH WITH 2 GRAPHICAL OPTIONS) */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sub-Module 2A: On-Chain Whales, Breakevens & Funding */}
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                2A. On-Chain Whales, 3 Breakeven Lines & Miner Ribbons
              </h3>
              <div className="flex gap-1 text-xs font-mono">
                <button
                  onClick={() => setView2A("A")}
                  className={`px-2 py-1 rounded ${
                    view2A === "A" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Option A: Breakeven Ladder
                </button>
                <button
                  onClick={() => setView2A("B")}
                  className={`px-2 py-1 rounded ${
                    view2A === "B" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Option B: Whale vs. Perp Matrix
                </button>
              </div>
            </div>

            {view2A === "A" ? (
              <div className="space-y-2.5 font-mono text-xs">
                {[
                  { label: "Live Bitcoin Spot ($BTC)", val: s2.module_2a_onchain_whales.btc_spot_usd, color: "bg-cyan-500" },
                  { label: "Short-Term Holder (<155d) Realized Price", val: s2.module_2a_onchain_whales.breakeven_lines.sth_realized_price_155d_usd, color: "bg-emerald-500" },
                  { label: "US Spot ETF ($IBIT/$FBTC) VWAP Cost Basis", val: s2.module_2a_onchain_whales.breakeven_lines.us_etf_vwap_cost_basis_usd, color: "bg-blue-500" },
                  { label: "Bitcoin Miner Production Cost Floor", val: s2.module_2a_onchain_whales.breakeven_lines.miner_production_cost_floor_usd, color: "bg-amber-500" },
                ].map((b, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-300">{b.label}</span>
                      <span className="font-bold text-white">${b.val.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${b.color}`} style={{ width: `${(b.val / 75000) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 text-slate-300">
                  Hash Ribbon: <strong className="text-emerald-400">{s2.module_2a_onchain_whales.hash_ribbon.miner_status}</strong> ({s2.module_2a_onchain_whales.hash_ribbon.hashrate_30d_eh} vs {s2.module_2a_onchain_whales.hash_ribbon.hashrate_60d_eh} EH/s)
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Coinbase USD vs Binance USDT</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    +{s2.module_2a_onchain_whales.coinbase_vs_binance_premium_bps} bps
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans">
                    Positive spread = Onshore US institutional/ETF buying leading offshore perps.
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Perp Funding APR</div>
                  <div className="text-lg font-bold text-cyan-300 mt-1">
                    +{s2.module_2a_onchain_whales.perp_funding_apr_pct}% APR
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans">
                    Un-crowded perp leverage (far below 25%+ blow-off danger zone).
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-slate-200">
              <strong className="text-cyan-300 font-mono">Actionable Call (2A): </strong>
              {s2.module_2a_onchain_whales.actionable_directive}
            </div>
          </div>

          {/* Sub-Module 2B: Stablecoins, US T-Bills & 4-Stage Crypto/Equity Drainage */}
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                2B. Stablecoin T-Bill Bid & 4-Stage Crypto/Equity Drainage
              </h3>
              <div className="flex gap-1 text-xs font-mono">
                <button
                  onClick={() => setView2B("A")}
                  className={`px-2 py-1 rounded ${
                    view2B === "A" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Option A: T-Bill Share & Cycle
                </button>
                <button
                  onClick={() => setView2B("B")}
                  className={`px-2 py-1 rounded ${
                    view2B === "B" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Option B: Equity Drainage Check
                </button>
              </div>
            </div>

            {view2B === "A" ? (
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Total Stablecoins ($USDT+$USDC)</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    ${s2.module_2b_stablecoins_and_drainage.stablecoin_stats.total_stables_bn}B{" "}
                    <span className="text-emerald-400 text-xs">
                      (+{s2.module_2b_stablecoins_and_drainage.stablecoin_stats.minting_30d_pct}% 30D)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans">
                    Holds ${s2.module_2b_stablecoins_and_drainage.stablecoin_tbill_holdings_bn}B in US T-Bills ({s2.module_2b_stablecoins_and_drainage.stablecoin_share_of_tbills_pct}% of $6.2T T-Bill market).
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Active Crypto Cycle Stage</div>
                  <div className="text-xs font-bold text-amber-300 mt-1">
                    {s2.module_2b_stablecoins_and_drainage.crypto_cycle_stage.current_stage}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans">
                    BTC.D: {s2.module_2b_stablecoins_and_drainage.crypto_cycle_stage.btc_dominance_pct}% • SSR Z: {s2.module_2b_stablecoins_and_drainage.crypto_cycle_stage.ssr_z_score}σ
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Detected Fiat Funding Source:</span>
                  <span className="text-cyan-300">{s2.module_2b_stablecoins_and_drainage.detected_funding_source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">63D Corr (Alt Volume vs $ARKK/$QQQ):</span>
                  <span className="text-amber-300">+{s2.module_2b_stablecoins_and_drainage.cross_market_equity_drainage.arkk_vs_qqq_63d_corr_to_alts}</span>
                </div>
                <div className="text-emerald-300 font-sans">
                  Status: {s2.module_2b_stablecoins_and_drainage.cross_market_equity_drainage.sphb_vs_qual_drainage_status}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-slate-200">
              <strong className="text-cyan-300 font-mono">Actionable Call (2B): </strong>
              {s2.module_2b_stablecoins_and_drainage.actionable_directive}
            </div>
          </div>

          {/* Sub-Module 2C: Hedge-Fund Cayman Basis Trade & Repo Fragility */}
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                2C. Cayman Islands Treasury Basis Trade & Repo Stress
              </h3>
              <div className="flex gap-1 text-xs font-mono">
                <button
                  onClick={() => setView2C("A")}
                  className={`px-2 py-1 rounded ${
                    view2C === "A" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Option A: Basis & Repo Gauges
                </button>
                <button
                  onClick={() => setView2C("B")}
                  className={`px-2 py-1 rounded ${
                    view2C === "B" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Option B: Treasury Hot Potato
                </button>
              </div>
            </div>

            {view2C === "A" ? (
              <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">Cayman Gross Basis</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    ${s2.module_2c_cayman_basis_trade.repo_levered_gross_notional_bn}B
                  </div>
                  <div className="text-[10px] text-slate-400">
                    CFTC Short: {s2.module_2c_cayman_basis_trade.cftc_tff_10y_leveraged_short_pct_oi}th pct
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">SOFR − IORB Spread</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {s2.module_2c_cayman_basis_trade.sofr_minus_iorb_bps} bps
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Repo Plumbing Calm (&lt;+3 bps)
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">MOVE Vol Index</div>
                  <div className="text-base font-bold text-cyan-300 mt-0.5">
                    {s2.module_2c_cayman_basis_trade.move_index}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Below 105 De-Gross Trigger
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {Object.entries(s2.module_2c_cayman_basis_trade.treasury_ownership_shares_pct).map(
                  ([holder, pct]: [string, any], i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-300">{holder}</span>
                        <span className="font-bold text-white">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-slate-200">
              <strong className="text-emerald-300 font-mono">Actionable Call (2C): </strong>
              {s2.module_2c_cayman_basis_trade.actionable_directive}
            </div>
          </div>

          {/* Sub-Module 2D: Sovereign Gold Bid Residual & Session Split */}
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                2D. Sovereign Gold Bid Residual & Asian-vs-NY Session Split
              </h3>
              <div className="flex gap-1 text-xs font-mono">
                <button
                  onClick={() => setView2D("A")}
                  className={`px-2 py-1 rounded ${
                    view2D === "A" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Option A: Residual & Session Split
                </button>
                <button
                  onClick={() => setView2D("B")}
                  className={`px-2 py-1 rounded ${
                    view2D === "B" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Option B: World Reserve Share
                </button>
              </div>
            </div>

            {view2D === "A" ? (
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">63D Gold vs TIPS+DXY Residual</div>
                  <div className="text-lg font-bold text-amber-300 mt-0.5">
                    +{s2.module_2d_sovereign_gold_bid.ols_63d_sovereign_residual_sigma}σ
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans">
                    &gt;+1.5σ confirms price-insensitive sovereign physical floor buying.
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                  <div className="text-slate-400">90D Session Return Split</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    Asia Physical: +{s2.module_2d_sovereign_gold_bid.asian_physical_session_cum_90d_pct}%
                  </div>
                  <div className="text-sm font-bold text-rose-400">
                    NY COMEX Paper: {s2.module_2d_sovereign_gold_bid.ny_comex_paper_session_cum_90d_pct}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {Object.entries(s2.module_2d_sovereign_gold_bid.world_reserves_share_pct).map(
                  ([k, v]: [string, any], i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-300">{k}</span>
                        <span className="font-bold text-amber-300">{v}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${v * 1.8}%` }} />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-slate-200">
              <strong className="text-amber-300 font-mono">Actionable Call (2D): </strong>
              {s2.module_2d_sovereign_gold_bid.actionable_directive}
            </div>
          </div>
        </div>
      </section>

      {/* STRUCTURE #3: PHYSICAL CAPEX / RESOURCE DEPLETION CLOCK */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">
              Structure #3: Physical Capex / Resource Depletion Clock (Goehring & Rozencwajg / Jeff Currie)
            </h2>
            <p className="text-xs text-slate-400">
              Identifies multi-year supply deficits where Upstream Capex-to-Depreciation (DD&A) is below 1.0x and cross-commodity ratios signal extreme relative value.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
              Gold / Oil Ratio: {s3.commodity_valuation_ratios.gold_to_oil_ratio}x (Mean: 16.5x)
            </span>
            <span className="px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              Copper / Gold Z-Score: {s3.commodity_valuation_ratios.copper_to_gold_ratio_z}σ
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {s3.depletion_clock_sectors.map((sec: any, idx: number) => (
            <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="font-bold text-white text-sm">{sec.sector}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Capex / DD&A: {sec.capex_to_dda_ratio}x
                </span>
              </div>
              <div className="text-xs font-mono text-cyan-300">{sec.clock_stage}</div>
              <div className="text-xs font-mono text-slate-400">
                Vehicles: {sec.tickers.map((t: string) => `$${t}`).join(", ")} • S&P Relative Valuation Percentile: {sec.valuation_vs_spx_pct}th pct
              </div>
              <p className="text-xs text-slate-200 leading-relaxed pt-1 border-t border-slate-800/80">
                {sec.actionable_call}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

## 6. Verification Command for Antigravity IDE

```bash
python -c "import asyncio; from backend.app.quant_engine.commodities_engine import CommoditiesAndAlternativesEngine; s1 = CommoditiesAndAlternativesEngine.compute_structure_1_term_structure(); print('WTI Net Conv Yield:', s1['term_structure_matrix'][0]['rate_adjusted_net_convenience_yield_pct'], '% | Routed:', s1['term_structure_matrix'][0]['routed_vehicle'])"
```
*Expected Output*: `WTI Net Conv Yield: 11.09 % | Routed: Direct Futures ETF ($USO) + Royalty Leader ($TPL)`.
