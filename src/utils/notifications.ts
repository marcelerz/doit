import { TodoModel } from "@/models/TodoModel";

export type NotificationPermission = "default" | "granted" | "denied";

// Audio context for playing sounds
let audioContext: AudioContext | null = null;

/**
 * Get or create AudioContext (lazy initialization due to browser autoplay policies)
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch (error) {
      console.error("Failed to create AudioContext:", error);
      return null;
    }
  }
  return audioContext;
}

/**
 * Play a notification sound using Web Audio API
 * @param type - Type of sound
 */
export function playNotificationSound(
  type: "short-break" | "long-break" | "work-start" | "task-complete" | "task-start" | "break-end",
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (required by browser autoplay policies)
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different sound patterns for different notification types
    switch (type) {
      case "short-break":
        // Two gentle high tones (break starting)
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.setValueAtTime(1047, ctx.currentTime + 0.15); // C6
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;

      case "long-break":
        // Three descending tones (more celebratory - long break starting)
        oscillator.frequency.setValueAtTime(1047, ctx.currentTime); // C6
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        oscillator.frequency.setValueAtTime(698, ctx.currentTime + 0.3); // F5
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;

      case "work-start":
      case "break-end":
        // Single decisive tone (back to work)
        oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;

      case "task-start":
        // Rising tone (starting fresh task)
        oscillator.frequency.setValueAtTime(392, ctx.currentTime); // G4
        oscillator.frequency.linearRampToValueAtTime(523, ctx.currentTime + 0.15); // C5
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;

      case "task-complete":
        // Ascending two tones (success sound - task finished)
        oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.25);
        break;
    }
  } catch (error) {
    console.error("Failed to play notification sound:", error);
  }
}

/**
 * Send Pomodoro break notification
 */
export function notifyPomodoroBreak(
  breakType: "short" | "long",
  breakDuration: number,
  taskNumber: number,
  playSound: boolean = true,
): Notification | null {
  const title = breakType === "long" ? `🍅 Time for a long break!` : `🍅 Time for a short break!`;

  const body =
    breakType === "long"
      ? `Great work! You've completed ${taskNumber} tasks. Take a ${breakDuration} minute break.`
      : `Task ${taskNumber} complete! Take a ${breakDuration} minute break.`;

  if (playSound) {
    playNotificationSound(breakType === "long" ? "long-break" : "short-break");
  }

  return sendNotification(title, {
    body,
    tag: `pomodoro-break-${Date.now()}`,
    requireInteraction: false,
    silent: true, // We play our own sound
  });
}

/**
 * Send Pomodoro work start notification
 */
export function notifyPomodoroWorkStart(
  taskName: string,
  taskNumber: number,
  playSound: boolean = true,
): Notification | null {
  if (playSound) {
    playNotificationSound("work-start");
  }

  return sendNotification(`🍅 Break over - back to work!`, {
    body: `Starting task ${taskNumber}: ${taskName}`,
    tag: `pomodoro-work-${Date.now()}`,
    requireInteraction: false,
    silent: true,
  });
}

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
