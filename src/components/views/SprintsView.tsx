"use client";

import { useState, useMemo } from "react";
import { Sprint } from "@/types/sprint";
import { MarkerColors } from "@/types/markerColors";
import { SprintModel } from "@/hooks/useSprints";
import { SprintItem } from "@/components/items/SprintItem";
import { SprintDetailsOverlay } from "@/components/overlays/SprintDetailsOverlay";
import { EmptyState } from "@/components/shared/EmptyState";
import { TodoModel } from "@/models/TodoModel";

interface SprintsViewProps {
  sprints: SprintModel[];
  todos: TodoModel[];
  onAdd: (sprint: Omit<Sprint, "id" | "createdAt" | "status" | "state" | "comments" | "activity">) => void;
  onUpdate: (id: string, updates: Partial<Sprint>) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onAddComment: (sprintId: string, content: string) => void;
  onEditComment: (sprintId: string, commentId: string, content: string) => void;
  onDeleteComment: (sprintId: string, commentId: string) => void;
  onTodoClick?: (todo: TodoModel) => void;
  onRemoveTodoFromSprint?: (todoId: string) => void;
  defaultDuration: number;
  markerColors: MarkerColors;
}

type FilterType = "all" | "active" | "archived";

export function SprintsView({
  sprints,
  todos,
  onAdd,
  onUpdate,
  onDelete,
  onStart,
  onComplete,
  onCancel,
  onArchive,
  onUnarchive,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onTodoClick,
  onRemoveTodoFromSprint,
  defaultDuration,
  markerColors,
}: SprintsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<SprintModel | null>(null);
  const [filter, setFilter] = useState<FilterType>("active");
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    durationDays: defaultDuration,
    plannedStartDate: "",
  });

  // Filter sprints based on current filter
  const filteredSprints = useMemo(() => {
    switch (filter) {
      case "active":
        return sprints.filter((s) => !s.isArchived);
      case "archived":
        return sprints.filter((s) => s.isArchived);
      default:
        return sprints;
    }
  }, [sprints, filter]);

  // Get running sprint
  const runningSprint = useMemo(() => {
    return sprints.find((s) => s.status === "active");
  }, [sprints]);

  // Count todos per sprint
  const todoCountBySprint = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {};
    todos.forEach((todo) => {
      if (todo.metadata.sprint) {
        if (!counts[todo.metadata.sprint]) {
          counts[todo.metadata.sprint] = { total: 0, completed: 0 };
        }
        counts[todo.metadata.sprint].total++;
        if (todo.state === "completed") {
          counts[todo.metadata.sprint].completed++;
        }
      }
    });
    return counts;
  }, [todos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onAdd({
      name: formData.name.trim(),
      goal: formData.goal.trim() || undefined,
      durationDays: formData.durationDays,
      plannedStartDate: formData.plannedStartDate || undefined,
      color: undefined, // Will use marker default color
    });

    setFormData({
      name: "",
      goal: "",
      durationDays: defaultDuration,
      plannedStartDate: "",
    });
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormData({
      name: "",
      goal: "",
      durationDays: defaultDuration,
      plannedStartDate: "",
    });
  };

  const activeCounts = {
    all: sprints.length,
    active: sprints.filter((s) => !s.isArchived).length,
    archived: sprints.filter((s) => s.isArchived).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Sprints</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Plan and track your work in time-boxed sprints
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            + New Sprint
          </button>
        )}
      </div>

      {/* Running Sprint Banner */}
      {runningSprint && (
        <div
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          onClick={() => setSelectedSprint(runningSprint)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white">🏃</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-green-800 dark:text-green-200">{runningSprint.name}</h3>
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">
                  Active
                </span>
              </div>
              <div className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                {runningSprint.daysRemaining !== null && (
                  <span>
                    {runningSprint.daysRemaining < 0
                      ? `${Math.abs(runningSprint.daysRemaining)} days overdue`
                      : runningSprint.daysRemaining === 0
                      ? "Last day!"
                      : `${runningSprint.daysRemaining} days remaining`}
                  </span>
                )}
                <span className="mx-2">•</span>
                <span>
                  {todoCountBySprint[runningSprint.id]?.completed || 0}/
                  {todoCountBySprint[runningSprint.id]?.total || 0} tasks
                </span>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-2">
        {(["active", "archived", "all"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${
              filter === f
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded bg-zinc-200 dark:bg-zinc-700">{activeCounts[f]}</span>
          </button>
        ))}
      </div>

      {/* Add Sprint Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sprint Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sprint 1"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Duration (days)</label>
              <input
                type="number"
                value={formData.durationDays}
                onChange={(e) =>
                  setFormData({ ...formData, durationDays: parseInt(e.target.value) || defaultDuration })
                }
                min={1}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Planned Start Date (optional)
            </label>
            <input
              type="date"
              value={formData.plannedStartDate}
              onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Sprint Goal (optional)
            </label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="What is the main objective of this sprint?"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Create Sprint
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Sprint List */}
      <div className="space-y-3">
        {filteredSprints.length === 0 ? (
          <EmptyState
            emoji="🏃"
            title={filter === "archived" ? "No Archived Sprints" : filter === "active" ? "No Sprints" : "No Sprints"}
            message={
              filter === "archived"
                ? "No archived sprints yet"
                : filter === "active"
                ? "Create your first sprint to start planning!"
                : "No sprints to show"
            }
            actionLabel={filter === "active" && !isAdding ? "Create Sprint" : undefined}
            onAction={filter === "active" && !isAdding ? () => setIsAdding(true) : undefined}
          />
        ) : (
          filteredSprints.map((sprint) => (
            <SprintItem
              key={sprint.id}
              sprint={sprint}
              onClick={() => setSelectedSprint(sprint)}
              isRunning={sprint.status === "active"}
              todoCount={todoCountBySprint[sprint.id]?.total || 0}
              completedTodoCount={todoCountBySprint[sprint.id]?.completed || 0}
            />
          ))
        )}
      </div>

      {/* Sprint Details Overlay */}
      {selectedSprint && (
        <SprintDetailsOverlay
          sprint={selectedSprint}
          allSprints={sprints}
          todos={todos}
          markerColors={markerColors}
          onClose={() => setSelectedSprint(null)}
          onUpdate={onUpdate}
          onDelete={(id) => {
            onDelete(id);
            setSelectedSprint(null);
          }}
          onStart={onStart}
          onComplete={onComplete}
          onCancel={onCancel}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onAddComment={onAddComment}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          onTodoClick={onTodoClick}
          onRemoveTodoFromSprint={onRemoveTodoFromSprint}
        />
      )}
    </div>
  );
}
