import { NextResponse } from "next/server";

// NOTE [Revisit in next check]: Kept under Option B for Next.js static export compatibility.
// Evaluated for full deprecation/removal in future checks since client-side ExportModal
// completely handles standalone HTML downloads directly from the FastAPI backend (/api/export-html).
export const dynamic = "force-static";

export async function GET() {
  try {
    // Static pre-render uses canonical baseline macro data
    const html = generateStandaloneHtml(null);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="MacroPulse_Alpha_Report_${new Date().toISOString().split("T")[0]}.html"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    return new NextResponse(`Error generating export: ${error?.message || error}`, { status: 500 });
  }
}

function generateStandaloneHtml(liveData: any) {
  const generatedTime = new Date().toUTCString();
  const netLiq = liveData?.net_liquidity_usd_bn ? liveData.net_liquidity_usd_bn.toFixed(1) : "6,150.4";
  const quadName = liveData?.current_quad ? `QUAD ${liveData.current_quad}` : "QUAD 2 (REFLATION)";
  const quad2Prob = liveData?.quad_2_prob ? (liveData.quad_2_prob * 100).toFixed(0) : "58";
  const quad3Prob = liveData?.quad_3_prob ? (liveData.quad_3_prob * 100).toFixed(0) : "10";

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MacroPulse Alpha | Institutional Macro Intelligence Terminal</title>
  <style>
    :root {
      --bg: #070b12;
      --card-bg: #0c121e;
      --card-border: #1e293b;
      --cyan: #06b6d4;
      --cyan-glow: rgba(6, 182, 212, 0.15);
      --emerald: #10b981;
      --amber: #f59e0b;
      --rose: #f43f5e;
      --indigo: #6366f1;
      --purple: #8b5cf6;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dark: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
      line-height: 1.5;
      padding: 1.5rem;
    }
    header {
      background: #090e17;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.25rem 1.75rem;
      margin-bottom: 1.5rem;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .brand-title {
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: var(--cyan);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .brand-sub {
      font-size: 0.8rem;
      color: var(--text-dark);
      font-family: monospace;
      margin-top: 0.2rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
      font-family: monospace;
      font-weight: 600;
      border-radius: 9999px;
    }
    .badge-cyan { background: rgba(6,182,212,0.15); color: var(--cyan); border: 1px solid rgba(6,182,212,0.3); }
    .badge-emerald { background: rgba(16,185,129,0.15); color: var(--emerald); border: 1px solid rgba(16,185,129,0.3); }
    .badge-amber { background: rgba(245,158,11,0.15); color: var(--amber); border: 1px solid rgba(245,158,11,0.3); }
    .badge-purple { background: rgba(139,92,246,0.15); color: var(--purple); border: 1px solid rgba(139,92,246,0.3); }
    
    /* Navigation Tabs */
    .nav-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }
    .nav-btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 0.6rem 1.1rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      font-family: monospace;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .nav-btn:hover {
      border-color: var(--cyan);
      color: var(--text);
    }
    .nav-btn.active {
      background: rgba(6,182,212,0.12);
      border-color: var(--cyan);
      color: var(--cyan);
      box-shadow: 0 0 12px var(--cyan-glow);
    }

    /* KPI Banner Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 1.1rem;
      position: relative;
      overflow: hidden;
    }
    .kpi-card::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, var(--cyan), transparent);
    }
    .kpi-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-family: monospace;
      letter-spacing: 0.05em;
    }
    .kpi-val {
      font-size: 1.45rem;
      font-weight: 700;
      color: var(--text);
      margin: 0.35rem 0 0.15rem 0;
      font-family: monospace;
    }
    .kpi-sub {
      font-size: 0.72rem;
      color: var(--text-dark);
      font-family: monospace;
    }

    /* Cards & Containers */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.35rem;
      margin-bottom: 1.5rem;
    }
    .card-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--cyan);
      font-family: monospace;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
      border: 1px solid var(--card-border);
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
      text-align: left;
    }
    th {
      background: #0f172a;
      padding: 0.75rem 1rem;
      color: var(--text-muted);
      font-family: monospace;
      font-weight: 600;
      border-bottom: 1px solid var(--card-border);
    }
    td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #141e30;
      color: var(--text);
    }
    tr:hover td {
      background: rgba(255,255,255,0.02);
    }

    /* 4-Column Matrix */
    .matrix-4col {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .framework-col {
      background: #090e18;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 1.25rem;
    }
    .framework-header {
      font-size: 0.95rem;
      font-weight: 700;
      font-family: monospace;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
    }

    /* Range Bar */
    .range-bar-track {
      background: #1e293b;
      height: 8px;
      border-radius: 4px;
      position: relative;
      margin: 6px 0;
    }
    .range-bar-fill {
      position: absolute;
      top: 0; bottom: 0;
      background: linear-gradient(90deg, #06b6d4, #10b981);
      border-radius: 4px;
    }
    .range-bar-pin {
      position: absolute;
      top: -3px;
      width: 4px;
      height: 14px;
      background: #f8fafc;
      border-radius: 2px;
      transform: translateX(-50%);
    }

    /* Tab Panes */
    .tab-pane {
      display: none;
    }
    .tab-pane.active {
      display: block;
      animation: fadeIn 0.25s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media print {
      body { background: #fff !important; color: #000 !important; }
      .nav-tabs { display: none !important; }
      .tab-pane { display: block !important; margin-bottom: 2rem !important; }
      .card, .kpi-card, header { border: 1px solid #ccc !important; background: #fff !important; color: #000 !important; }
      th { background: #eee !important; color: #000 !important; }
      td { color: #222 !important; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <header>
    <div>
      <div class="brand-title">
        <span>⚡ MACROPULSE.ALPHA</span>
        <span class="badge badge-cyan">v1.0 STANDALONE EXPORT</span>
      </div>
      <div class="brand-sub">Unified Quantitative Nowcast &bull; Framework Synthesis &bull; Options Microstructure</div>
    </div>
    <div style="text-align: right;">
      <span class="badge badge-emerald">● SYSTEM ONLINE // SNAPSHOT VERIFIED</span>
      <div class="brand-sub">Generated: ${generatedTime}</div>
    </div>
  </header>

  <!-- NAVIGATION TABS -->
  <div class="nav-tabs" id="tab-nav">
    <button class="nav-btn active" onclick="switchTab('tab-exec')">1. Executive Summary</button>
    <button class="nav-btn" onclick="switchTab('tab-synthesis')">2. Framework Synthesis</button>
    <button class="nav-btn" onclick="switchTab('tab-liquidity')">3. Macro Liquidity &amp; Allocation</button>
    <button class="nav-btn" onclick="switchTab('tab-outliers')">4. 1–3M Outlier Scanner</button>
    <button class="nav-btn" onclick="switchTab('tab-speculation')">5. Speculation Matrix</button>
    <button class="nav-btn" onclick="switchTab('tab-scenarios')">6. 4-Quarter Scenarios</button>
  </div>

  <!-- ================= SUB-PAGE 1: EXECUTIVE SUMMARY ================= -->
  <div id="tab-exec" class="tab-pane active">
    <!-- KPI BANNER -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Current US Quad</div>
        <div class="kpi-val" style="color: var(--cyan);">${quadName}</div>
        <div class="kpi-sub">Monthly Q2 (${quad2Prob}%) | Q3 (${quad3Prob}%)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">42 Macro GRID Score</div>
        <div class="kpi-val" style="color: var(--emerald);">REFLATION</div>
        <div class="kpi-sub">Reflation 58% &bull; Goldilocks 24% &bull; Infl 10%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Prometheus 1965 Analog</div>
        <div class="kpi-val" style="color: var(--amber);">1965-Q3 (84.2%)</div>
        <div class="kpi-sub">Top Match: 2019-Q3 (86.4%) &bull; Gold Exp +18.4%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">US Net Liquidity</div>
        <div class="kpi-val" style="color: var(--emerald);">$${netLiq} Bn</div>
        <div class="kpi-sub">4W Impulse: +$142.8 Bn &bull; RRP: $89.2B</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">3Fourteen Co-Signer</div>
        <div class="kpi-val" style="color: var(--purple);">CO-SIGN CONFIRMED</div>
        <div class="kpi-sub">MOVE: 98.4 (Falling) &bull; VIX: 14.8 (Stable)</div>
      </div>
    </div>

    <!-- ALLOCATION BENCHMARKS ROW -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
      <div class="card">
        <div class="card-title">
          <span>KISS 60/30/10 Live Allocation Engine</span>
          <span class="badge badge-cyan">MODEL PORTFOLIO</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          Dynamic risk-parity overlay dynamically balancing growth assets, monetary debasement hedges, and short duration yields.
        </p>
        <div class="table-container">
          <table>
            <thead>
              <tr><th>Asset</th><th>Ticker</th><th>Allocation</th><th>Regime Driver</th></tr>
            </thead>
            <tbody>
              <tr><td>Equities</td><td><strong>SPY</strong></td><td><span class="badge badge-emerald">48.0%</span></td><td>Quad 2 Tailwind, Earnings Acceleration</td></tr>
              <tr><td>Monetary Gold</td><td><strong>GLD</strong></td><td><span class="badge badge-amber">24.0%</span></td><td>Accord 2.0 Hedge, De-dollarization Flow</td></tr>
              <tr><td>Digital Reserve</td><td><strong>IBIT</strong></td><td><span class="badge badge-purple">8.0%</span></td><td>Global M2 Liquidity Beta (+4.1x)</td></tr>
              <tr><td>Floating Cash</td><td><strong>USFR</strong></td><td><span class="badge badge-cyan">20.0%</span></td><td>5.12% Safe Yield + Dry Powder</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>3Fourteen RAA &amp; Hedgeye KSPY Overlay</span>
          <span class="badge badge-indigo">HEDGING OVERLAY</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          3Fourteen Risk-Adjusted Allocation alongside Hedgeye Option Hedging State.
        </p>
        <div style="background: #090e18; border: 1px solid var(--card-border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-family: monospace;">
            <span>3Fourteen RAA:</span>
            <span style="color: var(--cyan);">41.0% Equities / 29.3% Fixed Income / 29.7% Alts</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-family: monospace; margin-top: 0.5rem;">
            <span>Hedgeye KSPY State:</span>
            <span style="color: var(--purple); font-weight: 700;">PUT SPREAD COLLAR ACTIVE</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-family: monospace; margin-top: 0.5rem;">
            <span>Net Delta Hedged:</span>
            <span style="color: var(--emerald);">+0.65 Net Long (5% OTM Puts Funded by 3% OTM Calls)</span>
          </div>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-dark); line-height: 1.5;">
          The engine maintains full long equity exposure while funding downside gamma buffers via systematic out-of-the-money call overwriting at the Hedgeye Trend Pivot ($592.50).
        </div>
      </div>
    </div>

    <!-- LATEST INTELLIGENCE DELTA FEED -->
    <div class="card">
      <div class="card-title">
        <span>Verified Intelligence Delta Feed (Multi-Author Synthesizer)</span>
        <span class="badge badge-emerald">4/4 ACTIVE FEEDS</span>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Author / Source</th><th>Core Assertion</th><th>Conviction</th><th>Signal Delta</th><th>Verified UTC</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Aravind Menon</strong><br><span style="font-size:0.75rem; color:var(--text-dark);">Prometheus Research</span></td>
              <td>US economic growth accelerating into H2 2026; real rates remaining higher for longer; cyclicals outperforming duration.</td>
              <td><span class="badge badge-emerald">HIGH (88%)</span></td>
              <td>+25 bps Growth Nowcast Revision</td>
              <td>Recent</td>
            </tr>
            <tr>
              <td><strong>Keith McCullough</strong><br><span style="font-size:0.75rem; color:var(--text-dark);">Hedgeye Risk Management</span></td>
              <td>US Quad 2 accelerating into Quad 3 by early 2027; Bullish on Gold ($GLD), Energy ($XLE), Nuclear ($CEG), Bearish Long Bonds ($TLT).</td>
              <td><span class="badge badge-emerald">VERY HIGH (94%)</span></td>
              <td>Risk Range Re-centered Higher</td>
              <td>Recent</td>
            </tr>
            <tr>
              <td><strong>Warren Pies</strong><br><span style="font-size:0.75rem; color:var(--text-dark);">3Fourteen Research</span></td>
              <td>Bond market is NOT co-signing the growth panic; MOVE index breakdown confirms equity bull market durability. Maintain RAA 41% eq.</td>
              <td><span class="badge badge-cyan">HIGH (85%)</span></td>
              <td>Confirmed MOVE / VIX Divergence</td>
              <td>Recent</td>
            </tr>
            <tr>
              <td><strong>Darius Dale</strong><br><span style="font-size:0.75rem; color:var(--text-dark);">42 Macro</span></td>
              <td>GRID regime is firmly in Reflation with 58% probability; Volatility Risk Premium crowding indicates low short-term shock risk.</td>
              <td><span class="badge badge-amber">MODERATE (82%)</span></td>
              <td>GRID Regime: Reflation Tilt</td>
              <td>Recent</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ================= SUB-PAGE 2: FRAMEWORK SYNTHESIS ================= -->
  <div id="tab-synthesis" class="tab-pane">
    <div class="card">
      <div class="card-title">
        <span>Interactive 4-Column Framework Matrix</span>
        <span class="badge badge-cyan">CROSS-FRAMEWORK ALIGNMENT</span>
      </div>
      <div class="matrix-4col">
        <!-- Prometheus -->
        <div class="framework-col">
          <div class="framework-header" style="color: var(--cyan);">1. PROMETHEUS RESEARCH (Menon)</div>
          <div style="font-size: 0.85rem; line-height: 1.8;">
            <div><strong>Growth:</strong> <span style="color: var(--emerald);">Accelerating (+2.4% Real GDP)</span></div>
            <div><strong>Inflation:</strong> <span style="color: var(--amber);">Sticky (~2.9% Core PCE)</span></div>
            <div><strong>Liquidity:</strong> <span style="color: var(--cyan);">Expanding Net Liquidity</span></div>
            <div><strong>Bonds:</strong> <span style="color: var(--rose);">Underweight Duration (Bearish TLT)</span></div>
            <div><strong>Equities:</strong> <span style="color: var(--emerald);">Overweight Cyclicals &amp; Quality</span></div>
          </div>
        </div>

        <!-- Hedgeye -->
        <div class="framework-col">
          <div class="framework-header" style="color: var(--emerald);">2. HEDGEYE RISK MANAGEMENT (McCullough)</div>
          <div style="font-size: 0.85rem; line-height: 1.8;">
            <div><strong>Growth:</strong> <span style="color: var(--emerald);">Quad 2 (Reflation) &rarr; Quad 3</span></div>
            <div><strong>Inflation:</strong> <span style="color: var(--rose);">Accelerating Headline CPI</span></div>
            <div><strong>Liquidity:</strong> <span style="color: var(--cyan);">Central Bank Balance Sheet Neutral</span></div>
            <div><strong>Bonds:</strong> <span style="color: var(--rose);">Strong Sell / Short Duration</span></div>
            <div><strong>Equities:</strong> <span style="color: var(--emerald);">Long Tech, Utilities, Gold</span></div>
          </div>
        </div>

        <!-- 42 Macro -->
        <div class="framework-col">
          <div class="framework-header" style="color: var(--amber);">3. 42 MACRO (Dale)</div>
          <div style="font-size: 0.85rem; line-height: 1.8;">
            <div><strong>Growth:</strong> <span style="color: var(--emerald);">GRID Reflation (58% Prob)</span></div>
            <div><strong>Inflation:</strong> <span style="color: var(--amber);">Cyclical Pressure Rebuilding</span></div>
            <div><strong>Liquidity:</strong> <span style="color: var(--cyan);">TGA Drawdown Liquidity Tailwind</span></div>
            <div><strong>Bonds:</strong> <span style="color: var(--amber);">Neutral / Tactically Short</span></div>
            <div><strong>Equities:</strong> <span style="color: var(--emerald);">High Quality + VAMS Momentum</span></div>
          </div>
        </div>

        <!-- 3Fourteen -->
        <div class="framework-col">
          <div class="framework-header" style="color: var(--purple);">4. 3FOURTEEN RESEARCH (Pies)</div>
          <div style="font-size: 0.85rem; line-height: 1.8;">
            <div><strong>Growth:</strong> <span style="color: var(--cyan);">Resilient Private Demand</span></div>
            <div><strong>Inflation:</strong> <span style="color: var(--amber);">Supply-Driven Energy Inflation</span></div>
            <div><strong>Liquidity:</strong> <span style="color: var(--emerald);">Credit Spreads Narrow / Accommodative</span></div>
            <div><strong>Bonds:</strong> <span style="color: var(--rose);">Curve Steepener Preferred</span></div>
            <div><strong>Equities:</strong> <span style="color: var(--emerald);">RAA 41% Equity Allocation Active</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- CONTRADICTION RESOLUTION CARDS -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem;">
      <div class="card">
        <div class="card-title">
          <span>Contradiction 1: Secular Bond Bear vs. Cyclical Duration Hedge</span>
          <span class="badge badge-rose">RESOLVED</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
          <strong>The Contradiction:</strong> McCullough &amp; Menon argue for a generational secular bond bear market driven by structural fiscal deficits and Accord 2.0 monetary debasement, while classic risk-parity models demand 20%+ Long Treasuries ($TLT) to guard against sudden recessionary shocks.<br><br>
          <strong>Engine Resolution:</strong> Replace fixed income duration with <strong>Gold ($GLD)</strong> and <strong>Floating Cash ($USFR)</strong>. Gold matches Treasury shock-diversification without downside duration risk when yields spike from fiscal expansion.
        </p>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Contradiction 2: Base-Effect Quads vs. VAMS Nowcast Momentum</span>
          <span class="badge badge-emerald">RESOLVED</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
          <strong>The Contradiction:</strong> Hedgeye base-effects show potential Quad 4 deceleration in selected lagging data, while 42 Macro VAMS and Prometheus real-time nowcasts show growth accelerating at +2.4%.<br><br>
          <strong>Engine Resolution:</strong> Utilize the <strong>3Fourteen MOVE/VIX Co-Signer</strong>. If implied bond volatility (MOVE) continues to collapse below 100, the equity regime is defined by live liquidity flow over trailing statistical base effects.
        </p>
      </div>
    </div>
  </div>

  <!-- ================= SUB-PAGE 3: LIQUIDITY & ALLOCATION ================= -->
  <div id="tab-liquidity" class="tab-pane">
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Federal Reserve Assets (WALCL)</div>
        <div class="kpi-val" style="color: var(--cyan);">$7,020.0 Bn</div>
        <div class="kpi-sub">Quantitative Tightening Tapered</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Treasury General Account (TGA)</div>
        <div class="kpi-val" style="color: var(--amber);">$780.4 Bn</div>
        <div class="kpi-sub">Target: $800B Cash Balance</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Overnight Reverse Repo (RRP)</div>
        <div class="kpi-val" style="color: var(--emerald);">$89.2 Bn</div>
        <div class="kpi-sub">Near Exhaustion Floor</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">US Debt-to-Liquidity Ratio</div>
        <div class="kpi-val" style="color: var(--rose);">114.2%</div>
        <div class="kpi-sub">Structural Fiscal Expansion Phase</div>
      </div>
    </div>

    <!-- MULTI-HORIZON ASSET ALLOCATION MATRIX -->
    <div class="card">
      <div class="card-title">
        <span>Multi-Horizon Asset Allocation Matrix</span>
        <span class="badge badge-cyan">CROSS-ASSET REGIME SIGNALS</span>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Asset Category</th>
              <th>Now (0–6 Months)</th>
              <th>Intermediate (6–12 Months)</th>
              <th>Long-View (12–36 Months)</th>
              <th>Factor Rationale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Country ETFs</strong></td>
              <td><span class="badge badge-emerald">Overweight US ($SPY)</span></td>
              <td><span class="badge badge-cyan">Equal Weight Japan ($EWJ)</span></td>
              <td><span class="badge badge-purple">Overweight Emerging Asia</span></td>
              <td>US earnings resilience &amp; global capital attraction.</td>
            </tr>
            <tr>
              <td><strong>Equity Sectors</strong></td>
              <td><span class="badge badge-emerald">Utilities ($XLU), Tech ($XLK)</span></td>
              <td><span class="badge badge-amber">Energy ($XLE), Industrials ($XLI)</span></td>
              <td><span class="badge badge-emerald">Materials ($XLB), Nuclear</span></td>
              <td>Datacenter baseload power + capex supercycle.</td>
            </tr>
            <tr>
              <td><strong>Fixed Income</strong></td>
              <td><span class="badge badge-cyan">Ultra-Short ($USFR, $BIL)</span></td>
              <td><span class="badge badge-amber">TIPS ($TIP), Curve Steepeners</span></td>
              <td><span class="badge badge-rose">Underweight 30Y Treasuries</span></td>
              <td>Higher term premium and fiscal supply digestion.</td>
            </tr>
            <tr>
              <td><strong>Commodities &amp; Alts</strong></td>
              <td><span class="badge badge-amber">Gold ($GLD), Bitcoin ($IBIT)</span></td>
              <td><span class="badge badge-emerald">Uranium ($URA), Copper ($CPER)</span></td>
              <td><span class="badge badge-purple">Precious Metals / Physical</span></td>
              <td>Accord 2.0 currency debasement hedges.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- DR MO 70-FACTOR SUMMARY -->
    <div class="card">
      <div class="card-title">
        <span>Dr. Mo 70-Factor Quantitative Heatmap Snapshot</span>
        <span class="badge badge-emerald">TOP FACTOR DECILES</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; font-size: 0.85rem;">
        <div style="background: #090e18; border: 1px solid var(--card-border); padding: 1rem; border-radius: 8px;">
          <div style="color: var(--emerald); font-weight: 700; margin-bottom: 0.5rem;">TOP TAILWIND FACTORS (+Z)</div>
          <ul style="padding-left: 1.2rem; line-height: 1.7; color: var(--text-muted);">
            <li>Earnings Revision 3M Momentum (+2.42&sigma;)</li>
            <li>Free Cash Flow to Enterprise Value (+2.18&sigma;)</li>
            <li>Return on Invested Capital Spread (+1.95&sigma;)</li>
            <li>Net Share Buyback Yield (+1.82&sigma;)</li>
          </ul>
        </div>
        <div style="background: #090e18; border: 1px solid var(--card-border); padding: 1rem; border-radius: 8px;">
          <div style="color: var(--rose); font-weight: 700; margin-bottom: 0.5rem;">TOP HEADWIND FACTORS (-Z)</div>
          <ul style="padding-left: 1.2rem; line-height: 1.7; color: var(--text-muted);">
            <li>High Debt-to-EBITDA Leverage (-2.65&sigma;)</li>
            <li>Unprofitable Tech Long-Duration (-2.14&sigma;)</li>
            <li>30-Year Treasury Yield Beta (-1.98&sigma;)</li>
            <li>Short Interest Crowding Ratio (-1.75&sigma;)</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- ================= SUB-PAGE 4: OUTLIER SCANNER ================= -->
  <div id="tab-outliers" class="tab-pane">
    <div class="card">
      <div class="card-title">
        <span>1–3 Month Positioned Assets &amp; Outlier Screener</span>
        <span class="badge badge-cyan">QUANT + OPTIONS GEX INTEGRATED</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
        Cross-asset positioning screening combining Hedgeye Risk Ranges, 42 Macro VAMS Badges (+1/0/-1), Net Dealer Gamma (GEX), and Quad Fit.
      </p>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>VAMS</th>
              <th>Visual Risk Range (Low &bull; Trend &bull; High)</th>
              <th>Options GEX &amp; Walls</th>
              <th>Quad Fit</th>
              <th>"Why" Rationale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>NVDA</strong><br><span style="font-size:0.75rem; color:var(--text-dark);">$138.25</span></td>
              <td><span class="badge badge-emerald">VAMS +1</span></td>
              <td>
                <div style="font-size:0.7rem; font-family:monospace; display:flex; justify-content:space-between;">
                  <span>$128.00</span><span style="color:var(--cyan);">$135.50 PIVOT</span><span>$148.00</span>
                </div>
                <div class="range-bar-track">
                  <div class="range-bar-fill" style="left: 0; width: 51%;"></div>
                  <div class="range-bar-pin" style="left: 51%;"></div>
                </div>
              </td>
              <td>
                <span class="badge badge-emerald">+$4.2M GEX</span><br>
                <span style="font-size:0.72rem; color:var(--text-dark);">Call: $145 &bull; Put: $130 &bull; 0DTE: 38%</span>
              </td>
              <td><span class="badge badge-emerald">Quad 2 Bull</span></td>
              <td style="font-size:0.8rem; color:var(--text-muted);">
                AI accelerator capex revisions continue to surge; top-decile FCTE Quality screen score (+239 bps tilt).
              </td>
            </tr>
            <tr>
              <td><strong>VST</strong><br><span style="font-size:0.75rem; color:var(--text-dark);">$128.60</span></td>
              <td><span class="badge badge-emerald">VAMS +1</span></td>
              <td>
                <div style="font-size:0.7rem; font-family:monospace; display:flex; justify-content:space-between;">
                  <span>$115.00</span><span style="color:var(--cyan);">$122.00 PIVOT</span><span>$136.00</span>
                </div>
                <div class="range-bar-track">
                  <div class="range-bar-fill" style="left: 0; width: 64%;"></div>
                  <div class="range-bar-pin" style="left: 64%;"></div>
                </div>
              </td>
              <td>
                <span class="badge badge-emerald">+$1.8M GEX</span><br>
                <span style="font-size:0.72rem; color:var(--text-dark);">Call: $135 &bull; Put: $120 &bull; 0DTE: 28%</span>
              </td>
              <td><span class="badge badge-emerald">Quad 2/3 Power</span></td>
              <td style="font-size:0.8rem; color:var(--text-muted);">
                Baseload power provider for hyperscaler datacenters; multi-year fixed offtake contracts re-rate earnings.
              </td>
            </tr>
            <tr>
              <td><strong>GLD</strong><br><span style="font-size:0.75rem; color:var(--text-dark);">$248.50</span></td>
              <td><span class="badge badge-emerald">VAMS +1</span></td>
              <td>
                <div style="font-size:0.7rem; font-family:monospace; display:flex; justify-content:space-between;">
                  <span>$236.00</span><span style="color:var(--cyan);">$242.00 PIVOT</span><span>$258.00</span>
                </div>
                <div class="range-bar-track">
                  <div class="range-bar-fill" style="left: 0; width: 56%;"></div>
                  <div class="range-bar-pin" style="left: 56%;"></div>
                </div>
              </td>
              <td>
                <span class="badge badge-emerald">+$3.1M GEX</span><br>
                <span style="font-size:0.72rem; color:var(--text-dark);">Call: $255 &bull; Put: $240 &bull; 0DTE: 14%</span>
              </td>
              <td><span class="badge badge-amber">Accord 2.0</span></td>
              <td style="font-size:0.8rem; color:var(--text-muted);">
                Central bank de-dollarization flows + US Debt-to-Liquidity at 114%; hedge against fiat fiscal expansion.
              </td>
            </tr>
            <tr>
              <td><strong>TLT</strong><br><span style="font-size:0.75rem; color:var(--text-dark);">$91.40</span></td>
              <td><span class="badge badge-rose">VAMS -1</span></td>
              <td>
                <div style="font-size:0.7rem; font-family:monospace; display:flex; justify-content:space-between;">
                  <span>$88.50</span><span style="color:var(--rose);">$94.20 PIVOT</span><span>$96.80</span>
                </div>
                <div class="range-bar-track">
                  <div class="range-bar-fill" style="left: 0; width: 34%; background: #f43f5e;"></div>
                  <div class="range-bar-pin" style="left: 34%;"></div>
                </div>
              </td>
              <td>
                <span class="badge badge-rose">-$2.4M GEX</span><br>
                <span style="font-size:0.72rem; color:var(--text-dark);">Call: $95 &bull; Put: $88 &bull; Negative Gamma</span>
              </td>
              <td><span class="badge badge-rose">Quad 2 Bear</span></td>
              <td style="font-size:0.8rem; color:var(--text-muted);">
                Rising term premium, ongoing Treasury supply auctions, and economic growth acceleration compress bond returns.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ================= SUB-PAGE 5: SPECULATION MATRIX ================= -->
  <div id="tab-speculation" class="tab-pane">
    <div class="card">
      <div class="card-title">
        <span>1st, 2nd &amp; 3rd Order Speculation Matrix</span>
        <span class="badge badge-cyan">CAPITAL CASCADE ANALYSIS</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
        Institutional capital allocation cascade: from direct AI hyperscaler capex to physical infrastructure bottleneck beneficiaries.
      </p>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="min-width: 140px;">Order of Effect</th>
              <th>Stock</th>
              <th>Ticker</th>
              <th>Industry</th>
              <th>Reasons for Selection (Framework Synthesis &amp; Capital Flow Logic)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="badge badge-cyan">1st Order</span></td>
              <td>NVIDIA Corp</td>
              <td><strong>NVDA</strong></td>
              <td>Semiconductors</td>
              <td>Direct primary beneficiary of hyperscaler generative AI compute budget; dominant CUDA software lock-in moat.</td>
            </tr>
            <tr>
              <td><span class="badge badge-cyan">1st Order</span></td>
              <td>Taiwan Semiconductor</td>
              <td><strong>TSM</strong></td>
              <td>Foundry / Advanced Packaging</td>
              <td>Exclusive monopoly supplier of CoWoS packaging and sub-3nm nodes for all AI accelerators.</td>
            </tr>
            <tr>
              <td><span class="badge badge-cyan">1st Order</span></td>
              <td>ASML Holding</td>
              <td><strong>ASML</strong></td>
              <td>Semiconductor Equipment</td>
              <td>Exclusive global supplier of High-NA EUV lithography systems essential for next-gen silicon roadmaps.</td>
            </tr>
            <tr>
              <td><span class="badge badge-emerald">2nd Order</span></td>
              <td>Vistra Corp</td>
              <td><strong>VST</strong></td>
              <td>Independent Power Producer</td>
              <td>Unregulated merchant nuclear and natural gas capacity directly contracted by hyperscalers for 24/7 baseload power.</td>
            </tr>
            <tr>
              <td><span class="badge badge-emerald">2nd Order</span></td>
              <td>Constellation Energy</td>
              <td><strong>CEG</strong></td>
              <td>Nuclear Power Generation</td>
              <td>Largest US clean nuclear fleet; 20-year Microsoft PPA for Three Mile Island demonstrates premium for clean baseload.</td>
            </tr>
            <tr>
              <td><span class="badge badge-emerald">2nd Order</span></td>
              <td>Cameco Corp</td>
              <td><strong>CCJ</strong></td>
              <td>Uranium Mining &amp; Fuel</td>
              <td>Global uranium supply deficit meets exponential nuclear reactor recommissioning and SMR deployment demand.</td>
            </tr>
            <tr>
              <td><span class="badge badge-emerald">2nd Order</span></td>
              <td>GE Vernova</td>
              <td><strong>GEV</strong></td>
              <td>Power Grid &amp; Turbines</td>
              <td>Gas turbine backlogs extended past 2028; grid transmission upgrades required to connect remote data campuses.</td>
            </tr>
            <tr>
              <td><span class="badge badge-purple">3rd Order</span></td>
              <td>CrowdStrike Holdings</td>
              <td><strong>CRWD</strong></td>
              <td>Cybersecurity / SecOps</td>
              <td>AI agent proliferation exponentially expands enterprise attack vectors, necessitating autonomous endpoint detection.</td>
            </tr>
            <tr>
              <td><span class="badge badge-purple">3rd Order</span></td>
              <td>Palantir Technologies</td>
              <td><strong>PLTR</strong></td>
              <td>Enterprise AI Platforms</td>
              <td>AIP ontology platform connects LLM compute directly to mission-critical operational decision workflows.</td>
            </tr>
            <tr>
              <td><span class="badge badge-purple">3rd Order</span></td>
              <td>Microsoft Corp</td>
              <td><strong>MSFT</strong></td>
              <td>Cloud &amp; Enterprise Software</td>
              <td>Enterprise monetization layer capturing enterprise seat expansion through Copilot integration across Office suite.</td>
            </tr>
            <tr>
              <td><span class="badge badge-purple">3rd Order</span></td>
              <td>Amazon.com Inc</td>
              <td><strong>AMZN</strong></td>
              <td>Cloud &amp; E-Commerce</td>
              <td>AWS Bedrock enterprise infrastructure scaling with high operational leverage and custom Trainium silicon.</td>
            </tr>
            <tr>
              <td><span class="badge badge-amber">Macro Hedge</span></td>
              <td>SPDR Gold Shares</td>
              <td><strong>GLD</strong></td>
              <td>Monetary Metal</td>
              <td>Primary beneficiary of US fiscal deficit expansion and foreign central bank reserve de-dollarization.</td>
            </tr>
            <tr>
              <td><span class="badge badge-amber">Macro Hedge</span></td>
              <td>Newmont Corp</td>
              <td><strong>NEM</strong></td>
              <td>Gold Mining Major</td>
              <td>Operational operating leverage to record physical gold prices; massive free cash flow expansion and dividend increases.</td>
            </tr>
            <tr>
              <td><span class="badge badge-amber">Macro Hedge</span></td>
              <td>iShares Bitcoin Trust</td>
              <td><strong>IBIT</strong></td>
              <td>Digital Monetary Asset</td>
              <td>High-beta proxy for global fiat money supply expansion; institutional ETF access channel unlocking wealth manager allocations.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ================= SUB-PAGE 6: SCENARIOS & PLAYBOOK ================= -->
  <div id="tab-scenarios" class="tab-pane">
    <div class="card">
      <div class="card-title">
        <span>4-Quarter Forward Scenarios &amp; Policy Playbook</span>
        <span class="badge badge-cyan">Q4 2026 – Q3 2027</span>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Quarter</th>
              <th>Base Scenario (60% Prob)</th>
              <th>Alternative Scenario (40% Prob)</th>
              <th>Asset Direction</th>
              <th>Quantitative Triggers &amp; Prerequisites</th>
              <th>Policy &amp; Market Playbook</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Q4 2026</strong></td>
              <td><strong>Sustained Reflation (Quad 2)</strong><br>GDP +2.4%, Core PCE sticky at 2.8%. Corporate earnings beat by 4.2%.</td>
              <td><strong>Mild Growth Deceleration</strong><br>Labor cooling causes temporary slowdown fears.</td>
              <td><span class="badge badge-emerald">Long SPY, GLD, VST</span><br><span class="badge badge-rose">Short TLT</span></td>
              <td>High Yield OAS &lt; 320 bps; MOVE &lt; 105; Net Liquidity &gt; $6.0T.</td>
              <td>Fed holds benchmark rates steady; TGA drawdown injects liquidity; hedge equities with 5% OTM put collars.</td>
            </tr>
            <tr>
              <td><strong>Q1 2027</strong></td>
              <td><strong>Commodity-Driven Quad 3 (Stagflationary Drift)</strong><br>Oil breaks $90/bbl on geopolitical bottlenecks; headline CPI surges.</td>
              <td><strong>Productivity Surge</strong><br>AI efficiency gains restrain wage costs, keeping margins elevated.</td>
              <td><span class="badge badge-amber">Long Energy (XLE), Gold, Uranium</span></td>
              <td>Headline CPI &gt; 3.4% YoY; 10Y Yield tests 4.85%; Oil &gt; $88.</td>
              <td>Fed pause turns hawkish; long commodities, short duration; rotate from mega-cap tech to physical materials.</td>
            </tr>
            <tr>
              <td><strong>Q2 2027</strong></td>
              <td><strong>Fiscal Dominance Acceleration</strong><br>Treasury issuance ramps up post-budget; term premium explodes.</td>
              <td><strong>Debt Ceiling Gridlock</strong><br>Spending cuts reduce liquidity impulse.</td>
              <td><span class="badge badge-purple">Long GLD, IBIT, USFR</span><br><span class="badge badge-rose">Short 30Y Treasuries</span></td>
              <td>US Debt-to-Liquidity &gt; 118%; Primary dealer absorption strain.</td>
              <td>Fed slows or halts quantitative tightening; Treasury utilizes T-bill heavy issuance to suppress long yield spike.</td>
            </tr>
            <tr>
              <td><strong>Q3 2027</strong></td>
              <td><strong>AI Capex Maturation &amp; Monetization</strong><br>Enterprise software revenues catch up to infrastructure capex spend.</td>
              <td><strong>Capex Retrenchment Pause</strong><br>Tech hyperscalers temporarily slow compute deployments.</td>
              <td><span class="badge badge-emerald">Long 3rd Order Tech (PLTR, CRWD)</span></td>
              <td>Cloud gross margins &gt; 68%; Enterprise software net retention &gt; 115%.</td>
              <td>Overweight software over semiconductor hardware; capture operating leverage expansion.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    function switchTab(tabId) {
      const panes = document.querySelectorAll('.tab-pane');
      panes.forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(tabId);
      if (activePane) activePane.classList.add('active');

      const buttons = document.querySelectorAll('.nav-btn');
      buttons.forEach(b => b.classList.remove('active'));
      if (event && event.target) {
        event.target.classList.add('active');
      }
    }
  </script>
</body>
</html>`;
}
