import type { ExecutionRun } from "./types.js";
import { addCost } from "./cost.js";
import { enforceLimits } from "./guard.js";
import { assertAlive } from "./killSwitch.js";
import { logEvent } from "../log/eventStore.js";

export async function runExecution(run: ExecutionRun) {
  try {
    for (let i = 0; i < 10; i++) {
      assertAlive();

      addCost(run, 50, 0.1);
      enforceLimits(run);

      logEvent({
        id: crypto.randomUUID(),
        type: "LLM_CALL",
        description: `Step ${i}`,
        cost: 0.1,
        timestamp: Date.now(),
      });
    }

    run.state = "COMPLETED";
  } catch (err) {
    run.state = "KILLED";
    throw err;
  }
}
