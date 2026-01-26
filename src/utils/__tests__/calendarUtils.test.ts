/**
 * Tests for Calendar View Utility Functions
 */

import {
  getWeekNumber,
  getDayHeaders,
  formatDateKey,
  getTodayKey,
  groupTodosByDate,
  countTodosWithoutDates,
  generateCalendarGrid,
  getWeekDays,
  getUpcomingAgendaTasks,
  sortTodosByField,
  getCalendarDotColorClass,
  getProjectColorForTodo,
  formatMonthYear,
  navigateMonth,
  isToday,
  isCurrentMonth,
} from "@/utils/calendarUtils";
import { createTestTodo, resetSettingsModel_DONOTUSE } from "./testHelpers";
import { ProjectModel, createProjectModel } from "@/models/ProjectModel";
import { getProjectId } from "@/types/project";
import { getTodoId } from "@/types/todo";
import { getColor } from "@/types/types";

// Helper to create test project
function createTestProject(overrides: Partial<Parameters<typeof createProjectModel>[0]> = {}): ProjectModel {
  return createProjectModel({
    id: getProjectId(overrides.id || `project-${Date.now()}`),
    name: overrides.name || "Test Project",
    color: overrides.color || getColor("#6366f1"),
    alternatives: overrides.alternatives || [],
    ...overrides,
  });
}

