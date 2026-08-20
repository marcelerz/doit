"use client";

import { useState } from "react";
import {
  getStorageAdapter,
  clearAllAppData,
  STORAGE_KEY_PREFIX,
} from "@/storage/storage";
import { downloadFile } from "@/utils/export";
import { formatDateKey } from "@/utils/dateUtils";

interface StorageRecoveryScreenProps {
  /** The error that stopped the app from loading. */
  error: Error;
}

/**
 * Shown when loading data from storage fails.
 *
 * Previously any throw during the load chain left `isLoaded` false forever and
 * the app sat on "Loading..." with no way out and no way to retrieve the data.
 * The priority here is getting the user's data off the device before they are
 * tempted to clear it.
 */
export function StorageRecoveryScreen({ error }: StorageRecoveryScreenProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleDownload = async () => {
    setStatus("Collecting your data...");
    try {
      const adapter = getStorageAdapter();
      const keys = (await adapter.getAllKeys()).filter((key) => key.startsWith(STORAGE_KEY_PREFIX));
      const dump: Record<string, string | null> = {};
      for (const key of keys) {
        dump[key] = await adapter.getItem(key);
      }
      downloadFile(
        JSON.stringify(dump, null, 2),
        `doit-raw-data-${formatDateKey(new Date())}.json`,
        "application/json"
      );
      setStatus(`Downloaded ${keys.length} storage ${keys.length === 1 ? "key" : "keys"}.`);
    } catch (downloadError) {
      console.error("Failed to export raw data:", downloadError);
      setStatus("Could not read the stored data. Try reloading first.");
    }
  };

  const handleReset = async () => {
    setStatus("Clearing local data...");
    const cleared = await clearAllAppData();
    setStatus(cleared ? "Data cleared. Reloading..." : "Could not clear the stored data.");
    if (cleared) window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="max-w-lg w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Could not load your data
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Something went wrong reading from local storage. Your data is most likely still on this
          device — download a copy before changing anything.
        </p>

        <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded p-3 mb-4 overflow-x-auto whitespace-pre-wrap">
          {error.message}
        </pre>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownload}
            className="px-3 py-2 text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Download my data
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 text-sm font-medium rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 transition-colors"
          >
            Try again
          </button>
          {confirmingReset ? (
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm font-medium rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Confirm — erase everything
            </button>
          ) : (
            <button
              onClick={() => setConfirmingReset(true)}
              className="px-3 py-2 text-sm font-medium rounded border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              Reset app data
            </button>
          )}
        </div>

        {status !== null && (
          <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400" role="status">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
