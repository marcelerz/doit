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
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col-reverse gap-2">
      {actions.map((action) => (
        <div
          key={action.id}
          className={`transition-opacity duration-3000 ${
            fadingOutIds.has(action.id) ? "opacity-0" : "opacity-100 animate-slide-up"
          }`}
        >
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-3 min-w-[280px]">
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
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md font-medium transition-colors flex-shrink-0"
            >
              Undo
            </button>
            <button
              onClick={() => onDismiss(action.id)}
              className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex-shrink-0"
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
