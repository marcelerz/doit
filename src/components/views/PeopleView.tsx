"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { PersonItem } from "@/components/items/PersonItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlusIcon } from "@/components/shared/Icons";
import { SearchInput } from "@/components/shared/SearchInput";
import { PersonModel } from "@/models/PersonModel";
import { PersonId } from "@/types/person";
import { TutorialStep } from "@/components/overlays/TutorialOverlay";
import { STORAGE_KEYS } from "@/storage/storage";
import { usePersistedViewOptions } from "@/hooks/usePersistedViewOptions";

// People View Options for storage

// People View Tutorial Steps
export const peopleViewTutorialSteps: TutorialStep[] = [
  {
    id: "people-intro",
    title: "People Management 👥",
    description: "The People View lets you manage team members and contacts. Assign tasks to people using @mentions.",
    position: "center",
  },
  {
    id: "people-add",
    title: "Add People ➕",
    description:
      'Click "Add Person" to create a new person. You can add:\n\n• Name and alternatives (nicknames)\n• Custom color for badges\n• Notes and context',
    targetSelector: '[data-tutorial="add-person-button"]',
    position: "bottom",
    spotlightPadding: 8,
    fallbackHint: "The + Add Person button is at the top of the People view",
  },
  {
    id: "people-assign",
    title: "Assign Tasks 📋",
    description:
      "Use @name in your tasks to assign them:\n\n• @John - Assign to John\n• Multiple @mentions work too!\n\nAlternative names are recognized automatically.",
    position: "center",
  },
  {
    id: "people-source",
    title: "Track Sources $",
    description:
      'Use $name to mark who requested a task:\n\n• "Fix bug $Sarah" - Request from Sarah\n• Great for tracking where tasks came from!',
    position: "center",
  },
  {
    id: "people-complete",
    title: "Team Ready! 🎉",
    description: "You're set to manage people! Click on any person to see their assigned tasks and add comments.",
    position: "center",
  },
];

// Counts for todos and notes per entity
type EntityCounts = { activeTodos: number; closedTodos: number; activeNotes: number; archivedNotes: number };

interface PeopleViewProps {
  people: PersonModel[];
  countsByPerson: Map<string, EntityCounts>;
  onOpenPerson: (personId: PersonId) => void;
  onDeletePerson: (id: PersonId) => void;
  onArchivePerson: (id: PersonId) => void;
  onUnarchivePerson: (id: PersonId) => void;
  onRequestDeleteConfirm: (id: PersonId, name: string) => void;
  onAddPerson: () => void;
  onCreatePersonNote?: (personId: PersonId) => void;
  /** Ref for focus management from parent (keyboard shortcut "/") */
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function PeopleView({
  people,
  countsByPerson,
  onOpenPerson,
  onDeletePerson,
  onArchivePerson,
  onUnarchivePerson,
  onRequestDeleteConfirm,
  onAddPerson,
  onCreatePersonNote,
  searchInputRef,
}: PeopleViewProps) {
  // Internal state for search and show archived
  const [{ search, showArchived }, setViewOptions] = usePersistedViewOptions(
    STORAGE_KEYS.PEOPLE_VIEW_OPTIONS,
    { search: "", showArchived: false }
  );

  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || localInputRef;

  // Handlers for state changes
  const handleSearchChange = useCallback((value: string) => {
    setViewOptions({ search: value });
  }, [setViewOptions]);

  const handleShowArchivedChange = useCallback((value: boolean) => {
    setViewOptions({ showArchived: value });
  }, [setViewOptions]);

  // Filter people based on search and archive filter
  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      // Filter by archived status
      if (!showArchived && person.isArchived) return false;
      // Filter by search term
      if (search.trim()) {
        return person.matchesSearch(search);
      }
      return true;
    });
  }, [people, search, showArchived]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">People</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {filteredPeople.length} of {people.length} {people.length === 1 ? "person" : "people"}
          </p>
        </div>
        <button
          onClick={onAddPerson}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          data-tutorial="add-person-button"
        >
          <PlusIcon className="w-5 h-5" />
          Add Person
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          ref={inputRef}
          value={search}
          onChange={handleSearchChange}
          placeholder="Search people... (press / to focus)"
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

      {people.length === 0 ? (
        <EmptyState emoji="👥" title="No People" message="No people yet. Add one to get started!" />
      ) : filteredPeople.length === 0 ? (
        <EmptyState emoji="🔍" title="No Results" message="No people match your search." />
      ) : (
        <ul className="space-y-2">
          {filteredPeople.map((person) => (
            <li key={person.id}>
              <PersonItem
                person={person}
                onClick={() => onOpenPerson(person.id)}
                onDelete={onDeletePerson}
                onArchive={onArchivePerson}
                onUnarchive={onUnarchivePerson}
                onRequestDeleteConfirm={onRequestDeleteConfirm}
                onCreateNote={onCreatePersonNote}
                counts={countsByPerson.get(person.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
