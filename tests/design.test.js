import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { RULES } from '../vendor/design-system/rules.js';
import { parseCatalog, classesInScript } from '../vendor/design-system/catalog.js';

// The rules of the design system (docs/spec/15-design-system.md) over the files of the app.
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const optional = (path) => (existsSync(new URL(path, root)) ? read(path) : '');

const files = {
  css: [read('vendor/design-system/design-system.css'), read('styles.css')],
  html: read('index.html'),
  scripts: readdirSync(new URL('src/ui/', root)).map((file) => [file, read(`src/ui/${file}`)]),
  sprite: optional('icons.svg'),
  page: optional('designs/page.js'),
  pageHtml: optional('designs/index.html'),
};

// The exceptions of docs/spec/15-design-system.md, by rule id.
const SKIP = {};

test('the rules read the shared stylesheet and styles.css', () => {
  // LAY-4 reads the body rule of the app only when there are two sheets.
  assert.equal(files.css.length, 2);
});

test('the design system has rules to run', () => {
  assert.ok(RULES.length > 0);
});

for (const rule of RULES) test(rule.title, { skip: SKIP[rule.id] ?? false }, () => assert.deepEqual(rule.check(files), []));

test('the parts of the app are documented in styles.css (DSV-3)', () => {
  const names = parseCatalog({ css: read('styles.css'), sprite: files.sprite }).components.map((part) => part.name);
  for (const name of ['lists-row', 'search', 'hint']) assert.ok(names.includes(name), name);
});

test('the design test reads the classes of the item rows, states included', () => {
  const rows = classesInScript(read('src/ui/rows.js'));
  for (const name of ['item-row', 'flash', 'gone', 'item-row-swipe', 'open', 'item-row-end', 'item-row-label', 'tick']) assert.ok(rows.includes(name), name);
});

test('styles.css leaves the rail to the design system (LAY-2)', () => {
  const app = read('styles.css');
  assert.doesNotMatch(app, /\.nav-bar\s*[{,]/);
  assert.doesNotMatch(app, /@extends nav-bar/);
});

test('the rows of the first level do not take list-row, the row of a list group of the design system', () => {
  const classes = classesInScript(read('src/ui/lists.js'));
  assert.equal(classes.includes('list-row'), false);
  assert.ok(classes.includes('lists-row'));
});

test('the slide hint of ROW-14 plays only inside a list, on an item row, not on a list row', () => {
  assert.match(read('src/ui/list.js'), /if \(inList\(\)\) hintSwipe\(\);/);
});
