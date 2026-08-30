/**
 * @jest-environment jsdom
 */

/**
 * Tests for how the tutorial is dismissed.
 *
 * Escape used to call a close-only callback, so the dismissal was never
 * persisted and the eleven-step tour reopened on every reload. Every exit now
 * goes through onComplete, which is what writes the preference -- these pin
 * that, and that the "show again" choice on the last step still round-trips.
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import { TutorialOverlay } from "../TutorialOverlay";

describe("TutorialOverlay", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const steps = [
    { id: "one", title: "First", description: "First step" },
    { id: "two", title: "Second", description: "Second step" },
  ];

  it("persists the dismissal when closed with Escape", () => {
    const onComplete = jest.fn();
    render(<TutorialOverlay isOpen={true} onComplete={onComplete} steps={steps} />);

    fireEvent.keyDown(window, { key: "Escape" });

    // false = "do not show again", the same choice the Skip button makes
    expect(onComplete).toHaveBeenCalledWith(false);
  });

  it("persists the dismissal when skipped", () => {
    const onComplete = jest.fn();
    render(<TutorialOverlay isOpen={true} onComplete={onComplete} steps={steps} />);

    fireEvent.click(screen.getByText("Skip tutorial"));

    expect(onComplete).toHaveBeenCalledWith(false);
  });

  it("records the opt-in when the last step asks to be shown again", () => {
    const onComplete = jest.fn();
    render(<TutorialOverlay isOpen={true} onComplete={onComplete} steps={steps} showRememberChoice={true} />);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.click(screen.getByText("Show tutorial on next visit"));

    expect(onComplete).toHaveBeenCalledWith(true);
  });

  it("records the opt-out on the last step", () => {
    const onComplete = jest.fn();
    render(<TutorialOverlay isOpen={true} onComplete={onComplete} steps={steps} showRememberChoice={true} />);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.click(screen.getByText("Got it! Don't show again"));

    expect(onComplete).toHaveBeenCalledWith(false);
  });

  it("does nothing when closed", () => {
    const onComplete = jest.fn();
    render(<TutorialOverlay isOpen={false} onComplete={onComplete} steps={steps} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onComplete).not.toHaveBeenCalled();
  });
  describe("navigation", () => {
    it("advances and goes back through the steps", () => {
      // Three steps, because Back only renders on a step that is not the last.
      const three = [...steps, { id: "three", title: "Third", description: "Third step" }];
      render(<TutorialOverlay isOpen={true} onComplete={jest.fn()} steps={three} />);
      expect(screen.getByText("Step 1 of 3")).toBeTruthy();

      fireEvent.click(screen.getByText(/Next/));
      expect(screen.getByText("Step 2 of 3")).toBeTruthy();

      fireEvent.click(screen.getByText(/Back/));
      expect(screen.getByText("Step 1 of 3")).toBeTruthy();
    });

    it("navigates with the arrow keys", () => {
      render(<TutorialOverlay isOpen={true} onComplete={jest.fn()} steps={steps} />);

      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(screen.getByText("Step 2 of 2")).toBeTruthy();

      fireEvent.keyDown(window, { key: "ArrowLeft" });
      expect(screen.getByText("Step 1 of 2")).toBeTruthy();
    });

    it("does not run past either end", () => {
      render(<TutorialOverlay isOpen={true} onComplete={jest.fn()} steps={steps} />);

      fireEvent.keyDown(window, { key: "ArrowLeft" });
      expect(screen.getByText("Step 1 of 2")).toBeTruthy();

      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(screen.getByText("Step 2 of 2")).toBeTruthy();
    });

    it("restarts at the first step when reopened", () => {
      const { rerender } = render(<TutorialOverlay isOpen={true} onComplete={jest.fn()} steps={steps} />);
      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(screen.getByText("Step 2 of 2")).toBeTruthy();

      rerender(<TutorialOverlay isOpen={false} onComplete={jest.fn()} steps={steps} />);
      rerender(<TutorialOverlay isOpen={true} onComplete={jest.fn()} steps={steps} />);

      expect(screen.getByText("Step 1 of 2")).toBeTruthy();
    });
  });

  describe("spotlight targeting", () => {
    /** jsdom reports every rect as zero, so give the element a real one. */
    const withRect = (el: Element, rect: Partial<DOMRect>) => {
      el.getBoundingClientRect = () =>
        ({ top: 100, left: 100, right: 200, bottom: 150, width: 100, height: 50, x: 100, y: 100, ...rect }) as DOMRect;
    };

    afterEach(() => {
      document.querySelectorAll("[data-tutorial]").forEach((el) => el.remove());
    });

    it("shows the fallback hint when the target is not on the page", () => {
      const missing = [
        {
          id: "one",
          title: "First",
          description: "First step",
          targetSelector: '[data-tutorial="nowhere"]',
          fallbackHint: "Look for the button up top",
        },
      ];
      render(<TutorialOverlay isOpen={true} onComplete={jest.fn()} steps={missing} />);

      act(() => void jest.advanceTimersByTime(400));

      expect(screen.getByText("Look for the button up top")).toBeTruthy();
    });

    it("positions itself against a target that is on the page", () => {
      const target = document.createElement("div");
      target.setAttribute("data-tutorial", "add-button");
      document.body.appendChild(target);
      withRect(target, {});

      const targeted = [
        { id: "one", title: "First", description: "First step", targetSelector: '[data-tutorial="add-button"]' },
      ];
      render(<TutorialOverlay isOpen={true} onComplete={jest.fn()} steps={targeted} />);

      act(() => void jest.advanceTimersByTime(400));

      // no fallback hint, because the target resolved
      expect(screen.queryByText(/Look for/)).toBeNull();
      expect(screen.getByText("First step")).toBeTruthy();
    });

    it.each(["top", "bottom", "left", "right", "center"] as const)(
      "places the tooltip for position=%s",
      (position) => {
        const target = document.createElement("div");
        target.setAttribute("data-tutorial", "add-button");
        document.body.appendChild(target);
        withRect(target, {});

        const targeted = [
          {
            id: "one",
            title: "First",
            description: "First step",
            targetSelector: '[data-tutorial="add-button"]',
            position,
          },
        ];
        render(<TutorialOverlay isOpen={true} onComplete={jest.fn()} steps={targeted} />);

        act(() => void jest.advanceTimersByTime(400));

        expect(screen.getByText("First step")).toBeTruthy();
      },
    );

    it("repositions when the window resizes", () => {
      const target = document.createElement("div");
      target.setAttribute("data-tutorial", "add-button");
      document.body.appendChild(target);
      withRect(target, {});

      render(
        <TutorialOverlay
          isOpen={true}
          onComplete={jest.fn()}
          steps={[{ id: "one", title: "First", description: "First step", targetSelector: '[data-tutorial="add-button"]' }]}
        />,
      );
      act(() => void jest.advanceTimersByTime(400));

      act(() => {
        window.dispatchEvent(new Event("resize"));
        jest.advanceTimersByTime(400);
      });

      expect(screen.getByText("First step")).toBeTruthy();
    });
  });
});
