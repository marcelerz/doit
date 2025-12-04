"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { useTodos } from "@/hooks/useTodos";
import { useSettings } from "@/hooks/useSettings";
import { usePeople } from "@/hooks/usePeople";
import { useProjects } from "@/hooks/useProjects";
import { TodoItem } from "@/components/items/TodoItem";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import { TodoMetadata } from "@/types/todo";
import { GanttView } from "./GanttView";
import { CalendarView } from "./CalendarView";
import { MarkerReference } from "@/components/shared/MarkerReference";
import { TodoDetailsOverlay } from "@/components/overlays/TodoDetailsOverlay";
import { PersonDetailsOverlay } from "@/components/overlays/PersonDetailsOverlay";
import { ProjectDetailsOverlay } from "@/components/overlays/ProjectDetailsOverlay";
import { PersonItem } from "@/components/items/PersonItem";
import { ProjectItem } from "@/components/items/ProjectItem";
import { calculateUsageStats, sortByUsage, UsageStats } from "@/utils/usageStats";
import { normalizeDateValue } from "@/utils/dateParser";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterSection } from "@/components/shared/FilterSection";
import { parseTokensToMetadata } from "@/utils/metadataParser";
import { setToSortedArray, arrayHasAnyFromSet, setHasValue } from "@/utils/filterHelpers";

interface TodoFilters {
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

type ViewTab = "list" | "gantt" | "calendar" | "people" | "projects";

export function TodoList() {
  const {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    archiveTodo,
    unarchiveTodo,
    editTodo,
    addTodoComment,
    editTodoComment,
    deleteTodoComment,
    isLoaded,
    undoActions,
    fadingOutIds,
    dependencyBlockNotification,
    undo,
    dismissUndo,
  } = useTodos();
  const { settings, addPriority } = useSettings();

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

  const [currentTokens, setCurrentTokens] = useState<TokenMatch[]>([]);
  const [currentFullText, setCurrentFullText] = useState("");
  const [currentPlainText, setCurrentPlainText] = useState("");
  const smartInputRef = useRef<SmartEditableInputHandle>(null);
  const [activeView, setActiveView] = useState<ViewTab>("list");

  // Calculate usage statistics from all todos
  const usageStats = useMemo<UsageStats>(() => {
    return calculateUsageStats(todos);
  }, [todos]);

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

  // All people and projects (including archived) for display in their tabs
  const allPeople = useMemo(() => {
    return sortByUsage(people, combinedPeopleUsage);
  }, [people, combinedPeopleUsage]);

  const allProjects = useMemo(() => {
    return sortByUsage(projects, usageStats.projects);
  }, [projects, usageStats.projects]);

  // Wrapper functions to convert name string to object format
  const handleAddPerson = (name: string) => {
    addPerson({
      name,
      alternatives: [],
      color: "#3b82f6", // default blue
    });
  };

  const handleAddProject = (name: string) => {
    addProject({
      name,
      alternatives: [],
      color: "#8b5cf6", // default purple
    });
  };

  const handleAddPriority = (name: string) => {
    addPriority({
      name,
      alternatives: [],
      color: "#ffa500", // default orange
      order: settings.priorities.length + 1,
    });
  };

  // Collapsible section states
  const [activeExpanded, setActiveExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(true);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  // Expanded todo detail state
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null);
  const [detailsOverlayTodo, setDetailsOverlayTodo] = useState<(typeof todos)[0] | null>(null);
  const [detailsOverlayPersonId, setDetailsOverlayPersonId] = useState<string | null>(null);
  const [detailsOverlayProjectId, setDetailsOverlayProjectId] = useState<string | null>(null);

  // Add todo overlay state
  const [isAddOverlayOpen, setIsAddOverlayOpen] = useState(false);
  const [isAddPersonOverlayOpen, setIsAddPersonOverlayOpen] = useState(false);
  const [isAddProjectOverlayOpen, setIsAddProjectOverlayOpen] = useState(false);

  // View presets state
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [activePreset, setActivePreset] = useState<string>("custom");

  // Sorting and grouping types
  type SortField = "dueDate" | "duration" | "assigned" | "source" | "mentioned" | "project" | "priority" | "created";
  type SortDirection = "asc" | "desc";
  type GroupBy = "none" | "dueDate";

  interface ViewPreset {
    name: string;
    filters: {
      searchText: string;
      assignedPeople: string[];
      sourcePeople: string[];
      mentionedPeople: string[];
      projects: string[];
      priorities: string[];
      dueDates: string[];
      durations: string[];
      tags: string[];
      recurring: string[];
      dependencies: string[];
    };
    sortField: SortField;
    sortDirection: SortDirection;
    groupBy: GroupBy;
  }

  // Load saved view presets
  const [viewPresets, setViewPresets] = useState<ViewPreset[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("doit-view-presets");
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (e) {
      console.error("Failed to load view presets from localStorage:", e);
    }
    return [];
  });

