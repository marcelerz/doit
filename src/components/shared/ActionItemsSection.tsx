"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { NoteId, ActionItemId, ActionItem, CreatedActionItem } from "@/types/note";
import { TodoId } from "@/types/todo";
import { MarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import { MarkedText } from "@/components/shared/MarkedText";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { TodoModel } from "@/models/TodoModel";
import { CheckCircleIcon, TrashIcon, ExternalLinkIcon } from "@/components/shared/Icons";

interface ActionItemsSectionProps {
  noteId: NoteId;
  actionItems: ActionItem[];
  createdActionItems: CreatedActionItem[];
  todos: TodoModel[];
  onAddActionItem: (noteId: NoteId, text: string, plainText: string) => void;
  onEditActionItem: (noteId: NoteId, actionItemId: ActionItemId, text: string, plainText: string) => void;
  onDeleteActionItem: (noteId: NoteId, actionItemId: ActionItemId) => void;
  onConvertActionItems: (noteId: NoteId) => void;
  onOpenTodo: (todoId: TodoId) => void;
  onToggleTodo?: (todoId: TodoId) => void;
  availablePeople: PersonModel[];
  availableProjects: ProjectModel[];
  markerColors: MarkerColors;
  linkPatterns?: LinkPattern[];
}

interface ActionItemInputProps {
  actionItem?: ActionItem;
  isNewInput?: boolean;
  onSave: (text: string, plainText: string) => void;
  onDelete?: () => void;
  onEnterCreateNew?: () => void;
  availablePeople: PersonModel[];
  availableProjects: ProjectModel[];
  markerColors: MarkerColors;
}

function ActionItemInput({
  actionItem,
  isNewInput,
  onSave,
  onDelete,
  onEnterCreateNew,
  availablePeople,
  availableProjects,
  markerColors,
}: ActionItemInputProps) {
  const [localText, setLocalText] = useState(actionItem?.text || "");
  const [localPlainText, setLocalPlainText] = useState(actionItem?.plainText || "");
  const inputRef = useRef<SmartEditableInputHandle>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSavedRef = useRef(false);

  // Auto-focus when this is the new input
  useEffect(() => {
    if (isNewInput && inputRef.current) {
      // Small delay to ensure the component is mounted
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isNewInput]);

  const handleChange = useCallback(
    (_tokens: TokenMatch[], fullText: string, plainText: string) => {
      setLocalText(fullText);
      setLocalPlainText(plainText);

      // For existing items (not the new input), debounce save
      if (actionItem) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          if (plainText.trim() !== "") {
            onSave(fullText, plainText);
          }
        }, 300);
      }
      // For the new input, don't auto-save on every keystroke - wait for Enter
    },
    [onSave, actionItem],
  );

  // Handle Enter to commit (and trigger reset via key change for new items)
  const handleEnterPress = useCallback(() => {
    // Clear any pending debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save immediately if there's content
    if (localPlainText.trim() !== "" && !hasSavedRef.current) {
      hasSavedRef.current = true;
      onSave(localText, localPlainText);
      // Notify parent to create new input and focus it
      onEnterCreateNew?.();
    }
  }, [localText, localPlainText, onSave, onEnterCreateNew]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-start gap-2 group">
      {/* Checkbox placeholder */}
      <div className="mt-2.5 w-5 h-5 rounded border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0" />

      {/* SmartInput */}
      <div className="flex-1 min-w-0">
        <SmartEditableInput
          ref={inputRef}
          initialValue={actionItem?.text || ""}
          availablePeople={availablePeople}
          availableProjects={availableProjects}
          availablePriorities={[]}
          markerColors={markerColors}
          onAddPerson={() => {}}
          onAddProject={() => {}}
          onAddPriority={() => {}}
          placeholder={isNewInput ? "Add action item... (Enter to add)" : "Action item"}
          onTokensChange={handleChange}
          onEnterPress={handleEnterPress}
        />
      </div>

      {/* Delete button - show for all items that have onDelete handler */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="mt-2 p-1 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
          aria-label="Delete action item"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function ActionItemsSection({
  noteId,
  actionItems,
  createdActionItems,
  todos,
  onAddActionItem,
  onEditActionItem,
  onDeleteActionItem,
  onConvertActionItems,
  onOpenTodo,
  onToggleTodo,
  availablePeople,
  availableProjects,
  markerColors,
  linkPatterns = [],
}: ActionItemsSectionProps) {
  // Key counter to force remount of new-input after saving
  const [newInputKey, setNewInputKey] = useState(0);

  // Count non-empty action items for the convert button
  const nonEmptyCount = actionItems.filter((item) => item.plainText.trim() !== "").length;

  const handleSaveNew = useCallback(
    (text: string, plainText: string) => {
      if (plainText.trim() !== "") {
        onAddActionItem(noteId, text, plainText);
      }
    },
    [noteId, onAddActionItem],
  );

  // Called after saving new item to reset and focus the new input
  const handleEnterCreateNew = useCallback(() => {
    setNewInputKey((k) => k + 1);
  }, []);

  const handleSaveExisting = useCallback(
    (actionItemId: ActionItemId) => (text: string, plainText: string) => {
      if (plainText.trim() !== "") {
        onEditActionItem(noteId, actionItemId, text, plainText);
      }
    },
    [noteId, onEditActionItem],
  );

  const handleDelete = useCallback(
    (actionItemId: ActionItemId) => () => {
      onDeleteActionItem(noteId, actionItemId);
    },
    [noteId, onDeleteActionItem],
  );

  const handleConvert = useCallback(() => {
    onConvertActionItems(noteId);
  }, [noteId, onConvertActionItems]);

  // Get todo for a created action item
  const getTodoForActionItem = useCallback(
    (createdItem: CreatedActionItem): TodoModel | undefined => {
      return todos.find((t) => t.id === createdItem.todoId);
    },
    [todos],
  );

  return (
    <div className="space-y-4" data-testid="action-items-section">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Action Items</h3>
        {nonEmptyCount > 0 && (
          <button
            onClick={handleConvert}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Create {nonEmptyCount} Todo{nonEmptyCount !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Pending action items */}
      <div className="space-y-2">
        {actionItems.map((item) => (
          <ActionItemInput
            key={item.id}
            actionItem={item}
            onSave={handleSaveExisting(item.id)}
            onDelete={handleDelete(item.id)}
            availablePeople={availablePeople}
            availableProjects={availableProjects}
            markerColors={markerColors}
          />
        ))}

        {/* Always show one empty input at the end - key changes to reset after save */}
        <ActionItemInput
          key={`new-input-${newInputKey}`}
          isNewInput={true}
          onSave={handleSaveNew}
          onEnterCreateNew={handleEnterCreateNew}
          availablePeople={availablePeople}
          availableProjects={availableProjects}
          markerColors={markerColors}
        />
      </div>

      {/* Action Items as Todos (converted from action items) */}
      {createdActionItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            Action Items as Todos
          </h4>
          <ul className="space-y-1">
            {createdActionItems.map((createdItem) => {
              const todo = getTodoForActionItem(createdItem);
              if (!todo) return null;

              const isCompleted = todo.isCompleted;

              return (
                <li
                  key={createdItem.id}
                  className="flex items-center gap-2 group p-2 -mx-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  {/* Clickable checkbox to toggle todo */}
                  <button
                    onClick={() => onToggleTodo?.(todo.id)}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-zinc-300 dark:border-zinc-600 hover:border-green-500"
                    }`}
                    aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {isCompleted && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Todo text - clickable to open, with marker highlighting */}
                  <button
                    onClick={() => onOpenTodo(todo.id)}
                    className="flex-1 text-left text-sm"
                  >
                    <MarkedText
                      text={todo.text}
                      completed={isCompleted}
                      markerColors={markerColors}
                      linkPatterns={linkPatterns}
                      availablePeople={availablePeople}
                      availableProjects={availableProjects}
                      availablePriorities={[]}
                    />
                  </button>

                  {/* External link icon on hover */}
                  <span className="p-1 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity">
                    <ExternalLinkIcon className="w-4 h-4" />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
