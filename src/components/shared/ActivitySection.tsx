"use client";

import { useState } from "react";
import RichTextEditor from "@/components/input/RichTextEditor";
import { Activity } from "@/components/shared/Activity";
import { ActivityEntry, Comment, CommentId } from "@/types/types";
import { LinkPattern } from "@/types/linkPattern";

interface ActivitySectionProps<T extends string> {
  /** Activity log entries to display */
  activities: ActivityEntry<T>[];
  /** Comments on the entity */
  comments: Comment[];
  /** Link patterns for rendering links in text */
  linkPatterns: LinkPattern[];
  /** Callback when a comment is added */
  onAddComment: (content: string) => void;
  /** Optional callback when a comment is edited */
  onEditComment?: (commentId: CommentId, content: string) => void;
  /** Optional callback when a comment is deleted */
  onDeleteComment?: (commentId: CommentId) => void;
  /** Whether to show the border at the top (default: true) */
  showBorder?: boolean;
  /** Custom title (default: "📋 Activity") */
  title?: string;
  /** Placeholder text for the comment input */
  placeholder?: string;
}

/**
 * Activity section with comment input and activity/comment display.
 * Used in detail overlays for Person, Project, Sprint, etc.
 *
 * @example
 * <ActivitySection
 *   activities={person.activity || []}
 *   comments={person.comments}
 *   linkPatterns={linkPatterns}
 *   onAddComment={(content) => onAddComment(person.id, content)}
 * />
 */
export function ActivitySection<T extends string>({
  activities,
  comments,
  linkPatterns,
  onAddComment,
  onEditComment,
  onDeleteComment,
  showBorder = true,
  title = "📋 Activity",
  placeholder = "Add a comment...",
}: ActivitySectionProps<T>) {
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment("");
    }
  };

  return (
    <div className={showBorder ? "border-t border-zinc-200 dark:border-zinc-800 pt-6" : ""}>
      <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-3">{title}</h4>

      {/* Add comment input */}
      <div className="mb-4 flex gap-2 items-start">
        <div className="flex-1">
          <RichTextEditor
            value={newComment}
            onChange={setNewComment}
            onSubmit={(html) => {
              if (html.trim()) {
                onAddComment(html);
                setNewComment("");
              }
            }}
            placeholder={placeholder}
            minHeight="60px"
            maxHeight="200px"
            alwaysEditable={true}
            linkPatterns={linkPatterns}
          />
        </div>
        <button
          onClick={handleAddComment}
          disabled={!newComment.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      <Activity
        activities={activities}
        comments={comments}
        linkPatterns={linkPatterns}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
      />
    </div>
  );
}
