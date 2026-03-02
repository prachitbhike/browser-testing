import type { MetricSample } from '../types/metrics.js';
import type { Scenario, ScenarioContext } from '../types/scenario.js';
import type { BrowserProvider } from '../types/provider.js';
import { MetricsCollector } from '../metrics/collector.js';
import { Timer } from '../utils/timer.js';
import { logger } from '../utils/logger.js';
import { createProvider } from '../providers/index.js';

export class ConcurrentSessionsScenario implements Scenario {
  readonly name = 'concurrent-sessions';
  readonly description = 'Spin up N sessions in parallel, measure throughput';
  readonly requiresOwnSessions = true;

  async execute(context: ScenarioContext): Promise<MetricSample[]> {
    const collector = new MetricsCollector();
    const concurrency = context.config.concurrency;
    const provider = createProvider(context.providerName);

    logger.debug(`concurrent-sessions: launching ${concurrency} parallel sessions`);

    const { durationMs } = await Timer.measure(async () => {
      const promises = Array.from({ length: concurrency }, async (_, i) => {
        const { durationMs: sessionMs } = await Timer.measure(async () => {
          const session = await provider.createSession();
          try {
            await session.page.goto('https://example.com', {
              waitUntil: 'load',
              timeout: 30000,
            });
          } finally {
            await provider.destroySession(session);
          }
        });
        collector.record('session_startup', sessionMs);
        return sessionMs;
      });

      const results = await Promise.allSettled(promises);
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.debug(`concurrent-sessions: ${succeeded} succeeded, ${failed} failed`);
    });

    // Calculate throughput
    const throughput = concurrency / (durationMs / 1000);
    collector.record('concurrent_throughput', throughput);

    return collector.getSamples();
  }
}
