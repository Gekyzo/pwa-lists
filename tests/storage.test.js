import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY,
  CORRUPT_KEY,
  LANGUAGE_KEY,
  HAND_KEY,
  SHOP_LISTS_KEY,
  load,
  save,
  exportJson,
  exportFilename,
  importJson,
  loadLanguage,
  saveLanguage,
  loadHand,
  saveHand,
  THEME_KEY,
  loadTheme,
  saveTheme,
  DENSITY_KEY,
  loadDensity,
  saveDensity,
  ONBOARDED_KEY,
  loadOnboarded,
  saveOnboarded,
  hasStoredState,
  SWIPE_HINT_KEY,
  loadSwipeHint,
  saveSwipeHint,
  SEEN_VERSION_KEY,
  loadSeen,
  saveSeen,
  APP_KEYS,
  resetAll,
} from '#storage';
import { emptyState } from '#store';

const fakeStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
};

const brokenStorage = () => ({
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('denied');
  },
});

const sampleV1 = () => ({
  version: 1,
  items: [
    { id: 'a', name: 'Bread', recurrent: false, list: 'active', bought: true, again: true },
    { id: 'b', name: 'Milk', recurrent: true, list: 'next', bought: false, again: false },
  ],
});

const sampleV2 = () => ({
  ...sampleV1(),
  version: 2,
  recipes: [{ id: 'r1', name: 'Omelette', products: ['Eggs', 'Potatoes'], url: 'https://example.com/omelette' }],
  sent: ['r1'],
  grouped: true,
  sort: 'custom',
});

const sample = () => {
  const { grouped, items, recipes, sent, ...rest } = sampleV2();
  return {
    ...rest,
    version: 11,
    items: [
      { id: 'a', name: 'Bread', shops: ['Lidl', 'Market'], quantity: '2', aisle: 'Bakery' },
      { id: 'b', name: 'Milk', shops: [], quantity: '', aisle: '' },
    ],
    group: 'shop',
    aisles: ['Bakery', 'Dairy'],
  };
};

const sampleV3 = () => ({ ...sample(), version: 3 });

// sample() as version 12 has it: a list for each shop in name order, then General for the item with
// no shop. The item of two shops is one item in each list; the copy gets the id `<id>-2`.
const current = () => ({
  version: 12,
  lists: [{ id: 'list-1', name: 'Lidl' }, { id: 'list-2', name: 'Market' }, { id: 'list-3', name: 'General' }],
  items: [
    { id: 'a', name: 'Bread', list: 'list-1', quantity: '2', aisle: 'Bakery' },
    { id: 'a-2', name: 'Bread', list: 'list-2', quantity: '2', aisle: 'Bakery' },
    { id: 'b', name: 'Milk', list: 'list-3', quantity: '', aisle: '' },
  ],
  group: 'aisle',
  sort: 'custom',
  aisles: ['Bakery', 'Dairy'],
  view: 'rows',
  listSort: 'custom',
});

// The items of sampleV1 and sampleV2, as a version 12 state has them: the item of Next and the
// ticked item with again are both items to buy, in General, with no bought or again field.
const migratedItems = () => [
  { id: 'a', name: 'Bread', list: 'list-1', quantity: '', aisle: '' },
  { id: 'b', name: 'Milk', list: 'list-1', quantity: '', aisle: '' },
];
const general = [{ id: 'list-1', name: 'General' }];
const listNames = (state) => state.lists.map((list) => list.name);
// The names of the lists that hold an item of the name.
const listsOf = (state, name) => state.items.filter((item) => item.name === name).map((item) => state.lists.find((list) => list.id === item.list).name);

test('save then load returns the same state', () => {
  const storage = fakeStorage();
  assert.equal(save(storage, current()), true);
  assert.deepEqual(load(storage), current());
});

test('load returns an empty state when the key is absent', () => {
  assert.deepEqual(load(fakeStorage()), emptyState());
});

test('load keeps corrupt JSON under the corrupt key and returns an empty state', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{not json' });
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(CORRUPT_KEY), '{not json');
});

