import type { StatisticalSummary } from '../types/metrics.js';

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function p95(values: number[]): number {
  return percentile(values, 95);
}

export function p99(values: number[]): number {
  return percentile(values, 99);
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const squaredDiffs = values.map(v => Math.pow(v - m, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1));
}

export function summarize(values: number[]): StatisticalSummary {
  if (values.length === 0) {
    return { mean: 0, median: 0, p95: 0, p99: 0, min: 0, max: 0, stdDev: 0, count: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  return {
    mean: mean(values),
    median: median(values),
    p95: p95(values),
    p99: p99(values),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev: stdDev(values),
    count: values.length,
  };
}
