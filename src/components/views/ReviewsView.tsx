"use client";

import React, { useMemo, useState } from "react";
import { ReviewItem } from "@/components/items/ReviewItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { ChevronDownIcon, PlusIcon, CloseIcon } from "@/components/shared/Icons";
import { ReviewModel } from "@/models/ReviewModel";
import { ReviewId, ReviewLevel, Review } from "@/types/review";
import { Todo } from "@/types/todo";
import { TutorialStep } from "@/components/overlays/TutorialOverlay";
import { ReviewUndoAction } from "@/hooks/useReviews";
import { Weekday, Month } from "@/types/time";
import {
  PeriodInfo,
  getLastNDays,
  getLastNWeeks,
  getLastNMonths,
  getLastNYears,
  getCurrentHalfPeriod,
  getHalfPeriod,
  hasReviewForPeriod,
  getPeriodKey,
} from "@/utils/reviewUtils";

// Reviews View Tutorial Steps
export const reviewsViewTutorialSteps: TutorialStep[] = [
  {
    id: "reviews-intro",
    title: "Reviews View",
    description:
      "Reviews help you reflect on your accomplishments. Create weekly, monthly, half-year, or yearly summaries of your completed work.",
    position: "center",
  },
  {
    id: "reviews-add",
    title: "Add Reviews",
    description:
      'Click an "Add Review" button to create a review for a specific period. Reviews start as drafts that you can edit until you mark them complete.',
    position: "center",
  },
  {
    id: "reviews-periods",
    title: "Review Periods",
    description:
      "Reviews are organized by time period:\n\n- Weekly: Review recent tasks\n- Monthly: Includes weekly reviews\n- Half-yearly: Includes monthly reviews\n- Yearly: Full year summary",
    position: "center",
  },
  {
    id: "reviews-complete",
    title: "Complete Reviews",
    description:
      "When you're done editing a review, mark it as complete. Completed reviews become read-only and appear in parent reviews (e.g., weeks in months).",
    position: "center",
  },
];

interface ReviewsViewProps {
  reviews: ReviewModel[];
  rawReviews: Review[];
  todos: Todo[];
  workWeekStart: Weekday;
  fiscalYearStart: Month;
  onOpenReview: (reviewId: ReviewId) => void;
  onCreateReview: (level: ReviewLevel, periodStart: string, periodEnd: string, periodLabel: string) => void;
  onDeleteReview: (id: ReviewId) => void;
  onArchiveReview: (id: ReviewId) => void;
  onUnarchiveReview: (id: ReviewId) => void;
  onCompleteReview: (id: ReviewId) => void;
  // Undo
  undoActions?: ReviewUndoAction[];
  fadingOutIds?: Set<string>;
  undo?: (id: string) => void;
  dismissUndo?: (id: string) => void;
}

interface PeriodSection {
  title: string;
  periods: PeriodInfo[];
  level: ReviewLevel;
}

