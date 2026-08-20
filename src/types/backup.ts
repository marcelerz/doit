/**
 * Backup settings.
 *
 * These live here rather than in `storage/backup` because `types/settings`
 * needs `defaultBackupSettings` as a runtime value. Importing it from the
 * storage layer inverted the dependency graph: every module that imports
 * `@/types/settings` pulled the storage adapter in with it.
 */
export interface BackupSettings {
  autoBackupEnabled: boolean;
  retentionDays: number;
  lastBackupDate: string | null; // ISO date string (YYYY-MM-DD)
}

export const defaultBackupSettings: BackupSettings = {
  autoBackupEnabled: true,
  retentionDays: 30,
  lastBackupDate: null,
};
