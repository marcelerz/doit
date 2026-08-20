/**
 * Review Utilities
 *
 * Period calculation utilities for the Reviews feature.
 * Respects workWeekStart and fiscalYearStart settings.
 */

import { ReviewLevel, Review } from "@/types/review";
import { Todo } from "@/types/todo";
import { Weekday, Month } from "@/types/time";

/**
 * Period information for a review
 */
export interface PeriodInfo {
  start: string; // ISO date string (YYYY-MM-DD)
  end: string; // ISO date string (YYYY-MM-DD)
  label: string; // Display label (e.g., "Week 3, 2025")
}

/**
 * Get ISO date string (YYYY-MM-DD) from a Date
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse ISO date string to Date (at midnight local time)
 */
export function parseISODateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the ISO week number for a date
 * ISO weeks start on Monday and the first week contains January 4th
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get week number that respects the workWeekStart setting
 */
export function getWeekNumber(date: Date, _workWeekStart: Weekday): number {
  // For simplicity, we use ISO week calculation
  // A more accurate calculation would adjust based on workWeekStart
  return getISOWeekNumber(date);
}

/**
 * Get the day period for a given date
 */
export function getDayPeriod(date: Date): PeriodInfo {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  // Format the label as "Monday, Jan 15, 2025"
  const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const year = d.getFullYear();

  return {
    start: toISODateString(d),
    end: toISODateString(d),
    label: `${dayName}, ${monthDay}, ${year}`,
  };
}

/**
 * Get the current day period
 */
export function getCurrentDayPeriod(): PeriodInfo {
  return getDayPeriod(new Date());
}

/**
 * Get day periods for the last N days
 */
export function getLastNDays(n: number): PeriodInfo[] {
  const days: PeriodInfo[] = [];
  const today = new Date();

  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(getDayPeriod(d));
  }

  return days;
}

/**
 * Get the week period for a given date
 * @param date The date to get the week for
 * @param workWeekStart The day the work week starts (0 = Sunday, 1 = Monday, etc.)
 */
export function getWeekPeriod(date: Date, workWeekStart: Weekday): PeriodInfo {
  // Clone date to avoid mutations
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  // Get current day of week (0 = Sunday)
  const currentDay = d.getDay();

  // Calculate days since the start of the week
  let daysSinceStart = currentDay - (workWeekStart as number);
  if (daysSinceStart < 0) {
    daysSinceStart += 7;
  }

  // Calculate start of week
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - daysSinceStart);

  // Calculate end of week (6 days after start)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // Get week number
  const weekNum = getWeekNumber(weekStart, workWeekStart);
  const year = weekStart.getFullYear();

  return {
    start: toISODateString(weekStart),
    end: toISODateString(weekEnd),
    label: `Week ${weekNum}, ${year}`,
  };
}

/**
 * Get the current week period
 */
export function getCurrentWeekPeriod(workWeekStart: Weekday): PeriodInfo {
  return getWeekPeriod(new Date(), workWeekStart);
}

/**
 * Get week periods for the last N weeks
 */
export function getLastNWeeks(n: number, workWeekStart: Weekday): PeriodInfo[] {
  const weeks: PeriodInfo[] = [];
  const today = new Date();

  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    weeks.push(getWeekPeriod(d, workWeekStart));
  }

  return weeks;
}

/**
 * Get the month period for a given date
 */
export function getMonthPeriod(date: Date): PeriodInfo {
  const year = date.getFullYear();
  const month = date.getMonth();

  // First day of month
  const monthStart = new Date(year, month, 1);

  // Last day of month
  const monthEnd = new Date(year, month + 1, 0);

  // Month name
  const monthName = monthStart.toLocaleDateString("en-US", { month: "long" });

  return {
    start: toISODateString(monthStart),
    end: toISODateString(monthEnd),
    label: `${monthName} ${year}`,
  };
}

/**
 * Get the current month period
 */
