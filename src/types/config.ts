export type BenchmarkMode = 'raw' | 'default';

export interface BenchmarkConfig {
  providers: string[];
  scenarios: string[];
  iterations: number;
  warmupIterations: number;
  concurrency: number;
  timeout: number;
  outputDir: string;
  generateHtml: boolean;
  listScenarios: boolean;
  verbose: boolean;
  mode: BenchmarkMode;
}

export interface CliOptions {
  providers?: string;
  scenarios?: string;
  iterations?: string;
  warmup?: string;
  concurrency?: string;
  timeout?: string;
  output?: string;
  html?: boolean;
  listScenarios?: boolean;
  verbose?: boolean;
  mode?: string;
}
