/**
 * Tests for ProjectModel
 */

import { ProjectModel, createProjectModels, createProjectModel } from "@/models/ProjectModel";
import { Project, getProjectId, getProjectCategoryId } from "@/types/project";

// Helper to create a test project
const createTestProject = (overrides: Partial<Project> = {}): Project => ({
  id: getProjectId((overrides.id as string) || "project-1"),
  name: overrides.name || "Test Project",
  alternatives: overrides.alternatives || [],
  color: overrides.color,
  context: overrides.context,
  comments: overrides.comments || [],
  activity: overrides.activity || [],
  archived: overrides.archived,
  category: overrides.category,
});

describe("ProjectModel", () => {
  describe("constructor", () => {
    it("should create a ProjectModel from Project", () => {
      const project = createTestProject({ name: "Website Redesign" });
      const model = new ProjectModel(project);

      expect(model).toBeInstanceOf(ProjectModel);
      expect(model.name).toBe("Website Redesign");
    });

    it("should expose raw project", () => {
      const project = createTestProject();
      const model = new ProjectModel(project);

      expect(model.raw_DONOTUSE).toBe(project);
    });
  });

  describe("entityTypeName", () => {
    it("should return Project for validation messages", () => {
      const model = new ProjectModel(createTestProject({ archived: true }));
      const result = model.canArchive();

      // The reason message should include "Project"
      expect(result.reason).toContain("Project");
    });
  });

  describe("inherited properties", () => {
    it("should inherit id property", () => {
      const model = new ProjectModel(createTestProject({ id: getProjectId("project-123") }));
      expect(model.id).toBe(getProjectId("project-123"));
    });

    it("should inherit name property", () => {
      const model = new ProjectModel(createTestProject({ name: "Marketing Campaign" }));
      expect(model.name).toBe("Marketing Campaign");
    });

    it("should inherit alternatives property", () => {
      const model = new ProjectModel(createTestProject({ alternatives: ["Marketing", "MC"] }));
      expect(model.alternatives).toEqual(["Marketing", "MC"]);
    });

    it("should inherit isActive check", () => {
      const active = new ProjectModel(createTestProject({ archived: false }));
      const archived = new ProjectModel(createTestProject({ archived: true }));

      expect(active.isActive).toBe(true);
      expect(archived.isActive).toBe(false);
    });

    it("should inherit displayName", () => {
      const model = new ProjectModel(createTestProject({ name: "Website", alternatives: ["Web", "Site"] }));
      expect(model.displayName).toBe("Website (Web, Site)");
    });

    it("should inherit initials", () => {
      const model = new ProjectModel(createTestProject({ name: "Website Redesign" }));
      expect(model.initials).toBe("WR");
    });

    it("should inherit matchesSearch", () => {
      const model = new ProjectModel(createTestProject({ name: "Website Redesign" }));
      expect(model.matchesSearch("website")).toBe(true);
      expect(model.matchesSearch("xyz")).toBe(false);
    });
  });

  describe("canDelete", () => {
    it("should allow deletion when no todos provided", () => {
      const model = new ProjectModel(createTestProject());
      const result = model.canDelete();

      expect(result.canDelete).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should allow deletion when project not in any todos", () => {
      const model = new ProjectModel(createTestProject({ id: getProjectId("project-1") }));
      // Use projectIds (not raw projects) to match TodoModel interface
      const todos = [{ projectIds: [getProjectId("project-2")] }, { projectIds: [getProjectId("project-3")] }];

      const result = model.canDelete(todos);

      expect(result.canDelete).toBe(true);
    });

    it("should not allow deletion when project is used in todo", () => {
      const model = new ProjectModel(createTestProject({ id: getProjectId("project-1") }));
      const todos = [{ projectIds: [getProjectId("project-1")] }];

      const result = model.canDelete(todos);

      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain("used in active todos");
    });

    it("should not allow deletion when project is in multiple todos", () => {
      const model = new ProjectModel(createTestProject({ id: getProjectId("project-1") }));
      const todos = [
        { projectIds: [getProjectId("project-1"), getProjectId("project-2")] },
        { projectIds: [getProjectId("project-1")] },
        { projectIds: [getProjectId("project-3")] },
      ];

      const result = model.canDelete(todos);

      expect(result.canDelete).toBe(false);
    });

    it("should handle todos with empty projectIds", () => {
      const model = new ProjectModel(createTestProject({ id: getProjectId("project-1") }));
      const todos = [{ projectIds: [] }, { projectIds: [getProjectId("project-2")] }];

      const result = model.canDelete(todos);

      expect(result.canDelete).toBe(true);
    });
  });

  describe("inherited canArchive", () => {
    it("should allow archiving active project", () => {
      const model = new ProjectModel(createTestProject({ archived: false }));
      const result = model.canArchive();

      expect(result.canArchive).toBe(true);
    });

    it("should not allow archiving already archived project", () => {
      const model = new ProjectModel(createTestProject({ archived: true }));
      const result = model.canArchive();

      expect(result.canArchive).toBe(false);
      expect(result.reason).toContain("Project");
      expect(result.reason).toContain("already archived");
    });
  });

  describe("inherited canUnarchive", () => {
    it("should allow unarchiving archived project", () => {
      const model = new ProjectModel(createTestProject({ archived: true }));
      const result = model.canUnarchive();

      expect(result.canUnarchive).toBe(true);
    });

    it("should not allow unarchiving active project", () => {
      const model = new ProjectModel(createTestProject({ archived: false }));
      const result = model.canUnarchive();

      expect(result.canUnarchive).toBe(false);
      expect(result.reason).toContain("Project");
      expect(result.reason).toContain("not archived");
    });
  });

  describe("project-specific properties", () => {
    it("should expose category via getter", () => {
      const model = new ProjectModel(createTestProject({ category: getProjectCategoryId("work") }));
      expect(model.category).toBe(getProjectCategoryId("work"));
    });

    it("should handle undefined category", () => {
      const model = new ProjectModel(createTestProject({ category: undefined }));
      expect(model.category).toBeUndefined();
    });
  });
});

