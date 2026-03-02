import type { Page } from 'playwright-core';
import type { MetricName, MetricSample } from '../types/metrics.js';
import type { Scenario, ScenarioContext } from '../types/scenario.js';
import { MetricsCollector } from '../metrics/collector.js';
import { logger } from '../utils/logger.js';

export abstract class BaseScenario implements Scenario {
  abstract readonly name: string;
  abstract readonly description: string;
  readonly requiresOwnSessions = false;

  abstract run(context: ScenarioContext, collector: MetricsCollector): Promise<void>;

  async execute(context: ScenarioContext): Promise<MetricSample[]> {
    const collector = new MetricsCollector();
    await this.run(context, collector);
    return collector.getSamples();
  }

  protected async timedNavigation(
    page: Page,
    url: string,
    collector: MetricsCollector,
    label?: string,
  ): Promise<void> {
    collector.startTimer('page_load');
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    collector.stopTimer('page_load');

    // Extract Performance API metrics
    try {
      const perfData = await page.evaluate(() => {
        const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (entries.length === 0) return null;
        const nav = entries[0];
        return {
          ttfb: nav.responseStart - nav.requestStart,
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
        };
      });

      if (perfData) {
        if (perfData.ttfb > 0) {
          collector.record('time_to_first_byte', perfData.ttfb);
        }
        if (perfData.domContentLoaded > 0) {
          collector.record('dom_content_loaded', perfData.domContentLoaded);
        }
      }
    } catch {
      logger.debug(`Could not extract performance metrics for ${url}`);
    }
  }
}
