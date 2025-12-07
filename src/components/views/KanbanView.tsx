"use client";

import { TodoMetadata } from "@/types/todo";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { KanbanSettings, KanbanState, MarkerColors, Priority, LinkPattern, Settings, Sprint } from "@/types/settings";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";
import { MarkedText } from "@/components/shared/MarkedText";
import { TodoDetailsOverlay } from "@/components/overlays/TodoDetailsOverlay";
import { getTextColor } from "@/utils/colors";

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
}

const defaultViewOptions: KanbanViewOptions = {
  activeViewId: "all",
  sortField: "createdAt",
  sortDirection: "desc",
  sprintId: null,
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

  // Load view options from storage
  useEffect(() => {
    waitForStorageInit()
      .then(() => {
        return loadFromStorage<KanbanViewOptions>(STORAGE_KEYS.KANBAN_VIEW_OPTIONS, defaultViewOptions);
      })
      .then((saved) => {
        setViewOptions({ ...defaultViewOptions, ...saved });
        setIsOptionsLoaded(true);
      });
  }, []);

  // Save view options to storage
  useEffect(() => {
    if (!isOptionsLoaded) return;
    saveToStorage(STORAGE_KEYS.KANBAN_VIEW_OPTIONS, viewOptions);
  }, [viewOptions, isOptionsLoaded]);

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

    if (canTransition(fromState, stateId)) {
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
    if (canTransition(fromState, targetStateId)) {
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

  // Get priority color
  const getPriorityColor = (priorityName: string | undefined): string => {
    if (!priorityName) return markerColors.priority;
    const priority = availablePriorities.find(
      (p) =>
        p.name.toLowerCase() === priorityName.toLowerCase() ||
        p.alternatives.some((a) => a.toLowerCase() === priorityName.toLowerCase()),
    );
    return priority?.color || markerColors.priority;
  };

  // Get person color
  const getPersonColor = (personName: string): string => {
    const person = availablePeople.find((p) => p.matchesAnyName([personName]));
    return person?.raw.color || markerColors.assigned;
  };

  // Get project color
  const getProjectColor = (projectName: string): string => {
    const project = availableProjects.find((p) => p.matchesAnyName([projectName]));
    return project?.raw.color || markerColors.project;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-shrink-0">
        {/* View and Sprint selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:inline">View:</label>
          <select
            value={viewOptions.activeViewId}
            onChange={(e) => setViewOptions((prev) => ({ ...prev, activeViewId: e.target.value }))}
            className="flex-1 sm:flex-none px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-base sm:text-sm"
            title="Select view"
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
              >
                <option value="all">All Sprints</option>
                <option value="backlog">📋 Backlog (No Sprint)</option>
                {activeSprint && <option value={activeSprint.id}>🏃 {activeSprint.name} (Active)</option>}
                {sprints
                  .filter((s) => s.id !== activeSprint?.id)
                  .sort((a, b) => {
                    // Sort by status: planning first, then others
                    const statusOrder = { planning: 0, active: 1, completed: 2, cancelled: 3 };
                    return statusOrder[a.status] - statusOrder[b.status];
                  })
                  .map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.status === "planning" ? "📝" : sprint.status === "completed" ? "✅" : "🚫"} {sprint.name}
                    </option>
                  ))}
              </select>
            </>
          )}

          {activeView?.description && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400 italic hidden md:inline">
              {activeView.description}
            </span>
          )}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:inline">Sort:</label>
          <select
            value={viewOptions.sortField}
            onChange={(e) =>
              setViewOptions((prev) => ({
                ...prev,
                sortField: e.target.value as KanbanViewOptions["sortField"],
              }))
            }
            className="flex-1 sm:flex-none px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-base sm:text-sm"
            title="Sort by"
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
            className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-base sm:text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            {viewOptions.sortDirection === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full p-2 sm:p-4 gap-2 sm:gap-4 min-w-min">
          {visibleStates.map((state) => {
            const columnTodos = todosByState[state.id] || [];
            const isDropTarget = dragOverColumnId === state.id;
            const canDropHere =
              draggedTodoId &&
              canTransition(todos.find((t) => t.id === draggedTodoId)?.workflowState || "backlog", state.id);

            return (
              <div
                key={state.id}
                className={`flex flex-col w-56 sm:w-64 md:w-72 lg:w-80 flex-shrink-0 rounded-lg transition-all ${
                  isDropTarget && canDropHere
                    ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
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
                    <span className="ml-auto px-2 py-0.5 text-xs bg-white/50 dark:bg-black/20 rounded-full">
                      {columnTodos.length}
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
