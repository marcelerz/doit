/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useProjects } from "../useProjects";

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
  STORAGE_KEYS: { PROJECTS: "doit-projects" },
}));

import { useEntityManager } from "../useEntityManager";

describe("useProjects", () => {
  const mockManager = {
    rawEntities: [
      { id: "1", name: "Website Redesign", alternatives: ["WR"], comments: [], activity: [] },
      { id: "2", name: "Mobile App", alternatives: [], comments: [], activity: [] },
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
      renderHook(() => useProjects());

      expect(useEntityManager).toHaveBeenCalledWith(
        expect.objectContaining({
          storageKey: "doit-projects",
          entityName: "Project",
        }),
        expect.any(Function),
      );
    });

    it("should expose isLoaded from entity manager", () => {
      const { result } = renderHook(() => useProjects());
      expect(result.current.isLoaded).toBe(true);
    });
  });

  describe("projects models", () => {
    it("should return projects wrapped in ProjectModel instances", () => {
      const { result } = renderHook(() => useProjects());

      // projects array should be created from rawEntities
      expect(result.current.projects).toHaveLength(2);
    });
  });

  describe("CRUD operations", () => {
    it("should expose addProject that calls addEntity with generated ID", () => {
      const { result } = renderHook(() => useProjects());

      result.current.addProject({ name: "New Project", alternatives: [] } as Parameters<
        typeof result.current.addProject
      >[0]);

      // addEntity should be called with the entity and a generated project ID
      expect(mockManager.addEntity).toHaveBeenCalledWith(
        { name: "New Project", alternatives: [] },
        expect.stringMatching(/^proj-/),
      );
    });

    it("should expose updateProject that calls updateEntity", () => {
      const { result } = renderHook(() => useProjects());

      result.current.updateProject("1", { name: "Updated Name" });

      expect(mockManager.updateEntity).toHaveBeenCalledWith("1", { name: "Updated Name" });
    });

    it("should expose deleteProject that calls deleteEntity", () => {
      const { result } = renderHook(() => useProjects());

      result.current.deleteProject("1");

      expect(mockManager.deleteEntity).toHaveBeenCalledWith("1");
    });
  });

  describe("archive operations", () => {
    it("should expose archiveProject that calls archiveEntity", () => {
      const { result } = renderHook(() => useProjects());

      result.current.archiveProject("1");

      expect(mockManager.archiveEntity).toHaveBeenCalledWith("1");
    });

    it("should expose unarchiveProject that calls unarchiveEntity", () => {
      const { result } = renderHook(() => useProjects());

      result.current.unarchiveProject("1");

      expect(mockManager.unarchiveEntity).toHaveBeenCalledWith("1");
    });
  });

  describe("comment operations", () => {
    it("should expose addProjectComment that calls addComment", () => {
      const { result } = renderHook(() => useProjects());

      result.current.addProjectComment("1", "This is a comment");

      expect(mockManager.addComment).toHaveBeenCalledWith("1", "This is a comment");
    });

    it("should expose editProjectComment that calls editComment", () => {
      const { result } = renderHook(() => useProjects());

      result.current.editProjectComment("1", "comment-1", "Updated comment");

      expect(mockManager.editComment).toHaveBeenCalledWith("1", "comment-1", "Updated comment");
    });

    it("should expose deleteProjectComment that calls deleteComment", () => {
      const { result } = renderHook(() => useProjects());

      result.current.deleteProjectComment("1", "comment-1");

      expect(mockManager.deleteComment).toHaveBeenCalledWith("1", "comment-1");
    });
  });
});
