/**
 * Data migration utilities for storage
 * Ensures backward compatibility when data structures change
 */

import { Todo, TodoMetadata, TodoState } from "@/types/todo";
import { Settings, defaultSettings, Person, Project, Priority } from "@/types/settings";
import { autoBackupIfNeeded, cleanupOldBackups } from "./backup";
import { STORAGE_KEYS, saveToStorage, getStorageAdapter } from "./storage";

const CURRENT_VERSION = 5; // Increment when adding new migrations

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
function migrateTodo(todo: any): Todo {
  // If todo already has a state field (v4+), use it
  let state: TodoState = todo.state || "active";
  let completedAt = todo.completedAt || null;
  let archivedAt = todo.archivedAt || null;
  let deletedAt = todo.deletedAt || null;

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

  return {
    ...todo,
    state,
    // Ensure plainText exists
    plainText: todo.plainText || todo.text || "",
    // Ensure metadata exists with all required fields
    metadata: {
      assignedPeople: todo.metadata?.assignedPeople || [],
      sourcePeople: todo.metadata?.sourcePeople || [],
      mentionedPeople: todo.metadata?.mentionedPeople || [],
      projects: todo.metadata?.projects || [],
      dependencies: todo.metadata?.dependencies || [],
      priority: todo.metadata?.priority || todo.metadata?.priorities?.[0],
      dueDate: todo.metadata?.dueDate || todo.metadata?.dueDates?.[0],
      duration: todo.metadata?.duration || todo.metadata?.durations?.[0],
      recurring: todo.metadata?.recurring,
      context: todo.metadata?.context,
      tags: todo.metadata?.tags || [],
      sprint: todo.metadata?.sprint,
    } as TodoMetadata,
    // Ensure comments array exists
    comments: todo.comments || [],
    // Ensure activity array exists
    activity: todo.activity || [],
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
function migratePerson(person: any): Person {
  const { imageUrl, ...personWithoutImageUrl } = person;
  return {
    ...personWithoutImageUrl,
    alternatives: person.alternatives || [],
    comments: person.comments || [],
  };
}

/**
 * Migrate a project to the current format
 */
function migrateProject(project: any): Project {
  const { imageUrl, ...projectWithoutImageUrl } = project;
  return {
    ...projectWithoutImageUrl,
    alternatives: project.alternatives || [],
    comments: project.comments || [],
  };
}

/**
 * Migrate a priority to the current format
 */
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
export function migrateSettings(loadedSettings: any): Settings {
  // Migrate people and projects to separate storage if they exist in settings
  if (loadedSettings.people && Array.isArray(loadedSettings.people)) {
    const migratedPeople = loadedSettings.people.map(migratePerson);
    saveToStorage(STORAGE_KEYS.PEOPLE, migratedPeople);
  }

  if (loadedSettings.projects && Array.isArray(loadedSettings.projects)) {
    const migratedProjects = loadedSettings.projects.map(migrateProject);
    saveToStorage(STORAGE_KEYS.PROJECTS, migratedProjects);
  }

  // Handle nested structure migration (old: general.dateTime, new: dateTime at top level)
  const dateTime = loadedSettings.dateTime || loadedSettings.general?.dateTime || {};
  const workHours = loadedSettings.workHours || loadedSettings.general?.workHours || {};
  const autoAssign = loadedSettings.autoAssign || loadedSettings.general?.autoAssign || {};
  const general = loadedSettings.general || {};

  // Migrate ganttSettings to gantt (v6 migration)
  const gantt = loadedSettings.gantt || loadedSettings.ganttSettings || {};

  // Remove startOfDay/endOfDay from dateTime if present (v5 migration)
  const { startOfDay, endOfDay, ...cleanedDateTime } = dateTime;

  return {
    ...defaultSettings,
    priorities: (loadedSettings.priorities || defaultSettings.priorities).map(migratePriority),
    linkPatterns: loadedSettings.linkPatterns || defaultSettings.linkPatterns,
    markerColors: {
      ...defaultSettings.markerColors,
      ...(loadedSettings.markerColors || {}),
    },
    general: {
      ...defaultSettings.general,
      archiveDays: general.archiveDays ?? defaultSettings.general.archiveDays,
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
  };
}

/**
 * Migrate todos to the current format and apply archive/delete rules
 */
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
      // Apply archive state to completed todos that should be archived
      if (shouldArchive(todo, archiveDays) && todo.state === "completed") {
        return {
          ...todo,
          state: "archived" as TodoState,
          archivedAt: Date.now(),
        };
      }
      return todo;
    });
}

/**
 * Check if migration is needed and update version
 */
export function checkAndUpdateVersion(): boolean {
  try {
    const adapter = getStorageAdapter();
    const storedVersionResult = adapter.getItem(STORAGE_KEYS.VERSION);
    const storedVersion = typeof storedVersionResult === "string" ? storedVersionResult : null;
    const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;

    if (currentVersion < CURRENT_VERSION) {
      // Create auto-backup before migration if enabled
      autoBackupIfNeeded();

      adapter.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION.toString());
      return true; // Migration needed
    }

    // Even if no migration needed, check for auto-backup
    autoBackupIfNeeded();

    // Cleanup old backups
    cleanupOldBackups();

    return false; // No migration needed
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
