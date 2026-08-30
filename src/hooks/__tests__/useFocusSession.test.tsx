/**
 * @jest-environment jsdom
 */

/**
 * The ad-hoc timer's session store.
 *
 * Closing the timer used to discard the whole session -- the counts, the work
 * total, the break total -- and nothing was ever written where Statistics or
 * Time Reports could see it. What matters here is that the segment list stays
 * an honest record of wall-clock time through switching, pausing and resuming,
 * because everything else is derived from it.
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useFocusSession, activeSegmentOf, FOCUS_SESSION_LOG_LIMIT } from "../useFocusSession";
import { setStorageAdapter, getStorageAdapter, StorageAdapter, STORAGE_KEYS } from "@/storage/storage";
import { FocusMode, FocusSession, getFocusModeId, getFocusSessionId } from "@/types/focusMode";
import { getTimestamp, getDurationMin } from "@/types/time";
import { getColor } from "@/types/types";

class MemoryAdapter implements StorageAdapter {
  data = new Map<string, string>();
  async getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  async setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  async removeItem(key: string) {
    this.data.delete(key);
  }
  async clear() {
    this.data.clear();
  }
  async getAllKeys() {
    return [...this.data.keys()];
  }
}

let adapter: MemoryAdapter;
let original: StorageAdapter;

beforeEach(() => {
  original = getStorageAdapter();
  adapter = new MemoryAdapter();
  setStorageAdapter(adapter);
});
afterEach(() => setStorageAdapter(original));

const T0 = 1_700_000_000_000;
const at = (seconds: number) => T0 + seconds * 1000;

const mode = (name: string, kind: "work" | "break", id = name.toLowerCase()): FocusMode => ({
  id: getFocusModeId(id),
  name,
  kind,
  durationMinutes: getDurationMin(25),
  ambientSound: "",
  endSound: "short-break",
  color: getColor("#000000"),
  order: 0,
  nextEvery: 0,
});

const WORK = mode("Deep work", "work");
const EMAIL = mode("Email", "work");
const BREAK = mode("Break", "break");

const mountLoaded = async () => {
  const view = renderHook(() => useFocusSession());
  await waitFor(() => expect(view.result.current.isLoaded).toBe(true));
  return view;
};

describe("activeSegmentOf", () => {
  it("finds the open segment", () => {
    const session = {
      id: getFocusSessionId("s"),
      startedAt: getTimestamp(T0),
      segments: [
        { modeId: WORK.id, modeName: "a", kind: "work" as const, startedAt: getTimestamp(T0), endedAt: getTimestamp(T0) },
        { modeId: WORK.id, modeName: "b", kind: "work" as const, startedAt: getTimestamp(T0) },
      ],
    };
    expect(activeSegmentOf(session)?.modeName).toBe("b");
  });

  it("reports none when the last segment is closed, which is what paused looks like", () => {
    const session: FocusSession = {
      id: getFocusSessionId("s"),
      startedAt: getTimestamp(T0),
      segments: [
        { modeId: WORK.id, modeName: "a", kind: "work", startedAt: getTimestamp(T0), endedAt: getTimestamp(T0) },
      ],
    };
    expect(activeSegmentOf(session)).toBeNull();
  });

  it("reports none for no session at all", () => {
    expect(activeSegmentOf(null)).toBeNull();
  });
});

describe("useFocusSession", () => {
  it("starts with no session", async () => {
    const { result } = await mountLoaded();
    expect(result.current.session).toBeNull();
    expect(result.current.activeSegment).toBeNull();
  });

  it("opens a session with one running segment", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK, at(0)));

    expect(result.current.session?.segments).toHaveLength(1);
    expect(result.current.activeSegment?.modeName).toBe("Deep work");
    expect(result.current.activeSegment?.endedAt).toBeUndefined();
  });

  it("closes the open segment and opens a new one when switching mode", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK, at(0)));
    act(() => result.current.switchTo(EMAIL, at(60)));

    const segments = result.current.session!.segments;
    expect(segments).toHaveLength(2);
    // Contiguous: the new segment picks up exactly where the old one stopped,
    // so switching cannot lose or double-count a second.
    expect(segments[0].endedAt).toBe(at(60));
    expect(segments[1].startedAt).toBe(at(60));
    expect(segments[1].modeName).toBe("Email");
  });

  it("records the mode's name on the segment, so a later rename cannot rewrite history", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK, at(0)));

    expect(result.current.session?.segments[0].modeName).toBe("Deep work");
    expect(result.current.session?.segments[0].kind).toBe("work");
  });

  it("splits work from break across a switch", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK, at(0)));
    act(() => result.current.switchTo(BREAK, at(120)));

    expect(result.current.totals(at(180))).toEqual({ work: 120, break: 60, idle: 0 });
  });

  it("stops accruing while paused, and shows the gap as idle", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK, at(0)));
    act(() => result.current.pause(at(60)));

    // Sixty seconds later the work total has not moved.
    expect(result.current.totals(at(120))).toEqual({ work: 60, break: 0, idle: 60 });
    expect(result.current.activeSegment).toBeNull();
  });

  it("resumes into a fresh segment rather than reopening the closed one", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK, at(0)));
    act(() => result.current.pause(at(60)));
    act(() => result.current.resume(WORK, at(180)));

    expect(result.current.session?.segments).toHaveLength(2);
    expect(result.current.totals(at(240))).toEqual({ work: 120, break: 0, idle: 120 });
  });

  it("ignores a resume while already running", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK, at(0)));
    act(() => result.current.resume(WORK, at(10)));

    expect(result.current.session?.segments).toHaveLength(1);
  });

  it("ignores switching, pausing and ending when nothing is running", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.switchTo(EMAIL, at(0)));
    act(() => result.current.pause(at(0)));
    act(() => result.current.end(at(0)));

    expect(result.current.session).toBeNull();
    expect(result.current.log).toEqual([]);
  });

  it("moves a finished session into the log and clears the slot", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK, at(0)));
    act(() => result.current.end(at(300)));

    expect(result.current.session).toBeNull();
    expect(result.current.log).toHaveLength(1);
    expect(result.current.log[0].endedAt).toBe(at(300));
    // Ending closes the open segment too, or the log would hold a session that
    // looks like it is still running.
    expect(result.current.log[0].segments[0].endedAt).toBe(at(300));
  });

  it("does not log a session nobody spent any time in", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK, at(0)));
    act(() => result.current.end(at(0)));

    expect(result.current.log).toEqual([]);
  });

  it("keeps the newest sessions first", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK, at(0)));
    act(() => result.current.end(at(60)));
    act(() => result.current.start(EMAIL, at(120)));
    act(() => result.current.end(at(180)));

    expect(result.current.log.map((s) => s.segments[0].modeName)).toEqual(["Email", "Deep work"]);
  });

  it("discards a session without logging it", async () => {
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK, at(0)));
    act(() => result.current.discard());

    expect(result.current.session).toBeNull();
    expect(result.current.log).toEqual([]);
  });

  it("recovers a session left open by a reload, which is what makes resume possible", async () => {
    const first = await mountLoaded();
    act(() => first.result.current.start(WORK, at(0)));
    await waitFor(async () =>
      expect(await adapter.getItem(STORAGE_KEYS.FOCUS_SESSION)).toContain("Deep work"),
    );
    first.unmount();

    const { result } = await mountLoaded();

    expect(result.current.session?.segments[0].modeName).toBe("Deep work");
    // Still open, so the totals keep running from the original start.
    expect(result.current.totals(at(90)).work).toBe(90);
  });

  it("keeps the log across a remount", async () => {
    const first = await mountLoaded();
    act(() => first.result.current.start(WORK, at(0)));
    act(() => first.result.current.end(at(60)));
    await waitFor(async () =>
      expect(await adapter.getItem(STORAGE_KEYS.FOCUS_SESSION_LOG)).toContain("Deep work"),
    );
    first.unmount();

    const { result } = await mountLoaded();
    expect(result.current.log).toHaveLength(1);
  });

  it("caps the log so it cannot grow without bound", async () => {
    const older: FocusSession[] = Array.from({ length: FOCUS_SESSION_LOG_LIMIT }, (_, i) => ({
      id: getFocusSessionId(`old-${i}`),
      startedAt: getTimestamp(at(0)),
      endedAt: getTimestamp(at(1)),
      segments: [{ modeId: WORK.id, modeName: "Old", kind: "work" as const, startedAt: getTimestamp(at(0)), endedAt: getTimestamp(at(1)) }],
    }));
    await adapter.setItem(STORAGE_KEYS.FOCUS_SESSION_LOG, JSON.stringify({ sessions: older }));

    const { result } = await mountLoaded();
    act(() => result.current.start(WORK, at(0)));
    act(() => result.current.end(at(60)));

    expect(result.current.log).toHaveLength(FOCUS_SESSION_LOG_LIMIT);
    expect(result.current.log[0].segments[0].modeName).toBe("Deep work");
  });

  it("falls back to the real clock when no time is supplied", async () => {
    // Every other test pins the clock. The view calls these without a time, so
    // the default path needs to work too.
    const { result } = await mountLoaded();

    act(() => result.current.start(WORK));
    const started = result.current.session!.segments[0].startedAt;
    expect(started).toBeGreaterThan(0);

    act(() => result.current.switchTo(BREAK));
    act(() => result.current.pause());
    act(() => result.current.resume(BREAK));
    act(() => result.current.end());

    // Nothing measurable elapsed, so it is correctly treated as an empty
    // session rather than logged.
    expect(result.current.session).toBeNull();
  });

  it("reports zero totals with no session", async () => {
    const { result } = await mountLoaded();
    expect(result.current.totals(at(100))).toEqual({ work: 0, break: 0, idle: 0 });
  });
});
