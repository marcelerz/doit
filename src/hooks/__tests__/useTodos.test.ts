/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { getKanbanStateId } from "@/types/kanbanState";
import { useTodos } from "../useTodos";

// Polyfill structuredClone for Node.js test environment
if (typeof structuredClone === "undefined") {
  (global as unknown as Record<string, unknown>).structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}

// Mock storage
jest.mock("@/storage/storage", () => ({
  STORAGE_KEYS: { TODOS: "doit-todos", SETTINGS: "doit-settings" },
  loadFromStorage: jest.fn().mockResolvedValue([]),
  saveToStorage: jest.fn().mockResolvedValue(undefined),
  waitForStorageInit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/storage/migrations", () => ({
  migrateTodos: jest.fn((todos) => todos),
  checkAndUpdateVersion: jest.fn().mockReturnValue(false),
  migrateSettings: jest.fn((settings) => settings),
}));

// Import mocks after setup
import { loadFromStorage, saveToStorage } from "@/storage/storage";
import { defaultSettings } from "@/types/settings";
import { getTodoId, getSubtaskId, TodoMetadata } from "@/types/todo";
import { getCommentId } from "@/types/types";
import { getTimestamp } from "@/types/time";

// Helper to create default metadata for tests
const createMetadata = (overrides: Partial<TodoMetadata> = {}): TodoMetadata => ({
  assignedPeople: [],
  sourcePeople: [],
  mentionedPeople: [],
  projects: [],
  ...overrides,
});

