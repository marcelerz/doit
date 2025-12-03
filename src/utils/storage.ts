/**
 * Storage abstraction layer
 * Provides a unified interface for data persistence that can be easily swapped out
 * for different storage mechanisms (localStorage, IndexedDB, API, etc.)
 */

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  }
}

// Default storage adapter - can be swapped for different implementations
let storageAdapter: StorageAdapter = new LocalStorageAdapter();

export function setStorageAdapter(adapter: StorageAdapter) {
  storageAdapter = adapter;
}

export function getStorageAdapter(): StorageAdapter {
  return storageAdapter;
}

// Storage keys
export const STORAGE_KEYS = {
  TODOS: "doit-todos",
  PEOPLE: "doit-people",
  PROJECTS: "doit-projects",
  SETTINGS: "doit-settings",
  VERSION: "doit-version",
} as const;

// Generic storage helpers
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  const stored = storageAdapter.getItem(key);
  if (!stored) return defaultValue;

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Failed to parse stored data for ${key}:`, error);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    storageAdapter.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save data for ${key}:`, error);
  }
}

export function removeFromStorage(key: string): void {
  storageAdapter.removeItem(key);
}
