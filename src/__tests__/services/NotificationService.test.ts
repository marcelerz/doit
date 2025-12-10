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
import { Todo } from "@/types/todo";
import { Settings } from "@/types/settings";
import { AMBIENT_SOUNDS } from "@/utils/notifications";

// Helper to create test settings
const createTestSettings = (): Settings => ({
  priorities: [],
  linkPatterns: [],
  markerColors: {
    person: "#3b82f6",
    project: "#8b5cf6",
    tag: "#10b981",
    date: "#f59e0b",
    duration: "#ef4444",
    recurring: "#06b6d4",
    priority: "#ec4899",
    dependency: "#6366f1",
    source: "#f97316",
    mentioned: "#eab308",
  },
  general: { archiveDays: 30, autoDelete: false },
  dateTime: {
    morning: "09:00",
    noon: "12:00",
    afternoon: "14:00",
    evening: "18:00",
    workWeekStart: 1,
    fiscalYearStart: 1,
  },
  workHours: {
    scheduleType: "common",
    commonSchedule: { startTime: "09:00", endTime: "17:00", timeBlocks: [] },
    weekdaySchedule: { startTime: "09:00", endTime: "17:00", timeBlocks: [] },
    weekendSchedule: { startTime: "10:00", endTime: "14:00", timeBlocks: [] },
    dailySchedules: {},
  },
  gantt: {
    schedulingMode: "sequential",
    sequential: { contextSwitchMinutes: 5 },
    pomodoro: {
      workDurationMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4,
    },
    flow: {
      workDurationMinutes: 52,
      breakDurationMinutes: 17,
      contextSwitchMinutes: 10,
    },
    defaultTaskDurationMinutes: 30,
    durationMultiplier: 1,
  },
  kanban: {
    workflowStates: [],
    transitions: {},
    views: [],
    displayOptions: { showEmptyColumns: true, showTaskCount: true },
  },
  sprints: {
    sprints: [],
    defaultDurationDays: 14,
    showBacklogInSprint: true,
  },
  autoAssign: {},
  focus: {
    ambientSound: "",
    ambientVolume: 0.3,
    soundEnabled: true,
    notificationsEnabled: true,
  },
  categories: {
    personCategories: [],
    projectCategories: [],
  },
  calendar: {},
});

// Helper to create a test todo
const createTestTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: overrides.id || "test-todo-1",
  text: overrides.text || "Test todo",
  plainText: overrides.plainText || "Test todo",
  state: overrides.state || "active",
  metadata: overrides.metadata || {},
  createdAt: overrides.createdAt || new Date().toISOString(),
  updatedAt: overrides.updatedAt || new Date().toISOString(),
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