describe("useTodos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
      if (key === "doit-settings") return Promise.resolve(defaultSettings);
      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initialization", () => {
    it("should load todos from storage on mount", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test todo",
          plainText: "Test todo",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.todos).toHaveLength(1);
    });

    it("should filter out deleted todos on load", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Active",
          plainText: "Active",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
        {
          id: "todo-2",
          text: "Deleted",
          plainText: "Deleted",
          state: "deleted",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].text).toBe("Active");
    });

    it("should start with isLoaded false", () => {
      const { result } = renderHook(() => useTodos());
      expect(result.current.isLoaded).toBe(false);
    });
  });

  describe("addTodo", () => {
    it("should add a new todo", async () => {
      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.addTodo("New todo", "New todo", createMetadata());
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].text).toBe("New todo");
      expect(result.current.todos[0].state).toBe("active");
    });

    it("should add todo with metadata", async () => {
      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.addTodo("Tagged todo", "Tagged todo", createMetadata({
          tags: ["important", "work"],
        }));
      });

      expect(result.current.todos[0].tags).toHaveLength(2);
    });

    it("should add created activity", async () => {
      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.addTodo("Test", "Test", createMetadata());
      });

      // Access raw activity from the model
      const todo = result.current.todos[0];
      expect(todo.raw.activity).toHaveLength(1);
      expect(todo.raw.activity[0].type).toBe("created");
    });
  });

  describe("duplicateTodo", () => {
    it("should duplicate an existing todo", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Original",
          plainText: "Original",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: ["tag1"],
          projects: ["proj-1"],
          comments: [{ commentId: "c-1", history: [] }],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.duplicateTodo(getTodoId("todo-1"));
      });

      expect(result.current.todos).toHaveLength(2);
      expect(result.current.todos[0].text).toBe("Original");
      expect(result.current.todos[0].comments).toEqual([]); // Comments not copied
      expect(result.current.todos[0].dependencies).toEqual([]); // Dependencies cleared
    });
  });

  describe("recurring lifecycle", () => {
    const recurringTodo = (overrides: Record<string, unknown> = {}) => ({
      id: "todo-r",
      text: "Standup ~daily",
      plainText: "Standup",
      state: "active",
      recurring: "daily",
      dueDate: new Date(2026, 0, 15, 9, 0).getTime(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      comments: [],
      activity: [],
      subtasks: [],
      ...overrides,
    });

    const mountWith = async (todos: unknown[]) => {
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(todos);
      });
      const { result } = renderHook(() => useTodos());
      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });
      return result;
    };

    it("spawns the next occurrence when completed", async () => {
      const result = await mountWith([recurringTodo()]);
      act(() => result.current.toggleTodo(getTodoId("todo-r")));

      const active = result.current.todos.filter((t) => t.state === "active");
      expect(active).toHaveLength(1);
      expect(active[0].id).not.toBe("todo-r");
    });

    it("does not leave the spawned instance behind when the completion is undone", async () => {
      const result = await mountWith([recurringTodo()]);
      act(() => result.current.toggleTodo(getTodoId("todo-r")));
      expect(result.current.todos).toHaveLength(2);

      act(() => result.current.undo(result.current.undoActions[0].id));

      // Previously the original was restored and the spawn stayed, leaving two
      // active copies of the same task.
      const active = result.current.todos.filter((t) => t.state === "active");
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe("todo-r");
    });

    it("does not carry the completed task's board column onto the next instance", async () => {
      const result = await mountWith([recurringTodo({ workflowState: "review" })]);
      act(() => result.current.toggleTodo(getTodoId("todo-r")));

      const spawned = result.current.todos.find((t) => t.id !== "todo-r");
      expect(spawned?.workflowState).toBeUndefined();
    });
    describe("completing by dragging to a Kanban column", () => {
      const KANBAN_STATES = [
        { id: getKanbanStateId("backlog"), name: "Backlog", mapsToTodoState: "active" },
        { id: getKanbanStateId("done"), name: "Done", mapsToTodoState: "completed" },
      ];

      it("spawns the next occurrence, as the checkbox does", async () => {
        const result = await mountWith([recurringTodo({ workflowState: "backlog" })]);

        act(() => {
          result.current.setWorkflowState(getTodoId("todo-r"), getKanbanStateId("done"), KANBAN_STATES);
        });

        expect(result.current.todos.find((t) => t.id === "todo-r")?.state).toBe("completed");
        const active = result.current.todos.filter((t) => t.state === "active");
        expect(active).toHaveLength(1);
        expect(active[0].id).not.toBe("todo-r");
      });

      it("refuses a task whose dependency is unfinished, as the checkbox does", async () => {
        const blocker = {
          id: "todo-a",
          text: "Blocker",
          plainText: "Blocker",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        };
        const blocked = {
          ...blocker,
          id: "todo-b",
          text: "Blocked",
          plainText: "Blocked",
          dependencies: ["todo-a"],
          workflowState: "backlog",
        };
        const result = await mountWith([blocker, blocked]);

        let accepted: boolean | undefined;
        act(() => {
          accepted = result.current.setWorkflowState(
            getTodoId("todo-b"),
            getKanbanStateId("done"),
            KANBAN_STATES,
          );
        });

        expect(accepted).toBe(false);
        expect(result.current.todos.find((t) => t.id === "todo-b")?.state).toBe("active");
      });
    });
  });

  describe("toggleTodo", () => {
    it("should toggle active todo to completed", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.toggleTodo(getTodoId("todo-1"));
      });

      expect(result.current.todos[0].state).toBe("completed");
      expect(result.current.todos[0].completedAt).toBeDefined();
    });

    it("should toggle completed todo back to active", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "completed",
          completedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.toggleTodo(getTodoId("todo-1"));
      });

      expect(result.current.todos[0].state).toBe("active");
      expect(result.current.todos[0].completedAt).toBeUndefined();
    });

    it("should create undo action when toggling", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.toggleTodo(getTodoId("todo-1"));
      });

      expect(result.current.undoActions).toHaveLength(1);
      expect(result.current.undoActions[0].type).toBe("complete");
    });
  });

  describe("deleteTodo", () => {
    it("should mark todo as deleted", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.deleteTodo(getTodoId("todo-1"));
      });

      // Todo is marked as deleted but still in the list (for undo)
      expect(result.current.undoActions).toHaveLength(1);
      expect(result.current.undoActions[0].type).toBe("delete");
    });
  });

  describe("archiveTodo", () => {
    it("should archive a todo", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "completed",
          completedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.archiveTodo(getTodoId("todo-1"));
      });

      expect(result.current.todos[0].state).toBe("archived");
      expect(result.current.todos[0].archivedAt).toBeDefined();
    });
  });

  describe("unarchiveTodo", () => {
    it("should unarchive to completed if was completed", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "archived",
          completedAt: Date.now(),
          archivedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.unarchiveTodo(getTodoId("todo-1"));
      });

      expect(result.current.todos[0].state).toBe("completed");
      expect(result.current.todos[0].archivedAt).toBeUndefined();
    });

    it("should unarchive to active if was not completed", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "archived",
          archivedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.unarchiveTodo(getTodoId("todo-1"));
      });

      expect(result.current.todos[0].state).toBe("active");
    });
  });

  describe("editTodo", () => {
    it("should edit a todo", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Original",
          plainText: "Original",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.editTodo(getTodoId("todo-1"), "Updated", "Updated", {
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          tags: [],
          dependencies: [],
        });
      });

      expect(result.current.todos[0].text).toBe("Updated");
    });
  });

  describe("comment operations", () => {
    it("should add a comment to a todo", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.addTodoComment(getTodoId("todo-1"), "This is a comment");
      });

      expect(result.current.todos[0].raw.comments).toHaveLength(1);
      expect(result.current.todos[0].raw.comments[0].history[0].content).toBe("This is a comment");
    });

    it("should edit a todo comment", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [{ commentId: "comment-1", history: [{ timestamp: Date.now(), content: "Original" }] }],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.editTodoComment(getTodoId("todo-1"), getCommentId("comment-1"), "Updated");
      });

      expect(result.current.todos[0].raw.comments[0].history).toHaveLength(2);
      expect(result.current.todos[0].raw.comments[0].history[1].content).toBe("Updated");
    });

    it("should delete a todo comment", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [
            { commentId: "comment-1", history: [{ timestamp: Date.now(), content: "Comment 1" }] },
            { commentId: "comment-2", history: [{ timestamp: Date.now(), content: "Comment 2" }] },
          ],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.deleteTodoComment(getTodoId("todo-1"), getCommentId("comment-1"));
      });

      expect(result.current.todos[0].raw.comments).toHaveLength(1);
      expect(result.current.todos[0].raw.comments[0].commentId).toBe("comment-2");
    });
  });

  describe("subtask operations", () => {
    it("should add a subtask to a todo", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.addSubtask(getTodoId("todo-1"), "Subtask 1");
      });

      expect(result.current.todos[0].raw.subtasks).toHaveLength(1);
      expect(result.current.todos[0].raw.subtasks[0].text).toBe("Subtask 1");
    });

    it("should toggle a subtask", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [{ id: "subtask-1", text: "Subtask", completed: false, order: 0 }],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.toggleSubtask(getTodoId("todo-1"), getSubtaskId("subtask-1"));
      });

      expect(result.current.todos[0].raw.subtasks[0].completed).toBe(true);
    });

    it("should edit a subtask", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [{ id: "subtask-1", text: "Original", completed: false, order: 0 }],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.editSubtask(getTodoId("todo-1"), getSubtaskId("subtask-1"), "Updated");
      });

      expect(result.current.todos[0].raw.subtasks[0].text).toBe("Updated");
    });

    it("should delete a subtask", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [
            { id: "subtask-1", text: "Subtask 1", completed: false, order: 0 },
            { id: "subtask-2", text: "Subtask 2", completed: false, order: 1 },
          ],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.deleteSubtask(getTodoId("todo-1"), getSubtaskId("subtask-1"));
      });

      expect(result.current.todos[0].raw.subtasks).toHaveLength(1);
      expect(result.current.todos[0].raw.subtasks[0].id).toBe("subtask-2");
    });
  });

  describe("undo operations", () => {
    it("should undo a toggle", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.toggleTodo(getTodoId("todo-1"));
      });

      expect(result.current.todos[0].state).toBe("completed");

      act(() => {
        result.current.undo(result.current.undoActions[0].id);
      });

      expect(result.current.todos[0].state).toBe("active");
    });

    it("should dismiss undo action", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "Test",
          plainText: "Test",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.toggleTodo(getTodoId("todo-1"));
      });

      const actionId = result.current.undoActions[0].id;

      act(() => {
        result.current.dismissUndo(actionId);
      });

      // Run timers for fade out
      act(() => {
        jest.runAllTimers();
      });

      // After dismiss and timeout, action should be removed
      expect(result.current.undoActions.find((a) => a.id === actionId)).toBeUndefined();
    });
  });

  describe("reorderTodos", () => {
    it("should reorder todos", async () => {
      const existingTodos = [
        {
          id: "todo-1",
          text: "First",
          plainText: "First",
          state: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          activity: [],
          subtasks: [],
        },
        {
          id: "todo-2",
          text: "Second",
          plainText: "Second",
          state: "active",
          createdAt: Date.now() + 1,
          updatedAt: Date.now() + 1,
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];
      (loadFromStorage as jest.Mock).mockImplementation((key: string) => {
        if (key === "doit-settings") return Promise.resolve(defaultSettings);
        return Promise.resolve(existingTodos);
      });

      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      act(() => {
        result.current.reorderTodos([getTodoId("todo-2"), getTodoId("todo-1")]);
      });

      // Note: The hook may preserve the model order or update it
      // This tests the function call doesn't error
      expect(result.current.todos).toHaveLength(2);
    });
  });

  describe("importTodos", () => {
    it("should import todos", async () => {
      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      const now = getTimestamp(Date.now());
      const todosToImport: Array<Omit<import("@/types/todo").Todo, "id">> = [
        {
          text: "Imported",
          plainText: "Imported",
          state: "active" as const,
          context: "",
          tags: [],
          dependencies: [],
          assignedPeople: [],
          sourcePeople: [],
          mentionedPeople: [],
          projects: [],
          createdAt: now,
          updatedAt: now,
          comments: [],
          activity: [],
          subtasks: [],
        },
      ];

      act(() => {
        result.current.importTodos(todosToImport);
      });

      expect(result.current.todos).toHaveLength(1);
    });
  });

  describe("storage integration", () => {
    it("should save to storage after changes", async () => {
      const { result } = renderHook(() => useTodos());

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      (saveToStorage as jest.Mock).mockClear();

      act(() => {
        result.current.addTodo("Test", "Test", createMetadata());
      });

      await act(async () => {
        jest.runAllTimers();
        await Promise.resolve();
      });

      expect(saveToStorage).toHaveBeenCalledWith("doit-todos", expect.any(Array));
    });
  });
});
