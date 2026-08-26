"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { EntityMetadataFields } from "@/components/shared/EntityMetadataFields";
import { escapeRegex } from "@/utils/linkPatternUtils";
import { sanitizeUrl } from "@/utils/sanitize";
import { NoteModel } from "@/models/NoteModel";
import { NoteId, NoteMetadata, ActionItemId } from "@/types/note";
import { TodoId } from "@/types/todo";
import { CommentId } from "@/types/types";
import { MarkerColors, defaultMarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { TodoModel } from "@/models/TodoModel";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import RichTextEditor from "@/components/input/RichTextEditor";
import { Activity } from "@/components/shared/Activity";
import { ActionItemsSection } from "@/components/shared/ActionItemsSection";
import { MetadataSection } from "@/components/shared/MetadataSection";
import { InfoTooltip } from "@/components/shared/InfoTooltip";
import { MarkedText } from "@/components/shared/MarkedText";
import { useDropdownManager } from "@/hooks/useDropdownManager";
import {
  ArrowLeftIcon,
  ArchiveIcon,
  TrashIcon,
  UndoIcon,
  CheckCircleIcon,
  CloseIcon,
  InfoIcon,
  DuplicateIcon,
  ExternalLinkIcon,
  PinIcon,
} from "@/components/shared/Icons";
import { formatActivityDateTime } from "@/utils/activityLogger";

// Tooltip content for note fields
const tooltipContent = {
  content: "Rich text content for your note. Use formatting, lists, and links.",
  assignedPeople: "People assigned to this note (@name). Use @ prefix to tag.",
  projects: "Projects this note belongs to (%project). Use % prefix to tag.",
  sourcePeople: "Source or requester ($name). Use $ prefix to tag.",
  mentionedPeople: "Other people mentioned in this note.",
  tags: "Tags to categorize this note (#tag). Use # prefix to add.",
  actionItems: "Create follow-up todos from your notes.",
  activity: "History of changes and comments for this note.",
};

interface NoteDetailViewProps {
  note: NoteModel;
  onBack: () => void;
  onEdit: (id: NoteId, text: string, plainText: string, metadata: NoteMetadata) => void;
  onDelete: (id: NoteId) => void;
  onDuplicate?: (id: NoteId) => NoteId | undefined;
  onArchive: (id: NoteId) => void;
  onUnarchive: (id: NoteId) => void;
  onTogglePinned: (id: NoteId) => void;
  onConvertToTodo: (id: NoteId) => void;
  onAddComment: (noteId: NoteId, content: string) => void;
  onEditComment: (noteId: NoteId, commentId: CommentId, content: string) => void;
  onDeleteComment: (noteId: NoteId, commentId: CommentId) => void;
  onAddActionItem: (noteId: NoteId, text: string, plainText: string) => void;
  onEditActionItem: (noteId: NoteId, actionItemId: ActionItemId, text: string, plainText: string) => void;
  onDeleteActionItem: (noteId: NoteId, actionItemId: ActionItemId) => void;
  onConvertActionItems: (noteId: NoteId) => void;
  onOpenTodo: (todoId: TodoId) => void;
  onToggleTodo?: (todoId: TodoId) => void;
  onAddPerson?: (name: string) => void;
  onAddProject?: (name: string) => void;
  onRecordSelections?: (selections: {
    assignedPeople?: string[];
    sourcePeople?: string[];
    mentionedPeople?: string[];
    projects?: string[];
    tags?: string[];
  }) => void;
  todos: TodoModel[];
  availablePeople: PersonModel[];
  availableProjects: ProjectModel[];
  markerColors?: MarkerColors;
  linkPatterns?: LinkPattern[];
  autoFocusContent?: boolean;
}

export function NoteDetailView({
  note,
  onBack,
  onEdit,
  onDelete,
  onDuplicate,
  onArchive,
  onUnarchive,
  onTogglePinned,
  onConvertToTodo,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddActionItem,
  onEditActionItem,
  onDeleteActionItem,
  onConvertActionItems,
  onOpenTodo,
  onToggleTodo,
  onAddPerson,
  onAddProject,
  onRecordSelections,
  todos,
  availablePeople,
  availableProjects,
  markerColors = defaultMarkerColors,
  linkPatterns = [],
  autoFocusContent: _autoFocusContent = false,
}: NoteDetailViewProps) {
  // Editing states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(note.text);
  const [editingPlainTitle, setEditingPlainTitle] = useState(note.plainText);
  const [editingContent, setEditingContent] = useState(note.content);
  const [editingMetadata, setEditingMetadata] = useState<{
    assignedPeople: string[];
    sourcePeople: string[];
    mentionedPeople: string[];
    projects: string[];
    tags: string[];
  }>({
    assignedPeople: [...note.assignedPeople],
    sourcePeople: [...note.sourcePeople],
    mentionedPeople: [...note.mentionedPeople],
    projects: [...note.projects],
    tags: [...note.tags],
  });
  const [tokens, setTokens] = useState<TokenMatch[]>([]);
  const [newComment, setNewComment] = useState("");

  // Dropdown state management
  const dropdown = useDropdownManager();

  const titleInputRef = useRef<SmartEditableInputHandle>(null);
  const contentEditorRef = useRef<HTMLDivElement>(null);

  // Legitimate prop sync pattern for editable form fields - syncs local state when note prop changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setEditingTitle(note.text);
    setEditingPlainTitle(note.plainText);
    setEditingContent(note.content);
    setEditingMetadata({
      assignedPeople: [...note.assignedPeople],
      sourcePeople: [...note.sourcePeople],
      mentionedPeople: [...note.mentionedPeople],
      projects: [...note.projects],
      tags: [...note.tags],
    });
  }, [note]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Focus on title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  // Cancel title edit helper
  const handleCancelTitleEdit = useCallback(() => {
    setIsEditingTitle(false);
    setEditingTitle(note.text);
    setEditingPlainTitle(note.plainText);
    setTokens([]);
  }, [note.text, note.plainText]);

  // Handle Escape to cancel edit mode or go back
  // Note: handleBack is intentionally not in the deps - we use onBack directly
  // for Escape since handleBack depends on state that may not be final during keydown
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditingTitle) {
          handleCancelTitleEdit();
        } else {
          // For Escape, we trust that auto-save has already run or will run
          // The 500ms debounce should have captured recent changes
          onBack();
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onBack, isEditingTitle, handleCancelTitleEdit]);

  // Build metadata from tokens and current state
  const buildMetadata = useCallback(
    (tokensToUse: TokenMatch[], content: string, currentMetadata: typeof editingMetadata): NoteMetadata => {
      const assigned = [...currentMetadata.assignedPeople];
      const source = [...currentMetadata.sourcePeople];
      const mentioned = [...currentMetadata.mentionedPeople];
      const projects = [...currentMetadata.projects];
      const tags = [...currentMetadata.tags];

      // Add any new tokens from the title
      tokensToUse.forEach((token) => {
        switch (token.type) {
          case "assignedPeople":
            if (!assigned.includes(token.value)) assigned.push(token.value);
            break;
          case "sourcePeople":
            if (!source.includes(token.value)) source.push(token.value);
            break;
          case "mentionedPeople":
            if (!mentioned.includes(token.value)) mentioned.push(token.value);
            break;
          case "projects":
            if (!projects.includes(token.value)) projects.push(token.value);
            break;
          case "tags":
            if (!tags.includes(token.value)) tags.push(token.value);
            break;
        }
      });

      return {
        assignedPeople: assigned,
        sourcePeople: source,
        mentionedPeople: mentioned,
        projects: projects,
        tags: tags,
        content: content,
      };
    },
    [],
  );

  // Save title edit - extract metadata from tokens like TodoDetailsOverlay does
  const handleSaveTitleEdit = useCallback(() => {
    if (editingPlainTitle.trim() === "") return;

    // Build metadata from tokens (additive approach - use tokens as source of truth for title markers)
    const metadata: NoteMetadata = {
      // Arrays: extract from tokens
      assignedPeople: tokens.filter((t) => t.type === "assigned").map((t) => t.value),
      sourcePeople: tokens.filter((t) => t.type === "source").map((t) => t.value),
      mentionedPeople: tokens.filter((t) => t.type === "mentioned").map((t) => t.value),
      projects: tokens.filter((t) => t.type === "project").map((t) => t.value),
      tags: tokens.filter((t) => t.type === "tag").map((t) => t.value),
      // Preserve content from editingContent
      content: editingContent,
    };

    onEdit(note.id, editingTitle, editingPlainTitle, metadata);

    // Record selections for usage history
    onRecordSelections?.({
      assignedPeople: metadata.assignedPeople,
      sourcePeople: metadata.sourcePeople,
      mentionedPeople: metadata.mentionedPeople,
      projects: metadata.projects,
      tags: metadata.tags,
    });

    setIsEditingTitle(false);
  }, [editingPlainTitle, editingTitle, editingContent, tokens, note.id, onEdit, onRecordSelections]);

  // Auto-save when title, content, or metadata changes (skip when in title edit mode)
  useEffect(() => {
    // Don't auto-save title changes when in edit mode - wait for explicit save
    if (isEditingTitle) return;

    const handler = setTimeout(() => {
      const hasChanges =
        editingTitle !== note.text ||
        editingPlainTitle !== note.plainText ||
        editingContent !== note.content ||
        JSON.stringify(editingMetadata.assignedPeople) !== JSON.stringify(note.assignedPeople) ||
        JSON.stringify(editingMetadata.sourcePeople) !== JSON.stringify(note.sourcePeople) ||
        JSON.stringify(editingMetadata.mentionedPeople) !== JSON.stringify(note.mentionedPeople) ||
        JSON.stringify(editingMetadata.projects) !== JSON.stringify(note.projects) ||
        JSON.stringify(editingMetadata.tags) !== JSON.stringify(note.tags);

      if (hasChanges) {
        const metadata = buildMetadata(tokens, editingContent, editingMetadata);
        onEdit(note.id, editingTitle, editingPlainTitle, metadata);

        // Record selections for usage history
        onRecordSelections?.({
          assignedPeople: metadata.assignedPeople,
          sourcePeople: metadata.sourcePeople,
          mentionedPeople: metadata.mentionedPeople,
          projects: metadata.projects,
          tags: metadata.tags,
        });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [editingTitle, editingPlainTitle, editingContent, editingMetadata, tokens, note, onEdit, buildMetadata, isEditingTitle, onRecordSelections]);

  // Handle title change from SmartInput
  const handleTitleChange = useCallback((newTokens: TokenMatch[], fullText: string, plainText: string) => {
    setEditingTitle(fullText);
    setEditingPlainTitle(plainText);
    setTokens(newTokens);
  }, []);

  // Handle content change from RichTextEditor
  const handleContentChange = useCallback((html: string) => {
    setEditingContent(html);
  }, []);

  // Handle metadata changes
  const handleMetadataChange = useCallback((newMetadata: typeof editingMetadata) => {
    setEditingMetadata(newMetadata);
  }, []);

  // Color helpers for people and projects
  const getPersonColor = useCallback(
    (name: string) => {
      const person = availablePeople.find((p) => p.name === name);
      return person?.color || markerColors.assigned;
    },
    [availablePeople, markerColors.assigned],
  );

  const getProjectColor = useCallback(
    (name: string) => {
      const project = availableProjects.find((p) => p.name === name);
      return project?.color || markerColors.project;
    },
    [availableProjects, markerColors.project],
  );

  // Handle back navigation - save any pending changes first
  const handleBack = useCallback(() => {
    // Check if there are any unsaved changes
    const hasChanges =
      editingTitle !== note.text ||
      editingPlainTitle !== note.plainText ||
      editingContent !== note.content ||
      JSON.stringify(editingMetadata.assignedPeople) !== JSON.stringify(note.assignedPeople) ||
      JSON.stringify(editingMetadata.sourcePeople) !== JSON.stringify(note.sourcePeople) ||
      JSON.stringify(editingMetadata.mentionedPeople) !== JSON.stringify(note.mentionedPeople) ||
      JSON.stringify(editingMetadata.projects) !== JSON.stringify(note.projects) ||
      JSON.stringify(editingMetadata.tags) !== JSON.stringify(note.tags);

    // Save changes immediately before navigating back
    if (hasChanges) {
      const metadata = buildMetadata(tokens, editingContent, editingMetadata);
      onEdit(note.id, editingTitle, editingPlainTitle, metadata);
    }

    onBack();
  }, [
    editingTitle,
    editingPlainTitle,
    editingContent,
    editingMetadata,
    tokens,
    note,
    onEdit,
    buildMetadata,
    onBack,
  ]);

  // Action handlers
  const handleDelete = useCallback(() => {
    onDelete(note.id);
    handleBack();
  }, [note.id, onDelete, handleBack]);

  const handleArchive = useCallback(() => {
    onArchive(note.id);
    handleBack();
  }, [note.id, onArchive, handleBack]);

  const handleUnarchive = useCallback(() => {
    onUnarchive(note.id);
  }, [note.id, onUnarchive]);

  const handleTogglePinned = useCallback(() => {
    onTogglePinned(note.id);
  }, [note.id, onTogglePinned]);

  const handleConvertToTodo = useCallback(() => {
    onConvertToTodo(note.id);
    handleBack();
  }, [note.id, onConvertToTodo, handleBack]);

  // Comment handlers
  const handleAddComment = useCallback(
    (content: string) => {
      onAddComment(note.id, content);
    },
    [note.id, onAddComment],
  );

  const handleEditComment = useCallback(
    (commentId: CommentId, content: string) => {
      onEditComment(note.id, commentId, content);
    },
    [note.id, onEditComment],
  );

  const handleDeleteComment = useCallback(
    (commentId: CommentId) => {
      onDeleteComment(note.id, commentId);
    },
    [note.id, onDeleteComment],
  );

  // Duplicate handler
  const handleDuplicate = useCallback(() => {
    if (onDuplicate) {
      onDuplicate(note.id);
    }
  }, [note.id, onDuplicate]);


  // Get status badge info
  const getStatusBadge = () => {
    if (note.isArchived) {
      return { label: "Archived", color: "#6b7280" }; // zinc-500
    }
    if (note.isPinned) {
      return { label: "Pinned", color: "#f59e0b" }; // amber-500
    }
    return { label: "Active", color: "#22c55e" }; // green-500
  };

  const statusBadge = getStatusBadge();

  // Extract links from note text and content
  const extractLinks = () => {
    const foundLinks: { prefix: string; id: string; url: string; description: string; color: string }[] = [];
    const textToSearch = `${note.text} ${note.content}`;

    linkPatterns.forEach((linkPattern) => {
      const linkRegex = new RegExp(`${escapeRegex(linkPattern.prefix)}\\d{4,}`, "gi");
      const matches = textToSearch.matchAll(linkRegex);
      for (const match of matches) {
        const id = match[0].slice(linkPattern.prefix.length);
        // urlTemplate is user-entered and lands in an href below.
        const url = sanitizeUrl(linkPattern.urlTemplate.replace("{id}", id));
        if (url === null) continue;
        // Avoid duplicates
        if (!foundLinks.some(l => l.id === match[0])) {
          foundLinks.push({
            prefix: linkPattern.prefix,
            id: match[0],
            url,
            description: linkPattern.description,
            color: linkPattern.color,
          });
        }
      }
    });

    return foundLinks;
  };

  const foundLinks = extractLinks();

  return (
    <div className="space-y-6">
      {/* Header with back button and status badge */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Notes</span>
        </button>

        {/* Status badge */}
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: statusBadge.color + "20", color: statusBadge.color }}
        >
          {statusBadge.label}
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        {/* Title with click-to-edit */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            Title
          </label>
          {isEditingTitle ? (
            <div className="space-y-2">
              <SmartEditableInput
                ref={titleInputRef}
                initialValue={editingTitle}
                availablePeople={availablePeople}
                availableProjects={availableProjects}
                availablePriorities={[]}
                markerColors={markerColors}
                onAddPerson={onAddPerson || (() => {})}
                onAddProject={onAddProject || (() => {})}
                onAddPriority={() => {}}
                placeholder="Note title"
                onTokensChange={handleTitleChange}
                onEnterPress={handleSaveTitleEdit}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveTitleEdit}
                  disabled={editingPlainTitle.trim() === ""}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    editingPlainTitle.trim() === ""
                      ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelTitleEdit}
                  className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                {/* Marker reference tooltip */}
                <div className="relative ml-auto">
                  <button
                    onClick={() => dropdown.toggleDropdown("marker-reference")}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Show marker reference"
                  >
                    <InfoIcon className="w-4 h-4" />
                  </button>
                  {dropdown.isOpen("marker-reference") && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => dropdown.closeDropdown()} />
                      <div className="absolute right-0 top-full mt-2 z-40 w-80 p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            ✨ Smart Input Markers
                          </h3>
                          <button
                            onClick={() => dropdown.closeDropdown()}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                          >
                            <CloseIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <code className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono">
                              @name
                            </code>
                            <span className="text-zinc-600 dark:text-zinc-400">Assign</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <code className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-mono">
                              $name
                            </code>
                            <span className="text-zinc-600 dark:text-zinc-400">Source</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <code className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-mono">
                              %proj
                            </code>
                            <span className="text-zinc-600 dark:text-zinc-400">Project</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <code className="bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded font-mono">
                              #tag
                            </code>
                            <span className="text-zinc-600 dark:text-zinc-400">Tag</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <h2
              className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 cursor-text hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              <MarkedText
                text={note.text}
                markerColors={markerColors}
                linkPatterns={linkPatterns}
                availablePeople={availablePeople}
                availableProjects={availableProjects}
                availablePriorities={[]}
              />
            </h2>
          )}
        </div>

        {/* Timestamps with hover tooltips */}
        <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <div title={formatActivityDateTime(note.createdAt)}>
              <span className="font-medium">Created:</span> {note.createdDateDisplay} ({note.ageDisplay})
            </div>
            {note.updatedAt && (
              <div title={formatActivityDateTime(note.updatedAt)}>
                <span className="font-medium">Updated:</span> {note.updatedDateDisplay}
              </div>
            )}
            {note.archivedAt && (
              <div title={formatActivityDateTime(note.archivedAt)}>
                <span className="font-medium">Archived:</span> {note.archivedDateDisplay}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4" ref={contentEditorRef}>
          <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
            <span>📝 Content</span>
            <InfoTooltip content={tooltipContent.content} />
          </h4>
          <div data-testid="note-content-editor">
            <RichTextEditor
              value={editingContent}
              onChange={handleContentChange}
              placeholder="Write your note here... Use rich text formatting for better organization."
              minHeight="200px"
              maxHeight="500px"
              alwaysEditable
              linkPatterns={linkPatterns}
            />
          </div>
        </div>

        {/* Action Items (placed between Content and Properties) */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <span>✅ Action Items</span>
              <InfoTooltip content={tooltipContent.actionItems} />
              {note.pendingActionItemCount > 0 && (
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-500">
                  ({note.pendingActionItemCount} pending)
                </span>
              )}
            </h4>
          </div>
          <ActionItemsSection
            noteId={note.id}
            actionItems={note.actionItems}
            createdActionItems={note.createdActionItems}
            todos={todos}
            onAddActionItem={onAddActionItem}
            onEditActionItem={onEditActionItem}
            onDeleteActionItem={onDeleteActionItem}
            onConvertActionItems={onConvertActionItems}
            onOpenTodo={onOpenTodo}
            onToggleTodo={onToggleTodo}
            availablePeople={availablePeople}
            availableProjects={availableProjects}
            markerColors={markerColors}
            linkPatterns={linkPatterns}
          />
        </div>

        {/* Note Details Grid */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <EntityMetadataFields
            metadata={editingMetadata}
            onChange={handleMetadataChange}
            availablePeople={availablePeople}
            availableProjects={availableProjects}
            onAddPerson={onAddPerson}
            onAddProject={onAddProject}
            getPersonColor={getPersonColor}
            getProjectColor={getProjectColor}
          />

          {/* Tags */}
          <MetadataSection
            title="Tags"
            icon="🏷️"
            values={editingMetadata.tags}
            onRemove={(tag) => {
              handleMetadataChange({
                ...editingMetadata,
                tags: editingMetadata.tags.filter((t) => t !== tag),
              });
            }}
            onAdd={(tag) => {
              handleMetadataChange({
                ...editingMetadata,
                tags: [...editingMetadata.tags, tag],
              });
            }}
            availableItems={[]} // Tags are free-form
            dropdownId="tags"
            placeholder="Add tag..."
            highlightColor="amber"
            emptyMessage=""
            prefix="#"
            tooltip={tooltipContent.tags}
          />

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">🌐 Links</h4>
            {foundLinks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {foundLinks.map((link, idx) => (
                  <a
                    key={`${link.id}-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 rounded border hover:shadow-md transition-all inline-flex items-center gap-1"
                    style={{
                      backgroundColor: link.color || "#e0e0e0",
                      borderColor: link.color || "#d0d0d0",
                      color: "#333",
                    }}
                    title={`${link.description}: ${link.url}`}
                  >
                    <span className="font-bold">{link.id}</span>
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">No links found</div>
            )}
          </div>

          {/* Actions (co-located with properties) */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">⚡ Actions</h4>
            <div className="flex flex-wrap gap-2">
              {/* Pin button */}
              <button
                onClick={handleTogglePinned}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  note.isPinned
                    ? "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400"
                    : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <PinIcon className="w-4 h-4" filled={note.isPinned} />
                {note.isPinned ? "Unpin" : "Pin"}
              </button>

              {/* Convert to todo button */}
              {note.isActive && (
                <button
                  onClick={handleConvertToTodo}
                  className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Convert to Todo
                </button>
              )}

              {/* Duplicate button */}
              {onDuplicate && (
                <button
                  onClick={handleDuplicate}
                  className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <DuplicateIcon className="w-4 h-4" />
                  Duplicate
                </button>
              )}

              {/* Archive/Unarchive button */}
              {note.isActive && (
                <button
                  onClick={handleArchive}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <ArchiveIcon className="w-4 h-4" />
                  Archive
                </button>
              )}
              {note.isArchived && (
                <button
                  onClick={handleUnarchive}
                  className="px-3 py-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <UndoIcon className="w-4 h-4" />
                  Unarchive
                </button>
              )}

              {/* Delete button */}
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Activity (includes comments inline) */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <span>📋 Activity</span>
              <InfoTooltip content={tooltipContent.activity} />
              {(note.hasActivity || note.hasComments) && (
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-500">
                  ({note.activityCount} {note.activityCount === 1 ? "entry" : "entries"}
                  {note.hasComments && `, ${note.commentCount} ${note.commentCount === 1 ? "comment" : "comments"}`})
                </span>
              )}
            </h4>
          </div>

          {/* Add comment input */}
          <div className="mb-4 flex gap-2 items-start" data-testid="comment-add-section">
            <div className="flex-1">
              <RichTextEditor
                value={newComment}
                onChange={setNewComment}
                onSubmit={(html) => {
                  if (html.trim()) {
                    handleAddComment(html);
                    setNewComment("");
                  }
                }}
                placeholder="Add a comment..."
                minHeight="60px"
                maxHeight="200px"
                alwaysEditable={true}
                linkPatterns={linkPatterns}
              />
            </div>
            <button
              onClick={() => {
                if (newComment.trim()) {
                  handleAddComment(newComment);
                  setNewComment("");
                }
              }}
              disabled={newComment.trim() === ""}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              data-testid="add-comment-button"
            >
              Add
            </button>
          </div>

          <Activity
            activities={note.activity}
            comments={note.comments}
            linkPatterns={linkPatterns}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
          />
        </div>
      </div>
    </div>
  );
}
