import {
  Review,
  ReviewId,
  ReviewState,
  ReviewLevel,
  ReviewActivityType,
  ReviewEntry,
  ReviewTaskEntry,
  ReviewChildEntry,
  getReviewId,
} from "@/types/review";
import { latestComment, CommentSummary } from "@/utils/commentMutations";
import type { ProjectId } from "@/types/project";
import type { Tag } from "@/types/todo";
import { ActivityEntry } from "@/types/types";
import { generatePrefixedUUID } from "@/utils/idGenerator";
import { formatDateWithTime, formatAgeDisplay, pluralize } from "@/utils/formatters";
import { SettingsModel } from "./SettingsModel";
import { Timestamp } from "@/types/time";

/**
 * ReviewModel wraps a Review object and provides business logic abstractions.
 * This keeps views simple by handling validation and other business rules in one place.
 */
export class ReviewModel {
  private _raw: Review;
  private _settingsModel: SettingsModel;

  constructor(review: Review, settings: SettingsModel) {
    this._raw = review;
    this._settingsModel = settings;
  }

  // ===== Static ID Factory =====

  /**
   * Create a new unique ID for a Review.
   * @returns A ReviewId with prefix "review-" followed by a UUID
   */
  static createId(): ReviewId {
    return getReviewId(generatePrefixedUUID("review"));
  }

  // ===== Core Review Properties =====

  get raw_DONOTUSE(): Review {
    return this._raw;
  }

  get id(): ReviewId {
    return this._raw.id;
  }

  get level(): ReviewLevel {
    return this._raw.level;
  }

  get periodStart(): string {
    return this._raw.periodStart;
  }

  get periodEnd(): string {
    return this._raw.periodEnd;
  }

  get periodLabel(): string {
    return this._raw.periodLabel;
  }

  get state(): ReviewState {
    return this._raw.state;
  }

  get createdAt(): Timestamp {
    return this._raw.createdAt;
  }

  get updatedAt(): Timestamp | undefined {
    return this._raw.updatedAt;
  }

  get completedAt(): Timestamp | undefined {
    return this._raw.completedAt;
  }

  get archivedAt(): Timestamp | undefined {
    return this._raw.archivedAt;
  }

  get deletedAt(): Timestamp | undefined {
    return this._raw.deletedAt;
  }

  get title(): string {
    return this._raw.title;
  }

  get summary(): string {
    return this._raw.summary;
  }

  get comments() {
    return this._raw.comments.map((c) => structuredClone(c));
  }

  get activity(): ActivityEntry<ReviewActivityType>[] {
    return this._raw.activity.map((a) => structuredClone(a));
  }

  // ===== Entries =====

  /**
   * Get all entries (tasks and child reviews)
   * Returns copies to prevent external modification
   */
  get entries(): ReviewEntry[] {
    return this._raw.entries.map((e) => structuredClone(e));
  }

  /**
   * Get task entries only
   */
  get taskEntries(): ReviewTaskEntry[] {
    return this._raw.entries
      .filter((e): e is ReviewTaskEntry => e.type === "task")
      .map((e) => structuredClone(e));
  }

  /**
   * Get child review entries only
   */
  get childReviewEntries(): ReviewChildEntry[] {
    return this._raw.entries
      .filter((e): e is ReviewChildEntry => e.type === "review")
      .map((e) => structuredClone(e));
  }

  /**
   * Get count of task entries
   */
  get taskCount(): number {
    return this._raw.entries.filter((e) => e.type === "task").length;
  }

  /**
   * Get count of child review entries
   */
  get childReviewCount(): number {
    return this._raw.entries.filter((e) => e.type === "review").length;
  }

  /**
   * Get total entry count
   */
  get entryCount(): number {
    return this._raw.entries.length;
  }

  /**
   * Check if review has any entries
   */
  get hasEntries(): boolean {
    return this._raw.entries.length > 0;
  }

  // ===== Metadata Getters =====

  /**
   * Get project IDs
   * Returns a copy to prevent external modification of internal state
   */
  get projectIds(): ProjectId[] {
    return [...this._raw.projects];
  }

