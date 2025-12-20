/**
 * BaseEntityModel - Abstract base class for Person and Project models
 *
 * Provides shared functionality for entities that have:
 * - id, name, alternatives, color, context
 * - comments and activity tracking
 * - archive/unarchive state
 * - search and matching utilities
 *
 * This reduces code duplication between PersonModel and ProjectModel.
 */

import type { Comment, ActivityEntry } from "@/types/types";

/**
 * Common interface for entities that can be wrapped by EntityModel
 */
export interface BaseEntity {
  id: string;
  name: string;
  alternatives: string[];
  color?: string;
  context?: string;
  comments: Comment[];
  activity: ActivityEntry<string>[];
  archived?: boolean;
}

/**
 * Abstract base class providing shared functionality for Person and Project models
 */
export abstract class BaseEntityModel<T extends BaseEntity> {
  /**
   * The raw entity object wrapped by this model.
   * Access this when you need to save or pass the data to storage/hooks.
   */
  protected readonly _raw: T;

  constructor(entity: T) {
    this._raw = entity;
  }

  // ============================================================================
  // BASIC PROPERTIES (direct access)
  // ============================================================================

  get raw_DONOTUSE(): T {
    return this._raw;
  }

  get id(): string {
    return this._raw.id;
  }

  get name(): string {
    return this._raw.name;
  }

  get alternatives(): string[] {
    return [...this._raw.alternatives];
  }

  get color(): string | undefined {
    return this._raw.color;
  }

  get context(): string | undefined {
    return this._raw.context;
  }

  get comments(): Comment[] {
    return this._raw.comments.map((c) => structuredClone(c));
  }

  get activity(): ActivityEntry<string>[] {
    return this._raw.activity.map((a) => structuredClone(a));
  }

  get archived(): boolean {
    return this._raw.archived ?? false;
  }

  // ============================================================================
  // STATE CHECKS
  // ============================================================================

  /**
   * Whether this entity is currently active (not archived)
   */
  get isActive(): boolean {
    return !this.archived;
  }

  /**
   * Whether this entity is archived
   */
  get isArchived(): boolean {
    return this.archived;
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  /**
   * Check if this entity can be archived
   * @returns Validation result with reason if not allowed
   */
  canArchive(): { canArchive: boolean; reason?: string } {
    if (this.archived) {
      return { canArchive: false, reason: `${this.entityTypeName} is already archived` };
    }
    return { canArchive: true };
  }

  /**
   * Check if this entity can be unarchived
   * @returns Validation result with reason if not allowed
   */
  canUnarchive(): { canUnarchive: boolean; reason?: string } {
    if (!this.archived) {
      return { canUnarchive: false, reason: `${this.entityTypeName} is not archived` };
    }
    return { canUnarchive: true };
  }

  /**
   * Abstract: Entity type name for display in messages (e.g., "Person", "Project")
   */
  protected abstract get entityTypeName(): string;

  // ============================================================================
  // COMMENTS & ACTIVITY
  // ============================================================================

  /**
   * Whether this entity has any comments
   */
  get hasComments(): boolean {
    return this._raw.comments.length > 0;
  }

  /**
   * Total number of comments
   */
  get commentCount(): number {
    return this._raw.comments.length;
  }

  /**
   * Get the most recent comment, if any
   * Returns null if no comments exist
   * Returns a copy to prevent external modification of internal state
   */
  get latestComment(): Comment | null {
    if (this._raw.comments.length === 0) return null;
    return structuredClone(this._raw.comments[this._raw.comments.length - 1]);
  }

  /**
   * Whether this entity has any activity
   */
  get hasActivity(): boolean {
    return this._raw.activity.length > 0;
  }

  /**
   * Total number of activity entries
   */
  get activityCount(): number {
    return this._raw.activity.length;
  }

  /**
   * Get the most recent activity entry, if any
   * Returns null if no activity exists
   * Returns a copy to prevent external modification of internal state
   */
  get latestActivity(): ActivityEntry<string> | null {
    if (this._raw.activity.length === 0) return null;
    return structuredClone(this._raw.activity[this._raw.activity.length - 1]);
  }

  // ============================================================================
  // DISPLAY PROPERTIES
  // ============================================================================

  /**
   * Get display name with alternative names if any
   * @returns "Name (alt1, alt2)" or just "Name"
   */
  get displayName(): string {
    if (this.alternatives.length === 0) {
      return this.name;
    }
    return `${this.name} (${this.alternatives.join(", ")})`;
  }

  /**
   * Get a summary of metadata for this entity
   * @param todoCount - Optional count of todos associated with this entity
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
   * Get initials from name
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
   * Check if this entity matches a search query
   * Searches across name, alternatives, context, and comments
   *
   * @param searchText Text to search for (case-insensitive)
   * @returns true if any field matches
   */
  matchesSearch(searchText: string): boolean {
    if (searchText.trim() === "") return true;

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

  /**
   * Check if this entity matches any of the given names or alternatives
   * Used for parsing mentions in todo text
   */
  matchesAnyName(names: string[]): boolean {
    const lowerNames = names.map((n) => n.toLowerCase());
    const entityNames = [this.name, ...this.alternatives].map((n) => n.toLowerCase());
    return entityNames.some((name) => lowerNames.includes(name));
  }

  /**
   * Get all names (including alternatives) as a flat array
   * Returns a copy to prevent external modification
   */
  get allNames(): string[] {
    return [this.name, ...this._raw.alternatives];
  }
}
