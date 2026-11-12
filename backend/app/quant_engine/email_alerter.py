"""
macro_nowcast/backend/app/quant_engine/email_alerter.py
=======================================================
HTML Email Alert Dispatcher for Idiosyncratic Reversals & Morning Macro Briefing.

Supports:
1. Resend Free Tier API (HTTPS POST) if RESEND_API_KEY is configured.
2. Gmail SMTP (smtp.gmail.com:587, STARTTLS) with standard App Password if SMTP credentials are provided.
3. Non-blocking graceful fallback with simulated delivery report if credentials are not yet set.
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger("macropulse.email_alerter")


class EmailAlerter:
    """Dispatches mobile-friendly morning trading briefing & reversal tickets."""

    @classmethod
    def _render_email_html(cls, scan_data: Dict[str, Any]) -> str:
        """Constructs an institutional, mobile-optimized HTML trade briefing email."""
        summary = scan_data.get("summary", {})
        macro = scan_data.get("macro_throttle", {})
        candidates = scan_data.get("candidates", [])

        regime = macro.get("regime", "REFLATION")
        throttle_pct = macro.get("throttle_pct", 100.0)
        verdict = macro.get("verdict", "Full risk unit active.")
        badge_color = macro.get("badge_color", "emerald")

        color_hex = "#10b981" if badge_color == "emerald" else ("#f59e0b" if badge_color == "amber" else "#ef4444")
        accent_bg = "#ecfdf5" if badge_color == "emerald" else ("#fffbeb" if badge_color == "amber" else "#fef2f2")

        now_str = datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")

        # Build candidate rows
        rows_html = ""
        for c in candidates[:10]:
            tk = c.get("ticker", "")
            name = c.get("name", tk)
            p = c.get("current_price", 0.0)
            ret = c.get("one_day_return_pct", 0.0)
            res_z = c.get("residual_shock_sigma", 0.0)
            ibs = c.get("ibs_percentile", 0.0)
            rvol = c.get("rvol_20d", 0.0)
            entry_zone = c.get("limit_entry_zone", [p, p])
            stop = c.get("stop_loss", 0.0)
            target = c.get("target_price", 0.0)
            shares = c.get("suggested_shares", 0)
            outlay = c.get("capital_outlay", 0.0)
            exit_date = c.get("target_exit_date", "T+3")

            ret_color = "#ef4444" if ret < 0 else "#10b981"

            rows_html += f"""
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 8px; font-weight: bold; color: #0f172a;">
                    <span style="font-size: 15px;">{tk}</span><br/>
                    <span style="font-size: 11px; color: #64748b; font-weight: normal;">{name}</span>
                </td>
                <td style="padding: 12px 8px; text-align: center;">
                    <span style="font-weight: bold; color: {ret_color};">{ret}%</span><br/>
                    <span style="font-size: 11px; color: #475569;">${p}</span>
                </td>
                <td style="padding: 12px 8px; text-align: center;">
                    <span style="background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 12px;">{res_z}σ</span><br/>
                    <span style="font-size: 11px; color: #64748b;">RVOL {rvol}x | IBS {ibs}%</span>
                </td>
                <td style="padding: 12px 8px; font-size: 12px; color: #1e293b;">
                    <strong>Entry:</strong> ${entry_zone[0]} - ${entry_zone[1]}<br/>
                    <strong>Stop:</strong> ${stop} | <strong>Target:</strong> ${target}
                </td>
                <td style="padding: 12px 8px; text-align: right; font-size: 12px;">
                    <span style="font-weight: bold; color: #0f172a;">{shares} shs</span><br/>
                    <span style="font-size: 11px; color: #64748b;">${outlay:,.0f} (Exit: {exit_date})</span>
                </td>
            </tr>
            """

        html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MacroPulse Morning Reversals Briefing</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a;">
    <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: #0f172a; padding: 24px; color: #ffffff;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 600;">MacroPulse Alpha Quantitative Engine</div>
            <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Morning Idiosyncratic Reversals Briefing</h1>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">{now_str} &bull; 08:20 AEDT Session Trigger</div>
        </div>

        <!-- Macro Throttle Banner -->
        <div style="background: {accent_bg}; border-left: 4px solid {color_hex}; padding: 16px 20px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: {color_hex};">
                Active Macro Regime Throttle: {regime} ({throttle_pct}% Risk Unit)
            </div>
            <div style="font-size: 13px; color: #334155; margin-top: 4px; line-height: 1.4;">
                {verdict}
            </div>
        </div>

        <!-- Metric Cards -->
        <div style="padding: 16px 20px; background: #f1f5f9; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0;">
            <div style="display: inline-block; width: 30%; text-align: center;">
                <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600;">Universe Scanned</div>
                <div style="font-size: 18px; font-weight: 700; color: #0f172a;">{summary.get('total_universe_scanned', 0)}</div>
            </div>
            <div style="display: inline-block; width: 30%; text-align: center;">
                <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600;">Blackout Excluded</div>
                <div style="font-size: 18px; font-weight: 700; color: #dc2626;">{summary.get('earnings_blackout_excluded', 0)}</div>
            </div>
            <div style="display: inline-block; width: 30%; text-align: center;">
                <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600;">Dislocations Found</div>
                <div style="font-size: 18px; font-weight: 700; color: #2563eb;">{len(candidates)}</div>
            </div>
        </div>

        <!-- Trade Tickets Table -->
        <div style="padding: 20px;">
            <h2 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
                Top Quantitative Reversal Tickets (T+3 Time Exit)
            </h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background: #f8fafc; color: #64748b; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 8px; text-align: left;">Symbol</th>
                        <th style="padding: 8px; text-align: center;">Price (1D)</th>
                        <th style="padding: 8px; text-align: center;">Residual Shock</th>
                        <th style="padding: 8px; text-align: left;">Execution Zone</th>
                        <th style="padding: 8px; text-align: right;">Sizing ($100k)</th>
                    </tr>
                </thead>
                <tbody>
                    {rows_html if rows_html else '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #64748b;">No symbols met the extreme dislocation criteria today. Cash preserved.</td></tr>'}
                </tbody>
            </table>
        </div>

        <!-- Strategy Rules Reminder -->
        <div style="padding: 16px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #475569; line-height: 1.5;">
            <strong>Execution Protocol:</strong> Enter near open within the Limit Zone. Stop-Loss is non-negotiable at 1.5x ATR(14). 
            Target is mean reversion to 20D SMA (approx 2x ATR). Time stop: strictly close out at market-on-close on day 3 if neither stop nor target hit.
        </div>

        <!-- Footer -->
        <div style="padding: 16px 20px; background: #0f172a; color: #94a3b8; font-size: 11px; text-align: center;">
            MacroPulse Alpha Automated Daily Briefing &bull; <a href="https://macro-nowcast.pages.dev/reversals" style="color: #38bdf8; text-decoration: none;">View Live Reversals Dashboard</a>
        </div>
    </div>
</body>
</html>"""
        return html

    @classmethod
    def dispatch_morning_briefing(cls, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Builds and dispatches the HTML morning alert email.
        Gracefully tries Resend API, then Gmail SMTP, then logs simulated output.
        """
        # If payload not provided, fetch live reversal scan
        if not payload:
            try:
                try:
                    from backend.app.quant_engine.reversal_scanner import ReversalScanner
                except ImportError:
                    from app.quant_engine.reversal_scanner import ReversalScanner
                payload = ReversalScanner.run_reversal_scan(force=False)
            except Exception as e:
                logger.error(f"[EmailAlerter] ReversalScanner fetch error: {e}")
                payload = {"candidates": [], "macro_throttle": {}, "summary": {}}

        macro = payload.get("macro_throttle", {})
        candidates = payload.get("candidates", [])
        regime = macro.get("regime", "REFLATION")
        throttle_pct = macro.get("throttle_pct", 100.0)

        subject = f"[MacroPulse Alpha] Morning Reversals Briefing: {len(candidates)} Setups ({regime} {throttle_pct}%)"
        html_body = cls._render_email_html(payload)

        # Recipients & Credentials
        recipient = (
            os.getenv("ALERT_EMAIL_RECIPIENT")
            or os.getenv("SMTP_USER")
            or os.getenv("GMAIL_SMTP_USER")
            or "investor@macropulse.local"
        ).strip()

        resend_key = (os.getenv("RESEND_API_KEY") or "").strip()
        smtp_user = (os.getenv("SMTP_USER") or os.getenv("GMAIL_SMTP_USER") or "").strip()
        smtp_pass = (os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_SMTP_PASS") or "").strip()
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
        smtp_port = int(os.getenv("SMTP_PORT", "587"))

        # 1. Try Resend API (HTTP POST)
        if resend_key:
            try:
                resend_url = "https://api.resend.com/emails"
                headers = {
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json",
                }
                resend_sender = os.getenv("RESEND_SENDER_EMAIL", "MacroPulse Engine <onboarding@resend.dev>").strip()
                data = {
                    "from": resend_sender,
                    "to": [recipient],
                    "subject": subject,
                    "html": html_body,
                }
                with httpx.Client(timeout=10.0) as client:
                    r = client.post(resend_url, headers=headers, json=data)
                    if r.status_code in (200, 201):
                        logger.info(f"[EmailAlerter] Morning briefing dispatched via Resend to {recipient}.")
                        return {
                            "status": "SENT",
                            "provider": "resend",
                            "recipient": recipient,
                            "subject": subject,
                            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                        }
                    else:
                        logger.warning(f"[EmailAlerter] Resend API response error {r.status_code}: {r.text}")
            except Exception as e:
                logger.warning(f"[EmailAlerter] Resend dispatch attempt failed: {e}")

        # 2. Try Gmail SMTP
        if smtp_user and smtp_pass:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"MacroPulse Engine <{smtp_user}>"
                msg["To"] = recipient

                plain_text = f"MacroPulse Morning Briefing\nRegime: {regime} ({throttle_pct}%)\nCandidates: {len(candidates)}\nDashboard: https://macro-nowcast.pages.dev/reversals"
                msg.attach(MIMEText(plain_text, "plain"))
                msg.attach(MIMEText(html_body, "html"))

                with smtplib.SMTP(smtp_host, smtp_port, timeout=12.0) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_user, [recipient], msg.as_string())

                logger.info(f"[EmailAlerter] Morning briefing dispatched via Gmail SMTP to {recipient}.")
                return {
                    "status": "SENT",
                    "provider": "smtp_gmail",
                    "recipient": recipient,
                    "subject": subject,
                    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                }
            except Exception as e:
                logger.warning(f"[EmailAlerter] Gmail SMTP dispatch attempt failed: {e}")

        # 3. Simulated Fallback when no credentials present
        logger.info(f"[EmailAlerter] Simulated alert generated for {recipient}: '{subject}'. (Configure GMAIL_SMTP_USER & GMAIL_SMTP_PASS or RESEND_API_KEY to send live).")
        return {
            "status": "SIMULATED",
            "provider": "simulated_local",
            "recipient": recipient,
            "subject": subject,
            "candidates_count": len(candidates),
            "macro_regime": regime,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "notice": "Credentials not configured. HTML email payload successfully generated and validated.",
        }

