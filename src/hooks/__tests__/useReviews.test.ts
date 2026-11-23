/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useReviews } from "../useReviews";
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
import { getReviewId, Review, ReviewChildEntry, ReviewTaskEntry } from "@/types/review";
import { getProjectId } from "@/types/project";
import { getTimestamp } from "@/types/time";

// Epoch milliseconds throughout, so nothing here depends on the time zone.
const CREATED = Date.UTC(2026, 2, 9, 8, 0, 0);
const NOW = Date.UTC(2026, 2, 10, 12, 0, 0);
const UNDO_WINDOW_MS = 10_000;
const FADE_OUT_MS = 3_000;

const REVIEW_ID = getReviewId("review-1");
const OTHER_ID = getReviewId("review-2");
const MISSING_ID = getReviewId("review-missing");

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: REVIEW_ID,
    level: "week",
    periodStart: "2026-03-02",
    periodEnd: "2026-03-08",
    periodLabel: "Week 10, 2026",
    state: "pending",
    createdAt: getTimestamp(CREATED),
    updatedAt: getTimestamp(CREATED),
    title: "Week 10, 2026",
    summary: "",
    entries: [],
    projects: [],
    tags: [],
    comments: [],
    activity: [],
    ...overrides,
  };
}

const completedReview = (overrides: Partial<Review> = {}): Review =>
  makeReview({ state: "completed", completedAt: getTimestamp(CREATED + 1000), ...overrides });

const taskEntry: ReviewTaskEntry = {
  type: "task",
  todoId: "todo-1",
  title: "Ship the report",
  completedAt: getTimestamp(CREATED),
  content: "",
  collapsed: false,
};

const childEntry: ReviewChildEntry = {
  type: "review",
  reviewId: "review-monday",
  title: "Monday",
  level: "day",
  content: "<p>Quiet day</p>",
  collapsed: true,
};

function storeReviews(reviews: Review[]) {
  (loadFromStorage as jest.Mock).mockImplementation((key: string) =>
    Promise.resolve(key === STORAGE_KEYS.SETTINGS ? defaultSettings : reviews),
  );
}

const flushLoad = () =>
  act(async () => {
    jest.runAllTimers();
    await Promise.resolve();
  });

async function renderLoaded(reviews: Review[] = []) {
  storeReviews(reviews);
  const hook = renderHook(() => useReviews());
  await flushLoad();
  return hook;
}

const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));
const activityTypes = (review: Review) => review.activity.map((entry) => entry.type);

