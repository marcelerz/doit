/**
 * The ad-hoc timer's mode logic.
 *
 * The seeding cases matter most: they are the migration path off
 * `settings.gantt`, so they pin what an existing user's timer already does. If
 * one of them changes, somebody's 52 minute flow session quietly became 25
 * minutes.
 */

import {
  clampModeMinutes,
  completionCount,
  defaultStartMode,
  elapsedSeconds,
  findMode,
  modeSeconds,
  nextModeAfter,
  remainingSeconds,
  seedModesFromGantt,
  segmentSeconds,
  sortedModes,
  totalsByKind,
} from "../focusModes";
import { FocusMode, FocusSession, getFocusModeId, getFocusSessionId } from "@/types/focusMode";
import { getTimestamp } from "@/types/time";
import { Gantt } from "@/types/gantt";

const T0 = 1_700_000_000_000;
const at = (secondsFromStart: number) => getTimestamp(T0 + secondsFromStart * 1000);

const gantt = (over: Partial<Gantt>): Partial<Gantt> => over;

const session = (segments: FocusSession["segments"], over: Partial<FocusSession> = {}): FocusSession => ({
  id: getFocusSessionId("s1"),
  startedAt: getTimestamp(T0),
  segments,
  ...over,
});

const segment = (kind: "work" | "break", from: number, to?: number, modeId = "m1") => ({
  modeId: getFocusModeId(modeId),
  modeName: kind === "work" ? "Focus" : "Break",
  kind,
  startedAt: at(from),
  ...(to === undefined ? {} : { endedAt: at(to) }),
});

describe("seedModesFromGantt", () => {
  it("reproduces the pomodoro timer that exists today", () => {
    const modes = seedModesFromGantt(
      gantt({
        schedulingTechnique: "pomodoro",
        pomodoroWorkDuration: 25,
        pomodoroShortBreak: 5,
        pomodoroLongBreak: 15,
        pomodoroLongBreakInterval: 4,
      } as Partial<Gantt>),
    );

    expect(modes.map((m) => [m.name, m.kind, m.durationMinutes])).toEqual([
      ["Focus", "work", 25],
      ["Short break", "break", 5],
      ["Long break", "break", 15],
    ]);
    // The work mode alternates: short break normally, long break every fourth.
    expect(modes[0].nextModeId).toBe(modes[1].id);
    expect(modes[0].nextAltModeId).toBe(modes[2].id);
    expect(modes[0].nextEvery).toBe(4);
  });

  it("reproduces the flow timer, whose two breaks are the same length", () => {
    const modes = seedModesFromGantt(
      gantt({ schedulingTechnique: "flow", flowWorkDuration: 52, flowBreakDuration: 17 } as Partial<Gantt>),
    );

    expect(modes.map((m) => [m.name, m.kind, m.durationMinutes])).toEqual([
      ["Flow", "work", 52],
      ["Break", "break", 17],
    ]);
    // Flow never had a long break, so nothing should alternate.
    expect(modes[0].nextEvery).toBe(0);
    expect(modes[0].nextAltModeId).toBeUndefined();
  });

  it("reproduces the sequential timer from the task and context-switch settings", () => {
    const modes = seedModesFromGantt(
      gantt({ schedulingTechnique: "sequential", defaultTaskDuration: 30, contextSwitchingTime: 5 } as Partial<Gantt>),
    );

    expect(modes.map((m) => [m.name, m.kind, m.durationMinutes])).toEqual([
      ["Focus", "work", 30],
      ["Break", "break", 5],
    ]);
  });

  it("keeps the view's own fallbacks, which are not the Gantt defaults", () => {
    // OpenFocusView fell back to "pomodoro" and 25/5/15/4 when a field was
    // missing, while defaultGantt says "sequential" and a 15 minute context
    // switch. Someone reading defaultGantt would get this wrong, so it is
    // pinned: the fallback that matters is the one the timer used.
    const fromNothing = seedModesFromGantt(undefined);
    expect(fromNothing.map((m) => [m.name, m.durationMinutes])).toEqual([
      ["Focus", 25],
      ["Short break", 5],
      ["Long break", 15],
    ]);

    const sequentialOnly = seedModesFromGantt(gantt({ schedulingTechnique: "sequential" } as Partial<Gantt>));
    expect(sequentialOnly[1].durationMinutes).toBe(5);
  });

  it("falls back to 52/17 and 30/5 when the technique's own fields are missing", () => {
    // Same reasoning as the case above: these are the numbers the timer used,
    // and a half-populated gantt block has to land on them too.
    const flow = seedModesFromGantt(gantt({ schedulingTechnique: "flow" } as Partial<Gantt>));
    expect(flow.map((m) => m.durationMinutes)).toEqual([52, 17]);

    const sequential = seedModesFromGantt(gantt({ schedulingTechnique: "sequential" } as Partial<Gantt>));
    expect(sequential.map((m) => m.durationMinutes)).toEqual([30, 5]);
  });

  it("gives every seeded mode a distinct id and a stable order", () => {
    const modes = seedModesFromGantt(gantt({ schedulingTechnique: "pomodoro" } as Partial<Gantt>));
    expect(new Set(modes.map((m) => m.id)).size).toBe(3);
    expect(modes.map((m) => m.order)).toEqual([0, 1, 2]);
  });
});