  /**
   * Get tags
   * Returns a copy to prevent external modification of internal state
   */
  get tagIds(): Tag[] {
    return [...(this._raw.tags || [])];
  }

  /**
   * Get tags (string array for backward compatibility)
   */
  get tags(): string[] {
    return this.tagIds.map((t) => t as string);
  }

  /**
   * Get project names (string array for UI display)
   */
  get projects(): string[] {
    // Stored as names, so no resolution step is needed.
    return this.projectIds.map((id) => id as string);
  }

  // ===== State Checks =====

  get isPending(): boolean {
    return this.state === "pending";
  }

  get isCompleted(): boolean {
    return this.state === "completed";
  }

  get isArchived(): boolean {
    return this.state === "archived";
  }

  get isDeleted(): boolean {
    return this.state === "deleted";
  }

  /**
   * Check if the review is editable
   * Only pending reviews can be edited
   */
  get isEditable(): boolean {
    return this.isPending;
  }

  // ===== Raw Data Access =====

  /**
   * Get the raw underlying review object
   * WARNING: Returns deep clone - do not modify
   */
  get raw(): Review {
    return structuredClone(this._raw);
  }

  /**
   * Get the settings model
   */
  get settings(): SettingsModel {
    return this._settingsModel;
  }

  // ===== Display Helpers =====

  /**
   * Get display label for the review level
   */
  get levelDisplayLabel(): string {
    switch (this.level) {
      case "day":
        return "Daily";
      case "week":
        return "Weekly";
      case "month":
        return "Monthly";
      case "half":
        return "Half-Year";
      case "year":
        return "Yearly";
      default:
        return this.level;
    }
  }

  /**
   * Get short display label for the review level
   */
  get levelShortLabel(): string {
    switch (this.level) {
      case "day":
        return "Day";
      case "week":
        return "Week";
      case "month":
        return "Month";
      case "half":
        return "Half";
      case "year":
        return "Year";
      default:
        return this.level;
    }
  }

  /**
   * Get state display text
   */
  get stateDisplayLabel(): string {
    switch (this.state) {
      case "pending":
        return "Draft";
      case "completed":
        return "Completed";
      case "archived":
        return "Archived";
      case "deleted":
        return "Deleted";
      default:
        return this.state;
    }
  }

  /**
   * Get status badge text
   */
  get statusBadge(): string {
    if (this.isPending) return "Draft";
    if (this.isCompleted) return "Completed";
    if (this.isArchived) return "Archived";
    if (this.isDeleted) return "Deleted";
    return "Unknown";
  }

  /**
   * Get status color for UI
   */
  get statusColor(): string {
    if (this.isPending) return "#f59e0b"; // amber
    if (this.isCompleted) return "#10b981"; // green
    if (this.isArchived) return "#6b7280"; // gray
    if (this.isDeleted) return "#ef4444"; // red
    return "#3b82f6"; // blue
  }

  /**
   * Get number of comments
   */
  get commentCount(): number {
    return this._raw.comments.length;
  }

  /**
   * Check if this review has comments
   */
  get hasComments(): boolean {
    return this._raw.comments.length > 0;
  }

  /**
   * Get number of activity entries
   */
  get activityCount(): number {
    return this._raw.activity.length;
  }

  /**
   * Check if this review has activity
   */
  get hasActivity(): boolean {
    return this._raw.activity.length > 0;
  }

  /**
   * Get the most recent comment
   */
  get latestComment(): CommentSummary | null {
    return latestComment(this._raw.comments);
  }

  /**
   * Get the most recent activity
   */
  get latestActivity() {
    if (this._raw.activity.length === 0) return null;
    return structuredClone(this._raw.activity[this._raw.activity.length - 1]);
  }

  /**
   * Get formatted created date with time
   */
  get createdDateDisplay(): string {
    return formatDateWithTime(this.createdAt);
  }

