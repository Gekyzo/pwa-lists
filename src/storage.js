import { emptyState, compareNames, GROUPS, LIST_VIEWS, SORTS } from '#store';

export const STORAGE_KEY = 'lists.v1';
export const CORRUPT_KEY = `${STORAGE_KEY}.corrupt`;

// Versions 1 to 10 put an item in a list, `active` or `saved`, and mark a ticked one with `bought`.
// Versions 1 to 7 have a third list, `next`, and `again`, the mark of a ticked one-time item that
// comes back at the next trip. Version 11 has no list and no tick: each item is to buy, with its
// shops. Version 12 puts each item in one list of `lists`, a record that the user creates.
const LISTS = ['active', 'saved', 'next'];

const unique = (values) => new Set(values).size === values.length;

const lower = (text) => text.toLowerCase();

// `shops` only groups a view, so a bad entry is dropped and the item stays valid.
const normalizeShops = (shops) => {
  if (!Array.isArray(shops)) return [];
  const seen = new Set();
  return shops
    .filter((shop) => typeof shop === 'string')
    .map((shop) => shop.trim())
    .filter((shop) => {
      if (shop === '' || seen.has(lower(shop))) return false;
      seen.add(lower(shop));
      return true;
    });
};

// True when an old item is to buy: in `next`, or in `active` and not ticked. A ticked one-time item
// with `again` comes back; a ticked recurrent item of Bodega with `again` keeps its tick, as Bodega
// kept it. `recurrent` is a mark of Bodega that Stash drops.
const toBuy = ({ list = 'active', bought = false, again, recurrent }) =>
  list === 'next' || (list === 'active' && (!bought || (recurrent !== true && again === true)));

// The clean item, `false` for a valid item that is not to buy (saved or ticked), or null for an
// invalid one.
const normalizeItem = (item) => {
  if (typeof item !== 'object' || item === null) return null;
  const { id, name, list, bought, again, shops, quantity, aisle } = item;
  const valid =
    typeof id === 'string' &&
    id !== '' &&
    typeof name === 'string' &&
    name.trim() !== '' &&
    (list === undefined || LISTS.includes(list)) &&
    (bought === undefined || typeof bought === 'boolean') &&
    (again === undefined || typeof again === 'boolean');
  if (!valid) return null;
  if (!toBuy(item)) return false;
  return {
    id,
    name: name.trim(),
    shops: normalizeShops(shops),
    quantity: typeof quantity === 'string' ? quantity.trim() : '',
    aisle: typeof aisle === 'string' ? aisle.trim() : '',
  };
};

// `aisles` only groups a view, so a bad entry is dropped and the state stays valid. Versions 1 to 6
// have no aisles.
const normalizeAisles = (aisles) => {
  if (!Array.isArray(aisles)) return [];
  const seen = new Set();
  return aisles
    .filter((aisle) => typeof aisle === 'string')
    .map((aisle) => aisle.trim())
    .filter((aisle) => {
      if (aisle === '' || seen.has(lower(aisle))) return false;
      seen.add(lower(aisle));
      return true;
    });
};

// The aisle of an item takes the spelling of its entry in `aisles`; an aisle that is not there is
// cleared.
const knownAisles = (items, aisles) => {
  const spelling = new Map(aisles.map((aisle) => [lower(aisle), aisle]));
  return items.map((item) => ({ ...item, aisle: spelling.get(lower(item.aisle)) ?? '' }));
};

// Each shop gets the spelling of its first use, so that two spellings do not make two groups.
const oneSpelling = (items) => {
  const first = new Map();
  for (const item of items) for (const shop of item.shops) if (!first.has(lower(shop))) first.set(lower(shop), shop);
  return items.map((item) => ({ ...item, shops: item.shops.map((shop) => first.get(lower(shop))) }));
};

// Versions 1 and 2 have `grouped`, a boolean for the recipe grouping. Stash has no recipes and no
// shops, so the recipe and the shop grouping become the aisle grouping.
const groupOf = (data) => {
  if (GROUPS.includes(data.group)) return data.group;
  return data.grouped === false && data.group === undefined ? 'none' : 'aisle';
};

// The list of the items with no shop, when a state of version 11 or older becomes version 12.
const GENERAL = 'General';

// A version 11 item of each of its shops becomes one item in the list of that shop. The lists come in
// shop name order, then General for the items with no shop; a shop called General takes them. The
// ids follow from the data, so two reads of one stored state give the same ids: the first copy of an
// item keeps its id, the next ones get `<id>-2`, `<id>-3`.
const shopsToLists = (items) => {
  const names = oneSpelling(items).flatMap((item) => item.shops);
  const shops = [...new Map(names.map((name) => [lower(name), name])).values()].sort(compareNames);
  const homeless = items.some((item) => item.shops.length === 0);
  const general = shops.find((shop) => lower(shop) === lower(GENERAL));
  const listNames = homeless && !general ? [...shops, GENERAL] : shops;
  const lists = listNames.map((name, index) => ({ id: `list-${index + 1}`, name }));
  const idOf = (name) => lists.find((list) => lower(list.name) === lower(name)).id;
  const placed = items.flatMap(({ shops: own, ...item }) => {
    const homes = own.length ? own : [general ?? GENERAL];
    return homes.map((shop, index) => ({ ...item, id: index ? `${item.id}-${index + 1}` : item.id, list: idOf(shop) }));
  });
  return { lists, items: placed };
};

