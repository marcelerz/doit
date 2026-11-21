# Batch 7A — Consolidation: general hygiene (helpers, naming, layout)

31 units, 43 items: 0 high, 6 medium, 25 low. 1 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## Medium priority

- [ ] **U0481** Create a strings module and write down copy conventions · restructure · medium · `none` · M · [strings](../workstreams/strings.md#u0481) · MSG-34
- [ ] **U0103** Tighten type safety in import, undo and storage code · restructure · medium · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0103) · SUP-69
- [ ] **U0140** Give every domain-hook function a stable identity · restructure · medium · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0140) · STRUCT-30, INC-84
- [ ] **U0148** Add updateById and applyOrder helpers for hook collection updates · dedup · medium · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0148) · DUP-40
- [ ] **U0245** Factor repeated TodoItem prop bundles and use SectionHeader in ListView · dedup · medium · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0245) · DUP-62
- [ ] **U0757** Unify id generation in idGenerator with branded returns and no timestamps · restructure · medium · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0757) · DOC-69, DUP-80, STRUCT-52, INC-85

## Low priority

- [ ] **U0207** Define duplicated UI labels once per component · dedup · low · `none` · M · [strings](../workstreams/strings.md#u0207) · MSG-72
- [ ] **U0015** Share one byte, duration and relative-time formatter across components · dedup · low · `needs-decision` · S · [code-hygiene](../workstreams/code-hygiene.md#u0015) · MSG-73, DUP-93, DUP-94 · **question**
- [ ] **U0163** Share comment, activity and date-display helpers across models · dedup · low · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0163) · DUP-84
- [ ] **U0187** Declare the EntityCounts type once in useEntityCounts and import it · dedup · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0187) · DUP-122
- [ ] **U0249** Move shared view-state, entity and backup types into src/types · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0249) · STRUCT-68
- [ ] **U0322** Return branded types and explicit return types from model getters · restructure · low · `none` · M · [code-hygiene](../workstreams/code-hygiene.md#u0322) · STRUCT-72
- [ ] **U0347** Move pure helpers out of Gantt, WorkHours, TimeReports and Calendar · dedup · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0347) · STRUCT-98
- [ ] **U0375** Align naming and default-constant conventions in src/types · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0375) · STRUCT-88
- [ ] **U0497** Add the 'use client' directive to the eight hook-using files lacking it · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0497) · STRUCT-90
- [ ] **U0511** Convert default-exported components to named exports; rename SmartEditableInput · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0511) · STRUCT-92
- [ ] **U0514** Adopt one import-path rule and enforce it with ESLint · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0514) · STRUCT-109
- [ ] **U0557** Remove unused createModels plumbing from useEntityManager and share entity shape · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0557) · DUP-81, STRUCT-79, DEAD-55
- [ ] **U0559** Return null from hook lookups that find nothing · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0559) · STRUCT-78
- [ ] **U0577** Standardise model _raw fields and raw getters; drop raw_DONOTUSE · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0577) · STRUCT-69, DOC-67
- [ ] **U0578** Give every model one createXModels factory; drop test-only singular factories · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0578) · STRUCT-70, DEAD-66
- [ ] **U0588** Make defensive array guards in models consistent · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0588) · STRUCT-75
- [ ] **U0590** Replace truthiness checks on numbers and strings with explicit comparisons · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0590) · STRUCT-84
- [ ] **U0661** Drive EntityMetadataFields' four blocks from a field config · dedup · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0661) · DUP-116
- [ ] **U0672** Extract a shared FieldHeading for detail overlay field headings · dedup · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0672) · DUP-115
- [ ] **U0735** Merge sortByUsage and sortStringsByUsage into one comparator · dedup · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0735) · DUP-87
- [ ] **U0736** Move non-hook helpers out of src/hooks and rename usePomodoroTimer.ts · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0736) · STRUCT-80
- [ ] **U0754** Use import type for type-only model imports in utils · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0754) · STRUCT-87
- [ ] **U0759** Share one base-path helper instead of hard-coded /doit checks · dedup · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0759) · STRUCT-102, DUP-96
- [ ] **U0802** Consolidate regex and HTML escape helpers into single modules · dedup · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0802) · DUP-76, STRUCT-107
- [ ] **U0812** Align util module conventions for function style and name suffixes · restructure · low · `none` · S · [code-hygiene](../workstreams/code-hygiene.md#u0812) · STRUCT-114
