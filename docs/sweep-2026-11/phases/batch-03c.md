# Batch 3C — Critical fixes: dialogs, Escape, key handlers, help digits

18 units, 75 items: 14 high, 4 medium, 0 low. 8 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [ ] **U0480** Confirm person, project and sprint deletes from their detail overlays · bugfix · high · `needs-decision` · M · [undo-confirm](../workstreams/undo-confirm.md#u0480) · STRUCT-11, INC-08, BUG-26, PART-03, MSG-02, UX-09 · **question** · moved from 3A
- [ ] **U0212** Route Kanban, Gantt and Calendar task details through TodoApp's single overlay · bugfix · high · `needs-decision` · L · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0212) · BUG-96, UX-25, BUG-95, PART-22, STRUCT-07, INC-25, DUP-19 · **question**
- [ ] **U0226** Move hand-built dialogs onto Modal and define one z-index scale · bugfix · high · `needs-decision` · L · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0226) · STRUCT-08, UX-23, MSG-46, DUP-60 · **question**
- [ ] **U0404** Suspend Focus mode keys while task details are open over it · bugfix · high · `bugfix` · S · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0404) · BUG-11
- [ ] **U0420** Close the sprint overlay before opening a todo's details from it · bugfix · high · `bugfix` · S · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0420) · BUG-45
- [ ] **U0461** Close Add Todo through closeAddOverlay from backdrop and X · bugfix · high · `bugfix` · S · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0461) · DOC-15, DEAD-04, MSG-19, UX-01, BUG-25
- [ ] **U0462** Move the Add Todo, Person, Project, Sprint and preset dialogs onto Modal · a11y · high · `bugfix` · L · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0462) · DUP-29, STRUCT-06, UX-22 · moved from 8B
- [ ] **U0466** Give Escape a single owner that closes only the topmost layer · bugfix · high · `needs-decision` · L · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0466) · BUG-41, UX-02, STRUCT-10 · **question**
- [ ] **U0337** Stop Gantt and Calendar key handlers swallowing typing, buttons and overlays · bugfix · high · `needs-decision` · M · [keyboard-help](../workstreams/keyboard-help.md#u0337) · BUG-43, INC-15, BUG-42, UX-04, SUP-15, PART-09, DOC-16, BUG-100, UX-28 · **question**
- [ ] **U0433** Derive every Help and tutorial view digit from the registry by view id · bugfix · high · `bugfix` · M · [keyboard-help](../workstreams/keyboard-help.md#u0433) · UX-47, MSG-10, BUG-220, PART-37, DOC-09, DUP-32, SUP-40, DEAD-75
- [ ] **U0446** Stop the tutorial button crashing the app on Stats and Time · bugfix · high · `bugfix` · M · [keyboard-help](../workstreams/keyboard-help.md#u0446) · DEAD-02, DOC-08, STRUCT-04, SUP-09, PART-08, BUG-44 · **question**
- [ ] **U0463** Suppress global single-key shortcuts while dialogs or selects have focus · bugfix · high · `bugfix` · M · [keyboard-help](../workstreams/keyboard-help.md#u0463) · UX-05, BUG-198, BUG-97
- [ ] **U0230** Give tinted priority and status chips contrast-checked text colours · bugfix · high · `bugfix` · S · [visual-system](../workstreams/visual-system.md#u0230) · UX-24
- [ ] **U0473** Mount the storage error banner app-wide above overlays, replaying failures · bugfix · high · `bugfix` · M · [feedback-states](../workstreams/feedback-states.md#u0473) · LOG-08

## Medium priority

- [ ] **U0262** Add Notes and Reviews view toggles, deriving GeneralTab toggles from the registry · feature · medium · `feature-extension` · M · [settings](../workstreams/settings.md#u0262) · DUP-69, SUP-45, DOC-54, UX-62, PART-35, DEAD-76, MSG-51, DEAD-79 · moved from 10
- [ ] **U0443** Render the Views help from the view registry, adding Notes, Reviews, Time · docs · medium · `feature-extension` · M · [keyboard-help](../workstreams/keyboard-help.md#u0443) · SUP-41, PART-52, DOC-53 · **question** · moved from 8A
- [ ] **U0467** Make N, /, f, d and Escape shortcuts work consistently across views · feature · medium · `needs-decision` · M · [keyboard-help](../workstreams/keyboard-help.md#u0467) · PART-36, INC-28, UX-108, MSG-49, BUG-199 · **question** · moved from 8A
- [ ] **U0745** Pick text colour by WCAG contrast ratio in getTextColor · a11y · medium · `bugfix` · S · [visual-system](../workstreams/visual-system.md#u0745) · UX-80 · moved from 8B
