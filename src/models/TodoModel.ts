import { Todo, TodoMetadata, TodoState } from "@/types/todo";
import { ActivityEntry } from "@/types/types";
import { DurationMin, getDurationMin } from "@/types/time";
import { Settings } from "@/types/settings";
import { normalizeDateValue, parseDate } from "@/utils/dateUtils";
import { parseRecurringPattern } from "@/utils/recurringParser";

/**
 * TodoModel wraps a Todo object and provides business logic abstractions.
 * This keeps views simple by handling auto-assignment, date calculations,
 * validation, and other business rules in one place.
 */
export class TodoModel {
  private _todo: Todo;
  private _settings: Settings;

  constructor(todo: Todo, settings: Settings) {
    this._todo = todo;
    this._settings = settings;
  }

  // ===== Core Todo Properties =====

  get id(): string {
    return this._todo.id;
  }

  get text(): string {
    return this._todo.text;
  }

  get plainText(): string {
    return this._todo.plainText;
  }

  get state(): TodoState {
    return this._todo.state;
  }

  get createdAt(): number {
    return this._todo.createdAt;
  }

  get updatedAt(): number | undefined {
    return this._todo.updatedAt;
  }

  get completedAt(): number | undefined {
    return this._todo.completedAt;
  }

  get archivedAt(): number | undefined {
    return this._todo.archivedAt;
  }

  get deletedAt(): number | undefined {
    return this._todo.deletedAt;
  }

  get workflowState(): string | undefined {
    return this._todo.workflowState;
  }

  get comments() {
    return this._todo.comments;
  }

  get activity(): ActivityEntry<string>[] {
    return this._todo.activity;
  }

  get context(): string | undefined {
    return this._todo.metadata.context;
  }

  // ===== Smart Metadata Getters with Auto-Assign =====

  /**
   * Get assigned people with auto-assign fallback if enabled and empty
   */
  get assignedPeople(): string[] {
    if (this._todo.metadata.assignedPeople.length > 0) {
      return this._todo.metadata.assignedPeople;
    }
    // Apply auto-assign if enabled and no explicit assignment
    if (this._settings.autoAssign.enabled && this._settings.autoAssign.assignedPerson) {
      return [this._settings.autoAssign.assignedPerson];
    }
    return [];
  }

  /**
   * Get raw assigned people without auto-assign fallback
   */
  get assignedPeopleRaw(): string[] {
    return this._todo.metadata.assignedPeople;
  }

  /**
   * Get source people with auto-assign fallback if enabled and empty
   */
  get sourcePeople(): string[] {
    if (this._todo.metadata.sourcePeople.length > 0) {
      return this._todo.metadata.sourcePeople;
    }
    // Apply auto-assign if enabled and no explicit source
    if (this._settings.autoAssign.enabled && this._settings.autoAssign.sourcePerson) {
      return [this._settings.autoAssign.sourcePerson];
    }
    return [];
  }

  /**
   * Get raw source people without auto-assign fallback
   */
  get sourcePeopleRaw(): string[] {
    return this._todo.metadata.sourcePeople;
  }

  get mentionedPeople(): string[] {
    return this._todo.metadata.mentionedPeople;
  }

  /**
   * Get projects with auto-assign fallback if enabled and empty
   */
  get projects(): string[] {
    if (this._todo.metadata.projects.length > 0) {
      return this._todo.metadata.projects;
    }
    // Apply auto-assign if enabled and no explicit project
    if (this._settings.autoAssign.enabled && this._settings.autoAssign.project) {
      return [this._settings.autoAssign.project];
    }
    return [];
  }

  /**
   * Get raw projects without auto-assign fallback
   */
  get projectsRaw(): string[] {
    return this._todo.metadata.projects;
  }

  /**
   * Get priority with auto-assign fallback if enabled and empty
   */
  get priority(): string | undefined {
    if (this._todo.metadata.priority) {
      return this._todo.metadata.priority;
    }
    // Apply auto-assign if enabled and no explicit priority
    if (this._settings.autoAssign.enabled && this._settings.autoAssign.priority) {
      return this._settings.autoAssign.priority;
    }
    return undefined;
  }

