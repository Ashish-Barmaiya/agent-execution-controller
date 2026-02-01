import type { ExecutionRun } from "./types.js";

export function addCost(run: ExecutionRun, tokens: number, usd: number) {
  run.spent.tokens += tokens;
  run.spent.usd += usd;
}
