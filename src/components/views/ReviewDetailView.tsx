"use client";

import React from "react";
import { ReviewModel } from "@/models/ReviewModel";
import { ReviewId, ReviewTaskEntry, ReviewChildEntry } from "@/types/review";
import {
  ArrowLeftIcon,
  ArchiveIcon,
  TrashIcon,
  UndoIcon,
  CheckCircleIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@/components/shared/Icons";

interface ReviewDetailViewProps {
  review: ReviewModel;
  onBack: () => void;
  onDelete: (id: ReviewId) => void;
  onArchive?: (id: ReviewId) => void;
  onUnarchive?: (id: ReviewId) => void;
  onOpenTodo?: (todoId: string) => void;
  onOpenChildReview?: (reviewId: string) => void;
  onToggleEntryCollapsed: (reviewId: ReviewId, entryIndex: number) => void;
}

export function ReviewDetailView({
  review,
  onBack,
  onDelete,
  onArchive,
  onUnarchive,
  onOpenTodo,
  onOpenChildReview,
  onToggleEntryCollapsed,
}: ReviewDetailViewProps) {
  // Get state badge
  const getStateBadge = () => {
    if (review.isCompleted) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
          <CheckCircleIcon className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    }
    if (review.isArchived) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          <ArchiveIcon className="w-3.5 h-3.5" />
          Archived
        </span>
      );
    }
    return null;
  };

  // Handle toggle entry collapsed
  const handleToggleCollapsed = (index: number) => {
    onToggleEntryCollapsed(review.id, index);
  };

  // Handle click on task entry
  const handleTaskClick = (entry: ReviewTaskEntry) => {
    if (onOpenTodo) {
      onOpenTodo(entry.todoId);
    }
  };

  // Handle click on review entry
  const handleReviewClick = (entry: ReviewChildEntry) => {
    if (onOpenChildReview) {
      onOpenChildReview(entry.reviewId);
    }
  };

  // Strip HTML tags for safe display
  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, "").trim();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors mt-1"
          title="Back to reviews"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getStateBadge()}
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {review.levelDisplayLabel} Review
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {review.title}
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            <CalendarIcon className="w-4 h-4" />
            <span>{review.periodLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review.isCompleted && onArchive && (
            <button
              onClick={() => onArchive(review.id)}
              className="flex items-center gap-2 px-3 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
              title="Archive review"
            >
              <ArchiveIcon className="w-4 h-4" />
              Archive
            </button>
          )}
          {review.isArchived && onUnarchive && (
            <button
              onClick={() => onUnarchive(review.id)}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Unarchive review"
            >
              <UndoIcon className="w-4 h-4" />
              Unarchive
            </button>
          )}
          <button
            onClick={() => onDelete(review.id)}
            className="flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete review"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="mb-6 flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        {review.completedAt && (
          <span>Completed: {review.completedDateDisplay}</span>
        )}
        <span>{review.taskCount} task{review.taskCount !== 1 ? "s" : ""}</span>
        {review.childReviewCount > 0 && (
          <span>{review.childReviewCount} child review{review.childReviewCount !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Summary */}
      {review.hasContent && (
        <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Summary
          </h2>
          <div className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
            {stripHtml(review.summary)}
          </div>
        </div>
      )}

      {/* Entries */}
      {review.hasEntries && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Entries ({review.entryCount})
          </h2>
          <div className="space-y-2">
            {review.entries.map((entry, index) => (
              <div
                key={`${entry.type}-${entry.type === "task" ? entry.todoId : entry.reviewId}-${index}`}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
              >
                {/* Entry header */}
                <div
                  className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => handleToggleCollapsed(index)}
                >
                  <button className="p-1">
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

                  {entry.type === "task" && onOpenTodo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(entry);
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View task
                    </button>
                  )}
                  {entry.type === "review" && onOpenChildReview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReviewClick(entry);
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View review
                    </button>
                  )}
                </div>

                {/* Entry content (when expanded) */}
                {!entry.collapsed && entry.content && (
                  <div className="px-3 pb-3 pt-0 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="ml-8 mt-2 text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                      {entry.type === "review" ? stripHtml(entry.content) : entry.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects and Tags */}
      {(review.projectIds.length > 0 || review.tagIds.length > 0) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {review.projects.map((project, index) => (
            <span
              key={`project-${index}`}
              className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
            >
              %{project}
            </span>
          ))}
          {review.tags.map((tag, index) => (
            <span
              key={`tag-${index}`}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Activity */}
      {review.hasActivity && (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Activity
          </h2>
          <div className="space-y-2 text-sm">
            {review.activity.slice(-5).reverse().map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400"
              >
                <span className="text-xs text-zinc-400 dark:text-zinc-500 min-w-[100px]">
                  {new Date(entry.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>{entry.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
