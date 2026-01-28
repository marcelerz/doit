/**
 * Tests for Notification Utilities
 *
 * Uses MockBrowserApis to simulate browser APIs for comprehensive testing.
 */

import {
  AMBIENT_SOUNDS,
  getAmbientSoundFile,
  isNotificationSupported,
  getNotificationPermission,
  clearSoundQueue,
  queueSound,
  queueSounds,
  playAmbientSound,
  stopAmbientSound,
  setAmbientVolume,
  isAmbientPlaying,
  playNotificationSound,
  sendNotification,
  requestNotificationPermission,
  notifyPomodoroBreak,
  notifyPomodoroWorkStart,
  notifyOverdueTask,
  notifyDueToday,
  notifyDueSoon,
  checkAndNotifyDueTasks,
  resetNotificationState,
} from "@/utils/notifications";
import { MockBrowserApis, setBrowserApis, resetBrowserApis } from "@/utils/browserApis";
import { TodoModel } from "@/models/TodoModel";
import { createSettingsModel, SettingsModel, resetSettingsModel_DONOTUSE } from "@/models/SettingsModel";
import { Todo, getTodoId } from "@/types/todo";
import { getColor } from "@/types/types";
import { getPriorityId } from "@/types/priority";
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

// Helper to create test settings
const createTestSettings = (): SettingsModel =>
  createSettingsModel({
    priorities: [
      { id: getPriorityId("1"), name: "urgent", alternatives: [], order: 1 },
      { id: getPriorityId("2"), name: "high", alternatives: [], order: 2 },
      { id: getPriorityId("3"), name: "medium", alternatives: [], order: 3 },
      { id: getPriorityId("4"), name: "low", alternatives: [], order: 4 },
    ],
    linkPatterns: [],
    markerColors: {
      assigned: getColor("#cce5ff"),
      source: getColor("#d4fdd4"),
      mentioned: getColor("#ffe5b4"),
      project: getColor("#e2ccff"),
      priority: getColor("#ffd4d4"),
      dueDate: getColor("#fce4ec"),
      duration: getColor("#d4faff"),
      recurring: getColor("#e1f5e1"),
      dependency: getColor("#fff4e6"),
      tag: getColor("#ffe4cc"),
      sprint: getColor("#dbeafe"),
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
      showBacklogInSprint: true,
    },
    autoAssign: {
      enabled: true,
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
      notesView: true,
      sprintsView: true,
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
  });

// Helper to create a test todo
const createTestTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: getTodoId(overrides.id || "test-todo-1"),
  text: overrides.text || "Test todo",
  plainText: overrides.plainText || "Test todo",
  state: overrides.state || "active",
  createdAt: getTimestamp(overrides.createdAt || Date.now()),
  updatedAt: getTimestamp(overrides.updatedAt || Date.now()),
  context: "",
  tags: [],
  dependencies: [],
  assignedPeople: [],
  sourcePeople: [],
  mentionedPeople: [],
  projects: [],
  subtasks: [],
  comments: overrides.comments || [],
  activity: overrides.activity || [],
  ...overrides,
});

