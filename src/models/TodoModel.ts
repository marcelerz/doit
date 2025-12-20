import { Todo, TodoMetadata, TodoState } from "@/types/todo";
import { ActivityEntry } from "@/types/types";
import { DurationMin, getDurationMin } from "@/types/time";
import { normalizeDateValue, parseDate } from "@/utils/dateUtils";
import { parseRecurringPattern } from "@/utils/recurringParser";
import { SettingsModel } from "./SettingsModel";

/**
 * TodoModel wraps a Todo object and provides business logic abstractions.
 * This keeps views simple by handling auto-assignment, date calculations,
 * validation, and other business rules in one place.
 */
export class TodoModel {
  private _raw: Todo;
  private _settingsModel: SettingsModel;

  constructor(todo: Todo, settings: SettingsModel) {
    this._raw = todo;
    this._settingsModel = settings;
  }

  // ===== Core Todo Properties =====

  get raw_DONOTUSE(): Todo {
    return this._raw;
  }

  get id(): string {
    return this._raw.id;
  }

  get text(): string {
    return this._raw.text;
  }

  get plainText(): string {
    return this._raw.plainText;
  }

  get state(): TodoState {
    return this._raw.state;
  }

  get createdAt(): number {
    return this._raw.createdAt;
  }

  get updatedAt(): number | undefined {
    return this._raw.updatedAt;
  }

  get completedAt(): number | undefined {
    return this._raw.completedAt;
  }

  get archivedAt(): number | undefined {
    return this._raw.archivedAt;
  }

  get deletedAt(): number | undefined {
    return this._raw.deletedAt;
  }

  get workflowState(): string | undefined {
    return this._raw.workflowState;
  }

  get sortOrder(): number | undefined {
    return this._raw.sortOrder;
  }

  get comments() {
    return this._raw.comments.map((c) => structuredClone(c));
  }

  get activity(): ActivityEntry<string>[] {
    return this._raw.activity.map((a) => structuredClone(a));
  }

  get context(): string | undefined {
    return this._raw.metadata.context;
  }

  // ===== Smart Metadata Getters with Auto-Assign =====

  /**
   * Get assigned people with auto-assign fallback if enabled and empty
   * Returns a copy to prevent external modification of internal state
   */
  get assignedPeople(): string[] {
    if (this._raw.metadata.assignedPeople.length > 0) {
      return [...this._raw.metadata.assignedPeople];
    }
    // Apply auto-assign if enabled and no explicit assignment
    const defaultPerson = this._settingsModel.defaultAssignedPerson;
    if (defaultPerson) {
      return [defaultPerson];
    }
    return [];
  }

  /**
   * Get raw assigned people without auto-assign fallback
   * Returns a copy to prevent external modification of internal state
   */
  get assignedPeopleRaw(): string[] {
    return [...this._raw.metadata.assignedPeople];
  }

  /**
   * Get source people with auto-assign fallback if enabled and empty
   * Returns a copy to prevent external modification of internal state
   */
  get sourcePeople(): string[] {
    if (this._raw.metadata.sourcePeople.length > 0) {
      return [...this._raw.metadata.sourcePeople];
    }
    // Apply auto-assign if enabled and no explicit source
    const defaultSource = this._settingsModel.defaultSourcePerson;
    if (defaultSource) {
      return [defaultSource];
    }
    return [];
  }

  /**
   * Get raw source people without auto-assign fallback
   * Returns a copy to prevent external modification of internal state
   */
  get sourcePeopleRaw(): string[] {
    return [...this._raw.metadata.sourcePeople];
  }

  get mentionedPeople(): string[] {
    return [...this._raw.metadata.mentionedPeople];
  }

  /**
   * Get projects with auto-assign fallback if enabled and empty
   * Returns a copy to prevent external modification of internal state
   */
  get projects(): string[] {
    if (this._raw.metadata.projects.length > 0) {
      return [...this._raw.metadata.projects];
    }
    // Apply auto-assign if enabled and no explicit project
    const defaultProject = this._settingsModel.defaultProject;
    if (defaultProject) {
      return [defaultProject];
    }
    return [];
  }

