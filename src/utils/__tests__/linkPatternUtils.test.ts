/**
 * @jest-environment jsdom
 */
import { processLinkPatternsInHtml } from "../linkPatternUtils";
import { LinkPattern, getLinkPatternId } from "@/types/linkPattern";
import { getColor } from "@/types/types";

describe("linkPatternUtils", () => {
  describe("processLinkPatternsInHtml", () => {
    const createLinkPattern = (prefix: string, urlTemplate: string, color?: string): LinkPattern => ({
      id: getLinkPatternId(`link-${prefix}`),
      prefix,
      urlTemplate,
      description: `Link pattern for ${prefix}`,
      color: getColor(color || "#3b82f6"),
    });

    describe("injection", () => {
      // These render *after* DOMPurify has run -- processLinkPatternsInHtml is
      // called as processLinkPatternsInHtml(sanitizeHtml(x)) at all five
      // dangerouslySetInnerHTML sites -- so anything this function emits is
      // injected verbatim. Nothing downstream will strip it.

      it("does not let a colour break out of the style attribute", () => {
        const pattern = createLinkPattern("T", "https://example.com/{id}");
        // Settings -> Links takes free text for the colour, with no validation.
        (pattern as { color: string }).color = 'red" onmouseover="alert(1)//';

        const html = processLinkPatternsInHtml("see T12345", [pattern]);

        expect(html).not.toContain("onmouseover");
        const el = document.createElement("div");
        el.innerHTML = html;
        expect(el.querySelector("a")?.getAttribute("onmouseover")).toBeNull();
      });

      it("falls back to the default colour when the value is not a colour", () => {
        const pattern = createLinkPattern("T", "https://example.com/{id}");
        (pattern as { color: string }).color = "url(javascript:alert(1))";

        const html = processLinkPatternsInHtml("see T12345", [pattern]);
        expect(html).toContain("color: #3b82f6;");
      });

      it("keeps a legitimate hex colour", () => {
        const pattern = createLinkPattern("T", "https://example.com/{id}", "#ff6600");
        expect(processLinkPatternsInHtml("see T12345", [pattern])).toContain("color: #ff6600;");
      });

      it("drops a link whose template uses a javascript: scheme", () => {
        const pattern = createLinkPattern("T", "javascript:alert(1)");
        const html = processLinkPatternsInHtml("see T12345", [pattern]);

        expect(html).not.toContain("javascript:");
        const el = document.createElement("div");
        el.innerHTML = html;
        expect(el.querySelector("a")).toBeNull();
      });

      it("leaves the surrounding text intact when a link is dropped", () => {
        const pattern = createLinkPattern("T", "javascript:alert(1)");
        expect(processLinkPatternsInHtml("see T12345 now", [pattern])).toContain("see");
      });

      it("survives a prefix containing regex metacharacters", () => {
        const pattern = createLinkPattern("[", "https://example.com/{id}");
        // An unescaped "[" throws SyntaxError: Unterminated character class,
        // which would take down the render of every todo.
        expect(() => processLinkPatternsInHtml("see [12345", [pattern])).not.toThrow();
      });
    });

    it("should return empty string as-is", () => {
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}")];
      expect(processLinkPatternsInHtml("", patterns)).toBe("");
    });

    it("should return html as-is when no patterns provided", () => {
      const html = "Check out T12345 for details";
      expect(processLinkPatternsInHtml(html, [])).toBe(html);
    });

    it("should convert link patterns to clickable links", () => {
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}")];
      const html = "Check T12345 for details";
      const result = processLinkPatternsInHtml(html, patterns);

      expect(result).toContain('href="https://jira.example.com/browse/T-12345"');
      expect(result).toContain(">T12345</a>");
    });

    it("should not process patterns with less than 4 digits", () => {
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}")];
      // T123 has only 3 digits, should not match
      const html = "Check T123 for info";
      const result = processLinkPatternsInHtml(html, patterns);

      expect(result).not.toContain("href=");
      expect(result).toContain("T123");
    });

    it("should handle multiple link patterns", () => {
      const patterns = [
        createLinkPattern("T", "https://jira.example.com/T-{id}"),
        createLinkPattern("D", "https://docs.example.com/D-{id}"),
      ];
      const html = "See T12345 and D54321";
      const result = processLinkPatternsInHtml(html, patterns);

      expect(result).toContain('href="https://jira.example.com/T-12345"');
      expect(result).toContain('href="https://docs.example.com/D-54321"');
    });

    it("should handle patterns with more than 4 digits", () => {
      const patterns = [createLinkPattern("JIRA", "https://jira.example.com/browse/JIRA-{id}")];
      const html = "Issue JIRA123456789";
      const result = processLinkPatternsInHtml(html, patterns);

      expect(result).toContain('href="https://jira.example.com/browse/JIRA-123456789"');
      expect(result).toContain(">JIRA123456789</a>");
    });

    it("should preserve existing HTML formatting", () => {
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}")];
      const html = "<b>Check T12345 for details</b>";
      const result = processLinkPatternsInHtml(html, patterns);

      expect(result).toContain("<b>");
      expect(result).toContain("</b>");
      expect(result).toContain('href="https://jira.example.com/browse/T-12345"');
    });

    it("should not process patterns inside existing anchor tags", () => {
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}")];
      const html = '<a href="https://other.com">T12345</a>';
      const result = processLinkPatternsInHtml(html, patterns);

      // Should not create nested links
      expect(result.match(/<a/g)?.length).toBe(1);
    });

    it("should apply custom color to links", () => {
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}", "#ff0000")];
      const html = "Check T12345";
      const result = processLinkPatternsInHtml(html, patterns);

      expect(result).toContain("color: #ff0000");
    });

    it("should be case insensitive for pattern matching", () => {
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}")];
      const html = "Check t12345 for details";
      const result = processLinkPatternsInHtml(html, patterns);

      expect(result).toContain('href="https://jira.example.com/browse/T-12345"');
    });

    it("should handle multiple occurrences of same pattern", () => {
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}")];
      const html = "Compare T12345 with T67890";
      const result = processLinkPatternsInHtml(html, patterns);

      expect(result).toContain('href="https://jira.example.com/browse/T-12345"');
      expect(result).toContain('href="https://jira.example.com/browse/T-67890"');
    });

    it("should escape special characters in text", () => {
      const patterns = [createLinkPattern("T", "https://jira.example.com/browse/T-{id}")];
      const html = "Check <script>T12345</script> for & details";
      const result = processLinkPatternsInHtml(html, patterns);

      // The HTML should be properly handled
      expect(result).toBeDefined();
    });
  });
});
