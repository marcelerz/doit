"use client";

import { useState, useRef, useEffect } from "react";
import { Todo, TodoMetadata } from "@/types/todo";
import { MarkerColors, Settings, LinkPattern, Person, Project, Priority } from "@/types/settings";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import { MarkedText } from "@/components/shared/MarkedText";
import { Activity } from "@/components/shared/Activity";
import RichTextEditor from "@/components/input/RichTextEditor";
import { MarkerReference } from "@/components/shared/MarkerReference";

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
  const [dependencySearch, setDependencySearch] = useState("");
  const [showDependencyDropdown, setShowDependencyDropdown] = useState(false);
  const [assignedSearch, setAssignedSearch] = useState("");
  const [showAssignedDropdown, setShowAssignedDropdown] = useState(false);
  const [assignedSelectedIndex, setAssignedSelectedIndex] = useState(0);
  const [projectSearch, setProjectSearch] = useState("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectSelectedIndex, setProjectSelectedIndex] = useState(0);
  const [sourceSearch, setSourceSearch] = useState("");
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [sourceSelectedIndex, setSourceSelectedIndex] = useState(0);
  const [mentionedSearch, setMentionedSearch] = useState("");
  const [showMentionedDropdown, setShowMentionedDropdown] = useState(false);
  const [mentionedSelectedIndex, setMentionedSelectedIndex] = useState(0);
  const [prioritySearch, setPrioritySearch] = useState("");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [prioritySelectedIndex, setPrioritySelectedIndex] = useState(0);
  const [durationSearch, setDurationSearch] = useState("");
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [durationSelectedIndex, setDurationSelectedIndex] = useState(0);
  const [recurringSearch, setRecurringSearch] = useState("");
  const [showRecurringDropdown, setShowRecurringDropdown] = useState(false);
  const [recurringSelectedIndex, setRecurringSelectedIndex] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [newComment, setNewComment] = useState("");

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
      context: todo.metadata.context,
      tags: todo.metadata.tags || [],
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

  // Duration suggestions based on user input
  const getDurationSuggestions = (input: string): string[] => {
    const allSuggestions = [
      "15m",
      "30m",
      "45m",
      "1h",
      "1.5h",
      "2h",
      "3h",
      "4h",
      "6h",
      "8h",
      "1d",
      "2d",
      "3d",
      "5d",
      "1w",
      "2w",
      "1m",
    ];

    if (!input.trim()) return allSuggestions;

    const lowerInput = input.toLowerCase();
    return allSuggestions.filter((s) => s.toLowerCase().includes(lowerInput));
  };

  // Recurring suggestions based on user input
  const getRecurringSuggestions = (input: string): string[] => {
    const allSuggestions = [
      "daily",
      "every day",
      "every weekday",
      "weekly",
      "every week",
      "every monday",
      "every tuesday",
      "every wednesday",
      "every thursday",
      "every friday",
      "every saturday",
      "every sunday",
      "every 2 weeks",
      "monthly",
      "every month",
      "yearly",
      "every year",
    ];

    if (!input.trim()) return allSuggestions;

    const lowerInput = input.toLowerCase();
    return allSuggestions.filter((s) => s.toLowerCase().includes(lowerInput));
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
                      <button
                        key={person}
                        onClick={() => {
                          handleMetadataChange({
                            ...editingMetadata,
                            assignedPeople: editingMetadata.assignedPeople.filter((p) => p !== person),
                          });
                        }}
                        className="text-xs px-2 py-1 rounded border bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        @{person} ✕
                      </button>
                    ))}
                    <div className="relative">
                      <button
                        onClick={() => setShowAssignedDropdown(!showAssignedDropdown)}
                        className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                      >
                        +
                      </button>
                      {showAssignedDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => {
                              setShowAssignedDropdown(false);
                              setAssignedSearch("");
                              setAssignedSelectedIndex(0);
                            }}
                          />
                          <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                            <input
                              type="text"
                              value={assignedSearch}
                              onChange={(e) => {
                                setAssignedSearch(e.target.value);
                                setAssignedSelectedIndex(0);
                              }}
                              onKeyDown={(e) => {
                                const filteredPeople = availablePeople
                                  .filter((p) => !editingMetadata.assignedPeople.includes(p.name))
                                  .filter(
                                    (p) =>
                                      assignedSearch === "" ||
                                      p.name.toLowerCase().includes(assignedSearch.toLowerCase()),
                                  )
                                  .slice(0, 10);
                                const hasAddOption = filteredPeople.length === 0 && assignedSearch.trim() !== "";
                                const totalItems = filteredPeople.length + (hasAddOption ? 1 : 0);

                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  setAssignedSelectedIndex((prev) => (prev + 1) % totalItems);
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  setAssignedSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
                                } else if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (filteredPeople.length > 0 && assignedSelectedIndex < filteredPeople.length) {
                                    // Select existing person
                                    const selected = filteredPeople[assignedSelectedIndex];
                                    handleMetadataChange({
                                      ...editingMetadata,
                                      assignedPeople: [...editingMetadata.assignedPeople, selected.name],
                                    });
                                    setAssignedSearch("");
                                    setShowAssignedDropdown(false);
                                    setAssignedSelectedIndex(0);
                                  } else if (hasAddOption) {
                                    // Add new person
                                    const newPerson = assignedSearch.trim();
                                    if (newPerson && onAddPerson) {
                                      onAddPerson(newPerson);
                                    }
                                    handleMetadataChange({
                                      ...editingMetadata,
                                      assignedPeople: [...editingMetadata.assignedPeople, newPerson],
                                    });
                                    setAssignedSearch("");
                                    setShowAssignedDropdown(false);
                                    setAssignedSelectedIndex(0);
                                  }
                                } else if (e.key === "Escape") {
                                  setShowAssignedDropdown(false);
                                  setAssignedSearch("");
                                  setAssignedSelectedIndex(0);
                                }
                              }}
                              placeholder="Search people..."
                              autoFocus
                              className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                            />
                            <div className="max-h-48 overflow-y-auto">
                              {availablePeople
                                .filter((p) => !editingMetadata.assignedPeople.includes(p.name))
                                .filter(
                                  (p) =>
                                    assignedSearch === "" ||
                                    p.name.toLowerCase().includes(assignedSearch.toLowerCase()),
                                )
                                .slice(0, 10)
                                .map((p, idx) => (
                                  <button
                                    key={p.name}
                                    onClick={() => {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        assignedPeople: [...editingMetadata.assignedPeople, p.name],
                                      });
                                      setAssignedSearch("");
                                      setShowAssignedDropdown(false);
                                      setAssignedSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                                      idx === assignedSelectedIndex
                                        ? "bg-blue-100 dark:bg-blue-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    @{p.name}
                                  </button>
                                ))}
                              {availablePeople
                                .filter((p) => !editingMetadata.assignedPeople.includes(p.name))
                                .filter(
                                  (p) =>
                                    assignedSearch === "" ||
                                    p.name.toLowerCase().includes(assignedSearch.toLowerCase()),
                                ).length === 0 &&
                                (assignedSearch === "" ? (
                                  <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">
                                    All people already assigned
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const newPerson = assignedSearch.trim();
                                      if (newPerson && onAddPerson) {
                                        onAddPerson(newPerson);
                                      }
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        assignedPeople: [...editingMetadata.assignedPeople, newPerson],
                                      });
                                      setAssignedSearch("");
                                      setShowAssignedDropdown(false);
                                      setAssignedSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors text-blue-600 dark:text-blue-400 font-medium ${
                                      assignedSelectedIndex === 0
                                        ? "bg-blue-100 dark:bg-blue-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    + Add "@{assignedSearch}"
                                  </button>
                                ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">📁 Projects</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {editingMetadata.projects.map((project) => (
                      <button
                        key={project}
                        onClick={() => {
                          handleMetadataChange({
                            ...editingMetadata,
                            projects: editingMetadata.projects.filter((p) => p !== project),
                          });
                        }}
                        className="text-xs px-2 py-1 rounded border bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        #{project} ✕
                      </button>
                    ))}
                    <div className="relative">
                      <button
                        onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                        className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                      >
                        +
                      </button>
                      {showProjectDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => {
                              setShowProjectDropdown(false);
                              setProjectSearch("");
                              setProjectSelectedIndex(0);
                            }}
                          />
                          <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                            <input
                              type="text"
                              value={projectSearch}
                              onChange={(e) => {
                                setProjectSearch(e.target.value);
                                setProjectSelectedIndex(0);
                              }}
                              onKeyDown={(e) => {
                                const filteredProjects = availableProjects
                                  .filter((p) => !editingMetadata.projects.includes(p.name))
                                  .filter(
                                    (p) =>
                                      projectSearch === "" ||
                                      p.name.toLowerCase().includes(projectSearch.toLowerCase()),
                                  )
                                  .slice(0, 10);
                                const hasAddOption = filteredProjects.length === 0 && projectSearch.trim() !== "";
                                const totalItems = filteredProjects.length + (hasAddOption ? 1 : 0);

                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  setProjectSelectedIndex((prev) => (prev + 1) % totalItems);
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  setProjectSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
                                } else if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (filteredProjects.length > 0 && projectSelectedIndex < filteredProjects.length) {
                                    const selected = filteredProjects[projectSelectedIndex];
                                    handleMetadataChange({
                                      ...editingMetadata,
                                      projects: [...editingMetadata.projects, selected.name],
                                    });
                                    setProjectSearch("");
                                    setShowProjectDropdown(false);
                                    setProjectSelectedIndex(0);
                                  } else if (hasAddOption) {
                                    const newProject = projectSearch.trim();
                                    if (newProject && onAddProject) {
                                      onAddProject(newProject);
                                    }
                                    handleMetadataChange({
                                      ...editingMetadata,
                                      projects: [...editingMetadata.projects, newProject],
                                    });
                                    setProjectSearch("");
                                    setShowProjectDropdown(false);
                                    setProjectSelectedIndex(0);
                                  }
                                } else if (e.key === "Escape") {
                                  setShowProjectDropdown(false);
                                  setProjectSearch("");
                                  setProjectSelectedIndex(0);
                                }
                              }}
                              placeholder="Search projects..."
                              autoFocus
                              className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                            />
                            <div className="max-h-48 overflow-y-auto">
                              {availableProjects
                                .filter((p) => !editingMetadata.projects.includes(p.name))
                                .filter(
                                  (p) =>
                                    projectSearch === "" || p.name.toLowerCase().includes(projectSearch.toLowerCase()),
                                )
                                .slice(0, 10)
                                .map((p, idx) => (
                                  <button
                                    key={p.name}
                                    onClick={() => {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        projects: [...editingMetadata.projects, p.name],
                                      });
                                      setProjectSearch("");
                                      setShowProjectDropdown(false);
                                      setProjectSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                                      idx === projectSelectedIndex
                                        ? "bg-purple-100 dark:bg-purple-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    #{p.name}
                                  </button>
                                ))}
                              {availableProjects
                                .filter((p) => !editingMetadata.projects.includes(p.name))
                                .filter(
                                  (p) =>
                                    projectSearch === "" || p.name.toLowerCase().includes(projectSearch.toLowerCase()),
                                ).length === 0 &&
                                (projectSearch === "" ? (
                                  <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">
                                    All projects already added
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const newProject = projectSearch.trim();
                                      if (newProject && onAddProject) {
                                        onAddProject(newProject);
                                      }
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        projects: [...editingMetadata.projects, newProject],
                                      });
                                      setProjectSearch("");
                                      setShowProjectDropdown(false);
                                      setProjectSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors text-purple-600 dark:text-purple-400 font-medium ${
                                      projectSelectedIndex === 0
                                        ? "bg-purple-100 dark:bg-purple-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    + Add "#{projectSearch}"
                                  </button>
                                ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Source People */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">💼 Source</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {editingMetadata.sourcePeople.map((person) => (
                      <button
                        key={person}
                        onClick={() => {
                          handleMetadataChange({
                            ...editingMetadata,
                            sourcePeople: editingMetadata.sourcePeople.filter((p) => p !== person),
                          });
                        }}
                        className="text-xs px-2 py-1 rounded border bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      >
                        ${person} ✕
                      </button>
                    ))}
                    <div className="relative">
                      <button
                        onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                        className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                      >
                        +
                      </button>
                      {showSourceDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => {
                              setShowSourceDropdown(false);
                              setSourceSearch("");
                              setSourceSelectedIndex(0);
                            }}
                          />
                          <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                            <input
                              type="text"
                              value={sourceSearch}
                              onChange={(e) => {
                                setSourceSearch(e.target.value);
                                setSourceSelectedIndex(0);
                              }}
                              onKeyDown={(e) => {
                                const filteredPeople = availablePeople
                                  .filter((p) => !editingMetadata.sourcePeople.includes(p.name))
                                  .filter(
                                    (p) =>
                                      sourceSearch === "" || p.name.toLowerCase().includes(sourceSearch.toLowerCase()),
                                  )
                                  .slice(0, 10);
                                const hasAddOption = filteredPeople.length === 0 && sourceSearch.trim() !== "";
                                const totalItems = filteredPeople.length + (hasAddOption ? 1 : 0);

                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  setSourceSelectedIndex((prev) => (prev + 1) % totalItems);
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  setSourceSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
                                } else if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (filteredPeople.length > 0 && sourceSelectedIndex < filteredPeople.length) {
                                    const selected = filteredPeople[sourceSelectedIndex];
                                    handleMetadataChange({
                                      ...editingMetadata,
                                      sourcePeople: [...editingMetadata.sourcePeople, selected.name],
                                    });
                                    setSourceSearch("");
                                    setShowSourceDropdown(false);
                                    setSourceSelectedIndex(0);
                                  } else if (hasAddOption) {
                                    const newPerson = sourceSearch.trim();
                                    if (newPerson && onAddPerson) {
                                      onAddPerson(newPerson);
                                    }
                                    handleMetadataChange({
                                      ...editingMetadata,
                                      sourcePeople: [...editingMetadata.sourcePeople, newPerson],
                                    });
                                    setSourceSearch("");
                                    setShowSourceDropdown(false);
                                    setSourceSelectedIndex(0);
                                  }
                                } else if (e.key === "Escape") {
                                  setShowSourceDropdown(false);
                                  setSourceSearch("");
                                  setSourceSelectedIndex(0);
                                }
                              }}
                              placeholder="Search people..."
                              autoFocus
                              className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                            />
                            <div className="max-h-48 overflow-y-auto">
                              {availablePeople
                                .filter((p) => !editingMetadata.sourcePeople.includes(p.name))
                                .filter(
                                  (p) =>
                                    sourceSearch === "" || p.name.toLowerCase().includes(sourceSearch.toLowerCase()),
                                )
                                .slice(0, 10)
                                .map((p, idx) => (
                                  <button
                                    key={p.name}
                                    onClick={() => {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        sourcePeople: [...editingMetadata.sourcePeople, p.name],
                                      });
                                      setSourceSearch("");
                                      setShowSourceDropdown(false);
                                      setSourceSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                                      idx === sourceSelectedIndex
                                        ? "bg-green-100 dark:bg-green-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    ${p.name}
                                  </button>
                                ))}
                              {availablePeople
                                .filter((p) => !editingMetadata.sourcePeople.includes(p.name))
                                .filter(
                                  (p) =>
                                    sourceSearch === "" || p.name.toLowerCase().includes(sourceSearch.toLowerCase()),
                                ).length === 0 &&
                                (sourceSearch === "" ? (
                                  <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">
                                    All people already added
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const newPerson = sourceSearch.trim();
                                      if (newPerson && onAddPerson) {
                                        onAddPerson(newPerson);
                                      }
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        sourcePeople: [...editingMetadata.sourcePeople, newPerson],
                                      });
                                      setSourceSearch("");
                                      setShowSourceDropdown(false);
                                      setSourceSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors text-green-600 dark:text-green-400 font-medium ${
                                      sourceSelectedIndex === 0
                                        ? "bg-green-100 dark:bg-green-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    + Add "${sourceSearch}"
                                  </button>
                                ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mentioned People */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">💬 Mentioned</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {editingMetadata.mentionedPeople.map((person) => (
                      <button
                        key={person}
                        onClick={() => {
                          handleMetadataChange({
                            ...editingMetadata,
                            mentionedPeople: editingMetadata.mentionedPeople.filter((p) => p !== person),
                          });
                        }}
                        className="text-xs px-2 py-1 rounded border bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 text-pink-800 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                      >
                        ^{person} ✕
                      </button>
                    ))}
                    <div className="relative">
                      <button
                        onClick={() => setShowMentionedDropdown(!showMentionedDropdown)}
                        className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                      >
                        +
                      </button>
                      {showMentionedDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => {
                              setShowMentionedDropdown(false);
                              setMentionedSearch("");
                              setMentionedSelectedIndex(0);
                            }}
                          />
                          <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                            <input
                              type="text"
                              value={mentionedSearch}
                              onChange={(e) => {
                                setMentionedSearch(e.target.value);
                                setMentionedSelectedIndex(0);
                              }}
                              onKeyDown={(e) => {
                                const filteredPeople = availablePeople
                                  .filter((p) => !editingMetadata.mentionedPeople.includes(p.name))
                                  .filter(
                                    (p) =>
                                      mentionedSearch === "" ||
                                      p.name.toLowerCase().includes(mentionedSearch.toLowerCase()),
                                  )
                                  .slice(0, 10);
                                const hasAddOption = filteredPeople.length === 0 && mentionedSearch.trim() !== "";
                                const totalItems = filteredPeople.length + (hasAddOption ? 1 : 0);

                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  setMentionedSelectedIndex((prev) => (prev + 1) % totalItems);
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  setMentionedSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
                                } else if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (filteredPeople.length > 0 && mentionedSelectedIndex < filteredPeople.length) {
                                    const selected = filteredPeople[mentionedSelectedIndex];
                                    handleMetadataChange({
                                      ...editingMetadata,
                                      mentionedPeople: [...editingMetadata.mentionedPeople, selected.name],
                                    });
                                    setMentionedSearch("");
                                    setShowMentionedDropdown(false);
                                    setMentionedSelectedIndex(0);
                                  } else if (hasAddOption) {
                                    const newPerson = mentionedSearch.trim();
                                    if (newPerson && onAddPerson) {
                                      onAddPerson(newPerson);
                                    }
                                    handleMetadataChange({
                                      ...editingMetadata,
                                      mentionedPeople: [...editingMetadata.mentionedPeople, newPerson],
                                    });
                                    setMentionedSearch("");
                                    setShowMentionedDropdown(false);
                                    setMentionedSelectedIndex(0);
                                  }
                                } else if (e.key === "Escape") {
                                  setShowMentionedDropdown(false);
                                  setMentionedSearch("");
                                  setMentionedSelectedIndex(0);
                                }
                              }}
                              placeholder="Search people..."
                              autoFocus
                              className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                            />
                            <div className="max-h-48 overflow-y-auto">
                              {availablePeople
                                .filter((p) => !editingMetadata.mentionedPeople.includes(p.name))
                                .filter(
                                  (p) =>
                                    mentionedSearch === "" ||
                                    p.name.toLowerCase().includes(mentionedSearch.toLowerCase()),
                                )
                                .slice(0, 10)
                                .map((p, idx) => (
                                  <button
                                    key={p.name}
                                    onClick={() => {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        mentionedPeople: [...editingMetadata.mentionedPeople, p.name],
                                      });
                                      setMentionedSearch("");
                                      setShowMentionedDropdown(false);
                                      setMentionedSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                                      idx === mentionedSelectedIndex
                                        ? "bg-pink-100 dark:bg-pink-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    ^{p.name}
                                  </button>
                                ))}
                              {availablePeople
                                .filter((p) => !editingMetadata.mentionedPeople.includes(p.name))
                                .filter(
                                  (p) =>
                                    mentionedSearch === "" ||
                                    p.name.toLowerCase().includes(mentionedSearch.toLowerCase()),
                                ).length === 0 &&
                                (mentionedSearch === "" ? (
                                  <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">
                                    All people already mentioned
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const newPerson = mentionedSearch.trim();
                                      if (newPerson && onAddPerson) {
                                        onAddPerson(newPerson);
                                      }
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        mentionedPeople: [...editingMetadata.mentionedPeople, newPerson],
                                      });
                                      setMentionedSearch("");
                                      setShowMentionedDropdown(false);
                                      setMentionedSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors text-pink-600 dark:text-pink-400 font-medium ${
                                      mentionedSelectedIndex === 0
                                        ? "bg-pink-100 dark:bg-pink-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    + Add "^{mentionedSearch}"
                                  </button>
                                ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🔥 Priority</h4>
                  <div className="flex flex-wrap gap-1.5">
                    <div className="relative">
                      <button
                        onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                        className="text-xs px-2 py-1 rounded border bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        !!{editingMetadata.priority || settings.autoAssign.priority || "None"}
                      </button>
                      {showPriorityDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => {
                              setShowPriorityDropdown(false);
                              setPrioritySearch("");
                              setPrioritySelectedIndex(0);
                            }}
                          />
                          <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                            <input
                              type="text"
                              value={prioritySearch}
                              onChange={(e) => {
                                setPrioritySearch(e.target.value);
                                setPrioritySelectedIndex(0);
                              }}
                              onKeyDown={(e) => {
                                const filteredPriorities = availablePriorities.filter(
                                  (p) =>
                                    prioritySearch === "" ||
                                    p.name.toLowerCase().includes(prioritySearch.toLowerCase()),
                                );
                                const hasAddOption = filteredPriorities.length === 0 && prioritySearch.trim() !== "";
                                const totalItems = filteredPriorities.length + (hasAddOption ? 1 : 0);

                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  setPrioritySelectedIndex((prev) => (prev + 1) % totalItems);
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  setPrioritySelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
                                } else if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (
                                    filteredPriorities.length > 0 &&
                                    prioritySelectedIndex < filteredPriorities.length
                                  ) {
                                    const selected = filteredPriorities[prioritySelectedIndex];
                                    handleMetadataChange({
                                      ...editingMetadata,
                                      priority: selected.name,
                                    });
                                    setPrioritySearch("");
                                    setShowPriorityDropdown(false);
                                    setPrioritySelectedIndex(0);
                                  } else if (hasAddOption) {
                                    const newPriority = prioritySearch.trim();
                                    if (newPriority && onAddPriority) {
                                      onAddPriority(newPriority);
                                    }
                                    handleMetadataChange({
                                      ...editingMetadata,
                                      priority: newPriority,
                                    });
                                    setPrioritySearch("");
                                    setShowPriorityDropdown(false);
                                    setPrioritySelectedIndex(0);
                                  }
                                } else if (e.key === "Escape") {
                                  setShowPriorityDropdown(false);
                                  setPrioritySearch("");
                                  setPrioritySelectedIndex(0);
                                }
                              }}
                              placeholder="Search priorities..."
                              autoFocus
                              className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                            />
                            <div className="max-h-48 overflow-y-auto">
                              {availablePriorities
                                .filter(
                                  (p) =>
                                    prioritySearch === "" ||
                                    p.name.toLowerCase().includes(prioritySearch.toLowerCase()),
                                )
                                .map((p, idx) => (
                                  <button
                                    key={p.name}
                                    onClick={() => {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        priority: p.name,
                                      });
                                      setPrioritySearch("");
                                      setShowPriorityDropdown(false);
                                      setPrioritySelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                                      idx === prioritySelectedIndex
                                        ? "bg-red-100 dark:bg-red-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    !!{p.name}
                                  </button>
                                ))}
                              {availablePriorities.filter(
                                (p) =>
                                  prioritySearch === "" || p.name.toLowerCase().includes(prioritySearch.toLowerCase()),
                              ).length === 0 &&
                                (prioritySearch === "" ? (
                                  <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">
                                    No priorities available
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const newPriority = prioritySearch.trim();
                                      if (newPriority && onAddPriority) {
                                        onAddPriority(newPriority);
                                      }
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        priority: newPriority,
                                      });
                                      setPrioritySearch("");
                                      setShowPriorityDropdown(false);
                                      setPrioritySelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors text-red-600 dark:text-red-400 font-medium ${
                                      prioritySelectedIndex === 0
                                        ? "bg-red-100 dark:bg-red-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    + Add "!!{prioritySearch}"
                                  </button>
                                ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🏷️ Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {editingMetadata.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          handleMetadataChange({
                            ...editingMetadata,
                            tags: editingMetadata.tags.filter((t) => t !== tag),
                          });
                        }}
                        className="text-xs px-2 py-1 rounded border bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
                      >
                        {tag} ✕
                      </button>
                    ))}
                    <div className="relative">
                      <button
                        onClick={() => setShowTagInput(!showTagInput)}
                        className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                      >
                        +
                      </button>
                      {showTagInput && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => {
                              setShowTagInput(false);
                              setTagInput("");
                            }}
                          />
                          <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const newTag = tagInput.trim();
                                  if (newTag && !editingMetadata.tags.includes(newTag)) {
                                    handleMetadataChange({
                                      ...editingMetadata,
                                      tags: [...editingMetadata.tags, newTag],
                                    });
                                    setTagInput("");
                                    setShowTagInput(false);
                                  }
                                } else if (e.key === "Escape") {
                                  setShowTagInput(false);
                                  setTagInput("");
                                }
                              }}
                              placeholder="Enter tag name..."
                              autoFocus
                              className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none rounded"
                            />
                          </div>
                        </>
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
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      {editingMetadata.dueDate && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                          {(() => {
                            const dateStr = editingMetadata.dueDate.includes("T")
                              ? editingMetadata.dueDate.split("T")[0]
                              : editingMetadata.dueDate;
                            const date = new Date(dateStr + "T00:00:00");
                            return date.toLocaleDateString("en-US", { weekday: "short" });
                          })()}
                        </span>
                      )}
                      <input
                        type="date"
                        value={
                          editingMetadata.dueDate
                            ? editingMetadata.dueDate.includes("T")
                              ? editingMetadata.dueDate.split("T")[0]
                              : editingMetadata.dueDate
                            : ""
                        }
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
                      value={
                        editingMetadata.dueDate && editingMetadata.dueDate.includes("T")
                          ? editingMetadata.dueDate.split("T")[1]
                          : ""
                      }
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
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">⏱️ Duration</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {editingMetadata.duration ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                          className="text-xs px-2 py-1 rounded border bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                        >
                          *{editingMetadata.duration}{" "}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMetadataChange({
                                ...editingMetadata,
                                duration: undefined,
                              });
                            }}
                            className="ml-1 hover:text-amber-900 dark:hover:text-amber-100"
                          >
                            ✕
                          </span>
                        </button>
                        {showDurationDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => {
                                setShowDurationDropdown(false);
                                setDurationSearch("");
                                setDurationSelectedIndex(0);
                              }}
                            />
                            <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                              <input
                                type="text"
                                value={durationSearch}
                                onChange={(e) => {
                                  setDurationSearch(e.target.value);
                                  setDurationSelectedIndex(0);
                                }}
                                onKeyDown={(e) => {
                                  const suggestions = getDurationSuggestions(durationSearch);
                                  const totalItems = suggestions.length;

                                  if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    if (totalItems > 0) {
                                      setDurationSelectedIndex((prev) => (prev + 1) % totalItems);
                                    }
                                  } else if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    if (totalItems > 0) {
                                      setDurationSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
                                    }
                                  } else if (e.key === "Enter") {
                                    e.preventDefault();
                                    const valueToUse =
                                      suggestions.length > 0
                                        ? suggestions[durationSelectedIndex]
                                        : durationSearch.trim();
                                    if (valueToUse) {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        duration: valueToUse,
                                      });
                                      setDurationSearch("");
                                      setShowDurationDropdown(false);
                                      setDurationSelectedIndex(0);
                                    }
                                  } else if (e.key === "Escape") {
                                    setShowDurationDropdown(false);
                                    setDurationSearch("");
                                    setDurationSelectedIndex(0);
                                  }
                                }}
                                placeholder="e.g., 2h, 30m, 1d"
                                autoFocus
                                className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                              />
                              <div className="max-h-48 overflow-y-auto">
                                {getDurationSuggestions(durationSearch).map((suggestion, idx) => (
                                  <button
                                    key={suggestion}
                                    onClick={() => {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        duration: suggestion,
                                      });
                                      setDurationSearch("");
                                      setShowDurationDropdown(false);
                                      setDurationSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                                      idx === durationSelectedIndex
                                        ? "bg-amber-100 dark:bg-amber-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    *{suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                          className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                        >
                          +
                        </button>
                        {showDurationDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => {
                                setShowDurationDropdown(false);
                                setDurationSearch("");
                                setDurationSelectedIndex(0);
                              }}
                            />
                            <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                              <input
                                type="text"
                                value={durationSearch}
                                onChange={(e) => {
                                  setDurationSearch(e.target.value);
                                  setDurationSelectedIndex(0);
                                }}
                                onKeyDown={(e) => {
                                  const suggestions = getDurationSuggestions(durationSearch);
                                  const totalItems = suggestions.length;

                                  if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    if (totalItems > 0) {
                                      setDurationSelectedIndex((prev) => (prev + 1) % totalItems);
                                    }
                                  } else if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    if (totalItems > 0) {
                                      setDurationSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
                                    }
                                  } else if (e.key === "Enter") {
                                    e.preventDefault();
                                    const valueToUse =
                                      suggestions.length > 0
                                        ? suggestions[durationSelectedIndex]
                                        : durationSearch.trim();
                                    if (valueToUse) {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        duration: valueToUse,
                                      });
                                      setDurationSearch("");
                                      setShowDurationDropdown(false);
                                      setDurationSelectedIndex(0);
                                    }
                                  } else if (e.key === "Escape") {
                                    setShowDurationDropdown(false);
                                    setDurationSearch("");
                                    setDurationSelectedIndex(0);
                                  }
                                }}
                                placeholder="e.g., 2h, 30m, 1d"
                                autoFocus
                                className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                              />
                              <div className="max-h-48 overflow-y-auto">
                                {getDurationSuggestions(durationSearch).map((suggestion, idx) => (
                                  <button
                                    key={suggestion}
                                    onClick={() => {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        duration: suggestion,
                                      });
                                      setDurationSearch("");
                                      setShowDurationDropdown(false);
                                      setDurationSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                                      idx === durationSelectedIndex
                                        ? "bg-amber-100 dark:bg-amber-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    *{suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recurring */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🔄 Recurring</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {editingMetadata.recurring ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowRecurringDropdown(!showRecurringDropdown)}
                          className="text-xs px-2 py-1 rounded border bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors"
                        >
                          %{editingMetadata.recurring}{" "}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMetadataChange({
                                ...editingMetadata,
                                recurring: undefined,
                              });
                            }}
                            className="ml-1 hover:text-cyan-900 dark:hover:text-cyan-100"
                          >
                            ✕
                          </span>
                        </button>
                        {showRecurringDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => {
                                setShowRecurringDropdown(false);
                                setRecurringSearch("");
                                setRecurringSelectedIndex(0);
                              }}
                            />
                            <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                              <input
                                type="text"
                                value={recurringSearch}
                                onChange={(e) => {
                                  setRecurringSearch(e.target.value);
                                  setRecurringSelectedIndex(0);
                                }}
                                onKeyDown={(e) => {
                                  const suggestions = getRecurringSuggestions(recurringSearch);
                                  const totalItems = suggestions.length;

                                  if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    if (totalItems > 0) {
                                      setRecurringSelectedIndex((prev) => (prev + 1) % totalItems);
                                    }
                                  } else if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    if (totalItems > 0) {
                                      setRecurringSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
                                    }
                                  } else if (e.key === "Enter") {
                                    e.preventDefault();
                                    const valueToUse =
                                      suggestions.length > 0
                                        ? suggestions[recurringSelectedIndex]
                                        : recurringSearch.trim();
                                    if (valueToUse) {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        recurring: valueToUse,
                                      });
                                      setRecurringSearch("");
                                      setShowRecurringDropdown(false);
                                      setRecurringSelectedIndex(0);
                                    }
                                  } else if (e.key === "Escape") {
                                    setShowRecurringDropdown(false);
                                    setRecurringSearch("");
                                    setRecurringSelectedIndex(0);
                                  }
                                }}
                                placeholder="e.g., every day, every monday"
                                autoFocus
                                className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                              />
                              <div className="max-h-48 overflow-y-auto">
                                {getRecurringSuggestions(recurringSearch).map((suggestion, idx) => (
                                  <button
                                    key={suggestion}
                                    onClick={() => {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        recurring: suggestion,
                                      });
                                      setRecurringSearch("");
                                      setShowRecurringDropdown(false);
                                      setRecurringSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                                      idx === recurringSelectedIndex
                                        ? "bg-cyan-100 dark:bg-cyan-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    %{suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setShowRecurringDropdown(!showRecurringDropdown)}
                          className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                        >
                          +
                        </button>
                        {showRecurringDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => {
                                setShowRecurringDropdown(false);
                                setRecurringSearch("");
                                setRecurringSelectedIndex(0);
                              }}
                            />
                            <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                              <input
                                type="text"
                                value={recurringSearch}
                                onChange={(e) => {
                                  setRecurringSearch(e.target.value);
                                  setRecurringSelectedIndex(0);
                                }}
                                onKeyDown={(e) => {
                                  const suggestions = getRecurringSuggestions(recurringSearch);
                                  const totalItems = suggestions.length;

                                  if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    if (totalItems > 0) {
                                      setRecurringSelectedIndex((prev) => (prev + 1) % totalItems);
                                    }
                                  } else if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    if (totalItems > 0) {
                                      setRecurringSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
                                    }
                                  } else if (e.key === "Enter") {
                                    e.preventDefault();
                                    const valueToUse =
                                      suggestions.length > 0
                                        ? suggestions[recurringSelectedIndex]
                                        : recurringSearch.trim();
                                    if (valueToUse) {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        recurring: valueToUse,
                                      });
                                      setRecurringSearch("");
                                      setShowRecurringDropdown(false);
                                      setRecurringSelectedIndex(0);
                                    }
                                  } else if (e.key === "Escape") {
                                    setShowRecurringDropdown(false);
                                    setRecurringSearch("");
                                    setRecurringSelectedIndex(0);
                                  }
                                }}
                                placeholder="e.g., every day, every monday"
                                autoFocus
                                className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                              />
                              <div className="max-h-48 overflow-y-auto">
                                {getRecurringSuggestions(recurringSearch).map((suggestion, idx) => (
                                  <button
                                    key={suggestion}
                                    onClick={() => {
                                      handleMetadataChange({
                                        ...editingMetadata,
                                        recurring: suggestion,
                                      });
                                      setRecurringSearch("");
                                      setShowRecurringDropdown(false);
                                      setRecurringSelectedIndex(0);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                                      idx === recurringSelectedIndex
                                        ? "bg-cyan-100 dark:bg-cyan-900/50"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    %{suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
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

                  if (foundLinks.length > 0) {
                    return (
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🌐 Links</h4>
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
                      </div>
                    );
                  }
                  return null;
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
