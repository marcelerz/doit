"use client";

interface ActionButtonsProps {
  isArchived: boolean;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  archiveLabel?: string;
  unarchiveLabel?: string;
  duplicateLabel?: string;
  deleteLabel?: string;
}

export function ActionButtons({
  isArchived,
  onArchive,
  onUnarchive,
  onDuplicate,
  onDelete,
  archiveLabel = "Archive",
  unarchiveLabel = "Unarchive",
  duplicateLabel = "Duplicate",
  deleteLabel = "Delete",
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-2" data-testid="action-buttons">
      {/* Duplicate button */}
      {onDuplicate && (
        <button
          onClick={onDuplicate}
          className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-md transition-colors"
          aria-label={duplicateLabel}
          title={duplicateLabel}
          data-testid="action-duplicate"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
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
        !isArchived &&
        onArchive && (
          <button
            onClick={onArchive}
            className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-md transition-colors"
            aria-label={archiveLabel}
            title={archiveLabel}
            data-testid="action-archive"
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
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
          aria-label={deleteLabel}
          title={deleteLabel}
          data-testid="action-delete"
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
      )}
    </div>
  );
}
