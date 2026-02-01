# Agent Execution Controller

**Safe Runtime for Agentic Workflows**

---

## Why This Exists

Autonomous AI agents are increasingly being deployed to perform real-world tasks: sending emails, updating CRMs, managing infrastructure, executing transactions. Unlike traditional software, agents:

- **Make irreversible decisions** — An agent that deletes data or sends a message cannot undo it
- **Operate in loops** — Recursive execution can spiral costs or actions exponentially
- **Lack predictable boundaries** — LLM behavior varies across runs, models, and prompts
- **Are difficult to audit** — Without structured logging, debugging production incidents is nearly impossible

Naive agent implementations fail in production because they lack:
- Hard budget limits
- Emergency stop mechanisms
- Deterministic replay for debugging
- Structured error handling

This project demonstrates the minimum viable execution controller that addresses these failure modes.

---

## What This Demonstrates

- ✅ **Deterministic execution** — Same inputs produce same event sequences
- ✅ **Budget guardrails** — Hard limits on tokens and cost
- ✅ **Kill switch** — Global emergency stop checked before every step
- ✅ **Event logging** — Append-only log of all execution steps
- ✅ **Replay** — Deterministic reconstruction of execution history
- ✅ **Lifecycle management** — Explicit state machine for execution runs
- ✅ **Structured errors** — Typed errors with context for debugging
- ✅ **Auditability** — Every step is logged with timestamp and cost

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXECUTION CONTROLLER                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     State Machine                            │   │
│  │   CREATED → RUNNING → PAUSED → COMPLETED / KILLED / FAILED  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│         ┌──────────────────────┼──────────────────────┐             │
│         ▼                      ▼                      ▼             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐         │
│  │ Kill Switch │      │  Guardrails │      │ Event Store │         │
│  │             │      │             │      │             │         │
│  │ • Global    │      │ • Token     │      │ • Append    │         │
│  │   stop      │      │   limits    │      │   only      │         │
│  │ • Checked   │      │ • Cost      │      │ • Immutable │         │
│  │   per step  │      │   limits    │      │ • Ordered   │         │
│  └─────────────┘      └─────────────┘      └─────────────┘         │
│                                                    │                 │
│                                                    ▼                 │
│                                           ┌─────────────┐           │
│                                           │   Replay    │           │
│                                           │             │           │
│                                           │ Deterministic│           │
│                                           │ reproduction │           │
│                                           └─────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       EXECUTION SUMMARY                              │
│  Run ID • Final State • Steps • Cost • Duration • Termination       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Execution Flow

1. **Create Run** — Initialize execution with ID, budget limits, and CREATED state
2. **Start Execution** — Transition to RUNNING, set `startedAt` timestamp
3. **Execute Steps** — For each step:
   - Check kill switch (abort if triggered)
   - Execute action
   - Accumulate costs
   - Enforce budget limits (abort if exceeded)
   - Log event with step number, type, cost, timestamp
4. **Complete or Fail** — Transition to terminal state, set `endedAt` timestamp
5. **Generate Summary** — Emit summary object for monitoring
6. **Replay** — Events can be replayed for debugging

---

## Failure Modes Handled

### Budget Exceeded
- **Trigger:** Token or USD spending exceeds configured limits
- **Behavior:** Throws `BudgetExceededError` with spent/limit context
- **Result:** Run transitions to FAILED state, logged with termination reason

### Kill Switch Triggered
- **Trigger:** Global `killExecution()` called (operator intervention)
- **Behavior:** Throws `KillSwitchTriggeredError` on next step check
- **Result:** Run transitions to KILLED state immediately
- **Critical:** Checked before EVERY step — no exceptions

### Invalid State Transition
- **Trigger:** Attempting forbidden state change (e.g., COMPLETED → RUNNING)
- **Behavior:** Throws `InvalidStateTransitionError`
- **Result:** Prevents undefined behavior, maintains audit integrity

### Replay After Failure
- **Behavior:** All events are preserved in append-only log
- **Result:** Exact reconstruction of execution history for debugging
- **Guarantee:** Events are immutable and ordered

---

## Scaling Considerations (Conceptual)

This implementation is intentionally in-memory and single-process. Here's how each component would scale:

### Execution State (→ Postgres + Redis)
- Run state stored in Postgres for durability
- Active run locks held in Redis for distributed coordination
- Enables multiple workers to process runs without conflicts

### Event Store (→ Kafka + Postgres)
- Events published to Kafka for real-time streaming
- Persisted to Postgres for queryable historical access
- Enables event sourcing and CQRS patterns

### Kill Switch (→ Redis Pub/Sub)
- Kill state stored in Redis with pub/sub for instant propagation
- All workers subscribe to kill channel
- Sub-millisecond propagation across distributed system

### Distributed Workers (→ Background Jobs)
- Workers claim runs via distributed locks
- Steps can be checkpointed for resumability
- Worker failures trigger automatic reassignment
- Horizontal scaling based on queue depth

### Multi-Tenancy
- Separate budgets per tenant
- Tenant-level and global kill switches
- Isolated event streams per tenant

---

## Project Structure

```
src/
├── core/
│   ├── types.ts        # Type definitions, interfaces, state machine
│   ├── errors.ts       # Structured error classes
│   ├── state.ts        # State machine transitions
│   ├── execution.ts    # Execution engine
│   ├── guard.ts        # Budget enforcement
│   ├── killSwitch.ts   # Global kill switch
│   └── cost.ts         # Cost tracking
├── log/
│   └── eventStore.ts   # Append-only event store
├── replay/
│   └── replay.ts       # Event replay for debugging
└── demo.ts             # Demo entry point
```

---

## Running the Demo

```bash
# Install dependencies
npm install

# Run the demo
npm run demo
or 
npx ts-node --esm src/demo.ts
```

The demo will:
1. Create an execution run with budget limits
2. Execute steps until completion or failure
3. Print an execution summary
4. Replay all events

---

## What This Is Not

- ❌ **Not an agent framework** — No LLM integration, prompts, or tools
- ❌ **Not an LLM wrapper** — No model-specific code
- ❌ **Not production-ready** — In-memory only, no persistence
- ❌ **Not a scheduler** — No cron, queues, or background jobs
- ❌ **Intentionally minimal** — Designed to be understood in <10 minutes

---

## Why This Matters for Agent Platforms

When agents interact with real systems, failures have real consequences:

| Scenario | Without Controller | With Controller |
|----------|-------------------|-----------------|
| Agent loops infinitely | Unbounded cost, API bans | Hard budget stops execution |
| Agent behaves dangerously | No way to stop | Kill switch halts immediately |
| Production incident | No trace of what happened | Full event log for replay |
| Cost investigation | Manual log scraping | Structured summary with totals |
| Debugging failures | "Something went wrong" | Typed errors with context |

This controller provides the minimum infrastructure needed to run agents safely in environments where they can:
- Touch customer data (CRMs, databases)
- Trigger external actions (emails, payments)
- Consume unbounded resources (API calls, compute)

---

## License

MIT
