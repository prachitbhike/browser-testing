import type { ScenarioContext } from '../types/scenario.js';
import { MetricsCollector } from '../metrics/collector.js';
import { BaseScenario } from './base-scenario.js';
import { Timer } from '../utils/timer.js';
import { logger } from '../utils/logger.js';

export class JavascriptHeavyPageScenario extends BaseScenario {
  readonly name = 'javascript-heavy-page';
  readonly description = 'JS rendering performance, waitForFunction, and in-browser computation';

  async run(context: ScenarioContext, collector: MetricsCollector): Promise<void> {
    const { page } = context;

    // Test 1: TodoMVC React app — wait for interactive element
    logger.debug('javascript-heavy-page: loading TodoMVC React');
    await this.timedNavigation(page, 'https://todomvc.com/examples/react/dist/', collector, 'todomvc');

    const { durationMs: reactRenderTime } = await Timer.measure(async () => {
      await page.waitForSelector('.new-todo, input.new-todo, [data-testid="text-input"]', {
        state: 'visible',
        timeout: 15000,
      });
    });
    collector.record('render_complete_time', reactRenderTime);
    logger.debug(`javascript-heavy-page: React app ready in ${reactRenderTime.toFixed(0)}ms`);

    // Test 2: Delayed API response — wait for body content
    logger.debug('javascript-heavy-page: loading delayed endpoint');
    await this.timedNavigation(page, 'https://httpbin.org/delay/1', collector, 'delayed-api');

    const { durationMs: delayRenderTime } = await Timer.measure(async () => {
      await page.waitForFunction(
        () => {
          const body = document.body.textContent || '';
          return body.includes('"origin"');
        },
        { timeout: 15000 },
      );
    });
    collector.record('render_complete_time', delayRenderTime);
    logger.debug(`javascript-heavy-page: delayed response rendered in ${delayRenderTime.toFixed(0)}ms`);

    // Test 3: Heavy in-browser computation on a simple page
    logger.debug('javascript-heavy-page: running heavy computation');
    await this.timedNavigation(page, 'https://example.com', collector, 'compute-base');

    const { durationMs: computeTime } = await Timer.measure(async () => {
      await page.evaluate(() => {
        // Sort a large array
        const arr = Array.from({ length: 50000 }, () => Math.random());
        arr.sort((a, b) => a - b);

        // Create and remove DOM nodes
        const container = document.createElement('div');
        document.body.appendChild(container);
        for (let i = 0; i < 1000; i++) {
          const el = document.createElement('div');
          el.textContent = `Node ${i}`;
          container.appendChild(el);
        }
        container.remove();

        return arr.length;
      });
    });
    collector.record('render_complete_time', computeTime);
    logger.debug(`javascript-heavy-page: heavy computation completed in ${computeTime.toFixed(0)}ms`);
  }
}
