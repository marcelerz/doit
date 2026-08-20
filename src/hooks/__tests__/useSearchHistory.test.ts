/**
 * @jest-environment jsdom
 */

/**
 * Tests for useSearchHistory hook
 */

import { renderHook, act } from "@testing-library/react";
import { useSearchHistory } from "@/hooks/useSearchHistory";

// Mock storage
jest.mock("@/storage/storage", () => ({
  STORAGE_KEYS: {
    SEARCH_HISTORY: "doit-search-history",
  },
  loadFromStorage: jest.fn().mockResolvedValue([]),
  saveToStorage: jest.fn().mockResolvedValue(undefined),
  waitForStorageInit: jest.fn().mockResolvedValue(undefined),
}));

describe("useSearchHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with empty history", async () => {
      const { result } = renderHook(() => useSearchHistory());

      // Wait for async initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.history).toEqual([]);
    });
  });

  describe("addToHistory", () => {
    it("should add a search query to history", async () => {
      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addToHistory("test query");
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].query).toBe("test query");
    });

    it("should not add empty queries", async () => {
      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addToHistory("");
        result.current.addToHistory("   ");
      });

      expect(result.current.history).toHaveLength(0);
    });

    it("should trim whitespace from queries", async () => {
      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addToHistory("  test query  ");
      });

      expect(result.current.history[0].query).toBe("test query");
    });

    it("should add new entries at the beginning", async () => {
      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addToHistory("first");
      });

      act(() => {
        result.current.addToHistory("second");
      });

      expect(result.current.history[0].query).toBe("second");
      expect(result.current.history[1].query).toBe("first");
    });

    it("should remove duplicates and move to front (case-insensitive)", async () => {
      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addToHistory("Test Query");
      });

      act(() => {
        result.current.addToHistory("another");
      });

      act(() => {
        result.current.addToHistory("test query"); // Same query, different case
      });

      expect(result.current.history).toHaveLength(2);
      expect(result.current.history[0].query).toBe("test query");
    });

    it("should limit history to 20 items", async () => {
      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Add 25 items
      act(() => {
        for (let i = 0; i < 25; i++) {
          result.current.addToHistory(`query ${i}`);
        }
      });

      expect(result.current.history).toHaveLength(20);
      // Most recent should be at the front
      expect(result.current.history[0].query).toBe("query 24");
    });
  });

  describe("removeFromHistory", () => {
    it("should remove a specific entry by id", async () => {
      const { result } = renderHook(() => useSearchHistory());

      // Wait for async initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Add entries with waits between
      await act(async () => {
        result.current.addToHistory("first");
        await new Promise((resolve) => setTimeout(resolve, 5));
      });

      await act(async () => {
        result.current.addToHistory("second");
        await new Promise((resolve) => setTimeout(resolve, 5));
      });

      // "second" should be at index 0 (most recent), "first" at index 1
      expect(result.current.history).toHaveLength(2);
      expect(result.current.history[0].query).toBe("second");
      expect(result.current.history[1].query).toBe("first");

      // Remove "second" (index 0)
      const secondId = result.current.history[0].id;

      await act(async () => {
        result.current.removeFromHistory(secondId);
        await new Promise((resolve) => setTimeout(resolve, 5));
      });

      // Only "first" should remain
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].query).toBe("first");
    });
  });

  describe("clearHistory", () => {
    it("should remove all entries", async () => {
      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addToHistory("first");
        result.current.addToHistory("second");
        result.current.addToHistory("third");
      });

      expect(result.current.history).toHaveLength(3);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history).toHaveLength(0);
    });
  });

  describe("getSuggestions", () => {
    it("should return recent history when input is empty", async () => {
      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addToHistory("first");
        result.current.addToHistory("second");
        result.current.addToHistory("third");
      });

      const suggestions = result.current.getSuggestions("");
      expect(suggestions).toHaveLength(3);
    });

    it("should filter suggestions by input", async () => {
      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addToHistory("apple pie");
        result.current.addToHistory("banana split");
        result.current.addToHistory("apple crumble");
      });

      const suggestions = result.current.getSuggestions("apple");
      expect(suggestions).toHaveLength(2);
      expect(suggestions.every((s) => s.query.includes("apple"))).toBe(true);
    });

    it("should respect the limit parameter", async () => {
      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addToHistory(`query ${i}`);
        }
      });

      const suggestions = result.current.getSuggestions("", 3);
      expect(suggestions).toHaveLength(3);
    });

    it("should be case-insensitive when filtering", async () => {
      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addToHistory("Test Query");
        result.current.addToHistory("Another One");
      });

      const suggestions = result.current.getSuggestions("test");
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].query).toBe("Test Query");
    });
  });
});
