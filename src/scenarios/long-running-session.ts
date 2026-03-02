import type { ScenarioContext } from '../types/scenario.js';
import type { MetricsCollector } from '../metrics/collector.js';
import { BaseScenario } from './base-scenario.js';
import { Timer } from '../utils/timer.js';
import { logger } from '../utils/logger.js';

const NAVIGATION_INTERVAL_MS = 15_000; // Navigate every 15 seconds
const SESSION_DURATION_MS = 120_000;    // 2 minutes by default

const ROTATION_URLS = [
  'https://example.com',
  'https://httpbin.org/html',
  'https://jsonplaceholder.typicode.com',
  'https://httpbin.org/get',
];

export class LongRunningSessionScenario extends BaseScenario {
  readonly name = 'long-running-session';
  readonly description = 'Keep alive for M minutes, detect degradation';

  async run(context: ScenarioContext, collector: MetricsCollector): Promise<void> {
    const { page } = context;
    const startTime = Date.now();
    let navigationIndex = 0;

    logger.debug(`long-running-session: running for ${SESSION_DURATION_MS / 1000}s`);

    while (Date.now() - startTime < SESSION_DURATION_MS) {
      const url = ROTATION_URLS[navigationIndex % ROTATION_URLS.length];

      try {
        const { durationMs } = await Timer.measure(async () => {
          await page.goto(url, { waitUntil: 'load', timeout: 30000 });
        });

        collector.record('page_load', durationMs);
        logger.debug(
          `long-running-session: nav #${navigationIndex + 1} to ${url} took ${durationMs.toFixed(0)}ms`
        );
      } catch (err) {
        logger.warn(`long-running-session: nav #${navigationIndex + 1} failed: ${err}`);
      }

      navigationIndex++;

      // Wait before next navigation
      const elapsed = Date.now() - startTime;
      const remaining = SESSION_DURATION_MS - elapsed;
      if (remaining > NAVIGATION_INTERVAL_MS) {
        await new Promise(resolve => setTimeout(resolve, NAVIGATION_INTERVAL_MS));
      } else if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
    }

    logger.debug(`long-running-session: completed ${navigationIndex} navigations`);
  }
}
