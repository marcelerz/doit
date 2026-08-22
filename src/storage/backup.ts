/**
 * Backup utilities and types
 *
 * Most backup functionality has been moved to useBackups hook for better co-location.
 * This file contains types, constants, and functions needed during app startup (before React hooks are available).
 */

import {
  STORAGE_KEYS,
  STORAGE_KEY_PREFIX,
  getStorageAdapter,
  loadFromStorage,
  saveToStorage,
} from "@/storage/storage";
import { formatDateKey } from "@/utils/dateUtils";
import { BackupSettings, defaultBackupSettings } from "@/types/backup";
import { BACKUP_KEY_PREFIX, INTERNAL_STORAGE_KEYS } from "@/storage/storage";

// ============================================================================
// Types & Constants
// ============================================================================

export type { BackupSettings } from "@/types/backup";
export { defaultBackupSettings } from "@/types/backup";

export interface BackupData {
  timestamp: number;
  date: string; // ISO date string for display
  todos: string; // JSON stringified todos (kept for backups written before `keys`)
  settings: string; // JSON stringified settings (ditto)
  /**
   * Every doit- storage key at the time of the backup.
   *
   * Backups used to capture todos and settings only, so people, projects,
   * sprints, notes, reviews, templates and presets had no safety net, and a
   * restore left todos referencing people and projects it had not rolled back.
   * Absent on backups created before this field existed.
   */
  keys?: Record<string, string>;
  uploadedAt?: number; // Timestamp when this backup was uploaded (if imported)
  source?: "auto" | "manual" | "imported"; // How this backup was created
}

export interface BackupStats {
  count: number;
  totalSize: number;
  oldestDate: string | null;
  newestDate: string | null;
  lastAutoBackupDate: string | null;
}

// ============================================================================
// Startup/Migration Functions
// ============================================================================

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const today = new Date();
  return formatDateKey(today);
}

/**
 * Get backup settings from storage (async)
 */
async function loadBackupSettings(): Promise<BackupSettings> {
  // The UI reads and writes preferences through settings.backup, while this
  // module used to read a separate doit-backup-settings key that nothing in
  // the UI ever wrote - so the auto-backup toggle and retention setting had no
  // effect at all. Preferences now come from settings; the dedicated key keeps
  // only lastBackupDate, which is bookkeeping rather than a user preference.
  const [settings, bookkeeping] = await Promise.all([
    loadFromStorage<{ backup?: Partial<BackupSettings> }>(STORAGE_KEYS.SETTINGS, {}),
    loadFromStorage<Partial<BackupSettings>>(STORAGE_KEYS.BACKUP_SETTINGS, {}),
  ]);

  return {
    ...defaultBackupSettings,
    ...(settings.backup ?? {}),
    lastBackupDate: bookkeeping.lastBackupDate ?? defaultBackupSettings.lastBackupDate,
  };
}

/**
 * Snapshot every doit- key except backups themselves and internal bookkeeping.
 */
/**
 * Validate a parsed backup file before anything is stored or restored.
 *
 * A backup file is untrusted: the user opens whatever they were sent. The
 * previous check tested four fields for truthiness, so a string where a number
 * belonged, or a `keys` map full of objects, passed straight through to the
 * storage adapter.
 *
 * @returns null if the shape is acceptable, otherwise a reason to show
 */
export function validateBackupData(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return "Not a backup file";
  const backup = value as Record<string, unknown>;

  if (typeof backup.timestamp !== "number" || !Number.isFinite(backup.timestamp)) {
    return "Backup is missing a valid timestamp";
  }
  if (typeof backup.date !== "string" || backup.date === "") {
    return "Backup is missing a valid date";
  }
  if (typeof backup.todos !== "string") return "Backup is missing its todos";
  if (typeof backup.settings !== "string") return "Backup is missing its settings";

  if (backup.keys !== undefined) {
    if (typeof backup.keys !== "object" || backup.keys === null || Array.isArray(backup.keys)) {
      return "Backup contains a malformed key set";
    }
    for (const [key, entry] of Object.entries(backup.keys as Record<string, unknown>)) {
      // Reject prototype-polluting keys outright rather than relying on every
      // later consumer to be careful with the parsed object.
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        return "Backup contains an unsafe key";
      }
      if (typeof entry !== "string") return "Backup contains a malformed value";
    }
  }

  return null;
}

