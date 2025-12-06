/**
 * ProjectModel - Business Logic Abstraction for Project entities
 *
 * Extends BaseEntityModel with project-specific validation and behavior.
 * Wraps the raw Project interface with computed properties, validation methods,
 * and display helpers to keep business logic out of views.
 *
 * Pattern: Hooks maintain raw Project[] in state, but return ProjectModel[] to consumers
 * via useMemo for automatic wrapping.
 */

import type { Project } from "@/types/settings";
import { BaseEntityModel } from "./BaseEntityModel";

/**
 * ProjectModel wraps a Project with business logic and computed properties.
 *
 * Use this instead of raw Project objects in components for cleaner code.
 * The model provides validation, display formatting, and computed properties.
 */
export class ProjectModel extends BaseEntityModel<Project> {
  constructor(project: Project) {
    super(project);
  }

  // ============================================================================
  // ENTITY TYPE
  // ============================================================================

  protected get entityTypeName(): string {
    return "Project";
  }

  // ============================================================================
  // PROJECT-SPECIFIC VALIDATION
  // ============================================================================

  /**
   * Check if this project can be deleted
   * @param allTodos Optional array of todos to check for dependencies
   * @returns Validation result with reason if not allowed
   */
  canDelete(allTodos?: Array<{ projects?: string[] }>): { canDelete: boolean; reason?: string } {
    if (allTodos) {
      const isUsed = allTodos.some((todo) => todo.projects?.includes(this.id));
      if (isUsed) {
        return { canDelete: false, reason: "Project is used in active todos" };
      }
    }
    return { canDelete: true };
  }
}

/**
 * Factory function to create ProjectModel instances from raw Project objects
 *
 * Usage in hooks:
 * ```ts
 * const [rawProjects, setRawProjects] = useState<Project[]>([]);
 * const projects = useMemo(() => createProjectModels(rawProjects), [rawProjects]);
 * ```
 */
export function createProjectModels(projects: Project[]): ProjectModel[] {
  return projects.map((project) => new ProjectModel(project));
}

/**
 * Helper to create a single ProjectModel
 */
export function createProjectModel(project: Project): ProjectModel {
  return new ProjectModel(project);
}
