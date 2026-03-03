import type { BrowserProvider } from '../types/provider.js';
import type { BenchmarkMode } from '../types/config.js';
import { BrowserbaseProvider } from './browserbase-provider.js';
import { KernelProvider } from './kernel-provider.js';

const PROVIDERS: Record<string, (mode: BenchmarkMode) => BrowserProvider> = {
  browserbase: (mode) => new BrowserbaseProvider(mode),
  kernel: (mode) => new KernelProvider(mode),
};

export function createProvider(name: string, mode: BenchmarkMode = 'raw'): BrowserProvider {
  const factory = PROVIDERS[name];
  if (!factory) {
    throw new Error(`Unknown provider: "${name}". Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return factory(mode);
}

export function getAvailableProviders(): string[] {
  return Object.keys(PROVIDERS);
}

export { BrowserbaseProvider } from './browserbase-provider.js';
export { KernelProvider } from './kernel-provider.js';
export { BaseProvider } from './base-provider.js';
