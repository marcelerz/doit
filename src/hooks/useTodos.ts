"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { appendComment, amendComment, removeComment } from "@/utils/commentMutations";
import {
  Todo,
  TodoMetadata,
  TimeEntry,
  TodoState,
  TodoId,
  SubtaskId,
  TimeEntryId,
  getTodoId,
  getSubtaskId,
  getTimeEntryId,
  TodoActivityType,
  getTag,
} from "@/types/todo";
import {
  getTimestamp,
  getDurationSec,
  getDurationMin,
  Timestamp,
} from "@/types/time";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import { getSprintId } from "@/types/sprint";
import { KanbanStateId, getKanbanStateId } from "@/types/kanbanState";
import { parseDuration } from "@/utils/ganttScheduler";
import { ActivityEntry, CommentId } from "@/types/types";
import { migrateTodos, checkAndUpdateVersion } from "@/storage/migrations";
import { Settings } from "@/types/settings";
import { PriorityId } from "@/types/priority";
import {
  parseRecurringPattern,
  calculateNextOccurrence,
} from "@/utils/recurringParser";
import {
  createActivity,
  generateMetadataActivities,
} from "@/utils/activityLogger";
import { createSubtaskId } from "@/utils/idGenerator";
import {
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
} from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storage";
import { TodoModel, createTodoModels } from "@/models/TodoModel";
import { createSettingsModel } from "@/models/SettingsModel";
import { parseDate } from "@/utils/dateUtils";
import { useUndoableActions, UndoableAction } from "./useUndoableActions";
import { settingsStore, useSharedSettings } from "@/storage/settingsStore";
import { renameInRecord, EntityKind } from "@/utils/renameReferences";

/**
 * Find a priority ID by its name or alternatives.
 * Returns undefined if no matching priority is found.
 */
function findPriorityIdByName(
  name: string,
  settings: Settings,
): PriorityId | undefined {
  const lowerName = name.toLowerCase();
  const found = settings.priorities.find(
    (p) =>
      p.name.toLowerCase() === lowerName ||
      p.alternatives.some((alt) => alt.toLowerCase() === lowerName),
  );
  return found?.id;
}

/**
 * Convert TodoMetadata string values to typed Todo fields.
 * Note: This uses names as IDs temporarily. Proper ID resolution should happen
 * in the UI layer using EntityRegistry before calling addTodo/editTodo.
 */
function metadataToTodoFields(metadata: TodoMetadata, settings: Settings) {
  // Parse duration string to seconds
  let durationSec: number | undefined;
  if (metadata.duration) {
    const minutes = parseDuration(metadata.duration);
    durationSec = minutes * 60;
  }

  // Parse date string to timestamp
  let dueTimestamp: number | undefined;
  if (metadata.dueDate) {
    const parsed = parseDate(
      metadata.dueDate,
      settings.dateTime,
      settings.workHours,
    );
    if (parsed) {
      dueTimestamp = parsed.timestamp;
    }
  }

  return {
    // Arrays: convert string names to IDs (using names as IDs temporarily)
    assignedPeople: (metadata.assignedPeople || []).map((name) =>
      getPersonId(name),
    ),
    sourcePeople: (metadata.sourcePeople || []).map((name) =>
      getPersonId(name),
    ),
    mentionedPeople: (metadata.mentionedPeople || []).map((name) =>
      getPersonId(name),
    ),
    projects: (metadata.projects || []).map((name) => getProjectId(name)),
    tags: (metadata.tags || []).map((tag) => getTag(tag)),
    dependencies: (metadata.dependencies || []).map((id) => getTodoId(id)),
    // Singular fields
    priority: metadata.priority
      ? findPriorityIdByName(metadata.priority, settings)
      : undefined,
    dueDate: dueTimestamp ? getTimestamp(dueTimestamp) : undefined,
    duration: durationSec ? getDurationSec(durationSec) : undefined,
    recurring: metadata.recurring,
    sprint: metadata.sprint ? getSprintId(metadata.sprint) : undefined,
    context: metadata.context || "",
  };
}

/**
 * Reconstruct TodoMetadata from a Todo's typed fields for activity comparison.
 * This is the inverse of metadataToTodoFields - converts IDs back to string representation.
 */
