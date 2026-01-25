"use client";

import { useEffect, useState, useCallback } from "react";

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
    registration: null,
  });

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isSupported = "serviceWorker" in navigator;
    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) {
      console.log("[PWA] Service workers not supported");
      return;
    }

    // Detect base path from current URL (handles GitHub Pages deployment)
    // If running at marcelerz.github.io/doit/, basePath should be "/doit"
    const pathname = window.location.pathname;
    const basePath = pathname.startsWith("/doit") ? "/doit" : "";

    // Track interval and event handlers for cleanup
    let updateIntervalId: ReturnType<typeof setInterval> | null = null;
    let updateFoundHandler: (() => void) | null = null;
    let currentRegistration: ServiceWorkerRegistration | null = null;
    let currentInstallingWorker: ServiceWorker | null = null;
    let stateChangeHandler: (() => void) | null = null;

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(`${basePath}/sw.js`, {
          scope: `${basePath}/`,
        });

        console.log("[PWA] Service worker registered:", registration.scope);
        currentRegistration = registration;

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Check for updates - create named handler for cleanup
        updateFoundHandler = () => {
          const newWorker = registration.installing;

          // Clean up previous statechange listener if any
          if (currentInstallingWorker && stateChangeHandler) {
            currentInstallingWorker.removeEventListener("statechange", stateChangeHandler);
          }

          if (newWorker) {
            currentInstallingWorker = newWorker;
            stateChangeHandler = () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New service worker is available
                console.log("[PWA] New service worker available");
                setState((prev) => ({ ...prev, isUpdateAvailable: true }));
              }
            };
            newWorker.addEventListener("statechange", stateChangeHandler);
          }
        };
        registration.addEventListener("updatefound", updateFoundHandler);

        // Check for updates periodically (every hour)
        updateIntervalId = setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      } catch (error) {
        console.error("[PWA] Service worker registration failed:", error);
      }
    };

    // Wait for page to load before registering
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }

    // Cleanup function
    return () => {
      window.removeEventListener("load", registerSW);
      if (updateIntervalId) {
        clearInterval(updateIntervalId);
      }
      if (currentRegistration && updateFoundHandler && currentRegistration.removeEventListener) {
        currentRegistration.removeEventListener("updatefound", updateFoundHandler);
      }
      // Clean up statechange listener on installing worker
      if (currentInstallingWorker && stateChangeHandler && currentInstallingWorker.removeEventListener) {
        currentInstallingWorker.removeEventListener("statechange", stateChangeHandler);
      }
    };
  }, []);

  // Track online/offline status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      console.log("[PWA] Online");
      setState((prev) => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      console.log("[PWA] Offline");
      setState((prev) => ({ ...prev, isOffline: true }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Apply update (reload with new service worker)
  const applyUpdate = useCallback(() => {
    if (state.registration?.waiting) {
      // Tell the waiting service worker to activate
      state.registration.waiting.postMessage({ type: "SKIP_WAITING" });

      // Reload once the new service worker takes over
      // Use { once: true } to automatically remove the listener after it fires
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          window.location.reload();
        },
        { once: true },
      );
    }
  }, [state.registration]);

  // Clear all caches
  const clearCache = useCallback(async () => {
    if (!state.registration?.active) return false;

    const TIMEOUT_MS = 5000;

    return new Promise<boolean>((resolve) => {
      const messageChannel = new MessageChannel();
      let resolved = false;

      // Timeout to prevent indefinite hang if service worker doesn't respond
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn("[PWA] clearCache timed out after", TIMEOUT_MS, "ms");
          resolve(false);
        }
      }, TIMEOUT_MS);

      messageChannel.port1.onmessage = (event) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve(event.data.success);
        }
      };

      state.registration!.active!.postMessage({ type: "CLEAR_CACHE" }, [messageChannel.port2]);
    });
  }, [state.registration]);

  // Get service worker version
  const getVersion = useCallback(async () => {
    if (!state.registration?.active) return null;

    const TIMEOUT_MS = 5000;

    return new Promise<string | null>((resolve) => {
      const messageChannel = new MessageChannel();
      let resolved = false;

      // Timeout to prevent indefinite hang if service worker doesn't respond
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn("[PWA] getVersion timed out after", TIMEOUT_MS, "ms");
          resolve(null);
        }
      }, TIMEOUT_MS);

      messageChannel.port1.onmessage = (event) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve(event.data.version);
        }
      };

      state.registration!.active!.postMessage({ type: "GET_VERSION" }, [messageChannel.port2]);
    });
  }, [state.registration]);

  return {
    ...state,
    applyUpdate,
    clearCache,
    getVersion,
  };
}
