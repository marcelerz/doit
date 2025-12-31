"use client";

import { useState, useEffect } from "react";
import {
  STORAGE_KEYS,
  getStorageAdapter,
  getStorageType,
  isIndexedDBAvailable,
  estimateStorageQuota,
  migrateToIndexedDB,
  migrateToLocalStorage,
  clearAllAppData,
  type StorageType,
} from "@/storage/storage";
import { WarningTriangleIcon } from "@/components/shared/Icons";
import { SettingsHeader } from "./components/SettingsHeader";

const tooltip = (
  <div className="space-y-2">
    <p>Where your data is stored.</p>
    <ul className="space-y-1">
      <li>• IndexedDB (preferred, larger capacity)</li>
      <li>• LocalStorage (fallback)</li>
      <li>• Data stays in your browser</li>
      <li>• Use Backup for data portability</li>
    </ul>
  </div>
);

interface StorageItem {
  key: string;
  size: number;
  label: string;
  color: string;
}

type SubTab = "current" | "switch";

export function StorageTab() {
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [totalUsed, setTotalUsed] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [detectionMethod, setDetectionMethod] = useState<"api" | "fallback">("fallback");
  const [storageType, setStorageType] = useState<StorageType>("localStorage");
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("current");
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [indexedDBAvailable, setIndexedDBAvailable] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const refreshStorageInfo = async (type?: StorageType) => {
    const currentType = type || getStorageType();
    setStorageType(currentType);

    // Get quota info
    const quotaInfo = await estimateStorageQuota(currentType);
    setTotalAvailable(quotaInfo.available);
    setDetectionMethod(quotaInfo.detectionMethod);

    // Calculate detailed usage
    await calculateStorageUsage(currentType);
  };

  useEffect(() => {
    const init = async () => {
      const isIDBAvailable = await isIndexedDBAvailable();
      setIndexedDBAvailable(isIDBAvailable);
      await refreshStorageInfo();
    };
    init();
  }, []);

  const calculateStorageUsage = async (currentType: StorageType) => {
    const items: StorageItem[] = [];
    let total = 0;

    // Calculate size of each storage item
    const storageMap = {
      [STORAGE_KEYS.TODOS]: { label: "Todos", color: "#3b82f6" }, // blue
      [STORAGE_KEYS.PEOPLE]: { label: "People", color: "#10b981" }, // green
      [STORAGE_KEYS.PROJECTS]: { label: "Projects", color: "#8b5cf6" }, // purple
      [STORAGE_KEYS.SETTINGS]: { label: "Settings", color: "#f59e0b" }, // amber
      [STORAGE_KEYS.VERSION]: { label: "Version", color: "#6b7280" }, // gray
    };

    const adapter = getStorageAdapter();

    // Add main storage items
    for (const [key, config] of Object.entries(storageMap)) {
      try {
        const data = await adapter.getItem(key);
        if (data) {
          const size = new Blob([data]).size;
          items.push({ key, size, label: config.label, color: config.color });
          total += size;
        }
      } catch (error) {
        console.error(`Failed to get size for ${key}:`, error);
      }
    }

    // Add backup items
    let backupSize = 0;
    const keys = adapter.getAllKeys ? await adapter.getAllKeys() : [];

    for (const key of keys) {
      if (key && key.startsWith("doit-backup-") && key !== "doit-backup-settings") {
        try {
          const data = await adapter.getItem(key);
          if (data) {
            backupSize += new Blob([data]).size;
          }
        } catch (error) {
          console.error(`Failed to get size for backup ${key}:`, error);
        }
      }
    }

    if (backupSize > 0) {
      items.push({ key: "backups", size: backupSize, label: "Backups", color: "#ec4899" }); // pink
      total += backupSize;
    }

    // For localStorage, add other items not managed by our app
    if (currentType === "localStorage") {
      let otherSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith("doit-")) {
          const data = localStorage.getItem(key);
          if (data) {
            otherSize += new Blob([data]).size;
          }
        }
      }
      if (otherSize > 0) {
        items.push({ key: "other", size: otherSize, label: "Other", color: "#94a3b8" }); // slate
        total += otherSize;
      }
    }

    setStorageItems(items.sort((a, b) => b.size - a.size));
    setTotalUsed(total);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeIndex = Math.min(i, sizes.length - 1); // Prevent index out of bounds
    return `${parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2))} ${sizes[sizeIndex]}`;
  };

  const getPercentage = (size: number): number => {
    return (size / totalAvailable) * 100;
  };

  const usedPercentage = (totalUsed / totalAvailable) * 100;
  const availablePercentage = 100 - usedPercentage;

  const getDetectionMethodLabel = () => {
    switch (detectionMethod) {
      case "api":
        return "Detected via Storage API";
      case "fallback":
        return storageType === "indexedDB" ? "Conservative estimate (50MB)" : "Conservative estimate (5MB)";
    }
  };

  const getDetectionMethodColor = () => {
    switch (detectionMethod) {
      case "api":
        return "text-green-600 dark:text-green-400";
      case "fallback":
        return "text-amber-600 dark:text-amber-400";
    }
  };

  const handleMigrateToIndexedDB = async () => {
    if (!indexedDBAvailable) return;

    setIsMigrating(true);
    setMigrationStatus("Migrating to IndexedDB...");

    const result = await migrateToIndexedDB();
    if (result.success) {
      setMigrationStatus(`Successfully migrated ${result.migratedCount} items to IndexedDB. Please reload the page.`);
      await refreshStorageInfo("indexedDB");
    } else {
      setMigrationStatus("Migration failed. Please try again.");
    }

    setIsMigrating(false);
  };

  const handleMigrateToLocalStorage = async () => {
    setIsMigrating(true);
    setMigrationStatus("Migrating to localStorage...");

    const result = await migrateToLocalStorage();
    if (result.success) {
      setMigrationStatus(
        `Successfully migrated ${result.migratedCount} items to localStorage. Please reload the page.`,
      );
      await refreshStorageInfo("localStorage");
    } else {
      setMigrationStatus("Migration failed. Please try again.");
    }

    setIsMigrating(false);
  };

  const handleClearAllData = async () => {
    if (clearConfirmText !== "DELETE ALL DATA") return;

    setIsClearing(true);

    const success = await clearAllAppData();
    if (success) {
      setShowClearConfirm(false);
      setClearConfirmText("");
      window.location.reload();
    } else {
      alert("Failed to clear data. Please try again.");
    }

    setIsClearing(false);
  };

  return (
    <div className="space-y-4">
      <SettingsHeader
        title="Storage"
        tooltip={tooltip}
        description={
          <>
            Using{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {storageType === "indexedDB" ? "IndexedDB" : "localStorage"}
            </span>
          </>
        }
        action={{
          label: "Refresh",
          onClick: () => refreshStorageInfo(),
          variant: "subtle",
        }}
      />

      {/* Sub-tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setActiveSubTab("current")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSubTab === "current"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          Current Storage
        </button>
        <button
          onClick={() => setActiveSubTab("switch")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSubTab === "switch"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          Switch Storage
        </button>
      </div>

      {activeSubTab === "current" && (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            View your {storageType === "indexedDB" ? "IndexedDB" : "local"} storage usage. This shows how much browser
            storage is being used by Doit.
          </p>

          {/* Storage Summary */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-4">
              {/* Storage Bar */}
              <div className="relative">
                <div className="h-12 w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex">
                  {storageItems.map((item, index) => {
                    const percentage = getPercentage(item.size);
                    if (percentage < 0.5) return null; // Don't show items less than 0.5%
                    return (
                      <div
                        key={item.key}
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                        className="relative group transition-all"
                        title={`${item.label}: ${formatBytes(item.size)}`}
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-2 py-1 rounded whitespace-nowrap">
                            {item.label}: {formatBytes(item.size)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Storage Stats */}
              <div className="flex justify-between items-center text-sm">
                <div className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatBytes(totalUsed)}</span> used of{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatBytes(totalAvailable)}</span>
                </div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatBytes(totalAvailable - totalUsed)}
                  </span>{" "}
                  available
                </div>
              </div>

              {/* Detection method indicator */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-xs font-medium ${getDetectionMethodColor()}`}>
                    {getDetectionMethodLabel()}
                  </span>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="text-center">
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {usedPercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-1">used</span>
              </div>
            </div>
          </div>

          {/* Storage Breakdown */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Storage Breakdown</h3>
            <div className="space-y-3">
              {storageItems.map((item) => {
                const percentage = getPercentage(item.size);
                return (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 min-w-[80px] text-right">
                        {formatBytes(item.size)}
                      </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 min-w-[60px] text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warning if storage is getting full */}
          {usedPercentage > 80 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">Storage Almost Full</h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Your local storage is {usedPercentage.toFixed(0)}% full. Consider deleting old backups or archived
                    todos to free up space.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info about storage */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  About {storageType === "indexedDB" ? "IndexedDB" : "Local Storage"}
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {storageType === "indexedDB" ? (
                    <>
                      IndexedDB provides significantly more storage capacity (typically 50MB-1GB+) compared to
                      localStorage.
                      {detectionMethod === "api" && " Storage limit detected using browser's Storage API. "}
                      {detectionMethod === "fallback" &&
                        " Using conservative 50MB estimate. Actual limit may be much higher. "}
                      Your data is stored locally on this device and is not synced across browsers or devices.
                    </>
                  ) : (
                    <>
                      {detectionMethod === "api" && "Storage limit detected using browser's Storage API. "}
                      {detectionMethod === "fallback" &&
                        "Using conservative 5MB estimate. Actual limit may be higher. "}
                      This data is stored locally on your device and is not synced across browsers or devices.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone - Clear Data */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">Danger Zone</h4>
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                  Clear all app data including todos, people, projects, settings, and backups. This action cannot be
                  undone.
                </p>
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Clear All Data
                  </button>
                ) : (
                  <div className="space-y-3 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-red-900 dark:text-red-100">
                      <WarningTriangleIcon className="w-5 h-5" />
                      <span className="font-semibold">Are you absolutely sure?</span>
                    </div>
                    <p className="text-sm text-red-800 dark:text-red-200">This will permanently delete:</p>
                    <ul className="text-sm text-red-800 dark:text-red-200 list-disc list-inside space-y-1">
                      <li>All your todos (active, completed, and archived)</li>
                      <li>All people and projects</li>
                      <li>All settings and preferences</li>
                      <li>All backups stored in the browser</li>
                      <li>All view presets and saved filters</li>
                    </ul>
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                      Type <code className="bg-red-200 dark:bg-red-800 px-1 py-0.5 rounded">DELETE ALL DATA</code> to
                      confirm:
                    </p>
                    <input
                      type="text"
                      value={clearConfirmText}
                      onChange={(e) => setClearConfirmText(e.target.value)}
                      placeholder="Type DELETE ALL DATA"
                      className="w-full px-3 py-2 text-sm border border-red-300 dark:border-red-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearAllData}
                        disabled={clearConfirmText !== "DELETE ALL DATA" || isClearing}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isClearing ? "Clearing..." : "Permanently Delete All Data"}
                      </button>
                      <button
                        onClick={() => {
                          setShowClearConfirm(false);
                          setClearConfirmText("");
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeSubTab === "switch" && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Switch between localStorage and IndexedDB storage backends. IndexedDB offers more capacity but may not be
            available in all browsers (e.g., Safari Private Mode).
          </p>

          {/* Current storage indicator */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Current Storage Backend</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {storageType === "indexedDB" ? "IndexedDB" : "localStorage"}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  storageType === "indexedDB"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                }`}
              >
                Active
              </div>
            </div>
          </div>

          {/* Migration status */}
          {migrationStatus && (
            <div
              className={`p-4 rounded-lg border ${
                migrationStatus.includes("Successfully")
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                  : migrationStatus.includes("failed")
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
              }`}
            >
              <p className="text-sm">{migrationStatus}</p>
              {migrationStatus.includes("reload") && (
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm font-medium underline hover:no-underline"
                >
                  Reload Now
                </button>
              )}
            </div>
          )}

          {/* Storage options */}
          <div className="grid gap-4">
            {/* localStorage option */}
            <div
              className={`p-4 rounded-lg border-2 transition-colors ${
                storageType === "localStorage"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    localStorage
                    {storageType === "localStorage" && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">(Current)</span>
                    )}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Traditional browser storage. Limited to ~5MB but widely supported.
                  </p>
                  <ul className="mt-2 text-xs text-zinc-500 dark:text-zinc-500 space-y-1">
                    <li>✓ Works in all browsers including Safari Private Mode</li>
                    <li>✓ Synchronous API (faster for small data)</li>
                    <li>⚠ Limited to ~5-10MB capacity</li>
                  </ul>
                </div>
                {storageType === "indexedDB" && (
                  <button
                    onClick={handleMigrateToLocalStorage}
                    disabled={isMigrating}
                    className="ml-4 px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isMigrating ? "Migrating..." : "Switch"}
                  </button>
                )}
              </div>
            </div>

            {/* IndexedDB option */}
            <div
              className={`p-4 rounded-lg border-2 transition-colors ${
                storageType === "indexedDB"
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : indexedDBAvailable
                  ? "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  : "border-zinc-200 dark:border-zinc-700 opacity-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    IndexedDB
                    {storageType === "indexedDB" && (
                      <span className="text-xs text-green-600 dark:text-green-400">(Current)</span>
                    )}
                    {!indexedDBAvailable && (
                      <span className="text-xs text-red-600 dark:text-red-400">(Unavailable)</span>
                    )}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Modern browser database. Much larger capacity (50MB-1GB+).
                  </p>
                  <ul className="mt-2 text-xs text-zinc-500 dark:text-zinc-500 space-y-1">
                    <li>✓ Large storage capacity (50MB to 1GB+)</li>
                    <li>✓ Better for large datasets</li>
                    <li>⚠ Not available in Safari Private Mode</li>
                  </ul>
                </div>
                {storageType === "localStorage" && indexedDBAvailable && (
                  <button
                    onClick={handleMigrateToIndexedDB}
                    disabled={isMigrating}
                    className="ml-4 px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isMigrating ? "Migrating..." : "Switch"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Warning about migration */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">Before Switching</h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Switching storage backends will migrate all your data. After migration, you&apos;ll need to reload the
                  page. Consider creating a backup first in the Backup tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
