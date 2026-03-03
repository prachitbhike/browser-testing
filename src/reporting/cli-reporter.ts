import chalk from 'chalk';
import Table from 'cli-table3';
import type { BenchmarkReport, MetricName, ScenarioResult } from '../types/metrics.js';
import { isSignificantlyDifferent } from '../metrics/statistics.js';

const METRIC_LABELS: Partial<Record<MetricName, string>> = {
  session_startup: 'Session Startup',
  session_teardown: 'Session Teardown *',
  page_load: 'Page Load',
  dom_content_loaded: 'DOM Content Loaded',
  time_to_first_byte: 'TTFB',
  navigation_latency: 'Navigation Latency',
  interaction_latency: 'Interaction Latency',
  download_time: 'Download Time',
  concurrent_throughput: 'Throughput',
  total_iteration: 'Total Iteration',
  platform_api_time: 'Platform API',
  cdp_connect_time: 'CDP Connect',
  context_init_time: 'Context Init',
  extraction_time: 'Extraction Time',
  screenshot_time: 'Screenshot Time',
  render_complete_time: 'Render Complete',
  extraction_throughput: 'Extract Throughput',
};

const HIGHER_IS_BETTER: Set<MetricName> = new Set([
  'concurrent_throughput',
  'extraction_throughput',
]);

const TEARDOWN_METRICS: Set<MetricName> = new Set(['session_teardown']);

function formatValue(value: number, metric: MetricName): string {
  if (metric === 'concurrent_throughput') return `${value.toFixed(2)} sess/s`;
  if (metric === 'extraction_throughput') return `${value.toFixed(2)} pg/s`;
  if (metric === 'cpu_usage_percent') return `${value.toFixed(1)}%`;
  if (metric === 'memory_usage_mb') return `${value.toFixed(1)} MB`;
  return `${value.toFixed(1)} ms`;
}

function formatMedianWithCI(
  medianVal: number,
  ciLower: number,
  ciUpper: number,
  metric: MetricName,
): string {
  const base = formatValue(medianVal, metric);
  if (ciLower === ciUpper) return base;
  const lo = ciLower.toFixed(0);
  const hi = ciUpper.toFixed(0);
  return `${base} ${chalk.gray(`[${lo}-${hi}]`)}`;
}

interface WinnerResult {
  winner: string;
  isTie: boolean;
  isTeardown: boolean;
}

function getWinnerWithSignificance(
  providers: string[],
  scenarioResults: ScenarioResult[],
  metric: MetricName,
): WinnerResult {
  const isTeardown = TEARDOWN_METRICS.has(metric);

  if (providers.length < 2) {
    return { winner: '', isTie: false, isTeardown };
  }

  const medianValues = new Map<string, number>();
  const rawValues = new Map<string, number[]>();

  for (const provider of providers) {
    const result = scenarioResults.find(r => r.providerName === provider);
    const summary = result?.metrics.get(metric);
    if (summary && summary.count > 0) {
      medianValues.set(provider, summary.median);
      const samples = result!.rawSamples
        .filter(s => s.name === metric)
        .map(s => s.value);
      rawValues.set(provider, samples);
    }
  }

  const entries = [...medianValues.entries()].filter(([, v]) => v > 0);
  if (entries.length < 2) {
    return { winner: entries.length === 1 ? entries[0][0] : '', isTie: false, isTeardown };
  }

  const isHigherBetter = HIGHER_IS_BETTER.has(metric);
  entries.sort((a, b) => isHigherBetter ? b[1] - a[1] : a[1] - b[1]);

  const bestProvider = entries[0][0];
  const secondProvider = entries[1][0];

  // Run significance test
  const aVals = rawValues.get(bestProvider) || [];
  const bVals = rawValues.get(secondProvider) || [];
  const sigResult = isSignificantlyDifferent(aVals, bVals);

  if (!sigResult.significant) {
    return { winner: '', isTie: true, isTeardown };
  }

  return { winner: bestProvider, isTie: false, isTeardown };
}

function formatSuccessRate(rate: number, iterations: number): string {
  const pct = (rate * 100).toFixed(0);
  const succeeded = Math.round(rate * iterations);
  const label = `${pct}% (${succeeded}/${iterations})`;
  if (rate >= 1) return chalk.green(label);
  if (rate >= 0.8) return chalk.yellow(label);
  return chalk.red(label);
}

