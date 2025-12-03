"use client";

import { useState, useEffect, useCallback } from "react";
import { Todo, TodoMetadata, ActivityEntry } from "@/types/todo";
import { migrateTodos, checkAndUpdateVersion, migrateSettings } from "@/utils/migrations";
import { defaultSettings } from "@/types/settings";
import { parseRecurringPattern, calculateNextOccurrence } from "@/utils/recurringParser";
import { areDependenciesSatisfied, getDependencyBlockMessage } from "@/utils/dependencyValidator";
import { createActivity, generateMetadataActivities } from "@/utils/activityLogger";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/utils/storage";

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
  const [dependencyBlockNotification, setDependencyBlockNotification] = useState<string | null>(null);

  // Load todos from storage on mount
  useEffect(() => {
    // Check if migration is needed
    const migrationNeeded = checkAndUpdateVersion();

    // Load settings first to use for migration
    let settings = defaultSettings;
    const storedSettings = loadFromStorage(STORAGE_KEYS.SETTINGS, defaultSettings);
    settings = migrateSettings(storedSettings);

    const loadedTodos = loadFromStorage<Todo[]>(STORAGE_KEYS.TODOS, []);
    const migratedTodos = migrateTodos(loadedTodos, settings);
    // Filter out any deleted todos
    const cleanedTodos = migratedTodos.filter((todo) => todo.state !== "deleted");
    setTodos(cleanedTodos);

    // If migration was needed or we removed deleted todos, save the cleaned data
    if (migrationNeeded || cleanedTodos.length !== loadedTodos.length) {
      saveToStorage(STORAGE_KEYS.TODOS, cleanedTodos);
    }

    setIsLoaded(true);
  }, []);

  // Save todos to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.TODOS, todos);
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
        // Restore the deleted todo with its previous state and add undelete activity
        if (action.previousState) {
          const restoredTodo: Todo = {
            ...action.previousState,
            activity: [...action.previousState.activity, createActivity("undeleted", "Task undeleted")],
          };
          setTodos((prev) => [restoredTodo, ...prev]);
        }
      } else if (action.previousState) {
        // Restore previous state for toggle/archive with appropriate activity
        setTodos((prev) =>
          prev.map((todo) => {
            if (todo.id === action.todo.id) {
              let activityType: ActivityEntry["type"];
              let description: string;

              if (action.type === "complete") {
                activityType = "uncompleted";
                description = "Completion undone";
              } else if (action.type === "uncomplete") {
                activityType = "completed";
                description = "Uncompletion undone";
              } else if (action.type === "archive") {
                activityType = "unarchived";
                description = "Archive undone";
              } else {
                return action.previousState!;
              }

              return {
                ...action.previousState!,
                activity: [...action.previousState!.activity, createActivity(activityType, description)],
              };
            }
            return todo;
          }),
        );
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
      activity: [createActivity("created", "Task created")],
    };
    setTodos((prev) => [newTodo, ...prev]);
  };

  const toggleTodo = (id: string) => {
    const todoToToggle = todos.find((t) => t.id === id);
    if (!todoToToggle) return;

    const newState: "active" | "completed" = todoToToggle.state === "completed" ? "active" : "completed";

    // Check dependencies before allowing completion
    if (newState === "completed" && todoToToggle.metadata.dependencies.length > 0) {
      const validation = areDependenciesSatisfied(todoToToggle.metadata.dependencies, todos);
      if (!validation.satisfied) {
        const message = getDependencyBlockMessage(validation.unsatisfiedTodos);
        setDependencyBlockNotification(message);
        // Clear notification after 5 seconds
        setTimeout(() => setDependencyBlockNotification(null), 5000);
        return; // Don't allow completion
      }
    }

    const previousState = JSON.parse(JSON.stringify(todoToToggle)); // Deep copy
    const now = Date.now();

    // Track activity
    const activity =
      newState === "completed"
        ? createActivity("completed", "Task completed")
        : createActivity("uncompleted", "Task marked as active");

    const updatedTodo: Todo = {
      ...todoToToggle,
      state: newState,
      completedAt: newState === "completed" ? now : undefined,
      archivedAt: undefined,
      deletedAt: undefined,
      updatedAt: now,
      activity: [...todoToToggle.activity, activity],
    };

    setTodos((prev) => prev.map((todo) => (todo.id === id ? updatedTodo : todo)));

    // If completing a recurring task, create a new instance
    if (newState === "completed" && todoToToggle.metadata.recurring) {
      const recurringPattern = parseRecurringPattern(todoToToggle.metadata.recurring);
      if (recurringPattern) {
        const nextDate = calculateNextOccurrence(recurringPattern, new Date());
        const nextDateString = nextDate.toISOString().split("T")[0]; // YYYY-MM-DD format

        // Create new todo with updated due date
        const newRecurringTodo: Todo = {
          ...todoToToggle,
          id: `todo-${now}-recurring`,
          state: "active",
          createdAt: now,
          updatedAt: now,
          completedAt: undefined,
          archivedAt: undefined,
          deletedAt: undefined,
          metadata: {
            ...todoToToggle.metadata,
            dueDate: nextDateString,
          },
          comments: [], // New instance starts with no comments
          activity: [createActivity("created", "Task created from recurring pattern")],
        };

        // Reconstruct text with new due date
        const parts: string[] = [todoToToggle.plainText];
        newRecurringTodo.metadata.assignedPeople.forEach((p) => parts.push(`@${p}`));
        newRecurringTodo.metadata.sourcePeople.forEach((p) => parts.push(`$${p}`));
        newRecurringTodo.metadata.mentionedPeople.forEach((p) => parts.push(`^${p}`));
        newRecurringTodo.metadata.projects.forEach((p) => parts.push(`#${p}`));
        if (newRecurringTodo.metadata.priority) parts.push(`!!${newRecurringTodo.metadata.priority}`);
        if (newRecurringTodo.metadata.dueDate) parts.push(`~${newRecurringTodo.metadata.dueDate}`);
        if (newRecurringTodo.metadata.duration) parts.push(`*${newRecurringTodo.metadata.duration}`);
        if (newRecurringTodo.metadata.recurring) parts.push(`%${newRecurringTodo.metadata.recurring}`);
        newRecurringTodo.text = parts.join(" ");

        // Add the new recurring todo to the list
        setTodos((prev) => [newRecurringTodo, ...prev]);
      }
    }

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
      activity: [...todoToDelete.activity, createActivity("deleted", "Task deleted")],
    };

    // Update the todo to deleted state (keeps it in the list but hidden)
    setTodos((prev) => prev.map((todo) => (todo.id === id ? deletedTodo : todo)));

    // Create undo action
    const actionId = `${now}-delete-${id}`;
    const timeoutId = setTimeout(() => {
      setUndoActions((prev) => {
        const action = prev.find((a) => a.id === actionId);
        if (action) {
          executePendingAction(action);
        }
        return prev;
      });
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

    // Check dependencies before allowing archive (only for active/incomplete todos)
    if (todoToArchive.state === "active" && todoToArchive.metadata.dependencies.length > 0) {
      const validation = areDependenciesSatisfied(todoToArchive.metadata.dependencies, todos);
      if (!validation.satisfied) {
        const message = getDependencyBlockMessage(validation.unsatisfiedTodos);
        setDependencyBlockNotification(message);
        // Clear notification after 5 seconds
        setTimeout(() => setDependencyBlockNotification(null), 5000);
        return; // Don't allow archive
      }
    }

    const previousState = JSON.parse(JSON.stringify(todoToArchive)); // Deep copy
    const now = Date.now();
    const updatedTodo: Todo = {
      ...todoToArchive,
      state: "archived",
      archivedAt: now,
      updatedAt: now,
      deletedAt: undefined,
      activity: [...todoToArchive.activity, createActivity("archived", "Task archived")],
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
            activity: [...todo.activity, createActivity("unarchived", "Task unarchived")],
          };
        }
        return todo;
      }),
    );
  };

  const editTodo = (id: string, text: string, plainText: string, metadata: TodoMetadata) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          // Track text edit and metadata changes
          const activities: ActivityEntry[] = [];

          // Check if text changed
          if (todo.plainText !== plainText) {
            activities.push(createActivity("edited", "Task text edited"));
          }

          // Check for metadata changes
          const metadataActivities = generateMetadataActivities(todo.metadata, metadata);
          activities.push(...metadataActivities);

          return {
            ...todo,
            text,
            plainText,
            metadata,
            updatedAt: Date.now(),
            activity: [...todo.activity, ...activities],
          };
        }
        return todo;
      }),
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
          return {
            ...todo,
            comments: [...todo.comments, newComment],
          };
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
          return {
            ...todo,
            comments: todo.comments.filter((c) => c.commentId !== commentId),
          };
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
    dependencyBlockNotification,
    undo,
    dismissUndo,
  };
}
