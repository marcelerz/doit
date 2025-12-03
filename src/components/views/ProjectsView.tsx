"use client";

import { useState } from "react";
import { Project } from "@/types/settings";

interface ProjectsTabProps {
  projects: Project[];
  onAdd: (project: Omit<Project, "id" | "comments" | "activity">) => void;
  onUpdate: (id: string, updates: Partial<Project>) => void;
  onDelete: (id: string) => void;
}

export function ProjectsTab({ projects, onAdd, onUpdate, onDelete }: ProjectsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    alternatives: "",
    imageUrl: "",
    color: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const projectData = {
      name: formData.name.trim(),
      alternatives: formData.alternatives
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a),
      imageUrl: formData.imageUrl.trim() || undefined,
      color: formData.color || undefined, // Only set if provided
    };

    if (editingId) {
      onUpdate(editingId, projectData);
      setEditingId(null);
    } else {
      onAdd(projectData);
    }

    setFormData({ name: "", alternatives: "", imageUrl: "", color: "" });
    setIsAdding(false);
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setFormData({
      name: project.name,
      alternatives: project.alternatives.join(", "),
      imageUrl: project.imageUrl || "",
      color: project.color || "",
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: "", alternatives: "", imageUrl: "", color: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Projects</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Project
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Marker: <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">#</span> = project assignment
      </p>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Website Redesign"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Alternative Names (comma-separated)
            </label>
            <input
              type="text"
              value={formData.alternatives}
              onChange={(e) => setFormData({ ...formData, alternatives: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="WebRedesign, Site"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/project-icon.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Color (optional - defaults to marker color)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={formData.color || "#e2ccff"}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="#e2ccff (default)"
                pattern="^#[0-9A-Fa-f]{6}$|^$"
              />
              {formData.color && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, color: "" })}
                  className="px-3 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Use Default
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              {editingId ? "Update" : "Add"} Project
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {projects.length === 0 ? (
          <p className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            No projects added yet. Click "Add Project" to get started.
          </p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: project.color || "#e2ccff", color: "#333" }}
              >
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</h3>
                {project.alternatives.length > 0 && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Also: {project.alternatives.join(", ")}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(project)}
                  className="px-3 py-1 text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(project.id)}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
