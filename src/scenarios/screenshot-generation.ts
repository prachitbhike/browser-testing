import type { ScenarioContext } from '../types/scenario.js';
import { MetricsCollector } from '../metrics/collector.js';
import { BaseScenario } from './base-scenario.js';
import { Timer } from '../utils/timer.js';
import { logger } from '../utils/logger.js';

interface ScreenshotTarget {
  url: string;
  label: string;
  description: string;
}

const TARGETS: ScreenshotTarget[] = [
  {
    url: 'https://example.com',
    label: 'simple',
    description: 'Simple static page',
  },
  {
    url: 'https://en.wikipedia.org/wiki/Browser_automation',
    label: 'content-rich',
    description: 'Content-rich Wikipedia article',
  },
  {
    url: 'https://news.ycombinator.com/',
    label: 'complex-layout',
    description: 'Complex table-based layout',
  },
];

export class ScreenshotGenerationScenario extends BaseScenario {
  readonly name = 'screenshot-generation';
  readonly description = 'Page load and full-page screenshot capture across 3 page types';

  async run(context: ScenarioContext, collector: MetricsCollector): Promise<void> {
    const { page } = context;

    for (const target of TARGETS) {
      logger.debug(`screenshot-generation: capturing ${target.label}`);

      // Navigate and wait for full load
      await this.timedNavigation(page, target.url, collector, target.label);

      try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch {
        logger.debug(`screenshot-generation: networkidle timeout for ${target.label}, proceeding`);
      }

      // Capture screenshot and measure time
      const { durationMs } = await Timer.measure(async () => {
        await page.screenshot({ fullPage: true });
      });

      collector.record('screenshot_time', durationMs);
      logger.debug(`screenshot-generation: ${target.label} screenshot in ${durationMs.toFixed(0)}ms`);
    }
  }
}
