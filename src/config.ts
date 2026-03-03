import type { BenchmarkConfig, CliOptions } from './types/config.js';
import { getAvailableProviders } from './providers/index.js';
import { getScenarioNames } from './scenarios/index.js';

const DEFAULTS: BenchmarkConfig = {
  providers: getAvailableProviders(),
  scenarios: ['all'],
  iterations: 10,
  warmupIterations: 3,
  concurrency: 3,
  timeout: 60_000,
  outputDir: 'reports',
  generateHtml: true,
  listScenarios: false,
  verbose: false,
};

export function resolveConfig(cliOpts: CliOptions): BenchmarkConfig {
  const envIterations = process.env.BENCHMARK_ITERATIONS;
  const envWarmup = process.env.BENCHMARK_WARMUP;
  const envConcurrency = process.env.BENCHMARK_CONCURRENCY;
  const envTimeout = process.env.BENCHMARK_TIMEOUT;

  const providers = cliOpts.providers
    ? cliOpts.providers.split(',').map(s => s.trim())
    : DEFAULTS.providers;

  const scenarios = cliOpts.scenarios
    ? cliOpts.scenarios.split(',').map(s => s.trim())
    : DEFAULTS.scenarios;

  const iterations = cliOpts.iterations
    ? parseInt(cliOpts.iterations, 10)
    : envIterations
      ? parseInt(envIterations, 10)
      : DEFAULTS.iterations;

  const warmupIterations = cliOpts.warmup
    ? parseInt(cliOpts.warmup, 10)
    : envWarmup
      ? parseInt(envWarmup, 10)
      : DEFAULTS.warmupIterations;

  const concurrency = cliOpts.concurrency
    ? parseInt(cliOpts.concurrency, 10)
    : envConcurrency
      ? parseInt(envConcurrency, 10)
      : DEFAULTS.concurrency;

  const timeout = cliOpts.timeout
    ? parseInt(cliOpts.timeout, 10)
    : envTimeout
      ? parseInt(envTimeout, 10)
      : DEFAULTS.timeout;

  return {
    providers,
    scenarios,
    iterations,
    warmupIterations,
    concurrency,
    timeout,
    outputDir: cliOpts.output || DEFAULTS.outputDir,
    generateHtml: cliOpts.html !== false,
    listScenarios: cliOpts.listScenarios || false,
    verbose: cliOpts.verbose || false,
  };
}