  /**
   * Get raw projects without auto-assign fallback
   * Returns a copy to prevent external modification of internal state
   */
  get projectsRaw(): string[] {
    return [...this._raw.metadata.projects];
  }

  /**
   * Get priority with auto-assign fallback if enabled and empty
   */
  get priority(): string | undefined {
    if (this._raw.metadata.priority) {
      return this._raw.metadata.priority;
    }
    // Apply auto-assign if enabled and no explicit priority
    return this._settingsModel.defaultPriority;
  }

  /**
   * Get raw priority without auto-assign fallback
   */
  get priorityRaw(): string | undefined {
    return this._raw.metadata.priority;
  }

  /**
   * Get due date with auto-assign fallback and normalization
   */
  get dueDate(): string | undefined {
    const rawDueDate = this._raw.metadata.dueDate;
    if (rawDueDate) {
      // Normalize shorthand values like "today", "tomorrow", etc.
      return normalizeDateValue(rawDueDate, this._settingsModel.dateTime, this._settingsModel.workHours);
    }
    // Apply auto-assign if enabled and no explicit due date
    const defaultDueDate = this._settingsModel.defaultDueDate;
    if (defaultDueDate) {
      return normalizeDateValue(defaultDueDate, this._settingsModel.dateTime, this._settingsModel.workHours);
    }
    return undefined;
  }

  /**
   * Get raw due date without auto-assign fallback or normalization
   */
  get dueDateRaw(): string | undefined {
    return this._raw.metadata.dueDate;
  }

  /**
   * Get due date as a Date object
   */
  get dueDateObject(): Date | undefined {
    const dateStr = this.dueDate;
    if (!dateStr) return undefined;
    const parsed = parseDate(dateStr, this._settingsModel.dateTime, this._settingsModel.workHours);
    return parsed ? new Date(parsed.timestamp) : undefined;
  }

  /**
   * Get duration with auto-assign fallback if enabled and empty
   */
  get duration(): string | undefined {
    if (this._raw.metadata.duration) {
      return this._raw.metadata.duration;
    }
    // Apply auto-assign if enabled and no explicit duration
    return this._settingsModel.defaultDuration;
  }

  /**
   * Get raw duration without auto-assign fallback
   */
  get durationRaw(): string | undefined {
    return this._raw.metadata.duration;
  }

  /**
   * Get duration in minutes
   */
  get durationMinutes(): number | undefined {
    const dur = this.duration;
    if (!dur) return undefined;

    // Parse duration string (e.g., "30m", "2h", "1.5h", "90m")
    const match = dur.match(/^(\d+(?:\.\d+)?)(m|h|min|mins|hour|hours)?$/i);
    if (!match) return undefined;

    const value = parseFloat(match[1]);
    const unit = (match[2] || "m").toLowerCase();

    if (unit.startsWith("h")) {
      return value * 60;
    }
    return value;
  }

  /**
   * Get recurring pattern with auto-assign fallback if enabled and empty
   */
  get recurring(): string | undefined {
    if (this._raw.metadata.recurring) {
      return this._raw.metadata.recurring;
    }
    // Apply auto-assign if enabled and no explicit recurring
    return this._settingsModel.defaultRecurring;
  }

  /**
   * Get raw recurring pattern without auto-assign fallback
   */
  get recurringRaw(): string | undefined {
    return this._raw.metadata.recurring;
  }

  /**
   * Check if this is a recurring task
   */
  get isRecurring(): boolean {
    return !!this.recurring;
  }

  /**
   * Get parsed recurring pattern
   */
  get recurringPattern() {
    const pattern = this.recurring;
    if (!pattern) return null;
    return parseRecurringPattern(pattern);
  }

  get dependencies(): string[] {
    return [...(this._raw.metadata.dependencies ?? [])];
  }

  get tags(): string[] {
    return [...(this._raw.metadata.tags ?? [])];
  }

  get sprint(): string | undefined {
    return this._raw.metadata.sprint;
  }

  // ===== State Checks =====

  get isActive(): boolean {
    return this._raw.state === "active";
  }

  get isCompleted(): boolean {
    return this._raw.state === "completed";
  }

  get isArchived(): boolean {
    return this._raw.state === "archived";
  }

