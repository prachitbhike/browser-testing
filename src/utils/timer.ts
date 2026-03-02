export class Timer {
  private startTime: bigint = 0n;

  start(): void {
    this.startTime = process.hrtime.bigint();
  }

  stop(): number {
    const elapsed = process.hrtime.bigint() - this.startTime;
    return Number(elapsed) / 1_000_000; // nanoseconds → milliseconds
  }

  static now(): number {
    return Number(process.hrtime.bigint()) / 1_000_000;
  }

  static async measure<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
    const start = process.hrtime.bigint();
    const result = await fn();
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    return { result, durationMs };
  }
}
