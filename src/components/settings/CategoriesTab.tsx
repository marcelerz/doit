"use client";

import { useState } from "react";
import { ProjectCategory } from "@/types/project";
import { getColor } from "@/types/types";
import { useSettings } from "@/hooks/useSettings";
import { useProjects } from "@/hooks/useProjects";
import { SettingsLoading } from "./SettingsLoading";
import { SettingsHeader } from "./SettingsHeader";
import { NoticeBox } from "../shared/NoticeBox";
import { IconButton } from "@/components/shared/IconButton";

const tooltip = (
  <div className="space-y-2">
    <p>Custom groupings for tasks.</p>
    <ul className="space-y-1">
      <li>• Create your own categories</li>
      <li>• Different from projects</li>
      <li>• Use for areas of life, contexts, etc.</li>
    </ul>
  </div>
);

const getCategoryDefaults = (): Omit<ProjectCategory, "id"> => ({
  name: "",
  color: getColor("#3b82f6"),
  description: "",
});

export function CategoriesTab() {
  const { settings, isLoaded, addCategory, updateCategory, deleteCategory } = useSettings();
  const { projects, updateProject } = useProjects();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProjectCategory>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState<Omit<ProjectCategory, "id">>(getCategoryDefaults());

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  const categories = settings.categories;

  const canAdd = () => newCategory.name.trim() !== "";
  const canEdit = () => editingId !== null && editForm.name?.trim() !== "";

  const handleStartEdit = (category: ProjectCategory) => {
    setEditingId(category.id);
    setEditForm({ ...category });
  };

  const handleSaveEdit = () => {
    if (canEdit()) {
      updateCategory(editingId!, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAdd = () => {
    if (canAdd()) {
      addCategory(newCategory);
      setNewCategory(getCategoryDefaults());
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewCategory(getCategoryDefaults());
  };

  const handleDelete = (categoryId: string) => {
    // Clear category from all projects that use it
    projects.forEach((project) => {
      if (project.category === categoryId) {
        updateProject(project.id, { category: undefined });
      }
    });
    // Delete the category
    deleteCategory(categoryId);
  };

  return (
    <div className="space-y-4">
      <SettingsHeader
        title="Project Categories"
        tooltip={tooltip}
        description="Organize your projects into categories like 'Work', 'Personal', or client names. Categories can be assigned to projects."
        action={{
          label: "Add",
          onClick: () => setIsAdding(true),
          variant: "primary",
          hidden: isAdding,
        }}
      />

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
                  onChange={(e) => setNewCategory({ ...newCategory, color: getColor(e.target.value) })}
                  className="w-10 h-10 rounded cursor-pointer border border-zinc-300 dark:border-zinc-600"
                />
                <input
                  type="text"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: getColor(e.target.value) })}
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
                disabled={!canAdd()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              >
                Add Category
              </button>
              <button
                onClick={handleCancelAdd}
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
                        onChange={(e) => setEditForm({ ...editForm, color: getColor(e.target.value) })}
                        className="w-10 h-10 rounded cursor-pointer border border-zinc-300 dark:border-zinc-600"
                      />
                      <input
                        type="text"
                        value={editForm.color || ""}
                        onChange={(e) => setEditForm({ ...editForm, color: getColor(e.target.value) })}
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
                      disabled={!canEdit()}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <IconButton icon="edit" onClick={() => handleStartEdit(category)} />
                    <IconButton icon="delete" onClick={() => handleDelete(category.id)} />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <NoticeBox
        items={[
          "Assign categories to projects in the Projects tab",
          "View time tracked by category in the Statistics view",
          "Filter todos by category through their associated projects",
        ]}
      />
    </div>
  );
}
