/**
 * Tests for NotificationService abstraction
 */

import {
  NotificationService,
  MockNotificationService,
  INotificationService,
  getNotificationService,
  setNotificationService,
  resetNotificationService,
} from "@/services/NotificationService";
import { TodoModel } from "@/models/TodoModel";
import { Todo, TodoMetadata } from "@/types/todo";
import { Settings } from "@/types/settings";
import { AMBIENT_SOUNDS } from "@/utils/notifications";

// Helper to create test settings
const createTestSettings = (): Settings => ({
  priorities: [],
  linkPatterns: [],
  markerColors: {
    assigned: "#cce5ff",
    source: "#d4fdd4",
    mentioned: "#ffe5b4",
    project: "#e2ccff",
    priority: "#ffd4d4",
    dueDate: "#fce4ec",
    duration: "#d4faff",
    recurring: "#e1f5e1",
    dependency: "#fff4e6",
    tag: "#ffe4cc",
    sprint: "#dbeafe",
  },
  general: {
    archiveDays: 30,
    autoDelete: { enabled: false, deleteDays: 90 },
    theme: "system",
  },
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
    contextSwitchingTime: 15,
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
  sprints: {
    defaultSprintDuration: 14,
    showBacklogInSprint: true,
  },
  autoAssign: {
    enabled: true,
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
});

// Default metadata for test todos
const defaultTestMetadata: TodoMetadata = {
  assignedPeople: [],
  sourcePeople: [],
  mentionedPeople: [],
  projects: [],
  dependencies: [],
  tags: [],
};

// Interface for test todo overrides that allows partial metadata
interface TestTodoOverrides extends Omit<Partial<Todo>, "metadata"> {
  metadata?: Partial<TodoMetadata>;
}

// Helper to create a test todo
const createTestTodo = (overrides: TestTodoOverrides = {}): Todo => ({
  id: overrides.id || "test-todo-1",
  text: overrides.text || "Test todo",
  plainText: overrides.plainText || "Test todo",
  state: overrides.state || "active",
  metadata: { ...defaultTestMetadata, ...overrides.metadata },
  createdAt: overrides.createdAt || Date.now(),
  updatedAt: overrides.updatedAt || Date.now(),
  comments: overrides.comments || [],
  activity: overrides.activity || [],
});

describe("NotificationService", () => {
  describe("interface compliance", () => {
    it("should implement INotificationService interface", () => {
      const service = new NotificationService();

      // Check all interface methods exist
      expect(typeof service.playAmbientSound).toBe("function");
      expect(typeof service.stopAmbientSound).toBe("function");
      expect(typeof service.setAmbientVolume).toBe("function");
      expect(typeof service.isAmbientPlaying).toBe("function");
      expect(typeof service.getAmbientSoundFile).toBe("function");
      expect(typeof service.getAmbientSounds).toBe("function");
      expect(typeof service.queueSound).toBe("function");
      expect(typeof service.queueSounds).toBe("function");
      expect(typeof service.clearSoundQueue).toBe("function");
      expect(typeof service.playNotificationSound).toBe("function");
      expect(typeof service.notifyPomodoroBreak).toBe("function");
      expect(typeof service.notifyPomodoroWorkStart).toBe("function");
      expect(typeof service.isNotificationSupported).toBe("function");
      expect(typeof service.getNotificationPermission).toBe("function");
      expect(typeof service.requestNotificationPermission).toBe("function");
      expect(typeof service.sendNotification).toBe("function");
      expect(typeof service.notifyOverdueTask).toBe("function");
      expect(typeof service.notifyDueToday).toBe("function");
      expect(typeof service.notifyDueSoon).toBe("function");
      expect(typeof service.checkAndNotifyDueTasks).toBe("function");
    });
  });

  describe("getAmbientSounds", () => {
    it("should return AMBIENT_SOUNDS constant", () => {
      const service = new NotificationService();
      expect(service.getAmbientSounds()).toBe(AMBIENT_SOUNDS);
    });
  });

  describe("getAmbientSoundFile", () => {
    it("should return file name for valid sound ID", () => {
      const service = new NotificationService();
      expect(service.getAmbientSoundFile("swedish-summer")).toBe("10-minutes-swedish-summer-evening-19559.mp3");
    });

    it("should return empty string for invalid sound ID", () => {
      const service = new NotificationService();
      expect(service.getAmbientSoundFile("invalid-id")).toBe("");
    });
  });
});

describe("MockNotificationService", () => {
  let mock: MockNotificationService;

  beforeEach(() => {
    mock = new MockNotificationService();
  });

  describe("call tracking", () => {
    it("should record method calls", () => {
      mock.playAmbientSound("test.mp3", 0.5);

      expect(mock.calls).toHaveLength(1);
      expect(mock.calls[0].method).toBe("playAmbientSound");
      expect(mock.calls[0].args).toEqual(["test.mp3", 0.5]);
    });

    it("should record multiple calls", () => {
      mock.playAmbientSound("test.mp3");
      mock.stopAmbientSound();
      mock.setAmbientVolume(0.8);

      expect(mock.calls).toHaveLength(3);
      expect(mock.calls[0].method).toBe("playAmbientSound");
      expect(mock.calls[1].method).toBe("stopAmbientSound");
      expect(mock.calls[2].method).toBe("setAmbientVolume");
    });

    it("should include timestamps", () => {
      const before = Date.now();
      mock.playAmbientSound("test.mp3");
      const after = Date.now();

      expect(mock.calls[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(mock.calls[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("getCallsForMethod", () => {
    it("should filter calls by method name", () => {
      mock.queueSound("short-break");
      mock.queueSound("long-break");
      mock.clearSoundQueue();
      mock.queueSound("task-start");

      const queueCalls = mock.getCallsForMethod("queueSound");
      expect(queueCalls).toHaveLength(3);
      expect(queueCalls[0].args[0]).toBe("short-break");
      expect(queueCalls[1].args[0]).toBe("long-break");
      expect(queueCalls[2].args[0]).toBe("task-start");
    });

    it("should return empty array if no calls", () => {
      const calls = mock.getCallsForMethod("nonexistent");
      expect(calls).toEqual([]);
    });
  });

  describe("getLastCallForMethod", () => {
    it("should return last call for method", () => {
      mock.queueSound("short-break");
      mock.queueSound("long-break");
      mock.queueSound("task-start");

      const lastCall = mock.getLastCallForMethod("queueSound");
      expect(lastCall?.args[0]).toBe("task-start");
    });

    it("should return undefined if no calls", () => {
      expect(mock.getLastCallForMethod("queueSound")).toBeUndefined();
    });
  });

  describe("wasMethodCalled", () => {
    it("should return true if method was called", () => {
      mock.playAmbientSound("test.mp3");
      expect(mock.wasMethodCalled("playAmbientSound")).toBe(true);
    });

    it("should return false if method was not called", () => {
      expect(mock.wasMethodCalled("playAmbientSound")).toBe(false);
    });
  });

  describe("reset", () => {
    it("should clear all state", () => {
      mock.playAmbientSound("test.mp3", 0.8);
      mock.queueSound("short-break");
      mock.sendNotification("Test", {});

      mock.reset();

      expect(mock.calls).toEqual([]);
      expect(mock.ambientPlaying).toBe(false);
      expect(mock.ambientVolume).toBe(0.3);
      expect(mock.currentAmbientFile).toBeNull();
      expect(mock.soundQueue).toEqual([]);
      expect(mock.sentNotifications).toEqual([]);
      expect(mock.notifiedTodoIds.size).toBe(0);
    });
  });

  describe("ambient sound methods", () => {
    it("playAmbientSound should update state", () => {
      mock.playAmbientSound("test.mp3", 0.7);

      expect(mock.ambientPlaying).toBe(true);
      expect(mock.currentAmbientFile).toBe("test.mp3");
      expect(mock.ambientVolume).toBe(0.7);
    });

    it("playAmbientSound should use default volume", () => {
      mock.playAmbientSound("test.mp3");

      expect(mock.ambientVolume).toBe(0.3);
    });

    it("stopAmbientSound should clear state", () => {
      mock.playAmbientSound("test.mp3");
      mock.stopAmbientSound();

      expect(mock.ambientPlaying).toBe(false);
      expect(mock.currentAmbientFile).toBeNull();
    });

    it("setAmbientVolume should update volume", () => {
      mock.setAmbientVolume(0.9);
      expect(mock.ambientVolume).toBe(0.9);
    });

    it("isAmbientPlaying should return current state", () => {
      expect(mock.isAmbientPlaying()).toBe(false);
      mock.playAmbientSound("test.mp3");
      expect(mock.isAmbientPlaying()).toBe(true);
    });

    it("getAmbientSoundFile should delegate to real function", () => {
      expect(mock.getAmbientSoundFile("swedish-summer")).toBe("10-minutes-swedish-summer-evening-19559.mp3");
    });

    it("getAmbientSounds should return AMBIENT_SOUNDS", () => {
      expect(mock.getAmbientSounds()).toBe(AMBIENT_SOUNDS);
    });
  });

  describe("sound queue methods", () => {
    it("queueSound should add to queue", () => {
      mock.queueSound("short-break");
      mock.queueSound("long-break");

      expect(mock.soundQueue).toEqual(["short-break", "long-break"]);
    });

    it("queueSounds should add multiple to queue", () => {
      mock.queueSounds(["short-break", "long-break", "task-start"]);

      expect(mock.soundQueue).toEqual(["short-break", "long-break", "task-start"]);
    });

    it("clearSoundQueue should empty queue", () => {
      mock.queueSounds(["short-break", "long-break"]);
      mock.clearSoundQueue();

      expect(mock.soundQueue).toEqual([]);
    });

    it("playNotificationSound should record call", () => {
      mock.playNotificationSound("task-complete");

      expect(mock.wasMethodCalled("playNotificationSound")).toBe(true);
      expect(mock.getLastCallForMethod("playNotificationSound")?.args[0]).toBe("task-complete");
    });
  });

  describe("pomodoro notifications", () => {
    it("notifyPomodoroBreak should record notification and sound", () => {
      mock.notifyPomodoroBreak("short", 5, 3, true);

      expect(mock.wasMethodCalled("notifyPomodoroBreak")).toBe(true);
      expect(mock.wasMethodCalled("playNotificationSound")).toBe(true);

      const soundCall = mock.getLastCallForMethod("playNotificationSound");
      expect(soundCall?.args[0]).toBe("short-break");

      expect(mock.sentNotifications).toHaveLength(1);
      expect(mock.sentNotifications[0].title).toContain("short break");
    });

    it("notifyPomodoroBreak with long break should play long-break sound", () => {
      mock.notifyPomodoroBreak("long", 15, 4, true);

      const soundCall = mock.getLastCallForMethod("playNotificationSound");
      expect(soundCall?.args[0]).toBe("long-break");
      expect(mock.sentNotifications[0].title).toContain("long break");
    });

    it("notifyPomodoroBreak should skip sound when disabled", () => {
      mock.notifyPomodoroBreak("short", 5, 3, false);

      // Only the notifyPomodoroBreak call, no playNotificationSound
      expect(mock.getCallsForMethod("playNotificationSound")).toHaveLength(0);
    });

    it("notifyPomodoroWorkStart should record notification and sound", () => {
      mock.notifyPomodoroWorkStart("Test Task", 5, true);

      expect(mock.wasMethodCalled("notifyPomodoroWorkStart")).toBe(true);
      expect(mock.wasMethodCalled("playNotificationSound")).toBe(true);

      const soundCall = mock.getLastCallForMethod("playNotificationSound");
      expect(soundCall?.args[0]).toBe("task-start");

      expect(mock.sentNotifications).toHaveLength(1);
      expect(mock.sentNotifications[0].title).toContain("back to work");
    });

    it("notifyPomodoroWorkStart should skip sound when disabled", () => {
      mock.notifyPomodoroWorkStart("Test Task", 5, false);

      expect(mock.getCallsForMethod("playNotificationSound")).toHaveLength(0);
    });
  });

  describe("permission methods", () => {
    it("isNotificationSupported should return mock state", () => {
      expect(mock.isNotificationSupported()).toBe(true);

      mock.notificationSupported = false;
      expect(mock.isNotificationSupported()).toBe(false);
    });

    it("getNotificationPermission should return mock permission", () => {
      expect(mock.getNotificationPermission()).toBe("default");

      mock.notificationPermission = "granted";
      expect(mock.getNotificationPermission()).toBe("granted");
    });

    it("requestNotificationPermission should grant permission", async () => {
      const result = await mock.requestNotificationPermission();

      expect(result).toBe("granted");
      expect(mock.notificationPermission).toBe("granted");
    });
  });

  describe("notification methods", () => {
    it("sendNotification should record notification", () => {
      mock.sendNotification("Test Title", { body: "Test Body" });

      expect(mock.sentNotifications).toHaveLength(1);
      expect(mock.sentNotifications[0].title).toBe("Test Title");
      expect(mock.sentNotifications[0].options?.body).toBe("Test Body");
    });

    it("notifyOverdueTask should record notification and track todo ID", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        id: "todo-123",
        plainText: "Overdue task",
        metadata: { dueDate: "2024-01-01" },
      });
      const model = new TodoModel(todo, settings);

      mock.notifyOverdueTask(model);

      expect(mock.sentNotifications).toHaveLength(1);
      expect(mock.sentNotifications[0].title).toContain("Overdue");
      expect(mock.notifiedTodoIds.has("todo-123")).toBe(true);
    });

    it("notifyDueToday should record notification and track todo ID", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        id: "todo-456",
        plainText: "Today task",
        metadata: { priority: "high" },
      });
      const model = new TodoModel(todo, settings);

      mock.notifyDueToday(model);

      expect(mock.sentNotifications).toHaveLength(1);
      expect(mock.sentNotifications[0].title).toContain("Due Today");
      expect(mock.notifiedTodoIds.has("todo-456")).toBe(true);
    });

    it("notifyDueSoon should record notification with hours", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        id: "todo-789",
        plainText: "Soon task",
      });
      const model = new TodoModel(todo, settings);

      mock.notifyDueSoon(model, 2);

      expect(mock.sentNotifications).toHaveLength(1);
      expect(mock.sentNotifications[0].title).toContain("Due in 2 hours");
      expect(mock.notifiedTodoIds.has("todo-789")).toBe(true);
    });

    it("notifyDueSoon should use singular hour", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({ plainText: "Soon task" });
      const model = new TodoModel(todo, settings);

      mock.notifyDueSoon(model, 1);

      expect(mock.sentNotifications[0].title).toContain("Due in 1 hour:");
    });
  });

  describe("checkAndNotifyDueTasks", () => {
    it("should notify for overdue tasks", () => {
      const settings = createTestSettings();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const todo = createTestTodo({
        id: "overdue-1",
        plainText: "Overdue task",
        metadata: { dueDate: yesterday.toISOString() },
      });
      const model = new TodoModel(todo, settings);

      const result = mock.checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: true,
        notifyDueToday: false,
        notifyDueSoon: false,
        dueSoonHours: 2,
      });

      expect(result.has("overdue-1")).toBe(true);
      expect(mock.wasMethodCalled("notifyOverdueTask")).toBe(true);
    });

    it("should skip already notified tasks", () => {
      const settings = createTestSettings();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const todo = createTestTodo({
        id: "already-notified",
        plainText: "Already notified",
        metadata: { dueDate: yesterday.toISOString() },
      });
      const model = new TodoModel(todo, settings);

      const alreadyNotified = new Set(["already-notified"]);
      mock.checkAndNotifyDueTasks([model], alreadyNotified, {
        notifyOverdue: true,
        notifyDueToday: false,
        notifyDueSoon: false,
        dueSoonHours: 2,
      });

      expect(mock.wasMethodCalled("notifyOverdueTask")).toBe(false);
    });

    it("should skip inactive tasks", () => {
      const settings = createTestSettings();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const todo = createTestTodo({
        id: "completed",
        state: "completed",
        plainText: "Completed task",
        metadata: { dueDate: yesterday.toISOString() },
      });
      const model = new TodoModel(todo, settings);

      mock.checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: true,
        notifyDueToday: false,
        notifyDueSoon: false,
        dueSoonHours: 2,
      });

      expect(mock.wasMethodCalled("notifyOverdueTask")).toBe(false);
    });

    it("should skip tasks without due dates", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        id: "no-date",
        plainText: "No due date",
      });
      const model = new TodoModel(todo, settings);

      mock.checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: true,
        notifyDueToday: true,
        notifyDueSoon: true,
        dueSoonHours: 2,
      });

      expect(mock.sentNotifications).toHaveLength(0);
    });
  });
});

