/**
 * Characterisation tests for the 1:1 and meeting note templates. Today's known
 * defects are not asserted: each is an `it.todo` naming the backlog unit that fixes it.
 */

import {
  generateOneOnOneNoteTitle,
  generateMeetingNoteTitle,
  generateOneOnOneNoteContent,
  generateMeetingNoteContent,
} from "../noteTemplates";
import { NoteTemplateItem, defaultOneOnOneTemplate, defaultMeetingNoteTemplate } from "@/types/settings";

const item = (id: string, label: string, enabled = true): NoteTemplateItem => ({ id, label, enabled });
const section = (label: string) => `<p><strong>${label}</strong></p><ul><li></li></ul><p>&nbsp;</p>`;
const statusSection = (label: string) => `<p><strong>${label}</strong></p><ul><li>🔴🟡🟢&nbsp;</li></ul><p>&nbsp;</p>`;

describe("note titles", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15, 10, 0, 0));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("marks a 1:1 title with the person and a meeting title with the project, each dated today", () => {
    expect(generateOneOnOneNoteTitle("Ada")).toBe("@Ada 1:1 Note (May 15th 2026)");
    expect(generateMeetingNoteTitle("Apollo")).toBe("%Apollo Meeting Notes (May 15th 2026)");
  });

  // Half an hour from midnight is another day in UTC for every zone on one side of it.
  it("dates both titles by the local calendar day, not the UTC one", () => {
    jest.setSystemTime(new Date(2026, 0, 1, 0, 30, 0));
    expect(generateOneOnOneNoteTitle("Ada")).toBe("@Ada 1:1 Note (Jan 1st 2026)");
    expect(generateMeetingNoteTitle("Apollo")).toBe("%Apollo Meeting Notes (Jan 1st 2026)");
    jest.setSystemTime(new Date(2026, 11, 31, 23, 30, 0));
    expect(generateOneOnOneNoteTitle("Ada")).toBe("@Ada 1:1 Note (Dec 31st 2026)");
    expect(generateMeetingNoteTitle("Apollo")).toBe("%Apollo Meeting Notes (Dec 31st 2026)");
  });
});

describe("generateOneOnOneNoteContent", () => {
  it("writes a bold heading, an empty bullet and a spacer for each item, in order", () => {
    expect(generateOneOnOneNoteContent([item("wins", "Wins"), item("blockers", "Blockers")])).toBe(
      "<p><strong>Wins</strong></p><ul><li></li></ul><p>&nbsp;</p>" +
        "<p><strong>Blockers</strong></p><ul><li></li></ul><p>&nbsp;</p>",
    );
  });

  it("skips disabled items", () => {
    const items = [item("wins", "Wins"), item("challenges", "Challenges", false), item("blockers", "Blockers")];
    expect(generateOneOnOneNoteContent(items)).toBe(section("Wins") + section("Blockers"));
  });

  it("returns one empty paragraph when every item is disabled or there are none", () => {
    expect(generateOneOnOneNoteContent([item("wins", "Wins", false), item("risks", "Risks", false)])).toBe("<p></p>");
    expect(generateOneOnOneNoteContent([])).toBe("<p></p>");
  });

  it("builds the seven sections of the default template", () => {
    const labels = ["Priorities", "Wins", "Challenges", "Blockers", "Support Needed", "Career Growth", "Follow-Ups"];
    expect(generateOneOnOneNoteContent(defaultOneOnOneTemplate)).toBe(labels.map(section).join(""));
  });
  it.todo("escapes HTML in a label, so 'Risks <high>' reaches the note as Risks &lt;high&gt; (U0596)");
});

describe("generateMeetingNoteContent", () => {
  it("writes an ordinary item as a 1:1 note does, and starts the project status bullet with three indicators", () => {
    expect(generateMeetingNoteContent([item("risks", "Risks"), item("project_status", "Project Status")])).toBe(
      "<p><strong>Risks</strong></p><ul><li></li></ul><p>&nbsp;</p>" +
        "<p><strong>Project Status</strong></p><ul><li>🔴🟡🟢&nbsp;</li></ul><p>&nbsp;</p>",
    );
  });

  it("recognises the status section by its id, so a renamed one keeps its indicators", () => {
    const items = [item("project_status", "Health"), item("custom_1", "Project Status")];
    expect(generateMeetingNoteContent(items)).toBe(statusSection("Health") + section("Project Status"));
  });

  it("skips disabled items, the status section included", () => {
    const items = [item("risks", "Risks"), item("project_status", "Project Status", false), item("changes", "Changes")];
    expect(generateMeetingNoteContent(items)).toBe(section("Risks") + section("Changes"));
  });

  it("returns one empty paragraph when every item is disabled or there are none", () => {
    expect(generateMeetingNoteContent([item("project_status", "Project Status", false)])).toBe("<p></p>");
    expect(generateMeetingNoteContent([])).toBe("<p></p>");
  });

  it("builds the twelve sections of the default template, with indicators only under Project Status", () => {
    const before = ["Meeting Type", "Facilitator", "Attendees", "Purpose of this Meeting"];
    const after = ["Progress", "Risks", "Decisions Made", "Changes", "Follow-Ups", "Next Steps", "Appendix"];
    expect(generateMeetingNoteContent(defaultMeetingNoteTemplate)).toBe(
      before.map(section).join("") + statusSection("Project Status") + after.map(section).join(""),
    );
  });
  it.todo("escapes HTML in a label, so 'Risks <high>' reaches the note as Risks &lt;high&gt; (U0596)");
});