describe("calendarUtils", () => {
  beforeEach(() => {
    resetSettingsModel_DONOTUSE();
  });

  describe("getWeekNumber", () => {
    it("should return week 1 for January 1st when it falls on a Thursday", () => {
      // Jan 1, 2026 is a Thursday
      const date = new Date(2026, 0, 1);
      expect(getWeekNumber(date)).toBe(1);
    });

    it("should return correct week for mid-year date", () => {
      // June 15, 2024 is in week 24
      const date = new Date(2024, 5, 15);
      expect(getWeekNumber(date)).toBe(24);
    });

    it("should handle year boundaries correctly", () => {
      // Dec 31, 2024 might be week 1 of 2025 depending on the day
      const date = new Date(2024, 11, 31);
      expect(getWeekNumber(date)).toBeGreaterThan(0);
    });
  });

  describe("getDayHeaders", () => {
    it("should return Sunday-first headers when weekStartDay is 0", () => {
      const headers = getDayHeaders(0);
      expect(headers[0]).toBe("Sun");
      expect(headers[6]).toBe("Sat");
    });

    it("should return Monday-first headers when weekStartDay is 1", () => {
      const headers = getDayHeaders(1);
      expect(headers[0]).toBe("Mon");
      expect(headers[6]).toBe("Sun");
    });
  });

  describe("formatDateKey", () => {
    it("should format date as YYYY-MM-DD", () => {
      const date = new Date(2024, 5, 15); // June 15, 2024
      expect(formatDateKey(date)).toBe("2024-06-15");
    });

    it("should pad single-digit months and days", () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      expect(formatDateKey(date)).toBe("2024-01-05");
    });
  });

  describe("getTodayKey", () => {
    it("should return today's date key", () => {
      const now = new Date(2024, 5, 15);
      expect(getTodayKey(now)).toBe("2024-06-15");
    });
  });

  describe("groupTodosByDate", () => {
    const todayKey = "2024-06-15";

    it("should group todos by their due date", () => {
      const todos = [
        createTestTodo({
          id: "1",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-15" }
        }),
        createTestTodo({
          id: "2",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-16" }
        }),
      ];

      const result = groupTodosByDate(todos, false, todayKey);

      expect(result.get("2024-06-15")).toHaveLength(1);
      expect(result.get("2024-06-16")).toHaveLength(1);
    });

    it("should add todos without dates to today when showWithoutDates is true", () => {
      const todos = [
        createTestTodo({ id: "1" }), // No due date
      ];

      const result = groupTodosByDate(todos, true, todayKey);

      expect(result.get(todayKey)).toHaveLength(1);
    });

    it("should not add todos without dates when showWithoutDates is false", () => {
      const todos = [
        createTestTodo({ id: "1" }), // No due date
      ];

      const result = groupTodosByDate(todos, false, todayKey);

      expect(result.has(todayKey)).toBe(false);
    });

    it("should skip deleted todos", () => {
      const todos = [
        createTestTodo({
          id: "1",
          state: "deleted",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-15" }
        }),
      ];

      const result = groupTodosByDate(todos, false, todayKey);

      expect(result.has("2024-06-15")).toBe(false);
    });
  });

  describe("countTodosWithoutDates", () => {
    it("should count todos without due dates", () => {
      const todos = [
        createTestTodo({ id: "1" }),
        createTestTodo({
          id: "2",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-15" }
        }),
        createTestTodo({ id: "3" }),
      ];

      expect(countTodosWithoutDates(todos)).toBe(2);
    });

    it("should skip deleted todos", () => {
      const todos = [
        createTestTodo({ id: "1" }),
        createTestTodo({ id: "2", state: "deleted" }),
      ];

      expect(countTodosWithoutDates(todos)).toBe(1);
    });
  });

  describe("generateCalendarGrid", () => {
    const today = new Date(2024, 5, 15); // June 15, 2024
    const currentMonth = new Date(2024, 5, 1); // June 2024

    it("should generate 42 days", () => {
      const todosByDate = new Map<string, TodoModel[]>();
      const grid = generateCalendarGrid(currentMonth, todosByDate, 0, today);

      expect(grid).toHaveLength(42);
    });

    it("should mark current month days correctly", () => {
      const todosByDate = new Map<string, TodoModel[]>();
      const grid = generateCalendarGrid(currentMonth, todosByDate, 0, today);

      // June 1 should be in current month
      const june1 = grid.find(d => d.dateKey === "2024-06-01");
      expect(june1?.isCurrentMonth).toBe(true);

      // Days from May should not be in current month
      const mayDay = grid.find(d => d.dateKey.startsWith("2024-05"));
      if (mayDay) {
        expect(mayDay.isCurrentMonth).toBe(false);
      }
    });

    it("should mark today correctly", () => {
      const todosByDate = new Map<string, TodoModel[]>();
      const grid = generateCalendarGrid(currentMonth, todosByDate, 0, today);

      const todayCell = grid.find(d => d.dateKey === "2024-06-15");
      expect(todayCell?.isToday).toBe(true);
    });

    it("should include todos for each day", () => {
      const todo = createTestTodo({
        metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-15" }
      });
      const todosByDate = new Map<string, TodoModel[]>([["2024-06-15", [todo]]]);
      const grid = generateCalendarGrid(currentMonth, todosByDate, 0, today);

      const day = grid.find(d => d.dateKey === "2024-06-15");
      expect(day?.todos).toHaveLength(1);
    });

    it("should calculate week numbers", () => {
      const todosByDate = new Map<string, TodoModel[]>();
      const grid = generateCalendarGrid(currentMonth, todosByDate, 0, today);

      // All days should have week numbers
      grid.forEach(day => {
        expect(day.weekNumber).toBeGreaterThan(0);
      });
    });
  });

  describe("getWeekDays", () => {
    const today = new Date(2024, 5, 15);
    const todosByDate = new Map<string, TodoModel[]>();

    it("should return 7 days", () => {
      const days = getWeekDays(today, 0, todosByDate, today);
      expect(days).toHaveLength(7);
    });

    it("should start on Sunday when weekStartDay is 0", () => {
      const days = getWeekDays(today, 0, todosByDate, today);
      expect(days[0].date.getDay()).toBe(0); // Sunday
    });

    it("should start on Monday when weekStartDay is 1", () => {
      const days = getWeekDays(today, 1, todosByDate, today);
      expect(days[0].date.getDay()).toBe(1); // Monday
    });

    it("should mark today correctly", () => {
      const days = getWeekDays(today, 0, todosByDate, today);
      const todayDay = days.find(d => formatDateKey(d.date) === formatDateKey(today));
      expect(todayDay?.isToday).toBe(true);
    });
  });

  describe("getUpcomingAgendaTasks", () => {
    const today = new Date(2024, 5, 15);

    it("should return days with todos", () => {
      const todo = createTestTodo({});
      const todosByDate = new Map<string, TodoModel[]>([
        ["2024-06-15", [todo]],
        ["2024-06-20", [todo]],
      ]);

      const agenda = getUpcomingAgendaTasks(todosByDate, 14, today);

      expect(agenda.length).toBeGreaterThanOrEqual(2);
    });

    it("should always include today even without todos", () => {
      const todosByDate = new Map<string, TodoModel[]>();

      const agenda = getUpcomingAgendaTasks(todosByDate, 14, today);

      expect(agenda).toHaveLength(1);
      expect(agenda[0].dateKey).toBe("2024-06-15");
    });

    it("should limit to specified days", () => {
      const todo = createTestTodo({});
      const todosByDate = new Map<string, TodoModel[]>([
        ["2024-06-30", [todo]], // Beyond 7 days
      ]);

      const agenda = getUpcomingAgendaTasks(todosByDate, 7, today);

      const hasJune30 = agenda.some(d => d.dateKey === "2024-06-30");
      expect(hasJune30).toBe(false);
    });
  });

  describe("sortTodosByField", () => {
    it("should sort by priority ascending", () => {
      // Use priority names that map to orders in DEFAULT_PRIORITIES
      // urgent=1, high=2, medium=3, low=4
      const todos = [
        createTestTodo({ id: "1", priority: "medium" }),   // order 3
        createTestTodo({ id: "2", priority: "urgent" }),   // order 1
        createTestTodo({ id: "3", priority: "high" }),     // order 2
      ];

      const result = sortTodosByField(todos, "priority", "asc");

      expect(result[0].priorityOrder).toBe(1);  // urgent
      expect(result[1].priorityOrder).toBe(2);  // high
      expect(result[2].priorityOrder).toBe(3);  // medium
    });

    it("should sort by duration", () => {
      const todos = [
        createTestTodo({
          id: "1",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], duration: "2h" }
        }),
        createTestTodo({
          id: "2",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], duration: "30m" }
        }),
      ];

      const result = sortTodosByField(todos, "duration", "asc");

      // 30m should come before 2h
      // durationMinutes may be undefined for parsed durations, so check order via ID
      expect(result[0].id).toBe(getTodoId("2")); // 30m
      expect(result[1].id).toBe(getTodoId("1")); // 2h
    });

    it("should sort by created date", () => {
      const todos = [
        createTestTodo({ id: "1", createdAt: 1000 }),
        createTestTodo({ id: "2", createdAt: 3000 }),
        createTestTodo({ id: "3", createdAt: 2000 }),
      ];

      // Descending order means newest first (highest timestamp)
      const result = sortTodosByField(todos, "created", "desc");

      expect(result[0].createdAt).toBe(3000);
      expect(result[1].createdAt).toBe(2000);
      expect(result[2].createdAt).toBe(1000);
    });
  });

  describe("getCalendarDotColorClass", () => {
    it("should return red for urgent priority (order 1)", () => {
      const todo = createTestTodo({ priority: "urgent" });
      expect(getCalendarDotColorClass(todo, "priority")).toBe("bg-red-500");
    });

    it("should return green for completed state", () => {
      const todo = createTestTodo({ state: "completed" });
      expect(getCalendarDotColorClass(todo, "state")).toBe("bg-green-500");
    });

    it("should return blue for active state", () => {
      const todo = createTestTodo({ state: "active" });
      expect(getCalendarDotColorClass(todo, "state")).toBe("bg-blue-500");
    });
  });

  describe("getProjectColorForTodo", () => {
    it("should return undefined when colorBy is not project", () => {
      const todo = createTestTodo({
        metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: ["Project A"] }
      });
      const projects: ProjectModel[] = [];

      expect(getProjectColorForTodo(todo, "state", projects)).toBeUndefined();
    });

    it("should return project color when found", () => {
      const todo = createTestTodo({
        metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: ["Project A"] }
      });
      const projects = [createTestProject({ name: "Project A", color: getColor("#ff0000") })];

      expect(getProjectColorForTodo(todo, "project", projects)).toBe("#ff0000");
    });

    it("should return undefined when project not found", () => {
      const todo = createTestTodo({
        metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: ["Unknown"] }
      });
      const projects = [createTestProject({ name: "Project A" })];

      expect(getProjectColorForTodo(todo, "project", projects)).toBeUndefined();
    });
  });

  describe("formatMonthYear", () => {
    it("should format date as month and year", () => {
      const date = new Date(2024, 5, 15); // June 2024
      expect(formatMonthYear(date)).toBe("June 2024");
    });
  });

  describe("navigateMonth", () => {
    it("should move forward one month", () => {
      const current = new Date(2024, 5, 15); // June
      const next = navigateMonth(current, 1);
      expect(next.getMonth()).toBe(6); // July
    });

    it("should move backward one month", () => {
      const current = new Date(2024, 5, 15); // June
      const prev = navigateMonth(current, -1);
      expect(prev.getMonth()).toBe(4); // May
    });

    it("should handle year boundary", () => {
      const current = new Date(2024, 11, 15); // December
      const next = navigateMonth(current, 1);
      expect(next.getMonth()).toBe(0); // January
      expect(next.getFullYear()).toBe(2025);
    });
  });

  describe("isToday", () => {
    it("should return true for same day", () => {
      const today = new Date(2024, 5, 15);
      const date = new Date(2024, 5, 15);
      expect(isToday(date, today)).toBe(true);
    });

    it("should return false for different day", () => {
      const today = new Date(2024, 5, 15);
      const date = new Date(2024, 5, 16);
      expect(isToday(date, today)).toBe(false);
    });
  });

  describe("isCurrentMonth", () => {
    it("should return true for same month", () => {
      const currentMonth = new Date(2024, 5, 1);
      const date = new Date(2024, 5, 15);
      expect(isCurrentMonth(date, currentMonth)).toBe(true);
    });

    it("should return false for different month", () => {
      const currentMonth = new Date(2024, 5, 1);
      const date = new Date(2024, 6, 15);
      expect(isCurrentMonth(date, currentMonth)).toBe(false);
    });
  });
});
