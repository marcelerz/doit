"use client";

import { Settings, FeatureSettings } from "@/types/settings";
import { Priority, PriorityId} from "@/types/priority";
import { LinkPattern, LinkPatternId} from "@/types/linkPattern";
import { MarkerColors } from "@/types/markerColors";
import { KanbanState, KanbanStateId} from "@/types/kanbanState";
import { KanbanView, KanbanViewId} from "@/types/kanbanView";
import { KanbanTransition } from "@/types/kanbanTransition";
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

  const addKanbanState = (state: Omit<KanbanState, "id">) => {
    const newState: KanbanState = {
      ...state,
      id: SettingsModel.createKanbanStateId(),
    };
    setSettings((prev) => ({
      ...prev,
      kanban: {
        ...prev.kanban,
        states: [...prev.kanban.states, newState],
      },
    }));
    return newState.id;
  };

  const updateKanbanState = (id: KanbanStateId, updates: Partial<KanbanState>) => {
    setSettings((prev) => ({
      ...prev,
      kanban: {
        ...prev.kanban,
        states: prev.kanban.states.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      },
    }));
  };

  const deleteKanbanState = (id: KanbanStateId) => {
    setSettings((prev) => {
      // Don't allow deleting system states
      const stateToDelete = prev.kanban.states.find((s) => s.id === id);
      if (stateToDelete?.isSystem) return prev;

      return {
        ...prev,
        kanban: {
          ...prev.kanban,
          states: prev.kanban.states.filter((s) => s.id !== id),
          // Also remove transitions involving this state
          allowedTransitions: prev.kanban.allowedTransitions.filter((t) => t.fromStateId !== id && t.toStateId !== id),
          // Remove from views
          views: prev.kanban.views.map((v) => ({
            ...v,
            stateIds: v.stateIds.filter((sId) => sId !== id),
          })),
        },
      };
    });
  };

  const reorderKanbanStates = (newOrder: string[]) => {
    setSettings((prev) => ({
      ...prev,
      kanban: {
        ...prev.kanban,
        states: prev.kanban.states
          .map((s) => ({ ...s, order: newOrder.indexOf(s.id) }))
          .sort((a, b) => a.order - b.order),
      },
    }));
  };

  const addKanbanTransition = (transition: KanbanTransition) => {
    setSettings((prev) => {
      // Check if transition already exists
      const exists = prev.kanban.allowedTransitions.some(
        (t) => t.fromStateId === transition.fromStateId && t.toStateId === transition.toStateId,
      );
      if (exists) return prev;

      return {
        ...prev,
        kanban: {
          ...prev.kanban,
          allowedTransitions: [...prev.kanban.allowedTransitions, transition],
        },
      };
    });
  };

  const removeKanbanTransition = (fromStateId: KanbanStateId, toStateId: KanbanStateId) => {
    setSettings((prev) => ({
      ...prev,
      kanban: {
        ...prev.kanban,
        allowedTransitions: prev.kanban.allowedTransitions.filter(
          (t) => !(t.fromStateId === fromStateId && t.toStateId === toStateId),
        ),
      },
    }));
  };

  const addKanbanView = (view: Omit<KanbanView, "id">) => {
    const newView: KanbanView = {
      ...view,
      id: SettingsModel.createKanbanViewId(),
    };
    setSettings((prev) => ({
      ...prev,
      kanban: {
        ...prev.kanban,
        views: [...prev.kanban.views, newView],
      },
    }));
    return newView.id;
  };

  const updateKanbanView = (id: KanbanViewId, updates: Partial<KanbanView>) => {
    setSettings((prev) => ({
      ...prev,
      kanban: {
        ...prev.kanban,
        views: prev.kanban.views.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      },
    }));
  };

  const deleteKanbanView = (id: KanbanViewId) => {
    setSettings((prev) => {
      // Don't delete if it's the only view
      if (prev.kanban.views.length <= 1) return prev;

      const updatedViews = prev.kanban.views.filter((v) => v.id !== id);
      // If we deleted the active view, switch to first remaining
      const newActiveViewId = prev.kanban.activeViewId === id ? updatedViews[0]?.id : prev.kanban.activeViewId;

      return {
        ...prev,
        kanban: {
          ...prev.kanban,
          views: updatedViews,
          activeViewId: newActiveViewId,
        },
      };
    });
  };

  const setActiveKanbanView = (viewId: KanbanViewId) => {
    setSettings((prev) => ({
      ...prev,
      kanban: {
        ...prev.kanban,
        activeViewId: viewId,
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
    addKanbanState,
    updateKanbanState,
    deleteKanbanState,
    reorderKanbanStates,
    addKanbanTransition,
    removeKanbanTransition,
    addKanbanView,
    updateKanbanView,
    deleteKanbanView,
    setActiveKanbanView,
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
