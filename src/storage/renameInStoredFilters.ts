/**
 * Rewriting person and project names inside saved filters and presets.
 *
 * Saved filters store people and projects by name, and the state that owns them
 * lives inside ListView, NotesView and KanbanView -- none of it reachable from
 * TodoApp, where a rename is applied. So the rewrite happens at the storage
 * layer instead.
 *
 * Storage alone is not enough: a view that is currently mounted holds its
 * filters in memory and writes them back on the next state change, clobbering
 * the rewrite. The ENTITY_RENAMED_EVENT lets those owners remap what they are
 * holding; storage covers every view that is not mounted.
 */

import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "./storage";
import { renameInFilters, EntityKind, NameReferenceFields, NAME_REFERENCE_FIELDS } from "@/utils/renameReferences";

/** Fired on window after a rename, so mounted views can remap in-memory filters. */
export const ENTITY_RENAMED_EVENT = "doit:entity-renamed";

export interface EntityRenamedDetail {
  kind: EntityKind;
  previousName: string;
  nextName: string;
}

/** Keys whose stored shape is `{ filters: {...} }`, possibly inside an array of presets. */
const FILTER_KEYS = [
  STORAGE_KEYS.VIEW_PRESETS,
  STORAGE_KEYS.VIEW_OPTIONS,
  STORAGE_KEYS.NOTES_VIEW_PRESETS,
  STORAGE_KEYS.NOTES_VIEW_OPTIONS,
  STORAGE_KEYS.KANBAN_FILTER_PRESETS,
  STORAGE_KEYS.KANBAN_VIEW_OPTIONS,
] as const;

type WithFilters = { filters?: NameReferenceFields };

/** Rewrite one record's `filters`, returning null when it did not reference the entity. */
function renameInRecordFilters(
  record: WithFilters,
  kind: EntityKind,
  previousName: string,
  nextName: string,
): WithFilters | null {
  if (!record || typeof record !== "object" || !record.filters) return null;
  const filters = renameInFilters(record.filters, kind, previousName, nextName);
  return filters ? { ...record, filters } : null;
}

/** Rewrite the selection history entries that drive usage-sorted pick lists. */
async function renameInSelectionHistory(kind: EntityKind, previousName: string, nextName: string): Promise<void> {
  const history = await loadFromStorage<Record<string, Array<{ value: string }>> | null>(
    STORAGE_KEYS.SELECTION_HISTORY,
    null,
  );
  if (!history) return;

  // SelectionHistory keys the same reference fields the records do.
  const fields = NAME_REFERENCE_FIELDS[kind];

  let changed = false;
  const updated: Record<string, Array<{ value: string }>> = { ...history };
  for (const field of fields) {
    const entries = history[field];
    if (!Array.isArray(entries)) continue;
    const next = entries.map((entry) =>
      entry?.value?.toLowerCase() === previousName.toLowerCase() ? { ...entry, value: nextName } : entry,
    );
    if (next.some((entry, i) => entry !== entries[i])) {
      updated[field] = next;
      changed = true;
    }
  }
  if (changed) await saveToStorage(STORAGE_KEYS.SELECTION_HISTORY, updated);
}

/**
 * Rewrite every stored filter, preset and history entry that named the entity,
 * then tell any mounted view to remap what it is holding.
 */
export async function renameInStoredFilters(
  kind: EntityKind,
  previousName: string,
  nextName: string,
): Promise<void> {
  for (const key of FILTER_KEYS) {
    const stored = await loadFromStorage<unknown>(key, null);
    if (stored === null) continue;

    let updated: unknown = null;
    if (Array.isArray(stored)) {
      const next = stored.map((entry) => renameInRecordFilters(entry as WithFilters, kind, previousName, nextName) ?? entry);
      if (next.some((entry, i) => entry !== stored[i])) updated = next;
    } else {
      updated = renameInRecordFilters(stored as WithFilters, kind, previousName, nextName);
    }

    if (updated !== null) await saveToStorage(key, updated);
  }

  await renameInSelectionHistory(kind, previousName, nextName);

  if (typeof window !== "undefined") {
    const detail: EntityRenamedDetail = { kind, previousName, nextName };
    window.dispatchEvent(new CustomEvent(ENTITY_RENAMED_EVENT, { detail }));
  }
}
