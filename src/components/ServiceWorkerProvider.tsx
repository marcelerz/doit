"use client";

import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useEffect, useState } from "react";

/**
 * ServiceWorkerProvider - Registers the service worker and provides
 * PWA functionality like offline detection and update notifications.
 */
export default function ServiceWorkerProvider() {
  const { isOffline, isUpdateAvailable, applyUpdate, isRegistered } = useServiceWorker();

  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Debug logging

  // Show offline toast when going offline
  useEffect(() => {
    if (isOffline) {
      setShowOfflineToast(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Coming back online
      setShowOfflineToast(false);
      // Could show "back online" toast here
    }
  }, [isOffline, wasOffline]);

  // Show update toast when update is available
  useEffect(() => {
    if (isUpdateAvailable) {
      setShowUpdateToast(true);
    }
  }, [isUpdateAvailable]);

  // Auto-hide offline toast after some time (but keep showing if still offline)
  useEffect(() => {
    if (showOfflineToast && !isOffline) {
      const timer = setTimeout(() => {
        setShowOfflineToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showOfflineToast, isOffline]);

  return (
    <>
      {/* Offline Indicator */}
      {showOfflineToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-7.072 7.072a9 9 0 010-12.728m3.536 3.536a4 4 0 010 5.656"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
            <span className="font-medium">You&apos;re offline</span>
            <span className="text-amber-100 text-sm">Changes will sync when back online</span>
          </div>
        </div>
      )}

      {/* Update Available Toast */}
      {showUpdateToast && (
        <div className="fixed bottom-4 right-4 z-[9999] animate-slide-up" role="alert" aria-live="polite">
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Update available</p>
              <p className="text-blue-100 text-sm">A new version of DoIt is ready</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowUpdateToast(false)}
                className="px-3 py-1 text-sm text-blue-200 hover:text-white transition-colors"
              >
                Later
              </button>
              <button
                onClick={applyUpdate}
                className="px-3 py-1 text-sm bg-white text-blue-600 rounded font-medium hover:bg-blue-50 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent offline indicator in corner (subtle) */}
      {isOffline && isRegistered && (
        <div className="fixed bottom-4 left-4 z-[9998]" title="You're offline - app is working in offline mode">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full text-xs">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span>Offline</span>
          </div>
        </div>
      )}
    </>
  );
}
