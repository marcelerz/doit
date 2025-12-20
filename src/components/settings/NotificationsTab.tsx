"use client";

import { useState, useEffect } from "react";
import { NotificationSettings, defaultNotificationSettings, getDurationHour, getDurationMin } from "@/types/settings";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendNotification,
  NotificationPermission,
} from "@/utils/notifications";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";

interface NotificationsTabProps {
  notifications: NotificationSettings;
  onUpdate: (notifications: NotificationSettings) => void;
}

export function NotificationsTab({ notifications, onUpdate }: NotificationsTabProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      onUpdate({ ...notifications, enabled: true });
    }
  };

  const handleTestNotification = () => {
    sendNotification("Test Notification", {
      body: "This is a test notification from DoIt!",
      tag: "test",
    });
  };

  if (!isSupported) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-medium">Browser notifications are not supported</span>
          </div>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            Your browser does not support notifications. Try using a modern browser like Chrome, Firefox, or Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Reset Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Notification Settings</h2>
        <button
          onClick={() => onUpdate(defaultNotificationSettings)}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Permission Status */}
      <div className="p-4 rounded-lg border bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Notification Permission</span>
              <InfoTooltip content={tooltipContent.notifications} />
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {permission === "granted" && "Notifications are enabled"}
              {permission === "denied" && "Notifications are blocked. Enable them in your browser settings."}
              {permission === "default" && "Click the button to enable notifications"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {permission === "granted" ? (
              <>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                  Enabled
                </span>
                <button
                  onClick={handleTestNotification}
                  className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Test
                </button>
              </>
            ) : permission === "denied" ? (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                Blocked
              </span>
            ) : (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Enable Notifications
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings - only show if permission granted */}
      {permission === "granted" && (
        <>
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700">
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Enable Task Notifications</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Get notified about due and overdue tasks</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.enabled}
                onChange={(e) => onUpdate({ ...notifications, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Notification Types */}
          {notifications.enabled && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                Notification Types
              </h3>

              {/* Overdue */}
              <label className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg
                      className="w-4 h-4 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">Overdue Tasks</span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Tasks past their due date</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.notifyOverdue}
                  onChange={(e) => onUpdate({ ...notifications, notifyOverdue: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {/* Due Today */}
              <label className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <svg
                      className="w-4 h-4 text-amber-600 dark:text-amber-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">Due Today</span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Tasks due within today</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.notifyDueToday}
                  onChange={(e) => onUpdate({ ...notifications, notifyDueToday: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {/* Due Soon */}
              <label className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <svg
                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">Due Soon</span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Tasks due within hours</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.notifyDueSoon}
                  onChange={(e) => onUpdate({ ...notifications, notifyDueSoon: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {/* Due Soon Hours */}
              {notifications.notifyDueSoon && (
                <div className="ml-12 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/30">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Notify when task is due within:
                  </label>
                  <select
                    value={notifications.dueSoonHours}
                    onChange={(e) =>
                      onUpdate({ ...notifications, dueSoonHours: getDurationHour(parseInt(e.target.value)) })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                    <option value={4}>4 hours</option>
                    <option value={8}>8 hours</option>
                    <option value={24}>24 hours</option>
                  </select>
                </div>
              )}

              {/* Check Interval */}
              <div className="p-3 rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Check for due tasks every:
                </label>
                <select
                  value={notifications.checkInterval}
                  onChange={(e) =>
                    onUpdate({ ...notifications, checkInterval: getDurationMin(parseInt(e.target.value)) })
                  }
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
