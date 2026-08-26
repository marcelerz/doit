import { Comment, CommentId, getCommentId } from "@/types/types";
import { getTimestamp, Timestamp } from "@/types/time";
import { createCommentId } from "@/utils/idGenerator";

/**
 * Pure operations on a comment list, read and write.
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

/** The newest revision of a comment, without its history. */
export interface CommentSummary {
  commentId: CommentId;
  content: string;
  timestamp: Timestamp;
}

/**
 * The newest comment, flattened to its newest revision.
 *
 * Six models had a `latestComment`, in two different shapes. Four returned
 * this -- the id plus the last history entry's content and timestamp -- in four
 * identical copies. BaseEntityModel returned the whole Comment, leaving the
 * caller to walk the history itself for the one thing it wanted. This is the
 * shape that answers the question, so it is the one that survives.
 *
 * Every field is a primitive, so there is nothing to clone and nothing a caller
 * can reach back through.
 */
export function latestComment(comments: Comment[]): CommentSummary | null {
  if (comments.length === 0) return null;
  const comment = comments[comments.length - 1];
  const latestHistory = comment.history[comment.history.length - 1];
  return {
    commentId: comment.commentId,
    content: latestHistory.content,
    timestamp: latestHistory.timestamp,
  };
}
