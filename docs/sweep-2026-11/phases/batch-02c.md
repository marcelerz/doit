# Batch 2C — Data safety: two tabs open at once

4 units, 11 items: 1 high, 2 medium, 1 low. 1 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## High priority

- [ ] **U0071** Move every persisted collection onto createSharedStore for cross-tab safety · bugfix · high · `needs-decision` · L · [cross-tab](../workstreams/cross-tab.md#u0071) · DOC-24, DUP-24, STRUCT-03, BUG-07, INC-11, PART-07, SUP-05, SEC-06 · **question**

## Medium priority

- [ ] **U0017** Broadcast data replacement so other tabs stop saving stale data · bugfix · medium · `bugfix` · M · [cross-tab](../workstreams/cross-tab.md#u0017) · SUP-24
- [ ] **U0072** Open the sharedStore BroadcastChannel eagerly so reader tabs hear changes · bugfix · medium · `bugfix` · S · [cross-tab](../workstreams/cross-tab.md#u0072) · DOC-17

## Low priority

- [ ] **U0073** Protect a pending local settings write from external change reloads · bugfix · low · `bugfix` · S · [cross-tab](../workstreams/cross-tab.md#u0073) · BUG-173
