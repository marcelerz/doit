/**
 * BaseWorkableModel - Abstract base class for Todo, Note, and Review models
 *
 * Provides shared functionality for "workable" entities that have:
 * - State management (active, archived, deleted, and optionally completed)
 * - Timestamp tracking (createdAt, updatedAt, archivedAt, deletedAt)
 * - Comments and activity logging
 * - Display formatting (date displays, age display, status badges)
 * - Search matching
 *
 * This reduces code duplication between TodoModel, NoteModel, and ReviewModel.
 */

import type { Comment, ActivityEntry } from "@/types/types";
import type { Timestamp } from "@/types/time";
import { formatDateWithTime, formatAgeDisplay } from "@/utils/formatters";
import { SettingsModel } from "./SettingsModel";
import type { EntityRegistry } from "./EntityRegistry";

/**
 * Common state values for workable entities.
 * TodoModel adds "completed", ReviewModel uses "pending" instead of "active".
 */
export type BaseWorkableState = "active" | "archived" | "deleted";

/**
 * Common interface for workable entities that can be wrapped by BaseWorkableModel.
 * The activity type is generic to support different activity type enums per entity.
 */
export interface BaseWorkableEntity<AT = string> {
  id: string;
  createdAt: Timestamp | number;
  updatedAt?: Timestamp | number;
  archivedAt?: Timestamp | number;
  deletedAt?: Timestamp | number;
  comments: Comment[];
  activity: ActivityEntry<AT>[];
}

/**
 * Summary type for the latest comment, returned by latestComment getter.
 * This is consistent across all workable models.
 */
export interface LatestCommentSummary {
  commentId: string;
  content: string;
  timestamp: Timestamp;
}

/**
 * Abstract base class providing shared functionality for Todo, Note, and Review models.
 *
 * @template T - The raw entity type (Todo, Note, Review)
 * @template AT - The activity type enum for this entity
 */
export abstract class BaseWorkableModel<T extends BaseWorkableEntity<AT>, AT = string> {
  /**
   * The raw entity object wrapped by this model.
   * Access via `raw` getter for a safe clone, or `raw_DONOTUSE` for direct reference.
   */
  protected readonly _raw: T;
  protected _settingsModel: SettingsModel;
  protected _registry?: EntityRegistry;

  constructor(entity: T, settings: SettingsModel, registry?: EntityRegistry) {
    this._raw = entity;
    this._settingsModel = settings;
    this._registry = registry;
  }

  // ============================================================================
  // BASIC PROPERTIES (direct access to raw fields)
  // ============================================================================

  /**
   * Direct reference to raw data - AVOID USING except for internal state checks.
   * @deprecated Use specific getters or `raw` for a safe clone.
   */
  get raw_DONOTUSE(): T {
    return this._raw;
  }

  /**
   * Safe clone of the raw entity. Use this when passing data to hooks/storage.
   */
  get raw(): T {
    return structuredClone(this._raw);
  }

  /**
   * The entity's unique ID with its proper branded type.
   */
  get id(): T["id"] {
    return this._raw.id;
  }

  get createdAt(): number {
    return this._raw.createdAt as number;
  }

  get updatedAt(): number | undefined {
    return this._raw.updatedAt as number | undefined;
  }

  get archivedAt(): number | undefined {
    return this._raw.archivedAt as number | undefined;
  }

  get deletedAt(): number | undefined {
    return this._raw.deletedAt as number | undefined;
  }

  get settings(): SettingsModel {
    return this._settingsModel;
  }

  // ============================================================================
  // STATE CHECKS (abstract - implementations define their specific state logic)
  // ============================================================================

  /**
   * Whether this entity is in the "active" state.
   * Must be implemented by subclasses to check against their specific state field.
   */
  abstract get isActive(): boolean;

  /**
   * Whether this entity is archived.
   * Must be implemented by subclasses to check against their specific state field.
   */
  abstract get isArchived(): boolean;

  /**
   * Whether this entity is deleted.
   * Must be implemented by subclasses to check against their specific state field.
   */
  abstract get isDeleted(): boolean;

  // ============================================================================
  // COMMENTS
  // ============================================================================

  get comments(): Comment[] {
    return this._raw.comments.map((c) => structuredClone(c));
  }

  get hasComments(): boolean {
    return this._raw.comments.length > 0;
  }

  get commentCount(): number {
    return this._raw.comments.length;
  }

