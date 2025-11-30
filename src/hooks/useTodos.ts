"use client";

import { useState, useEffect } from "react";
import { Todo, TodoMetadata } from "@/types/todo";

const STORAGE_KEY = "doit-todos";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load todos from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const loadedTodos = JSON.parse(stored);
        // Migrate old todos without metadata
        const migratedTodos = loadedTodos.map((todo: any) => ({
          ...todo,
          plainText: todo.plainText || todo.text,
          metadata: todo.metadata || {
            assignedPeople: [],
            sourcePeople: [],
            mentionedPeople: [],
            projects: [],
          },
        }));
        setTodos(migratedTodos);
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
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      plainText,
      completed: false,
      createdAt: Date.now(),
      metadata,
    };
    setTodos((prev) => [newTodo, ...prev]);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          const newCompleted = !todo.completed;
          return {
            ...todo,
            completed: newCompleted,
            completedAt: newCompleted ? Date.now() : undefined,
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
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, text, plainText, metadata } : todo)));
  };

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    isLoaded,
  };
}