test('load treats valid JSON with an invalid shape as corrupt', () => {
  const text = JSON.stringify({ version: 1, items: [{ id: 'a' }] });
  const storage = fakeStorage({ [STORAGE_KEY]: text });
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(CORRUPT_KEY), text);
});

test('load and save survive a storage that throws', () => {
  assert.deepEqual(load(brokenStorage()), emptyState());
  assert.equal(save(brokenStorage(), current()), false);
});

test('exportFilename names the file with the local date and time', () => {
  assert.equal(exportFilename(new Date(2026, 9, 14, 9, 5, 7)), 'stash-2026-10-14-090507.json');
});

test('exportFilename gives two exports of one day different names', () => {
  const morning = exportFilename(new Date(2026, 0, 2, 8, 0, 0));
  const evening = exportFilename(new Date(2026, 0, 2, 23, 59, 59));
  assert.equal(morning, 'stash-2026-01-02-080000.json');
  assert.equal(evening, 'stash-2026-01-02-235959.json');
});

test('exportJson then importJson returns the same state', () => {
  assert.deepEqual(importJson(exportJson(current())), { state: current() });
});

test('importJson rejects text that is not JSON', () => {
  assert.deepEqual(importJson('nope'), { error: { key: 'error.invalidJson' } });
});

test('version 13 is not a backup', () => {
  const text = JSON.stringify({ ...current(), version: 13 });
  assert.deepEqual(importJson(text), { error: { key: 'error.notBackup' } });
});

test('importJson rejects invalid items', () => {
  const invalid = [
    null,
    [],
    { version: 1 },
    { version: 1, items: 'x' },
    { ...current(), version: 13 },
    { ...sample(), version: 0 },
    { version: 1, items: [{ ...sample().items[0], list: 'other' }] },
    { version: 1, items: [{ ...sample().items[0], name: '  ' }] },
    { version: 1, items: [{ ...sample().items[0], bought: 'yes' }] },
    { version: 1, items: [sample().items[0], { ...sample().items[1], id: 'a' }] },
    { version: 1, items: [sample().items[0], { ...sample().items[1], name: 'bread' }] },
  ];
  invalid.forEach((data) => {
    assert.deepEqual(importJson(JSON.stringify(data)), { error: { key: 'error.notBackup' } });
  });
});

test('importJson drops unknown fields, moves Next to Actual and drops again', () => {
  const data = {
    version: 1,
    extra: true,
    items: [
      { id: 'a', name: ' Milk ', recurrent: true, list: 'next', bought: true, again: true, note: 'x' },
      { id: 'b', name: 'Soap', recurrent: false, list: 'active', bought: false, again: true },
    ],
  };
  assert.deepEqual(importJson(JSON.stringify(data)), {
    state: {
      version: 12,
      lists: general,
      items: [
        { id: 'a', name: 'Milk', list: 'list-1', quantity: '', aisle: '' },
        { id: 'b', name: 'Soap', list: 'list-1', quantity: '', aisle: '' },
      ],
      group: 'aisle',
      sort: 'custom',
      aisles: [],
      view: 'rows',
      listSort: 'custom',
    },
  });
});

const migratedV1 = () => ({
  version: 12,
  lists: general,
  items: migratedItems(),
  group: 'aisle',
  sort: 'custom',
  aisles: [],
  view: 'rows',
  listSort: 'custom',
});

test('load migrates a version 1 state', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(sampleV1()) });
  assert.deepEqual(load(storage), migratedV1());
  assert.equal(storage.getItem(CORRUPT_KEY), null);
});

test('importJson migrates a version 1 backup', () => {
  assert.deepEqual(importJson(JSON.stringify(sampleV1())), { state: migratedV1() });
});

test('load migrates a version 2 state', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(sampleV2()) });
  assert.deepEqual(load(storage), migratedV1());
  assert.equal(storage.getItem(CORRUPT_KEY), null);
});

test('importJson reads the grouping of a version 2 backup, with the aisles in place of the recipes', () => {
  const stateOf = (grouped) => importJson(JSON.stringify({ ...sampleV2(), grouped })).state;
  assert.equal(stateOf(false).group, 'none');
  [true, undefined, null, 'no', 0].forEach((value) => assert.equal(stateOf(value).group, 'aisle', String(value)));
  assert.equal('grouped' in stateOf(false), false);
});

