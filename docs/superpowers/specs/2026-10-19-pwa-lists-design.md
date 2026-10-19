# pwa-lists: items per store

## Intent

A simpler copy of Bodega (`../pwa-shopping-list`, commit `1ba991e`, version 1.2.1). It keeps the
list `Compra` with its items and their shops, so that the user shops store by store. It removes
three features: recipes, the menu of the week and recurrent items. The user skipped the design
questions; every choice below that the user did not state is marked **(call)**.

## Goals

- The same app as Bodega for items, shops, shop lists, aisles, quantity, search, order, trip end,
  saved items, backup, seven languages, walkthrough, offline use, install and integrations.
- No recipes, no menu, no recurrent items: no code, no text, no rule, no icon of them is left.
- Bodega and pwa-lists run side by side on the same origin (`gekyzo.github.io`) with no shared
  data and no shared cache.

## Non-goals

- New features. pwa-lists does only what Bodega does, less the three features.
- A sync with Bodega. The two apps share no data at run time.

## How it is made

- **(call)** Copy the tracked files of Bodega at `1ba991e` into this repository, with no git
  history, then remove the three features. Do not copy `ux-audit/`, `designs/prototypes/`,
  `docs/superpowers/` (Bodega history) or the history entries of `CHANGELOG.md`.
- The stack, the design system copy (`vendor/`, `npm run ds` from `../pwa-design-system`), the
  checks (`tests/spec.test.js`, `tests/layers.test.js`, `tests/design.test.js`, `.githooks/`) and
  the release scripts stay as they are in Bodega.
- `docs/spec/` stays the specification, with its rule identifiers. **(call)** `06-recipes.md` and
  `13-menu.md` are deleted with the prefixes `REC` and `MENU`. A recipe, menu or recurrent rule in a
  kept document becomes a `Removed:` line, as the README of the specification says.

## Changes from Bodega

### Name and identity

- **(call)** Working name `Listas`, short name `Listas`, until the user chooses one. It replaces
  `Bodega` in `index.html`, the manifest, `app.title` and `header.settingsSubtitle` of each locale,
  the README and the tests.
- Manifest `id` `/pwa-lists/`. Deploy URL `https://gekyzo.github.io/pwa-lists/`.
- **(call)** The icons stay those of Bodega until the user gives new art.

### Same origin

- `localStorage` prefix `lists.` in place of `shopping.`: `lists.v1`, `lists.v1.corrupt`,
  `lists.lang`, `lists.hand`, `lists.shopLists`, `lists.tripEnd`, `lists.theme`,
  `lists.density`, `lists.onboarded`, `lists.swipeHint`.
- Cache names `lists-shell-v1` and `lists-manifest`.
- The activate of `sw.js` deletes only the caches whose name starts with `lists-`.
- Export file name `listas-YYYY-MM-DD.json` **(call)**.
- The dev log `window.listsLog` with the prefix `[lists]`.
- Bodega's `sw.js` deletes each cache that is not its own, so it deletes the caches of
  pwa-lists. The fix is in Bodega, another repository. It is not part of this work until the user
  agrees to it.

### Data

- State: `{ version: 10, items, group, sort, aisles }`. Item: `{ id, name, list, bought, shops,
  quantity, aisle }`. No `recipes`, `sent`, `menu` or `recurrent`.
- **(call)** `version: 10`, so that a Bodega backup (versions 1 to 9) and a pwa-lists state are
  never the same version.
- `GROUPS = ['shop', 'aisle', 'none']`. The default group is `shop`: the list shows by store.
- The import reads a pwa-lists backup (version 10) and a Bodega backup (versions 1 to 9) **(call)**.
  For a Bodega backup it drops `recipes`, `sent` and `menu`, makes each recurrent item a plain
  item, and maps `group: 'recipe'` to `shop`. A load reads the same versions. The stored state is
  always version 10.

### Lists and trip

- An open item is each item of `Compra` that is not ticked.
- **Terminar compra** saves each ticked item. Each open item stays with `Aplazar` or is saved with
  `Descartar` (TRIP-6 to TRIP-8 stay). `tripSummary` and `tripOutcome` lose `recurrent`; the trip
  sheet loses its `↻` row.
- The row loses `↻ cada compra`, `También en «recipes»` and the action **Repetir**. The slide to
  the left shows **Editar** and **Eliminar**. The edit sheet loses the switch **Repetir en cada
  compra**.
- The add sheet keeps the effects of ADD-3; the text `ya comprado · repetir` becomes `ya comprado
  · desmarcar` **(call)**, because `repetir` named the recurrent mark.
- The arrange sheet loses **Recetas**: **Agrupar por** has **Tiendas**, **Secciones** and
  **Nada**. `Otros` goes with the groups by recipe.

### Screen

- The bottom bar has two sections: `Compra` and `Ajustes`. The slide between them stays.
- `Ajustes` loses **Borrar la receta de ejemplo**. **Ayuda** keeps **Ver la introducción**.
- The empty `Compra` says `Toca + para añadir un artículo.` with no sample recipe.
- The corner basket (NAV-18) shows in `Compra` only.
- Launcher shortcuts: `Añadir` and `Compra`.
- Walkthrough **(call)**: four pages:
  1. `lists`: as in Bodega.
  2. `trip`: tick what you take, then **Terminar compra**; what is not bought stays or goes, as
     **Al terminar la compra** says.
  3. `row`: slide a row to edit it or delete it.
  4. `shops`: give an item its shops in **Editar**; the list then shows one list for each shop.

  The pages `sections`, `recipes` and `sample` and the sample switch go.

### Removed files

`src/recipes.js`, `src/menu.js`, `src/ui/recipes.js`, `src/ui/menu.js`, their tests,
`docs/spec/06-recipes.md`, `docs/spec/13-menu.md`, `icons/shortcut-recipes.png`,
`icons/shortcut-menu.png`, the icon symbols that no part uses then (`book`, `menu`, `repeat`,
`cart-add`, `link`), their styles (`recipe` row variant, `product-form`, `product-add`, `day`,
`meal`, `products`) and their locale keys in the seven languages.

## Project files

- `CLAUDE.md`, `README.md`, `ROADMAP.md`, `package.json` (`name: lists`) and
  `.claude/conventions/{ARCHITECTURE,CANONICAL,RELEVANT-FILES}.md` describe pwa-lists.
- `CHANGELOG.md` starts with `## Unreleased` and one line: the first version, from Bodega 1.2.1
  less recipes, menu and recurrent items. `version.json` starts empty of a version, so the first
  release is `1.0.0`.

## Done

- `npm test` passes.
- In a browser (`npm run serve`): the walkthrough, an add, a shop on an item, the shop lists, a
  tick, **Terminar compra**, `Ajustes`, an export and an import of a Bodega backup. No text of a
  recipe, a menu or a recurrent item shows in any of the seven languages.
- No release, no tag and no push without the user.
