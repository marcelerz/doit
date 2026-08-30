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
  private isOpening = false;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    // If already opening, return the existing promise to avoid race condition
    if (this.dbPromise) return this.dbPromise;

    // Prevent concurrent open attempts using a flag
    if (this.isOpening) {
      // Wait a bit and retry - another open attempt is in progress
      await new Promise((resolve) => setTimeout(resolve, 50));
      return this.getDB();
    }

    this.isOpening = true;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        this.dbPromise = null; // Reset on error to allow retry
        this.isOpening = false;
        reject(request.error);
      };
      request.onsuccess = () => {
        this.db = request.result;
        this.isOpening = false;
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

  /**
   * Execute a callback within a transaction, handling common error patterns
   */
  private async withTransaction<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, mode);
      const store = transaction.objectStore(this.storeName);
      const request = operation(store);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as T);

      // A transaction can abort without the request ever settling - a
      // versionchange from another tab, an engine-level quota abort, or
      // storage eviction mid-transaction. Without these the promise stays
      // pending forever and the app never leaves its loading state.
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    });
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const result = await this.withTransaction<string | undefined>(
        "readonly",
        (store) => store.get(key)
      );
      return result ?? null;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.withTransaction<IDBValidKey>(
        "readwrite",
        (store) => store.put(value, key)
      );
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.withTransaction<undefined>(
        "readwrite",
        (store) => store.delete(key)
      );
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.withTransaction<undefined>(
        "readwrite",
        (store) => store.clear()
      );
    } catch (error) {
      console.error("Failed to clear storage:", error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await this.withTransaction<IDBValidKey[]>(
        "readonly",
        (store) => store.getAllKeys()
      ) as string[];
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

// Storage key prefix - all app data keys start with this
/**
 * localStorage budget in bytes.
 *
 * The spec'd minimum, and Safari's actual ceiling. Browsers do not expose this
 * separately from the origin quota, so a fixed conservative figure beats
 * scaling navigator.storage.estimate(), which reports something else entirely.
 */
export const LOCAL_STORAGE_BUDGET_BYTES = 5 * 1024 * 1024;

export const STORAGE_KEY_PREFIX = "doit-";

/** Keys under the doit- prefix that are bookkeeping, not user data. */
export const INTERNAL_STORAGE_KEYS = new Set([
  "doit-migrated-to-indexeddb",
  "doit-test-availability",
  "doit-db",
]);

// Backup key prefix - for auto-backup and manual backup storage
export const BACKUP_KEY_PREFIX = "doit-backup-";

// Storage keys - centralized registry of all storage keys
export const STORAGE_KEYS = {
  TODOS: "doit-todos",
  NOTES: "doit-notes",
  REVIEWS: "doit-reviews",
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
  NOTES_VIEW_OPTIONS: "doit-notes-view-options",
  REVIEWS_VIEW_OPTIONS: "doit-reviews-view-options",
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
  KANBAN_FILTER_PRESETS: "doit-kanban-filter-presets",
  NOTES_VIEW_PRESETS: "doit-notes-view-presets",
  NOTIFIED_TASKS: "doit-notified-tasks",
  FOCUS_SESSION: "doit-focus-session",
  FOCUS_SESSION_LOG: "doit-focus-sessions",
} as const;

/**
 * Details of a failed write, broadcast to anything listening.
 */
export interface StorageWriteFailure {
  key: string;
  error: unknown;
  /** True when the failure looks like the storage quota being exhausted. */
  isQuotaExceeded: boolean;
}

type StorageErrorListener = (failure: StorageWriteFailure) => void;
const storageErrorListeners = new Set<StorageErrorListener>();

/**
 * Subscribe to storage write failures.
 *
 * saveToStorage cannot throw without breaking its callers, so a silent
 * QuotaExceededError lost a whole session's work with no user-visible signal.
 * This is the channel that makes those failures observable.
 *
 * It resolves `false` rather than rejecting, and sharedStore reads that to
 * decide whether a write landed. Every other caller should simply ignore the
 * result: attaching `.catch` to it looks careful but can never run, because
 * the rejection it waits for does not happen.
 *
 * @returns an unsubscribe function
 */
export function onStorageWriteError(listener: StorageErrorListener): () => void {
  storageErrorListeners.add(listener);
  return () => storageErrorListeners.delete(listener);
}

function isQuotaError(error: unknown): boolean {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22
    );
  }
  return error instanceof Error && /quota/i.test(error.message);
}

// Generic storage helpers that handle both sync and async adapters
export async function loadFromStorage<T>(key: string, defaultValue: T): Promise<T> {
  const stored = await storageAdapter.getItem(key);
  if (!stored) return defaultValue;

  try {
    const parsed = JSON.parse(stored);
    // A stored literal "null" parses to null, which every caller then treats
    // as a valid value and dereferences. Fall back instead.
    return parsed === null || parsed === undefined ? defaultValue : parsed;
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
    const failure: StorageWriteFailure = { key, error, isQuotaExceeded: isQuotaError(error) };
    storageErrorListeners.forEach((listener) => {
      try {
        listener(failure);
      } catch (listenerError) {
        console.error("Storage error listener threw:", listenerError);
      }
    });
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

      // A cold PWA launch with a large database or a busy main thread can take
      // well over a second. Reporting false there silently ran the whole
      // session against empty localStorage - the user saw all their data gone.
      // The timeout exists only to stop a wedged open() hanging forever.
      setTimeout(() => {
        if (!resolved) {
          console.warn("IndexedDB availability probe timed out; falling back to localStorage");
        }
        resolveOnce(false);
      }, 10000);
    });
  } catch {
    return false;
  }
}

