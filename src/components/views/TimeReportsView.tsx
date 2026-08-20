"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { Settings } from "@/types/settings";
import { ProjectCategory } from "@/types/project";
import { SprintId } from "@/types/sprint";
import { TodoId } from "@/types/todo";
import { SprintModel } from "@/models/SprintModel";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "@/storage/storage";
import { PrintIcon } from "@/components/shared/Icons";
import { formatDateKey } from "@/utils/dateUtils";

type TimePeriod = "today" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "all" | "custom";
type GroupBy = "assigned" | "source" | "project" | "category" | "sprint" | "day";

interface TimeReportOptions {
  timePeriod: TimePeriod;
  groupBy: GroupBy;
  customStartDate?: string;
  customEndDate?: string;
}

interface TimeReportsViewProps {
  todos: TodoModel[];
  people: PersonModel[];
  projects: ProjectModel[];
  settings: Settings;
  sprints: SprintModel[];
}

interface TimeEntry {
  todoId: TodoId;
  todoText: string;
  date: string;
  duration: number; // in minutes
  assignedPeople: string[];
  sourcePeople: string[];
  projects: string[];
  category?: string; // Project category (derived from project)
  sprint?: SprintId; // Sprint ID
}

function getWeekRange(date: Date, weekStart: number = 0): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = (day - weekStart + 7) % 7;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return "0m";
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const DEFAULT_OPTIONS: TimeReportOptions = {
  timePeriod: "thisWeek",
  groupBy: "assigned",
};

// Color palette for charts
const CHART_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#84cc16", // lime
  "#6366f1", // indigo
];

