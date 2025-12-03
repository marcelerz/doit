"use client";

import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/utils/storage";

interface StorageItem {
  key: string;
  size: number;
  label: string;
  color: string;
}

export function StorageTab() {
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [totalUsed, setTotalUsed] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [detectionMethod, setDetectionMethod] = useState<"api" | "measured" | "fallback">("fallback");

  useEffect(() => {
    estimateStorageQuota();
    calculateStorageUsage();
  }, []);

  const estimateStorageQuota = async () => {
    try {
      // Try to get actual quota using StorageManager API
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota) {
          // For localStorage, browsers typically allocate 5-10MB from the total quota
          // We'll use a conservative estimate of the actual localStorage portion
          const localStorageQuota = Math.min(estimate.quota * 0.001, 10 * 1024 * 1024); // Max 10MB
          setTotalAvailable(localStorageQuota);
          setDetectionMethod("api");
          return;
        }
      }
    } catch (error) {
      console.warn("Failed to estimate storage quota:", error);
    }

    // Fallback: Try to measure by attempting to write
    try {
      const testKey = "__storage_test__";
      let low = 0;
      let high = 10 * 1024 * 1024; // Start with 10MB
      let estimate = high;

      // Binary search to find approximate limit
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const testData = "a".repeat(mid);

        try {
          localStorage.setItem(testKey, testData);
          localStorage.removeItem(testKey);
          low = mid + 1;
          estimate = mid;
        } catch (e) {
          high = mid;
        }
      }

      setTotalAvailable(estimate);
      setDetectionMethod("measured");
    } catch (error) {
      // Ultimate fallback
      setTotalAvailable(5 * 1024 * 1024); // 5MB conservative estimate
      setDetectionMethod("fallback");
    }
  };

  const calculateStorageUsage = () => {
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

    // Add main storage items
    Object.entries(storageMap).forEach(([key, config]) => {
      const data = localStorage.getItem(key);
      if (data) {
        const size = new Blob([data]).size;
        items.push({ key, size, label: config.label, color: config.color });
        total += size;
      }
    });

    // Add backup items
    let backupSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("doit-backup-") && key !== "doit-backup-settings") {
        const data = localStorage.getItem(key);
        if (data) {
          backupSize += new Blob([data]).size;
        }
      }
    }
    if (backupSize > 0) {
      items.push({ key: "backups", size: backupSize, label: "Backups", color: "#ec4899" }); // pink
      total += backupSize;
    }

    // Add other localStorage items not managed by our app
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

    setStorageItems(items.sort((a, b) => b.size - a.size));
    setTotalUsed(total);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
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
      case "measured":
        return "Measured by binary search";
      case "fallback":
        return "Conservative estimate (5MB)";
    }
  };

  const getDetectionMethodColor = () => {
    switch (detectionMethod) {
      case "api":
        return "text-green-600 dark:text-green-400";
      case "measured":
        return "text-blue-600 dark:text-blue-400";
      case "fallback":
        return "text-amber-600 dark:text-amber-400";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Storage</h2>
        <button
          onClick={() => {
            estimateStorageQuota();
            calculateStorageUsage();
          }}
          className="text-sm px-3 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        View your local storage usage. This shows how much browser storage is being used by Doit.
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
              <span className={`text-xs font-medium ${getDetectionMethodColor()}`}>{getDetectionMethodLabel()}</span>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="text-center">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{usedPercentage.toFixed(1)}%</span>
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
                Your local storage is {usedPercentage.toFixed(0)}% full. Consider deleting old backups or archived todos
                to free up space.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info about localStorage limits */}
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
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">About Local Storage</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {detectionMethod === "api" && "Storage limit detected using browser's Storage API. "}
              {detectionMethod === "measured" &&
                "Storage limit measured by testing write capacity. This is an approximation. "}
              {detectionMethod === "fallback" && "Using conservative 5MB estimate. Actual limit may be higher. "}
              This data is stored locally on your device and is not synced across browsers or devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
