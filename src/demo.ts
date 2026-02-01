import { runExecution } from "./core/execution.js";
import { getEvents } from "./log/eventStore.js";
import { replay } from "./replay/replay.js";
import type { ExecutionRun } from "./core/types.js";

const run: ExecutionRun = {
  id: "run_1",
  state: "RUNNING",
  budget: { maxTokens: 200, maxUsd: 0.5 },
  spent: { tokens: 0, usd: 0 },
  steps: [],
};

runExecution(run)
  .catch((err) => console.error("Stopped:", err.message))
  .finally(() => {
    console.log("\n--- REPLAY ---");
    replay(getEvents());
  });
