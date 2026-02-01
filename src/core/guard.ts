import type { ExecutionRun } from "./types.js";
import { BudgetExceededError } from "./errors.js";

/**
 * Budget enforcement module.
 *
 * Guardrails are essential in agent systems because LLM calls are:
 * - Non-deterministic in cost (token usage varies)
 * - Potentially recursive (agents can spawn sub-agents)
 * - Difficult to predict (tool calls may trigger cascades)
 *
 * SCALING NOTE: In a multi-tenant system, these limits would also
 * check against tenant-level quotas stored in Redis.
 */

export function enforceLimits(run: ExecutionRun): void {
  if (run.spent.tokens > run.budget.maxTokens) {
    throw new BudgetExceededError(
      "tokens",
      run.spent.tokens,
      run.budget.maxTokens,
    );
  }

  if (run.spent.usd > run.budget.maxUsd) {
    throw new BudgetExceededError("usd", run.spent.usd, run.budget.maxUsd);
  }
}
