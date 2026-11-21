# Batch 6C — Medium fixes: settings, view state, search, platform

35 units, 70 items: 0 high, 35 medium, 0 low. 5 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## Medium priority

- [ ] **U0007** Serve 206 partial responses for cached sounds on Range requests · bugfix · medium · `bugfix` · M · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0007) · SUP-37
- [ ] **U0049** Offer an update that is already waiting when the app starts · bugfix · medium · `bugfix` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0049) · BUG-126, SUP-32
- [ ] **U0052** Reload every open tab when a service-worker update takes control · bugfix · medium · `bugfix` · S · [pwa-service-worker](../workstreams/pwa-service-worker.md#u0052) · SUP-33
- [ ] **U0285** Allow 0 for the Gantt Flow context-switch time · bugfix · medium · `bugfix` · S · [gantt-scheduling](../workstreams/gantt-scheduling.md#u0285) · UX-54, BUG-160 · moved from 6B
- [ ] **U0283** Add shared settings NumberField and checkbox row that commit on blur · bugfix · medium · `bugfix` · L · [settings](../workstreams/settings.md#u0283) · UX-53, DUP-106
- [ ] **U0297** Validate hex colour input before committing it · bugfix · medium · `bugfix` · M · [settings](../workstreams/settings.md#u0297) · UX-57
- [ ] **U0305** Use one add/edit form per settings list with shared validation · dedup · medium · `bugfix` · M · [settings](../workstreams/settings.md#u0305) · DUP-27
- [ ] **U0314** Validate auto-assign free-text defaults and prefer exact matches · bugfix · medium · `bugfix` · M · [settings](../workstreams/settings.md#u0314) · UX-58
- [ ] **U0469** Honour the templates, batch and reordering flags at every entry point · bugfix · medium · `bugfix` · S · [settings](../workstreams/settings.md#u0469) · PART-32
- [ ] **U0231** Share selection state and handle type; clear Notes selection on keyboard exit · bugfix · medium · `bugfix` · M · [view-state](../workstreams/view-state.md#u0231) · DUP-26, STRUCT-57
- [ ] **U0234** Resolve list categories from all projects, including archived ones · bugfix · medium · `bugfix` · S · [view-state](../workstreams/view-state.md#u0234) · BUG-133
- [ ] **U0250** Extract a shared Set-filter codec and name-keyed preset helpers · dedup · medium · `bugfix` · L · [view-state](../workstreams/view-state.md#u0250) · DUP-38, STRUCT-43
- [ ] **U0253** Replace List's relative due-date filter values with stable buckets · bugfix · medium · `needs-decision` · M · [view-state](../workstreams/view-state.md#u0253) · INC-50, BUG-202 · **question**
- [ ] **U0729** Make Calendar default view and Gantt collapse-completed settings apply after first visit · bugfix · medium · `needs-decision` · M · [view-state](../workstreams/view-state.md#u0729) · BUG-134, INC-29, DOC-31, PART-31 · **question**
- [ ] **U0747** Collapse case variants and alternative names into one filter option · bugfix · medium · `needs-decision` · M · [view-state](../workstreams/view-state.md#u0747) · INC-53 · **question**
- [ ] **U0494** Exclude disabled views' collections from command palette results · bugfix · medium · `bugfix` · S · [search](../workstreams/search.md#u0494) · PART-34
- [ ] **U0580** Align search fields across models through one matchesText helper · bugfix · medium · `needs-decision` · M · [search](../workstreams/search.md#u0580) · INC-54, STRUCT-74, BUG-164, INC-58, PART-42 · **question**
- [ ] **U0694** Record only newly added selections into selection history on save · bugfix · medium · `bugfix` · S · [search](../workstreams/search.md#u0694) · BUG-111
- [ ] **U0797** Security unit, held back until fixed · bugfix · medium · `bugfix` · S · rich-text-html · BUG-157, SEC-32
- [ ] **U0805** Respect caret position and selection in list and heading key handlers · bugfix · medium · `bugfix` · M · [rich-text-html](../workstreams/rich-text-html.md#u0805) · BUG-152
- [ ] **U0293** Render Kanban Edit State and Edit View in Modal, requiring names · bugfix · medium · `bugfix` · S · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0293) · UX-44
- [ ] **U0388** Stop Escape in Batch Edit from also clearing the list selection · bugfix · medium · `bugfix` · S · [overlays-dialogs](../workstreams/overlays-dialogs.md#u0388) · BUG-98
- [ ] **U0340** Fix broken tutorial step selectors in Gantt and Notes, add anchor test · bugfix · medium · `bugfix` · S · [keyboard-help](../workstreams/keyboard-help.md#u0340) · MSG-63, UX-100, DEAD-74, DOC-21, STRUCT-58
- [ ] **U0405** Ignore Focus, timer and tutorial keys when Cmd, Ctrl or Alt is held · bugfix · medium · `bugfix` · S · [keyboard-help](../workstreams/keyboard-help.md#u0405) · BUG-99
- [ ] **U0431** Correct help and tutorial copy describing removed or nonexistent UI · docs · medium · `bugfix` · M · [keyboard-help](../workstreams/keyboard-help.md#u0431) · DOC-46, SUP-43, DOC-50, MSG-29, DOC-61
- [ ] **U0435** Fix tutorial Enter double-advance and give the tooltip dialog semantics · bugfix · medium · `bugfix` · S · [keyboard-help](../workstreams/keyboard-help.md#u0435) · UX-45, BUG-131
- [ ] **U0795** Stop Cmd/Ctrl+K in the editor also toggling the command palette · bugfix · medium · `bugfix` · S · [keyboard-help](../workstreams/keyboard-help.md#u0795) · UX-27
- [ ] **U0014** Replace ThemeProvider's one-second storage poll with a settingsStore subscription · bugfix · medium · `bugfix` · S · [visual-system](../workstreams/visual-system.md#u0014) · BUG-182, LOG-23, SUP-47, UX-76
- [ ] **U0227** Fix white text on 400/500 fills that fails contrast · bugfix · medium · `bugfix` · S · [visual-system](../workstreams/visual-system.md#u0227) · UX-79
- [ ] **U0659** Use getTextColor for text over user-chosen colours · bugfix · medium · `bugfix` · S · [visual-system](../workstreams/visual-system.md#u0659) · UX-81
- [ ] **U0765** Declare color-scheme for light and dark themes in globals.css · bugfix · medium · `bugfix` · S · [visual-system](../workstreams/visual-system.md#u0765) · UX-75, SUP-81
- [ ] **U0770** Make slide-up and slide-down keyframes vertical-only to stop sideways jumps · bugfix · medium · `bugfix` · S · [visual-system](../workstreams/visual-system.md#u0770) · UX-26
- [ ] **U0702** Fix list header counts and empty states across Notes, entities, sprints, reviews · bugfix · medium · `needs-decision` · M · [feedback-states](../workstreams/feedback-states.md#u0702) · UX-36, BUG-108, MSG-20, MSG-22, DEAD-34 · **question**
- [ ] **U0447** Drive the disabled-view redirect and tab restore from getEnabledViews · bugfix · medium · `bugfix` · M · [app-shell](../workstreams/app-shell.md#u0447) · DUP-31, STRUCT-25, BUG-101, INC-62, PART-33
- [ ] **U0482** Fall back to the list when a selected note or review is gone · bugfix · medium · `bugfix` · S · [app-shell](../workstreams/app-shell.md#u0482) · BUG-102
