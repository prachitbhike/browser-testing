import type { MetricSample } from '../types/metrics.js';
import type { Scenario, ScenarioContext } from '../types/scenario.js';
import { MetricsCollector } from '../metrics/collector.js';
import { Timer } from '../utils/timer.js';
import { logger } from '../utils/logger.js';
import { createProvider } from '../providers/index.js';

export class ConcurrentSessionsScenario implements Scenario {
  readonly name = 'concurrent-sessions';
  readonly description = 'Spin up sessions at multiple scaling levels (1, 3, 5, N), measure throughput';
  readonly requiresOwnSessions = true;

  async execute(context: ScenarioContext): Promise<MetricSample[]> {
    const collector = new MetricsCollector();
    const maxConcurrency = context.config.concurrency;
    const provider = createProvider(context.providerName, context.config.mode);

    // Test at multiple scaling levels
    const levels = [...new Set([1, 3, 5, maxConcurrency].filter(n => n > 0 && n <= maxConcurrency))].sort((a, b) => a - b);

    for (const concurrency of levels) {
      logger.debug(`concurrent-sessions: testing ${concurrency} parallel sessions`);

      const { durationMs } = await Timer.measure(async () => {
        const promises = Array.from({ length: concurrency }, async () => {
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

        logger.debug(`concurrent-sessions@${concurrency}: ${succeeded} succeeded, ${failed} failed`);
      });

      // Calculate throughput at this level
      const throughput = concurrency / (durationMs / 1000);
      collector.record('concurrent_throughput', throughput);
    }

    return collector.getSamples();
  }
}