test('importJson keeps a known group and turns any other value, the shop and the recipe grouping too, into the aisle grouping', () => {
  const groupOf = (group) => importJson(JSON.stringify({ ...sample(), group })).state.group;
  ['aisle', 'none'].forEach((group) => assert.equal(groupOf(group), group));
  ['shop', 'recipe', undefined, null, 'floor', 1, true].forEach((value) => assert.equal(groupOf(value), 'aisle', String(value)));
});

test('a known group wins over the old grouped field', () => {
  assert.equal(importJson(JSON.stringify({ ...sample(), group: 'aisle', grouped: false })).state.group, 'aisle');
});

test('importJson repairs the shops of an item before they become lists', () => {
  const shopsOf = (shops) => {
    const [bread, milk] = sample().items;
    return listsOf(importJson(JSON.stringify({ ...sample(), items: [{ ...bread, shops }, milk] })).state, 'Bread');
  };
  [undefined, null, 'Lidl', 7, {}].forEach((value) => assert.deepEqual(shopsOf(value), ['General'], String(value)));
  assert.deepEqual(shopsOf([' Lidl ', '', '  ', 7, null, 'lidl', 'Market']), ['Lidl', 'Market']);
});

test('importJson gives each list the spelling of the first use of its shop', () => {
  const [bread, milk] = sample().items;
  const data = { ...sample(), items: [{ ...bread, shops: ['Lidl'] }, { ...milk, shops: ['market', 'LIDL'] }] };
  const { state } = importJson(JSON.stringify(data));
  assert.deepEqual(listNames(state), ['Lidl', 'market']);
  assert.deepEqual(listsOf(state, 'Milk'), ['market', 'Lidl']);
});

test('a version 11 state with every item in a shop gets no General', () => {
  const [bread, milk] = sample().items;
  const data = { ...sample(), items: [bread, { ...milk, shops: ['Lidl'] }] };
  assert.deepEqual(listNames(importJson(JSON.stringify(data)).state), ['Lidl', 'Market']);
});

test('the items with no shop join a shop called general in any case, and no second General comes', () => {
  const [bread, milk] = sample().items;
  const data = { ...sample(), items: [{ ...bread, shops: ['general'] }, milk] };
  const { state } = importJson(JSON.stringify(data));
  assert.deepEqual(state.lists, [{ id: 'list-1', name: 'general' }]);
  assert.deepEqual(state.items.map((item) => item.list), ['list-1', 'list-1']);
});

test('a migrated state gets the same ids at each read, so a reload before a save keeps them', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(sample()) });
  assert.deepEqual(load(storage), load(storage));
});

test('a version 12 state keeps its lists, its view and its order of lists', () => {
  const state = { ...current(), view: 'cards', listSort: 'name' };
  assert.deepEqual(importJson(JSON.stringify(state)), { state });
});

test('a version 12 state turns an unknown view into rows, an unknown order of lists into custom and an unknown group into aisle', () => {
  const { state } = importJson(JSON.stringify({ ...current(), view: 'grid', listSort: 'size', group: 'shop' }));
  assert.equal(state.view, 'rows');
  assert.equal(state.listSort, 'custom');
  assert.equal(state.group, 'aisle');
});

test('a version 12 state trims the names of its lists and of its items', () => {
  const data = current();
  data.lists[0].name = ' Lidl ';
  data.items[0].name = ' Bread ';
  assert.deepEqual(importJson(JSON.stringify(data)), { state: current() });
});

test('a version 12 state with a broken list or item is not a backup', () => {
  const broken = [
    (data) => { data.items[0].list = 'nope'; },
    (data) => { delete data.items[0].list; },
    (data) => { data.lists[1].name = 'lidl'; },
    (data) => { data.lists[1].name = '  '; },
    (data) => { data.lists[1].id = 'list-1'; },
    (data) => { data.lists = 'x'; },
    (data) => { data.lists[0] = null; },
    (data) => { data.items[1] = { ...data.items[1], list: 'list-1', name: 'bread' }; },
    (data) => { data.items[1].id = 'a'; },
  ];
  broken.forEach((change, index) => {
    const data = current();
    change(data);
    assert.deepEqual(importJson(JSON.stringify(data)), { error: { key: 'error.notBackup' } }, String(index));
  });
});

