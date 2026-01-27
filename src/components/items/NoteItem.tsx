"use client";

import { useRef, useState } from "react";
import { NoteModel } from "@/models/NoteModel";
import { NoteId } from "@/types/note";
import { TodoModel } from "@/models/TodoModel";
import { MarkerColors, defaultMarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { getTextColor } from "@/utils/colors";
import { MarkedText } from "@/components/shared/MarkedText";
import {
  ArchiveIcon,
  TrashIcon,
  UndoIcon,
  DocumentIcon,
  CheckCircleIcon,
  DragDotsIcon,
  PinIcon,
} from "@/components/shared/Icons";

interface NoteItemProps {
  note: NoteModel;
  onClick: () => void;
  onDelete: (id: NoteId) => void;
  onArchive?: (id: NoteId) => void;
  onUnarchive?: (id: NoteId) => void;
  onTogglePinned?: (id: NoteId) => void;
  onConvertToTodo?: (id: NoteId) => void;
  // Selection mode props
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (id: NoteId, selected: boolean) => void;
  // Drag and drop props
  isDraggable?: boolean;
  isDraggedOver?: boolean;
  onDragStart?: (e: React.DragEvent, id: NoteId) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent, id: NoteId) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, id: NoteId) => void;
  // Display name maps
  peopleMap?: Map<string, string>;
  projectsMap?: Map<string, string>;
  // Marker colors and highlighting
  markerColors?: MarkerColors;
  linkPatterns?: LinkPattern[];
  availablePeople?: PersonModel[];
  availableProjects?: ProjectModel[];
  // Todos for action item progress
  todos?: TodoModel[];
}

