"use client";

import { useState, useEffect } from "react";
import { Settings, defaultSettings, Person, Project, Priority, LinkPattern, MarkerColors } from "@/types/settings";
import { migrateSettings } from "@/utils/migrations";

const SETTINGS_KEY = "doit-settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const loadedSettings = JSON.parse(stored);
        const migratedSettings = migrateSettings(loadedSettings);
        setSettings(migratedSettings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    }
  }, [settings, isLoaded]);

  const addPerson = (person: Omit<Person, "id" | "comments" | "activity">) => {
    const now = Date.now();
    const newPerson: Person = {
      ...person,
      id: now.toString(),
      comments: [],
      activity: [
        {
          id: `${now}-created`,
          timestamp: now,
          type: "created",
          description: `Person created`,
        },
      ],
    };
    setSettings((prev) => ({
      ...prev,
      people: [...prev.people, newPerson],
    }));
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setSettings((prev) => ({
      ...prev,
      people: prev.people.map((p) => {
        if (p.id === id) {
          const updatedPerson = { ...p, ...updates };
          // Add activity entry for edit with specific details
          if (
            updates.name !== undefined ||
            updates.alternatives !== undefined ||
            updates.color !== undefined ||
            updates.imageUrl !== undefined ||
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
            if (updates.imageUrl !== p.imageUrl) {
              if (updates.imageUrl && !p.imageUrl) {
                changes.push("image added");
              } else if (!updates.imageUrl && p.imageUrl) {
                changes.push("image removed");
              } else if (updates.imageUrl && p.imageUrl) {
                changes.push("image updated");
              }
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
              updatedPerson.activity = [
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
          return updatedPerson;
        }
        return p;
      }),
    }));
  };

  const archivePerson = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      people: prev.people.map((p) => {
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
                description: `Person archived`,
              },
            ],
          };
        }
        return p;
      }),
    }));
  };

  const unarchivePerson = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      people: prev.people.map((p) => {
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
                description: `Person unarchived`,
              },
            ],
          };
        }
        return p;
      }),
    }));
  };

  const deletePerson = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      people: prev.people.filter((p) => p.id !== id),
    }));
  };

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
    setSettings((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setSettings((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id === id) {
          const updatedProject = { ...p, ...updates };
          // Add activity entry for edit with specific details
          if (
            updates.name !== undefined ||
            updates.alternatives !== undefined ||
            updates.color !== undefined ||
            updates.imageUrl !== undefined ||
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
            if (updates.imageUrl !== p.imageUrl) {
              if (updates.imageUrl && !p.imageUrl) {
                changes.push("image added");
              } else if (!updates.imageUrl && p.imageUrl) {
                changes.push("image removed");
              } else if (updates.imageUrl && p.imageUrl) {
                changes.push("image updated");
              }
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
    }));
  };

  const archiveProject = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
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
    }));
  };

  const unarchiveProject = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
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
    }));
  };

  const deleteProject = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const addPriority = (priority: Omit<Priority, "id" | "comments" | "activity">) => {
    const now = Date.now();
    const newPriority: Priority = {
      ...priority,
      id: now.toString(),
      comments: [],
      activity: [
        {
          id: `${now}-created`,
          timestamp: now,
          type: "created",
          description: `Priority created`,
        },
      ],
    };
    setSettings((prev) => ({
      ...prev,
      priorities: [...prev.priorities, newPriority],
    }));
  };

  const updatePriority = (id: string, updates: Partial<Priority>) => {
    setSettings((prev) => ({
      ...prev,
      priorities: prev.priorities.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const deletePriority = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      priorities: prev.priorities.filter((p) => p.id !== id),
    }));
  };

  const addLinkPattern = (pattern: Omit<LinkPattern, "id">) => {
    const newPattern: LinkPattern = {
      ...pattern,
      id: Date.now().toString(),
    };
    setSettings((prev) => ({
      ...prev,
      linkPatterns: [...prev.linkPatterns, newPattern],
    }));
  };

  const updateLinkPattern = (id: string, updates: Partial<LinkPattern>) => {
    setSettings((prev) => ({
      ...prev,
      linkPatterns: prev.linkPatterns.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const deleteLinkPattern = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      linkPatterns: prev.linkPatterns.filter((p) => p.id !== id),
    }));
  };

  const updateMarkerColors = (colors: Partial<MarkerColors>) => {
    setSettings((prev) => ({
      ...prev,
      markerColors: {
        ...prev.markerColors,
        ...colors,
      } as MarkerColors,
    }));
  };

  const updateGeneralSettings = (general: Partial<Settings["general"]>) => {
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        ...general,
      },
    }));
  };

  // Person comment management
  const addPersonComment = (personId: string, content: string) => {
    const now = Date.now();
    setSettings((prev) => ({
      ...prev,
      people: prev.people.map((person) => {
        if (person.id === personId) {
          const newComment = {
            commentId: now,
            history: [{ date: now, content }],
          };
          return {
            ...person,
            comments: [...person.comments, newComment],
          };
        }
        return person;
      }),
    }));
  };

  const editPersonComment = (personId: string, commentId: number, content: string) => {
    const now = Date.now();
    setSettings((prev) => ({
      ...prev,
      people: prev.people.map((person) => {
        if (person.id === personId) {
          return {
            ...person,
            comments: person.comments.map((comment) =>
              comment.commentId === commentId
                ? { ...comment, history: [...comment.history, { date: now, content }] }
                : comment,
            ),
          };
        }
        return person;
      }),
    }));
  };

  const deletePersonComment = (personId: string, commentId: number) => {
    setSettings((prev) => ({
      ...prev,
      people: prev.people.map((person) => {
        if (person.id === personId) {
          return {
            ...person,
            comments: person.comments.filter((c) => c.commentId !== commentId),
          };
        }
        return person;
      }),
    }));
  };

  // Project comment management
  const addProjectComment = (projectId: string, content: string) => {
    const now = Date.now();
    setSettings((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => {
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
    }));
  };

  const editProjectComment = (projectId: string, commentId: number, content: string) => {
    const now = Date.now();
    setSettings((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => {
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
    }));
  };

  const deleteProjectComment = (projectId: string, commentId: number) => {
    setSettings((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            comments: project.comments.filter((c) => c.commentId !== commentId),
          };
        }
        return project;
      }),
    }));
  };

  // Priority comment management
  const addPriorityComment = (priorityId: string, content: string) => {
    setSettings((prev) => ({
      ...prev,
      priorities: prev.priorities.map((priority) => {
        if (priority.id === priorityId) {
          const newComment = {
            commentId: Date.now(),
            history: [{ date: Date.now(), content }],
          };
          return { ...priority, comments: [...priority.comments, newComment] };
        }
        return priority;
      }),
    }));
  };

  const editPriorityComment = (priorityId: string, commentId: number, content: string) => {
    setSettings((prev) => ({
      ...prev,
      priorities: prev.priorities.map((priority) => {
        if (priority.id === priorityId) {
          return {
            ...priority,
            comments: priority.comments.map((comment) =>
              comment.commentId === commentId
                ? { ...comment, history: [...comment.history, { date: Date.now(), content }] }
                : comment,
            ),
          };
        }
        return priority;
      }),
    }));
  };

  const deletePriorityComment = (priorityId: string, commentId: number) => {
    setSettings((prev) => ({
      ...prev,
      priorities: prev.priorities.map((priority) => {
        if (priority.id === priorityId) {
          return { ...priority, comments: priority.comments.filter((c) => c.commentId !== commentId) };
        }
        return priority;
      }),
    }));
  };

  return {
    settings,
    isLoaded,
    addPerson,
    updatePerson,
    deletePerson,
    archivePerson,
    unarchivePerson,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    addPriority,
    updatePriority,
    deletePriority,
    addLinkPattern,
    updateLinkPattern,
    deleteLinkPattern,
    updateMarkerColors,
    updateGeneralSettings,
    addPersonComment,
    editPersonComment,
    deletePersonComment,
    addProjectComment,
    editProjectComment,
    deleteProjectComment,
    addPriorityComment,
    editPriorityComment,
    deletePriorityComment,
  };
}
