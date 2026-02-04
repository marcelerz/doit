/**
 * Tests for Filter Helper Utilities
 */

import {
  setToSortedArray,
  arrayHasAnyFromSet,
  setHasValue,
  findByNameOrAlternatives,
  filterByNameOrAlternatives,
} from "@/utils/filterHelpers";

describe("filterHelpers", () => {
  describe("setToSortedArray", () => {
    it("should convert a Set to a sorted array", () => {
      const set = new Set(["charlie", "alice", "bob"]);
      const result = setToSortedArray(set);
      expect(result).toEqual(["alice", "bob", "charlie"]);
    });

    it("should handle empty Set", () => {
      const set = new Set<string>();
      const result = setToSortedArray(set);
      expect(result).toEqual([]);
    });

    it("should handle Set with one element", () => {
      const set = new Set(["only"]);
      const result = setToSortedArray(set);
      expect(result).toEqual(["only"]);
    });

    it("should sort numbers correctly", () => {
      const set = new Set([3, 1, 4, 1, 5, 9, 2, 6]); // duplicates ignored by Set
      const result = setToSortedArray(set);
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 9]);
    });

    it("should handle mixed case strings", () => {
      const set = new Set(["Zebra", "apple", "Banana"]);
      const result = setToSortedArray(set);
      // Default sort is lexicographic, capitals come before lowercase
      expect(result).toEqual(["Banana", "Zebra", "apple"]);
    });
  });

  describe("arrayHasAnyFromSet", () => {
    it("should return true if array contains any value from set", () => {
      const array = ["alice", "bob", "charlie"];
      const set = new Set(["bob", "david"]);
      expect(arrayHasAnyFromSet(array, set)).toBe(true);
    });

    it("should return false if array contains no values from set", () => {
      const array = ["alice", "bob", "charlie"];
      const set = new Set(["david", "eve"]);
      expect(arrayHasAnyFromSet(array, set)).toBe(false);
    });

    it("should return false for empty array", () => {
      const array: string[] = [];
      const set = new Set(["alice", "bob"]);
      expect(arrayHasAnyFromSet(array, set)).toBe(false);
    });

    it("should return false for empty set", () => {
      const array = ["alice", "bob"];
      const set = new Set<string>();
      expect(arrayHasAnyFromSet(array, set)).toBe(false);
    });

    it("should handle both empty array and set", () => {
      const array: string[] = [];
      const set = new Set<string>();
      expect(arrayHasAnyFromSet(array, set)).toBe(false);
    });

    it("should find match at beginning of array", () => {
      const array = ["alice", "bob", "charlie"];
      const set = new Set(["alice"]);
      expect(arrayHasAnyFromSet(array, set)).toBe(true);
    });

    it("should find match at end of array", () => {
      const array = ["alice", "bob", "charlie"];
      const set = new Set(["charlie"]);
      expect(arrayHasAnyFromSet(array, set)).toBe(true);
    });

    it("should work with numbers", () => {
      const array = [1, 2, 3, 4, 5];
      const set = new Set([6, 7, 3]);
      expect(arrayHasAnyFromSet(array, set)).toBe(true);
    });
  });

  describe("setHasValue", () => {
    it("should return true if set contains the value", () => {
      const set = new Set(["alice", "bob", "charlie"]);
      expect(setHasValue(set, "bob")).toBe(true);
    });

    it("should return false if set does not contain the value", () => {
      const set = new Set(["alice", "bob", "charlie"]);
      expect(setHasValue(set, "david")).toBe(false);
    });

    it("should return false for undefined value", () => {
      const set = new Set(["alice", "bob"]);
      expect(setHasValue(set, undefined)).toBe(false);
    });

    it("should return false for empty set", () => {
      const set = new Set<string>();
      expect(setHasValue(set, "alice")).toBe(false);
    });

    it("should work with numbers", () => {
      const set = new Set([1, 2, 3]);
      expect(setHasValue(set, 2)).toBe(true);
      expect(setHasValue(set, 4)).toBe(false);
    });

    it("should handle boolean values", () => {
      const set = new Set([true, false]);
      expect(setHasValue(set, true)).toBe(true);
      expect(setHasValue(set, false)).toBe(true);
    });
  });

  describe("findByNameOrAlternatives", () => {
    const items = [
      { name: "Alice", alternatives: ["Al", "Ally"] },
      { name: "Bob", alternatives: ["Bobby", "Robert"] },
      { name: "Charlie", alternatives: [] },
    ];

    it("should find by exact name match (case-insensitive)", () => {
      expect(findByNameOrAlternatives(items, "Alice")).toEqual(items[0]);
      expect(findByNameOrAlternatives(items, "alice")).toEqual(items[0]);
      expect(findByNameOrAlternatives(items, "ALICE")).toEqual(items[0]);
    });

    it("should find by alternative match (case-insensitive)", () => {
      expect(findByNameOrAlternatives(items, "Al")).toEqual(items[0]);
      expect(findByNameOrAlternatives(items, "ally")).toEqual(items[0]);
      expect(findByNameOrAlternatives(items, "BOBBY")).toEqual(items[1]);
    });

    it("should return undefined when no match", () => {
      expect(findByNameOrAlternatives(items, "David")).toBeUndefined();
      expect(findByNameOrAlternatives(items, "xyz")).toBeUndefined();
    });

    it("should return undefined for empty array", () => {
      expect(findByNameOrAlternatives([], "Alice")).toBeUndefined();
    });

    it("should handle items with no alternatives", () => {
      expect(findByNameOrAlternatives(items, "Charlie")).toEqual(items[2]);
    });

    it("should return first match when multiple items could match", () => {
      const duplicateItems = [
        { name: "Test", alternatives: [] },
        { name: "Test", alternatives: [] },
      ];
      expect(findByNameOrAlternatives(duplicateItems, "Test")).toEqual(duplicateItems[0]);
    });
  });

  describe("filterByNameOrAlternatives", () => {
    const items = [
      { name: "Alice Smith", alternatives: ["Al", "Ally"] },
      { name: "Bob Johnson", alternatives: ["Bobby", "Robert"] },
      { name: "Charlie Brown", alternatives: [] },
      { name: "Alicia Keys", alternatives: ["AK"] },
    ];

    it("should return all items for empty search", () => {
      expect(filterByNameOrAlternatives(items, "")).toEqual(items);
    });

    it("should filter by partial name match (case-insensitive)", () => {
      const result = filterByNameOrAlternatives(items, "ali");
      expect(result).toHaveLength(2);
      expect(result).toContain(items[0]); // Alice
      expect(result).toContain(items[3]); // Alicia
    });

    it("should filter by partial alternative match", () => {
      const result = filterByNameOrAlternatives(items, "bob");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(items[1]); // Bobby is alternative
    });

    it("should return empty array when no matches", () => {
      expect(filterByNameOrAlternatives(items, "xyz")).toEqual([]);
    });

    it("should handle case-insensitive search", () => {
      expect(filterByNameOrAlternatives(items, "CHARLIE")).toHaveLength(1);
      expect(filterByNameOrAlternatives(items, "charlie")).toHaveLength(1);
    });

    it("should match against any alternative", () => {
      const result = filterByNameOrAlternatives(items, "obert");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(items[1]); // Robert is alternative
    });

    it("should return empty array for empty items array", () => {
      expect(filterByNameOrAlternatives([], "test")).toEqual([]);
    });
  });
});
