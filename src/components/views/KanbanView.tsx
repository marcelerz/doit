"use client";

import { TodoMetadata } from "@/types/todo";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { KanbanSettings, Settings } from "@/types/settings";
import { KanbanState } from "@/types/kanbanState";
import { MarkerColors } from "@/types/markerColors";
import { Priority } from "@/types/priority";
import { LinkPattern } from "@/types/linkPattern";
import { Sprint } from "@/types/sprint";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";
import { MarkedText } from "@/components/shared/MarkedText";
import { TodoDetailsOverlay } from "@/components/overlays/TodoDetailsOverlay";
import { getTextColor, findPersonColor, findProjectColor, findPriorityColor } from "@/utils/colors";
import { TutorialStep } from "@/components/overlays/TutorialOverlay";

// Kanban filter types
interface KanbanFilters {
  searchText: string;
  assignedPeople: Set<string>;
  projects: Set<string>;
  priorities: Set<string>;
  dueDates: Set<string>;
  tags: Set<string>;
}

interface KanbanFilterPreset {
  id: string;
  name: string;
  filters: {
    searchText: string;
    assignedPeople: string[];
    projects: string[];
    priorities: string[];
    dueDates: string[];
    tags: string[];
  };
  sortField: "createdAt" | "updatedAt" | "dueDate" | "priority" | "title";
  sortDirection: "asc" | "desc";
}

const defaultKanbanFilters: KanbanFilters = {
  searchText: "",
  assignedPeople: new Set(),
  projects: new Set(),
  priorities: new Set(),
  dueDates: new Set(),
  tags: new Set(),
};

// Kanban View Tutorial Steps
export const kanbanViewTutorialSteps: TutorialStep[] = [
  {
    id: "kanban-intro",
    title: "Kanban Board 📊",
    description:
      "The Kanban View lets you visualize your workflow as columns. Drag tasks between columns to update their status.",
    position: "center",
  },
  {
    id: "kanban-columns",
    title: "Workflow Columns 📋",
    description:
      "Each column represents a workflow state:\n• Backlog - Tasks waiting to be started\n• To Do - Ready to work on\n• In Progress - Currently working\n• Review - Needs review\n• Completed - Done!\n\nCustomize columns in Settings → Kanban.",
    targetSelector: '[data-tutorial="kanban-board"]',
    position: "top",
    spotlightPadding: 12,
    fallbackHint: "The Kanban board shows columns for each workflow state (Backlog, To Do, In Progress, etc.)",
  },
  {
    id: "kanban-drag",
    title: "Drag & Drop 🖱️",
    description:
      "Drag tasks between columns to change their status. The task will automatically update its workflow state.\n\nYou can also drag to reorder tasks within a column.",
    position: "center",
    action: "Try dragging a task to another column!",
  },
  {
    id: "kanban-views",
    title: "Kanban Views 👁️",
    description:
      "Create custom Kanban views to show only specific columns. Great for:\n• Active Work (To Do + In Progress)\n• Review Queue (Review only)\n• Completed items\n\nSet up views in Settings → Kanban → Views.",
    targetSelector: '[data-tutorial="kanban-view-selector"]',
    position: "bottom",
    spotlightPadding: 8,
    fallbackHint: "View selector dropdown is in the toolbar above the Kanban columns",
  },
  {
    id: "kanban-sprints",
    title: "Sprint Filtering 🏃",
    description:
      "Filter the board by sprint to focus on current work. Select a sprint from the dropdown to see only tasks assigned to that sprint.",
    targetSelector: '[data-tutorial="kanban-sprint-filter"]',
    position: "bottom",
    spotlightPadding: 8,
    fallbackHint: "Sprint filter dropdown is next to the view selector in the toolbar",
  },
  {
    id: "kanban-complete",
    title: "Ready to Go! 🎉",
    description:
      "You're ready to use the Kanban Board! Customize your workflow states in Settings to match your process.",
    position: "center",
  },
];

