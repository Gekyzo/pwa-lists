# Lists as the first level Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The first level of `Listas` shows the lists that the user creates; items live inside one list; shops go away.

**Architecture:** A list is a record `{ id, name }` of `state.lists`, and an item points at it with `item.list`. A new pure module `src/lists.js` holds the list operations and replaces `src/shops.js`. The screen keeps one section `Listas` with two levels: `ui.list === null` is the first level (a new view `src/ui/lists.js`), and a list id is the inside of that list, which reuses today's rows through `lists.listState` in the place of `shops.shopState`.

**Tech Stack:** Plain HTML, CSS, ES modules, `node:test`. No dependency.

**Spec:** `docs/superpowers/specs/2026-10-23-lists-first-level-design.md`

## Global Constraints

- `npm test` green after each task; one commit for each task, with a body (GIT.md). No push, no release.
- A commit that changes `src/`, `sw.js`, `index.html`, `manifest.webmanifest` or `src/locales/es.js` also changes `docs/spec/` (`.githooks/pre-commit`).
- A change the user sees gets a line under `Unreleased` in `CHANGELOG.md`.
- Every new text is a key in all seven catalogs of `src/locales/`, with the placeholders of `es.js`. `tests/i18n.test.js` fails on an unused key: remove the keys that the change leaves unused.
- No text names shopping (`tests/i18n.test.js`). User text goes in through `textContent` only.
- A list name field takes 40 characters (`maxlength="40"`); an item name field keeps 80.
- Rules of `docs/spec/` keep their identifiers: a rule that goes away stays as `**ID** Removed: …` (README, Rule identifiers).
- Tasks 2 to 4 leave the browser app broken between commits (the pure modules change first). The app is checked in a browser in Task 7 only.

## Review Focus

- A version 11 state with a shop `general` and items with no shop: one list `general`, no second `General` (Task 2 test).
- `Deshacer` after **Eliminar** of the list in view: the list and its items come back in their places; the screen shows the first level, not a dead list (Task 1 test for the state, Task 7 browser check for the screen).
- An import of a version 12 file whose item points at a missing list, or two items of one list with one name: `error.notBackup`, the data stays (Task 2 test).
- A move of an item to a list that has its name with another case: `error.duplicateItem` with the target list name, state unchanged (Task 1 test).
- A rename of a list that changes only the case is allowed; a rename to another list's name is not (Task 1 test).

---

### Task 1: Pure list operations

**Files:**
- Create: `src/lists.js`, `tests/lists.test.js`, `docs/spec/05-lists-level.md`
- Modify: `index.html` (import map `#lists`; `package.json` maps `#*` already), `sw.js` (`SHELL`), `docs/spec/README.md`, `docs/spec/12-engineering.md` (module row, test row)

**Interfaces:**
- Consumes: `compareNames`, `activeItems`, `SORTS` of `src/store.js`.
- Produces (all pure, `(state, …) → { state }` or `{ state, error }`, never change the input):
  - `LIST_VIEWS = ['rows', 'cards']`
  - `findList(state, id) → List | undefined`
  - `listsInOrder(state) → [List]`: `state.lists` for `listSort: 'custom'`, by `compareNames` of the name for `'name'`.
  - `addList(state, rawName, newId = () => crypto.randomUUID()) → { state, id } | { state, error }`: trimmed; `error.listRequired` when empty; `error.duplicateList` `{ name }` (existing spelling) on a case-insensitive clash; the new list goes to the end of `lists`.
  - `renameList(state, id, rawName)`: `error.listNotFound`, `error.listRequired`, `error.duplicateList`; a change of case only is allowed; the same text returns the same state object.
  - `deleteList(state, id)`: removes the list and each item with `item.list === id`; `error.listNotFound`.
  - `reorderLists(state, ids)`: `ids` is every list id in the new order; `error.invalidOrder` when not a permutation, `error.listNotFound` for an unknown id; with `listSort: 'name'` it starts from the name order and sets `listSort: 'custom'` (as `reorderItems`); the same order returns the same state object.
  - `setListView(state, view)`: `error.unknownView` when not in `LIST_VIEWS`.
  - `setListSort(state, sort)`: `error.unknownSort` when not in `SORTS`.
  - `listState(state, id) → state` with only the items of that list (operations still run on the full state).
  - `listSummary(state, id, size = 3) → { count, names }`: `names` are the first `size` item names in the order of `state.sort`.
  - `moveItem(state, itemId, listId)`: `error.itemNotFound`, `error.listNotFound`, `error.duplicateItem` `{ name: <existing item name>, list: <target list name> }`; the same list returns the same state object; a moved item goes to the end of `items`.

