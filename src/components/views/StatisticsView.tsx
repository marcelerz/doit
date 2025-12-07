"use client";

import { useMemo } from "react";
import { TodoModel } from "@/models/TodoModel";
import { ProjectModel } from "@/models/ProjectModel";
import { ProjectCategory } from "@/types/settings";

interface StatisticsViewProps {
  todos: TodoModel[];
  projects?: ProjectModel[];
  categories?: ProjectCategory[];
}

export function StatisticsView({ todos, projects = [], categories = [] }: StatisticsViewProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Basic counts
    const allTodos = todos.filter((t) => !t.isDeleted);
    const activeTodos = allTodos.filter((t) => t.isActive);
    const completedTodos = allTodos.filter((t) => t.isCompleted);
    const archivedTodos = allTodos.filter((t) => t.isArchived);

    // Time tracking stats
    const todosWithTracking = allTodos.filter((t) => t.hasTimeTracking);
    const totalTrackedMinutes = todosWithTracking.reduce((sum, t) => sum + t.totalTrackedMinutes, 0);
    const currentlyTracking = allTodos.filter((t) => t.isTrackingTime);

    // Time tracked today (from entries that started today)
    const trackedToday = todosWithTracking.reduce((sum, t) => {
      const todayMinutes =
        t.raw.timeTracking?.entries.reduce((entrySum, entry) => {
          const startDate = new Date(entry.startTime);
          if (startDate >= today) {
            const endTime = entry.endTime ? new Date(entry.endTime).getTime() : Date.now();
            return entrySum + Math.round((endTime - startDate.getTime()) / (1000 * 60));
          }
          return entrySum;
        }, 0) || 0;
      return sum + todayMinutes;
    }, 0);

    // Time tracked this week
    const trackedThisWeek = todosWithTracking.reduce((sum, t) => {
      const weekMinutes =
        t.raw.timeTracking?.entries.reduce((entrySum, entry) => {
          const startDate = new Date(entry.startTime);
          if (startDate >= weekAgo) {
            const endTime = entry.endTime ? new Date(entry.endTime).getTime() : Date.now();
            return entrySum + Math.round((endTime - startDate.getTime()) / (1000 * 60));
          }
          return entrySum;
        }, 0) || 0;
      return sum + weekMinutes;
    }, 0);

    // Time by project
    const timeByProject: Record<string, number> = {};
    todosWithTracking.forEach((t) => {
      const todoProjects = t.projects.length > 0 ? t.projects : ["No Project"];
      todoProjects.forEach((project) => {
        timeByProject[project] = (timeByProject[project] || 0) + t.totalTrackedMinutes;
      });
    });

    // Time by category (derived from project categories)
    const timeByCategory: Record<string, { minutes: number; color: string }> = {};
    todosWithTracking.forEach((t) => {
      const todoProjects = t.projects;
      if (todoProjects.length === 0) {
        // No project = uncategorized
        const key = "Uncategorized";
        if (!timeByCategory[key]) {
          timeByCategory[key] = { minutes: 0, color: "#9ca3af" };
        }
        timeByCategory[key].minutes += t.totalTrackedMinutes;
      } else {
        todoProjects.forEach((projectName) => {
          // Find the project and its category
          const project = projects.find((p) => p.name === projectName || p.alternatives.includes(projectName));
          const categoryId = project?.raw.category;
          const category = categoryId ? categories.find((c) => c.id === categoryId) : null;

          const key = category ? category.name : "Uncategorized";
          const color = category ? category.color : "#9ca3af";

          if (!timeByCategory[key]) {
            timeByCategory[key] = { minutes: 0, color };
          }
          timeByCategory[key].minutes += t.totalTrackedMinutes;
        });
      }
    });

    // Completed this week
    const completedThisWeek = completedTodos.filter((t) => {
      const completedDate = t.completedAt ? new Date(t.completedAt) : null;
      return completedDate && completedDate >= weekAgo;
    });

    // Completed today
    const completedToday = completedTodos.filter((t) => {
      const completedDate = t.completedAt ? new Date(t.completedAt) : null;
      return completedDate && completedDate >= today;
    });

    // Created this week
    const createdThisWeek = allTodos.filter((t) => {
      const createdDate = new Date(t.createdAt);
      return createdDate >= weekAgo;
    });

    // Created today
    const createdToday = allTodos.filter((t) => {
      const createdDate = new Date(t.createdAt);
      return createdDate >= today;
    });

    // Overdue count
    const overdueTodos = activeTodos.filter((t) => {
      if (!t.metadata.dueDate) return false;
      const dueDate = new Date(t.metadata.dueDate);
      dueDate.setHours(23, 59, 59, 999);
      return dueDate < now;
    });

    // Due today
    const dueToday = activeTodos.filter((t) => {
      if (!t.metadata.dueDate) return false;
      const dueDate = new Date(t.metadata.dueDate);
      return dueDate.toDateString() === today.toDateString();
    });

    // Average completion time (from creation to completion)
    const completedWithTimes = completedTodos.filter((t) => t.createdAt && t.completedAt);
    const avgCompletionTime =
      completedWithTimes.length > 0
        ? completedWithTimes.reduce((sum, t) => {
            const created = new Date(t.createdAt).getTime();
            const completed = new Date(t.completedAt!).getTime();
            return sum + (completed - created);
          }, 0) / completedWithTimes.length
        : 0;

    // Completion rate (last 7 days)
    const createdLastWeek = allTodos.filter((t) => {
      const createdDate = new Date(t.createdAt);
      return createdDate >= weekAgo && createdDate < today;
    });
    const completedFromLastWeek = createdLastWeek.filter((t) => t.isCompleted || t.isArchived);
    const weeklyCompletionRate =
      createdLastWeek.length > 0 ? (completedFromLastWeek.length / createdLastWeek.length) * 100 : 0;

    // Tasks by priority
    const byPriority = activeTodos.reduce((acc, t) => {
      const priority = t.metadata.priority || "none";
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Completion trend (last 7 days)
    const completionTrend: { date: string; completed: number; created: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const completedOnDay = completedTodos.filter((t) => {
        const completedDate = t.completedAt ? new Date(t.completedAt) : null;
        return completedDate && completedDate >= date && completedDate < nextDate;
      }).length;

      const createdOnDay = allTodos.filter((t) => {
        const createdDate = new Date(t.createdAt);
        return createdDate >= date && createdDate < nextDate;
      }).length;

      completionTrend.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        completed: completedOnDay,
        created: createdOnDay,
      });
    }

    // Streak: consecutive days with completions
    let streak = 0;
    const checkDate = new Date(today);
    while (true) {
      const nextDate = new Date(checkDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const completedOnDay = completedTodos.some((t) => {
        const completedDate = t.completedAt ? new Date(t.completedAt) : null;
        return completedDate && completedDate >= checkDate && completedDate < nextDate;
      });
      if (completedOnDay) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
      // Prevent infinite loop
      if (streak > 365) break;
    }

    return {
      total: allTodos.length,
      active: activeTodos.length,
      completed: completedTodos.length,
      archived: archivedTodos.length,
      completedThisWeek: completedThisWeek.length,
      completedToday: completedToday.length,
      createdThisWeek: createdThisWeek.length,
      createdToday: createdToday.length,
      overdue: overdueTodos.length,
      dueToday: dueToday.length,
      avgCompletionTime,
      weeklyCompletionRate,
      byPriority,
      completionTrend,
      streak,
      // Time tracking stats
      totalTrackedMinutes,
      trackedToday,
      trackedThisWeek,
      currentlyTracking: currentlyTracking.length,
      tasksWithTracking: todosWithTracking.length,
      timeByProject,
      timeByCategory,
    };
  }, [todos, projects, categories]);

  // Format duration in days/hours
  const formatDuration = (ms: number) => {
    if (ms === 0) return "N/A";
    const hours = ms / (1000 * 60 * 60);
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    }
    const days = hours / 24;
    return `${Math.round(days)}d`;
  };

  // Format minutes into hours and minutes
  const formatMinutes = (minutes: number) => {
    if (minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Find max value for chart scaling
  const maxChartValue = Math.max(1, ...stats.completionTrend.map((d) => Math.max(d.completed, d.created)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Statistics</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Track your productivity and task management</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Active Tasks</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completedToday}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Completed Today</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.dueToday}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Due Today</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div
            className={`text-3xl font-bold ${stats.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-400"}`}
          >
            {stats.overdue}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Overdue</div>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">This Week</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 dark:text-zinc-400">Tasks Created</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.createdThisWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 dark:text-zinc-400">Tasks Completed</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{stats.completedThisWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 dark:text-zinc-400">Completion Rate</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {stats.weeklyCompletionRate.toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 dark:text-zinc-400">Avg. Completion Time</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatDuration(stats.avgCompletionTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Streak & Progress</h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">{stats.streak}</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Day{stats.streak !== 1 ? "s" : ""} Streak</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Consecutive days with completions</div>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${Math.min(100, stats.weeklyCompletionRate)}%` }}
              />
            </div>
            <div className="text-center text-xs text-zinc-500 dark:text-zinc-500">Weekly completion progress</div>
          </div>
        </div>
      </div>

      {/* Time Tracking Stats */}
      {stats.tasksWithTracking > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">⏱️ Time Tracking</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Tracked Today</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {formatMinutes(stats.trackedToday)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Tracked This Week</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatMinutes(stats.trackedThisWeek)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Total Tracked</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatMinutes(stats.totalTrackedMinutes)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Tasks with Time</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.tasksWithTracking}</span>
              </div>
              {stats.currentlyTracking > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-400">Currently Tracking</span>
                  <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {stats.currentlyTracking} task{stats.currentlyTracking !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">📁 Time by Project</h3>
            {Object.keys(stats.timeByProject).length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-500 text-sm">No time tracked yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.timeByProject)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([project, minutes]) => (
                    <div key={project} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 text-sm text-zinc-600 dark:text-zinc-400 truncate">{project}</div>
                      <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{
                            width: `${(minutes / Math.max(...Object.values(stats.timeByProject))) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="w-16 text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {formatMinutes(minutes)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time by Category */}
      {Object.keys(stats.timeByCategory).length > 0 && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">📂 Time by Category</h3>
          <div className="space-y-2">
            {Object.entries(stats.timeByCategory)
              .sort((a, b) => b[1].minutes - a[1].minutes)
              .map(([categoryName, data]) => (
                <div key={categoryName} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: data.color }} />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{categoryName}</span>
                  </div>
                  <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: data.color,
                        width: `${
                          (data.minutes / Math.max(...Object.values(stats.timeByCategory).map((d) => d.minutes))) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatMinutes(data.minutes)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 7-Day Activity Chart */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">7-Day Activity</h3>
        <div className="flex items-end gap-2 h-32">
          {stats.completionTrend.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: "100px" }}>
                <div
                  className="w-3 bg-blue-500/60 rounded-t transition-all"
                  style={{ height: `${(day.created / maxChartValue) * 100}px` }}
                  title={`${day.created} created`}
                />
                <div
                  className="w-3 bg-green-500 rounded-t transition-all"
                  style={{ height: `${(day.completed / maxChartValue) * 100}px` }}
                  title={`${day.completed} completed`}
                />
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-500">{day.date}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500/60 rounded" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Created</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Completed</span>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Active Tasks by Priority</h3>
        {Object.keys(stats.byPriority).length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-500 text-sm">No active tasks</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(stats.byPriority)
              .sort((a, b) => b[1] - a[1])
              .map(([priority, count]) => (
                <div key={priority} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                    {priority === "none" ? "No priority" : priority}
                  </div>
                  <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        priority === "urgent"
                          ? "bg-red-500"
                          : priority === "high"
                          ? "bg-orange-500"
                          : priority === "medium"
                          ? "bg-yellow-500"
                          : priority === "low"
                          ? "bg-green-500"
                          : "bg-zinc-400"
                      }`}
                      style={{ width: `${(count / stats.active) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">{count}</div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Overall Stats */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">All Time</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500">Total Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.archived}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500">Archived</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total > 0 ? Math.round(((stats.completed + stats.archived) / stats.total) * 100) : 0}%
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500">Overall Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
