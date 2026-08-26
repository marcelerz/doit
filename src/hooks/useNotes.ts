"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { appendComment, amendComment, removeComment } from "@/utils/commentMutations";
import {
  Note,
  NoteId,
  NoteMetadata,
  NoteActivityType,
  ActionItem,
  CreatedActionItem,
  ActionItemId,
  getActionItemId,
} from "@/types/note";
import { TodoId, getTag } from "@/types/todo";
import { getTimestamp } from "@/types/time";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import { ActivityEntry, CommentId } from "@/types/types";

import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storage";
import { NoteModel, createNoteModels } from "@/models/NoteModel";
import { createSettingsModel } from "@/models/SettingsModel";
import { generatePrefixedUUID } from "@/utils/idGenerator";
import { useUndoableActions, UndoableAction } from "./useUndoableActions";
import { createActivityEntry } from "@/utils/activityUtils";
import { useSharedSettings } from "@/storage/settingsStore";

/**
 * Create a new activity entry for notes
 */
function createNoteActivity(
  type: NoteActivityType,
  description: string,
  metadata?: Record<string, unknown>,
): ActivityEntry<NoteActivityType> {
  return createActivityEntry(type, description, metadata);
}

/**
 * Convert NoteMetadata string values to typed Note fields.
 */
function metadataToNoteFields(metadata: NoteMetadata) {
  return {
    assignedPeople: (metadata.assignedPeople || []).map((name) => getPersonId(name)),
    sourcePeople: (metadata.sourcePeople || []).map((name) => getPersonId(name)),
    mentionedPeople: (metadata.mentionedPeople || []).map((name) => getPersonId(name)),
    projects: (metadata.projects || []).map((name) => getProjectId(name)),
    tags: (metadata.tags || []).map((tag) => getTag(tag)),
    content: metadata.content || "",
  };
}

/**
 * Reconstruct NoteMetadata from a Note's typed fields for activity comparison.
 */
function noteToMetadata(note: Note): NoteMetadata {
  return {
    assignedPeople: (note.assignedPeople || []).map((id) => id as string),
    sourcePeople: (note.sourcePeople || []).map((id) => id as string),
    mentionedPeople: (note.mentionedPeople || []).map((id) => id as string),
    projects: (note.projects || []).map((id) => id as string),
    tags: (note.tags || []).map((tag) => tag as string),
    content: note.content || "",
  };
}

/**
 * Compare two metadata objects and generate activities for changes
 */
function generateNoteMetadataActivities(
  oldMetadata: NoteMetadata,
  newMetadata: NoteMetadata,
): ActivityEntry<NoteActivityType>[] {
  const activities: ActivityEntry<NoteActivityType>[] = [];

  // Check assigned people changes
  const addedAssigned = newMetadata.assignedPeople.filter((p) => !oldMetadata.assignedPeople.includes(p));
  const removedAssigned = oldMetadata.assignedPeople.filter((p) => !newMetadata.assignedPeople.includes(p));
  addedAssigned.forEach((person) => {
    activities.push(createNoteActivity("assigned_added", `Assigned to @${person}`));
  });
  removedAssigned.forEach((person) => {
    activities.push(createNoteActivity("assigned_removed", `Unassigned from @${person}`));
  });

  // Check source people changes
  const addedSource = newMetadata.sourcePeople.filter((p) => !oldMetadata.sourcePeople.includes(p));
  const removedSource = oldMetadata.sourcePeople.filter((p) => !newMetadata.sourcePeople.includes(p));
  addedSource.forEach((person) => {
    activities.push(createNoteActivity("source_added", `Added source $${person}`));
  });
  removedSource.forEach((person) => {
    activities.push(createNoteActivity("source_removed", `Removed source $${person}`));
  });

  // Check mentioned people changes
  const addedMentioned = newMetadata.mentionedPeople.filter((p) => !oldMetadata.mentionedPeople.includes(p));
  const removedMentioned = oldMetadata.mentionedPeople.filter((p) => !newMetadata.mentionedPeople.includes(p));
  addedMentioned.forEach((person) => {
    activities.push(createNoteActivity("mentioned_added", `Mentioned ^${person}`));
  });
  removedMentioned.forEach((person) => {
    activities.push(createNoteActivity("mentioned_removed", `Removed mention ^${person}`));
  });

  // Check project changes
  const addedProjects = newMetadata.projects.filter((p) => !oldMetadata.projects.includes(p));
  const removedProjects = oldMetadata.projects.filter((p) => !newMetadata.projects.includes(p));
  addedProjects.forEach((project) => {
    activities.push(createNoteActivity("project_added", `Added to project %${project}`));
  });
  removedProjects.forEach((project) => {
    activities.push(createNoteActivity("project_removed", `Removed from project %${project}`));
  });

  // Check tag changes
  const newTags = newMetadata.tags ?? [];
  const oldTags = oldMetadata.tags ?? [];
  const addedTags = newTags.filter((t) => !oldTags.includes(t));
  const removedTags = oldTags.filter((t) => !newTags.includes(t));
  addedTags.forEach((tag) => {
    activities.push(createNoteActivity("tag_added", `Added tag #${tag}`));
  });
  removedTags.forEach((tag) => {
    activities.push(createNoteActivity("tag_removed", `Removed tag #${tag}`));
  });

  // Check content changes
  if (oldMetadata.content !== newMetadata.content) {
    if (newMetadata.content && !oldMetadata.content) {
      activities.push(createNoteActivity("content_changed", `Added content`));
    } else if (!newMetadata.content && oldMetadata.content) {
      activities.push(createNoteActivity("content_changed", `Removed content`));
    } else {
      activities.push(createNoteActivity("content_changed", `Updated content`));
    }
  }

  return activities;
}

