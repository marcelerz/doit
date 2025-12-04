"use client";

import { useState, useEffect } from "react";
import { Settings, defaultSettings, Priority, LinkPattern, MarkerColors } from "@/types/settings";
import { migrateSettings } from "@/storage/migrations";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      // Wait for storage to be initialized first
      await waitForStorageInit();

      const loadedSettings = await loadFromStorage<Settings>(STORAGE_KEYS.SETTINGS, defaultSettings);
      const migratedSettings = migrateSettings(loadedSettings);
      setSettings(migratedSettings);
      setIsLoaded(true);
    };

    loadSettings();
  }, []);

  // Save settings to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.SETTINGS, settings).catch((error) => {
        console.error("Failed to save settings:", error);
      });
    }
  }, [settings, isLoaded]);

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

  const updateDateTimeSettings = (dateTime: Partial<Settings["dateTime"]>) => {
    setSettings((prev) => ({
      ...prev,
      dateTime: {
        ...prev.dateTime,
        ...dateTime,
      },
    }));
  };

  const updateWorkHoursSettings = (workHours: Partial<Settings["workHours"]>) => {
    setSettings((prev) => ({
      ...prev,
      workHours: {
        ...prev.workHours,
        ...workHours,
      },
    }));
  };

  const updateGantt = (gantt: Partial<Settings["gantt"]>) => {
    setSettings((prev) => ({
      ...prev,
      gantt: {
        ...prev.gantt,
        ...gantt,
      },
    }));
  };

  const updateAutoAssignSettings = (autoAssign: Partial<Settings["autoAssign"]>) => {
    setSettings((prev) => ({
      ...prev,
      autoAssign: {
        ...prev.autoAssign,
        ...autoAssign,
      },
    }));
  };

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
    addPriority,
    updatePriority,
    deletePriority,
    addLinkPattern,
    updateLinkPattern,
    deleteLinkPattern,
    updateMarkerColors,
    updateGeneralSettings,
    updateDateTimeSettings,
    updateWorkHoursSettings,
    updateGantt,
    updateAutoAssignSettings,
    addPriorityComment,
    editPriorityComment,
    deletePriorityComment,
  };
}
