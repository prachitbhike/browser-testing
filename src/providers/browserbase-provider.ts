import Browserbase from '@browserbasehq/sdk';
import { BaseProvider, type PlatformSession } from './base-provider.js';
import { logger } from '../utils/logger.js';

export class BrowserbaseProvider extends BaseProvider {
  readonly name = 'browserbase';
  private client: Browserbase;
  private projectId: string;

  constructor() {
    super();
    const apiKey = process.env.BROWSERBASE_API_KEY;
    if (!apiKey) throw new Error('BROWSERBASE_API_KEY is required');
    this.projectId = process.env.BROWSERBASE_PROJECT_ID || '';
    if (!this.projectId) throw new Error('BROWSERBASE_PROJECT_ID is required');
    this.client = new Browserbase({ apiKey });
  }

  protected async createPlatformSession(): Promise<PlatformSession> {
    const session = await this.client.sessions.create({
      projectId: this.projectId,
      region: 'us-east-1',
      browserSettings: {
        logSession: false,
        recordSession: false,
        solveCaptchas: false,
      },
    });
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
      const session = await this.client.sessions.create({
        projectId: this.projectId,
        region: 'us-east-1',
        browserSettings: {
          logSession: false,
          recordSession: false,
          solveCaptchas: false,
        },
      });
      await this.client.sessions.update(session.id, {
        status: 'REQUEST_RELEASE',
      });
      return true;
    } catch (err) {
      logger.error(`Browserbase health check failed: ${err}`);
      return false;
    }
  }
}
