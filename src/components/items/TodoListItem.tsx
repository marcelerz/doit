"use client";

import { TodoModel } from "@/models/TodoModel";
import { CheckCircleIcon, CheckIcon } from "@/components/shared/Icons";
import { MarkedText } from "@/components/shared/MarkedText";
import { MarkerColors, defaultMarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { Priority } from "@/types/priority";

interface TodoListItemProps {
  todo: TodoModel;
  onClick: () => void;
  markerColors?: MarkerColors;
  linkPatterns?: LinkPattern[];
  availablePeople?: PersonModel[];
  availableProjects?: ProjectModel[];
  availablePriorities?: Priority[];
}

/**
 * Compact todo item for display in overlays (PersonDetailsOverlay, ProjectDetailsOverlay)
 */
export function TodoListItem({
  todo,
  onClick,
  markerColors = defaultMarkerColors,
  linkPatterns = [],
  availablePeople = [],
  availableProjects = [],
  availablePriorities = [],
}: TodoListItemProps) {
  const contextPreview = todo.context ? todo.context.replace(/<[^>]*>/g, "").slice(0, 80) : "";

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
    >
      <div className="flex items-start gap-2">
        {/* Completion icon */}
        {todo.isCompleted ? (
          <div className="w-4 h-4 mt-0.5 rounded-full bg-green-500 dark:bg-green-400 flex items-center justify-center flex-shrink-0">
            <CheckIcon className="w-3 h-3 text-white" />
          </div>
        ) : (
          <CheckCircleIcon className="w-4 h-4 mt-0.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with highlighted markers */}
          <div className="flex items-center gap-1.5">
            <span
              className={`font-medium text-sm truncate ${
                todo.isCompleted
                  ? "text-zinc-500 dark:text-zinc-400 line-through"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              <MarkedText
                text={todo.text}
                markerColors={markerColors}
                linkPatterns={linkPatterns}
                availablePeople={availablePeople}
                availableProjects={availableProjects}
                availablePriorities={availablePriorities}
              />
            </span>
            {todo.isArchived && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                Archived
              </span>
            )}
          </div>

          {/* Context preview */}
          {contextPreview && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
              {contextPreview}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
            <span>{todo.ageDisplay}</span>
            {todo.priority && (
              <span
                className="px-1 py-0.5 rounded"
                style={{
                  backgroundColor: `${markerColors.priority}20`,
                  color: markerColors.priority,
                }}
              >
                !{todo.priority}
              </span>
            )}
            {todo.dueDate && (
              <span className={todo.isOverdue ? "text-red-500" : ""}>
                {todo.dueDateDisplay}
              </span>
            )}
            {todo.hasComments && <span>💬 {todo.commentCount}</span>}
            {todo.subtaskCount > 0 && (
              <span>
                {todo.completedSubtaskCount}/{todo.subtaskCount} subtasks
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
