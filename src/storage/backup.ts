/**
 * Backup utilities and types
 *
 * Most backup functionality has been moved to useBackups hook for better co-location.
 * This file contains types, constants, and functions needed during app startup (before React hooks are available).
 */

import { STORAGE_KEYS, getStorageAdapter, loadFromStorage, saveToStorage } from "@/storage/storage";

// ============================================================================
// Types & Constants
// ============================================================================

export const BACKUP_KEY_PREFIX = "doit-backup-";

export interface BackupSettings {
  autoBackupEnabled: boolean;
  retentionDays: number;
  lastBackupDate: string | null; // ISO date string (YYYY-MM-DD)
}

export const defaultBackupSettings: BackupSettings = {
  autoBackupEnabled: true,
  retentionDays: 30,
  lastBackupDate: null,
};

export interface BackupData {
  timestamp: number;
  date: string; // ISO date string for display
  todos: string; // JSON stringified todos
  settings: string; // JSON stringified settings
  uploadedAt?: number; // Timestamp when this backup was uploaded (if imported)
  source?: "auto" | "manual" | "imported"; // How this backup was created
}

export interface BackupStats {
  count: number;
  totalSize: number;
  oldestDate: string | null;
  newestDate: string | null;
  lastAutoBackupDate: string | null;
}

// ============================================================================
// Startup/Migration Functions
// ============================================================================

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * Get backup settings from storage (async)
 */
async function loadBackupSettings(): Promise<BackupSettings> {
  return await loadFromStorage<BackupSettings>(STORAGE_KEYS.BACKUP_SETTINGS, defaultBackupSettings);
}

/**
 * Save backup settings to storage (async)
 */
async function saveBackupSettings(settings: BackupSettings): Promise<void> {
  await saveToStorage(STORAGE_KEYS.BACKUP_SETTINGS, settings);
}

/**
 * Get all backups, sorted by timestamp (newest first)
 */
async function getAllBackups(): Promise<BackupData[]> {
  const backups: BackupData[] = [];

  try {
    const adapter = getStorageAdapter();
    const allKeys = await adapter.getAllKeys();
    const keys = Array.isArray(allKeys) ? allKeys : [];

    for (const key of keys) {
      if (key && key.startsWith(BACKUP_KEY_PREFIX)) {
        const data = await adapter.getItem(key);
        const dataStr = typeof data === "string" ? data : null;
        if (dataStr) {
          try {
            const backup = JSON.parse(dataStr) as BackupData;
            if (backup.timestamp && !isNaN(backup.timestamp) && backup.timestamp > 0) {
              backups.push(backup);
            }
          } catch (error) {
            console.warn(`Failed to parse backup ${key}:`, error);
          }
        }
      }
    }

    backups.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to load backups:", error);
  }

  return backups;
}

/**
 * Normalize storage data to ensure it's a proper JSON string.
 * Handles cases where data might be a string, object, or null.
 */
function normalizeStorageData(data: string | null, defaultValue: unknown): string {
  if (data === null) {
    return JSON.stringify(defaultValue);
  }
  // If it's already a string, verify it's valid JSON and return as-is
  if (typeof data === "string") {
    try {
      JSON.parse(data); // Validate it's proper JSON
      return data;
    } catch {
      // If parsing fails, the string is corrupted or double-encoded
      // Try to fix double-encoding by parsing twice
      try {
        const parsed = JSON.parse(JSON.parse(data));
        return JSON.stringify(parsed);
      } catch {
        // If all else fails, return default
        return JSON.stringify(defaultValue);
      }
    }
  }
  // If it's an object (shouldn't happen but handle just in case)
  return JSON.stringify(data);
}

/**
 * Create a backup of current data (used for auto-backup during startup)
 */
async function createBackup(source: "auto" | "manual" = "manual"): Promise<boolean> {
  try {
    const adapter = getStorageAdapter();
    const todosData = await adapter.getItem(STORAGE_KEYS.TODOS);
    const settingsData = await adapter.getItem(STORAGE_KEYS.SETTINGS);

    const now = new Date();
    const backup: BackupData = {
      timestamp: now.getTime(),
      date: now.toISOString(),
      todos: normalizeStorageData(todosData, []),
      settings: normalizeStorageData(settingsData, {}),
      source,
    };

    const backupKey = `${BACKUP_KEY_PREFIX}${now.getTime()}`;
    await adapter.setItem(backupKey, JSON.stringify(backup));

    if (source === "auto") {
      const backupSettings = await loadBackupSettings();
      backupSettings.lastBackupDate = getTodayDateString();
      await saveBackupSettings(backupSettings);
    }

    return true;
  } catch (error) {
    console.error("Failed to create backup:", error);
    return false;
  }
}

/**
 * Delete a specific backup
 */
async function deleteBackup(timestamp: number): Promise<boolean> {
  try {
    const adapter = getStorageAdapter();
    const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`;
    await adapter.removeItem(backupKey);
    return true;
  } catch (error) {
    console.error("Failed to delete backup:", error);
    return false;
  }
}

/**
 * Check if a backup should be created today
 */
async function shouldCreateBackupToday(): Promise<boolean> {
  const settings = await loadBackupSettings();
  if (!settings.autoBackupEnabled) {
    return false;
  }

  const today = getTodayDateString();
  return settings.lastBackupDate !== today;
}

/**
 * Auto-backup if needed (called during migration/startup)
 */
export async function autoBackupIfNeeded(): Promise<void> {
  if (await shouldCreateBackupToday()) {
    await createBackup("auto");
  }
}

/**
 * Clean up old backups based on retention policy
 */
export async function cleanupOldBackups(): Promise<number> {
  const settings = await loadBackupSettings();
  const backups = await getAllBackups();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.retentionDays);
  const cutoffTimestamp = cutoffDate.getTime();

  let deletedCount = 0;

  for (const backup of backups) {
    if (backup.timestamp < cutoffTimestamp) {
      if (await deleteBackup(backup.timestamp)) {
        deletedCount++;
      }
    }
  }

  return deletedCount;
}
