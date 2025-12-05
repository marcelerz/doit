/**
 * Test Source Person and Priority Auto-Detection
 *
 * This file tests the detectSourcePeople() and detectPriorities() functions
 * to ensure they correctly identify source people with context patterns and
 * priorities with or without context.
 */

// Mock data for testing
const mockPeople = [
  { name: "Marcel", alternatives: ["Marc", "M"] },
  { name: "John Doe", alternatives: ["Johnny", "JD"] },
  { name: "Sarah", alternatives: ["Sara"] },
];

const mockPriorities = [
  { name: "Urgent", alternatives: ["Critical", "ASAP"] },
  { name: "High", alternatives: ["Important"] },
  { name: "Medium", alternatives: ["Normal"] },
  { name: "Low", alternatives: ["Minor"] },
];

// Simple test implementation
function detectSourcePeople(text, people) {
  const results = [];
  const blacklist = new Set(["me", "i", "the", "and", "or", "from", "via", "per", "source"]);

  const nameMap = new Map();
  for (const person of people) {
    if (!blacklist.has(person.name.toLowerCase())) {
      nameMap.set(person.name.toLowerCase(), person.name);
    }
    for (const alt of person.alternatives) {
      if (!blacklist.has(alt.toLowerCase())) {
        nameMap.set(alt.toLowerCase(), person.name);
      }
    }
  }

  const sortedNames = Array.from(nameMap.keys()).sort((a, b) => b.length - a.length);
  const processedRanges = [];

  const contextPatterns = [/\b(?:from|via|per)\s+/gi, /\bsource\s+/gi];

  for (const lowerName of sortedNames) {
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    for (const pattern of contextPatterns) {
      const regex = new RegExp(`(${pattern.source})${escapedName}\\b`, "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        const overlaps = processedRanges.some((range) => !(end <= range.start || start >= range.end));

        if (!overlaps) {
          results.push({
            text: match[0],
            start,
            end,
            personName: nameMap.get(lowerName),
          });
          processedRanges.push({ start, end });
        }
      }
    }
  }

  return results.sort((a, b) => a.start - b.start);
}

