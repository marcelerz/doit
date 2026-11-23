/**
 * @jest-environment jsdom
 */

/**
 * The first tests this component has had (U0500): 1,299 lines that tokenise a
 * contentEditable, drive an autocomplete and expose an imperative handle.
 *
 * They characterise the source as it stands, but only where it is right. Where
 * it is known to be wrong there is an `it.todo` naming the backlog unit, so no
 * defect is pinned. The inputs are plain for the same reason: markers start a
 * word and new names are lower case, which keeps clear of U0505 and U0506.
 *
 * Not tested: where the dropdown is placed -- jsdom has no layout to place it in.
 */

import { createRef } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SmartEditableInput, { SmartEditableInputHandle, SmartEditableInputProps } from "../SmartInput";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import { Color, getColor } from "@/types/types";
import { TokenMatch } from "@/types/token";
import { DEFAULT_PRIORITIES, createTestDateTimeSettings, createTestWorkHoursSettings } from "@/__tests__/helpers/fixtures";

// Colours are in rgb() notation because that is how jsdom reads an inline style back.
const RED = "rgb(255, 0, 0)";
const markerColors = {
  assigned: "rgb(204, 229, 255)",
  project: "rgb(226, 204, 255)",
  tag: "rgb(212, 237, 218)",
  dueDate: "rgb(248, 215, 218)",
  recurring: "rgb(207, 244, 252)",
};

const person = (name: string, alternatives: string[] = [], color?: Color) =>
  new PersonModel({ id: getPersonId(name), name, alternatives, color, comments: [], activity: [] });
const project = (name: string, alternatives: string[] = []) =>
  new ProjectModel({ id: getProjectId(name), name, alternatives, comments: [], activity: [] });

const defaults: SmartEditableInputProps = {
  availablePeople: [person("Alice", ["Ali"], getColor(RED)), person("Bob", ["Robert"]), person("Carol")],
  availableProjects: [project("Website", ["web"]), project("Apollo")],
  availablePriorities: DEFAULT_PRIORITIES,
  markerColors,
  dateTimeSettings: createTestDateTimeSettings(),
  workHoursSettings: createTestWorkHoursSettings(),
};

/** An explicit-marker token: it ends where its raw text does. */
const token = (type: string, value: string, raw: string, start: number): TokenMatch =>
  ({ type, value, raw, start, end: start + raw.length });
const ALICE = token("assigned", "Alice", "@Alice", 5);
const WEBSITE = token("project", "Website", "%Website", 5);
const WEEKLY_HOUR = "every monday at 9am to 10am";

const editor = () => screen.getByTestId("smart-input");
const tokenSpans = () => Array.from(editor().querySelectorAll("span"));
const tokenTexts = () => tokenSpans().map((span) => span.textContent);
const dropdown = () => document.querySelector(".autocomplete-dropdown");
const options = () => Array.from(document.querySelectorAll(".autocomplete-dropdown button"));
const optionLabels = () => options().map((option) => option.textContent);
const press = (key: string) => fireEvent.keyDown(editor(), { key });

/** The caret's distance from the start of the editor, in characters. */
function caretOffset(): number {
  const caret = window.getSelection()!.getRangeAt(0);
  const before = document.createRange();
  before.selectNodeContents(editor());
  before.setEnd(caret.startContainer, caret.startOffset);
  return before.toString().length;
}

/**
 * Type the way the browser does: the text and the caret are in the DOM before
 * the input event fires. Focus comes first because jsdom moves the caret to the
 * start of an element on its first focus, undoing the caret the component restores.
 */
function type(text: string, caret: number = text.length): void {
  const el = editor();
  el.focus();
  el.textContent = text;
  window.getSelection()!.collapse(el.firstChild ?? el, el.firstChild ? caret : 0);
  fireEvent.input(el);
}

function setup(props: SmartEditableInputProps = {}) {
  const onTokensChange = jest.fn<void, [TokenMatch[], string, string]>();
  const ref = createRef<SmartEditableInputHandle>();
  const element = (later: SmartEditableInputProps = {}) => (
    <SmartEditableInput ref={ref} onTokensChange={onTokensChange} {...defaults} {...props} {...later} />
  );
  const view = render(element());
  // Rendering initialValue holds input events off until the next frame. Not a
  // fixed 16ms: the frame is up to 31ms away while the faked clock is in the past.
  act(() => jest.advanceTimersToNextFrame());
  return {
    onTokensChange,
    handle: () => ref.current!,
    lastReport: () => onTokensChange.mock.lastCall!,
    rerender: (later: SmartEditableInputProps) => view.rerender(element(later)),
    unmount: view.unmount,
  };
}

