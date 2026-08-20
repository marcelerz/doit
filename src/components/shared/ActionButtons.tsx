"use client";

import { DuplicateIcon, UndoIcon, ArchiveIcon, TrashIcon, NoteAddIcon } from "@/components/shared/Icons";

interface ActionButtonsProps {
  isArchived: boolean;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onCreateNote?: () => void;
  archiveLabel?: string;
  unarchiveLabel?: string;
  duplicateLabel?: string;
  deleteLabel?: string;
  createNoteLabel?: string;
}

export function ActionButtons({
  isArchived,
  onArchive,
  onUnarchive,
  onDuplicate,
  onDelete,
  onCreateNote,
  archiveLabel = "Archive",
  unarchiveLabel = "Unarchive",
  duplicateLabel = "Duplicate",
  deleteLabel = "Delete",
  createNoteLabel = "Create Note",
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-2" data-testid="action-buttons">
      {/* Create Note button */}
      {onCreateNote && (
        <button
          onClick={onCreateNote}
          className="p-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-md transition-colors"
          aria-label={createNoteLabel}
          title={createNoteLabel}
          data-testid="action-create-note"
        >
          <NoteAddIcon className="w-4 h-4" />
        </button>
      )}

      {/* Duplicate button */}
      {onDuplicate && (
        <button
          onClick={onDuplicate}
          className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-md transition-colors"
          aria-label={duplicateLabel}
          title={duplicateLabel}
          data-testid="action-duplicate"
        >
          <DuplicateIcon className="w-4 h-4" />
        </button>
      )}

      {/* Archive/Unarchive button */}
      {isArchived && onUnarchive ? (
        <button
          onClick={onUnarchive}
          className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-md transition-colors"
          aria-label={unarchiveLabel}
          title={unarchiveLabel}
          data-testid="action-unarchive"
        >
          <UndoIcon className="w-4 h-4" />
        </button>
      ) : (
        !isArchived &&
        onArchive && (
          <button
            onClick={onArchive}
            className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-md transition-colors"
            aria-label={archiveLabel}
            title={archiveLabel}
            data-testid="action-archive"
          >
            <ArchiveIcon className="w-4 h-4" />
          </button>
        )
      )}

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
          aria-label={deleteLabel}
          title={deleteLabel}
          data-testid="action-delete"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
