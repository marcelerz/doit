"use client";

import { useState } from "react";
import { Priority } from "@/types/settings";

interface PrioritiesTabProps {
  priorities: Priority[];
  onAdd: (priority: Omit<Priority, "id" | "comments" | "activity">) => void;
  onUpdate: (id: string, updates: Partial<Priority>) => void;
  onDelete: (id: string) => void;
}

export function PrioritiesTab({ priorities, onAdd, onUpdate, onDelete }: PrioritiesTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Priority>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newPriority, setNewPriority] = useState<Omit<Priority, "id" | "comments" | "activity">>({
    name: "",
    alternatives: [],
    color: "",
    order: priorities.length + 1,
  });

  const handleStartEdit = (priority: Priority) => {
    setEditingId(priority.id);
    setEditForm({ ...priority });
  };

  const handleSaveEdit = () => {
    if (editingId && editForm.name?.trim()) {
      onUpdate(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAdd = () => {
    if (newPriority.name.trim()) {
      onAdd({
        ...newPriority,
        color: newPriority.color || undefined, // Only set if provided
      });
      setNewPriority({
        name: "",
        alternatives: [],
        color: "",
        order: priorities.length + 2,
      });
      setIsAdding(false);
    }
  };

  const handleAlternativeChange = (text: string, isEditing: boolean) => {
    const alts = text
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a);

    if (isEditing) {
      setEditForm({ ...editForm, alternatives: alts });
    } else {
      setNewPriority({ ...newPriority, alternatives: alts });
    }
  };

  const sortedPriorities = [...priorities].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Priorities</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Priority
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Manage priority levels for your tasks. Use{" "}
        <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">!!</span> marker to assign
        priorities. Lower order numbers appear first.
      </p>

      <div className="space-y-4">
        {sortedPriorities.map((priority) => (
          <div
            key={priority.id}
            className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
          >
            {editingId === priority.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Alternatives (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editForm.alternatives?.join(", ") || ""}
                    onChange={(e) => handleAlternativeChange(e.target.value, true)}
                    placeholder="e.g., asap, critical"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Color (optional)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={editForm.color || "#ffd4d4"}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-600 cursor-pointer"
                      />
                      {editForm.color && (
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, color: "" })}
                          className="px-3 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          Use Default
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Order</label>
                    <input
                      type="number"
                      value={editForm.order || 1}
                      onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-900 dark:text-zinc-100 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600"
                    style={{ backgroundColor: priority.color || "#ffd4d4" }}
                  />
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {priority.name}
                      <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">(Order: {priority.order})</span>
                    </div>
                    {priority.alternatives.length > 0 && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Alternatives: {priority.alternatives.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartEdit(priority)}
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(priority.id)}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
            <input
              type="text"
              value={newPriority.name}
              onChange={(e) => setNewPriority({ ...newPriority, name: e.target.value })}
              placeholder="e.g., urgent, high, low"
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Alternatives (comma-separated)
            </label>
            <input
              type="text"
              value={newPriority.alternatives.join(", ")}
              onChange={(e) => handleAlternativeChange(e.target.value, false)}
              placeholder="e.g., asap, critical"
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Color (optional - defaults to #ffd4d4)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={newPriority.color || "#ffd4d4"}
                  onChange={(e) => setNewPriority({ ...newPriority, color: e.target.value })}
                  className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-600 cursor-pointer"
                />
                {newPriority.color && (
                  <button
                    type="button"
                    onClick={() => setNewPriority({ ...newPriority, color: "" })}
                    className="px-3 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Default
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Order</label>
              <input
                type="number"
                value={newPriority.order}
                onChange={(e) => setNewPriority({ ...newPriority, order: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Add Priority
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewPriority({
                  name: "",
                  alternatives: [],
                  color: "",
                  order: priorities.length + 1,
                });
              }}
              className="flex-1 px-4 py-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-900 dark:text-zinc-100 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
