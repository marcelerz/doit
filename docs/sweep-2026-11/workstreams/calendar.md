# Workstream: calendar

The Calendar view and time blocks. 4 units, 5 items, ordered by batch and then priority. Line numbers are as of commit `0596933`; re-check them when the unit's batch starts.

## <a id="u0336"></a>U0336 — Keep Calendar week view populated and make header arrows view-aware
*Batch 6B · bugfix · medium · `bugfix` · effort S.* Deselecting the selected day empties week view, and header arrows change only currentMonth, which week and agenda ignore. Keep a selected date and step arrows per view. **Question for the owner:** Should the header arrows step by seven days in week and agenda views?

### <a id="bug-141"></a>BUG-141 — Calendar week view goes blank when the selected day is clicked; month arrows do nothing in week and agenda views
*medium · `bugfix` · effort S.* **Where:** `src/components/views/CalendarView.tsx:285-352`; `src/components/views/CalendarView.tsx:647-665`; `src/components/views/CalendarView.tsx:761-764`. **Problem.** Toggling the selection off empties weekDays. The header arrows change only currentMonth, which week and agenda ignore. **Proposal.** Don't deselect in week view, or fall back to today. View-aware arrows (±7 days) are a small extension the owner confirms. **Done when.** Clicking the selected day in week view still renders 7 days.

## <a id="u0331"></a>U0331 — Give the Calendar grid real grid semantics and roving keyboard focus
*Batch 8B · a11y · medium · `bugfix` · effort M.* Remove role=application, add rows and column headers, keep buttons inside gridcells, start the roving tabindex on today or the selection, and move DOM focus with arrow keys.

### <a id="ux-39"></a>UX-39 — Calendar grid cannot be reached by Tab, and its semantics are broken
*medium · `bugfix` · effort M.* **Where:** `src/components/views/CalendarView.tsx:179`; `src/components/views/CalendarView.tsx:366-386`; `src/components/views/CalendarView.tsx:494-518`; `src/components/views/CalendarView.tsx:670-676`; `src/components/views/CalendarView.tsx:720-752`; `src/components/views/CalendarView.tsx:761-787`. **Problem.** role=application wraps the whole view, task list and overlay included, which takes screen readers out of browse mode. The grid has no rows and no column headers, and the day buttons are re-roled as gridcell, so they lose their button semantics. focusedDateIndex starts as null, which leaves every cell at tabIndex=-1, so Tab never reaches the grid. The arrow keys move only a visual ring, never DOM focus. **Proposal.** Remove role=application. Wrap each week in role=row, give the day headers role=columnheader, and keep a button inside each gridcell. Start the roving tabindex on today or the selected date, call focus() on the cell when the index changes, and update the index on click. **Done when.** Playwright: Tab reaches the grid, the arrow keys move document.activeElement from day to day, and Enter selects the day.

## <a id="u0339"></a>U0339 — Let Calendar week and agenda views open task details
*Batch 8C · ux · medium · `feature-extension` · effort M.* Week chips are inert divs, '+N' does nothing, the selected-day panel is month-only, and agenda items lack onTextClick. Make chips buttons, wire '+N', and pass the open handler.

### <a id="ux-38"></a>UX-38 — Calendar week and agenda views offer no way to open a task
*medium · `feature-extension` · effort M.* **Where:** `src/components/views/CalendarView.tsx:794-816`; `src/components/views/CalendarView.tsx:852-870`; `src/components/views/CalendarView.tsx:884`. **Problem.** In week view, clicking a task chip only calls setSelectedDate, and the selected-day panel renders only in month view, so nothing visible happens. The '+N' label is inert and the chips are divs that cannot take focus. Agenda TodoItems get no onTextClick, so their details cannot be opened. Only month view's day list opens tasks. **Proposal.** Make week chips buttons that open the details overlay, and make '+N' open that day's list. Show the selected-day panel in week view too. Pass onTextClick, or the shared onOpenTodoDetails from UX-25, to the agenda items. **Done when.** A test: clicking a week chip and clicking an agenda item each open the task details.

## <a id="u0330"></a>U0330 — Align Calendar 'Created' sort direction with List and Kanban
*Batch 11 · bugfix · low · `needs-decision` · effort S.* Calendar sorts created as b - a, so ascending shows newest first, opposite to List and Kanban. Switch to a - b with a desc default. **Question for the owner:** Migrate a stored 'asc' Created direction once so users keep their order, or accept the one-time flip?

### <a id="inc-63"></a>INC-63 — Calendar's 'Created' sort runs opposite to List and Kanban
*low · `bugfix` · effort S.* **Where:** `src/components/views/CalendarView.tsx:158`; `src/components/views/CalendarView.tsx:432-436`; `src/components/views/CalendarView.tsx:917-927`; `src/hooks/useListViewState.ts:608-612`; `src/components/views/KanbanView.tsx:452-453`. **Problem.** Calendar sorts 'created' as b.createdAt - a.createdAt, so 'Ascending' shows the newest first. List and Kanban use a - b, so ascending shows the oldest first. The same direction toggle does opposite things in different views. **Proposal.** Use a.createdAt - b.createdAt in Calendar and make 'desc' the default direction. Users who already have 'asc' stored would see their order flip, so either flip a stored direction once when the sort field is 'created', or accept the one-time change (owner decides). **Done when.** A Calendar test asserts that ascending Created sort lists the oldest todo first, matching List.

### <a id="bug-207"></a>BUG-207 — The Calendar 'Created' sort runs opposite to Priority and Duration
*low · `needs-decision` · effort S.* **Where:** `src/components/views/CalendarView.tsx:420-437`. **Problem.** Ascending lists the newest first for Created only. **Proposal.** Owner picks: use a - b, or default Created to desc. **Done when.** Ascending on created gives [t1, t2].
