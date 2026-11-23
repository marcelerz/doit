/**
 * @jest-environment jsdom
 */

/**
 * The timeline behind every entity's Activity panel. The hooks decide what is
 * logged and how it is worded, and that wording is due to change, so nothing
 * here depends on it. What is pinned is what the component does with what it
 * is handed: order, day grouping, links out of an entry, comment editing.
 */

import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { Activity } from "../Activity";
import { Comment, getColor, getCommentId } from "@/types/types";
import { getLinkPatternId } from "@/types/linkPattern";
import { getTimestamp } from "@/types/time";

type Entry = Parameters<typeof Activity>[0]["activities"][number];

// Local-time constructors throughout, so "Today" and the day groups come out
// the same in every time zone.
const NOW = new Date(2026, 4, 15, 10, 0, 0);
const at = (day: number, hour: number, minute = 0) => new Date(2026, 4, day, hour, minute).getTime();

const entry = (description: string, timestamp: number, over: Partial<Entry> = {}): Entry => ({
  id: `activity-${description}`,
  timestamp,
  type: "edited",
  description,
  ...over,
});

const comment = (id: string, ...revisions: Array<[content: string, timestamp: number]>): Comment => ({
  commentId: getCommentId(id),
  history: revisions.map(([content, timestamp]) => ({ content, timestamp: getTimestamp(timestamp) })),
});

/** Which of `texts` are rendered under `root`, in document order. */
const shown = (texts: string[], root: HTMLElement = document.body) =>
  within(root)
    .queryAllByText((content) => texts.includes(content))
    .map((element) => element.textContent);

/** The day groups in document order: each heading with the `texts` listed under it. */
const groups = (container: HTMLElement, texts: string[]) =>
  Array.from(container.querySelectorAll("h5")).map((heading) => ({
    label: heading.textContent,
    items: shown(texts, heading.parentElement!),
  }));

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("the timeline", () => {
  it("says so when there is nothing to show, and stops saying so once there is", () => {
    const { container, rerender } = render(<Activity activities={[]} comments={[]} />);
    expect(container.textContent).toBe("No activity yet");

    rerender(<Activity activities={[entry("first entry", at(15, 9))]} comments={[]} />);
    expect(container.textContent).not.toContain("No activity yet");
    expect(shown(["first entry"])).toEqual(["first entry"]);
  });

  it("lists entries newest first, whatever order they arrive in", () => {
    const activities = [entry("middle", at(15, 8)), entry("newest", at(15, 9)), entry("oldest", at(15, 7))];
    render(<Activity activities={activities} comments={[]} />);

    expect(shown(["oldest", "middle", "newest"])).toEqual(["newest", "middle", "oldest"]);
  });

  it("places comments among the entries by time", () => {
    render(
      <Activity
        activities={[entry("earlier entry", at(15, 8)), entry("later entry", at(15, 9))]}
        comments={[comment("c1", ["the comment", at(15, 8, 30)])]}
      />,
    );

    expect(shown(["earlier entry", "the comment", "later entry"])).toEqual(["later entry", "the comment", "earlier entry"]);
  });

  it("groups by local day, newest day first, and calls the current day Today", () => {
    const { container } = render(
      <Activity
        activities={[
          entry("a week ago", at(8, 12)),
          entry("just after midnight", at(15, 0, 1)),
          entry("just before midnight", at(14, 23, 59)),
          entry("yesterday noon", at(14, 12)),
        ]}
        comments={[comment("c1", ["yesterday evening", at(14, 18)])]}
      />,
    );

    const texts = ["a week ago", "just after midnight", "just before midnight", "yesterday noon", "yesterday evening"];
    expect(groups(container, texts)).toEqual([
      { label: "Today", items: ["just after midnight"] },
      {
        label: new Date(2026, 4, 14).toLocaleDateString(),
        items: ["just before midnight", "yesterday evening", "yesterday noon"],
      },
      { label: new Date(2026, 4, 8).toLocaleDateString(), items: ["a week ago"] },
    ]);
  });
});

