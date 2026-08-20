"use client";

import { useState } from "react";
import { Subtask, SubtaskId } from "@/types/todo";
import { CheckIcon, CloseIcon, EditIcon, TrashIcon } from "@/components/shared/Icons";

interface SubtasksProps {
  subtasks: Subtask[];
  onAdd: (text: string) => void;
  onToggle: (subtaskId: SubtaskId) => void;
  onEdit: (subtaskId: SubtaskId, text: string) => void;
  onDelete: (subtaskId: SubtaskId) => void;
  readOnly?: boolean;
}

export function Subtasks({ subtasks, onAdd, onToggle, onEdit, onDelete, readOnly = false }: SubtasksProps) {
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [editingId, setEditingId] = useState<SubtaskId | null>(null);
  const [editingText, setEditingText] = useState("");

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskText.trim()) {
      onAdd(newSubtaskText.trim());
      setNewSubtaskText("");
    }
  };

  const startEditing = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditingText(subtask.text);
  };

  const handleSaveEdit = () => {
    if (editingId && editingText.trim()) {
      onEdit(editingId, editingText.trim());
    }
    setEditingId(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-3" data-testid="subtasks-container">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="flex items-center gap-3" data-testid="subtasks-progress">
          <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 dark:bg-green-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            {completedCount}/{totalCount} ({progress}%)
          </span>
        </div>
      )}

      {/* Subtask list */}
      <ul className="space-y-2" data-testid="subtasks-list">
        {subtasks.map((subtask) => (
          <li key={subtask.id} className="flex items-center gap-2 group" data-testid="subtask-item">
            {editingId === subtask.id ? (
              // Edit mode
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveEdit}
                  className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  title="Save"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  title="Cancel"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // View mode
              <>
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => !readOnly && onToggle(subtask.id)}
                  disabled={readOnly}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                  data-testid="subtask-checkbox"
                />
                <span
                  className={`flex-1 text-sm ${
                    subtask.completed
                      ? "line-through text-zinc-400 dark:text-zinc-500"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                  data-testid="subtask-text"
                >
                  {subtask.text}
                </span>
                {!readOnly && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(subtask)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                      title="Edit subtask"
                      data-testid="subtask-edit"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(subtask.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                      title="Delete subtask"
                      data-testid="subtask-delete"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Add new subtask input */}
      {!readOnly && (
        <form onSubmit={handleAddSubtask} className="flex items-center gap-2" data-testid="subtask-add-form">
          <input
            type="text"
            value={newSubtaskText}
            onChange={(e) => setNewSubtaskText(e.target.value)}
            placeholder="Add a subtask..."
            className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="subtask-input"
          />
          <button
            type="submit"
            disabled={!newSubtaskText.trim()}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500 rounded-lg transition-colors"
            data-testid="subtask-add-button"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
