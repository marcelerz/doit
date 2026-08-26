/**
 * @jest-environment jsdom
 */

/**
 * Characterization tests for useNotesViewState.
 *
 * The sibling of useListViewState, and until now equally uncovered: 700 lines
 * driving filtering, sorting and grouping for the notes view. These pin the
 * behaviour that exists so the duplication it shares with the list hook can be
 * extracted against something. They describe what the hook does, not how.
 */

import { renderHook, act } from "@testing-library/react";
import { useNotesViewState } from "../useNotesViewState";
import { NoteModel } from "@/models/NoteModel";
import { ProjectModel } from "@/models/ProjectModel";
import { SettingsModel, createSettingsModel, resetSettingsModel_DONOTUSE } from "@/models/SettingsModel";
import { defaultSettings } from "@/types/settings";
import { Note, getNoteId } from "@/types/note";
import { getTag } from "@/types/todo";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import { getTimestamp } from "@/types/time";

let settingsModel: SettingsModel;
beforeEach(() => {
  resetSettingsModel_DONOTUSE();
  settingsModel = createSettingsModel(defaultSettings);
  localStorage.clear();
});

const daysFromNow = (days: number): number => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.getTime();
};

const makeNote = (overrides: { id: string } & Partial<Omit<Note, "id">>): NoteModel => {
  const { id, ...rest } = overrides;
  const raw = {
    text: overrides.text ?? overrides.id,
    plainText: overrides.plainText ?? overrides.text ?? overrides.id,
    state: "active",
    content: "",
    createdAt: getTimestamp(daysFromNow(-30)),
    updatedAt: getTimestamp(daysFromNow(-30)),
    tags: [],
    pinned: false,
    assignedPeople: [],
    sourcePeople: [],
    mentionedPeople: [],
    projects: [],
    actionItems: [],
    createdActionItems: [],
    comments: [],
    activity: [],
    ...rest,
    id: getNoteId(id),
  } as unknown as Note;
  return new NoteModel(raw, settingsModel);
};

const mount = (notes: NoteModel[], projects: ProjectModel[] = []) =>
  renderHook(() => useNotesViewState({ notes, projects, people: [] }));

describe("initial state", () => {
  it("starts unfiltered, sorted by modified, ungrouped", () => {
    const { result } = mount([]);

    expect(result.current.sortField).toBe("modified");
    expect(result.current.groupBy).toBe("none");
    expect(result.current.activeQuickFilter).toBe("all");
    expect(result.current.hasActiveFilters).toBe(false);
  });
});

describe("applyFilters", () => {
  it("returns everything when nothing is filtered", () => {
    const notes = [makeNote({ id: "a" }), makeNote({ id: "b" })];
    const { result } = mount(notes);

    expect(result.current.applyFilters(notes)).toHaveLength(2);
  });

  it("filters by search text, case-insensitively", () => {
    const notes = [makeNote({ id: "a", plainText: "Meeting notes" }), makeNote({ id: "b", plainText: "Shopping" })];
    const { result } = mount(notes);

    act(() => result.current.setFilters({ ...result.current.filters, searchText: "meeting" }));

    expect(result.current.applyFilters(notes).map((n) => n.id)).toEqual(["a"]);
  });

  it("filters by tag", () => {
    const notes = [makeNote({ id: "a", tags: [getTag("work")] }), makeNote({ id: "b", tags: [getTag("home")] })];
    const { result } = mount(notes);

    act(() =>
      result.current.setFilters({ ...result.current.filters, tags: new Set([getTag("work")]) }),
    );

    expect(result.current.applyFilters(notes).map((n) => n.id)).toEqual(["a"]);
  });

  it("filters by assigned person", () => {
    const notes = [
      makeNote({ id: "a", assignedPeople: [getPersonId("Marcel")] }),
      makeNote({ id: "b" }),
    ];
    const { result } = mount(notes);

    act(() =>
      result.current.setFilters({ ...result.current.filters, assignedPeople: new Set([getPersonId("Marcel")]) }),
    );

    expect(result.current.applyFilters(notes).map((n) => n.id)).toEqual(["a"]);
  });

  it("filters by project", () => {
    const notes = [makeNote({ id: "a", projects: [getProjectId("Website")] }), makeNote({ id: "b" })];
    const { result } = mount(notes);

    act(() =>
      result.current.setFilters({ ...result.current.filters, projects: new Set([getProjectId("Website")]) }),
    );

    expect(result.current.applyFilters(notes).map((n) => n.id)).toEqual(["a"]);
  });

  it("reports when a filter is active", () => {
    const { result } = mount([]);
    expect(result.current.hasActiveFilters).toBe(false);

    act(() => result.current.setFilters({ ...result.current.filters, searchText: "x" }));
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => result.current.handleClearAllFilters());
    expect(result.current.hasActiveFilters).toBe(false);
  });
});

