"use client";

import { useMemo } from "react";
import { NoteModel } from "@/models/NoteModel";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";

/** How many todos and notes reference one person or project, split by state. */
export interface EntityCounts {
  activeTodos: number;
  closedTodos: number;
  activeNotes: number;
  archivedNotes: number;
}

/** An entity that can be matched by any of its names. */
interface Nameable {
  id: string;
  matchesAnyName: (names: string[]) => boolean;
}

const emptyCounts = (): EntityCounts => ({
  activeTodos: 0,
  closedTodos: 0,
  activeNotes: 0,
  archivedNotes: 0,
});

/**
 * Tally references to a set of entities across todos and notes.
 *
 * Both count maps in TodoApp were the same forty lines with different field
 * names. The matching is by name rather than by lookup, because PersonId and
 * ProjectId brand names -- a todo carries "@Marcel", not a key -- and an
 * alternative like "Marcel E" has to resolve to the same person.
 *
 * A reference is counted once per relationship, so a person both assigned to
 * and mentioned on the same todo counts twice. That is the existing behaviour
 * and it is arguably right: the People view shows involvement, not headcount.
 */
function tally<T extends Nameable>(
  entities: T[],
  todos: TodoModel[],
  notes: NoteModel[],
  namesOnTodo: (todo: TodoModel) => string[][],
  namesOnNote: (note: NoteModel) => string[],
): Map<string, EntityCounts> {
  const counts = new Map<string, EntityCounts>();

  const bump = (name: string, field: keyof EntityCounts) => {
    const entity = entities.find((e) => e.matchesAnyName([name]));
    if (!entity) return;
    if (!counts.has(entity.id)) counts.set(entity.id, emptyCounts());
    counts.get(entity.id)![field]++;
  };

  todos.forEach((todo) => {
    const field: keyof EntityCounts = todo.isActive ? "activeTodos" : "closedTodos";
    namesOnTodo(todo).forEach((group) => group.forEach((name) => bump(name, field)));
  });

  notes.forEach((note) => {
    const field: keyof EntityCounts = note.isArchived ? "archivedNotes" : "activeNotes";
    namesOnNote(note).forEach((name) => bump(name, field));
  });

  return counts;
}

/** Todo and note counts per person, across all three relationship types. */
export function usePersonCounts(
  todos: TodoModel[],
  notes: NoteModel[],
  people: PersonModel[],
): Map<string, EntityCounts> {
  return useMemo(
    () =>
      tally(
        people,
        todos,
        notes,
        (todo) => [todo.assignedPeople, todo.sourcePeople, todo.mentionedPeople],
        (note) => [
          ...note.assignedPeopleIds.map((id) => id as string),
          ...note.sourcePeopleIds.map((id) => id as string),
          ...note.mentionedPeopleIds.map((id) => id as string),
        ],
      ),
    [todos, notes, people],
  );
}

/** Todo and note counts per project. */
export function useProjectCounts(
  todos: TodoModel[],
  notes: NoteModel[],
  projects: ProjectModel[],
): Map<string, EntityCounts> {
  return useMemo(
    () => tally(projects, todos, notes, (todo) => [todo.projects], (note) => note.projectIds.map((id) => id as string)),
    [todos, notes, projects],
  );
}
