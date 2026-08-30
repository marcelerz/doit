"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { NoteId, NoteMetadata } from "@/types/note";
import { MarkerColors, defaultMarkerColors } from "@/types/markerColors";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import SmartEditableInput, { TokenMatch, SmartEditableInputHandle } from "@/components/input/SmartInput";
import { Modal } from "@/components/shared/Modal";
import { CloseIcon, PlusIcon } from "@/components/shared/Icons";
import { resolveTodoTitle } from "@/utils/tokenParser";

interface NoteAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (text: string, plainText: string, metadata: NoteMetadata) => NoteId;
  onNoteCreated?: (noteId: NoteId) => void;
  availablePeople: PersonModel[];
  availableProjects: ProjectModel[];
  markerColors?: MarkerColors;
}

export function NoteAddModal({
  isOpen,
  onClose,
  onAdd,
  onNoteCreated,
  availablePeople,
  availableProjects,
  markerColors = defaultMarkerColors,
}: NoteAddModalProps) {
  const [title, setTitle] = useState("");
  const [plainTitle, setPlainTitle] = useState("");
  const [tokens, setTokens] = useState<TokenMatch[]>([]);
  const inputRef = useRef<SmartEditableInputHandle>(null);

  // Focus the input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the modal is rendered
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Reset state when modal closes
  // Legitimate state reset pattern for modal forms
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setPlainTitle("");
      setTokens([]);
    }
  }, [isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Handle Escape to close
  useEscapeKey(onClose, isOpen);

  // Build metadata from tokens
  const buildMetadata = useCallback((): NoteMetadata => {
    const assigned: string[] = [];
    const source: string[] = [];
    const mentioned: string[] = [];
    const projects: string[] = [];
    const tags: string[] = [];

    tokens.forEach((token) => {
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
      content: "",
    };
  }, [tokens]);

  // Handle title change from SmartInput
  const handleTitleChange = useCallback((newTokens: TokenMatch[], fullText: string, newPlainText: string) => {
    setTitle(fullText);
    setPlainTitle(newPlainText);
    setTokens(newTokens);
  }, []);

  // Handle create
  const handleCreate = useCallback(() => {
    // Auto-detection may consume the whole title, so fall back to the raw text
    // rather than refusing to create a note called e.g. "urgent".
    const resolvedTitle = resolveTodoTitle(title, plainTitle);
    if (resolvedTitle === "") return;

    const metadata = buildMetadata();
    const noteId = onAdd(title, resolvedTitle, metadata);

    // Clear and close
    setTitle("");
    setPlainTitle("");
    setTokens([]);
    inputRef.current?.clear();
    onClose();

    // Notify that note was created (so parent can open detail view)
    onNoteCreated?.(noteId);
  }, [title, plainTitle, buildMetadata, onAdd, onClose, onNoteCreated]);

  // Handle Enter key to create
  const handleEnterPress = useCallback(() => {
    handleCreate();
  }, [handleCreate]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" label="Add note">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Add Note</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Title input */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Title
          </label>
          <SmartEditableInput
            ref={inputRef}
            initialValue={title}
            availablePeople={availablePeople}
            availableProjects={availableProjects}
            availablePriorities={[]}
            markerColors={markerColors}
            onAddPerson={() => {}}
            onAddProject={() => {}}
            onAddPriority={() => {}}
            placeholder="Note title... (use @, $, %, # for metadata)"
            onTokensChange={handleTitleChange}
            onEnterPress={handleEnterPress}
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            You can add @people, $sources, %projects, and #tags
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            data-testid="note-create-submit"
            disabled={title.trim() === ""}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create Note
          </button>
        </div>
      </div>
    </Modal>
  );
}
