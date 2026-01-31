"use client";

import { useState, useCallback } from "react";

/**
 * A reusable hook for managing modal state.
 * Replaces repetitive `useState(false)` patterns for modals across the codebase.
 *
 * @template T - Optional type for data associated with the modal (e.g., the item being edited)
 * @returns Object with isOpen state, data, and open/close functions
 *
 * @example
 * // Simple modal without data
 * const addModal = useModalState();
 * <button onClick={() => addModal.open()}>Add Item</button>
 * {addModal.isOpen && <AddModal onClose={addModal.close} />}
 *
 * @example
 * // Modal with associated data (e.g., editing an item)
 * const editModal = useModalState<TodoModel>();
 * <button onClick={() => editModal.open(todo)}>Edit</button>
 * {editModal.isOpen && editModal.data && (
 *   <EditModal todo={editModal.data} onClose={editModal.close} />
 * )}
 *
 * @example
 * // Modal with confirmation data
 * const deleteModal = useModalState<{ id: string; name: string }>();
 * <button onClick={() => deleteModal.open({ id: todo.id, name: todo.text })}>Delete</button>
 * {deleteModal.isOpen && (
 *   <ConfirmDialog
 *     message={`Delete "${deleteModal.data?.name}"?`}
 *     onConfirm={() => handleDelete(deleteModal.data?.id)}
 *     onClose={deleteModal.close}
 *   />
 * )}
 */
export function useModalState<T = void>(): {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Data associated with the modal (null when closed or opened without data) */
  data: T | null;
  /** Open the modal, optionally with associated data */
  open: (data?: T) => void;
  /** Close the modal and clear any associated data */
  close: () => void;
  /** Toggle the modal state (useful for simple modals) */
  toggle: () => void;
} {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((openData?: T) => {
    setData(openData ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        // If closing, also clear data
        setData(null);
      }
      return !prev;
    });
  }, []);

  return { isOpen, data, open, close, toggle };
}

/**
 * A simpler version of useModalState for modals that don't need associated data.
 * Provides a more minimal API when you only need open/close state.
 *
 * @returns Object with isOpen state and open/close/toggle functions
 *
 * @example
 * const { isOpen, open, close } = useSimpleModalState();
 * <button onClick={open}>Show Help</button>
 * {isOpen && <HelpModal onClose={close} />}
 */
export function useSimpleModalState(): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
} {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}

/**
 * Hook for managing multiple modals that are mutually exclusive.
 * Only one modal can be open at a time.
 *
 * @template K - Union type of modal keys (e.g., "add" | "edit" | "delete")
 * @template T - Optional type for data associated with the modals
 * @returns Object with activeModal key, data, and open/close functions
 *
 * @example
 * type ModalType = "add" | "edit" | "delete";
 * const modals = useExclusiveModalState<ModalType, TodoModel>();
 *
 * <button onClick={() => modals.open("add")}>Add</button>
 * <button onClick={() => modals.open("edit", todo)}>Edit</button>
 * <button onClick={() => modals.open("delete", todo)}>Delete</button>
 *
 * {modals.activeModal === "add" && <AddModal onClose={modals.close} />}
 * {modals.activeModal === "edit" && modals.data && (
 *   <EditModal todo={modals.data} onClose={modals.close} />
 * )}
 */
export function useExclusiveModalState<K extends string, T = void>(): {
  /** The currently active modal key, or null if none are open */
  activeModal: K | null;
  /** Data associated with the active modal */
  data: T | null;
  /** Open a specific modal, optionally with associated data */
  open: (modal: K, data?: T) => void;
  /** Close the currently active modal */
  close: () => void;
  /** Check if a specific modal is open */
  isOpen: (modal: K) => boolean;
} {
  const [activeModal, setActiveModal] = useState<K | null>(null);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modal: K, openData?: T) => {
    setData(openData ?? null);
    setActiveModal(modal);
  }, []);

  const close = useCallback(() => {
    setActiveModal(null);
    setData(null);
  }, []);

  const isOpen = useCallback((modal: K) => activeModal === modal, [activeModal]);

  return { activeModal, data, open, close, isOpen };
}