// jsdom has no innerText, and inserting a completion reads it.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "innerText", {
    configurable: true,
    get(this: HTMLElement) {
      return this.textContent ?? "";
    },
    set(this: HTMLElement, value: string) {
      this.textContent = value;
    },
  });
});

afterAll(() => {
  delete (HTMLElement.prototype as { innerText?: string }).innerText;
});

beforeEach(() => {
  // Dates are detected against "now": a Friday morning, in whatever zone.
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 4, 15, 10, 0, 0));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("mounting", () => {
  it("renders initialValue with its tokens and reports it", () => {
    const { onTokensChange } = setup({ initialValue: "Call @Alice back" });
    expect(editor().textContent).toBe("Call @Alice back");
    expect(tokenTexts()).toEqual(["@Alice"]);
    // By arguments rather than by count: see the todo at the end of this block.
    expect(onTokensChange).toHaveBeenCalledWith([ALICE], "Call @Alice back", "Call @Alice back");
  });

  it("does not overwrite the editor when initialValue changes after mount", () => {
    const { rerender } = setup({ initialValue: "Call @Alice back" });
    rerender({ initialValue: "Plan %Website launch" });
    expect(editor().textContent).toBe("Call @Alice back");
  });

  it("carries the placeholder it is given, and a default without one", () => {
    const { rerender } = setup({ placeholder: "Add an action item" });
    expect(editor().getAttribute("data-placeholder")).toBe("Add an action item");
    rerender({ placeholder: undefined });
    expect(editor().getAttribute("data-placeholder")).toBe("What needs to be done?");
  });

  it.todo("reports initialValue through onTokensChange once on mount, not twice (new finding)");
});

