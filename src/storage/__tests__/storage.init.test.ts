/**
 * @jest-environment jsdom
 */

/**
 * Storage start-up, both migrations and the IndexedDB adapter.
 *
 * storage.test.ts covers loadFromStorage and saveToStorage against a fake
 * adapter. Everything that decides *which* adapter the app runs on -- and
 * moves the user's data between the two -- had no tests. A mistake there
 * loses data, so this suite pins what is right today before batch 2A changes
 * the code.
 *
 * Where today's behaviour is a known defect it is not asserted. Those cases
 * are `it.todo` entries naming the backlog unit that fixes them; the fix turns
 * each into its reproducer.
 */

import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";

type StorageModule = typeof import("@/storage/storage");

const DB_NAME = "doit-db";
const STORE_NAME = "keyvalue";
const MIGRATED_FLAG = "doit-migrated-to-indexeddb";

let storage: StorageModule;

/** Reads straight from the database, bypassing the adapter under test. */
function readFromIndexedDB(key: string): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE_NAME);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db.close();
        resolve(request.result as string | undefined);
      };
    };
  });
}

function setNavigatorStorage(value: Partial<StorageManager> | undefined) {
  Object.defineProperty(navigator, "storage", { configurable: true, value });
}

/** An open() request that reports failure, as Safari Private Mode does. */
function failingOpen(): IDBOpenDBRequest {
  const request = { error: new Error("open refused") } as unknown as IDBOpenDBRequest;
  setTimeout(() => request.onerror?.(new Event("error")), 0);
  return request;
}

beforeEach(async () => {
  // storage.ts keeps the active adapter and the initialisation promise in
  // module state, so every test gets a fresh copy of the module, an empty
  // database and an empty localStorage.
  jest.resetModules();
  globalThis.indexedDB = new IDBFactory();
  localStorage.clear();
  setNavigatorStorage(undefined);
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
  storage = await import("@/storage/storage");
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("LocalStorageAdapter", () => {
  it("stores, lists and removes values", async () => {
    const adapter = storage.createLocalStorageAdapter();

    await adapter.setItem("doit-todos", "[1]");
    await adapter.setItem("doit-notes", "[2]");

    expect(await adapter.getItem("doit-todos")).toBe("[1]");
    expect((await adapter.getAllKeys()).sort()).toEqual(["doit-notes", "doit-todos"]);

    await adapter.removeItem("doit-todos");

    expect(await adapter.getItem("doit-todos")).toBeNull();
    expect(localStorage.getItem("doit-notes")).toBe("[2]");
  });

  it("reports a missing key as null", async () => {
    expect(await storage.createLocalStorageAdapter().getItem("doit-todos")).toBeNull();
  });

  it("rejects a write the browser refuses", async () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    await expect(storage.createLocalStorageAdapter().setItem("doit-todos", "[]")).rejects.toThrow("full");
  });

  it("rejects a removal the browser refuses", async () => {
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("denied");
    });

    await expect(storage.createLocalStorageAdapter().removeItem("doit-todos")).rejects.toThrow("denied");
  });

  it("removes only this app's keys on clear", async () => {
    // localStorage belongs to the origin, not to the app. On GitHub Pages
    // that origin is shared with every other project of the same account.
    localStorage.setItem("doit-todos", "[1]");
    localStorage.setItem("doit-backup-1700000000000", "{}");
    localStorage.setItem("other-app", "keep");

    await storage.createLocalStorageAdapter().clear();

    expect(Object.keys(localStorage)).toEqual(["other-app"]);
    expect(localStorage.getItem("other-app")).toBe("keep");
  });

  it.todo("tells a failed read apart from a missing key (U0137)");
});

