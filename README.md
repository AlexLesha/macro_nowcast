# MacroPulse Alpha: Quantitative Macro Nowcast & Microstructure Engine

Cross-Asset Quantitative Macro Terminal combining multi-framework nowcasting (Hedgeye Quads, 42 Macro Grid, Prometheus analogs), options microstructure dealer gamma exposure (GEX), 42-market risk ranges & VAMS momentum scores, and open-data ingestion connectors.

---

## Architecture Overview

```
macro_nowcast/
├── backend/
│   ├── app/
│   │   ├── config.py             # Environment configuration (FRED, Tiingo, YouTube, SQLite/PostgreSQL)
│   │   ├── db.py                 # SQLAlchemy engine, session generator & SQLite/Postgres auto-init
│   │   ├── models/
│   │   │   ├── db_models.py      # 5 Core Tables (macro_series, market_daily, options_microstructure, etc.)
│   │   │   └── schemas.py        # Pydantic schemas for API serialization
│   │   ├── ingestion/
│   │   │   ├── fred_client.py    # Public CSV fallback + API client with YoY, MoM, 3Y Z-Score transforms
│   │   │   ├── treasury_client.py# US Fiscal Data DTS Table 2 (TGA) & MTS deficit outlays
│   │   │   ├── market_options_client.py # Daily OHLCV, VAMS, Risk Ranges & GEX option chain analytics
│   │   │   ├── etf_holdings_client.py   # Warren Pies / 3Fourteen FCTE & RAA live holdings tracker
│   │   │   └── cftc_sentiment_client.py # CFTC Commitments of Traders institutional sentiment
│   │   ├── api/
│   │   │   └── routes.py         # REST API routes for macro series, matrix, options, and regime nowcasts
│   │   └── main.py               # FastAPI entry point with CORS & lifespan schema boot
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # Next.js 15 root layout in dark terminal theme
│   │   │   ├── page.tsx          # Real-time quantitative macro dashboard
│   │   │   └── globals.css       # Custom scrollbars and styling
│   │   └── components/
│   │       ├── Header.tsx        # Terminal nav, live API status badge & global ingestion trigger
│   │       ├── RegimeBanner.tsx  # Hedgeye Quad probabilities, Fed Net Liquidity, KISS weights
│   │       ├── MacroSeriesTable.tsx # FRED & Treasury monitor with inline ingestion triggers
│   │       ├── RiskMatrixTable.tsx  # 42-market asset class filters, VAMS & risk ranges
│   │       ├── OptionsMicrostructureCard.tsx # GEX, gamma flip levels, call/put walls, 0DTE heat
│   │       ├── IntelligenceFeed.tsx # Systematic deltas, Warren Pies FCTE 20 holdings, RAA model
│   │       └── ChartModal.tsx    # Recharts time-series level, YoY %, and 3Y Z-score overlay
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── Dockerfile
├── docker-compose.yml            # FastAPI (8000), Next.js (3000), Postgres (5432), Redis (6379)
└── .env.example
```

---

## Database Models

1. **`macro_series`**: `(series_id, source, date, value, yoy_roc, mom_roc, z_score_3y, updated_at)`
2. **`market_daily`**: `(ticker, asset_class, date, open, high, low, close, volume, rv_21d, iv_30d, vams_score, vams_state, rr_trade_low, rr_trade_high, rr_trend_pivot, rr_trend_state, rr_tail_pivot)`
3. **`options_microstructure`**: `(ticker, date, total_gex, zero_dte_heat_ratio, gamma_flip_level, call_wall, put_wall, skew_25d, put_call_vol_ratio, crowding_z)`
4. **`regime_snapshots`**: `(date, us_monthly_quad, us_quarterly_quad, quad_1_prob, quad_2_prob, quad_3_prob, quad_4_prob, grid_regime, grid_scores_json, prometheus_similarity_json, net_liquidity_usd_bn, global_liquidity_usd_tn, debt_to_liquidity_pct, kiss_weights_json)`
5. **`intelligence_deltas`**: `(id, timestamp_utc, framework_author, source_type, source_title, source_url, published_at, summary_markdown, extracted_json, affected_tickers)`

---

## Quickstart (Local Development)

### 1. Backend (FastAPI + Python 3.12)
```bash
cd backend
# Create virtual environment and install packages
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt

# Run the FastAPI server (runs on port 8000 with auto-reloading SQLite database)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend (Next.js 15 + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Docker Compose Deployment
```bash
docker-compose up --build
```
This boots:
- **FastAPI backend** on `http://localhost:8000`
- **Next.js frontend** on `http://localhost:3000`
- **PostgreSQL 16** on `localhost:5432`
- **Redis 7** on `localhost:6379`
