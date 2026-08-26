"use client";

import { ReactNode, useState, useEffect } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { BaseEntity, BaseEntityModel } from "@/models/BaseEntityModel";
import { MarkerColors } from "@/types/markerColors";
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

/**
 * One labelled group of todos in the overlay's todo section.
 *
 * Person and Project group the same list on different axes -- a person's todos
 * split into assigned, sourced and mentioned, a project's into active,
 * completed and archived -- so the grouping is the caller's, and only the
 * rendering is shared.
 */
export interface EntityTodoGroup {
  label: string;
  /** Tailwind text-colour classes for the group heading. */
  headingClass: string;
  todos: TodoModel[];
}

/**
 * A field this entity type has and the other does not, with what it takes to
 * save it. `changed` feeds the same debounce as the shared fields, so a lone
 * category edit still saves.
 */
export interface EntityExtraField<TEntity> {
  fields: ReactNode;
  updates: Partial<TEntity>;
  changed: boolean;
}

interface EntityDetailsOverlayProps<
  TId extends string,
  TEntity extends BaseEntity,
> {
  entity: BaseEntityModel<TEntity> & { id: TId };
  /** Capitalised, used in the dialog label, heading fallback and placeholder. */
  entityTypeName: string;
  /** Marker chips under the heading -- @name and $name for people, %name for projects. */
  markerBadges: ReactNode;
  /** Tailwind ring class for focused inputs, matching the entity's marker colour. */
  focusRingClass: string;
  /** Colour used for the avatar and as the ColorPicker's default. */
  defaultColor: string;
  alternativesPlaceholder: string;
  extra?: EntityExtraField<TEntity>;
  todoGroups: EntityTodoGroup[];
  createNoteLabel: string;

  onClose: () => void;
  onUpdate: (id: TId, updates: Partial<TEntity>) => void;
  onDelete: (id: TId) => void;
  onArchive?: (id: TId) => void;
  onUnarchive?: (id: TId) => void;
  onAddComment: (id: TId, content: string) => void;
  onEditComment: (id: TId, commentId: CommentId, content: string) => void;
  onDeleteComment: (id: TId, commentId: CommentId) => void;
  onCreateNote?: (id: TId) => void;
  markerColors: MarkerColors;
  linkPatterns: LinkPattern[];
  notes: NoteModel[];
  onOpenNote?: (noteId: NoteId) => void;
  onOpenTodo?: (todoId: TodoId) => void;
  availablePriorities: Priority[];
}

/**
 * The shared body of PersonDetailsOverlay and ProjectDetailsOverlay.
 *
 * The two were 365 and 401 lines that differed in four places: the marker
 * chips in the header, the accent colour, a category select projects have and
 * people do not, and how the todo list is grouped. Everything else -- the
 * debounced auto-save, the context editor committing on blur, the notes
 * section, the activity section and the action buttons -- was duplicated
 * character for character, including the three identical twenty-line blocks
 * that render each todo group.
 */
export function EntityDetailsOverlay<
  TId extends string,
  TEntity extends BaseEntity,
