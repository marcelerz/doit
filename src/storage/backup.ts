/**
 * Backup and restore utilities for localStorage data
 */

import {
  STORAGE_KEYS,
  removeFromStorageSync,
  getStorageAdapter,
  loadFromStorage,
  saveToStorage,
} from "@/storage/storage";

const BACKUP_KEY_PREFIX = "doit-backup-";

export interface BackupSettings {
  autoBackupEnabled: boolean;
  retentionDays: number;
  lastBackupDate: string | null; // ISO date string (YYYY-MM-DD)
}

export interface BackupData {
  timestamp: number;
  date: string; // ISO date string for display
  todos: string; // JSON stringified todos
  settings: string; // JSON stringified settings
  uploadedAt?: number; // Timestamp when this backup was uploaded (if imported)
  source?: "auto" | "manual" | "imported"; // How this backup was created
}

export const defaultBackupSettings: BackupSettings = {
  autoBackupEnabled: true,
  retentionDays: 30,
  lastBackupDate: null,
};

/**
 * Get backup settings from storage (async)
 */
export async function loadBackupSettings(): Promise<BackupSettings> {
  return await loadFromStorage<BackupSettings>(STORAGE_KEYS.BACKUP_SETTINGS, defaultBackupSettings);
}

/**
 * Save backup settings to storage (async)
 */
export async function saveBackupSettings(settings: BackupSettings): Promise<void> {
  await saveToStorage(STORAGE_KEYS.BACKUP_SETTINGS, settings);
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * Create a backup of current data
 */
export async function createBackup(source: "auto" | "manual" = "manual"): Promise<boolean> {
  try {
    const adapter = getStorageAdapter();

    // Use async methods for proper IndexedDB support
    const todosData = await adapter.getItem(STORAGE_KEYS.TODOS);
    const settingsData = await adapter.getItem(STORAGE_KEYS.SETTINGS);

    const now = new Date();
    const backup: BackupData = {
      timestamp: now.getTime(),
      date: now.toISOString(),
      todos: typeof todosData === "string" ? todosData : JSON.stringify(todosData || []),
      settings: typeof settingsData === "string" ? settingsData : JSON.stringify(settingsData || {}),
      source,
    };

    const backupKey = `${BACKUP_KEY_PREFIX}${now.getTime()}`;
    await adapter.setItem(backupKey, JSON.stringify(backup));

    // Update last backup date if auto backup
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
 * Check if a backup should be created today
 */
export async function shouldCreateBackupToday(): Promise<boolean> {
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
    const success = await createBackup("auto");
    if (success) {
    }
  }
}

/**
 * Get all backups, sorted by timestamp (newest first)
 */
export async function getAllBackups(): Promise<BackupData[]> {
  const backups: BackupData[] = [];

  try {
    const adapter = getStorageAdapter();
    const allKeys = adapter.getAllKeys ? await adapter.getAllKeys() : [];
    const keys = Array.isArray(allKeys) ? allKeys : [];

    for (const key of keys) {
      if (key && key.startsWith(BACKUP_KEY_PREFIX)) {
        const data = await adapter.getItem(key);
        const dataStr = typeof data === "string" ? data : null;
        if (dataStr) {
          try {
            const backup = JSON.parse(dataStr) as BackupData;
            // Filter out invalid backups (missing timestamp or invalid timestamp)
            if (backup.timestamp && !isNaN(backup.timestamp) && backup.timestamp > 0) {
              backups.push(backup);
            }
          } catch (error) {
            console.warn(`Failed to parse backup ${key}:`, error);
          }
        }
      }
    }

    // Sort by timestamp, newest first
    backups.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to load backups:", error);
  }

  return backups;
}

/**
 * Restore a backup
 */
export async function restoreBackup(backup: BackupData): Promise<boolean> {
  try {
    const adapter = getStorageAdapter();
    // Restore todos
    await adapter.setItem(STORAGE_KEYS.TODOS, backup.todos);

    // Restore settings
    await adapter.setItem(STORAGE_KEYS.SETTINGS, backup.settings);

    return true;
  } catch (error) {
    console.error("Failed to restore backup:", error);
    return false;
  }
}

/**
 * Delete a specific backup
 */
export function deleteBackup(timestamp: number): boolean {
  try {
    const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`;
    removeFromStorageSync(backupKey);
    return true;
  } catch (error) {
    console.error("Failed to delete backup:", error);
    return false;
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

  backups.forEach((backup) => {
    if (backup.timestamp < cutoffTimestamp) {
      if (deleteBackup(backup.timestamp)) {
        deletedCount++;
      }
    }
  });

  return deletedCount;
}

/**
 * Export backup as downloadable JSON file
 */
export function exportBackupAsFile(backup: BackupData): void {
  const dataStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `doit-backup-${new Date(backup.timestamp).toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export current data as downloadable JSON file
 */
export function exportCurrentDataAsFile(): void {
  const todosData = localStorage.getItem("doit-todos") || "[]";
  const settingsData = localStorage.getItem("doit-settings") || "{}";

  const now = new Date();
  const backup: BackupData = {
    timestamp: now.getTime(),
    date: now.toISOString(),
    todos: todosData,
    settings: settingsData,
    source: "manual",
  };

  exportBackupAsFile(backup);
}

/**
 * Import a backup from a JSON file
 */
export function importBackupFromFile(file: File): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedBackup = JSON.parse(content) as BackupData;

        // Validate backup structure
        if (!importedBackup.timestamp || !importedBackup.date || !importedBackup.todos || !importedBackup.settings) {
          resolve({ success: false, error: "Invalid backup file format" });
          return;
        }

        // Add upload metadata
        const now = Date.now();
        const backupWithMetadata: BackupData = {
          ...importedBackup,
          uploadedAt: now,
          source: "imported",
        };

        // Store the imported backup
        const backupKey = `${BACKUP_KEY_PREFIX}${importedBackup.timestamp}`;
        getStorageAdapter().setItem(backupKey, JSON.stringify(backupWithMetadata));

        resolve({ success: true });
      } catch (error) {
        console.error("Failed to import backup:", error);
        resolve({ success: false, error: "Failed to parse backup file" });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, error: "Failed to read file" });
    };

    reader.readAsText(file);
  });
}

/**
 * Get backup statistics
 */
export async function getBackupStats(): Promise<{
  count: number;
  oldestDate: string | null;
  newestDate: string | null;
  totalSize: number;
}> {
  const backups = await getAllBackups();

  const totalSize = backups.reduce((sum, b) => {
    const todosSize = typeof b.todos === "string" ? b.todos.length : 0;
    const settingsSize = typeof b.settings === "string" ? b.settings.length : 0;
    return sum + todosSize + settingsSize;
  }, 0);

  return {
    count: backups.length,
    oldestDate: backups.length > 0 ? backups[backups.length - 1].date : null,
    newestDate: backups.length > 0 ? backups[0].date : null,
    totalSize,
  };
}
