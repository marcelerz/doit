"use client";

import { useMemo } from "react";
import { TodoModel } from "@/models/TodoModel";
import { parseDuration } from "@/utils/ganttScheduler";

interface SprintProgressProps {
  /** Days elapsed in the sprint */
  daysElapsed: number | null;
  /** Total duration of sprint in days */
  durationDays: number;
  /** Days remaining (negative if overdue) */
  daysRemaining: number | null;
  /** All todos assigned to this sprint */
  sprintTodos: TodoModel[];
  /** Compact mode for list items (single row, smaller) */
  compact?: boolean;
}

interface ProgressMetric {
  label: string;
  completed: number;
  total: number;
  remaining: number;
  percent: number;
  color: string;
  textColor: string;
  unit: string;
  overdue?: boolean;
}

/**
 * Formats minutes into a readable duration string
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Sprint Progress component showing three stacked progress indicators:
 * 1. Days completed (time progress)
 * 2. Tasks completed (count)
 * 3. Work completed (duration-based)
 */
export function SprintProgress({
  daysElapsed,
  durationDays,
  daysRemaining,
  sprintTodos,
  compact = false,
}: SprintProgressProps) {
  const metrics = useMemo((): ProgressMetric[] => {
    // Calculate task counts
    const completedTodos = sprintTodos.filter((t) => t.state === "completed");
    const totalTasks = sprintTodos.length;
    const completedTasks = completedTodos.length;

    // Calculate work (duration) totals
    let totalWork = 0;
    let completedWork = 0;

    for (const todo of sprintTodos) {
      const duration = parseDuration(todo.metadata.duration);
      totalWork += duration;
      if (todo.state === "completed") {
        completedWork += duration;
      }
    }

    // Calculate days progress
    const daysCompleted = daysElapsed ?? 0;
    const daysPercent = durationDays > 0 ? Math.min(100, Math.max(0, (daysCompleted / durationDays) * 100)) : 0;
    const isOverdue = daysRemaining !== null && daysRemaining < 0;

    // Calculate task progress
    const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate work progress
    const workPercent = totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0;

    // Calculate remaining values
    const daysLeft = daysRemaining ?? durationDays - daysCompleted;
    const tasksLeft = totalTasks - completedTasks;
    const workLeft = totalWork - completedWork;

    return [
      {
        label: "Days",
        completed: daysCompleted,
        total: durationDays,
        remaining: Math.abs(daysLeft),
        percent: daysPercent,
        color: isOverdue ? "bg-red-500" : "bg-blue-500",
        textColor: isOverdue ? "text-red-500" : "text-blue-500",
        unit: "d",
        overdue: isOverdue,
      },
      {
        label: "Tasks",
        completed: completedTasks,
        total: totalTasks,
        remaining: tasksLeft,
        percent: taskPercent,
        color: "bg-green-500",
        textColor: "text-green-600 dark:text-green-500",
        unit: "",
      },
      {
        label: "Work",
        completed: completedWork,
        total: totalWork,
        remaining: workLeft,
        percent: workPercent,
        color: "bg-purple-500",
        textColor: "text-purple-600 dark:text-purple-500",
        unit: "",
      },
    ];
  }, [daysElapsed, durationDays, daysRemaining, sprintTodos]);

  if (compact) {
    // Compact mode: three thin bars stacked with "x / y" in corresponding colors
    return (
      <div className="space-y-0.5">
        {metrics.map((metric) => {
          // Format the "x / y" display based on metric type
          let progressDisplay: string;
          if (metric.label === "Work") {
            progressDisplay = `${formatDuration(metric.completed)} / ${formatDuration(metric.total)}`;
          } else if (metric.label === "Days") {
            progressDisplay = `${metric.completed}${metric.unit} / ${metric.total}${metric.unit}`;
          } else {
            progressDisplay = `${metric.completed} / ${metric.total}`;
          }

          return (
            <div key={metric.label} className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 w-8 flex-shrink-0">{metric.label}</span>
              <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${metric.color} transition-all duration-300`}
                  style={{ width: `${metric.percent}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium w-14 text-center flex-shrink-0 ${metric.textColor}`}>
                {progressDisplay}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full mode: three bars with labels and values
  return (
    <div className="space-y-2">
      {metrics.map((metric) => {
        let valueDisplay: string;
        if (metric.label === "Work") {
          valueDisplay = `${formatDuration(metric.completed)} / ${formatDuration(metric.total)}`;
        } else if (metric.label === "Days") {
          valueDisplay = `${metric.completed}d / ${metric.total}d`;
        } else {
          valueDisplay = `${metric.completed} / ${metric.total}`;
        }

        return (
          <div key={metric.label}>
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              <span className="font-medium">{metric.label}</span>
              <span>
                {valueDisplay} ({metric.percent}%)
              </span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${metric.color} transition-all duration-300`}
                style={{ width: `${metric.percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
