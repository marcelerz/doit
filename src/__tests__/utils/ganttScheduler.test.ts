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
} from "@/utils/ganttScheduler";
import { WorkHoursSettings, Gantt, Priority, DaySchedule } from "@/types/settings";
import { TodoModel } from "@/models/TodoModel";
import { Todo } from "@/types/todo";
import { Settings } from "@/types/settings";

// Helper to create minimal settings for TodoModel
const createMinimalSettings = (): Settings => ({
  priorities: [],
  linkPatterns: [],
  markerColors: {
    assigned: "#cce5ff",
    source: "#fff3cd",
    mentioned: "#ffe8cc",
    project: "#e2ccff",
    tag: "#d4edda",
    dueDate: "#f8d7da",
    duration: "#e2e3e5",
    recurring: "#cff4fc",
    dependency: "#ffcccc",
    priority: "#ffcccc",
  },
  general: { archiveDays: 7, autoDelete: false },
  dateTime: {
    morning: "09:00",
    noon: "12:00",
    afternoon: "14:00",
    evening: "18:00",
    workWeekStart: 1,
    fiscalYearStart: 1,
  },
  workHours: {
    useCommonSchedule: true,
    commonSchedule: { startTime: "09:00", endTime: "17:00", breaks: [] },
    weekdaySchedule: { startTime: "09:00", endTime: "17:00", breaks: [] },
    weekendSchedule: { startTime: "10:00", endTime: "14:00", breaks: [] },
    customSchedules: {},
  },
  gantt: {
    schedulingTechnique: "sequential",
    defaultTaskDuration: 30,
    durationMultiplier: 1.0,
    contextSwitchingTime: 5,
    pomodoroWorkDuration: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroLongBreakInterval: 4,
    flowWorkDuration: 52,
    flowBreakDuration: 17,
    flowContextSwitchingTime: 10,
  },
  kanban: {
    workflowStates: [],
    transitions: {},
    views: [],
    defaultViewId: undefined,
    displayOptions: { showEmptyColumns: true, showTaskCount: true },
  },
  sprints: { sprints: [], defaultDuration: 14 },
  autoAssign: { enabled: false },
  calendar: { showWeekNumbers: false, startOnMonday: true },
  focus: {
    enabled: false,
    defaultDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
  },
  categories: { categories: [] },
  timeTracking: { enabled: false, autoStartOnFocus: false, autoStopOnComplete: false },
});

// Helper to create minimal WorkHoursSettings
const createWorkHoursSettings = (): WorkHoursSettings => ({
  useCommonSchedule: true,
  commonSchedule: {
    startTime: "09:00",
    endTime: "17:00",
    breaks: [{ name: "Lunch", startTime: "12:00", endTime: "13:00" }],
  },
  weekdaySchedule: { startTime: "09:00", endTime: "17:00", breaks: [] },
  weekendSchedule: { startTime: "10:00", endTime: "14:00", breaks: [] },
  customSchedules: {},
});

// Helper to create minimal Gantt settings
const createGanttSettings = (): Gantt => ({
  schedulingTechnique: "sequential",
  defaultTaskDuration: 30,
  durationMultiplier: 1.0,
  contextSwitchingTime: 5,
  pomodoroWorkDuration: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroLongBreakInterval: 4,
  flowWorkDuration: 52,
  flowBreakDuration: 17,
  flowContextSwitchingTime: 10,
});

// Helper to create a minimal Todo
const createTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: overrides.id || `todo-${Date.now()}`,
  text: overrides.text || "Test todo",
  plainText: overrides.plainText || "Test todo",
  state: overrides.state || "active",
  createdAt: overrides.createdAt || Date.now(),
  metadata: {
    assignedPeople: [],
    sourcePeople: [],
    mentionedPeople: [],
    projects: [],
    tags: [],
    dependencies: [],
    ...overrides.metadata,
  },
  comments: [],
  activity: [],
  ...overrides,
});

