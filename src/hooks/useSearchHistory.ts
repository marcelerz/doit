"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchHistoryEntry, getSearchHistoryId } from "@/types/types";
import { getTimestamp } from "@/types/time";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";

const MAX_HISTORY_ITEMS = 20;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from storage on mount
  useEffect(() => {
    const loadHistory = async () => {
      await waitForStorageInit();
      const loaded = await loadFromStorage<SearchHistoryEntry[]>(STORAGE_KEYS.SEARCH_HISTORY, []);
      setHistory(loaded);
      setIsLoaded(true);
    };
    loadHistory();
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.SEARCH_HISTORY, history).catch((error) => {
        console.error("Failed to save search history:", error);
      });
    }
  }, [history, isLoaded]);

  const addToHistory = useCallback((query: string) => {
    if (query.trim() === "") return;

    const trimmedQuery = query.trim();

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((h) => h.query.toLowerCase() !== trimmedQuery.toLowerCase());

      // Add new entry at the beginning
      const newEntry: SearchHistoryEntry = {
        id: getSearchHistoryId(`search-${Date.now()}`),
        query: trimmedQuery,
        timestamp: getTimestamp(Date.now()),
      };

      // Keep only MAX_HISTORY_ITEMS
      return [newEntry, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

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