describe("tokens reported while typing", () => {
  it.each<[string, string, TokenMatch, string]>([
    ["@person, kept in the plain text", "Call @Alice back", ALICE, "Call @Alice back"],
    ["$person, kept in the plain text", "Report $Bob sent", token("source", "Bob", "$Bob", 7), "Report $Bob sent"],
    ["%project, taken out of the plain text", "Plan %Website launch", WEBSITE, "Plan launch"],
    ["#tag, taken out of the plain text", "Pay #billing invoice", token("tag", "billing", "#billing", 4), "Pay invoice"],
    ["!!priority, taken out of the plain text", "Fix !!high bug", token("priority", "high", "!!high", 4), "Fix bug"],
    ["an alternative name as its person", "Call @ali back", token("assigned", "Alice", "@ali", 5), "Call @ali back"],
    ["an alternative name as its project", "Plan %web launch", token("project", "Website", "%web", 5), "Plan launch"],
    ["an alternative name as its priority", "Fix !!important bug", token("priority", "high", "!!important", 4), "Fix bug"],
  ])("reports %s", (_rule, text, expected, plainText) => {
    const { lastReport } = setup();
    type(text);
    expect(lastReport()).toEqual([[expected], text, plainText]);
    expect(tokenTexts()).toEqual([expected.raw]);
  });

  it("reports every marker in a sentence in the order they appear", () => {
    const { lastReport } = setup();
    type("Email @Alice about %Website #billing !!high please");
    const [tokens, rawText, plainText] = lastReport();
    expect(tokens.map((each) => each.raw)).toEqual(["@Alice", "%Website", "#billing", "!!high"]);
    expect(rawText).toBe("Email @Alice about %Website #billing !!high please");
    expect(plainText).toBe("Email @Alice about please");
  });

  it("leaves an unknown name after a marker as ordinary text", () => {
    const { lastReport } = setup();
    type("Call @Zed back");
    expect(lastReport()).toEqual([[], "Call @Zed back", "Call @Zed back"]);
    expect(tokenTexts()).toEqual([]);
  });

  it("reports an emptied editor as no tokens and no text", () => {
    const { lastReport } = setup({ initialValue: "Call @Alice back" });
    type("");
    expect(lastReport()).toEqual([[], "", ""]);
  });

  it.each<[string, string, Record<string, unknown>]>([
    ["Call mom", "tomorrow", { dueDate: expect.stringMatching(/^2026-05-16T/) }],
    ["Standup", "every monday", { dueDate: expect.stringMatching(/^2026-05-18T/), recurring: "every monday" }],
    ["Meeting", "tomorrow 2pm to 4pm", { dueDate: "2026-05-16T14:00", duration: "2h" }],
    ["Standup", WEEKLY_HOUR, { dueDate: "2026-05-18T09:00", duration: "1h", recurring: WEEKLY_HOUR }],
    ["Write report", "2h", { duration: "2h" }],
  ])('detects "%s %s" as one auto-detected token and leaves only the title as plain text', (title, phrase, values) => {
    const { lastReport } = setup();
    type(`${title} ${phrase}`);
    const [tokens, rawText, plainText] = lastReport();
    expect(Object.fromEntries(tokens.map((each) => [each.type, each.value]))).toEqual(values);
    expect(tokens).toHaveLength(Object.keys(values).length);
    expect(tokens.every((each) => each.isAutoDetected && each.raw === phrase)).toBe(true);
    expect([rawText, plainText]).toEqual([`${title} ${phrase}`, title]);
    expect(tokenTexts()).toEqual([phrase]);
  });

  it.each([
    ["mentioned", "Alice", "Lunch with Alice"],
    ["source", "Bob", "Feedback from Bob"],
    ["project", "Website", "Work on Website"],
    ["priority", "urgent", "This is urgent"],
  ])("auto-detects a %s token for %s and leaves the sentence whole in the plain text", (tokenType, value, text) => {
    const { lastReport } = setup();
    type(text);
    expect(lastReport()).toEqual([[expect.objectContaining({ type: tokenType, value, isAutoDetected: true })], text, text]);
  });

  it.each([
    ["the person's own colour", "Call @Alice back", RED],
    ["the assigned colour for a person without one", "Call @Bob back", markerColors.assigned],
    ["the project colour", "Plan %Website launch", markerColors.project],
    ["the tag colour", "Pay #billing invoice", markerColors.tag],
    ["the due date colour", "Call mom tomorrow", markerColors.dueDate],
    ["the recurring colour when a date recurs", "Standup every monday", markerColors.recurring],
  ])("paints the token in %s", (_rule, text, colour) => {
    setup();
    type(text);
    expect(tokenSpans()[0].style.backgroundColor).toBe(colour);
  });

  it("offers deactivation on a detected date but not on an explicit marker", () => {
    setup();
    type("Call @Alice tomorrow");
    const [explicit, detected] = tokenSpans();
    expect([explicit.dataset.autoDetected, explicit.title]).toEqual([undefined, ""]);
    expect([detected.dataset.autoDetected, detected.title]).toEqual(["true", "Click to deactivate auto-detection"]);
  });

  it.each([3, 8, 20])("puts the caret back at offset %i after re-rendering the tokens", (offset) => {
    setup();
    type("Pay #billing invoice", offset);
    expect(caretOffset()).toBe(offset);
  });

  it.todo('reads "in 2 days" as a due date rather than a duration (U0517)');
  it.todo("does not re-tokenise or submit while an IME composition is in progress (U0504)");
});

describe("deactivating a detected date", () => {
  it("drops the token when it is clicked and reports the date as ordinary text", () => {
    const { onTokensChange, lastReport } = setup();
    type("Call mom tomorrow");
    onTokensChange.mockClear();
    fireEvent.click(tokenSpans()[0]);
    expect(tokenTexts()).toEqual([]);
    expect(editor().textContent).toBe("Call mom tomorrow");
    expect(lastReport()).toEqual([[], "Call mom tomorrow", "Call mom tomorrow"]);
  });

  it("turns off only the date that was clicked, and keeps it off while the text after it changes", () => {
    const { lastReport } = setup();
    type("Call mom today and dad tomorrow");
    fireEvent.click(tokenSpans()[0]);
    expect(tokenTexts()).toEqual(["tomorrow"]);
    expect(lastReport()[2]).toBe("Call mom today and dad");
    type("Call mom today and dad tomorrow please");
    expect(tokenTexts()).toEqual(["tomorrow"]);
    expect(lastReport()[2]).toBe("Call mom today and dad please");
  });

  it.todo("keeps a date deactivated when text is inserted before it (U0499)");
  it.todo("forgets deactivations on clear and setValue, so a date at the same offsets in new text is detected (U0499)");
  it.todo("turns off a clicked auto-detected person, project, priority or duration, or stops offering to (U0499)");
});

