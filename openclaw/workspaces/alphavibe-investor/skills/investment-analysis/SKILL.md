# Investment Analysis Skill

## Purpose
Fetch live market data and produce a structured investment signal for a given asset.

## Trigger
User asks about a specific asset ("What's your take on BTC?", "Should I long ETH here?", "Analyze SOL").

## Execution

Use `fetch` to pull live data from public endpoints. Parse and synthesize into a signal.

### Data fetched per analysis:
1. Fear & Greed Index
   ```
   fetch("https://api.alternative.me/fng/?limit=1")
   ```
2. Asset price (use Hyperliquid public API or CoinGecko)
3. Funding rate (Hyperliquid perps — use public REST)
4. DeFiLlama TVL for relevant protocol (if DeFi asset)

### Output format:
```json
{
  "asset": "BTC",
  "direction": "bullish",
  "confidence": 0.72,
  "regime": "trending",
  "risk_regime": "risk_on",
  "key_drivers": [
    "RSI(14) 4H: 58 — neutral-bullish momentum",
    "Fear & Greed: 74 — Greed",
    "Funding rate: +0.01% — modest long bias, not overcrowded"
  ],
  "risks": [
    "DXY strengthening could pressure BTC",
    "Resistance at $72k — watch for rejection"
  ],
  "recommended_action": {
    "side": "long",
    "entry_zone": "$68,000 - $69,500",
    "size_pct_book": 5,
    "leverage": 2,
    "tp": "$74,000",
    "sl": "$66,000"
  }
}
```

All workflows/ pipeline steps use this format. Translate to plain English for the user.

### python3 execution note
python3 is NOT used directly — all data fetching uses the `fetch` tool via HTTP. If backtesting is requested, delegate to the AgenticHedgeFund backend API at the configured endpoint.
