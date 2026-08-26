"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { ReviewItem } from "@/components/items/ReviewItem";
import { usePersistedViewOptions } from "@/hooks/usePersistedViewOptions";
import { STORAGE_KEYS } from "@/storage/storage";
import { EmptyState } from "@/components/shared/EmptyState";
import { UndoNotificationStack } from "@/components/shared/UndoNotificationStack";
import { PlusIcon, CalendarIcon } from "@/components/shared/Icons";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ReviewModel } from "@/models/ReviewModel";
import { ReviewId, ReviewLevel } from "@/types/review";
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
  getDayPeriod,
  getWeekPeriod,
  getMonthPeriod,
  toISODateString,
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
  // Section expanded states. Reviews was the only view whose options were not
  // persisted at all -- every section sprang back open on reload -- even though
  // STORAGE_KEYS.REVIEWS_VIEW_OPTIONS had been reserved for it and sat unused.
  const [reviewOptions, setReviewOptions] = usePersistedViewOptions(
    STORAGE_KEYS.REVIEWS_VIEW_OPTIONS,
    {
      incompleteExpanded: true,
      daysExpanded: true,
      weeksExpanded: true,
      monthsExpanded: true,
      halvesExpanded: true,
    },
  );
  const { incompleteExpanded, daysExpanded, weeksExpanded, monthsExpanded, halvesExpanded } = reviewOptions;
  const setIncompleteExpanded = useCallback(
    (value: boolean) => setReviewOptions({ incompleteExpanded: value }),
    [setReviewOptions],
  );
  const setDaysExpanded = useCallback((value: boolean) => setReviewOptions({ daysExpanded: value }), [setReviewOptions]);
  const setWeeksExpanded = useCallback(
    (value: boolean) => setReviewOptions({ weeksExpanded: value }),
    [setReviewOptions],
  );
  const setMonthsExpanded = useCallback(
    (value: boolean) => setReviewOptions({ monthsExpanded: value }),
    [setReviewOptions],
  );
  const setHalvesExpanded = useCallback(
    (value: boolean) => setReviewOptions({ halvesExpanded: value }),
    [setReviewOptions],
  );

  // Custom date picker states
  const [customDatePickerOpen, setCustomDatePickerOpen] = useState<"day" | "week" | "month" | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  useClickOutside(datePickerRef, () => setCustomDatePickerOpen(null), customDatePickerOpen !== null);

  // Handle custom date selection
  const handleCustomDateSelect = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00"); // Use noon to avoid timezone issues

    if (customDatePickerOpen === "day") {
      const period = getDayPeriod(date);
      onCreateReview("day", period.start, period.end, period.label);
    } else if (customDatePickerOpen === "week") {
      const period = getWeekPeriod(date, workWeekStart);
      onCreateReview("week", period.start, period.end, period.label);
    } else if (customDatePickerOpen === "month") {
      const period = getMonthPeriod(date);
      onCreateReview("month", period.start, period.end, period.label);
    }

    setCustomDatePickerOpen(null);
  };

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
    return periods.filter((period) => !hasReviewForPeriod(reviews, level, period.start));
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

  // Render custom date picker button
  const renderCustomDateButton = (type: "day" | "week" | "month") => {
    const isOpen = customDatePickerOpen === type;
    const today = toISODateString(new Date());

    const getHelpText = () => {
      if (type === "day") return "Select a date:";
      if (type === "week") return "Select any date in the week:";
      return "Select any date in the month:";
    };

    return (
      <div className="relative" ref={isOpen ? datePickerRef : undefined}>
        <button
          onClick={() => setCustomDatePickerOpen(isOpen ? null : type)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-300 dark:border-zinc-600"
        >
          <CalendarIcon className="w-4 h-4" />
          Other {type}...
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              {getHelpText()}
            </p>
            <input
              type="date"
              max={today}
              autoFocus
              onChange={(e) => {
                if (e.target.value) {
                  handleCustomDateSelect(e.target.value);
                }
              }}
              className="block w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    );
  };

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
            <SectionHeader
              title="Drafts"
              count={incompleteReviews.length}
              expanded={incompleteExpanded}
              onToggle={() => setIncompleteExpanded(!incompleteExpanded)}
              variant="highlight"
            >
              <div className="space-y-2">
                {incompleteReviews.map(renderReviewItem)}
              </div>
            </SectionHeader>
          )}

          {/* Days Section */}
          <SectionHeader
            title="Days"
            count={getReviewsForLevel("day").length}
            expanded={daysExpanded}
            onToggle={() => setDaysExpanded(!daysExpanded)}
          >
            <div className="space-y-3">
              {/* Add buttons for missing periods */}
              <div className="flex flex-wrap gap-2 mb-3">
                {getMissingPeriods(dayPeriods.slice(0, 3), "day").map((period) =>
                  renderAddPeriodButton(period, "day")
                )}
                {renderCustomDateButton("day")}
              </div>
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
          </SectionHeader>

          {/* Weeks Section */}
          <SectionHeader
            title="Weeks"
            count={getReviewsForLevel("week").length}
            expanded={weeksExpanded}
            onToggle={() => setWeeksExpanded(!weeksExpanded)}
          >
            <div className="space-y-3">
              {/* Add buttons for missing periods */}
              <div className="flex flex-wrap gap-2 mb-3">
                {getMissingPeriods(weekPeriods.slice(0, 4), "week").map((period) =>
                  renderAddPeriodButton(period, "week")
                )}
                {renderCustomDateButton("week")}
              </div>
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
          </SectionHeader>

          {/* Months Section */}
          <SectionHeader
            title="Months"
            count={getReviewsForLevel("month").length}
            expanded={monthsExpanded}
            onToggle={() => setMonthsExpanded(!monthsExpanded)}
          >
            <div className="space-y-3">
              {/* Add buttons for missing periods */}
              <div className="flex flex-wrap gap-2 mb-3">
                {getMissingPeriods(monthPeriods.slice(0, 3), "month").map((period) =>
                  renderAddPeriodButton(period, "month")
                )}
                {renderCustomDateButton("month")}
              </div>
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
          </SectionHeader>

          {/* Halves & Years Section */}
          <SectionHeader
            title="Halves & Years"
            count={getReviewsForLevel("half").length + getReviewsForLevel("year").length}
            expanded={halvesExpanded}
            onToggle={() => setHalvesExpanded(!halvesExpanded)}
          >
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
          </SectionHeader>
        </div>
      )}

      {/* Undo Notifications */}
      <UndoNotificationStack
        actions={undoActions.map((a) => ({
          id: a.id,
          type: a.type,
          displayText: a.entity.title,
        }))}
        fadingOutIds={fadingOutIds}
        onUndo={undo}
        onDismiss={dismissUndo}
        getMessage={(type) => {
          if (type === "delete") return "Review deleted";
          if (type === "archive") return "Review archived";
          return "Action completed";
        }}
      />
    </>
  );
}
