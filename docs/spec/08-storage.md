# Storage and backup

Rules of `src/storage.js`, and of its use in `src/ui/context.js` and `src/ui/settings.js`.

## Keys

| Store | Key | Content |
|---|---|---|
| `localStorage` | `lists.v1` | The state, as JSON |
| `localStorage` | `lists.v1.corrupt` | The last stored text that was not a valid state |
| `localStorage` | `lists.lang` | The language that the user chose ([09-languages.md](09-languages.md)) |
| `localStorage` | `lists.hand` | `left` when the user chose **Izquierda** ([07-screen.md](07-screen.md), NAV-12) |
| `localStorage` | `lists.theme` | `light` or `dark` when the user chose **Claro** or **Oscuro** ([07-screen.md](07-screen.md), NAV-17) |
| `localStorage` | `lists.density` | `compact` when the user chose **Compacta** ([07-screen.md](07-screen.md), NAV-21) |
| `localStorage` | `lists.shopLists` | `hide` when the user hid the row of shop lists ([05-shops.md](05-shops.md), SHOP-25) |
| `localStorage` | `lists.swipeHint` | `1` after `Compra` showed the slide of a row one time ([07-screen.md](07-screen.md), ROW-14) |
| `localStorage` | `lists.onboarded` | `1` after the walkthrough of the first start closed ([07-screen.md](07-screen.md), ONB-7) |
| Cache API | `lists-shell-v3` | The app shell ([10-offline-version.md](10-offline-version.md)) |
| Cache API | `lists-manifest` | The name, the description and the shortcut names of the manifest in the language of the screen (SW-13) |

The `v1` of the key is the version of the key, not of the state. The state has its own `version`.

## Load and save

- **STORE-1** The app reads the state one time, at the start, before the first render. With no
  stored state it starts with the empty state.
- **STORE-2** Each change writes the full state at once, in the same task as the change.
- **STORE-3** The state on the screen is always the state in memory. A render builds the lists
  from it; the page holds no data of its own.
- **STORE-4** The app asks the browser for persistent storage at each start
  (`navigator.storage.persist()`), and ignores the answer.

## Validation

- **STORE-5** A stored state is used only when it is valid. If not, the app copies the stored text
  to `lists.v1.corrupt` and starts with the empty state. The first change then replaces
  `lists.v1`.
- **STORE-6** A state is not valid when one of these is true:
  - it is not an object, its `version` is not 1 to 11, or `items` is not a list;
  - an item has no string `id`, no name, a `list` that is present and not `active`, `saved` or
    the old `next` (STORE-8), a `bought` that is present and not a boolean, or an `again` that is
    present and not a boolean;
  - two items have the same id or the same name (DATA-2, DATA-3).

  The recipes, `sent` and the menu of a Bodega state are not checked: STORE-7 drops them. The
  `recurrent` of a Bodega item is not checked: STORE-8 reads it, then drops it.
- **STORE-7** A valid state is cleaned when it is read. These defects are repaired with no error:

  | Field | Repair |
  |---|---|
  | Names of items, shops | Trimmed |
  | `list`, `bought` of an item | Read for STORE-8, then dropped. With no `list` and no `bought`, the item is to buy |
  | `quantity` | Not text: `''`. Text: trimmed |
  | `shops` | Not a list: empty. An entry that is not text, is empty or is a duplicate: dropped |
  | `aisles` | Not a list: empty. An entry that is not text, is empty or is a duplicate with no case distinction: dropped. The rest trimmed |
  | `aisle` of an item | Not text, or not an aisle of `aisles`: `''`. An aisle: the spelling of `aisles` |
  | Shop spellings | Each shop gets the spelling of its first use |
  | `recipes`, `sent`, `menu` of a Bodega state | Dropped, valid or not |
  | `recurrent` of a Bodega item | Read for `again` (STORE-8), then dropped, valid or not |
  | `group` | Not `shop`, `aisle` or `none`, such as the `recipe` of Bodega: `none` when `grouped` is `false` (STORE-8), else `shop` |
  | `sort` | Unknown: `custom` |
  | Unknown fields | Dropped |

