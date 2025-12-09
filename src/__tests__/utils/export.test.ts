/**
 * Tests for Export Utilities
 */

import {
  exportToMarkdown,
  exportToCSV,
  exportToJSON,
  getMimeType,
  getFileExtension,
  ExportFormat,
} from "@/utils/export";
import { TodoModel } from "@/models/TodoModel";
import { Todo, TodoState } from "@/types/todo";
import { Settings } from "@/types/settings";

describe("export", () => {
  // Helper to create a mock TodoModel
  const createMockTodo = (
    overrides: Partial<{
      id: string;
      text: string;
      plainText: string;
      state: TodoState;
      priority: string;
      dueDate: string;
      duration: string;
      assignedPeople: string[];
      projects: string[];
      tags: string[];
      createdAt: number;
      completedAt: number;
      comments: any[];
    }> = {},
  ): TodoModel => {
    const rawTodo: Todo = {
      id: overrides.id || `todo-${Date.now()}`,
      text: overrides.text || "Test todo",
      plainText: overrides.plainText || "Test todo",
      state: overrides.state || "active",
      createdAt: overrides.createdAt || Date.now(),
      completedAt: overrides.completedAt,
      metadata: {
        assignedPeople: overrides.assignedPeople || [],
        sourcePeople: [],
        mentionedPeople: [],
        projects: overrides.projects || [],
        dependencies: [],
        tags: overrides.tags || [],
        priority: overrides.priority,
        dueDate: overrides.dueDate,
        duration: overrides.duration,
      },
      comments: overrides.comments || [],
      activity: [],
    };

    const settings: Settings = {
      priorities: [],
      linkPatterns: [],
      markerColors: {
        assigned: "#000",
        source: "#000",
        mentioned: "#000",
        project: "#000",
        priority: "#000",
        dueDate: "#000",
        duration: "#000",
        recurring: "#000",
        dependency: "#000",
        tag: "#000",
      },
      general: { archiveDays: 30, autoDelete: false },
      dateTime: {
        morning: "09:00",
        noon: "12:00",
        afternoon: "14:00",
        evening: "18:00",
        workWeekStart: "monday",
        fiscalYearStart: "01-01",
      },
      workHours: {
        scheduleType: "common",
        common: { start: "09:00", end: "17:00", timeBlocks: [] },
        weekdayWeekend: {
          weekday: { start: "09:00", end: "17:00", timeBlocks: [] },
          weekend: { start: "10:00", end: "14:00", timeBlocks: [] },
        },
        individual: {},
      },
      gantt: {
        defaultTaskDuration: 30,
        durationMultiplier: 1,
        schedulingMode: "pomodoro",
        pomodoro: {
          workDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
        },
        flow: {
          workDuration: 52,
          breakDuration: 17,
          contextSwitchTime: 10,
        },
        sequential: {
          contextSwitchTime: 5,
        },
      },
      kanban: {
        workflowStates: [],
        transitions: {},
        views: [],
        showEmptyColumns: true,
        showTaskCount: true,
      },
      sprints: {
        sprints: [],
        defaultDuration: 14,
        showBacklogInSprint: false,
      },
      autoAssign: {},
      calendar: {},
      focus: { ambientSound: "", ambientVolume: 0.3 },
    };

    return new TodoModel(rawTodo, settings);
  };

  describe("exportToMarkdown", () => {
    it("should export with title and timestamp", () => {
      const todos: TodoModel[] = [];
      const result = exportToMarkdown(todos, "My Todos");

      expect(result).toContain("# My Todos");
      expect(result).toContain("Exported on");
    });

    it("should use default title if not provided", () => {
      const todos: TodoModel[] = [];
      const result = exportToMarkdown(todos);

      expect(result).toContain("# Todo List");
    });

    it("should group active tasks under Active Tasks section", () => {
      const todos = [createMockTodo({ plainText: "Active task", state: "active" })];

      const result = exportToMarkdown(todos);

      expect(result).toContain("## Active Tasks");
      expect(result).toContain("[ ] Active task");
    });

    it("should group completed tasks under Completed Tasks section", () => {
      const todos = [createMockTodo({ plainText: "Done task", state: "completed" })];

      const result = exportToMarkdown(todos);

      expect(result).toContain("## Completed Tasks");
      expect(result).toContain("[x] Done task");
    });

    it("should group archived tasks under Archived Tasks section", () => {
      const todos = [createMockTodo({ plainText: "Old task", state: "archived" })];

      const result = exportToMarkdown(todos);

      expect(result).toContain("## Archived Tasks");
      expect(result).toContain("[x] Old task");
    });

    it("should include metadata in parentheses", () => {
      const todos = [
        createMockTodo({
          plainText: "Task with metadata",
          state: "active",
          priority: "high",
          dueDate: "2025-12-15",
          assignedPeople: ["Alice", "Bob"],
          projects: ["Website"],
          tags: ["urgent"],
        }),
      ];

      const result = exportToMarkdown(todos);

      expect(result).toContain("Priority: high");
      expect(result).toContain("Due: 2025-12-15");
      expect(result).toContain("Assigned: Alice, Bob");
      expect(result).toContain("Project: Website");
      expect(result).toContain("Tags: urgent");
    });

    it("should not include metadata section if no metadata", () => {
      const todos = [createMockTodo({ plainText: "Simple task", state: "active" })];

      const result = exportToMarkdown(todos);

      expect(result).toContain("- [ ] Simple task");
      expect(result).not.toContain("*(");
    });

    it("should handle multiple todos in each section", () => {
      const todos = [
        createMockTodo({ plainText: "Active 1", state: "active" }),
        createMockTodo({ plainText: "Active 2", state: "active" }),
        createMockTodo({ plainText: "Completed 1", state: "completed" }),
      ];

      const result = exportToMarkdown(todos);

      expect(result).toContain("Active 1");
      expect(result).toContain("Active 2");
      expect(result).toContain("Completed 1");
    });
  });

  describe("exportToCSV", () => {
    it("should include header row", () => {
      const todos: TodoModel[] = [];
      const result = exportToCSV(todos);

      expect(result).toContain("Title");
      expect(result).toContain("Status");
      expect(result).toContain("Priority");
      expect(result).toContain("Due Date");
    });

    it("should export todo data", () => {
      const todos = [
        createMockTodo({
          plainText: "Test task",
          state: "active",
          priority: "high",
          dueDate: "2025-12-15",
          duration: "2h",
        }),
      ];

      const result = exportToCSV(todos);
      const lines = result.split("\n");

      expect(lines.length).toBeGreaterThan(1);
      expect(lines[1]).toContain("Test task");
      expect(lines[1]).toContain("active");
      expect(lines[1]).toContain("high");
      expect(lines[1]).toContain("2025-12-15");
      expect(lines[1]).toContain("2h");
    });

    it("should escape values with commas", () => {
      const todos = [createMockTodo({ plainText: "Task with, comma", state: "active" })];

      const result = exportToCSV(todos);

      expect(result).toContain('"Task with, comma"');
    });

    it("should escape values with quotes", () => {
      const todos = [createMockTodo({ plainText: 'Task with "quotes"', state: "active" })];

      const result = exportToCSV(todos);

      expect(result).toContain('"Task with ""quotes"""');
    });

    it("should join multiple assigned people with semicolons", () => {
      const todos = [
        createMockTodo({
          plainText: "Task",
          state: "active",
          assignedPeople: ["Alice", "Bob", "Charlie"],
        }),
      ];

      const result = exportToCSV(todos);

      expect(result).toContain("Alice; Bob; Charlie");
    });

    it("should include timestamps in ISO format", () => {
      const createdAt = new Date(2025, 11, 9, 10, 0, 0).getTime();
      const todos = [
        createMockTodo({
          plainText: "Task",
          state: "active",
          createdAt,
        }),
      ];

      const result = exportToCSV(todos);

      expect(result).toContain("2025-12");
    });
  });

  describe("exportToJSON", () => {
    it("should export valid JSON", () => {
      const todos = [createMockTodo({ plainText: "Task", state: "active" })];
      const result = exportToJSON(todos);

      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("should include todos array", () => {
      const todos = [createMockTodo({ plainText: "Task", state: "active" })];
      const result = exportToJSON(todos);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty("todos");
      expect(Array.isArray(parsed.todos)).toBe(true);
    });

    it("should include exportedAt timestamp", () => {
      const todos: TodoModel[] = [];
      const result = exportToJSON(todos);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty("exportedAt");
      expect(new Date(parsed.exportedAt).getTime()).toBeGreaterThan(0);
    });

    it("should export all todo properties", () => {
      const todos = [
        createMockTodo({
          id: "todo-123",
          text: "Full text with @Alice",
          plainText: "Full text",
          state: "active",
          priority: "high",
          dueDate: "2025-12-15",
          duration: "2h",
          assignedPeople: ["Alice"],
          projects: ["Website"],
          tags: ["urgent"],
        }),
      ];

      const result = exportToJSON(todos);
      const parsed = JSON.parse(result);
      const todo = parsed.todos[0];

      expect(todo.id).toBe("todo-123");
      expect(todo.title).toBe("Full text");
      expect(todo.fullText).toContain("@Alice");
      expect(todo.state).toBe("active");
      expect(todo.metadata.priority).toBe("high");
      expect(todo.metadata.dueDate).toBe("2025-12-15");
      expect(todo.metadata.duration).toBe("2h");
      expect(todo.metadata.assignedPeople).toContain("Alice");
      expect(todo.metadata.projects).toContain("Website");
      expect(todo.metadata.tags).toContain("urgent");
    });

    it("should include timestamps", () => {
      const createdAt = Date.now();
      const completedAt = createdAt + 1000;

      const todos = [
        createMockTodo({
          plainText: "Task",
          state: "completed",
          createdAt,
          completedAt,
        }),
      ];

      const result = exportToJSON(todos);
      const parsed = JSON.parse(result);
      const todo = parsed.todos[0];

      expect(todo.timestamps.created).toBe(createdAt);
      expect(todo.timestamps.completed).toBe(completedAt);
    });

    it("should include comments count", () => {
      const todos = [
        createMockTodo({
          plainText: "Task",
          state: "active",
          comments: [
            { commentId: 1, history: [{ date: Date.now(), content: "Comment" }] },
            { commentId: 2, history: [{ date: Date.now(), content: "Another" }] },
          ],
        }),
      ];

      const result = exportToJSON(todos);
      const parsed = JSON.parse(result);

      expect(parsed.todos[0].commentsCount).toBe(2);
    });

    it("should be pretty-printed with 2-space indentation", () => {
      const todos = [createMockTodo({ plainText: "Task", state: "active" })];
      const result = exportToJSON(todos);

      // Pretty-printed JSON has newlines
      expect(result).toContain("\n");
      // And indentation
      expect(result).toMatch(/^\s{2}"/m);
    });
  });

  describe("getMimeType", () => {
    it("should return correct MIME type for markdown", () => {
      expect(getMimeType("markdown")).toBe("text/markdown");
    });

    it("should return correct MIME type for CSV", () => {
      expect(getMimeType("csv")).toBe("text/csv");
    });

    it("should return correct MIME type for JSON", () => {
      expect(getMimeType("json")).toBe("application/json");
    });

    it("should return text/plain for unknown format", () => {
      expect(getMimeType("unknown" as ExportFormat)).toBe("text/plain");
    });
  });

  describe("getFileExtension", () => {
    it("should return md for markdown", () => {
      expect(getFileExtension("markdown")).toBe("md");
    });

    it("should return csv for CSV", () => {
      expect(getFileExtension("csv")).toBe("csv");
    });

    it("should return json for JSON", () => {
      expect(getFileExtension("json")).toBe("json");
    });

    it("should return txt for unknown format", () => {
      expect(getFileExtension("unknown" as ExportFormat)).toBe("txt");
    });
  });
});