describe("the imperative handle", () => {
  it("setValue replaces the content and reports the new tokens", () => {
    const { handle, lastReport } = setup({ initialValue: "Call @Alice back" });
    handle().setValue("Plan %Website launch");
    expect(editor().textContent).toBe("Plan %Website launch");
    expect(tokenTexts()).toEqual(["%Website"]);
    expect(lastReport()).toEqual([[WEBSITE], "Plan %Website launch", "Plan launch"]);
  });

  it("clear empties the editor and reports no tokens and no text", () => {
    const { handle, lastReport } = setup({ initialValue: "Call @Alice back" });
    handle().clear();
    expect(editor().childNodes).toHaveLength(0);
    expect(lastReport()).toEqual([[], "", ""]);
  });

  it("focus moves focus into the editor", () => {
    const { handle } = setup();
    expect(document.activeElement).toBe(document.body);
    handle().focus();
    expect(document.activeElement).toBe(editor());
  });

  it("does nothing once the component has unmounted", () => {
    const { handle, onTokensChange, unmount } = setup({ initialValue: "Call @Alice back" });
    const stale = handle();
    unmount();
    onTokensChange.mockClear();
    expect(() => [stale.setValue("Plan %Website launch"), stale.clear(), stale.focus()]).not.toThrow();
    expect(onTokensChange).not.toHaveBeenCalled();
  });

  it.todo("calls the onTokensChange of the latest render from clear and setValue, not a stale one (U0103)");
  it.todo("keeps working after effects are re-run, as StrictMode does in development (new finding)");
});

describe("keys while no dropdown is open", () => {
  it("submits on Enter and keeps the newline out of the editor", () => {
    const onEnterPress = jest.fn();
    setup({ onEnterPress });
    const defaultAllowed = press("Enter");
    expect(onEnterPress).toHaveBeenCalledTimes(1);
    expect(defaultAllowed).toBe(false);
  });

  it("leaves every other key to the browser", () => {
    const onEnterPress = jest.fn();
    setup({ onEnterPress, initialValue: "Call @Alice back" });
    expect(["a", "Backspace", "Tab", "ArrowDown", "Escape"].map(press)).toEqual([true, true, true, true, true]);
    expect(onEnterPress).not.toHaveBeenCalled();
  });

  it.todo("has no Backspace branch waiting on a data-token attribute that nothing sets (U0507)");
});

