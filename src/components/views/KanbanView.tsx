"use client";

import { TodoMetadata } from "@/types/todo";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { KanbanSettings, KanbanState, MarkerColors, Priority, LinkPattern, Settings } from "@/types/settings";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { STORAGE_KEYS, getStorageAdapter } from "@/storage/storage";
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
}

interface KanbanViewOptions {
  activeViewId: string;
  sortField: "createdAt" | "updatedAt" | "dueDate" | "priority" | "title";
  sortDirection: "asc" | "desc";
}

const defaultViewOptions: KanbanViewOptions = {
  activeViewId: "all",
  sortField: "createdAt",
  sortDirection: "desc",
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
}: KanbanViewProps) {
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [viewOptions, setViewOptions] = useState<KanbanViewOptions>(defaultViewOptions);
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [isOptionsLoaded, setIsOptionsLoaded] = useState(false);

  // Load view options from storage
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const storage = getStorageAdapter();
        const saved = await storage.getItem(STORAGE_KEYS.KANBAN_VIEW_OPTIONS);
        if (saved) {
          const parsed = JSON.parse(saved);
          setViewOptions({ ...defaultViewOptions, ...parsed });
        }
      } catch (e) {
        console.error("Failed to load kanban view options:", e);
      }
      setIsOptionsLoaded(true);
    };
    loadOptions();
  }, []);

  // Save view options to storage
  useEffect(() => {
    if (!isOptionsLoaded) return;
    const saveOptions = async () => {
      try {
        const storage = getStorageAdapter();
        await storage.setItem(STORAGE_KEYS.KANBAN_VIEW_OPTIONS, JSON.stringify(viewOptions));
      } catch (e) {
        console.error("Failed to save kanban view options:", e);
      }
    };
    saveOptions();
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

  // Group todos by workflow state
  const todosByState = useMemo(() => {
    const grouped: Record<string, TodoModel[]> = {};

    // Initialize all states with empty arrays
    sortedStates.forEach((state) => {
      grouped[state.id] = [];
    });

    // Assign todos to states
    todos.forEach((todo) => {
      // Skip deleted todos
      if (todo.state === "deleted") return;

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
  }, [todos, sortedStates, viewOptions.sortField, viewOptions.sortDirection, availablePriorities]);

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
  const getPriorityColor = (priorityName: string | undefined): string | undefined => {
    if (!priorityName) return undefined;
    const priority = availablePriorities.find((p) => p.name === priorityName);
    return priority?.color;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-shrink-0">
        {/* View selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">View:</label>
          <select
            value={viewOptions.activeViewId}
            onChange={(e) => setViewOptions((prev) => ({ ...prev, activeViewId: e.target.value }))}
            className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm"
          >
            {kanban.views.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </select>
          {activeView?.description && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400 italic">{activeView.description}</span>
          )}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">Sort:</label>
          <select
            value={viewOptions.sortField}
            onChange={(e) =>
              setViewOptions((prev) => ({
                ...prev,
                sortField: e.target.value as KanbanViewOptions["sortField"],
              }))
            }
            className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm"
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
            className="px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            {viewOptions.sortDirection === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full p-4 gap-4 min-w-min">
          {visibleStates.map((state) => {
            const columnTodos = todosByState[state.id] || [];
            const isDropTarget = dragOverColumnId === state.id;
            const canDropHere =
              draggedTodoId &&
              canTransition(todos.find((t) => t.id === draggedTodoId)?.workflowState || "backlog", state.id);

            return (
              <div
                key={state.id}
                className={`flex flex-col w-72 flex-shrink-0 rounded-lg transition-all ${
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
                  className="flex items-center gap-2 px-3 py-2 rounded-t-lg"
                  style={{ backgroundColor: state.color + "33" }}
                >
                  <span className="text-lg">{state.icon}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{state.name}</span>
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
                        className={`bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-3 cursor-pointer hover:shadow-md transition-all ${
                          isDragging ? "opacity-50 scale-95" : ""
                        }`}
                        style={priorityColor ? { borderLeftWidth: 3, borderLeftColor: priorityColor } : undefined}
                      >
                        {/* Card Content */}
                        <div className="text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
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
        />
      )}
    </div>
  );
}
