"use client";

import { useState, useEffect, useRef } from "react";
import {
  loadBackupSettings,
  saveBackupSettings,
  getAllBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  exportBackupAsFile,
  exportCurrentDataAsFile,
  importBackupFromFile,
  getBackupStats,
  type BackupSettings,
  type BackupData,
} from "@/utils/backup";
import { Notification, ConfirmDialog, type NotificationType } from "@/components/shared/Notification";

interface BackupTabProps {
  onRestore?: () => void; // Callback to refresh data after restore
}

export function BackupTab({ onRestore }: BackupTabProps) {
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackupEnabled: true,
    retentionDays: 30,
    lastBackupDate: null,
  });
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [stats, setStats] = useState<{
    count: number;
    totalSize: number;
    oldestDate: string | null;
    newestDate: string | null;
  }>({ count: 0, totalSize: 0, oldestDate: null, newestDate: null });
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmVariant?: "danger" | "primary";
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      const loadedSettings = await loadBackupSettings();
      setSettings(loadedSettings);
      await loadBackups(loadedSettings);
    };
    init();
  }, []);

  const loadBackups = async (currentSettings?: BackupSettings) => {
    const allBackups = await getAllBackups();
    setBackups(allBackups);
    const backupStats = await getBackupStats();
    setStats(backupStats);

    // Find the last auto-backup date from actual backups
    const autoBackups = allBackups.filter((b) => b.source === "auto");
    if (autoBackups.length > 0) {
      const lastAutoBackup = autoBackups[0]; // Already sorted newest first
      const lastAutoDate = new Date(lastAutoBackup.timestamp).toISOString().split("T")[0];

      // Update settings if it doesn't match
      const settingsToCheck = currentSettings || settings;
      if (settingsToCheck.lastBackupDate !== lastAutoDate) {
        const newSettings = { ...settingsToCheck, lastBackupDate: lastAutoDate };
        setSettings(newSettings);
        await saveBackupSettings(newSettings);
      }
    }
  };
  const handleSettingsChange = async (updates: Partial<BackupSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveBackupSettings(newSettings);
  };

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const success = await createBackup();
      if (success) {
        await loadBackups(); // Await the refresh
        setNotification({ message: "Backup created successfully!", type: "success" });
      } else {
        setNotification({ message: "Failed to create backup. Please try again.", type: "error" });
      }
    } catch (error) {
      console.error("Backup error:", error);
      setNotification({ message: "An error occurred while creating the backup.", type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreBackup = (backup: BackupData) => {
    setConfirmDialog({
      title: "Restore Backup",
      message: `Are you sure you want to restore the backup from ${new Date(
        backup.timestamp,
      ).toLocaleString()}?\n\nThis will replace all current data. Consider creating a backup first!`,
      confirmText: "Restore",
      confirmVariant: "danger",
      onConfirm: async () => {
        const success = await restoreBackup(backup);
        if (success) {
          setNotification({ message: "Backup restored successfully! The page will reload.", type: "success" });
          onRestore?.();
          setTimeout(() => window.location.reload(), 1000);
        } else {
          setNotification({ message: "Failed to restore backup. Please try again.", type: "error" });
        }
        setConfirmDialog(null);
      },
    });
  };

  const handleDeleteBackup = (timestamp: number) => {
    setConfirmDialog({
      title: "Delete Backup",
      message: "Are you sure you want to delete this backup? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "danger",
      onConfirm: async () => {
        const success = deleteBackup(timestamp);
        if (success) {
          await loadBackups();
          if (selectedBackup === timestamp) {
            setSelectedBackup(null);
          }
          setNotification({ message: "Backup deleted successfully.", type: "success" });
        } else {
          setNotification({ message: "Failed to delete backup. Please try again.", type: "error" });
        }
        setConfirmDialog(null);
      },
    });
  };

  const handleExportBackup = (backup: BackupData) => {
    exportBackupAsFile(backup);
  };

  const handleExportCurrent = () => {
    exportCurrentDataAsFile();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await importBackupFromFile(file);
      if (result.success) {
        await loadBackups();
        setNotification({ message: "Backup imported successfully!", type: "success" });
      } else {
        setNotification({ message: `Failed to import backup: ${result.error || "Unknown error"}`, type: "error" });
      }
    } catch (error) {
      console.error("Import error:", error);
      setNotification({ message: "An error occurred while importing the backup.", type: "error" });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getBackupSourceLabel = (backup: BackupData) => {
    if (backup.source === "auto") return "🔄 Auto";
    if (backup.source === "imported") return "📥 Imported";
    return "✋ Manual";
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Backup & Restore</h2>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Automatically back up your data and restore from previous backups. Backups are stored locally in your browser.
      </p>

      {/* Auto-Backup Settings */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Auto-Backup Settings</h3>

        <div className="space-y-4">
          {/* Enable Auto-Backup */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoBackupEnabled}
              onChange={(e) => handleSettingsChange({ autoBackupEnabled: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"
            />
            <div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Enable Auto-Backup</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Automatically create a daily backup when you use the app
              </p>
            </div>
          </label>

          {/* Retention Days */}
          {settings.autoBackupEnabled && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Keep Backups For
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.retentionDays}
                  onChange={(e) => handleSettingsChange({ retentionDays: parseInt(e.target.value) || 1 })}
                  className="w-24 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">days</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Backups older than this will be automatically deleted
              </p>
            </div>
          )}

          {/* Last Backup Date */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Last Auto-Backup:</span>{" "}
              {settings.lastBackupDate ? new Date(settings.lastBackupDate).toLocaleDateString() : "Never"}
            </p>
          </div>
        </div>
      </div>

      {/* Manual Backup & Import/Export */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Manual Actions</h3>

        <div className="space-y-4">
          {/* Create Backup */}
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              Create a backup of your current data at any time.
            </p>
            <button
              onClick={handleCreateBackup}
              disabled={isCreating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white rounded-lg font-medium transition-colors"
            >
              {isCreating ? "Creating..." : "Create Backup Now"}
            </button>
          </div>

          {/* Export Current Data */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              Export your current data as a JSON file to save offline.
            </p>
            <button
              onClick={handleExportCurrent}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Export Current Data
            </button>
          </div>

          {/* Import Backup */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              Import a backup file from your computer. It will be added to your backup list.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-400 text-white rounded-lg font-medium transition-colors"
            >
              {isImporting ? "Importing..." : "Import Backup File"}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Backup Statistics</h3>
        <div className="grid grid-cols-2 gap-3 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <span className="font-medium">Total Backups:</span> {stats.count}
          </div>
          <div>
            <span className="font-medium">Total Size:</span> {formatSize(stats.totalSize)}
          </div>
          <div>
            <span className="font-medium">Oldest:</span>{" "}
            {stats.oldestDate ? new Date(stats.oldestDate).toLocaleDateString() : "N/A"}
          </div>
          <div>
            <span className="font-medium">Newest:</span>{" "}
            {stats.newestDate ? new Date(stats.newestDate).toLocaleDateString() : "N/A"}
          </div>
        </div>
      </div>

      {/* Backup List */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Available Backups</h3>

        {backups.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
            No backups available. Create your first backup above.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {backups.map((backup) => (
              <div
                key={backup.timestamp}
                className={`p-4 rounded-lg border transition-colors ${
                  selectedBackup === backup.timestamp
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {formatDate(backup.timestamp)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {getBackupSourceLabel(backup)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 space-y-0.5">
                      <div>Size: {formatSize((backup.todos?.length || 0) + (backup.settings?.length || 0))}</div>
                      {backup.uploadedAt && <div>Uploaded: {formatDate(backup.uploadedAt)}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestoreBackup(backup)}
                      className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleExportBackup(backup)}
                      className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.timestamp)}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Important Notes</h4>
        <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
          {[
            "Backups are stored in your browser's local storage",
            "Clearing browser data will delete all backups",
            "Export backups to save them outside the browser",
            "Restoring a backup will replace all current data",
          ].map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </div>

      {/* Notification */}
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          confirmVariant={confirmDialog.confirmVariant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