describe("autocomplete", () => {
  it.each<[string, string[]]>([
    ["@", ["@Alice", "@Bob", "@Carol"]],
    ["$", ["$Alice", "$Bob", "$Carol"]],
    ["%", ["%Website", "%Apollo"]],
    ["!!", ["!!urgent", "!!critical", "!!high", "!!important", "!!medium", "!!low"]],
  ])("lists everything available after %s", (marker, labels) => {
    setup();
    type(`Ask ${marker}`);
    expect(optionLabels()).toEqual(labels);
  });

  it("narrows the list as the name is typed, matching alternatives and ignoring case", () => {
    setup();
    type("Ask @B");
    expect(optionLabels()).toEqual(["@Bob"]);
    type("Ask @rob");
    expect(optionLabels()).toEqual(["@Bob"]);
    type("Fix !!cr");
    expect(optionLabels()).toEqual(["!!urgent", "!!critical"]);
  });

  it("goes by the text before the caret, and closes once a space ends the name", () => {
    setup();
    type("Ask @b about it", 6);
    expect(optionLabels()).toEqual(["@Bob"]);
    type("Ask @b about it");
    expect(dropdown()).toBeNull();
  });

  it("stays closed for a # tag, which is free text", () => {
    setup();
    type("Pay #bil");
    expect(dropdown()).toBeNull();
  });

  it.each(["Enter", "Tab"])("inserts the selected name on %s, with a space after it, and nothing else happens", (key) => {
    const onEnterPress = jest.fn();
    const { lastReport } = setup({ onEnterPress });
    type("Ask @b");
    const defaultAllowed = press(key);
    expect(editor().textContent).toBe("Ask @Bob ");
    expect(tokenTexts()).toEqual(["@Bob"]);
    expect(lastReport()).toEqual([[token("assigned", "Bob", "@Bob", 4)], "Ask @Bob", "Ask @Bob"]);
    expect(dropdown()).toBeNull();
    expect(caretOffset()).toBe("Ask @Bob ".length);
    // Neither a submit nor the key's own effect: a newline, or focus moving on.
    expect([defaultAllowed, onEnterPress.mock.calls]).toEqual([false, []]);
  });

  it.each<[string, string[], string]>([
    ["the first option when no arrow key was pressed", [], "Ask @Alice "],
    ["the next option after ArrowDown", ["ArrowDown"], "Ask @Bob "],
    ["the last option when ArrowDown runs past the end", ["ArrowDown", "ArrowDown", "ArrowDown"], "Ask @Carol "],
    ["the option above after ArrowUp", ["ArrowDown", "ArrowDown", "ArrowUp"], "Ask @Bob "],
    ["the first option when ArrowUp is pressed at the top", ["ArrowUp"], "Ask @Alice "],
  ])("Enter inserts %s", (_rule, keys, expected) => {
    setup();
    type("Ask @");
    keys.forEach(press);
    press("Enter");
    expect(editor().textContent).toBe(expected);
  });

  it("inserts the option that is clicked, and on Enter the one under the mouse", () => {
    setup();
    type("Ask @");
    fireEvent.click(options()[1]);
    expect(editor().textContent).toBe("Ask @Bob ");
    expect(dropdown()).toBeNull();
    type("Ask @");
    fireEvent.mouseEnter(options()[2]);
    press("Enter");
    expect(editor().textContent).toBe("Ask @Carol ");
  });

  it("closes on Escape, after which Enter submits", () => {
    const onEnterPress = jest.fn();
    setup({ onEnterPress });
    type("Ask @");
    press("Escape");
    expect(dropdown()).toBeNull();
    press("Enter");
    expect(onEnterPress).toHaveBeenCalledTimes(1);
    expect(editor().textContent).toBe("Ask @");
  });

  it("closes on a mousedown outside, but not on one in the editor or the dropdown", () => {
    setup();
    type("Ask @");
    fireEvent.mouseDown(editor());
    fireEvent.mouseDown(options()[0]);
    expect(dropdown()).not.toBeNull();
    fireEvent.mouseDown(document.body);
    expect(dropdown()).toBeNull();
  });

  it.todo("opens only for a marker that starts a word, not one inside an email address or a price (U0505)");
  it.todo("completes the marker at the caret rather than the last marker in the text (U0505)");
  it.todo("leaves a single space between a name completed mid-text and the words after it (new finding)");
  it.todo("lets Enter submit when the open dropdown has nothing to choose from (U0505)");

  it.each([
    ["@", "person", "onAddPerson"],
    ["%", "project", "onAddProject"],
    ["!!", "priority", "onAddPriority"],
  ])("offers to add an unknown name after %s as a %s, and calls only %s when that is clicked", (marker, kind, expected) => {
    const callbacks = { onAddPerson: jest.fn(), onAddProject: jest.fn(), onAddPriority: jest.fn() };
    setup(callbacks);
    type(`Ask ${marker}zed`);
    expect(optionLabels()).toEqual([expect.stringContaining(`Add new ${kind}: zed`)]);
    fireEvent.click(options()[0]);
    // Typed in lower case, so this holds whether or not the name is lowercased (U0506).
    const calls = Object.entries(callbacks).flatMap(([name, callback]) => callback.mock.calls.map((args) => [name, ...args]));
    expect(calls).toEqual([[expected, "zed"]]);
    expect(editor().textContent).toBe(`Ask ${marker}zed `);
    expect(dropdown()).toBeNull();
  });

  it("adds an unknown name from the keyboard, as a person after $ too", () => {
    const onAddPerson = jest.fn();
    setup({ onAddPerson });
    type("Ask $zed");
    // Moving onto the row first, so this does not rely on it being pre-selected (U0505).
    press("ArrowDown");
    press("Enter");
    expect(onAddPerson.mock.calls).toEqual([["zed"]]);
    expect(editor().textContent).toBe("Ask $zed ");
  });

  it("does not offer to add a name without the callback for it, or before a name is typed", () => {
    setup({ availableProjects: [], onAddProject: jest.fn() });
    type("Ask @zed");
    expect(options()).toHaveLength(0);
    type("Plan %");
    expect(options()).toHaveLength(0);
  });

  it.todo("passes a new name to onAddPerson, onAddProject and onAddPriority in the case it was typed (U0506)");
  it.todo("reports a newly added name as a token straight away, not only after the next keystroke (new finding)");
});
