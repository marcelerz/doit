"use client";

import { useState } from "react";
import { LinkPattern } from "@/types/linkPattern";
import { getColor } from "@/types/types";
import { IconButton } from "@/components/shared/IconButton";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";

interface LinksTabProps {
  linkPatterns: LinkPattern[];
  onAdd: (pattern: Omit<LinkPattern, "id">) => void;
  onUpdate: (id: string, updates: Partial<LinkPattern>) => void;
  onDelete: (id: string) => void;
}

export function LinksTab({ linkPatterns, onAdd, onUpdate, onDelete }: LinksTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    prefix: "",
    urlTemplate: "",
    description: "",
    color: "#3b82f6",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.prefix.trim() === "" || formData.urlTemplate.trim() === "") return;

    const patternData = {
      prefix: formData.prefix.trim().toUpperCase(),
      urlTemplate: formData.urlTemplate.trim(),
      description: formData.description.trim(),
      color: getColor(formData.color),
    };

    if (editingId) {
      onUpdate(editingId, patternData);
      setEditingId(null);
    } else {
      onAdd(patternData);
    }

    setFormData({ prefix: "", urlTemplate: "", description: "", color: "#3b82f6" });
    setIsAdding(false);
  };

  const handleEdit = (pattern: LinkPattern) => {
    setEditingId(pattern.id);
    setFormData({
      prefix: pattern.prefix,
      urlTemplate: pattern.urlTemplate,
      description: pattern.description,
      color: pattern.color || "#3b82f6",
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ prefix: "", urlTemplate: "", description: "", color: "#3b82f6" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>Link Patterns</span>
          <InfoTooltip content={tooltipContent.linkPatterns} />
        </h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Link Pattern
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Define custom link patterns to convert text markers into clickable links. Use {"{id}"} as a placeholder for the
        identifier.
      </p>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Prefix (Capital Letter) *
            </label>
            <input
              type="text"
              value={formData.prefix}
              onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="T"
              maxLength={3}
              pattern="[A-Z]{1,3}"
              required
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Enter 1-3 capital letters (e.g., T, D, S, ABC)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">URL Template *</label>
            <input
              type="text"
              value={formData.urlTemplate}
              onChange={(e) => setFormData({ ...formData, urlTemplate: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="http://www.google.com/{id}"
              required
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Use {"{id}"} where the number should be inserted
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ticket link"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Link Color</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-600 cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              {editingId ? "Update" : "Add"} Pattern
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
        {linkPatterns.length === 0 ? (
          <p className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            No link patterns added yet. Click "Add Link Pattern" to get started.
          </p>
        ) : (
          linkPatterns.map((pattern) => (
            <div
              key={pattern.id}
              className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg text-white"
                style={{ backgroundColor: pattern.color || "#3b82f6" }}
              >
                {pattern.prefix}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{pattern.prefix}##### → Link</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono break-all">{pattern.urlTemplate}</p>
                {pattern.description && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">{pattern.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <IconButton icon="edit" onClick={() => handleEdit(pattern)} />
                <IconButton icon="delete" onClick={() => onDelete(pattern.id)} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How it works</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
          Link patterns convert text like{" "}
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">T12345</code> into clickable links.
        </p>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Pattern: Capital letter followed by 4+ digits. Use{" "}
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{"{id}"}</code> in the URL template as a
          placeholder for the number.
        </p>
      </div>
    </div>
  );
}
