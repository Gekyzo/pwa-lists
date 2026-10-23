# Bodega style

## Goal

Stash looks like Bodega 1.3.3 (`../pwa-shopping-list`, `296a2ec`). Stash was forked at `1ba991e`;
Bodega then restyled itself on design system 0.6.0 and 0.7.x. Stash took design system 0.7.1
(`8f28443`), but not the app-side changes of the restyle.

## Decisions

- **Colour:** the green of Bodega is the main action colour (`--primary` = `--done`,
  `#1f7a4d` / `#5fc491`), as Bodega `164c6aa`.
- **Header:** no ring and no progress bar. Bodega shows the share of ticked items; in Stash a tick
  deletes the item, so there is no share. The header keeps its title and subtitle `N elementos`.
- **Group head:** the count of the group with the chevron icon (down open, right closed), muted
  and small. No `1 de 4`: a Stash group has no done items.
- **Bottom bar icon of `Listas`:** a list icon (Lucide `list-checks`), not the cart: Stash is not
  a shopping list. `Ajustes` takes the Lucide gear of Bodega.

## Ported from Bodega

| Bodega | What | Stash |
|---|---|---|
| `164c6aa` | Green main action, walkthrough art and keys | Same |
| `0ea95c2` | Ring replaced by a progress bar | Ring removed, no bar |
| `3c13586`, `bd0fe3e` | Lucide icons, names in the bar, `Listo` tonal | Same, list icon for `Listas` |
| `43d6430` | No corner basket | Same |
| `bc338ec` | `+` at the end of the dock on a phone | Same |
| `1242bba`, `8d823b5`, `57abc95` | Group head: chevron icon, muted count | Count with no `de` |
| `cad1a97`, `0d04cd5` | Secondary actions tonal | `Ver todas`, `Siguiente`, empty secondary |
| `2400cfe` | `Ajustes` groups full width | Same |
| `c90c4fe`, `f822a77` | Aisles as list rows, faded moves | Same |
| `45dabc4` | Grouping control sized by its choices | Same |
| `9c2a679` | Empty list: title, text, button apart | Same, Stash texts |

Not ported: recipes, menu, trip, `Comprados`, the sample data switch, the app icon (a shopping
bag).

## Checks

`npm test`; a browser at 360×760, light and dark, both hands; `docs/spec/` changes with each
task (pre-commit hook).
