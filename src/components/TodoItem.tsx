"use client";

import { useState, useRef, useEffect } from "react";
import { Todo, TodoMetadata } from "@/types/todo";
import { MarkerColors, GeneralSettings, LinkPattern, Person, Project, Priority } from "@/types/settings";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/SmartInput";
import { MarkedText } from "./MarkedText";
import { Comments } from "./Comments";

interface TodoItemProps {
  todo: Todo;
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
  onMarkerClick?: (
    type: "assignedPeople" | "sourcePeople" | "mentionedPeople" | "projects" | "priorities" | "dueDates" | "durations",
    value: string,
  ) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddComment?: (todoId: string, content: string) => void;
  onEditComment?: (todoId: string, commentId: number, content: string) => void;
  onDeleteComment?: (todoId: string, commentId: number) => void;
}

export function TodoItem({
  todo,
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
  onMarkerClick,
  isExpanded,
  onToggleExpand,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTokens, setCurrentTokens] = useState<TokenMatch[]>([]);
  const [currentFullText, setCurrentFullText] = useState("");
  const [currentPlainText, setCurrentPlainText] = useState("");
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

  // Helper functions to get entity colors
  const getPersonColor = (name: string): string => {
    const person = availablePeople.find((p) => p.name === name || p.alternatives.includes(name));
    return person?.color || markerColors.assigned;
  };

  const getProjectColor = (name: string): string => {
    const project = availableProjects.find((p) => p.name === name || p.alternatives.includes(name));
    return project?.color || markerColors.project;
  };

  const getPriorityColor = (name: string): string => {
    const priority = availablePriorities.find((p) => p.name === name || p.alternatives.includes(name));
    return priority?.color || markerColors.priority;
  };

  // Helper to determine if text should be white or black based on background color
  const getTextColor = (bgColor: string): string => {
    // Convert hex to RGB
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  useEffect(() => {
    if (isEditing && smartInputRef.current) {
      // Set initial content when entering edit mode
      smartInputRef.current.setValue(todo.text);
    }
  }, [isEditing, todo.text]);

  const handleTokensChange = (tokens: TokenMatch[], fullText: string, plainText: string) => {
    setCurrentTokens(tokens);
    setCurrentFullText(fullText);
    setCurrentPlainText(plainText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlainText.trim()) return;

    // Start with a fresh metadata object
    const metadata: TodoMetadata = {
      assignedPeople: [],
      sourcePeople: [],
      mentionedPeople: [],
      projects: [],
    };

    // Parse tokens from the edited text
    currentTokens.forEach((token) => {
      switch (token.type) {
        case "assigned":
          metadata.assignedPeople.push(token.value);
          break;
        case "source":
          metadata.sourcePeople.push(token.value);
          break;
        case "mentioned":
          metadata.mentionedPeople.push(token.value);
          break;
        case "project":
          metadata.projects.push(token.value);
          break;
        case "priority":
          metadata.priority = token.value;
          break;
        case "dueDate":
          metadata.dueDate = token.value;
          break;
        case "duration":
          metadata.duration = token.value;
          break;
      }
    });

    // Preserve existing metadata or apply auto-assignment defaults for fields not explicitly provided
    if (generalSettings.autoAssign.enabled) {
      const autoAssign = generalSettings.autoAssign;

      // If no assigned people in edit and none existed before, apply auto-assign
      if (metadata.assignedPeople.length === 0) {
        if (todo.metadata.assignedPeople.length > 0) {
          metadata.assignedPeople = todo.metadata.assignedPeople;
        } else if (autoAssign.assignedPerson) {
          metadata.assignedPeople.push(autoAssign.assignedPerson);
        }
      }

      if (metadata.sourcePeople.length === 0) {
        if (todo.metadata.sourcePeople.length > 0) {
          metadata.sourcePeople = todo.metadata.sourcePeople;
        } else if (autoAssign.sourcePerson) {
          metadata.sourcePeople.push(autoAssign.sourcePerson);
        }
      }

      if (metadata.mentionedPeople.length === 0) {
        if (todo.metadata.mentionedPeople.length > 0) {
          metadata.mentionedPeople = todo.metadata.mentionedPeople;
        } else if (autoAssign.mentionedPerson) {
          metadata.mentionedPeople.push(autoAssign.mentionedPerson);
        }
      }

      if (metadata.projects.length === 0) {
        if (todo.metadata.projects.length > 0) {
          metadata.projects = todo.metadata.projects;
        } else if (autoAssign.project) {
          metadata.projects.push(autoAssign.project);
        }
      }

      if (!metadata.priority) {
        metadata.priority = todo.metadata.priority || autoAssign.priority;
      }

      if (!metadata.dueDate) {
        metadata.dueDate = todo.metadata.dueDate || autoAssign.dueDate;
      }

      if (!metadata.duration) {
        metadata.duration = todo.metadata.duration || autoAssign.duration;
      }
    } else {
      // Auto-assign disabled: preserve existing metadata for fields not explicitly provided
      if (metadata.assignedPeople.length === 0 && todo.metadata.assignedPeople.length > 0) {
        metadata.assignedPeople = todo.metadata.assignedPeople;
      }
      if (metadata.sourcePeople.length === 0 && todo.metadata.sourcePeople.length > 0) {
        metadata.sourcePeople = todo.metadata.sourcePeople;
      }
      if (metadata.mentionedPeople.length === 0 && todo.metadata.mentionedPeople.length > 0) {
        metadata.mentionedPeople = todo.metadata.mentionedPeople;
      }
      if (metadata.projects.length === 0 && todo.metadata.projects.length > 0) {
        metadata.projects = todo.metadata.projects;
      }
      if (!metadata.priority) {
        metadata.priority = todo.metadata.priority;
      }
      if (!metadata.dueDate) {
        metadata.dueDate = todo.metadata.dueDate;
      }
      if (!metadata.duration) {
        metadata.duration = todo.metadata.duration;
      }
    }

    onEdit(todo.id, currentFullText, currentPlainText, metadata);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentTokens([]);
    setCurrentFullText("");
    setCurrentPlainText("");
  };

  if (isEditing) {
    return (
      <li className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
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
            onTokensChange={handleTokensChange}
            placeholder="Edit your task..."
            onEnterPress={() => {
              const event = new Event("submit", { bubbles: true, cancelable: true });
              handleSubmit(event as any);
            }}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Save
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
      </li>
    );
  }

  return (
    <li className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 group hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          className="w-5 h-5 mt-0.5 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
        />
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
          <div className="text-base mb-2">
            <MarkedText
              text={todo.text}
              completed={todo.completed}
              markerColors={markerColors}
              linkPatterns={linkPatterns}
              availablePeople={availablePeople}
              availableProjects={availableProjects}
              availablePriorities={availablePriorities}
              dateTimeSettings={generalSettings.dateTime}
            />
          </div>

          {!isExpanded &&
            (todo.metadata.assignedPeople.length > 0 ||
              todo.metadata.projects.length > 0 ||
              todo.metadata.sourcePeople.length > 0 ||
              todo.metadata.mentionedPeople.length > 0 ||
              todo.metadata.priority ||
              todo.metadata.dueDate ||
              todo.metadata.duration) && (
              <div className="flex items-center justify-between gap-2">
                {/* Left group: Assigned, Source, Mentioned */}
                <div className="flex flex-wrap gap-1">
                  {todo.metadata.assignedPeople.map((person, idx) => {
                    const bgColor = getPersonColor(person);
                    const textColor = getTextColor(bgColor);
                    return (
                      <button
                        key={`assigned-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkerClick?.("assignedPeople", person);
                        }}
                        style={{ backgroundColor: bgColor, color: textColor }}
                        className="px-2 py-0.5 text-xs rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        @{person}
                      </button>
                    );
                  })}
                  {todo.metadata.sourcePeople.map((person, idx) => {
                    const bgColor = getPersonColor(person);
                    const textColor = getTextColor(bgColor);
                    return (
                      <button
                        key={`source-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkerClick?.("sourcePeople", person);
                        }}
                        style={{ backgroundColor: bgColor, color: textColor }}
                        className="px-2 py-0.5 text-xs rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        ${person}
                      </button>
                    );
                  })}
                  {todo.metadata.mentionedPeople.map((person, idx) => {
                    const bgColor = getPersonColor(person);
                    const textColor = getTextColor(bgColor);
                    return (
                      <button
                        key={`mentioned-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkerClick?.("mentionedPeople", person);
                        }}
                        style={{ backgroundColor: bgColor, color: textColor }}
                        className="px-2 py-0.5 text-xs rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        ^{person}
                      </button>
                    );
                  })}
                </div>

                {/* Center group: Projects, Priority */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {todo.metadata.projects.map((project, idx) => {
                    const bgColor = getProjectColor(project);
                    const textColor = getTextColor(bgColor);
                    return (
                      <button
                        key={`project-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkerClick?.("projects", project);
                        }}
                        style={{ backgroundColor: bgColor, color: textColor }}
                        className="px-2 py-0.5 text-xs rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        #{project}
                      </button>
                    );
                  })}
                  {todo.metadata.priority &&
                    (() => {
                      const bgColor = getPriorityColor(todo.metadata.priority);
                      const textColor = getTextColor(bgColor);
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkerClick?.("priorities", todo.metadata.priority!);
                          }}
                          style={{ backgroundColor: bgColor, color: textColor }}
                          className="px-2 py-0.5 text-xs rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          !!{todo.metadata.priority}
                        </button>
                      );
                    })()}
                </div>

                {/* Right group: Due date, Duration */}
                <div className="flex flex-wrap gap-1 justify-end">
                  {todo.metadata.dueDate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick?.("dueDates", todo.metadata.dueDate!);
                      }}
                      className="px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors cursor-pointer"
                    >
                      ~{todo.metadata.dueDate}
                    </button>
                  )}
                  {todo.metadata.duration && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick?.("durations", todo.metadata.duration!);
                      }}
                      className="px-2 py-0.5 text-xs rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors cursor-pointer"
                    >
                      *{todo.metadata.duration}
                    </button>
                  )}
                </div>
              </div>
            )}

          {/* Expanded Details */}
          {isExpanded && (
            <div
              className="mt-2 space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Created/Completed Info */}
              <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
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
                </div>
              </div>

              {/* Task Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Assigned People */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">👤 Assigned</h4>
                  <div className="flex flex-wrap gap-1">
                    {todo.metadata.assignedPeople.length > 0 ? (
                      todo.metadata.assignedPeople.map((person, idx) => {
                        const bgColor = getPersonColor(person);
                        const textColor = getTextColor(bgColor);
                        return (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkerClick?.("assignedPeople", person);
                            }}
                            style={{ backgroundColor: bgColor, color: textColor }}
                            className="px-2 py-0.5 text-xs rounded hover:opacity-80 transition-opacity"
                          >
                            @{person}
                          </button>
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
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkerClick?.("projects", project);
                            }}
                            style={{ backgroundColor: bgColor, color: textColor }}
                            className="px-2 py-0.5 text-xs rounded hover:opacity-80 transition-opacity"
                          >
                            #{project}
                          </button>
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
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkerClick?.("sourcePeople", person);
                            }}
                            style={{ backgroundColor: bgColor, color: textColor }}
                            className="px-2 py-0.5 text-xs rounded hover:opacity-80 transition-opacity"
                          >
                            ${person}
                          </button>
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
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkerClick?.("mentionedPeople", person);
                            }}
                            style={{ backgroundColor: bgColor, color: textColor }}
                            className="px-2 py-0.5 text-xs rounded hover:opacity-80 transition-opacity"
                          >
                            ^{person}
                          </button>
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkerClick?.("priorities", todo.metadata.priority!);
                          }}
                          style={{ backgroundColor: bgColor, color: textColor }}
                          className="px-2 py-0.5 text-xs rounded hover:opacity-80 transition-opacity"
                        >
                          !!{todo.metadata.priority}
                        </button>
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick?.("dueDates", todo.metadata.dueDate!);
                      }}
                      className="px-2 py-0.5 text-xs rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                    >
                      ~{todo.metadata.dueDate}
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">None</span>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">⏱️ Duration</h4>
                  {todo.metadata.duration ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick?.("durations", todo.metadata.duration!);
                      }}
                      className="px-2 py-0.5 text-xs rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors"
                    >
                      *{todo.metadata.duration}
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">None</span>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2">
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">💬 Comments</h4>
                <Comments
                  comments={todo.comments}
                  onAddComment={(content: string) => onAddComment?.(todo.id, content)}
                  onEditComment={(commentId: number, content: string) => onEditComment?.(todo.id, commentId, content)}
                  onDeleteComment={(commentId: number) => onDeleteComment?.(todo.id, commentId)}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {/* Edit button - only for active (not completed, not archived) todos */}
          {!todo.completed && !todo.archived && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors"
              aria-label="Edit todo"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {/* Archive button - only for completed but not archived todos */}
          {todo.completed && !todo.archived && onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(todo.id);
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
          )}

          {/* Unarchive button - only for archived todos */}
          {todo.archived && onUnarchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnarchive(todo.id);
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
          )}

          {/* Delete button - always available */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(todo.id);
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
    </li>
  );
}
