---
name: ARCHITECTURE
scope: local
load-order: 7
read-when: before a change that crosses a layer or module boundary
description: The shape of this component - its boundaries, its seams, and what it is responsible for.
---

# Architecture

Stash: an offline shopping list PWA for one Android phone, by store. One list, `Compra`,
holds the items to buy. Each item has its shops, and `Compra` has a list for each
shop. The aisles of the store group the list by section. A tick deletes the item: there is no
trip, no saved item and no bought item. Stash is a fork of Bodega (`../pwa-shopping-list`) with
no recipes, no menu of the week, no recurrent items and no trip cycle.

**Stack:** plain HTML, CSS and ES modules. No build step and no dependencies.
`node:test` for unit tests (Node 20 or later). A static HTTPS host serves the
repository root.

## Layers

The `May import` column is the real set of `#` imports of each module.

| Module | Responsibility | May import |
|---|---|---|
| `src/store.js` | Pure state operations and derived views | nothing |
| `src/shops.js` | Pure shop operations and the list by shop | `store` |
| `src/aisles.js` | Pure aisle operations and the list by aisle | `store` |
| `src/swipe.js` | The rule that settles the swipe of an item row | nothing |
| `src/sections.js` | The order of the sections, the rule of the slide that changes the section, the start of a launcher shortcut, what an empty section says and offers, the collapse of the `+` button on a scroll | nothing |
| `src/layers.js` | The layers over a section: whether a sheet is open, and the top layer that `Escape` and the back close (`closeTop`) | nothing |
| `src/onboarding.js` | The pages of the walkthrough, the rule that shows it and the step between pages | nothing |
| `src/reorder.js` | The rules of a row move: drop place, gap, new order | nothing |
| `src/sheets.js` | The rules of a sheet: when a field save shows `Guardado`, and for how long | nothing |
| `src/suggest.js` | The rows above the add input: create first, then the matching items, and which are in the list | `store` |
| `src/storage.js` | Load, save, export, import, validation, migration, the language key and the device preferences | `store` |
| `src/version.js` | Pure version rules: validation, comparison, the next version | nothing |
| `src/install.js` | The install offer state machine | nothing |
| `src/i18n.js` | The language to show (`resolveLanguage`) and the function `t(key, params)` of one language (`translator`) | `locales/*` |
| `src/locales/<lang>.js` | The text of one language: a flat object from key to a text or to `{ one, other }` | nothing |
| `src/ui/context.js` | The values that the views share, their setters, the toast, the save and `render` | `store`, `storage`, `i18n`, `onboarding` |
| `src/ui/view.js` | What the screen shows of the state: the list in view, the search, the open row, the grouping | `store`, `shops`, `ui/context` |
| `src/ui/motion.js` | The motion of rows: close, open, slide to a new place | `ui/context` |
| `src/ui/controls.js` | The controls that several views use: icons, icon buttons, the save of a sheet field and its `Guardado` | `sheets`, `ui/context` |
| `src/ui/edit.js` | The edit sheet `Editar` | `store`, `shops`, `aisles`, `ui/context`, `ui/controls` |
| `src/ui/drag.js` | The manual order: the lift of a row, its move and its drop | `store`, `reorder`, `ui/context`, `ui/view`, `ui/motion` |
| `src/ui/rows.js` | The item rows, their side menus, their swipe and the hint of the swipe | `store`, `swipe`, `storage`, `ui/context`, `ui/view`, `ui/motion`, `ui/controls`, `ui/edit`, `ui/drag` |
| `src/ui/arrange.js` | The arrange sheet: the grouping, the order, the row of shop lists | `store`, `shops`, `ui/context`, `ui/view`, `ui/motion` |
| `src/ui/list.js` | The list `Compra`: rows, search, shop lists, the dock and its shop picker, header, trip sheet | `store`, `shops`, `aisles`, `sections`, `ui/context`, `ui/view`, `ui/controls`, `ui/rows`, `ui/add`, `ui/nav` |
| `src/ui/add.js` | The add sheet | `store`, `shops`, `suggest`, `ui/context`, `ui/view` |
| `src/ui/onboarding.js` | The walkthrough of four pages | `onboarding`, `sections`, `storage`, `ui/context`, `ui/controls` |
| `src/ui/aisles.js` | The sheet of the aisles of `Ajustes` | `aisles`, `ui/context`, `ui/controls` |
| `src/ui/install.js` | The Install button of `Ajustes` | `install`, `ui/context` |
| `src/ui/settings.js` | `Ajustes`: version and update, language, hand, theme, export and import | `sections`, `storage`, `version`, `i18n`, `ui/context`, `ui/onboarding` |
| `src/ui/nav.js` | The bottom bar and the change of section | `sections`, `layers`, `ui/context`, `ui/drag`, `ui/settings` |
| `src/app.js` | The start of the app: the render of the screen, the bind of each view, the listeners of the document | `store`, `shops`, `sections`, `layers`, every view of `src/ui/` except `ui/controls`, and `#ds/sheet` |
| `sw.js` | Offline cache of the app shell | nothing; it is not a module of the app |

