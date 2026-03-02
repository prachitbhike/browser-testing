import type { ScenarioContext } from '../types/scenario.js';
import type { MetricsCollector } from '../metrics/collector.js';
import { BaseScenario } from './base-scenario.js';
import { Timer } from '../utils/timer.js';

export class FileDownloadScenario extends BaseScenario {
  readonly name = 'file-download';
  readonly description = 'Trigger + measure file download';

  async run(context: ScenarioContext, collector: MetricsCollector): Promise<void> {
    const { page } = context;

    // Navigate to starting page
    await this.timedNavigation(page, 'https://httpbin.org', collector);

    // Use httpbin endpoints that return data — fetch as API calls to avoid
    // Playwright's download interception on binary content-type responses
    const downloadSizes = [1024, 10240, 102400];

    for (const size of downloadSizes) {
      const { durationMs } = await Timer.measure(async () => {
        await page.evaluate(async (bytes: number) => {
          const response = await fetch(`https://httpbin.org/bytes/${bytes}`);
          await response.arrayBuffer();
        }, size);
      });
      collector.record('download_time', durationMs);
    }
  }
}
