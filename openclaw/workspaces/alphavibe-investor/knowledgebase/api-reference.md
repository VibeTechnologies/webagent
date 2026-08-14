# API Reference

## Public Data Endpoints (no auth)

### Fear & Greed Index
GET https://api.alternative.me/fng/?limit=1
Returns: value (0-100), value_classification (Extreme Fear → Extreme Greed)

### CoinGecko Price
GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd

### Hyperliquid Funding Rate (public)
POST https://api.hyperliquid.xyz/info
Body: {"type": "metaAndAssetCtxs"}
Returns per-asset: funding, openInterest, markPx

### DeFiLlama TVL
GET https://api.llama.fi/tvl/{protocol}

## Internal Pipeline (via OpenClaw gateway)
POST /v1/responses
Header: x-openclaw-agent-id: <agent_id>
Body: { "model": "...", "input": "<stringified JSON context>" }

Agent IDs: technical-analyst, sentiment-analyst, onchain-analyst, macro-analyst,
microstructure-analyst, regime-analyst, head-of-research-consensus,
chief-risk-officer, cio-portfolio-manager, execution-trader
