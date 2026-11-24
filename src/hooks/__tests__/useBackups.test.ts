/**
 * @jest-environment jsdom
 */

/**
 * Characterisation tests for useBackups: they pin what the hook gets right
 * today. Known defects are it.todo entries that name their backlog unit, and
 * no assertion here pins one of them.
 */

import { setImmediate } from "timers";
import { renderHook, act } from "@testing-library/react";
import { useBackups, getBackupSize, BackupData } from "../useBackups";
import { BACKUP_KEY_PREFIX, STORAGE_KEYS, setStorageAdapter, getStorageAdapter } from "@/storage/storage";
import type { StorageAdapter } from "@/storage/storage";
import { formatDateKey } from "@/utils/dateUtils";

// The real useSettings returns a new updateBackupSettings on every render, and
// the hook's load effect depends on it, so the list would reload without end
// (U0044). One object with one mutator keeps the effect to one run per mount.
const mockUpdateBackupSettings = jest.fn();
const mockSettingsState = {
  settings: { backup: { autoBackupEnabled: true, retentionDays: 30, lastBackupDate: null as string | null } },
  isLoaded: true,
  updateBackupSettings: mockUpdateBackupSettings,
};
jest.mock("@/hooks/useSettings", () => ({ useSettings: () => mockSettingsState }));

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

// Local wall-clock times, so each falls on the same calendar day in every time zone.
const at = (day: number) => new Date(2026, 4, day, 10, 0, 0).getTime();
const NOW = at(15);

let adapter: MemoryAdapter;
let original: StorageAdapter;
const urlMethods = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };

beforeEach(() => {
  original = getStorageAdapter();
  adapter = new MemoryAdapter();
  setStorageAdapter(adapter);
  mockSettingsState.isLoaded = true;
  mockSettingsState.settings.backup.lastBackupDate = null;
  mockUpdateBackupSettings.mockClear();
  // Kept real: jsdom's FileReader finishes on setImmediate, and settle() waits on Node's (jsdom has no global one).
  jest.useFakeTimers({ doNotFake: ["setImmediate"] });
  jest.setSystemTime(NOW);
});
afterEach(() => {
  setStorageAdapter(original);
  Object.assign(URL, urlMethods);
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const makeBackup = (timestamp: number, overrides: Partial<BackupData> = {}): BackupData => {
  const date = new Date(timestamp).toISOString();
  return { timestamp, date, todos: "[]", settings: "{}", source: "manual", ...overrides };
};
const keyOf = (timestamp: number) => `${BACKUP_KEY_PREFIX}${timestamp}`;
const seed = (...backups: BackupData[]) =>
  backups.forEach((backup) => adapter.data.set(keyOf(backup.timestamp), JSON.stringify(backup)));
const storedBackupKeys = () => [...adapter.data.keys()].filter((key) => key.startsWith(BACKUP_KEY_PREFIX));
const storedBackup = (timestamp: number): BackupData => JSON.parse(adapter.data.get(keyOf(timestamp)) as string);

// Storage reads are promise chains. One real macrotask inside act lets them
// finish and lets React apply the state they produce.
const settle = () => act(() => new Promise<void>((resolve) => setImmediate(resolve)));
const mount = async () => {
  const view = renderHook(() => useBackups());
  await settle();
  return view;
};

// Runs a hook action to its end. `busy` is sampled while the action is still
// pending, the only moment isCreating and isImporting are meant to be true.
const run = async <T>(action: () => Promise<T>, busy: () => boolean = () => false) => {
  let pending: Promise<T> | undefined;
  act(() => {
    pending = action();
  });
  const busyMeanwhile = busy();
  return { outcome: await act(async () => pending), busyMeanwhile };
};

// jsdom has neither URL method. Both are stubbed here and taken away again in afterEach.
const captureDownloads = () => {
  const captured = { blobs: [] as Blob[], names: [] as string[], revoke: jest.fn() };
  URL.createObjectURL = (source: Blob | MediaSource) => {
    if (source instanceof Blob) captured.blobs.push(source);
    return "blob:backup";
  };
  URL.revokeObjectURL = captured.revoke;
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    captured.names.push(this.download);
  });
  return captured;
};
const readBlob = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });

