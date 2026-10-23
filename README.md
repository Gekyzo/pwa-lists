# Stash

An offline PWA of lists of things for one Android phone. The first level of `Listas` holds the
lists that you create, such as `IKEA` or `Casa`, as rows or cards; each list holds its pending
items. A tick deletes the item. Sections group a list. The app has seven languages, and a new install
starts with a walkthrough of three pages. Plain HTML, CSS and ES modules, with no build step and no dependencies.
The data stays in the `localStorage` of the browser.

Stash shares the origin `gekyzo.github.io` with Bodega, the app it is a fork of. It keeps its own
`lists.` storage keys and its own `lists-` caches, so the two apps do not touch the data of the
other. **Importar** reads a Bodega backup: it keeps the items to buy, makes a list of each shop and keeps the aisles, and
drops the saved and ticked items, the recipes, the menu and the recurrent marks.

- App: https://gekyzo.github.io/pwa-lists/
- Specification: [`docs/spec/`](docs/spec/README.md), with one identifier for each rule.
- Changes by version: [`CHANGELOG.md`](CHANGELOG.md).

## Install on Android

1. Open the app URL in Chrome.
2. Open the Chrome menu and tap **Add to Home screen → Install**.
3. Start the app from the home screen. It works without a network connection.

**Clear site data** in Chrome and the uninstall of the app delete the lists. Export a backup in
**Ajustes** before you do that.

## Develop

Node 20 or later.

```sh
npm run hooks    # enable the git hooks of .githooks/ in this clone (one time)
npm test         # unit tests (node:test)
npm run serve    # http://localhost:8080
npm run icons    # write the PNG icons again after a change in icons/source.png or scripts/make-icons.mjs
npm run release  # bump the version, commit it and tag it vX.Y.Z
npm run ds       # copy the design system again from ../pwa-design-system
```

A change of behaviour changes its rule in `docs/spec/` in the same commit. The `pre-commit` hook
stops a commit of the app that has no change of the specification; `git commit --no-verify` passes
a commit that changes no rule.

## Design system

The shared tokens, components and layouts come from `pwa-design-system`, copied into
`vendor/design-system/` by `npm run ds`; `SOURCE.json` there names the version and the commit.
`index.html` loads `vendor/design-system/design-system.css`, then `styles.css`, which holds the
parts of the app only. Change a shared part in `pwa-design-system`, then run `npm run ds`; never
edit `vendor/` by hand. The icons are in `icons.svg`
([`docs/spec/15-design-system.md`](docs/spec/15-design-system.md)). The catalogue shows
each part with its name, its variants, a live example and its markup: run `npm run serve`, then
open http://localhost:8080/designs/. Ask for a screen with those names. `tests/design.test.js`
fails when a class, a raw value or an icon is not part of the system.

## Deploy

A release tag is a deploy; a push to `main` deploys nothing.

```sh
npm run release              # or: npm run release -- minor|major
git push --follow-tags
```

`npm run release` makes the commit `Bump version to X.Y.Z`, which also gives the version to the
changes under `Unreleased` in `CHANGELOG.md`, and tags it `vX.Y.Z`. The push of the tag runs
`.github/workflows/pages.yml`, which publishes the tagged commit to GitHub Pages. The `pre-push`
hook stops a tag whose `version.json` has another version.

### First release

`version.json` starts at `0.0.0`. Make the first release with `npm run release -- major`, so that
the first version is `1.0.0`. Before the first deploy, set two things in the settings of the
GitHub repository:

1. **Pages → Source**: `GitHub Actions`.
2. **Environments → github-pages**: allow the tags `v*` to deploy.

Deploy Bodega with commit `e163b40` of `pwa-shopping-list` before the first deploy of Stash. An
older Bodega deletes each cache of the origin that is not its own, so its next update deletes the
offline copy of Stash.

## Where to read

| Subject | Document |
|---|---|
| What the app does, and what it does not do | [01-product](docs/spec/01-product.md) |
| The list, the tick and the add sheet | [03-lists](docs/spec/03-lists.md) |
| Order, groups and lists | [04-arrange](docs/spec/04-arrange.md), [06-lists-level](docs/spec/06-lists-level.md) |
| The aisles of the store | [17-aisles](docs/spec/17-aisles.md) |
| Gestures, messages, undo and the walkthrough | [07-screen](docs/spec/07-screen.md) |
| The stored format and the backup | [02-data-model](docs/spec/02-data-model.md), [08-storage](docs/spec/08-storage.md) |
| Languages and the rules of the text | [09-languages](docs/spec/09-languages.md) |
| Offline use, version, deploy and installation | [10-offline-version](docs/spec/10-offline-version.md), [16-install](docs/spec/16-install.md) |
| The reminder at the shop, the shortcuts and the voice commands | [11-integrations](docs/spec/11-integrations.md) |
| Modules, code rules and tests | [12-engineering](docs/spec/12-engineering.md) |
