"use client";

import { useState, useEffect } from "react";
import { PersonModel } from "@/models/PersonModel";
import { Person, PersonId } from "@/types/person";
import { getColor, CommentId } from "@/types/types";
import RichTextEditor from "@/components/input/RichTextEditor";
import { Activity } from "@/components/shared/Activity";
import { ColorPicker } from "@/components/shared/ColorPicker";
import { AlternativesInput } from "@/components/shared/AlternativesInput";
import { ActionButtons } from "@/components/shared/ActionButtons";
import { Modal } from "@/components/shared/Modal";
import { CloseIcon } from "@/components/shared/Icons";

interface PersonDetailsOverlayProps {
  person: PersonModel;
  onClose: () => void;
  onUpdate: (id: PersonId, updates: Partial<Person>) => void;
  onDelete: (id: PersonId) => void;
  onArchive?: (id: PersonId) => void;
  onUnarchive?: (id: PersonId) => void;
  onAddComment: (personId: PersonId, content: string) => void;
  onEditComment: (personId: PersonId, commentId: CommentId, content: string) => void;
  onDeleteComment: (personId: PersonId, commentId: CommentId) => void;
}

export function PersonDetailsOverlay({
  person,
  onClose,
  onUpdate,
  onDelete,
  onArchive,
  onUnarchive,
  onAddComment,
  onEditComment: _onEditComment,
  onDeleteComment: _onDeleteComment,
}: PersonDetailsOverlayProps) {
  const [editingName, setEditingName] = useState(person.name);
  const [editingAlternatives, setEditingAlternatives] = useState(person.alternatives);
  const [editingColor, setEditingColor] = useState(person.color);
  const [editingContext, setEditingContext] = useState(person.context || "");
  const [newComment, setNewComment] = useState("");

  // Sync local state when person changes (after updates)
  // Legitimate prop sync pattern for editable form fields
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setEditingName(person.name);
    setEditingAlternatives(person.alternatives);
    setEditingColor(person.color);
    setEditingContext(person.context || "");
  }, [person]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Auto-save when fields change (except context - saved on blur)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (
        editingName.trim() !== person.name ||
        JSON.stringify(editingAlternatives) !== JSON.stringify(person.alternatives) ||
        editingColor !== person.color
      ) {
        onUpdate(person.id, {
          name: editingName.trim(),
          alternatives: editingAlternatives,
          color: editingColor ? getColor(editingColor) : undefined,
          context: editingContext.trim() || undefined,
        });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [editingName, editingAlternatives, editingColor, person, onUpdate, editingContext]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(person.id, newComment);
      setNewComment("");
    }
  };

  const handleDelete = () => {
    onDelete(person.id);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="3xl">
      <div className="p-6 space-y-6">
        {/* Header with Close Button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
              style={{ backgroundColor: editingColor || "#cce5ff" }}
            >
              {editingName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{editingName || "Person"}</h2>
              <div className="flex gap-1.5 mt-1">
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                  @{person.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                  ${person.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-medium">
                  {person.name}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Details Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Name Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Name</label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Person name"
              />
            </div>

            {/* Alternatives Field */}
            <AlternativesInput
              value={editingAlternatives}
              onChange={setEditingAlternatives}
              placeholder="e.g., Johnny, JD, John D."
            />

            {/* Color Field */}
            <ColorPicker value={editingColor} onChange={setEditingColor} defaultColor="#cce5ff" />
          </div>

          {/* Context */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">📝 Context</label>
            <RichTextEditor
              value={editingContext}
              onChange={(html) => setEditingContext(html || "")}
              onBlur={(html) => {
                // Commit context change on blur
                if ((html.trim() || undefined) !== person.context) {
                  onUpdate(person.id, {
                    name: editingName.trim(),
                    alternatives: editingAlternatives,
                    color: editingColor ? getColor(editingColor) : undefined,
                    context: html.trim() || undefined,
                  });
                }
              }}
              placeholder="Add context..."
              minHeight="100px"
              maxHeight="300px"
              noBorderInViewMode={true}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4">
            <ActionButtons
              isArchived={person.archived || false}
              onArchive={
                onArchive
                  ? () => {
                      onArchive(person.id);
                      onClose();
                    }
                  : undefined
              }
              onUnarchive={
                onUnarchive
                  ? () => {
                      onUnarchive(person.id);
                      onClose();
                    }
                  : undefined
              }
              onDelete={handleDelete}
              archiveLabel="Archive person"
              unarchiveLabel="Unarchive person"
              deleteLabel="Delete person"
            />
          </div>
        </div>

        {/* Activity Section */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-3">📋 Activity</h4>

          {/* Add comment input */}
          <div className="mb-4 flex gap-2 items-start">
            <div className="flex-1">
              <RichTextEditor
                value={newComment}
                onChange={setNewComment}
                placeholder="Add a comment..."
                minHeight="60px"
                maxHeight="200px"
                alwaysEditable={true}
              />
            </div>
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed dark:disabled:bg-zinc-700 text-white rounded-md font-medium transition-colors"
            >
              Add
            </button>
          </div>

          <Activity activities={person.activity || []} comments={person.comments} />
        </div>
      </div>
    </Modal>
  );
}
