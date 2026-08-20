/**
 * Tests for SprintModel date arithmetic.
 *
 * Regression coverage for the UTC/local mismatch: sprint dates are stored as
 * YYYY-MM-DD, which `new Date()` parses as UTC midnight, while the getters
 * then applied local-time operations (setHours, getDate, toISOString). The two
 * disagree by a day in every timezone with a non-zero UTC offset.
 */

import { SprintModel } from "@/models/SprintModel";
import { formatDateKey } from "@/utils/dateUtils";
import { Sprint } from "@/types/sprint";

const originalTZ = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTZ;
});

const makeSprint = (overrides: Partial<Sprint>): Sprint =>
  ({
    id: "sprint-1",
    name: "Sprint 1",
    durationDays: 14,
    status: "planning",
    ...overrides,
  }) as Sprint;

describe("plannedEndDate", () => {
  it("is start + duration, in local time", () => {
    process.env.TZ = "America/New_York";
    const sprint = new SprintModel(makeSprint({ plannedStartDate: "2026-03-01", durationDays: 14 }));
    expect(sprint.plannedEndDate).toBe("2026-03-15");
  });

  it("does not drop a day across a spring-forward transition", () => {
    // Europe/Berlin springs forward on 2026-03-29.
    process.env.TZ = "Europe/Berlin";
    const sprint = new SprintModel(makeSprint({ plannedStartDate: "2026-03-20", durationDays: 14 }));
    expect(sprint.plannedEndDate).toBe("2026-04-03");
  });

  it("prefers the actual start date over the planned one", () => {
    process.env.TZ = "UTC";
    const sprint = new SprintModel(
      makeSprint({ plannedStartDate: "2026-03-01", actualStartDate: "2026-03-05", durationDays: 10 })
    );
    expect(sprint.plannedEndDate).toBe("2026-03-15");
  });

  it("is undefined without a start date", () => {
    expect(new SprintModel(makeSprint({})).plannedEndDate).toBeUndefined();
  });
});

describe("daysElapsed / daysRemaining / progress", () => {
  const startedToday = () =>
    new SprintModel(
      makeSprint({ actualStartDate: formatDateKey(new Date()), status: "active", durationDays: 14 })
    );

  it("reports zero elapsed on the day the sprint starts", () => {
    for (const tz of ["America/New_York", "Europe/Berlin", "UTC"]) {
      process.env.TZ = tz;
      expect(startedToday().daysElapsed).toBe(0);
    }
  });

  it("reports the full duration remaining on the day the sprint starts", () => {
    process.env.TZ = "America/New_York";
    expect(startedToday().daysRemaining).toBe(14);
  });

  it("reports zero progress before any time has passed", () => {
    process.env.TZ = "America/New_York";
    expect(startedToday().progress).toBe(0);
  });

  it("counts a sprint started three days ago as three days elapsed", () => {
    process.env.TZ = "America/New_York";
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const sprint = new SprintModel(
      makeSprint({ actualStartDate: formatDateKey(threeDaysAgo), status: "active", durationDays: 14 })
    );
    expect(sprint.daysElapsed).toBe(3);
    expect(sprint.daysRemaining).toBe(11);
  });

  it("returns null when the sprint is not running", () => {
    const sprint = new SprintModel(makeSprint({ actualStartDate: "2026-03-01", status: "planning" }));
    expect(sprint.daysElapsed).toBeNull();
    expect(sprint.daysRemaining).toBeNull();
  });
});
