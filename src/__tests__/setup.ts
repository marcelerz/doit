/**
 * Jest setup file to provide polyfills and global test configuration.
 */

// Polyfill structuredClone for jsdom environment
if (typeof structuredClone === "undefined") {
  global.structuredClone = <T>(value: T): T => {
    return JSON.parse(JSON.stringify(value));
  };
}