interface KanbanViewProps {
  todos: TodoModel[];
  markerColors: MarkerColors;
  kanban: KanbanSettings;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTodo: (id: string, text: string, plainText: string, metadata: TodoMetadata) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onSetWorkflowState: (
    todoId: string,
    newStateId: string,
    kanbanStates: Array<{ id: string; mapsToTodoState?: string }>,
    allowedTransitions?: Array<{ fromStateId: string; toStateId: string }>,
  ) => boolean;
  settings: Settings;
  linkPatterns: LinkPattern[];
  availablePeople: PersonModel[];
  availableProjects: ProjectModel[];
  availablePriorities: Priority[];
  onAddPerson: (person: string) => void;
  onAddProject: (project: string) => void;
  onAddPriority: (priority: string) => void;
  onAddComment?: (todoId: string, content: string) => void;
  onUpdateKanbanSettings?: (kanban: KanbanSettings) => void;
  // Subtask handlers
  onAddSubtask?: (todoId: string, text: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
  onEditSubtask?: (todoId: string, subtaskId: string, text: string) => void;
  onDeleteSubtask?: (todoId: string, subtaskId: string) => void;
  // Time tracking handlers
  onStartTimeTracking?: (todoId: string, note?: string) => void;
  onStopTimeTracking?: (todoId: string) => void;
  onAddManualTimeEntry?: (todoId: string, minutes: number, note?: string) => void;
  onDeleteTimeEntry?: (todoId: string, entryId: string) => void;
  // Template handler
  onCreateTemplate?: (todoId: string) => void;
  // Duplicate handler
  onDuplicate?: (id: string) => string | undefined;
  // Sprints data
  sprints?: Sprint[];
  runningSprint?: Sprint;
}

interface KanbanViewOptions {
  activeViewId: string;
  sortField: "createdAt" | "updatedAt" | "dueDate" | "priority" | "title";
  sortDirection: "asc" | "desc";
  sprintId: string | null; // null = all, "backlog" = no sprint, or sprint ID
  filters: {
    searchText: string;
    assignedPeople: string[];
    projects: string[];
    priorities: string[];
    dueDates: string[];
    tags: string[];
  };
}

const defaultViewOptions: KanbanViewOptions = {
  activeViewId: "all",
  sortField: "createdAt",
  sortDirection: "desc",
  sprintId: null,
  filters: {
    searchText: "",
    assignedPeople: [],
    projects: [],
    priorities: [],
    dueDates: [],
    tags: [],
  },
};

export function KanbanView({
  todos,
  markerColors,
  kanban,
  onToggle,
  onDelete,
  onEditTodo,
  onArchive,
  onUnarchive,
  onSetWorkflowState,
  settings,
  linkPatterns,
  availablePeople,
  availableProjects,
  availablePriorities,
  onAddPerson,
  onAddProject,
  onAddPriority,
  onAddComment,
  onUpdateKanbanSettings,
  onAddSubtask,
  onToggleSubtask,
  onEditSubtask,
  onDeleteSubtask,
  onStartTimeTracking,
  onStopTimeTracking,
  onAddManualTimeEntry,
  onDeleteTimeEntry,
  onCreateTemplate,
  onDuplicate,
  sprints = [],
  runningSprint,
}: KanbanViewProps) {
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [viewOptions, setViewOptions] = useState<KanbanViewOptions>(defaultViewOptions);
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [isOptionsLoaded, setIsOptionsLoaded] = useState(false);

  // Filter and preset state
  const [filters, setFilters] = useState<KanbanFilters>(defaultKanbanFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPresets, setFilterPresets] = useState<KanbanFilterPreset[]>([]);
  const [presetsLoaded, setPresetsLoaded] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Load view options from storage
  useEffect(() => {
    waitForStorageInit()
      .then(() => {
        return Promise.all([
          loadFromStorage<KanbanViewOptions>(STORAGE_KEYS.KANBAN_VIEW_OPTIONS, defaultViewOptions),
          loadFromStorage<KanbanFilterPreset[]>("doit-kanban-filter-presets", []),
        ]);
      })
      .then(([savedOptions, savedPresets]) => {
        const mergedOptions = { ...defaultViewOptions, ...savedOptions };
        setViewOptions(mergedOptions);
        // Restore filters from saved options
        if (mergedOptions.filters) {
          setFilters({
            searchText: mergedOptions.filters.searchText || "",
            assignedPeople: new Set(mergedOptions.filters.assignedPeople || []),
            projects: new Set(mergedOptions.filters.projects || []),
            priorities: new Set(mergedOptions.filters.priorities || []),
            dueDates: new Set(mergedOptions.filters.dueDates || []),
            tags: new Set(mergedOptions.filters.tags || []),
          });
        }
        setFilterPresets(savedPresets);
        setIsOptionsLoaded(true);
        setPresetsLoaded(true);
      });
  }, []);

  // Save view options to storage (including filters)
  useEffect(() => {
    if (!isOptionsLoaded) return;
    const optionsToSave: KanbanViewOptions = {
      ...viewOptions,
      filters: {
        searchText: filters.searchText,
        assignedPeople: Array.from(filters.assignedPeople),
        projects: Array.from(filters.projects),
        priorities: Array.from(filters.priorities),
        dueDates: Array.from(filters.dueDates),
        tags: Array.from(filters.tags),
      },
    };
    saveToStorage(STORAGE_KEYS.KANBAN_VIEW_OPTIONS, optionsToSave);
  }, [viewOptions, filters, isOptionsLoaded]);

  // Save filter presets to storage
  useEffect(() => {
    if (!presetsLoaded) return;
    saveToStorage("doit-kanban-filter-presets", filterPresets);
  }, [filterPresets, presetsLoaded]);

  // Get sorted states based on order
  const sortedStates = useMemo(() => {
    return [...kanban.states].sort((a, b) => a.order - b.order);
  }, [kanban.states]);

  // Get the active view
  const activeView = useMemo(() => {
    return kanban.views.find((v) => v.id === viewOptions.activeViewId) || kanban.views[0];
  }, [kanban.views, viewOptions.activeViewId]);

  // Filter states based on active view
  const visibleStates = useMemo(() => {
    if (!activeView) return sortedStates;
    return sortedStates.filter((state) => activeView.stateIds.includes(state.id));
  }, [sortedStates, activeView]);

  // Get active sprint from props
  const activeSprint = runningSprint;

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchText.length > 0 ||
      filters.assignedPeople.size > 0 ||
      filters.projects.size > 0 ||
      filters.priorities.size > 0 ||
      filters.dueDates.size > 0 ||
      filters.tags.size > 0
    );
  }, [filters]);

  // Get filter options from todos
  const filterOptions = useMemo(() => {
    const assignedPeople = new Set<string>();
    const projects = new Set<string>();
    const priorities = new Set<string>();
    const tags = new Set<string>();

    todos.forEach((todo) => {
      if (todo.state === "deleted") return;
      todo.assignedPeople.forEach((p) => assignedPeople.add(p));
      todo.projects.forEach((p) => projects.add(p));
      if (todo.priority) priorities.add(todo.priority);
      todo.raw.metadata?.tags?.forEach((t) => tags.add(t));
    });

    return {
      assignedPeople: Array.from(assignedPeople).sort(),
      projects: Array.from(projects).sort(),
      priorities: Array.from(priorities).sort((a, b) => {
        const aOrder = availablePriorities.find((p) => p.name === a)?.order ?? Infinity;
        const bOrder = availablePriorities.find((p) => p.name === b)?.order ?? Infinity;
        return aOrder - bOrder;
      }),
      dueDates: ["overdue", "today", "thisWeek", "later", "noDueDate"],
      tags: Array.from(tags).sort(),
    };
  }, [todos, availablePriorities]);

  // Group todos by workflow state
  const todosByState = useMemo(() => {
    const grouped: Record<string, TodoModel[]> = {};

    // Initialize all states with empty arrays
    sortedStates.forEach((state) => {
      grouped[state.id] = [];
    });

    // Filter and assign todos to states
    todos.forEach((todo) => {
      // Skip deleted todos
      if (todo.state === "deleted") return;

      // Apply sprint filter
      if (viewOptions.sprintId !== null) {
        if (viewOptions.sprintId === "backlog") {
          // Show only todos without a sprint
          if (todo.raw.metadata?.sprint) return;
        } else {
          // Show only todos matching the selected sprint
          if (todo.raw.metadata?.sprint !== viewOptions.sprintId) return;
        }
      }

      // Apply search filter
      if (filters.searchText && !todo.matchesSearch(filters.searchText)) {
        return;
      }

      // Apply assigned people filter
      if (filters.assignedPeople.size > 0) {
        const hasMatch = todo.assignedPeople.some((p) => filters.assignedPeople.has(p));
        if (!hasMatch) return;
      }

      // Apply projects filter
      if (filters.projects.size > 0) {
        const hasMatch = todo.projects.some((p) => filters.projects.has(p));
        if (!hasMatch) return;
      }

      // Apply priorities filter
      if (filters.priorities.size > 0) {
        if (!todo.priority || !filters.priorities.has(todo.priority)) return;
      }

      // Apply due dates filter
      if (filters.dueDates.size > 0) {
        let matches = false;
        if (filters.dueDates.has("overdue") && todo.isOverdue) matches = true;
        if (filters.dueDates.has("today") && todo.isDueToday) matches = true;
        if (filters.dueDates.has("thisWeek") && todo.isDueThisWeek && !todo.isDueToday) matches = true;
        if (filters.dueDates.has("later") && todo.dueDateRaw && !todo.isDueThisWeek) matches = true;
        if (filters.dueDates.has("noDueDate") && !todo.dueDateRaw) matches = true;
        if (!matches) return;
      }

      // Apply tags filter
      if (filters.tags.size > 0) {
        const todoTags = todo.raw.metadata?.tags || [];
        const hasMatch = todoTags.some((t) => filters.tags.has(t));
        if (!hasMatch) return;
      }

      // Determine which state the todo belongs to
      let stateId = todo.workflowState;

      if (!stateId) {
        // Derive from TodoState if no workflow state is set
        if (todo.state === "completed") {
          stateId = "completed";
        } else if (todo.state === "archived") {
          stateId = "archived";
        } else {
          // Default to first non-system state or "backlog"
          stateId = "backlog";
        }
      }

      if (grouped[stateId]) {
        grouped[stateId].push(todo);
      } else {
        // If state doesn't exist anymore, put in first state
        const firstState = sortedStates[0];
        if (firstState) {
          grouped[firstState.id].push(todo);
        }
      }
    });

    // Sort todos within each state
    Object.keys(grouped).forEach((stateId) => {
      grouped[stateId].sort((a, b) => {
        const direction = viewOptions.sortDirection === "asc" ? 1 : -1;
        switch (viewOptions.sortField) {
          case "createdAt":
            return (a.createdAt - b.createdAt) * direction;
          case "updatedAt": {
            const aUpdated = a.updatedAt ?? a.createdAt;
            const bUpdated = b.updatedAt ?? b.createdAt;
            return (aUpdated - bUpdated) * direction;
          }
          case "dueDate": {
            const aDate = a.dueDateRaw ? new Date(a.dueDateRaw).getTime() : Infinity;
            const bDate = b.dueDateRaw ? new Date(b.dueDateRaw).getTime() : Infinity;
            return (aDate - bDate) * direction;
          }
          case "priority": {
            const getPriorityOrder = (todo: TodoModel) => {
              const priority = todo.priority;
              if (!priority) return Infinity;
              const p = availablePriorities.find((pr) => pr.name === priority);
              return p?.order ?? Infinity;
            };
            return (getPriorityOrder(a) - getPriorityOrder(b)) * direction;
          }
          case "title":
            return a.plainText.localeCompare(b.plainText) * direction;
          default:
            return 0;
        }
      });
    });

    return grouped;
  }, [
    todos,
    sortedStates,
    viewOptions.sortField,
    viewOptions.sortDirection,
    viewOptions.sprintId,
    availablePriorities,
    filters,
  ]);

  // Find selected todo
  const selectedTodo = useMemo(() => {
    if (!selectedTodoId) return null;
    return todos.find((t) => t.id === selectedTodoId) || null;
  }, [todos, selectedTodoId]);

  // Check if a transition is allowed
  const canTransition = useCallback(
    (fromStateId: string, toStateId: string): boolean => {
      if (fromStateId === toStateId) return false;
      if (kanban.allowedTransitions.length === 0) return true; // No restrictions
      return kanban.allowedTransitions.some((t) => t.fromStateId === fromStateId && t.toStateId === toStateId);
    },
    [kanban.allowedTransitions],
  );

  // Check if a state can accept more items (WIP limit check)
  const canAcceptMore = useCallback(
    (stateId: string): boolean => {
      const state = kanban.states.find((s) => s.id === stateId);
      if (!state) return false;
      // System states have no WIP limit
      if (state.isSystem) return true;
      // No WIP limit configured
      if (state.wipLimit === undefined || state.wipLimit <= 0) return true;
      // Check if under the limit
      const currentCount = todosByState[stateId]?.length || 0;
      return currentCount < state.wipLimit;
    },
    [kanban.states, todosByState],
  );

  // Color helper functions for filters
  const getPersonColor = useCallback(
    (name: string) =>
      findPersonColor(
        name,
        availablePeople.map((p) => p.raw),
        markerColors.assigned,
      ),
    [availablePeople, markerColors.assigned],
  );

  const getProjectColor = useCallback(
    (name: string) =>
      findProjectColor(
        name,
        availableProjects.map((p) => p.raw),
        markerColors.project,
      ),
    [availableProjects, markerColors.project],
  );

  const getPriorityColor = useCallback(
    (name: string | undefined) => {
      if (!name) return markerColors.priority;
      return findPriorityColor(name, availablePriorities, markerColors.priority);
    },
    [availablePriorities, markerColors.priority],
  );

  // Filter toggle helper
  const toggleFilter = useCallback((filterType: keyof Omit<KanbanFilters, "searchText">, value: string) => {
    setFilters((prev) => {
      const newSet = new Set(prev[filterType]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [filterType]: newSet };
    });
    setActivePresetId(null); // Clear active preset when manually changing filters
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters(defaultKanbanFilters);
    setActivePresetId(null);
  }, []);

  // Save current filters as preset
  const saveAsPreset = useCallback(() => {
    if (newPresetName.trim() === "") return;
    const newPreset: KanbanFilterPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      filters: {
        searchText: filters.searchText,
        assignedPeople: Array.from(filters.assignedPeople),
        projects: Array.from(filters.projects),
        priorities: Array.from(filters.priorities),
        dueDates: Array.from(filters.dueDates),
        tags: Array.from(filters.tags),
      },
      sortField: viewOptions.sortField,
      sortDirection: viewOptions.sortDirection,
    };
    setFilterPresets((prev) => [...prev, newPreset]);
    setNewPresetName("");
    setShowSavePresetModal(false);
  }, [newPresetName, filters, viewOptions.sortField, viewOptions.sortDirection]);

  // Load a preset
  const loadPreset = useCallback((preset: KanbanFilterPreset) => {
    setFilters({
      searchText: preset.filters.searchText,
      assignedPeople: new Set(preset.filters.assignedPeople),
      projects: new Set(preset.filters.projects),
      priorities: new Set(preset.filters.priorities),
      dueDates: new Set(preset.filters.dueDates),
      tags: new Set(preset.filters.tags),
    });
    setViewOptions((prev) => ({
      ...prev,
      sortField: preset.sortField,
      sortDirection: preset.sortDirection,
    }));
    setActivePresetId(preset.id);
  }, []);

  // Delete a preset
  const deletePreset = useCallback((presetId: string) => {
    setFilterPresets((prev) => prev.filter((p) => p.id !== presetId));
    setActivePresetId((current) => (current === presetId ? null : current));
  }, []);

  // Get allowed target states for a todo
  const getAllowedTargets = useCallback(
    (todoId: string): string[] => {
      const todo = todos.find((t) => t.id === todoId);
      if (!todo) return [];

      const currentState = todo.workflowState || "backlog";
      return sortedStates.filter((s) => canTransition(currentState, s.id)).map((s) => s.id);
    },
    [todos, sortedStates, canTransition],
  );

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggedTodoId(todoId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", todoId);

    // Add drag image
    const target = e.currentTarget as HTMLElement;
    if (target) {
      e.dataTransfer.setDragImage(target, 20, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent, stateId: string) => {
    e.preventDefault();
    if (!draggedTodoId) return;

    const todo = todos.find((t) => t.id === draggedTodoId);
    const fromState = todo?.workflowState || "backlog";

    // Check both transition rules and WIP limit
    if (canTransition(fromState, stateId) && canAcceptMore(stateId)) {
      e.dataTransfer.dropEffect = "move";
      setDragOverColumnId(stateId);
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = (e: React.DragEvent, targetStateId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);

    if (!draggedTodoId) return;

    const todo = todos.find((t) => t.id === draggedTodoId);
    if (!todo) return;

    const fromState = todo.workflowState || "backlog";
    // Check both transition rules and WIP limit
    if (canTransition(fromState, targetStateId) && canAcceptMore(targetStateId)) {
      onSetWorkflowState(draggedTodoId, targetStateId, kanban.states, kanban.allowedTransitions);
    }

    setDraggedTodoId(null);
  };

  const handleDragEnd = () => {
    setDraggedTodoId(null);
    setDragOverColumnId(null);
  };

  // Handle todo click
  const handleTodoClick = (todoId: string) => {
    setSelectedTodoId(todoId);
  };

  // Handle closing detail overlay
  const handleCloseDetail = () => {
    setSelectedTodoId(null);
  };

  return (
    <div className="flex flex-col h-full" data-testid="kanban-view">
      {/* Header */}
      <div className="flex flex-col gap-2 px-2 sm:px-4 py-2 sm:py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-shrink-0">
        {/* Top row: View selector, Presets, Filter button */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: View and Sprint selectors */}
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <label className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:inline">View:</label>
            <select
              value={viewOptions.activeViewId}
              onChange={(e) => setViewOptions((prev) => ({ ...prev, activeViewId: e.target.value }))}
              className="flex-1 sm:flex-none px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-base sm:text-sm"
              title="Select view"
              data-tutorial="kanban-view-selector"
            >
              {kanban.views.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>

            {/* Sprint filter */}
            {sprints.length > 0 && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600 hidden sm:inline">|</span>
                <label className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:inline">Sprint:</label>
                <select
                  value={viewOptions.sprintId ?? "all"}
                  onChange={(e) => {
                    const value = e.target.value;
                    setViewOptions((prev) => ({
                      ...prev,
                      sprintId: value === "all" ? null : value,
                    }));
                  }}
                  className="flex-1 sm:flex-none px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-base sm:text-sm"
                  title="Filter by sprint"
                  data-tutorial="kanban-sprint-filter"
                >
                  <option value="all">All Sprints</option>
                  <option value="backlog">📋 Backlog (No Sprint)</option>
                  {activeSprint && <option value={activeSprint.id}>🏃 {activeSprint.name} (Active)</option>}
                  {sprints
                    .filter((s) => s.id !== activeSprint?.id && s.state !== "archived")
                    .sort((a, b) => {
                      const statusOrder = { planning: 0, active: 1, completed: 2, cancelled: 3 };
                      return statusOrder[a.status] - statusOrder[b.status];
                    })
                    .map((sprint) => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.status === "planning" ? "📝" : sprint.status === "completed" ? "✅" : "🚫"}{" "}
                        {sprint.name}
                      </option>
                    ))}
                </select>
              </>
            )}
          </div>

          {/* Right: Presets and Filter button */}
          <div className="flex items-center gap-2">
            {/* Filter Presets */}
            {filterPresets.length > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    !hasActiveFilters && activePresetId === null
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                  title="Show all (clear filters)"
                >
                  All
                </button>
                {filterPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => loadPreset(preset)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      activePresetId === preset.id
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                    title={`Load preset: ${preset.name}`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            )}

            {/* Filter toggle button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                showFilters || hasActiveFilters
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              }`}
              title={showFilters ? "Hide filters" : "Show filters"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {hasActiveFilters && (
                <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                  {[
                    filters.searchText ? 1 : 0,
                    filters.assignedPeople.size,
                    filters.projects.size,
                    filters.priorities.size,
                    filters.dueDates.size,
                    filters.tags.size,
                  ].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter panel (collapsible) */}
        {showFilters && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 space-y-3">
            {/* Search and Sort row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <input
                type="text"
                placeholder="Search..."
                value={filters.searchText}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchText: e.target.value }))}
                className="flex-1 min-w-[150px] px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm"
              />

              {/* Sort controls */}
              <div className="flex items-center gap-1">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">Sort:</label>
                <select
                  value={viewOptions.sortField}
                  onChange={(e) =>
                    setViewOptions((prev) => ({
                      ...prev,
                      sortField: e.target.value as KanbanViewOptions["sortField"],
                    }))
                  }
                  className="px-2 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm"
                >
                  <option value="createdAt">Created</option>
                  <option value="updatedAt">Updated</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="title">Title</option>
                </select>
                <button
                  onClick={() =>
                    setViewOptions((prev) => ({
                      ...prev,
                      sortDirection: prev.sortDirection === "asc" ? "desc" : "asc",
                    }))
                  }
                  className={`px-2 py-2 rounded-md font-mono text-sm transition-all ${
                    viewOptions.sortDirection === "desc"
                      ? "bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                      : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  }`}
                  title={viewOptions.sortDirection === "asc" ? "Ascending" : "Descending"}
                >
                  {viewOptions.sortDirection === "asc" ? "abc" : "cba"}
                </button>
              </div>
            </div>

            {/* Filter sections */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {/* Assigned People */}
              {filterOptions.assignedPeople.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Assigned</label>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.assignedPeople.slice(0, 5).map((person) => (
                      <button
                        key={person}
                        onClick={() => toggleFilter("assignedPeople", person)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          filters.assignedPeople.has(person)
                            ? "text-white"
                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                        }`}
                        style={
                          filters.assignedPeople.has(person) ? { backgroundColor: getPersonColor(person) } : undefined
                        }
                      >
                        @{person}
                      </button>
                    ))}
                    {filterOptions.assignedPeople.length > 5 && (
                      <span className="text-xs text-zinc-400">+{filterOptions.assignedPeople.length - 5}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Projects */}
              {filterOptions.projects.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Projects</label>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.projects.slice(0, 5).map((project) => (
                      <button
                        key={project}
                        onClick={() => toggleFilter("projects", project)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          filters.projects.has(project)
                            ? "text-white"
                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                        }`}
                        style={
                          filters.projects.has(project) ? { backgroundColor: getProjectColor(project) } : undefined
                        }
                      >
                        %{project}
                      </button>
                    ))}
                    {filterOptions.projects.length > 5 && (
                      <span className="text-xs text-zinc-400">+{filterOptions.projects.length - 5}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Priorities */}
              {filterOptions.priorities.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Priority</label>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.priorities.map((priority) => (
                      <button
                        key={priority}
                        onClick={() => toggleFilter("priorities", priority)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          filters.priorities.has(priority)
                            ? "text-white"
                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                        }`}
                        style={
                          filters.priorities.has(priority) ? { backgroundColor: getPriorityColor(priority) } : undefined
                        }
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Dates */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Due Date</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: "overdue", label: "Overdue", color: "#ef4444" },
                    { id: "today", label: "Today", color: "#f97316" },
                    { id: "thisWeek", label: "This Week", color: "#eab308" },
                    { id: "later", label: "Later", color: "#22c55e" },
                    { id: "noDueDate", label: "No Date", color: "#6b7280" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleFilter("dueDates", option.id)}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        filters.dueDates.has(option.id)
                          ? "text-white"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                      }`}
                      style={filters.dueDates.has(option.id) ? { backgroundColor: option.color } : undefined}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {filterOptions.tags.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tags</label>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.tags.slice(0, 5).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleFilter("tags", tag)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          filters.tags.has(tag)
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                    {filterOptions.tags.length > 5 && (
                      <span className="text-xs text-zinc-400">+{filterOptions.tags.length - 5}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {/* Saved Presets - show in filter panel for easier access */}
                {filterPresets.length > 0 && (
                  <>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Presets:</span>
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        !hasActiveFilters && activePresetId === null
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                      }`}
                    >
                      All
                    </button>
                    {filterPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => loadPreset(preset)}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          activePresetId === preset.id
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                    {hasActiveFilters && activePresetId === null && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-600">|</span>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          Custom
                        </span>
                      </>
                    )}
                  </>
                )}
                {!filterPresets.length && hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Save as preset button */}
                <button
                  type="button"
                  onClick={() => setShowSavePresetModal(true)}
                  className="px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Save Preset
                </button>

                {/* Manage presets (delete) */}
                {filterPresets.length > 0 && (
                  <div className="relative group">
                    <button
                      type="button"
                      className="px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      Manage
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 z-50 hidden group-hover:block min-w-[150px]">
                      {filterPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className="flex items-center justify-between px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <span className="text-xs">{preset.name}</span>
                          <button
                            onClick={() => deletePreset(preset.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Preset Modal */}
      {showSavePresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-4 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-3">Save Filter Preset</h3>
            <input
              type="text"
              placeholder="Preset name..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveAsPreset();
                if (e.key === "Escape") setShowSavePresetModal(false);
              }}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md mb-3"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSavePresetModal(false)}
                className="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveAsPreset}
                disabled={!newPresetName.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full p-1.5 sm:p-4 gap-1.5 sm:gap-3 w-fit sm:w-full" data-tutorial="kanban-board">
          {visibleStates.map((state) => {
            const columnTodos = todosByState[state.id] || [];
            const isDropTarget = dragOverColumnId === state.id;
            // WIP limit check - only for non-system states
            const hasWipLimit = !state.isSystem && state.wipLimit !== undefined && state.wipLimit > 0;
            const isOverWipLimit = hasWipLimit && columnTodos.length > state.wipLimit!;
            const isAtWipLimit = hasWipLimit && columnTodos.length === state.wipLimit!;
            // Can drop: must have valid transition AND not at/over WIP limit
            const canDropHere =
              draggedTodoId &&
              canTransition(todos.find((t) => t.id === draggedTodoId)?.workflowState || "backlog", state.id) &&
              canAcceptMore(state.id);

            return (
              <div
                key={state.id}
                className={`flex flex-col w-[200px] sm:flex-1 sm:min-w-[180px] sm:max-w-[400px] flex-shrink-0 sm:flex-shrink rounded-lg transition-all ${
                  isDropTarget && canDropHere
                    ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : isOverWipLimit
                    ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20"
                    : "bg-zinc-100 dark:bg-zinc-800"
                } ${draggedTodoId && !canDropHere ? "opacity-50" : ""}`}
                onDragOver={(e) => handleDragOver(e, state.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, state.id)}
              >
                {/* Column Header */}
                <div
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-t-lg"
                  style={{ backgroundColor: state.color + "33" }}
                >
                  <span className="text-base sm:text-lg">{state.icon}</span>
                  <span className="font-medium text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                    {state.name}
                  </span>
                  {kanban.showTaskCount && (
                    <span
                      className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
                        isOverWipLimit
                          ? "bg-red-500 text-white"
                          : isAtWipLimit
                          ? "bg-amber-500 text-white"
                          : "bg-white/50 dark:bg-black/20"
                      }`}
                      title={
                        hasWipLimit
                          ? `${columnTodos.length}/${state.wipLimit} (WIP limit${
                              isOverWipLimit ? " exceeded!" : isAtWipLimit ? " reached" : ""
                            })`
                          : undefined
                      }
                    >
                      {columnTodos.length}
                      {hasWipLimit && `/${state.wipLimit}`}
                    </span>
                  )}
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {columnTodos.length === 0 && kanban.showEmptyColumns && (
                    <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 text-sm">No tasks</div>
                  )}

                  {columnTodos.map((todo) => {
                    const isDragging = draggedTodoId === todo.id;
                    const priorityColor = getPriorityColor(todo.priority);

                    return (
                      <div
                        key={todo.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, todo.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleTodoClick(todo.id)}
                        className={`bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-2 sm:p-3 cursor-pointer hover:shadow-md transition-all ${
                          isDragging ? "opacity-50 scale-95" : ""
                        }`}
                        style={priorityColor ? { borderLeftWidth: 3, borderLeftColor: priorityColor } : undefined}
                      >
                        {/* Card Content */}
                        <div className="text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
                          <MarkedText
                            text={todo.plainText || todo.text}
                            linkPatterns={linkPatterns}
                            markerColors={markerColors}
                          />
                        </div>

                        {/* Card Metadata */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {/* Due Date */}
                          {todo.dueDateRaw && (
                            <span
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                todo.isOverdue
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                  : todo.isDueToday
                                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              📅 {todo.dueDateDisplay}
                            </span>
                          )}

                          {/* Assigned People */}
                          {todo.assignedPeople.length > 0 && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              👤 {todo.assignedPeople.slice(0, 2).join(", ")}
                              {todo.assignedPeople.length > 2 && ` +${todo.assignedPeople.length - 2}`}
                            </span>
                          )}

                          {/* Project */}
                          {todo.projects.length > 0 && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              📁 {todo.projects[0]}
                            </span>
                          )}

                          {/* Priority */}
                          {todo.priority && (
                            <span
                              className="px-1.5 py-0.5 text-xs rounded"
                              style={{
                                backgroundColor: priorityColor ? priorityColor + "33" : undefined,
                                color: priorityColor,
                              }}
                            >
                              {todo.priority}
                            </span>
                          )}

                          {/* Comments indicator */}
                          {todo.hasComments && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              💬 {todo.commentCount}
                            </span>
                          )}

                          {/* Subtasks indicator */}
                          {todo.raw.subtasks && todo.raw.subtasks.length > 0 && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              ☑️ {todo.raw.subtasks.filter((s) => s.completed).length}/{todo.raw.subtasks.length}
                            </span>
                          )}

                          {/* Sprint indicator */}
                          {todo.raw.metadata?.sprint &&
                            (() => {
                              const sprint = sprints.find((s) => s.id === todo.raw.metadata?.sprint);
                              if (!sprint) return null;
                              return (
                                <span className="px-1.5 py-0.5 text-xs rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                                  🏃 {sprint.name}
                                </span>
                              );
                            })()}

                          {/* Time tracking indicator */}
                          {todo.hasTimeTracking && (
                            <span
                              className={`px-1.5 py-0.5 text-xs rounded flex items-center gap-1 ${
                                todo.isTrackingTime
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              {todo.isTrackingTime ? "⏱️" : "🕐"} {todo.totalTrackedTimeDisplay}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Todo Detail Overlay */}
      {selectedTodo && (
        <TodoDetailsOverlay
          todo={selectedTodo}
          todos={todos}
          isOpen={true}
          onClose={handleCloseDetail}
          onEdit={(id, text, plainText, metadata) => {
            onEditTodo(id, text, plainText, metadata);
          }}
          onToggle={(id) => {
            onToggle(id);
            handleCloseDetail();
          }}
          onDelete={(id) => {
            onDelete(id);
            handleCloseDetail();
          }}
          onDuplicate={onDuplicate}
          onArchive={
            onArchive
              ? (id) => {
                  onArchive(id);
                  handleCloseDetail();
                }
              : undefined
          }
          onUnarchive={
            onUnarchive
              ? (id) => {
                  onUnarchive(id);
                  handleCloseDetail();
                }
              : undefined
          }
          availablePeople={availablePeople}
          availableProjects={availableProjects}
          availablePriorities={availablePriorities}
          linkPatterns={linkPatterns}
          markerColors={markerColors}
          settings={settings}
          onAddPerson={onAddPerson}
          onAddProject={onAddProject}
          onAddPriority={onAddPriority}
          onAddComment={onAddComment}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onEditSubtask={onEditSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onStartTimeTracking={onStartTimeTracking}
          onStopTimeTracking={onStopTimeTracking}
          onAddManualTimeEntry={onAddManualTimeEntry}
          onDeleteTimeEntry={onDeleteTimeEntry}
          onCreateTemplate={onCreateTemplate}
        />
      )}
    </div>
  );
}
