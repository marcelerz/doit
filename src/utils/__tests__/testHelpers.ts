/**
 * Shared Test Helpers for Utility Tests
 *
 * Provides common factory functions for creating test data.
 */

import { TodoModel } from "@/models/TodoModel";
import { SettingsModel, createSettingsModel, resetSettingsModel_DONOTUSE } from "@/models/SettingsModel";
import { Settings } from "@/types/settings";
import { Todo, TodoId, getTodoId, Tag } from "@/types/todo";
import { PersonId } from "@/types/person";
import { ProjectId } from "@/types/project";
import { getPriorityId, Priority } from "@/types/priority";
import { getColor } from "@/types/types";
import { Timestamp } from "@/types/time";
import {
  getShortTime,
  getWeekday,
  getMonth,
  getDurationDay,
  getTimestamp,
  getDurationMin,
  getDurationSec,
  getDurationHour,
} from "@/types/time";

/**
 * Flexible test overrides that allow strings for branded types.
 * This makes writing tests more convenient.
 */
export interface TestTodoOverrides {
  id?: string | TodoId;
  text?: string;
  plainText?: string;
  state?: Todo["state"];
  createdAt?: number | Timestamp;
  completedAt?: number | Timestamp;
  assignedPeople?: string[];
  sourcePeople?: string[];
  mentionedPeople?: string[];
  projects?: string[];
  tags?: string[];
  dependencies?: string[];
  priority?: string;
  dueDate?: string | number;
  duration?: string | number;
  sprint?: string;
  workflowState?: string;
  metadata?: {
    assignedPeople?: string[];
    sourcePeople?: string[];
    mentionedPeople?: string[];
    projects?: string[];
    tags?: string[];
    priority?: string;
    dueDate?: string | number;
    duration?: string | number;
    sprint?: string;
  };
  priorityOrder?: number;
}

// Re-export for convenience
export { resetSettingsModel_DONOTUSE };

// Default priorities for tests
export const DEFAULT_PRIORITIES: Priority[] = [
  { id: getPriorityId("1"), name: "urgent", alternatives: ["critical"], order: 1, color: getColor("#ff0000") },
  { id: getPriorityId("2"), name: "high", alternatives: ["important"], order: 2, color: getColor("#ff6600") },
  { id: getPriorityId("3"), name: "medium", alternatives: [], order: 3, color: getColor("#ffcc00") },
  { id: getPriorityId("4"), name: "low", alternatives: [], order: 4, color: getColor("#00cc00") },
];

/**
 * Create a complete SettingsModel with all required fields
 */
export function createTestSettings(overrides: Partial<Settings> = {}): SettingsModel {
  return createSettingsModel({
    priorities: DEFAULT_PRIORITIES,
    linkPatterns: [],
    markerColors: {
      assigned: getColor("#cce5ff"),
      source: getColor("#fff3cd"),
      mentioned: getColor("#ffe8cc"),
      project: getColor("#e2ccff"),
      tag: getColor("#d4edda"),
      dueDate: getColor("#f8d7da"),
      duration: getColor("#e2e3e5"),
      recurring: getColor("#cff4fc"),
      dependency: getColor("#ffcccc"),
      priority: getColor("#ffcccc"),
      sprint: getColor("#dbeafe"),
    },
    general: {
      archiveDays: getDurationDay(7),
      autoDelete: { enabled: false, deleteDays: getDurationDay(90) },
      theme: "system",
    },
    dateTime: {
      morning: getShortTime("09:00"),
      noon: getShortTime("12:00"),
      afternoon: getShortTime("14:00"),
      evening: getShortTime("18:00"),
      workWeekStart: getWeekday(1),
      workWeekEnd: getWeekday(5),
      fiscalYearStart: getMonth(1),
    },
    workHours: {
      useCommonSchedule: true,
      commonSchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
      weekdaySchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
      weekendSchedule: { startTime: getShortTime("10:00"), endTime: getShortTime("14:00"), breaks: [] },
      customSchedules: {},
    },
    gantt: {
      schedulingTechnique: "sequential",
      defaultTaskDuration: getDurationMin(30),
      durationMultiplier: 1.0,
      minimumRemainingDuration: getDurationMin(1),
      contextSwitchingTime: getDurationMin(5),
      pomodoroWorkDuration: getDurationMin(25),
      pomodoroShortBreak: getDurationMin(5),
      pomodoroLongBreak: getDurationMin(15),
      pomodoroLongBreakInterval: 4,
      flowWorkDuration: getDurationMin(52),
      flowBreakDuration: getDurationMin(17),
      flowContextSwitchingTime: getDurationMin(10),
      zoomLevel: "1hour",
      showWeekends: true,
      showDependencies: true,
      taskRowHeight: "normal",
      showBufferZones: true,
      showNowLine: true,
      collapseCompleted: false,
      presets: [],
      activePresetId: undefined,
    },
    kanban: {
      states: [],
      allowedTransitions: [],
      views: [],
      activeViewId: "all",
      showEmptyColumns: true,
      showTaskCount: true,
      cardDisplayFields: [],
    },
    sprints: { defaultSprintDuration: getDurationDay(14), showBacklogInSprint: true },
    autoAssign: {
      enabled: false,
      assignedPerson: undefined,
      sourcePerson: undefined,
      project: undefined,
      priority: undefined,
      dueDate: undefined,
      duration: undefined,
      recurring: undefined,
    },
    calendar: {
      weekStartDay: getWeekday(0),
      defaultView: "month",
      showWeekNumbers: false,
      taskDotLimit: 4,
      dotColorBy: "state",
      showOverdueBadge: true,
      showRecurringIndicator: true,
      showTaskCount: false,
    },
    focus: {
      requireConfirmation: false,
      confirmationRepeatInterval: getDurationSec(30),
      confirmationMaxRepeats: 5,
      autoTimeTracking: true,
      trackActualVsEstimated: true,
      defaultExtendMinutes: getDurationMin(5),
      extendOptions: [getDurationMin(5), getDurationMin(10), getDurationMin(15), getDurationMin(30)],
      showEarlyCompletePrompt: true,
      autoExtendOnOvertime: true,
      useTrackedTimeForDuration: true,
      notificationsEnabled: true,
      soundEnabled: true,
      soundVolume: 0.3,
      ambientSoundEnabled: false,
      ambientWorkSound: "",
      ambientBreakSound: "",
      ambientVolume: 0.3,
      showNextTask: true,
      showSessionStats: true,
      showKeyboardHints: true,
    },
    categories: [],
    notifications: {
      enabled: false,
      notifyOverdue: true,
      notifyDueToday: true,
      notifyDueSoon: true,
      dueSoonHours: getDurationHour(2),
      checkInterval: getDurationMin(15),
    },
    features: {
      ganttView: true,
      calendarView: true,
      kanbanView: true,
      sprintsView: true,
      statsView: true,
      templates: true,
      batchProcessing: true,
      reordering: true,
      exports: true,
      focusMode: true,
      timeTracking: true,
    },
    backup: {
      autoBackupEnabled: true,
      retentionDays: 30,
      lastBackupDate: null,
    },
    ...overrides,
  });
}

