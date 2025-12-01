"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { useTodos } from "@/hooks/useTodos";
import { useSettings } from "@/hooks/useSettings";
import { TodoItem } from "./TodoItem";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/SmartInput";
import { TodoMetadata } from "@/types/todo";

interface TodoFilters {
  searchText: string;
  assignedPeople: Set<string>;
  sourcePeople: Set<string>;
  mentionedPeople: Set<string>;
  projects: Set<string>;
  priorities: Set<string>;
  dueDates: Set<string>;
  durations: Set<string>;
}

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
    undo,
    dismissUndo,
  } = useTodos();
  const { settings, addPerson, addProject, addPriority } = useSettings();
  const [currentTokens, setCurrentTokens] = useState<TokenMatch[]>([]);
  const [currentFullText, setCurrentFullText] = useState("");
  const [currentPlainText, setCurrentPlainText] = useState("");
  const smartInputRef = useRef<SmartEditableInputHandle>(null);

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

  // Add todo overlay state
  const [isAddOverlayOpen, setIsAddOverlayOpen] = useState(false);

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
    };
    sortField: SortField;
    sortDirection: SortDirection;
    groupBy: GroupBy;
  }

  // Load saved view presets
  const [viewPresets, setViewPresets] = useState<ViewPreset[]>(() => {
    try {
      const saved = localStorage.getItem("doit-view-presets");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load view presets from localStorage:", e);
    }
    return [];
  });

  // Save view presets to localStorage
  useEffect(() => {
    localStorage.setItem("doit-view-presets", JSON.stringify(viewPresets));
  }, [viewPresets]);

  // Load all view options from a single localStorage key
  const [filters, setFilters] = useState<TodoFilters>(() => {
    try {
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
        };
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
    };
  });

  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState<SortField>(() => {
    try {
      const saved = localStorage.getItem("doit-view-options");
      if (saved) {
        const parsed = JSON.parse(saved);
        return (parsed.sortField as SortField) || "created";
      }
    } catch (e) {
      console.error("Failed to load view options from localStorage:", e);
    }
    return "created";
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    try {
      const saved = localStorage.getItem("doit-view-options");
      if (saved) {
        const parsed = JSON.parse(saved);
        return (parsed.sortDirection as SortDirection) || "desc";
      }
    } catch (e) {
      console.error("Failed to load view options from localStorage:", e);
    }
    return "desc";
  });

  const [groupBy, setGroupBy] = useState<GroupBy>(() => {
    try {
      const saved = localStorage.getItem("doit-view-options");
      if (saved) {
        const parsed = JSON.parse(saved);
        return (parsed.groupBy as GroupBy) || "none";
      }
    } catch (e) {
      console.error("Failed to load view options from localStorage:", e);
    }
    return "none";
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
      },
      sortField,
      sortDirection,
      groupBy,
    };
    localStorage.setItem("doit-view-options", JSON.stringify(viewOptions));

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
    const metadata: TodoMetadata = {
      assignedPeople: [],
      sourcePeople: [],
      mentionedPeople: [],
      projects: [],
    };

    currentTokens.forEach((token) => {
      switch (token.type) {
        case "assigned":
          metadata.assignedPeople.push(token.value);
          break;
        case "source":
          metadata.sourcePeople.push(token.value);
          break;
        case "mentioned":
          metadata.mentionedPeople.push(token.value);
          break;
        case "project":
          metadata.projects.push(token.value);
          break;
        case "priority":
          metadata.priority = token.value;
          break;
        case "dueDate":
          metadata.dueDate = token.value;
          break;
        case "duration":
          metadata.duration = token.value;
          break;
      }
    });

    // Apply auto-assignment defaults if enabled and field not provided
    if (settings.general.autoAssign.enabled) {
      const autoAssign = settings.general.autoAssign;

      if (metadata.assignedPeople.length === 0 && autoAssign.assignedPerson) {
        metadata.assignedPeople.push(autoAssign.assignedPerson);
      }
      if (metadata.sourcePeople.length === 0 && autoAssign.sourcePerson) {
        metadata.sourcePeople.push(autoAssign.sourcePerson);
      }
      if (metadata.mentionedPeople.length === 0 && autoAssign.mentionedPerson) {
        metadata.mentionedPeople.push(autoAssign.mentionedPerson);
      }
      if (metadata.projects.length === 0 && autoAssign.project) {
        metadata.projects.push(autoAssign.project);
      }
      if (!metadata.priority && autoAssign.priority) {
        metadata.priority = autoAssign.priority;
      }
      if (!metadata.dueDate && autoAssign.dueDate) {
        metadata.dueDate = autoAssign.dueDate;
      }
      if (!metadata.duration && autoAssign.duration) {
        metadata.duration = autoAssign.duration;
      }
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

    todos.forEach((todo) => {
      todo.metadata.assignedPeople.forEach((p) => assignedPeople.add(p));
      todo.metadata.sourcePeople.forEach((p) => sourcePeople.add(p));
      todo.metadata.mentionedPeople.forEach((p) => mentionedPeople.add(p));
      todo.metadata.projects.forEach((p) => projects.add(p));
      if (todo.metadata.priority) priorities.add(todo.metadata.priority);
      if (todo.metadata.dueDate) dueDates.add(todo.metadata.dueDate);
      if (todo.metadata.duration) durations.add(todo.metadata.duration);
    });

    return {
      assignedPeople: Array.from(assignedPeople).sort(),
      sourcePeople: Array.from(sourcePeople).sort(),
      mentionedPeople: Array.from(mentionedPeople).sort(),
      projects: Array.from(projects).sort(),
      priorities: Array.from(priorities).sort(),
      dueDates: Array.from(dueDates).sort(),
      durations: Array.from(durations).sort(),
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
    });
  };

  const hasActiveFilters =
    filters.searchText ||
    filters.assignedPeople.size > 0 ||
    filters.sourcePeople.size > 0 ||
    filters.mentionedPeople.size > 0 ||
    filters.projects.size > 0 ||
    filters.priorities.size > 0 ||
    filters.dueDates.size > 0 ||
    filters.durations.size > 0;

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
        if (!todo.metadata.assignedPeople.some((p) => filters.assignedPeople.has(p))) {
          return false;
        }
      }

      if (filters.sourcePeople.size > 0) {
        if (!todo.metadata.sourcePeople.some((p) => filters.sourcePeople.has(p))) {
          return false;
        }
      }

      if (filters.mentionedPeople.size > 0) {
        if (!todo.metadata.mentionedPeople.some((p) => filters.mentionedPeople.has(p))) {
          return false;
        }
      }

      if (filters.projects.size > 0) {
        if (!todo.metadata.projects.some((p) => filters.projects.has(p))) {
          return false;
        }
      }

      if (filters.priorities.size > 0) {
        if (!todo.metadata.priority || !filters.priorities.has(todo.metadata.priority)) {
          return false;
        }
      }

      if (filters.dueDates.size > 0) {
        if (!todo.metadata.dueDate || !filters.dueDates.has(todo.metadata.dueDate)) {
          return false;
        }
      }

      if (filters.durations.size > 0) {
        if (!todo.metadata.duration || !filters.durations.has(todo.metadata.duration)) {
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
            // Parse the due date string (YYYY-MM-DD format)
            const dueDate = new Date(todo.metadata.dueDate + "T00:00:00");
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
        <header className="mb-8">
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
          <p className="text-zinc-600 dark:text-zinc-400">
            Smart tasks with powerful filtering, custom views, and intelligent organization
          </p>
        </header>

        {/* Filter Section */}
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
              {filterOptions.assignedPeople.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Assigned (@) - {filters.assignedPeople.size}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectAll("assignedPeople")}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => handleClearAll("assignedPeople")}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.assignedPeople.map((person) => (
                      <button
                        key={person}
                        onClick={() => handleFilterClick("assignedPeople", person)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          filters.assignedPeople.has(person)
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        @{person}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Filter */}
              {filterOptions.projects.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Projects (#) - {filters.projects.size}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectAll("projects")}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => handleClearAll("projects")}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.projects.map((project) => (
                      <button
                        key={project}
                        onClick={() => handleFilterClick("projects", project)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          filters.projects.has(project)
                            ? "bg-purple-600 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        #{project}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Source People Filter */}
              {filterOptions.sourcePeople.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Source ($) - {filters.sourcePeople.size}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectAll("sourcePeople")}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => handleClearAll("sourcePeople")}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.sourcePeople.map((person) => (
                      <button
                        key={person}
                        onClick={() => handleFilterClick("sourcePeople", person)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          filters.sourcePeople.has(person)
                            ? "bg-green-600 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        ${person}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentioned People Filter */}
              {filterOptions.mentionedPeople.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Mentioned (^) - {filters.mentionedPeople.size}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectAll("mentionedPeople")}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => handleClearAll("mentionedPeople")}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.mentionedPeople.map((person) => (
                      <button
                        key={person}
                        onClick={() => handleFilterClick("mentionedPeople", person)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          filters.mentionedPeople.has(person)
                            ? "bg-yellow-600 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        ^{person}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Filter */}
              {filterOptions.priorities.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Priority (!!) - {filters.priorities.size}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectAll("priorities")}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => handleClearAll("priorities")}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.priorities.map((priority) => (
                      <button
                        key={priority}
                        onClick={() => handleFilterClick("priorities", priority)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          filters.priorities.has(priority)
                            ? "bg-red-600 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        !!{priority}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Date Filter */}
              {filterOptions.dueDates.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Due Date (~) - {filters.dueDates.size}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectAll("dueDates")}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => handleClearAll("dueDates")}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.dueDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => handleFilterClick("dueDates", date)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          filters.dueDates.has(date)
                            ? "bg-pink-600 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        ~{date}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration Filter */}
              {filterOptions.durations.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Duration (*) - {filters.durations.size}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectAll("durations")}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => handleClearAll("durations")}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.durations.map((duration) => (
                      <button
                        key={duration}
                        onClick={() => handleFilterClick("durations", duration)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          filters.durations.has(duration)
                            ? "bg-cyan-600 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        *{duration}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
                            <TodoItem
                              key={todo.id}
                              todo={todo}
                              onToggle={toggleTodo}
                              onDelete={deleteTodo}
                              onArchive={archiveTodo}
                              onUnarchive={unarchiveTodo}
                              onEdit={editTodo}
                              markerColors={settings.markerColors}
                              generalSettings={settings.general}
                              linkPatterns={settings.linkPatterns}
                              availablePeople={settings.people}
                              availableProjects={settings.projects}
                              availablePriorities={settings.priorities}
                              onAddPerson={handleAddPerson}
                              onAddProject={handleAddProject}
                              onAddPriority={handleAddPriority}
                              onMarkerClick={handleFilterClick}
                              isExpanded={expandedTodoId === todo.id}
                              onToggleExpand={() => setExpandedTodoId(expandedTodoId === todo.id ? null : todo.id)}
                              onAddComment={addTodoComment}
                              onEditComment={editTodoComment}
                              onDeleteComment={deleteTodoComment}
                            />
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
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        onArchive={archiveTodo}
                        onUnarchive={unarchiveTodo}
                        onEdit={editTodo}
                        markerColors={settings.markerColors}
                        generalSettings={settings.general}
                        linkPatterns={settings.linkPatterns}
                        availablePeople={settings.people}
                        availableProjects={settings.projects}
                        availablePriorities={settings.priorities}
                        onAddPerson={handleAddPerson}
                        onAddProject={handleAddProject}
                        onAddPriority={handleAddPriority}
                        onMarkerClick={handleFilterClick}
                        isExpanded={expandedTodoId === todo.id}
                        onToggleExpand={() => setExpandedTodoId(expandedTodoId === todo.id ? null : todo.id)}
                        onAddComment={addTodoComment}
                        onEditComment={editTodoComment}
                        onDeleteComment={deleteTodoComment}
                      />
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
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        onArchive={archiveTodo}
                        onUnarchive={unarchiveTodo}
                        onEdit={editTodo}
                        markerColors={settings.markerColors}
                        generalSettings={settings.general}
                        linkPatterns={settings.linkPatterns}
                        availablePeople={settings.people}
                        availableProjects={settings.projects}
                        availablePriorities={settings.priorities}
                        onAddPerson={handleAddPerson}
                        onAddProject={handleAddProject}
                        onAddPriority={handleAddPriority}
                        onMarkerClick={handleFilterClick}
                        isExpanded={expandedTodoId === todo.id}
                        onToggleExpand={() => setExpandedTodoId(expandedTodoId === todo.id ? null : todo.id)}
                        onAddComment={addTodoComment}
                        onEditComment={editTodoComment}
                        onDeleteComment={deleteTodoComment}
                      />
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}

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
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    ✨ Smart Input Markers
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-blue-800 dark:text-blue-200">
                    <div>
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">@name</code> Assign
                    </div>
                    <div>
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">#project</code> Project
                    </div>
                    <div>
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">$name</code> Source
                    </div>
                    <div>
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">^name</code> Mention
                    </div>
                    <div>
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">!!high</code> Priority
                    </div>
                    <div>
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">~date</code> Due
                    </div>
                    <div>
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">*2h</code> Duration
                    </div>
                  </div>
                </div>

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
                      availablePeople={settings.people}
                      availableProjects={settings.projects}
                      availablePriorities={settings.priorities}
                      dateTimeSettings={settings.general.dateTime}
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
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Preset Name</label>
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
      </div>
    </div>
  );
}
