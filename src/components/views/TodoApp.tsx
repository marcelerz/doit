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
import { TodoItem } from "@/components/items/TodoItem";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import { GanttView } from "./GanttView";
import { CalendarView } from "./CalendarView";
import { KanbanView } from "./KanbanView";
import { StatisticsView } from "./StatisticsView";
import { FocusView } from "./FocusView";
import { SprintsView } from "./SprintsView";
import { MarkerReference } from "@/components/shared/MarkerReference";
import { TodoDetailsOverlay } from "@/components/overlays/TodoDetailsOverlay";
import { PersonDetailsOverlay } from "@/components/overlays/PersonDetailsOverlay";
import { ProjectDetailsOverlay } from "@/components/overlays/ProjectDetailsOverlay";
import { PersonItem } from "@/components/items/PersonItem";
import { ProjectItem } from "@/components/items/ProjectItem";
import { calculateUsageStats, sortByUsage, UsageStats } from "@/utils/usageStats";
import { normalizeDateValue } from "@/utils/dateUtils";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterSection } from "@/components/shared/FilterSection";
import { ConfirmDialog } from "@/components/shared/Notification";
import { TemplatesManager, CreateTemplateModal, TemplateDropdown } from "@/components/shared/Templates";
import { SearchHistoryDropdown } from "@/components/shared/SearchHistory";
import { TaskTemplate } from "@/types/todo";
import { parseTokensToMetadata } from "@/utils/tokenParser";
import { setToSortedArray, arrayHasAnyFromSet, setHasValue } from "@/utils/filterHelpers";
import { getTextColor } from "@/utils/colors";
import { STORAGE_KEYS, getStorageAdapter } from "@/storage/storage";
import { exportTodos, ExportFormat } from "@/utils/export";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";

interface TodoFilters {
  searchText: string;
  assignedPeople: Set<string>;
  sourcePeople: Set<string>;
  mentionedPeople: Set<string>;
  projects: Set<string>;
  categories: Set<string>;
  priorities: Set<string>;
  dueDates: Set<string>;
  durations: Set<string>;
  tags: Set<string>;
  recurring: Set<string>;
  dependencies: Set<string>;
}

