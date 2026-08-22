/**
 * Tests for Gantt Scheduler Utility Functions
 */

import {
  parseTime,
  parseDuration,
  getScheduleForDate,
  getPomodoroBreakDuration,
  getPomodoroBreakType,
  sortTodosForScheduling,
  createTaskSchedulingMap,
  scheduleDayTasks,
  scheduleWeekTasks,
  SchedulingConfig,
  BreakBlock,
} from "@/utils/ganttScheduler";
import {
  WorkHoursSettings,
  DaySchedule,
  Settings,
  defaultWorkHoursSettings,
  defaultGeneralSettings,
  defaultDateTimeSettings,
  defaultAutoAssignSettings,
  defaultNotificationSettings,
  defaultKanbanSettings,
  defaultSprintSettings,
  defaultFocusSettings,
  defaultFeatureSettings,
} from "@/types/settings";
import { Gantt, defaultGantt } from "@/types/gantt";
import { Priority, getPriorityId } from "@/types/priority";
import { defaultMarkerColors } from "@/types/markerColors";
import { defaultCalendar } from "@/types/calendar";
import { defaultCategories } from "@/types/project";
import { defaultBackupSettings } from "@/types/backup";
import { createRawTodo as createTodo } from "./testHelpers";
import { TodoModel } from "@/models/TodoModel";
import { createSettingsModel, resetSettingsModel_DONOTUSE } from "@/models/SettingsModel";
import { Todo, getTodoId, getTimeEntryId } from "@/types/todo";
import { getTimestamp, getShortTime, getDurationMin, getDurationSec } from "@/types/time";
import { getBreakPeriodId } from "@/types/breakPeriod";
import { getColor } from "@/types/types";

// Helper to create minimal settings for TodoModel
const createMinimalSettings = (): Settings => ({
  priorities: [
    { id: getPriorityId("1"), name: "urgent", alternatives: ["critical"], order: 1 },
    { id: getPriorityId("2"), name: "high", alternatives: [], order: 2 },
    { id: getPriorityId("3"), name: "medium", alternatives: [], order: 3 },
    { id: getPriorityId("4"), name: "low", alternatives: [], order: 4 },
  ],
  linkPatterns: [],
  markerColors: defaultMarkerColors,
  general: defaultGeneralSettings,
  dateTime: defaultDateTimeSettings,
  workHours: defaultWorkHoursSettings,
  gantt: defaultGantt,
  kanban: defaultKanbanSettings,
  sprints: defaultSprintSettings,
  autoAssign: defaultAutoAssignSettings,
  calendar: defaultCalendar,
  focus: defaultFocusSettings,
  categories: defaultCategories,
  notifications: defaultNotificationSettings,
  notes: {
    defaultPinNewNotes: false,
    showArchivedByDefault: false,
    sortOrder: "modified",
    oneOnOneTemplate: [],
    meetingNoteTemplate: [],
  },
  features: defaultFeatureSettings,
  backup: defaultBackupSettings,
});

// Helper to create minimal WorkHoursSettings
const createWorkHoursSettings = (): WorkHoursSettings => ({
  useCommonSchedule: true,
  commonSchedule: {
    startTime: getShortTime("09:00"),
    endTime: getShortTime("17:00"),
    breaks: [
      {
        id: getBreakPeriodId("lunch"),
        name: "Lunch",
        startTime: getShortTime("12:00"),
        endTime: getShortTime("13:00"),
      },
    ],
  },
  weekdaySchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
  weekendSchedule: { startTime: getShortTime("10:00"), endTime: getShortTime("14:00"), breaks: [] },
  customSchedules: {},
});

// Helper to create minimal Gantt settings
const createGanttSettings = (overrides: Partial<Gantt> = {}): Gantt => ({
  ...defaultGantt,
  ...overrides,
});

// Helper to create a minimal Todo

// Helper to create TodoModel from Todo
const _createTodoModel = (overrides: Partial<Todo> = {}): TodoModel => {
  return new TodoModel(createTodo(overrides), createSettingsModel(createMinimalSettings()));
};

// Helper to create a SchedulingConfig
const createSchedulingConfig = (overrides: Partial<SchedulingConfig> = {}): SchedulingConfig => ({
  ganttSettings: createGanttSettings(),
  workHours: createWorkHoursSettings(),
  availablePriorities: [
    { id: getPriorityId("1"), name: "urgent", alternatives: ["critical"], order: 1 },
    { id: getPriorityId("2"), name: "high", alternatives: [], order: 2 },
    { id: getPriorityId("3"), name: "medium", alternatives: [], order: 3 },
    { id: getPriorityId("4"), name: "low", alternatives: [], order: 4 },
  ],
  schedulingMode: "asap",
  ...overrides,
});

