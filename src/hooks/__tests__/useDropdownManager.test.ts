/**
 * @jest-environment jsdom
 */

/**
 * Tests for useDropdownManager hook
 */

import { renderHook, act } from "@testing-library/react";
import { useDropdownManager } from "@/hooks/useDropdownManager";

describe("useDropdownManager", () => {
  describe("initial state", () => {
    it("should start with no active dropdown", () => {
      const { result } = renderHook(() => useDropdownManager());
      expect(result.current.activeDropdown).toBeNull();
    });
  });

  describe("openDropdown", () => {
    it("should set the active dropdown", () => {
      const { result } = renderHook(() => useDropdownManager());

      act(() => {
        result.current.openDropdown("menu1");
      });

      expect(result.current.activeDropdown).toBe("menu1");
    });

    it("should replace the previous dropdown", () => {
      const { result } = renderHook(() => useDropdownManager());

      act(() => {
        result.current.openDropdown("menu1");
      });

      act(() => {
        result.current.openDropdown("menu2");
      });

      expect(result.current.activeDropdown).toBe("menu2");
    });
  });

  describe("closeDropdown", () => {
    it("should clear the active dropdown", () => {
      const { result } = renderHook(() => useDropdownManager());

      act(() => {
        result.current.openDropdown("menu1");
      });

      act(() => {
        result.current.closeDropdown();
      });

      expect(result.current.activeDropdown).toBeNull();
    });
  });

  describe("toggleDropdown", () => {
    it("should open a closed dropdown", () => {
      const { result } = renderHook(() => useDropdownManager());

      act(() => {
        result.current.toggleDropdown("menu1");
      });

      expect(result.current.activeDropdown).toBe("menu1");
    });

    it("should close an open dropdown", () => {
      const { result } = renderHook(() => useDropdownManager());

      act(() => {
        result.current.openDropdown("menu1");
      });

      act(() => {
        result.current.toggleDropdown("menu1");
      });

      expect(result.current.activeDropdown).toBeNull();
    });

    it("should switch to a different dropdown", () => {
      const { result } = renderHook(() => useDropdownManager());

      act(() => {
        result.current.openDropdown("menu1");
      });

      act(() => {
        result.current.toggleDropdown("menu2");
      });

      expect(result.current.activeDropdown).toBe("menu2");
    });
  });

  describe("isOpen", () => {
    it("should return true for the active dropdown", () => {
      const { result } = renderHook(() => useDropdownManager());

      act(() => {
        result.current.openDropdown("menu1");
      });

      expect(result.current.isOpen("menu1")).toBe(true);
    });

    it("should return false for inactive dropdowns", () => {
      const { result } = renderHook(() => useDropdownManager());

      act(() => {
        result.current.openDropdown("menu1");
      });

      expect(result.current.isOpen("menu2")).toBe(false);
    });

    it("should return false when no dropdown is open", () => {
      const { result } = renderHook(() => useDropdownManager());
      expect(result.current.isOpen("menu1")).toBe(false);
    });
  });
});
