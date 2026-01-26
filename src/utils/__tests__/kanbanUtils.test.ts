/**
 * Tests for Kanban View Utility Functions
 */

import {
  computeKanbanFilterOptions,
  hasActiveKanbanFilters,
  filterTodosByKanbanCriteria,
  getTodoWorkflowState,
  groupTodosByWorkflowState,
  sortKanbanTodos,
  canTransitionState,
  canAcceptMoreTasks,
  getWipLimitStatus,
  createEmptyKanbanFilters,
  serializeKanbanFilters,
  deserializeKanbanFilters,
  KanbanFilters,
} from "@/utils/kanbanUtils";
import { createTestTodo, resetSettingsModel_DONOTUSE, DEFAULT_PRIORITIES } from "./testHelpers";
import { TodoModel } from "@/models/TodoModel";
import { Priority } from "@/types/priority";
import { KanbanState, AllowedTransition, getKanbanStateId } from "@/types/kanbanState";
import { getColor } from "@/types/types";

// Helper to create test priorities
function createTestPriorities(): Priority[] {
  return DEFAULT_PRIORITIES;
}

// Helper to create test kanban states
function createTestStates(): KanbanState[] {
  return [
    { id: getKanbanStateId("backlog"), name: "Backlog", color: getColor("#94a3b8"), order: 0, isSystem: true },
    { id: getKanbanStateId("in-progress"), name: "In Progress", color: getColor("#fbbf24"), order: 1, wipLimit: 3 },
    { id: getKanbanStateId("review"), name: "Review", color: getColor("#a78bfa"), order: 2, wipLimit: 2 },
    { id: getKanbanStateId("completed"), name: "Done", color: getColor("#4ade80"), order: 3, isSystem: true },
  ];
}