  /**
   * Get the most recent comment's content summary.
   * Returns null if no comments exist.
   * Returns a new object (copy) to prevent external modification.
   */
  get latestComment(): LatestCommentSummary | null {
    if (this._raw.comments.length === 0) return null;
    const comment = this._raw.comments[this._raw.comments.length - 1];
    const latestHistory = comment.history[comment.history.length - 1];
    return {
      commentId: comment.commentId as string,
      content: latestHistory.content,
      timestamp: latestHistory.timestamp,
    };
  }

  // ============================================================================
  // ACTIVITY
  // ============================================================================

  get activity(): ActivityEntry<AT>[] {
    return this._raw.activity.map((a) => structuredClone(a));
  }

  get hasActivity(): boolean {
    return this._raw.activity.length > 0;
  }

  get activityCount(): number {
    return this._raw.activity.length;
  }

  /**
   * Get the most recent activity entry.
   * Returns null if no activity exists.
   * Returns a copy to prevent external modification.
   */
  get latestActivity(): ActivityEntry<AT> | null {
    if (this._raw.activity.length === 0) return null;
    return structuredClone(this._raw.activity[this._raw.activity.length - 1]);
  }

  // ============================================================================
  // DATE DISPLAY HELPERS
  // ============================================================================

  /**
   * Get formatted created date with time (e.g., "1/15/2024 2:30 PM")
   */
  get createdDateDisplay(): string {
    return formatDateWithTime(this.createdAt);
  }

  /**
   * Get formatted updated date with time, or undefined if never updated.
   */
  get updatedDateDisplay(): string | undefined {
    if (!this.updatedAt) return undefined;
    return formatDateWithTime(this.updatedAt);
  }

  /**
   * Get formatted archived date with time, or undefined if not archived.
   */
  get archivedDateDisplay(): string | undefined {
    if (!this.archivedAt) return undefined;
    return formatDateWithTime(this.archivedAt);
  }

  /**
   * Get time since creation in human-readable format.
   * (e.g., "just now", "5 minutes ago", "3 days ago")
   */
  get ageDisplay(): string {
    return formatAgeDisplay(this.createdAt);
  }

  // ============================================================================
  // VALIDATION METHODS (base implementations, can be overridden)
  // ============================================================================

  /**
   * Check if this entity can be archived.
   * @returns Validation result with reason if not allowed
   */
  canArchive(): { canArchive: boolean; reason?: string } {
    if (this.isArchived) {
      return { canArchive: false, reason: `${this.entityTypeName} is already archived` };
    }
    if (this.isDeleted) {
      return { canArchive: false, reason: `${this.entityTypeName} is deleted` };
    }
    return { canArchive: true };
  }

  /**
   * Check if this entity can be unarchived.
   * @returns Validation result with reason if not allowed
   */
  canUnarchive(): { canUnarchive: boolean; reason?: string } {
    if (!this.isArchived) {
      return { canUnarchive: false, reason: `${this.entityTypeName} is not archived` };
    }
    return { canUnarchive: true };
  }

  /**
   * Check if this entity can be deleted.
   * @returns Validation result with reason if not allowed
   */
  canDelete(): { canDelete: boolean; reason?: string } {
    if (this.isDeleted) {
      return { canDelete: false, reason: `${this.entityTypeName} is already deleted` };
    }
    return { canDelete: true };
  }

  /**
   * Entity type name for display in validation messages (e.g., "Task", "Note", "Review")
   */
  protected abstract get entityTypeName(): string;

  // ============================================================================
  // DISPLAY HELPERS
  // ============================================================================

  /**
   * Get status badge text based on current state.
   * Override in subclasses for entity-specific badges.
   */
  get statusBadge(): string {
    if (this.isArchived) return "Archived";
    if (this.isDeleted) return "Deleted";
    return "Active";
  }

  /**
   * Get status color for UI.
   * Override in subclasses for entity-specific colors.
   */
  get statusColor(): string {
    if (this.isArchived) return "#6b7280"; // gray
    if (this.isDeleted) return "#ef4444"; // red
    return "#3b82f6"; // blue
  }

  // ============================================================================
  // SEARCH (base implementation, should be extended by subclasses)
  // ============================================================================

  /**
   * Check if entity matches search text.
   * Subclasses should override this to include entity-specific fields.
   *
   * @param searchText - Text to search for (case-insensitive)
   * @returns true if any field matches
   */
  matchesSearch(searchText: string): boolean {
    if (searchText === "") return true;
    // Base implementation - subclasses add specific field searches
    return false;
  }

  // ============================================================================
  // SETTINGS UPDATE
  // ============================================================================

  /**
   * Update the underlying settings and registry (useful when settings change).
   */
  updateSettings(settings: SettingsModel, registry?: EntityRegistry) {
    this._settingsModel = settings;
    if (registry !== undefined) {
      this._registry = registry;
    }
  }
}
