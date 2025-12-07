"use client";

import { useState, useEffect } from "react";
import { TodoModel } from "@/models/TodoModel";
import { MarkerColors, Settings, LinkPattern } from "@/types/settings";
import { TodoMetadata } from "@/types/todo";
import { MarkedText } from "@/components/shared/MarkedText";
import { Badge } from "@/components/shared/Badge";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";

interface FocusViewProps {
  todos: TodoModel[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string, plainText: string, metadata: TodoMetadata) => void;
  onArchive?: (id: string) => void;
  markerColors: MarkerColors;
  settings: Settings;
  linkPatterns: LinkPattern[];
  onOpenDetails: (todo: TodoModel) => void;
  onClose: () => void;
}

export function FocusView({
  todos,
  onToggle,
  onDelete,
  onEdit,
  onArchive,
  markerColors,
  settings,
  linkPatterns,
  onOpenDetails,
  onClose,
}: FocusViewProps) {
  // Only show active todos in focus mode
  const activeTodos = todos.filter((t) => t.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setCurrentIndex((prev) => Math.max(0, prev - 1));
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setCurrentIndex((prev) => Math.min(activeTodos.length - 1, prev + 1));
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Enter":
          e.preventDefault();
          if (currentTodo) {
            onOpenDetails(currentTodo);
          }
          break;
        case " ":
          e.preventDefault();
          if (currentTodo) {
            onToggle(currentTodo.id);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeTodos.length, onClose, onOpenDetails, onToggle]);

  // Ensure index is valid when todos change
  useEffect(() => {
    if (currentIndex >= activeTodos.length && activeTodos.length > 0) {
      setCurrentIndex(activeTodos.length - 1);
    }
  }, [currentIndex, activeTodos.length]);

  const currentTodo = activeTodos[currentIndex];

  if (activeTodos.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">All caught up!</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">No active tasks to focus on.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Exit Focus Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Exit focus mode (Esc)"
          >
            <svg
              className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Focus Mode</span>
            <InfoTooltip content={tooltipContent.focusMode} />
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span>
            {currentIndex + 1} of {activeTodos.length}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="p-3 rounded-full bg-white dark:bg-zinc-800 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Previous (← or ↑)"
            >
              <svg
                className="w-6 h-6 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 mx-8" />

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(activeTodos.length - 1, prev + 1))}
              disabled={currentIndex === activeTodos.length - 1}
              className="p-3 rounded-full bg-white dark:bg-zinc-800 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Next (→ or ↓)"
            >
              <svg
                className="w-6 h-6 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Todo Card */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-8 min-h-[300px] flex flex-col">
            {/* Priority Badge */}
            {currentTodo.metadata.priority && (
              <div className="mb-4">
                <Badge variant="red" size="md">
                  {currentTodo.metadata.priority}
                </Badge>
              </div>
            )}

            {/* Task Text */}
            <div className="flex-1">
              <p className="text-2xl font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed mb-6">
                <MarkedText text={currentTodo.plainText} markerColors={markerColors} linkPatterns={linkPatterns} />
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-sm">
                {currentTodo.metadata.dueDate && (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{currentTodo.dueDateDisplay || currentTodo.metadata.dueDate}</span>
                  </div>
                )}
                {currentTodo.metadata.duration && (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{currentTodo.durationDisplay}</span>
                  </div>
                )}
                {currentTodo.metadata.assignedPeople.length > 0 && (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>{currentTodo.metadata.assignedPeople.join(", ")}</span>
                  </div>
                )}
                {currentTodo.metadata.projects.length > 0 && (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <span>{currentTodo.metadata.projects.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => onOpenDetails(currentTodo)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2"
                title="Open details (Enter)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Details
              </button>

              <button
                onClick={() => onToggle(currentTodo.id)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                title="Complete (Space)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Complete
              </button>
            </div>
          </div>

          {/* Keyboard Hints */}
          <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-4">
              <span>← → Navigate</span>
              <span>Space Complete</span>
              <span>Enter Details</span>
              <span>Esc Exit</span>
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / activeTodos.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
