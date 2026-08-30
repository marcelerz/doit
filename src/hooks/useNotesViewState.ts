"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useViewPresets } from "@/hooks/useViewPresets";
import { NoteModel } from "@/models/NoteModel";
import { ProjectModel } from "@/models/ProjectModel";
import { PersonModel } from "@/models/PersonModel";
import {
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
} from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storage";
import { setToSortedArray, arrayHasAnyFromSet, arraysEqual } from "@/utils/filterHelpers";
import { useEntityRenameSync } from "./useEntityRenameSync";

// Types
export interface NotesFilters {
  searchText: string;
  assignedPeople: Set<string>;
  sourcePeople: Set<string>;
  mentionedPeople: Set<string>;
  projects: Set<string>;
  tags: Set<string>;
}

export type NotesSortField =
  "title" | "created" | "modified" | "pinned" | "manual";

export type SortDirection = "asc" | "desc";

export type NotesGroupBy = "none" | "project" | "assigned" | "tags" | "pinned";

export type NotesQuickFilter = "all" | "pinned" | "hasActionItems" | "archived";

export interface NotesViewPreset {
  name: string;
  filters: {
    searchText: string;
    assignedPeople: string[];
    sourcePeople: string[];
    mentionedPeople: string[];
    projects: string[];
    tags: string[];
  };
  sortField: NotesSortField;
  sortDirection: SortDirection;
  groupBy: NotesGroupBy;
  quickFilter?: NotesQuickFilter;
  sections?: {
    activeExpanded: boolean;
    archivedExpanded: boolean;
  };
}

// Helper function to compare arrays
// Empty filters constant
const emptyFilters: NotesFilters = {
  searchText: "",
  assignedPeople: new Set(),
  sourcePeople: new Set(),
  mentionedPeople: new Set(),
  projects: new Set(),
  tags: new Set(),
};

interface UseNotesViewStateProps {
  notes: NoteModel[];
  projects: ProjectModel[];
  people: PersonModel[];
}

// Storage key for notes view presets


