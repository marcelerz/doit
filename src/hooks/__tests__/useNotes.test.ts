/**
 * @jest-environment jsdom
 */

/**
 * Characterisation tests for useNotes, which had none: they pin what is right
 * today, so the note fixes in the sweep have something to fail against. A known
 * defect is not asserted; it is an `it.todo` naming the backlog unit that fixes
 * it, and the fix turns it into its reproducer.
 */

import { renderHook, act } from "@testing-library/react";
import { useNotes } from "../useNotes";
import { settingsStore } from "@/storage/settingsStore";

// Mock storage
jest.mock("@/storage/storage", () =>
  jest.requireActual("@/__tests__/helpers/storageMock").mockStorageModule(),
);

jest.mock("@/storage/migrations", () => ({
  migrateSettings: jest.fn((settings) => settings),
}));

// Import mocks after setup
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { defaultSettings } from "@/types/settings";
import { ActionItem, Note, NoteActivityType, NoteId, NoteMetadata, getActionItemId, getNoteId } from "@/types/note";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import { getTimestamp } from "@/types/time";
import { TodoId, getTag, getTodoId } from "@/types/todo";
import { Comment, getCommentId } from "@/types/types";

type Notes = ReturnType<typeof useNotes>;

// Epoch milliseconds throughout, so nothing here depends on the time zone.
const CREATED = getTimestamp(Date.UTC(2026, 2, 9, 8, 0, 0));
const NOW = getTimestamp(Date.UTC(2026, 2, 10, 12, 0, 0));
const UNDO_WINDOW_MS = 10_000;
const FADE_OUT_MS = 3_000;

const NOTE_ID = getNoteId("note-1");
const OTHER_ID = getNoteId("note-2");
const THIRD_ID = getNoteId("note-3");
const COMMENT_ID = getCommentId("comment-1");
const ITEM_ID = getActionItemId("action-1");

const comment: Comment = { commentId: COMMENT_ID, history: [{ timestamp: CREATED, content: "Original" }] };
const otherComment: Comment = { ...comment, commentId: getCommentId("comment-2") };
const actionItem: ActionItem = { id: ITEM_ID, text: "Send deck @Ann", plainText: "Send deck", createdAt: CREATED };
const otherItem: ActionItem = { ...actionItem, id: getActionItemId("action-2"), text: "Recap", plainText: "Recap" };
const blankItem: ActionItem = { ...actionItem, id: getActionItemId("action-3"), text: "  ", plainText: "  " };

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: NOTE_ID,
    text: "Weekly sync",
    plainText: "Weekly sync",
    state: "active",
    createdAt: CREATED,
    updatedAt: CREATED,
    content: "",
    tags: [],
    pinned: false,
    assignedPeople: [],
    sourcePeople: [],
    mentionedPeople: [],
    projects: [],
    actionItems: [],
    createdActionItems: [],
    comments: [],
    activity: [],
    ...overrides,
  };
}

/** A note that references a person in every role, a project and a tag. */
const taggedNote = (overrides: Partial<Note> = {}): Note =>
  makeNote({
    text: "Kickoff %Web",
    plainText: "Kickoff",
    content: "<p>Agenda</p>",
    tags: [getTag("q3")],
    assignedPeople: [getPersonId("Ann")],
    sourcePeople: [getPersonId("Sam")],
    mentionedPeople: [getPersonId("Mo")],
    projects: [getProjectId("Web")],
    ...overrides,
  });

/** The editing metadata that describes taggedNote, and the one that describes makeNote. */
const TAGGED: NoteMetadata = {
  assignedPeople: ["Ann"],
  sourcePeople: ["Sam"],
  mentionedPeople: ["Mo"],
  projects: ["Web"],
  tags: ["q3"],
  content: "<p>Agenda</p>",
};
const NO_PEOPLE = { assignedPeople: [], sourcePeople: [], mentionedPeople: [] };
const PLAIN: NoteMetadata = { ...NO_PEOPLE, projects: [], tags: [], content: "" };

