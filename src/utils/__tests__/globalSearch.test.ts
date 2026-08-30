/**
 * One search across every collection.
 *
 * The matching itself belongs to the models -- each already has matchesSearch,
 * and this reuses it rather than reimplementing it. What is worth testing here
 * is everything around that: the ranking, the per-kind caps that stop one large
 * collection crowding out the rest, and the exclusions.
 */

import { globalSearch, labelForKind, MAX_PER_KIND, MAX_RESULTS } from "../globalSearch";
import { TodoModel } from "@/models/TodoModel";
import { NoteModel } from "@/models/NoteModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { SprintModel } from "@/models/SprintModel";
import { ReviewModel } from "@/models/ReviewModel";

/**
 * Stand-ins carrying only what globalSearch reads. Building real models here
 * would exercise the model layer's own matching, which has its own tests, and
 * bury the ranking rules this file is actually about.
 */
const todo = (text: string, over: { completed?: boolean; archived?: boolean; deleted?: boolean } = {}) =>
  ({
    id: `todo-${text}`,
    plainText: text,
    isCompleted: over.completed ?? false,
    isArchived: over.archived ?? false,
    isDeleted: over.deleted ?? false,
    matchesSearch: (q: string) => text.toLowerCase().includes(q.toLowerCase()),
  }) as unknown as TodoModel;

const note = (text: string, over: { archived?: boolean; deleted?: boolean } = {}) =>
  ({
    id: `note-${text}`,
    plainText: text,
    isArchived: over.archived ?? false,
    isDeleted: over.deleted ?? false,
    matchesSearch: (q: string) => text.toLowerCase().includes(q.toLowerCase()),
  }) as unknown as NoteModel;

const entity = (name: string, archived = false) =>
  ({
    id: `e-${name}`,
    name,
    isArchived: archived,
    matchesSearch: (q: string) => name.toLowerCase().includes(q.toLowerCase()),
  }) as unknown as PersonModel & ProjectModel;

const sprint = (name: string, over: { archived?: boolean; completed?: boolean } = {}) =>
  ({
    id: `s-${name}`,
    name,
    isArchived: over.archived ?? false,
    isCompleted: over.completed ?? false,
    matchesSearch: (q: string) => name.toLowerCase().includes(q.toLowerCase()),
  }) as unknown as SprintModel;

const review = (title: string, over: { archived?: boolean; deleted?: boolean } = {}) =>
  ({
    id: `r-${title}`,
    title,
    isArchived: over.archived ?? false,
    isDeleted: over.deleted ?? false,
    matchesSearch: (q: string) => title.toLowerCase().includes(q.toLowerCase()),
  }) as unknown as ReviewModel;

