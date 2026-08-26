# Project Reference Auto-Detection

## Overview

The app now automatically detects project references in text when they appear with specific context words, without requiring the `%` marker. Projects are recognized when mentioned with patterns like "on <project>", "in <project>", or "<project> project".

## How It Works

### Detection Algorithm

The `detectMentionedProjects()` function in `src/utils/autoDetection.ts`:

1. **Builds a searchable project map** from all projects and their alternatives
2. **Filters out common words** using a blacklist (e.g., "work", "project", "time")
3. **Sorts names by length** (longest first) to match "Website Redesign" before "Website"
4. **Matches context patterns** - requires specific words around the project name
5. **Prevents overlaps** by tracking already-matched ranges
6. **Returns canonical names** even when alternatives are matched

### Context Patterns

Projects are only detected when they appear with these context words:

#### Prefix Patterns (context before project name)

- **"on <project>"** - e.g., "working on Website Redesign"
- **"in <project>"** - e.g., "issue in Marketing Campaign"
- **"for <project>"** - e.g., "meeting for API Development"
- **"on project <project>"** - e.g., "focus on project Website"
- **"in project <project>"** - e.g., "task in project Backend"
- **"for project <project>"** - e.g., "creating docs for project API"

#### Suffix Patterns (context after project name)

- **"<project> project"** - e.g., "Website Redesign project is ready"
- **"<alternative> project"** - e.g., "Marketing project needs review"

### Blacklist

Common words are blacklisted to prevent false positives:

- Pronouns: me, it, this, that, these, those
- Time words: time, day, week, month, year
- Meta words: work, project, projects

### Priority Rules

When detecting projects, the system follows these priorities:

1. **Explicit % markers take precedence**: Always override auto-detection
2. **Dates take precedence**: Auto-detected dates prevent project detection at the same location
3. **People take precedence**: Auto-detected people mentions prevent project detection
4. **Longest match wins**: "Website Redesign" is detected before "Website"
5. **Context required**: Standalone project names without context words are NOT detected
6. **No overlaps**: Each position in text is only matched once

## Features

### Automatic Detection with Context

✅ **"on" pattern**

```
"Working on Website Redesign next week"
→ Detects: Website Redesign (project)
```

✅ **"in" pattern**

```
"Task in Marketing Campaign needs review"
→ Detects: Marketing Campaign (project)
```

✅ **"for" pattern**

```
"Creating docs for API Development"
→ Detects: API Development (project)
```

✅ **"on project" pattern**

```
"Need to work on project Website Redesign"
→ Detects: Website Redesign (project)
```

✅ **"project" suffix**

```
"The Website Redesign project is on track"
→ Detects: Website Redesign (project)
```

✅ **Alternative names work**

```
Project: "Marketing Campaign" with alternative "Marketing"
Input: "Focus on Marketing this week"
→ Detects: Marketing Campaign (project) - via alternative
```

✅ **Multiple projects**

```
"Working on Website and in Marketing Campaign"
→ Detects: Website Redesign, Marketing Campaign (both projects)
```

✅ **Case insensitive**

```
"working on WEBSITE REDESIGN"
→ Detects: Website Redesign (project)
```

### Smart Filtering

❌ **Requires context words** - Prevents false positives

```
"Website is looking good" - NOT detected (no context word)
"The project needs work" - NOT detected (no specific project name)
```

❌ **Avoids conflicts with explicit markers**

```
"%Website and in Marketing"
→ %Website = project (explicit)
→ Marketing = NOT detected (different mechanism)
```

❌ **Avoids conflicts with dates**

```
"Meeting on Monday in room 5"
→ "Monday" is detected as date, not as project name
```

❌ **Avoids conflicts with people**

```
"Talk to Marcel on the website"
→ "Marcel" is detected as person mention
→ "website" context is consumed, project not detected
```

### Visual Highlighting

Mentioned projects are highlighted with:

- **Custom color**: Uses the project's custom color if set
- **Fallback color**: Uses `markerColors.project` (purple) if no custom color
- **Same styling**: Appears as a badge, just like `%` markers
- **Full context included**: Shows "on Website Redesign" not just "Website Redesign"

