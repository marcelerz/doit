import { TodoModel } from "@/models/TodoModel";
import { TodoId } from "@/types/todo";
import { getBrowserApis } from "./browserApis";

export type NotificationPermission = "default" | "granted" | "denied";

/**
 * Get the base path for the app (e.g., "/doit" on GitHub Pages, "" locally)
 */
function getBasePath(): string {
  const apis = getBrowserApis();
  const pathname = apis.getLocationPathname();
  return pathname.startsWith("/doit") ? "/doit" : "";
}

const _SOUND_TYPES = ["short-break", "long-break", "task-complete", "task-start", "break-end", "pause"] as const;
export type SoundType = (typeof _SOUND_TYPES)[number];

// Audio context for playing sounds (cached)
let audioContext: AudioContext | null = null;

// Ambient sound player
let ambientAudio: HTMLAudioElement | null = null;
let currentAmbientSound: string | null = null;
let ambientInstanceId: number = 0;

// Available ambient sounds in the public/sounds folder
export const AMBIENT_SOUNDS = [
  { id: "swedish-summer", name: "Swedish Summer Evening", file: "10-minutes-swedish-summer-evening-19559.mp3" },
  { id: "wind-bushes", name: "Wind in Bushes", file: "bushes-medium-heavy-wind-in-dry-vegetation-19537.mp3" },
  { id: "crickets", name: "Crickets at Night", file: "crickets_night_2-19628.mp3" },
  { id: "crickets-frogs", name: "Crickets and Frogs", file: "cricketsandfrogs-19596.mp3" },
  { id: "backyard-ny", name: "Backyard New York", file: "field-recording-backyard-new-york-19524.mp3" },
  { id: "rain-window", name: "Rain on Window", file: "gentle-rain-on-window-for-sleep-422420.mp3" },
  { id: "rain-metal-roof", name: "Rain on Metal Roof", file: "light-rain-on-metal-roof-114527.mp3" },
  { id: "rain-thunder-distant", name: "Rain & Distant Thunder", file: "rain-and-distant-thunder-60230.mp3" },
  { id: "rain-thunder", name: "Rain & Thunder", file: "rain-and-thunder-61426.mp3" },
  { id: "relaxing-rain-1", name: "Relaxing Rain", file: "relaxing-rain-387677.mp3" },
  { id: "relaxing-rain-2", name: "Relaxing Rain 2", file: "relaxing-rain-444802.mp3" },
  {
    id: "rooftop-city",
    name: "Rooftop City Morning",
    file: "rooftop-city-neighbourhood-morning-distant-traffic-residents-activity-19574.mp3",
  },
  { id: "sea", name: "Ocean Waves", file: "sea-sound-4-19385.mp3" },
  { id: "small-town", name: "Small Town Ambiance", file: "small-town-ambiance-60015.mp3" },
  { id: "spring-birds", name: "Springtime Birds", file: "sweden-springtime-birds-field-recording-190420-19629.mp3" },
  { id: "tranquil-flow", name: "Tranquil Flow", file: "tranquil-flow-387676.mp3" },
  { id: "tranquil-stream", name: "Tranquil Stream", file: "tranquil-stream-387678.mp3" },
  { id: "winter-morning", name: "Winter Morning", file: "winter-morning-60210.mp3" },
] as const;

export type AmbientSoundId = (typeof AMBIENT_SOUNDS)[number]["id"] | "";

/**
 * Reset internal state (for testing)
 */
export function resetNotificationState(): void {
  audioContext = null;
  ambientAudio = null;
  currentAmbientSound = null;
  ambientInstanceId = 0;
  soundQueue.length = 0;
  isProcessingQueue = false;
}

/**
 * Play ambient sound (looping)
 * @param soundFile - The sound file name from public/sounds
 * @param volume - Volume level 0-1
 */
export function playAmbientSound(soundFile: string, volume: number = 0.3): void {
  const apis = getBrowserApis();

  if (!apis.hasWindow() || !soundFile) {
    return;
  }

  // Increment instance ID - this invalidates any pending stops for previous instances
  ambientInstanceId++;

  // If same sound is already playing, just adjust volume
  if (ambientAudio && currentAmbientSound === soundFile) {
    ambientAudio.volume = Math.max(0, Math.min(1, volume));
    if (ambientAudio.paused) {
      ambientAudio.play().catch(() => {});
    }
    return;
  }

  // Stop current sound synchronously if different
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.src = "";
    ambientAudio = null;
    currentAmbientSound = null;
  }

  const audio = apis.createAudio(`${getBasePath()}/sounds/${soundFile}`);
  if (!audio) return;

  ambientAudio = audio;
  ambientAudio.loop = true;
  ambientAudio.volume = Math.max(0, Math.min(1, volume));
  currentAmbientSound = soundFile;

  ambientAudio.play().catch(() => {
    // Ignore play errors - may be interrupted
  });
}

/**
 * Stop the currently playing ambient sound
 * Only stops if the instance ID matches (hasn't been superseded by a new play call)
 */
