interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  full: "max-w-full",
};

/**
 * Reusable modal/overlay wrapper component
 */
export function Modal({ isOpen, onClose, children, maxWidth = "3xl" }: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    // Blur the active element first to trigger any pending onBlur handlers
    // (e.g., RichTextEditor saving content before modal closes)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Small delay to allow blur handlers to complete
    setTimeout(() => {
      onClose();
    }, 0);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white dark:bg-zinc-900 rounded-xl shadow-2xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
