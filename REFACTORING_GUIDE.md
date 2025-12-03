# Refactoring Guide: TodoDetailsOverlay

## Created Reusable Components

1. **`src/utils/colors.ts`** - Color utility functions
2. **`src/utils/suggestions.ts`** - Duration/recurring suggestions
3. **`src/hooks/useKeyboardNavigation.ts`** - Keyboard nav hook
4. **`src/components/shared/Badge.tsx`** - Reusable badge component
5. **`src/components/shared/Modal.tsx`** - Modal wrapper
6. **`src/components/shared/SearchableDropdown.tsx`** - Dropdown with search

## How to Refactor TodoDetailsOverlay

### Step 1: Replace Badge Rendering

**Old Pattern** (370 lines × 5 sections = ~1850 lines):

```tsx
{
  editingMetadata.assignedPeople.map((person) => (
    <button
      key={person}
      onClick={() => {
        handleMetadataChange({
          ...editingMetadata,
          assignedPeople: editingMetadata.assignedPeople.filter((p) => p !== person),
        });
      }}
      className="text-xs px-2 py-1 rounded border bg-blue-100 dark:bg-blue-900/30..."
    >
      @{person} ✕
    </button>
  ));
}
```

**New Pattern** (~5 lines):

```tsx
{
  editingMetadata.assignedPeople.map((person) => (
    <Badge
      key={person}
      variant="blue"
      onRemove={() =>
        handleMetadataChange({
          ...editingMetadata,
          assignedPeople: editingMetadata.assignedPeople.filter((p) => p !== person),
        })
      }
    >
      @{person}
    </Badge>
  ));
}
```

### Step 2: Replace Dropdown Logic

**Old Pattern** (~150 lines per dropdown × 7 = ~1050 lines):

```tsx
const [assignedSearch, setAssignedSearch] = useState("");
const [showAssignedDropdown, setShowAssignedDropdown] = useState(false);
const [assignedSelectedIndex, setAssignedSelectedIndex] = useState(0);

{showAssignedDropdown && (
  <>
    <div className="fixed inset-0 z-10" onClick={...} />
    <div className="absolute z-20...">
      <input
        value={assignedSearch}
        onChange={(e) => { setAssignedSearch(e.target.value); setAssignedSelectedIndex(0); }}
        onKeyDown={(e) => {
          // 80+ lines of keyboard navigation logic
        }}
      />
      <div className="max-h-48 overflow-y-auto">
        {/* 50+ lines of filtered items rendering */}
      </div>
    </div>
  </>
)}
```

**New Pattern** (~10 lines):

```tsx
const [showAssignedDropdown, setShowAssignedDropdown] = useState(false);

{
  showAssignedDropdown && (
    <SearchableDropdown
      items={availablePeople.map((p) => ({ id: p.name, label: p.name, prefix: "@" }))}
      onSelect={(item) => {
        handleMetadataChange({
          ...editingMetadata,
          assignedPeople: [...editingMetadata.assignedPeople, item.label],
        });
        setShowAssignedDropdown(false);
      }}
      onAdd={
        onAddPerson
          ? (name) => {
              onAddPerson(name);
              handleMetadataChange({
                ...editingMetadata,
                assignedPeople: [...editingMetadata.assignedPeople, name],
              });
              setShowAssignedDropdown(false);
            }
          : undefined
      }
      onClose={() => setShowAssignedDropdown(false)}
      placeholder="Search people..."
      highlightColor="blue"
      excludeIds={editingMetadata.assignedPeople}
      emptyMessage="All people already assigned"
    />
  );
}
```

### Step 3: Replace Modal Wrapper

**Old Pattern**:

```tsx
if (!isOpen) return null;

return (
  <div className="fixed inset-0 bg-black/50..." onClick={onClose}>
    <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-3xl..." onClick={(e) => e.stopPropagation()}>
      {/* content */}
    </div>
  </div>
);
```

**New Pattern**:

```tsx
return (
  <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl">
    {/* content */}
  </Modal>
);
```

### Step 4: Remove Duplicate Functions

**Delete these** (already in utils):

```tsx
// DELETE - now in src/utils/suggestions.ts
const getDurationSuggestions = (input: string): string[] => { ... };
const getRecurringSuggestions = (input: string): string[] => { ... };

// DELETE - now in src/utils/colors.ts
const getPersonColor = (name: string) => { ... };
const getProjectColor = (name: string) => { ... };
const getPriorityColor = (priority: string) => { ... };
const getTextColor = (backgroundColor: string) => { ... };
```

## Line Count Reduction

| Component            | Before          | After          | Savings         |
| -------------------- | --------------- | -------------- | --------------- |
| Badges               | ~100 lines      | ~20 lines      | **80 lines**    |
| Dropdown state       | ~170 lines      | ~20 lines      | **150 lines**   |
| Assigned dropdown    | ~150 lines      | ~15 lines      | **135 lines**   |
| Source dropdown      | ~150 lines      | ~15 lines      | **135 lines**   |
| Mentioned dropdown   | ~150 lines      | ~15 lines      | **135 lines**   |
| Project dropdown     | ~150 lines      | ~15 lines      | **135 lines**   |
| Priority dropdown    | ~150 lines      | ~15 lines      | **135 lines**   |
| Duration dropdown    | ~150 lines      | ~15 lines      | **135 lines**   |
| Recurring dropdown   | ~150 lines      | ~15 lines      | **135 lines**   |
| Dependency dropdown  | ~150 lines      | ~15 lines      | **135 lines**   |
| Modal wrapper        | ~10 lines       | ~3 lines       | **7 lines**     |
| Suggestion functions | ~60 lines       | 0 lines        | **60 lines**    |
| Color functions      | ~40 lines       | 0 lines        | **40 lines**    |
| **TOTAL**            | **~2000 lines** | **~200 lines** | **~1800 lines** |

## Apply Same Pattern To:

1. **AutoAssignTab** - Has same 7 dropdowns
2. **TodoItem** - Can use Badge component
3. **PersonDetailsOverlay** - Can use Modal wrapper
4. **ProjectDetailsOverlay** - Can use Modal wrapper
5. **TodoListView** - Anywhere with similar patterns

## Files Already Updated

✅ Created: `src/utils/colors.ts`
✅ Created: `src/utils/suggestions.ts`
✅ Created: `src/hooks/useKeyboardNavigation.ts`
✅ Created: `src/components/shared/Badge.tsx`
✅ Created: `src/components/shared/Modal.tsx`
✅ Created: `src/components/shared/SearchableDropdown.tsx`
⚠️ Partially updated: `TodoDetailsOverlay.tsx` (imports added, need full refactor)

## Next Steps

1. Apply Badge component to all metadata badges in TodoDetailsOverlay
2. Replace all 8 dropdown sections with SearchableDropdown
3. Wrap with Modal component
4. Delete duplicate helper functions
5. Apply same pattern to AutoAssignTab
6. Apply Badge to other components
7. Apply Modal to other overlays

This will reduce the codebase by ~2500+ lines while improving maintainability.
