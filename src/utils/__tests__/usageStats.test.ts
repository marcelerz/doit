/**
 * Tests for Usage Statistics Utilities
 */

import { calculateUsageStats, sortByUsage, sortStringsByUsage, getTopUsed } from "@/utils/usageStats";
import { Todo, TodoState, getTodoId, getTag } from "@/types/todo";
import { getTimestamp } from "@/types/time";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import { getPriorityId } from "@/types/priority";

describe("usageStats", () => {
  // Helper to create a minimal todo
  const createTodo = (
    state: TodoState,
    overrides: Partial<{
      assignedPeople: string[];
      sourcePeople: string[];
      mentionedPeople: string[];
      projects: string[];
      priority: string;
      tags: string[];
      duration: string;
      recurring: string;
    }> = {},
  ): Todo => ({
    id: getTodoId(`todo-${Date.now()}-${Math.random()}`),
    text: "Test todo",
    plainText: "Test todo",
    state,
    createdAt: getTimestamp(Date.now()),
    context: "",
    tags: [],
    dependencies: [],
    assignedPeople: [],
    sourcePeople: [],
    mentionedPeople: [],
    projects: [],
    subtasks: [],
    metadata: {
      assignedPeople: overrides.assignedPeople || [],
      sourcePeople: overrides.sourcePeople || [],
      mentionedPeople: overrides.mentionedPeople || [],
      projects: overrides.projects || [],
      dependencies: [],
      tags: overrides.tags || [],
      priority: overrides.priority,
      duration: overrides.duration,
      recurring: overrides.recurring,
    },
    comments: [],
    activity: [],
  });

  describe("calculateUsageStats", () => {
    it("should return empty maps for empty todos array", () => {
      const stats = calculateUsageStats([]);

      expect(stats.assignedPeople.size).toBe(0);
      expect(stats.sourcePeople.size).toBe(0);
      expect(stats.projects.size).toBe(0);
      expect(stats.priorities.size).toBe(0);
      expect(stats.tags.size).toBe(0);
    });

    it("should count assigned people", () => {
      const todos = [
        createTodo("active", { assignedPeople: ["Alice"] }),
        createTodo("active", { assignedPeople: ["Alice", "Bob"] }),
        createTodo("active", { assignedPeople: ["Bob"] }),
      ];

      const stats = calculateUsageStats(todos);

      // Alice: 2 active todos × weight 3 = 6
      expect(stats.assignedPeople.get(getPersonId("Alice"))).toBe(6);
      // Bob: 2 active todos × weight 3 = 6
      expect(stats.assignedPeople.get(getPersonId("Bob"))).toBe(6);
    });

    it("should count source people", () => {
      const todos = [
        createTodo("active", { sourcePeople: ["Manager"] }),
        createTodo("completed", { sourcePeople: ["Manager"] }),
      ];

      const stats = calculateUsageStats(todos);

      // Manager: 1 active (×3) + 1 completed (×2) = 5
      expect(stats.sourcePeople.get(getPersonId("Manager"))).toBe(5);
    });

    it("should count mentioned people", () => {
      const todos = [createTodo("active", { mentionedPeople: ["Reviewer"] })];

      const stats = calculateUsageStats(todos);

      expect(stats.mentionedPeople.get(getPersonId("Reviewer"))).toBe(3);
    });

    it("should count projects", () => {
      const todos = [
        createTodo("active", { projects: ["Website"] }),
        createTodo("active", { projects: ["Website", "API"] }),
        createTodo("completed", { projects: ["API"] }),
      ];

      const stats = calculateUsageStats(todos);

      // Website: 2 active × 3 = 6
      expect(stats.projects.get(getProjectId("Website"))).toBe(6);
      // API: 1 active (×3) + 1 completed (×2) = 5
      expect(stats.projects.get(getProjectId("API"))).toBe(5);
    });

    it("should count priorities", () => {
      const todos = [
        createTodo("active", { priority: "high" }),
        createTodo("active", { priority: "high" }),
        createTodo("completed", { priority: "low" }),
      ];

      const stats = calculateUsageStats(todos);

      expect(stats.priorities.get(getPriorityId("high"))).toBe(6);
      expect(stats.priorities.get(getPriorityId("low"))).toBe(2);
    });

    it("should count tags", () => {
      const todos = [
        createTodo("active", { tags: ["urgent", "followup"] }),
        createTodo("active", { tags: ["urgent"] }),
      ];

      const stats = calculateUsageStats(todos);

      expect(stats.tags.get(getTag("urgent"))).toBe(6);
      expect(stats.tags.get(getTag("followup"))).toBe(3);
    });

    it("should count durations", () => {
      const todos = [
        createTodo("active", { duration: "1h" }),
        createTodo("active", { duration: "1h" }),
        createTodo("active", { duration: "30m" }),
      ];

      const stats = calculateUsageStats(todos);

      expect(stats.durations.get("1h")).toBe(6);
      expect(stats.durations.get("30m")).toBe(3);
    });

    it("should count recurring patterns", () => {
      const todos = [
        createTodo("active", { recurring: "weekly" }),
        createTodo("completed", { recurring: "weekly" }),
        createTodo("active", { recurring: "daily" }),
      ];

      const stats = calculateUsageStats(todos);

      expect(stats.recurring.get("weekly")).toBe(5);
      expect(stats.recurring.get("daily")).toBe(3);
    });

    it("should weight active todos higher than completed", () => {
      const activeTodo = createTodo("active", { assignedPeople: ["Alice"] });
      const completedTodo = createTodo("completed", { assignedPeople: ["Bob"] });

      const stats = calculateUsageStats([activeTodo, completedTodo]);

      expect(stats.assignedPeople.get(getPersonId("Alice"))).toBe(3); // weight 3
      expect(stats.assignedPeople.get(getPersonId("Bob"))).toBe(2); // weight 2
    });

    it("should weight archived todos lower", () => {
      const archivedTodo = createTodo("archived", { assignedPeople: ["Alice"] });

      const stats = calculateUsageStats([archivedTodo]);

      expect(stats.assignedPeople.get(getPersonId("Alice"))).toBe(1); // weight 1
    });

    it("should skip deleted todos", () => {
      const deletedTodo = createTodo("deleted", { assignedPeople: ["Alice"] });

      const stats = calculateUsageStats([deletedTodo]);

      expect(stats.assignedPeople.get(getPersonId("Alice"))).toBeUndefined();
    });

    it("should skip todos without the tracked field", () => {
      const todoWithoutPriority = createTodo("active", {});

      const stats = calculateUsageStats([todoWithoutPriority]);

      expect(stats.priorities.size).toBe(0);
    });
  });

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
