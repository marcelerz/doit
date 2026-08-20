/**
 * @jest-environment jsdom
 */

/**
 * Tests for useKeyboardNavigation hook
 */

import { renderHook, act } from "@testing-library/react";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

describe("useKeyboardNavigation", () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();

  const createKeyEvent = (key: string): React.KeyboardEvent =>
    ({
      key,
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with selectedIndex at 0", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          onSelect: mockOnSelect,
          onClose: mockOnClose,
        }),
      );

      expect(result.current.selectedIndex).toBe(0);
    });
  });

  describe("ArrowDown key", () => {
    it("should increment selectedIndex", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          onSelect: mockOnSelect,
          onClose: mockOnClose,
        }),
      );

      const event = createKeyEvent("ArrowDown");

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedIndex).toBe(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should wrap around to 0 at the end of the list", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 3,
          onSelect: mockOnSelect,
          onClose: mockOnClose,
        }),
      );

      // Go to index 2
      act(() => {
        result.current.setSelectedIndex(2);
      });

      // Press ArrowDown, should wrap to 0
      act(() => {
        result.current.handleKeyDown(createKeyEvent("ArrowDown"));
      });

      expect(result.current.selectedIndex).toBe(0);
    });
  });

  describe("ArrowUp key", () => {
    it("should decrement selectedIndex", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          onSelect: mockOnSelect,
          onClose: mockOnClose,
        }),
      );

      act(() => {
        result.current.setSelectedIndex(2);
      });

      const event = createKeyEvent("ArrowUp");

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedIndex).toBe(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should wrap around to the last item from 0", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          onSelect: mockOnSelect,
          onClose: mockOnClose,
        }),
      );

      const event = createKeyEvent("ArrowUp");

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedIndex).toBe(4);
    });
  });

  describe("Enter key", () => {
    it("should call onSelect with the current index", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          onSelect: mockOnSelect,
          onClose: mockOnClose,
        }),
      );

      act(() => {
        result.current.setSelectedIndex(3);
      });

      const event = createKeyEvent("Enter");

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnSelect).toHaveBeenCalledWith(3);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe("Escape key", () => {
    it("should call onClose", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          onSelect: mockOnSelect,
          onClose: mockOnClose,
        }),
      );

      const event = createKeyEvent("Escape");

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnClose).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe("other keys", () => {
    it("should not affect state for unhandled keys", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          onSelect: mockOnSelect,
          onClose: mockOnClose,
        }),
      );

      const event = createKeyEvent("Tab");

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedIndex).toBe(0);
      expect(mockOnSelect).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("resetIndex", () => {
    it("should reset selectedIndex to 0", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          onSelect: mockOnSelect,
          onClose: mockOnClose,
        }),
      );

      act(() => {
        result.current.setSelectedIndex(3);
      });

      expect(result.current.selectedIndex).toBe(3);

      act(() => {
        result.current.resetIndex();
      });

      expect(result.current.selectedIndex).toBe(0);
    });
  });

  describe("setSelectedIndex", () => {
    it("should allow direct setting of the index", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          onSelect: mockOnSelect,
          onClose: mockOnClose,
        }),
      );

      act(() => {
        result.current.setSelectedIndex(4);
      });

      expect(result.current.selectedIndex).toBe(4);
    });
  });
});
