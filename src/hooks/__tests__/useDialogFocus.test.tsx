/**
 * @jest-environment jsdom
 */

/**
 * The dialog semantics the two full-screen focus views were missing.
 *
 * Commit 72 gave the shared Modal a focus trap; the focus views render their
 * own surface as a sibling of the whole app and got none of it, so a keyboard
 * user could tab straight out of a running timer into the view behind. These
 * cover the trap itself and the two guards that stop the views from eating the
 * keys their own buttons need.
 */

import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { useDialogFocus, isTypingTarget, isActivationTarget } from "../useDialogFocus";

// The trap skips hidden controls via offsetParent, which jsdom leaves null for
// everything because it does no layout. Without this the trap would look like
// it had nothing to trap, and these tests would pass against a broken filter.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetParent", {
    configurable: true,
    get() {
      return this.parentElement;
    },
  });
});

function Dialog({ open = true, extra = false }: { open?: boolean; extra?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(open, ref);
  return (
    <div>
      <button>outside</button>
      {open && (
        <div ref={ref} role="dialog" aria-modal="true" aria-label="Timer">
          <button>first</button>
          {extra && <button>middle</button>}
          <button>last</button>
        </div>
      )}
    </div>
  );
}

describe("useDialogFocus", () => {
  it("moves focus to the first control inside the dialog", () => {
    render(<Dialog />);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "first" }));
  });

  it("leaves focus alone while closed", () => {
    render(<Dialog open={false} />);
    expect(document.activeElement).not.toBe(screen.getByRole("button", { name: "outside" }));
  });

  it("returns focus where it came from when the dialog closes", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();

    const { rerender } = render(<Dialog open />);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "first" }));

    rerender(<Dialog open={false} />);
    expect(document.activeElement).toBe(outside);

    outside.remove();
  });

  it("wraps Tab from the last control back to the first", () => {
    render(<Dialog extra />);
    const first = screen.getByRole("button", { name: "first" });
    const last = screen.getByRole("button", { name: "last" });
    last.focus();

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it("wraps Shift+Tab from the first control back to the last", () => {
    render(<Dialog extra />);
    const first = screen.getByRole("button", { name: "first" });
    const last = screen.getByRole("button", { name: "last" });
    first.focus();

    const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it("leaves Tab alone in the middle of the dialog", () => {
    render(<Dialog extra />);
    screen.getByRole("button", { name: "middle" }).focus();

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    // The browser's own Tab order is correct here; only the edges need help.
    expect(event.defaultPrevented).toBe(false);
  });

  it("ignores keys other than Tab", () => {
    render(<Dialog />);
    const event = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("stops trapping once closed", () => {
    const { rerender } = render(<Dialog extra />);
    rerender(<Dialog open={false} extra />);

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});

describe("isTypingTarget", () => {
  it.each([
    ["input", () => document.createElement("input")],
    ["textarea", () => document.createElement("textarea")],
    ["select", () => document.createElement("select")],
  ])("claims a %s", (_label, make) => {
    expect(isTypingTarget(make())).toBe(true);
  });

  it("claims a contenteditable element", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    // jsdom does not derive isContentEditable from the attribute.
    Object.defineProperty(div, "isContentEditable", { value: true });
    expect(isTypingTarget(div)).toBe(true);
  });

  it("claims a node inside a rich text editor", () => {
    const host = document.createElement("div");
    host.setAttribute("contenteditable", "true");
    const inner = document.createElement("span");
    host.appendChild(inner);
    expect(isTypingTarget(inner)).toBe(true);
  });

  it("does not claim a button", () => {
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
  });

  it("does not claim a non-element target", () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(document)).toBe(false);
  });
});

describe("isActivationTarget", () => {
  it("claims a button, because Space and Enter press it", () => {
    expect(isActivationTarget(document.createElement("button"))).toBe(true);
  });

  it("claims the icon inside a button", () => {
    // The real case: the timer's Close button wraps an svg, and the event
    // target is whatever was clicked or focused within it.
    const button = document.createElement("button");
    const icon = document.createElement("span");
    button.appendChild(icon);
    expect(isActivationTarget(icon)).toBe(true);
  });

  it("claims a link and an element with the button role", () => {
    const link = document.createElement("a");
    link.setAttribute("href", "#x");
    const fake = document.createElement("div");
    fake.setAttribute("role", "button");
    expect(isActivationTarget(link)).toBe(true);
    expect(isActivationTarget(fake)).toBe(true);
  });

  it("does not claim a plain div, so the timer still owns Space there", () => {
    expect(isActivationTarget(document.createElement("div"))).toBe(false);
  });

  it("does not claim a non-element target", () => {
    expect(isActivationTarget(null)).toBe(false);
  });
});
