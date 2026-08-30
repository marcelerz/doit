"use client";

import { useState, useEffect } from "react";
import { ProjectModel } from "@/models/ProjectModel";
import {
  Project,
  ProjectCategory,
  ProjectId,
  getProjectCategoryId,
} from "@/types/project";
import { MarkerColors, defaultMarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import { CommentId } from "@/types/types";
import { NoteModel } from "@/models/NoteModel";
import { TodoModel } from "@/models/TodoModel";
import { NoteId } from "@/types/note";
import { TodoId } from "@/types/todo";
import { Priority } from "@/types/priority";
import { EntityDetailsOverlay, EntityTodoGroup } from "./EntityDetailsOverlay";

interface ProjectDetailsOverlayProps {
  project: ProjectModel;
  onClose: () => void;
  /** Shown under the name field when a rename was refused. */
  nameError?: string | null;
  onUpdate: (id: ProjectId, updates: Partial<Project>) => void;
  onDelete: (id: ProjectId) => void;
  onArchive?: (id: ProjectId) => void;
  onUnarchive?: (id: ProjectId) => void;
  onAddComment: (projectId: ProjectId, content: string) => void;
  onEditComment: (
    projectId: ProjectId,
    commentId: CommentId,
    content: string,
  ) => void;
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
  categories = [],
  markerColors = defaultMarkerColors,
  linkPatterns = [],
  notes = [],
  todos = [],
  availablePriorities = [],
  ...callbacks
}: ProjectDetailsOverlayProps) {
  const [editingCategory, setEditingCategory] = useState(
    project.category || "",
  );

  // Sync local state when the project changes (after updates)
  // Legitimate prop sync pattern for editable form fields
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setEditingCategory(project.category || "");
  }, [project]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Todo ids hold names, so match on the project's name and all its alternatives
  const projectNames = [
    project.name.toLowerCase(),
    ...project.alternatives.map((a) => a.toLowerCase()),
  ];
  const projectTodos = todos.filter((t) =>
    t.projectIds.some((id) => projectNames.includes(id.toLowerCase())),
  );

  // A project's todos group by state -- unlike a person's, which group by relationship
  const todoGroups: EntityTodoGroup[] = [
    {
      label: "Active",
      headingClass: "text-blue-600 dark:text-blue-400",
      todos: projectTodos.filter((t) => !t.isCompleted && !t.isArchived),
    },
    {
      label: "Completed",
      headingClass: "text-green-600 dark:text-green-400",
      todos: projectTodos.filter((t) => t.isCompleted && !t.isArchived),
    },
    {
      label: "Archived",
      headingClass: "text-zinc-500 dark:text-zinc-400",
      todos: projectTodos.filter((t) => t.isArchived),
    },
  ];

  const selectedCategory = categories.find((c) => c.id === editingCategory);

  return (
    <EntityDetailsOverlay<ProjectId, Project>
      entity={project}
      entityTypeName="Project"
      focusRingClass="focus:ring-purple-500"
      defaultColor={markerColors.project}
      alternativesPlaceholder="e.g., Web Redesign, Site Refresh"
      createNoteLabel="Create Meeting Note"
      todoGroups={todoGroups}
      markerBadges={
        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium">
          %{project.name}
        </span>
      }
      extra={{
        changed: (editingCategory || undefined) !== project.category,
        updates: {
          category: editingCategory
            ? getProjectCategoryId(editingCategory)
            : undefined,
        },
        fields:
          categories.length > 0 ? (
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                📂 Category
              </label>
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
              {selectedCategory && (
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedCategory.description || selectedCategory.name}
                  </span>
                </div>
              )}
            </div>
          ) : null,
      }}
      markerColors={markerColors}
      linkPatterns={linkPatterns}
      notes={notes}
      availablePriorities={availablePriorities}
      {...callbacks}
    />
  );
}
