"use client";

import { useState, useEffect } from "react";
import { Settings, defaultSettings, Person, Project, Priority, LinkPattern, MarkerColors } from "@/types/settings";

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
        // Merge with defaults to ensure all fields exist
        setSettings({
          ...defaultSettings,
          ...loadedSettings,
          priorities: loadedSettings.priorities || defaultSettings.priorities,
          markerColors: loadedSettings.markerColors || defaultSettings.markerColors,
          general: {
            ...defaultSettings.general,
            ...(loadedSettings.general || {}),
            autoAssign: {
              ...defaultSettings.general.autoAssign,
              ...(loadedSettings.general?.autoAssign || {}),
            },
          },
        });
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

  const addPriority = (priority: Omit<Priority, "id">) => {
    const newPriority: Priority = {
      ...priority,
      id: Date.now().toString(),
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
  };
}
