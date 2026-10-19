# Tick deletes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A tick deletes the item; Stash has no bought items, no trip end and no saved items.

**Architecture:** Pure state rules in `src/store.js`, `src/storage.js`, `src/shops.js`, `src/aisles.js`, `src/suggest.js` first, under unit tests; then the screen, the locales and `docs/spec/`. `npm test` green after each commit.

**Tech Stack:** Plain HTML, CSS, ES modules, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-19-no-carry-over-design.md`

## Global Constraints

- Item `{ id, name, shops, quantity, aisle }`; state `{ version: 11, items, group, sort, aisles }`.
- Load and import read versions 1 to 11; saved and ticked items are dropped; `next` items are kept; the stored state is version 11.
- Spanish texts: `"name" comprado.` with `Deshacer`; subtitle `N artículos` / `La lista está vacía`; add sheet `ya en la lista`. The six other languages get the same meaning.
- Each commit that touches `src/`, `sw.js`, `index.html` or `manifest.webmanifest` also changes `docs/spec/` (pre-commit hook, ENG-13). Removed rules become `- **X-N** Removed: <reason>.` lines.
- Commit messages: imperative, capitalised, no prefix, no period, a body for a behaviour change, no attribution.
- No release, no push.

## Review Focus

- A Stash v10 state with saved and ticked items loads with only the items to buy, each with its shops, quantity and aisle (Task 1).
- A Bodega backup with `next`, `saved`, ticked, and ticked-with-`again` items imports with the right items to buy (Task 1).
- A tick in a shop list deletes the item from every shop; `Deshacer` puts it back in its place in `items` (Task 2).
- A tick of the last item of a shop list shows the end card or the empty state, and the chip goes (Task 2).
- The arrival message and the dock and chip counts count the items (Task 2).

---

### Task 1: State with items to buy only

**Files:** `src/store.js`, `src/storage.js`, `src/shops.js`, `src/aisles.js`, `src/suggest.js` and their tests, `docs/spec/02-data-model.md`, `docs/spec/03-lists.md`, `docs/spec/04-arrange.md`, `docs/spec/05-shops.md`, `docs/spec/08-storage.md`, `docs/spec/17-aisles.md`.

**Interfaces — Produces:** `emptyState()` → `{ version: 11, items: [], group: 'shop', sort: 'custom', aisles: [] }`; `addItem` → item `{ id, name, shops: [], quantity: '', aisle: '' }`; `tickItem(state, id)` → `{ state }` without the item, or `error.itemNotFound`; `activeItems(state)` → the items in the order of `sort`; group views (`shopGroups`, `aisleGroups`) give `{ ..., items, total }` with no `left`; `shopChips` and `nextShop` count items. Removed: `toggleBought`, `startNewShopping`, `canStartNewShopping`, `openItems`, `bringToList`, `tripOutcome`, `tripSummary` (or `{ total }` only, the implementer's choice, stated in the spec).

- [ ] **Step 1: Failing tests**: `tickItem removes the item and keeps the order of the others`; `tickItem of an unknown id gives error.itemNotFound`; `addItem gives an item with no list and no bought`; `a version 10 state drops its saved and ticked items`; `a Bodega backup keeps next items and items unticked by again, and drops saved and ticked items`; `the stored state is version 11`; `version 12 is not a backup`; `APP_KEYS has no tripEnd key`. Rewrite or delete each test of a removed function.
- [ ] **Step 2:** `npm test`. Expected: the new tests fail.
- [ ] **Step 3: Implement** the Produces block. Keep `normalizeItem` reading `list`, `bought`, `again`, `recurrent` of old states, then drop them.
- [ ] **Step 4:** `npm test` green. A UI module that imports a removed function gets the minimal fix; Task 2 rebuilds the screen.
- [ ] **Step 5: Commit** `Keep only the items to buy in the state`, with the spec rules.

### Task 2: A tick deletes on the screen

**Files:** `src/ui/*.js`, `src/app.js`, `src/onboarding.js`, `src/sections.js` if needed, `index.html`, `styles.css`, `icons.svg`, `src/locales/*.js`, `tests/markup.test.js`, `tests/onboarding.test.js`, `tests/i18n.test.js`, `tests/layer-order.test.js`, `docs/spec/03-lists.md`, `docs/spec/05-shops.md`, `docs/spec/07-screen.md`, `docs/spec/11-integrations.md`, `docs/spec/15-design-system.md`, `CHANGELOG.md`.

**Interfaces — Consumes:** Task 1.

- [ ] **Step 1: Failing tests**: `tests/onboarding.test.js` `PAGES` is `['lists', 'row', 'shops']`; `tests/markup.test.js`: no `#trip`, `#trip-button`, `#finish`, `#trip-end`; `Ajustes` has five groups; five sheets.
- [ ] **Step 2:** `npm test`. Expected: those fail.
- [ ] **Step 3: Implement** the spec's Behaviour. The tick calls `tickItem` with `undoText` `"name" comprado.`. Remove the bought section, the trip button, sheet and banner, the trip-end setting, the outcome texts; remove every locale key, CSS part, icon and id that no code uses then.
- [ ] **Step 4:** `npm test` green.
- [ ] **Step 5: Browser check** with `python3 -m http.server` at 390×844 (agent-browser): add, tick, `Deshacer`, a shop list that empties, the add sheet, `Ajustes`, the walkthrough, an import of a Bodega backup with saved and ticked items. Unregister the service worker and delete its caches before each reload, and open a new URL (`?v=N`) so no module comes from the memory cache. Look at each screenshot.
- [ ] **Step 6: Commit** `Delete an item when it is ticked`, with a line under `Unreleased` in `CHANGELOG.md`.
