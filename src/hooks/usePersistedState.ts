"use client";

import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { loadFromStorage, saveToStorage, waitForStorageInit } from "@/storage/storage";

/**
 * Options for usePersistedState hook
 */
export interface PersistedStateOptions<T> {
  /** Optional migration function to transform loaded data */
  migrate?: (data: T) => T;
  /** Optional callback after data is loaded */
  onLoad?: (data: T) => void;
  /** Whether to skip saving on initial load (default: true) */
  skipInitialSave?: boolean;
}

/**
 * Return type for usePersistedState hook
 */
export type PersistedStateResult<T> = [
  /** Current state value */
  state: T,
  /** State setter function */
  setState: Dispatch<SetStateAction<T>>,
  /** Whether data has been loaded from storage */
  isLoaded: boolean,
];

/**
 * Hook for managing state that persists to storage.
 * Handles the common pattern of:
 * 1. Waiting for storage initialization
 * 2. Loading data from storage
 * 3. Optionally migrating data
 * 4. Auto-saving on state changes
 *
 * @param storageKey - Key to use for storage
 * @param defaultValue - Default value if nothing is stored
 * @param options - Optional configuration
 *
 * @example
 * // Basic usage
 * const [todos, setTodos, isLoaded] = usePersistedState<Todo[]>(
 *   STORAGE_KEYS.TODOS,
 *   []
 * );
 *
 * @example
 * // With migration
 * const [settings, setSettings, isLoaded] = usePersistedState<Settings>(
 *   STORAGE_KEYS.SETTINGS,
 *   defaultSettings,
 *   { migrate: migrateSettings }
 * );
 */
export function usePersistedState<T>(
  storageKey: string,
  defaultValue: T,
  options: PersistedStateOptions<T> = {}
): PersistedStateResult<T> {
  const { migrate, onLoad, skipInitialSave = true } = options;

  const [state, setState] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Track the last saved state to avoid unnecessary saves
  const lastSavedState = useRef<T | null>(null);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      await waitForStorageInit();

      const loadedData = await loadFromStorage<T>(storageKey, defaultValue);
      const migratedData = migrate ? migrate(loadedData) : loadedData;

      // Store as last saved to avoid re-saving on initial load
      if (skipInitialSave) {
        lastSavedState.current = migratedData;
      }

      setState(migratedData);
      setIsLoaded(true);

      if (onLoad) {
        onLoad(migratedData);
      }
    };

    // A rejection here would otherwise go unobserved and isLoaded would stay
    // false forever, leaving the caller stuck on its loading state.
    loadData().catch((error) => {
      console.error(`Failed to load ${storageKey}:`, error);
      setIsLoaded(true);
    });
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save data to storage whenever state changes
  useEffect(() => {
    // Skip saving if not loaded yet
    if (!isLoaded) return;

    // Skip saving if state hasn't actually changed from last saved
    if (lastSavedState.current === state) return;

    saveToStorage(storageKey, state)
      .then(() => {
        lastSavedState.current = state;
      })
      .catch((error) => {
        console.error(`Failed to save ${storageKey}:`, error);
      });
  }, [state, isLoaded, storageKey]);

  return [state, setState, isLoaded];
}

