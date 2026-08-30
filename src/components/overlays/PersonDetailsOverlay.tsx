"use client";

import { PersonModel } from "@/models/PersonModel";
import { Person, PersonId } from "@/types/person";
import { MarkerColors, defaultMarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import { CommentId } from "@/types/types";
import { NoteModel } from "@/models/NoteModel";
import { TodoModel } from "@/models/TodoModel";
import { NoteId } from "@/types/note";
import { TodoId } from "@/types/todo";
import { Priority } from "@/types/priority";
import { EntityDetailsOverlay, EntityTodoGroup } from "./EntityDetailsOverlay";

interface PersonDetailsOverlayProps {
  person: PersonModel;
  onClose: () => void;
  /** Shown under the name field when a rename was refused. */
  nameError?: string | null;
  onUpdate: (id: PersonId, updates: Partial<Person>) => void;
  onDelete: (id: PersonId) => void;
  onArchive?: (id: PersonId) => void;
  onUnarchive?: (id: PersonId) => void;
  onAddComment: (personId: PersonId, content: string) => void;
  onEditComment: (
    personId: PersonId,
    commentId: CommentId,
    content: string,
  ) => void;
  onDeleteComment: (personId: PersonId, commentId: CommentId) => void;
  onCreateNote?: (personId: PersonId) => void;
  markerColors?: MarkerColors;
  linkPatterns?: LinkPattern[];
  // Notes section
  notes?: NoteModel[];
  onOpenNote?: (noteId: NoteId) => void;
  // Todos section
  todos?: TodoModel[];
  onOpenTodo?: (todoId: TodoId) => void;
  availablePriorities?: Priority[];
}

export function PersonDetailsOverlay({
  person,
  markerColors = defaultMarkerColors,
  linkPatterns = [],
  notes = [],
  todos = [],
  availablePriorities = [],
  ...callbacks
}: PersonDetailsOverlayProps) {
  // Todo ids hold names, so match on the person's name and all their alternatives
  const personNames = [
    person.name.toLowerCase(),
    ...person.alternatives.map((a) => a.toLowerCase()),
  ];
  const matchesPerson = (ids: readonly string[]) =>
    ids.some((id) => personNames.includes(id.toLowerCase()));

  // A person's todos group by how the person relates to each one, not by state
  const todoGroups: EntityTodoGroup[] = [
    {
      label: "Assigned",
      headingClass: "text-blue-600 dark:text-blue-400",
      todos: todos.filter((t) => matchesPerson(t.assignedPeopleIds)),
    },
    {
      label: "Sourced",
      headingClass: "text-green-600 dark:text-green-400",
      todos: todos.filter((t) => matchesPerson(t.sourcePeopleIds)),
    },
    {
      label: "Mentioned",
      headingClass: "text-yellow-600 dark:text-yellow-400",
      todos: todos.filter((t) => matchesPerson(t.mentionedPeopleIds)),
    },
  ];

  return (
    <EntityDetailsOverlay<PersonId, Person>
      entity={person}
      entityTypeName="Person"
      focusRingClass="focus:ring-blue-500"
      defaultColor={markerColors.assigned}
      alternativesPlaceholder="e.g., Johnny, JD, John D."
      createNoteLabel="Create 1:1 Note"
      todoGroups={todoGroups}
      markerBadges={
        <>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
            @{person.name}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
            ${person.name}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-medium">
            {person.name}
          </span>
        </>
      }
      markerColors={markerColors}
      linkPatterns={linkPatterns}
      notes={notes}
      availablePriorities={availablePriorities}
      {...callbacks}
    />
  );
}
