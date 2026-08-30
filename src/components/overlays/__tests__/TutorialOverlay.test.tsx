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

import { render, screen, fireEvent } from "@testing-library/react";
import { TutorialOverlay } from "../TutorialOverlay";

describe("TutorialOverlay", () => {
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
});
