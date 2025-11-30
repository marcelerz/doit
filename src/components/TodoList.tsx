"use client";

import { useState, useRef, useMemo } from "react";
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
    editTodo,
    addTodoComment,
    editTodoComment,
    deleteTodoComment,
    isLoaded,
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

  // Filter states
  const [filters, setFilters] = useState<TodoFilters>({
    searchText: "",
    assignedPeople: new Set(),
    sourcePeople: new Set(),
    mentionedPeople: new Set(),
    projects: new Set(),
    priorities: new Set(),
    dueDates: new Set(),
    durations: new Set(),
  });
  const [showFilters, setShowFilters] = useState(false);

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

  // Sort todos by priority
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

  // Categorize todos and apply filters
  const allActiveTodos = todos.filter((todo) => !todo.completed);
  const allCompletedTodos = todos.filter((todo) => {
    if (!todo.completed) return false;
    if (!todo.completedAt) return true; // Legacy completed todos without timestamp
    const timeSinceCompletion = now - todo.completedAt;
    return timeSinceCompletion < archiveThresholdMs;
  });
  const allArchivedTodos = todos.filter((todo) => {
    if (!todo.completed || !todo.completedAt) return false;
    const timeSinceCompletion = now - todo.completedAt;
    return timeSinceCompletion >= archiveThresholdMs;
  });

  const activeTodos = sortByPriority(applyFilters(allActiveTodos));
  const completedTodos = sortByPriority(applyFilters(allCompletedTodos));
  const archivedTodos = sortByPriority(applyFilters(allArchivedTodos));

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
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">Doit</h1>
            <Link
              href="/settings"
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors text-sm"
            >
              ⚙️ Settings
            </Link>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">Your simple and beautiful todo app</p>
        </header>

        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">✨ Smart Input Markers</h3>
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

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2">
            <div className="flex-1">
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
                }}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              Add
            </button>
          </div>
        </form>

        {/* Filter Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {showFilters ? "Hide Filters" : "Show Filters"}
              {hasActiveFilters && (
                <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">Active</span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Text Search */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.searchText}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchText: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
                  <ul className="space-y-2">
                    {activeTodos.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
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
      </div>
    </div>
  );
}
