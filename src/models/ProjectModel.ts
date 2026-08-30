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

import type { Project, ProjectCategoryId, ProjectId } from "@/types/project";
import { getProjectId } from "@/types/project";
import { generatePrefixedUUID } from "@/utils/idGenerator";
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
  // STATIC ID FACTORY
  // ============================================================================

  /**
   * Create a new unique ID for a Project.
   * @returns A ProjectId with prefix "proj-" followed by a UUID
   */
  static createId(): ProjectId {
    return getProjectId(generatePrefixedUUID("proj"));
  }

  // ============================================================================
  // ENTITY TYPE
  // ============================================================================

  protected get entityTypeName(): string {
    return "Project";
  }

  // ============================================================================
  // PROJECT-SPECIFIC PROPERTIES
  // ============================================================================

  /**
   * Get project category ID
   */
  get category(): ProjectCategoryId | undefined {
    return this._raw.category;
  }

  // ============================================================================
  // PROJECT-SPECIFIC VALIDATION
  // ============================================================================

  /**
   * Check if this project can be deleted
   * @param allTodos Optional array of todos to check for dependencies.
   *                 Should use TodoModel instances which account for auto-assigned defaults.
   * @returns Validation result with reason if not allowed
   */
  canDelete(allTodos?: Array<{ projectIds: ProjectId[] }>): { canDelete: boolean; reason?: string } {
    if (allTodos) {
      // Match by name, not by this.id: projectIds hold entity NAMES while
      // this.id is a generated "project-<uuid>", so an id comparison never
      // matched and every project looked deletable.
      const isUsed = allTodos.some((todo) => this.matchesAnyName(todo.projectIds));
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