describe("segmentSeconds", () => {
  it("measures a closed segment from its own timestamps", () => {
    expect(segmentSeconds(segment("work", 0, 90), at(500))).toBe(90);
  });

  it("counts an open segment up to now", () => {
    expect(segmentSeconds(segment("work", 0), at(42))).toBe(42);
  });

  it("never reports negative time", () => {
    // A clock that jumped backwards should read zero, not run the totals down.
    expect(segmentSeconds(segment("work", 100), at(10))).toBe(0);
  });
});

describe("remainingSeconds", () => {
  const countdown = { durationMinutes: 25 } as FocusMode;
  const countUp = {} as FocusMode;

  it("derives what is left from the clock, not from a counter", () => {
    expect(remainingSeconds(countdown, segment("work", 0), at(60))).toBe(1440);
  });

  it("goes negative once the mode has overrun", () => {
    // The display formats a negative as overtime, so this must not clamp.
    expect(remainingSeconds(countdown, segment("work", 0), at(1600))).toBe(-100);
  });

  it("survives the tab being throttled, because it never counted ticks", () => {
    // Ten minutes of real time passes with no ticks at all.
    expect(remainingSeconds(countdown, segment("work", 0), at(600))).toBe(900);
  });

  it("has no answer for a mode that counts up", () => {
    expect(remainingSeconds(countUp, segment("work", 0), at(60))).toBeUndefined();
  });
});

describe("elapsedSeconds", () => {
  it("counts up from the segment start", () => {
    expect(elapsedSeconds(segment("work", 10), at(70))).toBe(60);
  });
});

describe("modeSeconds", () => {
  it("converts a countdown mode to seconds", () => {
    expect(modeSeconds({ durationMinutes: 3 } as FocusMode)).toBe(180);
  });

  it("has no length for a count-up mode", () => {
    expect(modeSeconds({} as FocusMode)).toBeUndefined();
  });
});

describe("totalsByKind", () => {
  it("splits work from break", () => {
    const s = session([segment("work", 0, 60), segment("break", 60, 90), segment("work", 90, 150)]);
    expect(totalsByKind(s, at(150))).toEqual({ work: 120, break: 30, idle: 0 });
  });

  it("includes the segment that is still running", () => {
    const s = session([segment("work", 0, 60), segment("break", 60)]);
    expect(totalsByKind(s, at(100))).toEqual({ work: 60, break: 40, idle: 0 });
  });

  it("reports the gap between segments as idle, which is the paused time", () => {
    // Worked a minute, paused two, worked another minute.
    const s = session([segment("work", 0, 60), segment("work", 180, 240)]);
    expect(totalsByKind(s, at(240))).toEqual({ work: 120, break: 0, idle: 120 });
  });

  it("counts time after the last segment ended as idle while the session is open", () => {
    const s = session([segment("work", 0, 60)]);
    expect(totalsByKind(s, at(90))).toEqual({ work: 60, break: 0, idle: 30 });
  });

  it("stops at the session end rather than running on forever", () => {
    const s = session([segment("work", 0, 60)], { endedAt: at(60) });
    expect(totalsByKind(s, at(9999))).toEqual({ work: 60, break: 0, idle: 0 });
  });

  it("is all zeroes for a session with no segments", () => {
    expect(totalsByKind(session([]), at(0))).toEqual({ work: 0, break: 0, idle: 0 });
  });
});

describe("completionCount", () => {
  it("counts only the finished segments of that mode", () => {
    const s = session([
      segment("work", 0, 60, "a"),
      segment("break", 60, 90, "b"),
      segment("work", 90, 150, "a"),
      segment("work", 150, undefined, "a"), // still running
    ]);
    expect(completionCount(s, getFocusModeId("a"))).toBe(2);
    expect(completionCount(s, getFocusModeId("b"))).toBe(1);
    expect(completionCount(s, getFocusModeId("gone"))).toBe(0);
  });
});

