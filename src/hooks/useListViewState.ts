"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { TodoModel } from "@/models/TodoModel";
import { ProjectModel } from "@/models/ProjectModel";
import { Settings } from "@/types/settings";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storage";
import { setToSortedArray, arrayHasAnyFromSet, setHasValue } from "@/utils/filterHelpers";

// Types
export interface TodoFilters {
  searchText: string;
  assignedPeople: Set<string>;
  sourcePeople: Set<string>;
  mentionedPeople: Set<string>;
  projects: Set<string>;
  categories: Set<string>;
  priorities: Set<string>;
  dueDates: Set<string>;
  durations: Set<string>;
  tags: Set<string>;
  recurring: Set<string>;
  dependencies: Set<string>;
}

export type SortField =
  | "manual"
  | "dueDate"
  | "duration"
  | "assigned"
  | "source"
  | "mentioned"
  | "project"
  | "priority"
  | "timeSpent"
  | "created"
  | "title";

export type SortDirection = "asc" | "desc";

export type GroupBy = "none" | "dueDate" | "priority" | "project" | "category" | "assigned" | "sprint";

export type QuickFilter = "all" | "today" | "overdue" | "thisWeek" | "noDueDate";

export interface ViewPreset {
  name: string;
  filters: {
    searchText: string;
    assignedPeople: string[];
    sourcePeople: string[];
    mentionedPeople: string[];
    projects: string[];
    categories: string[];
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
  quickFilter?: QuickFilter;
  sections?: {
    activeExpanded: boolean;
    completedExpanded: boolean;
    archivedExpanded: boolean;
  };
}

// Helper function to compare arrays
const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
};

// Empty filters constant
const emptyFilters: TodoFilters = {
  searchText: "",
  assignedPeople: new Set(),
  sourcePeople: new Set(),
  mentionedPeople: new Set(),
  projects: new Set(),
  categories: new Set(),
  priorities: new Set(),
  dueDates: new Set(),
  durations: new Set(),
  tags: new Set(),
  recurring: new Set(),
  dependencies: new Set(),
};

interface UseListViewStateProps {
  todos: TodoModel[];
  projects: ProjectModel[];
  settings: Settings;
}

