# Order, groups and the manual move

Rules of `setSort`, `setGroup`, `reorderItems` and `sortItems` in `src/store.js`, of
`setListSort`, `setListView` and `reorderLists` in `src/lists.js`, of `aisleGroups` in `src/aisles.js`, of `src/reorder.js`, and of
the arrange sheet in `src/ui/arrange.js`.

## Arrange sheet

- **SORT-1** The button at the right of the header opens the sheet **Agrupar y ordenar**. It shows
  only in `Listas`, and only when the sheet has a choice to offer. At the first level the sheet
  has **Vista** (LVL-18) while a list exists, and **Ordenar por** of the lists (LVL-6) with two
  lists or more. Inside a list it has a grouping (GROUP-2) and an order (SORT-3).
- **SORT-2** The sheet stays open after a choice, so that the group and the order change in one
  visit. A tap out of the sheet or `Escape` closes it.

## Order

- **SORT-3** **Ordenar por** has **Nombre** and **Personalizado**. It shows when the view has two
  items or more.
- **SORT-4** One choice, `sort`, applies to the items of each list. The default is `custom`. The
  lists have their own choice, `listSort` (LVL-6).
- **SORT-5** **Personalizado** is the order of `items`: the insertion order, changed by the moves
  of the user. A new item goes to the end.
- **SORT-6** **Nombre** is alphabetical with no case and no accent distinction. It does not change
  `items`.
- **SORT-7** Removed: `Listas` has no ticked items (LIST-12).
- **SORT-8** The order also applies inside each group.
- **SORT-9** A change of order has no message and no `Deshacer`. The rows move to their new places
  with an animation.

## Groups

- **GROUP-1** **Agrupar por** has **Secciones** and **Nada**. One choice, `group`, applies to each
  list. The default is `aisle`.
- **GROUP-2** A choice shows only when the view can show it:
  - **Secciones**: when an item of the list in view has an aisle (GROUP-17).
  - **Nada**: each time that **Secciones** shows.

  The arrange button shows when the sheet has one choice at least.
- **GROUP-3** A view that cannot show the stored choice shows a flat list, and the sheet marks
  **Nada**. The stored choice does not change. Example: with `group: 'aisle'` and no
  item with an aisle, the list is flat.
- **GROUP-4** A tap on the choice that the view shows already changes nothing. Thus a tap on
  **Nada** in a view that is flat by GROUP-3 keeps the stored grouping.
- **GROUP-10** Removed: `Listas` has no ticked items, so it has no `Comprados (N)` (LIST-12).

### Removed: by recipe

- **GROUP-5** Removed: the app has no recipes, so it has no recipe groups.
- **GROUP-6** Removed: the app has no recipes, so it has no recipe groups.
- **GROUP-7** Removed: the app has no recipes, so it has no recipe groups.
- **GROUP-20** Removed: the app has no recipes, so a row has no `También en` line.
- **GROUP-8** Removed: the app has no recipes, so it has no recipe groups. GROUP-11 gives the
  count of a group head.
- **GROUP-9** Removed: the head `Otros` was the rest of the recipe groups.

### Removed: by shop

- **GROUP-11** Removed: an item has no shops, so a list has no groups by shop.
- **GROUP-12** Removed: an item has no shops, so a list has no groups by shop.
- **GROUP-13** Removed: an item has no shops, so a list has no groups by shop.
- **GROUP-14** Removed: an item has no shops, so a list has no groups by shop.

### By aisle

- **GROUP-17** The groups are the aisles of the items of the view, in the order of `aisles`
  (AISLE-1), not in name order. The head of a group shows the name of the aisle and the count of its items, muted and small, then the icon `chevron-down` while it is open. At a shop, the list follows
  the walk through it.
- **GROUP-18** An aisle with no item in the view does not show. The items with no aisle show last,
  below the head `Sin sección`, with their count.
- **GROUP-19** Removed: an item has no shops, so a row shows none.

### Effect

- **GROUP-15** When a grouping opens, the heads and the extra rows open and the other rows move.
  When the choice goes to **Nada**, the groups close first and then the list becomes flat. A tap
  on a grouping while the groups close keeps them.
- **GROUP-16** A tap on the head of a group (an aisle or `Sin sección`) closes the
  rows of the group in 200 ms. The head stays, with its count and the icon `chevron-right`; a second tap opens
  the rows again in 200 ms. The list keeps its closed groups until the app starts again. A search
  shows each group open and disables its head (LIST-25).

## Manual move

- **MOVE-1** A hold of a finger of 400 ms on a row lifts it. With a mouse, a vertical drag of
  10 px lifts it with no hold. The phone vibrates for 10 ms.
- **MOVE-2** A finger that moves 10 px before the hold ends does not lift the row: it scrolls the
  list or slides the row.
- **MOVE-3** A row moves only among the rows of its scope:

  | View | Rows that move | Scope |
  |---|---|---|
  | `Listas`, flat | Each item | All the items |
  | `Listas`, grouped | Each item | The group of the row, or `Sin lista` / `Sin sección` |

- **MOVE-4** A row does not move while its side
  menu is open or its name is in edit. A scope of one row does not move. No row moves while the
  search field of the list has a text (LIST-22): the hidden rows have no place on the screen.
- **MOVE-5** The scope is the run of rows of the same scope that are next to the lifted row. A
  move does not pass a row of another scope.
- **MOVE-6** The lifted row follows the pointer and stays inside its scope. It takes the place of a
  neighbour when its leading edge passes the centre of that neighbour. The other rows open a gap.
- **MOVE-7** A pointer within 56 px of the top or the bottom of the list scrolls the list.
- **MOVE-8** The release writes the new order: the moved items exchange their places in `items`,
  and each other item keeps its place. A release at the start place writes nothing.
- **MOVE-9** A move in the order **Nombre** changes `sort` to `custom`. The custom order then
  starts from the alphabetical order of all items, with the move.
- **MOVE-10** The message is `Orden cambiado.`, or `Orden cambiado a «Personalizado».` for
  MOVE-9, with `Deshacer`.
- **MOVE-11** `Escape`, a lost pointer and a render of the list end the move with no change.
- **MOVE-12** The click that follows a release does not tick the item.

## Limits

No move between groups, no move with the keyboard.