describe("ganttScheduler", () => {
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
        commonSchedule: { startTime: "09:00", endTime: "17:00", breaks: [] },
        weekdaySchedule: { startTime: "08:00", endTime: "16:00", breaks: [] },
        weekendSchedule: { startTime: "10:00", endTime: "14:00", breaks: [] },
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
        commonSchedule: { startTime: "09:00", endTime: "17:00", breaks: [] },
        weekdaySchedule: { startTime: "08:00", endTime: "16:00", breaks: [] },
        weekendSchedule: { startTime: "10:00", endTime: "14:00", breaks: [] },
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
        startTime: "10:00",
        endTime: "15:00",
        breaks: [],
      };
      const workHours: WorkHoursSettings = {
        useCommonSchedule: false,
        commonSchedule: { startTime: "09:00", endTime: "17:00", breaks: [] },
        weekdaySchedule: { startTime: "08:00", endTime: "16:00", breaks: [] },
        weekendSchedule: { startTime: "10:00", endTime: "14:00", breaks: [] },
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
        pomodoroShortBreak: 3,
        pomodoroLongBreak: 10,
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
    const settings = createMinimalSettings();
    const priorities: Priority[] = [
      { id: "1", name: "urgent", alternatives: ["critical"], order: 1, color: "#ff0000", comments: [], activity: [] },
      { id: "2", name: "high", alternatives: ["important"], order: 2, color: "#ff6600", comments: [], activity: [] },
      { id: "3", name: "medium", alternatives: [], order: 3, color: "#ffcc00", comments: [], activity: [] },
      { id: "4", name: "low", alternatives: [], order: 4, color: "#00cc00", comments: [], activity: [] },
    ];

    it("should sort active tasks before completed/archived in ASAP mode", () => {
      const activeTodo = createTodo({ id: "1", state: "active" });
      const completedTodo = createTodo({ id: "2", state: "completed", completedAt: Date.now() });
      const archivedTodo = createTodo({ id: "3", state: "archived", archivedAt: Date.now() });

      const todos = [completedTodo, archivedTodo, activeTodo].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "asap");

      expect(sorted[0].id).toBe("1"); // Active first
    });

    it("should sort by priority within active tasks in ASAP mode", () => {
      const urgentTodo = createTodo({
        id: "urgent",
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          priority: "urgent",
        },
      });
      const lowTodo = createTodo({
        id: "low",
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          priority: "low",
        },
      });
      const mediumTodo = createTodo({
        id: "medium",
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          priority: "medium",
        },
      });

      const todos = [lowTodo, mediumTodo, urgentTodo].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "asap");

      expect(sorted[0].id).toBe("urgent");
      expect(sorted[1].id).toBe("medium");
      expect(sorted[2].id).toBe("low");
    });

    it("should sort by due date in dueDate mode", () => {
      const earlyTodo = createTodo({
        id: "early",
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: "2025-12-10",
        },
      });
      const lateTodo = createTodo({
        id: "late",
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: "2025-12-20",
        },
      });
      const middleTodo = createTodo({
        id: "middle",
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: "2025-12-15",
        },
      });

      const todos = [lateTodo, earlyTodo, middleTodo].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "dueDate");

      expect(sorted[0].id).toBe("early");
      expect(sorted[1].id).toBe("middle");
      expect(sorted[2].id).toBe("late");
    });

    it("should put todos without due dates last in dueDate mode", () => {
      const withDate = createTodo({
        id: "with-date",
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: "2025-12-10",
        },
      });
      const withoutDate = createTodo({
        id: "without-date",
        state: "active",
      });

      const todos = [withoutDate, withDate].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "dueDate");

      expect(sorted[0].id).toBe("with-date");
      expect(sorted[1].id).toBe("without-date");
    });

    it("should filter out deleted todos", () => {
      const activeTodo = createTodo({ id: "active", state: "active" });
      const deletedTodo = createTodo({ id: "deleted", state: "deleted", deletedAt: Date.now() });

      const todos = [activeTodo, deletedTodo].map((t) => new TodoModel(t, settings));

      const sorted = sortTodosForScheduling(todos, priorities, "asap");

      expect(sorted.length).toBe(1);
      expect(sorted[0].id).toBe("active");
    });
  });
});
