"use client";

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
} from "react";
import { NoteItem } from "@/components/items/NoteItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterSection } from "@/components/shared/FilterSection";
import { UndoNotificationStack } from "@/components/shared/UndoNotificationStack";
import { NotesViewToolbar } from "@/components/shared/NotesViewToolbar";
import { SavePresetModal } from "@/components/shared/SavePresetModal";
import {
  CloseIcon,
  ArchiveIcon,
  TrashIcon,
  UndoIcon,
  CheckCircleIcon,
} from "@/components/shared/Icons";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { NoteModel } from "@/models/NoteModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { NoteId } from "@/types/note";
import { TodoModel } from "@/models/TodoModel";
import { TutorialStep } from "@/components/overlays/TutorialOverlay";
import { useNotesViewState, NotesFilters } from "@/hooks/useNotesViewState";
import { FeatureSettings, NotesSettings } from "@/types/settings";
import { MarkerColors, defaultMarkerColors } from "@/types/markerColors";
import { SearchHistoryEntry, SearchHistoryId } from "@/types/types";
import { NoteUndoAction } from "@/hooks/useNotes";
import { getTextColor } from "@/utils/colors";
import { ExportFormat } from "@/utils/export";

// Pin icon component
function PinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 5.25V3.75a.75.75 0 00-.75-.75h-6a.75.75 0 00-.75.75v1.5M12 12v6m-4.5-6h9l-1.5 6h-6l-1.5-6zm0 0V7.5a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5V12"
      />
    </svg>
  );
}

// Notes View Tutorial Steps
export const notesViewTutorialSteps: TutorialStep[] = [
  {
    id: "notes-intro",
    title: "Notes View",
    description:
      "Notes help you capture ideas, meeting notes, and information that isn't a task. Notes are more flexible than todos - no due dates or checkboxes needed.",
    position: "center",
  },
  {
    id: "notes-add",
    title: "Add Notes",
    description:
      'Click "Add Note" to create a new note. Notes support:\n\n- Rich text content\n- @mentions for people\n- %projects for organization\n- #tags for categorization',
    targetSelector: '[data-tutorial="add-note-button"]',
    position: "bottom",
    spotlightPadding: 8,
    fallbackHint: "The + Add Note button is at the top of the Notes view",
  },
  {
    id: "notes-filters",
    title: "Filter Notes",
    description:
      "Click the filter button to filter notes by:\n\n- People (assigned, source, mentioned)\n- Projects\n- Tags\n\nCombine filters to find exactly what you need.",
    targetSelector: '[data-tutorial="notes-filters"]',
    position: "bottom",
    spotlightPadding: 8,
    fallbackHint: "The filter button is in the toolbar next to search",
  },
  {
    id: "notes-content",
    title: "Rich Content",
    description:
      "Click on a note to open its detail view. The main content area supports rich text formatting - perfect for meeting notes, documentation, or brainstorming.",
    position: "center",
  },
  {
    id: "notes-action-items",
    title: "Action Items",
    description:
      'Notes can have action items - follow-up tasks from meetings. Add action items in the note detail view, then click "Create Todos" to convert them to real tasks!',
    position: "center",
  },
  {
    id: "notes-pin",
    title: "Pin Important Notes",
    description:
      "Pin notes to keep them at the top of the list. Pinned notes are always visible, perfect for frequently referenced information.",
    position: "center",
  },
  {
    id: "notes-convert",
    title: "Convert to Todo",
    description:
      "If a note becomes actionable, convert it to a todo! The note content becomes the todo's context, and all metadata is preserved.",
    position: "center",
  },
  {
    id: "notes-complete",
    title: "Ready!",
    description:
      "You're all set to use Notes! Remember: notes are for information, todos are for action. Use both together for effective task management.",
    position: "center",
  },
];

