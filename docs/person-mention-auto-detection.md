# Person Mention Auto-Detection

## Overview

The app now automatically detects mentioned people in text without requiring the `^` marker. Person names and their alternatives are recognized as whole words, similar to how dates are auto-detected.

## How It Works

### Detection Algorithm

The `detectMentionedPeople()` function in `src/utils/chronoDateParser.ts`:

1. **Builds a searchable name map** from all people and their alternatives
2. **Filters out common words** using a blacklist (e.g., "me", "i", "the", "and")
3. **Sorts names by length** (longest first) to match "John Doe" before "John"
4. **Uses regex word boundaries** (`\b`) to match whole words only
5. **Prevents overlaps** by tracking already-matched ranges
6. **Returns canonical names** even when alternatives are matched

### Blacklist

Common English words are blacklisted to prevent false positives:

- Pronouns: me, i, he, she, it, we, they, us, them, his, her, its, our, their, my, your
- Articles: a, an, the
- Conjunctions: and, or, but
- Prepositions: in, on, at, to, for, of, with, by, from, up, about, into, through
- Single letters: s, t (common abbreviations that conflict with words)

### Priority Rules

When detecting mentions, the system follows these priorities:

1. **Explicit markers take precedence**: `@` (assigned) and `$` (source) always override auto-detection
2. **Dates take precedence**: Auto-detected dates prevent person detection at the same location
3. **Longest match wins**: "Marcel Erzberg" is detected before "Marcel" or "Erzberg"
4. **No overlaps**: Each position in text is only matched once

## Features

### Automatic Detection

✅ **No marker required** - Just type the person's name

```
"Need to talk to Marcel about the project"
→ Detects: Marcel (mentioned)
```

✅ **Alternative names work** - All alternatives are recognized

```
"Marcel Erzberg will handle this"
→ Detects: Marcel (mentioned) - even though alternative was used
```

✅ **Multiple people** - Detects all mentions in a single text

```
"Marcel and John need to review this with Sarah"
→ Detects: Marcel, John, Sarah (all mentioned)
```

✅ **Case insensitive** - MARCEL, marcel, Marcel all work

```
"MARCEL and sarah are working together"
→ Detects: Marcel, Sarah (mentioned)
```

✅ **Works with abbreviations** - Custom abbreviations are detected

```
"Erzberg and SS will collaborate on this"
→ Detects: Marcel (via "Erzberg"), Sarah (via "SS")
```

### Smart Filtering

❌ **Blocks common words** - Prevents false positives

```
"told me that" - "me" is NOT detected (blacklisted)
"the plan" - "the" is NOT detected (blacklisted)
```

❌ **Avoids conflicts with explicit markers**

```
"@Marcel and John tomorrow"
→ @Marcel = assigned (explicit)
→ John = mentioned (auto-detected)
```

❌ **Avoids conflicts with dates**

```
"Meet tomorrow at 3pm"
→ "tomorrow" is detected as date, not as person name
```

### Visual Highlighting

Mentioned people are highlighted with:

- **Custom color**: Uses the person's custom color if set
- **Fallback color**: Uses `markerColors.mentioned` (yellow/orange) if no custom color
- **Same styling**: Appears as a badge, just like `@` and `$` markers

## Usage Examples

### Simple Mention

```
Input: "Ask Marcel about the budget"
Result: mentionedPeople: ["Marcel"]
```

### Multiple Mentions

```
Input: "Marcel, John, and Sarah need to sync"
Result: mentionedPeople: ["Marcel", "John", "Sarah"]
```

### Mixed with Explicit Markers

```
Input: "@Marcel needs input from John and $Sarah"
Result:
  - assignedPeople: ["Marcel"]
  - sourcePeople: ["Sarah"]
  - mentionedPeople: ["John"]
```

### Using Alternatives

```
Input: "Johnny told me Sarah Smith is available"
Result: mentionedPeople: ["John", "Sarah"]
Note: Alternatives resolve to canonical names
```

## Implementation Details

### Token Flow

1. **SmartInput** detects people in input text
2. Creates `TokenMatch` with `type: "mentioned"` and `isAutoDetected: true`
3. **metadataParser** converts tokens to `mentionedPeople` array
4. **MarkedText** displays mentioned names with highlighting

### Settings Preservation

The `markerColors.mentioned` setting is preserved and still used for:

- Fallback color when person has no custom color
- Settings UI display
- Filter button colors

## Edge Cases

### Compound Words with Hyphens

```
"marcel-ous idea"
→ Detects: Marcel (hyphen acts as word boundary)
```

Note: This is intended behavior - regex `\b` treats hyphens as boundaries.

### Common Words as Names

If a person is named "Me" or "The", they won't be detected (blacklisted).
Solution: Use explicit `@Me` or `$The` markers, or use an alternative name.

### Overlapping Names

```
People: "John", "John Doe"
Input: "Ask John Doe"
→ Detects: "John Doe" (longer match takes priority)
```

## Migration Notes

- **No migration required** - Existing data continues to work
- **Backward compatible** - Explicit `^` markers are no longer generated, but the system still processes "mentioned" tokens
- **Settings preserved** - `markerColors.mentioned` still exists and works
- **Documentation updated** - copilot-instructions.md reflects new behavior

## Benefits

1. **Faster input** - No need to type `^` before names
2. **Natural writing** - Just write normally, system detects mentions
3. **Fewer errors** - No forgetting to add markers
4. **Better UX** - Similar experience to modern chat apps (Discord, Slack)
5. **Smarter detection** - Avoids common words and conflicts

