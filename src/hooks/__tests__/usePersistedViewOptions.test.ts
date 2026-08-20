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

  it("keeps a stable setter identity across renders", async () => {
    const { result, rerender } = renderHook(() => usePersistedViewOptions("doit-vo-g", defaults));
    const first = result.current[1];
    rerender();
    expect(result.current[1]).toBe(first);
  });
});