// Ref handle for exposing selection/drag state to parent
export interface NotesViewHandle {
  isSelectionMode: boolean;
  toggleSelectionMode: () => void;
  isDragMode: boolean;
  toggleDragMode: () => void;
  toggleFilters: () => void;
  focusSearch: () => void;
}

interface NotesViewProps {
  notes: NoteModel[];
  people: PersonModel[];
  projects: ProjectModel[];
  todos: TodoModel[];
  onOpenNote: (noteId: NoteId) => void;
  onDeleteNote: (id: NoteId) => void;
  onArchiveNote: (id: NoteId) => void;
  onUnarchiveNote: (id: NoteId) => void;
  onTogglePinned: (id: NoteId) => void;
  onConvertToTodo: (id: NoteId) => void;
  onReorderNotes?: (orderedIds: NoteId[]) => void;
  notesSettings?: NotesSettings;
  markerColors?: MarkerColors;
  features?: FeatureSettings;
  /** Ref for focus management from parent (keyboard shortcut "/") */
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  // Search history
  searchHistory?: SearchHistoryEntry[];
  addToSearchHistory?: (query: string) => void;
  removeFromSearchHistory?: (id: SearchHistoryId) => void;
  clearSearchHistory?: () => void;
  // Undo
  undoActions?: NoteUndoAction[];
  fadingOutIds?: Set<string>;
  undo?: (id: string) => void;
  dismissUndo?: (id: string) => void;
  // Export
  onExport?: (format: ExportFormat) => void;
}