// The lists of a version 12 state, trimmed, or null when one is not valid: each has a text id and a
// name, and ids and names are unique with no case distinction.
const normalizeLists = (lists) => {
  if (!Array.isArray(lists) || lists.some((list) => typeof list !== 'object' || list === null)) return null;
  const clean = lists.map(({ id, name }) => ({ id, name: typeof name === 'string' ? name.trim() : '' }));
  const valid = clean.every(({ id, name }) => typeof id === 'string' && id !== '' && name !== '');
  return valid && unique(clean.map((list) => list.id)) && unique(clean.map((list) => lower(list.name))) ? clean : null;
};

// Versions 1 to 9 are the states of Bodega; version 10 is the first of Stash, version 11 the first
// with no saved and no ticked items, and version 12 the first with lists.
const VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// The items of the state, or null when one is not valid. Item ids are unique; item names are unique in
// one list, and before version 12 in the whole state.
const readItems = (data, lists) => {
  if (data.items.some((item) => typeof item !== 'object' || item === null)) return null;
  const scope = (item) => (lists ? `${item.list}\n` : '');
  const valid = unique(data.items.map((item) => item.id)) &&
    unique(data.items.map((item) => scope(item) + lower(String(item.name ?? '').trim())));
  // In version 12 `list` is the id of a list, not the list of a trip.
  const items = data.items.map((item) => normalizeItem(lists ? { ...item, list: undefined } : item));
  if (!valid || items.includes(null)) return null;
  if (!lists) return items.filter(Boolean);
  const ids = new Set(lists.map((list) => list.id));
  if (data.items.some((item) => !ids.has(item.list))) return null;
  return items.map((item, index) => item && (({ shops, ...rest }) => ({ ...rest, list: data.items[index].list }))(item)).filter(Boolean);
};

// Returns a clean version 12 state, or null when the data is not a known state. The recipes, the
// sent recipes and the menu of a Bodega state are dropped, and so are the saved and ticked items.
// The shops of an older state become lists.
const normalizeState = (data) => {
  if (typeof data !== 'object' || data === null || !VERSIONS.includes(data.version) || !Array.isArray(data.items)) return null;
  const own = data.version === 12 ? normalizeLists(data.lists) : null;
  if (data.version === 12 && !own) return null;
  const read = readItems(data, own);
  if (!read) return null;
  const { lists, items } = own ? { lists: own, items: read } : shopsToLists(oneSpelling(read));
  const aisles = normalizeAisles(data.aisles);
  return {
    version: 12,
    lists,
    items: knownAisles(items, aisles),
    group: groupOf(data),
    sort: SORTS.includes(data.sort) ? data.sort : 'custom',
    aisles,
    view: LIST_VIEWS.includes(data.view) ? data.view : 'rows',
    listSort: SORTS.includes(data.listSort) ? data.listSort : 'custom',
  };
};

const parse = (text) => {
  try {
    return { data: JSON.parse(text) };
  } catch {
    return { invalidJson: true };
  }
};

export const load = (storage) => {
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (text === null) return emptyState();
    const state = normalizeState(parse(text).data);
    if (state) return state;
    storage.setItem(CORRUPT_KEY, text);
  } catch {
    // Storage is not available: the app works in memory.
  }
  return emptyState();
};

export const save = (storage, state) => {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const exportJson = (state) => JSON.stringify(state, null, 2);

// Local time, to the second, so two exports of one day get two names.
export const exportFilename = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `stash-${day}-${time}.json`;
};

export const importJson = (text) => {
  const { data, invalidJson } = parse(text);
  if (invalidJson) return { error: { key: 'error.invalidJson' } };
  const state = normalizeState(data);
  return state ? { state } : { error: { key: 'error.notBackup' } };
};

// The language that the user chose. It is a preference of the device, not a part of the state.
export const LANGUAGE_KEY = 'lists.lang';

// The stored language when it is one of `supported`, else null: the app follows the phone.
export const loadLanguage = (storage, supported) => {
  try {
    const lang = storage.getItem(LANGUAGE_KEY);
    return supported.includes(lang) ? lang : null;
  } catch {
    return null;
  }
};

