/**
 * Tests for List View Utility Functions
 */

import {
  calculateArchiveThreshold,
  categorizeTodos,
  applyBatchEditToMetadata,
  calculateQuickFilterCounts,
  applyQuickFilter,
  getMarkerColorKey,
  BatchEditData,
} from "@/utils/listViewUtils";
import { createTestTodo, resetSettingsModel_DONOTUSE } from "./testHelpers";
import { getTodoId } from "@/types/todo";

describe("listViewUtils", () => {
  beforeEach(() => {
    resetSettingsModel_DONOTUSE();
  });

  describe("calculateArchiveThreshold", () => {
    it("should calculate threshold for 7 days", () => {
      const result = calculateArchiveThreshold(7);
      expect(result).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it("should calculate threshold for 0 days", () => {
      const result = calculateArchiveThreshold(0);
      expect(result).toBe(0);
    });

    it("should calculate threshold for 30 days", () => {
      const result = calculateArchiveThreshold(30);
      expect(result).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });

  describe("categorizeTodos", () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const threshold = 7 * oneDay;

    it("should categorize active todos", () => {
      const todos = [
        createTestTodo({ id: "1", state: "active" }),
        createTestTodo({ id: "2", state: "active" }),
      ];

      const result = categorizeTodos(todos, threshold, now);

      expect(result.active).toHaveLength(2);
      expect(result.completed).toHaveLength(0);
      expect(result.archived).toHaveLength(0);
    });

    it("should categorize archived todos", () => {
      const todos = [
        createTestTodo({ id: "1", state: "archived" }),
        createTestTodo({ id: "2", state: "active" }),
      ];

      const result = categorizeTodos(todos, threshold, now);

      expect(result.active).toHaveLength(1);
      expect(result.archived).toHaveLength(1);
    });

    it("should categorize recently completed todos", () => {
      const recentlyCompleted = createTestTodo({
        id: "1",
        state: "completed",
        completedAt: now - oneDay, // 1 day ago
      });

      const result = categorizeTodos([recentlyCompleted], threshold, now);

      expect(result.completed).toHaveLength(1);
      expect(result.archived).toHaveLength(0);
    });

    it("should auto-archive old completed todos", () => {
      const oldCompleted = createTestTodo({
        id: "1",
        state: "completed",
        completedAt: now - (10 * oneDay), // 10 days ago
      });

      const result = categorizeTodos([oldCompleted], threshold, now);

      expect(result.completed).toHaveLength(0);
      expect(result.archived).toHaveLength(1);
    });

    it("should handle completed todos without completedAt", () => {
      const legacyCompleted = createTestTodo({
        id: "1",
        state: "completed",
        completedAt: undefined,
      });

      const result = categorizeTodos([legacyCompleted], threshold, now);

      expect(result.completed).toHaveLength(1);
    });

    it("should skip deleted todos", () => {
      const todos = [
        createTestTodo({ id: "1", state: "active" }),
        createTestTodo({ id: "2", state: "deleted" }),
      ];

      const result = categorizeTodos(todos, threshold, now);

      expect(result.active).toHaveLength(1);
      expect(result.completed).toHaveLength(0);
      expect(result.archived).toHaveLength(0);
    });

    it("should handle mixed todo states", () => {
      const todos = [
        createTestTodo({ id: "1", state: "active" }),
        createTestTodo({ id: "2", state: "completed", completedAt: now - oneDay }),
        createTestTodo({ id: "3", state: "archived" }),
        createTestTodo({ id: "4", state: "completed", completedAt: now - (10 * oneDay) }),
      ];

      const result = categorizeTodos(todos, threshold, now);

      expect(result.active).toHaveLength(1);
      expect(result.completed).toHaveLength(1);
      expect(result.archived).toHaveLength(2); // explicitly archived + auto-archived
    });
  });

  describe("applyBatchEditToMetadata", () => {
    const baseMetadata = {
      assignedPeople: ["Alice"],
      sourcePeople: [],
      mentionedPeople: [],
      projects: ["Project A"],
      tags: ["existing"],
    };

    it("should set priority when setPriority is true", () => {
      const batchData: BatchEditData = { setPriority: true, priority: "high" };
      const result = applyBatchEditToMetadata(baseMetadata, batchData);

      expect(result.priority).toBe("high");
    });

    it("should clear priority when setPriority is true but no value", () => {
      const metadataWithPriority = { ...baseMetadata, priority: "high" };
      const batchData: BatchEditData = { setPriority: true, priority: undefined };
      const result = applyBatchEditToMetadata(metadataWithPriority, batchData);

      expect(result.priority).toBeUndefined();
    });

    it("should add project if not already present", () => {
      const batchData: BatchEditData = { setProject: true, project: "New Project" };
      const result = applyBatchEditToMetadata(baseMetadata, batchData);

      expect(result.projects).toContain("Project A");
      expect(result.projects).toContain("New Project");
    });

    it("should not duplicate project if already present", () => {
      const batchData: BatchEditData = { setProject: true, project: "Project A" };
      const result = applyBatchEditToMetadata(baseMetadata, batchData);

      expect(result.projects).toEqual(["Project A"]);
    });

    it("should clear projects when setProject is true with no value", () => {
      const batchData: BatchEditData = { setProject: true, project: "" };
      const result = applyBatchEditToMetadata(baseMetadata, batchData);

      expect(result.projects).toEqual([]);
    });

    it("should add assignee if not already present", () => {
      const batchData: BatchEditData = { setAssignee: true, assignee: "Bob" };
      const result = applyBatchEditToMetadata(baseMetadata, batchData);

      expect(result.assignedPeople).toContain("Alice");
      expect(result.assignedPeople).toContain("Bob");
    });

    it("should set sprint", () => {
      const batchData: BatchEditData = { setSprint: true, sprint: "Sprint 1" };
      const result = applyBatchEditToMetadata(baseMetadata, batchData);

      expect(result.sprint).toBe("Sprint 1");
    });

    it("should add tags from comma-separated string", () => {
      const batchData: BatchEditData = { setTags: true, tags: "new, tags, here" };
      const result = applyBatchEditToMetadata(baseMetadata, batchData);

      expect(result.tags).toContain("existing");
      expect(result.tags).toContain("new");
      expect(result.tags).toContain("tags");
      expect(result.tags).toContain("here");
    });

    it("should set duration", () => {
      const batchData: BatchEditData = { setDuration: true, duration: "2h" };
      const result = applyBatchEditToMetadata(baseMetadata, batchData);

      expect(result.duration).toBe("2h");
    });

    it("should set due date", () => {
      const batchData: BatchEditData = { setDueDate: true, dueDate: "2024-12-31" };
      const result = applyBatchEditToMetadata(baseMetadata, batchData);

      expect(result.dueDate).toBe("2024-12-31");
    });

    it("should handle multiple batch operations", () => {
      const batchData: BatchEditData = {
        setPriority: true,
        priority: "urgent",
        setProject: true,
        project: "New Project",
        setDuration: true,
        duration: "1h",
      };
      const result = applyBatchEditToMetadata(baseMetadata, batchData);

      expect(result.priority).toBe("urgent");
      expect(result.projects).toContain("New Project");
      expect(result.duration).toBe("1h");
    });
  });

  describe("calculateQuickFilterCounts", () => {
    const today = new Date("2024-06-15T12:00:00");

    it("should count all active todos", () => {
      const todos = [
        createTestTodo({ id: "1", state: "active" }),
        createTestTodo({ id: "2", state: "active" }),
        createTestTodo({ id: "3", state: "completed" }),
      ];

      const result = calculateQuickFilterCounts(todos, today);

      expect(result.all).toBe(2);
    });

    it("should count todos due today", () => {
      const todos = [
        createTestTodo({
          id: "1",
          state: "active",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-15" }
        }),
        createTestTodo({
          id: "2",
          state: "active",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-16" }
        }),
      ];

      const result = calculateQuickFilterCounts(todos, today);

      expect(result.today).toBe(1);
    });

    it("should count overdue todos", () => {
      const todos = [
        createTestTodo({
          id: "1",
          state: "active",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-10" }
        }),
        createTestTodo({
          id: "2",
          state: "active",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-15" }
        }),
      ];

      const result = calculateQuickFilterCounts(todos, today);

      expect(result.overdue).toBe(1);
    });

    it("should count todos without due dates", () => {
      const todos = [
        createTestTodo({ id: "1", state: "active" }),
        createTestTodo({
          id: "2",
          state: "active",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-15" }
        }),
      ];

      const result = calculateQuickFilterCounts(todos, today);

      expect(result.noDueDate).toBe(1);
    });
  });

  describe("applyQuickFilter", () => {
    const today = new Date("2024-06-15T12:00:00");

    it("should return all todos for 'all' filter", () => {
      const todos = [
        createTestTodo({ id: "1" }),
        createTestTodo({ id: "2" }),
      ];

      const result = applyQuickFilter(todos, "all", today);

      expect(result).toHaveLength(2);
    });

    it("should filter todos without due dates for 'noDueDate' filter", () => {
      const todos = [
        createTestTodo({ id: "1" }),
        createTestTodo({
          id: "2",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-15" }
        }),
      ];

      const result = applyQuickFilter(todos, "noDueDate", today);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(getTodoId("1"));
    });

    it("should filter overdue todos", () => {
      const todos = [
        createTestTodo({
          id: "1",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-10" }
        }),
        createTestTodo({
          id: "2",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-15" }
        }),
      ];

      const result = applyQuickFilter(todos, "overdue", today);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(getTodoId("1"));
    });

    it("should filter todos due today", () => {
      const todos = [
        createTestTodo({
          id: "1",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-15" }
        }),
        createTestTodo({
          id: "2",
          metadata: { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], dueDate: "2024-06-16" }
        }),
      ];

      const result = applyQuickFilter(todos, "today", today);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(getTodoId("1"));
    });
  });

  describe("getMarkerColorKey", () => {
    it("should return correct key for assignedPeople", () => {
      expect(getMarkerColorKey("assignedPeople")).toBe("assigned");
    });

    it("should return correct key for projects", () => {
      expect(getMarkerColorKey("projects")).toBe("project");
    });

    it("should return correct key for priorities", () => {
      expect(getMarkerColorKey("priorities")).toBe("priority");
    });

    it("should return project as default for unknown types", () => {
      expect(getMarkerColorKey("unknown")).toBe("project");
    });
  });
});