export function stopAmbientSound(): void {
  const apis = getBrowserApis();
  const instanceIdAtCall = ambientInstanceId;

  // Delay the actual stop to let any synchronous play() calls happen first
  apis.setTimeout(() => {
    // If a new play was started (instance ID changed), don't stop
    if (ambientInstanceId !== instanceIdAtCall) {
      return;
    }

    if (ambientAudio) {
      ambientAudio.pause();
      ambientAudio.src = "";
      ambientAudio = null;
      currentAmbientSound = null;
    }
  }, 50); // Small delay to let play() calls happen first
}

/**
 * Set ambient sound volume
 * @param volume - Volume level 0-1
 */
export function setAmbientVolume(volume: number): void {
  if (ambientAudio) {
    ambientAudio.volume = Math.max(0, Math.min(1, volume));
  }
}

/**
 * Check if ambient sound is currently playing
 */
export function isAmbientPlaying(): boolean {
  return ambientAudio !== null && !ambientAudio.paused;
}

/**
 * Get the file name for an ambient sound ID
 */
export function getAmbientSoundFile(soundId: string): string {
  const sound = AMBIENT_SOUNDS.find((s) => s.id === soundId);
  return sound?.file || "";
}

// Sound queue system
const soundQueue: SoundType[] = [];
let isProcessingQueue = false;
const SOUND_DELAY_MS = 3000; // 3 seconds between sounds

/**
 * Get or create AudioContext (lazy initialization due to browser autoplay policies)
 */
function getAudioContext(): AudioContext | null {
  const apis = getBrowserApis();

  if (!apis.hasWindow()) return null;

  if (!audioContext) {
    audioContext = apis.createAudioContext();
  }
  return audioContext;
}

/**
 * Process the sound queue - plays sounds with delays between them
 */
function processQueue(): void {
  if (isProcessingQueue || soundQueue.length === 0) return;

  const apis = getBrowserApis();
  isProcessingQueue = true;
  const sound = soundQueue.shift()!;
  playSound(sound);

  if (soundQueue.length > 0) {
    // Wait 3 seconds before playing next sound
    apis.setTimeout(() => {
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

      case "pause":
        // Soft descending two-note chime - gentle "pause" indicator
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(392, ctx.currentTime + 0.12); // G4
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
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
  const apis = getBrowserApis();
  return apis.hasNotificationSupport();
}

/**
 * Get current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  const apis = getBrowserApis();
  return apis.getNotificationPermission() as NotificationPermission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const apis = getBrowserApis();
  return (await apis.requestNotificationPermission()) as NotificationPermission;
}

/**
 * Send a notification
 */
export function sendNotification(title: string, options?: NotificationOptions): Notification | null {
  const apis = getBrowserApis();

  if (!apis.hasNotificationSupport()) return null;
  if (apis.getNotificationPermission() !== "granted") return null;

  const notification = apis.createNotification(title, options);

  if (notification) {
    // Auto-close after 5 seconds
    apis.setTimeout(() => notification.close(), 5000);
  }

  return notification;
}

/**
 * Send notification for overdue task
 */
export function notifyOverdueTask(todo: TodoModel): Notification | null {
  return sendNotification(`Overdue: ${todo.plainText}`, {
    body: `This task was due ${todo.dueDateDisplay}`,
    tag: `overdue-${todo.id}`,
    requireInteraction: false,
  });
}

/**
 * Send notification for task due today
 */
export function notifyDueToday(todo: TodoModel): Notification | null {
  return sendNotification(`Due Today: ${todo.plainText}`, {
    body: todo.priorityName ? `Priority: ${todo.priorityName}` : "Remember to complete this task",
    tag: `due-today-${todo.id}`,
    requireInteraction: false,
  });
}

/**
 * Send notification for task due soon
 */
export function notifyDueSoon(todo: TodoModel, hours: number): Notification | null {
  return sendNotification(`Due in ${hours} hour${hours === 1 ? "" : "s"}: ${todo.plainText}`, {
    body: todo.priorityName ? `Priority: ${todo.priorityName}` : "Task deadline approaching",
    tag: `due-soon-${todo.id}`,
    requireInteraction: false,
  });
}

/**
 * Check todos and send notifications for due/overdue tasks
 */
export function checkAndNotifyDueTasks(
  todos: TodoModel[],
  notifiedIds: Set<TodoId>,
  settings: {
    notifyOverdue: boolean;
    notifyDueToday: boolean;
    notifyDueSoon: boolean;
    dueSoonHours: number;
  },
): Set<TodoId> {
  const newNotifiedIds = new Set(notifiedIds);
  const now = new Date();

  todos.forEach((todo) => {
    // Use the dueDateObject from TodoModel which is derived from the dueDate timestamp
    if (!todo.isActive || !todo.dueDateObject) return;

    // Skip if already notified
    if (notifiedIds.has(todo.id)) return;

    const dueDate = todo.dueDateObject;
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
