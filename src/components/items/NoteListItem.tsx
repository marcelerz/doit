"use client";

import { NoteModel } from "@/models/NoteModel";
import { DocumentIcon, PinIcon } from "@/components/shared/Icons";
import { MarkedText } from "@/components/shared/MarkedText";
import { MarkerColors, defaultMarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";

interface NoteListItemProps {
  note: NoteModel;
  onClick: () => void;
  markerColors?: MarkerColors;
  linkPatterns?: LinkPattern[];
  availablePeople?: PersonModel[];
  availableProjects?: ProjectModel[];
}

/**
 * Compact note item for display in overlays (PersonDetailsOverlay, ProjectDetailsOverlay)
 */
export function NoteListItem({
  note,
  onClick,
  markerColors = defaultMarkerColors,
  linkPatterns = [],
  availablePeople = [],
  availableProjects = [],
}: NoteListItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
    >
      <div className="flex items-start gap-2">
        {/* Icon */}
        <DocumentIcon className="w-4 h-4 mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with highlighted markers */}
          <div className="flex items-center gap-1.5">
            {note.isPinned && (
              <PinIcon className="w-3 h-3 text-amber-500 flex-shrink-0" filled />
            )}
            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
              <MarkedText
                text={note.text}
                markerColors={markerColors}
                linkPatterns={linkPatterns}
                availablePeople={availablePeople}
                availableProjects={availableProjects}
                availablePriorities={[]}
              />
            </span>
            {note.isArchived && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                Archived
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
            <span>{note.ageDisplay}</span>
            {note.hasComments && <span>💬 {note.commentCount}</span>}
            {note.pendingActionItemCount > 0 && (
              <span>{note.pendingActionItemCount} action{note.pendingActionItemCount !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
