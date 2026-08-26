"use client";

import { ReactNode } from "react";
import { CloseIcon } from "@/components/shared/Icons";

/**
 * Configuration for an undo action displayed in the notification
 */
export interface UndoNotificationAction {
  /** Unique identifier for the action */
  id: string;
  /** Type of action (used for message display) */
  type: string;
  /** Text to display in the notification subtitle */
  displayText: string;
}

interface UndoNotificationStackProps {
  /** Array of undo actions to display */
  actions: UndoNotificationAction[];
  /** Set of action IDs that are currently fading out */
  fadingOutIds: Set<string>;
  /** Callback when user clicks Undo */
  onUndo: (actionId: string) => void;
  /** Callback when user dismisses the notification */
  onDismiss: (actionId: string) => void;
  /** Function to get the message for an action type */
  getMessage: (type: string) => string;
  /** Optional custom render for the notification content */
  renderContent?: (action: UndoNotificationAction) => ReactNode;
}

/**
 * A stack of undo notification toasts displayed at the bottom center of the screen.
 * Used by ListView, NotesView, and ReviewsView for undo functionality.
 *
 * @example
 * <UndoNotificationStack
 *   actions={undoActions.map(a => ({
 *     id: a.id,
 *     type: a.type,
 *     displayText: a.entity.plainText,
 *   }))}
 *   fadingOutIds={fadingOutIds}
 *   onUndo={undo}
 *   onDismiss={dismissUndo}
 *   getMessage={(type) => {
 *     if (type === "delete") return "Todo deleted";
 *     if (type === "complete") return "Todo completed";
 *     return "Action completed";
 *   }}
 * />
 */
/** Whether an action removed something, and so warrants a warning colour. */
function isDestructive(type: string): boolean {
  return type === "delete" || type === "archive";
}

export function UndoNotificationStack({
  actions,
  fadingOutIds,
  onUndo,
  onDismiss,
  getMessage,
  renderContent,
}: UndoNotificationStackProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div
      // These confirm something the user just did and offer the only way to
      // take it back, and were announced to nobody.
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col-reverse gap-2"
    >
      {actions.map((action) => (
        <div
          key={action.id}
          className={`transition-opacity duration-3000 ${
            fadingOutIds.has(action.id) ? "opacity-0" : "opacity-100 animate-slide-up"
          }`}
        >
          {/* Red for every action type meant "Todo completed" arrived styled as
              an error, with a red primary button. Destructive actions keep it;
              the rest are neutral. */}
          <div
            className={`rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-3 min-w-[280px] border ${
              isDestructive(action.type)
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100"
                : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {renderContent ? (
              renderContent(action)
            ) : (
              <div className="flex-1">
                <p className="font-medium text-sm">{getMessage(action.type)}</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 truncate max-w-[180px]">
                  {action.displayText}
                </p>
              </div>
            )}
            <button
              onClick={() => onUndo(action.id)}
              className={`px-3 py-1.5 text-white text-sm rounded-md font-medium transition-colors flex-shrink-0 ${
                isDestructive(action.type) ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Undo
            </button>
            <button
              onClick={() => onDismiss(action.id)}
              className={`p-1.5 transition-colors flex-shrink-0 ${
                isDestructive(action.type)
                  ? "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
              aria-label="Dismiss"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
