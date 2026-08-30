/**
 * Tests for the rename cascade's orchestration.
 *
 * This used to be a closure inside TodoApp, where none of it could be tested:
 * not the ordering rule that references are rewritten before the entity itself,
 * not the auto-assign rewrite, and not the collision refusal.
 */

import { cascadeEntityRename, renameInAutoAssign, rejectRename } from "@/utils/cascadeEntityRename";

describe("cascadeEntityRename", () => {
  const baseOptions = {
    kind: "person" as const,
    previousName: "Marcel",
    nextName: "Marc",
    autoAssign: {},
    updateAutoAssign: jest.fn(),
  };

  it("passes the rename to every participant", async () => {
    const a = jest.fn();
    const b = jest.fn();

    await cascadeEntityRename({ ...baseOptions, participants: [a, b] });

    expect(a).toHaveBeenCalledWith("person", "Marcel", "Marc");
    expect(b).toHaveBeenCalledWith("person", "Marcel", "Marc");
  });

  it("waits for async participants before resolving", async () => {
    // The ordering guarantee depends on this: the caller renames the entity
    // only after every reference has been rewritten. A floating promise here
    // would let the entity be renamed first, briefly orphaning references.
    let settled = false;
    const slow = () => new Promise<void>((resolve) => setTimeout(() => { settled = true; resolve(); }, 10));

    await cascadeEntityRename({ ...baseOptions, participants: [slow] });

    expect(settled).toBe(true);
  });

  it("rejects if a participant throws, rather than reporting success", async () => {
    const boom = () => Promise.reject(new Error("storage failed"));

    await expect(cascadeEntityRename({ ...baseOptions, participants: [boom] })).rejects.toThrow("storage failed");
  });

  it("rewrites an auto-assign default that named the renamed person", async () => {
    const updateAutoAssign = jest.fn();

    await cascadeEntityRename({
      ...baseOptions,
      participants: [],
      autoAssign: { assignedPerson: "Marcel", sourcePerson: "Someone Else" },
      updateAutoAssign,
    });

    expect(updateAutoAssign).toHaveBeenCalledWith({ assignedPerson: "Marc" });
  });

  it("does not touch auto-assign when nothing referenced the entity", async () => {
    const updateAutoAssign = jest.fn();

    await cascadeEntityRename({
      ...baseOptions,
      participants: [],
      autoAssign: { assignedPerson: "Someone Else" },
      updateAutoAssign,
    });

    expect(updateAutoAssign).not.toHaveBeenCalled();
  });
});

describe("renameInAutoAssign", () => {
  it("rewrites both person defaults", () => {
    expect(
      renameInAutoAssign("person", { assignedPerson: "Marcel", sourcePerson: "Marcel" }, "Marcel", "Marc"),
    ).toEqual({ assignedPerson: "Marc", sourcePerson: "Marc" });
  });

  it("rewrites the project default", () => {
    expect(renameInAutoAssign("project", { project: "Website" }, "Website", "Web")).toEqual({ project: "Web" });
  });

  it("does not cross entity kinds", () => {
    // A person and a project can share a name; renaming one must not move the other.
    expect(renameInAutoAssign("person", { project: "Web" }, "Web", "Web Team")).toEqual({});
    expect(renameInAutoAssign("project", { assignedPerson: "Web" }, "Web", "Web Team")).toEqual({});
  });
});

describe("rejectRename", () => {
  const entities = [
    { id: "1", name: "Marcel", alternatives: ["Marce"] },
    { id: "2", name: "John Doe", alternatives: [] },
  ];

  it("refuses a name another entity already holds", () => {
    expect(rejectRename(entities, "person", "John Doe", "1")).toContain("already exists");
  });

  it("names the entity kind in the message", () => {
    expect(rejectRename(entities, "project", "John Doe", "1")).toContain("project");
  });

  it("allows a name nobody holds", () => {
    expect(rejectRename(entities, "person", "Someone New", "1")).toBeNull();
  });

  it("allows an entity to keep its own name, so a case-only rename works", () => {
    expect(rejectRename(entities, "person", "marcel", "1")).toBeNull();
  });
});
