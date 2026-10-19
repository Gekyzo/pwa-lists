import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyState,
  addItem,
  renameItem,
  tickItem,
  deleteItem,
  activeItems,
  searchItems,
  matchesItem,
  filterGroups,
  findByName,
  arrivalMessage,
  setSort,
  sortItems,
  reorderItems,
  setGroup,
  GROUPS,
  compareNames,
  setQuantity,
} from '#store';
import * as store from '#store';

let counter = 0;
const newId = () => `id-${++counter}`;

// Each spec is [name, patch].
const build = (...specs) =>
  specs.reduce((state, [name, patch = {}]) => {
    const { state: added } = addItem(state, name, newId);
    const items = added.items.map((item) => (item.name === name ? { ...item, ...patch } : item));
    return { ...added, items };
  }, emptyState());

const find = (state, name) => state.items.find((item) => item.name === name);
const names = (items) => items.map((item) => item.name);

test('addItem adds an item to the list', () => {
  const { state, error } = addItem(emptyState(), 'Bread', newId);
  assert.equal(error, undefined);
  assert.equal(state.items.length, 1);
  const { id, ...rest } = state.items[0];
  assert.ok(id);
  assert.deepEqual(rest, { name: 'Bread', shops: [], quantity: '', aisle: '' });
});

test('addItem gives an item with no list and no bought', () => {
  const item = addItem(emptyState(), 'Tea', newId).state.items[0];
  assert.equal('list' in item, false);
  assert.equal('bought' in item, false);
  assert.equal('recurrent' in item, false);
  assert.equal('again' in item, false);
});

test('addItem trims the name and rejects an empty one', () => {
  const { state } = addItem(emptyState(), '  Eggs  ', newId);
  assert.equal(state.items[0].name, 'Eggs');
  const start = emptyState();
  const rejected = addItem(start, '   ', newId);
  assert.equal(rejected.state, start);
  assert.deepEqual(rejected.error, { key: 'error.nameRequired' });
});

test('addItem rejects a duplicate without case distinction', () => {
  const start = build(['Milk'], ['Bread']);
  const duplicate = addItem(start, ' milk ', newId);
  assert.equal(duplicate.state, start);
  assert.deepEqual(duplicate.error, { key: 'error.duplicateItem', params: { name: 'Milk', list: 'active' } });
  assert.deepEqual(addItem(start, 'BREAD', newId).error, { key: 'error.duplicateItem', params: { name: 'Bread', list: 'active' } });
});

test('addItem does not change the input state', () => {
  const start = emptyState();
  addItem(start, 'Bread', newId);
  assert.deepEqual(start, emptyState());
});

test('renameItem renames and trims', () => {
  const start = build(['Bred']);
  const { state } = renameItem(start, find(start, 'Bred').id, ' Bread ');
  assert.deepEqual(names(state.items), ['Bread']);
});

test('renameItem rejects an empty name and a duplicate of another item', () => {
  const start = build(['Bread'], ['Milk']);
  const { id } = find(start, 'Bread');
  assert.deepEqual(renameItem(start, id, ' ').error, { key: 'error.nameRequired' });
  const duplicate = renameItem(start, id, 'MILK');
  assert.deepEqual(duplicate.error, { key: 'error.duplicateItem', params: { name: 'Milk', list: 'active' } });
  assert.equal(duplicate.state, start);
});

test('renameItem accepts a change of case of the same item', () => {
  const start = build(['bread']);
  const { state, error } = renameItem(start, find(start, 'bread').id, 'Bread');
  assert.equal(error, undefined);
  assert.equal(state.items[0].name, 'Bread');
});

test('operations reject an unknown id', () => {
  const start = build(['Bread']);
  const calls = [renameItem(start, 'nope', 'X'), tickItem(start, 'nope'), deleteItem(start, 'nope')];
  calls.forEach((result) => {
    assert.deepEqual(result.error, { key: 'error.itemNotFound' });
    assert.equal(result.state, start);
  });
});

