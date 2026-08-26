"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useImperativeHandle,
  useRef,
} from "react";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { SprintModel } from "@/models/SprintModel";
import { UndoAction } from "@/hooks/useTodos";
import { Settings } from "@/types/settings";
import { Priority } from "@/types/priority";
import { CommentId, SearchHistoryEntry, SearchHistoryId } from "@/types/types";
import { TodoTemplate } from "@/types/todoTemplate";
import { TodoId, TodoMetadata } from "@/types/todo";
import { TodoItem } from "@/components/items/TodoItem";
import { TutorialStep } from "@/components/overlays/TutorialOverlay";
import {
  BatchEditModal,
  BatchEditData,
} from "@/components/overlays/BatchEditModal";
import { SavePresetModal } from "@/components/shared/SavePresetModal";
import { ListViewToolbar } from "@/components/shared/ListViewToolbar";
import { FilterSection } from "@/components/shared/FilterSection";
import { UndoNotificationStack } from "@/components/shared/UndoNotificationStack";
import { useDragReorder } from "@/hooks/useDragReorder";
import { useListViewState, TodoFilters } from "@/hooks/useListViewState";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { getTextColor } from "@/utils/colors";
import { exportTodos, ExportFormat } from "@/utils/export";
import { formatDateKey } from "@/utils/dateUtils";
import {
  EditIcon,
  CheckIcon,
  ArchiveIcon,
  RefreshIcon,
  TrashIcon,
  CloseIcon,
  CalendarIcon,
  ClockIcon,
  ChevronDownIcon,
  ClipboardIcon,
  SlashIcon,
  WarningIcon,
} from "@/components/shared/Icons";

// List View Tutorial Steps
export const listViewTutorialSteps: TutorialStep[] = [
  {
    id: "list-intro",
    title: "List View 📋",
    description:
      "The List View is your primary task management view. It shows all your tasks organized by status: Active, Completed, and Archived.",
    position: "center",
  },
  {
    id: "list-search",
    title: "Search & Filter 🔍",
    description:
      "Use the search bar to find tasks by text. Press / to focus it quickly.\n\nClick the filter button (or press F) to filter by:\n• Person assigned\n• Project\n• Priority\n• Due date\n• Tags\n• And more!",
    targetSelector: '[data-tutorial="search-bar"]',
    position: "bottom",
    spotlightPadding: 8,
    fallbackHint: "The search bar with filter icon is below the view tabs",
  },
  {
    id: "list-grouping",
    title: "Group & Sort 📊",
    description:
      "Organize your view with grouping and sorting options:\n\n• Group by: Due Date, Priority, Project, Assigned, Sprint\n• Sort by: Created, Due Date, Priority, Title, and more\n• Toggle ascending/descending order",
    targetSelector: '[data-tutorial="group-sort"]',
    position: "bottom",
    spotlightPadding: 8,
    fallbackHint: "Group and Sort dropdowns are next to the search bar",
  },
  {
    id: "list-presets",
    title: "Save View Presets 💾",
    description:
      "Create custom view presets to save your filter combinations. Click the save button to create a preset, then access it from the preset bar at the top.",
    targetSelector: '[data-tutorial="save-preset"]',
    position: "bottom",
    spotlightPadding: 8,
    fallbackHint:
      "The save preset button (💾) is in the toolbar area near filters",
  },
  {
    id: "list-selection",
    title: "Batch Operations ✅",
    description:
      "Press S to enter selection mode. Select multiple tasks, then:\n• Complete them all\n• Archive them\n• Delete them\n• Edit properties in bulk",
    position: "center",
  },
  {
    id: "list-complete",
    title: "You're All Set! 🎉",
    description:
      "You now know how to use the List View effectively. Try the other views (Kanban, Gantt, Calendar) for different perspectives on your tasks!",
    position: "center",
  },
];

// Ref handle for exposing selection/drag state to parent
export interface ListViewHandle {
  isSelectionMode: boolean;
  toggleSelectionMode: () => void;
  isDragMode: boolean;
  toggleDragMode: () => void;
  toggleFilters: () => void;
  focusSearch: () => void;
}

interface ListViewProps {
  // Todos
  todos: TodoModel[];

  // Settings & data
  settings: Settings;
  sortedPeople: PersonModel[];
  sortedProjects: ProjectModel[];
  sortedPriorities: Priority[];
  sprints: SprintModel[];
  nextPlannedSprint?: SprintModel;

  // Features
  features: Settings["features"] | undefined;

  // Templates
  templates: TodoTemplate[];
  onShowTemplatesManager: () => void;

  // Search history
  searchHistory: SearchHistoryEntry[];
  addToSearchHistory: (query: string) => void;
  removeFromSearchHistory: (id: SearchHistoryId) => void;
  clearSearchHistory: () => void;

