"use client";

import { Todo } from "@/types/todo";
import { MarkerColors } from "@/types/settings";
import { useMemo } from "react";

interface GanttViewProps {
  todos: Todo[];
  markerColors: MarkerColors;
}

export function GanttView({ todos, markerColors }: GanttViewProps) {
  // Filter todos that have due dates
  const todosWithDates = useMemo(() => {
    return todos
      .filter((todo) => todo.metadata.dueDate && todo.state !== "deleted")
      .map((todo) => {
        try {
          const dueDate = new Date(todo.metadata.dueDate!);
          return { ...todo, parsedDate: dueDate };
        } catch {
          return null;
        }
      })
      .filter((todo): todo is Todo & { parsedDate: Date } => todo !== null)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  }, [todos]);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (todosWithDates.length === 0) {
      const today = new Date();
      return {
        start: today,
        end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };
    }

    const dates = todosWithDates.map((t) => t.parsedDate.getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    // Add padding
    const start = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const end = new Date(maxDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    return { start, end };
  }, [todosWithDates]);

  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000));

  // Generate week labels
  const weeks = useMemo(() => {
    const result = [];
    const current = new Date(dateRange.start);
    while (current < dateRange.end) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    return result;
  }, [dateRange]);

  const getPositionPercentage = (date: Date) => {
    const totalMs = dateRange.end.getTime() - dateRange.start.getTime();
    const offsetMs = date.getTime() - dateRange.start.getTime();
    return (offsetMs / totalMs) * 100;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStateColor = (state: Todo["state"]) => {
    switch (state) {
      case "completed":
        return "bg-green-500";
      case "archived":
        return "bg-zinc-400";
      case "active":
      default:
        return "bg-blue-500";
    }
  };

  if (todosWithDates.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">
          No tasks with due dates. Add due dates to see them in the Gantt chart!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Timeline: {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
        </h3>

        {/* Timeline header */}
        <div className="mb-4 relative h-8">
          <div className="absolute inset-0 flex">
            {weeks.map((week, i) => (
              <div key={i} className="flex-1 border-l border-zinc-300 dark:border-zinc-700 px-2 text-xs text-zinc-500">
                {week.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            ))}
          </div>
        </div>

        {/* Gantt bars */}
        <div className="space-y-2">
          {todosWithDates.map((todo) => {
            const position = getPositionPercentage(todo.parsedDate);
            const createdDate = new Date(todo.createdAt);
            const startPosition = getPositionPercentage(createdDate);
            const width = Math.max(position - startPosition, 2);

            return (
              <div key={todo.id} className="relative h-12 group">
                {/* Background track */}
                <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded" />

                {/* Gantt bar */}
                <div
                  className={`absolute top-1 bottom-1 ${getStateColor(
                    todo.state,
                  )} rounded shadow-sm transition-all group-hover:shadow-md`}
                  style={{
                    left: `${Math.max(0, startPosition)}%`,
                    width: `${Math.min(100 - startPosition, width)}%`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                    <span className="text-xs font-medium text-white truncate">{todo.plainText}</span>
                  </div>
                </div>

                {/* Due date marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${position}%` }}
                  title={`Due: ${formatDate(todo.parsedDate)}`}
                />

                {/* Tooltip on hover */}
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-20 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                  <div className="font-medium">{todo.plainText}</div>
                  <div className="text-zinc-300 dark:text-zinc-600">Due: {formatDate(todo.parsedDate)}</div>
                  {todo.metadata.priority && (
                    <div className="text-zinc-300 dark:text-zinc-600">Priority: {todo.metadata.priority}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-4 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-zinc-700 dark:text-zinc-300">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-zinc-700 dark:text-zinc-300">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-zinc-400 rounded" />
            <span className="text-zinc-700 dark:text-zinc-300">Archived</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-red-500" />
            <span className="text-zinc-700 dark:text-zinc-300">Due Date</span>
          </div>
        </div>
      </div>
    </div>
  );
}
