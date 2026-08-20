"use client";

import { useBackups, type BackupData } from "@/hooks/useBackups";
import { useNotification } from "@/hooks/useNotification";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { IconButton } from "@/components/shared/IconButton";
import { ClockIcon, UploadIcon, EditIcon, ChartBarIcon } from "@/components/shared/Icons";
import { SettingsHeader } from "./components/SettingsHeader";
import { SettingsLoading } from "./components/SettingsLoading";
import { NoticeBox } from "../shared/NoticeBox";

const tooltip = (
  <div className="space-y-2">
    <p>Save and restore your data.</p>
    <ul className="space-y-1">
      <li>• Export all data as JSON</li>
      <li>• Restore from backup file</li>
      <li>• Includes tasks, people, projects, settings</li>
    </ul>
  </div>
);

const getBackupSourceLabel = (backup: BackupData) => {
  if (backup.source === "auto")
    return (
      <span className="inline-flex items-center gap-1">
        <ClockIcon className="w-3 h-3" /> Auto
      </span>
    );
  if (backup.source === "imported")
    return (
      <span className="inline-flex items-center gap-1">
        <UploadIcon className="w-3 h-3" /> Imported
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1">
      <EditIcon className="w-3 h-3" /> Manual
    </span>
  );
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

export function BackupTab() {
  const {
    backups,
    stats,
    backupSettings,
    isLoaded,
    isCreating,
    isImporting,
    fileInputRef,
    createBackup,
    restoreBackup,
    deleteBackup,
    exportBackup,
    exportCurrent,
    importFile,
    triggerFileInput,
    resetFileInput,
    updateSettings,
    resetToDefaults,
  } = useBackups();

  const { showSuccess, showError, NotificationComponent } = useNotification();
  const { showConfirmDialog, ConfirmDialogComponent } = useConfirmDialog();

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  const handleCreateBackup = async () => {
    const success = await createBackup();
    if (success) {
      showSuccess("Backup created successfully!");
    } else {
      showError("Failed to create backup. Please try again.");
    }
  };

  const handleRestoreBackup = (backup: BackupData) => {
    showConfirmDialog({
      title: "Restore Backup",
      message: `Are you sure you want to restore the backup from ${new Date(
        backup.timestamp,
      ).toLocaleString()}?\n\nThis will replace all current data. Consider creating a backup first!`,
      confirmText: "Restore",
      confirmVariant: "danger",
      onConfirm: async () => {
        const success = await restoreBackup(backup);
        if (success) {
          showSuccess("Backup restored successfully! The page will reload.");
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showError("Failed to restore backup. Please try again.");
        }
      },
    });
  };

  const handleDeleteBackup = (timestamp: number) => {
    showConfirmDialog({
      title: "Delete Backup",
      message: "Are you sure you want to delete this backup? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "danger",
      onConfirm: async () => {
        const success = await deleteBackup(timestamp);
        if (success) {
          showSuccess("Backup deleted successfully.");
        } else {
          showError("Failed to delete backup. Please try again.");
        }
      },
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await importFile(file);
    if (result.success) {
      showSuccess("Backup imported successfully!");
    } else {
      showError(`Failed to import backup: ${result.error || "Unknown error"}`);
    }
    resetFileInput();
  };

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Backup & Restore"
        tooltip={tooltip}
        description="Automatically back up your data and restore from previous backups. Backups are stored locally in your browser."
        action={{
          label: "Reset to Defaults",
          onClick: resetToDefaults,
        }}
      />

      {/* Auto-Backup Settings */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Auto-Backup Settings</h3>

        <div className="space-y-4">
          {/* Enable Auto-Backup */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={backupSettings.autoBackupEnabled}
              onChange={(e) => updateSettings({ autoBackupEnabled: e.target.checked })}
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
          {backupSettings.autoBackupEnabled && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Keep Backups For
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={backupSettings.retentionDays}
                  onChange={(e) => updateSettings({ retentionDays: parseInt(e.target.value) || 1 })}
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
              {backupSettings.lastBackupDate ? new Date(backupSettings.lastBackupDate).toLocaleDateString() : "Never"}
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-400 text-white rounded-lg font-medium transition-colors"
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
              onClick={exportCurrent}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
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
              onClick={triggerFileInput}
              disabled={isImporting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-400 text-white rounded-lg font-medium transition-colors"
            >
              {isImporting ? "Importing..." : "Import Backup File"}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-1.5">
          <ChartBarIcon className="w-4 h-4" /> Backup Statistics
        </h3>
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
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {backups.map((backup) => (
              <div
                key={backup.timestamp}
                className="group bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border transition-all hover:shadow-md border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
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
                    <IconButton icon="restore" onClick={() => handleRestoreBackup(backup)} />
                    <IconButton icon="download" onClick={() => exportBackup(backup)} title="Export" />
                    <IconButton icon="delete" onClick={() => handleDeleteBackup(backup.timestamp)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NoticeBox
        title="Important Notes"
        variant="warning"
        items={[
          "Backups are stored in your browser's local storage",
          "Clearing browser data will delete all backups",
          "Export backups to save them outside the browser",
          "Restoring a backup will replace all current data",
        ]}
      />

      {NotificationComponent}
      {ConfirmDialogComponent}
    </div>
  );
}