export type NoteUndoAction = UndoableAction<"delete" | "archive", Note>;

export function useNotes() {
  const [rawNotes, setRawNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { settings } = useSharedSettings();

  // Finalize handler for undo actions (called when timeout expires or dismissed)
  const handleFinalize = useCallback((action: NoteUndoAction) => {
    if (action.type === "delete") {
      // Actually remove the deleted note from storage
      setRawNotes((prev) => prev.filter((note) => note.id !== action.entity.id));
    }
    // Archive actions don't need any finalization - the state is already updated
  }, []);

  // Undo handler for restoring previous state
  const handleUndo = useCallback((action: NoteUndoAction) => {
    if (action.type === "delete") {
      // Restore the deleted note with its previous state and add undelete activity
      if (action.previousState) {
        const restoredNote: Note = {
          ...action.previousState,
          activity: [...action.previousState.activity, createNoteActivity("undeleted", "Note undeleted")],
        };
        setRawNotes((prev) => [restoredNote, ...prev]);
      }
    } else if (action.type === "archive" && action.previousState) {
      // Restore previous state for archive with appropriate activity
      setRawNotes((prev) =>
        prev.map((note) => {
          if (note.id === action.entity.id) {
            return {
              ...action.previousState!,
              activity: [...action.previousState!.activity, createNoteActivity("unarchived", "Archive undone")],
            };
          }
          return note;
        }),
      );
    }
  }, []);

  const { undoActions, fadingOutIds, createUndoAction, undo, dismissUndo } = useUndoableActions<
    "delete" | "archive",
    Note
  >({
    onFinalize: handleFinalize,
    onUndo: handleUndo,
  });

  // Create a SettingsModel from settings for use with NoteModel
  const settingsModel = useMemo(() => createSettingsModel(settings), [settings]);

  // Create NoteModel instances from raw notes
  const notes = useMemo(() => createNoteModels(rawNotes, settingsModel), [rawNotes, settingsModel]);

  // Load notes from storage on mount
  useEffect(() => {
    waitForStorageInit().then(async () => {
      const loadedNotes = await loadFromStorage<Note[]>(STORAGE_KEYS.NOTES, []);
      // Filter out any deleted notes
      const cleanedNotes = loadedNotes.filter((note) => note.state !== "deleted");
      setRawNotes(cleanedNotes);

      // If we removed deleted notes, save the cleaned data
      if (cleanedNotes.length !== loadedNotes.length) {
        saveToStorage(STORAGE_KEYS.NOTES, cleanedNotes);
      }

      setIsLoaded(true);
    });
  }, []);

  // Save notes to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.NOTES, rawNotes);
    }
  }, [rawNotes, isLoaded]);

  // Find a note by ID
  const find = useCallback(
    (id: NoteId): NoteModel | undefined => {
      return notes.find((n) => n.id === id);
    },
    [notes],
  );

  // Add a new note
  const addNote = useCallback((text: string, plainText: string, metadata: NoteMetadata): NoteId => {
    const now = getTimestamp(Date.now());
    const fields = metadataToNoteFields(metadata);
    const newNote: Note = {
      id: NoteModel.createId(),
      text,
      plainText,
      state: "active",
      createdAt: now,
      updatedAt: now,
      content: fields.content,
      tags: fields.tags,
      pinned: false,
      assignedPeople: fields.assignedPeople,
      sourcePeople: fields.sourcePeople,
      mentionedPeople: fields.mentionedPeople,
      projects: fields.projects,
      actionItems: [],
      createdActionItems: [],
      comments: [],
      activity: [createNoteActivity("created", "Note created")],
    };
    setRawNotes((prev) => [newNote, ...prev]);
    return newNote.id;
  }, []);

  // Edit a note
  const editNote = useCallback(
    (id: NoteId, text: string, plainText: string, metadata: NoteMetadata) => {
      setRawNotes((prev) =>
        prev.map((note) => {
          if (note.id === id) {
            // Track text edit and metadata changes
            const activities: ActivityEntry<NoteActivityType>[] = [];

            // Check if text changed
            if (note.plainText !== plainText) {
              activities.push(createNoteActivity("edited", "Note title edited"));
            }

            // Reconstruct old metadata from note's current fields for comparison
            const oldMetadata = noteToMetadata(note);

            // Check for metadata changes
            const metadataActivities = generateNoteMetadataActivities(oldMetadata, metadata);
            activities.push(...metadataActivities);

            // Convert new metadata to typed fields
            const fields = metadataToNoteFields(metadata);

            return {
              ...note,
              text,
              plainText,
              content: fields.content,
              tags: fields.tags,
              assignedPeople: fields.assignedPeople,
              sourcePeople: fields.sourcePeople,
              mentionedPeople: fields.mentionedPeople,
              projects: fields.projects,
              updatedAt: getTimestamp(Date.now()),
              activity: [...note.activity, ...activities],
            };
          }
          return note;
        }),
      );
    },
    [],
  );

  // Delete a note
  const deleteNote = useCallback(
    (id: NoteId) => {
      const noteToDelete = rawNotes.find((n) => n.id === id);
      if (!noteToDelete) return;

      const previousState = structuredClone(noteToDelete);
      const now = getTimestamp(Date.now());
      const deletedNote: Note = {
        ...noteToDelete,
        state: "deleted",
        deletedAt: now,
        updatedAt: now,
        activity: [...noteToDelete.activity, createNoteActivity("deleted", "Note deleted")],
      };

      // Update the note to deleted state (keeps it in the list but hidden)
      setRawNotes((prev) => prev.map((note) => (note.id === id ? deletedNote : note)));

      // Create undo action
      createUndoAction("delete", deletedNote, previousState, id);
    },
    [rawNotes, createUndoAction],
  );

  // Archive a note
  const archiveNote = useCallback(
    (id: NoteId) => {
      const noteToArchive = rawNotes.find((n) => n.id === id);
      if (!noteToArchive) return;

      const previousState = structuredClone(noteToArchive);
      const now = getTimestamp(Date.now());
      const updatedNote: Note = {
        ...noteToArchive,
        state: "archived",
        archivedAt: now,
        updatedAt: now,
        deletedAt: undefined,
        activity: [...noteToArchive.activity, createNoteActivity("archived", "Note archived")],
      };

      setRawNotes((prev) => prev.map((note) => (note.id === id ? updatedNote : note)));

      // Create undo action
      createUndoAction("archive", updatedNote, previousState, id);
    },
    [rawNotes, createUndoAction],
  );

  // Unarchive a note
  const unarchiveNote = useCallback((id: NoteId) => {
    setRawNotes((prev) =>
      prev.map((note) => {
        if (note.id === id) {
          return {
            ...note,
            state: "active",
            archivedAt: undefined,
            deletedAt: undefined,
            updatedAt: getTimestamp(Date.now()),
            activity: [...note.activity, createNoteActivity("unarchived", "Note unarchived")],
          };
        }
        return note;
      }),
    );
  }, []);

  // Toggle pinned status
  const togglePinned = useCallback((id: NoteId) => {
    setRawNotes((prev) =>
      prev.map((note) => {
        if (note.id === id) {
          const newPinned = !note.pinned;
          return {
            ...note,
            pinned: newPinned,
            updatedAt: getTimestamp(Date.now()),
            activity: [
              ...note.activity,
              createNoteActivity(newPinned ? "pinned" : "unpinned", newPinned ? "Note pinned" : "Note unpinned"),
            ],
          };
        }
        return note;
      }),
    );
  }, []);

  // Reorder notes
  const reorderNotes = useCallback((orderedIds: NoteId[]) => {
    setRawNotes((prev) => {
      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
      return prev.map((note) => {
        const newOrder = orderMap.get(note.id);
        if (newOrder !== undefined && newOrder !== note.sortOrder) {
          return { ...note, sortOrder: newOrder, updatedAt: getTimestamp(Date.now()) };
        }
        return note;
      });
    });
  }, []);

  // Add a comment to a note
  const addNoteComment = useCallback((noteId: NoteId, content: string) => {
    const now = getTimestamp(Date.now());
    setRawNotes((prev) =>
      prev.map((note) => {
        if (note.id === noteId) {
          return {
            ...note,
            comments: appendComment(note.comments, content, now),
            updatedAt: now,
            activity: [...note.activity, createNoteActivity("comment_added", "Comment added")],
          };
        }
        return note;
      }),
    );
  }, []);

  // Edit a comment on a note
  const editNoteComment = useCallback((noteId: NoteId, commentId: CommentId, content: string) => {
    const now = getTimestamp(Date.now());
    setRawNotes((prev) =>
      prev.map((note) => {
        if (note.id === noteId) {
          return {
            ...note,
            comments: amendComment(note.comments, commentId, content, now),
            updatedAt: now,
            activity: [...note.activity, createNoteActivity("comment_edited", "Comment edited")],
          };
        }
        return note;
      }),
    );
  }, []);

  // Delete a comment from a note
  const deleteNoteComment = useCallback((noteId: NoteId, commentId: CommentId) => {
    const now = getTimestamp(Date.now());
    setRawNotes((prev) =>
      prev.map((note) => {
        if (note.id === noteId) {
          return {
            ...note,
            comments: removeComment(note.comments, commentId),
            updatedAt: now,
            activity: [...note.activity, createNoteActivity("comment_deleted", "Comment deleted")],
          };
        }
        return note;
      }),
    );
  }, []);

  // ===== Action Item Operations =====

  // Add an action item to a note
  const addActionItem = useCallback((noteId: NoteId, text: string, plainText: string) => {
    const now = getTimestamp(Date.now());
    const newActionItem: ActionItem = {
      id: getActionItemId(generatePrefixedUUID("action")),
      text,
      plainText,
      createdAt: now,
    };

    setRawNotes((prev) =>
      prev.map((note) => {
        if (note.id === noteId) {
          return {
            ...note,
            actionItems: [...(note.actionItems || []), newActionItem],
            updatedAt: now,
            activity: [...note.activity, createNoteActivity("action_item_added", `Action item added: ${plainText}`)],
          };
        }
        return note;
      }),
    );

    return newActionItem.id;
  }, []);

  // Edit an action item
  const editActionItem = useCallback((noteId: NoteId, actionItemId: ActionItemId, text: string, plainText: string) => {
    const now = getTimestamp(Date.now());
    setRawNotes((prev) =>
      prev.map((note) => {
        if (note.id === noteId) {
          return {
            ...note,
            actionItems: (note.actionItems || []).map((item) =>
              item.id === actionItemId ? { ...item, text, plainText } : item,
            ),
            updatedAt: now,
            activity: [...note.activity, createNoteActivity("action_item_edited", "Action item edited")],
          };
        }
        return note;
      }),
    );
  }, []);

  // Delete an action item
  const deleteActionItem = useCallback((noteId: NoteId, actionItemId: ActionItemId) => {
    const now = getTimestamp(Date.now());
    setRawNotes((prev) =>
      prev.map((note) => {
        if (note.id === noteId) {
          return {
            ...note,
            actionItems: (note.actionItems || []).filter((item) => item.id !== actionItemId),
            updatedAt: now,
            activity: [...note.activity, createNoteActivity("action_item_deleted", "Action item deleted")],
          };
        }
        return note;
      }),
    );
  }, []);

  // Convert action items to todos (returns created todo IDs)
  // This function takes a callback to actually create the todos (since todo creation is handled elsewhere)
  const convertActionItemsToTodos = useCallback(
    (
      noteId: NoteId,
      createTodo: (text: string, plainText: string, metadata: { sourceNoteId: NoteId; sourceActionItemId: ActionItemId }) => TodoId,
    ): TodoId[] => {
      const note = rawNotes.find((n) => n.id === noteId);
      if (!note) return [];

      const now = getTimestamp(Date.now());
      const createdTodoIds: TodoId[] = [];
      const newCreatedActionItems: CreatedActionItem[] = [];

      // Convert all non-empty pending action items
      for (const actionItem of note.actionItems || []) {
        if (actionItem.plainText.trim() === "") continue;

        const todoId = createTodo(actionItem.text, actionItem.plainText, {
          sourceNoteId: noteId,
          sourceActionItemId: actionItem.id,
        });

        createdTodoIds.push(todoId);
        newCreatedActionItems.push({
          id: actionItem.id,
          todoId: todoId as string,
          createdAt: actionItem.createdAt,
          convertedAt: now,
        });
      }

      // Update the note: clear pending action items, add to created action items
      if (createdTodoIds.length > 0) {
        setRawNotes((prev) =>
          prev.map((n) => {
            if (n.id === noteId) {
              return {
                ...n,
                actionItems: [], // Clear pending items
                createdActionItems: [...(n.createdActionItems || []), ...newCreatedActionItems],
                updatedAt: now,
                activity: [
                  ...n.activity,
                  createNoteActivity(
                    "action_items_converted",
                    `Converted ${createdTodoIds.length} action ${createdTodoIds.length === 1 ? "item" : "items"} to ${createdTodoIds.length === 1 ? "todo" : "todos"}`,
                  ),
                ],
              };
            }
            return n;
          }),
        );
      }

      return createdTodoIds;
    },
    [rawNotes],
  );

  // Convert the entire note to a todo
  // Returns the new todo's ID if conversion was successful
  const convertToTodo = useCallback(
    (
      noteId: NoteId,
      createTodo: (
        text: string,
        plainText: string,
        metadata: {
          assignedPeople: string[];
          sourcePeople: string[];
          mentionedPeople: string[];
          projects: string[];
          tags?: string[];
          context?: string;
        },
      ) => TodoId,
    ): TodoId | undefined => {
      const note = rawNotes.find((n) => n.id === noteId);
      if (!note) return undefined;

      const now = getTimestamp(Date.now());

      // Create the todo with note's metadata
      const todoId = createTodo(note.text, note.plainText, {
        assignedPeople: note.assignedPeople.map((id) => id as string),
        sourcePeople: note.sourcePeople.map((id) => id as string),
        mentionedPeople: note.mentionedPeople.map((id) => id as string),
        projects: note.projects.map((id) => id as string),
        tags: note.tags.map((t) => t as string),
        context: note.content, // Note content becomes todo context
      });

      // Archive the original note
      setRawNotes((prev) =>
        prev.map((n) => {
          if (n.id === noteId) {
            return {
              ...n,
              state: "archived",
              archivedAt: now,
              updatedAt: now,
              activity: [
                ...n.activity,
                createNoteActivity("converted_to_todo", `Converted to todo`, { todoId: todoId as string }),
              ],
            };
          }
          return n;
        }),
      );

      return todoId;
    },
    [rawNotes],
  );

  // Duplicate a note
  const duplicateNote = useCallback(
    (id: NoteId): NoteId | undefined => {
      const noteToDuplicate = rawNotes.find((n) => n.id === id);
      if (!noteToDuplicate) return undefined;

      const now = getTimestamp(Date.now());
      const newNote: Note = {
        ...structuredClone(noteToDuplicate),
        id: NoteModel.createId(),
        text: `${noteToDuplicate.text} (Copy)`,
        plainText: `${noteToDuplicate.plainText} (Copy)`,
        state: "active",
        createdAt: now,
        updatedAt: now,
        archivedAt: undefined,
        deletedAt: undefined,
        pinned: false,
        // Clear action items and comments for the duplicate
        actionItems: [],
        createdActionItems: [],
        comments: [],
        activity: [createNoteActivity("created", "Note created (duplicated)")],
      };

      setRawNotes((prev) => [newNote, ...prev]);
      return newNote.id;
    },
    [rawNotes],
  );

  return {
    notes,
    find,
    addNote,
    editNote,
    deleteNote,
    archiveNote,
    unarchiveNote,
    togglePinned,
    reorderNotes,
    addNoteComment,
    editNoteComment,
    deleteNoteComment,
    addActionItem,
    editActionItem,
    deleteActionItem,
    convertActionItemsToTodos,
    convertToTodo,
    duplicateNote,
    isLoaded,
    undoActions,
    fadingOutIds,
    undo,
    dismissUndo,
    settings,
  };
}