test('a version 12 state may hold one name in two lists', () => {
  assert.deepEqual(importJson(JSON.stringify(current())).state.items.filter((item) => item.name === 'Bread').length, 2);
});

test('importJson drops the recipes and the sent recipes of a Bodega backup, valid or not', () => {
  for (const recipes of [sampleV2().recipes, 'x', [null], [{ id: '', name: ' ' }]]) {
    const { state } = importJson(JSON.stringify({ ...sample(), recipes, sent: ['r1', 7] }));
    assert.deepEqual(state, current());
  }
});

test('importJson keeps the name sort and turns any other value into custom', () => {
  const sortOf = (sort) => importJson(JSON.stringify({ ...sample(), sort })).state.sort;
  assert.equal(sortOf('name'), 'name');
  ['custom', 'added', undefined, null, 'price', 1, true].forEach((value) => assert.equal(sortOf(value), 'custom', String(value)));
});

test('the name sort survives save and load', () => {
  const storage = fakeStorage();
  save(storage, { ...sample(), sort: 'name' });
  assert.equal(load(storage).sort, 'name');
});

test('loadLanguage returns the stored language when it is supported', () => {
  assert.equal(loadLanguage(fakeStorage({ [LANGUAGE_KEY]: 'de' }), ['de', 'en']), 'de');
});

test('loadLanguage returns null for no value and for an unsupported value', () => {
  assert.equal(loadLanguage(fakeStorage(), ['de', 'en']), null);
  assert.equal(loadLanguage(fakeStorage({ [LANGUAGE_KEY]: 'xx' }), ['de', 'en']), null);
  assert.equal(loadLanguage(fakeStorage({ [LANGUAGE_KEY]: '' }), ['de', 'en']), null);
});

test('saveLanguage stores a language and null removes it', () => {
  const storage = fakeStorage();
  assert.equal(saveLanguage(storage, 'fr'), true);
  assert.equal(storage.getItem(LANGUAGE_KEY), 'fr');
  assert.equal(saveLanguage(storage, null), true);
  assert.equal(storage.getItem(LANGUAGE_KEY), null);
});

test('the language functions do not throw when the storage does', () => {
  assert.equal(loadLanguage(brokenStorage(), ['de']), null);
  assert.equal(saveLanguage(brokenStorage(), 'de'), false);
  assert.equal(saveLanguage(brokenStorage(), null), false);
});

