/**
 * Browser API Abstraction Layer
 *
 * This module provides an abstraction over browser-specific APIs to enable
 * testing of code that depends on AudioContext, Audio, Notification, etc.
 *
 * In production, these delegate to real browser APIs.
 * In tests, they can be mocked via setBrowserApis(); the test doubles are in
 * src/__tests__/helpers/mockBrowserApis.ts.
 */

import { createLogger } from "@/utils/logger";

const log = createLogger("browserApis");

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
      log.error("Failed to create AudioContext:", error);
      return null;
    }
  }

  createAudio(src: string): HTMLAudioElement | null {
    if (!this.hasWindow()) return null;

    try {
      return new Audio(src);
    } catch (error) {
      log.error("Failed to create Audio:", error);
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
      log.error("Failed to request notification permission:", error);
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
      log.error("Failed to create notification:", error);
      return null;
    }
  }

  setTimeout(callback: () => void, ms: number): ReturnType<typeof setTimeout> {
    return setTimeout(callback, ms);
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
