"use client";

import { useState } from "react";
import { TodoTemplate } from "@/types/todo";
import { Modal } from "./Modal";
import { Badge } from "./Badge";
import { InfoTooltip, tooltipContent } from "./InfoTooltip";

interface TemplatesManagerProps {
  templates: TodoTemplate[];
  onDelete: (templateId: string) => void;
  onClose: () => void;
}

export function TemplatesManager({ templates, onDelete, onClose }: TemplatesManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="lg">
      <div className="w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Task Templates</span>
            <InfoTooltip content={tooltipContent.templates} />
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 mb-4 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
        />

        {/* Templates list */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            {searchQuery ? (
              <p>No templates match your search</p>
            ) : (
              <div>
                <p className="text-2xl mb-2">📝</p>
                <p>No templates yet</p>
                <p className="text-sm mt-1">Create a template from any todo using the menu</p>
              </div>
            )}
          </div>
        ) : (
          <ul className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTemplates.map((template) => (
              <li
                key={template.id}
                className="group bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    <span className="text-xs text-zinc-400 mt-1 inline-block">
                      Used {template.usageCount} time{template.usageCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onDelete(template.id)}
                      className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
                      title="Delete template"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

interface CreateTemplateModalProps {
  initialText: string;
  initialPlainText: string;
  initialMetadata: TodoTemplate["metadata"];
  subtasks?: TodoTemplate["subtasks"];
  onSave: (
    name: string,
    description: string | undefined,
    selectedFields: {
      text: boolean;
      assignedPeople: boolean;
      sourcePeople: boolean;
      projects: boolean;
      priority: boolean;
      tags: boolean;
      dueDate: boolean;
      duration: boolean;
      subtasks: boolean;
    },
  ) => void;
  onClose: () => void;
}

export function CreateTemplateModal({
  initialText,
  initialPlainText,
  initialMetadata,
  subtasks,
  onSave,
  onClose,
}: CreateTemplateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFields, setSelectedFields] = useState({
    text: true,
    assignedPeople: (initialMetadata.assignedPeople?.length ?? 0) > 0,
    sourcePeople: (initialMetadata.sourcePeople?.length ?? 0) > 0,
    projects: (initialMetadata.projects?.length ?? 0) > 0,
    priority: !!initialMetadata.priority,
    tags: (initialMetadata.tags?.length ?? 0) > 0,
    dueDate: !!initialMetadata.dueDate,
    duration: !!initialMetadata.duration,
    subtasks: (subtasks?.length ?? 0) > 0,
  });

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim() || undefined, selectedFields);
      onClose();
    }
  };

  const toggleField = (field: keyof typeof selectedFields) => {
    setSelectedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="md">
      <div className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Create Template</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Template Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekly Report, Bug Fix, Meeting Notes"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this template for?"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Select Fields to Include
            </label>
            <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              {/* Text field - always included, shown for reference */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFields.text}
                  onChange={() => toggleField("text")}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Task Text</span>
                <span className="text-xs text-zinc-500 truncate flex-1">{initialPlainText || "(empty)"}</span>
              </label>

              {/* Assigned People */}
              {(initialMetadata.assignedPeople?.length ?? 0) > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.assignedPeople}
                    onChange={() => toggleField("assignedPeople")}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Assigned People</span>
                  <Badge variant="blue" size="sm">
                    @{initialMetadata.assignedPeople!.join(", @")}
                  </Badge>
                </label>
              )}

              {/* Source People */}
              {(initialMetadata.sourcePeople?.length ?? 0) > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.sourcePeople}
                    onChange={() => toggleField("sourcePeople")}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Source People</span>
                  <Badge variant="amber" size="sm">
                    ${initialMetadata.sourcePeople!.join(", $")}
                  </Badge>
                </label>
              )}

              {/* Projects */}
              {(initialMetadata.projects?.length ?? 0) > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.projects}
                    onChange={() => toggleField("projects")}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Projects</span>
                  <Badge variant="purple" size="sm">
                    %{initialMetadata.projects!.join(", %")}
                  </Badge>
                </label>
              )}

              {/* Priority */}
              {initialMetadata.priority && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.priority}
                    onChange={() => toggleField("priority")}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Priority</span>
                  <Badge variant="red" size="sm">
                    {initialMetadata.priority}
                  </Badge>
                </label>
              )}

              {/* Tags */}
              {(initialMetadata.tags?.length ?? 0) > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.tags}
                    onChange={() => toggleField("tags")}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Tags</span>
                  <Badge variant="zinc" size="sm">
                    #{initialMetadata.tags!.join(", #")}
                  </Badge>
                </label>
              )}

              {/* Due Date */}
              {initialMetadata.dueDate && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.dueDate}
                    onChange={() => toggleField("dueDate")}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Due Date</span>
                  <Badge variant="green" size="sm">
                    {initialMetadata.dueDate}
                  </Badge>
                </label>
              )}

              {/* Duration */}
              {initialMetadata.duration && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.duration}
                    onChange={() => toggleField("duration")}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Duration</span>
                  <Badge variant="blue" size="sm">
                    {initialMetadata.duration}
                  </Badge>
                </label>
              )}

              {/* Subtasks */}
              {(subtasks?.length ?? 0) > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.subtasks}
                    onChange={() => toggleField("subtasks")}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Subtasks</span>
                  <Badge variant="green" size="sm">
                    {subtasks!.length} subtask{subtasks!.length !== 1 ? "s" : ""}
                  </Badge>
                </label>
              )}

              {/* No metadata message */}
              {!initialMetadata.assignedPeople?.length &&
                !initialMetadata.sourcePeople?.length &&
                !initialMetadata.projects?.length &&
                !initialMetadata.tags?.length &&
                !initialMetadata.priority &&
                !initialMetadata.dueDate &&
                !initialMetadata.duration &&
                !subtasks?.length && <p className="text-sm text-zinc-400 italic">No additional metadata to include</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Template
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface TemplateDropdownProps {
  templates: TodoTemplate[];
  onSelect: (template: TodoTemplate) => void;
  onManage: () => void;
}

export function TemplateDropdown({ templates, onSelect, onManage }: TemplateDropdownProps) {
  const recentTemplates = templates.slice(0, 5);

  return (
    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
      {recentTemplates.length > 0 ? (
        <>
          <ul className="py-1">
            {recentTemplates.map((template) => (
              <li key={template.id}>
                <button
                  onClick={() => onSelect(template)}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{template.name}</span>
                  {template.description && (
                    <span className="block text-xs text-zinc-500 truncate">{template.description}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={onManage}
              className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left"
            >
              Manage all templates...
            </button>
          </div>
        </>
      ) : (
        <div className="px-3 py-4 text-center text-sm text-zinc-500">No templates yet</div>
      )}
    </div>
  );
}
