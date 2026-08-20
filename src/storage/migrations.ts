/**
 * Data migration utilities for storage
 * Ensures backward compatibility when data structures change
 */

import { Todo, TodoState } from "@/types/todo";
import { Settings, defaultSettings, defaultOneOnOneTemplate, defaultMeetingNoteTemplate } from "@/types/settings";
import { Person } from "@/types/person";
import { Project } from "@/types/project";
import { Priority } from "@/types/priority";
import { getTimestamp } from "@/types/time";
import { autoBackupIfNeeded, cleanupOldBackups } from "./backup";
import { STORAGE_KEYS, saveToStorage, loadFromStorage, getStorageAdapter } from "./storage";

const CURRENT_VERSION = 7; // Increment when adding new migrations

/**
 * Check if a todo should be archived based on settings
 */
function shouldArchive(todo: Todo, archiveDays: number): boolean {
  if (todo.state !== "completed" || !todo.completedAt) {
    return false;
  }

  const daysSinceCompletion = (Date.now() - todo.completedAt) / (1000 * 60 * 60 * 24);
  return daysSinceCompletion >= archiveDays;
}

/**
 * Check if a todo should be deleted based on settings
 */
function shouldDelete(todo: Todo, autoDeleteEnabled: boolean, deleteDays: number): boolean {
  if (!autoDeleteEnabled || (todo.state !== "completed" && todo.state !== "archived")) {
    return false;
  }

  // Use the appropriate timestamp based on state
  const timestamp = todo.state === "archived" ? todo.archivedAt || todo.completedAt : todo.completedAt;
  if (!timestamp) {
    return false;
  }

  const daysSinceTimestamp = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  return daysSinceTimestamp >= deleteDays;
}