function todoToMetadata(todo: Todo): TodoMetadata {
  return {
    assignedPeople: (todo.assignedPeople || []).map((id) => id as string),
    sourcePeople: (todo.sourcePeople || []).map((id) => id as string),
    mentionedPeople: (todo.mentionedPeople || []).map((id) => id as string),
    projects: (todo.projects || []).map((id) => id as string),
    tags: (todo.tags || []).map((tag) => tag as string),
    dependencies: (todo.dependencies || []).map((id) => id as string),
    priority: todo.priority as string | undefined,
    // Convert timestamp back to ISO string for comparison
    dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : undefined,
    // Convert seconds back to duration string (e.g., "30m", "2h")
    duration: todo.duration
      ? formatDurationFromSeconds(todo.duration)
      : undefined,
    recurring: todo.recurring,
    sprint: todo.sprint as string | undefined,
    context: todo.context || "",
  };
}

/**
 * Format duration in seconds to a human-readable string (e.g., "30m", "2h", "1h30m")
 */
function formatDurationFromSeconds(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${remainingMinutes}m`;
}

export type TodoUndoActionType =
  "delete" | "complete" | "archive" | "uncomplete";
export type UndoAction = UndoableAction<TodoUndoActionType, Todo>;

export function useTodos() {
  const [rawTodos, setRawTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [dependencyBlockNotification, setDependencyBlockNotification] =
    useState<string | null>(null);
  // Shared, not a private copy: this used to be one of four independent
  // settings states, three of which went stale after any settings edit.
  const { settings } = useSharedSettings();

  // Ref for notification timeout cleanup
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup notification timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Finalize handler for undo actions (called when timeout expires or dismissed)
  const handleFinalize = useCallback((action: UndoAction) => {
    if (action.type === "delete") {
      // Actually remove the deleted todo from storage
      setRawTodos((prev) =>
        prev.filter((todo) => todo.id !== action.entity.id),
      );
    }
    // Complete/archive/uncomplete actions don't need any finalization - the state is already updated
  }, []);

  // Undo handler for restoring previous state
  const handleUndo = useCallback((action: UndoAction) => {
    if (action.type === "delete") {
      // Restore the deleted todo with its previous state and add undelete activity
      if (action.previousState) {
        const restoredTodo: Todo = {
          ...action.previousState,
          activity: [
            ...action.previousState.activity,
            createActivity("undeleted", "Task undeleted"),
          ],
        };
        setRawTodos((prev) => [restoredTodo, ...prev]);
      }
    } else if (action.previousState) {
      // Restore previous state for toggle/archive with appropriate activity
      setRawTodos((prev) =>
        prev
          // Completing a recurring task spawns the next instance. Undoing the
          // completion left it behind, so the user ended up with two active
          // copies. The spawn records the todo it came from, so it can be
          // identified without extra bookkeeping. Only drop it if it is still
          // untouched -- one activity entry, its creation -- so an undo cannot
          // discard work the user did on it during the undo window.
          .filter(
            (todo) =>
              !(
                action.type === "complete" &&
                todo.recurringPreviousId === action.entity.id &&
                todo.state === "active" &&
                todo.activity.length === 1
              ),
          )
          .map((todo) => {
            if (todo.id === action.entity.id) {
              let activityType: ActivityEntry<TodoActivityType>["type"];
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
                activity: [
                  ...action.previousState!.activity,
                  createActivity(activityType, description),
                ],
              };
            }
            return todo;
          }),
      );
    }
  }, []);

  const { undoActions, fadingOutIds, createUndoAction, undo, dismissUndo } =
    useUndoableActions<TodoUndoActionType, Todo>({
      onFinalize: handleFinalize,
      onUndo: handleUndo,
    });

  // Create a SettingsModel from settings for use with TodoModel
  const settingsModel = useMemo(
    () => createSettingsModel(settings),
    [settings],
  );

  // Create TodoModel instances from raw todos
  const todos = useMemo(
    () => createTodoModels(rawTodos, settingsModel),
    [rawTodos, settingsModel],
  );

  // Load todos from storage on mount
  useEffect(() => {
    // Wait for storage to be initialized before loading data
    waitForStorageInit()
      .then(async () => {
        // Check if migration is needed (must await since it's async)
        const migrationNeeded = await checkAndUpdateVersion();

        // Settings come from the shared store, which owns loading and
        // migration; todos need the migrated settings to migrate against.
        await settingsStore.hydrate();
        const migratedSettings = settingsStore.get();
        const loadedTodos = await loadFromStorage<Todo[]>(
          STORAGE_KEYS.TODOS,
          [],
        );
        const migratedTodos = migrateTodos(loadedTodos, migratedSettings);
        // Filter out any deleted todos
        const cleanedTodos = migratedTodos.filter(
          (todo) => todo.state !== "deleted",
        );
        setRawTodos(cleanedTodos);

        // If migration was needed or we removed deleted todos, save the cleaned data
        if (migrationNeeded || cleanedTodos.length !== loadedTodos.length) {
          saveToStorage(STORAGE_KEYS.TODOS, cleanedTodos);
        }
      })
      .catch((error) => {
        // Without this the promise rejects unobserved, isLoaded stays false
        // forever and the app sits on its loading screen with no way out.
        console.error("Failed to load todos from storage:", error);
        setLoadError(error instanceof Error ? error : new Error(String(error)));
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  // Save todos to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.TODOS, rawTodos);
    }
  }, [rawTodos, isLoaded]);

  const addTodo = (
    text: string,
    plainText: string,
    metadata: TodoMetadata,
  ): TodoId => {
    const now = getTimestamp(Date.now());
    const fields = metadataToTodoFields(metadata, settings);

    // Create appropriate activity based on source
    let createdActivity;
    if (metadata.sourceNoteId) {
      // Todo created from a note's action item
      createdActivity = createActivity("created", "Task created from note", {
        sourceNoteId: metadata.sourceNoteId,
        sourceActionItemId: metadata.sourceActionItemId,
      });
    } else {
      createdActivity = createActivity("created", "Task created");
    }

    const newTodo: Todo = {
      id: TodoModel.createId(),
      text,
      plainText,
      state: "active",
      createdAt: now,
      updatedAt: now,
      context: fields.context,
      tags: fields.tags,
      dependencies: fields.dependencies,
      assignedPeople: fields.assignedPeople,
      sourcePeople: fields.sourcePeople,
      mentionedPeople: fields.mentionedPeople,
      projects: fields.projects,
      priority: fields.priority,
      dueDate: fields.dueDate,
      duration: fields.duration,
      recurring: fields.recurring,
      sprint: fields.sprint,
      // Source note tracking
      sourceNoteId: metadata.sourceNoteId,
      sourceActionItemId: metadata.sourceActionItemId,
      comments: [],
      activity: [createdActivity],
      subtasks: [],
    };
    setRawTodos((prev) => [newTodo, ...prev]);
    return newTodo.id;
  };

  const duplicateTodo = (id: string) => {
    const todoToDuplicate = rawTodos.find((t) => t.id === id);
    if (!todoToDuplicate) return;

    const now = getTimestamp(Date.now());
    const duplicatedTodo: Todo = {
      id: TodoModel.createId(),
      text: todoToDuplicate.text,
      plainText: todoToDuplicate.plainText,
      state: "active",
      createdAt: now,
      updatedAt: now,
      context: todoToDuplicate.context || "",
      tags: todoToDuplicate.tags || [],
      dependencies: [], // Clear dependencies for the duplicate
      assignedPeople: todoToDuplicate.assignedPeople || [],
      sourcePeople: todoToDuplicate.sourcePeople || [],
      mentionedPeople: todoToDuplicate.mentionedPeople || [],
      projects: todoToDuplicate.projects || [],
      priority: todoToDuplicate.priority,
      dueDate: todoToDuplicate.dueDate,
      duration: todoToDuplicate.duration,
      recurring: todoToDuplicate.recurring,
      // Carried over: duplicating a task planned into a sprint, or sitting in a
      // board column, should produce one in the same place. These were the only
      // fields dropped without a reason beside them -- every deliberate
      // omission here says so.
      sprint: todoToDuplicate.sprint,
      workflowState: todoToDuplicate.workflowState,
      // sortOrder is deliberately not copied: two todos claiming the same
      // manual position would order arbitrarily between themselves.
      comments: [], // Don't copy comments
      activity: [
        createActivity("created", "Task duplicated from another task"),
      ],
      subtasks: [],
    };
    setRawTodos((prev) => [duplicatedTodo, ...prev]);
    return duplicatedTodo.id;
  };

  /**
   * Build the next instance of a recurring todo.
   *
   * Shared by the checkbox and by dragging a card to a Kanban column that
   * maps to `completed`; before this existed only the checkbox spawned the
   * next occurrence, so a recurring task dragged to Done simply stopped
   * recurring.
   *
   * @returns the new todo, or null if this one does not recur
   */
  const buildRecurringSpawn = (todo: Todo, now: Timestamp): Todo | null => {
    if (!todo.recurring) return null;
    const recurringPattern = parseRecurringPattern(todo.recurring);
    if (!recurringPattern) return null;
    {
      // Calculate next occurrence from the current due date (if set) or today
      // This ensures proper interval calculation (e.g., "every 2 weeks" from the due date)
      const baseDate = todo.dueDate ? new Date(todo.dueDate) : new Date();
      const nextDate = calculateNextOccurrence(recurringPattern, baseDate);

      // Convert nextDate to timestamp
      const nextDueDate = getTimestamp(nextDate.getTime());

      // Determine the origin ID for the recurring chain
      // If the completed task has an origin, use that; otherwise, the completed task is the origin
      const originId = todo.recurringOriginId || todo.id;
      const previousId = todo.id;

      // Copy subtasks but reset their completed state
      const resetSubtasks = todo.subtasks.map((subtask) => ({
        ...subtask,
        id: getSubtaskId(createSubtaskId()), // New ID for the new task's subtask
        completed: false,
        completedAt: undefined,
        createdAt: now,
      }));

      // Create activity with metadata for task navigation
      const recurringActivity = createActivity(
        "created",
        `Task created from recurring pattern: ${todo.recurring}`,
        {
          recurringOriginId: originId,
          recurringPreviousId: previousId,
        },
      );

      // Create new todo with updated due date
      const newRecurringTodo: Todo = {
        ...todo,
        id: TodoModel.createId(),
        state: "active",
        createdAt: now,
        updatedAt: now,
        completedAt: undefined,
        archivedAt: undefined,
        deletedAt: undefined,
        context: todo.context || "",
        tags: todo.tags || [],
        dependencies: [],
        assignedPeople: todo.assignedPeople || [],
        sourcePeople: todo.sourcePeople || [],
        mentionedPeople: todo.mentionedPeople || [],
        projects: todo.projects || [],
        priority: todo.priority,
        dueDate: nextDueDate,
        duration: todo.duration,
        recurring: todo.recurring,
        recurringOriginId: originId,
        recurringPreviousId: previousId,
        // Not inherited: spreading the completed todo carried these over, so
        // tomorrow's task appeared already sitting in Review, and a later
        // transition could be refused because no rule allows leaving it.
        workflowState: undefined,
        sortOrder: undefined,
        comments: [], // New instance starts with no comments
        activity: [recurringActivity],
        subtasks: resetSubtasks, // Copy subtasks with reset state
        timeTracking: undefined, // New instance starts with no time tracking
      };

      // For recurring tasks, the text is copied as-is since markers will be re-parsed
      // The due date is stored in the actual field, not in text
      newRecurringTodo.text = todo.text;

      return newRecurringTodo;
    }
  };

  /**
   * Why this todo may not be completed, or null if it may.
   *
   * Shared for the same reason: the dependency check used to live only in
   * toggleTodo, so a blocked task could still be dragged to Done.
   */
  const blockedFromCompleting = (todo: Todo): string | null => {
    const validation = new TodoModel(todo, settingsModel).canComplete(todos);
    return validation.canComplete
      ? null
      : validation.reason || "Cannot complete task";
  };

  const notifyDependencyBlock = (reason: string) => {
    setDependencyBlockNotification(reason);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(
      () => setDependencyBlockNotification(null),
      5000,
    );
  };

  const toggleTodo = (id: string) => {
    const todoToToggle = rawTodos.find((t) => t.id === id);
    if (!todoToToggle) return;

    const newState: "active" | "completed" =
      todoToToggle.state === "completed" ? "active" : "completed";

    // Check dependencies before allowing completion using TodoModel
    if (newState === "completed") {
      const blocked = blockedFromCompleting(todoToToggle);
      if (blocked !== null) {
        notifyDependencyBlock(blocked);
        return; // Don't allow completion
      }
    }

    const previousState = structuredClone(todoToToggle);
    const now = getTimestamp(Date.now());

    // Track activity
    const activity =
      newState === "completed"
        ? createActivity("completed", "Task completed")
        : createActivity("uncompleted", "Task marked as active");

    // Update duration to tracked time if completing and setting is enabled
    let updatedDuration = todoToToggle.duration;
    if (
      newState === "completed" &&
      settings.focus?.autoExtendOnOvertime !== false &&
      todoToToggle.timeTracking?.totalMinutes &&
      todoToToggle.timeTracking.totalMinutes > 0
    ) {
      const trackedMinutes = Math.ceil(todoToToggle.timeTracking.totalMinutes);
      updatedDuration = (trackedMinutes * 60) as typeof updatedDuration; // Convert to seconds
    }

    const updatedTodo: Todo = {
      ...todoToToggle,
      state: newState,
      completedAt: newState === "completed" ? now : undefined,
      archivedAt: undefined,
      deletedAt: undefined,
      updatedAt: now,
      activity: [...todoToToggle.activity, activity],
      duration: updatedDuration,
    };

    setRawTodos((prev) =>
      prev.map((todo) => (todo.id === id ? updatedTodo : todo)),
    );

    // If completing a recurring task, create a new instance
    // If completing a recurring task, create a new instance
    if (newState === "completed") {
      const spawned = buildRecurringSpawn(todoToToggle, now);
      if (spawned) setRawTodos((prev) => [spawned, ...prev]);
    }

    // Create undo action
    createUndoAction(
      newState === "completed" ? "complete" : "uncomplete",
      updatedTodo,
      previousState,
      id,
    );
  };

  const deleteTodo = (id: string) => {
    const todoToDelete = rawTodos.find((t) => t.id === id);
    if (!todoToDelete) return;

    const previousState = structuredClone(todoToDelete);
    const now = getTimestamp(Date.now());
    const deletedTodo: Todo = {
      ...todoToDelete,
      state: "deleted",
      deletedAt: now,
      updatedAt: now,
      activity: [
        ...todoToDelete.activity,
        createActivity("deleted", "Task deleted"),
      ],
    };

    // Update the todo to deleted state (keeps it in the list but hidden)
    setRawTodos((prev) =>
      prev.map((todo) => (todo.id === id ? deletedTodo : todo)),
    );

    // Create undo action
    createUndoAction("delete", deletedTodo, previousState, id);
  };

  const archiveTodo = (id: string) => {
    const todoToArchive = rawTodos.find((t) => t.id === id);
    if (!todoToArchive) return;

    // Check dependencies before allowing archive using TodoModel
    const todoModel = new TodoModel(todoToArchive, settingsModel);
    const validation = todoModel.canArchive(todos);
    if (!validation.canArchive) {
      setDependencyBlockNotification(
        validation.reason || "Cannot archive task",
      );
      // Clear previous timeout if any, then set new one
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      notificationTimeoutRef.current = setTimeout(
        () => setDependencyBlockNotification(null),
        5000,
      );
      return; // Don't allow archive
    }

    const previousState = structuredClone(todoToArchive);
    const now = getTimestamp(Date.now());
    const updatedTodo: Todo = {
      ...todoToArchive,
      state: "archived",
      archivedAt: now,
      updatedAt: now,
      deletedAt: undefined,
      activity: [
        ...todoToArchive.activity,
        createActivity("archived", "Task archived"),
      ],
    };

    setRawTodos((prev) =>
      prev.map((todo) => (todo.id === id ? updatedTodo : todo)),
    );

    // Create undo action
    createUndoAction("archive", updatedTodo, previousState, id);
  };

  const unarchiveTodo = (id: string) => {
    setRawTodos((prev) =>
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
            updatedAt: getTimestamp(Date.now()),
            activity: [
              ...todo.activity,
              createActivity("unarchived", "Task unarchived"),
            ],
          };
        }
        return todo;
      }),
    );
  };

  const editTodo = (
    id: string,
    text: string,
    plainText: string,
    metadata: TodoMetadata,
  ) => {
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === id) {
          // Track text edit and metadata changes
          const activities: ActivityEntry<TodoActivityType>[] = [];

          // Check if text changed
          if (todo.plainText !== plainText) {
            activities.push(createActivity("edited", "Task text edited"));
          }

          // Reconstruct old metadata from todo's current fields for comparison
          const oldMetadata = todoToMetadata(todo);

          // Check for metadata changes
          const metadataActivities = generateMetadataActivities(
            oldMetadata,
            metadata,
          );
          activities.push(...metadataActivities);

          // Convert new metadata to typed fields
          const fields = metadataToTodoFields(metadata, settings);

          return {
            ...todo,
            text,
            plainText,
            context: fields.context,
            tags: fields.tags,
            dependencies: fields.dependencies,
            assignedPeople: fields.assignedPeople,
            sourcePeople: fields.sourcePeople,
            mentionedPeople: fields.mentionedPeople,
            projects: fields.projects,
            priority: fields.priority,
            dueDate: fields.dueDate,
            duration: fields.duration,
            recurring: fields.recurring,
            sprint: fields.sprint,
            updatedAt: getTimestamp(Date.now()),
            activity: [...todo.activity, ...activities],
          };
        }
        return todo;
      }),
    );
  };

  const addTodoComment = (todoId: TodoId, content: string) => {
    const now = getTimestamp(Date.now());
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          return {
            ...todo,
            comments: appendComment(todo.comments, content, now),
          };
        }
        return todo;
      }),
    );
  };

  const editTodoComment = (
    todoId: TodoId,
    commentId: CommentId,
    content: string,
  ) => {
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          return {
            ...todo,
            comments: amendComment(todo.comments, commentId, content),
          };
        }
        return todo;
      }),
    );
  };

  const deleteTodoComment = (todoId: TodoId, commentId: CommentId) => {
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          return {
            ...todo,
            comments: removeComment(todo.comments, commentId),
          };
        }
        return todo;
      }),
    );
  };

  const reorderTodos = (orderedIds: TodoId[]) => {
    // Update sortOrder based on position in orderedIds array
    setRawTodos((prev) => {
      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
      return prev.map((todo) => {
        const newOrder = orderMap.get(todo.id);
        if (newOrder !== undefined && newOrder !== todo.sortOrder) {
          return {
            ...todo,
            sortOrder: newOrder,
            updatedAt: getTimestamp(Date.now()),
          };
        }
        return todo;
      });
    });
  };

  /**
   * Rewrite person/project references after that entity was renamed.
   *
   * Deliberately not routed through editTodo: that generates metadata activity
   * entries, which would stamp a spurious assign/unassign pair on every touched
   * todo. updatedAt is left alone too -- a rename is not a user edit and should
   * not reshuffle "recently updated" ordering.
   */
  const renameEntityReferences = (kind: EntityKind, name: string, nextName: string) => {
    setRawTodos((prev) => prev.map((todo) => renameInRecord(todo, kind, name, nextName) ?? todo));
  };

  // Subtask management functions
  const addSubtask = (todoId: TodoId, text: string) => {
    const now = getTimestamp(Date.now());
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          const newSubtask = {
            id: getSubtaskId(createSubtaskId()),
            text,
            completed: false,
            createdAt: now,
          };
          return {
            ...todo,
            subtasks: [...(todo.subtasks || []), newSubtask],
            updatedAt: now,
          };
        }
        return todo;
      }),
    );
  };

  const toggleSubtask = (todoId: TodoId, subtaskId: SubtaskId) => {
    const now = getTimestamp(Date.now());
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          return {
            ...todo,
            subtasks: (todo.subtasks || []).map((subtask) =>
              subtask.id === subtaskId
                ? {
                    ...subtask,
                    completed: !subtask.completed,
                    completedAt: !subtask.completed ? now : undefined,
                  }
                : subtask,
            ),
            updatedAt: now,
          };
        }
        return todo;
      }),
    );
  };

  const editSubtask = (todoId: TodoId, subtaskId: SubtaskId, text: string) => {
    const now = getTimestamp(Date.now());
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          return {
            ...todo,
            subtasks: (todo.subtasks || []).map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, text } : subtask,
            ),
            updatedAt: now,
          };
        }
        return todo;
      }),
    );
  };

  const deleteSubtask = (todoId: TodoId, subtaskId: SubtaskId) => {
    const now = getTimestamp(Date.now());
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          return {
            ...todo,
            subtasks: (todo.subtasks || []).filter(
              (subtask) => subtask.id !== subtaskId,
            ),
            updatedAt: now,
          };
        }
        return todo;
      }),
    );
  };

  // Helper to transition a todo to "in-progress" if allowed
  const maybeTransitionToInProgress = (todo: Todo): Partial<Todo> | null => {
    const inProgressStateId = getKanbanStateId("in-progress");
    const currentStateId =
      (todo.workflowState as KanbanStateId) || getKanbanStateId("backlog");

    // Already in progress - no transition needed
    if (currentStateId === inProgressStateId) {
      return null;
    }

    // Check if transition is allowed
    const { states, allowedTransitions } = settings.kanban;
    const isAllowed = allowedTransitions.some(
      (t) =>
        t.fromStateId === currentStateId && t.toStateId === inProgressStateId,
    );

    if (!isAllowed) {
      return null;
    }

    // Get state names for activity description
    const oldStateName =
      states.find((s) => s.id === currentStateId)?.name || currentStateId;
    const newStateName =
      states.find((s) => s.id === inProgressStateId)?.name || inProgressStateId;

    const workflowActivity = createActivity(
      "workflow_state_changed",
      `Moved from "${oldStateName}" to "${newStateName}"`,
      { from: currentStateId, to: inProgressStateId },
    );

    return {
      workflowState: inProgressStateId,
      activity: [...(todo.activity || []), workflowActivity],
    };
  };

  // Time tracking functions
  const startTimeTracking = (todoId: TodoId, note?: string) => {
    const now = getTimestamp(Date.now());
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          const newEntry: TimeEntry = {
            id: getTimeEntryId(`time-${now}`),
            startTime: now,
            note,
          };
          const currentTracking = todo.timeTracking || {
            entries: [],
            totalMinutes: getDurationMin(0),
          };

          // Also transition to "in-progress" if allowed
          const workflowUpdates = maybeTransitionToInProgress(todo);

          return {
            ...todo,
            ...workflowUpdates,
            timeTracking: {
              ...currentTracking,
              entries: [...currentTracking.entries, newEntry],
            },
            updatedAt: now,
          };
        }
        return todo;
      }),
    );
  };

  const stopTimeTracking = (todoId: TodoId) => {
    const now = getTimestamp(Date.now());
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId && todo.timeTracking) {
          const entries = todo.timeTracking.entries.map((entry) => {
            if (!entry.endTime) {
              const duration = getDurationMin(
                Math.round((now - entry.startTime) / 60000),
              ); // Convert to minutes
              return { ...entry, endTime: now, duration };
            }
            return entry;
          });
          const totalMinutes = getDurationMin(
            entries.reduce((sum, e) => sum + (e.duration || 0), 0),
          );

          // Also transition to "in-progress" if allowed
          const workflowUpdates = maybeTransitionToInProgress(todo);

          return {
            ...todo,
            ...workflowUpdates,
            timeTracking: { entries, totalMinutes },
            updatedAt: now,
          };
        }
        return todo;
      }),
    );
  };

  const addManualTimeEntry = (
    todoId: TodoId,
    minutes: number,
    note?: string,
  ) => {
    const now = getTimestamp(Date.now());
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          const newEntry: TimeEntry = {
            id: getTimeEntryId(`time-${now}`),
            startTime: getTimestamp(now - minutes * 60000),
            endTime: now,
            duration: getDurationMin(minutes),
            note,
          };
          const currentTracking = todo.timeTracking || {
            entries: [],
            totalMinutes: getDurationMin(0),
          };
          return {
            ...todo,
            timeTracking: {
              entries: [...currentTracking.entries, newEntry],
              totalMinutes: getDurationMin(
                currentTracking.totalMinutes + minutes,
              ),
            },
            updatedAt: now,
          };
        }
        return todo;
      }),
    );
  };

  const deleteTimeEntry = (todoId: TodoId, entryId: TimeEntryId) => {
    const now = getTimestamp(Date.now());
    setRawTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId && todo.timeTracking) {
          const entries = todo.timeTracking.entries.filter(
            (e) => e.id !== entryId,
          );
          const totalMinutes = getDurationMin(
            entries.reduce((sum, e) => sum + (e.duration || 0), 0),
          );
          return {
            ...todo,
            timeTracking: { entries, totalMinutes },
            updatedAt: now,
          };
        }
        return todo;
      }),
    );
  };

  // Import todos from external source
  const importTodos = (todosToImport: Array<Omit<Todo, "id">>) => {
    const newTodos = todosToImport.map((todo) => ({
      ...todo,
      id: TodoModel.createId(),
    }));
    setRawTodos((prev) => [...prev, ...newTodos]);
  };

  // Set workflow state for Kanban board
  const setWorkflowState = (
    todoId: TodoId,
    newStateId: KanbanStateId,
    kanbanStates: Array<{
      id: KanbanStateId;
      name?: string;
      mapsToTodoState?: string;
    }>,
    allowedTransitions?: Array<{
      fromStateId: KanbanStateId;
      toStateId: KanbanStateId;
    }>,
  ): boolean => {
    const todo = rawTodos.find((t) => t.id === todoId);
    if (!todo) return false;

    const currentStateId = todo.workflowState || "backlog";

    // Check if transition is allowed (if transition rules exist)
    if (allowedTransitions && allowedTransitions.length > 0) {
      const isAllowed = allowedTransitions.some(
        (t) => t.fromStateId === currentStateId && t.toStateId === newStateId,
      );
      if (!isAllowed) {
        return false;
      }
    }

    const now = getTimestamp(Date.now());
    const newState = kanbanStates.find((s) => s.id === newStateId);
    const mappedTodoState = newState?.mapsToTodoState as TodoState | undefined;

    // Dragging a card into a column that maps to `completed` is a completion,
    // so it has to obey the same two rules the checkbox does. Neither was
    // applied here: a blocked task could be dragged to Done, and a recurring
    // one stopped recurring. This deliberately does not call toggleTodo --
    // that rebuilds the todo from a closure snapshot and would drop the
    // workflowState this function is in the middle of setting.
    const isCompleting =
      mappedTodoState === "completed" && todo.state !== "completed";
    if (isCompleting) {
      const blocked = blockedFromCompleting(todo);
      if (blocked !== null) {
        notifyDependencyBlock(blocked);
        return false;
      }
    }

    // Get state names for activity description
    const oldStateName =
      kanbanStates.find((s) => s.id === currentStateId)?.name || currentStateId;
    const newStateName = newState?.name || newStateId;

    setRawTodos((prev) =>
      prev.map((t) => {
        if (t.id === todoId) {
          const workflowActivity = createActivity(
            "workflow_state_changed",
            `Moved from "${oldStateName}" to "${newStateName}"`,
            { from: currentStateId, to: newStateId },
          );

          const updates: Partial<Todo> = {
            workflowState: newStateId,
            updatedAt: now,
            activity: [...(t.activity || []), workflowActivity],
          };

          // Sync with underlying TodoState if the new state maps to one
          if (mappedTodoState) {
            updates.state = mappedTodoState;
            if (mappedTodoState === "completed" && t.state !== "completed") {
              updates.completedAt = now;
            } else if (
              mappedTodoState === "archived" &&
              t.state !== "archived"
            ) {
              updates.archivedAt = now;
            } else if (mappedTodoState === "active") {
              // Reopening - clear completion/archive timestamps
              if (t.state === "completed") {
                updates.completedAt = undefined;
              }
              if (t.state === "archived") {
                updates.archivedAt = undefined;
              }
            }
          }

          return { ...t, ...updates };
        }
        return t;
      }),
    );

    if (isCompleting) {
      const spawned = buildRecurringSpawn(todo, now);
      if (spawned) setRawTodos((prev) => [spawned, ...prev]);
    }

    return true;
  };

  return {
    todos,
    loadError,
    addTodo,
    duplicateTodo,
    toggleTodo,
    deleteTodo,
    archiveTodo,
    unarchiveTodo,
    editTodo,
    addTodoComment,
    editTodoComment,
    deleteTodoComment,
    reorderTodos,
    renameEntityReferences,
    addSubtask,
    toggleSubtask,
    editSubtask,
    deleteSubtask,
    startTimeTracking,
    stopTimeTracking,
    addManualTimeEntry,
    deleteTimeEntry,
    importTodos,
    setWorkflowState,
    isLoaded,
    undoActions,
    fadingOutIds,
    dependencyBlockNotification,
    undo,
    dismissUndo,
    settings, // Export settings for TodoModel creation
  };
}
