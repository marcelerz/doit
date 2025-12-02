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
  todos?: Todo[]; // All todos for dependency selection
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
  todos = [],
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
  const [dependencySearch, setDependencySearch] = useState("");
  const [showDependencyDropdown, setShowDependencyDropdown] = useState(false);

  // State for metadata editing
  const [editingMetadata, setEditingMetadata] = useState<TodoMetadata>({
    assignedPeople: [],
    sourcePeople: [],
    mentionedPeople: [],
    projects: [],
    dependencies: [],
    priority: undefined,
    dueDate: undefined,
    duration: undefined,
    recurring: undefined,
  });

  // Initialize metadata when overlay opens
  useEffect(() => {
    setEditingMetadata({
      assignedPeople: [...todo.metadata.assignedPeople],
      sourcePeople: [...todo.metadata.sourcePeople],
      mentionedPeople: [...todo.metadata.mentionedPeople],
      projects: [...todo.metadata.projects],
      dependencies: [...todo.metadata.dependencies],
      priority: todo.metadata.priority,
      dueDate: todo.metadata.dueDate,
      duration: todo.metadata.duration,
      recurring: todo.metadata.recurring,
    });
  }, [todo]);

  const markers = {
    assigned: "@",
    source: "$",
    mentioned: "^",
    project: "#",
    priority: "!!",
    dueDate: "~",
    duration: "*",
    recurring: "%",
    dependency: ">",
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
      dependencies: editTokens.filter((t) => t.type === "dependency").map((t) => t.value),
      priority: editTokens.find((t) => t.type === "priority")?.value,
      dueDate: editTokens.find((t) => t.type === "dueDate")?.value,
      duration: editTokens.find((t) => t.type === "duration")?.value,
      recurring: editTokens.find((t) => t.type === "recurring")?.value,
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

  const handleMetadataChange = (newMetadata: TodoMetadata) => {
    const parts: string[] = [todo.plainText];

    newMetadata.assignedPeople.forEach((p) => parts.push(`@${p}`));
    newMetadata.sourcePeople.forEach((p) => parts.push(`$${p}`));
    newMetadata.mentionedPeople.forEach((p) => parts.push(`^${p}`));
    newMetadata.projects.forEach((p) => parts.push(`#${p}`));
    newMetadata.dependencies.forEach((d) => parts.push(`>${d}`));
    if (newMetadata.priority) parts.push(`!!${newMetadata.priority}`);
    if (newMetadata.dueDate) parts.push(`~${newMetadata.dueDate}`);
    if (newMetadata.duration) parts.push(`*${newMetadata.duration}`);
    if (newMetadata.recurring) parts.push(`%${newMetadata.recurring}`);

    const newText = parts.join(" ");
    onEdit(todo.id, newText, todo.plainText, newMetadata);
    setEditingMetadata(newMetadata);
  };

  const togglePersonInList = (list: string[], person: string) => {
    return list.includes(person) ? list.filter((p) => p !== person) : [...list, person];
  };

  const toggleProjectInList = (projects: string[], project: string) => {
    return projects.includes(project) ? projects.filter((p) => p !== project) : [...projects, project];
  };

  // Helper functions for colors (from TodoItem)
  const getPersonColor = (name: string) => {
    const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 85%)`;
  };

  const getProjectColor = (name: string) => {
    // markerColors is passed as a separate prop
    return markerColors.project;
  };

  const getPriorityColor = (priority: string) => {
    // markerColors is passed as a separate prop
    return markerColors.priority;
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Assigned People */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">👤 Assigned</h4>
                  <details className="relative">
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap gap-1 min-h-[24px] p-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800">
                        {editingMetadata.assignedPeople.length > 0 ? (
                          editingMetadata.assignedPeople.map((person, idx) => {
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
                    </summary>
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg max-h-48 overflow-y-auto">
                      {availablePeople.map((person) => (
                        <label
                          key={person.name}
                          className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <input
                            type="checkbox"
                            checked={editingMetadata.assignedPeople.includes(person.name)}
                            onChange={() => {
                              const newMetadata = {
                                ...editingMetadata,
                                assignedPeople: togglePersonInList(editingMetadata.assignedPeople, person.name),
                              };
                              handleMetadataChange(newMetadata);
                            }}
                            className="w-3 h-3 rounded border-zinc-300 dark:border-zinc-600"
                          />
                          @{person.name}
                        </label>
                      ))}
                    </div>
                  </details>
                </div>

                {/* Projects */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">📁 Projects</h4>
                  <details className="relative">
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap gap-1 min-h-[24px] p-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800">
                        {editingMetadata.projects.length > 0 ? (
                          editingMetadata.projects.map((project, idx) => {
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
                    </summary>
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg max-h-48 overflow-y-auto">
                      {availableProjects.map((project) => (
                        <label
                          key={project.name}
                          className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <input
                            type="checkbox"
                            checked={editingMetadata.projects.includes(project.name)}
                            onChange={() => {
                              const newMetadata = {
                                ...editingMetadata,
                                projects: toggleProjectInList(editingMetadata.projects, project.name),
                              };
                              handleMetadataChange(newMetadata);
                            }}
                            className="w-3 h-3 rounded border-zinc-300 dark:border-zinc-600"
                          />
                          #{project.name}
                        </label>
                      ))}
                    </div>
                  </details>
                </div>

                {/* Source People */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">📤 Source</h4>
                  <details className="relative">
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap gap-1 min-h-[24px] p-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800">
                        {editingMetadata.sourcePeople.length > 0 ? (
                          editingMetadata.sourcePeople.map((person, idx) => {
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
                    </summary>
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg max-h-48 overflow-y-auto">
                      {availablePeople.map((person) => (
                        <label
                          key={person.name}
                          className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <input
                            type="checkbox"
                            checked={editingMetadata.sourcePeople.includes(person.name)}
                            onChange={() => {
                              const newMetadata = {
                                ...editingMetadata,
                                sourcePeople: togglePersonInList(editingMetadata.sourcePeople, person.name),
                              };
                              handleMetadataChange(newMetadata);
                            }}
                            className="w-3 h-3 rounded border-zinc-300 dark:border-zinc-600"
                          />
                          ${person.name}
                        </label>
                      ))}
                    </div>
                  </details>
                </div>

                {/* Mentioned People */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">💬 Mentioned</h4>
                  <details className="relative">
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap gap-1 min-h-[24px] p-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800">
                        {editingMetadata.mentionedPeople.length > 0 ? (
                          editingMetadata.mentionedPeople.map((person, idx) => {
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
                    </summary>
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg max-h-48 overflow-y-auto">
                      {availablePeople.map((person) => (
                        <label
                          key={person.name}
                          className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <input
                            type="checkbox"
                            checked={editingMetadata.mentionedPeople.includes(person.name)}
                            onChange={() => {
                              const newMetadata = {
                                ...editingMetadata,
                                mentionedPeople: togglePersonInList(editingMetadata.mentionedPeople, person.name),
                              };
                              handleMetadataChange(newMetadata);
                            }}
                            className="w-3 h-3 rounded border-zinc-300 dark:border-zinc-600"
                          />
                          ^{person.name}
                        </label>
                      ))}
                    </div>
                  </details>
                </div>

                {/* Priority */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🔥 Priority</h4>
                  <select
                    value={editingMetadata.priority || ""}
                    onChange={(e) => {
                      const newMetadata = {
                        ...editingMetadata,
                        priority: e.target.value || undefined,
                      };
                      handleMetadataChange(newMetadata);
                    }}
                    className="w-full text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">None</option>
                    {availablePriorities.map((priority) => (
                      <option key={priority.name} value={priority.name}>
                        !!{priority.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dependencies */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🔗 Dependencies</h4>
                  {todos.length <= 1 ? (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">No other tasks available</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {editingMetadata.dependencies.map((depId) => {
                        const depTodo = todos.find((t) => t.id === depId);
                        if (!depTodo) return null;
                        return (
                          <button
                            key={depId}
                            onClick={() => {
                              handleMetadataChange({
                                ...editingMetadata,
                                dependencies: editingMetadata.dependencies.filter((d) => d !== depId),
                              });
                            }}
                            className="text-xs px-2 py-1 rounded border bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                          >
                            {depTodo.plainText.length > 30
                              ? depTodo.plainText.substring(0, 30) + "..."
                              : depTodo.plainText}{" "}
                            ✕
                          </button>
                        );
                      })}
                      <div className="relative">
                        <button
                          onClick={() => setShowDependencyDropdown(!showDependencyDropdown)}
                          className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                        >
                          +
                        </button>
                        {showDependencyDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => {
                                setShowDependencyDropdown(false);
                                setDependencySearch("");
                              }}
                            />
                            <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                              <input
                                type="text"
                                value={dependencySearch}
                                onChange={(e) => setDependencySearch(e.target.value)}
                                placeholder="Search tasks..."
                                autoFocus
                                className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                              />
                              <div className="max-h-48 overflow-y-auto">
                                {todos
                                  .filter((t) => t.id !== todo.id && !editingMetadata.dependencies.includes(t.id))
                                  .filter(
                                    (t) =>
                                      dependencySearch === "" ||
                                      t.plainText.toLowerCase().includes(dependencySearch.toLowerCase()),
                                  )
                                  .slice(0, 10)
                                  .map((t) => (
                                    <button
                                      key={t.id}
                                      onClick={() => {
                                        handleMetadataChange({
                                          ...editingMetadata,
                                          dependencies: [...editingMetadata.dependencies, t.id],
                                        });
                                        setDependencySearch("");
                                        setShowDependencyDropdown(false);
                                      }}
                                      className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border-b border-zinc-200 dark:border-zinc-700 last:border-b-0"
                                    >
                                      {t.plainText}
                                    </button>
                                  ))}
                                {todos
                                  .filter((t) => t.id !== todo.id && !editingMetadata.dependencies.includes(t.id))
                                  .filter(
                                    (t) =>
                                      dependencySearch === "" ||
                                      t.plainText.toLowerCase().includes(dependencySearch.toLowerCase()),
                                  ).length === 0 && (
                                  <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">
                                    {dependencySearch === "" ? "All tasks already added" : "No tasks found"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">📅 Due</h4>
                  <input
                    type="date"
                    value={editingMetadata.dueDate || ""}
                    onChange={(e) => {
                      const newMetadata = {
                        ...editingMetadata,
                        dueDate: e.target.value || undefined,
                      };
                      handleMetadataChange(newMetadata);
                    }}
                    className="w-full text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Duration */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">⏱️ Duration</h4>
                  <input
                    type="text"
                    value={editingMetadata.duration || ""}
                    onChange={(e) => {
                      const newMetadata = {
                        ...editingMetadata,
                        duration: e.target.value || undefined,
                      };
                      handleMetadataChange(newMetadata);
                    }}
                    onBlur={() => {
                      // Save on blur
                      handleMetadataChange(editingMetadata);
                    }}
                    placeholder="e.g., 2h, 30m, 1d"
                    className="w-full text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Recurring */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🔄 Recurring</h4>
                  <input
                    type="text"
                    value={editingMetadata.recurring || ""}
                    onChange={(e) => {
                      const newMetadata = {
                        ...editingMetadata,
                        recurring: e.target.value || undefined,
                      };
                      handleMetadataChange(newMetadata);
                    }}
                    onBlur={() => {
                      // Save on blur
                      handleMetadataChange(editingMetadata);
                    }}
                    placeholder="e.g., every day, every monday"
                    className="w-full text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
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
            </>
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