- [ ] **Step 1: Write the failing tests** in `tests/lists.test.js`, in the style of `tests/store.test.js` (a `build` helper, one behaviour each, a check that the input does not change). Cover each produced function and these cases from Review Focus:
  - `renameList(s, id, 'ikea')` for a list `IKEA` gives the name `ikea`; to `Ferretería`'s name in another case gives `error.duplicateList` with `{ name: 'Ferretería' }`.
  - `moveItem` of `Tornillos` into a list holding `tornillos` gives `{ key: 'error.duplicateItem', params: { name: 'tornillos', list: 'Ferretería' } }` and the same state object.
  - `deleteList` then the old state (the `Deshacer` of the screen) holds the list and its items in their old places.
- [ ] **Step 2:** `npm test` — the new tests fail (`Cannot find module` or missing export).
- [ ] **Step 3:** Implement `src/lists.js`; add the `#lists` alias where the other aliases are and `./src/lists.js` to `SHELL`.
- [ ] **Step 4:** Write `docs/spec/05-lists-level.md` with rules `LVL-1…` for each operation above (names, errors, order, delete with items, move), and add `LVL` to the prefix table and the document table of `README.md`. Add the module row (`src/lists.js` — may import `store`) and the test row to `12-engineering.md`.
- [ ] **Step 5:** `npm test` — all pass.
- [ ] **Step 6:** Commit `Add the pure operations of the lists`.

### Task 2: State version 12 and the migration of shops

**Files:**
- Modify: `src/store.js`, `src/storage.js`, `tests/store.test.js`, `tests/storage.test.js`, `tests/spec.test.js` (if a check names shops), `docs/spec/02-data-model.md`, `03-lists.md`, `04-arrange.md`, `08-storage.md`, `11-integrations.md`, the 7 catalogs (`toast.arrival` loses `{list}`)

**Interfaces:**
- Consumes: Task 1 `LIST_VIEWS`, `compareNames`.
- Produces:
  - `emptyState() → { version: 12, lists: [], items: [], group: 'aisle', sort: 'custom', aisles: [], view: 'rows', listSort: 'custom' }`
  - `GROUPS = ['aisle', 'none']`
  - Item `{ id, name, list, quantity, aisle }` — no `shops`.
  - `addItem(state, listId, rawName, newId = …)`: `error.listNotFound` for an unknown list; name unique in that list only; `error.duplicateItem` params `{ name, list: <list name> }`.
  - `renameItem(state, id, rawName)`: unique in the list of the item.
  - `matchesItem(item, query)` matches the name and the aisle only.
  - `arrivalMessage(state) → { key: 'toast.arrival', params: { count } } | null`, `count` = all items.
  - `findByName`, `searchItems`, `filterGroups` unchanged; callers pass `listState(...)`.
  - `load(storage, newId = () => crypto.randomUUID())`, `importJson(text, newId = …)`: accept versions 1 to 12, always return version 12.
  - `SHOP_LISTS_KEY` stays in `APP_KEYS` only, as a retired key that **Borrar todos los datos** still removes; `loadShopLists`/`saveShopLists` go.

- [ ] **Step 1: Write the failing tests.**
  - `tests/store.test.js`: replace the shop expectations; add: two lists may hold `Tornillos` each; `addItem` into a missing list gives `error.listNotFound`; `emptyState()` deep-equals the object above.
  - `tests/storage.test.js`, migration of version 11 (`newId` a counter `l1`, `l2`, …):
    - items with shops `['IKEA']`, `['IKEA', 'Ferretería']`, `[]` give lists `Ferretería`, `IKEA`, `General` in that order; the two-shop item keeps its id in its first shop (`IKEA`) and gets a new id (`newId`) in `Ferretería`; the no-shop item is in `General`.
    - with a shop `general` and an item with no shop: one list `general`, holding both items; no `General`.
    - with every item in a shop: no `General`.
    - `group: 'shop'` or no `group` becomes `'aisle'`; `'none'` stays; `view: 'rows'`, `listSort: 'custom'`.
    - a Bodega version 1 backup still imports (existing tests, updated to the new shape).
  - `tests/storage.test.js`, version 12 validation: an item whose `list` is not a list id, two lists with one name in another case, two items of one list with one name, or a list with an empty name gives `null` from the read (`error.notBackup` from `importJson`); an unknown `view` becomes `'rows'`, an unknown `listSort` `'custom'`, an unknown `group` `'aisle'`.
