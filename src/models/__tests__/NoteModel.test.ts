/**
 * Characterisation tests for NoteModel. Today's known defects are not asserted:
 * each is an `it.todo` naming the backlog unit that fixes it.
 */

import { NoteModel, createNoteModels } from "@/models/NoteModel";
import { SettingsModel, resetSettingsModel_DONOTUSE } from "@/models/SettingsModel";
import { createTestSettings } from "@/__tests__/helpers/fixtures";
import { formatDateWithTime } from "@/utils/formatters";
import { Note, NoteActivityType, NoteState, getActionItemId, getNoteId } from "@/types/note";
import { getTag } from "@/types/todo";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import { getTimestamp } from "@/types/time";
import { ActivityEntry, Comment, getActivityId, getCommentId } from "@/types/types";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const NOW = new Date(2026, 4, 15, 10, 0, 0);
const ago = (ms: number) => getTimestamp(NOW.getTime() - ms);
// Days apart, so a getter that reads the wrong timestamp shows up.
const DATES = { createdAt: ago(9 * DAY), updatedAt: ago(4 * DAY), archivedAt: ago(2 * DAY), deletedAt: ago(DAY) };

let settings: SettingsModel;
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  resetSettingsModel_DONOTUSE();
  settings = createTestSettings();
});
afterEach(() => {
  jest.useRealTimers();
});

const rawNote = (overrides: Partial<Note> = {}): Note => ({
  id: getNoteId("note-1"),
  text: "Weekly sync",
  plainText: "Weekly sync",
  state: "active",
  content: "",
  createdAt: ago(3 * DAY),
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
});

const makeNote = (overrides: Partial<Note> = {}): NoteModel => new NoteModel(rawNote(overrides), settings);

const comment = (id: string, ...revisions: string[]): Comment => ({
  commentId: getCommentId(id),
  history: revisions.map((content, index) => ({ timestamp: ago(DAY - index * MINUTE), content })),
});
const activity = (id: string, type: NoteActivityType): ActivityEntry<NoteActivityType> => {
  return { id: getActivityId(id), timestamp: ago(DAY), type, description: `Note ${type}` };
};
const pending = (id: string, text: string) => ({ id: getActionItemId(id), text, plainText: text, createdAt: ago(DAY) });

/** A note with something in every collection. */
const filled = (): Partial<Note> => ({
  assignedPeople: [getPersonId("Ada"), getPersonId("Grace")],
  sourcePeople: [getPersonId("Alan")],
  mentionedPeople: [getPersonId("Edsger")],
  projects: [getProjectId("Apollo")],
  tags: [getTag("ops"), getTag("urgent")],
  actionItems: [pending("ai-1", "Send notes"), pending("ai-2", "Book room")],
  createdActionItems: [{ id: getActionItemId("ai-3"), todoId: "todo-9", createdAt: ago(DAY), convertedAt: ago(0) }],
  comments: [comment("c1", "first"), comment("c2", "second", "second, edited")],
  activity: [activity("a1", "created"), activity("a2", "pinned")],
});

describe("stored data", () => {
  it("exposes each scalar field as stored", () => {
    const title = { id: getNoteId("note-42"), text: "@Ada Roadmap", plainText: "Roadmap", content: "<p>Q3 goals</p>" };
    const stored = { ...title, ...DATES, state: "archived" as const, pinned: true, sortOrder: 7 };
    expect(makeNote(stored)).toMatchObject(stored);
  });

  it("returns people, projects and tags as ids and as display names", () => {
    const note = makeNote(filled());
    expect(note).toMatchObject({ assignedPeopleIds: ["Ada", "Grace"], assignedPeople: ["Ada", "Grace"] });
    expect(note).toMatchObject({ sourcePeopleIds: ["Alan"], sourcePeople: ["Alan"] });
    expect(note).toMatchObject({ mentionedPeopleIds: ["Edsger"], mentionedPeople: ["Edsger"] });
    expect(note).toMatchObject({ projectIds: ["Apollo"], projects: ["Apollo"] });
    expect(note).toMatchObject({ tagIds: ["ops", "urgent"], tags: ["ops", "urgent"] });
  });

  it("returns action items, comments and activity with their counts and the newest of each", () => {
    const note = makeNote(filled());
    expect(note.actionItems).toEqual(filled().actionItems);
    expect(note.createdActionItems).toEqual(filled().createdActionItems);
    expect(note.comments).toEqual(filled().comments);
    expect(note.activity).toEqual(filled().activity);
    const counts = { pendingActionItemCount: 2, createdActionItemCount: 1, commentCount: 2, activityCount: 2 };
    const has = { hasPendingActionItems: true, hasCreatedActionItems: true, hasComments: true, hasActivity: true };
    expect(note).toMatchObject({ ...counts, ...has });
    const pendingOnly = makeNote({ actionItems: [pending("ai-1", "Send notes")] });
    expect(pendingOnly).toMatchObject({ hasPendingActionItems: true, hasCreatedActionItems: false });
    expect(note.latestComment).toEqual({ commentId: "c2", content: "second, edited", timestamp: ago(DAY - MINUTE) });
    expect(note.latestActivity).toEqual(activity("a2", "pinned"));
  });

  it("reports none of them on a bare note", () => {
    const counts = { pendingActionItemCount: 0, createdActionItemCount: 0, commentCount: 0, activityCount: 0 };
    const has = { hasPendingActionItems: false, hasCreatedActionItems: false, hasComments: false, hasActivity: false };
    expect(makeNote()).toMatchObject({ ...counts, ...has, latestComment: null, latestActivity: null });
  });

  it("hands out copies, raw included, so changing what a getter returned leaves the note alone", () => {
    const note = makeNote(filled());
    note.raw.plainText = "changed";
    note.raw.tags.push(getTag("changed"));
    note.assignedPeopleIds.push(getPersonId("changed"));
    note.sourcePeopleIds.push(getPersonId("changed"));
    note.mentionedPeopleIds.push(getPersonId("changed"));
    note.projectIds.push(getProjectId("changed"));
    note.tagIds.push(getTag("changed"));
    note.actionItems[0].text = "changed";
    note.createdActionItems[0].todoId = "changed";
    note.comments[0].history[0].content = "changed";
    note.activity[0].description = "changed";
    note.latestActivity!.description = "changed";

    expect(note.raw).toEqual(rawNote(filled()));
  });

  it("reads a legacy note stored without tags or action items as having none", () => {
    const note = makeNote({ tags: undefined, actionItems: undefined, createdActionItems: undefined });
    expect(note).toMatchObject({ tagIds: [], tags: [], actionItems: [], createdActionItems: [] });
    expect(note).toMatchObject({ pendingActionItemCount: 0, createdActionItemCount: 0 });
  });
  it.todo("hasFields reads a note stored without a tags array as having no tags, as tagIds does (U0588)");
});

