/**
 * Storage initialization and auto-detection
 * Handles automatic IndexedDB detection with localStorage fallback
 * and data migration from localStorage to IndexedDB
 */

import { StorageAdapter, setStorageAdapter, createIndexedDBAdapter, STORAGE_KEYS } from "./storage";

// Global promise to track initialization
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

/**
 * Wait for storage to be initialized
 * This should be called before any storage operations
 */
export async function waitForStorageInit(): Promise<void> {
  if (isInitialized) {
    return;
  }
  if (initializationPromise) {
    await initializationPromise;
  }
}

// Check if IndexedDB is available and working
async function isIndexedDBAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return false;
  }

  try {
    // Test if IndexedDB actually works (Safari private mode blocks it)
    const testDB = "doit-test-db";
    return new Promise((resolve) => {
      const request = indexedDB.open(testDB, 1);

      request.onerror = () => {
        resolve(false);
      };

      request.onsuccess = () => {
        const db = request.result;
        db.close();
        // Clean up test database
        indexedDB.deleteDatabase(testDB);
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("test")) {
          db.createObjectStore("test");
        }
      };

      // Timeout after 1 second if no response
      setTimeout(() => {
        resolve(false);
      }, 1000);
    });
  } catch (error) {
    console.warn("IndexedDB availability check failed:", error);
    return false;
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

// Migrate data from localStorage to IndexedDB
async function migrateToIndexedDB(adapter: StorageAdapter): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    let migratedCount = 0;

    for (const key of keys) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          await adapter.setItem(key, value);
          migratedCount++;
        }
      } catch (error) {
        console.error(`Failed to migrate key ${key}:`, error);
      }
    }

    // Set a flag to indicate migration is complete
    await adapter.setItem("doit-migrated-to-indexeddb", "true");

    // Clear localStorage after successful migration to prevent re-migration
    for (const key of keys) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to clear localStorage key ${key}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to migrate to IndexedDB:", error);
    throw error;
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
 * 4. If localStorage has data, keep using it even if IndexedDB is available
 */
export async function initializeStorage(): Promise<{
  adapter: StorageAdapter;
  usingIndexedDB: boolean;
  migrated: boolean;
}> {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return {
      adapter: null as any,
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
      adapter: null as any, // Will use default LocalStorageAdapter
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
      await migrateToIndexedDB(indexedDBAdapter);

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
      adapter: null as any, // Will use default LocalStorageAdapter
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
