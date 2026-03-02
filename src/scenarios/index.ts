import type { Scenario } from '../types/scenario.js';
import { SimpleNavigationScenario } from './simple-navigation.js';
import { FormInteractionScenario } from './form-interaction.js';
import { SpaNavigationScenario } from './spa-navigation.js';
import { MultiPageCrawlScenario } from './multi-page-crawl.js';
import { FileDownloadScenario } from './file-download.js';
import { ConcurrentSessionsScenario } from './concurrent-sessions.js';
import { LongRunningSessionScenario } from './long-running-session.js';

const SCENARIOS: Scenario[] = [
  new SimpleNavigationScenario(),
  new FormInteractionScenario(),
  new SpaNavigationScenario(),
  new MultiPageCrawlScenario(),
  new FileDownloadScenario(),
  new ConcurrentSessionsScenario(),
  new LongRunningSessionScenario(),
];

export function getAllScenarios(): Scenario[] {
  return [...SCENARIOS];
}

export function getScenario(name: string): Scenario {
  const scenario = SCENARIOS.find(s => s.name === name);
  if (!scenario) {
    throw new Error(
      `Unknown scenario: "${name}". Available: ${SCENARIOS.map(s => s.name).join(', ')}`
    );
  }
  return scenario;
}

export function getScenarioNames(): string[] {
  return SCENARIOS.map(s => s.name);
}
