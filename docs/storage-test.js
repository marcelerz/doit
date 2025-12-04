/**
 * Storage System Test Script
 *
 * Paste this into the browser console to test storage functionality
 */

// Test 1: Check which storage is being used
console.log("=== Storage System Test ===");
console.log("\nTest 1: Current Storage Adapter");

import { getStorageAdapter } from "@/utils/storage";
const adapter = getStorageAdapter();
console.log("Adapter type:", adapter.constructor.name);

// Test 2: Test storage operations
console.log("\nTest 2: Storage Operations");

import { STORAGE_KEYS, saveToStorage, loadFromStorage } from "@/utils/storage";

const testData = { test: "Hello from DoIt", timestamp: Date.now() };
await saveToStorage("test-key", testData);
console.log("Saved test data:", testData);

const loaded = await loadFromStorage("test-key", {});
console.log("Loaded test data:", loaded);
console.log("Data matches:", JSON.stringify(testData) === JSON.stringify(loaded));

// Test 3: Check all app keys
console.log("\nTest 3: App Storage Keys");

for (const [name, key] of Object.entries(STORAGE_KEYS)) {
  const data = await loadFromStorage(key, null);
  const hasData = data !== null;
  console.log(`${name} (${key}):`, hasData ? "Has data" : "Empty");
}

// Test 4: Storage capacity test
console.log("\nTest 4: Storage Capacity");

try {
  const largeData = "x".repeat(1024 * 1024); // 1MB string
  await saveToStorage("capacity-test", largeData);
  console.log("✓ Can store 1MB");

  const largerData = "x".repeat(10 * 1024 * 1024); // 10MB string
  await saveToStorage("capacity-test-large", largerData);
  console.log("✓ Can store 10MB (IndexedDB likely active)");
} catch (error) {
  console.log("✗ Storage limit reached:", error.message);
}

// Test 5: Migration check
console.log("\nTest 5: Migration Status");

const migrated = await loadFromStorage("doit-migrated-to-indexeddb", false);
console.log("Migration completed:", migrated);

console.log("\n=== Test Complete ===");

/**
 * Quick Manual Tests:
 *
 * 1. Normal Browser:
 *    - Should use IndexedDB
 *    - Should migrate localStorage data if present
 *
 * 2. Safari Private Mode:
 *    - Should use localStorage
 *    - Should show fallback message
 *
 * 3. Check DevTools:
 *    - Application → IndexedDB → doit-db (if using IndexedDB)
 *    - Application → Local Storage (if using localStorage)
 */
