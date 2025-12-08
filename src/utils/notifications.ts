import { TodoModel } from "@/models/TodoModel";

export type NotificationPermission = "default" | "granted" | "denied";
export type SoundType = "short-break" | "long-break" | "task-complete" | "task-start" | "break-end";

// Audio context for playing sounds
let audioContext: AudioContext | null = null;

// Sound queue system
const soundQueue: SoundType[] = [];
let isProcessingQueue = false;
const SOUND_DELAY_MS = 3000; // 3 seconds between sounds

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
 * Process the sound queue - plays sounds with delays between them
 */
function processQueue(): void {
  if (isProcessingQueue || soundQueue.length === 0) return;

  isProcessingQueue = true;
  const sound = soundQueue.shift()!;
  playSound(sound);

  if (soundQueue.length > 0) {
    // Wait 3 seconds before playing next sound
    setTimeout(() => {
      isProcessingQueue = false;
      processQueue();
    }, SOUND_DELAY_MS);
  } else {
    isProcessingQueue = false;
  }
}

/**
 * Queue a sound to be played. If multiple sounds are queued, they play with 3s delays.
 * @param type - Type of sound to queue
 */
export function queueSound(type: SoundType): void {
  soundQueue.push(type);
  processQueue();
}

/**
 * Queue multiple sounds to be played in sequence with delays
 * @param types - Array of sound types to queue
 */
export function queueSounds(types: SoundType[]): void {
  soundQueue.push(...types);
  processQueue();
}

/**
 * Clear all queued sounds
 */
export function clearSoundQueue(): void {
  soundQueue.length = 0;
}

/**
 * Play a notification sound immediately (bypasses queue)
 * @param type - Type of sound
 */
export function playNotificationSound(type: SoundType): void {
  playSound(type);
}

/**
 * Internal function to play a sound
 */
function playSound(type: SoundType): void {
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
    // Task sounds use square wave (more digital/focused feel)
    // Break sounds use sine wave (softer/relaxing feel)
    switch (type) {
      case "task-start":
        // Upward arpeggio - energizing "let's go" sound
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(262, ctx.currentTime); // C4
        oscillator.frequency.setValueAtTime(330, ctx.currentTime + 0.08); // E4
        oscillator.frequency.setValueAtTime(392, ctx.currentTime + 0.16); // G4
        oscillator.frequency.setValueAtTime(523, ctx.currentTime + 0.24); // C5
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.35);
        break;

      case "task-complete":
        // Gentle success chime - satisfying but not startling
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.12); // E5
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.24); // G5
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;

      case "short-break":
        // Gentle descending tone - soft "relax" sound
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(659, ctx.currentTime); // E5
        oscillator.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3); // A4
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;

      case "long-break":
        // Longer descending melody - more relaxing "take a real break" sound
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(784, ctx.currentTime); // G5
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.15); // E5
        oscillator.frequency.setValueAtTime(523, ctx.currentTime + 0.3); // C5
        oscillator.frequency.linearRampToValueAtTime(392, ctx.currentTime + 0.5); // G4
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.6);
        break;

      case "break-end":
        // Short alarm - repeated beeps to get attention
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2); // A5
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.02, ctx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.02, ctx.currentTime + 0.18);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
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
    playNotificationSound("task-start");
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
