"use client";

import { useEffect } from "react";
import { ThemeMode } from "@/types/settings";
import { STORAGE_KEYS, getStorageAdapter } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";

// Function to apply theme
const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;

  if (theme === "system") {
    // Listen to system preference
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (systemDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  } else if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

// Load initial theme from settings
const loadTheme = async (useFallback = true): Promise<void> => {
  try {
    // Wait for storage initialization to ensure we use the correct adapter
    await waitForStorageInit();

    const settingsStr = await Promise.resolve(getStorageAdapter().getItem(STORAGE_KEYS.SETTINGS));
    if (settingsStr && typeof settingsStr === "string") {
      const settings = JSON.parse(settingsStr);
      const theme = settings.general?.theme || "system";
      applyTheme(theme);
      return theme;
    }
  } catch (e) {
    console.error("Failed to load theme:", e);
  }
  if (useFallback) {
    applyTheme("system");
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    loadTheme(true);

    // Listen for system preference changes when using system theme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = async () => {
      // Re-check settings to get current theme
      loadTheme(false);
    };
    mediaQuery.addEventListener("change", handleSystemChange);

    // Poll for settings changes
    const interval = setInterval(() => {
      loadTheme();
    }, 1000);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
}
