# Changelog

The changes of the app that a user sees, by deployed version. The newest version is first. The
names of the screen are the Spanish ones, as in [`docs/spec/`](docs/spec/README.md).

A change that is not deployed goes under `Unreleased`, in the commit that makes the change. The
commit `Bump version to X.Y.Z` gives its version and its date to those changes. A version with
no change for the user has no entry.

## Unreleased

- The sections of `Secciones de las listas` are rows across the sheet, as the rows of a list; the moves that can not go further fade. The choice of `Agrupar por` is as wide as each button that shows.
- The groups of `Ajustes` run across the full width, with no cards. `Siguiente` and `Ver todas las listas` at the end of a list are tonal buttons.
- The head of a group shows its count in grey and ends with a chevron icon: down while the group is open, right while it is closed. `Sin lista` and `Sin sección` also show their count.
- On a phone the `+` button is the last button of the bar above the bottom bar, in place of the round button over the list. With **Izquierda** it is at the left end. On a wider screen nothing changes.
- `Listas` has no basket drawn behind the list. The bar of the phone is dark when the phone uses dark colours.
- The bottom bar draws `Listas` as a list with ticks and `Ajustes` as a gear. **Listo** in the head of each sheet is a tonal button.
- The header has no ring: the title and the count of the list stand alone.
- The main action colour is the green of Bodega: the `+`, the main buttons and **Atrás**. The drawings of the introduction take the same colour; a control named in its texts is in the colour of the text.
- Stash speaks of lists of things, not of a shopping list. The app is `Stash - Listas`; the main section is `Listas`, with the header `Mis listas`. A shop is a `Lista`, an item is an `elemento`, and a tick says `"name" hecho.` The six other languages say the same.
- `Secciones de la tienda` has no **Usar secciones habituales**: the sections are written by hand.
- The look of design system 0.7.1: the Geist font, the stone ground, smaller corners, heads in the colour of the text, and the names of the fields of a sheet above their boxes.
- A tick deletes the item, with `"name" comprado.` and `Deshacer`. `Compra` has no `Comprados (N)`, no **Terminar compra**, no banner `¿Has terminado?` and no saved items; `Ajustes` has no **Al terminar la compra**. The header says `N artículos`, and the walkthrough has three pages. A backup or a stored list keeps only the items to buy.

## 1.0.0 - 2026-10-19

- First version: Bodega 1.2.1 under the name Stash, with its own storage keys and its own offline copy, so that the two apps run side by side on one site.
