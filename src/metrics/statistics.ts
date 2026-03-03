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

// t-distribution critical values for two-tailed 95% confidence (alpha=0.05)
const T_CRITICAL_TABLE: Record<number, number> = {
  1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
  6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
  11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
  16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
  21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
  26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042,
};

export function tCritical(df: number): number {
  if (df < 1) return Infinity;
  const floored = Math.floor(df);
  if (floored <= 30) return T_CRITICAL_TABLE[Math.max(1, floored)];
  if (floored <= 40) return 2.021;
  if (floored <= 60) return 2.000;
  if (floored <= 120) return 1.980;
  return 1.960; // z-score for large df
}

export interface ConfidenceIntervalResult {
  lower: number;
  upper: number;
  mean: number;
  marginOfError: number;
}

export function confidenceInterval(
  values: number[],
  confidence = 0.95,
): ConfidenceIntervalResult {
  if (values.length < 2) {
    const m = values.length === 1 ? values[0] : 0;
    return { lower: m, upper: m, mean: m, marginOfError: 0 };
  }

  const m = mean(values);
  const s = stdDev(values);
  const n = values.length;
  const df = n - 1;
  const t = tCritical(df);
  const se = s / Math.sqrt(n);
  const moe = t * se;

  return {
    lower: m - moe,
    upper: m + moe,
    mean: m,
    marginOfError: moe,
  };
}

export interface SignificanceResult {
  significant: boolean;
  tStatistic: number;
  df: number;
  pValueApprox: 'p<0.05' | 'p>=0.05' | 'insufficient_data';
}

export function isSignificantlyDifferent(
  a: number[],
  b: number[],
): SignificanceResult {
  if (a.length < 2 || b.length < 2) {
    return {
      significant: false,
      tStatistic: 0,
      df: 0,
      pValueApprox: 'insufficient_data',
    };
  }

  const meanA = mean(a);
  const meanB = mean(b);
  const varA = Math.pow(stdDev(a), 2);
  const varB = Math.pow(stdDev(b), 2);
  const nA = a.length;
  const nB = b.length;

  const seA = varA / nA;
  const seB = varB / nB;
  const seDiff = Math.sqrt(seA + seB);

  if (seDiff === 0) {
    return { significant: false, tStatistic: 0, df: nA + nB - 2, pValueApprox: 'p>=0.05' };
  }

  const tStat = Math.abs(meanA - meanB) / seDiff;

  // Welch–Satterthwaite degrees of freedom
  const dfNum = Math.pow(seA + seB, 2);
  const dfDen = Math.pow(seA, 2) / (nA - 1) + Math.pow(seB, 2) / (nB - 1);
  const df = dfDen > 0 ? dfNum / dfDen : nA + nB - 2;

  const tCrit = tCritical(df);
  const significant = tStat > tCrit;

  return {
    significant,
    tStatistic: tStat,
    df,
    pValueApprox: significant ? 'p<0.05' : 'p>=0.05',
  };
}

export function summarize(values: number[]): StatisticalSummary {
  if (values.length === 0) {
    return { mean: 0, median: 0, p95: 0, p99: 0, min: 0, max: 0, stdDev: 0, count: 0, ciLower: 0, ciUpper: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const ci = confidenceInterval(values);
  return {
    mean: mean(values),
    median: median(values),
    p95: p95(values),
    p99: p99(values),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev: stdDev(values),
    count: values.length,
    ciLower: ci.lower,
    ciUpper: ci.upper,
  };
}
