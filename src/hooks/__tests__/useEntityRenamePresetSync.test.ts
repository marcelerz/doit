/**
 * @jest-environment jsdom
 */

/**
 * Tests for keeping saved presets in step with a rename.
 *
 * The presets are rewritten in storage, but a mounted view holds them in state.
 * Without this the stale copy is applied on the next preset click, and written
 * back over the storage rewrite on the next add or delete.
 */

import { renderHook, act } from "@testing-library/react";
import { useEntityRenamePresetSync } from "@/hooks/useEntityRenamePresetSync";
import { ENTITY_RENAMED_EVENT } from "@/storage/renameInStoredFilters";

function announce(kind: "person" | "project", previousName: string, nextName: string) {
  window.dispatchEvent(new CustomEvent(ENTITY_RENAMED_EVENT, { detail: { kind, previousName, nextName } }));
}

describe("useEntityRenamePresetSync", () => {
  it("renames the entity inside every preset that referenced it", () => {
    let presets = [
      { name: "Mine", filters: { assignedPeople: ["Marcel"], projects: [] } },
      { name: "Theirs", filters: { assignedPeople: ["John"], projects: [] } },
    ];
    const setPresets = jest.fn((updater) => {
      presets = updater(presets);
    });

    renderHook(() => useEntityRenamePresetSync(setPresets));
    act(() => announce("person", "Marcel", "Marcel Erz"));

    expect(presets[0].filters.assignedPeople).toEqual(["Marcel Erz"]);
    expect(presets[1].filters.assignedPeople).toEqual(["John"]);
  });

  it("renames projects without touching a person of the same name", () => {
    let presets = [{ name: "P", filters: { assignedPeople: ["Web"], projects: ["Web"] } }];
    const setPresets = jest.fn((updater) => {
      presets = updater(presets);
    });

    renderHook(() => useEntityRenamePresetSync(setPresets));
    act(() => announce("project", "Web", "Web Redesign"));

    expect(presets[0].filters.projects).toEqual(["Web Redesign"]);
    expect(presets[0].filters.assignedPeople).toEqual(["Web"]);
  });

  it("tolerates a preset shape missing some reference fields", () => {
    // Kanban presets carry only assignedPeople and projects.
    let presets = [{ name: "K", filters: { assignedPeople: ["Marcel"] } }];
    const setPresets = jest.fn((updater) => {
      presets = updater(presets);
    });

    renderHook(() => useEntityRenamePresetSync(setPresets));
    act(() => announce("person", "Marcel", "Marc"));

    expect(presets[0].filters.assignedPeople).toEqual(["Marc"]);
  });

  it("leaves the array identity alone when no preset referenced the entity", () => {
    const original = [{ name: "Mine", filters: { assignedPeople: ["John"] } }];
    let presets = original;
    const setPresets = jest.fn((updater) => {
      presets = updater(presets);
    });

    renderHook(() => useEntityRenamePresetSync(setPresets));
    act(() => announce("person", "Marcel", "Marc"));

    expect(presets).toBe(original);
  });

  it("stops listening once unmounted", () => {
    const setPresets = jest.fn();
    const { unmount } = renderHook(() => useEntityRenamePresetSync(setPresets));

    unmount();
    act(() => announce("person", "Marcel", "Marc"));

    expect(setPresets).not.toHaveBeenCalled();
  });
});
