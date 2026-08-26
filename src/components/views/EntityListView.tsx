"use client";

import React, { useMemo, useCallback, useRef } from "react";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlusIcon } from "@/components/shared/Icons";
import { usePersistedViewOptions } from "@/hooks/usePersistedViewOptions";

/** The minimum a model must expose to be listed here. */
export interface ListableEntity<TId> {
  id: TId;
  isArchived: boolean;
  matchesSearch: (term: string) => boolean;
}

/** The wording and behaviour that differ between one entity list and another. */
export interface EntityListConfig {
  /** Heading, e.g. "People". */
  title: string;
  /** Singular noun for the count line, e.g. "person". */
  noun: string;
  /** Plural noun for the count line, e.g. "people". */
  pluralNoun: string;
  /** Label on the add button, e.g. "Add Person". */
  addLabel: string;
  /** data-tutorial value on the add button. */
  addTutorialId: string;
  searchPlaceholder: string;
  storageKey: string;
  emptyEmoji: string;
  emptyTitle: string;
  emptyMessage: string;
  noResultsMessage: string;
}

interface EntityListViewProps<TModel, TId> {
  entities: TModel[];
  config: EntityListConfig;
  onAdd: () => void;
  /** Renders one row. Kept as a prop so each list keeps its own typed item. */
  renderItem: (entity: TModel) => React.ReactNode;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  /** Present so TId is used; the row key comes from it. */
  getKey?: (entity: TModel) => TId;
}

/**
 * A searchable, archive-filtered list of entities.
 *
 * PeopleView and ProjectsView were the same 178 lines with "person" swapped
 * for "project": normalising that one word left a diff of nothing but tutorial
 * copy and an emoji.
 *
 * The rows stay with the callers. PersonItem and ProjectItem exist to pin
 * their branded id at the type level, and pushing a config object through
 * every consumer to merge them would cost more than it saves.
 */
export function EntityListView<TModel extends ListableEntity<TId>, TId>({
  entities,
  config,
  onAdd,
  renderItem,
  searchInputRef,
}: EntityListViewProps<TModel, TId>) {
  const [{ search, showArchived }, setViewOptions] = usePersistedViewOptions(config.storageKey, {
    search: "",
    showArchived: false,
  });

  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || localInputRef;

  const handleSearchChange = useCallback((value: string) => setViewOptions({ search: value }), [setViewOptions]);
  const handleShowArchivedChange = useCallback(
    (value: boolean) => setViewOptions({ showArchived: value }),
    [setViewOptions],
  );

  const filtered = useMemo(() => {
    return entities.filter((entity) => {
      if (!showArchived && entity.isArchived) return false;
      if (search.trim() !== "") return entity.matchesSearch(search);
      return true;
    });
  }, [entities, search, showArchived]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{config.title}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {filtered.length} of {entities.length} {entities.length === 1 ? config.noun : config.pluralNoun}
          </p>
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          data-tutorial={config.addTutorialId}
        >
          <PlusIcon className="w-5 h-5" />
          {config.addLabel}
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          ref={inputRef}
          value={search}
          onChange={handleSearchChange}
          placeholder={config.searchPlaceholder}
        />
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => handleShowArchivedChange(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          Show archived
        </label>
      </div>

      {entities.length === 0 ? (
        <EmptyState emoji={config.emptyEmoji} title={config.emptyTitle} message={config.emptyMessage} />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🔍" title="No Results" message={config.noResultsMessage} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((entity) => (
            <li key={String(entity.id)}>{renderItem(entity)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
