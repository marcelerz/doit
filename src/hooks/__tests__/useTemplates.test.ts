/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useTemplates } from "../useTemplates";

// Mock storage
jest.mock("@/storage/storage", () => ({
  STORAGE_KEYS: { TEMPLATES: "doit-templates" },
  loadFromStorage: jest.fn().mockResolvedValue([]),
  saveToStorage: jest.fn().mockResolvedValue(undefined),
  waitForStorageInit: jest.fn().mockResolvedValue(undefined),
}));

// Import mocks after setup
import { loadFromStorage, saveToStorage } from "@/storage/storage";

describe("useTemplates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loadFromStorage as jest.Mock).mockResolvedValue([]);
  });

  describe("initialization", () => {
    it("should load templates from storage on mount", async () => {
      const existingTemplates = [
        { id: "template-1", name: "Template 1", text: "Test text", usageCount: 5 },
        { id: "template-2", name: "Template 2", text: "Another text", usageCount: 3 },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingTemplates);

      const { result } = renderHook(() => useTemplates());

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLoaded).toBe(true);
      expect(result.current.templates).toHaveLength(2);
    });

    it("should start with isLoaded false", () => {
      const { result } = renderHook(() => useTemplates());
      expect(result.current.isLoaded).toBe(false);
    });

    it("should return templates sorted by usage count (descending)", async () => {
      const existingTemplates = [
        { id: "template-1", name: "Low Usage", text: "Text 1", usageCount: 1 },
        { id: "template-2", name: "High Usage", text: "Text 2", usageCount: 10 },
        { id: "template-3", name: "Medium Usage", text: "Text 3", usageCount: 5 },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingTemplates);

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.templates[0].name).toBe("High Usage");
      expect(result.current.templates[1].name).toBe("Medium Usage");
      expect(result.current.templates[2].name).toBe("Low Usage");
    });
  });

  describe("addTemplate", () => {
    it("should add a new template with generated id and zero usage count", async () => {
      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addTemplate({ name: "New Template", text: "New text", plainText: "New text", metadata: {} });
      });

      expect(result.current.templates).toHaveLength(1);
      expect(result.current.templates[0].name).toBe("New Template");
      expect(result.current.templates[0].text).toBe("New text");
      expect(result.current.templates[0].usageCount).toBe(0);
      expect(result.current.templates[0].id).toMatch(/^template-/);
    });

    it("should save to storage after adding", async () => {
      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addTemplate({ name: "Test", text: "Text", plainText: "Text", metadata: {} });
      });

      // Wait for save effect
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(saveToStorage).toHaveBeenCalled();
    });
  });

  describe("updateTemplate", () => {
    it("should update an existing template", async () => {
      const existingTemplates = [{ id: "template-1", name: "Original", text: "Original text", usageCount: 0 }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingTemplates);

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateTemplate("template-1", { name: "Updated", text: "Updated text" });
      });

      expect(result.current.templates[0].name).toBe("Updated");
      expect(result.current.templates[0].text).toBe("Updated text");
    });

    it("should only update specified fields", async () => {
      const existingTemplates = [{ id: "template-1", name: "Original", text: "Original text", usageCount: 5 }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingTemplates);

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateTemplate("template-1", { name: "New Name" });
      });

      expect(result.current.templates[0].name).toBe("New Name");
      expect(result.current.templates[0].text).toBe("Original text");
      expect(result.current.templates[0].usageCount).toBe(5);
    });

    it("should do nothing if template id not found", async () => {
      const existingTemplates = [{ id: "template-1", name: "Original", text: "Original text", usageCount: 0 }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingTemplates);

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.updateTemplate("non-existent", { name: "Updated" });
      });

      expect(result.current.templates[0].name).toBe("Original");
    });
  });

  describe("deleteTemplate", () => {
    it("should remove a template by id", async () => {
      const existingTemplates = [
        { id: "template-1", name: "Template 1", text: "Text 1", usageCount: 0 },
        { id: "template-2", name: "Template 2", text: "Text 2", usageCount: 0 },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingTemplates);

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.deleteTemplate("template-1");
      });

      expect(result.current.templates).toHaveLength(1);
      expect(result.current.templates[0].id).toBe("template-2");
    });

    it("should do nothing if template id not found", async () => {
      const existingTemplates = [{ id: "template-1", name: "Template 1", text: "Text 1", usageCount: 0 }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingTemplates);

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.deleteTemplate("non-existent");
      });

      expect(result.current.templates).toHaveLength(1);
    });
  });

  describe("incrementUsage", () => {
    it("should increment usage count for a template", async () => {
      const existingTemplates = [{ id: "template-1", name: "Template 1", text: "Text 1", usageCount: 5 }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingTemplates);

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.incrementUsage("template-1");
      });

      expect(result.current.templates[0].usageCount).toBe(6);
    });

    it("should re-sort templates after incrementing usage", async () => {
      const existingTemplates = [
        { id: "template-1", name: "High Usage", text: "Text 1", usageCount: 10 },
        { id: "template-2", name: "Low Usage", text: "Text 2", usageCount: 5 },
      ];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingTemplates);

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Initially, High Usage is first
      expect(result.current.templates[0].name).toBe("High Usage");

      // Increment Low Usage multiple times to surpass High Usage
      act(() => {
        result.current.incrementUsage("template-2");
        result.current.incrementUsage("template-2");
        result.current.incrementUsage("template-2");
        result.current.incrementUsage("template-2");
        result.current.incrementUsage("template-2");
        result.current.incrementUsage("template-2"); // Now at 11
      });

      expect(result.current.templates[0].name).toBe("Low Usage");
      expect(result.current.templates[0].usageCount).toBe(11);
    });

    it("should do nothing if template id not found", async () => {
      const existingTemplates = [{ id: "template-1", name: "Template 1", text: "Text 1", usageCount: 5 }];
      (loadFromStorage as jest.Mock).mockResolvedValue(existingTemplates);

      const { result } = renderHook(() => useTemplates());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.incrementUsage("non-existent");
      });

      expect(result.current.templates[0].usageCount).toBe(5);
    });
  });

  describe("storage integration", () => {
    it("should not save to storage before loading completes", async () => {
      // Create a slow loading promise
      let resolveLoad: (value: unknown[]) => void;
      (loadFromStorage as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLoad = resolve;
          }),
      );

      const { result } = renderHook(() => useTemplates());

      // Wait a bit - save should not be called before loading
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Save should not have been called yet
      expect(saveToStorage).not.toHaveBeenCalled();

      // Complete loading
      await act(async () => {
        resolveLoad!([]);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Add a template AFTER loading completes
      act(() => {
        result.current.addTemplate({ name: "Test", text: "Text", plainText: "Text", metadata: {} });
      });

      // Now saving should happen
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(saveToStorage).toHaveBeenCalled();
    });
  });
});
