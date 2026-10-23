// `custom` is the order of `items`: the insertion order, changed by the moves of the user.
export const SORTS = ['custom', 'name'];

// The views of the first level of Listas: a row or a card for each list.
export const LIST_VIEWS = ['rows', 'cards'];

// The groups of a list: by the shops of each item, by the aisle of each item, or none.
export const GROUPS = ['shop', 'aisle', 'none'];

// `group` is the choice of the user to show a list in groups, and `sort` the order of the list.
// `aisles` are the sections of the store, in the order of the walk.
export const emptyState = () => ({ version: 11, items: [], group: 'shop', sort: 'custom', aisles: [] });

// An error is a message: the key of its text, with the parameters of the text. A `list`
// parameter holds a list id. The screen turns the message into text.
const reject = (state, key, params) => ({ state, error: params ? { key, params } : { key } });

const findItem = (state, id) => state.items.find((item) => item.id === id);

const patchItem = (state, id, patch) => ({
  state: { ...state, items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) },
});

const nameError = (state, name, ownId) => {
  if (!name) return ['error.nameRequired'];
  const key = name.toLowerCase();
  const duplicate = state.items.find((item) => item.id !== ownId && item.name.toLowerCase() === key);
  return duplicate ? ['error.duplicateItem', { name: duplicate.name, list: 'active' }] : null;
};

// An item exists while it is to buy: a tick deletes it.
export const addItem = (state, rawName, newId = () => crypto.randomUUID()) => {
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name);
  if (error) return reject(state, ...error);
  const item = { id: newId(), name, shops: [], quantity: '', aisle: '' };
  return { state: { ...state, items: [...state.items, item] } };
};

export const renameItem = (state, id, rawName) => {
  if (!findItem(state, id)) return reject(state, 'error.itemNotFound');
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name, id);
  return error ? reject(state, ...error) : patchItem(state, id, { name });
};

// The quantity is free text, such as `2` or `1 kg`. An empty text clears it.
export const setQuantity = (state, id, rawQuantity) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'error.itemNotFound');
  const quantity = String(rawQuantity ?? '').trim();
  return quantity === item.quantity ? { state } : patchItem(state, id, { quantity });
};

export const deleteItem = (state, id) => {
  if (!findItem(state, id)) return reject(state, 'error.itemNotFound');
  return { state: { ...state, items: state.items.filter((item) => item.id !== id) } };
};

// A tick deletes the item: it is bought. The screen shows its own message for it.
export const tickItem = deleteItem;

export const setSort = (state, sort) =>
  SORTS.includes(sort) ? { state: { ...state, sort } } : reject(state, 'error.unknownSort');

export const setGroup = (state, group) =>
  GROUPS.includes(group) ? { state: { ...state, group } } : reject(state, 'error.unknownGroup');

// Gives the places that the items of `ids` have in `items` to the same items, in the order of
// `ids`. Each other item keeps its place. The same order returns the same state object.
// A move in the name order starts the custom order from the name order: the lists stay as the
// screen shows them, with the move.
export const reorderItems = (state, ids) => {
  const moved = new Set(ids);
  if (moved.size !== ids.length) return reject(state, 'error.invalidOrder');
  const byId = new Map(state.items.map((item) => [item.id, item]));
  if (ids.some((id) => !byId.has(id))) return reject(state, 'error.itemNotFound');
  const base = state.sort === 'name' ? { ...state, items: sortItems(state, state.items), sort: 'custom' } : state;
  let next = 0;
  const items = base.items.map((item) => (moved.has(item.id) ? byId.get(ids[next++]) : item));
  return items.every((item, index) => item === state.items[index]) && base === state ? { state } : { state: { ...base, items } };
};

// The order of two names, with no case and no accent distinction.
export const compareNames = (a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' });

const byName = (a, b) => compareNames(a.name, b.name);

// The items in the order that the user chose. The order of `state.items` is the insertion order.
export const sortItems = (state, items) => (state.sort === 'name' ? [...items].sort(byName) : items);

export const activeItems = (state) => sortItems(state, state.items);

// The form of a text for a search: no case and no accent distinction.
export const fold = (text) =>
  String(text ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

// True when the name, one of the shops or the aisle of the item contains the query. Each item for
// no query.
export const matchesItem = (item, query) => {
  const key = fold(query);
  return !key || [item.name, ...item.shops, item.aisle].some((text) => fold(text).includes(key));
};

// A list by group with only the items that match the query. A query takes away a group with no
// item left. `total` stays the count of the full group, so that the head of a group shows the same
// figure with a query and with none.
export const filterGroups = (view, query) => {
  const searching = Boolean(fold(query));
  const matches = (item) => matchesItem(item, query);
  const groups = view.groups
    .map((group) => ({ ...group, items: group.items.filter(matches) }))
    .filter((group) => !searching || group.items.length > 0);
  return { groups, rest: view.rest.filter(matches) };
};

// The item that a new name would duplicate.
export const findByName = (state, rawName) => {
  const key = String(rawName ?? '').trim().toLowerCase();
  return key ? state.items.find((item) => item.name.toLowerCase() === key) : undefined;
};

// Items whose name contains the query: exact match first, then prefix matches.
export const searchItems = (state, query, limit = 5) => {
  const key = fold(query);
  if (!key) return [];
  const rank = (item) => {
    const name = fold(item.name);
    if (name === key) return 0;
    return name.startsWith(key) ? 1 : 2;
  };
  return state.items
    .filter((item) => fold(item.name).includes(key))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, limit);
};

// The message of the toast that an arrival at the shop shows, or null when the list is empty.
export const arrivalMessage = (state) => {
  const count = state.items.length;
  return count === 0 ? null : { key: 'toast.arrival', params: { count, list: 'active' } };
};
