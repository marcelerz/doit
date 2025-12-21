"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  SelectionHistory,
  SelectionFieldType,
  SelectionEntry,
  DEFAULT_SELECTION_HISTORY,
  MAX_SELECTION_HISTORY,
} from "@/types/selectionHistory";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";

/**
 * Usage statistics derived from selection history
 * Maps values to their frequency count
 */
export interface UsageStats {
  assignedPeople: Map<string, number>;
  sourcePeople: Map<string, number>;
  mentionedPeople: Map<string, number>;
  projects: Map<string, number>;
  priorities: Map<string, number>;
  tags: Map<string, number>;
  dueDates: Map<string, number>;
  durations: Map<string, number>;
  recurring: Map<string, number>;
  sprints: Map<string, number>;
}

/**
 * Convert selection history entries to a frequency map
 */
function entriesToFrequencyMap(entries: SelectionEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  entries.forEach((entry) => {
    const count = map.get(entry.value) || 0;
    map.set(entry.value, count + 1);
  });
  return map;
}

/**
 * Hook for managing selection history
 *
 * Tracks user selections for smart suggestions.
 * Persists to storage and provides usage statistics.
 */
export function useSelectionHistory() {
  const [history, setHistory] = useState<SelectionHistory>(DEFAULT_SELECTION_HISTORY);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from storage on mount
  useEffect(() => {
    waitForStorageInit().then(() => {
      loadFromStorage<SelectionHistory>(STORAGE_KEYS.SELECTION_HISTORY, DEFAULT_SELECTION_HISTORY).then(
        (storedHistory) => {
          setHistory(storedHistory);
          setIsLoaded(true);
        },
      );
    });
  }, []);

  // Save history to storage when it changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.SELECTION_HISTORY, history);
    }
  }, [history, isLoaded]);

  /**
   * Record a selection for a field type
   * Adds to the front of the queue and trims to max size
   */
  const recordSelection = useCallback((fieldType: SelectionFieldType, value: string) => {
    if (value === "") return; // Don't record empty selections

    setHistory((prev) => {
      const entries = prev[fieldType];
      const newEntry: SelectionEntry = {
        value,
        timestamp: Date.now(),
      };

      // Add to front, trim to max size
      const newEntries = [newEntry, ...entries].slice(0, MAX_SELECTION_HISTORY);

      return {
        ...prev,
        [fieldType]: newEntries,
      };
    });
  }, []);

  /**
   * Record multiple selections at once (e.g., when saving a todo)
   */
  const recordSelections = useCallback(
    (selections: Partial<Record<SelectionFieldType, string | string[]>>) => {
      Object.entries(selections).forEach(([fieldType, values]) => {
        if (values === undefined) return;

        const valueArray = Array.isArray(values) ? values : [values];
        valueArray.forEach((value) => {
          if (value !== "") {
            recordSelection(fieldType as SelectionFieldType, value);
          }
        });
      });
    },
    [recordSelection],
  );

  /**
   * Clear all history for a specific field type
   */
  const clearFieldHistory = useCallback((fieldType: SelectionFieldType) => {
    setHistory((prev) => ({
      ...prev,
      [fieldType]: [],
    }));
  }, []);

  /**
   * Clear all selection history
   */
  const clearAllHistory = useCallback(() => {
    setHistory(DEFAULT_SELECTION_HISTORY);
  }, []);

  /**
   * Get usage statistics derived from selection history
   */
  const usageStats: UsageStats = useMemo(
    () => ({
      assignedPeople: entriesToFrequencyMap(history.assignedPeople),
      sourcePeople: entriesToFrequencyMap(history.sourcePeople),
      mentionedPeople: entriesToFrequencyMap(history.mentionedPeople),
      projects: entriesToFrequencyMap(history.projects),
      priorities: entriesToFrequencyMap(history.priorities),
      tags: entriesToFrequencyMap(history.tags),
      dueDates: entriesToFrequencyMap(history.dueDates),
      durations: entriesToFrequencyMap(history.durations),
      recurring: entriesToFrequencyMap(history.recurring),
      sprints: entriesToFrequencyMap(history.sprints),
    }),
    [history],
  );

  /**
   * Get the most recently selected values for a field type
   * Returns unique values in order of most recent first
   */
  const getRecentSelections = useCallback(
    (fieldType: SelectionFieldType, limit: number = 10): string[] => {
      const seen = new Set<string>();
      const result: string[] = [];

      for (const entry of history[fieldType]) {
        if (!seen.has(entry.value)) {
          seen.add(entry.value);
          result.push(entry.value);
          if (result.length >= limit) break;
        }
      }

      return result;
    },
    [history],
  );

  /**
   * Get top used values sorted by frequency
   */
  const getTopUsed = useCallback(
    (fieldType: SelectionFieldType, limit: number = 10): string[] => {
      const frequencyMap = entriesToFrequencyMap(history[fieldType]);
      return Array.from(frequencyMap.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .slice(0, limit)
        .map((entry) => entry[0]);
    },
    [history],
  );

  return {
    history,
    isLoaded,
    recordSelection,
    recordSelections,
    clearFieldHistory,
    clearAllHistory,
    usageStats,
    getRecentSelections,
    getTopUsed,
  };
}

/**
 * Sort items by usage frequency (highest first)
 * Works with objects that have a name property
 */
export function sortByUsage<T extends { name: string }>(items: T[], usageMap: Map<string, number>): T[] {
  return [...items].sort((a, b) => {
    const aScore = usageMap.get(a.name) || 0;
    const bScore = usageMap.get(b.name) || 0;
    if (aScore !== bScore) {
      return bScore - aScore; // Higher score first
    }
    // If scores are equal, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort simple string items by usage frequency
 */
export function sortStringsByUsage(items: string[], usageMap: Map<string, number>): string[] {
  return [...items].sort((a, b) => {
    const aScore = usageMap.get(a) || 0;
    const bScore = usageMap.get(b) || 0;
    if (aScore !== bScore) {
      return bScore - aScore; // Higher score first
    }
    // If scores are equal, sort alphabetically
    return a.localeCompare(b);
  });
}
