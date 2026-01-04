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

    // Base path for deployment (matches next.config.ts)
    const basePath = process.env.GITHUB_PAGES === "true" ? "/doit" : "";

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(`${basePath}/sw.js`, {
          scope: `${basePath}/`,
        });

        console.log("[PWA] Service worker registered:", registration.scope);

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New service worker is available
                console.log("[PWA] New service worker available");
                setState((prev) => ({ ...prev, isUpdateAvailable: true }));
              }
            });
          }
        });

        // Check for updates periodically (every hour)
        setInterval(() => {
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
      return () => window.removeEventListener("load", registerSW);
    }
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
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  }, [state.registration]);

  // Clear all caches
  const clearCache = useCallback(async () => {
    if (!state.registration?.active) return false;

    return new Promise<boolean>((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };

      state.registration!.active!.postMessage({ type: "CLEAR_CACHE" }, [messageChannel.port2]);
    });
  }, [state.registration]);

  // Get service worker version
  const getVersion = useCallback(async () => {
    if (!state.registration?.active) return null;

    return new Promise<string | null>((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version);
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
