import { useState, useCallback } from "react";

export type DropdownId = string | null;

export function useDropdownManager() {
  const [activeDropdown, setActiveDropdown] = useState<DropdownId>(null);

  const openDropdown = useCallback((id: string) => {
    setActiveDropdown(id);
  }, []);

  const closeDropdown = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  const toggleDropdown = useCallback((id: string) => {
    setActiveDropdown((current) => (current === id ? null : id));
  }, []);

  const isOpen = useCallback(
    (id: string) => {
      return activeDropdown === id;
    },
    [activeDropdown],
  );

  return {
    activeDropdown,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    isOpen,
  };
}
