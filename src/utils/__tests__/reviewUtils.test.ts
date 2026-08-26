import {
  toISODateString,
  parseISODateString,
  getISOWeekNumber,
  getWeekNumber,
  getDayPeriod,
  getWeekPeriod,
  getMonthPeriod,
  getHalfPeriod,
  getYearPeriod,
  getLastNDays,
  getLastNWeeks,
  getLastNMonths,
  getLastNYears,
  isCurrentWeek,
  isWithinMonths,
  getCompletedTasksInPeriod,
  getChildLevel,
  hasReviewForPeriod,
  getLevelOrder,
  sortReviewsByPeriod,
  getPeriodKey,
} from "../reviewUtils";
import { getWeekday, getMonth, getTimestamp } from "@/types/time";
import { Review } from "@/types/review";

const MONDAY = getWeekday(1);
const SUNDAY = getWeekday(0);
const JANUARY = getMonth(1);
const APRIL = getMonth(4);
const JULY = getMonth(7);

describe("toISODateString", () => {
  it("formats a date in local time, not UTC", () => {
    // 23:30 local on the 15th must stay the 15th. Going through toISOString
    // would roll it to the 16th anywhere east of UTC.
    expect(toISODateString(new Date(2026, 0, 15, 23, 30))).toBe("2026-01-15");
  });

  it("zero-pads month and day", () => {
    expect(toISODateString(new Date(2026, 8, 5))).toBe("2026-09-05");
  });
});

describe("parseISODateString", () => {
  it("round-trips with toISODateString", () => {
    expect(toISODateString(parseISODateString("2026-03-09"))).toBe("2026-03-09");
  });

  it("parses as a local date rather than UTC midnight", () => {
    const parsed = parseISODateString("2026-03-09");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(9);
  });
});

describe("getISOWeekNumber", () => {
  it("counts the week containing the first Thursday as week 1", () => {
    // 2026-01-01 is a Thursday, so that week is ISO week 1.
    expect(getISOWeekNumber(new Date(2026, 0, 1))).toBe(1);
  });

  it("assigns late-December days to week 1 of the next year when they belong to it", () => {
    // 2025-12-29 is the Monday of the week whose Thursday is 2026-01-01.
    expect(getISOWeekNumber(new Date(2025, 11, 29))).toBe(1);
  });

  it("getWeekNumber delegates to the ISO calculation regardless of work-week start", () => {
    const date = new Date(2026, 5, 10);
    expect(getWeekNumber(date, MONDAY)).toBe(getISOWeekNumber(date));
    expect(getWeekNumber(date, SUNDAY)).toBe(getISOWeekNumber(date));
  });
});

describe("getDayPeriod", () => {
  it("starts and ends on the same day", () => {
    const period = getDayPeriod(new Date(2026, 0, 15, 14, 30));
    expect(period.start).toBe("2026-01-15");
    expect(period.end).toBe("2026-01-15");
  });

  it("labels the weekday and date", () => {
    expect(getDayPeriod(new Date(2026, 0, 15)).label).toBe("Thursday, Jan 15, 2026");
  });
});

describe("getWeekPeriod", () => {
  it("spans seven days from the configured week start", () => {
    // 2026-01-15 is a Thursday.
    const period = getWeekPeriod(new Date(2026, 0, 15), MONDAY);
    expect(period.start).toBe("2026-01-12");
    expect(period.end).toBe("2026-01-18");
  });

  it("honours a Sunday work-week start", () => {
    const period = getWeekPeriod(new Date(2026, 0, 15), SUNDAY);
    expect(period.start).toBe("2026-01-11");
    expect(period.end).toBe("2026-01-17");
  });

  it("does not mutate the date it was given", () => {
    const input = new Date(2026, 0, 15, 9, 0);
    const before = input.getTime();
    getWeekPeriod(input, MONDAY);
    expect(input.getTime()).toBe(before);
  });
});