- **STORE-8** Versions 1 to 9 are the states of Bodega; version 10 is the first state of Stash,
  and version 11 the first with no saved and no ticked items. A Bodega backup and a Stash state
  thus never have the same version. An older state is migrated when it is read, and saved as
  version 11 at the next change:

  | From | Change |
  |---|---|
  | Version 1 or 2 | `group` is `none` when `grouped` is `false`, and `shop` if not. Each item gets `shops: []`. `sort` is `custom` when absent |
  | Version 1 to 4 | Each item gets `quantity: ''` |
  | Version 1 to 5 | No change of the data: version 6 adds `list: 'saved'` |
  | Version 1 to 6 | `aisles: []`, and each item gets `aisle: ''` |
  | Version 1 to 7 | An item of `list: 'next'` is to buy. A ticked item of `Compra` with `again: true` loses its tick, except a recurrent item (`recurrent: true`), which keeps it. A `recurrent` that is not a boolean counts as not recurrent. Each item loses `again` |
  | Version 1 to 8 | No change of the data: version 9 of Bodega adds the dish of a meal, which Stash drops |
  | Version 1 to 9 | No change of the data: the drops of STORE-7 make it a version 10 state |
  | Version 1 to 10 | A saved item (`list: 'saved'`) and a ticked item (`bought: true`, after the row of version 1 to 7) are dropped: they are not to buy. Each other item loses `list` and `bought` |

## Failures

- **STORE-9** When a write fails, the change stays in memory and on the screen, and a message says
  that it was not saved (MSG-8).
- **STORE-10** When `localStorage` is not available, the app works in memory and says so at the
  start: `El almacenamiento no está disponible: los cambios no se guardan.` A choice of language,
  of hand, of theme or of density then lasts until the app closes, and the walkthrough shows only from `Ajustes`
  (ONB-8).
- **STORE-11** The app does not read a change that another tab makes. The last tab that writes
  wins.

## Backup

- **BACKUP-1** **Exportar** downloads the file `stash-YYYY-MM-DD-HHMMSS.json`, with the
  local date and time. Two exports of one day get two names.
  Its content is the state, as JSON with an indent of 2 spaces.
- **BACKUP-2** The backup holds the items (`id`, `name`, `shops`, `quantity`, `aisle`), `group`,
  `sort` and `aisles`. It does not hold the language, the hand, the theme, the density or the flag
  of the walkthrough.
- **BACKUP-3** **Importar** opens a file choice for a JSON file. A file that is not JSON
  gives `error.invalidJson`. A JSON that is not a valid state (STORE-6) gives `error.notBackup`.
- **BACKUP-4** A valid file is cleaned and migrated as a stored state is (STORE-7, STORE-8). A
  backup of version 1 to 11 is thus accepted, also a backup of Bodega with recipes and a menu: the
  import keeps its items to buy, groups, order and aisles only.
- **BACKUP-5** Before the import the app asks: `¿Sustituir los datos actuales por los de la copia
  (N artículos)?`, with the count of the items only. A yes replaces the full state. It does not merge.
- **BACKUP-6** The import has `Deshacer`, with the message `Copia importada.`
- **BACKUP-7** **Borrar todos los datos** asks `¿Borrar todos los datos? Se borran las listas,
  las secciones y las preferencias. Exporta una copia antes si quieres
  conservarlos.` A yes removes each `localStorage` key of the table above and loads the app again,
  which then starts as a new install, with the walkthrough (ONB-7). It has no `Deshacer`. When the
  removal fails, the message `error.resetFailed` says `No se pudieron borrar los datos.` and nothing
  else changes. The caches stay.

## Loss of data

**Clear site data** in Chrome and the uninstall of the app delete the lists. An export before
that is the only protection.

## Limits

No automatic backup. No merge of two states. No sync between tabs or devices. The state is in
`localStorage`; a move to IndexedDB is an open item.
