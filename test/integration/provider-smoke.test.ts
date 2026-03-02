import { describe, it, expect } from 'vitest';
import { getAvailableProviders, createProvider } from '../../src/providers/index.js';
import { getAllScenarios, getScenario, getScenarioNames } from '../../src/scenarios/index.js';

describe('provider factory', () => {
  it('lists available providers', () => {
    const providers = getAvailableProviders();
    expect(providers).toContain('browserbase');
    expect(providers).toContain('kernel');
  });

  it('throws for unknown provider', () => {
    expect(() => createProvider('nonexistent')).toThrow('Unknown provider');
  });
});

describe('scenario registry', () => {
  it('lists all scenarios', () => {
    const scenarios = getAllScenarios();
    expect(scenarios.length).toBe(7);
  });

  it('gets scenario by name', () => {
    const scenario = getScenario('simple-navigation');
    expect(scenario.name).toBe('simple-navigation');
  });

  it('throws for unknown scenario', () => {
    expect(() => getScenario('nonexistent')).toThrow('Unknown scenario');
  });

  it('returns all scenario names', () => {
    const names = getScenarioNames();
    expect(names).toContain('simple-navigation');
    expect(names).toContain('form-interaction');
    expect(names).toContain('spa-navigation');
    expect(names).toContain('multi-page-crawl');
    expect(names).toContain('file-download');
    expect(names).toContain('concurrent-sessions');
    expect(names).toContain('long-running-session');
  });
});
