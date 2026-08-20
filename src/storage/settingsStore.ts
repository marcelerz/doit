"use client";

import { useEffect } from "react";
import { Settings, defaultSettings } from "@/types/settings";
import { STORAGE_KEYS } from "@/storage/storage";
import { migrateSettings } from "@/storage/migrations";
import { createSharedStore } from "@/storage/sharedStore";

/**
 * The single owner of application settings.
 *
 * Settings previously had four independent copies - useSettings, useTodos,
 * useNotes and useReviews each held their own useState and loaded the key in
 * their own mount effect, while only useSettings ever wrote. The other three
 * were stale for the rest of the session after any settings edit.
 */
export const settingsStore = createSharedStore<Settings>(STORAGE_KEYS.SETTINGS, defaultSettings, {
  migrate: migrateSettings,
  onPersisted: (settings) => {
    // Mirror to localStorage so the inline theme script in layout.tsx can read
    // it synchronously on the next page load, even when IndexedDB is primary.
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Private browsing and quota errors are not worth failing a save over.
    }
  },
});

/**
 * Read settings. Every caller observes the same value, in this tab and others.
 */
export function useSharedSettings(): { settings: Settings; isLoaded: boolean } {
  useEffect(() => {
    void settingsStore.hydrate();
  }, []);

  return {
    settings: settingsStore.use(),
    isLoaded: settingsStore.useIsLoaded(),
  };
}
