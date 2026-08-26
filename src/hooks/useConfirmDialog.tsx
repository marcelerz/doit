"use client";

import { useState, useCallback } from "react";
import { ConfirmDialog } from "@/components/shared/Notification";

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
}

/**
 * Hook for managing confirm dialog state and rendering
 */
export function useConfirmDialog() {
  const [dialog, setDialog] = useState<ConfirmDialogOptions | null>(null);

  const showConfirmDialog = useCallback((options: ConfirmDialogOptions) => {
    setDialog(options);
  }, []);

  const hideConfirmDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const ConfirmDialogComponent = dialog ? (
    <ConfirmDialog
      title={dialog.title}
      message={dialog.message}
      confirmText={dialog.confirmText}
      // Was accepted in the options and then never passed on, so any caller
      // customising the cancel label silently got the default.
      cancelText={dialog.cancelText}
      confirmVariant={dialog.confirmVariant}
      onConfirm={async () => {
        await dialog.onConfirm();
        setDialog(null);
      }}
      onCancel={hideConfirmDialog}
    />
  ) : null;

  return {
    showConfirmDialog,
    hideConfirmDialog,
    ConfirmDialogComponent,
  };
}
