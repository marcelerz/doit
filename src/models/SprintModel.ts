/**
 * SprintModel - Model wrapper for Sprint entities
 *
 * Provides computed properties, validation methods, and business logic
 * for Sprint entities. Follows the same patterns as TodoModel, NoteModel,
 * and ReviewModel.
 */

import { latestComment, CommentSummary } from "@/utils/commentMutations";
import { Sprint, SprintId, SprintStatus, getSprintId } from "@/types/sprint";
import type { Comment, ActivityEntry, Color } from "@/types/types";
import { generatePrefixedUUID } from "@/utils/idGenerator";
import { formatDateWithTime, formatAgeDisplay } from "@/utils/formatters";
import { parseLocalDate, formatDateKey } from "@/utils/dateUtils";

/**
 * Status colors for sprint states
 */
const statusColors: Record<SprintStatus, string> = {
  planning: "#60a5fa", // blue
  active: "#4ade80", // green
  completed: "#9ca3af", // gray
  cancelled: "#f87171", // red
};

/**
 * Status labels for sprint states
 */
const statusLabels: Record<SprintStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * SprintModel wraps a Sprint object and provides business logic abstractions.
 * This keeps views simple by handling validation and other business rules in one place.
 */
export class SprintModel {
  private _raw: Sprint;

  constructor(sprint: Sprint) {
    this._raw = sprint;
  }

  // ===== Static ID Factory =====

  /**
   * Create a new unique ID for a Sprint.
   * @returns A SprintId with prefix "sprint-" followed by a UUID
   */
  static createId(): SprintId {
    return getSprintId(generatePrefixedUUID("sprint"));
  }

  // ===== Core Sprint Properties =====

  get raw_DONOTUSE(): Sprint {
    return this._raw;
  }

  get id(): SprintId {
    return this._raw.id;
  }

  get name(): string {
    return this._raw.name;
  }

  get goal(): string | undefined {
    return this._raw.goal;
  }

  get state(): "active" | "archived" {
    return this._raw.state;
  }

  get status(): SprintStatus {
    return this._raw.status;
  }

  get createdAt(): number {
    return this._raw.createdAt;
  }

  get startedAt(): number | undefined {
    return this._raw.startedAt;
  }

  get completedAt(): number | undefined {
    return this._raw.completedAt;
  }

  get cancelledAt(): number | undefined {
    return this._raw.cancelledAt;
  }

  get archivedAt(): number | undefined {
    return this._raw.archivedAt;
  }

  get plannedStartDate(): string | undefined {
    return this._raw.plannedStartDate;
  }

  get actualStartDate(): string | undefined {
    return this._raw.actualStartDate;
  }

  get actualEndDate(): string | undefined {
    return this._raw.actualEndDate;
  }

  get durationDays(): number {
    return this._raw.durationDays;
  }

  get color(): Color | undefined {
    return this._raw.color;
  }

  // ===== Comments and Activity =====

  get comments(): Comment[] {
    return (this._raw.comments || []).map((c) => structuredClone(c));
  }

  get activity(): ActivityEntry<string>[] {
    return (this._raw.activity || []).map((a) => structuredClone(a));
  }

  get hasComments(): boolean {
    return (this._raw.comments || []).length > 0;
  }

  get commentCount(): number {
    return (this._raw.comments || []).length;
  }

  get hasActivity(): boolean {
    return (this._raw.activity || []).length > 0;
  }

  get activityCount(): number {
    return (this._raw.activity || []).length;
  }

  /**
   * Get the most recent comment
   */
  get latestComment(): CommentSummary | null {
    return latestComment(this._raw.comments || []);
  }

  /**
   * Get the most recent activity
   */
  get latestActivity() {
    const activity = this._raw.activity || [];
    if (activity.length === 0) return null;
    return structuredClone(activity[activity.length - 1]);
  }

  // ===== State Checks =====

  get isActive(): boolean {
    return this._raw.state === "active";
  }

  get isArchived(): boolean {
    return this._raw.state === "archived";
  }

  get isPlanning(): boolean {
    return this._raw.status === "planning";
  }

  get isRunning(): boolean {
    return this._raw.status === "active";
  }

  get isCompleted(): boolean {
    return this._raw.status === "completed";
  }

  get isCancelled(): boolean {
    return this._raw.status === "cancelled";
  }

  // ===== Raw Data Access =====

  /**
   * Get the raw underlying sprint object
   * Returns deep clone - do not modify
   */
  get raw(): Sprint {
    return structuredClone(this._raw);
  }

  // ===== Computed Properties =====

  /**
   * Get the display name for the sprint
   */
  get displayName(): string {
    return this._raw.name;
  }

  /**
   * Get the status label for display
   */
  get statusLabel(): string {
    return statusLabels[this._raw.status];
  }

  /**
   * Get the status color for UI
   */
  get statusColor(): string {
    return statusColors[this._raw.status];
  }

  /**
   * Calculate planned end date from start date + duration
   */
  get plannedEndDate(): string | undefined {
    const startDate = this._raw.actualStartDate || this._raw.plannedStartDate;
    if (!startDate || !this._raw.durationDays) return undefined;

    const start = parseLocalDate(startDate);
    start.setDate(start.getDate() + this._raw.durationDays);
    return formatDateKey(start);
  }

