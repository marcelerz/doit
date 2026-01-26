/**
 * List View Utility Functions
 *
 * Pure business logic extracted from ListView.tsx for better testability.
 */

import { TodoModel } from "@/models/TodoModel";
import { TodoMetadata } from "@/types/todo";

/**
 * Parse a date value as a local date
 * Handles both YYYY-MM-DD strings (parsed as local) and timestamps (numbers)
 */
function parseLocalDate(dateValue: string | number): Date {
  // Handle numbers (timestamps)
  if (typeof dateValue === "number") {
    return new Date(dateValue);
  }
  // Handle YYYY-MM-DD format as local date
  const parts = dateValue.split("-");
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(dateValue);
}

/**
 * Data structure for batch edit operations
 */
export interface BatchEditData {
  setPriority?: boolean;
  priority?: string;
  setProject?: boolean;
  project?: string;
  setAssignee?: boolean;
  assignee?: string;
  setSprint?: boolean;
  sprint?: string;
  setSource?: boolean;
  source?: string;
  setDueDate?: boolean;
  dueDate?: string;
  setTags?: boolean;
  tags?: string;
  setDuration?: boolean;
  duration?: string;
}

/**
 * Categorized todos for display
 */
export interface CategorizedTodos {
  active: TodoModel[];
  completed: TodoModel[];
  archived: TodoModel[];
}

/**
 * Calculate archive threshold in milliseconds from days
 * @param archiveDays - Number of days before completed todos are considered archived
 * @returns Threshold in milliseconds
 */
export function calculateArchiveThreshold(archiveDays: number): number {
  return archiveDays * 24 * 60 * 60 * 1000;
}

/**
 * Categorize todos into active, completed (recently), and archived buckets
 * @param todos - Array of todos to categorize
 * @param archiveThresholdMs - Threshold in milliseconds for auto-archiving completed todos
 * @param now - Current timestamp (for testing, defaults to Date.now())
 * @returns Object containing active, completed, and archived todo arrays
 */
export function categorizeTodos(
  todos: TodoModel[],
  archiveThresholdMs: number,
  now: number = Date.now()
): CategorizedTodos {
  const active: TodoModel[] = [];
  const completed: TodoModel[] = [];
  const archived: TodoModel[] = [];

  todos.forEach((todo) => {
    if (todo.isDeleted) return;

    if (todo.isArchived) {
      archived.push(todo);
    } else if (todo.isActive) {
      active.push(todo);
    } else if (todo.isCompleted) {
      // Check if it's recently completed or should be in archived
      if (!todo.completedAt) {
        // Legacy completed todos without timestamp go to completed
        completed.push(todo);
      } else {
        const timeSinceCompletion = now - todo.completedAt;
        if (timeSinceCompletion < archiveThresholdMs) {
          completed.push(todo);
        } else {
          // Auto-archive: old completed todos
          archived.push(todo);
        }
      }
    }
  });

  return { active, completed, archived };
}

/**
 * Apply batch edit data to a todo's metadata
 * This is a pure function that returns a new metadata object without mutating the input
 * @param currentMetadata - The todo's current metadata
 * @param batchData - The batch edit data to apply
 * @returns New metadata object with changes applied
 */
