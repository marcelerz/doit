"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTodos } from "@/hooks/useTodos";
import { useNotes } from "@/hooks/useNotes";
import { useReviews } from "@/hooks/useReviews";
import { useSettings } from "@/hooks/useSettings";
import { usePeople } from "@/hooks/usePeople";
import { useProjects } from "@/hooks/useProjects";
import { useTemplates } from "@/hooks/useTemplates";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useSprints } from "@/hooks/useSprints";
import { useTaskNotifications } from "@/hooks/useTaskNotifications";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import { GanttView, ganttViewTutorialSteps } from "./GanttView";
import { CalendarView, calendarViewTutorialSteps } from "./CalendarView";
import { KanbanView, kanbanViewTutorialSteps } from "./KanbanView";
import { listViewTutorialSteps } from "./ListView";
import { ListView, ListViewHandle } from "./ListView";
import { StatisticsView } from "./StatisticsView";
import { FocusView } from "./FocusView";
import { OpenFocusView } from "./OpenFocusView";
import TimeReportsView from "./TimeReportsView";
import { ScheduledTask } from "@/utils/ganttScheduler";
import { MarkerReference } from "@/components/shared/MarkerReference";
import { TodoDetailsOverlay } from "@/components/overlays/TodoDetailsOverlay";
import { PersonDetailsOverlay } from "@/components/overlays/PersonDetailsOverlay";
import { ProjectDetailsOverlay } from "@/components/overlays/ProjectDetailsOverlay";
import { SprintDetailsOverlay } from "@/components/overlays/SprintDetailsOverlay";
import { HelpOverlay } from "@/components/overlays/HelpOverlay";
import { TutorialOverlay, mainTutorialSteps, TutorialStep } from "@/components/overlays/TutorialOverlay";
import { ViewTabs } from "@/components/shared/ViewTabs";
import { ViewTab, getEnabledViews, VIEW_DEFINITIONS } from "@/types/viewRegistry";
import { usePersistedViewOptions } from "@/hooks/usePersistedViewOptions";
import { PeopleView, peopleViewTutorialSteps } from "@/components/views/PeopleView";
import { ProjectsView, projectsViewTutorialSteps } from "@/components/views/ProjectsView";
import { SprintsView, sprintsViewTutorialSteps } from "@/components/views/SprintsView";
import { NotesView, notesViewTutorialSteps } from "@/components/views/NotesView";
import { ReviewsView, reviewsViewTutorialSteps } from "@/components/views/ReviewsView";
import { ReviewEditView } from "@/components/views/ReviewEditView";
import { ReviewDetailView } from "@/components/views/ReviewDetailView";
import { NoteDetailView } from "@/components/views/NoteDetailView";
import { NoteAddModal } from "@/components/overlays/NoteAddModal";
import { NoteId } from "@/types/note";
import { ReviewId, ReviewLevel } from "@/types/review";
import { useSelectionHistory, sortByUsage, sortStringsByUsage } from "@/hooks/useSelectionHistory";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { normalizeDateValue } from "@/utils/dateUtils";
import { TemplatesManager, CreateTemplateModal } from "@/components/shared/Templates";
import { TodoTemplate, TodoTemplateId } from "@/types/todoTemplate";
import { TodoId } from "@/types/todo";
import { getColor } from "@/types/types";
import { parseTokensToMetadata } from "@/utils/tokenParser";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";
import { CloseIcon, SettingsIcon, HelpIcon, DocumentIcon, CheckCircleIcon } from "@/components/shared/Icons";
import { AlternativesInput } from "@/components/shared/AlternativesInput";
import { exportNotes } from "@/utils/export";
import { StorageRecoveryScreen } from "@/components/shared/StorageRecoveryScreen";
import { StorageErrorBanner } from "@/components/shared/StorageErrorBanner";
import {
  generateOneOnOneNoteTitle,
  generateMeetingNoteTitle,
  generateOneOnOneNoteContent,
  generateMeetingNoteContent,
} from "@/utils/noteTemplates";

