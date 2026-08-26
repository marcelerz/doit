/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useSettings } from "../useSettings";
import { settingsStore } from "@/storage/settingsStore";

// Mock storage
jest.mock("@/storage/storage", () => ({
  STORAGE_KEYS: { SETTINGS: "doit-settings" },
  loadFromStorage: jest.fn().mockResolvedValue(null),
  saveToStorage: jest.fn().mockResolvedValue(undefined),
  waitForStorageInit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/storage/migrations", () => ({
  migrateSettings: jest.fn((settings) => settings),
}));

// Import mocks after setup
import { loadFromStorage, saveToStorage } from "@/storage/storage";
import { defaultSettings } from "@/types/settings";
import { getColor } from "@/types/types";
import { getDurationDay, getDurationMin, getShortTime } from "@/types/time";
import { getLinkPatternId } from "@/types/linkPattern";
import { getProjectCategoryId } from "@/types/project";

describe("useSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Settings live in a module-level store now, so it must be dropped between
    // tests or each one inherits the previous test's state.
    settingsStore.reset();
    (loadFromStorage as jest.Mock).mockResolvedValue(defaultSettings);
    // The store only mirrors to localStorage when the write succeeded, so
    // the mock has to report success rather than returning undefined.
    (saveToStorage as jest.Mock).mockResolvedValue(true);
    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe("initialization", () => {
    it("should load settings from storage on mount", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.settings).toBeDefined();
    });

    it("should start with isLoaded false", () => {
      const { result } = renderHook(() => useSettings());
      expect(result.current.isLoaded).toBe(false);
    });
  });

  describe("priority operations", () => {
    it("should add a new priority", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const initialCount = result.current.settings.priorities.length;

      act(() => {
        result.current.addPriority({ name: "Critical", order: 0, alternatives: [] });
      });

      expect(result.current.settings.priorities).toHaveLength(initialCount + 1);
      expect(result.current.settings.priorities.some((p) => p.name === "Critical")).toBe(true);
    });

    it("should update an existing priority", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const firstPriority = result.current.settings.priorities[0];

      act(() => {
        result.current.updatePriority(firstPriority.id, { name: "Updated Priority" });
      });

      expect(result.current.settings.priorities[0].name).toBe("Updated Priority");
    });

    it("should delete a priority", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const initialCount = result.current.settings.priorities.length;
      const firstPriority = result.current.settings.priorities[0];

      act(() => {
        result.current.deletePriority(firstPriority.id);
      });

      expect(result.current.settings.priorities).toHaveLength(initialCount - 1);
    });
  });

  describe("link pattern operations", () => {
    it("should add a new link pattern", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const initialCount = result.current.settings.linkPatterns.length;

      act(() => {
        result.current.addLinkPattern({ prefix: "JIRA", urlTemplate: "https://jira.example.com/{id}", description: "Jira ticket", color: getColor("#3498db") });
      });

      expect(result.current.settings.linkPatterns).toHaveLength(initialCount + 1);
    });

    it("should update a link pattern", async () => {
      (loadFromStorage as jest.Mock).mockResolvedValue({
        ...defaultSettings,
        linkPatterns: [{ id: getLinkPatternId("lp-1"), prefix: "OLD", urlTemplate: "https://old.com/{id}", description: "Old link", color: getColor("#000000") }],
      });

      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateLinkPattern(getLinkPatternId("lp-1"), { prefix: "NEW" });
      });

      expect(result.current.settings.linkPatterns[0].prefix).toBe("NEW");
    });

    it("should delete a link pattern", async () => {
      (loadFromStorage as jest.Mock).mockResolvedValue({
        ...defaultSettings,
        linkPatterns: [
          { id: getLinkPatternId("lp-1"), prefix: "A", urlTemplate: "https://a.com/{id}", description: "A link", color: getColor("#000000") },
          { id: getLinkPatternId("lp-2"), prefix: "B", urlTemplate: "https://b.com/{id}", description: "B link", color: getColor("#ffffff") },
        ],
      });

      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.deleteLinkPattern(getLinkPatternId("lp-1"));
      });

      expect(result.current.settings.linkPatterns).toHaveLength(1);
      expect(result.current.settings.linkPatterns[0].id).toBe(getLinkPatternId("lp-2"));
    });
  });

  describe("marker colors", () => {
    it("should update marker colors", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateMarkerColors({ assigned: getColor("#ff0000") });
      });

      expect(result.current.settings.markerColors.assigned).toBe(getColor("#ff0000"));
    });
  });

  describe("general settings", () => {
    it("should update general settings", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateGeneralSettings({ archiveDays: getDurationDay(30) });
      });

      expect(result.current.settings.general.archiveDays).toBe(getDurationDay(30));
    });
  });

  describe("dateTime settings", () => {
    it("should update dateTime settings", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateDateTimeSettings({ morning: getShortTime("08:00") });
      });

      expect(result.current.settings.dateTime.morning).toBe(getShortTime("08:00"));
    });
  });

  describe("workHours settings", () => {
    it("should update workHours settings", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateWorkHoursSettings({ useCommonSchedule: false });
      });

      expect(result.current.settings.workHours.useCommonSchedule).toBe(false);
    });
  });

  describe("gantt settings", () => {
    it("should update gantt settings", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateGanttSettings({ defaultTaskDuration: getDurationMin(60) });
      });

      expect(result.current.settings.gantt.defaultTaskDuration).toBe(getDurationMin(60));
    });
  });

  describe("calendar settings", () => {
    it("should update calendar settings", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateCalendarSettings({ showWeekNumbers: true });
      });

      expect(result.current.settings.calendar.showWeekNumbers).toBe(true);
    });
  });

  describe("notification settings", () => {
    it("should update notification settings", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateNotificationSettings({ enabled: true });
      });

      expect(result.current.settings.notifications.enabled).toBe(true);
    });
  });

  describe("autoAssign settings", () => {
    it("should update autoAssign settings", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateAutoAssignSettings({ enabled: true, priority: "High" });
      });

      expect(result.current.settings.autoAssign.enabled).toBe(true);
      expect(result.current.settings.autoAssign.priority).toBe("High");
    });
  });

  describe("category operations", () => {
    it("should add a category", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const initialCount = result.current.settings.categories?.length || 0;

      act(() => {
        result.current.addCategory({ name: "Work", color: getColor("#3498db") });
      });

      expect(result.current.settings.categories?.length).toBe(initialCount + 1);
    });

    it("should update a category", async () => {
      (loadFromStorage as jest.Mock).mockResolvedValue({
        ...defaultSettings,
        categories: [{ id: getProjectCategoryId("cat-1"), name: "Original", color: getColor("#000000") }],
      });

      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateCategory(getProjectCategoryId("cat-1"), { name: "Updated" });
      });

      expect(result.current.settings.categories?.[0]?.name).toBe("Updated");
    });

    it("should delete a category", async () => {
      (loadFromStorage as jest.Mock).mockResolvedValue({
        ...defaultSettings,
        categories: [
          { id: getProjectCategoryId("cat-1"), name: "Cat 1", color: getColor("#000000") },
          { id: getProjectCategoryId("cat-2"), name: "Cat 2", color: getColor("#ffffff") },
        ],
      });

      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.deleteCategory(getProjectCategoryId("cat-1"));
      });

      expect(result.current.settings.categories).toHaveLength(1);
    });
  });

  describe("sprint settings", () => {
    it("should update sprint settings", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateSprintSettings({
          defaultSprintDuration: getDurationDay(21),
          showBacklogInSprint: false,
        });
      });

      expect(result.current.settings.sprints.defaultSprintDuration).toBe(getDurationDay(21));
    });
  });

  describe("focus settings", () => {
    it("should update focus settings", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateFocusSettings({
          ...result.current.settings.focus,
          autoTimeTracking: true,
          soundEnabled: false,
        });
      });

      expect(result.current.settings.focus.autoTimeTracking).toBe(true);
      expect(result.current.settings.focus.soundEnabled).toBe(false);
    });
  });

  describe("feature settings", () => {
    it("should update feature settings", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateFeatureSettings({ ganttView: false });
      });

      expect(result.current.settings.features.ganttView).toBe(false);
    });
  });

  describe("storage integration", () => {
    it("should save to storage and localStorage after changes", async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Clear mocks after initial load
      (saveToStorage as jest.Mock).mockClear();
      (localStorage.setItem as jest.Mock).mockClear();

      act(() => {
        result.current.updateGeneralSettings({ archiveDays: getDurationDay(60) });
      });

      // Writes are coalesced now - a state change no longer means an immediate
      // serialise-and-write of the whole settings blob. Flush the pending one.
      await act(async () => {
        await settingsStore.flush();
      });

      expect(saveToStorage).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });
});
