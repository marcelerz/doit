/**
 * @jest-environment jsdom
 */

/**
 * Tests for useSelectionHistory hook
 */

import { renderHook, act } from "@testing-library/react";
import { useSelectionHistory } from "@/hooks/useSelectionHistory";
import { MAX_SELECTION_HISTORY } from "@/types/selectionHistory";

// Mock storage
jest.mock("@/storage/storage", () => ({
  STORAGE_KEYS: {
    SELECTION_HISTORY: "doit-selection-history",
  },
  loadFromStorage: jest.fn().mockResolvedValue({
    assignedPeople: [],
    sourcePeople: [],
    mentionedPeople: [],
    projects: [],
    priorities: [],
    tags: [],
    dueDates: [],
    durations: [],
    recurring: [],
    sprints: [],
  }),
  saveToStorage: jest.fn().mockResolvedValue(undefined),
  waitForStorageInit: jest.fn().mockResolvedValue(undefined),
}));

describe("useSelectionHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("recordSelection", () => {
    it("should record a selection", async () => {
      const { result } = renderHook(() => useSelectionHistory());

      // Wait for storage initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.recordSelection("tags", "important");
      });

      expect(result.current.history.tags).toHaveLength(1);
      expect(result.current.history.tags[0].value).toBe("important");
    });

    it("should not record empty selections", async () => {
      const { result } = renderHook(() => useSelectionHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.recordSelection("tags", "");
      });

      expect(result.current.history.tags).toHaveLength(0);
    });

    it("should add new selections to the front", async () => {
      const { result } = renderHook(() => useSelectionHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.recordSelection("tags", "first");
      });

      act(() => {
        result.current.recordSelection("tags", "second");
      });

      expect(result.current.history.tags[0].value).toBe("second");
      expect(result.current.history.tags[1].value).toBe("first");
    });
  });

  describe("recordSelections", () => {
    it("should record multiple selections at once", async () => {
      const { result } = renderHook(() => useSelectionHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.recordSelections({
          tags: ["tag1", "tag2"],
          priorities: "high",
        });
      });

      expect(result.current.history.tags).toHaveLength(2);
      expect(result.current.history.priorities).toHaveLength(1);
    });
  });

  describe("usageStats", () => {
    it("should calculate frequency from selections", async () => {
      const { result } = renderHook(() => useSelectionHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.recordSelection("tags", "important");
        result.current.recordSelection("tags", "important");
        result.current.recordSelection("tags", "urgent");
      });

      expect(result.current.usageStats.tags.get("important")).toBe(2);
      expect(result.current.usageStats.tags.get("urgent")).toBe(1);
    });
  });

  describe("getRecentSelections", () => {
    it("should return unique values in order of most recent first", async () => {
      const { result } = renderHook(() => useSelectionHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.recordSelection("tags", "first");
        result.current.recordSelection("tags", "second");
        result.current.recordSelection("tags", "first"); // duplicate, should appear at front
      });

      const recent = result.current.getRecentSelections("tags", 10);
      expect(recent).toEqual(["first", "second"]);
    });

    it("should respect the limit", async () => {
      const { result } = renderHook(() => useSelectionHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.recordSelection("tags", `tag${i}`);
        }
      });

      const recent = result.current.getRecentSelections("tags", 5);
      expect(recent).toHaveLength(5);
    });
  });

  describe("getTopUsed", () => {
    it("should return values sorted by frequency", async () => {
      const { result } = renderHook(() => useSelectionHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.recordSelection("tags", "rare");
        result.current.recordSelection("tags", "common");
        result.current.recordSelection("tags", "common");
        result.current.recordSelection("tags", "common");
        result.current.recordSelection("tags", "medium");
        result.current.recordSelection("tags", "medium");
      });

      const topUsed = result.current.getTopUsed("tags", 10);
      expect(topUsed[0]).toBe("common");
      expect(topUsed[1]).toBe("medium");
      expect(topUsed[2]).toBe("rare");
    });
  });

  describe("clearFieldHistory", () => {
    it("should clear history for a specific field", async () => {
      const { result } = renderHook(() => useSelectionHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.recordSelection("tags", "tag1");
        result.current.recordSelection("priorities", "high");
      });

      act(() => {
        result.current.clearFieldHistory("tags");
      });

      expect(result.current.history.tags).toHaveLength(0);
      expect(result.current.history.priorities).toHaveLength(1);
    });
  });

  describe("clearAllHistory", () => {
    it("should clear all history", async () => {
      const { result } = renderHook(() => useSelectionHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.recordSelection("tags", "tag1");
        result.current.recordSelection("priorities", "high");
        result.current.recordSelection("projects", "project1");
      });

      act(() => {
        result.current.clearAllHistory();
      });

      expect(result.current.history.tags).toHaveLength(0);
      expect(result.current.history.priorities).toHaveLength(0);
      expect(result.current.history.projects).toHaveLength(0);
    });
  });

  describe("MAX_SELECTION_HISTORY", () => {
    it("should trim history to max size", async () => {
      const { result } = renderHook(() => useSelectionHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Record more than MAX_SELECTION_HISTORY entries
      act(() => {
        for (let i = 0; i < MAX_SELECTION_HISTORY + 10; i++) {
          result.current.recordSelection("tags", `tag${i}`);
        }
      });

      expect(result.current.history.tags).toHaveLength(MAX_SELECTION_HISTORY);
      // Most recent should be at the front
      expect(result.current.history.tags[0].value).toBe(`tag${MAX_SELECTION_HISTORY + 9}`);
    });
  });
});