describe("backup list", () => {
  it("lists the stored backups newest first", async () => {
    const [oldest, middle, newest] = [makeBackup(at(12)), makeBackup(at(13)), makeBackup(at(14))];
    seed(middle, newest, oldest);

    const { result } = await mount();

    expect(result.current.backups).toEqual([newest, middle, oldest]);
  });

  it("lists only entries that parse and carry a positive timestamp", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    seed(makeBackup(at(14)), makeBackup(0), makeBackup(-5));
    adapter.data.set(keyOf(at(13)), "{not json");
    adapter.data.set(`${BACKUP_KEY_PREFIX}undated`, JSON.stringify({ date: "2026-05-13", todos: "[]" }));
    // doit-backup-settings shares the backup prefix without being a backup.
    adapter.data.set(STORAGE_KEYS.BACKUP_SETTINGS, JSON.stringify({ lastBackupDate: "2026-05-14" }));
    adapter.data.set(STORAGE_KEYS.TODOS, JSON.stringify(makeBackup(at(12))));

    const { result } = await mount();

    expect(result.current.backups).toEqual([makeBackup(at(14))]);
    expect(warn.mock.calls).toEqual([[expect.any(String), expect.stringContaining(keyOf(at(13))), expect.anything()]]);
  });

  it("lists nothing until settings have loaded", async () => {
    seed(makeBackup(at(14)));
    mockSettingsState.isLoaded = false;

    const { result, rerender } = await mount();
    expect(result.current.backups).toEqual([]);

    mockSettingsState.isLoaded = true;
    rerender();
    await settle();
    expect(result.current.backups).toEqual([makeBackup(at(14))]);
  });

  it.todo("reads the backups once after settings load, however often the host re-renders (U0044)");
  it.todo("lists through backup.ts instead of keeping a private copy of getAllBackups (U0055)");
});

describe("stats", () => {
  // stats holds full ISO instants next to a local day key (see the todo
  // below). Either spelling of a backup's moment is accepted, so these tests
  // pin which backup each field refers to and leave the format open.
  const momentOf = (timestamp: number) => [new Date(timestamp).toISOString(), formatDateKey(new Date(timestamp))];

  it("counts the backups, totals their sizes and finds the oldest, newest and last automatic one", async () => {
    const backups = [
      makeBackup(at(11), { source: "auto", todos: '[{"id":"t1"}]' }),
      makeBackup(at(12), { source: "auto" }),
      makeBackup(at(13), { source: "imported", keys: { [STORAGE_KEYS.TODOS]: "[]" } }),
      makeBackup(at(14)),
    ];
    seed(...backups);

    const { stats } = (await mount()).result.current;

    expect(stats.count).toBe(4);
    expect(stats.totalSize).toBe(backups.reduce((sum, backup) => sum + getBackupSize(backup), 0));
    expect(momentOf(at(11))).toContain(stats.oldestDate);
    expect(momentOf(at(14))).toContain(stats.newestDate);
    expect(momentOf(at(12))).toContain(stats.lastAutoBackupDate);
  });

  it.todo("reports the oldest, newest and last automatic dates in one format (U0824)");
  it.todo("keeps the last automatic backup date in the one place the auto-backup decision reads (U0055)");
});