  // Save view presets to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("doit-view-presets", JSON.stringify(viewPresets));
    }
  }, [viewPresets]);

  // Load all view options from a single localStorage key
  const [filters, setFilters] = useState<TodoFilters>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("doit-view-options");
        if (saved) {
          const parsed = JSON.parse(saved);
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
      console.error("Failed to load view options from localStorage:", e);
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

  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("doit-view-options");
        if (saved) {
          const parsed = JSON.parse(saved);
          return (parsed.sortField as SortField) || "priority";
        }
      }
    } catch (e) {
      console.error("Failed to load view options from localStorage:", e);
    }
    return "priority";
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("doit-view-options");
        if (saved) {
          const parsed = JSON.parse(saved);
          return (parsed.sortDirection as SortDirection) || "asc";
        }
      }
    } catch (e) {
      console.error("Failed to load view options from localStorage:", e);
    }
    return "asc";
  });

  const [groupBy, setGroupBy] = useState<GroupBy>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("doit-view-options");
        if (saved) {
          const parsed = JSON.parse(saved);
          return (parsed.groupBy as GroupBy) || "dueDate";
        }
      }
    } catch (e) {
      console.error("Failed to load view options from localStorage:", e);
    }
    return "dueDate";
  });

  // Save all view options to localStorage whenever any of them change
  useEffect(() => {
    const viewOptions = {
      filters: {
        searchText: filters.searchText,
        assignedPeople: Array.from(filters.assignedPeople),
        sourcePeople: Array.from(filters.sourcePeople),
        mentionedPeople: Array.from(filters.mentionedPeople),
        projects: Array.from(filters.projects),
        priorities: Array.from(filters.priorities),
        dueDates: Array.from(filters.dueDates),
        durations: Array.from(filters.durations),
        tags: Array.from(filters.tags),
        recurring: Array.from(filters.recurring),
        dependencies: Array.from(filters.dependencies),
      },
      sortField,
      sortDirection,
      groupBy,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("doit-view-options", JSON.stringify(viewOptions));
    }

    // Check if current view matches any preset
    const matchingPreset = viewPresets.find((preset) => {
      return (
        preset.filters.searchText === filters.searchText &&
        arraysEqual(preset.filters.assignedPeople, Array.from(filters.assignedPeople)) &&
        arraysEqual(preset.filters.sourcePeople, Array.from(filters.sourcePeople)) &&
        arraysEqual(preset.filters.mentionedPeople, Array.from(filters.mentionedPeople)) &&
        arraysEqual(preset.filters.projects, Array.from(filters.projects)) &&
        arraysEqual(preset.filters.priorities, Array.from(filters.priorities)) &&
        arraysEqual(preset.filters.dueDates, Array.from(filters.dueDates)) &&
        arraysEqual(preset.filters.durations, Array.from(filters.durations)) &&
        preset.sortField === sortField &&
        preset.sortDirection === sortDirection &&
        preset.groupBy === groupBy
      );
    });

    setActivePreset(matchingPreset ? matchingPreset.name : "custom");
  }, [filters, sortField, sortDirection, groupBy, viewPresets]);

  // Helper function to compare arrays
  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  // Load a preset
  const loadPreset = (preset: ViewPreset) => {
    setFilters({
      searchText: preset.filters.searchText,
      assignedPeople: new Set(preset.filters.assignedPeople),
      sourcePeople: new Set(preset.filters.sourcePeople),
      mentionedPeople: new Set(preset.filters.mentionedPeople),
      projects: new Set(preset.filters.projects),
      priorities: new Set(preset.filters.priorities),
      dueDates: new Set(preset.filters.dueDates),
      durations: new Set(preset.filters.durations),
      tags: new Set(preset.filters.tags || []),
      recurring: new Set(preset.filters.recurring || []),
      dependencies: new Set(preset.filters.dependencies || []),
    });
    setSortField(preset.sortField);
    setSortDirection(preset.sortDirection);
    setGroupBy(preset.groupBy);
    setActivePreset(preset.name);
  };

  // Save current view as a preset
  const savePreset = (name: string) => {
    const newPreset: ViewPreset = {
      name,
      filters: {
        searchText: filters.searchText,
        assignedPeople: Array.from(filters.assignedPeople),
        sourcePeople: Array.from(filters.sourcePeople),
        mentionedPeople: Array.from(filters.mentionedPeople),
        projects: Array.from(filters.projects),
        priorities: Array.from(filters.priorities),
        dueDates: Array.from(filters.dueDates),
        durations: Array.from(filters.durations),
        tags: Array.from(filters.tags),
        recurring: Array.from(filters.recurring),
        dependencies: Array.from(filters.dependencies),
      },
      sortField,
      sortDirection,
      groupBy,
    };

    // Replace if exists, otherwise add
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
  };

  // Delete a preset
  const deletePreset = (name: string) => {
    setViewPresets((prev) => prev.filter((p) => p.name !== name));
    if (activePreset === name) {
      setActivePreset("custom");
    }
  };

  // Auto-focus the input when the overlay opens
  useEffect(() => {
    if (isAddOverlayOpen && smartInputRef.current) {
      // Use setTimeout to ensure the overlay is fully rendered
      setTimeout(() => {
        smartInputRef.current?.focus();
      }, 100);
    }
  }, [isAddOverlayOpen]);

  const handleTokensChange = (tokens: TokenMatch[], fullText: string, plainText: string) => {
    setCurrentTokens(tokens);
    setCurrentFullText(fullText);
    setCurrentPlainText(plainText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlainText.trim()) return;

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

    // Clear the smart input
    smartInputRef.current?.clear();
    setCurrentTokens([]);
    setCurrentFullText("");
    setCurrentPlainText("");
  };

  const markers = {
    assigned: "@",
    source: "$",
    mentioned: "^",
    project: "#",
    priority: "!!",
    dueDate: "~",
    duration: "*",
    recurring: "%",
    dependency: ">",
  };

  // Extract unique values from all todos for filter options
  const filterOptions = useMemo(() => {
    const assignedPeople = new Set<string>();
    const sourcePeople = new Set<string>();
    const mentionedPeople = new Set<string>();
    const projects = new Set<string>();
    const priorities = new Set<string>();
    const dueDates = new Set<string>();
    const durations = new Set<string>();
    const tags = new Set<string>();
    const recurring = new Set<string>();
    const dependencies = new Set<string>();

    todos.forEach((todo) => {
      todo.metadata.assignedPeople.forEach((p) => assignedPeople.add(p));
      todo.metadata.sourcePeople.forEach((p) => sourcePeople.add(p));
      todo.metadata.mentionedPeople.forEach((p) => mentionedPeople.add(p));
      todo.metadata.projects.forEach((p) => projects.add(p));
      if (todo.metadata.priority) priorities.add(todo.metadata.priority);
      if (todo.metadata.dueDate) dueDates.add(todo.metadata.dueDate);
      if (todo.metadata.duration) durations.add(todo.metadata.duration);
      todo.metadata.tags.forEach((t) => tags.add(t));
      if (todo.metadata.recurring) recurring.add(todo.metadata.recurring);
      todo.metadata.dependencies.forEach((d) => dependencies.add(d));
    });

    return {
      assignedPeople: setToSortedArray(assignedPeople),
      sourcePeople: setToSortedArray(sourcePeople),
      mentionedPeople: setToSortedArray(mentionedPeople),
      projects: setToSortedArray(projects),
      priorities: setToSortedArray(priorities),
      dueDates: setToSortedArray(dueDates),
      durations: setToSortedArray(durations),
      tags: setToSortedArray(tags),
      recurring: setToSortedArray(recurring),
      dependencies: setToSortedArray(dependencies),
    };
  }, [todos]);

  // Filter handler functions
  const handleFilterClick = (type: keyof Omit<TodoFilters, "searchText">, value: string) => {
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
  };

  const handleSelectAll = (type: keyof Omit<TodoFilters, "searchText">) => {
    const allValues = filterOptions[type];
    setFilters((prev) => ({ ...prev, [type]: new Set(allValues) }));
  };

  const handleClearAll = (type: keyof Omit<TodoFilters, "searchText">) => {
    setFilters((prev) => ({ ...prev, [type]: new Set() }));
  };

  const handleClearAllFilters = () => {
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
  };

  // Helper function to get button color class for filter sections
  // Uses actual marker colors from settings
  const getFilterButtonColor = (type: keyof Omit<TodoFilters, "searchText">, value: string, isSelected: boolean) => {
    if (isSelected) {
      return "px-2 py-0.5 text-xs rounded transition-colors";
    }
    return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2 py-0.5 text-xs rounded transition-colors";
  };

  // Helper function to get button inline styles for filter sections
  const getFilterButtonStyle = (
    type: keyof Omit<TodoFilters, "searchText">,
    value: string,
    isSelected: boolean,
  ): React.CSSProperties | undefined => {
    if (!isSelected) return undefined;

    const markerColorMap: Record<string, keyof typeof settings.markerColors> = {
      assignedPeople: "assigned",
      projects: "project",
      sourcePeople: "source",
      mentionedPeople: "mentioned",
      priorities: "priority",
      dueDates: "dueDate",
      durations: "duration",
      tags: "tag",
      recurring: "recurring",
      dependencies: "dependency",
    };

    const markerKey = markerColorMap[type];
    const bgColor = settings.markerColors[markerKey];

    // Calculate text color based on background luminance
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminance > 0.5 ? "#000000" : "#FFFFFF";

    return {
      backgroundColor: bgColor,
      color: textColor,
    };
  };

  const hasActiveFilters =
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
    filters.dependencies.size > 0;

  // Apply filters to todos
  const applyFilters = (todoList: typeof todos) => {
    return todoList.filter((todo) => {
      // Text search
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        if (!todo.plainText.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Metadata filters (OR logic within each category)
      if (filters.assignedPeople.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.assignedPeople, filters.assignedPeople)) {
          return false;
        }
      }

      if (filters.sourcePeople.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.sourcePeople, filters.sourcePeople)) {
          return false;
        }
      }

      if (filters.mentionedPeople.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.mentionedPeople, filters.mentionedPeople)) {
          return false;
        }
      }

      if (filters.projects.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.projects, filters.projects)) {
          return false;
        }
      }

      if (filters.priorities.size > 0) {
        if (!setHasValue(filters.priorities, todo.metadata.priority)) {
          return false;
        }
      }

      if (filters.dueDates.size > 0) {
        if (!setHasValue(filters.dueDates, todo.metadata.dueDate)) {
          return false;
        }
      }

      if (filters.durations.size > 0) {
        if (!setHasValue(filters.durations, todo.metadata.duration)) {
          return false;
        }
      }

      if (filters.tags.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.tags, filters.tags)) {
          return false;
        }
      }

      if (filters.recurring.size > 0) {
        if (!setHasValue(filters.recurring, todo.metadata.recurring)) {
          return false;
        }
      }

      if (filters.dependencies.size > 0) {
        if (!arrayHasAnyFromSet(todo.metadata.dependencies, filters.dependencies)) {
          return false;
        }
      }

      return true;
    });
  };

  // Sort todos by the selected field and direction
  const sortTodos = (todoList: typeof todos) => {
    return [...todoList].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "dueDate":
          const aDate = a.metadata.dueDate || "";
          const bDate = b.metadata.dueDate || "";
          comparison = aDate.localeCompare(bDate);
          // Put empty dates at the end
          if (!aDate && bDate) return 1;
          if (aDate && !bDate) return -1;
          break;

        case "duration":
          const aDuration = a.metadata.duration || "";
          const bDuration = b.metadata.duration || "";
          comparison = aDuration.localeCompare(bDuration);
          if (!aDuration && bDuration) return 1;
          if (aDuration && !bDuration) return -1;
          break;

        case "assigned":
          const aAssigned = a.metadata.assignedPeople[0] || "";
          const bAssigned = b.metadata.assignedPeople[0] || "";
          comparison = aAssigned.localeCompare(bAssigned);
          break;

        case "source":
          const aSource = a.metadata.sourcePeople[0] || "";
          const bSource = b.metadata.sourcePeople[0] || "";
          comparison = aSource.localeCompare(bSource);
          break;

        case "mentioned":
          const aMentioned = a.metadata.mentionedPeople[0] || "";
          const bMentioned = b.metadata.mentionedPeople[0] || "";
          comparison = aMentioned.localeCompare(bMentioned);
          break;

        case "project":
          const aProject = a.metadata.projects[0] || "";
          const bProject = b.metadata.projects[0] || "";
          comparison = aProject.localeCompare(bProject);
          break;

        case "priority":
          const priorityOrder: Record<string, number> = {};
          settings.priorities.forEach((p, idx) => {
            priorityOrder[p.name.toLowerCase()] = p.order;
            p.alternatives.forEach((alt) => {
              priorityOrder[alt.toLowerCase()] = p.order;
            });
          });
          const aPriority = a.metadata.priority?.toLowerCase() || "";
          const bPriority = b.metadata.priority?.toLowerCase() || "";
          const aOrder = priorityOrder[aPriority] ?? 999;
          const bOrder = priorityOrder[bPriority] ?? 999;
          comparison = aOrder - bOrder;
          break;

        case "created":
        default:
          comparison = b.createdAt - a.createdAt; // Newest first by default
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  // Group todos by the selected grouping
  const groupTodos = (todoList: typeof todos): Record<string, typeof todos> => {
    if (groupBy === "none") {
      return { "": todoList };
    }

    if (groupBy === "dueDate") {
      const grouped: Record<string, typeof todos> = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;

      todoList.forEach((todo) => {
        let groupKey = "No Due Date";

        if (todo.metadata.dueDate) {
          try {
            // Parse the due date string - handle both YYYY-MM-DD and YYYY-MM-DDTHH:mm formats
            let dueDate: Date;
            const dueDateStr = todo.metadata.dueDate;

            if (dueDateStr.includes("T")) {
              // Has time component - extract date part and parse locally
              const [year, month, day] = dueDateStr.split("T")[0].split("-").map(Number);
              dueDate = new Date(year, month - 1, day);
            } else {
              // Date only format
              const [year, month, day] = dueDateStr.split("-").map(Number);
              dueDate = new Date(year, month - 1, day);
            }

            dueDate.setHours(0, 0, 0, 0);
            const dueDateMs = dueDate.getTime();

            if (dueDateMs < todayMs) {
              groupKey = "Overdue";
            } else if (dueDateMs === todayMs) {
              groupKey = "Today";
            } else if (dueDateMs === todayMs + oneDayMs) {
              groupKey = "Tomorrow";
            } else if (dueDateMs <= todayMs + 7 * oneDayMs) {
              groupKey = "This Week";
            } else if (dueDateMs <= todayMs + 30 * oneDayMs) {
              groupKey = "This Month";
            } else {
              groupKey = "Later";
            }
          } catch (e) {
            groupKey = "Invalid Date";
          }
        }

        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(todo);
      });

      // Sort groups by priority
      const groupOrder = [
        "Overdue",
        "Today",
        "Tomorrow",
        "This Week",
        "This Month",
        "Later",
        "No Due Date",
        "Invalid Date",
      ];
      const sortedGroups: Record<string, typeof todos> = {};
      groupOrder.forEach((key) => {
        if (grouped[key]) {
          sortedGroups[key] = grouped[key];
        }
      });

      return sortedGroups;
    }

    return { "": todoList };
  };

  // Sort todos by priority (legacy - now part of sortTodos)
  const sortByPriority = (todoList: typeof todos) => {
    const priorityOrder: Record<string, number> = {
      "0": 0,
      ubn: 0,
      "1": 1,
      high: 1,
      "2": 2,
      med: 2,
      medium: 2,
      "3": 3,
      low: 3,
      "4": 4,
      wish: 4,
    };

    return [...todoList].sort((a, b) => {
      const aPriority = a.metadata.priority?.toLowerCase() || "";
      const bPriority = b.metadata.priority?.toLowerCase() || "";

      const aOrder = priorityOrder[aPriority] ?? 999;
      const bOrder = priorityOrder[bPriority] ?? 999;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // If same priority or no priority, sort by creation date (newest first)
      return b.createdAt - a.createdAt;
    });
  };

  // Calculate archive threshold
  const archiveThresholdMs = settings.general.archiveDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Categorize todos and apply filters (exclude deleted todos)
  const allActiveTodos = todos.filter((todo) => todo.state === "active");
  const allCompletedTodos = todos.filter((todo) => {
    if (todo.state !== "completed") return false;
    if (!todo.completedAt) return true; // Legacy completed todos without timestamp
    const timeSinceCompletion = now - todo.completedAt;
    return timeSinceCompletion < archiveThresholdMs;
  });
  const allArchivedTodos = todos.filter((todo) => todo.state === "archived");

  const activeTodos = sortTodos(applyFilters(allActiveTodos));
  const groupedActiveTodos = groupTodos(activeTodos);
  const completedTodos = sortTodos(applyFilters(allCompletedTodos));
  const archivedTodos = sortTodos(applyFilters(allArchivedTodos));

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">DoIt</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddOverlayOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                title="Add new todo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
              <Link
                href="/settings"
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </Link>
            </div>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">A simple, extensible, local todo app</p>
        </header>

        {/* View Tabs */}
        <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveView("list")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeView === "list"
                ? "text-blue-600 dark:text-blue-400 border-blue-600"
                : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              List
            </div>
          </button>
          <button
            onClick={() => setActiveView("gantt")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeView === "gantt"
                ? "text-blue-600 dark:text-blue-400 border-blue-600"
                : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Gantt
            </div>
          </button>
          <button
            onClick={() => setActiveView("calendar")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeView === "calendar"
                ? "text-blue-600 dark:text-blue-400 border-blue-600"
                : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Calendar
            </div>
          </button>
          <button
            onClick={() => setActiveView("people")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeView === "people"
                ? "text-blue-600 dark:text-blue-400 border-blue-600"
                : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              People
            </div>
          </button>
          <button
            onClick={() => setActiveView("projects")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeView === "projects"
                ? "text-blue-600 dark:text-blue-400 border-blue-600"
                : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              Projects
            </div>
          </button>
        </div>

        {/* Filter Section - Only show in List view */}
        {activeView === "list" && (
          <div className="mb-6 space-y-3">
            {/* View Presets Row */}
            {viewPresets.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Views:</span>
                {viewPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => loadPreset(preset)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                      activePreset === preset.name
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
                {activePreset === "custom" && (
                  <span className="px-3 py-1.5 rounded-lg font-medium text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    Custom
                  </span>
                )}
              </div>
            )}

            {/* Top Row: Search + Show Filters Toggle + Group By + Sort By + Save */}
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.searchText}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchText: e.target.value }))}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Show Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  showFilters || hasActiveFilters
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                {showFilters ? "Hide" : "Filter"}
                {hasActiveFilters && !showFilters && (
                  <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                    {Object.values(filters).filter((v) => v && (typeof v === "string" ? v : v.size > 0)).length}
                  </span>
                )}
              </button>

              {/* Group By */}
              <div className="flex items-center gap-2 ml-4">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Group:</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                  className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None</option>
                  <option value="dueDate">Due Date</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Sort:</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created">Created</option>
                  <option value="dueDate">Due Date</option>
                  <option value="duration">Duration</option>
                  <option value="assigned">Assigned</option>
                  <option value="source">Source</option>
                  <option value="mentioned">Mentioned</option>
                  <option value="project">Project</option>
                  <option value="priority">Priority</option>
                </select>
                <button
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  title={sortDirection === "asc" ? "Ascending" : "Descending"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortDirection === "asc" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Save View Button */}
              <button
                onClick={() => setIsSavePresetOpen(true)}
                className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors ml-auto"
                title="Save current view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
              </button>
            </div>

            {/* Filter Badges Row */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleClearAllFilters}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  Clear All
                </button>
              </div>
            )}

            {showFilters && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
                {/* Assigned People Filter */}
                <FilterSection
                  label="Assigned (@)"
                  activeCount={filters.assignedPeople.size}
                  options={filterOptions.assignedPeople}
                  selectedValues={filters.assignedPeople}
                  onToggle={(value) => handleFilterClick("assignedPeople", value)}
                  onSelectAll={() => handleSelectAll("assignedPeople")}
                  onClear={() => handleClearAll("assignedPeople")}
                  getButtonColor={(value, isSelected) => getFilterButtonColor("assignedPeople", value, isSelected)}
                  getButtonStyle={(value, isSelected) => getFilterButtonStyle("assignedPeople", value, isSelected)}
                  formatLabel={(value) => `@${value}`}
                />

                {/* Projects Filter */}
                <FilterSection
                  label="Projects (#)"
                  activeCount={filters.projects.size}
                  options={filterOptions.projects}
                  selectedValues={filters.projects}
                  onToggle={(value) => handleFilterClick("projects", value)}
                  onSelectAll={() => handleSelectAll("projects")}
                  onClear={() => handleClearAll("projects")}
                  getButtonColor={(value, isSelected) => getFilterButtonColor("projects", value, isSelected)}
                  getButtonStyle={(value, isSelected) => getFilterButtonStyle("projects", value, isSelected)}
                  formatLabel={(value) => `#${value}`}
                />

                {/* Source People Filter */}
                <FilterSection
                  label="Source ($)"
                  activeCount={filters.sourcePeople.size}
                  options={filterOptions.sourcePeople}
                  selectedValues={filters.sourcePeople}
                  onToggle={(value) => handleFilterClick("sourcePeople", value)}
                  onSelectAll={() => handleSelectAll("sourcePeople")}
                  onClear={() => handleClearAll("sourcePeople")}
                  getButtonColor={(value, isSelected) => getFilterButtonColor("sourcePeople", value, isSelected)}
                  getButtonStyle={(value, isSelected) => getFilterButtonStyle("sourcePeople", value, isSelected)}
                  formatLabel={(value) => `$${value}`}
                />

                {/* Mentioned People Filter */}
                <FilterSection
                  label="Mentioned (^)"
                  activeCount={filters.mentionedPeople.size}
                  options={filterOptions.mentionedPeople}
                  selectedValues={filters.mentionedPeople}
                  onToggle={(value) => handleFilterClick("mentionedPeople", value)}
                  onSelectAll={() => handleSelectAll("mentionedPeople")}
                  onClear={() => handleClearAll("mentionedPeople")}
                  getButtonColor={(value, isSelected) => getFilterButtonColor("mentionedPeople", value, isSelected)}
                  getButtonStyle={(value, isSelected) => getFilterButtonStyle("mentionedPeople", value, isSelected)}
                  formatLabel={(value) => `^${value}`}
                />

                {/* Priority Filter */}
                <FilterSection
                  label="Priority (!!)"
                  activeCount={filters.priorities.size}
                  options={filterOptions.priorities}
                  selectedValues={filters.priorities}
                  onToggle={(value) => handleFilterClick("priorities", value)}
                  onSelectAll={() => handleSelectAll("priorities")}
                  onClear={() => handleClearAll("priorities")}
                  getButtonColor={(value, isSelected) => getFilterButtonColor("priorities", value, isSelected)}
                  getButtonStyle={(value, isSelected) => getFilterButtonStyle("priorities", value, isSelected)}
                  formatLabel={(value) => `!!${value}`}
                />

                {/* Due Date Filter */}
                <FilterSection
                  label="Due Date (~)"
                  activeCount={filters.dueDates.size}
                  options={filterOptions.dueDates}
                  selectedValues={filters.dueDates}
                  onToggle={(value) => handleFilterClick("dueDates", value)}
                  onSelectAll={() => handleSelectAll("dueDates")}
                  onClear={() => handleClearAll("dueDates")}
                  getButtonColor={(value, isSelected) => getFilterButtonColor("dueDates", value, isSelected)}
                  getButtonStyle={(value, isSelected) => getFilterButtonStyle("dueDates", value, isSelected)}
                  formatLabel={(value) => `~${value}`}
                />

                {/* Duration Filter */}
                <FilterSection
                  label="Duration (*)"
                  activeCount={filters.durations.size}
                  options={filterOptions.durations}
                  selectedValues={filters.durations}
                  onToggle={(value) => handleFilterClick("durations", value)}
                  onSelectAll={() => handleSelectAll("durations")}
                  onClear={() => handleClearAll("durations")}
                  getButtonColor={(value, isSelected) => getFilterButtonColor("durations", value, isSelected)}
                  getButtonStyle={(value, isSelected) => getFilterButtonStyle("durations", value, isSelected)}
                  formatLabel={(value) => `*${value}`}
                />

                {/* Tags Filter */}
                <FilterSection
                  label="Tags (&)"
                  activeCount={filters.tags.size}
                  options={filterOptions.tags}
                  selectedValues={filters.tags}
                  onToggle={(value) => handleFilterClick("tags", value)}
                  onSelectAll={() => handleSelectAll("tags")}
                  onClear={() => handleClearAll("tags")}
                  getButtonColor={(value, isSelected) => getFilterButtonColor("tags", value, isSelected)}
                  getButtonStyle={(value, isSelected) => getFilterButtonStyle("tags", value, isSelected)}
                  formatLabel={(value) => `&${value}`}
                />

                {/* Recurring Filter */}
                <FilterSection
                  label="Recurring (%)"
                  activeCount={filters.recurring.size}
                  options={filterOptions.recurring}
                  selectedValues={filters.recurring}
                  onToggle={(value) => handleFilterClick("recurring", value)}
                  onSelectAll={() => handleSelectAll("recurring")}
                  onClear={() => handleClearAll("recurring")}
                  getButtonColor={(value, isSelected) => getFilterButtonColor("recurring", value, isSelected)}
                  getButtonStyle={(value, isSelected) => getFilterButtonStyle("recurring", value, isSelected)}
                  formatLabel={(value) => `%${value}`}
                />

                {/* Dependencies Filter */}
                <FilterSection
                  label="Dependencies (>)"
                  activeCount={filters.dependencies.size}
                  options={filterOptions.dependencies}
                  selectedValues={filters.dependencies}
                  onToggle={(value) => handleFilterClick("dependencies", value)}
                  onSelectAll={() => handleSelectAll("dependencies")}
                  onClear={() => handleClearAll("dependencies")}
                  getButtonColor={(value, isSelected) => getFilterButtonColor("dependencies", value, isSelected)}
                  getButtonStyle={(value, isSelected) => getFilterButtonStyle("dependencies", value, isSelected)}
                  formatLabel={(value) => `>${value}`}
                />
              </div>
            )}
          </div>
        )}

        {/* View Content */}
        {activeView === "gantt" && (
          <GanttView
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
            onArchive={archiveTodo}
            onUnarchive={unarchiveTodo}
            settings={settings}
            linkPatterns={settings.linkPatterns}
            onAddComment={addTodoComment}
            onEditComment={editTodoComment}
            onDeleteComment={deleteTodoComment}
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
            onEditComment={editTodoComment}
            onDeleteComment={deleteTodoComment}
          />
        )}

        {/* People View */}
        {activeView === "people" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">People</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {allPeople.length} {allPeople.length === 1 ? "person" : "people"}
                </p>
              </div>
              <button
                onClick={() => setIsAddPersonOverlayOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Person
              </button>
            </div>
            {allPeople.length === 0 ? (
              <EmptyState emoji="👥" title="No People" message="No people yet. Add one to get started!" />
            ) : (
              <ul className="space-y-2">
                {allPeople.map((person) => (
                  <li key={person.id}>
                    <PersonItem
                      person={person}
                      onClick={() => setDetailsOverlayPersonId(person.id)}
                      onDelete={deletePerson}
                      onArchive={archivePerson}
                      onUnarchive={unarchivePerson}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Projects View */}
        {activeView === "projects" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Projects</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {allProjects.length} {allProjects.length === 1 ? "project" : "projects"}
                </p>
              </div>
              <button
                onClick={() => setIsAddProjectOverlayOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Project
              </button>
            </div>
            {allProjects.length === 0 ? (
              <EmptyState emoji="📁" title="No Projects" message="No projects yet. Add one to get started!" />
            ) : (
              <ul className="space-y-2">
                {allProjects.map((project) => (
                  <li key={project.id}>
                    <ProjectItem
                      project={project}
                      onClick={() => setDetailsOverlayProjectId(project.id)}
                      onDelete={deleteProject}
                      onArchive={archiveProject}
                      onUnarchive={unarchiveProject}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeView === "list" && (
          <>
            {todos.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-xl text-zinc-600 dark:text-zinc-400">No tasks yet. Add one to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTodos.length > 0 && (
                  <section>
                    <button
                      onClick={() => setActiveExpanded(!activeExpanded)}
                      className="w-full flex items-center justify-between text-left mb-3 group"
                    >
                      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Active ({activeTodos.length})
                      </h2>
                      <svg
                        className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                          activeExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeExpanded && (
                      <div className="space-y-4">
                        {Object.entries(groupedActiveTodos).map(([groupName, groupTodos]) => (
                          <div key={groupName}>
                            {groupName && (
                              <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-wide mb-2 pl-2">
                                {groupName} ({groupTodos.length})
                              </h3>
                            )}
                            <ul className="space-y-2">
                              {groupTodos.map((todo) => (
                                <li
                                  key={todo.id}
                                  onClick={() => setDetailsOverlayTodo(todo)}
                                  className="cursor-pointer"
                                >
                                  <TodoItem
                                    todo={todo}
                                    onToggle={toggleTodo}
                                    onDelete={deleteTodo}
                                    onArchive={archiveTodo}
                                    onUnarchive={unarchiveTodo}
                                    onEdit={editTodo}
                                    markerColors={settings.markerColors}
                                    settings={settings}
                                    linkPatterns={settings.linkPatterns}
                                    availablePeople={sortedPeople}
                                    availableProjects={sortedProjects}
                                    availablePriorities={sortedPriorities}
                                    availableTodos={todos}
                                    onAddPerson={handleAddPerson}
                                    onAddProject={handleAddProject}
                                    onAddPriority={handleAddPriority}
                                    isExpanded={false}
                                    onToggleExpand={() => {}}
                                    onAddComment={addTodoComment}
                                    onEditComment={editTodoComment}
                                    onDeleteComment={deleteTodoComment}
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {completedTodos.length > 0 && (
                  <section>
                    <button
                      onClick={() => setCompletedExpanded(!completedExpanded)}
                      className="w-full flex items-center justify-between text-left mb-3 group"
                    >
                      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Completed ({completedTodos.length})
                      </h2>
                      <svg
                        className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                          completedExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {completedExpanded && (
                      <ul className="space-y-2">
                        {completedTodos.map((todo) => (
                          <li key={todo.id} onClick={() => setDetailsOverlayTodo(todo)} className="cursor-pointer">
                            <TodoItem
                              todo={todo}
                              onToggle={toggleTodo}
                              onDelete={deleteTodo}
                              onArchive={archiveTodo}
                              onUnarchive={unarchiveTodo}
                              onEdit={editTodo}
                              markerColors={settings.markerColors}
                              settings={settings}
                              linkPatterns={settings.linkPatterns}
                              availablePeople={sortedPeople}
                              availableProjects={sortedProjects}
                              availablePriorities={sortedPriorities}
                              availableTodos={todos}
                              onAddPerson={handleAddPerson}
                              onAddProject={handleAddProject}
                              onAddPriority={handleAddPriority}
                              isExpanded={false}
                              onToggleExpand={() => {}}
                              onAddComment={addTodoComment}
                              onEditComment={editTodoComment}
                              onDeleteComment={deleteTodoComment}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {archivedTodos.length > 0 && (
                  <section>
                    <button
                      onClick={() => setArchivedExpanded(!archivedExpanded)}
                      className="w-full flex items-center justify-between text-left mb-3 group"
                    >
                      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Archived ({archivedTodos.length})
                      </h2>
                      <svg
                        className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${
                          archivedExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {archivedExpanded && (
                      <ul className="space-y-2">
                        {archivedTodos.map((todo) => (
                          <li key={todo.id} onClick={() => setDetailsOverlayTodo(todo)} className="cursor-pointer">
                            <TodoItem
                              todo={todo}
                              onToggle={toggleTodo}
                              onDelete={deleteTodo}
                              onArchive={archiveTodo}
                              onUnarchive={unarchiveTodo}
                              onEdit={editTodo}
                              markerColors={settings.markerColors}
                              settings={settings}
                              linkPatterns={settings.linkPatterns}
                              availablePeople={sortedPeople}
                              availableProjects={sortedProjects}
                              availablePriorities={sortedPriorities}
                              availableTodos={todos}
                              onAddPerson={handleAddPerson}
                              onAddProject={handleAddProject}
                              onAddPriority={handleAddPriority}
                              isExpanded={false}
                              onToggleExpand={() => {}}
                              onAddComment={addTodoComment}
                              onEditComment={editTodoComment}
                              onDeleteComment={deleteTodoComment}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </div>
            )}

            {/* Save Preset Modal */}
            {isSavePresetOpen && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => setIsSavePresetOpen(false)}
              >
                <div
                  className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Save View Preset</h2>
                      <button
                        onClick={() => setIsSavePresetOpen(false)}
                        className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Input for new preset name */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Preset Name
                      </label>
                      <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Enter preset name..."
                        className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && presetName.trim()) {
                            savePreset(presetName.trim());
                          }
                        }}
                      />
                    </div>

                    <button
                      onClick={() => presetName.trim() && savePreset(presetName.trim())}
                      disabled={!presetName.trim()}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors mb-4"
                    >
                      Save as New Preset
                    </button>

                    {/* Existing presets */}
                    {viewPresets.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                          Or overwrite existing:
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {viewPresets.map((preset) => (
                            <div
                              key={preset.name}
                              className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                            >
                              <button
                                onClick={() => savePreset(preset.name)}
                                className="flex-1 text-left font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {preset.name}
                              </button>
                              <button
                                onClick={() => deletePreset(preset.name)}
                                className="ml-2 p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                title="Delete preset"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dependency Block Notification */}
            {dependencyBlockNotification && (
              <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100 rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 max-w-md animate-slide-down">
                  <svg
                    className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm flex-1">{dependencyBlockNotification}</p>
                </div>
              </div>
            )}

            {/* Undo Notifications */}
            {undoActions.length > 0 && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col-reverse gap-2">
                {undoActions.map((action) => (
                  <div
                    key={action.id}
                    className={`transition-opacity duration-3000 ${
                      fadingOutIds.has(action.id) ? "opacity-0" : "opacity-100 animate-slide-up"
                    }`}
                  >
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-3 min-w-[280px]">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {action.type === "delete" && "Todo deleted"}
                          {action.type === "complete" && "Todo completed"}
                          {action.type === "uncomplete" && "Todo marked as active"}
                          {action.type === "archive" && "Todo archived"}
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 truncate max-w-[180px]">
                          {action.todo.plainText}
                        </p>
                      </div>
                      <button
                        onClick={() => undo(action.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md font-medium transition-colors flex-shrink-0"
                      >
                        Undo
                      </button>
                      <button
                        onClick={() => dismissUndo(action.id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex-shrink-0"
                        aria-label="Dismiss"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Todo Details Overlay */}
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
                    onEdit={editTodo}
                    onArchive={archiveTodo}
                    onUnarchive={unarchiveTodo}
                    markerColors={settings.markerColors}
                    settings={settings}
                    linkPatterns={settings.linkPatterns}
                    availablePeople={sortedPeople}
                    availableProjects={sortedProjects}
                    availablePriorities={sortedPriorities}
                    onAddPerson={handleAddPerson}
                    onAddProject={handleAddProject}
                    onAddPriority={handleAddPriority}
                    onAddComment={addTodoComment}
                    onEditComment={editTodoComment}
                    onDeleteComment={deleteTodoComment}
                  />
                );
              })()}
          </>
        )}

        {/* Person Details Overlay */}
        {detailsOverlayPersonId &&
          (() => {
            const person = people.find((p) => p.id === detailsOverlayPersonId);
            return person ? (
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
              />
            ) : null;
          })()}

        {/* Project Details Overlay */}
        {detailsOverlayProjectId &&
          (() => {
            const project = projects.find((p) => p.id === detailsOverlayProjectId);
            return project ? (
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
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add New Todo</h2>
                  <button
                    onClick={() => setIsAddOverlayOpen(false)}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Smart Input Markers Legend */}
                <MarkerReference />

                {/* Add Form */}
                <form
                  onSubmit={(e) => {
                    handleSubmit(e);
                    setIsAddOverlayOpen(false);
                  }}
                >
                  <div className="mb-4">
                    <SmartEditableInput
                      ref={smartInputRef}
                      markers={markers}
                      markerColors={settings.markerColors}
                      availablePeople={sortedPeople}
                      availableProjects={sortedProjects}
                      availablePriorities={sortedPriorities}
                      availableTodos={todos}
                      dateTimeSettings={settings.dateTime}
                      workHoursSettings={settings.workHours}
                      onAddPerson={handleAddPerson}
                      onAddProject={handleAddProject}
                      onAddPriority={handleAddPriority}
                      onTokensChange={handleTokensChange}
                      onEnterPress={() => {
                        const event = new Event("submit", { bubbles: true, cancelable: true });
                        handleSubmit(event as any);
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
            onClick={() => setIsAddPersonOverlayOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Person</h2>
                  <button
                    onClick={() => setIsAddPersonOverlayOpen(false)}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name") as string;
                    const alternatives = (formData.get("alternatives") as string)
                      .split(",")
                      .map((a) => a.trim())
                      .filter((a) => a);
                    const color = formData.get("color") as string;

                    if (name.trim()) {
                      addPerson({
                        name: name.trim(),
                        alternatives,
                        color,
                      });
                      setIsAddPersonOverlayOpen(false);
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

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Alternatives (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="alternatives"
                      placeholder="Johnny, JD, John D."
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Color</label>
                    <input
                      type="color"
                      name="color"
                      defaultValue="#3b82f6"
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddPersonOverlayOpen(false)}
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
            onClick={() => setIsAddProjectOverlayOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Project</h2>
                  <button
                    onClick={() => setIsAddProjectOverlayOpen(false)}
                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name") as string;
                    const alternatives = (formData.get("alternatives") as string)
                      .split(",")
                      .map((a) => a.trim())
                      .filter((a) => a);
                    const color = formData.get("color") as string;

                    if (name.trim()) {
                      addProject({
                        name: name.trim(),
                        alternatives,
                        color,
                      });
                      setIsAddProjectOverlayOpen(false);
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

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Alternatives (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="alternatives"
                      placeholder="Web Redesign, Site Refresh"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Color</label>
                    <input
                      type="color"
                      name="color"
                      defaultValue="#8b5cf6"
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddProjectOverlayOpen(false)}
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
      </div>
    </div>
  );
}
