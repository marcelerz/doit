"use client";

import { PersonModel } from "@/models/PersonModel";
import { PersonId } from "@/types/person";
import { ArchiveIcon, TrashIcon, UndoIcon, ClipboardIcon } from "@/components/shared/Icons";

interface PersonItemProps {
  person: PersonModel;
  onClick: () => void;
  onDelete: (id: PersonId) => void;
  onArchive?: (id: PersonId) => void;
  onUnarchive?: (id: PersonId) => void;
  onRequestDeleteConfirm: (id: PersonId, name: string) => void;
  taskCount?: number; // Number of tasks assigned to this person
}

export function PersonItem({
  person,
  onClick,
  onArchive,
  onUnarchive,
  onRequestDeleteConfirm,
  taskCount,
}: PersonItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDeleteConfirm(person.id, person.name);
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ backgroundColor: person.color || "#cce5ff" }}
        >
          {person.initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{person.name}</h3>
            {person.isArchived && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                Archived
              </span>
            )}
          </div>

          {/* Alternatives */}
          {person.alternatives.length > 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-500 dark:text-zinc-500">aka:</span> {person.alternatives.join(", ")}
            </p>
          )}

          {/* Metadata */}
          {(person.hasComments || (taskCount !== undefined && taskCount > 0)) && (
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              {taskCount !== undefined && taskCount > 0 && (
                <span className="flex items-center gap-1">
                  <ClipboardIcon className="w-3.5 h-3.5" />
                  {taskCount} task{taskCount !== 1 ? "s" : ""}
                </span>
              )}
              {person.hasComments && <span className="flex items-center gap-1">💬 {person.commentCount}</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {/* Archive button - for non-archived people */}
          {person.isActive && onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(person.id);
              }}
              className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-md transition-colors"
              aria-label="Archive person"
              title="Archive"
            >
              <ArchiveIcon className="w-4 h-4" />
            </button>
          )}

          {/* Unarchive button - for archived people */}
          {person.isArchived && onUnarchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnarchive(person.id);
              }}
              className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-md transition-colors"
              aria-label="Unarchive person"
              title="Unarchive"
            >
              <UndoIcon className="w-4 h-4" />
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
            aria-label="Delete person"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