describe("sortNotes", () => {
  it("sorts by title, and reverses on direction", () => {
    const notes = [makeNote({ id: "b", plainText: "Beta" }), makeNote({ id: "a", plainText: "Alpha" })];
    const { result } = mount(notes);

    // The notes view defaults to descending, unlike the list view.
    act(() => result.current.setSortField("title"));
    expect(result.current.sortNotes(notes).map((n) => n.id)).toEqual(["b", "a"]);

    act(() => result.current.setSortDirection("asc"));
    expect(result.current.sortNotes(notes).map((n) => n.id)).toEqual(["a", "b"]);
  });

  it("puts pinned notes first regardless of the sort field", () => {
    const notes = [
      makeNote({ id: "plain", plainText: "Alpha" }),
      makeNote({ id: "pinned", plainText: "Zulu", pinned: true }),
    ];
    const { result } = mount(notes);

    act(() => result.current.setSortField("title"));

    // A pinned pre-pass runs ahead of the chosen field; this is deliberate and
    // is why the notes sort must not be merged with the todo one.
    expect(result.current.sortNotes(notes)[0].id).toBe("pinned");
  });

  it("ignores sort direction for the pinned field itself", () => {
    const notes = [makeNote({ id: "plain" }), makeNote({ id: "pinned", pinned: true })];
    const { result } = mount(notes);

    act(() => result.current.setSortField("pinned"));
    const ascending = result.current.sortNotes(notes).map((n) => n.id);

    act(() => result.current.setSortDirection("desc"));
    expect(result.current.sortNotes(notes).map((n) => n.id)).toEqual(ascending);
  });

  it("orders manual sort by sortOrder, with unset last", () => {
    const notes = [
      makeNote({ id: "none" }),
      makeNote({ id: "second", sortOrder: 1 }),
      makeNote({ id: "first", sortOrder: 0 }),
    ];
    const { result } = mount(notes);

    act(() => {
      result.current.setSortField("manual");
      result.current.setSortDirection("asc");
    });
    expect(result.current.sortNotes(notes).map((n) => n.id)).toEqual(["first", "second", "none"]);
  });
});

describe("groupNotes", () => {
  it("returns a single group when grouping is off", () => {
    const notes = [makeNote({ id: "a" }), makeNote({ id: "b" })];
    const { result } = mount(notes);

    const groups = result.current.groupNotes(notes);
    expect(Object.values(groups).flat()).toHaveLength(2);
  });

  it("groups by project, and keeps notes with none", () => {
    const notes = [makeNote({ id: "a", projects: [getProjectId("Website")] }), makeNote({ id: "b" })];
    const { result } = mount(notes);

    act(() => result.current.setGroupBy("project"));
    const groups = result.current.groupNotes(notes);

    expect(Object.values(groups).flat()).toHaveLength(2);
  });

  it("groups by tag", () => {
    const notes = [makeNote({ id: "a", tags: [getTag("work")] }), makeNote({ id: "b" })];
    const { result } = mount(notes);

    act(() => result.current.setGroupBy("tags"));
    expect(Object.values(result.current.groupNotes(notes)).flat()).toHaveLength(2);
  });
});

describe("quickFilterCounts", () => {
  it("counts pinned and archived separately from all", () => {
    const notes = [
      makeNote({ id: "plain" }),
      makeNote({ id: "pinned", pinned: true }),
      makeNote({ id: "archived", state: "archived" }),
    ];
    const { result } = mount(notes);

    const counts = result.current.quickFilterCounts;
    expect(counts.pinned).toBe(1);
    expect(counts.archived).toBe(1);
    expect(counts.all).toBeGreaterThan(0);
  });
});

describe("section state", () => {
  it("keeps a stable setter identity across renders", () => {
    const { result, rerender } = mount([]);
    const first = result.current.setFilters;
    rerender();
    expect(result.current.setFilters).toBe(first);
  });

  it("toggles the expanded sections", () => {
    const { result } = mount([]);
    const before = result.current.activeExpanded;

    act(() => result.current.setActiveExpanded(!before));
    expect(result.current.activeExpanded).toBe(!before);
  });
});
