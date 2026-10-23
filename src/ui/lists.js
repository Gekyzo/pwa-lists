import * as lists from '#lists';
import { HOLD_MS, DRAG_START, $, el, scroller, state, ui, t, apply, render, guardClick } from '#ui/context';
import { endSearch } from '#ui/view';
import { iconButton, bindField, flashSaved, clearSaved } from '#ui/controls';
import { swipeBox } from '#ui/rows';
import { bindReorder } from '#ui/drag';

// The first level of Listas: a row for each list. A tap opens the list.

export const openList = (id) => {
  Object.assign(ui, { list: id, openId: null, openSide: null });
  endSearch();
  render();
  scroller.scrollTop = 0;
};

// Back to the first level.
export const closeList = () => {
  Object.assign(ui, { list: null, openId: null, openSide: null });
  endSearch();
  render();
};

// Eliminar deletes the list with its items, with Deshacer (LVL-5). Its visible name is Eliminar; a
// screen reader also hears the name of the list.
const deleteAction = (list) => {
  const remove = () => apply(lists.deleteList(state, list.id), { undoText: t('toast.listDeleted', { name: list.name }) });
  const button = iconButton('trash', t('sheet.delete'), remove, { variant: 'danger', labelled: true });
  button.setAttribute('aria-label', t('row.delete', { name: list.name }));
  return button;
};

// Renombrar opens the list sheet on the list.
const renameAction = (list) => iconButton('edit', t('lists.rename'), () => openListSheet(list.id), { variant: 'neutral', labelled: true });

// A row of the first level: the name, the item count and a chevron. A slide to the left shows its
// actions; a hold lifts it for a move.
const listRow = (list) => {
  const { count } = lists.listSummary(state, list.id);
  const name = el('button', { type: 'button', className: 'item-row-name' }, [el('span', { className: 'item-row-label', textContent: list.name })]);
  const row = [
    name,
    el('span', { className: 'lists-row-end' }, [
      el('span', { className: 'lists-row-count', textContent: String(count) }),
      el('span', { className: 'chevron', textContent: '›', ariaHidden: 'true' }),
    ]),
  ];
  const { box, body } = swipeBox({ id: list.id, row, end: [renameAction(list), deleteAction(list)], right: null, tap: () => openList(list.id) });
  const node = el('li', { className: 'item-row lists-row' }, [box]);
  Object.assign(node.dataset, { id: list.id, kind: 'list', scope: 'lists' });
  bindReorder(body, node, list.id, null);
  return node;
};

// A card of the first level: the name, the item count and the first names of the list, muted. A tap
// opens the list. Cards have no move.
const listCard = (list) => {
  const { count, names } = lists.listSummary(state, list.id);
  const button = el('button', { type: 'button', className: 'list-card', onclick: () => openList(list.id) }, [
    el('span', { className: 'list-card-head' }, [
      el('span', { className: 'list-card-name', textContent: list.name }),
      el('span', { className: 'list-card-count', textContent: String(count) }),
    ]),
    ...names.map((name) => el('span', { className: 'list-card-item', textContent: name })),
  ]);
  bindHold(button, list.id);
  const node = el('li', {}, [button]);
  node.dataset.id = list.id;
  return node;
};

// A hold of a finger on a card, or a right click of the mouse, opens the list sheet on the list, with
// Renombrar and Eliminar. The click of the release does not open the list.
const bindHold = (card, id) => {
  let hold = null;
  const forget = () => {
    clearTimeout(hold?.timer);
    hold = null;
  };
  card.addEventListener('pointerdown', (event) => {
    forget();
    if (event.button !== 0 || event.pointerType === 'mouse') return;
    const timer = setTimeout(() => {
      hold = null;
      guardClick();
      navigator.vibrate?.(10);
      openListSheet(id);
    }, HOLD_MS);
    hold = { timer, x: event.clientX, y: event.clientY };
  });
  card.addEventListener('pointermove', (event) => {
    if (hold && Math.max(Math.abs(event.clientX - hold.x), Math.abs(event.clientY - hold.y)) >= DRAG_START) forget();
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) card.addEventListener(type, forget);
  card.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (event.pointerType === 'mouse') openListSheet(id);
  });
};

export const listNodes = () => lists.listsInOrder(state).map(state.view === 'cards' ? listCard : listRow);

// The list sheet: a name field and Crear for a new list (`{ id: null }`), or the name field, saved
// as a field of Editar, and Eliminar for a list (`{ id }`).
const sheetList = () => (ui.listSheet?.id ? lists.findList(state, ui.listSheet.id) : null);

// The text under the field of a new list that says why Crear did nothing. The next input clears it.
const setHelp = (text) => {
  $('list-help').textContent = text;
  $('list-help').hidden = !text;
  if (text) $('list-new').setAttribute('aria-invalid', 'true');
  else $('list-new').removeAttribute('aria-invalid');
};

export const openListSheet = (id = null) => {
  Object.assign(ui, { listSheet: { id }, openId: null, openSide: null });
  $('list-new').value = '';
  setHelp('');
  render();
  if (id === null) $('list-new').focus();
};

export const closeListSheet = () => {
  ui.listSheet = null;
  render();
};

export const renderListSheet = () => {
  // A list that went while its sheet was open (an undo, an import) closes the sheet.
  if (ui.listSheet?.id && !sheetList()) ui.listSheet = null;
  $('list-sheet').hidden = ui.listSheet === null;
  if (ui.listSheet === null) {
    clearSaved($('list-form'));
    return;
  }
  const list = sheetList();
  const title = list ? list.name : t('lists.create');
  $('list-title').textContent = title;
  $('list-form').setAttribute('aria-label', list ? t('lists.rename') : t('lists.create'));
  $('list-rename').hidden = !list;
  $('list-create').hidden = Boolean(list);
  $('list-form').querySelector('.sheet-foot').hidden = !list;
  if (list && document.activeElement !== $('list-name')) $('list-name').value = list.name;
  $('list-submit').disabled = !$('list-new').value.trim();
};

// Crear adds the list, closes the sheet and opens the list (LVL-19).
const submitList = () => {
  const result = lists.addList(state, $('list-new').value);
  if (result.error) {
    setHelp(t(result.error.key, result.error.params));
    $('list-new').focus();
    return;
  }
  ui.listSheet = null;
  if (apply(result)) openList(result.id);
};

// Eliminar of the foot deletes the list with its items, with Deshacer, and closes the sheet.
const deleteSheetList = () => {
  const list = sheetList();
  if (!list) return;
  if (apply(lists.deleteList(state, list.id), { undoText: t('toast.listDeleted', { name: list.name }) })) closeListSheet();
};

export const bind = () => {
  $('back-button').addEventListener('click', closeList);
  $('list-veil').addEventListener('click', closeListSheet);
  $('list-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!sheetList()) submitList();
  });
  $('list-new').addEventListener('input', () => {
    setHelp('');
    renderListSheet();
  });
  $('list-delete').addEventListener('click', deleteSheetList);
  bindField($('list-name'), {
    read: () => sheetList()?.name,
    write: (value) => apply(lists.renameList(state, ui.listSheet.id, value)),
    onSaved: () => flashSaved($('list-form')),
  });
};
