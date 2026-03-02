import { chromium, type Browser, type Page } from 'playwright-core';
import type { BrowserProvider, BrowserSession } from '../types/provider.js';
import { Timer } from '../utils/timer.js';
import { logger } from '../utils/logger.js';
import { retry } from '../utils/retry.js';

export interface PlatformSession {
  cdpUrl: string;
  platformSessionId: string;
}

export abstract class BaseProvider implements BrowserProvider {
  abstract readonly name: string;

  protected abstract createPlatformSession(): Promise<PlatformSession>;
  protected abstract destroyPlatformSession(platformSessionId: string): Promise<void>;
  abstract healthCheck(): Promise<boolean>;

  async createSession(): Promise<BrowserSession> {
    const timer = new Timer();
    timer.start();

    const platformSession = await retry(
      () => this.createPlatformSession(),
      `${this.name}.createSession`,
    );

    logger.debug(`${this.name} platform session created: ${platformSession.platformSessionId}`);

    const browser = await retry(
      () => chromium.connectOverCDP(platformSession.cdpUrl),
      `${this.name}.connectOverCDP`,
    );

    const contexts = browser.contexts();
    const context = contexts.length > 0 ? contexts[0] : await browser.newContext();
    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();

    const elapsed = timer.stop();
    logger.debug(`${this.name} session ready in ${elapsed.toFixed(0)}ms`);

    return {
      browser,
      page,
      platformSessionId: platformSession.platformSessionId,
      providerName: this.name,
      createdAt: Date.now(),
    };
  }

  async destroySession(session: BrowserSession): Promise<void> {
    try {
      await session.browser.close();
    } catch {
      // Browser may already be closed
    }
    try {
      await this.destroyPlatformSession(session.platformSessionId);
    } catch (err) {
      logger.warn(`${this.name} failed to destroy platform session ${session.platformSessionId}: ${err}`);
    }
  }
}
