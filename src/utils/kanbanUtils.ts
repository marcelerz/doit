/**
 * Kanban View Utility Functions
 *
 * Pure business logic extracted from KanbanView.tsx for better testability.
 */

import { TodoModel } from "@/models/TodoModel";
import { Priority } from "@/types/priority";
import { KanbanStateId, KanbanState, AllowedTransition } from "@/types/kanbanState";

/**
 * Kanban filter options structure
 */
export interface KanbanFilterOptions {
  assignedPeople: string[];
  projects: string[];
  priorities: string[];
  dueDates: string[];
  tags: string[];
}

/**
 * Kanban filter state
 */
export interface KanbanFilters {
  searchText: string;
  assignedPeople: Set<string>;
  projects: Set<string>;
  priorities: Set<string>;
  dueDates: Set<string>;
  tags: Set<string>;
}

/**
 * Due date filter options
 */
export const DUE_DATE_FILTER_OPTIONS = [
  "overdue",
  "today",
  "thisWeek",
  "later",
  "noDueDate",
] as const;

export type DueDateFilter = (typeof DUE_DATE_FILTER_OPTIONS)[number];

/**
 * Compute filter options from a list of todos
 * Extracts unique values for each filterable field
 * @param todos - Array of todos to extract filter options from
 * @param priorities - Available priorities for sorting
 * @returns Filter options object
 */
export function computeKanbanFilterOptions(
  todos: TodoModel[],
  priorities: Priority[]
): KanbanFilterOptions {
  const assignedPeople = new Set<string>();
  const projects = new Set<string>();
  const priorityNames = new Set<string>();
  const tags = new Set<string>();

  todos.forEach((todo) => {
    if (todo.state === "deleted") return;
    todo.assignedPeople.forEach((p) => assignedPeople.add(p));
    todo.projects.forEach((p) => projects.add(p));
    if (todo.priority) priorityNames.add(todo.priority);
    todo.tags.forEach((t) => tags.add(t));
  });

  // Sort priorities by their order
  const sortedPriorities = Array.from(priorityNames).sort((a, b) => {
    const aOrder = priorities.find((p) => p.name === a)?.order ?? Infinity;
    const bOrder = priorities.find((p) => p.name === b)?.order ?? Infinity;
    return aOrder - bOrder;
  });

  return {
    assignedPeople: Array.from(assignedPeople).sort(),
    projects: Array.from(projects).sort(),
    priorities: sortedPriorities,
    dueDates: [...DUE_DATE_FILTER_OPTIONS],
    tags: Array.from(tags).sort(),
  };
}

/**
 * Check if any filters are active
 * @param filters - Current filter state
 * @returns True if any filter is active
 */
export function hasActiveKanbanFilters(filters: KanbanFilters): boolean {
  return (
    filters.searchText.length > 0 ||
    filters.assignedPeople.size > 0 ||
    filters.projects.size > 0 ||
    filters.priorities.size > 0 ||
    filters.dueDates.size > 0 ||
    filters.tags.size > 0
  );
}

/**
 * Filter todos by Kanban criteria
 * @param todos - Array of todos to filter
 * @param filters - Active filters
 * @param sprintId - Sprint filter (null = all, "backlog" = no sprint, or sprint ID)
 * @returns Filtered array of todos
 */
