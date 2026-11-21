# Batch 6B — Medium fixes: views

33 units, 54 items: 0 high, 33 medium, 0 low. 8 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## Medium priority

- [ ] **U0189** Count only surviving todos in the note card progress · bugfix · medium · `bugfix` · S · [notes](../workstreams/notes.md#u0189) · BUG-161
- [ ] **U0655** Stop note inputs offering 'Add new' through no-op callbacks · bugfix · medium · `bugfix` · S · [notes](../workstreams/notes.md#u0655) · BUG-105 · **question**
- [ ] **U0697** Navigate away from note detail only after delete or convert is confirmed · bugfix · medium · `bugfix` · M · [notes](../workstreams/notes.md#u0697) · MSG-82, BUG-107, UX-30, INC-61 · **question**
- [ ] **U0700** Clear notes selection when Escape leaves selection mode · bugfix · medium · `bugfix` · S · [notes](../workstreams/notes.md#u0700) · BUG-110
- [ ] **U0704** Make notes Select all select the rendered notes under every quick filter · bugfix · medium · `bugfix` · S · [notes](../workstreams/notes.md#u0704) · BUG-109
- [ ] **U0573** Stop review entry collapse from logging activity and bumping updatedAt · bugfix · medium · `needs-decision` · S · [reviews](../workstreams/reviews.md#u0573) · INC-38, BUG-168, LOG-33 · **question**
- [ ] **U0716** Open the existing review when the custom date picker picks a reviewed period · bugfix · medium · `bugfix` · S · [reviews](../workstreams/reviews.md#u0716) · BUG-119
- [ ] **U0719** Commit the custom review date only on explicit, valid confirmation · bugfix · medium · `bugfix` · S · [reviews](../workstreams/reviews.md#u0719) · BUG-120, UX-31
- [ ] **U0417** Fix sprint burndown empty state and today cutoff; explain locked fields · bugfix · medium · `bugfix` · S · [sprints](../workstreams/sprints.md#u0417) · BUG-132, UX-124
- [ ] **U0149** Give Kanban drags undo, the archive dependency check and unfiltered WIP counts · bugfix · medium · `needs-decision` · M · [kanban](../workstreams/kanban.md#u0149) · INC-26, BUG-86, BUG-94 · **question**
- [ ] **U0157** Clear stale completedAt and archivedAt on Kanban moves · bugfix · medium · `bugfix` · S · [kanban](../workstreams/kanban.md#u0157) · BUG-87
- [ ] **U0215** Expose all Kanban filter options; order List priorities and label dependency chips · bugfix · medium · `feature-extension` · S · [kanban](../workstreams/kanban.md#u0215) · INC-46, UX-37, PART-26
- [ ] **U0217** Reset Kanban's sprint filter when its sprint is archived or deleted · bugfix · medium · `bugfix` · S · [kanban](../workstreams/kanban.md#u0217) · BUG-91
- [ ] **U0218** Stop Kanban's 'Later' due-date filter matching overdue todos · bugfix · medium · `bugfix` · S · [kanban](../workstreams/kanban.md#u0218) · INC-27, BUG-92
- [ ] **U0223** Report refused Kanban moves instead of announcing success · bugfix · medium · `bugfix` · S · [kanban](../workstreams/kanban.md#u0223) · MSG-18, BUG-197
- [ ] **U0294** Hide empty Kanban columns when Show empty columns is off · bugfix · medium · `bugfix` · S · [kanban](../workstreams/kanban.md#u0294) · PART-25
- [ ] **U0353** Schedule Gantt work against work-hour bounds, not display bounds · bugfix · medium · `bugfix` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0353) · BUG-136
- [ ] **U0355** Stop Gantt flagging conflicts from earlier tracked segments · bugfix · medium · `bugfix` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0355) · BUG-138
- [ ] **U0361** Make Gantt dependency arrows render with valid SVG coordinates · bugfix · medium · `bugfix` · M · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0361) · BUG-139
- [ ] **U0381** Pass a minute-resolution now into the Gantt scheduler memos · bugfix · medium · `bugfix` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0381) · BUG-137
- [ ] **U0387** Stop marking every undated task overdue on today's Gantt view · bugfix · medium · `needs-decision` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0387) · BUG-140 · **question**
- [ ] **U0336** Keep Calendar week view populated and make header arrows view-aware · bugfix · medium · `bugfix` · S · [calendar](../workstreams/calendar.md#u0336) · BUG-141 · **question**
- [ ] **U0277** Make Focus test sounds and ambient preview follow the volume sliders · bugfix · medium · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0277) · UX-56
- [ ] **U0278** Stop Focus quick-extend options re-sorting and de-duplicating on each keystroke · bugfix · medium · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0278) · BUG-159, UX-55
- [ ] **U0367** Attribute multi-project and multi-person tracked time by one shared rule · bugfix · medium · `needs-decision` · M · [stats-time-focus](../workstreams/stats-time-focus.md#u0367) · BUG-142, INC-56 · **question**
- [ ] **U0371** Parse the Time Reports custom-period label dates as local dates · bugfix · medium · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0371) · MSG-21, UX-114, BUG-209
- [ ] **U0373** Fix Time Reports daily chart day count and long-period window · bugfix · medium · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0373) · BUG-143
- [ ] **U0399** Prevent Focus auto-tracking from opening a second time entry · bugfix · medium · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0399) · BUG-129
- [ ] **U0401** Show the break confirmation only when a break item comes next · bugfix · medium · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0401) · BUG-128
- [ ] **U0732** Pass the user's sound volume to focus confirmation reminders · bugfix · medium · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0732) · BUG-127
- [ ] **U0749** Count only completed segments toward the open-timer long-break cadence · bugfix · medium · `bugfix` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0749) · BUG-130
- [ ] **U0761** Unlock focus audio on first user gesture for Safari and iOS · bugfix · medium · `bugfix` · M · [stats-time-focus](../workstreams/stats-time-focus.md#u0761) · SUP-38
- [ ] **U0737** Drive due-task notification polling from the checkInterval setting · bugfix · medium · `needs-decision` · S · [notifications](../workstreams/notifications.md#u0737) · DOC-20, STRUCT-28, SUP-57, PART-30, DEAD-25 · **question**
