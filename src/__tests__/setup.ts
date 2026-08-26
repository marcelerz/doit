/**
 * Jest setup file to provide polyfills and global test configuration.
 */

// Polyfill structuredClone for jsdom environment.
//
// Guarded, and on any supported Node it never fires -- which matters, because
// the JSON round-trip below is not an equivalent implementation: it destroys
// Date objects and drops undefined. If it ever does fire, models returning
// "immutable copies" would quietly change shape.
if (typeof structuredClone === "undefined") {
  global.structuredClone = <T>(value: T): T => {
    return JSON.parse(JSON.stringify(value));
  };
}
