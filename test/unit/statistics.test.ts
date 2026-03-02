import { describe, it, expect } from 'vitest';
import { mean, median, p95, p99, stdDev, percentile, summarize } from '../../src/metrics/statistics.js';

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

  describe('summarize', () => {
    it('returns zeros for empty array', () => {
      const result = summarize([]);
      expect(result.count).toBe(0);
      expect(result.mean).toBe(0);
      expect(result.median).toBe(0);
    });

    it('returns complete summary', () => {
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
    });
  });
});