describe("last backup date in settings", () => {
  // Settings hold the local day of the last automatic backup; it decides
  // whether today's automatic backup is still due.
  const dayOf = (timestamp: number) => formatDateKey(new Date(timestamp));
  const seedAutoBackupsUpTo12th = () =>
    seed(makeBackup(at(11), { source: "auto" }), makeBackup(at(12), { source: "auto" }), makeBackup(at(14)));

  it.each([
    ["no day", null],
    ["an earlier day", dayOf(at(11))],
  ])("sets it to the day of the newest automatic backup when settings hold %s", async (_label, held) => {
    seedAutoBackupsUpTo12th();
    mockSettingsState.settings.backup.lastBackupDate = held;

    await mount();

    expect(mockUpdateBackupSettings.mock.calls).toEqual([[{ lastBackupDate: dayOf(at(12)) }]]);
  });

  it("leaves settings alone when they already hold that day", async () => {
    seedAutoBackupsUpTo12th();
    mockSettingsState.settings.backup.lastBackupDate = dayOf(at(12));

    await mount();

    expect(mockUpdateBackupSettings).not.toHaveBeenCalled();
  });

  it("leaves settings alone when no automatic backup is stored", async () => {
    seed(makeBackup(at(13), { source: "imported" }), makeBackup(at(14)));
    mockSettingsState.settings.backup.lastBackupDate = dayOf(at(11));

    await mount();

    expect(mockUpdateBackupSettings).not.toHaveBeenCalled();
  });
});

describe("getBackupSize", () => {
  // ASCII only, so every figure is the same counted in characters or in UTF-8 bytes.
  it("adds up todos and settings for a backup written before keys existed", () => {
    const legacy = makeBackup(at(14), { todos: '[{"id":"t1"}]', settings: '{"theme":"dark"}' });

    expect(getBackupSize(legacy)).toBe(13 + 16);
  });

  it("grows by the name and the value of each key a backup captured, whatever the key", () => {
    const captured = { [STORAGE_KEYS.TODOS]: "[]" };
    const withPeople = makeBackup(at(14), { keys: { ...captured, [STORAGE_KEYS.PEOPLE]: '["Ada"]' } });

    // A difference, so it holds whether or not the legacy copies are counted as well (U0060).
    const growth = getBackupSize(withPeople) - getBackupSize(makeBackup(at(14), { keys: captured }));
    expect(growth).toBe(STORAGE_KEYS.PEOPLE.length + '["Ada"]'.length);
  });

  it.todo("measures a backup in stored bytes, as Storage does, rather than in UTF-16 characters (U0093)");
  it.todo("counts the todos and settings copies that a backup with keys also carries (U0060)");
});

describe("createBackup and deleteBackup", () => {
  it("createBackup stores a manual snapshot, is creating only meanwhile, and a later mount lists it", async () => {
    adapter.data.set(STORAGE_KEYS.TODOS, '[{"id":"t1"}]');
    adapter.data.set(STORAGE_KEYS.PEOPLE, '["Ada"]');
    const { result, unmount } = await mount();

    const { outcome, busyMeanwhile } = await run(result.current.createBackup, () => result.current.isCreating);

    expect(outcome).toBe(true);
    expect(busyMeanwhile).toBe(true);
    expect(result.current.isCreating).toBe(false);
    expect(storedBackupKeys()).toEqual([keyOf(NOW)]);
    const stored = storedBackup(NOW);
    expect(stored).toMatchObject({ timestamp: NOW, date: new Date(NOW).toISOString(), source: "manual" });
    expect(stored.keys).toEqual({ [STORAGE_KEYS.TODOS]: '[{"id":"t1"}]', [STORAGE_KEYS.PEOPLE]: '["Ada"]' });
    expect(result.current.backups).toEqual([stored]);

    unmount();
    expect((await mount()).result.current.backups).toEqual([stored]);
  });

  it("deleteBackup removes the backup from storage and the list, and the last one empties the stats", async () => {
    seed(makeBackup(at(13)), makeBackup(at(14)));
    const { result } = await mount();

    const { outcome } = await run(() => result.current.deleteBackup(at(13)));

    expect(outcome).toBe(true);
    expect(storedBackupKeys()).toEqual([keyOf(at(14))]);
    expect(result.current.backups).toEqual([makeBackup(at(14))]);

    await run(() => result.current.deleteBackup(at(14)));
    const noDates = { oldestDate: null, newestDate: null, lastAutoBackupDate: null };
    expect(result.current.stats).toEqual({ count: 0, totalSize: 0, ...noDates });
  });
});

