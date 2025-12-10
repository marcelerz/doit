/**
 * NotificationService - Abstraction layer for notification and sound functionality
 *
 * This service wraps the notification functions to enable easy mocking in tests.
 * The interface defines all available operations, and the default implementation
 * delegates to the actual notification functions.
 */

import { TodoModel } from "@/models/TodoModel";
import {
  SoundType,
  AmbientSoundId,
  NotificationPermission,
  AMBIENT_SOUNDS,
  playAmbientSound,
  stopAmbientSound,
  setAmbientVolume,
  isAmbientPlaying,
  getAmbientSoundFile,
  queueSound,
  queueSounds,
  clearSoundQueue,
  playNotificationSound,
  notifyPomodoroBreak,
  notifyPomodoroWorkStart,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendNotification,
  notifyOverdueTask,
  notifyDueToday,
  notifyDueSoon,
  checkAndNotifyDueTasks,
} from "@/utils/notifications";

/**
 * Interface for the notification service
 * All methods are defined here for easy mocking
 */
export interface INotificationService {
  // Ambient sound methods
  playAmbientSound(soundFile: string, volume?: number): void;
  stopAmbientSound(): void;
  setAmbientVolume(volume: number): void;
  isAmbientPlaying(): boolean;
  getAmbientSoundFile(soundId: string): string;
  getAmbientSounds(): typeof AMBIENT_SOUNDS;

  // Sound queue methods
  queueSound(type: SoundType): void;
  queueSounds(types: SoundType[]): void;
  clearSoundQueue(): void;
  playNotificationSound(type: SoundType): void;

  // Pomodoro notifications
  notifyPomodoroBreak(
    breakType: "short" | "long",
    breakDuration: number,
    taskNumber: number,
    playSound?: boolean,
  ): Notification | null;
  notifyPomodoroWorkStart(taskName: string, taskNumber: number, playSound?: boolean): Notification | null;

  // Permission methods
  isNotificationSupported(): boolean;
  getNotificationPermission(): NotificationPermission;
  requestNotificationPermission(): Promise<NotificationPermission>;

  // Notification methods
  sendNotification(title: string, options?: NotificationOptions): Notification | null;
  notifyOverdueTask(todo: TodoModel): Notification | null;
  notifyDueToday(todo: TodoModel): Notification | null;
  notifyDueSoon(todo: TodoModel, hours: number): Notification | null;
  checkAndNotifyDueTasks(
    todos: TodoModel[],
    notifiedIds: Set<string>,
    settings: {
      notifyOverdue: boolean;
      notifyDueToday: boolean;
      notifyDueSoon: boolean;
      dueSoonHours: number;
    },
  ): Set<string>;
}

/**
 * Default implementation that delegates to the actual notification functions
 */
export class NotificationService implements INotificationService {
  // Ambient sound methods
  playAmbientSound(soundFile: string, volume: number = 0.3): void {
    playAmbientSound(soundFile, volume);
  }

  stopAmbientSound(): void {
    stopAmbientSound();
  }

  setAmbientVolume(volume: number): void {
    setAmbientVolume(volume);
  }

  isAmbientPlaying(): boolean {
    return isAmbientPlaying();
  }

  getAmbientSoundFile(soundId: string): string {
    return getAmbientSoundFile(soundId);
  }

  getAmbientSounds(): typeof AMBIENT_SOUNDS {
    return AMBIENT_SOUNDS;
  }

  // Sound queue methods
  queueSound(type: SoundType): void {
    queueSound(type);
  }

  queueSounds(types: SoundType[]): void {
    queueSounds(types);
  }

  clearSoundQueue(): void {
    clearSoundQueue();
  }

  playNotificationSound(type: SoundType): void {
    playNotificationSound(type);
  }

  // Pomodoro notifications
  notifyPomodoroBreak(
    breakType: "short" | "long",
    breakDuration: number,
    taskNumber: number,
    playSoundEnabled: boolean = true,
  ): Notification | null {
    return notifyPomodoroBreak(breakType, breakDuration, taskNumber, playSoundEnabled);
  }

  notifyPomodoroWorkStart(taskName: string, taskNumber: number, playSoundEnabled: boolean = true): Notification | null {
    return notifyPomodoroWorkStart(taskName, taskNumber, playSoundEnabled);
  }

  // Permission methods
  isNotificationSupported(): boolean {
    return isNotificationSupported();
  }

  getNotificationPermission(): NotificationPermission {
    return getNotificationPermission();
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    return requestNotificationPermission();
  }