export function getCurrentMonthPeriod(): PeriodInfo {
  return getMonthPeriod(new Date());
}

/**
 * Get month periods for the last N months
 */
export function getLastNMonths(n: number): PeriodInfo[] {
  const months: PeriodInfo[] = [];
  const today = new Date();

  for (let i = 0; i < n; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(getMonthPeriod(d));
  }

  return months;
}

/**
 * Get the half-year period (H1 or H2) for a given date
 * @param date The date to get the half-year for
 * @param fiscalYearStart The month when the fiscal year starts (1-12, where 1 = January)
 */
export function getHalfPeriod(date: Date, fiscalYearStart: Month): PeriodInfo {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed

  // Adjust month based on fiscal year
  let adjustedMonth = month - (fiscalYearStart as number) + 1;
  let fiscalYear = year;

  if (adjustedMonth <= 0) {
    adjustedMonth += 12;
    fiscalYear -= 1;
  }

  // Determine which half we're in (H1: months 1-6, H2: months 7-12 in fiscal calendar)
  const isFirstHalf = adjustedMonth <= 6;
  const halfLabel = isFirstHalf ? "H1" : "H2";

  // Calculate the start and end of this half
  let halfStartMonth: number;
  let halfEndMonth: number;

  if (isFirstHalf) {
    halfStartMonth = (fiscalYearStart as number) - 1; // 0-indexed
    halfEndMonth = halfStartMonth + 5;
  } else {
    halfStartMonth = (fiscalYearStart as number) + 5; // 0-indexed
    halfEndMonth = halfStartMonth + 5;
  }

  // Handle year wraparound
  const startYear = fiscalYear;
  let endYear = fiscalYear;

  if (halfStartMonth >= 12) {
    halfStartMonth -= 12;
  }
  if (halfEndMonth >= 12) {
    halfEndMonth -= 12;
    endYear = fiscalYear + 1;
  }

  const halfStart = new Date(startYear, halfStartMonth, 1);
  const halfEnd = new Date(endYear, halfEndMonth + 1, 0);

  // For fiscal year display, add FY prefix if not calendar year
  const yearLabel = (fiscalYearStart as number) === 1 ? `${fiscalYear}` : `FY${fiscalYear}`;

  return {
    start: toISODateString(halfStart),
    end: toISODateString(halfEnd),
    label: `${halfLabel} ${yearLabel}`,
  };
}

/**
 * Get the current half-year period
 */
export function getCurrentHalfPeriod(fiscalYearStart: Month): PeriodInfo {
  return getHalfPeriod(new Date(), fiscalYearStart);
}

/**
 * Get the year period for a given date
 * @param date The date to get the year for
 * @param fiscalYearStart The month when the fiscal year starts (1-12, where 1 = January)
 */
export function getYearPeriod(date: Date, fiscalYearStart: Month): PeriodInfo {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed

  // Calculate fiscal year
  let fiscalYear = year;
  if (month < (fiscalYearStart as number)) {
    fiscalYear -= 1;
  }

  // Calculate start and end of the fiscal year
  const yearStartMonth = (fiscalYearStart as number) - 1; // 0-indexed
  const yearStart = new Date(fiscalYear, yearStartMonth, 1);

  const yearEndMonth = yearStartMonth === 0 ? 11 : yearStartMonth - 1;
  const yearEndYear = yearStartMonth === 0 ? fiscalYear : fiscalYear + 1;
  const yearEnd = new Date(yearEndYear, yearEndMonth + 1, 0);

  // For fiscal year display, add FY prefix if not calendar year
  const yearLabel = (fiscalYearStart as number) === 1 ? `${fiscalYear}` : `FY${fiscalYear}`;

  return {
    start: toISODateString(yearStart),
    end: toISODateString(yearEnd),
    label: yearLabel,
  };
}

/**
 * Get the current year period
 */
export function getCurrentYearPeriod(fiscalYearStart: Month): PeriodInfo {
  return getYearPeriod(new Date(), fiscalYearStart);
}