- [ ] **Step 2:** `npm test` — the new tests fail.
- [ ] **Step 3:** Implement. In `normalizeState(data, newId)`: version 12 validates and cleans `lists` and items with `list`; versions 1 to 11 keep today's cleaning (global unique names, `oneSpelling`), then build the lists. The order of lists by migration: shop names by `compareNames`, `General` last. Each item becomes one item for each of its shops, in its place in `items`. `General` is the literal name, not a catalog text.
- [ ] **Step 4:** Update `docs/spec/02-data-model.md` (state, List, Item, DATA-3 per list, DATA-8/9/12 removed, new DATA rule for `item.list`), `03-lists.md` (LIST-2, LIST-3, LIST-4 into the list in view), `04-arrange.md` (GROUP-1 to `aisle`/`none`, GROUP-11 to GROUP-14 removed), `08-storage.md` (STORE-8 version 12 row and migration, BACKUP-2 fields, the retired `lists.shopLists` row), `11-integrations.md` (ARR-1 text `N elementos pendientes.`). Change `toast.arrival` in the 7 catalogs to drop `{list}`.
- [ ] **Step 5:** `npm test` — all pass.
- [ ] **Step 6:** Commit `Store lists as records and migrate the shops to them`.

### Task 3: Two levels in Listas

The section `Listas` shows the first level or the inside of one list. This task replaces the shop lists of the screen; the cards, the list sheet and the edit picker come in Tasks 4 to 6.

**Files:**
- Create: `src/ui/lists.js`
- Delete: `src/shops.js`, `tests/shops.test.js`
- Modify: `src/ui/context.js`, `src/ui/view.js`, `src/ui/list.js`, `src/ui/rows.js`, `src/ui/drag.js`, `src/ui/add.js`, `src/ui/arrange.js`, `src/ui/edit.js` (drop the shops part only), `src/ui/nav.js`, `src/app.js`, `src/layers.js`, `src/sections.js`, `src/suggest.js` (if needed), `index.html`, `styles.css`, `sw.js` (`SHELL`, `CACHE` to `lists-shell-v4`), `tests/layer-order.test.js`, `tests/sections.test.js`, `tests/markup.test.js`, the 7 catalogs, `docs/spec/05-lists-level.md`, `07-screen.md`, `12-engineering.md`, `10-offline-version.md`, `CHANGELOG.md`

**Interfaces:**
- Consumes: Task 1 `listsInOrder`, `listState`, `listSummary`, `findList`, `deleteList`; Task 2 `addItem(state, listId, name)`.
- Produces:
  - `ui.list`: `null` for the first level, or a list id. `ui.shop`, `ui.doneShop`, `ui.shopPickOpen` and `shopLists`/`setShopLists` go. `say` goes: `textOf` is `t(key, params)`.
  - `src/ui/view.js`: `inList() → ui.view === 'active' && ui.list !== null`, `atTop() → ui.view === 'active' && ui.list === null`, `viewState() → inList() ? listState(state, ui.list) : state`, `shownGroup() → 'aisle' | 'none'`.
  - `src/layers.js`: `closeTop(view)` gives `'sheet'`, `'row'`, `'search'`, then `'list'` while `view.view === 'active' && view.list !== null`.
  - `src/sections.js`: `dockShown({ view, inList, count })` true only inside a list with an item; `emptyAction(view, { query, level })` with `level` `'top'` | `'list'`: `'top'` gives `{ title: 'empty.listsTitle', text: 'empty.lists', action: 'create-list' }`; `'list'` gives today's results.
  - `src/ui/lists.js`: `listNodes() → [li]` (the rows of the first level, in `listsInOrder`); `openList(id)`; `closeList()` (to the first level, ends the search); `bind()`.
  - `src/ui/rows.js` exports `swipeBox({ id, groupId, row, end, right, tap })`.
  - `src/ui/drag.js`: `bindReorder(rowNode, node, id, groupId)` (an id, not an item); `endReorder` calls `reorderLists(state, ids)` when `node.dataset.kind === 'list'`, else `reorderItems`.
