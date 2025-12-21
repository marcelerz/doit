/**
 * @jest-environment jsdom
 */

/**
 * Tests for useFilters hook
 */

import { renderHook, act } from "@testing-library/react";
import { useFilters } from "@/hooks/useFilters";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

describe("useFilters", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with empty filters", () => {
      const { result } = renderHook(() => useFilters());

      expect(result.current.filters.searchText).toBe("");
      expect(result.current.filters.assignedPeople.size).toBe(0);
      expect(result.current.filters.projects.size).toBe(0);
      expect(result.current.filters.tags.size).toBe(0);
    });

    it("should have hasActiveFilters as false initially", () => {
      const { result } = renderHook(() => useFilters());
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe("toggleFilter", () => {
    it("should add a value to a filter set", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.toggleFilter("assignedPeople", "John");
      });

      expect(result.current.filters.assignedPeople.has("John")).toBe(true);
      expect(result.current.hasActiveFilters).toBeTruthy();
    });

    it("should remove a value if it already exists", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.toggleFilter("assignedPeople", "John");
      });

      act(() => {
        result.current.toggleFilter("assignedPeople", "John");
      });

      expect(result.current.filters.assignedPeople.has("John")).toBe(false);
    });

    it("should handle multiple values in a filter", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.toggleFilter("tags", "urgent");
        result.current.toggleFilter("tags", "important");
      });

      expect(result.current.filters.tags.has("urgent")).toBe(true);
      expect(result.current.filters.tags.has("important")).toBe(true);
      expect(result.current.filters.tags.size).toBe(2);
    });
  });

  describe("selectAll", () => {
    it("should set all provided values in a filter", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.selectAll("priorities", ["high", "medium", "low"]);
      });

      expect(result.current.filters.priorities.has("high")).toBe(true);
      expect(result.current.filters.priorities.has("medium")).toBe(true);
      expect(result.current.filters.priorities.has("low")).toBe(true);
      expect(result.current.filters.priorities.size).toBe(3);
    });

    it("should replace existing values", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.toggleFilter("priorities", "high");
      });

      act(() => {
        result.current.selectAll("priorities", ["low"]);
      });

      expect(result.current.filters.priorities.has("high")).toBe(false);
      expect(result.current.filters.priorities.has("low")).toBe(true);
      expect(result.current.filters.priorities.size).toBe(1);
    });
  });

  describe("clearFilter", () => {
    it("should clear a specific filter type", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.toggleFilter("assignedPeople", "John");
        result.current.toggleFilter("projects", "Project A");
      });

      act(() => {
        result.current.clearFilter("assignedPeople");
      });

      expect(result.current.filters.assignedPeople.size).toBe(0);
      expect(result.current.filters.projects.size).toBe(1);
    });
  });

  describe("clearAllFilters", () => {
    it("should clear all filters including search text", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearchText("test query");
        result.current.toggleFilter("assignedPeople", "John");
        result.current.toggleFilter("projects", "Project A");
        result.current.toggleFilter("tags", "urgent");
      });

      expect(result.current.hasActiveFilters).toBeTruthy();

      act(() => {
        result.current.clearAllFilters();
      });

      expect(result.current.filters.searchText).toBe("");
      expect(result.current.filters.assignedPeople.size).toBe(0);
      expect(result.current.filters.projects.size).toBe(0);
      expect(result.current.filters.tags.size).toBe(0);
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe("setSearchText", () => {
    it("should update the search text", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearchText("search query");
      });

      expect(result.current.filters.searchText).toBe("search query");
      expect(result.current.hasActiveFilters).toBeTruthy();
    });

    it("should allow clearing search text", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearchText("search query");
      });

      act(() => {
        result.current.setSearchText("");
      });

      expect(result.current.filters.searchText).toBe("");
    });
  });

  describe("loadFilters", () => {
    it("should load a complete filter state", () => {
      const { result } = renderHook(() => useFilters());

      const newFilters = {
        searchText: "loaded search",
        assignedPeople: new Set(["Alice", "Bob"]),
        sourcePeople: new Set<string>(),
        mentionedPeople: new Set<string>(),
        projects: new Set(["Project X"]),
        priorities: new Set(["high"]),
        dueDates: new Set<string>(),
        durations: new Set<string>(),
        tags: new Set(["important"]),
        recurring: new Set<string>(),
        dependencies: new Set<string>(),
      };

      act(() => {
        result.current.loadFilters(newFilters);
      });

      expect(result.current.filters.searchText).toBe("loaded search");
      expect(result.current.filters.assignedPeople.has("Alice")).toBe(true);
      expect(result.current.filters.assignedPeople.has("Bob")).toBe(true);
      expect(result.current.filters.projects.has("Project X")).toBe(true);
      expect(result.current.filters.priorities.has("high")).toBe(true);
      expect(result.current.filters.tags.has("important")).toBe(true);
    });
  });

  describe("hasActiveFilters", () => {
    it("should be true when searchText is set", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearchText("test");
      });

      expect(result.current.hasActiveFilters).toBeTruthy();
    });

    it("should be true when any filter set has values", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.toggleFilter("durations", "1h");
      });

      expect(result.current.hasActiveFilters).toBeTruthy();
    });

    it("should be false when all filters are empty", () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.toggleFilter("tags", "test");
      });

      act(() => {
        result.current.clearAllFilters();
      });

      expect(result.current.hasActiveFilters).toBe(false);
    });
  });
});