>({
  entity,
  entityTypeName,
  markerBadges,
  focusRingClass,
  defaultColor,
  alternativesPlaceholder,
  extra,
  todoGroups,
  createNoteLabel,
  onClose,
  onUpdate,
  onDelete,
  onArchive,
  onUnarchive,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onCreateNote,
  linkPatterns,
  notes,
  onOpenNote,
  onOpenTodo,
  markerColors,
  availablePriorities,
}: EntityDetailsOverlayProps<TId, TEntity>) {
  const [editingName, setEditingName] = useState(entity.name);
  const [editingAlternatives, setEditingAlternatives] = useState(
    entity.alternatives,
  );
  const [editingColor, setEditingColor] = useState(entity.color);
  const [editingContext, setEditingContext] = useState(entity.context || "");

  // Sync local state when the entity changes (after updates)
  // Legitimate prop sync pattern for editable form fields
  useEffect(() => {
    setEditingName(entity.name);
    setEditingAlternatives(entity.alternatives);
    setEditingColor(entity.color);
    setEditingContext(entity.context || "");
  }, [entity]);

  const sharedUpdates = (context: string): Partial<TEntity> =>
    ({
      name: editingName.trim(),
      alternatives: editingAlternatives,
      color: editingColor ? getColor(editingColor) : undefined,
      context: context.trim() || undefined,
      ...extra?.updates,
    }) as Partial<TEntity>;

  // Auto-save when fields change (except context - saved on blur)
  const extraChanged = extra?.changed ?? false;
  // The extra field's value has to be a dependency in its own right, not just
  // its changed flag: editing a category from A to B leaves `changed` true
  // throughout, and an effect that does not re-run fires the previous render's
  // timer, saving A.
  const extraKey = JSON.stringify(extra?.updates ?? null);
  useEffect(() => {
    const handler = setTimeout(() => {
      if (
        editingName.trim() !== entity.name ||
        JSON.stringify(editingAlternatives) !==
          JSON.stringify(entity.alternatives) ||
        editingColor !== entity.color ||
        extraChanged
      ) {
        onUpdate(entity.id, sharedUpdates(editingContext));
      }
    }, 500);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editingName,
    editingAlternatives,
    editingColor,
    extraChanged,
    extraKey,
    entity,
    onUpdate,
    editingContext,
  ]);

  useEscapeKey(onClose);

  const closeAfter = (action: () => void) => () => {
    action();
    onClose();
  };

  const totalTodos = todoGroups.reduce(
    (sum, group) => sum + group.todos.length,
    0,
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="3xl"
      label={`${entityTypeName} details`}
    >
      <div className="p-6 space-y-6">
        {/* Header with Close Button -- sticky so it stays reachable while scrolling */}
        <div className="flex items-start justify-between sticky top-0 z-10 -mx-6 -mt-6 px-6 pt-6 pb-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
              style={{ backgroundColor: editingColor || defaultColor }}
            >
              {editingName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {editingName || entityTypeName}
              </h2>
              <div className="flex gap-1.5 mt-1">{markerBadges}</div>
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
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                Name
              </label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 ${focusRingClass}`}
                placeholder={`${entityTypeName} name`}
              />
            </div>

            {/* Alternatives Field */}
            <AlternativesInput
              value={editingAlternatives}
              onChange={setEditingAlternatives}
              placeholder={alternativesPlaceholder}
            />

            {/* Color Field */}
            <ColorPicker
              value={editingColor}
              onChange={setEditingColor}
              defaultColor={defaultColor}
            />

            {extra?.fields}
          </div>

          {/* Context */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
              📝 Context
            </label>
            <RichTextEditor
              value={editingContext}
              onChange={(html) => setEditingContext(html || "")}
              onBlur={(html) => {
                // Commit context change on blur
                if ((html.trim() || undefined) !== entity.context) {
                  onUpdate(entity.id, sharedUpdates(html));
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
              isArchived={entity.archived || false}
              onCreateNote={
                onCreateNote
                  ? closeAfter(() => onCreateNote(entity.id))
                  : undefined
              }
              onArchive={
                onArchive ? closeAfter(() => onArchive(entity.id)) : undefined
              }
              onUnarchive={
                onUnarchive
                  ? closeAfter(() => onUnarchive(entity.id))
                  : undefined
              }
              onDelete={closeAfter(() => onDelete(entity.id))}
              createNoteLabel={createNoteLabel}
              archiveLabel={`Archive ${entityTypeName.toLowerCase()}`}
              unarchiveLabel={`Unarchive ${entityTypeName.toLowerCase()}`}
              deleteLabel={`Delete ${entityTypeName.toLowerCase()}`}
            />
          </div>
        </div>

        {/* Todos Section */}
        {totalTodos > 0 && onOpenTodo && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
              ✅ Todos ({totalTodos})
            </h4>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {todoGroups
                .filter((group) => group.todos.length > 0)
                .map((group) => (
                  <div key={group.label}>
                    <h5
                      className={`text-[10px] font-semibold uppercase tracking-wide mb-2 ${group.headingClass}`}
                    >
                      {group.label} ({group.todos.length})
                    </h5>
                    <div className="space-y-2">
                      {group.todos.map((todo) => (
                        <TodoListItem
                          key={todo.id}
                          todo={todo}
                          onClick={closeAfter(() => onOpenTodo(todo.id))}
                          markerColors={markerColors}
                          linkPatterns={linkPatterns}
                          availablePriorities={availablePriorities}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

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
                  onClick={closeAfter(() => onOpenNote(note.id))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Activity Section */}
        <ActivitySection
          activities={entity.activity || []}
          comments={entity.comments}
          linkPatterns={linkPatterns}
          onAddComment={(content) => onAddComment(entity.id, content)}
          onEditComment={(commentId, content) =>
            onEditComment(entity.id, commentId, content)
          }
          onDeleteComment={(commentId) => onDeleteComment(entity.id, commentId)}
        />
      </div>
    </Modal>
  );
}
