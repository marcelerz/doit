# Storage Architecture

## Overview

The DoIt app uses a centralized storage abstraction layer with **automatic IndexedDB detection and localStorage fallback**. The system intelligently chooses the best storage mechanism available and handles data migration transparently.

## Automatic Storage Detection

The app automatically:

1. **Detects IndexedDB availability** (including Safari private mode detection)
2. **Falls back to localStorage** if IndexedDB is unavailable
3. **Migrates existing localStorage data** to IndexedDB automatically
4. **Continues using localStorage** if it already has data (until migration)

### Browser Compatibility

Tested and working on:

- ✅ Chrome/Edge (IndexedDB)
- ✅ Firefox (IndexedDB)
- ✅ Safari (IndexedDB, with private mode fallback to localStorage)
- ✅ Safari Private Mode (localStorage fallback)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## How It Works

On app startup (`StorageInitializer` component in `layout.tsx`):

1. Check if IndexedDB is available and functional
2. Check if localStorage has existing app data
3. If IndexedDB works and localStorage has data → migrate to IndexedDB
4. If IndexedDB works and no local data → use IndexedDB
5. If IndexedDB doesn't work → use localStorage

The migration happens automatically and transparently to the user.

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

### Automatic Storage (Recommended)

The app automatically selects and initializes the best storage mechanism. You don't need to do anything - just use the storage helpers:

```typescript
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/utils/storage";

// Load data (async)
const todos = await loadFromStorage(STORAGE_KEYS.TODOS, []);

// Save data (async)
await saveToStorage(STORAGE_KEYS.TODOS, updatedTodos);
```

The storage layer handles IndexedDB or localStorage transparently based on what's available.

### Synchronous Operations (for React state initialization)

For cases where async operations aren't suitable (like useState initializers):

```typescript
import { STORAGE_KEYS, loadFromStorageSync, saveToStorageSync } from "@/utils/storage";

// Synchronous load (only works with localStorage)
const todos = loadFromStorageSync(STORAGE_KEYS.TODOS, []);

// Synchronous save
saveToStorageSync(STORAGE_KEYS.TODOS, updatedTodos);
```

**Note:** Sync methods only work when localStorage is the active adapter. If IndexedDB is active, they will log a warning and return the default value.

### Manual Storage Selection (Advanced)

If you need to manually control which storage mechanism to use:

```typescript
import { setStorageAdapter, createIndexedDBAdapter } from "@/utils/storage";

// Force use of IndexedDB
const indexedDBAdapter = createIndexedDBAdapter();
setStorageAdapter(indexedDBAdapter);

// Or force use of localStorage
import { LocalStorageAdapter } from "@/utils/storage";
setStorageAdapter(new LocalStorageAdapter());
```

**Caution:** Manual selection bypasses automatic detection and migration. Use the automatic system unless you have a specific reason not to.

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

1. **Automatic Detection**: No configuration needed - works out of the box
2. **Browser Compatibility**: Works on all major browsers including Safari
3. **Graceful Fallback**: Falls back to localStorage if IndexedDB is unavailable
4. **Transparent Migration**: Automatically migrates localStorage data to IndexedDB
5. **Flexibility**: Can still manually control storage mechanism if needed
6. **Testability**: Can inject mock adapters for testing
7. **Consistency**: All storage operations go through one interface
8. **Type Safety**: TypeScript ensures correct usage
9. **Centralization**: All storage keys in one place
10. **Future-proof**: Easy to add new storage mechanisms (API, etc.)

## Data Migration

### Automatic Migration

The system automatically handles migration from localStorage to IndexedDB:

1. On first load, checks if IndexedDB is available
2. If localStorage has data and IndexedDB works, migrates all data
3. Sets a migration flag to prevent re-migration
4. Original localStorage data remains intact (can be manually cleared)

### Manual Migration

If you need to manually trigger migration:

```typescript
import { initializeStorage } from "@/utils/storageInit";

const result = await initializeStorage();
console.log("Using IndexedDB:", result.usingIndexedDB);
console.log("Data migrated:", result.migrated);
```

The `initializeStorage()` function returns:

- `adapter`: The active storage adapter
- `usingIndexedDB`: Boolean indicating if IndexedDB is being used
- `migrated`: Boolean indicating if data was migrated from localStorage

## Implementation Details

### Safari Private Mode Handling

Safari blocks IndexedDB in private mode. The system:

1. Tests IndexedDB with a temporary database
2. Uses a 1-second timeout to detect blocked operations
3. Falls back to localStorage if test fails
4. Logs appropriate messages to console

### Storage Detection Test

The detection process:

```typescript
// Opens a test database
const request = indexedDB.open("doit-test-db", 1);

// If successful, IndexedDB is available
request.onsuccess = () => {
  // Clean up test database immediately
  indexedDB.deleteDatabase("doit-test-db");
  // Proceed with IndexedDB
};

// If failed or timeout, fall back to localStorage
request.onerror = () => {
  // Use localStorage
};
```

### Migration Process

1. Check all STORAGE_KEYS for data in localStorage
2. Copy each key-value pair to IndexedDB
3. Set migration flag: `doit-migrated-to-indexeddb = "true"`
4. Original localStorage data remains for safety
5. Future loads use IndexedDB

## Performance Considerations

- **localStorage**: ~5-10MB limit, synchronous, fast for small data
- **IndexedDB**: 50MB-1GB+ capacity, asynchronous, better for large datasets
- **Auto-selection**: Uses IndexedDB by default for better capacity
- **Migration**: One-time cost on first load with IndexedDB available

### Check Current Storage

Open browser console and look for initialization messages:

```text
✓ Using IndexedDB for storage
✓ Data migrated from localStorage
```

Or:

```text
✓ Using localStorage for storage
```

### Force Reset

To clear all data and reset storage:

```typescript
import { clearAllStorage } from "@/utils/storage";

// Clear all app data
await clearAllStorage();

// Then reload the page
window.location.reload();
```

### View Storage Contents

**For localStorage:**

```javascript
// In browser console
console.log(localStorage);
```

**For IndexedDB:**

1. Open DevTools → Application/Storage tab
2. Navigate to IndexedDB → doit-db → keyvalue
3. View all stored keys and values

## Error Handling

All storage operations include try-catch blocks and log errors to console. Failed operations return default values rather than throwing exceptions, ensuring the app remains functional even if storage fails.