/** What a change does, the entry it logs, the call, the fields it sets, and any the note starts with. */
type Change = [string, NoteActivityType, (notes: Notes) => void, Partial<Note>, Partial<Note>?];
/** A freshly minted id: any text other than the ids the fixtures already use. */
const NEW_ID = expect.stringMatching(/^(?!(comment|action)-[12]$).+/);

const CHANGES: Change[] = [
  ["deleteNote marks the note deleted", "deleted", (n) => n.deleteNote(NOTE_ID), { state: "deleted", deletedAt: NOW }],
  ["archiveNote archives the note", "archived", (n) => n.archiveNote(NOTE_ID), { state: "archived", archivedAt: NOW }],
  [
    "unarchiveNote returns an archived note to active",
    "unarchived",
    (n) => n.unarchiveNote(NOTE_ID),
    { state: "active", archivedAt: undefined },
    { state: "archived", archivedAt: CREATED },
  ],
  ["togglePinned pins an unpinned note", "pinned", (n) => n.togglePinned(NOTE_ID), { pinned: true }],
  ["togglePinned unpins a pinned one", "unpinned", (n) => n.togglePinned(NOTE_ID), { pinned: false }, { pinned: true }],
  [
    "addNoteComment appends a comment under a new id",
    "comment_added",
    (n) => n.addNoteComment(NOTE_ID, "Agreed"),
    { comments: [comment, otherComment, { commentId: NEW_ID, history: [{ timestamp: NOW, content: "Agreed" }] }] },
  ],
  [
    "editNoteComment adds a revision and keeps the original wording",
    "comment_edited",
    (n) => n.editNoteComment(NOTE_ID, COMMENT_ID, "Fixed"),
    { comments: [{ ...comment, history: [...comment.history, { timestamp: NOW, content: "Fixed" }] }, otherComment] },
  ],
  [
    "deleteNoteComment removes only that comment",
    "comment_deleted",
    (n) => n.deleteNoteComment(NOTE_ID, COMMENT_ID),
    { comments: [otherComment] },
  ],
  [
    "addActionItem appends an item under a new id",
    "action_item_added",
    (n) => n.addActionItem(NOTE_ID, "Call %Web", "Call"),
    { actionItems: [actionItem, otherItem, { id: NEW_ID, text: "Call %Web", plainText: "Call", createdAt: NOW }] },
  ],
  [
    "editActionItem rewrites the item's text and keeps its id and creation time",
    "action_item_edited",
    (n) => n.editActionItem(NOTE_ID, ITEM_ID, "Send slides @Ann", "Send slides"),
    { actionItems: [{ ...actionItem, text: "Send slides @Ann", plainText: "Send slides" }, otherItem] },
  ],
  [
    "deleteActionItem removes only that item",
    "action_item_deleted",
    (n) => n.deleteActionItem(NOTE_ID, ITEM_ID),
    { actionItems: [otherItem] },
  ],
];

async function renderLoaded(notes: Note[] = []) {
  (loadFromStorage as jest.Mock).mockImplementation((key: string) =>
    Promise.resolve(key === STORAGE_KEYS.SETTINGS ? defaultSettings : notes),
  );
  const { result } = renderHook(() => useNotes());
  await act(async () => {
    jest.runAllTimers();
    await Promise.resolve();
  });
  return result;
}

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

/** The record behind an id. Throws on a miss so the assertions stay flat. */
function stored(result: { current: Notes }, id: NoteId = NOTE_ID): Note {
  const model = result.current.find(id);
  if (!model) throw new Error(`No note with id ${id}`);
  return model.raw;
}

const ids = (result: { current: Notes }) => result.current.notes.map((note) => note.id);
const activityTypes = (note: Note) => note.activity.map((entry) => entry.type);
/** Matches an activity log holding exactly these entries; the wording is left open. */
const logged = (...types: NoteActivityType[]) => types.map((type) => expect.objectContaining({ type }));