export function useListViewState({ todos, projects, settings }: UseListViewStateProps) {
  // Filter state
  const [filters, setFilters] = useState<TodoFilters>({ ...emptyFilters });
  const [showFilters, setShowFilters] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Group state
  const [groupBy, setGroupBy] = useState<GroupBy>("dueDate");

  // Quick filter state
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>("all");

  // Section expanded states
  const [activeExpanded, setActiveExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(true);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  // Preset state
  const [viewPresets, setViewPresets] = useState<ViewPreset[]>([]);
  const [activePreset, setActivePreset] = useState<string>("custom");
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  // Loading states
  const [viewOptionsLoaded, setViewOptionsLoaded] = useState(false);
  const [viewPresetsLoaded, setViewPresetsLoaded] = useState(false);

  // Load view presets from storage on mount
  useEffect(() => {
    waitForStorageInit()
      .then(() => loadFromStorage<ViewPreset[]>(STORAGE_KEYS.VIEW_PRESETS, []))
      .then((saved) => {
        setViewPresets(saved);
        setViewPresetsLoaded(true);
      });
  }, []);

  // Save view presets to storage when they change
  useEffect(() => {
    if (viewPresetsLoaded) {
      saveToStorage(STORAGE_KEYS.VIEW_PRESETS, viewPresets);
    }
  }, [viewPresets, viewPresetsLoaded]);

  // Load view options from storage on mount
  useEffect(() => {
    loadFromStorage<{
      filters?: {
        searchText?: string;
        assignedPeople?: string[];
        sourcePeople?: string[];
        mentionedPeople?: string[];
        projects?: string[];
        categories?: string[];
        priorities?: string[];
        dueDates?: string[];
        durations?: string[];
        tags?: string[];
        recurring?: string[];
        dependencies?: string[];
      };
      sortField?: SortField;
      sortDirection?: SortDirection;
      groupBy?: GroupBy;
      quickFilter?: QuickFilter;
      sections?: {
        activeExpanded?: boolean;
        completedExpanded?: boolean;
        archivedExpanded?: boolean;
      };
    }>(STORAGE_KEYS.VIEW_OPTIONS, {}).then((saved) => {
      if (saved.filters) {
        setFilters({
          searchText: saved.filters.searchText || "",
          assignedPeople: new Set(saved.filters.assignedPeople || []),
          sourcePeople: new Set(saved.filters.sourcePeople || []),
          mentionedPeople: new Set(saved.filters.mentionedPeople || []),
          projects: new Set(saved.filters.projects || []),
          categories: new Set(saved.filters.categories || []),
          priorities: new Set(saved.filters.priorities || []),
          dueDates: new Set(saved.filters.dueDates || []),
          durations: new Set(saved.filters.durations || []),
          tags: new Set(saved.filters.tags || []),
          recurring: new Set(saved.filters.recurring || []),
          dependencies: new Set(saved.filters.dependencies || []),
        });
      }
      if (saved.sortField) setSortField(saved.sortField);
      if (saved.sortDirection) setSortDirection(saved.sortDirection);
      if (saved.groupBy) setGroupBy(saved.groupBy);
      if (saved.quickFilter) setActiveQuickFilter(saved.quickFilter);
      if (saved.sections) {
        if (saved.sections.activeExpanded !== undefined) setActiveExpanded(saved.sections.activeExpanded);
        if (saved.sections.completedExpanded !== undefined) setCompletedExpanded(saved.sections.completedExpanded);
        if (saved.sections.archivedExpanded !== undefined) setArchivedExpanded(saved.sections.archivedExpanded);
      }
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
        categories: Array.from(filters.categories),
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
      quickFilter: activeQuickFilter,
      sections: {
        activeExpanded,
        completedExpanded,
        archivedExpanded,
      },
    };
    saveToStorage(STORAGE_KEYS.VIEW_OPTIONS, viewOptions);

    // Check if current view matches any preset
    const matchingPreset = viewPresets.find((preset) => {
      return (
        preset.filters.searchText === filters.searchText &&
        arraysEqual(preset.filters.assignedPeople, Array.from(filters.assignedPeople)) &&
        arraysEqual(preset.filters.sourcePeople, Array.from(filters.sourcePeople)) &&
        arraysEqual(preset.filters.mentionedPeople, Array.from(filters.mentionedPeople)) &&
        arraysEqual(preset.filters.projects, Array.from(filters.projects)) &&
        arraysEqual(preset.filters.categories || [], Array.from(filters.categories)) &&
        arraysEqual(preset.filters.priorities, Array.from(filters.priorities)) &&
        arraysEqual(preset.filters.dueDates, Array.from(filters.dueDates)) &&
        arraysEqual(preset.filters.durations, Array.from(filters.durations)) &&
        arraysEqual(preset.filters.tags || [], Array.from(filters.tags)) &&
        arraysEqual(preset.filters.recurring || [], Array.from(filters.recurring)) &&
        arraysEqual(preset.filters.dependencies || [], Array.from(filters.dependencies)) &&
        preset.sortField === sortField &&
        preset.sortDirection === sortDirection &&
        preset.groupBy === groupBy &&
        (preset.quickFilter || "all") === activeQuickFilter &&
        (preset.sections?.activeExpanded ?? true) === activeExpanded &&
        (preset.sections?.completedExpanded ?? false) === completedExpanded &&
        (preset.sections?.archivedExpanded ?? false) === archivedExpanded
      );
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync active preset with current filter state
    setActivePreset(matchingPreset ? matchingPreset.name : "custom");
  }, [
    viewOptionsLoaded,
    filters,
    sortField,
    sortDirection,
    groupBy,
    activeQuickFilter,
    activeExpanded,
    completedExpanded,
    archivedExpanded,
    viewPresets,
  ]);

  // Quick filter counts
  const quickFilterCounts = useMemo(() => {
    const activeTodosAll = todos.filter((t) => t.isActive);
    return {
      all: activeTodosAll.length,
      today: activeTodosAll.filter((t) => t.isDueToday).length,
      overdue: activeTodosAll.filter((t) => t.isOverdue).length,
      thisWeek: activeTodosAll.filter((t) => t.isDueThisWeek).length,
      noDueDate: activeTodosAll.filter((t) => !t.hasDueDate).length,
    };
  }, [todos]);

  // Extract unique values from all todos for filter options
  const filterOptions = useMemo(() => {
    const assignedPeople = new Set<string>();
    const sourcePeople = new Set<string>();
    const mentionedPeople = new Set<string>();
    const projectNames = new Set<string>();
    const priorities = new Set<string>();
    const dueDates = new Set<string>();
    const durations = new Set<string>();
    const tags = new Set<string>();
    const recurring = new Set<string>();
    const dependencies = new Set<string>();
    const usedCategoryIds = new Set<string>();

    todos.forEach((todo) => {
      todo.assignedPeople.forEach((p) => assignedPeople.add(p));
      todo.sourcePeople.forEach((p) => sourcePeople.add(p));
      todo.mentionedPeople.forEach((p) => mentionedPeople.add(p));
      todo.projects.forEach((projectName) => {
        projectNames.add(projectName);
        const project = projects.find((p) => p.matchesAnyName([projectName]));
        if (project?.category) {
          usedCategoryIds.add(project.category);
        }
      });
      if (todo.priority) priorities.add(todo.priority);
      if (todo.dueDateDisplay) dueDates.add(todo.dueDateDisplay);
      if (todo.durationDisplay) durations.add(todo.durationDisplay);
      todo.tags.forEach((t) => tags.add(t));
      if (todo.recurring) recurring.add(todo.recurring);
      todo.dependencies.forEach((d) => dependencies.add(d));
    });

    return {
      assignedPeople: setToSortedArray(assignedPeople),
      sourcePeople: setToSortedArray(sourcePeople),
      mentionedPeople: setToSortedArray(mentionedPeople),
      projects: setToSortedArray(projectNames),
      categories: Array.from(usedCategoryIds),
      priorities: setToSortedArray(priorities),
      dueDates: setToSortedArray(dueDates),
      durations: setToSortedArray(durations),
      tags: setToSortedArray(tags),
      recurring: setToSortedArray(recurring),
      dependencies: setToSortedArray(dependencies),
    };
  }, [todos, projects]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.searchText !== "" ||
    filters.assignedPeople.size > 0 ||
    filters.sourcePeople.size > 0 ||
    filters.mentionedPeople.size > 0 ||
    filters.projects.size > 0 ||
    filters.categories.size > 0 ||
    filters.priorities.size > 0 ||
    filters.dueDates.size > 0 ||
    filters.durations.size > 0 ||
    filters.tags.size > 0 ||
    filters.recurring.size > 0 ||
    filters.dependencies.size > 0 ||
    activeQuickFilter !== "all";

  // Filter handler functions
  const handleFilterClick = useCallback(
    (type: keyof Omit<TodoFilters, "searchText">, value: string) => {
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
    (type: keyof Omit<TodoFilters, "searchText">) => {
      const allValues = filterOptions[type];
      setFilters((prev) => ({ ...prev, [type]: new Set(allValues) }));
    },
    [filterOptions],
  );

  const handleClearAll = useCallback((type: keyof Omit<TodoFilters, "searchText">) => {
    setFilters((prev) => ({ ...prev, [type]: new Set() }));
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({ ...emptyFilters });
    setActiveQuickFilter("all");
  }, []);

  // Apply filters to todos
  const applyFilters = useCallback(
    (todoList: TodoModel[]) => {
      return todoList.filter((todo) => {
        // Quick filter (only for active todos)
        if (activeQuickFilter !== "all" && todo.isActive) {
          switch (activeQuickFilter) {
            case "today":
              if (!todo.isDueToday) return false;
              break;
            case "overdue":
              if (!todo.isOverdue) return false;
              break;
            case "thisWeek":
              if (!todo.isDueThisWeek) return false;
              break;
            case "noDueDate":
              if (todo.hasDueDate) return false;
              break;
          }
        }

        // Text search
        if (filters.searchText && !todo.matchesSearch(filters.searchText)) {
          return false;
        }

        // Metadata filters (OR logic within each category)
        if (filters.assignedPeople.size > 0) {
          if (!arrayHasAnyFromSet(todo.assignedPeople, filters.assignedPeople)) return false;
        }

        if (filters.sourcePeople.size > 0) {
          if (!arrayHasAnyFromSet(todo.sourcePeople, filters.sourcePeople)) return false;
        }

        if (filters.mentionedPeople.size > 0) {
          if (!arrayHasAnyFromSet(todo.mentionedPeople, filters.mentionedPeople)) return false;
        }

        if (filters.projects.size > 0) {
          if (!arrayHasAnyFromSet(todo.projects, filters.projects)) return false;
        }

        // Category filter
        if (filters.categories.size > 0) {
          const todoCategories = todo.projects
            .map((projectName) => {
              const project = projects.find((p) => p.matchesAnyName([projectName]));
              return project?.category;
            })
            .filter((c): c is NonNullable<typeof c> => !!c);

          if (!arrayHasAnyFromSet(todoCategories, filters.categories)) return false;
        }

        if (filters.priorities.size > 0) {
          if (!setHasValue(filters.priorities, todo.priority)) return false;
        }

        if (filters.dueDates.size > 0) {
          if (!setHasValue(filters.dueDates, todo.dueDateDisplay)) return false;
        }

        if (filters.durations.size > 0) {
          if (!setHasValue(filters.durations, todo.durationDisplay)) return false;
        }

        if (filters.tags.size > 0) {
          if (!arrayHasAnyFromSet(todo.tags, filters.tags)) return false;
        }

        if (filters.recurring.size > 0) {
          if (!setHasValue(filters.recurring, todo.recurring)) return false;
        }

        if (filters.dependencies.size > 0) {
          if (!arrayHasAnyFromSet(todo.dependencies, filters.dependencies)) return false;
        }

        return true;
      });
    },
    [filters, activeQuickFilter, projects],
  );

  // Sort todos
  const sortTodos = useCallback(
    (todoList: TodoModel[]) => {
      return [...todoList].sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
          case "manual":
            comparison = 0; // Keep original order
            break;
          case "dueDate": {
            const aDate = a.metadata.dueDate;
            const bDate = b.metadata.dueDate;
            if (!aDate && !bDate) comparison = 0;
            else if (!aDate) comparison = 1;
            else if (!bDate) comparison = -1;
            else comparison = aDate.localeCompare(bDate);
            break;
          }
          case "duration": {
            const aDur = a.durationMinutes || 0;
            const bDur = b.durationMinutes || 0;
            comparison = aDur - bDur;
            break;
          }
          case "assigned": {
            const aAssigned = [...a.assignedPeople].sort().join(", ");
            const bAssigned = [...b.assignedPeople].sort().join(", ");
            if (aAssigned === "" && bAssigned === "") comparison = 0;
            else if (aAssigned === "") comparison = 1;
            else if (bAssigned === "") comparison = -1;
            else comparison = aAssigned.localeCompare(bAssigned);
            break;
          }
          case "source": {
            const aSource = [...a.sourcePeople].sort().join(", ");
            const bSource = [...b.sourcePeople].sort().join(", ");
            if (aSource === "" && bSource === "") comparison = 0;
            else if (aSource === "") comparison = 1;
            else if (bSource === "") comparison = -1;
            else comparison = aSource.localeCompare(bSource);
            break;
          }
          case "mentioned": {
            const aMentioned = [...a.mentionedPeople].sort().join(", ");
            const bMentioned = [...b.mentionedPeople].sort().join(", ");
            if (aMentioned === "" && bMentioned === "") comparison = 0;
            else if (aMentioned === "") comparison = 1;
            else if (bMentioned === "") comparison = -1;
            else comparison = aMentioned.localeCompare(bMentioned);
            break;
          }
          case "project": {
            const aProject = [...a.projects].sort().join(", ");
            const bProject = [...b.projects].sort().join(", ");
            if (aProject === "" && bProject === "") comparison = 0;
            else if (aProject === "") comparison = 1;
            else if (bProject === "") comparison = -1;
            else comparison = aProject.localeCompare(bProject);
            break;
          }
          case "priority": {
            const aOrder = a.priorityOrder ?? 999;
            const bOrder = b.priorityOrder ?? 999;
            comparison = aOrder - bOrder;
            break;
          }
          case "timeSpent": {
            const aTime = a.totalTrackedMinutes || 0;
            const bTime = b.totalTrackedMinutes || 0;
            comparison = aTime - bTime;
            break;
          }
          case "created": {
            const aCreated = a.createdAt || 0;
            const bCreated = b.createdAt || 0;
            comparison = aCreated - bCreated;
            break;
          }
          case "title":
            comparison = a.plainText.localeCompare(b.plainText);
            break;
          default:
            comparison = 0;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    },
    [sortField, sortDirection],
  );

  // Group todos
  const groupTodos = useCallback(
    (todoList: TodoModel[]): Record<string, TodoModel[]> => {
      if (groupBy === "none") {
        return { "": todoList };
      }

      if (groupBy === "dueDate") {
        const grouped: Record<string, TodoModel[]> = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMs = today.getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;

        todoList.forEach((todo) => {
          let group: string;
          const dueDate = todo.metadata.dueDate;

          if (!dueDate) {
            group = "No Due Date";
          } else {
            const dueDateObj = new Date(dueDate);
            if (isNaN(dueDateObj.getTime())) {
              group = "Invalid Date";
            } else {
              dueDateObj.setHours(0, 0, 0, 0);
              const dueDateMs = dueDateObj.getTime();
              const diffDays = Math.floor((dueDateMs - todayMs) / oneDayMs);

              if (diffDays < 0) {
                group = "Overdue";
              } else if (diffDays === 0) {
                group = "Today";
              } else if (diffDays === 1) {
                group = "Tomorrow";
              } else if (diffDays <= 7) {
                group = "This Week";
              } else if (diffDays <= 30) {
                group = "This Month";
              } else {
                group = "Later";
              }
            }
          }

          if (!grouped[group]) grouped[group] = [];
          grouped[group].push(todo);
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
        const sortedGroups: Record<string, TodoModel[]> = {};
        groupOrder.forEach((key) => {
          if (grouped[key]) sortedGroups[key] = grouped[key];
        });

        return sortedGroups;
      }

      if (groupBy === "priority") {
        const grouped: Record<string, TodoModel[]> = {};

        todoList.forEach((todo) => {
          const priority = todo.priority || "No Priority";
          if (!grouped[priority]) grouped[priority] = [];
          grouped[priority].push(todo);
        });

        // Sort groups by priority order
        const priorityOrder: Record<string, number> = {};
        settings.priorities.forEach((p) => {
          priorityOrder[p.name] = p.order;
          p.alternatives?.forEach((alt) => {
            priorityOrder[alt] = p.order;
          });
        });
        priorityOrder["No Priority"] = 999;

        const sortedKeys = Object.keys(grouped).sort((a, b) => {
          const aOrder = priorityOrder[a] ?? 998;
          const bOrder = priorityOrder[b] ?? 998;
          return aOrder - bOrder;
        });

        const sortedGroups: Record<string, TodoModel[]> = {};
        sortedKeys.forEach((key) => {
          sortedGroups[key] = grouped[key];
        });

        return sortedGroups;
      }

      if (groupBy === "project") {
        const grouped: Record<string, TodoModel[]> = {};

        todoList.forEach((todo) => {
          const projectList = todo.projects;
          if (projectList.length === 0) {
            const group = "No Project";
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(todo);
          } else {
            projectList.forEach((project) => {
              if (!grouped[project]) grouped[project] = [];
              grouped[project].push(todo);
            });
          }
        });

        return grouped;
      }

      if (groupBy === "category") {
        const grouped: Record<string, TodoModel[]> = {};

        todoList.forEach((todo) => {
          const projectList = todo.projects;
          const categories = new Set<string>();

          projectList.forEach((projectName) => {
            const project = projects.find((p) => p.matchesAnyName([projectName]));
            if (project?.category) {
              const category = settings.categories?.find((c) => c.id === project.category);
              if (category) {
                categories.add(category.name);
              }
            }
          });

          if (categories.size === 0) {
            const group = "No Category";
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(todo);
          } else {
            categories.forEach((category) => {
              if (!grouped[category]) grouped[category] = [];
              grouped[category].push(todo);
            });
          }
        });

        return grouped;
      }

      if (groupBy === "assigned") {
        const grouped: Record<string, TodoModel[]> = {};

        todoList.forEach((todo) => {
          const assignedList = todo.assignedPeople;
          if (assignedList.length === 0) {
            const group = "Unassigned";
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(todo);
          } else {
            assignedList.forEach((person) => {
              if (!grouped[person]) grouped[person] = [];
              grouped[person].push(todo);
            });
          }
        });

        return grouped;
      }

      if (groupBy === "sprint") {
        const grouped: Record<string, TodoModel[]> = {};

        todoList.forEach((todo) => {
          const sprint = todo.sprint || "No Sprint";
          if (!grouped[sprint]) grouped[sprint] = [];
          grouped[sprint].push(todo);
        });

        return grouped;
      }

      return { "": todoList };
    },
    [groupBy, settings.priorities, settings.categories, projects],
  );

  // Preset handlers
  const loadPreset = useCallback((preset: ViewPreset) => {
    setFilters({
      searchText: preset.filters.searchText,
      assignedPeople: new Set(preset.filters.assignedPeople),
      sourcePeople: new Set(preset.filters.sourcePeople),
      mentionedPeople: new Set(preset.filters.mentionedPeople),
      projects: new Set(preset.filters.projects),
      categories: new Set(preset.filters.categories || []),
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
    setActiveQuickFilter(preset.quickFilter || "all");
    if (preset.sections) {
      setActiveExpanded(preset.sections.activeExpanded);
      setCompletedExpanded(preset.sections.completedExpanded);
      setArchivedExpanded(preset.sections.archivedExpanded);
    }
    setActivePreset(preset.name);
  }, []);

  const savePreset = useCallback(
    (name: string) => {
      const newPreset: ViewPreset = {
        name,
        filters: {
          searchText: filters.searchText,
          assignedPeople: Array.from(filters.assignedPeople),
          sourcePeople: Array.from(filters.sourcePeople),
          mentionedPeople: Array.from(filters.mentionedPeople),
          projects: Array.from(filters.projects),
          categories: Array.from(filters.categories),
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
        quickFilter: activeQuickFilter,
        sections: {
          activeExpanded,
          completedExpanded,
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
      filters,
      sortField,
      sortDirection,
      groupBy,
      activeQuickFilter,
      activeExpanded,
      completedExpanded,
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
    [activePreset],
  );

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
    completedExpanded,
    setCompletedExpanded,
    archivedExpanded,
    setArchivedExpanded,

    // Preset state
    viewPresets,
    activePreset,
    isSavePresetOpen,
    setIsSavePresetOpen,
    presetName,
    setPresetName,

    // Filter handlers
    handleFilterClick,
    handleSelectAll,
    handleClearAll,
    handleClearAllFilters,

    // Data transformation
    applyFilters,
    sortTodos,
    groupTodos,

    // Preset handlers
    loadPreset,
    savePreset,
    deletePreset,
  };
}
