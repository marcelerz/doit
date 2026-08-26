"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ReviewModel } from "@/models/ReviewModel";

import { Review, ReviewId, ReviewEntry, ReviewTaskEntry, ReviewChildEntry } from "@/types/review";
import { Todo } from "@/types/todo";
import {
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@/components/shared/Icons";
import RichTextEditor from "@/components/input/RichTextEditor";
import { getCompletedTasksInPeriod, getChildReviewsForPeriod, getChildLevel } from "@/utils/reviewUtils";
import { getTimestamp } from "@/types/time";

interface ReviewEditViewProps {
  review: ReviewModel;
  rawReviews: Review[];
  rawTodos: Todo[];
  onBack: () => void;
  onSave: (id: ReviewId, updates: { title?: string; summary?: string }) => void;
  onComplete: (id: ReviewId) => void;
  onAddEntry: (reviewId: ReviewId, entry: ReviewEntry) => void;
  onUpdateEntry: (reviewId: ReviewId, entryIndex: number, updates: Partial<ReviewTaskEntry | ReviewChildEntry>) => void;
  onRemoveEntry: (reviewId: ReviewId, entryIndex: number) => void;
  onToggleEntryCollapsed: (reviewId: ReviewId, entryIndex: number) => void;
}

export function ReviewEditView({
  review,
  rawReviews,
  rawTodos,
  onBack,
  onSave,
  onComplete,
  onAddEntry,
  onUpdateEntry,
  onRemoveEntry,
  onToggleEntryCollapsed,
}: ReviewEditViewProps) {
  const [title, setTitle] = useState(review.title);
  const [summary, setSummary] = useState(review.summary);

  // Get completed tasks in this period
  const completedTasks = useMemo(() => {
    return getCompletedTasksInPeriod(rawTodos, review.periodStart, review.periodEnd);
  }, [rawTodos, review.periodStart, review.periodEnd]);

  // Get child reviews in this period
  const childLevel = getChildLevel(review.level);
  const childReviews = useMemo(() => {
    if (!childLevel) return [];
    return getChildReviewsForPeriod(rawReviews, childLevel, review.periodStart, review.periodEnd);
  }, [rawReviews, childLevel, review.periodStart, review.periodEnd]);

  // Get tasks not yet in the review
  const availableTasks = useMemo(() => {
    const existingTodoIds = new Set(
      review.entries
        .filter((e): e is ReviewTaskEntry => e.type === "task")
        .map((e) => e.todoId)
    );
    return completedTasks.filter((t) => !existingTodoIds.has(t.id));
  }, [completedTasks, review.entries]);

  // Get child reviews not yet in the review
  const availableChildReviews = useMemo(() => {
    const existingReviewIds = new Set(
      review.entries
        .filter((e): e is ReviewChildEntry => e.type === "review")
        .map((e) => e.reviewId)
    );
    return childReviews.filter((r) => !existingReviewIds.has(r.id) && r.state === "completed");
  }, [childReviews, review.entries]);

  // Handle save
  const handleSave = useCallback(() => {
    if (title !== review.title || summary !== review.summary) {
      onSave(review.id, { title, summary });
    }
  }, [review.id, review.title, review.summary, title, summary, onSave]);

  // Handle complete
  const handleComplete = useCallback(() => {
    handleSave();
    onComplete(review.id);
  }, [handleSave, onComplete, review.id]);

  // Add a task entry
  const handleAddTask = useCallback(
    (todo: Todo) => {
      const entry: ReviewTaskEntry = {
        type: "task",
        todoId: todo.id,
        title: todo.plainText,
        completedAt: todo.completedAt || getTimestamp(Date.now()),
        content: "",
        collapsed: false,
      };
      onAddEntry(review.id, entry);
    },
    [review.id, onAddEntry]
  );

  // Add all available tasks
  const handleAddAllTasks = useCallback(() => {
    for (const todo of availableTasks) {
      handleAddTask(todo);
    }
  }, [availableTasks, handleAddTask]);

  // Add a child review entry
  const handleAddChildReview = useCallback(
    (childReview: Review) => {
      const entry: ReviewChildEntry = {
        type: "review",
        reviewId: childReview.id,
        title: childReview.title,
        level: childReview.level,
        content: childReview.summary,
        collapsed: true,
      };
      onAddEntry(review.id, entry);
    },
    [review.id, onAddEntry]
  );

  // Add all available child reviews
  const handleAddAllChildReviews = useCallback(() => {
    for (const childReview of availableChildReviews) {
      handleAddChildReview(childReview);
    }
  }, [availableChildReviews, handleAddChildReview]);

  // Update entry content
  const handleUpdateEntryContent = useCallback(
    (index: number, content: string) => {
      onUpdateEntry(review.id, index, { content });
    },
    [review.id, onUpdateEntry]
  );

  // Remove entry
  const handleRemoveEntry = useCallback(
    (index: number) => {
      onRemoveEntry(review.id, index);
    },
    [review.id, onRemoveEntry]
  );

  // Toggle entry collapsed
  const handleToggleCollapsed = useCallback(
    (index: number) => {
      onToggleEntryCollapsed(review.id, index);
    },
    [review.id, onToggleEntryCollapsed]
  );

  // Strip HTML tags for safe display
  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, "").trim();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="Back to reviews"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              Draft
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {review.levelDisplayLabel} Review
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {review.periodLabel}
          </h1>
        </div>
        <button
          onClick={handleComplete}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <CheckIcon className="w-4 h-4" />
          Complete Review
        </button>
      </div>

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Review title..."
        />
      </div>

      {/* Summary */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Summary
        </label>
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
          <RichTextEditor
            value={summary}
            onChange={setSummary}
            onBlur={handleSave}
            placeholder="Write a summary of this period..."
            minHeight="150px"
          />
        </div>
      </div>

      {/* Available Items to Add */}
      {(availableTasks.length > 0 || availableChildReviews.length > 0) && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
            Available to Add
          </h3>

          {/* Child reviews to add */}
          {availableChildReviews.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {availableChildReviews.length} completed {childLevel} review{availableChildReviews.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={handleAddAllChildReviews}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Add all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableChildReviews.map((childReview) => (
                  <button
                    key={childReview.id}
                    onClick={() => handleAddChildReview(childReview)}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <PlusIcon className="w-3 h-3" />
                    {childReview.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks to add */}
          {availableTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {availableTasks.length} completed task{availableTasks.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={handleAddAllTasks}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Add all
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableTasks.slice(0, 20).map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => handleAddTask(todo)}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors truncate max-w-xs"
                    title={todo.plainText}
                  >
                    <PlusIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{todo.plainText}</span>
                  </button>
                ))}
                {availableTasks.length > 20 && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 px-2 py-1">
                    +{availableTasks.length - 20} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entries List */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
          Entries ({review.entryCount})
        </h3>

        {review.entries.length === 0 ? (
          <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400 mb-2">No entries yet</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Add completed tasks or child reviews to include in this review
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {review.entries.map((entry, index) => (
              <div
                key={`${entry.type}-${entry.type === "task" ? entry.todoId : entry.reviewId}-${index}`}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
              >
                {/* Entry header */}
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50">
                  <button
                    onClick={() => handleToggleCollapsed(index)}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                  >
                    {entry.collapsed ? (
                      <ChevronDownIcon className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronUpIcon className="w-4 h-4 text-zinc-500" />
                    )}
                  </button>

                  <span
                    className={`px-1.5 py-0.5 text-xs rounded ${
                      entry.type === "task"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    }`}
                  >
                    {entry.type === "task" ? "Task" : "Review"}
                  </span>

                  <span className="flex-1 font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {entry.title}
                  </span>

                  <button
                    onClick={() => handleRemoveEntry(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Remove from review"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Entry content (when expanded) */}
                {!entry.collapsed && (
                  <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
                    {entry.type === "review" && entry.content && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                        {stripHtml(entry.content)}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={entry.content}
                        onChange={(e) => handleUpdateEntryContent(index, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                        placeholder="Add notes about this item..."
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
