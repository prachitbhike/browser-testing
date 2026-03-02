import type { ScenarioContext } from '../types/scenario.js';
import type { MetricsCollector } from '../metrics/collector.js';
import { BaseScenario } from './base-scenario.js';

const TEST_URLS = [
  'https://example.com',
  'https://httpbin.org/html',
  'https://jsonplaceholder.typicode.com',
];

export class SimpleNavigationScenario extends BaseScenario {
  readonly name = 'simple-navigation';
  readonly description = 'Load 3 different pages, measure TTFB + full load time';

  async run(context: ScenarioContext, collector: MetricsCollector): Promise<void> {
    for (const url of TEST_URLS) {
      await this.timedNavigation(context.page, url, collector);
    }
  }
}
