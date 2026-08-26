import { describeEntityDelete } from "../formatters";

describe("describeEntityDelete", () => {
  it("asks the plain question when nothing references the entity", () => {
    expect(describeEntityDelete("Marcel", "person", { canDelete: true })).toBe(
      'Are you sure you want to delete "Marcel"? This action cannot be undone.',
    );
  });

  it("falls back to the plain question when the entity was not found", () => {
    expect(describeEntityDelete("Marcel", "person", undefined)).toContain("Are you sure");
  });

  it("says what breaks when the person is still assigned", () => {
    const message = describeEntityDelete("Marcel", "person", {
      canDelete: false,
      reason: "Person is assigned to active todos",
    });

    // Ids are names, so the todos keep the text and simply stop resolving --
    // which is the part a generic "cannot be undone" never told anyone.
    expect(message).toContain("Person is assigned to active todos");
    expect(message).toContain('"@Marcel"');
    expect(message).toContain("no longer resolve");
  });

  it("uses the project marker for projects", () => {
    const message = describeEntityDelete("Website", "project", {
      canDelete: false,
      reason: "Project is used in active todos",
    });

    expect(message).toContain('"%Website"');
  });
});
