# Product

## Purpose

Stash keeps lists of things for one person on one Android phone: things to get from IKEA, a
hardware shop, the house, or any other place. It works with no connection. The first level of
`Listas` holds the lists that the user creates, and each list holds its pending items. A tick
deletes the item: it is done.

## User and device

- **PROD-1** One user and one device. There is no account and no sharing.
- **PROD-2** The target is Chrome on Android, with the app installed on the home screen. The app
  also works in a desktop browser with a mouse.
- **PROD-3** The layout is for a phone in portrait. The manifest locks the installed app to
  portrait.

## Constraints

- **PROD-4** All data stays on the phone, in the `localStorage` of the origin. The app sends no
  data to a server.
- **PROD-5** The only network requests are the static files of the same origin.
- **PROD-6** Each function works with no connection after the first load, except the check of the
  deployed version and the update.
- **PROD-7** The app is plain HTML, CSS and ES modules. It has no build step and no dependency, at
  run time or for development.
- **PROD-8** All URLs are relative, so the app works below a subpath of its host.
- **PROD-9** A destructive action has no confirmation. `Deshacer` restores the state for 5 seconds
  instead. The import of a backup is the exception: it asks first, and it also has `Deshacer`.

## Functions

| Function | Document |
|---|---|
| The list `Listas` and the tick | [03-lists.md](03-lists.md) |
| Add with search, with no duplicate | [03-lists.md](03-lists.md) |
| Search in `Listas` | [03-lists.md](03-lists.md) |
| Order by name or custom, with a manual move | [04-arrange.md](04-arrange.md) |
| Groups by aisle | [04-arrange.md](04-arrange.md) |
| The lists of the first level of `Listas` | [06-lists-level.md](06-lists-level.md) |
| Backup to a file and from a file | [08-storage.md](08-storage.md) |
| Seven languages | [09-languages.md](09-languages.md) |
| Walkthrough at the first start | [07-screen.md](07-screen.md) |
| Offline use, version and update | [10-offline-version.md](10-offline-version.md) |
| Reminder at the shop | [11-integrations.md](11-integrations.md) |

## Not in the product

These are decisions, not gaps.

- Quantities, units, prices, categories, notes and photos of an item.
- A list for a later trip, saved items, a history of bought items, and one item in two lists.
- A sync between devices, an account, a shared list. Google Tasks as a shared list was rejected.
- Geolocation in the app and system notifications.
- Recipes and a menu of the week.
- Right-to-left languages.

Each feature document lists the limits of its own area.