describe("createProjectModels", () => {
  it("should create array of ProjectModels from Project array", () => {
    const projects: Project[] = [
      createTestProject({ id: getProjectId("1"), name: "Website" }),
      createTestProject({ id: getProjectId("2"), name: "API" }),
      createTestProject({ id: getProjectId("3"), name: "Mobile App" }),
    ];

    const models = createProjectModels(projects);

    expect(models).toHaveLength(3);
    expect(models[0]).toBeInstanceOf(ProjectModel);
    expect(models[0].name).toBe("Website");
    expect(models[1].name).toBe("API");
    expect(models[2].name).toBe("Mobile App");
  });

  it("should handle empty array", () => {
    const models = createProjectModels([]);

    expect(models).toEqual([]);
  });

  it("should preserve order", () => {
    const projects: Project[] = [
      createTestProject({ name: "Zebra Project" }),
      createTestProject({ name: "Apple Project" }),
      createTestProject({ name: "Middle Project" }),
    ];

    const models = createProjectModels(projects);

    expect(models[0].name).toBe("Zebra Project");
    expect(models[1].name).toBe("Apple Project");
    expect(models[2].name).toBe("Middle Project");
  });
});

describe("createProjectModel", () => {
  it("should create single ProjectModel from Project", () => {
    const project = createTestProject({ name: "Single Project" });
    const model = createProjectModel(project);

    expect(model).toBeInstanceOf(ProjectModel);
    expect(model.name).toBe("Single Project");
  });

  it("should expose raw project", () => {
    const project = createTestProject();
    const model = createProjectModel(project);

    expect(model.raw_DONOTUSE).toBe(project);
  });
});
