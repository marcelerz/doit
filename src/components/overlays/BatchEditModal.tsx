"use client";

import { useState, useCallback } from "react";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { Priority } from "@/types/priority";
import { Sprint } from "@/types/sprint";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";

export interface BatchEditData {
  setPriority: boolean;
  priority: string;
  setProject: boolean;
  project: string;
  setAssignee: boolean;
  assignee: string;
  setSprint: boolean;
  sprint: string;
  setSource: boolean;
  source: string;
  setDueDate: boolean;
  dueDate: string;
  setTags: boolean;
  tags: string;
}

const emptyBatchEditData: BatchEditData = {
  setPriority: false,
  priority: "",
  setProject: false,
  project: "",
  setAssignee: false,
  assignee: "",
  setSprint: false,
  sprint: "",
  setSource: false,
  source: "",
  setDueDate: false,
  dueDate: "",
  setTags: false,
  tags: "",
};

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: BatchEditData) => void;
  selectedCount: number;
  priorities: Priority[];
  projects: ProjectModel[];
  people: PersonModel[];
  sprints: Sprint[];
}

export function BatchEditModal({
  isOpen,
  onClose,
  onApply,
  selectedCount,
  priorities,
  projects,
  people,
  sprints,
}: BatchEditModalProps) {
  const [data, setData] = useState<BatchEditData>(emptyBatchEditData);

  const handleApply = useCallback(() => {
    onApply(data);
    setData(emptyBatchEditData);
  }, [data, onApply]);

  const handleClose = useCallback(() => {
    onClose();
    setData(emptyBatchEditData);
  }, [onClose]);

  if (!isOpen) return null;

  const isDisabled =
    !data.setPriority &&
    !data.setProject &&
    !data.setAssignee &&
    !data.setSprint &&
    !data.setSource &&
    !data.setDueDate &&
    !data.setTags;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>
              Edit {selectedCount} Task{selectedCount === 1 ? "" : "s"}
            </span>
            <InfoTooltip content={tooltipContent.batchProcessing} />
          </h2>
          <button
            onClick={handleClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Check the fields you want to update. Empty values will clear the field.
        </p>

        {/* Priority Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.setPriority}
              onChange={(e) => setData((prev) => ({ ...prev, setPriority: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Set Priority</span>
          </label>
          {data.setPriority && (
            <select
              value={data.priority}
              onChange={(e) => setData((prev) => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Priority (Clear)</option>
              {priorities.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Project Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.setProject}
              onChange={(e) => setData((prev) => ({ ...prev, setProject: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add Project</span>
          </label>
          {data.setProject && (
            <select
              value={data.project}
              onChange={(e) => setData((prev) => ({ ...prev, project: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Clear All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Assignee Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.setAssignee}
              onChange={(e) => setData((prev) => ({ ...prev, setAssignee: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add Assignee</span>
          </label>
          {data.setAssignee && (
            <select
              value={data.assignee}
              onChange={(e) => setData((prev) => ({ ...prev, assignee: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Clear All Assignees</option>
              {people.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sprint Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.setSprint}
              onChange={(e) => setData((prev) => ({ ...prev, setSprint: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Set Sprint</span>
          </label>
          {data.setSprint && (
            <select
              value={data.sprint}
              onChange={(e) => setData((prev) => ({ ...prev, sprint: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Sprint (Backlog)</option>
              {sprints
                .filter((s) => s.state === "active" && (s.status === "planning" || s.status === "active"))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.status === "active" ? "🏃" : ""}
                  </option>
                ))}
            </select>
          )}
        </div>

        {/* Source Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.setSource}
              onChange={(e) => setData((prev) => ({ ...prev, setSource: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add Source</span>
          </label>
          {data.setSource && (
            <select
              value={data.source}
              onChange={(e) => setData((prev) => ({ ...prev, source: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Clear All Sources</option>
              {people.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Due Date Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.setDueDate}
              onChange={(e) => setData((prev) => ({ ...prev, setDueDate: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Set Due Date</span>
          </label>
          {data.setDueDate && (
            <input
              type="date"
              value={data.dueDate}
              onChange={(e) => setData((prev) => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Tags Field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.setTags}
              onChange={(e) => setData((prev) => ({ ...prev, setTags: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add Tags</span>
          </label>
          {data.setTags && (
            <input
              type="text"
              value={data.tags}
              onChange={(e) => setData((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="tag1, tag2, tag3 (comma-separated)"
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isDisabled}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
