/**
 * Backup settings type definitions
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