  get isDeleted(): boolean {
    return this._raw.state === "deleted";
  }

  // ===== Date Calculations =====

  /**
   * Check if the task is overdue (due date is in the past and not completed)
   */
  get isOverdue(): boolean {
    if (this.isCompleted || this.isArchived || this.isDeleted) return false;
    const dueDate = this.dueDateObject;
    if (!dueDate) return false;
    return dueDate < new Date();
  }

  /**
   * Check if the task is due today
   */
  get isDueToday(): boolean {
    const dueDate = this.dueDateObject;
    if (!dueDate) return false;
    const today = new Date();
    return (
      dueDate.getFullYear() === today.getFullYear() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getDate() === today.getDate()
    );
  }

  /**
   * Check if the task is due this week
   */
  get isDueThisWeek(): boolean {
    const dueDate = this.dueDateObject;
    if (!dueDate) return false;
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    return dueDate >= today && dueDate <= weekFromNow;
  }

  /**
   * Get days until due (negative if overdue)
   */
  get daysUntilDue(): number | undefined {
    const dueDate = this.dueDateObject;
    if (!dueDate) return undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ===== Metadata Operations =====

  /**
   * Get the raw metadata object
   * Returns a deep copy to prevent external modification of internal state
   */
  get metadata(): TodoMetadata {
    return structuredClone(this._raw.metadata);
  }

  /**
   * Get the raw underlying todo object
   * WARNING: Returns reference to internal state - do not modify
   */
  get raw(): Todo {
    return structuredClone(this._raw);
  }

  /**
   * Get the settings model
   */
  get settings(): SettingsModel {
    return this._settingsModel;
  }

  /**
   * Check if the todo has any metadata assigned (excluding context)
   */
  get hasMetadata(): boolean {
    return (
      this.assignedPeopleRaw.length > 0 ||
      this.sourcePeopleRaw.length > 0 ||
      this.mentionedPeople.length > 0 ||
      this.projectsRaw.length > 0 ||
      !!this.priorityRaw ||
      !!this.dueDateRaw ||
      !!this.durationRaw ||
      !!this.recurringRaw ||
      this.dependencies.length > 0 ||
      this.tags.length > 0
    );
  }

  /**
   * Check if auto-assign would apply to this todo (has no explicit values)
   */
  get wouldAutoAssignApply(): boolean {
    if (!this._settingsModel.isAutoAssignEnabled) return false;
    return (
      (this.assignedPeopleRaw.length === 0 && !!this._settingsModel.defaultAssignedPerson) ||
      (this.sourcePeopleRaw.length === 0 && !!this._settingsModel.defaultSourcePerson) ||
      (this.projectsRaw.length === 0 && !!this._settingsModel.defaultProject) ||
      (!this.priorityRaw && !!this._settingsModel.defaultPriority) ||
      (!this.dueDateRaw && !!this._settingsModel.defaultDueDate) ||
      (!this.durationRaw && !!this._settingsModel.defaultDuration) ||
      (!this.recurringRaw && !!this._settingsModel.defaultRecurring)
    );
  }

  /**
   * Get effective metadata with auto-assign defaults applied
   */
  get effectiveMetadata(): TodoMetadata {
    return {
      assignedPeople: this.assignedPeople,
      sourcePeople: this.sourcePeople,
      mentionedPeople: this.mentionedPeople,
      projects: this.projects,
      priority: this.priority,
      dueDate: this.dueDate,
      duration: this.duration,
      recurring: this.recurring,
      dependencies: this.dependencies,
      tags: this.tags,
      context: this.context,
    };
  }

  // ===== Display Helpers =====

  /**
   * Get priority color from settings
   */
  get priorityColor(): string | undefined {
    if (!this.priority) return undefined;
    return this._settingsModel.findPriority(this.priority)?.color;
  }

  /**
   * Get priority order (lower is higher priority)
   */
  get priorityOrder(): number | undefined {
    if (!this.priority) return undefined;
    return this._settingsModel.findPriority(this.priority)?.order;
  }

  /**
   * Get a display-friendly due date string
   */
  get dueDateDisplay(): string | undefined {
    const date = this.dueDateObject;
    if (!date) return undefined;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Check if it's today
    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {
      return "Today";
    }

    // Check if it's tomorrow
    if (
      date.getFullYear() === tomorrow.getFullYear() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getDate() === tomorrow.getDate()
    ) {
      return "Tomorrow";
    }

    // Check if it's yesterday
    if (
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()
    ) {
      return "Yesterday";
    }

    // Otherwise return formatted date
    return date.toLocaleDateString();
  }

  /**
   * Update the underlying settings (useful when settings change)
   */
  updateSettings(settings: SettingsModel) {
    this._settingsModel = settings;
  }

  // ===== Validation Methods =====

  /**
   * Check if this todo can be completed
   * Returns { canComplete: boolean, reason?: string }
   */
  canComplete(allTodos: TodoModel[]): { canComplete: boolean; reason?: string } {
    // Already completed
    if (this.isCompleted) {
      return { canComplete: false, reason: "Task is already completed" };
    }

    // Archived or deleted tasks can't be completed
    if (this.isArchived) {
      return { canComplete: false, reason: "Task is archived" };
    }
    if (this.isDeleted) {
      return { canComplete: false, reason: "Task is deleted" };
    }

    // Check dependencies
    if (this.dependencies.length > 0) {
      const unsatisfied = this.dependencies
        .map((depId) => allTodos.find((t) => t.id === depId))
        .filter((t) => t && !t.isCompleted);

      if (unsatisfied.length > 0) {
        const names = unsatisfied.map((t) => t!.plainText).join(", ");
        return {
          canComplete: false,
          reason: `Cannot complete: ${unsatisfied.length} incomplete ${
            unsatisfied.length === 1 ? "dependency" : "dependencies"
          }: ${names}`,
        };
      }
    }

    return { canComplete: true };
  }

  /**
   * Check if this todo can be archived
   * Returns { canArchive: boolean, reason?: string }
   */
  canArchive(allTodos: TodoModel[]): { canArchive: boolean; reason?: string } {
    // Already archived
    if (this.isArchived) {
      return { canArchive: false, reason: "Task is already archived" };
    }

    // Deleted tasks can't be archived
    if (this.isDeleted) {
      return { canArchive: false, reason: "Task is deleted" };
    }

    // Check dependencies only for active tasks
    if (this.isActive && this.dependencies.length > 0) {
      const unsatisfied = this.dependencies
        .map((depId) => allTodos.find((t) => t.id === depId))
        .filter((t) => t && !t.isCompleted);

      if (unsatisfied.length > 0) {
        const names = unsatisfied.map((t) => t!.plainText).join(", ");
        return {
          canArchive: false,
          reason: `Cannot archive: ${unsatisfied.length} incomplete ${
            unsatisfied.length === 1 ? "dependency" : "dependencies"
          }: ${names}`,
        };
      }
    }

    return { canArchive: true };
  }

  /**
   * Check if this todo can be deleted
   * Returns { canDelete: boolean, reason?: string }
   */
  canDelete(): { canDelete: boolean; reason?: string } {
    // Already deleted
    if (this.isDeleted) {
      return { canDelete: false, reason: "Task is already deleted" };
    }

    // Everything else can be deleted
    return { canDelete: true };
  }

  /**
   * Check if this todo can be unarchived
   */
  canUnarchive(): { canUnarchive: boolean; reason?: string } {
    if (!this.isArchived) {
      return { canUnarchive: false, reason: "Task is not archived" };
    }
    return { canUnarchive: true };
  }

  // ===== Computed Properties for UI =====

  /**
   * Get number of comments
   */
  get commentCount(): number {
    return this._raw.comments.length;
  }

  /**
   * Check if this todo has comments
   */
  get hasComments(): boolean {
    return this._raw.comments.length > 0;
  }

  // ===== Subtask Properties =====

  /**
   * Get all subtasks
   * Returns deep copies to prevent external modification of internal state
   */
  get subtasks() {
    return (this._raw.subtasks || []).map((s) => structuredClone(s));
  }

  /**
   * Check if this todo has subtasks
   */
  get hasSubtasks(): boolean {
    return (this._raw.subtasks || []).length > 0;
  }

  /**
   * Get the number of subtasks
   */
  get subtaskCount(): number {
    return (this._raw.subtasks || []).length;
  }

  /**
   * Get the number of completed subtasks
   */
  get completedSubtaskCount(): number {
    return (this._raw.subtasks || []).filter((s) => s.completed).length;
  }

  /**
   * Get subtask completion progress as a percentage (0-100)
   */
  get subtaskProgress(): number {
    const subtasks = this._raw.subtasks || [];
    if (subtasks.length === 0) return 0;
    return Math.round((this.completedSubtaskCount / subtasks.length) * 100);
  }

  /**
   * Check if all subtasks are completed
   */
  get allSubtasksCompleted(): boolean {
    const subtasks = this._raw.subtasks || [];
    return subtasks.length > 0 && this.completedSubtaskCount === subtasks.length;
  }

  // ===== Time Tracking Properties =====

  /**
   * Get time tracking data
   * Returns a deep copy to prevent external modification of internal state
   */
  get timeTracking() {
    return this._raw.timeTracking ? structuredClone(this._raw.timeTracking) : undefined;
  }

  /**
   * Check if time tracking is enabled for this todo
   */
  get hasTimeTracking(): boolean {
    return !!this._raw.timeTracking && this._raw.timeTracking.entries.length > 0;
  }

  /**
   * Check if currently tracking time
   */
  get isTrackingTime(): boolean {
    if (!this._raw.timeTracking) return false;
    return this._raw.timeTracking.entries.some((e) => !e.endTime);
  }

  /**
   * Get total tracked time in minutes (includes active tracking)
   */
  get totalTrackedMinutes(): DurationMin {
    if (!this._raw.timeTracking) return getDurationMin(0);

    // Start with cached total (completed entries)
    let total = this._raw.timeTracking.totalMinutes as number;

    // Add elapsed time for any active entry
    const activeEntry = this._raw.timeTracking.entries.find((e) => !e.endTime);
    if (activeEntry) {
      const elapsedMinutes = Math.round((Date.now() - activeEntry.startTime) / (1000 * 60));
      total += elapsedMinutes;
    }

    return getDurationMin(total);
  }

  /**
   * Get formatted total tracked time (e.g., "2h 30m")
   */
  get totalTrackedTimeDisplay(): string {
    const minutes = this.totalTrackedMinutes;
    if (minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  /**
   * Get the currently active time entry (if tracking)
   * Returns null if not currently tracking
   * Returns a copy to prevent external modification of internal state
   */
  get activeTimeEntry() {
    if (!this._raw.timeTracking) return null;
    const entry = this._raw.timeTracking.entries.find((e) => !e.endTime);
    return entry ? structuredClone(entry) : null;
  }

  /**
   * Get number of activity entries
   */
  get activityCount(): number {
    return this._raw.activity.length;
  }

  /**
   * Check if this todo has activity
   */
  get hasActivity(): boolean {
    return this._raw.activity.length > 0;
  }

  /**
   * Get the most recent comment
   * Returns null if no comments exist
   * Returns a new object to prevent external modification
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
   * Returns a copy to prevent external modification of internal state
   */
  get latestActivity() {
    if (this._raw.activity.length === 0) return null;
    return structuredClone(this._raw.activity[this._raw.activity.length - 1]);
  }

  /**
   * Format a date with time
   */
  private formatDateWithTime(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  /**
   * Get formatted created date with time
   */
  get createdDateDisplay(): string {
    return this.formatDateWithTime(this.createdAt);
  }

  /**
   * Get formatted updated date with time
   */
  get updatedDateDisplay(): string | undefined {
    if (!this.updatedAt) return undefined;
    return this.formatDateWithTime(this.updatedAt);
  }

  /**
   * Get formatted completed date with time
   */
  get completedDateDisplay(): string | undefined {
    if (!this.completedAt) return undefined;
    return this.formatDateWithTime(this.completedAt);
  }

  /**
   * Get formatted archived date with time
   */
  get archivedDateDisplay(): string | undefined {
    if (!this.archivedAt) return undefined;
    return this.formatDateWithTime(this.archivedAt);
  }

  /**
   * Get time since creation in human-readable format
   */
  get ageDisplay(): string {
    const now = Date.now();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ago`;
    if (hours > 0) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    if (minutes > 0) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    return "just now";
  }

  // ===== Display/Formatting Methods =====

  /**
   * Get a summary of the todo (truncated text)
   */
  getSummary(maxLength: number = 100): string {
    if (this.plainText.length <= maxLength) return this.plainText;
    return this.plainText.substring(0, maxLength) + "...";
  }

  /**
   * Get status badge text
   */
  get statusBadge(): string {
    if (this.isCompleted) return "Completed";
    if (this.isArchived) return "Archived";
    if (this.isDeleted) return "Deleted";
    if (this.isOverdue) return "Overdue";
    if (this.isDueToday) return "Due Today";
    return "Active";
  }

  /**
   * Get status color for UI
   */
  get statusColor(): string {
    if (this.isCompleted) return "#10b981"; // green
    if (this.isArchived) return "#6b7280"; // gray
    if (this.isDeleted) return "#ef4444"; // red
    if (this.isOverdue) return "#dc2626"; // dark red
    if (this.isDueToday) return "#f59e0b"; // amber
    return "#3b82f6"; // blue
  }

  /**
   * Get metadata summary for display (e.g., "2 people, 1 project, High priority")
   */
  get metadataSummary(): string {
    const parts: string[] = [];

    const assignedCount = this.assignedPeople.length;
    if (assignedCount > 0) {
      parts.push(`${assignedCount} ${assignedCount === 1 ? "person" : "people"}`);
    }

    const projectCount = this.projects.length;
    if (projectCount > 0) {
      parts.push(`${projectCount} ${projectCount === 1 ? "project" : "projects"}`);
    }

    if (this.priority) {
      parts.push(`${this.priority} priority`);
    }

    if (this.dueDate) {
      parts.push(`due ${this.dueDateDisplay}`);
    }

    if (this.duration) {
      parts.push(`${this.duration} duration`);
    }

    const tagCount = this.tags.length;
    if (tagCount > 0) {
      parts.push(`${tagCount} ${tagCount === 1 ? "tag" : "tags"}`);
    }

    return parts.length > 0 ? parts.join(", ") : "No metadata";
  }

  /**
   * Check if todo matches search text
   */
  matchesSearch(searchText: string): boolean {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      this.plainText.toLowerCase().includes(search) ||
      this.assignedPeople.some((p) => p.toLowerCase().includes(search)) ||
      this.sourcePeople.some((p) => p.toLowerCase().includes(search)) ||
      this.mentionedPeople.some((p) => p.toLowerCase().includes(search)) ||
      this.projects.some((p) => p.toLowerCase().includes(search)) ||
      this.tags.some((t) => t.toLowerCase().includes(search)) ||
      (!!this.priority && this.priority.toLowerCase().includes(search))
    );
  }

  /**
   * Get a display-friendly duration string
   */
  get durationDisplay(): string | undefined {
    if (!this.duration) return undefined;
    const minutes = this.durationMinutes;
    if (!minutes) return this.duration;

    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = minutes / 60;
    if (hours === Math.floor(hours)) {
      return `${hours}h`;
    }
    return `${hours.toFixed(1)}h`;
  }

  /**
   * Check if this todo is a blocker for other todos
   */
  isBlockerFor(allTodos: TodoModel[]): TodoModel[] {
    return allTodos.filter((t) => t.dependencies.includes(this.id) && !t.isCompleted);
  }

  /**
   * Get blocked todos (tasks that depend on this one)
   */
  get blockedTodosCount(): number {
    // Note: This requires allTodos, so we can't compute it here
    // Consumers should use isBlockerFor(allTodos).length
    return 0;
  }
}

/**
 * Factory function to create TodoModel instances
 */
export function createTodoModel(todo: Todo, settings: SettingsModel): TodoModel {
  return new TodoModel(todo, settings);
}

/**
 * Create TodoModel instances from an array of todos
 */
export function createTodoModels(todos: Todo[], settings: SettingsModel): TodoModel[] {
  return todos.map((todo) => new TodoModel(todo, settings));
}