describe("useNotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    // Settings live in a module-level store, so it must be dropped between tests.
    settingsStore.reset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("loading and saving", () => {
    it("loads the stored notes in order, drops deleted ones and saves the cleaned list", async () => {
      const first = makeNote();
      const last = makeNote({ id: OTHER_ID });
      const result = await renderLoaded([first, makeNote({ id: THIRD_ID, state: "deleted" }), last]);

      expect(ids(result)).toEqual([NOTE_ID, OTHER_ID]);
      expect(saveToStorage).toHaveBeenLastCalledWith(STORAGE_KEYS.NOTES, [first, last]);
    });

    it("writes nothing while the stored notes are still loading", async () => {
      // An early save would put the empty initial list over the stored notes.
      (loadFromStorage as jest.Mock).mockImplementation((key: string) =>
        key === STORAGE_KEYS.SETTINGS ? Promise.resolve(defaultSettings) : new Promise(() => {}),
      );
      renderHook(() => useNotes());
      await act(async () => {
        await Promise.resolve();
      });

      expect(saveToStorage).not.toHaveBeenCalled();
    });
  });

  describe("addNote", () => {
    it("puts the new note first, returns its id, logs a created entry and saves", async () => {
      const existing = makeNote();
      const result = await renderLoaded([existing]);
      let id: NoteId | undefined;
      act(() => {
        id = result.current.addNote("Kickoff %Web", "Kickoff", TAGGED);
      });

      const added = { ...taggedNote({ id, createdAt: NOW, updatedAt: NOW }), activity: logged("created") };
      expect(ids(result)).toEqual([id, NOTE_ID]);
      expect(result.current.notes[0].raw).toEqual(added);
      expect(saveToStorage).toHaveBeenLastCalledWith(STORAGE_KEYS.NOTES, [added, existing]);
    });

    it("defaults tags and content when the metadata omits them", async () => {
      const result = await renderLoaded();
      act(() => {
        result.current.addNote("Quick thought", "Quick thought", { ...NO_PEOPLE, projects: [] });
      });

      expect(result.current.notes[0].raw).toMatchObject({ tags: [], content: "" });
    });
  });

  describe("editNote", () => {
    it("applies the new title and metadata and logs each reference added", async () => {
      const other = makeNote({ id: OTHER_ID });
      const result = await renderLoaded([makeNote(), other]);
      act(() => result.current.editNote(NOTE_ID, "Kickoff %Web", "Kickoff", TAGGED));

      const added = ["assigned_added", "mentioned_added", "project_added", "source_added", "tag_added"];
      expect(stored(result)).toEqual({ ...taggedNote({ updatedAt: NOW }), activity: expect.any(Array) });
      expect(activityTypes(stored(result)).sort()).toEqual([...added, "content_changed", "edited"].sort());
      expect(stored(result, OTHER_ID)).toEqual(other);
    });

    it("logs each reference taken away", async () => {
      const result = await renderLoaded([taggedNote()]);
      act(() => result.current.editNote(NOTE_ID, "Kickoff %Web", "Kickoff", { ...PLAIN, content: TAGGED.content }));

      const removed = ["assigned_removed", "mentioned_removed", "project_removed", "source_removed", "tag_removed"];
      expect(stored(result)).toMatchObject({ ...PLAIN, content: TAGGED.content });
      expect(activityTypes(stored(result)).sort()).toEqual(removed);
    });

    it("logs a content_changed entry when content is replaced and when it is cleared", async () => {
      const result = await renderLoaded([makeNote({ content: "<p>Old</p>" })]);
      act(() => result.current.editNote(NOTE_ID, "Weekly sync", "Weekly sync", { ...PLAIN, content: "<p>New</p>" }));
      expect(stored(result)).toMatchObject({ content: "<p>New</p>", activity: logged("content_changed") });

      act(() => result.current.editNote(NOTE_ID, "Weekly sync", "Weekly sync", PLAIN));
      expect(stored(result)).toMatchObject({ content: "", activity: logged("content_changed", "content_changed") });
    });

    it("logs nothing when the title and metadata are unchanged", async () => {
      const result = await renderLoaded([makeNote()]);
      act(() => result.current.editNote(NOTE_ID, "Weekly sync", "Weekly sync", PLAIN));

      expect(stored(result).activity).toEqual([]);
    });

    it.todo("keeps the stored content and tags, and logs nothing for them, when the metadata omits them (U0820)");
  });

  describe("changes to one note", () => {
    // The default keeps the callback at four declared parameters; jest-each would pass a fifth one `done`.
    it.each(CHANGES)("%s, logs it and touches nothing else", async (_name, entry, change, expected, from = {}) => {
      // Both notes hold the same comment and action item ids, so a match on those alone would change both.
      const target = makeNote({ comments: [comment, otherComment], actionItems: [actionItem, otherItem], ...from });
      const other = { ...target, id: OTHER_ID };
      const result = await renderLoaded([target, other]);
      act(() => change(result.current));

      // updatedAt is left open: which of these changes should move it is undecided (U0150).
      const changed = { ...target, updatedAt: expect.any(Number), ...expected, activity: logged(entry) };
      expect(stored(result)).toEqual(changed);
      expect(stored(result, OTHER_ID)).toEqual(other);
    });

    it("ignores an id that matches no note", async () => {
      const note = makeNote({ actionItems: [actionItem] });
      const result = await renderLoaded([note]);
      const createTodo = jest.fn(() => getTodoId("todo-1"));
      act(() => {
        result.current.deleteNote(THIRD_ID);
        result.current.archiveNote(THIRD_ID);
        result.current.duplicateNote(THIRD_ID);
        result.current.convertToTodo(THIRD_ID, createTodo);
        result.current.convertActionItemsToTodos(THIRD_ID, createTodo);
      });

      expect(createTodo).not.toHaveBeenCalled();
      expect(result.current.notes.map((model) => model.raw)).toEqual([note]);
      expect(result.current.undoActions).toEqual([]);
    });

    it.todo("find, convertToTodo and duplicateNote return null for an id that matches no note (U0559)");
    it.todo("deleteNote and convertToTodo see a change made earlier in the same tick (U0697)");
    it.todo("archiveNote, duplicateNote and convertActionItemsToTodos see a same-tick change too (U0820)");
    it.todo("editNoteComment records nothing when the content is unchanged (U0120)");
  });

  describe("undoing a delete or an archive", () => {
    it("queues a delete and removes the note for good once the undo window has passed", async () => {
      const original = makeNote();
      const other = makeNote({ id: OTHER_ID });
      const result = await renderLoaded([original, other]);
      act(() => result.current.deleteNote(NOTE_ID));
      expect(result.current.undoActions).toMatchObject([{ type: "delete", previousState: original }]);

      advance(UNDO_WINDOW_MS - 1);
      expect(ids(result)).toEqual([NOTE_ID, OTHER_ID]);

      advance(1);
      expect(ids(result)).toEqual([OTHER_ID]);
      expect(saveToStorage).toHaveBeenLastCalledWith(STORAGE_KEYS.NOTES, [other]);
      expect(result.current.fadingOutIds.size).toBe(1);

      advance(FADE_OUT_MS);
      expect(result.current.undoActions).toEqual([]);
      expect(result.current.fadingOutIds.size).toBe(0);
    });

    it("removes a deleted note at once when the undo action is dismissed", async () => {
      const result = await renderLoaded([makeNote(), makeNote({ id: OTHER_ID })]);
      act(() => result.current.deleteNote(NOTE_ID));
      act(() => result.current.dismissUndo(result.current.undoActions[0].id));
      expect(ids(result)).toEqual([OTHER_ID]);

      advance(FADE_OUT_MS);
      expect(result.current.undoActions).toEqual([]);
    });

    it("restores a deleted note as active when the delete is undone", async () => {
      const result = await renderLoaded([makeNote()]);
      act(() => result.current.deleteNote(NOTE_ID));
      act(() => result.current.undo(result.current.undoActions[0].id));
      // Past the window, to show the cancelled delete never lands.
      advance(UNDO_WINDOW_MS + FADE_OUT_MS);

      expect(stored(result).state).toBe("active");
      expect(stored(result).deletedAt).toBeUndefined();
      expect(activityTypes(stored(result))).toContain("undeleted");
      expect(result.current.undoActions).toEqual([]);
    });

    it.todo("leaves exactly one record with the note's id after a delete is undone (U0132)");

    it("queues an archive and keeps the note archived once the undo window has passed", async () => {
      const result = await renderLoaded([makeNote()]);
      act(() => result.current.archiveNote(NOTE_ID));
      expect(result.current.undoActions).toMatchObject([{ type: "archive", previousState: makeNote() }]);

      advance(UNDO_WINDOW_MS);
      advance(FADE_OUT_MS);
      expect(stored(result).state).toBe("archived");
      expect(result.current.undoActions).toEqual([]);
    });

    it("returns an archived note to active when the archive is undone", async () => {
      const other = makeNote({ id: OTHER_ID });
      const result = await renderLoaded([makeNote(), other]);
      act(() => result.current.archiveNote(NOTE_ID));
      act(() => result.current.undo(result.current.undoActions[0].id));

      expect(stored(result).state).toBe("active");
      expect(stored(result).archivedAt).toBeUndefined();
      expect(activityTypes(stored(result))).toContain("unarchived");
      expect(stored(result, OTHER_ID)).toEqual(other);
      expect(result.current.undoActions).toEqual([]);
    });

    it.todo("keeps edits made during the undo window when an archive is undone (U0134)");
  });

  describe("reorderNotes", () => {
    it("numbers the listed notes by position and leaves one already in place alone", async () => {
      const inPlace = makeNote({ id: THIRD_ID, sortOrder: 2 });
      const result = await renderLoaded([makeNote(), makeNote({ id: OTHER_ID, sortOrder: 5 }), inPlace]);
      act(() => result.current.reorderNotes([OTHER_ID, NOTE_ID, THIRD_ID]));

      expect(stored(result, OTHER_ID).sortOrder).toBe(0);
      expect(stored(result).sortOrder).toBe(1);
      expect(stored(result, THIRD_ID)).toEqual(inPlace);
    });

    it.todo("leaves updatedAt alone on the notes it renumbers (U0701)");
    it.todo("gives notes missing from the list positions that cannot collide with the listed ones (U0701)");
  });

  describe("convertActionItemsToTodos", () => {
    it("creates a todo for each item with text and records the item as created", async () => {
      const earlier = { id: getActionItemId("action-0"), todoId: "todo-0", createdAt: CREATED, convertedAt: CREATED };
      const note = makeNote({ actionItems: [actionItem, blankItem, otherItem], createdActionItems: [earlier] });
      const other = makeNote({ id: OTHER_ID, actionItems: [actionItem] });
      const result = await renderLoaded([note, other]);
      const createTodo = jest.fn().mockReturnValueOnce(getTodoId("todo-1")).mockReturnValueOnce(getTodoId("todo-2"));
      let created: TodoId[] | undefined;
      act(() => {
        created = result.current.convertActionItemsToTodos(NOTE_ID, createTodo);
      });

      expect(created).toEqual(["todo-1", "todo-2"]);
      expect(createTodo.mock.calls).toEqual([
        [actionItem.text, actionItem.plainText, { sourceNoteId: NOTE_ID, sourceActionItemId: ITEM_ID }],
        [otherItem.text, otherItem.plainText, { sourceNoteId: NOTE_ID, sourceActionItemId: otherItem.id }],
      ]);
      const at = { createdAt: CREATED, convertedAt: NOW };
      const converted = [{ id: ITEM_ID, todoId: "todo-1", ...at }, { id: otherItem.id, todoId: "todo-2", ...at }];
      expect(stored(result)).toMatchObject({ actionItems: [], createdActionItems: [earlier, ...converted] });
      expect(stored(result).activity).toEqual(logged("action_items_converted"));
      expect(stored(result, OTHER_ID)).toEqual(other);
    });

    it("leaves the note as it was when no item has text", async () => {
      const note = makeNote({ actionItems: [blankItem] });
      const result = await renderLoaded([note]);
      const createTodo = jest.fn();
      let created: TodoId[] | undefined;
      act(() => {
        created = result.current.convertActionItemsToTodos(NOTE_ID, createTodo);
      });

      expect(created).toEqual([]);
      expect(createTodo).not.toHaveBeenCalled();
      expect(stored(result)).toEqual(note);
    });
  });

  describe("convertToTodo", () => {
    it("hands the note's title, references and content to createTodo and archives the note", async () => {
      const other = taggedNote({ id: OTHER_ID });
      const result = await renderLoaded([taggedNote(), other]);
      const createTodo = jest.fn(() => getTodoId("todo-9"));
      let todoId: TodoId | undefined;
      act(() => {
        todoId = result.current.convertToTodo(NOTE_ID, createTodo);
      });

      const { content, ...references } = TAGGED;
      expect(todoId).toBe("todo-9");
      expect(createTodo.mock.calls).toEqual([["Kickoff %Web", "Kickoff", { ...references, context: content }]]);
      expect(stored(result)).toMatchObject({ state: "archived", archivedAt: NOW });
      expect(stored(result).activity).toMatchObject([{ type: "converted_to_todo", metadata: { todoId: "todo-9" } }]);
      expect(stored(result, OTHER_ID)).toEqual(other);
    });

    it.todo("queues an undo action for the archive it performs (U0820)");
    it.todo("converts a note stored without its people, project or tag lists (U0063)");
  });

  describe("duplicateNote", () => {
    it("adds an active, unpinned copy first, without the original's comments or action items", async () => {
      const done = { id: otherItem.id, todoId: "todo-1", createdAt: CREATED, convertedAt: CREATED };
      const archived = taggedNote({ state: "archived", archivedAt: CREATED, pinned: true });
      const original = { ...archived, comments: [comment], actionItems: [actionItem], createdActionItems: [done] };
      const result = await renderLoaded([original]);
      let copyId: NoteId | undefined;
      act(() => {
        copyId = result.current.duplicateNote(NOTE_ID);
      });

      expect(ids(result)).toEqual([copyId, NOTE_ID]);
      expect(copyId).not.toBe(NOTE_ID);
      expect(result.current.notes[0].raw).toEqual({
        ...taggedNote({ id: copyId, text: "Kickoff %Web (Copy)", plainText: "Kickoff (Copy)" }),
        createdAt: NOW,
        updatedAt: NOW,
        activity: logged("created"),
      });
      expect(stored(result)).toEqual(original);
    });

    it.todo("gives the copy no manual sort position (U0571)");
  });

  describe("renameEntityReferences", () => {
    it("renames a person or project in a note's fields, its title markers and its action items", async () => {
      const referencing = taggedNote();
      const viaItem = makeNote({ id: OTHER_ID, actionItems: [actionItem] });
      const unrelated = makeNote({ id: THIRD_ID, text: "Chat @Annabel", assignedPeople: [getPersonId("Annabel")] });
      const result = await renderLoaded([referencing, viaItem, unrelated]);
      act(() => {
        result.current.renameEntityReferences("person", "Ann", "Anna");
        result.current.renameEntityReferences("project", "Web", "Website");
      });

      // The whole record, so the rename is shown to leave updatedAt and the activity log alone.
      const renamed = { ...referencing, text: "Kickoff %Website", assignedPeople: ["Anna"], projects: ["Website"] };
      expect(stored(result)).toEqual(renamed);
      expect(stored(result, OTHER_ID).actionItems).toEqual([{ ...actionItem, text: "Send deck @Anna" }]);
      expect(stored(result, THIRD_ID)).toEqual(unrelated);
    });
  });
});