The data model and the behaviour rules are in `docs/spec/`, one identifier for each rule.
`docs/spec/12-engineering.md` holds the same module table, and `tests/spec.test.js` checks it
against the imports of each module.

## Boundaries

- **`localStorage`**, key `lists.v1`: the only data store. The state is
  `{ version: 11, items, group, sort, aisles }`. Versions 1 to 9 are the states of Bodega and
  version 10 the first of Stash; such a state is migrated when it is read, and its recipes, sent
  recipes, menu, recurrent marks, saved items and ticked items are dropped. Invalid content is kept under `lists.v1.corrupt`.
- **`localStorage`**, key `lists.lang`: the language that the user chose in `Ajustes`, one of
  `ca`, `de`, `en`, `es`, `fr`, `it`, `pt`. No key means that the app follows `navigator.languages`,
  with `en` as the fallback.
- **`localStorage`**, keys `lists.hand`, `lists.theme`, `lists.density` and `lists.shopLists`: the
  device preferences of `Ajustes` and of the list.
- **`localStorage`**, key `lists.onboarded`: `1` after the walkthrough of the first start closed. No
  key and no `lists.v1` means a new install, which shows the walkthrough.
- **`localStorage`**, key `lists.swipeHint`: `1` after `Compra` showed the slide of a row one
  time (ROW-14).
- The keys other than `lists.v1` are not part of the state and not part of the backup.
- **Cache API**, cache `lists-shell-v2`: the app shell, served stale-while-revalidate. A request
  with the `latest` parameter goes to the network only. The message `{ type: 'refresh' }` loads
  the full shell again and answers `{ ok }` on the message port. Cache `lists-manifest`: the
  manifest in the language of the screen (SW-13). The worker deletes only stale `lists-` caches.
- **Shared origin:** Stash and Bodega both run on `gekyzo.github.io`. The `lists.` keys and the
  `lists-` caches keep Stash apart from the `shopping.` keys and `shopping-` caches of Bodega.
- **`version.json`**, `{ version, date }`: the semantic version of the deploy. The app reads the
  cached copy one time at the start (the running version) and the copy of the host
  when `Ajustes` opens (the deployed version). `scripts/bump-version.mjs` is its only writer, and
  writes the same version to `package.json`; `npm run release` (`scripts/release.mjs`) runs it.
  `.githooks/pre-push` stops a tag `vX.Y.Z` whose `version.json` has another version.
- **Network:** only the static files of the same origin. There is no API and no
  account.
- **Files:** the JSON backup that the user exports and imports. **Importar** also reads a Bodega
  backup.

## Seams

- A new text of the screen: one key in each catalog of `src/locales/`, with the same placeholders.
  The screen code, `src/app.js` and `src/ui/`, is the only code that calls `t`. A fixed text of `index.html` is a `data-i18n` key.
- A new language: a catalog, its entry in `CATALOGS` and in `LANGUAGE_NAMES` of `src/i18n.js`, its
  alias `#locales/<lang>` in the import map, and its file in `SHELL`.
- An error of a pure module is a message `{ key, params }`, never text. A `list` parameter holds a
  list id.
- A new file that the app loads: add it to `SHELL` in `sw.js`.
- A new module of `src/`: add its alias `#name` to the import map in `index.html`, its file to
  `SHELL`, and its row to the module table of `docs/spec/12-engineering.md`. Node resolves the
  alias through `imports` in `package.json` with no edit. `tests/aliases.test.js` checks the map.
- An import of a module of `src/` uses the alias (`from '#store'`), never a relative path.
- A change of the item shape: `normalizeItem` in `src/storage.js`, a new `version`
  and a migration in `load`.
- A new list rule: an operation in `src/store.js` with its tests, then a control in
  its view of `src/ui/`.
- A new shop rule: an operation in `src/shops.js` with its tests, then a control in
  its view of `src/ui/`.
- A new aisle rule: an operation in `src/aisles.js` with its tests, then a control in
  its view of `src/ui/`.
- A new view: a module of `src/ui/` with a `bind()` that `src/app.js` calls. It reads the shared
  values from `#ui/context` and changes them only through a setter. `tests/layers.test.js` checks
  the layer rules.
- A change of the stored state that an old module cannot read: a new cache name in
  `sw.js`, so that the worker loads the full shell again.
- All URLs are relative, because the host serves the app below a subpath. This includes the
  addresses of the import map.
