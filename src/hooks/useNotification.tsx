"use client";

import { useState, useCallback } from "react";
import { Notification, NotificationType } from "@/components/shared/Notification";

/**
 * Hook for managing notification state and rendering
 */
export function useNotification() {
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type });
  }, []);

  const showSuccess = useCallback((message: string) => {
    setNotification({ message, type: "success" });
  }, []);

  const showError = useCallback((message: string) => {
    setNotification({ message, type: "error" });
  }, []);

  const showWarning = useCallback((message: string) => {
    setNotification({ message, type: "warning" });
  }, []);

  const showInfo = useCallback((message: string) => {
    setNotification({ message, type: "info" });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const NotificationComponent = notification ? (
    <Notification message={notification.message} type={notification.type} onClose={hideNotification} />
  ) : null;

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
    NotificationComponent,
  };
}
