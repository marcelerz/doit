"use client";

import { useEffect } from "react";
import { initializeStorageClient } from "@/storage/storage";

/**
 * Storage initializer component
 * Runs once on app startup to detect and configure storage
 */
export default function StorageInitializer() {
  useEffect(() => {
    // Initialize storage when the app loads
    initializeStorageClient();
  }, []);

  // This component doesn't render anything
  return null;
}
