import * as store from '#store';
import * as shops from '#shops';
import * as aisles from '#aisles';
import { dockShown, emptyAction } from '#sections';
import { $, el, state, ui, t, shopLists, render } from '#ui/context';
import { inList, viewState, found, searching, shownGroup, endSearch } from '#ui/view';
import { itemNode, groupHead, groupNodes, hintSwipe } from '#ui/rows';
import { addQuery } from '#ui/add';

// The count of the full group, also while a search shows a part of it (LIST-23).
const groupCount = ({ total }) => String(total);

// The rows of the list below the shop of each item. A row of a shop has the group id `shop:<name>`.
const shopNodes = () => {
  const { groups, rest } = store.filterGroups(shops.shopGroups(viewState()), ui.query);
  const grouped = groups.flatMap((group) => {
    const key = `shop:${group.shop}`;
    return [groupHead(group.shop, groupCount(group), key), ...groupNodes(key, group.items.map((item) => itemNode(item, key)))];
  });
  const others = rest.length ? [groupHead(t('group.noShop'), String(rest.length), 'noShop'), ...groupNodes('noShop', rest.map((item) => itemNode(item)))] : [];
  return [...grouped, ...others];
};

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

// The items of Compra: below the shop of each one, below the aisle of each one, or flat.
const listNodes = () => {
  const group = shownGroup();
  if (group === 'shop') return shopNodes();
  if (group === 'aisle') return aisleNodes();
  return store.activeItems(viewState()).filter(found).map((item) => itemNode(item));
};

// The header of Compra counts the items of the list in view.
export const headerOf = (count) => {
  if (ui.view === 'settings') return { title: t('nav.settings'), subtitle: t('header.settingsSubtitle') };
  const subtitle = count ? t('count.items', { count }) : t('header.empty');
  return { title: t('header.today'), subtitle };
};

// The button text of each action of an empty section.
const ACTION_KEYS = { 'add-query': 'empty.addQuery' };

let emptyRun = null;

