"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTodos } from "@/hooks/useTodos";
import { useSettings } from "@/hooks/useSettings";
import { usePeople } from "@/hooks/usePeople";
import { useProjects } from "@/hooks/useProjects";
import { useTemplates } from "@/hooks/useTemplates";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useSprints } from "@/hooks/useSprints";
import { useTaskNotifications } from "@/hooks/useTaskNotifications";
import { TodoItem } from "@/components/items/TodoItem";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import { GanttView, ganttViewTutorialSteps } from "./GanttView";
import { CalendarView, calendarViewTutorialSteps } from "./CalendarView";
import { KanbanView, kanbanViewTutorialSteps } from "./KanbanView";
import { TodoListView, listViewTutorialSteps } from "./TodoListView";
import { StatisticsView } from "./StatisticsView";
import { FocusView } from "./FocusView";
import { OpenFocusView } from "./OpenFocusView";
import TimeReportsView from "./TimeReportsView";
import { ScheduledTask } from "@/utils/ganttScheduler";
import { MarkerReference } from "@/components/shared/MarkerReference";
import { TodoDetailsOverlay } from "@/components/overlays/TodoDetailsOverlay";
import { PersonDetailsOverlay } from "@/components/overlays/PersonDetailsOverlay";
import { ProjectDetailsOverlay } from "@/components/overlays/ProjectDetailsOverlay";
import { SprintDetailsOverlay } from "@/components/overlays/SprintDetailsOverlay";
import { HelpOverlay } from "@/components/overlays/HelpOverlay";
import { BatchEditModal, BatchEditData } from "@/components/overlays/BatchEditModal";
import { TutorialOverlay, mainTutorialSteps, TutorialStep } from "@/components/overlays/TutorialOverlay";
import { ViewTabs, ViewTab } from "@/components/shared/ViewTabs";
import { ListViewToolbar } from "@/components/shared/ListViewToolbar";
import { SavePresetModal } from "@/components/shared/SavePresetModal";
import { useDragReorder } from "@/hooks/useDragReorder";
import { PeopleView, peopleViewTutorialSteps } from "@/components/views/PeopleView";
import { ProjectsView, projectsViewTutorialSteps } from "@/components/views/ProjectsView";
import { SprintsView, sprintsViewTutorialSteps } from "@/components/views/SprintsView";
import { useSelectionHistory, sortByUsage, sortStringsByUsage } from "@/hooks/useSelectionHistory";
import { normalizeDateValue } from "@/utils/dateUtils";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterSection } from "@/components/shared/FilterSection";
import { ConfirmDialog } from "@/components/shared/Notification";
import { TemplatesManager, CreateTemplateModal, TemplateDropdown } from "@/components/shared/Templates";
import { SearchHistoryDropdown } from "@/components/shared/SearchHistory";
import { TodoTemplate } from "@/types/todoTemplate";
import { getColor } from "@/types/types";
import { parseTokensToMetadata } from "@/utils/tokenParser";
import { getTextColor } from "@/utils/colors";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";
import { exportTodos, ExportFormat } from "@/utils/export";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";
import {
  TodoFilters,
  SortField,
  SortDirection,
  GroupBy,
  QuickFilter,
  ViewPreset,
  useListViewState,
} from "@/hooks/useListViewState";

