"use client";

import { useState, useRef, useEffect } from "react";
import { TodoMetadata } from "@/types/todo";
import { MarkerColors, Settings, LinkPattern, Priority } from "@/types/settings";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import { MarkedText } from "@/components/shared/MarkedText";
import { Activity } from "@/components/shared/Activity";
import { Subtasks } from "@/components/shared/Subtasks";
import { TimeTracking } from "@/components/shared/TimeTracking";
import RichTextEditor from "@/components/input/RichTextEditor";
import { Badge } from "@/components/shared/Badge";
import { SearchableDropdown } from "@/components/shared/SearchableDropdown";
import { ActionButtons } from "@/components/shared/ActionButtons";
import { MetadataSection } from "@/components/shared/MetadataSection";
import { Modal } from "@/components/shared/Modal";
import { getDurationSuggestions, filterRecurringSuggestions } from "@/utils/suggestions";
import { normalizeDateValue, convertToDateInputFormat, convertToTimeInputFormat } from "@/utils/dateUtils";
import { calculateUsageStats, sortStringsByUsage } from "@/utils/usageStats";
import { findPersonColor, findProjectColor, findPriorityColor, getTextColor } from "@/utils/colors";
import { DELAY_OPTIONS } from "@/utils/delayOptions";
import { useDropdownManager } from "@/hooks/useDropdownManager";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";

interface TodoDetailsOverlayProps {
  todo: TodoModel;
  todos?: TodoModel[]; // All todos for dependency selection
  isOpen: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => string | undefined;
  onEdit: (id: string, text: string, plainText: string, metadata: TodoMetadata) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  markerColors: MarkerColors;
  settings: Settings;
  linkPatterns: LinkPattern[];
  availablePeople: PersonModel[];
  availableProjects: ProjectModel[];
  availablePriorities: Priority[];
  onAddPerson?: (name: string) => void;
  onAddProject?: (name: string) => void;
  onAddPriority?: (name: string) => void;
  onAddComment?: (todoId: string, content: string) => void;
  // Subtask handlers
  onAddSubtask?: (todoId: string, text: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
  onEditSubtask?: (todoId: string, subtaskId: string, text: string) => void;
  onDeleteSubtask?: (todoId: string, subtaskId: string) => void;
  // Time tracking handlers
  onStartTimeTracking?: (todoId: string, note?: string) => void;
  onStopTimeTracking?: (todoId: string) => void;
  onAddManualTimeEntry?: (todoId: string, minutes: number, note?: string) => void;
  onDeleteTimeEntry?: (todoId: string, entryId: string) => void;
  // Template handler
  onCreateTemplate?: (todoId: string) => void;
}

export function TodoDetailsOverlay({
  todo,
  todos = [],
  isOpen,
  onClose,
  onToggle,
  onDelete,
  onDuplicate,
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
  onAddSubtask,
  onToggleSubtask,
  onEditSubtask,
  onDeleteSubtask,
  onStartTimeTracking,
  onStopTimeTracking,
  onAddManualTimeEntry,
  onDeleteTimeEntry,
  onCreateTemplate,
}: TodoDetailsOverlayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTokens, setEditTokens] = useState<TokenMatch[]>([]);
  const [editFullText, setEditFullText] = useState("");
  const [editPlainText, setEditPlainText] = useState("");
  const smartInputRef = useRef<SmartEditableInputHandle>(null);

  // Dropdown state management
  const dropdown = useDropdownManager();
  const [newComment, setNewComment] = useState("");

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

    // Start with existing metadata (additive approach - preserve what's not in tokens)
    const metadata: TodoMetadata = {
      // Arrays: merge existing with tokens (additive)
      assignedPeople: editTokens.filter((t) => t.type === "assigned").map((t) => t.value),
      sourcePeople: editTokens.filter((t) => t.type === "source").map((t) => t.value),
      mentionedPeople: editTokens.filter((t) => t.type === "mentioned").map((t) => t.value),
      projects: editTokens.filter((t) => t.type === "project").map((t) => t.value),
      dependencies: editTokens.filter((t) => t.type === "dependency").map((t) => t.value),
      tags: editTokens.filter((t) => t.type === "tag").map((t) => t.value),
      // Singular fields: use token value if found, otherwise preserve existing
      priority: editTokens.find((t) => t.type === "priority")?.value || editingMetadata.priority,
      dueDate: editTokens.find((t) => t.type === "dueDate")?.value || editingMetadata.dueDate,
      duration: editTokens.find((t) => t.type === "duration")?.value || editingMetadata.duration,
      recurring: editTokens.find((t) => t.type === "recurring")?.value || editingMetadata.recurring,
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
    newMetadata.projects.forEach((p) => parts.push(`%${p}`));
    if (newMetadata.priority) parts.push(`!!${newMetadata.priority}`);
    newMetadata.tags.forEach((t) => parts.push(`#${t}`));

    const newText = parts.join(" ");
    onEdit(todo.id, newText, todo.plainText, newMetadata);
    setEditingMetadata(newMetadata);
  };