// The title, the text and the action button of an empty section (STATE-1). With no action the add
// button of the screen is the action, and the button of the state stays hidden.
const renderEmpty = (shown) => {
  $('empty').hidden = !shown;
  const { title, text, action } = emptyAction(ui.view, { query: ui.query });
  const params = { query: ui.query.trim() };
  $('empty-title').hidden = !title;
  $('empty-title').textContent = title ? t(title) : '';
  $('empty-text').textContent = text ? t(text, params) : '';
  $('empty-action').hidden = !shown || !action;
  $('empty-action').textContent = action ? t(ACTION_KEYS[action], params) : '';
  emptyRun = { 'add-query': addQuery }[action] ?? null;
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

// A shop list of Compra with no item, while other items are still to buy, points to the next shop
// list (SHOP-23). True when the card shows.
const renderShopDone = () => {
  const shop = ui.shop;
  const done = ui.view === 'active' && shop !== null && !searching() && state.items.length > 0 &&
    viewState().items.length === 0;
  $('shop-done').hidden = !done;
  if (!done) return false;
  const next = shops.nextShop(state, shop);
  $('shop-done-text').textContent = t('shops.done', { shop: shopLabel(shop) });
  $('shop-done-next').hidden = next === null;
  if (next) $('shop-done-next').textContent = t('shops.next', { shop: shopLabel(next.shop), count: next.count });
  $('shop-done-next').onclick = () => {
    ui.shop = next.shop;
    render();
  };
  $('shop-done-all').onclick = () => {
    ui.shop = null;
    render();
  };
  return true;
};

export const renderList = () => {
  const items = ui.view === 'active' ? store.activeItems(viewState()) : [];
  renderSearch(items);
  const nodes = ui.view === 'settings' ? [] : listNodes();
  $('items').hidden = ui.view === 'settings';
  $('items').replaceChildren(...nodes);
  if (ui.view === 'active') hintSwipe();

  const done = renderShopDone();
  renderEmpty(ui.view !== 'settings' && nodes.length === 0 && !done);
};

export const shopLabel = (shop) => (shop === null ? t('shops.all') : shop === '' ? t('group.noShop') : shop);

// The row of the shop lists of Compra. A count is the items of the list.
export const renderShopChips = () => {
  const chips = inList() && shopLists === 'show' ? shops.shopChips(state) : [];
  $('shop-chips').hidden = chips.length === 0;
  const buttons = chips.map(({ shop, count }) => {
    const pick = () => {
      Object.assign(ui, { openId: null, openSide: null });
      ui.shop = shop;
      render();
    };
    const button = el('button', { type: 'button', className: 'chip surface', onclick: pick }, [
      el('span', { textContent: shopLabel(shop) }),
      el('span', { className: 'count', textContent: String(count) }),
    ]);
    button.setAttribute('aria-pressed', String(shop === ui.shop));
    return button;
  });
  $('shop-chips').replaceChildren(...buttons);
};

export const closeSearch = () => {
  endSearch();
  render();
};

const pickShop = (shop) => {
  Object.assign(ui, { openId: null, openSide: null, shop });
  render();
};

// The dock of Listas below 600px (styles.css hides it from 600px): the shop list in view between the
// arrows of the previous and the next list, the search button and the add button at the end; while
// the search is open, the search field, Cancelar and the add button. It shows while Listas has an
// item (`dockShown`). The app shows and labels the add button as the fab.
export const renderDock = () => {
  const shown = dockShown({ view: ui.view, activeCount: store.activeItems(state).length });
  $('dock').hidden = !shown;
  if (!shown) return;
  const chips = shopLists === 'show' ? shops.shopChips(state) : [];
  const search = ui.searchOpen;
  $('dock').classList.toggle('searching', search);
  for (const id of ['dock-prev', 'dock-shop', 'dock-next']) $(id).hidden = search || chips.length === 0;
  $('dock-search').hidden = search;
  $('dock-search').setAttribute('aria-expanded', String(search));
  $('dock-field').hidden = !search;
  $('dock-cancel').hidden = !search;
  $('dock-clear').hidden = ui.query === '';
  if ($('dock-query').value !== ui.query) $('dock-query').value = ui.query;
  if (!chips.length) return;
  // A shop list that a tick emptied has no chip: the dock shows it with no item.
  const current = chips.find((chip) => chip.shop === ui.shop) ?? (ui.shop === null ? chips[0] : { shop: ui.shop, count: 0 });
  $('dock-shop').replaceChildren(
    el('span', { className: 'dock-shop-name', textContent: shopLabel(current.shop) }),
    el('span', { className: 'count', textContent: current.count === 0 ? '✓' : String(current.count) }),
    el('span', { className: 'chevron', textContent: '▾', ariaHidden: 'true' }),
  );
  $('dock-shop').setAttribute('aria-expanded', String(ui.shopPickOpen));
  const previous = shops.previousShop(state, ui.shop);
  const next = shops.nextShop(state, ui.shop);
  $('dock-prev').disabled = previous === null;
  $('dock-next').disabled = next === null;
  $('dock-prev').onclick = () => previous && pickShop(previous.shop);
  $('dock-next').onclick = () => next && pickShop(next.shop);
};

// The shop picker of the dock: one entry for each shop list, with the count of its items.
export const renderShopPick = () => {
  if (!inList()) ui.shopPickOpen = false;
  $('shop-pick').hidden = !ui.shopPickOpen;
  if (!ui.shopPickOpen) return;
  const chips = shopLists === 'show' ? shops.shopChips(state) : [];
  $('shop-pick').querySelector('.sheet-body').replaceChildren(...chips.map(({ shop, count }) => {
    const pick = () => {
      ui.shop = shop;
      closeShopPick();
    };
    const button = el('button', { type: 'button', className: 'button outline entry', onclick: pick }, [
      el('span', { textContent: shopLabel(shop) }),
      el('small', { className: 'entry-note', textContent: t('count.items', { count }) }),
    ]);
    button.setAttribute('aria-pressed', String(shop === ui.shop));
    return button;
  }));
};

export const closeShopPick = () => {
  ui.shopPickOpen = false;
  render();
  $('dock-shop').focus();
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
  $('dock-shop').addEventListener('click', () => {
    Object.assign(ui, { shopPickOpen: true, openId: null, openSide: null });
    render();
    $('shop-pick').querySelector('.sheet-body').querySelector('[aria-pressed="true"]')?.focus();
  });
  $('shop-pick-veil').addEventListener('click', closeShopPick);
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
