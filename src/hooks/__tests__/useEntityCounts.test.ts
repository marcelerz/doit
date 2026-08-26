/**
 * @jest-environment jsdom
 */

/**
 * Tests for the People and Projects views' reference counts.
 *
 * These drove two forty-line memos in TodoApp with no coverage. The matching
 * is by name, not by key, because PersonId and ProjectId brand names -- so an
 * alternative spelling has to resolve to the same person, and a name nobody
 * owns has to resolve to nobody at all rather than throwing.
 */

import { renderHook } from "@testing-library/react";
import { usePersonCounts, useProjectCounts } from "../useEntityCounts";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { Person, getPersonId } from "@/types/person";
import { Project, getProjectId } from "@/types/project";
import { TodoModel } from "@/models/TodoModel";
import { NoteModel } from "@/models/NoteModel";

const person = (name: string, alternatives: string[] = []) =>
  new PersonModel({ id: getPersonId(name), name, alternatives, comments: [], activity: [] } as unknown as Person);

const project = (name: string, alternatives: string[] = []) =>
  new ProjectModel({ id: getProjectId(name), name, alternatives, comments: [], activity: [] } as unknown as Project);

/** A stand-in for a TodoModel: only the getters these hooks read. */
const todo = (fields: {
  active?: boolean;
  assigned?: string[];
  source?: string[];
  mentioned?: string[];
  projects?: string[];
}) =>
  ({
    isActive: fields.active ?? true,
    assignedPeople: fields.assigned ?? [],
    sourcePeople: fields.source ?? [],
    mentionedPeople: fields.mentioned ?? [],
    projects: fields.projects ?? [],
  }) as unknown as TodoModel;

const note = (fields: {
  archived?: boolean;
  assigned?: string[];
  source?: string[];
  mentioned?: string[];
  projects?: string[];
}) =>
  ({
    isArchived: fields.archived ?? false,
    assignedPeopleIds: fields.assigned ?? [],
    sourcePeopleIds: fields.source ?? [],
    mentionedPeopleIds: fields.mentioned ?? [],
    projectIds: fields.projects ?? [],
  }) as unknown as NoteModel;

const countsFor = (map: Map<string, unknown>, id: string) => map.get(id);

describe("usePersonCounts", () => {
  it("returns nothing when nobody is referenced", () => {
    const { result } = renderHook(() => usePersonCounts([todo({})], [], [person("Marcel")]));

    expect(result.current.size).toBe(0);
  });

  it("splits todos by state", () => {
    const { result } = renderHook(() =>
      usePersonCounts(
        [todo({ assigned: ["Marcel"] }), todo({ assigned: ["Marcel"], active: false })],
        [],
        [person("Marcel")],
      ),
    );

    expect(countsFor(result.current, "Marcel")).toEqual({
      activeTodos: 1,
      closedTodos: 1,
      activeNotes: 0,
      archivedNotes: 0,
    });
  });

  it("splits notes by archived", () => {
    const { result } = renderHook(() =>
      usePersonCounts([], [note({ assigned: ["Marcel"] }), note({ assigned: ["Marcel"], archived: true })], [
        person("Marcel"),
      ]),
    );

    expect(countsFor(result.current, "Marcel")).toMatchObject({ activeNotes: 1, archivedNotes: 1 });
  });

  it("counts each relationship separately on one todo", () => {
    const { result } = renderHook(() =>
      usePersonCounts([todo({ assigned: ["Marcel"], mentioned: ["Marcel"] })], [], [person("Marcel")]),
    );

    // Two, not one: the People view reports involvement, not how many distinct
    // todos carry the name.
    expect(countsFor(result.current, "Marcel")).toMatchObject({ activeTodos: 2 });
  });

  it("resolves an alternative name to the same person", () => {
    const { result } = renderHook(() =>
      usePersonCounts([todo({ assigned: ["Marcel E"] })], [], [person("Marcel", ["Marcel E"])]),
    );

    expect(countsFor(result.current, "Marcel")).toMatchObject({ activeTodos: 1 });
  });

  it("ignores a name nobody owns", () => {
    const { result } = renderHook(() => usePersonCounts([todo({ assigned: ["Nobody"] })], [], [person("Marcel")]));

    expect(result.current.size).toBe(0);
  });

  it("keeps two people apart", () => {
    const { result } = renderHook(() =>
      usePersonCounts([todo({ assigned: ["Marcel"], source: ["Ada"] })], [], [person("Marcel"), person("Ada")]),
    );

    expect(countsFor(result.current, "Marcel")).toMatchObject({ activeTodos: 1 });
    expect(countsFor(result.current, "Ada")).toMatchObject({ activeTodos: 1 });
  });
});

describe("useProjectCounts", () => {
  it("counts todos and notes against a project", () => {
    const { result } = renderHook(() =>
      useProjectCounts(
        [todo({ projects: ["Website"] }), todo({ projects: ["Website"], active: false })],
        [note({ projects: ["Website"] })],
        [project("Website")],
      ),
    );

    expect(countsFor(result.current, "Website")).toEqual({
      activeTodos: 1,
      closedTodos: 1,
      activeNotes: 1,
      archivedNotes: 0,
    });
  });

  it("resolves an alternative project name", () => {
    const { result } = renderHook(() =>
      useProjectCounts([todo({ projects: ["site"] })], [], [project("Website", ["site"])]),
    );

    expect(countsFor(result.current, "Website")).toMatchObject({ activeTodos: 1 });
  });

  it("ignores a project nobody owns", () => {
    const { result } = renderHook(() => useProjectCounts([todo({ projects: ["Ghost"] })], [], [project("Website")]));

    expect(result.current.size).toBe(0);
  });
});
