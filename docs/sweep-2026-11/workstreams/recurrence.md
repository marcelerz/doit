# Workstream: recurrence

Recurring tasks. 9 units, 11 items, ordered by batch and then priority. Line numbers are as of commit `0596933`; re-check them when the unit's batch starts.

## <a id="u0142"></a>U0142 — Prevent duplicate next occurrences when re-completing a recurring task
*Batch 3A · bugfix · high · `bugfix` · effort S.* Unchecking a completed recurring task leaves its spawn and re-completing spawns again. buildRecurringSpawn returns null when a live spawn already exists.

### <a id="bug-19"></a>BUG-19 — Unchecking a completed recurring task leaves its spawn, and re-completing creates a second next occurrence
*high · `bugfix` · effort S.* **Where:** `src/hooks/useTodos.ts:433-448`; `src/hooks/useTodos.ts:588-593`; `src/hooks/useTodos.ts:219-235`. **Problem.** Only Undo removes the spawn of a completed recurring task. Unchecking by checkbox or Kanban drag leaves both the original and the next occurrence active. Completing again calls buildRecurringSpawn, which has no guard, so there are two copies of the next occurrence. **Proposal.** buildRecurringSpawn returns null when a non-deleted todo with recurringPreviousId === id exists. Optionally drop an untouched spawn on uncomplete, using handleUndo's rule. **Done when.** On a daily todo, toggle three times, and exactly one todo has recurringPreviousId === id.

## <a id="u0522"></a>U0522 — Merge a time into 'every &lt;weekday> at 9am' recurrences
*Batch 3A · bugfix · high · `bugfix` · effort M.* Only chrono results with a duration are merged, so the time is dropped and 'at 9am' stays in the title; also merge results with a certain hour.

### <a id="bug-36"></a>BUG-36 — 'every &lt;weekday> at 9am' drops the time and leaves 'at 9am' in the title
*high · `bugfix` · effort M.* **Where:** `src/utils/autoDetection.ts:277-326`. **Problem.** A time is merged into a recurrence only when the overlapping chrono result has a duration. At Tue 15:30, 'Gym every monday at 9am' is due Mon 15:30 and keeps 'at 9am' in the text. 'every weekday at 9am' behaves the same. **Proposal.** Also merge an overlapping chrono result with a certain hour: copy its hour and minute and extend the span without rewriting raw. **Done when.** At Tue 2025-12-09 15:30, one result with text 'every monday at 9am', dated Mon 12-15 09:00.

## <a id="u0523"></a>U0523 — Keep recurring patterns parseable when the text includes a time range
*Batch 3A · bugfix · high · `bugfix` · effort M.* recurring.raw is overwritten with the time range so the anchored parser returns null and the task stops spawning; keep raw bare, strip trailing times, validate overlay input.

### <a id="bug-35"></a>BUG-35 — Recurring text that includes a time range stops recurring
*high · `bugfix` · effort M.* **Where:** `src/utils/autoDetection.ts:306-314`; `src/components/input/SmartInput.tsx:450-458`; `src/hooks/useTodos.ts:433-436`; `src/components/overlays/TodoDetailsOverlay.tsx:889-893`. **Problem.** autoDetection overwrites recurring.raw with 'every friday 2pm-3pm'. The anchored regexes in parseRecurringPattern return null, so completing the task never spawns the next one, while it still displays as recurring. Custom values entered in the overlay are not validated either. **Proposal.** Keep raw as the bare pattern. Strip a trailing time or range in parseRecurringPattern so stored data keeps recurring. Validate custom values in the overlay. **Done when.** Completing a todo with recurring 'every friday 2pm-3pm' spawns the next instance.

## <a id="u0553"></a>U0553 — Clamp month and year arithmetic for recurrences and relative dates
*Batch 3A · bugfix · high · `bugfix` · effort S.* setMonth without clamping makes a Jan 31 monthly task respawn on Mar 3 and 'in 1 month' overflow; add addMonthsClamped for intervals and chrono relative/someday parsers.