export function filterTodosByKanbanCriteria(
  todos: TodoModel[],
  filters: KanbanFilters,
  sprintId: string | null
): TodoModel[] {
  return todos.filter((todo) => {
    // Skip deleted todos
    if (todo.state === "deleted") return false;

    // Apply sprint filter
    if (sprintId !== null) {
      if (sprintId === "backlog") {
        if (todo.sprint) return false;
      } else {
        if (todo.sprint !== sprintId) return false;
      }
    }

    // Apply search filter
    if (filters.searchText && !todo.matchesSearch(filters.searchText)) {
      return false;
    }

    // Apply assigned people filter
    if (filters.assignedPeople.size > 0) {
      const hasMatch = todo.assignedPeople.some((p) => filters.assignedPeople.has(p));
      if (!hasMatch) return false;
    }

    // Apply projects filter
    if (filters.projects.size > 0) {
      const hasMatch = todo.projects.some((p) => filters.projects.has(p));
      if (!hasMatch) return false;
    }

    // Apply priorities filter
    if (filters.priorities.size > 0) {
      if (!todo.priority || !filters.priorities.has(todo.priority)) return false;
    }

    // Apply due dates filter
    if (filters.dueDates.size > 0) {
      let matches = false;
      if (filters.dueDates.has("overdue") && todo.isOverdue) matches = true;
      if (filters.dueDates.has("today") && todo.isDueToday) matches = true;
      if (filters.dueDates.has("thisWeek") && todo.isDueThisWeek && !todo.isDueToday) matches = true;
      if (filters.dueDates.has("later") && todo.dueDate && !todo.isDueThisWeek) matches = true;
      if (filters.dueDates.has("noDueDate") && !todo.dueDate) matches = true;
      if (!matches) return false;
    }

    // Apply tags filter
    if (filters.tags.size > 0) {
      const hasMatch = todo.tags.some((t) => filters.tags.has(t));
      if (!hasMatch) return false;
    }

    return true;
  });
}

/**
 * Determine the workflow state for a todo
 * @param todo - The todo to get state for
 * @returns The workflow state ID
 */
export function getTodoWorkflowState(todo: TodoModel): string {
  if (todo.state === "completed") return "completed";
  if (todo.state === "archived") return "archived";
  if (todo.workflowState) return todo.workflowState;
  return "backlog";
}

/**
 * Group todos by their workflow state
 * @param todos - Array of todos to group
 * @param states - Array of kanban states
 * @returns Record mapping state IDs to arrays of todos
 */
export function groupTodosByWorkflowState(
  todos: TodoModel[],
  states: KanbanState[]
): Record<string, TodoModel[]> {
  const grouped: Record<string, TodoModel[]> = {};

  // Initialize all states with empty arrays
  states.forEach((state) => {
    grouped[state.id] = [];
  });

  // Assign todos to states
  todos.forEach((todo) => {
    const stateId = getTodoWorkflowState(todo);

    if (grouped[stateId]) {
      grouped[stateId].push(todo);
    } else if (states.length > 0) {
      // If state doesn't exist anymore, put in first available state
      const firstState = states[0];
      if (firstState && grouped[firstState.id]) {
        grouped[firstState.id].push(todo);
      }
    }
  });

  return grouped;
}

/**
 * Sort field options for Kanban view
 */
export type KanbanSortField = "createdAt" | "updatedAt" | "dueDate" | "priority" | "title";

/**
 * Sort todos within a kanban column
 * @param todos - Array of todos to sort
 * @param sortField - Field to sort by
 * @param direction - Sort direction
 * @param priorities - Available priorities for priority sorting
 * @returns Sorted array of todos
 */
export function sortKanbanTodos(
  todos: TodoModel[],
  sortField: KanbanSortField,
  direction: "asc" | "desc",
  priorities: Priority[]
): TodoModel[] {
  const sortedTodos = [...todos];
  const directionMultiplier = direction === "asc" ? 1 : -1;

  sortedTodos.sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "createdAt":
        comparison = a.createdAt - b.createdAt;
        break;

      case "updatedAt": {
        const aUpdated = a.updatedAt ?? a.createdAt;
        const bUpdated = b.updatedAt ?? b.createdAt;
        comparison = aUpdated - bUpdated;
        break;
      }

      case "dueDate": {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = aDate - bDate;
        break;
      }

      case "priority": {
        const getPriorityOrder = (todo: TodoModel) => {
          const priority = todo.priority;
          if (!priority) return Infinity;
          const p = priorities.find((pr) => pr.name === priority);
          return p?.order ?? Infinity;
        };
        comparison = getPriorityOrder(a) - getPriorityOrder(b);
        break;
      }

      case "title":
        comparison = a.plainText.localeCompare(b.plainText);
        break;

      default:
        comparison = 0;
    }

    return comparison * directionMultiplier;
  });

  return sortedTodos;
}

