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

  const addPerson = (person: Omit<Person, "id" | "comments">) => {
    const newPerson: Person = {
      ...person,
      id: Date.now().toString(),
      comments: [],
    };
    setSettings((prev) => ({
      ...prev,
      people: [...prev.people, newPerson],
    }));
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setSettings((prev) => ({
      ...prev,
      people: prev.people.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const deletePerson = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      people: prev.people.filter((p) => p.id !== id),
    }));
  };

  const addProject = (project: Omit<Project, "id" | "comments">) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      comments: [],
    };
    setSettings((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setSettings((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const deleteProject = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const addPriority = (priority: Omit<Priority, "id" | "comments">) => {
    const newPriority: Priority = {
      ...priority,
      id: Date.now().toString(),
      comments: [],
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
    setSettings((prev) => ({
      ...prev,
      people: prev.people.map((person) => {
        if (person.id === personId) {
          const newComment = {
            commentId: Date.now(),
            history: [{ date: Date.now(), content }],
          };
          return { ...person, comments: [...person.comments, newComment] };
        }
        return person;
      }),
    }));
  };

  const editPersonComment = (personId: string, commentId: number, content: string) => {
    setSettings((prev) => ({
      ...prev,
      people: prev.people.map((person) => {
        if (person.id === personId) {
          return {
            ...person,
            comments: person.comments.map((comment) =>
              comment.commentId === commentId
                ? { ...comment, history: [...comment.history, { date: Date.now(), content }] }
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
          return { ...person, comments: person.comments.filter((c) => c.commentId !== commentId) };
        }
        return person;
      }),
    }));
  };

  // Project comment management
  const addProjectComment = (projectId: string, content: string) => {
    setSettings((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => {
        if (project.id === projectId) {
          const newComment = {
            commentId: Date.now(),
            history: [{ date: Date.now(), content }],
          };
          return { ...project, comments: [...project.comments, newComment] };
        }
        return project;
      }),
    }));
  };

  const editProjectComment = (projectId: string, commentId: number, content: string) => {
    setSettings((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            comments: project.comments.map((comment) =>
              comment.commentId === commentId
                ? { ...comment, history: [...comment.history, { date: Date.now(), content }] }
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
          return { ...project, comments: project.comments.filter((c) => c.commentId !== commentId) };
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
    addProject,
    updateProject,
    deleteProject,
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
