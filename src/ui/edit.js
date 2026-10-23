import * as store from '#store';
import * as lists from '#lists';
import * as aisles from '#aisles';
import { $, el, state, ui, t, apply, render } from '#ui/context';
import { bindField, flashSaved, applySaved, clearSaved } from '#ui/controls';

export const openEdit = (item) => {
  Object.assign(ui, { editId: item.id, openId: null });
  $('edit-name').value = item.name;
  $('edit-quantity').value = item.quantity;
  render();
};

export const closeEdit = () => {
  ui.editId = null;
  render();
};

// The edit sheet of one item: its name, its quantity, its list and its aisle.
export const renderEdit = () => {
  const item = state.items.find((entry) => entry.id === ui.editId);
  $('edit').hidden = !item;
  if (!item) {
    clearSaved($('edit-form'));
    return;
  }
  $('edit-title').textContent = item.name;
  $('edit-form').setAttribute('aria-label', t('edit.title'));
  if (document.activeElement !== $('edit-name')) $('edit-name').value = item.name;
  if (document.activeElement !== $('edit-quantity')) $('edit-quantity').value = item.quantity;
  renderListChips(item);
  renderAisleChips(item);
};

// A tap on the chip of another list moves the item there (LVL-10). The sheet stays open; the row
// leaves the list in view.
const pickList = (id) => {
  const item = state.items.find((entry) => entry.id === ui.editId);
  if (item) applySaved($('edit-form'), lists.moveItem(state, item.id, id));
};

// One chip for each list, in the order of the first level, the list of the item pressed. The chips
// stay when the lists do not change, as the aisle chips do.
const renderListChips = (item) => {
  const box = $('edit-lists');
  const order = lists.listsInOrder(state);
  const key = order.map((list) => `${list.id}\t${list.name}`).join('\n');
  if (box.dataset.key !== key) {
    box.dataset.key = key;
    box.replaceChildren(...order.map((list) => {
      const chip = el('button', { type: 'button', className: 'chip', textContent: list.name, onclick: () => pickList(list.id) });
      chip.dataset.id = list.id;
      return chip;
    }));
  }
  for (const chip of box.children) chip.setAttribute('aria-pressed', String(chip.dataset.id === item.list));
};

// A tap on the chip of the aisle of the item clears it; a tap on another chip sets that aisle.
const pickAisle = (aisle) => {
  const item = state.items.find((entry) => entry.id === ui.editId);
  if (item) applySaved($('edit-form'), aisles.setItemAisle(state, item.id, item.aisle === aisle ? '' : aisle));
};

// One chip for each aisle, in the order of the walk. The chips stay when the aisles do not change:
// the blur of the name field renders between the press and the click of a chip, and a new chip would
// lose that click.
const renderAisleChips = (item) => {
  const box = $('edit-aisles');
  if ([...box.children].map((chip) => chip.textContent).join('\n') !== state.aisles.join('\n')) {
    box.replaceChildren(...state.aisles.map((aisle) => el('button', { type: 'button', className: 'chip', textContent: aisle, onclick: () => pickAisle(aisle) })));
  }
  for (const chip of box.children) chip.setAttribute('aria-pressed', String(chip.textContent === item.aisle));
  $('edit-aisles-empty').hidden = state.aisles.length > 0;
};

const editItem = () => state.items.find((entry) => entry.id === ui.editId);

// Eliminar of the foot deletes the item, with Deshacer, and closes the sheet.
const deleteItem = () => {
  const item = editItem();
  if (!item) return;
  // The render of the delete closes the sheet: its item is gone.
  if (apply(store.deleteItem(state, item.id), { undoText: t('toast.deleted', { name: item.name }) })) ui.editId = null;
};

export const bind = () => {
  $('edit-veil').addEventListener('click', closeEdit);
  $('edit-form').addEventListener('submit', (event) => event.preventDefault());
  $('edit-delete').addEventListener('click', deleteItem);
  const onSaved = () => flashSaved($('edit-form'));
  bindField($('edit-name'), { read: () => editItem()?.name, write: (value) => apply(store.renameItem(state, ui.editId, value)), onSaved });
  bindField($('edit-quantity'), { read: () => editItem()?.quantity, write: (value) => apply(store.setQuantity(state, ui.editId, value)), onSaved });
};