test('the language is not part of the state', () => {
  const storage = fakeStorage();
  saveLanguage(storage, 'it');
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('loadHand returns the stored hand', () => {
  assert.equal(loadHand(fakeStorage({ [HAND_KEY]: 'left' })), 'left');
  assert.equal(loadHand(fakeStorage({ [HAND_KEY]: 'right' })), 'right');
});

test('loadHand returns right for no value and for an unknown value', () => {
  assert.equal(loadHand(fakeStorage()), 'right');
  assert.equal(loadHand(fakeStorage({ [HAND_KEY]: 'both' })), 'right');
  assert.equal(loadHand(fakeStorage({ [HAND_KEY]: '' })), 'right');
});

test('saveHand stores left and right removes the key', () => {
  const storage = fakeStorage();
  assert.equal(saveHand(storage, 'left'), true);
  assert.equal(storage.getItem(HAND_KEY), 'left');
  assert.equal(saveHand(storage, 'right'), true);
  assert.equal(storage.getItem(HAND_KEY), null);
});

test('the hand functions do not throw when the storage does', () => {
  assert.equal(loadHand(brokenStorage()), 'right');
  assert.equal(saveHand(brokenStorage(), 'left'), false);
  assert.equal(saveHand(brokenStorage(), 'right'), false);
});

test('the hand is not part of the state', () => {
  const storage = fakeStorage();
  saveHand(storage, 'left');
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('the retired key of the row of shop lists has no reader', async () => {
  const storage = await import('#storage');
  assert.equal('loadShopLists' in storage, false);
  assert.equal('saveShopLists' in storage, false);
});

test('loadTheme returns the stored theme', () => {
  assert.equal(loadTheme(fakeStorage({ [THEME_KEY]: 'light' })), 'light');
  assert.equal(loadTheme(fakeStorage({ [THEME_KEY]: 'dark' })), 'dark');
});

test('loadTheme returns system for no value and for an unknown value', () => {
  assert.equal(loadTheme(fakeStorage()), 'system');
  assert.equal(loadTheme(fakeStorage({ [THEME_KEY]: 'blue' })), 'system');
  assert.equal(loadTheme(fakeStorage({ [THEME_KEY]: '' })), 'system');
});

test('saveTheme stores light and dark and system removes the key', () => {
  const storage = fakeStorage();
  assert.equal(saveTheme(storage, 'dark'), true);
  assert.equal(storage.getItem(THEME_KEY), 'dark');
  assert.equal(saveTheme(storage, 'light'), true);
  assert.equal(storage.getItem(THEME_KEY), 'light');
  assert.equal(saveTheme(storage, 'system'), true);
  assert.equal(storage.getItem(THEME_KEY), null);
});

test('saveTheme removes the key for an unknown theme', () => {
  const storage = fakeStorage({ [THEME_KEY]: 'dark' });
  assert.equal(saveTheme(storage, 'blue'), true);
  assert.equal(storage.getItem(THEME_KEY), null);
});

test('the theme functions do not throw when the storage does', () => {
  assert.equal(loadTheme(brokenStorage()), 'system');
  assert.equal(saveTheme(brokenStorage(), 'dark'), false);
  assert.equal(saveTheme(brokenStorage(), 'system'), false);
});

test('the theme is not part of the state', () => {
  const storage = fakeStorage();
  saveTheme(storage, 'dark');
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('loadDensity returns compact when it is stored', () => {
  assert.equal(loadDensity(fakeStorage({ [DENSITY_KEY]: 'compact' })), 'compact');
});

test('loadDensity returns normal for no value and for an unknown value', () => {
  assert.equal(loadDensity(fakeStorage()), 'normal');
  assert.equal(loadDensity(fakeStorage({ [DENSITY_KEY]: 'tiny' })), 'normal');
  assert.equal(loadDensity(fakeStorage({ [DENSITY_KEY]: '' })), 'normal');
});

test('saveDensity stores compact and normal removes the key', () => {
  const storage = fakeStorage();
  assert.equal(saveDensity(storage, 'compact'), true);
  assert.equal(storage.getItem(DENSITY_KEY), 'compact');
  assert.equal(saveDensity(storage, 'normal'), true);
  assert.equal(storage.getItem(DENSITY_KEY), null);
});

test('saveDensity removes the key for an unknown density', () => {
  const storage = fakeStorage({ [DENSITY_KEY]: 'compact' });
  assert.equal(saveDensity(storage, 'tiny'), true);
  assert.equal(storage.getItem(DENSITY_KEY), null);
});

test('the density functions do not throw when the storage does', () => {
  assert.equal(loadDensity(brokenStorage()), 'normal');
  assert.equal(saveDensity(brokenStorage(), 'compact'), false);
  assert.equal(saveDensity(brokenStorage(), 'normal'), false);
});

test('the density is not part of the state', () => {
  const storage = fakeStorage();
  saveDensity(storage, 'compact');
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('loadOnboarded is true when the flag is stored', () => {
  assert.equal(loadOnboarded(fakeStorage({ [ONBOARDED_KEY]: '1' })), true);
});

test('loadOnboarded is false for no value and for another value', () => {
  assert.equal(loadOnboarded(fakeStorage()), false);
  assert.equal(loadOnboarded(fakeStorage({ [ONBOARDED_KEY]: '' })), false);
  assert.equal(loadOnboarded(fakeStorage({ [ONBOARDED_KEY]: 'true' })), false);
});

test('loadOnboarded is true for a storage that throws', () => {
  assert.equal(loadOnboarded(brokenStorage()), true);
});

test('saveOnboarded stores the flag', () => {
  const storage = fakeStorage();
  assert.equal(saveOnboarded(storage), true);
  assert.equal(storage.getItem(ONBOARDED_KEY), '1');
  assert.equal(loadOnboarded(storage), true);
});

test('saveOnboarded is false for a storage that throws', () => {
  assert.equal(saveOnboarded(brokenStorage()), false);
});

test('hasStoredState is true for a stored state', () => {
  const storage = fakeStorage();
  save(storage, emptyState());
  assert.equal(hasStoredState(storage), true);
});

test('hasStoredState is true for a stored text that is not a valid state', () => {
  assert.equal(hasStoredState(fakeStorage({ [STORAGE_KEY]: 'not json' })), true);
});

test('hasStoredState is false for no stored state and for a storage that throws', () => {
  assert.equal(hasStoredState(fakeStorage()), false);
  assert.equal(hasStoredState(fakeStorage({ [ONBOARDED_KEY]: '1' })), false);
  assert.equal(hasStoredState(brokenStorage()), false);
});

test('the flag of the walkthrough is not part of the stored state', () => {
  const storage = fakeStorage();
  saveOnboarded(storage);
  assert.deepEqual(load(storage), emptyState());
  assert.equal(exportJson(load(storage)).includes('onboarded'), false);
});

test('load migrates a version 3 state', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(sampleV3()) });
  assert.deepEqual(load(storage), current());
  assert.equal(storage.getItem(CORRUPT_KEY), null);
});

test('importJson migrates a version 3 backup', () => {
  assert.deepEqual(importJson(JSON.stringify(sampleV3())).state, current());
});

test('load reads a version 8 state and drops its menu', () => {
  const v8 = { ...sample(), version: 8, menu: [{ day: 0, meal: 'lunch', recipe: 'r1' }, { day: 1, meal: 'dinner', dish: 'Paella' }] };
  assert.deepEqual(load(fakeStorage({ [STORAGE_KEY]: JSON.stringify(v8) })), current());
});

test('load migrates a version 4 state with no quantity on each item', () => {
  const { items, ...rest } = sample();
  const v4 = { ...rest, version: 4, items: items.map(({ quantity, ...item }) => item) };
  assert.deepEqual(load(fakeStorage({ [STORAGE_KEY]: JSON.stringify(v4) })), {
    ...current(),
    items: current().items.map((item) => ({ ...item, quantity: '' })),
  });
});

test('importJson trims a quantity and reads a quantity that is not text as none', () => {
  const quantityOf = (quantity) => importJson(JSON.stringify({ ...sample(), items: [{ ...sample().items[0], quantity }] })).state.items[0].quantity;
  assert.equal(quantityOf(' 2 kg '), '2 kg');
  [2, null, undefined, ['2'], {}].forEach((value) => assert.equal(quantityOf(value), '', String(value)));
});

test('load migrates a version 5 state with no change of its items', () => {
  const v5 = { ...sample(), version: 5 };
  assert.deepEqual(load(fakeStorage({ [STORAGE_KEY]: JSON.stringify(v5) })), current());
});

test('a version 10 state drops its saved and ticked items', () => {
  const [bread, milk] = sample().items;
  const v10 = {
    ...sample(),
    version: 10,
    items: [
      { ...bread, list: 'active', bought: false },
      { ...milk, list: 'saved', bought: false },
      { id: 'c', name: 'Salt', list: 'active', bought: true, shops: ['Lidl'], quantity: '1', aisle: '' },
    ],
  };
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(v10) });
  const expected = { ...current(), lists: current().lists.slice(0, 2), items: current().items.slice(0, 2) };
  assert.deepEqual(load(storage), expected);
  assert.equal(storage.getItem(CORRUPT_KEY), null);
  assert.deepEqual(importJson(JSON.stringify(v10)), { state: expected });
});

test('a version 10 or 11 item with no list and no bought is an item to buy', () => {
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), version: 10 })), { state: current() });
  assert.deepEqual(importJson(JSON.stringify(sample())), { state: current() });
});

