import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { Command } from 'commander';
import chalk from 'chalk';
import { resolveConfig } from './config.js';
import { getAllScenarios } from './scenarios/index.js';
import { BenchmarkRunner } from './runner/benchmark-runner.js';
import { CliReporter } from './reporting/cli-reporter.js';
import { HtmlReporter } from './reporting/html-reporter.js';
import { logger, setLogLevel } from './utils/logger.js';
import type { CliOptions } from './types/config.js';

const program = new Command();

program
  .name('browser-benchmark')
  .description('Browserbase vs Kernel performance benchmark')
  .version('1.0.0')
  .option('-p, --providers <names>', 'Comma-separated provider names (browserbase,kernel)')
  .option('-s, --scenarios <names>', 'Comma-separated scenario names')
  .option('-i, --iterations <count>', 'Number of measured iterations')
  .option('-w, --warmup <count>', 'Number of warmup iterations')
  .option('-c, --concurrency <count>', 'Concurrent sessions for concurrent-sessions scenario')
  .option('-t, --timeout <ms>', 'Timeout per operation in ms')
  .option('-o, --output <dir>', 'Output directory for reports')
  .option('--no-html', 'Skip HTML report generation')
  .option('--list-scenarios', 'List all available scenarios and exit')
  .option('-m, --mode <mode>', 'Benchmark mode: "raw" (features disabled, region-matched) or "default" (out-of-the-box provider settings)', 'raw')
  .option('-v, --verbose', 'Enable verbose/debug logging')
  .action(async (opts: CliOptions) => {
    try {
      if (opts.verbose) {
        setLogLevel('debug');
      }

      if (opts.listScenarios) {
        console.log(chalk.bold('\nAvailable Scenarios:\n'));
        const scenarios = getAllScenarios();
        for (const scenario of scenarios) {
          console.log(`  ${chalk.cyan(scenario.name.padEnd(25))} ${chalk.gray(scenario.description)}`);
        }
        console.log();
        process.exit(0);
      }

      const config = resolveConfig(opts);

      logger.info('Configuration resolved');
      logger.debug(`Config: ${JSON.stringify(config, null, 2)}`);

      const runner = new BenchmarkRunner(config);
      const report = await runner.run();

      // CLI output
      const cliReporter = new CliReporter();
      cliReporter.print(report);

      // HTML output
      if (config.generateHtml) {
        const htmlReporter = new HtmlReporter();
        const filepath = await htmlReporter.generate(report, config.outputDir);
        console.log(chalk.bold(`\nHTML report: ${chalk.underline(filepath)}`));
      }

      process.exit(0);
    } catch (err) {
      logger.error(`Benchmark failed: ${err instanceof Error ? err.message : err}`);
      if (opts.verbose && err instanceof Error && err.stack) {
        console.error(err.stack);
      }
      process.exit(1);
    }
  });

program.parse();
