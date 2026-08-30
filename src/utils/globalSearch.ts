import { TodoModel } from "@/models/TodoModel";
import { NoteModel } from "@/models/NoteModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { SprintModel } from "@/models/SprintModel";
import { ReviewModel } from "@/models/ReviewModel";
import { ViewTab } from "@/types/viewRegistry";

/**
 * One search across everything.
 *
 * Each view filtered only its own collection, so finding a note from the Todos
 * view meant knowing which view it was in and going there first. Every model
 * already implements matchesSearch, so this is a ranked fan-out over the six
 * collections rather than any new matching logic.
 */

export type SearchResultKind = "todo" | "note" | "person" | "project" | "sprint" | "review";

export interface SearchResult {
  kind: SearchResultKind;
  id: string;
  title: string;
  /** Where selecting this result should take the user. */
  view: ViewTab;
  /** Dimmed in the list: completed, archived, and so on. */
  muted: boolean;
}

/** Cap on results per kind, so one big collection cannot crowd out the rest. */
export const MAX_PER_KIND = 5;
/** Cap on the whole list. */
export const MAX_RESULTS = 20;

export interface GlobalSearchCollections {
  todos?: TodoModel[];
  notes?: NoteModel[];
  people?: PersonModel[];
  projects?: ProjectModel[];
  sprints?: SprintModel[];
  reviews?: ReviewModel[];
}

/**
 * Rank one match.
 *
 * An exact title wins, then a prefix, then anything else. Within a rank the
 * shorter title wins, because a query that is most of a short title is a better
 * match than the same query buried in a long one.
 */
function scoreOf(title: string, query: string): number {
  const lower = title.toLowerCase();
  if (lower === query) return 0;
  if (lower.startsWith(query)) return 1;
  if (lower.includes(query)) return 2;
  // Matched on something other than the title -- a tag, a person, note content.
  return 3;
}

interface Ranked extends SearchResult {
  score: number;
  length: number;
}

function take(ranked: Ranked[]): SearchResult[] {
  return ranked
    .sort((a, b) => a.score - b.score || a.length - b.length || a.title.localeCompare(b.title))
    .slice(0, MAX_PER_KIND)
    .map(({ score: _score, length: _length, ...result }) => result);
}

/**
 * Everything matching `query`, grouped kind by kind and ranked within each.
 *
 * Returns nothing for a blank query rather than everything: a palette that
 * dumps the whole database the moment it opens is not a search.
 */
export function globalSearch(query: string, collections: GlobalSearchCollections): SearchResult[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === "") return [];

  const rank = (title: string): Pick<Ranked, "score" | "length"> => ({
    score: scoreOf(title, trimmed),
    length: title.length,
  });

  const todos = take(
    (collections.todos ?? [])
      // Deleted items are unreachable everywhere else; surfacing them here
      // would offer to navigate somewhere that will not show them.
      .filter((todo) => !todo.isDeleted && todo.matchesSearch(query))
      .map((todo) => ({
        kind: "todo" as const,
        id: todo.id,
        title: todo.plainText,
        view: "list" as ViewTab,
        muted: todo.isCompleted || todo.isArchived,
        ...rank(todo.plainText),
      })),
  );

  const notes = take(
    (collections.notes ?? [])
      .filter((note) => !note.isDeleted && note.matchesSearch(query))
      .map((note) => ({
        kind: "note" as const,
        id: note.id,
        title: note.plainText,
        view: "notes" as ViewTab,
        muted: note.isArchived,
        ...rank(note.plainText),
      })),
  );

  const people = take(
    (collections.people ?? [])
      .filter((person) => person.matchesSearch(query))
      .map((person) => ({
        kind: "person" as const,
        id: person.id,
        title: person.name,
        view: "people" as ViewTab,
        muted: person.isArchived,
        ...rank(person.name),
      })),
  );

  const projects = take(
    (collections.projects ?? [])
      .filter((project) => project.matchesSearch(query))
      .map((project) => ({
        kind: "project" as const,
        id: project.id,
        title: project.name,
        view: "projects" as ViewTab,
        muted: project.isArchived,
        ...rank(project.name),
      })),
  );

  const sprints = take(
    (collections.sprints ?? [])
      .filter((sprint) => sprint.matchesSearch(query))
      .map((sprint) => ({
        kind: "sprint" as const,
        id: sprint.id,
        title: sprint.name,
        view: "sprints" as ViewTab,
        muted: sprint.isArchived || sprint.isCompleted,
        ...rank(sprint.name),
      })),
  );

  const reviews = take(
    (collections.reviews ?? [])
      .filter((review) => !review.isDeleted && review.matchesSearch(query))
      .map((review) => ({
        kind: "review" as const,
        id: review.id,
        title: review.title,
        view: "reviews" as ViewTab,
        muted: review.isArchived,
        ...rank(review.title),
      })),
  );

  return [...todos, ...notes, ...people, ...projects, ...sprints, ...reviews].slice(0, MAX_RESULTS);
}

/** Display label for a result kind. */
export function labelForKind(kind: SearchResultKind): string {
  switch (kind) {
    case "todo":
      return "Task";
    case "note":
      return "Note";
    case "person":
      return "Person";
    case "project":
      return "Project";
    case "sprint":
      return "Sprint";
    case "review":
      return "Review";
  }
}
