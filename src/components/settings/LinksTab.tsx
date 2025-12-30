"use client";

import { useState } from "react";
import { LinkPattern } from "@/types/linkPattern";
import { getColor } from "@/types/types";
import { useSettings } from "@/hooks/useSettings";
import { IconButton } from "@/components/shared/IconButton";
import { SettingsLoading } from "./SettingsLoading";
import { SettingsHeader } from "./SettingsHeader";
import { NoticeBox } from "../shared/NoticeBox";

const tooltip = (
  <div className="space-y-2">
    <p>Auto-link text patterns to URLs.</p>
    <ul className="space-y-1">
      <li>• Define patterns like "JIRA-123"</li>
      <li>• Automatically creates clickable links</li>
      <li>• Use $1, $2 for captured groups</li>
    </ul>
  </div>
);

const getFormDefaults = () => ({
  prefix: "",
  urlTemplate: "",
  description: "",
  color: "#3b82f6",
});

export function LinksTab() {
  const { settings, isLoaded, addLinkPattern, updateLinkPattern, deleteLinkPattern } = useSettings();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(getFormDefaults());

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  const linkPatterns = settings.linkPatterns;

  const canAdd = () => formData.prefix.trim() !== "" && formData.urlTemplate.trim() !== "";

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
      updateLinkPattern(editingId, patternData);
      setEditingId(null);
    } else {
      addLinkPattern(patternData);
    }

    setFormData(getFormDefaults());
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
    setFormData(getFormDefaults());
  };

  return (
    <div className="space-y-4">
      <SettingsHeader
        title="Link Patterns"
        tooltip={tooltip}
        description={
          <>
            Define custom link patterns to convert text markers into clickable links. Use <code>{"{id}"}</code> as a
            placeholder for the identifier.
          </>
        }
        action={{
          label: "Add Link Pattern",
          onClick: () => setIsAdding(true),
          variant: "primary",
          hidden: isAdding,
        }}
      />

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Prefix</label>
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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">URL Template</label>
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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ticket link"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Link Color (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: getColor(e.target.value) })}
                className="w-10 h-10 rounded cursor-pointer border border-zinc-300 dark:border-zinc-600"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: getColor(e.target.value) })}
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!canAdd()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
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
              className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center gap-4"
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
                <IconButton icon="delete" onClick={() => deleteLinkPattern(pattern.id)} />
              </div>
            </div>
          ))
        )}
      </div>

      <NoticeBox>
        <p className="mb-2">
          Link patterns convert text like{" "}
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">T12345</code> into clickable links.
        </p>
        <p>
          Pattern: Capital letter followed by 4+ digits. Use{" "}
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{"{id}"}</code> in the URL template as a
          placeholder for the number.
        </p>
      </NoticeBox>
    </div>
  );
}