- [ ] **Step 1: Write the failing tests:** `tests/layer-order.test.js` (`closeTop` gives `'list'` last; the `closed()` helper has `list: null`, no `shopPickOpen`), `tests/sections.test.js` (`dockShown` false at the first level; `emptyAction('active', { query: '', level: 'top' })`), `tests/markup.test.js` (no `shop-chips`, `shop-done`, `shop-pick`, `dock-shop`, `arrange-lists`; a `back-button` in the header).
- [ ] **Step 2:** `npm test` — they fail.
- [ ] **Step 3:** Implement:
  - First level: a list row has the name and the item count, `›`; a tap opens the list; a slide left shows **Renombrar** (inert until Task 5: no button yet) — in this task only **Eliminar**, which runs `deleteList` with `Deshacer` (`toast.listDeleted` `{ name }`); a hold moves the row (`dataset.kind = 'list'`, `dataset.scope = 'lists'`). No search button at the first level.
  - Header: at the first level, title `t('list.active')`, subtitle `count.lists` and `count.items` joined by ` · `, or `header.noLists`; inside, a back button `#back-button` (icon `chevron-left`, label `lists.back`) before the title, the list name as title, `count.items` or `header.empty` as subtitle.
  - `renderAll` puts `ui.list` back to `null` when its list is gone (a delete, an undo, an import); `showView` sets `ui.list = null`; the back of the phone and `Escape` close the list after the other layers.
  - Inside a list: today's rows, groups by aisle or none, search, the dock with only the search and `+`; the add sheet adds into `ui.list` and checks names against `listState(state, ui.list)`; a duplicate in the list shows `add.duplicate`. `toast.addedTo` gets the list name.
  - At the first level `+` (fab) is wired in Task 5; until then it is hidden there.
  - Remove the shop markup, styles, keys and code listed above, and the shops part of the edit sheet.
- [ ] **Step 4:** Spec: `05-lists-level.md` takes every `SHOP-n` rule as `Removed: …` (keep the ids) plus the screen rules of the first level; `07-screen.md` NAV-1/2/4/7, the header, NAV-25 back; `12-engineering.md` module rows (`src/ui/lists.js`, drop `src/shops.js`, new `May import` sets); `10-offline-version.md` cache name; delete `docs/spec/05-shops.md` and fix its links.
- [ ] **Step 5:** `npm test` — all pass.
- [ ] **Step 6:** Commit `Show the lists as the first level of Listas`.

### Task 4: Cards and the arrange sheet of the first level

**Files:**
- Modify: `src/ui/lists.js`, `src/ui/view.js`, `src/ui/arrange.js`, `index.html`, `styles.css`, the 7 catalogs, `tests/markup.test.js`, `docs/spec/04-arrange.md`, `05-lists-level.md`, `CHANGELOG.md`

**Interfaces:**
- Consumes: Task 1 `setListView`, `setListSort`, `listSummary`, `LIST_VIEWS`.
- Produces: `arrangeChoices() → { aisle, sort, view, listSort }`: at the first level `view` while a list exists and `listSort` with two lists or more; inside a list `aisle` and `sort` as today.

- [ ] **Step 1: Failing test:** `tests/markup.test.js` — the arrange sheet has `#arrange-view` with `data-view="rows"` and `data-view="cards"`, and `#arrange-group` has only `aisle` and `none`.
- [ ] **Step 2:** `npm test` — it fails.
- [ ] **Step 3:** Implement:
  - **Agrupar y ordenar** at the first level: **Vista** (**Filas**, **Tarjetas**) writes `setListView`; **Ordenar por** writes `setListSort`. Inside a list: **Agrupar por** (**Secciones**, **Nada**) and **Ordenar por** write `setGroup`/`setSort` as today.
  - **Tarjetas:** `#items` gets the class `list-cards`, a two-column grid; a card is a button with the name, the count, and the first three item names (`listSummary`) in a muted colour, one line each with an ellipsis. A tap opens the list. Cards have no move.
- [ ] **Step 4:** Spec SORT-1/SORT-3/GROUP-1/GROUP-2 and the cards rule in `05-lists-level.md`.
- [ ] **Step 5:** `npm test` — all pass.
- [ ] **Step 6:** Commit `Show the lists as cards and arrange the first level`.

### Task 5: Create, rename and delete a list

**Files:**
- Modify: `src/ui/lists.js`, `src/ui/context.js` (`ui.listSheet`), `src/layers.js`, `src/app.js`, `src/ui/add.js` (the fab at the first level), `index.html`, `styles.css`, the 7 catalogs, `tests/layer-order.test.js`, `tests/markup.test.js`, `docs/spec/05-lists-level.md`, `07-screen.md`, `CHANGELOG.md`

**Interfaces:**
- Consumes: Task 1 `addList`, `renameList`, `deleteList`.
- Produces: `ui.listSheet`: `null`, `{ id: null }` (create) or `{ id }` (rename). `sheetOpen(view)` is also true while `view.listSheet !== null`. `src/ui/lists.js`: `openListSheet(id = null)`, `closeListSheet()`, `renderListSheet()`.