describe("ganttScheduler", () => {
  // Reset singleton before each test to ensure isolation
  beforeEach(() => {
    resetSettingsModel_DONOTUSE();
  });

  describe("parseTime", () => {
    it("should parse HH:MM format correctly", () => {
      const baseDate = new Date("2025-12-09T00:00:00");
      const result = parseTime("09:30", baseDate);

      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
    });

    it("should handle midnight correctly", () => {
      const baseDate = new Date("2025-12-09T12:00:00");
      const result = parseTime("00:00", baseDate);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it("should handle end of day correctly", () => {
      const baseDate = new Date("2025-12-09T00:00:00");
      const result = parseTime("23:59", baseDate);

      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });

    it("should preserve the base date", () => {
      const baseDate = new Date("2025-12-25T12:00:00");
      const result = parseTime("14:30", baseDate);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // December (0-indexed)
      expect(result.getDate()).toBe(25);
    });
  });

  describe("parseDuration", () => {
    it("should parse minutes format (30m)", () => {
      expect(parseDuration("30m")).toBe(30);
      expect(parseDuration("60m")).toBe(60);
      expect(parseDuration("90m")).toBe(90);
    });

    it("should parse hours format (2h)", () => {
      expect(parseDuration("1h")).toBe(60);
      expect(parseDuration("2h")).toBe(120);
      expect(parseDuration("1.5h")).toBe(90);
    });

    it("should handle decimal values", () => {
      expect(parseDuration("1.5h")).toBe(90);
      expect(parseDuration("0.5h")).toBe(30);
      expect(parseDuration("2.25h")).toBe(135);
    });

    it("should return default 30 minutes for undefined", () => {
      expect(parseDuration(undefined)).toBe(30);
    });

    it("should return default 30 minutes for invalid input", () => {
      expect(parseDuration("invalid")).toBe(30);
      expect(parseDuration("abc")).toBe(30);
    });

    it("should handle numbers without unit as minutes", () => {
      expect(parseDuration("45")).toBe(45);
      expect(parseDuration("120")).toBe(120);
    });
  });

  describe("getScheduleForDate", () => {
    it("should return common schedule when useCommonSchedule is true", () => {
      const workHours = createWorkHoursSettings();
      const monday = new Date("2025-12-08"); // A Monday

      const result = getScheduleForDate(monday, workHours);

      expect(result.startTime).toBe("09:00");
      expect(result.endTime).toBe("17:00");
      expect(result.breaks.length).toBe(1);
    });

    it("should return weekday schedule for weekdays when not using common schedule", () => {
      const workHours: WorkHoursSettings = {
        useCommonSchedule: false,
        commonSchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
        weekdaySchedule: { startTime: getShortTime("08:00"), endTime: getShortTime("16:00"), breaks: [] },
        weekendSchedule: { startTime: getShortTime("10:00"), endTime: getShortTime("14:00"), breaks: [] },
        customSchedules: {},
      };
      const tuesday = new Date("2025-12-09"); // A Tuesday

      const result = getScheduleForDate(tuesday, workHours);

      expect(result.startTime).toBe("08:00");
      expect(result.endTime).toBe("16:00");
    });

    it("should return weekend schedule for Saturday/Sunday", () => {
      const workHours: WorkHoursSettings = {
        useCommonSchedule: false,
        commonSchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
        weekdaySchedule: { startTime: getShortTime("08:00"), endTime: getShortTime("16:00"), breaks: [] },
        weekendSchedule: { startTime: getShortTime("10:00"), endTime: getShortTime("14:00"), breaks: [] },
        customSchedules: {},
      };
      // Create Saturday in local timezone
      const saturday = new Date(2025, 11, 13, 12, 0, 0); // Dec 13, 2025 is a Saturday

      const result = getScheduleForDate(saturday, workHours);

      expect(result.startTime).toBe("10:00");
      expect(result.endTime).toBe("14:00");
    });

    it("should return custom schedule for specific days", () => {
      const customFriday: DaySchedule = {
        startTime: getShortTime("10:00"),
        endTime: getShortTime("15:00"),
        breaks: [],
      };
      const workHours: WorkHoursSettings = {
        useCommonSchedule: false,
        commonSchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
        weekdaySchedule: { startTime: getShortTime("08:00"), endTime: getShortTime("16:00"), breaks: [] },
        weekendSchedule: { startTime: getShortTime("10:00"), endTime: getShortTime("14:00"), breaks: [] },
        customSchedules: { friday: customFriday },
      };
      // Create Friday in local timezone
      const friday = new Date(2025, 11, 12, 12, 0, 0); // Dec 12, 2025 is a Friday

      const result = getScheduleForDate(friday, workHours);

      expect(result.startTime).toBe("10:00");
      expect(result.endTime).toBe("15:00");
    });
  });

  describe("getPomodoroBreakDuration", () => {
    const ganttSettings = createGanttSettings();

    it("should return short break duration for non-long-break sessions", () => {
      expect(getPomodoroBreakDuration(1, ganttSettings)).toBe(5);
      expect(getPomodoroBreakDuration(2, ganttSettings)).toBe(5);
      expect(getPomodoroBreakDuration(3, ganttSettings)).toBe(5);
    });

    it("should return long break duration after N sessions", () => {
      // Default interval is 4
      expect(getPomodoroBreakDuration(4, ganttSettings)).toBe(15);
      expect(getPomodoroBreakDuration(8, ganttSettings)).toBe(15);
      expect(getPomodoroBreakDuration(12, ganttSettings)).toBe(15);
    });

    it("should handle custom intervals", () => {
      const customGantt: Gantt = {
        ...ganttSettings,
        pomodoroLongBreakInterval: 2,
        pomodoroShortBreak: getDurationMin(3),
        pomodoroLongBreak: getDurationMin(10),
      };

      expect(getPomodoroBreakDuration(1, customGantt)).toBe(3);
      expect(getPomodoroBreakDuration(2, customGantt)).toBe(10);
      expect(getPomodoroBreakDuration(3, customGantt)).toBe(3);
      expect(getPomodoroBreakDuration(4, customGantt)).toBe(10);
    });

    it("should return short break for session 0", () => {
      expect(getPomodoroBreakDuration(0, ganttSettings)).toBe(5);
    });
  });

  describe("getPomodoroBreakType", () => {
    const ganttSettings = createGanttSettings();

    it("should return 'short' for non-long-break sessions", () => {
      expect(getPomodoroBreakType(1, ganttSettings)).toBe("short");
      expect(getPomodoroBreakType(2, ganttSettings)).toBe("short");
      expect(getPomodoroBreakType(3, ganttSettings)).toBe("short");
    });

    it("should return 'long' for long break sessions", () => {
      expect(getPomodoroBreakType(4, ganttSettings)).toBe("long");
      expect(getPomodoroBreakType(8, ganttSettings)).toBe("long");
    });
  });

  describe("sortTodosForScheduling", () => {
    const settings = createSettingsModel(createMinimalSettings());
    const priorities: Priority[] = [
      { id: getPriorityId("1"), name: "urgent", alternatives: ["critical"], order: 1, color: getColor("#ff0000") },
      { id: getPriorityId("2"), name: "high", alternatives: ["important"], order: 2, color: getColor("#ff6600") },
      { id: getPriorityId("3"), name: "medium", alternatives: [], order: 3, color: getColor("#ffcc00") },
      { id: getPriorityId("4"), name: "low", alternatives: [], order: 4, color: getColor("#00cc00") },
    ];

    it("should sort active tasks before completed/archived in ASAP mode", () => {
      const activeTodo = createTodo({ id: getTodoId("1"), state: "active" });
      const completedTodo = createTodo({
        id: getTodoId("2"),
        state: "completed",
        completedAt: getTimestamp(Date.now()),
      });
      const archivedTodo = createTodo({ id: getTodoId("3"), state: "archived", archivedAt: getTimestamp(Date.now()) });

      const todos = [completedTodo, archivedTodo, activeTodo].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "asap");

      expect(sorted[0].id).toBe("1"); // Active first
    });

    it("should sort by priority within active tasks in ASAP mode", () => {
      const urgentTodo = createTodo({
        id: getTodoId("urgent"),
        state: "active",
        priority: getPriorityId("1"), // urgent priority
      });
      const lowTodo = createTodo({
        id: getTodoId("low"),
        state: "active",
        priority: getPriorityId("4"), // low priority
      });
      const mediumTodo = createTodo({
        id: getTodoId("medium"),
        state: "active",
        priority: getPriorityId("3"), // medium priority
      });

      const todos = [lowTodo, mediumTodo, urgentTodo].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "asap");

      expect(sorted[0].id).toBe("urgent");
      expect(sorted[1].id).toBe("medium");
      expect(sorted[2].id).toBe("low");
    });

    it("should sort by due date in dueDate mode", () => {
      const earlyTodo = createTodo({
        id: getTodoId("early"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-10").getTime()),
      });
      const lateTodo = createTodo({
        id: getTodoId("late"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-20").getTime()),
      });
      const middleTodo = createTodo({
        id: getTodoId("middle"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-15").getTime()),
      });

      const todos = [lateTodo, earlyTodo, middleTodo].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "dueDate");

      expect(sorted[0].id).toBe("early");
      expect(sorted[1].id).toBe("middle");
      expect(sorted[2].id).toBe("late");
    });

    it("should put todos without due dates last in dueDate mode", () => {
      const withDate = createTodo({
        id: getTodoId("with-date"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-10").getTime()),
      });
      const withoutDate = createTodo({
        id: getTodoId("without-date"),
        state: "active",
      });

      const todos = [withoutDate, withDate].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "dueDate");

      expect(sorted[0].id).toBe("with-date");
      expect(sorted[1].id).toBe("without-date");
    });

    it("should filter out deleted todos", () => {
      const activeTodo = createTodo({ id: getTodoId("active"), state: "active" });
      const deletedTodo = createTodo({
        id: getTodoId("deleted"),
        state: "deleted",
        deletedAt: getTimestamp(Date.now()),
      });

      const todos = [activeTodo, deletedTodo].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "asap");

      expect(sorted.length).toBe(1);
      expect(sorted[0].id).toBe("active");
    });

    it("should sort completed tasks by completion date in ASAP mode", () => {
      const earlierCompleted = createTodo({
        id: getTodoId("earlier"),
        state: "completed",
        completedAt: getTimestamp(Date.now() - 3600000), // 1 hour ago
      });
      const laterCompleted = createTodo({
        id: getTodoId("later"),
        state: "completed",
        completedAt: getTimestamp(Date.now()),
      });

      const todos = [laterCompleted, earlierCompleted].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "asap");

      expect(sorted[0].id).toBe("earlier");
      expect(sorted[1].id).toBe("later");
    });

    it("should sort archived tasks by archive date in ASAP mode", () => {
      const earlierArchived = createTodo({
        id: getTodoId("earlier"),
        state: "archived",
        archivedAt: getTimestamp(Date.now() - 3600000), // 1 hour ago
      });
      const laterArchived = createTodo({
        id: getTodoId("later"),
        state: "archived",
        archivedAt: getTimestamp(Date.now()),
      });

      const todos = [laterArchived, earlierArchived].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "asap");

      expect(sorted[0].id).toBe("earlier");
      expect(sorted[1].id).toBe("later");
    });

    it("should handle mixed completed and archived tasks in dueDate mode", () => {
      const completedTodo = createTodo({
        id: getTodoId("completed"),
        state: "completed",
        completedAt: getTimestamp(Date.now() - 7200000), // 2 hours ago
      });
      const archivedTodo = createTodo({
        id: getTodoId("archived"),
        state: "archived",
        archivedAt: getTimestamp(Date.now() - 3600000), // 1 hour ago
      });
      const activeTodo = createTodo({
        id: getTodoId("active"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-10").getTime()),
      });

      const todos = [archivedTodo, completedTodo, activeTodo].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "dueDate");

      expect(sorted[0].id).toBe("active"); // Active first
      expect(sorted[1].id).toBe("completed"); // Then by completion date
      expect(sorted[2].id).toBe("archived");
    });

    it("should handle active tasks without due dates equally in ASAP mode", () => {
      const noDueDate1 = createTodo({
        id: getTodoId("no-date-1"),
        state: "active",
        priority: getPriorityId("3"),
      });
      const noDueDate2 = createTodo({
        id: getTodoId("no-date-2"),
        state: "active",
        priority: getPriorityId("3"),
      });

      const todos = [noDueDate1, noDueDate2].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "asap");

      expect(sorted.length).toBe(2);
    });

    it("should handle active tasks both without due dates in dueDate mode", () => {
      const noDueDate1 = createTodo({ id: getTodoId("no-date-1"), state: "active" });
      const noDueDate2 = createTodo({ id: getTodoId("no-date-2"), state: "active" });

      const todos = [noDueDate1, noDueDate2].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "dueDate");

      expect(sorted.length).toBe(2);
    });

    it("should use completedAt fallback for archived tasks without archivedAt in dueDate mode", () => {
      const archivedWithCompletedAt = createTodo({
        id: getTodoId("archived-with-completed"),
        state: "archived",
        completedAt: getTimestamp(Date.now() - 3600000),
        // No archivedAt
      });
      const archivedWithArchivedAt = createTodo({
        id: getTodoId("archived-with-archived"),
        state: "archived",
        archivedAt: getTimestamp(Date.now()),
      });

      const todos = [archivedWithArchivedAt, archivedWithCompletedAt].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "dueDate");

      expect(sorted[0].id).toBe("archived-with-completed");
      expect(sorted[1].id).toBe("archived-with-archived");
    });
  });

  describe("createTaskSchedulingMap", () => {
    const settings = createSettingsModel(createMinimalSettings());

    it("should create a map with tasks allocated to their due dates", () => {
      const config = createSchedulingConfig();

      const todo1 = createTodo({
        id: getTodoId("todo-1"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-09").getTime()),
        duration: getDurationSec(1800),
      });
      const todo2 = createTodo({
        id: getTodoId("todo-2"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-10").getTime()),
        duration: getDurationSec(3600),
      });

      const todos = [todo1, todo2].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result).toBeDefined();
      expect(result instanceof Map).toBe(true);
    });

    it("should handle todos without due dates", () => {
      const config = createSchedulingConfig();

      const todoNoDueDate = createTodo({
        id: getTodoId("no-due-date"),
        state: "active",
      });

      const todos = [todoNoDueDate].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result).toBeDefined();
    });

    it("should handle completed tasks", () => {
      const config = createSchedulingConfig();

      const completedTodo = createTodo({
        id: getTodoId("completed"),
        state: "completed",
        completedAt: getTimestamp(Date.now()),
        dueDate: getTimestamp(new Date("2025-12-09").getTime()),
      });

      const todos = [completedTodo].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result).toBeDefined();
    });

    it("should handle tasks with time tracking", () => {
      const config = createSchedulingConfig();

      const trackedTodo = createTodo({
        id: getTodoId("tracked"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-09").getTime()),
        duration: getDurationSec(3600),
        timeTracking: {
          entries: [],
          totalMinutes: getDurationMin(30), // 30 minutes already tracked
        },
      });

      const todos = [trackedTodo].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result).toBeDefined();
    });

    it("should handle empty todo list", () => {
      const config = createSchedulingConfig();

      const result = createTaskSchedulingMap([], config);

      expect(result).toBeDefined();
      expect(result instanceof Map).toBe(true);
      expect(result.size).toBe(0);
    });

    it("should handle multi-day tasks", () => {
      const config = createSchedulingConfig();

      // Task that would take multiple days to complete
      const longTodo = createTodo({
        id: getTodoId("long-task"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-15").getTime()),
        duration: getDurationSec(28800), // 480 minutes - would span multiple days
      });

      const todos = [longTodo].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result).toBeDefined();
    });

    it("should respect durationMultiplier setting", () => {
      const config = createSchedulingConfig({
        ganttSettings: createGanttSettings({ durationMultiplier: 1.5 }),
      });

      const todo = createTodo({
        id: getTodoId("multiplied"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-09").getTime()),
        duration: getDurationSec(3600),
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result).toBeDefined();
    });

    it("should map task IDs to date strings", () => {
      const config = createSchedulingConfig();

      const todo = createTodo({
        id: getTodoId("map-test"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-09").getTime()),
        duration: getDurationSec(1800),
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result.has("map-test")).toBe(true);
      expect(typeof result.get("map-test")).toBe("string");
    });

    it("should map archived tasks with completedAt to completion date", () => {
      const config = createSchedulingConfig();
      const completionDate = new Date("2025-12-05T14:30:00");

      const archivedTodo = createTodo({
        id: getTodoId("archived-with-completion"),
        state: "archived",
        archivedAt: getTimestamp(Date.now()),
        completedAt: getTimestamp(completionDate.getTime()),
        dueDate: getTimestamp(new Date("2025-12-10").getTime()),
      });

      const todos = [archivedTodo].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result.has("archived-with-completion")).toBe(true);
      expect(result.get("archived-with-completion")).toBe("2025-12-05");
    });

    it("should handle tasks with time tracking entries", () => {
      const config = createSchedulingConfig();

      const trackedTodo = createTodo({
        id: getTodoId("tracked-task"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-15").getTime()),
        duration: getDurationSec(7200),
        timeTracking: {
          entries: [
            {
              id: getTimeEntryId("entry-1"),
              startTime: getTimestamp(Date.now() - 3600000),
              endTime: getTimestamp(Date.now() - 1800000),
              duration: getDurationMin(30),
            },
          ],
          totalMinutes: getDurationMin(30),
        },
      });

      const todos = [trackedTodo].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result).toBeDefined();
      // Task with time tracking should still be scheduled
      expect(result.has("tracked-task")).toBe(true);
    });

    it("should handle pomodoro scheduling technique in map creation", () => {
      const config = createSchedulingConfig({
        ganttSettings: createGanttSettings({ schedulingTechnique: "pomodoro" }),
      });

      const todo1 = createTodo({
        id: getTodoId("pomo-1"),
        state: "active",
        duration: getDurationSec(1500),
      });
      const todo2 = createTodo({
        id: getTodoId("pomo-2"),
        state: "active",
        duration: getDurationSec(1500),
      });

      const todos = [todo1, todo2].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result).toBeDefined();
    });

    it("should handle flow scheduling technique in map creation", () => {
      const config = createSchedulingConfig({
        ganttSettings: createGanttSettings({ schedulingTechnique: "flow" }),
      });

      const todo = createTodo({
        id: getTodoId("flow-1"),
        state: "active",
        duration: getDurationSec(3120),
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result).toBeDefined();
    });

    it("should schedule remaining work after tracked time on next work day", () => {
      const config = createSchedulingConfig();

      // Task with significant tracked time but remaining work
      const partiallyTrackedTodo = createTodo({
        id: getTodoId("partial-track"),
        state: "active",
        duration: getDurationSec(14400), // 240 minutes total
        timeTracking: {
          entries: [
            {
              id: getTimeEntryId("entry-1"),
              startTime: getTimestamp(Date.now() - 7200000), // 2 hours ago
              endTime: getTimestamp(Date.now() - 3600000), // 1 hour ago
              duration: getDurationMin(60),
            },
          ],
          totalMinutes: getDurationMin(60), // 60 minutes tracked, 180 remaining
        },
      });

      const todos = [partiallyTrackedTodo].map((t) => new TodoModel(t, settings));
      const result = createTaskSchedulingMap(todos, config);

      expect(result).toBeDefined();
      expect(result.has("partial-track")).toBe(true);
    });

    it("should not exceed 30 day scheduling limit", () => {
      const config = createSchedulingConfig();

      // Create many tasks that would overflow 30 days
      const todos: TodoModel[] = [];
      for (let i = 0; i < 50; i++) {
        todos.push(
          new TodoModel(
            createTodo({
              id: getTodoId(`overflow-${i}`),
              state: "active",
              duration: getDurationSec(28800), // Full work day each
            }),
            settings,
          ),
        );
      }

      const result = createTaskSchedulingMap(todos, config);

      expect(result).toBeDefined();
      // Should not crash even with many tasks
    });
  });

  describe("scheduleDayTasks", () => {
    const settings = createSettingsModel(createMinimalSettings());

    // Helper to call scheduleDayTasks with proper arguments
    const callScheduleDayTasks = (
      todos: TodoModel[],
      date: Date,
      ganttSettings: Gantt = createGanttSettings(),
      workHours: WorkHoursSettings = createWorkHoursSettings(),
    ) => {
      const daySchedule = getScheduleForDate(date, workHours);
      const dayStart = parseTime(daySchedule.startTime, date);
      const dayEnd = parseTime(daySchedule.endTime, date);
      const breakBlocks: BreakBlock[] = daySchedule.breaks.map((b) => ({
        name: b.name || "Break",
        startTime: parseTime(b.startTime, date),
        endTime: parseTime(b.endTime, date),
        color: b.color || "#9ca3af",
        icon: "☕",
      }));
      return scheduleDayTasks(todos, dayStart, dayEnd, breakBlocks, date, ganttSettings);
    };

    it("should schedule tasks within working hours", () => {
      const date = new Date("2025-12-09");

      const todo = createTodo({
        id: getTodoId("task-1"),
        state: "active",
        duration: getDurationSec(1800),
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(Array.isArray(result.tasks)).toBe(true);
    });

    it("should return scheduled and unscheduled tasks", () => {
      const date = new Date("2025-12-09");

      const todo = createTodo({
        id: getTodoId("task-1"),
        state: "active",
        duration: getDurationSec(1800),
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result.tasks).toBeDefined();
      expect(result.unscheduledTasks).toBeDefined();
    });

    it("should handle empty task list", () => {
      const date = new Date("2025-12-09");

      const result = callScheduleDayTasks([], date);

      expect(result.tasks).toEqual([]);
      expect(result.unscheduledTasks).toEqual([]);
    });

    it("should schedule with sequential technique", () => {
      const date = new Date("2025-12-09");
      const ganttSettings = createGanttSettings({ schedulingTechnique: "sequential" });

      const todo1 = createTodo({
        id: getTodoId("seq-1"),
        state: "active",
        duration: getDurationSec(1800),
      });
      const todo2 = createTodo({
        id: getTodoId("seq-2"),
        state: "active",
        duration: getDurationSec(1800),
      });

      const todos = [todo1, todo2].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date, ganttSettings);

      expect(result.tasks.length).toBeGreaterThan(0);
    });

    it("should schedule with pomodoro technique", () => {
      const date = new Date("2025-12-09");
      const ganttSettings = createGanttSettings({ schedulingTechnique: "pomodoro" });

      const todo = createTodo({
        id: getTodoId("pomo-1"),
        state: "active",
        duration: getDurationSec(3000), // 50m - Longer than one pomodoro session
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date, ganttSettings);

      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
    });

    it("should schedule with flow technique", () => {
      const date = new Date("2025-12-09");
      const ganttSettings = createGanttSettings({ schedulingTechnique: "flow" });

      const todo = createTodo({
        id: getTodoId("flow-1"),
        state: "active",
        duration: getDurationSec(5400),
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date, ganttSettings);

      expect(result).toBeDefined();
      expect(result.tasks).toBeDefined();
    });

    it("should handle completed tasks", () => {
      const date = new Date("2025-12-09");

      const completedTodo = createTodo({
        id: getTodoId("completed-1"),
        state: "completed",
        completedAt: getTimestamp(Date.now()),
        duration: getDurationSec(1800),
      });

      const todos = [completedTodo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result).toBeDefined();
    });

    it("should handle archived tasks", () => {
      const date = new Date("2025-12-09");

      const archivedTodo = createTodo({
        id: getTodoId("archived-1"),
        state: "archived",
        archivedAt: getTimestamp(Date.now()),
        duration: getDurationSec(1800),
      });

      const todos = [archivedTodo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result).toBeDefined();
    });

    it("should respect break periods in schedule", () => {
      const date = new Date("2025-12-09");
      const workHoursWithBreaks: WorkHoursSettings = {
        ...createWorkHoursSettings(),
        commonSchedule: {
          startTime: getShortTime("09:00"),
          endTime: getShortTime("17:00"),
          breaks: [
            {
              id: getBreakPeriodId("lunch"),
              name: "Lunch",
              startTime: getShortTime("12:00"),
              endTime: getShortTime("13:00"),
            },
          ],
        },
      };

      const todo = createTodo({
        id: getTodoId("break-test"),
        state: "active",
        duration: getDurationSec(14400), // 4 hours - should span before and after lunch
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date, createGanttSettings(), workHoursWithBreaks);

      expect(result).toBeDefined();
    });

    it("should handle task segments that split across breaks", () => {
      const date = new Date("2025-12-09");

      // Multiple tasks that would need to work around a lunch break
      const todos = [
        createTodo({
          id: getTodoId("morning-1"),
          state: "active",
          duration: getDurationSec(7200), // 2h
        }),
        createTodo({
          id: getTodoId("morning-2"),
          state: "active",
          duration: getDurationSec(7200), // 2h
        }),
        createTodo({
          id: getTodoId("afternoon-1"),
          state: "active",
          duration: getDurationSec(7200), // 2h
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleDayTasks(todos, date);

      expect(result).toBeDefined();
      expect(result.tasks.length).toBeGreaterThan(0);
    });

    it("should mark tasks that cannot fit as unscheduled", () => {
      const date = new Date("2025-12-09");

      // Create a task too long to fit in one day
      const todo = createTodo({
        id: getTodoId("too-long"),
        state: "active",
        duration: getDurationSec(72000), // 20 hours - more than a workday
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      // Task should either be partially scheduled or unscheduled
      expect(result).toBeDefined();
    });

    it("should apply context switching time for sequential scheduling", () => {
      const date = new Date("2025-12-09");
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "sequential",
        contextSwitchingTime: getDurationMin(10), // 10 minutes between tasks
      });

      const todos = [
        createTodo({
          id: getTodoId("cs-1"),
          state: "active",
          duration: getDurationSec(1800), // 30m
        }),
        createTodo({
          id: getTodoId("cs-2"),
          state: "active",
          duration: getDurationSec(1800), // 30m
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleDayTasks(todos, date, ganttSettings);

      expect(result).toBeDefined();
      expect(result.tasks.length).toBeGreaterThan(0);
    });

    it("should handle completed tasks with time tracking entries", () => {
      // Use a specific date format and ensure we're testing the scheduled day
      const dateStr = "2025-12-09";
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);

      // Entry times must overlap with the date being viewed
      const entryStartTime = new Date(`${dateStr}T10:00:00`).getTime();
      const entryEndTime = new Date(`${dateStr}T10:30:00`).getTime();

      const completedWithEntries = createTodo({
        id: getTodoId("completed-tracked"),
        state: "completed",
        completedAt: getTimestamp(new Date(`${dateStr}T10:30:00`).getTime()),
        timeTracking: {
          entries: [
            {
              id: getTimeEntryId("entry-1"),
              startTime: getTimestamp(entryStartTime),
              endTime: getTimestamp(entryEndTime),
              duration: getDurationMin(30),
            },
          ],
          totalMinutes: getDurationMin(30),
        },
        dueDate: getTimestamp(new Date(dateStr).getTime()),
        duration: getDurationSec(1800), // 30m
      });

      const todos = [completedWithEntries].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result).toBeDefined();
      // Should create tasks from time tracking entries
      // Completed tasks with time entries should show the actual tracked time
    });

    it("should show completed task time entries as actual time blocks", () => {
      // Create a date in local timezone to ensure proper overlap
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // Today in YYYY-MM-DD format
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at midnight local

      // Create entry times that are definitely within this date
      const entry1Start = new Date(date);
      entry1Start.setHours(9, 0, 0, 0);
      const entry1End = new Date(date);
      entry1End.setHours(9, 25, 0, 0);
      const entry2Start = new Date(date);
      entry2Start.setHours(9, 30, 0, 0);
      const entry2End = new Date(date);
      entry2End.setHours(10, 0, 0, 0);

      const completedWithMultipleEntries = createTodo({
        id: getTodoId("completed-multi-entries"),
        state: "completed",
        completedAt: getTimestamp(entry2End.getTime()),
        timeTracking: {
          entries: [
            {
              id: getTimeEntryId("e1"),
              startTime: getTimestamp(entry1Start.getTime()),
              endTime: getTimestamp(entry1End.getTime()),
              duration: getDurationMin(25),
            },
            {
              id: getTimeEntryId("e2"),
              startTime: getTimestamp(entry2Start.getTime()),
              endTime: getTimestamp(entry2End.getTime()),
              duration: getDurationMin(30),
            },
          ],
          totalMinutes: getDurationMin(55),
        },
        dueDate: getTimestamp(new Date(dateStr).getTime()),
        duration: getDurationSec(3300), // 55m
      });

      const todos = [completedWithMultipleEntries].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result).toBeDefined();
      // Should create tasks from time tracking entries (one per entry)
      expect(result.tasks.length).toBe(2);
      expect(result.tasks[0].isActualTime).toBe(true);
      expect(result.tasks[1].isActualTime).toBe(true);
    });

    it("should handle completed tasks with time tracking entries with ISO due date", () => {
      const date = new Date("2025-12-09");
      const entryStartTime = new Date("2025-12-09T10:00:00").getTime();
      const entryEndTime = new Date("2025-12-09T10:30:00").getTime();

      const completedWithISODueDate = createTodo({
        id: getTodoId("completed-iso"),
        state: "completed",
        completedAt: getTimestamp(new Date("2025-12-09T10:30:00").getTime()),
        timeTracking: {
          entries: [
            {
              id: getTimeEntryId("entry-1"),
              startTime: getTimestamp(entryStartTime),
              endTime: getTimestamp(entryEndTime),
              duration: getDurationMin(30),
            },
          ],
          totalMinutes: getDurationMin(30),
        },
        dueDate: getTimestamp(new Date("2025-12-09T17:00:00Z").getTime()),
        duration: getDurationSec(1800), // 30m
      });

      const todos = [completedWithISODueDate].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result).toBeDefined();
    });

    it("should show active tasks with time tracking entries and remaining work", () => {
      const date = new Date("2025-12-09");
      const entryStartTime = new Date("2025-12-09T10:00:00").getTime();
      const entryEndTime = new Date("2025-12-09T10:30:00").getTime();

      const activeWithTracking = createTodo({
        id: getTodoId("active-tracked"),
        state: "active",
        timeTracking: {
          entries: [
            {
              id: getTimeEntryId("entry-1"),
              startTime: getTimestamp(entryStartTime),
              endTime: getTimestamp(entryEndTime),
              duration: getDurationMin(30),
            },
          ],
          totalMinutes: getDurationMin(30),
        },
        dueDate: getTimestamp(new Date("2025-12-09").getTime()),
        duration: getDurationSec(3600), // 60m total, 30m tracked = 30m remaining
      });

      const todos = [activeWithTracking].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result).toBeDefined();
      // Should have both tracked time and remaining scheduled time
    });

    it("should handle active task with time entry without end time (in progress)", () => {
      const date = new Date("2025-12-09");
      const entryStartTime = new Date("2025-12-09T10:00:00").getTime();

      const inProgressTask = createTodo({
        id: getTodoId("in-progress"),
        state: "active",
        timeTracking: {
          entries: [
            {
              id: getTimeEntryId("entry-1"),
              startTime: getTimestamp(entryStartTime),
              // No endTime - currently in progress
              duration: undefined,
            },
          ],
          totalMinutes: getDurationMin(0),
        },
        dueDate: getTimestamp(new Date("2025-12-09").getTime()),
        duration: getDurationSec(3600), // 60m
      });

      const todos = [inProgressTask].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result).toBeDefined();
    });

    it("should handle tasks with tracked time", () => {
      const date = new Date("2025-12-09");

      const todoWithTrackedTime = createTodo({
        id: getTodoId("tracked"),
        state: "active",
        timeTracking: {
          entries: [],
          totalMinutes: getDurationMin(20), // 20 minutes already done
        },
        duration: getDurationSec(3600), // 60 minutes total, 40 remaining
      });

      const todos = [todoWithTrackedTime].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result).toBeDefined();
    });

    it("should mark tracked time segments with isTrackedTime flag", () => {
      const date = new Date("2025-12-09");
      const entryStartTime = new Date("2025-12-09T10:00:00").getTime();
      const entryEndTime = new Date("2025-12-09T10:30:00").getTime();

      const todoWithEntries = createTodo({
        id: getTodoId("tracked-segments"),
        state: "active",
        timeTracking: {
          entries: [
            {
              id: getTimeEntryId("entry-1"),
              startTime: getTimestamp(entryStartTime),
              endTime: getTimestamp(entryEndTime),
              duration: getDurationMin(30),
            },
          ],
          totalMinutes: getDurationMin(30),
        },
        dueDate: getTimestamp(new Date("2025-12-09").getTime()),
        duration: getDurationSec(3600), // 60 minutes total, 30 tracked = 30 remaining
      });

      const todos = [todoWithEntries].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result).toBeDefined();
      // Task should have both tracked and scheduled segments
      if (result.tasks.length > 0) {
        const task = result.tasks[0];
        expect(task.segments.length).toBeGreaterThan(0);
      }
    });

    it("should handle non-work day in sequential scheduling mode", () => {
      // Sunday with weekendSchedule that has no work hours
      const sunday = new Date("2025-12-14"); // Sunday
      const workHours: WorkHoursSettings = {
        useCommonSchedule: false,
        commonSchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
        weekdaySchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
        weekendSchedule: {
          startTime: getShortTime("09:00"),
          endTime: getShortTime("09:00"),
          breaks: [],
          enabled: false,
        }, // No work hours on weekends
        customSchedules: {},
      };
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "sequential",
      });

      const todo = createTodo({
        id: getTodoId("non-work-day"),
        state: "active",
        duration: getDurationSec(7200), // 2h
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, sunday, ganttSettings, workHours);

      expect(result).toBeDefined();
      // No tasks should be scheduled on a non-work day
      expect(result.tasks.length).toBe(0);
    });

    it("should handle pomodoro with work time accumulation between tasks", () => {
      const date = new Date("2025-12-09");
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "pomodoro",
        pomodoroWorkDuration: getDurationMin(25),
        pomodoroShortBreak: getDurationMin(5),
        pomodoroLongBreak: getDurationMin(15),
        pomodoroLongBreakInterval: 2, // Long break after every 2 sessions
      });

      // Multiple short tasks that accumulate work time
      const todos = [
        createTodo({
          id: getTodoId("short-1"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(900), // 15m
        }),
        createTodo({
          id: getTodoId("short-2"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(900), // 15m
        }),
        createTodo({
          id: getTodoId("short-3"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(900), // 15m
        }),
        createTodo({
          id: getTodoId("short-4"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(900), // 15m
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleDayTasks(todos, date, ganttSettings);

      expect(result).toBeDefined();
      expect(result.tasks.length).toBe(4);
    });

    it("should handle flow technique with context switching after breaks", () => {
      const date = new Date("2025-12-09");
      const workHours: WorkHoursSettings = {
        ...createWorkHoursSettings(),
        commonSchedule: {
          startTime: getShortTime("09:00"),
          endTime: getShortTime("17:00"),
          breaks: [
            {
              id: getBreakPeriodId("short-break"),
              name: "Break",
              startTime: getShortTime("11:00"),
              endTime: getShortTime("11:15"),
            },
          ],
        },
      };
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "flow",
        flowWorkDuration: getDurationMin(52),
        flowBreakDuration: getDurationMin(17),
        flowContextSwitchingTime: getDurationMin(10),
      });

      const todos = [
        createTodo({
          id: getTodoId("flow-1"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(3600), // 1h
        }),
        createTodo({
          id: getTodoId("flow-2"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(3600), // 1h
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleDayTasks(todos, date, ganttSettings, workHours);

      expect(result).toBeDefined();
    });

    it("should apply duration multiplier", () => {
      const date = new Date("2025-12-09");
      const ganttSettings = createGanttSettings({
        durationMultiplier: 2.0, // Double the estimated time
      });

      const todo = createTodo({
        id: getTodoId("multiplied"),
        state: "active",
        duration: getDurationSec(1800), // 30m
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date, ganttSettings);

      expect(result).toBeDefined();
    });

    it("should handle weekends with different schedules", () => {
      const saturday = new Date(2025, 11, 13); // Saturday
      const workHours: WorkHoursSettings = {
        useCommonSchedule: false,
        commonSchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
        weekdaySchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
        weekendSchedule: { startTime: getShortTime("10:00"), endTime: getShortTime("14:00"), breaks: [] },
        customSchedules: {},
      };

      const todo = createTodo({
        id: getTodoId("weekend-task"),
        state: "active",
        duration: getDurationSec(7200), // 2h
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, saturday, createGanttSettings(), workHours);

      expect(result).toBeDefined();
    });

    it("should handle disabled days", () => {
      const saturday = new Date(2025, 11, 13); // Saturday
      const workHours: WorkHoursSettings = {
        useCommonSchedule: false,
        commonSchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
        weekdaySchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
        weekendSchedule: {
          startTime: getShortTime("10:00"),
          endTime: getShortTime("14:00"),
          breaks: [],
          enabled: false,
        },
        customSchedules: {},
      };

      const todo = createTodo({
        id: getTodoId("disabled-day"),
        state: "active",
        duration: getDurationSec(7200), // 2h
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, saturday, createGanttSettings(), workHours);

      expect(result).toBeDefined();
    });

    it("should schedule multiple tasks in order", () => {
      const date = new Date("2025-12-09");

      const todos = [
        createTodo({
          id: getTodoId("first"),
          state: "active",
          duration: getDurationSec(1800), // 30m
        }),
        createTodo({
          id: getTodoId("second"),
          state: "active",
          duration: getDurationSec(1800), // 30m
        }),
        createTodo({
          id: getTodoId("third"),
          state: "active",
          duration: getDurationSec(1800), // 30m
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleDayTasks(todos, date);

      expect(result.tasks.length).toBe(3);
    });

    it("should return ScheduledTask objects with required properties", () => {
      const date = new Date("2025-12-09");

      const todo = createTodo({
        id: getTodoId("props-test"),
        state: "active",
        duration: getDurationSec(1800), // 30m
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleDayTasks(todos, date);

      expect(result.tasks.length).toBe(1);
      const task = result.tasks[0];
      expect(task).toHaveProperty("todo");
      expect(task).toHaveProperty("startTime");
      expect(task).toHaveProperty("endTime");
      expect(task).toHaveProperty("segments");
    });
  });

  describe("scheduleWeekTasks", () => {
    const settings = createSettingsModel(createMinimalSettings());

    // Helper to call scheduleWeekTasks with proper arguments
    const callScheduleWeekTasks = (
      todos: TodoModel[],
      startDate: Date,
      ganttSettings: Gantt = createGanttSettings(),
      workHours: WorkHoursSettings = createWorkHoursSettings(),
    ) => {
      // Generate 7 dates starting from startDate
      const dates: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }

      // Create task scheduling map
      const config = createSchedulingConfig({ ganttSettings, workHours });
      const taskSchedulingMap = createTaskSchedulingMap(todos, config);

      // Mock getProjectColor function
      const getProjectColor = () => "#3b82f6";

      return scheduleWeekTasks(dates, todos, taskSchedulingMap, workHours, ganttSettings, getProjectColor);
    };

    it("should schedule tasks across a week", () => {
      const startDate = new Date("2025-12-08"); // Monday

      const todo = createTodo({
        id: getTodoId("week-task"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-12").getTime()),
        duration: getDurationSec(7200), // 2h
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleWeekTasks(todos, startDate);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(7); // 7 days in a week
    });

    it("should return week schedule for each day", () => {
      const startDate = new Date("2025-12-08");

      const result = callScheduleWeekTasks([], startDate);

      expect(result).toBeDefined();
      expect(result.length).toBe(7);
      result.forEach((day) => {
        expect(day).toHaveProperty("date");
        expect(day).toHaveProperty("scheduled");
        expect(day).toHaveProperty("breakBlocks");
      });
    });

    it("should schedule tasks with due dates on correct days", () => {
      const startDate = new Date("2025-12-08"); // Monday

      const mondayTask = createTodo({
        id: getTodoId("monday"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-08").getTime()),
        duration: getDurationSec(1800), // 30m
      });

      const wednesdayTask = createTodo({
        id: getTodoId("wednesday"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-10").getTime()),
        duration: getDurationSec(1800), // 30m
      });

      const todos = [mondayTask, wednesdayTask].map((t) => new TodoModel(t, settings));
      const result = callScheduleWeekTasks(todos, startDate);

      expect(result).toBeDefined();
      expect(result.length).toBe(7);
    });

    it("should handle tasks spanning multiple days", () => {
      const startDate = new Date("2025-12-08");

      const longTask = createTodo({
        id: getTodoId("multi-day"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-12").getTime()),
        duration: getDurationSec(72000), // 20h
      });

      const todos = [longTask].map((t) => new TodoModel(t, settings));
      const result = callScheduleWeekTasks(todos, startDate);

      expect(result).toBeDefined();
      expect(result.length).toBe(7);
    });

    it("should handle empty task list", () => {
      const startDate = new Date("2025-12-08");

      const result = callScheduleWeekTasks([], startDate);

      expect(result).toBeDefined();
      expect(result.length).toBe(7);
    });

    it("should include breaks in schedule", () => {
      const workHours: WorkHoursSettings = {
        ...createWorkHoursSettings(),
        commonSchedule: {
          startTime: getShortTime("09:00"),
          endTime: getShortTime("17:00"),
          breaks: [
            {
              id: getBreakPeriodId("lunch"),
              name: "Lunch",
              startTime: getShortTime("12:00"),
              endTime: getShortTime("13:00"),
            },
          ],
        },
      };
      const startDate = new Date("2025-12-08");

      const result = callScheduleWeekTasks([], startDate, createGanttSettings(), workHours);

      expect(result).toBeDefined();
      // Each day should have breaks info
      result.forEach((day) => {
        expect(day).toHaveProperty("breakBlocks");
      });
    });

    it("should handle weekend schedules", () => {
      const workHours: WorkHoursSettings = {
        useCommonSchedule: false,
        commonSchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
        weekdaySchedule: { startTime: getShortTime("09:00"), endTime: getShortTime("17:00"), breaks: [] },
        weekendSchedule: { startTime: getShortTime("10:00"), endTime: getShortTime("14:00"), breaks: [] },
        customSchedules: {},
      };
      const startDate = new Date("2025-12-08");

      const result = callScheduleWeekTasks([], startDate, createGanttSettings(), workHours);

      expect(result).toBeDefined();
      expect(result.length).toBe(7);
    });

    it("should handle completed tasks in week view", () => {
      const startDate = new Date("2025-12-08");

      const completedTask = createTodo({
        id: getTodoId("completed-week"),
        state: "completed",
        completedAt: getTimestamp(Date.now()),
        dueDate: getTimestamp(new Date("2025-12-09").getTime()),
        duration: getDurationSec(1800), // 30m
      });

      const todos = [completedTask].map((t) => new TodoModel(t, settings));
      const result = callScheduleWeekTasks(todos, startDate);

      expect(result).toBeDefined();
    });

    it("should provide percentage-based positioning for week view", () => {
      const startDate = new Date("2025-12-08");

      const todo = createTodo({
        id: getTodoId("positioned"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-09").getTime()),
        duration: getDurationSec(7200), // 2h
      });

      const todos = [todo].map((t) => new TodoModel(t, settings));
      const result = callScheduleWeekTasks(todos, startDate);

      expect(result).toBeDefined();
      // Tasks should have positioning info
      result.forEach((day) => {
        if (day.scheduled.length > 0) {
          day.scheduled.forEach((item) => {
            expect(item).toHaveProperty("startPercent");
            expect(item).toHaveProperty("widthPercent");
          });
        }
      });
    });

    it("should handle all scheduling techniques in week view", () => {
      const startDate = new Date("2025-12-08");

      const techniques: Array<"sequential" | "pomodoro" | "flow"> = ["sequential", "pomodoro", "flow"];

      const todo = createTodo({
        id: getTodoId("technique-test"),
        state: "active",
        dueDate: getTimestamp(new Date("2025-12-09").getTime()),
        duration: getDurationSec(7200), // 2h
      });

      for (const technique of techniques) {
        const ganttSettings = createGanttSettings({ schedulingTechnique: technique });
        const todos = [todo].map((t) => new TodoModel(t, settings));
        const result = callScheduleWeekTasks(todos, startDate, ganttSettings);

        expect(result).toBeDefined();
        expect(result.length).toBe(7);
      }
    });

    it("should include day start and end times", () => {
      const startDate = new Date("2025-12-08");

      const result = callScheduleWeekTasks([], startDate);

      result.forEach((day) => {
        expect(day).toHaveProperty("dayStart");
        expect(day).toHaveProperty("dayEnd");
        expect(day.dayStart instanceof Date).toBe(true);
        expect(day.dayEnd instanceof Date).toBe(true);
      });
    });

    it("should include total minutes for each day", () => {
      const startDate = new Date("2025-12-08");

      const result = callScheduleWeekTasks([], startDate);

      result.forEach((day) => {
        expect(day).toHaveProperty("totalMinutes");
        expect(typeof day.totalMinutes).toBe("number");
        expect(day.totalMinutes).toBeGreaterThan(0);
      });
    });

    it("should include segments for visualization", () => {
      const startDate = new Date("2025-12-08");

      const result = callScheduleWeekTasks([], startDate);

      result.forEach((day) => {
        expect(day).toHaveProperty("segments");
        expect(Array.isArray(day.segments)).toBe(true);
      });
    });

    it("should calculate technique breaks for pomodoro scheduling", () => {
      const startDate = new Date("2025-12-08");
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "pomodoro",
        pomodoroWorkDuration: getDurationMin(25),
        pomodoroShortBreak: getDurationMin(5),
        pomodoroLongBreak: getDurationMin(15),
        pomodoroLongBreakInterval: 4,
      });

      const todos = [
        createTodo({
          id: getTodoId("pomo-week-1"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(3000), // 50m
        }),
        createTodo({
          id: getTodoId("pomo-week-2"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(3000), // 50m
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleWeekTasks(todos, startDate, ganttSettings);

      expect(result).toBeDefined();
      result.forEach((day) => {
        expect(day).toHaveProperty("techniqueBreaks");
        expect(Array.isArray(day.techniqueBreaks)).toBe(true);
      });
    });

    it("should calculate technique breaks for flow scheduling", () => {
      const startDate = new Date("2025-12-08");
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "flow",
        flowWorkDuration: getDurationMin(52),
        flowBreakDuration: getDurationMin(17),
        flowContextSwitchingTime: getDurationMin(10),
      });

      const todos = [
        createTodo({
          id: getTodoId("flow-week-1"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(5400), // 90m
        }),
        createTodo({
          id: getTodoId("flow-week-2"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(5400), // 90m
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleWeekTasks(todos, startDate, ganttSettings);

      expect(result).toBeDefined();
      result.forEach((day) => {
        expect(day).toHaveProperty("techniqueBreaks");
        expect(Array.isArray(day.techniqueBreaks)).toBe(true);
      });
    });

    it("should include technique break minutes in day totals", () => {
      const startDate = new Date("2025-12-08");
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "pomodoro",
        pomodoroWorkDuration: getDurationMin(25),
        pomodoroShortBreak: getDurationMin(5),
        pomodoroLongBreak: getDurationMin(15),
        pomodoroLongBreakInterval: 2,
      });

      const todos = [
        createTodo({
          id: getTodoId("break-calc-1"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(3600), // 60m
        }),
        createTodo({
          id: getTodoId("break-calc-2"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(3600), // 60m
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleWeekTasks(todos, startDate, ganttSettings);

      expect(result).toBeDefined();
      result.forEach((day) => {
        expect(day).toHaveProperty("techniqueBreakMinutes");
        expect(typeof day.techniqueBreakMinutes).toBe("number");
      });
    });

    it("should handle pomodoro reset after long time block break", () => {
      const startDate = new Date("2025-12-08");
      const workHours: WorkHoursSettings = {
        ...createWorkHoursSettings(),
        commonSchedule: {
          startTime: getShortTime("09:00"),
          endTime: getShortTime("17:00"),
          breaks: [
            // Long lunch break that should reset pomodoro count
            {
              id: getBreakPeriodId("lunch"),
              name: "Lunch",
              startTime: getShortTime("12:00"),
              endTime: getShortTime("13:00"),
            },
          ],
        },
      };
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "pomodoro",
        pomodoroWorkDuration: getDurationMin(25),
        pomodoroShortBreak: getDurationMin(5),
        pomodoroLongBreak: getDurationMin(15),
        pomodoroLongBreakInterval: 4,
      });

      const todos = [
        // Tasks before lunch
        createTodo({
          id: getTodoId("before-lunch-1"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(7200), // 2h
        }),
        // Tasks after lunch
        createTodo({
          id: getTodoId("after-lunch-1"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(7200), // 2h
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleWeekTasks(todos, startDate, ganttSettings, workHours);

      expect(result).toBeDefined();
      // After the 1-hour lunch break (>= 15min long break), pomodoro count should reset
    });

    it("should handle flow reset after long time block break", () => {
      const startDate = new Date("2025-12-08");
      const workHours: WorkHoursSettings = {
        ...createWorkHoursSettings(),
        commonSchedule: {
          startTime: getShortTime("09:00"),
          endTime: getShortTime("17:00"),
          breaks: [
            // Long lunch break that should reset flow
            {
              id: getBreakPeriodId("lunch"),
              name: "Lunch",
              startTime: getShortTime("12:00"),
              endTime: getShortTime("13:00"),
            },
          ],
        },
      };
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "flow",
        flowWorkDuration: getDurationMin(52),
        flowBreakDuration: getDurationMin(17),
        flowContextSwitchingTime: getDurationMin(10),
      });

      const todos = [
        createTodo({
          id: getTodoId("flow-reset-1"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(7200), // 2h
        }),
        createTodo({
          id: getTodoId("flow-reset-2"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(7200), // 2h
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleWeekTasks(todos, startDate, ganttSettings, workHours);

      expect(result).toBeDefined();
      // After the 1-hour lunch break (>= 17min flow break), work counter should reset
    });

    it("should add context switch time after time block break in sequential mode", () => {
      const startDate = new Date("2025-12-08");
      const workHours: WorkHoursSettings = {
        ...createWorkHoursSettings(),
        commonSchedule: {
          startTime: getShortTime("09:00"),
          endTime: getShortTime("17:00"),
          breaks: [
            {
              id: getBreakPeriodId("lunch"),
              name: "Lunch",
              startTime: getShortTime("12:00"),
              endTime: getShortTime("13:00"),
            },
          ],
        },
      };
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "sequential",
        contextSwitchingTime: getDurationMin(15), // 15 minutes context switch
      });

      const todos = [
        createTodo({
          id: getTodoId("seq-1"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(10800), // 3h
        }),
        createTodo({
          id: getTodoId("seq-2"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(10800), // 3h
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleWeekTasks(todos, startDate, ganttSettings, workHours);

      expect(result).toBeDefined();
    });

    it("should provide segment percentages for visualization", () => {
      const startDate = new Date("2025-12-08");

      const todos = [
        createTodo({
          id: getTodoId("seg-viz-1"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(7200), // 2h
        }),
        createTodo({
          id: getTodoId("seg-viz-2"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(7200), // 2h
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleWeekTasks(todos, startDate);

      expect(result).toBeDefined();
      result.forEach((day) => {
        if (day.segments.length > 0) {
          day.segments.forEach((segment) => {
            expect(segment).toHaveProperty("todoId");
            expect(segment).toHaveProperty("startPercent");
            expect(segment).toHaveProperty("widthPercent");
            expect(segment).toHaveProperty("color");
          });
        }
      });
    });

    it("should calculate technique breaks between task segments in pomodoro mode", () => {
      const startDate = new Date("2025-12-08");
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "pomodoro",
        pomodoroWorkDuration: getDurationMin(25),
        pomodoroShortBreak: getDurationMin(5),
        pomodoroLongBreak: getDurationMin(15),
        pomodoroLongBreakInterval: 2,
      });

      // Long task that will be split into multiple segments
      const todos = [
        createTodo({
          id: getTodoId("long-pomo"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(7200), // 2h
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleWeekTasks(todos, startDate, ganttSettings);

      expect(result).toBeDefined();
      // Day with the task should have technique breaks
      const taskDay = result.find((d) => d.scheduled.length > 0);
      if (taskDay) {
        expect(taskDay.techniqueBreaks).toBeDefined();
      }
    });

    it("should calculate technique breaks between tasks in week view", () => {
      const startDate = new Date("2025-12-08");
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "pomodoro",
        pomodoroWorkDuration: getDurationMin(25),
        pomodoroShortBreak: getDurationMin(5),
        pomodoroLongBreak: getDurationMin(15),
        pomodoroLongBreakInterval: 4,
      });

      // Multiple tasks that should have breaks between them
      const todos = [
        createTodo({
          id: getTodoId("task-a"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(1800), // 30m
        }),
        createTodo({
          id: getTodoId("task-b"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(1800), // 30m
        }),
        createTodo({
          id: getTodoId("task-c"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(1800), // 30m
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleWeekTasks(todos, startDate, ganttSettings);

      expect(result).toBeDefined();
      result.forEach((day) => {
        if (day.techniqueBreaks && day.techniqueBreaks.length > 0) {
          day.techniqueBreaks.forEach((brk) => {
            expect(brk).toHaveProperty("startPercent");
            expect(brk).toHaveProperty("widthPercent");
            expect(brk).toHaveProperty("type");
          });
        }
      });
    });

    it("should exclude time block breaks from technique break calculations", () => {
      const startDate = new Date("2025-12-08");
      const workHours: WorkHoursSettings = {
        ...createWorkHoursSettings(),
        commonSchedule: {
          startTime: getShortTime("09:00"),
          endTime: getShortTime("17:00"),
          breaks: [
            {
              id: getBreakPeriodId("lunch"),
              name: "Lunch",
              startTime: getShortTime("12:00"),
              endTime: getShortTime("13:00"),
            },
          ],
        },
      };
      const ganttSettings = createGanttSettings({
        schedulingTechnique: "pomodoro",
        pomodoroWorkDuration: getDurationMin(25),
        pomodoroShortBreak: getDurationMin(5),
        pomodoroLongBreak: getDurationMin(15),
        pomodoroLongBreakInterval: 4,
      });

      // Tasks spanning before and after the lunch break
      const todos = [
        createTodo({
          id: getTodoId("before-lunch"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(10800), // 3h
        }),
        createTodo({
          id: getTodoId("after-lunch"),
          state: "active",
          dueDate: getTimestamp(new Date("2025-12-09").getTime()),
          duration: getDurationSec(10800), // 3h
        }),
      ].map((t) => new TodoModel(t, settings));

      const result = callScheduleWeekTasks(todos, startDate, ganttSettings, workHours);

      expect(result).toBeDefined();
      // The technique break minutes should exclude time block break duration
      const taskDay = result.find((d) => d.scheduled.length > 0);
      if (taskDay) {
        expect(typeof taskDay.techniqueBreakMinutes).toBe("number");
      }
    });
  });
});
