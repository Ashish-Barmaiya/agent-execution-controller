import type { StepEvent } from "../core/types.js";

export function replay(events: StepEvent[]) {
  for (const e of events) {
    console.log(
      `[${new Date(e.timestamp).toISOString()}]`,
      e.type,
      e.description,
      `$${e.cost}`,
    );
  }
}
