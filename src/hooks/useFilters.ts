import { useState, useMemo, useCallback } from "react";
import { STORAGE_KEYS } from "@/storage/storage";

const STORAGE_KEY = STORAGE_KEYS.VIEW_OPTIONS;

export interface FilterState {
  searchText: string;
  assignedPeople: Set<string>;
  sourcePeople: Set<string>;
  mentionedPeople: Set<string>;
  projects: Set<string>;
  priorities: Set<string>;
  dueDates: Set<string>;
  durations: Set<string>;
  tags: Set<string>;
  recurring: Set<string>;
  dependencies: Set<string>;
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            searchText: parsed.filters?.searchText || "",
            assignedPeople: new Set(parsed.filters?.assignedPeople || []),
            sourcePeople: new Set(parsed.filters?.sourcePeople || []),
            mentionedPeople: new Set(parsed.filters?.mentionedPeople || []),
            projects: new Set(parsed.filters?.projects || []),
            priorities: new Set(parsed.filters?.priorities || []),
            dueDates: new Set(parsed.filters?.dueDates || []),
            durations: new Set(parsed.filters?.durations || []),
            tags: new Set(parsed.filters?.tags || []),
            recurring: new Set(parsed.filters?.recurring || []),
            dependencies: new Set(parsed.filters?.dependencies || []),
          };
        }
      }
    } catch (e) {
      console.error("Failed to load filters from localStorage:", e);
    }
    return {
      searchText: "",
      assignedPeople: new Set(),
      sourcePeople: new Set(),
      mentionedPeople: new Set(),
      projects: new Set(),
      priorities: new Set(),
      dueDates: new Set(),
      durations: new Set(),
      tags: new Set(),
      recurring: new Set(),
      dependencies: new Set(),
    };
  });

  const hasActiveFilters = useMemo(
    () =>
      filters.searchText ||
      filters.assignedPeople.size > 0 ||
      filters.sourcePeople.size > 0 ||
      filters.mentionedPeople.size > 0 ||
      filters.projects.size > 0 ||
      filters.priorities.size > 0 ||
      filters.dueDates.size > 0 ||
      filters.durations.size > 0 ||
      filters.tags.size > 0 ||
      filters.recurring.size > 0 ||
      filters.dependencies.size > 0,
    [filters],
  );

  const toggleFilter = useCallback((type: keyof Omit<FilterState, "searchText">, value: string) => {
    setFilters((prev) => {
      const newSet = new Set(prev[type]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [type]: newSet };
    });
  }, []);

  const selectAll = useCallback((type: keyof Omit<FilterState, "searchText">, allValues: string[]) => {
    setFilters((prev) => ({ ...prev, [type]: new Set(allValues) }));
  }, []);

  const clearFilter = useCallback((type: keyof Omit<FilterState, "searchText">) => {
    setFilters((prev) => ({ ...prev, [type]: new Set() }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      searchText: "",
      assignedPeople: new Set(),
      sourcePeople: new Set(),
      mentionedPeople: new Set(),
      projects: new Set(),
      priorities: new Set(),
      dueDates: new Set(),
      durations: new Set(),
      tags: new Set(),
      recurring: new Set(),
      dependencies: new Set(),
    });
  }, []);

  const setSearchText = useCallback((text: string) => {
    setFilters((prev) => ({ ...prev, searchText: text }));
  }, []);

  const loadFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  return {
    filters,
    setFilters,
    hasActiveFilters,
    toggleFilter,
    selectAll,
    clearFilter,
    clearAllFilters,
    setSearchText,
    loadFilters,
  };
}
