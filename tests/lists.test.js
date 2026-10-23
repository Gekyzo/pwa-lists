import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIST_VIEWS,
  findList,
  listsInOrder,
  addList,
  renameList,
  deleteList,
  reorderLists,
  setListView,
  setListSort,
  listState,
  listSummary,
  moveItem,
  SAMPLE_IDS,
  hasSample,
  loadSample,
  deleteSample,
} from '#lists';

let counter = 0;
const newId = () => `id-${++counter}`;

// Each list is [name, [item names]]. A list id is `L-<name>`, an item id `I-<list>-<name>`.
const build = (lists, patch = {}) => ({
  version: 12,
  lists: lists.map(([name]) => ({ id: `L-${name}`, name })),
  items: lists.flatMap(([list, items = []]) =>
    items.map((name) => ({ id: `I-${list}-${name}`, name, list: `L-${list}`, quantity: '', aisle: '' }))),
  group: 'aisle',
  sort: 'custom',
  aisles: [],
  view: 'rows',
  listSort: 'custom',
  ...patch,
});

const names = (lists) => lists.map((list) => list.name);
const frozen = (state) => structuredClone(state);

test('the views of the first level are rows and cards', () => {
  assert.deepEqual(LIST_VIEWS, ['rows', 'cards']);
});

test('findList finds a list by its id', () => {
  const state = build([['IKEA']]);
  assert.equal(findList(state, 'L-IKEA').name, 'IKEA');
  assert.equal(findList(state, 'nope'), undefined);
});

test('listsInOrder keeps the custom order and sorts by name with no case and no accent distinction', () => {
  const state = build([['ikea'], ['Ápice'], ['Banco']]);
  assert.deepEqual(names(listsInOrder(state)), ['ikea', 'Ápice', 'Banco']);
  assert.deepEqual(names(listsInOrder({ ...state, listSort: 'name' })), ['Ápice', 'Banco', 'ikea']);
});

test('addList adds a trimmed list at the end and gives its id', () => {
  const before = build([['IKEA']]);
  const copy = frozen(before);
  const { state, id, error } = addList(before, '  Ferretería ', newId);
  assert.equal(error, undefined);
  assert.deepEqual(names(state.lists), ['IKEA', 'Ferretería']);
  assert.equal(findList(state, id).name, 'Ferretería');
  assert.deepEqual(before, copy);
});

test('addList rejects an empty name', () => {
  const before = build([]);
  const result = addList(before, '   ', newId);
  assert.deepEqual(result.error, { key: 'error.listRequired' });
  assert.equal(result.state, before);
});

test('addList rejects a name of a list in another case, with the spelling of that list', () => {
  const before = build([['IKEA']]);
  const result = addList(before, 'ikea', newId);
  assert.deepEqual(result.error, { key: 'error.duplicateList', params: { name: 'IKEA' } });
  assert.equal(result.state, before);
});

test('renameList renames a list and allows a change of case only', () => {
  const before = build([['IKEA']]);
  assert.equal(findList(renameList(before, 'L-IKEA', ' Casa ').state, 'L-IKEA').name, 'Casa');
  assert.equal(findList(renameList(before, 'L-IKEA', 'ikea').state, 'L-IKEA').name, 'ikea');
});

test('renameList to the same text returns the same state', () => {
  const before = build([['IKEA']]);
  assert.equal(renameList(before, 'L-IKEA', 'IKEA ').state, before);
});

test('renameList rejects the name of another list, an empty name and an unknown list', () => {
  const before = build([['IKEA'], ['Ferretería']]);
  assert.deepEqual(renameList(before, 'L-IKEA', 'ferretería').error, { key: 'error.duplicateList', params: { name: 'Ferretería' } });
  assert.deepEqual(renameList(before, 'L-IKEA', '').error, { key: 'error.listRequired' });
  assert.deepEqual(renameList(before, 'nope', 'Casa').error, { key: 'error.listNotFound' });
  assert.equal(renameList(before, 'nope', 'Casa').state, before);
});