describe("IndexedDBAdapter", () => {
  it("stores, lists and removes values", async () => {
    const adapter = storage.createIndexedDBAdapter();

    await adapter.setItem("doit-todos", "[1]");
    await adapter.setItem("doit-notes", "[2]");

    expect(await adapter.getItem("doit-todos")).toBe("[1]");
    expect((await adapter.getAllKeys()).sort()).toEqual(["doit-notes", "doit-todos"]);

    await adapter.removeItem("doit-todos");

    expect(await adapter.getItem("doit-todos")).toBeNull();
    expect(await adapter.getItem("doit-notes")).toBe("[2]");
  });

  it("reports a missing key as null", async () => {
    expect(await storage.createIndexedDBAdapter().getItem("doit-todos")).toBeNull();
  });

  it("writes to the doit-db database, where a second adapter finds the data", async () => {
    await storage.createIndexedDBAdapter().setItem("doit-todos", "[1]");

    expect(await readFromIndexedDB("doit-todos")).toBe("[1]");
    expect(await storage.createIndexedDBAdapter().getItem("doit-todos")).toBe("[1]");
  });

  it("opens the database once for calls made together", async () => {
    const open = jest.spyOn(indexedDB, "open");
    const adapter = storage.createIndexedDBAdapter();

    await Promise.all([
      adapter.setItem("doit-todos", "[1]"),
      adapter.setItem("doit-notes", "[2]"),
      adapter.getItem("doit-people"),
    ]);

    expect(open).toHaveBeenCalledTimes(1);
    expect(await adapter.getItem("doit-notes")).toBe("[2]");
  });

  it("empties only its own store on clear", async () => {
    const adapter = storage.createIndexedDBAdapter();
    await adapter.setItem("doit-todos", "[1]");
    localStorage.setItem("other-app", "keep");

    await adapter.clear();

    expect(await adapter.getAllKeys()).toEqual([]);
    expect(localStorage.getItem("other-app")).toBe("keep");
  });

  it("rejects a write whose transaction aborts", async () => {
    // A transaction can abort without the request settling: a version change
    // from another tab, a quota abort, eviction. The write must reject rather
    // than hang, or the app never leaves its loading state.
    const adapter = storage.createIndexedDBAdapter();
    await adapter.setItem("doit-todos", "[1]");
    const realPut = IDBObjectStore.prototype.put;
    jest.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (
      this: IDBObjectStore,
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      const request = realPut.apply(this, args);
      this.transaction.abort();
      return request;
    });

    await expect(adapter.setItem("doit-todos", "[2]")).rejects.toMatchObject({ name: "AbortError" });

    jest.restoreAllMocks();
    expect(await adapter.getItem("doit-todos")).toBe("[1]");
  });

  it("rejects when the database cannot be opened, and opens it on the next call", async () => {
    const adapter = storage.createIndexedDBAdapter();
    const open = jest.spyOn(indexedDB, "open").mockImplementationOnce(failingOpen);

    await expect(adapter.setItem("doit-todos", "[1]")).rejects.toThrow("open refused");

    open.mockRestore();
    await adapter.setItem("doit-todos", "[1]");
    expect(await adapter.getItem("doit-todos")).toBe("[1]");
  });

  it.todo("tells a failed read apart from a missing key (U0137)");
});

describe("isIndexedDBAvailable", () => {
  it("is true when a database can be opened, and removes its probe database", async () => {
    expect(await storage.isIndexedDBAvailable()).toBe(true);

    // The probe answers as soon as the open succeeds; the delete it issues
    // finishes a moment later.
    await new Promise((resolve) => setTimeout(resolve, 10));
    const names = (await indexedDB.databases()).map((db) => db.name);
    expect(names).not.toContain("doit-test-availability");
  });

  it("is false when the browser has no IndexedDB", async () => {
    // @ts-expect-error -- simulating a browser without the API
    delete globalThis.indexedDB;

    expect(await storage.isIndexedDBAvailable()).toBe(false);
  });

  it("is false when opening a database fails", async () => {
    jest.spyOn(indexedDB, "open").mockImplementation(failingOpen);

    expect(await storage.isIndexedDBAvailable()).toBe(false);
  });

  it("gives up after ten seconds when the open never settles", async () => {
    jest.useFakeTimers();
    jest.spyOn(indexedDB, "open").mockImplementation(() => ({}) as IDBOpenDBRequest);

    const result = storage.isIndexedDBAvailable();
    let settled = false;
    void result.then(() => {
      settled = true;
    });

    await jest.advanceTimersByTimeAsync(9_999);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    expect(await result).toBe(false);
  });
});

describe("getStorageType", () => {
  it("names the adapter the app is running on", () => {
    expect(storage.getStorageType()).toBe("localStorage");

    storage.setStorageAdapter(storage.createIndexedDBAdapter());

    expect(storage.getStorageType()).toBe("indexedDB");
  });

  it.todo("still names the adapter in a minified build (U0084)");
});