export function NotesView({
  notes,
  people,
  projects,
  todos,
  onOpenNote,
  onDeleteNote,
  onArchiveNote,
  onUnarchiveNote,
  onTogglePinned,
  onConvertToTodo,
  onReorderNotes,
  markerColors = defaultMarkerColors,
  features,
  searchInputRef,
  searchHistory = [],
  addToSearchHistory = () => {},
  removeFromSearchHistory = () => {},
  clearSearchHistory = () => {},
  undoActions = [],
  fadingOutIds = new Set(),
  undo = () => {},
  dismissUndo = () => {},
  onExport = () => {},
  ref,
}: NotesViewProps & { ref?: React.Ref<NotesViewHandle> }) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || localInputRef;

  // Use the centralized state management hook
  const viewState = useNotesViewState({ notes, projects, people });

  const {
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    filterOptions,
    hasActiveFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    groupBy,
    setGroupBy,
    activeQuickFilter,
    setActiveQuickFilter,
    quickFilterCounts,
    activeExpanded,
    setActiveExpanded,
    archivedExpanded,
    setArchivedExpanded,
    viewPresets,
    activePreset,
    isSavePresetOpen,
    setIsSavePresetOpen,
    presetName,
    setPresetName,
    isDragMode,
    setIsDragMode,
    isSelectionMode,
    setIsSelectionMode,
    selectedNoteIds,
    toggleSelection,
    selectAll,
    clearSelection,
    exitSelectionMode,
    handleFilterClick,
    handleSelectAll,
    handleClearAll,
    handleClearAllFilters,
    applyFilters,
    sortNotes,
    groupNotes,
    loadPreset,
    savePreset,
    deletePreset,
    peopleMap,
    projectsMap,
  } = viewState;

  // Drag state
  const [dragOverNoteId, setDragOverNoteId] = useState<NoteId | null>(null);

  // Expose imperative handle
  useImperativeHandle(
    ref,
    () => ({
      isSelectionMode,
      toggleSelectionMode: () => setIsSelectionMode(!isSelectionMode),
      isDragMode,
      toggleDragMode: () => setIsDragMode(!isDragMode),
      toggleFilters: () => setShowFilters(!showFilters),
      focusSearch: () => inputRef.current?.focus(),
    }),
    [
      isSelectionMode,
      setIsSelectionMode,
      isDragMode,
      setIsDragMode,
      showFilters,
      setShowFilters,
      inputRef,
    ],
  );

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    if (isSelectionMode) {
      exitSelectionMode();
    } else {
      setIsSelectionMode(true);
    }
  }, [isSelectionMode, exitSelectionMode, setIsSelectionMode]);

  // Toggle drag mode
  const toggleDragMode = useCallback(() => {
    setIsDragMode(!isDragMode);
  }, [isDragMode, setIsDragMode]);

  // Apply filters, sort, and compute sections (must be defined before callbacks that use it)
  const filteredAndSortedNotes = useMemo(() => {
    const filtered = applyFilters(notes);
    return sortNotes(filtered);
  }, [notes, applyFilters, sortNotes]);

  // Selection handlers
  const handleSelectionChange = useCallback(
    (noteId: NoteId, selected: boolean) => {
      if (selected) {
        toggleSelection(noteId);
      } else {
        toggleSelection(noteId);
      }
    },
    [toggleSelection],
  );

  const selectAllVisible = useCallback(() => {
    const visibleIds = filteredAndSortedNotes
      .filter((n) => n.isActive)
      .map((n) => n.id);
    selectAll(visibleIds);
  }, [selectAll, filteredAndSortedNotes]);

  // Bulk actions
  const bulkArchive = useCallback(() => {
    selectedNoteIds.forEach((id) => {
      const note = notes.find((n) => n.id === id);
      if (note?.isActive) {
        onArchiveNote(id as NoteId);
      }
    });
    clearSelection();
  }, [selectedNoteIds, notes, onArchiveNote, clearSelection]);

  const bulkUnarchive = useCallback(() => {
    selectedNoteIds.forEach((id) => {
      const note = notes.find((n) => n.id === id);
      if (note?.isArchived) {
        onUnarchiveNote(id as NoteId);
      }
    });
    clearSelection();
  }, [selectedNoteIds, notes, onUnarchiveNote, clearSelection]);

  const bulkDelete = useCallback(() => {
    selectedNoteIds.forEach((id) => {
      onDeleteNote(id as NoteId);
    });
    clearSelection();
  }, [selectedNoteIds, onDeleteNote, clearSelection]);

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, noteId: NoteId) => {
      if (!isDragMode) return;
      e.dataTransfer.setData("text/plain", noteId);
      e.dataTransfer.effectAllowed = "move";
    },
    [isDragMode],
  );

  const handleDragEnd = useCallback(() => {
    setDragOverNoteId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, noteId: NoteId) => {
      if (!isDragMode) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverNoteId(noteId);
    },
    [isDragMode],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverNoteId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetNoteId: NoteId) => {
      if (!isDragMode || !onReorderNotes) return;
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain") as NoteId;
      if (draggedId === targetNoteId) return;

      // Build new order
      const activeNoteIds = filteredAndSortedNotes
        .filter((n) => n.isActive)
        .map((n) => n.id);
      const fromIndex = activeNoteIds.indexOf(draggedId);
      const toIndex = activeNoteIds.indexOf(targetNoteId);

      if (fromIndex >= 0 && toIndex >= 0) {
        const newOrder = [...activeNoteIds];
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, draggedId);
        onReorderNotes(newOrder);
      }

      setDragOverNoteId(null);
    },
    [isDragMode, onReorderNotes, filteredAndSortedNotes],
  );

  // Split into active and archived
  const activeNotes = useMemo(
    () => filteredAndSortedNotes.filter((n) => n.isActive),
    [filteredAndSortedNotes],
  );

  const archivedNotes = useMemo(
    () => filteredAndSortedNotes.filter((n) => n.isArchived),
    [filteredAndSortedNotes],
  );

  // Group active notes
  const groupedActiveNotes = useMemo(
    () => groupNotes(activeNotes),
    [activeNotes, groupNotes],
  );

  // Count active and archived notes (unfiltered)
  const activeCount = notes.filter((n) => n.isActive).length;
  const archivedCount = notes.filter((n) => n.isArchived).length;

  // Filter button colors
  const getFilterButtonColor = (
    type: keyof Omit<NotesFilters, "searchText">,
    _value: string,
    isSelected: boolean,
  ): string => {
    const baseClasses = "px-2 py-1 text-xs rounded-full transition-all border";

    if (isSelected) {
      return `${baseClasses} border-transparent`;
    }
    return `${baseClasses} bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700`;
  };

  const getFilterButtonStyle = (
    type: keyof Omit<NotesFilters, "searchText">,
    _value: string,
    isSelected: boolean,
  ): React.CSSProperties | undefined => {
    if (!isSelected) return undefined;

    // Use marker colors
    let bgColor: string;
    if (type === "assignedPeople") {
      bgColor = markerColors.assigned;
    } else if (type === "sourcePeople") {
      bgColor = markerColors.source;
    } else if (type === "mentionedPeople") {
      bgColor = markerColors.mentioned;
    } else if (type === "projects") {
      bgColor = markerColors.project;
    } else if (type === "tags") {
      bgColor = markerColors.tag;
    } else {
      bgColor = markerColors.assigned;
    }

    return {
      backgroundColor: bgColor,
      color: getTextColor(bgColor),
    };
  };

  // Render note item with all props
  const renderNoteItem = (note: NoteModel) => (
    <li key={note.id}>
      <NoteItem
        note={note}
        onClick={() => onOpenNote(note.id)}
        onDelete={onDeleteNote}
        onArchive={onArchiveNote}
        onUnarchive={onUnarchiveNote}
        onTogglePinned={onTogglePinned}
        onConvertToTodo={onConvertToTodo}
        isSelectionMode={isSelectionMode}
        isSelected={selectedNoteIds.has(note.id)}
        onSelectionChange={handleSelectionChange}
        isDraggable={isDragMode && note.isActive}
        isDraggedOver={dragOverNoteId === note.id}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        peopleMap={peopleMap}
        projectsMap={projectsMap}
        markerColors={markerColors}
        todos={todos}
        availablePeople={people}
        availableProjects={projects}
      />
    </li>
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Notes
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {filteredAndSortedNotes.length} of {activeCount} note
            {activeCount !== 1 ? "s" : ""}
            {archivedCount > 0 && ` (${archivedCount} archived)`}
            {hasActiveFilters && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                • Filters active
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 space-y-3">
        <NotesViewToolbar
          filters={filters}
          setFilters={setFilters}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          sortField={sortField}
          setSortField={setSortField}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          viewPresets={viewPresets}
          activePreset={activePreset}
          onLoadPreset={loadPreset}
          onOpenSavePreset={() => setIsSavePresetOpen(true)}
          searchHistory={searchHistory}
          addToSearchHistory={addToSearchHistory}
          removeFromSearchHistory={removeFromSearchHistory}
          clearSearchHistory={clearSearchHistory}
          features={features}
          notesCount={notes.length}
          isSelectionMode={isSelectionMode}
          toggleSelectionMode={toggleSelectionMode}
          isDragMode={isDragMode}
          toggleDragMode={toggleDragMode}
          onExport={onExport}
          searchInputRef={inputRef}
        />

        {/* Filter sections */}
        {showFilters && (
          <div
            className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 lg:p-4 space-y-2 lg:space-y-3"
            data-tutorial="notes-filters"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-x-6 lg:gap-y-4 [&>*]:lg:pl-6 [&>*]:lg:border-l [&>*]:lg:border-zinc-200 [&>*]:dark:lg:border-zinc-700 [&>*:first-child]:lg:pl-0 [&>*:first-child]:lg:border-l-0 [&>*:nth-child(2n+1)]:lg:pl-0 [&>*:nth-child(2n+1)]:lg:border-l-0 [&>*:nth-child(2n+1)]:xl:pl-6 [&>*:nth-child(2n+1)]:xl:border-l [&>*:nth-child(3n+1)]:xl:pl-0 [&>*:nth-child(3n+1)]:xl:border-l-0">
              <FilterSection
                label="Assigned (@)"
                activeCount={filters.assignedPeople.size}
                options={filterOptions.assignedPeople}
                selectedValues={filters.assignedPeople}
                onToggle={(value) => handleFilterClick("assignedPeople", value)}
                onSelectAll={() => handleSelectAll("assignedPeople")}
                onClear={() => handleClearAll("assignedPeople")}
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("assignedPeople", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("assignedPeople", value, isSelected)
                }
                formatLabel={(id) => peopleMap.get(id) || id}
              />

              <FilterSection
                label="Source ($)"
                activeCount={filters.sourcePeople.size}
                options={filterOptions.sourcePeople}
                selectedValues={filters.sourcePeople}
                onToggle={(value) => handleFilterClick("sourcePeople", value)}
                onSelectAll={() => handleSelectAll("sourcePeople")}
                onClear={() => handleClearAll("sourcePeople")}
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("sourcePeople", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("sourcePeople", value, isSelected)
                }
                formatLabel={(id) => peopleMap.get(id) || id}
              />

              <FilterSection
                label="Mentioned"
                activeCount={filters.mentionedPeople.size}
                options={filterOptions.mentionedPeople}
                selectedValues={filters.mentionedPeople}
                onToggle={(value) =>
                  handleFilterClick("mentionedPeople", value)
                }
                onSelectAll={() => handleSelectAll("mentionedPeople")}
                onClear={() => handleClearAll("mentionedPeople")}
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("mentionedPeople", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("mentionedPeople", value, isSelected)
                }
                formatLabel={(id) => peopleMap.get(id) || id}
              />

              <FilterSection
                label="Projects (%)"
                activeCount={filters.projects.size}
                options={filterOptions.projects}
                selectedValues={filters.projects}
                onToggle={(value) => handleFilterClick("projects", value)}
                onSelectAll={() => handleSelectAll("projects")}
                onClear={() => handleClearAll("projects")}
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("projects", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("projects", value, isSelected)
                }
                formatLabel={(id) => projectsMap.get(id) || id}
              />

              <FilterSection
                label="Tags (#)"
                activeCount={filters.tags.size}
                options={filterOptions.tags}
                selectedValues={filters.tags}
                onToggle={(value) => handleFilterClick("tags", value)}
                onSelectAll={() => handleSelectAll("tags")}
                onClear={() => handleClearAll("tags")}
                getButtonColor={(value, isSelected) =>
                  getFilterButtonColor("tags", value, isSelected)
                }
                getButtonStyle={(value, isSelected) =>
                  getFilterButtonStyle("tags", value, isSelected)
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Toolbar */}
      {isSelectionMode && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {selectedNoteIds.size} selected
            </span>
            <button
              onClick={selectAllVisible}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select all
            </button>
            <button
              onClick={clearSelection}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex-1" />
          <div className="flex flex-wrap gap-2">
            {/* Archive - only for active notes */}
            {notes.some((n) => n.isActive && selectedNoteIds.has(n.id)) && (
              <button
                onClick={bulkArchive}
                className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors flex items-center gap-1.5"
              >
                <ArchiveIcon className="w-4 h-4" />
                Archive
              </button>
            )}
            {/* Unarchive - only for archived notes */}
            {notes.some((n) => n.isArchived && selectedNoteIds.has(n.id)) && (
              <button
                onClick={bulkUnarchive}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1.5"
              >
                <UndoIcon className="w-4 h-4" />
                Restore
              </button>
            )}
            {/* Delete - always available when items selected */}
            {selectedNoteIds.size > 0 && (
              <button
                onClick={bulkDelete}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center gap-1.5"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <button
            onClick={toggleSelectionMode}
            className="ml-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            title="Exit selection mode"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Quick Filters Bar */}
      {notes.length > 0 && !isSelectionMode && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveQuickFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeQuickFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            All ({quickFilterCounts.all})
          </button>
          <button
            onClick={() => setActiveQuickFilter("pinned")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
              activeQuickFilter === "pinned"
                ? "bg-amber-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            <PinIcon className="w-4 h-4" />
            Pinned ({quickFilterCounts.pinned})
          </button>
          {quickFilterCounts.hasActionItems > 0 && (
            <button
              onClick={() => setActiveQuickFilter("hasActionItems")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                activeQuickFilter === "hasActionItems"
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <CheckCircleIcon className="w-4 h-4" />
              Has Actions ({quickFilterCounts.hasActionItems})
            </button>
          )}
          {quickFilterCounts.archived > 0 && (
            <button
              onClick={() => setActiveQuickFilter("archived")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                activeQuickFilter === "archived"
                  ? "bg-zinc-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <ArchiveIcon className="w-4 h-4" />
              Archived ({quickFilterCounts.archived})
            </button>
          )}

          {/* Clear All button - shown when any filter is active */}
          {hasActiveFilters && (
            <>
              <div className="flex-1" />
              <button
                onClick={handleClearAllFilters}
                className="px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200"
                title="Clear all filters"
              >
                <CloseIcon className="w-4 h-4" />
                Clear All
              </button>
            </>
          )}
        </div>
      )}

      {/* Notes List Content */}
      {notes.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="No Notes"
          message="No notes yet. Add one to capture ideas, meeting notes, or any information you want to remember!"
        />
      ) : filteredAndSortedNotes.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="No Results"
          message={
            hasActiveFilters
              ? "No notes match your filters. Try adjusting or clearing some filters."
              : "No notes match your search."
          }
        />
      ) : (
        <div className="space-y-4" data-tutorial="notes-list">
          {/* Active Notes Section */}
          {activeNotes.length > 0 && activeQuickFilter !== "archived" && (
            <SectionHeader
              title="Active"
              count={activeNotes.length}
              expanded={activeExpanded}
              onToggle={() => setActiveExpanded(!activeExpanded)}
            >
              <div className="space-y-4">
                {Object.entries(groupedActiveNotes).map(
                  ([groupName, groupNotes]) => (
                    <div key={groupName || "ungrouped"}>
                      {groupName && (
                        <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-wide mb-2 pl-2">
                          {groupName} ({groupNotes.length})
                        </h3>
                      )}
                      <ul className="space-y-2">
                        {groupNotes.map(renderNoteItem)}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            </SectionHeader>
          )}

          {/* Archived Notes Section */}
          {archivedNotes.length > 0 &&
            (activeQuickFilter === "archived" ||
              activeQuickFilter === "all") && (
              <SectionHeader
                title="Archived"
                count={archivedNotes.length}
                expanded={archivedExpanded}
                onToggle={() => setArchivedExpanded(!archivedExpanded)}
              >
                <ul className="space-y-2">
                  {archivedNotes.map(renderNoteItem)}
                </ul>
              </SectionHeader>
            )}
        </div>
      )}

      {/* Save Preset Modal */}
      <SavePresetModal
        isOpen={isSavePresetOpen}
        onClose={() => setIsSavePresetOpen(false)}
        presetName={presetName}
        onPresetNameChange={setPresetName}
        onSave={savePreset}
        onDelete={deletePreset}
        viewPresets={viewPresets}
      />

      {/* Undo Notifications */}
      <UndoNotificationStack
        actions={undoActions.map((a) => ({
          id: a.id,
          type: a.type,
          displayText: a.entity.plainText,
        }))}
        fadingOutIds={fadingOutIds}
        onUndo={undo}
        onDismiss={dismissUndo}
        getMessage={(type) => {
          if (type === "delete") return "Note deleted";
          if (type === "archive") return "Note archived";
          return "Action completed";
        }}
      />
    </>
  );
}