/**
 * Whether a storage key is one a backup may capture and restore.
 *
 * Used for the snapshot, for deciding what a restore clears, and -- crucially
 * -- for filtering what a restore is allowed to write. A backup file is
 * untrusted input: it arrives from wherever the user got it.
 *
 * Deliberately a prefix test rather than a list of known keys. snapshotAllKeys
 * captures every doit- key, including ones no registry names yet, so checking
 * against STORAGE_KEYS would silently drop a user's data on restore.
 */
export function isRestorableKey(key: string): boolean {
  return (
    key.startsWith(STORAGE_KEY_PREFIX) &&
    !key.startsWith(BACKUP_KEY_PREFIX) &&
    key !== STORAGE_KEYS.BACKUP_SETTINGS &&
    !INTERNAL_STORAGE_KEYS.has(key)
  );
}

export async function snapshotAllKeys(): Promise<Record<string, string>> {
  const adapter = getStorageAdapter();
  const keys = (await adapter.getAllKeys()).filter(isRestorableKey);

  const snapshot: Record<string, string> = {};
  for (const key of keys) {
    const value = await adapter.getItem(key);
    if (value !== null) snapshot[key] = value;
  }
  return snapshot;
}

/**
 * Restore a backup over current data.
 *
 * Prefers the full `keys` snapshot; falls back to todos+settings for backups
 * written before that field existed.
 */
export async function restoreSnapshot(backup: BackupData): Promise<boolean> {
  try {
    const adapter = getStorageAdapter();

    if (backup.keys && Object.keys(backup.keys).length > 0) {
      // Clear keys the backup does not contain, so restoring cannot leave
      // records behind that the backup never knew about.
      const existing = (await adapter.getAllKeys()).filter(isRestorableKey);
      for (const key of existing) {
        if (!(key in backup.keys)) await adapter.removeItem(key);
      }
      // Filter the writes too. The loop above was already guarded, but this one
      // wrote whatever the file contained, so a crafted backup could set keys
      // outside the doit- namespace entirely -- or overwrite the internal
      // bookkeeping that decides which storage backend is in use.
      for (const [key, value] of Object.entries(backup.keys)) {
        if (!isRestorableKey(key) || typeof value !== "string") continue;
        await adapter.setItem(key, value);
      }
      return true;
    }

    await adapter.setItem(STORAGE_KEYS.TODOS, backup.todos);
    await adapter.setItem(STORAGE_KEYS.SETTINGS, backup.settings);
    return true;
  } catch (error) {
    console.error("Failed to restore backup:", error);
    return false;
  }
}

/**
 * Build a backup of the current data.
 */
export async function buildBackup(source: "auto" | "manual" = "manual"): Promise<BackupData> {
  const adapter = getStorageAdapter();
  const [todosData, settingsData, keys] = await Promise.all([
    adapter.getItem(STORAGE_KEYS.TODOS),
    adapter.getItem(STORAGE_KEYS.SETTINGS),
    snapshotAllKeys(),
  ]);

  const now = new Date();
  return {
    timestamp: now.getTime(),
    date: now.toISOString(),
    todos: normalizeStorageData(todosData, []),
    settings: normalizeStorageData(settingsData, {}),
    keys,
    source,
  };
}

/**
 * Save backup settings to storage (async)
 */
async function saveBackupSettings(settings: BackupSettings): Promise<void> {
  // Only bookkeeping - preferences belong to settings.backup and are owned by
  // the settings UI. Writing them here too would give them two sources again.
  await saveToStorage(STORAGE_KEYS.BACKUP_SETTINGS, {
    lastBackupDate: settings.lastBackupDate,
  });
}

/**
 * Get all backups, sorted by timestamp (newest first)
 */
async function getAllBackups(): Promise<BackupData[]> {
  const backups: BackupData[] = [];

  try {
    const adapter = getStorageAdapter();
    const allKeys = await adapter.getAllKeys();
    const keys = Array.isArray(allKeys) ? allKeys : [];

    for (const key of keys) {
      if (key && key.startsWith(BACKUP_KEY_PREFIX)) {
        const data = await adapter.getItem(key);
        const dataStr = typeof data === "string" ? data : null;
        if (dataStr) {
          try {
            const backup = JSON.parse(dataStr) as BackupData;
            if (backup.timestamp && !isNaN(backup.timestamp) && backup.timestamp > 0) {
              backups.push(backup);
            }
          } catch (error) {
            console.warn(`Failed to parse backup ${key}:`, error);
          }
        }
      }
    }

    backups.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to load backups:", error);
  }

  return backups;
}