describe("nextModeAfter", () => {
  const modes = seedModesFromGantt(
    gantt({
      schedulingTechnique: "pomodoro",
      pomodoroLongBreakInterval: 4,
    } as Partial<Gantt>),
  );
  const [work, shortBreak, longBreak] = modes;

  it("takes the short break on the first three completions", () => {
    expect(nextModeAfter(work, 1, modes)).toBe(shortBreak);
    expect(nextModeAfter(work, 2, modes)).toBe(shortBreak);
    expect(nextModeAfter(work, 3, modes)).toBe(shortBreak);
  });

  it("takes the long break on every fourth", () => {
    expect(nextModeAfter(work, 4, modes)).toBe(longBreak);
    expect(nextModeAfter(work, 8, modes)).toBe(longBreak);
  });

  it("sends a break back to work", () => {
    expect(nextModeAfter(shortBreak, 1, modes)).toBe(work);
  });

  it("never alternates when the interval is 0", () => {
    // The old code did `count % 0 === 0`, which is `NaN === 0`, which is false.
    // It happened to behave, but only by accident; make it deliberate.
    const never = { ...work, nextEvery: 0 };
    expect(nextModeAfter(never, 4, modes)).toBe(shortBreak);
  });

  it("alternates every time when the interval is 1", () => {
    const always = { ...work, nextEvery: 1 };
    expect(nextModeAfter(always, 1, modes)).toBe(longBreak);
    expect(nextModeAfter(always, 2, modes)).toBe(longBreak);
  });

  it("stops and waits when the mode has nowhere to go", () => {
    const terminal = { ...work, nextModeId: undefined, nextAltModeId: undefined };
    expect(nextModeAfter(terminal, 1, modes)).toBeNull();
  });

  it("falls back to the normal next mode when the alternate was deleted", () => {
    const dangling = { ...work, nextAltModeId: getFocusModeId("deleted") };
    expect(nextModeAfter(dangling, 4, modes)).toBe(shortBreak);
  });

  it("stops rather than throwing when the next mode was deleted", () => {
    const dangling = { ...work, nextModeId: getFocusModeId("deleted"), nextEvery: 0 };
    expect(nextModeAfter(dangling, 1, modes)).toBeNull();
  });
});

describe("clampModeMinutes", () => {
  it("passes a sensible value through", () => {
    expect(clampModeMinutes(45)).toBe(45);
  });

  it("holds the value inside the allowed range", () => {
    expect(clampModeMinutes(0)).toBe(1);
    expect(clampModeMinutes(-5)).toBe(1);
    expect(clampModeMinutes(10_000)).toBe(480);
  });

  it("treats an unparseable field as the minimum rather than as zero", () => {
    expect(clampModeMinutes(Number.NaN)).toBe(1);
  });

  it("rounds a fractional entry", () => {
    expect(clampModeMinutes(25.4)).toBe(25);
    expect(clampModeMinutes(25.6)).toBe(26);
  });

  it("honours a caller's own limits", () => {
    expect(clampModeMinutes(90, { min: 5, max: 60 })).toBe(60);
  });
});

describe("findMode", () => {
  const modes = seedModesFromGantt(undefined);

  it("finds a mode by id", () => {
    expect(findMode(modes, modes[1].id)).toBe(modes[1]);
  });

  it("returns null for an unknown or absent id", () => {
    expect(findMode(modes, getFocusModeId("nope"))).toBeNull();
    expect(findMode(modes, undefined)).toBeNull();
  });
});

describe("sortedModes", () => {
  it("orders by the order field without mutating the input", () => {
    const input = [
      { id: getFocusModeId("b"), order: 2 },
      { id: getFocusModeId("a"), order: 1 },
    ] as FocusMode[];
    expect(sortedModes(input).map((m) => m.id)).toEqual(["a", "b"]);
    expect(input.map((m) => m.id)).toEqual(["b", "a"]);
  });
});

describe("defaultStartMode", () => {
  it("starts in the first work mode", () => {
    const modes = seedModesFromGantt(undefined);
    expect(defaultStartMode(modes)?.name).toBe("Focus");
  });

  it("falls back to the first mode when none is work", () => {
    const breaksOnly = [
      { id: getFocusModeId("b"), kind: "break", order: 2, name: "Later" },
      { id: getFocusModeId("a"), kind: "break", order: 1, name: "Earlier" },
    ] as FocusMode[];
    expect(defaultStartMode(breaksOnly)?.name).toBe("Earlier");
  });

  it("has nothing to start when there are no modes", () => {
    expect(defaultStartMode([])).toBeNull();
  });
});