/**
 * Migrate a todo to the current format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Migration handles legacy data with unknown shape
function migrateTodo(todo: any): Todo {
  // If todo already has a state field (v4+), use it
  let state: TodoState = todo.state || "active";
  const completedAt = todo.completedAt || null;
  let archivedAt = todo.archivedAt || null;
  const deletedAt = todo.deletedAt || null;

  // Only calculate state from legacy fields if state doesn't exist
  if (!todo.state) {
    if (todo.archived === true) {
      state = "archived";
      // Set archivedAt if not present
      if (!archivedAt && completedAt) {
        archivedAt = completedAt;
      }
    } else if (todo.completed === true) {
      state = "completed";
    }
  }

  // Extract metadata values from legacy metadata object or direct fields
  const metadata = todo.metadata || {};

  return {
    ...todo,
    state,
    // Ensure plainText exists
    plainText: todo.plainText || todo.text || "",
    // Direct fields (new format) - prefer direct fields, fallback to legacy metadata
    assignedPeople: todo.assignedPeople || metadata.assignedPeople || [],
    sourcePeople: todo.sourcePeople || metadata.sourcePeople || [],
    mentionedPeople: todo.mentionedPeople || metadata.mentionedPeople || [],
    projects: todo.projects || metadata.projects || [],
    dependencies: todo.dependencies || metadata.dependencies || [],
    tags: todo.tags || metadata.tags || [],
    priority: todo.priority || metadata.priority || metadata.priorities?.[0],
    dueDate: todo.dueDate || metadata.dueDate || metadata.dueDates?.[0],
    duration: todo.duration || metadata.duration || metadata.durations?.[0],
    recurring: todo.recurring || metadata.recurring,
    context: todo.context || metadata.context || "",
    sprint: todo.sprint || metadata.sprint,
    // Ensure comments array exists
    comments: todo.comments || [],
    // Ensure activity array exists
    activity: todo.activity || [],
    // Ensure subtasks array exists
    subtasks: todo.subtasks || [],
    // Ensure timestamps exist
    createdAt: todo.createdAt || Date.now(),
    updatedAt: todo.updatedAt || todo.createdAt || Date.now(),
    completedAt,
    archivedAt,
    deletedAt,
  };
}

/**
 * Migrate a person to the current format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Migration handles legacy data with unknown shape
function migratePerson(person: any): Person {
  const { imageUrl: _imageUrl, ...personWithoutImageUrl } = person;
  return {
    ...personWithoutImageUrl,
    alternatives: person.alternatives || [],
    comments: person.comments || [],
  };
}

/**
 * Migrate a project to the current format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Migration handles legacy data with unknown shape
function migrateProject(project: any): Project {
  const { imageUrl: _imageUrl, ...projectWithoutImageUrl } = project;
  return {
    ...projectWithoutImageUrl,
    alternatives: project.alternatives || [],
    comments: project.comments || [],
  };
}

/**
 * Migrate a priority to the current format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Migration handles legacy data with unknown shape
function migratePriority(priority: any): Priority {
  return {
    ...priority,
    alternatives: priority.alternatives || [],
    order: priority.order ?? 0,
    comments: priority.comments || [],
  };
}

/**
 * Migrate settings to the current format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Migration handles legacy data with unknown shape
export function migrateSettings(loadedSettings: any): Settings {
  // NOTE: people/projects living inside settings is a legacy shape. Moving
  // them to their own keys is handled by migrateLegacyEntitiesFromSettings,
  // which is awaited during bootstrap. Doing it here fired unawaited writes
  // from a synchronous function that raced useEntityManager's read of the
  // very same keys, and re-fired on every load because the legacy field was
  // never cleared.

  // Handle nested structure migration (old: general.dateTime, new: dateTime at top level)
  const dateTime = loadedSettings.dateTime || loadedSettings.general?.dateTime || {};
  const workHours = loadedSettings.workHours || loadedSettings.general?.workHours || {};
  const autoAssign = loadedSettings.autoAssign || loadedSettings.general?.autoAssign || {};
  const general = loadedSettings.general || {};

  // Migrate ganttSettings to gantt (v6 migration)
  const gantt = loadedSettings.gantt || loadedSettings.ganttSettings || {};

  // Remove startOfDay/endOfDay from dateTime if present (v5 migration)
  const { startOfDay: _startOfDay, endOfDay: _endOfDay, ...cleanedDateTime } = dateTime;

  // Legacy top-level keys that must not survive into the returned Settings.
  const {
    people: _legacyPeople,
    projects: _legacyProjects,
    ganttSettings: _legacyGantt,
    ...carriedOver
  } = loadedSettings;

  return {
    ...defaultSettings,
    // Carry over anything not explicitly normalised below. This used to be an
    // allow-list, which silently reset `backup` on every load and would have
    // done the same to any future field added to Settings without a matching
    // line here - something neither typecheck nor lint can catch.
    ...carriedOver,
    priorities: (loadedSettings.priorities || defaultSettings.priorities).map(migratePriority),
    linkPatterns: loadedSettings.linkPatterns || defaultSettings.linkPatterns,
    markerColors: {
      ...defaultSettings.markerColors,
      ...(loadedSettings.markerColors || {}),
    },
    general: {
      ...defaultSettings.general,
      archiveDays: general.archiveDays ?? defaultSettings.general.archiveDays,
      theme: general.theme ?? defaultSettings.general.theme,
      autoDelete: {
        ...defaultSettings.general.autoDelete,
        ...(general.autoDelete || {}),
      },
    },
    dateTime: {
      ...defaultSettings.dateTime,
      ...cleanedDateTime,
    },
    workHours: {
      ...defaultSettings.workHours,
      ...workHours,
    },
    gantt: {
      ...defaultSettings.gantt,
      ...gantt,
    },
    kanban: {
      ...defaultSettings.kanban,
      ...(loadedSettings.kanban || {}),
    },
    sprints: {
      ...defaultSettings.sprints,
      ...(loadedSettings.sprints || {}),
    },
    calendar: {
      ...defaultSettings.calendar,
      ...(loadedSettings.calendar || {}),
    },
    categories: loadedSettings.categories || defaultSettings.categories,
    notifications: {
      ...defaultSettings.notifications,
      ...(loadedSettings.notifications || {}),
    },
    autoAssign: {
      ...defaultSettings.autoAssign,
      ...autoAssign,
    },
    features: {
      ...defaultSettings.features,
      ...(loadedSettings.features || {}),
    },
    focus: {
      ...defaultSettings.focus,
      ...(loadedSettings.focus || {}),
    },
    notes: {
      ...defaultSettings.notes,
      ...(loadedSettings.notes || {}),
      // Ensure templates have defaults if not present (migration for existing users)
      oneOnOneTemplate: loadedSettings.notes?.oneOnOneTemplate || defaultOneOnOneTemplate,
      meetingNoteTemplate: loadedSettings.notes?.meetingNoteTemplate || defaultMeetingNoteTemplate,
    },
    backup: {
      ...defaultSettings.backup,
      ...(loadedSettings.backup || {}),
    },
  };
}

/**
 * Move people and projects out of the legacy `settings.people` /
 * `settings.projects` fields into their own storage keys.
 *
 * Awaited and one-shot: it merges into whatever is already stored (existing
 * records win) rather than overwriting, and strips the legacy fields from
 * doit-settings so it cannot re-fire on the next load.
 */