test('deleteList removes the list and its items, and the old state still holds them in place', () => {
  const before = build([['IKEA', ['Lámpara', 'Tornillos']], ['Ferretería', ['Tornillos']]]);
  const copy = frozen(before);
  const { state } = deleteList(before, 'L-IKEA');
  assert.deepEqual(names(state.lists), ['Ferretería']);
  assert.deepEqual(state.items.map((item) => item.id), ['I-Ferretería-Tornillos']);
  assert.deepEqual(before, copy);
});

test('deleteList rejects an unknown list', () => {
  const before = build([['IKEA']]);
  assert.deepEqual(deleteList(before, 'nope'), { state: before, error: { key: 'error.listNotFound' } });
});

test('reorderLists gives the lists the new order', () => {
  const before = build([['A'], ['B'], ['C']]);
  assert.deepEqual(names(reorderLists(before, ['L-C', 'L-A', 'L-B']).state.lists), ['C', 'A', 'B']);
});

test('reorderLists with the same order returns the same state', () => {
  const before = build([['A'], ['B']]);
  assert.equal(reorderLists(before, ['L-A', 'L-B']).state, before);
});

test('reorderLists in the name order starts the custom order from the name order', () => {
  const before = build([['C'], ['A'], ['B']], { listSort: 'name' });
  const { state } = reorderLists(before, ['L-B', 'L-A', 'L-C']);
  assert.equal(state.listSort, 'custom');
  assert.deepEqual(names(state.lists), ['B', 'A', 'C']);
});

test('reorderLists rejects an order that is not each list one time, and an unknown list', () => {
  const before = build([['A'], ['B']]);
  assert.deepEqual(reorderLists(before, ['L-A', 'L-A']).error, { key: 'error.invalidOrder' });
  assert.deepEqual(reorderLists(before, ['L-A']).error, { key: 'error.invalidOrder' });
  assert.deepEqual(reorderLists(before, ['L-A', 'nope']).error, { key: 'error.listNotFound' });
});

test('setListView sets rows or cards and rejects another view', () => {
  const before = build([]);
  assert.equal(setListView(before, 'cards').state.view, 'cards');
  assert.deepEqual(setListView(before, 'grid'), { state: before, error: { key: 'error.unknownView' } });
});

test('setListSort sets the order of the lists and rejects another order', () => {
  const before = build([]);
  assert.equal(setListSort(before, 'name').state.listSort, 'name');
  assert.deepEqual(setListSort(before, 'size'), { state: before, error: { key: 'error.unknownSort' } });
});

test('listState holds only the items of one list', () => {
  const state = build([['IKEA', ['Lámpara']], ['Ferretería', ['Tornillos']]]);
  const scoped = listState(state, 'L-IKEA');
  assert.deepEqual(scoped.items.map((item) => item.name), ['Lámpara']);
  assert.equal(scoped.lists, state.lists);
});

test('listSummary counts the items of a list and gives the first names in the order of the items', () => {
  const state = build([['IKEA', ['Zócalo', 'Lámpara', 'Balda', 'Cojín']]]);
  assert.deepEqual(listSummary(state, 'L-IKEA'), { count: 4, names: ['Zócalo', 'Lámpara', 'Balda'] });
  assert.deepEqual(listSummary({ ...state, sort: 'name' }, 'L-IKEA', 2), { count: 4, names: ['Balda', 'Cojín'] });
  assert.deepEqual(listSummary(state, 'nope'), { count: 0, names: [] });
});

test('moveItem puts an item in another list, at the end of the items', () => {
  const before = build([['IKEA', ['Lámpara', 'Balda']], ['Ferretería', ['Tornillos']]]);
  const copy = frozen(before);
  const { state } = moveItem(before, 'I-IKEA-Lámpara', 'L-Ferretería');
  assert.equal(state.items.at(-1).id, 'I-IKEA-Lámpara');
  assert.equal(state.items.at(-1).list, 'L-Ferretería');
  assert.deepEqual(before, copy);
});

test('moveItem to its own list returns the same state', () => {
  const before = build([['IKEA', ['Lámpara']]]);
  assert.equal(moveItem(before, 'I-IKEA-Lámpara', 'L-IKEA').state, before);
});

