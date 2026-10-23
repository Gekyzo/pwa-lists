import * as store from '#store';
import * as lists from '#lists';
import { state, ui } from '#ui/context';

// An item row can show in a group: `groupId` tells the rows of the screen apart.
export const isOpen = (id, groupId) => ui.openId === id && ui.openGroup === groupId;

// True inside a list of Listas, and at its first level, where the lists show.
export const inList = () => ui.view === 'active' && ui.list !== null;
export const atTop = () => ui.view === 'active' && ui.list === null;

// The state of the list on the screen. The operations still run on the full state.
export const viewState = () => (inList() ? lists.listState(state, ui.list) : state);

// True for an item that the search of the list shows.
export const found = (item) => store.matchesItem(item, ui.query);
// True while the search field has a text.
export const searching = () => ui.query.trim() !== '';

// The choices that the arrange sheet has for the view. Inside a list: the aisle groups when an item
// has an aisle, and the order of a list with two items or more. At the first level: the view of the
// lists while one exists, and their order with two lists or more.
export const arrangeChoices = () => {
  const none = { aisle: false, sort: false, view: false, listSort: false };
  if (atTop()) return { ...none, view: state.lists.length > 0, listSort: state.lists.length > 1 };
  if (!inList()) return none;
  const items = store.activeItems(viewState());
  return { ...none, aisle: items.some((item) => item.aisle !== ''), sort: items.length > 1 };
};

// The grouping that the view shows: the choice of the user, when the view can show it.
export const shownGroup = () => (state.group === 'aisle' && arrangeChoices().aisle ? 'aisle' : 'none');

// An add closes the search of the list, so that the row that it brings is in view.
export const endSearch = () => Object.assign(ui, { searchOpen: false, query: '' });
