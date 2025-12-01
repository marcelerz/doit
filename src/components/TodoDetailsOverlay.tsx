"use client";

import { useState, useRef, useEffect } from "react";
import { Todo, TodoMetadata } from "@/types/todo";
import { MarkerColors, GeneralSettings, LinkPattern, Person, Project, Priority } from "@/types/settings";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/SmartInput";
import { MarkedText } from "./MarkedText";
import { Comments } from "./Comments";
import { MarkerReference } from "./MarkerReference";

interface TodoDetailsOverlayProps {
  todo: Todo;
  isOpen: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string, plainText: string, metadata: TodoMetadata) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  markerColors: MarkerColors;
  generalSettings: GeneralSettings;
  linkPatterns: LinkPattern[];
  availablePeople: Person[];
  availableProjects: Project[];
  availablePriorities: Priority[];
  onAddPerson?: (name: string) => void;
  onAddProject?: (name: string) => void;
  onAddPriority?: (name: string) => void;
  onAddComment?: (todoId: string, content: string) => void;
  onEditComment?: (todoId: string, commentId: number, content: string) => void;
  onDeleteComment?: (todoId: string, commentId: number) => void;
}

export function TodoDetailsOverlay({
  todo,
  isOpen,
  onClose,
  onToggle,
  onDelete,
  onEdit,
  onArchive,
  onUnarchive,
  markerColors,
  generalSettings,
  linkPatterns,
  availablePeople,
  availableProjects,
  availablePriorities,
  onAddPerson,
  onAddProject,
  onAddPriority,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: TodoDetailsOverlayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTokens, setEditTokens] = useState<TokenMatch[]>([]);
  const [editFullText, setEditFullText] = useState("");
  const [editPlainText, setEditPlainText] = useState("");
  const smartInputRef = useRef<SmartEditableInputHandle>(null);

  const markers = {
    assigned: "@",
    source: "$",
    mentioned: "^",
    project: "#",
    priority: "!!",
    dueDate: "~",
    duration: "*",
  };

  useEffect(() => {
    if (isEditing && smartInputRef.current) {
      setTimeout(() => {
        smartInputRef.current?.setValue(todo.text);
        smartInputRef.current?.focus();
      }, 50);
    }
  }, [isEditing, todo.text]);

  const handleEditTokensChange = (tokens: TokenMatch[], fullText: string, plainText: string) => {
    setEditTokens(tokens);
    setEditFullText(fullText);
    setEditPlainText(plainText);
  };

  const handleSaveEdit = () => {
    if (!editPlainText.trim()) return;

    const metadata: TodoMetadata = {
      assignedPeople: editTokens.filter((t) => t.type === "assigned").map((t) => t.value),
      sourcePeople: editTokens.filter((t) => t.type === "source").map((t) => t.value),
      mentionedPeople: editTokens.filter((t) => t.type === "mentioned").map((t) => t.value),
      projects: editTokens.filter((t) => t.type === "project").map((t) => t.value),
      priority: editTokens.find((t) => t.type === "priority")?.value,
      dueDate: editTokens.find((t) => t.type === "dueDate")?.value,
      duration: editTokens.find((t) => t.type === "duration")?.value,
    };

    onEdit(todo.id, editFullText, editPlainText, metadata);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTokens([]);
    setEditFullText("");
    setEditPlainText("");
  };

  // Helper functions for colors (from TodoItem)
  const getPersonColor = (name: string) => {
    const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 85%)`;
  };

  const getProjectColor = (name: string) => {
    const projectColors = generalSettings.markerColors?.projects || {};
    return projectColors[name] || markerColors.project;
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors = generalSettings.markerColors?.priorities || {};
    return priorityColors[priority] || markerColors.priority;
  };

  const getTextColor = (backgroundColor: string) => {
    if (!backgroundColor) return "#000000";
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <input
                type="checkbox"
                checked={todo.state === "completed"}
                onChange={() => onToggle(todo.id)}
                className="mt-1 w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <SmartEditableInput
                      ref={smartInputRef}
                      markers={markers}
                      markerColors={markerColors}
                      availablePeople={availablePeople}
                      availableProjects={availableProjects}
                      availablePriorities={availablePriorities}
                      dateTimeSettings={generalSettings.dateTime}
                      onAddPerson={onAddPerson}
                      onAddProject={onAddProject}
                      onAddPriority={onAddPriority}
                      onTokensChange={handleEditTokensChange}
                      onEnterPress={handleSaveEdit}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <MarkerReference />
                  </div>
                ) : (
                  <h2
                    className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 cursor-text hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                    onClick={() => setIsEditing(true)}
                  >
                    <MarkedText text={todo.text} markerColors={markerColors} linkPatterns={linkPatterns} />
                  </h2>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors ml-4"
              aria-label="Close"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Timestamps */}
          {!isEditing && (
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                <div>
                  <span className="font-medium">Created:</span> {new Date(todo.createdAt).toLocaleString()}
                </div>
                {todo.updatedAt && (
                  <div>
                    <span className="font-medium">Updated:</span> {new Date(todo.updatedAt).toLocaleString()}
                  </div>
                )}
                {todo.completedAt && (
                  <div>
                    <span className="font-medium">Completed:</span> {new Date(todo.completedAt).toLocaleString()}
                  </div>
                )}
                {todo.archivedAt && (
                  <div>
                    <span className="font-medium">Archived:</span> {new Date(todo.archivedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Task Details */}
          {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Assigned People */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">👤 Assigned</h4>
                <div className="flex flex-wrap gap-1">
                  {todo.metadata.assignedPeople.length > 0 ? (
                    todo.metadata.assignedPeople.map((person, idx) => {
                      const bgColor = getPersonColor(person);
                      const textColor = getTextColor(bgColor);
                      return (
                        <span
                          key={idx}
                          style={{ backgroundColor: bgColor, color: textColor }}
                          className="px-2 py-0.5 text-xs rounded"
                        >
                          @{person}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">None</span>
                  )}
                </div>
              </div>

              {/* Projects */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">📁 Projects</h4>
                <div className="flex flex-wrap gap-1">
                  {todo.metadata.projects.length > 0 ? (
                    todo.metadata.projects.map((project, idx) => {
                      const bgColor = getProjectColor(project);
                      const textColor = getTextColor(bgColor);
                      return (
                        <span
                          key={idx}
                          style={{ backgroundColor: bgColor, color: textColor }}
                          className="px-2 py-0.5 text-xs rounded"
                        >
                          #{project}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">None</span>
                  )}
                </div>
              </div>

              {/* Source People */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">📤 Source</h4>
                <div className="flex flex-wrap gap-1">
                  {todo.metadata.sourcePeople.length > 0 ? (
                    todo.metadata.sourcePeople.map((person, idx) => {
                      const bgColor = getPersonColor(person);
                      const textColor = getTextColor(bgColor);
                      return (
                        <span
                          key={idx}
                          style={{ backgroundColor: bgColor, color: textColor }}
                          className="px-2 py-0.5 text-xs rounded"
                        >
                          ${person}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">None</span>
                  )}
                </div>
              </div>

              {/* Mentioned People */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">💬 Mentioned</h4>
                <div className="flex flex-wrap gap-1">
                  {todo.metadata.mentionedPeople.length > 0 ? (
                    todo.metadata.mentionedPeople.map((person, idx) => {
                      const bgColor = getPersonColor(person);
                      const textColor = getTextColor(bgColor);
                      return (
                        <span
                          key={idx}
                          style={{ backgroundColor: bgColor, color: textColor }}
                          className="px-2 py-0.5 text-xs rounded"
                        >
                          ^{person}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">None</span>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">🔥 Priority</h4>
                {todo.metadata.priority ? (
                  (() => {
                    const bgColor = getPriorityColor(todo.metadata.priority);
                    const textColor = getTextColor(bgColor);
                    return (
                      <span
                        style={{ backgroundColor: bgColor, color: textColor }}
                        className="px-2 py-0.5 text-xs rounded"
                      >
                        !!{todo.metadata.priority}
                      </span>
                    );
                  })()
                ) : (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">None</span>
                )}
              </div>

              {/* Due Date */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">📅 Due</h4>
                {todo.metadata.dueDate ? (
                  <span className="px-2 py-0.5 text-xs rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    ~{todo.metadata.dueDate}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">None</span>
                )}
              </div>

              {/* Duration */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">⏱️ Duration</h4>
                {todo.metadata.duration ? (
                  <span className="px-2 py-0.5 text-xs rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                    *{todo.metadata.duration}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">None</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-end justify-end gap-2">
                {/* Archive/Unarchive button */}
                {todo.state === "archived" && onUnarchive ? (
                  <button
                    onClick={() => {
                      onUnarchive(todo.id);
                      onClose();
                    }}
                    className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-md transition-colors"
                    aria-label="Unarchive todo"
                    title="Unarchive"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                  </button>
                ) : (
                  (todo.state === "active" || todo.state === "completed") &&
                  onArchive && (
                    <button
                      onClick={() => {
                        onArchive(todo.id);
                        onClose();
                      }}
                      className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-md transition-colors"
                      aria-label="Archive todo"
                      title="Archive"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        />
                      </svg>
                    </button>
                  )
                )}

                {/* Delete button */}
                <button
                  onClick={() => {
                    onDelete(todo.id);
                    onClose();
                  }}
                  className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
                  aria-label="Delete todo"
                  title="Delete"
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
          )}

          {/* Comments */}
          {!isEditing && onAddComment && onEditComment && onDeleteComment && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">💬 Comments</h4>
              <Comments
                comments={todo.comments}
                onAddComment={(content) => onAddComment(todo.id, content)}
                onEditComment={(commentId, content) => onEditComment(todo.id, commentId, content)}
                onDeleteComment={(commentId) => onDeleteComment(todo.id, commentId)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
