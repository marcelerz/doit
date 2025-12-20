/**
 * Tests for storage migrations
 */

import { migrateSettings, migrateTodos, getCurrentVersion } from "@/storage/migrations";
import { Todo } from "@/types/todo";
import { Settings, defaultSettings, getColor, getDurationDay } from "@/types/settings";
import { getPriorityId } from "@/types/priority";

describe("migrations", () => {
  describe("getCurrentVersion", () => {
    it("should return current migration version", () => {
      const version = getCurrentVersion();
      expect(typeof version).toBe("number");
      expect(version).toBeGreaterThan(0);
    });
  });

  describe("migrateSettings", () => {
    it("should return settings with all default fields", () => {
      const result = migrateSettings({});

      expect(result.priorities).toBeDefined();
      expect(result.linkPatterns).toBeDefined();
      expect(result.markerColors).toBeDefined();
      expect(result.general).toBeDefined();
      expect(result.dateTime).toBeDefined();
      expect(result.workHours).toBeDefined();
      expect(result.gantt).toBeDefined();
      expect(result.kanban).toBeDefined();
      expect(result.sprints).toBeDefined();
      expect(result.autoAssign).toBeDefined();
    });

    it("should preserve existing priorities", () => {
      const existingPriorities = [
        { id: getPriorityId("1"), name: "High", color: getColor("#ff0000"), order: 0 },
        { id: getPriorityId("2"), name: "Low", color: getColor("#00ff00"), order: 1 },
      ];
      const result = migrateSettings({ priorities: existingPriorities });

      expect(result.priorities).toHaveLength(2);
      expect(result.priorities[0].name).toBe("High");
    });

    it("should add alternatives to priorities if missing", () => {
      const priorities = [{ id: getPriorityId("1"), name: "High", color: getColor("#ff0000"), order: 0 }];
      const result = migrateSettings({ priorities });

      expect(result.priorities[0].alternatives).toEqual([]);
    });

    it("should migrate nested dateTime from general", () => {
      const oldSettings = {
        general: {
          dateTime: {
            morning: "08:00",
            noon: "12:00",
          },
        },
      };
      const result = migrateSettings(oldSettings);

      expect(result.dateTime.morning).toBe("08:00");
    });

    it("should migrate nested workHours from general", () => {
      const oldSettings = {
        general: {
          workHours: {
            useCommonSchedule: false,
          },
        },
      };
      const result = migrateSettings(oldSettings);

      expect(result.workHours.useCommonSchedule).toBe(false);
    });

    it("should migrate ganttSettings to gantt", () => {
      const oldSettings = {
        ganttSettings: {
          schedulingTechnique: "pomodoro",
          defaultTaskDuration: 45,
        },
      };
      const result = migrateSettings(oldSettings);

      expect(result.gantt.schedulingTechnique).toBe("pomodoro");
      expect(result.gantt.defaultTaskDuration).toBe(45);
    });

    it("should merge markerColors with defaults", () => {
      const customColors = {
        assigned: "#123456",
      };
      const result = migrateSettings({ markerColors: customColors });

      expect(result.markerColors.assigned).toBe("#123456");
      expect(result.markerColors.project).toBe(defaultSettings.markerColors.project);
    });

    it("should preserve kanban settings", () => {
      const kanban = {
        states: [{ id: "1", name: "Todo", color: getColor("#ccc"), order: 0 }],
      };
      const result = migrateSettings({ kanban });

      expect(result.kanban.states).toHaveLength(1);
    });

    it("should preserve sprints settings", () => {
      const sprints = {
        defaultSprintDuration: getDurationDay(21),
      };
      const result = migrateSettings({ sprints });

      expect(result.sprints.defaultSprintDuration).toBe(getDurationDay(21));
    });

    it("should remove startOfDay/endOfDay from dateTime", () => {
      const oldSettings = {
        dateTime: {
          morning: "09:00",
          startOfDay: "08:00",
          endOfDay: "18:00",
        },
      };
      const result = migrateSettings(oldSettings);

      expect(result.dateTime.morning).toBe("09:00");
      expect((result.dateTime as any).startOfDay).toBeUndefined();
      expect((result.dateTime as any).endOfDay).toBeUndefined();
    });
  });

  describe("migrateTodos", () => {
    const defaultTestSettings: Settings = {
      ...defaultSettings,
      general: {
        archiveDays: getDurationDay(7),
        autoDelete: {
          enabled: false,
          deleteDays: getDurationDay(30),
        },
        theme: "system",
      },
    };

    it("should return empty array for non-array input", () => {
      const result = migrateTodos(null as any, defaultTestSettings);
      expect(result).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      const result = migrateTodos(undefined as any, defaultTestSettings);
      expect(result).toEqual([]);
    });

    it("should preserve active todos", () => {
      const todos = [
        {
          id: "1",
          text: "Test todo",
          state: "active",
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result).toHaveLength(1);
      expect(result[0].state).toBe("active");
    });

    it("should migrate legacy completed boolean to state", () => {
      const todos = [
        {
          id: "1",
          text: "Completed todo",
          completed: true,
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].state).toBe("completed");
    });

    it("should migrate legacy archived boolean to state", () => {
      const todos = [
        {
          id: "1",
          text: "Archived todo",
          archived: true,
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].state).toBe("archived");
    });

    it("should ensure plainText exists", () => {
      const todos = [
        {
          id: "1",
          text: "Test todo",
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].plainText).toBe("Test todo");
    });

    it("should ensure metadata exists with all fields", () => {
      const todos = [
        {
          id: "1",
          text: "Test",
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].metadata).toBeDefined();
      expect(result[0].metadata.assignedPeople).toEqual([]);
      expect(result[0].metadata.projects).toEqual([]);
      expect(result[0].metadata.tags).toEqual([]);
    });

    it("should migrate legacy priorities array to single priority", () => {
      const todos = [
        {
          id: "1",
          text: "Test",
          metadata: { priorities: ["high", "medium"] },
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].metadata.priority).toBe("high");
    });

    it("should migrate legacy dueDates array to single dueDate", () => {
      const todos = [
        {
          id: "1",
          text: "Test",
          metadata: { dueDates: ["2025-01-01", "2025-02-01"] },
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].metadata.dueDate).toBe("2025-01-01");
    });

    it("should ensure comments array exists", () => {
      const todos = [
        {
          id: "1",
          text: "Test",
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].comments).toEqual([]);
    });

    it("should ensure activity array exists", () => {
      const todos = [
        {
          id: "1",
          text: "Test",
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].activity).toEqual([]);
    });

    it("should filter out deleted todos", () => {
      const todos = [
        { id: "1", text: "Active", state: "active", createdAt: Date.now() },
        { id: "2", text: "Deleted", state: "deleted", createdAt: Date.now() },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should auto-archive completed todos past archiveDays", () => {
      const oldCompletedAt = Date.now() - 10 * 24 * 60 * 60 * 1000; // 10 days ago
      const todos = [
        {
          id: "1",
          text: "Old completed",
          state: "completed",
          completedAt: oldCompletedAt,
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].state).toBe("archived");
      expect(result[0].archivedAt).toBeDefined();
    });

    it("should not auto-archive recently completed todos", () => {
      const recentCompletedAt = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
      const todos = [
        {
          id: "1",
          text: "Recent completed",
          state: "completed",
          completedAt: recentCompletedAt,
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].state).toBe("completed");
    });

    it("should auto-delete when enabled and past deleteDays", () => {
      const settingsWithAutoDelete: Settings = {
        ...defaultTestSettings,
        general: {
          archiveDays: getDurationDay(7),
          autoDelete: {
            enabled: true,
            deleteDays: getDurationDay(30),
          },
          theme: "system",
        },
      };
      const oldArchivedAt = Date.now() - 60 * 24 * 60 * 60 * 1000; // 60 days ago
      const todos = [
        {
          id: "1",
          text: "Old archived",
          state: "archived",
          archivedAt: oldArchivedAt,
          completedAt: oldArchivedAt,
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, settingsWithAutoDelete);

      expect(result).toHaveLength(0); // Should be deleted
    });

    it("should preserve sprint metadata", () => {
      const todos = [
        {
          id: "1",
          text: "Sprint task",
          metadata: { sprint: "sprint-1" },
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].metadata.sprint).toBe("sprint-1");
    });

    it("should set timestamps if missing", () => {
      const todos = [
        {
          id: "1",
          text: "Test",
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].createdAt).toBeDefined();
      expect(result[0].updatedAt).toBeDefined();
    });
  });
});
