import { KillSwitchTriggeredError } from "./errors.js";

/**
 * Global Kill Switch Module
 *
 * CRITICAL SAFETY MECHANISM:
 * The kill switch is the last line of defense against runaway agent execution.
 * It MUST be checked before every execution step without exception.
 *
 * Why this matters in agent systems:
 * 1. Agents can execute irreversible actions (send emails, delete data, make purchases)
 * 2. Autonomous loops can escalate faster than human operators can react
 * 3. Cost can spiral exponentially in recursive agent architectures
 * 4. A single misbehaving agent can impact shared infrastructure
 *
 * In production, this would be backed by:
 * - Redis for distributed kill switch state (immediate propagation)
 * - Circuit breakers at the infrastructure level
 * - Automatic triggers from anomaly detection systems
 *
 * SCALING NOTE: For multi-tenant systems, we can have:
 * - Global kill switch (affects all tenants)
 * - Tenant-level kill switches
 * - Run-level kill switches
 * Each level should be independently controllable.
 */

// Global kill state
// SCALING: Would be stored in Redis with pub/sub for instant propagation
let killed = false;
let killReason: string | null = null;

/**
 * Triggers the global kill switch.
 * All subsequent execution steps will be immediately terminated.
 */
export function killExecution(reason: string = "Manual termination"): void {
  killed = true;
  killReason = reason;
}

/**
 * Checks if the kill switch has been triggered.
 * Use this for conditional logic without throwing.
 */
export function isKilled(): boolean {
  return killed;
}

/**
 * Returns the reason for kill switch activation, if any.
 */
export function getKillReason(): string | null {
  return killReason;
}

/**
 * Asserts that execution is still allowed.
 * Throws KillSwitchTriggeredError if the kill switch has been triggered.
 *
 * This MUST be called before every execution step.
 */
export function assertAlive(): void {
  if (killed) {
    throw new KillSwitchTriggeredError(killReason ?? "Manual termination");
  }
}

/**
 * Resets the kill switch state.
 * Only use this in testing or when starting a completely new execution context.
 */
export function resetKillSwitch(): void {
  killed = false;
  killReason = null;
}
