/**
 * Tests for Usage Statistics Utilities
 */

import { sortByUsage, sortStringsByUsage, getTopUsed } from "@/utils/usageStats";

describe("usageStats", () => {
  describe("sortByUsage", () => {
    it("should sort items by usage count (highest first)", () => {
      const items = [{ name: "Alice" }, { name: "Bob" }, { name: "Charlie" }];

      const usageMap = new Map([
        ["Alice", 5],
        ["Bob", 10],
        ["Charlie", 3],
      ]);

      const result = sortByUsage(items, usageMap);

      expect(result[0].name).toBe("Bob");
      expect(result[1].name).toBe("Alice");
      expect(result[2].name).toBe("Charlie");
    });

    it("should sort alphabetically when usage is equal", () => {
      const items = [{ name: "Charlie" }, { name: "Alice" }, { name: "Bob" }];

      const usageMap = new Map([
        ["Alice", 5],
        ["Bob", 5],
        ["Charlie", 5],
      ]);

      const result = sortByUsage(items, usageMap);

      expect(result[0].name).toBe("Alice");
      expect(result[1].name).toBe("Bob");
      expect(result[2].name).toBe("Charlie");
    });

    it("should treat missing usage as 0", () => {
      const items = [{ name: "Alice" }, { name: "Bob" }];

      const usageMap = new Map([["Alice", 5]]);

      const result = sortByUsage(items, usageMap);

      expect(result[0].name).toBe("Alice");
      expect(result[1].name).toBe("Bob");
    });

    it("should not mutate original array", () => {
      const items = [{ name: "Bob" }, { name: "Alice" }];

      const usageMap = new Map([
        ["Alice", 10],
        ["Bob", 5],
      ]);

      const result = sortByUsage(items, usageMap);

      expect(items[0].name).toBe("Bob"); // Original unchanged
      expect(result[0].name).toBe("Alice"); // Sorted copy
    });

    it("should handle empty array", () => {
      const result = sortByUsage([], new Map());
      expect(result).toEqual([]);
    });
  });

  describe("sortStringsByUsage", () => {
    it("should sort strings by usage count (highest first)", () => {
      const items = ["apple", "banana", "cherry"];
      const usageMap = new Map([
        ["apple", 5],
        ["banana", 10],
        ["cherry", 3],
      ]);

      const result = sortStringsByUsage(items, usageMap);

      expect(result).toEqual(["banana", "apple", "cherry"]);
    });

    it("should sort alphabetically when usage is equal", () => {
      const items = ["cherry", "apple", "banana"];
      const usageMap = new Map([
        ["apple", 5],
        ["banana", 5],
        ["cherry", 5],
      ]);

      const result = sortStringsByUsage(items, usageMap);

      expect(result).toEqual(["apple", "banana", "cherry"]);
    });

    it("should treat missing usage as 0", () => {
      const items = ["known", "unknown"];
      const usageMap = new Map([["known", 5]]);

      const result = sortStringsByUsage(items, usageMap);

      expect(result[0]).toBe("known");
      expect(result[1]).toBe("unknown");
    });

    it("should not mutate original array", () => {
      const items = ["b", "a"];
      const usageMap = new Map([
        ["a", 10],
        ["b", 5],
      ]);

      const result = sortStringsByUsage(items, usageMap);

      expect(items[0]).toBe("b"); // Original unchanged
      expect(result[0]).toBe("a"); // Sorted copy
    });
  });

  describe("getTopUsed", () => {
    it("should return top N items by usage", () => {
      const usageMap = new Map([
        ["a", 10],
        ["b", 5],
        ["c", 15],
        ["d", 8],
        ["e", 3],
      ]);

      const result = getTopUsed(usageMap, 3);

      expect(result).toEqual(["c", "a", "d"]);
    });

    it("should return all items if limit exceeds count", () => {
      const usageMap = new Map([
        ["a", 10],
        ["b", 5],
      ]);

      const result = getTopUsed(usageMap, 10);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe("a");
      expect(result[1]).toBe("b");
    });

    it("should default to 10 items", () => {
      const usageMap = new Map(Array.from({ length: 15 }, (_, i) => [`item${i}`, 15 - i]));

      const result = getTopUsed(usageMap);

      expect(result).toHaveLength(10);
    });

    it("should handle empty map", () => {
      const result = getTopUsed(new Map(), 5);
      expect(result).toEqual([]);
    });

    it("should sort by count descending", () => {
      const usageMap = new Map([
        ["low", 1],
        ["high", 100],
        ["medium", 50],
      ]);

      const result = getTopUsed(usageMap, 3);

      expect(result[0]).toBe("high");
      expect(result[1]).toBe("medium");
      expect(result[2]).toBe("low");
    });
  });
});