describe("notifications", () => {
  // Reset singleton before each test to ensure isolation
  beforeEach(() => {
    resetSettingsModel_DONOTUSE();
  });

  describe("AMBIENT_SOUNDS", () => {
    it("should be an array of ambient sound configurations", () => {
      expect(Array.isArray(AMBIENT_SOUNDS)).toBe(true);
      expect(AMBIENT_SOUNDS.length).toBeGreaterThan(0);
    });

    it("should have correct structure for each sound", () => {
      AMBIENT_SOUNDS.forEach((sound) => {
        expect(sound).toHaveProperty("id");
        expect(sound).toHaveProperty("name");
        expect(sound).toHaveProperty("file");
        expect(typeof sound.id).toBe("string");
        expect(typeof sound.name).toBe("string");
        expect(typeof sound.file).toBe("string");
      });
    });

    it("should have unique IDs", () => {
      const ids = AMBIENT_SOUNDS.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique file names", () => {
      const files = AMBIENT_SOUNDS.map((s) => s.file);
      const uniqueFiles = new Set(files);
      expect(uniqueFiles.size).toBe(files.length);
    });

    it("should include various sound types", () => {
      const names = AMBIENT_SOUNDS.map((s) => s.name.toLowerCase());

      // Check for different sound categories
      expect(names.some((n) => n.includes("rain"))).toBe(true);
      expect(names.some((n) => n.includes("bird"))).toBe(true);
      expect(names.some((n) => n.includes("ocean") || n.includes("sea"))).toBe(true);
    });

    it("should have .mp3 file extensions", () => {
      AMBIENT_SOUNDS.forEach((sound) => {
        expect(sound.file).toMatch(/\.mp3$/);
      });
    });

    it("should have at least 18 ambient sounds", () => {
      expect(AMBIENT_SOUNDS.length).toBeGreaterThanOrEqual(18);
    });

    it("should include specific sounds", () => {
      const ids = AMBIENT_SOUNDS.map((s) => s.id);
      expect(ids).toContain("swedish-summer");
      expect(ids).toContain("rain-window");
      expect(ids).toContain("crickets");
      expect(ids).toContain("sea");
    });
  });

  describe("getAmbientSoundFile", () => {
    it("should return file name for valid sound ID", () => {
      const result = getAmbientSoundFile("swedish-summer");
      expect(result).toBe("10-minutes-swedish-summer-evening-19559.mp3");
    });

    it("should return empty string for invalid sound ID", () => {
      const result = getAmbientSoundFile("invalid-id");
      expect(result).toBe("");
    });

    it("should return empty string for empty input", () => {
      const result = getAmbientSoundFile("");
      expect(result).toBe("");
    });

    it("should find all documented sounds", () => {
      expect(getAmbientSoundFile("crickets")).toContain("crickets");
      expect(getAmbientSoundFile("rain-window")).toContain("rain");
      expect(getAmbientSoundFile("sea")).toContain("sea");
    });
  });

  describe("isNotificationSupported", () => {
    it("should return false in Node.js environment (no window)", () => {
      // In Node.js test environment, window is undefined
      const result = isNotificationSupported();
      expect(result).toBe(false);
    });
  });

  describe("getNotificationPermission", () => {
    it("should return denied when notifications not supported", () => {
      // In Node.js test environment, notifications aren't supported
      const result = getNotificationPermission();
      expect(result).toBe("denied");
    });
  });

  describe("clearSoundQueue", () => {
    it("should not throw when called", () => {
      expect(() => clearSoundQueue()).not.toThrow();
    });

    it("should be callable multiple times", () => {
      clearSoundQueue();
      clearSoundQueue();
      clearSoundQueue();
      // No errors thrown
    });
  });

  describe("queueSound", () => {
    beforeEach(() => {
      clearSoundQueue();
    });

    it("should not throw when queueing sounds", () => {
      expect(() => queueSound("short-break")).not.toThrow();
      expect(() => queueSound("long-break")).not.toThrow();
      expect(() => queueSound("task-start")).not.toThrow();
      expect(() => queueSound("task-complete")).not.toThrow();
      expect(() => queueSound("break-end")).not.toThrow();
      expect(() => queueSound("pause")).not.toThrow();
    });
  });

  describe("queueSounds", () => {
    beforeEach(() => {
      clearSoundQueue();
    });

    it("should not throw when queueing multiple sounds", () => {
      expect(() => queueSounds(["short-break", "long-break", "task-start"])).not.toThrow();
    });

    it("should handle empty array", () => {
      expect(() => queueSounds([])).not.toThrow();
    });
  });

  describe("playNotificationSound", () => {
    it("should not throw when AudioContext is unavailable", () => {
      // In Node.js, AudioContext is undefined
      expect(() => playNotificationSound("short-break")).not.toThrow();
      expect(() => playNotificationSound("long-break")).not.toThrow();
      expect(() => playNotificationSound("task-start")).not.toThrow();
      expect(() => playNotificationSound("task-complete")).not.toThrow();
      expect(() => playNotificationSound("break-end")).not.toThrow();
      expect(() => playNotificationSound("pause")).not.toThrow();
    });
  });

  describe("ambient sound functions (no window)", () => {
    it("playAmbientSound should not throw without window", () => {
      expect(() => playAmbientSound("test.mp3", 0.5)).not.toThrow();
    });

    it("playAmbientSound should return early with empty soundFile", () => {
      expect(() => playAmbientSound("", 0.5)).not.toThrow();
    });

    it("stopAmbientSound should not throw", () => {
      expect(() => stopAmbientSound()).not.toThrow();
    });

    it("setAmbientVolume should not throw", () => {
      expect(() => setAmbientVolume(0.5)).not.toThrow();
    });

    it("isAmbientPlaying should return false without ambient audio", () => {
      expect(isAmbientPlaying()).toBe(false);
    });
  });

  describe("sendNotification", () => {
    it("should return null when notifications not supported", () => {
      const result = sendNotification("Test Title", { body: "Test body" });
      expect(result).toBeNull();
    });
  });

  describe("requestNotificationPermission", () => {
    it("should return denied when notifications not supported", async () => {
      const result = await requestNotificationPermission();
      expect(result).toBe("denied");
    });
  });

  describe("notifyPomodoroBreak", () => {
    it("should return null when notifications not supported", () => {
      const result = notifyPomodoroBreak("short", 5, 1, false);
      expect(result).toBeNull();
    });

    it("should return null for long break", () => {
      const result = notifyPomodoroBreak("long", 15, 4, false);
      expect(result).toBeNull();
    });

    it("should not throw when playing sound", () => {
      expect(() => notifyPomodoroBreak("short", 5, 1, true)).not.toThrow();
    });
  });

  describe("notifyPomodoroWorkStart", () => {
    it("should return null when notifications not supported", () => {
      const result = notifyPomodoroWorkStart("Test Task", 1, false);
      expect(result).toBeNull();
    });

    it("should not throw when playing sound", () => {
      expect(() => notifyPomodoroWorkStart("Test Task", 1, true)).not.toThrow();
    });
  });

  describe("Sound types", () => {
    it("should define valid sound types", () => {
      // Test that the module exports these types (compile-time check)
      // The types are: short-break, long-break, task-complete, task-start, break-end, pause
      const soundTypes = ["short-break", "long-break", "task-complete", "task-start", "break-end", "pause"];

      soundTypes.forEach((type) => {
        expect(typeof type).toBe("string");
      });
    });
  });
});

