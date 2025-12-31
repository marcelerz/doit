/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useEntityManager, BaseEntity } from "../useEntityManager";
import { generateUUID } from "@/utils/idGenerator";

// Mock storage
jest.mock("@/storage/storage", () => ({
  STORAGE_KEYS: { TEST_ENTITIES: "doit-test-entities" },
  loadFromStorage: jest.fn().mockResolvedValue([]),
  saveToStorage: jest.fn().mockResolvedValue(undefined),
  waitForStorageInit: jest.fn().mockResolvedValue(undefined),
}));

// Import mocks after setup
import { loadFromStorage, saveToStorage } from "@/storage/storage";

// Test entity type
interface TestEntity extends BaseEntity {
  customField?: string;
}

// Test model wrapper
interface TestModel extends TestEntity {
  displayName: string;
}

function createTestModels(entities: TestEntity[]): TestModel[] {
  return entities.map((e) => ({
    ...e,
    displayName: e.name.toUpperCase(),
  }));
}

const testConfig = {
  storageKey: "doit-test-entities",
  entityName: "TestEntity",
  createModels: createTestModels,
};

describe("useEntityManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loadFromStorage as jest.Mock).mockResolvedValue([]);
  });

  describe("initialization", () => {
    it("should load entities from storage on mount", async () => {
      const existingEntities = [
        { id: "1", name: "Entity 1", alternatives: [], comments: [], activity: [] },
        { id: "2", name: "Entity 2", alternatives: [], comments: [], activity: [] },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.rawEntities).toHaveLength(2);
    });

    it("should migrate entities with missing fields", async () => {
      const existingEntities = [
        { id: "1", name: "Entity 1" }, // Missing alternatives, comments, activity
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.rawEntities[0].alternatives).toEqual([]);
      expect(result.current.rawEntities[0].comments).toEqual([]);
      expect(result.current.rawEntities[0].activity).toEqual([]);
    });

    it("should start with isLoaded false", () => {
      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));
      expect(result.current.isLoaded).toBe(false);
    });
  });

  describe("addEntity", () => {
    it("should add a new entity with generated id and activity", async () => {
      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addEntity({ name: "New Entity", alternatives: [] } as TestEntity, `test-${generateUUID()}`);
      });

      expect(result.current.rawEntities).toHaveLength(1);
      expect(result.current.rawEntities[0].name).toBe("New Entity");
      expect(result.current.rawEntities[0].id).toMatch(/^test-/);
      expect(result.current.rawEntities[0].comments).toEqual([]);
      expect(result.current.rawEntities[0].activity).toHaveLength(1);
      expect(result.current.rawEntities[0].activity[0].type).toBe("created");
    });

    it("should save to storage after adding", async () => {
      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addEntity({ name: "Test", alternatives: [] } as TestEntity, `test-${generateUUID()}`);
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(saveToStorage).toHaveBeenCalled();
    });
  });

  describe("updateEntity", () => {
    it("should update an existing entity", async () => {
      const existingEntities = [{ id: "1", name: "Original", alternatives: [], comments: [], activity: [] }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateEntity("1", { name: "Updated" });
      });

      expect(result.current.rawEntities[0].name).toBe("Updated");
    });

    it("should add activity entry when updating", async () => {
      const existingEntities = [{ id: "1", name: "Original", alternatives: [], comments: [], activity: [] }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateEntity("1", { name: "Updated" });
      });

      expect(result.current.rawEntities[0].activity).toHaveLength(1);
      expect(result.current.rawEntities[0].activity[0].type).toBe("edited");
      expect(result.current.rawEntities[0].activity[0].description).toContain("name");
    });

    it("should not add activity if nothing changed", async () => {
      const existingEntities = [{ id: "1", name: "Original", alternatives: [], comments: [], activity: [] }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateEntity("1", { name: "Original" }); // Same value
      });

      expect(result.current.rawEntities[0].activity).toHaveLength(0);
    });

    it("should do nothing if entity id not found", async () => {
      const existingEntities = [{ id: "1", name: "Original", alternatives: [], comments: [], activity: [] }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateEntity("non-existent", { name: "Updated" });
      });

      expect(result.current.rawEntities[0].name).toBe("Original");
    });
  });

  describe("deleteEntity", () => {
    it("should remove an entity by id", async () => {
      const existingEntities = [
        { id: "1", name: "Entity 1", alternatives: [], comments: [], activity: [] },
        { id: "2", name: "Entity 2", alternatives: [], comments: [], activity: [] },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.deleteEntity("1");
      });

      expect(result.current.rawEntities).toHaveLength(1);
      expect(result.current.rawEntities[0].id).toBe("2");
    });
  });

  describe("archiveEntity", () => {
    it("should set archived to true and add activity", async () => {
      const existingEntities = [
        { id: "1", name: "Entity 1", alternatives: [], archived: false, comments: [], activity: [] },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.archiveEntity("1");
      });

      expect(result.current.rawEntities[0].archived).toBe(true);
      expect(result.current.rawEntities[0].activity).toHaveLength(1);
      expect(result.current.rawEntities[0].activity[0].type).toBe("archived");
    });
  });

  describe("unarchiveEntity", () => {
    it("should set archived to false and add activity", async () => {
      const existingEntities = [
        { id: "1", name: "Entity 1", alternatives: [], archived: true, comments: [], activity: [] },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.unarchiveEntity("1");
      });

      expect(result.current.rawEntities[0].archived).toBe(false);
      expect(result.current.rawEntities[0].activity).toHaveLength(1);
      expect(result.current.rawEntities[0].activity[0].type).toBe("unarchived");
    });
  });

  describe("addComment", () => {
    it("should add a new comment with history", async () => {
      const existingEntities = [{ id: "1", name: "Entity 1", alternatives: [], comments: [], activity: [] }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addComment("1", "This is a comment");
      });

      expect(result.current.rawEntities[0].comments).toHaveLength(1);
      expect(result.current.rawEntities[0].comments[0].history).toHaveLength(1);
      expect(result.current.rawEntities[0].comments[0].history[0].content).toBe("This is a comment");
    });
  });

  describe("editComment", () => {
    it("should add new entry to comment history", async () => {
      const existingEntities = [
        {
          id: "1",
          name: "Entity 1",
          alternatives: [],
          comments: [
            {
              commentId: "comment-1",
              history: [{ timestamp: 1234567890, content: "Original" }],
            },
          ],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.editComment("1", "comment-1", "Updated content");
      });

      expect(result.current.rawEntities[0].comments[0].history).toHaveLength(2);
      expect(result.current.rawEntities[0].comments[0].history[1].content).toBe("Updated content");
    });
  });

  describe("deleteComment", () => {
    it("should remove a comment by id", async () => {
      const existingEntities = [
        {
          id: "1",
          name: "Entity 1",
          alternatives: [],
          comments: [
            { commentId: "comment-1", history: [{ timestamp: 1234567890, content: "Comment 1" }] },
            { commentId: "comment-2", history: [{ timestamp: 1234567891, content: "Comment 2" }] },
          ],
          activity: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.deleteComment("1", "comment-1");
      });

      expect(result.current.rawEntities[0].comments).toHaveLength(1);
      expect(result.current.rawEntities[0].comments[0].commentId).toBe("comment-2");
    });
  });

  describe("createModels", () => {
    it("should provide createModels function", async () => {
      const existingEntities = [{ id: "1", name: "Entity 1", alternatives: [], comments: [], activity: [] }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingEntities);

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const models = result.current.createModels(result.current.rawEntities);
      expect(models).toHaveLength(1);
      expect((models[0] as TestModel).displayName).toBe("ENTITY 1");
    });
  });

  describe("storage integration", () => {
    it("should not save before loading completes", async () => {
      let resolveLoad: (value: unknown[]) => void;
      (loadFromStorage as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLoad = resolve;
          }),
      );

      const { result } = renderHook(() => useEntityManager<TestEntity, TestModel>(testConfig, createTestModels));

      act(() => {
        result.current.addEntity({ name: "Test", alternatives: [] } as TestEntity, `test-${generateUUID()}`);
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(saveToStorage).not.toHaveBeenCalled();

      await act(async () => {
        resolveLoad!([]);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(saveToStorage).toHaveBeenCalled();
    });
  });
});