describe("Singleton management", () => {
  afterEach(() => {
    resetNotificationService();
  });

  it("getNotificationService should return default instance", () => {
    const service = getNotificationService();
    expect(service).toBeInstanceOf(NotificationService);
  });

  it("setNotificationService should replace instance", () => {
    const mock = new MockNotificationService();
    setNotificationService(mock);

    const service = getNotificationService();
    expect(service).toBe(mock);
  });

  it("resetNotificationService should restore default", () => {
    const mock = new MockNotificationService();
    setNotificationService(mock);
    resetNotificationService();

    const service = getNotificationService();
    expect(service).toBeInstanceOf(NotificationService);
    expect(service).not.toBe(mock);
  });

  it("should allow dependency injection for testing", () => {
    const mock = new MockNotificationService();
    setNotificationService(mock);

    // Simulate component using the service
    const service = getNotificationService();
    service.playAmbientSound("test.mp3", 0.5);
    service.queueSound("short-break");

    // Verify calls were made
    expect(mock.wasMethodCalled("playAmbientSound")).toBe(true);
    expect(mock.wasMethodCalled("queueSound")).toBe(true);
    expect(mock.soundQueue).toContain("short-break");
  });
});

describe("Type safety", () => {
  it("MockNotificationService should be assignable to INotificationService", () => {
    const service: INotificationService = new MockNotificationService();
    expect(service).toBeDefined();
  });

  it("NotificationService should be assignable to INotificationService", () => {
    const service: INotificationService = new NotificationService();
    expect(service).toBeDefined();
  });
});

