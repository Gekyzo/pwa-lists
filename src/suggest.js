import { findByName, searchItems } from '#store';

// The rows above the add input: `create` first when no item has the typed name, then the items that
// match. The view reverses them so that `create` sits next to the input. Each item is in the list,
// so an add of one changes nothing.
export const MAX_ROWS = 6;

export const suggestionRows = (state, text) => {
  const name = String(text ?? '').trim();
  if (!name) return [];
  const create = findByName(state, name) ? [] : [{ kind: 'create' }];
  const items = searchItems(state, name, MAX_ROWS - create.length).map((item) => ({ kind: 'item', item }));
  return [...create, ...items];
};