describe("state and status", () => {
  // The state outranks the pin: only an active note is badged as pinned.
  it.each<[NoteState, boolean, string, string]>([
    ["active", false, "Active", "#3b82f6"],
    ["active", true, "Pinned", "#f59e0b"],
    ["archived", true, "Archived", "#6b7280"],
    ["deleted", true, "Deleted", "#ef4444"],
  ])("a note stored as %s with pinned %s is badged %s", (state, pinned, statusBadge, statusColor) => {
    const flags = { isActive: state === "active", isArchived: state === "archived", isDeleted: state === "deleted" };
    expect(makeNote({ state, pinned })).toMatchObject({ ...flags, isPinned: pinned, statusBadge, statusColor });
  });

  it("hasFields is true with any one person, project or tag, and false with none", () => {
    expect(makeNote({ assignedPeople: [getPersonId("Ada")] }).hasFields).toBe(true);
    expect(makeNote({ sourcePeople: [getPersonId("Ada")] }).hasFields).toBe(true);
    expect(makeNote({ mentionedPeople: [getPersonId("Ada")] }).hasFields).toBe(true);
    expect(makeNote({ projects: [getProjectId("Apollo")] }).hasFields).toBe(true);
    expect(makeNote({ tags: [getTag("ops")] }).hasFields).toBe(true);
    expect(makeNote({ content: "<p>Agenda</p>" }).hasFields).toBe(false);
  });

  it("hasContent is true only when the content holds more than whitespace", () => {
    expect(makeNote({ content: "" }).hasContent).toBe(false);
    expect(makeNote({ content: "  \n " }).hasContent).toBe(false);
    expect(makeNote({ content: "<p>Agenda</p>" }).hasContent).toBe(true);
  });
  it.todo("hasContent is false for markup with no text, such as <p><br></p> (new finding)");
});

describe("date displays", () => {
  // The format follows the machine's locale (U0332), so the expected text comes from the shared formatter.
  it("formats the created, updated and archived timestamps, and has no display for one that is not set", () => {
    const note = makeNote(DATES);
    expect(note.createdDateDisplay).toBe(formatDateWithTime(DATES.createdAt));
    expect(note.updatedDateDisplay).toBe(formatDateWithTime(DATES.updatedAt));
    expect(note.archivedDateDisplay).toBe(formatDateWithTime(DATES.archivedAt));
    expect(makeNote()).toMatchObject({ updatedDateDisplay: undefined, archivedDateDisplay: undefined });
  });

  it("ageDisplay counts from creation to now, not from the last update", () => {
    expect(makeNote({ createdAt: ago(3 * DAY), updatedAt: ago(5 * MINUTE) }).ageDisplay).toBe("3 days ago");
    expect(makeNote({ createdAt: ago(5 * MINUTE) }).ageDisplay).toBe("5 minutes ago");
  });
});