export async function migrateLegacyEntitiesFromSettings(): Promise<void> {
  const adapter = getStorageAdapter();
  const rawSettings = await adapter.getItem(STORAGE_KEYS.SETTINGS);
  if (!rawSettings) return;

  let stored: Record<string, unknown>;
  try {
    stored = JSON.parse(rawSettings);
  } catch {
    return;
  }
  if (stored === null || typeof stored !== "object") return;

  const hasLegacyPeople = Array.isArray(stored.people);
  const hasLegacyProjects = Array.isArray(stored.projects);
  if (!hasLegacyPeople && !hasLegacyProjects) return;

  const mergeInto = async <T extends { id: string }>(
    key: string,
    legacy: T[]
  ): Promise<void> => {
    const existing = await loadFromStorage<T[]>(key, []);
    const byId = new Map(legacy.map((entity) => [entity.id, entity]));
    // Existing records win - they are newer than the legacy copy.
    existing.forEach((entity: T) => byId.set(entity.id, entity));
    await saveToStorage(key, Array.from(byId.values()));
  };

  if (hasLegacyPeople) {
    await mergeInto(STORAGE_KEYS.PEOPLE, (stored.people as unknown[]).map(migratePerson));
  }
  if (hasLegacyProjects) {
    await mergeInto(STORAGE_KEYS.PROJECTS, (stored.projects as unknown[]).map(migrateProject));
  }

  delete stored.people;
  delete stored.projects;
  await saveToStorage(STORAGE_KEYS.SETTINGS, stored);
}

/**
 * Fix priority IDs that were incorrectly stored as priority names.
 * This happens when a todo was created with priority "high" and it was stored
 * as the ID instead of looking up the actual priority ID (e.g., "2").
 */
function fixPriorityId(todo: Todo, settings: Settings): Todo {
  if (!todo.priority) {
    return todo;
  }

  // Check if the priority is already a valid ID
  const isValidId = settings.priorities.some((p) => p.id === todo.priority);
  if (isValidId) {
    return todo;
  }

  // Priority looks like a name, try to find the matching priority by name or alternative
  const priorityName = (todo.priority as string).toLowerCase();
  const found = settings.priorities.find(
    (p) => p.name.toLowerCase() === priorityName || p.alternatives.some((alt) => alt.toLowerCase() === priorityName),
  );

  if (found) {
    return { ...todo, priority: found.id };
  }

  // No matching priority found, clear the invalid priority
  return { ...todo, priority: undefined };
}

/**
 * Migrate todos to the current format and apply archive/delete rules
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Migration handles legacy data with unknown shape
export function migrateTodos(loadedTodos: any[], settings: Settings): Todo[] {
  if (!Array.isArray(loadedTodos)) {
    return [];
  }

  const { archiveDays, autoDelete } = settings.general;

  return loadedTodos
    .map(migrateTodo)
    .filter((todo) => {
      // Remove todos that are marked as deleted
      if (todo.state === "deleted") {
        return false;
      }
      // Remove todos that should be auto-deleted
      if (shouldDelete(todo, autoDelete.enabled, autoDelete.deleteDays)) {
        return false;
      }
      return true;
    })
    .map((todo) => {
      // Fix priority IDs that were stored as names (v7 migration)
      let migratedTodo = fixPriorityId(todo, settings);

      // Apply archive state to completed todos that should be archived
      if (shouldArchive(migratedTodo, archiveDays) && migratedTodo.state === "completed") {
        migratedTodo = {
          ...migratedTodo,
          state: "archived" as TodoState,
          archivedAt: getTimestamp(Date.now()),
        };
      }
      return migratedTodo;
    });
}

/**
 * Check if migration is needed and update version
 */
export async function checkAndUpdateVersion(): Promise<boolean> {
  try {
    const adapter = getStorageAdapter();
    const storedVersionResult = await adapter.getItem(STORAGE_KEYS.VERSION);
    const storedVersion = typeof storedVersionResult === "string" ? storedVersionResult : null;
    const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;

    if (currentVersion > CURRENT_VERSION) {
      // Data written by a newer build. GitHub Pages caching means a user can
      // land on an older bundle after a deploy or rollback; writing this
      // version's shape over newer data would corrupt it.
      console.warn(
        `Stored data is version ${currentVersion} but this build understands ${CURRENT_VERSION}. ` +
          "Refusing to migrate; reload to pick up the newer build."
      );
      return false;
    }

    const migrationNeeded = currentVersion < CURRENT_VERSION;

    // Create auto-backup before migrating, and on ordinary loads too.
    await autoBackupIfNeeded();

    if (migrationNeeded) {
      await adapter.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION.toString());
    }

    await migrateLegacyEntitiesFromSettings();

    // Runs on every load, not just the no-migration branch - otherwise pruning
    // is skipped on exactly the load that just created a backup.
    await cleanupOldBackups();

    return migrationNeeded;
  } catch (error) {
    console.error("Failed to check data version:", error);
    return false;
  }
}

/**
 * Get the current data version
 */
export function getCurrentVersion(): number {
  return CURRENT_VERSION;
}

/**
 * Force migration of all data (useful for debugging)
 */
export function forceMigration(): void {
  localStorage.setItem(STORAGE_KEYS.VERSION, "0");
}
