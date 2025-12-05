/**
 * Test script for auto-detection of mentioned projects
 * Run with: node test-project-detection.js
 */

// Mock project data
const availableProjects = [
  {
    id: "1",
    name: "Website Redesign",
    alternatives: ["Website", "Redesign Project"],
    comments: [],
    activity: [],
  },
  {
    id: "2",
    name: "Marketing Campaign",
    alternatives: ["Marketing", "Q4 Campaign"],
    comments: [],
    activity: [],
  },
  {
    id: "3",
    name: "API Development",
    alternatives: ["API", "Backend API"],
    comments: [],
    activity: [],
  },
];

// Simplified version of detectMentionedProjects for testing
function detectMentionedProjects(text, projects) {
  console.log("\n📁 Starting project detection");
  console.log("📝 Input text:", text);

  const results = [];

  // Blacklist common words
  const blacklist = new Set([
    "me",
    "it",
    "this",
    "that",
    "these",
    "those",
    "work",
    "time",
    "day",
    "week",
    "month",
    "year",
    "project",
    "projects",
  ]);

  // Build project map (lowercase -> canonical)
  const projectMap = new Map();
  for (const project of projects) {
    const lowerName = project.name.toLowerCase();
    if (!blacklist.has(lowerName)) {
      projectMap.set(lowerName, project.name);
    }

    for (const alt of project.alternatives) {
      const lowerAlt = alt.toLowerCase();
      if (!blacklist.has(lowerAlt)) {
        projectMap.set(lowerAlt, project.name);
      }
    }
  }

  console.log(`📋 Searchable project names: ${Array.from(projectMap.keys()).join(", ")}`);

  // Sort by length (longest first)
  const sortedNames = Array.from(projectMap.keys()).sort((a, b) => b.length - a.length);

  // Track processed ranges
  const processedRanges = [];

  // Context patterns
  const contextPatterns = [
    { pattern: /\b(?:on|in|for)\s+project\s+/gi, prefix: true },
    { pattern: /\b(?:on|in|for)\s+/gi, prefix: true },
    { pattern: /\s+project\b/gi, prefix: false },
  ];

  for (const lowerName of sortedNames) {
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    for (const { pattern, prefix } of contextPatterns) {
      let contextRegex;

      if (prefix) {
        contextRegex = new RegExp(`(${pattern.source})${escapedName}\\b`, "gi");
      } else {
        contextRegex = new RegExp(`\\b${escapedName}(${pattern.source})`, "gi");
      }

      let match;
      while ((match = contextRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const start = match.index;
        const end = start + fullMatch.length;

        // Check for overlaps
        const overlaps = processedRanges.some((range) => !(end <= range.start || start >= range.end));

        if (!overlaps) {
          const canonicalName = projectMap.get(lowerName);
          console.log(`  ✅ Found "${fullMatch}" at ${start}-${end} → ${canonicalName}`);

          results.push({
            text: fullMatch,
            start,
            end,
            projectName: canonicalName,
          });

          processedRanges.push({ start, end });
        }
      }
    }
  }

  results.sort((a, b) => a.start - b.start);

  console.log(`\n✅ Found ${results.length} mentioned projects`);
  return results;
}

// Test cases
const testCases = [
  {
    name: "Simple 'on project' pattern",
    text: "Need to work on project Website Redesign tomorrow",
    expected: ["Website Redesign"],
  },
  {
    name: "Simple 'on' pattern",
    text: "Working on Website Redesign next week",
    expected: ["Website Redesign"],
  },
  {
    name: "Simple 'in' pattern",
    text: "Task in Marketing Campaign needs review",
    expected: ["Marketing Campaign"],
  },
  {
    name: "Simple 'for' pattern",
    text: "Creating docs for API Development",
    expected: ["API Development"],
  },
  {
    name: "'project' suffix pattern",
    text: "The Website Redesign project is on track",
    expected: ["Website Redesign"],
  },
  {
    name: "Alternative name with 'on'",
    text: "Need to focus on Marketing this week",
    expected: ["Marketing Campaign"],
  },
  {
    name: "Multiple projects",
    text: "Working on Website and in Marketing Campaign",
    expected: ["Website Redesign", "Marketing Campaign"],
  },
  {
    name: "'for project' pattern",
    text: "Meeting scheduled for project API Development",
    expected: ["API Development"],
  },
  {
    name: "Case insensitive",
    text: "working on WEBSITE REDESIGN and in marketing campaign",
    expected: ["Website Redesign", "Marketing Campaign"],
  },
  {
    name: "No false positives without context",
    text: "Website is looking good",
    expected: [],
  },
  {
    name: "Alternative with 'project' suffix",
    text: "The Marketing project needs attention",
    expected: ["Marketing Campaign"],
  },
];

console.log("🧪 Testing Project Auto-Detection");
console.log("═".repeat(60));

let passed = 0;
let failed = 0;

for (const test of testCases) {
  console.log("\n" + "─".repeat(60));
  console.log(`📋 Test: ${test.name}`);

  const results = detectMentionedProjects(test.text, availableProjects);
  const detected = results.map((r) => r.projectName);

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
