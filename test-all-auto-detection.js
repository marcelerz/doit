/**
 * Comprehensive Test for All Auto-Detection Features
 *
 * Tests person mentions, project references, source people, and priorities
 * Verifies that auto-detection works correctly with overlap prevention
 */

// Mock data
const mockPeople = [
  { name: "Marcel", alternatives: ["Marc", "M"] },
  { name: "John Doe", alternatives: ["Johnny", "JD"] },
  { name: "Sarah", alternatives: ["Sara"] },
];

const mockProjects = [
  { name: "Website Redesign", alternatives: ["Website", "Site Redesign"] },
  { name: "API Development", alternatives: ["API Dev", "API"] },
  { name: "Marketing Campaign", alternatives: ["Marketing", "Campaign"] },
];

const mockPriorities = [
  { name: "Urgent", alternatives: ["Critical", "ASAP"] },
  { name: "High", alternatives: ["Important"] },
  { name: "Medium", alternatives: ["Normal"] },
  { name: "Low", alternatives: ["Minor"] },
];

// Simple implementations (same as individual test files)
function detectMentionedPeople(text, people) {
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

  for (const lowerName of sortedNames) {
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedName}\\b`, "gi");
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

  return results.sort((a, b) => a.start - b.start);
}

function detectMentionedProjects(text, projects) {
  const results = [];

  const nameMap = new Map();
  for (const project of projects) {
    nameMap.set(project.name.toLowerCase(), project.name);
    for (const alt of project.alternatives) {
      nameMap.set(alt.toLowerCase(), project.name);
    }
  }

  const sortedNames = Array.from(nameMap.keys()).sort((a, b) => b.length - a.length);
  const processedRanges = [];

  const contextPatterns = [
    { pattern: /\b(?:on|in|for)\s+/gi, prefix: true },
    { pattern: /\b(?:on|in|for)\s+project\s+/gi, prefix: true },
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
        const start = match.index;
        const end = start + match[0].length;

        const overlaps = processedRanges.some((range) => !(end <= range.start || start >= range.end));

        if (!overlaps) {
          results.push({
            text: match[0],
            start,
            end,
            projectName: nameMap.get(lowerName),
          });
          processedRanges.push({ start, end });
        }
      }
    }
  }

  return results.sort((a, b) => a.start - b.start);
}

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
    { pattern: /\bpriority\s+/gi, prefix: true },
    { pattern: /\s+priority\b/gi, prefix: false },
  ];

  for (const lowerName of sortedNames) {
    const escapedName = lowerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Direct match
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

    // Context match
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

// Comprehensive integration tests
console.log("=".repeat(80));
console.log("COMPREHENSIVE AUTO-DETECTION INTEGRATION TESTS");
console.log("=".repeat(80));

const integrationTests = [
  {
    name: "All features combined",
    text: "Marcel needs to work on Website Redesign - urgent priority from John Doe",
    expected: {
      people: ["Marcel"],
      projects: ["on Website Redesign"],
      sources: ["from John Doe"],
      priorities: ["urgent"],
    },
  },
  {
    name: "Multiple mentions and sources",
    text: "Discuss with Sarah and Marc about API project, info via Johnny",
    expected: {
      people: ["Sarah", "Marc"],
      projects: ["API project"],
      sources: ["via Johnny"],
      priorities: [],
    },
  },
  {
    name: "Priority with context and direct",
    text: "This is critical and high priority task",
    expected: {
      people: [],
      projects: [],
      sources: [],
      priorities: ["critical", "high priority"],
    },
  },
  {
    name: "Complex project context",
    text: "Work on project Marketing Campaign for Website and in API Development",
    expected: {
      people: [],
      projects: ["on project Marketing Campaign", "for Website", "in API Development"],
      sources: [],
      priorities: [],
    },
  },
  {
    name: "No false positives with blacklist",
    text: "I think the API is ready from me to you",
    expected: {
      people: [],
      projects: [],
      sources: [],
      priorities: [],
    },
  },
  {
    name: "Mixed everything",
    text: "urgent: Marcel to review in Marketing with Sarah source John Doe on Website Redesign",
    expected: {
      people: ["Marcel", "Sarah"],
      projects: ["in Marketing", "on Website Redesign"],
      sources: ["source John Doe"],
      priorities: ["urgent"],
    },
  },
  {
    name: "Alternatives work everywhere",
    text: "Talk to Marc about Site Redesign via JD - ASAP priority",
    expected: {
      people: ["Marc"],
      projects: ["about Site Redesign"],
      sources: ["via JD"],
      priorities: ["ASAP priority"],
    },
  },
  {
    name: "No context = no project detection",
    text: "Marketing is important",
    expected: {
      people: [],
      projects: [],
      sources: [],
      priorities: ["important"],
    },
  },
];

let passedTests = 0;
let totalTests = integrationTests.length;

integrationTests.forEach((test, index) => {
  console.log(`\n${"─".repeat(80)}`);
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`Input: "${test.text}"`);

  const detectedPeople = detectMentionedPeople(test.text, mockPeople);
  const detectedProjects = detectMentionedProjects(test.text, mockProjects);
  const detectedSources = detectSourcePeople(test.text, mockPeople);
  const detectedPriorities = detectPriorities(test.text, mockPriorities);

  const peopleTexts = detectedPeople.map((d) => d.text);
  const projectTexts = detectedProjects.map((d) => d.text);
  const sourceTexts = detectedSources.map((d) => d.text);
  const priorityTexts = detectedPriorities.map((d) => d.text);

  console.log(`\nExpected:`);
  console.log(`  People: [${test.expected.people.join(", ")}]`);
  console.log(`  Projects: [${test.expected.projects.join(", ")}]`);
  console.log(`  Sources: [${test.expected.sources.join(", ")}]`);
  console.log(`  Priorities: [${test.expected.priorities.join(", ")}]`);

  console.log(`\nDetected:`);
  console.log(`  People: [${peopleTexts.join(", ")}]`);
  console.log(`  Projects: [${projectTexts.join(", ")}]`);
  console.log(`  Sources: [${sourceTexts.join(", ")}]`);
  console.log(`  Priorities: [${priorityTexts.join(", ")}]`);

  const peopleMatch =
    peopleTexts.length === test.expected.people.length &&
    peopleTexts.every((text, i) => text === test.expected.people[i]);

  const projectsMatch =
    projectTexts.length === test.expected.projects.length &&
    projectTexts.every((text, i) => text === test.expected.projects[i]);

  const sourcesMatch =
    sourceTexts.length === test.expected.sources.length &&
    sourceTexts.every((text, i) => text === test.expected.sources[i]);

  const prioritiesMatch =
    priorityTexts.length === test.expected.priorities.length &&
    priorityTexts.every((text, i) => text === test.expected.priorities[i]);

  const allMatch = peopleMatch && projectsMatch && sourcesMatch && prioritiesMatch;

  if (allMatch) {
    console.log("\n✅ PASS");
    passedTests++;
  } else {
    console.log("\n❌ FAIL");
    if (!peopleMatch) console.log("  ❌ People mismatch");
    if (!projectsMatch) console.log("  ❌ Projects mismatch");
    if (!sourcesMatch) console.log("  ❌ Sources mismatch");
    if (!prioritiesMatch) console.log("  ❌ Priorities mismatch");
  }
});

console.log("\n" + "=".repeat(80));
console.log("FINAL RESULTS");
console.log("=".repeat(80));
console.log(`Tests Passed: ${passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log("\n✅ ALL INTEGRATION TESTS PASSED!");
  console.log("\n🎉 Auto-detection system is working perfectly!");
} else {
  console.log("\n❌ SOME TESTS FAILED");
  process.exit(1);
}
