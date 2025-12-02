/**
 * Data migration utilities for localStorage
 * Ensures backward compatibility when data structures change
 */

import { Todo, TodoMetadata, TodoState } from "@/types/todo";
import { Settings, defaultSettings, Person, Project, Priority } from "@/types/settings";
import { autoBackupIfNeeded, cleanupOldBackups } from "./backup";

const CURRENT_VERSION = 4; // Increment when adding new migrations
const VERSION_KEY = "doit-data-version";

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
  if (!autoDeleteEnabled || todo.state !== "completed" || !todo.completedAt) {
    return false;
  }

  const daysSinceCompletion = (Date.now() - todo.completedAt) / (1000 * 60 * 60 * 24);
  return daysSinceCompletion >= deleteDays;
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
    } as TodoMetadata,
    // Ensure comments array exists
    comments: todo.comments || [],
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
  return {
    ...person,
    alternatives: person.alternatives || [],
    comments: person.comments || [],
  };
}

/**
 * Migrate a project to the current format
 */
function migrateProject(project: any): Project {
  return {
    ...project,
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
  return {
    ...defaultSettings,
    ...loadedSettings,
    people: (loadedSettings.people || defaultSettings.people).map(migratePerson),
    projects: (loadedSettings.projects || defaultSettings.projects).map(migrateProject),
    priorities: (loadedSettings.priorities || defaultSettings.priorities).map(migratePriority),
    linkPatterns: loadedSettings.linkPatterns || defaultSettings.linkPatterns,
    markerColors: {
      ...defaultSettings.markerColors,
      ...(loadedSettings.markerColors || {}),
    },
    general: {
      ...defaultSettings.general,
      ...(loadedSettings.general || {}),
      archiveDays: loadedSettings.general?.archiveDays ?? defaultSettings.general.archiveDays,
      autoDelete: {
        ...defaultSettings.general.autoDelete,
        ...(loadedSettings.general?.autoDelete || {}),
      },
      dateTime: {
        ...defaultSettings.general.dateTime,
        ...(loadedSettings.general?.dateTime || {}),
      },
      autoAssign: {
        ...defaultSettings.general.autoAssign,
        ...(loadedSettings.general?.autoAssign || {}),
      },
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
        console.log(`Removing deleted todo from storage: ${todo.id}`);
        return false;
      }
      // Remove todos that should be auto-deleted
      if (shouldDelete(todo, autoDelete.enabled, autoDelete.deleteDays)) {
        console.log(
          `Auto-deleting todo: ${todo.id} (completed ${Math.floor(
            (Date.now() - (todo.completedAt || 0)) / (1000 * 60 * 60 * 24),
          )} days ago)`,
        );
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
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;

    if (currentVersion < CURRENT_VERSION) {
      // Create auto-backup before migration if enabled
      autoBackupIfNeeded();

      localStorage.setItem(VERSION_KEY, CURRENT_VERSION.toString());
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
  localStorage.setItem(VERSION_KEY, "0");
}