- [ ] **Step 1: Failing tests:** `tests/layer-order.test.js` (`sheetOpen` true with `listSheet: { id: null }`); `tests/markup.test.js` (five sheets still: `sheet`, `arrange`, `list-sheet`, `edit`, `aisles`, each with grab, head with Listo, body; `#list-name` has `maxlength="40"`).
- [ ] **Step 2:** `npm test` — they fail.
- [ ] **Step 3:** Implement the sheet `#list-sheet`: a name field and **Crear** (create) or the name field saved as the edit sheet saves a field (rename, `bindField` and `Guardado`); a rename sheet has **Eliminar** in its foot. **Crear** adds the list, closes the sheet and opens the list. An error shows under the field as `add-help` does.
  - `+` at the first level and the empty-state button **+ Crear lista** open the create sheet; its label is `lists.create`.
  - **Filas:** the slide left shows **Renombrar** (opens the rename sheet) and **Eliminar**.
  - **Tarjetas:** a hold of `HOLD_MS` on a card (or a right click with the mouse) opens the rename sheet, which holds **Eliminar**; the menu of the browser does not open.
  - **Eliminar** of a list, from the row or the sheet, has no confirmation and shows `toast.listDeleted` with `Deshacer` (PROD-9).
- [ ] **Step 4:** Spec rules of the sheet, the actions and the delete in `05-lists-level.md`; NAV-7 empty first level in `07-screen.md`.
- [ ] **Step 5:** `npm test` — all pass.
- [ ] **Step 6:** Commit `Create, rename and delete a list`.

### Task 6: Move an item to another list

**Files:**
- Modify: `src/ui/edit.js`, `index.html`, the 7 catalogs, `tests/markup.test.js`, `docs/spec/03-lists.md` (LIST-9 back as a rule), `docs/spec/07-screen.md` (the edit sheet), `CHANGELOG.md`

**Interfaces:**
- Consumes: Task 1 `moveItem`, `listsInOrder`.

- [ ] **Step 1: Failing test:** `tests/markup.test.js` — the edit sheet has `#edit-lists` below a title `edit.list`, and no `edit-shop` field.
- [ ] **Step 2:** `npm test` — it fails.
- [ ] **Step 3:** Implement: one chip for each list in `listsInOrder`, the list of the item pressed; a tap on another chip runs `moveItem` through `applySaved`; an error shows as a toast. The sheet stays open; the row leaves the list in view.
- [ ] **Step 4:** Spec.
- [ ] **Step 5:** `npm test` — all pass.
- [ ] **Step 6:** Commit `Move an item to another list from Editar`.

### Task 7: Shortcut, walkthrough and the browser check

**Files:**
- Modify: `manifest.webmanifest`, `src/sections.js`, `src/ui/settings.js` (`SHORTCUT_KEYS`), `src/app.js`, `src/onboarding.js`, `index.html` (walkthrough drawing of the third page), the 7 catalogs, `tests/sections.test.js`, `tests/onboarding.test.js`, `tests/sw.test.js` (if it names `add`), `docs/spec/11-integrations.md`, `07-screen.md`, `01-product.md`, `README.md`, `CLAUDE.md` (the first paragraph), `CHANGELOG.md`

**Interfaces:**
- Produces: `SHORTCUTS = ['create', 'active']`; `shortcutStart('create') → { view: 'active', create: true }`; `PAGES = ['lists', 'row', 'edit']`.

- [ ] **Step 1: Failing tests:** `shortcutStart('create')` and `shortcutStart('add') === null`; `PAGES`.
- [ ] **Step 2:** `npm test` — they fail.
- [ ] **Step 3:** Implement: the shortcut **Crear lista** (`./?open=create`, name key `lists.create`, the plus icon stays) opens the create sheet at the first level. Walkthrough: page `lists` says that `Listas` holds a list for each thing and a tap opens it; page `edit` says that `#edit` moves an item to another list or section. `01-product.md` loses "More than one list" from *Not in the product*; `README.md` and the first paragraph of `CLAUDE.md` describe lists, not shops.
- [ ] **Step 4:** `npm test` — all pass.
- [ ] **Step 5: Browser check** with `npm run serve` at a 390 px wide window and at 800 px, with a version 11 state in `lists.v1` holding shops `IKEA`, `Ferretería`, an item with both and an item with none. Check, and write each result in the commit body:
  - the migration shows `Ferretería`, `IKEA`, `General`;
  - **Filas** and **Tarjetas**; the move of a row; the order by name;
  - create, rename (case only too), delete with `Deshacer` from inside the deleted list;
  - inside a list: add, a duplicate in the list, the same name in another list, tick, search in the dock, group by section, back by the button, by `Escape` and by the back of the phone;
  - move an item with **Editar**; `?arrival`; `?open=create`; the walkthrough from **Ver la introducción**.
- [ ] **Step 6:** Commit `Open Crear lista from the launcher and explain the lists`.