type ViewTab = "list" | "kanban" | "gantt" | "calendar" | "people" | "projects" | "sprints" | "stats";

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
  const [activeView, setActiveView] = useState<ViewTab>("list");

  // Template state
  const [showTemplatesManager, setShowTemplatesManager] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateTodoId, setTemplateTodoId] = useState<string | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // Get the active template object
  const activeTemplate = activeTemplateId ? templates.find((t) => t.id === activeTemplateId) : null;

  // Search history state
  const [showSearchHistory, setShowSearchHistory] = useState(false);

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

  // Calculate usage statistics from all todos
  const usageStats = useMemo<UsageStats>(() => {
    return calculateUsageStats(todos);
  }, [todos]);

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

  const sortedPriorities = useMemo(() => {
    return sortByUsage(settings.priorities, usageStats.priorities);
  }, [settings.priorities, usageStats.priorities]);

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
        // Count assigned people
        todo.metadata.assignedPeople.forEach((personName) => {
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
        // Count projects
        todo.metadata.projects.forEach((projectName) => {
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
          tags: selectedFields.tags ? [...todo.metadata.tags] : [],
          dueDate: selectedFields.dueDate ? todo.metadata.dueDate : undefined,
          duration: selectedFields.duration ? todo.metadata.duration : undefined,
        },
        subtasks: selectedFields.subtasks ? todo.subtasks?.map((s) => s.text) : undefined,
      });
    }
    setTemplateTodoId(null);
    setShowCreateTemplate(false);
  };

  const handleApplyTemplate = (template: TaskTemplate) => {
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

  // Collapsible section states
  const [activeExpanded, setActiveExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(true);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(new Set());

  // Drag and drop reordering state
  const [isDragMode, setIsDragMode] = useState(false);
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverTodoId, setDragOverTodoId] = useState<string | null>(null);

  // Export dropdown state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Focus mode state
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    if (isExportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExportMenuOpen]);

  // Search state for People/Projects views
  const [peopleSearch, setPeopleSearch] = useState("");
  const [projectsSearch, setProjectsSearch] = useState("");
  const [showArchivedPeople, setShowArchivedPeople] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);

  // Filtered people and projects based on search and archive filter
  const filteredPeople = useMemo(() => {
    return allPeople.filter((person) => {
      // Filter by archived status
      if (!showArchivedPeople && person.isArchived) return false;
      // Filter by search term
      if (peopleSearch.trim()) {
        return person.matchesSearch(peopleSearch);
      }
      return true;
    });
  }, [allPeople, peopleSearch, showArchivedPeople]);

  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      // Filter by archived status
      if (!showArchivedProjects && project.isArchived) return false;
      // Filter by search term
      if (projectsSearch.trim()) {
        return project.matchesSearch(projectsSearch);
      }
      return true;
    });
  }, [allProjects, projectsSearch, showArchivedProjects]);

  // Quick filter state
  type QuickFilter = "all" | "today" | "overdue" | "thisWeek" | "noDueDate";
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>(() => {
    try {
      if (typeof window !== "undefined") {
        const result = getStorageAdapter().getItem(STORAGE_KEYS.VIEW_OPTIONS);
        const saved = typeof result === "string" ? result : null;
        if (saved) {
          const parsed = JSON.parse(saved);
          return (parsed.quickFilter as QuickFilter) || "all";
        }
      }
    } catch (e) {
      console.error("Failed to load quick filter from localStorage:", e);
    }
    return "all";
  });

  // Helper to check if date is today
  const isToday = useCallback((dateStr: string | undefined) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  }, []);

  // Helper to check if date is overdue
  const isOverdue = useCallback((dateStr: string | undefined) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  }, []);

  // Helper to check if date is this week
  const isThisWeek = useCallback((dateStr: string | undefined) => {
    if (!dateStr) return false;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const date = new Date(dateStr);
    return date >= startOfWeek && date <= endOfWeek;
  }, []);

  // Quick filter counts
  const quickFilterCounts = useMemo(() => {
    const activeTodosAll = todos.filter((t) => t.isActive);
    return {
      all: activeTodosAll.length,
      today: activeTodosAll.filter((t) => isToday(t.metadata.dueDate)).length,
      overdue: activeTodosAll.filter((t) => isOverdue(t.metadata.dueDate)).length,
      thisWeek: activeTodosAll.filter((t) => isThisWeek(t.metadata.dueDate)).length,
      noDueDate: activeTodosAll.filter((t) => !t.metadata.dueDate).length,
    };
  }, [todos, isToday, isOverdue, isThisWeek]);

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
  const [batchEditData, setBatchEditData] = useState<{
    setPriority: boolean;
    priority: string;
    setProject: boolean;
    project: string;
    setAssignee: boolean;
    assignee: string;
    setSprint: boolean;
    sprint: string;
    setSource: boolean;
    source: string;
    setDueDate: boolean;
    dueDate: string;
    setTags: boolean;
    tags: string;
  }>({
    setPriority: false,
    priority: "",
    setProject: false,
    project: "",
    setAssignee: false,
    assignee: "",
    setSprint: false,
    sprint: "",
    setSource: false,
    source: "",
    setDueDate: false,
    dueDate: "",
    setTags: false,
    tags: "",
  });

  const openBatchEdit = useCallback(() => {
    setBatchEditData({
      setPriority: false,
      priority: "",
      setProject: false,
      project: "",
      setAssignee: false,
      assignee: "",
      setSprint: false,
      sprint: "",
      setSource: false,
      source: "",
      setDueDate: false,
      dueDate: "",
      setTags: false,
      tags: "",
    });
    setIsBatchEditOpen(true);
  }, []);

  const applyBatchEdit = useCallback(() => {
    const selectedTodos = todos.filter((t) => selectedTodoIds.has(t.id));

    selectedTodos.forEach((todo) => {
      const newMetadata = { ...todo.metadata };

      if (batchEditData.setPriority) {
        newMetadata.priority = batchEditData.priority || undefined;
      }
      if (batchEditData.setProject) {
        if (batchEditData.project) {
          // Add project if not already present
          if (!newMetadata.projects.includes(batchEditData.project)) {
            newMetadata.projects = [...newMetadata.projects, batchEditData.project];
          }
        } else {
          // Clear projects if empty
          newMetadata.projects = [];
        }
      }
      if (batchEditData.setAssignee) {
        if (batchEditData.assignee) {
          // Add assignee if not already present
          if (!newMetadata.assignedPeople.includes(batchEditData.assignee)) {
            newMetadata.assignedPeople = [...newMetadata.assignedPeople, batchEditData.assignee];
          }
        } else {
          // Clear assignees if empty
          newMetadata.assignedPeople = [];
        }
      }
      if (batchEditData.setSprint) {
        // Set or clear sprint
        newMetadata.sprint = batchEditData.sprint || undefined;
      }
      if (batchEditData.setSource) {
        if (batchEditData.source) {
          // Add source if not already present
          if (!newMetadata.sourcePeople.includes(batchEditData.source)) {
            newMetadata.sourcePeople = [...newMetadata.sourcePeople, batchEditData.source];
          }
        } else {
          // Clear source people if empty
          newMetadata.sourcePeople = [];
        }
      }
      if (batchEditData.setDueDate) {
        newMetadata.dueDate = batchEditData.dueDate || undefined;
      }
      if (batchEditData.setTags) {
        if (batchEditData.tags) {
          // Add tags (split by comma)
          const newTags = batchEditData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          newTags.forEach((tag) => {
            if (!newMetadata.tags.includes(tag)) {
              newMetadata.tags = [...newMetadata.tags, tag];
            }
          });
        } else {
          // Clear tags if empty
          newMetadata.tags = [];
        }
      }

      editTodo(todo.id, todo.text, todo.plainText, newMetadata);
    });

    setIsBatchEditOpen(false);
    setSelectedTodoIds(new Set());
  }, [todos, selectedTodoIds, batchEditData, editTodo]);

  // Drag and drop handlers
  const toggleDragMode = useCallback(() => {
    setIsDragMode((prev) => !prev);
    setDraggedTodoId(null);
    setDragOverTodoId(null);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedTodoId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTodoId(null);
    setDragOverTodoId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault();
      if (draggedTodoId && draggedTodoId !== id) {
        setDragOverTodoId(id);
      }
    },
    [draggedTodoId],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverTodoId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const sourceId = draggedTodoId;

      if (!sourceId || sourceId === targetId) {
        setDraggedTodoId(null);
        setDragOverTodoId(null);
        return;
      }

      // Get current active todos in order (filtered by active state)
      const activeTodosList = todos.filter((t) => t.isActive);
      const activeTodoIds = activeTodosList.map((t) => t.id);

      // Find positions
      const sourceIndex = activeTodoIds.indexOf(sourceId);
      const targetIndex = activeTodoIds.indexOf(targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        setDraggedTodoId(null);
        setDragOverTodoId(null);
        return;
      }

      // Create new order by moving source to target position
      const newOrder = [...activeTodoIds];
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, sourceId);

      // Apply new order
      reorderTodos(newOrder);

      setDraggedTodoId(null);
      setDragOverTodoId(null);
    },
    [draggedTodoId, todos, reorderTodos],
  );

  // Expanded todo detail state
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null);
  const [detailsOverlayTodo, setDetailsOverlayTodo] = useState<(typeof todos)[0] | null>(null);
  const [detailsOverlayPersonId, setDetailsOverlayPersonId] = useState<string | null>(null);
  const [detailsOverlayProjectId, setDetailsOverlayProjectId] = useState<string | null>(null);

  // Add todo overlay state
  const [isAddOverlayOpen, setIsAddOverlayOpen] = useState(false);
  const [isAddPersonOverlayOpen, setIsAddPersonOverlayOpen] = useState(false);
  const [isAddProjectOverlayOpen, setIsAddProjectOverlayOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // View presets state
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [activePreset, setActivePreset] = useState<string>("custom");

  // Sorting and grouping types
  type SortField =
    | "manual"
    | "dueDate"
    | "duration"
    | "assigned"
    | "source"
    | "mentioned"
    | "project"
    | "priority"
    | "timeSpent"
    | "created";
  type SortDirection = "asc" | "desc";
  type GroupBy = "none" | "dueDate" | "priority" | "project" | "category" | "assigned" | "sprint";

  interface ViewPreset {
    name: string;
    filters: {
      searchText: string;
      assignedPeople: string[];
      sourcePeople: string[];
      mentionedPeople: string[];
      projects: string[];
      categories: string[];
      priorities: string[];
      dueDates: string[];
      durations: string[];
      tags: string[];
      recurring: string[];
      dependencies: string[];
    };
    sortField: SortField;
    sortDirection: SortDirection;
    groupBy: GroupBy;
  }

  // Load saved view presets
  const [viewPresets, setViewPresets] = useState<ViewPreset[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const result = getStorageAdapter().getItem(STORAGE_KEYS.VIEW_PRESETS);
        const saved = typeof result === "string" ? result : null;
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (e) {
      console.error("Failed to load view presets from localStorage:", e);
    }
    return [];
  });

  // Save view presets to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      getStorageAdapter().setItem(STORAGE_KEYS.VIEW_PRESETS, JSON.stringify(viewPresets));
    }
  }, [viewPresets]);

  // Load all view options from a single localStorage key
  const [filters, setFilters] = useState<TodoFilters>(() => {
    try {
      if (typeof window !== "undefined") {
        const result = getStorageAdapter().getItem(STORAGE_KEYS.VIEW_OPTIONS);
        const saved = typeof result === "string" ? result : null;
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            searchText: parsed.filters?.searchText || "",
            assignedPeople: new Set(parsed.filters?.assignedPeople || []),
            sourcePeople: new Set(parsed.filters?.sourcePeople || []),
            mentionedPeople: new Set(parsed.filters?.mentionedPeople || []),
            projects: new Set(parsed.filters?.projects || []),
            categories: new Set(parsed.filters?.categories || []),
            priorities: new Set(parsed.filters?.priorities || []),
            dueDates: new Set(parsed.filters?.dueDates || []),
            durations: new Set(parsed.filters?.durations || []),
            tags: new Set(parsed.filters?.tags || []),
            recurring: new Set(parsed.filters?.recurring || []),
            dependencies: new Set(parsed.filters?.dependencies || []),
          };
        }
      }
    } catch (e) {
      console.error("Failed to load view options from localStorage:", e);
    }
    return {
      searchText: "",
      assignedPeople: new Set(),
      sourcePeople: new Set(),
      mentionedPeople: new Set(),
      projects: new Set(),
      categories: new Set(),
      priorities: new Set(),
      dueDates: new Set(),
      durations: new Set(),
      tags: new Set(),
      recurring: new Set(),
      dependencies: new Set(),
    };
  });

  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>(() => {
    try {
      if (typeof window !== "undefined") {
        const result = getStorageAdapter().getItem(STORAGE_KEYS.VIEW_OPTIONS);
        const saved = typeof result === "string" ? result : null;
        if (saved) {
          const parsed = JSON.parse(saved);
          return (parsed.sortField as SortField) || "priority";
        }
      }
    } catch (e) {
      console.error("Failed to load view options from localStorage:", e);
    }
    return "priority";
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    try {
      if (typeof window !== "undefined") {
        const result = getStorageAdapter().getItem(STORAGE_KEYS.VIEW_OPTIONS);
        const saved = typeof result === "string" ? result : null;
        if (saved) {
          const parsed = JSON.parse(saved);
          return (parsed.sortDirection as SortDirection) || "asc";
        }
      }
    } catch (e) {
      console.error("Failed to load view options from localStorage:", e);
    }
    return "asc";
  });

  const [groupBy, setGroupBy] = useState<GroupBy>(() => {
    try {
      if (typeof window !== "undefined") {
        const result = getStorageAdapter().getItem(STORAGE_KEYS.VIEW_OPTIONS);
        const saved = typeof result === "string" ? result : null;
        if (saved) {
          const parsed = JSON.parse(saved);
          return (parsed.groupBy as GroupBy) || "dueDate";
        }
      }
    } catch (e) {
      console.error("Failed to load view options from localStorage:", e);
    }
    return "dueDate";
  });

  // Save all view options to localStorage whenever any of them change
  useEffect(() => {
    const viewOptions = {
      filters: {
        searchText: filters.searchText,
        assignedPeople: Array.from(filters.assignedPeople),
        sourcePeople: Array.from(filters.sourcePeople),
        mentionedPeople: Array.from(filters.mentionedPeople),
        projects: Array.from(filters.projects),
        categories: Array.from(filters.categories),
        priorities: Array.from(filters.priorities),
        dueDates: Array.from(filters.dueDates),
        durations: Array.from(filters.durations),
        tags: Array.from(filters.tags),
        recurring: Array.from(filters.recurring),
        dependencies: Array.from(filters.dependencies),
      },
      sortField,
      sortDirection,
      groupBy,
      quickFilter: activeQuickFilter,
    };
    if (typeof window !== "undefined") {
      getStorageAdapter().setItem(STORAGE_KEYS.VIEW_OPTIONS, JSON.stringify(viewOptions));
    }

    // Check if current view matches any preset
    const matchingPreset = viewPresets.find((preset) => {
      return (
        preset.filters.searchText === filters.searchText &&
        arraysEqual(preset.filters.assignedPeople, Array.from(filters.assignedPeople)) &&
        arraysEqual(preset.filters.sourcePeople, Array.from(filters.sourcePeople)) &&
        arraysEqual(preset.filters.mentionedPeople, Array.from(filters.mentionedPeople)) &&
        arraysEqual(preset.filters.projects, Array.from(filters.projects)) &&
        arraysEqual(preset.filters.priorities, Array.from(filters.priorities)) &&
        arraysEqual(preset.filters.dueDates, Array.from(filters.dueDates)) &&
        arraysEqual(preset.filters.durations, Array.from(filters.durations)) &&
        preset.sortField === sortField &&
        preset.sortDirection === sortDirection &&
        preset.groupBy === groupBy
      );
    });

    setActivePreset(matchingPreset ? matchingPreset.name : "custom");
  }, [filters, sortField, sortDirection, groupBy, activeQuickFilter, viewPresets]);

  // Helper function to compare arrays
  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  // Load a preset
  const loadPreset = (preset: ViewPreset) => {
    setFilters({
      searchText: preset.filters.searchText,
      assignedPeople: new Set(preset.filters.assignedPeople),
      sourcePeople: new Set(preset.filters.sourcePeople),
      mentionedPeople: new Set(preset.filters.mentionedPeople),
      projects: new Set(preset.filters.projects),
      categories: new Set(preset.filters.categories || []),
      priorities: new Set(preset.filters.priorities),
      dueDates: new Set(preset.filters.dueDates),
      durations: new Set(preset.filters.durations),
      tags: new Set(preset.filters.tags || []),
      recurring: new Set(preset.filters.recurring || []),
      dependencies: new Set(preset.filters.dependencies || []),
    });
    setSortField(preset.sortField);
    setSortDirection(preset.sortDirection);
    setGroupBy(preset.groupBy);
    setActivePreset(preset.name);
  };

  // Save current view as a preset
  const savePreset = (name: string) => {
    const newPreset: ViewPreset = {
      name,
      filters: {
        searchText: filters.searchText,
        assignedPeople: Array.from(filters.assignedPeople),
        sourcePeople: Array.from(filters.sourcePeople),
        mentionedPeople: Array.from(filters.mentionedPeople),
        projects: Array.from(filters.projects),
        categories: Array.from(filters.categories),
        priorities: Array.from(filters.priorities),
        dueDates: Array.from(filters.dueDates),
        durations: Array.from(filters.durations),
        tags: Array.from(filters.tags),
        recurring: Array.from(filters.recurring),
        dependencies: Array.from(filters.dependencies),
      },
      sortField,
      sortDirection,
      groupBy,
    };

    // Replace if exists, otherwise add
    setViewPresets((prev) => {
      const existing = prev.findIndex((p) => p.name === name);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newPreset;
        return updated;
      }
      return [...prev, newPreset];
    });

    setActivePreset(name);
    setIsSavePresetOpen(false);
    setPresetName("");
  };

  // Delete a preset
  const deletePreset = (name: string) => {
    setViewPresets((prev) => prev.filter((p) => p.name !== name));
    if (activePreset === name) {
      setActivePreset("custom");
    }
  };

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
          document.activeElement === projectsSearchInputRef.current
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
        // For now, just log - could show a help modal later
        console.log("Keyboard shortcuts: n=new, /=search, f=filters, s=select, 1-8=views, Esc=close");
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
    isAddOverlayOpen,
    isAddPersonOverlayOpen,
    isAddProjectOverlayOpen,
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
    if (!currentPlainText.trim()) return;

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

    // Clear the smart input
    smartInputRef.current?.clear();
    setCurrentTokens([]);
    setCurrentFullText("");
    setCurrentPlainText("");

    // Clear active template after creating todo
    setActiveTemplateId(null);
  };

  const markers = {
    assigned: "@",
    source: "$",
    mentioned: "", // Auto-detected, no marker
    project: "#",
    priority: "!!",
    dueDate: "~",
    duration: "*",
    recurring: "%",
    dependency: ">",
  };

  // Extract unique values from all todos for filter options
  const filterOptions = useMemo(() => {
    const assignedPeople = new Set<string>();
    const sourcePeople = new Set<string>();
    const mentionedPeople = new Set<string>();
    const projectNames = new Set<string>();
    const priorities = new Set<string>();
    const dueDates = new Set<string>();
    const durations = new Set<string>();
    const tags = new Set<string>();
    const recurring = new Set<string>();
    const dependencies = new Set<string>();

    const usedCategoryIds = new Set<string>();

    todos.forEach((todo) => {
      todo.metadata.assignedPeople.forEach((p) => assignedPeople.add(p));
      todo.metadata.sourcePeople.forEach((p) => sourcePeople.add(p));
      todo.metadata.mentionedPeople.forEach((p) => mentionedPeople.add(p));
      todo.metadata.projects.forEach((projectName) => {
        projectNames.add(projectName);
        // Find the project and add its category if it has one
        const project = projects.find((p) => p.matchesAnyName([projectName]));
        if (project?.raw.category) {
          usedCategoryIds.add(project.raw.category);
        }
      });
      if (todo.metadata.priority) priorities.add(todo.metadata.priority);
      if (todo.metadata.dueDate) dueDates.add(todo.metadata.dueDate);
      if (todo.metadata.duration) durations.add(todo.metadata.duration);
      todo.metadata.tags.forEach((t) => tags.add(t));
      if (todo.metadata.recurring) recurring.add(todo.metadata.recurring);
      todo.metadata.dependencies.forEach((d) => dependencies.add(d));
    });

    // Categories: only show categories that are actually used by projects in todos
    const categoriesInUse = Array.from(usedCategoryIds);

    return {
      assignedPeople: setToSortedArray(assignedPeople),
      sourcePeople: setToSortedArray(sourcePeople),
      mentionedPeople: setToSortedArray(mentionedPeople),
      projects: setToSortedArray(projectNames),
      categories: categoriesInUse,
      priorities: setToSortedArray(priorities),
      dueDates: setToSortedArray(dueDates),
      durations: setToSortedArray(durations),
      tags: setToSortedArray(tags),
      recurring: setToSortedArray(recurring),
      dependencies: setToSortedArray(dependencies),
    };
  }, [todos, projects, settings.categories]);

  // Filter handler functions
  const handleFilterClick = (type: keyof Omit<TodoFilters, "searchText">, value: string) => {
    setFilters((prev) => {
      const newSet = new Set(prev[type]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [type]: newSet };
    });
    if (!showFilters) setShowFilters(true);
  };

  const handleSelectAll = (type: keyof Omit<TodoFilters, "searchText">) => {
    const allValues = filterOptions[type];
    setFilters((prev) => ({ ...prev, [type]: new Set(allValues) }));
  };

  const handleClearAll = (type: keyof Omit<TodoFilters, "searchText">) => {
    setFilters((prev) => ({ ...prev, [type]: new Set() }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      searchText: "",
      assignedPeople: new Set(),
      sourcePeople: new Set(),
      mentionedPeople: new Set(),
      projects: new Set(),
      categories: new Set(),
      priorities: new Set(),
      dueDates: new Set(),
      durations: new Set(),
      tags: new Set(),
      recurring: new Set(),
      dependencies: new Set(),
    });
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

  const hasActiveFilters =
    filters.searchText ||
    filters.assignedPeople.size > 0 ||
    filters.sourcePeople.size > 0 ||
    filters.mentionedPeople.size > 0 ||
    filters.projects.size > 0 ||
    filters.categories.size > 0 ||
    filters.priorities.size > 0 ||
    filters.dueDates.size > 0 ||
    filters.durations.size > 0 ||
    filters.tags.size > 0 ||
    filters.recurring.size > 0 ||
    filters.dependencies.size > 0;

  // Apply filters to todos
  const applyFilters = (todoList: typeof todos) => {
    return todoList.filter((todo) => {
      // Quick filter (only for active todos)
      if (activeQuickFilter !== "all" && todo.isActive) {
        switch (activeQuickFilter) {
          case "today":
            if (!isToday(todo.metadata.dueDate)) return false;
            break;
          case "overdue":
            if (!isOverdue(todo.metadata.dueDate)) return false;
            break;
          case "thisWeek":
            if (!isThisWeek(todo.metadata.dueDate)) return false;
            break;
          case "noDueDate":
            if (todo.metadata.dueDate) return false;
            break;
        }
      }

      // Text search using TodoModel method
      if (filters.searchText && !todo.matchesSearch(filters.searchText)) {
        return false;
      }

      // Metadata filters (OR logic within each category)
      if (filters.assignedPeople.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.assignedPeople, filters.assignedPeople)) {
          return false;
        }
      }

      if (filters.sourcePeople.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.sourcePeople, filters.sourcePeople)) {
          return false;
        }
      }

      if (filters.mentionedPeople.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.mentionedPeople, filters.mentionedPeople)) {
          return false;
        }
      }

      if (filters.projects.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.projects, filters.projects)) {
          return false;
        }
      }

      // Category filter - check if any of the todo's projects belong to selected categories
      if (filters.categories.size > 0) {
        const todoCategories = todo.metadata.projects
          .map((projectName) => {
            const project = projects.find((p) => p.matchesAnyName([projectName]));
            return project?.raw.category;
          })
          .filter((c): c is string => !!c);

        if (!arrayHasAnyFromSet(todoCategories, filters.categories)) {
          return false;
        }
      }

      if (filters.priorities.size > 0) {
        if (!setHasValue(filters.priorities, todo.metadata.priority)) {
          return false;
        }
      }

      if (filters.dueDates.size > 0) {
        if (!setHasValue(filters.dueDates, todo.metadata.dueDate)) {
          return false;
        }
      }

      if (filters.durations.size > 0) {
        if (!setHasValue(filters.durations, todo.metadata.duration)) {
          return false;
        }
      }

      if (filters.tags.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.tags, filters.tags)) {
          return false;
        }
      }

      if (filters.recurring.size > 0) {
        if (!setHasValue(filters.recurring, todo.metadata.recurring)) {
          return false;
        }
      }

      if (filters.dependencies.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.dependencies, filters.dependencies)) {
          return false;
        }
      }

      return true;
    });
  };

  // Sort todos by the selected field and direction
  const sortTodos = (todoList: typeof todos) => {
    return [...todoList].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "manual":
          // Sort by manual sortOrder (lower = higher priority)
          const aManualOrder = a.raw.sortOrder ?? Number.MAX_SAFE_INTEGER;
          const bManualOrder = b.raw.sortOrder ?? Number.MAX_SAFE_INTEGER;
          comparison = aManualOrder - bManualOrder;
          break;

        case "dueDate":
          const aDate = a.metadata.dueDate || "";
          const bDate = b.metadata.dueDate || "";
          comparison = aDate.localeCompare(bDate);
          // Put empty dates at the end
          if (!aDate && bDate) return 1;
          if (aDate && !bDate) return -1;
          break;

        case "duration":
          const aDuration = a.metadata.duration || "";
          const bDuration = b.metadata.duration || "";
          comparison = aDuration.localeCompare(bDuration);
          if (!aDuration && bDuration) return 1;
          if (aDuration && !bDuration) return -1;
          break;

        case "assigned":
          const aAssigned = a.metadata.assignedPeople[0] || "";
          const bAssigned = b.metadata.assignedPeople[0] || "";
          comparison = aAssigned.localeCompare(bAssigned);
          break;

        case "source":
          const aSource = a.metadata.sourcePeople[0] || "";
          const bSource = b.metadata.sourcePeople[0] || "";
          comparison = aSource.localeCompare(bSource);
          break;

        case "mentioned":
          const aMentioned = a.metadata.mentionedPeople[0] || "";
          const bMentioned = b.metadata.mentionedPeople[0] || "";
          comparison = aMentioned.localeCompare(bMentioned);
          break;

        case "project":
          const aProject = a.metadata.projects[0] || "";
          const bProject = b.metadata.projects[0] || "";
          comparison = aProject.localeCompare(bProject);
          break;

        case "priority":
          const priorityOrder: Record<string, number> = {};
          settings.priorities.forEach((p, idx) => {
            priorityOrder[p.name.toLowerCase()] = p.order;
            p.alternatives.forEach((alt) => {
              priorityOrder[alt.toLowerCase()] = p.order;
            });
          });
          const aPriority = a.metadata.priority?.toLowerCase() || "";
          const bPriority = b.metadata.priority?.toLowerCase() || "";
          const aOrder = priorityOrder[aPriority] ?? 999;
          const bOrder = priorityOrder[bPriority] ?? 999;
          comparison = aOrder - bOrder;
          break;

        case "timeSpent":
          const aTimeSpent = a.totalTrackedMinutes;
          const bTimeSpent = b.totalTrackedMinutes;
          comparison = aTimeSpent - bTimeSpent;
          // Put items with no time at the end
          if (aTimeSpent === 0 && bTimeSpent > 0) return 1;
          if (aTimeSpent > 0 && bTimeSpent === 0) return -1;
          break;

        case "created":
        default:
          comparison = b.createdAt - a.createdAt; // Newest first by default
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  // Group todos by the selected grouping
  const groupTodos = (todoList: typeof todos): Record<string, typeof todos> => {
    if (groupBy === "none") {
      return { "": todoList };
    }

    if (groupBy === "dueDate") {
      const grouped: Record<string, typeof todos> = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;

      todoList.forEach((todo) => {
        let groupKey = "No Due Date";

        if (todo.metadata.dueDate) {
          try {
            // Parse the due date string - handle both YYYY-MM-DD and YYYY-MM-DDTHH:mm formats
            let dueDate: Date;
            const dueDateStr = todo.metadata.dueDate;

            if (dueDateStr.includes("T")) {
              // Has time component - extract date part and parse locally
              const [year, month, day] = dueDateStr.split("T")[0].split("-").map(Number);
              dueDate = new Date(year, month - 1, day);
            } else {
              // Date only format
              const [year, month, day] = dueDateStr.split("-").map(Number);
              dueDate = new Date(year, month - 1, day);
            }

            dueDate.setHours(0, 0, 0, 0);
            const dueDateMs = dueDate.getTime();

            if (dueDateMs < todayMs) {
              groupKey = "Overdue";
            } else if (dueDateMs === todayMs) {
              groupKey = "Today";
            } else if (dueDateMs === todayMs + oneDayMs) {
              groupKey = "Tomorrow";
            } else if (dueDateMs <= todayMs + 7 * oneDayMs) {
              groupKey = "This Week";
            } else if (dueDateMs <= todayMs + 30 * oneDayMs) {
              groupKey = "This Month";
            } else {
              groupKey = "Later";
            }
          } catch (e) {
            groupKey = "Invalid Date";
          }
        }

        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(todo);
      });

      // Sort groups by priority
      const groupOrder = [
        "Overdue",
        "Today",
        "Tomorrow",
        "This Week",
        "This Month",
        "Later",
        "No Due Date",
        "Invalid Date",
      ];
      const sortedGroups: Record<string, typeof todos> = {};
      groupOrder.forEach((key) => {
        if (grouped[key]) {
          sortedGroups[key] = grouped[key];
        }
      });

      return sortedGroups;
    }

    if (groupBy === "priority") {
      const grouped: Record<string, typeof todos> = {};

      todoList.forEach((todo) => {
        const groupKey = todo.metadata.priority || "No Priority";
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(todo);
      });

      // Sort groups by priority order
      const priorityOrder: Record<string, number> = {};
      settings.priorities.forEach((p) => {
        priorityOrder[p.name.toLowerCase()] = p.order;
        p.alternatives.forEach((alt) => {
          priorityOrder[alt.toLowerCase()] = p.order;
        });
      });

      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === "No Priority") return 1;
        if (b === "No Priority") return -1;
        const aOrder = priorityOrder[a.toLowerCase()] ?? 999;
        const bOrder = priorityOrder[b.toLowerCase()] ?? 999;
        return aOrder - bOrder;
      });

      const sortedGroups: Record<string, typeof todos> = {};
      sortedKeys.forEach((key) => {
        sortedGroups[key] = grouped[key];
      });

      return sortedGroups;
    }

    if (groupBy === "project") {
      const grouped: Record<string, typeof todos> = {};

      todoList.forEach((todo) => {
        const projectName = todo.metadata.projects[0] || "No Project";
        if (!grouped[projectName]) {
          grouped[projectName] = [];
        }
        grouped[projectName].push(todo);
      });

      // Sort groups alphabetically, with "No Project" at the end
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === "No Project") return 1;
        if (b === "No Project") return -1;
        return a.localeCompare(b);
      });

      const sortedGroups: Record<string, typeof todos> = {};
      sortedKeys.forEach((key) => {
        sortedGroups[key] = grouped[key];
      });

      return sortedGroups;
    }

    if (groupBy === "category") {
      const grouped: Record<string, typeof todos> = {};

      todoList.forEach((todo) => {
        // Find category from first project
        let categoryName = "No Category";
        if (todo.metadata.projects.length > 0) {
          const projectName = todo.metadata.projects[0];
          const project = projects.find((p) => p.matchesAnyName([projectName]));
          if (project?.raw.category) {
            const category = settings.categories.find((c) => c.id === project.raw.category);
            categoryName = category?.name || "No Category";
          }
        }

        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }
        grouped[categoryName].push(todo);
      });

      // Sort groups alphabetically, with "No Category" at the end
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === "No Category") return 1;
        if (b === "No Category") return -1;
        return a.localeCompare(b);
      });

      const sortedGroups: Record<string, typeof todos> = {};
      sortedKeys.forEach((key) => {
        sortedGroups[key] = grouped[key];
      });

      return sortedGroups;
    }

    if (groupBy === "assigned") {
      const grouped: Record<string, typeof todos> = {};

      todoList.forEach((todo) => {
        const assignedName = todo.metadata.assignedPeople[0] || "Unassigned";
        if (!grouped[assignedName]) {
          grouped[assignedName] = [];
        }
        grouped[assignedName].push(todo);
      });

      // Sort groups alphabetically, with "Unassigned" at the end
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === "Unassigned") return 1;
        if (b === "Unassigned") return -1;
        return a.localeCompare(b);
      });

      const sortedGroups: Record<string, typeof todos> = {};
      sortedKeys.forEach((key) => {
        sortedGroups[key] = grouped[key];
      });

      return sortedGroups;
    }

    if (groupBy === "sprint") {
      const grouped: Record<string, typeof todos> = {};

      todoList.forEach((todo) => {
        let groupKey = "Backlog";
        if (todo.metadata.sprint) {
          const sprint = sprints.find((s) => s.id === todo.metadata.sprint);
          groupKey = sprint?.name || "Unknown Sprint";
        }
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(todo);
      });

      // Sort groups: Active sprint first, then by start date, then "Backlog" at end
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === "Backlog") return 1;
        if (b === "Backlog") return -1;
        if (a === "Unknown Sprint") return 1;
        if (b === "Unknown Sprint") return -1;

        const sprintA = sprints.find((s) => s.name === a);
        const sprintB = sprints.find((s) => s.name === b);

        // Active sprint first
        if (sprintA?.status === "active" && sprintB?.status !== "active") return -1;
        if (sprintB?.status === "active" && sprintA?.status !== "active") return 1;

        // Then by planned start date (most recent first)
        const dateA = sprintA?.raw.plannedStartDate ? new Date(sprintA.raw.plannedStartDate).getTime() : 0;
        const dateB = sprintB?.raw.plannedStartDate ? new Date(sprintB.raw.plannedStartDate).getTime() : 0;
        return dateB - dateA;
      });

      const sortedGroups: Record<string, typeof todos> = {};
      sortedKeys.forEach((key) => {
        sortedGroups[key] = grouped[key];
      });

      return sortedGroups;
    }

    return { "": todoList };
  };

  // Sort todos by priority (legacy - now part of sortTodos)
  const sortByPriority = (todoList: typeof todos) => {
    const priorityOrder: Record<string, number> = {
      "0": 0,
      ubn: 0,
      "1": 1,
      high: 1,
      "2": 2,
      med: 2,
      medium: 2,
      "3": 3,
      low: 3,
      "4": 4,
      wish: 4,
    };

    return [...todoList].sort((a, b) => {
      const aPriority = a.metadata.priority?.toLowerCase() || "";
      const bPriority = b.metadata.priority?.toLowerCase() || "";

      const aOrder = priorityOrder[aPriority] ?? 999;
      const bOrder = priorityOrder[bPriority] ?? 999;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // If same priority or no priority, sort by creation date (newest first)
      return b.createdAt - a.createdAt;
    });
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
      setIsExportMenuOpen(false);
    },
    [hasActiveFilters, activeTodos, completedTodos, archivedTodos, todos],
  );

  // Determine container width based on active view
  // NOTE: This must be before the isLoaded check to satisfy Rules of Hooks
  // Use consistent container width for all views to prevent jarring layout shifts
  // Individual views handle their own internal overflow/scrolling needs
  const containerClass = "max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto";

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 py-4 sm:py-8 px-2 sm:px-4">
      <div className={containerClass}>
        <header className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">DoIt</h1>
            <div className="flex items-center gap-2">
              {/* Focus Mode Button - only show if feature enabled and there are active todos */}
              {features?.focusMode && todos.filter((t) => t.isActive).length > 0 && (
                <button
                  onClick={() => setIsFocusMode(true)}
                  className="px-2 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                  title="Enter focus mode"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Focus</span>
                </button>
              )}
              <button
                onClick={() => setIsAddOverlayOpen(true)}
                className="px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                title="Add new todo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add</span>
              </button>
              <Link
                href="/settings"
                className="px-2 sm:px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                title="Settings"
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
        <div className="mb-6 overflow-x-auto -mx-2 sm:-mx-0 px-2 sm:px-0">
          <div className="flex gap-1 sm:gap-2 border-b border-zinc-200 dark:border-zinc-800 min-w-max">
            <button
              onClick={() => setActiveView("list")}
              className={`px-2 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 ${
                activeView === "list"
                  ? "text-blue-600 dark:text-blue-400 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
              title="List view"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">List</span>
              </div>
            </button>
            {features?.kanbanView && (
              <button
                onClick={() => setActiveView("kanban")}
                className={`px-2 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 ${
                  activeView === "kanban"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600"
                    : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
                title="Kanban view"
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                    />
                  </svg>
                  <span className="hidden sm:inline">Kanban</span>
                </div>
              </button>
            )}
            {features?.ganttView && (
              <button
                onClick={() => setActiveView("gantt")}
                className={`px-2 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 ${
                  activeView === "gantt"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600"
                    : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
                title="Gantt view"
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {/* Horizontal bars representing a Gantt chart timeline */}
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h10M4 12h16M4 18h12" />
                  </svg>
                  <span className="hidden sm:inline">Gantt</span>
                </div>
              </button>
            )}
            {features?.calendarView && (
              <button
                onClick={() => setActiveView("calendar")}
                className={`px-2 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 ${
                  activeView === "calendar"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600"
                    : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
                title="Calendar view"
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Calendar</span>
                </div>
              </button>
            )}
            <button
              onClick={() => setActiveView("people")}
              className={`px-2 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 ${
                activeView === "people"
                  ? "text-blue-600 dark:text-blue-400 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
              title="People view"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="hidden sm:inline">People</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView("projects")}
              className={`px-2 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 ${
                activeView === "projects"
                  ? "text-blue-600 dark:text-blue-400 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
              title="Projects view"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span className="hidden sm:inline">Projects</span>
              </div>
            </button>
            {features?.sprintsView && (
              <button
                onClick={() => setActiveView("sprints")}
                className={`px-2 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 ${
                  activeView === "sprints"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600"
                    : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
                title="Sprints view"
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="hidden sm:inline">Sprints</span>
                  {runningSprint && (
                    <span className="hidden sm:inline w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
              </button>
            )}
            {features?.statsView && (
              <button
                onClick={() => setActiveView("stats")}
                className={`px-2 sm:px-4 py-2 sm:py-3 font-medium transition-colors border-b-2 ${
                  activeView === "stats"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600"
                    : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
                title="Stats view"
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Stats</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Filter Section - Only show in List view */}
        {showFiltersSection && (
          <div className="mb-6 space-y-3">
            {/* View Presets Row */}
            {viewPresets.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Views:</span>
                {viewPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => loadPreset(preset)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                      activePreset === preset.name
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
                {activePreset === "custom" && (
                  <span className="px-3 py-1.5 rounded-lg font-medium text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    Custom
                  </span>
                )}
              </div>
            )}

            {/* Top Row: Search + Show Filters Toggle + Group By + Sort By + Save */}
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              {/* Search Input with History */}
              <div className="relative flex-1 min-w-[140px] sm:min-w-[200px] lg:min-w-[300px] xl:min-w-[400px]">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search tasks... (press / to focus)"
                  value={filters.searchText}
                  onChange={(e) => setFilters((prev) => ({ ...prev, searchText: e.target.value }))}
                  onFocus={() => {
                    if (!filters.searchText && searchHistory.length > 0) {
                      setShowSearchHistory(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow click on history items
                    setTimeout(() => setShowSearchHistory(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filters.searchText.trim()) {
                      addToSearchHistory(filters.searchText.trim());
                      setShowSearchHistory(false);
                    } else if (e.key === "Escape") {
                      setShowSearchHistory(false);
                    }
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Search History Dropdown */}
                <SearchHistoryDropdown
                  history={searchHistory}
                  onSelect={(query) => {
                    setFilters((prev) => ({ ...prev, searchText: query }));
                    addToSearchHistory(query);
                    setShowSearchHistory(false);
                  }}
                  onRemove={removeFromSearchHistory}
                  onClear={clearSearchHistory}
                  isVisible={showSearchHistory && !filters.searchText}
                />
              </div>

              {/* Show Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  showFilters || hasActiveFilters
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                {showFilters ? "Hide" : "Filter"}
                {hasActiveFilters && !showFilters && (
                  <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                    {Object.values(filters).filter((v) => v && (typeof v === "string" ? v : v.size > 0)).length}
                  </span>
                )}
              </button>

              {/* Group By */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap hidden sm:inline">
                  Group:
                </label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                  className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Group by"
                >
                  <option value="none">No Group</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="project">Project</option>
                  <option value="category">Category</option>
                  <option value="assigned">Assigned</option>
                  <option value="sprint">Sprint</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap hidden sm:inline">
                  Sort:
                </label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Sort by"
                >
                  <option value="manual">Manual</option>
                  <option value="created">Created</option>
                  <option value="dueDate">Due Date</option>
                  <option value="duration">Duration</option>
                  <option value="priority">Priority</option>
                  <option value="assigned">Assigned</option>
                  <option value="source">Source</option>
                  <option value="mentioned">Mentioned</option>
                  <option value="project">Project</option>
                  <option value="timeSpent">Time Spent</option>
                </select>
                <button
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  title={sortDirection === "asc" ? "Ascending" : "Descending"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortDirection === "asc" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Save View Button */}
              <button
                onClick={() => setIsSavePresetOpen(true)}
                className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                title="Save current view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-600 mx-1" />

              {/* Templates Button */}
              {features?.templates && templates.length > 0 && (
                <button
                  onClick={() => setShowTemplatesManager(true)}
                  className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  title="Manage templates"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                </button>
              )}

              {/* Export Button */}
              {features?.exports && todos.length > 0 && (
                <div ref={exportMenuRef} className="relative">
                  <button
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    title="Export todos"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>

                  {/* Export Dropdown Menu */}
                  {isExportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50">
                      <button
                        onClick={() => handleExport("markdown")}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Markdown (.md)
                      </button>
                      <button
                        onClick={() => handleExport("csv")}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        CSV (.csv)
                      </button>
                      <button
                        onClick={() => handleExport("json")}
                        className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          />
                        </svg>
                        JSON (.json)
                      </button>
                      <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
                      <div className="px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {hasActiveFilters ? "Exports filtered todos" : "Exports all todos"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selection Mode Toggle */}
              {features?.batchProcessing && todos.length > 0 && (
                <button
                  onClick={toggleSelectionMode}
                  className={`p-2 rounded-lg transition-colors ${
                    isSelectionMode
                      ? "bg-blue-600 text-white"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                  title={isSelectionMode ? "Exit selection mode" : "Enter selection mode"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </button>
              )}

              {/* Drag reorder button */}
              {features?.reordering && todos.length > 0 && (
                <button
                  onClick={toggleDragMode}
                  className={`p-2 rounded-lg transition-colors ${
                    isDragMode
                      ? "bg-purple-600 text-white"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                  title={isDragMode ? "Exit reorder mode" : "Enter reorder mode"}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                </button>
              )}
            </div>

            {showFilters && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 lg:p-4 space-y-2 lg:space-y-3">
                {/* Grid layout for filters on larger screens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-4">
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
                    label="Projects (#)"
                    activeCount={filters.projects.size}
                    options={filterOptions.projects}
                    selectedValues={filters.projects}
                    onToggle={(value) => handleFilterClick("projects", value)}
                    onSelectAll={() => handleSelectAll("projects")}
                    onClear={() => handleClearAll("projects")}
                    getButtonColor={(value, isSelected) => getFilterButtonColor("projects", value, isSelected)}
                    getButtonStyle={(value, isSelected) => getFilterButtonStyle("projects", value, isSelected)}
                    formatLabel={(value) => `#${value}`}
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

                {/* Clear All Filters Button */}
                {hasActiveFilters && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={handleClearAllFilters}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* View Content */}
        {activeView === "gantt" && (
          <GanttView
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
            onStartTimeTracking={startTimeTracking}
            onStopTimeTracking={stopTimeTracking}
            onAddManualTimeEntry={addManualTimeEntry}
            onDeleteTimeEntry={deleteTimeEntry}
            onCreateTemplate={handleCreateTemplate}
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
            onStartTimeTracking={startTimeTracking}
            onStopTimeTracking={stopTimeTracking}
            onAddManualTimeEntry={addManualTimeEntry}
            onDeleteTimeEntry={deleteTimeEntry}
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
            onStartTimeTracking={startTimeTracking}
            onStopTimeTracking={stopTimeTracking}
            onAddManualTimeEntry={addManualTimeEntry}
            onDeleteTimeEntry={deleteTimeEntry}
            onCreateTemplate={handleCreateTemplate}
            onDuplicate={duplicateTodo}
          />
        )}

        {/* People View */}
        {activeView === "people" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">People</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {filteredPeople.length} of {allPeople.length} {allPeople.length === 1 ? "person" : "people"}
                </p>
              </div>
              <button
                onClick={() => setIsAddPersonOverlayOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Person
              </button>
            </div>

            {/* Search and filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={peopleSearchInputRef}
                  type="text"
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  placeholder="Search people... (press / to focus)"
                  className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {peopleSearch && (
                  <button
                    onClick={() => setPeopleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showArchivedPeople}
                  onChange={(e) => setShowArchivedPeople(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                Show archived
              </label>
            </div>

            {allPeople.length === 0 ? (
              <EmptyState emoji="👥" title="No People" message="No people yet. Add one to get started!" />
            ) : filteredPeople.length === 0 ? (
              <EmptyState emoji="🔍" title="No Results" message="No people match your search." />
            ) : (
              <ul className="space-y-2">
                {filteredPeople.map((person) => (
                  <li key={person.id}>
                    <PersonItem
                      person={person}
                      onClick={() => setDetailsOverlayPersonId(person.id)}
                      onDelete={deletePerson}
                      onArchive={archivePerson}
                      onUnarchive={unarchivePerson}
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
                      taskCount={taskCountsByPerson.get(person.id) || 0}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Projects View */}
        {activeView === "projects" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Projects</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {filteredProjects.length} of {allProjects.length} {allProjects.length === 1 ? "project" : "projects"}
                </p>
              </div>
              <button
                onClick={() => setIsAddProjectOverlayOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Project
              </button>
            </div>

            {/* Search and filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={projectsSearchInputRef}
                  type="text"
                  value={projectsSearch}
                  onChange={(e) => setProjectsSearch(e.target.value)}
                  placeholder="Search projects... (press / to focus)"
                  className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {projectsSearch && (
                  <button
                    onClick={() => setProjectsSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showArchivedProjects}
                  onChange={(e) => setShowArchivedProjects(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                Show archived
              </label>
            </div>

            {allProjects.length === 0 ? (
              <EmptyState emoji="📁" title="No Projects" message="No projects yet. Add one to get started!" />
            ) : filteredProjects.length === 0 ? (
              <EmptyState emoji="🔍" title="No Results" message="No projects match your search." />
            ) : (
              <ul className="space-y-2">
                {filteredProjects.map((project) => (
                  <li key={project.id}>
                    <ProjectItem
                      project={project}
                      onClick={() => setDetailsOverlayProjectId(project.id)}
                      onDelete={deleteProject}
                      onArchive={archiveProject}
                      onUnarchive={unarchiveProject}
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
                      taskCount={taskCountsByProject.get(project.id) || 0}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Statistics View */}
        {activeView === "stats" && (
          <StatisticsView todos={todos} projects={projects} categories={settings.categories} />
        )}

        {/* Sprints View */}
        {activeView === "sprints" && (
          <SprintsView
            sprints={sprints}
            todos={todos}
            onAdd={addSprint}
            onUpdate={updateSprint}
            onDelete={deleteSprint}
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
            defaultDuration={settings.sprints?.defaultSprintDuration || 14}
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
              <div className="mb-4 flex flex-wrap gap-2">
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
              </div>
            )}

            {todos.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-xl text-zinc-600 dark:text-zinc-400">No tasks yet. Add one to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTodos.length > 0 && (
                  <section>
                    <button
                      onClick={() => setActiveExpanded(!activeExpanded)}
                      className="w-full flex items-center justify-between text-left mb-3 group"
                    >
                      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Active ({activeTodos.length})
                      </h2>
                      <svg
                        className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                          activeExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeExpanded && (
                      <div className="space-y-4">
                        {Object.entries(groupedActiveTodos).map(([groupName, groupTodos]) => (
                          <div key={groupName}>
                            {groupName && (
                              <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-wide mb-2 pl-2">
                                {groupName} ({groupTodos.length})
                              </h3>
                            )}
                            <ul className="space-y-2">
                              {groupTodos.map((todo) => (
                                <li
                                  key={todo.id}
                                  onClick={() => setDetailsOverlayTodo(todo)}
                                  className="cursor-pointer"
                                >
                                  <TodoItem
                                    todo={todo}
                                    onToggle={toggleTodo}
                                    onDelete={deleteTodo}
                                    onArchive={archiveTodo}
                                    onUnarchive={unarchiveTodo}
                                    onEdit={editTodo}
                                    markerColors={settings.markerColors}
                                    settings={settings}
                                    linkPatterns={settings.linkPatterns}
                                    availablePeople={sortedPeople}
                                    availableProjects={sortedProjects}
                                    availablePriorities={sortedPriorities}
                                    onAddPerson={handleAddPerson}
                                    onAddProject={handleAddProject}
                                    onAddPriority={handleAddPriority}
                                    isExpanded={false}
                                    onToggleExpand={() => {}}
                                    onAddComment={addTodoComment}
                                    onEditComment={editTodoComment}
                                    onDeleteComment={deleteTodoComment}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedTodoIds.has(todo.id)}
                                    onSelectionChange={handleSelectionChange}
                                    isDraggable={isDragMode && todo.isActive}
                                    isDraggedOver={dragOverTodoId === todo.id}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    sprints={sprints.map((s) => s.raw)}
                                    nextPlannedSprint={nextPlannedSprint?.raw}
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {completedTodos.length > 0 && (
                  <section>
                    <button
                      onClick={() => setCompletedExpanded(!completedExpanded)}
                      className="w-full flex items-center justify-between text-left mb-3 group"
                    >
                      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Completed ({completedTodos.length})
                      </h2>
                      <svg
                        className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                          completedExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {completedExpanded && (
                      <ul className="space-y-2">
                        {completedTodos.map((todo) => (
                          <li key={todo.id} onClick={() => setDetailsOverlayTodo(todo)} className="cursor-pointer">
                            <TodoItem
                              todo={todo}
                              onToggle={toggleTodo}
                              onDelete={deleteTodo}
                              onArchive={archiveTodo}
                              onUnarchive={unarchiveTodo}
                              onEdit={editTodo}
                              markerColors={settings.markerColors}
                              settings={settings}
                              linkPatterns={settings.linkPatterns}
                              availablePeople={sortedPeople}
                              availableProjects={sortedProjects}
                              availablePriorities={sortedPriorities}
                              onAddPerson={handleAddPerson}
                              onAddProject={handleAddProject}
                              onAddPriority={handleAddPriority}
                              isExpanded={false}
                              onToggleExpand={() => {}}
                              onAddComment={addTodoComment}
                              onEditComment={editTodoComment}
                              onDeleteComment={deleteTodoComment}
                              isSelectionMode={isSelectionMode}
                              isSelected={selectedTodoIds.has(todo.id)}
                              onSelectionChange={handleSelectionChange}
                              isDraggable={false}
                              sprints={sprints.map((s) => s.raw)}
                              nextPlannedSprint={nextPlannedSprint?.raw}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {archivedTodos.length > 0 && (
                  <section>
                    <button
                      onClick={() => setArchivedExpanded(!archivedExpanded)}
                      className="w-full flex items-center justify-between text-left mb-3 group"
                    >
                      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Archived ({archivedTodos.length})
                      </h2>
                      <svg
                        className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                          archivedExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {archivedExpanded && (
                      <ul className="space-y-2">
                        {archivedTodos.map((todo) => (
                          <li key={todo.id} onClick={() => setDetailsOverlayTodo(todo)} className="cursor-pointer">
                            <TodoItem
                              todo={todo}
                              onToggle={toggleTodo}
                              onDelete={deleteTodo}
                              onArchive={archiveTodo}
                              onUnarchive={unarchiveTodo}
                              onEdit={editTodo}
                              markerColors={settings.markerColors}
                              settings={settings}
                              linkPatterns={settings.linkPatterns}
                              availablePeople={sortedPeople}
                              availableProjects={sortedProjects}
                              availablePriorities={sortedPriorities}
                              onAddPerson={handleAddPerson}
                              onAddProject={handleAddProject}
                              onAddPriority={handleAddPriority}
                              isExpanded={false}
                              onToggleExpand={() => {}}
                              onAddComment={addTodoComment}
                              onEditComment={editTodoComment}
                              onDeleteComment={deleteTodoComment}
                              isSelectionMode={isSelectionMode}
                              isSelected={selectedTodoIds.has(todo.id)}
                              onSelectionChange={handleSelectionChange}
                              isDraggable={false}
                              sprints={sprints.map((s) => s.raw)}
                              nextPlannedSprint={nextPlannedSprint?.raw}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </div>
            )}

            {/* Save Preset Modal */}
            {isSavePresetOpen && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => setIsSavePresetOpen(false)}
              >
                <div
                  className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Save View Preset</h2>
                      <button
                        onClick={() => setIsSavePresetOpen(false)}
                        className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Input for new preset name */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Preset Name
                      </label>
                      <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Enter preset name..."
                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && presetName.trim()) {
                            savePreset(presetName.trim());
                          }
                        }}
                      />
                    </div>

                    <button
                      onClick={() => presetName.trim() && savePreset(presetName.trim())}
                      disabled={!presetName.trim()}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors mb-4"
                    >
                      Save as New Preset
                    </button>

                    {/* Existing presets */}
                    {viewPresets.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                          Or overwrite existing:
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {viewPresets.map((preset) => (
                            <div
                              key={preset.name}
                              className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                            >
                              <button
                                onClick={() => savePreset(preset.name)}
                                className="flex-1 text-left font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {preset.name}
                              </button>
                              <button
                                onClick={() => deletePreset(preset.name)}
                                className="ml-2 p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                title="Delete preset"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
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

            {/* Todo Details Overlay */}
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
                    onAddPerson={handleAddPerson}
                    onAddProject={handleAddProject}
                    onAddPriority={handleAddPriority}
                    onAddComment={addTodoComment}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtask}
                    onEditSubtask={editSubtask}
                    onDeleteSubtask={deleteSubtask}
                    onStartTimeTracking={startTimeTracking}
                    onStopTimeTracking={stopTimeTracking}
                    onAddManualTimeEntry={addManualTimeEntry}
                    onDeleteTimeEntry={deleteTimeEntry}
                    onCreateTemplate={handleCreateTemplate}
                    sprints={sprints.map((s) => s.raw)}
                    runningSprint={runningSprint?.raw}
                  />
                );
              })()}
          </>
        )}

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
                        color,
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
                        color,
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
      </div>

      {/* Batch Edit Modal */}
      {isBatchEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsBatchEditOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Edit {selectedTodoIds.size} Task{selectedTodoIds.size === 1 ? "" : "s"}
              </h2>
              <button
                onClick={() => setIsBatchEditOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Check the fields you want to update. Empty values will clear the field.
            </p>

            {/* Priority Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={batchEditData.setPriority}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, setPriority: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Set Priority</span>
              </label>
              {batchEditData.setPriority && (
                <select
                  value={batchEditData.priority}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Priority (Clear)</option>
                  {sortedPriorities.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Project Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={batchEditData.setProject}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, setProject: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add Project</span>
              </label>
              {batchEditData.setProject && (
                <select
                  value={batchEditData.project}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, project: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Clear All Projects</option>
                  {sortedProjects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Assignee Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={batchEditData.setAssignee}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, setAssignee: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add Assignee</span>
              </label>
              {batchEditData.setAssignee && (
                <select
                  value={batchEditData.assignee}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, assignee: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Clear All Assignees</option>
                  {sortedPeople.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Sprint Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={batchEditData.setSprint}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, setSprint: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Set Sprint</span>
              </label>
              {batchEditData.setSprint && (
                <select
                  value={batchEditData.sprint}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, sprint: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Sprint (Backlog)</option>
                  {sprints
                    .filter((s) => s.isActive && (s.status === "planning" || s.status === "active"))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.status === "active" ? "🏃" : ""}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {/* Source Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={batchEditData.setSource}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, setSource: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add Source</span>
              </label>
              {batchEditData.setSource && (
                <select
                  value={batchEditData.source}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Clear All Sources</option>
                  {sortedPeople.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Due Date Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={batchEditData.setDueDate}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, setDueDate: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Set Due Date</span>
              </label>
              {batchEditData.setDueDate && (
                <input
                  type="date"
                  value={batchEditData.dueDate}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Tags Field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={batchEditData.setTags}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, setTags: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add Tags</span>
              </label>
              {batchEditData.setTags && (
                <input
                  type="text"
                  value={batchEditData.tags}
                  onChange={(e) => setBatchEditData((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3 (comma-separated)"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setIsBatchEditOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyBatchEdit}
                disabled={
                  !batchEditData.setPriority &&
                  !batchEditData.setProject &&
                  !batchEditData.setAssignee &&
                  !batchEditData.setSprint &&
                  !batchEditData.setSource &&
                  !batchEditData.setDueDate &&
                  !batchEditData.setTags
                }
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

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
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onEdit={editTodo}
          onArchive={archiveTodo}
          markerColors={settings.markerColors}
          settings={settings}
          linkPatterns={settings.linkPatterns}
          onOpenDetails={(todo) => {
            setIsFocusMode(false);
            setDetailsOverlayTodo(todo);
          }}
          onClose={() => setIsFocusMode(false)}
        />
      )}

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
                tags: [...todo.metadata.tags],
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
    </div>
  );
}
