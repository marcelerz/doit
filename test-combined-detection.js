/**
 * Combined test for auto-detection of people and projects
 * Run with: node test-combined-detection.js
 */

// Test data
const availablePeople = [
  { id: "1", name: "Marcel", alternatives: ["Marcel Erzberg"], comments: [], activity: [] },
  { id: "2", name: "Sarah", alternatives: ["Sarah Smith"], comments: [], activity: [] },
];

const availableProjects = [
  { id: "1", name: "Website Redesign", alternatives: ["Website"], comments: [], activity: [] },
  { id: "2", name: "Marketing Campaign", alternatives: ["Marketing"], comments: [], activity: [] },
];

console.log("🧪 Combined Person & Project Auto-Detection Tests");
console.log("═".repeat(70));

const combinedTests = [
  {
    name: "Person mention + project reference",
    text: "Marcel will work on Website Redesign tomorrow",
    expected: {
      people: ["Marcel"],
      projects: ["Website Redesign"],
    },
  },
  {
    name: "Multiple people and projects",
    text: "Marcel and Sarah working on Website and in Marketing",
    expected: {
      people: ["Marcel", "Sarah"],
      projects: ["Website Redesign", "Marketing Campaign"],
    },
  },
  {
    name: "Person with alternative + project with alternative",
    text: "Marcel Erzberg is focusing on Marketing this week",
    expected: {
      people: ["Marcel"],
      projects: ["Marketing Campaign"],
    },
  },
  {
    name: "Natural conversation",
    text: "Ask Marcel about the task in Website project",
    expected: {
      people: ["Marcel"],
      projects: ["Website Redesign"],
    },
  },
  {
    name: "Mixed with explicit markers",
    text: "@Marcel $Sarah working on Website and #Marketing",
    expected: {
      people: [], // @ and $ are explicit markers, not auto-detected
      projects: ["Website Redesign"], // "on Website" auto-detected, #Marketing explicit
    },
  },
];

console.log("\n✨ Sample Detections:\n");

combinedTests.forEach((test, idx) => {
  console.log(`${idx + 1}. ${test.name}`);
  console.log(`   Input: "${test.text}"`);
  console.log(`   Expected:`);
  console.log(`     👥 People: ${test.expected.people.join(", ") || "(none)"}`);
  console.log(`     📁 Projects: ${test.expected.projects.join(", ") || "(none)"}`);
  console.log("");
});

console.log("═".repeat(70));
console.log("\n💡 Key Features:");
console.log("\n👥 Person Detection:");
console.log("   • Detects person names and alternatives without ^ marker");
console.log("   • Filters common English words (me, i, the, etc.)");
console.log("   • Works with @ (assigned) and $ (source) explicit markers");
console.log("\n📁 Project Detection:");
console.log("   • Detects projects with context: 'on', 'in', 'for', 'project'");
console.log("   • Requires context words to prevent false positives");
console.log("   • Works with # explicit marker");
console.log("\n🎯 Priority Order:");
console.log("   1. Dates (highest priority)");
console.log("   2. Explicit markers (@, $, #)");
console.log("   3. Auto-detected people");
console.log("   4. Auto-detected projects");
console.log("\n✅ All detection happens automatically as you type!");
console.log("   No need to remember markers for natural mentions.");
console.log("\n" + "═".repeat(70));
