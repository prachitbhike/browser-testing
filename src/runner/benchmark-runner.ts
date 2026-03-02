import { nanoid } from 'nanoid';
import cliProgress from 'cli-progress';
import chalk from 'chalk';
import type { BenchmarkConfig } from '../types/config.js';
import type { BenchmarkReport, MetricName, MetricSample, ScenarioResult, SystemSnapshot } from '../types/metrics.js';
import type { BrowserProvider } from '../types/provider.js';
import type { Scenario } from '../types/scenario.js';
import { createProvider } from '../providers/index.js';
import { getAllScenarios, getScenario } from '../scenarios/index.js';
import { IterationRunner } from './iteration-runner.js';
import { summarize } from '../metrics/statistics.js';
import { Timer } from '../utils/timer.js';
import { logger } from '../utils/logger.js';

export class BenchmarkRunner {
  private config: BenchmarkConfig;

  constructor(config: BenchmarkConfig) {
    this.config = config;
  }

  async run(): Promise<BenchmarkReport> {
    const runId = nanoid(10);
    const startTime = Date.now();

    logger.info(`Starting benchmark run ${chalk.bold(runId)}`);
    logger.info(`Providers: ${chalk.cyan(this.config.providers.join(', '))}`);
    logger.info(`Scenarios: ${chalk.magenta(this.config.scenarios.join(', '))}`);
    logger.info(`Iterations: ${this.config.iterations} (warmup: ${this.config.warmupIterations})`);

    // Create providers
    const providers: BrowserProvider[] = [];
    for (const name of this.config.providers) {
      try {
        providers.push(createProvider(name));
      } catch (err) {
        logger.error(`Failed to create provider "${name}": ${err}`);
        throw err;
      }
    }

    // Health check all providers
    logger.info('Running health checks...');
    for (const provider of providers) {
      const healthy = await provider.healthCheck();
      if (healthy) {
        logger.success(`${provider.name} is healthy`);
      } else {
        throw new Error(`Provider ${provider.name} failed health check`);
      }
    }

    // Resolve scenarios
    const scenarios: Scenario[] = this.config.scenarios.includes('all')
      ? getAllScenarios()
      : this.config.scenarios.map(name => getScenario(name));

    // Run benchmarks
    const results: ScenarioResult[] = [];
    const iterationRunner = new IterationRunner(this.config);
    const totalSteps = scenarios.length * providers.length * (this.config.warmupIterations + this.config.iterations);

    const progressBar = new cliProgress.SingleBar({
      format: `  {bar} ${chalk.gray('{percentage}%')} | {scenario} | {provider} | {phase} {iteration}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });
    progressBar.start(totalSteps, 0, {
      scenario: '',
      provider: '',
      phase: '',
      iteration: '',
    });

    let step = 0;

    for (const scenario of scenarios) {
      logger.scenario(scenario.name, 'starting');

      for (const provider of providers) {
        logger.provider(provider.name, `running ${scenario.name}`);

        const allSamples: MetricSample[] = [];
        const allSnapshots: SystemSnapshot[] = [];
        const errors: string[] = [];

        // Warmup iterations
        for (let i = 0; i < this.config.warmupIterations; i++) {
          progressBar.update(++step, {
            scenario: scenario.name,
            provider: provider.name,
            phase: 'warmup',
            iteration: `${i + 1}/${this.config.warmupIterations}`,
          });

          try {
            await iterationRunner.run(provider, scenario, i);
          } catch (err) {
            logger.warn(`Warmup iteration ${i + 1} failed for ${provider.name}/${scenario.name}: ${err}`);
          }
        }

        // Measured iterations
        for (let i = 0; i < this.config.iterations; i++) {
          progressBar.update(++step, {
            scenario: scenario.name,
            provider: provider.name,
            phase: 'measure',
            iteration: `${i + 1}/${this.config.iterations}`,
          });

          const result = await iterationRunner.run(provider, scenario, i);
          allSamples.push(...result.samples);
          allSnapshots.push(...result.systemSnapshots);
          if (result.error) {
            errors.push(result.error);
          }
        }

        // Aggregate metrics
        const metricNames = [...new Set(allSamples.map(s => s.name))] as MetricName[];
        const metricsMap = new Map<MetricName, ReturnType<typeof summarize>>();

        for (const metricName of metricNames) {
          const values = allSamples
            .filter(s => s.name === metricName)
            .map(s => s.value);
          metricsMap.set(metricName, summarize(values));
        }

        results.push({
          scenarioName: scenario.name,
          providerName: provider.name,
          metrics: metricsMap,
          rawSamples: allSamples,
          systemSnapshots: allSnapshots,
          iterationCount: this.config.iterations,
          errors,
        });
      }
    }

    progressBar.stop();

    const duration = Date.now() - startTime;
    logger.success(`Benchmark completed in ${(duration / 1000).toFixed(1)}s`);

    return {
      runId,
      timestamp: new Date().toISOString(),
      config: {
        providers: this.config.providers,
        scenarios: this.config.scenarios,
        iterations: this.config.iterations,
        warmupIterations: this.config.warmupIterations,
        concurrency: this.config.concurrency,
      },
      results,
      duration,
    };
  }
}
