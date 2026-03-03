import { describe, it, expect } from 'vitest';
import {
  mean, median, p95, p99, stdDev, percentile, summarize,
  confidenceInterval, isSignificantlyDifferent, tCritical,
} from '../../src/metrics/statistics.js';

describe('statistics', () => {
  describe('mean', () => {
    it('returns 0 for empty array', () => {
      expect(mean([])).toBe(0);
    });

    it('computes mean of single value', () => {
      expect(mean([5])).toBe(5);
    });

    it('computes mean correctly', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
    });

    it('handles decimals', () => {
      expect(mean([1.5, 2.5])).toBe(2);
    });
  });

  describe('median', () => {
    it('returns 0 for empty array', () => {
      expect(median([])).toBe(0);
    });

    it('returns middle value for odd count', () => {
      expect(median([3, 1, 2])).toBe(2);
    });

    it('returns average of middle values for even count', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });

    it('handles unsorted input', () => {
      expect(median([5, 1, 3])).toBe(3);
    });
  });

  describe('percentile', () => {
    it('returns 0 for empty array', () => {
      expect(percentile([], 95)).toBe(0);
    });

    it('computes p50 same as median', () => {
      const values = [1, 2, 3, 4, 5];
      expect(percentile(values, 50)).toBe(median(values));
    });

    it('computes p95', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      expect(p95(values)).toBeCloseTo(95.05, 1);
    });

    it('computes p99', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      expect(p99(values)).toBeCloseTo(99.01, 1);
    });
  });

  describe('stdDev', () => {
    it('returns 0 for less than 2 values', () => {
      expect(stdDev([])).toBe(0);
      expect(stdDev([5])).toBe(0);
    });

    it('computes sample standard deviation', () => {
      // [2, 4, 4, 4, 5, 5, 7, 9] — known stddev ≈ 2.138
      const values = [2, 4, 4, 4, 5, 5, 7, 9];
      expect(stdDev(values)).toBeCloseTo(2.138, 2);
    });
  });

  describe('tCritical', () => {
    it('returns table value for small df', () => {
      expect(tCritical(1)).toBe(12.706);
      expect(tCritical(10)).toBe(2.228);
      expect(tCritical(30)).toBe(2.042);
    });

    it('returns approximate value for large df', () => {
      expect(tCritical(50)).toBe(2.000);
      expect(tCritical(100)).toBe(1.980);
      expect(tCritical(200)).toBe(1.960);
    });

    it('returns Infinity for df < 1', () => {
      expect(tCritical(0)).toBe(Infinity);
      expect(tCritical(-5)).toBe(Infinity);
    });
  });

  describe('confidenceInterval', () => {
    it('returns zero margin for empty array', () => {
      const ci = confidenceInterval([]);
      expect(ci.mean).toBe(0);
      expect(ci.lower).toBe(0);
      expect(ci.upper).toBe(0);
      expect(ci.marginOfError).toBe(0);
    });

    it('returns zero margin for single value', () => {
      const ci = confidenceInterval([42]);
      expect(ci.mean).toBe(42);
      expect(ci.lower).toBe(42);
      expect(ci.upper).toBe(42);
      expect(ci.marginOfError).toBe(0);
    });

    it('computes CI for known distribution', () => {
      const values = [100, 110, 105, 108, 103, 107, 102, 109, 104, 106];
      const ci = confidenceInterval(values);
      expect(ci.mean).toBeCloseTo(105.4, 1);
      expect(ci.lower).toBeLessThan(ci.mean);
      expect(ci.upper).toBeGreaterThan(ci.mean);
      expect(ci.marginOfError).toBeGreaterThan(0);
      // CI should contain the mean
      expect(ci.lower).toBeLessThan(ci.upper);
    });

    it('wider CI for higher variance data', () => {
      const lowVar = [100, 101, 100, 101, 100];
      const highVar = [80, 120, 90, 110, 100];
      const ciLow = confidenceInterval(lowVar);
      const ciHigh = confidenceInterval(highVar);
      expect(ciHigh.marginOfError).toBeGreaterThan(ciLow.marginOfError);
    });
  });

  describe('isSignificantlyDifferent', () => {
    it('returns insufficient_data for small samples', () => {
      const result = isSignificantlyDifferent([1], [2]);
      expect(result.significant).toBe(false);
      expect(result.pValueApprox).toBe('insufficient_data');
    });

    it('detects clearly different distributions', () => {
      const a = [100, 102, 101, 103, 100, 102, 101, 103, 100, 102];
      const b = [200, 202, 201, 203, 200, 202, 201, 203, 200, 202];
      const result = isSignificantlyDifferent(a, b);
      expect(result.significant).toBe(true);
      expect(result.pValueApprox).toBe('p<0.05');
      expect(result.tStatistic).toBeGreaterThan(0);
      expect(result.df).toBeGreaterThan(0);
    });

    it('reports overlapping distributions as not significant', () => {
      const a = [100, 110, 105, 108, 103];
      const b = [102, 112, 107, 106, 104];
      const result = isSignificantlyDifferent(a, b);
      expect(result.significant).toBe(false);
      expect(result.pValueApprox).toBe('p>=0.05');
    });

    it('handles identical distributions', () => {
      const a = [100, 100, 100, 100, 100];
      const b = [100, 100, 100, 100, 100];
      const result = isSignificantlyDifferent(a, b);
      expect(result.significant).toBe(false);
    });
  });

  describe('summarize', () => {
    it('returns zeros for empty array', () => {
      const result = summarize([]);
      expect(result.count).toBe(0);
      expect(result.mean).toBe(0);
      expect(result.median).toBe(0);
      expect(result.ciLower).toBe(0);
      expect(result.ciUpper).toBe(0);
    });

    it('returns complete summary with CI fields', () => {
      const values = [10, 20, 30, 40, 50];
      const result = summarize(values);
      expect(result.count).toBe(5);
      expect(result.mean).toBe(30);
      expect(result.median).toBe(30);
      expect(result.min).toBe(10);
      expect(result.max).toBe(50);
      expect(result.stdDev).toBeGreaterThan(0);
      expect(result.p95).toBeGreaterThan(result.median);
      expect(result.p99).toBeGreaterThanOrEqual(result.p95);
      // CI fields present
      expect(result.ciLower).toBeLessThan(result.mean);
      expect(result.ciUpper).toBeGreaterThan(result.mean);
    });

    it('includes CI lower and upper in summary', () => {
      const values = [100, 110, 105, 108, 103, 107, 102, 109, 104, 106];
      const result = summarize(values);
      expect(result).toHaveProperty('ciLower');
      expect(result).toHaveProperty('ciUpper');
      expect(result.ciLower).toBeLessThan(result.ciUpper);
    });
  });
});
