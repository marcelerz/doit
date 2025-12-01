"use client";

import { useState, useEffect, useCallback } from "react";
import { Todo, TodoMetadata } from "@/types/todo";
import { migrateTodos, checkAndUpdateVersion, migrateSettings } from "@/utils/migrations";
import { defaultSettings } from "@/types/settings";

const STORAGE_KEY = "doit-todos";
const SETTINGS_KEY = "doit-settings";

export type UndoAction = {
  id: string;
  type: "delete" | "complete" | "archive" | "uncomplete";
  todo: Todo;
  previousState?: Todo;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
};

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [undoActions, setUndoActions] = useState<UndoAction[]>([]);
  const [fadingOutIds, setFadingOutIds] = useState<Set<string>>(new Set());

  // Load todos from localStorage on mount
  useEffect(() => {
    try {
      // Check if migration is needed
      const migrationNeeded = checkAndUpdateVersion();

      // Load settings first to use for migration
      let settings = defaultSettings;
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        settings = migrateSettings(JSON.parse(storedSettings));
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const loadedTodos = JSON.parse(stored);
        const migratedTodos = migrateTodos(loadedTodos, settings);
        // Filter out any deleted todos
        const cleanedTodos = migratedTodos.filter((todo) => todo.state !== "deleted");
        setTodos(cleanedTodos);

        // If migration was needed or we removed deleted todos, save the cleaned data
        if (migrationNeeded || cleanedTodos.length !== migratedTodos.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedTodos));
        }
      }
    } catch (error) {
      console.error("Failed to load todos:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        // Filter out deleted todos before saving
        const todosToSave = todos.filter((todo) => todo.state !== "deleted");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todosToSave));
      } catch (error) {
        console.error("Failed to save todos:", error);
      }
    }
  }, [todos, isLoaded]);

  // Execute the pending action (actually delete after timeout)
  const executePendingAction = useCallback((action: UndoAction) => {
    if (action.type === "delete") {
      setTodos((prev) => prev.filter((todo) => todo.id !== action.todo.id));
    }
    // Start fade out animation
    setFadingOutIds((prev) => new Set(prev).add(action.id));
    // Wait for fade animation to complete before removing
    setTimeout(() => {
      setUndoActions((prev) => prev.filter((a) => a.id !== action.id));
      setFadingOutIds((prev) => {
        const next = new Set(prev);
        next.delete(action.id);
        return next;
      });
    }, 3000);
  }, []);

  // Undo a specific action
  const undo = useCallback(
    (actionId: string) => {
      const action = undoActions.find((a) => a.id === actionId);
      if (!action) return;

      // Clear the timeout for this action
      clearTimeout(action.timeoutId);

      if (action.type === "delete") {
        // Restore the deleted todo with its previous state
        if (action.previousState) {
          setTodos((prev) => [action.previousState!, ...prev]);
        }
      } else if (action.previousState) {
        // Restore previous state for toggle/archive
        setTodos((prev) => prev.map((todo) => (todo.id === action.todo.id ? action.previousState! : todo)));
      }

      // Remove this action from the queue
      setUndoActions((prev) => prev.filter((a) => a.id !== actionId));
    },
    [undoActions],
  );

  // Dismiss notification without undoing
  const dismissUndo = useCallback(
    (actionId: string) => {
      const action = undoActions.find((a) => a.id === actionId);
      if (!action) return;

      // Clear the timeout for this action
      clearTimeout(action.timeoutId);

      // Execute the action immediately with fade out
      executePendingAction(action);
    },
    [undoActions, executePendingAction],
  );

  const addTodo = (text: string, plainText: string, metadata: TodoMetadata) => {
    const now = Date.now();
    const newTodo: Todo = {
      id: now.toString(),
      text,
      plainText,
      state: "active",
      createdAt: now,
      updatedAt: now,
      metadata,
      comments: [],
    };
    setTodos((prev) => [newTodo, ...prev]);
  };

  const toggleTodo = (id: string) => {
    const todoToToggle = todos.find((t) => t.id === id);
    if (!todoToToggle) return;

    const previousState = JSON.parse(JSON.stringify(todoToToggle)); // Deep copy
    const newState: "active" | "completed" = todoToToggle.state === "completed" ? "active" : "completed";
    const now = Date.now();
    const updatedTodo: Todo = {
      ...todoToToggle,
      state: newState,
      completedAt: newState === "completed" ? now : undefined,
      archivedAt: undefined,
      deletedAt: undefined,
      updatedAt: now,
    };

    setTodos((prev) => prev.map((todo) => (todo.id === id ? updatedTodo : todo)));

    // Create undo action
    const actionId = `${now}-toggle-${id}`;
    const timeoutId = setTimeout(() => {
      setUndoActions((prev) => prev.filter((a) => a.id !== actionId));
    }, 10000);

    const action: UndoAction = {
      id: actionId,
      type: newState === "completed" ? "complete" : "uncomplete",
      todo: updatedTodo,
      previousState,
      timestamp: now,
      timeoutId,
    };

    setUndoActions((prev) => [...prev, action]);
  };

  const deleteTodo = (id: string) => {
    const todoToDelete = todos.find((t) => t.id === id);
    if (!todoToDelete) return;

    const previousState = JSON.parse(JSON.stringify(todoToDelete)); // Deep copy
    const now = Date.now();
    const deletedTodo: Todo = {
      ...todoToDelete,
      state: "deleted",
      deletedAt: now,
      updatedAt: now,
    };

    // Update the todo to deleted state (keeps it in the list but hidden)
    setTodos((prev) => prev.map((todo) => (todo.id === id ? deletedTodo : todo)));

    // Create undo action
    const actionId = `${now}-delete-${id}`;
    const timeoutId = setTimeout(() => {
      const currentAction = undoActions.find((a) => a.id === actionId);
      if (currentAction) {
        executePendingAction(currentAction);
      }
    }, 10000);

    const action: UndoAction = {
      id: actionId,
      type: "delete",
      todo: deletedTodo,
      previousState,
      timestamp: now,
      timeoutId,
    };

    setUndoActions((prev) => [...prev, action]);
  };

  const archiveTodo = (id: string) => {
    const todoToArchive = todos.find((t) => t.id === id);
    if (!todoToArchive) return;

    const previousState = JSON.parse(JSON.stringify(todoToArchive)); // Deep copy
    const now = Date.now();
    const updatedTodo: Todo = {
      ...todoToArchive,
      state: "archived",
      archivedAt: now,
      updatedAt: now,
      deletedAt: undefined,
    };

    setTodos((prev) => prev.map((todo) => (todo.id === id ? updatedTodo : todo)));

    // Create undo action
    const actionId = `${now}-archive-${id}`;
    const timeoutId = setTimeout(() => {
      setUndoActions((prev) => prev.filter((a) => a.id !== actionId));
    }, 10000);

    const action: UndoAction = {
      id: actionId,
      type: "archive",
      todo: updatedTodo,
      previousState,
      timestamp: now,
      timeoutId,
    };

    setUndoActions((prev) => [...prev, action]);
  };

  const unarchiveTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          // If there's no completedAt timestamp, restore to active state
          // Otherwise restore to completed state
          const newState = todo.completedAt ? "completed" : "active";
          return {
            ...todo,
            state: newState,
            archivedAt: undefined,
            deletedAt: undefined,
            updatedAt: Date.now(),
          };
        }
        return todo;
      }),
    );
  };

  const editTodo = (id: string, text: string, plainText: string, metadata: TodoMetadata) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, text, plainText, metadata, updatedAt: Date.now() } : todo)),
    );
  };

  const addTodoComment = (todoId: string, content: string) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          const newComment = {
            commentId: Date.now(),
            history: [{ date: Date.now(), content }],
          };
          return { ...todo, comments: [...todo.comments, newComment] };
        }
        return todo;
      }),
    );
  };

  const editTodoComment = (todoId: string, commentId: number, content: string) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          return {
            ...todo,
            comments: todo.comments.map((comment) =>
              comment.commentId === commentId
                ? { ...comment, history: [...comment.history, { date: Date.now(), content }] }
                : comment,
            ),
          };
        }
        return todo;
      }),
    );
  };

  const deleteTodoComment = (todoId: string, commentId: number) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          return { ...todo, comments: todo.comments.filter((c) => c.commentId !== commentId) };
        }
        return todo;
      }),
    );
  };

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    archiveTodo,
    unarchiveTodo,
    editTodo,
    addTodoComment,
    editTodoComment,
    deleteTodoComment,
    isLoaded,
    undoActions,
    fadingOutIds,
    undo,
    dismissUndo,
  };
}