export default function TimeReportsView({ todos, people, projects, settings, sprints }: TimeReportsViewProps) {
  const [options, setOptions] = useState<TimeReportOptions>(DEFAULT_OPTIONS);
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialMount = useRef(true);

  // Load options from storage on mount
  useEffect(() => {
    loadFromStorage<TimeReportOptions>(STORAGE_KEYS.TIME_REPORT_OPTIONS, DEFAULT_OPTIONS).then((stored) => {
      setOptions(stored);
      setIsLoaded(true);
    });
  }, []);

  const { timePeriod, groupBy, customStartDate, customEndDate } = options;

  // Save options when they change (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.TIME_REPORT_OPTIONS, options);
    }
  }, [options, isLoaded]);

  const setTimePeriod = (value: TimePeriod) => {
    setOptions((prev) => ({ ...prev, timePeriod: value }));
  };

  const setGroupBy = (value: GroupBy) => {
    setOptions((prev) => ({ ...prev, groupBy: value }));
  };

  const setCustomStartDate = (value: string) => {
    setOptions((prev) => ({ ...prev, customStartDate: value }));
  };

  const setCustomEndDate = (value: string) => {
    setOptions((prev) => ({ ...prev, customEndDate: value }));
  };

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    const weekStart = settings.dateTime?.workWeekStart || 0;

    switch (timePeriod) {
      case "today": {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case "thisWeek":
        return getWeekRange(now, weekStart);
      case "lastWeek": {
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return getWeekRange(lastWeek, weekStart);
      }
      case "thisMonth":
        return getMonthRange(now);
      case "lastMonth": {
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return getMonthRange(lastMonth);
      }
      case "custom": {
        const start = customStartDate ? new Date(customStartDate) : new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = customEndDate ? new Date(customEndDate) : new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case "all":
      default:
        return { start: new Date(0), end: new Date(9999, 11, 31) };
    }
  }, [timePeriod, settings.dateTime?.workWeekStart, customStartDate, customEndDate]);

  // Extract time entries from todos
  const timeEntries = useMemo(() => {
    const entries: TimeEntry[] = [];

    todos.forEach((todo) => {
      // Only include todos with tracked time
      if (!todo.timeTracking || !todo.timeTracking.entries || todo.timeTracking.entries.length === 0) return;

      // Derive category from project
      const todoProjects = todo.projects || [];
      let categoryId: string | undefined;
      if (todoProjects.length > 0) {
        const project = projects.find((p) => p.name === todoProjects[0] || p.alternatives?.includes(todoProjects[0]));
        categoryId = project?.category;
      }

      todo.timeTracking.entries.forEach((entry) => {
        // Calculate duration - for active entries (no endTime), calculate elapsed time
        let duration = entry.duration || 0;
        if (!entry.endTime) {
          // Active entry - calculate elapsed time from startTime to now
          duration = Math.round((Date.now() - entry.startTime) / (1000 * 60));
        }

        // Skip entries with 0 duration
        if (duration === 0) return;

        const entryDate = new Date(entry.startTime);
        if (entryDate >= dateRange.start && entryDate <= dateRange.end) {
          entries.push({
            todoId: todo.id,
            todoText: todo.plainText || todo.text,
            date: new Date(entry.startTime).toISOString(),
            duration: duration,
            assignedPeople: todo.assignedPeople || [],
            sourcePeople: todo.sourcePeople || [],
            projects: todoProjects,
            category: categoryId,
            sprint: todo.sprintId,
          });
        }
      });
    });

    return entries;
  }, [todos, dateRange, projects]);

  // Group entries by selected criteria
  const groupedEntries = useMemo(() => {
    const groups: Map<string, { entries: TimeEntry[]; totalMinutes: number }> = new Map();

    timeEntries.forEach((entry) => {
      let keys: string[] = [];

      switch (groupBy) {
        case "assigned":
          keys = entry.assignedPeople.length > 0 ? entry.assignedPeople : ["Unassigned"];
          break;
        case "source":
          keys = entry.sourcePeople.length > 0 ? entry.sourcePeople : ["No Source"];
          break;
        case "project":
          keys = entry.projects.length > 0 ? entry.projects : ["No Project"];
          break;
        case "category":
          keys = [entry.category || "Uncategorized"];
          break;
        case "sprint":
          keys = [entry.sprint || "No Sprint"];
          break;
        case "day":
          keys = [entry.date.split("T")[0]];
          break;
      }

      keys.forEach((key) => {
        const existing = groups.get(key) || { entries: [], totalMinutes: 0 };
        existing.entries.push(entry);
        existing.totalMinutes += entry.duration;
        groups.set(key, existing);
      });
    });

    // Sort groups by total time (descending)
    return Array.from(groups.entries())
      .sort((a, b) => {
        if (groupBy === "day") {
          // Sort dates chronologically
          return a[0].localeCompare(b[0]);
        }
        return b[1].totalMinutes - a[1].totalMinutes;
      })
      .map(([key, data]) => ({
        key,
        displayName:
          groupBy === "day"
            ? formatDate(key)
            : getDisplayName(key, groupBy, people, projects, settings.categories, sprints),
        entries: data.entries,
        totalMinutes: data.totalMinutes,
      }));
  }, [timeEntries, groupBy, people, projects, settings.categories, sprints]);

  // Calculate totals
  const totalMinutes = useMemo(() => {
    return timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
  }, [timeEntries]);

  const handlePrint = () => {
    window.print();
  };

  // Get period label for display
  const getPeriodLabel = (): string => {
    switch (timePeriod) {
      case "today":
        return new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      case "thisWeek":
        return `${dateRange.start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${dateRange.end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      case "lastWeek":
        return `${dateRange.start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${dateRange.end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      case "thisMonth":
        return dateRange.start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      case "lastMonth":
        return dateRange.start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      case "custom":
        if (customStartDate && customEndDate) {
          return `${new Date(customStartDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })} - ${new Date(customEndDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`;
        }
        return "Custom Period";
      case "all":
        return "All Time";
      default:
        return "";
    }
  };

  // Calculate daily trend data for the selected period
  const dailyTrend = useMemo(() => {
    const days: { date: string; label: string; minutes: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const numDays = Math.min(14, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / dayMs) + 1);

    for (let i = 0; i < numDays; i++) {
      const date = new Date(dateRange.start);
      date.setDate(date.getDate() + i);
      const dateStr = formatDateKey(date);

      const minutes = timeEntries
        .filter((entry) => entry.date.split("T")[0] === dateStr)
        .reduce((sum, entry) => sum + entry.duration, 0);

      days.push({
        date: dateStr,
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        minutes,
      });
    }

    return days;
  }, [timeEntries, dateRange]);

  // Max for scaling charts
  const maxGroupMinutes = useMemo(() => {
    return Math.max(1, ...groupedEntries.map((g) => g.totalMinutes));
  }, [groupedEntries]);

  const maxDailyMinutes = useMemo(() => {
    return Math.max(1, ...dailyTrend.map((d) => d.minutes));
  }, [dailyTrend]);

  // Get color for group
  const getGroupColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          {/* Time Period Select */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Period:</label>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="lastWeek">Last Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="all">All Time</option>
              <option value="custom">Custom...</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {timePeriod === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate || ""}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
              <span className="text-zinc-500">to</span>
              <input
                type="date"
                value={customEndDate || ""}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>
          )}

          {/* Group By Select */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Group by:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              <option value="assigned">Assigned</option>
              <option value="source">Source</option>
              <option value="project">Project</option>
              <option value="category">Category</option>
              <option value="sprint">Sprint</option>
              <option value="day">Day</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="ml-auto px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-1.5"
          >
            <PrintIcon className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Print Header (only visible when printing) */}
      <div className="hidden print:block p-4 border-b border-zinc-300">
        <h1 className="text-2xl font-bold text-zinc-900">Time Report</h1>
        <p className="text-zinc-600">{getPeriodLabel()}</p>
        <p className="text-zinc-600">Grouped by: {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Time Reports</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{getPeriodLabel()}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatDuration(totalMinutes)}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Time</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{timeEntries.length}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Time Entries</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{groupedEntries.length}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {groupBy === "day"
                ? "Days"
                : groupBy === "assigned"
                ? "People"
                : groupBy === "source"
                ? "Sources"
                : groupBy === "project"
                ? "Projects"
                : groupBy === "sprint"
                ? "Sprints"
                : "Categories"}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {timeEntries.length > 0 ? formatDuration(Math.round(totalMinutes / timeEntries.length)) : "0m"}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Avg per Entry</div>
          </div>
        </div>

        {groupedEntries.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            <div className="text-4xl mb-4">⏱️</div>
            <p className="text-lg">No time entries found</p>
            <p className="text-sm mt-1">Try selecting a different time period or start tracking time on tasks</p>
          </div>
        ) : (
          <>
            {/* Daily Activity Chart */}
            {dailyTrend.length > 1 && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">📊 Daily Activity</h3>
                <div className="flex items-end gap-2 h-32">
                  {dailyTrend.map((day, _i) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
                        <div
                          className="w-full max-w-8 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                          style={{ height: `${Math.max(4, (day.minutes / maxDailyMinutes) * 100)}px` }}
                          title={`${formatDuration(day.minutes)}`}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-500">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Breakdown Chart */}
            {groupBy !== "day" && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  {groupBy === "assigned"
                    ? "👤 Time by Assigned Person"
                    : groupBy === "source"
                    ? "📥 Time by Source"
                    : groupBy === "project"
                    ? "📁 Time by Project"
                    : groupBy === "sprint"
                    ? "🏃 Time by Sprint"
                    : "📂 Time by Category"}
                </h3>
                <div className="space-y-3">
                  {groupedEntries.slice(0, 8).map((group, idx) => (
                    <div key={group.key} className="flex items-center gap-3">
                      <div className="w-24 text-sm text-zinc-600 dark:text-zinc-400 truncate" title={group.displayName}>
                        {group.displayName}
                      </div>
                      <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(group.totalMinutes / maxGroupMinutes) * 100}%`,
                            backgroundColor: getGroupColor(idx),
                          }}
                        />
                      </div>
                      <div className="w-16 text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {formatDuration(group.totalMinutes)}
                      </div>
                    </div>
                  ))}
                </div>
                {groupedEntries.length > 8 && (
                  <p className="text-xs text-zinc-500 mt-3">+ {groupedEntries.length - 8} more</p>
                )}
              </div>
            )}

            {/* Pie/Donut Chart visualization */}
            {groupBy !== "day" && groupedEntries.length > 0 && groupedEntries.length <= 10 && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">📈 Distribution</h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Donut Chart */}
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      {
                        groupedEntries.reduce(
                          (acc, group, idx) => {
                            const percent = (group.totalMinutes / totalMinutes) * 100;
                            const offset = acc.offset;
                            acc.elements.push(
                              <circle
                                key={group.key}
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke={getGroupColor(idx)}
                                strokeWidth="3"
                                strokeDasharray={`${percent} ${100 - percent}`}
                                strokeDashoffset={-offset}
                                className="transition-all"
                              />,
                            );
                            acc.offset += percent;
                            return acc;
                          },
                          { elements: [] as React.ReactNode[], offset: 0 },
                        ).elements
                      }
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {formatDuration(totalMinutes)}
                      </span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {groupedEntries.map((group, idx) => (
                      <div key={group.key} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getGroupColor(idx) }}
                        />
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate" title={group.displayName}>
                          {group.displayName}
                        </span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
                          {Math.round((group.totalMinutes / totalMinutes) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Breakdown */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">📋 Detailed Breakdown</h3>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {groupedEntries.map((group, idx) => (
                  <details key={group.key} className="group">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 list-none">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getGroupColor(idx) }}
                        />
                        <span className="font-medium text-zinc-900 dark:text-white">{group.displayName}</span>
                        <span className="text-xs text-zinc-500 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                          {group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                          {formatDuration(group.totalMinutes)}
                        </span>
                        <svg
                          className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </summary>
                    <div className="px-4 pb-3 divide-y divide-zinc-50 dark:divide-zinc-800/50">
                      {group.entries.map((entry, entryIdx) => (
                        <div
                          key={`${entry.todoId}-${entry.date}-${entryIdx}`}
                          className="py-2 flex items-center justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{entry.todoText}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formatDate(entry.date)}
                              {groupBy !== "project" && entry.projects.length > 0 && (
                                <span className="ml-2">• {entry.projects.join(", ")}</span>
                              )}
                              {groupBy !== "assigned" && entry.assignedPeople.length > 0 && (
                                <span className="ml-2">• {entry.assignedPeople.join(", ")}</span>
                              )}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 ml-4">
                            {formatDuration(entry.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          #time-reports-view,
          #time-reports-view * {
            visibility: visible;
          }
          #time-reports-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

function getDisplayName(
  key: string,
  groupBy: GroupBy,
  people: PersonModel[],
  projects: ProjectModel[],
  categories?: ProjectCategory[],
  sprints?: SprintModel[],
): string {
  if (groupBy === "assigned" || groupBy === "source") {
    const person = people.find((p) => p.name === key);
    return person?.displayName || key;
  }
  if (groupBy === "project") {
    const project = projects.find((p) => p.name === key);
    return project?.displayName || key;
  }
  if (groupBy === "category") {
    const category = categories?.find((c) => c.id === key);
    return category?.name || key;
  }
  if (groupBy === "sprint") {
    const sprint = sprints?.find((s) => s.id === key);
    return sprint?.displayName || key;
  }
  return key;
}
