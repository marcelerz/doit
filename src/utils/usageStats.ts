/**
 * Usage statistics tracking for todo metadata
 * Tracks frequency of people, projects, priorities, tags, etc. to provide smart suggestions
 */

import { PersonId } from "@/types/person";
import { PriorityId } from "@/types/priority";
import { ProjectId } from "@/types/project";
import { Tag, Todo } from "@/types/todo";
import { createTodoModel } from "@/models/TodoModel";
import { SettingsModel } from "@/models/SettingsModel";

export interface UsageStats {
  assignedPeople: Map<PersonId, number>;
  sourcePeople: Map<PersonId, number>;
  mentionedPeople: Map<PersonId, number>;
  projects: Map<ProjectId, number>;
  priorities: Map<PriorityId, number>;
  tags: Map<Tag, number>;
  dueDates: Map<string, number>;
  durations: Map<string, number>;
  recurring: Map<string, number>;
}

/**
 * Weight multipliers based on todo state
 */
const STATE_WEIGHTS = {
  active: 3,
  completed: 2,
  archived: 1,
  deleted: 0,
};

/**
 * Calculate usage statistics from all todos.
 * Uses SettingsModel singleton for formatting due dates.
 */
export function calculateUsageStats(todos: Todo[]): UsageStats {
  const stats: UsageStats = {
    assignedPeople: new Map(),
    sourcePeople: new Map(),
    mentionedPeople: new Map(),
    projects: new Map(),
    priorities: new Map(),
    tags: new Map(),
    dueDates: new Map(),
    durations: new Map(),
    recurring: new Map(),
  };

  todos.forEach((todo) => {
    const weight = STATE_WEIGHTS[todo.state] || 0;
    if (weight === 0) return; // Skip deleted todos

    // Track assigned people
    (todo.assignedPeople ?? []).forEach((person) => {
      const current = stats.assignedPeople.get(person) || 0;
      stats.assignedPeople.set(person, current + weight);
    });

    // Track source people
    (todo.sourcePeople ?? []).forEach((person) => {
      const current = stats.sourcePeople.get(person) || 0;
      stats.sourcePeople.set(person, current + weight);
    });

    // Track mentioned people
    (todo.mentionedPeople ?? []).forEach((person) => {
      const current = stats.mentionedPeople.get(person) || 0;
      stats.mentionedPeople.set(person, current + weight);
    });

    // Track projects
    (todo.projects ?? []).forEach((project) => {
      const current = stats.projects.get(project) || 0;
      stats.projects.set(project, current + weight);
    });

    // Track priority
    if (todo.priority) {
      const current = stats.priorities.get(todo.priority) || 0;
      stats.priorities.set(todo.priority, current + weight);
    }

    // Track tags
    (todo.tags ?? []).forEach((tag) => {
      const current = stats.tags.get(tag) || 0;
      stats.tags.set(tag, current + weight);
    });

    // Track due date (convert timestamp to display string)
    if (todo.dueDate) {
      const settings = SettingsModel.getInstance();
      const model = createTodoModel(todo, settings);
      const display = model.formattedDueDateDisplay;
      if (display) {
        const current = stats.dueDates.get(display) || 0;
        stats.dueDates.set(display, current + weight);
      }
    }

    // Track duration (convert seconds to display string)
    if (todo.duration) {
      const settings = SettingsModel.getInstance();
      const model = createTodoModel(todo, settings);
      const display = model.formattedDurationDisplay;
      if (display) {
        const current = stats.durations.get(display) || 0;
        stats.durations.set(display, current + weight);
      }
    }

    // Track recurring
    if (todo.recurring) {
      const current = stats.recurring.get(todo.recurring) || 0;
      stats.recurring.set(todo.recurring, current + weight);
    }
  });

  return stats;
}

/**
 * Sort items by usage frequency (highest first)
 */
export function sortByUsage<T extends { name: string }>(items: T[], usageMap: Map<string, number>): T[] {
  return [...items].sort((a, b) => {
    const aScore = usageMap.get(a.name) || 0;
    const bScore = usageMap.get(b.name) || 0;
    if (aScore !== bScore) {
      return bScore - aScore; // Higher score first
    }
    // If scores are equal, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort simple string items by usage frequency
 */
export function sortStringsByUsage(items: string[], usageMap: Map<string, number>): string[] {
  return [...items].sort((a, b) => {
    const aScore = usageMap.get(a) || 0;
    const bScore = usageMap.get(b) || 0;
    if (aScore !== bScore) {
      return bScore - aScore; // Higher score first
    }
    // If scores are equal, sort alphabetically
    return a.localeCompare(b);
  });
}

/**
 * Get top N most used items
 */
export function getTopUsed(usageMap: Map<string, number>, limit: number = 10): string[] {
  return Array.from(usageMap.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .slice(0, limit)
    .map((entry) => entry[0]);
}
