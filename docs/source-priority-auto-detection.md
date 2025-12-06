# Source Person and Priority Auto-Detection

This document describes how source people and priorities are automatically detected in todo text without requiring explicit markers.

## Source Person Auto-Detection

### Overview

The system automatically detects source people (where information came from) using context patterns. No need for the `$` marker, though it still works.

### Supported Patterns

The following context patterns are recognized:

1. **"from <person name>"**

   - Example: "Review document from Marcel"
   - Detects: Marcel as source

2. **"via <person name>"**

   - Example: "Received feedback via John Doe"
   - Detects: John Doe as source

3. **"per <person name>"**

   - Example: "Update per Sarah on project status"
   - Detects: Sarah as source

4. **"source <person name>"**
   - Example: "Information source Johnny"
   - Detects: Johnny (John Doe alternative) as source

### How It Works

- **Context Required**: Unlike mentioned people, source detection requires context words ("from", "via", "per", "source")
- **Alternative Names**: All person alternatives are recognized (e.g., "Marc", "M" for Marcel)
- **Blacklist Protection**: Common words like "me", "i", "the" are filtered out
- **Overlap Prevention**: Explicit `$` markers take precedence over auto-detection
- **Color Highlighting**: Uses person's custom color or falls back to marker color

### Examples

```
✅ "Email from Marcel about the deadline"
   → Source: Marcel

✅ "Got feedback via JD on the design"
   → Source: John Doe (via alternative "JD")

✅ "Report per Sarah for next week"
   → Source: Sarah

❌ "Marcel reviewed the code"
   → No source detected (no context pattern)

❌ "Message from me about updates"
   → No source detected ("me" is blacklisted)
```

### Integration

The detection happens automatically in:

- **SmartInput**: Highlights source people with colored background during input
- **MarkedText**: Displays source people in completed todos
- **TodoDetailsOverlay**: Shows detected sources in the "Source" section

## Priority Auto-Detection

### Overview

The system automatically detects priorities in todo text without requiring the `!!` marker. Priorities are specific enough to detect standalone or with context.

### Supported Patterns

1. **Direct Recognition**

   - Example: "This is urgent"
   - Detects: Urgent priority

2. **With "priority" Suffix**

   - Example: "Mark as high priority"
   - Detects: High priority

3. **With "priority" Prefix**
   - Example: "Set priority urgent"
   - Detects: Urgent priority

### How It Works

- **No Context Required**: Priority names are specific enough to detect without additional context
- **Alternative Names**: All priority alternatives are recognized (e.g., "critical", "ASAP" for Urgent)
- **Case Insensitive**: Works with any capitalization (URGENT, urgent, Urgent)
- **Overlap Prevention**: Explicit `!!` markers take precedence over auto-detection
- **Color Highlighting**: Uses priority's custom color or falls back to marker color

### Examples

```
✅ "This task is urgent"
   → Priority: Urgent

✅ "Mark as high priority for today"
   → Priority: High

✅ "Set priority critical for this issue"
   → Priority: Urgent (via alternative "critical")

✅ "ASAP needed for deployment"
   → Priority: Urgent (via alternative "ASAP")

✅ "This is important and medium priority"
   → Priorities: High (via "important"), Medium

❌ "Just a regular task"
   → No priority detected
```

### Default Priorities

The system comes with these default priorities:

- **Urgent** (alternatives: Critical, ASAP)
- **High** (alternatives: Important)
- **Medium** (alternatives: Normal)
- **Low** (alternatives: Minor)

You can customize priorities in Settings > Priorities tab.

### Integration

The detection happens automatically in:

- **SmartInput**: Highlights priorities with colored background during input
- **MarkedText**: Displays priorities in completed todos
- **TodoDetailsOverlay**: Shows detected priorities in the "Priority" section

## Detection Priority

When multiple detection systems overlap, the priority order is:

1. **Dates** (highest priority - auto-detected)
2. **Explicit markers** (@, $, %, !!, #) - assigned/source people, projects, priorities, tags
3. **Auto-detected people** (mentioned)
4. **Auto-detected projects**
5. **Auto-detected sources**
6. **Auto-detected priorities** (lowest priority)

This ensures that explicit markers always take precedence and prevents false positives.

## PlainText Output

### What Gets Removed

When you use auto-detection or explicit markers, the following are **removed from the final todo text**:

- Auto-detected dates, durations, recurring patterns, dependencies
- Explicit markers with values: `!!priority`, `%project`, `#tag`

### What Stays in Text

The following **remain in the todo text**:

- Auto-detected mentioned people
- Auto-detected projects (with context)
- Auto-detected source people (with context)
- Auto-detected priorities
- Explicit @ and $ markers with names

### Example

**Input:**

```
"Marcel needs to review on Website Redesign - urgent priority from John Doe tomorrow"
```

**PlainText Output:**

```
"Marcel needs to review on Website Redesign - urgent priority from John Doe"
```

**Detected Metadata:**

- Mentioned: Marcel
- Projects: Website Redesign
- Priority: Urgent
- Source: John Doe
- Due Date: tomorrow (removed from text)

This behavior allows you to quickly set metadata values without cluttering the todo text, while keeping conversational context for people, projects, sources, and priorities.

## Testing

Run the comprehensive test suite:

```bash
node test-source-priority-detection.js  # Individual tests
node test-all-auto-detection.js         # Integration tests
```

All tests should pass, demonstrating correct detection and overlap handling.
