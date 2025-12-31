/**
 * Storage abstraction layer
 * Provides a unified interface for data persistence that can be easily swapped out
 * for different storage mechanisms (localStorage, IndexedDB, API, etc.)
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear?(): Promise<void>;
  getAllKeys?(): Promise<string[]>;
}

class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error("Failed to get all keys:", error);
      return [];
    }
  }
}

// IndexedDB adapter implementation
class IndexedDBAdapter implements StorageAdapter {
  private dbName = "doit-db";
  private storeName = "keyvalue";
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result ?? null);
      });
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as string[]);
      });
    } catch (error) {
      console.error("Failed to get all keys:", error);
      return [];
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

// Create IndexedDB adapter instance
export function createIndexedDBAdapter(): StorageAdapter {
  return new IndexedDBAdapter();
}

// Create localStorage adapter instance
export function createLocalStorageAdapter(): StorageAdapter {
  return new LocalStorageAdapter();
}

// Storage keys - centralized registry of all storage keys
export const STORAGE_KEYS = {
  TODOS: "doit-todos",
  PEOPLE: "doit-people",
  PROJECTS: "doit-projects",
  SPRINTS: "doit-sprints",
  SETTINGS: "doit-settings",
  VERSION: "doit-version",
  VIEW_PRESETS: "doit-view-presets",
  VIEW_OPTIONS: "doit-view-options",
  GANTT_VIEW_OPTIONS: "doit-gantt-view-options",
  CALENDAR_VIEW_OPTIONS: "doit-calendar-view-options",
  KANBAN_VIEW_OPTIONS: "doit-kanban-view-options",
  TIME_REPORT_OPTIONS: "doit-time-report-options",
  PEOPLE_VIEW_OPTIONS: "doit-people-view-options",
  PROJECTS_VIEW_OPTIONS: "doit-projects-view-options",
  SPRINTS_VIEW_OPTIONS: "doit-sprints-view-options",
  UI_OPTIONS: "doit-ui-options",
  BACKUP_SETTINGS: "doit-backup-settings",
  TEMPLATES: "doit-templates",
  SEARCH_HISTORY: "doit-search-history",
  SELECTION_HISTORY: "doit-selection-history",
  TUTORIAL_PREFERENCES: "doit-tutorial-preferences",
} as const;

// Generic storage helpers that handle both sync and async adapters
export async function loadFromStorage<T>(key: string, defaultValue: T): Promise<T> {
  const stored = await storageAdapter.getItem(key);
  if (!stored) return defaultValue;

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Failed to parse stored data for ${key}:`, error);
    return defaultValue;
  }
}

export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  try {
    await storageAdapter.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save data for ${key}:`, error);
  }
}
