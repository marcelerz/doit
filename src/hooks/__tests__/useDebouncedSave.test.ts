/**
 * @jest-environment jsdom
 */

/**
 * The rule this hook exists for: an edit that has not been saved yet must not
 * be lost because the view closed. Every overlay had its own setTimeout and its
 * own clearTimeout cleanup, and that cleanup could not tell "a newer save is
 * coming" from "nothing else is coming", so it dropped the edit either way.
 */

import { renderHook, act } from "@testing-library/react";
import { useDebouncedSave } from "../useDebouncedSave";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

describe("useDebouncedSave", () => {
  it("saves once the delay has passed", () => {
    const save = jest.fn();
    renderHook(() => useDebouncedSave(save, ["a"]));

    expect(save).not.toHaveBeenCalled();
    advance(500);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("coalesces a run of changes into one save", () => {
    const save = jest.fn();
    const { rerender } = renderHook(({ value }) => useDebouncedSave(save, [value]), {
      initialProps: { value: "a" },
    });

    advance(200);
    rerender({ value: "ab" });
    advance(200);
    rerender({ value: "abc" });
    advance(200);
    expect(save).not.toHaveBeenCalled();

    advance(300);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("saves current values, not the ones the timer closed over", () => {
    // The debounce outlives the render that started it, so reading `save`
    // through a ref is what stops it writing three-renders-old state.
    const seen: string[] = [];
    const { rerender } = renderHook(
      ({ value }) => useDebouncedSave(() => seen.push(value), [value]),
      { initialProps: { value: "first" } },
    );

    advance(400);
    rerender({ value: "second" });
    advance(500);

    expect(seen).toEqual(["second"]);
  });

  it("runs the pending save on unmount instead of dropping it", () => {
    // The blocker: closing a note within the delay lost everything typed.
    const save = jest.fn();
    const { unmount } = renderHook(() => useDebouncedSave(save, ["a"]));

    advance(100);
    unmount();

    expect(save).toHaveBeenCalledTimes(1);
  });

  it("does not save again on unmount when the timer already fired", () => {
    const save = jest.fn();
    const { unmount } = renderHook(() => useDebouncedSave(save, ["a"]));

    advance(500);
    unmount();

    expect(save).toHaveBeenCalledTimes(1);
  });

  it("saves now when asked to flush, and only once", () => {
    const save = jest.fn();
    const { result } = renderHook(() => useDebouncedSave(save, ["a"]));

    act(() => result.current.flush());
    expect(save).toHaveBeenCalledTimes(1);

    advance(500);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("flushing with nothing pending does nothing", () => {
    const save = jest.fn();
    const { result } = renderHook(() => useDebouncedSave(save, ["a"]));

    advance(500);
    save.mockClear();

    act(() => result.current.flush());
    expect(save).not.toHaveBeenCalled();
  });

  it("cancel throws the pending save away, unmount included", () => {
    const save = jest.fn();
    const { result, unmount } = renderHook(() => useDebouncedSave(save, ["a"]));

    act(() => result.current.cancel());
    advance(500);
    unmount();

    expect(save).not.toHaveBeenCalled();
  });

  it("schedules nothing while disabled", () => {
    const save = jest.fn();
    const { unmount } = renderHook(() => useDebouncedSave(save, ["a"], { enabled: false }));

    advance(500);
    unmount();

    expect(save).not.toHaveBeenCalled();
  });

  it("starts saving when it becomes enabled", () => {
    const save = jest.fn();
    const { rerender } = renderHook(({ on }) => useDebouncedSave(save, ["a"], { enabled: on }), {
      initialProps: { on: false },
    });

    advance(500);
    expect(save).not.toHaveBeenCalled();

    rerender({ on: true });
    advance(500);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("honours a custom delay", () => {
    const save = jest.fn();
    renderHook(() => useDebouncedSave(save, ["a"], { delayMs: 50 }));

    advance(49);
    expect(save).not.toHaveBeenCalled();
    advance(1);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