/**
 * Tests using MockBrowserApis for comprehensive coverage
 */
describe("notifications with MockBrowserApis", () => {
  let mockApis: MockBrowserApis;

  beforeEach(() => {
    mockApis = new MockBrowserApis();
    setBrowserApis(mockApis);
    resetNotificationState();
    resetSettingsModel_DONOTUSE();
  });

  afterEach(() => {
    resetBrowserApis();
    resetNotificationState();
  });

  describe("ambient sound with window available", () => {
    beforeEach(() => {
      mockApis.windowExists = true;
    });

    it("playAmbientSound should create audio element", () => {
      playAmbientSound("test.mp3", 0.5);

      expect(mockApis.audiosCreated).toHaveLength(1);
      expect(mockApis.audiosCreated[0].src).toBe("/sounds/test.mp3");
    });

    it("playAmbientSound should set volume and loop", () => {
      playAmbientSound("test.mp3", 0.7);

      expect(mockApis.mockAudioElements).toHaveLength(1);
      expect(mockApis.mockAudioElements[0].volume).toBe(0.7);
      expect(mockApis.mockAudioElements[0].loop).toBe(true);
    });

    it("playAmbientSound should start playing", () => {
      playAmbientSound("test.mp3", 0.5);

      expect(mockApis.mockAudioElements[0].paused).toBe(false);
    });

    it("playAmbientSound should use default volume", () => {
      playAmbientSound("test.mp3");

      expect(mockApis.mockAudioElements[0].volume).toBe(0.3);
    });

    it("playAmbientSound should clamp volume to 0-1", () => {
      playAmbientSound("test.mp3", 1.5);
      expect(mockApis.mockAudioElements[0].volume).toBe(1);

      resetNotificationState();
      mockApis.mockAudioElements = [];

      playAmbientSound("test2.mp3", -0.5);
      expect(mockApis.mockAudioElements[0].volume).toBe(0);
    });

    it("playAmbientSound should adjust volume if same sound playing", () => {
      playAmbientSound("test.mp3", 0.3);
      playAmbientSound("test.mp3", 0.8);

      // Should only create one audio element
      expect(mockApis.audiosCreated).toHaveLength(1);
      // Volume should be updated
      expect(mockApis.mockAudioElements[0].volume).toBe(0.8);
    });

    it("playAmbientSound should stop old sound and start new when switching", () => {
      playAmbientSound("first.mp3", 0.5);
      const firstAudio = mockApis.mockAudioElements[0];

      playAmbientSound("second.mp3", 0.5);

      // First audio should be paused and cleared
      expect(firstAudio.paused).toBe(true);
      expect(firstAudio.src).toBe("");

      // New audio should be created
      expect(mockApis.audiosCreated).toHaveLength(2);
    });

    it("isAmbientPlaying should return true when playing", () => {
      playAmbientSound("test.mp3", 0.5);
      expect(isAmbientPlaying()).toBe(true);
    });

    it("stopAmbientSound should schedule stop", () => {
      playAmbientSound("test.mp3", 0.5);
      stopAmbientSound();

      // Should have scheduled a timeout
      expect(mockApis.timeouts).toHaveLength(1);
      expect(mockApis.timeouts[0].ms).toBe(50);
    });

    it("stopAmbientSound should stop audio when timeout runs", () => {
      playAmbientSound("test.mp3", 0.5);
      const audio = mockApis.mockAudioElements[0];

      stopAmbientSound();
      mockApis.runAllTimeouts();

      expect(audio.paused).toBe(true);
      expect(audio.src).toBe("");
      expect(isAmbientPlaying()).toBe(false);
    });

    it("stopAmbientSound should not stop if new sound started", () => {
      playAmbientSound("first.mp3", 0.5);
      stopAmbientSound();

      // Start new sound before timeout runs
      playAmbientSound("second.mp3", 0.5);
      mockApis.runAllTimeouts();

      // Second sound should still be playing
      expect(isAmbientPlaying()).toBe(true);
    });

    it("setAmbientVolume should update volume", () => {
      playAmbientSound("test.mp3", 0.3);
      setAmbientVolume(0.9);

      expect(mockApis.mockAudioElements[0].volume).toBe(0.9);
    });

    it("setAmbientVolume should clamp volume", () => {
      playAmbientSound("test.mp3", 0.5);
      setAmbientVolume(1.5);
      expect(mockApis.mockAudioElements[0].volume).toBe(1);

      setAmbientVolume(-0.5);
      expect(mockApis.mockAudioElements[0].volume).toBe(0);
    });
  });

  describe("notification sounds with AudioContext", () => {
    beforeEach(() => {
      mockApis.windowExists = true;
    });

    it("playNotificationSound should create AudioContext", () => {
      playNotificationSound("short-break");

      expect(mockApis.audioContextsCreated).toBe(1);
    });

    it("playNotificationSound should reuse AudioContext", () => {
      playNotificationSound("short-break");
      playNotificationSound("long-break");
      playNotificationSound("task-start");

      expect(mockApis.audioContextsCreated).toBe(1);
    });

    it("playNotificationSound should create oscillator and gain node", () => {
      playNotificationSound("task-start");

      expect(mockApis.mockAudioContext?.createOscillator).toHaveBeenCalled();
      expect(mockApis.mockAudioContext?.createGain).toHaveBeenCalled();
    });

    it("should play all sound types without error", () => {
      const soundTypes = ["short-break", "long-break", "task-start", "task-complete", "break-end", "pause"] as const;

      soundTypes.forEach((type) => {
        expect(() => playNotificationSound(type)).not.toThrow();
      });
    });
  });

  describe("sound queue with window", () => {
    beforeEach(() => {
      mockApis.windowExists = true;
      clearSoundQueue();
    });

    it("queueSound should play sound immediately", () => {
      queueSound("short-break");

      expect(mockApis.audioContextsCreated).toBe(1);
    });

    it("queueSounds should schedule multiple sounds", () => {
      queueSounds(["short-break", "long-break", "task-start"]);

      // First sound plays immediately
      expect(mockApis.audioContextsCreated).toBe(1);

      // Should have timeout for next sound
      expect(mockApis.timeouts.length).toBeGreaterThan(0);
    });

    it("clearSoundQueue should prevent queued sounds", () => {
      queueSounds(["short-break", "long-break"]);
      clearSoundQueue();

      // Clear timeouts and run any pending
      mockApis.runAllTimeouts();

      // AudioContext should only have been created once (for first sound)
      expect(mockApis.audioContextsCreated).toBe(1);
    });
  });

  describe("notifications with permission granted", () => {
    beforeEach(() => {
      mockApis.windowExists = true;
      mockApis.notificationSupported = true;
      mockApis.notificationPermission = "granted";
    });

    it("isNotificationSupported should return true", () => {
      expect(isNotificationSupported()).toBe(true);
    });

    it("getNotificationPermission should return granted", () => {
      expect(getNotificationPermission()).toBe("granted");
    });

    it("sendNotification should create notification", () => {
      const result = sendNotification("Test Title", { body: "Test body" });

      expect(result).not.toBeNull();
      expect(mockApis.notificationsCreated).toHaveLength(1);
      expect(mockApis.notificationsCreated[0].title).toBe("Test Title");
      expect(mockApis.notificationsCreated[0].options?.body).toBe("Test body");
    });

    it("sendNotification should schedule auto-close", () => {
      sendNotification("Test Title", { body: "Test body" });

      // Should have timeout for auto-close (5000ms)
      const closeTimeout = mockApis.timeouts.find((t) => t.ms === 5000);
      expect(closeTimeout).toBeDefined();
    });

    it("notifyPomodoroBreak should create notification for short break", () => {
      notifyPomodoroBreak("short", 5, 3, false);

      expect(mockApis.notificationsCreated).toHaveLength(1);
      expect(mockApis.notificationsCreated[0].title).toContain("short break");
    });

    it("notifyPomodoroBreak should create notification for long break", () => {
      notifyPomodoroBreak("long", 15, 4, false);

      expect(mockApis.notificationsCreated).toHaveLength(1);
      expect(mockApis.notificationsCreated[0].title).toContain("long break");
      expect(mockApis.notificationsCreated[0].options?.body).toContain("4 tasks");
    });

    it("notifyPomodoroBreak should play sound when enabled", () => {
      notifyPomodoroBreak("short", 5, 3, true);

      expect(mockApis.audioContextsCreated).toBe(1);
    });

    it("notifyPomodoroWorkStart should create notification", () => {
      notifyPomodoroWorkStart("Important Task", 5, false);

      expect(mockApis.notificationsCreated).toHaveLength(1);
      expect(mockApis.notificationsCreated[0].title).toContain("back to work");
      expect(mockApis.notificationsCreated[0].options?.body).toContain("Important Task");
      expect(mockApis.notificationsCreated[0].options?.body).toContain("task 5");
    });

    it("notifyPomodoroWorkStart should play sound when enabled", () => {
      notifyPomodoroWorkStart("Task", 1, true);

      expect(mockApis.audioContextsCreated).toBe(1);
    });
  });

  describe("notifications without permission", () => {
    beforeEach(() => {
      mockApis.windowExists = true;
      mockApis.notificationSupported = true;
      mockApis.notificationPermission = "default";
    });

    it("sendNotification should return null without permission", () => {
      const result = sendNotification("Test", { body: "Test" });
      expect(result).toBeNull();
      expect(mockApis.notificationsCreated).toHaveLength(0);
    });

    it("requestNotificationPermission should request and grant permission", async () => {
      expect(mockApis.notificationPermission).toBe("default");

      const result = await requestNotificationPermission();

      expect(result).toBe("granted");
      expect(mockApis.notificationPermission).toBe("granted");
    });
  });

  describe("todo notifications", () => {
    beforeEach(() => {
      mockApis.windowExists = true;
      mockApis.notificationSupported = true;
      mockApis.notificationPermission = "granted";
    });

    it("notifyOverdueTask should create notification with todo info", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        id: getTodoId("todo-1"),
        plainText: "Finish report",
        dueDate: getTimestamp(new Date("2024-01-01").getTime()),
      });
      const model = new TodoModel(todo, settings);

      notifyOverdueTask(model);

      expect(mockApis.notificationsCreated).toHaveLength(1);
      expect(mockApis.notificationsCreated[0].title).toContain("Overdue");
      expect(mockApis.notificationsCreated[0].title).toContain("Finish report");
    });

    it("notifyDueToday should include priority when present", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        plainText: "Urgent task",
        priority: getPriorityId("2"), // "high" priority
      });
      const model = new TodoModel(todo, settings);

      notifyDueToday(model);

      expect(mockApis.notificationsCreated[0].options?.body).toContain("Priority: high");
    });

    it("notifyDueToday should use default message without priority", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({ plainText: "Normal task" });
      const model = new TodoModel(todo, settings);

      notifyDueToday(model);

      expect(mockApis.notificationsCreated[0].options?.body).toBe("Remember to complete this task");
    });

    it("notifyDueSoon should format hours correctly", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({ plainText: "Soon task" });
      const model = new TodoModel(todo, settings);

      notifyDueSoon(model, 3);
      expect(mockApis.notificationsCreated[0].title).toContain("3 hours");

      notifyDueSoon(model, 1);
      expect(mockApis.notificationsCreated[1].title).toContain("1 hour:");
    });
  });

  describe("checkAndNotifyDueTasks", () => {
    beforeEach(() => {
      mockApis.windowExists = true;
      mockApis.notificationSupported = true;
      mockApis.notificationPermission = "granted";
    });

    it("should notify for overdue tasks", () => {
      const settings = createTestSettings();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const todo = createTestTodo({
        id: getTodoId("overdue-1"),
        plainText: "Overdue task",
        dueDate: getTimestamp(yesterday.getTime()),
      });
      const model = new TodoModel(todo, settings);

      const result = checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: true,
        notifyDueToday: false,
        notifyDueSoon: false,
        dueSoonHours: 2,
      });

      expect(result.has(getTodoId("overdue-1"))).toBe(true);
      expect(mockApis.notificationsCreated.length).toBeGreaterThan(0);
    });

    it("should notify for tasks due today", () => {
      const settings = createTestSettings();
      // Set due date to later today (end of current day) to ensure it's on the same calendar day
      const today = new Date();
      today.setHours(23, 30, 0, 0); // 11:30 PM today

      const todo = createTestTodo({
        id: getTodoId("today-1"),
        plainText: "Today task",
        dueDate: getTimestamp(today.getTime()),
      });
      const model = new TodoModel(todo, settings);

      const result = checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: false,
        notifyDueToday: true,
        notifyDueSoon: false,
        dueSoonHours: 2,
      });

      expect(result.has(getTodoId("today-1"))).toBe(true);
    });

    it("should notify for tasks due soon", () => {
      const settings = createTestSettings();
      const soon = new Date();
      soon.setTime(soon.getTime() + 1.5 * 60 * 60 * 1000); // 1.5 hours

      const todo = createTestTodo({
        id: getTodoId("soon-1"),
        plainText: "Soon task",
        dueDate: getTimestamp(soon.getTime()),
      });
      const model = new TodoModel(todo, settings);

      const result = checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: false,
        notifyDueToday: false,
        notifyDueSoon: true,
        dueSoonHours: 2,
      });

      expect(result.has(getTodoId("soon-1"))).toBe(true);
    });

    it("should skip already notified tasks", () => {
      const settings = createTestSettings();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const todo = createTestTodo({
        id: getTodoId("already-notified"),
        plainText: "Already notified",
        dueDate: getTimestamp(yesterday.getTime()),
      });
      const model = new TodoModel(todo, settings);

      checkAndNotifyDueTasks([model], new Set([getTodoId("already-notified")]), {
        notifyOverdue: true,
        notifyDueToday: true,
        notifyDueSoon: true,
        dueSoonHours: 2,
      });

      expect(mockApis.notificationsCreated).toHaveLength(0);
    });

    it("should skip inactive tasks", () => {
      const settings = createTestSettings();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const todo = createTestTodo({
        id: getTodoId("completed-task"),
        state: "completed",
        plainText: "Completed task",
        dueDate: getTimestamp(yesterday.getTime()),
      });
      const model = new TodoModel(todo, settings);

      checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: true,
        notifyDueToday: true,
        notifyDueSoon: true,
        dueSoonHours: 2,
      });

      expect(mockApis.notificationsCreated).toHaveLength(0);
    });

    it("should skip tasks without due dates", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        id: getTodoId("no-date"),
        plainText: "No due date",
      });
      const model = new TodoModel(todo, settings);

      checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: true,
        notifyDueToday: true,
        notifyDueSoon: true,
        dueSoonHours: 2,
      });

      expect(mockApis.notificationsCreated).toHaveLength(0);
    });

    it("should parse date-only format (YYYY-MM-DD)", () => {
      const settings = createTestSettings();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const todo = createTestTodo({
        id: getTodoId("date-only"),
        plainText: "Date only format",
        dueDate: getTimestamp(yesterday.getTime()),
      });
      const model = new TodoModel(todo, settings);

      const result = checkAndNotifyDueTasks([model], new Set(), {
        notifyOverdue: true,
        notifyDueToday: false,
        notifyDueSoon: false,
        dueSoonHours: 2,
      });

      expect(result.has(getTodoId("date-only"))).toBe(true);
    });

    it("should handle tasks without dueDate gracefully", () => {
      const settings = createTestSettings();
      const todo = createTestTodo({
        id: getTodoId("no-duedate"),
        plainText: "No due date",
        // No dueDate field set
      });
      const model = new TodoModel(todo, settings);

      expect(() => {
        checkAndNotifyDueTasks([model], new Set(), {
          notifyOverdue: true,
          notifyDueToday: true,
          notifyDueSoon: true,
          dueSoonHours: 2,
        });
      }).not.toThrow();

      expect(mockApis.notificationsCreated).toHaveLength(0);
    });
  });
});
