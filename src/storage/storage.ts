/**
 * Storage abstraction layer
 * Provides a unified interface for data persistence that can be easily swapped out
 * for different storage mechanisms (localStorage, IndexedDB, API, etc.)
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
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
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear storage:", error);
      throw error;
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
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    // If already opening, return the existing promise to avoid race condition
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        this.dbPromise = null; // Reset on error to allow retry
        reject(request.error);
      };
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

    return this.dbPromise;
  }

  /**
   * Close the IndexedDB connection to release resources
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
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
      throw error;
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
      throw error;
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
      throw error;
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

export async function saveToStorage<T>(key: string, value: T): Promise<boolean> {
  try {
    await storageAdapter.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save data for ${key}:`, error);
    return false;
  }
}

// Storage type detection
export type StorageType = "localStorage" | "indexedDB";

export function getStorageType(): StorageType {
  const adapter = getStorageAdapter();
  return adapter.constructor.name === "IndexedDBAdapter" ? "indexedDB" : "localStorage";
}

// Check if IndexedDB is available (handles Safari Private Mode)
export async function isIndexedDBAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return false;
  }
  try {
    const testDB = "doit-test-availability";
    return new Promise((resolve) => {
      let resolved = false;
      const request = indexedDB.open(testDB, 1);

      const resolveOnce = (value: boolean) => {
        if (!resolved) {
          resolved = true;
          resolve(value);
        }
      };

      request.onerror = () => resolveOnce(false);
      request.onsuccess = () => {
        request.result.close();
        indexedDB.deleteDatabase(testDB);
        resolveOnce(true);
      };

      // Timeout as fallback, but won't override if already resolved
      setTimeout(() => resolveOnce(false), 1000);
    });
  } catch {
    return false;
  }
}

// Storage quota estimation
export interface StorageQuotaInfo {
  available: number;
  used: number;
  detectionMethod: "api" | "fallback";
}

export async function estimateStorageQuota(type?: StorageType): Promise<StorageQuotaInfo> {
  const currentType = type || getStorageType();
  let available = 0;
  let detectionMethod: "api" | "fallback" = "fallback";

  try {
    // Try to get actual quota using StorageManager API
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota) {
        if (currentType === "indexedDB") {
          // For IndexedDB, use the full quota (usually much larger)
          available = estimate.quota;
        } else {
          // For localStorage, browsers typically allocate 5-10MB from the total quota
          available = Math.min(estimate.quota * 0.001, 10 * 1024 * 1024); // Max 10MB
        }
        detectionMethod = "api";
      }
    }
  } catch (error) {
    console.warn("Failed to estimate storage quota:", error);
  }

  // Fallback based on storage type
  if (available === 0) {
    if (currentType === "indexedDB") {
      available = 50 * 1024 * 1024; // 50MB conservative estimate for IndexedDB
    } else {
      available = 5 * 1024 * 1024; // 5MB conservative estimate for localStorage
    }
    detectionMethod = "fallback";
  }

  // Calculate used space
  let used = 0;
  const adapter = getStorageAdapter();
  const keys = await adapter.getAllKeys();
  for (const key of keys) {
    if (key && key.startsWith("doit-")) {
      try {
        const data = await adapter.getItem(key);
        if (data) {
          used += new Blob([data]).size;
        }
      } catch (error) {
        console.error(`Failed to get size for ${key}:`, error);
      }
    }
  }

  return { available, used, detectionMethod };
}

// Storage migration
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  error?: string;
}

export async function migrateToIndexedDB(): Promise<MigrationResult> {
  try {
    const indexedDBAdapter = createIndexedDBAdapter();
    const keys = Object.values(STORAGE_KEYS);
    const migratedKeys: string[] = [];
    let migratedCount = 0;

    // Phase 1: Copy all data to IndexedDB, tracking successfully migrated keys
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        await indexedDBAdapter.setItem(key, value);
        migratedKeys.push(key);
        migratedCount++;
      }
    }

    // Also migrate backup keys
    const localStorageKeys = Object.keys(localStorage).filter(
      (k) => k.startsWith("doit-backup-") && k !== "doit-backup-settings",
    );
    for (const key of localStorageKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        await indexedDBAdapter.setItem(key, value);
        migratedKeys.push(key);
        migratedCount++;
      }
    }

    // Phase 2: Mark as migrated BEFORE clearing localStorage
    // This ensures we can recover if clearing fails
    await indexedDBAdapter.setItem("doit-migrated-to-indexeddb", "true");

    // Phase 3: Switch to IndexedDB adapter
    setStorageAdapter(indexedDBAdapter);

    // Phase 4: Clear localStorage only for keys we successfully migrated
    for (const key of migratedKeys) {
      try {
        localStorage.removeItem(key);
      } catch (clearError) {
        // Log but don't fail - data is safely in IndexedDB
        console.warn(`Failed to clear localStorage key ${key}:`, clearError);
      }
    }

    return { success: true, migratedCount };
  } catch (error) {
    console.error("Migration to IndexedDB failed:", error);
    return { success: false, migratedCount: 0, error: String(error) };
  }
}

export async function migrateToLocalStorage(): Promise<MigrationResult> {
  try {
    const currentAdapter = getStorageAdapter();
    const keys = Object.values(STORAGE_KEYS);
    let migratedCount = 0;

    for (const key of keys) {
      const value = await currentAdapter.getItem(key);
      if (value) {
        localStorage.setItem(key, value);
        migratedCount++;
      }
    }

    // Also migrate backup keys
    const allKeys = await currentAdapter.getAllKeys();
    for (const key of allKeys) {
      if (key && key.startsWith("doit-backup-") && key !== "doit-backup-settings") {
        const value = await currentAdapter.getItem(key);
        if (value) {
          localStorage.setItem(key, value);
          migratedCount++;
        }
      }
    }

    // Switch to localStorage adapter
    const localStorageAdapter = createLocalStorageAdapter();
    setStorageAdapter(localStorageAdapter);

    // Remove migration flag
    localStorage.removeItem("doit-migrated-to-indexeddb");

    return { success: true, migratedCount };
  } catch (error) {
    console.error("Migration to localStorage failed:", error);
    return { success: false, migratedCount: 0, error: String(error) };
  }
}

// Clear all app data
export async function clearAllAppData(): Promise<boolean> {
  try {
    const adapter = getStorageAdapter();
    const keys = Object.values(STORAGE_KEYS);

    // Clear all doit-related data from current storage
    for (const key of keys) {
      await adapter.removeItem(key);
    }

    // Clear any backup keys and other doit- prefixed keys
    const allKeys = await adapter.getAllKeys();
    for (const key of allKeys) {
      if (key && key.startsWith("doit-")) {
        await adapter.removeItem(key);
      }
    }

    // Also clear from localStorage (to ensure complete cleanup if using IndexedDB)
    const localStorageKeys = Object.keys(localStorage).filter((k) => k.startsWith("doit-"));
    for (const key of localStorageKeys) {
      localStorage.removeItem(key);
    }

    return true;
  } catch (error) {
    console.error("Failed to clear all data:", error);
    return false;
  }
}

// ============================================================================
// Storage Initialization
// ============================================================================

// Global promise to track initialization
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

/**
 * Wait for storage to be initialized
 * This should be called before any storage operations
 * If initialization hasn't started yet, this will trigger it
 */
