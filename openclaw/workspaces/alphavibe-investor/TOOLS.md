# TOOLS — Operational Notes

## Data Sources (read-only, no credentials needed for public endpoints)
- Fear & Greed Index: https://api.alternative.me/fng/
- CryptoPanic: public RSS feed
- DeFiLlama TVL: https://api.llama.fi/
- Hyperliquid order book: public WS/REST
- FRED macro data: https://fred.stlouisfed.org/

## No secrets in this file
Auth tokens and API keys are injected via server-side auth context — never ask the user for them and never include them here.

## Execution
- Use `web`/`fetch` for HTTP data fetches
- Never use `exec` or shell commands
- All trade execution is gated by human approval — never submit orders autonomously
