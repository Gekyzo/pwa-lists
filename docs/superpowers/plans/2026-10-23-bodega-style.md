# Bodega style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stash takes the app-side style of Bodega 1.3.3.

**Architecture:** Port the end state of each area from `../pwa-shopping-list` (HEAD `296a2ec`), not its commits: the patches do not apply, and some of them undo others. Each task reads the named Bodega commits, ports what applies to Stash, and changes `docs/spec/` with the code.

**Tech Stack:** Plain HTML, CSS, ES modules, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-23-bodega-style-design.md`

## Global Constraints

- `npm test` green after each task; one commit for each task, with a body.
- A task that changes `src/`, `sw.js`, `index.html` or `manifest.webmanifest` changes `docs/spec/` (pre-commit hook).
- A change the user sees gets a line under `Unreleased` in `CHANGELOG.md`.
- No shopping words on the screen; no release, no push.

---

### Task 1: Green main action

Bodega `164c6aa`. `--primary` is the green `--done`; the walkthrough art takes `--primary`, an onboarding key takes `--text`.

- [ ] Port the tokens and the walkthrough parts of `styles.css`; `designs/index.html` if it names a colour.
- [ ] `npm test`; commit `Make green the main action colour`.

### Task 2: Header with no ring

Bodega `0ea95c2`, with no bar. Remove `#ring`, its CSS and its field of `headerOf`; update the spec of the header.

- [ ] Failing test, if `headerOf` has one; implement; `npm test`; commit `Remove the ring of the header`.

### Task 3: Bottom bar and sheet heads

Bodega `3c13586`, `bd0fe3e`. Lucide gear for `Ajustes`, Lucide `list-checks` for `Listas`, `Listo` tonal in each sheet head.

- [ ] Port; `npm test`; commit `Draw the bottom bar with Lucide icons and make Listo tonal`.

### Task 4: No corner basket

Bodega `43d6430` (its basket part). Remove `.icon.corner`, its tokens, its markup, its symbol and its code.

- [ ] Port; `npm test`; commit `Drop the corner basket`.

### Task 5: The + in the dock

Bodega `bc338ec`. Below 600px the `+` is the last control of the dock.

- [ ] Port with its tests; `npm test`; commit `Put the + at the end of the dock on a phone`.

### Task 6: Group heads

Bodega `1242bba`, `8d823b5`, `57abc95`. The chevron icon, a muted small count with no `de`.

- [ ] Port with its tests; `npm test`; commit `Show a group count with a chevron icon`.

### Task 7: Tonal actions and full-width Ajustes

Bodega `cad1a97`, `0d04cd5`, `2400cfe`.

- [ ] Port with the markup tests; `npm test`; commit `Make the secondary actions tonal and Ajustes full width`.

### Task 8: Aisles and grouping control

Bodega `c90c4fe`, `f822a77`, `45dabc4`.

- [ ] Port; `npm test`; commit `Draw the aisles as list rows and size the grouping control`.

### Task 9: Empty list

Bodega `9c2a679`, with the texts of Stash.

- [ ] Port; `npm test`; commit `Lay out the empty list as in Bodega`.

### Task 10: Browser check

- [ ] 360×760, light and dark, both hands: `Listas` with items and empty, a shop list, the dock, each sheet, `Ajustes`, the walkthrough. Unregister the service worker and clear the caches before each load. Fix what differs from Bodega in its own commit.