export function applyBatchEditToMetadata(
  currentMetadata: TodoMetadata,
  batchData: BatchEditData
): TodoMetadata {
  const newMetadata = { ...currentMetadata };

  if (batchData.setPriority) {
    newMetadata.priority = batchData.priority || undefined;
  }

  if (batchData.setProject) {
    if (batchData.project) {
      if (!newMetadata.projects.includes(batchData.project)) {
        newMetadata.projects = [...newMetadata.projects, batchData.project];
      }
    } else {
      newMetadata.projects = [];
    }
  }

  if (batchData.setAssignee) {
    if (batchData.assignee) {
      if (!newMetadata.assignedPeople.includes(batchData.assignee)) {
        newMetadata.assignedPeople = [...newMetadata.assignedPeople, batchData.assignee];
      }
    } else {
      newMetadata.assignedPeople = [];
    }
  }

  if (batchData.setSprint) {
    newMetadata.sprint = batchData.sprint || undefined;
  }

  if (batchData.setSource) {
    if (batchData.source) {
      if (!newMetadata.sourcePeople.includes(batchData.source)) {
        newMetadata.sourcePeople = [...newMetadata.sourcePeople, batchData.source];
      }
    } else {
      newMetadata.sourcePeople = [];
    }
  }

  if (batchData.setDueDate) {
    newMetadata.dueDate = batchData.dueDate || undefined;
  }

  if (batchData.setTags) {
    if (batchData.tags) {
      const newTags = batchData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      newTags.forEach((tag) => {
        if (!(newMetadata.tags ?? []).includes(tag)) {
          newMetadata.tags = [...(newMetadata.tags ?? []), tag];
        }
      });
    } else {
      newMetadata.tags = [];
    }
  }

  if (batchData.setDuration) {
    newMetadata.duration = batchData.duration || undefined;
  }

  return newMetadata;
}

/**
 * Quick filter types for the list view
 */
export type QuickFilterType = "all" | "today" | "overdue" | "thisWeek" | "noDueDate";

/**
 * Quick filter counts
 */
export interface QuickFilterCounts {
  all: number;
  today: number;
  overdue: number;
  thisWeek: number;
  noDueDate: number;
}

/**
 * Calculate quick filter counts from a list of todos
 * @param todos - Array of todos to count
 * @param now - Current date (for testing, defaults to new Date())
 * @returns Object containing counts for each quick filter category
 */
export function calculateQuickFilterCounts(
  todos: TodoModel[],
  now: Date = new Date()
): QuickFilterCounts {
  const activeTodos = todos.filter((t) => t.isActive && !t.isDeleted);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  // Get start of current week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Get end of current week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  let todayCount = 0;
  let overdueCount = 0;
  let thisWeekCount = 0;
  let noDueDateCount = 0;

  activeTodos.forEach((todo) => {
    if (!todo.dueDate) {
      noDueDateCount++;
      return;
    }

    const dueDate = parseLocalDate(todo.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      overdueCount++;
    } else if (dueDate.getTime() === today.getTime()) {
      todayCount++;
    } else if (dueDate >= startOfWeek && dueDate <= endOfWeek) {
      thisWeekCount++;
    }
  });

  return {
    all: activeTodos.length,
    today: todayCount,
    overdue: overdueCount,
    thisWeek: thisWeekCount,
    noDueDate: noDueDateCount,
  };
}

/**
 * Filter active todos by quick filter type
 * @param todos - Array of todos to filter
 * @param filterType - The quick filter type to apply
 * @param now - Current date (for testing)
 * @returns Filtered array of todos
 */
export function applyQuickFilter(
  todos: TodoModel[],
  filterType: QuickFilterType,
  now: Date = new Date()
): TodoModel[] {
  if (filterType === "all") {
    return todos;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return todos.filter((todo) => {
    if (filterType === "noDueDate") {
      return !todo.dueDate;
    }

    if (!todo.dueDate) return false;

    const dueDate = parseLocalDate(todo.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    switch (filterType) {
      case "overdue":
        return dueDate < today;
      case "today":
        return dueDate.getTime() === today.getTime();
      case "thisWeek":
        return dueDate >= startOfWeek && dueDate <= endOfWeek && dueDate.getTime() !== today.getTime();
      default:
        return true;
    }
  });
}

/**
 * Marker color map for filter buttons
 */
export const MARKER_COLOR_MAP: Record<string, string> = {
  assignedPeople: "assigned",
  projects: "project",
  categories: "project",
  sourcePeople: "source",
  mentionedPeople: "mentioned",
  priorities: "priority",
  dueDates: "dueDate",
  durations: "duration",
  tags: "tag",
  recurring: "recurring",
  dependencies: "dependency",
};

/**
 * Get the marker color key for a filter type
 * @param filterType - The filter type
 * @returns The marker color key
 */
export function getMarkerColorKey(filterType: string): string {
  return MARKER_COLOR_MAP[filterType] ?? "project";
}