describe("entry icons", () => {
  // Everything the todo, note, person and project type unions declare, plus the
  // sprint lifecycle types.
  const TYPES_WITH_AN_ICON = [
    "created", "completed", "uncompleted", "archived", "unarchived", "deleted", "undeleted", "edited",
    "comment_added", "comment_edited", "comment_deleted", "assigned_added", "assigned_removed",
    "source_added", "source_removed", "mentioned_added", "mentioned_removed", "project_added", "project_removed",
    "priority_changed", "priority_removed", "duedate_changed", "duedate_removed", "duration_changed",
    "duration_removed", "recurring_changed", "recurring_removed", "dependency_added", "dependency_removed",
    "tag_added", "tag_removed", "context_changed", "workflow_state_changed", "started", "cancelled",
    "pinned", "unpinned", "converted_to_todo", "action_item_added", "action_item_edited", "action_item_deleted",
    "action_items_converted", "content_changed",
  ];

  /** The icon shown for an entry of `type`: what sits in front of its text. */
  const iconFor = (type: string) => {
    const { unmount } = render(<Activity activities={[entry("probe", at(15, 9), { type })]} comments={[]} />);
    const icon = screen.getByText("probe").parentElement!.previousElementSibling!.textContent;
    unmount();
    return icon;
  };

  it("gives every known entry type an icon rather than the placeholder for unknown ones", () => {
    const placeholder = iconFor("not-a-real-type");

    expect(TYPES_WITH_AN_ICON.filter((type) => iconFor(type) === placeholder)).toEqual([]);
  });

  it.todo("gives review entry types such as entry_added and summary_changed an icon of their own (U0708)");
  it.todo("gives a sprint's updated entries an icon of their own (U0179)");
});

