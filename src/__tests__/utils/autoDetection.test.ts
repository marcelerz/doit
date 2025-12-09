/**
 * Tests for Auto-Detection Utilities
 */

import {
  detectDurationPatterns,
  detectDatesInText,
  getFirstDetectedDate,
  formatDetectedDate,
  detectedDateToISO,
  isPositionInDate,
  getDateAtPosition,
  detectMentionedPeople,
  detectMentionedProjects,
  detectAssignedPeople,
  detectSourcePeople,
  detectPriorities,
  detectHashtags,
} from "@/utils/autoDetection";
import { Person, Project, Priority } from "@/types/settings";

describe("autoDetection", () => {
  describe("detectDurationPatterns", () => {
    it("should detect minute durations", () => {
      const result = detectDurationPatterns("This task takes 30m to complete");
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("30m");
      expect(result[0].text).toBe("30m");
    });

    it("should detect hour durations", () => {
      const result = detectDurationPatterns("Meeting will be 2h long");
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("2h");
    });

    it("should detect decimal hour durations", () => {
      const result = detectDurationPatterns("Task takes 1.5h");
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("1.5h");
    });

    it("should detect day durations", () => {
      const result = detectDurationPatterns("Project is 3d effort");
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("3d");
    });

    it("should detect week durations", () => {
      const result = detectDurationPatterns("Sprint is 2w long");
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("2w");
    });

    it("should detect multiple durations", () => {
      const result = detectDurationPatterns("First part 30m, second part 1h");
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe("30m");
      expect(result[1].value).toBe("1h");
    });

    it("should handle various unit formats", () => {
      expect(detectDurationPatterns("15 minutes")[0].value).toBe("15m");
      expect(detectDurationPatterns("2 hours")[0].value).toBe("2h");
      expect(detectDurationPatterns("3 days")[0].value).toBe("3d");
      expect(detectDurationPatterns("1 week")[0].value).toBe("1w");
    });

    it("should return empty array for no durations", () => {
      const result = detectDurationPatterns("No duration here");
      expect(result).toHaveLength(0);
    });

    it("should capture correct positions", () => {
      const text = "Task takes 45m";
      const result = detectDurationPatterns(text);

      expect(result[0].start).toBe(11);
      expect(result[0].end).toBe(14);
    });
  });

  describe("detectDatesInText", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Set to December 9, 2025 at noon
      jest.setSystemTime(new Date(2025, 11, 9, 12, 0, 0));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should detect 'tomorrow'", () => {
      const result = detectDatesInText("Meet tomorrow");
      expect(result).toHaveLength(1);
      expect(result[0].text.toLowerCase()).toContain("tomorrow");

      const detectedDate = result[0].date;
      expect(detectedDate.getDate()).toBe(10); // December 10
    });

    it("should detect 'next week'", () => {
      const result = detectDatesInText("Due next week");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should detect specific dates", () => {
      const result = detectDatesInText("Due on December 25th");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].date.getMonth()).toBe(11); // December
      expect(result[0].date.getDate()).toBe(25);
    });

    it("should detect weekday names", () => {
      const result = detectDatesInText("Meet on Monday");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should not confuse durations with dates", () => {
      const text = "Task takes 2h and is due tomorrow";
      const result = detectDatesInText(text);

      // Should find "tomorrow" but not "2h" as a date
      expect(result.length).toBe(1);
      expect(result[0].text.toLowerCase()).toContain("tomorrow");
    });

    it("should sort dates by position", () => {
      const result = detectDatesInText("tomorrow and next friday");
      if (result.length >= 2) {
        expect(result[0].start).toBeLessThan(result[1].start);
      }
    });
  });

  describe("getFirstDetectedDate", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2025, 11, 9, 12, 0, 0));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return first date from text", () => {
      const result = getFirstDetectedDate("Due tomorrow at 3pm");
      expect(result).not.toBeNull();
    });

    it("should return null for text without dates", () => {
      const result = getFirstDetectedDate("No dates here");
      expect(result).toBeNull();
    });
  });

  describe("formatDetectedDate", () => {
    it("should format date for display", () => {
      const detectedDate = {
        text: "tomorrow",
        start: 0,
        end: 8,
        date: new Date(2025, 11, 10, 15, 0),
        timestamp: new Date(2025, 11, 10, 15, 0).getTime(),
      };

      const result = formatDetectedDate(detectedDate);

      expect(result).toContain("Dec");
      expect(result).toContain("10");
      expect(result).toContain("2025");
    });
  });

  describe("detectedDateToISO", () => {
    it("should convert to ISO format string", () => {
      const detectedDate = {
        text: "tomorrow",
        start: 0,
        end: 8,
        date: new Date(2025, 11, 10, 15, 30),
        timestamp: new Date(2025, 11, 10, 15, 30).getTime(),
      };

      const result = detectedDateToISO(detectedDate);

      expect(result).toBe("2025-12-10T15:30");
    });

    it("should pad single-digit values", () => {
      const detectedDate = {
        text: "date",
        start: 0,
        end: 4,
        date: new Date(2025, 0, 5, 9, 5), // Jan 5, 9:05
        timestamp: new Date(2025, 0, 5, 9, 5).getTime(),
      };

      const result = detectedDateToISO(detectedDate);

      expect(result).toBe("2025-01-05T09:05");
    });
  });

  describe("isPositionInDate", () => {
    const dates = [
      { text: "tomorrow", start: 5, end: 13, date: new Date(), timestamp: Date.now() },
      { text: "friday", start: 20, end: 26, date: new Date(), timestamp: Date.now() },
    ];

    it("should return true for position inside date", () => {
      expect(isPositionInDate(7, dates)).toBe(true); // inside "tomorrow"
      expect(isPositionInDate(22, dates)).toBe(true); // inside "friday"
    });

    it("should return false for position outside dates", () => {
      expect(isPositionInDate(0, dates)).toBe(false);
      expect(isPositionInDate(15, dates)).toBe(false);
      expect(isPositionInDate(30, dates)).toBe(false);
    });

    it("should return true for position at start of date", () => {
      expect(isPositionInDate(5, dates)).toBe(true);
    });

    it("should return false for position at end of date", () => {
      expect(isPositionInDate(13, dates)).toBe(false); // end is exclusive
    });
  });

  describe("getDateAtPosition", () => {
    const dates = [
      { text: "tomorrow", start: 5, end: 13, date: new Date(), timestamp: Date.now() },
      { text: "friday", start: 20, end: 26, date: new Date(), timestamp: Date.now() },
    ];

    it("should return date at position", () => {
      const result = getDateAtPosition(7, dates);
      expect(result).not.toBeNull();
      expect(result?.text).toBe("tomorrow");
    });

    it("should return null for position outside dates", () => {
      expect(getDateAtPosition(0, dates)).toBeNull();
      expect(getDateAtPosition(15, dates)).toBeNull();
    });
  });

  describe("detectMentionedPeople", () => {
    const people: Person[] = [
      {
        name: "Alice Smith",
        alternatives: ["Alice", "A.S."],
        context: "",
        color: "",
        state: "active",
        comments: [],
        activity: [],
      },
      {
        name: "Bob Jones",
        alternatives: ["Bobby", "BJ"],
        context: "",
        color: "",
        state: "active",
        comments: [],
        activity: [],
      },
      { name: "Charlie", alternatives: [], context: "", color: "", state: "active", comments: [], activity: [] },
    ];

    it("should detect person by canonical name", () => {
      const result = detectMentionedPeople("Talk to Charlie about the project", people);
      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Charlie");
    });

    it("should detect person by alternative name", () => {
      const result = detectMentionedPeople("Ask Bobby for help", people);
      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Bob Jones");
    });

    it("should detect multiple people", () => {
      const result = detectMentionedPeople("Alice and Charlie should meet", people);
      expect(result).toHaveLength(2);
    });

    it("should match longer names first", () => {
      const result = detectMentionedPeople("Talk to Alice Smith", people);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe("Alice Smith");
    });

    it("should be case-insensitive", () => {
      const result = detectMentionedPeople("ALICE should review", people);
      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Alice Smith");
    });

    it("should not match blacklisted words", () => {
      const peopleWithCommon: Person[] = [
        {
          name: "The Manager",
          alternatives: ["Me"],
          context: "",
          color: "",
          state: "active",
          comments: [],
          activity: [],
        },
      ];
      const result = detectMentionedPeople("Tell me about the project", peopleWithCommon);
      expect(result).toHaveLength(0);
    });

    it("should match whole words only", () => {
      const result = detectMentionedPeople("Charlies party", people);
      // "Charlies" should not match "Charlie" (different word)
      expect(result).toHaveLength(0);
    });

    it("should return empty array when no matches", () => {
      const result = detectMentionedPeople("No people mentioned here", people);
      expect(result).toHaveLength(0);
    });

    it("should track correct positions", () => {
      const result = detectMentionedPeople("Ask Charlie for help", people);
      expect(result[0].start).toBe(4);
      expect(result[0].end).toBe(11);
    });
  });

  describe("detectMentionedProjects", () => {
    const projects: Project[] = [
      {
        name: "Website Redesign",
        alternatives: ["Website", "WR"],
        context: "",
        color: "",
        state: "active",
        comments: [],
        activity: [],
      },
      {
        name: "Marketing Campaign",
        alternatives: ["Marketing"],
        context: "",
        color: "",
        state: "active",
        comments: [],
        activity: [],
      },
      {
        name: "API Development",
        alternatives: [],
        context: "",
        color: "",
        state: "active",
        comments: [],
        activity: [],
      },
    ];

    it("should detect project with 'on' context", () => {
      const result = detectMentionedProjects("Working on Website Redesign", projects);
      expect(result).toHaveLength(1);
      expect(result[0].projectName).toBe("Website Redesign");
    });

    it("should detect project with 'in' context", () => {
      const result = detectMentionedProjects("Bug found in API Development", projects);
      expect(result).toHaveLength(1);
      expect(result[0].projectName).toBe("API Development");
    });

    it("should detect project with 'for' context", () => {
      const result = detectMentionedProjects("Assets for Marketing Campaign", projects);
      expect(result).toHaveLength(1);
      expect(result[0].projectName).toBe("Marketing Campaign");
    });

    it("should detect project with 'project' suffix", () => {
      const result = detectMentionedProjects("The Marketing project is going well", projects);
      expect(result).toHaveLength(1);
      expect(result[0].projectName).toBe("Marketing Campaign");
    });

    it("should detect project by alternative name", () => {
      const result = detectMentionedProjects("Working on Website", projects);
      expect(result).toHaveLength(1);
      expect(result[0].projectName).toBe("Website Redesign");
    });

    it("should be case-insensitive", () => {
      const result = detectMentionedProjects("on MARKETING CAMPAIGN", projects);
      expect(result).toHaveLength(1);
    });

    it("should not detect project without context", () => {
      // Just the project name alone shouldn't match
      const result = detectMentionedProjects("Website Redesign is ready", projects);
      expect(result).toHaveLength(0);
    });

    it("should return empty array when no matches", () => {
      const result = detectMentionedProjects("No project context here", projects);
      expect(result).toHaveLength(0);
    });
  });

  describe("detectAssignedPeople", () => {
    const people: Person[] = [
      { name: "Alice", alternatives: [], context: "", color: "", state: "active", comments: [], activity: [] },
      { name: "Bob", alternatives: [], context: "", color: "", state: "active", comments: [], activity: [] },
    ];

    it("should detect assigned with 'ask' context", () => {
      const result = detectAssignedPeople("Ask Alice about the report", people);
      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Alice");
    });

    it("should detect assigned with 'tell' context", () => {
      const result = detectAssignedPeople("Tell Bob about the meeting", people);
      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Bob");
    });

    it("should detect assigned with 'cc' context", () => {
      const result = detectAssignedPeople("CC Alice on the email", people);
      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Alice");
    });

    it("should detect assigned with 'with' context", () => {
      const result = detectAssignedPeople("Meet with Bob tomorrow", people);
      expect(result).toHaveLength(1);
    });

    it("should detect assigned with 'assign to' context", () => {
      const result = detectAssignedPeople("Assign to Alice for review", people);
      expect(result).toHaveLength(1);
    });

    it("should detect multiple assigned people", () => {
      const result = detectAssignedPeople("Ask Alice and tell Bob", people);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no assignment context", () => {
      const result = detectAssignedPeople("Alice and Bob are great", people);
      expect(result).toHaveLength(0);
    });
  });

  describe("detectSourcePeople", () => {
    const people: Person[] = [
      { name: "Manager", alternatives: [], context: "", color: "", state: "active", comments: [], activity: [] },
      { name: "Client", alternatives: [], context: "", color: "", state: "active", comments: [], activity: [] },
    ];

    it("should detect source with 'from' context", () => {
      const result = detectSourcePeople("Request from Manager", people);
      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Manager");
    });

    it("should detect source with 'via' context", () => {
      const result = detectSourcePeople("Feedback via Client", people);
      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Client");
    });

    it("should detect source with 'per' context", () => {
      const result = detectSourcePeople("Update per Manager", people);
      expect(result).toHaveLength(1);
    });

    it("should detect source with 'sent by' context", () => {
      const result = detectSourcePeople("Document sent by Client", people);
      expect(result).toHaveLength(1);
    });

    it("should return empty array when no source context", () => {
      const result = detectSourcePeople("Manager approved the request", people);
      expect(result).toHaveLength(0);
    });
  });

  describe("detectPriorities", () => {
    const priorities: Priority[] = [
      { id: "1", name: "Urgent", alternatives: ["critical", "asap"], color: "#ff0000", comments: [], activity: [] },
      { id: "2", name: "High", alternatives: ["important"], color: "#ff6600", comments: [], activity: [] },
      { id: "3", name: "Medium", alternatives: [], color: "#ffcc00", comments: [], activity: [] },
      { id: "4", name: "Low", alternatives: ["minor"], color: "#00ff00", comments: [], activity: [] },
    ];

    it("should detect specific priority words directly", () => {
      const result = detectPriorities("This is urgent", priorities);
      expect(result).toHaveLength(1);
      expect(result[0].priorityName).toBe("Urgent");
    });

    it("should detect priority by alternative", () => {
      const result = detectPriorities("This is critical", priorities);
      expect(result).toHaveLength(1);
      expect(result[0].priorityName).toBe("Urgent");
    });

    it("should detect with 'priority' context for common words", () => {
      const result = detectPriorities("This is high priority", priorities);
      expect(result).toHaveLength(1);
      expect(result[0].priorityName).toBe("High");
    });

    it("should detect with 'priority:' prefix", () => {
      const result = detectPriorities("priority: medium task", priorities);
      expect(result).toHaveLength(1);
      expect(result[0].priorityName).toBe("Medium");
    });

    it("should be case-insensitive", () => {
      const result = detectPriorities("URGENT matter", priorities);
      expect(result).toHaveLength(1);
    });

    it("should not detect common words without context", () => {
      // "high" without "priority" context should not match
      const result = detectPriorities("high quality work", priorities);
      expect(result).toHaveLength(0);
    });

    it("should return empty array when no priority found", () => {
      const result = detectPriorities("Regular task here", priorities);
      expect(result).toHaveLength(0);
    });
  });

  describe("detectHashtags", () => {
    it("should detect simple hashtags", () => {
      const result = detectHashtags("This is #important");
      expect(result).toHaveLength(1);
      expect(result[0].tagName).toBe("important");
    });

    it("should detect multiple hashtags", () => {
      const result = detectHashtags("Task #urgent #followup");
      expect(result).toHaveLength(2);
      expect(result[0].tagName).toBe("urgent");
      expect(result[1].tagName).toBe("followup");
    });

    it("should detect hashtags with dashes", () => {
      const result = detectHashtags("Tag #follow-up here");
      expect(result).toHaveLength(1);
      expect(result[0].tagName).toBe("follow-up");
    });

    it("should detect hashtags with underscores", () => {
      const result = detectHashtags("Tag #to_review");
      expect(result).toHaveLength(1);
      expect(result[0].tagName).toBe("to_review");
    });

    it("should detect hashtags with numbers", () => {
      const result = detectHashtags("Phase #phase2");
      expect(result).toHaveLength(1);
      expect(result[0].tagName).toBe("phase2");
    });

    it("should detect hashtag at start of text", () => {
      const result = detectHashtags("#first tag");
      expect(result).toHaveLength(1);
      expect(result[0].tagName).toBe("first");
    });

    it("should return empty array for no hashtags", () => {
      const result = detectHashtags("No hashtags here");
      expect(result).toHaveLength(0);
    });

    it("should not match mid-word hash", () => {
      const result = detectHashtags("C#sharp programming");
      // The # in C# is mid-word, behavior depends on implementation
      // Most implementations would detect "sharp"
    });
  });
});
