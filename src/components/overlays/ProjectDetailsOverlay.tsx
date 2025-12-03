"use client";

import { useState, useEffect } from "react";
import { Project } from "@/types/settings";
import RichTextEditor from "@/components/input/RichTextEditor";
import { Activity } from "@/components/shared/Activity";

interface ProjectDetailsOverlayProps {
  project: Project;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Project>) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onAddComment: (projectId: string, content: string) => void;
  onEditComment: (projectId: string, commentId: number, content: string) => void;
  onDeleteComment: (projectId: string, commentId: number) => void;
}

export function ProjectDetailsOverlay({
  project,
  onClose,
  onUpdate,
  onDelete,
  onArchive,
  onUnarchive,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: ProjectDetailsOverlayProps) {
  const [editingName, setEditingName] = useState(project.name);
  const [editingAlternatives, setEditingAlternatives] = useState(project.alternatives.join(", "));
  const [editingColor, setEditingColor] = useState(project.color);
  const [editingImageUrl, setEditingImageUrl] = useState(project.imageUrl || "");
  const [editingContext, setEditingContext] = useState(project.context || "");
  const [newComment, setNewComment] = useState("");

  // Sync local state when project changes (after updates)
  useEffect(() => {
    setEditingName(project.name);
    setEditingAlternatives(project.alternatives.join(", "));
    setEditingColor(project.color);
    setEditingImageUrl(project.imageUrl || "");
    setEditingContext(project.context || "");
  }, [project]);

  // Auto-save when fields change
  useEffect(() => {
    const handler = setTimeout(() => {
      if (
        editingName.trim() !== project.name ||
        editingAlternatives !== project.alternatives.join(", ") ||
        editingColor !== project.color ||
        (editingImageUrl.trim() || undefined) !== project.imageUrl ||
        (editingContext.trim() || undefined) !== project.context
      ) {
        onUpdate(project.id, {
          name: editingName.trim(),
          alternatives: editingAlternatives
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a),
          color: editingColor,
          imageUrl: editingImageUrl.trim() || undefined,
          context: editingContext.trim() || undefined,
        });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [editingName, editingAlternatives, editingColor, editingImageUrl, editingContext, project, onUpdate]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(project.id, newComment);
      setNewComment("");
    }
  };

  const handleDelete = () => {
    onDelete(project.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          {/* Header with Close Button */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
                style={{ backgroundColor: editingColor }}
              >
                {editingName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{editingName || "Project"}</h2>
                <div className="flex gap-1.5 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium">
                    #{project.name}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Name</label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Project name"
                />
              </div>

              {/* Alternatives Field */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                  Alternatives
                </label>
                <input
                  type="text"
                  value={editingAlternatives}
                  onChange={(e) => setEditingAlternatives(e.target.value)}
                  placeholder="e.g., Web Redesign, Site Refresh"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {editingAlternatives && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {editingAlternatives
                      .split(",")
                      .map((a) => a.trim())
                      .filter((a) => a)
                      .map((alt, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        >
                          aka: {alt}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Color Field */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={editingColor}
                    onChange={(e) => setEditingColor(e.target.value)}
                    className="w-20 h-10 rounded-lg cursor-pointer border border-zinc-300 dark:border-zinc-700"
                  />
                  <input
                    type="text"
                    value={editingColor}
                    onChange={(e) => setEditingColor(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="#9333ea"
                  />
                </div>
              </div>

              {/* Image URL Field */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="text"
                  value={editingImageUrl}
                  onChange={(e) => setEditingImageUrl(e.target.value)}
                  placeholder="https://example.com/project-logo.jpg"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {editingImageUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Image attached</span>
                  </div>
                )}
              </div>
            </div>

            {/* Context */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">📝 Context</label>
              <RichTextEditor
                value={editingContext}
                onChange={(html) => setEditingContext(html || "")}
                placeholder="Add context..."
                minHeight="100px"
                maxHeight="300px"
                noBorderInViewMode={true}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4">
              {/* Archive/Unarchive button */}
              {project.archived && onUnarchive ? (
                <button
                  onClick={() => {
                    onUnarchive(project.id);
                    onClose();
                  }}
                  className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-md transition-colors"
                  aria-label="Unarchive project"
                  title="Unarchive"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </button>
              ) : (
                !project.archived &&
                onArchive && (
                  <button
                    onClick={() => {
                      onArchive(project.id);
                      onClose();
                    }}
                    className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-md transition-colors"
                    aria-label="Archive project"
                    title="Archive"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </button>
                )
              )}

              {/* Delete button */}
              <button
                onClick={handleDelete}
                className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
                aria-label="Delete project"
                title="Delete"
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

          {/* Activity Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-3">📋 Activity</h4>

            {/* Add comment input */}
            <div className="mb-4 flex gap-2 items-start">
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
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed dark:disabled:bg-zinc-700 text-white rounded-md font-medium transition-colors"
              >
                Add
              </button>
            </div>

            <Activity activities={project.activity || []} comments={project.comments} />
          </div>
        </div>
      </div>
    </div>
  );
}