export function TodoApp() {
  const {
    todos,
    addTodo,
    duplicateTodo,
    toggleTodo,
    deleteTodo,
    archiveTodo,
    unarchiveTodo,
    editTodo,
    addTodoComment,
    editTodoComment,
    deleteTodoComment,
    reorderTodos,
    addSubtask,
    toggleSubtask,
    editSubtask,
    deleteSubtask,
    startTimeTracking,
    stopTimeTracking,
    addManualTimeEntry,
    deleteTimeEntry,
    setWorkflowState,
    isLoaded,
    undoActions,
    fadingOutIds,
    dependencyBlockNotification,
    undo,
    dismissUndo,
  } = useTodos();
  const { settings, addPriority, updateGantt, updateKanbanSettings } = useSettings();

  // Task notifications for due/overdue tasks
  useTaskNotifications(todos, settings.notifications);

  // Feature settings with defaults
  const features = settings.features;

  const {
    people,
    addPerson,
    updatePerson,
    deletePerson,
    archivePerson,
    unarchivePerson,
    addPersonComment,
    editPersonComment,
    deletePersonComment,
  } = usePeople();

  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    addProjectComment,
    editProjectComment,
    deleteProjectComment,
  } = useProjects();

  const {
    sprints,
    runningSprint,
    nextPlannedSprint,
    addSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    completeSprint,
    cancelSprint,
    archiveSprint,
    unarchiveSprint,
    addSprintComment,
    editSprintComment,
    deleteSprintComment,
  } = useSprints();

  // Templates and search history hooks
  const { templates, addTemplate, deleteTemplate, incrementUsage } = useTemplates();

  const {
    history: searchHistory,
    addToHistory: addToSearchHistory,
    removeFromHistory: removeFromSearchHistory,
    clearHistory: clearSearchHistory,
  } = useSearchHistory();

  const [currentTokens, setCurrentTokens] = useState<TokenMatch[]>([]);
  const [currentFullText, setCurrentFullText] = useState("");
  const [currentPlainText, setCurrentPlainText] = useState("");
  const smartInputRef = useRef<SmartEditableInputHandle>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const peopleSearchInputRef = useRef<HTMLInputElement>(null);
  const projectsSearchInputRef = useRef<HTMLInputElement>(null);
  const sprintsSearchInputRef = useRef<HTMLInputElement>(null);

  // Active view state - initialized with default, loaded from UI_OPTIONS in useEffect
  const [activeView, setActiveView] = useState<ViewTab>("list");

  // Template state
  const [showTemplatesManager, setShowTemplatesManager] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateTodoId, setTemplateTodoId] = useState<string | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // Get the active template object
  const activeTemplate = activeTemplateId ? templates.find((t) => t.id === activeTemplateId) : null;

  // Redirect to list view if current view is disabled
  useEffect(() => {
    const viewFeatureMap: Record<string, boolean | undefined> = {
      kanban: features?.kanbanView,
      gantt: features?.ganttView,
      calendar: features?.calendarView,
      sprints: features?.sprintsView,
      stats: features?.statsView,
    };

    if (activeView in viewFeatureMap && viewFeatureMap[activeView] === false) {
      setActiveView("list");
    }
  }, [activeView, features]);

  // Derived state: show filters section only in list view
  const showFiltersSection = activeView === "list";

  // Use selection history hook for tracking selections and providing usage stats
  const { usageStats, recordSelections } = useSelectionHistory();

  // Combine all person usage stats (assigned + source + mentioned) for unified sorting
  const combinedPeopleUsage = useMemo(() => {
    const combined = new Map<string, number>();

    // Add assigned people stats
    usageStats.assignedPeople.forEach((count, name) => {
      combined.set(name, (combined.get(name) || 0) + count);
    });

    // Add source people stats
    usageStats.sourcePeople.forEach((count, name) => {
      combined.set(name, (combined.get(name) || 0) + count);
    });

    // Add mentioned people stats
    usageStats.mentionedPeople.forEach((count, name) => {
      combined.set(name, (combined.get(name) || 0) + count);
    });

    return combined;
  }, [usageStats]);

  // Sort people, projects, and priorities by usage frequency, filtering out archived items for selection
  const sortedPeople = useMemo(() => {
    return sortByUsage(
      people.filter((p) => !p.archived),
      combinedPeopleUsage,
    );
  }, [people, combinedPeopleUsage]);

  const sortedProjects = useMemo(() => {
    return sortByUsage(
      projects.filter((p) => !p.archived),
      usageStats.projects,
    );
  }, [projects, usageStats.projects]);

  // Use the list view state hook for filter/sort/group management
  const {
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    filterOptions,
    hasActiveFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    groupBy,
    setGroupBy,
    activeQuickFilter,
    setActiveQuickFilter,
    quickFilterCounts,
    activeExpanded,
    setActiveExpanded,
    completedExpanded,
    setCompletedExpanded,
    archivedExpanded,
    setArchivedExpanded,
    viewPresets,
    activePreset,
    isSavePresetOpen,
    setIsSavePresetOpen,
    presetName,
    setPresetName,
    handleFilterClick,
    handleSelectAll,
    handleClearAll,
    handleClearAllFilters,
    applyFilters,
    sortTodos,
    groupTodos,
    loadPreset,
    savePreset,
    deletePreset,
  } = useListViewState({
    todos,
    projects,
    settings,
  });

  const sortedPriorities = useMemo(() => {
    return sortByUsage(settings.priorities, usageStats.priorities);
  }, [settings.priorities, usageStats.priorities]);

  // Get all unique tags from todos and sort by usage
  const sortedTags = useMemo(() => {
    const allTags = new Set<string>();
    todos.forEach((todo) => {
      todo.tags.forEach((tag) => allTags.add(tag));
    });
    return sortStringsByUsage(Array.from(allTags), usageStats.tags);
  }, [todos, usageStats.tags]);

  // All people and projects (including archived) for display in their tabs
  const allPeople = useMemo(() => {
    return sortByUsage(people, combinedPeopleUsage);
  }, [people, combinedPeopleUsage]);

  const allProjects = useMemo(() => {
    return sortByUsage(projects, usageStats.projects);
  }, [projects, usageStats.projects]);

  // Calculate task counts for people and projects (only active todos)
  const taskCountsByPerson = useMemo(() => {
    const counts = new Map<string, number>();
    todos
      .filter((t) => t.isActive)
      .forEach((todo) => {
        // Count assigned people - use TodoModel.assignedPeople
        todo.assignedPeople.forEach((personName) => {
          // Find matching person by name or alternatives
          const person = people.find((p) => p.matchesAnyName([personName]));
          if (person) {
            counts.set(person.id, (counts.get(person.id) || 0) + 1);
          }
        });
      });
    return counts;
  }, [todos, people]);

  const taskCountsByProject = useMemo(() => {
    const counts = new Map<string, number>();
    todos
      .filter((t) => t.isActive)
      .forEach((todo) => {
        // Count projects - use TodoModel.projects
        todo.projects.forEach((projectName) => {
          // Find matching project by name or alternatives
          const project = projects.find((p) => p.matchesAnyName([projectName]));
          if (project) {
            counts.set(project.id, (counts.get(project.id) || 0) + 1);
          }
        });
      });
    return counts;
  }, [todos, projects]);

  // Wrapper functions to convert name string to object format
  const handleAddPerson = (name: string) => {
    addPerson({
      name,
      alternatives: [],
      color: settings.markerColors.assigned, // Use marker color from settings
    });
  };

  const handleAddProject = (name: string) => {
    addProject({
      name,
      alternatives: [],
      color: settings.markerColors.project, // Use marker color from settings
    });
  };

  const handleAddPriority = (name: string) => {
    addPriority({
      name,
      alternatives: [],
      color: settings.markerColors.priority, // Use marker color from settings
      order: settings.priorities.length + 1,
    });
  };

  // Template handling
  const handleCreateTemplate = (todoId: string) => {
    setTemplateTodoId(todoId);
    setShowCreateTemplate(true);
  };

  const handleSaveTemplate = (
    name: string,
    description: string | undefined,
    selectedFields: {
      text: boolean;
      assignedPeople: boolean;
      sourcePeople: boolean;
      projects: boolean;
      priority: boolean;
      tags: boolean;
      dueDate: boolean;
      duration: boolean;
      subtasks: boolean;
    },
  ) => {
    const todo = todos.find((t) => t.id === templateTodoId);
    if (todo) {
      addTemplate({
        name,
        description,
        text: selectedFields.text ? todo.text : "",
        plainText: selectedFields.text ? todo.plainText : "",
        metadata: {
          assignedPeople: selectedFields.assignedPeople ? [...todo.metadata.assignedPeople] : [],
          sourcePeople: selectedFields.sourcePeople ? [...todo.metadata.sourcePeople] : [],
          mentionedPeople: [], // Don't copy mentioned people - they're auto-detected
          projects: selectedFields.projects ? [...todo.metadata.projects] : [],
          dependencies: [], // Don't copy dependencies
          priority: selectedFields.priority ? todo.metadata.priority : undefined,
          tags: selectedFields.tags ? [...(todo.metadata.tags ?? [])] : [],
          dueDate: selectedFields.dueDate ? todo.metadata.dueDate : undefined,
          duration: selectedFields.duration ? todo.metadata.duration : undefined,
        },
        subtasks: selectedFields.subtasks ? todo.subtasks?.map((s) => s.text) : undefined,
      });
    }
    setTemplateTodoId(null);
    setShowCreateTemplate(false);
  };

  const handleApplyTemplate = (template: TodoTemplate) => {
    incrementUsage(template.id);
    // Set the smart input with template content
    if (smartInputRef.current) {
      smartInputRef.current.setValue(template.text);
    }
    // Set this as the active template
    setActiveTemplateId(template.id);
    setShowTemplateDropdown(false);
  };

  const clearActiveTemplate = () => {
    setActiveTemplateId(null);
    if (smartInputRef.current) {
      smartInputRef.current.setValue("");
    }
  };

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(new Set());

  // Drag and drop reordering - use hook
  const {
    isDragMode,
    draggedTodoId,
    dragOverTodoId,
    toggleDragMode,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragReorder({ todos, reorderTodos });

  // Focus mode state
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isOpenFocusMode, setIsOpenFocusMode] = useState(false);
  const [focusTasks, setFocusTasks] = useState<ScheduledTask[]>([]);
  const [ganttRefreshKey, setGanttRefreshKey] = useState(0);

  // Search state for People/Projects/Sprints views
  const [peopleSearch, setPeopleSearch] = useState("");
  const [projectsSearch, setProjectsSearch] = useState("");
  const [sprintsSearch, setSprintsSearch] = useState("");
  const [showArchivedPeople, setShowArchivedPeople] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const [showArchivedSprints, setShowArchivedSprints] = useState(false);
  const [uiOptionsLoaded, setUiOptionsLoaded] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialChecked, setTutorialChecked] = useState(false);
  const [viewTutorialOpen, setViewTutorialOpen] = useState<string | null>(null); // Which view tutorial is open

  // Load UI options from storage (includes active tab and show archived states)
  useEffect(() => {
    waitForStorageInit()
      .then(() => {
        return loadFromStorage<{
          activeTab?: ViewTab;
          showArchivedPeople?: boolean;
          showArchivedProjects?: boolean;
          showArchivedSprints?: boolean;
        }>(STORAGE_KEYS.UI_OPTIONS, {});
      })
      .then((saved) => {
        if (saved.activeTab !== undefined) {
          const validTabs: ViewTab[] = [
            "list",
            "kanban",
            "gantt",
            "calendar",
            "people",
            "projects",
            "sprints",
            "stats",
            "timereports",
          ];
          if (validTabs.includes(saved.activeTab)) {
            setActiveView(saved.activeTab);
          }
        }
        if (saved.showArchivedPeople !== undefined) setShowArchivedPeople(saved.showArchivedPeople);
        if (saved.showArchivedProjects !== undefined) setShowArchivedProjects(saved.showArchivedProjects);
        if (saved.showArchivedSprints !== undefined) setShowArchivedSprints(saved.showArchivedSprints);
        setUiOptionsLoaded(true);
      });
  }, []);

  // Persist UI options to storage (only after initial load)
  useEffect(() => {
    if (!uiOptionsLoaded) return;
    saveToStorage(STORAGE_KEYS.UI_OPTIONS, {
      activeTab: activeView,
      showArchivedPeople,
      showArchivedProjects,
      showArchivedSprints,
    });
  }, [uiOptionsLoaded, activeView, showArchivedPeople, showArchivedProjects, showArchivedSprints]);

  // Check tutorial preferences on first load
  useEffect(() => {
    if (!uiOptionsLoaded || tutorialChecked) return;

    loadFromStorage<{ completed?: boolean; showOnStartup?: boolean }>(STORAGE_KEYS.TUTORIAL_PREFERENCES, {}).then(
      (prefs) => {
        setTutorialChecked(true);
        // Show tutorial if never completed, or if user chose to see it again
        if (!prefs.completed || prefs.showOnStartup) {
          // Delay slightly to let the UI settle
          setTimeout(() => {
            setIsTutorialOpen(true);
          }, 500);
        }
      },
    );
  }, [uiOptionsLoaded, tutorialChecked]);

  // Handle tutorial completion
  const handleTutorialComplete = useCallback((showAgain: boolean) => {
    setIsTutorialOpen(false);
    saveToStorage(STORAGE_KEYS.TUTORIAL_PREFERENCES, {
      completed: true,
      showOnStartup: showAgain,
      lastCompletedAt: new Date().toISOString(),
    });
  }, []);

  // Restart tutorial (called from HelpOverlay)
  const handleRestartTutorial = useCallback(() => {
    setIsHelpOverlayOpen(false);
    setTimeout(() => {
      setIsTutorialOpen(true);
    }, 300);
  }, []);

  // Get tutorial steps for a specific view
  const getViewTutorialSteps = useCallback((view: string): TutorialStep[] => {
    switch (view) {
      case "list":
        return listViewTutorialSteps;
      case "kanban":
        return kanbanViewTutorialSteps;
      case "gantt":
        return ganttViewTutorialSteps;
      case "calendar":
        return calendarViewTutorialSteps;
      case "people":
        return peopleViewTutorialSteps;
      case "projects":
        return projectsViewTutorialSteps;
      case "sprints":
        return sprintsViewTutorialSteps;
      default:
        return [];
    }
  }, []);

  // Handle view tutorial completion
  const handleViewTutorialComplete = useCallback(() => {
    setViewTutorialOpen(null);
  }, []);

  // Selection mode handlers
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    setSelectedTodoIds(new Set()); // Clear selections when toggling mode
  }, []);

  const handleSelectionChange = useCallback((id: string, selected: boolean) => {
    setSelectedTodoIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const selectAllInSection = useCallback((todoIds: string[]) => {
    setSelectedTodoIds((prev) => {
      const next = new Set(prev);
      todoIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const deselectAllInSection = useCallback((todoIds: string[]) => {
    setSelectedTodoIds((prev) => {
      const next = new Set(prev);
      todoIds.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = todos.filter((t) => !t.isDeleted).map((t) => t.id);
    setSelectedTodoIds(new Set(allIds));
  }, [todos]);

  const deselectAll = useCallback(() => {
    setSelectedTodoIds(new Set());
  }, []);

  // Bulk action handlers
  const bulkComplete = useCallback(() => {
    const selectedActive = todos.filter((t) => t.isActive && selectedTodoIds.has(t.id));
    selectedActive.forEach((todo) => toggleTodo(todo.id));
    setSelectedTodoIds(new Set());
  }, [todos, selectedTodoIds, toggleTodo]);

  const bulkArchive = useCallback(() => {
    const selectedCompleted = todos.filter((t) => t.isCompleted && selectedTodoIds.has(t.id));
    selectedCompleted.forEach((todo) => archiveTodo(todo.id));
    setSelectedTodoIds(new Set());
  }, [todos, selectedTodoIds, archiveTodo]);

  const bulkDelete = useCallback(() => {
    const toDelete = todos.filter((t) => selectedTodoIds.has(t.id));
    setConfirmDialog({
      title: "Delete Selected Tasks",
      message: `Are you sure you want to delete ${toDelete.length} task${
        toDelete.length === 1 ? "" : "s"
      }? This cannot be undone.`,
      onConfirm: () => {
        toDelete.forEach((todo) => deleteTodo(todo.id));
        setSelectedTodoIds(new Set());
        setConfirmDialog(null);
      },
    });
  }, [todos, selectedTodoIds, deleteTodo]);

  const bulkUnarchive = useCallback(() => {
    const selectedArchived = todos.filter((t) => t.isArchived && selectedTodoIds.has(t.id));
    selectedArchived.forEach((todo) => unarchiveTodo(todo.id));
    setSelectedTodoIds(new Set());
  }, [todos, selectedTodoIds, unarchiveTodo]);

  // Batch edit state
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);

  const openBatchEdit = useCallback(() => {
    setIsBatchEditOpen(true);
  }, []);

  const applyBatchEdit = useCallback(
    (batchEditData: BatchEditData) => {
      const selectedTodos = todos.filter((t) => selectedTodoIds.has(t.id));

      selectedTodos.forEach((todo) => {
        const newMetadata = { ...todo.metadata };

        if (batchEditData.setPriority) {
          newMetadata.priority = batchEditData.priority || undefined;
        }
        if (batchEditData.setProject) {
          if (batchEditData.project) {
            if (!newMetadata.projects.includes(batchEditData.project)) {
              newMetadata.projects = [...newMetadata.projects, batchEditData.project];
            }
          } else {
            newMetadata.projects = [];
          }
        }
        if (batchEditData.setAssignee) {
          if (batchEditData.assignee) {
            if (!newMetadata.assignedPeople.includes(batchEditData.assignee)) {
              newMetadata.assignedPeople = [...newMetadata.assignedPeople, batchEditData.assignee];
            }
          } else {
            newMetadata.assignedPeople = [];
          }
        }
        if (batchEditData.setSprint) {
          newMetadata.sprint = batchEditData.sprint || undefined;
        }
        if (batchEditData.setSource) {
          if (batchEditData.source) {
            if (!newMetadata.sourcePeople.includes(batchEditData.source)) {
              newMetadata.sourcePeople = [...newMetadata.sourcePeople, batchEditData.source];
            }
          } else {
            newMetadata.sourcePeople = [];
          }
        }
        if (batchEditData.setDueDate) {
          newMetadata.dueDate = batchEditData.dueDate || undefined;
        }
        if (batchEditData.setTags) {
          if (batchEditData.tags) {
            const newTags = batchEditData.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
            newTags.forEach((tag) => {
              if (!(newMetadata.tags ?? []).includes(tag)) {
                newMetadata.tags = [...(newMetadata.tags ?? []), tag];
              }
            });
          } else {
            newMetadata.tags = [];
          }
        }

        editTodo(todo.id, todo.text, todo.plainText, newMetadata);
      });

      setIsBatchEditOpen(false);
      setSelectedTodoIds(new Set());
    },
    [todos, selectedTodoIds, editTodo],
  );

  // Expanded todo detail state
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null);
  const [detailsOverlayTodo, setDetailsOverlayTodo] = useState<(typeof todos)[0] | null>(null);
  const [detailsOverlayPersonId, setDetailsOverlayPersonId] = useState<string | null>(null);
  const [detailsOverlayProjectId, setDetailsOverlayProjectId] = useState<string | null>(null);
  const [detailsOverlaySprintId, setDetailsOverlaySprintId] = useState<string | null>(null);

  // Add todo overlay state
  const [isAddOverlayOpen, setIsAddOverlayOpen] = useState(false);
  const [isAddPersonOverlayOpen, setIsAddPersonOverlayOpen] = useState(false);
  const [isAddProjectOverlayOpen, setIsAddProjectOverlayOpen] = useState(false);
  const [isAddSprintOverlayOpen, setIsAddSprintOverlayOpen] = useState(false);
  const [isHelpOverlayOpen, setIsHelpOverlayOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Auto-focus the input when the overlay opens
  useEffect(() => {
    if (isAddOverlayOpen && smartInputRef.current) {
      // Use setTimeout to ensure the overlay is fully rendered
      setTimeout(() => {
        smartInputRef.current?.focus();
      }, 100);
    }
  }, [isAddOverlayOpen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      // Allow Escape to work even when input is focused
      if (e.key === "Escape") {
        // Close overlays in order of priority
        if (detailsOverlayTodo) {
          setDetailsOverlayTodo(null);
          return;
        }
        if (detailsOverlayPersonId) {
          setDetailsOverlayPersonId(null);
          return;
        }
        if (detailsOverlayProjectId) {
          setDetailsOverlayProjectId(null);
          return;
        }
        if (detailsOverlaySprintId) {
          setDetailsOverlaySprintId(null);
          return;
        }
        if (isAddOverlayOpen) {
          setIsAddOverlayOpen(false);
          return;
        }
        if (isAddPersonOverlayOpen) {
          setIsAddPersonOverlayOpen(false);
          return;
        }
        if (isAddProjectOverlayOpen) {
          setIsAddProjectOverlayOpen(false);
          return;
        }
        if (isAddSprintOverlayOpen) {
          setIsAddSprintOverlayOpen(false);
          return;
        }
        if (confirmDialog) {
          setConfirmDialog(null);
          return;
        }
        if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedTodoIds(new Set());
          return;
        }
        // Blur search input if focused
        if (
          document.activeElement === searchInputRef.current ||
          document.activeElement === peopleSearchInputRef.current ||
          document.activeElement === projectsSearchInputRef.current ||
          document.activeElement === sprintsSearchInputRef.current
        ) {
          (document.activeElement as HTMLElement).blur();
          return;
        }
        return;
      }

      // Don't handle other shortcuts if user is typing
      if (isInputFocused) return;

      // 'n' - New task (open add overlay)
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (activeView === "list" || activeView === "gantt" || activeView === "calendar") {
          setIsAddOverlayOpen(true);
        } else if (activeView === "people") {
          setIsAddPersonOverlayOpen(true);
        } else if (activeView === "projects") {
          setIsAddProjectOverlayOpen(true);
        }
        return;
      }

      // '/' - Focus search
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (activeView === "list") {
          searchInputRef.current?.focus();
        } else if (activeView === "people") {
          peopleSearchInputRef.current?.focus();
        } else if (activeView === "projects") {
          projectsSearchInputRef.current?.focus();
        } else if (activeView === "sprints") {
          sprintsSearchInputRef.current?.focus();
        }
        return;
      }

      // 'f' - Toggle filters (list view only)
      if (e.key === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (activeView === "list") {
          setShowFilters((prev) => !prev);
        }
        return;
      }

      // 's' - Toggle selection mode (list view only)
      if (e.key === "s" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (activeView === "list") {
          setIsSelectionMode((prev) => !prev);
          if (isSelectionMode) {
            setSelectedTodoIds(new Set());
          }
        }
        return;
      }

      // '1-8' - Switch view tabs (respecting feature settings)
      if (e.key >= "1" && e.key <= "8" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        // Build enabled views list based on feature settings
        const enabledViews: ViewTab[] = [
          "list", // Always enabled
          ...(features?.kanbanView ? ["kanban" as ViewTab] : []),
          ...(features?.ganttView ? ["gantt" as ViewTab] : []),
          ...(features?.calendarView ? ["calendar" as ViewTab] : []),
          "people", // Always enabled
          "projects", // Always enabled
          ...(features?.sprintsView ? ["sprints" as ViewTab] : []),
          ...(features?.statsView ? ["stats" as ViewTab] : []),
        ];
        const index = parseInt(e.key) - 1;
        if (index < enabledViews.length) {
          setActiveView(enabledViews[index]);
        }
        return;
      }

      // '?' - Show keyboard shortcuts help (can be expanded later)
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setIsHelpOverlayOpen(true);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    activeView,
    detailsOverlayTodo,
    detailsOverlayPersonId,
    detailsOverlayProjectId,
    detailsOverlaySprintId,
    isAddOverlayOpen,
    isAddPersonOverlayOpen,
    isAddProjectOverlayOpen,
    isAddSprintOverlayOpen,
    confirmDialog,
    isSelectionMode,
    features,
  ]);

  const handleTokensChange = (tokens: TokenMatch[], fullText: string, plainText: string) => {
    setCurrentTokens(tokens);
    setCurrentFullText(fullText);
    setCurrentPlainText(plainText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPlainText.trim() === "") return;

    // Parse tokens into metadata
    const metadata = parseTokensToMetadata(currentTokens);

    // Apply auto-assignment defaults if field not provided
    const autoAssign = settings.autoAssign;

    if (metadata.assignedPeople.length === 0 && autoAssign.assignedPerson) {
      metadata.assignedPeople.push(autoAssign.assignedPerson);
    }
    if (metadata.sourcePeople.length === 0 && autoAssign.sourcePerson) {
      metadata.sourcePeople.push(autoAssign.sourcePerson);
    }
    if (metadata.projects.length === 0 && autoAssign.project) {
      metadata.projects.push(autoAssign.project);
    }
    if (!metadata.priority && autoAssign.priority) {
      metadata.priority = autoAssign.priority;
    }
    if (!metadata.dueDate && autoAssign.dueDate) {
      // Normalize the date value (handles "today", "tomorrow", etc.)
      const normalized = normalizeDateValue(autoAssign.dueDate, settings.dateTime, settings.workHours);
      if (normalized) {
        metadata.dueDate = normalized;
      }
    }
    if (!metadata.duration && autoAssign.duration) {
      metadata.duration = autoAssign.duration;
    }

    addTodo(currentFullText, currentPlainText, metadata);

    // Record selections for usage history
    recordSelections({
      assignedPeople: metadata.assignedPeople,
      sourcePeople: metadata.sourcePeople,
      mentionedPeople: metadata.mentionedPeople,
      projects: metadata.projects,
      priorities: metadata.priority,
      tags: metadata.tags,
      dueDates: metadata.dueDate,
      durations: metadata.duration,
      recurring: metadata.recurring,
      sprints: metadata.sprint,
    });

    // Clear the smart input
    smartInputRef.current?.clear();
    setCurrentTokens([]);
    setCurrentFullText("");
    setCurrentPlainText("");

    // Clear active template after creating todo
    setActiveTemplateId(null);
  };

  // Helper function to get button color class for filter sections
  // Uses actual marker colors from settings
  const getFilterButtonColor = (type: keyof Omit<TodoFilters, "searchText">, value: string, isSelected: boolean) => {
    if (isSelected) {
      return "px-2 py-0.5 text-xs rounded transition-colors";
    }
    return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2 py-0.5 text-xs rounded transition-colors";
  };

  // Helper function to get button inline styles for filter sections
  const getFilterButtonStyle = (
    type: keyof Omit<TodoFilters, "searchText">,
    value: string,
    isSelected: boolean,
  ): React.CSSProperties | undefined => {
    if (!isSelected) return undefined;

    const markerColorMap: Record<string, keyof typeof settings.markerColors> = {
      assignedPeople: "assigned",
      projects: "project",
      categories: "project", // Categories use project color
      sourcePeople: "source",
      mentionedPeople: "mentioned",
      priorities: "priority",
      dueDates: "dueDate",
      durations: "duration",
      tags: "tag",
      recurring: "recurring",
      dependencies: "dependency",
    };

    const markerKey = markerColorMap[type];
    const bgColor = settings.markerColors[markerKey];

    // Use centralized getTextColor utility
    const textColor = getTextColor(bgColor);

    return {
      backgroundColor: bgColor,
      color: textColor,
    };
  };

  // Calculate archive threshold
  const archiveThresholdMs = settings.general.archiveDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Categorize todos and apply filters (exclude deleted todos)
  const allActiveTodos = todos.filter((todo) => todo.isActive);
  const allCompletedTodos = todos.filter((todo) => {
    if (!todo.isCompleted) return false;
    if (!todo.completedAt) return true; // Legacy completed todos without timestamp
    const timeSinceCompletion = now - todo.completedAt;
    return timeSinceCompletion < archiveThresholdMs;
  });
  const allArchivedTodos = todos.filter((todo) => todo.isArchived);

  const activeTodos = sortTodos(applyFilters(allActiveTodos));
  const groupedActiveTodos = groupTodos(activeTodos);
  const completedTodos = sortTodos(applyFilters(allCompletedTodos));
  const archivedTodos = sortTodos(applyFilters(allArchivedTodos));

  // Export handler - exports filtered todos if filters active, otherwise all
  const handleExport = useCallback(
    (format: ExportFormat) => {
      const todosToExport = hasActiveFilters ? [...activeTodos, ...completedTodos, ...archivedTodos] : todos;
      const date = new Date().toISOString().split("T")[0];
      const filename = `todos-${date}`;
      exportTodos(todosToExport, format, filename);
    },
    [hasActiveFilters, activeTodos, completedTodos, archivedTodos, todos],
  );

  // Determine container width based on active view
  // NOTE: This must be before the isLoaded check to satisfy Rules of Hooks
  // Use consistent container width for all views to prevent jarring layout shifts
  // Individual views handle their own internal overflow/scrolling needs
  // Use full width with consistent padding - let individual views manage their content width
  const containerClass = "w-full px-2 sm:px-4 lg:px-6 xl:px-8";

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div
      data-testid="todo-app"
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 py-4 sm:py-8 px-2 sm:px-4"
    >
      <div className={containerClass}>
        <header className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">DoIt</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddOverlayOpen(true)}
                className="px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                title="Add new todo"
                data-tutorial="add-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add</span>
              </button>
              <button
                onClick={() => setIsHelpOverlayOpen(true)}
                className="px-2 sm:px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                title="Help (Shift+?)"
                data-tutorial="help-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Help</span>
              </button>
              <Link
                href="/settings"
                className="px-2 sm:px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                title="Settings"
                data-tutorial="settings-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </div>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">A simple, extensible, local todo app</p>
        </header>

        {/* View Tabs */}
        <ViewTabs
          activeView={activeView}
          onViewChange={setActiveView}
          features={features}
          runningSprint={runningSprint}
          onOpenTutorial={setViewTutorialOpen}
        />

        {/* Filter Section - Only show in List view */}
        {showFiltersSection && (
          <div className="mb-6 space-y-3">
            <ListViewToolbar
              filters={filters}
              setFilters={setFilters}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              hasActiveFilters={hasActiveFilters}
              sortField={sortField}
              setSortField={setSortField}
              sortDirection={sortDirection}
              setSortDirection={setSortDirection}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
              viewPresets={viewPresets}
              activePreset={activePreset}
              onLoadPreset={loadPreset}
              onOpenSavePreset={() => setIsSavePresetOpen(true)}
              searchHistory={searchHistory}
              addToSearchHistory={addToSearchHistory}
              removeFromSearchHistory={removeFromSearchHistory}
              clearSearchHistory={clearSearchHistory}
              features={features}
              templates={templates}
              todosCount={todos.length}
              isSelectionMode={isSelectionMode}
              toggleSelectionMode={toggleSelectionMode}
              isDragMode={isDragMode}
              toggleDragMode={toggleDragMode}
              onShowTemplatesManager={() => setShowTemplatesManager(true)}
              onExport={handleExport}
              searchInputRef={searchInputRef}
            />

            {showFilters && (
              <div
                className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 lg:p-4 space-y-2 lg:space-y-3"
                data-tutorial="filters"
              >
                {/* Grid layout for filters on larger screens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-x-6 lg:gap-y-4 [&>*]:lg:pl-6 [&>*]:lg:border-l [&>*]:lg:border-zinc-200 [&>*]:dark:lg:border-zinc-700 [&>*:first-child]:lg:pl-0 [&>*:first-child]:lg:border-l-0 [&>*:nth-child(2n+1)]:lg:pl-0 [&>*:nth-child(2n+1)]:lg:border-l-0 [&>*:nth-child(2n+1)]:xl:pl-6 [&>*:nth-child(2n+1)]:xl:border-l [&>*:nth-child(3n+1)]:xl:pl-0 [&>*:nth-child(3n+1)]:xl:border-l-0">
                  {/* Assigned People Filter */}
                  <FilterSection
                    label="Assigned (@)"
                    activeCount={filters.assignedPeople.size}
                    options={filterOptions.assignedPeople}
                    selectedValues={filters.assignedPeople}
                    onToggle={(value) => handleFilterClick("assignedPeople", value)}
                    onSelectAll={() => handleSelectAll("assignedPeople")}
                    onClear={() => handleClearAll("assignedPeople")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("assignedPeople", value, isSelected)}
                    getButtonStyle={(value, isSelected) => getFilterButtonStyle("assignedPeople", value, isSelected)}
                    formatLabel={(value) => `@${value}`}
                  />

                  {/* Projects Filter */}
                  <FilterSection
                    label="Projects (%)"
                    activeCount={filters.projects.size}
                    options={filterOptions.projects}
                    selectedValues={filters.projects}
                    onToggle={(value) => handleFilterClick("projects", value)}
                    onSelectAll={() => handleSelectAll("projects")}
                    onClear={() => handleClearAll("projects")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("projects", value, isSelected)}
                    getButtonStyle={(value, isSelected) => getFilterButtonStyle("projects", value, isSelected)}
                    formatLabel={(value) => `%${value}`}
                  />

                  {/* Categories Filter */}
                  <FilterSection
                    label="Categories"
                    activeCount={filters.categories.size}
                    options={filterOptions.categories}
                    selectedValues={filters.categories}
                    onToggle={(value) => handleFilterClick("categories", value)}
                    onSelectAll={() => handleSelectAll("categories")}
                    onClear={() => handleClearAll("categories")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("categories", value, isSelected)}
                    getButtonStyle={(value, isSelected) => {
                      if (!isSelected) return undefined;
                      // Use category's own color
                      const category = settings.categories.find((c) => c.id === value);
                      const bgColor = category?.color || settings.markerColors.project;
                      return {
                        backgroundColor: bgColor,
                        color: getTextColor(bgColor),
                      };
                    }}
                    formatLabel={(value) => {
                      const category = settings.categories.find((c) => c.id === value);
                      return category?.name || value;
                    }}
                  />

                  {/* Source People Filter */}
                  <FilterSection
                    label="Source ($)"
                    activeCount={filters.sourcePeople.size}
                    options={filterOptions.sourcePeople}
                    selectedValues={filters.sourcePeople}
                    onToggle={(value) => handleFilterClick("sourcePeople", value)}
                    onSelectAll={() => handleSelectAll("sourcePeople")}
                    onClear={() => handleClearAll("sourcePeople")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("sourcePeople", value, isSelected)}
                    getButtonStyle={(value, isSelected) => getFilterButtonStyle("sourcePeople", value, isSelected)}
                    formatLabel={(value) => `$${value}`}
                  />

                  {/* Mentioned People Filter */}
                  <FilterSection
                    label="Mentioned"
                    activeCount={filters.mentionedPeople.size}
                    options={filterOptions.mentionedPeople}
                    selectedValues={filters.mentionedPeople}
                    onToggle={(value) => handleFilterClick("mentionedPeople", value)}
                    onSelectAll={() => handleSelectAll("mentionedPeople")}
                    onClear={() => handleClearAll("mentionedPeople")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("mentionedPeople", value, isSelected)}
                    getButtonStyle={(value, isSelected) => getFilterButtonStyle("mentionedPeople", value, isSelected)}
                    formatLabel={(value) => value}
                  />

                  {/* Priority Filter */}
                  <FilterSection
                    label="Priority (!!)"
                    activeCount={filters.priorities.size}
                    options={filterOptions.priorities}
                    selectedValues={filters.priorities}
                    onToggle={(value) => handleFilterClick("priorities", value)}
                    onSelectAll={() => handleSelectAll("priorities")}
                    onClear={() => handleClearAll("priorities")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("priorities", value, isSelected)}
                    getButtonStyle={(value, isSelected) => getFilterButtonStyle("priorities", value, isSelected)}
                    formatLabel={(value) => `!!${value}`}
                  />

                  {/* Due Date Filter */}
                  <FilterSection
                    label="Due Date (~)"
                    activeCount={filters.dueDates.size}
                    options={filterOptions.dueDates}
                    selectedValues={filters.dueDates}
                    onToggle={(value) => handleFilterClick("dueDates", value)}
                    onSelectAll={() => handleSelectAll("dueDates")}
                    onClear={() => handleClearAll("dueDates")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("dueDates", value, isSelected)}
                    getButtonStyle={(value, isSelected) => getFilterButtonStyle("dueDates", value, isSelected)}
                    formatLabel={(value) => `~${value}`}
                  />

                  {/* Duration Filter */}
                  <FilterSection
                    label="Duration (*)"
                    activeCount={filters.durations.size}
                    options={filterOptions.durations}
                    selectedValues={filters.durations}
                    onToggle={(value) => handleFilterClick("durations", value)}
                    onSelectAll={() => handleSelectAll("durations")}
                    onClear={() => handleClearAll("durations")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("durations", value, isSelected)}
                    getButtonStyle={(value, isSelected) => getFilterButtonStyle("durations", value, isSelected)}
                    formatLabel={(value) => `*${value}`}
                  />

                  {/* Tags Filter */}
                  <FilterSection
                    label="Tags (&)"
                    activeCount={filters.tags.size}
                    options={filterOptions.tags}
                    selectedValues={filters.tags}
                    onToggle={(value) => handleFilterClick("tags", value)}
                    onSelectAll={() => handleSelectAll("tags")}
                    onClear={() => handleClearAll("tags")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("tags", value, isSelected)}
                    getButtonStyle={(value, isSelected) => getFilterButtonStyle("tags", value, isSelected)}
                    formatLabel={(value) => `&${value}`}
                  />

                  {/* Recurring Filter */}
                  <FilterSection
                    label="Recurring (%)"
                    activeCount={filters.recurring.size}
                    options={filterOptions.recurring}
                    selectedValues={filters.recurring}
                    onToggle={(value) => handleFilterClick("recurring", value)}
                    onSelectAll={() => handleSelectAll("recurring")}
                    onClear={() => handleClearAll("recurring")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("recurring", value, isSelected)}
                    getButtonStyle={(value, isSelected) => getFilterButtonStyle("recurring", value, isSelected)}
                    formatLabel={(value) => `%${value}`}
                  />

                  {/* Dependencies Filter */}
                  <FilterSection
                    label="Dependencies (>)"
                    activeCount={filters.dependencies.size}
                    options={filterOptions.dependencies}
                    selectedValues={filters.dependencies}
                    onToggle={(value) => handleFilterClick("dependencies", value)}
                    onSelectAll={() => handleSelectAll("dependencies")}
                    onClear={() => handleClearAll("dependencies")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("dependencies", value, isSelected)}
                    getButtonStyle={(value, isSelected) => getFilterButtonStyle("dependencies", value, isSelected)}
                    formatLabel={(value) => `>${value}`}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Content */}
        {activeView === "gantt" && (
          <GanttView
            key={ganttRefreshKey}
            todos={todos}
            markerColors={settings.markerColors}
            workHours={settings.workHours}
            onEditTodo={editTodo}
            availablePeople={sortedPeople}
            availableProjects={sortedProjects}
            availablePriorities={sortedPriorities}
            onAddPerson={handleAddPerson}
            onAddProject={handleAddProject}
            onAddPriority={handleAddPriority}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onDuplicate={duplicateTodo}
            onArchive={archiveTodo}
            onUnarchive={unarchiveTodo}
            settings={settings}
            linkPatterns={settings.linkPatterns}
            onAddComment={addTodoComment}
            onUpdateGanttSettings={updateGantt}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onEditSubtask={editSubtask}
            onDeleteSubtask={deleteSubtask}
            onStartTimeTracking={settings.features.timeTracking ? startTimeTracking : undefined}
            onStopTimeTracking={settings.features.timeTracking ? stopTimeTracking : undefined}
            onAddManualTimeEntry={settings.features.timeTracking ? addManualTimeEntry : undefined}
            onDeleteTimeEntry={settings.features.timeTracking ? deleteTimeEntry : undefined}
            onCreateTemplate={handleCreateTemplate}
            onStartFocusMode={
              features?.focusMode
                ? (tasks) => {
                    setFocusTasks(tasks);
                    setIsFocusMode(true);
                  }
                : undefined
            }
            onStartOpenFocusMode={features?.focusMode ? () => setIsOpenFocusMode(true) : undefined}
          />
        )}

        {activeView === "kanban" && (
          <KanbanView
            todos={todos}
            markerColors={settings.markerColors}
            kanban={settings.kanban}
            onEditTodo={editTodo}
            availablePeople={sortedPeople}
            availableProjects={sortedProjects}
            availablePriorities={sortedPriorities}
            onAddPerson={handleAddPerson}
            onAddProject={handleAddProject}
            onAddPriority={handleAddPriority}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onDuplicate={duplicateTodo}
            onArchive={archiveTodo}
            onUnarchive={unarchiveTodo}
            onSetWorkflowState={setWorkflowState}
            settings={settings}
            linkPatterns={settings.linkPatterns}
            onAddComment={addTodoComment}
            onUpdateKanbanSettings={updateKanbanSettings}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onEditSubtask={editSubtask}
            onDeleteSubtask={deleteSubtask}
            onStartTimeTracking={settings.features.timeTracking ? startTimeTracking : undefined}
            onStopTimeTracking={settings.features.timeTracking ? stopTimeTracking : undefined}
            onAddManualTimeEntry={settings.features.timeTracking ? addManualTimeEntry : undefined}
            onDeleteTimeEntry={settings.features.timeTracking ? deleteTimeEntry : undefined}
            onCreateTemplate={handleCreateTemplate}
            sprints={sprints.map((s) => s.raw)}
            runningSprint={runningSprint?.raw}
          />
        )}

        {activeView === "calendar" && (
          <CalendarView
            todos={todos}
            markerColors={settings.markerColors}
            settings={settings}
            linkPatterns={settings.linkPatterns}
            availablePeople={sortedPeople}
            availableProjects={sortedProjects}
            availablePriorities={sortedPriorities}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onArchive={archiveTodo}
            onUnarchive={unarchiveTodo}
            onEdit={editTodo}
            onAddPerson={handleAddPerson}
            onAddProject={handleAddProject}
            onAddPriority={handleAddPriority}
            onAddComment={addTodoComment}
            onEditComment={editTodoComment}
            onDeleteComment={deleteTodoComment}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onEditSubtask={editSubtask}
            onDeleteSubtask={deleteSubtask}
            onStartTimeTracking={settings.features.timeTracking ? startTimeTracking : undefined}
            onStopTimeTracking={settings.features.timeTracking ? stopTimeTracking : undefined}
            onAddManualTimeEntry={settings.features.timeTracking ? addManualTimeEntry : undefined}
            onDeleteTimeEntry={settings.features.timeTracking ? deleteTimeEntry : undefined}
            onCreateTemplate={handleCreateTemplate}
            onDuplicate={duplicateTodo}
          />
        )}

        {/* People View */}
        {activeView === "people" && (
          <PeopleView
            people={allPeople}
            taskCountsByPerson={taskCountsByPerson}
            search={peopleSearch}
            onSearchChange={setPeopleSearch}
            showArchived={showArchivedPeople}
            onShowArchivedChange={setShowArchivedPeople}
            onOpenPerson={(personId) => setDetailsOverlayPersonId(personId)}
            onAddPerson={() => setIsAddPersonOverlayOpen(true)}
            onArchivePerson={archivePerson}
            onUnarchivePerson={unarchivePerson}
            onDeletePerson={deletePerson}
            onRequestDeleteConfirm={(id, name) => {
              setConfirmDialog({
                title: "Delete Person",
                message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
                onConfirm: () => {
                  deletePerson(id);
                  setConfirmDialog(null);
                },
              });
            }}
            searchInputRef={peopleSearchInputRef}
          />
        )}

        {/* Projects View */}
        {activeView === "projects" && (
          <ProjectsView
            projects={allProjects}
            taskCountsByProject={taskCountsByProject}
            search={projectsSearch}
            onSearchChange={setProjectsSearch}
            showArchived={showArchivedProjects}
            onShowArchivedChange={setShowArchivedProjects}
            onOpenProject={(projectId) => setDetailsOverlayProjectId(projectId)}
            onAddProject={() => setIsAddProjectOverlayOpen(true)}
            onArchiveProject={archiveProject}
            onUnarchiveProject={unarchiveProject}
            onDeleteProject={deleteProject}
            onRequestDeleteConfirm={(id, name) => {
              setConfirmDialog({
                title: "Delete Project",
                message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
                onConfirm: () => {
                  deleteProject(id);
                  setConfirmDialog(null);
                },
              });
            }}
            searchInputRef={projectsSearchInputRef}
          />
        )}

        {/* Statistics View */}
        {activeView === "stats" && (
          <StatisticsView todos={todos} projects={projects} categories={settings.categories} />
        )}

        {/* Time Reports View */}
        {activeView === "timereports" && (
          <TimeReportsView todos={todos} people={people} projects={projects} settings={settings} sprints={sprints} />
        )}

        {/* Sprints View */}
        {activeView === "sprints" && (
          <SprintsView
            sprints={sprints}
            todos={todos}
            search={sprintsSearch}
            onSearchChange={setSprintsSearch}
            showArchived={showArchivedSprints}
            onShowArchivedChange={setShowArchivedSprints}
            onOpenSprint={(sprintId) => setDetailsOverlaySprintId(sprintId)}
            onAddSprint={() => setIsAddSprintOverlayOpen(true)}
            searchInputRef={sprintsSearchInputRef}
          />
        )}

        {activeView === "list" && (
          <>
            {/* Bulk Action Toolbar */}
            {isSelectionMode && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {selectedTodoIds.size} selected
                  </span>
                  <button onClick={selectAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Select all
                  </button>
                  <button onClick={deselectAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Clear
                  </button>
                </div>
                <div className="flex-1" />
                <div className="flex flex-wrap gap-2">
                  {/* Edit - always available when items selected */}
                  {selectedTodoIds.size > 0 && (
                    <button
                      onClick={openBatchEdit}
                      className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                  )}
                  {/* Complete - only for active todos */}
                  {todos.some((t) => t.isActive && selectedTodoIds.has(t.id)) && (
                    <button
                      onClick={bulkComplete}
                      className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Complete
                    </button>
                  )}
                  {/* Archive - only for completed todos */}
                  {todos.some((t) => t.isCompleted && selectedTodoIds.has(t.id)) && (
                    <button
                      onClick={bulkArchive}
                      className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        />
                      </svg>
                      Archive
                    </button>
                  )}
                  {/* Unarchive - only for archived todos */}
                  {todos.some((t) => t.isArchived && selectedTodoIds.has(t.id)) && (
                    <button
                      onClick={bulkUnarchive}
                      className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Restore
                    </button>
                  )}
                  {/* Delete - always available when items selected */}
                  {selectedTodoIds.size > 0 && (
                    <button
                      onClick={bulkDelete}
                      className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
                <button
                  onClick={toggleSelectionMode}
                  className="ml-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  title="Exit selection mode"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Quick Filters Bar */}
            {todos.length > 0 && !isSelectionMode && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveQuickFilter("all")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeQuickFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  All ({quickFilterCounts.all})
                </button>
                <button
                  onClick={() => setActiveQuickFilter("today")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeQuickFilter === "today"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Today ({quickFilterCounts.today})
                </button>
                {quickFilterCounts.overdue > 0 && (
                  <button
                    onClick={() => setActiveQuickFilter("overdue")}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                      activeQuickFilter === "overdue"
                        ? "bg-red-600 text-white"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Overdue ({quickFilterCounts.overdue})
                  </button>
                )}
                <button
                  onClick={() => setActiveQuickFilter("thisWeek")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeQuickFilter === "thisWeek"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  This Week ({quickFilterCounts.thisWeek})
                </button>
                <button
                  onClick={() => setActiveQuickFilter("noDueDate")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeQuickFilter === "noDueDate"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  No Due Date ({quickFilterCounts.noDueDate})
                </button>

                {/* Clear All button - shown when any filter is active */}
                {hasActiveFilters && (
                  <>
                    <div className="flex-1" />
                    <button
                      onClick={handleClearAllFilters}
                      className="px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200"
                      title="Clear all filters"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All
                    </button>
                  </>
                )}
              </div>
            )}

            <TodoListView
              todos={todos}
              activeTodos={activeTodos}
              completedTodos={completedTodos}
              archivedTodos={archivedTodos}
              groupedActiveTodos={groupedActiveTodos}
              settings={settings}
              sortedPeople={sortedPeople}
              sortedProjects={sortedProjects}
              sortedPriorities={sortedPriorities}
              sprints={sprints.map((s) => s.raw)}
              nextPlannedSprint={nextPlannedSprint?.raw}
              isSelectionMode={isSelectionMode}
              selectedTodoIds={selectedTodoIds}
              isDragMode={isDragMode}
              dragOverTodoId={dragOverTodoId}
              activeExpanded={activeExpanded}
              completedExpanded={completedExpanded}
              archivedExpanded={archivedExpanded}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onArchive={archiveTodo}
              onUnarchive={unarchiveTodo}
              onEdit={editTodo}
              onAddPerson={handleAddPerson}
              onAddProject={handleAddProject}
              onAddPriority={handleAddPriority}
              onAddComment={addTodoComment}
              onEditComment={editTodoComment}
              onDeleteComment={deleteTodoComment}
              onOpenTodoDetails={setDetailsOverlayTodo}
              onSelectionChange={handleSelectionChange}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onActiveExpandedChange={setActiveExpanded}
              onCompletedExpandedChange={setCompletedExpanded}
              onArchivedExpandedChange={setArchivedExpanded}
            />

            {/* Save Preset Modal */}
            <SavePresetModal
              isOpen={isSavePresetOpen}
              onClose={() => setIsSavePresetOpen(false)}
              presetName={presetName}
              onPresetNameChange={setPresetName}
              onSave={savePreset}
              onDelete={deletePreset}
              viewPresets={viewPresets}
            />

            {/* Dependency Block Notification */}
            {dependencyBlockNotification && (
              <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100 rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 max-w-md animate-slide-down">
                  <svg
                    className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm flex-1">{dependencyBlockNotification}</p>
                </div>
              </div>
            )}

            {/* Undo Notifications */}
            {undoActions.length > 0 && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col-reverse gap-2">
                {undoActions.map((action) => (
                  <div
                    key={action.id}
                    className={`transition-opacity duration-3000 ${
                      fadingOutIds.has(action.id) ? "opacity-0" : "opacity-100 animate-slide-up"
                    }`}
                  >
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-3 min-w-[280px]">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {action.type === "delete" && "Todo deleted"}
                          {action.type === "complete" && "Todo completed"}
                          {action.type === "uncomplete" && "Todo marked as active"}
                          {action.type === "archive" && "Todo archived"}
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 truncate max-w-[180px]">
                          {action.todo.plainText}
                        </p>
                      </div>
                      <button
                        onClick={() => undo(action.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md font-medium transition-colors flex-shrink-0"
                      >
                        Undo
                      </button>
                      <button
                        onClick={() => dismissUndo(action.id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex-shrink-0"
                        aria-label="Dismiss"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Todo Details Overlay - outside activeView check so it works from FocusView too */}
        {detailsOverlayTodo &&
          (() => {
            // Find the current version of the todo from the todos array
            const currentTodo = todos.find((t) => t.id === detailsOverlayTodo.id);
            if (!currentTodo) return null;

            return (
              <TodoDetailsOverlay
                todo={currentTodo}
                todos={todos}
                isOpen={true}
                onClose={() => setDetailsOverlayTodo(null)}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onDuplicate={duplicateTodo}
                onEdit={editTodo}
                onArchive={archiveTodo}
                onUnarchive={unarchiveTodo}
                markerColors={settings.markerColors}
                settings={settings}
                linkPatterns={settings.linkPatterns}
                availablePeople={sortedPeople}
                availableProjects={sortedProjects}
                availablePriorities={sortedPriorities}
                availableTags={sortedTags}
                onRecordSelections={recordSelections}
                onAddPerson={handleAddPerson}
                onAddProject={handleAddProject}
                onAddPriority={handleAddPriority}
                onAddComment={addTodoComment}
                onAddSubtask={addSubtask}
                onToggleSubtask={toggleSubtask}
                onEditSubtask={editSubtask}
                onDeleteSubtask={deleteSubtask}
                onStartTimeTracking={settings.features.timeTracking ? startTimeTracking : undefined}
                onStopTimeTracking={settings.features.timeTracking ? stopTimeTracking : undefined}
                onAddManualTimeEntry={settings.features.timeTracking ? addManualTimeEntry : undefined}
                onDeleteTimeEntry={settings.features.timeTracking ? deleteTimeEntry : undefined}
                onCreateTemplate={handleCreateTemplate}
                sprints={sprints.map((s) => s.raw)}
                runningSprint={runningSprint?.raw}
              />
            );
          })()}

        {/* Person Details Overlay */}
        {detailsOverlayPersonId &&
          (() => {
            const person = people.find((p) => p.id === detailsOverlayPersonId);
            return person ? (
              <PersonDetailsOverlay
                person={person}
                onClose={() => setDetailsOverlayPersonId(null)}
                onUpdate={updatePerson}
                onDelete={deletePerson}
                onArchive={archivePerson}
                onUnarchive={unarchivePerson}
                onAddComment={addPersonComment}
                onEditComment={editPersonComment}
                onDeleteComment={deletePersonComment}
              />
            ) : null;
          })()}

        {/* Project Details Overlay */}
        {detailsOverlayProjectId &&
          (() => {
            const project = projects.find((p) => p.id === detailsOverlayProjectId);
            return project ? (
              <ProjectDetailsOverlay
                project={project}
                onClose={() => setDetailsOverlayProjectId(null)}
                onUpdate={updateProject}
                onDelete={deleteProject}
                onArchive={archiveProject}
                onUnarchive={unarchiveProject}
                onAddComment={addProjectComment}
                onEditComment={editProjectComment}
                onDeleteComment={deleteProjectComment}
                categories={settings.categories}
              />
            ) : null;
          })()}

        {/* Sprint Details Overlay */}
        {detailsOverlaySprintId &&
          (() => {
            const sprint = sprints.find((s) => s.id === detailsOverlaySprintId);
            return sprint ? (
              <SprintDetailsOverlay
                sprint={sprint}
                allSprints={sprints}
                todos={todos}
                markerColors={settings.markerColors}
                onClose={() => setDetailsOverlaySprintId(null)}
                onUpdate={updateSprint}
                onDelete={(id) => {
                  deleteSprint(id);
                  setDetailsOverlaySprintId(null);
                }}
                onStart={startSprint}
                onComplete={completeSprint}
                onCancel={cancelSprint}
                onArchive={archiveSprint}
                onUnarchive={unarchiveSprint}
                onAddComment={addSprintComment}
                onEditComment={editSprintComment}
                onDeleteComment={deleteSprintComment}
                onTodoClick={(todo) => setDetailsOverlayTodo(todo)}
                onRemoveTodoFromSprint={(todoId) => {
                  const todo = todos.find((t) => t.id === todoId);
                  if (todo) {
                    editTodo(todoId, todo.text, todo.plainText, { ...todo.metadata, sprint: undefined });
                  }
                }}
              />
            ) : null;
          })()}

        {/* Add Todo Overlay */}
        {isAddOverlayOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsAddOverlayOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Add New Todo</span>
                    <InfoTooltip content={tooltipContent.smartInput} />
                  </h2>
                  <button
                    onClick={() => setIsAddOverlayOpen(false)}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Template Selector */}
                {templates.length > 0 && (
                  <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Template:</span>
                        {activeTemplate ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {activeTemplate.name}
                            </span>
                            <button
                              type="button"
                              onClick={clearActiveTemplate}
                              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                              title="Clear template"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-400">None selected</span>
                        )}
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                          className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Use Template
                        </button>
                        {showTemplateDropdown && (
                          <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
                            <ul className="py-1 max-h-64 overflow-y-auto">
                              {templates.map((template) => (
                                <li key={template.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyTemplate(template)}
                                    className={`w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${
                                      activeTemplateId === template.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                    }`}
                                  >
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                                      {template.name}
                                    </span>
                                    {template.description && (
                                      <span className="block text-xs text-zinc-500 truncate">
                                        {template.description}
                                      </span>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                            <div className="border-t border-zinc-200 dark:border-zinc-700">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowTemplateDropdown(false);
                                  setShowTemplatesManager(true);
                                }}
                                className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left"
                              >
                                Manage templates...
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Smart Input Markers Legend */}
                <MarkerReference />

                {/* Add Form */}
                <form
                  onSubmit={(e) => {
                    handleSubmit(e);
                    setIsAddOverlayOpen(false);
                  }}
                  data-tutorial="smart-input"
                >
                  <div className="mb-4">
                    <SmartEditableInput
                      ref={smartInputRef}
                      markerColors={settings.markerColors}
                      availablePeople={sortedPeople}
                      availableProjects={sortedProjects}
                      availablePriorities={sortedPriorities}
                      dateTimeSettings={settings.dateTime}
                      workHoursSettings={settings.workHours}
                      onAddPerson={handleAddPerson}
                      onAddProject={handleAddProject}
                      onAddPriority={handleAddPriority}
                      onTokensChange={handleTokensChange}
                      onEnterPress={() => {
                        const event = new Event("submit", { bubbles: true, cancelable: true });
                        handleSubmit(event as any);
                        setIsAddOverlayOpen(false);
                      }}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAddOverlayOpen(false)}
                      className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    >
                      Add Todo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Person Overlay */}
        {isAddPersonOverlayOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsAddPersonOverlayOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Person</h2>
                  <button
                    onClick={() => setIsAddPersonOverlayOpen(false)}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name") as string;
                    const alternatives = (formData.get("alternatives") as string)
                      .split(",")
                      .map((a) => a.trim())
                      .filter((a) => a);
                    const color = formData.get("color") as string;

                    if (name.trim()) {
                      addPerson({
                        name: name.trim(),
                        alternatives,
                        color: getColor(color),
                      });
                      setIsAddPersonOverlayOpen(false);
                      e.currentTarget.reset();
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="John Doe"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Alternatives (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="alternatives"
                      placeholder="Johnny, JD, John D."
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Color</label>
                    <input
                      type="color"
                      name="color"
                      defaultValue="#3b82f6"
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddPersonOverlayOpen(false)}
                      className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    >
                      Add Person
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Project Overlay */}
        {isAddProjectOverlayOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsAddProjectOverlayOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Project</h2>
                  <button
                    onClick={() => setIsAddProjectOverlayOpen(false)}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name") as string;
                    const alternatives = (formData.get("alternatives") as string)
                      .split(",")
                      .map((a) => a.trim())
                      .filter((a) => a);
                    const color = formData.get("color") as string;

                    if (name.trim()) {
                      addProject({
                        name: name.trim(),
                        alternatives,
                        color: getColor(color),
                      });
                      setIsAddProjectOverlayOpen(false);
                      e.currentTarget.reset();
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Website Redesign"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Alternatives (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="alternatives"
                      placeholder="Web Redesign, Site Refresh"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Color</label>
                    <input
                      type="color"
                      name="color"
                      defaultValue="#8b5cf6"
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddProjectOverlayOpen(false)}
                      className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    >
                      Add Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Sprint Overlay */}
        {isAddSprintOverlayOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsAddSprintOverlayOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Sprint</h2>
                  <button
                    onClick={() => setIsAddSprintOverlayOpen(false)}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name") as string;
                    const goal = formData.get("goal") as string;
                    const durationDays =
                      parseInt(formData.get("durationDays") as string) || settings.sprints?.defaultSprintDuration || 14;
                    const plannedStartDate = formData.get("plannedStartDate") as string;

                    if (name.trim()) {
                      addSprint({
                        name: name.trim(),
                        goal: goal?.trim() || undefined,
                        durationDays,
                        plannedStartDate: plannedStartDate || undefined,
                        color: undefined,
                      });
                      setIsAddSprintOverlayOpen(false);
                      e.currentTarget.reset();
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Sprint Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Sprint 1"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      name="durationDays"
                      min={1}
                      defaultValue={settings.sprints?.defaultSprintDuration || 14}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Planned Start Date (optional)
                    </label>
                    <input
                      type="date"
                      name="plannedStartDate"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Sprint Goal (optional)
                    </label>
                    <textarea
                      name="goal"
                      rows={2}
                      placeholder="What is the main objective of this sprint?"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddSprintOverlayOpen(false)}
                      className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    >
                      Add Sprint
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Batch Edit Modal */}
      <BatchEditModal
        isOpen={isBatchEditOpen}
        onClose={() => setIsBatchEditOpen(false)}
        onApply={applyBatchEdit}
        selectedCount={selectedTodoIds.size}
        priorities={sortedPriorities}
        projects={sortedProjects}
        people={sortedPeople}
        sprints={sprints.map((s) => s.raw)}
      />

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          confirmText="Delete"
          confirmVariant="danger"
        />
      )}

      {/* Focus Mode */}
      {isFocusMode && (
        <FocusView
          todos={todos}
          scheduledTasks={focusTasks}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onEdit={editTodo}
          onArchive={archiveTodo}
          markerColors={settings.markerColors}
          settings={settings}
          linkPatterns={settings.linkPatterns}
          onOpenDetails={(todo) => {
            // Don't close focus mode - it will pause automatically
            setDetailsOverlayTodo(todo);
          }}
          onClose={() => {
            setIsFocusMode(false);
            setGanttRefreshKey((k) => k + 1);
          }}
          onStartTimeTracking={settings.features.timeTracking ? startTimeTracking : undefined}
          onStopTimeTracking={settings.features.timeTracking ? stopTimeTracking : undefined}
        />
      )}

      {/* Open Focus Mode (task-free) */}
      {isOpenFocusMode && <OpenFocusView settings={settings} onClose={() => setIsOpenFocusMode(false)} />}

      {/* Templates Manager */}
      {showTemplatesManager && (
        <TemplatesManager
          templates={templates}
          onDelete={deleteTemplate}
          onClose={() => setShowTemplatesManager(false)}
        />
      )}

      {/* Create Template Modal */}
      {showCreateTemplate &&
        templateTodoId &&
        (() => {
          const todo = todos.find((t) => t.id === templateTodoId);
          if (!todo) return null;
          return (
            <CreateTemplateModal
              initialText={todo.text}
              initialPlainText={todo.plainText}
              initialMetadata={{
                assignedPeople: [...todo.metadata.assignedPeople],
                sourcePeople: [...todo.metadata.sourcePeople],
                mentionedPeople: [...todo.metadata.mentionedPeople],
                projects: [...todo.metadata.projects],
                dependencies: [],
                priority: todo.metadata.priority,
                tags: [...(todo.metadata.tags ?? [])],
                dueDate: todo.metadata.dueDate,
                duration: todo.metadata.duration,
              }}
              subtasks={todo.subtasks?.map((s) => s.text)}
              onSave={handleSaveTemplate}
              onClose={() => {
                setShowCreateTemplate(false);
                setTemplateTodoId(null);
              }}
            />
          );
        })()}

      {/* Help Overlay */}
      <HelpOverlay
        isOpen={isHelpOverlayOpen}
        onClose={() => setIsHelpOverlayOpen(false)}
        onRestartTutorial={handleRestartTutorial}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onComplete={handleTutorialComplete}
        steps={mainTutorialSteps}
        showRememberChoice={true}
        tutorialId="main"
      />

      {/* View-specific Tutorial Overlay */}
      {viewTutorialOpen && (
        <TutorialOverlay
          isOpen={true}
          onClose={() => setViewTutorialOpen(null)}
          onComplete={handleViewTutorialComplete}
          steps={getViewTutorialSteps(viewTutorialOpen)}
          showRememberChoice={false}
          tutorialId={`view-${viewTutorialOpen}`}
        />
      )}
    </div>
  );
}
