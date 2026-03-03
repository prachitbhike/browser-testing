import type { MetricName, MetricSample } from '../types/metrics.js';
import { Timer } from '../utils/timer.js';

type MetricUnit = 'ms' | 'MB' | '%' | 'sessions/s' | 'pages/s';

const METRIC_UNITS: Record<MetricName, MetricUnit> = {
  session_startup: 'ms',
  session_teardown: 'ms',
  page_load: 'ms',
  dom_content_loaded: 'ms',
  time_to_first_byte: 'ms',
  navigation_latency: 'ms',
  interaction_latency: 'ms',
  download_time: 'ms',
  concurrent_throughput: 'sessions/s',
  total_iteration: 'ms',
  cpu_usage_percent: '%',
  memory_usage_mb: 'MB',
  platform_api_time: 'ms',
  cdp_connect_time: 'ms',
  context_init_time: 'ms',
  extraction_time: 'ms',
  screenshot_time: 'ms',
  render_complete_time: 'ms',
  extraction_throughput: 'pages/s',
};

export class MetricsCollector {
  private samples: MetricSample[] = [];
  private activeTimers = new Map<string, Timer>();

  startTimer(name: MetricName): void {
    const timer = new Timer();
    timer.start();
    this.activeTimers.set(name, timer);
  }

  stopTimer(name: MetricName): number {
    const timer = this.activeTimers.get(name);
    if (!timer) {
      throw new Error(`No active timer for metric: ${name}`);
    }
    const durationMs = timer.stop();
    this.activeTimers.delete(name);
    this.record(name, durationMs);
    return durationMs;
  }

  record(name: MetricName, value: number): void {
    this.samples.push({
      name,
      value,
      unit: METRIC_UNITS[name],
      timestamp: Date.now(),
    });
  }

  getSamples(): MetricSample[] {
    return [...this.samples];
  }

  getSamplesForMetric(name: MetricName): MetricSample[] {
    return this.samples.filter(s => s.name === name);
  }

  clear(): void {
    this.samples = [];
    this.activeTimers.clear();
  }

  hasActiveTimers(): boolean {
    return this.activeTimers.size > 0;
  }
}
