/**
 * Characterisation tests for ReviewModel. Today's known defects are not asserted:
 * each is an `it.todo` naming the backlog unit that fixes it.
 */

import { ReviewModel, createReviewModels } from "@/models/ReviewModel";
import { SettingsModel, resetSettingsModel_DONOTUSE } from "@/models/SettingsModel";
import { createTestSettings } from "@/__tests__/helpers/fixtures";
import { formatDateWithTime } from "@/utils/formatters";
import { Review, ReviewActivityType, ReviewEntry, ReviewLevel, ReviewState, getReviewId } from "@/types/review";
import { getTag } from "@/types/todo";
import { getProjectId } from "@/types/project";
import { getTimestamp } from "@/types/time";
import { ActivityEntry, Comment, getActivityId, getCommentId } from "@/types/types";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const NOW = new Date(2026, 4, 15, 10, 0, 0);
const ago = (ms: number) => getTimestamp(NOW.getTime() - ms);
// Days apart, so a getter that reads the wrong timestamp shows up.
const DATES = { createdAt: ago(9 * DAY), updatedAt: ago(6 * DAY), completedAt: ago(4 * DAY), archivedAt: ago(2 * DAY) };

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

const rawReview = (overrides: Partial<Review> = {}): Review => ({
  id: getReviewId("review-1"),
  level: "week",
  periodStart: "2026-05-11",
  periodEnd: "2026-05-17",
  periodLabel: "Week 20, 2026",
  state: "pending",
  createdAt: ago(3 * DAY),
  title: "Launch week",
  summary: "",
  entries: [],
  projects: [],
  tags: [],
  comments: [],
  activity: [],
  ...overrides,
});

const makeReview = (overrides: Partial<Review> = {}): ReviewModel => new ReviewModel(rawReview(overrides), settings);

const entry = (type: ReviewEntry["type"], title: string, content = ""): ReviewEntry =>
  type === "task"
    ? { type, todoId: `todo-${title}`, title, completedAt: ago(DAY), content, collapsed: false }
    : { type, reviewId: `review-${title}`, title, level: "day", content, collapsed: false };

const comment = (id: string, ...revisions: string[]): Comment => ({
  commentId: getCommentId(id),
  history: revisions.map((content, index) => ({ timestamp: ago(DAY - index * MINUTE), content })),
});
const activity = (id: string, type: ReviewActivityType): ActivityEntry<ReviewActivityType> => {
  return { id: getActivityId(id), timestamp: ago(DAY), type, description: `Review ${type}` };
};

/** A review with something in every collection. */
const filled = (): Partial<Review> => ({
  entries: [entry("task", "Ship beta"), entry("review", "Monday"), entry("task", "Fix login")],
  projects: [getProjectId("Apollo"), getProjectId("Zeus")],
  tags: [getTag("ops")],
  comments: [comment("c1", "first"), comment("c2", "second", "second, edited")],
  activity: [activity("a1", "created"), activity("a2", "completed")],
});

describe("stored data", () => {
  it("exposes each scalar field as stored", () => {
    const period = { level: "month" as const, periodStart: "2026-04-01", periodEnd: "2026-04-30" };
    const text = { id: getReviewId("review-9"), periodLabel: "April 2026", title: "April", summary: "<p>Shipped</p>" };
    const stored = { ...period, ...text, ...DATES, state: "archived" as const, deletedAt: ago(DAY) };
    expect(makeReview(stored)).toMatchObject(stored);
  });

  it("splits the entries into tasks and child reviews, keeping their order", () => {
    const review = makeReview(filled());
    expect(review.entries).toEqual(filled().entries);
    expect(review.taskEntries).toEqual([entry("task", "Ship beta"), entry("task", "Fix login")]);
    expect(review.childReviewEntries).toEqual([entry("review", "Monday")]);
    expect(review).toMatchObject({ taskCount: 2, childReviewCount: 1, entryCount: 3, hasEntries: true });
  });

  it("returns projects, tags, comments and activity with their counts and the newest of each", () => {
    const review = makeReview(filled());
    expect(review).toMatchObject({ projectIds: ["Apollo", "Zeus"], projects: ["Apollo", "Zeus"] });
    expect(review).toMatchObject({ tagIds: ["ops"], tags: ["ops"] });
    expect(review.comments).toEqual(filled().comments);
    expect(review.activity).toEqual(filled().activity);
    expect(review).toMatchObject({ commentCount: 2, hasComments: true, activityCount: 2, hasActivity: true });
    expect(review.latestComment).toEqual({ commentId: "c2", content: "second, edited", timestamp: ago(DAY - MINUTE) });
    expect(review.latestActivity).toEqual(activity("a2", "completed"));
  });

  it("reports none of them on a bare review", () => {
    const review = makeReview();
    expect(review).toMatchObject({ entries: [], taskEntries: [], childReviewEntries: [], projects: [], tags: [] });
    expect(review).toMatchObject({ taskCount: 0, childReviewCount: 0, entryCount: 0, hasEntries: false });
    expect(review).toMatchObject({ commentCount: 0, hasComments: false, activityCount: 0, hasActivity: false });
    expect(review).toMatchObject({ latestComment: null, latestActivity: null });
  });

  it("hands out copies, raw included, so changing what a getter returned leaves the review alone", () => {
    const review = makeReview(filled());
    review.raw.title = "changed";
    review.raw.entries[0].title = "changed";
    review.entries[0].title = "changed";
    review.taskEntries[0].title = "changed";
    review.childReviewEntries[0].title = "changed";
    review.projectIds.push(getProjectId("changed"));
    review.tagIds.push(getTag("changed"));
    review.comments[0].history[0].content = "changed";
    review.activity[0].description = "changed";
    review.latestActivity!.description = "changed";

    expect(review.raw).toEqual(rawReview(filled()));
  });

  it("reads a legacy review stored without tags as having none", () => {
    expect(makeReview({ tags: undefined })).toMatchObject({ tagIds: [], tags: [] });
  });
});

