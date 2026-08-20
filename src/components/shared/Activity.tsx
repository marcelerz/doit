"use client";

import { useState } from "react";
import { Comment, CommentId } from "@/types/types";
import { LinkPattern } from "@/types/linkPattern";
import { formatActivityTime, formatActivityDateTime } from "@/utils/activityLogger";
import { processLinkPatternsInHtml } from "@/utils/linkPatternUtils";
import { sanitizeHtml } from "@/utils/sanitize";
import RichTextEditor from "@/components/input/RichTextEditor";
import { TrashIcon } from "@/components/shared/Icons";

// Generic activity entry that works for todos, people, projects, and sprints
interface GenericActivityEntry {
  id: string;
  timestamp: number;
  type: string;
  description: string;
  metadata?: unknown;
}

// Metadata for recurring task activities
interface RecurringActivityMetadata {
  recurringOriginId?: string;
  recurringPreviousId?: string;
}

// Metadata for tasks created from notes
interface SourceNoteActivityMetadata {
  sourceNoteId?: string;
  sourceActionItemId?: string;
}

interface ActivityProps {
  activities: GenericActivityEntry[];
  comments: Comment[];
  onNavigateToTask?: (taskId: string) => void;
  onNavigateToNote?: (noteId: string) => void;
  linkPatterns?: LinkPattern[];
  // Optional comment edit/delete handlers - when provided, shows edit/delete UI
  onEditComment?: (commentId: CommentId, content: string) => void;
  onDeleteComment?: (commentId: CommentId) => void;
}

// Union type for combined timeline items
type TimelineItem = { type: "activity"; data: GenericActivityEntry } | { type: "comment"; data: Comment };

