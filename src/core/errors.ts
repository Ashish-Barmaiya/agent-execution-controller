/**
 * Structured errors for the Agent Execution Controller.
 *
 * Each error type carries context for debugging and replay analysis.
 * In production systems, these errors would be serialized and stored
 * for post-mortem analysis of failed agent runs.
 */

/**
 * Base class for all execution errors.
 * Provides common structure for error context and serialization.
 */
export abstract class ExecutionError extends Error {
  abstract readonly code: string;
  readonly timestamp: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      code: this.code,
      name: this.name,
      message: this.message,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Thrown when token or USD budget limits are exceeded.
 * Includes the specific limit type and values for debugging.
 */
export class BudgetExceededError extends ExecutionError {
  readonly code = "BUDGET_EXCEEDED";

  constructor(
    public readonly limitType: "tokens" | "usd",
    public readonly spent: number,
    public readonly limit: number,
  ) {
    super(
      `${limitType === "tokens" ? "Token" : "Cost"} budget exceeded: spent ${spent}, limit ${limit}`,
    );
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      limitType: this.limitType,
      spent: this.spent,
      limit: this.limit,
    };
  }
}

/**
 * Thrown when the global kill switch has been triggered.
 *
 * CRITICAL: The kill switch is the last line of defense against runaway agents.
 * In production, this might be triggered by:
 * - Manual operator intervention
 * - Automated anomaly detection
 * - External monitoring systems detecting dangerous behavior
 * - Cost thresholds at the infrastructure level
 */
export class KillSwitchTriggeredError extends ExecutionError {
  readonly code = "KILL_SWITCH_TRIGGERED";

  constructor(public readonly reason: string = "Manual termination requested") {
    super(`Execution terminated by kill switch: ${reason}`);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      reason: this.reason,
    };
  }
}

/**
 * Thrown when an invalid state transition is attempted.
 * The execution lifecycle enforces a strict state machine to prevent
 * undefined behavior and ensure auditability.
 */
export class InvalidStateTransitionError extends ExecutionError {
  readonly code = "INVALID_STATE_TRANSITION";

  constructor(
    public readonly fromState: string,
    public readonly toState: string,
  ) {
    super(`Invalid state transition: ${fromState} → ${toState}`);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      fromState: this.fromState,
      toState: this.toState,
    };
  }
}