describe("state and level", () => {
  it.each<[ReviewState, string, string]>([
    ["pending", "Draft", "#f59e0b"],
    ["completed", "Completed", "#10b981"],
    ["archived", "Archived", "#6b7280"],
    ["deleted", "Deleted", "#ef4444"],
  ])("a review stored as %s answers only to that state and is labelled %s", (state, label, statusColor) => {
    const open = { isPending: state === "pending", isCompleted: state === "completed" };
    const closed = { isArchived: state === "archived", isDeleted: state === "deleted" };
    const labels = { stateDisplayLabel: label, statusBadge: label, statusColor };
    expect(makeReview({ state })).toMatchObject({ ...open, ...closed, ...labels, isEditable: state === "pending" });
  });

  it.each<[ReviewLevel, string, string]>([
    ["day", "Daily", "Day"],
    ["week", "Weekly", "Week"],
    ["month", "Monthly", "Month"],
    ["half", "Half-Year", "Half"],
    ["year", "Yearly", "Year"],
  ])("a %s review is labelled %s, or %s for short", (level, levelDisplayLabel, levelShortLabel) => {
    expect(makeReview({ level })).toMatchObject({ levelDisplayLabel, levelShortLabel });
  });
});

describe("date displays", () => {
  // The format follows the machine's locale (U0332), so the expected text comes from the shared formatter.
  it("formats the created, updated, completed and archived timestamps, and has no display for an unset one", () => {
    const review = makeReview(DATES);
    expect(review.createdDateDisplay).toBe(formatDateWithTime(DATES.createdAt));
    expect(review.updatedDateDisplay).toBe(formatDateWithTime(DATES.updatedAt));
    expect(review.completedDateDisplay).toBe(formatDateWithTime(DATES.completedAt));
    expect(review.archivedDateDisplay).toBe(formatDateWithTime(DATES.archivedAt));
    const absent = { updatedDateDisplay: undefined, completedDateDisplay: undefined, archivedDateDisplay: undefined };
    expect(makeReview()).toMatchObject(absent);
  });

  it("ageDisplay counts from creation to now, not from the last update", () => {
    expect(makeReview({ createdAt: ago(3 * DAY), updatedAt: ago(5 * MINUTE) }).ageDisplay).toBe("3 days ago");
    expect(makeReview({ createdAt: ago(5 * MINUTE) }).ageDisplay).toBe("5 minutes ago");
  });
});

describe("summaries", () => {
  const review = () => makeReview({ summary: "  <p>Hello <strong>world</strong></p>\n" });

  it("hasContent is true only when the summary holds more than whitespace", () => {
    expect(makeReview({ summary: "" }).hasContent).toBe(false);
    expect(makeReview({ summary: "  \n " }).hasContent).toBe(false);
    expect(review().hasContent).toBe(true);
  });
  it.todo("hasContent is false for markup with no text, such as <p><br></p> (U0587)");

  it("getSummaryPreview drops markup and outer whitespace, then cuts with an ellipsis, at 150 by default", () => {
    expect(review().getSummaryPreview()).toBe("Hello world");
    expect(review().getSummaryPreview(11)).toBe("Hello world");
    expect(review().getSummaryPreview(5)).toBe("Hello...");
    expect(makeReview({ summary: `<p>${"x".repeat(151)}</p>` }).getSummaryPreview()).toBe(`${"x".repeat(150)}...`);
  });
  it.todo("getSummaryPreview separates blocks and decodes entities: <p>R&amp;D</p><p>plan</p> reads R&D plan (U0584)");

  it("metadataSummary counts tasks, child reviews, projects and tags, pluralising each", () => {
    const entries = [entry("task", "Ship beta"), entry("review", "Monday"), entry("review", "Tuesday")];
    const other = makeReview({ entries, projects: [getProjectId("Apollo")], tags: [getTag("ops"), getTag("urgent")] });
    expect(makeReview(filled()).metadataSummary).toBe("2 tasks, 1 review, 2 projects, 1 tag");
    expect(other.metadataSummary).toBe("1 task, 2 reviews, 1 project, 2 tags");
  });

  it("metadataSummary leaves out what the review does not have, and says so when it has none of them", () => {
    expect(makeReview({ tags: [getTag("ops")] }).metadataSummary).toBe("1 tag");
    expect(makeReview().metadataSummary).toBe("No entries");
  });
});

