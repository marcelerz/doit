/**
 * @jest-environment jsdom
 */

/**
 * Characterization tests for useDragReorder, the drag-and-drop state behind
 * the list view's reorder mode. The hook had no test at all.
 *
 * In every fixture sortOrder follows the array position, so the order the hook
 * is handed, the manual order and the order on screen are one and the same.
 * What happens when they differ is the open defect in U0721: it.todo, not pinned.
 */

import type { DragEvent } from "react";
import { renderHook, act } from "@testing-library/react";
import { useDragReorder } from "../useDragReorder";
import { TodoModel } from "@/models/TodoModel";
import { SettingsModel, createSettingsModel, resetSettingsModel_DONOTUSE } from "@/models/SettingsModel";
import { defaultSettings } from "@/types/settings";
import { Todo, TodoId, TodoState, getTodoId } from "@/types/todo";
import { getTimestamp } from "@/types/time";

let settingsModel: SettingsModel;
beforeEach(() => {
  resetSettingsModel_DONOTUSE();
  settingsModel = createSettingsModel(defaultSettings);
});

const [a, b, c, d, done, archived, stranger] = ["a", "b", "c", "d", "done", "archived", "stranger"].map(getTodoId);
const nobody = { assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [], tags: [] };
const nothing = { context: "", dependencies: [], comments: [], activity: [], subtasks: [] };
const createdAt = getTimestamp(new Date(2026, 0, 15, 9, 0, 0).getTime());

const makeTodo = (id: string, sortOrder: number, state: TodoState = "active"): TodoModel => {
  const raw: Todo = { ...nobody, ...nothing, id: getTodoId(id), text: id, plainText: id, state, sortOrder, createdAt };
  return new TodoModel(raw, settingsModel);
};

const fourActive = () => ["a", "b", "c", "d"].map((id, index) => makeTodo(id, index));

const mount = (todos: TodoModel[]) => {
  const reorderTodos = jest.fn();
  const { result } = renderHook(() => useDragReorder({ todos, reorderTodos }));
  return { result, reorderTodos };
};
type Hook = ReturnType<typeof mount>["result"];

// The hook touches only preventDefault and dataTransfer, so this stands in for
// a browser DragEvent.
const fakeEvent = () => ({ preventDefault: jest.fn(), dataTransfer: { setData: jest.fn(), effectAllowed: "none" } });
const asDragEvent = (event: ReturnType<typeof fakeEvent>) => event as unknown as DragEvent;

const startDrag = (result: Hook, source: TodoId, over?: TodoId) => {
  act(() => result.current.handleDragStart(asDragEvent(fakeEvent()), source));
  if (over !== undefined) act(() => result.current.handleDragOver(asDragEvent(fakeEvent()), over));
};
const dragState = (result: Hook) => ({ dragged: result.current.draggedTodoId, over: result.current.dragOverTodoId });

describe("drag mode", () => {
  it("starts switched off with nothing dragged, and toggleDragMode switches it on and off again", () => {
    const { result } = mount(fourActive());
    expect(result.current.isDragMode).toBe(false);
    expect(dragState(result)).toEqual({ dragged: null, over: null });

    act(() => result.current.toggleDragMode());
    expect(result.current.isDragMode).toBe(true);

    act(() => result.current.toggleDragMode());
    expect(result.current.isDragMode).toBe(false);
  });

  it("toggleDragMode abandons a drag that is in progress", () => {
    const { result } = mount(fourActive());
    startDrag(result, a, b);

    act(() => result.current.toggleDragMode());

    expect(result.current.isDragMode).toBe(true);
    expect(dragState(result)).toEqual({ dragged: null, over: null });
  });
});

describe("dragging", () => {
  it("handleDragStart records the dragged todo and puts its id in the drag payload", () => {
    const { result } = mount(fourActive());
    const event = fakeEvent();

    act(() => result.current.handleDragStart(asDragEvent(event), a));

    expect(dragState(result)).toEqual({ dragged: a, over: null });
    expect(event.dataTransfer.setData).toHaveBeenCalledWith("text/plain", a);
    expect(event.dataTransfer.effectAllowed).toBe("move");
  });

  it("handleDragOver marks another row as the drop target and allows the drop", () => {
    const { result } = mount(fourActive());
    const event = fakeEvent();
    startDrag(result, a);

    act(() => result.current.handleDragOver(asDragEvent(event), b));

    expect(dragState(result)).toEqual({ dragged: a, over: b });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("handleDragOver marks nothing while no drag has started, nor for the row being dragged", () => {
    const { result } = mount(fourActive());

    act(() => result.current.handleDragOver(asDragEvent(fakeEvent()), b));
    expect(dragState(result)).toEqual({ dragged: null, over: null });

    startDrag(result, a, a);
    expect(dragState(result)).toEqual({ dragged: a, over: null });
  });

  it("handleDragLeave clears the drop target and keeps the drag going", () => {
    const { result } = mount(fourActive());
    startDrag(result, a, b);

    act(() => result.current.handleDragLeave());

    expect(dragState(result)).toEqual({ dragged: a, over: null });
  });

  it("handleDragEnd clears both the dragged todo and the drop target", () => {
    const { result } = mount(fourActive());
    startDrag(result, a, b);

    act(() => result.current.handleDragEnd());

    expect(dragState(result)).toEqual({ dragged: null, over: null });
  });
});

describe("dropping", () => {
  // Completed and archived rows sit between the active ones.
  const mixed = () => [
    makeTodo("a", 0),
    makeTodo("done", 1, "completed"),
    makeTodo("b", 2),
    makeTodo("archived", 3, "archived"),
    makeTodo("c", 4),
  ];

  const dropOn = (todos: TodoModel[], source: TodoId | null, target: TodoId) => {
    const hook = mount(todos);
    const event = fakeEvent();
    if (source !== null) startDrag(hook.result, source, target);
    act(() => hook.result.current.handleDrop(asDragEvent(event), target));
    return { ...hook, event };
  };

  it.each([
    ["down", a, c, [b, c, a, d]],
    ["up", d, b, [a, d, b, c]],
  ])("moves a todo dragged %s the list to the target's position and ends the drag", (_label, source, target, order) => {
    const { result, reorderTodos, event } = dropOn(fourActive(), source, target);

    expect(reorderTodos).toHaveBeenCalledTimes(1);
    expect(reorderTodos).toHaveBeenCalledWith(order);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(dragState(result)).toEqual({ dragged: null, over: null });
  });

  it("orders the active todos only, leaving completed and archived ones out", () => {
    const { reorderTodos } = dropOn(mixed(), c, a);

    expect(reorderTodos).toHaveBeenCalledWith([c, a, b]);
  });

  it.each([
    ["a todo is dropped on itself", a, a],
    ["the target is not in the list", a, stranger],
    ["the target is a completed todo", a, done],
    ["the target is an archived todo", a, archived],
    ["no drag has started", null, b],
  ])("reorders nothing and leaves no drag behind when %s", (_label, source, target) => {
    const { result, reorderTodos, event } = dropOn(mixed(), source, target);

    expect(reorderTodos).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(dragState(result)).toEqual({ dragged: null, over: null });
  });

  it.todo("takes drop positions from the order on screen, not the todos prop -- ListView passes its raw list (U0721)");
  it.todo("lands a second drag where it was dropped: A,B,C,D, then D onto A, then C onto A, gives D,C,A,B (U0721)");
  it.todo("leaves the stored manual order alone when the list is sorted by anything but Manual (U0721)");
});
