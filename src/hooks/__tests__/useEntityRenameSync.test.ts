/**
 * @jest-environment jsdom
 */

/**
 * Tests for keeping a mounted view's filters in step with a rename.
 *
 * Saved filters are rewritten in storage, but a view that is currently mounted
 * holds its filters in React state and would write that stale copy back over
 * the rewrite. This hook remaps what it is holding when the rename is
 * announced.
 */

import { renderHook, act } from "@testing-library/react";
import { useEntityRenameSync } from "@/hooks/useEntityRenameSync";
import { ENTITY_RENAMED_EVENT } from "@/storage/renameInStoredFilters";

function announce(kind: "person" | "project", previousName: string, nextName: string) {
  window.dispatchEvent(
    new CustomEvent(ENTITY_RENAMED_EVENT, { detail: { kind, previousName, nextName } }),
  );
}

describe("useEntityRenameSync", () => {
  it("renames the entry inside a person filter set", () => {
    let filters = { assignedPeople: new Set(["Marcel", "John"]), projects: new Set<string>() };
    const setFilters = jest.fn((updater) => {
      filters = updater(filters);
    });

    renderHook(() => useEntityRenameSync(setFilters));
    act(() => announce("person", "Marcel", "Marcel Erz"));

    expect([...filters.assignedPeople].sort()).toEqual(["John", "Marcel Erz"]);
  });

  it("renames a project without touching people", () => {
    let filters = { assignedPeople: new Set(["Website"]), projects: new Set(["Website"]) };
    const setFilters = jest.fn((updater) => {
      filters = updater(filters);
    });

    renderHook(() => useEntityRenameSync(setFilters));
    act(() => announce("project", "Website", "Web Redesign"));

    expect([...filters.projects]).toEqual(["Web Redesign"]);
    // a person who happens to share the name is left alone
    expect([...filters.assignedPeople]).toEqual(["Website"]);
  });

  it("leaves the object identity alone when nothing referenced the entity", () => {
    const original = { assignedPeople: new Set(["John"]) };
    let filters = original;
    const setFilters = jest.fn((updater) => {
      filters = updater(filters);
    });

    renderHook(() => useEntityRenameSync(setFilters));
    act(() => announce("person", "Marcel", "Marcel Erz"));

    expect(filters).toBe(original);
  });

  it("stops listening once unmounted", () => {
    const setFilters = jest.fn();
    const { unmount } = renderHook(() => useEntityRenameSync(setFilters));

    unmount();
    act(() => announce("person", "Marcel", "Marcel Erz"));

    expect(setFilters).not.toHaveBeenCalled();
  });
});