describe("useReviews", () => {
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

  describe("loading", () => {
    it("starts unloaded with nothing saved, then exposes the stored reviews as models", async () => {
      storeReviews([makeReview()]);
      const { result } = renderHook(() => useReviews());

      expect(result.current.isLoaded).toBe(false);
      expect(result.current.rawReviews).toEqual([]);
      expect(saveToStorage).not.toHaveBeenCalled();

      await flushLoad();
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.rawReviews).toEqual([makeReview()]);
      expect(result.current.find(REVIEW_ID)?.isPending).toBe(true);
    });

    it("drops deleted reviews and saves the cleaned list", async () => {
      const kept = makeReview();
      const { result } = await renderLoaded([kept, makeReview({ id: OTHER_ID, state: "deleted" })]);

      expect(result.current.rawReviews).toEqual([kept]);
      expect(saveToStorage).toHaveBeenLastCalledWith(STORAGE_KEYS.REVIEWS, [kept]);
    });

    it.todo("find returns null for an id that matches no review (U0559)");
  });

  describe("addReview", () => {
    it("creates a pending review and returns its id", async () => {
      const { result } = await renderLoaded();
      let id = MISSING_ID;
      act(() => {
        id = result.current.addReview("week", "2026-03-02", "2026-03-08", "Week 10, 2026");
      });

      // makeReview's defaults are what a new review starts with: pending and empty.
      expect(result.current.rawReviews).toEqual([
        makeReview({
          id,
          createdAt: getTimestamp(NOW),
          updatedAt: getTimestamp(NOW),
          activity: [expect.objectContaining({ type: "created", timestamp: NOW })],
        }),
      ]);
    });

    it("titles the review with its period label, keeps the entries it is given and saves", async () => {
      const { result } = await renderLoaded([makeReview()]);
      let id = MISSING_ID;
      act(() => {
        id = result.current.addReview("day", "2026-03-10", "2026-03-10", "10 March 2026", [taskEntry]);
      });

      expect(result.current.rawReviews.map((review) => review.id)).toEqual([id, REVIEW_ID]);
      expect(result.current.rawReviews[0]).toMatchObject({ title: "10 March 2026", entries: [taskEntry] });
      expect(saveToStorage).toHaveBeenLastCalledWith(STORAGE_KEYS.REVIEWS, result.current.rawReviews);
    });
  });

  describe("editReview", () => {
    it("changes the title and summary of a pending review and logs each change", async () => {
      const { result } = await renderLoaded([makeReview()]);
      act(() => result.current.editReview(REVIEW_ID, { title: "A good week", summary: "<p>Shipped</p>" }));

      const edited = result.current.rawReviews[0];
      expect(edited).toMatchObject({ title: "A good week", summary: "<p>Shipped</p>", updatedAt: NOW });
      expect(activityTypes(edited)).toEqual(["title_changed", "summary_changed"]);
    });

    it("logs nothing when the title and summary are the ones it already has", async () => {
      const { result } = await renderLoaded([makeReview({ summary: "<p>Shipped</p>" })]);
      act(() => result.current.editReview(REVIEW_ID, { title: "Week 10, 2026", summary: "<p>Shipped</p>" }));

      expect(result.current.rawReviews[0].activity).toEqual([]);
    });

    it("sets projects and tags without touching the title and summary", async () => {
      const { result } = await renderLoaded([makeReview({ summary: "<p>Shipped</p>" })]);
      act(() => result.current.editReview(REVIEW_ID, { projects: ["Alpha"], tags: ["focus", "q1"] }));

      const edited = result.current.rawReviews[0];
      expect(edited).toMatchObject({ projects: ["Alpha"], tags: ["focus", "q1"] });
      expect(edited).toMatchObject({ title: "Week 10, 2026", summary: "<p>Shipped</p>" });
    });

    it.todo("logs activity when the projects or tags of a review change (U0592)");
  });

  describe("completeReview", () => {
    it("completes a pending review and stamps the completion time", async () => {
      const { result } = await renderLoaded([makeReview()]);
      act(() => result.current.completeReview(REVIEW_ID));

      const completed = result.current.rawReviews[0];
      expect(completed).toMatchObject({ state: "completed", completedAt: NOW, updatedAt: NOW });
      expect(activityTypes(completed)).toEqual(["completed"]);
    });
  });

  describe("deleteReview", () => {
    it("marks the review deleted and offers an undo that holds its previous state", async () => {
      const review = makeReview();
      const { result } = await renderLoaded([review]);
      act(() => result.current.deleteReview(REVIEW_ID));

      const deleted = result.current.rawReviews[0];
      expect(deleted).toMatchObject({ id: REVIEW_ID, state: "deleted", deletedAt: NOW, updatedAt: NOW });
      expect(activityTypes(deleted)).toEqual(["deleted"]);
      const undoAction = expect.objectContaining({ type: "delete", entity: deleted, previousState: review });
      expect(result.current.undoActions).toEqual([undoAction]);
    });

    it("removes the review for good when the undo window closes, then clears the notice", async () => {
      const other = completedReview({ id: OTHER_ID });
      const { result } = await renderLoaded([makeReview(), other]);
      act(() => result.current.deleteReview(REVIEW_ID));
      const actionId = result.current.undoActions[0].id;

      advance(UNDO_WINDOW_MS - 1);
      expect(result.current.rawReviews.map((review) => review.id)).toEqual([REVIEW_ID, OTHER_ID]);

      advance(1);
      expect(result.current.rawReviews).toEqual([other]);
      expect(saveToStorage).toHaveBeenLastCalledWith(STORAGE_KEYS.REVIEWS, [other]);
      expect(result.current.fadingOutIds.has(actionId)).toBe(true);

      advance(FADE_OUT_MS);
      expect(result.current.undoActions).toEqual([]);
    });

    it("removes the review at once when the undo is dismissed", async () => {
      const { result } = await renderLoaded([makeReview()]);
      act(() => result.current.deleteReview(REVIEW_ID));
      act(() => result.current.dismissUndo(result.current.undoActions[0].id));

      expect(result.current.rawReviews).toEqual([]);
      expect(result.current.undoActions).toHaveLength(1);
      advance(FADE_OUT_MS);
      expect(result.current.undoActions).toEqual([]);
    });

    it("brings the review back as it was when the delete is undone", async () => {
      const { result } = await renderLoaded([makeReview({ summary: "<p>Shipped</p>" })]);
      act(() => result.current.deleteReview(REVIEW_ID));
      act(() => result.current.undo(result.current.undoActions[0].id));

      // Looked up by id, not by position: see the todo below.
      const restored = result.current.find(REVIEW_ID);
      expect(restored?.state).toBe("pending");
      expect(restored?.summary).toBe("<p>Shipped</p>");
      expect(restored?.deletedAt).toBeUndefined();
      expect(restored?.activity.map((entry) => entry.type).pop()).toBe("undeleted");
      expect(result.current.undoActions).toEqual([]);

      // The undo cancelled the pending removal.
      advance(UNDO_WINDOW_MS);
      expect(result.current.find(REVIEW_ID)?.state).toBe("pending");
    });

    it.todo("undoing a delete leaves exactly one record with that id (U0132)");
  });

  describe("archiveReview", () => {
    it("archives a completed review, offers an undo and stays archived once the window closes", async () => {
      const review = completedReview();
      const { result } = await renderLoaded([review]);
      act(() => result.current.archiveReview(REVIEW_ID));

      const archived = result.current.rawReviews[0];
      expect(archived).toMatchObject({ state: "archived", archivedAt: NOW, updatedAt: NOW });
      expect(archived.completedAt).toBe(review.completedAt);
      expect(activityTypes(archived)).toEqual(["archived"]);
      expect(result.current.undoActions).toHaveLength(1);
      expect(result.current.undoActions[0]).toMatchObject({ type: "archive", previousState: review });

      // Two steps: the fade-out timer only starts once the window has closed.
      advance(UNDO_WINDOW_MS);
      advance(FADE_OUT_MS);
      expect(result.current.rawReviews).toEqual([archived]);
      expect(result.current.undoActions).toEqual([]);
    });

    it("returns the review to completed when the archive is undone", async () => {
      const review = completedReview();
      const other = makeReview({ id: OTHER_ID });
      const { result } = await renderLoaded([review, other]);
      act(() => result.current.archiveReview(REVIEW_ID));
      act(() => result.current.undo(result.current.undoActions[0].id));

      const [restored, ...rest] = result.current.rawReviews;
      expect(rest).toEqual([other]);
      expect(restored).toMatchObject({ state: "completed", completedAt: review.completedAt });
      expect(restored.archivedAt).toBeUndefined();
      expect(activityTypes(restored).pop()).toBe("unarchived");
      expect(result.current.undoActions).toEqual([]);
    });

    it.todo("archives only completed reviews, as ReviewModel.canArchive requires (U0821)");
  });

  describe("unarchiveReview", () => {
    it("returns an archived review to completed and keeps its completion time", async () => {
      const review = completedReview({ state: "archived", archivedAt: getTimestamp(CREATED + 2000) });
      const { result } = await renderLoaded([review]);
      act(() => result.current.unarchiveReview(REVIEW_ID));

      const restored = result.current.rawReviews[0];
      expect(restored).toMatchObject({ state: "completed", completedAt: review.completedAt, updatedAt: NOW });
      expect(restored.archivedAt).toBeUndefined();
      expect(activityTypes(restored)).toEqual(["unarchived"]);
    });

    it.todo("ignores a review that is not archived, as ReviewModel.canUnarchive requires (U0821)");
    it.todo("never leaves a review completed without a completedAt (U0821)");
  });

  describe("entries", () => {
    it("addEntry appends to a pending review and logs each addition", async () => {
      const { result } = await renderLoaded([makeReview()]);
      act(() => {
        result.current.addEntry(REVIEW_ID, taskEntry);
        result.current.addEntry(REVIEW_ID, childEntry);
      });

      const review = result.current.rawReviews[0];
      expect(review).toMatchObject({ entries: [taskEntry, childEntry], updatedAt: NOW });
      expect(activityTypes(review)).toEqual(["entry_added", "entry_added"]);
    });

    it("updateEntry merges the changes into the entry at that index only", async () => {
      const { result } = await renderLoaded([makeReview({ entries: [taskEntry, childEntry] })]);
      act(() => result.current.updateEntry(REVIEW_ID, 1, { content: "Busy" }));

      const review = result.current.rawReviews[0];
      expect(review.entries).toEqual([taskEntry, { ...childEntry, content: "Busy" }]);
      expect(review.updatedAt).toBe(NOW);
      expect(activityTypes(review)).toEqual(["entry_edited"]);
    });

    it("removeEntry drops the entry at that index only", async () => {
      const { result } = await renderLoaded([makeReview({ entries: [taskEntry, childEntry] })]);
      act(() => result.current.removeEntry(REVIEW_ID, 0));

      const review = result.current.rawReviews[0];
      expect(review).toMatchObject({ entries: [childEntry], updatedAt: NOW });
      expect(activityTypes(review)).toEqual(["entry_removed"]);
    });

    it("updateEntry and removeEntry change no entry when the index is out of range", async () => {
      const { result } = await renderLoaded([makeReview({ entries: [taskEntry, childEntry] })]);
      act(() => {
        result.current.updateEntry(REVIEW_ID, 2, { content: "Nowhere to go" });
        result.current.updateEntry(REVIEW_ID, -1, { content: "Nowhere to go" });
        result.current.removeEntry(REVIEW_ID, 2);
      });

      expect(result.current.rawReviews[0].entries).toEqual([taskEntry, childEntry]);
    });

    // Only the flag is pinned: whether a toggle should log activity or bump
    // updatedAt at all is an open decision (U0573).
    it("toggleEntryCollapsed flips the flag of the entry at that index and back again", async () => {
      const { result } = await renderLoaded([makeReview({ entries: [taskEntry, childEntry] })]);
      const collapsed = () => result.current.rawReviews[0].entries.map((entry) => entry.collapsed);
      act(() => result.current.toggleEntryCollapsed(REVIEW_ID, 0));
      expect(collapsed()).toEqual([true, true]);

      act(() => result.current.toggleEntryCollapsed(REVIEW_ID, 0));
      act(() => result.current.toggleEntryCollapsed(REVIEW_ID, 1));
      expect(collapsed()).toEqual([false, false]);
    });

    it.each([2, -1])("toggleEntryCollapsed leaves the review as it was for index %i", async (index) => {
      const review = makeReview({ entries: [taskEntry, childEntry] });
      const { result } = await renderLoaded([review]);
      act(() => result.current.toggleEntryCollapsed(REVIEW_ID, index));

      expect(result.current.rawReviews).toEqual([review]);
    });

    it.todo("updateEntry logs nothing when the index is out of range (U0591)");
    it.todo("removeEntry logs nothing when the index is out of range (U0821)");
    it.todo("toggleEntryCollapsed leaves the updatedAt and activity of a completed review unchanged (U0573)");
  });

  describe("renameEntityReferences", () => {
    it("renames a project on every review that references it, completed ones included", async () => {
      const unrelated = makeReview({ id: getReviewId("review-3"), projects: [getProjectId("Gamma")] });
      const { result } = await renderLoaded([
        makeReview({ projects: [getProjectId("Alpha"), getProjectId("Other")] }),
        completedReview({ id: OTHER_ID, projects: [getProjectId("alpha"), getProjectId("Beta")] }),
        unrelated,
      ]);
      act(() => result.current.renameEntityReferences("project", "Alpha", "Beta"));

      // The completed review already referenced "Beta", so the two collapse into one.
      expect(result.current.rawReviews).toEqual([
        makeReview({ projects: [getProjectId("Beta"), getProjectId("Other")] }),
        completedReview({ id: OTHER_ID, projects: [getProjectId("Beta")] }),
        unrelated,
      ]);
    });
  });

  it.each(["completed", "archived"] as const)(
    "accepts no edit, completion or entry change on a review that is %s",
    async (state) => {
      const review = completedReview({ state, entries: [taskEntry, childEntry] });
      const { result } = await renderLoaded([review]);
      act(() => {
        result.current.editReview(REVIEW_ID, { title: "Too late", projects: ["Alpha"] });
        result.current.completeReview(REVIEW_ID);
        result.current.addEntry(REVIEW_ID, taskEntry);
        result.current.updateEntry(REVIEW_ID, 0, { content: "Too late" });
        result.current.removeEntry(REVIEW_ID, 1);
      });

      expect(result.current.rawReviews).toEqual([review]);
    },
  );

  it("leaves every review alone when the id matches none of them", async () => {
    const review = makeReview({ entries: [taskEntry] });
    const { result } = await renderLoaded([review]);
    act(() => {
      result.current.editReview(MISSING_ID, { title: "Renamed" });
      result.current.completeReview(MISSING_ID);
      result.current.deleteReview(MISSING_ID);
      result.current.archiveReview(MISSING_ID);
      result.current.unarchiveReview(MISSING_ID);
      result.current.addEntry(MISSING_ID, childEntry);
      result.current.updateEntry(MISSING_ID, 0, { content: "Notes" });
      result.current.removeEntry(MISSING_ID, 0);
      result.current.toggleEntryCollapsed(MISSING_ID, 0);
    });

    expect(result.current.rawReviews).toEqual([review]);
    expect(result.current.undoActions).toEqual([]);
  });
});
