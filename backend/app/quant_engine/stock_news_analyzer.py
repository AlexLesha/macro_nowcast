"""
backend/app/quant_engine/stock_news_analyzer.py
================================================
Institutional 2-Week Working Days News Intelligence & Price Impact Engine.
Fetches verified company news from Finnhub & Alpha Vantage, cross-references with
Massive, Alpha Vantage, and yfinance daily trading bars, and generates concise
3-5 bullet point day-by-day market impact analyses (organized into Current Week
and Prior Week trading day columns) powered by Groq Llama 3.3 70B (with deterministic
grounded fallback). Excludes non-working and non-trading days.
"""

import json
import logging
import math
import os
import re
import time
from datetime import datetime, timedelta, timezone, date
from typing import Any, Dict, List, Optional
import httpx
import yfinance as yf

try:
    from app.config import settings
    from app.llm_gateway import llm_gateway
except ImportError:
    from backend.app.config import settings
    from backend.app.llm_gateway import llm_gateway

logger = logging.getLogger("macropulse.stock_news_analyzer")

# In-memory TTL cache for news synthesis (15 min TTL)
_HOT_NEWS_CACHE: Dict[str, Dict[str, Any]] = {}
_HOT_NEWS_TTL_SECONDS = 900  # 15 minutes

# Circuit breaker for Alpha Vantage rate-limit exhaustion (24-hour backoff)
_ALPHA_CIRCUIT_BREAKER_UNTIL: float = 0.0