  /**
   * Get raw priority without auto-assign fallback
   */
  get priorityRaw(): string | undefined {
    return this._todo.metadata.priority;
  }

  /**
   * Get due date with auto-assign fallback and normalization
   */
  get dueDate(): string | undefined {
    const rawDueDate = this._todo.metadata.dueDate;
    if (rawDueDate) {
      // Normalize shorthand values like "today", "tomorrow", etc.
      return normalizeDateValue(rawDueDate, this._settings.dateTime, this._settings.workHours);
    }
    // Apply auto-assign if enabled and no explicit due date
    if (this._settings.autoAssign.enabled && this._settings.autoAssign.dueDate) {
      return normalizeDateValue(this._settings.autoAssign.dueDate, this._settings.dateTime, this._settings.workHours);
    }
    return undefined;
  }

  /**
   * Get raw due date without auto-assign fallback or normalization
   */
  get dueDateRaw(): string | undefined {
    return this._todo.metadata.dueDate;
  }

  /**
   * Get due date as a Date object
   */
  get dueDateObject(): Date | undefined {
    const dateStr = this.dueDate;
    if (!dateStr) return undefined;
    const parsed = parseDate(dateStr, this._settings.dateTime, this._settings.workHours);
    return parsed ? new Date(parsed.timestamp) : undefined;
  }

  /**
   * Get duration with auto-assign fallback if enabled and empty
   */
  get duration(): string | undefined {
    if (this._todo.metadata.duration) {
      return this._todo.metadata.duration;
    }
    // Apply auto-assign if enabled and no explicit duration
    if (this._settings.autoAssign.enabled && this._settings.autoAssign.duration) {
      return this._settings.autoAssign.duration;
    }
    return undefined;
  }

  /**
   * Get raw duration without auto-assign fallback
   */
  get durationRaw(): string | undefined {
    return this._todo.metadata.duration;
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
    if (this._todo.metadata.recurring) {
      return this._todo.metadata.recurring;
    }
    // Apply auto-assign if enabled and no explicit recurring
    if (this._settings.autoAssign.enabled && this._settings.autoAssign.recurring) {
      return this._settings.autoAssign.recurring;
    }
    return undefined;
  }

  /**
   * Get raw recurring pattern without auto-assign fallback
   */
  get recurringRaw(): string | undefined {
    return this._todo.metadata.recurring;
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
    return this._todo.metadata.dependencies ?? [];
  }

  get tags(): string[] {
    return this._todo.metadata.tags ?? [];
  }

  // ===== State Checks =====

  get isActive(): boolean {
    return this._todo.state === "active";
  }

  get isCompleted(): boolean {
    return this._todo.state === "completed";
  }

  get isArchived(): boolean {
    return this._todo.state === "archived";
  }

