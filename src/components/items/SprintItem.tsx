"use client";

import { SprintModel } from "@/models/SprintModel";
import { TodoModel } from "@/models/TodoModel";
import { ChevronRightIcon } from "@/components/shared/Icons";
import { SprintProgress } from "@/components/shared/SprintProgress";

interface SprintItemProps {
  sprint: SprintModel;
  onClick: () => void;
  isRunning?: boolean;
  /** @deprecated Use sprintTodos instead */
  todoCount?: number;
  /** @deprecated Use sprintTodos instead */
  completedTodoCount?: number;
  /** Todos assigned to this sprint (for progress calculation) */
  sprintTodos?: TodoModel[];
}

export function SprintItem({
  sprint,
  onClick,
  isRunning = false,
  todoCount = 0,
  completedTodoCount = 0,
  sprintTodos = [],
}: SprintItemProps) {
  // Use sprintTodos if available, otherwise fall back to counts
  const effectiveTodoCount = sprintTodos.length > 0 ? sprintTodos.length : todoCount;
  const effectiveCompletedCount = sprintTodos.length > 0
    ? sprintTodos.filter(t => t.state === "completed").length
    : completedTodoCount;
  const progressPercent = effectiveTodoCount > 0 ? Math.round((effectiveCompletedCount / effectiveTodoCount) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className={`group bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-all ${
        isRunning
          ? "border-green-500 dark:border-green-600 ring-1 ring-green-500/20"
          : sprint.isArchived
          ? "border-zinc-200 dark:border-zinc-800 opacity-60"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status indicator */}
          <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: sprint.statusColor }} />

          <div className="flex-1 min-w-0">
            {/* Sprint name and badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{sprint.name}</h3>
              <span
                className="px-2 py-0.5 text-xs font-medium rounded text-white flex-shrink-0"
                style={{ backgroundColor: sprint.statusColor }}
              >
                {sprint.statusLabel}
              </span>
              {isRunning && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex-shrink-0">
                  🏃 Current
                </span>
              )}
              {sprint.isArchived && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex-shrink-0">
                  📦 Archived
                </span>
              )}
            </div>

            {/* Goal */}
            {sprint.goal && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">{sprint.goal}</p>}

            {/* Dates and duration */}
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              <span>📅 {sprint.durationDays} days</span>
              {sprint.actualStartDate && <span>Started: {sprint.actualStartDate}</span>}
              {sprint.actualEndDate && <span>Ended: {sprint.actualEndDate}</span>}
              {!sprint.actualStartDate && sprint.plannedStartDate && <span>Planned: {sprint.plannedStartDate}</span>}
            </div>

            {/* Progress bars for active sprint */}
            {sprint.status === "active" && sprintTodos.length > 0 && (
              <div className="mt-3">
                <SprintProgress
                  daysElapsed={sprint.daysElapsed}
                  durationDays={sprint.durationDays}
                  daysRemaining={sprint.daysRemaining}
                  sprintTodos={sprintTodos}
                  compact={true}
                />
              </div>
            )}

            {/* Fallback for active sprint without sprintTodos */}
            {sprint.status === "active" && sprintTodos.length === 0 && effectiveTodoCount > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  <span>
                    {effectiveCompletedCount}/{effectiveTodoCount} tasks completed
                  </span>
                  {sprint.daysRemaining !== null && (
                    <span className={sprint.daysRemaining < 0 ? "text-red-500" : ""}>
                      {sprint.daysRemaining < 0
                        ? `${Math.abs(sprint.daysRemaining)} days overdue`
                        : sprint.daysRemaining === 0
                        ? "Last day!"
                        : `${sprint.daysRemaining} days left`}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 dark:bg-green-600 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Task count for non-active sprints */}
            {sprint.status !== "active" && effectiveTodoCount > 0 && (
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {effectiveCompletedCount}/{effectiveTodoCount} tasks
                {sprint.isCompleted && ` • ${progressPercent}% completed`}
              </div>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <ChevronRightIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
