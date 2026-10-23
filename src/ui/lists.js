import * as lists from '#lists';
import { $, el, scroller, state, ui, t, apply, render } from '#ui/context';
import { endSearch } from '#ui/view';
import { iconButton } from '#ui/controls';
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

// A row of the first level: the name, the item count and a chevron. A slide to the left shows its
// actions; a hold lifts it for a move.
const listRow = (list) => {
  const { count } = lists.listSummary(state, list.id);
  const name = el('button', { type: 'button', className: 'item-row-name' }, [el('span', { className: 'item-row-label', textContent: list.name })]);
  const row = [
    name,
    el('span', { className: 'list-row-end' }, [
      el('span', { className: 'list-row-count', textContent: String(count) }),
      el('span', { className: 'chevron', textContent: '›', ariaHidden: 'true' }),
    ]),
  ];
  const { box, body } = swipeBox({ id: list.id, row, end: [deleteAction(list)], right: null, tap: () => openList(list.id) });
  const node = el('li', { className: 'item-row list-row' }, [box]);
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
  const node = el('li', {}, [button]);
  node.dataset.id = list.id;
  return node;
};

export const listNodes = () => lists.listsInOrder(state).map(state.view === 'cards' ? listCard : listRow);

export const bind = () => {
  $('back-button').addEventListener('click', closeList);
};