describe("kanbanUtils", () => {
  beforeEach(() => {
    resetSettingsModel_DONOTUSE();
  });

  describe("computeKanbanFilterOptions", () => {
    it("should extract unique assigned people", () => {
      const todos = [
        createTestTodo({ metadata: { assignedPeople: ["Alice", "Bob"], sourcePeople: [], mentionedPeople: [], projects: [] } }),
        createTestTodo({ metadata: { assignedPeople: ["Bob", "Charlie"], sourcePeople: [], mentionedPeople: [], projects: [] } }),
      ];
      const priorities = createTestPriorities();

      const result = computeKanbanFilterOptions(todos, priorities);

      expect(result.assignedPeople).toEqual(["Alice", "Bob", "Charlie"]);
    });

    it("should extract unique projects", () => {
      const todos = [
        createTestTodo({ metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: ["Project A"] } }),
        createTestTodo({ metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: ["Project B", "Project A"] } }),
      ];
      const priorities = createTestPriorities();

      const result = computeKanbanFilterOptions(todos, priorities);

      expect(result.projects).toEqual(["Project A", "Project B"]);
    });

    it("should sort priorities by order", () => {
      const todos = [
        createTestTodo({ metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], priority: "low" } }),
        createTestTodo({ metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], priority: "urgent" } }),
        createTestTodo({ metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], priority: "medium" } }),
      ];
      const priorities = createTestPriorities();

      const result = computeKanbanFilterOptions(todos, priorities);

      expect(result.priorities).toEqual(["urgent", "medium", "low"]);
    });

    it("should extract unique tags", () => {
      const todos = [
        createTestTodo({ metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], tags: ["frontend", "bug"] } }),
        createTestTodo({ metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], tags: ["backend", "bug"] } }),
      ];
      const priorities = createTestPriorities();

      const result = computeKanbanFilterOptions(todos, priorities);

      expect(result.tags).toEqual(["backend", "bug", "frontend"]);
    });

    it("should skip deleted todos", () => {
      const todos = [
        createTestTodo({ state: "active", metadata: { assignedPeople: ["Alice"], sourcePeople: [], mentionedPeople: [], projects: [] } }),
        createTestTodo({ state: "deleted", metadata: { assignedPeople: ["Bob"], sourcePeople: [], mentionedPeople: [], projects: [] } }),
      ];
      const priorities = createTestPriorities();

      const result = computeKanbanFilterOptions(todos, priorities);

      expect(result.assignedPeople).toEqual(["Alice"]);
    });
  });

  describe("hasActiveKanbanFilters", () => {
    it("should return false for empty filters", () => {
      const filters = createEmptyKanbanFilters();
      expect(hasActiveKanbanFilters(filters)).toBe(false);
    });

    it("should return true when search text is set", () => {
      const filters = { ...createEmptyKanbanFilters(), searchText: "test" };
      expect(hasActiveKanbanFilters(filters)).toBe(true);
    });

    it("should return true when assignedPeople filter is set", () => {
      const filters = { ...createEmptyKanbanFilters(), assignedPeople: new Set(["Alice"]) };
      expect(hasActiveKanbanFilters(filters)).toBe(true);
    });

    it("should return true when multiple filters are set", () => {
      const filters = {
        ...createEmptyKanbanFilters(),
        projects: new Set(["Project A"]),
        priorities: new Set(["high"]),
      };
      expect(hasActiveKanbanFilters(filters)).toBe(true);
    });
  });

  describe("filterTodosByKanbanCriteria", () => {
    it("should filter by search text", () => {
      const todos = [
        createTestTodo({ id: "1", text: "Fix the bug", plainText: "Fix the bug" }),
        createTestTodo({ id: "2", text: "Add feature", plainText: "Add feature" }),
      ];
      const filters: KanbanFilters = { ...createEmptyKanbanFilters(), searchText: "bug" };

      const result = filterTodosByKanbanCriteria(todos, filters, null);

      expect(result).toHaveLength(1);
      expect(result[0].plainText).toBe("Fix the bug");
    });

    it("should filter by sprint", () => {
      const todos = [
        createTestTodo({ id: "1", metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], sprint: "sprint-1" } }),
        createTestTodo({ id: "2", metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], sprint: "sprint-2" } }),
        createTestTodo({ id: "3", metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [] } }),
      ];
      const filters = createEmptyKanbanFilters();

      const result = filterTodosByKanbanCriteria(todos, filters, "sprint-1");

      expect(result).toHaveLength(1);
      expect(result[0].sprint).toBe("sprint-1");
    });

    it("should filter by backlog (no sprint)", () => {
      const todos = [
        createTestTodo({ id: "1", metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], sprint: "sprint-1" } }),
        createTestTodo({ id: "2", metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [] } }),
      ];
      const filters = createEmptyKanbanFilters();

      const result = filterTodosByKanbanCriteria(todos, filters, "backlog");

      expect(result).toHaveLength(1);
      expect(result[0].sprint).toBeUndefined();
    });

    it("should filter by assigned people", () => {
      const todos = [
        createTestTodo({ id: "1", metadata: { assignedPeople: ["Alice"], sourcePeople: [], mentionedPeople: [], projects: [] } }),
        createTestTodo({ id: "2", metadata: { assignedPeople: ["Bob"], sourcePeople: [], mentionedPeople: [], projects: [] } }),
      ];
      const filters: KanbanFilters = { ...createEmptyKanbanFilters(), assignedPeople: new Set(["Alice"]) };

      const result = filterTodosByKanbanCriteria(todos, filters, null);

      expect(result).toHaveLength(1);
    });

    it("should filter by priority", () => {
      const todos = [
        createTestTodo({ id: "1", metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], priority: "high" } }),
        createTestTodo({ id: "2", metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], priority: "low" } }),
      ];
      const filters: KanbanFilters = { ...createEmptyKanbanFilters(), priorities: new Set(["high"]) };

      const result = filterTodosByKanbanCriteria(todos, filters, null);

      expect(result).toHaveLength(1);
    });

    it("should skip deleted todos", () => {
      const todos = [
        createTestTodo({ id: "1", state: "active" }),
        createTestTodo({ id: "2", state: "deleted" }),
      ];
      const filters = createEmptyKanbanFilters();

      const result = filterTodosByKanbanCriteria(todos, filters, null);

      expect(result).toHaveLength(1);
    });
  });

  describe("getTodoWorkflowState", () => {
    it("should return 'completed' for completed todos", () => {
      const todo = createTestTodo({ state: "completed" });
      expect(getTodoWorkflowState(todo)).toBe("completed");
    });

    it("should return 'archived' for archived todos", () => {
      const todo = createTestTodo({ state: "archived" });
      expect(getTodoWorkflowState(todo)).toBe("archived");
    });

    it("should return workflowState if set", () => {
      const todo = createTestTodo({ state: "active", workflowState: getKanbanStateId("in-progress") });
      expect(getTodoWorkflowState(todo)).toBe("in-progress");
    });

    it("should return 'backlog' as default for active todos", () => {
      const todo = createTestTodo({ state: "active" });
      expect(getTodoWorkflowState(todo)).toBe("backlog");
    });
  });

  describe("groupTodosByWorkflowState", () => {
    it("should group todos by their workflow state", () => {
      const todos = [
        createTestTodo({ id: "1", state: "active" }),
        createTestTodo({ id: "2", state: "active", workflowState: getKanbanStateId("in-progress") }),
        createTestTodo({ id: "3", state: "completed" }),
      ];
      const states = createTestStates();

      const result = groupTodosByWorkflowState(todos, states);

      expect(result["backlog"]).toHaveLength(1);
      expect(result["in-progress"]).toHaveLength(1);
      expect(result["completed"]).toHaveLength(1);
    });

    it("should initialize all states with empty arrays", () => {
      const todos: TodoModel[] = [];
      const states = createTestStates();

      const result = groupTodosByWorkflowState(todos, states);

      expect(result["backlog"]).toEqual([]);
      expect(result["in-progress"]).toEqual([]);
      expect(result["review"]).toEqual([]);
      expect(result["completed"]).toEqual([]);
    });
  });

  describe("sortKanbanTodos", () => {
    const priorities = createTestPriorities();

    it("should sort by createdAt ascending", () => {
      const todos = [
        createTestTodo({ id: "1", createdAt: 3000 }),
        createTestTodo({ id: "2", createdAt: 1000 }),
        createTestTodo({ id: "3", createdAt: 2000 }),
      ];

      const result = sortKanbanTodos(todos, "createdAt", "asc", priorities);

      expect(result[0].createdAt).toBe(1000);
      expect(result[1].createdAt).toBe(2000);
      expect(result[2].createdAt).toBe(3000);
    });

    it("should sort by createdAt descending", () => {
      const todos = [
        createTestTodo({ id: "1", createdAt: 1000 }),
        createTestTodo({ id: "2", createdAt: 3000 }),
      ];

      const result = sortKanbanTodos(todos, "createdAt", "desc", priorities);

      expect(result[0].createdAt).toBe(3000);
    });

    it("should sort by priority", () => {
      const todos = [
        createTestTodo({ id: "1", metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], priority: "low" } }),
        createTestTodo({ id: "2", metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], priority: "urgent" } }),
        createTestTodo({ id: "3", metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], priority: "medium" } }),
      ];

      const result = sortKanbanTodos(todos, "priority", "asc", priorities);

      expect(result[0].priority).toBe("urgent");
      expect(result[1].priority).toBe("medium");
      expect(result[2].priority).toBe("low");
    });

    it("should sort by title", () => {
      const todos = [
        createTestTodo({ id: "1", text: "Zebra", plainText: "Zebra" }),
        createTestTodo({ id: "2", text: "Apple", plainText: "Apple" }),
        createTestTodo({ id: "3", text: "Banana", plainText: "Banana" }),
      ];

      const result = sortKanbanTodos(todos, "title", "asc", priorities);

      expect(result[0].plainText).toBe("Apple");
      expect(result[1].plainText).toBe("Banana");
      expect(result[2].plainText).toBe("Zebra");
    });
  });

  describe("canTransitionState", () => {
    const allowedTransitions: AllowedTransition[] = [
      { fromStateId: getKanbanStateId("backlog"), toStateId: getKanbanStateId("in-progress") },
      { fromStateId: getKanbanStateId("in-progress"), toStateId: getKanbanStateId("review") },
      { fromStateId: getKanbanStateId("review"), toStateId: getKanbanStateId("completed") },
    ];

    it("should return false for same state transition", () => {
      expect(canTransitionState("backlog", "backlog", allowedTransitions)).toBe(false);
    });

    it("should return true for allowed transition", () => {
      expect(canTransitionState("backlog", "in-progress", allowedTransitions)).toBe(true);
    });

    it("should return false for disallowed transition", () => {
      expect(canTransitionState("backlog", "completed", allowedTransitions)).toBe(false);
    });

    it("should return true for any transition when no restrictions", () => {
      expect(canTransitionState("backlog", "completed", [])).toBe(true);
    });
  });

  describe("canAcceptMoreTasks", () => {
    it("should return true for system states", () => {
      const state: KanbanState = { id: getKanbanStateId("backlog"), name: "Backlog", color: getColor("#94a3b8"), order: 0, isSystem: true };
      expect(canAcceptMoreTasks(state, 100)).toBe(true);
    });

    it("should return true when no WIP limit", () => {
      const state: KanbanState = { id: getKanbanStateId("review"), name: "Review", color: getColor("#a78bfa"), order: 2 };
      expect(canAcceptMoreTasks(state, 100)).toBe(true);
    });

    it("should return true when under WIP limit", () => {
      const state: KanbanState = { id: getKanbanStateId("in-progress"), name: "In Progress", color: getColor("#fbbf24"), order: 1, wipLimit: 3 };
      expect(canAcceptMoreTasks(state, 2)).toBe(true);
    });

    it("should return false when at WIP limit", () => {
      const state: KanbanState = { id: getKanbanStateId("in-progress"), name: "In Progress", color: getColor("#fbbf24"), order: 1, wipLimit: 3 };
      expect(canAcceptMoreTasks(state, 3)).toBe(false);
    });
  });

  describe("getWipLimitStatus", () => {
    it("should return no limit for system states", () => {
      const state: KanbanState = { id: getKanbanStateId("backlog"), name: "Backlog", color: getColor("#94a3b8"), order: 0, isSystem: true };
      const result = getWipLimitStatus(state, 5);

      expect(result.hasLimit).toBe(false);
    });

    it("should indicate at limit", () => {
      const state: KanbanState = { id: getKanbanStateId("in-progress"), name: "In Progress", color: getColor("#fbbf24"), order: 1, wipLimit: 3 };
      const result = getWipLimitStatus(state, 3);

      expect(result.hasLimit).toBe(true);
      expect(result.isAtLimit).toBe(true);
      expect(result.isOverLimit).toBe(false);
    });

    it("should indicate over limit", () => {
      const state: KanbanState = { id: getKanbanStateId("in-progress"), name: "In Progress", color: getColor("#fbbf24"), order: 1, wipLimit: 3 };
      const result = getWipLimitStatus(state, 5);

      expect(result.isOverLimit).toBe(true);
    });
  });

  describe("serializeKanbanFilters and deserializeKanbanFilters", () => {
    it("should serialize and deserialize filters correctly", () => {
      const filters: KanbanFilters = {
        searchText: "test",
        assignedPeople: new Set(["Alice", "Bob"]),
        projects: new Set(["Project A"]),
        priorities: new Set(["high"]),
        dueDates: new Set(["today"]),
        tags: new Set(["urgent"]),
      };

      const serialized = serializeKanbanFilters(filters);
      const deserialized = deserializeKanbanFilters(serialized);

      expect(deserialized.searchText).toBe("test");
      expect(deserialized.assignedPeople).toEqual(new Set(["Alice", "Bob"]));
      expect(deserialized.projects).toEqual(new Set(["Project A"]));
    });

    it("should handle empty serialized data", () => {
      const deserialized = deserializeKanbanFilters({});

      expect(deserialized.searchText).toBe("");
      expect(deserialized.assignedPeople.size).toBe(0);
    });
  });
});
