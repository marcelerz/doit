/**
 * @jest-environment jsdom
 */

/**
 * The palette itself. The searching is globalSearch's job and has its own
 * tests; what matters here is the keyboard behaviour, which is the whole point
 * of a palette, and that a stale highlight can never open the wrong thing.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette } from "../CommandPalette";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetParent", {
    configurable: true,
    get() {
      return this.parentElement;
    },
  });
  // jsdom has no layout, so the keep-in-view call would throw.
  Element.prototype.scrollIntoView = jest.fn();
});

const todo = (text: string) =>
  ({
    id: `todo-${text}`,
    plainText: text,
    isCompleted: false,
    isArchived: false,
    isDeleted: false,
    matchesSearch: (q: string) => text.toLowerCase().includes(q.toLowerCase()),
  }) as unknown as TodoModel;

const person = (name: string) =>
  ({
    id: `person-${name}`,
    name,
    isArchived: false,
    matchesSearch: (q: string) => name.toLowerCase().includes(q.toLowerCase()),
  }) as unknown as PersonModel;

const COLLECTIONS = {
  todos: [todo("write the report"), todo("read the report")],
  people: [person("Reporter")],
};

const setup = (over: Partial<Parameters<typeof CommandPalette>[0]> = {}) => {
  const onClose = jest.fn();
  const onSelect = jest.fn();
  const view = render(
    <CommandPalette isOpen onClose={onClose} onSelect={onSelect} collections={COLLECTIONS} {...over} />,
  );
  return { onClose, onSelect, ...view };
};

const type = (text: string) => fireEvent.change(screen.getByLabelText("Search"), { target: { value: text } });
const press = (key: string) => fireEvent.keyDown(screen.getByLabelText("Search"), { key });

describe("CommandPalette", () => {
  it("renders nothing while closed", () => {
    setup({ isOpen: false });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens as a labelled modal dialog with the input focused", () => {
    setup();
    const dialog = screen.getByRole("dialog", { name: "Search everything" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(screen.getByLabelText("Search"));
  });

  it("shows no list until something is typed", () => {
    setup();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("lists matches across collections, labelled by kind", () => {
    setup();
    type("report");

    const options = screen.getAllByRole("option");
    // "read the report" outranks "write the report" for being shorter, and
    // people come after tasks because the kinds are concatenated in that order.
    expect(options.map((o) => o.textContent)).toEqual([
      "read the reportTask",
      "write the reportTask",
      "ReporterPerson",
    ]);
  });

  it("says so when nothing matches", () => {
    setup();
    type("zzz");
    expect(screen.getByText(/Nothing matches/)).toBeTruthy();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("highlights the first result, and moves with the arrow keys", () => {
    setup();
    type("report");

    expect(screen.getAllByRole("option")[0].getAttribute("aria-selected")).toBe("true");
    press("ArrowDown");
    expect(screen.getAllByRole("option")[1].getAttribute("aria-selected")).toBe("true");
    press("ArrowUp");
    expect(screen.getAllByRole("option")[0].getAttribute("aria-selected")).toBe("true");
  });

  it("wraps around at both ends", () => {
    setup();
    type("report");

    press("ArrowUp");
    expect(screen.getAllByRole("option")[2].getAttribute("aria-selected")).toBe("true");
    press("ArrowDown");
    expect(screen.getAllByRole("option")[0].getAttribute("aria-selected")).toBe("true");
  });

  it("opens the highlighted result on Enter and closes", () => {
    const { onSelect, onClose } = setup();
    type("report");
    press("ArrowDown");
    press("Enter");

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ title: "write the report", view: "list" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("resets the highlight when the query changes", () => {
    // Without this, arrowing down and then typing would open whatever happened
    // to land at the old index -- a different item entirely.
    const { onSelect } = setup();
    type("report");
    press("ArrowDown");
    press("ArrowDown");
    type("Reporter");
    press("Enter");

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ title: "Reporter", kind: "person" }));
  });

  it("does nothing on Enter with no results", () => {
    const { onSelect, onClose } = setup();
    type("zzz");
    press("Enter");

    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("survives arrowing with an empty list", () => {
    setup();
    type("zzz");
    press("ArrowDown");
    press("ArrowUp");
    expect(screen.getByText(/Nothing matches/)).toBeTruthy();
  });

  it("opens a result on click", () => {
    const { onSelect, onClose } = setup();
    type("report");
    fireEvent.click(screen.getAllByRole("option")[2]);

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ title: "Reporter" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("follows the mouse, so clicking always opens what is highlighted", () => {
    setup();
    type("report");
    fireEvent.mouseEnter(screen.getAllByRole("option")[1]);
    expect(screen.getAllByRole("option")[1].getAttribute("aria-selected")).toBe("true");
  });

  it("closes on Escape", () => {
    const { onClose } = setup();
    press("Escape");
    expect(onClose).toHaveBeenCalled();
  });

  it("starts empty each time it opens", () => {
    // The body is remounted per open precisely so a stale query cannot linger.
    const { rerender, onClose, onSelect } = setup();
    type("report");
    rerender(
      <CommandPalette isOpen={false} onClose={onClose} onSelect={onSelect} collections={COLLECTIONS} />,
    );
    rerender(<CommandPalette isOpen onClose={onClose} onSelect={onSelect} collections={COLLECTIONS} />);

    expect((screen.getByLabelText("Search") as HTMLInputElement).value).toBe("");
  });
});