describe("importFile", () => {
  const mountAndImport = async (content: string) => {
    const { result } = await mount();
    const file = new File([content], "backup.json", { type: "application/json" });
    return { result, ...(await run(() => result.current.importFile(file), () => result.current.isImporting)) };
  };

  it("stores a valid file under the backup prefix as imported, lists it, and is importing only meanwhile", async () => {
    const file = makeBackup(at(10), { source: "auto", keys: { [STORAGE_KEYS.TODOS]: '[{"id":"t1"}]' } });

    const { result, outcome, busyMeanwhile } = await mountAndImport(JSON.stringify(file));

    const imported = { ...file, source: "imported", uploadedAt: NOW };
    expect(outcome).toEqual({ success: true });
    expect(busyMeanwhile).toBe(true);
    expect(result.current.isImporting).toBe(false);
    expect(storedBackupKeys()).toEqual([keyOf(file.timestamp)]);
    expect(storedBackup(file.timestamp)).toEqual(imported);
    expect(result.current.backups).toEqual([imported]);
  });

  it("reports the validator's reason for a file that is not a backup and stores nothing", async () => {
    // The shape of a todo export: the likeliest wrong file to pick.
    const todoExport = JSON.stringify({ todos: [], exportedAt: "2026-05-15T10:00:00.000Z" });

    const { result, outcome } = await mountAndImport(todoExport);

    expect(outcome).toEqual({ success: false, error: "Backup is missing a valid timestamp" });
    expect(storedBackupKeys()).toEqual([]);
    expect(result.current.backups).toEqual([]);
  });

  it("reports a parse failure for a file that is not JSON and stores nothing", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});

    const { outcome } = await mountAndImport("{not json");

    expect(outcome).toEqual({ success: false, error: "Failed to parse backup file" });
    expect(storedBackupKeys()).toEqual([]);
    expect(error).toHaveBeenCalledTimes(1);
  });

  it.todo("reports a failed write as a storage problem rather than a parse failure (U0042)");
});

describe("file export", () => {
  it("exportBackup downloads the backup as indented JSON named after its day", async () => {
    const backup = makeBackup(at(14), { keys: { [STORAGE_KEYS.TODOS]: "[]" } });
    const { result } = await mount();
    const { blobs, names, revoke } = captureDownloads();

    result.current.exportBackup(backup);

    expect(names).toEqual(["doit-backup-2026-05-14.json"]);
    expect(blobs[0].type).toBe("application/json");
    expect(await readBlob(blobs[0])).toBe(JSON.stringify(backup, null, 2));
    expect(document.querySelector("a")).toBeNull();
    // When the URL is released is an open defect (U0100); that it is released is not.
    jest.advanceTimersByTime(1000);
    expect(revoke.mock.calls).toEqual([["blob:backup"]]);
  });

  it("exportCurrent downloads a snapshot of the current data without adding a backup", async () => {
    adapter.data.set(STORAGE_KEYS.TODOS, '[{"id":"t1"}]');
    const { result } = await mount();
    const { blobs, names } = captureDownloads();

    await run(result.current.exportCurrent);

    expect(names).toEqual(["doit-backup-2026-05-15.json"]);
    const snapshot = { timestamp: NOW, source: "manual", keys: { [STORAGE_KEYS.TODOS]: '[{"id":"t1"}]' } };
    expect(JSON.parse(await readBlob(blobs[0]))).toMatchObject(snapshot);
    expect(storedBackupKeys()).toEqual([]);
  });

  it.todo("keeps the object URL alive until the download has started, as downloadFile does (U0100)");
});

it("updateSettings passes its change, and resetToDefaults the defaults, to the settings mutator", async () => {
  const { result } = await mount();

  result.current.updateSettings({ retentionDays: 7 });
  result.current.resetToDefaults();

  const defaults = { autoBackupEnabled: true, retentionDays: 30 };
  expect(mockUpdateBackupSettings.mock.calls).toEqual([[{ retentionDays: 7 }], [defaults]]);
});
