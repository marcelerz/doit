/**
 * @jest-environment jsdom
 */

/**
 * The screen the ad-hoc timer never had.
 *
 * Before this, the timer opened straight into a countdown whose length came
 * from the Gantt scheduling settings, so there was no way to say "45 minutes"
 * without changing how every task in the Gantt chart gets scheduled. These
 * cover the editing rules rather than the layout: what a blank duration means,
 * what deleting a mode does to the references pointing at it, and that the
 * component never mutates the list it was handed.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { OpenFocusSetup } from "../OpenFocusSetup";
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
  mode({ id: "work", name: "Deep work", order: 0, nextModeId: getFocusModeId("break") }),
  mode({
    id: "break",
    name: "Break",
    kind: "break",
    order: 1,
    durationMinutes: getDurationMin(10),
    nextModeId: getFocusModeId("work"),
  }),
];

const setup = (over: Partial<Parameters<typeof OpenFocusSetup>[0]> = {}) => {
  // Declared up front rather than inline, so spreading `over` cannot widen
  // their types and hide `.mock` behind a union.
  const onSelectMode = jest.fn();
  const onChangeModes = jest.fn();
  const onStart = jest.fn();
  const onClose = jest.fn();
  const onToggleSound = jest.fn();

  const props = {
    modes: MODES,
    selectedModeId: getFocusModeId("work"),
    onSelectMode,
    onChangeModes,
    onStart,
    onClose,
    soundEnabled: true,
    onToggleSound,
    ...over,
  };
  render(<OpenFocusSetup {...props} />);
  return { ...props, onSelectMode, onChangeModes, onStart, onClose, onToggleSound };
};

describe("OpenFocusSetup", () => {
  it("previews the selected mode's length", () => {
    setup();
    expect(screen.getByText("25:00")).toBeTruthy();
    expect(screen.getByText("Starting in Deep work")).toBeTruthy();
  });

  it("previews a count-up mode as open-ended rather than as zero", () => {
    setup({
      modes: [mode({ id: "think", name: "Thinking", durationMinutes: undefined })],
      selectedModeId: getFocusModeId("think"),
    });
    expect(screen.getByText("∞")).toBeTruthy();
    expect(screen.getByText("Thinking counts up until you switch")).toBeTruthy();
  });

  it("lists every mode in order", () => {
    setup();
    expect((screen.getByLabelText("Name of mode Deep work") as HTMLInputElement).value).toBe("Deep work");
    expect((screen.getByLabelText("Name of mode Break") as HTMLInputElement).value).toBe("Break");
  });

  it("edits a duration without touching the other modes", () => {
    const { onChangeModes } = setup();

    fireEvent.change(screen.getByLabelText("Minutes for Deep work"), { target: { value: "45" } });

    expect(onChangeModes).toHaveBeenCalledWith([
      expect.objectContaining({ name: "Deep work", durationMinutes: 45 }),
      expect.objectContaining({ name: "Break", durationMinutes: 10 }),
    ]);
  });

  it("holds a wild duration inside the allowed range", () => {
    const { onChangeModes } = setup();

    fireEvent.change(screen.getByLabelText("Minutes for Deep work"), { target: { value: "9999" } });

    expect(onChangeModes.mock.calls[0][0][0].durationMinutes).toBe(480);
  });

  it("reads an emptied duration as 'counts up', not as zero", () => {
    // The whole reason this cannot use the parseInt(x) || fallback idiom.
    const { onChangeModes } = setup();

    fireEvent.change(screen.getByLabelText("Minutes for Deep work"), { target: { value: "" } });

    expect(onChangeModes.mock.calls[0][0][0].durationMinutes).toBeUndefined();
  });

  it("renames a mode", () => {
    const { onChangeModes } = setup();

    fireEvent.change(screen.getByLabelText("Name of mode Deep work"), { target: { value: "Email" } });

    expect(onChangeModes.mock.calls[0][0][0].name).toBe("Email");
  });

  it("flips a mode between work and break", () => {
    const { onChangeModes } = setup();

    fireEvent.click(screen.getAllByTitle("Which total this mode's time counts towards")[0]);

    expect(onChangeModes.mock.calls[0][0][0].kind).toBe("break");
  });

  it("sets a mode's ambient sound", () => {
    const { onChangeModes } = setup();

    fireEvent.change(screen.getByLabelText("Ambient sound for Deep work"), { target: { value: "rain-window" } });

    expect(onChangeModes.mock.calls[0][0][0].ambientSound).toBe("rain-window");
  });

  it("adds a mode and selects it", () => {
    const { onChangeModes, onSelectMode } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Add mode" }));

    const added = onChangeModes.mock.calls[0][0];
    expect(added).toHaveLength(3);
    expect(added[2].name).toBe("New mode");
    expect(onSelectMode).toHaveBeenCalledWith(added[2].id);
  });

  it("clears references to a mode it deletes, so nothing advances into nothing", () => {
    const { onChangeModes } = setup();

    fireEvent.click(screen.getByLabelText("Delete Break"));

    const remaining = onChangeModes.mock.calls[0][0];
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe("Deep work");
    expect(remaining[0].nextModeId).toBeUndefined();
  });

  it("moves the selection off a deleted mode", () => {
    const { onSelectMode } = setup({ selectedModeId: getFocusModeId("break") });

    fireEvent.click(screen.getByLabelText("Delete Break"));

    expect(onSelectMode).toHaveBeenCalledWith(getFocusModeId("work"));
  });

  it("refuses to delete the last mode, because the timer needs one", () => {
    setup({ modes: [MODES[0]], selectedModeId: getFocusModeId("work") });

    expect((screen.getByLabelText("Delete Deep work") as HTMLButtonElement).disabled).toBe(true);
  });

  it("never mutates the list it was given", () => {
    const original = structuredClone(MODES);
    const { onChangeModes } = setup();

    fireEvent.change(screen.getByLabelText("Minutes for Deep work"), { target: { value: "45" } });
    fireEvent.click(screen.getByLabelText("Delete Break"));

    expect(MODES).toEqual(original);
    expect(onChangeModes).toHaveBeenCalledTimes(2);
  });

  it("names the per-mode start control distinctly from the Start button", () => {
    // Both were "Start in ...", which made getByRole("button", {name: "Start"})
    // ambiguous for anything driving this by accessible name.
    setup();
    expect(screen.getByLabelText("Begin the session in Deep work")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Start$/ })).toBeTruthy();
  });

  it("starts, closes and toggles sound", () => {
    const { onStart, onClose, onToggleSound } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByLabelText("Exit timer"));
    fireEvent.click(screen.getByLabelText("Mute sounds"));

    expect(onStart).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(onToggleSound).toHaveBeenCalled();
  });

  it("cannot start with no modes at all", () => {
    setup({ modes: [], selectedModeId: null });

    expect((screen.getByRole("button", { name: "Start" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Add a mode to get started")).toBeTruthy();
  });

  it("offers a way back to an open session, and a way to throw it away", () => {
    const { onResume, onDiscardResumable } = setup({
      resumable: { workSeconds: 1500, breakSeconds: 300 },
      onResume: jest.fn(),
      onDiscardResumable: jest.fn(),
    });

    expect(screen.getByText(/25:00 worked/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to session" }));
    expect(onResume).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onDiscardResumable).toHaveBeenCalled();
  });

  it("says nothing about resuming when there is nothing to resume", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Back to session" })).toBeNull();
  });
});
