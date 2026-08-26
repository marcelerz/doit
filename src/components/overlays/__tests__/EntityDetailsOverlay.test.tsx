/**
 * @jest-environment jsdom
 */

/**
 * Tests for the shared body of the person and project detail overlays.
 *
 * PersonDetailsOverlay and ProjectDetailsOverlay were 766 lines with the same
 * frame written twice. These pin the parts that are easy to get wrong when
 * collapsing them: the debounced auto-save, the extra-field hook projects use
 * for their category, and the todo grouping the two entities do differently.
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import { EntityDetailsOverlay, EntityTodoGroup } from "../EntityDetailsOverlay";
import { PersonModel } from "@/models/PersonModel";
import { Person, getPersonId } from "@/types/person";
import { defaultMarkerColors } from "@/types/markerColors";
import { getTimestamp } from "@/types/time";

// The grouping logic is what is under test here, not how one todo renders.
jest.mock("@/components/items/TodoListItem", () => ({
  TodoListItem: ({ todo }: { todo: { id: string } }) => <div data-testid="todo">{todo.id}</div>,
}));

// The overlay renders two of these -- the context editor and the comment
// composer inside ActivitySection -- so key the stub on its placeholder.
jest.mock("@/components/input/RichTextEditor", () => ({
  __esModule: true,
  default: ({ onBlur, placeholder }: { onBlur?: (html: string) => void; placeholder?: string }) => (
    <textarea data-testid={placeholder} onBlur={(e) => onBlur?.(e.target.value)} />
  ),
}));

const makePerson = (overrides: Partial<Person> = {}): PersonModel =>
  new PersonModel({
    id: getPersonId("Marcel"),
    name: "Marcel",
    alternatives: [],
    comments: [],
    activity: [],
    createdAt: getTimestamp(0),
    ...overrides,
  } as Person);

const noop = () => {};

const baseProps = {
  entityTypeName: "Person",
  markerBadges: null,
  focusRingClass: "focus:ring-blue-500",
  defaultColor: "#000000",
  alternativesPlaceholder: "alternatives",
  createNoteLabel: "Create Note",
  todoGroups: [] as EntityTodoGroup[],
  onClose: noop,
  onDelete: noop,
  onAddComment: noop,
  onEditComment: noop,
  onDeleteComment: noop,
  markerColors: defaultMarkerColors,
  linkPatterns: [],
  notes: [],
  availablePriorities: [],
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("auto-save", () => {
  it("does not save while nothing has changed", () => {
    const onUpdate = jest.fn();
    render(<EntityDetailsOverlay entity={makePerson()} onUpdate={onUpdate} {...baseProps} />);

    act(() => void jest.advanceTimersByTime(2000));

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("saves an edited name after the debounce, not before", () => {
    const onUpdate = jest.fn();
    render(<EntityDetailsOverlay entity={makePerson()} onUpdate={onUpdate} {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText("Person name"), { target: { value: "Marcel E" } });

    act(() => void jest.advanceTimersByTime(400));
    expect(onUpdate).not.toHaveBeenCalled();

    act(() => void jest.advanceTimersByTime(200));
    expect(onUpdate).toHaveBeenCalledWith(getPersonId("Marcel"), expect.objectContaining({ name: "Marcel E" }));
  });

  it("commits the context editor on blur without waiting for the debounce", () => {
    const onUpdate = jest.fn();
    render(<EntityDetailsOverlay entity={makePerson()} onUpdate={onUpdate} {...baseProps} />);

    fireEvent.blur(screen.getByTestId("Add context..."), { target: { value: "some context" } });

    expect(onUpdate).toHaveBeenCalledWith(getPersonId("Marcel"), expect.objectContaining({ context: "some context" }));
  });
});

describe("extra field", () => {
  const withExtra = (value: string, onUpdate: jest.Mock) => (
    <EntityDetailsOverlay
      entity={makePerson()}
      onUpdate={onUpdate}
      {...baseProps}
      extra={{ fields: <span data-testid="extra" />, updates: { context: value }, changed: value !== "" }}
    />
  );

  it("renders the extra field and saves its value", () => {
    const onUpdate = jest.fn();
    render(withExtra("first", onUpdate));

    expect(screen.getByTestId("extra")).toBeDefined();
    act(() => void jest.advanceTimersByTime(600));
    expect(onUpdate).toHaveBeenCalledWith(getPersonId("Marcel"), expect.objectContaining({ context: "first" }));
  });

  it("saves the newest value when the extra field changes twice inside one debounce", () => {
    const onUpdate = jest.fn();
    const { rerender } = render(withExtra("first", onUpdate));

    act(() => void jest.advanceTimersByTime(200));
    rerender(withExtra("second", onUpdate));
    act(() => void jest.advanceTimersByTime(600));

    // `changed` stays true across both edits, so depending on it alone would
    // leave the first render's timer to fire and persist "first".
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(getPersonId("Marcel"), expect.objectContaining({ context: "second" }));
  });
});

describe("todo groups", () => {
  const group = (label: string, count: number): EntityTodoGroup => ({
    label,
    headingClass: "",
    todos: Array.from({ length: count }, (_, i) => ({ id: `${label}-${i}` })) as never,
  });

  it("renders no todo section when every group is empty", () => {
    render(
      <EntityDetailsOverlay
        entity={makePerson()}
        onUpdate={noop}
        {...baseProps}
        todoGroups={[group("Assigned", 0)]}
        onOpenTodo={noop}
      />,
    );

    expect(screen.queryByText(/✅ Todos/)).toBeNull();
  });

  it("skips empty groups and totals the rest", () => {
    render(
      <EntityDetailsOverlay
        entity={makePerson()}
        onUpdate={noop}
        {...baseProps}
        todoGroups={[group("Assigned", 2), group("Sourced", 0), group("Mentioned", 1)]}
        onOpenTodo={noop}
      />,
    );

    expect(screen.getByText("✅ Todos (3)")).toBeDefined();
    expect(screen.getByText("Assigned (2)")).toBeDefined();
    expect(screen.getByText("Mentioned (1)")).toBeDefined();
    expect(screen.queryByText(/^Sourced/)).toBeNull();
  });

  it("hides the todo section when there is no way to open a todo", () => {
    render(
      <EntityDetailsOverlay entity={makePerson()} onUpdate={noop} {...baseProps} todoGroups={[group("Assigned", 2)]} />,
    );

    expect(screen.queryByText(/✅ Todos/)).toBeNull();
  });
});
