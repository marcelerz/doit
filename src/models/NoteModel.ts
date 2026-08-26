import {
  Note,
  NoteId,
  NoteState,
  NoteActivityType,
  ActionItem,
  CreatedActionItem,
  getNoteId,
} from "@/types/note";
import type { PersonId } from "@/types/person";
import type { ProjectId } from "@/types/project";
import type { Tag } from "@/types/todo";
import { ActivityEntry } from "@/types/types";
import { generatePrefixedUUID } from "@/utils/idGenerator";
import { formatDateWithTime, formatAgeDisplay, pluralize } from "@/utils/formatters";
import { SettingsModel } from "./SettingsModel";
import { Timestamp } from "@/types/time";

/**
 * NoteModel wraps a Note object and provides business logic abstractions.
 * This keeps views simple by handling validation and other business rules in one place.
 */
export class NoteModel {
  private _raw: Note;
  private _settingsModel: SettingsModel;

  constructor(note: Note, settings: SettingsModel) {
    this._raw = note;
    this._settingsModel = settings;
  }

  // ===== Static ID Factory =====

  /**
   * Create a new unique ID for a Note.
   * @returns A NoteId with prefix "note-" followed by a UUID
   */
  static createId(): NoteId {
    return getNoteId(generatePrefixedUUID("note"));
  }

  // ===== Core Note Properties =====

  get raw_DONOTUSE(): Note {
    return this._raw;
  }

  get id(): NoteId {
    return this._raw.id;
  }

  get text(): string {
    return this._raw.text;
  }

  get plainText(): string {
    return this._raw.plainText;
  }

  get state(): NoteState {
    return this._raw.state;
  }

  get createdAt(): Timestamp {
    return this._raw.createdAt;
  }

  get updatedAt(): Timestamp | undefined {
    return this._raw.updatedAt;
  }

  get archivedAt(): Timestamp | undefined {
    return this._raw.archivedAt;
  }

  get deletedAt(): Timestamp | undefined {
    return this._raw.deletedAt;
  }

  get sortOrder(): number | undefined {
    return this._raw.sortOrder;
  }

  get pinned(): boolean {
    return this._raw.pinned;
  }

  get content(): string {
    return this._raw.content;
  }

  get comments() {
    return this._raw.comments.map((c) => structuredClone(c));
  }

  get activity(): ActivityEntry<NoteActivityType>[] {
    return this._raw.activity.map((a) => structuredClone(a));
  }

  // ===== Actual Field Getters (IDs) =====

  /**
   * Get assigned people IDs
   * Returns a copy to prevent external modification of internal state
   */
  get assignedPeopleIds(): PersonId[] {
    return [...this._raw.assignedPeople];
  }

  /**
   * Get source people IDs
   * Returns a copy to prevent external modification of internal state
   */
  get sourcePeopleIds(): PersonId[] {
    return [...this._raw.sourcePeople];
  }

  /**
   * Get mentioned people IDs
   * Returns a copy to prevent external modification of internal state
   */
  get mentionedPeopleIds(): PersonId[] {
    return [...this._raw.mentionedPeople];
  }

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
   * Maps from Tag[] to string[]
   */
  get tags(): string[] {
    return this.tagIds.map((t) => t as string);
  }

  /**
   * Get assigned people names (string array for UI display)
   */
  get assignedPeople(): string[] {
    // Stored as names, so no resolution step is needed.
    return this.assignedPeopleIds.map((id) => id as string);
  }

  /**
   * Get source people names (string array for UI display)
   */
  get sourcePeople(): string[] {
    // Stored as names, so no resolution step is needed.
    return this.sourcePeopleIds.map((id) => id as string);
  }

  /**
   * Get mentioned people names (string array for UI display)
   */
  get mentionedPeople(): string[] {
    // Stored as names, so no resolution step is needed.
    return this.mentionedPeopleIds.map((id) => id as string);
  }

  /**
   * Get project names (string array for UI display)
   */
  get projects(): string[] {
    // Stored as names, so no resolution step is needed.
    return this.projectIds.map((id) => id as string);
  }

  // ===== Action Items =====

  /**
   * Get pending action items (not yet converted to todos)
   * Returns copies to prevent external modification
   */
  get actionItems(): ActionItem[] {
    return (this._raw.actionItems || []).map((item) => structuredClone(item));
  }

  /**
   * Get created action items (already converted to todos)
   * Returns copies to prevent external modification
   */
  get createdActionItems(): CreatedActionItem[] {
    return (this._raw.createdActionItems || []).map((item) => structuredClone(item));
  }

  /**
   * Get count of pending action items
   * Note: Uses _raw for performance
   */
  get pendingActionItemCount(): number {
    return (this._raw.actionItems || []).length;
  }

  /**
   * Get count of created (converted) action items
   * Note: Uses _raw for performance
   */
  get createdActionItemCount(): number {
    return (this._raw.createdActionItems || []).length;
  }

  /**
   * Check if note has any pending action items
   * Note: Uses _raw for performance
   */
  get hasPendingActionItems(): boolean {
    return this.pendingActionItemCount > 0;
  }

  /**
   * Check if note has any created action items
   * Note: Uses _raw for performance
   */
  get hasCreatedActionItems(): boolean {
    return this.createdActionItemCount > 0;
  }

  // ===== State Checks =====

  get isActive(): boolean {
    return this.state === "active";
  }

  get isArchived(): boolean {
    return this.state === "archived";
  }

  get isDeleted(): boolean {
    return this.state === "deleted";
  }

  get isPinned(): boolean {
    return this.pinned;
  }

  // ===== Metadata Operations =====

  /**
   * Get the raw underlying note object
   * WARNING: Returns reference to internal state - do not modify
   */
  get raw(): Note {
    return structuredClone(this._raw);
  }

