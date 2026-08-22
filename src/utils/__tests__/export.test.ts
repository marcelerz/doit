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
import { generateUUID } from "@/utils/idGenerator";
import { TodoModel } from "@/models/TodoModel";
import { Comment, getCommentId } from "@/types/types";
import { createSettingsModel, resetSettingsModel_DONOTUSE } from "@/models/SettingsModel";
import { Todo, TodoState, getTodoId, getTag } from "@/types/todo";
import { Settings } from "@/types/settings";
import { getColor } from "@/types/types";
import { getPriorityId } from "@/types/priority";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import {
  getShortTime,
  getDurationDay,
  getDurationMin,
  getDurationSec,
  getDurationHour,
  getWeekday,
  getMonth,
  getTimestamp,
} from "@/types/time";

describe("export", () => {
  // Reset singleton before each test to ensure isolation
  beforeEach(() => {
    resetSettingsModel_DONOTUSE();
  });

  // Helper to create a mock TodoModel
  // Note: The new architecture stores typed IDs, not string names.
  // Priority is looked up from settings by ID, dueDate is a timestamp.
  const createMockTodo = (
    overrides: Partial<{
      id: string;
      text: string;
      plainText: string;
      state: TodoState;
      priorityId: string; // Priority ID to look up in settings
      dueDate: number; // Timestamp
      duration: number; // Duration in seconds
      assignedPeople: string[]; // Person IDs
      projects: string[]; // Project IDs
      tags: string[]; // Tag strings
      createdAt: number;
      completedAt: number;
      comments: Comment[];
    }> = {},
  ): TodoModel => {
    const rawTodo: Todo = {
      id: getTodoId(overrides.id || generateUUID()),
      text: overrides.text || "Test todo",
      plainText: overrides.plainText || "Test todo",
      state: overrides.state || "active",
      createdAt: getTimestamp(overrides.createdAt || Date.now()),
      completedAt: overrides.completedAt ? getTimestamp(overrides.completedAt) : undefined,
      context: "",
      tags: (overrides.tags || []).map((t) => getTag(t)),
      dependencies: [],
      assignedPeople: (overrides.assignedPeople || []).map((p) => getPersonId(p)),
      sourcePeople: [],
      mentionedPeople: [],
      projects: (overrides.projects || []).map((p) => getProjectId(p)),
      priority: overrides.priorityId ? getPriorityId(overrides.priorityId) : undefined,
      dueDate: overrides.dueDate ? getTimestamp(overrides.dueDate) : undefined,
      duration: overrides.duration ? getDurationSec(overrides.duration) : undefined,
      subtasks: [],
      comments: overrides.comments || [],
      activity: [],
    };

    const settings: Settings = {
      priorities: [
        { id: getPriorityId("1"), name: "urgent", alternatives: [], order: 1, color: getColor("#ff0000") },
        { id: getPriorityId("2"), name: "high", alternatives: [], order: 2, color: getColor("#ff6600") },
        { id: getPriorityId("3"), name: "medium", alternatives: [], order: 3, color: getColor("#ffcc00") },
        { id: getPriorityId("4"), name: "low", alternatives: [], order: 4, color: getColor("#00cc00") },
      ],
      linkPatterns: [],
      markerColors: {
        assigned: getColor("#000"),
        source: getColor("#000"),
        mentioned: getColor("#000"),
        project: getColor("#000"),
        priority: getColor("#000"),
        dueDate: getColor("#000"),
        duration: getColor("#000"),
        recurring: getColor("#000"),
        dependency: getColor("#000"),
        tag: getColor("#000"),
        sprint: getColor("#000"),
      },
      general: {
        archiveDays: getDurationDay(30),
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
        contextSwitchingTime: getDurationMin(15),
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
      sprints: {
        defaultSprintDuration: getDurationDay(14),
        showBacklogInSprint: false,
      },
      autoAssign: { enabled: true },
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
      notifications: {
        enabled: false,
        notifyOverdue: true,
        notifyDueToday: true,
        notifyDueSoon: true,
        dueSoonHours: getDurationHour(2),
        checkInterval: getDurationMin(15),
      },
      categories: [],
      features: {
        ganttView: true,
        calendarView: true,
        kanbanView: true,
        notesView: true,
        sprintsView: true,
        reviewsView: true,
        statsView: true,
        templates: true,
        batchProcessing: true,
        reordering: true,
        exports: true,
        focusMode: true,
        timeTracking: true,
      },
      notes: {
        defaultPinNewNotes: false,
        showArchivedByDefault: false,
        sortOrder: "modified",
        oneOnOneTemplate: [],
        meetingNoteTemplate: [],
      },
      backup: {
        autoBackupEnabled: true,
        retentionDays: 30,
        lastBackupDate: null,
      },
    };

    return new TodoModel(rawTodo, createSettingsModel(settings));
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
      // Note: Export now uses typed fields (IDs), not string names.
      // Priority is looked up by ID, dueDate is a timestamp displayed as a date string.
      // Assigned people and projects require registry for name lookup (not tested here).
      const dueDate = new Date("2025-12-15T12:00:00").getTime();
      const todos = [
        createMockTodo({
          plainText: "Task with metadata",
          state: "active",
          priorityId: "2", // Maps to "high" in settings
          dueDate,
          tags: ["urgent"],
        }),
      ];

      const result = exportToMarkdown(todos);

      expect(result).toContain("Priority: high");
      expect(result).toContain("Due:");
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
      const dueDate = new Date("2025-12-15T12:00:00").getTime();
      const todos = [
        createMockTodo({
          plainText: "Test task",
          state: "active",
          priorityId: "2", // Maps to "high"
          dueDate,
          duration: 7200, // 2 hours in seconds
        }),
      ];

      const result = exportToCSV(todos);
      const lines = result.split("\n");

      expect(lines.length).toBeGreaterThan(1);
      expect(lines[1]).toContain("Test task");
      expect(lines[1]).toContain("active");
      expect(lines[1]).toContain("high");
      expect(lines[1]).toContain("2h"); // Duration display
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

    it("should include tags joined with semicolons", () => {
      // Note: Assigned people/projects require registry for name lookup.
      // Tags are strings and work without registry.
      const todos = [
        createMockTodo({
          plainText: "Task",
          state: "active",
          tags: ["work", "urgent", "review"],
        }),
      ];

      const result = exportToCSV(todos);

      expect(result).toContain("work; urgent; review");
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
      // Note: The export now uses typed fields (IDs) and the 'fields' property instead of 'metadata'.
      // People and projects are exported as IDs since names require registry lookup.
      const dueDate = new Date("2025-12-15T12:00:00").getTime();
      const todos = [
        createMockTodo({
          id: "todo-123",
          text: "Full text with @Alice",
          plainText: "Full text",
          state: "active",
          priorityId: "2", // Maps to "high"
          dueDate,
          duration: 7200, // 2 hours in seconds
          assignedPeople: ["person-1"], // IDs, not names
          projects: ["project-1"], // IDs, not names
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
      expect(todo.fields.priority).toBe("high"); // Name looked up from settings
      expect(todo.fields.duration).toBe("2h"); // Formatted from seconds
      expect(todo.fields.assignedPeopleIds).toContain("person-1"); // IDs
      expect(todo.fields.projectIds).toContain("project-1"); // IDs
      expect(todo.fields.tags).toContain("urgent");
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
            { commentId: getCommentId("1"), history: [{ timestamp: getTimestamp(Date.now()), content: "Comment" }] },
            { commentId: getCommentId("2"), history: [{ timestamp: getTimestamp(Date.now()), content: "Another" }] },
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

  describe("CSV cell safety", () => {
    it("neutralises a leading formula character", () => {
      const csv = exportToCSV([createMockTodo({ plainText: "=HYPERLINK(\"http://evil\",\"click\")" })]);
      // Quoting alone does not stop a spreadsheet evaluating the cell.
      expect(csv).toContain("'=HYPERLINK");
    });

    it("neutralises the other formula prefixes", () => {
      for (const prefix of ["+", "-", "@"]) {
        const csv = exportToCSV([createMockTodo({ plainText: `${prefix}cmd` })]);
        expect(csv).toContain(`'${prefix}cmd`);
      }
    });

    it("leaves ordinary text alone", () => {
      const csv = exportToCSV([createMockTodo({ plainText: "Write the report" })]);
      expect(csv).toContain("Write the report");
      expect(csv).not.toContain("'Write");
    });

    it("quotes a tag containing a comma so the row keeps its columns", () => {
      const csv = exportToCSV([createMockTodo({ plainText: "Task", tags: ["a,b"] })]);
      const dataRow = csv.split("\n")[1];
      expect(dataRow).toContain('"a,b"');
      // Header column count must still match the data row.
      expect(dataRow.split('","').length).toBeGreaterThan(0);
    });
  });
});
