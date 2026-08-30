/**
 * Tests for rewriting references when a person or project is renamed.
 *
 * People and projects are referenced by name, so a rename that does not rewrite
 * them orphans every todo and note that mentioned the entity. These pin the
 * cases that are easy to get wrong: partial-word collisions, markers that would
 * duplicate a name suffix, case-only renames, and names that are already taken.
 */

import {
  renameInNames,
  renameMarkersInText,
  renameInRecord,
  renameInFilters,
  isNameTaken,
} from "@/utils/renameReferences";

describe("renameReferences", () => {
  describe("renameInNames", () => {
    it("replaces the renamed entity and leaves the rest alone", () => {
      expect(renameInNames(["Marcel", "John"], "Marcel", "Marcel Erz")).toEqual(["Marcel Erz", "John"]);
    });

    it("matches case-insensitively, since lookups resolve names that way", () => {
      expect(renameInNames(["marcel"], "Marcel", "Marcel Erz")).toEqual(["Marcel Erz"]);
    });

    it("supports a case-only rename", () => {
      expect(renameInNames(["marcel"], "marcel", "Marcel")).toEqual(["Marcel"]);
    });

    it("does not duplicate when the new name is already referenced", () => {
      expect(renameInNames(["Marcel", "Marcel Erz"], "Marcel", "Marcel Erz")).toEqual(["Marcel Erz"]);
    });

    it("returns the original array when nothing referenced the entity", () => {
      const names = ["John"];
      expect(renameInNames(names, "Marcel", "Marcel Erz")).toBe(names);
    });

    it("handles missing and empty lists", () => {
      expect(renameInNames(undefined, "Marcel", "M")).toBeUndefined();
      expect(renameInNames([], "Marcel", "M")).toEqual([]);
    });
  });

  describe("renameMarkersInText", () => {
    it("rewrites a marker occurrence", () => {
      expect(renameMarkersInText("Review PR @Marcel", "Marcel", "Marcel Erz", ["@", "$"])).toBe(
        "Review PR @Marcel Erz",
      );
    });

    it("does not rewrite a marker for a longer, different name", () => {
      // The trailing lookahead mirrors SmartInput's own marker regex. Without
      // it, renaming "Marcel" would corrupt an unrelated "@Marcelo".
      expect(renameMarkersInText("Ping @Marcelo today", "Marcel", "Marcel Erz", ["@"])).toBe("Ping @Marcelo today");
    });

    it("still rewrites when the following prose repeats the new name", () => {
      // "@Marcel" did reference this person, so pointing it at the new name is
      // correct; the doubled word comes from the user's own prose and is an
      // accepted cosmetic artifact of rewriting text.
      expect(renameMarkersInText("Ping @Marcel Erz today", "Marcel", "Marcel Erz", ["@"])).toBe(
        "Ping @Marcel Erz Erz today",
      );
    });

    it("leaves a bare name in prose untouched", () => {
      expect(renameMarkersInText("Ask Marcel about it", "Marcel", "Marcel Erz", ["@", "$"])).toBe(
        "Ask Marcel about it",
      );
    });

    it("only rewrites the markers it was given", () => {
      // A person and a project can share a name; renaming the person must not
      // touch %Web.
      expect(renameMarkersInText("@Web and %Web", "Web", "Web Team", ["@", "$"])).toBe("@Web Team and %Web");
    });

    it("rewrites every occurrence", () => {
      expect(renameMarkersInText("@Marcel and @Marcel", "Marcel", "M", ["@"])).toBe("@M and @M");
    });

    it("escapes regex characters in names", () => {
      expect(renameMarkersInText("@A.B", "A.B", "C", ["@"])).toBe("@C");
      expect(renameMarkersInText("@AXB", "A.B", "C", ["@"])).toBe("@AXB");
    });
  });

  describe("renameInRecord", () => {
    const todo = {
      assignedPeople: ["Marcel"],
      sourcePeople: [],
      mentionedPeople: [],
      projects: ["Website"],
      text: "Review PR @Marcel %Website",
      plainText: "Review PR @Marcel",
    };

    it("rewrites both the reference fields and the marker text for a person", () => {
      const result = renameInRecord(todo, "person", "Marcel", "Marcel Erz");
      expect(result?.assignedPeople).toEqual(["Marcel Erz"]);
      expect(result?.text).toBe("Review PR @Marcel Erz %Website");
      expect(result?.plainText).toBe("Review PR @Marcel Erz");
      // the project reference is untouched
      expect(result?.projects).toEqual(["Website"]);
    });

    it("rewrites a project without touching people", () => {
      const result = renameInRecord(todo, "project", "Website", "Web Redesign");
      expect(result?.projects).toEqual(["Web Redesign"]);
      expect(result?.text).toBe("Review PR @Marcel %Web Redesign");
      expect(result?.assignedPeople).toEqual(["Marcel"]);
    });

    it("returns null when the record does not mention the entity", () => {
      expect(renameInRecord(todo, "person", "Someone Else", "Nobody")).toBeNull();
    });

    it("rewrites a record that only mentions the name in its text", () => {
      const result = renameInRecord(
        { assignedPeople: [], projects: [], text: "ping @Marcel", plainText: "ping @Marcel" },
        "person",
        "Marcel",
        "M",
      );
      expect(result?.text).toBe("ping @M");
    });
  });

  describe("renameInFilters", () => {
    it("rewrites saved filter values", () => {
      const filters = { assignedPeople: ["Marcel"], projects: ["Website"] };
      expect(renameInFilters(filters, "person", "Marcel", "Marcel Erz")?.assignedPeople).toEqual(["Marcel Erz"]);
      expect(renameInFilters(filters, "project", "Website", "Web")?.projects).toEqual(["Web"]);
    });

    it("returns null when no filter referenced the entity", () => {
      expect(renameInFilters({ assignedPeople: ["John"] }, "person", "Marcel", "M")).toBeNull();
    });
  });

  describe("isNameTaken", () => {
    const entities = [
      { id: "1", name: "Marcel", alternatives: ["Marce"] },
      { id: "2", name: "John Doe", alternatives: [] },
    ];

    it("reports a collision with another entity's name", () => {
      expect(isNameTaken(entities, "John Doe", "1")).toBe(true);
    });

    it("compares case-insensitively", () => {
      expect(isNameTaken(entities, "john doe", "1")).toBe(true);
    });

    it("reports a collision with another entity's alternative", () => {
      expect(isNameTaken(entities, "Marce", "2")).toBe(true);
    });

    it("ignores the entity being renamed, so a case-only rename is allowed", () => {
      expect(isNameTaken(entities, "marcel", "1")).toBe(false);
    });

    it("does not treat an unused name as taken", () => {
      expect(isNameTaken(entities, "Someone New", "1")).toBe(false);
      expect(isNameTaken(entities, "   ", "1")).toBe(false);
    });
  });
});
