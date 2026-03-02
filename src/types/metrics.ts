export type MetricName =
  | 'session_startup'
  | 'session_teardown'
  | 'page_load'
  | 'dom_content_loaded'
  | 'time_to_first_byte'
  | 'navigation_latency'
  | 'interaction_latency'
  | 'download_time'
  | 'concurrent_throughput'
  | 'total_iteration'
  | 'cpu_usage_percent'
  | 'memory_usage_mb';

export interface MetricSample {
  name: MetricName;
  value: number;
  unit: 'ms' | 'MB' | '%' | 'sessions/s';
  timestamp: number;
}

export interface SystemSnapshot {
  cpuUsagePercent: number;
  memoryUsageMb: number;
  timestamp: number;
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  stdDev: number;
  count: number;
}

export interface ScenarioResult {
  scenarioName: string;
  providerName: string;
  metrics: Map<MetricName, StatisticalSummary>;
  rawSamples: MetricSample[];
  systemSnapshots: SystemSnapshot[];
  iterationCount: number;
  errors: string[];
}

export interface BenchmarkReport {
  runId: string;
  timestamp: string;
  config: {
    providers: string[];
    scenarios: string[];
    iterations: number;
    warmupIterations: number;
    concurrency: number;
  };
  results: ScenarioResult[];
  duration: number;
}

export interface SerializableScenarioResult {
  scenarioName: string;
  providerName: string;
  metrics: Record<MetricName, StatisticalSummary>;
  rawSamples: MetricSample[];
  systemSnapshots: SystemSnapshot[];
  iterationCount: number;
  errors: string[];
}

export interface SerializableBenchmarkReport {
  runId: string;
  timestamp: string;
  config: {
    providers: string[];
    scenarios: string[];
    iterations: number;
    warmupIterations: number;
    concurrency: number;
  };
  results: SerializableScenarioResult[];
  duration: number;
}
