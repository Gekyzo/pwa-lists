// The layers that open over a section: a sheet, an open row, the search of a list, the open list
// over the first level of Listas. `view` is the state of the screen (`ui` of src/ui/context.js).

// True while a sheet is open. One sheet is open at a time.
export const sheetOpen = (view) =>
  view.sheetOpen || view.arrangeOpen || view.aislesOpen || view.editId !== null || view.listSheet !== null;

// The layer that `Escape` and the back of the phone close first: an open sheet, then an open row,
// then the search of a list, then the list itself, back to the first level. Null when nothing is open.
export const closeTop = (view) => {
  if (sheetOpen(view)) return 'sheet';
  if (view.openId !== null) return 'row';
  if (view.searchOpen) return 'search';
  return view.view === 'active' && view.list !== null ? 'list' : null;
};
