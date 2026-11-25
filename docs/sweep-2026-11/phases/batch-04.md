# Batch 4 — Security hardening

23 units, 28 items: 0 high, 9 medium, 14 low. 6 carry a question for the owner (listed in [decisions.md](../decisions.md)).

Each line: unit, name, kind, priority, behaviour tag, effort, workstream, the items it merges. Tick a unit when its commits have landed. How to run a batch is in the [README](../README.md#how-a-batch-is-run).

## Medium priority

- [ ] **U0258** Security unit, held back until fixed · security · medium · `bugfix` · S · view-state · SEC-14
- [ ] **U0126** Security unit, held back until fixed · security · medium · `none` · M · rich-text-html · SEC-11
- [ ] **U0791** Security unit, held back until fixed · security · medium · `bugfix` · S · rich-text-html · BUG-231, SEC-09
- [ ] **U0801** Extract findLinkPatternMatches and a shared LinkChips component · dedup · medium · `bugfix` · M · [rich-text-html](../workstreams/rich-text-html.md#u0801) · DUP-45, STRUCT-23, SEC-19 · moved from 6C
- [ ] **U0808** Security unit, held back until fixed · security · medium · `bugfix` · S · rich-text-html · SEC-10
- [ ] **U0606** Security unit, held back until fixed · security · medium · `needs-decision` · S · security-platform · SEC-23 · **question**
- [x] **U0611** Restrict deploy workflow token to read except the deploy job · security · medium · `none` · S · security-platform · SEC-16 · done ahead of the batch, [see below](#security-units-fixed-ahead-of-this-batch)
- [ ] **U0644** Security unit, held back until fixed · security · medium · `none` · S · security-platform · SEC-17
- [ ] **U0778** Security unit, held back until fixed · security · medium · `none` · M · security-platform · SEC-20

## Low priority

- [ ] **U0008** Security unit, held back until fixed · security · low · `needs-decision` · S · pwa-service-worker · SEC-37, DEAD-48 · **question**
- [ ] **U0554** Security unit, held back until fixed · security · low · `bugfix` · S · recurrence · SEC-25
- [ ] **U0509** Security unit, held back until fixed · security · low · `bugfix` · S · smart-input · SEC-34
- [ ] **U0296** Security unit, held back until fixed · security · low · `feature-extension` · M · rich-text-html · UX-122, SEC-31 · **question**
- [ ] **U0794** Security unit, held back until fixed · security · low · `bugfix` · M · rich-text-html · SEC-27
- [ ] **U0800** Security unit, held back until fixed · security · low · `none` · S · rich-text-html · SEC-28
- [ ] **U0807** Security unit, held back until fixed · security · low · `bugfix` · S · rich-text-html · SEC-26
- [ ] **U0809** Security unit, held back until fixed · security · low · `needs-decision` · M · rich-text-html · SEC-35 · **question**
- [ ] **U0810** Security unit, held back until fixed · security · low · `none` · S · rich-text-html · SEC-29
- [ ] **U0811** Security unit, held back until fixed · bugfix · low · `bugfix` · S · rich-text-html · SEC-30 · moved from 11
- [ ] **U0609** Security unit, held back until fixed · security · low · `none` · S · security-platform · SEC-43
- [ ] **U0641** Security unit, held back until fixed · security · low · `needs-decision` · M · security-platform · SEC-45 · **question**
- [ ] **U0779** Security unit, held back until fixed · docs · low · `none` · S · security-platform · SEC-42
- [ ] **U0780** Security unit, held back until fixed · security · low · `needs-decision` · S · security-platform · SEC-46 · **question**

## Security units fixed ahead of this batch

Their text was held in the untracked local file until the fix had landed.

### <a id="u0611"></a>U0611 — Restrict deploy workflow token to read except the deploy job
*Batch 4 · security · medium · `none` · effort S.* Set top-level contents: read, grant write only to build-and-deploy, and add persist-credentials: false to both checkouts.

**Done on 25 November 2026**, in two steps. Batch 1 set the token to read-only at the top level and gave write access to the deploy job alone, as part of U0610. The [batch 1 follow-up](batch-01.md#follow-ups) added `persist-credentials: false` to both checkouts. The deploy from `main` that followed (commit `b5726b0`, version 0.1.250) ran green, which is this unit's done-when. Two optional parts of the original text are not done; they stay in the local file with their question.

#### <a id="sec-16"></a>SEC-16 — Deploy workflow: read-only token by default, write only for the deploy job, no persisted credentials
*medium · `none` · effort S.* **Where** (line numbers as they were before the fix): `.github/workflows/deploy.yml:9`; `.github/workflows/deploy.yml:10`; `.github/workflows/deploy.yml:7`; `.github/workflows/deploy.yml:22`; `.github/workflows/deploy.yml:31`; `.github/workflows/deploy.yml:40`; `.github/workflows/deploy.yml:51`; `.github/workflows/deploy.yml:60`; `.github/workflows/deploy.yml:68`; `.github/workflows/deploy.yml:70`. **Problem.** contents: write is granted at workflow level, so the read-only verify job holds it too. Neither checkout sets persist-credentials: false, so the token sits in .git/config while npm ci runs: 725 locked packages, 5 with install scripts, plus this repo's postinstall, jest, the eslint plugins and next build. A compromised locked dependency could push to main or create tags. **Proposal.** Set top-level permissions: contents: read, and grant contents: write only on build-and-deploy. Add persist-credentials: false to both checkouts; peaceiris takes github_token explicitly. **Done when.** deploy.yml shows contents: read at top level and write only on the deploy job, and the next push to main deploys successfully.
