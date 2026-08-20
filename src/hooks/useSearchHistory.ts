"use client";

import { useCallback } from "react";
import { SearchHistoryEntry, getSearchHistoryId } from "@/types/types";
import { getTimestamp } from "@/types/time";
import { STORAGE_KEYS } from "@/storage/storage";
import { createSearchHistoryId } from "@/utils/idGenerator";
import { usePersistedState } from "./usePersistedState";

const MAX_HISTORY_ITEMS = 20;

export function useSearchHistory() {
  const [history, setHistory, isLoaded] = usePersistedState<SearchHistoryEntry[]>(
    STORAGE_KEYS.SEARCH_HISTORY,
    []
  );

  const addToHistory = useCallback((query: string) => {
    if (query.trim() === "") return;

    const trimmedQuery = query.trim();

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((h) => h.query.toLowerCase() !== trimmedQuery.toLowerCase());

      // Add new entry at the beginning
      const newEntry: SearchHistoryEntry = {
        id: getSearchHistoryId(createSearchHistoryId()),
        query: trimmedQuery,
        timestamp: getTimestamp(Date.now()),
      };

      // Keep only MAX_HISTORY_ITEMS
      return [newEntry, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, [setHistory]);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, [setHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  // Get suggestions based on current input
  const getSuggestions = useCallback(
    (input: string, limit = 5): SearchHistoryEntry[] => {
      if (input.trim() === "") {
        return history.slice(0, limit);
      }

      const lowerInput = input.toLowerCase();
      return history.filter((h) => h.query.toLowerCase().includes(lowerInput)).slice(0, limit);
    },
    [history],
  );

  return {
    history,
    isLoaded,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getSuggestions,
  };
}
