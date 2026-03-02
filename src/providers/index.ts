import type { BrowserProvider } from '../types/provider.js';
import { BrowserbaseProvider } from './browserbase-provider.js';
import { KernelProvider } from './kernel-provider.js';

const PROVIDERS: Record<string, () => BrowserProvider> = {
  browserbase: () => new BrowserbaseProvider(),
  kernel: () => new KernelProvider(),
};

export function createProvider(name: string): BrowserProvider {
  const factory = PROVIDERS[name];
  if (!factory) {
    throw new Error(`Unknown provider: "${name}". Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return factory();
}

export function getAvailableProviders(): string[] {
  return Object.keys(PROVIDERS);
}

export { BrowserbaseProvider } from './browserbase-provider.js';
export { KernelProvider } from './kernel-provider.js';
export { BaseProvider } from './base-provider.js';
