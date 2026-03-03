import type { Browser, Page } from 'playwright-core';

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

export interface BrowserProvider {
  readonly name: string;
  createSession(): Promise<BrowserSession>;
  createSessionWithTimings?(): Promise<SessionWithTimings>;
  destroySession(session: BrowserSession): Promise<void>;
  healthCheck(): Promise<boolean>;
}
