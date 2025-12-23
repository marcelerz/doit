"use client";

import React, { useMemo, useRef } from "react";
import { SprintModel } from "@/hooks/useSprints";
import { SprintItem } from "@/components/items/SprintItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { TodoModel } from "@/models/TodoModel";
import { TutorialStep } from "@/components/overlays/TutorialOverlay";

// Sprints View Tutorial Steps
export const sprintsViewTutorialSteps: TutorialStep[] = [
  {
    id: "sprints-intro",
    title: "Sprint Planning 🏃",
    description: "The Sprints View helps you plan work in time-boxed iterations. Perfect for agile workflows!",
    position: "center",
  },
  {
    id: "sprints-create",
    title: "Create Sprints ➕",
    description:
      'Click "Add Sprint" to create a new sprint with:\n\n• Name and goal\n• Start and end dates\n• Status (Planning, Active, Completed)',
    targetSelector: '[data-tutorial="add-sprint-button"]',
    position: "bottom",
    spotlightPadding: 8,
    fallbackHint: "The + Add Sprint button is at the top of the Sprints view",
  },
  {
    id: "sprints-assign",
    title: "Assign to Sprints 📋",
    description:
      "Open any task's detail view to assign it to a sprint. Tasks without a sprint go to the Backlog.\n\nYou can also batch-assign tasks using Selection Mode (S).",
    position: "center",
  },
  {
    id: "sprints-kanban",
    title: "Sprint in Kanban 📊",
    description:
      "Filter the Kanban board by sprint to focus on current iteration work. See only what's planned for this sprint!",
    position: "center",
  },
  {
    id: "sprints-complete",
    title: "Sprint Ready! 🎉",
    description: "You're ready for agile planning! Mark a sprint as Active to start working on it.",
    position: "center",
  },
];

interface SprintsViewProps {
  sprints: SprintModel[];
  todos: TodoModel[];
  search: string;
  onSearchChange: (value: string) => void;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
  onOpenSprint: (sprintId: string) => void;
  onAddSprint: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function SprintsView({
  sprints,
  todos,
  search,
  onSearchChange,
  showArchived,
  onShowArchivedChange,
  onOpenSprint,
  onAddSprint,
  searchInputRef,
}: SprintsViewProps) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || localInputRef;

  // Filter sprints based on search and archive filter
  const filteredSprints = useMemo(() => {
    return sprints.filter((sprint) => {
      // Filter by archived status
      if (!showArchived && sprint.isArchived) return false;
      // Filter by search term
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        return (
          sprint.name.toLowerCase().includes(searchLower) ||
          (sprint.goal && sprint.goal.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [sprints, search, showArchived]);

  // Count todos per sprint
  const todoCountBySprint = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {};
    todos.forEach((todo) => {
      if (todo.sprint) {
        if (!counts[todo.sprint]) {
          counts[todo.sprint] = { total: 0, completed: 0 };
        }
        counts[todo.sprint].total++;
        if (todo.state === "completed") {
          counts[todo.sprint].completed++;
        }
      }
    });
    return counts;
  }, [todos]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Sprints</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {filteredSprints.length} of {sprints.length} {sprints.length === 1 ? "sprint" : "sprints"}
          </p>
        </div>
        <button
          onClick={onAddSprint}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          data-tutorial="add-sprint-button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Sprint
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
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sprints... (press / to focus)"
            className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
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
            checked={showArchived}
            onChange={(e) => onShowArchivedChange(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          Show archived
        </label>
      </div>

      {sprints.length === 0 ? (
        <EmptyState emoji="🏃" title="No Sprints" message="No sprints yet. Add one to get started!" />
      ) : filteredSprints.length === 0 ? (
        <EmptyState emoji="🔍" title="No Results" message="No sprints match your search." />
      ) : (
        <ul className="space-y-2">
          {filteredSprints.map((sprint) => (
            <li key={sprint.id}>
              <SprintItem
                sprint={sprint}
                onClick={() => onOpenSprint(sprint.id)}
                isRunning={sprint.status === "active"}
                todoCount={todoCountBySprint[sprint.id]?.total || 0}
                completedTodoCount={todoCountBySprint[sprint.id]?.completed || 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
