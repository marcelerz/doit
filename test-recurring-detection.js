const chrono = require("chrono-node");

console.log("Testing recurring pattern detection:\n");

const tests = [
  "review every monday",
  "cleanup every 2 days",
  "meeting every first friday",
  "check email every workday",
  "every 3 weeks submit report",
  "backup every month",
  "every tuesday and thursday gym",
];

// Reference date for testing
const refDate = new Date("2025-12-05T15:00:00");
console.log(`Reference date: ${refDate.toLocaleString()}\n`);

// Regex to detect "every" patterns
const regex =
  /\bevery\s+(?:(\d+)\s+)?(day|week|month|quarter|half|year|workday|sunday|monday|tuesday|wednesday|thursday|friday|saturday)s?\b|\bevery\s+(1st|2nd|3rd|4th|5th|last|first|second|third|fourth|fifth)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi;

tests.forEach((text) => {
  console.log(`Input: "${text}"`);

  // Check what chrono detects
  const chronoResults = chrono.parse(text, refDate);
  if (chronoResults.length > 0) {
    console.log(`  Chrono found: ${chronoResults.length} match(es)`);
    chronoResults.forEach((r) => {
      console.log(`    - "${r.text}" → ${r.start.date().toLocaleString()}`);
    });
  } else {
    console.log(`  Chrono found: none`);
  }

  // Check our regex
  regex.lastIndex = 0; // Reset regex
  let match;
  const regexMatches = [];
  while ((match = regex.exec(text)) !== null) {
    regexMatches.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  if (regexMatches.length > 0) {
    console.log(`  Regex found: ${regexMatches.length} pattern(s)`);
    regexMatches.forEach((m) => {
      console.log(`    - "${m.text}" at position ${m.start}-${m.end}`);
    });
  } else {
    console.log(`  Regex found: none`);
  }

  console.log("");
});
