# Workflows

## Naming Convention
`<domain>-<action>.yaml` — e.g., `investment-analysis.yaml`, `backtest-request.yaml`

## investment-analysis.yaml
Triggered when user requests market analysis or trade recommendation.

Pipeline:
1. regime-analysis → RegimeContext
2. [parallel] technical-analysis, sentiment-analysis, onchain-analysis, macro-analysis, microstructure-analysis → Signal[]
3. consensus → ConsensusResult
4. risk-management → RiskAssessment
5. portfolio-management → TradeOrder (hold if risk_off or risk blocked)
6. Format for user: direction + confidence + drivers + risks + recommended action

## backtest-request.yaml
Triggered when user asks to backtest a strategy.

Pipeline:
1. Parse strategy from user message
2. Validate parameters (asset, timeframe, entry/exit rules)
3. Request backtest run (AgenticHedgeFund backend)
4. Return: Sharpe, Sortino, max drawdown, win rate, total return
5. Gate: only recommend live execution if backtest PASS + user approves
