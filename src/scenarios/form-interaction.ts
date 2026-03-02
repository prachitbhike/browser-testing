import type { ScenarioContext } from '../types/scenario.js';
import type { MetricsCollector } from '../metrics/collector.js';
import { BaseScenario } from './base-scenario.js';

export class FormInteractionScenario extends BaseScenario {
  readonly name = 'form-interaction';
  readonly description = 'Fill form, submit, measure interaction latency';

  async run(context: ScenarioContext, collector: MetricsCollector): Promise<void> {
    const { page } = context;

    // Navigate to httpbin form
    await this.timedNavigation(page, 'https://httpbin.org/forms/post', collector);

    // Fill form fields — use flexible selectors
    collector.startTimer('interaction_latency');

    // Fill all visible input/textarea fields on the form
    const inputs = page.locator('form input[type="text"], form input:not([type])');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      try {
        await inputs.nth(i).fill(`test-value-${i}`, { timeout: 5000 });
      } catch {
        // Skip non-fillable inputs
      }
    }

    // Fill any textareas
    const textareas = page.locator('form textarea');
    const textareaCount = await textareas.count();
    for (let i = 0; i < textareaCount; i++) {
      try {
        await textareas.nth(i).fill('benchmark test input', { timeout: 5000 });
      } catch {
        // Skip
      }
    }

    // Submit the form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }),
      page.locator('form [type="submit"], form button').first().click(),
    ]);

    collector.stopTimer('interaction_latency');
  }
}
