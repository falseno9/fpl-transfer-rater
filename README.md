# FPL Transfer Rater

A web app that analyzes your Fantasy Premier League transfers and rates them based on player performance before and after each move.

## How It Works

Enter your FPL Team ID (found in the URL of your FPL points page) and the app will:

1. Fetch your full transfer history from the FPL API
2. For each transfer, compare:
   - **Trailing avg** — the outgoing player's points per game over the 3 GWs before the transfer
   - **New avg** — the incoming player's points per game over the 3 GWs after the transfer
3. Rate each transfer:

| Rating | Condition |
|---|---|
| **Great Move** | Net gain ≥ 10 points |
| **Good Move** | Net gain ≥ 4 points |
| **Sideways** | Net gain between -3 and 3 points |
| **Point Chasing** | Net gain ≤ -4 points |
| **Sold Too Early** | Net gain ≤ -10 points |
| **Too Soon** | Transfer is too recent to have 3 GWs of data yet |

Chips (Wildcard, Free Hit, Bench Boost, Triple Captain) are shown alongside the relevant gameweek.

### Features

- **Gameweek tier breakdown** — each GW rated Great/Good/Okay/Poor/Bad/Terrible based on aggregate transfer performance
- **Points chart** — visualize your transfer net gains across the season
- **Transfer timeline** — chronological view of all transfers with ratings
- **League view** — compare transfer ratings across a mini-league
- **Dark mode** — system-aware theme switching

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS
- Motion (Framer Motion)
- [Vercel Analytics](https://vercel.com/analytics)

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

Hosted on [Vercel](https://vercel.com). Push to `main` to trigger a new deployment via continuous deployment.
