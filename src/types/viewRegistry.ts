import { FeatureSettings } from "@/types/settings";

/**
 * The application's views, in the order they appear as tabs.
 *
 * A view's identity used to be spread across separate hand-maintained lists -
 * the tab config, the keyboard-shortcut list, the feature map, the tutorial
 * switch - and they had drifted: the digit shortcuts skipped Notes, Reviews
 * and Time, so pressing "5" selected People while the fifth visible tab was
 * Notes. Anything that needs to know the set or order of views reads it here.
 *
 * Icons stay with ViewTabs, which is the only place that renders them.
 */
export type ViewTab =
  | "list"
  | "kanban"
  | "gantt"
  | "calendar"
  | "notes"
  | "people"
  | "projects"
  | "sprints"
  | "reviews"
  | "stats"
  | "timereports";

export interface ViewDefinition {
  id: ViewTab;
  label: string;
  testId?: string;
  /** When set, the view is only available if this feature is enabled. */
  featureFlag?: keyof FeatureSettings;
}

/** Ordered. Tab order and keyboard-shortcut order are the same thing. */
export const VIEW_DEFINITIONS: readonly ViewDefinition[] = [
  { id: "list", label: "Todos", testId: "view-tab-list" },
  { id: "kanban", label: "Kanban", testId: "view-tab-kanban", featureFlag: "kanbanView" },
  { id: "gantt", label: "Gantt", testId: "view-tab-gantt", featureFlag: "ganttView" },
  { id: "calendar", label: "Calendar", testId: "view-tab-calendar", featureFlag: "calendarView" },
  { id: "notes", label: "Notes", testId: "view-tab-notes", featureFlag: "notesView" },
  { id: "people", label: "People", testId: "view-tab-people" },
  { id: "projects", label: "Projects", testId: "view-tab-projects" },
  { id: "sprints", label: "Sprints", featureFlag: "sprintsView" },
  { id: "reviews", label: "Reviews", testId: "view-tab-reviews", featureFlag: "reviewsView" },
  { id: "stats", label: "Stats", featureFlag: "statsView" },
  { id: "timereports", label: "Time", featureFlag: "timeTracking" },
];

/**
 * The views currently available, in tab order.
 *
 * This is the list the tab bar renders and the list the digit shortcuts index
 * into, so the two cannot drift apart again.
 */
export function getEnabledViews(features: FeatureSettings | undefined): ViewDefinition[] {
  return VIEW_DEFINITIONS.filter(
    (view) => view.featureFlag === undefined || features?.[view.featureFlag] === true
  );
}
