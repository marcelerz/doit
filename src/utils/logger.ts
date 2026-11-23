/**
 * Console logging with a scope and a debug gate.
 *
 * Every line is prefixed `[doit:<scope>]`, so the console shows which module
 * spoke -- several modules log the same sentence.
 *
 * - `warn` and `error` always print.
 * - `debug` and `info` print outside production builds. In production they
 *   print only after `localStorage.setItem("doit-debug", "true")`, which is
 *   how to get a trace from a deployed build without shipping one to everyone.
 *
 * There is nothing else here on purpose: no transports, no buffering, no
 * persistence.
 */

import { DEBUG_STORAGE_KEY } from "@/storage/keys";

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  /** Warns the first time `key` is seen on this logger and stays quiet after. */
  warnOnce: (key: string, ...args: unknown[]) => void;
}

/** Whether debug and info lines print. Checked per call, so the key works without a reload. */
function isDebugEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(DEBUG_STORAGE_KEY) === "true";
  } catch {
    // Storage can be blocked outright. Logging must never be what throws.
    return false;
  }
}

export function createLogger(scope: string): Logger {
  const prefix = `[doit:${scope}]`;
  const warned = new Set<string>();

  return {
    debug: (...args) => {
      if (isDebugEnabled()) console.debug(prefix, ...args);
    },
    info: (...args) => {
      if (isDebugEnabled()) console.info(prefix, ...args);
    },
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
    warnOnce: (key, ...args) => {
      if (warned.has(key)) return;
      warned.add(key);
      console.warn(prefix, ...args);
    },
  };
}
