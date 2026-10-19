# Data model

## State

The app has one state object. Each operation returns a new object and never changes its input.

```js
{
  version: 10,
  items: [Item],      // insertion order, changed only by a manual move
  group: 'shop',      // 'shop' | 'aisle' | 'none'
  sort: 'custom',     // 'custom' | 'name'
  aisles: [string],   // the sections of the store, in the order of the walk
}
```

The empty state is `{ version: 10, items: [], group: 'shop', sort: 'custom', aisles: [] }`.

## Item

```js
{
  id: string,         // crypto.randomUUID()
  name: string,       // trimmed, not empty
  list: 'active' | 'saved', // 'saved': kept after a trip, out of Compra
  bought: boolean,    // ticked
  shops: [string],    // shop names
  quantity: string,   // free text, such as '2' or '1 kg'; trimmed; '' for none
  aisle: string,      // one name of `aisles`, or '' for none
}
```

## Invariants

- **DATA-1** An item is one record. It is never copied; a view computes where it shows.
- **DATA-2** Item ids are unique.
- **DATA-3** Item names are unique with no case distinction, in `Compra` and saved. `Leche` and
  `leche` are one name; `Cafe` and `Café` are two.
- **DATA-4** Removed: the state has no recipes.
- **DATA-5** Removed: the state has no recipes.
- **DATA-6** `bought` is true only for an item of `list: 'active'`. A saved item is never ticked.
- **DATA-7** Removed: an item has no `again` field (STORE-8).
- **DATA-8** The shops of one item are unique with no case distinction, trimmed and not empty.
- **DATA-9** One shop has one spelling in the full state: the spelling of its first use.
- **DATA-10** Removed: the state has no `sent`.
- **DATA-11** Removed: the state has no recipes.
- **DATA-12** A shop has no record. It exists while an item has it.
- **DATA-13** Removed: the state has no `menu`.
- **DATA-14** The names of `aisles` are trimmed, not empty and unique with no case distinction.
- **DATA-15** `item.aisle` is `''` or a name of `aisles`, in the spelling of `aisles`. An item has
  one aisle at most. See [17-aisles.md](17-aisles.md).

## Derived views

No view is stored.

| View | Function | Content |
|---|---|---|
| `Compra` | `activeItems` | The items of `list: 'active'`, those to buy first, then those ticked |
| Trip figures | `tripSummary` | `total`, `left`, `back`, `saved` |
| Trip outcome | `tripOutcome` | `kept`, `open`, `bought` |
| Shop groups | `shopGroups` | `Compra` by shop |
| Shops in use | `shopNames` | Each shop of an item, in name order |
| Aisle groups | `aisleGroups` | `Compra` by aisle, in the order of `aisles` |

`tripSummary` gives: `total`, the items of `Compra`; `left`, those not ticked; `back`, the open
items kept with `Aplazar` (TRIP-6); `saved`, the other items of `Compra`, ticked or not:
`total` − `back`. `tripOutcome` splits the items of `Compra` by where each one goes (TRIP-4):
`kept`, open items kept with `Aplazar`; `open`, the other open items, saved; `bought`, ticked
items, saved. The three add up to `total`.

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
  A start of the app shows `Compra` with all rows closed.
- The state before the last change, which `Deshacer` uses. It lives only while its message shows.
