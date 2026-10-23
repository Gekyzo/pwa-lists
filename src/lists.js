import { LIST_VIEWS, SORTS, activeItems, compareNames } from '#store';

export { LIST_VIEWS };

// A list is a record `{ id, name }` of `state.lists`; an item is in the list of `item.list`.
const reject = (state, key, params) => ({ state, error: params ? { key, params } : { key } });

// Two spellings of a name are one name.
const keyOf = (name) => name.toLowerCase();

export const findList = (state, id) => state.lists.find((list) => list.id === id);

const byName = (a, b) => compareNames(a.name, b.name);

// The lists in the order that the user chose. The order of `state.lists` is the custom order.
export const listsInOrder = (state) => (state.listSort === 'name' ? [...state.lists].sort(byName) : state.lists);

// The error of a new name, or null. `ownId` is the list that the name replaces.
const nameError = (state, name, ownId) => {
  if (!name) return ['error.listRequired'];
  const duplicate = state.lists.find((list) => list.id !== ownId && keyOf(list.name) === keyOf(name));
  return duplicate ? ['error.duplicateList', { name: duplicate.name }] : null;
};

export const addList = (state, rawName, newId = () => crypto.randomUUID()) => {
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name);
  if (error) return reject(state, ...error);
  const id = newId();
  return { state: { ...state, lists: [...state.lists, { id, name }] }, id };
};

// A rename that changes only the case is allowed.
export const renameList = (state, id, rawName) => {
  const own = findList(state, id);
  if (!own) return reject(state, 'error.listNotFound');
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name, id);
  if (error) return reject(state, ...error);
  if (name === own.name) return { state };
  return { state: { ...state, lists: state.lists.map((list) => (list.id === id ? { ...list, name } : list)) } };
};

// The items of a deleted list go with it.
export const deleteList = (state, id) => {
  if (!findList(state, id)) return reject(state, 'error.listNotFound');
  return {
    state: {
      ...state,
      lists: state.lists.filter((list) => list.id !== id),
      items: state.items.filter((item) => item.list !== id),
    },
  };
};

// `ids` is each list one time, in the new order. A move in the name order starts the custom order
// from the name order, as `reorderItems` does. The same order returns the same state object.
export const reorderLists = (state, ids) => {
  if (new Set(ids).size !== ids.length || ids.length !== state.lists.length) return reject(state, 'error.invalidOrder');
  const byId = new Map(state.lists.map((list) => [list.id, list]));
  if (ids.some((id) => !byId.has(id))) return reject(state, 'error.listNotFound');
  const lists = ids.map((id) => byId.get(id));
  const same = state.listSort === 'custom' && lists.every((list, index) => list === state.lists[index]);
  return same ? { state } : { state: { ...state, lists, listSort: 'custom' } };
};

export const setListView = (state, view) =>
  LIST_VIEWS.includes(view) ? { state: { ...state, view } } : reject(state, 'error.unknownView');

export const setListSort = (state, listSort) =>
  SORTS.includes(listSort) ? { state: { ...state, listSort } } : reject(state, 'error.unknownSort');

// The state with only the items of one list. Operations still run on the full state.
export const listState = (state, id) => ({ ...state, items: state.items.filter((item) => item.list === id) });

// The count of the items of a list and the first `size` names, in the order of the list.
export const listSummary = (state, id, size = 3) => {
  const items = activeItems(listState(state, id));
  return { count: items.length, names: items.slice(0, size).map((item) => item.name) };
};

// A moved item goes to the end of `items`, so it is the last of its new list, as a new item is.
export const moveItem = (state, itemId, listId) => {
  const item = state.items.find((entry) => entry.id === itemId);
  if (!item) return reject(state, 'error.itemNotFound');
  const target = findList(state, listId);
  if (!target) return reject(state, 'error.listNotFound');
  if (item.list === listId) return { state };
  const duplicate = state.items.find((entry) => entry.list === listId && keyOf(entry.name) === keyOf(item.name));
  if (duplicate) return reject(state, 'error.duplicateItem', { name: duplicate.name, list: target.name });
  return { state: { ...state, items: [...state.items.filter((entry) => entry !== item), { ...item, list: listId }] } };
};
