import type { Page } from 'playwright-core';
import type { MetricSample } from './metrics.js';

export interface ScenarioContext {
  page: Page;
  providerName: string;
  iteration: number;
  config: {
    concurrency: number;
    timeout: number;
  };
}

export interface Scenario {
  readonly name: string;
  readonly description: string;
  readonly requiresOwnSessions: boolean;
  execute(context: ScenarioContext): Promise<MetricSample[]>;
}
