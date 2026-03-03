import Kernel from '@onkernel/sdk';
import { BaseProvider, type PlatformSession } from './base-provider.js';
import type { ProviderFeatures } from '../types/provider.js';
import type { BenchmarkMode } from '../types/config.js';
import { logger } from '../utils/logger.js';

export class KernelProvider extends BaseProvider {
  readonly name = 'kernel';
  private client: Kernel;

  constructor(mode: BenchmarkMode = 'raw') {
    super(mode);
    const apiKey = process.env.KERNEL_API_KEY;
    if (!apiKey) throw new Error('KERNEL_API_KEY is required');
    this.client = new Kernel({ apiKey });
  }

  protected async createPlatformSession(): Promise<PlatformSession> {
    const browser = await this.client.browsers.create({ headless: true });
    return {
      cdpUrl: browser.cdp_ws_url,
      platformSessionId: browser.session_id,
    };
  }

  protected async destroyPlatformSession(platformSessionId: string): Promise<void> {
    try {
      await this.client.browsers.deleteByID(platformSessionId);
    } catch {
      logger.debug(`kernel session ${platformSessionId} may already be deleted`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const browser = await this.client.browsers.create({ headless: true });
      await this.client.browsers.deleteByID(browser.session_id);
      return true;
    } catch (err) {
      logger.error(`Kernel health check failed: ${err}`);
      return false;
    }
  }

  getEnabledFeatures(): ProviderFeatures {
    // Kernel does not offer these features regardless of mode
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
