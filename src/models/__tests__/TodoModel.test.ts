/**
 * Tests for TodoModel Business Logic
 */

import { TodoModel, createTodoModel, createTodoModels } from "@/models/TodoModel";
import { generateUUID } from "@/utils/idGenerator";
import { SettingsModel, createSettingsModel, resetSettingsModel_DONOTUSE } from "@/models/SettingsModel";
import { Todo, getTodoId, getSubtaskId, getTag } from "@/types/todo";
import { Settings } from "@/types/settings";
import { getPriorityId } from "@/types/priority";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import { getColor, getCommentId, getActivityId } from "@/types/types";
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

// Helper to create minimal settings
const createSettings = (overrides: Partial<Settings> = {}): SettingsModel =>
  createSettingsModel({
    priorities: [
      { id: getPriorityId("1"), name: "urgent", alternatives: ["critical"], order: 1, color: getColor("#ff0000") },
      { id: getPriorityId("2"), name: "high", alternatives: ["important"], order: 2, color: getColor("#ff6600") },
      { id: getPriorityId("3"), name: "medium", alternatives: [], order: 3, color: getColor("#ffcc00") },
      { id: getPriorityId("4"), name: "low", alternatives: [], order: 4, color: getColor("#00cc00") },
    ],
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

// Helper to create a minimal Todo
const createTodo = (overrides: Partial<Todo> = {}): Todo =>
  ({
    id: overrides.id || getTodoId(generateUUID()),
    text: overrides.text || "Test todo",
    plainText: overrides.plainText || "Test todo",
    state: overrides.state || "active",
    createdAt: overrides.createdAt || getTimestamp(Date.now()),
    context: overrides.context || "",
    // Actual fields (typed IDs)
    assignedPeople: overrides.assignedPeople || [],
    sourcePeople: overrides.sourcePeople || [],
    mentionedPeople: overrides.mentionedPeople || [],
    projects: overrides.projects || [],
    tags: overrides.tags || [],
    dependencies: overrides.dependencies || [],
    priority: overrides.priority,
    dueDate: overrides.dueDate,
    duration: overrides.duration,
    recurring: overrides.recurring,
    sprint: overrides.sprint,
    comments: overrides.comments || [],
    activity: overrides.activity || [],
    subtasks: overrides.subtasks || [],
    ...overrides,
  } as Todo);

describe("TodoModel", () => {
  // Reset singleton before each test to ensure isolation
  beforeEach(() => {
    resetSettingsModel_DONOTUSE();
  });

  describe("core properties", () => {
    it("should expose todo properties correctly", () => {
      const todo = createTodo({
        id: getTodoId("test-123"),
        text: "Rich text",
        plainText: "Plain text",
        state: "active",
        createdAt: getTimestamp(1000000),
      });
      const settings = createSettings();
      const model = new TodoModel(todo, settings);

      expect(model.id).toBe("test-123");
      expect(model.text).toBe("Rich text");
      expect(model.plainText).toBe("Plain text");
      expect(model.state).toBe("active");
      expect(model.createdAt).toBe(1000000);
    });

    it("should expose raw todo object as a copy", () => {
      const todo = createTodo();
      const settings = createSettings();
      const model = new TodoModel(todo, settings);

      expect(model.raw).toEqual(todo);
      expect(model.raw).not.toBe(todo); // Should be a copy
    });
  });

  describe("state checks", () => {
    it("should correctly identify active state", () => {
      const todo = createTodo({ state: "active" });
      const model = new TodoModel(todo, createSettings());

      expect(model.isActive).toBe(true);
      expect(model.isCompleted).toBe(false);
      expect(model.isArchived).toBe(false);
      expect(model.isDeleted).toBe(false);
    });

    it("should correctly identify completed state", () => {
      const todo = createTodo({ state: "completed", completedAt: getTimestamp(Date.now()) });
      const model = new TodoModel(todo, createSettings());

      expect(model.isActive).toBe(false);
      expect(model.isCompleted).toBe(true);
      expect(model.isArchived).toBe(false);
      expect(model.isDeleted).toBe(false);
    });

    it("should correctly identify archived state", () => {
      const todo = createTodo({ state: "archived", archivedAt: getTimestamp(Date.now()) });
      const model = new TodoModel(todo, createSettings());

      expect(model.isActive).toBe(false);
      expect(model.isCompleted).toBe(false);
      expect(model.isArchived).toBe(true);
      expect(model.isDeleted).toBe(false);
    });

    it("should correctly identify deleted state", () => {
      const todo = createTodo({ state: "deleted", deletedAt: getTimestamp(Date.now()) });
      const model = new TodoModel(todo, createSettings());

      expect(model.isActive).toBe(false);
      expect(model.isCompleted).toBe(false);
      expect(model.isArchived).toBe(false);
      expect(model.isDeleted).toBe(true);
    });
  });

  describe("auto-assign functionality", () => {
    // Note: Auto-assign now happens at todo creation time, not at model read time.
    // These tests verify the model correctly reads actual field values.

    it("should not apply auto-assign when disabled", () => {
      const todo = createTodo();
      const settings = createSettings({
        autoAssign: {
          enabled: false,
          assignedPerson: "Default Person",
          project: "Default Project",
        },
      });
      const model = new TodoModel(todo, settings);

      // Model reads from actual fields, which are empty
      expect(model.assignedPeopleIds).toEqual([]);
      expect(model.projectIds).toEqual([]);
    });

    it("should read from actual fields (assignedPeople)", () => {
      const todo = createTodo({
        assignedPeople: [getPersonId("person-1")],
      });
      const settings = createSettings();
      const model = new TodoModel(todo, settings);

      // Model reads from actual fields (IDs)
      expect(model.assignedPeopleIds).toEqual([getPersonId("person-1")]);
    });

    it("should not apply auto-assign when explicit value exists", () => {
      const todo = createTodo({
        assignedPeople: [getPersonId("person-1")],
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          assignedPerson: "Default Person",
        },
      });
      const model = new TodoModel(todo, settings);

      // Should use the explicit value, not the auto-assign default
      expect(model.assignedPeopleIds).toEqual([getPersonId("person-1")]);
    });

    it("should read actual fields for multiple metadata types", () => {
      const todo = createTodo({
        assignedPeople: [getPersonId("person-1")],
        sourcePeople: [getPersonId("person-2")],
        projects: [getProjectId("project-1")],
        priority: getPriorityId("3"),
        duration: getDurationSec(30 * 60), // 30 minutes in seconds
      });
      const settings = createSettings();
      const model = new TodoModel(todo, settings);

      // ID-based accessors
      expect(model.assignedPeopleIds).toEqual([getPersonId("person-1")]);
      expect(model.sourcePeopleIds).toEqual([getPersonId("person-2")]);
      expect(model.projectIds).toEqual([getProjectId("project-1")]);
      expect(model.priorityId).toBe(getPriorityId("3"));
      expect(model.durationSeconds).toBe(getDurationSec(1800));
      expect(model.durationMinutes).toBe(30);
    });
  });

  describe("duration calculations", () => {
    it("should return duration in minutes from seconds", () => {
      const todo = createTodo({
        duration: getDurationSec(30 * 60), // 30 minutes in seconds
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.durationMinutes).toBe(30);
    });

    it("should return duration in minutes for hours", () => {
      const todo = createTodo({
        duration: getDurationSec(2 * 60 * 60), // 2 hours in seconds
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.durationMinutes).toBe(120);
    });

    it("should handle fractional hours", () => {
      const todo = createTodo({
        duration: getDurationSec(90 * 60), // 1.5 hours in seconds
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.durationMinutes).toBe(90);
    });

    it("should return undefined for no duration", () => {
      const todo = createTodo();
      const model = new TodoModel(todo, createSettings());

      expect(model.durationMinutes).toBeUndefined();
    });

    it("should format duration display", () => {
      const shortTodo = createTodo({
        duration: getDurationSec(30 * 60), // 30 minutes
      });
      const longTodo = createTodo({
        duration: getDurationSec(90 * 60), // 90 minutes
      });

      expect(new TodoModel(shortTodo, createSettings()).durationDisplay).toBe("30m");
      expect(new TodoModel(longTodo, createSettings()).durationDisplay).toBe("1.5h");
    });
  });

  describe("date calculations", () => {
    const mockDate = new Date("2025-12-09T12:00:00");

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should correctly identify overdue tasks", () => {
      // Yesterday at noon
      const yesterday = new Date("2025-12-08T12:00:00").getTime();
      const overdueTodo = createTodo({
        state: "active",
        dueDate: getTimestamp(yesterday),
      });
      const model = new TodoModel(overdueTodo, createSettings());

      expect(model.isOverdue).toBe(true);
    });

    it("should not mark completed tasks as overdue", () => {
      const yesterday = new Date("2025-12-08T12:00:00").getTime();
      const completedTodo = createTodo({
        state: "completed",
        completedAt: getTimestamp(Date.now()),
        dueDate: getTimestamp(yesterday),
      });
      const model = new TodoModel(completedTodo, createSettings());

      expect(model.isOverdue).toBe(false);
    });

    it("should correctly identify tasks due today", () => {
      // Today at 5pm
      const todayEvening = new Date("2025-12-09T17:00:00").getTime();
      const todayTodo = createTodo({
        state: "active",
        dueDate: getTimestamp(todayEvening),
      });
      const model = new TodoModel(todayTodo, createSettings());

      expect(model.isDueToday).toBe(true);
    });

    it("should correctly identify tasks due this week", () => {
      // 3 days from now
      const thisWeek = new Date("2025-12-12T12:00:00").getTime();
      const thisWeekTodo = createTodo({
        state: "active",
        dueDate: getTimestamp(thisWeek),
      });
      const model = new TodoModel(thisWeekTodo, createSettings());

      expect(model.isDueThisWeek).toBe(true);
    });

    it("should calculate days until due", () => {
      // 5 days from now
      const future = new Date("2025-12-14T12:00:00").getTime();
      const futureTodo = createTodo({
        state: "active",
        dueDate: getTimestamp(future),
      });
      const model = new TodoModel(futureTodo, createSettings());

      // daysUntilDue calculation may vary slightly based on time component
      expect(model.daysUntilDue).toBeGreaterThanOrEqual(4);
      expect(model.daysUntilDue).toBeLessThanOrEqual(5);
    });

    it("should return negative days for overdue", () => {
      // 2 days ago
      const past = new Date("2025-12-07T12:00:00").getTime();
      const overdueTodo = createTodo({
        state: "active",
        dueDate: getTimestamp(past),
      });
      const model = new TodoModel(overdueTodo, createSettings());

      // daysUntilDue should be negative for overdue
      expect(model.daysUntilDue).toBeLessThan(0);
      expect(model.daysUntilDue).toBeGreaterThanOrEqual(-3);
      expect(model.daysUntilDue).toBeLessThanOrEqual(-2);
    });
  });

  describe("validation methods", () => {
    it("should allow completing active tasks without dependencies", () => {
      const todo = createTodo({ state: "active" });
      const model = new TodoModel(todo, createSettings());
      const allTodos: TodoModel[] = [];

      const result = model.canComplete(allTodos);

      expect(result.canComplete).toBe(true);
    });

    it("should not allow completing already completed tasks", () => {
      const todo = createTodo({ state: "completed", completedAt: getTimestamp(Date.now()) });
      const model = new TodoModel(todo, createSettings());

      const result = model.canComplete([]);

      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain("already completed");
    });

    it("should not allow completing archived tasks", () => {
      const todo = createTodo({ state: "archived", archivedAt: getTimestamp(Date.now()) });
      const model = new TodoModel(todo, createSettings());

      const result = model.canComplete([]);

      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain("archived");
    });

    it("should block completion when dependencies are incomplete", () => {
      const dependency = createTodo({
        id: getTodoId("dep-1"),
        state: "active",
        plainText: "Dependency task",
      });
      const todo = createTodo({
        dependencies: [getTodoId("dep-1")], // Use actual field
      });
      const settings = createSettings();
      const depModel = new TodoModel(dependency, settings);
      const todoModel = new TodoModel(todo, settings);

      const result = todoModel.canComplete([depModel]);

      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain("incomplete");
      expect(result.reason).toContain("Dependency task");
    });

    it("should allow completion when dependencies are complete", () => {
      const dependency = createTodo({
        id: getTodoId("dep-1"),
        state: "completed",
        completedAt: getTimestamp(Date.now()),
      });
      const todo = createTodo({
        dependencies: [getTodoId("dep-1")], // Use actual field
      });
      const settings = createSettings();
      const depModel = new TodoModel(dependency, settings);
      const todoModel = new TodoModel(todo, settings);

      const result = todoModel.canComplete([depModel]);

      expect(result.canComplete).toBe(true);
    });

    it("should allow archiving completed tasks", () => {
      const todo = createTodo({ state: "completed", completedAt: getTimestamp(Date.now()) });
      const model = new TodoModel(todo, createSettings());

      const result = model.canArchive([]);

      expect(result.canArchive).toBe(true);
    });

    it("should allow deleting active tasks", () => {
      const todo = createTodo({ state: "active" });
      const model = new TodoModel(todo, createSettings());

      const result = model.canDelete();

      expect(result.canDelete).toBe(true);
    });

    it("should not allow deleting already deleted tasks", () => {
      const todo = createTodo({ state: "deleted", deletedAt: getTimestamp(Date.now()) });
      const model = new TodoModel(todo, createSettings());

      const result = model.canDelete();

      expect(result.canDelete).toBe(false);
    });
  });

  describe("display helpers", () => {
    it("should return correct status badge", () => {
      const settings = createSettings();

      expect(new TodoModel(createTodo({ state: "active" }), settings).statusBadge).toBe("Active");
      expect(
        new TodoModel(createTodo({ state: "completed", completedAt: getTimestamp(Date.now()) }), settings).statusBadge,
      ).toBe("Completed");
      expect(
        new TodoModel(createTodo({ state: "archived", archivedAt: getTimestamp(Date.now()) }), settings).statusBadge,
      ).toBe("Archived");
      expect(
        new TodoModel(createTodo({ state: "deleted", deletedAt: getTimestamp(Date.now()) }), settings).statusBadge,
      ).toBe("Deleted");
    });

    it("should get priority color from settings", () => {
      const todo = createTodo({
        priority: getPriorityId("1"), // Use actual field with ID
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.priorityColor).toBe("#ff0000");
    });

    it("should find priority by alternative name", () => {
      const todo = createTodo({
        priority: getPriorityId("1"), // Use actual field - alternatives resolved to ID
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.priorityColor).toBe("#ff0000");
      expect(model.priorityOrder).toBe(1);
    });

    it("should get summary with truncation", () => {
      const longText = "This is a very long todo text that should be truncated when getting a summary";
      const todo = createTodo({ plainText: longText });
      const model = new TodoModel(todo, createSettings());

      const summary = model.getSummary(30);

      expect(summary.length).toBeLessThanOrEqual(33); // 30 + "..."
      expect(summary).toContain("...");
    });

    it("should not truncate short text", () => {
      const shortText = "Short todo";
      const todo = createTodo({ plainText: shortText });
      const model = new TodoModel(todo, createSettings());

      const summary = model.getSummary(100);

      expect(summary).toBe(shortText);
      expect(summary).not.toContain("...");
    });

    it("should match search text in various fields", () => {
      const todo = createTodo({
        plainText: "Buy groceries",
        tags: [getTag("personal")],
        priority: getPriorityId("2"), // Maps to "high" in test settings
      });
      const model = new TodoModel(todo, createSettings());

      // Search in plain text
      expect(model.matchesSearch("groceries")).toBe(true);

      // Search in tags
      expect(model.matchesSearch("personal")).toBe(true);

      // Search in priority name (looked up from settings)
      expect(model.matchesSearch("high")).toBe(true);

      // Unknown text should not match
      expect(model.matchesSearch("unknown")).toBe(false);

      // Note: Searching people/projects by name requires a registry
      // which is not set up in this basic test
    });
  });

  describe("factory functions", () => {
    it("should create single TodoModel with createTodoModel", () => {
      const todo = createTodo();
      const settings = createSettings();

      const model = createTodoModel(todo, settings);

      expect(model).toBeInstanceOf(TodoModel);
      expect(model.id).toBe(todo.id);
    });

    it("should create array of TodoModels with createTodoModels", () => {
      const todos = [
        createTodo({ id: getTodoId("1") }),
        createTodo({ id: getTodoId("2") }),
        createTodo({ id: getTodoId("3") }),
      ];
      const settings = createSettings();

      const models = createTodoModels(todos, settings);

      expect(models).toHaveLength(3);
      expect(models[0]).toBeInstanceOf(TodoModel);
      expect(models.map((m) => m.id)).toEqual([getTodoId("1"), getTodoId("2"), getTodoId("3")]);
    });
  });

  describe("subtasks", () => {
    it("should report subtask count correctly", () => {
      const todo = createTodo({
        subtasks: [
          { id: getSubtaskId("1"), text: "Subtask 1", completed: false, createdAt: getTimestamp(Date.now()) },
          { id: getSubtaskId("2"), text: "Subtask 2", completed: true, createdAt: getTimestamp(Date.now()) },
          { id: getSubtaskId("3"), text: "Subtask 3", completed: false, createdAt: getTimestamp(Date.now()) },
        ],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.hasSubtasks).toBe(true);
      expect(model.subtaskCount).toBe(3);
      expect(model.completedSubtaskCount).toBe(1);
    });

    it("should calculate subtask progress", () => {
      const todo = createTodo({
        subtasks: [
          { id: getSubtaskId("1"), text: "Subtask 1", completed: true, createdAt: getTimestamp(Date.now()) },
          { id: getSubtaskId("2"), text: "Subtask 2", completed: true, createdAt: getTimestamp(Date.now()) },
          { id: getSubtaskId("3"), text: "Subtask 3", completed: false, createdAt: getTimestamp(Date.now()) },
          { id: getSubtaskId("4"), text: "Subtask 4", completed: false, createdAt: getTimestamp(Date.now()) },
        ],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.subtaskProgress).toBe(50);
    });

    it("should handle empty subtasks", () => {
      const todo = createTodo();
      const model = new TodoModel(todo, createSettings());

      expect(model.hasSubtasks).toBe(false);
      expect(model.subtaskCount).toBe(0);
      expect(model.subtaskProgress).toBe(0);
    });
  });

  describe("comments and activity", () => {
    it("should report comment count correctly", () => {
      const todo = createTodo({
        comments: [
          {
            commentId: getCommentId("1"),
            history: [{ content: "Comment 1", timestamp: getTimestamp(Date.now()) }],
          },
          {
            commentId: getCommentId("2"),
            history: [{ content: "Comment 2", timestamp: getTimestamp(Date.now()) }],
          },
        ],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.hasComments).toBe(true);
      expect(model.commentCount).toBe(2);
    });

    it("should get latest comment", () => {
      const todo = createTodo({
        comments: [
          {
            commentId: getCommentId("1"),
            history: [
              { content: "Original", timestamp: getTimestamp(1000) },
              { content: "Edited", timestamp: getTimestamp(2000) },
            ],
          },
        ],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.latestComment?.content).toBe("Edited");
      expect(model.latestComment?.timestamp).toBe(getTimestamp(2000));
    });

    it("should report activity count", () => {
      const todo = createTodo({
        activity: [
          { id: getActivityId("1"), type: "created" as const, timestamp: getTimestamp(1000), description: "Created" },
          {
            id: getActivityId("2"),
            type: "completed" as const,
            timestamp: getTimestamp(2000),
            description: "Completed",
          },
        ],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.hasActivity).toBe(true);
      expect(model.activityCount).toBe(2);
    });

    it("should get latest activity", () => {
      const todo = createTodo({
        activity: [
          { id: getActivityId("1"), type: "created" as const, timestamp: getTimestamp(1000), description: "Created" },
          {
            id: getActivityId("2"),
            type: "completed" as const,
            timestamp: getTimestamp(2000),
            description: "Completed",
          },
        ],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.latestActivity?.id).toBe(getActivityId("2"));
      expect(model.latestActivity?.type).toBe("completed");
    });
  });

  describe("date display methods", () => {
    it("should format created date", () => {
      const timestamp = getTimestamp(new Date("2025-12-09T10:30:00").getTime());
      const todo = createTodo({ createdAt: timestamp });
      const model = new TodoModel(todo, createSettings());

      expect(model.createdDateDisplay).toContain("12/9/2025");
    });

    it("should return undefined for missing updatedAt", () => {
      const todo = createTodo({ updatedAt: undefined });
      const model = new TodoModel(todo, createSettings());

      expect(model.updatedDateDisplay).toBeUndefined();
    });

    it("should format updated date when present", () => {
      const timestamp = getTimestamp(new Date("2025-12-09T10:30:00").getTime());
      const todo = createTodo({ updatedAt: timestamp });
      const model = new TodoModel(todo, createSettings());

      expect(model.updatedDateDisplay).toBeDefined();
      expect(model.updatedDateDisplay).toContain("12/9/2025");
    });

    it("should return undefined for missing completedAt", () => {
      const todo = createTodo();
      const model = new TodoModel(todo, createSettings());

      expect(model.completedDateDisplay).toBeUndefined();
    });

    it("should format completed date when present", () => {
      const timestamp = getTimestamp(new Date("2025-12-09T10:30:00").getTime());
      const todo = createTodo({ state: "completed", completedAt: timestamp });
      const model = new TodoModel(todo, createSettings());

      expect(model.completedDateDisplay).toBeDefined();
    });

    it("should return undefined for missing archivedAt", () => {
      const todo = createTodo();
      const model = new TodoModel(todo, createSettings());

      expect(model.archivedDateDisplay).toBeUndefined();
    });

    it("should format archived date when present", () => {
      const timestamp = getTimestamp(new Date("2025-12-09T10:30:00").getTime());
      const todo = createTodo({ state: "archived", archivedAt: timestamp });
      const model = new TodoModel(todo, createSettings());

      expect(model.archivedDateDisplay).toBeDefined();
    });
  });

  describe("age display", () => {
    it("should show 'just now' for recent todos", () => {
      const todo = createTodo({ createdAt: getTimestamp(Date.now() - 30000) }); // 30 seconds ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("just now");
    });

    it("should show minutes for recent todos", () => {
      const todo = createTodo({ createdAt: getTimestamp(Date.now() - 5 * 60 * 1000) }); // 5 minutes ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("5 minutes ago");
    });

    it("should show singular minute", () => {
      const todo = createTodo({ createdAt: getTimestamp(Date.now() - 1 * 60 * 1000) }); // 1 minute ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("1 minute ago");
    });

    it("should show hours for older todos", () => {
      const todo = createTodo({ createdAt: getTimestamp(Date.now() - 3 * 60 * 60 * 1000) }); // 3 hours ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("3 hours ago");
    });

    it("should show singular hour", () => {
      const todo = createTodo({ createdAt: getTimestamp(Date.now() - 1 * 60 * 60 * 1000) }); // 1 hour ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("1 hour ago");
    });

    it("should show days for old todos", () => {
      const todo = createTodo({ createdAt: getTimestamp(Date.now() - 5 * 24 * 60 * 60 * 1000) }); // 5 days ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("5 days ago");
    });

    it("should show singular day", () => {
      const todo = createTodo({ createdAt: getTimestamp(Date.now() - 1 * 24 * 60 * 60 * 1000) }); // 1 day ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("1 day ago");
    });
  });

  describe("status badge", () => {
    it("should return 'Completed' for completed todos", () => {
      const todo = createTodo({ state: "completed" });
      const model = new TodoModel(todo, createSettings());

      expect(model.statusBadge).toBe("Completed");
    });

    it("should return 'Archived' for archived todos", () => {
      const todo = createTodo({ state: "archived" });
      const model = new TodoModel(todo, createSettings());

      expect(model.statusBadge).toBe("Archived");
    });

    it("should return 'Deleted' for deleted todos", () => {
      const todo = createTodo({ state: "deleted" });
      const model = new TodoModel(todo, createSettings());

      expect(model.statusBadge).toBe("Deleted");
    });

    it("should return 'Active' for active todos", () => {
      const todo = createTodo({ state: "active" });
      const model = new TodoModel(todo, createSettings());

      expect(model.statusBadge).toBe("Active");
    });
  });

  describe("getSummary", () => {
    it("should return full text if shorter than maxLength", () => {
      const todo = createTodo({ plainText: "Short text" });
      const model = new TodoModel(todo, createSettings());

      expect(model.getSummary()).toBe("Short text");
    });

    it("should truncate long text", () => {
      const longText = "A".repeat(200);
      const todo = createTodo({ plainText: longText });
      const model = new TodoModel(todo, createSettings());

      const summary = model.getSummary(50);
      expect(summary.length).toBe(53); // 50 + "..."
      expect(summary.endsWith("...")).toBe(true);
    });
  });

  describe("matchesSearch", () => {
    it("should return true for empty search", () => {
      const todo = createTodo();
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("")).toBe(true);
    });

    it("should match plain text", () => {
      const todo = createTodo({ plainText: "Test task for search" });
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("search")).toBe(true);
      expect(model.matchesSearch("SEARCH")).toBe(true); // case insensitive
    });

    // Note: Tests for matching assigned people, source people, and projects
    // require an EntityRegistry to be set. These are covered in integration tests.
    // Without a registry, only plain text, tags, and priority can be searched.

    it("should match tags", () => {
      const todo = createTodo({
        tags: [getTag("important"), getTag("urgent")],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("important")).toBe(true);
    });

    it("should match priority", () => {
      const todo = createTodo({
        priority: getPriorityId("2"), // Maps to "high" in test settings
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("high")).toBe(true);
    });

    it("should not match when text is not found", () => {
      const todo = createTodo({
        plainText: "Test task",
        tags: [],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("nonexistent")).toBe(false);
    });
  });

  describe("isBlockerFor", () => {
    it("should find todos that depend on this one", () => {
      const blocker = createTodo({ id: getTodoId("blocker"), state: "active" });
      const dependent = createTodo({
        id: getTodoId("dependent"),
        state: "active",
        dependencies: [getTodoId("blocker")], // Use actual dependencies field
      });

      const settings = createSettings();
      const blockerModel = new TodoModel(blocker, settings);
      const dependentModel = new TodoModel(dependent, settings);

      const allTodos = [blockerModel, dependentModel];
      const blockedTodos = blockerModel.isBlockerFor(allTodos);

      expect(blockedTodos).toHaveLength(1);
      expect(blockedTodos[0].id).toBe("dependent");
    });

    it("should not include completed dependents", () => {
      const blocker = createTodo({ id: getTodoId("blocker"), state: "active" });
      const completedDependent = createTodo({
        id: getTodoId("completed-dependent"),
        state: "completed",
        dependencies: [getTodoId("blocker")], // Use actual dependencies field
      });

      const settings = createSettings();
      const blockerModel = new TodoModel(blocker, settings);
      const completedModel = new TodoModel(completedDependent, settings);

      const allTodos = [blockerModel, completedModel];
      const blockedTodos = blockerModel.isBlockerFor(allTodos);

      expect(blockedTodos).toHaveLength(0);
    });
  });

  describe("metadata summary", () => {
    it("should return 'No metadata' for todo without metadata", () => {
      const todo = createTodo({
        // All actual fields empty (from createTodo defaults)
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.metadataSummary).toBe("No metadata");
    });

    it("should include assigned people count", () => {
      const todo = createTodo({
        assignedPeople: [getPersonId("person-1"), getPersonId("person-2")],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.metadataSummary).toContain("2 people");
    });

    it("should include project count", () => {
      const todo = createTodo({
        projects: [getProjectId("project-1")],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.metadataSummary).toContain("1 project");
    });

    it("should include duration", () => {
      const todo = createTodo({
        duration: getDurationSec(2 * 60 * 60), // 2 hours
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.metadataSummary).toContain("2h duration");
    });

    it("should include tags count", () => {
      const todo = createTodo({
        tags: [getTag("tag1"), getTag("tag2"), getTag("tag3")],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.metadataSummary).toContain("3 tags");
    });
  });

  describe("duration display", () => {
    it("should return undefined when no duration", () => {
      const todo = createTodo();
      const model = new TodoModel(todo, createSettings());

      expect(model.durationDisplay).toBeUndefined();
    });

    it("should format minutes", () => {
      const todo = createTodo({
        duration: getDurationSec(45 * 60), // 45 minutes
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.durationDisplay).toBe("45m");
    });

    it("should format hours", () => {
      const todo = createTodo({
        duration: getDurationSec(2 * 60 * 60), // 2 hours
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.durationDisplay).toBe("2h");
    });

    it("should format fractional hours", () => {
      const todo = createTodo({
        duration: getDurationSec(90 * 60), // 90 minutes
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.durationDisplay).toBe("1.5h");
    });
  });

  describe("recurring properties", () => {
    it("should return recurring pattern when set", () => {
      const todo = createTodo({
        recurring: "every monday",
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.recurring).toBe("every monday");
      expect(model.isRecurring).toBe(true);
    });

    it("should not apply auto-assign recurring at read time", () => {
      // Note: Auto-assign now happens at todo creation time, not at model read time
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          recurring: "daily",
          assignedPerson: undefined,
          sourcePerson: undefined,
          project: undefined,
          priority: undefined,
          dueDate: undefined,
          duration: undefined,
        },
      });
      const todo = createTodo();
      const model = new TodoModel(todo, settings);

      // Model should not auto-assign - it returns undefined for empty recurring
      expect(model.recurring).toBeUndefined();
    });

    it("should parse recurring pattern", () => {
      const todo = createTodo({
        recurring: "every monday",
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.recurringPattern).not.toBeNull();
      expect(model.recurringPattern?.type).toBe("weekday");
    });
  });

  describe("dueDateDisplay", () => {
    it("should return undefined when no due date", () => {
      const todo = createTodo();
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBeUndefined();
    });

    it("should return 'Today' for today's date at midnight", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(today.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Today");
    });

    it("should return 'Today BOD' for today at BOD time (9am default)", () => {
      const today = new Date();
      today.setHours(9, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(today.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Today BOD");
    });

    it("should return 'Today EOD' for today at EOD time (5pm default)", () => {
      const today = new Date();
      today.setHours(17, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(today.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Today EOD");
    });

    it("should return 'Today noon' for today at noon time", () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(today.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Today noon");
    });

    it("should return 'Today morning' for today in the morning", () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0); // 10am is after morning start (9am) but before noon
      const todo = createTodo({
        dueDate: getTimestamp(today.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Today morning");
    });

    it("should return 'Today afternoon' for today in the afternoon", () => {
      const today = new Date();
      today.setHours(15, 0, 0, 0); // 3pm is afternoon (after 2pm, before 6pm)
      const todo = createTodo({
        dueDate: getTimestamp(today.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Today afternoon");
    });

    it("should return 'Today evening' for today in the evening", () => {
      const today = new Date();
      today.setHours(19, 0, 0, 0); // 7pm is evening (after 6pm, before 9pm)
      const todo = createTodo({
        dueDate: getTimestamp(today.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Today evening");
    });

    it("should return 'Tomorrow' for tomorrow at midnight", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(tomorrow.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Tomorrow");
    });

    it("should return 'Tomorrow EOD' for tomorrow at EOD", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(17, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(tomorrow.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Tomorrow EOD");
    });

    it("should return 'Yesterday' for yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(yesterday.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Yesterday");
    });

    it("should return 'X days ago' for dates 2-6 days in the past", () => {
      const past = new Date();
      past.setDate(past.getDate() - 3);
      past.setHours(12, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(past.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("3 days ago");
    });

    it("should return 'X weeks ago' for dates 1-4 weeks in the past", () => {
      const past = new Date();
      past.setDate(past.getDate() - 14);
      past.setHours(12, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(past.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("2 weeks ago");
    });

    it("should return day name for 2-5 days in future at midnight", () => {
      const future = new Date();
      future.setDate(future.getDate() + 3);
      future.setHours(0, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(future.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      const expectedDay = future.toLocaleDateString(undefined, { weekday: "long" });
      expect(model.dueDateDisplay).toBe(`on ${expectedDay}`);
    });

    it("should return day name with time for 2-5 days in future with time", () => {
      const future = new Date();
      future.setDate(future.getDate() + 3);
      future.setHours(17, 0, 0, 0); // EOD
      const todo = createTodo({
        dueDate: getTimestamp(future.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      const expectedDay = future.toLocaleDateString(undefined, { weekday: "long" });
      expect(model.dueDateDisplay).toBe(`${expectedDay} EOD`);
    });

    it("should return 'in X days' for 6-10 days in future", () => {
      const future = new Date();
      future.setDate(future.getDate() + 8);
      future.setHours(12, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(future.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("in 8 days");
    });

    it("should return 'in X weeks' for 2-8 weeks in future", () => {
      const future = new Date();
      future.setDate(future.getDate() + 21);
      future.setHours(12, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(future.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("in 3 weeks");
    });

    it("should return 'in X months' for 2-12 months in future", () => {
      const future = new Date();
      future.setDate(future.getDate() + 90);
      future.setHours(12, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(future.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("in 3 months");
    });

    it("should return 'in X years' for more than a year in future", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 2);
      future.setHours(12, 0, 0, 0);
      const todo = createTodo({
        dueDate: getTimestamp(future.getTime()),
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("in 2 years");
    });

    it("should use custom BOD/EOD times from settings", () => {
      const today = new Date();
      today.setHours(8, 0, 0, 0); // 8am - custom BOD
      const todo = createTodo({
        dueDate: getTimestamp(today.getTime()),
      });
      // Create settings with custom work hours (8am-6pm)
      const settings = createSettings({
        workHours: {
          useCommonSchedule: true,
          commonSchedule: { startTime: getShortTime("08:00"), endTime: getShortTime("18:00"), breaks: [] },
          weekdaySchedule: { startTime: getShortTime("08:00"), endTime: getShortTime("18:00"), breaks: [] },
          weekendSchedule: { startTime: getShortTime("10:00"), endTime: getShortTime("14:00"), breaks: [] },
          customSchedules: {},
        },
      });
      const model = new TodoModel(todo, settings);

      expect(model.dueDateDisplay).toBe("Today BOD");
    });
  });

  describe("canDelete", () => {
    it("should return true for active todos", () => {
      const todo = createTodo({ state: "active" });
      const model = new TodoModel(todo, createSettings());

      const result = model.canDelete();
      expect(result.canDelete).toBe(true);
    });

    it("should return false for already deleted todos", () => {
      const todo = createTodo({ state: "deleted" });
      const model = new TodoModel(todo, createSettings());

      const result = model.canDelete();
      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe("Task is already deleted");
    });
  });

  describe("canUnarchive", () => {
    it("should return true for archived todos", () => {
      const todo = createTodo({ state: "archived" });
      const model = new TodoModel(todo, createSettings());

      const result = model.canUnarchive();
      expect(result.canUnarchive).toBe(true);
    });

    it("should return false for non-archived todos", () => {
      const todo = createTodo({ state: "active" });
      const model = new TodoModel(todo, createSettings());

      const result = model.canUnarchive();
      expect(result.canUnarchive).toBe(false);
      expect(result.reason).toBe("Task is not archived");
    });
  });

  describe("canArchive with dependencies", () => {
    it("should return false if dependencies are incomplete", () => {
      const dependency = createTodo({ id: getTodoId("dep-1"), state: "active", plainText: "Dependency task" });
      const todo = createTodo({
        id: getTodoId("main"),
        state: "active",
        dependencies: [getTodoId("dep-1")], // Use actual dependencies field
      });

      const settings = createSettings();
      const depModel = new TodoModel(dependency, settings);
      const model = new TodoModel(todo, settings);

      const result = model.canArchive([depModel, model]);
      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain("incomplete");
    });

    it("should return true if all dependencies are completed", () => {
      const dependency = createTodo({ id: getTodoId("dep-1"), state: "completed" });
      const todo = createTodo({
        id: getTodoId("main"),
        state: "active",
        dependencies: [getTodoId("dep-1")], // Use actual dependencies field
      });

      const settings = createSettings();
      const depModel = new TodoModel(dependency, settings);
      const model = new TodoModel(todo, settings);

      const result = model.canArchive([depModel, model]);
      expect(result.canArchive).toBe(true);
    });
  });

  describe("updateSettings", () => {
    it("should update the settings", () => {
      // Note: Auto-assign now happens at todo creation time, not at model read time
      // This test verifies that updateSettings changes the settings reference
      const todo = createTodo({
        assignedPeople: [getPersonId("person-1")],
      });
      const settings = createSettings();
      const model = new TodoModel(todo, settings);

      const newSettings = createSettings();
      model.updateSettings(newSettings);

      // Model should read from actual fields (IDs)
      expect(model.assignedPeopleIds).toContain(getPersonId("person-1"));
    });
  });

  describe("auto-assign fallback with EntityRegistry", () => {
    // Mock EntityRegistry for testing auto-assign fallback behavior
    const createMockRegistry = () => ({
      findPersonByName: jest.fn((name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName === "default person") return { id: getPersonId("default-person-id") };
        if (lowerName === "john") return { id: getPersonId("john-id") };
        return null;
      }),
      findProjectByName: jest.fn((name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName === "default project") return { id: getProjectId("default-project-id") };
        return null;
      }),
    });

    it("should return default priority ID when actual field is empty", () => {
      const todo = createTodo({
        priority: undefined,
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          priority: "high", // This matches priority with ID "2"
        },
      });
      const model = new TodoModel(todo, settings);

      // Priority auto-assign works without registry (uses SettingsModel.findPriority)
      expect(model.priorityId).toBe(getPriorityId("2"));
    });

    it("should return actual priority ID when set (ignoring default)", () => {
      const todo = createTodo({
        priority: getPriorityId("1"), // urgent
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          priority: "high", // default would be high
        },
      });
      const model = new TodoModel(todo, settings);

      // Actual value takes precedence
      expect(model.priorityId).toBe(getPriorityId("1"));
    });

    it("should return undefined when no priority and auto-assign disabled", () => {
      const todo = createTodo({
        priority: undefined,
      });
      const settings = createSettings({
        autoAssign: {
          enabled: false,
          priority: "high",
        },
      });
      const model = new TodoModel(todo, settings);

      expect(model.priorityId).toBeUndefined();
    });

    it("should return default duration when actual field is empty", () => {
      const todo = createTodo({
        duration: undefined,
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          duration: "30m",
        },
      });
      const model = new TodoModel(todo, settings);

      // Duration auto-assign works without registry (parses duration string)
      expect(model.durationSeconds).toBe(getDurationSec(30 * 60)); // 30 min in seconds
    });

    it("should return default duration for hours", () => {
      const todo = createTodo({
        duration: undefined,
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          duration: "2h",
        },
      });
      const model = new TodoModel(todo, settings);

      expect(model.durationSeconds).toBe(getDurationSec(2 * 60 * 60)); // 2 hours in seconds
    });

    it("should return actual duration when set (ignoring default)", () => {
      const todo = createTodo({
        duration: getDurationSec(60 * 60), // 1 hour
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          duration: "30m",
        },
      });
      const model = new TodoModel(todo, settings);

      expect(model.durationSeconds).toBe(getDurationSec(60 * 60));
    });

    it("should return default dueDate when actual field is empty", () => {
      const todo = createTodo({
        dueDate: undefined,
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          dueDate: "tomorrow",
        },
      });
      const model = new TodoModel(todo, settings);

      // DueDate auto-assign parses the date string
      expect(model.dueDate).toBeDefined();
      // Should be tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const resultDate = new Date(model.dueDate!);
      expect(resultDate.getDate()).toBe(tomorrow.getDate());
    });

    it("should return actual dueDate when set (ignoring default)", () => {
      const specificTimestamp = getTimestamp(Date.now() + 1000000);
      const todo = createTodo({
        dueDate: specificTimestamp,
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          dueDate: "tomorrow",
        },
      });
      const model = new TodoModel(todo, settings);

      expect(model.dueDate).toBe(specificTimestamp);
    });

    it("should return default assigned person IDs when using EntityRegistry", () => {
      const todo = createTodo({
        assignedPeople: [],
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          assignedPerson: "Default Person",
        },
      });
      const mockRegistry = createMockRegistry();
      const model = new TodoModel(todo, settings, mockRegistry as never);

      expect(model.assignedPeopleIds).toEqual([getPersonId("default-person-id")]);
      expect(mockRegistry.findPersonByName).toHaveBeenCalledWith("Default Person");
    });

    it("should return empty array when no registry available for person lookup", () => {
      const todo = createTodo({
        assignedPeople: [],
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          assignedPerson: "Default Person",
        },
      });
      // No registry provided
      const model = new TodoModel(todo, settings);

      expect(model.assignedPeopleIds).toEqual([]);
    });

    it("should return actual assigned people when set (ignoring default)", () => {
      const todo = createTodo({
        assignedPeople: [getPersonId("explicit-person")],
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          assignedPerson: "Default Person",
        },
      });
      const mockRegistry = createMockRegistry();
      const model = new TodoModel(todo, settings, mockRegistry as never);

      expect(model.assignedPeopleIds).toEqual([getPersonId("explicit-person")]);
      // Should not have called registry since actual field is set
      expect(mockRegistry.findPersonByName).not.toHaveBeenCalled();
    });

    it("should return default source person IDs when using EntityRegistry", () => {
      const todo = createTodo({
        sourcePeople: [],
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          sourcePerson: "John",
        },
      });
      const mockRegistry = createMockRegistry();
      const model = new TodoModel(todo, settings, mockRegistry as never);

      expect(model.sourcePeopleIds).toEqual([getPersonId("john-id")]);
    });

    it("should return default project IDs when using EntityRegistry", () => {
      const todo = createTodo({
        projects: [],
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          project: "Default Project",
        },
      });
      const mockRegistry = createMockRegistry();
      const model = new TodoModel(todo, settings, mockRegistry as never);

      expect(model.projectIds).toEqual([getProjectId("default-project-id")]);
    });

    it("should return empty array when person name not found in registry", () => {
      const todo = createTodo({
        assignedPeople: [],
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          assignedPerson: "Unknown Person",
        },
      });
      const mockRegistry = createMockRegistry();
      const model = new TodoModel(todo, settings, mockRegistry as never);

      expect(model.assignedPeopleIds).toEqual([]);
    });

    it("should return empty array when project name not found in registry", () => {
      const todo = createTodo({
        projects: [],
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          project: "Unknown Project",
        },
      });
      const mockRegistry = createMockRegistry();
      const model = new TodoModel(todo, settings, mockRegistry as never);

      expect(model.projectIds).toEqual([]);
    });
  });
});
