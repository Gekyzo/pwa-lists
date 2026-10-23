# Data model

## State

The app has one state object. Each operation returns a new object and never changes its input.

```js
{
  version: 12,
  lists: [List],      // the lists of the first level, in the custom order
  items: [Item],      // insertion order, changed only by a manual move
  group: 'aisle',     // 'aisle' | 'none'
  sort: 'custom',     // 'custom' | 'name'
  aisles: [string],   // the sections of the store, in the order of the walk
  view: 'rows',       // 'rows' | 'cards': the first level of Listas
  listSort: 'custom', // 'custom' | 'name': the order of the lists
}
```

The empty state is `{ version: 12, lists: [], items: [], group: 'aisle', sort: 'custom', aisles: [], view: 'rows', listSort: 'custom' }`.

## List

```js
{
  id: string,         // crypto.randomUUID(); `list-N` for a list that the migration made (STORE-8)
  name: string,       // trimmed, not empty
}
```

See [06-lists-level.md](06-lists-level.md).

## Item

```js
{
  id: string,         // crypto.randomUUID()
  name: string,       // trimmed, not empty
  list: string,       // the id of its list
  quantity: string,   // free text, such as '2' or '1 kg'; trimmed; '' for none
  aisle: string,      // one name of `aisles`, or '' for none
}
```

## Invariants

- **DATA-1** An item is one record. It is never copied; a view computes where it shows.
- **DATA-2** Item ids are unique.
- **DATA-3** Item names are unique in one list with no case distinction. `Leche` and `leche` are
  one name; `Cafe` and `Café` are two. Two lists can each hold an item `Leche`.
- **DATA-4** Removed: the state has no recipes.
- **DATA-5** Removed: the state has no recipes.
- **DATA-6** Removed: an item has no `list` and no `bought`. An item exists while it is to buy: a
  tick deletes it (LIST-12).
- **DATA-7** Removed: an item has no `again` field (STORE-8).
- **DATA-8** Removed: an item has no shops; it is in one list (DATA-16).
- **DATA-9** Removed: an item has no shops; it is in one list (DATA-16).
- **DATA-10** Removed: the state has no `sent`.
- **DATA-11** Removed: the state has no recipes.
- **DATA-12** Removed: an item has no shops; it is in one list (DATA-16).
- **DATA-13** Removed: the state has no `menu`.
- **DATA-14** The names of `aisles` are trimmed, not empty and unique with no case distinction.
- **DATA-15** `item.aisle` is `''` or a name of `aisles`, in the spelling of `aisles`. An item has
  one aisle at most. See [17-aisles.md](17-aisles.md).
- **DATA-16** `item.list` is the id of a list of `lists`. An item is in one list. List ids are
  unique, and list names are unique with no case distinction (LVL-2).

## Derived views

No view is stored.

| View | Function | Content |
|---|---|---|
| `Listas` | `activeItems` | Each item, in the order of `sort` |
| Shop groups | `shopGroups` | `Listas` by shop |
| Shops in use | `shopNames` | Each shop of an item, in name order |
| Aisle groups | `aisleGroups` | `Listas` by aisle, in the order of `aisles` |

A group of `shopGroups` and of `aisleGroups` has its `items` and `total`, the count of its items.
The figures of the screen are counts of items: the app has no trip figures.

## Name rules

| Use | Rule |
|---|---|
| Identity of an item, a shop, an aisle | `toLowerCase()`: no case distinction, accents count |
| Search of items | `fold`: trimmed, lower case, accents removed |
| Order by name | `localeCompare(…, 'es', { sensitivity: 'base' })`: no case and no accent distinction, in each language of the screen |

## Not in the state

- The language that the user chose. It is a preference of the device, with its own key. See
  [09-languages.md](09-languages.md).
- The section that is open, an open row, the text of a search and each other state of the screen.
  A start of the app shows `Listas` with all rows closed.
- The state before the last change, which `Deshacer` uses. It lives only while its message shows.