export function ReviewsView({
  reviews,
  rawReviews,
  workWeekStart,
  fiscalYearStart,
  onOpenReview,
  onCreateReview,
  onDeleteReview,
  onArchiveReview,
  onUnarchiveReview,
  onCompleteReview,
  undoActions = [],
  fadingOutIds = new Set(),
  undo = () => {},
  dismissUndo = () => {},
}: ReviewsViewProps) {
  // Section expanded states
  const [incompleteExpanded, setIncompleteExpanded] = useState(true);
  const [daysExpanded, setDaysExpanded] = useState(true);
  const [weeksExpanded, setWeeksExpanded] = useState(true);
  const [monthsExpanded, setMonthsExpanded] = useState(true);
  const [halvesExpanded, setHalvesExpanded] = useState(true);

  // Get periods for suggestions
  const dayPeriods = useMemo(() => getLastNDays(7), []);
  const weekPeriods = useMemo(() => getLastNWeeks(8, workWeekStart), [workWeekStart]);
  const monthPeriods = useMemo(() => getLastNMonths(6), []);
  const yearPeriods = useMemo(() => getLastNYears(3, fiscalYearStart), [fiscalYearStart]);

  // Get half periods
  const halfPeriods = useMemo(() => {
    const today = new Date();
    const halves: PeriodInfo[] = [];

    // Current half and previous 3
    halves.push(getCurrentHalfPeriod(fiscalYearStart));

    for (let i = 1; i <= 3; i++) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i * 6);
      halves.push(getHalfPeriod(d, fiscalYearStart));
    }

    // Remove duplicates by periodStart
    const seen = new Set<string>();
    return halves.filter(p => {
      if (seen.has(p.start)) return false;
      seen.add(p.start);
      return true;
    });
  }, [fiscalYearStart]);

  // Split reviews by state
  const incompleteReviews = useMemo(
    () => reviews.filter((r) => r.isPending),
    [reviews]
  );

  const completedReviews = useMemo(
    () => reviews.filter((r) => r.isCompleted || r.isArchived),
    [reviews]
  );

  // Get reviews by level
  const getReviewsForLevel = (level: ReviewLevel) => {
    return completedReviews.filter((r) => r.level === level);
  };

  // Get missing periods (periods without reviews)
  const getMissingPeriods = (periods: PeriodInfo[], level: ReviewLevel): PeriodInfo[] => {
    return periods.filter((period) => !hasReviewForPeriod(rawReviews, level, period.start));
  };

  // Build section data (currently for reference - may be used for future features)
  const _sections: PeriodSection[] = [
    { title: "Days", periods: dayPeriods, level: "day" },
    { title: "Weeks", periods: weekPeriods, level: "week" },
    { title: "Months", periods: monthPeriods, level: "month" },
    { title: "Halves & Years", periods: [...halfPeriods, ...yearPeriods], level: "half" },
  ];

  // Render period button (for creating new review)
  const renderAddPeriodButton = (period: PeriodInfo, level: ReviewLevel) => (
    <button
      key={getPeriodKey(level, period.start)}
      onClick={() => onCreateReview(level, period.start, period.end, period.label)}
      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800"
    >
      <PlusIcon className="w-4 h-4" />
      Add {period.label}
    </button>
  );

  // Render review item
  const renderReviewItem = (review: ReviewModel) => (
    <ReviewItem
      key={review.id}
      review={review}
      onClick={() => onOpenReview(review.id)}
      onDelete={onDeleteReview}
      onArchive={onArchiveReview}
      onUnarchive={onUnarchiveReview}
      onComplete={onCompleteReview}
    />
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Reviews</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            {incompleteReviews.length > 0 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                ({incompleteReviews.length} draft{incompleteReviews.length !== 1 ? "s" : ""})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      {reviews.length === 0 && weekPeriods.length === 0 ? (
        <EmptyState
          emoji="📊"
          title="No Reviews"
          message="Start creating reviews to track your progress over time!"
        />
      ) : (
        <div className="space-y-6">
          {/* Incomplete Reviews Section */}
          {incompleteReviews.length > 0 && (
            <section className="bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
              <button
                onClick={() => setIncompleteExpanded(!incompleteExpanded)}
                className="w-full flex items-center justify-between text-left mb-3 group"
              >
                <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Drafts ({incompleteReviews.length})
                </h2>
                <ChevronDownIcon
                  className={`w-5 h-5 text-amber-600 dark:text-amber-500 transition-transform ${
                    incompleteExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              {incompleteExpanded && (
                <div className="space-y-2">
                  {incompleteReviews.map(renderReviewItem)}
                </div>
              )}
            </section>
          )}

          {/* Days Section */}
          <section>
            <button
              onClick={() => setDaysExpanded(!daysExpanded)}
              className="w-full flex items-center justify-between text-left mb-3 group"
            >
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Days ({getReviewsForLevel("day").length})
              </h2>
              <ChevronDownIcon
                className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                  daysExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {daysExpanded && (
              <div className="space-y-3">
                {/* Add buttons for missing periods */}
                {getMissingPeriods(dayPeriods.slice(0, 3), "day").length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {getMissingPeriods(dayPeriods.slice(0, 3), "day").map((period) =>
                      renderAddPeriodButton(period, "day")
                    )}
                  </div>
                )}
                {/* Existing reviews */}
                {getReviewsForLevel("day").length > 0 ? (
                  <div className="space-y-2">
                    {getReviewsForLevel("day").map(renderReviewItem)}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                    No daily reviews yet
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Weeks Section */}
          <section>
            <button
              onClick={() => setWeeksExpanded(!weeksExpanded)}
              className="w-full flex items-center justify-between text-left mb-3 group"
            >
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Weeks ({getReviewsForLevel("week").length})
              </h2>
              <ChevronDownIcon
                className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                  weeksExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {weeksExpanded && (
              <div className="space-y-3">
                {/* Add buttons for missing periods */}
                {getMissingPeriods(weekPeriods.slice(0, 4), "week").length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {getMissingPeriods(weekPeriods.slice(0, 4), "week").map((period) =>
                      renderAddPeriodButton(period, "week")
                    )}
                  </div>
                )}
                {/* Existing reviews */}
                {getReviewsForLevel("week").length > 0 ? (
                  <div className="space-y-2">
                    {getReviewsForLevel("week").map(renderReviewItem)}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                    No weekly reviews yet
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Months Section */}
          <section>
            <button
              onClick={() => setMonthsExpanded(!monthsExpanded)}
              className="w-full flex items-center justify-between text-left mb-3 group"
            >
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Months ({getReviewsForLevel("month").length})
              </h2>
              <ChevronDownIcon
                className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                  monthsExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {monthsExpanded && (
              <div className="space-y-3">
                {/* Add buttons for missing periods */}
                {getMissingPeriods(monthPeriods.slice(0, 3), "month").length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {getMissingPeriods(monthPeriods.slice(0, 3), "month").map((period) =>
                      renderAddPeriodButton(period, "month")
                    )}
                  </div>
                )}
                {/* Existing reviews */}
                {getReviewsForLevel("month").length > 0 ? (
                  <div className="space-y-2">
                    {getReviewsForLevel("month").map(renderReviewItem)}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                    No monthly reviews yet
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Halves & Years Section */}
          <section>
            <button
              onClick={() => setHalvesExpanded(!halvesExpanded)}
              className="w-full flex items-center justify-between text-left mb-3 group"
            >
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Halves & Years ({getReviewsForLevel("half").length + getReviewsForLevel("year").length})
              </h2>
              <ChevronDownIcon
                className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                  halvesExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {halvesExpanded && (
              <div className="space-y-3">
                {/* Add buttons for missing periods */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {getMissingPeriods(halfPeriods.slice(0, 2), "half").map((period) =>
                    renderAddPeriodButton(period, "half")
                  )}
                  {getMissingPeriods(yearPeriods.slice(0, 2), "year").map((period) =>
                    renderAddPeriodButton(period, "year")
                  )}
                </div>
                {/* Existing reviews */}
                {getReviewsForLevel("half").length + getReviewsForLevel("year").length > 0 ? (
                  <div className="space-y-2">
                    {getReviewsForLevel("half").map(renderReviewItem)}
                    {getReviewsForLevel("year").map(renderReviewItem)}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                    No half-year or yearly reviews yet
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Undo Notifications */}
      {undoActions.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col-reverse gap-2">
          {undoActions.map((action) => (
            <div
              key={action.id}
              className={`transition-opacity duration-3000 ${
                fadingOutIds.has(action.id) ? "opacity-0" : "opacity-100 animate-slide-up"
              }`}
            >
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-3 min-w-[280px]">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {action.type === "delete" && "Review deleted"}
                    {action.type === "archive" && "Review archived"}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 truncate max-w-[180px]">
                    {action.review.title}
                  </p>
                </div>
                <button
                  onClick={() => undo(action.id)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md font-medium transition-colors flex-shrink-0"
                >
                  Undo
                </button>
                <button
                  onClick={() => dismissUndo(action.id)}
                  className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
