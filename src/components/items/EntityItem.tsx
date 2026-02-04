"use client";

import { ArchiveIcon, TrashIcon, UndoIcon, ClipboardIcon, DocumentIcon, NoteAddIcon } from "@/components/shared/Icons";

/**
 * Counts for todos and notes related to an entity
 */
export type EntityCounts = {
  activeTodos: number;
  closedTodos: number;
  activeNotes: number;
  archivedNotes: number;
};

/**
 * Common interface for entities that can be displayed in EntityItem
 */
interface EntityLike {
  id: string;
  name: string;
  initials: string;
  color: string | undefined;
  alternatives: string[];
  isActive: boolean;
  isArchived: boolean;
  hasComments: boolean;
  commentCount: number;
}

/**
 * Configuration for entity-specific behavior
 */
export interface EntityConfig {
  /** Entity type name for aria-labels (e.g., "person", "project") */
  entityType: string;
  /** Default avatar color when entity has no color */
  defaultColor: string;
  /** Label for the create note button */
  createNoteLabel: string;
}

interface EntityItemProps<TId extends string> {
  /** The entity to display */
  entity: EntityLike;
  /** Configuration for entity-specific behavior */
  config: EntityConfig;
  /** Called when the item is clicked */
  onClick: () => void;
  /** Called when delete is requested (unused but required for interface consistency) */
  onDelete?: (id: TId) => void;
  /** Called to archive the entity */
  onArchive?: (id: TId) => void;
  /** Called to unarchive the entity */
  onUnarchive?: (id: TId) => void;
  /** Called to request delete confirmation */
  onRequestDeleteConfirm: (id: TId, name: string) => void;
  /** Called to create a note for this entity */
  onCreateNote?: (id: TId) => void;
  /** Counts of related todos and notes */
  counts?: EntityCounts;
}

/**
 * Generic entity item component for displaying Person or Project items.
 * Provides consistent UI for entities with:
 * - Avatar with initials
 * - Name with archived badge
 * - Alternative names
 * - Todo/note counts
 * - Comment count
 * - Action buttons (create note, archive, unarchive, delete)
 */
export function EntityItem<TId extends string>({
  entity,
  config,
  onClick,
  onArchive,
  onUnarchive,
  onRequestDeleteConfirm,
  onCreateNote,
  counts,
}: EntityItemProps<TId>) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDeleteConfirm(entity.id as TId, entity.name);
  };

  const hasCounts =
    counts && (counts.activeTodos > 0 || counts.closedTodos > 0 || counts.activeNotes > 0 || counts.archivedNotes > 0);

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ backgroundColor: entity.color || config.defaultColor }}
        >
          {entity.initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{entity.name}</h3>
            {entity.isArchived && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                Archived
              </span>
            )}
          </div>

          {/* Alternatives */}
          {entity.alternatives.length > 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-500 dark:text-zinc-500">aka:</span> {entity.alternatives.join(", ")}
            </p>
          )}

          {/* Metadata */}
          {(entity.hasComments || hasCounts) && (
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              {counts && (counts.activeTodos > 0 || counts.closedTodos > 0) && (
                <span className="flex items-center gap-1" title="Todos: active / completed+archived">
                  <ClipboardIcon className="w-3.5 h-3.5" />
                  {counts.activeTodos} / {counts.closedTodos}
                </span>
              )}
              {counts && (counts.activeNotes > 0 || counts.archivedNotes > 0) && (
                <span className="flex items-center gap-1" title="Notes: active / archived">
                  <DocumentIcon className="w-3.5 h-3.5" />
                  {counts.activeNotes} / {counts.archivedNotes}
                </span>
              )}
              {entity.hasComments && <span className="flex items-center gap-1">💬 {entity.commentCount}</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {/* Create Note button */}
          {onCreateNote && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateNote(entity.id as TId);
              }}
              className="p-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-md transition-colors"
              aria-label={config.createNoteLabel}
              title={config.createNoteLabel}
            >
              <NoteAddIcon className="w-4 h-4" />
            </button>
          )}

          {/* Archive button - for non-archived entities */}
          {entity.isActive && onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(entity.id as TId);
              }}
              className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-md transition-colors"
              aria-label={`Archive ${config.entityType}`}
              title="Archive"
            >
              <ArchiveIcon className="w-4 h-4" />
            </button>
          )}

          {/* Unarchive button - for archived entities */}
          {entity.isArchived && onUnarchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnarchive(entity.id as TId);
              }}
              className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-md transition-colors"
              aria-label={`Unarchive ${config.entityType}`}
              title="Unarchive"
            >
              <UndoIcon className="w-4 h-4" />
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
            aria-label={`Delete ${config.entityType}`}
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Pre-configured entity configs for common entity types
 */
export const PERSON_CONFIG: EntityConfig = {
  entityType: "person",
  defaultColor: "#cce5ff",
  createNoteLabel: "Create 1:1 Note",
};

export const PROJECT_CONFIG: EntityConfig = {
  entityType: "project",
  defaultColor: "#e2ccff",
  createNoteLabel: "Create Meeting Note",
};
