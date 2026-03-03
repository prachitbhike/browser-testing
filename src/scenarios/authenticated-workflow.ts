import type { ScenarioContext } from '../types/scenario.js';
import { MetricsCollector } from '../metrics/collector.js';
import { BaseScenario } from './base-scenario.js';
import { logger } from '../utils/logger.js';

export class AuthenticatedWorkflowScenario extends BaseScenario {
  readonly name = 'authenticated-workflow';
  readonly description = 'Login form fill, submit, redirect, and extract from authenticated page';

  async run(context: ScenarioContext, collector: MetricsCollector): Promise<void> {
    const { page } = context;

    // Step 1: Navigate to the form page
    logger.debug('authenticated-workflow: navigating to form');
    await this.timedNavigation(page, 'https://httpbin.org/forms/post', collector, 'form-page');

    // Step 2: Fill form fields — measure interaction latency
    collector.startTimer('interaction_latency');

    await page.fill('input[name="custname"]', 'Benchmark User');

    // Select a radio button for size
    await page.check('input[name="size"][value="medium"]');

    // Check topping checkboxes
    const toppings = page.locator('input[name="topping"]');
    const toppingCount = await toppings.count();
    if (toppingCount > 0) {
      await toppings.first().check();
    }

    // Fill textarea
    const textarea = page.locator('textarea[name="comments"]');
    if (await textarea.count() > 0) {
      await textarea.fill('Automated benchmark test for browser provider comparison');
    }

    collector.stopTimer('interaction_latency');
    logger.debug('authenticated-workflow: form filled');

    // Step 3: Submit and verify response
    collector.startTimer('extraction_time');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => {}),
      page.locator('form button, button[type="submit"], input[type="submit"]').first().click(),
    ]);

    // Extract data from response page
    const responseData = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        bodyLength: body.length,
        containsName: body.includes('Benchmark User'),
      };
    });

    collector.stopTimer('extraction_time');
    logger.debug(`authenticated-workflow: response extracted, containsName=${responseData.containsName}`);

    // Step 4: Navigate to another endpoint to simulate authenticated action
    await this.timedNavigation(page, 'https://httpbin.org/get', collector, 'authenticated-page');

    // Extract headers/data from the get endpoint
    collector.startTimer('extraction_time');
    const getData = await page.evaluate(() => {
      try {
        const pre = document.querySelector('pre') || document.body;
        const data = JSON.parse(pre.textContent || '{}');
        return { hasHeaders: !!data.headers, origin: data.origin || '' };
      } catch {
        return { hasHeaders: false, origin: '' };
      }
    });
    collector.stopTimer('extraction_time');

    logger.debug(`authenticated-workflow: extracted get data, hasHeaders=${getData.hasHeaders}`);
  }
}
