import type { ExecutionRun } from "./types.ts";

export function enforceLimits(run: ExecutionRun) {
  if (run.spent.tokens > run.budget.maxTokens) {
    throw new Error("Token budget exceeded");
  }

  if (run.spent.usd > run.budget.maxUsd) {
    throw new Error("Cost budget exceeded");
  }
}
