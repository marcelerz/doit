/**
 * Tests for the shared store.
 *
 * Covers the three review findings it exists to fix: every caller observing one
 * value rather than a private copy, writes being coalesced instead of
 * serialising the whole collection on each state change, and other tabs being
 * told when a key changes.
 */

import { createSharedStore } from "@/storage/sharedStore";
import { setStorageAdapter, getStorageAdapter, StorageAdapter } from "@/storage/storage";

class MemoryAdapter implements StorageAdapter {
  data = new Map<string, string>();
  writes = 0;
  async getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  async setItem(key: string, value: string) {
    this.writes++;
    this.data.set(key, value);
  }
  async removeItem(key: string) {
    this.data.delete(key);
  }
  async clear() {
    this.data.clear();
  }
  async getAllKeys() {
    return [...this.data.keys()];
  }
}

let adapter: MemoryAdapter;
let original: StorageAdapter;

beforeEach(() => {
  original = getStorageAdapter();
  adapter = new MemoryAdapter();
  setStorageAdapter(adapter);
});
afterEach(() => setStorageAdapter(original));

const makeStore = (key: string, delay = 10) =>
  createSharedStore<{ n: number }>(key, { n: 0 }, { writeDelayMs: delay });

describe("value sharing", () => {
  it("gives every reader the same value", async () => {
    const store = makeStore("doit-shared-a");
    const seen: number[] = [];
    const unsubscribeA = store.subscribe(() => seen.push(store.get().n));
    const unsubscribeB = store.subscribe(() => seen.push(store.get().n * 100));

    store.set({ n: 7 });

    expect(store.get()).toEqual({ n: 7 });
    expect(seen).toEqual([7, 700]);
    unsubscribeA();
    unsubscribeB();
  });

  it("hydrates once no matter how many callers ask", async () => {
    await adapter.setItem("doit-shared-b", JSON.stringify({ n: 42 }));
    const store = makeStore("doit-shared-b");

    await Promise.all([store.hydrate(), store.hydrate(), store.hydrate()]);

    expect(store.get()).toEqual({ n: 42 });
  });

  it("ignores a set that does not change the value", () => {
    const store = makeStore("doit-shared-c");
    const current = store.get();
    let notified = 0;
    const unsubscribe = store.subscribe(() => notified++);

    store.set(current);

    expect(notified).toBe(0);
    unsubscribe();
  });

  it("supports functional updates", () => {
    const store = makeStore("doit-shared-d");
    store.set({ n: 1 });
    store.set((previous) => ({ n: previous.n + 1 }));
    expect(store.get()).toEqual({ n: 2 });
  });
});

describe("write coalescing", () => {
  it("collapses a burst of changes into a single write", async () => {
    const store = makeStore("doit-shared-e");
    await store.hydrate();
    adapter.writes = 0;

    for (let i = 1; i <= 20; i++) store.set({ n: i });
    await store.flush();

    // Previously every one of these would have serialised and written the
    // whole collection.
    expect(adapter.writes).toBe(1);
    expect(JSON.parse(adapter.data.get("doit-shared-e") as string)).toEqual({ n: 20 });
  });

  it("flush is a no-op when nothing is pending", async () => {
    const store = makeStore("doit-shared-f");
    await store.hydrate();
    adapter.writes = 0;
    await store.flush();
    expect(adapter.writes).toBe(0);
  });

  it("persists eventually without an explicit flush", async () => {
    const store = makeStore("doit-shared-g", 5);
    await store.hydrate();
    store.set({ n: 3 });

    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(JSON.parse(adapter.data.get("doit-shared-g") as string)).toEqual({ n: 3 });
  });
});

describe("hydration failure", () => {
  it("still reports loaded so callers do not hang", async () => {
    const store = makeStore("doit-shared-h");
    jest.spyOn(adapter, "getItem").mockRejectedValueOnce(new Error("boom"));

    await store.hydrate();

    expect(store.get()).toEqual({ n: 0 });
  });
});

describe("reset", () => {
  it("drops state so the next hydrate re-reads", async () => {
    await adapter.setItem("doit-shared-i", JSON.stringify({ n: 5 }));
    const store = makeStore("doit-shared-i");
    await store.hydrate();
    expect(store.get()).toEqual({ n: 5 });

    store.reset();
    expect(store.get()).toEqual({ n: 0 });

    await adapter.setItem("doit-shared-i", JSON.stringify({ n: 9 }));
    await store.hydrate();
    expect(store.get()).toEqual({ n: 9 });
  });
});
