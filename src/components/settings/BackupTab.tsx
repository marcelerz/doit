"use client";

import { useState, useEffect } from "react";
import {
  getBackupSettings,
  saveBackupSettings,
  getAllBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  exportBackupAsFile,
  getBackupStats,
  type BackupSettings,
  type BackupData,
} from "@/utils/backup";

interface BackupTabProps {
  onRestore?: () => void; // Callback to refresh data after restore
}

export function BackupTab({ onRestore }: BackupTabProps) {
  const [settings, setSettings] = useState<BackupSettings>(() => getBackupSettings());
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [stats, setStats] = useState(() => getBackupStats());
  const [isCreating, setIsCreating] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<number | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = () => {
    const allBackups = getAllBackups();
    setBackups(allBackups);
    setStats(getBackupStats());
  };

  const handleSettingsChange = (updates: Partial<BackupSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveBackupSettings(newSettings);
  };

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const success = createBackup();
      if (success) {
        loadBackups();
        alert("Backup created successfully!");
      } else {
        alert("Failed to create backup. Please try again.");
      }
    } catch (error) {
      console.error("Backup error:", error);
      alert("An error occurred while creating the backup.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreBackup = (backup: BackupData) => {
    if (
      window.confirm(
        `Are you sure you want to restore the backup from ${new Date(
          backup.timestamp,
        ).toLocaleString()}?\n\nThis will replace all current data. Consider creating a backup first!`,
      )
    ) {
      const success = restoreBackup(backup);
      if (success) {
        alert("Backup restored successfully! The page will reload.");
        onRestore?.();
        window.location.reload();
      } else {
        alert("Failed to restore backup. Please try again.");
      }
    }
  };

  const handleDeleteBackup = (timestamp: number) => {
    if (window.confirm("Are you sure you want to delete this backup? This action cannot be undone.")) {
      const success = deleteBackup(timestamp);
      if (success) {
        loadBackups();
        if (selectedBackup === timestamp) {
          setSelectedBackup(null);
        }
      } else {
        alert("Failed to delete backup. Please try again.");
      }
    }
  };

  const handleExportBackup = (backup: BackupData) => {
    exportBackupAsFile(backup);
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

      {/* Manual Backup */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Manual Backup</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
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
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{formatDate(backup.timestamp)}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Size: {formatSize((backup.todos?.length || 0) + (backup.settings?.length || 0))}
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
          <li>Backups are stored in your browser's local storage</li>
          <li>Clearing browser data will delete all backups</li>
          <li>Export backups to save them outside the browser</li>
          <li>Restoring a backup will replace all current data</li>
        </ul>
      </div>
    </div>
  );
}
