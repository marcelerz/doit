/**
 * Tests for TodoModel Business Logic
 */

import { TodoModel, createTodoModel, createTodoModels } from "@/models/TodoModel";
import { Todo, TodoState } from "@/types/todo";
import { Settings } from "@/types/settings";

// Helper to create minimal settings
const createSettings = (overrides: Partial<Settings> = {}): Settings => ({
  priorities: [
    { id: "1", name: "urgent", alternatives: ["critical"], order: 1, color: "#ff0000", comments: [], activity: [] },
    { id: "2", name: "high", alternatives: ["important"], order: 2, color: "#ff6600", comments: [], activity: [] },
    { id: "3", name: "medium", alternatives: [], order: 3, color: "#ffcc00", comments: [], activity: [] },
    { id: "4", name: "low", alternatives: [], order: 4, color: "#00cc00", comments: [], activity: [] },
  ],
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
    sprint: "#dbeafe",
  },
  general: { archiveDays: 7, autoDelete: { enabled: false, deleteDays: 90 }, theme: "system" },
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
    minimumRemainingDuration: 1,
    contextSwitchingTime: 5,
    pomodoroWorkDuration: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroLongBreakInterval: 4,
    pomodoroNotifications: true,
    pomodoroSound: true,
    flowWorkDuration: 52,
    flowBreakDuration: 17,
    flowContextSwitchingTime: 10,
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
  sprints: { defaultSprintDuration: 14, showBacklogInSprint: true },
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
    weekStartDay: 0,
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
    confirmationRepeatInterval: 30,
    confirmationMaxRepeats: 5,
    autoTimeTracking: true,
    trackActualVsEstimated: true,
    defaultExtendMinutes: 5,
    extendOptions: [5, 10, 15, 30],
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
    dueSoonHours: 2,
    checkInterval: 15,
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
  ...overrides,
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
  comments: overrides.comments || [],
  activity: overrides.activity || [],
  ...overrides,
});

