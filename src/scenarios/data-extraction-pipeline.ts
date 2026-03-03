import type { ScenarioContext } from '../types/scenario.js';
import { MetricsCollector } from '../metrics/collector.js';
import { BaseScenario } from './base-scenario.js';
import { Timer } from '../utils/timer.js';
import { logger } from '../utils/logger.js';

const PIPELINE_URLS = [
  'https://example.com',
  'https://httpbin.org/html',
  'https://httpbin.org/get',
  'https://jsonplaceholder.typicode.com/posts/1',
  'https://jsonplaceholder.typicode.com/users/1',
  'https://httpbin.org/headers',
  'https://httpbin.org/ip',
  'https://jsonplaceholder.typicode.com/todos/1',
];

interface ExtractedPageData {
  url: string;
  title: string;
  headings: string[];
  links: number;
  textLength: number;
}

export class DataExtractionPipelineScenario extends BaseScenario {
  readonly name = 'data-extraction-pipeline';
  readonly description = 'Visit 8 pages sequentially, extract structured data, measure throughput';

  async run(context: ScenarioContext, collector: MetricsCollector): Promise<void> {
    const { page } = context;
    const results: ExtractedPageData[] = [];
    const pipelineTimer = new Timer();
    pipelineTimer.start();

    for (const url of PIPELINE_URLS) {
      logger.debug(`data-extraction-pipeline: processing ${url}`);

      // Measure page load
      await this.timedNavigation(page, url, collector, url);

      // Measure extraction
      collector.startTimer('extraction_time');
      try {
        const data = await page.evaluate((pageUrl) => {
          const title = document.title || '';
          const headings = [...document.querySelectorAll('h1, h2, h3')]
            .slice(0, 10)
            .map(h => (h.textContent || '').trim());
          const links = document.querySelectorAll('a[href]').length;
          const textLength = (document.body.textContent || '').length;
          return { url: pageUrl, title, headings, links, textLength };
        }, url);

        collector.stopTimer('extraction_time');
        results.push(data);
        logger.debug(`data-extraction-pipeline: extracted ${data.title} (${data.textLength} chars, ${data.links} links)`);
      } catch (err) {
        collector.stopTimer('extraction_time');
        logger.warn(`data-extraction-pipeline: extraction failed for ${url}: ${err}`);
      }
    }

    const totalMs = pipelineTimer.stop();
    const throughput = PIPELINE_URLS.length / (totalMs / 1000);
    collector.record('extraction_throughput', throughput);

    logger.debug(
      `data-extraction-pipeline: completed ${results.length}/${PIPELINE_URLS.length} pages ` +
      `in ${totalMs.toFixed(0)}ms (${throughput.toFixed(2)} pages/s)`,
    );
  }
}