test('tickItem removes the item and keeps the order of the others', () => {
  const start = build(['Bread'], ['Milk', { shops: ['Lidl'] }], ['Salt']);
  const copy = structuredClone(start);
  const { state, error } = tickItem(start, find(start, 'Milk').id);
  assert.equal(error, undefined);
  assert.deepEqual(state.items, [find(start, 'Bread'), find(start, 'Salt')]);
  assert.deepEqual(start, copy);
});

test('tickItem of an unknown id gives error.itemNotFound', () => {
  const start = build(['Bread']);
  assert.deepEqual(tickItem(start, 'nope'), { state: start, error: { key: 'error.itemNotFound' } });
});

test('the store has no trip operations', () => {
  const gone = ['toggleBought', 'startNewShopping', 'canStartNewShopping', 'openItems', 'bringToList', 'tripOutcome', 'tripSummary'];
  gone.forEach((name) => assert.equal(name in store, false, name));
});

test('deleteItem removes the item', () => {
  const start = build(['Bread'], ['Milk']);
  const { state } = deleteItem(start, find(start, 'Bread').id);
  assert.deepEqual(names(state.items), ['Milk']);
});

test('activeItems lists each item in insertion order', () => {
  const state = build(['B'], ['D'], ['A'], ['C']);
  assert.deepEqual(names(activeItems(state)), ['B', 'D', 'A', 'C']);
});

test('searchItems returns nothing for an empty query', () => {
  const state = build(['Milk']);
  assert.deepEqual(searchItems(state, '   '), []);
});

test('searchItems matches part of a name, without case or accent distinction', () => {
  const state = build(['Milk'], ['Oat milk'], ['Bread'], ['Jamón']);
  assert.deepEqual(names(searchItems(state, 'MIL')), ['Milk', 'Oat milk']);
  assert.deepEqual(names(searchItems(state, 'jamon')), ['Jamón']);
});

test('searchItems puts the exact match first, then names that start with the query', () => {
  const state = build(['Oat milk'], ['Milk chocolate'], ['Milk']);
  assert.deepEqual(names(searchItems(state, 'milk')), ['Milk', 'Milk chocolate', 'Oat milk']);
});

test('searchItems respects the limit', () => {
  const state = build(['Milk 1'], ['Milk 2'], ['Milk 3']);
  assert.equal(searchItems(state, 'milk', 2).length, 2);
});

test('findByName finds the item with the same name, trimmed and without case distinction', () => {
  const state = build(['Milk']);
  assert.equal(findByName(state, '  mILK ').name, 'Milk');
  assert.equal(findByName(state, 'Mil'), undefined);
  assert.equal(findByName(state, ''), undefined);
});

test('emptyState is version 11 with no items, and groups by shop', () => {
  assert.deepEqual(emptyState(), { version: 11, items: [], group: 'shop', sort: 'custom', aisles: [] });
});

test('arrivalMessage counts the items', () => {
  const state = build(['Milk'], ['Bread']);
  const before = structuredClone(state);
  assert.deepEqual(arrivalMessage(state), { key: 'toast.arrival', params: { count: 2, list: 'active' } });
  assert.deepEqual(state, before);
});

test('arrivalMessage uses the singular for one item', () => {
  assert.deepEqual(arrivalMessage(build(['Milk'])), { key: 'toast.arrival', params: { count: 1, list: 'active' } });
});

test('arrivalMessage is null when the list is empty', () => {
  assert.equal(arrivalMessage(emptyState()), null);
});

test('setSort sets a known sort and rejects another one', () => {
  const start = emptyState();
  assert.equal(start.sort, 'custom');
  const { state } = setSort(start, 'name');
  assert.equal(state.sort, 'name');
  assert.equal(setSort(state, 'custom').state.sort, 'custom');
  assert.equal(start.sort, 'custom');
  const rejected = setSort(state, 'price');
  assert.equal(rejected.state, state);
  assert.deepEqual(rejected.error, { key: 'error.unknownSort' });
});

