import type { StepEvent } from "../core/types.js";
import { formatEvent } from "../log/eventStore.js";

/**
 * Replay Module
 *
 * Enables deterministic replay of execution events for debugging
 * and post-mortem analysis.
 *
 * Design goals:
 * - Replay produces identical output regardless of when it's run
 * - Events are rendered in the exact order they were recorded
 * - Human-readable format for operator debugging
 *
 * SCALING NOTE: In production, replay would:
 * - Fetch events from Postgres by run ID
 * - Support filtering by event type, time range, etc.
 * - Optionally re-execute steps against mock services
 */

/**
 * Replays a sequence of events to stdout.
 * Produces human-readable output for debugging.
 */
export function replay(events: StepEvent[]): void {
  if (events.length === 0) {
    console.log("No events to replay.");
    return;
  }

  console.log(`Replaying ${events.length} events:\n`);

  for (const event of events) {
    console.log(formatEvent(event));
  }
}

/**
 * Computes summary statistics from a set of events.
 * Useful for quick analysis without full replay.
 */
export function summarizeEvents(events: StepEvent[]): {
  count: number;
  totalCost: number;
  totalTokens: number;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {};

  let totalCost = 0;
  let totalTokens = 0;

  for (const event of events) {
    totalCost += event.cost;
    totalTokens += event.tokens;
    byType[event.type] = (byType[event.type] ?? 0) + 1;
  }

  return {
    count: events.length,
    totalCost,
    totalTokens,
    byType,
  };
}