test('load migrates a version 6 state with no aisles', () => {
  const { aisles, items, ...rest } = sample();
  const v6 = { ...rest, version: 6, items: items.map(({ aisle, ...item }) => item) };
  assert.deepEqual(load(fakeStorage({ [STORAGE_KEY]: JSON.stringify(v6) })), {
    ...current(),
    aisles: [],
    items: current().items.map((item) => ({ ...item, aisle: '' })),
  });
});

test('importJson trims the aisles and drops an entry that is not text, is empty or is a duplicate', () => {
  const aisles = [' Bakery ', 3, '', 'bakery', 'Dairy', null];
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), aisles })).state.aisles, ['Bakery', 'Dairy']);
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), aisles: 'Bakery' })).state.aisles, []);
});

test('importJson gives an item the spelling of its aisle and clears an aisle that is not in the aisles', () => {
  const aisleOf = (aisle) => importJson(JSON.stringify({ ...sample(), items: [{ ...sample().items[0], aisle }] })).state.items[0].aisle;
  assert.equal(aisleOf(' bakery '), 'Bakery');
  [' ', 'Frozen', 3, null, undefined].forEach((value) => assert.equal(aisleOf(value), '', String(value)));
});

test('a Bodega backup keeps next items and items unticked by again, and drops saved and ticked items', () => {
  const { items, ...rest } = sample();
  const v7 = {
    ...rest,
    version: 7,
    items: [
      { id: 'a', name: 'Bread', recurrent: false, list: 'next', bought: false, again: false, shops: [], quantity: '', aisle: '' },
      { id: 'b', name: 'Soap', recurrent: false, list: 'active', bought: true, again: true, shops: [], quantity: '', aisle: '' },
      { id: 'c', name: 'Salt', recurrent: false, list: 'active', bought: true, again: false, shops: [], quantity: '', aisle: '' },
      { id: 'd', name: 'Rice', recurrent: false, list: 'saved', bought: false, again: false, shops: [], quantity: '', aisle: '' },
    ],
  };
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(v7) });
  const state = load(storage);
  assert.equal(state.version, 12);
  assert.deepEqual(state.items, [
    { id: 'a', name: 'Bread', list: 'list-1', quantity: '', aisle: '' },
    { id: 'b', name: 'Soap', list: 'list-1', quantity: '', aisle: '' },
  ]);
  assert.deepEqual(importJson(JSON.stringify(v7)).state, state);
  assert.equal(storage.getItem(CORRUPT_KEY), null);
});