describe("TodoModel", () => {
  describe("core properties", () => {
    it("should expose todo properties correctly", () => {
      const todo = createTodo({
        id: "test-123",
        text: "Rich text",
        plainText: "Plain text",
        state: "active",
        createdAt: 1000000,
      });
      const settings = createSettings();
      const model = new TodoModel(todo, settings);

      expect(model.id).toBe("test-123");
      expect(model.text).toBe("Rich text");
      expect(model.plainText).toBe("Plain text");
      expect(model.state).toBe("active");
      expect(model.createdAt).toBe(1000000);
    });

    it("should expose raw todo object", () => {
      const todo = createTodo();
      const settings = createSettings();
      const model = new TodoModel(todo, settings);

      expect(model.raw).toBe(todo);
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
      const todo = createTodo({ state: "completed", completedAt: Date.now() });
      const model = new TodoModel(todo, createSettings());

      expect(model.isActive).toBe(false);
      expect(model.isCompleted).toBe(true);
      expect(model.isArchived).toBe(false);
      expect(model.isDeleted).toBe(false);
    });

    it("should correctly identify archived state", () => {
      const todo = createTodo({ state: "archived", archivedAt: Date.now() });
      const model = new TodoModel(todo, createSettings());

      expect(model.isActive).toBe(false);
      expect(model.isCompleted).toBe(false);
      expect(model.isArchived).toBe(true);
      expect(model.isDeleted).toBe(false);
    });

    it("should correctly identify deleted state", () => {
      const todo = createTodo({ state: "deleted", deletedAt: Date.now() });
      const model = new TodoModel(todo, createSettings());

      expect(model.isActive).toBe(false);
      expect(model.isCompleted).toBe(false);
      expect(model.isArchived).toBe(false);
      expect(model.isDeleted).toBe(true);
    });
  });

  describe("auto-assign functionality", () => {
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

      expect(model.assignedPeople).toEqual([]);
      expect(model.projects).toEqual([]);
    });

    it("should apply auto-assign for assignedPeople when enabled and empty", () => {
      const todo = createTodo();
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          assignedPerson: "Default Person",
        },
      });
      const model = new TodoModel(todo, settings);

      expect(model.assignedPeople).toEqual(["Default Person"]);
      expect(model.assignedPeopleRaw).toEqual([]); // Raw should be unchanged
    });

    it("should not apply auto-assign when explicit value exists", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: ["Explicit Person"],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
        },
      });
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          assignedPerson: "Default Person",
        },
      });
      const model = new TodoModel(todo, settings);

      expect(model.assignedPeople).toEqual(["Explicit Person"]);
    });

    it("should apply auto-assign for multiple fields", () => {
      const todo = createTodo();
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          assignedPerson: "Default Person",
          sourcePerson: "Default Source",
          project: "Default Project",
          priority: "medium",
          duration: "30m",
        },
      });
      const model = new TodoModel(todo, settings);

      expect(model.assignedPeople).toEqual(["Default Person"]);
      expect(model.sourcePeople).toEqual(["Default Source"]);
      expect(model.projects).toEqual(["Default Project"]);
      expect(model.priority).toBe("medium");
      expect(model.duration).toBe("30m");
    });

    it("should report wouldAutoAssignApply correctly", () => {
      const todo = createTodo();
      const settings = createSettings({
        autoAssign: {
          enabled: true,
          assignedPerson: "Default Person",
        },
      });
      const model = new TodoModel(todo, settings);

      expect(model.wouldAutoAssignApply).toBe(true);
    });

    it("should report wouldAutoAssignApply false when auto-assign disabled", () => {
      const todo = createTodo();
      const settings = createSettings({
        autoAssign: {
          enabled: false,
          assignedPerson: "Default Person",
        },
      });
      const model = new TodoModel(todo, settings);

      expect(model.wouldAutoAssignApply).toBe(false);
    });
  });

  describe("duration calculations", () => {
    it("should parse duration in minutes", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          duration: "30m",
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.durationMinutes).toBe(30);
    });

    it("should parse duration in hours", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          duration: "2h",
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.durationMinutes).toBe(120);
    });

    it("should parse decimal hours", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          duration: "1.5h",
        },
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
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          duration: "30m",
        },
      });
      const longTodo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          duration: "90m",
        },
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
      const overdueTodo = createTodo({
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: "2025-12-08", // Yesterday
        },
      });
      const model = new TodoModel(overdueTodo, createSettings());

      expect(model.isOverdue).toBe(true);
    });

    it("should not mark completed tasks as overdue", () => {
      const completedTodo = createTodo({
        state: "completed",
        completedAt: Date.now(),
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: "2025-12-08", // Yesterday
        },
      });
      const model = new TodoModel(completedTodo, createSettings());

      expect(model.isOverdue).toBe(false);
    });

    it("should correctly identify tasks due today", () => {
      // Use explicit ISO datetime to avoid timezone issues
      const todayTodo = createTodo({
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: "2025-12-09T17:00", // Today with time
        },
      });
      const model = new TodoModel(todayTodo, createSettings());

      expect(model.isDueToday).toBe(true);
    });

    it("should correctly identify tasks due this week", () => {
      const thisWeekTodo = createTodo({
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: "2025-12-12", // 3 days from now
        },
      });
      const model = new TodoModel(thisWeekTodo, createSettings());

      expect(model.isDueThisWeek).toBe(true);
    });

    it("should calculate days until due", () => {
      const futureTodo = createTodo({
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: "2025-12-14T12:00", // Future date with time
        },
      });
      const model = new TodoModel(futureTodo, createSettings());

      // daysUntilDue calculation may vary slightly based on time component
      expect(model.daysUntilDue).toBeGreaterThanOrEqual(4);
      expect(model.daysUntilDue).toBeLessThanOrEqual(5);
    });

    it("should return negative days for overdue", () => {
      const overdueTodo = createTodo({
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: "2025-12-07T12:00", // Past date with time
        },
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
      const todo = createTodo({ state: "completed", completedAt: Date.now() });
      const model = new TodoModel(todo, createSettings());

      const result = model.canComplete([]);

      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain("already completed");
    });

    it("should not allow completing archived tasks", () => {
      const todo = createTodo({ state: "archived", archivedAt: Date.now() });
      const model = new TodoModel(todo, createSettings());

      const result = model.canComplete([]);

      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain("archived");
    });

    it("should block completion when dependencies are incomplete", () => {
      const dependency = createTodo({
        id: "dep-1",
        state: "active",
        plainText: "Dependency task",
      });
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: ["dep-1"],
        },
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
        id: "dep-1",
        state: "completed",
        completedAt: Date.now(),
      });
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: ["dep-1"],
        },
      });
      const settings = createSettings();
      const depModel = new TodoModel(dependency, settings);
      const todoModel = new TodoModel(todo, settings);

      const result = todoModel.canComplete([depModel]);

      expect(result.canComplete).toBe(true);
    });

    it("should allow archiving completed tasks", () => {
      const todo = createTodo({ state: "completed", completedAt: Date.now() });
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
      const todo = createTodo({ state: "deleted", deletedAt: Date.now() });
      const model = new TodoModel(todo, createSettings());

      const result = model.canDelete();

      expect(result.canDelete).toBe(false);
    });
  });

  describe("display helpers", () => {
    it("should return correct status badge", () => {
      const settings = createSettings();

      expect(new TodoModel(createTodo({ state: "active" }), settings).statusBadge).toBe("Active");
      expect(new TodoModel(createTodo({ state: "completed", completedAt: Date.now() }), settings).statusBadge).toBe(
        "Completed",
      );
      expect(new TodoModel(createTodo({ state: "archived", archivedAt: Date.now() }), settings).statusBadge).toBe(
        "Archived",
      );
      expect(new TodoModel(createTodo({ state: "deleted", deletedAt: Date.now() }), settings).statusBadge).toBe(
        "Deleted",
      );
    });

    it("should get priority color from settings", () => {
      const todo = createTodo({
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
      const model = new TodoModel(todo, createSettings());

      expect(model.priorityColor).toBe("#ff0000");
    });

    it("should find priority by alternative name", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          priority: "critical", // Alternative for "urgent"
        },
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
        metadata: {
          assignedPeople: ["Alice"],
          sourcePeople: [],
          mentionedPeople: [],
          projects: ["Shopping"],
          tags: ["personal"],
          dependencies: [],
          priority: "high",
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("groceries")).toBe(true);
      expect(model.matchesSearch("Alice")).toBe(true);
      expect(model.matchesSearch("Shopping")).toBe(true);
      expect(model.matchesSearch("personal")).toBe(true);
      expect(model.matchesSearch("high")).toBe(true);
      expect(model.matchesSearch("unknown")).toBe(false);
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
      const todos = [createTodo({ id: "1" }), createTodo({ id: "2" }), createTodo({ id: "3" })];
      const settings = createSettings();

      const models = createTodoModels(todos, settings);

      expect(models).toHaveLength(3);
      expect(models[0]).toBeInstanceOf(TodoModel);
      expect(models.map((m) => m.id)).toEqual(["1", "2", "3"]);
    });
  });

  describe("subtasks", () => {
    it("should report subtask count correctly", () => {
      const todo = createTodo({
        subtasks: [
          { id: "1", text: "Subtask 1", completed: false, createdAt: Date.now() },
          { id: "2", text: "Subtask 2", completed: true, createdAt: Date.now() },
          { id: "3", text: "Subtask 3", completed: false, createdAt: Date.now() },
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
          { id: "1", text: "Subtask 1", completed: true, createdAt: Date.now() },
          { id: "2", text: "Subtask 2", completed: true, createdAt: Date.now() },
          { id: "3", text: "Subtask 3", completed: false, createdAt: Date.now() },
          { id: "4", text: "Subtask 4", completed: false, createdAt: Date.now() },
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
            commentId: 1,
            history: [{ content: "Comment 1", date: Date.now() }],
          },
          {
            commentId: 2,
            history: [{ content: "Comment 2", date: Date.now() }],
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
            commentId: 1,
            history: [
              { content: "Original", date: 1000 },
              { content: "Edited", date: 2000 },
            ],
          },
        ],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.latestComment?.content).toBe("Edited");
      expect(model.latestComment?.date).toBe(2000);
    });

    it("should report activity count", () => {
      const todo = createTodo({
        activity: [
          { id: "1", type: "created" as const, timestamp: 1000, description: "Created" },
          { id: "2", type: "completed" as const, timestamp: 2000, description: "Completed" },
        ],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.hasActivity).toBe(true);
      expect(model.activityCount).toBe(2);
    });

    it("should get latest activity", () => {
      const todo = createTodo({
        activity: [
          { id: "1", type: "created" as const, timestamp: 1000, description: "Created" },
          { id: "2", type: "completed" as const, timestamp: 2000, description: "Completed" },
        ],
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.latestActivity?.id).toBe("2");
      expect(model.latestActivity?.type).toBe("completed");
    });
  });

  describe("date display methods", () => {
    it("should format created date", () => {
      const timestamp = new Date("2025-12-09T10:30:00").getTime();
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
      const timestamp = new Date("2025-12-09T10:30:00").getTime();
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
      const timestamp = new Date("2025-12-09T10:30:00").getTime();
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
      const timestamp = new Date("2025-12-09T10:30:00").getTime();
      const todo = createTodo({ state: "archived", archivedAt: timestamp });
      const model = new TodoModel(todo, createSettings());

      expect(model.archivedDateDisplay).toBeDefined();
    });
  });

  describe("age display", () => {
    it("should show 'just now' for recent todos", () => {
      const todo = createTodo({ createdAt: Date.now() - 30000 }); // 30 seconds ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("just now");
    });

    it("should show minutes for recent todos", () => {
      const todo = createTodo({ createdAt: Date.now() - 5 * 60 * 1000 }); // 5 minutes ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("5 minutes ago");
    });

    it("should show singular minute", () => {
      const todo = createTodo({ createdAt: Date.now() - 1 * 60 * 1000 }); // 1 minute ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("1 minute ago");
    });

    it("should show hours for older todos", () => {
      const todo = createTodo({ createdAt: Date.now() - 3 * 60 * 60 * 1000 }); // 3 hours ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("3 hours ago");
    });

    it("should show singular hour", () => {
      const todo = createTodo({ createdAt: Date.now() - 1 * 60 * 60 * 1000 }); // 1 hour ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("1 hour ago");
    });

    it("should show days for old todos", () => {
      const todo = createTodo({ createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000 }); // 5 days ago
      const model = new TodoModel(todo, createSettings());

      expect(model.ageDisplay).toBe("5 days ago");
    });

    it("should show singular day", () => {
      const todo = createTodo({ createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000 }); // 1 day ago
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

    it("should match assigned people", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: ["John Doe"],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("john")).toBe(true);
    });

    it("should match source people", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: ["Jane Smith"],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("jane")).toBe(true);
    });

    it("should match projects", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: ["Project Alpha"],
          tags: [],
          dependencies: [],
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("alpha")).toBe(true);
    });

    it("should match tags", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: ["important", "urgent"],
          dependencies: [],
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("important")).toBe(true);
    });

    it("should match priority", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          priority: "high",
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("high")).toBe(true);
    });

    it("should not match when text is not found", () => {
      const todo = createTodo({ plainText: "Test task" });
      const model = new TodoModel(todo, createSettings());

      expect(model.matchesSearch("nonexistent")).toBe(false);
    });
  });

  describe("isBlockerFor", () => {
    it("should find todos that depend on this one", () => {
      const blocker = createTodo({ id: "blocker", state: "active" });
      const dependent = createTodo({
        id: "dependent",
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: ["blocker"],
        },
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
      const blocker = createTodo({ id: "blocker", state: "active" });
      const completedDependent = createTodo({
        id: "completed-dependent",
        state: "completed",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: ["blocker"],
        },
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
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.metadataSummary).toBe("No metadata");
    });

    it("should include assigned people count", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: ["John", "Jane"],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.metadataSummary).toContain("2 people");
    });

    it("should include project count", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: ["Project A"],
          tags: [],
          dependencies: [],
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.metadataSummary).toContain("1 project");
    });

    it("should include duration", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          duration: "2h",
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.metadataSummary).toContain("2h duration");
    });

    it("should include tags count", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: ["tag1", "tag2", "tag3"],
          dependencies: [],
        },
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
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          duration: "45m",
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.durationDisplay).toBe("45m");
    });

    it("should format hours", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          duration: "2h",
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.durationDisplay).toBe("2h");
    });

    it("should format fractional hours", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          duration: "90m",
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.durationDisplay).toBe("1.5h");
    });
  });

  describe("recurring properties", () => {
    it("should return recurring pattern when set", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          recurring: "every monday",
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.recurring).toBe("every monday");
      expect(model.isRecurring).toBe(true);
    });

    it("should apply auto-assign recurring when enabled", () => {
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

      expect(model.recurring).toBe("daily");
      expect(model.recurringRaw).toBeUndefined();
    });

    it("should parse recurring pattern", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          recurring: "every monday",
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.recurringPattern).not.toBeNull();
      expect(model.recurringPattern?.type).toBe("weekday");
    });
  });

  describe("due date display", () => {
    it("should return 'Today' for today's date", () => {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: dateStr,
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Today");
    });

    it("should return 'Tomorrow' for tomorrow's date", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: dateStr,
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Tomorrow");
    });

    it("should return 'Yesterday' for yesterday's date", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split("T")[0];
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: dateStr,
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBe("Yesterday");
    });

    it("should return formatted date for other dates", () => {
      const todo = createTodo({
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
          dueDate: "2025-12-25",
        },
      });
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBeDefined();
      expect(model.dueDateDisplay).not.toBe("Today");
      expect(model.dueDateDisplay).not.toBe("Tomorrow");
    });

    it("should return undefined for no due date", () => {
      const todo = createTodo();
      const model = new TodoModel(todo, createSettings());

      expect(model.dueDateDisplay).toBeUndefined();
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
      const dependency = createTodo({ id: "dep-1", state: "active", plainText: "Dependency task" });
      const todo = createTodo({
        id: "main",
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: ["dep-1"],
        },
      });

      const settings = createSettings();
      const depModel = new TodoModel(dependency, settings);
      const model = new TodoModel(todo, settings);

      const result = model.canArchive([depModel, model]);
      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain("incomplete");
    });

    it("should return true if all dependencies are completed", () => {
      const dependency = createTodo({ id: "dep-1", state: "completed" });
      const todo = createTodo({
        id: "main",
        state: "active",
        metadata: {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: ["dep-1"],
        },
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
      const todo = createTodo();
      const settings = createSettings();
      const model = new TodoModel(todo, settings);

      const newSettings = createSettings({
        autoAssign: {
          enabled: true,
          assignedPerson: "John",
          sourcePerson: undefined,
          project: undefined,
          priority: undefined,
          dueDate: undefined,
          duration: undefined,
          recurring: undefined,
        },
      });

      model.updateSettings(newSettings);
      expect(model.assignedPeople).toContain("John");
    });
  });
});
