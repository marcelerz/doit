"use client";

import { useState, useRef, useEffect } from "react";
import { TodoMetadata } from "@/types/todo";
import { MarkerColors, Settings, LinkPattern, Priority } from "@/types/settings";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import { MarkedText } from "@/components/shared/MarkedText";
import { Comments } from "@/components/shared/Comments";
import { formatDateForDisplay, normalizeDateValue } from "@/utils/dateUtils";
import { findPersonColor, findProjectColor, findPriorityColor, getTextColor } from "@/utils/colors";
import { DELAY_OPTIONS } from "@/utils/delayOptions";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";

interface TodoItemProps {
  todo: TodoModel;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
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
  onMarkerClick?: (
    type: "assignedPeople" | "sourcePeople" | "mentionedPeople" | "projects" | "priorities" | "dueDates" | "durations",
    value: string,
  ) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddComment?: (todoId: string, content: string) => void;
  onEditComment?: (todoId: string, commentId: number, content: string) => void;
  onDeleteComment?: (todoId: string, commentId: number) => void;
  // Bulk selection props
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (id: string, selected: boolean) => void;
}

export function TodoItem({
  todo,
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
  onMarkerClick,
  isExpanded,
  onToggleExpand,
  onAddComment,
  onEditComment,
  onDeleteComment,
  isSelectionMode = false,
  isSelected = false,
  onSelectionChange,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTokens, setCurrentTokens] = useState<TokenMatch[]>([]);
  const [currentFullText, setCurrentFullText] = useState("");
  const [currentPlainText, setCurrentPlainText] = useState("");
  const [showDelayedDropdown, setShowDelayedDropdown] = useState(false);
  const smartInputRef = useRef<SmartEditableInputHandle>(null);

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeAction, setSwipeAction] = useState<"complete" | "archive" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe thresholds
  const SWIPE_THRESHOLD = 80; // Minimum distance to trigger action
  const MAX_SWIPE = 120; // Maximum visual offset

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing || isSelectionMode) return;
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
    setSwipeAction(null);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isEditing || isSelectionMode) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStart.x;
    const diffY = currentY - touchStart.y;

    // If vertical scroll is larger, ignore horizontal swipe
    if (Math.abs(diffY) > Math.abs(diffX)) {
      setSwipeOffset(0);
      return;
    }

    // Prevent default to avoid scroll
    if (Math.abs(diffX) > 10) {
      e.preventDefault();
    }

    // Calculate offset with resistance
    let offset = diffX;
    if (Math.abs(offset) > MAX_SWIPE) {
      const extra = Math.abs(offset) - MAX_SWIPE;
      offset = (offset > 0 ? 1 : -1) * (MAX_SWIPE + extra * 0.3);
    }

    setSwipeOffset(offset);

    // Determine action based on swipe direction
    if (offset > SWIPE_THRESHOLD && todo.isActive) {
      setSwipeAction("complete");
    } else if (offset < -SWIPE_THRESHOLD && (todo.isCompleted || todo.isArchived)) {
      setSwipeAction("archive");
    } else if (offset < -SWIPE_THRESHOLD && todo.isActive) {
      // For active todos, left swipe could be archive (after complete)
      setSwipeAction(null);
    } else {
      setSwipeAction(null);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!touchStart) return;

    // Execute action if threshold was met
    if (swipeAction === "complete" && todo.isActive) {
      onToggle(todo.id);
    } else if (swipeAction === "archive" && todo.isCompleted && onArchive) {
      onArchive(todo.id);
    }

    // Reset state with animation
    setSwipeOffset(0);
    setTouchStart(null);
    setSwipeAction(null);
  };

  // Helper functions to get entity colors using centralized utilities
  const getPersonColorForName = (name: string): string => {
    return findPersonColor(name, availablePeople, markerColors.assigned);
  };

  const getProjectColorForName = (name: string): string => {
    return findProjectColor(name, availableProjects, markerColors.project);
  };

  const getPriorityColorForName = (name: string): string => {
    return findPriorityColor(name, availablePriorities, markerColors.priority);
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

    // Start with existing metadata as the source of truth (additive approach - never remove, only add from tokens)
    const metadata: TodoMetadata = {
      assignedPeople: [...todo.metadata.assignedPeople],
      sourcePeople: [...todo.metadata.sourcePeople],
      mentionedPeople: [...todo.metadata.mentionedPeople],
      projects: [...todo.metadata.projects],
      dependencies: [...todo.metadata.dependencies],
      tags: [...todo.metadata.tags],
      priority: todo.metadata.priority,
      dueDate: todo.metadata.dueDate,
      duration: todo.metadata.duration,
      recurring: todo.metadata.recurring,
    };

    // Parse tokens from the edited text and ADD/UPDATE items (only update when found, never clear)
    currentTokens.forEach((token) => {
      switch (token.type) {
        case "assigned":
          if (!metadata.assignedPeople.includes(token.value)) {
            metadata.assignedPeople.push(token.value);
          }
          break;
        case "source":
          if (!metadata.sourcePeople.includes(token.value)) {
            metadata.sourcePeople.push(token.value);
          }
          break;
        case "mentioned":
          if (!metadata.mentionedPeople.includes(token.value)) {
            metadata.mentionedPeople.push(token.value);
          }
          break;
        case "project":
          if (!metadata.projects.includes(token.value)) {
            metadata.projects.push(token.value);
          }
          break;
        case "priority":
          // Priority is singular, so update it when detected (but don't clear if not found)
          if (token.value) {
            metadata.priority = token.value;
          }
          break;
        case "dueDate":
          // Only update if a date was detected with a valid value (never clear existing value)
          if (token.value) {
            metadata.dueDate = token.value;
          }
          break;
        case "duration":
          // Only update if a duration was detected with a valid value (never clear existing value)
          if (token.value) {
            metadata.duration = token.value;
          }
          break;
        case "recurring":
          // Only update if a recurring pattern was detected with a valid value (never clear existing value)
          if (token.value) {
            metadata.recurring = token.value;
          }
          break;
        // dependency tokens are not generated by SmartInput (only set via detail overlay)
        case "tag":
          if (!metadata.tags.includes(token.value)) {
            metadata.tags.push(token.value);
          }
          break;
      }
    });

    // Apply auto-assignment defaults only for empty fields (never overwrite existing values)
    if (settings.autoAssign.enabled) {
      const autoAssign = settings.autoAssign;

      if (metadata.assignedPeople.length === 0 && autoAssign.assignedPerson) {
        metadata.assignedPeople.push(autoAssign.assignedPerson);
      }

      if (metadata.sourcePeople.length === 0 && autoAssign.sourcePerson) {
        metadata.sourcePeople.push(autoAssign.sourcePerson);
      }

      if (metadata.projects.length === 0 && autoAssign.project) {
        metadata.projects.push(autoAssign.project);
      }

      if (!metadata.priority && autoAssign.priority) {
        metadata.priority = autoAssign.priority;
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
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
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
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-lg">
      {/* Swipe action backgrounds (mobile only) */}
      {swipeOffset !== 0 && (
        <>
          {/* Right swipe - Complete (green) */}
          <div
            className={`absolute inset-y-0 left-0 flex items-center justify-start pl-4 transition-colors ${
              swipeAction === "complete" ? "bg-green-500" : "bg-green-400/50"
            }`}
            style={{ width: Math.max(0, swipeOffset) }}
          >
            {swipeOffset > 30 && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          {/* Left swipe - Archive (amber) */}
          <div
            className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-colors ${
              swipeAction === "archive" ? "bg-amber-500" : "bg-amber-400/50"
            }`}
            style={{ width: Math.max(0, -swipeOffset) }}
          >
            {swipeOffset < -30 && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            )}
          </div>
        </>
      )}

      {/* Main content */}
      <div
        className={`bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 group hover:shadow-md transition-all ${
          isSelected ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-900" : ""
        }`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: touchStart ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-start gap-3">
          {/* Selection checkbox shown in selection mode */}
          {isSelectionMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelectionChange?.(todo.id, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 mt-0.5 rounded border-blue-400 dark:border-blue-500 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
              aria-label={`Select task: ${todo.plainText}`}
            />
          )}
          {/* Completion checkbox shown when not in selection mode */}
          {!isSelectionMode && (
            <input
              type="checkbox"
              checked={todo.isCompleted || todo.isArchived}
              onChange={() => onToggle(todo.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 mt-0.5 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
            <div className="text-base">
              <MarkedText
                text={todo.text}
                completed={todo.isCompleted || todo.isArchived}
                markerColors={markerColors}
                linkPatterns={linkPatterns}
                availablePeople={availablePeople}
                availableProjects={availableProjects}
                availablePriorities={availablePriorities}
              />
            </div>

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
                        <span className="font-medium">Archived:</span> {new Date(todo.archivedAt).toLocaleString()}
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
                          const bgColor = getPersonColorForName(person);
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
                          const bgColor = getProjectColorForName(project);
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
                              %{project}
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
                          const bgColor = getPersonColorForName(person);
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
                          const bgColor = getPersonColorForName(person);
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
                              {person}
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
                        const bgColor = getPriorityColorForName(todo.metadata.priority);
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
                        title={todo.metadata.dueDate}
                      >
                        {formatDateForDisplay(todo.metadata.dueDate)}
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
                        className="px-2 py-0.5 text-xs rounded transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: markerColors.duration,
                          color: "#333",
                        }}
                      >
                        {todo.metadata.duration}
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
            {/* Delayed button - only for active todos */}
            {todo.isActive && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDelayedDropdown(!showDelayedDropdown);
                  }}
                  className="p-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-md transition-colors"
                  aria-label="Delay todo"
                  title="Delay"
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
                      {DELAY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            const normalizedDate = normalizeDateValue(
                              option.value,
                              settings.dateTime,
                              settings.workHours,
                            );
                            if (normalizedDate) {
                              const updatedMetadata = {
                                ...todo.metadata,
                                dueDate: normalizedDate,
                              };
                              onEdit(todo.id, todo.text, todo.plainText, updatedMetadata);
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

            {/* Edit button - only for active (not completed, not archived) todos */}
            {todo.isActive && (
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

            {/* Archive button - for active and completed todos */}
            {(todo.isActive || todo.isCompleted) && onArchive && (
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
            {todo.state === "archived" && onUnarchive && (
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
      </div>
    </div>
  );
}
