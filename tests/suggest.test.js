import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem } from '#store';
import { suggestionRows } from '#suggest';

const withItems = (...names) => names.reduce((state, name, index) => addItem(state, 'L', name, () => `id${index}`).state, { ...emptyState(), lists: [{ id: 'L', name: 'Casa' }] });

test('empty or blank text gives no rows', () => {
  const state = withItems('Pan');
  assert.deepEqual(suggestionRows(state, ''), []);
  assert.deepEqual(suggestionRows(state, '   '), []);
});

test('no exact match: the first row is create', () => {
  const rows = suggestionRows(withItems('Pan', 'Patatas'), 'pa');
  assert.equal(rows[0].kind, 'create');
  assert.deepEqual(rows.slice(1).map((row) => row.item.name), ['Pan', 'Patatas']);
});

test('no match at all: only create', () => {
  assert.deepEqual(suggestionRows(withItems('Pan'), 'zzz'), [{ kind: 'create' }]);
});

test('an exact match (any case or accent) has no create row', () => {
  const rows = suggestionRows(withItems('Pan', 'Panceta'), 'PAN');
  assert.deepEqual(rows.map((row) => row.kind), ['item', 'item']);
  assert.equal(rows[0].item.name, 'Pan');
});

test('an item row holds only the item: each item is in the list', () => {
  const state = withItems('Pan');
  assert.deepEqual(suggestionRows(state, 'pan'), [{ kind: 'item', item: state.items[0] }]);
});

test('at most 6 rows, create included', () => {
  const state = withItems('a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8');
  const rows = suggestionRows(state, 'a');
  assert.equal(rows.length, 6);
  assert.equal(rows[0].kind, 'create');
});
