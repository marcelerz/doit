"use client";

import { Dispatch, SetStateAction, useCallback } from "react";
import { getTimestamp, Timestamp } from "@/types/time";
import { Comment, CommentId, getCommentId, ActivityEntry } from "@/types/types";
import { createCommentId } from "@/utils/idGenerator";

/**
 * Type for entities that support comments.
 * Must have an id and comments array.
 * The activity array is typed with a generic to match the entity's activity type.
 */
export interface CommentableEntity<AT = string> {
  id: string;
  comments: Comment[];
  updatedAt?: Timestamp | number;
  activity?: ActivityEntry<AT>[];
}

/**
 * Options for creating comment operations.
 */
export interface CommentOperationsOptions<T extends CommentableEntity<AT>, AT> {
  /** State setter for the entity array */
  setEntities: Dispatch<SetStateAction<T[]>>;
  /** Optional function to create an activity entry when comments change */
  createActivity?: (type: AT, description: string) => ActivityEntry<AT>;
  /** Activity type for adding a comment */
  addActivityType?: AT;
  /** Activity type for editing a comment */
  editActivityType?: AT;
  /** Activity type for deleting a comment */
  deleteActivityType?: AT;
}

/**
 * Result of createCommentOperations - the comment CRUD functions.
 */
export interface CommentOperations<EntityId extends string> {
  /** Add a new comment to an entity */
  addComment: (entityId: EntityId, content: string) => void;
  /** Edit an existing comment (adds to history) */
  editComment: (entityId: EntityId, commentId: CommentId, content: string) => void;
  /** Delete a comment from an entity */
  deleteComment: (entityId: EntityId, commentId: CommentId) => void;
}

/**
 * Creates comment CRUD operations for a given entity type.
 * This eliminates duplication across useTodos, useNotes, useSprints, and useReviews.
 *
 * @template T - Entity type that has comments
 * @template EntityId - Branded ID type for the entity (e.g., TodoId, NoteId)
 * @template AT - Activity type for the entity
 *
 * @param options - Configuration for the comment operations
 * @returns Object with addComment, editComment, deleteComment functions
 *
 * @example
 * // In useTodos:
 * const commentOps = createCommentOperations<Todo, TodoId, TodoActivityType>({
 *   setEntities: setRawTodos,
 *   createActivity,
 *   addActivityType: "comment_added",
 *   editActivityType: "comment_edited",
 *   deleteActivityType: "comment_deleted",
 * });
 * const { addComment: addTodoComment, editComment: editTodoComment, deleteComment: deleteTodoComment } = commentOps;
 */
export function createCommentOperations<
  T extends CommentableEntity<AT>,
  EntityId extends string,
  AT = string,
>(options: CommentOperationsOptions<T, AT>): CommentOperations<EntityId> {
  const { setEntities, createActivity, addActivityType, editActivityType, deleteActivityType } = options;

  const addComment = (entityId: EntityId, content: string) => {
    const now = getTimestamp(Date.now());
    setEntities((prev: T[]) =>
      prev.map((entity) => {
        if (entity.id === entityId) {
          const newComment: Comment = {
            commentId: getCommentId(createCommentId()),
            history: [{ timestamp: now, content }],
          };

          // Build result object
          const updates: Partial<T> = {
            comments: [...entity.comments, newComment],
            updatedAt: now,
          } as Partial<T>;

          // Add activity if configured
          if (createActivity && addActivityType !== undefined && entity.activity) {
            updates.activity = [
              ...entity.activity,
              createActivity(addActivityType, "Comment added"),
            ];
          }

          return { ...entity, ...updates };
        }
        return entity;
      }),
    );
  };

  const editComment = (entityId: EntityId, commentId: CommentId, content: string) => {
    const now = getTimestamp(Date.now());
    setEntities((prev: T[]) =>
      prev.map((entity) => {
        if (entity.id === entityId) {
          const updates: Partial<T> = {
            comments: entity.comments.map((comment) =>
              comment.commentId === commentId
                ? { ...comment, history: [...comment.history, { timestamp: now, content }] }
                : comment,
            ),
            updatedAt: now,
          } as Partial<T>;

          // Add activity if configured
          if (createActivity && editActivityType !== undefined && entity.activity) {
            updates.activity = [
              ...entity.activity,
              createActivity(editActivityType, "Comment edited"),
            ];
          }

          return { ...entity, ...updates };
        }
        return entity;
      }),
    );
  };

  const deleteComment = (entityId: EntityId, commentId: CommentId) => {
    const now = getTimestamp(Date.now());
    setEntities((prev: T[]) =>
      prev.map((entity) => {
        if (entity.id === entityId) {
          const updates: Partial<T> = {
            comments: entity.comments.filter((c) => c.commentId !== commentId),
            updatedAt: now,
          } as Partial<T>;

          // Add activity if configured
          if (createActivity && deleteActivityType !== undefined && entity.activity) {
            updates.activity = [
              ...entity.activity,
              createActivity(deleteActivityType, "Comment deleted"),
            ];
          }

          return { ...entity, ...updates };
        }
        return entity;
      }),
    );
  };

  return { addComment, editComment, deleteComment };
}

