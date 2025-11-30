/**
 * Backup and restore utilities for localStorage data
 */

const BACKUP_KEY_PREFIX = "doit-backup-";
const BACKUP_SETTINGS_KEY = "doit-backup-settings";

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
 * Get backup settings from localStorage
 */
export function getBackupSettings(): BackupSettings {
  try {
    const stored = localStorage.getItem(BACKUP_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaultBackupSettings,
        ...parsed,
      };
    }
  } catch (error) {
    console.error("Failed to load backup settings:", error);
  }
  return defaultBackupSettings;
}

/**
 * Save backup settings to localStorage
 */
export function saveBackupSettings(settings: BackupSettings): void {
  try {
    localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save backup settings:", error);
  }
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
export function createBackup(source: "auto" | "manual" = "manual"): boolean {
  try {
    const todosData = localStorage.getItem("doit-todos") || "[]";
    const settingsData = localStorage.getItem("doit-settings") || "{}";

    const now = new Date();
    const backup: BackupData = {
      timestamp: now.getTime(),
      date: now.toISOString(),
      todos: todosData,
      settings: settingsData,
      source,
    };

    const backupKey = `${BACKUP_KEY_PREFIX}${now.getTime()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));

    // Update last backup date if auto backup
    if (source === "auto") {
      const backupSettings = getBackupSettings();
      backupSettings.lastBackupDate = getTodayDateString();
      saveBackupSettings(backupSettings);
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
export function shouldCreateBackupToday(): boolean {
  const settings = getBackupSettings();
  if (!settings.autoBackupEnabled) {
    return false;
  }

  const today = getTodayDateString();
  return settings.lastBackupDate !== today;
}

/**
 * Auto-backup if needed (called during migration/startup)
 */
export function autoBackupIfNeeded(): void {
  if (shouldCreateBackupToday()) {
    const success = createBackup("auto");
    if (success) {
      console.log("Auto-backup created successfully");
    }
  }
}

/**
 * Get all backups, sorted by timestamp (newest first)
 */
export function getAllBackups(): BackupData[] {
  const backups: BackupData[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BACKUP_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const backup = JSON.parse(data) as BackupData;
          backups.push(backup);
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
export function restoreBackup(backup: BackupData): boolean {
  try {
    // Restore todos
    localStorage.setItem("doit-todos", backup.todos);

    // Restore settings
    localStorage.setItem("doit-settings", backup.settings);

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
    localStorage.removeItem(backupKey);
    return true;
  } catch (error) {
    console.error("Failed to delete backup:", error);
    return false;
  }
}

/**
 * Clean up old backups based on retention policy
 */
export function cleanupOldBackups(): number {
  const settings = getBackupSettings();
  const backups = getAllBackups();
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
        localStorage.setItem(backupKey, JSON.stringify(backupWithMetadata));

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
export function getBackupStats(): {
  count: number;
  oldestDate: string | null;
  newestDate: string | null;
  totalSize: number;
} {
  const backups = getAllBackups();

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
