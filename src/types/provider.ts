import type { Browser, Page } from 'playwright-core';
import type { BenchmarkMode } from './config.js';

export interface BrowserSession {
  browser: Browser;
  page: Page;
  platformSessionId: string;
  providerName: string;
  createdAt: number;
}

export interface SessionTimings {
  platformApiTime: number;
  cdpConnectTime: number;
  contextInitTime: number;
  totalTime: number;
}

export interface SessionWithTimings {
  session: BrowserSession;
  timings: SessionTimings;
}

export interface ProviderFeatures {
  sessionRecording: boolean;
  captchaSolving: boolean;
  sessionLogging: boolean;
  advancedStealth: boolean;
  adBlocking: boolean;
  proxy: boolean;
}

export interface BrowserProvider {
  readonly name: string;
  readonly mode: BenchmarkMode;
  createSession(): Promise<BrowserSession>;
  createSessionWithTimings?(): Promise<SessionWithTimings>;
  destroySession(session: BrowserSession): Promise<void>;
  healthCheck(): Promise<boolean>;
  getEnabledFeatures(): ProviderFeatures;
}
