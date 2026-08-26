/**
 * @jest-environment jsdom
 */

/**
 * Tests for the two timer loops FocusView and OpenFocusView share.
 *
 * Both were written twice, ref juggling and all. What matters here is the
 * lifecycle: an interval that keeps running after the view stops, or after it
 * unmounts, counts down a session nobody is watching and fires sounds into an
 * empty room.
 */

import { renderHook, act } from "@testing-library/react";
import { useTimerTick, useConfirmationRepeat } from "../usePomodoroTimer";

const playNotificationSound = jest.fn();
jest.mock("@/utils/notifications", () => ({
  playNotificationSound: (...args: unknown[]) => playNotificationSound(...args),
}));

beforeEach(() => {
  jest.useFakeTimers();
  playNotificationSound.mockClear();
});
afterEach(() => jest.useRealTimers());

describe("useTimerTick", () => {
  it("does not tick while inactive", () => {
    const onTick = jest.fn();
    renderHook(() => useTimerTick(false, onTick));

    act(() => void jest.advanceTimersByTime(5000));
    expect(onTick).not.toHaveBeenCalled();
  });

  it("ticks once a second while active", () => {
    const onTick = jest.fn();
    renderHook(() => useTimerTick(true, onTick));

    act(() => void jest.advanceTimersByTime(3000));
    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it("stops when it goes inactive", () => {
    const onTick = jest.fn();
    const { rerender } = renderHook(({ active }) => useTimerTick(active, onTick), {
      initialProps: { active: true },
    });

    act(() => void jest.advanceTimersByTime(2000));
    rerender({ active: false });
    act(() => void jest.advanceTimersByTime(5000));

    expect(onTick).toHaveBeenCalledTimes(2);
  });

  it("stops on unmount", () => {
    const onTick = jest.fn();
    const { unmount } = renderHook(() => useTimerTick(true, onTick));

    act(() => void jest.advanceTimersByTime(1000));
    unmount();
    act(() => void jest.advanceTimersByTime(5000));

    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it("calls the newest callback without restarting the interval", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ cb }) => useTimerTick(true, cb), { initialProps: { cb: first } });

    act(() => void jest.advanceTimersByTime(1500)); // one tick, half a second in
    rerender({ cb: second });
    act(() => void jest.advanceTimersByTime(500)); // completes the second second

    // A restart would reset the clock and swallow this tick, so a view that
    // re-renders every second would never fire at all.
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe("useConfirmationRepeat", () => {
  type State = { confirmationRepeats: number; done?: boolean };

  const mount = (overrides: Partial<Parameters<typeof useConfirmationRepeat>[0]> = {}) => {
    const setState = jest.fn();
    const confirmPhaseTransition = jest.fn((s: State) => ({ ...s, done: true }));
    const options = {
      pendingPhase: "break" as string | null,
      requireConfirmation: true,
      repeatIntervalSeconds: 30,
      maxRepeats: 3,
      soundEnabled: true,
      soundFor: () => "short-break" as const,
      setState,
      confirmPhaseTransition,
      ...overrides,
    };
    const result = renderHook(() => useConfirmationRepeat(options));
    return { setState, confirmPhaseTransition, ...result };
  };

  /** Run every queued setState updater against a starting state. */
  const applyAll = (setState: jest.Mock, start: State): State =>
    setState.mock.calls.reduce((state, [updater]) => updater(state), start);

  it("does nothing with no pending phase", () => {
    const { setState } = mount({ pendingPhase: null });

    act(() => void jest.advanceTimersByTime(120_000));
    expect(setState).not.toHaveBeenCalled();
  });

  it("does nothing when confirmation is not required", () => {
    const { setState } = mount({ requireConfirmation: false });

    act(() => void jest.advanceTimersByTime(120_000));
    expect(setState).not.toHaveBeenCalled();
  });

  it("reminds on the configured interval", () => {
    const { setState } = mount({ repeatIntervalSeconds: 10 });

    act(() => void jest.advanceTimersByTime(25_000));
    expect(setState).toHaveBeenCalledTimes(2);
  });

  it("plays the sound the caller chose for this phase", () => {
    const { setState } = mount({ repeatIntervalSeconds: 5, soundFor: () => "long-break" as const });

    act(() => void jest.advanceTimersByTime(5000));
    applyAll(setState, { confirmationRepeats: 0 });

    expect(playNotificationSound).toHaveBeenCalledWith("long-break");
  });

  it("stays silent when sound is off", () => {
    const { setState } = mount({ repeatIntervalSeconds: 5, soundEnabled: false });

    act(() => void jest.advanceTimersByTime(5000));
    applyAll(setState, { confirmationRepeats: 0 });

    expect(playNotificationSound).not.toHaveBeenCalled();
  });

  it("counts up until the limit, then transitions instead", () => {
    const { setState, confirmPhaseTransition } = mount({ repeatIntervalSeconds: 1, maxRepeats: 3 });

    act(() => void jest.advanceTimersByTime(3000));
    const final = applyAll(setState, { confirmationRepeats: 0 });

    expect(confirmPhaseTransition).toHaveBeenCalledTimes(1);
    expect(final.done).toBe(true);
  });

  it("never transitions on its own when maxRepeats is 0", () => {
    const { setState, confirmPhaseTransition } = mount({ repeatIntervalSeconds: 1, maxRepeats: 0 });

    act(() => void jest.advanceTimersByTime(20_000));
    const final = applyAll(setState, { confirmationRepeats: 0 });

    // 0 is how a user says "never proceed without me", not "proceed at once".
    expect(confirmPhaseTransition).not.toHaveBeenCalled();
    expect(final.confirmationRepeats).toBe(20);
  });

  it("stops reminding on unmount", () => {
    const { setState, unmount } = mount({ repeatIntervalSeconds: 1 });

    act(() => void jest.advanceTimersByTime(1000));
    unmount();
    act(() => void jest.advanceTimersByTime(10_000));

    expect(setState).toHaveBeenCalledTimes(1);
  });
});
