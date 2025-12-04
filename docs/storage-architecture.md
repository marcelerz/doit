# Storage Architecture

## Overview

The DoIt app uses a centralized storage abstraction layer that makes it easy to swap between different storage mechanisms (localStorage, IndexedDB, API, etc.) without changing application code.

## Architecture

### Storage Adapter Interface

```typescript
interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
  clear?(): Promise<void> | void;
  getAllKeys?(): Promise<string[]> | string[];
}
```

### Available Adapters

1. **LocalStorageAdapter** (default) - Uses browser's localStorage
2. **IndexedDBAdapter** - Uses IndexedDB for larger storage capacity

### Storage Keys Registry

All storage keys are centralized in `STORAGE_KEYS`:

- `TODOS` - "doit-todos"
- `PEOPLE` - "doit-people"
- `PROJECTS` - "doit-projects"
- `SETTINGS` - "doit-settings"
- `VERSION` - "doit-version"
- `VIEW_PRESETS` - "doit-view-presets"
- `VIEW_OPTIONS` - "doit-view-options"
- `BACKUP_SETTINGS` - "doit-backup-settings"

## Usage

### Using the Default Storage

The app uses localStorage by default. All data operations go through the storage layer:

```typescript
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/utils/storage";

// Load data (async)
const todos = await loadFromStorage(STORAGE_KEYS.TODOS, []);

// Save data (async)
await saveToStorage(STORAGE_KEYS.TODOS, updatedTodos);
```

### Synchronous Operations (for React state initialization)

For cases where async operations aren't suitable (like useState initializers):

```typescript
import { STORAGE_KEYS, loadFromStorageSync, saveToStorageSync } from "@/utils/storage";

// Synchronous load (only works with localStorage)
const todos = loadFromStorageSync(STORAGE_KEYS.TODOS, []);

// Synchronous save
saveToStorageSync(STORAGE_KEYS.TODOS, updatedTodos);
```

### Switching to IndexedDB

To switch the entire app to use IndexedDB:

```typescript
import { setStorageAdapter, createIndexedDBAdapter } from "@/utils/storage";

// Switch to IndexedDB
const indexedDBAdapter = createIndexedDBAdapter();
setStorageAdapter(indexedDBAdapter);
```

This can be done at app startup (in `layout.tsx` or `page.tsx`) based on user preference or data size.

### Custom Storage Adapter

You can create custom adapters for any storage mechanism:

```typescript
class APIStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    const response = await fetch(`/api/storage/${key}`);
    return response.ok ? await response.text() : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    await fetch(`/api/storage/${key}`, {
      method: "PUT",
      body: value,
    });
  }

  async removeItem(key: string): Promise<void> {
    await fetch(`/api/storage/${key}`, { method: "DELETE" });
  }
}

// Use it
setStorageAdapter(new APIStorageAdapter());
```

## Benefits

1. **Flexibility**: Easy to switch storage mechanisms
2. **Testability**: Can inject mock adapters for testing
3. **Consistency**: All storage operations go through one interface
4. **Type Safety**: TypeScript ensures correct usage
5. **Centralization**: All storage keys in one place
6. **Future-proof**: Easy to add new storage mechanisms

## Migration Path

If you need to migrate from localStorage to IndexedDB:

1. Read all data from localStorage
2. Switch adapter to IndexedDB
3. Write all data to IndexedDB
4. Clear localStorage (optional)

```typescript
import { STORAGE_KEYS, getStorageAdapter, setStorageAdapter, createIndexedDBAdapter } from "@/utils/storage";

async function migrateToIndexedDB() {
  const oldAdapter = getStorageAdapter(); // localStorage

  // Read all data
  const data: Record<string, string> = {};
  for (const key of Object.values(STORAGE_KEYS)) {
    const value = oldAdapter.getItem(key);
    if (value) data[key] = typeof value === "string" ? value : await value;
  }

  // Switch to IndexedDB
  const newAdapter = createIndexedDBAdapter();
  setStorageAdapter(newAdapter);

  // Write all data
  for (const [key, value] of Object.entries(data)) {
    await newAdapter.setItem(key, value);
  }
}
```

## Performance Considerations

- **localStorage**: ~5-10MB limit, synchronous, fast for small data
- **IndexedDB**: Much larger capacity, asynchronous, better for large datasets
- **Trade-off**: Use localStorage for simplicity, IndexedDB for capacity

## Error Handling

All storage operations include try-catch blocks and log errors to console. Failed operations return default values rather than throwing exceptions, ensuring the app remains functional even if storage fails.