test('sortItems keeps the insertion order when the sort is added', () => {
  const state = build(['Zumo'], ['Arroz']);
  assert.equal(sortItems(state, state.items), state.items);
});

test('sortItems gives the Spanish name order without case or accent distinction', () => {
  const state = setSort(build(['zumo'], ['Ñoquis'], ['Banana'], ['nata'], ['árbol'], ['Oca']), 'name').state;
  const before = structuredClone(state);
  assert.deepEqual(names(sortItems(state, state.items)), ['árbol', 'Banana', 'nata', 'Ñoquis', 'Oca', 'zumo']);
  assert.deepEqual(state, before);
});

test('activeItems follows the sort', () => {
  const start = build(['Pan'], ['Zumo'], ['Arroz'], ['Agua']);
  assert.deepEqual(names(activeItems(start)), ['Pan', 'Zumo', 'Arroz', 'Agua']);
  assert.deepEqual(names(activeItems(setSort(start, 'name').state)), ['Agua', 'Arroz', 'Pan', 'Zumo']);
});

test('reorderItems writes the new order of a full scope', () => {
  const before = build(['a'], ['b'], ['c']);
  const ids = ['c', 'a', 'b'].map((name) => find(before, name).id);
  const { state, error } = reorderItems(before, ids);
  assert.equal(error, undefined);
  assert.deepEqual(names(state.items), ['c', 'a', 'b']);
});

test('reorderItems moves the items of a sub-scope and leaves the others in place', () => {
  const before = build(['a'], ['b'], ['c'], ['d']);
  const { state } = reorderItems(before, [find(before, 'd').id, find(before, 'b').id]);
  assert.deepEqual(names(state.items), ['a', 'd', 'c', 'b']);
});

test('reorderItems does not change its input', () => {
  const before = build(['a'], ['b']);
  const copy = structuredClone(before);
  reorderItems(before, [find(before, 'b').id, find(before, 'a').id]);
  assert.deepEqual(before, copy);
});

test('reorderItems returns the same state for the same order', () => {
  const before = build(['a'], ['b']);
  const result = reorderItems(before, before.items.map((item) => item.id));
  assert.equal(result.state, before);
  assert.equal(result.error, undefined);
});

test('reorderItems rejects an id that is not known', () => {
  const before = build(['a'], ['b']);
  const result = reorderItems(before, [find(before, 'a').id, 'nope']);
  assert.deepEqual(result.error, { key: 'error.itemNotFound' });
  assert.equal(result.state, before);
});

test('reorderItems rejects an id that is there two times', () => {
  const before = build(['a'], ['b']);
  const id = find(before, 'a').id;
  const result = reorderItems(before, [id, id]);
  assert.deepEqual(result.error, { key: 'error.invalidOrder' });
  assert.equal(result.state, before);
});

test('reorderItems from the name order writes the name order, then the move, and sets the custom order', () => {
  const before = setSort(build(['c'], ['a'], ['d'], ['b']), 'name').state;
  // The screen shows a, b, c, d. The user moves b above a.
  const { state, error } = reorderItems(before, [find(before, 'b').id, find(before, 'a').id]);
  assert.equal(error, undefined);
  assert.deepEqual(names(state.items), ['b', 'a', 'c', 'd']);
  assert.equal(state.sort, 'custom');
});

test('reorderItems from the name order does not change its input', () => {
  const before = setSort(build(['c'], ['a']), 'name').state;
  const copy = structuredClone(before);
  reorderItems(before, [find(before, 'c').id, find(before, 'a').id]);
  assert.deepEqual(before, copy);
});

test('reorderItems from the name order rejects an unknown id and keeps the name order', () => {
  const before = setSort(build(['c'], ['a']), 'name').state;
  const result = reorderItems(before, ['nope']);
  assert.deepEqual(result.error, { key: 'error.itemNotFound' });
  assert.equal(result.state, before);
});

