import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATALOGS } from '#i18n';
import { PAGES } from '#onboarding';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const body = html.slice(html.indexOf('<body'), html.indexOf('<script type="importmap">'));

const textKeys = [...body.matchAll(/data-i18n="([^"]+)"/g)].map(([, key]) => key);
const attrKeys = [...body.matchAll(/data-i18n-attr="([^"]+)"/g)].flatMap(([, pairs]) =>
  pairs.split(',').map((pair) => pair.split(':')[1]));

test('the page has translated text and translated attributes', () => {
  assert.ok(textKeys.length > 0);
  assert.ok(attrKeys.length > 0);
});

test('each key of the page is in the Spanish catalog', () => {
  for (const key of [...textKeys, ...attrKeys]) assert.ok(Object.hasOwn(CATALOGS.es, key), key);
});

test('an element with a text key is empty in the markup', () => {
  for (const [, key, text] of body.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)) assert.equal(text.trim(), '', key);
});

test('the markup has no text of its own', () => {
  const visible = body
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<span class="chevron"[^>]*>[^<]*<\/span>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[+\s]/g, '');
  assert.equal(visible, '');
  assert.doesNotMatch(body, /\s(aria-label|placeholder|title)="/);
});

test('the walkthrough has one drawing for each page, in the order of the pages', () => {
  const [layer = ''] = body.match(/<div id="onboarding"[\s\S]*?<input id="import-file"/) ?? [];
  const drawings = [...layer.matchAll(/<svg data-page="([^"]+)"/g)].map(([, page]) => page);
  assert.deepEqual(drawings, PAGES);
});

test('the walkthrough puts the app icon first inside the page group, with no text', () => {
  const [, page = ''] = body.match(/<div id="onboarding-page"[^>]*>\s*([\s\S]*?)<div class="onboarding-art">/) ?? [];
  assert.match(page, /^<img id="onboarding-logo" class="onboarding-logo" src="\.\/icons\/logo\.png" alt="">\s*$/);
});

