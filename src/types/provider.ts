import type { Browser, Page } from 'playwright-core';

export interface BrowserSession {
  browser: Browser;
  page: Page;
  platformSessionId: string;
  providerName: string;
  createdAt: number;
}

export interface BrowserProvider {
  readonly name: string;
  createSession(): Promise<BrowserSession>;
  destroySession(session: BrowserSession): Promise<void>;
  healthCheck(): Promise<boolean>;
}