  /**
   * Calculate days remaining (for active sprints)
   * Returns null if sprint is not running
   */
  get daysRemaining(): number | null {
    if (!this.isRunning || !this._raw.actualStartDate) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = parseLocalDate(this._raw.actualStartDate);
    start.setHours(0, 0, 0, 0);

    const daysElapsed = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, this._raw.durationDays - daysElapsed);
  }

  /**
   * Calculate days elapsed since sprint start
   * Returns null if sprint is not running
   */
  get daysElapsed(): number | null {
    if (!this.isRunning || !this._raw.actualStartDate) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = parseLocalDate(this._raw.actualStartDate);
    start.setHours(0, 0, 0, 0);

    // Math.round, not floor: a DST transition makes one local day 23h or 25h.
    return Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate progress as percentage (0-100) of time elapsed
   */
  get progress(): number {
    if (!this.isRunning || !this._raw.actualStartDate) return 0;

    const daysElapsed = this.daysElapsed;
    if (daysElapsed === null) return 0;

    // Guard against division by zero when durationDays is 0
    if (this._raw.durationDays <= 0) return 100;

    return Math.min(100, Math.max(0, (daysElapsed / this._raw.durationDays) * 100));
  }

  // ===== Display Helpers =====

  /**
   * Get formatted created date with time
   */
  get createdDateDisplay(): string {
    return formatDateWithTime(this.createdAt);
  }

  /**
   * Get formatted started date with time
   */
  get startedDateDisplay(): string | undefined {
    if (!this.startedAt) return undefined;
    return formatDateWithTime(this.startedAt);
  }

  /**
   * Get formatted completed date with time
   */
  get completedDateDisplay(): string | undefined {
    if (!this.completedAt) return undefined;
    return formatDateWithTime(this.completedAt);
  }

  /**
   * Get formatted archived date with time
   */
  get archivedDateDisplay(): string | undefined {
    if (!this.archivedAt) return undefined;
    return formatDateWithTime(this.archivedAt);
  }

  /**
   * Get time since creation in human-readable format
   */
  get ageDisplay(): string {
    return formatAgeDisplay(this.createdAt);
  }

  /**
   * Get status badge text
   */
  get statusBadge(): string {
    if (this.isArchived) return "Archived";
    return this.statusLabel;
  }

  // ===== Validation Methods =====

  /**
   * Check if this sprint can be started
   * @param allSprints - All sprints to check for conflicts
   */
  canStart(allSprints: SprintModel[]): { canStart: boolean; reason?: string } {
    if (this.isArchived) {
      return { canStart: false, reason: "Sprint is archived" };
    }
    if (!this.isPlanning) {
      return { canStart: false, reason: "Sprint is not in planning status" };
    }
    // Check if another sprint is already running
    const hasActiveSprint = allSprints.some(
      (s) => s.isRunning && s.id !== this.id
    );
    if (hasActiveSprint) {
      return { canStart: false, reason: "Another sprint is already running" };
    }
    return { canStart: true };
  }

  /**
   * Check if this sprint can be completed
   */
  canComplete(): { canComplete: boolean; reason?: string } {
    if (this.isArchived) {
      return { canComplete: false, reason: "Sprint is archived" };
    }
    if (!this.isRunning) {
      return { canComplete: false, reason: "Sprint is not running" };
    }
    return { canComplete: true };
  }

  /**
   * Check if this sprint can be cancelled
   */
  canCancel(): { canCancel: boolean; reason?: string } {
    if (this.isArchived) {
      return { canCancel: false, reason: "Sprint is archived" };
    }
    if (!this.isPlanning && !this.isRunning) {
      return { canCancel: false, reason: "Sprint is not in planning or active status" };
    }
    return { canCancel: true };
  }

  /**
   * Check if this sprint can be archived
   */
  canArchive(): { canArchive: boolean; reason?: string } {
    if (this.isArchived) {
      return { canArchive: false, reason: "Sprint is already archived" };
    }
    if (!this.isCompleted && !this.isCancelled) {
      return { canArchive: false, reason: "Sprint must be completed or cancelled before archiving" };
    }
    return { canArchive: true };
  }

  /**
   * Check if this sprint can be unarchived
   */
  canUnarchive(): { canUnarchive: boolean; reason?: string } {
    if (!this.isArchived) {
      return { canUnarchive: false, reason: "Sprint is not archived" };
    }
    return { canUnarchive: true };
  }

  /**
   * Check if this sprint can be deleted
   */
  canDelete(): { canDelete: boolean; reason?: string } {
    if (this.isArchived) {
      return { canDelete: false, reason: "Sprint is archived" };
    }
    if (!this.isPlanning) {
      return { canDelete: false, reason: "Only planning sprints can be deleted" };
    }
    return { canDelete: true };
  }

  // ===== Search =====

  /**
   * Check if sprint matches search text
   */
  matchesSearch(searchText: string): boolean {
    if (searchText === "") return true;
    const search = searchText.toLowerCase();

    // Search name
    if (this._raw.name.toLowerCase().includes(search)) return true;

    // Search goal
    if (this._raw.goal && this._raw.goal.toLowerCase().includes(search)) return true;

    // Search status
    if (this.statusLabel.toLowerCase().includes(search)) return true;

    return false;
  }
}

/**
 * Factory function to create SprintModel instances
 */
export function createSprintModel(sprint: Sprint): SprintModel {
  return new SprintModel(sprint);
}