describe("globalSearch", () => {
  it("finds nothing for a blank query rather than everything", () => {
    // Every model's matchesSearch returns true for "", so without this guard a
    // palette would dump the whole database the moment it opened.
    const collections = { todos: [todo("anything")], people: [entity("Marcel")] };

    expect(globalSearch("", collections)).toEqual([]);
    expect(globalSearch("   ", collections)).toEqual([]);
  });

  it("searches every collection at once", () => {
    const results = globalSearch("alpha", {
      todos: [todo("alpha task")],
      notes: [note("alpha note")],
      people: [entity("Alpha Person")],
      projects: [entity("Alpha Project")],
      sprints: [sprint("Alpha Sprint")],
      reviews: [review("Alpha Review")],
    });

    expect(results.map((r) => r.kind)).toEqual(["todo", "note", "person", "project", "sprint", "review"]);
  });

  it("sends each kind to the view that can show it", () => {
    const results = globalSearch("alpha", {
      todos: [todo("alpha")],
      notes: [note("alpha")],
      people: [entity("alpha")],
      projects: [entity("alpha")],
      sprints: [sprint("alpha")],
      reviews: [review("alpha")],
    });

    expect(results.map((r) => r.view)).toEqual(["list", "notes", "people", "projects", "sprints", "reviews"]);
  });

  it("ranks an exact title above a prefix, and a prefix above a mention", () => {
    const results = globalSearch("plan", {
      todos: [todo("replan the sprint"), todo("planning meeting"), todo("plan")],
    });

    expect(results.map((r) => r.title)).toEqual(["plan", "planning meeting", "replan the sprint"]);
  });

  it("prefers the shorter title when two match the same way", () => {
    const results = globalSearch("plan", {
      todos: [todo("plan the whole quarter carefully"), todo("plan today")],
    });

    expect(results[0].title).toBe("plan today");
  });

  it("orders by title when rank and length tie, so the list is stable", () => {
    const results = globalSearch("ab", { todos: [todo("ab z"), todo("ab a")] });

    expect(results.map((r) => r.title)).toEqual(["ab a", "ab z"]);
  });

  it("matches case-insensitively", () => {
    expect(globalSearch("MARCEL", { people: [entity("Marcel")] })).toHaveLength(1);
  });

  it("ranks a match that is not in the title last", () => {
    // A todo found by its tag rather than its text still belongs in the list,
    // just below the ones whose title actually says it.
    const byTag = {
      id: "todo-tagged",
      plainText: "unrelated wording",
      isCompleted: false,
      isArchived: false,
      isDeleted: false,
      matchesSearch: () => true,
    } as unknown as TodoModel;

    const results = globalSearch("urgent", { todos: [todo("urgent thing"), byTag] });

    expect(results.map((r) => r.title)).toEqual(["urgent thing", "unrelated wording"]);
  });

  it("caps each kind so one big collection cannot crowd out the others", () => {
    const many = Array.from({ length: 30 }, (_, i) => todo(`task ${i}`));
    const results = globalSearch("t", { todos: many, people: [entity("t person")] });

    expect(results.filter((r) => r.kind === "todo")).toHaveLength(MAX_PER_KIND);
    expect(results.filter((r) => r.kind === "person")).toHaveLength(1);
  });

  it("caps the whole list", () => {
    const results = globalSearch("x", {
      todos: Array.from({ length: 30 }, (_, i) => todo(`x${i}`)),
      notes: Array.from({ length: 30 }, (_, i) => note(`x${i}`)),
      people: Array.from({ length: 30 }, (_, i) => entity(`x${i}`)),
      projects: Array.from({ length: 30 }, (_, i) => entity(`x${i}`)),
      sprints: Array.from({ length: 30 }, (_, i) => sprint(`x${i}`)),
      reviews: Array.from({ length: 30 }, (_, i) => review(`x${i}`)),
    });

    expect(results.length).toBeLessThanOrEqual(MAX_RESULTS);
  });

  it("leaves out deleted items, which no view would show anyway", () => {
    const results = globalSearch("gone", {
      todos: [todo("gone task", { deleted: true })],
      notes: [note("gone note", { deleted: true })],
      reviews: [review("gone review", { deleted: true })],
    });

    expect(results).toEqual([]);
  });

  it("keeps completed and archived items but marks them for dimming", () => {
    const results = globalSearch("old", {
      todos: [todo("old done", { completed: true }), todo("old live")],
      people: [entity("old person", true)],
      sprints: [sprint("old sprint", { completed: true })],
    });

    expect(results.find((r) => r.title === "old done")?.muted).toBe(true);
    expect(results.find((r) => r.title === "old live")?.muted).toBe(false);
    expect(results.find((r) => r.title === "old person")?.muted).toBe(true);
    expect(results.find((r) => r.title === "old sprint")?.muted).toBe(true);
  });

  it("copes with collections that were not supplied", () => {
    expect(globalSearch("anything", {})).toEqual([]);
    expect(globalSearch("a", { todos: [todo("a")] })).toHaveLength(1);
  });

  it("finds nothing when nothing matches", () => {
    expect(globalSearch("zzz", { todos: [todo("alpha")], people: [entity("Marcel")] })).toEqual([]);
  });
});

describe("labelForKind", () => {
  it("names every kind", () => {
    expect(
      (["todo", "note", "person", "project", "sprint", "review"] as const).map(labelForKind),
    ).toEqual(["Task", "Note", "Person", "Project", "Sprint", "Review"]);
  });
});
