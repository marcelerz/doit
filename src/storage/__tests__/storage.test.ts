/**
 * Tests for the generic storage helpers.
 *
 * Regression coverage for two silent-failure paths found in review:
 * a stored literal "null" was returned to callers as `null` instead of the
 * default value, and write failures (notably QuotaExceededError) produced no
 * signal any caller could act on.
 */

import {
  loadFromStorage,
  saveToStorage,
  setStorageAdapter,
  getStorageAdapter,
  onStorageWriteError,
  StorageAdapter,
  StorageWriteFailure,
} from "@/storage/storage";

class FakeAdapter implements StorageAdapter {
  private data = new Map<string, string>();
  public failOnSet: unknown = null;

  async getItem(key: string): Promise<string | null> {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  async setItem(key: string, value: string): Promise<void> {
    if (this.failOnSet !== null) throw this.failOnSet;
    this.data.set(key, value);
  }
  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  }
  async clear(): Promise<void> {
    this.data.clear();
  }
  async getAllKeys(): Promise<string[]> {
    return [...this.data.keys()];
  }
  seed(key: string, raw: string): void {
    this.data.set(key, raw);
  }
}

let adapter: FakeAdapter;
let originalAdapter: StorageAdapter;

beforeEach(() => {
  originalAdapter = getStorageAdapter();
  adapter = new FakeAdapter();
  setStorageAdapter(adapter);
});

afterEach(() => {
  setStorageAdapter(originalAdapter);
});

describe("loadFromStorage", () => {
  it("returns the stored value when it is valid", async () => {
    adapter.seed("doit-thing", JSON.stringify({ a: 1 }));
    await expect(loadFromStorage("doit-thing", { a: 0 })).resolves.toEqual({ a: 1 });
  });

  it("returns the default when nothing is stored", async () => {
    await expect(loadFromStorage("doit-missing", { a: 0 })).resolves.toEqual({ a: 0 });
  });

  it('returns the default for a stored literal "null" rather than null', async () => {
    // Previously this handed callers `null`, which migrateSettings then
    // dereferenced, throwing during bootstrap and bricking the app.
    adapter.seed("doit-null", "null");
    await expect(loadFromStorage("doit-null", { a: 0 })).resolves.toEqual({ a: 0 });
  });

  it("returns the default for malformed JSON", async () => {
    adapter.seed("doit-bad", "{not json");
    await expect(loadFromStorage("doit-bad", { a: 0 })).resolves.toEqual({ a: 0 });
  });

  it("preserves falsy values that are legitimately stored", async () => {
    adapter.seed("doit-zero", "0");
    await expect(loadFromStorage("doit-zero", 42)).resolves.toBe(0);
    adapter.seed("doit-empty", "[]");
    await expect(loadFromStorage("doit-empty", [1])).resolves.toEqual([]);
  });
});

describe("saveToStorage failure reporting", () => {
  it("returns true and stores on success", async () => {
    await expect(saveToStorage("doit-ok", { a: 1 })).resolves.toBe(true);
    await expect(adapter.getItem("doit-ok")).resolves.toBe('{"a":1}');
  });

  it("notifies listeners when a write fails", async () => {
    const seen: StorageWriteFailure[] = [];
    const unsubscribe = onStorageWriteError((f) => seen.push(f));
    adapter.failOnSet = new Error("disk on fire");

    await expect(saveToStorage("doit-fail", { a: 1 })).resolves.toBe(false);

    expect(seen).toHaveLength(1);
    expect(seen[0].key).toBe("doit-fail");
    expect(seen[0].isQuotaExceeded).toBe(false);
    unsubscribe();
  });

  it("flags quota exhaustion specifically", async () => {
    const seen: StorageWriteFailure[] = [];
    const unsubscribe = onStorageWriteError((f) => seen.push(f));
    adapter.failOnSet = new Error("The quota has been exceeded.");

    await saveToStorage("doit-quota", { a: 1 });

    expect(seen[0].isQuotaExceeded).toBe(true);
    unsubscribe();
  });

  it("stops notifying after unsubscribe", async () => {
    const seen: StorageWriteFailure[] = [];
    const unsubscribe = onStorageWriteError((f) => seen.push(f));
    unsubscribe();
    adapter.failOnSet = new Error("nope");

    await saveToStorage("doit-fail", { a: 1 });

    expect(seen).toHaveLength(0);
  });

  it("keeps notifying other listeners when one throws", async () => {
    const seen: string[] = [];
    const bad = onStorageWriteError(() => {
      throw new Error("listener blew up");
    });
    const good = onStorageWriteError((f) => seen.push(f.key));
    adapter.failOnSet = new Error("nope");

    await saveToStorage("doit-fail", { a: 1 });

    expect(seen).toEqual(["doit-fail"]);
    bad();
    good();
  });
});
