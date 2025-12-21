/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useSprints } from "../useSprints";

// Mock storage
jest.mock("@/storage/storage", () => ({
  STORAGE_KEYS: { SPRINTS: "doit-sprints" },
  loadFromStorage: jest.fn().mockResolvedValue([]),
  saveToStorage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/storage/storageInit", () => ({
  waitForStorageInit: jest.fn().mockResolvedValue(undefined),
}));

// Import mocks after setup
import { loadFromStorage, saveToStorage } from "@/storage/storage";

describe("useSprints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loadFromStorage as jest.Mock).mockResolvedValue([]);
  });

  describe("initialization", () => {
    it("should load sprints from storage on mount", async () => {
      const existingSprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingSprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.sprints).toHaveLength(1);
    });

    it("should migrate sprints with missing fields", async () => {
      const oldSprints = [{ id: "sprint-1", name: "Old Sprint", status: "planning", createdAt: Date.now() }];
      (loadFromStorage as jest.Mock).mockResolvedValue(oldSprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.sprints[0].durationDays).toBe(14);
      expect(result.current.sprints[0].comments).toBeDefined();
      expect(result.current.sprints[0].activity).toBeDefined();
    });

    it("should start with isLoaded false", () => {
      const { result } = renderHook(() => useSprints());
      expect(result.current.isLoaded).toBe(false);
    });
  });

  describe("sprint filtering", () => {
    it("should return active sprints (non-archived)", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Active",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
        {
          id: "sprint-2",
          name: "Archived",
          status: "completed",
          state: "archived",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.activeSprints).toHaveLength(1);
      expect(result.current.activeSprints[0].name).toBe("Active");
    });

    it("should return archived sprints", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Active",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
        {
          id: "sprint-2",
          name: "Archived",
          status: "completed",
          state: "archived",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.archivedSprints).toHaveLength(1);
      expect(result.current.archivedSprints[0].name).toBe("Archived");
    });

    it("should return the running sprint", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Planning",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
        {
          id: "sprint-2",
          name: "Running",
          status: "active",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.runningSprint).toBeDefined();
      expect(result.current.runningSprint?.name).toBe("Running");
    });

    it("should return undefined if no running sprint", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Planning",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.runningSprint).toBeUndefined();
    });

    it("should return the next planned sprint", async () => {
      const now = Date.now();
      const sprints = [
        {
          id: "sprint-1",
          name: "Second",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: now + 1000,
          comments: [],
          activity: [],
        },
        {
          id: "sprint-2",
          name: "First",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: now,
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.nextPlannedSprint?.name).toBe("First");
    });
  });

  describe("addSprint", () => {
    it("should add a new sprint with generated id and activity", async () => {
      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addSprint({ name: "New Sprint", durationDays: 14 });
      });

      expect(result.current.sprints).toHaveLength(1);
      expect(result.current.sprints[0].name).toBe("New Sprint");
      expect(result.current.sprints[0].status).toBe("planning");
      expect(result.current.sprints[0].state).toBe("active");
      expect(result.current.sprints[0].activity).toHaveLength(1);
      expect(result.current.sprints[0].activity[0].type).toBe("created");
    });

    it("should return the new sprint id", async () => {
      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      let newId: string | undefined;
      act(() => {
        newId = result.current.addSprint({ name: "Test", durationDays: 14 });
      });

      expect(newId).toBeDefined();
      // Sprint ID should have "sprint-" prefix followed by a UUID
      expect(newId).toMatch(/^sprint-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe("updateSprint", () => {
    it("should update an existing sprint", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Original",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateSprint("sprint-1", { name: "Updated", durationDays: 21 });
      });

      expect(result.current.sprints[0].name).toBe("Updated");
      expect(result.current.sprints[0].durationDays).toBe(21);
    });

    it("should add update activity", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Original",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateSprint("sprint-1", { name: "Updated" });
      });

      expect(result.current.sprints[0].activity).toHaveLength(1);
      expect(result.current.sprints[0].activity[0].type).toBe("updated");
    });
  });

  describe("deleteSprint", () => {
    it("should remove a sprint by id", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
        {
          id: "sprint-2",
          name: "Sprint 2",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.deleteSprint("sprint-1");
      });

      expect(result.current.sprints).toHaveLength(1);
      expect(result.current.sprints[0].id).toBe("sprint-2");
    });
  });

  describe("startSprint", () => {
    it("should start a sprint and set status to active", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.startSprint("sprint-1");
      });

      expect(result.current.sprints[0].status).toBe("active");
      expect(result.current.sprints[0].actualStartDate).toBeDefined();
      expect(result.current.sprints[0].startedAt).toBeDefined();
    });

    it("should add started activity", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.startSprint("sprint-1");
      });

      const lastActivity = result.current.sprints[0].activity[result.current.sprints[0].activity.length - 1];
      expect(lastActivity.type).toBe("started");
    });
  });

  describe("completeSprint", () => {
    it("should complete a sprint", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "active",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.completeSprint("sprint-1");
      });

      expect(result.current.sprints[0].status).toBe("completed");
      expect(result.current.sprints[0].actualEndDate).toBeDefined();
      expect(result.current.sprints[0].completedAt).toBeDefined();
    });
  });

  describe("cancelSprint", () => {
    it("should cancel a sprint", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "active",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.cancelSprint("sprint-1");
      });

      expect(result.current.sprints[0].status).toBe("cancelled");
      expect(result.current.sprints[0].cancelledAt).toBeDefined();
    });
  });

  describe("archiveSprint", () => {
    it("should archive a sprint", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "completed",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.archiveSprint("sprint-1");
      });

      expect(result.current.sprints[0].state).toBe("archived");
      expect(result.current.sprints[0].archivedAt).toBeDefined();
    });
  });

  describe("unarchiveSprint", () => {
    it("should unarchive a sprint", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "completed",
          state: "archived",
          durationDays: 14,
          createdAt: Date.now(),
          archivedAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.unarchiveSprint("sprint-1");
      });

      expect(result.current.sprints[0].state).toBe("active");
      expect(result.current.sprints[0].archivedAt).toBeUndefined();
    });
  });

  describe("comment operations", () => {
    it("should add a comment to a sprint", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addSprintComment("sprint-1", "This is a comment");
      });

      expect(result.current.sprints[0].comments).toHaveLength(1);
      expect(result.current.sprints[0].comments[0].history[0].content).toBe("This is a comment");
    });

    it("should edit a sprint comment", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [{ commentId: "comment-1", history: [{ timestamp: Date.now(), content: "Original" }] }],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.editSprintComment("sprint-1", "comment-1", "Updated");
      });

      expect(result.current.sprints[0].comments[0].history).toHaveLength(2);
      expect(result.current.sprints[0].comments[0].history[1].content).toBe("Updated");
    });

    it("should delete a sprint comment", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [
            { commentId: "comment-1", history: [{ timestamp: Date.now(), content: "Comment 1" }] },
            { commentId: "comment-2", history: [{ timestamp: Date.now(), content: "Comment 2" }] },
          ],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.deleteSprintComment("sprint-1", "comment-1");
      });

      expect(result.current.sprints[0].comments).toHaveLength(1);
      expect(result.current.sprints[0].comments[0].commentId).toBe("comment-2");
    });
  });

  describe("SprintModel computed properties", () => {
    it("should compute isPlanning correctly", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.sprints[0].isPlanning).toBe(true);
    });

    it("should compute hasComments correctly", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Sprint 1",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [{ commentId: "c-1", history: [{ timestamp: Date.now(), content: "Test" }] }],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.sprints[0].hasComments).toBe(true);
      expect(result.current.sprints[0].commentCount).toBe(1);
    });

    it("should compute canStart correctly", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Planning Sprint",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
        {
          id: "sprint-2",
          name: "Active Sprint",
          status: "active",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Cannot start because another sprint is active
      expect(result.current.sprints[0].canStart(result.current.sprints)).toBe(false);
    });

    it("should allow starting when no other sprint is active", async () => {
      const sprints = [
        {
          id: "sprint-1",
          name: "Planning Sprint",
          status: "planning",
          state: "active",
          durationDays: 14,
          createdAt: Date.now(),
          comments: [],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(sprints);

      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.sprints[0].canStart(result.current.sprints)).toBe(true);
    });
  });

  describe("storage integration", () => {
    it("should save to storage after changes", async () => {
      const { result } = renderHook(() => useSprints());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      (saveToStorage as jest.Mock).mockClear();

      act(() => {
        result.current.addSprint({ name: "Test", durationDays: 14 });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(saveToStorage).toHaveBeenCalled();
    });
  });
});
