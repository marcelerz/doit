"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProjectItem } from "@/components/items/ProjectItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlusIcon, SearchIcon, CloseIcon } from "@/components/shared/Icons";
import { ProjectModel } from "@/models/ProjectModel";
import { ProjectId } from "@/types/project";
import { TutorialStep } from "@/components/overlays/TutorialOverlay";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "@/storage/storage";

// Projects View Options for storage
interface ProjectsViewOptions {
  search?: string;
  showArchived?: boolean;
}

// Projects View Tutorial Steps
export const projectsViewTutorialSteps: TutorialStep[] = [
  {
    id: "projects-intro",
    title: "Project Management 📁",
    description: "The Projects View lets you organize tasks into projects. Use %mentions to link tasks to projects.",
    position: "center",
  },
  {
    id: "projects-add",
    title: "Create Projects ➕",
    description:
      'Click "Add Project" to create a new project. You can add:\n\n• Name and alternatives\n• Custom color\n• Description and notes',
    targetSelector: '[data-tutorial="add-project-button"]',
    position: "bottom",
    spotlightPadding: 8,
    fallbackHint: "The + Add Project button is at the top of the Projects view",
  },
  {
    id: "projects-link",
    title: "Link Tasks 🔗",
    description:
      'Use %project in your tasks to link them:\n\n• "Design homepage %Website"\n• Tasks can belong to multiple projects\n• Project names with spaces: %"My Project"',
    position: "center",
  },
  {
    id: "projects-filter",
    title: "Filter by Project 🔍",
    description:
      "In the List View, use filters to see only tasks for a specific project. Great for focusing on one project at a time!",
    position: "center",
  },
  {
    id: "projects-complete",
    title: "Projects Ready! 🎉",
    description: "You're set to organize with projects! Click on any project to see its tasks and progress.",
    position: "center",
  },
];

// Counts for todos and notes per entity
type EntityCounts = { activeTodos: number; closedTodos: number; activeNotes: number; archivedNotes: number };

interface ProjectsViewProps {
  projects: ProjectModel[];
  countsByProject: Map<string, EntityCounts>;
  onOpenProject: (projectId: ProjectId) => void;
  onDeleteProject: (id: ProjectId) => void;
  onArchiveProject: (id: ProjectId) => void;
  onUnarchiveProject: (id: ProjectId) => void;
  onRequestDeleteConfirm: (id: ProjectId, name: string) => void;
  onAddProject: () => void;
  /** Ref for focus management from parent (keyboard shortcut "/") */
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ProjectsView({
  projects,
  countsByProject,
  onOpenProject,
  onDeleteProject,
  onArchiveProject,
  onUnarchiveProject,
  onRequestDeleteConfirm,
  onAddProject,
  searchInputRef,
}: ProjectsViewProps) {
  // Internal state for search and show archived
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || localInputRef;

  // Load view options from storage on mount
  useEffect(() => {
    loadFromStorage<ProjectsViewOptions>(STORAGE_KEYS.PROJECTS_VIEW_OPTIONS, {}).then((saved) => {
      if (saved.search !== undefined) setSearch(saved.search);
      if (saved.showArchived !== undefined) setShowArchived(saved.showArchived);
      setOptionsLoaded(true);
    });
  }, []);

  // Persist view options to storage
  useEffect(() => {
    if (!optionsLoaded) return;
    saveToStorage(STORAGE_KEYS.PROJECTS_VIEW_OPTIONS, {
      search,
      showArchived,
    });
  }, [optionsLoaded, search, showArchived]);

  // Handlers for state changes
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleShowArchivedChange = useCallback((value: boolean) => {
    setShowArchived(value);
  }, []);

  // Filter projects based on search and archive filter
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Filter by archived status
      if (!showArchived && project.isArchived) return false;
      // Filter by search term
      if (search.trim()) {
        return project.matchesSearch(search);
      }
      return true;
    });
  }, [projects, search, showArchived]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Projects</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {filteredProjects.length} of {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <button
          onClick={onAddProject}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          data-tutorial="add-project-button"
        >
          <PlusIcon className="w-5 h-5" />
          Add Project
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search projects... (press / to focus)"
            className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => handleShowArchivedChange(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          Show archived
        </label>
      </div>

      {projects.length === 0 ? (
        <EmptyState emoji="📁" title="No Projects" message="No projects yet. Add one to get started!" />
      ) : filteredProjects.length === 0 ? (
        <EmptyState emoji="🔍" title="No Results" message="No projects match your search." />
      ) : (
        <ul className="space-y-2">
          {filteredProjects.map((project) => (
            <li key={project.id}>
              <ProjectItem
                project={project}
                onClick={() => onOpenProject(project.id)}
                onDelete={onDeleteProject}
                onArchive={onArchiveProject}
                onUnarchive={onUnarchiveProject}
                onRequestDeleteConfirm={onRequestDeleteConfirm}
                counts={countsByProject.get(project.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
