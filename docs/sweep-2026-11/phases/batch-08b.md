# Batch 8B — UI: accessibility and keyboard access

30 units, 40 items: 4 high, 19 medium, 7 low. 5 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [ ] **U0790** Make RichTextEditor display mode keyboard-editable and name the editor · a11y · high · `bugfix` · S · [rich-text-html](../workstreams/rich-text-html.md#u0790) · UX-20
- [ ] **U0027** Make import drop zone and Notes section rename keyboard-operable · a11y · high · `bugfix` · S · [accessibility](../workstreams/accessibility.md#u0027) · UX-21
- [ ] **U0196** Make the completion checkbox a visible, labelled, keyboard-operable control · a11y · high · `bugfix` · M · [accessibility](../workstreams/accessibility.md#u0196) · UX-18
- [ ] **U0197** Make every record row and editable title operable from the keyboard · a11y · high · `feature-extension` · L · [accessibility](../workstreams/accessibility.md#u0197) · PART-38, UX-19

## Medium priority

- [ ] **U0508** Give SmartInput textbox, accessible name and combobox listbox semantics · a11y · medium · `bugfix` · M · [smart-input](../workstreams/smart-input.md#u0508) · UX-50
- [ ] **U0722** Add keyboard and touch move-up/down controls for todo and note reordering · a11y · medium · `feature-extension` · M · [todos-core](../workstreams/todos-core.md#u0722) · UX-92
- [ ] **U0224** Let keyboard moves jump to any allowed column and add Move to… · a11y · medium · `feature-extension` · M · [kanban](../workstreams/kanban.md#u0224) · UX-40
- [ ] **U0331** Give the Calendar grid real grid semantics and roving keyboard focus · a11y · medium · `bugfix` · M · [calendar](../workstreams/calendar.md#u0331) · UX-39
- [ ] **U0273** Replace three hand-written settings toggle styles with one named ToggleSwitch · a11y · medium · `needs-decision` · M · [settings](../workstreams/settings.md#u0273) · UX-60, MSG-43, DUP-68 · **question**
- [ ] **U0199** Add accessible names to icon-only controls and both rich text editors · a11y · medium · `none` · M · [accessibility](../workstreams/accessibility.md#u0199) · MSG-42, UX-67
- [ ] **U0271** Associate form labels with their controls through a shared Field component · a11y · medium · `none` · L · [accessibility](../workstreams/accessibility.md#u0271) · UX-59, MSG-44
- [ ] **U0284** Enlarge and name destructive and reorder micro-buttons to 24px minimum · a11y · medium · `none` · S · [accessibility](../workstreams/accessibility.md#u0284) · UX-73
- [ ] **U0665** Apply icons' aria-hidden default and give unlabelled Modals a name · a11y · medium · `needs-decision` · S · [accessibility](../workstreams/accessibility.md#u0665) · UX-71, DEAD-50 · **question**
- [ ] **U0667** Make InfoTooltip an accessible, hoverable, Escape-dismissable toggletip · a11y · medium · `bugfix` · M · [accessibility](../workstreams/accessibility.md#u0667) · UX-70, MSG-47, DEAD-52
- [ ] **U0680** Give SearchableDropdown and search history combobox semantics and keyboard reach · a11y · medium · `bugfix` · M · [accessibility](../workstreams/accessibility.md#u0680) · UX-51
- [ ] **U0681** Expose toggle, selected and expanded states; close menus on Escape · a11y · medium · `none` · M · [accessibility](../workstreams/accessibility.md#u0681) · UX-68
- [ ] **U0772** Rework the coarse-pointer touch-target rule to enlarge hit areas only · a11y · medium · `bugfix` · M · [accessibility](../workstreams/accessibility.md#u0772) · UX-72
- [ ] **U0774** Remove viewport maximumScale so pinch-zoom works · a11y · medium · `needs-decision` · S · [accessibility](../workstreams/accessibility.md#u0774) · UX-74, SUP-49 · **question**
- [ ] **U0279** Raise dark-mode secondary text contrast from zinc-500 to zinc-400 · a11y · medium · `bugfix` · M · [visual-system](../workstreams/visual-system.md#u0279) · UX-77
- [ ] **U0358** Raise sub-11px labels to the type floor and fix SprintProgress contrast · a11y · medium · `none` · M · [visual-system](../workstreams/visual-system.md#u0358) · UX-83
- [ ] **U0799** Raise zinc-400 icons, hints and completed titles to contrast minimums · a11y · medium · `bugfix` · S · [visual-system](../workstreams/visual-system.md#u0799) · UX-78
- [ ] **U0676** Announce toasts through persistent live regions and keep errors visible · a11y · medium · `bugfix` · M · [feedback-states](../workstreams/feedback-states.md#u0676) · UX-42, MSG-45 · **question**
- [ ] **U0448** Make the view tab bar scroll, follow the tabs pattern, unnest buttons · a11y · medium · `bugfix` · M · [app-shell](../workstreams/app-shell.md#u0448) · UX-69

## Low priority

- [ ] **U0228** Stop the Kanban card aria-label hiding the card content · a11y · low · `none` · S · [kanban](../workstreams/kanban.md#u0228) · UX-132
- [ ] **U0338** Make Gantt keyboard selection move focus and announce the selected task · a11y · low · `none` · M · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0338) · UX-102
- [ ] **U0369** Make Statistics and Time Reports chart values visible and accessible · a11y · low · `feature-extension` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0369) · UX-104
- [ ] **U0407** Announce focus timer phase changes and remaining time to screen readers · a11y · low · `none` · S · [stats-time-focus](../workstreams/stats-time-focus.md#u0407) · UX-99
- [ ] **U0266** Fix settings page landmarks and the mobile drawer's dialog semantics · a11y · low · `none` · S · [settings](../workstreams/settings.md#u0266) · UX-101
- [ ] **U0792** Give the RichTextEditor toolbar toolbar semantics, labels and active states · a11y · low · `none` · M · [rich-text-html](../workstreams/rich-text-html.md#u0792) · UX-119
- [ ] **U0438** Add a setting to turn off single-key shortcuts · a11y · low · `needs-decision` · M · [keyboard-help](../workstreams/keyboard-help.md#u0438) · UX-103 · **question**
