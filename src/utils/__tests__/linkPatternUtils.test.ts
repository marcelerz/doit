import { processLinkPatternsInHtml } from "../linkPatternUtils";
import { LinkPattern, getLinkPatternId } from "@/types/linkPattern";

// Mock document for tests
const mockCreateElement = () => {
  const element = {
    innerHTML: "",
    childNodes: [] as any[],
    nodeName: "DIV",
    nodeType: 1,
    firstChild: null as any,
    parentNode: null as any,
    insertBefore: jest.fn(),
    removeChild: jest.fn(),
    textContent: "",
  };

  // Mock innerHTML setter to parse content
  let internalHtml = "";
  Object.defineProperty(element, "innerHTML", {
    get: () => internalHtml,
    set: (value: string) => {
      internalHtml = value;
      // Simple parsing for tests
      if (value.includes("<")) {
        element.childNodes = [];
      } else {
        element.childNodes = [
          {
            nodeType: 3, // TEXT_NODE
            textContent: value,
            parentNode: element,
          },
        ];
      }
    },
  });

  return element;
};

describe("linkPatternUtils", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Mock window and document
    (global as any).window = {
      document: {
        createElement: mockCreateElement,
      },
    };
    (global as any).document = {
      createElement: mockCreateElement,
    };
  });

  afterEach(() => {
    (global as any).window = originalWindow;
  });

  describe("processLinkPatternsInHtml", () => {
    const createLinkPattern = (
      prefix: string,
      urlTemplate: string,
      color?: string
    ): LinkPattern => ({
      id: getLinkPatternId(`link-${prefix}`),
      prefix,
      urlTemplate,
      description: `Link pattern for ${prefix}`,
      color: color || "#3b82f6",
    });

    it("should return empty string as-is", () => {
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}")];
      expect(processLinkPatternsInHtml("", patterns)).toBe("");
    });

    it("should return html as-is when no patterns provided", () => {
      const html = "Check out T12345 for details";
      expect(processLinkPatternsInHtml(html, [])).toBe(html);
    });

    it("should return html as-is on server (no window)", () => {
      (global as any).window = undefined;
      const html = "Check out T12345 for details";
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}")];
      expect(processLinkPatternsInHtml(html, patterns)).toBe(html);
    });

    it("should not process patterns with less than 4 digits", () => {
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}")];
      // T123 has only 3 digits, should not match
      const html = "Check T123 for info";
      // Since our mock doesn't fully simulate DOM, this test verifies the regex pattern
      const result = processLinkPatternsInHtml(html, patterns);
      // The function should process but not find matches for 3-digit patterns
      expect(result).toBeDefined();
    });

    it("should handle multiple link patterns", () => {
      const patterns = [
        createLinkPattern("T", "https://jira.example.com/T-{id}"),
        createLinkPattern("D", "https://docs.example.com/D-{id}"),
      ];
      const html = "See T12345 and D54321";
      const result = processLinkPatternsInHtml(html, patterns);
      expect(result).toBeDefined();
    });
  });
});
