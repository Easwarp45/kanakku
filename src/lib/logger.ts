/**
 * Production-safe logger utility.
 * In development: all levels are printed to console.
 * In production: only errors are printed; debug/log/warn are no-ops (tree-shaken by Vite).
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]): void => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },
  /** Always logged — even in production */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
  /** Debug is only for development */
  debug: (...args: unknown[]): void => {
    if (isDev) console.debug(...args);
  },
};
