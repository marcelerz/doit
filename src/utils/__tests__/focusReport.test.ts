/**
 * Reading the ad-hoc timer's session log.
 *
 * The rule everything here turns on is clipping: a report for "today" wants the
 * part of each segment that fell inside today, not every segment of every
 * session that happened to begin today. Getting that wrong is invisible in
 * normal use and badly wrong across midnight.
 */

import { focusTotalsInPeriod, focusTotalsByMode, focusSessionsInPeriod } from "../focusReport";
import { FocusSession, getFocusModeId, getFocusSessionId } from "@/types/focusMode";
import { getTimestamp } from "@/types/time";

const HOUR = 3600 * 1000;
const DAY_START = 1_700_000_000_000;
const at = (hours: number) => getTimestamp(DAY_START + hours * HOUR);

const session = (
  id: string,
  segments: Array<[mode: string, kind: "work" | "break", fromHours: number, toHours?: number]>,
): FocusSession => ({
  id: getFocusSessionId(id),
  startedAt: at(segments[0][2]),
  segments: segments.map(([modeId, kind, from, to]) => ({
    modeId: getFocusModeId(modeId),
    modeName: modeId === "w" ? "Deep work" : modeId === "e" ? "Email" : "Break",
    kind,
    startedAt: at(from),
    ...(to === undefined ? {} : { endedAt: at(to) }),
  })),
});

const NOW = at(24);

describe("focusTotalsInPeriod", () => {
  it("sums work and break across sessions", () => {
    const sessions = [session("a", [["w", "work", 1, 2]]), session("b", [["b", "break", 3, 3.5]])];

    expect(focusTotalsInPeriod(sessions, at(0), at(24), NOW)).toEqual({ work: 3600, break: 1800 });
  });

  it("splits a segment that straddles midnight across both days", () => {
    // Ran 23:00 to 01:00. Attributing all two hours to the day it began is the
    // quiet wrongness this clipping exists to avoid: each day owns one hour.
    const sessions = [session("a", [["w", "work", 23, 25]])];

    expect(focusTotalsInPeriod(sessions, at(0), at(24), NOW).work).toBe(3600);
    expect(focusTotalsInPeriod(sessions, at(24), at(48), NOW).work).toBe(3600);
  });

  it("ignores segments wholly outside the period", () => {
    const sessions = [session("a", [["w", "work", 1, 2]])];
    expect(focusTotalsInPeriod(sessions, at(10), at(20), NOW)).toEqual({ work: 0, break: 0 });
  });

  it("counts an unfinished segment up to now, and no further", () => {
    const sessions = [session("a", [["w", "work", 23]])];
    expect(focusTotalsInPeriod(sessions, at(0), at(48), at(24)).work).toBe(3600);
  });

  it("is zero for no sessions", () => {
    expect(focusTotalsInPeriod([], at(0), at(24), NOW)).toEqual({ work: 0, break: 0 });
  });

  it("does not report idle, because a gap between sessions is not idle time", () => {
    const totals = focusTotalsInPeriod([session("a", [["w", "work", 1, 2]])], at(0), at(24), NOW);
    expect("idle" in totals).toBe(false);
  });
});

describe("focusTotalsByMode", () => {
  it("groups by mode, largest first", () => {
    const sessions = [
      session("a", [
        ["w", "work", 1, 3],
        ["e", "work", 3, 3.5],
        ["b", "break", 3.5, 4],
      ]),
      session("c", [["e", "work", 5, 6]]),
    ];

    expect(focusTotalsByMode(sessions, at(0), at(24), NOW)).toEqual([
      { modeId: "w", modeName: "Deep work", kind: "work", seconds: 7200 },
      { modeId: "e", modeName: "Email", kind: "work", seconds: 5400 },
      { modeId: "b", modeName: "Break", kind: "break", seconds: 1800 },
    ]);
  });

  it("clips to the period like the totals do", () => {
    const sessions = [session("a", [["w", "work", 23, 25]])];
    expect(focusTotalsByMode(sessions, at(24), at(48), at(48))[0].seconds).toBe(3600);
  });

  it("reports a mode that has since been deleted, under the name it had", () => {
    // The segment carries the name, which is the whole reason it is denormalized.
    const sessions = [session("a", [["gone", "work", 1, 2]])];
    expect(focusTotalsByMode(sessions, at(0), at(24), NOW)[0].modeName).toBe("Break");
  });

  it("uses the most recent name when a mode was renamed mid-period", () => {
    const sessions: FocusSession[] = [
      {
        id: getFocusSessionId("a"),
        startedAt: at(1),
        segments: [
          { modeId: getFocusModeId("w"), modeName: "Old name", kind: "work", startedAt: at(1), endedAt: at(2) },
          { modeId: getFocusModeId("w"), modeName: "New name", kind: "work", startedAt: at(3), endedAt: at(4) },
        ],
      },
    ];

    const [total] = focusTotalsByMode(sessions, at(0), at(24), NOW);
    expect(total.modeName).toBe("New name");
    expect(total.seconds).toBe(7200);
  });

  it("breaks ties by name so the order is stable", () => {
    const sessions = [
      session("a", [
        ["e", "work", 1, 2],
        ["w", "work", 2, 3],
      ]),
    ];
    expect(focusTotalsByMode(sessions, at(0), at(24), NOW).map((t) => t.modeName)).toEqual(["Deep work", "Email"]);
  });

  it("skips segments outside the period rather than listing them at zero", () => {
    const sessions = [
      session("a", [
        ["w", "work", 1, 2],
        ["e", "work", 10, 11],
      ]),
    ];

    expect(focusTotalsByMode(sessions, at(0), at(5), NOW).map((t) => t.modeId)).toEqual(["w"]);
  });

  it("keeps the newest name even when the log is out of order", () => {
    // The log is newest-first, so segments do not always arrive in time order.
    const sessions: FocusSession[] = [
      {
        id: getFocusSessionId("a"),
        startedAt: at(1),
        segments: [
          { modeId: getFocusModeId("w"), modeName: "New name", kind: "work", startedAt: at(3), endedAt: at(4) },
          { modeId: getFocusModeId("w"), modeName: "Old name", kind: "work", startedAt: at(1), endedAt: at(2) },
        ],
      },
    ];

    expect(focusTotalsByMode(sessions, at(0), at(24), NOW)[0].modeName).toBe("New name");
  });

  it("is empty for no sessions", () => {
    expect(focusTotalsByMode([], at(0), at(24), NOW)).toEqual([]);
  });
});

describe("focusSessionsInPeriod", () => {
  it("keeps sessions that overlap at all, newest first", () => {
    const sessions = [session("early", [["w", "work", 1, 2]]), session("late", [["w", "work", 5, 6]])];

    expect(focusSessionsInPeriod(sessions, at(0), at(24), NOW).map((s) => s.id)).toEqual(["late", "early"]);
  });

  it("drops sessions that fall entirely outside", () => {
    const sessions = [session("a", [["w", "work", 1, 2]])];
    expect(focusSessionsInPeriod(sessions, at(10), at(20), NOW)).toEqual([]);
  });

  it("keeps a session that only straddles the edge", () => {
    const sessions = [session("a", [["w", "work", 23, 25]])];
    expect(focusSessionsInPeriod(sessions, at(24), at(48), at(48))).toHaveLength(1);
  });
});
