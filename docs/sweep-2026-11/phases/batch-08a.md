# Batch 8A — UI: overlays, keyboard and help, feedback states, app shell

25 units, 34 items: 0 high, 13 medium, 12 low. 9 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## Medium priority

- [ ] **U0422** Replace five outside-click mechanisms with one Popover primitive · restructure · medium · `needs-decision` · M · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0422) · STRUCT-39 · **question**
- [ ] **U0432** Make tutorial hints match whether highlighted elements can be clicked · ux · medium · `needs-decision` · M · [keyboard-help](../workstreams/keyboard-help.md#u0432) · UX-46 · **question**
- [ ] **U0439** Render the keyboard reference and focus hints from one shortcut registry · dedup · medium · `feature-extension` · L · [keyboard-help](../workstreams/keyboard-help.md#u0439) · DOC-45, SUP-42, PART-53, DUP-33, STRUCT-56, MSG-30 · **question**
- [ ] **U0009** Make render-crash recovery useful: view boundary, global-error, data rescue · feature · medium · `feature-extension` · L · [feedback-states](../workstreams/feedback-states.md#u0009) · SUP-31, LOG-28
- [ ] **U0010** Show plain-language error messages instead of raw exception text · ux · medium · `none` · S · [feedback-states](../workstreams/feedback-states.md#u0010) · MSG-31
- [ ] **U0242** Show a no-results state in List and keep the active Overdue chip · ux · medium · `feature-extension` · S · [feedback-states](../workstreams/feedback-states.md#u0242) · UX-35
- [ ] **U0471** Confirm a new todo with a toast and flag when filters hide it · ux · medium · `feature-extension` · S · [feedback-states](../workstreams/feedback-states.md#u0471) · UX-94
- [ ] **U0211** Standardise view and overlay props on Model types instead of raw records · restructure · medium · `none` · M · [app-shell](../workstreams/app-shell.md#u0211) · STRUCT-41
- [ ] **U0342** Stop passing settings fields as separate props alongside settings · restructure · medium · `none` · M · [app-shell](../workstreams/app-shell.md#u0342) · STRUCT-42 · **question**
- [ ] **U0343** Standardise callback prop names on on&lt;Verb>&lt;Noun> across views · restructure · medium · `none` · M · [app-shell](../workstreams/app-shell.md#u0343) · STRUCT-40
- [ ] **U0453** Split TodoApp into focused hooks and components · restructure · medium · `none` · L · [app-shell](../workstreams/app-shell.md#u0453) · STRUCT-16
- [ ] **U0478** Build TodoActionProps once with time-tracking gating and spread it · dedup · medium · `none` · S · [app-shell](../workstreams/app-shell.md#u0478) · DUP-53
- [ ] **U0483** Fold TodoApp's duplicated convert and delete-confirm handlers into helpers · dedup · medium · `none` · S · [app-shell](../workstreams/app-shell.md#u0483) · DUP-52

## Low priority

- [ ] **U0392** Extract a shared ModalHeader whose close button always has an accessible name · dedup · low · `bugfix` · M · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0392) · DUP-114
- [ ] **U0674** Protect form dialog drafts from accidental backdrop clicks · ux · low · `needs-decision` · S · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0674) · UX-126 · **question**
- [ ] **U0209** Make tutorials and tooltips match real behaviour; add Shift+click range selection · feature · low · `needs-decision` · M · [keyboard-help](../workstreams/keyboard-help.md#u0209) · PART-55 · **question**
- [ ] **U0341** Use or remove unreferenced data-tutorial anchors, adding Notes tutorial steps · feature · low · `feature-extension` · S · [keyboard-help](../workstreams/keyboard-help.md#u0341) · PART-54, DEAD-73 · **question**
- [ ] **U0440** Add shared Help primitives for kbd, cards, steps and shortcut tables · dedup · low · `none` · M · [keyboard-help](../workstreams/keyboard-help.md#u0440) · DUP-113
- [ ] **U0793** Show platform-correct modifier keys in shortcut hints · ux · low · `none` · S · [keyboard-help](../workstreams/keyboard-help.md#u0793) · SUP-85
- [ ] **U0660** Adopt EmptyState everywhere and give each empty state an action · ux · low · `needs-decision` · M · [feedback-states](../workstreams/feedback-states.md#u0660) · PART-61, UX-106, INC-75 · **question**
- [ ] **U0662** Distinguish 'none exist' from 'all excluded' in dropdown empty messages · ux · low · `none` · S · [feedback-states](../workstreams/feedback-states.md#u0662) · MSG-69
- [ ] **U0728** Give each toast its own dismiss timer · bugfix · low · `bugfix` · S · [feedback-states](../workstreams/feedback-states.md#u0728) · BUG-169
- [ ] **U0449** Inline the ViewTabs icon wrapper components into VIEW_ICONS · dedup · low · `none` · S · [app-shell](../workstreams/app-shell.md#u0449) · DUP-121
- [ ] **U0474** Trim the header tagline, announce loading, and label review back buttons · ux · low · `needs-decision` · S · [app-shell](../workstreams/app-shell.md#u0474) · UX-113 · **question**
- [ ] **U0158** Prefix generic hook return keys and drop unused settings returns · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0158) · STRUCT-77 · moved from 7A