describe("matchesSearch", () => {
  it("matches every review for an empty query", () => {
    expect(makeReview().matchesSearch("")).toBe(true);
  });

  it.each<[string, Partial<Review>, string]>([
    ["the title", { title: "Retrospective" }, "retro"],
    ["the period label", { periodLabel: "April 2026" }, "april"],
    ["the summary", { summary: "<p>Shipped the <em>beta</em></p>" }, "the beta"],
    ["a tag", { tags: [getTag("Finance")] }, "finan"],
    ["a task entry's title", { entries: [entry("task", "Migrate billing")] }, "billing"],
    ["a child review's title", { entries: [entry("review", "Monday standup")] }, "standup"],
    ["an entry's content", { entries: [entry("task", "Migrate", "<p>Cut over at <b>noon</b></p>")] }, "at noon"],
    ["a project", { projects: [getProjectId("Apollo")] }, "apol"],
  ])("finds text in %s, whatever its case", (_field, overrides, query) => {
    expect(makeReview(overrides).matchesSearch(query)).toBe(true);
    expect(makeReview(overrides).matchesSearch(query.toUpperCase())).toBe(true);
    expect(makeReview().matchesSearch(query)).toBe(false);
  });

  it("searches the text of the summary and of entry content, not their markup", () => {
    const markup = "<p><strong>Budget</strong></p>";
    const review = makeReview({ summary: markup, entries: [entry("task", "Migrate", markup)] });
    expect(review.matchesSearch("budget")).toBe(true);
    expect(review.matchesSearch("strong")).toBe(false);
  });
  it.todo("finds text across blocks and entities: <p>R&amp;D</p><p>plan</p> matches 'R&D plan' (U0584)");
  it.todo("treats a whitespace-only query the way the other models do (U0580)");
});

describe("canComplete, canArchive, canDelete and canUnarchive", () => {
  const notPending = "Review is not in pending state";

  // Each row: the state, then why completing, archiving, deleting and unarchiving is refused. No reason: allowed.
  it.each<[ReviewState, string | undefined, string | undefined, string | undefined, string | undefined]>([
    ["pending", undefined, "Review must be completed before archiving", undefined, "Review is not archived"],
    ["completed", notPending, undefined, undefined, "Review is not archived"],
    ["archived", notPending, "Review is already archived", undefined, undefined],
    ["deleted", notPending, "Review is deleted", "Review is already deleted", "Review is not archived"],
  ])("allows or refuses each, with a reason, for a %s review", (state, complete, archive, remove, unarchive) => {
    const review = makeReview({ state });
    expect(review.canComplete()).toEqual({ canComplete: complete === undefined, reason: complete });
    expect(review.canArchive()).toEqual({ canArchive: archive === undefined, reason: archive });
    expect(review.canDelete()).toEqual({ canDelete: remove === undefined, reason: remove });
    expect(review.canUnarchive()).toEqual({ canUnarchive: unarchive === undefined, reason: unarchive });
  });
});

describe("createReviewModels and createId", () => {
  it("wraps each review in a model, keeping the order and skipping null and undefined entries", () => {
    const stored = [rawReview({ id: getReviewId("a") }), null, undefined, rawReview({ id: getReviewId("b") })];
    const models = createReviewModels(stored as unknown as Review[], settings);
    expect(models.map((model) => model.id)).toEqual(["a", "b"]);
    expect(models.map((model) => model.levelShortLabel)).toEqual(["Week", "Week"]);
  });
  it.todo("soft-deleted reviews stay out of the collections that views count and export (U0604)");

  it("createId returns a review- prefixed UUID that differs on every call", () => {
    const ids = Array.from({ length: 20 }, () => ReviewModel.createId());
    expect(ids[0]).toMatch(/^review-[0-9a-f-]{36}$/);
    expect(new Set(ids).size).toBe(20);
  });
});
