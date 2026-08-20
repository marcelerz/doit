/**
 * Tests for the view registry.
 *
 * The registry exists because a view's identity used to live in several
 * hand-maintained lists that drifted apart: the digit shortcuts omitted Notes,
 * Reviews and Time, so "5" selected People while the fifth visible tab was
 * Notes. These tests pin the invariant that made that possible.
 */

import { VIEW_DEFINITIONS, getEnabledViews, ViewTab } from "@/types/viewRegistry";
import { FeatureSettings } from "@/types/settings";

const allFeatures = (value: boolean): FeatureSettings => ({
  ganttView: value,
  calendarView: value,
  kanbanView: value,
  notesView: value,
  sprintsView: value,
  reviewsView: value,
  statsView: value,
  templates: value,
  batchProcessing: value,
  reordering: value,
  exports: value,
  focusMode: value,
  timeTracking: value,
});

describe("VIEW_DEFINITIONS", () => {
  it("has no duplicate ids", () => {
    const ids = VIEW_DEFINITIONS.map((view) => view.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every member of the ViewTab union", () => {
    const expected: ViewTab[] = [
      "list",
      "kanban",
      "gantt",
      "calendar",
      "notes",
      "people",
      "projects",
      "sprints",
      "reviews",
      "stats",
      "timereports",
    ];
    expect(VIEW_DEFINITIONS.map((view) => view.id)).toEqual(expected);
  });

  it("gives every view a label", () => {
    for (const view of VIEW_DEFINITIONS) {
      expect(view.label).not.toBe("");
    }
  });
});

describe("getEnabledViews", () => {
  it("returns every view when all features are on", () => {
    expect(getEnabledViews(allFeatures(true))).toHaveLength(VIEW_DEFINITIONS.length);
  });

  it("returns only the unflagged views when all features are off", () => {
    const enabled = getEnabledViews(allFeatures(false)).map((view) => view.id);
    expect(enabled).toEqual(["list", "people", "projects"]);
  });

  it("treats undefined features as everything disabled", () => {
    expect(getEnabledViews(undefined).map((view) => view.id)).toEqual(["list", "people", "projects"]);
  });

  it("preserves registry order when some views are hidden", () => {
    const features = { ...allFeatures(false), notesView: true, statsView: true };
    // Notes sits between Calendar and People in the registry, so it must come
    // before People here - this ordering is exactly what the digit shortcuts
    // index into.
    expect(getEnabledViews(features).map((view) => view.id)).toEqual([
      "list",
      "notes",
      "people",
      "projects",
      "stats",
    ]);
  });

  it("puts Notes at position 5 when the default-ish view set is enabled", () => {
    // The regression this registry fixes: the old shortcut list skipped Notes,
    // so pressing "5" selected People instead.
    const features = {
      ...allFeatures(false),
      kanbanView: true,
      ganttView: true,
      calendarView: true,
      notesView: true,
    };
    expect(getEnabledViews(features)[4].id).toBe("notes");
  });
});
