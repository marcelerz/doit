"use client";

import { Person } from "@/types/settings";

interface PersonItemProps {
  person: Person;
  onClick: () => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
}

export function PersonItem({ person, onClick, onDelete, onArchive, onUnarchive }: PersonItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete ${person.name}?`)) {
      onDelete(person.id);
    }
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
          {person.name.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{person.name}</h3>
            {person.archived && (
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
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            {person.comments && person.comments.length > 0 && (
              <span className="flex items-center gap-1">💬 {person.comments.length}</span>
            )}
            {person.imageUrl && <span className="flex items-center gap-1">🖼️ Has image</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {/* Archive button - for non-archived people */}
          {!person.archived && onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(person.id);
              }}
              className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-md transition-colors"
              aria-label="Archive person"
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
          )}

          {/* Unarchive button - for archived people */}
          {person.archived && onUnarchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnarchive(person.id);
              }}
              className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-md transition-colors"
              aria-label="Unarchive person"
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
          )}

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
            aria-label="Delete person"
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
    </div>
  );
}
