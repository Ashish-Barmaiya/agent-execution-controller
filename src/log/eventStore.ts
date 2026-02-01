import type { StepEvent } from "../core/types.js";

/**
 * Event Store Module
 *
 * Provides append-only event logging for execution steps.
 * Events are immutable once logged, ensuring auditability.
 *
 * SCALING NOTE: In production, this would be backed by:
 * - Kafka for durable, ordered event streaming
 * - Postgres for queryable event storage
 * - Redis streams for real-time subscriptions
 *
 * The append-only design is intentional:
 * - Events are never modified or deleted
 * - Each event has a unique ID and timestamp
 * - The event sequence enables deterministic replay
 */

// In-memory event store
// SCALING: Would be replaced with Kafka producer + Postgres writer
const events: StepEvent[] = [];

/**
 * Logs a step event to the store.
 * Events are appended in order and cannot be modified.
 */
export function logEvent(event: StepEvent): void {
  events.push(event);
}

/**
 * Returns a copy of all logged events.
 * The copy ensures external code cannot mutate the event log.
 */
export function getEvents(): StepEvent[] {
  return [...events];
}

/**
 * Returns the total number of events logged.
 */
export function getEventCount(): number {
  return events.length;
}

/**
 * Clears all events from the store.
 * Only use this in testing or when starting a new execution context.
 *
 * SCALING: In production, we will never clear events.
 * Instead, we will partition by run ID.
 */
export function clearEvents(): void {
  events.length = 0;
}

/**
 * Formats an event for human-readable output.
 */
export function formatEvent(event: StepEvent): string {
  const timestamp = new Date(event.timestamp).toISOString();
  const cost = event.cost.toFixed(4);
  return `[${timestamp}] #${event.stepNumber} ${event.type}: ${event.description} (cost: $${cost}, tokens: ${event.tokens})`;
}
