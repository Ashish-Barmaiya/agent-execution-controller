export type ExecutionState = "RUNNING" | "COMPLETED" | "KILLED" | "FAILED";

export type Budget = {
  maxTokens: number;
  maxUsd: number;
};

export type StepEvent = {
  id: string;
  type: "LLM_CALL" | "TOOL_CALL" | "DECISION" | "ERROR";
  description: string;
  cost: number;
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
};
