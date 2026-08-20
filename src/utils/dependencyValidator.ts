import { Todo } from "@/types/todo";

export interface DependencyValidationResult {
  satisfied: boolean;
  unsatisfiedTodos: Todo[];
}

/**
 * Check if all dependencies for a todo are satisfied (completed, deleted, or archived)
 * @param dependencyIds Array of todo IDs that are dependencies
 * @param allTodos Array of all todos in the system
 * @returns Validation result with satisfied flag and list of unsatisfied todos
 */
export function areDependenciesSatisfied(dependencyIds: string[], allTodos: Todo[]): DependencyValidationResult {
  if (dependencyIds.length === 0) {
    return {
      satisfied: true,
      unsatisfiedTodos: [],
    };
  }

  const unsatisfiedTodos: Todo[] = [];

  dependencyIds.forEach((depId) => {
    const dependencyTodo = allTodos.find((t) => t.id === depId);

    // If dependency doesn't exist (deleted from system), consider it satisfied
    if (!dependencyTodo) {
      return;
    }

    // Dependency is unsatisfied if it's still active
    // (completed, deleted, and archived todos are considered satisfied)
    if (dependencyTodo.state === "active") {
      unsatisfiedTodos.push(dependencyTodo);
    }
  });

  return {
    satisfied: unsatisfiedTodos.length === 0,
    unsatisfiedTodos,
  };
}

/**
 * Get a human-readable message for blocked completion
 * @param unsatisfiedTodos Array of todos that are blocking completion
 * @returns Formatted message string
 */
export function getDependencyBlockMessage(unsatisfiedTodos: Todo[]): string {
  if (unsatisfiedTodos.length === 0) {
    return "";
  }

  if (unsatisfiedTodos.length === 1) {
    return `Cannot complete: Dependency "${unsatisfiedTodos[0].plainText}" is not yet complete.`;
  }

  const todoNames = unsatisfiedTodos.map((t) => `"${t.plainText}"`).join(", ");
  return `Cannot complete: ${unsatisfiedTodos.length} dependencies are not yet complete: ${todoNames}`;
}
