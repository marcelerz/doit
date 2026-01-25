import { Todo, TodoId, TodoState, Tag, TodoMetadata, getTodoId } from "@/types/todo";
import type { PersonId } from "@/types/person";
import type { ProjectId } from "@/types/project";
import type { PriorityId } from "@/types/priority";
import type { SprintId } from "@/types/sprint";
import type { Timestamp, DurationSec } from "@/types/time";
import { ActivityEntry } from "@/types/types";
import { DurationMin, getDurationMin } from "@/types/time";
import { parseRecurringPattern } from "@/utils/recurringParser";
import { parseDate } from "@/utils/dateUtils";
import { parseDuration } from "@/utils/ganttScheduler";
import { generatePrefixedUUID } from "@/utils/idGenerator";
import { SettingsModel } from "./SettingsModel";
import type { EntityRegistry } from "./EntityRegistry";

/**
 * TodoModel wraps a Todo object and provides business logic abstractions.
 * This keeps views simple by handling auto-assignment, date calculations,
 * validation, and other business rules in one place.
 */
export class TodoModel {
  private _raw: Todo;
  private _settingsModel: SettingsModel;
  private _registry?: EntityRegistry;

  constructor(todo: Todo, settings: SettingsModel, registry?: EntityRegistry) {
    this._raw = todo;
    this._settingsModel = settings;
    this._registry = registry;
  }

  // ===== Static ID Factory =====

  /**
   * Create a new unique ID for a Todo.
   * @returns A TodoId with prefix "todo-" followed by a UUID
   */
  static createId(): TodoId {
    return getTodoId(generatePrefixedUUID("todo"));
  }

  // ===== Core Todo Properties =====

  get raw_DONOTUSE(): Todo {
    return this._raw;
  }

