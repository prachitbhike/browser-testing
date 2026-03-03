import type { Page } from 'playwright-core';
import type { MetricSample } from './metrics.js';
import type { BenchmarkMode } from './config.js';

export interface ScenarioContext {
  page: Page;
  providerName: string;
  iteration: number;
  config: {
    concurrency: number;
    timeout: number;
    mode: BenchmarkMode;
  };
}

export interface Scenario {
  readonly name: string;
  readonly description: string;
  readonly requiresOwnSessions: boolean;
  execute(context: ScenarioContext): Promise<MetricSample[]>;
}