function detectPriorities(text, priorities) {
  const results = [];

  const priorityMap = new Map();
  for (const priority of priorities) {
    priorityMap.set(priority.name.toLowerCase(), priority.name);
    for (const alt of priority.alternatives) {
      priorityMap.set(alt.toLowerCase(), priority.name);
    }
  }

  const sortedNames = Array.from(priorityMap.keys()).sort((a, b) => b.length - a.length);
  const processedRanges = [];

  const contextPatterns = [
    { pattern: /\bpriority\s+/gi, prefix: true }, // "priority high"
    { pattern: /\s+priority\b/gi, prefix: false }, // "high priority"
  ];

  for (const lowerName of sortedNames) {
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Try direct match first
    const directRegex = new RegExp(`\\b${escapedName}\\b`, "gi");
    let match;
    while ((match = directRegex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      const overlaps = processedRanges.some((range) => !(end <= range.start || start >= range.end));

      if (!overlaps) {
        results.push({
          text: match[0],
          start,
          end,
          priorityName: priorityMap.get(lowerName),
        });
        processedRanges.push({ start, end });
      }
    }

    // Try with context
    for (const { pattern, prefix } of contextPatterns) {
      let contextRegex;
      if (prefix) {
        contextRegex = new RegExp(`(${pattern.source})${escapedName}\\b`, "gi");
      } else {
        contextRegex = new RegExp(`\\b${escapedName}(${pattern.source})`, "gi");
      }

      while ((match = contextRegex.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        const overlaps = processedRanges.some((range) => !(end <= range.start || start >= range.end));

        if (!overlaps) {
          results.push({
            text: match[0],
            start,
            end,
            priorityName: priorityMap.get(lowerName),
          });
          processedRanges.push({ start, end });
        }
      }
    }
  }

  return results.sort((a, b) => a.start - b.start);
}

// Test cases for source people detection
console.log("=".repeat(80));
console.log("SOURCE PERSON DETECTION TESTS");
console.log("=".repeat(80));

const sourceTests = [
  {
    name: "Basic 'from' pattern",
    text: "Review the document from Marcel",
    expected: ["from Marcel"],
  },
  {
    name: "Alternative name with 'from'",
    text: "Got feedback from Marc about the design",
    expected: ["from Marc"],
  },
  {
    name: "'via' pattern",
    text: "Received via John Doe this morning",
    expected: ["via John Doe"],
  },
  {
    name: "'per' pattern",
    text: "Update per Sarah on the project status",
    expected: ["per Sarah"],
  },
  {
    name: "'source' pattern",
    text: "Information source Johnny confirmed",
    expected: ["source Johnny"],
  },
  {
    name: "Multiple sources in one text",
    text: "Email from Marcel and feedback via Sarah",
    expected: ["from Marcel", "via Sarah"],
  },
  {
    name: "No source pattern",
    text: "Marcel reviewed the code",
    expected: [],
  },
  {
    name: "Blacklisted words ignored",
    text: "Message from me about the update",
    expected: [],
  },
  {
    name: "Context required - standalone name not detected",
    text: "Marcel thinks this is good",
    expected: [],
  },
  {
    name: "Mixed alternatives and canonical",
    text: "Report from Marc and email via JD",
    expected: ["from Marc", "via JD"],
  },
];

let sourceTestsPassed = 0;
let sourceTotalTests = sourceTests.length;

sourceTests.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.name}`);
  console.log(`Input: "${test.text}"`);

  const detected = detectSourcePeople(test.text, mockPeople);
  const detectedTexts = detected.map((d) => d.text);

  console.log(`Expected: [${test.expected.join(", ")}]`);
  console.log(`Detected: [${detectedTexts.join(", ")}]`);

  const passed =
    detectedTexts.length === test.expected.length && detectedTexts.every((text, i) => text === test.expected[i]);

  if (passed) {
    console.log("✅ PASS");
    sourceTestsPassed++;
  } else {
    console.log("❌ FAIL");
  }
});

console.log("\n" + "=".repeat(80));
console.log(`Source Tests: ${sourceTestsPassed}/${sourceTotalTests} passed`);
console.log("=".repeat(80));

// Test cases for priority detection
console.log("\n" + "=".repeat(80));
console.log("PRIORITY DETECTION TESTS");
console.log("=".repeat(80));

const priorityTests = [
  {
    name: "Direct priority name",
    text: "This is urgent and needs attention",
    expected: ["urgent"],
  },
  {
    name: "Priority with 'priority' suffix",
    text: "Mark as high priority for today",
    expected: ["high priority"],
  },
  {
    name: "Priority with 'priority' prefix",
    text: "Set priority urgent for this task",
    expected: ["priority urgent"],
  },
  {
    name: "Alternative name",
    text: "This is critical and must be done now",
    expected: ["critical"],
  },
  {
    name: "Multiple priorities",
    text: "urgent task and medium priority item",
    expected: ["urgent", "medium priority"],
  },
  {
    name: "Case insensitive",
    text: "Mark as URGENT or High",
    expected: ["URGENT", "High"],
  },
  {
    name: "With context words",
    text: "Set priority high for tomorrow and medium for next week",
    expected: ["priority high", "medium"],
  },
  {
    name: "Alternative with suffix",
    text: "This is important priority",
    expected: ["important priority"],
  },
  {
    name: "No priority detected",
    text: "Just a regular task",
    expected: [],
  },
  {
    name: "Mixed canonical and alternatives",
    text: "Mark urgent and ASAP priority needed",
    expected: ["urgent", "ASAP priority"],
  },
];

let priorityTestsPassed = 0;
let priorityTotalTests = priorityTests.length;

priorityTests.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.name}`);
  console.log(`Input: "${test.text}"`);

  const detected = detectPriorities(test.text, mockPriorities);
  const detectedTexts = detected.map((d) => d.text);

  console.log(`Expected: [${test.expected.join(", ")}]`);
  console.log(`Detected: [${detectedTexts.join(", ")}]`);

  const passed =
    detectedTexts.length === test.expected.length && detectedTexts.every((text, i) => text === test.expected[i]);

  if (passed) {
    console.log("✅ PASS");
    priorityTestsPassed++;
  } else {
    console.log("❌ FAIL");
  }
});

console.log("\n" + "=".repeat(80));
console.log(`Priority Tests: ${priorityTestsPassed}/${priorityTotalTests} passed`);
console.log("=".repeat(80));

// Summary
console.log("\n" + "=".repeat(80));
console.log("FINAL SUMMARY");
console.log("=".repeat(80));
console.log(`Source Person Tests: ${sourceTestsPassed}/${sourceTotalTests} passed`);
console.log(`Priority Tests: ${priorityTestsPassed}/${priorityTotalTests} passed`);
console.log(`Total: ${sourceTestsPassed + priorityTestsPassed}/${sourceTotalTests + priorityTotalTests} passed`);

if (sourceTestsPassed === sourceTotalTests && priorityTestsPassed === priorityTotalTests) {
  console.log("\n✅ ALL TESTS PASSED!");
} else {
  console.log("\n❌ SOME TESTS FAILED");
  process.exit(1);
}