describe("persistent storage", () => {
  it("reports no support when the browser has no storage manager", async () => {
    expect(await storage.checkPersistentStorage()).toEqual({ isPersisted: false, supported: false });
    expect(await storage.requestPersistentStorage()).toEqual({ isPersisted: false, supported: false });
  });

  it("reports whether storage is persisted", async () => {
    setNavigatorStorage({ persisted: jest.fn().mockResolvedValue(true) });

    expect(await storage.checkPersistentStorage()).toEqual({ isPersisted: true, supported: true });
  });

  it("does not ask again when storage is already persisted", async () => {
    const persist = jest.fn();
    setNavigatorStorage({ persisted: jest.fn().mockResolvedValue(true), persist });

    expect(await storage.requestPersistentStorage()).toEqual({ isPersisted: true, supported: true });
    expect(persist).not.toHaveBeenCalled();
  });

  it.each([true, false])("returns the browser's answer when it asks (granted: %s)", async (granted) => {
    setNavigatorStorage({
      persisted: jest.fn().mockResolvedValue(false),
      persist: jest.fn().mockResolvedValue(granted),
    });

    expect(await storage.requestPersistentStorage()).toEqual({ isPersisted: granted, supported: true });
  });

  it("reports no support when the browser throws", async () => {
    const failing = jest.fn().mockRejectedValue(new Error("blocked"));
    setNavigatorStorage({ persisted: failing, persist: failing });

    expect(await storage.checkPersistentStorage()).toEqual({ isPersisted: false, supported: false });
    expect(await storage.requestPersistentStorage()).toEqual({ isPersisted: false, supported: false });
  });
});

describe("estimateStorageQuota", () => {
  it("bills localStorage in UTF-16 code units and ignores other apps' keys", async () => {
    localStorage.setItem("doit-a", "xyz");
    localStorage.setItem("other-app", "a much longer value that must not count");

    const quota = await storage.estimateStorageQuota();

    // (3 characters + 1) * 2 bytes for the value, plus 6 * 2 for the key.
    expect(quota).toEqual({
      available: storage.LOCAL_STORAGE_BUDGET_BYTES,
      used: 20,
      detectionMethod: "fallback",
    });
  });

  it("keeps the 5MB budget for localStorage whatever the origin quota is", async () => {
    setNavigatorStorage({ estimate: jest.fn().mockResolvedValue({ quota: 10 ** 9 }) });

    const quota = await storage.estimateStorageQuota("localStorage");

    expect(quota.available).toBe(storage.LOCAL_STORAGE_BUDGET_BYTES);
    expect(quota.detectionMethod).toBe("api");
  });

  it("uses the origin quota for IndexedDB and bills values in UTF-8 bytes", async () => {
    setNavigatorStorage({ estimate: jest.fn().mockResolvedValue({ quota: 10 ** 9 }) });
    const adapter = storage.createIndexedDBAdapter();
    storage.setStorageAdapter(adapter);
    await adapter.setItem("doit-a", "é!");
    await adapter.setItem("other-app", "ignored");

    const quota = await storage.estimateStorageQuota();

    // "é" is two bytes in UTF-8, "!" is one. Keys are not billed here.
    expect(quota).toEqual({ available: 10 ** 9, used: 3, detectionMethod: "api" });
  });

  it("falls back to 50MB for IndexedDB when the browser cannot estimate", async () => {
    setNavigatorStorage({ estimate: jest.fn().mockRejectedValue(new Error("blocked")) });

    const quota = await storage.estimateStorageQuota("indexedDB");

    expect(quota.available).toBe(50 * 1024 * 1024);
    expect(quota.detectionMethod).toBe("fallback");
  });
});

