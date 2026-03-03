import { chromium, type Browser, type Page } from 'playwright-core';
import type { BrowserProvider, BrowserSession, ProviderFeatures, SessionWithTimings } from '../types/provider.js';
import type { BenchmarkMode } from '../types/config.js';
import { Timer } from '../utils/timer.js';
import { logger } from '../utils/logger.js';
import { retry } from '../utils/retry.js';

export interface PlatformSession {
  cdpUrl: string;
  platformSessionId: string;
}

export abstract class BaseProvider implements BrowserProvider {
  abstract readonly name: string;
  readonly mode: BenchmarkMode;

  constructor(mode: BenchmarkMode = 'raw') {
    this.mode = mode;
  }

  protected abstract createPlatformSession(): Promise<PlatformSession>;
  protected abstract destroyPlatformSession(platformSessionId: string): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
  abstract getEnabledFeatures(): ProviderFeatures;

  async createSessionWithTimings(): Promise<SessionWithTimings> {
    const totalTimer = new Timer();
    totalTimer.start();

    // Phase 1: Platform API call
    const apiTimer = new Timer();
    apiTimer.start();
    const platformSession = await retry(
      () => this.createPlatformSession(),
      `${this.name}.createSession`,
    );
    const platformApiTime = apiTimer.stop();

    logger.debug(`${this.name} platform session created: ${platformSession.platformSessionId}`);

    // Phase 2: CDP connection
    const cdpTimer = new Timer();
    cdpTimer.start();
    const browser = await retry(
      () => chromium.connectOverCDP(platformSession.cdpUrl),
      `${this.name}.connectOverCDP`,
    );
    const cdpConnectTime = cdpTimer.stop();

    // Phase 3: Context/page initialization
    const ctxTimer = new Timer();
    ctxTimer.start();
    const contexts = browser.contexts();
    const context = contexts.length > 0 ? contexts[0] : await browser.newContext();
    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();
    // Set consistent viewport across providers for fair comparison
    await page.setViewportSize({ width: 1920, height: 1080 });
    const contextInitTime = ctxTimer.stop();

    const totalTime = totalTimer.stop();
    logger.debug(`${this.name} session ready in ${totalTime.toFixed(0)}ms`);

    return {
      session: {
        browser,
        page,
        platformSessionId: platformSession.platformSessionId,
        providerName: this.name,
        createdAt: Date.now(),
      },
      timings: {
        platformApiTime,
        cdpConnectTime,
        contextInitTime,
        totalTime,
      },
    };
  }

  async createSession(): Promise<BrowserSession> {
    const { session } = await this.createSessionWithTimings();
    return session;
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
