import { TodoModel } from "@/models/TodoModel";

export type NotificationPermission = "default" | "granted" | "denied";

/**
 * Check if browser notifications are supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission as NotificationPermission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  } catch (error) {
    console.error("Failed to request notification permission:", error);
    return "denied";
  }
}

/**
 * Send a notification
 */
export function sendNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== "granted") return null;

  try {
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  } catch (error) {
    console.error("Failed to send notification:", error);
    return null;
  }
}

/**
 * Send notification for overdue task
 */
export function notifyOverdueTask(todo: TodoModel): Notification | null {
  return sendNotification(`Overdue: ${todo.plainText}`, {
    body: `This task was due ${todo.dueDateDisplay || todo.metadata.dueDate}`,
    tag: `overdue-${todo.id}`,
    requireInteraction: false,
  });
}

/**
 * Send notification for task due today
 */
export function notifyDueToday(todo: TodoModel): Notification | null {
  return sendNotification(`Due Today: ${todo.plainText}`, {
    body: todo.metadata.priority ? `Priority: ${todo.metadata.priority}` : "Remember to complete this task",
    tag: `due-today-${todo.id}`,
    requireInteraction: false,
  });
}

/**
 * Send notification for task due soon
 */
export function notifyDueSoon(todo: TodoModel, hours: number): Notification | null {
  return sendNotification(`Due in ${hours} hour${hours === 1 ? "" : "s"}: ${todo.plainText}`, {
    body: todo.metadata.priority ? `Priority: ${todo.metadata.priority}` : "Task deadline approaching",
    tag: `due-soon-${todo.id}`,
    requireInteraction: false,
  });
}

/**
 * Check todos and send notifications for due/overdue tasks
 */
export function checkAndNotifyDueTasks(
  todos: TodoModel[],
  notifiedIds: Set<string>,
  settings: {
    notifyOverdue: boolean;
    notifyDueToday: boolean;
    notifyDueSoon: boolean;
    dueSoonHours: number;
  },
): Set<string> {
  const newNotifiedIds = new Set(notifiedIds);
  const now = new Date();

  todos.forEach((todo) => {
    if (!todo.isActive || !todo.metadata.dueDate) return;

    // Skip if already notified
    if (notifiedIds.has(todo.id)) return;

    // Parse due date
    const dueDate = parseDueDate(todo.metadata.dueDate);
    if (!dueDate) return;

    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Check if overdue
    if (settings.notifyOverdue && diffMs < 0) {
      notifyOverdueTask(todo);
      newNotifiedIds.add(todo.id);
      return;
    }

    // Check if due today (within 24 hours and same day)
    if (settings.notifyDueToday && diffHours >= 0 && diffHours <= 24) {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      if (dueDate >= todayStart && dueDate <= todayEnd) {
        notifyDueToday(todo);
        newNotifiedIds.add(todo.id);
        return;
      }
    }

    // Check if due soon
    if (settings.notifyDueSoon && diffHours > 0 && diffHours <= settings.dueSoonHours) {
      notifyDueSoon(todo, Math.ceil(diffHours));
      newNotifiedIds.add(todo.id);
    }
  });

  return newNotifiedIds;
}

/**
 * Parse a due date string into a Date object
 */
function parseDueDate(dueDate: string): Date | null {
  // Try parsing as ISO date
  const date = new Date(dueDate);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try parsing as date only (YYYY-MM-DD)
  const dateOnlyMatch = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59);
  }

  return null;
}