export class CliReporter {
  print(report: BenchmarkReport): void {
    console.log('\n');
    console.log(chalk.bold.underline(`Benchmark Report — Run ${report.runId}`));
    const modeLabel = report.config.mode === 'default'
      ? chalk.yellow('default (out-of-the-box provider settings)')
      : chalk.cyan('raw (features disabled, region-matched)');
    console.log(chalk.gray(`${report.timestamp} • Duration: ${(report.duration / 1000).toFixed(1)}s • Mode: `) + modeLabel);
    console.log();

    // Feature matrix
    if (report.providerFeatures && Object.keys(report.providerFeatures).length > 0) {
      this.printFeatureMatrix(report);
    }

    const scenarioNames = [...new Set(report.results.map(r => r.scenarioName))];
    const providerNames = report.config.providers;

    for (const scenarioName of scenarioNames) {
      const scenarioResults = report.results.filter(r => r.scenarioName === scenarioName);
      if (scenarioResults.length === 0) continue;

      console.log(chalk.bold.magenta(`\n  ${scenarioName}`));

      // Reliability row
      console.log(chalk.gray('  Reliability:'));
      for (const result of scenarioResults) {
        const rateStr = formatSuccessRate(result.successRate, result.iterationCount);
        console.log(`    ${chalk.cyan(result.providerName.padEnd(15))} ${rateStr}`);
      }

      // Collect all metric names
      const allMetricNames = new Set<MetricName>();
      for (const result of scenarioResults) {
        for (const key of result.metrics.keys()) {
          allMetricNames.add(key);
        }
      }

      const displayMetrics = [...allMetricNames].filter(
        m => m !== 'cpu_usage_percent' && m !== 'memory_usage_mb',
      );

      if (displayMetrics.length === 0) {
        console.log(chalk.gray('    No metrics collected'));
        continue;
      }

      const headers = [
        'Metric',
        ...providerNames.map(p => `${p} (median)`),
        ...providerNames.map(p => `${p} (p95)`),
        'Winner',
        'Sig.',
      ];
      const table = new Table({
        head: headers.map(h => chalk.cyan(h)),
        style: { head: [], border: [] },
        colWidths: [22, ...Array(providerNames.length * 2).fill(22), 14, 10],
      });

      for (const metric of displayMetrics) {
        const label = METRIC_LABELS[metric] || metric;
        const medianCells: string[] = [];
        const p95Cells: string[] = [];

        for (const provider of providerNames) {
          const result = scenarioResults.find(r => r.providerName === provider);
          const summary = result?.metrics.get(metric);
          if (summary && summary.count > 0) {
            medianCells.push(formatMedianWithCI(summary.median, summary.ciLower, summary.ciUpper, metric));
            p95Cells.push(formatValue(summary.p95, metric));
          } else {
            medianCells.push(chalk.gray('—'));
            p95Cells.push(chalk.gray('—'));
          }
        }

        const winResult = getWinnerWithSignificance(providerNames, scenarioResults, metric);

        let winnerCell: string;
        let sigCell: string;
        if (winResult.isTie) {
          winnerCell = chalk.yellow('tie');
          sigCell = chalk.gray('n.s.');
        } else if (winResult.winner) {
          winnerCell = winResult.isTeardown
            ? chalk.gray(winResult.winner + ' *')
            : chalk.green.bold(winResult.winner);
          sigCell = chalk.green('p<.05');
        } else {
          winnerCell = chalk.gray('—');
          sigCell = chalk.gray('—');
        }

        table.push([label, ...medianCells, ...p95Cells, winnerCell, sigCell]);
      }

      console.log(table.toString());

      // Show errors
      for (const result of scenarioResults) {
        if (result.errors.length > 0) {
          console.log(chalk.red(`    ${result.providerName} errors: ${result.errors.length}`));
          for (const err of result.errors.slice(0, 3)) {
            console.log(chalk.red(`      - ${err}`));
          }
        }
      }
    }

    // Teardown footnote
    console.log(chalk.gray('\n  * Teardown is non-comparable (Browserbase uses graceful REQUEST_RELEASE;'));
    console.log(chalk.gray('    Kernel uses immediate deleteByID). Excluded from winner tally.'));

    // Summary section — exclude teardown and use significance
    console.log(chalk.bold('\n  Overall Winners (significance-tested, teardown excluded):'));
    const wins = new Map<string, number>();
    const ties = { count: 0 };
    for (const provider of providerNames) {
      wins.set(provider, 0);
    }

    for (const scenarioName of scenarioNames) {
      const scenarioResults = report.results.filter(r => r.scenarioName === scenarioName);
      const allMetrics = new Set<MetricName>();
      for (const r of scenarioResults) {
        for (const k of r.metrics.keys()) allMetrics.add(k);
      }

      for (const metric of allMetrics) {
        if (metric === 'cpu_usage_percent' || metric === 'memory_usage_mb') continue;
        if (TEARDOWN_METRICS.has(metric)) continue;

        const winResult = getWinnerWithSignificance(providerNames, scenarioResults, metric);
        if (winResult.isTie) {
          ties.count++;
        } else if (winResult.winner) {
          wins.set(winResult.winner, (wins.get(winResult.winner) || 0) + 1);
        }
      }
    }

    for (const [provider, count] of wins) {
      const bar = '█'.repeat(count);
      console.log(`    ${chalk.cyan(provider.padEnd(15))} ${chalk.green(bar)} ${count} wins`);
    }
    if (ties.count > 0) {
      console.log(`    ${chalk.gray('ties'.padEnd(15))} ${chalk.yellow('█'.repeat(ties.count))} ${ties.count} ties`);
    }

    console.log();
  }

  private printFeatureMatrix(report: BenchmarkReport): void {
    const providerNames = report.config.providers;
    const featureLabels: { key: string; label: string }[] = [
      { key: 'sessionRecording', label: 'Session Recording' },
      { key: 'captchaSolving', label: 'CAPTCHA Solving' },
      { key: 'sessionLogging', label: 'Session Logging' },
      { key: 'advancedStealth', label: 'Advanced Stealth' },
      { key: 'adBlocking', label: 'Ad Blocking' },
      { key: 'proxy', label: 'Proxy' },
    ];

    console.log(chalk.bold('  Active Features (this run):'));
    const featureTable = new Table({
      head: ['Feature', ...providerNames].map(h => chalk.cyan(h)),
      style: { head: [], border: [] },
      colWidths: [22, ...Array(providerNames.length).fill(16)],
    });

    for (const { key, label } of featureLabels) {
      const row = [label];
      for (const pName of providerNames) {
        const features = report.providerFeatures[pName];
        if (features) {
          const val = (features as any)[key];
          row.push(val ? chalk.green('ON') : chalk.gray('off'));
        } else {
          row.push(chalk.gray('—'));
        }
      }
      featureTable.push(row);
    }

    console.log(featureTable.toString());
    console.log();
  }
}
