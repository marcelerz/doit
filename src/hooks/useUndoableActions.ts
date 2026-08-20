"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Base type for an undoable action
 */
export interface UndoableAction<ActionType extends string, Entity> {
  /** Unique identifier for this action */
  id: string;
  /** Type of action (e.g., "delete", "archive", "complete") */
  type: ActionType;
  /** The entity after the action was performed */
  entity: Entity;
  /** The entity state before the action (for restoration) */
  previousState?: Entity;
  /** When the action was performed */
  timestamp: number;
  /** Timeout ID for auto-dismissal */
  timeoutId: NodeJS.Timeout;
}

/**
 * Configuration for useUndoableActions hook
 */
export interface UndoableActionsConfig<ActionType extends string, Entity> {
  /** Timeout in milliseconds before action is finalized (default: 10000) */
  undoTimeout?: number;
  /** Fade out animation duration in milliseconds (default: 3000) */
  fadeOutDuration?: number;
  /** Callback when an action is finalized (e.g., for "delete", actually remove from storage) */
  onFinalize?: (action: UndoableAction<ActionType, Entity>) => void;
  /** Callback when an action is undone */
  onUndo?: (action: UndoableAction<ActionType, Entity>) => void;
}

/**
 * Return type for useUndoableActions hook
 */
export interface UndoableActionsResult<ActionType extends string, Entity> {
  /** Currently pending undo actions */
  undoActions: UndoableAction<ActionType, Entity>[];
  /** IDs of actions that are fading out */
  fadingOutIds: Set<string>;
  /**
   * Create a new undoable action
   * @param type - Type of action
   * @param entity - The entity after the action
   * @param previousState - The entity state before the action
   * @param entityId - Unique identifier for the entity (used in action ID)
   */
  createUndoAction: (
    type: ActionType,
    entity: Entity,
    previousState: Entity | undefined,
    entityId: string
  ) => string;
  /**
   * Undo a specific action
   * @param actionId - ID of the action to undo
   */
  undo: (actionId: string) => void;
  /**
   * Dismiss an undo notification without undoing
   * @param actionId - ID of the action to dismiss
   */
  dismissUndo: (actionId: string) => void;
  /**
   * Clear all pending undo actions
   */
  clearAll: () => void;
}

/**
 * Hook for managing undoable actions with timeouts and fade-out animations.
 * Extracts the common undo pattern from useTodos, useNotes, and useReviews.
 *
 * @param config - Configuration options
 *
 * @example
 * // In useTodos:
 * const undoable = useUndoableActions<"delete" | "complete" | "archive", Todo>({
 *   undoTimeout: 10000,
 *   onFinalize: (action) => {
 *     if (action.type === "delete") {
 *       setRawTodos(prev => prev.filter(t => t.id !== action.entity.id));
 *     }
 *   },
 *   onUndo: (action) => {
 *     if (action.type === "delete" && action.previousState) {
 *       setRawTodos(prev => [action.previousState, ...prev]);
 *     }
 *   },
 * });
 *
 * // When deleting a todo:
 * const actionId = undoable.createUndoAction("delete", deletedTodo, previousState, todo.id);
 *
 * // In the UI:
 * {undoable.undoActions.map(action => (
 *   <UndoNotification
 *     key={action.id}
 *     isFading={undoable.fadingOutIds.has(action.id)}
 *     onUndo={() => undoable.undo(action.id)}
 *     onDismiss={() => undoable.dismissUndo(action.id)}
 *   />
 * ))}
 */
export function useUndoableActions<ActionType extends string, Entity>(
  config: UndoableActionsConfig<ActionType, Entity> = {}
): UndoableActionsResult<ActionType, Entity> {
  const {
    undoTimeout = 10000,
    fadeOutDuration = 3000,
    onFinalize,
    onUndo,
  } = config;

  const [undoActions, setUndoActions] = useState<UndoableAction<ActionType, Entity>[]>([]);
  const [fadingOutIds, setFadingOutIds] = useState<Set<string>>(new Set());

  // Ref for cleanup purposes
  const undoActionsRef = useRef<UndoableAction<ActionType, Entity>[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    undoActionsRef.current = undoActions;
  }, [undoActions]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      undoActionsRef.current.forEach((action) => {
        clearTimeout(action.timeoutId);
      });
    };
  }, []);

  // Execute pending action (finalize after timeout)
  const executePendingAction = useCallback(
    (action: UndoableAction<ActionType, Entity>) => {
      // Call finalize callback for actions like "delete" that need permanent removal
      if (onFinalize) {
        onFinalize(action);
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
      }, fadeOutDuration);
    },
    [onFinalize, fadeOutDuration]
  );

  // Create a new undo action
  const createUndoAction = useCallback(
    (
      type: ActionType,
      entity: Entity,
      previousState: Entity | undefined,
      entityId: string
    ): string => {
      const now = Date.now();
      const actionId = `${now}-${type}-${entityId}`;

      const timeoutId = setTimeout(() => {
        setUndoActions((prev) => {
          const action = prev.find((a) => a.id === actionId);
          if (action) {
            executePendingAction(action);
          }
          return prev;
        });
      }, undoTimeout);

      const action: UndoableAction<ActionType, Entity> = {
        id: actionId,
        type,
        entity,
        previousState,
        timestamp: now,
        timeoutId,
      };

      setUndoActions((prev) => [...prev, action]);
      return actionId;
    },
    [undoTimeout, executePendingAction]
  );

  // Undo a specific action
  const undo = useCallback(
    (actionId: string) => {
      const action = undoActions.find((a) => a.id === actionId);
      if (!action) return;

      // Clear the timeout for this action
      clearTimeout(action.timeoutId);

      // Call undo callback
      if (onUndo) {
        onUndo(action);
      }

      // Remove this action from the queue
      setUndoActions((prev) => prev.filter((a) => a.id !== actionId));
    },
    [undoActions, onUndo]
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
    [undoActions, executePendingAction]
  );

  // Clear all pending actions
  const clearAll = useCallback(() => {
    undoActions.forEach((action) => {
      clearTimeout(action.timeoutId);
    });
    setUndoActions([]);
    setFadingOutIds(new Set());
  }, [undoActions]);

  return {
    undoActions,
    fadingOutIds,
    createUndoAction,
    undo,
    dismissUndo,
    clearAll,
  };
}
