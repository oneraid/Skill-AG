---
name: day-trader-skill
description: 11 Claude & AI agent skills for day trading: scan thousands of charts (trader-scanner), track breaking news (trader-news), time entries (trader-entry) and exits (trader-exit), simulate odds with Time Machine (trader-timemachine), size positions & budget (trader-budget), enforce risk rules (trader-risk), track congressional stock trades (trader-pelosi), price alerts (trader-alerts), SEC EDGAR earnings analysis (trader-analyst), and generate paper broker order tickets (trader-broker). Use for stock scanning, day trading setups, technical analysis, risk management, and market news.
---

# The Day Trader Skill (Suite of 11 Trading Skills)

Comprehensive algorithmic and discretionary day trading suite for AI coding agents.
Free, MIT licensed, no API key required. Tools are written in pure Python 3 using free public data (Yahoo Finance charts, Nasdaq Trader symbol directories, SEC EDGAR, and House Clerk disclosures). Paper trading is the default; no trades are executed without explicit confirmation.

---

## 📊 The 11 Sub-Skills Overview

| Skill & Command | Role | Description | Helper Script |
| --- | --- | --- | --- |
| **`trader-scanner`** | Chart Scanner | Scans thousands of US stocks for setups: opening-range breakouts (ORB), bull flags, 20-day MA reclaim, oversold bounces. Writes `trader/watchlist.json`. | `./trader-scanner/scanner.py` |
| **`trader-news`** | News Monitor | Real-time news monitor for watched tickers, Yahoo RSS feeds, SEC 8-K filings. | `./trader-news/news.py` |
| **`trader-entry`** | Entry Timer | Evaluates 1m / 5m bars tick-by-tick for precise entry timing, volume confirmation, and signal validation. | `./trader-entry/entry.py` |
| **`trader-exit`** | Exit Planner | Sets stop-loss and take-profit targets based on ATR, key support/resistance levels, and risk-reward ratios. | `./trader-exit/exit.py` |
| **`trader-timemachine`** | Time Machine Replay | Monte Carlo simulation replaying the setup across 10,000 historical sessions to calculate statistical odds before risking capital. | `./trader-timemachine/timemachine.py` |
| **`trader-risk`** | Risk Manager | Audits orders against max daily drawdown, portfolio heat, sector concentration, and position limits. | `./trader-risk/risk.py` |
| **`trader-budget`** | Budget Manager | Position sizing calculator based on fixed dollar risk, 1-2% account rule, and volatility. | `./trader-budget/size.py` |
| **`trader-broker`** | Order Executor | Formats approved orders into broker-ready tickets (Interactive Brokers, Alpaca, ThinkorSwim, Webull). | `./trader-broker/ticket.py` |
| **`trader-alerts`** | Price Alerts | Configures price threshold notifications, breakout pings, and opening bell reminders. | `./trader-alerts/alerts.py` |
| **`trader-analyst`** | Earnings & EDGAR | Parses SEC EDGAR 10-K/10-Q submissions, revenue growth, cash burn, and fundamental health metrics. | `./trader-analyst/facts.py` |
| **`trader-pelosi`** | Capitol Hill Tracker | Tracks US congressional stock disclosures (PTRs - Periodic Transaction Reports) for notable political trades. | `./trader-pelosi/pelosi.py` |

---

## 🛠️ Execution Instructions for Agents

1. **Python Environment**:
   All tools execute using Python 3: `python <subfolder>/<script>.py [args]`. No external pip packages are required (uses standard library `urllib`, `json`, `math`, `csv`, `xml.etree`).

2. **Standard Workflow**:
   - **Step 1: Scan for Setups**: Run `python trader-scanner/scanner.py` to identify pre-market or intraday momentum runners.
   - **Step 2: Check Catalyst**: Run `python trader-news/news.py --ticker <SYMBOL>` to verify catalysts or SEC filings.
   - **Step 3: Test Probability**: Run `python trader-timemachine/timemachine.py --ticker <SYMBOL>` to evaluate historical win rate.
   - **Step 4: Size & Plan**: Run `python trader-budget/size.py` and `python trader-exit/exit.py` to lock in exact risk-reward before proposing an order ticket.
