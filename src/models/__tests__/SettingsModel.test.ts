import { createSettingsModel, resetSettingsModel_DONOTUSE } from "../SettingsModel";
import { getFocusModeId } from "@/types/focusMode";
import { Settings, defaultSettings, defaultWorkHoursSettings } from "@/types/settings";
import { getPriorityId } from "@/types/priority";
import { getKanbanStateId } from "@/types/kanbanState";
import { getShortTime, getWeekday, getMonth } from "@/types/time";

describe("SettingsModel", () => {
  // Reset singleton before each test to ensure isolation
  beforeEach(() => {
    resetSettingsModel_DONOTUSE();
  });

  const createTestSettings = (overrides: Partial<Settings> = {}): Settings => ({
    ...defaultSettings,
    ...overrides,
  });

  describe("basic properties", () => {
    it("should expose raw settings", () => {
      const settings = createTestSettings();
      const model = createSettingsModel(settings);

      expect(model.raw_DONOTUSE).toBe(settings);
    });
  });

  describe("work hours & schedule", () => {
    it("should get schedule for weekday with common schedule", () => {
      const settings = createTestSettings({
        workHours: {
          ...defaultWorkHoursSettings,
          useCommonSchedule: true,
          commonSchedule: {
            startTime: getShortTime("08:00"),
            endTime: getShortTime("16:00"),
            breaks: [],
          },
        },
      });
      const model = createSettingsModel(settings);

      // Monday
      const monday = new Date(2025, 11, 15); // December 15, 2025 is Monday
      const schedule = model.getScheduleForDate(monday);

      expect(schedule.startTime).toBe("08:00");
      expect(schedule.endTime).toBe("16:00");
    });

    it("should get schedule for weekend when not using common schedule", () => {
      const settings = createTestSettings({
        workHours: {
          ...defaultWorkHoursSettings,
          useCommonSchedule: false,
          weekdaySchedule: {
            startTime: getShortTime("09:00"),
            endTime: getShortTime("17:00"),
            breaks: [],
          },
          weekendSchedule: {
            startTime: getShortTime("10:00"),
            endTime: getShortTime("14:00"),
            breaks: [],
          },
        },
      });
      const model = createSettingsModel(settings);

      // Saturday
      const saturday = new Date(2025, 11, 20); // December 20, 2025 is Saturday
      const schedule = model.getScheduleForDate(saturday);

      expect(schedule.startTime).toBe("10:00");
      expect(schedule.endTime).toBe("14:00");
    });

    it("should use custom schedule when defined for specific day", () => {
      const settings = createTestSettings({
        workHours: {
          ...defaultWorkHoursSettings,
          useCommonSchedule: false,
          customSchedules: {
            friday: {
              startTime: getShortTime("09:00"),
              endTime: getShortTime("15:00"),
              breaks: [],
            },
          },
        },
      });
      const model = createSettingsModel(settings);

      // Friday
      const friday = new Date(2025, 11, 19); // December 19, 2025 is Friday
      const schedule = model.getScheduleForDate(friday);

      expect(schedule.startTime).toBe("09:00");
      expect(schedule.endTime).toBe("15:00");
    });

    it("should get BOD and EOD for a date", () => {
      const settings = createTestSettings({
        workHours: {
          ...defaultWorkHoursSettings,
          useCommonSchedule: true,
          commonSchedule: {
            startTime: getShortTime("08:30"),
            endTime: getShortTime("17:30"),
            breaks: [],
          },
        },
      });
      const model = createSettingsModel(settings);

      const date = new Date(2025, 11, 15);
      expect(model.getBod(date)).toBe("08:30");
      expect(model.getEod(date)).toBe("17:30");
    });

    it("should identify weekend days", () => {
      const model = createSettingsModel(defaultSettings);

      const saturday = new Date(2025, 11, 20);
      const sunday = new Date(2025, 11, 21);
      const monday = new Date(2025, 11, 22);

      expect(model.isWeekend(saturday)).toBe(true);
      expect(model.isWeekend(sunday)).toBe(true);
      expect(model.isWeekend(monday)).toBe(false);
    });

    it("should get day name", () => {
      const model = createSettingsModel(defaultSettings);

      const monday = new Date(2025, 11, 15);
      const friday = new Date(2025, 11, 19);

      expect(model.getDayName(monday)).toBe("monday");
      expect(model.getDayName(friday)).toBe("friday");
    });
  });

  describe("date/time settings", () => {
    it("should return time settings", () => {
      const settings = createTestSettings({
        dateTime: {
          morning: getShortTime("07:00"),
          noon: getShortTime("12:30"),
          afternoon: getShortTime("14:00"),
          evening: getShortTime("18:00"),
          workWeekStart: getWeekday(1),
          workWeekEnd: getWeekday(5),
          fiscalYearStart: getMonth(4),
        },
      });
      const model = createSettingsModel(settings);

      expect(model.morningTime).toBe("07:00");
      expect(model.noonTime).toBe("12:30");
      expect(model.afternoonTime).toBe("14:00");
      expect(model.eveningTime).toBe("18:00");
      expect(model.workWeekStart).toBe(1);
      expect(model.fiscalYearStart).toBe(4);
    });
  });

  describe("priority lookups", () => {
    it("should return priorities sorted by order", () => {
      const settings = createTestSettings({
        priorities: [
          { id: getPriorityId("1"), name: "low", alternatives: [], order: 3 },
          { id: getPriorityId("2"), name: "high", alternatives: [], order: 1 },
          { id: getPriorityId("3"), name: "medium", alternatives: [], order: 2 },
        ],
      });
      const model = createSettingsModel(settings);

      const priorities = model.priorities;
      expect(priorities[0].name).toBe("high");
      expect(priorities[1].name).toBe("medium");
      expect(priorities[2].name).toBe("low");
    });

    it("should find priority by name (case-insensitive)", () => {
      const settings = createTestSettings({
        priorities: [{ id: getPriorityId("1"), name: "High", alternatives: ["urgent"], order: 1 }],
      });
      const model = createSettingsModel(settings);

      expect(model.findPriority("high")?.name).toBe("High");
      expect(model.findPriority("HIGH")?.name).toBe("High");
      expect(model.findPriority("urgent")?.name).toBe("High");
      expect(model.findPriority("nonexistent")).toBeNull();
    });

    it("should get priority order", () => {
      const settings = createTestSettings({
        priorities: [
          { id: getPriorityId("1"), name: "high", alternatives: [], order: 1 },
          { id: getPriorityId("2"), name: "low", alternatives: [], order: 3 },
        ],
      });
      const model = createSettingsModel(settings);

      expect(model.getPriorityOrder("high")).toBe(1);
      expect(model.getPriorityOrder("low")).toBe(3);
      expect(model.getPriorityOrder("unknown")).toBe(999);
    });

    it("should validate priority names", () => {
      const settings = createTestSettings({
        priorities: [{ id: getPriorityId("1"), name: "high", alternatives: ["urgent"], order: 1 }],
      });
      const model = createSettingsModel(settings);

      expect(model.isValidPriority("high")).toBe(true);
      expect(model.isValidPriority("urgent")).toBe(true);
      expect(model.isValidPriority("invalid")).toBe(false);
    });
  });

  describe("color lookups", () => {
    it("should return marker colors", () => {
      const model = createSettingsModel(defaultSettings);

      expect(model.assignedColor).toBe(defaultSettings.markerColors.assigned);
      expect(model.projectColor).toBe(defaultSettings.markerColors.project);
      expect(model.priorityColor).toBe(defaultSettings.markerColors.priority);
    });
  });

  describe("kanban lookups", () => {
    it("should return kanban states sorted by order", () => {
      const model = createSettingsModel(defaultSettings);
      const states = model.kanbanStates;

      // Should be sorted by order
      for (let i = 1; i < states.length; i++) {
        expect(states[i].order).toBeGreaterThanOrEqual(states[i - 1].order);
      }
    });

    it("should find kanban state by ID", () => {
      const model = createSettingsModel(defaultSettings);
      const firstState = defaultSettings.kanban.states[0];

      expect(model.findKanbanState(firstState.id)?.id).toBe(firstState.id);
      expect(model.findKanbanState("nonexistent")).toBeNull();
    });

    it("should separate system and custom states", () => {
      const model = createSettingsModel(defaultSettings);

      const systemStates = model.systemKanbanStates;
      const customStates = model.customKanbanStates;

      expect(systemStates.every((s) => s.isSystem)).toBe(true);
      expect(customStates.every((s) => !s.isSystem)).toBe(true);
    });

    it("should check transition allowance", () => {
      const settings = createTestSettings({
        kanban: {
          ...defaultSettings.kanban,
          allowedTransitions: [{ fromStateId: getKanbanStateId("state-1"), toStateId: getKanbanStateId("state-2") }],
        },
      });
      const model = createSettingsModel(settings);

      expect(model.isTransitionAllowed(getKanbanStateId("state-1"), getKanbanStateId("state-2"))).toBe(true);
      expect(model.isTransitionAllowed(getKanbanStateId("state-2"), getKanbanStateId("state-1"))).toBe(false);
    });
  });

  describe("feature toggles", () => {
    it("should check if features are enabled", () => {
      const settings = createTestSettings({
        features: {
          ...defaultSettings.features,
          ganttView: false,
          kanbanView: true,
        },
      });
      const model = createSettingsModel(settings);

      expect(model.isGanttViewEnabled).toBe(false);
      expect(model.isKanbanViewEnabled).toBe(true);
      expect(model.isFeatureEnabled("ganttView")).toBe(false);
      expect(model.isFeatureEnabled("kanbanView")).toBe(true);
    });
  });

  describe("auto-assign settings", () => {
    it("should return auto-assign settings when enabled", () => {
      const settings = createTestSettings({
        autoAssign: {
          enabled: true,
          assignedPerson: "John",
          project: "MyProject",
          priority: "high",
          dueDate: "today",
          duration: "30m",
        },
      });
      const model = createSettingsModel(settings);

      expect(model.isAutoAssignEnabled).toBe(true);
      expect(model.defaultAssignedPerson).toBe("John");
      expect(model.defaultProject).toBe("MyProject");
      expect(model.defaultPriority).toBe("high");
      expect(model.defaultDueDate).toBe("today");
      expect(model.defaultDuration).toBe("30m");
    });

    it("should return undefined for defaults when auto-assign disabled", () => {
      const settings = createTestSettings({
        autoAssign: {
          enabled: false,
          assignedPerson: "John",
          project: "MyProject",
          priority: "high",
          dueDate: "today",
          duration: "30m",
        },
      });
      const model = createSettingsModel(settings);

      expect(model.isAutoAssignEnabled).toBe(false);
      expect(model.defaultAssignedPerson).toBeUndefined();
      expect(model.defaultProject).toBeUndefined();
      expect(model.defaultPriority).toBeUndefined();
      expect(model.defaultDueDate).toBeUndefined();
      expect(model.defaultDuration).toBeUndefined();
    });
  });

  describe("notification settings", () => {
    it("should return notification settings", () => {
      const settings = createTestSettings({
        notifications: {
          ...defaultSettings.notifications,
          enabled: true,
          notifyOverdue: true,
          notifyDueToday: false,
          notifyDueSoon: true,
        },
      });
      const model = createSettingsModel(settings);

      expect(model.areNotificationsEnabled).toBe(true);
      expect(model.notifyOnOverdue).toBe(true);
      expect(model.notifyOnDueToday).toBe(false);
      expect(model.notifyOnDueSoon).toBe(true);
    });

    it("should return false for notification types when notifications disabled", () => {
      const settings = createTestSettings({
        notifications: {
          ...defaultSettings.notifications,
          enabled: false,
          notifyOverdue: true,
        },
      });
      const model = createSettingsModel(settings);

      expect(model.areNotificationsEnabled).toBe(false);
      expect(model.notifyOnOverdue).toBe(false); // Should be false even though notifyOverdue is true
    });
  });

  describe("general settings", () => {
    it("should return general settings", () => {
      const model = createSettingsModel(defaultSettings);

      expect(model.archiveDays).toBe(defaultSettings.general.archiveDays);
      expect(model.isAutoDeleteEnabled).toBe(defaultSettings.general.autoDelete.enabled);
      expect(model.deleteDays).toBe(defaultSettings.general.autoDelete.deleteDays);
      expect(model.theme).toBe(defaultSettings.general.theme);
    });
  });

  describe("sprint settings", () => {
    it("should return sprint settings", () => {
      const model = createSettingsModel(defaultSettings);

      expect(model.defaultSprintDuration).toBe(defaultSettings.sprints.defaultSprintDuration);
      expect(model.showBacklogInSprint).toBe(defaultSettings.sprints.showBacklogInSprint);
    });
  });

  describe("focus settings", () => {
    it("should return focus settings", () => {
      const model = createSettingsModel(defaultSettings);

      expect(model.isAutoTimeTrackingEnabled).toBe(defaultSettings.focus.autoTimeTracking);
      expect(model.isFocusSoundEnabled).toBe(defaultSettings.focus.soundEnabled);
      expect(model.focusSoundVolume).toBe(defaultSettings.focus.soundVolume);
    });

    it("returns the timer's modes in order", () => {
      const model = createSettingsModel(defaultSettings);
      expect(model.focusModes.map((mode) => mode.order)).toEqual([0, 1]);
    });

    it("returns a copy of the modes, so sorting the result cannot reorder storage", () => {
      const model = createSettingsModel(defaultSettings);
      const first = model.focusModes;
      first.reverse();
      expect(model.focusModes.map((mode) => mode.order)).toEqual([0, 1]);
    });

    it("finds one mode by id, and reports a deleted one as missing", () => {
      const model = createSettingsModel(defaultSettings);
      const target = defaultSettings.focus.modes[0];
      expect(model.getFocusMode(target.id)?.name).toBe(target.name);
      expect(model.getFocusMode(getFocusModeId("gone"))).toBeNull();
    });
  });
});
