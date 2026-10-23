import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SECTIONS, SHORTCUTS, direction, dockShown, emptyAction, fabState, slideDirection, slideTo, shortcutStart } from '#sections';

test('SECTIONS has the order of the bottom bar', () => {
  assert.deepEqual(SECTIONS, ['active', 'settings']);
});

test('slideDirection is 1 for a slide to the left and -1 for a slide to the right', () => {
  assert.equal(slideDirection(-80, 0), 1);
  assert.equal(slideDirection(80, 0), -1);
});

test('slideDirection is 0 for a short slide', () => {
  assert.equal(slideDirection(-59, 0), 0);
  assert.equal(slideDirection(59, 0), 0);
  assert.equal(slideDirection(0, 0), 0);
  assert.equal(slideDirection(-60, 0), 1);
});

test('slideDirection is 0 for a slide that is not horizontal', () => {
  assert.equal(slideDirection(-80, 41), 0);
  assert.equal(slideDirection(80, -120), 0);
  assert.equal(slideDirection(-80, 40), 1);
  assert.equal(slideDirection(80, -40), -1);
});

test('slideTo goes to the next section on a slide to the left', () => {
  assert.equal(slideTo('active', -80, 0), 'settings');
});

test('slideTo goes to the previous section on a slide to the right', () => {
  assert.equal(slideTo('settings', 80, 0), 'active');
});

test('slideTo stops at the first and at the last section', () => {
  assert.equal(slideTo('active', 200, 0), null);
  assert.equal(slideTo('settings', -200, 0), null);
});

test('slideTo ignores a short slide', () => {
  assert.equal(slideTo('active', -59, 0), null);
  assert.equal(slideTo('settings', 59, 0), null);
  assert.equal(slideTo('active', 0, 0), null);
  assert.equal(slideTo('active', -60, 0), 'settings');
});

test('slideTo ignores a slide that is not horizontal', () => {
  assert.equal(slideTo('active', -80, 41), null);
  assert.equal(slideTo('settings', 80, -120), null);
  assert.equal(slideTo('active', -80, 40), 'settings');
  assert.equal(slideTo('active', -80, -40), 'settings');
});

test('slideTo ignores a view that is not a section', () => {
  assert.equal(slideTo('other', -80, 0), null);
  assert.equal(slideTo('other', 80, 0), null);
});

test('direction is 1 towards a later section and -1 towards an earlier one', () => {
  assert.equal(direction('active', 'settings'), 1);
  assert.equal(direction('settings', 'active'), -1);
});

test('direction is 0 for the same section and for a view that is not a section', () => {
  assert.equal(direction('active', 'active'), 0);
  assert.equal(direction('other', 'active'), 0);
  assert.equal(direction('active', 'other'), 0);
  assert.equal(direction('recipes', 'settings'), 0);
});

test('slideTo uses the given list of sections', () => {
  assert.equal(slideTo('active', -80, 0, ['active']), null);
});

test('direction uses the given list of sections', () => {
  const sections = ['active', 'settings'];
  assert.equal(direction('active', 'settings', sections), 1);
  assert.equal(direction('settings', 'active', sections), -1);
  assert.equal(direction('recipes', 'settings', sections), 0);
});

test('shortcutStart opens the add sheet of Compra for add', () => {
  assert.deepEqual(shortcutStart('add'), { view: 'active', add: true });
});

test('shortcutStart opens the section of a section shortcut, with no sheet', () => {
  for (const view of ['active']) assert.deepEqual(shortcutStart(view), { view, add: false });
});

test('shortcutStart is null for an unknown name, for settings and for no name', () => {
  for (const name of ['settings', 'recipes', 'menu', 'other', '', null, undefined, 'toString']) assert.equal(shortcutStart(name), null);
});

test('SHORTCUTS has each shortcut of the manifest, in its order', () => {
  const manifest = JSON.parse(readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.shortcuts.map(({ url }) => url), SHORTCUTS.map((name) => `./?open=${name}`));
  for (const name of SHORTCUTS) assert.ok(shortcutStart(name), name);
});

const NO_QUERY = { query: '' };

test('emptyAction of a list search with no match adds the searched name', () => {
  const result = emptyAction('active', { ...NO_QUERY, query: ' xyz ' });
  assert.deepEqual(result, { title: null, text: 'empty.noItemMatch', action: 'add-query' });
});

test('emptyAction of a search that is only spaces is the empty list', () => {
  assert.equal(emptyAction('active', { ...NO_QUERY, query: '   ' }).text, 'empty.active');
});

test('emptyAction of an empty list has a title, a text and the add button as its action', () => {
  assert.deepEqual(emptyAction('active', NO_QUERY), { title: 'empty.activeTitle', text: 'empty.active', action: 'add-item' });
});

test('emptyAction of a section with nothing to say is empty', () => {
  assert.deepEqual(emptyAction('settings', NO_QUERY), { title: null, text: null, action: null });
});

test('fabState collapses the add button after a scroll down of more than 24 px', () => {
  assert.equal(fabState(0, 30, 'open'), 'collapsed');
  assert.equal(fabState(100, 125, 'open'), 'collapsed');
  assert.equal(fabState(100, 124, 'open'), 'open');
});

test('fabState opens the add button on any scroll up', () => {
  assert.equal(fabState(31, 30, 'collapsed'), 'open');
  assert.equal(fabState(200, 199, 'open'), 'open');
});

test('fabState opens the add button at the top of the list', () => {
  assert.equal(fabState(10, 0, 'collapsed'), 'open');
  assert.equal(fabState(0, 0, 'collapsed'), 'open');
});

test('fabState keeps the state on a short scroll down', () => {
  assert.equal(fabState(0, 10, 'collapsed'), 'collapsed');
  assert.equal(fabState(0, 10, 'open'), 'open');
});

test('the section slide does not start on the dock', () => {
  const nav = readFileSync(new URL('../src/ui/nav.js', import.meta.url), 'utf8');
  const [exclusion = ''] = nav.match(/event\.target\.closest\('\.item-row-swipe[^']*'\)/) ?? [];
  assert.match(exclusion, /\.dock\b/);
});

test('SHORTCUTS are the add sheet and the sections with a list', () => {
  assert.deepEqual(SHORTCUTS, ['add', 'active']);
});

test('dockShown shows the dock in Listas with an item', () => {
  assert.equal(dockShown({ view: 'active', activeCount: 3 }), true);
  assert.equal(dockShown({ view: 'active', activeCount: 0 }), false);
});

test('dockShown hides the dock in Ajustes', () => {
  assert.equal(dockShown({ view: 'settings', activeCount: 3 }), false);
});
