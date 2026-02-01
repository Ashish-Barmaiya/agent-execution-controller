import type { ExecutionRun, ExecutionSummary, StepEvent } from "./types.js";
import { addCost } from "./cost.js";
import { enforceLimits } from "./guard.js";
import { assertAlive, isKilled, getKillReason } from "./killSwitch.js";
import { transitionState } from "./state.js";
import { logEvent } from "../log/eventStore.js";
import { ExecutionError } from "./errors.js";

/**
 * Execution Engine
 *
 * Orchestrates the execution of agent steps with full lifecycle management.
 * Every step goes through:
 * 1. Kill switch check (can we continue?)
 * 2. Step execution (do the work)
 * 3. Cost accumulation (track spending)
 * 4. Budget enforcement (should we stop?)
 * 5. Event logging (record what happened)
 *
 * SCALING NOTE: In production, this would be run by distributed workers:
 * - Each worker claims a run via distributed lock (Redis)
 * - Steps are checkpointed to Postgres for resumability
 * - Events are published to Kafka in real-time
 * - Worker failures trigger automatic reassignment
 */

/**
 * Executes a single step in the agent run.
 * This is the core unit of work that can be individually retried/replayed.
 */
function executeStep(
  run: ExecutionRun,
  stepNumber: number,
  type: StepEvent["type"],
  description: string,
  tokens: number,
  cost: number,
): void {
  // CRITICAL: Check kill switch BEFORE every step
  // This is the last line of defense against runaway execution
  assertAlive();

  // Accumulate costs
  addCost(run, tokens, cost);

  // Enforce budget limits
  enforceLimits(run);

  // Log the event
  const event: StepEvent = {
    id: crypto.randomUUID(),
    stepNumber,
    type,
    description,
    cost,
    tokens,
    timestamp: Date.now(),
  };

  logEvent(event);
  run.steps.push(event);
}

/**
 * Runs the full execution loop with proper lifecycle management.
 *
 * @param run - The execution run to process
 * @param maxSteps - Maximum number of steps to execute (default: 10)
 */
export async function runExecution(
  run: ExecutionRun,
  maxSteps: number = 10,
): Promise<void> {
  // Transition from CREATED to RUNNING
  transitionState(run, "RUNNING");

  for (let i = 0; i < maxSteps; i++) {
    executeStep(
      run,
      i + 1,
      "LLM_CALL",
      `Executing agent step ${i + 1}`,
      50,
      0.1,
    );
  }

  // Successful completion
  transitionState(run, "COMPLETED");
}

/**
 * Generates an execution summary for monitoring and observability.
 *
 * This is what a production system would emit to:
 * - Monitoring dashboards (Grafana, Datadog)
 * - Billing systems
 * - Alerting pipelines
 */
export function generateSummary(run: ExecutionRun): ExecutionSummary {
  const now = Date.now();
  const startedAt = run.startedAt ?? now;
  const endedAt = run.endedAt ?? now;

  return {
    runId: run.id,
    finalState: run.state,
    stepsExecuted: run.steps.length,
    totalCost: run.spent.usd,
    totalTokens: run.spent.tokens,
    terminationReason: run.terminationReason ?? null,
    durationMs: endedAt - startedAt,
    startedAt,
    endedAt,
  };
}

/**
 * Handles execution errors and updates run state appropriately.
 * Determines whether the error warrants KILLED or FAILED state.
 */
export function handleExecutionError(run: ExecutionRun, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  run.terminationReason = errorMessage;

  // Determine the appropriate terminal state
  if (isKilled()) {
    run.state = "KILLED";
    run.terminationReason = getKillReason() ?? "Execution terminated";
  } else if (error instanceof ExecutionError) {
    // Structured errors indicate controlled failures
    run.state = error.code === "KILL_SWITCH_TRIGGERED" ? "KILLED" : "FAILED";
  } else {
    // Unexpected errors
    run.state = "FAILED";
  }

  run.endedAt = Date.now();
}
