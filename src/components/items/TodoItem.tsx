"use client";

import { useState, useRef, useEffect } from "react";
import { TodoMetadata, TodoId } from "@/types/todo";
import { Settings } from "@/types/settings";
import { MarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import { Priority } from "@/types/priority";
import { Sprint } from "@/types/sprint";
import { CommentId } from "@/types/types";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import { MarkedText } from "@/components/shared/MarkedText";
import { Comments } from "@/components/shared/Comments";
import { formatDateForDisplay, normalizeDateValue } from "@/utils/dateUtils";
import { findPersonColor, findProjectColor, findPriorityColor, getTextColor } from "@/utils/colors";
import { DELAY_OPTIONS } from "@/utils/delayOptions";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import {
  CheckIcon,
  ArchiveIcon,
  TrashIcon,
  ClockIcon,
  LightningIcon,
  UndoIcon,
  DragHandleIcon,
  RecordingDotIcon,
} from "@/components/shared/Icons";

interface TodoItemProps {
  todo: TodoModel;
  onToggle: (id: TodoId) => void;
  onDelete: (id: TodoId) => void;
  onEdit: (id: TodoId, text: string, plainText: string, metadata: TodoMetadata) => void;
  onArchive?: (id: TodoId) => void;
  onUnarchive?: (id: TodoId) => void;
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
  onAddComment?: (todoId: TodoId, content: string) => void;
  onEditComment?: (todoId: TodoId, commentId: CommentId, content: string) => void;
  onDeleteComment?: (todoId: TodoId, commentId: CommentId) => void;
  // Bulk selection props
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (id: TodoId, selected: boolean) => void;
  // Drag and drop props
  isDraggable?: boolean;
  isDraggedOver?: boolean;
  onDragStart?: (e: React.DragEvent, id: TodoId) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent, id: TodoId) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: TodoId) => void;
  // Sprint data (for displaying sprint name in expanded view)
  sprints?: Sprint[];
  // Next planned sprint for quick assignment
  nextPlannedSprint?: Sprint;
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
  isDraggable = false,
  isDraggedOver = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  sprints = [],
  nextPlannedSprint,
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
    if (currentPlainText.trim() === "") return;

    // Filter to only use EXPLICIT tokens (not auto-detected) for metadata extraction
    // Auto-detection should only apply on creation, not during editing
    // This allows users to have text like "urgent" or "2h" without overriding metadata
    const explicitTokens = currentTokens.filter((t) => !t.isAutoDetected);

    // Start with existing metadata as the source of truth (additive approach - never remove, only add from tokens)
    const metadata: TodoMetadata = {
      assignedPeople: [...(todo.metadata.assignedPeople ?? [])],
      sourcePeople: [...(todo.metadata.sourcePeople ?? [])],
      mentionedPeople: [...(todo.metadata.mentionedPeople ?? [])],
      projects: [...(todo.metadata.projects ?? [])],
      dependencies: [...(todo.metadata.dependencies ?? [])],
      tags: [...(todo.metadata.tags ?? [])],
      priority: todo.metadata.priority,
      dueDate: todo.metadata.dueDate,
      duration: todo.metadata.duration,
      recurring: todo.metadata.recurring,
    };

    // Parse EXPLICIT tokens from the edited text and ADD/UPDATE items (only update when found, never clear)
    // Auto-detected tokens are ignored - only explicit markers like @, $, %, !!, # affect metadata during editing
    explicitTokens.forEach((token) => {
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
          if (!metadata.tags?.includes(token.value)) {
            metadata.tags?.push(token.value);
          }
          break;
      }
    });

    // NOTE: Auto-assignment defaults are intentionally NOT applied during editing
    // Auto-assign should only happen once during task creation, not on every edit
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
              const event = new Event("submit", { bubbles: true, cancelable: true }) as unknown as React.FormEvent;
              handleSubmit(event);
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
    <div ref={containerRef} className={`relative rounded-lg ${showDelayedDropdown ? "z-30" : ""}`} data-testid="todo-item">
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
            {swipeOffset > 30 && <CheckIcon className="w-6 h-6 text-white" />}
          </div>
          {/* Left swipe - Archive (amber) */}
          <div
            className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-colors ${
              swipeAction === "archive" ? "bg-amber-500" : "bg-amber-400/50"
            }`}
            style={{ width: Math.max(0, -swipeOffset) }}
          >
            {swipeOffset < -30 && <ArchiveIcon className="w-6 h-6 text-white" />}
          </div>
        </>
      )}

      {/* Main content */}
      <div
        className={`bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 group hover:shadow-md transition-shadow duration-200 ${
          isSelected ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-900" : ""
        } ${isDraggedOver ? "border-blue-500 border-2 bg-blue-50 dark:bg-blue-900/20" : ""} ${
          isDraggable ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: touchStart ? "none" : "transform 0.2s ease-out",
        }}
        draggable={isDraggable && !isEditing}
        onDragStart={(e) => isDraggable && onDragStart?.(e, todo.id)}
        onDragEnd={(e) => isDraggable && onDragEnd?.(e)}
        onDragOver={(e) => {
          if (isDraggable) {
            e.preventDefault();
            onDragOver?.(e, todo.id);
          }
        }}
        onDragLeave={(e) => isDraggable && onDragLeave?.(e)}
        onDrop={(e) => {
          if (isDraggable) {
            e.preventDefault();
            onDrop?.(e, todo.id);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-start gap-3">
          {/* Drag handle shown when draggable */}
          {isDraggable && !isSelectionMode && (
            <div className="flex-shrink-0 text-zinc-400 dark:text-zinc-500 cursor-grab active:cursor-grabbing mt-0.5">
              <DragHandleIcon className="w-5 h-5" />
            </div>
          )}
          {/* Selection checkbox shown in selection mode */}
          {isSelectionMode && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelectionChange?.(todo.id, !isSelected);
              }}
              className={`w-5 h-5 mt-0.5 rounded-full border-2 border-black dark:border-white cursor-pointer flex-shrink-0 flex items-center justify-center transition-colors ${
                isSelected ? "bg-blue-600 border-blue-600 dark:border-blue-600" : "bg-white dark:bg-zinc-800"
              }`}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`Select task: ${todo.plainText}`}
            >
              {isSelected && <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
          )}
          {/* Completion checkbox shown when not in selection mode */}
          {!isSelectionMode &&
            (() => {
              const priorityColor = todo.metadata.priority
                ? findPriorityColor(todo.metadata.priority, availablePriorities, markerColors.priority)
                : "#a1a1aa"; // zinc-400 fallback
              const isChecked = todo.isCompleted || todo.isArchived;
              return (
                <div
                  data-testid="todo-checkbox"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(todo.id);
                  }}
                  className="w-5 h-5 mt-0.5 rounded cursor-pointer flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    borderWidth: "2px",
                    borderStyle: "solid",
                    borderColor: priorityColor,
                    backgroundColor: isChecked ? priorityColor : undefined,
                    boxShadow: isChecked ? undefined : `0 0 6px 1px ${priorityColor}40, 0 0 2px 0px ${priorityColor}`,
                  }}
                  role="checkbox"
                  aria-checked={isChecked}
                >
                  {isChecked && <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              );
            })()}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
            <div className="text-base" data-testid="todo-text">
              <MarkedText
                text={todo.text}
                completed={todo.isCompleted || todo.isArchived}
                markerColors={markerColors}
                linkPatterns={linkPatterns}
                availablePeople={availablePeople}
                availableProjects={availableProjects}
                availablePriorities={availablePriorities}
                dateTimeSettings={settings.dateTime}
                workHoursSettings={settings.workHours}
              />
            </div>

            {/* Compact metadata row (shown when not expanded) */}
            {!isExpanded && (
              <div className="mt-1.5 grid grid-cols-[1fr_auto_auto] sm:grid-cols-[minmax(80px,1fr)_1fr_100px_80px] gap-x-2 gap-y-1 items-center text-[10px]">
                {/* Assigned + Project - column 1 (combined on mobile, separate on desktop) */}
                <div className="flex items-center gap-1 overflow-hidden">
                  {todo.metadata.assignedPeople.length > 0 ? (
                    <span
                      className="px-1.5 py-0.5 rounded truncate"
                      style={{
                        backgroundColor: getPersonColorForName(todo.metadata.assignedPeople[0]),
                        color: getTextColor(getPersonColorForName(todo.metadata.assignedPeople[0])),
                      }}
                      title={todo.metadata.assignedPeople.join(", ")}
                    >
                      @{todo.metadata.assignedPeople[0]}
                      {todo.metadata.assignedPeople.length > 1 && ` +${todo.metadata.assignedPeople.length - 1}`}
                    </span>
                  ) : (
                    <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">—</span>
                  )}
                  {/* Project shown inline on mobile */}
                  <span className="sm:hidden">
                    {todo.metadata.projects.length > 0 && (
                      <span
                        className="px-1.5 py-0.5 rounded truncate"
                        style={{
                          backgroundColor: getProjectColorForName(todo.metadata.projects[0]),
                          color: getTextColor(getProjectColorForName(todo.metadata.projects[0])),
                        }}
                        title={todo.metadata.projects.join(", ")}
                      >
                        %{todo.metadata.projects[0]}
                      </span>
                    )}
                  </span>
                </div>

                {/* Project + Sprint - column 2 (desktop only, centered) */}
                <div className="hidden sm:flex items-center justify-center gap-1 overflow-hidden">
                  {todo.metadata.projects.length > 0 ? (
                    <span
                      className="px-1.5 py-0.5 rounded truncate"
                      style={{
                        backgroundColor: getProjectColorForName(todo.metadata.projects[0]),
                        color: getTextColor(getProjectColorForName(todo.metadata.projects[0])),
                      }}
                      title={todo.metadata.projects.join(", ")}
                    >
                      %{todo.metadata.projects[0]}
                      {todo.metadata.projects.length > 1 && ` +${todo.metadata.projects.length - 1}`}
                    </span>
                  ) : (
                    <span className="text-zinc-300 dark:text-zinc-600">—</span>
                  )}
                  {todo.metadata.sprint &&
                    (() => {
                      const sprint = sprints.find((s) => s.id === todo.metadata.sprint);
                      return sprint ? (
                        <span
                          className="px-1.5 py-0.5 rounded truncate bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 whitespace-nowrap"
                          title={sprint.name}
                        >
                          🏃 {sprint.name}
                        </span>
                      ) : null;
                    })()}
                </div>

                {/* Due date + Duration - column 3 (fixed width for consistency) */}
                <div className="flex items-center gap-1 justify-end sm:justify-center">
                  {todo.metadata.dueDate ? (
                    <span
                      className={`px-1.5 py-0.5 rounded whitespace-nowrap ${
                        todo.isOverdue
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          : todo.isDueToday
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                          : ""
                      }`}
                      style={
                        !todo.isOverdue && !todo.isDueToday
                          ? {
                              backgroundColor: markerColors.dueDate,
                              color: getTextColor(markerColors.dueDate),
                            }
                          : undefined
                      }
                      title={todo.metadata.dueDate}
                    >
                      {todo.dueDateDisplay}
                    </span>
                  ) : (
                    <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">—</span>
                  )}
                  {todo.metadata.duration && (
                    <span
                      className="px-1.5 py-0.5 rounded whitespace-nowrap"
                      style={{
                        backgroundColor: markerColors.duration,
                        color: getTextColor(markerColors.duration),
                      }}
                    >
                      {todo.durationDisplay}
                    </span>
                  )}
                </div>

                {/* Priority - column 4 (fixed width for consistency) */}
                <div className="flex items-center justify-end">
                  {todo.metadata.priority ? (
                    <span
                      className="px-1.5 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: getPriorityColorForName(todo.metadata.priority),
                        color: getTextColor(getPriorityColorForName(todo.metadata.priority)),
                      }}
                    >
                      {todo.metadata.priority}
                    </span>
                  ) : (
                    <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">—</span>
                  )}
                </div>
              </div>
            )}

            {/* Subtask progress indicator and time tracking */}
            {(todo.hasSubtasks || todo.hasTimeTracking) && (
              <div className="mt-1 flex items-center gap-3 flex-wrap">
                {/* Subtask progress */}
                {todo.hasSubtasks && (
                  <div className="flex items-center gap-2">
                    <div className="w-[80px] h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          todo.allSubtasksCompleted ? "bg-green-500 dark:bg-green-600" : "bg-blue-500 dark:bg-blue-600"
                        }`}
                        style={{ width: `${todo.subtaskProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {todo.completedSubtaskCount}/{todo.subtaskCount}
                    </span>
                  </div>
                )}

                {/* Time tracking indicator */}
                {todo.hasTimeTracking && (
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs flex items-center gap-1 px-1.5 py-0.5 rounded ${
                        todo.isTrackingTime
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {todo.isTrackingTime ? (
                        <RecordingDotIcon className="w-3 h-3 animate-pulse" />
                      ) : (
                        <ClockIcon className="w-3 h-3" />
                      )}
                      {todo.totalTrackedTimeDisplay}
                    </span>
                  </div>
                )}
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
                        className={`px-2 py-0.5 text-xs rounded transition-colors hover:opacity-80 ${
                          todo.isOverdue
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            : todo.isDueToday
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            : ""
                        }`}
                        style={
                          !todo.isOverdue && !todo.isDueToday
                            ? {
                                backgroundColor: markerColors.dueDate,
                                color: getTextColor(markerColors.dueDate),
                              }
                            : undefined
                        }
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
                          color: getTextColor(markerColors.duration),
                        }}
                      >
                        {todo.metadata.duration}
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">None</span>
                    )}
                  </div>

                  {/* Sprint */}
                  {sprints.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">🏃 Sprint</h4>
                      {todo.metadata.sprint ? (
                        (() => {
                          const sprint = sprints.find((s) => s.id === todo.metadata.sprint);
                          return sprint ? (
                            <span className="px-2 py-0.5 text-xs rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                              {sprint.name}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">Unknown</span>
                          );
                        })()
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">None</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2">
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">💬 Comments</h4>
                  <Comments
                    comments={todo.comments}
                    onAddComment={(content: string) => onAddComment?.(todo.id, content)}
                    onEditComment={(commentId: CommentId, content: string) =>
                      onEditComment?.(todo.id, commentId, content)
                    }
                    onDeleteComment={(commentId: CommentId) => onDeleteComment?.(todo.id, commentId)}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {/* Delayed button - only for active todos */}
            {todo.isActive && (
              <div className={`relative ${showDelayedDropdown ? "z-30" : ""}`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDelayedDropdown(!showDelayedDropdown);
                  }}
                  className="p-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-md transition-colors"
                  aria-label="Delay todo"
                  title="Delay"
                >
                  <ClockIcon className="w-4 h-4" />
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

            {/* Add to Sprint button - for active todos without a sprint and when there's a next planned sprint */}
            {todo.isActive && !todo.metadata.sprint && nextPlannedSprint && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const updatedMetadata = {
                    ...todo.metadata,
                    sprint: nextPlannedSprint.id,
                  };
                  onEdit(todo.id, todo.text, todo.plainText, updatedMetadata);
                }}
                className="p-2 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-400 rounded-md transition-colors"
                aria-label={`Add to ${nextPlannedSprint.name}`}
                title={`Add to ${nextPlannedSprint.name}`}
              >
                <LightningIcon className="w-4 h-4" />
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
                <ArchiveIcon className="w-4 h-4" />
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
                <UndoIcon className="w-4 h-4" />
              </button>
            )}

            {/* Delete button - always available */}
            <button
              data-testid="todo-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(todo.id);
              }}
              className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
              aria-label="Delete todo"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
