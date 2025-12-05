"use client";

import { useState, useEffect } from "react";
import { ProjectModel } from "@/models/ProjectModel";
import { Project } from "@/types/settings";
import RichTextEditor from "@/components/input/RichTextEditor";
import { Activity } from "@/components/shared/Activity";
import { ColorPicker } from "@/components/shared/ColorPicker";
import { AlternativesInput } from "@/components/shared/AlternativesInput";
import { ActionButtons } from "@/components/shared/ActionButtons";

interface ProjectDetailsOverlayProps {
  project: ProjectModel;
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
  const [editingAlternatives, setEditingAlternatives] = useState(project.alternatives);
  const [editingColor, setEditingColor] = useState(project.color);
  const [editingContext, setEditingContext] = useState(project.context || "");
  const [newComment, setNewComment] = useState("");

  // Sync local state when project changes (after updates)
  useEffect(() => {
    setEditingName(project.name);
    setEditingAlternatives(project.alternatives);
    setEditingColor(project.color);
    setEditingContext(project.context || "");
  }, [project]);

  // Auto-save when fields change
  useEffect(() => {
    const handler = setTimeout(() => {
      if (
        editingName.trim() !== project.name ||
        JSON.stringify(editingAlternatives) !== JSON.stringify(project.alternatives) ||
        editingColor !== project.color ||
        (editingContext.trim() || undefined) !== project.context
      ) {
        onUpdate(project.id, {
          name: editingName.trim(),
          alternatives: editingAlternatives,
          color: editingColor,
          context: editingContext.trim() || undefined,
        });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [editingName, editingAlternatives, editingColor, editingContext, project, onUpdate]);

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
                style={{ backgroundColor: editingColor || "#e2ccff" }}
              >
                {editingName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{editingName || "Project"}</h2>
                <div className="flex gap-1.5 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium">
                    %{project.name}
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
              <AlternativesInput
                value={editingAlternatives}
                onChange={setEditingAlternatives}
                placeholder="e.g., Web Redesign, Site Refresh"
              />

              {/* Color Field */}
              <ColorPicker value={editingColor} onChange={setEditingColor} defaultColor="#e2ccff" />
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
            <div className="pt-4">
              <ActionButtons
                isArchived={project.archived || false}
                onArchive={
                  onArchive
                    ? () => {
                        onArchive(project.id);
                        onClose();
                      }
                    : undefined
                }
                onUnarchive={
                  onUnarchive
                    ? () => {
                        onUnarchive(project.id);
                        onClose();
                      }
                    : undefined
                }
                onDelete={handleDelete}
                archiveLabel="Archive project"
                unarchiveLabel="Unarchive project"
                deleteLabel="Delete project"
              />
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
