import * as store from '#store';
import * as lists from '#lists';
import * as aisles from '#aisles';
import { dockShown, emptyAction } from '#sections';
import { $, state, ui, t, render } from '#ui/context';
import { inList, atTop, viewState, found, shownGroup, endSearch } from '#ui/view';
import { itemNode, groupHead, groupNodes, hintSwipe } from '#ui/rows';
import { addQuery, openSheet } from '#ui/add';
import { listNodes, openListSheet } from '#ui/lists';

// The count of the full group, also while a search shows a part of it (LIST-23).
const groupCount = ({ total }) => String(total);

// The rows of the list below the aisle of each item, in the order of the walk. A row of an aisle
// has the group id `aisle:<name>`, so that it moves only inside its aisle.
const aisleNodes = () => {
  const { groups, rest } = store.filterGroups(aisles.aisleGroups(viewState()), ui.query);
  const grouped = groups.flatMap((group) => {
    const key = `aisle:${group.aisle}`;
    return [groupHead(group.aisle, groupCount(group), key), ...groupNodes(key, group.items.map((item) => itemNode(item, key)))];
  });
  const others = rest.length ? [groupHead(t('group.noAisle'), String(rest.length), 'noAisle'), ...groupNodes('noAisle', rest.map((item) => itemNode(item)))] : [];
  return [...grouped, ...others];
};

// The items of the list in view: below the aisle of each one, or flat.
const itemNodes = () => {
  if (shownGroup() === 'aisle') return aisleNodes();
  return store.activeItems(viewState()).filter(found).map((item) => itemNode(item));
};

// The header of Listas: at the first level the count of the lists and of their items, inside a list
// its name and the count of its items.
export const headerOf = () => {
  if (ui.view === 'settings') return { title: t('nav.settings'), subtitle: t('header.settingsSubtitle') };
  if (inList()) {
    const count = viewState().items.length;
    return { title: lists.findList(state, ui.list)?.name ?? '', subtitle: count ? t('count.items', { count }) : t('header.empty') };
  }
  const count = state.lists.length;
  if (!count) return { title: t('list.active'), subtitle: t('header.noLists') };
  return { title: t('list.active'), subtitle: `${t('count.lists', { count })} · ${t('count.items', { count: state.items.length })}` };
};

// The button text of each action of an empty section.
const ACTION_KEYS = { 'add-query': 'empty.addQuery', 'add-item': 'empty.addItem', 'create-list': 'empty.createList' };

let emptyRun = null;

// The title, the text and the action button of an empty section (STATE-1). With no action the add
// button of the screen is the action, and the button of the state stays hidden.
const renderEmpty = (shown) => {
  $('empty').hidden = !shown;
  const { title, text, action } = emptyAction(ui.view, { query: ui.query, level: atTop() ? 'top' : 'list' });
  const params = { query: ui.query.trim() };
  $('empty-title').hidden = !title;
  $('empty-title').textContent = title ? t(title) : '';
  $('empty-text').textContent = text ? t(text, params) : '';
  $('empty-action').hidden = !shown || !action;
  $('empty-action').textContent = action ? t(ACTION_KEYS[action], params) : '';
  $('empty').classList.toggle('apart', Boolean(title && action));
  emptyRun = { 'add-query': addQuery, 'add-item': openSheet, 'create-list': () => openListSheet() }[action] ?? null;
};

// The search field of a list shows after a tap on the search button, which a list with no item
// does not have.
const renderSearch = (items) => {
  const canOpen = inList() && items.length > 0;
  if (!canOpen) ui.searchOpen = false;
  if (!ui.searchOpen) ui.query = '';
  $('search-button').hidden = !canOpen;
  $('search-button').setAttribute('aria-expanded', String(ui.searchOpen));
  $('search').hidden = !ui.searchOpen;
  const label = t('search.items');
  $('query').placeholder = label;
  $('query').setAttribute('aria-label', label);
  // The field is not built again by a render, so it keeps the cursor. Write it only after a reset.
  if ($('query').value !== ui.query) $('query').value = ui.query;
};

export const renderList = () => {
  const items = inList() ? store.activeItems(viewState()) : [];
  renderSearch(items);
  const nodes = atTop() ? listNodes() : inList() ? itemNodes() : [];
  $('items').hidden = ui.view === 'settings';
  $('items').classList.toggle('list-cards', atTop() && state.view === 'cards');
  $('items').replaceChildren(...nodes);
  if (inList()) hintSwipe();
  renderEmpty(ui.view !== 'settings' && nodes.length === 0);
};

export const closeSearch = () => {
  endSearch();
  render();
};

// The dock of a list below 600px (styles.css hides it from 600px): the search button and the add
// button at the end; while the search is open, the search field, Cancelar and the add button. It
// shows inside a list with an item (`dockShown`). The app shows and labels the add button as the fab.
export const renderDock = () => {
  const shown = dockShown({ view: ui.view, inList: inList(), count: viewState().items.length });
  $('dock').hidden = !shown;
  if (!shown) return;
  const search = ui.searchOpen;
  $('dock').classList.toggle('searching', search);
  $('dock-search').hidden = search;
  $('dock-search').setAttribute('aria-expanded', String(search));
  $('dock-field').hidden = !search;
  $('dock-cancel').hidden = !search;
  $('dock-clear').hidden = ui.query === '';
  if ($('dock-query').value !== ui.query) $('dock-query').value = ui.query;
};

// The search of the dock fills the list from the bottom, so the nearest match is next to the field.
// The list goes to its end when the search opens and when its text changes; another render, such as
// a tick, leaves the scroll where it is.
let scrolledQuery = null;
export const showDockMatches = () => {
  if (!ui.searchOpen || $('dock').hidden || matchMedia('(min-width: 600px)').matches) {
    scrolledQuery = null;
    return;
  }
  if (ui.query === scrolledQuery) return;
  scrolledQuery = ui.query;
  const main = document.querySelector('main');
  main.scrollTop = main.scrollHeight;
};

export const bind = () => {
  $('empty-action').addEventListener('click', () => emptyRun?.());
  $('query').addEventListener('input', (event) => {
    Object.assign(ui, { query: event.target.value, openId: null });
    render();
  });
  // The press must not take the focus out of the field: the blur would close the search, and the
  // click would then open it again.
  $('search-button').addEventListener('mousedown', (event) => event.preventDefault());
  $('search-button').addEventListener('click', () => {
    if (ui.searchOpen) {
      closeSearch();
      return;
    }
    Object.assign(ui, { searchOpen: true, openId: null });
    render();
    $('query').focus();
  });
  // An empty field that loses the focus closes.
  $('query').addEventListener('blur', () => {
    if (ui.searchOpen && !ui.query.trim()) closeSearch();
  });
  $('dock-search').addEventListener('click', () => {
    Object.assign(ui, { searchOpen: true, openId: null });
    render();
    $('dock-query').focus();
  });
  $('dock-query').addEventListener('input', (event) => {
    Object.assign(ui, { query: event.target.value, openId: null });
    render();
  });
  // The clear and the cancel must not take the focus out of the field first: the blur of an empty
  // field closes the search.
  for (const id of ['dock-clear', 'dock-cancel']) $(id).addEventListener('pointerdown', (event) => event.preventDefault());
  $('dock-clear').addEventListener('click', () => {
    Object.assign(ui, { query: '', openId: null });
    render();
    $('dock-query').focus();
  });
  $('dock-cancel').addEventListener('click', () => {
    closeSearch();
    $('dock-search').focus();
  });
  $('dock-query').addEventListener('blur', () => {
    if (ui.searchOpen && !ui.query.trim()) closeSearch();
  });
};
