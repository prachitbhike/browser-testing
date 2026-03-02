import type { ScenarioContext } from '../types/scenario.js';
import type { MetricsCollector } from '../metrics/collector.js';
import { BaseScenario } from './base-scenario.js';
import { Timer } from '../utils/timer.js';

export class SpaNavigationScenario extends BaseScenario {
  readonly name = 'spa-navigation';
  readonly description = 'Client-side route changes on a SPA (TodoMVC)';

  async run(context: ScenarioContext, collector: MetricsCollector): Promise<void> {
    const { page } = context;

    // Load TodoMVC React app
    await this.timedNavigation(
      page,
      'https://todomvc.com/examples/react/dist/',
      collector,
    );

    // Add some todos
    const todoInput = page.locator('.new-todo');
    const todos = ['Buy groceries', 'Write benchmark', 'Review results'];

    for (const todo of todos) {
      collector.startTimer('interaction_latency');
      await todoInput.fill(todo);
      await todoInput.press('Enter');
      // Wait for the todo item to appear
      await page.locator('.todo-list li').last().waitFor({ state: 'visible', timeout: 5000 });
      collector.stopTimer('interaction_latency');
    }

    // Client-side route change: "Active" filter
    const { durationMs: activeNavMs } = await Timer.measure(async () => {
      await page.click('a[href="#/active"]');
      await page.waitForURL('**/active', { timeout: 5000 });
    });
    collector.record('navigation_latency', activeNavMs);

    // Client-side route change: "Completed" filter
    const { durationMs: completedNavMs } = await Timer.measure(async () => {
      await page.click('a[href="#/completed"]');
      await page.waitForURL('**/completed', { timeout: 5000 });
    });
    collector.record('navigation_latency', completedNavMs);

    // Client-side route change: back to "All"
    const { durationMs: allNavMs } = await Timer.measure(async () => {
      await page.click('a[href="#/"]');
      await page.waitForURL(/\/#\/$/, { timeout: 5000 });
    });
    collector.record('navigation_latency', allNavMs);
  }
}
