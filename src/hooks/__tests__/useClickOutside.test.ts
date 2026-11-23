/**
 * @jest-environment jsdom
 */

/**
 * Tests for useClickOutside: run a handler when a mousedown lands outside the
 * referenced element. Five dropdowns share it and it had no test of its own.
 */

import type { RefObject } from "react";
import { renderHook, fireEvent } from "@testing-library/react";
import { useClickOutside } from "../useClickOutside";

let menu: HTMLDivElement;
let menuItem: HTMLButtonElement;
let elsewhere: HTMLDivElement;

beforeEach(() => {
  menu = document.createElement("div");
  menuItem = menu.appendChild(document.createElement("button"));
  elsewhere = document.createElement("div");
  document.body.replaceChildren(menu, elsewhere);
});

const mount = (ref: RefObject<HTMLElement | null>, enabled?: boolean) => {
  const onOutside = jest.fn();
  const hook = renderHook(() => useClickOutside(ref, onOutside, enabled));
  return { ...hook, onOutside };
};

describe("useClickOutside", () => {
  it("calls the handler for a mousedown outside the element", () => {
    const { onOutside } = mount({ current: menu });

    fireEvent.mouseDown(elsewhere);

    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it("stays quiet for a mousedown on the element or on a child of it", () => {
    const { onOutside } = mount({ current: menu });

    fireEvent.mouseDown(menu);
    fireEvent.mouseDown(menuItem);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it("reacts to mousedown only, not to the mouseup and click that follow it", () => {
    const { onOutside } = mount({ current: menu });

    fireEvent.mouseUp(elsewhere);
    fireEvent.click(elsewhere);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    const { onOutside } = mount({ current: menu }, false);

    fireEvent.mouseDown(elsewhere);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it("removes its listener on unmount", () => {
    const { onOutside, unmount } = mount({ current: menu });

    unmount();
    fireEvent.mouseDown(elsewhere);

    expect(onOutside).not.toHaveBeenCalled();
  });

  it("neither fires nor throws while the ref is empty", () => {
    // A listener's exception never reaches the caller of dispatchEvent; jsdom
    // reports it as an error event on window instead.
    const onError = jest.fn((event: ErrorEvent) => event.preventDefault());
    window.addEventListener("error", onError);
    const { onOutside } = mount({ current: null });

    fireEvent.mouseDown(elsewhere);
    window.removeEventListener("error", onError);

    expect(onOutside).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