// `null` removes the choice.
export const saveLanguage = (storage, lang) => {
  try {
    if (lang === null) storage.removeItem(LANGUAGE_KEY);
    else storage.setItem(LANGUAGE_KEY, lang);
    return true;
  } catch {
    return false;
  }
};

// The hand that the user holds the phone with. It is a preference of the device, as the language is.
export const HAND_KEY = 'lists.hand';

// The stored hand when it is `left`, else `right`.
export const loadHand = (storage) => {
  try {
    return storage.getItem(HAND_KEY) === 'left' ? 'left' : 'right';
  } catch {
    return 'right';
  }
};

// `right` is the hand of an app with no choice: it removes the key.
export const saveHand = (storage, hand) => {
  try {
    if (hand === 'left') storage.setItem(HAND_KEY, 'left');
    else storage.removeItem(HAND_KEY);
    return true;
  } catch {
    return false;
  }
};

// Retired: the choice of the row of shop lists. No code reads it; Borrar todos los datos still
// removes a stored value.
export const SHOP_LISTS_KEY = 'lists.shopLists';

// The colours of the app: `light`, `dark`, or `system` to follow the phone. A preference of the
// device, as the hand is.
export const THEME_KEY = 'lists.theme';
const THEMES = ['light', 'dark'];

// The stored theme when it is `light` or `dark`, else `system`.
export const loadTheme = (storage) => {
  try {
    const theme = storage.getItem(THEME_KEY);
    return THEMES.includes(theme) ? theme : 'system';
  } catch {
    return 'system';
  }
};

// `system` is the theme of an app with no choice: it removes the key.
export const saveTheme = (storage, theme) => {
  try {
    if (THEMES.includes(theme)) storage.setItem(THEME_KEY, theme);
    else storage.removeItem(THEME_KEY);
    return true;
  } catch {
    return false;
  }
};

// The space of the rows: `compact` shows more rows on one screen, `normal` is the default. A
// preference of the device, as the hand is.
export const DENSITY_KEY = 'lists.density';

// The stored density when it is `compact`, else `normal`.
export const loadDensity = (storage) => {
  try {
    return storage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'normal';
  } catch {
    return 'normal';
  }
};

// `normal` is the density of an app with no choice: it removes the key.
export const saveDensity = (storage, density) => {
  try {
    if (density === 'compact') storage.setItem(DENSITY_KEY, density);
    else storage.removeItem(DENSITY_KEY);
    return true;
  } catch {
    return false;
  }
};

// Set after the walkthrough of the first start closed. It is a preference of the device, as the
// hand is.
export const ONBOARDED_KEY = 'lists.onboarded';

// A storage that cannot be read counts as seen, so the walkthrough does not show at each start.
export const loadOnboarded = (storage) => {
  try {
    return storage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return true;
  }
};

export const saveOnboarded = (storage) => {
  try {
    storage.setItem(ONBOARDED_KEY, '1');
    return true;
  } catch {
    return false;
  }
};

// True when the storage holds a state, valid or not: the install is not new.
export const hasStoredState = (storage) => {
  try {
    return storage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

// Set after Compra showed the slide of a row one time (ROW-14). A preference of the device, as the
// hand is.
export const SWIPE_HINT_KEY = 'lists.swipeHint';

// A storage that cannot be read counts as not shown: the app cannot save it either, so the hint
// plays at each start.
export const loadSwipeHint = (storage) => {
  try {
    return storage.getItem(SWIPE_HINT_KEY) === '1';
  } catch {
    return false;
  }
};

export const saveSwipeHint = (storage) => {
  try {
    storage.setItem(SWIPE_HINT_KEY, '1');
    return true;
  } catch {
    return false;
  }
};

// The newest version whose release notes the user has seen (VER-20). A preference of the device, as
// the hand is.
export const SEEN_VERSION_KEY = 'lists.seen-version';

// Null when nothing is stored or the storage cannot be read: no notes show.
export const loadSeen = (storage) => {
  try {
    return storage.getItem(SEEN_VERSION_KEY);
  } catch {
    return null;
  }
};

export const saveSeen = (storage, version) => {
  try {
    storage.setItem(SEEN_VERSION_KEY, version);
    return true;
  } catch {
    return false;
  }
};

// Every key that the app writes to the storage: the state, its corrupt copy and each preference of the
// device. Borrar todos los datos removes them all (BACKUP-7).
export const APP_KEYS = [
  STORAGE_KEY,
  CORRUPT_KEY,
  LANGUAGE_KEY,
  HAND_KEY,
  SHOP_LISTS_KEY,
  THEME_KEY,
  DENSITY_KEY,
  ONBOARDED_KEY,
  SWIPE_HINT_KEY,
  SEEN_VERSION_KEY,
];

// After it, the install counts as new: the next start shows the walkthrough.
export const resetAll = (storage) => {
  try {
    APP_KEYS.forEach((key) => storage.removeItem(key));
    return true;
  } catch {
    return false;
  }
};