describe("getMonthPeriod", () => {
  it("spans the whole calendar month", () => {
    const period = getMonthPeriod(new Date(2026, 1, 14));
    expect(period.start).toBe("2026-02-01");
    expect(period.end).toBe("2026-02-28");
  });

  it("handles a leap February", () => {
    expect(getMonthPeriod(new Date(2028, 1, 14)).end).toBe("2028-02-29");
  });
});

describe("getHalfPeriod", () => {
  it("splits a calendar year into two halves", () => {
    const h1 = getHalfPeriod(new Date(2026, 2, 10), JANUARY);
    expect(h1.start).toBe("2026-01-01");
    expect(h1.end).toBe("2026-06-30");
    expect(h1.label).toBe("H1 2026");

    const h2 = getHalfPeriod(new Date(2026, 8, 10), JANUARY);
    expect(h2.start).toBe("2026-07-01");
    expect(h2.end).toBe("2026-12-31");
    expect(h2.label).toBe("H2 2026");
  });

  it("shifts the halves for an April fiscal year", () => {
    const h1 = getHalfPeriod(new Date(2026, 4, 10), APRIL);
    expect(h1.start).toBe("2026-04-01");
    expect(h1.end).toBe("2026-09-30");
    expect(h1.label).toBe("H1 FY2026");
  });

  it("counts months before the fiscal start as the previous fiscal year", () => {
    // February with an April fiscal start falls in FY2025's second half.
    const period = getHalfPeriod(new Date(2026, 1, 15), APRIL);
    expect(period.label).toBe("H2 FY2025");
  });

  it("advances the start year when the half start wraps past December", () => {
    // fiscalYearStart 7 puts H2's start month at index 12, which wraps to 0 of
    // the next year. Only endYear used to advance, so the period ran from
    // January of the previous year -- eighteen months, pulling an extra twelve
    // months of completed tasks into the review.
    const period = getHalfPeriod(new Date(2027, 1, 15), JULY);
    expect(period.start).toBe("2027-01-01");
    expect(period.end).toBe("2027-06-30");
  });
});

describe("getYearPeriod", () => {
  it("covers a calendar year when the fiscal year starts in January", () => {
    const period = getYearPeriod(new Date(2026, 5, 1), JANUARY);
    expect(period.start).toBe("2026-01-01");
    expect(period.end).toBe("2026-12-31");
    expect(period.label).toContain("2026");
  });

  it("runs April to March for an April fiscal year", () => {
    const period = getYearPeriod(new Date(2026, 5, 1), APRIL);
    expect(period.start).toBe("2026-04-01");
    expect(period.end).toBe("2027-03-31");
  });

  it("puts months before the fiscal start in the previous fiscal year", () => {
    const period = getYearPeriod(new Date(2026, 1, 1), APRIL);
    expect(period.start).toBe("2025-04-01");
    expect(period.end).toBe("2026-03-31");
  });
});

describe("recent-period lists", () => {
  it("returns n days ending today, most recent first", () => {
    const days = getLastNDays(3);
    expect(days).toHaveLength(3);
    expect(days[0].start).toBe(toISODateString(new Date()));
    expect(new Date(days[0].start).getTime()).toBeGreaterThan(new Date(days[2].start).getTime());
  });

  it("returns n weeks, months and years", () => {
    expect(getLastNWeeks(4, MONDAY)).toHaveLength(4);
    expect(getLastNMonths(6)).toHaveLength(6);
    expect(getLastNYears(2, JANUARY)).toHaveLength(2);
  });

  it("produces non-overlapping consecutive months", () => {
    const months = getLastNMonths(3);
    for (let i = 0; i < months.length - 1; i++) {
      expect(months[i].start > months[i + 1].end).toBe(true);
    }
  });
});

describe("isCurrentWeek", () => {
  it("recognises the week containing today", () => {
    const thisWeek = getWeekPeriod(new Date(), MONDAY);
    expect(isCurrentWeek(thisWeek.start, MONDAY)).toBe(true);
  });

  it("rejects an older week", () => {
    expect(isCurrentWeek("2020-01-06", MONDAY)).toBe(false);
  });
});

describe("isWithinMonths", () => {
  it("accepts a period inside the window", () => {
    expect(isWithinMonths(toISODateString(new Date()), 3)).toBe(true);
  });

  it("rejects a period older than the window", () => {
    expect(isWithinMonths("2000-01-01", 3)).toBe(false);
  });
});