/**
 * Normalize storage data to ensure it's a proper JSON string.
 * Handles cases where data might be a string, object, or null.
 */
function normalizeStorageData(data: string | null, defaultValue: unknown): string {
  if (data === null) {
    return JSON.stringify(defaultValue);
  }
  // If it's already a string, verify it's valid JSON and return as-is
  if (typeof data === "string") {
    try {
      JSON.parse(data); // Validate it's proper JSON
      return data;
    } catch {
      // If parsing fails, the string is corrupted or double-encoded
      // Try to fix double-encoding by parsing twice
      try {
        const parsed = JSON.parse(JSON.parse(data));
        return JSON.stringify(parsed);
      } catch {
        // If all else fails, return default
        return JSON.stringify(defaultValue);
      }
    }
  }
  // If it's an object (shouldn't happen but handle just in case)
  return JSON.stringify(data);
}

/**
 * Create a backup of current data (used for auto-backup during startup)
 */
async function createBackup(source: "auto" | "manual" = "manual"): Promise<boolean> {
  try {
    const adapter = getStorageAdapter();
    const backup = await buildBackup(source);
    const now = new Date(backup.timestamp);

    const backupKey = `${BACKUP_KEY_PREFIX}${now.getTime()}`;
    await adapter.setItem(backupKey, JSON.stringify(backup));

    if (source === "auto") {
      const backupSettings = await loadBackupSettings();
      backupSettings.lastBackupDate = getTodayDateString();
      await saveBackupSettings(backupSettings);
    }

    return true;
  } catch (error) {
    console.error("Failed to create backup:", error);
    return false;
  }
}

/**
 * Delete a specific backup
 */
async function deleteBackup(timestamp: number): Promise<boolean> {
  try {
    const adapter = getStorageAdapter();
    const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`;
    await adapter.removeItem(backupKey);
    return true;
  } catch (error) {
    console.error("Failed to delete backup:", error);
    return false;
  }
}

/**
 * Check if a backup should be created today
 */
async function shouldCreateBackupToday(): Promise<boolean> {
  const settings = await loadBackupSettings();
  if (!settings.autoBackupEnabled) {
    return false;
  }

  const today = getTodayDateString();
  return settings.lastBackupDate !== today;
}

/**
 * Auto-backup if needed (called during migration/startup)
 */
export async function autoBackupIfNeeded(): Promise<void> {
  if (await shouldCreateBackupToday()) {
    await createBackup("auto");
  }
}

/**
 * Clean up old backups based on retention policy
 */
/**
 * Hard ceilings on what backups may consume.
 *
 * Retention alone is not a bound: a daily backup of the full dataset with
 * 30-day retention is ~31 copies of everything, inside a localStorage budget
 * of roughly 5MB. Exhausting it makes the *live* writes start failing, so the
 * safety net was capable of causing the data loss it exists to prevent.
 */
export const MAX_BACKUP_COUNT = 10;
export const MAX_BACKUP_TOTAL_BYTES = 2 * 1024 * 1024;

export async function cleanupOldBackups(): Promise<number> {
  const settings = await loadBackupSettings();
  const backups = await getAllBackups(); // newest first
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.retentionDays);
  const cutoffTimestamp = cutoffDate.getTime();

  let deletedCount = 0;
  let keptCount = 0;
  let keptBytes = 0;

  for (const backup of backups) {
    const size = JSON.stringify(backup).length;
    const tooOld = backup.timestamp < cutoffTimestamp;
    const tooMany = keptCount >= MAX_BACKUP_COUNT;
    const tooBig = keptBytes + size > MAX_BACKUP_TOTAL_BYTES && keptCount > 0;

    if (tooOld || tooMany || tooBig) {
      if (await deleteBackup(backup.timestamp)) {
        deletedCount++;
      }
      continue;
    }

    keptCount++;
    keptBytes += size;
  }

  return deletedCount;
}
