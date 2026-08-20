/**
 * Tests for the backup snapshot and retention logic.
 *
 * Regression coverage for three review findings: backups captured only todos
 * and settings (so a restore left cross-key references dangling), backup
 * preferences were read from a key the UI never wrote, and retention had no
 * size or count ceiling despite living in a ~5MB budget.
 */

import {
  buildBackup,
  snapshotAllKeys,
  restoreSnapshot,
  cleanupOldBackups,
  MAX_BACKUP_COUNT,
  BACKUP_KEY_PREFIX,
  BackupData,
} from "@/storage/backup";
import {
  STORAGE_KEYS,
  setStorageAdapter,
  getStorageAdapter,
  StorageAdapter,
} from "@/storage/storage";

class MemoryAdapter implements StorageAdapter {
  data = new Map<string, string>();
  async getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  async setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  async removeItem(key: string) {
    this.data.delete(key);
  }
  async clear() {
    this.data.clear();
  }
  async getAllKeys() {
    return [...this.data.keys()];
  }
}

let adapter: MemoryAdapter;
let original: StorageAdapter;

beforeEach(() => {
  original = getStorageAdapter();
  adapter = new MemoryAdapter();
  setStorageAdapter(adapter);
});
afterEach(() => setStorageAdapter(original));

const seedDataset = async () => {
  await adapter.setItem(STORAGE_KEYS.TODOS, JSON.stringify([{ id: "t1" }]));
  await adapter.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ theme: "dark" }));
  await adapter.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify([{ id: "p1" }]));
  await adapter.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([{ id: "pr1" }]));
  await adapter.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify([{ id: "s1" }]));
};

describe("snapshotAllKeys", () => {
  it("captures every doit- key, not just todos and settings", async () => {
    await seedDataset();
    const snapshot = await snapshotAllKeys();
    expect(Object.keys(snapshot).sort()).toEqual(
      [
        STORAGE_KEYS.PEOPLE,
        STORAGE_KEYS.PROJECTS,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.SPRINTS,
        STORAGE_KEYS.TODOS,
      ].sort()
    );
  });

  it("excludes backups and the backup bookkeeping key", async () => {
    await seedDataset();
    await adapter.setItem(`${BACKUP_KEY_PREFIX}123`, "{}");
    await adapter.setItem(STORAGE_KEYS.BACKUP_SETTINGS, "{}");

    const snapshot = await snapshotAllKeys();

    expect(Object.keys(snapshot)).not.toContain(`${BACKUP_KEY_PREFIX}123`);
    expect(Object.keys(snapshot)).not.toContain(STORAGE_KEYS.BACKUP_SETTINGS);
  });
});

describe("restoreSnapshot", () => {
  it("restores every key the backup captured", async () => {
    await seedDataset();
    const backup = await buildBackup("manual");

    await adapter.clear();
    await restoreSnapshot(backup);

    expect(await adapter.getItem(STORAGE_KEYS.PEOPLE)).toBe(JSON.stringify([{ id: "p1" }]));
    expect(await adapter.getItem(STORAGE_KEYS.SPRINTS)).toBe(JSON.stringify([{ id: "s1" }]));
    expect(await adapter.getItem(STORAGE_KEYS.TODOS)).toBe(JSON.stringify([{ id: "t1" }]));
  });

  it("removes records the backup did not contain, so nothing dangles", async () => {
    await seedDataset();
    const backup = await buildBackup("manual");

    await adapter.setItem(STORAGE_KEYS.NOTES, JSON.stringify([{ id: "n-new" }]));
    await restoreSnapshot(backup);

    expect(await adapter.getItem(STORAGE_KEYS.NOTES)).toBeNull();
  });

  it("falls back to todos+settings for backups written before the keys field", async () => {
    const legacy: BackupData = {
      timestamp: 1,
      date: "2026-01-01T00:00:00.000Z",
      todos: JSON.stringify([{ id: "old" }]),
      settings: JSON.stringify({ theme: "light" }),
      source: "manual",
    };

    await expect(restoreSnapshot(legacy)).resolves.toBe(true);
    expect(await adapter.getItem(STORAGE_KEYS.TODOS)).toBe(JSON.stringify([{ id: "old" }]));
    expect(await adapter.getItem(STORAGE_KEYS.SETTINGS)).toBe(JSON.stringify({ theme: "light" }));
  });
});

describe("cleanupOldBackups", () => {
  const writeBackup = async (timestamp: number) => {
    const backup: BackupData = {
      timestamp,
      date: new Date(timestamp).toISOString(),
      todos: "[]",
      settings: "{}",
      keys: {},
      source: "auto",
    };
    await adapter.setItem(`${BACKUP_KEY_PREFIX}${timestamp}`, JSON.stringify(backup));
  };

  const backupCount = async () =>
    (await adapter.getAllKeys()).filter((k) => k.startsWith(BACKUP_KEY_PREFIX)).length;

  it("caps the number of retained backups even when all are within retention", async () => {
    // Retention alone is not a bound: daily backups with 30-day retention are
    // ~31 full copies of the dataset inside a ~5MB budget.
    await adapter.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ backup: { autoBackupEnabled: true, retentionDays: 365 } })
    );
    const now = Date.now();
    for (let i = 0; i < MAX_BACKUP_COUNT + 5; i++) {
      await writeBackup(now - i * 60_000);
    }

    const deleted = await cleanupOldBackups();

    expect(deleted).toBe(5);
    expect(await backupCount()).toBe(MAX_BACKUP_COUNT);
  });

  it("keeps the newest backups when trimming", async () => {
    await adapter.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ backup: { retentionDays: 365 } })
    );
    const now = Date.now();
    for (let i = 0; i < MAX_BACKUP_COUNT + 2; i++) {
      await writeBackup(now - i * 60_000);
    }

    await cleanupOldBackups();

    expect(await adapter.getItem(`${BACKUP_KEY_PREFIX}${now}`)).not.toBeNull();
    const oldest = now - (MAX_BACKUP_COUNT + 1) * 60_000;
    expect(await adapter.getItem(`${BACKUP_KEY_PREFIX}${oldest}`)).toBeNull();
  });

  it("honours the retention window from settings.backup, where the UI writes it", async () => {
    await adapter.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ backup: { retentionDays: 1 } })
    );
    const now = Date.now();
    await writeBackup(now);
    await writeBackup(now - 5 * 24 * 60 * 60 * 1000);

    const deleted = await cleanupOldBackups();

    expect(deleted).toBe(1);
    expect(await backupCount()).toBe(1);
  });
});