test('setGroup sets each known group and rejects another one', () => {
  const start = emptyState();
  assert.equal(start.group, 'shop');
  assert.deepEqual(GROUPS, ['shop', 'aisle', 'none']);
  GROUPS.forEach((group) => assert.equal(setGroup(start, group).state.group, group));
  assert.equal(start.group, 'shop');
  for (const group of ['floor', 'recipe']) {
    const rejected = setGroup(start, group);
    assert.equal(rejected.state, start);
    assert.deepEqual(rejected.error, { key: 'error.unknownGroup' });
  }
});

test('compareNames has no case and no accent distinction', () => {
  assert.deepEqual(['Zeta', 'árbol', 'beta'].sort(compareNames), ['árbol', 'beta', 'Zeta']);
  assert.equal(compareNames('lidl', 'Lidl'), 0);
});

const milk = { id: 'a', name: 'Leche', shops: ['Mercadona'], aisle: 'Lácteos' };
const coffee = { id: 'b', name: 'Café', shops: [], aisle: '' };

test('matchesItem matches a part of the name with no case and no accent distinction', () => {
  assert.equal(matchesItem(milk, 'ECH'), true);
  assert.equal(matchesItem(coffee, 'cafe'), true);
  assert.equal(matchesItem(milk, 'cafe'), false);
});

test('matchesItem matches a part of a shop', () => {
  assert.equal(matchesItem(milk, 'merca'), true);
  assert.equal(matchesItem(coffee, 'merca'), false);
});

test('matchesItem matches a part of the aisle with no accent distinction', () => {
  assert.equal(matchesItem(milk, 'lacte'), true);
  assert.equal(matchesItem(coffee, 'lacte'), false);
});

test('matchesItem matches each item for an empty query', () => {
  assert.equal(matchesItem(coffee, ''), true);
  assert.equal(matchesItem(coffee, '   '), true);
});

test('filterGroups keeps the matches, drops a group with no item left and keeps the totals', () => {
  const view = {
    groups: [
      { shop: 'Mercadona', items: [milk, coffee], total: 2 },
      { shop: 'Lidl', items: [coffee], total: 1 },
    ],
    rest: [coffee, milk],
  };
  const copy = structuredClone(view);
  assert.deepEqual(filterGroups(view, 'lech'), {
    groups: [{ shop: 'Mercadona', items: [milk], total: 2 }],
    rest: [milk],
  });
  assert.deepEqual(view, copy);
});

test('filterGroups keeps each group and each item for an empty query', () => {
  const view = { groups: [{ shop: 'Lidl', items: [coffee], total: 1 }], rest: [coffee] };
  assert.deepEqual(filterGroups(view, ' '), view);
});

test('addItem creates an item with no quantity', () => {
  assert.equal(build(['Milk']).items[0].quantity, '');
});

test('setQuantity sets the trimmed text and does not change the input state', () => {
  const state = build(['Milk']);
  const before = structuredClone(state);
  const { state: next, error } = setQuantity(state, state.items[0].id, '  2 l ');
  assert.equal(error, undefined);
  assert.equal(next.items[0].quantity, '2 l');
  assert.deepEqual(state, before);
});

test('setQuantity with the same text returns the same state object', () => {
  const state = build(['Milk', { quantity: '2 l' }]);
  assert.equal(setQuantity(state, state.items[0].id, ' 2 l').state, state);
});

test('setQuantity with an empty text clears the quantity', () => {
  const state = build(['Milk', { quantity: '2 l' }]);
  assert.equal(setQuantity(state, state.items[0].id, '  ').state.items[0].quantity, '');
});

test('setQuantity rejects an unknown item with the same state', () => {
  const state = build(['Milk']);
  assert.deepEqual(setQuantity(state, 'nope', '2'), { state, error: { key: 'error.itemNotFound' } });
});
