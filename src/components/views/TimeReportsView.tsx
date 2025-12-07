"use client";

import { useMemo, useState } from "react";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { ProjectCategory } from "@/types/settings";

interface TimeReportsViewProps {
  todos: TodoModel[];
  people: PersonModel[];
  projects: ProjectModel[];
  categories: ProjectCategory[];
}

type TimePeriod = "today" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "all";
type GroupBy = "person" | "project" | "category" | "day";

export function TimeReportsView({ todos, people, projects, categories }: TimeReportsViewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("thisWeek");
  const [groupBy, setGroupBy] = useState<GroupBy>("person");

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(today);
    endOfToday.setDate(endOfToday.getDate() + 1);

    switch (timePeriod) {
      case "today":
        return { start: today, end: endOfToday, label: "Today" };
      case "thisWeek": {
        const startOfWeek = new Date(today);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
        return { start: startOfWeek, end: endOfToday, label: "This Week" };
      }
      case "lastWeek": {
        const startOfLastWeek = new Date(today);
        const dayOfWeek = startOfLastWeek.getDay();
        startOfLastWeek.setDate(startOfLastWeek.getDate() - dayOfWeek - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 7);
        return { start: startOfLastWeek, end: endOfLastWeek, label: "Last Week" };
      }
      case "thisMonth": {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: startOfMonth, end: endOfToday, label: "This Month" };
      }
      case "lastMonth": {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: startOfLastMonth, end: endOfLastMonth, label: "Last Month" };
      }
      case "all":
      default:
        return { start: new Date(0), end: endOfToday, label: "All Time" };
    }
  }, [timePeriod]);

  // Get all time entries within the date range
  const timeEntries = useMemo(() => {
    const entries: Array<{
      todoId: string;
      todoTitle: string;
      startTime: Date;
      endTime: Date;
      duration: number; // in minutes
      assignedPeople: string[];
      projects: string[];
      categories: string[];
      note?: string;
    }> = [];

    todos.forEach((todo) => {
      if (!todo.raw.timeTracking?.entries) return;

      // Get categories for this todo's projects
      const todoCategories: string[] = [];
      todo.projects.forEach((projectName) => {
        const project = projects.find((p) => p.name === projectName || p.alternatives.includes(projectName));
        if (project?.raw.category) {
          const category = categories.find((c) => c.id === project.raw.category);
          if (category && !todoCategories.includes(category.name)) {
            todoCategories.push(category.name);
          }
        }
      });
      if (todoCategories.length === 0) {
        todoCategories.push("Uncategorized");
      }

      todo.raw.timeTracking.entries.forEach((entry) => {
        const startTime = new Date(entry.startTime);
        const endTime = entry.endTime ? new Date(entry.endTime) : new Date();

        // Check if entry falls within the date range
        if (startTime >= dateRange.start && startTime < dateRange.end) {
          const duration = entry.duration || Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

          entries.push({
            todoId: todo.id,
            todoTitle: todo.plainText.substring(0, 50) + (todo.plainText.length > 50 ? "..." : ""),
            startTime,
            endTime,
            duration,
            assignedPeople: todo.assignedPeople.length > 0 ? todo.assignedPeople : ["Unassigned"],
            projects: todo.projects.length > 0 ? todo.projects : ["No Project"],
            categories: todoCategories,
            note: entry.note,
          });
        }
      });
    });

    return entries.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [todos, projects, categories, dateRange]);

  // Calculate totals by grouping
  const groupedData = useMemo(() => {
    const groups: Record<string, { minutes: number; entries: number; color?: string }> = {};

    timeEntries.forEach((entry) => {
      let keys: string[] = [];

      switch (groupBy) {
        case "person":
          keys = entry.assignedPeople;
          break;
        case "project":
          keys = entry.projects;
          break;
        case "category":
          keys = entry.categories;
          break;
        case "day":
          keys = [entry.startTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })];
          break;
      }

      keys.forEach((key) => {
        if (!groups[key]) {
          let color: string | undefined;
          if (groupBy === "person") {
            const person = people.find((p) => p.name === key || p.alternatives.includes(key));
            color = person?.color;
          } else if (groupBy === "project") {
            const project = projects.find((p) => p.name === key || p.alternatives.includes(key));
            color = project?.color;
          } else if (groupBy === "category") {
            const category = categories.find((c) => c.name === key);
            color = category?.color;
          }
          groups[key] = { minutes: 0, entries: 0, color };
        }
        groups[key].minutes += entry.duration;
        groups[key].entries += 1;
      });
    });

    return Object.entries(groups)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [timeEntries, groupBy, people, projects, categories]);

  // Total time for the period
  const totalMinutes = useMemo(() => {
    return timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
  }, [timeEntries]);

  // Format minutes into hours and minutes
  const formatMinutes = (minutes: number) => {
    if (minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Format as decimal hours (e.g., 1.5h)
  const formatDecimalHours = (minutes: number) => {
    if (minutes === 0) return "0.0h";
    const hours = minutes / 60;
    return `${hours.toFixed(1)}h`;
  };

  // Get max value for bar chart scaling
  const maxMinutes = Math.max(1, ...groupedData.map((g) => g.minutes));

  // Default colors for groups without custom colors
  const defaultColors = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Time Reports</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Track time spent on tasks by person, project, or category
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Time Period Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Period:</span>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="lastWeek">Last Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Group By Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="person">Person</option>
            <option value="project">Project</option>
            <option value="category">Category</option>
            <option value="day">Day</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatMinutes(totalMinutes)}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Time ({dateRange.label})</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {formatDecimalHours(totalMinutes)}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Decimal Hours</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{timeEntries.length}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Time Entries</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{groupedData.length}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {groupBy === "person"
              ? "People"
              : groupBy === "project"
              ? "Projects"
              : groupBy === "category"
              ? "Categories"
              : "Days"}
          </div>
        </div>
      </div>

      {/* Grouped Data Chart */}
      {groupedData.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
          <div className="text-4xl mb-3">⏱️</div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No Time Tracked</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No time entries found for {dateRange.label.toLowerCase()}. Start tracking time on tasks to see reports here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Time by{" "}
            {groupBy === "person"
              ? "Person"
              : groupBy === "project"
              ? "Project"
              : groupBy === "category"
              ? "Category"
              : "Day"}
          </h3>
          <div className="space-y-3">
            {groupedData.map((group, index) => (
              <div key={group.name} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-40 flex-shrink-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.color || defaultColors[index % defaultColors.length] }}
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate" title={group.name}>
                    {group.name}
                  </span>
                </div>
                <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: group.color || defaultColors[index % defaultColors.length],
                      width: `${(group.minutes / maxMinutes) * 100}%`,
                    }}
                  />
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatMinutes(group.minutes)}
                  </span>
                </div>
                <div className="w-16 text-right">
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    {Math.round((group.minutes / totalMinutes) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Time Entries */}
      {timeEntries.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Recent Time Entries</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-2 px-2 text-zinc-600 dark:text-zinc-400 font-medium">Date</th>
                  <th className="text-left py-2 px-2 text-zinc-600 dark:text-zinc-400 font-medium">Task</th>
                  <th className="text-left py-2 px-2 text-zinc-600 dark:text-zinc-400 font-medium">Person</th>
                  <th className="text-left py-2 px-2 text-zinc-600 dark:text-zinc-400 font-medium">Project</th>
                  <th className="text-right py-2 px-2 text-zinc-600 dark:text-zinc-400 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.slice(0, 20).map((entry, index) => (
                  <tr key={index} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <td className="py-2 px-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {entry.startTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      <span className="text-zinc-400 dark:text-zinc-500 ml-1">
                        {entry.startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-zinc-900 dark:text-zinc-100 max-w-xs truncate">{entry.todoTitle}</td>
                    <td className="py-2 px-2 text-zinc-600 dark:text-zinc-400">{entry.assignedPeople.join(", ")}</td>
                    <td className="py-2 px-2 text-zinc-600 dark:text-zinc-400">{entry.projects.join(", ")}</td>
                    <td className="py-2 px-2 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {formatMinutes(entry.duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {timeEntries.length > 20 && (
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-500 mt-4">
                Showing 20 of {timeEntries.length} entries
              </p>
            )}
          </div>
        </div>
      )}

      {/* Daily Breakdown (when not grouping by day) */}
      {groupBy !== "day" && timeEntries.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Daily Breakdown</h3>
          <div className="space-y-2">
            {(() => {
              const dailyTotals: Record<string, number> = {};
              timeEntries.forEach((entry) => {
                const dayKey = entry.startTime.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + entry.duration;
              });

              const maxDaily = Math.max(1, ...Object.values(dailyTotals));

              return Object.entries(dailyTotals)
                .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                .slice(0, 7)
                .map(([day, minutes]) => (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-32 flex-shrink-0 text-sm text-zinc-600 dark:text-zinc-400">{day}</div>
                    <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(minutes / maxDaily) * 100}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatMinutes(minutes)}
                    </div>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
