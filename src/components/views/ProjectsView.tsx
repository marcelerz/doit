"use client";

import React from "react";
import { ProjectItem } from "@/components/items/ProjectItem";
import { EntityListView } from "@/components/views/EntityListView";
import { ProjectModel } from "@/models/ProjectModel";
import { ProjectId } from "@/types/project";
import { TutorialStep } from "@/components/overlays/TutorialOverlay";
import { STORAGE_KEYS } from "@/storage/storage";

// Projects View Options for storage

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
  onCreateProjectNote?: (projectId: ProjectId) => void;
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
  onCreateProjectNote,
  searchInputRef,
}: ProjectsViewProps) {
  return (
    <EntityListView<ProjectModel, ProjectId>
      entities={projects}
      config={{
        title: "Projects",
        noun: "project",
        pluralNoun: "projects",
        addLabel: "Add Project",
        addTutorialId: "add-project-button",
        viewTestId: "projects-view",
        searchPlaceholder: "Search projects... (press / to focus)",
        storageKey: STORAGE_KEYS.PROJECTS_VIEW_OPTIONS,
        emptyEmoji: "\u{1F4C1}",
        emptyTitle: "No Projects",
        emptyMessage: "No projects yet. Add one to get started!",
        noResultsMessage: "No projects match your search.",
      }}
      onAdd={onAddProject}
      searchInputRef={searchInputRef}
      renderItem={(project) => (
        <ProjectItem
          project={project}
          onClick={() => onOpenProject(project.id)}
          onDelete={onDeleteProject}
          onArchive={onArchiveProject}
          onUnarchive={onUnarchiveProject}
          onRequestDeleteConfirm={onRequestDeleteConfirm}
          onCreateNote={onCreateProjectNote}
          counts={countsByProject.get(project.id)}
        />
      )}
    />
  );
}
