# Lists of the first level

Rules of `src/lists.js`, of `src/ui/lists.js` and of the two levels of `Listas` in `src/ui/list.js`. A list is a record of `state.lists`, `{ id, name }`, that the user
creates, such as `IKEA` or `Casa`. Each item is in one list (`item.list`). The first level of
`Listas` shows the lists; the inside of a list shows its items.

## Names

- **LVL-1** A list name is trimmed. An empty name gives `error.listRequired`.
- **LVL-2** List names are unique with no case distinction. A name of another list gives
  `error.duplicateList` with the spelling of that list.
- **LVL-3** A new list goes to the end of `lists`.
- **LVL-4** A rename has the rules LVL-1 and LVL-2. A rename that changes only the case is
  allowed. A rename to the same text changes nothing. An unknown list gives `error.listNotFound`.

## Delete

- **LVL-5** A delete removes the list and each item of it. An unknown list gives
  `error.listNotFound`.

## Order and view

- **LVL-6** `listSort` orders the lists: `custom` is the order of `lists`, `name` is the order by
  name of SORT-6. Another value gives `error.unknownSort`.
- **LVL-7** A manual move gives the full order of the lists. An order that does not hold each
  list one time gives `error.invalidOrder`, an unknown list `error.listNotFound`. A move in the
  name order starts the custom order from the name order and sets `listSort` to `custom`. The
  same order changes nothing.
- **LVL-8** `view` is `rows` or `cards`. Another value gives `error.unknownView`.

## Items of a list

- **LVL-9** The items of a list are the items with its id, in the order of `sort`. The summary of
  a list is its item count and the names of its first three items.
- **LVL-10** A move of an item to another list puts it at the end of `items`, so it is the last
  of that list. A list that has the name of the item already, with no case distinction, gives
  `error.duplicateItem` with the name of that item and of that list. A move to its own list
  changes nothing. An unknown item gives `error.itemNotFound`, an unknown list
  `error.listNotFound`.

## Screen

- **LVL-11** The first level of `Listas` shows a row for each list, in the order of LVL-6: the name
  of the list, its item count, muted, and `›`. A tap on a row opens the list. The header shows the
  title `Listas` and the subtitle `N listas · M elementos`, or `Sin listas`. The first level has no
  search.
- **LVL-12** A slide of a list row to the left shows **Renombrar**, which opens the list sheet on
  the list (LVL-19), and **Eliminar**, with the measures of ROW-3 to ROW-6. A slide to the right does nothing. A hold lifts the row for a move (MOVE-1), and the drop
  writes the order of LVL-7. **Eliminar** deletes the list and its items with no confirmation
  (PROD-9) and shows `Lista "name" eliminada.` with `Deshacer`, which puts the list and its items
  back in their places.
- **LVL-13** Inside a list the header shows the back button `‹` before the title, the name of the
  list as the title, and `N elementos` or `La lista está vacía` as the subtitle. The back button,
  and `Escape` or the back of the phone after the other layers (NAV-25), go back to the first
  level. A list that goes while it is open, by a delete, an undo or an import, shows the first
  level.
- **LVL-14** Below 600px wide a dock stands above the bottom bar while an open list has an item:
  the search button, then the `+` button at its end. While the search is open, the dock holds the
  search field, **Cancelar** and the `+` button. The header has no search button while the dock
  shows.
- **LVL-15** The first level with no list says `Aún no hay listas` and `Crea una lista para cada
  cosa que tengas pendiente: la casa, un viaje, el trabajo.`, with the button **+ Crear lista**
  below them.
- **LVL-16** The open list is a state of the screen and is not stored. A start of the app and a
  change of section show the first level.
- **LVL-18** **Vista** of **Agrupar y ordenar** shows the first level as **Filas** (LVL-11) or
  **Tarjetas**: two columns of cards, each with the name of the list, its item count and the names
  of its first three items (LVL-9), muted, one line each with an ellipsis. A tap on a card opens
  the list. A hold of a finger on a card (400 ms, MOVE-1) or a right click opens the list sheet on
  the list (LVL-19); the menu of the browser does not open. Cards have no move. A change of view
  has no message and no `Deshacer`.
- **LVL-17** The add sheet of an open list adds the item to that list (LIST-3). Its suggestions
  and its check of a duplicate (ADD rules) take only the items of that list. The message of an add
  names the list: `"name" añadido a IKEA.`
- **LVL-19** At the first level the `+` button and the button **+ Crear lista** of LVL-15 open the
  list sheet to create a list: the title `Crear lista`, a field `Nombre de la lista` of 40
  characters at most and **Crear**, disabled while the field has no text. **Crear** adds the list
  (LVL-1 to LVL-3), closes the sheet and opens the new list. An error shows under the field and
  the sheet stays open. The list sheet of a list has the name of the list as its title, the field
  `Nombre de la lista`, saved as a field of `Editar` is (ROW-7), with `Guardado`, and **Eliminar**
  in its foot, which deletes the list as LVL-12 does and closes the sheet.

## Removed: shops

The shops of an item gave a list for each shop. The lists of the first level replace them, and
the migration of STORE-8 turns each shop into a list.

- **SHOP-1** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-2** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-3** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-4** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-5** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-6** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-7** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-8** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-9** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-10** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-11** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-12** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-13** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-14** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-15** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-16** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-17** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-18** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-19** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-20** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-21** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-22** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-23** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-24** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-25** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-26** Removed: an item has no shops; the lists of the first level take their place.
- **SHOP-27** Removed: an item has no shops; the lists of the first level take their place.

## Sample lists

- **LVL-20** The sample lists have the fixed ids `sample-home` and `sample-trip`, so they stay the
  sample after a rename or an edit. Their names and items are in the language of the screen at the
  time they are added: `Casa`, with `Bombillas`, `Pilas` and `Pintar la puerta`, and `Viaje`, with
  `Pasaporte`, `Cargador` and `Crema solar`. They go last in `lists`, their items last in `items`,
  with no quantity and no aisle. The walkthrough adds them (ONB-13).
- **LVL-21** The add skips a sample list that exists, or whose name a list has with no case
  distinction (LVL-2). With nothing to add it changes nothing. A delete of the sample (ONB-14)
  removes each sample list that exists and its items, as LVL-5 does.
