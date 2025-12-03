"use client";

import { Person } from "@/types/settings";

interface PersonItemProps {
  person: Person;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export function PersonItem({ person, onClick, onDelete }: PersonItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete ${person.name}?`)) {
      onDelete(person.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ backgroundColor: person.color }}
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
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              <span className="text-zinc-500 dark:text-zinc-500">aka:</span> {person.alternatives.join(", ")}
            </p>
          )}

          {/* Markers */}
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300">
              @{person.name}
            </span>
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300">
              ${person.name}
            </span>
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300">
              ^{person.name}
            </span>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            {person.comments && person.comments.length > 0 && (
              <span className="flex items-center gap-1">💬 {person.comments.length}</span>
            )}
            {person.imageUrl && <span className="flex items-center gap-1">🖼️ Has image</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDelete}
            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete person"
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
