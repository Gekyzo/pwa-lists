import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sheetOpen, closeTop } from '#layers';

// A screen with nothing open, as `ui` of src/ui/context.js starts.
const closed = () => ({
  sheetOpen: false,
  arrangeOpen: false,
  aislesOpen: false,
  view: 'active',
  list: null,
  editId: null,
  openId: null,
  searchOpen: false,
});

test('sheetOpen is false with nothing open', () => {
  assert.equal(sheetOpen(closed()), false);
});

test('sheetOpen is true for each sheet', () => {
  for (const flag of ['sheetOpen', 'arrangeOpen', 'aislesOpen']) {
    assert.equal(sheetOpen({ ...closed(), [flag]: true }), true, flag);
  }
  assert.equal(sheetOpen({ ...closed(), editId: 'id-1' }), true);
});

test('sheetOpen is false for an open row or a search', () => {
  assert.equal(sheetOpen({ ...closed(), openId: 'id-1', searchOpen: true }), false);
});

test('closeTop gives the sheet first, then the row, then the search, then the open list, then null', () => {
  const all = { ...closed(), editId: 'id-1', openId: 'id-2', searchOpen: true, list: 'L' };
  assert.equal(closeTop(all), 'sheet');
  assert.equal(closeTop({ ...all, editId: null }), 'row');
  assert.equal(closeTop({ ...all, editId: null, openId: null }), 'search');
  assert.equal(closeTop({ ...all, editId: null, openId: null, searchOpen: false }), 'list');
  assert.equal(closeTop(closed()), null);
});

test('closeTop gives no list in Ajustes, where the list does not show', () => {
  assert.equal(closeTop({ ...closed(), view: 'settings', list: 'L' }), null);
});

test('sheetOpen has no shop picker', () => {
  assert.equal(sheetOpen({ ...closed(), shopPickOpen: true }), false);
});

test('closeTop does not change the screen state', () => {
  const view = { ...closed(), openId: 'id-1' };
  const copy = structuredClone(view);
  closeTop(view);
  assert.deepEqual(view, copy);
});

test('sheetOpen has no trip sheet', () => {
  assert.equal(sheetOpen({ ...closed(), tripOpen: true }), false);
});
