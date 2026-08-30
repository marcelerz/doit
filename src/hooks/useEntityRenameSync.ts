/**
 * Keeps a mounted view's in-memory filters in step with a rename.
 *
 * Saved filters are rewritten at the storage layer when a person or project is
 * renamed, but a view that is currently mounted holds its filters in React
 * state and writes them back on the next change -- clobbering that rewrite.
 * This listens for the rename and remaps the name sets it is holding.
 */

import { useEffect } from "react";
import { ENTITY_RENAMED_EVENT, EntityRenamedDetail } from "@/storage/renameInStoredFilters";
import { EntityKind } from "@/utils/renameReferences";

/** The filter fields that hold names, per entity kind. */
const FIELDS: Record<EntityKind, readonly string[]> = {
  person: ["assignedPeople", "sourcePeople", "mentionedPeople"],
  project: ["projects"],
};

/** Replace a name inside a Set, returning the same Set when it was not present. */
function renameInSet(value: Set<string>, previousName: string, nextName: string): Set<string> {
  const match = [...value].find((entry) => entry.toLowerCase() === previousName.toLowerCase());
  if (match === undefined) return value;
  const next = new Set(value);
  next.delete(match);
  next.add(nextName);
  return next;
}

/**
 * @param setFilters state setter for a filter object whose person/project
 *                   fields are `Set<string>`
 */
export function useEntityRenameSync<T>(setFilters: (updater: (prev: T) => T) => void): void {
  useEffect(() => {
    const handle = (event: Event) => {
      const { kind, previousName, nextName } = (event as CustomEvent<EntityRenamedDetail>).detail;
      setFilters((prev) => {
        const current = prev as unknown as Record<string, unknown>;
        let changed = false;
        const next = { ...current };
        for (const field of FIELDS[kind]) {
          const value = current[field];
          if (!(value instanceof Set)) continue;
          const updated = renameInSet(value as Set<string>, previousName, nextName);
          if (updated !== value) {
            next[field] = updated;
            changed = true;
          }
        }
        return changed ? (next as unknown as T) : prev;
      });
    };

    window.addEventListener(ENTITY_RENAMED_EVENT, handle);
    return () => window.removeEventListener(ENTITY_RENAMED_EVENT, handle);
  }, [setFilters]);
}