describe("migrateToIndexedDB", () => {
  it("moves registered keys, unregistered doit- keys and backups", async () => {
    localStorage.setItem("doit-todos", "[1]");
    localStorage.setItem("doit-settings", "{}");
    // Persisted for a long time without being in the registry.
    localStorage.setItem("doit-some-unregistered-key", "kept");
    localStorage.setItem("doit-backup-1700000000000", '{"todos":[]}');

    const result = await storage.migrateToIndexedDB();

    expect(result.success).toBe(true);
    expect(await readFromIndexedDB("doit-todos")).toBe("[1]");
    expect(await readFromIndexedDB("doit-settings")).toBe("{}");
    expect(await readFromIndexedDB("doit-some-unregistered-key")).toBe("kept");
    expect(await readFromIndexedDB("doit-backup-1700000000000")).toBe('{"todos":[]}');
  });

  it("counts what it moved", async () => {
    localStorage.setItem("doit-todos", "[1]");
    localStorage.setItem("doit-settings", "{}");

    expect(await storage.migrateToIndexedDB()).toEqual({ success: true, migratedCount: 2 });
  });

  it.todo("counts each backup once (U0087)");

  it("marks the database as migrated and switches the app onto it", async () => {
    localStorage.setItem("doit-todos", "[1]");

    await storage.migrateToIndexedDB();

    expect(await readFromIndexedDB(MIGRATED_FLAG)).toBe("true");
    expect(storage.getStorageType()).toBe("indexedDB");
    expect(await storage.loadFromStorage("doit-todos", [])).toEqual([1]);
  });

  it("removes what it moved from localStorage and nothing else", async () => {
    localStorage.setItem("doit-todos", "[1]");
    localStorage.setItem("other-app", "keep");

    await storage.migrateToIndexedDB();

    expect(localStorage.getItem("doit-todos")).toBeNull();
    expect(localStorage.getItem("other-app")).toBe("keep");
    expect(await readFromIndexedDB("other-app")).toBeUndefined();
  });

  it("does not copy bookkeeping keys", async () => {
    localStorage.setItem("doit-todos", "[1]");
    localStorage.setItem("doit-test-availability", "x");

    await storage.migrateToIndexedDB();

    expect(await readFromIndexedDB("doit-test-availability")).toBeUndefined();
  });

  it("leaves everything in localStorage when a write fails", async () => {
    localStorage.setItem("doit-todos", "[1]");
    localStorage.setItem("doit-notes", "[2]");
    jest.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => {
      throw new Error("disk full");
    });

    const result = await storage.migrateToIndexedDB();

    expect(result.success).toBe(false);
    expect(result.migratedCount).toBe(0);
    expect(result.error).toContain("disk full");
    expect(localStorage.getItem("doit-todos")).toBe("[1]");
    expect(localStorage.getItem("doit-notes")).toBe("[2]");
    expect(storage.getStorageType()).toBe("localStorage");

    jest.restoreAllMocks();
    expect(await readFromIndexedDB(MIGRATED_FLAG)).toBeUndefined();
  });
});

describe("migrateToLocalStorage", () => {
  async function onIndexedDB(entries: Record<string, string>) {
    const adapter = storage.createIndexedDBAdapter();
    storage.setStorageAdapter(adapter);
    for (const [key, value] of Object.entries(entries)) {
      await adapter.setItem(key, value);
    }
  }

  it("copies registered keys and backups, then switches the app to localStorage", async () => {
    await onIndexedDB({
      "doit-todos": "[1]",
      "doit-settings": "{}",
      "doit-backup-1700000000000": '{"todos":[]}',
    });

    const result = await storage.migrateToLocalStorage();

    expect(result).toEqual({ success: true, migratedCount: 3 });
    expect(localStorage.getItem("doit-todos")).toBe("[1]");
    expect(localStorage.getItem("doit-settings")).toBe("{}");
    expect(localStorage.getItem("doit-backup-1700000000000")).toBe('{"todos":[]}');
    expect(storage.getStorageType()).toBe("localStorage");
    expect(await storage.loadFromStorage("doit-todos", [])).toEqual([1]);
  });

  it("reports failure and stays on IndexedDB when localStorage refuses a write", async () => {
    await onIndexedDB({ "doit-todos": "[1]" });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    const result = await storage.migrateToLocalStorage();

    expect(result.success).toBe(false);
    expect(result.migratedCount).toBe(0);
    expect(storage.getStorageType()).toBe("indexedDB");
  });

  it.todo("copies unregistered doit- keys as well (U0087)");
  it.todo("clears the migrated flag in IndexedDB, so the switch survives a reload (U0087)");
});

describe("clearAllAppData", () => {
  it("removes every doit- key from the active store and from localStorage", async () => {
    const adapter = storage.createIndexedDBAdapter();
    storage.setStorageAdapter(adapter);
    await adapter.setItem("doit-todos", "[1]");
    await adapter.setItem("doit-backup-1700000000000", "{}");
    await adapter.setItem(MIGRATED_FLAG, "true");
    localStorage.setItem("doit-settings", "{}");

    expect(await storage.clearAllAppData()).toBe(true);

    expect(await adapter.getAllKeys()).toEqual([]);
    expect(localStorage.getItem("doit-settings")).toBeNull();
  });

  it("leaves other apps' localStorage keys alone", async () => {
    // The app is served from a GitHub Pages origin that other projects share.
    localStorage.setItem("doit-todos", "[1]");
    localStorage.setItem("other-app", "keep");

    await storage.clearAllAppData();

    expect(localStorage.getItem("doit-todos")).toBeNull();
    expect(localStorage.getItem("other-app")).toBe("keep");
  });

  it("reports failure when the store cannot be cleared", async () => {
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("denied");
    });

    expect(await storage.clearAllAppData()).toBe(false);
  });
});

