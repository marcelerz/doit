/**
 * EntityRegistry - Central registry for all entities (todos, people, projects)
 *
 * Provides fast lookups by ID and enables rich accessors on models.
 * Models can use the registry to resolve related entities (e.g., get PersonModel from PersonId).
 *
 * Usage:
 * ```ts
 * const registry = new EntityRegistry(todos, people, projects, settings);
 * const person = registry.getPerson(personId);
 * const todoModels = registry.getTodosForPerson(personId);
 * ```
 */

import type { Todo, TodoId } from "@/types/todo";
import type { Person, PersonId } from "@/types/person";
import type { Project, ProjectId } from "@/types/project";
import type { Priority, PriorityId } from "@/types/priority";
import { TodoModel, createTodoModel } from "./TodoModel";
import { PersonModel, createPersonModel } from "./PersonModel";
import { ProjectModel, createProjectModel } from "./ProjectModel";
import { SettingsModel } from "./SettingsModel";

/**
 * Central registry for fast entity lookups by ID.
 * Maintains Maps for O(1) access and provides relationship queries.
 */
export class EntityRegistry {
  private _todoMap: Map<TodoId, TodoModel>;
  private _personMap: Map<PersonId, PersonModel>;
  private _projectMap: Map<ProjectId, ProjectModel>;
  private _settingsModel: SettingsModel;

  constructor(todos: Todo[], people: Person[], projects: Project[], settings: SettingsModel) {
    this._settingsModel = settings;

    // Build person and project maps first (todos may reference them)
    this._personMap = new Map(people.map((p) => [p.id, createPersonModel(p)]));
    this._projectMap = new Map(projects.map((p) => [p.id, createProjectModel(p)]));

    // Build todo map with registry reference
    this._todoMap = new Map(todos.map((t) => [t.id, createTodoModel(t, settings)]));
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  get settings(): SettingsModel {
    return this._settingsModel;
  }

  // ============================================================================
  // DIRECT LOOKUPS
  // ============================================================================

  /**
   * Get a TodoModel by ID
   * @returns TodoModel or null if not found
   */
  getTodo(id: TodoId): TodoModel | null {
    return this._todoMap.get(id) ?? null;
  }

  /**
   * Get a PersonModel by ID
   * @returns PersonModel or null if not found
   */
  getPerson(id: PersonId): PersonModel | null {
    return this._personMap.get(id) ?? null;
  }

  /**
   * Get a ProjectModel by ID
   * @returns ProjectModel or null if not found
   */
  getProject(id: ProjectId): ProjectModel | null {
    return this._projectMap.get(id) ?? null;
  }

  /**
   * Get a Priority by ID from settings
   * @returns Priority or null if not found
   */
  getPriority(id: PriorityId): Priority | null {
    return this._settingsModel.findPriorityById(id);
  }

  // ============================================================================
  // BULK LOOKUPS
  // ============================================================================

  /**
   * Get multiple PersonModels by IDs
   * @returns Array of PersonModels (excludes not found)
   */
  getPeople(ids: PersonId[]): PersonModel[] {
    return ids.map((id) => this._personMap.get(id)).filter((p): p is PersonModel => p !== undefined);
  }

  /**
   * Get multiple ProjectModels by IDs
   * @returns Array of ProjectModels (excludes not found)
   */
  getProjects(ids: ProjectId[]): ProjectModel[] {
    return ids.map((id) => this._projectMap.get(id)).filter((p): p is ProjectModel => p !== undefined);
  }

  /**
   * Get multiple TodoModels by IDs
   * @returns Array of TodoModels (excludes not found)
   */
  getTodos(ids: TodoId[]): TodoModel[] {
    return ids.map((id) => this._todoMap.get(id)).filter((t): t is TodoModel => t !== undefined);
  }

  // ============================================================================
  // RELATIONSHIP QUERIES
  // ============================================================================

  /**
   * Get all todos assigned to a person
   */
  getTodosAssignedTo(personId: PersonId): TodoModel[] {
    return Array.from(this._todoMap.values()).filter((todo) => todo.assignedPeopleIds.includes(personId));
  }

  /**
   * Get all todos where person is the source
   */
  getTodosFromSource(personId: PersonId): TodoModel[] {
    return Array.from(this._todoMap.values()).filter((todo) => todo.sourcePeopleIds.includes(personId));
  }

  /**
   * Get all todos mentioning a person
   */
  getTodosMentioning(personId: PersonId): TodoModel[] {
    return Array.from(this._todoMap.values()).filter((todo) => todo.mentionedPeopleIds.includes(personId));
  }

  /**
   * Get all todos for a project
   */
  getTodosForProject(projectId: ProjectId): TodoModel[] {
    return Array.from(this._todoMap.values()).filter((todo) => todo.projectIds.includes(projectId));
  }

  /**
   * Get all todos with a specific priority
   */
  getTodosWithPriority(priorityId: PriorityId): TodoModel[] {
    return Array.from(this._todoMap.values()).filter((todo) => todo.priorityId === priorityId);
  }

  /**
   * Get all todos that depend on a given todo
   */
  getDependentTodos(todoId: TodoId): TodoModel[] {
    return Array.from(this._todoMap.values()).filter((todo) => todo.dependencyIds.includes(todoId));
  }

  // ============================================================================
  // ALL ENTITIES
  // ============================================================================

  /**
   * Get all TodoModels
   */
  get allTodos(): TodoModel[] {
    return Array.from(this._todoMap.values());
  }

  /**
   * Get all PersonModels
   */
  get allPeople(): PersonModel[] {
    return Array.from(this._personMap.values());
  }

  /**
   * Get all ProjectModels
   */
  get allProjects(): ProjectModel[] {
    return Array.from(this._projectMap.values());
  }

  // ============================================================================
  // COUNTS
  // ============================================================================

  get todoCount(): number {
    return this._todoMap.size;
  }

  get personCount(): number {
    return this._personMap.size;
  }

  get projectCount(): number {
    return this._projectMap.size;
  }
}

/**
 * Factory function to create an EntityRegistry
 */
export function createEntityRegistry(
  todos: Todo[],
  people: Person[],
  projects: Project[],
  settings: SettingsModel,
): EntityRegistry {
  return new EntityRegistry(todos, people, projects, settings);
}