export function NoteItem({
  note,
  onClick,
  onDelete,
  onArchive,
  onUnarchive,
  onTogglePinned,
  onConvertToTodo,
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
  peopleMap = new Map(),
  projectsMap = new Map(),
  markerColors = defaultMarkerColors,
  linkPatterns = [],
  availablePeople = [],
  availableProjects = [],
  todos = [],
}: NoteItemProps) {
  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeAction, setSwipeAction] = useState<"pin" | "archive" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe thresholds
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSelectionMode || isDraggable) return;
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
    setSwipeAction(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isSelectionMode || isDraggable) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStart.x;
    const diffY = currentY - touchStart.y;

    // If vertical scroll is larger, ignore horizontal swipe
    if (Math.abs(diffY) > Math.abs(diffX)) {
      setSwipeOffset(0);
      return;
    }

    // Clamp the offset
    const clampedOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diffX));
    setSwipeOffset(clampedOffset);

    // Determine action based on direction and threshold
    if (clampedOffset > SWIPE_THRESHOLD) {
      setSwipeAction("pin");
    } else if (clampedOffset < -SWIPE_THRESHOLD) {
      setSwipeAction("archive");
    } else {
      setSwipeAction(null);
    }
  };

  const handleTouchEnd = () => {
    if (swipeAction === "pin" && onTogglePinned) {
      onTogglePinned(note.id);
    } else if (swipeAction === "archive" && onArchive && note.isActive) {
      onArchive(note.id);
    }

    setTouchStart(null);
    setSwipeOffset(0);
    setSwipeAction(null);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onSelectionChange) {
      e.stopPropagation();
      onSelectionChange(note.id, !isSelected);
    } else {
      onClick();
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onSelectionChange) {
      onSelectionChange(note.id, e.target.checked);
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, note.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (onDragOver) {
      onDragOver(e, note.id);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (onDrop) {
      onDrop(e, note.id);
    }
  };

  // Get content preview (strip HTML, truncate)
  const contentPreview = note.getContentPreview(100);

  // Get display names for metadata
  const firstAssigned = note.assignedPeople[0];
  const firstAssignedName = firstAssigned ? peopleMap.get(firstAssigned) || firstAssigned : null;
  const firstProject = note.projects[0];
  const firstProjectName = firstProject ? projectsMap.get(firstProject) || firstProject : null;

  // Calculate action items as todos progress
  const createdActionItems = note.createdActionItems;
  const totalCreatedTodos = createdActionItems.length;
  const completedTodos = createdActionItems.filter((item) => {
    const todo = todos.find((t) => t.id === item.todoId);
    return todo?.isCompleted;
  }).length;
  const hasCreatedTodos = totalCreatedTodos > 0;
  const progressPercent = totalCreatedTodos > 0 ? (completedTodos / totalCreatedTodos) * 100 : 0;

  return (
    <div
      className={`relative overflow-hidden ${isDraggedOver ? "ring-2 ring-purple-500" : ""}`}
      ref={containerRef}
      data-testid="note-item"
    >
      {/* Swipe action indicators */}
      <div
        className={`absolute inset-y-0 left-0 w-20 flex items-center justify-center transition-opacity ${
          swipeAction === "pin" ? "opacity-100" : "opacity-0"
        } ${note.isPinned ? "bg-amber-100 dark:bg-amber-900/30" : "bg-amber-500"}`}
      >
        <PinIcon className="w-6 h-6 text-white" filled={!note.isPinned} />
      </div>
      <div
        className={`absolute inset-y-0 right-0 w-20 flex items-center justify-center transition-opacity ${
          swipeAction === "archive" ? "opacity-100 bg-amber-500" : "opacity-0 bg-amber-500"
        }`}
      >
        <ArchiveIcon className="w-6 h-6 text-white" />
      </div>

      {/* Main content */}
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={onDragLeave}
        onDrop={handleDrop}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: touchStart ? "none" : "transform 0.3s ease-out",
        }}
        className={`group bg-white dark:bg-zinc-900 rounded-lg shadow-sm border p-4 hover:shadow-md transition-all cursor-pointer ${
          isSelected
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-zinc-200 dark:border-zinc-800"
        } ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <div className="flex items-start gap-3">
          {/* Selection checkbox or drag handle */}
          {isSelectionMode ? (
            <div className="flex items-center justify-center flex-shrink-0 mt-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
              />
            </div>
          ) : isDraggable ? (
            <div className="flex items-center justify-center flex-shrink-0 mt-2 text-zinc-400 dark:text-zinc-500">
              <DragDotsIcon className="w-5 h-5" />
            </div>
          ) : (
            /* Icon */
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <DocumentIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 mb-1">
              {note.isPinned && (
                <PinIcon className="w-4 h-4 text-amber-500 flex-shrink-0" filled />
              )}
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {note.text ? (
                  <MarkedText
                    text={note.text}
                    markerColors={markerColors}
                    linkPatterns={linkPatterns}
                    availablePeople={availablePeople}
                    availableProjects={availableProjects}
                    availablePriorities={[]}
                  />
                ) : (
                  "Untitled Note"
                )}
              </h3>
              {note.isArchived && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 flex-shrink-0">
                  Archived
                </span>
              )}
            </div>

            {/* Content preview */}
            {contentPreview && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2">
                {contentPreview}
              </p>
            )}

            {/* Metadata row - Rich display with colors */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* First assigned person with color */}
              {firstAssignedName && (
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: markerColors.assigned,
                    color: getTextColor(markerColors.assigned),
                  }}
                >
                  @{firstAssignedName}
                  {note.assignedPeople.length > 1 && (
                    <span className="ml-1 opacity-75">+{note.assignedPeople.length - 1}</span>
                  )}
                </span>
              )}

              {/* First project with color */}
              {firstProjectName && (
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: markerColors.project,
                    color: getTextColor(markerColors.project),
                  }}
                >
                  %{firstProjectName}
                  {note.projects.length > 1 && (
                    <span className="ml-1 opacity-75">+{note.projects.length - 1}</span>
                  )}
                </span>
              )}

              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: markerColors.tag,
                        color: getTextColor(markerColors.tag),
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">
                      +{note.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Pending action items indicator */}
              {note.pendingActionItemCount > 0 && (
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  {note.pendingActionItemCount} pending
                </span>
              )}

              {/* Action Items as Todos progress bar */}
              {hasCreatedTodos && (
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        completedTodos === totalCreatedTodos
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className={`text-xs ${
                    completedTodos === totalCreatedTodos
                      ? "text-green-600 dark:text-green-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}>
                    {completedTodos}/{totalCreatedTodos}
                  </span>
                </div>
              )}

              {/* Comments indicator */}
              {note.hasComments && (
                <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                  💬 {note.commentCount}
                </span>
              )}

              {/* Updated timestamp */}
              <span className="ml-auto text-zinc-400 dark:text-zinc-500">
                {note.ageDisplay}
              </span>
            </div>
          </div>

          {/* Actions */}
          {!isSelectionMode && !isDraggable && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {/* Pin button */}
              {onTogglePinned && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePinned(note.id);
                  }}
                  className={`p-2 rounded-md transition-colors ${
                    note.isPinned
                      ? "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400"
                      : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                  aria-label={note.isPinned ? "Unpin note" : "Pin note"}
                  title={note.isPinned ? "Unpin" : "Pin"}
                >
                  <PinIcon className="w-4 h-4" filled={note.isPinned} />
                </button>
              )}

              {/* Convert to todo button */}
              {onConvertToTodo && note.isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onConvertToTodo(note.id);
                  }}
                  className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-md transition-colors"
                  aria-label="Convert to todo"
                  title="Convert to Todo"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                </button>
              )}

              {/* Archive button */}
              {note.isActive && onArchive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(note.id);
                  }}
                  className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-md transition-colors"
                  aria-label="Archive note"
                  title="Archive"
                >
                  <ArchiveIcon className="w-4 h-4" />
                </button>
              )}

              {/* Unarchive button */}
              {note.isArchived && onUnarchive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnarchive(note.id);
                  }}
                  className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-md transition-colors"
                  aria-label="Unarchive note"
                  title="Unarchive"
                >
                  <UndoIcon className="w-4 h-4" />
                </button>
              )}

              {/* Delete button */}
              <button
                onClick={handleDelete}
                className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-md transition-colors"
                aria-label="Delete note"
                title="Delete"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
