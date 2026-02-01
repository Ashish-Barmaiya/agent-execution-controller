import type { ExecutionRun } from "./types.ts";

export function addCost(run: ExecutionRun, tokens: number, usd: number) {
  run.spent.tokens += tokens;
  run.spent.usd += usd;
}
