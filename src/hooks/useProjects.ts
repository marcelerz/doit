"use client";

import { useMemo, useCallback } from "react";
import { Project } from "@/types/project";
import { STORAGE_KEYS } from "@/storage/storage";
import { createProjectModels, ProjectModel } from "@/models/ProjectModel";
import { useEntityManager } from "./useEntityManager";

/**
 * Hook for managing projects with CRUD operations, comments, activity tracking,
 * and storage persistence. Uses the generic useEntityManager under the hood.
 */
export function useProjects() {
  const manager = useEntityManager<Project, ProjectModel>(
    {
      storageKey: STORAGE_KEYS.PROJECTS,
      entityName: "Project",
      createModels: createProjectModels,
    },
    createProjectModels,
  );

  // Wrap raw projects in ProjectModel instances for consumers
  const projects = useMemo(() => createProjectModels(manager.rawEntities), [manager.rawEntities]);

  // Wrap addEntity to automatically generate the project ID
  const addProject = useCallback(
    (project: Omit<Project, "id" | "comments" | "activity">) => {
      manager.addEntity(project, ProjectModel.createId());
    },
    [manager],
  );

  return {
    projects,
    isLoaded: manager.isLoaded,
    addProject,
    updateProject: manager.updateEntity,
    deleteProject: manager.deleteEntity,
    archiveProject: manager.archiveEntity,
    unarchiveProject: manager.unarchiveEntity,
    addProjectComment: manager.addComment,
    editProjectComment: manager.editComment,
    deleteProjectComment: manager.deleteComment,
  };
}
