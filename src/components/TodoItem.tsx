"use client";

import { useState, useRef, useEffect } from "react";
import { Todo, TodoMetadata } from "@/types/todo";
import { MarkerColors, GeneralSettings, LinkPattern } from "@/types/settings";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/SmartInput";
import { MarkedText } from "./MarkedText";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string, plainText: string, metadata: TodoMetadata) => void;
  markerColors: MarkerColors;
  generalSettings: GeneralSettings;
  linkPatterns: LinkPattern[];
  onMarkerClick?: (
    type: "assignedPeople" | "sourcePeople" | "mentionedPeople" | "projects" | "priorities" | "dueDates" | "durations",
    value: string,
  ) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  markerColors,
  generalSettings,
  linkPatterns,
  onMarkerClick,
  isExpanded,
  onToggleExpand,
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
              <div className="flex flex-wrap gap-1">
                {todo.metadata.assignedPeople.map((person, idx) => (
                  <button
                    key={`assigned-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick?.("assignedPeople", person);
                    }}
                    className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                  >
                    @{person}
                  </button>
                ))}
                {todo.metadata.projects.map((project, idx) => (
                  <button
                    key={`project-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick?.("projects", project);
                    }}
                    className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                  >
                    #{project}
                  </button>
                ))}
                {todo.metadata.sourcePeople.map((person, idx) => (
                  <button
                    key={`source-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick?.("sourcePeople", person);
                    }}
                    className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors cursor-pointer"
                  >
                    ${person}
                  </button>
                ))}
                {todo.metadata.mentionedPeople.map((person, idx) => (
                  <button
                    key={`mentioned-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick?.("mentionedPeople", person);
                    }}
                    className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors cursor-pointer"
                  >
                    ^{person}
                  </button>
                ))}
                {todo.metadata.priority && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick?.("priorities", todo.metadata.priority!);
                    }}
                    className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                  >
                    !!{todo.metadata.priority}
                  </button>
                )}
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
            )}

          {/* Expanded Details */}
          {isExpanded && (
            <div
              className="mt-2 space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Task Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Assigned People */}
                {todo.metadata.assignedPeople.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">👤 Assigned</h4>
                    <div className="flex flex-wrap gap-1">
                      {todo.metadata.assignedPeople.map((person, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkerClick?.("assignedPeople", person);
                          }}
                          className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          @{person}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {todo.metadata.projects.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">📁 Projects</h4>
                    <div className="flex flex-wrap gap-1">
                      {todo.metadata.projects.map((project, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkerClick?.("projects", project);
                          }}
                          className="px-2 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          #{project}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source People */}
                {todo.metadata.sourcePeople.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">📤 Source</h4>
                    <div className="flex flex-wrap gap-1">
                      {todo.metadata.sourcePeople.map((person, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkerClick?.("sourcePeople", person);
                          }}
                          className="px-2 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          ${person}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mentioned People */}
                {todo.metadata.mentionedPeople.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">💬 Mentioned</h4>
                    <div className="flex flex-wrap gap-1">
                      {todo.metadata.mentionedPeople.map((person, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkerClick?.("mentionedPeople", person);
                          }}
                          className="px-2 py-0.5 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                        >
                          ^{person}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority */}
                {todo.metadata.priority && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">🔥 Priority</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick?.("priorities", todo.metadata.priority!);
                      }}
                      className="px-2 py-0.5 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      !!{todo.metadata.priority}
                    </button>
                  </div>
                )}

                {/* Due Date */}
                {todo.metadata.dueDate && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">📅 Due</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick?.("dueDates", todo.metadata.dueDate!);
                      }}
                      className="px-2 py-0.5 text-xs rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                    >
                      ~{todo.metadata.dueDate}
                    </button>
                  </div>
                )}

                {/* Duration */}
                {todo.metadata.duration && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">⏱️ Duration</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick?.("durations", todo.metadata.duration!);
                      }}
                      className="px-2 py-0.5 text-xs rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors"
                    >
                      *{todo.metadata.duration}
                    </button>
                  </div>
                )}
              </div>

              {/* Metadata Info */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div>
                    <span className="font-medium">Created:</span> {new Date(todo.createdAt).toLocaleString()}
                  </div>
                  {todo.completedAt && (
                    <div>
                      <span className="font-medium">Completed:</span> {new Date(todo.completedAt).toLocaleString()}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Status:</span> {todo.completed ? "✓ Completed" : "○ Active"}
                  </div>
                  <div>
                    <span className="font-medium">ID:</span> {todo.id}
                  </div>
                </div>
              </div>

              {/* Full Text */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2">
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">📝 Full Text</h4>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 p-2 rounded">
                  {todo.text}
                </div>
              </div>

              {/* Plain Text (without markers) */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2">
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">📄 Plain Text</h4>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 p-2 rounded">
                  {todo.plainText}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="px-3 py-1 text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors"
            aria-label="Edit todo"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(todo.id);
            }}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
            aria-label="Delete todo"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
