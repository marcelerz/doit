/**
 * The one mock of "@/storage/storage" for suites that replace the module.
 *
 * Use it from a jest.mock factory:
 *
 *   jest.mock("@/storage/storage", () =>
 *     jest.requireActual("@/__tests__/helpers/storageMock").mockStorageModule(),
 *   );
 *
 * It differs from the hand-written factories it replaced in two ways that
 * matter:
 *
 * - STORAGE_KEYS is the real registry, so a renamed or added key cannot leave
 *   a suite testing against a string the app no longer uses.
 * - saveToStorage resolves `true`, as the real function does on success.
 *   Resolving `undefined` made every caller that checks the result take its
 *   failure path, so the code after a successful save never ran under test.
 */

type StorageModule = typeof import("@/storage/storage");

export interface StorageMockOptions {
  /** Test-only keys, added to the real registry. */
  extraKeys?: Record<string, string>;
  /** Members that replace a default or add one the suite needs. */
  overrides?: Record<string, unknown>;
}

export function mockStorageModule(options: StorageMockOptions = {}): Record<string, unknown> {
  const actual = jest.requireActual<StorageModule>("@/storage/storage");
  return {
    STORAGE_KEYS: { ...actual.STORAGE_KEYS, ...options.extraKeys },
    loadFromStorage: jest.fn().mockResolvedValue([]),
    saveToStorage: jest.fn().mockResolvedValue(true),
    waitForStorageInit: jest.fn().mockResolvedValue(undefined),
    ...options.overrides,
  };
}
