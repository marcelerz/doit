/**
 * @jest-environment jsdom
 */

/**
 * Full configuration for the ad-hoc timer's modes.
 *
 * The rules worth pinning are the ones that keep the mode graph honest:
 * deleting a mode must not leave anything pointing at it, reordering has to
 * renumber, and the alternate-hand-over fields only mean anything when there is
 * a hand-over to alternate with.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { FocusModesSection } from "../FocusModesSection";
import { FocusMode, getFocusModeId } from "@/types/focusMode";
import { getDurationMin } from "@/types/time";
import { getColor } from "@/types/types";

const mode = (over: Omit<Partial<FocusMode>, "id"> & { id: string; name: string }): FocusMode => ({
  kind: "work",
  durationMinutes: getDurationMin(25),
  ambientSound: "",
  endSound: "short-break",
  color: getColor("#2563eb"),
  order: 0,
  nextEvery: 0,
  ...over,
  id: getFocusModeId(over.id),
});

const MODES: FocusMode[] = [
  mode({
    id: "work",
    name: "Focus",
    order: 0,
    nextModeId: getFocusModeId("short"),
    nextEvery: 4,
    nextAltModeId: getFocusModeId("long"),
  }),
  mode({ id: "short", name: "Short break", kind: "break", order: 1, nextModeId: getFocusModeId("work") }),
  mode({ id: "long", name: "Long break", kind: "break", order: 2, nextModeId: getFocusModeId("work") }),
];

const setup = (modes: FocusMode[] = MODES) => {
  const onChange = jest.fn();
  render(<FocusModesSection modes={modes} onChange={onChange} />);
  return { onChange };
};

describe("FocusModesSection", () => {
  it("lists every mode", () => {
    setup();
    expect((screen.getByLabelText("Name of Focus") as HTMLInputElement).value).toBe("Focus");
    expect((screen.getByLabelText("Name of Long break") as HTMLInputElement).value).toBe("Long break");
  });

  it("edits the fields the timer's own screen does not expose", () => {
    const { onChange } = setup();

    fireEvent.change(screen.getByLabelText("Colour for Focus"), { target: { value: "#ff0000" } });
    expect(onChange.mock.calls[0][0][0].color).toBe("#ff0000");

    fireEvent.change(screen.getByLabelText("End chime for Focus"), { target: { value: "task-complete" } });
    expect(onChange.mock.calls[1][0][0].endSound).toBe("task-complete");
  });

  it("wires where a finished mode hands over to", () => {
    const { onChange } = setup();

    fireEvent.change(screen.getByLabelText("Next mode after Short break"), { target: { value: "long" } });

    expect(onChange.mock.calls[0][0][1].nextModeId).toBe("long");
  });

  it("reads 'stop and wait' as no next mode at all", () => {
    const { onChange } = setup();

    fireEvent.change(screen.getByLabelText("Next mode after Focus"), { target: { value: "" } });

    expect(onChange.mock.calls[0][0][0].nextModeId).toBeUndefined();
  });

  it("offers the alternate hand-over only once there is a hand-over", () => {
    // "Every fourth time, take a long break instead" is meaningless without a
    // normal next mode to be the exception to.
    setup();
    expect(screen.getByLabelText("Alternate interval for Focus")).toBeTruthy();

    const noNext = [mode({ id: "solo", name: "Solo" })];
    render(<FocusModesSection modes={noNext} onChange={jest.fn()} />);
    expect(screen.queryByLabelText("Alternate interval for Solo")).toBeNull();
  });

  it("keeps the alternate interval at zero or above", () => {
    const { onChange } = setup();

    fireEvent.change(screen.getByLabelText("Alternate interval for Focus"), { target: { value: "-3" } });
    expect(onChange.mock.calls[0][0][0].nextEvery).toBe(0);

    fireEvent.change(screen.getByLabelText("Alternate interval for Focus"), { target: { value: "" } });
    expect(onChange.mock.calls[1][0][0].nextEvery).toBe(0);
  });

  it("reorders and renumbers", () => {
    const { onChange } = setup();

    fireEvent.click(screen.getByLabelText("Move Short break up"));

    const next = onChange.mock.calls[0][0];
    expect(next.map((m: FocusMode) => m.name)).toEqual(["Short break", "Focus", "Long break"]);
    expect(next.map((m: FocusMode) => m.order)).toEqual([0, 1, 2]);
  });

  it("cannot move the ends past themselves", () => {
    setup();
    expect((screen.getByLabelText("Move Focus up") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Move Long break down") as HTMLButtonElement).disabled).toBe(true);
  });

  it("clears every reference to a mode it deletes", () => {
    // Otherwise the timer would try to hand over to a mode that is gone.
    const { onChange } = setup();

    fireEvent.click(screen.getByLabelText("Delete Long break"));

    const remaining = onChange.mock.calls[0][0];
    expect(remaining.map((m: FocusMode) => m.name)).toEqual(["Focus", "Short break"]);
    expect(remaining[0].nextAltModeId).toBeUndefined();
    expect(remaining[0].nextModeId).toBe("short");
    expect(remaining.map((m: FocusMode) => m.order)).toEqual([0, 1]);
  });

  it("refuses to delete the last mode", () => {
    setup([MODES[0]]);
    expect((screen.getByLabelText("Delete Focus") as HTMLButtonElement).disabled).toBe(true);
  });

  it("adds a mode at the end", () => {
    const { onChange } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Add mode" }));

    const next = onChange.mock.calls[0][0];
    expect(next).toHaveLength(4);
    expect(next[3].name).toBe("New mode");
    expect(next[3].order).toBe(3);
  });

  it("reads a blank length as 'counts up', not as zero", () => {
    const { onChange } = setup();

    fireEvent.change(screen.getByLabelText("Minutes for Focus"), { target: { value: "" } });

    expect(onChange.mock.calls[0][0][0].durationMinutes).toBeUndefined();
  });

  it("never mutates the list it was given", () => {
    const original = structuredClone(MODES);
    setup();

    fireEvent.click(screen.getByLabelText("Move Short break up"));
    fireEvent.click(screen.getByLabelText("Delete Long break"));

    expect(MODES).toEqual(original);
  });
});
