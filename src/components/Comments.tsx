"use client";

import { useState } from "react";
import { Comment, CommentHistoryEntry } from "@/types/settings";
import RichTextEditor from "./RichTextEditor";

interface CommentsProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
  onEditComment: (commentId: number, content: string) => void;
  onDeleteComment: (commentId: number) => void;
}

export function Comments({ comments, onAddComment, onEditComment, onDeleteComment }: CommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expandedCommentId, setExpandedCommentId] = useState<number | null>(null);

  // Helper to check if HTML content is empty
  const isHtmlEmpty = (html: string): boolean => {
    if (!html) return true;
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const text = temp.textContent || "";
    return text.trim().length === 0;
  };

  const handleAddComment = () => {
    if (!isHtmlEmpty(newComment)) {
      onAddComment(newComment);
      setNewComment("");
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.commentId);
    // Use the most recent content
    const latestEntry = comment.history[comment.history.length - 1];
    setEditContent(latestEntry.content);
  };

  const handleSaveEdit = (commentId: number) => {
    if (!isHtmlEmpty(editContent)) {
      onEditComment(commentId, editContent);
      setEditingCommentId(null);
      setEditContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Sort comments by most recent first
  const sortedComments = [...comments].sort((a, b) => {
    const aLatest = a.history[a.history.length - 1]?.date || 0;
    const bLatest = b.history[b.history.length - 1]?.date || 0;
    return bLatest - aLatest;
  });

  return (
    <div className="space-y-3">
      {/* Add new comment */}
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <RichTextEditor
            value={newComment}
            onChange={setNewComment}
            placeholder="Add a comment..."
            minHeight="60px"
            maxHeight="200px"
            alwaysEditable={true}
          />
        </div>
        <button
          onClick={handleAddComment}
          disabled={isHtmlEmpty(newComment)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
        >
          Add
        </button>
      </div>

      {/* Comments list */}
      <div className="space-y-2">
        {sortedComments.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">No comments yet</p>
        ) : (
          sortedComments.map((comment) => {
            const latestEntry = comment.history[comment.history.length - 1];
            const isEditing = editingCommentId === comment.commentId;
            const isExpanded = expandedCommentId === comment.commentId;
            const hasHistory = comment.history.length > 1;

            return (
              <div
                key={comment.commentId}
                className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <RichTextEditor
                      value={editContent}
                      onChange={setEditContent}
                      placeholder="Edit comment..."
                      minHeight="80px"
                      maxHeight="200px"
                      alwaysEditable={true}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(comment.commentId)}
                        disabled={isHtmlEmpty(editContent)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 text-sm rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div
                        className="text-sm text-zinc-700 dark:text-zinc-300 flex-1 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:cursor-pointer"
                        dangerouslySetInnerHTML={{ __html: latestEntry.content }}
                      />
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="p-1 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Edit comment"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteComment(comment.commentId)}
                          className="p-1 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete comment"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                      <span>{formatDate(latestEntry.date)}</span>
                      {hasHistory && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => setExpandedCommentId(isExpanded ? null : comment.commentId)}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {isExpanded ? "Hide" : "Show"} history ({comment.history.length - 1} edit
                            {comment.history.length - 1 !== 1 ? "s" : ""})
                          </button>
                        </>
                      )}
                    </div>
                    {isExpanded && hasHistory && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
                        {comment.history
                          .slice(0, -1)
                          .reverse()
                          .map((entry, idx) => (
                            <div key={idx} className="text-xs">
                              <div
                                className="text-zinc-600 dark:text-zinc-400 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:cursor-pointer"
                                dangerouslySetInnerHTML={{ __html: entry.content }}
                              />
                              <span className="text-zinc-500 dark:text-zinc-500">{formatDate(entry.date)}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
