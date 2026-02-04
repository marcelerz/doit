"use client";

import { ProjectModel } from "@/models/ProjectModel";
import { ProjectId } from "@/types/project";
import { EntityItem, EntityCounts, PROJECT_CONFIG } from "./EntityItem";

interface ProjectItemProps {
  project: ProjectModel;
  onClick: () => void;
  onDelete: (id: ProjectId) => void;
  onArchive?: (id: ProjectId) => void;
  onUnarchive?: (id: ProjectId) => void;
  onRequestDeleteConfirm: (id: ProjectId, name: string) => void;
  onCreateNote?: (id: ProjectId) => void;
  counts?: EntityCounts;
}

export function ProjectItem({
  project,
  onClick,
  onDelete,
  onArchive,
  onUnarchive,
  onRequestDeleteConfirm,
  onCreateNote,
  counts,
}: ProjectItemProps) {
  return (
    <EntityItem<ProjectId>
      entity={project}
      config={PROJECT_CONFIG}
      onClick={onClick}
      onDelete={onDelete}
      onArchive={onArchive}
      onUnarchive={onUnarchive}
      onRequestDeleteConfirm={onRequestDeleteConfirm}
      onCreateNote={onCreateNote}
      counts={counts}
    />
  );
}
