/**
 * Browser API Abstraction Layer
 *
 * This module provides an abstraction over browser-specific APIs to enable
 * testing of code that depends on AudioContext, Audio, Notification, etc.
 *
 * In production, these delegate to real browser APIs.
 * In tests, they can be mocked via setBrowserApis().
 */

/**
 * Interface for browser APIs that can be mocked
 */
export interface IBrowserApis {
  // Window detection
  hasWindow(): boolean;
  getLocationPathname(): string;

  // Audio APIs
  createAudioContext(): AudioContext | null;
  createAudio(src: string): HTMLAudioElement | null;

  // Notification APIs
  hasNotificationSupport(): boolean;
  getNotificationPermission(): NotificationPermission;
  requestNotificationPermission(): Promise<NotificationPermission>;
  createNotification(title: string, options?: NotificationOptions): Notification | null;

  // Timers (for testing)
  setTimeout(callback: () => void, ms: number): ReturnType<typeof setTimeout>;
  clearTimeout(id: ReturnType<typeof setTimeout>): void;
}

/**
 * Default browser API implementation using real browser APIs
 */
class RealBrowserApis implements IBrowserApis {
  hasWindow(): boolean {
    return typeof window !== "undefined";
  }

  getLocationPathname(): string {
    return this.hasWindow() ? window.location.pathname : "";
  }

  createAudioContext(): AudioContext | null {
    if (!this.hasWindow()) return null;

    try {
      return new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch (error) {
      console.error("Failed to create AudioContext:", error);
      return null;
    }
  }

  createAudio(src: string): HTMLAudioElement | null {
    if (!this.hasWindow()) return null;

    try {
      return new Audio(src);
    } catch (error) {
      console.error("Failed to create Audio:", error);
      return null;
    }
  }

  hasNotificationSupport(): boolean {
    return this.hasWindow() && "Notification" in window;
  }

  getNotificationPermission(): NotificationPermission {
    if (!this.hasNotificationSupport()) return "denied";
    return Notification.permission;
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.hasNotificationSupport()) return "denied";

    try {
      return await Notification.requestPermission();
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return "denied";
    }
  }

  createNotification(title: string, options?: NotificationOptions): Notification | null {
    if (!this.hasNotificationSupport()) return null;
    if (Notification.permission !== "granted") return null;

    const basePath = this.getLocationPathname().startsWith("/doit") ? "/doit" : "";
    try {
      return new Notification(title, {
        icon: `${basePath}/favicon.ico`,
        badge: `${basePath}/favicon.ico`,
        ...options,
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
      return null;
    }
  }

  setTimeout(callback: () => void, ms: number): ReturnType<typeof setTimeout> {
    return setTimeout(callback, ms);
  }

  clearTimeout(id: ReturnType<typeof setTimeout>): void {
    clearTimeout(id);
  }
}

/**
 * Mock browser API implementation for testing
 */
export class MockBrowserApis implements IBrowserApis {
  // Configuration
  public windowExists = false;
  public locationPathname = "/";
  public notificationSupported = true;
  public notificationPermission: NotificationPermission = "default";

  // Tracking
  public audioContextsCreated = 0;
  public audiosCreated: { src: string }[] = [];
  public notificationsCreated: { title: string; options?: NotificationOptions }[] = [];
  public timeouts: { callback: () => void; ms: number; id: number }[] = [];
  private nextTimeoutId = 1;

  // Mock audio context
  public mockAudioContext: Partial<AudioContext> | null = null;

  // Mock audio elements
  public mockAudioElements: MockAudioElement[] = [];

  hasWindow(): boolean {
    return this.windowExists;
  }

  getLocationPathname(): string {
    return this.windowExists ? this.locationPathname : "";
  }

  createAudioContext(): AudioContext | null {
    if (!this.windowExists) return null;
    this.audioContextsCreated++;

    // Return a mock AudioContext
    const mockCtx = {
      state: "running" as AudioContextState,
      currentTime: 0,
      destination: {} as AudioDestinationNode,
      resume: jest.fn().mockResolvedValue(undefined),
      createOscillator: jest.fn().mockReturnValue({
        type: "sine",
        frequency: {
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn(),
        },
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
      }),
      createGain: jest.fn().mockReturnValue({
        gain: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
        connect: jest.fn(),
      }),
    };

    this.mockAudioContext = mockCtx;
    return mockCtx as unknown as AudioContext;
  }

  createAudio(src: string): HTMLAudioElement | null {
    if (!this.windowExists) return null;

    this.audiosCreated.push({ src });

    const mockAudio = new MockAudioElement(src);
    this.mockAudioElements.push(mockAudio);
    return mockAudio as unknown as HTMLAudioElement;
  }

  hasNotificationSupport(): boolean {
    return this.windowExists && this.notificationSupported;
  }

  getNotificationPermission(): NotificationPermission {
    if (!this.hasNotificationSupport()) return "denied";
    return this.notificationPermission;
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.hasNotificationSupport()) return "denied";
    // Simulate granting permission
    this.notificationPermission = "granted";
    return this.notificationPermission;
  }

  createNotification(title: string, options?: NotificationOptions): Notification | null {
    if (!this.hasNotificationSupport()) return null;
    if (this.notificationPermission !== "granted") return null;

    this.notificationsCreated.push({ title, options });

    // Return a mock notification
    return {
      close: jest.fn(),
      title,
      ...options,
    } as unknown as Notification;
  }

  setTimeout(callback: () => void, ms: number): ReturnType<typeof setTimeout> {
    const id = this.nextTimeoutId++;
    this.timeouts.push({ callback, ms, id });
    return id as unknown as ReturnType<typeof setTimeout>;
  }

  clearTimeout(id: ReturnType<typeof setTimeout>): void {
    const index = this.timeouts.findIndex((t) => t.id === (id as unknown as number));
    if (index !== -1) {
      this.timeouts.splice(index, 1);
    }
  }

  // Test helpers
  runAllTimeouts(): void {
    const timeoutsToRun = [...this.timeouts];
    this.timeouts = [];
    timeoutsToRun.forEach((t) => t.callback());
  }

  runTimeout(id: number): void {
    const index = this.timeouts.findIndex((t) => t.id === id);
    if (index !== -1) {
      const [timeout] = this.timeouts.splice(index, 1);
      timeout.callback();
    }
  }

  reset(): void {
    this.windowExists = false;
    this.locationPathname = "/";
    this.notificationSupported = true;
    this.notificationPermission = "default";
    this.audioContextsCreated = 0;
    this.audiosCreated = [];
    this.notificationsCreated = [];
    this.timeouts = [];
    this.mockAudioContext = null;
    this.mockAudioElements = [];
  }
}

/**
 * Mock HTMLAudioElement for testing
 */
export class MockAudioElement {
  src: string;
  loop = false;
  volume = 1;
  paused = true;
  currentTime = 0;

  constructor(src: string) {
    this.src = src;
  }

  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }

  load(): void {
    // No-op
  }
}

// Singleton instance
let browserApis: IBrowserApis = new RealBrowserApis();

/**
 * Get the current browser APIs instance
 */
export function getBrowserApis(): IBrowserApis {
  return browserApis;
}

/**
 * Set a custom browser APIs instance (for testing)
 */
export function setBrowserApis(apis: IBrowserApis): void {
  browserApis = apis;
}

/**
 * Reset to the default browser APIs
 */
export function resetBrowserApis(): void {
  browserApis = new RealBrowserApis();
}
