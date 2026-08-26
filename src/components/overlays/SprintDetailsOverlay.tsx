"use client";

import { useState, useEffect, useMemo } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { SprintModel } from "@/models/SprintModel";
import { Sprint, SprintId } from "@/types/sprint";
import { TodoId } from "@/types/todo";
import { MarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import { getColor, CommentId } from "@/types/types";
import RichTextEditor from "@/components/input/RichTextEditor";
import { processLinkPatternsInHtml } from "@/utils/linkPatternUtils";
import { sanitizeHtml } from "@/utils/sanitize";
import { ActivitySection } from "@/components/shared/ActivitySection";
import { ActionButtons } from "@/components/shared/ActionButtons";
import { Modal } from "@/components/shared/Modal";
import { SprintProgress } from "@/components/shared/SprintProgress";
import { CloseIcon, CheckIcon } from "@/components/shared/Icons";
import { TodoModel } from "@/models/TodoModel";
import { formatDateKey } from "@/utils/dateUtils";

interface SprintDetailsOverlayProps {
  sprint: SprintModel;
  allSprints: SprintModel[];
  todos: TodoModel[];
  markerColors: MarkerColors;
  linkPatterns?: LinkPattern[];
  onClose: () => void;
  onUpdate: (id: SprintId, updates: Partial<Sprint>) => void;
  onDelete: (id: SprintId) => void;
  onStart: (id: SprintId) => void;
  onComplete: (id: SprintId) => void;
  onCancel: (id: SprintId) => void;
  onArchive: (id: SprintId) => void;
  onUnarchive: (id: SprintId) => void;
  onAddComment: (sprintId: SprintId, content: string) => void;
  onEditComment: (sprintId: SprintId, commentId: CommentId, content: string) => void;
  onDeleteComment: (sprintId: SprintId, commentId: CommentId) => void;
  onTodoClick?: (todo: TodoModel) => void;
  onRemoveTodoFromSprint?: (todoId: TodoId) => void;
}

type TabType = "details" | "todos" | "reports";

export function SprintDetailsOverlay({
  sprint,
  allSprints,
  todos,
  markerColors,
  linkPatterns = [],
  onClose,
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
}: SprintDetailsOverlayProps) {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [editingName, setEditingName] = useState(sprint.name);
  const [editingGoal, setEditingGoal] = useState(sprint.goal || "");
  const [editingDuration, setEditingDuration] = useState(sprint.durationDays);
  const [editingStartDate, setEditingStartDate] = useState(sprint.plannedStartDate || "");
  const [editingColor, setEditingColor] = useState(sprint.color || "");

  // Get todos in this sprint
  const sprintTodos = useMemo(() => {
    return todos.filter((todo) => todo.metadata.sprint === sprint.id);
  }, [todos, sprint.id]);

  const completedTodos = sprintTodos.filter((t) => t.state === "completed");
  const activeTodos = sprintTodos.filter((t) => t.state === "active");

  // Sync local state when sprint changes
  // Legitimate prop sync pattern for editable form fields
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setEditingName(sprint.name);
    setEditingGoal(sprint.goal || "");
    setEditingDuration(sprint.durationDays);
    setEditingStartDate(sprint.plannedStartDate || "");
    setEditingColor(sprint.color || "");
  }, [sprint]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Auto-save when fields change (only for planning sprints)
  useEffect(() => {
    if (sprint.status !== "planning") return;

    const handler = setTimeout(() => {
      const needsUpdate =
        editingName.trim() !== sprint.name ||
        (editingGoal.trim() || undefined) !== sprint.goal ||
        editingDuration !== sprint.durationDays ||
        (editingStartDate || undefined) !== sprint.plannedStartDate ||
        (editingColor || undefined) !== sprint.color;

      if (needsUpdate) {
        onUpdate(sprint.id, {
          name: editingName.trim(),
          goal: editingGoal.trim() || undefined,
          durationDays: editingDuration,
          plannedStartDate: editingStartDate || undefined,
          color: editingColor ? getColor(editingColor) : undefined,
        });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [editingName, editingGoal, editingDuration, editingStartDate, editingColor, sprint, onUpdate]);

  useEscapeKey(onClose);

  const handleDelete = () => {
    onDelete(sprint.id);
    onClose();
  };

  const handleStart = () => {
    onStart(sprint.id);
  };

  const handleComplete = () => {
    onComplete(sprint.id);
  };

  const handleCancel = () => {
    onCancel(sprint.id);
  };

  // Calculate velocity data (completed story points/todos per sprint)
  const velocityData = useMemo(() => {
    // For now, just count completed todos (in the future this could use story points)
    const completedSprints = allSprints.filter((s) => s.status === "completed" || s.status === "cancelled");

    return completedSprints.slice(-5).map((s) => {
      const sprintCompletedTodos = todos.filter((t) => t.metadata.sprint === s.id && t.state === "completed");
      return {
        sprintName: s.name,
        completed: sprintCompletedTodos.length,
        total: todos.filter((t) => t.metadata.sprint === s.id).length,
      };
    });
  }, [allSprints, todos]);

  // Calculate burndown data for active sprint
  const burndownData = useMemo(() => {
    if (sprint.status !== "active" || !sprint.actualStartDate) return [];

    const startDate = new Date(sprint.actualStartDate);
    const totalItems = sprintTodos.length;
    const days: { day: number; ideal: number; actual: number; date: string }[] = [];

    for (let i = 0; i <= sprint.durationDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = formatDateKey(date);

      // Ideal burndown: linear decrease
      const ideal = totalItems - (totalItems / sprint.durationDays) * i;

      // Actual: count remaining items (completed before or on this date)
      const completedByDate = sprintTodos.filter((t) => {
        if (t.state !== "completed" || !t.completedAt) return false;
        const completedDate = formatDateKey(new Date(t.completedAt));
        return completedDate <= dateStr;
      }).length;
      const actual = totalItems - completedByDate;

      days.push({
        day: i,
        ideal: Math.max(0, ideal),
        actual: Math.max(0, actual),
        date: dateStr,
      });
    }

    return days;
  }, [sprint, sprintTodos]);

  const canStartResult = sprint.canStart(allSprints);
  const canCompleteResult = sprint.canComplete();
  const canCancelResult = sprint.canCancel();

  // Get the display color (custom color > marker default)
  const sprintColor = editingColor || sprint.color || markerColors.sprint;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "details", label: "Details" },
    { id: "todos", label: "Todos", count: sprintTodos.length },
    { id: "reports", label: "Reports" },
  ];

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="4xl">
      <div className="flex flex-col h-[80vh] max-h-[800px]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md"
                style={{ backgroundColor: sprintColor }}
              >
                🏃
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{editingName || "Sprint"}</h2>
                <div className="flex gap-2 mt-1">
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded text-white"
                    style={{ backgroundColor: sprint.statusColor }}
                  >
                    {sprint.statusLabel}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    📅 {sprint.durationDays} days
                  </span>
                  {sprint.isArchived && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      📦 Archived
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-b border-zinc-200 dark:border-zinc-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-b-2 border-blue-500"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded bg-zinc-200 dark:bg-zinc-700">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Sprint Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Field */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                    Sprint Name
                  </label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    disabled={sprint.status !== "planning"}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Sprint name"
                  />
                </div>

                {/* Duration Field */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={editingDuration}
                    onChange={(e) => setEditingDuration(parseInt(e.target.value) || 14)}
                    disabled={sprint.status !== "planning"}
                    min={1}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Start Date Field */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                    {sprint.status === "planning" ? "Planned Start Date" : "Start Date"}
                  </label>
                  {sprint.status === "planning" ? (
                    <input
                      type="date"
                      value={editingStartDate}
                      onChange={(e) => setEditingStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                      {sprint.actualStartDate || "Not started"}
                    </div>
                  )}
                </div>

                {/* End Date Field */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                    {sprint.actualEndDate ? "End Date" : "Planned End Date"}
                  </label>
                  <div className="px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                    {sprint.actualEndDate || sprint.plannedEndDate || "—"}
                  </div>
                </div>

                {/* Color Field */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={editingColor || markerColors.sprint}
                      onChange={(e) => setEditingColor(e.target.value)}
                      disabled={sprint.status !== "planning"}
                      className="h-10 w-20 rounded cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <input
                      type="text"
                      value={editingColor || markerColors.sprint}
                      onChange={(e) => setEditingColor(e.target.value)}
                      disabled={sprint.status !== "planning"}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="#dbeafe"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    {editingColor && sprint.status === "planning" && (
                      <button
                        onClick={() => setEditingColor("")}
                        className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Use Default
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress (for active sprints) */}
              {sprint.status === "active" && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sprint Progress</span>
                  </div>
                  <SprintProgress
                    daysElapsed={sprint.daysElapsed}
                    durationDays={sprint.durationDays}
                    daysRemaining={sprint.daysRemaining}
                    sprintTodos={sprintTodos}
                    compact={false}
                  />
                </div>
              )}

              {/* Goal */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                  🎯 Sprint Goal
                </label>
                {sprint.status === "planning" ? (
                  <RichTextEditor
                    value={editingGoal}
                    onChange={(html) => setEditingGoal(html || "")}
                    placeholder="What is the goal of this sprint?"
                    minHeight="80px"
                    maxHeight="200px"
                    noBorderInViewMode={true}
                    linkPatterns={linkPatterns}
                  />
                ) : (
                  <div
                    className="px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:cursor-pointer"
                    dangerouslySetInnerHTML={{
                      // SECURITY: sanitize on render - imported/restored sprints never pass through RichTextEditor
                      __html: processLinkPatternsInHtml(
                        sanitizeHtml(sprint.goal || "<em>No goal set</em>"),
                        linkPatterns
                      ),
                    }}
                  />
                )}
              </div>

              {/* Sprint Actions */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
                  ⚡ Sprint Actions
                </label>
                <div className="flex flex-wrap gap-2">
                  {canStartResult.canStart && (
                    <button
                      onClick={handleStart}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      🚀 Start Sprint
                    </button>
                  )}
                  {canCompleteResult.canComplete && (
                    <button
                      onClick={handleComplete}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      ✅ Complete Sprint
                    </button>
                  )}
                  {canCancelResult.canCancel && (
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      ❌ Cancel Sprint
                    </button>
                  )}
                  {!canStartResult.canStart && sprint.status === "planning" && (
                    <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      ⚠️ {canStartResult.reason || "Complete or cancel the active sprint before starting this one"}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (Archive/Delete) */}
              <div className="pt-4">
                <ActionButtons
                  isArchived={sprint.isArchived}
                  onArchive={
                    sprint.canArchive().canArchive
                      ? () => {
                          onArchive(sprint.id);
                          onClose();
                        }
                      : undefined
                  }
                  onUnarchive={
                    sprint.canUnarchive().canUnarchive
                      ? () => {
                          onUnarchive(sprint.id);
                        }
                      : undefined
                  }
                  onDelete={sprint.canDelete().canDelete ? handleDelete : undefined}
                  archiveLabel="Archive sprint"
                  unarchiveLabel="Unarchive sprint"
                  deleteLabel="Delete sprint"
                />
              </div>

              {/* Activity Section */}
              <ActivitySection
                activities={sprint.activity || []}
                comments={sprint.comments}
                linkPatterns={linkPatterns}
                onAddComment={(content) => onAddComment(sprint.id, content)}
                onEditComment={(commentId, content) => onEditComment(sprint.id, commentId, content)}
                onDeleteComment={(commentId) => onDeleteComment(sprint.id, commentId)}
              />
            </div>
          )}

          {activeTab === "todos" && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sprintTodos.length}</div>
                  <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Total</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{activeTodos.length}</div>
                  <div className="text-xs text-amber-600/70 dark:text-amber-400/70">Active</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTodos.length}</div>
                  <div className="text-xs text-green-600/70 dark:text-green-400/70">Completed</div>
                </div>
              </div>

              {/* Todo List */}
              {sprintTodos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📋</div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No tasks in this sprint</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Assign tasks to this sprint from the todo detail view
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sprintTodos.map((todo) => (
                    <div
                      key={todo.id}
                      onClick={() => onTodoClick?.(todo)}
                      className={`group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        todo.state === "completed"
                          ? "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          todo.state === "completed"
                            ? "bg-green-500 border-green-500"
                            : "border-zinc-300 dark:border-zinc-600"
                        }`}
                      >
                        {todo.state === "completed" && <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm ${
                            todo.state === "completed"
                              ? "text-zinc-500 dark:text-zinc-400 line-through"
                              : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {todo.plainText}
                        </div>
                        {todo.metadata.dueDate && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            📅 {todo.metadata.dueDate}
                          </div>
                        )}
                      </div>
                      {onRemoveTodoFromSprint && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveTodoFromSprint(todo.id);
                          }}
                          className="p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove from sprint"
                        >
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-8">
              {/* Burndown Chart (for active sprint) */}
              {sprint.status === "active" && burndownData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">📉 Burndown Chart</h3>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                    <div className="h-48 relative">
                      {/* Simple SVG burndown chart */}
                      <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line
                            key={i}
                            x1="40"
                            y1={20 + i * 30}
                            x2="380"
                            y2={20 + i * 30}
                            stroke="currentColor"
                            className="text-zinc-200 dark:text-zinc-700"
                            strokeWidth="1"
                          />
                        ))}

                        {/* Ideal line */}
                        <line
                          x1="40"
                          y1="20"
                          x2="380"
                          y2="140"
                          stroke="#94a3b8"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />

                        {/* Actual line */}
                        {burndownData.length > 1 && (
                          <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            points={burndownData
                              .map((d, i) => {
                                const x = 40 + (340 / (burndownData.length - 1)) * i;
                                const y = 20 + ((sprintTodos.length - d.actual) / sprintTodos.length) * 120;
                                return `${x},${y}`;
                              })
                              .join(" ")}
                          />
                        )}

                        {/* Y-axis label */}
                        <text
                          x="10"
                          y="80"
                          className="text-xs fill-zinc-500 dark:fill-zinc-400"
                          transform="rotate(-90, 10, 80)"
                        >
                          Tasks
                        </text>

                        {/* X-axis label */}
                        <text x="210" y="155" className="text-xs fill-zinc-500 dark:fill-zinc-400" textAnchor="middle">
                          Days
                        </text>
                      </svg>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-zinc-400 border-dashed" style={{ borderStyle: "dashed" }} />
                        <span className="text-zinc-500 dark:text-zinc-400">Ideal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-500" />
                        <span className="text-zinc-500 dark:text-zinc-400">Actual</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Velocity Chart */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
                  📊 Velocity (Last 5 Sprints)
                </h3>
                {velocityData.length === 0 ? (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-8 text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Complete sprints to see velocity data</p>
                  </div>
                ) : (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                    <div className="h-40 flex items-end gap-2">
                      {velocityData.map((data, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div className="w-full max-w-12 flex flex-col items-center gap-1">
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              {data.completed}
                            </span>
                            <div
                              className="w-full bg-green-500 dark:bg-green-600 rounded-t transition-all"
                              style={{
                                height: `${Math.max(
                                  8,
                                  (data.completed / Math.max(...velocityData.map((d) => d.total), 1)) * 100,
                                )}px`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 truncate w-full text-center">
                            {data.sprintName.substring(0, 8)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-center mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                      Average: {Math.round(velocityData.reduce((sum, d) => sum + d.completed, 0) / velocityData.length)}{" "}
                      tasks/sprint
                    </div>
                  </div>
                )}
              </div>

              {/* Sprint Summary */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">📋 Sprint Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{sprintTodos.length}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Total Tasks</div>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTodos.length}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Completed</div>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {sprintTodos.length > 0 ? Math.round((completedTodos.length / sprintTodos.length) * 100) : 0}%
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Completion Rate</div>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{sprint.durationDays}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Sprint Days</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
