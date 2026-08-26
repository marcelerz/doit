"use client";

import { MetadataSection } from "@/components/shared/MetadataSection";
import { tooltipContent } from "@/components/shared/InfoTooltip";
import { getTextColor } from "@/utils/colors";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";

/** The four people/project fields shared by the todo and note detail views. */
export interface EntityMetadata {
  assignedPeople: string[];
  sourcePeople: string[];
  mentionedPeople: string[];
  projects: string[];
}

interface EntityMetadataFieldsProps<M extends EntityMetadata> {
  metadata: M;
  /**
   * Generic over the metadata shape: both call sites carry extra fields of
   * their own -- notes have tags, todos have priority and due date -- and the
   * spread below must preserve them.
   */
  onChange: (next: M) => void;
  availablePeople: PersonModel[];
  availableProjects: ProjectModel[];
  onAddPerson?: (name: string) => void;
  onAddProject?: (name: string) => void;
  getPersonColor: (name: string) => string;
  getProjectColor: (name: string) => string;
}

/**
 * Assigned, Source, Mentioned and Projects.
 *
 * TodoDetailsOverlay and NoteDetailView carried this as 141 identical lines
 * apiece -- a diff of the two returned exactly one differing line, the
 * wrapper's classes.
 */
export function EntityMetadataFields<M extends EntityMetadata>({
  metadata: editingMetadata,
  onChange: handleMetadataChange,
  availablePeople,
  availableProjects,
  onAddPerson,
  onAddProject,
  getPersonColor,
  getProjectColor,
}: EntityMetadataFieldsProps<M>) {
  // A fragment, not a wrapper: both call sites keep their own grid, which also
  // holds fields these two views do not share.
  return (
    <>
      {/* Assigned People */}
      <MetadataSection
        title="Assigned"
        icon="👤"
        values={editingMetadata.assignedPeople}
        onRemove={(person) => {
          handleMetadataChange({
            ...editingMetadata,
            assignedPeople: editingMetadata.assignedPeople.filter((p) => p !== person),
          });
        }}
        onAdd={(name) => {
          if (onAddPerson && !availablePeople.find((p) => p.name === name)) {
            onAddPerson(name);
          }
          handleMetadataChange({
            ...editingMetadata,
            assignedPeople: [...editingMetadata.assignedPeople, name],
          });
        }}
        availableItems={availablePeople.map((p) => ({
          id: p.name,
          label: p.name,
          prefix: "@",
          alternatives: p.alternatives,
        }))}
        dropdownId="assigned"
        placeholder="Search people..."
        highlightColor="blue"
        emptyMessage="All people already assigned"
        getColor={getPersonColor}
        getTextColor={getTextColor}
        prefix="@"
        tooltip={tooltipContent.assignedPeople}
      />

      {/* Projects */}
      <MetadataSection
        title="Projects"
        icon="📁"
        values={editingMetadata.projects}
        onRemove={(project) => {
          handleMetadataChange({
            ...editingMetadata,
            projects: editingMetadata.projects.filter((p) => p !== project),
          });
        }}
        onAdd={(name) => {
          if (onAddProject && !availableProjects.find((p) => p.name === name)) {
            onAddProject(name);
          }
          handleMetadataChange({
            ...editingMetadata,
            projects: [...editingMetadata.projects, name],
          });
        }}
        availableItems={availableProjects.map((p) => ({
          id: p.name,
          label: `%${p.name}`,
          alternatives: p.alternatives,
        }))}
        dropdownId="project"
        placeholder="Search projects..."
        highlightColor="purple"
        emptyMessage="All projects already added"
        getColor={getProjectColor}
        getTextColor={getTextColor}
        prefix="%"
        tooltip={tooltipContent.projects}
      />

      {/* Source People */}
      <MetadataSection
        title="Source"
        icon="💼"
        values={editingMetadata.sourcePeople}
        onRemove={(person) => {
          handleMetadataChange({
            ...editingMetadata,
            sourcePeople: editingMetadata.sourcePeople.filter((p) => p !== person),
          });
        }}
        onAdd={(name) => {
          if (onAddPerson && !availablePeople.find((p) => p.name === name)) {
            onAddPerson(name);
          }
          handleMetadataChange({
            ...editingMetadata,
            sourcePeople: [...editingMetadata.sourcePeople, name],
          });
        }}
        availableItems={availablePeople.map((p) => ({
          id: p.name,
          label: `$${p.name}`,
          alternatives: p.alternatives,
        }))}
        dropdownId="source"
        placeholder="Search people..."
        highlightColor="green"
        emptyMessage="All people already added"
        getColor={getPersonColor}
        getTextColor={getTextColor}
        prefix="$"
        tooltip={tooltipContent.sourcePeople}
      />

      {/* Mentioned People */}
      <MetadataSection
        title="Mentioned"
        icon="💬"
        values={editingMetadata.mentionedPeople}
        onRemove={(person) => {
          handleMetadataChange({
            ...editingMetadata,
            mentionedPeople: editingMetadata.mentionedPeople.filter((p) => p !== person),
          });
        }}
        onAdd={(name) => {
          if (onAddPerson && !availablePeople.find((p) => p.name === name)) {
            onAddPerson(name);
          }
          handleMetadataChange({
            ...editingMetadata,
            mentionedPeople: [...editingMetadata.mentionedPeople, name],
          });
        }}
        availableItems={availablePeople.map((p) => ({
          id: p.name,
          label: p.name,
          alternatives: p.alternatives,
        }))}
        dropdownId="mentioned"
        placeholder="Search people..."
        highlightColor="pink"
        emptyMessage="All people already mentioned"
        getColor={getPersonColor}
        getTextColor={getTextColor}
        showPrefix={false}
        tooltip={tooltipContent.mentionedPeople}
      />
    </>
  );
}
