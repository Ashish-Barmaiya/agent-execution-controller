import type { StepEvent } from "../core/types.js";

const events: StepEvent[] = [];

export function logEvent(event: StepEvent) {
  events.push(event);
}

export function getEvents() {
  return [...events];
}