/**
 * Check if a state transition is allowed
 * @param fromStateId - Current state ID
 * @param toStateId - Target state ID
 * @param allowedTransitions - Array of allowed transitions (empty means all allowed)
 * @returns True if transition is allowed
 */
export function canTransitionState(
  fromStateId: KanbanStateId | string,
  toStateId: KanbanStateId | string,
  allowedTransitions: AllowedTransition[]
): boolean {
  if (fromStateId === toStateId) return false;
  if (allowedTransitions.length === 0) return true; // No restrictions
  return allowedTransitions.some(
    (t) => t.fromStateId === fromStateId && t.toStateId === toStateId
  );
}

/**
 * Check if a state can accept more tasks (WIP limit check)
 * @param state - The kanban state to check
 * @param currentCount - Current number of tasks in the state
 * @returns True if state can accept more tasks
 */
export function canAcceptMoreTasks(
  state: KanbanState,
  currentCount: number
): boolean {
  // System states have no WIP limit
  if (state.isSystem) return true;
  // No WIP limit configured
  if (state.wipLimit === undefined || state.wipLimit <= 0) return true;
  // Check if under the limit
  return currentCount < state.wipLimit;
}

/**
 * Get WIP limit status for a state
 * @param state - The kanban state
 * @param currentCount - Current number of tasks
 * @returns Status object with limit info
 */
export function getWipLimitStatus(
  state: KanbanState,
  currentCount: number
): {
  hasLimit: boolean;
  isAtLimit: boolean;
  isOverLimit: boolean;
  limit?: number;
} {
  const hasLimit = !state.isSystem && state.wipLimit !== undefined && state.wipLimit > 0;

  if (!hasLimit) {
    return { hasLimit: false, isAtLimit: false, isOverLimit: false };
  }

  return {
    hasLimit: true,
    isAtLimit: currentCount === state.wipLimit,
    isOverLimit: currentCount > state.wipLimit!,
    limit: state.wipLimit,
  };
}

/**
 * Default empty Kanban filters
 */
export const DEFAULT_KANBAN_FILTERS: KanbanFilters = {
  searchText: "",
  assignedPeople: new Set(),
  projects: new Set(),
  priorities: new Set(),
  dueDates: new Set(),
  tags: new Set(),
};

/**
 * Create a fresh copy of default filters
 * @returns New empty filters object
 */
export function createEmptyKanbanFilters(): KanbanFilters {
  return {
    searchText: "",
    assignedPeople: new Set(),
    projects: new Set(),
    priorities: new Set(),
    dueDates: new Set(),
    tags: new Set(),
  };
}

/**
 * Convert filters to serializable format for storage
 * @param filters - Filters with Set values
 * @returns Filters with array values
 */
export function serializeKanbanFilters(filters: KanbanFilters): {
  searchText: string;
  assignedPeople: string[];
  projects: string[];
  priorities: string[];
  dueDates: string[];
  tags: string[];
} {
  return {
    searchText: filters.searchText,
    assignedPeople: Array.from(filters.assignedPeople),
    projects: Array.from(filters.projects),
    priorities: Array.from(filters.priorities),
    dueDates: Array.from(filters.dueDates),
    tags: Array.from(filters.tags),
  };
}

/**
 * Convert serialized filters back to usable format
 * @param serialized - Filters with array values
 * @returns Filters with Set values
 */
export function deserializeKanbanFilters(serialized: {
  searchText?: string;
  assignedPeople?: string[];
  projects?: string[];
  priorities?: string[];
  dueDates?: string[];
  tags?: string[];
}): KanbanFilters {
  return {
    searchText: serialized.searchText || "",
    assignedPeople: new Set(serialized.assignedPeople || []),
    projects: new Set(serialized.projects || []),
    priorities: new Set(serialized.priorities || []),
    dueDates: new Set(serialized.dueDates || []),
    tags: new Set(serialized.tags || []),
  };
}
