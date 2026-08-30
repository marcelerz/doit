"use client";

import { useEffect, useState } from "react";
import { loadFromStorage, saveToStorage, waitForStorageInit } from "@/storage/storage";
import { useEntityRenamePresetSync } from "./useEntityRenamePresetSync";
import { NameReferenceFields } from "@/utils/renameReferences";

/**
 * Saved view presets, persisted to storage.
 *
 * The list and notes view-state hooks each carried an identical copy of this:
 * a presets array, an active-preset name, the save-dialog state, a loaded
 * flag, a load effect and a write-back effect. Only the storage key and the
 * preset type differed.
 *
 * Loading waits for storage initialization: the module-level adapter is the
 * localStorage one until then, and on an IndexedDB install the migration has
 * already emptied it, so an un-awaited read returns nothing and the write-back
 * effect then persists that nothing.
 */
export function useViewPresets<TPreset extends { filters: NameReferenceFields }>(storageKey: string) {
  const [viewPresets, setViewPresets] = useState<TPreset[]>([]);
  const [activePreset, setActivePreset] = useState<string>("custom");
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [viewPresetsLoaded, setViewPresetsLoaded] = useState(false);

  // A rename rewrites these presets in storage; remap the copy we hold, or
  // applying one filters on a dead name and the next save clobbers the rewrite.
  useEntityRenamePresetSync(setViewPresets);

  useEffect(() => {
    let cancelled = false;
    waitForStorageInit()
      .then(() => loadFromStorage<TPreset[]>(storageKey, []))
      .then((saved) => {
        if (!cancelled) setViewPresets(saved);
      })
      .catch((error) => {
        console.error(`Failed to load view presets for ${storageKey}:`, error);
      })
      .finally(() => {
        if (!cancelled) setViewPresetsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    // Skip until the load has landed, or an empty array overwrites what is
    // stored before it is read.
    if (!viewPresetsLoaded) return;
    saveToStorage(storageKey, viewPresets);
  }, [storageKey, viewPresets, viewPresetsLoaded]);

  return {
    viewPresets,
    setViewPresets,
    activePreset,
    setActivePreset,
    isSavePresetOpen,
    setIsSavePresetOpen,
    presetName,
    setPresetName,
    viewPresetsLoaded,
  };
}