/**
 * Create a raw Todo object for testing
 */
export function createRawTodo(overrides: TestTodoOverrides = {}): Todo {
  const id = typeof overrides.id === "string" ? getTodoId(overrides.id) : (overrides.id || getTodoId(`test-${Date.now()}-${Math.random()}`));
  const createdAt = overrides.createdAt ? getTimestamp(overrides.createdAt as number) : getTimestamp(Date.now());
  const completedAt = overrides.completedAt ? getTimestamp(overrides.completedAt as number) : undefined;

  return {
    id,
    text: overrides.text || "Test todo",
    plainText: overrides.plainText || overrides.text || "Test todo",
    state: overrides.state || "active",
    createdAt,
    context: "",
    assignedPeople: (overrides.assignedPeople || []) as PersonId[],
    sourcePeople: (overrides.sourcePeople || []) as PersonId[],
    mentionedPeople: (overrides.mentionedPeople || []) as PersonId[],
    projects: (overrides.projects || []) as ProjectId[],
    tags: (overrides.tags || []) as Tag[],
    dependencies: (overrides.dependencies || []) as TodoId[],
    comments: [],
    activity: [],
    subtasks: [],
    completedAt,
    priority: overrides.priority as Todo["priority"],
    dueDate: parseDateToTimestamp(overrides.dueDate) as Todo["dueDate"],
    duration: overrides.duration as Todo["duration"],
    sprint: overrides.sprint as Todo["sprint"],
    workflowState: overrides.workflowState as Todo["workflowState"],
  };
}

/**
 * Convert a priority name to its ID
 */
function getPriorityIdFromName(priorityName: string | undefined): string | undefined {
  if (!priorityName) return undefined;
  const priority = DEFAULT_PRIORITIES.find((p) => p.name === priorityName);
  return priority?.id;
}

/**
 * Parse a date string to a timestamp (handles YYYY-MM-DD format as local date)
 */
function parseDateToTimestamp(dateValue: string | number | undefined): number | undefined {
  if (dateValue === undefined) return undefined;
  if (typeof dateValue === "number") return dateValue;
  // Parse YYYY-MM-DD as local date to avoid timezone issues
  const parts = dateValue.split("-");
  if (parts.length === 3) {
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.getTime();
  }
  return new Date(dateValue).getTime();
}

/**
 * Parse a duration string to seconds (e.g., "30m" -> 1800, "2h" -> 7200)
 */
function parseDurationToSeconds(durationValue: string | number | undefined): number | undefined {
  if (durationValue === undefined) return undefined;
  if (typeof durationValue === "number") return durationValue;

  const match = durationValue.match(/^(\d+(?:\.\d+)?)(m|h|d)?$/i);
  if (!match) return undefined;

  const value = parseFloat(match[1]);
  const unit = (match[2] || "m").toLowerCase();

  switch (unit) {
    case "h":
      return value * 60 * 60; // hours to seconds
    case "d":
      return value * 8 * 60 * 60; // days to seconds (8-hour days)
    case "m":
    default:
      return value * 60; // minutes to seconds
  }
}

/**
 * Create a TodoModel for testing with proper settings
 */
export function createTestTodo(
  overrides: TestTodoOverrides = {},
  settings?: SettingsModel
): TodoModel {
  const metadata = overrides.metadata || {};
  const settingsModel = settings || createTestSettings();

  // Convert priority name to ID if provided as a name
  const priorityName = metadata.priority ?? overrides.priority;
  const priorityId = priorityName ? getPriorityIdFromName(priorityName) ?? priorityName : undefined;

  const todo = createRawTodo({
    ...overrides,
    assignedPeople: metadata.assignedPeople ?? overrides.assignedPeople,
    sourcePeople: metadata.sourcePeople ?? overrides.sourcePeople,
    mentionedPeople: metadata.mentionedPeople ?? overrides.mentionedPeople,
    projects: metadata.projects ?? overrides.projects,
    tags: metadata.tags ?? overrides.tags,
    priority: priorityId,
    dueDate: parseDateToTimestamp(metadata.dueDate ?? overrides.dueDate),
    duration: parseDurationToSeconds(metadata.duration ?? overrides.duration),
    sprint: metadata.sprint ?? overrides.sprint,
  });
  return new TodoModel(todo, settingsModel);
}
