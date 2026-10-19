# lists

Stash: an offline shopping list PWA for one Android phone, by store. One list, `Compra`,
holds the items of the trip; each item has its shops, `Compra` has a list for each shop,
and the aisles of the store group it by section. A fork of Bodega (`../pwa-shopping-list`)
with no recipes, no menu of the week and no recurrent items. Plain HTML, CSS and ES modules;
no build step and no dependencies. `docs/spec/` is the specification.

## Commands

```sh
npm test         # unit tests (node --test)
npm run serve    # http://localhost:8080
npm run icons    # write the PNG icons again
npm run release  # bump, commit and tag vX.Y.Z; git push --follow-tags deploys
npm run ds       # copy the design system again from ../pwa-design-system
```

## Conventions

Read `.claude/conventions/` (loaded at session start): GIT, WRITING, CANONICAL,
WORKFLOW, AUTONOMY, ARCHITECTURE, RELEVANT-FILES.
