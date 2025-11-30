"use client";

import { useState, useEffect } from "react";
import { Todo, TodoMetadata } from "@/types/todo";
import { migrateTodos, checkAndUpdateVersion, migrateSettings } from "@/utils/migrations";
import { defaultSettings } from "@/types/settings";

const STORAGE_KEY = "doit-todos";
const SETTINGS_KEY = "doit-settings";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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

  const addTodo = (text: string, plainText: string, metadata: TodoMetadata) => {
    const now = Date.now();
    const newTodo: Todo = {
      id: now.toString(),
      text,
      plainText,
      completed: false,
      createdAt: now,
      updatedAt: now,
      metadata,
      comments: [],
    };
    setTodos((prev) => [newTodo, ...prev]);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          const newCompleted = !todo.completed;
          const now = Date.now();
          return {
            ...todo,
            completed: newCompleted,
            completedAt: newCompleted ? now : undefined,
            updatedAt: now,
          };
        }
        return todo;
      }),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
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
    editTodo,
    addTodoComment,
    editTodoComment,
    deleteTodoComment,
    isLoaded,
  };
}
