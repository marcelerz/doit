"use client";

import { useEffect, useRef } from "react";
import { TodoModel } from "@/models/TodoModel";
import { NotificationSettings } from "@/types/settings";
import { checkAndNotifyDueTasks, getNotificationPermission } from "@/utils/notifications";

/**
 * Hook that monitors todos and sends notifications for due/overdue tasks.
 * Runs a check every minute to send notifications based on settings.
 */
export function useTaskNotifications(todos: TodoModel[], notificationSettings: NotificationSettings) {
  // Track which todos we've already notified about to avoid spam
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Don't run if notifications are disabled or permission not granted
    if (!notificationSettings.enabled) {
      return;
    }

    if (getNotificationPermission() !== "granted") {
      return;
    }

    // Function to check and send notifications
    const checkNotifications = () => {
      // Only check active todos (not completed/archived/deleted)
      const activeTodos = todos.filter((todo) => todo.isActive);

      // Check and notify, updating our notified set
      const newNotifiedIds = checkAndNotifyDueTasks(activeTodos, notifiedIds.current, {
        notifyOverdue: notificationSettings.notifyOverdue,
        notifyDueToday: notificationSettings.notifyDueToday,
        notifyDueSoon: notificationSettings.notifyDueSoon,
        dueSoonHours: notificationSettings.dueSoonHours,
      });

      // Update the ref with newly notified IDs
      notifiedIds.current = newNotifiedIds;
    };

    // Run immediately on mount/settings change
    checkNotifications();

    // Check every minute
    const interval = setInterval(checkNotifications, 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [todos, notificationSettings]);

  // Clear notification history when a todo is completed or deleted
  // This allows re-notification if the task is made active again
  useEffect(() => {
    const activeIds = new Set(todos.filter((t) => t.isActive).map((t) => t.id));

    // Remove IDs from notified set if they're no longer active
    notifiedIds.current = new Set(Array.from(notifiedIds.current).filter((id) => activeIds.has(id)));
  }, [todos]);
}
