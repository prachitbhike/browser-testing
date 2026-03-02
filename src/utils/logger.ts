import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function timestamp(): string {
  return chalk.gray(new Date().toISOString().substring(11, 23));
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.log(`${timestamp()} ${chalk.gray('DBG')} ${message}`, ...args);
    }
  },

  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.log(`${timestamp()} ${chalk.blue('INF')} ${message}`, ...args);
    }
  },

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(`${timestamp()} ${chalk.yellow('WRN')} ${message}`, ...args);
    }
  },

  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(`${timestamp()} ${chalk.red('ERR')} ${message}`, ...args);
    }
  },

  success(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.log(`${timestamp()} ${chalk.green('OK ')} ${message}`, ...args);
    }
  },

  scenario(name: string, message: string): void {
    if (shouldLog('info')) {
      console.log(`${timestamp()} ${chalk.magenta('SCN')} ${chalk.bold(name)} ${message}`);
    }
  },

  provider(name: string, message: string): void {
    if (shouldLog('info')) {
      console.log(`${timestamp()} ${chalk.cyan('PRV')} ${chalk.bold(name)} ${message}`);
    }
  },

  metric(name: string, value: number, unit: string): void {
    if (shouldLog('debug')) {
      console.log(`${timestamp()} ${chalk.gray('MET')} ${name}: ${chalk.yellow(value.toFixed(2))}${unit}`);
    }
  },
};