  // Todo actions
  toggleTodo: (id: TodoId) => void;
  deleteTodo: (id: TodoId) => void;
  archiveTodo: (id: TodoId) => void;
  unarchiveTodo: (id: TodoId) => void;
  editTodo: (
    id: TodoId,
    text: string,
    plainText: string,
    metadata: TodoMetadata,
  ) => void;
  reorderTodos: (newOrder: TodoId[]) => void;

  // People/Project/Priority actions
  onAddPerson: (name: string) => void;
  onAddProject: (name: string) => void;
  onAddPriority: (name: string, color?: string) => void;

  // Comment actions
  addTodoComment: (todoId: TodoId, text: string) => void;
  editTodoComment: (todoId: TodoId, commentId: CommentId, text: string) => void;
  deleteTodoComment: (todoId: TodoId, commentId: CommentId) => void;

  // Details overlay
  onOpenTodoDetails: (todo: TodoModel) => void;

  // Undo
  undoActions: UndoAction[];
  fadingOutIds: Set<string>;
  undo: (id: string) => void;
  dismissUndo: (id: string) => void;

  // Dependency notification
  dependencyBlockNotification: string | null;
}

export function ListView({
  todos,
  settings,
  sortedPeople,
  sortedProjects,
  sortedPriorities,
  sprints,
  nextPlannedSprint,
  features,
  templates,
  onShowTemplatesManager,
  searchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  toggleTodo,
  deleteTodo,
  archiveTodo,
  unarchiveTodo,
  editTodo,
  reorderTodos,
  onAddPerson,
  onAddProject,
  onAddPriority,
  addTodoComment,
  editTodoComment,
  deleteTodoComment,
  onOpenTodoDetails,
  undoActions,
  fadingOutIds,
  undo,
  dismissUndo,
  dependencyBlockNotification,
  ref,
}: ListViewProps & { ref?: React.Ref<ListViewHandle> }) {
  // Search input ref for focus handling
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Confirm dialog hook
  const { showConfirmDialog, ConfirmDialogComponent } = useConfirmDialog();

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
    projects: sortedProjects,
    settings,
  });

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(
    new Set(),
  );

  // Batch edit state
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);

  // Drag and drop reordering
  const {
    isDragMode,
    draggedTodoId: _draggedTodoId,
    dragOverTodoId,
    toggleDragMode,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragReorder({ todos, reorderTodos });

  // Selection mode handlers
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    setSelectedTodoIds(new Set()); // Clear selections when toggling mode
  }, []);

  // Toggle filters handler
  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, [setShowFilters]);

  // Focus search handler
  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  // Expose state and handlers to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      isSelectionMode,
      toggleSelectionMode,
      isDragMode,
      toggleDragMode,
      toggleFilters,
      focusSearch,
    }),
    [
      isSelectionMode,
      toggleSelectionMode,
      isDragMode,
      toggleDragMode,
      toggleFilters,
      focusSearch,
    ],
  );

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

  const _selectAllInSection = useCallback((todoIds: string[]) => {
    setSelectedTodoIds((prev) => {
      const next = new Set(prev);
      todoIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const _deselectAllInSection = useCallback((todoIds: string[]) => {
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
    const selectedActive = todos.filter(
      (t) => t.isActive && selectedTodoIds.has(t.id),
    );
    selectedActive.forEach((todo) => toggleTodo(todo.id));
    setSelectedTodoIds(new Set());
  }, [todos, selectedTodoIds, toggleTodo]);

  const bulkArchive = useCallback(() => {
    const selectedCompleted = todos.filter(
      (t) => t.isCompleted && selectedTodoIds.has(t.id),
    );
    selectedCompleted.forEach((todo) => archiveTodo(todo.id));
    setSelectedTodoIds(new Set());
  }, [todos, selectedTodoIds, archiveTodo]);

  const bulkDelete = useCallback(() => {
    const toDelete = todos.filter((t) => selectedTodoIds.has(t.id));
    showConfirmDialog({
      title: "Delete Selected Tasks",
      message: `Are you sure you want to delete ${toDelete.length} task${
        toDelete.length === 1 ? "" : "s"
      }? This cannot be undone.`,
      confirmText: "Delete",
      confirmVariant: "danger",
      onConfirm: () => {
        toDelete.forEach((todo) => deleteTodo(todo.id));
        setSelectedTodoIds(new Set());
      },
    });
  }, [todos, selectedTodoIds, deleteTodo, showConfirmDialog]);

  const bulkUnarchive = useCallback(() => {
    const selectedArchived = todos.filter(
      (t) => t.isArchived && selectedTodoIds.has(t.id),
    );
    selectedArchived.forEach((todo) => unarchiveTodo(todo.id));
    setSelectedTodoIds(new Set());
  }, [todos, selectedTodoIds, unarchiveTodo]);

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
              newMetadata.projects = [
                ...newMetadata.projects,
                batchEditData.project,
              ];
            }
          } else {
            newMetadata.projects = [];
          }
        }
        if (batchEditData.setAssignee) {
          if (batchEditData.assignee) {
            if (!newMetadata.assignedPeople.includes(batchEditData.assignee)) {
              newMetadata.assignedPeople = [
                ...newMetadata.assignedPeople,
                batchEditData.assignee,
              ];
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
              newMetadata.sourcePeople = [
                ...newMetadata.sourcePeople,
                batchEditData.source,
              ];
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

  // Convert SprintModel[] to Sprint[] for components that need raw data
  const sprintsRaw = useMemo(() => sprints.map((s) => s.raw), [sprints]);
  const nextPlannedSprintRaw = useMemo(
    () => nextPlannedSprint?.raw,
    [nextPlannedSprint],
  );

  // Calculate archive threshold
  const archiveThresholdMs = settings.general.archiveDays * 24 * 60 * 60 * 1000;
  // eslint-disable-next-line react-hooks/purity -- Need current time for archive calculations
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
      const todosToExport = hasActiveFilters
        ? [...activeTodos, ...completedTodos, ...archivedTodos]
        : todos;
      const date = formatDateKey(new Date());
      const filename = `todos-${date}`;
      exportTodos(todosToExport, format, filename);
    },
    [hasActiveFilters, activeTodos, completedTodos, archivedTodos, todos],
  );

  // Helper function to get button color class for filter sections
  // Uses actual marker colors from settings
  const getFilterButtonColor = (
    type: keyof Omit<TodoFilters, "searchText">,
    value: string,
    isSelected: boolean,
  ) => {
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

  return (
    <>
      {/* Toolbar */}
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
          onShowTemplatesManager={onShowTemplatesManager}
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
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("assignedPeople", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("assignedPeople", value, isSelected)
                }
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
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("projects", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("projects", value, isSelected)
                }
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
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("categories", value, isSelected)
                }
                getButtonStyle={(value, isSelected) => {
                  if (!isSelected) return undefined;
                  // Use category's own color
                  const category = settings.categories.find(
                    (c) => c.id === value,
                  );
                  const bgColor =
                    category?.color || settings.markerColors.project;
                  return {
                    backgroundColor: bgColor,
                    color: getTextColor(bgColor),
                  };
                }}
                formatLabel={(value) => {
                  const category = settings.categories.find(
                    (c) => c.id === value,
                  );
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
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("sourcePeople", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("sourcePeople", value, isSelected)
                }
                formatLabel={(value) => `$${value}`}
              />

              {/* Mentioned People Filter */}
              <FilterSection
                label="Mentioned"
                activeCount={filters.mentionedPeople.size}
                options={filterOptions.mentionedPeople}
                selectedValues={filters.mentionedPeople}
                onToggle={(value) =>
                  handleFilterClick("mentionedPeople", value)
                }
                onSelectAll={() => handleSelectAll("mentionedPeople")}
                onClear={() => handleClearAll("mentionedPeople")}
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("mentionedPeople", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("mentionedPeople", value, isSelected)
                }
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
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("priorities", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("priorities", value, isSelected)
                }
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
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("dueDates", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("dueDates", value, isSelected)
                }
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
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("durations", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("durations", value, isSelected)
                }
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
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("tags", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("tags", value, isSelected)
                }
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
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("recurring", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("recurring", value, isSelected)
                }
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
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("dependencies", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("dependencies", value, isSelected)
                }
                formatLabel={(value) => `>${value}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Toolbar */}
      {isSelectionMode && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {selectedTodoIds.size} selected
            </span>
            <button
              onClick={selectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select all
            </button>
            <button
              onClick={deselectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
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
                <EditIcon className="w-4 h-4" />
                Edit
              </button>
            )}
            {/* Complete - only for active todos */}
            {todos.some((t) => t.isActive && selectedTodoIds.has(t.id)) && (
              <button
                onClick={bulkComplete}
                className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-1.5"
              >
                <CheckIcon className="w-4 h-4" />
                Complete
              </button>
            )}
            {/* Archive - only for completed todos */}
            {todos.some((t) => t.isCompleted && selectedTodoIds.has(t.id)) && (
              <button
                onClick={bulkArchive}
                className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors flex items-center gap-1.5"
              >
                <ArchiveIcon className="w-4 h-4" />
                Archive
              </button>
            )}
            {/* Unarchive - only for archived todos */}
            {todos.some((t) => t.isArchived && selectedTodoIds.has(t.id)) && (
              <button
                onClick={bulkUnarchive}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1.5"
              >
                <RefreshIcon className="w-4 h-4" />
                Restore
              </button>
            )}
            {/* Delete - always available when items selected */}
            {selectedTodoIds.size > 0 && (
              <button
                onClick={bulkDelete}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center gap-1.5"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <button
            onClick={toggleSelectionMode}
            className="ml-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            title="Exit selection mode"
          >
            <CloseIcon className="w-5 h-5" />
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
            <CalendarIcon className="w-4 h-4" />
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
              <ClockIcon className="w-4 h-4" />
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
            <ClipboardIcon className="w-4 h-4" />
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
            <SlashIcon className="w-4 h-4" />
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
                <CloseIcon className="w-4 h-4" />
                Clear All
              </button>
            </>
          )}
        </div>
      )}

      {/* Todo List Content */}
      {todos.length === 0 ? (
        <div className="text-center py-16" data-tutorial="todo-list">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            No tasks yet. Add one to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4" data-tutorial="todo-list">
          {activeTodos.length > 0 && (
            <section>
              <button
                onClick={() => setActiveExpanded(!activeExpanded)}
                className="w-full flex items-center justify-between text-left mb-3 group"
              >
                <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Active ({activeTodos.length})
                </h2>
                <ChevronDownIcon
                  className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                    activeExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              {activeExpanded && (
                <div className="space-y-4">
                  {Object.entries(groupedActiveTodos).map(
                    ([groupName, groupTodos]) => (
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
                              onClick={() => onOpenTodoDetails(todo)}
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
                                onAddPerson={onAddPerson}
                                onAddProject={onAddProject}
                                onAddPriority={onAddPriority}
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
                                sprints={sprintsRaw}
                                nextPlannedSprint={nextPlannedSprintRaw}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
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
                <ChevronDownIcon
                  className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                    completedExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              {completedExpanded && (
                <ul className="space-y-2">
                  {completedTodos.map((todo) => (
                    <li
                      key={todo.id}
                      onClick={() => onOpenTodoDetails(todo)}
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
                        onAddPerson={onAddPerson}
                        onAddProject={onAddProject}
                        onAddPriority={onAddPriority}
                        isExpanded={false}
                        onToggleExpand={() => {}}
                        onAddComment={addTodoComment}
                        onEditComment={editTodoComment}
                        onDeleteComment={deleteTodoComment}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedTodoIds.has(todo.id)}
                        onSelectionChange={handleSelectionChange}
                        isDraggable={false}
                        sprints={sprintsRaw}
                        nextPlannedSprint={nextPlannedSprintRaw}
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
                <ChevronDownIcon
                  className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                    archivedExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              {archivedExpanded && (
                <ul className="space-y-2">
                  {archivedTodos.map((todo) => (
                    <li
                      key={todo.id}
                      onClick={() => onOpenTodoDetails(todo)}
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
                        onAddPerson={onAddPerson}
                        onAddProject={onAddProject}
                        onAddPriority={onAddPriority}
                        isExpanded={false}
                        onToggleExpand={() => {}}
                        onAddComment={addTodoComment}
                        onEditComment={editTodoComment}
                        onDeleteComment={deleteTodoComment}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedTodoIds.has(todo.id)}
                        onSelectionChange={handleSelectionChange}
                        isDraggable={false}
                        sprints={sprintsRaw}
                        nextPlannedSprint={nextPlannedSprintRaw}
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
            <WarningIcon className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm flex-1">{dependencyBlockNotification}</p>
          </div>
        </div>
      )}

      {/* Undo Notifications */}
      <UndoNotificationStack
        actions={undoActions.map((a) => ({
          id: a.id,
          type: a.type,
          displayText: a.entity.plainText,
        }))}
        fadingOutIds={fadingOutIds}
        onUndo={undo}
        onDismiss={dismissUndo}
        getMessage={(type) => {
          if (type === "delete") return "Todo deleted";
          if (type === "complete") return "Todo completed";
          if (type === "uncomplete") return "Todo marked as active";
          if (type === "archive") return "Todo archived";
          return "Action completed";
        }}
      />

      {/* Batch Edit Modal */}
      <BatchEditModal
        isOpen={isBatchEditOpen}
        onClose={() => setIsBatchEditOpen(false)}
        onApply={applyBatchEdit}
        selectedCount={selectedTodoIds.size}
        priorities={sortedPriorities}
        projects={sortedProjects}
        people={sortedPeople}
        sprints={sprintsRaw}
      />

      {ConfirmDialogComponent}
    </>
  );
}
