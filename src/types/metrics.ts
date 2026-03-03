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
  | 'memory_usage_mb'
  | 'platform_api_time'
  | 'cdp_connect_time'
  | 'context_init_time'
  | 'extraction_time'
  | 'screenshot_time'
  | 'render_complete_time'
  | 'extraction_throughput';

export interface MetricSample {
  name: MetricName;
  value: number;
  unit: 'ms' | 'MB' | '%' | 'sessions/s' | 'pages/s';
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
  ciLower: number;
  ciUpper: number;
}

export interface ScenarioResult {
  scenarioName: string;
  providerName: string;
  metrics: Map<MetricName, StatisticalSummary>;
  rawSamples: MetricSample[];
  systemSnapshots: SystemSnapshot[];
  iterationCount: number;
  errors: string[];
  successRate: number;
}

export interface ProviderFeaturesInfo {
  sessionRecording: boolean;
  captchaSolving: boolean;
  sessionLogging: boolean;
  advancedStealth: boolean;
  adBlocking: boolean;
  proxy: boolean;
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
    mode: string;
  };
  providerFeatures: Record<string, ProviderFeaturesInfo>;
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
  successRate: number;
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
    mode: string;
  };
  providerFeatures: Record<string, ProviderFeaturesInfo>;
  results: SerializableScenarioResult[];
  duration: number;
}
