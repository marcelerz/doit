"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadFromStorage,
  saveToStorage,
  waitForStorageInit,
} from "@/storage/storage";

/**
 * Per-view options (search text, filters, toggles) persisted to storage.
 *
 * Every view hand-rolled this: a `useState` per option, an effect that loads
 * the key and copies each field across one `if (saved.x !== undefined)` at a
 * time, an `optionsLoaded` flag, and a second effect that writes the whole
 * object back. Nine copies, identical apart from the storage key.
 *
 * Loading is one-shot and merges over the defaults, so a key written by an
 * older build that lacks newer fields still works.
 */
export function usePersistedViewOptions<T extends object>(
  storageKey: string,
  defaults: T,
): [options: T, setOptions: (updates: Partial<T>) => void, isLoaded: boolean] {
  const [options, setState] = useState<T>(defaults);
  const [isLoaded, setIsLoaded] = useState(false);

  // Defaults are typically an inline literal, so a ref keeps the load effect
  // from re-running on every render.
  const defaultsRef = useRef(defaults);

  // Updates made before the stored value lands. The load merges over the
  // defaults and would otherwise discard them, and awaiting initialization
  // below makes that window longer, not shorter.
  const pendingRef = useRef<Partial<T>>({});
  const isLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    // The adapter is only the right one once initialization has resolved.
    // Reading before that hits the module default, LocalStorageAdapter, which
    // migrateToIndexedDB has already emptied -- so the load returned nothing,
    // the defaults were applied, and the save effect below wrote them straight
    // over the stored options. That happened on every page load, not rarely.
    waitForStorageInit()
      .then(() => loadFromStorage<Partial<T>>(storageKey, {}))
      .then((saved) => {
        if (cancelled) return;
        setState({ ...defaultsRef.current, ...saved, ...pendingRef.current });
      })
      .catch((error) => {
        console.error(`Failed to load view options for ${storageKey}:`, error);
      })
      .finally(() => {
        if (cancelled) return;
        pendingRef.current = {};
        isLoadedRef.current = true;
        setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    // Skip the initial render, or the defaults would overwrite what is stored
    // before the load has landed.
    if (!isLoaded) return;
    saveToStorage(storageKey, options);
  }, [storageKey, options, isLoaded]);

  const setOptions = useCallback((updates: Partial<T>) => {
    if (!isLoadedRef.current) {
      pendingRef.current = { ...pendingRef.current, ...updates };
    }
    setState((previous) => ({ ...previous, ...updates }));
  }, []);

  return [options, setOptions, isLoaded];
}
