import Browserbase from '@browserbasehq/sdk';
import { BaseProvider, type PlatformSession } from './base-provider.js';
import type { ProviderFeatures } from '../types/provider.js';
import type { BenchmarkMode } from '../types/config.js';
import { logger } from '../utils/logger.js';

export class BrowserbaseProvider extends BaseProvider {
  readonly name = 'browserbase';
  private client: Browserbase;
  private projectId: string;

  constructor(mode: BenchmarkMode = 'raw') {
    super(mode);
    const apiKey = process.env.BROWSERBASE_API_KEY;
    if (!apiKey) throw new Error('BROWSERBASE_API_KEY is required');
    this.projectId = process.env.BROWSERBASE_PROJECT_ID || '';
    if (!this.projectId) throw new Error('BROWSERBASE_PROJECT_ID is required');
    this.client = new Browserbase({ apiKey });
  }

  private getSessionCreateParams() {
    if (this.mode === 'default') {
      // Out-of-the-box: Browserbase defaults (recording, CAPTCHA, logging all on, default region)
      return {
        projectId: this.projectId,
      };
    }
    // Raw mode: stripped-down for pure infrastructure comparison
    return {
      projectId: this.projectId,
      region: 'us-east-1' as const,
      browserSettings: {
        logSession: false,
        recordSession: false,
        solveCaptchas: false,
      },
    };
  }

  protected async createPlatformSession(): Promise<PlatformSession> {
    const session = await this.client.sessions.create(this.getSessionCreateParams());
    return {
      cdpUrl: session.connectUrl!,
      platformSessionId: session.id,
    };
  }

  protected async destroyPlatformSession(platformSessionId: string): Promise<void> {
    try {
      await this.client.sessions.update(platformSessionId, {
        status: 'REQUEST_RELEASE',
      });
    } catch {
      logger.debug(`browserbase session ${platformSessionId} may already be released`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const session = await this.client.sessions.create(this.getSessionCreateParams());
      await this.client.sessions.update(session.id, {
        status: 'REQUEST_RELEASE',
      });
      return true;
    } catch (err) {
      logger.error(`Browserbase health check failed: ${err}`);
      return false;
    }
  }

  getEnabledFeatures(): ProviderFeatures {
    if (this.mode === 'default') {
      return {
        sessionRecording: true,
        captchaSolving: true,
        sessionLogging: true,
        advancedStealth: false,
        adBlocking: false,
        proxy: false,
      };
    }
    return {
      sessionRecording: false,
      captchaSolving: false,
      sessionLogging: false,
      advancedStealth: false,
      adBlocking: false,
      proxy: false,
    };
  }
}
