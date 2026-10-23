# Lists

Rules of `src/store.js`, and of the rows and the add sheet in `src/ui/rows.js` and `src/ui/add.js`.

## Items

- **LIST-1** A new item has a name that is trimmed and not empty. An empty name gives
  `error.nameRequired`.
- **LIST-2** A name that an item of the same list has already gives `error.duplicateItem` with the
  name of that item and the name of the list (DATA-3).
- **LIST-3** A new item goes to the list in view. An unknown list gives `error.listNotFound`.
- **LIST-4** A new item goes to the end of `items`, with no quantity and no aisle.
- **LIST-5** A rename has the rules LIST-1 and LIST-2. The item keeps its own name without an
  error. A rename to the same text changes nothing.
- **LIST-6** A name field of the screen takes 80 characters at most. The store has no limit.
- **LIST-7** Removed: an item has no recurrent mark.
- **LIST-8** A delete removes the item. Its shops go with it.
- **LIST-9** The part **Lista** of `Editar` moves an item to another list (LVL-10). The
  move has no `Deshacer`; a tap on the chip of the old list moves it back.

## Quantity

- **LIST-27** An item has a quantity: free text, such as `2`, `1 kg` or `3 latas`, or none. The
  quantity is trimmed; an empty text clears it. The same text changes nothing.
- **LIST-28** A tick and a delete remove the quantity with the item. Their `Deshacer` puts it
  back.
- **LIST-29** The search of a list does not match the quantity (LIST-22).

## Tick

- **LIST-10** Removed: each item is in `Listas`, so each item can be ticked.
- **LIST-11** A tap on the body of a row of `Listas` (ROW-1) or a slide to the right (ROW-11)
  ticks the item.
- **LIST-12** A tick deletes the item at once (`tickItem`): it is bought. Its shops, quantity and
  aisle go with it. An unknown item gives `error.itemNotFound`.
- **LIST-13** A tick shows `"name" hecho.` with `Deshacer`, because the row leaves the list.
  `Deshacer` puts the item back in its place in `items`, with its shops, quantity and aisle.
- **LIST-14** Removed: a ticked item has no mark that keeps it for the next trip.

## Removed: the second list

- **LIST-15** Removed: the app has one list, `Listas`.
- **LIST-16** Removed: the app has one list, `Listas`.
- **LIST-17** Removed: the app has one list, `Listas`.
- **LIST-18** Removed: the app has one list, `Listas`.
- **LIST-19** Removed: the bottom bar shows no count.

## Removed: the trip

- **TRIP-1** Removed: Stash has no trip. A tick deletes the item (LIST-12).
- **TRIP-2** Removed: Stash has no trip. A tick deletes the item (LIST-12).
- **TRIP-3** Removed: Stash has no trip. A tick deletes the item (LIST-12).
- **TRIP-4** Removed: `Listas` has no banner `¿Has terminado?` and no trip sheet.
- **TRIP-5** Removed: Stash has no trip. A tick deletes the item (LIST-12).
- **TRIP-6** Removed: Stash has no trip, so an item is never open or kept for the next trip.
- **TRIP-7** Removed: `Ajustes` has no group **Al terminar la compra**.
- **TRIP-8** Removed: the app has no choice of what a trip does. A stored `lists.tripEnd` stays,
  with no effect, and **Borrar todos los datos** does not remove it.

## Header figures

| Section | Title | Subtitle |
|---|---|---|
| `Listas` | `Mis listas` | `N elementos`, or `La lista está vacía` |
| `Ajustes` | `Ajustes` | `Stash` |

The header has no ring and no progress bar: a tick deletes the item, so `Listas` has no share of
done items to show.

## Add sheet

The `+` button opens the sheet in `Listas`. Below 600px it is the last button of the dock
(SHOP-26), from 600px it floats above the list (NAV-24). The button does not show in `Ajustes` or
while a sheet is open.

