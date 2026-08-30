/**
 * @jest-environment jsdom
 */

/**
 * Tests for rewriting saved filters when an entity is renamed.
 *
 * These live in storage because the state that owns them -- list, notes and
 * kanban filters and presets -- is not reachable from where a rename happens.
 * A view that is mounted would still write its in-memory copy back over the
 * rewrite, so the pass also emits an event those views listen for.
 */

import { renameInStoredFilters, ENTITY_RENAMED_EVENT } from "@/storage/renameInStoredFilters";
import { loadFromStorage, saveToStorage } from "@/storage/storage";

jest.mock("@/storage/storage", () => ({
  STORAGE_KEYS: {
    VIEW_PRESETS: "doit-view-presets",
    VIEW_OPTIONS: "doit-view-options",
    NOTES_VIEW_PRESETS: "doit-notes-view-presets",
    NOTES_VIEW_OPTIONS: "doit-notes-view-options",
    KANBAN_FILTER_PRESETS: "doit-kanban-filter-presets",
    KANBAN_VIEW_OPTIONS: "doit-kanban-view-options",
    SELECTION_HISTORY: "doit-selection-history",
  },
  loadFromStorage: jest.fn(),
  saveToStorage: jest.fn().mockResolvedValue(true),
}));

const mockLoad = loadFromStorage as jest.MockedFunction<typeof loadFromStorage>;
const mockSave = saveToStorage as jest.MockedFunction<typeof saveToStorage>;

/** Return `value` for one key and null for everything else. */
function only(key: string, value: unknown) {
  mockLoad.mockImplementation(async (k: string) => (k === key ? value : null) as never);
}

describe("renameInStoredFilters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoad.mockResolvedValue(null as never);
  });

  it("rewrites the filters saved on a view's options", async () => {
    only("doit-view-options", { filters: { assignedPeople: ["Marcel"], projects: [] } });

    await renameInStoredFilters("person", "Marcel", "Marcel Erz");

    expect(mockSave).toHaveBeenCalledWith("doit-view-options", {
      filters: { assignedPeople: ["Marcel Erz"], projects: [] },
    });
  });

  it("rewrites every preset in a stored array", async () => {
    only("doit-view-presets", [
      { name: "Mine", filters: { assignedPeople: ["Marcel"] } },
      { name: "Theirs", filters: { assignedPeople: ["John"] } },
    ]);

    await renameInStoredFilters("person", "Marcel", "Marcel Erz");

    expect(mockSave).toHaveBeenCalledWith("doit-view-presets", [
      { name: "Mine", filters: { assignedPeople: ["Marcel Erz"] } },
      { name: "Theirs", filters: { assignedPeople: ["John"] } },
    ]);
  });

  it("rewrites project filters on the kanban board", async () => {
    only("doit-kanban-view-options", { filters: { assignedPeople: [], projects: ["Website"] } });

    await renameInStoredFilters("project", "Website", "Web Redesign");

    expect(mockSave).toHaveBeenCalledWith("doit-kanban-view-options", {
      filters: { assignedPeople: [], projects: ["Web Redesign"] },
    });
  });

  it("does not write a key that never referenced the entity", async () => {
    only("doit-view-options", { filters: { assignedPeople: ["Someone Else"] } });

    await renameInStoredFilters("person", "Marcel", "Marcel Erz");

    expect(mockSave).not.toHaveBeenCalledWith("doit-view-options", expect.anything());
  });

  it("rewrites selection history, which drives pick-list ordering", async () => {
    only("doit-selection-history", {
      assignedPeople: [{ value: "Marcel", count: 3 }],
      projects: [{ value: "Website", count: 1 }],
    });

    await renameInStoredFilters("person", "Marcel", "Marcel Erz");

    expect(mockSave).toHaveBeenCalledWith("doit-selection-history", {
      assignedPeople: [{ value: "Marcel Erz", count: 3 }],
      projects: [{ value: "Website", count: 1 }],
    });
  });

  it("announces the rename so mounted views can remap what they hold", async () => {
    const listener = jest.fn();
    window.addEventListener(ENTITY_RENAMED_EVENT, listener);

    await renameInStoredFilters("person", "Marcel", "Marcel Erz");

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      kind: "person",
      previousName: "Marcel",
      nextName: "Marcel Erz",
    });
    window.removeEventListener(ENTITY_RENAMED_EVENT, listener);
  });
});