  get id(): TodoId {
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

  get context(): string {
    return this._raw.context;
  }

  // ===== Actual Field Getters (IDs) =====
  // These apply auto-assign defaults from settings when actual fields are empty

  /**
   * Get assigned people IDs (actual field with auto-assign fallback)
   * Returns a copy to prevent external modification of internal state
   */
  get assignedPeopleIds(): PersonId[] {
    if (this._raw.assignedPeople.length > 0) {
      return [...this._raw.assignedPeople];
    }
    // Apply auto-assign default if registry is available
    const defaultName = this._settingsModel.defaultAssignedPerson;
    if (defaultName && this._registry) {
      const person = this._registry.findPersonByName(defaultName);
      if (person) {
        return [person.id as PersonId];
      }
    }
    return [];
  }

  /**
   * Get source people IDs (actual field with auto-assign fallback)
   * Returns a copy to prevent external modification of internal state
   */
  get sourcePeopleIds(): PersonId[] {
    if (this._raw.sourcePeople.length > 0) {
      return [...this._raw.sourcePeople];
    }
    // Apply auto-assign default if registry is available
    const defaultName = this._settingsModel.defaultSourcePerson;
    if (defaultName && this._registry) {
      const person = this._registry.findPersonByName(defaultName);
      if (person) {
        return [person.id as PersonId];
      }
    }
    return [];
  }

  /**
   * Get mentioned people IDs (actual field)
   * No auto-assign for mentioned people
   * Returns a copy to prevent external modification of internal state
   */
  get mentionedPeopleIds(): PersonId[] {
    return [...this._raw.mentionedPeople];
  }

  /**
   * Get project IDs (actual field with auto-assign fallback)
   * Returns a copy to prevent external modification of internal state
   */
  get projectIds(): ProjectId[] {
    if (this._raw.projects.length > 0) {
      return [...this._raw.projects];
    }
    // Apply auto-assign default if registry is available
    const defaultName = this._settingsModel.defaultProject;
    if (defaultName && this._registry) {
      const project = this._registry.findProjectByName(defaultName);
      if (project) {
        return [project.id as ProjectId];
      }
    }
    return [];
  }

  /**
   * Get priority ID (actual field with auto-assign fallback)
   */
  get priorityId(): PriorityId | undefined {
    if (this._raw.priority) {
      return this._raw.priority;
    }
    // Apply auto-assign default
    const defaultName = this._settingsModel.defaultPriority;
    if (defaultName) {
      const priority = this._settingsModel.findPriority(defaultName);
      if (priority) {
        return priority.id;
      }
    }
    return undefined;
  }

  /**
   * Get due date timestamp (actual field with auto-assign fallback)
   */
  get dueDate(): Timestamp | undefined {
    if (this._raw.dueDate) {
      return this._raw.dueDate;
    }
    // Apply auto-assign default
    const defaultDateStr = this._settingsModel.defaultDueDate;
    if (defaultDateStr) {
      const parsed = parseDate(defaultDateStr, this._settingsModel.dateTime, this._settingsModel.workHours);
      if (parsed) {
        return parsed.timestamp as Timestamp;
      }
    }
    return undefined;
  }

  /**
   * Get duration in seconds (actual field with auto-assign fallback)
   */
  get durationSeconds(): DurationSec | undefined {
    if (this._raw.duration) {
      return this._raw.duration;
    }
    // Apply auto-assign default
    const defaultDurationStr = this._settingsModel.defaultDuration;
    if (defaultDurationStr) {
      const minutes = parseDuration(defaultDurationStr);
      if (minutes > 0) {
        return (minutes * 60) as DurationSec;
      }
    }
    return undefined;
  }

  /**
   * Get dependency IDs (actual field)
   * Returns a copy to prevent external modification of internal state
   */
  get dependencyIds(): TodoId[] {
    return [...(this._raw.dependencies || [])];
  }

  /**
   * Get tags (actual field)
   * Returns a copy to prevent external modification of internal state
   */
  get tagIds(): Tag[] {
    return [...(this._raw.tags || [])];
  }

  /**
   * Get sprint ID (actual field)
   */
  get sprintId(): SprintId | undefined {
    return this._raw.sprint;
  }

  /**
   * Get tags (string array for backward compatibility)
   * Maps from Tag[] to string[]
   */
  get tags(): string[] {
    return this.tagIds.map((t) => t as string);
  }

  /**
   * Get dependencies (string array for backward compatibility)
   * Maps from TodoId[] to string[]
   */
  get dependencies(): string[] {
    return this.dependencyIds.map((d) => d as string);
  }

  /**
   * Get assigned people names (string array for UI display)
   * Uses registry to resolve IDs to names, falls back to IDs if registry unavailable
   * Includes auto-assign fallback via assignedPeopleIds
   */
  get assignedPeople(): string[] {
    const ids = this.assignedPeopleIds;
    if (!this._registry) {
      return ids.map((id) => id as string);
    }
    return ids.map((id) => {
      const person = this._registry!.getPerson(id);
      return person ? person.name : (id as string);
    });
  }

  /**
   * Get source people names (string array for UI display)
   * Uses registry to resolve IDs to names, falls back to IDs if registry unavailable
   * Includes auto-assign fallback via sourcePeopleIds
   */
  get sourcePeople(): string[] {
    const ids = this.sourcePeopleIds;
    if (!this._registry) {
      return ids.map((id) => id as string);
    }
    return ids.map((id) => {
      const person = this._registry!.getPerson(id);
      return person ? person.name : (id as string);
    });
  }

  /**
   * Get mentioned people names (string array for UI display)
   * Uses registry to resolve IDs to names, falls back to IDs if registry unavailable
   */
  get mentionedPeople(): string[] {
    const ids = this.mentionedPeopleIds;
    if (!this._registry) {
      return ids.map((id) => id as string);
    }
    return ids.map((id) => {
      const person = this._registry!.getPerson(id);
      return person ? person.name : (id as string);
    });
  }

  /**
   * Get project names (string array for UI display)
   * Uses registry to resolve IDs to names, falls back to IDs if registry unavailable
   * Includes auto-assign fallback via projectIds
   */
  get projects(): string[] {
    const ids = this.projectIds;
    if (!this._registry) {
      return ids.map((id) => id as string);
    }
    return ids.map((id) => {
      const project = this._registry!.getProject(id);
      return project ? project.name : (id as string);
    });
  }

  /**
   * Get priority name (string for UI display/backward compatibility)
   * Resolves priority ID to name via settings
   */
  get priority(): string | undefined {
    const id = this.priorityId;
    if (!id) return undefined;
    return this._settingsModel.findPriorityById(id)?.name;
  }

  /**
   * Get sprint name (string for backward compatibility)
   * Note: Currently returns sprint ID as there's no sprint registry
   * TODO: When EntityRegistry supports sprints, resolve ID to name
   */
  get sprint(): string | undefined {
    return this.sprintId as string | undefined;
  }

  /**
   * Get recurring pattern (actual field)
   * This is kept as a string for later re-evaluation when completing the task
   */
  get recurring(): string | undefined {
    return this._raw.recurring;
  }

  /**
   * Get metadata for UI editing purposes.
   * Converts typed ID fields to string-based TodoMetadata.
   * Uses the string getters which resolve IDs to names via registry
   * and include auto-assign fallbacks.
   */
  get metadata(): TodoMetadata {
    return {
      assignedPeople: this.assignedPeople,
      sourcePeople: this.sourcePeople,
      mentionedPeople: this.mentionedPeople,
      projects: this.projects,
      priority: this.priorityName,
      dueDate: this.dueDateDisplay,
      duration: this.durationDisplay,
      recurring: this.recurring,
      tags: this.tags,
      dependencies: this.dependencies,
      sprint: this.sprint,
      context: this.context,
    };
  }

  // ===== Computed Properties =====

  /**
   * Get due date as a Date object (from actual timestamp field with auto-assign)
   */
  get dueDateObject(): Date | undefined {
    const timestamp = this.dueDate;
    if (!timestamp) return undefined;
    return new Date(timestamp);
  }

  /**
   * Check if this task has a due date set
   */
  get hasDueDate(): boolean {
    return this.dueDate !== undefined;
  }

  /**
   * Get due date as a date key string (YYYY-MM-DD format) for calendar grouping
   */
  get dueDateKey(): string | undefined {
    const date = this.dueDateObject;
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Get duration in minutes (from durationSeconds with auto-assign)
   */
  get durationMinutes(): number | undefined {
    const seconds = this.durationSeconds;
    if (!seconds) return undefined;
    return Math.round(seconds / 60);
  }

  /**
   * Check if this task has a duration set
   */
  get hasDuration(): boolean {
    return this.durationSeconds !== undefined;
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

  // ===== State Checks =====

  get isActive(): boolean {
    return this.state === "active";
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
    // Create a copy to avoid mutating the original Date object
    const dueDateNormalized = new Date(dueDate.getTime());
    dueDateNormalized.setHours(0, 0, 0, 0);
    const diffTime = dueDateNormalized.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ===== Metadata Operations =====

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
   * Check if the todo has any actual fields assigned (excluding context)
   * Note: Uses raw for performance - this checks actual stored values, not auto-assigned
   */
  get hasFields(): boolean {
    return (
      this._raw.assignedPeople.length > 0 ||
      this._raw.sourcePeople.length > 0 ||
      this._raw.mentionedPeople.length > 0 ||
      this._raw.projects.length > 0 ||
      !!this._raw.priority ||
      !!this._raw.dueDate ||
      !!this._raw.duration ||
      this._raw.dependencies.length > 0 ||
      this._raw.tags.length > 0 ||
      !!this._raw.sprint
    );
  }

  // ===== Display Helpers =====

  /**
   * Get priority color from settings (using priority ID with auto-assign)
   */
  get priorityColor(): string | undefined {
    const id = this.priorityId;
    if (!id) return undefined;
    return this._settingsModel.getPriorityColorById(id);
  }

  /**
   * Get priority order (lower is higher priority, using priority ID with auto-assign)
   */
  get priorityOrder(): number | undefined {
    const id = this.priorityId;
    if (!id) return undefined;
    return this._settingsModel.getPriorityOrderById(id);
  }

  /**
   * Get priority name for display (using priority ID with auto-assign)
   */
  get priorityName(): string | undefined {
    const id = this.priorityId;
    if (!id) return undefined;
    return this._settingsModel.findPriorityById(id)?.name;
  }

  /**
   * Get a human-readable due date display string using the instance's settings.
   * Shows proximity-based output with time-of-day detection.
   *
   * Output formats:
   * - "Today", "Today BOD", "Today EOD", "Today morning", "Today afternoon", "Today evening"
   * - "Tomorrow", "Tomorrow EOD", etc.
   * - "Yesterday"
   * - "X days ago", "X weeks ago", "X months ago", "X years ago"
   * - "on Monday", "Tuesday EOD" (2-5 days in future)
   * - "in X days", "in X weeks", "in X months", "in X years"
   */
  get dueDateDisplay(): string | undefined {
    const timestamp = this.dueDate;
    if (!timestamp) return undefined;

    const date = new Date(timestamp);
    const now = new Date();

    // Reset times for day comparison
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMs = dateDay.getTime() - todayDay.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // Get time portion for BOD/EOD detection
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    // Helper to parse time string "HH:MM" to { hours, minutes }
    const parseTime = (time: string): { hours: number; minutes: number } => {
      const [h, m] = time.split(":").map(Number);
      return { hours: h, minutes: m };
    };

    // Get settings-defined times
    const settings = this._settingsModel;
    const bodTime = settings.getBod(date);
    const eodTime = settings.getEod(date);
    const morningTime = settings.morningTime;
    const noonTime = settings.noonTime;
    const afternoonTime = settings.afternoonTime;
    const eveningTime = settings.eveningTime;

    // Parse time boundaries
    const morning = parseTime(morningTime);
    const noon = parseTime(noonTime);
    const afternoon = parseTime(afternoonTime);
    const evening = parseTime(eveningTime);

    // Helper to get time description (only for nearby dates)
    const getTimeDescription = (): string => {
      // Skip if midnight (likely no specific time set)
      if (hours === 0 && minutes === 0) return "";

      // Check for exact BOD/EOD/noon matches
      if (timeStr === bodTime) return " BOD";
      if (timeStr === eodTime) return " EOD";
      if (timeStr === noonTime) return " noon";

      // Determine time of day based on settings-defined boundaries
      // Convert to minutes for easier comparison
      const currentMinutes = hours * 60 + minutes;
      const morningMinutes = morning.hours * 60 + morning.minutes;
      const noonMinutes = noon.hours * 60 + noon.minutes;
      const afternoonMinutes = afternoon.hours * 60 + afternoon.minutes;
      const eveningMinutes = evening.hours * 60 + evening.minutes;

      // Time period detection (morning → noon → afternoon → evening → night)
      if (currentMinutes >= morningMinutes && currentMinutes < noonMinutes) return " morning";
      if (currentMinutes >= noonMinutes && currentMinutes < afternoonMinutes) return " noon";
      if (currentMinutes >= afternoonMinutes && currentMinutes < eveningMinutes) return " afternoon";
      if (currentMinutes >= eveningMinutes && currentMinutes < 21 * 60) return " evening";

      // Outside normal hours - show actual time
      return ` ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    };

    // Past dates
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      if (absDays === 1) return "Yesterday";
      if (absDays < 7) return `${absDays} days ago`;
      if (absDays < 30) {
        const weeks = Math.round(absDays / 7);
        return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
      }
      if (absDays < 365) {
        const months = Math.round(absDays / 30);
        return `${months} ${months === 1 ? "month" : "months"} ago`;
      }
      const years = Math.round(absDays / 365);
      return `${years} ${years === 1 ? "year" : "years"} ago`;
    }

    // Today
    if (diffDays === 0) {
      const timeDesc = getTimeDescription();
      return timeDesc ? `Today${timeDesc}` : "Today";
    }

    // Tomorrow
    if (diffDays === 1) {
      const timeDesc = getTimeDescription();
      return timeDesc ? `Tomorrow${timeDesc}` : "Tomorrow";
    }

    // 2-5 days: show day name with optional time
    if (diffDays <= 5) {
      const dayName = date.toLocaleDateString(undefined, { weekday: "long" });
      const timeDesc = getTimeDescription();
      return timeDesc ? `${dayName}${timeDesc}` : `on ${dayName}`;
    }

    // 6-10 days: "in X days"
    if (diffDays <= 10) {
      return `in ${diffDays} days`;
    }

    // 11 days - 8 weeks: "in X weeks"
    if (diffDays <= 56) {
      const weeks = Math.round(diffDays / 7);
      return `in ${weeks} ${weeks === 1 ? "week" : "weeks"}`;
    }

    // 2-12 months
    if (diffDays <= 365) {
      const months = Math.round(diffDays / 30);
      return `in ${months} ${months === 1 ? "month" : "months"}`;
    }

    // More than a year
    const years = Math.round(diffDays / 365);
    return `in ${years} ${years === 1 ? "year" : "years"}`;
  }

  /**
   * Update the underlying settings (useful when settings change)
   */
  updateSettings(settings: SettingsModel, registry?: EntityRegistry) {
    this._settingsModel = settings;
    if (registry !== undefined) {
      this._registry = registry;
    }
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
   * Note: Uses _raw for performance - avoids cloning the comments array
   */
  get commentCount(): number {
    return this._raw.comments.length;
  }

  /**
   * Check if this todo has comments
   * Note: Uses _raw for performance - avoids cloning the comments array
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
    return this.subtaskCount > 0;
  }

  /**
   * Get the number of subtasks
   * Note: Uses _raw for performance - avoids cloning the array
   */
  get subtaskCount(): number {
    return (this._raw.subtasks || []).length;
  }

  /**
   * Get the number of completed subtasks
   * Note: Uses _raw for performance - avoids cloning the array
   */
  get completedSubtaskCount(): number {
    return (this._raw.subtasks || []).filter((s) => s.completed).length;
  }

  /**
   * Get subtask completion progress as a percentage (0-100)
   */
  get subtaskProgress(): number {
    const count = this.subtaskCount;
    if (count === 0) return 0;
    return Math.round((this.completedSubtaskCount / count) * 100);
  }

  /**
   * Check if all subtasks are completed
   */
  get allSubtasksCompleted(): boolean {
    const count = this.subtaskCount;
    return count > 0 && this.completedSubtaskCount === count;
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
   * Note: Uses _raw for performance - avoids cloning the tracking data
   */
  get hasTimeTracking(): boolean {
    return !!this._raw.timeTracking && this._raw.timeTracking.entries.length > 0;
  }

  /**
   * Check if currently tracking time
   * Note: Uses _raw for performance - avoids cloning the tracking data
   */
  get isTrackingTime(): boolean {
    if (!this._raw.timeTracking) return false;
    return this._raw.timeTracking.entries.some((e) => !e.endTime);
  }

  /**
   * Get total tracked time in minutes (includes active tracking)
   * Note: Uses _raw for performance - avoids cloning the tracking data
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
  /**
   * Note: Uses _raw for performance - avoids cloning the activity array
   */
  get activityCount(): number {
    return this._raw.activity.length;
  }

  /**
   * Check if this todo has activity
   * Note: Uses _raw for performance - avoids cloning the activity array
   */
  get hasActivity(): boolean {
    return this._raw.activity.length > 0;
  }

  /**
   * Get the most recent comment
   * Returns null if no comments exist
   * Returns a new object (copy) to prevent external modification
   * Note: Uses _raw for performance - only creates a minimal copy for return
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
   * Note: Uses _raw for performance - only clones the single returned entry
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
   * Uses typed getters for display values
   */
  get metadataSummary(): string {
    const parts: string[] = [];

    const assignedCount = this.assignedPeopleIds.length;
    if (assignedCount > 0) {
      parts.push(`${assignedCount} ${assignedCount === 1 ? "person" : "people"}`);
    }

    const projectCount = this.projectIds.length;
    if (projectCount > 0) {
      parts.push(`${projectCount} ${projectCount === 1 ? "project" : "projects"}`);
    }

    const priorityName = this.priorityName;
    if (priorityName) {
      parts.push(`${priorityName} priority`);
    }

    const dueDateTimestamp = this.dueDate;
    if (dueDateTimestamp) {
      // Use simple date format for summary (dueDateDisplay may be verbose like "Today morning")
      const date = new Date(dueDateTimestamp);
      const simpleDisplay = date.toLocaleDateString();
      parts.push(`due ${simpleDisplay}`);
    }

    if (this.hasDuration) {
      parts.push(`${this.durationDisplay} duration`);
    }

    const tagCount = this.tagIds.length;
    if (tagCount > 0) {
      parts.push(`${tagCount} ${tagCount === 1 ? "tag" : "tags"}`);
    }

    return parts.length > 0 ? parts.join(", ") : "No metadata";
  }

  /**
   * Check if todo matches search text
   * Uses registry to look up names from IDs for searching
   */
  matchesSearch(searchText: string): boolean {
    if (searchText === "") return true;
    const search = searchText.toLowerCase();

    // Search plain text
    if (this.plainText.toLowerCase().includes(search)) return true;

    // Search tags
    if (this.tags.some((t) => t.toLowerCase().includes(search))) return true;

    // Search priority name
    const priorityName = this.priorityName;
    if (priorityName && priorityName.toLowerCase().includes(search)) return true;

    // Search people and projects using registry if available
    if (this._registry) {
      // Search assigned people
      for (const personId of this.assignedPeopleIds) {
        const person = this._registry.getPerson(personId);
        if (person && person.matchesSearch(search)) return true;
      }

      // Search source people
      for (const personId of this.sourcePeopleIds) {
        const person = this._registry.getPerson(personId);
        if (person && person.matchesSearch(search)) return true;
      }

      // Search mentioned people
      for (const personId of this.mentionedPeopleIds) {
        const person = this._registry.getPerson(personId);
        if (person && person.matchesSearch(search)) return true;
      }

      // Search projects
      for (const projectId of this.projectIds) {
        const project = this._registry.getProject(projectId);
        if (project && project.matchesSearch(search)) return true;
      }
    }

    return false;
  }

  /**
   * Get a display-friendly duration string (from actual seconds field)
   */
  get durationDisplay(): string | undefined {
    const minutes = this.durationMinutes;
    if (!minutes) return undefined;

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
   * @deprecated Use dueDateDisplay instead - this getter is kept for backward compatibility
   */
  get formattedDueDateDisplay(): string | undefined {
    return this.dueDateDisplay;
  }

  /**
   * @deprecated Use durationDisplay instead - this getter is kept for backward compatibility
   */
  get formattedDurationDisplay(): string | undefined {
    return this.durationDisplay;
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
export function createTodoModel(todo: Todo, settings: SettingsModel, registry?: EntityRegistry): TodoModel {
  return new TodoModel(todo, settings, registry);
}

/**
 * Create TodoModel instances from an array of todos
 * Filters out any undefined/null entries
 */
export function createTodoModels(todos: Todo[], settings: SettingsModel, registry?: EntityRegistry): TodoModel[] {
  return todos.filter((todo) => todo != null).map((todo) => new TodoModel(todo, settings, registry));
}
