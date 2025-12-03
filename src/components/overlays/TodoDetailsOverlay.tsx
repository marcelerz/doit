"use client";

import { useState, useRef, useEffect } from "react";
import { Todo, TodoMetadata } from "@/types/todo";
import { MarkerColors, Settings, LinkPattern, Person, Project, Priority } from "@/types/settings";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import { MarkedText } from "@/components/shared/MarkedText";
import { Activity } from "@/components/shared/Activity";
import RichTextEditor from "@/components/input/RichTextEditor";
import { MarkerReference } from "@/components/shared/MarkerReference";
import { Modal } from "@/components/shared/Modal";
import { Badge } from "@/components/shared/Badge";
import { SearchableDropdown } from "@/components/shared/SearchableDropdown";
import { getDurationSuggestions, filterRecurringSuggestions } from "@/utils/suggestions";
import { Comments } from "@/components/shared/Comments";
import { parseDate, normalizeDateValue, toLocalISOString, formatDateForDisplay } from "@/utils/dateParser";
import { calculateUsageStats, sortStringsByUsage } from "@/utils/usageStats";

// Helper function to convert a date value (which might be shorthand like "today") to yyyy-MM-dd format
function convertToDateInputFormat(dateValue: string | undefined, settings: Settings): string {
  if (!dateValue) return "";

  // If it's already in ISO format (yyyy-MM-dd or yyyy-MM-ddTHH:mm), extract the date part
  if (dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateValue.split("T")[0];
  }

  // Try to parse shorthand values like "today", "tomorrow", etc.
  const parsed = parseDate(dateValue, settings.dateTime, settings.workHours);
  if (parsed) {
    const date = new Date(parsed.timestamp);
    // Use local date methods to avoid UTC conversion
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Fallback: try to parse as a regular date
  const fallbackDate = new Date(dateValue);
  if (!isNaN(fallbackDate.getTime())) {
    const year = fallbackDate.getFullYear();
    const month = (fallbackDate.getMonth() + 1).toString().padStart(2, "0");
    const day = fallbackDate.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
}

// Helper function to convert a date value (which might be shorthand) to HH:mm format
function convertToTimeInputFormat(dateValue: string | undefined, settings: Settings): string {
  if (!dateValue) return "";

  // If it's in ISO format with time (yyyy-MM-ddTHH:mm), extract the time part
  if (dateValue.includes("T")) {
    const timePart = dateValue.split("T")[1];
    if (timePart) {
      return timePart.substring(0, 5); // Get HH:mm
    }
  }

  // Try to parse shorthand values like "today", "tomorrow", etc.
  const parsed = parseDate(dateValue, settings.dateTime, settings.workHours);
  if (parsed) {
    const date = new Date(parsed.timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  return "";
}

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
  settings: Settings;
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
  settings,
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

  // Dropdown state
  const [showAssignedDropdown, setShowAssignedDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showMentionedDropdown, setShowMentionedDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showRecurringDropdown, setShowRecurringDropdown] = useState(false);
  const [showDependencyDropdown, setShowDependencyDropdown] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [newComment, setNewComment] = useState("");
  const [showDelayedDropdown, setShowDelayedDropdown] = useState(false);

  // Calculate usage stats for suggestions
  const usageStats = todos ? calculateUsageStats(todos) : null;
  const sortedTags = usageStats ? sortStringsByUsage(Array.from(usageStats.tags.keys()), usageStats.tags) : [];

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
    tags: [],
  });

  // Initialize metadata when overlay opens
  useEffect(() => {
    // Normalize dueDate if it's a shorthand value
    const normalizedDueDate = normalizeDateValue(todo.metadata.dueDate, settings.dateTime, settings.workHours);

    setEditingMetadata({
      assignedPeople: [...todo.metadata.assignedPeople],
      sourcePeople: [...todo.metadata.sourcePeople],
      mentionedPeople: [...todo.metadata.mentionedPeople],
      projects: [...todo.metadata.projects],
      dependencies: [...todo.metadata.dependencies],
      priority: todo.metadata.priority,
      dueDate: normalizedDueDate || todo.metadata.dueDate,
      duration: todo.metadata.duration,
      recurring: todo.metadata.recurring,
      context: todo.metadata.context,
      tags: todo.metadata.tags || [],
    });
  }, [todo, settings.dateTime, settings.workHours]);

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
    tag: "&",
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
      tags: editTokens.filter((t) => t.type === "tag").map((t) => t.value),
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
                      dateTimeSettings={settings.dateTime}
                      workHoursSettings={settings.workHours}
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
                    <MarkedText
                      text={todo.text}
                      markerColors={markerColors}
                      linkPatterns={linkPatterns}
                      dateTimeSettings={settings.dateTime}
                      workHoursSettings={settings.workHours}
                    />
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

          {/* Context */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">📝 Context</h4>
            <RichTextEditor
              value={editingMetadata.context}
              onChange={(html) => {
                const newMetadata = {
                  ...editingMetadata,
                  context: html || undefined,
                };
                handleMetadataChange(newMetadata);
              }}
              placeholder="Add context..."
              minHeight="100px"
              maxHeight="300px"
              noBorderInViewMode={true}
            />
          </div>

          {/* Task Details */}
          {!isEditing && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Assigned People */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">👤 Assigned</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {editingMetadata.assignedPeople.map((person) => (
                      <Badge
                        key={person}
                        variant="blue"
                        onRemove={() => {
                          handleMetadataChange({
                            ...editingMetadata,
                            assignedPeople: editingMetadata.assignedPeople.filter((p) => p !== person),
                          });
                        }}
                      >
                        @{person}
                      </Badge>
                    ))}
                    <div className="relative">
                      <button
                        onClick={() => setShowAssignedDropdown(!showAssignedDropdown)}
                        className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                      >
                        +
                      </button>
                      {showAssignedDropdown && (
                        <SearchableDropdown
                          items={availablePeople.map((p) => ({ id: p.name, label: p.name, prefix: "@" }))}
                          onSelect={(item) => {
                            handleMetadataChange({
                              ...editingMetadata,
                              assignedPeople: [...editingMetadata.assignedPeople, item.label],
                            });
                            setShowAssignedDropdown(false);
                          }}
                          onAdd={
                            onAddPerson
                              ? (name) => {
                                  onAddPerson(name);
                                  handleMetadataChange({
                                    ...editingMetadata,
                                    assignedPeople: [...editingMetadata.assignedPeople, name],
                                  });
                                  setShowAssignedDropdown(false);
                                }
                              : undefined
                          }
                          onClose={() => setShowAssignedDropdown(false)}
                          placeholder="Search people..."
                          highlightColor="blue"
                          excludeIds={editingMetadata.assignedPeople}
                          emptyMessage="All people already assigned"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">📁 Projects</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {editingMetadata.projects.map((project) => (
                      <Badge
                        key={project}
                        variant="purple"
                        onRemove={() => {
                          handleMetadataChange({
                            ...editingMetadata,
                            projects: editingMetadata.projects.filter((p) => p !== project),
                          });
                        }}
                      >
                        #{project}
                      </Badge>
                    ))}
                    {showProjectDropdown && (
                      <SearchableDropdown
                        items={availableProjects.map((p) => ({ id: p.name, label: `#${p.name}` }))}
                        onSelect={(item) => {
                          handleMetadataChange({
                            ...editingMetadata,
                            projects: [...editingMetadata.projects, typeof item === "string" ? item : item.id],
                          });
                          setShowProjectDropdown(false);
                        }}
                        onAdd={
                          onAddProject
                            ? (name) => {
                                onAddProject(name);
                                handleMetadataChange({
                                  ...editingMetadata,
                                  projects: [...editingMetadata.projects, name],
                                });
                                setShowProjectDropdown(false);
                              }
                            : undefined
                        }
                        onClose={() => setShowProjectDropdown(false)}
                        placeholder="Search projects..."
                        highlightColor="purple"
                        excludeIds={editingMetadata.projects}
                        emptyMessage="All projects already added"
                      />
                    )}
                    <button
                      onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                      className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Source People */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">💼 Source</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {editingMetadata.sourcePeople.map((person) => (
                      <Badge
                        key={person}
                        variant="green"
                        onRemove={() => {
                          handleMetadataChange({
                            ...editingMetadata,
                            sourcePeople: editingMetadata.sourcePeople.filter((p) => p !== person),
                          });
                        }}
                      >
                        ${person}
                      </Badge>
                    ))}
                    {showSourceDropdown && (
                      <SearchableDropdown
                        items={availablePeople.map((p) => ({ id: p.name, label: `$${p.name}` }))}
                        onSelect={(item) => {
                          handleMetadataChange({
                            ...editingMetadata,
                            sourcePeople: [...editingMetadata.sourcePeople, typeof item === "string" ? item : item.id],
                          });
                          setShowSourceDropdown(false);
                        }}
                        onAdd={
                          onAddPerson
                            ? (name) => {
                                onAddPerson(name);
                                handleMetadataChange({
                                  ...editingMetadata,
                                  sourcePeople: [...editingMetadata.sourcePeople, name],
                                });
                                setShowSourceDropdown(false);
                              }
                            : undefined
                        }
                        onClose={() => setShowSourceDropdown(false)}
                        placeholder="Search people..."
                        highlightColor="green"
                        excludeIds={editingMetadata.sourcePeople}
                        emptyMessage="All people already added"
                      />
                    )}
                    <button
                      onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                      className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Mentioned People */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">💬 Mentioned</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {editingMetadata.mentionedPeople.map((person) => (
                      <Badge
                        key={person}
                        variant="pink"
                        onRemove={() => {
                          handleMetadataChange({
                            ...editingMetadata,
                            mentionedPeople: editingMetadata.mentionedPeople.filter((p) => p !== person),
                          });
                        }}
                      >
                        ^{person}
                      </Badge>
                    ))}
                    {showMentionedDropdown && (
                      <SearchableDropdown
                        items={availablePeople.map((p) => ({ id: p.name, label: `^${p.name}` }))}
                        onSelect={(item) => {
                          handleMetadataChange({
                            ...editingMetadata,
                            mentionedPeople: [
                              ...editingMetadata.mentionedPeople,
                              typeof item === "string" ? item : item.id,
                            ],
                          });
                          setShowMentionedDropdown(false);
                        }}
                        onAdd={
                          onAddPerson
                            ? (name) => {
                                onAddPerson(name);
                                handleMetadataChange({
                                  ...editingMetadata,
                                  mentionedPeople: [...editingMetadata.mentionedPeople, name],
                                });
                                setShowMentionedDropdown(false);
                              }
                            : undefined
                        }
                        onClose={() => setShowMentionedDropdown(false)}
                        placeholder="Search people..."
                        highlightColor="pink"
                        excludeIds={editingMetadata.mentionedPeople}
                        emptyMessage="All people already mentioned"
                      />
                    )}
                    <button
                      onClick={() => setShowMentionedDropdown(!showMentionedDropdown)}
                      className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🔥 Priority</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {showPriorityDropdown && (
                      <SearchableDropdown
                        items={availablePriorities.map((p) => ({ id: p.name, label: `!!${p.name}` }))}
                        onSelect={(item) => {
                          handleMetadataChange({
                            ...editingMetadata,
                            priority: typeof item === "string" ? item : item.id,
                          });
                          setShowPriorityDropdown(false);
                        }}
                        onAdd={
                          onAddPriority
                            ? (name) => {
                                onAddPriority(name);
                                handleMetadataChange({
                                  ...editingMetadata,
                                  priority: name,
                                });
                                setShowPriorityDropdown(false);
                              }
                            : undefined
                        }
                        onClose={() => setShowPriorityDropdown(false)}
                        placeholder="Search priorities..."
                        highlightColor="red"
                        emptyMessage="No priorities available"
                      />
                    )}
                    <button
                      onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                      className="text-xs px-2 py-1 rounded border bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      !!{editingMetadata.priority || settings.autoAssign.priority || "None"}
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🏷️ Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {editingMetadata.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="teal"
                        onRemove={() => {
                          handleMetadataChange({
                            ...editingMetadata,
                            tags: editingMetadata.tags.filter((t) => t !== tag),
                          });
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                    <div className="relative">
                      <button
                        onClick={() => setShowTagInput(!showTagInput)}
                        className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                      >
                        +
                      </button>
                      {showTagInput && (
                        <SearchableDropdown
                          items={sortedTags.map((tag) => ({ id: tag, label: tag, prefix: "#" }))}
                          onSelect={(item) => {
                            if (!editingMetadata.tags.includes(item.label)) {
                              handleMetadataChange({
                                ...editingMetadata,
                                tags: [...editingMetadata.tags, item.label],
                              });
                            }
                            setShowTagInput(false);
                          }}
                          onAdd={(name) => {
                            const newTag = name.trim();
                            if (newTag && !editingMetadata.tags.includes(newTag)) {
                              handleMetadataChange({
                                ...editingMetadata,
                                tags: [...editingMetadata.tags, newTag],
                              });
                              setShowTagInput(false);
                            }
                          }}
                          onClose={() => setShowTagInput(false)}
                          placeholder="Search or add tag..."
                          highlightColor="teal"
                          excludeIds={editingMetadata.tags}
                          emptyMessage="No existing tags. Type to create new."
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Dependencies */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">⛓️ Dependencies</h4>
                  {todos.length <= 1 ? (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">No other tasks available</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {editingMetadata.dependencies.map((depId) => {
                        const depTodo = todos.find((t) => t.id === depId);
                        if (!depTodo) return null;
                        return (
                          <Badge
                            key={depId}
                            variant="amber"
                            onRemove={() => {
                              handleMetadataChange({
                                ...editingMetadata,
                                dependencies: editingMetadata.dependencies.filter((d) => d !== depId),
                              });
                            }}
                          >
                            {depTodo.plainText.length > 30
                              ? depTodo.plainText.substring(0, 30) + "..."
                              : depTodo.plainText}
                          </Badge>
                        );
                      })}
                      {showDependencyDropdown && (
                        <SearchableDropdown
                          items={todos.filter((t) => t.id !== todo.id).map((t) => ({ id: t.id, label: t.plainText }))}
                          onSelect={(item) => {
                            handleMetadataChange({
                              ...editingMetadata,
                              dependencies: [
                                ...editingMetadata.dependencies,
                                typeof item === "string" ? item : item.id,
                              ],
                            });
                            setShowDependencyDropdown(false);
                          }}
                          onClose={() => setShowDependencyDropdown(false)}
                          placeholder="Search tasks..."
                          highlightColor="amber"
                          excludeIds={editingMetadata.dependencies}
                          emptyMessage="All tasks already added"
                        />
                      )}
                      <button
                        onClick={() => setShowDependencyDropdown(!showDependencyDropdown)}
                        className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">📅 Due</h4>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      {editingMetadata.dueDate && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                          {(() => {
                            const dateStr = editingMetadata.dueDate.includes("T")
                              ? editingMetadata.dueDate.split("T")[0]
                              : editingMetadata.dueDate;
                            const [year, month, day] = dateStr.split("-").map(Number);
                            const date = new Date(year, month - 1, day);
                            if (isNaN(date.getTime())) return "";
                            return date.toLocaleDateString("en-US", { weekday: "short" });
                          })()}
                        </span>
                      )}
                      <input
                        type="date"
                        value={convertToDateInputFormat(editingMetadata.dueDate, settings)}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          let newDueDate: string | undefined;

                          if (dateValue) {
                            // If there's already a time component, preserve it
                            if (editingMetadata.dueDate && editingMetadata.dueDate.includes("T")) {
                              const timeComponent = editingMetadata.dueDate.split("T")[1];
                              newDueDate = `${dateValue}T${timeComponent}`;
                            } else {
                              newDueDate = dateValue;
                            }
                          } else {
                            newDueDate = undefined;
                          }

                          handleMetadataChange({
                            ...editingMetadata,
                            dueDate: newDueDate,
                          });
                        }}
                        className="flex-1 text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <input
                      type="time"
                      value={convertToTimeInputFormat(editingMetadata.dueDate, settings)}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        let newDueDate: string | undefined;

                        if (timeValue && editingMetadata.dueDate) {
                          const dateComponent = editingMetadata.dueDate.includes("T")
                            ? editingMetadata.dueDate.split("T")[0]
                            : editingMetadata.dueDate;
                          newDueDate = `${dateComponent}T${timeValue}`;
                        } else if (!timeValue && editingMetadata.dueDate) {
                          // Remove time component if cleared
                          newDueDate = editingMetadata.dueDate.includes("T")
                            ? editingMetadata.dueDate.split("T")[0]
                            : editingMetadata.dueDate;
                        }

                        handleMetadataChange({
                          ...editingMetadata,
                          dueDate: newDueDate,
                        });
                      }}
                      className="w-32 text-xs px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />

                    {/* Delayed button */}
                    {todo.state === "active" && (
                      <div className="relative">
                        <button
                          onClick={() => setShowDelayedDropdown(!showDelayedDropdown)}
                          className="p-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-md transition-colors"
                          aria-label="Delay todo"
                          title="Quick delay"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                        {showDelayedDropdown && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowDelayedDropdown(false)} />
                            <div className="absolute right-0 z-20 mt-1 w-48 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg py-1 max-h-64 overflow-y-auto">
                              {[
                                { label: "Today", value: "today" },
                                { label: "Tomorrow", value: "tomorrow" },
                                { label: "Next Week", value: "next week" },
                                { label: "Next Month", value: "next month" },
                                { label: "Next Monday", value: "next monday" },
                                { label: "Next Tuesday", value: "next tuesday" },
                                { label: "Next Wednesday", value: "next wednesday" },
                                { label: "Next Thursday", value: "next thursday" },
                                { label: "Next Friday", value: "next friday" },
                                { label: "Next Saturday", value: "next saturday" },
                                { label: "Next Sunday", value: "next sunday" },
                                { label: "In 2 Days", value: "in 2 days" },
                                { label: "In 3 Days", value: "in 3 days" },
                                { label: "In 5 Days", value: "in 5 days" },
                                { label: "In 1 Week", value: "in 1 week" },
                                { label: "In 2 Weeks", value: "in 2 weeks" },
                                { label: "In 3 Weeks", value: "in 3 weeks" },
                                { label: "In 1 Month", value: "in 1 month" },
                                { label: "In 2 Months", value: "in 2 months" },
                                { label: "In 3 Months", value: "in 3 months" },
                                { label: "In 6 Months", value: "in 6 months" },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => {
                                    const normalizedDate = normalizeDateValue(
                                      option.value,
                                      settings.dateTime,
                                      settings.workHours,
                                    );
                                    if (normalizedDate) {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        dueDate: normalizedDate,
                                      });
                                    }
                                    setShowDelayedDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">⏱️ Duration</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {showDurationDropdown && (
                      <SearchableDropdown
                        items={getDurationSuggestions("").map((d) => ({ id: d, label: `*${d}` }))}
                        onSelect={(item) => {
                          handleMetadataChange({
                            ...editingMetadata,
                            duration: typeof item === "string" ? item : item.id,
                          });
                          setShowDurationDropdown(false);
                        }}
                        onAdd={(value) => {
                          handleMetadataChange({
                            ...editingMetadata,
                            duration: value,
                          });
                          setShowDurationDropdown(false);
                        }}
                        onClose={() => setShowDurationDropdown(false)}
                        placeholder="e.g., 2h, 30m, 1d"
                        highlightColor="amber"
                        emptyMessage=""
                      />
                    )}
                    {editingMetadata.duration ? (
                      <button
                        onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                        className="text-xs px-2 py-1 rounded border bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors inline-flex items-center gap-1.5"
                      >
                        *{editingMetadata.duration}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMetadataChange({
                              ...editingMetadata,
                              duration: undefined,
                            });
                          }}
                          className="hover:text-amber-900 dark:hover:text-amber-100"
                        >
                          ✕
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                        className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>

                {/* Recurring */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🔄 Recurring</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {showRecurringDropdown && (
                      <SearchableDropdown
                        items={filterRecurringSuggestions("").map((r) => ({ id: r, label: `%${r}` }))}
                        onSelect={(item) => {
                          handleMetadataChange({
                            ...editingMetadata,
                            recurring: typeof item === "string" ? item : item.id,
                          });
                          setShowRecurringDropdown(false);
                        }}
                        onAdd={(value) => {
                          handleMetadataChange({
                            ...editingMetadata,
                            recurring: value,
                          });
                          setShowRecurringDropdown(false);
                        }}
                        onClose={() => setShowRecurringDropdown(false)}
                        placeholder="e.g., every day, every monday"
                        highlightColor="teal"
                        emptyMessage=""
                      />
                    )}
                    {editingMetadata.recurring ? (
                      <button
                        onClick={() => setShowRecurringDropdown(!showRecurringDropdown)}
                        className="text-xs px-2 py-1 rounded border bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors inline-flex items-center gap-1.5"
                      >
                        %{editingMetadata.recurring}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMetadataChange({
                              ...editingMetadata,
                              recurring: undefined,
                            });
                          }}
                          className="hover:text-teal-900 dark:hover:text-teal-100"
                        >
                          ✕
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowRecurringDropdown(!showRecurringDropdown)}
                        className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>

                {/* Links */}
                {(() => {
                  // Extract all link patterns from the todo text
                  const foundLinks: { prefix: string; id: string; url: string; description: string; color: string }[] =
                    [];
                  linkPatterns.forEach((linkPattern) => {
                    const linkRegex = new RegExp(`${linkPattern.prefix}\\d{4,}`, "gi");
                    const matches = todo.text.matchAll(linkRegex);
                    for (const match of matches) {
                      const id = match[0].slice(linkPattern.prefix.length);
                      const url = linkPattern.urlTemplate.replace("{id}", id);
                      foundLinks.push({
                        prefix: linkPattern.prefix,
                        id: match[0],
                        url,
                        description: linkPattern.description,
                        color: linkPattern.color,
                      });
                    }
                  });

                  return (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🌐 Links</h4>
                      {foundLinks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {foundLinks.map((link, idx) => (
                            <a
                              key={`${link.id}-${idx}`}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded border hover:shadow-md transition-all inline-flex items-center gap-1"
                              style={{
                                backgroundColor: link.color || "#e0e0e0",
                                borderColor: link.color || "#d0d0d0",
                                color: "#333",
                              }}
                              title={`${link.description}: ${link.url}`}
                            >
                              <span className="font-bold">{link.id}</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">No links found</div>
                      )}
                    </div>
                  );
                })()}

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

          {/* Activity (includes comments inline) */}
          {!isEditing && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-3">📋 Activity</h4>

              {/* Add comment input */}
              {onAddComment && (
                <div className="mb-4 flex gap-2 items-start">
                  <div className="flex-1">
                    <RichTextEditor
                      value={newComment}
                      onChange={setNewComment}
                      placeholder="Add a comment..."
                      minHeight="60px"
                      maxHeight="200px"
                      alwaysEditable={true}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (newComment.trim()) {
                        onAddComment(todo.id, newComment);
                        setNewComment("");
                      }
                    }}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}

              <Activity activities={todo.activity} comments={todo.comments} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