export function useNotesViewState({
  notes,
  projects,
  people,
}: UseNotesViewStateProps) {
  // Filter state
  const [filters, setFilters] = useState<NotesFilters>({ ...emptyFilters });

  // A rename rewrites saved filters in storage; remap what we hold too.
  useEntityRenameSync(setFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<NotesSortField>("modified");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Group state
  const [groupBy, setGroupBy] = useState<NotesGroupBy>("none");

  // Quick filter state
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<NotesQuickFilter>("all");

  // Section expanded states
  const [activeExpanded, setActiveExpanded] = useState(true);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  // Preset state
  const {
    viewPresets,
    setViewPresets,
    activePreset,
    setActivePreset,
    isSavePresetOpen,
    setIsSavePresetOpen,
    presetName,
    setPresetName,
  } = useViewPresets<NotesViewPreset>(STORAGE_KEYS.NOTES_VIEW_PRESETS);

  // Loading states
  const [viewOptionsLoaded, setViewOptionsLoaded] = useState(false);

  // Drag mode state
  const [isDragMode, setIsDragMode] = useState(false);

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(
    new Set(),
  );



  // Load view options from storage on mount
  useEffect(() => {
    // The presets effect above already waits for initialization; this one did
    // not, so it read the pre-init localStorage adapter, fell back to the
    // defaults, and the save effect then wrote those over the stored options.
    waitForStorageInit()
      .then(() =>
        loadFromStorage<{
          filters?: {
            searchText?: string;
            assignedPeople?: string[];
            sourcePeople?: string[];
            mentionedPeople?: string[];
            projects?: string[];
            tags?: string[];
          };
          sortField?: NotesSortField;
          sortDirection?: SortDirection;
          groupBy?: NotesGroupBy;
          quickFilter?: NotesQuickFilter;
          sections?: {
            activeExpanded?: boolean;
            archivedExpanded?: boolean;
          };
        }>(STORAGE_KEYS.NOTES_VIEW_OPTIONS, {}),
      )
      .then((saved) => {
        if (saved.filters) {
          setFilters({
            searchText: saved.filters.searchText || "",
            assignedPeople: new Set(saved.filters.assignedPeople || []),
            sourcePeople: new Set(saved.filters.sourcePeople || []),
            mentionedPeople: new Set(saved.filters.mentionedPeople || []),
            projects: new Set(saved.filters.projects || []),
            tags: new Set(saved.filters.tags || []),
          });
        }
        if (saved.sortField) setSortField(saved.sortField);
        if (saved.sortDirection) setSortDirection(saved.sortDirection);
        if (saved.groupBy) setGroupBy(saved.groupBy);
        if (saved.quickFilter) setActiveQuickFilter(saved.quickFilter);
        if (saved.sections) {
          if (saved.sections.activeExpanded !== undefined)
            setActiveExpanded(saved.sections.activeExpanded);
          if (saved.sections.archivedExpanded !== undefined)
            setArchivedExpanded(saved.sections.archivedExpanded);
        }
        setViewOptionsLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load notes view options:", error);
        setViewOptionsLoaded(true);
      });
  }, []);

  // Save view options to storage when they change
  useEffect(() => {
    if (!viewOptionsLoaded) return;

    const viewOptions = {
      filters: {
        searchText: filters.searchText,
        assignedPeople: Array.from(filters.assignedPeople),
        sourcePeople: Array.from(filters.sourcePeople),
        mentionedPeople: Array.from(filters.mentionedPeople),
        projects: Array.from(filters.projects),
        tags: Array.from(filters.tags),
      },
      sortField,
      sortDirection,
      groupBy,
      quickFilter: activeQuickFilter,
      sections: {
        activeExpanded,
        archivedExpanded,
      },
    };
    saveToStorage(STORAGE_KEYS.NOTES_VIEW_OPTIONS, viewOptions);

    // Check if current view matches any preset
    const matchingPreset = viewPresets.find((preset) => {
      return (
        preset.filters.searchText === filters.searchText &&
        arraysEqual(
          preset.filters.assignedPeople,
          Array.from(filters.assignedPeople),
        ) &&
        arraysEqual(
          preset.filters.sourcePeople,
          Array.from(filters.sourcePeople),
        ) &&
        arraysEqual(
          preset.filters.mentionedPeople,
          Array.from(filters.mentionedPeople),
        ) &&
        arraysEqual(preset.filters.projects, Array.from(filters.projects)) &&
        arraysEqual(preset.filters.tags || [], Array.from(filters.tags)) &&
        preset.sortField === sortField &&
        preset.sortDirection === sortDirection &&
        preset.groupBy === groupBy &&
        (preset.quickFilter || "all") === activeQuickFilter &&
        (preset.sections?.activeExpanded ?? true) === activeExpanded &&
        (preset.sections?.archivedExpanded ?? false) === archivedExpanded
      );
    });

    setActivePreset(matchingPreset ? matchingPreset.name : "custom");
  }, [
    setActivePreset,
    viewOptionsLoaded,
    filters,
    sortField,
    sortDirection,
    groupBy,
    activeQuickFilter,
    activeExpanded,
    archivedExpanded,
    viewPresets,
  ]);

  // Quick filter counts
  const quickFilterCounts = useMemo(() => {
    const activeNotes = notes.filter((n) => n.isActive);
    return {
      all: activeNotes.length,
      pinned: activeNotes.filter((n) => n.isPinned).length,
      hasActionItems: activeNotes.filter((n) => n.pendingActionItemCount > 0)
        .length,
      archived: notes.filter((n) => n.isArchived).length,
    };
  }, [notes]);

  // Extract unique values from all notes for filter options
  const filterOptions = useMemo(() => {
    const assignedPeople = new Set<string>();
    const sourcePeople = new Set<string>();
    const mentionedPeople = new Set<string>();
    const projectIds = new Set<string>();
    const tags = new Set<string>();

    notes.forEach((note) => {
      if (note.isDeleted) return;
      note.assignedPeople.forEach((p) => assignedPeople.add(p));
      note.sourcePeople.forEach((p) => sourcePeople.add(p));
      note.mentionedPeople.forEach((p) => mentionedPeople.add(p));
      note.projects.forEach((p) => projectIds.add(p));
      note.tags.forEach((t) => tags.add(t));
    });

    return {
      assignedPeople: setToSortedArray(assignedPeople),
      sourcePeople: setToSortedArray(sourcePeople),
      mentionedPeople: setToSortedArray(mentionedPeople),
      projects: setToSortedArray(projectIds),
      tags: setToSortedArray(tags),
    };
  }, [notes]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchText !== "" ||
    filters.assignedPeople.size > 0 ||
    filters.sourcePeople.size > 0 ||
    filters.mentionedPeople.size > 0 ||
    filters.projects.size > 0 ||
    filters.tags.size > 0 ||
    activeQuickFilter !== "all";

  // Filter handler functions
  const handleFilterClick = useCallback(
    (type: keyof Omit<NotesFilters, "searchText">, value: string) => {
      setFilters((prev) => {
        const newSet = new Set(prev[type]);
        if (newSet.has(value)) {
          newSet.delete(value);
        } else {
          newSet.add(value);
        }
        return { ...prev, [type]: newSet };
      });
      if (!showFilters) setShowFilters(true);
    },
    [showFilters],
  );

  const handleSelectAll = useCallback(
    (type: keyof Omit<NotesFilters, "searchText">) => {
      const allValues = filterOptions[type];
      setFilters((prev) => ({ ...prev, [type]: new Set(allValues) }));
    },
    [filterOptions],
  );

  const handleClearAll = useCallback(
    (type: keyof Omit<NotesFilters, "searchText">) => {
      setFilters((prev) => ({ ...prev, [type]: new Set() }));
    },
    [],
  );

  const handleClearAllFilters = useCallback(() => {
    setFilters({ ...emptyFilters });
    setActiveQuickFilter("all");
  }, []);

  // Apply filters to notes
  const applyFilters = useCallback(
    (noteList: NoteModel[]) => {
      return noteList.filter((note) => {
        // Quick filter handling
        if (activeQuickFilter === "archived") {
          if (!note.isArchived) return false;
        } else if (activeQuickFilter !== "all") {
          // Non-archived quick filters only apply to active notes
          if (!note.isActive) return false;

          switch (activeQuickFilter) {
            case "pinned":
              if (!note.isPinned) return false;
              break;
            case "hasActionItems":
              if (note.pendingActionItemCount === 0) return false;
              break;
          }
        }

        // Text search
        if (filters.searchText && !note.matchesSearch(filters.searchText)) {
          return false;
        }

        // Metadata filters (OR logic within each category)
        if (filters.assignedPeople.size > 0) {
          if (!arrayHasAnyFromSet(note.assignedPeople, filters.assignedPeople))
            return false;
        }

        if (filters.sourcePeople.size > 0) {
          if (!arrayHasAnyFromSet(note.sourcePeople, filters.sourcePeople))
            return false;
        }

        if (filters.mentionedPeople.size > 0) {
          if (
            !arrayHasAnyFromSet(note.mentionedPeople, filters.mentionedPeople)
          )
            return false;
        }

        if (filters.projects.size > 0) {
          if (!arrayHasAnyFromSet(note.projects, filters.projects))
            return false;
        }

        if (filters.tags.size > 0) {
          if (!arrayHasAnyFromSet(note.tags, filters.tags)) return false;
        }

        return true;
      });
    },
    [filters, activeQuickFilter],
  );

  // Sort notes
  const sortNotes = useCallback(
    (noteList: NoteModel[]) => {
      return [...noteList].sort((a, b) => {
        // Pinned notes always come first unless sorting by pinned or manual explicitly
        if (
          sortField !== "pinned" &&
          sortField !== "manual" &&
          a.isPinned !== b.isPinned
        ) {
          return a.isPinned ? -1 : 1;
        }

        let comparison = 0;

        switch (sortField) {
          case "title":
            comparison = a.plainText.localeCompare(b.plainText);
            break;
          case "created": {
            const aCreated = a.createdAt || 0;
            const bCreated = b.createdAt || 0;
            comparison = aCreated - bCreated;
            break;
          }
          case "modified": {
            const aTime = a.updatedAt ?? a.createdAt;
            const bTime = b.updatedAt ?? b.createdAt;
            comparison = aTime - bTime;
            break;
          }
          case "pinned":
            // Pinned notes first, then by modified
            if (a.isPinned !== b.isPinned) {
              comparison = a.isPinned ? -1 : 1;
            } else {
              const aTime = a.updatedAt ?? a.createdAt;
              const bTime = b.updatedAt ?? b.createdAt;
              comparison = bTime - aTime; // Most recent first within pinned/unpinned groups
            }
            // For pinned sort, don't reverse - pinned is always first
            return comparison;
          case "manual": {
            // Sort by sortOrder, with notes without sortOrder going to the end
            const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
            const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
            comparison = aOrder - bOrder;
            break;
          }
          default:
            comparison = 0;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    },
    [sortField, sortDirection],
  );

  // Group notes
  const groupNotes = useCallback(
    (noteList: NoteModel[]): Record<string, NoteModel[]> => {
      if (groupBy === "none") {
        return { "": noteList };
      }

      if (groupBy === "project") {
        const grouped: Record<string, NoteModel[]> = {};

        noteList.forEach((note) => {
          const projectList = note.projects;
          if (projectList.length === 0) {
            const group = "No Project";
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(note);
          } else {
            projectList.forEach((projectId) => {
              const project = projects.find((p) => p.id === projectId);
              const projectName = project?.name || projectId;
              if (!grouped[projectName]) grouped[projectName] = [];
              grouped[projectName].push(note);
            });
          }
        });

        return grouped;
      }

      if (groupBy === "assigned") {
        const grouped: Record<string, NoteModel[]> = {};

        noteList.forEach((note) => {
          const assignedList = note.assignedPeople;
          if (assignedList.length === 0) {
            const group = "Unassigned";
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(note);
          } else {
            assignedList.forEach((personId) => {
              const person = people.find((p) => p.id === personId);
              const personName = person?.name || personId;
              if (!grouped[personName]) grouped[personName] = [];
              grouped[personName].push(note);
            });
          }
        });

        return grouped;
      }

      if (groupBy === "tags") {
        const grouped: Record<string, NoteModel[]> = {};

        noteList.forEach((note) => {
          const tagList = note.tags;
          if (tagList.length === 0) {
            const group = "No Tags";
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(note);
          } else {
            tagList.forEach((tag) => {
              if (!grouped[tag]) grouped[tag] = [];
              grouped[tag].push(note);
            });
          }
        });

        return grouped;
      }

      if (groupBy === "pinned") {
        const grouped: Record<string, NoteModel[]> = {};
        const pinnedKey = "Pinned";
        const unpinnedKey = "Not Pinned";

        noteList.forEach((note) => {
          const key = note.isPinned ? pinnedKey : unpinnedKey;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(note);
        });

        // Ensure pinned group comes first
        const sortedGroups: Record<string, NoteModel[]> = {};
        if (grouped[pinnedKey]) sortedGroups[pinnedKey] = grouped[pinnedKey];
        if (grouped[unpinnedKey])
          sortedGroups[unpinnedKey] = grouped[unpinnedKey];

        return sortedGroups;
      }

      return { "": noteList };
    },
    [groupBy, projects, people],
  );

  // Preset handlers
  const loadPreset = useCallback((preset: NotesViewPreset) => {
    setFilters({
      searchText: preset.filters.searchText,
      assignedPeople: new Set(preset.filters.assignedPeople),
      sourcePeople: new Set(preset.filters.sourcePeople),
      mentionedPeople: new Set(preset.filters.mentionedPeople),
      projects: new Set(preset.filters.projects),
      tags: new Set(preset.filters.tags || []),
    });
    setSortField(preset.sortField);
    setSortDirection(preset.sortDirection);
    setGroupBy(preset.groupBy);
    setActiveQuickFilter(preset.quickFilter || "all");
    if (preset.sections) {
      setActiveExpanded(preset.sections.activeExpanded);
      setArchivedExpanded(preset.sections.archivedExpanded);
    }
    setActivePreset(preset.name);
  }, [setActivePreset]);

  const savePreset = useCallback(
    (name: string) => {
      const newPreset: NotesViewPreset = {
        name,
        filters: {
          searchText: filters.searchText,
          assignedPeople: Array.from(filters.assignedPeople),
          sourcePeople: Array.from(filters.sourcePeople),
          mentionedPeople: Array.from(filters.mentionedPeople),
          projects: Array.from(filters.projects),
          tags: Array.from(filters.tags),
        },
        sortField,
        sortDirection,
        groupBy,
        quickFilter: activeQuickFilter,
        sections: {
          activeExpanded,
          archivedExpanded,
        },
      };

      setViewPresets((prev) => {
        const existing = prev.findIndex((p) => p.name === name);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newPreset;
          return updated;
        }
        return [...prev, newPreset];
      });

      setActivePreset(name);
      setIsSavePresetOpen(false);
      setPresetName("");
    },
    [
      setViewPresets,
      setActivePreset,
      setIsSavePresetOpen,
      setPresetName,
      filters,
      sortField,
      sortDirection,
      groupBy,
      activeQuickFilter,
      activeExpanded,
      archivedExpanded,
    ],
  );

  const deletePreset = useCallback(
    (name: string) => {
      setViewPresets((prev) => prev.filter((p) => p.name !== name));
      if (activePreset === name) {
        setActivePreset("custom");
      }
    },
    [activePreset, setViewPresets, setActivePreset],
  );

  // Selection handlers
  const toggleSelection = useCallback((noteId: string) => {
    setSelectedNoteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((noteIds: string[]) => {
    setSelectedNoteIds(new Set(noteIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNoteIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedNoteIds(new Set());
  }, []);




  // Create lookup maps for display names
  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    people.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [people]);

  const projectsMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [projects]);

  return {
    // Filter state
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    filterOptions,
    hasActiveFilters,

    // Sort state
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,

    // Group state
    groupBy,
    setGroupBy,

    // Quick filter state
    activeQuickFilter,
    setActiveQuickFilter,
    quickFilterCounts,

    // Section state
    activeExpanded,
    setActiveExpanded,
    archivedExpanded,
    setArchivedExpanded,

    // Preset state
    viewPresets,
    activePreset,
    isSavePresetOpen,
    setIsSavePresetOpen,
    presetName,
    setPresetName,

    // Drag mode state
    isDragMode,
    setIsDragMode,

    // Selection state
    isSelectionMode,
    setIsSelectionMode,
    selectedNoteIds,
    toggleSelection,
    selectAll,
    clearSelection,
    exitSelectionMode,

    // Expand state

    // Filter handlers
    handleFilterClick,
    handleSelectAll,
    handleClearAll,
    handleClearAllFilters,

    // Data transformation
    applyFilters,
    sortNotes,
    groupNotes,

    // Preset handlers
    loadPreset,
    savePreset,
    deletePreset,

    // Display name maps
    peopleMap,
    projectsMap,
  };
}