test('the walkthrough order is: top bar with Atrás and Saltar, the page, the dots, the next button', () => {
  const [layer = ''] = body.match(/<div id="onboarding"[\s\S]*?<input id="import-file"/) ?? [];
  const order = [...layer.matchAll(/class="onboarding-top"|id="onboarding-page"|id="onboarding-dots"|id="onboarding-next"/g)].map(([found]) => found);
  assert.deepEqual(order, ['class="onboarding-top"', 'id="onboarding-page"', 'id="onboarding-dots"', 'id="onboarding-next"']);
  const [bar = ''] = layer.match(/<div class="onboarding-top">[\s\S]*?<\/div>/) ?? [];
  assert.deepEqual([...bar.matchAll(/<button id="([^"]+)"/g)].map(([, id]) => id), ['onboarding-back', 'onboarding-skip']);
  assert.match(bar, /id="onboarding-back" class="button accent"[^>]*data-i18n="onboarding\.back"/);
  assert.match(bar, /id="onboarding-skip" class="button quiet"/);
  assert.match(layer, /<button id="onboarding-next" class="button primary wide"/);
  assert.doesNotMatch(layer, /onboarding-actions/);
});

test('the walkthrough title can take the focus, so no button shows a ring on load', () => {
  assert.match(body, /<h2 id="onboarding-title" class="onboarding-title" tabindex="-1">/);
});

test('the page has no trip: no trip button, no trip sheet, no banner and no trip-end group', () => {
  for (const id of ['trip', 'trip-button', 'finish', 'trip-end']) assert.doesNotMatch(body, new RegExp(`id="${id}"`), id);
});

// Each sheet of the page: the markup from its open tag to the open tag of the next sheet.
const sheetParts = () => {
  const opens = [...body.matchAll(/<(div|form) (?:id="([^"]+)" )?class="sheet"/g)];
  return opens.map((open, i) => ({ id: open[2] ?? null, part: body.slice(open.index, opens[i + 1]?.index ?? body.length) }));
};

test('each of the five sheets has the grab, then a head with its title and Listo, then a body', () => {
  const parts = sheetParts();
  assert.equal(parts.length, 5);
  assert.deepEqual(parts.slice(2).map(({ id }) => id), ['list-form', 'edit-form', 'aisles-form']);
  for (const { id, part } of parts) {
    assert.match(
      part,
      /^<(div|form)[^>]*>\s*<div class="sheet-grab"><\/div>\s*<header class="sheet-head"><h2 [^>]*class="sheet-title main"[^>]*><\/h2><button class="button tonal" type="button" data-i18n="edit.done"><\/button><\/header>\s*<div class="sheet-body">/,
      id ?? part.slice(0, 60),
    );
  }
});

test('the edit sheet has a foot with Eliminar and Guardado; the other sheets have none', () => {
  const feet = sheetParts().filter(({ part }) => part.includes('sheet-foot')).map(({ id }) => id);
  assert.deepEqual(feet, ['list-form', 'edit-form']);
  for (const [id, prefix] of [['list-form', 'list'], ['edit-form', 'edit']]) {
    const { part } = sheetParts().find((sheet) => sheet.id === id);
    assert.match(
      part,
      new RegExp(`<\\/div>\\s*<footer class="sheet-foot"><button id="${prefix}-delete" class="button outline danger" type="button"><svg [^>]*><use href="icons.svg#trash"\\/><\\/svg><span data-i18n="sheet.delete"><\\/span><\\/button><span class="sheet-saved"><svg [^>]*><use href="icons.svg#check"\\/><\\/svg><span data-i18n="sheet.saved"><\\/span><\\/span><\\/footer>\\s*<\\/(div|form)>`),
      id,
    );
  }
});

test('the sheets with a title of their own give it an id; the others a fixed text', () => {
  const titles = sheetParts().map(({ part }) => part.match(/<h2 ([^>]*)class="sheet-title main"([^>]*)>/).slice(1).join(''));
  assert.deepEqual(titles, [
    'id="add-title" ',
    ' data-i18n="arrange.label"',
    'id="list-title" ',
    'id="edit-title" ',
    ' data-i18n="aisles.title"',
  ]);
});

test('the empty state of a list holds a title, a text and an action button, set by the view', () => {
  assert.match(body, /<div id="empty" class="empty-state low" hidden>\s*<h2 id="empty-title" class="empty-state-title" hidden><\/h2>\s*<p id="empty-text"><\/p>\s*<button id="empty-action" class="button primary wide" type="button" hidden><\/button>\s*<\/div>/);
});

test('the edit sheet has a veil, a dialog, the name and quantity fields', () => {
  const [layer = ''] = body.match(/<div id="edit" class="sheet-layer"[\s\S]*?<\/form>\s*<\/div>/) ?? [];
  assert.match(layer, /<div id="edit-veil" class="sheet-veil">/);
  assert.match(layer, /<form id="edit-form" class="sheet" role="dialog"/);
  assert.match(layer, /<input id="edit-name"[^>]*maxlength="80"/);
  assert.match(layer, /<input id="edit-quantity"[^>]*maxlength="20"/);
  // Each field keeps its name in sight: a label that floats onto the border once the field has a value.
  assert.match(layer, /<label class="field"><input id="edit-name"[^>]*><span class="field-label" data-i18n="edit.name"><\/span><\/label>/);
  assert.match(layer, /<label class="field"><input id="edit-quantity"[^>]*><span class="field-label" data-i18n="edit.quantity"><\/span><\/label>/);
  assert.doesNotMatch(layer, /edit-repeat|edit-shop|edit-chips/);
  assert.doesNotMatch(body, /id="shops/);
});

const settings = body.match(/<section id="settings"[\s\S]*?<\/section>/)?.[0] ?? '';
const groups = settings.split('<h2 ').slice(1).map((part) => [part, part.split('</h2>')[1]]);

test('each group of Ajustes is a list-group-head and one full-width list-group', () => {
  assert.equal(groups.length, 5);
  assert.equal([...settings.matchAll(/<h2 /g)].length, 5);
  assert.equal([...settings.matchAll(/class="list-group"/g)].length, 5);
  assert.doesNotMatch(settings, /settings-title/);
});

test('language, hand, theme and density are rows of the group Preferencias', () => {
  const [, rows] = groups.find(([all]) => all.includes('data-i18n="settings.preferences"')) ?? [];
  assert.ok(rows);
  for (const id of ['language', 'hand', 'theme', 'density']) {
    assert.match(rows, new RegExp(`<select id="${id}" class="select"`));
    assert.match(rows, new RegExp(`id="${id}-value" class="settings-row-value"`));
  }
});

test('the rows that open something end with a chevron', () => {
  for (const id of ['export', 'import', 'aisles-open', 'show-onboarding', 'show-whatsnew', 'install']) {
    const [row = ''] = settings.match(new RegExp(`<button id="${id}"[\\s\\S]*?</button>`)) ?? [];
    assert.match(row, /class="settings-row"/, id);
    assert.match(row, /<span class="chevron" aria-hidden="true">[^<]*<\/span>\s*<\/button>$/, id);
  }
});

test('the update notice is a banner with a wide primary button above the version line', () => {
  const [banner = ''] = settings.match(/<div id="update-banner"[\s\S]*?<\/div>/) ?? [];
  assert.match(banner, /class="banner"[^>]* hidden/);
  assert.match(banner, /<strong id="update-title"><\/strong>\s*<p id="update-text" class="banner-text"><\/p>/);
  assert.match(banner, /<button id="update" class="button primary wide"/);
  assert.ok(settings.indexOf('id="update-banner"') < settings.indexOf('id="version"'));
});

test('the dock stands before the add button with the search', () => {
  const [dock = ''] = body.match(/<div id="dock" class="dock"[\s\S]*?<button id="fab"/) ?? [];
  const ids = [...dock.matchAll(/<button id="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(ids[0], 'dock-search');
  assert.match(dock, /<label id="dock-field" class="dock-field"[^>]*>[\s\S]*<input id="dock-query" class="dock-input" type="search"[\s\S]*<button id="dock-clear" class="dock-clear"/);
  assert.match(dock, /<button id="dock-cancel" class="button accent" type="button" data-i18n="search.cancel"/);
});

test('the dock ends with the add button', () => {
  const [dock = ''] = body.match(/<div id="dock" class="dock"[\s\S]*?<button id="fab"/) ?? [];
  const ids = [...dock.matchAll(/<(?:button|label) id="([^"]+)"/g)].map(([, id]) => id).filter((id) => id !== 'dock-clear');
  assert.deepEqual(ids, ['dock-search', 'dock-field', 'dock-cancel', 'dock-add', 'fab']);
  assert.match(dock, /<button id="dock-add" class="button primary icon dock-add" type="button"><svg class="icon" aria-hidden="true"><use href="icons.svg#plus"\/><\/svg><\/button>\s*<\/div>\s*<button id="fab"/);
});

test('the page has no shop lists: no chips, no end card, no shop picker, no shop chip in the dock', () => {
  for (const id of ['shop-chips', 'shop-done', 'shop-pick', 'dock-shop', 'dock-prev', 'dock-next', 'arrange-lists']) {
    assert.doesNotMatch(body, new RegExp(`id="${id}"`), id);
  }
});

test('the header has a back button before its text, for the inside of a list', () => {
  assert.match(body, /<header class="app-header">\s*<button id="back-button" class="button icon" type="button" data-i18n-attr="aria-label:lists.back" hidden>\s*<svg class="icon" aria-hidden="true"><use href="icons.svg#chevron-left"\/><\/svg>\s*<\/button>\s*<div class="app-header-text">/);
});

test('the bottom bar shows a list icon for Listas and the gear for Ajustes, each with its name', () => {
  const nav = body.match(/<nav class="nav-bar"[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.match(nav, /data-view="active">\s*<svg class="icon" aria-hidden="true"><use href="icons.svg#list"\/><\/svg>\s*<span data-i18n="list.active"><\/span>/);
  assert.match(nav, /data-view="settings">\s*<svg class="icon" aria-hidden="true"><use href="icons.svg#settings"\/><\/svg>\s*<span data-i18n="nav.settings"><\/span>/);
});

test('an outline button is only a destructive one; other secondary actions are tonal', () => {
  for (const [, classes] of html.matchAll(/<button[^>]*class="(button outline[^"]*)"/g)) assert.match(classes, /\bdanger\b/, classes);
});

test('the arrange sheet has the view of the first level, rows or cards, and groups by aisle or none', () => {
  const [sheet = ''] = body.match(/<div id="arrange" class="sheet-layer"[\s\S]*?<div id="edit"/) ?? [];
  assert.match(sheet, /<div id="arrange-view">\s*<h2 class="sheet-title" data-i18n="arrange.view"><\/h2>\s*<div class="segmented">\s*<button class="segment" type="button" data-view="rows" data-i18n="arrange.rows"><\/button>\s*<button class="segment" type="button" data-view="cards" data-i18n="arrange.cards"><\/button>/);
  const groups = [...sheet.matchAll(/data-group="([^"]+)"/g)].map(([, group]) => group);
  assert.deepEqual(groups, ['aisle', 'none']);
});

test('the list sheet has a name field to rename and a field with Crear to create, both of 40 characters', () => {
  const [layer = ''] = body.match(/<div id="list-sheet" class="sheet-layer"[\s\S]*?<\/form>\s*<\/div>/) ?? [];
  assert.match(layer, /<div id="list-veil" class="sheet-veil">/);
  assert.match(layer, /<label id="list-rename" class="field"><input id="list-name"[^>]*maxlength="40"[^>]*><span class="field-label" data-i18n="lists.name"><\/span><\/label>/);
  assert.match(layer, /<div id="list-create" class="input-row pinned">\s*<input id="list-new"[^>]*maxlength="40"[^>]*>\s*<button id="list-submit" class="button primary" type="submit" data-i18n="lists.submit" disabled><\/button>/);
  assert.match(layer, /<p id="list-help" class="input-help danger" role="alert" hidden><\/p>/);
});

test('the edit sheet has the titled part Lista with a chip for each list, before Sección', () => {
  const [layer = ''] = body.match(/<div id="edit" class="sheet-layer"[\s\S]*?<\/form>\s*<\/div>/) ?? [];
  assert.match(layer, /<span class="field-label" data-i18n="edit.quantity"><\/span><\/label>\s*<h2 class="sheet-title part" data-i18n="edit.list"><\/h2>\s*<div id="edit-lists" class="cluster"><\/div>\s*<h2 class="sheet-title part" data-i18n="edit.aisle"><\/h2>/);
});

test('the What\'s new sheet has a veil, a dialog with its title and Close, and a body (VER-21)', () => {
  const [layer = ''] = body.match(/<div id="whatsnew-sheet" class="sheet-layer"[\s\S]*?<\/section>\s*<\/div>/) ?? [];
  assert.match(layer, /<div id="whatsnew-veil" class="sheet-veil">/);
  assert.match(layer, /<section id="whatsnew" class="sheet" role="dialog" aria-modal="true" aria-labelledby="whatsnew-title">/);
  assert.match(layer, /<h2 id="whatsnew-title" class="sheet-title main" data-i18n="whatsNew.title"><\/h2><button id="whatsnew-close" class="button tonal" type="button" data-i18n="whatsNew.close"><\/button>/);
  assert.match(layer, /<div id="whatsnew-body" class="sheet-body whatsnew-body"><\/div>/);
});

test('Help in Ajustes has the What\'s new row after the introduction, hidden until there are notes (VER-22)', () => {
  assert.match(settings, /<button id="show-onboarding"[^>]*>[\s\S]*?<\/button>\s*<button id="show-whatsnew" class="settings-row" type="button" hidden><span class="settings-row-label" data-i18n="settings.whatsNew"><\/span><span class="chevron" aria-hidden="true">›<\/span><\/button>/);
});
