import { Todo, TodoMetadata, TodoState, ActivityEntry } from "@/types/todo";
import { Settings, AutoAssignSettings } from "@/types/settings";
import { normalizeDateValue, parseDate } from "@/utils/dateParser";
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

  get comments() {
    return this._todo.comments;
  }

  get activity(): ActivityEntry[] {
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
    return this._todo.metadata.dependencies;
  }

  get tags(): string[] {
    return this._todo.metadata.tags;
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
