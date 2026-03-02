import chalk from 'chalk';
import Table from 'cli-table3';
import type { BenchmarkReport, MetricName, StatisticalSummary } from '../types/metrics.js';

const METRIC_LABELS: Partial<Record<MetricName, string>> = {
  session_startup: 'Session Startup',
  session_teardown: 'Session Teardown',
  page_load: 'Page Load',
  dom_content_loaded: 'DOM Content Loaded',
  time_to_first_byte: 'TTFB',
  navigation_latency: 'Navigation Latency',
  interaction_latency: 'Interaction Latency',
  download_time: 'Download Time',
  concurrent_throughput: 'Throughput',
  total_iteration: 'Total Iteration',
};

function formatValue(value: number, metric: MetricName): string {
  if (metric === 'concurrent_throughput') {
    return `${value.toFixed(2)} sess/s`;
  }
  if (metric === 'cpu_usage_percent') {
    return `${value.toFixed(1)}%`;
  }
  if (metric === 'memory_usage_mb') {
    return `${value.toFixed(1)} MB`;
  }
  return `${value.toFixed(1)} ms`;
}

function getWinner(
  providers: string[],
  values: Map<string, number>,
  metric: MetricName,
): string {
  if (providers.length < 2) return '';
  const entries = [...values.entries()].filter(([, v]) => v > 0);
  if (entries.length < 2) return '';

  // For throughput, higher is better; for everything else, lower is better
  const isHigherBetter = metric === 'concurrent_throughput';
  entries.sort((a, b) => isHigherBetter ? b[1] - a[1] : a[1] - b[1]);

  return entries[0][0];
}

export class CliReporter {
  print(report: BenchmarkReport): void {
    console.log('\n');
    console.log(chalk.bold.underline(`Benchmark Report — Run ${report.runId}`));
    console.log(chalk.gray(`${report.timestamp} • Duration: ${(report.duration / 1000).toFixed(1)}s`));
    console.log();

    // Group results by scenario
    const scenarioNames = [...new Set(report.results.map(r => r.scenarioName))];
    const providerNames = report.config.providers;

    for (const scenarioName of scenarioNames) {
      const scenarioResults = report.results.filter(r => r.scenarioName === scenarioName);
      if (scenarioResults.length === 0) continue;

      console.log(chalk.bold.magenta(`\n  ${scenarioName}`));

      // Collect all metric names across providers for this scenario
      const allMetricNames = new Set<MetricName>();
      for (const result of scenarioResults) {
        for (const key of result.metrics.keys()) {
          allMetricNames.add(key);
        }
      }

      // Skip system metrics in CLI table
      const displayMetrics = [...allMetricNames].filter(
        m => m !== 'cpu_usage_percent' && m !== 'memory_usage_mb',
      );

      if (displayMetrics.length === 0) {
        console.log(chalk.gray('    No metrics collected'));
        continue;
      }

      const headers = ['Metric', ...providerNames.map(p => `${p} (median)`), ...providerNames.map(p => `${p} (p95)`), 'Winner'];
      const table = new Table({
        head: headers.map(h => chalk.cyan(h)),
        style: { head: [], border: [] },
        colWidths: [22, ...Array(providerNames.length * 2).fill(18), 14],
      });

      for (const metric of displayMetrics) {
        const label = METRIC_LABELS[metric] || metric;
        const medianValues = new Map<string, number>();
        const p95Values = new Map<string, number>();
        const medianCells: string[] = [];
        const p95Cells: string[] = [];

        for (const provider of providerNames) {
          const result = scenarioResults.find(r => r.providerName === provider);
          const summary = result?.metrics.get(metric);
          if (summary && summary.count > 0) {
            medianValues.set(provider, summary.median);
            p95Values.set(provider, summary.p95);
            medianCells.push(formatValue(summary.median, metric));
            p95Cells.push(formatValue(summary.p95, metric));
          } else {
            medianCells.push(chalk.gray('—'));
            p95Cells.push(chalk.gray('—'));
          }
        }

        const winner = getWinner(providerNames, medianValues, metric);
        const winnerCell = winner ? chalk.green.bold(winner) : chalk.gray('—');

        table.push([label, ...medianCells, ...p95Cells, winnerCell]);
      }

      console.log(table.toString());

      // Show errors if any
      for (const result of scenarioResults) {
        if (result.errors.length > 0) {
          console.log(chalk.red(`    ${result.providerName} errors: ${result.errors.length}`));
          for (const err of result.errors.slice(0, 3)) {
            console.log(chalk.red(`      - ${err}`));
          }
        }
      }
    }

    // Summary section
    console.log(chalk.bold('\n  Overall Winners:'));
    const wins = new Map<string, number>();
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
        const medianValues = new Map<string, number>();
        for (const provider of providerNames) {
          const result = scenarioResults.find(r => r.providerName === provider);
          const summary = result?.metrics.get(metric);
          if (summary && summary.count > 0) {
            medianValues.set(provider, summary.median);
          }
        }
        const winner = getWinner(providerNames, medianValues, metric);
        if (winner) {
          wins.set(winner, (wins.get(winner) || 0) + 1);
        }
      }
    }

    for (const [provider, count] of wins) {
      const bar = '█'.repeat(count);
      console.log(`    ${chalk.cyan(provider.padEnd(15))} ${chalk.green(bar)} ${count} wins`);
    }

    console.log();
  }
}
