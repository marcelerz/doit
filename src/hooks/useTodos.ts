"use client";

import { useState, useEffect, useCallback } from "react";
import { Todo, TodoMetadata } from "@/types/todo";
import { migrateTodos, checkAndUpdateVersion, migrateSettings } from "@/utils/migrations";
import { defaultSettings } from "@/types/settings";

const STORAGE_KEY = "doit-todos";
const SETTINGS_KEY = "doit-settings";

export type UndoAction = {
  type: "delete" | "complete" | "archive" | "uncomplete";
  todo: Todo;
  previousState?: Todo;
  timestamp: number;
};

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);

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
        setTodos(migratedTodos);

        // If migration was needed, save the migrated data immediately
        if (migrationNeeded) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedTodos));
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      } catch (error) {
        console.error("Failed to save todos:", error);
      }
    }
  }, [todos, isLoaded]);

  // Clear any pending undo timeout
  const clearUndoTimeout = useCallback(() => {
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
    }
  }, [undoTimeoutId]);

  // Execute the pending action (actually delete after timeout)
  const executePendingAction = useCallback(() => {
    if (undoAction?.type === "delete") {
      setTodos((prev) => prev.filter((todo) => todo.id !== undoAction.todo.id));
    }
    setUndoAction(null);
    clearUndoTimeout();
  }, [undoAction, clearUndoTimeout]);

  // Undo the last action
  const undo = useCallback(() => {
    if (!undoAction) return;

    clearUndoTimeout();

    if (undoAction.type === "delete") {
      // Restore the deleted todo
      setTodos((prev) => [undoAction.todo, ...prev]);
    } else if (undoAction.previousState) {
      // Restore previous state for toggle/archive
      setTodos((prev) => prev.map((todo) => (todo.id === undoAction.todo.id ? undoAction.previousState! : todo)));
    }

    setUndoAction(null);
  }, [undoAction, clearUndoTimeout]);

  // Dismiss notification without undoing
  const dismissUndo = useCallback(() => {
    clearUndoTimeout();
    executePendingAction();
  }, [clearUndoTimeout, executePendingAction]);

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
    clearUndoTimeout();

    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          const previousState = { ...todo };
          const newState: "active" | "completed" = todo.state === "completed" ? "active" : "completed";
          const now = Date.now();
          const updatedTodo: Todo = {
            ...todo,
            state: newState,
            completedAt: newState === "completed" ? now : undefined,
            archivedAt: undefined,
            deletedAt: undefined,
            updatedAt: now,
          };

          // Set up undo action
          const action: UndoAction = {
            type: newState === "completed" ? "complete" : "uncomplete",
            todo: updatedTodo,
            previousState,
            timestamp: now,
          };
          setUndoAction(action);

          const timeoutId = setTimeout(() => {
            setUndoAction(null);
          }, 10000);
          setUndoTimeoutId(timeoutId);

          return updatedTodo;
        }
        return todo;
      }),
    );
  };

  const deleteTodo = (id: string) => {
    clearUndoTimeout();

    const todoToDelete = todos.find((t) => t.id === id);
    if (!todoToDelete) return;

    // Mark as deleted with timestamp
    const now = Date.now();
    const deletedTodo: Todo = {
      ...todoToDelete,
      state: "deleted",
      deletedAt: now,
      updatedAt: now,
    };

    // Update the todo to deleted state (keeps it in the list but hidden)
    setTodos((prev) => prev.map((todo) => (todo.id === id ? deletedTodo : todo)));

    const action: UndoAction = {
      type: "delete",
      todo: deletedTodo,
      previousState: todoToDelete,
      timestamp: now,
    };
    setUndoAction(action);

    const timeoutId = setTimeout(() => {
      executePendingAction();
    }, 10000);
    setUndoTimeoutId(timeoutId);
  };

  const archiveTodo = (id: string) => {
    clearUndoTimeout();

    const now = Date.now();
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          const previousState = { ...todo };
          const updatedTodo: Todo = {
            ...todo,
            state: "archived",
            archivedAt: now,
            updatedAt: now,
            deletedAt: undefined,
          };

          // Set up undo action
          const action: UndoAction = {
            type: "archive",
            todo: updatedTodo,
            previousState,
            timestamp: now,
          };
          setUndoAction(action);

          const timeoutId = setTimeout(() => {
            setUndoAction(null);
          }, 10000);
          setUndoTimeoutId(timeoutId);

          return updatedTodo;
        }
        return todo;
      }),
    );
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
    undoAction,
    undo,
    dismissUndo,
  };
}
