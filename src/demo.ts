import {
  runExecution,
  generateSummary,
  handleExecutionError,
} from "./core/execution.js";
import { createExecutionRun } from "./core/state.js";
import { getEvents, clearEvents } from "./log/eventStore.js";
import { replay } from "./replay/replay.js";
import { resetKillSwitch } from "./core/killSwitch.js";

/**
 * Agent Execution Controller — Demo
 *
 * This demonstrates the core execution flow:
 * 1. Create an execution run with defined budget
 * 2. Run the execution with guardrails
 * 3. Handle any errors and update state
 * 4. Generate and print execution summary
 * 5. Replay events for debugging
 */

// Reset any previous state (for clean demo runs)
clearEvents();
resetKillSwitch();

// Create a new execution run with budget constraints
const run = createExecutionRun("run_" + Date.now(), {
  maxTokens: 400, // Allows ~8 steps at 50 tokens each
  maxUsd: 0.5,
});

console.log("═══════════════════════════════════════════════════════════════");
console.log(" AGENT EXECUTION CONTROLLER — Demo");
console.log("═══════════════════════════════════════════════════════════════");
console.log(`\nRun ID: ${run.id}`);
console.log(`Budget: ${run.budget.maxTokens} tokens, $${run.budget.maxUsd}`);
console.log("\n─── Execution Starting ───\n");

// Execute with proper error handling
runExecution(run)
  .catch((error) => {
    handleExecutionError(run, error);
  })
  .finally(() => {
    console.log("\n─── Execution Complete ───\n");

    // Generate and print summary
    const summary = generateSummary(run);

    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log(" EXECUTION SUMMARY");
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    console.log(`  Run ID:             ${summary.runId}`);
    console.log(`  Final State:        ${summary.finalState}`);
    console.log(`  Steps Executed:     ${summary.stepsExecuted}`);
    console.log(`  Total Tokens:       ${summary.totalTokens}`);
    console.log(`  Total Cost:         $${summary.totalCost.toFixed(4)}`);
    console.log(`  Duration:           ${summary.durationMs}ms`);
    console.log(`  Termination Reason: ${summary.terminationReason ?? "None"}`);
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );

    // Replay events for verification
    console.log("\n─── Event Replay ───\n");
    replay(getEvents());
  });