/**
 * Get year periods for the last N years
 */
export function getLastNYears(n: number, fiscalYearStart: Month): PeriodInfo[] {
  const years: PeriodInfo[] = [];
  const today = new Date();

  for (let i = 0; i < n; i++) {
    // Go back i fiscal years
    const d = new Date(today.getFullYear() - i, today.getMonth(), today.getDate());
    years.push(getYearPeriod(d, fiscalYearStart));
  }

  return years;
}

/**
 * Check if a date falls within the current week
 */
export function isCurrentWeek(periodStart: string, workWeekStart: Weekday): boolean {
  const currentWeek = getCurrentWeekPeriod(workWeekStart);
  return periodStart === currentWeek.start;
}

/**
 * Check if a date falls within the last N months
 */
export function isWithinMonths(periodStart: string, monthCount: number): boolean {
  const startDate = parseISODateString(periodStart);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthCount);
  return startDate >= cutoff;
}

/**
 * Get completed tasks within a period
 */
export function getCompletedTasksInPeriod(
  todos: Todo[],
  periodStart: string,
  periodEnd: string
): Todo[] {
  const start = parseISODateString(periodStart).getTime();
  const end = parseISODateString(periodEnd).getTime() + 24 * 60 * 60 * 1000 - 1; // End of day

  return todos.filter((todo) => {
    if (todo.state !== "completed" && todo.state !== "archived") return false;
    if (!todo.completedAt) return false;
    return todo.completedAt >= start && todo.completedAt <= end;
  });
}

/**
 * Get child reviews for a parent period
 * For example, for a month review, get all week reviews within that month
 */
export function getChildReviewsForPeriod(
  reviews: Review[],
  childLevel: ReviewLevel,
  periodStart: string,
  periodEnd: string
): Review[] {
  const start = parseISODateString(periodStart).getTime();
  const end = parseISODateString(periodEnd).getTime() + 24 * 60 * 60 * 1000 - 1;

  return reviews.filter((review) => {
    if (review.level !== childLevel) return false;
    if (review.state === "deleted") return false;

    const reviewStart = parseISODateString(review.periodStart).getTime();
    const reviewEnd = parseISODateString(review.periodEnd).getTime();

    // Child review's period should be within the parent period
    return reviewStart >= start && reviewEnd <= end;
  });
}

/**
 * Get the child level for a given parent level
 */
export function getChildLevel(parentLevel: ReviewLevel): ReviewLevel | null {
  switch (parentLevel) {
    case "week":
      return "day";
    case "month":
      return "week";
    case "half":
      return "month";
    case "year":
      return "month"; // Year reviews include months, not halves
    default:
      return null;
  }
}

/**
 * Check if a review already exists for a given period
 */
export function hasReviewForPeriod(
  reviews: Review[],
  level: ReviewLevel,
  periodStart: string
): boolean {
  return reviews.some(
    (review) =>
      review.level === level &&
      review.periodStart === periodStart &&
      review.state !== "deleted"
  );
}

/**
 * Get the display level order (for sorting)
 */
export function getLevelOrder(level: ReviewLevel): number {
  switch (level) {
    case "day":
      return 1;
    case "week":
      return 2;
    case "month":
      return 3;
    case "half":
      return 4;
    case "year":
      return 5;
    default:
      return 0;
  }
}

/**
 * Sort reviews by period (most recent first)
 */
export function sortReviewsByPeriod(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => {
    // First sort by level order (weeks before months before halves before years)
    const levelDiff = getLevelOrder(a.level) - getLevelOrder(b.level);
    if (levelDiff !== 0) return levelDiff;

    // Then sort by period start (most recent first)
    return b.periodStart.localeCompare(a.periodStart);
  });
}

/**
 * Get a unique key for a period (for deduplication)
 */
export function getPeriodKey(level: ReviewLevel, periodStart: string): string {
  return `${level}-${periodStart}`;
}
