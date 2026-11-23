/**
 * @jest-environment jsdom
 */

import { createLogger } from "@/utils/logger";
import { DEBUG_STORAGE_KEY, INTERNAL_STORAGE_KEYS } from "@/storage/keys";

const LEVELS = ["debug", "info", "warn", "error"] as const;

function spyOnConsole() {
  return {
    debug: jest.spyOn(console, "debug").mockImplementation(() => {}),
    info: jest.spyOn(console, "info").mockImplementation(() => {}),
    warn: jest.spyOn(console, "warn").mockImplementation(() => {}),
    error: jest.spyOn(console, "error").mockImplementation(() => {}),
  };
}

function inProduction() {
  jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: "production" });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("createLogger", () => {
  it.each(LEVELS)("prefixes %s with the scope and passes the arguments through", (level) => {
    const output = spyOnConsole();
    const error = new Error("boom");

    createLogger("storage")[level]("Failed to save:", error);

    expect(output[level]).toHaveBeenCalledTimes(1);
    expect(output[level]).toHaveBeenCalledWith("[doit:storage]", "Failed to save:", error);
  });

  it("keeps scopes apart, so identical messages can be told from each other", () => {
    const output = spyOnConsole();

    createLogger("backup").error("Failed to create backup:");
    createLogger("useBackups").error("Failed to create backup:");

    expect(output.error.mock.calls.map((call) => call[0])).toEqual(["[doit:backup]", "[doit:useBackups]"]);
  });

  describe("in a production build", () => {
    it("stays quiet on debug and info", () => {
      inProduction();
      const output = spyOnConsole();
      const log = createLogger("storage");

      log.debug("trace");
      log.info("note");

      expect(output.debug).not.toHaveBeenCalled();
      expect(output.info).not.toHaveBeenCalled();
    });

    it("still prints warnings and errors", () => {
      inProduction();
      const output = spyOnConsole();
      const log = createLogger("storage");

      log.warn("careful");
      log.error("broken");

      expect(output.warn).toHaveBeenCalledWith("[doit:storage]", "careful");
      expect(output.error).toHaveBeenCalledWith("[doit:storage]", "broken");
    });

    it("prints debug and info once the debug key is set, without a reload", () => {
      inProduction();
      const output = spyOnConsole();
      const log = createLogger("storage");

      log.debug("before");
      localStorage.setItem(DEBUG_STORAGE_KEY, "true");
      log.debug("after");
      log.info("note");

      expect(output.debug).toHaveBeenCalledTimes(1);
      expect(output.debug).toHaveBeenCalledWith("[doit:storage]", "after");
      expect(output.info).toHaveBeenCalledWith("[doit:storage]", "note");
    });

    it("treats any other value of the debug key as off", () => {
      inProduction();
      const output = spyOnConsole();
      localStorage.setItem(DEBUG_STORAGE_KEY, "false");

      createLogger("storage").debug("trace");

      expect(output.debug).not.toHaveBeenCalled();
    });

    it("stays quiet, and does not throw, when storage is blocked", () => {
      inProduction();
      const output = spyOnConsole();
      jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("denied", "SecurityError");
      });

      expect(() => createLogger("storage").debug("trace")).not.toThrow();
      expect(output.debug).not.toHaveBeenCalled();
    });
  });

  describe("warnOnce", () => {
    it("warns the first time a key is seen and not again", () => {
      const output = spyOnConsole();
      const log = createLogger("storage");

      log.warnOnce("quota", "Storage is almost full");
      log.warnOnce("quota", "Storage is almost full");
      log.warnOnce("probe", "IndexedDB probe timed out");

      expect(output.warn.mock.calls).toEqual([
        ["[doit:storage]", "Storage is almost full"],
        ["[doit:storage]", "IndexedDB probe timed out"],
      ]);
    });

    it("remembers keys per logger", () => {
      const output = spyOnConsole();

      createLogger("storage").warnOnce("quota", "full");
      createLogger("backup").warnOnce("quota", "full");

      expect(output.warn).toHaveBeenCalledTimes(2);
    });
  });

  it("keeps its debug key out of backups and storage migration", () => {
    expect(INTERNAL_STORAGE_KEYS.has(DEBUG_STORAGE_KEY)).toBe(true);
  });
});
