/**
 * Tests for PersonModel
 */

import { PersonModel, createPersonModels, createPersonModel } from "@/models/PersonModel";
import { Person, getPersonId } from "@/types/person";
import { getColor } from "@/types/types";

// Helper to create a test person
const createTestPerson = (overrides: Partial<Person> = {}): Person => ({
  id: getPersonId((overrides.id as string) || "person-1"),
  name: overrides.name || "John Doe",
  alternatives: overrides.alternatives || [],
  color: overrides.color,
  context: overrides.context,
  comments: overrides.comments || [],
  activity: overrides.activity || [],
  archived: overrides.archived,
});

describe("PersonModel", () => {
  describe("constructor", () => {
    it("should create a PersonModel from Person", () => {
      const person = createTestPerson({ name: "Alice" });
      const model = new PersonModel(person);

      expect(model).toBeInstanceOf(PersonModel);
      expect(model.name).toBe("Alice");
    });

    it("should expose raw person", () => {
      const person = createTestPerson();
      const model = new PersonModel(person);

      expect(model.raw_DONOTUSE).toBe(person);
    });
  });

  describe("entityTypeName", () => {
    it("should return Person for validation messages", () => {
      const model = new PersonModel(createTestPerson({ archived: true }));
      const result = model.canArchive();

      // The reason message should include "Person"
      expect(result.reason).toContain("Person");
    });
  });

  describe("inherited properties", () => {
    it("should inherit id property", () => {
      const model = new PersonModel(createTestPerson({ id: getPersonId("person-123") }));
      expect(model.id).toBe(getPersonId("person-123"));
    });

    it("should inherit name property", () => {
      const model = new PersonModel(createTestPerson({ name: "Bob Smith" }));
      expect(model.name).toBe("Bob Smith");
    });

    it("should inherit alternatives property", () => {
      const model = new PersonModel(createTestPerson({ alternatives: ["Bobby", "BS"] }));
      expect(model.alternatives).toEqual(["Bobby", "BS"]);
    });

    it("should inherit isActive check", () => {
      const active = new PersonModel(createTestPerson({ archived: false }));
      const archived = new PersonModel(createTestPerson({ archived: true }));

      expect(active.isActive).toBe(true);
      expect(archived.isActive).toBe(false);
    });

    it("should inherit displayName", () => {
      const model = new PersonModel(createTestPerson({ name: "John Doe", alternatives: ["Johnny"] }));
      expect(model.displayName).toBe("John Doe (Johnny)");
    });

    it("should inherit initials", () => {
      const model = new PersonModel(createTestPerson({ name: "John Doe" }));
      expect(model.initials).toBe("JD");
    });

    it("should inherit matchesSearch", () => {
      const model = new PersonModel(createTestPerson({ name: "John Doe" }));
      expect(model.matchesSearch("john")).toBe(true);
      expect(model.matchesSearch("xyz")).toBe(false);
    });
  });

  describe("canDelete", () => {
    it("should allow deletion when no todos provided", () => {
      const model = new PersonModel(createTestPerson());
      const result = model.canDelete();

      expect(result.canDelete).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should allow deletion when person not in any todos", () => {
      const model = new PersonModel(createTestPerson({ id: getPersonId("person-1") }));
      const todos = [
        { assignedPeople: [getPersonId("person-2")], sourcePeople: [] },
        { assignedPeople: [], sourcePeople: [getPersonId("person-3")] },
      ];

      const result = model.canDelete(todos);

      expect(result.canDelete).toBe(true);
    });

    it("should not allow deletion when person is assigned to todo", () => {
      const model = new PersonModel(createTestPerson({ id: getPersonId("person-1") }));
      const todos = [{ assignedPeople: [getPersonId("person-1")], sourcePeople: [] }];

      const result = model.canDelete(todos);

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain("assigned to active todos");
    });

    it("should allow deletion when person is source of todo", () => {
      const model = new PersonModel(createTestPerson({ id: getPersonId("person-1") }));
      const todos = [{ assignedPeople: [], sourcePeople: [getPersonId("person-1")] }];

      const result = model.canDelete(todos);

      expect(result.canDelete).toBe(true);
    });

    it("should not allow deletion when person is in multiple todos", () => {
      const model = new PersonModel(createTestPerson({ id: getPersonId("person-1") }));
      const todos = [
        { assignedPeople: [getPersonId("person-1"), getPersonId("person-2")], sourcePeople: [] },
        { assignedPeople: [], sourcePeople: [getPersonId("person-1")] },
      ];

      const result = model.canDelete(todos);

      expect(result.canDelete).toBe(false);
    });
  });

  describe("inherited canArchive", () => {
    it("should allow archiving active person", () => {
      const model = new PersonModel(createTestPerson({ archived: false }));
      const result = model.canArchive();

      expect(result.canArchive).toBe(true);
    });

    it("should not allow archiving already archived person", () => {
      const model = new PersonModel(createTestPerson({ archived: true }));
      const result = model.canArchive();

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain("Person");
      expect(result.reason).toContain("already archived");
    });
  });

  describe("inherited canUnarchive", () => {
    it("should allow unarchiving archived person", () => {
      const model = new PersonModel(createTestPerson({ archived: true }));
      const result = model.canUnarchive();

      expect(result.canUnarchive).toBe(true);
    });

    it("should not allow unarchiving active person", () => {
      const model = new PersonModel(createTestPerson({ archived: false }));
      const result = model.canUnarchive();

      expect(result.canUnarchive).toBe(false);
      expect(result.reason).toContain("Person");
      expect(result.reason).toContain("not archived");
    });
  });
});

describe("createPersonModels", () => {
  it("should create array of PersonModels from Person array", () => {
    const people: Person[] = [
      createTestPerson({ id: getPersonId("1"), name: "Alice" }),
      createTestPerson({ id: getPersonId("2"), name: "Bob" }),
      createTestPerson({ id: getPersonId("3"), name: "Charlie" }),
    ];

    const models = createPersonModels(people);

    expect(models).toHaveLength(3);
    expect(models[0]).toBeInstanceOf(PersonModel);
    expect(models[0].name).toBe("Alice");
    expect(models[1].name).toBe("Bob");
    expect(models[2].name).toBe("Charlie");
  });

  it("should handle empty array", () => {
    const models = createPersonModels([]);

    expect(models).toEqual([]);
  });

  it("should preserve order", () => {
    const people: Person[] = [
      createTestPerson({ name: "Zebra" }),
      createTestPerson({ name: "Apple" }),
      createTestPerson({ name: "Middle" }),
    ];

    const models = createPersonModels(people);

    expect(models[0].name).toBe("Zebra");
    expect(models[1].name).toBe("Apple");
    expect(models[2].name).toBe("Middle");
  });
});

describe("createPersonModel", () => {
  it("should create single PersonModel from Person", () => {
    const person = createTestPerson({ name: "Single Person" });
    const model = createPersonModel(person);

    expect(model).toBeInstanceOf(PersonModel);
    expect(model.name).toBe("Single Person");
  });

  it("should expose raw person", () => {
    const person = createTestPerson();
    const model = createPersonModel(person);

    expect(model.raw_DONOTUSE).toBe(person);
  });
});
