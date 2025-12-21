"use client";

import React from "react";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { Settings } from "@/types/settings";
import { Sprint } from "@/types/sprint";
import { Priority } from "@/types/priority";
import { CommentId } from "@/types/types";
import { TodoItem } from "@/components/items/TodoItem";
import { TutorialStep } from "@/components/overlays/TutorialOverlay";

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
    fallbackHint: "The save preset button (💾) is in the toolbar area near filters",
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

interface TodoListViewProps {
  // Todos
  todos: TodoModel[];
  activeTodos: TodoModel[];
  completedTodos: TodoModel[];
  archivedTodos: TodoModel[];
  groupedActiveTodos: Record<string, TodoModel[]>;

  // Settings & data
  settings: Settings;
  sortedPeople: PersonModel[];
  sortedProjects: ProjectModel[];
  sortedPriorities: Priority[];
  sprints: Sprint[];
  nextPlannedSprint?: Sprint;

  // State
  isSelectionMode: boolean;
  selectedTodoIds: Set<string>;
  isDragMode: boolean;
  dragOverTodoId: string | null;
  activeExpanded: boolean;
  completedExpanded: boolean;
  archivedExpanded: boolean;

  // Actions
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onEdit: (id: string, text: string, plainText: string, metadata: any) => void;
  onAddPerson: (name: string) => void;
  onAddProject: (name: string) => void;
  onAddPriority: (name: string) => void;
  onAddComment: (id: string, text: string) => void;
  onEditComment: (todoId: string, commentId: CommentId, text: string) => void;
  onDeleteComment: (todoId: string, commentId: CommentId) => void;
  onOpenTodoDetails: (todo: TodoModel) => void;

  // Selection handlers
  onSelectionChange: (id: string, selected: boolean) => void;

  // Drag handlers
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;

  // Section toggles
  onActiveExpandedChange: (expanded: boolean) => void;
  onCompletedExpandedChange: (expanded: boolean) => void;
  onArchivedExpandedChange: (expanded: boolean) => void;
}

export function TodoListView({
  todos,
  activeTodos,
  completedTodos,
  archivedTodos,
  groupedActiveTodos,
  settings,
  sortedPeople,
  sortedProjects,
  sortedPriorities,
  sprints,
  nextPlannedSprint,
  isSelectionMode,
  selectedTodoIds,
  isDragMode,
  dragOverTodoId,
  activeExpanded,
  completedExpanded,
  archivedExpanded,
  onToggle,
  onDelete,
  onArchive,
  onUnarchive,
  onEdit,
  onAddPerson,
  onAddProject,
  onAddPriority,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onOpenTodoDetails,
  onSelectionChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onActiveExpandedChange,
  onCompletedExpandedChange,
  onArchivedExpandedChange,
}: TodoListViewProps) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-16" data-tutorial="todo-list">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">No tasks yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-tutorial="todo-list">
      {activeTodos.length > 0 && (
        <section>
          <button
            onClick={() => onActiveExpandedChange(!activeExpanded)}
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
                      <li key={todo.id} onClick={() => onOpenTodoDetails(todo)} className="cursor-pointer">
                        <TodoItem
                          todo={todo}
                          onToggle={onToggle}
                          onDelete={onDelete}
                          onArchive={onArchive}
                          onUnarchive={onUnarchive}
                          onEdit={onEdit}
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
                          onAddComment={onAddComment}
                          onEditComment={onEditComment}
                          onDeleteComment={onDeleteComment}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedTodoIds.has(todo.id)}
                          onSelectionChange={onSelectionChange}
                          isDraggable={isDragMode && todo.isActive}
                          isDraggedOver={dragOverTodoId === todo.id}
                          onDragStart={onDragStart}
                          onDragEnd={onDragEnd}
                          onDragOver={onDragOver}
                          onDragLeave={onDragLeave}
                          onDrop={onDrop}
                          sprints={sprints}
                          nextPlannedSprint={nextPlannedSprint}
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
            onClick={() => onCompletedExpandedChange(!completedExpanded)}
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
                <li key={todo.id} onClick={() => onOpenTodoDetails(todo)} className="cursor-pointer">
                  <TodoItem
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onArchive={onArchive}
                    onUnarchive={onUnarchive}
                    onEdit={onEdit}
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
                    onAddComment={onAddComment}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedTodoIds.has(todo.id)}
                    onSelectionChange={onSelectionChange}
                    isDraggable={false}
                    sprints={sprints}
                    nextPlannedSprint={nextPlannedSprint}
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
            onClick={() => onArchivedExpandedChange(!archivedExpanded)}
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
                <li key={todo.id} onClick={() => onOpenTodoDetails(todo)} className="cursor-pointer">
                  <TodoItem
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onArchive={onArchive}
                    onUnarchive={onUnarchive}
                    onEdit={onEdit}
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
                    onAddComment={onAddComment}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedTodoIds.has(todo.id)}
                    onSelectionChange={onSelectionChange}
                    isDraggable={false}
                    sprints={sprints}
                    nextPlannedSprint={nextPlannedSprint}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