test('a ticked recurrent item with again stays ticked in Bodega, so a version 7 state drops it', () => {
  const v7 = { ...sample(), version: 7, items: [{ ...sample().items[1], list: 'active', recurrent: true, bought: true, again: true }] };
  assert.deepEqual(importJson(JSON.stringify(v7)).state.items, []);
});

test('importJson accepts an item with no again field and rejects again that is not a boolean', () => {
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), version: 7 })), { state: current() });
  const bad = { ...sample(), version: 7, items: [{ ...sample().items[0], again: 'yes' }] };
  assert.deepEqual(importJson(JSON.stringify(bad)), { error: { key: 'error.notBackup' } });
});

test('the stored state is version 12', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ ...sample(), version: 7 }) });
  save(storage, load(storage));
  const stored = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(stored.version, 12);
  for (const field of ['shops', 'bought', 'again']) assert.equal(stored.items.some((item) => field in item), false, field);
});

test('loadSwipeHint is false when no hint was shown', () => {
  assert.equal(loadSwipeHint(fakeStorage()), false);
});

test('saveSwipeHint stores the hint, and loadSwipeHint then reads it as shown', () => {
  const storage = fakeStorage();
  assert.equal(saveSwipeHint(storage), true);
  assert.equal(storage.getItem(SWIPE_HINT_KEY), '1');
  assert.equal(loadSwipeHint(storage), true);
});

test('loadSwipeHint is false for another value', () => {
  assert.equal(loadSwipeHint(fakeStorage({ [SWIPE_HINT_KEY]: 'true' })), false);
});

test('loadSwipeHint is false and saveSwipeHint fails for a storage that throws', () => {
  assert.equal(loadSwipeHint(brokenStorage()), false);
  assert.equal(saveSwipeHint(brokenStorage()), false);
});

test('resetAll removes every key of the app and keeps the keys of other apps', () => {
  const storage = fakeStorage({
    ...Object.fromEntries(APP_KEYS.map((key) => [key, '1'])),
    'other.key': 'kept',
  });
  assert.equal(resetAll(storage), true);
  for (const key of APP_KEYS) assert.equal(storage.getItem(key), null, key);
  assert.equal(storage.getItem('other.key'), 'kept');
});

