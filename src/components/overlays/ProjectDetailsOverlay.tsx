"use client";

import { useState, useEffect } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { ProjectModel } from "@/models/ProjectModel";
import { Project, ProjectCategory, ProjectId, getProjectCategoryId } from "@/types/project";
import { MarkerColors, defaultMarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import { getColor, CommentId } from "@/types/types";
import RichTextEditor from "@/components/input/RichTextEditor";
import { ActivitySection } from "@/components/shared/ActivitySection";
import { ColorPicker } from "@/components/shared/ColorPicker";
import { AlternativesInput } from "@/components/shared/AlternativesInput";
import { ActionButtons } from "@/components/shared/ActionButtons";
import { Modal } from "@/components/shared/Modal";
import { CloseIcon } from "@/components/shared/Icons";
import { NoteListItem } from "@/components/items/NoteListItem";
import { TodoListItem } from "@/components/items/TodoListItem";
import { NoteModel } from "@/models/NoteModel";
import { TodoModel } from "@/models/TodoModel";
import { NoteId } from "@/types/note";
import { TodoId } from "@/types/todo";
import { Priority } from "@/types/priority";

interface ProjectDetailsOverlayProps {
  project: ProjectModel;
  onClose: () => void;
  onUpdate: (id: ProjectId, updates: Partial<Project>) => void;
  onDelete: (id: ProjectId) => void;
  onArchive?: (id: ProjectId) => void;
  onUnarchive?: (id: ProjectId) => void;
  onAddComment: (projectId: ProjectId, content: string) => void;
  onEditComment: (projectId: ProjectId, commentId: CommentId, content: string) => void;
  onDeleteComment: (projectId: ProjectId, commentId: CommentId) => void;
  onCreateNote?: (projectId: ProjectId) => void;
  categories?: ProjectCategory[];
  markerColors?: MarkerColors;
  linkPatterns?: LinkPattern[];
  // Notes section
  notes?: NoteModel[];
  onOpenNote?: (noteId: NoteId) => void;
  // Todos section
  todos?: TodoModel[];
  onOpenTodo?: (todoId: TodoId) => void;
  availablePriorities?: Priority[];
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
  onCreateNote,
  categories = [],
  markerColors = defaultMarkerColors,
  linkPatterns = [],
  notes = [],
  onOpenNote,
  todos = [],
  onOpenTodo,
  availablePriorities = [],
}: ProjectDetailsOverlayProps) {
  const [editingName, setEditingName] = useState(project.name);
  const [editingAlternatives, setEditingAlternatives] = useState(project.alternatives);
  const [editingColor, setEditingColor] = useState(project.color);
  const [editingContext, setEditingContext] = useState(project.context || "");
  const [editingCategory, setEditingCategory] = useState(project.category || "");

  // Get all names that could match this project (name + alternatives)
  const projectNames = [project.name.toLowerCase(), ...project.alternatives.map((a) => a.toLowerCase())];

  // Sync local state when project changes (after updates)
  // Legitimate prop sync pattern for editable form fields
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setEditingName(project.name);
    setEditingAlternatives(project.alternatives);
    setEditingColor(project.color);
    setEditingContext(project.context || "");
    setEditingCategory(project.category || "");
  }, [project]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Auto-save when fields change (except context - saved on blur)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (
        editingName.trim() !== project.name ||
        JSON.stringify(editingAlternatives) !== JSON.stringify(project.alternatives) ||
        editingColor !== project.color ||
        (editingCategory || undefined) !== project.category
      ) {
        onUpdate(project.id, {
          name: editingName.trim(),
          alternatives: editingAlternatives,
          color: editingColor ? getColor(editingColor) : undefined,
          context: editingContext.trim() || undefined,
          category: editingCategory ? getProjectCategoryId(editingCategory) : undefined,
        });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [editingName, editingAlternatives, editingColor, editingCategory, project, onUpdate, editingContext]);

  useEscapeKey(onClose);

  const handleDelete = () => {
    onDelete(project.id);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="3xl">
      <div className="p-6 space-y-6">
        {/* Header with Close Button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
              style={{ backgroundColor: editingColor || markerColors.project }}
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
            <CloseIcon className="w-6 h-6" />
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
            <ColorPicker value={editingColor} onChange={setEditingColor} defaultColor={markerColors.project} />

            {/* Category Field */}
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">📂 Category</label>
                <select
                  value={editingCategory}
                  onChange={(e) => setEditingCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {editingCategory && (
                  <div className="mt-2 flex items-center gap-2">
                    {(() => {
                      const selectedCategory = categories.find((c) => c.id === editingCategory);
                      if (!selectedCategory) return null;
                      return (
                        <>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {selectedCategory.description || selectedCategory.name}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Context */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">📝 Context</label>
            <RichTextEditor
              value={editingContext}
              onChange={(html) => setEditingContext(html || "")}
              onBlur={(html) => {
                // Commit context change on blur
                if ((html.trim() || undefined) !== project.context) {
                  onUpdate(project.id, {
                    name: editingName.trim(),
                    alternatives: editingAlternatives,
                    color: editingColor ? getColor(editingColor) : undefined,
                    context: html.trim() || undefined,
                    category: editingCategory ? getProjectCategoryId(editingCategory) : undefined,
                  });
                }
              }}
              placeholder="Add context..."
              minHeight="100px"
              maxHeight="300px"
              noBorderInViewMode={true}
              linkPatterns={linkPatterns}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4">
            <ActionButtons
              isArchived={project.archived || false}
              onCreateNote={
                onCreateNote
                  ? () => {
                      onCreateNote(project.id);
                      onClose();
                    }
                  : undefined
              }
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
              createNoteLabel="Create Meeting Note"
              archiveLabel="Archive project"
              unarchiveLabel="Unarchive project"
              deleteLabel="Delete project"
            />
          </div>
        </div>

        {/* Todos Section */}
        {todos.length > 0 && onOpenTodo && (() => {
          // Filter todos that have this project (by name, since IDs are stored as names)
          const projectTodos = todos.filter((t) =>
            t.projectIds.some((id) => projectNames.includes((id as string).toLowerCase()))
          );

          if (projectTodos.length === 0) return null;

          // Split into active and completed
          const activeTodos = projectTodos.filter((t) => !t.isCompleted && !t.isArchived);
          const completedTodos = projectTodos.filter((t) => t.isCompleted && !t.isArchived);
          const archivedTodos = projectTodos.filter((t) => t.isArchived);

          return (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
                ✅ Todos ({projectTodos.length})
              </h4>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {/* Active Todos */}
                {activeTodos.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
                      Active ({activeTodos.length})
                    </h5>
                    <div className="space-y-2">
                      {activeTodos.map((todo) => (
                        <TodoListItem
                          key={todo.id}
                          todo={todo}
                          onClick={() => {
                            onOpenTodo(todo.id);
                            onClose();
                          }}
                          markerColors={markerColors}
                          linkPatterns={linkPatterns}
                          availablePriorities={availablePriorities}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Todos */}
                {completedTodos.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
                      Completed ({completedTodos.length})
                    </h5>
                    <div className="space-y-2">
                      {completedTodos.map((todo) => (
                        <TodoListItem
                          key={todo.id}
                          todo={todo}
                          onClick={() => {
                            onOpenTodo(todo.id);
                            onClose();
                          }}
                          markerColors={markerColors}
                          linkPatterns={linkPatterns}
                          availablePriorities={availablePriorities}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Archived Todos */}
                {archivedTodos.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                      Archived ({archivedTodos.length})
                    </h5>
                    <div className="space-y-2">
                      {archivedTodos.map((todo) => (
                        <TodoListItem
                          key={todo.id}
                          todo={todo}
                          onClick={() => {
                            onOpenTodo(todo.id);
                            onClose();
                          }}
                          markerColors={markerColors}
                          linkPatterns={linkPatterns}
                          availablePriorities={availablePriorities}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Notes Section */}
        {notes.length > 0 && onOpenNote && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
              📝 Notes ({notes.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  onClick={() => {
                    onOpenNote(note.id);
                    onClose();
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Activity Section */}
        <ActivitySection
          activities={project.activity || []}
          comments={project.comments}
          linkPatterns={linkPatterns}
          onAddComment={(content) => onAddComment(project.id, content)}
          onEditComment={(commentId, content) => onEditComment(project.id, commentId, content)}
          onDeleteComment={(commentId) => onDeleteComment(project.id, commentId)}
        />
      </div>
    </Modal>
  );
}
