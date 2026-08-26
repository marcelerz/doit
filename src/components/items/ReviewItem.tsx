"use client";

import { useRef, useState } from "react";
import { ReviewModel } from "@/models/ReviewModel";
import { ReviewId } from "@/types/review";
import {
  ArchiveIcon,
  TrashIcon,
  UndoIcon,
  CheckIcon,
  ChevronRightIcon,
  CalendarIcon,
} from "@/components/shared/Icons";

interface ReviewItemProps {
  review: ReviewModel;
  onClick: () => void;
  onDelete: (id: ReviewId) => void;
  onArchive?: (id: ReviewId) => void;
  onUnarchive?: (id: ReviewId) => void;
  onComplete?: (id: ReviewId) => void;
}

export function ReviewItem({
  review,
  onClick,
  onDelete,
  onArchive,
  onUnarchive,
  onComplete,
}: ReviewItemProps) {
  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeAction, setSwipeAction] = useState<"complete" | "archive" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe thresholds
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
    setSwipeAction(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStart.x;
    const diffY = currentY - touchStart.y;

    // If vertical scroll is larger, ignore horizontal swipe
    if (Math.abs(diffY) > Math.abs(diffX)) {
      setSwipeOffset(0);
      return;
    }

    // Clamp the offset
    const clampedOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diffX));
    setSwipeOffset(clampedOffset);

    // Determine action based on direction and threshold
    if (clampedOffset > SWIPE_THRESHOLD && review.isPending) {
      setSwipeAction("complete");
    } else if (clampedOffset < -SWIPE_THRESHOLD && review.isCompleted) {
      setSwipeAction("archive");
    } else {
      setSwipeAction(null);
    }
  };

  const handleTouchEnd = () => {
    if (swipeAction === "complete" && onComplete && review.isPending) {
      onComplete(review.id);
    } else if (swipeAction === "archive" && onArchive && review.isCompleted) {
      onArchive(review.id);
    }

    setTouchStart(null);
    setSwipeOffset(0);
    setSwipeAction(null);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(review.id);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive) {
      onArchive(review.id);
    }
  };

  const handleUnarchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnarchive) {
      onUnarchive(review.id);
    }
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onComplete && review.isPending) {
      onComplete(review.id);
    }
  };

  // Get level badge color
  const getLevelBadgeColor = (): string => {
    switch (review.level) {
      case "day":
        return "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300";
      case "week":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "month":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
      case "half":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
      case "year":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";
    }
  };

  // Get state badge
  const getStateBadge = () => {
    if (review.isPending) {
      return (
        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
          Draft
        </span>
      );
    }
    if (review.isCompleted) {
      return (
        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
          Complete
        </span>
      );
    }
    if (review.isArchived) {
      return (
        <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          Archived
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className="relative overflow-hidden"
      ref={containerRef}
      data-testid="review-item"
    >
      {/* Swipe action backgrounds */}
      {swipeOffset !== 0 && (
        <>
          {/* Right swipe - complete (for pending) */}
          {swipeOffset > 0 && review.isPending && (
            <div
              className={`absolute inset-y-0 left-0 flex items-center justify-start pl-4 transition-colors ${
                swipeAction === "complete" ? "bg-green-500" : "bg-green-300 dark:bg-green-800"
              }`}
              style={{ width: Math.abs(swipeOffset) }}
            >
              <CheckIcon className="w-6 h-6 text-white" />
            </div>
          )}
          {/* Left swipe - archive (for completed) */}
          {swipeOffset < 0 && review.isCompleted && (
            <div
              className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-colors ${
                swipeAction === "archive" ? "bg-amber-500" : "bg-amber-300 dark:bg-amber-800"
              }`}
              style={{ width: Math.abs(swipeOffset) }}
            >
              <ArchiveIcon className="w-6 h-6 text-white" />
            </div>
          )}
        </>
      )}

      {/* Main content */}
      <div
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 cursor-pointer transition-all hover:border-zinc-300 dark:hover:border-zinc-700 ${
          review.isArchived ? "opacity-60" : ""
        }`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: touchStart ? "none" : "transform 0.2s ease-out",
        }}
      >
        <div className="flex items-start gap-3">
          {/* Level badge */}
          <span className={`px-2 py-1 text-xs font-medium rounded ${getLevelBadgeColor()}`}>
            {review.levelShortLabel}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {review.title}
              </h3>
              {getStateBadge()}
            </div>

            {/* Period label */}
            <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{review.periodLabel}</span>
            </div>

            {/* Summary preview */}
            {review.hasContent && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2">
                {review.getSummaryPreview(100)}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              {review.taskCount > 0 && (
                <span>{review.taskCount} task{review.taskCount !== 1 ? "s" : ""}</span>
              )}
              {review.childReviewCount > 0 && (
                <span>{review.childReviewCount} review{review.childReviewCount !== 1 ? "s" : ""}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Complete button (for pending) */}
            {review.isPending && onComplete && (
              <button
                onClick={handleComplete}
                className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                title="Complete review"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
            )}

            {/* Archive button (for completed) */}
            {review.isCompleted && onArchive && (
              <button
                onClick={handleArchive}
                className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                title="Archive"
              >
                <ArchiveIcon className="w-4 h-4" />
              </button>
            )}

            {/* Unarchive button (for archived) */}
            {review.isArchived && onUnarchive && (
              <button
                onClick={handleUnarchive}
                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Unarchive"
              >
                <UndoIcon className="w-4 h-4" />
              </button>
            )}

            {/* Delete button */}
            <button
              onClick={handleDelete}
              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>

            {/* Open arrow */}
            <ChevronRightIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
