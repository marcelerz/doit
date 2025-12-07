"use client";

import { useState } from "react";
import { ProjectCategory } from "@/types/settings";

interface CategoriesTabProps {
  categories: ProjectCategory[];
  onAdd: (category: Omit<ProjectCategory, "id">) => string;
  onUpdate: (id: string, updates: Partial<ProjectCategory>) => void;
  onDelete: (id: string) => void;
}

export function CategoriesTab({ categories, onAdd, onUpdate, onDelete }: CategoriesTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProjectCategory>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState<Omit<ProjectCategory, "id">>({
    name: "",
    color: "#3b82f6",
    description: "",
  });

  const handleStartEdit = (category: ProjectCategory) => {
    setEditingId(category.id);
    setEditForm({ ...category });
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
    if (newCategory.name.trim()) {
      onAdd(newCategory);
      setNewCategory({
        name: "",
        color: "#3b82f6",
        description: "",
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Project Categories</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Category
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Organize your projects into categories like &quot;Work&quot;, &quot;Personal&quot;, or client names. Categories
        can be assigned to projects and used to schedule specific types of work during designated time blocks.
      </p>

      {/* Add new category form */}
      {isAdding && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3">New Category</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Work, Personal, Client A"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-zinc-300 dark:border-zinc-600"
                />
                <input
                  type="text"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={newCategory.description || ""}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="e.g., Office and work-related tasks"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newCategory.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              >
                Add Category
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewCategory({ name: "", color: "#3b82f6", description: "" });
                }}
                className="flex-1 px-4 py-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-zinc-900 dark:text-zinc-100 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <p>No categories yet. Add your first category to organize your projects.</p>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
            >
              {editingId === category.id ? (
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
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={editForm.color || "#3b82f6"}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border border-zinc-300 dark:border-zinc-600"
                      />
                      <input
                        type="text"
                        value={editForm.color || ""}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="e.g., Office and work-related tasks"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                      className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{category.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleStartEdit(category)}
                      className="px-3 py-1.5 text-sm bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(category.id)}
                      className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Usage info */}
      <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">How to use categories</h3>
        <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 list-disc list-inside">
          <li>Assign categories to projects in the Projects tab or when editing a project</li>
          <li>In Work Hours settings, assign categories to time blocks to schedule specific work types</li>
          <li>View time tracked by category in the Statistics view</li>
          <li>Filter todos by category through their associated projects</li>
        </ul>
      </div>
    </div>
  );
}
