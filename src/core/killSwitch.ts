let killed = false;

export function killExecution() {
  killed = true;
}

export function assertAlive() {
  if (killed) {
    throw new Error("Execution terminated by kill switch");
  }
}
