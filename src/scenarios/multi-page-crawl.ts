import type { ScenarioContext } from '../types/scenario.js';
import type { MetricsCollector } from '../metrics/collector.js';
import { BaseScenario } from './base-scenario.js';
import { logger } from '../utils/logger.js';

const MAX_LINKS = 5;

export class MultiPageCrawlScenario extends BaseScenario {
  readonly name = 'multi-page-crawl';
  readonly description = 'Extract N links from a page, visit each sequentially';

  async run(context: ScenarioContext, collector: MetricsCollector): Promise<void> {
    const { page } = context;

    // Start from a page with multiple links
    await this.timedNavigation(page, 'https://httpbin.org', collector);

    // Extract links from the page
    const links = await page.evaluate((maxLinks: number) => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors
        .map(a => (a as HTMLAnchorElement).href)
        .filter(href => href.startsWith('http') && !href.includes('github'))
        .slice(0, maxLinks);
    }, MAX_LINKS);

    logger.debug(`multi-page-crawl: found ${links.length} links to visit`);

    // Visit each link sequentially
    for (const link of links) {
      try {
        await this.timedNavigation(page, link, collector);
      } catch (err) {
        logger.debug(`multi-page-crawl: skipping ${link}: ${err}`);
      }
    }
  }
}
