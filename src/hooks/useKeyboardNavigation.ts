import { useState, useCallback } from "react";

interface UseKeyboardNavigationOptions {
  itemCount: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

/**
 * Hook for managing keyboard navigation in dropdowns/lists
 * Handles Arrow Up, Arrow Down, Enter, and Escape keys
 */
export function useKeyboardNavigation({ itemCount, onSelect, onClose }: UseKeyboardNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % itemCount);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount);
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSelect(selectedIndex);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [itemCount, selectedIndex, onSelect, onClose],
  );

  const resetIndex = useCallback(() => {
    setSelectedIndex(0);
  }, []);

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    resetIndex,
  };
}