describe("links out of an entry", () => {
  const spawned = (recurringOriginId: string, recurringPreviousId: string) =>
    entry("next occurrence", at(15, 9), { type: "created", metadata: { recurringOriginId, recurringPreviousId } });
  const fromNote = entry("made from a note", at(15, 8), {
    type: "created",
    metadata: { sourceNoteId: "note-7", sourceActionItemId: "item-3" },
  });

  it("opens the previous and the first task of a recurring chain", () => {
    const onNavigateToTask = jest.fn();
    const activities = [spawned("todo-first", "todo-previous")];
    render(<Activity activities={activities} comments={[]} onNavigateToTask={onNavigateToTask} />);

    fireEvent.click(screen.getByRole("button", { name: "View previous task" }));
    expect(onNavigateToTask.mock.calls).toEqual([["todo-previous"]]);

    fireEvent.click(screen.getByRole("button", { name: "View first task" }));
    expect(onNavigateToTask.mock.calls).toEqual([["todo-previous"], ["todo-first"]]);
  });

  it("offers a single task link when the previous task is also the first", () => {
    const onNavigateToTask = jest.fn();
    const activities = [spawned("todo-first", "todo-first")];
    render(<Activity activities={activities} comments={[]} onNavigateToTask={onNavigateToTask} />);

    const links = screen.getAllByRole("button");
    expect(links).toHaveLength(1);
    fireEvent.click(links[0]);
    expect(onNavigateToTask.mock.calls).toEqual([["todo-first"]]);
  });

  it("opens the note a task was created from", () => {
    const onNavigateToNote = jest.fn();
    render(<Activity activities={[fromNote]} comments={[]} onNavigateToNote={onNavigateToNote} />);

    const links = screen.getAllByRole("button");
    expect(links).toHaveLength(1);
    fireEvent.click(links[0]);
    expect(onNavigateToNote.mock.calls).toEqual([["note-7"]]);
  });

  it("offers no link without a handler to follow it", () => {
    render(<Activity activities={[spawned("todo-first", "todo-previous"), fromNote]} comments={[]} />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("offers no link on an entry with nothing to link to", () => {
    const handlers = { onNavigateToTask: jest.fn(), onNavigateToNote: jest.fn() };
    render(<Activity activities={[entry("plain edit", at(15, 9))]} comments={[]} {...handlers} />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it.todo("never prints an entry's metadata as raw JSON, whether or not a link can be shown (U0117)");
});

describe("comments", () => {
  it("renders a comment's HTML with anything unsafe stripped", () => {
    const unsafe = '<b>kept</b> text<script>window.pwned = true</script><img src="x" onerror="window.pwned = true">';
    const { container } = render(<Activity activities={[]} comments={[comment("c1", [unsafe, at(15, 9)])]} />);

    expect(screen.getByText("kept").parentElement!.innerHTML).toBe("<b>kept</b> text");
    expect(container.querySelector("script, img")).toBeNull();
  });

  it("turns link-pattern ids in a comment into links, given the patterns", () => {
    const comments = [comment("c1", ["see T12345", at(15, 9)])];
    const pattern = {
      id: getLinkPatternId("tickets"),
      prefix: "T",
      urlTemplate: "https://tracker.example/{id}",
      description: "Tickets",
      color: getColor("#ff0000"),
    };
    const { container, rerender } = render(<Activity activities={[]} comments={comments} />);
    expect(container.querySelector("a")).toBeNull();

    rerender(<Activity activities={[]} comments={comments} linkPatterns={[pattern]} />);
    const link = screen.getByText("T12345");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("https://tracker.example/12345");
  });

  it("shows every revision as its own row, and marks an edit differently from the original", () => {
    const comments = [
      comment("c1", ["first wording", at(15, 7)], ["second wording", at(15, 9)]),
      comment("c2", ["another comment", at(15, 8)]),
    ];
    render(<Activity activities={[]} comments={comments} />);
    const labelOf = (content: string) => screen.getByText(content).previousElementSibling!.textContent;

    const newestFirst = ["second wording", "another comment", "first wording"];
    expect(shown(["first wording", "second wording", "another comment"])).toEqual(newestFirst);
    expect(labelOf("another comment")).toBe(labelOf("first wording"));
    expect(labelOf("second wording")).not.toBe(labelOf("first wording"));
  });
});

describe("editing and deleting a comment", () => {
  const editor = () => screen.getByTestId("rich-text-editor");
  const saveButton = () => screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;

  /** Two single-revision comments; "original" is the newer, so its controls come first. */
  const setup = () => {
    const onEditComment = jest.fn();
    const onDeleteComment = jest.fn();
    render(
      <Activity
        activities={[]}
        comments={[comment("c1", ["original", at(15, 9)]), comment("c2", ["untouched", at(15, 8)])]}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
      />,
    );
    return { onEditComment, onDeleteComment };
  };

  const startEditingFirst = () => fireEvent.click(screen.getAllByTitle("Edit comment")[0]);

  /** Type the way the browser does, then let the editor's change debounce run. */
  const typeInto = (html: string) => {
    editor().innerHTML = html;
    fireEvent.input(editor());
    act(() => {
      jest.advanceTimersByTime(150);
    });
  };

  it("opens an editor on the chosen comment only, holding its text", () => {
    setup();

    startEditingFirst();

    expect(screen.getAllByTestId("rich-text-editor")).toHaveLength(1);
    expect(editor().innerHTML).toBe("original");
    expect(shown(["original", "untouched"])).toEqual(["original", "untouched"]);
  });

  it("saves the new text against the comment's id and closes the editor", () => {
    const { onEditComment } = setup();

    startEditingFirst();
    typeInto("reworded");
    fireEvent.click(saveButton());

    expect(onEditComment.mock.calls).toEqual([[getCommentId("c1"), "reworded"]]);
    expect(screen.queryByTestId("rich-text-editor")).toBeNull();
  });

  it("cancel closes the editor, saves nothing and discards the draft", () => {
    const { onEditComment } = setup();

    startEditingFirst();
    typeInto("abandoned");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onEditComment).not.toHaveBeenCalled();
    expect(screen.queryByTestId("rich-text-editor")).toBeNull();
    expect(shown(["original", "abandoned"])).toEqual(["original"]);

    startEditingFirst();
    expect(editor().innerHTML).toBe("original");
  });

  it("will not save a comment that was emptied", () => {
    const { onEditComment } = setup();

    startEditingFirst();
    expect(saveButton().disabled).toBe(false);

    typeInto("");
    expect(saveButton().disabled).toBe(true);
    fireEvent.click(saveButton());
    expect(onEditComment).not.toHaveBeenCalled();
  });

  it("deletes the comment whose control was used", () => {
    const { onDeleteComment } = setup();

    fireEvent.click(screen.getAllByTitle("Delete comment")[1]);

    expect(onDeleteComment.mock.calls).toEqual([[getCommentId("c2")]]);
  });

  it("offers no edit or delete controls when the handlers are not passed", () => {
    render(<Activity activities={[]} comments={[comment("c1", ["read only", at(15, 9)])]} />);

    expect(shown(["read only"])).toEqual(["read only"]);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it.todo("offers edit on a comment's newest revision only, opening one editor that holds the newest text (U0119)");
  it.todo("keeps Save disabled while the edited comment is only empty markup such as <br> (U0119)");
});