  /**
   * Get formatted updated date with time
   */
  get updatedDateDisplay(): string | undefined {
    if (!this.updatedAt) return undefined;
    return formatDateWithTime(this.updatedAt);
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
   * Check if review has any content
   */
  get hasContent(): boolean {
    return this._raw.summary.trim().length > 0;
  }

  /**
   * Get a summary preview (truncated summary)
   */
  getSummaryPreview(maxLength: number = 150): string {
    const plainSummary = this.summary.replace(/<[^>]*>/g, "").trim();
    if (plainSummary.length <= maxLength) return plainSummary;
    return plainSummary.substring(0, maxLength) + "...";
  }

  /**
   * Get metadata summary for display
   */
  get metadataSummary(): string {
    const parts: string[] = [];

    const taskCount = this.taskCount;
    if (taskCount > 0) {
      parts.push(`${taskCount} ${pluralize(taskCount, "task")}`);
    }

    const childCount = this.childReviewCount;
    if (childCount > 0) {
      parts.push(`${childCount} ${pluralize(childCount, "review")}`);
    }

    const projectCount = this.projectIds.length;
    if (projectCount > 0) {
      parts.push(`${projectCount} ${pluralize(projectCount, "project")}`);
    }

    const tagCount = this.tagIds.length;
    if (tagCount > 0) {
      parts.push(`${tagCount} ${pluralize(tagCount, "tag")}`);
    }

    return parts.length > 0 ? parts.join(", ") : "No entries";
  }

  // ===== Search =====

  /**
   * Check if review matches search text
   */
  matchesSearch(searchText: string): boolean {
    if (searchText === "") return true;
    const search = searchText.toLowerCase();

    // Search title
    if (this.title.toLowerCase().includes(search)) return true;

    // Search period label
    if (this.periodLabel.toLowerCase().includes(search)) return true;

    // Search summary content
    const plainSummary = this.summary.replace(/<[^>]*>/g, "").toLowerCase();
    if (plainSummary.includes(search)) return true;

    // Search tags
    if (this.tags.some((t) => t.toLowerCase().includes(search))) return true;

    // Search entry titles
    for (const entry of this._raw.entries) {
      if (entry.title.toLowerCase().includes(search)) return true;
      if (entry.content && entry.content.replace(/<[^>]*>/g, "").toLowerCase().includes(search)) return true;
    }

    // People and projects are stored as names, so the id strings are
    // searchable directly - the previous implementation went through a
    // registry that was never supplied, so this matched nothing.
    const relatedNames = [
      ...this.projectIds,
    ];
    if (relatedNames.some((name) => (name as string).toLowerCase().includes(search))) return true;

    return false;
  }

  /**
   * Update the underlying settings (useful when settings change)
   */
  updateSettings(settings: SettingsModel) {
    this._settingsModel = settings;
  }

  // ===== Validation Methods =====

  /**
   * Check if this review can be completed
   */
  canComplete(): { canComplete: boolean; reason?: string } {
    if (!this.isPending) {
      return { canComplete: false, reason: "Review is not in pending state" };
    }
    return { canComplete: true };
  }

  /**
   * Check if this review can be archived
   */
  canArchive(): { canArchive: boolean; reason?: string } {
    if (this.isArchived) {
      return { canArchive: false, reason: "Review is already archived" };
    }
    if (this.isDeleted) {
      return { canArchive: false, reason: "Review is deleted" };
    }
    if (this.isPending) {
      return { canArchive: false, reason: "Review must be completed before archiving" };
    }
    return { canArchive: true };
  }

  /**
   * Check if this review can be deleted
   */
  canDelete(): { canDelete: boolean; reason?: string } {
    if (this.isDeleted) {
      return { canDelete: false, reason: "Review is already deleted" };
    }
    return { canDelete: true };
  }

  /**
   * Check if this review can be unarchived
   */
  canUnarchive(): { canUnarchive: boolean; reason?: string } {
    if (!this.isArchived) {
      return { canUnarchive: false, reason: "Review is not archived" };
    }
    return { canUnarchive: true };
  }
}

/**
 * Create ReviewModel instances from an array of reviews
 * Filters out any undefined/null entries
 */
export function createReviewModels(reviews: Review[], settings: SettingsModel): ReviewModel[] {
  return reviews.filter((review) => review != null).map((review) => new ReviewModel(review, settings));
}
