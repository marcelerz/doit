/**
 * SettingsModel - Business logic wrapper for Settings
 *
 * Provides computed properties and utility methods for:
 * - Schedule/work hours calculations (BOD, EOD, schedule for date)
 * - Priority lookups and ordering
 * - Color finding for people, projects, priorities
 * - Date/time helpers (morning, noon, afternoon, evening times)
 * - Kanban state and transition lookups
 * - Feature toggle checks
 */

import type { Settings, DaySchedule, WorkHoursSettings, DateTimeSettings } from "@/types/settings";
import type { Priority } from "@/types/priority";
import type { KanbanState } from "@/types/kanbanState";
import type { KanbanView } from "@/types/kanbanView";

type DayName = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
const DAY_NAMES: DayName[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/**
 * SettingsModel wraps Settings with business logic methods.
 * This is a singleton - once initialized, the same instance is reused.
 */
export class SettingsModel {
  /**
   * Singleton instance
   */
  private static _instance: SettingsModel | null = null;

  /**
   * The raw settings object wrapped by this model.
   * Access this when you need to pass the data to storage/hooks.
   */
  protected _raw: Settings;

  private constructor(settings: Settings) {
    this._raw = settings;
  }

  /**
   * Get the singleton instance. Throws if not initialized.
   */
  static getInstance(): SettingsModel {
    if (!SettingsModel._instance) {
      throw new Error("SettingsModel not initialized. Call createSettingsModel() first.");
    }
    return SettingsModel._instance;
  }

  /**
   * Check if the singleton has been initialized
   */
  static isInitialized(): boolean {
    return SettingsModel._instance !== null;
  }

  /**
   * Initialize or update the singleton with new settings
   */
  static initialize(settings: Settings): SettingsModel {
    if (!SettingsModel._instance) {
      SettingsModel._instance = new SettingsModel(settings);
    } else {
      SettingsModel._instance._raw = settings;
    }
    return SettingsModel._instance;
  }

  /**
   * Reset the singleton (for testing only)
   */
  static reset_DONOTUSE(): void {
    SettingsModel._instance = null;
  }

  get raw_DONOTUSE(): Settings {
    return this._raw;
  }

  // ============================================================================
  // WORK HOURS & SCHEDULE
  // ============================================================================

  /**
   * Get the schedule for a specific date based on work hours settings
   */
  getScheduleForDate(date: Date): DaySchedule {
    const dayOfWeek = date.getDay();
    const dayName = DAY_NAMES[dayOfWeek];
    const workHours = this._raw.workHours;

    if (workHours.useCommonSchedule) {
      return workHours.commonSchedule;
    }

    const customSchedule = workHours.customSchedules[dayName];
    if (customSchedule) return customSchedule;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return isWeekend ? workHours.weekendSchedule : workHours.weekdaySchedule;
  }

  /**
   * Get BOD (Beginning of Day) and EOD (End of Day) times for a specific date
   */
  getBodEod(date: Date): { bod: string; eod: string } {
    const schedule = this.getScheduleForDate(date);
    return {
      bod: schedule?.startTime || "09:00",
      eod: schedule?.endTime || "17:00",
    };
  }

  /**
   * Get BOD time for a specific date
   */
  getBod(date: Date): string {
    return this.getBodEod(date).bod;
  }

  /**
   * Get EOD time for a specific date
   */
  getEod(date: Date): string {
    return this.getBodEod(date).eod;
  }

  /**
   * Check if a date is a weekend day
   */
  isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * Check if a date is a workday (has work hours enabled)
   */
  isWorkday(date: Date): boolean {
    const schedule = this.getScheduleForDate(date);
    return schedule.enabled !== false;
  }

  /**
   * Get the day name for a date
   */
  getDayName(date: Date): DayName {
    return DAY_NAMES[date.getDay()];
  }

  // ============================================================================
  // DATE/TIME SETTINGS
  // ============================================================================

  /**
   * Get morning time from settings
   */
  get morningTime(): string {
    return this._raw.dateTime.morning;
  }

  /**
   * Get noon time from settings
   */
  get noonTime(): string {
    return this._raw.dateTime.noon;
  }

  /**
   * Get afternoon time from settings
   */
  get afternoonTime(): string {
    return this._raw.dateTime.afternoon;
  }

  /**
   * Get evening time from settings
   */
  get eveningTime(): string {
    return this._raw.dateTime.evening;
  }

  /**
   * Get the work week start day (0 = Sunday, 1 = Monday, etc.)
   */
  get workWeekStart(): number {
    return this._raw.dateTime.workWeekStart;
  }

  /**
   * Get the fiscal year start month (1-12)
   */
  get fiscalYearStart(): number {
    return this._raw.dateTime.fiscalYearStart;
  }

  // ============================================================================
  // PRIORITY LOOKUPS
  // ============================================================================

  /**
   * Get all priorities sorted by order
   */
  get priorities(): Priority[] {
    return [...this._raw.priorities].sort((a, b) => a.order - b.order);
  }

  /**
   * Find a priority by name (case-insensitive, checks alternatives too)
   */
  findPriority(name: string): Priority | undefined {
    const lowerName = name.toLowerCase();
    return this._raw.priorities.find(
      (p) => p.name.toLowerCase() === lowerName || p.alternatives.some((alt) => alt.toLowerCase() === lowerName),
    );
  }

  /**
   * Get priority color by name, with fallback
   */
  getPriorityColor(name: string): string {
    const priority = this.findPriority(name);
    return priority?.color || this._raw.markerColors.priority;
  }

  /**
   * Get priority order by name (for sorting)
   */
  getPriorityOrder(name: string): number {
    const priority = this.findPriority(name);
    return priority?.order ?? 999;
  }

  /**
   * Check if a priority name is valid
   */
  isValidPriority(name: string): boolean {
    return this.findPriority(name) !== undefined;
  }

  // ============================================================================
  // COLOR LOOKUPS
  // ============================================================================

  /**
   * Get marker color for assigned people
   */
  get assignedColor(): string {
    return this._raw.markerColors.assigned;
  }

  /**
   * Get marker color for source people
   */
  get sourceColor(): string {
    return this._raw.markerColors.source;
  }

  /**
   * Get marker color for mentioned people
   */
  get mentionedColor(): string {
    return this._raw.markerColors.mentioned;
  }

  /**
   * Get marker color for projects
   */
  get projectColor(): string {
    return this._raw.markerColors.project;
  }

  /**
   * Get marker color for priorities
   */
  get priorityColor(): string {
    return this._raw.markerColors.priority;
  }

  /**
   * Get marker color for due dates
   */
  get dueDateColor(): string {
    return this._raw.markerColors.dueDate;
  }

  /**
   * Get marker color for duration
   */
  get durationColor(): string {
    return this._raw.markerColors.duration;
  }

  /**
   * Get marker color for recurring patterns
   */
  get recurringColor(): string {
    return this._raw.markerColors.recurring;
  }

  /**
   * Get marker color for tags
   */
  get tagColor(): string {
    return this._raw.markerColors.tag;
  }

  // ============================================================================
  // KANBAN LOOKUPS
  // ============================================================================

  /**
   * Get all kanban states sorted by order
   */
  get kanbanStates(): KanbanState[] {
    return [...this._raw.kanban.states].sort((a, b) => a.order - b.order);
  }

  /**
   * Find a kanban state by ID
   */
  findKanbanState(stateId: string): KanbanState | undefined {
    return this._raw.kanban.states.find((s) => s.id === stateId);
  }

  /**
   * Get the system states (Backlog, Completed, Archived)
   */
  get systemKanbanStates(): KanbanState[] {
    return this._raw.kanban.states.filter((s) => s.isSystem);
  }

  /**
   * Get non-system (custom) kanban states
   */
  get customKanbanStates(): KanbanState[] {
    return this._raw.kanban.states.filter((s) => !s.isSystem);
  }

  /**
   * Check if a transition from one state to another is allowed
   */
  isTransitionAllowed(fromStateId: string, toStateId: string): boolean {
    return this._raw.kanban.allowedTransitions.some((t) => t.fromStateId === fromStateId && t.toStateId === toStateId);
  }

  /**
   * Get allowed target states from a given state
   */
  getAllowedTransitionsFrom(stateId: string): KanbanState[] {
    const allowedIds = this._raw.kanban.allowedTransitions
      .filter((t) => t.fromStateId === stateId)
      .map((t) => t.toStateId);

    return this._raw.kanban.states.filter((s) => allowedIds.includes(s.id));
  }

  /**
   * Get all kanban views
   */
  get kanbanViews(): KanbanView[] {
    return this._raw.kanban.views;
  }

  /**
   * Get the active kanban view
   */
  get activeKanbanView(): KanbanView | undefined {
    return this._raw.kanban.views.find((v) => v.id === this._raw.kanban.activeViewId);
  }

  /**
   * Find a kanban view by ID
   */
  findKanbanView(viewId: string): KanbanView | undefined {
    return this._raw.kanban.views.find((v) => v.id === viewId);
  }

  // ============================================================================
  // FEATURE TOGGLES
  // ============================================================================

  /**
   * Check if Gantt view is enabled
   */
  get isGanttViewEnabled(): boolean {
    return this._raw.features.ganttView;
  }

  /**
   * Check if Calendar view is enabled
   */
  get isCalendarViewEnabled(): boolean {
    return this._raw.features.calendarView;
  }

  /**
   * Check if Kanban view is enabled
   */
  get isKanbanViewEnabled(): boolean {
    return this._raw.features.kanbanView;
  }

  /**
   * Check if Sprints view is enabled
   */
  get isSprintsViewEnabled(): boolean {
    return this._raw.features.sprintsView;
  }

  /**
   * Check if Stats view is enabled
   */
  get isStatsViewEnabled(): boolean {
    return this._raw.features.statsView;
  }

  /**
   * Check if templates are enabled
   */
  get isTemplatesEnabled(): boolean {
    return this._raw.features.templates;
  }

  /**
   * Check if batch processing is enabled
   */
  get isBatchProcessingEnabled(): boolean {
    return this._raw.features.batchProcessing;
  }

  /**
   * Check if reordering is enabled
   */
  get isReorderingEnabled(): boolean {
    return this._raw.features.reordering;
  }

  /**
   * Check if exports are enabled
   */
  get isExportsEnabled(): boolean {
    return this._raw.features.exports;
  }

  /**
   * Check if focus mode is enabled
   */
  get isFocusModeEnabled(): boolean {
    return this._raw.features.focusMode;
  }

  /**
   * Check if time tracking is enabled
   */
  get isTimeTrackingEnabled(): boolean {
    return this._raw.features.timeTracking;
  }

  /**
   * Check if a specific feature is enabled by key
   */
  isFeatureEnabled(feature: keyof Settings["features"]): boolean {
    return this._raw.features[feature];
  }

  // ============================================================================
  // AUTO-ASSIGN SETTINGS
  // ============================================================================

  /**
   * Check if auto-assign is enabled
   */
  get isAutoAssignEnabled(): boolean {
    return this._raw.autoAssign.enabled;
  }

  /**
   * Get default assigned person (or undefined if auto-assign disabled or not set)
   */
  get defaultAssignedPerson(): string | undefined {
    if (!this._raw.autoAssign.enabled) return undefined;
    return this._raw.autoAssign.assignedPerson;
  }

  /**
   * Get default source person (or undefined if auto-assign disabled or not set)
   */
  get defaultSourcePerson(): string | undefined {
    if (!this._raw.autoAssign.enabled) return undefined;
    return this._raw.autoAssign.sourcePerson;
  }

  /**
   * Get default project (or undefined if auto-assign disabled or not set)
   */
  get defaultProject(): string | undefined {
    if (!this._raw.autoAssign.enabled) return undefined;
    return this._raw.autoAssign.project;
  }

  /**
   * Get default priority (or undefined if auto-assign disabled or not set)
   */
  get defaultPriority(): string | undefined {
    if (!this._raw.autoAssign.enabled) return undefined;
    return this._raw.autoAssign.priority;
  }

  /**
   * Get default due date (or undefined if auto-assign disabled or not set)
   */
  get defaultDueDate(): string | undefined {
    if (!this._raw.autoAssign.enabled) return undefined;
    return this._raw.autoAssign.dueDate;
  }

  /**
   * Get default duration (or undefined if auto-assign disabled or not set)
   */
  get defaultDuration(): string | undefined {
    if (!this._raw.autoAssign.enabled) return undefined;
    return this._raw.autoAssign.duration;
  }

  /**
   * Get default recurring pattern (or undefined if auto-assign disabled or not set)
   */
  get defaultRecurring(): string | undefined {
    if (!this._raw.autoAssign.enabled) return undefined;
    return this._raw.autoAssign.recurring;
  }

  // ============================================================================
  // NOTIFICATION SETTINGS
  // ============================================================================

  /**
   * Check if notifications are enabled
   */
  get areNotificationsEnabled(): boolean {
    return this._raw.notifications.enabled;
  }

  /**
   * Check if overdue notifications are enabled
   */
  get notifyOnOverdue(): boolean {
    return this._raw.notifications.enabled && this._raw.notifications.notifyOverdue;
  }

  /**
   * Check if due today notifications are enabled
   */
  get notifyOnDueToday(): boolean {
    return this._raw.notifications.enabled && this._raw.notifications.notifyDueToday;
  }

  /**
   * Check if due soon notifications are enabled
   */
  get notifyOnDueSoon(): boolean {
    return this._raw.notifications.enabled && this._raw.notifications.notifyDueSoon;
  }

  /**
   * Get the hours before due to trigger "due soon" notification
   */
  get dueSoonHours(): number {
    return this._raw.notifications.dueSoonHours;
  }

  /**
   * Get the notification check interval in minutes
   */
  get notificationCheckInterval(): number {
    return this._raw.notifications.checkInterval;
  }

  // ============================================================================
  // GENERAL SETTINGS
  // ============================================================================

  /**
   * Get archive days (days after completion before auto-archiving)
   */
  get archiveDays(): number {
    return this._raw.general.archiveDays;
  }

  /**
   * Check if auto-delete is enabled
   */
  get isAutoDeleteEnabled(): boolean {
    return this._raw.general.autoDelete.enabled;
  }

  /**
   * Get delete days (days after completion before auto-deleting)
   */
  get deleteDays(): number {
    return this._raw.general.autoDelete.deleteDays;
  }

  /**
   * Get current theme preference
   */
  get theme(): "light" | "dark" | "system" {
    return this._raw.general.theme;
  }

  // ============================================================================
  // SPRINT SETTINGS
  // ============================================================================

  /**
   * Get default sprint duration in days
   */
  get defaultSprintDuration(): number {
    return this._raw.sprints.defaultSprintDuration;
  }

  /**
   * Check if backlog should be shown in sprint view
   */
  get showBacklogInSprint(): boolean {
    return this._raw.sprints.showBacklogInSprint;
  }

  // ============================================================================
  // FOCUS SETTINGS
  // ============================================================================

  /**
   * Check if auto time tracking is enabled in focus mode
   */
  get isAutoTimeTrackingEnabled(): boolean {
    return this._raw.focus.autoTimeTracking;
  }

  /**
   * Check if focus mode sounds are enabled
   */
  get isFocusSoundEnabled(): boolean {
    return this._raw.focus.soundEnabled;
  }

  /**
   * Get focus mode sound volume (0-1)
   */
  get focusSoundVolume(): number {
    return this._raw.focus.soundVolume;
  }

  /**
   * Check if ambient sounds are enabled
   */
  get isAmbientSoundEnabled(): boolean {
    return this._raw.focus.ambientSoundEnabled;
  }

  /**
   * Get ambient work sound file
   */
  get ambientWorkSound(): string {
    return this._raw.focus.ambientWorkSound;
  }

  /**
   * Get ambient break sound file
   */
  get ambientBreakSound(): string {
    return this._raw.focus.ambientBreakSound;
  }

  // ============================================================================
  // DATE TIME & WORK HOURS (for passing to utility functions)
  // ============================================================================

  /**
   * Get dateTime settings for use with date utilities
   */
  get dateTime(): DateTimeSettings {
    return this._raw.dateTime;
  }

  /**
   * Get workHours settings for use with date utilities
   */
  get workHours(): WorkHoursSettings {
    return this._raw.workHours;
  }
}

/**
 * Create or update the SettingsModel singleton from raw settings.
 * If already initialized, updates the existing instance with new settings.
 */
export function createSettingsModel(settings: Settings): SettingsModel {
  return SettingsModel.initialize(settings);
}

/**
 * Get the current SettingsModel singleton instance.
 * Throws if not initialized - use createSettingsModel() first.
 */
export function getSettingsModel(): SettingsModel {
  return SettingsModel.getInstance();
}

/**
 * Check if SettingsModel singleton has been initialized
 */
export function isSettingsModelInitialized(): boolean {
  return SettingsModel.isInitialized();
}

/**
 * Reset the SettingsModel singleton (for testing only)
 */
export function resetSettingsModel_DONOTUSE(): void {
  SettingsModel.reset_DONOTUSE();
}
