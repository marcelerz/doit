/**
 * Test script for auto-detection of mentioned people
 * Run with: node test-person-detection.js
 */

// Mock person data
const availablePeople = [
  {
    id: "1",
    name: "Marcel",
    alternatives: ["Marcel Erzberg", "Erzberg"],
    comments: [],
    activity: [],
  },
  {
    id: "2",
    name: "John",
    alternatives: ["Johnny", "John Doe"],
    comments: [],
    activity: [],
  },
  {
    id: "3",
    name: "Sarah",
    alternatives: ["Sarah Smith", "SS"],
    comments: [],
    activity: [],
  },
];

// Simplified version of detectMentionedPeople for testing
function detectMentionedPeople(text, people) {
  console.log("\n👥 Starting person detection");
  console.log("📝 Input text:", text);

  const results = [];

  // Blacklist common English words
  const blacklist = new Set([
    "me",
    "i",
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "up",
    "about",
    "into",
    "through",
    "s",
    "t",
  ]);

  // Build name map (lowercase -> canonical)
  const nameMap = new Map();
  for (const person of people) {
    const lowerName = person.name.toLowerCase();
    if (!blacklist.has(lowerName)) {
      nameMap.set(lowerName, person.name);
    }

    for (const alt of person.alternatives) {
      const lowerAlt = alt.toLowerCase();
      if (!blacklist.has(lowerAlt)) {
        nameMap.set(lowerAlt, person.name);
      }
    }
  }

  console.log(`📋 Searchable names: ${Array.from(nameMap.keys()).join(", ")}`);

  // Sort by length (longest first)
  const sortedNames = Array.from(nameMap.keys()).sort((a, b) => b.length - a.length);

  // Track processed ranges
  const processedRanges = [];

  for (const lowerName of sortedNames) {
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedName}\\b`, "gi");

    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      // Check for overlaps
      const overlaps = processedRanges.some((range) => !(end <= range.start || start >= range.end));

      if (!overlaps) {
        const canonicalName = nameMap.get(lowerName);
        console.log(`  ✅ Found "${match[0]}" at ${start}-${end} → ${canonicalName}`);

        results.push({
          text: match[0],
          start,
          end,
          personName: canonicalName,
        });

        processedRanges.push({ start, end });
      }
    }
  }

  results.sort((a, b) => a.start - b.start);

  console.log(`\n✅ Found ${results.length} mentioned people`);
  return results;
}

// Test cases
const testCases = [
  {
    name: "Simple name mention",
    text: "Need to talk to Marcel about the project",
    expected: ["Marcel"],
  },
  {
    name: "Alternative name",
    text: "Marcel Erzberg will handle this task",
    expected: ["Marcel"],
  },
  {
    name: "Multiple people",
    text: "Marcel and John need to review this with Sarah",
    expected: ["Marcel", "John", "Sarah"],
  },
  {
    name: "Alternative names",
    text: "Johnny told me that Sarah Smith is available",
    expected: ["John", "Sarah"],
  },
  {
    name: "With explicit markers (should still detect)",
    text: "@Marcel needs to meet with John tomorrow",
    expected: ["Marcel", "John"],
  },
  {
    name: "Abbreviations",
    text: "Erzberg and SS will collaborate on this",
    expected: ["Marcel", "Sarah"],
  },
  {
    name: "Case insensitive",
    text: "MARCEL and sarah are working together",
    expected: ["Marcel", "Sarah"],
  },
  {
    name: "Compound words with hyphens (will detect)",
    text: "This is a marcel-ous idea",
    expected: ["Marcel"], // Note: regex word boundaries treat hyphen as boundary
  },
];

console.log("🧪 Testing Person Auto-Detection");
console.log("═".repeat(60));

let passed = 0;
let failed = 0;

for (const test of testCases) {
  console.log("\n" + "─".repeat(60));
  console.log(`📋 Test: ${test.name}`);

  const results = detectMentionedPeople(test.text, availablePeople);
  const detected = results.map((r) => r.personName);

  const success =
    detected.length === test.expected.length && detected.every((name, idx) => name === test.expected[idx]);

  if (success) {
    console.log(`✅ PASSED - Detected: [${detected.join(", ")}]`);
    passed++;
  } else {
    console.log(`❌ FAILED`);
    console.log(`   Expected: [${test.expected.join(", ")}]`);
    console.log(`   Got:      [${detected.join(", ")}]`);
    failed++;
  }
}

console.log("\n" + "═".repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
console.log(passed === testCases.length ? "🎉 All tests passed!" : "⚠️  Some tests failed");