### <a id="bug-37"></a>BUG-37 — Monthly, quarterly and yearly intervals and chrono 'in 1 month' overflow from the 29th-31st
*high · `bugfix` · effort S.* **Where:** `src/utils/recurringParser.ts:316-326`; `src/utils/chronoCustom.ts:236-255`; `src/utils/chronoCustom.ts:670-675`; `src/hooks/useTodos.ts:440-441`. **Problem.** The interval branch calls setMonth and setFullYear without clamping. A 'monthly' task due Jan 31 respawns on Mar 3 and stays drifted. Yearly from Feb 29 moves to Mar 1. Typing 'in 1 month' or 'later' on Jan 31 gives Mar 3. **Proposal.** Add an addMonthsClamped(date, n) helper (also used by BUG-63 and BUG-195) for the interval cases and the chrono relative and someday parsers. **Done when.** 'monthly' from 2026-01-31 gives 2026-02-28. 'yearly' from 2028-02-29 gives 2029-02-28. 'in 1 month' from 01-31 gives 02-28.

## <a id="u0555"></a>U0555 — Use this month's nth-weekday occurrence when it is still ahead
*Batch 3A · bugfix · high · `bugfix` · effort S.* 'every 2nd tuesday' always starts next month, skipping an upcoming occurrence; use this month's when strictly after fromDate and fix the test pinning the wrong answer.

### <a id="bug-38"></a>BUG-38 — 'every Nth weekday' skips this month's occurrence when it is still ahead
*high · `bugfix` · effort S.* **Where:** `src/utils/recurringParser.ts:345-428`; `src/utils/__tests__/recurringParser.test.ts:635-645`. **Problem.** The nth-weekday case always starts at the next month. On 2025-12-01, 'every 2nd tuesday' is first due 2026-01-13 instead of 2025-12-09. An existing test pins the wrong 'last friday' answer. **Proposal.** Use this month's occurrence when it is strictly after fromDate, otherwise advance. Update the test to expect 2025-12-26. **Done when.** 'every 2nd tuesday' from 2025-12-01 is 12-09. 'every last friday' from 2026-11-20 is 11-27.

## <a id="u0520"></a>U0520 — Align SmartInput recurrence detection with every phrase the parser accepts
*Batch 6A · bugfix · medium · `needs-decision` · effort M.* 'every month on the 15th' loses its day, 'repeat weekly' leaves 'repeat', and 'on the Nth' or 'monthly on 15th' are only partly detected; reorder and extend the regex. **Question for the owner:** Should the 'workday' recurrence follow the work-week settings instead of a fixed Monday to Friday?

### <a id="bug-147"></a>BUG-147 — 'every month on the 15th' is detected as plain 'every month'
*medium · `bugfix` · effort S.* **Where:** `src/utils/autoDetection.ts:159-179`; `src/utils/recurringParser.ts:179-191`. **Problem.** The generic unit alternative matches first, so 'every month on 15' loses its day and the 31st drifts. **Proposal.** Order the 'month on' alternative first, or add (?!\s+on\b). **Done when.** 'every month on 15' gives {type:'monthly', monthDay:15} covering the whole phrase.

### <a id="bug-190"></a>BUG-190 — 'repeat weekly' is detected as 'weekly', leaving 'repeat' in the title
*low · `bugfix` · effort S.* **Where:** `src/utils/autoDetection.ts:159-179`. **Problem.** There is no 'repeat &lt;shortcut>' alternative. **Proposal.** Add an optional (?:repeat\s+) prefix to the shortcut alternative. **Done when.** The detected text is 'repeat weekly'.

### <a id="part-68"></a>PART-68 — SmartInput misses recurrence phrases the parser accepts
*low · `needs-decision` · effort M.* **Where:** `src/utils/autoDetection.ts:159`; `src/utils/recurringParser.ts:129`; `src/utils/recurringParser.ts:193`; `src/utils/recurringParser.ts:256`; `src/utils/recurringParser.ts:327`; `src/utils/recurringParser.ts:543`; `src/components/overlays/TodoDetailsOverlay.tsx:888`. **Problem.** The parser accepts 'repeat daily', 'on the 15th', 'monthly on 15th', 'quarterly on 1st' and 'yearly on jan 1'. SmartInput's detection captures them only partly: 'repeat' stays in the title, and 'on 15th' is left for date parsing. They work in full only as free text in the details overlay. getRecurringSuggestions has no caller. The 'workday' recurrence hard-codes Monday to Friday, ignoring the work-week settings. **Proposal.** Add 'repeat &lt;shortcut>', '&lt;shortcut> on …' and 'on the Nth' alternatives to the detection regex, so typed input matches what the parser accepts. The owner decides whether 'workday' should follow the work-week settings. **Done when.** autoDetection tests: each listed phrase is detected whole, removed from the title, and parses to the same pattern it gets in the details field.

