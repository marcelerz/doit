"use client";

import React from "react";
import { PersonItem } from "@/components/items/PersonItem";
import { EntityListView } from "@/components/views/EntityListView";
import { PersonModel } from "@/models/PersonModel";
import { PersonId } from "@/types/person";
import { TutorialStep } from "@/components/overlays/TutorialOverlay";
import { STORAGE_KEYS } from "@/storage/storage";

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
  return (
    <EntityListView<PersonModel, PersonId>
      entities={people}
      config={{
        title: "People",
        noun: "person",
        pluralNoun: "people",
        addLabel: "Add Person",
        addTutorialId: "add-person-button",
        viewTestId: "people-view",
        searchPlaceholder: "Search people... (press / to focus)",
        storageKey: STORAGE_KEYS.PEOPLE_VIEW_OPTIONS,
        emptyEmoji: "\u{1F465}",
        emptyTitle: "No People",
        emptyMessage: "No people yet. Add one to get started!",
        noResultsMessage: "No people match your search.",
      }}
      onAdd={onAddPerson}
      searchInputRef={searchInputRef}
      renderItem={(person) => (
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
      )}
    />
  );
}
