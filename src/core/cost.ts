import type { ExecutionRun } from "./types.js";

/**
 * Cost tracking module.
 *
 * Tracks both token usage and USD cost separately because:
 * - Tokens are useful for rate limiting and model-specific limits
 * - USD cost is useful for billing and budget enforcement
 * - Different models have different token-to-cost ratios
 */
export function addCost(run: ExecutionRun, tokens: number, usd: number): void {
  run.spent.tokens += tokens;
  run.spent.usd += usd;
}

/**
 * Calculate the current cost percentage of budget used.
 * Useful for progressive warnings before hard limits.
 */
export function getBudgetUsagePercent(run: ExecutionRun): {
  tokens: number;
  usd: number;
} {
  return {
    tokens: (run.spent.tokens / run.budget.maxTokens) * 100,
    usd: (run.spent.usd / run.budget.maxUsd) * 100,
  };
}
