"use client";

import { Settings, FeatureSettings } from "@/types/settings";
import { Priority, PriorityId} from "@/types/priority";
import { LinkPattern, LinkPatternId} from "@/types/linkPattern";
import { MarkerColors } from "@/types/markerColors";
import { ProjectCategory, ProjectCategoryId} from "@/types/project";
import { settingsStore, useSharedSettings } from "@/storage/settingsStore";
import { SettingsModel } from "@/models/SettingsModel";

export function useSettings() {
  // Backed by a module-level store, so every caller of useSettings - and every
  // hook that needs settings - observes one value, and other tabs are told
  // when it changes. Loading, persistence and write coalescing live there.
  const { settings, isLoaded } = useSharedSettings();
  const setSettings = settingsStore.set;

  const addPriority = (priority: Omit<Priority, "id">) => {
    const newPriority: Priority = {
      ...priority,
      id: SettingsModel.createPriorityId(),
    };
    setSettings((prev) => ({
      ...prev,
      priorities: [...prev.priorities, newPriority],
    }));
  };

  const updatePriority = (id: PriorityId, updates: Partial<Priority>) => {
    setSettings((prev) => ({
      ...prev,
      priorities: prev.priorities.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const deletePriority = (id: PriorityId) => {
    setSettings((prev) => ({
      ...prev,
      priorities: prev.priorities.filter((p) => p.id !== id),
    }));
  };

  const addLinkPattern = (pattern: Omit<LinkPattern, "id">) => {
    const newPattern: LinkPattern = {
      ...pattern,
      id: SettingsModel.createLinkPatternId(),
    };
    setSettings((prev) => ({
      ...prev,
      linkPatterns: [...prev.linkPatterns, newPattern],
    }));
  };

  const updateLinkPattern = (id: LinkPatternId, updates: Partial<LinkPattern>) => {
    setSettings((prev) => ({
      ...prev,
      linkPatterns: prev.linkPatterns.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const deleteLinkPattern = (id: LinkPatternId) => {
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

  const updateCalendar = (calendar: Partial<Settings["calendar"]>) => {
    setSettings((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        ...calendar,
      },
    }));
  };

  const updateNotificationSettings = (notifications: Partial<Settings["notifications"]>) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        ...notifications,
      },
    }));
  };

  // Kanban settings methods
  const updateKanbanSettings = (kanban: Partial<Settings["kanban"]>) => {
    setSettings((prev) => ({
      ...prev,
      kanban: {
        ...prev.kanban,
        ...kanban,
      },
    }));
  };

  // Category methods
  const addCategory = (category: Omit<ProjectCategory, "id">) => {
    const newCategory: ProjectCategory = {
      ...category,
      id: SettingsModel.createProjectCategoryId(),
    };
    setSettings((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
    return newCategory.id;
  };

  const updateCategory = (id: ProjectCategoryId, updates: Partial<ProjectCategory>) => {
    setSettings((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteCategory = (id: ProjectCategoryId) => {
    setSettings((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };

  // Sprint methods
  const updateSprintSettings = (sprints: Settings["sprints"]) => {
    setSettings((prev) => ({
      ...prev,
      sprints,
    }));
  };

  // Notes settings methods
  const updateNotesSettings = (notes: Settings["notes"]) => {
    setSettings((prev) => ({
      ...prev,
      notes,
    }));
  };

  // Focus settings methods
  const updateFocusSettings = (focus: Settings["focus"]) => {
    setSettings((prev) => ({
      ...prev,
      focus,
    }));
  };

  // Feature settings methods
  const updateFeatureSettings = (features: Partial<FeatureSettings>) => {
    setSettings((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        ...features,
      },
    }));
  };

  // Backup settings methods
  const updateBackupSettings = (backup: Partial<Settings["backup"]>) => {
    setSettings((prev) => ({
      ...prev,
      backup: {
        ...prev.backup,
        ...backup,
      },
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
    updateCalendar,
    updateNotificationSettings,
    updateAutoAssignSettings,
    // Kanban methods
    updateKanbanSettings,
    // Category methods
    addCategory,
    updateCategory,
    deleteCategory,
    // Sprint methods
    updateSprintSettings,
    // Notes methods
    updateNotesSettings,
    // Focus methods
    updateFocusSettings,
    // Feature methods
    updateFeatureSettings,
    // Backup methods
    updateBackupSettings,
  };
}