  // Helper functions for colors using centralized utilities
  const getPersonColor = (name: string) => {
    return findPersonColor(name, availablePeople, markerColors.assigned);
  };

  const getProjectColor = (name: string) => {
    return findProjectColor(name, availableProjects, markerColors.project);
  };

  const getPriorityColor = (priority: string) => {
    return findPriorityColor(priority, availablePriorities, markerColors.priority);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl">
      <div className="p-6">
        {/* Header with Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: todo.statusColor + "20", color: todo.statusColor }}
          >
            {todo.statusBadge}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Task Content */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <input
              type="checkbox"
              checked={todo.isCompleted}
              onChange={() => onToggle(todo.id)}
              className="mt-1 w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <SmartEditableInput
                    ref={smartInputRef}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <div className="relative ml-auto">
                      <button
                        onClick={() => dropdown.toggleDropdown("marker-reference")}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Show marker reference"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                      {dropdown.isOpen("marker-reference") && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => dropdown.closeDropdown()} />
                          <div className="absolute right-0 top-full mt-2 z-40 w-80 p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                ✨ Smart Input Markers
                              </h3>
                              <button
                                onClick={() => dropdown.closeDropdown()}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 text-xs">
                              <div className="flex items-center gap-1.5">
                                <code className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono">
                                  @name
                                </code>
                                <span className="text-zinc-600 dark:text-zinc-400">Assign</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <code className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-mono">
                                  $name
                                </code>
                                <span className="text-zinc-600 dark:text-zinc-400">Source</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <code className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-mono">
                                  %proj
                                </code>
                                <span className="text-zinc-600 dark:text-zinc-400">Project</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <code className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-mono">
                                  !!high
                                </code>
                                <span className="text-zinc-600 dark:text-zinc-400">Priority</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <code className="bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded font-mono">
                                  #tag
                                </code>
                                <span className="text-zinc-600 dark:text-zinc-400">Tag</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <code className="bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 px-1.5 py-0.5 rounded font-mono italic">
                                  tomorrow
                                </code>
                                <span className="text-zinc-600 dark:text-zinc-400">Due (auto)</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <code className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono italic">
                                  2h, 30m
                                </code>
                                <span className="text-zinc-600 dark:text-zinc-400">Duration (auto)</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <code className="bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded font-mono italic">
                                  every mon
                                </code>
                                <span className="text-zinc-600 dark:text-zinc-400">Recurring (auto)</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <code className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded font-mono italic">
                                  John
                                </code>
                                <span className="text-zinc-600 dark:text-zinc-400">Mention (auto)</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
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
                    availablePeople={availablePeople}
                    availableProjects={availableProjects}
                    availablePriorities={availablePriorities}
                  />
                </h2>
              )}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <div>
              <span className="font-medium">Created:</span> {todo.createdDateDisplay} ({todo.ageDisplay})
            </div>
            {todo.updatedAt && (
              <div>
                <span className="font-medium">Updated:</span> {todo.updatedDateDisplay}
              </div>
            )}
            {todo.completedAt && (
              <div>
                <span className="font-medium">Completed:</span> {todo.completedDateDisplay}
              </div>
            )}
            {todo.archivedAt && (
              <div>
                <span className="font-medium">Archived:</span> {new Date(todo.archivedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Assigned People */}
          <MetadataSection
            title="Assigned"
            icon="👤"
            values={editingMetadata.assignedPeople}
            onRemove={(person) => {
              handleMetadataChange({
                ...editingMetadata,
                assignedPeople: editingMetadata.assignedPeople.filter((p) => p !== person),
              });
            }}
            onAdd={(name) => {
              if (onAddPerson && !availablePeople.find((p) => p.name === name)) {
                onAddPerson(name);
              }
              handleMetadataChange({
                ...editingMetadata,
                assignedPeople: [...editingMetadata.assignedPeople, name],
              });
            }}
            availableItems={availablePeople.map((p) => ({
              id: p.name,
              label: p.name,
              prefix: "@",
              alternatives: p.alternatives,
            }))}
            dropdownId="assigned"
            placeholder="Search people..."
            highlightColor="blue"
            emptyMessage="All people already assigned"
            getColor={getPersonColor}
            getTextColor={getTextColor}
            prefix="@"
          />

          {/* Projects */}
          <MetadataSection
            title="Projects"
            icon="📁"
            values={editingMetadata.projects}
            onRemove={(project) => {
              handleMetadataChange({
                ...editingMetadata,
                projects: editingMetadata.projects.filter((p) => p !== project),
              });
            }}
            onAdd={(name) => {
              if (onAddProject && !availableProjects.find((p) => p.name === name)) {
                onAddProject(name);
              }
              handleMetadataChange({
                ...editingMetadata,
                projects: [...editingMetadata.projects, name],
              });
            }}
            availableItems={availableProjects.map((p) => ({
              id: p.name,
              label: `%${p.name}`,
              alternatives: p.alternatives,
            }))}
            dropdownId="project"
            placeholder="Search projects..."
            highlightColor="purple"
            emptyMessage="All projects already added"
            getColor={getProjectColor}
            getTextColor={getTextColor}
            prefix="%"
          />

          {/* Source People */}
          <MetadataSection
            title="Source"
            icon="💼"
            values={editingMetadata.sourcePeople}
            onRemove={(person) => {
              handleMetadataChange({
                ...editingMetadata,
                sourcePeople: editingMetadata.sourcePeople.filter((p) => p !== person),
              });
            }}
            onAdd={(name) => {
              if (onAddPerson && !availablePeople.find((p) => p.name === name)) {
                onAddPerson(name);
              }
              handleMetadataChange({
                ...editingMetadata,
                sourcePeople: [...editingMetadata.sourcePeople, name],
              });
            }}
            availableItems={availablePeople.map((p) => ({
              id: p.name,
              label: `$${p.name}`,
              alternatives: p.alternatives,
            }))}
            dropdownId="source"
            placeholder="Search people..."
            highlightColor="green"
            emptyMessage="All people already added"
            getColor={getPersonColor}
            getTextColor={getTextColor}
            prefix="$"
          />

          {/* Mentioned People */}
          <MetadataSection
            title="Mentioned"
            icon="💬"
            values={editingMetadata.mentionedPeople}
            onRemove={(person) => {
              handleMetadataChange({
                ...editingMetadata,
                mentionedPeople: editingMetadata.mentionedPeople.filter((p) => p !== person),
              });
            }}
            onAdd={(name) => {
              if (onAddPerson && !availablePeople.find((p) => p.name === name)) {
                onAddPerson(name);
              }
              handleMetadataChange({
                ...editingMetadata,
                mentionedPeople: [...editingMetadata.mentionedPeople, name],
              });
            }}
            availableItems={availablePeople.map((p) => ({
              id: p.name,
              label: p.name,
              alternatives: p.alternatives,
            }))}
            dropdownId="mentioned"
            placeholder="Search people..."
            highlightColor="pink"
            emptyMessage="All people already mentioned"
            getColor={getPersonColor}
            getTextColor={getTextColor}
            showPrefix={false}
          />

          {/* Priority */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🔥 Priority</h4>
            <div className="flex flex-wrap gap-1.5">
              {dropdown.isOpen("priority") && (
                <SearchableDropdown
                  items={availablePriorities.map((p) => ({
                    id: p.name,
                    label: `!!${p.name}`,
                    alternatives: p.alternatives,
                  }))}
                  onSelect={(item) => {
                    handleMetadataChange({
                      ...editingMetadata,
                      priority: typeof item === "string" ? item : item.id,
                    });
                    dropdown.closeDropdown();
                  }}
                  onAdd={
                    onAddPriority
                      ? (name) => {
                          onAddPriority(name);
                          handleMetadataChange({
                            ...editingMetadata,
                            priority: name,
                          });
                          dropdown.closeDropdown();
                        }
                      : undefined
                  }
                  onClose={() => dropdown.closeDropdown()}
                  placeholder="Search priorities..."
                  highlightColor="red"
                  emptyMessage="No priorities available"
                />
              )}
              {editingMetadata.priority ? (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium cursor-pointer"
                  style={{
                    backgroundColor: getPriorityColor(editingMetadata.priority),
                    color: getTextColor(getPriorityColor(editingMetadata.priority)),
                  }}
                  onClick={() => dropdown.toggleDropdown("priority")}
                >
                  !!{editingMetadata.priority}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMetadataChange({ ...editingMetadata, priority: "" });
                    }}
                    className="ml-1 hover:opacity-70"
                  >
                    ×
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => dropdown.toggleDropdown("priority")}
                  className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                >
                  !!{settings.autoAssign.priority || "None"}
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <MetadataSection
            title="Tags"
            icon="🏷️"
            values={editingMetadata.tags}
            onRemove={(tag) => {
              handleMetadataChange({
                ...editingMetadata,
                tags: editingMetadata.tags.filter((t) => t !== tag),
              });
            }}
            onAdd={(name) => {
              const newTag = name.trim();
              if (newTag && !editingMetadata.tags.includes(newTag)) {
                handleMetadataChange({
                  ...editingMetadata,
                  tags: [...editingMetadata.tags, newTag],
                });
              }
            }}
            availableItems={sortedTags.map((tag) => ({ id: tag, label: tag, prefix: "#" }))}
            dropdownId="tag"
            placeholder="Search or add tag..."
            customColor={markerColors.tag}
            emptyMessage="No existing tags. Type to create new."
          />

          {/* Dependencies */}
          <MetadataSection
            title="Dependencies"
            icon="⛓️"
            values={editingMetadata.dependencies}
            onRemove={(depId) => {
              handleMetadataChange({
                ...editingMetadata,
                dependencies: editingMetadata.dependencies.filter((d) => d !== depId),
              });
            }}
            onAdd={(id) => {
              handleMetadataChange({
                ...editingMetadata,
                dependencies: [...editingMetadata.dependencies, id],
              });
            }}
            availableItems={todos.filter((t) => t.id !== todo.id).map((t) => ({ id: t.id, label: t.plainText }))}
            dropdownId="dependency"
            placeholder="Search tasks..."
            customColor={markerColors.dependency}
            emptyMessage="All tasks already added"
            noItemsMessage="No other tasks available"
            renderCustomValue={(depId) => {
              const depTodo = todos.find((t) => t.id === depId);
              if (!depTodo) return null;
              return (
                <Badge
                  customColor={markerColors.dependency}
                  onRemove={() => {
                    handleMetadataChange({
                      ...editingMetadata,
                      dependencies: editingMetadata.dependencies.filter((d) => d !== depId),
                    });
                  }}
                >
                  {depTodo.plainText.length > 30 ? depTodo.plainText.substring(0, 30) + "..." : depTodo.plainText}
                </Badge>
              );
            }}
          />

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
                  value={convertToDateInputFormat(editingMetadata.dueDate, settings.dateTime, settings.workHours)}
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
                value={convertToTimeInputFormat(editingMetadata.dueDate, settings.dateTime, settings.workHours)}
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
                    onClick={() => dropdown.toggleDropdown("delayed")}
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
                  {dropdown.isOpen("delayed") && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => dropdown.closeDropdown()} />
                      <div className="absolute right-0 z-20 mt-1 w-48 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg py-1 max-h-64 overflow-y-auto">
                        {DELAY_OPTIONS.map((option) => (
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
                              dropdown.closeDropdown();
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
              {dropdown.isOpen("duration") && (
                <SearchableDropdown
                  items={getDurationSuggestions("").map((d) => ({ id: d, label: `*${d}` }))}
                  onSelect={(item) => {
                    handleMetadataChange({
                      ...editingMetadata,
                      duration: typeof item === "string" ? item : item.id,
                    });
                    dropdown.closeDropdown();
                  }}
                  onAdd={(value) => {
                    handleMetadataChange({
                      ...editingMetadata,
                      duration: value,
                    });
                    dropdown.closeDropdown();
                  }}
                  onClose={() => dropdown.closeDropdown()}
                  placeholder="e.g., 2h, 30m, 1d"
                  highlightColor="amber"
                  emptyMessage=""
                />
              )}
              {editingMetadata.duration ? (
                <Badge
                  customColor={markerColors.duration}
                  onRemove={() => {
                    handleMetadataChange({
                      ...editingMetadata,
                      duration: undefined,
                    });
                  }}
                >
                  {editingMetadata.duration}
                </Badge>
              ) : (
                <button
                  onClick={() => dropdown.toggleDropdown("duration")}
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
              {dropdown.isOpen("recurring") && (
                <SearchableDropdown
                  items={filterRecurringSuggestions("").map((r) => ({ id: r, label: `%${r}` }))}
                  onSelect={(item) => {
                    handleMetadataChange({
                      ...editingMetadata,
                      recurring: typeof item === "string" ? item : item.id,
                    });
                    dropdown.closeDropdown();
                  }}
                  onAdd={(value) => {
                    handleMetadataChange({
                      ...editingMetadata,
                      recurring: value,
                    });
                    dropdown.closeDropdown();
                  }}
                  onClose={() => dropdown.closeDropdown()}
                  placeholder="e.g., every day, every monday"
                  highlightColor="teal"
                  emptyMessage=""
                />
              )}
              {editingMetadata.recurring ? (
                <Badge
                  customColor={markerColors.recurring}
                  onRemove={() => {
                    handleMetadataChange({
                      ...editingMetadata,
                      recurring: undefined,
                    });
                  }}
                >
                  {editingMetadata.recurring}
                </Badge>
              ) : (
                <button
                  onClick={() => dropdown.toggleDropdown("recurring")}
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
            const foundLinks: { prefix: string; id: string; url: string; description: string; color: string }[] = [];
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

          {/* Create Template Button */}
          {onCreateTemplate && (
            <button
              onClick={() => onCreateTemplate(todo.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              title="Save as template"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save as Template
            </button>
          )}

          {/* Action Buttons */}
          <ActionButtons
            isArchived={todo.state === "archived"}
            onDuplicate={
              onDuplicate
                ? () => {
                    onDuplicate(todo.id);
                    onClose();
                  }
                : undefined
            }
            onArchive={
              todo.state === "active" || todo.state === "completed"
                ? () => {
                    if (onArchive) {
                      onArchive(todo.id);
                      onClose();
                    }
                  }
                : undefined
            }
            onUnarchive={
              onUnarchive
                ? () => {
                    onUnarchive(todo.id);
                    onClose();
                  }
                : undefined
            }
            onDelete={() => {
              onDelete(todo.id);
              onClose();
            }}
            duplicateLabel="Duplicate todo"
            archiveLabel="Archive todo"
            unarchiveLabel="Unarchive todo"
            deleteLabel="Delete todo"
          />
        </div>

        {/* Subtasks Section */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              ✅ Subtasks
              {todo.hasSubtasks && (
                <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-500">
                  ({todo.completedSubtaskCount}/{todo.subtaskCount} completed)
                </span>
              )}
            </h4>
          </div>
          <Subtasks
            subtasks={todo.subtasks}
            onAdd={(text) => onAddSubtask?.(todo.id, text)}
            onToggle={(subtaskId) => onToggleSubtask?.(todo.id, subtaskId)}
            onEdit={(subtaskId, text) => onEditSubtask?.(todo.id, subtaskId, text)}
            onDelete={(subtaskId) => onDeleteSubtask?.(todo.id, subtaskId)}
            readOnly={!onAddSubtask}
          />
        </div>

        {/* Time Tracking Section */}
        {onStartTimeTracking && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                ⏱️ Time Tracking
                {todo.hasTimeTracking && (
                  <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-500">
                    ({todo.totalTrackedTimeDisplay})
                  </span>
                )}
              </h4>
            </div>
            <TimeTracking
              entries={todo.timeTracking?.entries || []}
              totalMinutes={todo.totalTrackedMinutes}
              isTracking={todo.isTrackingTime}
              activeEntry={todo.activeTimeEntry}
              onStart={(note) => onStartTimeTracking(todo.id, note)}
              onStop={() => onStopTimeTracking?.(todo.id)}
              onAddManual={(minutes, note) => onAddManualTimeEntry?.(todo.id, minutes, note)}
              onDelete={(entryId) => onDeleteTimeEntry?.(todo.id, entryId)}
            />
          </div>
        )}

        {/* Activity (includes comments inline) */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              📋 Activity
              {todo.hasActivity && (
                <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-500">
                  ({todo.activityCount} {todo.activityCount === 1 ? "entry" : "entries"}
                  {todo.hasComments && `, ${todo.commentCount} ${todo.commentCount === 1 ? "comment" : "comments"}`})
                </span>
              )}
            </h4>
          </div>

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
      </div>
    </Modal>
  );
}
