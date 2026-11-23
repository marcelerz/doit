/**
 * The storage key registry.
 *
 * Every name under which the app persists something is defined here and
 * nowhere else. storage.ts re-exports all of it, and that is where application
 * code should keep importing from.
 *
 * It is a separate module because it has to be importable from places that
 * must not load the storage layer: the server-rendered layout, which inlines
 * the settings key into its theme script, the logger, which storage.ts itself
 * imports, and the end-to-end tests, which run in Node. So this file has no
 * imports and touches nothing at load time.
 */

// Storage key prefix - all app data keys start with this
export const STORAGE_KEY_PREFIX = "doit-";

// Backup key prefix - for auto-backup and manual backup storage
export const BACKUP_KEY_PREFIX = "doit-backup-";

/** Written to IndexedDB once the data in localStorage has been moved there. */
export const MIGRATED_TO_INDEXEDDB_KEY = "doit-migrated-to-indexeddb";

/** A throwaway database, opened only to find out whether IndexedDB works. */
export const INDEXEDDB_PROBE_DB = "doit-test-availability";

/** The IndexedDB database that holds the app's data, and its one object store. */
export const DB_NAME = "doit-db";
export const STORE_NAME = "keyvalue";

/** Keys under the doit- prefix that are bookkeeping, not user data. */
export const INTERNAL_STORAGE_KEYS = new Set([MIGRATED_TO_INDEXEDDB_KEY, INDEXEDDB_PROBE_DB, DB_NAME]);

// Storage keys - centralized registry of all storage keys
export const STORAGE_KEYS = {
  TODOS: "doit-todos",
  NOTES: "doit-notes",
  REVIEWS: "doit-reviews",
  PEOPLE: "doit-people",
  PROJECTS: "doit-projects",
  SPRINTS: "doit-sprints",
  SETTINGS: "doit-settings",
  VERSION: "doit-version",
  VIEW_PRESETS: "doit-view-presets",
  VIEW_OPTIONS: "doit-view-options",
  GANTT_VIEW_OPTIONS: "doit-gantt-view-options",
  CALENDAR_VIEW_OPTIONS: "doit-calendar-view-options",
  KANBAN_VIEW_OPTIONS: "doit-kanban-view-options",
  NOTES_VIEW_OPTIONS: "doit-notes-view-options",
  REVIEWS_VIEW_OPTIONS: "doit-reviews-view-options",
  TIME_REPORT_OPTIONS: "doit-time-report-options",
  PEOPLE_VIEW_OPTIONS: "doit-people-view-options",
  PROJECTS_VIEW_OPTIONS: "doit-projects-view-options",
  SPRINTS_VIEW_OPTIONS: "doit-sprints-view-options",
  UI_OPTIONS: "doit-ui-options",
  BACKUP_SETTINGS: "doit-backup-settings",
  TEMPLATES: "doit-templates",
  SEARCH_HISTORY: "doit-search-history",
  SELECTION_HISTORY: "doit-selection-history",
  TUTORIAL_PREFERENCES: "doit-tutorial-preferences",
  KANBAN_FILTER_PRESETS: "doit-kanban-filter-presets",
  NOTES_VIEW_PRESETS: "doit-notes-view-presets",
  NOTIFIED_TASKS: "doit-notified-tasks",
  FOCUS_SESSION: "doit-focus-session",
  FOCUS_SESSION_LOG: "doit-focus-sessions",
} as const;
