"use client";

import { useCallback, useEffect, useRef } from "react";
import { TodoModel } from "@/models/TodoModel";
import { NotificationSettings } from "@/types/settings";
import { TodoId } from "@/types/todo";
import {
  checkAndNotifyDueTasks,
  getNotificationPermission,
} from "@/utils/notifications";
import {
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  waitForStorageInit,
} from "@/storage/storage";

const CHECK_INTERVAL_MS = 60 * 1000;

/**
 * Hook that monitors todos and sends notifications for due/overdue tasks.
 * Runs a check every minute to send notifications based on settings.
 */
export function useTaskNotifications(
  todos: TodoModel[],
  notificationSettings: NotificationSettings,
) {
  // Which todos we have already notified about.
  //
  // Persisted: this used to live only in a ref, so every page load and PWA
  // relaunch replayed the entire overdue backlog as fresh notifications. The
  // first check therefore waits for hydration rather than running during the
  // mount commit - otherwise it would notify about everything all over again.
  const notifiedIds = useRef<Set<TodoId>>(new Set());
  const hydrated = useRef(false);

  // Latest values, so the interval below need not be torn down and recreated
  // on every todo change. It used to be, which meant that during active
  // editing the periodic check could effectively never fire on its schedule.
  //
  // Synced in an effect, not during render - writing a ref while rendering is
  // illegal in React 19. Declared before the effects that read them so it runs
  // first; effects fire in declaration order.
  const todosRef = useRef(todos);
  const settingsRef = useRef(notificationSettings);

  useEffect(() => {
    todosRef.current = todos;
    settingsRef.current = notificationSettings;
  }, [todos, notificationSettings]);

  const persist = useCallback((ids: Set<TodoId>) => {
    saveToStorage(STORAGE_KEYS.NOTIFIED_TASKS, Array.from(ids)).catch(
      (error) => {
        console.error("Failed to persist notification history:", error);
      },
    );
  }, []);

  const runCheck = useCallback(() => {
    if (!hydrated.current) return;
    if (!settingsRef.current.enabled) return;
    if (getNotificationPermission() !== "granted") return;

    const activeTodos = todosRef.current.filter((todo) => todo.isActive);
    const before = notifiedIds.current;
    const after = checkAndNotifyDueTasks(activeTodos, before, {
      notifyOverdue: settingsRef.current.notifyOverdue,
      notifyDueToday: settingsRef.current.notifyDueToday,
      notifyDueSoon: settingsRef.current.notifyDueSoon,
      dueSoonHours: settingsRef.current.dueSoonHours,
    });

    if (after.size !== before.size) {
      notifiedIds.current = after;
      persist(after);
    }
  }, [persist]);

  // Restore the notified set, then run the first check.
  useEffect(() => {
    let cancelled = false;
    // Without waiting for initialization this read the emptied localStorage
    // adapter, so the notified set came back empty on every load and already
    // notified overdue tasks fired again.
    waitForStorageInit()
      .then(() => loadFromStorage<TodoId[]>(STORAGE_KEYS.NOTIFIED_TASKS, []))
      .then((stored) => {
        if (!cancelled) notifiedIds.current = new Set(stored);
      })
      .catch((error) => {
        console.error("Failed to load notification history:", error);
      })
      .finally(() => {
        if (cancelled) return;
        hydrated.current = true;
        runCheck();
      });
    return () => {
      cancelled = true;
    };
  }, [runCheck]);

  // The interval depends only on the enable flag, so it is no longer torn down
  // and recreated whenever a todo changes.
  useEffect(() => {
    if (!notificationSettings.enabled) return;
    const interval = setInterval(runCheck, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [notificationSettings.enabled, runCheck]);

  // Re-check promptly when the data or settings change, so a newly added
  // overdue task does not wait up to a minute. Cheap: already-notified todos
  // are filtered out inside the check.
  useEffect(() => {
    runCheck();
  }, [todos, notificationSettings, runCheck]);

  // Drop history for todos that are no longer active, so a task made active
  // again can notify a second time.
  useEffect(() => {
    if (!hydrated.current) return;
    const activeIds = new Set(todos.filter((t) => t.isActive).map((t) => t.id));
    const pruned = new Set(
      Array.from(notifiedIds.current).filter((id) => activeIds.has(id)),
    );

    if (pruned.size !== notifiedIds.current.size) {
      notifiedIds.current = pruned;
      persist(pruned);
    }
  }, [todos, persist]);
}