describe("initializeStorage", () => {
  it("stays on localStorage when IndexedDB is not available", async () => {
    localStorage.setItem("doit-todos", "[1]");
    jest.spyOn(indexedDB, "open").mockImplementation(failingOpen);

    const result = await storage.initializeStorage();

    expect(result.usingIndexedDB).toBe(false);
    expect(result.migrated).toBe(false);
    expect(storage.getStorageType()).toBe("localStorage");
    expect(localStorage.getItem("doit-todos")).toBe("[1]");
  });

  it("uses IndexedDB on a fresh profile", async () => {
    const result = await storage.initializeStorage();

    expect(result.usingIndexedDB).toBe(true);
    expect(result.migrated).toBe(false);
    expect(storage.getStorageType()).toBe("indexedDB");
  });

  it.todo("marks a fresh profile as migrated, so later localStorage data cannot overwrite it (U0088)");

  it("moves existing localStorage data into IndexedDB on first run", async () => {
    localStorage.setItem("doit-todos", "[1]");

    const result = await storage.initializeStorage();

    expect(result.usingIndexedDB).toBe(true);
    expect(result.migrated).toBe(true);
    expect(await storage.loadFromStorage("doit-todos", [])).toEqual([1]);
    expect(localStorage.getItem("doit-todos")).toBeNull();
  });

  it("stays on localStorage for the session when the move fails", async () => {
    // Switching anyway would point the app at half-copied data, and every
    // hook's auto-save would then write its empty state over the rest.
    localStorage.setItem("doit-todos", "[1]");
    jest.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => {
      throw new Error("disk full");
    });

    const result = await storage.initializeStorage();

    expect(result.usingIndexedDB).toBe(false);
    expect(result.migrated).toBe(false);
    expect(storage.getStorageType()).toBe("localStorage");
    expect(await storage.loadFromStorage("doit-todos", [])).toEqual([1]);

    jest.restoreAllMocks();
    // The flag is written only on success, so the next load tries again.
    expect(await readFromIndexedDB(MIGRATED_FLAG)).toBeUndefined();
  });

  it("uses IndexedDB without moving anything when it was migrated before", async () => {
    const seeded = storage.createIndexedDBAdapter();
    await seeded.setItem(MIGRATED_FLAG, "true");
    await seeded.setItem("doit-todos", "[1]");

    const result = await storage.initializeStorage();

    expect(result.usingIndexedDB).toBe(true);
    expect(result.migrated).toBe(true);
    expect(await storage.loadFromStorage("doit-todos", [])).toEqual([1]);
  });

  it("keeps the migrated data when localStorage still holds an older copy", async () => {
    const seeded = storage.createIndexedDBAdapter();
    await seeded.setItem(MIGRATED_FLAG, "true");
    await seeded.setItem("doit-todos", "[1]");
    localStorage.setItem("doit-todos", '["stale"]');

    const result = await storage.initializeStorage();

    expect(result.usingIndexedDB).toBe(true);
    expect(await storage.loadFromStorage("doit-todos", [])).toEqual([1]);
  });

  it.todo("keeps the settings copy the theme script reads when cleaning up localStorage (U0087)");
});

describe("initializeStorageClient", () => {
  it("makes waitForStorageInit resolve once the adapter is chosen", async () => {
    localStorage.setItem("doit-todos", "[1]");

    storage.initializeStorageClient();
    await storage.waitForStorageInit();

    expect(storage.getStorageType()).toBe("indexedDB");
    expect(await storage.loadFromStorage("doit-todos", [])).toEqual([1]);
  });

  it("starts initialisation when waitForStorageInit is called first", async () => {
    await storage.waitForStorageInit();

    expect(storage.getStorageType()).toBe("indexedDB");
  });

  it("initialises once, however often it is called", async () => {
    const open = jest.spyOn(indexedDB, "open");

    storage.initializeStorageClient();
    storage.initializeStorageClient();
    await storage.waitForStorageInit();
    const opensAfterFirstInit = open.mock.calls.length;

    storage.initializeStorageClient();
    await storage.waitForStorageInit();

    expect(open.mock.calls.length).toBe(opensAfterFirstInit);
  });

  it("asks the browser to keep the data once storage is ready", async () => {
    const persist = jest.fn().mockResolvedValue(true);
    setNavigatorStorage({ persisted: jest.fn().mockResolvedValue(false), persist });

    storage.initializeStorageClient();
    await storage.waitForStorageInit();

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it.todo("does not hold start-up back while the browser shows a persistence prompt (U0089)");
});