  // Notification methods
  sendNotification(title: string, options?: NotificationOptions): Notification | null {
    return sendNotification(title, options);
  }

  notifyOverdueTask(todo: TodoModel): Notification | null {
    return notifyOverdueTask(todo);
  }

  notifyDueToday(todo: TodoModel): Notification | null {
    return notifyDueToday(todo);
  }

  notifyDueSoon(todo: TodoModel, hours: number): Notification | null {
    return notifyDueSoon(todo, hours);
  }

  checkAndNotifyDueTasks(
    todos: TodoModel[],
    notifiedIds: Set<string>,
    settings: {
      notifyOverdue: boolean;
      notifyDueToday: boolean;
      notifyDueSoon: boolean;
      dueSoonHours: number;
    },
  ): Set<string> {
    return checkAndNotifyDueTasks(todos, notifiedIds, settings);
  }
}

/**
 * Mock notification service for testing
 * Records all method calls for verification
 */
export class MockNotificationService implements INotificationService {
  // Call tracking
  public calls: {
    method: string;
    args: unknown[];
    timestamp: number;
  }[] = [];

  // State tracking
  public ambientPlaying = false;
  public ambientVolume = 0.3;
  public currentAmbientFile: string | null = null;
  public soundQueue: SoundType[] = [];
  public notificationPermission: NotificationPermission = "default";
  public notificationSupported = true;
  public sentNotifications: { title: string; options?: NotificationOptions }[] = [];
  public notifiedTodoIds: Set<string> = new Set();

  private recordCall(method: string, args: unknown[]): void {
    this.calls.push({ method, args, timestamp: Date.now() });
  }

  // Helper methods for test assertions
  getCallsForMethod(method: string): { method: string; args: unknown[]; timestamp: number }[] {
    return this.calls.filter((c) => c.method === method);
  }

  getLastCallForMethod(method: string): { method: string; args: unknown[]; timestamp: number } | undefined {
    const calls = this.getCallsForMethod(method);
    return calls[calls.length - 1];
  }

  wasMethodCalled(method: string): boolean {
    return this.calls.some((c) => c.method === method);
  }

  reset(): void {
    this.calls = [];
    this.ambientPlaying = false;
    this.ambientVolume = 0.3;
    this.currentAmbientFile = null;
    this.soundQueue = [];
    this.sentNotifications = [];
    this.notifiedTodoIds = new Set();
  }

  // Ambient sound methods
  playAmbientSound(soundFile: string, volume: number = 0.3): void {
    this.recordCall("playAmbientSound", [soundFile, volume]);
    this.currentAmbientFile = soundFile;
    this.ambientVolume = volume;
    this.ambientPlaying = true;
  }

  stopAmbientSound(): void {
    this.recordCall("stopAmbientSound", []);
    this.ambientPlaying = false;
    this.currentAmbientFile = null;
  }

  setAmbientVolume(volume: number): void {
    this.recordCall("setAmbientVolume", [volume]);
    this.ambientVolume = volume;
  }

  isAmbientPlaying(): boolean {
    this.recordCall("isAmbientPlaying", []);
    return this.ambientPlaying;
  }

  getAmbientSoundFile(soundId: string): string {
    this.recordCall("getAmbientSoundFile", [soundId]);
    return getAmbientSoundFile(soundId);
  }

  getAmbientSounds(): typeof AMBIENT_SOUNDS {
    this.recordCall("getAmbientSounds", []);
    return AMBIENT_SOUNDS;
  }

  // Sound queue methods
  queueSound(type: SoundType): void {
    this.recordCall("queueSound", [type]);
    this.soundQueue.push(type);
  }

  queueSounds(types: SoundType[]): void {
    this.recordCall("queueSounds", [types]);
    this.soundQueue.push(...types);
  }

  clearSoundQueue(): void {
    this.recordCall("clearSoundQueue", []);
    this.soundQueue = [];
  }

  playNotificationSound(type: SoundType): void {
    this.recordCall("playNotificationSound", [type]);
  }

  // Pomodoro notifications
  notifyPomodoroBreak(
    breakType: "short" | "long",
    breakDuration: number,
    taskNumber: number,
    playSoundEnabled: boolean = true,
  ): Notification | null {
    this.recordCall("notifyPomodoroBreak", [breakType, breakDuration, taskNumber, playSoundEnabled]);
    if (playSoundEnabled) {
      this.recordCall("playNotificationSound", [breakType === "long" ? "long-break" : "short-break"]);
    }
    const title = breakType === "long" ? `🍅 Time for a long break!` : `🍅 Time for a short break!`;
    this.sentNotifications.push({ title, options: { body: `Task ${taskNumber}` } });
    return null; // Mock doesn't create real Notification
  }

