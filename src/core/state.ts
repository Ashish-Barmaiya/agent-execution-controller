import type {
  ExecutionRun,
  ExecutionState,
  VALID_TRANSITIONS,
} from "./types.js";
import { InvalidStateTransitionError } from "./errors.js";

/**
 * State machine for execution lifecycle management.
 *
 * This module enforces valid state transitions and provides utilities
 * for managing execution state in a predictable, auditable way.
 */

const validTransitions: Record<ExecutionState, ExecutionState[]> = {
  CREATED: ["RUNNING"],
  RUNNING: ["PAUSED", "COMPLETED", "KILLED", "FAILED"],
  PAUSED: ["RUNNING", "KILLED"],
  KILLED: [],
  COMPLETED: [],
  FAILED: [],
};

/**
 * Attempts to transition an execution run to a new state.
 * Throws InvalidStateTransitionError if the transition is not allowed.
 *
 * DESIGN NOTE: Making transitions explicit and validated prevents
 * agent runs from ending up in undefined states, which is critical
 * for debugging production incidents.
 */
export function transitionState(
  run: ExecutionRun,
  toState: ExecutionState,
): void {
  const allowed = validTransitions[run.state];

  if (!allowed.includes(toState)) {
    throw new InvalidStateTransitionError(run.state, toState);
  }

  run.state = toState;

  // Track timing for terminal states
  if (toState === "RUNNING" && run.startedAt === undefined) {
    run.startedAt = Date.now();
  }

  if (isTerminalState(toState)) {
    run.endedAt = Date.now();
  }
}

/**
 * Checks if the given state is a terminal (final) state.
 */
export function isTerminalState(state: ExecutionState): boolean {
  return state === "COMPLETED" || state === "KILLED" || state === "FAILED";
}

/**
 * Creates a new execution run in the CREATED state.
 * This is the canonical way to initialize an execution.
 */
export function createExecutionRun(
  id: string,
  budget: { maxTokens: number; maxUsd: number },
): ExecutionRun {
  return {
    id,
    state: "CREATED",
    budget,
    spent: { tokens: 0, usd: 0 },
    steps: [],
  };
}
