import { describe, it, expect } from 'vitest';
import { MetricsCollector } from '../../src/metrics/collector.js';

describe('MetricsCollector', () => {
  it('records metric samples', () => {
    const collector = new MetricsCollector();
    collector.record('page_load', 150.5);
    collector.record('page_load', 200.3);

    const samples = collector.getSamples();
    expect(samples).toHaveLength(2);
    expect(samples[0].name).toBe('page_load');
    expect(samples[0].value).toBe(150.5);
    expect(samples[0].unit).toBe('ms');
    expect(samples[1].value).toBe(200.3);
  });

  it('records metric with correct unit', () => {
    const collector = new MetricsCollector();
    collector.record('concurrent_throughput', 5.2);
    collector.record('cpu_usage_percent', 45.3);
    collector.record('memory_usage_mb', 128.5);

    const samples = collector.getSamples();
    expect(samples[0].unit).toBe('sessions/s');
    expect(samples[1].unit).toBe('%');
    expect(samples[2].unit).toBe('MB');
  });

  it('records new metric names with correct units', () => {
    const collector = new MetricsCollector();
    collector.record('platform_api_time', 100);
    collector.record('cdp_connect_time', 50);
    collector.record('context_init_time', 20);
    collector.record('extraction_time', 30);
    collector.record('screenshot_time', 200);
    collector.record('render_complete_time', 150);
    collector.record('extraction_throughput', 3.5);

    const samples = collector.getSamples();
    expect(samples[0].unit).toBe('ms');   // platform_api_time
    expect(samples[1].unit).toBe('ms');   // cdp_connect_time
    expect(samples[2].unit).toBe('ms');   // context_init_time
    expect(samples[3].unit).toBe('ms');   // extraction_time
    expect(samples[4].unit).toBe('ms');   // screenshot_time
    expect(samples[5].unit).toBe('ms');   // render_complete_time
    expect(samples[6].unit).toBe('pages/s'); // extraction_throughput
  });

  it('starts and stops timers', async () => {
    const collector = new MetricsCollector();
    collector.startTimer('session_startup');

    // Small delay to have a measurable time
    await new Promise(resolve => setTimeout(resolve, 10));

    const duration = collector.stopTimer('session_startup');
    expect(duration).toBeGreaterThan(0);

    const samples = collector.getSamples();
    expect(samples).toHaveLength(1);
    expect(samples[0].name).toBe('session_startup');
    expect(samples[0].value).toBeGreaterThan(0);
  });

  it('throws when stopping non-existent timer', () => {
    const collector = new MetricsCollector();
    expect(() => collector.stopTimer('page_load')).toThrow('No active timer');
  });

  it('filters samples by metric name', () => {
    const collector = new MetricsCollector();
    collector.record('page_load', 100);
    collector.record('session_startup', 500);
    collector.record('page_load', 120);

    const pageLoadSamples = collector.getSamplesForMetric('page_load');
    expect(pageLoadSamples).toHaveLength(2);
    expect(pageLoadSamples.every(s => s.name === 'page_load')).toBe(true);
  });

  it('clears all samples and timers', () => {
    const collector = new MetricsCollector();
    collector.record('page_load', 100);
    collector.startTimer('session_startup');

    expect(collector.hasActiveTimers()).toBe(true);

    collector.clear();
    expect(collector.getSamples()).toHaveLength(0);
    expect(collector.hasActiveTimers()).toBe(false);
  });
});