  notifyPomodoroWorkStart(taskName: string, taskNumber: number, playSoundEnabled: boolean = true): Notification | null {
    this.recordCall("notifyPomodoroWorkStart", [taskName, taskNumber, playSoundEnabled]);
    if (playSoundEnabled) {
      this.recordCall("playNotificationSound", ["task-start"]);
    }
    this.sentNotifications.push({
      title: `🍅 Break over - back to work!`,
      options: { body: `Starting task ${taskNumber}: ${taskName}` },
    });
    return null;
  }

  // Permission methods
  isNotificationSupported(): boolean {
    this.recordCall("isNotificationSupported", []);
    return this.notificationSupported;
  }

  getNotificationPermission(): NotificationPermission {
    this.recordCall("getNotificationPermission", []);
    return this.notificationPermission;
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    this.recordCall("requestNotificationPermission", []);
    // Simulate granting permission
    this.notificationPermission = "granted";
    return this.notificationPermission;
  }

  // Notification methods
  sendNotification(title: string, options?: NotificationOptions): Notification | null {
    this.recordCall("sendNotification", [title, options]);
    this.sentNotifications.push({ title, options });
    return null;
  }

  notifyOverdueTask(todo: TodoModel): Notification | null {
    this.recordCall("notifyOverdueTask", [todo]);
    this.sentNotifications.push({
      title: `Overdue: ${todo.plainText}`,
      options: { body: `This task was due ${todo.dueDateDisplay || todo.metadata.dueDate}` },
    });
    this.notifiedTodoIds.add(todo.id);
    return null;
  }

  notifyDueToday(todo: TodoModel): Notification | null {
    this.recordCall("notifyDueToday", [todo]);
    this.sentNotifications.push({
      title: `Due Today: ${todo.plainText}`,
      options: {
        body: todo.metadata.priority ? `Priority: ${todo.metadata.priority}` : "Remember to complete this task",
      },
    });
    this.notifiedTodoIds.add(todo.id);
    return null;
  }

  notifyDueSoon(todo: TodoModel, hours: number): Notification | null {
    this.recordCall("notifyDueSoon", [todo, hours]);
    this.sentNotifications.push({
      title: `Due in ${hours} hour${hours === 1 ? "" : "s"}: ${todo.plainText}`,
      options: { body: todo.metadata.priority ? `Priority: ${todo.metadata.priority}` : "Task deadline approaching" },
    });
    this.notifiedTodoIds.add(todo.id);
    return null;
  }

  checkAndNotifyDueTasks(
    todos: TodoModel[],
    notifiedIds: Set<string>,
    settings: {
      notifyOverdue: boolean;
      notifyDueToday: boolean;
      notifyDueSoon: boolean;
      dueSoonHours: number;
    },
  ): Set<string> {
    this.recordCall("checkAndNotifyDueTasks", [todos, notifiedIds, settings]);

    const newNotifiedIds = new Set(notifiedIds);
    const now = new Date();

    todos.forEach((todo) => {
      if (!todo.isActive || !todo.metadata.dueDate) return;
      if (notifiedIds.has(todo.id)) return;

      const dueDate = new Date(todo.metadata.dueDate);
      if (isNaN(dueDate.getTime())) return;

      const diffMs = dueDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (settings.notifyOverdue && diffMs < 0) {
        this.notifyOverdueTask(todo);
        newNotifiedIds.add(todo.id);
        return;
      }

      if (settings.notifyDueToday && diffHours >= 0 && diffHours <= 24) {
        this.notifyDueToday(todo);
        newNotifiedIds.add(todo.id);
        return;
      }

      if (settings.notifyDueSoon && diffHours > 0 && diffHours <= settings.dueSoonHours) {
        this.notifyDueSoon(todo, Math.ceil(diffHours));
        newNotifiedIds.add(todo.id);
      }
    });

    return newNotifiedIds;
  }
}

// Singleton instance for easy access
let notificationServiceInstance: INotificationService = new NotificationService();

/**
 * Get the current notification service instance
 */
export function getNotificationService(): INotificationService {
  return notificationServiceInstance;
}

/**
 * Set a custom notification service instance (useful for testing)
 */
export function setNotificationService(service: INotificationService): void {
  notificationServiceInstance = service;
}

/**
 * Reset to the default notification service
 */
export function resetNotificationService(): void {
  notificationServiceInstance = new NotificationService();
}
