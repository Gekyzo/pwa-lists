# Shops

Rules of `src/shops.js` and of the shops of the edit sheet in `src/ui/edit.js`. The list by shop is
in [04-arrange.md](04-arrange.md). A shop is any tag that splits `Listas` into lists, such as `IKEA`
or `Casa`: the screen names it `Lista`; the code and this document name it shop.

## Rules

- **SHOP-1** An item has zero, one or more shops. A shop is a name; it exists while an item has
  it (DATA-12).
- **SHOP-2** A shop name is trimmed. An empty name gives `error.shopRequired`.
- **SHOP-3** Two spellings that differ only by case are one shop. A typed name that is a shop in
  use takes the spelling of that shop.
- **SHOP-4** An add of a shop that the item has already changes nothing and gives no error.
- **SHOP-5** A removal of a shop that the item does not have changes nothing and gives no error.
- **SHOP-6** The shops in use show in name order, with no case and no accent distinction.
- **SHOP-7** A row shows the shops of its item below the name, as `A · B`, in the order of their
  add. A list by shop does not show them (GROUP-14).

## Shops of an item

- **SHOP-8** The shops of an item are in the edit sheet `Editar` (ROW-7), below the
  fields, under a line and the title **Listas**. A tap on the name of a row opens it.
- **SHOP-9** The sheet shows each shop in use as a chip. A chip is pressed when the item has the
  shop. A tap on a chip adds or removes the shop for this item.
- **SHOP-10** The field **Nueva lista** with **Añadir** adds a shop. The field takes 40
  characters at most.
- **SHOP-11** The field offers the shops in use that the item does not have. A pick of one adds it
  at once.
- **SHOP-12** The sheet stays open after each change, so that an item gets several shops in one
  visit. A tap out of the sheet or `Escape` closes it.
- **SHOP-13** With no shop in use, the sheet shows `Escribe la primera lista.`
- **SHOP-14** A change of shops is saved at once and has no message and no `Deshacer`.
- **SHOP-15** The edit sheet closes when its item goes away, for example by `Deshacer` or by an
  import.

## Shop lists

A shop list is a view of `Listas`, not a list in the data. The rules of the list
apply in it.

- **SHOP-16** From 600px wide `Listas` has a row of chips below the header: **Todas**, then each
  shop of the view in name order (SHOP-6), then **Sin lista**. A tap on a chip shows that list.
  The chip of the list in view is pressed. Below 600px the dock holds the shop lists instead
  (SHOP-26).
- **SHOP-17** The row shows when an item of the view has a shop. **Sin lista** shows when an item
  of the view has no shop. The row scrolls horizontally, and a slide on it does not change the
  section (NAV-4). `Izquierda` does not change the row.
- **SHOP-18** A chip shows the count of its items. A list with no item has no chip (SHOP-17).
- **SHOP-19** A shop list shows the items that have the shop. **Sin lista** shows the items with
  no shop. An item of two shops shows in the two lists, and one tick deletes it from each. The search,
  the order and the groups by aisle apply in the list. **Listas** is not a choice there
  (GROUP-2).
- **SHOP-20** The header shows the name of the list as its title. Its subtitle is that of the
  items of the list.
- **SHOP-21** Removed: Stash has no trip (TRIP-1).
- **SHOP-22** The choice is a state of the screen and is not stored. A start shows **Todas**. The
  choice stays while the app runs. A choice whose chip goes, for
  example by a removal of a shop, a delete, `Deshacer` or an import, goes back to **Todas**. A tick
  that deletes the last item of the list in view is the exception: the list stays in view, with no
  chip, and shows the card of SHOP-23 until the user leaves it. When that tick empties `Listas`,
  the screen goes back to **Todas** and its empty state.
- **SHOP-23** A shop list of `Listas` with no item, while `Listas` still has items, shows an end
  card in place of the empty state: the title `<shop>: completada`, the tonal button `Siguiente: <shop>
  (<count>) →` and the tonal button `Ver todas las listas`. The `+` of the dock stays the one
  primary button of the view. The next list is the one after the shop in
  chip order, from the start after the end (`nextShop`); its count is the items there. With no other list the button `Siguiente` does not show. A tap on it shows the
  next list. A tap on `Ver todas las listas` shows **Todas**. A search hides the card.
- **SHOP-24** The add sheet opened from a shop list puts that shop on the item that it creates
  (SHOP-4), so the row shows in the list. An item that the sheet finds (ADD-3) gets the shop too,
  with the message and `Deshacer` of ADD-6. From **Todas** and **Sin lista**
  the add puts no shop.
- **SHOP-26** Below 600px wide a dock stands above the bottom bar while `Listas` has an item, in
  thumb reach. It holds `‹`, a chip with the name of the list in view, its count of items (`✓` for
  a list that a tick emptied, SHOP-22) and `▾`, then `›`, then the search button (LIST-37) and the `+` button, at the end. `›` shows the next list after
  the one in view, in chip order and from the start after the end (`nextShop`); `‹` the one before
  it (`previousShop`). An arrow with no other list is off. With no
  chip (SHOP-17) or with the row hidden (SHOP-25) the dock holds only the search button and the `+`
  button. A slide on the dock does not change the section (NAV-4). With `Izquierda` the `+` button
  is at the left end, the search button follows it, and `‹` stays before the chip. The `+` button
  of the dock shows and does not show as the `+` button of NAV-24 (`dockShown`).
- **SHOP-27** A tap on the chip of the dock opens the shop picker, a sheet with the title `Elegir
  lista` and one entry for each chip of SHOP-16, with `N elementos` below its name. The entry of the list in view is pressed. A tap on an entry shows that list and
  closes the sheet; the focus goes back to the chip. The sheet closes as each sheet does (NAV-8).
- **SHOP-25** The arrange sheet has the choice **Elegir lista**, **Mostrar** or **Ocultar**,
  when the view has the row of SHOP-17. **Ocultar** hides the row in `Listas` and shows
  **Todas**. The choice is a preference of the device, stored in `lists.shopLists`;
  **Mostrar** removes the key. `Deshacer` and an import do not change it. The row closes and opens
  as a head of GROUP-15 does, and the rows below move with it.

## Limits

No screen of shops. No rename and no delete of a shop for all its items at one time. No custom
order of the shops. No memory of the shops of a deleted item. No shop field in the add sheet.