- **ADD-1** The sheet has a name field and the button **Añadir**. It has no target choice: an add
  always goes to `Listas`.
- **ADD-2** While the user types, the sheet lists up to 6 rows above the input, which stays pinned
  at the bottom of the sheet and does not move: `+ Crear «name»` first when no item has the
  typed name, then the items whose name contains the text, with no case or accent distinction (the
  exact match first, then the names that start with the text, then the others). The list shows the
  rows upside down, so that the first row sits next to the input. **Añadir** is off while the field
  is empty.
- **ADD-3** Each listed item is in `Listas`, and says `ya en la lista`. A tap on it does nothing
  but ADD-5, apart from the shop of SHOP-24.

- **ADD-4** When no item has the typed name, the list ends with `+ Crear «name»`, which does the
  same as **Añadir**.
- **ADD-5** **Añadir** with the name of an item that exists does what a tap on that item does
  (ADD-3). It never creates a duplicate. When nothing changes, the text stays in the field, the
  field gets the error mark, and the help under it says `«name» ya está en la lista`. The next
  input clears the help.
- **ADD-6** The shop that SHOP-24 puts on an existing item shows `"name" ya existe. Ahora está en
  Listas.` with `Deshacer`. A tap that changes nothing shows no toast (ADD-5).
- **ADD-7** A new item shows `"name" añadido a <list>.` with no `Deshacer`.
- **ADD-8** After each add the sheet stays open, with an empty field that has the focus, so that
  the user adds several items in one visit. A tap out of the sheet or `Escape` closes it.
- **ADD-9** The row of an item that the sheet brought flashes and scrolls into view.

## Search

- **LIST-20** From 600px wide the header of `Listas` has a search button, at the left of the
  arrange button. It shows when the view has one item at least. Below 600px the search button is
  in the dock (SHOP-26), and the header has none.
- **LIST-21** A tap on the button of the header opens the field **Buscar elemento o lista** below
  the header, with the focus. A second tap, `Escape` (NAV-25), or a loss of focus with an empty
  field closes it. A close clears the text.
- **LIST-37** Below 600px a tap on the search button of the dock turns the dock into the field
  **Buscar elemento o lista**, with the focus, a clear button while it has a text, and the button
  **Cancelar**. **Cancelar**, `Escape` and the back of the phone (NAV-25), or a loss of focus with an
  empty field close it; a close clears the text. The list ends at the dock while the field is
  open, so the matches fill it from the bottom and the nearest match is next to the field. A group
  head keeps its colour.
- **LIST-22** The list shows only the items whose name, one of whose shops or whose aisle
  (AISLE-9) contains the text,
  with no case and no accent distinction. An empty text shows all items.
- **LIST-23** The order and the grouping stay. A group with no match does not show. The count of
  a group head and the header figures stay those of the full list.
- **LIST-24** The text of the search is not stored. A change of section closes the search. An add
  from the add sheet closes it too, so that the row of the item is in view.
- **LIST-25** Removed: `Listas` has no ticked items to search (LIST-12).
- **LIST-26** With no match the list shows `Ningún elemento coincide con «text».`

## Removed: saved items

- **LIST-30** Removed: the app has no saved items. A tick deletes the item (LIST-12).
- **LIST-31** Removed: the app has no saved items. A tick deletes the item (LIST-12).
- **LIST-32** Removed: the app has no saved items. A tick deletes the item (LIST-12).
- **LIST-34** Removed: `Listas` has no section of the saved items (LIST-30). The add sheet is the
  only way to them (LIST-31).
- **LIST-35** Removed: a saved item has no row (LIST-34).
- **LIST-36** Removed: the search of the list (LIST-22) does not find a saved item. The search
  button shows when the list has an item.
- **LIST-33** Removed: the app has no saved items. A tick deletes the item (LIST-12).

## Limits

One list of items to buy: no list for a later trip, no saved item and no history of bought items. No unit
and no arithmetic of quantities, no note. No add of several items from one text. No ranking of the
results of a list search.
