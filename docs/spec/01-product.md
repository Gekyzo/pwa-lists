# Product

## Purpose

Stash is a shopping list for one person on one Android phone. It works in the shop with no
connection. It keeps one list, `Compra`, of the items to buy, each with its optional shops. A
tick deletes the item: it is bought.

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
| The list `Compra` and the tick | [03-lists.md](03-lists.md) |
| Add with search, with no duplicate | [03-lists.md](03-lists.md) |
| Search in `Compra` | [03-lists.md](03-lists.md) |
| Order by name or custom, with a manual move | [04-arrange.md](04-arrange.md) |
| Groups by shop or by aisle | [04-arrange.md](04-arrange.md) |
| Shops of an item | [05-shops.md](05-shops.md) |
| A list for each shop, in `Compra` | [05-shops.md](05-shops.md) |
| Backup to a file and from a file | [08-storage.md](08-storage.md) |
| Seven languages | [09-languages.md](09-languages.md) |
| Walkthrough at the first start | [07-screen.md](07-screen.md) |
| Offline use, version and update | [10-offline-version.md](10-offline-version.md) |
| Reminder at the shop | [11-integrations.md](11-integrations.md) |

## Not in the product

These are decisions, not gaps.

- Quantities, units, prices, categories, notes and photos of an item.
- More than one list, a list for a later trip, saved items, and a history of bought items.
- A sync between devices, an account, a shared list. Google Tasks as a shared list was rejected.
- Geolocation in the app and system notifications.
- Recipes and a menu of the week.
- A screen of shops, a rename of a shop for all its items.
- Right-to-left languages.

Each feature document lists the limits of its own area.
