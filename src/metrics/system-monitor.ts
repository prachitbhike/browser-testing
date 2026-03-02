import type { SystemSnapshot } from '../types/metrics.js';

export class SystemMonitor {
  private snapshots: SystemSnapshot[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private previousCpuUsage: NodeJS.CpuUsage | null = null;
  private previousTimestamp: number = 0;

  start(intervalMs = 500): void {
    this.snapshots = [];
    this.previousCpuUsage = process.cpuUsage();
    this.previousTimestamp = Date.now();

    this.intervalId = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);
  }

  stop(): SystemSnapshot[] {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    return [...this.snapshots];
  }

  private takeSnapshot(): void {
    const now = Date.now();
    const currentCpu = process.cpuUsage();

    let cpuPercent = 0;
    if (this.previousCpuUsage) {
      const userDelta = currentCpu.user - this.previousCpuUsage.user;
      const systemDelta = currentCpu.system - this.previousCpuUsage.system;
      const elapsed = (now - this.previousTimestamp) * 1000; // ms → µs
      if (elapsed > 0) {
        cpuPercent = ((userDelta + systemDelta) / elapsed) * 100;
      }
    }

    const memUsage = process.memoryUsage();
    const memoryMb = memUsage.rss / (1024 * 1024);

    this.snapshots.push({
      cpuUsagePercent: Math.round(cpuPercent * 100) / 100,
      memoryUsageMb: Math.round(memoryMb * 100) / 100,
      timestamp: now,
    });

    this.previousCpuUsage = currentCpu;
    this.previousTimestamp = now;
  }

  getSnapshots(): SystemSnapshot[] {
    return [...this.snapshots];
  }
}
