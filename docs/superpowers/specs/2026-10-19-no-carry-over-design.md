# Stash: a tick deletes the item

## Intent

The user's words: "the app is very simple, add items to be bought, with an optional per-shop
category. once they're checked, delete them." Stash drops the trip cycle of Bodega: no
**Terminar compra**, no next trip, no saved items, no bought items. An item exists while it is to
buy. The user skipped the design questions; the details below are the implementer's call.

## Behaviour

- A tick (a tap on the body of a row, or a slide to the right, ROW-11) deletes the item at once,
  with the message `"name" comprado.` and `Deshacer`. `Deshacer` puts the item back in its place,
  with its shops, quantity and aisle.
- `Compra` has no `Compradas (N)` section, no trip button, no trip sheet and no banner
  `¿Has terminado?`. The check mark of a row stays as the sign of the tick.
- The header: title `Compra de hoy`, subtitle `N artículos` or `La lista está vacía`, the ring the
  count of items.
- A shop list with no item left shows the end card of SHOP-23 when another shop list still has
  items, else the empty state. Its chip goes when no item has the shop (SHOP-22).
- The add sheet lists the items whose name contains the text, as `ya en la lista`; a tap on one
  does nothing but show the help `«name» ya está en la lista` (ADD-5). A new name creates an item.
- `Ajustes` loses **Al terminar la compra** and its key `lists.tripEnd`.
- The walkthrough has three pages: `lists` (`Compra` holds what you need to buy; a tick deletes
  it), `row` (tap or slide `→` to tick it, slide `←` to edit or delete it) and `shops`. The page
  `trip` goes.
- The arrival message (ARR) counts the items. The shortcuts do not change.

## Data

- Item: `{ id, name, shops, quantity, aisle }`. No `list`, no `bought`.
- State: `{ version: 11, items, group, sort, aisles }`.
- Load and import read versions 1 to 11. An item that is saved (`list: 'saved'`) or ticked
  (`bought: true`, after the rules of `next` and `again`) is dropped: it is not to buy. An item of
  `list: 'next'` (Bodega 1 to 7) is to buy. The stored state is version 11.
- `lists.tripEnd` leaves `APP_KEYS`. A stored value stays, with no effect.

## Code

- `src/store.js`: remove `toggleBought`, `startNewShopping`, `canStartNewShopping`, `openItems`,
  `bringToList`, `tripOutcome`, `error.onlyActiveTick`, `error.nothingToStart`. Add
  `tickItem(state, id)`, which deletes the item (the same as `deleteItem`, with its own message).
  `tripSummary` becomes `{ total }`, or the views use `items.length`. `activeItems` gives the items
  in the order of `sort`. Shop and aisle groups have no ticked count: a group head shows the count
  of its items.
- `src/storage.js`, `src/ui/context.js`, `src/ui/settings.js`: remove the trip-end preference.
- `src/ui/list.js`, `src/ui/rows.js`, `src/ui/add.js`, `src/suggest.js`, `src/shops.js`,
  `src/aisles.js`, `src/onboarding.js`, `src/ui/onboarding.js`, `src/ui/arrange.js`, `src/ui/view.js`,
  `index.html`, `styles.css`, the seven locales, `docs/spec/`: follow the behaviour above. A locale
  key, a CSS part, an icon or an id that no code uses goes (the tests check keys, parts and icons).

## Done

`npm test` passes. A browser check: add, tick (the row goes), `Deshacer` (it comes back), a shop
list that empties, the add sheet on an item of the list, `Ajustes` with no trip-end group, the
walkthrough of three pages, and an import of a Bodega backup with saved and ticked items.
