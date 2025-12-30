"use client";

import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useEffect, useState } from "react";
import { OfflineIcon, RefreshIcon, WifiOffIcon } from "@/components/shared/Icons";

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
            <WifiOffIcon className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">You&apos;re offline</span>
          </div>
        </div>
      )}

      {/* Update Available Toast */}
      {showUpdateToast && (
        <div className="fixed bottom-4 right-4 z-[9999] animate-slide-up" role="alert" aria-live="polite">
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg">
            <RefreshIcon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
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
