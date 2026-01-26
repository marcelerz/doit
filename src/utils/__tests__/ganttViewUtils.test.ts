/**
 * Tests for Gantt View Utility Functions
 */

import {
  parseDuration,
  detectTaskConflicts,
  calculateDayTimeStats,
  calculateDynamicTimeBounds,
  generateHourMarkers,
  calculateTimePosition,
  calculateZoomScale,
  getWeekDates,
  formatTimeDisplay,
  formatDurationDisplay,
  ScheduledTaskInfo,
  BreakBlock,
} from "@/utils/ganttViewUtils";
import { createTestTodo, resetSettingsModel_DONOTUSE } from "./testHelpers";
import { getTodoId } from "@/types/todo";
import { TodoModel } from "@/models/TodoModel";

// Helper to create scheduled task info
function createScheduledTask(
  todo: TodoModel,
  startTime: Date,
  durationMinutes: number,
  options: Partial<ScheduledTaskInfo> = {}
): ScheduledTaskInfo {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  return {
    todo,
    startTime,
    endTime,
    durationMinutes,
    segments: [{ durationMinutes }],
    ...options,
  };
}

describe("ganttViewUtils", () => {
  beforeEach(() => {
    resetSettingsModel_DONOTUSE();
  });

  describe("parseDuration", () => {
    it("should return default for undefined duration", () => {
      expect(parseDuration(undefined, 30)).toBe(30);
    });

    it("should parse minutes", () => {
      expect(parseDuration("45m", 30)).toBe(45);
      expect(parseDuration("45", 30)).toBe(45);
    });

    it("should parse hours", () => {
      expect(parseDuration("2h", 30)).toBe(120);
      expect(parseDuration("1.5h", 30)).toBe(90);
    });

    it("should parse days (8-hour days)", () => {
      expect(parseDuration("1d", 30)).toBe(480); // 8 * 60
      expect(parseDuration("0.5d", 30)).toBe(240); // 4 * 60
    });

    it("should return default for invalid duration", () => {
      expect(parseDuration("abc", 30)).toBe(30);
    });
  });

  describe("detectTaskConflicts", () => {
    const baseDate = new Date(2024, 5, 15, 9, 0);

    it("should return empty set for non-overlapping tasks", () => {
      const todo1 = createTestTodo({ id: "1" });
      const todo2 = createTestTodo({ id: "2" });
      const tasks = [
        createScheduledTask(todo1, new Date(baseDate.getTime()), 30),
        createScheduledTask(todo2, new Date(baseDate.getTime() + 30 * 60 * 1000), 30),
      ];

      const conflicts = detectTaskConflicts(tasks);
      expect(conflicts.size).toBe(0);
    });

    it("should detect overlapping tasks", () => {
      const todo1 = createTestTodo({ id: "1" });
      const todo2 = createTestTodo({ id: "2" });
      const tasks = [
        createScheduledTask(todo1, new Date(baseDate.getTime()), 60),
        createScheduledTask(todo2, new Date(baseDate.getTime() + 30 * 60 * 1000), 60),
      ];

      const conflicts = detectTaskConflicts(tasks);
      expect(conflicts.size).toBe(2);
      expect(conflicts.has(getTodoId("1"))).toBe(true);
      expect(conflicts.has(getTodoId("2"))).toBe(true);
    });

    it("should detect multiple conflicts", () => {
      const todo1 = createTestTodo({ id: "1" });
      const todo2 = createTestTodo({ id: "2" });
      const todo3 = createTestTodo({ id: "3" });
      const tasks = [
        createScheduledTask(todo1, new Date(baseDate.getTime()), 120),
        createScheduledTask(todo2, new Date(baseDate.getTime() + 30 * 60 * 1000), 60),
        createScheduledTask(todo3, new Date(baseDate.getTime() + 60 * 60 * 1000), 30),
      ];

      const conflicts = detectTaskConflicts(tasks);
      expect(conflicts.size).toBe(3);
    });
  });

  describe("calculateDayTimeStats", () => {
    const dayStart = new Date(2024, 5, 15, 9, 0);
    const dayEnd = new Date(2024, 5, 15, 17, 0);

    it("should calculate planned minutes", () => {
      const todo = createTestTodo({ id: "1" });
      const activeTasks = [createScheduledTask(todo, dayStart, 60)];

      const stats = calculateDayTimeStats(
        activeTasks,
        [],
        [],
        dayStart,
        dayEnd,
        new Set()
      );

      expect(stats.totalPlannedMinutes).toBe(60);
    });

    it("should calculate completed minutes", () => {
      const todo = createTestTodo({ id: "1", state: "completed" });
      const completedTasks = [createScheduledTask(todo, dayStart, 90)];

      const stats = calculateDayTimeStats(
        [],
        completedTasks,
        [],
        dayStart,
        dayEnd,
        new Set()
      );

      expect(stats.completedMinutes).toBe(90);
    });

    it("should calculate available minutes excluding breaks", () => {
      const breakBlocks: BreakBlock[] = [
        {
          name: "Lunch",
          startTime: new Date(2024, 5, 15, 12, 0),
          endTime: new Date(2024, 5, 15, 13, 0),
        },
      ];

      const stats = calculateDayTimeStats(
        [],
        [],
        breakBlocks,
        dayStart,
        dayEnd,
        new Set()
      );

      // 8 hours = 480 min, minus 1 hour lunch = 420 min
      expect(stats.availableMinutes).toBe(420);
    });

    it("should calculate technique break minutes", () => {
      const todo = createTestTodo({ id: "1" });
      const tasks = [
        createScheduledTask(todo, dayStart, 60, {
          nextBreak: { durationMinutes: 5 },
        }),
      ];

      const stats = calculateDayTimeStats(
        tasks,
        [],
        [],
        dayStart,
        dayEnd,
        new Set()
      );

      expect(stats.techniqueBreakMinutes).toBe(5);
    });

    it("should count conflicts", () => {
      const conflicts = new Set([getTodoId("1"), getTodoId("2")]);

      const stats = calculateDayTimeStats(
        [],
        [],
        [],
        dayStart,
        dayEnd,
        conflicts
      );

      expect(stats.conflictCount).toBe(2);
    });

    it("should calculate utilization percentage", () => {
      const todo = createTestTodo({ id: "1" });
      const activeTasks = [createScheduledTask(todo, dayStart, 240)]; // 4 hours

      const stats = calculateDayTimeStats(
        activeTasks,
        [],
        [],
        dayStart,
        dayEnd,
        new Set()
      );

      // 240 min / 480 min = 50%
      expect(stats.utilizationPercent).toBe(50);
    });
  });

  describe("calculateDynamicTimeBounds", () => {
    const selectedDate = new Date(2024, 5, 15);
    const scheduleStart = new Date(2024, 5, 15, 9, 0);
    const scheduleEnd = new Date(2024, 5, 15, 17, 0);

    it("should return schedule bounds when no completed tasks", () => {
      const todos: TodoModel[] = [];

      const bounds = calculateDynamicTimeBounds(
        todos,
        scheduleStart,
        scheduleEnd,
        selectedDate
      );

      expect(bounds.startTime.getHours()).toBe(9);
      expect(bounds.endTime.getHours()).toBe(17);
    });

    it("should expand start time for early completed tasks", () => {
      const earlyCompletion = new Date(2024, 5, 15, 7, 30);
      const todo = createTestTodo({
        id: "1",
        state: "completed",
        completedAt: earlyCompletion.getTime(),
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          duration: "30m"
        },
      });

      const bounds = calculateDynamicTimeBounds(
        [todo],
        scheduleStart,
        scheduleEnd,
        selectedDate
      );

      expect(bounds.startTime.getHours()).toBe(7);
    });

    it("should expand end time for late completed tasks", () => {
      const lateCompletion = new Date(2024, 5, 15, 19, 30);
      const todo = createTestTodo({
        id: "1",
        state: "completed",
        completedAt: lateCompletion.getTime(),
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          duration: "30m"
        },
      });

      const bounds = calculateDynamicTimeBounds(
        [todo],
        scheduleStart,
        scheduleEnd,
        selectedDate
      );

      expect(bounds.endTime.getHours()).toBe(20);
    });
  });

  describe("generateHourMarkers", () => {
    const startTime = new Date(2024, 5, 15, 9, 0);
    const endTime = new Date(2024, 5, 15, 17, 0);

    it("should generate hourly markers", () => {
      const markers = generateHourMarkers(startTime, endTime, 60);

      expect(markers.length).toBe(9); // 9:00 to 17:00
      expect(markers[0].getHours()).toBe(9);
      expect(markers[markers.length - 1].getHours()).toBe(17);
    });

    it("should generate 30-minute markers", () => {
      const markers = generateHourMarkers(startTime, endTime, 30);

      expect(markers.length).toBe(17); // 9:00, 9:30, 10:00... 17:00
    });

    it("should handle non-aligned start times", () => {
      const oddStart = new Date(2024, 5, 15, 9, 15);
      const markers = generateHourMarkers(oddStart, endTime, 60);

      // Should round to next hour (10:00)
      expect(markers[0].getHours()).toBe(10);
    });
  });

  describe("calculateTimePosition", () => {
    const startTime = new Date(2024, 5, 15, 9, 0);
    const totalMinutes = 480; // 8 hours

    it("should return 0 for start time", () => {
      expect(calculateTimePosition(startTime, startTime, totalMinutes)).toBe(0);
    });

    it("should return 50 for middle of day", () => {
      const middle = new Date(2024, 5, 15, 13, 0); // 4 hours into 8 hour day
      expect(calculateTimePosition(middle, startTime, totalMinutes)).toBe(50);
    });

    it("should return 100 for end of day", () => {
      const end = new Date(2024, 5, 15, 17, 0);
      expect(calculateTimePosition(end, startTime, totalMinutes)).toBe(100);
    });

    it("should clamp values to 0-100", () => {
      const before = new Date(2024, 5, 15, 8, 0);
      const after = new Date(2024, 5, 15, 18, 0);

      expect(calculateTimePosition(before, startTime, totalMinutes)).toBe(0);
      expect(calculateTimePosition(after, startTime, totalMinutes)).toBe(100);
    });
  });

  describe("calculateZoomScale", () => {
    it("should return full width for day view", () => {
      expect(calculateZoomScale("day", 100)).toBe(100);
    });

    it("should return compressed width for week view", () => {
      expect(calculateZoomScale("week", 100)).toBe(20);
    });
  });

  describe("getWeekDates", () => {
    it("should return 7 dates", () => {
      const date = new Date(2024, 5, 15);
      const dates = getWeekDates(date, 1);

      expect(dates).toHaveLength(7);
    });

    it("should start on Monday when weekStartDay is 1", () => {
      const date = new Date(2024, 5, 15); // Saturday
      const dates = getWeekDates(date, 1);

      expect(dates[0].getDay()).toBe(1); // Monday
    });

    it("should start on Sunday when weekStartDay is 0", () => {
      const date = new Date(2024, 5, 15);
      const dates = getWeekDates(date, 0);

      expect(dates[0].getDay()).toBe(0); // Sunday
    });
  });

  describe("formatTimeDisplay", () => {
    it("should format time correctly", () => {
      const time = new Date(2024, 5, 15, 14, 30);
      const result = formatTimeDisplay(time);

      expect(result).toMatch(/2:30/);
    });
  });

  describe("formatDurationDisplay", () => {
    it("should format minutes only", () => {
      expect(formatDurationDisplay(45)).toBe("45m");
    });

    it("should format hours only", () => {
      expect(formatDurationDisplay(120)).toBe("2h");
    });

    it("should format hours and minutes", () => {
      expect(formatDurationDisplay(90)).toBe("1h 30m");
    });
  });
});