test('APP_KEYS holds the state, its corrupt copy and each preference of the device', () => {
  const keys = [STORAGE_KEY, CORRUPT_KEY, LANGUAGE_KEY, HAND_KEY, SHOP_LISTS_KEY, THEME_KEY, DENSITY_KEY, ONBOARDED_KEY, SWIPE_HINT_KEY, SEEN_VERSION_KEY];
  assert.deepEqual([...APP_KEYS].sort(), [...keys].sort());
});

test('APP_KEYS has no tripEnd key', () => {
  assert.equal(APP_KEYS.includes('lists.tripEnd'), false);
});

test('after resetAll the install counts as new', () => {
  const storage = fakeStorage();
  save(storage, current());
  saveOnboarded(storage);
  resetAll(storage);
  assert.equal(hasStoredState(storage), false);
  assert.equal(loadOnboarded(storage), false);
  assert.deepEqual(load(storage), emptyState());
});

test('resetAll fails for a storage that throws', () => {
  assert.equal(resetAll(brokenStorage()), false);
});

test('each key of the app starts with lists., apart from the keys of Bodega on the same origin', () => {
  for (const key of APP_KEYS) assert.ok(key.startsWith('lists.'), key);
});

test('a recurrent item of a Bodega state loads as a plain item, with no recurrent key', () => {
  for (const recurrent of [true, false]) {
    const data = { ...sample(), items: sample().items.map((item) => ({ ...item, recurrent })) };
    assert.deepEqual(importJson(JSON.stringify(data)).state, current());
  }
});

test('an item with no recurrent key is valid, and a recurrent key that is not a boolean is ignored', () => {
  assert.deepEqual(importJson(JSON.stringify(sample())).state, current());
  const data = { ...sample(), items: sample().items.map((item) => ({ ...item, recurrent: 'yes' })) };
  assert.deepEqual(importJson(JSON.stringify(data)).state, current());
});

test('a Bodega version 9 backup imports as a version 12 state with its items, a list for its shop, quantity and aisle', () => {
  const backup = {
    version: 9,
    items: [{ id: 'm', name: 'Leche', recurrent: true, list: 'active', bought: false, shops: ['Mercadona'], quantity: '2', aisle: 'Lácteos' }],
    recipes: [{ id: 'r1', name: 'Tortilla', products: ['Huevos'], url: '' }, { id: 'r2', name: 'Flan', products: [], url: '' }],
    sent: ['r1'],
    group: 'recipe',
    sort: 'custom',
    menu: [{ day: 0, meal: 'lunch', recipe: 'r1' }, { day: 1, meal: 'dinner', dish: 'Paella' }],
    aisles: ['Lácteos'],
  };
  assert.deepEqual(importJson(JSON.stringify(backup)), {
    state: {
      version: 12,
      lists: [{ id: 'list-1', name: 'Mercadona' }],
      items: [{ id: 'm', name: 'Leche', list: 'list-1', quantity: '2', aisle: 'Lácteos' }],
      group: 'aisle',
      sort: 'custom',
      aisles: ['Lácteos'],
      view: 'rows',
      listSort: 'custom',
    },
  });
});

test('a stored version 9 state loads as version 12', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ ...sample(), version: 9 }) });
  assert.deepEqual(load(storage), current());
});

test('the seen version has a key of the app (VER-20)', () => {
  assert.equal(SEEN_VERSION_KEY, 'lists.seen-version');
});

test('loadSeen gives the stored version, and null when there is none or the storage throws', () => {
  assert.equal(loadSeen(fakeStorage({ [SEEN_VERSION_KEY]: '1.2.3' })), '1.2.3');
  assert.equal(loadSeen(fakeStorage()), null);
  assert.equal(loadSeen(brokenStorage()), null);
});

test('saveSeen stores the version, and is false for a storage that throws', () => {
  const storage = fakeStorage();
  assert.equal(saveSeen(storage, '1.2.3'), true);
  assert.equal(loadSeen(storage), '1.2.3');
  assert.equal(saveSeen(brokenStorage(), '1.2.3'), false);
});
