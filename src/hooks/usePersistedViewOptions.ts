"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromStorage, saveToStorage } from "@/storage/storage";

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
  defaults: T
): [options: T, setOptions: (updates: Partial<T>) => void, isLoaded: boolean] {
  const [options, setState] = useState<T>(defaults);
  const [isLoaded, setIsLoaded] = useState(false);

  // Defaults are typically an inline literal, so a ref keeps the load effect
  // from re-running on every render.
  const defaultsRef = useRef(defaults);

  useEffect(() => {
    let cancelled = false;
    loadFromStorage<Partial<T>>(storageKey, {})
      .then((saved) => {
        if (cancelled) return;
        setState({ ...defaultsRef.current, ...saved });
      })
      .catch((error) => {
        console.error(`Failed to load view options for ${storageKey}:`, error);
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    // Skip the initial render, or the defaults would overwrite what is stored
    // before the load has landed.
    if (!isLoaded) return;
    saveToStorage(storageKey, options).catch((error) => {
      console.error(`Failed to save view options for ${storageKey}:`, error);
    });
  }, [storageKey, options, isLoaded]);

  const setOptions = useCallback((updates: Partial<T>) => {
    setState((previous) => ({ ...previous, ...updates }));
  }, []);

  return [options, setOptions, isLoaded];
}