export async function waitForStorageInit(): Promise<void> {
  if (isInitialized) {
    return;
  }
  // If initialization hasn't started yet, start it now
  if (!initializationPromise) {
    initializeStorageClient();
  }
  if (initializationPromise) {
    await initializationPromise;
  }
}

// Check if localStorage has any app data
function hasLocalStorageData(): boolean {
  try {
    const keys = Object.values(STORAGE_KEYS);
    for (const key of keys) {
      if (localStorage.getItem(key)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Failed to check localStorage data:", error);
    return false;
  }
}

// Check if data has already been migrated to IndexedDB
async function isAlreadyMigrated(adapter: StorageAdapter): Promise<boolean> {
  try {
    const migrated = await adapter.getItem("doit-migrated-to-indexeddb");
    return migrated === "true";
  } catch (error) {
    console.error("Failed to check migration status:", error);
    return false;
  }
}

/**
 * Initialize storage with automatic detection and migration
 *
 * Strategy:
 * 1. Try to use IndexedDB if available
 * 2. If IndexedDB works and localStorage has data, migrate it
 * 3. If IndexedDB doesn't work, fall back to localStorage
 */
export async function initializeStorage(): Promise<{
  adapter: StorageAdapter;
  usingIndexedDB: boolean;
  migrated: boolean;
}> {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return {
      adapter: null as unknown as StorageAdapter,
      usingIndexedDB: false,
      migrated: false,
    };
  }

  // Check if localStorage already has data
  const hasLocalData = hasLocalStorageData();

  // Check if IndexedDB is available
  const indexedDBAvailable = await isIndexedDBAvailable();

  if (!indexedDBAvailable) {
    return {
      adapter: null as unknown as StorageAdapter, // Will use default LocalStorageAdapter
      usingIndexedDB: false,
      migrated: false,
    };
  }

  // IndexedDB is available
  try {
    const indexedDBAdapter = createIndexedDBAdapter();

    // Check if we've already migrated
    const alreadyMigrated = await isAlreadyMigrated(indexedDBAdapter);

    if (hasLocalData && !alreadyMigrated) {
      // Migrate from localStorage to IndexedDB
      await migrateToIndexedDB();

      setStorageAdapter(indexedDBAdapter);
      return {
        adapter: indexedDBAdapter,
        usingIndexedDB: true,
        migrated: true,
      };
    } else {
      // Use IndexedDB (either already migrated or no local data)
      setStorageAdapter(indexedDBAdapter);

      // If already migrated but localStorage still has data, clear it to prevent confusion
      if (alreadyMigrated && hasLocalData) {
        const keys = Object.values(STORAGE_KEYS);
        for (const key of keys) {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.error(`Failed to clear localStorage key ${key}:`, error);
          }
        }
      }

      return {
        adapter: indexedDBAdapter,
        usingIndexedDB: true,
        migrated: alreadyMigrated,
      };
    }
  } catch (error) {
    console.error("Failed to initialize IndexedDB, falling back to localStorage:", error);
    return {
      adapter: null as unknown as StorageAdapter, // Will use default LocalStorageAdapter
      usingIndexedDB: false,
      migrated: false,
    };
  }
}

/**
 * Initialize storage on the client side only
 * This should be called once when the app starts
 */
export function initializeStorageClient(): void {
  if (typeof window !== "undefined" && !initializationPromise) {
    initializationPromise = initializeStorage()
      .then(() => {
        isInitialized = true;
      })
      .catch((error) => {
        console.error("Failed to initialize storage:", error);
        isInitialized = true; // Mark as initialized even on error to prevent hanging
      });
  }
}
