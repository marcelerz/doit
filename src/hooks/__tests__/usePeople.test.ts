/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { usePeople } from "../usePeople";

// Mock the entity manager
jest.mock("../useEntityManager", () => ({
  useEntityManager: jest.fn().mockReturnValue({
    rawEntities: [],
    isLoaded: true,
    addEntity: jest.fn(),
    updateEntity: jest.fn(),
    deleteEntity: jest.fn(),
    archiveEntity: jest.fn(),
    unarchiveEntity: jest.fn(),
    addComment: jest.fn(),
    editComment: jest.fn(),
    deleteComment: jest.fn(),
    createModels: jest.fn().mockReturnValue([]),
  }),
}));

// Mock storage to prevent initialization errors
jest.mock("@/storage/storage", () => ({
  STORAGE_KEYS: { PEOPLE: "doit-people" },
}));

import { useEntityManager } from "../useEntityManager";
import { getPersonId } from "@/types/person";

describe("usePeople", () => {
  const mockManager = {
    rawEntities: [
      { id: "1", name: "John Doe", alternatives: ["Johnny"], comments: [], activity: [] },
      { id: "2", name: "Jane Smith", alternatives: [], comments: [], activity: [] },
    ],
    isLoaded: true,
    addEntity: jest.fn(),
    updateEntity: jest.fn(),
    deleteEntity: jest.fn(),
    archiveEntity: jest.fn(),
    unarchiveEntity: jest.fn(),
    addComment: jest.fn(),
    editComment: jest.fn(),
    deleteComment: jest.fn(),
    createModels: jest.fn().mockReturnValue([]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useEntityManager as jest.Mock).mockReturnValue(mockManager);
  });

  describe("initialization", () => {
    it("should call useEntityManager with correct config", () => {
      renderHook(() => usePeople());

      expect(useEntityManager).toHaveBeenCalledWith(
        expect.objectContaining({
          storageKey: "doit-people",
          entityName: "Person",
        }),
        expect.any(Function),
      );
    });

    it("should expose isLoaded from entity manager", () => {
      const { result } = renderHook(() => usePeople());
      expect(result.current.isLoaded).toBe(true);
    });
  });

  describe("people models", () => {
    it("should return people wrapped in PersonModel instances", () => {
      const { result } = renderHook(() => usePeople());

      // people array should be created from rawEntities
      expect(result.current.people).toHaveLength(2);
    });
  });

  describe("CRUD operations", () => {
    it("should expose addPerson that calls addEntity with generated ID", () => {
      const { result } = renderHook(() => usePeople());

      result.current.addPerson({ name: "New Person", alternatives: [] } as Parameters<
        typeof result.current.addPerson
      >[0]);

      // addEntity should be called with the entity and a generated person ID
      expect(mockManager.addEntity).toHaveBeenCalledWith(
        { name: "New Person", alternatives: [] },
        expect.stringMatching(/^person-/),
      );
    });

    it("should expose updatePerson that calls updateEntity", () => {
      const { result } = renderHook(() => usePeople());

      result.current.updatePerson(getPersonId("1"), { name: "Updated Name" });

      expect(mockManager.updateEntity).toHaveBeenCalledWith("1", { name: "Updated Name" });
    });

    it("should expose deletePerson that calls deleteEntity", () => {
      const { result } = renderHook(() => usePeople());

      result.current.deletePerson(getPersonId("1"));

      expect(mockManager.deleteEntity).toHaveBeenCalledWith("1");
    });
  });

  describe("archive operations", () => {
    it("should expose archivePerson that calls archiveEntity", () => {
      const { result } = renderHook(() => usePeople());

      result.current.archivePerson(getPersonId("1"));

      expect(mockManager.archiveEntity).toHaveBeenCalledWith("1");
    });

    it("should expose unarchivePerson that calls unarchiveEntity", () => {
      const { result } = renderHook(() => usePeople());

      result.current.unarchivePerson(getPersonId("1"));

      expect(mockManager.unarchiveEntity).toHaveBeenCalledWith("1");
    });
  });

  describe("comment operations", () => {
    it("should expose addPersonComment that calls addComment", () => {
      const { result } = renderHook(() => usePeople());

      result.current.addPersonComment("1", "This is a comment");

      expect(mockManager.addComment).toHaveBeenCalledWith("1", "This is a comment");
    });

    it("should expose editPersonComment that calls editComment", () => {
      const { result } = renderHook(() => usePeople());

      result.current.editPersonComment("1", "comment-1", "Updated comment");

      expect(mockManager.editComment).toHaveBeenCalledWith("1", "comment-1", "Updated comment");
    });

    it("should expose deletePersonComment that calls deleteComment", () => {
      const { result } = renderHook(() => usePeople());

      result.current.deletePersonComment("1", "comment-1");

      expect(mockManager.deleteComment).toHaveBeenCalledWith("1", "comment-1");
    });
  });
});
