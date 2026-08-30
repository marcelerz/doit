/**
 * Keeps saved view presets in step with a person or project rename.
 *
 * Presets are rewritten at the storage layer when an entity is renamed, but a
 * view that is mounted holds them in React state. Two things go wrong without
 * this: applying a preset filters on a name that no longer exists, and the next
 * preset add or delete persists the stale array back over the storage rewrite.
 *
 * Separate from useEntityRenameSync because the shapes differ by traversal, not
 * just by type: live filters are a flat object of `Set<string>`, presets are an
 * array of records each holding a `filters` object of `string[]`.
 */

import { useEffect } from "react";
import { ENTITY_RENAMED_EVENT, EntityRenamedDetail } from "@/storage/renameInStoredFilters";
import { renameInFilters, NameReferenceFields } from "@/utils/renameReferences";

/**
 * @param setPresets state setter for an array of presets, each with a `filters`
 *                   object whose person/project fields are `string[]`
 */
export function useEntityRenamePresetSync<TPreset extends { filters: NameReferenceFields }>(
  setPresets: (updater: (prev: TPreset[]) => TPreset[]) => void,
): void {
  useEffect(() => {
    const handle = (event: Event) => {
      const { kind, previousName, nextName } = (event as CustomEvent<EntityRenamedDetail>).detail;
      setPresets((prev) => {
        let changed = false;
        const next = prev.map((preset) => {
          const filters = renameInFilters(preset.filters, kind, previousName, nextName);
          if (!filters) return preset;
          changed = true;
          return { ...preset, filters };
        });
        return changed ? next : prev;
      });
    };

    window.addEventListener(ENTITY_RENAMED_EVENT, handle);
    return () => window.removeEventListener(ENTITY_RENAMED_EVENT, handle);
  }, [setPresets]);
}