  /**
   * Get the settings model
   */
  get settings(): SettingsModel {
    return this._settingsModel;
  }

  /**
   * Check if the note has any fields assigned (excluding content)
   * Note: Uses raw for performance - this checks actual stored values
   */
  get hasFields(): boolean {
    return (
      this._raw.assignedPeople.length > 0 ||
      this._raw.sourcePeople.length > 0 ||
      this._raw.mentionedPeople.length > 0 ||
      this._raw.projects.length > 0 ||
      this._raw.tags.length > 0
    );
  }

  /**
   * Check if the note has content
   */
  get hasContent(): boolean {
    return this._raw.content.trim().length > 0;
  }

  // ===== Display Helpers =====

  /**
   * Get number of comments
   * Note: Uses _raw for performance
   */
  get commentCount(): number {
    return this._raw.comments.length;
  }

  /**
   * Check if this note has comments
   * Note: Uses _raw for performance
   */
  get hasComments(): boolean {
    return this._raw.comments.length > 0;
  }

  /**
   * Get number of activity entries
   * Note: Uses _raw for performance
   */
  get activityCount(): number {
    return this._raw.activity.length;
  }

  /**
   * Check if this note has activity
   * Note: Uses _raw for performance
   */
  get hasActivity(): boolean {
    return this._raw.activity.length > 0;
  }

  /**
   * Get the most recent comment
   * Returns null if no comments exist
   */
  get latestComment() {
    if (this._raw.comments.length === 0) return null;
    const comment = this._raw.comments[this._raw.comments.length - 1];
    const latestHistory = comment.history[comment.history.length - 1];
    return {
      commentId: comment.commentId,
      content: latestHistory.content,
      timestamp: latestHistory.timestamp,
    };
  }

  /**
   * Get the most recent activity
   * Returns null if no activity exists
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

  // ===== Display/Formatting Methods =====

  /**
   * Get a summary of the note (truncated text)
   */
  getSummary(maxLength: number = 100): string {
    if (this.plainText.length <= maxLength) return this.plainText;
    return this.plainText.substring(0, maxLength) + "...";
  }

  /**
   * Get a content preview (truncated content)
   */
  getContentPreview(maxLength: number = 150): string {
    const plainContent = this.content.replace(/<[^>]*>/g, "").trim();
    if (plainContent.length <= maxLength) return plainContent;
    return plainContent.substring(0, maxLength) + "...";
  }

  /**
   * Get status badge text
   */
  get statusBadge(): string {
    if (this.isArchived) return "Archived";
    if (this.isDeleted) return "Deleted";
    if (this.isPinned) return "Pinned";
    return "Active";
  }

  /**
   * Get status color for UI
   */
  get statusColor(): string {
    if (this.isArchived) return "#6b7280"; // gray
    if (this.isDeleted) return "#ef4444"; // red
    if (this.isPinned) return "#f59e0b"; // amber
    return "#3b82f6"; // blue
  }

  /**
   * Get metadata summary for display
   */
  get metadataSummary(): string {
    const parts: string[] = [];

    const assignedCount = this.assignedPeopleIds.length;
    if (assignedCount > 0) {
      parts.push(`${assignedCount} ${pluralize(assignedCount, "person", "people")}`);
    }

    const projectCount = this.projectIds.length;
    if (projectCount > 0) {
      parts.push(`${projectCount} ${pluralize(projectCount, "project")}`);
    }

    const tagCount = this.tagIds.length;
    if (tagCount > 0) {
      parts.push(`${tagCount} ${pluralize(tagCount, "tag")}`);
    }

    const actionItemCount = this.pendingActionItemCount;
    if (actionItemCount > 0) {
      parts.push(`${actionItemCount} action ${pluralize(actionItemCount, "item")}`);
    }

    return parts.length > 0 ? parts.join(", ") : "No metadata";
  }

  /**
   * Check if note matches search text
   */
  matchesSearch(searchText: string): boolean {
    if (searchText === "") return true;
    const search = searchText.toLowerCase();

    // Search plain text (title)
    if (this.plainText.toLowerCase().includes(search)) return true;

    // Search content
    const plainContent = this.content.replace(/<[^>]*>/g, "").toLowerCase();
    if (plainContent.includes(search)) return true;

    // Search tags
    if (this.tags.some((t) => t.toLowerCase().includes(search))) return true;

    // People and projects are stored as names, so the id strings are
    // searchable directly - the previous implementation went through a
    // registry that was never supplied, so this matched nothing.
    const relatedNames = [
      ...this.assignedPeopleIds,
      ...this.sourcePeopleIds,
      ...this.mentionedPeopleIds,
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
   * Check if this note can be archived
   */
  canArchive(): { canArchive: boolean; reason?: string } {
    if (this.isArchived) {
      return { canArchive: false, reason: "Note is already archived" };
    }
    if (this.isDeleted) {
      return { canArchive: false, reason: "Note is deleted" };
    }
    return { canArchive: true };
  }

  /**
   * Check if this note can be deleted
   */
  canDelete(): { canDelete: boolean; reason?: string } {
    if (this.isDeleted) {
      return { canDelete: false, reason: "Note is already deleted" };
    }
    return { canDelete: true };
  }

  /**
   * Check if this note can be unarchived
   */
  canUnarchive(): { canUnarchive: boolean; reason?: string } {
    if (!this.isArchived) {
      return { canUnarchive: false, reason: "Note is not archived" };
    }
    return { canUnarchive: true };
  }
}

/**
 * Create NoteModel instances from an array of notes
 * Filters out any undefined/null entries
 */
export function createNoteModels(notes: Note[], settings: SettingsModel): NoteModel[] {
  return notes.filter((note) => note != null).map((note) => new NoteModel(note, settings));
}