class StockHotNewsEngine:
    """Institutional 2-Week Working Days News Intelligence & Price Impact Engine."""

    @classmethod
    def fetch_company_news(
        cls, ticker: str, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        """Retrieves raw company news from Finnhub with Alpha Vantage fallback."""
        clean_t = ticker.strip().upper()
        articles: List[Dict[str, Any]] = []

        # 1. Finnhub Company News
        if settings.FINNHUB_API_KEY:
            try:
                url = (
                    f"https://finnhub.io/api/v1/company-news"
                    f"?symbol={clean_t}&from={start_date}&to={end_date}&token={settings.FINNHUB_API_KEY}"
                )
                with httpx.Client(timeout=8.0) as client:
                    resp = client.get(url)
                    if resp.status_code == 200:
                        raw = resp.json()
                        if isinstance(raw, list):
                            for item in raw:
                                dt_epoch = item.get("datetime", 0)
                                if dt_epoch:
                                    dt_str = datetime.fromtimestamp(
                                        dt_epoch, tz=timezone.utc
                                    ).strftime("%Y-%m-%d")
                                else:
                                    dt_str = end_date
                                articles.append({
                                    "headline": item.get("headline", "").strip(),
                                    "summary": item.get("summary", "").strip(),
                                    "source": item.get("source", "Finnhub"),
                                    "url": item.get("url", ""),
                                    "date": dt_str,
                                    "datetime_epoch": dt_epoch,
                                })
                            logger.info(f"Fetched {len(articles)} Finnhub news items for {clean_t}")
            except Exception as e:
                logger.warning(f"Finnhub news fetch error for {clean_t}: {e}")

        # 2. Alpha Vantage Fallback (Protected by 24h Circuit Breaker)
        global _ALPHA_CIRCUIT_BREAKER_UNTIL
        if not articles and settings.ALPHA_API_KEY and time.time() >= _ALPHA_CIRCUIT_BREAKER_UNTIL:
            try:
                url = (
                    f"https://www.alphavantage.co/query"
                    f"?function=NEWS_SENTIMENT&tickers={clean_t}&limit=50&apikey={settings.ALPHA_API_KEY}"
                )
                with httpx.Client(timeout=6.0) as client:
                    resp = client.get(url)
                    if resp.status_code == 200:
                        data = resp.json() or {}
                        if data.get("Note") or data.get("Information"):
                            _ALPHA_CIRCUIT_BREAKER_UNTIL = time.time() + 86400
                            logger.info(f"[AlphaCircuitBreaker] News rate limit tripped; 24h backoff active.")
                        else:
                            feed = data.get("feed", [])
                            for item in feed:
                                time_pub = item.get("time_published", "")
                                dt_str = end_date
                                if len(time_pub) >= 8:
                                    dt_str = f"{time_pub[:4]}-{time_pub[4:6]}-{time_pub[6:8]}"
                                articles.append({
                                    "headline": item.get("title", "").strip(),
                                    "summary": item.get("summary", "").strip(),
                                    "source": item.get("source", "Alpha Vantage"),
                                    "url": item.get("url", ""),
                                    "date": dt_str,
                                    "datetime_epoch": int(time.time()),
                                })
                            logger.info(f"Fetched {len(articles)} Alpha Vantage news items for {clean_t}")
            except Exception as e:
                logger.warning(f"Alpha Vantage news fetch error for {clean_t}: {e}")

        return articles

    @classmethod
    def fetch_price_bars(
        cls, ticker: str, start_date: str, end_date: str
    ) -> Dict[str, Dict[str, Any]]:
        """Retrieves daily OHLCV bars for the past 2-3 weeks to measure price impact."""
        clean_t = ticker.strip().upper()
        bars_by_date: Dict[str, Dict[str, Any]] = {}

        # 1. Massive REST API v2 daily aggregates
        if settings.MASSIVE_API_KEY:
            try:
                headers = {"Authorization": f"Bearer {settings.MASSIVE_API_KEY}"}
                url = (
                    f"https://api.massive.com/v2/aggs/ticker/{clean_t}"
                    f"/range/1/day/{start_date}/{end_date}"
                )
                with httpx.Client(headers=headers, timeout=8.0) as client:
                    resp = client.get(url)
                    if resp.status_code == 200:
                        results = resp.json().get("results", [])
                        for b in results:
                            dt = datetime.fromtimestamp(b["t"] / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
                            open_px = round(float(b.get("o", 0.0)), 2)
                            close_px = round(float(b.get("c", 0.0)), 2)
                            high_px = round(float(b.get("h", 0.0)), 2)
                            low_px = round(float(b.get("l", 0.0)), 2)
                            vol = float(b.get("v", 0.0))
                            pct_chg = round(((close_px - open_px) / open_px) * 100, 2) if open_px > 0 else 0.0
                            direction = "UP" if pct_chg > 0.15 else ("DOWN" if pct_chg < -0.15 else "FLAT")
                            vol_str = f"{vol / 1e6:.1f}M" if vol >= 1e6 else f"{vol / 1e3:.0f}K"
                            bars_by_date[dt] = {
                                "traded": vol > 0,
                                "open": open_px,
                                "close": close_px,
                                "high": high_px,
                                "low": low_px,
                                "volume": vol,
                                "volume_str": vol_str,
                                "change_pct": pct_chg,
                                "direction": direction,
                                "day_range": f"${low_px:.2f} - ${high_px:.2f}",
                            }
                        logger.info(f"Loaded {len(bars_by_date)} daily bars from Massive for {clean_t}")
                    elif resp.status_code in (401, 403):
                        logger.info(f"Massive bars un-entitled (HTTP {resp.status_code}) for {clean_t}; switching over to Alpha Vantage.")
            except Exception as e:
                logger.warning(f"Massive bars fetch error for {clean_t}: {e}")

        # 2. Alpha Vantage TIME_SERIES_DAILY Fallback (Protected by Circuit Breaker)
        global _ALPHA_CIRCUIT_BREAKER_UNTIL
        if not bars_by_date and settings.ALPHA_API_KEY and time.time() >= _ALPHA_CIRCUIT_BREAKER_UNTIL:
            try:
                url = (
                    f"https://www.alphavantage.co/query"
                    f"?function=TIME_SERIES_DAILY&symbol={clean_t}&apikey={settings.ALPHA_API_KEY}"
                )
                with httpx.Client(timeout=6.0) as client:
                    resp = client.get(url)
                    if resp.status_code == 200:
                        data = resp.json() or {}
                        info_msg = data.get("Information", "")
                        note_msg = data.get("Note", "")
                        if "rate limit" in (info_msg + note_msg).lower() or "spread out your free" in (info_msg + note_msg).lower():
                            _ALPHA_CIRCUIT_BREAKER_UNTIL = time.time() + 86400
                            logger.info(f"[AlphaCircuitBreaker] Bars rate limit tripped; 24h backoff active.")
                        else:
                            ts = data.get("Time Series (Daily)", {})
                            for dt_str, data in ts.items():
                                if start_date <= dt_str <= end_date:
                                    open_px = round(float(data.get("1. open", 0.0)), 2)
                                    close_px = round(float(data.get("4. close", 0.0)), 2)
                                    high_px = round(float(data.get("2. high", 0.0)), 2)
                                    low_px = round(float(data.get("3. low", 0.0)), 2)
                                    vol = float(data.get("5. volume", 0.0))
                                    pct_chg = round(((close_px - open_px) / open_px) * 100, 2) if open_px > 0 else 0.0
                                    direction = "UP" if pct_chg > 0.15 else ("DOWN" if pct_chg < -0.15 else "FLAT")
                                    vol_str = f"{vol / 1e6:.1f}M" if vol >= 1e6 else f"{vol / 1e3:.0f}K"
                                    bars_by_date[dt_str] = {
                                        "traded": vol > 0,
                                        "open": open_px,
                                        "close": close_px,
                                        "high": high_px,
                                        "low": low_px,
                                        "volume": vol,
                                        "volume_str": vol_str,
                                        "change_pct": pct_chg,
                                        "direction": direction,
                                        "day_range": f"${low_px:.2f} - ${high_px:.2f}",
                                    }
                            logger.info(f"Loaded {len(bars_by_date)} daily bars from Alpha Vantage for {clean_t}")
            except Exception as e:
                logger.warning(f"Alpha Vantage bars fetch error for {clean_t}: {e}")

        # 3. yfinance Fallback if still empty
        if not bars_by_date:
            try:
                hist = yf.download(clean_t, start=start_date, end=end_date, progress=False, auto_adjust=True)
                if not hist.empty:
                    for dt_idx, row in hist.iterrows():
                        dt_str = dt_idx.strftime("%Y-%m-%d")
                        open_px = round(float(row.get("Open", 0.0)), 2)
                        close_px = round(float(row.get("Close", 0.0)), 2)
                        high_px = round(float(row.get("High", 0.0)), 2)
                        low_px = round(float(row.get("Low", 0.0)), 2)
                        vol = float(row.get("Volume", 0.0))
                        pct_chg = round(((close_px - open_px) / open_px) * 100, 2) if open_px > 0 else 0.0
                        direction = "UP" if pct_chg > 0.15 else ("DOWN" if pct_chg < -0.15 else "FLAT")
                        vol_str = f"{vol / 1e6:.1f}M" if vol >= 1e6 else f"{vol / 1e3:.0f}K"
                        bars_by_date[dt_str] = {
                            "traded": vol > 0,
                            "open": open_px,
                            "close": close_px,
                            "high": high_px,
                            "low": low_px,
                            "volume": vol,
                            "volume_str": vol_str,
                            "change_pct": pct_chg,
                            "direction": direction,
                            "day_range": f"${low_px:.2f} - ${high_px:.2f}",
                        }
                    logger.info(f"Loaded {len(bars_by_date)} daily bars from yfinance for {clean_t}")
            except Exception as e:
                logger.warning(f"yfinance bars fetch error for {clean_t}: {e}")

        return bars_by_date

    @classmethod
    def generate_hot_news_analysis(
        cls,
        ticker: str,
        entity_name: str,
        sector: str = "",
        industry: str = "",
        force_refresh: bool = False,
    ) -> Dict[str, Any]:
        """
        Generates a 2-week working days (10 trading days) news & price impact analysis for the searched company.
        Excludes non-working and non-trading days.
        Organized into 2 columns: Current Week (last 5 trading days) & Prior Week (preceding 5 trading days).
        Each day's content has 3-5 concise bullet points highlighting market-moving events (or 'No events' if quiet).
        Retains Open, Close, Change %, Volume, and high-impact event tags (Earnings, C-level, Legal, M&A).
        """
        clean_t = ticker.strip().upper()
        now_ts = int(time.time())

        # Check in-memory TTL cache
        if not force_refresh and clean_t in _HOT_NEWS_CACHE:
            cached = _HOT_NEWS_CACHE[clean_t]
            if now_ts - cached.get("_cached_at", 0) < _HOT_NEWS_TTL_SECONDS:
                return cached["data"]

        today_dt = datetime.now(timezone.utc).date()

        # Step 1: Query a 22-calendar-day window to guarantee capturing at least 10 working trading days
        window_start_dt = today_dt - timedelta(days=22)
        start_str = window_start_dt.strftime("%Y-%m-%d")
        end_str = today_dt.strftime("%Y-%m-%d")

        # Step 2: Fetch raw news articles and price bars
        articles = cls.fetch_company_news(clean_t, start_str, end_str)
        bars_by_date = cls.fetch_price_bars(clean_t, start_str, end_str)

        # Step 3: Group articles by calendar date
        articles_by_date: Dict[str, List[Dict[str, Any]]] = {}
        for a in articles:
            articles_by_date.setdefault(a["date"], []).append(a)

        # Step 4: Gather candidate working days (Monday-Friday only), excluding weekends
        # Walk backwards from today, collecting days with weekday < 5
        candidate_days: List[date] = []
        cur_dt = today_dt
        while len(candidate_days) < 14 and cur_dt >= window_start_dt:
            if cur_dt.weekday() < 5:  # Monday=0 to Friday=4
                candidate_days.append(cur_dt)
            cur_dt -= timedelta(days=1)

        # Filter candidate days: exclude holidays / non-trading days that have zero trading activity
        # If a candidate day has traded=False or zero volume and no news, it was a closed market holiday.
        trading_days: List[date] = []
        for d in candidate_days:
            d_str = d.strftime("%Y-%m-%d")
            bar = bars_by_date.get(d_str)
            # If bar exists and traded, or if today is an active weekday with market open, include
            if bar and bar.get("traded"):
                trading_days.append(d)
            elif d == today_dt and d.weekday() < 5:
                # Today may be mid-session or pre-market
                trading_days.append(d)
            elif bar and not bar.get("traded"):
                # Market holiday with explicit zero trade - exclude
                continue
            else:
                # If no bar at all and no news, likely a holiday; but if we still need 10 days, keep weekday
                trading_days.append(d)

            if len(trading_days) >= 10:
                break

        # If fewer than 10 trading days found, pad from candidate weekdays
        for d in candidate_days:
            if len(trading_days) >= 10:
                break
            if d not in trading_days:
                trading_days.append(d)

        trading_days = trading_days[:10]

        # Step 5: Assemble structured daily contexts for all 10 working days
        # OPT-2: Check DB for static completed past trading days (<10ms)
        past_dates = [d.strftime("%Y-%m-%d") for d in trading_days if d < today_dt]
        cached_days_by_date: Dict[str, Dict[str, Any]] = {}
        if not force_refresh:
            try:
                from app.db.stock_compressed_store import StockCompressedStore
                cached_days_by_date = StockCompressedStore.get_daily_news_days(clean_t, past_dates)
            except Exception:
                pass

        days_context: List[Dict[str, Any]] = []
        for day_dt in trading_days:
            date_str = day_dt.strftime("%Y-%m-%d")
            day_name = day_dt.strftime("%A")

            # If already cached in DB and not force_refresh, reuse directly
            if date_str in cached_days_by_date:
                cached_item = cached_days_by_date[date_str]
                days_context.append({
                    "date": date_str,
                    "day_name": day_name,
                    "is_weekend": False,
                    "price_action": cached_item.get("price_action", {}),
                    "articles_count": cached_item.get("articles_count", 0),
                    "articles": [],
                    "_db_cached": True,
                    "_db_item": cached_item,
                })
                continue

            bar = bars_by_date.get(date_str)
            if not bar:
                bar = {
                    "traded": True,
                    "open": None,
                    "close": None,
                    "high": None,
                    "low": None,
                    "volume": 0,
                    "volume_str": "—",
                    "change_pct": 0.0,
                    "direction": "FLAT",
                    "day_range": "—",
                }

            day_articles = articles_by_date.get(date_str, [])
            days_context.append({
                "date": date_str,
                "day_name": day_name,
                "is_weekend": False,
                "price_action": bar,
                "articles_count": len(day_articles),
                "articles": day_articles[:6],
                "_db_cached": False,
            })

        # Compute deterministic 2-week price metrics (High, Low, Net Move %, Range %, Volatility %)
        metrics = cls._compute_2w_price_metrics(days_context)

        # Only invoke Groq if there are un-cached days
        un_cached_days = [d for d in days_context if not d.get("_db_cached")]
        groq_result = None
        if un_cached_days:
            groq_result = cls._call_groq_hot_news_bullets(
                ticker=clean_t,
                entity_name=entity_name,
                sector=sector,
                industry=industry,
                days_context=days_context,
                metrics=metrics,
            )

        if groq_result and groq_result.get("status") == "ok":
            payload = groq_result
        else:
            # Deterministic fallback grounded strictly in real Finnhub articles + Massive prices
            payload = cls._build_grounded_working_days_hot_news(
                ticker=clean_t,
                entity_name=entity_name,
                sector=sector,
                industry=industry,
                days_context=days_context,
                metrics=metrics,
            )

        # Attach metrics and net move to payload
        payload["metrics"] = metrics
        payload["net_price_change_pct"] = metrics.get("net_price_change_pct", 0.0)

        # Merge in any pre-cached DB days (and clean legacy price action sentences & cited figures)
        for i, day_dict in enumerate(payload.get("days", [])):
            d_date = day_dict.get("date")
            if d_date in cached_days_by_date:
                cached_d = dict(cached_days_by_date[d_date])
                raw_b = cached_d.get("bullet_points", [])
                if isinstance(raw_b, list):
                    cleaned_b = [
                        b for b in raw_b
                        if not re.match(r"^Stock (?:advanced|declined|held flat)", str(b), re.I)
                        and not re.match(r"^Regular trading session logged", str(b), re.I)
                        and not re.match(r"^Key cited figures", str(b), re.I)
                    ]
                    cached_d["bullet_points"] = cleaned_b if cleaned_b else ["No events"]
                payload["days"][i] = cached_d
            else:
                raw_b = day_dict.get("bullet_points", [])
                if isinstance(raw_b, list):
                    day_dict["bullet_points"] = [
                        b for b in raw_b
                        if not re.match(r"^Key cited figures", str(b), re.I)
                    ]

        # OPT-2: Persist newly synthesized days into database
        try:
            from app.db.stock_compressed_store import StockCompressedStore
            for day_item in payload.get("days", []):
                # Only persist completed sessions (before today) into permanent DB
                if day_item.get("date") and day_item.get("date") < today_dt.strftime("%Y-%m-%d"):
                    StockCompressedStore.save_daily_news_day(clean_t, day_item)
        except Exception as e:
            logger.warning(f"[StockHotNewsEngine] Error persisting daily news to DB for {clean_t}: {e}")

        # Step 7: Partition into 2 Columns: Current Week (last 5 trading days) & Prior Week (preceding 5 trading days)
        all_days = payload.get("days", [])
        week_current = all_days[:5]
        week_prior = all_days[5:10]

        payload["columns"] = {
            "week_current": {
                "label": "Current Week (Last 5 Trading Days)",
                "days": week_current,
            },
            "week_prior": {
                "label": "Prior Week (Preceding 5 Trading Days)",
                "days": week_prior,
            },
        }

        # Store in TTL cache
        _HOT_NEWS_CACHE[clean_t] = {
            "data": payload,
            "_cached_at": now_ts,
        }
        return payload

    @classmethod
    def _compute_2w_price_metrics(cls, days_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates deterministic 2-week price metrics: Low, High, Net Move %, Price Range %, Realized Volatility %."""
        valid_highs: List[float] = []
        valid_lows: List[float] = []
        valid_changes: List[float] = []
        up_days = 0
        down_days = 0

        for d in days_context:
            pa = d.get("price_action") or {}
            h = pa.get("high")
            l = pa.get("low")
            c = pa.get("close")
            o = pa.get("open")
            chg = pa.get("change_pct")

            if h is not None:
                valid_highs.append(float(h))
            elif o is not None and c is not None:
                valid_highs.append(max(float(o), float(c)))

            if l is not None:
                valid_lows.append(float(l))
            elif o is not None and c is not None:
                valid_lows.append(min(float(o), float(c)))

            if chg is not None:
                chg_flt = float(chg)
                valid_changes.append(chg_flt)
                if chg_flt > 0:
                    up_days += 1
                elif chg_flt < 0:
                    down_days += 1

        start_px: Optional[float] = None
        end_px: Optional[float] = None

        # Oldest trading day is at the end of days_context (index -1)
        for d in reversed(days_context):
            pa = d.get("price_action") or {}
            if pa.get("open") is not None:
                start_px = float(pa["open"])
                break
            elif pa.get("close") is not None:
                start_px = float(pa["close"])
                break

        # Latest trading day is at the start of days_context (index 0)
        for d in days_context:
            pa = d.get("price_action") or {}
            if pa.get("close") is not None:
                end_px = float(pa["close"])
                break
            elif pa.get("open") is not None:
                end_px = float(pa["open"])
                break

        high_px = max(valid_highs) if valid_highs else (end_px or 0.0)
        low_px = min(valid_lows) if valid_lows else (end_px or 0.0)

        net_move_pct = 0.0
        range_pct = 0.0
        if start_px and start_px > 0:
            if end_px is not None:
                net_move_pct = ((end_px - start_px) / start_px) * 100.0
            range_pct = ((high_px - low_px) / start_px) * 100.0

        if len(valid_changes) >= 2:
            mean_chg = sum(valid_changes) / len(valid_changes)
            var_chg = sum((x - mean_chg) ** 2 for x in valid_changes) / (len(valid_changes) - 1)
            vol_pct = math.sqrt(var_chg) * math.sqrt(252)
        else:
            vol_pct = abs(net_move_pct)

        return {
            "start_price": round(start_px, 2) if start_px is not None else 0.0,
            "end_price": round(end_px, 2) if end_px is not None else 0.0,
            "high_price": round(high_px, 2),
            "low_price": round(low_px, 2),
            "net_price_change_pct": round(net_move_pct, 2),
            "price_range_pct": round(range_pct, 2),
            "volatility_pct": round(vol_pct, 2),
            "up_sessions": up_days,
            "down_sessions": down_days,
            "total_sessions": len(days_context),
        }

    @classmethod
    def _call_groq_hot_news_bullets(
        cls,
        ticker: str,
        entity_name: str,
        sector: str,
        industry: str,
        days_context: List[Dict[str, Any]],
        metrics: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Invokes Groq LLM Gateway requesting sharp, concise 3-5 bullet points per day with high-impact tags and critical price/volatility analysis."""
        if not settings.GROQ_API_KEY:
            return None

        m = metrics or cls._compute_2w_price_metrics(days_context)
        vol_pct = m.get("volatility_pct", 0.0)
        low_px = m.get("low_price", 0.0)
        high_px = m.get("high_price", 0.0)
        net_pct = m.get("net_price_change_pct", 0.0)
        start_px = m.get("start_price", 0.0)
        end_px = m.get("end_price", 0.0)
        up_cnt = m.get("up_sessions", 0)
        down_cnt = m.get("down_sessions", 0)
        rng_pct = m.get("price_range_pct", 0.0)

        # Build prompt payload
        days_text_blocks = []
        for d in days_context:
            dt = d["date"]
            dn = d["day_name"]
            pa = d["price_action"]
            if pa.get("open") is not None and pa.get("close") is not None:
                price_str = (
                    f"Open ${pa['open']:.2f}, Close ${pa['close']:.2f}, "
                    f"Change: {pa['change_pct']:+.2f}%, Volume: {pa['volume_str']}, Range: {pa['day_range']}"
                )
            else:
                price_str = "Price Data: Active Trading Session (Volume Pending)"

            arts_text = "\n".join([
                f"   - Headline: {a['headline']} (Source: {a['source']}) | Summary: {a['summary'][:200]}"
                for a in d["articles"]
            ]) if d["articles"] else "   - No specific individual press releases filed on this calendar date."

            days_text_blocks.append(
                f"TRADING DAY: {dt} ({dn})\n{price_str}\nNews Articles ({d['articles_count']}):\n{arts_text}"
            )

        context_str = "\n\n".join(days_text_blocks)

        system_prompt = (
            "You are a Wall Street quantitative equity analyst. Your job is to produce a high-impact, "
            "critical price and news intelligence breakdown for portfolio managers across the last 10 working trading days. "
            "In 'weekly_takeaway', produce a deep, critical Wall Street macro & equity analysis of the 2-week price movement, "
            f"incorporating the exact metrics: Volatility ({vol_pct:.1f}%), Low (${low_px:.2f}), High (${high_px:.2f}), and Net Move ({net_pct:+.2f}%). "
            f"Assess systematic factor beta ({sector or 'Sector'}) vs idiosyncratic company catalysts, support/resistance tests between ${low_px:.2f} and ${high_px:.2f}, and session breadth ({up_cnt} up vs {down_cnt} down). "
            "Strictly follow the bullet-point rules: sharp, concise, mentioning exact numbers and names. "
            "DO NOT include any price action descriptive sentences like 'Stock declined -4.88% to close at $7.41 (open: $7.79)...' "
            "or 'Regular trading session logged'. Prices and changes are already displayed in the UI header. "
            "Keep only events and stock-moving data. Add 1-2 bullet points for relevant whole market (SPY) or sector moving events if applicable. "
            "DO NOT EVER generate any bullet point starting with 'Key cited figures'. "
            "Never output day titles or headlines. Only output bullet points."
        )

        user_prompt = f"""Analyze the verified daily news and price action for {entity_name} ({ticker}) across the 10 working trading days below:
Industry: {sector} • {industry}.
2-WEEK METRICS:
- Realized Volatility: {vol_pct:.1f}%
- Price Low: ${low_px:.2f}
- Price High: ${high_px:.2f}
- Price Range: {rng_pct:.1f}%
- 2-Week Net Move: {net_pct:+.2f}% (${start_px:.2f} -> ${end_px:.2f})
- Session Breadth: {up_cnt} Advances, {down_cnt} Declines

MARKET DATA & NEWS FEED:
{context_str}

CRITICAL FORMATTING INSTRUCTIONS:
1. In 'weekly_takeaway', provide an in-depth critical analysis of the 2-week move synthesizing the Volatility ({vol_pct:.1f}%), Price Low (${low_px:.2f}), Price High (${high_px:.2f}), and Net Move ({net_pct:+.2f}%). Break down factor exposure vs company catalysts, session breadth, and technical positioning.
2. For EACH of the 10 trading days:
   - Provide 2 to 4 SHARP, CONCISE bullet points highlighting ONLY market-moving events (financial figures, numbers, percentages, catalysts, partners, contracts, earnings, management/director changes, legal/regulatory developments).
   - DO NOT include price action description sentences (such as 'Stock declined -4.88% to close at $7.41...').
   - DO NOT EVER create any bullet point starting with 'Key cited figures'.
   - Include 1 to 2 bullet points on relevant whole market (S&P 500 / SPY) or sector ETF movements on that day if applicable.
   - If there was no major company event and no market/sector move, output exactly ONE bullet point: ["No events"].
   - DO NOT provide a day title, headline, or introductory sentence. Only output the bullet points array.
   - Assign appropriate high-impact tags from: ["EARNINGS", "C-LEVEL", "LEGAL", "M&A", "ANALYST", "PRODUCT", "MACRO"]. If quiet session, use ["TRADING_SESSION"].
3. Output STRICT JSON only (no markdown formatting, no commentary) matching this schema:
{{
  "status": "ok",
  "source": "GROQ_LLAMA_3_3_70B",
  "ticker": "{ticker}",
  "company_name": "{entity_name}",
  "overall_sentiment": "BULLISH" | "BEARISH" | "NEUTRAL" | "MIXED",
  "weekly_takeaway": "In-depth critical Wall Street analysis of the 2-week price movement explicitly incorporating Volatility {vol_pct:.1f}%, Low ${low_px:.2f}, High ${high_px:.2f}, and Net Move {net_pct:+.2f}%.",
  "net_price_change_pct": {net_pct},
  "days": [
    {{
      "date": "YYYY-MM-DD",
      "day_name": "DayName",
      "price_action": {{
        "traded": true,
        "open": 0.0,
        "close": 0.0,
        "change_pct": 0.0,
        "direction": "UP" | "DOWN" | "FLAT",
        "volume_str": "...",
        "day_range": "..."
      }},
      "bullet_points": [
        "Concise bullet 1 with exact numbers/figures/catalysts",
        "Concise bullet 2 with market impact"
      ],
      "tags": ["EARNINGS", "C-LEVEL"],
      "catalyst_type": "EARNINGS" | "C-LEVEL" | "LEGAL" | "M&A" | "ANALYST" | "PRODUCT" | "MACRO",
      "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL"
    }}
  ]
}}"""

        try:
            resp = llm_gateway.complete_sync(
                prompt=user_prompt,
                system_instruction=system_prompt,
                temperature=0.2,
                max_tokens=3000,
            )
            raw_text = resp if isinstance(resp, str) else json.dumps(resp)
            raw_text = raw_text.strip()
            if "```json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_text:
                raw_text = raw_text.split("```")[1].split("```")[0].strip()

            data = json.loads(raw_text)
            if data.get("days") and len(data["days"]) >= 8:
                data["source"] = "GROQ_LLAMA_3_3_70B"
                data["metrics"] = m
                for d in data["days"]:
                    raw_pts = d.get("bullet_points") or []
                    d["bullet_points"] = [
                        p for p in raw_pts
                        if not re.match(r"^Key cited figures", str(p), re.I)
                    ]
                return data
        except Exception as e:
            logger.warning(f"Groq hot news bullet synthesis failed for {ticker}: {e}")

        return None

    @classmethod
    def _build_grounded_working_days_hot_news(
        cls,
        ticker: str,
        entity_name: str,
        sector: str,
        industry: str,
        days_context: List[Dict[str, Any]],
        metrics: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Deterministic, 100% grounded fallback synthesizer.
        Extracts real figures, names, and exact daily price impacts into
        concise bullet points per day with high-impact event tags, plus deep critical price/volatility analysis.
        """
        clean_t = ticker.strip().upper()
        m = metrics or cls._compute_2w_price_metrics(days_context)
        days_list: List[Dict[str, Any]] = []
        overall_chg = m.get("net_price_change_pct", 0.0)
        up_days = m.get("up_sessions", 0)
        down_days = m.get("down_sessions", 0)
        vol_pct = m.get("volatility_pct", 0.0)
        low_px = m.get("low_price", 0.0)
        high_px = m.get("high_price", 0.0)
        start_px = m.get("start_price", 0.0)
        end_px = m.get("end_price", 0.0)
        rng_pct = m.get("price_range_pct", 0.0)

        # Pre-calculate ETF returns once before loop
        sector_etf = "XLRE" if "reit" in (sector + industry).lower() or "real estate" in (sector + industry).lower() else "SPY"
        for s_key, etf_sym in [
            ("tech", "XLK"), ("financial", "XLF"), ("energy", "XLE"), ("health", "XLV"),
            ("industrial", "XLI"), ("consumer disc", "XLY"), ("staple", "XLP"),
            ("utilit", "XLU"), ("material", "XLB"), ("communicat", "XLC"), ("real estate", "XLRE"),
        ]:
            if s_key in (sector + " " + industry).lower():
                sector_etf = etf_sym
                break

        ret_by_date: Dict[str, Dict[str, float]] = {}
        try:
            from app.quant_engine.benchmark_etf_cache import BenchmarkETFCacheManager
            bench_df = BenchmarkETFCacheManager.get_benchmark_closes()
            if bench_df is not None and not bench_df.empty:
                cols_to_check = [c for c in ["SPY", sector_etf] if c in bench_df.columns]
                if cols_to_check:
                    ret_df = bench_df[cols_to_check].pct_change() * 100.0
                    for idx, row in ret_df.iterrows():
                        d_key = idx.strftime("%Y-%m-%d")
                        ret_by_date[d_key] = {}
                        if "SPY" in row and not math.isnan(float(row["SPY"])):
                            ret_by_date[d_key]["SPY"] = round(float(row["SPY"]), 2)
                        if sector_etf in row and not math.isnan(float(row[sector_etf])):
                            ret_by_date[d_key][sector_etf] = round(float(row[sector_etf]), 2)
        except Exception:
            pass

        for d in days_context:
            dt_str = d["date"]
            day_name = d["day_name"]
            pa = d["price_action"]
            articles = d["articles"]
            num_articles = d["articles_count"]

            chg_pct = pa.get("change_pct", 0.0) or 0.0

            top_headlines = [a["headline"] for a in articles[:4]]
            text_corpus = " ".join([a["headline"] + ". " + a["summary"] for a in articles[:5]])
            text_lower = text_corpus.lower()

            # Classify High-Impact Tags
            tags: List[str] = []
            if any(k in text_lower for k in ["earnings", "revenue", "eps", "guidance", "results", "quarterly", "dividend", "ffo"]):
                tags.append("EARNINGS")
            if any(k in text_lower for k in ["ceo", "cfo", "director", "board", "executive", "chief", "tenure", "insider", "form 4", "management", "appoint", "resign"]):
                tags.append("C-LEVEL")
            if any(k in text_lower for k in ["lawsuit", "sec", "doj", "investigation", "antitrust", "court", "patent", "litigation", "regulatory", "injunction", "item 401"]):
                tags.append("LEGAL")
            if any(k in text_lower for k in ["acquisition", "merger", "buyout", "partnership", "contract", "deal", "strategic agreement"]):
                tags.append("M&A")
            if any(k in text_lower for k in ["upgrade", "downgrade", "price target", "overweight", "underweight", "analyst"]):
                tags.append("ANALYST")
            if any(k in text_lower for k in ["launch", "product", "platform", "unveil", "system", "technology"]):
                tags.append("PRODUCT")

            # Extract market/sector performance for date from pre-computed map
            date_rets = ret_by_date.get(dt_str, {})
            spy_pct = date_rets.get("SPY")
            sec_pct = date_rets.get(sector_etf)

            if not tags:
                if spy_pct is not None and abs(spy_pct) >= 1.0:
                    tags.append("MACRO")
                elif abs(chg_pct) >= 1.0:
                    tags.append("VOLATILITY")
                else:
                    tags.append("TRADING_SESSION")

            primary_tag = tags[0] if tags else "TRADING_SESSION"
            sentiment = "BULLISH" if chg_pct > 0.3 else ("BEARISH" if chg_pct < -0.3 else "NEUTRAL")

            # Build sharp, concise bullet points (ONLY events & stock-moving data, NO descriptive price action sentences)
            bullet_points: List[str] = []

            # 1. Company-specific news headlines and developments
            if top_headlines:
                h1 = top_headlines[0].replace('"', "'")
                bullet_points.append(f"{h1}.")
                if len(top_headlines) > 1:
                    h2 = top_headlines[1].replace('"', "'")
                    bullet_points.append(f"{h2}.")

            # 2. Add relevant whole market or sector moving event (1-2 bullet points if applicable)
            if spy_pct is not None or sec_pct is not None:
                market_parts = []
                if spy_pct is not None and abs(spy_pct) >= 0.3:
                    dir_label = "rallied" if spy_pct > 0 else "pulled back"
                    market_parts.append(f"S&P 500 (SPY {spy_pct:+.2f}%) {dir_label}")
                if sec_pct is not None and abs(sec_pct) >= 0.4 and sector_etf != "SPY":
                    dir_label = "gained" if sec_pct > 0 else "declined"
                    market_parts.append(f"{sector or 'Sector'} ({sector_etf} {sec_pct:+.2f}%) {dir_label}")

                if market_parts:
                    bullet_points.append(f"Market & Sector Context: {', '.join(market_parts)} on macro rate/liquidity dynamics.")

            # 3. If no events and no major market move
            if not bullet_points:
                bullet_points = ["No events"]

            days_list.append({
                "date": dt_str,
                "day_name": day_name,
                "price_action": pa,
                "bullet_points": bullet_points[:5],
                "tags": tags,
                "catalyst_type": primary_tag,
                "sentiment": sentiment,
                "articles_count": num_articles,
            })

        overall_sent = "BULLISH" if up_days > down_days + 1 else ("BEARISH" if down_days > up_days + 1 else "MIXED")

        vol_regime = "elevated realized volatility" if vol_pct >= 28.0 else ("moderate volatility" if vol_pct >= 15.0 else "compressed consolidation")
        dir_label = "advanced" if overall_chg > 0 else ("pulled back" if overall_chg < 0 else "traded flat")
        sign_label = "+" if overall_chg > 0 else ""

        takeaway = (
            f"Over the last 10 trading sessions (2 working weeks), {entity_name} ({ticker}) {dir_label} {sign_label}{overall_chg:.2f}% "
            f"(${start_px:.2f} → ${end_px:.2f}), logging {vol_regime} with annualized realized volatility of {vol_pct:.1f}%. "
            f"Price action established a {rng_pct:.1f}% trading corridor between a 2-week Low of ${low_px:.2f} and a High of ${high_px:.2f}. "
            f"Session breadth logged {up_days} advancing vs {down_days} declining sessions. Price movements reflected "
            f"{'resistance testing near the 2-week high' if end_px >= high_px * 0.98 else ('support consolidation near the 2-week low' if end_px <= low_px * 1.02 else 'mid-channel rotational flow')} "
            f"driven by {sector or industry or 'equity'} sector factor exposures alongside fundamental operational execution."
        )

        return {
            "status": "ok",
            "source": "DETERMINISTIC_FINNHUB_MASSIVE",
            "ticker": ticker,
            "company_name": entity_name,
            "overall_sentiment": overall_sent,
            "weekly_takeaway": takeaway,
            "net_price_change_pct": round(overall_chg, 2),
            "metrics": m,
            "days": days_list,
        }

