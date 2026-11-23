/**
 * @jest-environment jsdom
 */

/**
 * Characterisation tests for the notes exporters in export.ts; export.test.ts
 * covers only the todo exporters. Known defects are it.todo entries that name
 * their backlog unit, and no assertion here pins one of them.
 */

import { exportNotes, exportNotesToCSV, exportNotesToJSON, exportNotesToMarkdown } from "@/utils/export";
import { NoteModel } from "@/models/NoteModel";
import { createTestSettings } from "@/__tests__/helpers/fixtures";
import { Note, getActionItemId, getNoteId } from "@/types/note";
import { getTag } from "@/types/todo";
import { getPersonId } from "@/types/person";
import { getProjectId } from "@/types/project";
import { getTimestamp } from "@/types/time";
import { getCommentId } from "@/types/types";

const NOW = new Date(2026, 4, 15, 10, 0, 0);
// UTC instants, so their ISO form reads the same in every time zone.
const CREATED = getTimestamp(Date.UTC(2026, 4, 12, 8, 30, 0));
const UPDATED = getTimestamp(Date.UTC(2026, 4, 14, 9, 0, 0));
const ARCHIVED = getTimestamp(Date.UTC(2026, 4, 14, 17, 45, 0));
const urlMethods = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };

beforeEach(() => {
  // jsdom's FileReader finishes on setImmediate, which the Blob reads below need to stay real.
  jest.useFakeTimers({ doNotFake: ["setImmediate"] });
  jest.setSystemTime(NOW);
});
afterEach(() => {
  Object.assign(URL, urlMethods);
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const settings = createTestSettings();
const blank = {
  state: "active", content: "", pinned: false, createdAt: CREATED, updatedAt: UPDATED,
  tags: [], assignedPeople: [], sourcePeople: [], mentionedPeople: [], projects: [],
  actionItems: [], createdActionItems: [], comments: [], activity: [],
} satisfies Partial<Note>;
const makeNote = (title: string, overrides: Partial<Note> = {}): NoteModel =>
  new NoteModel({ ...blank, id: getNoteId(`note-${title}`), text: title, plainText: title, ...overrides }, settings);

// A note with every exported field set. Half of its people and projects are
// missing from the maps, so the fallback to the id shows in the same output.
const people = new Map([["ada", "Ada Lovelace"], ["bob", "Bob Stone"]]);
const projects = new Map([["apollo", "Apollo"]]);
const fullNote = () =>
  makeNote("Plan launch", {
    text: "Plan launch @ada #alpha",
    pinned: true,
    content: "Remember the budget.",
    tags: [getTag("alpha"), getTag("beta")],
    assignedPeople: [getPersonId("ada"), getPersonId("grace")],
    sourcePeople: [getPersonId("bob")],
    mentionedPeople: [getPersonId("carol")],
    projects: [getProjectId("apollo"), getProjectId("zeus")],
    actionItems: [
      { id: getActionItemId("ai-1"), text: "Email Bob @bob", plainText: "Email Bob", createdAt: UPDATED },
      { id: getActionItemId("ai-2"), text: "Book room", plainText: "Book room", createdAt: UPDATED },
    ],
    comments: [{ commentId: getCommentId("c-1"), history: [{ timestamp: UPDATED, content: "Agreed" }] }],
  });
const archivedNote = () => makeNote("Old idea", { state: "archived", archivedAt: ARCHIVED, updatedAt: undefined });
// A byte-order mark may come to lead the CSV (U0098); output is compared line by line without it.
const linesOf = (text: string) => text.replace(/^\uFEFF/, "").split("\n");

describe("exportNotesToMarkdown", () => {
  const headings = (markdown: string) => markdown.split("\n").filter((line) => line.startsWith("#"));

  it("opens with the title and the moment of the export", () => {
    // Formatted from the same frozen clock, so the machine's locale does not matter.
    const stamp = `*Exported on ${NOW.toLocaleDateString()} at ${NOW.toLocaleTimeString()}*`;

    expect(exportNotesToMarkdown([]).split("\n")).toEqual(["# Notes", "", stamp, ""]);
    expect(exportNotesToMarkdown([], new Map(), new Map(), "Meeting notes").split("\n")[0]).toBe("# Meeting notes");
  });

  it("lists active notes, then archived ones, each group under its own heading", () => {
    const markdown = exportNotesToMarkdown([archivedNote(), makeNote("Plan launch"), makeNote("Second thought")]);

    const active = ["## Active Notes", "### Plan launch", "### Second thought"];
    expect(headings(markdown)).toEqual(["# Notes", ...active, "## Archived Notes", "### Old idea"]);
  });

  it("leaves out the heading of an empty group, and deleted notes altogether", () => {
    const markdown = exportNotesToMarkdown([archivedNote(), makeNote("Gone", { state: "deleted" })]);

    expect(headings(markdown)).toEqual(["# Notes", "## Archived Notes", "### Old idea"]);
  });

  it("marks a pinned note and gives a note without a title a fallback one", () => {
    const markdown = exportNotesToMarkdown([makeNote("Roadmap", { pinned: true }), makeNote("")]);

    expect(headings(markdown).slice(2)).toEqual(["### 📌 Roadmap", "### Untitled Note"]);
  });

  it("puts people, projects and tags on the metadata line, by their mapped names", () => {
    const lines = exportNotesToMarkdown([fullNote()], people, projects).split("\n");
    const metadata = lines[lines.indexOf("### 📌 Plan launch") + 1];

    // The line goes on with an "Updated" segment whose value is a known defect (U0101); its end is left open.
    expect(metadata).toContain("*Assigned: @Ada Lovelace, @grace | Projects: %Apollo, %zeus | Tags: #alpha, #beta");
  });

  it("follows the metadata line with the content and the pending action items, when there are any", () => {
    const lines = exportNotesToMarkdown([fullNote(), makeNote("Bare")], people, projects).split("\n");
    const [full, bare] = [lines.indexOf("### 📌 Plan launch"), lines.indexOf("### Bare")];

    const actionItems = ["**Action Items:**", "- [ ] Email Bob", "- [ ] Book room"];
    expect(lines.slice(full + 2, bare)).toEqual(["", "Remember the budget.", "", ...actionItems, ""]);
    expect(lines.slice(bare + 2)).toEqual([""]);
  });

  it.todo("labels the age line by what it measures instead of calling the creation age 'Updated' (U0101)");
  it.todo("converts rich-text HTML content instead of writing the stored markup into the file (U0102)");
});

describe("exportNotesToCSV", () => {
  const HEADER =
    "Title,Status,Pinned,Assigned,Source,Mentioned,Projects,Tags,Content Preview,Action Items,Comments,Created,Updated";

  it("writes the header, then one row per note in header order, with mapped names or else the id", () => {
    expect(linesOf(exportNotesToCSV([fullNote(), archivedNote()], people, projects))).toEqual([
      HEADER,
      "Plan launch,active,Yes,Ada Lovelace; grace,Bob Stone,carol,Apollo; zeus,alpha; beta,Remember the budget.,2,1," +
        "2026-05-12T08:30:00.000Z,2026-05-14T09:00:00.000Z",
      "Old idea,archived,No,,,,,,,0,0,2026-05-12T08:30:00.000Z,",
    ]);
  });

  it.each([
    { what: "a comma", title: "Budget, final", cell: '"Budget, final"' },
    { what: "a double quote", title: 'The "big" one', cell: '"The ""big"" one"' },
    { what: "a line break", title: "Line one\nLine two", cell: '"Line one\nLine two"' },
  ])("quotes a value containing $what", ({ title, cell }) => {
    expect(exportNotesToCSV([makeNote(title)])).toContain(`\n${cell},active,No,`);
  });

  it("prefixes a title that starts like a formula, so a spreadsheet shows it instead of running it", () => {
    const csv = exportNotesToCSV([makeNote("=1+1"), makeNote("=SUM(A1,B1)")]);

    expect(linesOf(csv)[1]).toMatch(/^'=1\+1,active,No,/);
    expect(linesOf(csv)[2]).toMatch(/^"'=SUM\(A1,B1\)",active,No,/);
  });

  it.todo('exports a title such as "-5 things" so that re-importing it gives the same title back (U0099)');
  it.todo('calls a note without a title "Untitled Note", as Markdown and the UI do (U0094)');
  it.todo("starts with a UTF-8 byte-order mark so Excel reads accented names (U0098)");
  it.todo("leaves out deleted notes, as Markdown does (U0485)");
});

describe("exportNotesToJSON", () => {
  it("wraps the notes with the moment of the export, indented by two spaces", () => {
    expect(exportNotesToJSON([])).toBe(JSON.stringify({ notes: [], exportedAt: NOW.toISOString() }, null, 2));
  });

  it("describes each note, with people and projects as id and name pairs and its timestamps", () => {
    const [full, archived] = JSON.parse(exportNotesToJSON([fullNote(), archivedNote()], people, projects)).notes;

    expect(full).toEqual({
      id: "note-Plan launch",
      title: "Plan launch",
      fullText: "Plan launch @ada #alpha",
      state: "active",
      pinned: true,
      content: "Remember the budget.",
      metadata: {
        assignedPeople: [{ id: "ada", name: "Ada Lovelace" }, { id: "grace", name: "grace" }],
        sourcePeople: [{ id: "bob", name: "Bob Stone" }],
        mentionedPeople: [{ id: "carol", name: "carol" }],
        projects: [{ id: "apollo", name: "Apollo" }, { id: "zeus", name: "zeus" }],
        tags: ["alpha", "beta"],
      },
      actionItems: [
        { id: "ai-1", text: "Email Bob", createdAt: UPDATED },
        { id: "ai-2", text: "Book room", createdAt: UPDATED },
      ],
      timestamps: { created: CREATED, updated: UPDATED },
      commentsCount: 1,
    });
    expect(archived).toMatchObject({ state: "archived", timestamps: { created: CREATED, archived: ARCHIVED } });
  });

  it.todo("converts rich-text HTML content instead of exporting the stored markup (U0102)");
  it.todo("leaves out deleted notes, as Markdown does (U0485)");
});

describe("exportNotes", () => {
  // jsdom has neither URL method. Both are stubbed here and taken away again in afterEach.
  const captureDownloads = () => {
    const captured = { blobs: [] as Blob[], names: [] as string[], revoke: jest.fn() };
    URL.createObjectURL = (source: Blob | MediaSource) => {
      if (source instanceof Blob) captured.blobs.push(source);
      return "blob:notes";
    };
    URL.revokeObjectURL = captured.revoke;
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      captured.names.push(this.download);
    });
    return captured;
  };
  const readBlob = (blob: Blob) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blob);
    });

  it.each([
    { format: "markdown", extension: "md", mime: "text/markdown", exporter: exportNotesToMarkdown },
    { format: "csv", extension: "csv", mime: "text/csv", exporter: exportNotesToCSV },
    { format: "json", extension: "json", mime: "application/json", exporter: exportNotesToJSON },
  ] as const)("downloads $format as notes.$extension", async ({ format, extension, mime, exporter }) => {
    const { blobs, names } = captureDownloads();

    exportNotes([fullNote()], format, people, projects);

    expect(names).toEqual([`notes.${extension}`]);
    // The media type only: whether CSV should also declare a charset is U0098.
    expect(blobs[0].type.split(";")[0]).toBe(mime);
    expect(linesOf(await readBlob(blobs[0]))).toEqual(linesOf(exporter([fullNote()], people, projects)));
  });

  it("uses the given file name, removes its link and releases the object URL only after a second", () => {
    const { names, revoke } = captureDownloads();

    exportNotes([], "csv", new Map(), new Map(), "meeting-notes");

    expect(names).toEqual(["meeting-notes.csv"]);
    expect(document.querySelector("a")).toBeNull();
    expect(revoke).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(revoke.mock.calls).toEqual([["blob:notes"]]);
  });
});