// Persistent storage status
export interface PersistentStorageInfo {
  isPersisted: boolean;
  supported: boolean;
}

/**
 * Check if storage is currently persisted
 */
export async function checkPersistentStorage(): Promise<PersistentStorageInfo> {
  if (typeof navigator === "undefined" || !navigator.storage || !navigator.storage.persisted) {
    return { isPersisted: false, supported: false };
  }

  try {
    const isPersisted = await navigator.storage.persisted();
    return { isPersisted, supported: true };
  } catch (error) {
    console.warn("Failed to check persistent storage status:", error);
    return { isPersisted: false, supported: false };
  }
}

/**
 * Request persistent storage from the browser
 * This prevents the browser from automatically clearing storage under pressure
 *
 * Note: This is automatically called on every page load during storage initialization.
 * All data is stored locally in the browser - there is no backend database.
 */
export async function requestPersistentStorage(): Promise<PersistentStorageInfo> {
  if (typeof navigator === "undefined" || !navigator.storage || !navigator.storage.persist) {
    console.log("Persistent storage API not supported in this browser");
    return { isPersisted: false, supported: false };
  }

  try {
    // Check if already persisted
    const alreadyPersisted = await navigator.storage.persisted();
    if (alreadyPersisted) {
      console.log("Storage is already persisted");
      return { isPersisted: true, supported: true };
    }

    // Request persistence
    const granted = await navigator.storage.persist();
    if (granted) {
      console.log("Persistent storage granted - data will not be cleared under storage pressure");
    } else {
      console.log(
        "Persistent storage not granted - browser may clear data under storage pressure. " +
          "Consider bookmarking or installing as PWA for better persistence.",
      );
    }
    return { isPersisted: granted, supported: true };
  } catch (error) {
    console.warn("Failed to request persistent storage:", error);
    return { isPersisted: false, supported: false };
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
          // navigator.storage.estimate() reports the *origin* quota, which
          // says nothing about the separate localStorage budget. Scaling it
          // produced a 10MB ceiling on any desktop, against a real Safari
          // limit of 5MB, so writes began failing at roughly 25% displayed.
          // The spec'd minimum is 5MB; treat that as the budget.
          available = LOCAL_STORAGE_BUDGET_BYTES;
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
      available = LOCAL_STORAGE_BUDGET_BYTES;
    }
    detectionMethod = "fallback";
  }

  // Calculate used space.
  //
  // localStorage bills UTF-16 code units - two bytes per character - while
  // Blob([data]).size counts UTF-8 bytes. Measuring the wrong unit understated
  // usage by roughly half, which is why the "Storage Almost Full" warning at
  // 80% was effectively unreachable before writes started failing.
  let used = 0;
  const adapter = getStorageAdapter();
  const keys = await adapter.getAllKeys();
  const measure =
    currentType === "localStorage"
      ? (data: string) => (data.length + 1) * 2
      : (data: string) => new Blob([data]).size;
  for (const key of keys) {
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      try {
        const data = await adapter.getItem(key);
        if (data) {
          used += measure(data) + (currentType === "localStorage" ? key.length * 2 : 0);
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
    // Scan by prefix rather than iterating the registry: two keys
    // (kanban filter presets, notes view presets) were persisted for a long
    // time without being registered, and were silently dropped on migration.
    const keys = Array.from(
      new Set([
        ...Object.values(STORAGE_KEYS),
        ...Object.keys(localStorage).filter(
          (k) => k.startsWith(STORAGE_KEY_PREFIX) && !INTERNAL_STORAGE_KEYS.has(k)
        ),
      ])
    );
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
      (k) => k.startsWith(BACKUP_KEY_PREFIX) && k !== STORAGE_KEYS.BACKUP_SETTINGS,
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
      if (key && key.startsWith(BACKUP_KEY_PREFIX) && key !== STORAGE_KEYS.BACKUP_SETTINGS) {
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
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
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
      // Migrate from localStorage to IndexedDB.
      const result = await migrateToIndexedDB();

      if (!result.success) {
        // Switching anyway would point the app at half-copied data, and every
        // hook's auto-save would then write its empty in-memory state over the
        // rest. Stay on localStorage for this session; the migration flag is
        // only written on success, so the next load retries.
        console.error("IndexedDB migration failed, staying on localStorage:", result.error);
        return {
          adapter: null as unknown as StorageAdapter,
          usingIndexedDB: false,
          migrated: false,
        };
      }

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
 *
 * Note: All data is stored locally in the browser - there is no backend database.
 * Persistent storage is requested on every page load to prevent data loss.
 */
export function initializeStorageClient(): void {
  if (typeof window !== "undefined" && !initializationPromise) {
    initializationPromise = initializeStorage()
      .then(async () => {
        isInitialized = true;

        // Request persistent storage on every page load
        // This helps ensure the browser won't clear our data under storage pressure
        await requestPersistentStorage();
      })
      .catch((error) => {
        console.error("Failed to initialize storage:", error);
        isInitialized = true; // Mark as initialized even on error to prevent hanging
      });
  }
}
