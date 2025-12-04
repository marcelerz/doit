/**
 * ProjectModel - Business Logic Abstraction for Project entities
 *
 * Wraps the raw Project interface with computed properties, validation methods,
 * and display helpers to keep business logic out of views.
 *
 * Pattern: Hooks maintain raw Project[] in state, but return ProjectModel[] to consumers
 * via useMemo for automatic wrapping.
 */

import type { Project, Comment, ActivityEntry } from "@/types/settings";

/**
 * ProjectModel wraps a Project with business logic and computed properties.
 *
 * Use this instead of raw Project objects in components for cleaner code.
 * The model provides validation, display formatting, and computed properties.
 */
export class ProjectModel {
  /**
   * The raw Project object wrapped by this model.
   * Access this when you need to save or pass the data to storage/hooks.
   */
  public readonly raw: Project;

  constructor(project: Project) {
    this.raw = project;
  }

  // ============================================================================
  // BASIC PROPERTIES (direct access)
  // ============================================================================

  get id(): string {
    return this.raw.id;
  }

  get name(): string {
    return this.raw.name;
  }

  get alternatives(): string[] {
    return this.raw.alternatives;
  }

  get color(): string | undefined {
    return this.raw.color;
  }

  get context(): string | undefined {
    return this.raw.context;
  }

  get comments(): Comment[] {
    return this.raw.comments;
  }

  get activity(): ActivityEntry[] {
    return this.raw.activity;
  }

  get archived(): boolean {
    return this.raw.archived ?? false;
  }

  // ============================================================================
  // STATE CHECKS
  // ============================================================================

  /**
   * Whether this project is currently active (not archived)
   */
  get isActive(): boolean {
    return !this.archived;
  }

  /**
   * Whether this project is archived
   */
  get isArchived(): boolean {
    return this.archived;
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  /**
   * Check if this project can be archived
   * @returns Validation result with reason if not allowed
   */
  canArchive(): { canArchive: boolean; reason?: string } {
    if (this.archived) {
      return { canArchive: false, reason: "Project is already archived" };
    }
    return { canArchive: true };
  }

  /**
   * Check if this project can be unarchived
   * @returns Validation result with reason if not allowed
   */
  canUnarchive(): { canUnarchive: boolean; reason?: string } {
    if (!this.archived) {
      return { canUnarchive: false, reason: "Project is not archived" };
    }
    return { canUnarchive: true };
  }

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

  // ============================================================================
  // COMMENTS & ACTIVITY
  // ============================================================================

  /**
   * Whether this project has any comments
   */
  get hasComments(): boolean {
    return this.comments.length > 0;
  }

  /**
   * Total number of comments
   */
  get commentCount(): number {
    return this.comments.length;
  }

  /**
   * Get the most recent comment, if any
   */
  get latestComment(): Comment | undefined {
    if (this.comments.length === 0) return undefined;
    return this.comments[this.comments.length - 1];
  }

  /**
   * Whether this project has any activity
   */
  get hasActivity(): boolean {
    return this.activity.length > 0;
  }

  /**
   * Total number of activity entries
   */
  get activityCount(): number {
    return this.activity.length;
  }

  /**
   * Get the most recent activity entry, if any
   */
  get latestActivity(): ActivityEntry | undefined {
    if (this.activity.length === 0) return undefined;
    return this.activity[this.activity.length - 1];
  }

  // ============================================================================
  // DISPLAY PROPERTIES
  // ============================================================================

  /**
   * Get display name with alternative names if any
   * @returns "Website Redesign (website, redesign)" or just "Website Redesign"
   */
  get displayName(): string {
    if (this.alternatives.length === 0) {
      return this.name;
    }
    return `${this.name} (${this.alternatives.join(", ")})`;
  }

  /**
   * Get a summary of metadata for this project
   * @returns Formatted string like "5 todos • 3 comments • Active"
   */
  getMetadataSummary(todoCount?: number): string {
    const parts: string[] = [];

    if (todoCount !== undefined && todoCount > 0) {
      parts.push(`${todoCount} ${todoCount === 1 ? "todo" : "todos"}`);
    }

    if (this.commentCount > 0) {
      parts.push(`${this.commentCount} ${this.commentCount === 1 ? "comment" : "comments"}`);
    }

    if (this.activityCount > 0) {
      parts.push(`${this.activityCount} ${this.activityCount === 1 ? "activity" : "activities"}`);
    }

    parts.push(this.archived ? "Archived" : "Active");

    return parts.join(" • ");
  }

  /**
   * Get a badge label for status
   */
  get statusBadge(): string {
    return this.archived ? "Archived" : "Active";
  }

  /**
   * Get a color for status badge
   */
  get statusColor(): "gray" | "blue" {
    return this.archived ? "gray" : "blue";
  }

  /**
   * Get initials from project name
   * @returns First letters of first and last word, or first 2 letters
   */
  get initials(): string {
    const words = this.name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return this.name.substring(0, 2).toUpperCase();
  }

  // ============================================================================
  // SEARCH & MATCHING
  // ============================================================================

  /**
   * Check if this project matches a search query
   * Searches across name, alternatives, and context
   *
   * @param searchText Text to search for (case-insensitive)
   * @returns true if any field matches
   */
  matchesSearch(searchText: string): boolean {
    if (!searchText.trim()) return true;

    const search = searchText.toLowerCase();

    // Search name
    if (this.name.toLowerCase().includes(search)) return true;

    // Search alternatives
    if (this.alternatives.some((alt) => alt.toLowerCase().includes(search))) return true;

    // Search context
    if (this.context && this.context.toLowerCase().includes(search)) return true;

    // Search comments (search in all comment history entries)
    if (this.comments.some((c) => c.history.some((h) => h.content.toLowerCase().includes(search)))) return true;

    return false;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Check if this project matches any of the given names or alternatives
   * Used for parsing #project mentions in todo text
   */
  matchesAnyName(names: string[]): boolean {
    const lowerNames = names.map((n) => n.toLowerCase());
    const projectNames = [this.name, ...this.alternatives].map((n) => n.toLowerCase());
    return projectNames.some((name) => lowerNames.includes(name));
  }

  /**
   * Get all names (including alternatives) as a flat array
   */
  get allNames(): string[] {
    return [this.name, ...this.alternatives];
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
