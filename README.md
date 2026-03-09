# FPL Transfer Rater

A web app that analyzes your Fantasy Premier League transfers and rates them as **Good Move**, **Point Chasing**, **Neutral**, or **Too Soon**.

## How It Works

Enter your FPL Team ID (found in the URL of your FPL points page) and the app will:

1. Fetch your full transfer history from the FPL API
2. For each transfer, compare:
   - **Trailing avg** — the outgoing player's points per game over the 3 GWs before the transfer
   - **New avg** — the incoming player's points per game over the 3 GWs after the transfer
3. Rate each transfer:

| Rating | Condition |
|---|---|
| **Good Move** | Incoming avg ≥ 1.5× trailing avg **and** ≥ 2pts better (or outgoing player was blanking) |
| **Point Chasing** | Outgoing avg > 2pts **and** incoming avg ≤ 0.6× trailing avg **and** ≥ 2pts worse |
| **Neutral** | Everything else |
| **Too Soon** | Transfer is too recent to have 3 GWs of data yet |

Ratings use both a ratio and an absolute point difference to avoid noise at low point totals.

Chips (Wildcard, Free Hit, Bench Boost, Triple Captain) are shown alongside the relevant gameweek.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the app:
   ```bash
   npm run dev
   ```

The app proxies FPL API requests through `/api/fpl` to work around CORS restrictions — no API key required.

## Deploy

Hosted on [Google Cloud Run](https://cloud.google.com/run). Push to `main` to trigger a new deployment via continuous deployment.
