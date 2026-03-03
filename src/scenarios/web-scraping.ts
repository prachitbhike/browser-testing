import type { ScenarioContext } from '../types/scenario.js';
import { MetricsCollector } from '../metrics/collector.js';
import { BaseScenario } from './base-scenario.js';
import { logger } from '../utils/logger.js';

interface ScrapingTarget {
  url: string;
  label: string;
  extract: string; // JavaScript to run in page.evaluate
}

const TARGETS: ScrapingTarget[] = [
  {
    url: 'https://news.ycombinator.com/',
    label: 'hackernews',
    extract: `(() => {
      const items = [];
      document.querySelectorAll('.athing').forEach((row, i) => {
        if (i >= 15) return;
        const titleEl = row.querySelector('.titleline > a');
        const scoreRow = row.nextElementSibling;
        const scoreEl = scoreRow ? scoreRow.querySelector('.score') : null;
        items.push({
          rank: i + 1,
          title: titleEl ? titleEl.textContent : '',
          url: titleEl ? titleEl.getAttribute('href') : '',
          score: scoreEl ? parseInt(scoreEl.textContent) || 0 : 0,
        });
      });
      return items;
    })()`,
  },
  {
    url: 'https://en.wikipedia.org/wiki/Web_scraping',
    label: 'wikipedia',
    extract: `(() => {
      const headings = [...document.querySelectorAll('#mw-content-text h2, #mw-content-text h3')]
        .slice(0, 10)
        .map(h => h.textContent || '');
      const paragraphs = [...document.querySelectorAll('#mw-content-text p')]
        .slice(0, 5)
        .map(p => p.textContent ? p.textContent.substring(0, 200) : '');
      const links = [...document.querySelectorAll('#mw-content-text a[href^="/wiki/"]')]
        .slice(0, 20)
        .map(a => ({ text: a.textContent, href: a.getAttribute('href') }));
      return { headings, paragraphs, links: links.length };
    })()`,
  },
  {
    url: 'https://jsonplaceholder.typicode.com/posts',
    label: 'json-api',
    extract: `(() => {
      try {
        const pre = document.querySelector('pre') || document.body;
        const data = JSON.parse(pre.textContent || '[]');
        return { count: data.length, firstTitle: data[0]?.title || '' };
      } catch { return { count: 0, firstTitle: '' }; }
    })()`,
  },
];

export class WebScrapingScenario extends BaseScenario {
  readonly name = 'web-scraping';
  readonly description = 'Data extraction from multiple page types (HN, Wikipedia, JSON API)';

  async run(context: ScenarioContext, collector: MetricsCollector): Promise<void> {
    const { page } = context;

    for (const target of TARGETS) {
      logger.debug(`web-scraping: loading ${target.label}`);

      // Measure page load
      await this.timedNavigation(page, target.url, collector, target.label);

      // Measure extraction time
      collector.startTimer('extraction_time');
      try {
        const result = await page.evaluate(target.extract);
        collector.stopTimer('extraction_time');
        logger.debug(`web-scraping: extracted from ${target.label}: ${JSON.stringify(result).substring(0, 100)}`);
      } catch (err) {
        collector.stopTimer('extraction_time');
        logger.warn(`web-scraping: extraction failed for ${target.label}: ${err}`);
      }
    }
  }
}
