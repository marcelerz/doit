/**
 * @jest-environment jsdom
 */
import { sanitizeHtml, sanitizeUrl, sanitizeCssColor, escapeHtmlAttribute, isHtmlEmpty } from "../sanitize";

describe("sanitizeHtml", () => {
  it("strips script tags", () => {
    expect(sanitizeHtml('<p>hi</p><script>alert(1)</script>')).not.toContain("script");
  });

  it("strips inline event handlers", () => {
    expect(sanitizeHtml('<p onclick="alert(1)">hi</p>')).not.toContain("onclick");
  });

  it("keeps div, which contentEditable emits for line breaks", () => {
    // The Comments copy of this function omitted "div", so comments silently
    // lost their line structure while the editor that produced them kept it.
    expect(sanitizeHtml("<div>line</div>")).toContain("div");
  });

  it("keeps the rich-text elements the editor produces", () => {
    const html = "<ul><li><b>a</b></li></ul><blockquote>q</blockquote><code>c</code>";
    const clean = sanitizeHtml(html);
    for (const tag of ["ul", "li", "b", "blockquote", "code"]) {
      expect(clean).toContain(tag);
    }
  });
});

describe("sanitizeUrl", () => {
  it("rejects dangerous schemes", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,x", "vbscript:x", "file:///etc/passwd"]) {
      expect(sanitizeUrl(url)).toBeNull();
    }
  });

  it("allows the safe schemes", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
    expect(sanitizeUrl("mailto:a@b.c")).toBe("mailto:a@b.c");
  });

  it("assumes https when no scheme is given", () => {
    expect(sanitizeUrl("example.com")).toBe("https://example.com");
  });

  it("rejects empty input", () => {
    expect(sanitizeUrl("")).toBeNull();
    expect(sanitizeUrl("   ")).toBeNull();
  });
});

describe("sanitizeCssColor", () => {
  it("accepts hex in each supported length", () => {
    for (const c of ["#fff", "#ffff", "#ff6600", "#ff6600aa"]) {
      expect(sanitizeCssColor(c)).toBe(c);
    }
  });

  it("accepts a colour keyword", () => {
    expect(sanitizeCssColor("rebeccapurple")).toBe("rebeccapurple");
  });

  it("rejects a value that would break out of the style attribute", () => {
    expect(sanitizeCssColor('red" onmouseover="alert(1)//')).toBeNull();
  });

  it("rejects css functions, which can carry a url", () => {
    expect(sanitizeCssColor("url(javascript:alert(1))")).toBeNull();
    expect(sanitizeCssColor("rgb(0,0,0);background:red")).toBeNull();
  });

  it("rejects an absent or empty colour", () => {
    expect(sanitizeCssColor(undefined)).toBeNull();
    expect(sanitizeCssColor("")).toBeNull();
  });
});

describe("escapeHtmlAttribute", () => {
  it("escapes a quote that would close the attribute", () => {
    expect(escapeHtmlAttribute('https://x" onmouseover="alert(1)')).not.toContain('"');
  });

  it("escapes angle brackets and ampersands", () => {
    expect(escapeHtmlAttribute("<&>")).toBe("&lt;&amp;&gt;");
  });

  it("escapes the ampersand first, so escapes are not double-encoded", () => {
    expect(escapeHtmlAttribute('&"')).toBe("&amp;&quot;");
  });

  it("leaves an ordinary url untouched", () => {
    expect(escapeHtmlAttribute("https://example.com/a?b=1")).toBe("https://example.com/a?b=1");
  });
});

describe("isHtmlEmpty", () => {
  it("treats markup with no text as empty", () => {
    expect(isHtmlEmpty("<p><br></p>")).toBe(true);
    expect(isHtmlEmpty("   ")).toBe(true);
  });

  it("treats real content as non-empty", () => {
    expect(isHtmlEmpty("<p>hi</p>")).toBe(false);
  });
});
