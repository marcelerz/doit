import { readFileSync } from "fs";
import { join } from "path";

/**
 * public/sw.js runs in a worker context, so no other suite here loads it.
 * These assertions guard the lifecycle contract the update UI depends on.
 */
const source = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");

/** Source with comments removed, so prose about an API is not mistaken for a call. */
const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** The body of a top-level `self.addEventListener("<name>", ...)` handler. */
function handlerBody(name: string): string {
  const start = code.indexOf(`self.addEventListener("${name}"`);
  expect(start).toBeGreaterThan(-1);
  const next = code.indexOf("self.addEventListener(", start + 1);
  return code.slice(start, next === -1 ? undefined : next);
}

describe("service worker lifecycle", () => {
  it("does not activate itself during install", () => {
    // skipWaiting() here meant a new worker never entered the waiting state,
    // so registration.waiting stayed null and applyUpdate -- guarded on
    // exactly that -- silently did nothing. The update toast's button had
    // never worked.
    expect(handlerBody("install")).not.toContain("skipWaiting");
  });

  it("still activates on request, which is what the update button sends", () => {
    const message = handlerBody("message");
    expect(message).toContain("SKIP_WAITING");
    expect(message).toContain("skipWaiting");
  });

  it("claims clients on activate, so the new worker controls open pages", () => {
    expect(handlerBody("activate")).toContain("clients.claim");
  });

  it("versions its cache name, so activate can drop the previous one", () => {
    expect(code).toMatch(/const CACHE_NAME\s*=/);
  });
});
