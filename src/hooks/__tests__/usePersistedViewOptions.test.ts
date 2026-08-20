/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { usePersistedViewOptions } from "../usePersistedViewOptions";
import {
  setStorageAdapter,
  getStorageAdapter,
  StorageAdapter,
} from "@/storage/storage";
import * as storage from "@/storage/storage";

class MemoryAdapter implements StorageAdapter {
  data = new Map<string, string>();
  async getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  async setItem(key: string, value: string) {
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

const defaults = { search: "", showArchived: false };

describe("usePersistedViewOptions", () => {
  it("starts on the defaults", () => {
    const { result } = renderHook(() => usePersistedViewOptions("doit-vo-a", defaults));
    expect(result.current[0]).toEqual(defaults);
  });

  it("restores what was stored", async () => {
    await adapter.setItem("doit-vo-b", JSON.stringify({ search: "abc", showArchived: true }));

    const { result } = renderHook(() => usePersistedViewOptions("doit-vo-b", defaults));

    await waitFor(() => expect(result.current[2]).toBe(true));
    expect(result.current[0]).toEqual({ search: "abc", showArchived: true });
  });

  it("merges stored values over the defaults, so a key from an older build still works", async () => {
    await adapter.setItem("doit-vo-c", JSON.stringify({ search: "only-this" }));

    const { result } = renderHook(() => usePersistedViewOptions("doit-vo-c", defaults));

    await waitFor(() => expect(result.current[2]).toBe(true));
    expect(result.current[0]).toEqual({ search: "only-this", showArchived: false });
  });

  it("persists an update", async () => {
    const { result } = renderHook(() => usePersistedViewOptions("doit-vo-d", defaults));
    await waitFor(() => expect(result.current[2]).toBe(true));

    act(() => result.current[1]({ search: "typed" }));

    await waitFor(() =>
      expect(JSON.parse(adapter.data.get("doit-vo-d") as string)).toEqual({
        search: "typed",
        showArchived: false,
      })
    );
  });

  it("merges partial updates rather than replacing the whole object", async () => {
    const { result } = renderHook(() => usePersistedViewOptions("doit-vo-e", defaults));
    await waitFor(() => expect(result.current[2]).toBe(true));

    act(() => result.current[1]({ search: "x" }));
    act(() => result.current[1]({ showArchived: true }));

    expect(result.current[0]).toEqual({ search: "x", showArchived: true });
  });

  it("does not write the defaults over stored data before the load lands", async () => {
    await adapter.setItem("doit-vo-f", JSON.stringify({ search: "precious", showArchived: true }));
    const spy = jest.spyOn(adapter, "setItem");

    const { result } = renderHook(() => usePersistedViewOptions("doit-vo-f", defaults));
    await waitFor(() => expect(result.current[2]).toBe(true));

    // Any write that happened must not have been the defaults.
    for (const call of spy.mock.calls) {
      expect(JSON.parse(call[1])).not.toEqual(defaults);
    }
    expect(result.current[0].search).toBe("precious");
  });

  it("waits for storage initialization before reading", async () => {
    // Until initializeStorage resolves, the module-level adapter is the
    // localStorage one. On an IndexedDB install the migration has already
    // emptied it, so an un-awaited read sees nothing and falls back to the
    // defaults -- which the save effect then writes over the real data.
    const installedByInit = new MemoryAdapter();
    await installedByInit.setItem("doit-vo-init", JSON.stringify({ search: "stored", showArchived: true }));

    let finishInit!: () => void;
    const init = new Promise<void>((resolve) => {
      finishInit = () => {
        setStorageAdapter(installedByInit);
        resolve();
      };
    });
    const waitSpy = jest.spyOn(storage, "waitForStorageInit").mockReturnValue(init);

    try {
      const { result } = renderHook(() => usePersistedViewOptions("doit-vo-init", defaults));
      expect(result.current[2]).toBe(false);

      await act(async () => {
        finishInit();
        await init;
      });
      await waitFor(() => expect(result.current[2]).toBe(true));

      expect(result.current[0]).toEqual({ search: "stored", showArchived: true });
    } finally {
      waitSpy.mockRestore();
    }
  });

  it("keeps an update made while the load is still in flight", async () => {
    await adapter.setItem("doit-vo-race", JSON.stringify({ search: "stored", showArchived: true }));

    let finishInit!: () => void;
    const init = new Promise<void>((resolve) => {
      finishInit = resolve;
    });
    const waitSpy = jest.spyOn(storage, "waitForStorageInit").mockReturnValue(init);

    try {
      const { result } = renderHook(() => usePersistedViewOptions("doit-vo-race", defaults));

      // The user changes something before the stored value has landed.
      act(() => result.current[1]({ search: "typed" }));

      await act(async () => {
        finishInit();
        await init;
      });
      await waitFor(() => expect(result.current[2]).toBe(true));

      // What they typed survives, and the stored value still merges underneath.
      expect(result.current[0].search).toBe("typed");
      expect(result.current[0].showArchived).toBe(true);
    } finally {
      waitSpy.mockRestore();
    }
  });

  it("keeps a stable setter identity across renders", async () => {
    const { result, rerender } = renderHook(() => usePersistedViewOptions("doit-vo-g", defaults));
    const first = result.current[1];
    rerender();
    expect(result.current[1]).toBe(first);
  });
});
