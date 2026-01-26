/**
 * Tests for Dependency Validator
 */

import { areDependenciesSatisfied, getDependencyBlockMessage } from "@/utils/dependencyValidator";
import { generateUUID } from "@/utils/idGenerator";
import { Todo, getTodoId } from "@/types/todo";
import { getTimestamp } from "@/types/time";

// Helper to create a minimal Todo
const createTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: getTodoId((overrides.id as string) || generateUUID()),
  text: overrides.text || "Test todo",
  plainText: overrides.plainText || overrides.text || "Test todo",
  state: overrides.state || "active",
  createdAt: getTimestamp((overrides.createdAt as number) || Date.now()),
  context: "",
  tags: [],
  dependencies: [],
  assignedPeople: [],
  sourcePeople: [],
  mentionedPeople: [],
  projects: [],
  subtasks: [],
  comments: [],
  activity: [],
  ...overrides,
});

describe("dependencyValidator", () => {
  describe("areDependenciesSatisfied", () => {
    it("should return satisfied for empty dependency list", () => {
      const allTodos: Todo[] = [];
      const result = areDependenciesSatisfied([], allTodos);

      expect(result.satisfied).toBe(true);
      expect(result.unsatisfiedTodos).toHaveLength(0);
    });

    it("should return satisfied when dependency is completed", () => {
      const dependency = createTodo({
        id: getTodoId("dep-1"),
        state: "completed",
        completedAt: getTimestamp(Date.now()),
        plainText: "Completed task",
      });
      const allTodos = [dependency];

      const result = areDependenciesSatisfied([getTodoId("dep-1")], allTodos);

      expect(result.satisfied).toBe(true);
      expect(result.unsatisfiedTodos).toHaveLength(0);
    });

    it("should return satisfied when dependency is archived", () => {
      const dependency = createTodo({
        id: getTodoId("dep-1"),
        state: "archived",
        archivedAt: getTimestamp(Date.now()),
        plainText: "Archived task",
      });
      const allTodos = [dependency];

      const result = areDependenciesSatisfied([getTodoId("dep-1")], allTodos);

      expect(result.satisfied).toBe(true);
      expect(result.unsatisfiedTodos).toHaveLength(0);
    });

    it("should return satisfied when dependency is deleted", () => {
      const dependency = createTodo({
        id: getTodoId("dep-1"),
        state: "deleted",
        deletedAt: getTimestamp(Date.now()),
        plainText: "Deleted task",
      });
      const allTodos = [dependency];

      expect(areDependenciesSatisfied([getTodoId("dep-1")], allTodos).satisfied).toBe(true);
    });

    it("should return satisfied when dependency does not exist", () => {
      const allTodos: Todo[] = [];

      const result = areDependenciesSatisfied([getTodoId("non-existent-id")], allTodos);

      expect(result.satisfied).toBe(true);
      expect(result.unsatisfiedTodos).toHaveLength(0);
    });

    it("should return unsatisfied when dependency is active", () => {
      const dependency = createTodo({
        id: getTodoId("dep-1"),
        state: "active",
        plainText: "Active dependency",
      });
      const allTodos = [dependency];

      const result = areDependenciesSatisfied([getTodoId("dep-1")], allTodos);

      expect(result.satisfied).toBe(false);
      expect(result.unsatisfiedTodos).toHaveLength(1);
      expect(result.unsatisfiedTodos[0].id).toBe(getTodoId("dep-1"));
    });

    it("should handle multiple dependencies - all satisfied", () => {
      const dep1 = createTodo({ id: getTodoId("dep-1"), state: "completed", completedAt: getTimestamp(Date.now()) });
      const dep2 = createTodo({ id: getTodoId("dep-2"), state: "archived", archivedAt: getTimestamp(Date.now()) });
      const dep3 = createTodo({ id: getTodoId("dep-3"), state: "deleted", deletedAt: getTimestamp(Date.now()) });
      const allTodos = [dep1, dep2, dep3];

      const result = areDependenciesSatisfied([getTodoId("dep-1"), getTodoId("dep-2"), getTodoId("dep-3")], allTodos);

      expect(result.satisfied).toBe(true);
      expect(result.unsatisfiedTodos).toHaveLength(0);
    });

    it("should handle multiple dependencies - some unsatisfied", () => {
      const dep1 = createTodo({ id: getTodoId("dep-1"), state: "completed", completedAt: getTimestamp(Date.now()) });
      const dep2 = createTodo({ id: getTodoId("dep-2"), state: "active", plainText: "Active dep 2" });
      const dep3 = createTodo({ id: getTodoId("dep-3"), state: "active", plainText: "Active dep 3" });
      const allTodos = [dep1, dep2, dep3];

      const result = areDependenciesSatisfied([getTodoId("dep-1"), getTodoId("dep-2"), getTodoId("dep-3")], allTodos);

      expect(result.satisfied).toBe(false);
      expect(result.unsatisfiedTodos).toHaveLength(2);
      expect(result.unsatisfiedTodos.map((t) => t.id)).toContain(getTodoId("dep-2"));
      expect(result.unsatisfiedTodos.map((t) => t.id)).toContain(getTodoId("dep-3"));
    });

    it("should handle mixed existing and non-existing dependencies", () => {
      const existingDep = createTodo({ id: getTodoId("existing"), state: "active", plainText: "Existing" });
      const allTodos = [existingDep];

      const result = areDependenciesSatisfied([getTodoId("existing"), getTodoId("non-existing")], allTodos);

      expect(result.satisfied).toBe(false);
      expect(result.unsatisfiedTodos).toHaveLength(1);
      expect(result.unsatisfiedTodos[0].id).toBe(getTodoId("existing"));
    });
  });

  describe("getDependencyBlockMessage", () => {
    it("should return empty string for no unsatisfied todos", () => {
      const result = getDependencyBlockMessage([]);
      expect(result).toBe("");
    });

    it("should return singular message for one unsatisfied todo", () => {
      const unsatisfied = [createTodo({ plainText: "Task A" })];
      const result = getDependencyBlockMessage(unsatisfied);

      expect(result).toContain("Cannot complete");
      expect(result).toContain("Task A");
      expect(result).toContain("is not yet complete");
    });

    it("should return plural message for multiple unsatisfied todos", () => {
      const unsatisfied = [createTodo({ plainText: "Task A" }), createTodo({ plainText: "Task B" })];
      const result = getDependencyBlockMessage(unsatisfied);

      expect(result).toContain("Cannot complete");
      expect(result).toContain("2 dependencies");
      expect(result).toContain("Task A");
      expect(result).toContain("Task B");
    });

    it("should handle three or more unsatisfied todos", () => {
      const unsatisfied = [
        createTodo({ plainText: "Task A" }),
        createTodo({ plainText: "Task B" }),
        createTodo({ plainText: "Task C" }),
      ];
      const result = getDependencyBlockMessage(unsatisfied);

      expect(result).toContain("3 dependencies");
      expect(result).toContain("Task A");
      expect(result).toContain("Task B");
      expect(result).toContain("Task C");
    });
  });
});
