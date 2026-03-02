import type { BrowserProvider, BrowserSession } from '../types/provider.js';
import type { MetricSample, SystemSnapshot } from '../types/metrics.js';
import type { Scenario, ScenarioContext } from '../types/scenario.js';
import type { BenchmarkConfig } from '../types/config.js';
import { MetricsCollector } from '../metrics/collector.js';
import { SystemMonitor } from '../metrics/system-monitor.js';
import { logger } from '../utils/logger.js';

export interface IterationResult {
  samples: MetricSample[];
  systemSnapshots: SystemSnapshot[];
  error?: string;
}

export class IterationRunner {
  private config: BenchmarkConfig;

  constructor(config: BenchmarkConfig) {
    this.config = config;
  }

  async run(
    provider: BrowserProvider,
    scenario: Scenario,
    iteration: number,
  ): Promise<IterationResult> {
    const collector = new MetricsCollector();
    const systemMonitor = new SystemMonitor();
    let session: BrowserSession | null = null;

    systemMonitor.start(500);

    try {
      if (scenario.requiresOwnSessions) {
        // Scenario manages its own sessions (e.g., concurrent-sessions)
        collector.startTimer('total_iteration');

        const context: ScenarioContext = {
          page: null as any, // Not used for requiresOwnSessions
          providerName: provider.name,
          iteration,
          config: {
            concurrency: this.config.concurrency,
            timeout: this.config.timeout,
          },
        };

        const scenarioSamples = await scenario.execute(context);
        collector.stopTimer('total_iteration');

        return {
          samples: [...collector.getSamples(), ...scenarioSamples],
          systemSnapshots: systemMonitor.stop(),
        };
      }

      // Normal flow: create session, run scenario, teardown
      collector.startTimer('total_iteration');

      // Session startup
      collector.startTimer('session_startup');
      session = await provider.createSession();
      collector.stopTimer('session_startup');

      // Run scenario
      const context: ScenarioContext = {
        page: session.page,
        providerName: provider.name,
        iteration,
        config: {
          concurrency: this.config.concurrency,
          timeout: this.config.timeout,
        },
      };

      const scenarioSamples = await scenario.execute(context);

      // Session teardown
      collector.startTimer('session_teardown');
      await provider.destroySession(session);
      session = null;
      collector.stopTimer('session_teardown');

      collector.stopTimer('total_iteration');

      return {
        samples: [...collector.getSamples(), ...scenarioSamples],
        systemSnapshots: systemMonitor.stop(),
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Iteration ${iteration} failed for ${provider.name}/${scenario.name}: ${errorMsg}`);

      // Clean up on error
      if (session) {
        try {
          await provider.destroySession(session);
        } catch {
          // Ignore cleanup errors
        }
      }

      return {
        samples: collector.getSamples(),
        systemSnapshots: systemMonitor.stop(),
        error: errorMsg,
      };
    }
  }
}
