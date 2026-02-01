/**
 * Core type definitions for the Agent Execution Controller.
 *
 * These types define the execution model, including the strict lifecycle
 * that all agent runs must follow.
 */

/**
 * Execution lifecycle states.
 *
 * Valid transitions:
 *   CREATED → RUNNING
 *   RUNNING → PAUSED | COMPLETED | KILLED | FAILED
 *   PAUSED  → RUNNING | KILLED
 *   KILLED  → (terminal)
 *   COMPLETED → (terminal)
 *   FAILED → (terminal)
 */
export type ExecutionState =
  | "CREATED"
  | "RUNNING"
  | "PAUSED"
  | "KILLED"
  | "COMPLETED"
  | "FAILED";

/**
 * Valid state transitions map.
 * The state machine is intentionally restrictive to prevent
 * undefined behavior in production agent systems.
 */
export const VALID_TRANSITIONS: Record<ExecutionState, ExecutionState[]> = {
  CREATED: ["RUNNING"],
  RUNNING: ["PAUSED", "COMPLETED", "KILLED", "FAILED"],
  PAUSED: ["RUNNING", "KILLED"],
  KILLED: [], // Terminal state
  COMPLETED: [], // Terminal state
  FAILED: [], // Terminal state
};

export type Budget = {
  maxTokens: number;
  maxUsd: number;
};

export type StepEventType = "LLM_CALL" | "TOOL_CALL" | "DECISION" | "ERROR";

export type StepEvent = {
  id: string;
  stepNumber: number;
  type: StepEventType;
  description: string;
  cost: number;
  tokens: number;
  timestamp: number;
};

export type ExecutionRun = {
  id: string;
  state: ExecutionState;
  budget: Budget;
  spent: {
    tokens: number;
    usd: number;
  };
  steps: StepEvent[];
  startedAt?: number;
  endedAt?: number;
  terminationReason?: string;
};

/**
 * Summary generated after execution completes.
 * This is what a production system would emit for monitoring and alerting.
 *
 * SCALING NOTE: In a distributed system, this summary would be:
 * - Published to Kafka for downstream consumers
 * - Stored in Postgres for historical analysis
 * - Indexed in Elasticsearch for real-time dashboards
 */
export type ExecutionSummary = {
  runId: string;
  finalState: ExecutionState;
  stepsExecuted: number;
  totalCost: number;
  totalTokens: number;
  terminationReason: string | null;
  durationMs: number;
  startedAt: number;
  endedAt: number;
};

/**
 * SCALING READINESS: Storage Interface
 *
 * This interface shows where a persistent storage layer (Postgres, Redis)
 * would integrate. Currently in-memory, but designed for easy migration.
 */
export interface ExecutionStore {
  // SCALING: Would be backed by Postgres with proper indexing
  save(run: ExecutionRun): Promise<void>;
  load(runId: string): Promise<ExecutionRun | null>;

  // SCALING: Would use Redis for fast lookups and distributed locking
  acquireLock(runId: string): Promise<boolean>;
  releaseLock(runId: string): Promise<void>;
}

/**
 * SCALING READINESS: Event Publisher Interface
 *
 * This interface shows where a message queue (Kafka, RabbitMQ)
 * would integrate for distributed event processing.
 */
export interface EventPublisher {
  // SCALING: Would publish to Kafka topic for stream processing
  publish(event: StepEvent): Promise<void>;

  // SCALING: Would support batching for high-throughput scenarios
  publishBatch(events: StepEvent[]): Promise<void>;
}