/**
 * Hook version for use within React components.
 * Wraps the operations in useCallback for stable references.
 *
 * @example
 * const { addComment, editComment, deleteComment } = useCommentOperations({
 *   setEntities: setRawTodos,
 *   createActivity,
 *   addActivityType: "comment_added",
 * });
 */
export function useCommentOperations<
  T extends CommentableEntity<AT>,
  EntityId extends string,
  AT = string,
>(options: CommentOperationsOptions<T, AT>): CommentOperations<EntityId> {
  const { setEntities, createActivity, addActivityType, editActivityType, deleteActivityType } = options;

  const addComment = useCallback(
    (entityId: EntityId, content: string) => {
      const now = getTimestamp(Date.now());
      setEntities((prev: T[]) =>
        prev.map((entity) => {
          if (entity.id === entityId) {
            const newComment: Comment = {
              commentId: getCommentId(createCommentId()),
              history: [{ timestamp: now, content }],
            };

            const updates: Partial<T> = {
              comments: [...entity.comments, newComment],
              updatedAt: now,
            } as Partial<T>;

            if (createActivity && addActivityType !== undefined && entity.activity) {
              updates.activity = [
                ...entity.activity,
                createActivity(addActivityType, "Comment added"),
              ];
            }

            return { ...entity, ...updates };
          }
          return entity;
        }),
      );
    },
    [setEntities, createActivity, addActivityType],
  );

  const editComment = useCallback(
    (entityId: EntityId, commentId: CommentId, content: string) => {
      const now = getTimestamp(Date.now());
      setEntities((prev: T[]) =>
        prev.map((entity) => {
          if (entity.id === entityId) {
            const updates: Partial<T> = {
              comments: entity.comments.map((comment) =>
                comment.commentId === commentId
                  ? { ...comment, history: [...comment.history, { timestamp: now, content }] }
                  : comment,
              ),
              updatedAt: now,
            } as Partial<T>;

            if (createActivity && editActivityType !== undefined && entity.activity) {
              updates.activity = [
                ...entity.activity,
                createActivity(editActivityType, "Comment edited"),
              ];
            }

            return { ...entity, ...updates };
          }
          return entity;
        }),
      );
    },
    [setEntities, createActivity, editActivityType],
  );

  const deleteComment = useCallback(
    (entityId: EntityId, commentId: CommentId) => {
      const now = getTimestamp(Date.now());
      setEntities((prev: T[]) =>
        prev.map((entity) => {
          if (entity.id === entityId) {
            const updates: Partial<T> = {
              comments: entity.comments.filter((c) => c.commentId !== commentId),
              updatedAt: now,
            } as Partial<T>;

            if (createActivity && deleteActivityType !== undefined && entity.activity) {
              updates.activity = [
                ...entity.activity,
                createActivity(deleteActivityType, "Comment deleted"),
              ];
            }

            return { ...entity, ...updates };
          }
          return entity;
        }),
      );
    },
    [setEntities, createActivity, deleteActivityType],
  );

  return { addComment, editComment, deleteComment };
}