describe("summaries", () => {
  const note = () => makeNote({ plainText: "abcdefghij", content: "  <p>Hello <strong>world</strong></p>\n" });

  it("getSummary keeps a title that fits the limit and cuts a longer one with an ellipsis, at 100 by default", () => {
    expect(note().getSummary(10)).toBe("abcdefghij");
    expect(note().getSummary(4)).toBe("abcd...");
    expect(makeNote({ plainText: "x".repeat(101) }).getSummary()).toBe(`${"x".repeat(100)}...`);
  });

  it("getContentPreview drops markup and outer whitespace, then cuts the same way, at 150 by default", () => {
    expect(note().getContentPreview()).toBe("Hello world");
    expect(note().getContentPreview(11)).toBe("Hello world");
    expect(note().getContentPreview(5)).toBe("Hello...");
    expect(makeNote({ content: `<p>${"x".repeat(151)}</p>` }).getContentPreview()).toBe(`${"x".repeat(150)}...`);
  });
  it.todo("getContentPreview separates blocks and decodes entities: <p>R&amp;D</p><p>plan</p> reads R&D plan (U0584)");

  it("metadataSummary counts people, projects, tags and action items, pluralising each", () => {
    const one = { assignedPeople: [getPersonId("Ada")], tags: [getTag("ops")], actionItems: [pending("ai-1", "Send")] };
    const other = makeNote({ ...one, projects: [getProjectId("Apollo"), getProjectId("Zeus")] });
    // Assigned people only: whether source and mentioned people should count is left open here.
    const assignedOnly = makeNote({ ...filled(), sourcePeople: [], mentionedPeople: [] });
    expect(assignedOnly.metadataSummary).toBe("2 people, 1 project, 2 tags, 2 action items");
    expect(other.metadataSummary).toBe("1 person, 2 projects, 1 tag, 1 action item");
  });

  it("metadataSummary leaves out what the note does not have, and says so when it has none of them", () => {
    expect(makeNote({ tags: [getTag("ops"), getTag("urgent")] }).metadataSummary).toBe("2 tags");
    expect(makeNote().metadataSummary).toBe("No metadata");
  });
});

describe("matchesSearch", () => {
  it("matches every note for an empty query", () => {
    expect(makeNote().matchesSearch("")).toBe(true);
  });

  it.each<[string, Partial<Note>, string]>([
    ["the title", { plainText: "Quarterly Planning" }, "planning"],
    ["the content", { content: "<p>Budget <em>forecast</em></p>" }, "budget forecast"],
    ["a tag", { tags: [getTag("Finance")] }, "finan"],
    ["an assigned person", { assignedPeople: [getPersonId("Ada Lovelace")] }, "lovelace"],
    ["a source person", { sourcePeople: [getPersonId("Grace Hopper")] }, "hopper"],
    ["a mentioned person", { mentionedPeople: [getPersonId("Alan Turing")] }, "turing"],
    ["a project", { projects: [getProjectId("Apollo")] }, "apol"],
  ])("finds text in %s, whatever its case", (_field, overrides, query) => {
    expect(makeNote(overrides).matchesSearch(query)).toBe(true);
    expect(makeNote(overrides).matchesSearch(query.toUpperCase())).toBe(true);
    expect(makeNote().matchesSearch(query)).toBe(false);
  });

  it("searches the text of the content, not its markup", () => {
    const note = makeNote({ content: "<p><strong>Budget</strong></p>" });
    expect(note.matchesSearch("budget")).toBe(true);
    expect(note.matchesSearch("strong")).toBe(false);
  });
  it.todo("finds text across blocks and entities: <p>R&amp;D</p><p>plan</p> matches 'R&D plan' (U0584)");
  it.todo("treats a whitespace-only query the way the other models do (U0580)");
});

describe("canArchive, canDelete and canUnarchive", () => {
  // Each row: the state, then why archiving, deleting and unarchiving is refused. No reason means it is allowed.
  it.each<[NoteState, string | undefined, string | undefined, string | undefined]>([
    ["active", undefined, undefined, "Note is not archived"],
    ["archived", "Note is already archived", undefined, undefined],
    ["deleted", "Note is deleted", "Note is already deleted", "Note is not archived"],
  ])("allows or refuses each, with a reason, for a note stored as %s", (state, archive, remove, unarchive) => {
    const note = makeNote({ state });
    expect(note.canArchive()).toEqual({ canArchive: archive === undefined, reason: archive });
    expect(note.canDelete()).toEqual({ canDelete: remove === undefined, reason: remove });
    expect(note.canUnarchive()).toEqual({ canUnarchive: unarchive === undefined, reason: unarchive });
  });
});

describe("createNoteModels and createId", () => {
  it("wraps each note in a model, keeping the order and skipping null and undefined entries", () => {
    const stored = [rawNote({ id: getNoteId("a") }), null, undefined, rawNote({ id: getNoteId("b"), pinned: true })];
    const models = createNoteModels(stored as unknown as Note[], settings);
    expect(models.map((model) => model.id)).toEqual(["a", "b"]);
    expect(models.map((model) => model.statusBadge)).toEqual(["Active", "Pinned"]);
  });
  it.todo("soft-deleted notes stay out of the collections that views count and export (U0604)");

  it("createId returns a note- prefixed UUID that differs on every call", () => {
    const ids = Array.from({ length: 20 }, () => NoteModel.createId());
    expect(ids[0]).toMatch(/^note-[0-9a-f-]{36}$/);
    expect(new Set(ids).size).toBe(20);
  });
});
