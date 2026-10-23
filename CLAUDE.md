# lists

Stash: an offline PWA of lists of things for one Android phone. The first level of `Listas`
holds the lists that the user creates; each item lives in one list, and the aisles (the screen
says `Sección`) group a list by section. A tick deletes the item. A fork of Bodega
(`../pwa-shopping-list`) with no recipes, no menu of the week, no recurrent items and no trip. Plain HTML, CSS and ES modules;
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
