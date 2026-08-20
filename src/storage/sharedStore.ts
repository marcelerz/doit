"use client";

import { useSyncExternalStore } from "react";
import { loadFromStorage, saveToStorage, waitForStorageInit } from "@/storage/storage";

/**
 * A module-level store for a single storage key, shared by every caller.
 *
 * Two problems this exists to solve:
 *
 * 1. Each hook that needed settings kept its own `useState` copy and loaded the
 *    key in its own mount effect, with only one of them ever writing. Toggling
 *    a feature off in the settings UI therefore did not remove its tab until a
 *    reload, because the page's copy never heard about the change.
 *
 * 2. Nothing coordinated browser tabs. Every hook rewrote its whole collection
 *    on any change, so two tabs on the same origin silently overwrote each
 *    other's work. A BroadcastChannel ping makes the other tabs re-read.
 *
 * Writes are coalesced: state changes fire far more often than they need to be
 * persisted, and each one serialised the entire collection.
 */

const CHANNEL_NAME = "doit-store";
const DEFAULT_WRITE_DELAY_MS = 300;

interface BroadcastMessage {
  key: string;
  /** Identifies the sender so it can ignore its own messages. */
  origin: string;
}

// One channel for the whole app rather than one per store.
let channel: BroadcastChannel | null = null;
const originId = `${Date.now()}-${performance.now()}`;
const channelListeners = new Map<string, () => void>();

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (channel === null) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const message = event.data;
      if (!message || message.origin === originId) return;
      channelListeners.get(message.key)?.();
    };
  }
  return channel;
}

export interface SharedStore<T> {
  /** Subscribe to the value. Every caller sees the same one. */
  use(): T;
  /** Subscribe outside React. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Whether the initial load from storage has completed. */
  useIsLoaded(): boolean;
  get(): T;
  set(next: T | ((previous: T) => T)): void;
  /** Load from storage once. Safe to call from many mounts. */
  hydrate(): Promise<void>;
  /** Flush any pending coalesced write immediately. */
  flush(): Promise<void>;
  /** Test seam: drop state so the next hydrate() re-reads. */
  reset(): void;
}

export interface SharedStoreOptions<T> {
  /** Transform loaded data, e.g. to run migrations. */
  migrate?: (loaded: T) => T;
  /** Milliseconds to coalesce writes over. */
  writeDelayMs?: number;
  /** Called after every successful persist. */
  onPersisted?: (value: T) => void;
}

export function createSharedStore<T>(
  storageKey: string,
  defaultValue: T,
  options: SharedStoreOptions<T> = {}
): SharedStore<T> {
  const { migrate, writeDelayMs = DEFAULT_WRITE_DELAY_MS, onPersisted } = options;

  let value = defaultValue;
  let loaded = false;
  let hydrating: Promise<void> | null = null;
  let pendingWrite: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<void> = Promise.resolve();

  const subscribers = new Set<() => void>();
  const notify = () => subscribers.forEach((listener) => listener());

  const subscribe = (listener: () => void) => {
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  };

  const persistNow = (): Promise<void> => {
    const snapshot = value;
    inFlight = saveToStorage(storageKey, snapshot)
      .then((ok) => {
        if (ok) {
          onPersisted?.(snapshot);
          getChannel()?.postMessage({ key: storageKey, origin: originId } satisfies BroadcastMessage);
        }
      })
      .catch((error) => {
        console.error(`Failed to save ${storageKey}:`, error);
      });
    return inFlight;
  };

  const schedulePersist = () => {
    if (pendingWrite !== null) clearTimeout(pendingWrite);
    pendingWrite = setTimeout(() => {
      pendingWrite = null;
      void persistNow();
    }, writeDelayMs);
  };

  const applyExternalChange = async () => {
    const loadedValue = await loadFromStorage<T>(storageKey, defaultValue);
    value = migrate ? migrate(loadedValue) : loadedValue;
    notify();
  };

  channelListeners.set(storageKey, () => {
    void applyExternalChange().catch((error) => {
      console.error(`Failed to apply external change for ${storageKey}:`, error);
    });
  });

  // Flush before the tab goes away, so a coalesced write is never lost.
  if (typeof window !== "undefined") {
    const flushOnHide = () => {
      if (pendingWrite !== null) {
        clearTimeout(pendingWrite);
        pendingWrite = null;
        void persistNow();
      }
    };
    window.addEventListener("pagehide", flushOnHide);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushOnHide();
    });
  }

  const store: SharedStore<T> = {
    subscribe,
    use() {
      // getServerSnapshot returns the default so static export prerender works.
      return useSyncExternalStore(
        subscribe,
        () => value,
        () => defaultValue
      );
    },
    useIsLoaded() {
      return useSyncExternalStore(
        subscribe,
        () => loaded,
        () => false
      );
    },
    get: () => value,
    set(next) {
      const resolved =
        typeof next === "function" ? (next as (previous: T) => T)(value) : next;
      if (Object.is(resolved, value)) return;
      value = resolved;
      notify();
      schedulePersist();
    },
    hydrate() {
      if (hydrating !== null) return hydrating;
      hydrating = (async () => {
        try {
          await waitForStorageInit();
          const loadedValue = await loadFromStorage<T>(storageKey, defaultValue);
          value = migrate ? migrate(loadedValue) : loadedValue;
        } catch (error) {
          console.error(`Failed to load ${storageKey}:`, error);
        } finally {
          loaded = true;
          notify();
        }
      })();
      return hydrating;
    },
    async flush() {
      if (pendingWrite !== null) {
        clearTimeout(pendingWrite);
        pendingWrite = null;
        await persistNow();
      }
      await inFlight;
    },
    reset() {
      value = defaultValue;
      loaded = false;
      hydrating = null;
      if (pendingWrite !== null) {
        clearTimeout(pendingWrite);
        pendingWrite = null;
      }
      notify();
    },
  };

  return store;
}
