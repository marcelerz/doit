/**
 * Tests for storage migrations
 */

import {
  migrateSettings,
  migrateTodos,
  getCurrentVersion,
  checkAndUpdateVersion,
  migrateLegacyEntitiesFromSettings,
} from "@/storage/migrations";
import {
  STORAGE_KEYS,
  setStorageAdapter,
  getStorageAdapter,
  loadFromStorage,
  StorageAdapter,
} from "@/storage/storage";
import { Settings, defaultSettings } from "@/types/settings";
import { getColor } from "@/types/types";
import { getDurationDay } from "@/types/time";
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing legacy field removal
      expect((result.dateTime as any).startOfDay).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing legacy field removal
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing invalid input handling
      const result = migrateTodos(null as any, defaultTestSettings);
      expect(result).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing invalid input handling
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

    it("should ensure direct fields exist with defaults", () => {
      const todos = [
        {
          id: "1",
          text: "Test",
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      expect(result[0].assignedPeople).toEqual([]);
      expect(result[0].projects).toEqual([]);
      expect(result[0].tags).toEqual([]);
    });

    it("should migrate legacy priorities array to single priority and convert name to ID", () => {
      const todos = [
        {
          id: "1",
          text: "Test",
          metadata: { priorities: ["high", "medium"] },
          createdAt: Date.now(),
        },
      ];
      const result = migrateTodos(todos, defaultTestSettings);

      // "high" priority name should be converted to its ID "2"
      expect(result[0].priority).toBe("2");
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

      expect(result[0].dueDate).toBe("2025-01-01");
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

      expect(result[0].sprint).toBe("sprint-1");
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

/** Minimal in-memory adapter for the storage-touching migrations. */
class MemoryAdapter implements StorageAdapter {
  data = new Map<string, string>();
  async getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  async setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  async removeItem(key: string) {
    this.data.delete(key);
  }
  async clear() {
    this.data.clear();
  }
  async getAllKeys() {
    return [...this.data.keys()];
  }
}

describe("migrateSettings field preservation", () => {
  it("preserves every field of Settings, not an allow-list", () => {
    // `backup` was the field that fell through the allow-list and was reset on
    // every load. This asserts the general property so a future field cannot
    // regress the same way.
    const stored = JSON.parse(JSON.stringify(defaultSettings));
    stored.backup = { ...stored.backup, autoBackupEnabled: false, retentionDays: 90 };

    const result = migrateSettings(stored);

    for (const key of Object.keys(defaultSettings)) {
      expect(result[key as keyof Settings]).toBeDefined();
    }
    expect(result.backup.autoBackupEnabled).toBe(false);
    expect(result.backup.retentionDays).toBe(90);
  });

  it("fills backup defaults when only part of it was stored", () => {
    const result = migrateSettings({ backup: { retentionDays: 7 } });
    expect(result.backup.retentionDays).toBe(7);
    expect(result.backup.autoBackupEnabled).toBe(defaultSettings.backup.autoBackupEnabled);
  });

  it("does not leak legacy top-level keys into the result", () => {
    const result = migrateSettings({
      people: [{ id: "p1", name: "Ada" }],
      projects: [{ id: "pr1", name: "Apollo" }],
      ganttSettings: { someLegacyField: true },
    }) as unknown as Record<string, unknown>;

    expect(result.people).toBeUndefined();
    expect(result.projects).toBeUndefined();
    expect(result.ganttSettings).toBeUndefined();
    expect(result.gantt).toBeDefined();
  });

  it("does not write to storage", async () => {
    const adapter = new MemoryAdapter();
    const original = getStorageAdapter();
    setStorageAdapter(adapter);
    try {
      migrateSettings({ people: [{ id: "p1", name: "Ada" }] });
      // Give any stray unawaited promise a chance to land.
      await Promise.resolve();
      expect(adapter.data.size).toBe(0);
    } finally {
      setStorageAdapter(original);
    }
  });
});

describe("migrateLegacyEntitiesFromSettings", () => {
  let adapter: MemoryAdapter;
  let original: StorageAdapter;

  beforeEach(() => {
    original = getStorageAdapter();
    adapter = new MemoryAdapter();
    setStorageAdapter(adapter);
  });
  afterEach(() => setStorageAdapter(original));

  it("moves legacy people into their own key and clears the legacy field", async () => {
    await adapter.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ people: [{ id: "p1", name: "Ada" }], theme: "dark" })
    );

    await migrateLegacyEntitiesFromSettings();

    const people = await loadFromStorage<{ id: string }[]>(STORAGE_KEYS.PEOPLE, []);
    expect(people.map((p) => p.id)).toEqual(["p1"]);

    const settings = JSON.parse((await adapter.getItem(STORAGE_KEYS.SETTINGS)) as string);
    expect(settings.people).toBeUndefined();
    expect(settings.theme).toBe("dark");
  });

  it("merges rather than overwriting, with existing records winning", async () => {
    await adapter.setItem(
      STORAGE_KEYS.PEOPLE,
      JSON.stringify([{ id: "p1", name: "Ada Lovelace" }, { id: "p2", name: "Grace" }])
    );
    await adapter.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ people: [{ id: "p1", name: "STALE" }, { id: "p3", name: "Alan" }] })
    );

    await migrateLegacyEntitiesFromSettings();

    const people = await loadFromStorage<{ id: string; name: string }[]>(STORAGE_KEYS.PEOPLE, []);
    expect(people.find((p) => p.id === "p1")?.name).toBe("Ada Lovelace");
    expect(people.map((p) => p.id).sort()).toEqual(["p1", "p2", "p3"]);
  });

  it("is a no-op when there is no legacy data", async () => {
    await adapter.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ theme: "dark" }));
    await migrateLegacyEntitiesFromSettings();
    expect(adapter.data.has(STORAGE_KEYS.PEOPLE)).toBe(false);
  });

  it("does not re-fire on a second run", async () => {
    await adapter.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ people: [{ id: "p1", name: "Ada" }] })
    );
    await migrateLegacyEntitiesFromSettings();
    await adapter.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify([{ id: "p1", name: "Renamed" }]));

    await migrateLegacyEntitiesFromSettings();

    const people = await loadFromStorage<{ name: string }[]>(STORAGE_KEYS.PEOPLE, []);
    expect(people[0].name).toBe("Renamed");
  });
});

describe("checkAndUpdateVersion downgrade guard", () => {
  let adapter: MemoryAdapter;
  let original: StorageAdapter;

  beforeEach(() => {
    original = getStorageAdapter();
    adapter = new MemoryAdapter();
    setStorageAdapter(adapter);
  });
  afterEach(() => setStorageAdapter(original));

  it("refuses to migrate data written by a newer build", async () => {
    const newer = getCurrentVersion() + 5;
    await adapter.setItem(STORAGE_KEYS.VERSION, String(newer));

    await expect(checkAndUpdateVersion()).resolves.toBe(false);
    // The stored version must be left alone, not stamped down.
    expect(await adapter.getItem(STORAGE_KEYS.VERSION)).toBe(String(newer));
  });

  it("migrates and stamps the version when data is older", async () => {
    await adapter.setItem(STORAGE_KEYS.VERSION, "1");
    await expect(checkAndUpdateVersion()).resolves.toBe(true);
    expect(await adapter.getItem(STORAGE_KEYS.VERSION)).toBe(String(getCurrentVersion()));
  });

  it("reports no migration needed when already current", async () => {
    await adapter.setItem(STORAGE_KEYS.VERSION, String(getCurrentVersion()));
    await expect(checkAndUpdateVersion()).resolves.toBe(false);
  });
});