describe("getCompletedTasksInPeriod", () => {
  const at = (y: number, m: number, d: number, h = 12) => getTimestamp(new Date(y, m, d, h).getTime());

  const todos = [
    { state: "completed" as const, completedAt: at(2026, 0, 10) },
    { state: "archived" as const, completedAt: at(2026, 0, 15) },
    { state: "active" as const, completedAt: at(2026, 0, 12) },
    { state: "completed" as const, completedAt: at(2026, 1, 5) },
    { state: "completed" as const, completedAt: undefined },
  ];

  it("includes completed and archived todos inside the period", () => {
    const result = getCompletedTasksInPeriod(todos, "2026-01-01", "2026-01-31");
    expect(result).toHaveLength(2);
  });

  it("excludes todos that are neither completed nor archived", () => {
    const result = getCompletedTasksInPeriod(todos, "2026-01-01", "2026-01-31");
    expect(result.every((t) => t.state !== "active")).toBe(true);
  });

  it("excludes todos with no completion timestamp", () => {
    const result = getCompletedTasksInPeriod(todos, "2026-01-01", "2026-12-31");
    expect(result.every((t) => t.completedAt !== undefined)).toBe(true);
  });

  it("includes the whole of the final day", () => {
    const lateOnLastDay = [{ state: "completed" as const, completedAt: at(2026, 0, 31, 23) }];
    expect(getCompletedTasksInPeriod(lateOnLastDay, "2026-01-01", "2026-01-31")).toHaveLength(1);
  });
});

describe("getChildLevel", () => {
  it("steps down one level", () => {
    expect(getChildLevel("week")).toBe("day");
    expect(getChildLevel("month")).toBe("week");
    expect(getChildLevel("half")).toBe("month");
  });

  it("maps year to month, skipping halves", () => {
    expect(getChildLevel("year")).toBe("month");
  });

  it("returns null for the lowest level", () => {
    expect(getChildLevel("day")).toBeNull();
  });
});

describe("hasReviewForPeriod", () => {
  const reviews = [
    { level: "week" as const, periodStart: "2026-01-12", state: "pending" as const },
    { level: "week" as const, periodStart: "2026-01-19", state: "deleted" as const },
  ];

  it("finds a matching review", () => {
    expect(hasReviewForPeriod(reviews, "week", "2026-01-12")).toBe(true);
  });

  it("ignores deleted reviews", () => {
    expect(hasReviewForPeriod(reviews, "week", "2026-01-19")).toBe(false);
  });

  it("does not match a different level for the same period", () => {
    expect(hasReviewForPeriod(reviews, "month", "2026-01-12")).toBe(false);
  });
});

describe("getLevelOrder and sortReviewsByPeriod", () => {
  it("orders levels from smallest to largest span", () => {
    expect(getLevelOrder("day")).toBeLessThan(getLevelOrder("week"));
    expect(getLevelOrder("week")).toBeLessThan(getLevelOrder("month"));
    expect(getLevelOrder("month")).toBeLessThan(getLevelOrder("half"));
    expect(getLevelOrder("half")).toBeLessThan(getLevelOrder("year"));
  });

  it("sorts most recent period first", () => {
    const reviews = [
      { level: "week", periodStart: "2026-01-05" },
      { level: "week", periodStart: "2026-01-19" },
      { level: "week", periodStart: "2026-01-12" },
    ] as Review[];

    const sorted = sortReviewsByPeriod(reviews);
    expect(sorted.map((r) => r.periodStart)).toEqual(["2026-01-19", "2026-01-12", "2026-01-05"]);
  });
});

describe("getPeriodKey", () => {
  it("combines level and period start", () => {
    expect(getPeriodKey("week", "2026-01-12")).toBe("week-2026-01-12");
  });

  it("distinguishes levels sharing a start date", () => {
    expect(getPeriodKey("month", "2026-01-01")).not.toBe(getPeriodKey("year", "2026-01-01"));
  });
});