export function TodoApp() {
  const {
    todos,
    addTodo,
    duplicateTodo,
    toggleTodo,
    deleteTodo,
    archiveTodo,
    unarchiveTodo,
    editTodo,
    addTodoComment,
    reorderTodos,
    addSubtask,
    toggleSubtask,
    editSubtask,
    deleteSubtask,
    startTimeTracking,
    stopTimeTracking,
    addManualTimeEntry,
    deleteTimeEntry,
    setWorkflowState,
    isLoaded,
    loadError,
    undoActions,
    fadingOutIds,
    dependencyBlockNotification,
    undo,
    dismissUndo,
  } = useTodos();
  const { settings, addPriority, updateGantt, updateKanbanSettings } = useSettings();

  // Task notifications for due/overdue tasks
  useTaskNotifications(todos, settings.notifications);

  // Feature settings with defaults
  const features = settings.features;

  const {
    people,
    addPerson,
    updatePerson,
    deletePerson,
    archivePerson,
    unarchivePerson,
    addPersonComment,
    editPersonComment,
    deletePersonComment,
  } = usePeople();

  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    addProjectComment,
    editProjectComment,
    deleteProjectComment,
  } = useProjects();

  const {
    sprints,
    runningSprint,
    nextPlannedSprint,
    addSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    completeSprint,
    cancelSprint,
    archiveSprint,
    unarchiveSprint,
    addSprintComment,
    editSprintComment,
    deleteSprintComment,
  } = useSprints();

  // Notes hook
  const {
    notes,
    find: findNote,
    addNote,
    editNote,
    deleteNote,
    archiveNote,
    unarchiveNote,
    togglePinned: toggleNotePinned,
    reorderNotes,
    addNoteComment,
    editNoteComment,
    deleteNoteComment,
    addActionItem,
    editActionItem,
    deleteActionItem,
    convertActionItemsToTodos,
    convertToTodo: convertNoteToTodo,
    duplicateNote,
    isLoaded: _notesLoaded,
    undoActions: noteUndoActions,
    fadingOutIds: noteFadingOutIds,
    undo: undoNote,
    dismissUndo: dismissNoteUndo,
  } = useNotes();

  // Reviews hook
  const {
    reviews,
    rawReviews,
    find: findReview,
    addReview,
    editReview,
    completeReview,
    deleteReview,
    archiveReview,
    unarchiveReview,
    addEntry: addReviewEntry,
    updateEntry: updateReviewEntry,
    removeEntry: removeReviewEntry,
    toggleEntryCollapsed: toggleReviewEntryCollapsed,
    undoActions: reviewUndoActions,
    fadingOutIds: reviewFadingOutIds,
    undo: undoReview,
    dismissUndo: dismissReviewUndo,
  } = useReviews();

  // Templates and search history hooks
  const { templates, addTemplate, deleteTemplate, incrementUsage } = useTemplates();

  const {
    history: searchHistory,
    addToHistory: addToSearchHistory,
    removeFromHistory: removeFromSearchHistory,
    clearHistory: clearSearchHistory,
  } = useSearchHistory();

  const [currentTokens, setCurrentTokens] = useState<TokenMatch[]>([]);
  const [currentFullText, setCurrentFullText] = useState("");
  const [currentPlainText, setCurrentPlainText] = useState("");
  const smartInputRef = useRef<SmartEditableInputHandle>(null);
  const peopleSearchInputRef = useRef<HTMLInputElement>(null);
  const projectsSearchInputRef = useRef<HTMLInputElement>(null);
  const sprintsSearchInputRef = useRef<HTMLInputElement>(null);
  const listViewRef = useRef<ListViewHandle>(null);
  const notesViewRef = useRef<import("@/components/views/NotesView").NotesViewHandle>(null);

  // Active view state - initialized with default, loaded from UI_OPTIONS in useEffect
  const [activeView, setActiveView] = useState<ViewTab>("list");

  // Template state
  const [showTemplatesManager, setShowTemplatesManager] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateTodoId, setTemplateTodoId] = useState<TodoId | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<TodoTemplateId | null>(null);

  // Get the active template object
  const activeTemplate = activeTemplateId ? templates.find((t) => t.id === activeTemplateId) : null;

  // Redirect to list view if current view is disabled
  useEffect(() => {
    const viewFeatureMap: Record<string, boolean | undefined> = {
      kanban: features?.kanbanView,
      gantt: features?.ganttView,
      calendar: features?.calendarView,
      notes: features?.notesView,
      sprints: features?.sprintsView,
      reviews: features?.reviewsView,
      stats: features?.statsView,
    };

    if (activeView in viewFeatureMap && viewFeatureMap[activeView] === false) {
      setActiveView("list");
    }
  }, [activeView, features]);

  // Use selection history hook for tracking selections and providing usage stats
  const { usageStats, recordSelections } = useSelectionHistory();

  // Combine all person usage stats (assigned + source + mentioned) for unified sorting
  const combinedPeopleUsage = useMemo(() => {
    const combined = new Map<string, number>();

    // Add assigned people stats
    usageStats.assignedPeople.forEach((count, name) => {
      combined.set(name, (combined.get(name) || 0) + count);
    });

    // Add source people stats
    usageStats.sourcePeople.forEach((count, name) => {
      combined.set(name, (combined.get(name) || 0) + count);
    });

    // Add mentioned people stats
    usageStats.mentionedPeople.forEach((count, name) => {
      combined.set(name, (combined.get(name) || 0) + count);
    });

    return combined;
  }, [usageStats]);

  // Sort people, projects, and priorities by usage frequency, filtering out archived items for selection
  const sortedPeople = useMemo(() => {
    return sortByUsage(
      people.filter((p) => !p.archived),
      combinedPeopleUsage,
    );
  }, [people, combinedPeopleUsage]);

  const sortedProjects = useMemo(() => {
    return sortByUsage(
      projects.filter((p) => !p.archived),
      usageStats.projects,
    );
  }, [projects, usageStats.projects]);

  const sortedPriorities = useMemo(() => {
    return sortByUsage(settings.priorities, usageStats.priorities);
  }, [settings.priorities, usageStats.priorities]);

  // Get all unique tags from todos and sort by usage
  const sortedTags = useMemo(() => {
    const allTags = new Set<string>();
    todos.forEach((todo) => {
      todo.tags.forEach((tag) => allTags.add(tag));
    });
    return sortStringsByUsage(Array.from(allTags), usageStats.tags);
  }, [todos, usageStats.tags]);

  // All people and projects (including archived) for display in their tabs
  const allPeople = useMemo(() => {
    return sortByUsage(people, combinedPeopleUsage);
  }, [people, combinedPeopleUsage]);

  const allProjects = useMemo(() => {
    return sortByUsage(projects, usageStats.projects);
  }, [projects, usageStats.projects]);

  // Calculate todo and note counts for people and projects
  // Count all relationship types: assigned, sourced, and mentioned
  // Returns: { activeTodos, closedTodos, activeNotes, archivedNotes }
  type EntityCounts = { activeTodos: number; closedTodos: number; activeNotes: number; archivedNotes: number };

  const countsByPerson = useMemo(() => {
    const counts = new Map<string, EntityCounts>();

    const getOrCreate = (personId: string): EntityCounts => {
      if (!counts.has(personId)) {
        counts.set(personId, { activeTodos: 0, closedTodos: 0, activeNotes: 0, archivedNotes: 0 });
      }
      return counts.get(personId)!;
    };

    const countPersonNames = (personNames: string[], field: keyof EntityCounts) => {
      personNames.forEach((personName) => {
        const person = people.find((p) => p.matchesAnyName([personName]));
        if (person) {
          getOrCreate(person.id)[field]++;
        }
      });
    };

    // Count todos
    todos.forEach((todo) => {
      const field: keyof EntityCounts = todo.isActive ? "activeTodos" : "closedTodos";
      countPersonNames(todo.assignedPeople, field);
      countPersonNames(todo.sourcePeople, field);
      countPersonNames(todo.mentionedPeople, field);
    });

    // Count notes
    notes.forEach((note) => {
      const field: keyof EntityCounts = note.isArchived ? "archivedNotes" : "activeNotes";
      const personNames = [
        ...note.assignedPeopleIds.map((id) => id as string),
        ...note.sourcePeopleIds.map((id) => id as string),
        ...note.mentionedPeopleIds.map((id) => id as string),
      ];
      personNames.forEach((personName) => {
        const person = people.find((p) => p.matchesAnyName([personName]));
        if (person) {
          getOrCreate(person.id)[field]++;
        }
      });
    });

    return counts;
  }, [todos, notes, people]);

  const countsByProject = useMemo(() => {
    const counts = new Map<string, EntityCounts>();

    const getOrCreate = (projectId: string): EntityCounts => {
      if (!counts.has(projectId)) {
        counts.set(projectId, { activeTodos: 0, closedTodos: 0, activeNotes: 0, archivedNotes: 0 });
      }
      return counts.get(projectId)!;
    };

    // Count todos
    todos.forEach((todo) => {
      const field: keyof EntityCounts = todo.isActive ? "activeTodos" : "closedTodos";
      todo.projects.forEach((projectName) => {
        const project = projects.find((p) => p.matchesAnyName([projectName]));
        if (project) {
          getOrCreate(project.id)[field]++;
        }
      });
    });

    // Count notes
    notes.forEach((note) => {
      const field: keyof EntityCounts = note.isArchived ? "archivedNotes" : "activeNotes";
      note.projectIds.forEach((projectId) => {
        const project = projects.find((p) => p.matchesAnyName([projectId as string]));
        if (project) {
          getOrCreate(project.id)[field]++;
        }
      });
    });

    return counts;
  }, [todos, notes, projects]);

  // Wrapper functions to convert name string to object format
  const handleAddPerson = (name: string) => {
    addPerson({
      name,
      alternatives: [],
      color: settings.markerColors.assigned, // Use marker color from settings
    });
  };

  const handleAddProject = (name: string) => {
    addProject({
      name,
      alternatives: [],
      color: settings.markerColors.project, // Use marker color from settings
    });
  };

  const handleAddPriority = (name: string) => {
    addPriority({
      name,
      alternatives: [],
      color: settings.markerColors.priority, // Use marker color from settings
      order: settings.priorities.length + 1,
    });
  };

  // Template handling
  const handleCreateTemplate = (todoId: TodoId) => {
    setTemplateTodoId(todoId);
    setShowCreateTemplate(true);
  };

  const handleSaveTemplate = (
    name: string,
    description: string | undefined,
    selectedFields: {
      text: boolean;
      assignedPeople: boolean;
      sourcePeople: boolean;
      projects: boolean;
      priority: boolean;
      tags: boolean;
      dueDate: boolean;
      duration: boolean;
      subtasks: boolean;
    },
  ) => {
    const todo = todos.find((t) => t.id === templateTodoId);
    if (todo) {
      addTemplate({
        name,
        description,
        text: selectedFields.text ? todo.text : "",
        plainText: selectedFields.text ? todo.plainText : "",
        metadata: {
          assignedPeople: selectedFields.assignedPeople ? [...todo.metadata.assignedPeople] : [],
          sourcePeople: selectedFields.sourcePeople ? [...todo.metadata.sourcePeople] : [],
          mentionedPeople: [], // Don't copy mentioned people - they're auto-detected
          projects: selectedFields.projects ? [...todo.metadata.projects] : [],
          dependencies: [], // Don't copy dependencies
          priority: selectedFields.priority ? todo.metadata.priority : undefined,
          tags: selectedFields.tags ? [...(todo.metadata.tags ?? [])] : [],
          dueDate: selectedFields.dueDate ? todo.metadata.dueDate : undefined,
          duration: selectedFields.duration ? todo.metadata.duration : undefined,
        },
        subtasks: selectedFields.subtasks ? todo.subtasks?.map((s) => s.text) : undefined,
      });
    }
    setTemplateTodoId(null);
    setShowCreateTemplate(false);
  };

  const handleApplyTemplate = (template: TodoTemplate) => {
    incrementUsage(template.id);
    // Set the smart input with template content
    if (smartInputRef.current) {
      smartInputRef.current.setValue(template.text);
    }
    // Set this as the active template
    setActiveTemplateId(template.id);
    setShowTemplateDropdown(false);
  };

  const clearActiveTemplate = () => {
    setActiveTemplateId(null);
    if (smartInputRef.current) {
      smartInputRef.current.setValue("");
    }
  };

  // Focus mode state
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isOpenFocusMode, setIsOpenFocusMode] = useState(false);
  const [focusTasks, setFocusTasks] = useState<ScheduledTask[]>([]);
  const [ganttRefreshKey, setGanttRefreshKey] = useState(0);

  // UI state

  const [uiOptions, setUiOptions, uiOptionsLoaded] = usePersistedViewOptions<{ activeTab?: ViewTab }>(
    STORAGE_KEYS.UI_OPTIONS,
    {},
  );
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialChecked, setTutorialChecked] = useState(false);
  const [viewTutorialOpen, setViewTutorialOpen] = useState<string | null>(null); // Which view tutorial is open

  // Restore the last active tab. The hand-written list of valid tabs this
  // replaced omitted notes, reviews and focus, so a user whose last view was
  // Notes was silently returned to the default one. VIEW_DEFINITIONS is the
  // authoritative list, which is what it exists for.
  useEffect(() => {
    if (!uiOptionsLoaded) return;
    const saved = uiOptions.activeTab;
    if (saved && VIEW_DEFINITIONS.some((view) => view.id === saved)) {
      setActiveView(saved);
    }
    // Only on the first load: afterwards this state is driven by the tab bar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiOptionsLoaded]);

  // Persist the active tab.
  useEffect(() => {
    if (!uiOptionsLoaded) return;
    setUiOptions({ activeTab: activeView });
  }, [uiOptionsLoaded, activeView, setUiOptions]);

  // Check tutorial preferences on first load
  useEffect(() => {
    if (!uiOptionsLoaded || tutorialChecked) return;

    loadFromStorage<{ completed?: boolean; showOnStartup?: boolean }>(STORAGE_KEYS.TUTORIAL_PREFERENCES, {}).then(
      (prefs) => {
        setTutorialChecked(true);
        // Show tutorial if never completed, or if user chose to see it again
        if (!prefs.completed || prefs.showOnStartup) {
          // Delay slightly to let the UI settle
          setTimeout(() => {
            setIsTutorialOpen(true);
          }, 500);
        }
      },
    );
  }, [uiOptionsLoaded, tutorialChecked]);

  // Handle tutorial completion
  const handleTutorialComplete = useCallback((showAgain: boolean) => {
    setIsTutorialOpen(false);
    saveToStorage(STORAGE_KEYS.TUTORIAL_PREFERENCES, {
      completed: true,
      showOnStartup: showAgain,
      lastCompletedAt: new Date().toISOString(),
    });
  }, [setIsTutorialOpen]);

  // Get tutorial steps for a specific view
  const getViewTutorialSteps = useCallback((view: string): TutorialStep[] => {
    switch (view) {
      case "list":
        return listViewTutorialSteps;
      case "kanban":
        return kanbanViewTutorialSteps;
      case "gantt":
        return ganttViewTutorialSteps;
      case "calendar":
        return calendarViewTutorialSteps;
      case "notes":
        return notesViewTutorialSteps;
      case "reviews":
        return reviewsViewTutorialSteps;
      case "people":
        return peopleViewTutorialSteps;
      case "projects":
        return projectsViewTutorialSteps;
      case "sprints":
        return sprintsViewTutorialSteps;
      default:
        return [];
    }
  }, []);

  // Handle view tutorial completion
  const handleViewTutorialComplete = useCallback(() => {
    setViewTutorialOpen(null);
  }, [setViewTutorialOpen]);

  // Details overlay state
  const [detailsOverlayTodo, setDetailsOverlayTodo] = useState<(typeof todos)[0] | null>(null);
  const [detailsOverlayPersonId, setDetailsOverlayPersonId] = useState<string | null>(null);
  const [detailsOverlayProjectId, setDetailsOverlayProjectId] = useState<string | null>(null);
  const [detailsOverlaySprintId, setDetailsOverlaySprintId] = useState<string | null>(null);

  // Add todo overlay state
  const [isAddOverlayOpen, setIsAddOverlayOpen] = useState(false);
  const [isAddPersonOverlayOpen, setIsAddPersonOverlayOpen] = useState(false);
  const [isAddProjectOverlayOpen, setIsAddProjectOverlayOpen] = useState(false);
  const [isAddSprintOverlayOpen, setIsAddSprintOverlayOpen] = useState(false);
  const [isAddNoteOverlayOpen, setIsAddNoteOverlayOpen] = useState(false);
  // Alternatives state for add overlays (using AlternativesInput component)
  const [addPersonAlternatives, setAddPersonAlternatives] = useState<string[]>([]);
  const [addProjectAlternatives, setAddProjectAlternatives] = useState<string[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<NoteId | null>(null);
  const [focusNoteContentOnOpen, setFocusNoteContentOnOpen] = useState(false);
  const notesSearchInputRef = useRef<HTMLInputElement>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<ReviewId | null>(null);
  const [isHelpOverlayOpen, setIsHelpOverlayOpen] = useState(false);

  // Handler for creating a 1:1 note from a person
  const handleCreatePersonNote = useCallback(
    (personId: string) => {
      const person = people.find((p) => p.id === personId);
      if (!person) return;

      // Generate title and content from settings templates
      const title = generateOneOnOneNoteTitle(person.name);
      const content = generateOneOnOneNoteContent(settings.notes.oneOnOneTemplate);

      // Create the note with the person pre-selected
      const noteId = addNote(title, title, {
        assignedPeople: [person.name],
        sourcePeople: [],
        mentionedPeople: [],
        projects: [],
        tags: [],
        content,
      });

      // Navigate to the Notes view and select the new note
      setActiveView("notes");
      setSelectedNoteId(noteId);
      setFocusNoteContentOnOpen(true);
    },
    [people, settings.notes.oneOnOneTemplate, addNote, setSelectedNoteId, setFocusNoteContentOnOpen],
  );

  // Handler for creating a meeting note from a project
  const handleCreateProjectNote = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      // Generate title and content from settings templates
      const title = generateMeetingNoteTitle(project.name);
      const content = generateMeetingNoteContent(settings.notes.meetingNoteTemplate);

      // Create the note with the project pre-selected
      const noteId = addNote(title, title, {
        assignedPeople: [],
        sourcePeople: [],
        mentionedPeople: [],
        projects: [project.name],
        tags: [],
        content,
      });

      // Navigate to the Notes view and select the new note
      setActiveView("notes");
      setSelectedNoteId(noteId);
      setFocusNoteContentOnOpen(true);
    },
    [projects, settings.notes.meetingNoteTemplate, addNote, setSelectedNoteId, setFocusNoteContentOnOpen],
  );

  // Restart tutorial (called from HelpOverlay)
  const handleRestartTutorial = useCallback(() => {
    setIsHelpOverlayOpen(false);
    setTimeout(() => {
      setIsTutorialOpen(true);
    }, 300);
  }, [setIsHelpOverlayOpen, setIsTutorialOpen]);

  // Confirm dialog hook
  const { showConfirmDialog, hideConfirmDialog: _hideConfirmDialog, ConfirmDialogComponent } = useConfirmDialog();

  // Auto-focus the input when the overlay opens
  useEffect(() => {
    if (isAddOverlayOpen && smartInputRef.current) {
      // Use setTimeout to ensure the overlay is fully rendered
      setTimeout(() => {
        smartInputRef.current?.focus();
      }, 100);
    }
  }, [isAddOverlayOpen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      // Allow Escape to work even when input is focused
      if (e.key === "Escape") {
        // Close overlays in order of priority.
        // Help first: it is the topmost overlay, and it was the one overlay
        // Escape did not close -- while its own shortcut table listed Esc as
        // closing overlays.
        if (isHelpOverlayOpen) {
          setIsHelpOverlayOpen(false);
          return;
        }
        if (detailsOverlayTodo) {
          setDetailsOverlayTodo(null);
          return;
        }
        if (detailsOverlayPersonId) {
          setDetailsOverlayPersonId(null);
          return;
        }
        if (detailsOverlayProjectId) {
          setDetailsOverlayProjectId(null);
          return;
        }
        if (detailsOverlaySprintId) {
          setDetailsOverlaySprintId(null);
          return;
        }
        if (isAddOverlayOpen) {
          setIsAddOverlayOpen(false);
          return;
        }
        if (isAddPersonOverlayOpen) {
          setIsAddPersonOverlayOpen(false);
          return;
        }
        if (isAddProjectOverlayOpen) {
          setIsAddProjectOverlayOpen(false);
          return;
        }
        if (isAddSprintOverlayOpen) {
          setIsAddSprintOverlayOpen(false);
          return;
        }
        if (isAddNoteOverlayOpen) {
          setIsAddNoteOverlayOpen(false);
          return;
        }
        if (selectedNoteId) {
          setSelectedNoteId(null);
          return;
        }
        if (selectedReviewId) {
          setSelectedReviewId(null);
          return;
        }
        if (listViewRef.current?.isSelectionMode) {
          listViewRef.current.toggleSelectionMode();
          return;
        }
        if (notesViewRef.current?.isSelectionMode) {
          notesViewRef.current.toggleSelectionMode();
          return;
        }
        if (notesViewRef.current?.isDragMode) {
          notesViewRef.current.toggleDragMode();
          return;
        }
        // Blur search input if focused
        if (
          document.activeElement === peopleSearchInputRef.current ||
          document.activeElement === projectsSearchInputRef.current ||
          document.activeElement === sprintsSearchInputRef.current ||
          document.activeElement === notesSearchInputRef.current
        ) {
          (document.activeElement as HTMLElement).blur();
          return;
        }
        // For list view, we can use the generic blur approach
        if (activeView === "list" && document.activeElement instanceof HTMLInputElement) {
          document.activeElement.blur();
          return;
        }
        return;
      }

      // Don't handle other shortcuts if user is typing
      if (isInputFocused) return;

      // 'n' - New task (open add overlay)
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (activeView === "list" || activeView === "gantt" || activeView === "calendar") {
          setIsAddOverlayOpen(true);
        } else if (activeView === "notes") {
          setIsAddNoteOverlayOpen(true);
        } else if (activeView === "people") {
          setIsAddPersonOverlayOpen(true);
        } else if (activeView === "projects") {
          setIsAddProjectOverlayOpen(true);
        }
        return;
      }

      // '/' - Focus search
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (activeView === "list") {
          listViewRef.current?.focusSearch();
        } else if (activeView === "notes") {
          notesViewRef.current?.focusSearch();
        } else if (activeView === "people") {
          peopleSearchInputRef.current?.focus();
        } else if (activeView === "projects") {
          projectsSearchInputRef.current?.focus();
        } else if (activeView === "sprints") {
          sprintsSearchInputRef.current?.focus();
        }
        return;
      }

      // 'f' - Toggle filters (list and notes views)
      if (e.key === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (activeView === "list") {
          listViewRef.current?.toggleFilters();
        } else if (activeView === "notes") {
          notesViewRef.current?.toggleFilters();
        }
        return;
      }

      // 's' - Toggle selection mode (list and notes views)
      if (e.key === "s" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (activeView === "list") {
          listViewRef.current?.toggleSelectionMode();
        } else if (activeView === "notes") {
          notesViewRef.current?.toggleSelectionMode();
        }
        return;
      }

      // 'd' - Toggle drag mode (notes view only)
      if (e.key === "d" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (activeView === "notes") {
          notesViewRef.current?.toggleDragMode();
        }
        return;
      }

      // '1-9' - Switch view tabs, indexing the same ordered list the tab bar
      // renders. This used to be a second hand-maintained list that had
      // drifted: it omitted Notes, Reviews and Time, so "5" selected People
      // while the fifth visible tab was Notes.
      if (e.key >= "1" && e.key <= "9" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const enabledViews = getEnabledViews(features);
        const index = parseInt(e.key) - 1;
        if (index < enabledViews.length) {
          setActiveView(enabledViews[index].id);
        }
        return;
      }

      // '?' - Show keyboard shortcuts help (can be expanded later)
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setIsHelpOverlayOpen(true);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    activeView,
    detailsOverlayTodo,
    detailsOverlayPersonId,
    detailsOverlayProjectId,
    detailsOverlaySprintId,
    isAddOverlayOpen,
    isAddPersonOverlayOpen,
    isAddProjectOverlayOpen,
    isAddSprintOverlayOpen,
    isAddNoteOverlayOpen,
    isHelpOverlayOpen,
    selectedNoteId,
    selectedReviewId,
    features,
  ]);

  const handleTokensChange = (tokens: TokenMatch[], fullText: string, plainText: string) => {
    setCurrentTokens(tokens);
    setCurrentFullText(fullText);
    setCurrentPlainText(plainText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPlainText.trim() === "") return;

    // Parse tokens into metadata
    const metadata = parseTokensToMetadata(currentTokens);

    // Apply auto-assignment defaults if field not provided
    const autoAssign = settings.autoAssign;

    if (metadata.assignedPeople.length === 0 && autoAssign.assignedPerson) {
      metadata.assignedPeople.push(autoAssign.assignedPerson);
    }
    if (metadata.sourcePeople.length === 0 && autoAssign.sourcePerson) {
      metadata.sourcePeople.push(autoAssign.sourcePerson);
    }
    if (metadata.projects.length === 0 && autoAssign.project) {
      metadata.projects.push(autoAssign.project);
    }
    if (!metadata.priority && autoAssign.priority) {
      metadata.priority = autoAssign.priority;
    }
    if (!metadata.dueDate && autoAssign.dueDate) {
      // Normalize the date value (handles "today", "tomorrow", etc.)
      const normalized = normalizeDateValue(autoAssign.dueDate, settings.dateTime, settings.workHours);
      if (normalized) {
        metadata.dueDate = normalized;
      }
    }
    if (!metadata.duration && autoAssign.duration) {
      metadata.duration = autoAssign.duration;
    }

    addTodo(currentFullText, currentPlainText, metadata);

    // Record selections for usage history
    recordSelections({
      assignedPeople: metadata.assignedPeople,
      sourcePeople: metadata.sourcePeople,
      mentionedPeople: metadata.mentionedPeople,
      projects: metadata.projects,
      priorities: metadata.priority,
      tags: metadata.tags,
      dueDates: metadata.dueDate,
      durations: metadata.duration,
      recurring: metadata.recurring,
      sprints: metadata.sprint,
    });

    // Clear the smart input
    smartInputRef.current?.clear();
    setCurrentTokens([]);
    setCurrentFullText("");
    setCurrentPlainText("");

    // Clear active template after creating todo
    setActiveTemplateId(null);
  };

  // Determine container width based on active view
  // NOTE: This must be before the isLoaded check to satisfy Rules of Hooks
  // Use consistent container width for all views to prevent jarring layout shifts
  // Individual views handle their own internal overflow/scrolling needs
  // Use full width with consistent padding - let individual views manage their content width
  const containerClass = "w-full px-2 sm:px-4 lg:px-6 xl:px-8";

  if (loadError !== null) {
    return <StorageRecoveryScreen error={loadError} />;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div
      data-testid="todo-app"
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 py-4 sm:py-8 px-2 sm:px-4"
    >
      <StorageErrorBanner />
      <div className={containerClass}>
        <header className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">DoIt</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddOverlayOpen(true)}
                className="px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                title="Add new todo (N)"
                data-tutorial="add-button"
                data-testid="add-todo-button"
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Todo</span>
              </button>
              {features?.notesView && (
                <button
                  onClick={() => setIsAddNoteOverlayOpen(true)}
                  className="px-2 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                  title="Add new note (Shift+N)"
                  data-tutorial="add-note-button"
                  data-testid="add-note-button"
                >
                  <DocumentIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Note</span>
                </button>
              )}
              <button
                onClick={() => setIsHelpOverlayOpen(true)}
                className="px-2 sm:px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                title="Help (Shift+?)"
                data-tutorial="help-button"
              >
                <HelpIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Help</span>
              </button>
              <Link
                href="/settings"
                className="px-2 sm:px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                title="Settings"
                data-tutorial="settings-button"
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </div>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">A simple, extensible, local todo app</p>
        </header>

        {/* View Tabs */}
        <ViewTabs
          activeView={activeView}
          onViewChange={setActiveView}
          features={features}
          runningSprint={runningSprint}
          onOpenTutorial={setViewTutorialOpen}
        />

        {/* View Content */}
        {activeView === "gantt" && (
          <GanttView
            key={ganttRefreshKey}
            todos={todos}
            markerColors={settings.markerColors}
            workHours={settings.workHours}
            onEditTodo={editTodo}
            availablePeople={sortedPeople}
            availableProjects={sortedProjects}
            availablePriorities={sortedPriorities}
            onAddPerson={handleAddPerson}
            onAddProject={handleAddProject}
            onAddPriority={handleAddPriority}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onDuplicate={duplicateTodo}
            onArchive={archiveTodo}
            onUnarchive={unarchiveTodo}
            settings={settings}
            linkPatterns={settings.linkPatterns}
            onAddComment={addTodoComment}
            onUpdateGanttSettings={updateGantt}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onEditSubtask={editSubtask}
            onDeleteSubtask={deleteSubtask}
            onStartTimeTracking={settings.features.timeTracking ? startTimeTracking : undefined}
            onStopTimeTracking={settings.features.timeTracking ? stopTimeTracking : undefined}
            onAddManualTimeEntry={settings.features.timeTracking ? addManualTimeEntry : undefined}
            onDeleteTimeEntry={settings.features.timeTracking ? deleteTimeEntry : undefined}
            onCreateTemplate={handleCreateTemplate}
            onStartFocusMode={
              features?.focusMode
                ? (tasks) => {
                    setFocusTasks(tasks);
                    setIsFocusMode(true);
                  }
                : undefined
            }
            onStartOpenFocusMode={features?.focusMode ? () => setIsOpenFocusMode(true) : undefined}
          />
        )}

        {activeView === "kanban" && (
          <KanbanView
            todos={todos}
            markerColors={settings.markerColors}
            kanban={settings.kanban}
            onEditTodo={editTodo}
            availablePeople={sortedPeople}
            availableProjects={sortedProjects}
            availablePriorities={sortedPriorities}
            onAddPerson={handleAddPerson}
            onAddProject={handleAddProject}
            onAddPriority={handleAddPriority}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onDuplicate={duplicateTodo}
            onArchive={archiveTodo}
            onUnarchive={unarchiveTodo}
            onSetWorkflowState={setWorkflowState}
            settings={settings}
            linkPatterns={settings.linkPatterns}
            onAddComment={addTodoComment}
            onUpdateKanbanSettings={updateKanbanSettings}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onEditSubtask={editSubtask}
            onDeleteSubtask={deleteSubtask}
            onStartTimeTracking={settings.features.timeTracking ? startTimeTracking : undefined}
            onStopTimeTracking={settings.features.timeTracking ? stopTimeTracking : undefined}
            onAddManualTimeEntry={settings.features.timeTracking ? addManualTimeEntry : undefined}
            onDeleteTimeEntry={settings.features.timeTracking ? deleteTimeEntry : undefined}
            onCreateTemplate={handleCreateTemplate}
            sprints={sprints.map((s) => s.raw)}
            runningSprint={runningSprint?.raw}
          />
        )}

        {activeView === "calendar" && (
          <CalendarView
            todos={todos}
            markerColors={settings.markerColors}
            settings={settings}
            linkPatterns={settings.linkPatterns}
            availablePeople={sortedPeople}
            availableProjects={sortedProjects}
            availablePriorities={sortedPriorities}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onArchive={archiveTodo}
            onUnarchive={unarchiveTodo}
            onEdit={editTodo}
            onAddPerson={handleAddPerson}
            onAddProject={handleAddProject}
            onAddPriority={handleAddPriority}
            onAddComment={addTodoComment}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onEditSubtask={editSubtask}
            onDeleteSubtask={deleteSubtask}
            onStartTimeTracking={settings.features.timeTracking ? startTimeTracking : undefined}
            onStopTimeTracking={settings.features.timeTracking ? stopTimeTracking : undefined}
            onAddManualTimeEntry={settings.features.timeTracking ? addManualTimeEntry : undefined}
            onDeleteTimeEntry={settings.features.timeTracking ? deleteTimeEntry : undefined}
            onCreateTemplate={handleCreateTemplate}
            onDuplicate={duplicateTodo}
          />
        )}

        {/* People View */}
        {activeView === "people" && (
          <PeopleView
            people={allPeople}
            countsByPerson={countsByPerson}
            onOpenPerson={(personId) => setDetailsOverlayPersonId(personId)}
            onAddPerson={() => setIsAddPersonOverlayOpen(true)}
            onArchivePerson={archivePerson}
            onUnarchivePerson={unarchivePerson}
            onDeletePerson={deletePerson}
            onRequestDeleteConfirm={(id, name) => {
              showConfirmDialog({
                title: "Delete Person",
                message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
                confirmText: "Delete",
                confirmVariant: "danger",
                onConfirm: () => {
                  deletePerson(id);
                },
              });
            }}
            onCreatePersonNote={handleCreatePersonNote}
            searchInputRef={peopleSearchInputRef}
          />
        )}

        {/* Projects View */}
        {activeView === "projects" && (
          <ProjectsView
            projects={allProjects}
            countsByProject={countsByProject}
            onOpenProject={(projectId) => setDetailsOverlayProjectId(projectId)}
            onAddProject={() => setIsAddProjectOverlayOpen(true)}
            onArchiveProject={archiveProject}
            onUnarchiveProject={unarchiveProject}
            onDeleteProject={deleteProject}
            onRequestDeleteConfirm={(id, name) => {
              showConfirmDialog({
                title: "Delete Project",
                message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
                confirmText: "Delete",
                confirmVariant: "danger",
                onConfirm: () => {
                  deleteProject(id);
                },
              });
            }}
            onCreateProjectNote={handleCreateProjectNote}
            searchInputRef={projectsSearchInputRef}
          />
        )}

        {/* Notes View */}
        {activeView === "notes" && !selectedNoteId && (
          <NotesView
            ref={notesViewRef}
            notes={notes}
            todos={todos}
            onOpenNote={(noteId) => {
              setSelectedNoteId(noteId);
              setFocusNoteContentOnOpen(false);
            }}
            onDeleteNote={(noteId) => {
              showConfirmDialog({
                title: "Delete Note",
                message: "Delete this note? You can undo this from the notification for ten seconds.",
                confirmText: "Delete",
                confirmVariant: "danger",
                onConfirm: () => {
                  deleteNote(noteId);
                },
              });
            }}
            onArchiveNote={archiveNote}
            onUnarchiveNote={unarchiveNote}
            onTogglePinned={toggleNotePinned}
            onConvertToTodo={(noteId) => {
              showConfirmDialog({
                title: "Convert to Todo",
                message: "This will convert the note to a todo and archive the original note. Continue?",
                confirmText: "Convert",
                confirmVariant: "primary",
                onConfirm: () => {
                  const newTodoId = convertNoteToTodo(noteId, (text, plainText, metadata) => {
                    const todoMetadata = {
                      assignedPeople: metadata.assignedPeople,
                      sourcePeople: metadata.sourcePeople,
                      mentionedPeople: metadata.mentionedPeople,
                      projects: metadata.projects,
                      tags: metadata.tags,
                      context: metadata.context,
                    };
                    return addTodo(text, plainText, todoMetadata);
                  });
                  // Navigate to the new todo
                  if (newTodoId) {
                    setActiveView("list");
                    const newTodo = todos.find((t) => t.id === newTodoId);
                    if (newTodo) {
                      setDetailsOverlayTodo(newTodo);
                    }
                  }
                },
              });
            }}
            notesSettings={settings.notes}
            markerColors={settings.markerColors}
            people={people}
            projects={projects}
            features={features}
            searchInputRef={notesSearchInputRef}
            searchHistory={searchHistory}
            addToSearchHistory={addToSearchHistory}
            removeFromSearchHistory={removeFromSearchHistory}
            clearSearchHistory={clearSearchHistory}
            undoActions={noteUndoActions}
            fadingOutIds={noteFadingOutIds}
            undo={undoNote}
            dismissUndo={dismissNoteUndo}
            onReorderNotes={reorderNotes}
            onExport={(format) => {
              // Build lookup maps for display names
              const peopleMap = new Map(people.map((p) => [p.id, p.name]));
              const projectsMap = new Map(projects.map((p) => [p.id, p.name]));
              // Export all non-deleted notes (filtered notes handled internally)
              exportNotes(notes, format, peopleMap, projectsMap);
            }}
          />
        )}

        {/* Note Detail View (inline, replaces list) */}
        {activeView === "notes" && selectedNoteId && findNote(selectedNoteId) && (
          <NoteDetailView
            note={findNote(selectedNoteId)!}
            onBack={() => setSelectedNoteId(null)}
            onEdit={editNote}
            onDelete={(noteId) => {
              showConfirmDialog({
                title: "Delete Note",
                message: "Delete this note? You can undo this from the notification for ten seconds.",
                confirmText: "Delete",
                confirmVariant: "danger",
                onConfirm: () => {
                  deleteNote(noteId);
                  setSelectedNoteId(null);
                },
              });
            }}
            onArchive={(noteId) => {
              archiveNote(noteId);
              setSelectedNoteId(null);
            }}
            onUnarchive={unarchiveNote}
            onTogglePinned={toggleNotePinned}
            onConvertToTodo={(noteId) => {
              showConfirmDialog({
                title: "Convert to Todo",
                message: "This will convert the note to a todo and archive the original note. Continue?",
                confirmText: "Convert",
                confirmVariant: "primary",
                onConfirm: () => {
                  const newTodoId = convertNoteToTodo(noteId, (text, plainText, metadata) => {
                    const todoMetadata = {
                      assignedPeople: metadata.assignedPeople,
                      sourcePeople: metadata.sourcePeople,
                      mentionedPeople: metadata.mentionedPeople,
                      projects: metadata.projects,
                      tags: metadata.tags,
                      context: metadata.context,
                    };
                    return addTodo(text, plainText, todoMetadata);
                  });
                  setSelectedNoteId(null);
                  // Navigate to the new todo
                  if (newTodoId) {
                    setActiveView("list");
                    const newTodo = todos.find((t) => t.id === newTodoId);
                    if (newTodo) {
                      setDetailsOverlayTodo(newTodo);
                    }
                  }
                },
              });
            }}
            onAddComment={addNoteComment}
            onEditComment={editNoteComment}
            onDeleteComment={deleteNoteComment}
            onAddActionItem={addActionItem}
            onEditActionItem={editActionItem}
            onDeleteActionItem={deleteActionItem}
            onConvertActionItems={(noteId) => {
              convertActionItemsToTodos(noteId, (text, plainText, metadata) => {
                const todoMetadata = {
                  assignedPeople: [],
                  sourcePeople: [],
                  mentionedPeople: [],
                  projects: [],
                  sourceNoteId: metadata.sourceNoteId as string,
                  sourceActionItemId: metadata.sourceActionItemId as string,
                };
                // Return the new todo ID from addTodo (not the first existing todo)
                return addTodo(text, plainText, todoMetadata);
              });
            }}
            onOpenTodo={(todoId) => {
              const todo = todos.find((t) => t.id === todoId);
              if (todo) {
                setDetailsOverlayTodo(todo);
              }
            }}
            onToggleTodo={(todoId) => {
              toggleTodo(todoId);
            }}
            todos={todos}
            availablePeople={sortedPeople}
            availableProjects={sortedProjects}
            markerColors={settings.markerColors}
            linkPatterns={settings.linkPatterns}
            autoFocusContent={focusNoteContentOnOpen}
            onAddPerson={(name) => {
              addPerson({
                name,
                alternatives: [],
              });
            }}
            onAddProject={(name) => {
              addProject({
                name,
                alternatives: [],
              });
            }}
            onDuplicate={(noteId) => {
              const newNoteId = duplicateNote(noteId);
              if (newNoteId) {
                setSelectedNoteId(newNoteId);
              }
              return newNoteId;
            }}
            onRecordSelections={recordSelections}
          />
        )}

        {/* Statistics View */}
        {activeView === "stats" && (
          <StatisticsView todos={todos} projects={projects} categories={settings.categories} />
        )}

        {/* Time Reports View */}
        {activeView === "timereports" && (
          <TimeReportsView todos={todos} people={people} projects={projects} settings={settings} sprints={sprints} />
        )}

        {/* Sprints View */}
        {activeView === "sprints" && (
          <SprintsView
            sprints={sprints}
            todos={todos}
            onOpenSprint={(sprintId) => setDetailsOverlaySprintId(sprintId)}
            onAddSprint={() => setIsAddSprintOverlayOpen(true)}
            searchInputRef={sprintsSearchInputRef}
          />
        )}

        {/* Reviews View - List */}
        {activeView === "reviews" && !selectedReviewId && (
          <ReviewsView
            reviews={reviews}
            todos={todos.map((t) => t.raw)}
            workWeekStart={settings.dateTime.workWeekStart}
            fiscalYearStart={settings.dateTime.fiscalYearStart}
            onOpenReview={(reviewId) => setSelectedReviewId(reviewId)}
            onCreateReview={(level: ReviewLevel, periodStart: string, periodEnd: string, periodLabel: string) => {
              const newId = addReview(level, periodStart, periodEnd, periodLabel);
              setSelectedReviewId(newId);
            }}
            onDeleteReview={(id) => {
              showConfirmDialog({
                title: "Delete Review",
                message: "Delete this review? You can undo this from the notification for ten seconds.",
                confirmText: "Delete",
                confirmVariant: "danger",
                onConfirm: () => deleteReview(id),
              });
            }}
            onArchiveReview={archiveReview}
            onUnarchiveReview={unarchiveReview}
            onCompleteReview={completeReview}
            undoActions={reviewUndoActions}
            fadingOutIds={reviewFadingOutIds}
            undo={undoReview}
            dismissUndo={dismissReviewUndo}
          />
        )}

        {/* Reviews View - Edit (pending review) */}
        {activeView === "reviews" && selectedReviewId && findReview(selectedReviewId)?.isPending && (
          <ReviewEditView
            review={findReview(selectedReviewId)!}
            rawReviews={rawReviews}
            rawTodos={todos.map((t) => t.raw)}
            onBack={() => setSelectedReviewId(null)}
            onSave={editReview}
            onComplete={(id) => {
              completeReview(id);
              setSelectedReviewId(null);
            }}
            onAddEntry={addReviewEntry}
            onUpdateEntry={updateReviewEntry}
            onRemoveEntry={removeReviewEntry}
            onToggleEntryCollapsed={toggleReviewEntryCollapsed}
          />
        )}

        {/* Reviews View - Detail (completed/archived review) */}
        {activeView === "reviews" && selectedReviewId && findReview(selectedReviewId) && !findReview(selectedReviewId)?.isPending && (
          <ReviewDetailView
            review={findReview(selectedReviewId)!}
            onBack={() => setSelectedReviewId(null)}
            onDelete={(id) => {
              showConfirmDialog({
                title: "Delete Review",
                message: "Delete this review? You can undo this from the notification for ten seconds.",
                confirmText: "Delete",
                confirmVariant: "danger",
                onConfirm: () => {
                  deleteReview(id);
                  setSelectedReviewId(null);
                },
              });
            }}
            onArchive={(id) => {
              archiveReview(id);
            }}
            onUnarchive={(id) => {
              unarchiveReview(id);
            }}
            onOpenTodo={(todoId) => {
              const todo = todos.find((t) => t.id === todoId);
              if (todo) {
                setDetailsOverlayTodo(todo);
              }
            }}
            onOpenChildReview={(reviewId) => {
              setSelectedReviewId(reviewId as ReviewId);
            }}
            onToggleEntryCollapsed={toggleReviewEntryCollapsed}
          />
        )}

        {activeView === "list" && (
          <ListView
            ref={listViewRef}
            todos={todos}
            settings={settings}
            sortedPeople={sortedPeople}
            sortedProjects={sortedProjects}
            sortedPriorities={sortedPriorities}
            sprints={sprints}
            nextPlannedSprint={nextPlannedSprint}
            features={features}
            templates={templates}
            onShowTemplatesManager={() => setShowTemplatesManager(true)}
            searchHistory={searchHistory}
            addToSearchHistory={addToSearchHistory}
            removeFromSearchHistory={removeFromSearchHistory}
            clearSearchHistory={clearSearchHistory}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
            archiveTodo={archiveTodo}
            unarchiveTodo={unarchiveTodo}
            editTodo={editTodo}
            reorderTodos={reorderTodos}
            onAddPerson={handleAddPerson}
            onAddProject={handleAddProject}
            onAddPriority={handleAddPriority}
            onOpenTodoDetails={setDetailsOverlayTodo}
            undoActions={undoActions}
            fadingOutIds={fadingOutIds}
            undo={undo}
            dismissUndo={dismissUndo}
            dependencyBlockNotification={dependencyBlockNotification}
          />
        )}

        {/* Todo Details Overlay - outside activeView check so it works from FocusView too */}
        {detailsOverlayTodo &&
          (() => {
            // Find the current version of the todo from the todos array
            const currentTodo = todos.find((t) => t.id === detailsOverlayTodo.id);
            if (!currentTodo) return null;

            return (
              <TodoDetailsOverlay
                todo={currentTodo}
                todos={todos}
                isOpen={true}
                onClose={() => setDetailsOverlayTodo(null)}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onDuplicate={duplicateTodo}
                onEdit={editTodo}
                onArchive={archiveTodo}
                onUnarchive={unarchiveTodo}
                markerColors={settings.markerColors}
                settings={settings}
                linkPatterns={settings.linkPatterns}
                availablePeople={sortedPeople}
                availableProjects={sortedProjects}
                availablePriorities={sortedPriorities}
                availableTags={sortedTags}
                onRecordSelections={recordSelections}
                onAddPerson={handleAddPerson}
                onAddProject={handleAddProject}
                onAddPriority={handleAddPriority}
                onAddComment={addTodoComment}
                onAddSubtask={addSubtask}
                onToggleSubtask={toggleSubtask}
                onEditSubtask={editSubtask}
                onDeleteSubtask={deleteSubtask}
                onStartTimeTracking={settings.features.timeTracking ? startTimeTracking : undefined}
                onStopTimeTracking={settings.features.timeTracking ? stopTimeTracking : undefined}
                onAddManualTimeEntry={settings.features.timeTracking ? addManualTimeEntry : undefined}
                onDeleteTimeEntry={settings.features.timeTracking ? deleteTimeEntry : undefined}
                onCreateTemplate={handleCreateTemplate}
                sprints={sprints.map((s) => s.raw)}
                runningSprint={runningSprint?.raw}
                onSelectTodo={(todoId) => {
                  const foundTodo = todos.find((t) => t.id === todoId);
                  if (foundTodo) setDetailsOverlayTodo(foundTodo);
                }}
                onOpenNote={(noteId) => {
                  // Close the todo overlay and navigate to the note
                  setDetailsOverlayTodo(null);
                  setActiveView("notes");
                  setSelectedNoteId(noteId as NoteId);
                }}
              />
            );
          })()}

        {/* Person Details Overlay */}
        {detailsOverlayPersonId &&
          (() => {
            const person = people.find((p) => p.id === detailsOverlayPersonId);
            if (!person) return null;

            // Get all names that could match this person (name + alternatives)
            const personNames = [person.name.toLowerCase(), ...person.alternatives.map((a) => a.toLowerCase())];

            // Filter notes by name matching (since IDs are stored as names)
            const personNotes = notes.filter((note) => {
              const matchesNames = (ids: string[]) =>
                ids.some((id) => personNames.includes(id.toLowerCase()));
              return (
                matchesNames(note.assignedPeopleIds.map((id) => id as string)) ||
                matchesNames(note.sourcePeopleIds.map((id) => id as string)) ||
                matchesNames(note.mentionedPeopleIds.map((id) => id as string))
              );
            });

            return (
              <PersonDetailsOverlay
                person={person}
                onClose={() => setDetailsOverlayPersonId(null)}
                onUpdate={updatePerson}
                onDelete={deletePerson}
                onArchive={archivePerson}
                onUnarchive={unarchivePerson}
                onAddComment={addPersonComment}
                onEditComment={editPersonComment}
                onDeleteComment={deletePersonComment}
                onCreateNote={handleCreatePersonNote}
                markerColors={settings.markerColors}
                linkPatterns={settings.linkPatterns}
                notes={personNotes}
                onOpenNote={(noteId) => {
                  setDetailsOverlayPersonId(null);
                  setActiveView("notes");
                  setSelectedNoteId(noteId);
                }}
                todos={todos}
                onOpenTodo={(todoId) => {
                  setDetailsOverlayPersonId(null);
                  const todo = todos.find((t) => t.id === todoId);
                  if (todo) {
                    setDetailsOverlayTodo(todo);
                  }
                }}
                availablePriorities={settings.priorities}
              />
            );
          })()}

        {/* Project Details Overlay */}
        {detailsOverlayProjectId &&
          (() => {
            const project = projects.find((p) => p.id === detailsOverlayProjectId);
            if (!project) return null;

            // Get all names that could match this project (name + alternatives)
            const projectNames = [project.name.toLowerCase(), ...project.alternatives.map((a) => a.toLowerCase())];

            // Filter notes by name matching (since IDs are stored as names)
            const projectNotes = notes.filter((note) =>
              note.projectIds.some((id) => projectNames.includes((id as string).toLowerCase()))
            );

            return (
              <ProjectDetailsOverlay
                project={project}
                onClose={() => setDetailsOverlayProjectId(null)}
                onUpdate={updateProject}
                onDelete={deleteProject}
                onArchive={archiveProject}
                onUnarchive={unarchiveProject}
                onAddComment={addProjectComment}
                onEditComment={editProjectComment}
                onDeleteComment={deleteProjectComment}
                onCreateNote={handleCreateProjectNote}
                categories={settings.categories}
                markerColors={settings.markerColors}
                linkPatterns={settings.linkPatterns}
                notes={projectNotes}
                onOpenNote={(noteId) => {
                  setDetailsOverlayProjectId(null);
                  setActiveView("notes");
                  setSelectedNoteId(noteId);
                }}
                todos={todos}
                onOpenTodo={(todoId) => {
                  setDetailsOverlayProjectId(null);
                  const todo = todos.find((t) => t.id === todoId);
                  if (todo) {
                    setDetailsOverlayTodo(todo);
                  }
                }}
                availablePriorities={settings.priorities}
              />
            );
          })()}

        {/* Sprint Details Overlay */}
        {detailsOverlaySprintId &&
          (() => {
            const sprint = sprints.find((s) => s.id === detailsOverlaySprintId);
            return sprint ? (
              <SprintDetailsOverlay
                sprint={sprint}
                allSprints={sprints}
                todos={todos}
                markerColors={settings.markerColors}
                linkPatterns={settings.linkPatterns}
                onClose={() => setDetailsOverlaySprintId(null)}
                onUpdate={updateSprint}
                onDelete={(id) => {
                  deleteSprint(id);
                  setDetailsOverlaySprintId(null);
                }}
                onStart={startSprint}
                onComplete={completeSprint}
                onCancel={cancelSprint}
                onArchive={archiveSprint}
                onUnarchive={unarchiveSprint}
                onAddComment={addSprintComment}
                onEditComment={editSprintComment}
                onDeleteComment={deleteSprintComment}
                onTodoClick={(todo) => setDetailsOverlayTodo(todo)}
                onRemoveTodoFromSprint={(todoId) => {
                  const todo = todos.find((t) => t.id === todoId);
                  if (todo) {
                    editTodo(todoId, todo.text, todo.plainText, { ...todo.metadata, sprint: undefined });
                  }
                }}
              />
            ) : null;
          })()}

        {/* Add Todo Overlay */}
        {isAddOverlayOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsAddOverlayOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Add New Todo</span>
                    <InfoTooltip content={tooltipContent.smartInput} />
                  </h2>
                  <button
                    onClick={() => setIsAddOverlayOpen(false)}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Template Selector */}
                {templates.length > 0 && (
                  <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Template:</span>
                        {activeTemplate ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {activeTemplate.name}
                            </span>
                            <button
                              type="button"
                              onClick={clearActiveTemplate}
                              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                              title="Clear template"
                            >
                              <CloseIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-400">None selected</span>
                        )}
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                          className="px-3 py-1.5 text-sm bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors flex items-center gap-1"
                        >
                          <DocumentIcon className="w-4 h-4" />
                          Use Template
                        </button>
                        {showTemplateDropdown && (
                          <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
                            <ul className="py-1 max-h-64 overflow-y-auto">
                              {templates.map((template) => (
                                <li key={template.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyTemplate(template)}
                                    className={`w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${
                                      activeTemplateId === template.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                    }`}
                                  >
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                                      {template.name}
                                    </span>
                                    {template.description && (
                                      <span className="block text-xs text-zinc-500 truncate">
                                        {template.description}
                                      </span>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                            <div className="border-t border-zinc-200 dark:border-zinc-700">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowTemplateDropdown(false);
                                  setShowTemplatesManager(true);
                                }}
                                className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left"
                              >
                                Manage templates...
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Smart Input Markers Legend */}
                <div className="mb-4">
                  <MarkerReference />
                </div>

                {/* Add Form */}
                <form
                  onSubmit={(e) => {
                    handleSubmit(e);
                    setIsAddOverlayOpen(false);
                  }}
                  data-tutorial="smart-input"
                >
                  <div className="mb-4">
                    <SmartEditableInput
                      ref={smartInputRef}
                      markerColors={settings.markerColors}
                      availablePeople={sortedPeople}
                      availableProjects={sortedProjects}
                      availablePriorities={sortedPriorities}
                      dateTimeSettings={settings.dateTime}
                      workHoursSettings={settings.workHours}
                      onAddPerson={handleAddPerson}
                      onAddProject={handleAddProject}
                      onAddPriority={handleAddPriority}
                      onTokensChange={handleTokensChange}
                      onEnterPress={() => {
                        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                        setIsAddOverlayOpen(false);
                      }}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAddOverlayOpen(false)}
                      className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      data-testid="add-todo-submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    >
                      Add Todo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Person Overlay */}
        {isAddPersonOverlayOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setIsAddPersonOverlayOpen(false);
              setAddPersonAlternatives([]);
            }}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Person</h2>
                  <button
                    onClick={() => {
                      setIsAddPersonOverlayOpen(false);
                      setAddPersonAlternatives([]);
                    }}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name") as string;
                    const color = formData.get("color") as string;

                    if (name.trim()) {
                      addPerson({
                        name: name.trim(),
                        alternatives: addPersonAlternatives,
                        color: getColor(color),
                      });
                      setIsAddPersonOverlayOpen(false);
                      setAddPersonAlternatives([]);
                      e.currentTarget.reset();
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="John Doe"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <AlternativesInput
                    value={addPersonAlternatives}
                    onChange={setAddPersonAlternatives}
                    placeholder="e.g., Johnny, JD, John D."
                  />

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Color</label>
                    <input
                      type="color"
                      name="color"
                      defaultValue={settings.markerColors.assigned}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddPersonOverlayOpen(false);
                        setAddPersonAlternatives([]);
                      }}
                      className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    >
                      Add Person
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Project Overlay */}
        {isAddProjectOverlayOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setIsAddProjectOverlayOpen(false);
              setAddProjectAlternatives([]);
            }}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Project</h2>
                  <button
                    onClick={() => {
                      setIsAddProjectOverlayOpen(false);
                      setAddProjectAlternatives([]);
                    }}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name") as string;
                    const color = formData.get("color") as string;

                    if (name.trim()) {
                      addProject({
                        name: name.trim(),
                        alternatives: addProjectAlternatives,
                        color: getColor(color),
                      });
                      setIsAddProjectOverlayOpen(false);
                      setAddProjectAlternatives([]);
                      e.currentTarget.reset();
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Website Redesign"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <AlternativesInput
                    value={addProjectAlternatives}
                    onChange={setAddProjectAlternatives}
                    placeholder="e.g., Web Redesign, Site Refresh"
                  />

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Color</label>
                    <input
                      type="color"
                      name="color"
                      defaultValue={settings.markerColors.project}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddProjectOverlayOpen(false);
                        setAddProjectAlternatives([]);
                      }}
                      className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    >
                      Add Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Sprint Overlay */}
        {isAddSprintOverlayOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setIsAddSprintOverlayOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Sprint</h2>
                  <button
                    onClick={() => setIsAddSprintOverlayOpen(false)}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name") as string;
                    const goal = formData.get("goal") as string;
                    const durationDays =
                      parseInt(formData.get("durationDays") as string) || settings.sprints?.defaultSprintDuration || 14;
                    const plannedStartDate = formData.get("plannedStartDate") as string;

                    if (name.trim()) {
                      addSprint({
                        name: name.trim(),
                        goal: goal?.trim() || undefined,
                        durationDays,
                        plannedStartDate: plannedStartDate || undefined,
                        color: undefined,
                      });
                      setIsAddSprintOverlayOpen(false);
                      e.currentTarget.reset();
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Sprint Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Sprint 1"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      name="durationDays"
                      min={1}
                      defaultValue={settings.sprints?.defaultSprintDuration || 14}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Planned Start Date (optional)
                    </label>
                    <input
                      type="date"
                      name="plannedStartDate"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Sprint Goal (optional)
                    </label>
                    <textarea
                      name="goal"
                      rows={2}
                      placeholder="What is the main objective of this sprint?"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddSprintOverlayOpen(false)}
                      className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    >
                      Add Sprint
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        <NoteAddModal
          isOpen={isAddNoteOverlayOpen}
          onClose={() => setIsAddNoteOverlayOpen(false)}
          onAdd={addNote}
          onNoteCreated={(noteId) => {
            setSelectedNoteId(noteId);
            setFocusNoteContentOnOpen(true);
          }}
          availablePeople={sortedPeople}
          availableProjects={sortedProjects}
          markerColors={settings.markerColors}
        />
      </div>

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}

      {/* Focus Mode */}
      {isFocusMode && (
        <FocusView
          todos={todos}
          scheduledTasks={focusTasks}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onEdit={editTodo}
          onArchive={archiveTodo}
          markerColors={settings.markerColors}
          settings={settings}
          linkPatterns={settings.linkPatterns}
          onOpenDetails={(todo) => {
            // Don't close focus mode - it will pause automatically
            setDetailsOverlayTodo(todo);
          }}
          onClose={() => {
            setIsFocusMode(false);
            setGanttRefreshKey((k) => k + 1);
          }}
          onStartTimeTracking={settings.features.timeTracking ? startTimeTracking : undefined}
          onStopTimeTracking={settings.features.timeTracking ? stopTimeTracking : undefined}
        />
      )}

      {/* Open Focus Mode (task-free) */}
      {isOpenFocusMode && <OpenFocusView settings={settings} onClose={() => setIsOpenFocusMode(false)} />}

      {/* Templates Manager */}
      {showTemplatesManager && (
        <TemplatesManager
          templates={templates}
          onDelete={deleteTemplate}
          onClose={() => setShowTemplatesManager(false)}
        />
      )}

      {/* Create Template Modal */}
      {showCreateTemplate &&
        templateTodoId &&
        (() => {
          const todo = todos.find((t) => t.id === templateTodoId);
          if (!todo) return null;
          return (
            <CreateTemplateModal
              initialText={todo.text}
              initialPlainText={todo.plainText}
              initialMetadata={{
                assignedPeople: [...todo.metadata.assignedPeople],
                sourcePeople: [...todo.metadata.sourcePeople],
                mentionedPeople: [...todo.metadata.mentionedPeople],
                projects: [...todo.metadata.projects],
                dependencies: [],
                priority: todo.metadata.priority,
                tags: [...(todo.metadata.tags ?? [])],
                dueDate: todo.metadata.dueDate,
                duration: todo.metadata.duration,
              }}
              subtasks={todo.subtasks?.map((s) => s.text)}
              onSave={handleSaveTemplate}
              onClose={() => {
                setShowCreateTemplate(false);
                setTemplateTodoId(null);
              }}
            />
          );
        })()}

      {/* Help Overlay */}
      <HelpOverlay
        isOpen={isHelpOverlayOpen}
        onClose={() => setIsHelpOverlayOpen(false)}
        onRestartTutorial={handleRestartTutorial}
        features={features}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onComplete={handleTutorialComplete}
        steps={mainTutorialSteps}
        showRememberChoice={true}
        tutorialId="main"
      />

      {/* View-specific Tutorial Overlay */}
      {viewTutorialOpen && (
        <TutorialOverlay
          isOpen={true}
          onClose={() => setViewTutorialOpen(null)}
          onComplete={handleViewTutorialComplete}
          steps={getViewTutorialSteps(viewTutorialOpen)}
          showRememberChoice={false}
          tutorialId={`view-${viewTutorialOpen}`}
        />
      )}
    </div>
  );
}