test('moveItem rejects a list that has the name in another case, with the name of that list', () => {
  const before = build([['IKEA', ['Tornillos']], ['Ferretería', ['tornillos']]]);
  assert.deepEqual(moveItem(before, 'I-IKEA-Tornillos', 'L-Ferretería'), {
    state: before,
    error: { key: 'error.duplicateItem', params: { name: 'tornillos', list: 'Ferretería' } },
  });
});

test('moveItem rejects an unknown item and an unknown list', () => {
  const before = build([['IKEA', ['Lámpara']]]);
  assert.deepEqual(moveItem(before, 'nope', 'L-IKEA').error, { key: 'error.itemNotFound' });
  assert.deepEqual(moveItem(before, 'I-IKEA-Lámpara', 'nope').error, { key: 'error.listNotFound' });
});

const SAMPLE_TEXT = [
  { name: 'Casa', items: ['Bombillas', 'Pilas', 'Pintar la puerta'] },
  { name: 'Viaje', items: ['Pasaporte', 'Cargador', 'Crema solar'] },
];

test('the sample lists have fixed ids', () => {
  assert.deepEqual(SAMPLE_IDS, ['sample-home', 'sample-trip']);
});

test('loadSample adds the sample lists and their items at the end', () => {
  const before = build([['IKEA', ['Lámpara']]]);
  const copy = frozen(before);
  const { state } = loadSample(before, SAMPLE_TEXT, newId);
  assert.deepEqual(state.lists.map((list) => [list.id, list.name]), [['L-IKEA', 'IKEA'], ['sample-home', 'Casa'], ['sample-trip', 'Viaje']]);
  assert.deepEqual(state.items.filter((item) => item.list === 'sample-trip').map((item) => item.name), ['Pasaporte', 'Cargador', 'Crema solar']);
  assert.deepEqual(state.items.at(-1), { id: state.items.at(-1).id, name: 'Crema solar', list: 'sample-trip', quantity: '', aisle: '' });
  assert.equal(hasSample(state), true);
  assert.deepEqual(before, copy);
});

test('loadSample trims the names and drops an empty or a repeated item', () => {
  const { state } = loadSample(build([]), [{ name: ' Casa ', items: [' Pilas ', '', 'pilas'] }, { name: 'Viaje', items: [] }], newId);
  assert.deepEqual(names(state.lists), ['Casa', 'Viaje']);
  assert.deepEqual(state.items.map((item) => item.name), ['Pilas']);
});

test('loadSample skips a list whose name is taken, with no case distinction', () => {
  const before = build([['casa', ['Pilas']]]);
  const { state } = loadSample(before, SAMPLE_TEXT, newId);
  assert.deepEqual(state.lists.map((list) => list.id), ['L-casa', 'sample-trip']);
  assert.equal(state.items.filter((item) => item.list === 'L-casa').length, 1);
});

test('loadSample returns the same state when each sample list exists', () => {
  const { state: loaded } = loadSample(build([]), SAMPLE_TEXT, newId);
  assert.equal(loadSample(loaded, SAMPLE_TEXT, newId).state, loaded);
});

test('hasSample is true while one sample list exists, also after a rename', () => {
  const { state: loaded } = loadSample(build([]), SAMPLE_TEXT, newId);
  const { state: renamed } = renameList(loaded, 'sample-home', 'Piso');
  assert.equal(hasSample(renamed), true);
  const { state: one } = deleteList(renamed, 'sample-home');
  assert.equal(hasSample(one), true);
  assert.equal(hasSample(deleteList(one, 'sample-trip').state), false);
  assert.equal(hasSample(build([['IKEA']])), false);
});

test('deleteSample removes the sample lists and their items, and keeps the rest', () => {
  const { state: loaded } = loadSample(build([['IKEA', ['Lámpara']]]), SAMPLE_TEXT, newId);
  const { state } = deleteSample(loaded);
  assert.deepEqual(state, build([['IKEA', ['Lámpara']]]));
});

test('deleteSample rejects a state with no sample list', () => {
  const before = build([['IKEA']]);
  assert.deepEqual(deleteSample(before), { state: before, error: { key: 'error.listNotFound' } });
});