## <a id="u0135"></a>U0135 — Judge an untouched recurring spawn by its data, not activity count
*Batch 11 · bugfix · low · `bugfix` · effort S.* Undoing a recurring completion deletes the spawn when it has one activity entry; also require no comments, no time entries and unchanged subtasks.

### <a id="log-61"></a>LOG-61 — Undoing a recurring completion discards the next instance if it has one activity entry, even when the user already worked on it
*low · `bugfix` · effort S.* **Where:** `src/hooks/useTodos.ts:227-235`. **Problem.** Undo drops the spawned next instance when todo.activity.length === 1, taking that to mean 'untouched'. Comments, subtask changes and manual time entries write no activity, so a spawn the user commented on or logged time against within the undo window is silently deleted. **Proposal.** Judge 'untouched' from the data: also require no comments, no time entries and subtasks unchanged from what buildRecurringSpawn produced. LOG-36 narrows the gap, but this check should not depend on it. **Done when.** useTodos test: complete a recurring task, add a comment to the spawned instance, undo; the spawn survives.

## <a id="u0143"></a>U0143 — Decide how overdue recurring completions schedule the next instance
*Batch 11 · bugfix · low · `needs-decision` · effort S.* The spawn steps once from the old due date, so it can already be overdue; undated spawns inherit the completion clock time. **Question for the owner:** Advance the next occurrence until it is after now, and normalise the time for undated spawns?

### <a id="bug-166"></a>BUG-166 — Completing an overdue recurring task spawns an instance that is already overdue
*low · `needs-decision` · effort S.* **Where:** `src/hooks/useTodos.ts:438-441`; `src/utils/recurringParser.ts:307-325`. **Problem.** The spawn steps forward once from the old due date, and with no due date it inherits the completion's clock time. **Proposal.** Owner picks: advance until the date is after now, and/or normalise the no-due-date spawn. **Done when.** A daily task due 12-01, completed 12-05, spawns per the decision (for example 12-06).

## <a id="u0623"></a>U0623 — Move recurring docs into smart-input.md with the full grammar
*Batch 12 · docs · medium · `none` · effort S.* Derive the recurring grammar from the parser with unit-tested examples, show the real pipeline position and spawn behaviour, delete both recurring docs.

### <a id="doc-41"></a>DOC-41 — The recurring docs cover only 'every …' patterns and get the processing order wrong
*medium · `none` · effort S.* **Where:** `docs/recurring-auto-detection.md:7`; `docs/recurring-auto-detection.md:57`; `docs/recurring-auto-detection.md:68-75`; `docs/recurring-auto-detection.md:81`; `docs/recurring-tasks.md:11`; `docs/recurring-tasks.md:71-76`; `docs/recurring-tasks.md:100-108`; `src/utils/autoDetection.ts:158-180`; `src/utils/recurringParser.ts:104-147`. **Problem.** Both docs say a pattern must start with 'every'. The detector also accepts daily, weekly, biweekly, fortnightly, monthly, bimonthly, quarterly, yearly, annually and semiannually, plus each, repeat, 'every other X', 'every weekday', several weekdays ('every monday and wednesday') and 'every month on the 15th'. Some examples may not parse. Line 57 contrasts recurrence with 'explicit % markers', but % marks projects. The ordering at 68-75 is wrong. The spawn description omits subtask copy and reset, dependency clearing and workflow-state reset. **Proposal.** Move the content into smart-input.md's Recurring section. Derive the grammar from detectRecurringPatterns and parseRecurringPattern, and use only examples a unit test proves parse. Show the real pipeline position, and list exactly what buildRecurringSpawn copies and resets. Delete both recurring docs in this package. **Done when.** A parseRecurringPattern test asserts every example in the Recurring section, and both recurring docs are deleted with their links updated.
