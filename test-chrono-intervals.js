const chrono = require("chrono-node");

console.log("Testing chrono-node with intervals and ranges:\n");

const tests = [
  "5 days",
  "in 5 days",
  "5 days from now",
  "2 weeks",
  "in 2 weeks",
  "3 hours",
  "call client in 5 days",
  "meeting 5 days from today",
  "complete by 5 days",
  "wait 5 days",
  // Date ranges
  "wednesday until friday",
  "from wednesday to friday",
  "monday through thursday",
  "Dec 10 to Dec 15",
  "tomorrow until next week",
  "meeting from 2pm to 4pm",
  "vacation from monday to friday",
  // Recurring patterns
  "every monday",
  "every first monday",
  "every 2 weeks",
  "every day",
  "every weekday",
  "every weekend",
  "every month",
  "every year",
  "every tuesday and thursday",
  "meeting every monday at 2pm",
  "review every first friday",
  "cleanup every 3 days",
];

tests.forEach((text) => {
  const results = chrono.parse(text, new Date("2025-12-05T15:00:00"));
  console.log(`Input: "${text}"`);
  if (results.length > 0) {
    results.forEach((r) => {
      console.log(`  ✅ Match: "${r.text}"`);
      console.log(`     Position: ${r.index}-${r.index + r.text.length}`);
      console.log(`     Start: ${r.start.date().toLocaleString()}`);
      if (r.end) {
        console.log(`     End: ${r.end.date().toLocaleString()}`);
        const diffMs = r.end.date().getTime() - r.start.date().getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        console.log(`     Duration: ${diffDays}d ${diffHours % 24}h ${diffMins % 60}m (${diffMins} minutes total)`);
      } else {
        console.log(`     End: (none)`);
      }
    });
  } else {
    console.log("  ❌ No match");
  }
  console.log("");
});
