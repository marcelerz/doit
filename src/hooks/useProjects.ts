"use client";

import { useState, useEffect, useMemo } from "react";
import { Project } from "@/types/settings";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { createProjectModels, ProjectModel } from "@/models/ProjectModel";

export function useProjects() {
  const [rawProjects, setRawProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Wrap raw projects in ProjectModel instances for consumers
  const projects = useMemo(() => createProjectModels(rawProjects), [rawProjects]);

  // Load projects from storage on mount
  useEffect(() => {
    loadFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, []).then((loadedProjects) => {
      setRawProjects(loadedProjects);
      setIsLoaded(true);
    });
  }, []);

  // Save projects to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.PROJECTS, rawProjects).catch((error) => {
        console.error("Failed to save projects:", error);
      });
    }
  }, [rawProjects, isLoaded]);

  const addProject = (project: Omit<Project, "id" | "comments" | "activity">) => {
    const now = Date.now();
    const newProject: Project = {
      ...project,
      id: now.toString(),
      comments: [],
      activity: [
        {
          id: `${now}-created`,
          timestamp: now,
          type: "created",
          description: `Project created`,
        },
      ],
    };
    setRawProjects((prev) => [...prev, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setRawProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedProject = { ...p, ...updates };
          // Add activity entry for edit with specific details
          if (
            updates.name !== undefined ||
            updates.alternatives !== undefined ||
            updates.color !== undefined ||
            updates.context !== undefined
          ) {
            const now = Date.now();
            const changes: string[] = [];
            if (updates.name !== undefined && updates.name !== p.name) {
              changes.push(`name from "${p.name}" to "${updates.name}"`);
            }
            if (
              updates.alternatives !== undefined &&
              JSON.stringify(updates.alternatives) !== JSON.stringify(p.alternatives)
            ) {
              const oldAlts = p.alternatives.length > 0 ? p.alternatives.join(", ") : "none";
              const newAlts = updates.alternatives.length > 0 ? updates.alternatives.join(", ") : "none";
              changes.push(`alternatives from ${oldAlts} to ${newAlts}`);
            }
            if (updates.color !== undefined && updates.color !== p.color) {
              changes.push(`color from ${p.color} to ${updates.color}`);
            }
            if (updates.context !== p.context) {
              if (updates.context && !p.context) {
                changes.push("context added");
              } else if (!updates.context && p.context) {
                changes.push("context removed");
              } else if (updates.context && p.context) {
                changes.push("context updated");
              }
            }

            if (changes.length > 0) {
              updatedProject.activity = [
                ...(p.activity || []),
                {
                  id: `${now}-edited`,
                  timestamp: now,
                  type: "edited",
                  description: `Updated ${changes.join("; ")}`,
                },
              ];
            }
          }
          return updatedProject;
        }
        return p;
      }),
    );
  };

  const archiveProject = (id: string) => {
    setRawProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const now = Date.now();
          return {
            ...p,
            archived: true,
            activity: [
              ...(p.activity || []),
              {
                id: `${now}-archived`,
                timestamp: now,
                type: "archived",
                description: `Project archived`,
              },
            ],
          };
        }
        return p;
      }),
    );
  };

  const unarchiveProject = (id: string) => {
    setRawProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const now = Date.now();
          return {
            ...p,
            archived: false,
            activity: [
              ...(p.activity || []),
              {
                id: `${now}-unarchived`,
                timestamp: now,
                type: "unarchived",
                description: `Project unarchived`,
              },
            ],
          };
        }
        return p;
      }),
    );
  };

  const deleteProject = (id: string) => {
    setRawProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const addProjectComment = (projectId: string, content: string) => {
    const now = Date.now();
    setRawProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          const newComment = {
            commentId: now,
            history: [{ date: now, content }],
          };
          return {
            ...project,
            comments: [...project.comments, newComment],
          };
        }
        return project;
      }),
    );
  };

  const editProjectComment = (projectId: string, commentId: number, content: string) => {
    const now = Date.now();
    setRawProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            comments: project.comments.map((comment) =>
              comment.commentId === commentId
                ? { ...comment, history: [...comment.history, { date: now, content }] }
                : comment,
            ),
          };
        }
        return project;
      }),
    );
  };

  const deleteProjectComment = (projectId: string, commentId: number) => {
    setRawProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            comments: project.comments.filter((c) => c.commentId !== commentId),
          };
        }
        return project;
      }),
    );
  };

  return {
    projects,
    isLoaded,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    addProjectComment,
    editProjectComment,
    deleteProjectComment,
  };
}
