"use client";

import { useEffect, useState } from "react";
import { onStorageWriteError, StorageWriteFailure } from "@/storage/storage";

/**
 * Persistent banner shown when a write to storage fails.
 *
 * saveToStorage returns `false` on failure, but no caller ever checked it, so a
 * QuotaExceededError produced no user-visible signal at all and the session's
 * work was lost on the next reload. This surfaces that.
 */
export function StorageErrorBanner() {
  const [failure, setFailure] = useState<StorageWriteFailure | null>(null);

  useEffect(() => onStorageWriteError(setFailure), []);

  if (failure === null) return null;

  return (
    <div
      role="alert"
      className="w-full bg-red-600 text-white px-4 py-2 text-sm flex items-center justify-between gap-3"
    >
      <span>
        {failure.isQuotaExceeded
          ? "Storage is full — recent changes were not saved. Export a backup, then archive or delete old items to free space."
          : "Recent changes could not be saved to this device. Export a backup before closing this tab."}
      </span>
      <button
        onClick={() => setFailure(null)}
        aria-label="Dismiss storage warning"
        className="flex-shrink-0 px-2 py-0.5 rounded bg-red-700 hover:bg-red-800 transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}