## Usage Examples

### Simple Project Reference

```
Input: "Working on Website Redesign tomorrow"
Result: projects: ["Website Redesign"]
```

### Multiple Projects

```
Input: "Tasks in Marketing and on API Development"
Result: projects: ["Marketing Campaign", "API Development"]
```

### Mixed with Explicit Markers

```
Input: "Focus on Website and %Backend tasks"
Result:
  - projects: ["Website Redesign"] (auto-detected)
  - projects: ["Backend"] (explicit % marker)
```

### Using Alternatives

```
Input: "Meeting for project Marketing next week"
Project: "Marketing Campaign" (alternative: "Marketing")
Result: projects: ["Marketing Campaign"]
Note: Alternatives resolve to canonical names
```

### With People and Dates

```
Input: "Marcel will work on Website tomorrow"
Result:
  - mentionedPeople: ["Marcel"]
  - projects: ["Website Redesign"]
  - dueDate: "tomorrow"
All auto-detected without markers!
```

## Implementation Details

### Token Flow

1. **SmartInput** detects projects in input text with context patterns
2. Creates `TokenMatch` with `type: "project"` and `isAutoDetected: true`
3. **tokenParser** converts tokens to `projects` array
4. **MarkedText** displays project references with highlighting

### Settings Preservation

The `markerColors.project` setting is preserved and still used for:

- Fallback color when project has no custom color
- Settings UI display
- Filter button colors

## Context Pattern Details

### Why Context is Required

Unlike people (who are typically proper nouns), project names often use common words like "Website", "Marketing", "API", etc. Requiring context words prevents false positives:

- **Without context**: "Website is down" would incorrectly detect "Website Redesign"
- **With context**: "Working on Website" correctly detects "Website Redesign"

### Pattern Priority

When multiple patterns could match, the order is:

1. **Most specific first**: "on project Website" (includes "project" keyword)
2. **Then simple**: "on Website"
3. **Then suffix**: "Website project"

### Why These Patterns?

The patterns are based on common natural language usage:

- "working **on** Project X" - most common for tasks
- "issue **in** Project X" - common for bug reports
- "meeting **for** Project X" - common for planning
- "Project X **project**" - common when discussing the project itself

## Edge Cases

### Ambiguous Project Names

```
Projects: "Website", "Marketing"
Input: "Working on Website in Marketing"
→ Detects: Website (first match wins)
```

Note: The second project is not detected because the text range overlaps.

### Project Name Contains Context Word

```
Project: "Work Planning"
Input: "Task for Work Planning"
→ Detects: Work Planning (works correctly)
```

### Multiple Context Words

```
Input: "Focus on project Website for Marketing"
→ Detects: Website Redesign (first pattern match)
→ "for Marketing" is consumed by first match, second project not detected
```

### Common Words as Project Names

If a project is named "Work" or "Time" (blacklisted words), it won't be auto-detected.
Solution: Use explicit `%Work` or `%Time` markers, or rename the project.

## Comparison with Person Detection

| Feature              | Person Detection       | Project Detection            |
| -------------------- | ---------------------- | ---------------------------- |
| **Marker**           | @ (assigned), $ (src)  | % (explicit)                 |
| **Context required** | No                     | Yes (on/in/for/project)      |
| **Reason**           | Names are proper nouns | Names are often common words |
| **Blacklist**        | Common pronouns/words  | Common words                 |
| **Patterns**         | Whole word match       | Context + word match         |
| **Priority**         | After dates            | After dates and people       |

## Migration Notes

- **No migration required** - Existing data continues to work
- **Backward compatible** - Explicit `%` markers continue to work
- **New capability** - Projects can now be referenced naturally with context
- **Settings preserved** - `markerColors.project` still exists and works
- **Documentation updated** - copilot-instructions.md reflects new behavior

## Benefits

1. **More natural writing** - "working on Website" vs. "working on %Website"
2. **Less cognitive load** - Don't need to remember to add % markers
3. **Better readability** - Text reads more naturally
4. **Fewer errors** - No forgetting to add markers
5. **Smart detection** - Context words prevent false positives
6. **Flexible** - Both auto-detection and explicit % markers work