  get isDeleted(): boolean {
    return this._todo.state === "deleted";
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
   */
  get metadata(): TodoMetadata {
    return this._todo.metadata;
  }

  /**
   * Get the raw underlying todo object
   */
  get raw(): Todo {
    return this._todo;
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
    if (!this._settings.autoAssign.enabled) return false;
    return (
      (this.assignedPeopleRaw.length === 0 && !!this._settings.autoAssign.assignedPerson) ||
      (this.sourcePeopleRaw.length === 0 && !!this._settings.autoAssign.sourcePerson) ||
      (this.projectsRaw.length === 0 && !!this._settings.autoAssign.project) ||
      (!this.priorityRaw && !!this._settings.autoAssign.priority) ||
      (!this.dueDateRaw && !!this._settings.autoAssign.dueDate) ||
      (!this.durationRaw && !!this._settings.autoAssign.duration) ||
      (!this.recurringRaw && !!this._settings.autoAssign.recurring)
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
    const priorityObj = this._settings.priorities.find(
      (p) => p.name === this.priority || p.alternatives.includes(this.priority!),
    );
    return priorityObj?.color;
  }

  /**
   * Get priority order (lower is higher priority)
   */
  get priorityOrder(): number | undefined {
    if (!this.priority) return undefined;
    const priorityObj = this._settings.priorities.find(
      (p) => p.name === this.priority || p.alternatives.includes(this.priority!),
    );
    return priorityObj?.order;
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
  updateSettings(settings: Settings) {
    this._settings = settings;
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
    return this.comments.length;
  }

  /**
   * Check if this todo has comments
   */
  get hasComments(): boolean {
    return this.comments.length > 0;
  }

  // ===== Subtask Properties =====

  /**
   * Get all subtasks
   */
  get subtasks() {
    return this._todo.subtasks || [];
  }

  /**
   * Check if this todo has subtasks
   */
  get hasSubtasks(): boolean {
    return this.subtasks.length > 0;
  }

  /**
   * Get the number of subtasks
   */
  get subtaskCount(): number {
    return this.subtasks.length;
  }

  /**
   * Get the number of completed subtasks
   */
  get completedSubtaskCount(): number {
    return this.subtasks.filter((s) => s.completed).length;
  }

  /**
   * Get subtask completion progress as a percentage (0-100)
   */
  get subtaskProgress(): number {
    if (this.subtasks.length === 0) return 0;
    return Math.round((this.completedSubtaskCount / this.subtaskCount) * 100);
  }

  /**
   * Check if all subtasks are completed
   */
  get allSubtasksCompleted(): boolean {
    return this.subtasks.length > 0 && this.completedSubtaskCount === this.subtaskCount;
  }

  // ===== Time Tracking Properties =====

  /**
   * Get time tracking data
   */
  get timeTracking() {
    return this._todo.timeTracking;
  }

  /**
   * Check if time tracking is enabled for this todo
   */
  get hasTimeTracking(): boolean {
    return !!this._todo.timeTracking && this._todo.timeTracking.entries.length > 0;
  }

  /**
   * Check if currently tracking time
   */
  get isTrackingTime(): boolean {
    if (!this._todo.timeTracking) return false;
    return this._todo.timeTracking.entries.some((e) => !e.endTime);
  }

  /**
   * Get total tracked time in minutes (includes active tracking)
   */
  get totalTrackedMinutes(): DurationMin {
    if (!this._todo.timeTracking) return getDurationMin(0);

    // Start with cached total (completed entries)
    let total = this._todo.timeTracking.totalMinutes as number;

    // Add elapsed time for any active entry
    const activeEntry = this._todo.timeTracking.entries.find((e) => !e.endTime);
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
   */
  get activeTimeEntry() {
    if (!this._todo.timeTracking) return undefined;
    return this._todo.timeTracking.entries.find((e) => !e.endTime);
  }

  /**
   * Get number of activity entries
   */
  get activityCount(): number {
    return this.activity.length;
  }

  /**
   * Check if this todo has activity
   */
  get hasActivity(): boolean {
    return this.activity.length > 0;
  }

  /**
   * Get the most recent comment
   */
  get latestComment() {
    if (this.comments.length === 0) return undefined;
    const comment = this.comments[this.comments.length - 1];
    const latestHistory = comment.history[comment.history.length - 1];
    return {
      commentId: comment.commentId,
      content: latestHistory.content,
      timestamp: latestHistory.timestamp,
    };
  }

  /**
   * Get the most recent activity
   */
  get latestActivity() {
    if (this.activity.length === 0) return undefined;
    return this.activity[this.activity.length - 1];
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
export function createTodoModel(todo: Todo, settings: Settings): TodoModel {
  return new TodoModel(todo, settings);
}

/**
 * Create TodoModel instances from an array of todos
 */
export function createTodoModels(todos: Todo[], settings: Settings): TodoModel[] {
  return todos.map((todo) => new TodoModel(todo, settings));
}