export function Activity({
  activities,
  comments,
  onNavigateToTask,
  onNavigateToNote,
  linkPatterns = [],
  onEditComment,
  onDeleteComment,
}: ActivityProps) {
  // State for inline comment editing
  const [editingCommentId, setEditingCommentId] = useState<CommentId | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

  // Combine activities and comments into a single timeline
  const timelineItems: TimelineItem[] = [
    ...activities.map((activity): TimelineItem => ({ type: "activity", data: activity })),
    ...comments.flatMap((comment): TimelineItem[] =>
      comment.history.map((entry, idx) => ({
        type: "comment",
        data: {
          ...comment,
          history: [entry],
          isEdit: idx > 0,
        } as Comment,
      })),
    ),
  ];

  // Sort by timestamp (most recent first)
  const sortedItems = timelineItems.sort((a, b) => {
    const aTime = a.type === "activity" ? a.data.timestamp : (a.data as Comment).history[0].timestamp;
    const bTime = b.type === "activity" ? b.data.timestamp : (b.data as Comment).history[0].timestamp;
    return bTime - aTime;
  });

  // Group by date
  const groupedItems: { [date: string]: TimelineItem[] } = {};
  sortedItems.forEach((item) => {
    const timestamp = item.type === "activity" ? item.data.timestamp : (item.data as Comment).history[0].timestamp;
    const date = new Date(timestamp).toLocaleDateString();
    if (!groupedItems[date]) {
      groupedItems[date] = [];
    }
    groupedItems[date].push(item);
  });

  // Get activity icon based on type (using same icons as the app)
  const getActivityIcon = (type: string): string => {
    switch (type) {
      case "created":
        return "✨";
      case "completed":
        return "✅";
      case "uncompleted":
        return "⤴️";
      case "archived":
        return "📦";
      case "unarchived":
        return "📤";
      case "deleted":
        return "🗑️";
      case "undeleted":
        return "↩️";
      case "edited":
        return "✏️";
      case "comment_added":
      case "comment_edited":
      case "comment_deleted":
        return "💭";
      case "assigned_added":
      case "assigned_removed":
        return "👤";
      case "source_added":
      case "source_removed":
        return "💼";
      case "mentioned_added":
      case "mentioned_removed":
        return "💬";
      case "project_added":
      case "project_removed":
        return "📁";
      case "priority_changed":
      case "priority_removed":
        return "🔥";
      case "duedate_changed":
      case "duedate_removed":
        return "📅";
      case "duration_changed":
      case "duration_removed":
        return "⏱️";
      case "recurring_changed":
      case "recurring_removed":
        return "🔄";
      case "dependency_added":
      case "dependency_removed":
        return "⛓️";
      case "tag_added":
      case "tag_removed":
        return "🏷️";
      case "context_changed":
        return "📝";
      case "started":
        return "🚀";
      case "cancelled":
        return "❌";
      case "workflow_state_changed":
        return "🔀";
      // Note-specific activity types
      case "pinned":
        return "📌";
      case "unpinned":
        return "📌";
      case "converted_to_todo":
        return "✅";
      case "action_item_added":
      case "action_item_edited":
      case "action_item_deleted":
        return "☑️";
      case "action_items_converted":
        return "✅";
      case "content_changed":
        return "📝";
      default:
        return "•";
    }
  };

  return (
    <div className="space-y-4">
      {sortedItems.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">No activity yet</p>
      ) : (
        Object.entries(groupedItems).map(([date, items]) => (
          <div key={date}>
            <h5 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 mb-2 sticky top-0 bg-white dark:bg-zinc-900 py-1">
              {date === new Date().toLocaleDateString() ? "Today" : date}
            </h5>
            <div className="space-y-1">
              {items.map((item) => {
                if (item.type === "activity") {
                  const activity = item.data as GenericActivityEntry;
                  const recurringMeta = activity.metadata as RecurringActivityMetadata | undefined;
                  const sourceNoteMeta = activity.metadata as SourceNoteActivityMetadata | undefined;
                  const hasRecurringLinks =
                    recurringMeta &&
                    (recurringMeta.recurringOriginId || recurringMeta.recurringPreviousId) &&
                    onNavigateToTask;
                  const hasSourceNoteLink =
                    sourceNoteMeta &&
                    sourceNoteMeta.sourceNoteId &&
                    onNavigateToNote;

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-2 text-sm py-1.5 px-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <span className="flex-shrink-0 text-base leading-none mt-0.5" title={activity.type}>
                        {getActivityIcon(activity.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-zinc-700 dark:text-zinc-300">{activity.description}</span>
                        {hasRecurringLinks && (
                          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap gap-2">
                            {recurringMeta.recurringPreviousId && (
                              <button
                                type="button"
                                onClick={() => onNavigateToTask(recurringMeta.recurringPreviousId!)}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View previous task
                              </button>
                            )}
                            {recurringMeta.recurringOriginId &&
                              recurringMeta.recurringOriginId !== recurringMeta.recurringPreviousId && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToTask(recurringMeta.recurringOriginId!)}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  View first task
                                </button>
                              )}
                          </div>
                        )}
                        {hasSourceNoteLink && (
                          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            <button
                              type="button"
                              onClick={() => onNavigateToNote(sourceNoteMeta.sourceNoteId!)}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View source note
                            </button>
                          </div>
                        )}
                        {activity.metadata !== undefined &&
                          activity.metadata !== null &&
                          !hasRecurringLinks &&
                          !hasSourceNoteLink && (
                            <span className="ml-1 text-zinc-500 dark:text-zinc-500">
                              {typeof activity.metadata === "string"
                                ? activity.metadata
                                : String(JSON.stringify(activity.metadata))}
                            </span>
                          )}
                      </div>
                      <span
                        className="flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-500 ml-2"
                        title={formatActivityDateTime(activity.timestamp)}
                      >
                        {formatActivityTime(activity.timestamp)}
                      </span>
                    </div>
                  );
                } else {
                  // Comment item
                  const comment = item.data as Comment & { isEdit?: boolean };
                  const entry = comment.history[0];
                  const isEditing = editingCommentId === comment.commentId;
                  const canEdit = onEditComment && onDeleteComment;

                  return (
                    <div
                      key={`comment-${comment.commentId}-${entry.timestamp}`}
                      className="group flex items-start gap-2 text-sm py-1.5 px-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <span className="flex-shrink-0 text-base leading-none mt-0.5" title="comment">
                        💭
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {comment.isEdit ? "Comment edited" : "Comment added"}
                        </span>
                        {isEditing ? (
                          <div className="mt-1 space-y-2">
                            <RichTextEditor
                              value={editingCommentContent}
                              onChange={setEditingCommentContent}
                              placeholder="Edit comment..."
                              minHeight="60px"
                              maxHeight="200px"
                              alwaysEditable={true}
                              linkPatterns={linkPatterns}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (editingCommentContent.trim() && onEditComment) {
                                    onEditComment(comment.commentId, editingCommentContent);
                                    setEditingCommentId(null);
                                    setEditingCommentContent("");
                                  }
                                }}
                                disabled={!editingCommentContent.trim()}
                                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentContent("");
                                }}
                                className="px-3 py-1 text-sm bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // SECURITY: sanitize on render. Content written through RichTextEditor is
                          // already sanitized, but imported and restored data never passes through it,
                          // and processLinkPatternsInHtml expects pre-sanitized input.
                          <div
                            className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-2 rounded [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:cursor-pointer"
                            dangerouslySetInnerHTML={{
                              __html: processLinkPatternsInHtml(sanitizeHtml(entry.content), linkPatterns),
                            }}
                          />
                        )}
                      </div>
                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <span
                            className="flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-500"
                            title={formatActivityDateTime(entry.timestamp)}
                          >
                            {formatActivityTime(entry.timestamp)}
                          </span>
                          {canEdit && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.commentId);
                                  setEditingCommentContent(entry.content);
                                }}
                                className="p-1 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                                title="Edit comment"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => onDeleteComment(comment.commentId)}
                                className="p-1 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                title="Delete comment"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
