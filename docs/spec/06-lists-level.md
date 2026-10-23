# Lists of the first level

Rules of `src/lists.js`. A list is a record of `state.lists`, `{ id, name }`, that the user
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
