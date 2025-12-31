"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { STORAGE_KEYS, getStorageAdapter } from "@/storage/storage";
import { useSettings } from "@/hooks/useSettings";
import { BACKUP_KEY_PREFIX, BackupData, BackupStats } from "@/storage/backup";

// Re-export types for convenience
export type { BackupData, BackupStats } from "@/storage/backup";

// ============================================================================
// Storage Operations (internal helpers)
// ============================================================================

async function getAllBackups(): Promise<BackupData[]> {
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

async function createBackupInStorage(source: "auto" | "manual" = "manual"): Promise<boolean> {
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

    return true;
  } catch (error) {
    console.error("Failed to create backup:", error);
    return false;
  }
}

async function restoreBackupFromStorage(backup: BackupData): Promise<boolean> {
  try {
    const adapter = getStorageAdapter();
    await adapter.setItem(STORAGE_KEYS.TODOS, backup.todos);
    await adapter.setItem(STORAGE_KEYS.SETTINGS, backup.settings);
    return true;
  } catch (error) {
    console.error("Failed to restore backup:", error);
    return false;
  }
}

async function deleteBackupFromStorage(timestamp: number): Promise<boolean> {
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

function exportBackupAsFile(backup: BackupData): void {
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

async function exportCurrentDataAsFile(): Promise<void> {
  const adapter = getStorageAdapter();
  const todosData = await adapter.getItem(STORAGE_KEYS.TODOS);
  const settingsData = await adapter.getItem(STORAGE_KEYS.SETTINGS);

  const now = new Date();
  const backup: BackupData = {
    timestamp: now.getTime(),
    date: now.toISOString(),
    todos: typeof todosData === "string" ? todosData : JSON.stringify(todosData || []),
    settings: typeof settingsData === "string" ? settingsData : JSON.stringify(settingsData || {}),
    source: "manual",
  };

  exportBackupAsFile(backup);
}

function importBackupFromFile(file: File): Promise<{ success: boolean; error?: string }> {
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

function getBackupStats(backups: BackupData[]): BackupStats {
  const totalSize = backups.reduce((sum, b) => {
    const todosSize = typeof b.todos === "string" ? b.todos.length : 0;
    const settingsSize = typeof b.settings === "string" ? b.settings.length : 0;
    return sum + todosSize + settingsSize;
  }, 0);

  // Find the last auto-backup date
  const autoBackups = backups.filter((b) => b.source === "auto");
  const lastAutoBackupDate =
    autoBackups.length > 0 ? new Date(autoBackups[0].timestamp).toISOString().split("T")[0] : null;

  return {
    count: backups.length,
    oldestDate: backups.length > 0 ? backups[backups.length - 1].date : null,
    newestDate: backups.length > 0 ? backups[0].date : null,
    totalSize,
    lastAutoBackupDate,
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useBackups() {
  const { settings, isLoaded, updateBackupSettings } = useSettings();
  const backupSettings = settings.backup;

  const [backups, setBackups] = useState<BackupData[]>([]);
  const [stats, setStats] = useState<BackupStats>({
    count: 0,
    totalSize: 0,
    oldestDate: null,
    newestDate: null,
    lastAutoBackupDate: null,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBackups = useCallback(async () => {
    const allBackups = await getAllBackups();
    setBackups(allBackups);
    const backupStats = getBackupStats(allBackups);
    setStats(backupStats);

    // Update settings if lastBackupDate doesn't match
    if (backupStats.lastAutoBackupDate && backupSettings.lastBackupDate !== backupStats.lastAutoBackupDate) {
      updateBackupSettings({ lastBackupDate: backupStats.lastAutoBackupDate });
    }
  }, [backupSettings.lastBackupDate, updateBackupSettings]);

  useEffect(() => {
    if (isLoaded) {
      loadBackups();
    }
  }, [isLoaded, loadBackups]);

  const handleCreateBackup = useCallback(async (): Promise<boolean> => {
    setIsCreating(true);
    try {
      const success = await createBackupInStorage("manual");
      if (success) {
        await loadBackups();
      }
      return success;
    } catch (error) {
      console.error("Backup error:", error);
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [loadBackups]);

  const handleRestoreBackup = useCallback(async (backup: BackupData): Promise<boolean> => {
    return await restoreBackupFromStorage(backup);
  }, []);

  const handleDeleteBackup = useCallback(
    async (timestamp: number): Promise<boolean> => {
      const success = await deleteBackupFromStorage(timestamp);
      if (success) {
        await loadBackups();
      }
      return success;
    },
    [loadBackups],
  );

  const handleExportBackup = useCallback((backup: BackupData) => {
    exportBackupAsFile(backup);
  }, []);

  const handleExportCurrent = useCallback(async () => {
    await exportCurrentDataAsFile();
  }, []);

  const handleImportFile = useCallback(
    async (file: File): Promise<{ success: boolean; error?: string }> => {
      setIsImporting(true);
      try {
        const result = await importBackupFromFile(file);
        if (result.success) {
          await loadBackups();
        }
        return result;
      } catch (error) {
        console.error("Import error:", error);
        return { success: false, error: "An error occurred while importing the backup." };
      } finally {
        setIsImporting(false);
      }
    },
    [loadBackups],
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const updateSettings = useCallback(
    (updates: Partial<typeof backupSettings>) => {
      updateBackupSettings(updates);
    },
    [updateBackupSettings],
  );

  const resetToDefaults = useCallback(() => {
    updateBackupSettings({
      autoBackupEnabled: true,
      retentionDays: 30,
    });
  }, [updateBackupSettings]);

  return {
    // State
    backups,
    stats,
    backupSettings,
    isLoaded,
    isCreating,
    isImporting,
    fileInputRef,

    // Actions
    loadBackups,
    createBackup: handleCreateBackup,
    restoreBackup: handleRestoreBackup,
    deleteBackup: handleDeleteBackup,
    exportBackup: handleExportBackup,
    exportCurrent: handleExportCurrent,
    importFile: handleImportFile,
    triggerFileInput,
    resetFileInput,
    updateSettings,
    resetToDefaults,
  };
}