describe("MockNotificationService - additional edge cases", () => {
  let mock: MockNotificationService;

  beforeEach(() => {
    mock = new MockNotificationService();
  });

  describe("checkAndNotifyDueTasks with due today", () => {
    it("should notify for tasks due today when notifyDueToday is enabled", () => {
      const settings = createTestSettings();
      // Task due in 12 hours
      const today = new Date();
      today.setHours(today.getHours() + 12);

      const todo = createTestTodo({
        id: "due-today-1",
        plainText: "Due today task",
        metadata: { dueDate: today.toISOString() },
      });
      const model = new TodoModel(todo, settings);

      const result = mock.checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: false,
        notifyDueToday: true,
        notifyDueSoon: false,
        dueSoonHours: 2,
      });

      expect(result.has("due-today-1")).toBe(true);
      expect(mock.wasMethodCalled("notifyDueToday")).toBe(true);
    });
  });

  describe("checkAndNotifyDueTasks with due soon", () => {
    it("should notify for tasks due soon when notifyDueSoon is enabled", () => {
      const settings = createTestSettings();
      // Task due in 1.5 hours
      const soon = new Date();
      soon.setTime(soon.getTime() + 1.5 * 60 * 60 * 1000);

      const todo = createTestTodo({
        id: "due-soon-1",
        plainText: "Due soon task",
        metadata: { dueDate: soon.toISOString() },
      });
      const model = new TodoModel(todo, settings);

      const result = mock.checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: false,
        notifyDueToday: false,
        notifyDueSoon: true,
        dueSoonHours: 2,
      });

      expect(result.has("due-soon-1")).toBe(true);
      expect(mock.wasMethodCalled("notifyDueSoon")).toBe(true);
    });

    it("should not notify for tasks outside dueSoonHours window", () => {
      const settings = createTestSettings();
      // Task due in 5 hours
      const later = new Date();
      later.setTime(later.getTime() + 5 * 60 * 60 * 1000);

      const todo = createTestTodo({
        id: "not-soon",
        plainText: "Not due soon",
        metadata: { dueDate: later.toISOString() },
      });
      const model = new TodoModel(todo, settings);

      mock.checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: false,
        notifyDueToday: false,
        notifyDueSoon: true,
        dueSoonHours: 2,
      });

      expect(mock.wasMethodCalled("notifyDueSoon")).toBe(false);
    });
  });

  describe("checkAndNotifyDueTasks with invalid dates", () => {
    it("should skip tasks with invalid due dates", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        id: "invalid-date",
        plainText: "Invalid date task",
        metadata: { dueDate: "not-a-date" },
      });
      const model = new TodoModel(todo, settings);

      mock.checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: true,
        notifyDueToday: true,
        notifyDueSoon: true,
        dueSoonHours: 2,
      });

      expect(mock.sentNotifications).toHaveLength(0);
    });
  });

  describe("checkAndNotifyDueTasks priority handling", () => {
    it("should process overdue before due today", () => {
      const settings = createTestSettings();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const todo = createTestTodo({
        id: "priority-test",
        plainText: "Priority test",
        metadata: { dueDate: yesterday.toISOString() },
      });
      const model = new TodoModel(todo, settings);

      mock.checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: true,
        notifyDueToday: true,
        notifyDueSoon: true,
        dueSoonHours: 48,
      });

      // Should only call overdue, not due today
      expect(mock.wasMethodCalled("notifyOverdueTask")).toBe(true);
      expect(mock.wasMethodCalled("notifyDueToday")).toBe(false);
    });
  });

  describe("multiple todos processing", () => {
    it("should process multiple todos and track all notified IDs", () => {
      const settings = createTestSettings();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const today = new Date();
      today.setHours(today.getHours() + 6);

      const todos = [
        new TodoModel(
          createTestTodo({
            id: "overdue-multi",
            plainText: "Overdue",
            metadata: { dueDate: yesterday.toISOString() },
          }),
          settings,
        ),
        new TodoModel(
          createTestTodo({
            id: "today-multi",
            plainText: "Today",
            metadata: { dueDate: today.toISOString() },
          }),
          settings,
        ),
        new TodoModel(
          createTestTodo({
            id: "no-date-multi",
            plainText: "No date",
          }),
          settings,
        ),
      ];

      const result = mock.checkAndNotifyDueTasks(todos, new Set(), {
        notifyOverdue: true,
        notifyDueToday: true,
        notifyDueSoon: false,
        dueSoonHours: 2,
      });

      expect(result.has("overdue-multi")).toBe(true);
      expect(result.has("today-multi")).toBe(true);
      expect(result.has("no-date-multi")).toBe(false);
      expect(mock.sentNotifications).toHaveLength(2);
    });
  });

  describe("notification content validation", () => {
    it("notifyDueToday should include priority when present", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        plainText: "Important task",
        metadata: { priority: "urgent" },
      });
      const model = new TodoModel(todo, settings);

      mock.notifyDueToday(model);

      expect(mock.sentNotifications[0].options?.body).toContain("Priority: urgent");
    });

    it("notifyDueToday should use default message without priority", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        plainText: "Normal task",
      });
      const model = new TodoModel(todo, settings);

      mock.notifyDueToday(model);

      expect(mock.sentNotifications[0].options?.body).toBe("Remember to complete this task");
    });

    it("notifyDueSoon should include priority when present", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        plainText: "Urgent task",
        metadata: { priority: "high" },
      });
      const model = new TodoModel(todo, settings);

      mock.notifyDueSoon(model, 3);

      expect(mock.sentNotifications[0].options?.body).toContain("Priority: high");
    });

    it("notifyDueSoon should use default message without priority", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        plainText: "Regular task",
      });
      const model = new TodoModel(todo, settings);

      mock.notifyDueSoon(model, 3);

      expect(mock.sentNotifications[0].options?.body).toBe("Task deadline approaching");
    });
  });

  describe("pomodoro notification content", () => {
    it("notifyPomodoroBreak should include task count in body", () => {
      mock.notifyPomodoroBreak("short", 5, 7, false);

      expect(mock.sentNotifications[0].options?.body).toContain("Task 7");
    });

    it("notifyPomodoroWorkStart should include task name and number", () => {
      mock.notifyPomodoroWorkStart("Write tests", 3, false);

      expect(mock.sentNotifications[0].options?.body).toContain("Starting task 3");
      expect(mock.sentNotifications[0].options?.body).toContain("Write tests");
    });
  });

  describe("sound type tracking", () => {
    it("should correctly track queued sounds in order", () => {
      mock.queueSound("task-start");
      mock.queueSound("short-break");
      mock.queueSound("long-break");
      mock.queueSound("task-complete");

      expect(mock.soundQueue).toEqual(["task-start", "short-break", "long-break", "task-complete"]);
    });

    it("queueSounds should append to existing queue", () => {
      mock.queueSound("task-start");
      mock.queueSounds(["short-break", "long-break"]);

      expect(mock.soundQueue).toEqual(["task-start", "short-break", "long-break"]);
    });
  });

  describe("ambient sound edge cases", () => {
    it("should handle changing ambient sound", () => {
      mock.playAmbientSound("first.mp3", 0.5);
      expect(mock.currentAmbientFile).toBe("first.mp3");

      mock.playAmbientSound("second.mp3", 0.8);
      expect(mock.currentAmbientFile).toBe("second.mp3");
      expect(mock.ambientVolume).toBe(0.8);
      expect(mock.ambientPlaying).toBe(true);
    });

    it("should handle volume changes while playing", () => {
      mock.playAmbientSound("test.mp3", 0.3);
      mock.setAmbientVolume(0.1);
      expect(mock.ambientVolume).toBe(0.1);
      expect(mock.ambientPlaying).toBe(true);
    });

    it("should handle stop and restart", () => {
      mock.playAmbientSound("test.mp3");
      mock.stopAmbientSound();
      expect(mock.isAmbientPlaying()).toBe(false);

      mock.playAmbientSound("another.mp3");
      expect(mock.isAmbientPlaying()).toBe(true);
      expect(mock.currentAmbientFile).toBe("another.mp3");
    });
  });
});
