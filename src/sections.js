// The sections, in the order of the bottom bar.
export const SECTIONS = ['active', 'settings'];

// The length of a slide that changes the section or a page.
const SLIDE_MIN = 60;

// The way of a slide of `dx`, `dy` px (right and down are positive): 1 for a slide to the left,
// which goes forward, -1 for a slide to the right, 0 for a slide that is short or not horizontal.
export const slideDirection = (dx, dy) => {
  if (Math.abs(dx) < SLIDE_MIN || Math.abs(dx) < 2 * Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
};

// The section that a slide of `dx`, `dy` px goes to from `view`, in the order of `sections`: the
// next one on a slide to the left, the previous one on a slide to the right. Null for no slide,
// and at the first and the last section.
export const slideTo = (view, dx, dy, sections = SECTIONS) => {
  const way = slideDirection(dx, dy);
  const index = sections.indexOf(view);
  if (!way || index < 0) return null;
  return sections[index + way] ?? null;
};

// A slide to the right inside an open list goes back to the first level of Listas, before any
// change of section (LVL-22).
export const slidesBack = (inList, dx, dy) => inList && slideDirection(dx, dy) === -1;

// The scroll down after which the add button collapses.
const FAB_COLLAPSE = 24;

// The state of the add button after a scroll of the list from `prevY` to `y` px: `open` at the top
// and on any scroll up, `collapsed` after a scroll down of more than 24 px, else `state`.
export const fabState = (prevY, y, state) => {
  if (y <= 0 || y < prevY) return 'open';
  return y - prevY > FAB_COLLAPSE ? 'collapsed' : state;
};

// The way from `from` to `to` in the order of `sections`: 1 towards a later section, -1 towards
// an earlier one, 0 when there is no way.
export const direction = (from, to, sections = SECTIONS) => {
  const [a, b] = [sections.indexOf(from), sections.indexOf(to)];
  return a < 0 || b < 0 ? 0 : Math.sign(b - a);
};

// The shortcuts of the launcher, in the order of `shortcuts` of the manifest. Each one opens the
// app at `?open=<name>`.
export const SHORTCUTS = ['create', 'active'];

// The start of a shortcut: the section to show, and `create` to open the list sheet of the first level
// there. Null for a name that is not a shortcut.
export const shortcutStart = (name) => {
  if (!SHORTCUTS.includes(name)) return null;
  return name === 'create' ? { view: 'active', create: true } : { view: name, create: false };
};

// True while the dock shows below 600px (it carries the add button): inside a list with an item.
export const dockShown = ({ view, inList, count }) => view === 'active' && inList && count > 0;

// What an empty section says and offers. `title` and `text` are keys of the catalog, `title` null for
// a search with no match. `action` is the next step as a button: `add-query`, `add-item` or
// `create-list`; null when nothing is. `query` is the search text, `level` is `top` for the first
// level of Listas and `list` for the inside of a list.
export const emptyAction = (view, { query, level }) => {
  const none = { title: null, text: null, action: null };
  if (view !== 'active') return none;
  if (level === 'top') return { title: 'empty.listsTitle', text: 'empty.lists', action: 'create-list' };
  if (query.trim() !== '') return { ...none, text: 'empty.noItemMatch', action: 'add-query' };
  return { title: 'empty.activeTitle', text: 'empty.active', action: 'add-item' };
};
