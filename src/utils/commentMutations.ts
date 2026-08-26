import { Comment, getCommentId } from "@/types/types";
import { getTimestamp } from "@/types/time";
import { createCommentId } from "@/utils/idGenerator";

/**
 * Pure operations on a comment list.
 *
 * Four hooks -- useTodos, useNotes, useReviews and useEntityManager -- each
 * carried the same three bodies, differing only in which array they mapped
 * over. They still differ in what they do around the edit: notes and reviews
 * also stamp updatedAt and append an activity entry, todos and entities do
 * not. That part stays at the call site; only the list handling is shared.
 *
 * An edit appends to the comment's history rather than replacing it, so the
 * original wording is preserved.
 */

export function appendComment(comments: Comment[], content: string, now: number = Date.now()): Comment[] {
  return [
    ...comments,
    {
      commentId: getCommentId(createCommentId()),
      history: [{ timestamp: getTimestamp(now), content }],
    },
  ];
}

export function amendComment(
  comments: Comment[],
  commentId: string,
  content: string,
  now: number = Date.now(),
): Comment[] {
  return comments.map((comment) =>
    comment.commentId === commentId
      ? { ...comment, history: [...comment.history, { timestamp: getTimestamp(now), content }] }
      : comment,
  );
}

export function removeComment(comments: Comment[], commentId: string): Comment[] {
  return comments.filter((comment) => comment.commentId !== commentId);
}
