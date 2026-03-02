import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { BenchmarkReport, MetricName, SerializableBenchmarkReport, SerializableScenarioResult } from '../types/metrics.js';
import { generateReportHtml } from './templates/report.html.js';
import { logger } from '../utils/logger.js';

function toSerializable(report: BenchmarkReport): SerializableBenchmarkReport {
  return {
    ...report,
    results: report.results.map((r): SerializableScenarioResult => ({
      ...r,
      metrics: Object.fromEntries(r.metrics) as Record<MetricName, any>,
    })),
  };
}

export class HtmlReporter {
  async generate(report: BenchmarkReport, outputDir: string): Promise<string> {
    await mkdir(outputDir, { recursive: true });

    const serializable = toSerializable(report);
    const html = generateReportHtml(serializable);
    const filename = `report-${report.runId}.html`;
    const filepath = join(outputDir, filename);

    await writeFile(filepath, html, 'utf-8');
    logger.success(`HTML report written to ${filepath}`);

    return filepath;
  }
}
