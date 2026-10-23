# Lists as the first level

## Intent

The first level of `Listas` shows the lists that the user creates: **Crear lista**. The user adds
an item only inside a list. Today Stash has one list of items, and a shop on an item puts the
item in the list of that shop. The lists that the user creates replace the shops.

## Decisions of the user

- **Lists replace shops.** An item lives in exactly one list. Shops go away: the field of an
  item, the chips, the dock, the shop picker and the grouping by shop.
- **Names are unique in one list only.** `Tornillos` can be in `IKEA` and in `Ferretería` as two
  items. A tick of one leaves the other.
- **Sections stay one shared set** for all lists, in `Ajustes` (AISLE-1 to AISLE-11, unchanged).
  Inside a list, the grouping is by section or none.
- **Migration.** At the first start after the update, each shop becomes a list. An item with two
  shops becomes two items, one in each list. The items with no shop go to a new list `General`.
  An import of a Bodega or an older Stash backup goes through the same migration.
- **Two views of the first screen,** chosen in its **Agrupar y ordenar** sheet, as in Bodega:
  - **Filas:** a row for each list, with its name and its item count, then `›`.
  - **Tarjetas:** a two-column grid of cards, each with the name and its first items.
- **Delete of a list deletes its items.** No confirmation; `Deshacer` restores the list and its
  items for 5 seconds (PROD-9).
- **Launcher shortcut:** **Añadir elemento** becomes **Crear lista**. It opens the sheet that
  creates a list.
- **Move of a list:** only in **Filas**, with the hold and drag of MOVE-1. **Tarjetas** shows the
  stored order and has no move.
- **Move of an item to another list:** the edit sheet gets a **Lista** picker in place of the
  shops part. A name that the target list has already gives `error.duplicateItem` with the name
  of that list.
- **Dock:** below 600px the dock stays inside a list, with the search (LIST-37) and the `+` button
  at its end. The shop chip, the arrows and the shop picker (SHOP-27) go.

Mockups: `.superpowers/brainstorm/*/content/lists-screens.html` (A rows, B cards, C inside a list).

## Screens

### First level

- Header: title `Listas`, subtitle `N listas · M elementos`, the arrange button ⇅.
- **Agrupar y ordenar** has **Vista** (**Filas**, **Tarjetas**) and **Ordenar por** (**Nombre**,
  **Personalizado**). **Personalizado** is the order of creation, changed by a manual move.
- A tap on a list opens it.
- **Filas:** a slide of a row to the left shows **Renombrar** and **Eliminar** (ROW-3 style). A
  slide to the right does nothing. A hold lifts the row for a move (MOVE-1).
- **Tarjetas:** a long press on a card shows the same two actions.
- `+` opens a sheet with one name field: it creates the list and opens it.
- Empty: title `Aún no hay listas`, a short text, and the button **+ Crear lista**, laid out as
  NAV-7.
- No search on the first level.

### Inside a list

- Header: ← back to the first level, the list name as the title, subtitle `N elementos` and ⇅.
  The search button is in the header from 600px wide, and in the dock below it.
- The rows of items stay as today (ROW-1 to ROW-6), with no line of shops below the name.
- `+` adds an item to this list. The add sheet suggests and checks names in this list only.
- ⇅ has **Agrupar por** (**Secciones**, **Nada**) and **Ordenar por** (**Nombre**,
  **Personalizado**), as today.
- A tick that empties the list leaves the list in place, empty, with an empty state that offers
  **+ Añadir elemento**.

## Data

- A list is a record: `{ id, name }`. It exists with no item, as an aisle (AISLE-1).
- An item gets `list` (the id of its list) and loses `shops`.
- A list name is trimmed, not empty, unique with no case distinction, 40 characters at most in
  the field. Rename keeps the rules of LIST-5.
- An item name is unique in its list with no case distinction (DATA-3 per list).
- The state version goes to 12. Version 11 and older states and backups migrate as above.

## Other areas

- The walkthrough (ONB-1) and the texts that name shops change to speak of lists.
- `docs/spec/` changes with the code: `05-shops.md` is removed or rewritten as the rules of lists;
  `02-data-model.md`, `03-lists.md`, `04-arrange.md`, `07-screen.md`, `08-storage.md` and
  `11-integrations.md` follow. `tests/spec.test.js` keeps them in step.
- All seven languages get the new texts.

## Non-goals

- Lists shared between devices or people.
- One item in two lists at once.
- Sections for each list.
- A search across all lists.
- A list inside a list.

## Calls made in the design

Made by Claude, not by the user. The user can reverse each one:

- `group` and `sort` stay one value for all lists, as today. A stored `group: 'shop'` becomes
  `'aisle'`, and the default of the empty state is `'aisle'`. A list with no aisle shows flat
  (GROUP-3).
- The migration creates `General` only when an item has no shop. The name is the literal
  `General`, not a translated text, because `storage.js` has no language. If a shop `General`
  exists already (no case distinction), the items with no shop join that list. No name clash can
  follow: item names are unique across the whole state before the migration (DATA-3).
- The message of `?arrival` (ARR-1) counts the items of all lists.

## Calls left to the builder

- The open list is a state of the screen, not stored: a start shows the first level.
- The Android back gesture and the tap on `Listas` in the bottom bar go back to the first level.
- How many items a card shows, and the text when a list is empty.
- Where the view (`rows` | `cards`) and the order of the lists are stored: in the state, next to
  `group` and `sort`.
- The icon of the shortcut **Crear lista**.
- The order of the lists created by migration: shop name order, with `General` last.
